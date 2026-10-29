using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using FateCovenant.Battle;

internal static class Program
{
    private static int checks;

    private static int Main(string[] args)
    {
        string catalogPath = args.Length > 0
            ? args[0]
            : Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory,
                "../../../unity/FateCovenantClone/Assets/Resources/CharacterSkillCatalog.json"));
        CharacterSkillCatalog catalog = CharacterSkillCatalog.Parse(File.ReadAllText(catalogPath, Encoding.UTF8));
        IList<CharacterDefinition> allies = BattleCatalog.CreateAllies();
        IList<CharacterDefinition> enemies = BattleCatalog.CreateEnemies();
        BattleResult first = new BattleSimulator(allies, enemies, 12345).Run();
        BattleResult second = new BattleSimulator(allies, enemies, 12345).Run();
        int seededVictories = 0;
        int shortestBattle = int.MaxValue;
        int longestBattle = 0;
        for (int seed = 1; seed <= 20; seed++)
        {
            BattleResult sample = new BattleSimulator(allies, enemies, seed).Run();
            if (sample.Victory) seededVictories++;
            if (sample.Rounds < shortestBattle) shortestBattle = sample.Rounds;
            if (sample.Rounds > longestBattle) longestBattle = sample.Rounds;
        }

        List<string> failures = new List<string>();
        Require(first.Victory, "seed 12345 should produce an ally victory", failures);
        Require(first.Rounds >= 2 && first.Rounds < 15, "battle should finish before the safety round limit", failures);
        Require(first.TotalDamage > 0, "battle should deal damage", failures);
        Require(first.Events.Count > 10, "battle should emit a useful event stream", failures);
        Require(ContainsSkillEvent(first.Events), "at least one ultimate should resolve as a skill event", failures);
        Require(Serialize(first.Events) == Serialize(second.Events), "same seed must produce the same event sequence", failures);
        Require(seededVictories >= 18, "at least 18 of 20 seeds should produce an ally victory", failures);
        Require(longestBattle < 15, "sampled battles should not hit the safety round limit", failures);
        CheckRepeatedRuns(allies, enemies, failures);
        CheckDamageAndWarIntent(failures);
        CheckHealing(failures);
        CheckShields(failures);
        CheckActionOrderAndDeadTargets(failures);
        CheckDefeat(failures);
        CheckIdentityAndInvalidSquads(failures);
        CheckCharacterCatalog(catalog, failures);
        CheckDataDrivenActions(failures);
        CheckStatusControlAndTriggers(failures);
        CheckAdvancedStatusMechanics(failures);
        CheckHitEvasionAndReflection(failures);
        CheckEveryCatalogCharacterBattle(catalog, failures);
        CheckCatalogBattle(catalog, failures);

        Console.WriteLine("Result: rounds=" + first.Rounds + " victory=" + first.Victory
            + " allies=" + first.SurvivingAllies + " enemies=" + first.SurvivingEnemies
            + " damage=" + first.TotalDamage + " events=" + first.Events.Count);
        Console.WriteLine("Seeds: victories=" + seededVictories + "/20 rounds=" + shortestBattle + ".." + longestBattle);
        Console.WriteLine("Checks: " + checks + " across determinism, damage, healing, shields, war intent, turn order, death, catalog loading, skill actions, statuses, control and triggers");

        if (failures.Count > 0)
        {
            Console.WriteLine("FAILED");
            for (int i = 0; i < failures.Count; i++) Console.WriteLine("- " + failures[i]);
            return 1;
        }

        Console.WriteLine("PASS");
        Console.WriteLine("Rounds: " + first.Rounds);
        Console.WriteLine("Surviving allies: " + first.SurvivingAllies);
        Console.WriteLine("Surviving enemies: " + first.SurvivingEnemies);
        Console.WriteLine("Total damage: " + first.TotalDamage);
        Console.WriteLine("Events: " + first.Events.Count);
        Console.WriteLine("First events:");
        for (int i = 0; i < Math.Min(10, first.Events.Count); i++)
            Console.WriteLine(first.Events[i]);
        return 0;
    }

    private static void CheckCharacterCatalog(CharacterSkillCatalog catalog, IList<string> failures)
    {
        Require(catalog.Characters.Count == 337, "all 337 hero records must remain represented", failures);
        Require(catalog.CatalogCharacters.Count == 76, "exactly 76 catalog-visible heroes must load", failures);
        int metadataOnly = 0;
        int unresolved = 0;
        HashSet<string> ids = new HashSet<string>(StringComparer.Ordinal);
        for (int index = 0; index < catalog.CatalogCharacters.Count; index++)
        {
            CharacterDefinition character = catalog.CatalogCharacters[index];
            Require(ids.Add(character.Id), "catalog character IDs must be unique: " + character.Id, failures);
            Require(character.DisplayName.Length > 0 && character.DisplayName != character.Id,
                "catalog characters must have localized display names: " + character.Id, failures);
            Require(character.MaxHp > 0 && character.Attack >= 0 && character.Defense >= 0 && character.Speed >= 0,
                "catalog character stats must be valid: " + character.Id, failures);
            Require(character.BasicSkill != null, "catalog character must have a normal skill: " + character.Id, failures);
            Require(character.Skills.Count >= 2, "catalog character must expose its full skill list: " + character.Id, failures);
            bool hasExecutableSkill = false;
            for (int skillIndex = 0; skillIndex < character.Skills.Count; skillIndex++)
            {
                SkillDefinition skill = character.Skills[skillIndex];
                if (skill.ImplementationStatus != "MetadataOnly") hasExecutableSkill = true;
                if (skill.ImplementationStatus == "MetadataOnly") metadataOnly++;
                if (skill.ImplementationStatus == "Unresolved") unresolved++;
            }
            Require(hasExecutableSkill, "catalog character must have at least one executable skill: " + character.Id, failures);
        }
        Require(unresolved == 0, "every referenced skill must resolve to a table record or synthetic fallback", failures);
        Require(metadataOnly == 22, "22 specialized mechanics must remain explicitly metadata-only", failures);
    }

    private static void CheckDataDrivenActions(IList<string> failures)
    {
        SkillDefinition strike = DataSkill("strike", SkillCategory.Normal, 0, null,
            new SkillActionDefinition(SkillActionType.Damage, SkillTargeting.LowestHpEnemy, 1f));
        SkillDefinition sweep = DataSkill("sweep", SkillCategory.Ultimate, 100, null,
            new SkillActionDefinition(SkillActionType.Damage, SkillTargeting.AllEnemies, 1f));
        CharacterDefinition striker = DataUnit("striker", 5000, 500, 50, 20, new[] { strike, sweep });
        CharacterDefinition left = DataUnit("left", 50000, 10, 10, 10, new[] { strike });
        CharacterDefinition right = DataUnit("right", 50000, 10, 10, 9, new[] { strike });
        BattleResult multi = new BattleSimulator(
            new List<CharacterDefinition> { striker },
            new List<CharacterDefinition> { left, right }, 12345).Run();
        int hitTargets = 0;
        for (int index = 0; index < multi.Events.Count; index++)
        {
            BattleEvent entry = multi.Events[index];
            if (entry.Round == 3 && entry.Type == BattleEventType.Damage && entry.SkillId == "sweep") hitTargets++;
        }
        Require(hitTargets == 2, "all-enemy skills must damage every living enemy", failures);

        SkillDefinition support = DataSkill("support", SkillCategory.Ultimate, 100, null,
            new SkillActionDefinition(SkillActionType.Heal, SkillTargeting.AllAllies, 2f),
            new SkillActionDefinition(SkillActionType.Shield, SkillTargeting.AllAllies, 1f),
            new SkillActionDefinition(SkillActionType.ApplyStatus, SkillTargeting.AllAllies, 0f, 1, 2, 0, 0.2f, 1,
                StatusKind.AttackUp));
        CharacterDefinition healer = DataUnit("support", 5000, 100, 20, 30, new[] { strike, support });
        CharacterDefinition enemy = DataUnit("enemy", 5000, 10, 20, 1, new[] { strike });
        BattleResult utility = new BattleSimulator(
            new List<CharacterDefinition> { healer }, new List<CharacterDefinition> { enemy }, 12345).Run();
        Require(ContainsEvent(utility.Events, BattleEventType.Shield, "support", 3), "shield actions must emit shield events", failures);
        Require(ContainsEvent(utility.Events, BattleEventType.StatusChanged, "support", 3), "status actions must emit status events", failures);
    }

    private static void CheckStatusControlAndTriggers(IList<string> failures)
    {
        SkillDefinition control = DataSkill("control", SkillCategory.Ultimate, 100, null,
            new SkillActionDefinition(SkillActionType.ApplyStatus, SkillTargeting.LowestHpEnemy, 0f, 1, 2, 0, 0f, 1,
                StatusKind.Stun),
            new SkillActionDefinition(SkillActionType.ApplyStatus, SkillTargeting.LowestHpEnemy, 0f, 1, 2, 0, 0.2f, 1,
                StatusKind.DamageOverTime));
        SkillDefinition passive = DataSkill("revenge", SkillCategory.Passive, 0,
            new SkillTriggerDefinition(BattleTriggerType.DamageTaken, false,
                new List<SkillActionDefinition>
                {
                    new SkillActionDefinition(SkillActionType.RestoreRage, SkillTargeting.Self, 0f, 1, 0, 40)
                }),
            new SkillActionDefinition[0]);
        SkillDefinition hit = DataSkill("hit", SkillCategory.Normal, 0, null,
            new SkillActionDefinition(SkillActionType.Damage, SkillTargeting.LowestHpEnemy, 1f));
        CharacterDefinition controller = DataUnit("controller", 4000, 100, 20, 40, new[] { hit, control });
        CharacterDefinition target = DataUnit("target", 4000, 50, 20, 10, new[] { hit, passive });
        BattleResult result = new BattleSimulator(
            new List<CharacterDefinition> { controller }, new List<CharacterDefinition> { target }, 12345).Run();
        bool enemyActedInControlRound = false;
        bool stunned = false;
        bool dotTicked = false;
        for (int index = 0; index < result.Events.Count; index++)
        {
            BattleEvent entry = result.Events[index];
            if (entry.Round == 3 && entry.Type == BattleEventType.ActionStarted && entry.ActorInstanceId == "enemy:0")
                enemyActedInControlRound = true;
            if (entry.Round == 3 && entry.Type == BattleEventType.StatusChanged && entry.Note == "Stunned") stunned = true;
            if (entry.Type == BattleEventType.StatusTicked && entry.Note == "DamageOverTime") dotTicked = true;
        }
        Require(stunned && !enemyActedInControlRound, "stun must prevent the affected combatant's action", failures);
        Require(dotTicked, "damage-over-time statuses must tick at round end", failures);

        SkillDefinition triggerHit = DataSkill("trigger-hit", SkillCategory.Normal, 0, null,
            new SkillActionDefinition(SkillActionType.Damage, SkillTargeting.LowestHpEnemy, 1f));
        CharacterDefinition attacker = DataUnit("attacker", 4000, 100, 10, 30, new[] { triggerHit });
        CharacterDefinition reactor = DataUnit("reactor", 4000, 10, 10, 5, new[] { triggerHit, passive });
        BattleResult triggered = new BattleSimulator(
            new List<CharacterDefinition> { attacker }, new List<CharacterDefinition> { reactor }, 12345).Run();
        bool damageTakenTrigger = false;
        for (int index = 0; index < triggered.Events.Count; index++)
        {
            BattleEvent entry = triggered.Events[index];
            if (entry.Type == BattleEventType.RageChanged && entry.Trigger == BattleTriggerType.DamageTaken
                && entry.Triggered && entry.TargetDefinitionId == "reactor") damageTakenTrigger = true;
        }
        Require(damageTakenTrigger, "DamageTaken passives must execute through the trigger pipeline", failures);
    }

    private static void CheckAdvancedStatusMechanics(IList<string> failures)
    {
        SkillDefinition hit = DataSkill("advanced-status-hit", SkillCategory.Normal, 0, null,
            new SkillActionDefinition(SkillActionType.Damage, SkillTargeting.LowestHpEnemy, 1f));
        SkillDefinition maxHealth = DataSkill("max-health", SkillCategory.Passive, 0,
            new SkillTriggerDefinition(BattleTriggerType.BattleStarted, false,
                new List<SkillActionDefinition>
                {
                    new SkillActionDefinition(SkillActionType.ApplyStatus, SkillTargeting.Self,
                        0f, 1, 0, 0, 0.5f, 1, StatusKind.MaxHpUp)
                }),
            new SkillActionDefinition[0]);
        CharacterDefinition durable = DataUnit("durable", 1000, 100, 10, 20, new[] { hit, maxHealth });
        BattleResult healthResult = new BattleSimulator(
            new List<CharacterDefinition> { durable }, new List<CharacterDefinition> { DataUnit("health-dummy", 5000, 0, 0, 0, new[] { hit }) }, 1).Run();
        BattleEvent maxHealthApplied = null;
        for (int index = 0; index < healthResult.Events.Count; index++)
            if (healthResult.Events[index].Type == BattleEventType.StatusChanged
                && healthResult.Events[index].Note == "Applied:MaxHpUp") maxHealthApplied = healthResult.Events[index];
        Require(maxHealthApplied != null && maxHealthApplied.RemainingHp == 1500,
            "battle-start maximum-health increases must raise current and maximum health", failures);

        SkillDefinition damageTakenUp = DataSkill("damage-taken-up", SkillCategory.Passive, 0,
            new SkillTriggerDefinition(BattleTriggerType.BattleStarted, false,
                new List<SkillActionDefinition>
                {
                    new SkillActionDefinition(SkillActionType.ApplyStatus, SkillTargeting.Self,
                        0f, 1, 0, 0, 0.5f, 1, StatusKind.DamageTakenUp)
                }),
            new SkillActionDefinition[0]);
        CharacterDefinition exposed = DataUnit("exposed", 5000, 10, 10, 1, new[] { hit, damageTakenUp });
        CharacterDefinition plain = DataUnit("plain", 5000, 10, 10, 1, new[] { hit });
        BattleResult baselineDamage = new BattleSimulator(
            new List<CharacterDefinition> { DataUnit("baseline-attacker", 5000, 100, 0, 20, new[] { hit }) },
            new List<CharacterDefinition> { plain }, 7).Run();
        BattleResult increasedDamage = new BattleSimulator(
            new List<CharacterDefinition> { DataUnit("increased-attacker", 5000, 100, 0, 20, new[] { hit }) },
            new List<CharacterDefinition> { exposed }, 7).Run();
        BattleEvent baselineHit = Find(baselineDamage.Events, BattleEventType.Damage, "baseline-attacker", 1);
        BattleEvent increasedHit = Find(increasedDamage.Events, BattleEventType.Damage, "increased-attacker", 1);
        Require(baselineHit != null && increasedHit != null && increasedHit.Amount > baselineHit.Amount,
            "DamageTakenUp must increase incoming damage without changing the seed or attack stats", failures);

        SkillDefinition resistedPassive = StatusPassive("control-guard", StatusKind.ControlResistanceUp, 1f);
        SkillDefinition control = DataSkill("resisted-control", SkillCategory.Ultimate, 100, null,
            new SkillActionDefinition(SkillActionType.ApplyStatus, SkillTargeting.LowestHpEnemy,
                0f, 1, 1, 0, 0f, 1, StatusKind.Stun));
        CharacterDefinition controller = DataUnit("resisted-controller", 5000, 10, 0, 30, new[] { hit, control });
        CharacterDefinition resistant = DataUnit("resistant", 5000, 10, 0, 1, new[] { hit, resistedPassive });
        BattleResult resistance = new BattleSimulator(
            new List<CharacterDefinition> { controller }, new List<CharacterDefinition> { resistant }, 11).Run();
        bool controlResisted = false;
        for (int index = 0; index < resistance.Events.Count; index++)
            if (resistance.Events[index].Note == "Resisted:Stun") controlResisted = true;
        Require(controlResisted, "full control resistance must reject incoming control statuses", failures);

        SkillDefinition never = DataSkill("never-procs", SkillCategory.Passive, 0,
            new SkillTriggerDefinition(BattleTriggerType.BattleStarted, false,
                new List<SkillActionDefinition>
                {
                    new SkillActionDefinition(SkillActionType.ApplyStatus, SkillTargeting.Self,
                        0f, 1, 2, 0, 0.2f, 1, StatusKind.AttackUp, 0f)
                }),
            new SkillActionDefinition[0]);
        CharacterDefinition unlucky = DataUnit("unlucky", 1000, 10, 0, 1, new[] { hit, never });
        BattleResult chanceResult = new BattleSimulator(
            new List<CharacterDefinition> { unlucky }, new List<CharacterDefinition> { DataUnit("chance-dummy", 5000, 0, 0, 0, new[] { hit }) }, 13).Run();
        bool chanceFailed = false;
        for (int index = 0; index < chanceResult.Events.Count; index++)
            if (chanceResult.Events[index].Note == "ChanceFailed=0") chanceFailed = true;
        Require(chanceFailed, "zero-percent skill actions must fail and emit an explicit event", failures);
    }

    private static void CheckCatalogBattle(CharacterSkillCatalog catalog, IList<string> failures)
    {
        if (catalog.CatalogCharacters.Count < 3 || catalog.Characters.Count < 6) return;
        IList<CharacterDefinition> allies = new List<CharacterDefinition>
        {
            catalog.CatalogCharacters[0], catalog.CatalogCharacters[1], catalog.CatalogCharacters[2]
        };
        IList<CharacterDefinition> enemies = new List<CharacterDefinition>
        {
            catalog.Characters[catalog.Characters.Count - 3],
            catalog.Characters[catalog.Characters.Count - 2],
            catalog.Characters[catalog.Characters.Count - 1]
        };
        BattleResult first = new BattleSimulator(allies, enemies, 98765).Run();
        BattleResult second = new BattleSimulator(allies, enemies, 98765).Run();
        Require(first.Rounds > 0 && first.Events.Count > 0, "catalog characters must complete a simulated battle", failures);
        Require(Serialize(first.Events) == Serialize(second.Events), "catalog battles must preserve seed determinism", failures);
    }

    private static void CheckEveryCatalogCharacterBattle(CharacterSkillCatalog catalog, IList<string> failures)
    {
        SkillDefinition dummyHit = DataSkill("training-hit", SkillCategory.Normal, 0, null,
            new SkillActionDefinition(SkillActionType.Damage, SkillTargeting.LowestHpEnemy, 1f));
        for (int index = 0; index < catalog.CatalogCharacters.Count; index++)
        {
            CharacterDefinition character = catalog.CatalogCharacters[index];
            CharacterDefinition dummy = DataUnit("training-" + character.Id, 50000, 0, 0, 0,
                new[] { dummyHit });
            BattleResult result = new BattleSimulator(
                new List<CharacterDefinition> { character },
                new List<CharacterDefinition> { dummy }, 24680 + index).Run();
            bool ended = false;
            bool ultimateCast = false;
            for (int eventIndex = 0; eventIndex < result.Events.Count; eventIndex++)
            {
                BattleEvent entry = result.Events[eventIndex];
                if (entry.Type == BattleEventType.BattleEnded) ended = true;
                if (entry.Type == BattleEventType.ActionStarted && character.UltimateSkill != null
                    && entry.SkillId == character.UltimateSkill.Id) ultimateCast = true;
            }
            Require(ended && result.Events.Count > 0,
                "every catalog character must complete a battle simulation: " + character.Id, failures);
            if (character.UltimateSkill != null)
                Require(ultimateCast, "catalog character must reach its ultimate action: " + character.Id, failures);
        }
    }

    private static void CheckHitEvasionAndReflection(IList<string> failures)
    {
        SkillDefinition hit = DataSkill("advanced-hit", SkillCategory.Normal, 0, null,
            new SkillActionDefinition(SkillActionType.Damage, SkillTargeting.LowestHpEnemy, 1f));
        SkillDefinition evasion = StatusPassive("evasion-passive", StatusKind.EvasionUp, 1f);
        CharacterDefinition attacker = DataUnit("accuracy-attacker", 5000, 100, 10, 20, new[] { hit });
        CharacterDefinition evader = DataUnit("evader", 5000, 10, 10, 1, new[] { hit, evasion });
        BattleResult missed = new BattleSimulator(
            new List<CharacterDefinition> { attacker }, new List<CharacterDefinition> { evader }, 12345).Run();
        bool missedFirstAttack = false;
        bool evasionExpired = false;
        for (int index = 0; index < missed.Events.Count; index++)
        {
            BattleEvent entry = missed.Events[index];
            if (entry.Round == 1 && entry.Type == BattleEventType.Damage
                && entry.ActorDefinitionId == "accuracy-attacker" && entry.Note == "Miss") missedFirstAttack = true;
            if (entry.Type == BattleEventType.StatusExpired && entry.Note == "Expired:EvasionUp") evasionExpired = true;
        }
        Require(missedFirstAttack, "evasion must reduce hit chance before damage is rolled", failures);
        Require(!evasionExpired, "battle-start statuses without a round limit must remain for the whole battle", failures);

        SkillDefinition accuracy = StatusPassive("accuracy-passive", StatusKind.AccuracyUp, 2f);
        CharacterDefinition accurate = DataUnit("accurate", 5000, 100, 10, 20, new[] { hit, accuracy });
        BattleResult connected = new BattleSimulator(
            new List<CharacterDefinition> { accurate }, new List<CharacterDefinition> { evader }, 12345).Run();
        bool hitDespiteEvasion = false;
        for (int index = 0; index < connected.Events.Count; index++)
        {
            BattleEvent entry = connected.Events[index];
            if (entry.Round == 1 && entry.Type == BattleEventType.Damage
                && entry.ActorDefinitionId == "accurate" && entry.Amount > 0) hitDespiteEvasion = true;
        }
        Require(hitDespiteEvasion, "accuracy must counter evasion before damage is rolled", failures);

        SkillDefinition reflection = StatusPassive("reflection-passive", StatusKind.ReflectUp, 0.5f);
        CharacterDefinition reflector = DataUnit("reflector", 5000, 10, 10, 1, new[] { hit, reflection });
        BattleResult reflected = new BattleSimulator(
            new List<CharacterDefinition> { attacker }, new List<CharacterDefinition> { reflector }, 12345).Run();
        bool reflectedDamage = false;
        for (int index = 0; index < reflected.Events.Count; index++)
        {
            BattleEvent entry = reflected.Events[index];
            if (entry.Round == 1 && entry.Type == BattleEventType.Damage
                && entry.ActorDefinitionId == "reflector" && entry.TargetDefinitionId == "accuracy-attacker"
                && entry.Note.StartsWith("Reflect", StringComparison.Ordinal)) reflectedDamage = true;
        }
        Require(reflectedDamage, "reflect statuses must damage the original attacker", failures);
    }

    private static SkillDefinition StatusPassive(string id, StatusKind kind, float magnitude)
    {
        return DataSkill(id, SkillCategory.Passive, 0,
            new SkillTriggerDefinition(BattleTriggerType.BattleStarted, false,
                new List<SkillActionDefinition>
                {
                    new SkillActionDefinition(SkillActionType.ApplyStatus, SkillTargeting.Self,
                        0f, 1, 0, 0, magnitude, 1, kind)
                }),
            new SkillActionDefinition[0]);
    }

    private static SkillDefinition DataSkill(
        string id,
        SkillCategory category,
        int energyCost,
        SkillTriggerDefinition trigger,
        params SkillActionDefinition[] actions)
    {
        List<SkillTriggerDefinition> triggers = new List<SkillTriggerDefinition>();
        if (trigger != null) triggers.Add(trigger);
        return new SkillDefinition(id, id, id + " description", category, energyCost, category == SkillCategory.Ultimate,
            "Test", "test", actions, triggers);
    }

    private static CharacterDefinition DataUnit(
        string id, int hp, int attack, int defense, int speed, IList<SkillDefinition> skills)
    {
        return new CharacterDefinition(id, id, "Test", hp, attack, defense, defense, speed, 0, true, skills);
    }

    private static bool ContainsEvent(
        IList<BattleEvent> events, BattleEventType type, string actor, int round)
    {
        for (int index = 0; index < events.Count; index++)
            if (events[index].Type == type && events[index].ActorDefinitionId == actor && events[index].Round == round)
                return true;
        return false;
    }

    private static void CheckRepeatedRuns(
        IList<CharacterDefinition> allies, IList<CharacterDefinition> enemies, IList<string> failures)
    {
        BattleSimulator simulator = new BattleSimulator(allies, enemies, 12345);
        BattleResult first = simulator.Run();
        string originalEvents = Serialize(first.Events);
        BattleResult repeated = simulator.Run();
        Require(originalEvents == Serialize(repeated.Events), "reusing a simulator must reset units and the random stream", failures);
        Require(originalEvents == Serialize(first.Events), "another run must not mutate the previous event result", failures);
        Require(first.Victory == repeated.Victory && first.Rounds == repeated.Rounds
            && first.TotalDamage == repeated.TotalDamage, "repeated runs must preserve the complete outcome", failures);
    }

    private static void CheckDamageAndWarIntent(IList<string> failures)
    {
        SkillDefinition basic = Skill("cutin_basic", SkillTargeting.LowestHpEnemy, SkillEffect.Damage, 1f, true);
        SkillDefinition ultimate = Skill("quiet_ultimate", SkillTargeting.LowestHpEnemy, SkillEffect.Damage, 2f, false);
        BattleResult result = Run(
            Unit("striker", 100000, 100, 0, 20, basic, ultimate),
            Unit("target", 100000, 1, 40, 10, null, null));
        BattleEvent basicHit = Find(result.Events, BattleEventType.Damage, "striker", 1);
        Require(basicHit != null && !basicHit.Skill, "a basic attack remains basic even when it has a cut-in", failures);
        float criticalMultiplier = basicHit != null && basicHit.Critical ? 1.5f : 1f;
        Require(basicHit != null && basicHit.Amount >= (int)Math.Round(228 * criticalMultiplier)
            && basicHit.Amount <= (int)Math.Round(252 * criticalMultiplier),
            "prototype damage must respect attack scaling, defense, variance and critical bounds", failures);
        bool criticalSeen = false;
        bool ordinarySeen = false;
        for (int i = 0; i < result.Events.Count; i++)
        {
            if (result.Events[i].Type != BattleEventType.Damage) continue;
            if (result.Events[i].Critical) criticalSeen = true; else ordinarySeen = true;
        }
        Require(criticalSeen && ordinarySeen, "the deterministic sample must exercise critical and ordinary damage", failures);
        Require(basicHit != null && basicHit.RemainingHp == 100000 - basicHit.Amount,
            "unshielded damage and remaining health must agree", failures);
        BattleEvent ultimateHit = Find(result.Events, BattleEventType.Damage, "striker", 3);
        Require(ultimateHit != null && ultimateHit.Skill && ultimateHit.Rage == 0,
            "an ultimate must consume rage and remain a skill without a cut-in", failures);
        BattleEvent stacks = Find(result.Events, BattleEventType.StatusChanged, "striker", 4);
        Require(stacks != null && stacks.WarStacks == 3, "ordinary hits must build war intent to three stacks", failures);
        BattleEvent consumed = null;
        for (int i = 0; i < result.Events.Count; i++)
            if (result.Events[i].Note == "WarIntentConsumed") { consumed = result.Events[i]; break; }
        Require(consumed != null && consumed.Round == 8 && consumed.WarStacks == 0,
            "the next eligible ultimate must consume all three war-intent stacks", failures);
        BattleEvent empowered = Find(result.Events, BattleEventType.Damage, "striker", 8);
        Require(empowered != null && empowered.Skill && empowered.Amount >= 684,
            "consuming war intent must increase the ultimate damage", failures);
    }

    private static void CheckHealing(IList<string> failures)
    {
        SkillDefinition heal = Skill("heal", SkillTargeting.LowestHpAlly, SkillEffect.Heal, 4f, false);
        SkillDefinition hit = Skill("hit", SkillTargeting.LowestHpEnemy, SkillEffect.Damage, 1f, false);
        CharacterDefinition tank = Unit("patient", 2000, 1, 0, 1, null, null);
        CharacterDefinition healer = Unit("healer", 5000, 20, 0, 10, heal, null);
        CharacterDefinition enemy = Unit("attacker", 5000, 20, 0, 20, hit, null);
        BattleResult result = new BattleSimulator(
            new List<CharacterDefinition> { tank, healer }, new List<CharacterDefinition> { enemy }, 12345).Run();
        BattleEvent damage = Find(result.Events, BattleEventType.Damage, "attacker", 1);
        BattleEvent healing = Find(result.Events, BattleEventType.Heal, "healer", 1);
        Require(healing != null && healing.TargetId == "patient" && healing.Amount > 0,
            "healing must select the wounded ally with the lowest health ratio", failures);
        Require(damage != null && healing != null && healing.Amount == Math.Min(80, damage.Amount)
            && healing.RemainingHp <= tank.MaxHp, "healing must report actual restored health and respect maximum health", failures);
    }

    private static void CheckShields(IList<string> failures)
    {
        CheckShieldAbsorption(10f, true, failures);
        CheckShieldAbsorption(1f, false, failures);
    }

    private static void CheckShieldAbsorption(float power, bool fullyAbsorbed, IList<string> failures)
    {
        SkillDefinition shield = Skill("shield", SkillTargeting.Self, SkillEffect.Shield, power, false);
        SkillDefinition hit = Skill("hit", SkillTargeting.LowestHpEnemy, SkillEffect.Damage, 1f, false);
        BattleResult result = Run(
            Unit("guard", 1000, 20, 0, 20, shield, null),
            Unit("attacker", 1000, 20, 0, 10, hit, null));
        BattleEvent granted = Find(result.Events, BattleEventType.Shield, "guard", 1);
        BattleEvent damage = Find(result.Events, BattleEventType.Damage, "attacker", 1);
        Require(granted != null && granted.RemainingShield == granted.Amount && granted.Amount == (int)(20 * power),
            "shield events must expose the resulting shield value", failures);
        int expectedAbsorbed = fullyAbsorbed && damage != null ? damage.Amount : 20;
        Require(damage != null && damage.Absorbed == expectedAbsorbed
            && damage.RemainingShield == (fullyAbsorbed ? granted.Amount - damage.Amount : 0),
            "damage must consume shields before health and report the absorbed amount", failures);
        Require(damage != null && damage.RemainingHp == 1000 - (damage.Amount - expectedAbsorbed),
            "remaining health must exclude shield absorption", failures);
    }

    private static void CheckActionOrderAndDeadTargets(IList<string> failures)
    {
        SkillDefinition hit = Skill("hit", SkillTargeting.LowestHpEnemy, SkillEffect.Damage, 1f, false);
        BattleResult tied = new BattleSimulator(
            new List<CharacterDefinition> { Unit("z", 10000, 1, 0, 10, hit, null), Unit("a", 10000, 1, 0, 10, hit, null) },
            new List<CharacterDefinition> { Unit("y", 10000, 1, 0, 10, hit, null), Unit("b", 10000, 1, 0, 10, hit, null) }, 12345).Run();
        List<string> order = new List<string>();
        for (int i = 0; i < tied.Events.Count; i++)
            if (tied.Events[i].Round == 1 && tied.Events[i].Type == BattleEventType.ActionStarted)
                order.Add(tied.Events[i].ActorInstanceId);
        Require(string.Join(",", order.ToArray()) == "ally:0,ally:1,enemy:0,enemy:1",
            "equal-speed turns must use stable team and slot order", failures);

        BattleResult result = new BattleSimulator(
            new List<CharacterDefinition> { Unit("first", 10000, 1000, 0, 30, hit, null), Unit("second", 10000, 1000, 0, 20, hit, null) },
            new List<CharacterDefinition> { Unit("fragile", 1, 1000, 0, 25, hit, null), Unit("survivor", 10000, 1, 0, 10, hit, null) }, 12345).Run();
        BattleEvent first = Find(result.Events, BattleEventType.Damage, "first", 1);
        BattleEvent second = Find(result.Events, BattleEventType.Damage, "second", 1);
        Require(first != null && first.TargetInstanceId == "enemy:0" && second != null
            && second.TargetInstanceId == "enemy:1", "the next actor must select a living target after an earlier target dies", failures);
        bool deadActs = false;
        bool deadTargeted = false;
        bool died = false;
        for (int i = 0; i < result.Events.Count; i++)
        {
            BattleEvent entry = result.Events[i];
            if (entry.Type == BattleEventType.UnitDied && entry.TargetInstanceId == "enemy:0") died = true;
            else if (died && entry.Type == BattleEventType.ActionStarted && entry.ActorInstanceId == "enemy:0") deadActs = true;
            else if (died && entry.Type == BattleEventType.Damage && entry.TargetInstanceId == "enemy:0") deadTargeted = true;
        }
        Require(died && !deadActs && !deadTargeted, "dead combatants must neither act nor receive later damage", failures);
    }

    private static void CheckDefeat(IList<string> failures)
    {
        SkillDefinition hit = Skill("hit", SkillTargeting.LowestHpEnemy, SkillEffect.Damage, 1f, false);
        BattleResult result = Run(Unit("weak", 1, 1, 0, 1, hit, null), Unit("strong", 1000, 100, 0, 10, hit, null));
        Require(!result.Victory && result.Rounds == 1 && result.SurvivingAllies == 0 && result.SurvivingEnemies == 1,
            "losing the final ally must produce defeat immediately", failures);
        BattleEvent death = Find(result.Events, BattleEventType.UnitDied, "weak", 1);
        Require(death != null && death.RemainingHp == 0
            && result.Events[result.Events.Count - 1].Note == "EnemyVictory", "defeat must emit death before the terminal result", failures);
    }

    private static void CheckIdentityAndInvalidSquads(IList<string> failures)
    {
        SkillDefinition hit = Skill("hit", SkillTargeting.LowestHpEnemy, SkillEffect.Damage, 1f, false);
        CharacterDefinition shared = Unit("mirror", 1000, 10, 0, 10, hit, null);
        BattleResult mirror = Run(shared, shared);
        BattleEvent damage = Find(mirror.Events, BattleEventType.Damage, "mirror", 1);
        Require(damage != null && damage.ActorDefinitionId == damage.TargetDefinitionId
            && damage.ActorInstanceId == "ally:0" && damage.TargetInstanceId == "enemy:0",
            "mirrored definitions must retain distinct combatant IDs", failures);
        ExpectArgument(delegate { new BattleSimulator(new List<CharacterDefinition> { shared, shared }, new List<CharacterDefinition> { shared }, 1); },
            "duplicate characters within a squad must be rejected", failures);
        ExpectArgument(delegate { new BattleSimulator(new List<CharacterDefinition> { null }, new List<CharacterDefinition> { shared }, 1); },
            "null squad entries must be rejected", failures);
        ExpectArgument(delegate { new BattleSimulator(new List<CharacterDefinition>(), new List<CharacterDefinition> { shared }, 1); },
            "empty squads must be rejected", failures);
        ExpectArgument(delegate { Run(Unit("invalid", 0, 10, 0, 10, hit, null), shared); },
            "nonpositive maximum health must be rejected", failures);
    }

    private static void ExpectArgument(Action action, string message, IList<string> failures)
    {
        bool rejected = false;
        try { action(); }
        catch (ArgumentException) { rejected = true; }
        Require(rejected, message, failures);
    }

    private static SkillDefinition Skill(string id, SkillTargeting target, SkillEffect effect, float power, bool cutIn)
    {
        return new SkillDefinition(id, id, target, effect, power, cutIn);
    }

    private static CharacterDefinition Unit(string id, int hp, int attack, int defense, int speed, SkillDefinition basic, SkillDefinition ultimate)
    {
        return new CharacterDefinition(id, id, "Test", hp, attack, defense, speed, basic, ultimate);
    }

    private static BattleResult Run(CharacterDefinition ally, CharacterDefinition enemy)
    {
        return new BattleSimulator(new List<CharacterDefinition> { ally }, new List<CharacterDefinition> { enemy }, 12345).Run();
    }

    private static BattleEvent Find(IList<BattleEvent> events, BattleEventType type, string actor, int round)
    {
        for (int i = 0; i < events.Count; i++)
            if (events[i].Type == type && events[i].ActorId == actor && events[i].Round == round) return events[i];
        return null;
    }

    private static bool ContainsSkillEvent(IList<BattleEvent> events)
    {
        for (int i = 0; i < events.Count; i++)
            if (events[i].Skill
                && (events[i].Type == BattleEventType.Damage
                    || events[i].Type == BattleEventType.Heal
                    || events[i].Type == BattleEventType.Shield)) return true;
        return false;
    }

    private static string Serialize(IList<BattleEvent> events)
    {
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < events.Count; i++) builder.AppendLine(events[i].ToString());
        return builder.ToString();
    }

    private static void Require(bool condition, string message, IList<string> failures)
    {
        checks++;
        if (!condition) failures.Add(message);
    }
}
