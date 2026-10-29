using System;
using System.Collections.Generic;

namespace FateCovenant.Battle
{
    public sealed class BattleSimulator
    {
        // Project-defined prototype balance, not a recovered original-game formula.
        private const float AttackScale = 2.6f;
        private const float DefenseScale = 0.5f;
        private const int MaximumRounds = 15;
        private const int MaximumTriggerDepth = 5;
        private readonly List<Combatant> combatants = new List<Combatant>();
        private readonly List<BattleEvent> events = new List<BattleEvent>();
        private readonly HashSet<string> consumedTriggers = new HashSet<string>(StringComparer.Ordinal);
        private readonly int seed;
        private DeterministicRandom random;
        private int round;
        private int totalDamage;
        private int triggerDepth;

        public BattleSimulator(
            IList<CharacterDefinition> allies,
            IList<CharacterDefinition> enemies,
            int seed)
        {
            if (allies == null || allies.Count == 0) throw new ArgumentException("At least one ally is required.", "allies");
            if (enemies == null || enemies.Count == 0) throw new ArgumentException("At least one enemy is required.", "enemies");

            ValidateTeam(allies, "allies");
            ValidateTeam(enemies, "enemies");
            this.seed = seed;
            for (int index = 0; index < allies.Count; index++)
                combatants.Add(new Combatant(allies[index], TeamSide.Ally, index));
            for (int index = 0; index < enemies.Count; index++)
                combatants.Add(new Combatant(enemies[index], TeamSide.Enemy, index));
        }

        public BattleResult Run()
        {
            events.Clear();
            consumedTriggers.Clear();
            random = new DeterministicRandom(seed);
            for (int index = 0; index < combatants.Count; index++) combatants[index].Reset();
            round = 0;
            totalDamage = 0;
            triggerDepth = 0;
            AddEvent(BattleEventType.BattleStarted, null, null, 0, 0, false, false, "Deterministic battle started");
            ProcessTriggers(BattleTriggerType.BattleStarted, null);

            int outcome = CheckOutcome();
            while (outcome == 0 && round < MaximumRounds)
            {
                round++;
                AddEvent(BattleEventType.RoundStarted, null, null, 0, 0, false, false, "Round " + round);
                ProcessTriggers(BattleTriggerType.RoundStarted, null);
                outcome = CheckOutcome();

                List<Combatant> order = BuildActionOrder();
                for (int index = 0; index < order.Count && outcome == 0; index++)
                {
                    Combatant actor = order[index];
                    if (!actor.IsAlive) continue;
                    AddEvent(BattleEventType.TurnStarted, actor, actor, 0, actor.Hp, false, false, "TurnStarted");
                    ProcessTriggers(BattleTriggerType.TurnStarted, actor);
                    if (!actor.IsAlive) continue;
                    if (actor.IsStunned)
                    {
                        AddEvent(BattleEventType.StatusChanged, actor, actor, 0, actor.Hp, false, false, "Stunned");
                        ProcessTriggers(BattleTriggerType.ActionEnded, actor);
                        outcome = CheckOutcome();
                        continue;
                    }

                    TakeAction(actor);
                    ProcessTriggers(BattleTriggerType.ActionEnded, actor);
                    outcome = CheckOutcome();
                }

                if (outcome == 0)
                {
                    TickStatuses();
                    outcome = CheckOutcome();
                }
            }

            if (outcome == 0)
            {
                outcome = CompareRemainingHealth();
                AddEvent(BattleEventType.StatusChanged, null, null, 0, 0, false, false, "Round limit reached");
            }

            bool victory = outcome > 0;
            AddEvent(
                BattleEventType.BattleEnded,
                null,
                null,
                0,
                0,
                false,
                false,
                victory ? "AllyVictory" : "EnemyVictory");

            return new BattleResult(
                victory,
                round,
                new List<BattleEvent>(events),
                CountAlive(TeamSide.Ally),
                CountAlive(TeamSide.Enemy),
                totalDamage);
        }

