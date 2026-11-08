// Report-layer wire codes shared by the battle engine and the fight services.
//
// Every number in this file is taken from shipped client evidence. Codes that
// could not be proven are deliberately absent so callers have to fail closed
// instead of inventing a value the client would mis-render.
//
// Evidence (all paths relative to the repository root):
// 1. `analysis/scratchpad/time-temple-20261108/core/9286154805154101000-ProtobufKey.lua.bin`
//    is the client ProtobufKey constant table. Parsing its hash constant yields
//    101 pb_fat_action_before, 102 pb_fat_action_after, 103 pb_fat_buff_change,
//    104 pb_fat_battle_over, 105 pb_fat_fighter_die, 106 pb_fat_harm,
//    107 pb_fat_round_ready, 108 pb_fat_remove_fighter, 109 pb_fat_shield,
//    110 pb_fat_fighter_enter, 111 pb_fat_fighter_out, 112 pb_fat_round_over,
//    113 pb_fat_tip, 114 pb_fat_fighter_relive, 115 pb_fat_deathmatch_start,
//    116 pb_fat_attr_sync, 117 pb_local_fat_attr_obj, 118 pb_fat_cf_hp and
//    119 pb_fat_second_shield.
// 2. `FightTable.lua.bin` assigns the TID_PROMPT_* / TID_BUFF_* constants used
//    below as KSTR+KSHORT constant pairs.
// 3. `tools/extract-battle-tables.mjs --types=FightTable.Prompt` shows
//    Prompt[107] = FightPromptValueRecoverNode.prefab with type=0 (PROMPT_NUMBER)
//    and sign=0 (PROMPT_SIGN_POSITIVE). `IFightHarm.IsRecover` is exactly
//    "Prompt.type == PROMPT_NUMBER and Prompt.sign == PROMPT_SIGN_POSITIVE", so
//    107 is a proven heal prompt. `IFightHarm.IsHarm` uses SIGN_NEGATIVE.
// 4. `tools/extract-battle-tables.mjs --types=FightTable.Buff` shows real rows
//    for 10001 (type 3 = CTRL), 11003 and 11004 (type 2 = LOSS); all three carry
//    dispel=true and dead_rm=true.
// 5. `sign` is the add/remove flag with true meaning "added":
//    - `fight.db.proto` documents `pb_buff_obj.sign` as "符号标识，true:增加，
//      false:移除".
//    - `BuffChangeStep.lua.bin` `_OnStart` loads `self.sign`, and the falsy
//      branch jumps straight to `FighterMgr.Get(fid):RemoveBuff(tid, overlay)`
//      while the truthy branch falls through to `AddBuff(tid, overlay, srcId)`.
//    - `ParseBuff.lua.bin` `DoBuff` only feeds the prompt list
//      (`FightBuffEffectMgr:AddBuffObjToPromptList`) when `sign` is truthy, i.e.
//      when the buff just appeared.
// 6. `overlay` is a layer delta: `Fighter.lua.bin` `AddBuff` adds it to the
//    tracked layer count, `RemoveBuff` subtracts it and deletes the entry once
//    the count reaches zero. A removal therefore has to carry the real number of
//    layers that disappeared; overlay 0 would leave the client icon in place.

/** pb_generic.proto ids for the fight action stream (see evidence 1). */
export const FAT_ACTION = Object.freeze({
  ACTION_BEFORE: 101,
  ACTION_AFTER: 102,
  BUFF_CHANGE: 103,
  BATTLE_OVER: 104,
  FIGHTER_DIE: 105,
  HARM: 106,
  ROUND_READY: 107,
  REMOVE_FIGHTER: 108,
  SHIELD: 109,
  FIGHTER_ENTER: 110,
  FIGHTER_OUT: 111,
  ROUND_OVER: 112,
  TIP: 113,
  FIGHTER_RELIVE: 114,
  DEATHMATCH_START: 115,
  ATTR_SYNC: 116,
  LOCAL_ATTR_OBJ: 117,
  CF_HP: 118,
  SECOND_SHIELD: 119
});

/**
 * pb_harm_obj.type values. Only the prompts this service can justify are
 * listed; heal is 107 because FightTable.Prompt[107] is a positive-number
 * prompt and the client decides damage/heal from that row alone.
 */
export const PROMPT = Object.freeze({
  HARM_NORMAL: 101,
  HARM_REAL: 102,
  HARM_PARRY: 103,
  HARM_CRITICAL: 104,
  HARM_KILL: 105,
  HARM_DOT: 106,
  HEAL: 107,
  HEAL_CRITICAL: 108,
  HEAL_SHARE: 109,
  SUCK_BLOOD: 110,
  HARM_POISON: 113,
  HARM_FIRE: 114
});

/** pb_buff_obj.change_reason values (proto comment + TID_BUFF_CHANGE_TYPE_*). */
export const BUFF_CHANGE_REASON = Object.freeze({
  NONE: 0,
  DISPEL: 1,
  DEAD: 2,
  DETONATE: 3
});

/** pb_buff_obj.sign: true adds layers, false removes them (evidence 5). */
export const BUFF_SIGN = Object.freeze({ ADD: true, REMOVE: false });

/**
 * statusType -> shipped FightTable.Buff row. Only statuses this engine can
 * actually produce are mapped; everything else stays unmapped so the report
 * layer drops it instead of fabricating a tid.
 */
const PROVEN_STATUS_BUFFS = new Map([
  ['stun', Object.freeze({
    tid: 10001, constant: 'TID_BUFF_STUN', buffType: 3, effect: 1001,
    dispel: true, deadRemove: true, overlayLimit: 2
  })],
  ['poison', Object.freeze({
    tid: 11003, constant: 'TID_BUFF_POISON', buffType: 2, effect: 1013,
    dispel: true, deadRemove: true, overlayLimit: 2
  })],
  ['burn', Object.freeze({
    tid: 11004, constant: 'TID_BUFF_BURNING_HOT', buffType: 2, effect: 1014,
    dispel: true, deadRemove: true, overlayLimit: 1
  })]
]);

/** Real FightTable.Buff.tid for a status type, or null when not proven. */
export function provenBuffTid(statusType) {
  const entry = PROVEN_STATUS_BUFFS.get(String(statusType ?? ''));
  return entry ? entry.tid : null;
}

/** Full evidence record for a status type, or null when not proven. */
export function provenStatusBuff(statusType) {
  return PROVEN_STATUS_BUFFS.get(String(statusType ?? '')) ?? null;
}

/** Status types whose dead_rm=true row is proven (see evidence 4). */
export function removesOnDeath(statusType) {
  return provenStatusBuff(statusType)?.deadRemove === true;
}

/** Status types the client may dispel, per the same FightTable.Buff rows. */
export function isDispellable(statusType) {
  return provenStatusBuff(statusType)?.dispel === true;
}

export const PROVEN_STATUS_BUFF_TIDS = Object.freeze(
  [...PROVEN_STATUS_BUFFS.entries()].map(([statusType, entry]) => Object.freeze({ statusType, ...entry }))
);
