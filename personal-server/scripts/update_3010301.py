import json

FILE = 'F:/projects/FateCovenantClone/personal-server/config/skill-database.json'
db = json.load(open(FILE, encoding='utf-8'))
hero = next(h for h in db['heroes'] if h['id'] == 3010301)

def mk_effect(target_type, effect_obj, duration_type='permanent', rounds=0):
    return {
        "target": {"targetType": target_type},
        "effect": effect_obj,
        "duration": {"durationType": duration_type, "rounds": rounds},
        "chance": 1,
    }

def mk_trig(trigger_type, effect_obj_target, opts=None):
    opts = opts or {}
    return {
        "triggerType": trigger_type,
        "condition": None,
        "conditionKey": opts.get("conditionKey"),
        "cooldown": 0,
        "maxTriggers": opts.get("maxTriggers", 0),
        "oncePerBattle": bool(opts.get("oncePerBattle", False)),
        "oncePerRound": bool(opts.get("oncePerRound", False)),
        "effect": effect_obj_target,
        "priority": 0,
        "chance": opts.get("chance", 1),
    }

def set_skill(sid, patch):
    s = next(x for x in hero['skills'] if x['id'] == sid)
    impl = s.setdefault('implementation', {})
    for k in ['ability','abilityDes','source','resolvedAbility','resolvedDescription','catalogTypeMatch']:
        if k in impl and k not in patch:
            patch.setdefault(k, impl[k])
    impl.update(patch)
    if 'effects' in patch:
        impl['effects'] = patch['effects']
    if 'triggers' in patch:
        impl['triggers'] = patch['triggers']

# 331030171 重击
e = mk_effect('self', {"type":"stat-modifier","statType":"damage-bonus","magnitude":0.05,"isPercentage":True})
set_skill('331030171', {
    "effectType":"stat-modifier","targetType":"self","energyCost":0,
    "effects":[e],
    "triggers":[mk_trig('on-round-start', {"target":{"targetType":"self"},"effect":{"type":"stat-modifier","statType":"damage-bonus","magnitude":0.05,"isPercentage":True},"duration":{"durationType":"permanent","rounds":0},"chance":1}, {"oncePerBattle":True,"maxTriggers":1})],
    "notes":"Mastery: final damage bonus +5% on battle start.",
})

# 331030172 无畏
e = mk_effect('self', {"type":"stat-modifier","statType":"attack-percent","magnitude":0.05,"isPercentage":True})
set_skill('331030172', {
    "effectType":"stat-modifier","targetType":"self","energyCost":0,
    "effects":[e],
    "triggers":[mk_trig('on-round-start', {"target":{"targetType":"self"},"effect":{"type":"stat-modifier","statType":"attack-percent","magnitude":0.05,"isPercentage":True},"duration":{"durationType":"permanent","rounds":0},"chance":1}, {"oncePerBattle":True,"maxTriggers":1})],
    "notes":"Mastery: attack +5% on battle start.",
})

# 331030173 弱点洞悉
e1 = mk_effect('self', {"type":"stat-modifier","statType":"ignore-defense","magnitude":0.05,"isPercentage":True})
e2 = mk_effect('self', {"type":"stat-modifier","statType":"hit-rate","magnitude":0.10,"isPercentage":True})
set_skill('331030173', {
    "effectType":"stat-modifier","targetType":"self","energyCost":0,
    "effects":[e1,e2],
    "triggers":[
        mk_trig('on-round-start', {"target":{"targetType":"self"},"effect":{"type":"stat-modifier","statType":"ignore-defense","magnitude":0.05,"isPercentage":True},"duration":{"durationType":"permanent","rounds":0},"chance":1}, {"oncePerBattle":True,"maxTriggers":1}),
        mk_trig('on-round-start', {"target":{"targetType":"self"},"effect":{"type":"stat-modifier","statType":"hit-rate","magnitude":0.10,"isPercentage":True},"duration":{"durationType":"permanent","rounds":0},"chance":1}, {"oncePerBattle":True,"maxTriggers":1}),
    ],
    "notes":"Mastery: ignore defense +5% and hit rate +10% on battle start.",
})