        private void TakeAction(Combatant actor)
        {
            bool useUltimate = actor.Rage >= 100 && actor.Definition.UltimateSkill != null && !actor.IsSilenced;
            SkillDefinition skill = useUltimate ? actor.Definition.UltimateSkill : actor.Definition.BasicSkill;
            if (skill == null) return;

            bool legacySkill = string.Equals(skill.Source, "legacy", StringComparison.Ordinal);
            bool castAsSkill = useUltimate || skill.Category != SkillCategory.Normal;
            AddEvent(
                BattleEventType.ActionStarted,
                actor,
                null,
                0,
                actor.Hp,
                false,
                castAsSkill,
                skill.Id,
                0,
                skill.Id);

            float multiplier = 1f;
            if (useUltimate && legacySkill && actor.WarStacks >= 3)
            {
                multiplier = 1.5f;
                actor.WarStacks = 0;
                AddEvent(
                    BattleEventType.StatusChanged,
                    actor,
                    actor,
                    0,
                    actor.Hp,
                    false,
                    true,
                    "WarIntentConsumed",
                    0,
                    skill.Id,
                    string.Empty,
                    BattleTriggerType.UltimateCast);
            }

            if (useUltimate)
            {
                actor.Rage = 0;
                actor.UltimateCasts++;
            }
            else
            {
                actor.Rage = Math.Min(100, actor.Rage + 25);
                actor.NormalCasts++;
            }

            ResolveActions(actor, skill, skill.Actions, castAsSkill, multiplier, null, false);
            if (!useUltimate && legacySkill && skill.Actions.Count > 0)
            {
                actor.WarStacks = Math.Min(3, actor.WarStacks + 1);
                AddEvent(
                    BattleEventType.StatusChanged,
                    actor,
                    actor,
                    0,
                    actor.Hp,
                    false,
                    false,
                    "WarIntent=" + actor.WarStacks,
                    0,
                    skill.Id);
            }

            if (useUltimate)
                ProcessTriggers(BattleTriggerType.UltimateCast, actor);
            else
                ProcessTriggers(BattleTriggerType.NormalSkillCast, actor);
        }

        private void ResolveActions(
            Combatant actor,
            SkillDefinition skill,
            IList<SkillActionDefinition> actions,
            bool castAsSkill,
            float multiplier,
            BattleTriggerType? trigger,
            bool triggered)
        {
            for (int actionIndex = 0; actionIndex < actions.Count; actionIndex++)
            {
                if (!actor.IsAlive) return;
                SkillActionDefinition action = actions[actionIndex];
                List<Combatant> targets = SelectTargets(actor, action.Targeting);
                for (int targetIndex = 0; targetIndex < targets.Count; targetIndex++)
                {
                    Combatant target = targets[targetIndex];
                    if (!target.IsAlive && action.Type != SkillActionType.Heal
                        && action.Type != SkillActionType.Shield && action.Type != SkillActionType.ApplyStatus)
                        continue;
                    ResolveAction(actor, target, skill, action, castAsSkill, multiplier, trigger, triggered);
                }
            }
        }

