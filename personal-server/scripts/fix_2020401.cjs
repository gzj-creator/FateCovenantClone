const fs = require('fs');
const path = 'F:/projects/FateCovenantClone/personal-server/config/skill-database.json';
const db = JSON.parse(fs.readFileSync(path,'utf8'));
const h = db.heroes.find(x=>x.id===2020401);
if(!h){ console.error('hero not found'); process.exit(1); }

function j(o){ return JSON.parse(JSON.stringify(o)); }

function mkStat(statType, mag, trigger, once, maxtrig, cond, dur, rounds) {
  const eff = {target:{targetType:'self'},effect:{type:'stat-modifier',statType,magnitude:mag,isPercentage:true},duration:{durationType:dur,rounds},chance:1};
  const trig = {triggerType:trigger,condition:null,conditionKey:cond,cooldown:0,maxTriggers:maxtrig,oncePerBattle:once,oncePerRound:false,effect:j(eff),priority:0,chance:1};
  return {effectType:'stat-modifier',targetType:'self',energyCost:0,effects:[j(eff)],triggers:[trig]};
}

function mkEnergy(mag, trigs) {
  const eff = {target:{targetType:'self'},effect:{type:'energy',energyType:'gain',magnitude:mag},duration:{durationType:'instant',rounds:0},chance:1};
  const triggers = trigs.map(t=>({triggerType:t,condition:null,conditionKey:null,cooldown:0,maxTriggers:0,oncePerBattle:false,oncePerRound:false,effect:j(eff),priority:0,chance:1}));
  return {effectType:'energy',targetType:'self',energyCost:0,effects:[j(eff)],triggers};
}

const normal = h.skills.find(s=>s.id==='normal-profession-2');
Object.assign(normal.implementation, {fallback:true,source:'project-fallback',resolvedAbility:false,resolvedDescription:false,ability:null,abilityDes:null,effectType:'damage',targetType:'single',energyCost:0,effects:[{target:{targetType:'single'},effect:{type:'damage',damageType:'physical',multiplier:1,variance:1,canCrit:true},duration:{durationType:'instant',rounds:0},chance:1}],triggers:[],notes:'Project fallback basic attack.'});

let s = h.skills.find(x=>x.id==='322040171');
Object.assign(s.implementation, mkStat('damage-bonus',0.05,'on-round-start',true,1,null,'permanent',0));

s = h.skills.find(x=>x.id==='322040172');
Object.assign(s.implementation, mkStat('attack-percent',0.05,'on-round-start',true,1,null,'permanent',0));

s = h.skills.find(x=>x.id==='322040173');
const effA = {target:{targetType:'self'},effect:{type:'stat-modifier',statType:'ignore-defense',magnitude:0.05,isPercentage:true},duration:{durationType:'permanent',rounds:0},chance:1};
const effB = {target:{targetType:'self'},effect:{type:'stat-modifier',statType:'hit-rate',magnitude:0.10,isPercentage:true},duration:{durationType:'permanent',rounds:0},chance:1};
const trigA = {triggerType:'on-round-start',condition:null,conditionKey:null,cooldown:0,maxTriggers:1,oncePerBattle:true,oncePerRound:false,effect:j(effA),priority:0,chance:1};
const trigB = {triggerType:'on-round-start',condition:null,conditionKey:null,cooldown:0,maxTriggers:1,oncePerBattle:true,oncePerRound:false,effect:j(effB),priority:0,chance:1};
Object.assign(s.implementation, {effectType:'stat-modifier',targetType:'self',energyCost:0,effects:[j(effA),j(effB)],triggers:[trigA,trigB]});

s = h.skills.find(x=>x.id==='322040174');
const eff4 = {target:{targetType:'self'},effect:{type:'stat-modifier',statType:'status-hit',magnitude:0.30,isPercentage:true},duration:{durationType:'timed',rounds:1},chance:1};
const trig4a = {triggerType:'on-attack',condition:null,conditionKey:null,cooldown:0,maxTriggers:0,oncePerBattle:false,oncePerRound:false,effect:j(eff4),priority:0,chance:1};
const trig4b = {triggerType:'on-skill-use',condition:null,conditionKey:null,cooldown:0,maxTriggers:0,oncePerBattle:false,oncePerRound:false,effect:j(eff4),priority:0,chance:1};
Object.assign(s.implementation, {effectType:'stat-modifier',targetType:'self',energyCost:0,effects:[j(eff4)],triggers:[trig4a,trig4b],notes:'Mastery: after normal/skill, self status-hit +30% for 1 round.'});

