const fs = require('fs');
const FILE = 'F:/projects/FateCovenantClone/personal-server/config/skill-database.json';
const db = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const hero = db.heroes.find(h => h.id === 3010301);

function mkEffect(targetType, effectObj, durationType='permanent', rounds=0) {
  return { target: { targetType }, effect: effectObj, duration: { durationType, rounds }, chance: 1 };
}
function mkTrig(triggerType, effectObj, opts={}) {
  return {
    triggerType, condition: null, conditionKey: opts.conditionKey || null,
    cooldown: 0, maxTriggers: opts.maxTriggers || 0,
    oncePerBattle: !!opts.oncePerBattle, oncePerRound: !!opts.oncePerRound,
    effect: effectObj, priority: 0, chance: opts.chance || 1,
  };
}
function setSkill(sid, patch) {
  const s = hero.skills.find(x => x.id === sid);
  const impl = s.implementation = s.implementation || {};
  for (const k of ['ability','abilityDes','source','resolvedAbility','resolvedDescription','catalogTypeMatch']) {
    if (impl[k] !== undefined && patch[k] === undefined) patch[k] = impl[k];
  }
  Object.assign(impl, patch);
  if (patch.effects) impl.effects = patch.effects;
  if (patch.triggers) impl.triggers = patch.triggers;
}

// 331030171 重击
setSkill('331030171', {
  effectType:'stat-modifier', targetType:'self', energyCost:0,
  effects:[ mkEffect('self', {type:'stat-modifier',statType:'damage-bonus',magnitude:0.05,isPercentage:true}) ],
  triggers:[ mkTrig('on-round-start', {target:{targetType:'self'},effect:{type:'stat-modifier',statType:'damage-bonus',magnitude:0.05,isPercentage:true},duration:{durationType:'permanent',rounds:0},chance:1}, {oncePerBattle:true,maxTriggers:1}) ],
  notes:'Mastery: final damage bonus +5% on battle start.',
});

// 331030172 无畏
setSkill('331030172', {
  effectType:'stat-modifier', targetType:'self', energyCost:0,
  effects:[ mkEffect('self', {type:'stat-modifier',statType:'attack-percent',magnitude:0.05,isPercentage:true}) ],
  triggers:[ mkTrig('on-round-start', {target:{targetType:'self'},effect:{type:'stat-modifier',statType:'attack-percent',magnitude:0.05,isPercentage:true},duration:{durationType:'permanent',rounds:0},chance:1}, {oncePerBattle:true,maxTriggers:1}) ],
  notes:'Mastery: attack +5% on battle start.',
});

// 331030173 弱点洞悉
setSkill('331030173', {
  effectType:'stat-modifier', targetType:'self', energyCost:0,
  effects:[
    mkEffect('self', {type:'stat-modifier',statType:'ignore-defense',magnitude:0.05,isPercentage:true}),
    mkEffect('self', {type:'stat-modifier',statType:'hit-rate',magnitude:0.10,isPercentage:true}),
  ],
  triggers:[
    mkTrig('on-round-start', {target:{targetType:'self'},effect:{type:'stat-modifier',statType:'ignore-defense',magnitude:0.05,isPercentage:true},duration:{durationType:'permanent',rounds:0},chance:1}, {oncePerBattle:true,maxTriggers:1}),
    mkTrig('on-round-start', {target:{targetType:'self'},effect:{type:'stat-modifier',statType:'hit-rate',magnitude:0.10,isPercentage:true},duration:{durationType:'permanent',rounds:0},chance:1}, {oncePerBattle:true,maxTriggers:1}),
  ],
  notes:'Mastery: ignore defense +5% and hit rate +10% on battle start.',
});