        private void ResolveAction(
            Combatant actor,
            Combatant target,
            SkillDefinition skill,
            SkillActionDefinition action,
            bool castAsSkill,
            float multiplier,
            BattleTriggerType? trigger,
            bool triggered)
        {
            if (action.Chance < 1f && random.NextDouble() >= action.Chance)
            {
                AddEvent(
                    BattleEventType.StatusChanged,
                    actor,
                    target,
                    0,
                    target.Hp,
                    false,
                    castAsSkill,
                    "ChanceFailed=" + Math.Round(action.Chance * 100f),
                    0,
                    skill.Id,
                    string.Empty,
                    trigger,
                    triggered);
                return;
            }
            if (action.Type == SkillActionType.Damage || action.Type == SkillActionType.TrueDamage)
            {
                for (int hit = 0; hit < action.HitCount && target.IsAlive && actor.IsAlive; hit++)
                {
                    ResolveDamage(
                        actor,
                        target,
                        skill,
                        action,
                        castAsSkill,
                        multiplier,
                        trigger,
                        triggered,
                        action.Type == SkillActionType.TrueDamage);
                }
                return;
            }
            if (action.Type == SkillActionType.Heal)
            {
                ResolveHeal(actor, target, skill, action, castAsSkill, trigger, triggered);
                return;
            }
            if (action.Type == SkillActionType.Shield)
            {
                ResolveShield(actor, target, skill, action, castAsSkill, trigger, triggered);
                return;
            }
            if (action.Type == SkillActionType.ApplyStatus)
            {
                if (!target.IsAlive) return;
                if (Combatant.IsHarmful(action.Status))
                {
                    float chance = 1f + actor.SumMagnitude(StatusKind.ControlAccuracyUp)
                        - target.SumMagnitude(StatusKind.ControlResistanceUp);
                    chance = Math.Max(0f, Math.Min(1f, chance));
                    if (random.NextDouble() >= chance)
                    {
                        AddEvent(
                            BattleEventType.StatusChanged,
                            actor,
                            target,
                            0,
                            target.Hp,
                            false,
                            castAsSkill,
                            "Resisted:" + action.Status,
                            0,
                            skill.Id,
                            string.Empty,
                            trigger,
                            triggered);
                        return;
                    }
                }
                string statusId = skill.Id + ":" + action.Status.ToString();
                int hpBefore = target.Hp;
                int maximumHpBefore = target.MaxHp;
                CombatStatus status = new CombatStatus(
                    statusId,
                    action.Status,
                    action.Duration,
                    action.Magnitude,
                    action.Stacks,
                    skill.Id);
                target.AddOrRefreshStatus(status);
                if (action.Status == StatusKind.MaxHpUp)
                {
                    int maximumHpIncrease = target.MaxHp - maximumHpBefore;
                    target.Hp = Math.Max(1, Math.Min(target.MaxHp, hpBefore + maximumHpIncrease));
                }
                AddEvent(
                    BattleEventType.StatusChanged,
                    actor,
                    target,
                    status.RemainingTurns,
                    target.Hp,
                    false,
                    castAsSkill,
                    "Applied:" + action.Status,
                    (int)Math.Round(action.Magnitude * 100f),
                    skill.Id,
                    statusId,
                    trigger,
                    triggered);
                return;
            }
            if (action.Type == SkillActionType.Cleanse || action.Type == SkillActionType.Dispel)
            {
                if (!target.IsAlive) return;
                List<CombatStatus> removed = new List<CombatStatus>();
                if (action.Type == SkillActionType.Cleanse) target.RemoveHarmfulStatuses(removed);
                else target.RemoveBeneficialStatuses(removed);
                AddEvent(
                    action.Type == SkillActionType.Cleanse ? BattleEventType.Cleansed : BattleEventType.Dispelled,
                    actor,
                    target,
                    removed.Count,
                    target.Hp,
                    false,
                    castAsSkill,
                    (action.Type == SkillActionType.Cleanse ? "Cleansed=" : "Dispelled=") + removed.Count,
                    0,
                    skill.Id,
                    string.Empty,
                    trigger,
                    triggered);
                return;
            }
            if (action.Type == SkillActionType.RestoreRage || action.Type == SkillActionType.ReduceRage)
            {
                if (!target.IsAlive) return;
                int before = target.Rage;
                if (action.Type == SkillActionType.RestoreRage)
                    target.Rage = Math.Min(100, target.Rage + Math.Max(0, action.Amount));
                else
                    target.Rage = Math.Max(0, target.Rage - Math.Max(0, action.Amount));
                AddEvent(
                    BattleEventType.RageChanged,
                    actor,
                    target,
                    target.Rage - before,
                    target.Hp,
                    false,
                    castAsSkill,
                    action.Type.ToString(),
                    0,
                    skill.Id,
                    string.Empty,
                    trigger,
                    triggered);
            }
        }

