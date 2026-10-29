using System;
using System.Collections.Generic;

namespace FateCovenant.Battle
{
    public enum TeamSide
    {
        Ally = 0,
        Enemy = 1
    }

    public enum BattleEventType
    {
        BattleStarted,
        RoundStarted,
        TurnStarted,
        ActionStarted,
        Damage,
        Heal,
        Shield,
        StatusChanged,
        StatusTicked,
        StatusExpired,
        Cleansed,
        Dispelled,
        RageChanged,
        UnitDied,
        BattleEnded
    }

    public enum SkillTargeting
    {
        LowestHpEnemy,
        AllEnemies,
        AllFrontEnemies,
        AllBackEnemies,
        RandomEnemy,
        HighestAttackEnemy,
        LowestHpAlly,
        AllAllies,
        Self
    }

    public enum SkillEffect
    {
        Damage,
        Heal,
        Shield,
        Status,
        Utility
    }

    public enum SkillCategory
    {
        Normal,
        Passive,
        Ultimate,
        Transcendent,
        Demigod,
        Envoy,
        Relic,
        Attribute,
        Mastery,
        CrystalCore,
        Exclusive,
        UltimateTechnique,
        MainBattle,
        Support
    }

    public enum SkillActionType
    {
        Damage,
        TrueDamage,
        Heal,
        Shield,
        ApplyStatus,
        Cleanse,
        Dispel,
        RestoreRage,
        ReduceRage
    }

    public enum BattleTriggerType
    {
        BattleStarted,
        RoundStarted,
        TurnStarted,
        ActionEnded,
        DamageTaken,
        UnitDied,
        NormalSkillCast,
        UltimateCast
    }

    public enum StatusKind
    {
        Stun,
        Silence,
        AttackUp,
        AttackDown,
        DefenseUp,
        DefenseDown,
        DamageDealtUp,
        DamageTakenDown,
        CritRateUp,
        CritDamageUp,
        CritDamageDown,
        CritResistanceUp,
        ControlAccuracyUp,
        ControlResistanceUp,
        AccuracyUp,
        EvasionUp,
        ReflectUp,
        HealingReceivedUp,
        LifeStealUp,
        DefenseIgnoreUp,
        MaxHpUp,
        DamageTakenUp,
        DamageOverTime,
        HealOverTime,
        Custom
    }

    public sealed class SkillActionDefinition
    {
        public readonly SkillActionType Type;
        public readonly SkillTargeting Targeting;
        public readonly float Power;
        public readonly int HitCount;
        public readonly int Duration;
        public readonly int Amount;
        public readonly float Magnitude;
        public readonly int Stacks;
        public readonly StatusKind Status;
        public readonly float Chance;

        public SkillActionDefinition(
            SkillActionType type,
            SkillTargeting targeting,
            float power = 0f,
            int hitCount = 1,
            int duration = 0,
            int amount = 0,
            float magnitude = 0f,
            int stacks = 1,
            StatusKind status = StatusKind.Custom,
            float chance = 1f)
        {
            Type = type;
            Targeting = targeting;
            Power = Math.Max(0f, power);
            HitCount = Math.Max(1, hitCount);
            Duration = Math.Max(0, duration);
            Amount = amount;
            Magnitude = magnitude;
            Stacks = Math.Max(1, stacks);
            Status = status;
            Chance = Math.Max(0f, Math.Min(1f, chance));
        }
    }

    public sealed class SkillTriggerDefinition
    {
        public readonly BattleTriggerType Trigger;
        public readonly bool Once;
        public readonly IList<SkillActionDefinition> Actions;

        public SkillTriggerDefinition(BattleTriggerType trigger, bool once, IList<SkillActionDefinition> actions)
        {
            Trigger = trigger;
            Once = once;
            Actions = actions == null
                ? new List<SkillActionDefinition>().AsReadOnly()
                : new List<SkillActionDefinition>(actions).AsReadOnly();
        }
    }

    public sealed class SkillDefinition
    {
        public readonly string Id;
        public readonly string DisplayName;
        public readonly SkillTargeting Targeting;
        public readonly SkillEffect Effect;
        public readonly float Power;
        public readonly bool HasCutIn;
        public readonly string Description;
        public readonly SkillCategory Category;
        public readonly int EnergyCost;
        public readonly string ImplementationStatus;
        public readonly string Source;
        public readonly IList<SkillActionDefinition> Actions;
        public readonly IList<SkillTriggerDefinition> Triggers;

