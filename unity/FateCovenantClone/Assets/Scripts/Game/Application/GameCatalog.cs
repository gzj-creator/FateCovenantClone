using System;
using System.Collections.Generic;
using System.Globalization;
using FateCovenant.Battle;

namespace FateCovenant.Game
{
    public sealed class CharacterEntry
    {
        public readonly CharacterDefinition Definition;
        public readonly bool Owned;
        public readonly bool CanDeploy;
        public readonly string ModelStatus;
        public readonly string SkillStatus;
        public readonly string Source;

        internal CharacterEntry(CharacterDefinition definition, bool owned, bool deployable)
            : this(definition, owned, deployable, deployable ? "Starter squad" : "Enemy archive; not obtainable in this slice")
        {
        }

        internal CharacterEntry(CharacterDefinition definition, bool owned, bool deployable, string source)
        {
            Definition = definition;
            Owned = owned;
            CanDeploy = owned && deployable;
            ModelStatus = "Procedural joint model; visual verification pending; final art incomplete";
            int implemented = 0;
            for (int index = 0; index < definition.Skills.Count; index++)
                if (definition.Skills[index].ImplementationStatus != "MetadataOnly") implemented++;
            SkillStatus = definition.Skills.Count.ToString(CultureInfo.InvariantCulture) + " catalog skills; "
                + implemented.ToString(CultureInfo.InvariantCulture) + " executable definitions";
            Source = source;
        }
    }

    public static class GameCatalog
    {
        public const string RulesVersion = "slice-prototype-v1";
        public const string StageId = "arena_01";
        public const int VictoryCoins = 100;

        public static IList<CharacterEntry> Create(IList<string> owned)
        {
            List<CharacterEntry> entries = new List<CharacterEntry>();
            foreach (CharacterDefinition definition in BattleCatalog.CreateAllies())
                entries.Add(new CharacterEntry(definition, owned.Contains(definition.Id), true));
            foreach (CharacterDefinition definition in BattleCatalog.CreateEnemies())
                entries.Add(new CharacterEntry(definition, owned.Contains(definition.Id), false));
            return entries.AsReadOnly();
        }

        public static IList<CharacterEntry> CreateArchive(CharacterSkillCatalog catalog, IList<string> owned)
        {
            if (catalog == null) throw new ArgumentNullException("catalog");
            List<CharacterEntry> entries = new List<CharacterEntry>();
            for (int index = 0; index < catalog.CatalogCharacters.Count; index++)
            {
                CharacterDefinition definition = catalog.CatalogCharacters[index];
                entries.Add(new CharacterEntry(
                    definition,
                    owned != null && owned.Contains(definition.Id),
                    false,
                    "Decoded HeroTable.Hero; catalog-visible"));
            }
            return entries.AsReadOnly();
        }

        public static string DescribeSkill(SkillDefinition skill)
        {
            if (skill == null) return "No skill configured.";
            if (!string.IsNullOrEmpty(skill.Description)) return skill.Description;
            string target;
            switch (skill.Targeting)
            {
                case SkillTargeting.AllEnemies: target = "all living enemies"; break;
                case SkillTargeting.AllFrontEnemies: target = "all living front-row enemies"; break;
                case SkillTargeting.AllBackEnemies: target = "all living back-row enemies"; break;
                case SkillTargeting.RandomEnemy: target = "a deterministic random living enemy"; break;
                case SkillTargeting.HighestAttackEnemy: target = "the living enemy with the highest attack"; break;
                case SkillTargeting.LowestHpAlly: target = "the living ally with the lowest HP ratio"; break;
                case SkillTargeting.AllAllies: target = "all living allies"; break;
                case SkillTargeting.Self: target = "self"; break;
                default: target = "the living enemy with the lowest HP ratio"; break;
            }
            string power = skill.Power.ToString("0.##", CultureInfo.InvariantCulture);
            if (skill.Effect == SkillEffect.Heal)
                return "Restore ATK x " + power + " HP to " + target + " (capped at max HP).";
            if (skill.Effect == SkillEffect.Shield)
                return "Grant ATK x " + power + " shield to " + target + "; keeps the larger existing shield.";
            if (skill.Effect == SkillEffect.Status)
                return "Apply " + skill.Actions.Count.ToString(CultureInfo.InvariantCulture)
                    + " status or utility actions to " + target + ".";
            return "Deal damage to " + target + " at power " + power
                + ". Prototype base: round(ATK x 2.6) - floor(DEF x 0.5), minimum 1; +/-5% variance and 10% critical chance.";
        }

        internal static List<string> StarterIds()
        {
            List<string> result = new List<string>();
            foreach (CharacterDefinition definition in BattleCatalog.CreateAllies()) result.Add(definition.Id);
            return result;
        }

        internal static List<string> EnemyIds()
        {
            List<string> result = new List<string>();
            foreach (CharacterDefinition definition in BattleCatalog.CreateEnemies()) result.Add(definition.Id);
            return result;
        }

        internal static IList<CharacterDefinition> Resolve(IList<string> ids, bool allies)
        {
            IList<CharacterDefinition> definitions = allies ? BattleCatalog.CreateAllies() : BattleCatalog.CreateEnemies();
            List<CharacterDefinition> result = new List<CharacterDefinition>();
            foreach (string id in ids)
            {
                CharacterDefinition match = null;
                foreach (CharacterDefinition definition in definitions) if (definition.Id == id) match = definition;
                if (match == null) throw new InvalidOperationException("Unknown character in battle snapshot: " + id);
                result.Add(match);
            }
            return result.AsReadOnly();
        }
    }
}