s = h.skills.find(x=>x.id==='322040175');
const eff5 = {target:{targetType:'self'},effect:{type:'stat-modifier',statType:'hit-rate',magnitude:0.10,isPercentage:true},duration:{durationType:'permanent',rounds:0},chance:1};
const trig5 = {triggerType:'on-round-start',condition:null,conditionKey:null,cooldown:0,maxTriggers:1,oncePerBattle:true,oncePerRound:false,effect:j(eff5),priority:0,chance:1};
Object.assign(s.implementation, {effectType:'stat-modifier',targetType:'self',energyCost:0,effects:[j(eff5)],triggers:[trig5],requiresInvestigation:true,notes:'Mastery: 焦热 additionally lowers enemy final evasion 10%; evasion stat not supported, approximated as self hit-rate +10% (requiresInvestigation).'});

s = h.skills.find(x=>x.id==='120001026');
const implP1 = mkEnergy(600,['on-round-start']);
implP1.triggers[0].oncePerBattle=true;
implP1.triggers[0].maxTriggers=1;
Object.assign(s.implementation, implP1);

s = h.skills.find(x=>x.id==='120000018');
Object.assign(s.implementation, mkStat('damage-bonus',0.15,'on-round-start',true,1,null,'permanent',0));

s = h.skills.find(x=>x.id==='120000019');
Object.assign(s.implementation, mkStat('damage-bonus',0.30,'on-round-start',true,1,null,'permanent',0));

s = h.skills.find(x=>x.id==='120000023');
Object.assign(s.implementation, mkEnergy(100,['on-attack','on-skill-use']));

s = h.skills.find(x=>x.id==='120000025');
const effP5 = {target:{targetType:'self'},effect:{type:'stat-modifier',statType:'crit-resistance',magnitude:0.30,isPercentage:true},duration:{durationType:'permanent',rounds:0},chance:1};
const trigP5a = {triggerType:'on-round-start',condition:null,conditionKey:null,cooldown:0,maxTriggers:1,oncePerBattle:true,oncePerRound:false,effect:j(effP5),priority:0,chance:1};
const trigP5b = {triggerType:'on-buff-gain',condition:null,conditionKey:null,cooldown:0,maxTriggers:0,oncePerBattle:false,oncePerRound:false,effect:j(effP5),priority:0,chance:1};
Object.assign(s.implementation, {effectType:'stat-modifier',targetType:'self',energyCost:0,effects:[j(effP5)],triggers:[trigP5a,trigP5b],notes:'Passive: when self has buff, crit-resistance +30% (buff condition approximated).'});

s = h.skills.find(x=>x.id==='120000028');
const effP6 = {target:{targetType:'self'},effect:{type:'stat-modifier',statType:'hit-rate',magnitude:0.15,isPercentage:true},duration:{durationType:'permanent',rounds:0},chance:1};
const trigP6 = {triggerType:'on-round-start',condition:null,conditionKey:'hp-above-50',cooldown:0,maxTriggers:1,oncePerBattle:true,oncePerRound:false,effect:j(effP6),priority:0,chance:1};
Object.assign(s.implementation, {effectType:'stat-modifier',targetType:'self',energyCost:0,effects:[j(effP6)],triggers:[trigP6],notes:'Passive: when HP > 50%, hit-rate +15%.'});

s = h.skills.find(x=>x.id==='120001008');
const effP7 = {target:{targetType:'self'},effect:{type:'stat-modifier',statType:'damage-bonus',magnitude:0.30,isPercentage:true},duration:{durationType:'permanent',rounds:0},chance:1};
const trigP7 = {triggerType:'on-ultimate-use',condition:null,conditionKey:null,cooldown:0,maxTriggers:0,oncePerBattle:false,oncePerRound:false,effect:j(effP7),priority:0,chance:1};
Object.assign(s.implementation, {effectType:'stat-modifier',targetType:'self',energyCost:0,effects:[j(effP7)],triggers:[trigP7],requiresInvestigation:true,notes:'Passive: ultimate damage to highest-HP enemy +30%; target-HP condition not enforced (requiresInvestigation).'});

s = h.skills.find(x=>x.id==='6910001025');
Object.assign(s.implementation, {source:s.implementation.source,resolvedAbility:true,resolvedDescription:false,ability:s.implementation.ability,abilityDes:null,catalogTypeMatch:null,effectType:'damage',targetType:'single',energyCost:0,effects:[{target:{targetType:'single'},effect:{type:'damage',damageType:'physical',multiplier:2,variance:1,canCrit:true},duration:{durationType:'instant',rounds:0},chance:1}],triggers:[],requiresInvestigation:true,notes:'Ultimate, metadata fallback -> 2.0x physical damage single (requiresInvestigation).'});

fs.writeFileSync(path, JSON.stringify(db,null,2));
console.log('done');
