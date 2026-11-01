import { loadSkillDatabase, getHeroSkills, registerPassiveTriggers } from '../game/effects/skill-integration.mjs';
const db = loadSkillDatabase();
const skills = getHeroSkills(2020101, db);
console.log('skills', skills.length);
const u = { id: 2020101, team: 1, loc: 1, hp: 660, maxHp: 660, attack: 90, defense: 60, alive: true, buffs: [], debuffs: [], triggers: [], shield: 0 };
registerPassiveTriggers(u, db, { seed: 1 });
console.log('triggers', u.triggers.length);
for (const t of u.triggers) {
  console.log(t.sourceSkill, t.triggerType, t.effect && t.effect.effect && t.effect.effect.type);
}
EOF