// 331030174 会心一击
const eA = {target:{targetType:'self'},effect:{type:'stat-modifier',statType:'ignore-defense',magnitude:0.05,isPercentage:true},duration:{durationType:'timed',rounds:1},chance:1};
const eB = {target:{targetType:'self'},effect:{type:'stat-modifier',statType:'damage-bonus',magnitude:0.05,isPercentage:true},duration:{durationType:'timed',rounds:1},chance:1};
setSkill('331030174', {
  effectType:'stat-modifier', targetType:'self', energyCost:0,
  effects:[
    mkEffect('self', {type:'stat-modifier',statType:'ignore-defense',magnitude:0.05,isPercentage:true}, 'timed', 1),
    mkEffect('self', {type:'stat-modifier',statType:'damage-bonus',magnitude:0.05,isPercentage:true}, 'timed', 1),
  ],
  triggers:[
    mkTrig('on-attack', JSON.parse(JSON.stringify(eA))),
    mkTrig('on-attack', JSON.parse(JSON.stringify(eB))),
    mkTrig('on-skill-use', JSON.parse(JSON.stringify(eA))),
    mkTrig('on-skill-use', JSON.parse(JSON.stringify(eB))),
  ],
  notes:'Mastery: on normal/skill, extra ignore defense 5% and final damage 5% for 1 round.',
});

// 331030175 充能暴击
setSkill('331030175', {
  effectType:'stat-modifier', targetType:'self', energyCost:0,
  effects:[
    mkEffect('self', {type:'stat-modifier',statType:'crit-rate',magnitude:0.20,isPercentage:true}),
    mkEffect('self', {type:'stat-modifier',statType:'crit-damage',magnitude:0.50,isPercentage:true}),
  ],
  triggers:[
    mkTrig('on-ultimate-use', {target:{targetType:'self'},effect:{type:'stat-modifier',statType:'crit-rate',magnitude:0.20,isPercentage:true},duration:{durationType:'permanent',rounds:0},chance:1}, {maxTriggers:3}),
    mkTrig('on-ultimate-use', {target:{targetType:'self'},effect:{type:'stat-modifier',statType:'crit-damage',magnitude:0.50,isPercentage:true},duration:{durationType:'permanent',rounds:0},chance:1}, {maxTriggers:3}),
  ],
  notes:'Mastery: first 3 ultimates, crit rate +20% and crit damage +50%.',
});

// 120001026 突破4
setSkill('120001026', {
  effectType:'energy', targetType:'self', energyCost:0,
  effects:[ mkEffect('self', {type:'energy',energyType:'gain',magnitude:600}, 'instant', 0) ],
  triggers:[ mkTrig('on-round-start', {target:{targetType:'self'},effect:{type:'energy',energyType:'gain',magnitude:600},duration:{durationType:'instant',rounds:0},chance:1}, {oncePerBattle:true,maxTriggers:1}) ],
  notes:'Passive: initial energy +600 on battle start.',
});

// 120000018 破盾
setSkill('120000018', {
  effectType:'stat-modifier', targetType:'self', energyCost:0,
  effects:[ mkEffect('self', {type:'stat-modifier',statType:'damage-bonus',magnitude:0.15,isPercentage:true}) ],
  triggers:[ mkTrig('on-round-start', {target:{targetType:'self'},effect:{type:'stat-modifier',statType:'damage-bonus',magnitude:0.15,isPercentage:true},duration:{durationType:'permanent',rounds:0},chance:1}, {oncePerBattle:true,maxTriggers:1}) ],
  notes:'Passive: damage to defender-type adventurers +15% (approximated; defender-type condition not enforced).',
});

// 120000019 锋刃
setSkill('120000019', {
  effectType:'stat-modifier', targetType:'self', energyCost:0,
  effects:[ mkEffect('self', {type:'stat-modifier',statType:'damage-bonus',magnitude:0.30,isPercentage:true}) ],
  triggers:[ mkTrig('on-round-start', {target:{targetType:'self'},effect:{type:'stat-modifier',statType:'damage-bonus',magnitude:0.30,isPercentage:true},duration:{durationType:'permanent',rounds:0},chance:1}, {oncePerBattle:true,maxTriggers:1}) ],
  notes:'Passive: normal/skill damage +30%.',
});