# 331030174 会心一击
e1 = mk_effect('self', {"type":"stat-modifier","statType":"ignore-defense","magnitude":0.05,"isPercentage":True}, 'timed', 1)
e2 = mk_effect('self', {"type":"stat-modifier","statType":"damage-bonus","magnitude":0.05,"isPercentage":True}, 'timed', 1)
triggers = []
for e in [e1, e2]:
    eff_obj = {"target":{"targetType":"self"},"effect":dict(e["effect"]),"duration":{"durationType":"timed","rounds":1},"chance":1}
    triggers.append(mk_trig('on-attack', eff_obj))
    triggers.append(mk_trig('on-skill-use', eff_obj))
set_skill('331030174', {
    "effectType":"stat-modifier","targetType":"self","energyCost":0,
    "effects":[e1,e2],
    "triggers":triggers,
    "notes":"Mastery: on normal/skill, extra ignore defense 5% and final damage 5% for 1 round.",
})

# 331030175 充能暴击
e1 = mk_effect('self', {"type":"stat-modifier","statType":"crit-rate","magnitude":0.20,"isPercentage":True})
e2 = mk_effect('self', {"type":"stat-modifier","statType":"crit-damage","magnitude":0.50,"isPercentage":True})
set_skill('331030175', {
    "effectType":"stat-modifier","targetType":"self","energyCost":0,
    "effects":[e1,e2],
    "triggers":[
        mk_trig('on-ultimate-use', {"target":{"targetType":"self"},"effect":{"type":"stat-modifier","statType":"crit-rate","magnitude":0.20,"isPercentage":True},"duration":{"durationType":"permanent","rounds":0},"chance":1}, {"maxTriggers":3}),
        mk_trig('on-ultimate-use', {"target":{"targetType":"self"},"effect":{"type":"stat-modifier","statType":"crit-damage","magnitude":0.50,"isPercentage":True},"duration":{"durationType":"permanent","rounds":0},"chance":1}, {"maxTriggers":3}),
    ],
    "notes":"Mastery: first 3 ultimates, crit rate +20% and crit damage +50%.",
})

# 120001026 突破4
e = mk_effect('self', {"type":"energy","energyType":"gain","magnitude":600}, 'instant', 0)
set_skill('120001026', {
    "effectType":"energy","targetType":"self","energyCost":0,
    "effects":[e],
    "triggers":[mk_trig('on-round-start', {"target":{"targetType":"self"},"effect":{"type":"energy","energyType":"gain","magnitude":600},"duration":{"durationType":"instant","rounds":0},"chance":1}, {"oncePerBattle":True,"maxTriggers":1})],
    "notes":"Passive: initial energy +600 on battle start.",
})

# 120000018 破盾
e = mk_effect('self', {"type":"stat-modifier","statType":"damage-bonus","magnitude":0.15,"isPercentage":True})
set_skill('120000018', {
    "effectType":"stat-modifier","targetType":"self","energyCost":0,
    "effects":[e],
    "triggers":[mk_trig('on-round-start', {"target":{"targetType":"self"},"effect":{"type":"stat-modifier","statType":"damage-bonus","magnitude":0.15,"isPercentage":True},"duration":{"durationType":"permanent","rounds":0},"chance":1}, {"oncePerBattle":True,"maxTriggers":1})],
    "notes":"Passive: damage to defender-type adventurers +15% (approximated as permanent damage-bonus; defender-type condition not enforced).",
})

# 120000019 锋刃
e = mk_effect('self', {"type":"stat-modifier","statType":"damage-bonus","magnitude":0.30,"isPercentage":True})
set_skill('120000019', {
    "effectType":"stat-modifier","targetType":"self","energyCost":0,
    "effects":[e],
    "triggers":[mk_trig('on-round-start', {"target":{"targetType":"self"},"effect":{"type":"stat-modifier","statType":"damage-bonus","magnitude":0.30,"isPercentage":True},"duration":{"durationType":"permanent","rounds":0},"chance":1}, {"oncePerBattle":True,"maxTriggers":1})],
    "notes":"Passive: normal/skill damage +30%.",
})