        private void ResolveDamage(
            Combatant actor,
            Combatant target,
            SkillDefinition skill,
            SkillActionDefinition action,
            bool castAsSkill,
            float multiplier,
            BattleTriggerType? trigger,
            bool triggered,
            bool trueDamage)
        {
            float hitChance = 100f + actor.SumMagnitude(StatusKind.AccuracyUp) * 100f
                - target.SumMagnitude(StatusKind.EvasionUp) * 100f;
            if (hitChance < 0f) hitChance = 0f;
            if (hitChance > 100f) hitChance = 100f;
            bool missed = !trueDamage && hitChance < 100f
                && (hitChance <= 0f || random.NextInt(100) >= (int)Math.Round(hitChance));
            if (missed)
            {
                AddEvent(
                    BattleEventType.Damage,
                    actor,
                    target,
                    0,
                    target.Hp,
                    false,
                    castAsSkill,
                    "Miss",
                    0,
                    skill.Id,
                    string.Empty,
                    trigger,
                    triggered);
                return;
            }

            float variance = trueDamage ? 1f : 0.95f + (float)random.NextDouble() * 0.10f;
            int criticalChance = 10 + (int)Math.Round(actor.SumMagnitude(StatusKind.CritRateUp) * 100f)
                - (int)Math.Round(target.SumMagnitude(StatusKind.CritResistanceUp) * 100f);
            if (criticalChance < 0) criticalChance = 0;
            if (criticalChance > 100) criticalChance = 100;
            bool critical = !trueDamage && random.NextInt(100) < criticalChance;
            float criticalMultiplier = critical
                ? Math.Max(1.1f, 1.5f + actor.SumMagnitude(StatusKind.CritDamageUp)
                    - actor.SumMagnitude(StatusKind.CritDamageDown))
                : 1f;
            float dealtMultiplier = 1f + actor.SumMagnitude(StatusKind.DamageDealtUp);
            float receivedMultiplier = Math.Max(
                0.05f,
                1f - target.SumMagnitude(StatusKind.DamageTakenDown) + target.SumMagnitude(StatusKind.DamageTakenUp));
            float ignoredDefense = Math.Min(1f, actor.SumMagnitude(StatusKind.DefenseIgnoreUp));
            float effectiveDefense = trueDamage ? 0f : target.EffectiveDefense * (1f - ignoredDefense);
            int baseDamage = Math.Max(
                1,
                (int)Math.Round(actor.EffectiveAttack * AttackScale) - (int)(effectiveDefense * DefenseScale));
            int amount = Math.Max(
                1,
                (int)Math.Round(baseDamage * action.Power * multiplier * variance * criticalMultiplier
                    * dealtMultiplier * receivedMultiplier));

            int absorbed = Math.Min(target.Shield, amount);
            target.Shield -= absorbed;
            int hpDamage = amount - absorbed;
            if (hpDamage > 0)
            {
                target.Hp = Math.Max(0, target.Hp - hpDamage);
                totalDamage += hpDamage;
            }

            AddEvent(
                BattleEventType.Damage,
                actor,
                target,
                amount,
                target.Hp,
                critical,
                castAsSkill,
                absorbed > 0 ? "ShieldAbsorb=" + absorbed : (trueDamage ? "TrueDamage" : string.Empty),
                absorbed,
                skill.Id,
                string.Empty,
                trigger,
                triggered);

            float lifeSteal = actor.SumMagnitude(StatusKind.LifeStealUp);
            if (lifeSteal > 0f && hpDamage > 0 && actor.IsAlive)
            {
                int before = actor.Hp;
                actor.Hp = Math.Min(actor.MaxHp, actor.Hp + Math.Max(1, (int)Math.Round(hpDamage * lifeSteal)));
                AddEvent(
                    BattleEventType.Heal,
                    actor,
                    actor,
                    actor.Hp - before,
                    actor.Hp,
                    false,
                    castAsSkill,
                    "LifeSteal",
                    0,
                    skill.Id,
                    string.Empty,
                    trigger,
                    triggered);
            }

            float reflection = target.SumMagnitude(StatusKind.ReflectUp);
            if (reflection > 0f && hpDamage > 0 && actor.IsAlive)
            {
                int reflected = Math.Max(1, (int)Math.Round(hpDamage * reflection));
                ApplyReflectedDamage(target, actor, skill, reflected, castAsSkill);
            }

            if (target.IsAlive) ProcessTriggers(BattleTriggerType.DamageTaken, target);
            else HandleDeath(target);
        }

