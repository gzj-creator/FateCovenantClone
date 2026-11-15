// R1 ITEM-HOOK evidence registry (2026-11-15, group C).
//
// This module freezes only what the same-version client evidence actually
// shows. It is deliberately NOT wired into the gateway: the original server
// modules that turned a client msg_bin into an authoritative hook transition
// were never recovered, so 78201-78205 stay in the R1 fail-closed table.
//
// Same-version sources (SHA256 of the files used):
//   HookTable.data.lua.bin 363929DCF7CE5250A65885F33F99A7B9F43FA153A048B3F8F9F9A59E44120B29
//   HookTable.lua.bin      ED7E4FA544FF47394D0F2E0689259F1BAB20725C2E28D4C1DE71A7614521C024
//   HookBaseData.lua.bin   2D0014B17B52ACA9FB74348A981996A13779B834E3077703483F3B4AA208A72F
//   HookCmd.lua.bin        A40C8461FC94F091920B015F855C90965CAC309E6EF4340D4B74C5666DB69E2C
//   HookMgr.lua.bin        2FEB4B43253518641AC3FCCCED4C72F4B5D2D5BBDCA58EF6EB6971C8FB851B3E
//   hook.net.proto.bin     9F9AA28514354F3043F2AF844AE025078D552D2A419C21BF0071138EC80150EC
//   hook.db.proto.bin      4892591D45E096C8D5B837A57DA7DA4A62353B1A1A7CBBF1DABF36A064587300
//   HookTable.data.json.gz 38ED372AB14C4524174BBBDCC6874C631859E5BBFCCA4FAF28F36E2908BFC466

export const HOOK_SOURCE_SHA256 = Object.freeze({
  hookTableData: '363929DCF7CE5250A65885F33F99A7B9F43FA153A048B3F8F9F9A59E44120B29',
  hookTableLua: 'ED7E4FA544FF47394D0F2E0689259F1BAB20725C2E28D4C1DE71A7614521C024',
  hookBaseData: '2D0014B17B52ACA9FB74348A981996A13779B834E3077703483F3B4AA208A72F',
  hookCmd: 'A40C8461FC94F091920B015F855C90965CAC309E6EF4340D4B74C5666DB69E2C',
  hookMgr: '2FEB4B43253518641AC3FCCCED4C72F4B5D2D5BBDCA58EF6EB6971C8FB851B3E',
  hookNetProto: '9F9AA28514354F3043F2AF844AE025078D552D2A419C21BF0071138EC80150EC',
  hookDbProto: '4892591D45E096C8D5B837A57DA7DA4A62353B1A1A7CBBF1DABF36A064587300',
  hookTableAsset: '38ED372AB14C4524174BBBDCC6874C631859E5BBFCCA4FAF28F36E2908BFC466'
});

// HookTable.lua constant block, read from the constant assignments in the
// same-version bundle. Every constant below is cross-checked against a real
// Stage row of the expected belong_hook_type by the evidence test.
export const HOOK_PRODUCE_ID_CONSTANTS = Object.freeze({
  TYPE_DELTA: 100000,
  QUALITY_DELTA: 1000,
  PEAK_TOWER_LAYER_ONE: 1000001,
  PEAK_TOWER_LAYER_BEGIN: 1000060,
  PEAK_TOWER_LAYER_MAX: 1004580,
  PET_PLAY_STAGE_1: 2300000,
  PET_PLAY_STAGE_2: 2400000,
  SOUL_TRIAL_PRODUCE_ID_MIN: 2000000,
  SOUL_TRIAL_PRODUCE_ID_MAX: 2000600
});

