import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readHookTables } from '../config/hook-tables.mjs';
import {
  HOOK_COMMAND_READINESS,
  HOOK_LOGIN_HOST,
  HOOK_MSG_BIN_EVIDENCE,
  HOOK_PRODUCE_ID_CONSTANTS,
  HOOK_R1_EVIDENCE,
  HOOK_TYPE_BLOCKERS,
  HOOK_TYPE_EVIDENCE,
  guildCampProduceId,
  peakTowerProduceId,
  soulTrialProduceId
} from '../config/hook-evidence.mjs';
import { R1_FAIL_CLOSED_COMMAND_REASONS, createR1FailClosedCommandService } from '../game/r1-fail-closed-command-service.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tables = readHookTables();
const audit = JSON.parse(readFileSync(path.join(root, 'config/command-dispatch-audit.json'), 'utf8'));

test('hook evidence registry covers every original Type row with its erl module and data class', () => {
  const tids = [...tables.rows.Type.keys()].sort((a, b) => a - b);
  assert.deepEqual(tids, [10, 17, 18, 19, 20, 22, 23, 24, 25, 26, 27, 28]);
  assert.deepEqual(Object.keys(HOOK_TYPE_EVIDENCE).map(Number).sort((a, b) => a - b), tids);
  for (const tid of tids) {
    const row = tables.typeForTid(tid);
    const evidence = HOOK_TYPE_EVIDENCE[tid];
    assert.equal(evidence.erlModule, row.erl_module, 'type ' + tid + ' erl_module');
    assert.equal(evidence.dataClass, row.data_class?.reference, 'type ' + tid + ' data_class');
    assert.ok(evidence.produceIdSource.length > 0);
  }
});

test('hook produce-id constants land on real Stage rows of the expected type', () => {
  const limits = HOOK_PRODUCE_ID_CONSTANTS;
  const expectations = [
    [limits.PEAK_TOWER_LAYER_ONE, 10],
    [limits.PEAK_TOWER_LAYER_BEGIN, 10],
    [limits.PEAK_TOWER_LAYER_MAX, 10],
    [limits.SOUL_TRIAL_PRODUCE_ID_MIN, 20],
    [limits.SOUL_TRIAL_PRODUCE_ID_MAX, 20],
    [limits.PET_PLAY_STAGE_1, 23],
    [limits.PET_PLAY_STAGE_2, 24]
  ];
  for (const [tid, belong] of expectations) {
    const stage = tables.stageForTid(tid);
    assert.ok(stage, 'stage ' + tid + ' must exist');
    assert.equal(stage.belong_hook_type, belong, 'stage ' + tid + ' belong_hook_type');
  }
  assert.equal(limits.TYPE_DELTA * 10, 1000000);
});

test('hook produce-id projections follow the same-version client consumers', () => {
  assert.equal(peakTowerProduceId(tables, 1), 1000001);
  assert.equal(peakTowerProduceId(tables, 60), 1000060);
  assert.equal(peakTowerProduceId(tables, 4580), 1004580);
  assert.equal(peakTowerProduceId(tables, 0), null);
  assert.equal(peakTowerProduceId(tables, 4581), null);

  assert.equal(soulTrialProduceId(tables, 0), 2000000);
  assert.equal(soulTrialProduceId(tables, 20), 2000020);
  assert.equal(soulTrialProduceId(tables, 600), 2000600);
  assert.equal(soulTrialProduceId(tables, 601), null);

  assert.equal(guildCampProduceId(17, 30, 0), 1730000);
  assert.equal(guildCampProduceId(19, 77, 10), 1977010);
  assert.equal(guildCampProduceId(16, 30, 0), null);
  assert.equal(guildCampProduceId(18, -1, 0), null);

  const peak = tables.stageForTid(peakTowerProduceId(tables, 120));
  assert.equal(peak.belong_hook_type, 10);
});

test('hook random award ownership stays recorded as unresolved external codes', () => {
  const codes = [...new Set([...tables.rows.RandomAward.values()].map(row => row.random_produce).filter(code => code > 0))]
    .sort((a, b) => a - b);
  assert.deepEqual(codes, [201, 202, 203, 205, 206, 701, 702, 703, 704, 705, 706, 707, 1201]);
  const stagesWithRandom = [...tables.rows.Stage.values()].filter(row => row.random_award.length > 0);
  assert.equal(stagesWithRandom.length, 3063);
  const byType = {};
  for (const stage of stagesWithRandom) byType[stage.belong_hook_type] = (byType[stage.belong_hook_type] ?? 0) + 1;
  assert.deepEqual(byType, { 10: 447, 20: 12, 22: 1801, 23: 1, 24: 1, 25: 801 });
});