        private void ApplyReflectedDamage(
            Combatant reflector,
            Combatant victim,
            SkillDefinition skill,
            int amount,
            bool castAsSkill)
        {
            int absorbed = Math.Min(victim.Shield, amount);
            victim.Shield -= absorbed;
            int hpDamage = amount - absorbed;
            if (hpDamage > 0)
            {
                victim.Hp = Math.Max(0, victim.Hp - hpDamage);
                totalDamage += hpDamage;
            }
            AddEvent(
                BattleEventType.Damage,
                reflector,
                victim,
                amount,
                victim.Hp,
                false,
                castAsSkill,
                absorbed > 0 ? "Reflect;ShieldAbsorb=" + absorbed : "Reflect",
                absorbed,
                skill.Id);
            if (victim.IsAlive) ProcessTriggers(BattleTriggerType.DamageTaken, victim);
            else HandleDeath(victim);
        }

        private void ResolveHeal(
            Combatant actor,
            Combatant target,
            SkillDefinition skill,
            SkillActionDefinition action,
            bool castAsSkill,
            BattleTriggerType? trigger,
            bool triggered)
        {
            if (!target.IsAlive) return;
            float healingMultiplier = 1f + target.SumMagnitude(StatusKind.HealingReceivedUp);
            int amount = Math.Max(1, (int)Math.Round(actor.EffectiveAttack * action.Power * healingMultiplier));
            int before = target.Hp;
            target.Hp = Math.Min(target.MaxHp, target.Hp + amount);
            AddEvent(
                BattleEventType.Heal,
                actor,
                target,
                target.Hp - before,
                target.Hp,
                false,
                castAsSkill,
                skill.Id,
                0,
                skill.Id,
                string.Empty,
                trigger,
                triggered);
        }

        private void ResolveShield(
            Combatant actor,
            Combatant target,
            SkillDefinition skill,
            SkillActionDefinition action,
            bool castAsSkill,
            BattleTriggerType? trigger,
            bool triggered)
        {
            if (!target.IsAlive) return;
            int amount = Math.Max(1, (int)Math.Round(actor.EffectiveAttack * action.Power));
            target.Shield = Math.Max(target.Shield, amount);
            AddEvent(
                BattleEventType.Shield,
                actor,
                target,
                amount,
                target.Hp,
                false,
                castAsSkill,
                skill.Id + ";Shield=" + target.Shield,
                0,
                skill.Id,
                string.Empty,
                trigger,
                triggered);
        }