        public SkillDefinition(
            string id,
            string displayName,
            SkillTargeting targeting,
            SkillEffect effect,
            float power,
            bool hasCutIn)
        {
            Id = id;
            DisplayName = displayName;
            Targeting = targeting;
            Effect = effect;
            Power = power;
            HasCutIn = hasCutIn;
            Description = string.Empty;
            Category = SkillCategory.Normal;
            EnergyCost = 0;
            ImplementationStatus = "Prototype";
            Source = "legacy";
            SkillActionType actionType = effect == SkillEffect.Heal ? SkillActionType.Heal
                : effect == SkillEffect.Shield ? SkillActionType.Shield : SkillActionType.Damage;
            Actions = new List<SkillActionDefinition>
            {
                new SkillActionDefinition(actionType, targeting, power)
            }.AsReadOnly();
            Triggers = new List<SkillTriggerDefinition>().AsReadOnly();
        }

        public SkillDefinition(
            string id,
            string displayName,
            string description,
            SkillCategory category,
            int energyCost,
            bool hasCutIn,
            string implementationStatus,
            string source,
            IList<SkillActionDefinition> actions,
            IList<SkillTriggerDefinition> triggers)
        {
            Id = id;
            DisplayName = displayName;
            Description = description ?? string.Empty;
            Category = category;
            EnergyCost = energyCost;
            HasCutIn = hasCutIn;
            ImplementationStatus = implementationStatus ?? string.Empty;
            Source = source ?? string.Empty;
            Actions = actions == null
                ? new List<SkillActionDefinition>().AsReadOnly()
                : new List<SkillActionDefinition>(actions).AsReadOnly();
            Triggers = triggers == null
                ? new List<SkillTriggerDefinition>().AsReadOnly()
                : new List<SkillTriggerDefinition>(triggers).AsReadOnly();
            if (Actions.Count > 0)
            {
                SkillActionDefinition primary = Actions[0];
                Targeting = primary.Targeting;
                Power = primary.Power;
                Effect = primary.Type == SkillActionType.Heal ? SkillEffect.Heal
                    : primary.Type == SkillActionType.Shield ? SkillEffect.Shield
                    : primary.Type == SkillActionType.ApplyStatus || primary.Type == SkillActionType.Cleanse
                        || primary.Type == SkillActionType.Dispel ? SkillEffect.Status
                    : primary.Type == SkillActionType.RestoreRage || primary.Type == SkillActionType.ReduceRage
                        ? SkillEffect.Utility : SkillEffect.Damage;
            }
            else
            {
                Targeting = SkillTargeting.Self;
                Power = 0f;
                Effect = SkillEffect.Utility;
            }
        }
    }

    public sealed class CharacterDefinition
    {
        public readonly string Id;
        public readonly string DisplayName;
        public readonly string Role;
        public readonly int MaxHp;
        public readonly int Attack;
        public readonly int Defense;
        public readonly int MagicDefense;
        public readonly int Speed;
        public readonly int Quality;
        public readonly bool CatalogVisible;
        public readonly SkillDefinition BasicSkill;
        public readonly SkillDefinition UltimateSkill;
        public readonly IList<SkillDefinition> Skills;

        public CharacterDefinition(
            string id,
            string displayName,
            string role,
            int maxHp,
            int attack,
            int defense,
            int speed,
            SkillDefinition basicSkill,
            SkillDefinition ultimateSkill)
            : this(id, displayName, role, maxHp, attack, defense, defense, speed, 0, true,
                BuildLegacySkills(basicSkill, ultimateSkill))
        {
            BasicSkill = basicSkill;
            UltimateSkill = ultimateSkill;
        }

        public CharacterDefinition(
            string id,
            string displayName,
            string role,
            int maxHp,
            int attack,
            int defense,
            int magicDefense,
            int speed,
            int quality,
            bool catalogVisible,
            IList<SkillDefinition> skills)
        {
            Id = id;
            DisplayName = displayName;
            Role = role;
            MaxHp = maxHp;
            Attack = attack;
            Defense = defense;
            MagicDefense = magicDefense;
            Speed = speed;
            Quality = quality;
            CatalogVisible = catalogVisible;
            Skills = skills == null
                ? new List<SkillDefinition>().AsReadOnly()
                : new List<SkillDefinition>(skills).AsReadOnly();
            BasicSkill = FindSkill(SkillCategory.Normal);
            UltimateSkill = FindSkill(SkillCategory.Ultimate) ?? FindSkill(SkillCategory.UltimateTechnique);
        }

        private SkillDefinition FindSkill(SkillCategory category)
        {
            for (int index = 0; index < Skills.Count; index++)
                if (Skills[index].Category == category) return Skills[index];
            return null;
        }