test('hook login host and msg_bin evidence stay unresolved instead of being guessed', () => {
  assert.equal(HOOK_LOGIN_HOST.moduleTableTid, 89);
  assert.equal(HOOK_LOGIN_HOST.payloadSchema, 'pb_hook_info');
  assert.equal(HOOK_LOGIN_HOST.loginSlotResolved, false);
  assert.equal(HOOK_MSG_BIN_EVIDENCE.encoding, 'etf');
  assert.equal(HOOK_MSG_BIN_EVIDENCE.protobufFamilyPresent, false);
  assert.equal(HOOK_MSG_BIN_EVIDENCE.serverDecoderRecovered, false);
  assert.deepEqual([...HOOK_MSG_BIN_EVIDENCE.moduleNames], [
    'guild_nation_hook',
    'hero_lease_hook',
    'homeland_hook',
    'magical_journey_hook',
    'peak_tower_hook',
    'pet_play_hook',
    'soul_trial_hook',
    'summer_act_hook',
    'tri_match_tower_hook'
  ]);
  assert.equal(HOOK_R1_EVIDENCE.gameplayReady, false);
  assert.equal(HOOK_R1_EVIDENCE.readOnlyFacts.length, 4);
});

test('every HookTable type still carries the blockers that prevent production', () => {
  for (const tid of Object.keys(HOOK_TYPE_EVIDENCE)) {
    const blockers = HOOK_TYPE_BLOCKERS[tid];
    assert.ok(Array.isArray(blockers), 'type ' + tid + ' blockers');
    assert.ok(blockers.length >= 3, 'type ' + tid + ' needs concrete blockers');
  }
  const typesWithClearCache = [...tables.rows.Type.values()].filter(row => row.clear_cache === true).map(row => row.tid);
  assert.deepEqual(typesWithClearCache, [17, 18, 19]);
  for (const tid of typesWithClearCache) {
    assert.ok(HOOK_TYPE_BLOCKERS[tid].some(text => text.includes('clear_cache')));
  }
});

test('78201-78205 stay inside the R1 fail-closed command table', () => {
  const types = [78201, 78202, 78203, 78204, 78205];
  const service = createR1FailClosedCommandService();
  for (const type of types) {
    assert.equal(HOOK_COMMAND_READINESS[type].status, 'fail-closed');
    assert.ok(String(R1_FAIL_CLOSED_COMMAND_REASONS[type]).includes('ITEM-HOOK'));
    assert.equal(service.supports(type), true);
    assert.throws(() => service.execute(type), error => error instanceof Error && Number(error.code) === 5);
  }
  assert.deepEqual(service.commands.filter(type => types.includes(type)), types);
});

test('hook command audit keeps the same five types on the fail-closed owner', () => {
  const entries = audit.commands.filter(entry => [78201, 78202, 78203, 78204, 78205].includes(entry.type));
  assert.equal(entries.length, 5);
  for (const entry of entries) {
    assert.equal(entry.task, 'ITEM-HOOK');
    assert.equal(entry.reachableOwner, 'r1FailClosed');
    assert.deepEqual(entry.owners, ['r1FailClosed']);
    assert.equal(entry.status, 'service_route');
    assert.equal(entry.access, 'write');
  }
  const byType = Object.fromEntries(entries.map(entry => [entry.type, entry]));
  assert.equal(byType[78201].requestSchema, 'pb_hook_gather_or_preview_req');
  assert.equal(byType[78201].responseSchema, 'pb_hook_gather_rsp');
  assert.equal(byType[78202].responseSchema, 'pb_hook_preview_rsp');
  assert.equal(byType[78203].responseSchema, 'pb_hook_fast_rsp');
  assert.equal(byType[78204].responseSchema, 'pb_hook_item_fast_rsp');
  assert.equal(byType[78205].requestSchema, null);
  assert.equal(byType[78205].responseSchema, 'pb_res_to_client');
  for (const type of [78201, 78202, 78203, 78204]) {
    assert.equal(byType[type].runtimeRequestEncoding, 'etf');
    assert.equal(byType[type].requestEncodingDifference, true);
  }
});