        private void ProcessTriggers(BattleTriggerType trigger, Combatant source)
        {
            if (triggerDepth >= MaximumTriggerDepth) return;
            List<Combatant> owners = TriggerOwners(trigger, source);
            triggerDepth++;
            try
            {
                for (int ownerIndex = 0; ownerIndex < owners.Count; ownerIndex++)
                {
                    Combatant owner = owners[ownerIndex];
                    if (!owner.IsAlive) continue;
                    for (int skillIndex = 0; skillIndex < owner.Definition.Skills.Count; skillIndex++)
                    {
                        SkillDefinition skill = owner.Definition.Skills[skillIndex];
                        for (int triggerIndex = 0; triggerIndex < skill.Triggers.Count; triggerIndex++)
                        {
                            SkillTriggerDefinition definition = skill.Triggers[triggerIndex];
                            if (definition.Trigger != trigger || definition.Actions.Count == 0) continue;
                            string key = owner.InstanceId + "|" + skill.Id + "|" + definition.Trigger;
                            if (definition.Once && consumedTriggers.Contains(key)) continue;
                            if (definition.Once) consumedTriggers.Add(key);
                            ResolveActions(owner, skill, definition.Actions, true, 1f, trigger, true);
                            if (!owner.IsAlive) break;
                        }
                    }
                }
            }
            finally
            {
                triggerDepth--;
            }
        }

        private List<Combatant> TriggerOwners(BattleTriggerType trigger, Combatant source)
        {
            List<Combatant> result = new List<Combatant>();
            if (trigger == BattleTriggerType.DamageTaken)
            {
                if (source != null && source.IsAlive) result.Add(source);
                return result;
            }
            if (trigger == BattleTriggerType.TurnStarted)
            {
                if (source != null && source.IsAlive) result.Add(source);
                return result;
            }
            if ((trigger == BattleTriggerType.NormalSkillCast || trigger == BattleTriggerType.UltimateCast
                || trigger == BattleTriggerType.ActionEnded) && source != null)
            {
                return AliveOf(source.Side);
            }
            return AliveOf(TeamSide.Ally, TeamSide.Enemy);
        }

        private void TickStatuses()
        {
            for (int unitIndex = 0; unitIndex < combatants.Count; unitIndex++)
            {
                Combatant unit = combatants[unitIndex];
                if (!unit.IsAlive) continue;
                IList<CombatStatus> statuses = unit.Statuses;
                for (int statusIndex = 0; statusIndex < statuses.Count && unit.IsAlive; statusIndex++)
                {
                    CombatStatus status = statuses[statusIndex];
                    if (status.Kind == StatusKind.DamageOverTime)
                    {
                        int amount = Math.Max(1, (int)Math.Round(unit.MaxHp * status.Magnitude * status.Stacks));
                        int beforeHp = unit.Hp;
                        unit.Hp = Math.Max(0, unit.Hp - amount);
                        totalDamage += beforeHp - unit.Hp;
                        AddEvent(
                            BattleEventType.StatusTicked,
                            unit,
                            unit,
                            amount,
                            unit.Hp,
                            false,
                            false,
                            "DamageOverTime",
                            0,
                            status.SourceSkillId,
                            status.Id);
                        if (unit.IsAlive) ProcessTriggers(BattleTriggerType.DamageTaken, unit);
                        else HandleDeath(unit);
                    }
                    else if (status.Kind == StatusKind.HealOverTime)
                    {
                        int before = unit.Hp;
                        int amount = Math.Max(1, (int)Math.Round(unit.MaxHp * status.Magnitude * status.Stacks));
                        unit.Hp = Math.Min(unit.MaxHp, unit.Hp + amount);
                        AddEvent(
                            BattleEventType.StatusTicked,
                            unit,
                            unit,
                            unit.Hp - before,
                            unit.Hp,
                            false,
                            false,
                            "HealOverTime",
                            0,
                            status.SourceSkillId,
                            status.Id);
                    }
                }

                statuses = unit.Statuses;
                for (int statusIndex = statuses.Count - 1; statusIndex >= 0; statusIndex--)
                {
                    CombatStatus status = statuses[statusIndex];
                    if (status.RemainingTurns == 0) continue;
                    status.RemainingTurns--;
                    if (status.RemainingTurns > 0) continue;
                    AddEvent(
                        BattleEventType.StatusExpired,
                        unit,
                        unit,
                        0,
                        unit.Hp,
                        false,
                        false,
                        "Expired:" + status.Kind,
                        0,
                        status.SourceSkillId,
                        status.Id);
                    int maximumHpBefore = unit.MaxHp;
                    unit.RemoveStatus(status);
                    if (unit.MaxHp < maximumHpBefore) unit.Hp = Math.Min(unit.Hp, unit.MaxHp);
                }
            }
        }