        private static IList<SkillDefinition> BuildLegacySkills(
            SkillDefinition basicSkill,
            SkillDefinition ultimateSkill)
        {
            List<SkillDefinition> result = new List<SkillDefinition>();
            if (basicSkill != null) result.Add(basicSkill);
            if (ultimateSkill != null && ultimateSkill != basicSkill) result.Add(ultimateSkill);
            return result.AsReadOnly();
        }
    }

    public sealed class CombatStatus
    {
        public readonly string Id;
        public readonly StatusKind Kind;
        public readonly float Magnitude;
        public readonly int Stacks;
        public readonly string SourceSkillId;
        public int RemainingTurns;

        public CombatStatus(
            string id,
            StatusKind kind,
            int remainingTurns,
            float magnitude,
            int stacks,
            string sourceSkillId)
        {
            Id = id;
            Kind = kind;
            // Zero identifies a battle-long status; positive values tick down at round end.
            RemainingTurns = Math.Max(0, remainingTurns);
            Magnitude = magnitude;
            Stacks = Math.Max(1, stacks);
            SourceSkillId = sourceSkillId ?? string.Empty;
        }
    }

    public sealed class Combatant
    {
        private readonly List<CombatStatus> statuses = new List<CombatStatus>();
        public readonly CharacterDefinition Definition;
        public readonly TeamSide Side;
        public readonly int Slot;
        public readonly string InstanceId;
        public int Hp;
        public int Rage;
        public int Shield;
        public int WarStacks;
        public int NormalCasts;
        public int UltimateCasts;

        public Combatant(CharacterDefinition definition, TeamSide side, int slot)
        {
            if (definition == null) throw new ArgumentNullException("definition");
            Definition = definition;
            Side = side;
            Slot = slot;
            InstanceId = (side == TeamSide.Ally ? "ally:" : "enemy:") + slot;
            Reset();
        }

        public void Reset()
        {
            Hp = Definition.MaxHp;
            Rage = 50;
            Shield = 0;
            WarStacks = 0;
            NormalCasts = 0;
            UltimateCasts = 0;
            statuses.Clear();
        }

        public bool IsAlive
        {
            get { return Hp > 0; }
        }

        public float HpRatio
        {
            get { return MaxHp <= 0 ? 0f : (float)Hp / MaxHp; }
        }

        public IList<CombatStatus> Statuses
        {
            get { return statuses.AsReadOnly(); }
        }

        public float EffectiveAttack
        {
            get { return Math.Max(0f, Definition.Attack * (1f + SumMagnitude(StatusKind.AttackUp) - SumMagnitude(StatusKind.AttackDown))); }
        }

        public float EffectiveDefense
        {
            get { return Math.Max(0f, Definition.Defense * (1f + SumMagnitude(StatusKind.DefenseUp) - SumMagnitude(StatusKind.DefenseDown))); }
        }

        public int MaxHp
        {
            get
            {
                float multiplier = Math.Max(0.05f, 1f + SumMagnitude(StatusKind.MaxHpUp));
                return Math.Max(1, (int)Math.Round(Definition.MaxHp * multiplier));
            }
        }

        public bool IsStunned
        {
            get { return HasStatus(StatusKind.Stun); }
        }

        public bool IsSilenced
        {
            get { return HasStatus(StatusKind.Silence); }
        }

        public bool HasStatus(StatusKind kind)
        {
            for (int index = 0; index < statuses.Count; index++)
                if (statuses[index].Kind == kind && statuses[index].RemainingTurns >= 0) return true;
            return false;
        }

        public float SumMagnitude(StatusKind kind)
        {
            float total = 0f;
            for (int index = 0; index < statuses.Count; index++)
            {
                CombatStatus status = statuses[index];
                if (status.Kind == kind && status.RemainingTurns >= 0)
                    total += status.Magnitude * status.Stacks;
            }
            return total;
        }

        internal void AddOrRefreshStatus(CombatStatus status)
        {
            for (int index = 0; index < statuses.Count; index++)
            {
                CombatStatus existing = statuses[index];
                if (existing.Kind != status.Kind || existing.SourceSkillId != status.SourceSkillId) continue;
                statuses[index] = new CombatStatus(
                    existing.Id + "+",
                    existing.Kind,
                    Math.Max(existing.RemainingTurns, status.RemainingTurns),
                    Math.Max(existing.Magnitude, status.Magnitude),
                    Math.Min(5, existing.Stacks + status.Stacks),
                    existing.SourceSkillId);
                return;
            }
            statuses.Add(status);
        }

        internal void RemoveHarmfulStatuses(List<CombatStatus> removed)
        {
            for (int index = statuses.Count - 1; index >= 0; index--)
            {
                if (!IsHarmful(statuses[index].Kind)) continue;
                removed.Add(statuses[index]);
                statuses.RemoveAt(index);
            }
        }