// One row per original HookTable.Type tid. produceIdSource names the exact
// client consumer that resolves a Stage tid; it is a client projection, not a
// proven server rule.
export const HOOK_TYPE_EVIDENCE = Object.freeze({
  10: Object.freeze({ erlModule: 'peak_tower_hook', dataClass: 'HookPeakTowerData', produceIdSource: 'PeakTowerMgr.GetTowerLayer() over Stage rows in [1000001,1004580]' }),
  17: Object.freeze({ erlModule: 'hero_lease_hook', dataClass: 'HookGuildCampData', produceIdSource: 'type*100000 + quality*1000 + star' }),
  18: Object.freeze({ erlModule: 'hero_lease_hook', dataClass: 'HookGuildCampData', produceIdSource: 'type*100000 + quality*1000 + star' }),
  19: Object.freeze({ erlModule: 'hero_lease_hook', dataClass: 'HookGuildCampData', produceIdSource: 'type*100000 + quality*1000 + star' }),
  20: Object.freeze({ erlModule: 'soul_trial_hook', dataClass: 'HookSoulTrialData', produceIdSource: 'SoulTrialUtil.GetHookId() over Stage rows in [2000000,2000600]' }),
  22: Object.freeze({ erlModule: 'magical_journey_hook', dataClass: 'MagicalJourneyHookData', produceIdSource: 'MagicalJourneyTable.Mission(missId).hook' }),
  23: Object.freeze({ erlModule: 'pet_play_hook', dataClass: 'PetPlayOneData', produceIdSource: 'unresolved (PetPlay table family not located)' }),
  24: Object.freeze({ erlModule: 'pet_play_hook', dataClass: 'PetPlayTwoData', produceIdSource: 'unresolved (PetPlay table family not located)' }),
  25: Object.freeze({ erlModule: 'guild_nation_hook', dataClass: 'GuildNationHookData', produceIdSource: 'GuildNationTable.HookLevel(tid).hook' }),
  26: Object.freeze({ erlModule: 'summer_act_hook', dataClass: 'SummerActHookData', produceIdSource: 'SummerActTable.SummerAct(version).hook_type + passed main mission count' }),
  27: Object.freeze({ erlModule: 'homeland_hook', dataClass: 'HookHomelandData', produceIdSource: 'HomelandMgr.GetLevelHookProduceId(level)' }),
  28: Object.freeze({ erlModule: 'tri_match_tower_hook', dataClass: 'TriMatchTowerHookData', produceIdSource: 'TriMatchTowerUtil.GetMaxPassedMissionCfg(actId).hook' })
});

// msg_bin is built by Codec.EncodeErl in HookCmd/HookMgr, so it is an ETF term
// chosen per erl_module, not a protobuf message. No proto file in the
// same-version bundle declares a hook payload family.
export const HOOK_MSG_BIN_EVIDENCE = Object.freeze({
  encoding: 'etf',
  producer: 'HookMgr preview/gather -> Codec.EncodeErl(msg) -> pb_hook_*_req.msg_bin',
  protobufFamilyPresent: false,
  serverDecoderRecovered: false,
  moduleNames: Object.freeze([...new Set(Object.values(HOOK_TYPE_EVIDENCE).map(row => row.erlModule))].sort())
});

// pb_hook_info login host. ModuleTable tid 89 is the feature registry row
// (e_dir project/hook), not the numeric login slot that carries pb_hook_info.
export const HOOK_LOGIN_HOST = Object.freeze({
  moduleTableTid: 89,
  moduleTableDir: 'project/hook',
  payloadSchema: 'pb_hook_info',
  loginSlotResolved: false
});

// Per-type blockers. A blocker is removed only together with the evidence that
// answers it; none of the produced-id projections above is a licence to mutate
// cache_list, last_reap_time or fast_count.
export const HOOK_TYPE_BLOCKERS = Object.freeze({
  10: Object.freeze(['server module peak_tower_hook: accumulation, cap and fast-count rules unrecovered', 'RandomAward.random_produce codes 201/202/203/205/206 have no resolved owner table', 'produce_addition target 2 is a client AdditionMgr target only', 'msg_bin ETF term shape and server validation unrecovered']),
  17: Object.freeze(['server module hero_lease_hook unrecovered', 'clear_cache=true reset timing unrecovered', 'lease object quality/star authority and hook interaction unrecovered', 'msg_bin ETF term shape unrecovered']),
  18: Object.freeze(['server module hero_lease_hook unrecovered', 'clear_cache=true reset timing unrecovered', 'lease object quality/star authority and hook interaction unrecovered', 'msg_bin ETF term shape unrecovered']),
  19: Object.freeze(['server module hero_lease_hook unrecovered', 'clear_cache=true reset timing unrecovered', 'lease object quality/star authority and hook interaction unrecovered', 'msg_bin ETF term shape unrecovered']),
  20: Object.freeze(['server module soul_trial_hook unrecovered', 'produce_addition target 77 is a client AdditionMgr target only', 'RandomAward.random_produce codes 701-707 have no resolved owner table', 'msg_bin ETF term shape unrecovered']),
  22: Object.freeze(['server module magical_journey_hook unrecovered', 'MagicalJourneyTable.hook column not verified against an authoritative mission cursor', 'server random consumer unrecovered for 1801 stages carrying random_award', 'FastHookType 4 has no fast time or price rows']),
  23: Object.freeze(['server module pet_play_hook unrecovered', 'PetPlay table family and produce id source not located', 'RandomAward.random_produce owner unrecovered', 'msg_bin ETF term shape unrecovered']),
  24: Object.freeze(['server module pet_play_hook unrecovered', 'PetPlay table family and produce id source not located', 'RandomAward.random_produce owner unrecovered', 'msg_bin ETF term shape unrecovered']),
  25: Object.freeze(['server module guild_nation_hook unrecovered', 'GuildNationTable.HookLevel(tid).hook not verified as authoritative', 'server random consumer unrecovered for 801 stages carrying random_award', 'FastHookType 5 has no fast time or price rows']),
  26: Object.freeze(['server module summer_act_hook unrecovered', 'produce_addition target 88 and HookPhaseAddon consumers are client-only', 'hook_open precondition not bound to the R1 activity instance', 'msg_bin ETF term shape unrecovered']),
  27: Object.freeze(['server module homeland_hook unrecovered', 'HomelandMgr.GetLevelHookProduceId mapping not verified server-side', 'max_fixed_period 28800 cap against homeland level unrecovered', 'msg_bin ETF term shape unrecovered']),
  28: Object.freeze(['server module tri_match_tower_hook unrecovered', 'produce_addition target 89 is a client AdditionMgr target only', 'activity hook_open precondition unrecovered', 'msg_bin ETF term shape unrecovered'])
});