        private void HandleDeath(Combatant dead)
        {
            AddEvent(BattleEventType.UnitDied, dead, dead, 0, 0, false, false, "KnockedOut");
            ProcessTriggers(BattleTriggerType.UnitDied, dead);
        }

        private List<Combatant> SelectTargets(Combatant actor, SkillTargeting targeting)
        {
            if (targeting == SkillTargeting.Self)
                return new List<Combatant> { actor };
            if (targeting == SkillTargeting.AllAllies)
                return AliveOf(actor.Side);

            TeamSide opposite = actor.Side == TeamSide.Ally ? TeamSide.Enemy : TeamSide.Ally;
            if (targeting == SkillTargeting.AllEnemies)
                return AliveOf(opposite);

            List<Combatant> candidates = AliveOf(targeting == SkillTargeting.LowestHpAlly ? actor.Side : opposite);
            if (targeting == SkillTargeting.AllFrontEnemies || targeting == SkillTargeting.AllBackEnemies)
            {
                List<Combatant> row = new List<Combatant>();
                for (int index = 0; index < candidates.Count; index++)
                {
                    bool front = candidates[index].Slot == 0;
                    if ((targeting == SkillTargeting.AllFrontEnemies && front)
                        || (targeting == SkillTargeting.AllBackEnemies && !front)) row.Add(candidates[index]);
                }
                if (row.Count == 0 && candidates.Count > 0) row.Add(candidates[0]);
                return row;
            }
            if (targeting == SkillTargeting.RandomEnemy && candidates.Count > 0)
                return new List<Combatant> { candidates[random.NextInt(candidates.Count)] };
            if (targeting == SkillTargeting.HighestAttackEnemy)
                return new List<Combatant> { HighestAttack(candidates) };

            Combatant selected = null;
            for (int index = 0; index < candidates.Count; index++)
            {
                Combatant candidate = candidates[index];
                if (selected == null || candidate.HpRatio < selected.HpRatio)
                    selected = candidate;
                else if (candidate.HpRatio == selected.HpRatio && candidate.Slot < selected.Slot)
                    selected = candidate;
            }
            List<Combatant> result = new List<Combatant>();
            if (selected != null) result.Add(selected);
            return result;
        }

        private static Combatant HighestAttack(List<Combatant> candidates)
        {
            Combatant selected = null;
            for (int index = 0; index < candidates.Count; index++)
            {
                Combatant candidate = candidates[index];
                if (selected == null || candidate.EffectiveAttack > selected.EffectiveAttack
                    || (candidate.EffectiveAttack == selected.EffectiveAttack && candidate.Slot < selected.Slot))
                    selected = candidate;
            }
            return selected;
        }

        private List<Combatant> BuildActionOrder()
        {
            List<Combatant> order = new List<Combatant>();
            for (int index = 0; index < combatants.Count; index++)
                if (combatants[index].IsAlive) order.Add(combatants[index]);
            order.Sort(CompareTurnOrder);
            return order;
        }

        private static int CompareTurnOrder(Combatant left, Combatant right)
        {
            int speedCompare = right.Definition.Speed.CompareTo(left.Definition.Speed);
            if (speedCompare != 0) return speedCompare;
            int sideCompare = left.Side.CompareTo(right.Side);
            if (sideCompare != 0) return sideCompare;
            return left.Slot.CompareTo(right.Slot);
        }

        private List<Combatant> AliveOf(TeamSide side)
        {
            List<Combatant> result = new List<Combatant>();
            for (int index = 0; index < combatants.Count; index++)
                if (combatants[index].Side == side && combatants[index].IsAlive) result.Add(combatants[index]);
            return result;
        }

