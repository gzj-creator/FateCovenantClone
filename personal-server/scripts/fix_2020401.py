import json
path = 'F:/projects/FateCovenantClone/personal-server/config/skill-database.json'
db = json.load(open(path, encoding='utf-8'))
h = next(x for x in db['heroes'] if x['id'] == 2020401)

def j(o):
    import copy; return copy.deepcopy(o)

def mk_stat(stat_type, mag, trigger, once, maxtrig, cond, dur, rounds):
    eff = {"target":{"targetType":"self"},"effect":{"type":"stat-modifier","statType":stat_type,"magnitude":mag,"isPercentage":True},"duration":{"durationType":dur,"rounds":rounds},"chance":1}
    trig = {"triggerType":trigger,"condition":None,"conditionKey":cond,"cooldown":0,"maxTriggers":maxtrig,"oncePerBattle":once,"oncePerRound":False,"effect":j(eff),"priority":0,"chance":1}
    return {"effectType":"stat-modifier","targetType":"self","energyCost":0,"effects":[j(eff)],"triggers":[trig]}

def mk_energy(mag, trigs):
    eff = {"target":{"targetType":"self"},"effect":{"type":"energy","energyType":"gain","magnitude":mag},"duration":{"durationType":"instant","rounds":0},"chance":1}
    triggers = [{"triggerType":t,"condition":None,"conditionKey":None,"cooldown":0,"maxTriggers":0,"oncePerBattle":False,"oncePerRound":False,"effect":j(eff),"priority":0,"chance":1} for t in trigs]
    return {"effectType":"energy","targetType":"self","energyCost":0,"effects":[j(eff)],"triggers":triggers}

# normal
normal = next(s for s in h['skills'] if s['id']=='normal-profession-2')
normal['implementation'] = {
  "fallback":True,"source":"project-fallback","resolvedAbility":False,"resolvedDescription":False,"ability":None,"abilityDes":None,
  "effectType":"damage","targetType":"single","energyCost":0,
  "effects":[{"target":{"targetType":"single"},"effect":{"type":"damage","damageType":"physical","multiplier":1,"variance":1,"canCrit":True},"duration":{"durationType":"instant","rounds":0},"chance":1}],
  "triggers":[],"notes":"Project fallback basic attack."
}

# 322040171
s = next(x for x in h['skills'] if x['id']=='322040171')
s['implementation'].update(mk_stat('damage-bonus',0.05,'on-round-start',True,1,None,'permanent',0))

# 322040172
s = next(x for x in h['skills'] if x['id']=='322040172')
s['implementation'].update(mk_stat('attack-percent',0.05,'on-round-start',True,1,None,'permanent',0))

# 322040173
s = next(x for x in h['skills'] if x['id']=='322040173')
effA = {"target":{"targetType":"self"},"effect":{"type":"stat-modifier","statType":"ignore-defense","magnitude":0.05,"isPercentage":True},"duration":{"durationType":"permanent","rounds":0},"chance":1}
effB = {"target":{"targetType":"self"},"effect":{"type":"stat-modifier","statType":"hit-rate","magnitude":0.10,"isPercentage":True},"duration":{"durationType":"permanent","rounds":0},"chance":1}
trigA = {"triggerType":"on-round-start","condition":None,"conditionKey":None,"cooldown":0,"maxTriggers":1,"oncePerBattle":True,"oncePerRound":False,"effect":j(effA),"priority":0,"chance":1}
trigB = {"triggerType":"on-round-start","condition":None,"conditionKey":None,"cooldown":0,"maxTriggers":1,"oncePerBattle":True,"oncePerRound":False,"effect":j(effB),"priority":0,"chance":1}
s['implementation'].update({"effectType":"stat-modifier","targetType":"self","energyCost":0,"effects":[j(effA),j(effB)],"triggers":[trigA,trigB]})

# 322040174
s = next(x for x in h['skills'] if x['id']=='322040174')
eff4 = {"target":{"targetType":"self"},"effect":{"type":"stat-modifier","statType":"status-hit","magnitude":0.30,"isPercentage":True},"duration":{"durationType":"timed","rounds":1},"chance":1}
trig4a = {"triggerType":"on-attack","condition":None,"conditionKey":None,"cooldown":0,"maxTriggers":0,"oncePerBattle":False,"oncePerRound":False,"effect":j(eff4),"priority":0,"chance":1}
trig4b = {"triggerType":"on-skill-use","condition":None,"conditionKey":None,"cooldown":0,"maxTriggers":0,"oncePerBattle":False,"oncePerRound":False,"effect":j(eff4),"priority":0,"chance":1}
s['implementation'].update({"effectType":"stat-modifier","targetType":"self","energyCost":0,"effects":[j(eff4)],"triggers":[trig4a,trig4b],"notes":"Mastery: after normal/skill, self status-hit +30% for 1 round."})

