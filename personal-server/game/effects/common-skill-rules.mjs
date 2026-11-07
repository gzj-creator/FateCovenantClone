// Shared catalog rows whose descriptions specify a damage source or one use,
// rather than the older attack-based/timed approximations in their effects.
const NEXT_ULTIMATE_MASTERY = new Set([
  '312020174', '313060174', '321010174', '321020174', '322020174',
  '324010174', '334020174', '343030174', '344020174', '344030174', '344040174'
]);
const NEXT_HIT_MASTERY = new Set([
  '312050174', '312060174', '313010174', '314020174', '322010174',
  '323060174', '332010174', '332030174', '332040174', '333020174',
  '333040174', '334010174', '341020174', '343060174'
]);

function once(definition, trigger, actionType = null) {
  return {
    ...definition,
    effect: { ...definition.effect, actionType },
    duration: { durationType: 'trigger-count', triggers: 1, trigger },
    unique: true,
    refresh: true
  };
}

export function commonSkillEffect(skill, definition) {
  const id = String(skill.id);
  const effect = definition?.effect;
  if (!effect) return definition;
  if (id === '120001002' && effect.type === 'heal') {
    return { ...definition, effect: { ...effect, healType: 'percent-damage-dealt', multiplier: 0.1 } };
  }
  if (id === '120001004' && effect.statType === 'crit-rate') {
    return once(definition, 'ultimate', 'ultimate');
  }
  if (id === '120001006' && effect.statType === 'damage-bonus') {
    return once(definition, 'attack', 'attack');
  }
  if (id === '120001007' && effect.statType === 'damage-bonus') {
    return once(definition, 'ultimate', 'ultimate');
  }
  if (NEXT_ULTIMATE_MASTERY.has(id) && effect.statType === 'damage-bonus' && effect.magnitude === 0.15) {
    return once(definition, 'ultimate', 'ultimate');
  }
  if (NEXT_HIT_MASTERY.has(id) && effect.statType === 'damage-reduction' && effect.magnitude === 0.15) {
    return once(definition, 'damage-taken');
  }
  return definition;
}

export function commonSkillEffects(skill, definitions) {
  const effects = definitions.map(definition => commonSkillEffect(skill, definition));
  if (String(skill.id) === '2504050123' && !effects.some(definition => definition.effect?.type === 'shield')) {
    effects.push({
      target: { targetType: 'self' },
      effect: { type: 'shield', shieldType: 'percent-damage-dealt', multiplier: 1 },
      duration: { durationType: 'instant', rounds: 0 },
      chance: 1
    });
  }
  return effects;
}

export function commonSkillTriggerType(skill, type) {
  return String(skill.id) === '120001004' && type === 'on-ultimate-use'
    ? 'before-ultimate-use'
    : type;
}
