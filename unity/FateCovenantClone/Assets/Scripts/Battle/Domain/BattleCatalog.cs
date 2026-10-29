using System.Collections.Generic;

namespace FateCovenant.Battle
{
    public static class BattleCatalog
    {
        public static IList<CharacterDefinition> CreateAllies()
        {
            SkillDefinition bladeBasic = new SkillDefinition(
                "blade_basic", "Cross Slash", SkillTargeting.LowestHpEnemy, SkillEffect.Damage, 1.0f, false);
            SkillDefinition bladeUltimate = new SkillDefinition(
                "blade_ultimate", "Crimson Sweep", SkillTargeting.AllEnemies, SkillEffect.Damage, 1.35f, true);

            SkillDefinition bulwarkBasic = new SkillDefinition(
                "bulwark_basic", "Shield Bash", SkillTargeting.LowestHpEnemy, SkillEffect.Damage, 0.85f, false);
            SkillDefinition bulwarkUltimate = new SkillDefinition(
                "bulwark_ultimate", "Star Aegis", SkillTargeting.Self, SkillEffect.Shield, 4.0f, true);

            SkillDefinition sproutBasic = new SkillDefinition(
                "sprout_basic", "Petal Shot", SkillTargeting.LowestHpEnemy, SkillEffect.Damage, 0.8f, false);
            SkillDefinition sproutUltimate = new SkillDefinition(
                "sprout_ultimate", "Bloom Ward", SkillTargeting.LowestHpAlly, SkillEffect.Heal, 2.2f, true);

            return new List<CharacterDefinition>
            {
                new CharacterDefinition(
                    "ally_blade", "Blade", "Damage", 900, 142, 42, 120, bladeBasic, bladeUltimate),
                new CharacterDefinition(
                    "ally_sprout", "Sprout", "Support", 750, 104, 34, 105, sproutBasic, sproutUltimate),
                new CharacterDefinition(
                    "ally_bulwark", "Bulwark", "Tank", 1300, 88, 82, 90, bulwarkBasic, bulwarkUltimate)
            };
        }

        public static IList<CharacterDefinition> CreateEnemies()
        {
            SkillDefinition axeBasic = new SkillDefinition(
                "axe_basic", "Cleave", SkillTargeting.LowestHpEnemy, SkillEffect.Damage, 0.95f, false);
            SkillDefinition axeUltimate = new SkillDefinition(
                "axe_ultimate", "Rampage", SkillTargeting.LowestHpEnemy, SkillEffect.Damage, 1.8f, true);

            SkillDefinition bowBasic = new SkillDefinition(
                "bow_basic", "Quick Shot", SkillTargeting.LowestHpEnemy, SkillEffect.Damage, 0.9f, false);
            SkillDefinition bowUltimate = new SkillDefinition(
                "bow_ultimate", "Rain of Arrows", SkillTargeting.AllEnemies, SkillEffect.Damage, 0.9f, true);

            SkillDefinition chiefBasic = new SkillDefinition(
                "chief_basic", "Heavy Blow", SkillTargeting.LowestHpEnemy, SkillEffect.Damage, 1.0f, false);
            SkillDefinition chiefUltimate = new SkillDefinition(
                "chief_ultimate", "Warcry", SkillTargeting.Self, SkillEffect.Shield, 3.5f, true);

            return new List<CharacterDefinition>
            {
                new CharacterDefinition(
                    "enemy_axe", "Raider", "Damage", 600, 112, 32, 108, axeBasic, axeUltimate),
                new CharacterDefinition(
                    "enemy_bow", "Archer", "Damage", 500, 120, 24, 116, bowBasic, bowUltimate),
                new CharacterDefinition(
                    "enemy_chief", "Chief", "Tank", 950, 96, 68, 86, chiefBasic, chiefUltimate)
            };
        }
    }
}