# 322040175
s = next(x for x in h['skills'] if x['id']=='322040175')
eff5 = {"target":{"targetType":"self"},"effect":{"type":"stat-modifier","statType":"hit-rate","magnitude":0.10,"isPercentage":True},"duration":{"durationType":"permanent","rounds":0},"chance":1}
trig5 = {"triggerType":"on-round-start","condition":None,"conditionKey":None,"cooldown":0,"maxTriggers":1,"oncePerBattle":True,"oncePerRound":False,"effect":j(eff5),"priority":0,"chance":1}
s['implementation'].update({"effectType":"stat-modifier","targetType":"self","energyCost":0,"effects":[j(eff5)],"triggers":[trig5],"requiresInvestigation":True,"notes":"Mastery: 焦热 additionally lowers enemy final evasion 10%; evasion stat not supported, approximated as self hit-rate +10% (requiresInvestigation)."})

# 120001026
s = next(x for x in h['skills'] if x['id']=='120001026')
impl = mk_energy(600, ['on-round-start'])
impl['triggers'][0]['oncePerBattle'] = True
impl['triggers'][0]['maxTriggers'] = 1
s['implementation'].update(impl)

# 120000018
s = next(x for x in h['skills'] if x['id']=='120000018')
s['implementation'].update(mk_stat('damage-bonus',0.15,'on-round-start',True,1,None,'permanent',0))

# 120000019
s = next(x for x in h['skills'] if x['id']=='120000019')
s['implementation'].update(mk_stat('damage-bonus',0.30,'on-round-start',True,1,None,'permanent',0))

# 120000023
s = next(x for x in h['skills'] if x['id']=='120000023')
s['implementation'].update(mk_energy(100, ['on-attack','on-skill-use']))

# 120000025
s = next(x for x in h['skills'] if x['id']=='120000025')
effP5 = {"target":{"targetType":"self"},"effect":{"type":"stat-modifier","statType":"crit-resistance","magnitude":0.30,"isPercentage":True},"duration":{"durationType":"permanent","rounds":0},"chance":1}
trigP5a = {"triggerType":"on-round-start","condition":None,"conditionKey":None,"cooldown":0,"maxTriggers":1,"oncePerBattle":True,"oncePerRound":False,"effect":j(effP5),"priority":0,"chance":1}
trigP5b = {"triggerType":"on-buff-gain","condition":None,"conditionKey":None,"cooldown":0,"maxTriggers":0,"oncePerBattle":False,"oncePerRound":False,"effect":j(effP5),"priority":0,"chance":1}
s['implementation'].update({"effectType":"stat-modifier","targetType":"self","energyCost":0,"effects":[j(effP5)],"triggers":[trigP5a,trigP5b],"notes":"Passive: when self has buff, crit-resistance +30% (buff condition approximated)."})

# 120000028
s = next(x for x in h['skills'] if x['id']=='120000028')
effP6 = {"target":{"targetType":"self"},"effect":{"type":"stat-modifier","statType":"hit-rate","magnitude":0.15,"isPercentage":True},"duration":{"durationType":"permanent","rounds":0},"chance":1}
trigP6 = {"triggerType":"on-round-start","condition":None,"conditionKey":"hp-above-50","cooldown":0,"maxTriggers":1,"oncePerBattle":True,"oncePerRound":False,"effect":j(effP6),"priority":0,"chance":1}
s['implementation'].update({"effectType":"stat-modifier","targetType":"self","energyCost":0,"effects":[j(effP6)],"triggers":[trigP6],"notes":"Passive: when HP > 50%, hit-rate +15%."})

# 120001008
s = next(x for x in h['skills'] if x['id']=='120001008')
effP7 = {"target":{"targetType":"self"},"effect":{"type":"stat-modifier","statType":"damage-bonus","magnitude":0.30,"isPercentage":True},"duration":{"durationType":"permanent","rounds":0},"chance":1}
trigP7 = {"triggerType":"on-ultimate-use","condition":None,"conditionKey":None,"cooldown":0,"maxTriggers":0,"oncePerBattle":False,"oncePerRound":False,"effect":j(effP7),"priority":0,"chance":1}
s['implementation'].update({"effectType":"stat-modifier","targetType":"self","energyCost":0,"effects":[j(effP7)],"triggers":[trigP7],"requiresInvestigation":True,"notes":"Passive: ultimate damage to highest-HP enemy +30%; target-HP condition not enforced (requiresInvestigation)."})

# 6910001025
s = next(x for x in h['skills'] if x['id']=='6910001025')
s['implementation'].update({
  "source": s['implementation'].get('source'),
  "resolvedAbility": True,
  "resolvedDescription": False,
  "ability": s['implementation'].get('ability'),
  "abilityDes": None,
  "catalogTypeMatch": None,
  "effectType":"damage","targetType":"single","energyCost":0,
  "effects":[{"target":{"targetType":"single"},"effect":{"type":"damage","damageType":"physical","multiplier":2,"variance":1,"canCrit":True},"duration":{"durationType":"instant","rounds":0},"chance":1}],
  "triggers":[],
  "requiresInvestigation": True,
  "notes":"Ultimate, metadata fallback -> 2.0x physical damage single (requiresInvestigation)."
})

json.dump(db, open(path,'w',encoding='utf-8'), ensure_ascii=False, indent=2)
print('done')
PY