        private List<Combatant> AliveOf(params TeamSide[] sides)
        {
            List<Combatant> result = new List<Combatant>();
            for (int index = 0; index < combatants.Count; index++)
            {
                Combatant combatant = combatants[index];
                if (!combatant.IsAlive) continue;
                for (int sideIndex = 0; sideIndex < sides.Length; sideIndex++)
                {
                    if (combatant.Side != sides[sideIndex]) continue;
                    result.Add(combatant);
                    break;
                }
            }
            return result;
        }

        private int CountAlive(TeamSide side)
        {
            return AliveOf(side).Count;
        }

        private int CheckOutcome()
        {
            if (CountAlive(TeamSide.Enemy) == 0) return 1;
            if (CountAlive(TeamSide.Ally) == 0) return -1;
            return 0;
        }

        private int CompareRemainingHealth()
        {
            float allyRatio = RemainingHealthRatio(TeamSide.Ally);
            float enemyRatio = RemainingHealthRatio(TeamSide.Enemy);
            return allyRatio >= enemyRatio ? 1 : -1;
        }

        private float RemainingHealthRatio(TeamSide side)
        {
            int current = 0;
            int maximum = 0;
            for (int index = 0; index < combatants.Count; index++)
            {
                Combatant unit = combatants[index];
                if (unit.Side != side) continue;
                current += unit.Hp;
                maximum += unit.MaxHp;
            }
            return maximum == 0 ? 0f : (float)current / maximum;
        }

        private void AddEvent(
            BattleEventType type,
            Combatant actor,
            Combatant target,
            int amount,
            int remainingHp,
            bool critical,
            bool skill,
            string note,
            int absorbed = 0,
            string skillId = "",
            string statusId = "",
            BattleTriggerType? trigger = null,
            bool triggered = false)
        {
            events.Add(new BattleEvent(
                type,
                round,
                actor == null ? string.Empty : actor.Definition.Id,
                target == null ? string.Empty : target.Definition.Id,
                amount,
                remainingHp,
                critical,
                skill,
                note,
                actor == null ? string.Empty : actor.InstanceId,
                target == null ? string.Empty : target.InstanceId,
                target == null ? 0 : target.Shield,
                actor == null ? 0 : actor.Rage,
                actor == null ? 0 : actor.WarStacks,
                absorbed,
                skillId,
                statusId,
                trigger,
                triggered));
        }

        private static void ValidateTeam(IList<CharacterDefinition> team, string parameterName)
        {
            HashSet<string> ids = new HashSet<string>(StringComparer.Ordinal);
            for (int index = 0; index < team.Count; index++)
            {
                CharacterDefinition definition = team[index];
                if (definition == null)
                    throw new ArgumentException("A team cannot contain a null character.", parameterName);
                if (string.IsNullOrWhiteSpace(definition.Id) || !ids.Add(definition.Id))
                    throw new ArgumentException("Character IDs must be nonempty and unique within each team.", parameterName);
                if (definition.MaxHp <= 0 || definition.Attack < 0 || definition.Defense < 0
                    || definition.MagicDefense < 0 || definition.Speed < 0)
                    throw new ArgumentException("Character health must be positive and combat stats nonnegative.", parameterName);
            }
        }

        private sealed class DeterministicRandom
        {
            private uint state;

            public DeterministicRandom(int seed)
            {
                state = (uint)seed;
                if (state == 0) state = 0x9e3779b9u;
            }

            public uint NextUInt()
            {
                uint value = state;
                value ^= value << 13;
                value ^= value >> 17;
                value ^= value << 5;
                state = value;
                return value;
            }

            public int NextInt(int exclusiveMaximum)
            {
                if (exclusiveMaximum <= 0) return 0;
                return (int)(NextUInt() % (uint)exclusiveMaximum);
            }

            public double NextDouble()
            {
                return (NextUInt() & 0x00ffffffu) / 16777216.0;
            }
        }
    }
}