// 120000023 激怒
setSkill('120000023', {
  effectType:'energy', targetType:'self', energyCost:0,
  effects:[ mkEffect('self', {type:'energy',energyType:'gain',magnitude:100}, 'instant', 0) ],
  triggers:[
    mkTrig('on-attack', {target:{targetType:'self'},effect:{type:'energy',energyType:'gain',magnitude:100},duration:{durationType:'instant',rounds:0},chance:1}),
    mkTrig('on-skill-use', {target:{targetType:'self'},effect:{type:'energy',energyType:'gain',magnitude:100},duration:{durationType:'instant',rounds:0},chance:1}),
  ],
  notes:'Passive: on normal/skill, extra 100 energy.',
});

// 120000025 戒备
setSkill('120000025', {
  effectType:'stat-modifier', targetType:'self', energyCost:0,
  effects:[ mkEffect('self', {type:'stat-modifier',statType:'crit-resistance',magnitude:0.30,isPercentage:true}) ],
  triggers:[
    mkTrig('on-round-start', {target:{targetType:'self'},effect:{type:'stat-modifier',statType:'crit-resistance',magnitude:0.30,isPercentage:true},duration:{durationType:'permanent',rounds:0},chance:1}, {oncePerBattle:true,maxTriggers:1}),
    mkTrig('on-buff-gain', {target:{targetType:'self'},effect:{type:'stat-modifier',statType:'crit-resistance',magnitude:0.30,isPercentage:true},duration:{durationType:'permanent',rounds:0},chance:1}),
  ],
  notes:'Passive: when has buff, crit resistance +30%.',
});

// 120000028 鹰眼
setSkill('120000028', {
  effectType:'stat-modifier', targetType:'self', energyCost:0,
  effects:[ mkEffect('self', {type:'stat-modifier',statType:'hit-rate',magnitude:0.15,isPercentage:true}) ],
  triggers:[ mkTrig('on-round-start', {target:{targetType:'self'},effect:{type:'stat-modifier',statType:'hit-rate',magnitude:0.15,isPercentage:true},duration:{durationType:'permanent',rounds:0},chance:1}, {oncePerBattle:true,maxTriggers:1,conditionKey:'hp-above-50'}) ],
  notes:'Passive: HP above 50%, hit rate +15%.',
});

// 120001004 爆裂一击
setSkill('120001004', {
  effectType:'stat-modifier', targetType:'self', energyCost:0,
  effects:[ mkEffect('self', {type:'stat-modifier',statType:'crit-rate',magnitude:1.0,isPercentage:true}) ],
  triggers:[ mkTrig('on-ultimate-use', {target:{targetType:'self'},effect:{type:'stat-modifier',statType:'crit-rate',magnitude:1.0,isPercentage:true},duration:{durationType:'permanent',rounds:0},chance:1}, {oncePerBattle:true,maxTriggers:1}) ],
  notes:'Passive: first ultimate, final crit rate +100%.',
});

// 6910001042 Ultimate
setSkill('6910001042', {
  effectType:'damage', targetType:'single', energyCost:0,
  effects:[ {target:{targetType:'single'},effect:{type:'damage',damageType:'physical',multiplier:2,canCrit:true},duration:{durationType:'instant',rounds:0},chance:1} ],
  triggers:[],
  notes:'Ultimate: metadata fallback (missing description). Implemented as generic 2.0x physical damage single target (requires investigation).',
  requiresInvestigation: true,
});

// normal-profession-2
const ns = hero.skills.find(x => x.id === 'normal-profession-2');
ns.implementation = {
  fallback: true, source:'project-fallback', resolvedAbility:false, resolvedDescription:false,
  ability:null, abilityDes:null,
  effectType:'damage', targetType:'single', energyCost:0,
  effects:[ {target:{targetType:'single'},effect:{type:'damage',damageType:'physical',multiplier:1,canCrit:true},duration:{durationType:'instant',rounds:0},chance:1} ],
  triggers:[], notes:'Project fallback basic attack.',
};

fs.writeFileSync(FILE, JSON.stringify(db, null, 2), 'utf8');
console.log('done');
PY