# 120000023 激怒
e = mk_effect('self', {"type":"energy","energyType":"gain","magnitude":100}, 'instant', 0)
set_skill('120000023', {
    "effectType":"energy","targetType":"self","energyCost":0,
    "effects":[e],
    "triggers":[
        mk_trig('on-attack', {"target":{"targetType":"self"},"effect":{"type":"energy","energyType":"gain","magnitude":100},"duration":{"durationType":"instant","rounds":0},"chance":1}),
        mk_trig('on-skill-use', {"target":{"targetType":"self"},"effect":{"type":"energy","energyType":"gain","magnitude":100},"duration":{"durationType":"instant","rounds":0},"chance":1}),
    ],
    "notes":"Passive: on normal/skill, extra 100 energy.",
})

# 120000025 戒备
e = mk_effect('self', {"type":"stat-modifier","statType":"crit-resistance","magnitude":0.30,"isPercentage":True})
set_skill('120000025', {
    "effectType":"stat-modifier","targetType":"self","energyCost":0,
    "effects":[e],
    "triggers":[
        mk_trig('on-round-start', {"target":{"targetType":"self"},"effect":{"type":"stat-modifier","statType":"crit-resistance","magnitude":0.30,"isPercentage":True},"duration":{"durationType":"permanent","rounds":0},"chance":1}, {"oncePerBattle":True,"maxTriggers":1}),
        mk_trig('on-buff-gain', {"target":{"targetType":"self"},"effect":{"type":"stat-modifier","statType":"crit-resistance","magnitude":0.30,"isPercentage":True},"duration":{"durationType":"permanent","rounds":0},"chance":1}),
    ],
    "notes":"Passive: when has buff, crit resistance +30%.",
})

# 120000028 鹰眼
e = mk_effect('self', {"type":"stat-modifier","statType":"hit-rate","magnitude":0.15,"isPercentage":True})
set_skill('120000028', {
    "effectType":"stat-modifier","targetType":"self","energyCost":0,
    "effects":[e],
    "triggers":[mk_trig('on-round-start', {"target":{"targetType":"self"},"effect":{"type":"stat-modifier","statType":"hit-rate","magnitude":0.15,"isPercentage":True},"duration":{"durationType":"permanent","rounds":0},"chance":1}, {"oncePerBattle":True,"maxTriggers":1,"conditionKey":"hp-above-50"})],
    "notes":"Passive: HP above 50%, hit rate +15%.",
})

# 120001004 爆裂一击
e = mk_effect('self', {"type":"stat-modifier","statType":"crit-rate","magnitude":1.0,"isPercentage":True})
set_skill('120001004', {
    "effectType":"stat-modifier","targetType":"self","energyCost":0,
    "effects":[e],
    "triggers":[mk_trig('on-ultimate-use', {"target":{"targetType":"self"},"effect":{"type":"stat-modifier","statType":"crit-rate","magnitude":1.0,"isPercentage":True},"duration":{"durationType":"permanent","rounds":0},"chance":1}, {"oncePerBattle":True,"maxTriggers":1})],
    "notes":"Passive: first ultimate, final crit rate +100%.",
})

# 6910001042 Ultimate
e = {"target":{"targetType":"single"},"effect":{"type":"damage","damageType":"physical","multiplier":2,"canCrit":True},"duration":{"durationType":"instant","rounds":0},"chance":1}
set_skill('6910001042', {
    "effectType":"damage","targetType":"single","energyCost":0,
    "effects":[e],
    "triggers":[],
    "notes":"Ultimate: metadata fallback (missing description). Implemented as generic 2.0x physical damage single target (requires investigation).",
    "requiresInvestigation": True,
})

# normal-profession-2
e = {"target":{"targetType":"single"},"effect":{"type":"damage","damageType":"physical","multiplier":1,"canCrit":True},"duration":{"durationType":"instant","rounds":0},"chance":1}
s = next(x for x in hero['skills'] if x['id'] == 'normal-profession-2')
s['implementation'] = {
    "fallback": True,
    "source":"project-fallback",
    "resolvedAbility":False,
    "resolvedDescription":False,
    "ability":None,
    "abilityDes":None,
    "effectType":"damage","targetType":"single","energyCost":0,
    "effects":[e],
    "triggers":[],
    "notes":"Project fallback basic attack.",
}

json.dump(db, open(FILE,'w',encoding='utf-8'), ensure_ascii=False, indent=2)
print('done')
PY