export const HOOK_COMMAND_READINESS = Object.freeze({
  78201: Object.freeze({ status: 'fail-closed', reason: 'authoritative produce clock, cap, fractional rounding, cursor advance and reward consumer unresolved for every type' }),
  78202: Object.freeze({ status: 'fail-closed', reason: 'preview reuses the same unresolved produce and random consumers; stored cache_list cannot stand in for elapsed production' }),
  78203: Object.freeze({ status: 'fail-closed', reason: 'only type 2 closes fast time and tier prices; per-type free/paid count, msg_bin and reward write-back unresolved' }),
  78204: Object.freeze({ status: 'fail-closed', reason: 'FastItem sec/max_speed/item rows exist but times cap, cost and produced-item consumer unresolved' }),
  78205: Object.freeze({ status: 'fail-closed', reason: 'client sends ETF without request fields; operation target, state change and resource consumer unresolved' })
});

export const HOOK_R1_EVIDENCE = Object.freeze({
  gameplayReady: false,
  versions: 'same-version client bundle as HookTable.data.json.gz',
  readOnlyFacts: Object.freeze([
    'pb_hook.cache_list carries float amounts; the integer projection must not discard the fractional remainder',
    'last_reap_time, last_gather_time, old_stage, rand_reap_time and pb_fast_hook.fast_count persist separately',
    'preview must not advance last_reap_time or last_gather_time',
    'msg_bin is per-type ETF and must not be replaced by a common mainline reward rule'
  ]),
  sources: HOOK_SOURCE_SHA256,
  constants: HOOK_PRODUCE_ID_CONSTANTS,
  types: HOOK_TYPE_EVIDENCE,
  blockers: HOOK_TYPE_BLOCKERS,
  commands: HOOK_COMMAND_READINESS,
  loginHost: HOOK_LOGIN_HOST,
  msgBin: HOOK_MSG_BIN_EVIDENCE
});

// Client projection only. Never call this from a command path: the server-side
// producer is what is missing, not the mapping helper.
export function peakTowerProduceId(tables, layer) {
  const number = Number(layer);
  if (!Number.isSafeInteger(number) || number < 1) return null;
  const limits = HOOK_PRODUCE_ID_CONSTANTS;
  for (const tid of tables.stageTidsForType(10)) {
    if (tid < limits.PEAK_TOWER_LAYER_ONE || tid > limits.PEAK_TOWER_LAYER_MAX) continue;
    if (tid % limits.TYPE_DELTA >= number) return tid;
  }
  return null;
}

export function soulTrialProduceId(tables, hookId) {
  const number = Number(hookId);
  if (!Number.isSafeInteger(number) || number < 0) return null;
  const limits = HOOK_PRODUCE_ID_CONSTANTS;
  for (const tid of tables.stageTidsForType(20)) {
    if (tid < limits.SOUL_TRIAL_PRODUCE_ID_MIN || tid > limits.SOUL_TRIAL_PRODUCE_ID_MAX) continue;
    if (tid % limits.TYPE_DELTA >= number) return tid;
  }
  return null;
}

export function guildCampProduceId(type, quality, star) {
  const limits = HOOK_PRODUCE_ID_CONSTANTS;
  const hookType = Number(type);
  const heroQuality = Number(quality);
  const heroStar = Number(star);
  if (!Number.isSafeInteger(hookType) || hookType < 17 || hookType > 19) return null;
  if (!Number.isSafeInteger(heroQuality) || heroQuality < 0) return null;
  if (!Number.isSafeInteger(heroStar) || heroStar < 0) return null;
  return hookType * limits.TYPE_DELTA + heroQuality * limits.QUALITY_DELTA + heroStar;
}