        internal void RemoveBeneficialStatuses(List<CombatStatus> removed)
        {
            for (int index = statuses.Count - 1; index >= 0; index--)
            {
                if (IsHarmful(statuses[index].Kind)) continue;
                removed.Add(statuses[index]);
                statuses.RemoveAt(index);
            }
        }

        internal void RemoveStatus(CombatStatus status)
        {
            statuses.Remove(status);
        }

        internal static bool IsHarmful(StatusKind kind)
        {
            return kind == StatusKind.Stun || kind == StatusKind.Silence || kind == StatusKind.AttackDown
                || kind == StatusKind.DefenseDown || kind == StatusKind.DamageOverTime
                || kind == StatusKind.DamageTakenUp || kind == StatusKind.CritDamageDown;
        }
    }

    public sealed class BattleEvent
    {
        public readonly BattleEventType Type;
        public readonly int Round;
        public readonly string ActorId;
        public readonly string TargetId;
        public readonly string ActorDefinitionId;
        public readonly string TargetDefinitionId;
        public readonly string ActorInstanceId;
        public readonly string TargetInstanceId;
        public readonly int Amount;
        public readonly int RemainingHp;
        public readonly bool Critical;
        public readonly bool Skill;
        public readonly string Note;
        // Shield belongs to the target; rage and war intent belong to the actor.
        public readonly int RemainingShield;
        public readonly int Rage;
        public readonly int WarStacks;
        public readonly int Absorbed;
        public readonly string SkillId;
        public readonly string StatusId;
        public readonly BattleTriggerType? Trigger;
        public readonly bool Triggered;

        public BattleEvent(
            BattleEventType type,
            int round,
            string actorId,
            string targetId,
            int amount,
            int remainingHp,
            bool critical,
            bool skill,
            string note)
            : this(type, round, actorId, targetId, amount, remainingHp, critical, skill, note,
                string.Empty, string.Empty, 0, 0, 0, 0)
        {
        }

        public BattleEvent(
            BattleEventType type,
            int round,
            string actorId,
            string targetId,
            int amount,
            int remainingHp,
            bool critical,
            bool skill,
            string note,
            string actorInstanceId,
            string targetInstanceId,
            int remainingShield,
            int rage,
            int warStacks,
            int absorbed,
            string skillId = "",
            string statusId = "",
            BattleTriggerType? trigger = null,
            bool triggered = false)
        {
            Type = type;
            Round = round;
            ActorId = actorId ?? string.Empty;
            TargetId = targetId ?? string.Empty;
            ActorDefinitionId = ActorId;
            TargetDefinitionId = TargetId;
            ActorInstanceId = actorInstanceId ?? string.Empty;
            TargetInstanceId = targetInstanceId ?? string.Empty;
            Amount = amount;
            RemainingHp = remainingHp;
            Critical = critical;
            Skill = skill;
            Note = note ?? string.Empty;
            RemainingShield = remainingShield;
            Rage = rage;
            WarStacks = warStacks;
            Absorbed = absorbed;
            SkillId = skillId ?? string.Empty;
            StatusId = statusId ?? string.Empty;
            Trigger = trigger;
            Triggered = triggered;
        }

        public override string ToString()
        {
            return string.Format(
                "R{0} {1} actor={2} target={3} amount={4} hp={5} crit={6} skill={7} note={8} actorInstance={9} targetInstance={10} shield={11} rage={12} war={13} absorbed={14} skillId={15} status={16} trigger={17} triggered={18}",
                Round,
                Type,
                ActorId,
                TargetId,
                Amount,
                RemainingHp,
                Critical,
                Skill,
                Note,
                ActorInstanceId,
                TargetInstanceId,
                RemainingShield,
                Rage,
                WarStacks,
                Absorbed,
                SkillId,
                StatusId,
                Trigger.HasValue ? Trigger.Value.ToString() : string.Empty,
                Triggered);
        }
    }

    public sealed class BattleResult
    {
        public readonly bool Victory;
        public readonly int Rounds;
        public readonly IList<BattleEvent> Events;
        public readonly int SurvivingAllies;
        public readonly int SurvivingEnemies;
        public readonly int TotalDamage;

        public BattleResult(
            bool victory,
            int rounds,
            IList<BattleEvent> events,
            int survivingAllies,
            int survivingEnemies,
            int totalDamage)
        {
            Victory = victory;
            Rounds = rounds;
            Events = events;
            SurvivingAllies = survivingAllies;
            SurvivingEnemies = survivingEnemies;
            TotalDamage = totalDamage;
        }
    }
}
