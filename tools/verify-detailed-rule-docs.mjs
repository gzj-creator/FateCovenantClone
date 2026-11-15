import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { clientDayBegin, clientDayZero, clientActFrameStage, clientLegacyWindow,
  projectLegacyTableStates, projectActFrameFallback } from './documented-activity-time.mjs';
import { RULE_BASELINE, taskOverrides, r1GroupOpeningDay, projectDynamicDecisions,
  firstNonOverlappingDreamStart } from './documented-rule-decisions.mjs';
import { parseLuaJit } from './luajit-bytecode-parse.mjs';

// Documentation verification; never starts game services or opens a database.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docRoot = path.join(root, 'docs/gameplay-operations');
const rules = path.join(docRoot, 'rules');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const parse = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const issues = [];
function trackedFile(relative) {
  const absolute = path.resolve(root, relative);
  assert.ok(absolute.startsWith(root + path.sep), 'Path outside workspace: ' + relative);
  return absolute;
}
const manifest = parse(path.join(rules, 'manifest.json'));
for (const record of [...manifest.sources, ...manifest.projectionSources, ...(manifest.documentationSources ?? []),
  ...(manifest.evidenceSources ?? []), ...(manifest.decisionSources ?? []), manifest.generator, manifest.inventory, ...manifest.generatedFiles]) {
  const file = trackedFile(record.path);
  assert.equal(sha(fs.readFileSync(file)), record.sha256, 'Changed documentation input/output: ' + record.path);
}
assert.equal(manifest.baseline, RULE_BASELINE);
const evidenceManifest = parse(path.join(docRoot, 'appendices/evidence-manifest.json'));
for (const record of [...evidenceManifest.sources, ...evidenceManifest.generatedFiles]) {
  assert.equal(sha(fs.readFileSync(trackedFile(record.path))), record.sha256, 'Changed appendix input/output: ' + record.path);
}
const decisionRoot = 'analysis/scratchpad/activity-schedule-20261115/';
const lockedSources = parse(trackedFile(decisionRoot + 'instances/decision-source-manifest.json'));
assert.equal(lockedSources.sources.length, 128);
for (const record of lockedSources.sources) {
  assert.equal(sha(fs.readFileSync(trackedFile(record.path))), record.sha256, 'R1 compatibility/input source drifted: ' + record.path);
}
// These source manifests refer to ordinary saved bytecode, not live data.
const skinEvidenceSources = parse(trackedFile(decisionRoot + 'buyskin175001/source-manifest.json')).files;
const methodEvidenceSources = parse(trackedFile(decisionRoot + 'method461/assets/manifest.json'));
for (const record of [...skinEvidenceSources, ...methodEvidenceSources]) {
  const file = record.target ?? record.source;
  assert.equal(sha(fs.readFileSync(trackedFile(file))), record.sha256, 'Changed original bytecode: ' + file);
}
const timeRuleText = fs.readFileSync(path.join(docRoot, 'activity-rulebooks/time-and-stages.md'), 'utf8');
for (const record of (manifest.evidenceSources ?? []).filter(source => source.path.endsWith('.bin'))) {
  assert.ok(timeRuleText.includes(record.sha256), 'Bytecode identity missing/mismatched in time rulebook: ' + record.path);
}
let tableCount = 0, familyCount = 0, rowCount = 0, unresolved = 0;
const tables = new Map();
for (const file of fs.readdirSync(path.join(rules, 'tables')).filter(file => file.endsWith('.json'))) {
  const table = parse(path.join(rules, 'tables', file));
  tables.set(table.table, table);
  tableCount++;
  assert.equal(sha(fs.readFileSync(trackedFile(table.assetPath))), table.assetSha256);
  assert.ok(Object.keys(table.families).length > 0, 'No families recorded: ' + table.table);
  for (const family of Object.values(table.families)) {
    familyCount++;
    if (family.status === 'unresolved') {
      unresolved++;
      assert.equal(family.rows, null);
      assert.ok(family.reason);
    } else {
      assert.equal(family.count, family.rows.length);
      assert.ok(family.rows.every(row => row && typeof row === 'object' && Object.keys(row).length > 0));
      rowCount += family.rows.length;
    }
  }
}
assert.equal(tableCount, manifest.summary.tableDocuments);
assert.equal(familyCount, manifest.summary.registeredFamilies);
assert.equal(rowCount, manifest.summary.recoveredRows);
assert.equal(unresolved, manifest.summary.unresolvedFamilies);
const rows = (table, family) => tables.get(table).families[family].rows;
const row = (table, family, tid) => rows(table, family).find(value => Number(value.tid) === tid);
// Independent known values from the original investigation, not from generated prose.
assert.deepEqual(row('GuideTable', 'Award', 1).award_i, [1020601]);
assert.deepEqual(row('GuideTable', 'Award', 2).award_i, [2020601]);
assert.equal(row('MissionTable', 'Section', 10205).fight, 105);
assert.deepEqual(row('JourneyFightTable', 'Fight', 105).def_team, [105]);
assert.deepEqual(row('JourneyFightTable', 'Team', 105).npc, [3030500]);
assert.deepEqual(row('JourneyFightTable', 'Team', 105).loc, [5]);
assert.deepEqual(row('JourneyFightTable', 'Team', 201).npc, [9301600, 9301600, 9301600, 9105000]);
assert.equal(row('FishingActTable', 'Version', 3).free_item_num, 25);
assert.equal(row('RechargeTable', 'Recharge', 1).price, 3000);

const timestamp = value => Date.parse(value) / 1000;
// Independent timestamp expectations exercise the original 05:00 alignment,
// two distinct zero-day algorithms, and server-supplied stage priority.
assert.equal(clientDayZero(timestamp('2026-11-14T04:59:59+08:00')), timestamp('2026-11-13T00:00:00+08:00'));
assert.equal(clientDayBegin(timestamp('2026-11-14T05:00:00+08:00')), timestamp('2026-11-14T05:00:00+08:00'));
const exampleStart = timestamp('2026-11-12T05:00:00+08:00');
const fishing = row('ActFrameTable', 'Act', 1074003);
const fishingExample = projectActFrameFallback(fishing, { start: exampleStart, end: timestamp('2026-11-17T05:00:00+08:00') });
assert.deepEqual(fishingExample.phases.map(p => [p.stageId, p.start, p.end]), [
  [50, exampleStart, timestamp('2026-11-16T22:00:00+08:00')],
  [90, timestamp('2026-11-16T22:00:00+08:00'), timestamp('2026-11-17T05:00:00+08:00')]
]);
const suppliedStage = clientActFrameStage(fishing, { start_time: exampleStart,
  stage_time_list: [{ stage_id: 90, start_time: 12345, end_time: 67890 }] }, 90);
assert.deepEqual([suppliedStage.start, suppliedStage.end, suppliedStage.source], [12345, 67890, 'server-stage-time-list']);
assert.equal(projectActFrameFallback(row('ActFrameTable', 'Act', 182603), { start: exampleStart }).status, 'incomplete-stage-arrays');
assert.equal(projectActFrameFallback(row('ActFrameTable', 'Act', 62001), { start: exampleStart }).status, 'server-stage-list-required');
const legacy = row('ActivityTable', 'Activity', 12003);
const legacyExample = projectLegacyTableStates(legacy,
  clientLegacyWindow(legacy, timestamp('2026-11-12T18:00:00+08:00')));
assert.deepEqual(legacyExample.phases.filter(p => [50, 60, 90].includes(p.stageId)).map(p => [p.stageId, p.start, p.end]), [
  [50, exampleStart, timestamp('2026-11-14T21:00:00+08:00')],
  [60, timestamp('2026-11-14T21:00:00+08:00'), timestamp('2026-11-14T22:00:00+08:00')],
  [90, timestamp('2026-11-14T22:00:00+08:00'), timestamp('2026-11-14T23:00:00+08:00')]
]);
const minuteWindow = row('ActivityTable', 'Activity', 77024);
const zeroDayProjection = projectLegacyTableStates(minuteWindow,
  clientLegacyWindow(minuteWindow, timestamp('2026-11-12T18:00:00+08:00')));
assert.deepEqual(zeroDayProjection.phases.filter(p => [10, 50].includes(p.stageId)).map(p => p.end - p.start), [0, 60]);

const activities = parse(path.join(rules, 'activities.json')).rows;
assert.equal(activities.length, rows('ActFrameTable', 'Act').length + rows('ActivityTable', 'Activity').length);
assert.equal(new Set(activities.map(v => v.sourceTable + '/' + v.row.tid)).size, activities.length);
for (const entry of activities) {
  assert.deepEqual(entry.row, row(entry.sourceTable, entry.sourceFamily, Number(entry.row.tid)));
  assert.ok(!Object.hasOwn(entry, 'originalStaticWindow'), 'Current function must not be labelled an original-client window');
  if (Number(entry.row.world_time) > 0 && entry.unshiftedImplementationWindow) {
    assert.equal(entry.unshiftedImplementationWindow.start, Number(entry.row.world_time), 'Original absolute time was rebased');
  }
}
const phaseDocument = parse(path.join(rules, 'activity-phases.json'));
assert.equal(phaseDocument.rows.length, activities.length);
assert.equal(new Set(phaseDocument.rows.map(v => v.sourceTable + '/' + v.actId)).size, activities.length);
assert.equal(phaseDocument.summary['ActFrameTable/server-stage-list-required'], 811);
for (const entry of phaseDocument.rows) {
  const original = row(entry.sourceTable, entry.sourceTable === 'ActFrameTable' ? 'Act' : 'Activity', Number(entry.actId));
  for (const [key, value] of Object.entries(entry.originalFields)) assert.deepEqual(value, original[key]);
  if (entry.sourceTable === 'ActFrameTable') {
    if (Object.hasOwn(entry.unshiftedExample, 'authoritativeStageTimeListObserved')) {
      assert.equal(entry.unshiftedExample.authoritativeStageTimeListObserved, false);
    }
    if (!original.stage.length) assert.equal(entry.currentPolicyExample.phases.length, 0);
  }
}
const moduleIndex = parse(path.join(rules, 'module-rule-index.json'));
const commandTypes = moduleIndex.groups.flatMap(group => group.commands.map(command => command.type));
assert.equal(new Set(commandTypes).size, commandTypes.length);
assert.equal(commandTypes.length, moduleIndex.commandCount);
assert.equal(moduleIndex.groups.length, moduleIndex.moduleCount);
assert.equal(moduleIndex.moduleCount, 297);
assert.equal(moduleIndex.commandCount, 1407);
const rulebookCounts = { system: { groups: 0, commands: 0 }, activity: { groups: 0, commands: 0 } };
for (const group of moduleIndex.groups) {
  const rulebook = path.resolve(rules, group.rulebook.split('#')[0]);
  const text = fs.readFileSync(rulebook, 'utf8');
  assert.ok(text.includes(group.task), 'Task absent from assigned detailed rulebook: ' + group.task);
  for (const command of group.commands) {
    assert.ok(new RegExp('(?<![0-9])' + command.type + '(?![0-9])').test(text),
      'Command absent from assigned detailed rulebook: ' + group.task + '/' + command.type);
  }
  const domain = group.rulebook.includes('system-rulebooks') ? 'system' : 'activity';
  rulebookCounts[domain].groups++;
  rulebookCounts[domain].commands += group.commands.length;
}
assert.deepEqual(rulebookCounts, { system: { groups: 139, commands: 881 }, activity: { groups: 158, commands: 526 } });
const productLines = fs.readFileSync(path.join(rules, 'products.md'), 'utf8').match(/^\|\d+\|/gm) ?? [];
assert.equal(productLines.length, rows('RechargeTable', 'Recharge').length);
assert.equal(parse(path.join(rules, 'draw-pools.json')).rows.length, rows('DrawTable', 'LibWeight').length);
const schedule = fs.readFileSync(path.join(rules, 'activity-calendar.md'), 'utf8');
assert.equal((schedule.match(/^\|\d+\|\d{4}-/gm) ?? []).length, 90);
assert.ok(schedule.includes('|2|2026-11-13 05:00:00+08:00|'));
assert.ok(schedule.includes('|3|2026-11-14 05:00:00+08:00|'));

// R1 is an explicit reconstruction decision. Independent calendar constants
// below must not be calculated from the generator's own output formulas.
const dynamic = parse(path.join(rules, 'dynamic-schedule-decisions.json'));
assert.equal(dynamic.baseline, RULE_BASELINE);
assert.equal(dynamic.originalServerSchedulerRecovered, false);
assert.equal(dynamic.authoritativeOriginalInstancesObserved, false);
assert.deepEqual(dynamic.rows.map(entry => entry.actId).sort((a, b) => a - b), [175001, 1036008, 1037001, 1037002]);
const dynamicById = new Map(dynamic.rows.map(entry => [entry.actId, entry]));
const expectedWindows = new Map([
  [175001, ['2025-06-27T05:00:00+08:00', '2025-08-31T05:00:00+08:00']],
  [1036008, ['2027-01-29T05:00:00+08:00', '2027-02-12T04:50:00+08:00']],
  [1037001, ['2026-12-10T05:00:00+08:00', '2026-12-14T05:00:00+08:00']],
  [1037002, ['2027-02-09T05:00:00+08:00', '2027-02-13T05:00:00+08:00']]
]);
for (const entry of dynamic.rows) {
  assert.equal(entry.identity, '复刻推定');
  assert.equal(entry.originalServerFunctionRecovered, false);
  assert.equal(entry.authoritativeOriginalInstanceObserved, false);
  assert.equal(entry.automaticRecurrence, false);
  const original = row('ActFrameTable', 'Act', entry.actId);
  for (const [field, value] of Object.entries(entry.rawTimeFields)) assert.deepEqual(value, original[field]);
  assert.deepEqual(entry.rawType, row('ActFrameTable', 'ActType', original.type));
  assert.deepEqual([entry.decidedFirstInstance.start, entry.decidedFirstInstance.end], expectedWindows.get(entry.actId).map(timestamp));
  assert.ok(entry.decidedFirstInstance.scopeId && entry.decidedFirstInstance.occurrenceId);
  const stages = entry.decidedFirstInstance.stages;
  assert.equal(stages[0].start, entry.decidedFirstInstance.start);
  assert.equal(stages.at(-1).end, entry.decidedFirstInstance.end);
  for (let i = 0; i < stages.length; i++) {
    assert.ok(stages[i].end > stages[i].start);
    if (i > 0) assert.equal(stages[i].start, stages[i - 1].end);
  }
  const originalActivity = activities.find(a => a.sourceTable === 'ActFrameTable' && a.row.tid === entry.actId);
  assert.deepEqual(originalActivity.reconstructionDecision.decidedFirstInstance, entry.decidedFirstInstance);
  if (entry.actId !== 175001) {
    assert.deepEqual(original.time_fun_args, [{ 1036008: 79, 1037001: 29, 1037002: 90 }[entry.actId], 1, 0]);
    assert.equal(original.time_fun, 461);
    assert.equal(original.time_type, 5);
    assert.equal(entry.rawType.data_type, 2);
    assert.equal(entry.remainingFunctionArgumentsInterpretation, 'opaque-do-not-infer-weekday-or-cycle');
  }
}
const summer = dynamicById.get(175001), dragon = dynamicById.get(1036008);
assert.equal(summer.rawTimeFields.time_type, 0);
assert.equal(summer.rawTimeFields.time_fun, 0);
assert.equal(summer.rawType.data_type, 1);
for (const entry of [summer, dragon]) {
  assert.deepEqual(entry.rawTimeFields.stage, []);
  assert.equal(entry.decidedFirstInstance.stages.length, 1);
  assert.equal(entry.decidedFirstInstance.stages[0].stageId, 50);
  assert.equal(entry.decidedFirstInstance.stages[0].source, 'r1-explicit-server-stage-override');
}
assert.equal(summer.rawTimeFields.duration_day, 0);
assert.equal(row('ActFrameTable', 'Act', 174001).world_time, timestamp('2025-06-27T05:00:00+08:00'));
assert.deepEqual(dynamicById.get(1037001).decidedFirstInstance.stages.map(stage => [stage.stageId, stage.start, stage.end]), [
  [50, timestamp('2026-12-10T05:00:00+08:00'), timestamp('2026-12-13T22:00:00+08:00')],
  [90, timestamp('2026-12-13T22:00:00+08:00'), timestamp('2026-12-14T05:00:00+08:00')]
]);
assert.deepEqual(dynamicById.get(1037002).decidedFirstInstance.stages.map(stage => [stage.stageId, stage.start, stage.end]), [
  [50, timestamp('2027-02-09T05:00:00+08:00'), timestamp('2027-02-12T22:00:00+08:00')],
  [90, timestamp('2027-02-12T22:00:00+08:00'), timestamp('2027-02-13T05:00:00+08:00')]
]);
assert.equal(firstNonOverlappingDreamStart(timestamp('2027-02-09T05:00:00+08:00'), timestamp('2027-02-09T05:00:00+08:00')),
  timestamp('2027-02-09T05:00:00+08:00'));
assert.equal(firstNonOverlappingDreamStart(timestamp('2027-02-09T05:00:00+08:00'), timestamp('2027-02-09T22:00:00+08:00')),
  timestamp('2027-02-10T05:00:00+08:00'));
assert.equal(firstNonOverlappingDreamStart(timestamp('2027-02-09T05:00:00+08:00'), timestamp('2027-02-09T04:59:59+08:00')),
  timestamp('2027-02-09T05:00:00+08:00'));
assert.equal(firstNonOverlappingDreamStart(timestamp('2027-02-09T05:00:00+08:00'), timestamp('2027-02-09T05:00:01+08:00')),
  timestamp('2027-02-10T05:00:00+08:00'));
const midnightOpen = timestamp('2026-11-12T00:00:00+08:00');
assert.equal(r1GroupOpeningDay(timestamp('2026-11-12T04:59:59+08:00'), midnightOpen), 1);
assert.equal(r1GroupOpeningDay(timestamp('2026-11-12T05:00:00+08:00'), midnightOpen), 2);
assert.equal(r1GroupOpeningDay(timestamp('2026-11-13T04:59:59+08:00'), midnightOpen), 2);
assert.equal(r1GroupOpeningDay(timestamp('2026-11-13T05:00:00+08:00'), midnightOpen), 3);
assert.equal(r1GroupOpeningDay(timestamp('2026-11-13T04:59:59+08:00'), timestamp('2026-11-12T18:00:00+08:00')), 1);
assert.equal(r1GroupOpeningDay(timestamp('2026-11-13T05:00:00+08:00'), timestamp('2026-11-12T18:00:00+08:00')), 2);
const sameOpen = timestamp(dynamic.serverOpeningInput);
const groupA = projectDynamicDecisions(activities, sameOpen, { realmId: '3', groupId: 'A', groupMasterOpenedAt: sameOpen });
const groupB = projectDynamicDecisions(activities, sameOpen, { realmId: '3', groupId: 'B', groupMasterOpenedAt: sameOpen });
assert.equal(groupA[0].decidedFirstInstance.instanceKey, groupB[0].decidedFirstInstance.instanceKey, '175001 is server-scoped');
for (let i = 1; i < groupA.length; i++) assert.notEqual(groupA[i].decidedFirstInstance.instanceKey, groupB[i].decidedFirstInstance.instanceKey);
const earlierMaster = projectDynamicDecisions(activities, sameOpen, { realmId: '3', groupId: 'older',
  groupMasterOpenedAt: timestamp('2026-11-01T18:00:00+08:00') });
assert.equal(earlierMaster.find(e => e.actId === 1037001).decidedFirstInstance.start, timestamp('2026-11-29T05:00:00+08:00'));
const midnightGroup = projectDynamicDecisions(activities, midnightOpen);
assert.equal(midnightGroup.find(e => e.actId === 1037001).decidedFirstInstance.start, timestamp('2026-12-09T05:00:00+08:00'));
assert.throws(() => projectDynamicDecisions(activities, sameOpen, { groupMasterOpenedAt: sameOpen }), /group identity/);
assert.throws(() => r1GroupOpeningDay(NaN, sameOpen), /timestamp/);

const expectedSkinRewards = [[156912, 1054000], [157012, 1014000], [157212, 1024000], [157412, 1034000], [157612, 1044000]];
assert.equal(dynamic.buySkinVersion1.length, 5);
for (const [i, entry] of dynamic.buySkinVersion1.entries()) {
  const { row: item, product } = entry;
  assert.deepEqual(item, row('BuySkinActTable', 'BuySkinAct', i + 1));
  assert.equal(item.version, 1);
  assert.equal(item.unlock_day, [1, 3, 17, 31, 45][i]);
  assert.equal(item.con_time, 3);
  assert.deepEqual(item.award_list, [[101500, 50]]);
  assert.equal(item.gift, 1180001 + i);
  assert.equal(product.price, 32800);
  assert.equal(product.can_buy_times, 1);
  assert.equal(product.buy_cycle_limit, 5);
  assert.deepEqual(product.reward_tid, expectedSkinRewards[i]);
  assert.deepEqual(product.reward_count, [1, 1]);
  assert.deepEqual(product, row('RechargeTable', 'Recharge', item.gift));
}
const selectedSkinEvidence = parse(trackedFile(decisionRoot + 'buyskin175001/selected-evidence.json'));
assert.equal(selectedSkinEvidence.scenarios.length, 13);
assert.equal(selectedSkinEvidence.policy.roleCreationDoesNotRestart, true);
assert.equal(selectedSkinEvidence.policy.loop, false);
const expectedFreeWindows = [
  ['2025-06-27T05:00:00+08:00', '2025-06-30T05:00:00+08:00'],
  ['2025-06-29T05:00:00+08:00', '2025-07-02T05:00:00+08:00'],
  ['2025-07-13T05:00:00+08:00', '2025-07-16T05:00:00+08:00'],
  ['2025-07-27T05:00:00+08:00', '2025-07-30T05:00:00+08:00'],
  ['2025-08-10T05:00:00+08:00', '2025-08-13T05:00:00+08:00']
];
for (const [i, entry] of selectedSkinEvidence.skinWindows.entries()) {
  assert.deepEqual([timestamp(entry.unlock), timestamp(entry.free_end_exclusive)], expectedFreeWindows[i].map(timestamp));
  assert.equal(timestamp(entry.buy_end_exclusive), timestamp('2025-08-31T05:00:00+08:00'));
}
for (const source of selectedSkinEvidence.qualification.sources) assert.equal(sha(fs.readFileSync(trackedFile(source.source))), source.sha256);
const scriptBytes = fs.readFileSync(trackedFile('analysis/scratchpad/game-rules-20261114/MethodScript.data.lua.bin'));
assert.equal(sha(scriptBytes), '89d91e90e1303de26e79aa9f598f025ef122362c31f27049042bdfac4d7917c3');
const script = parseLuaJit(scriptBytes).prototypes[194];
assert.deepEqual([script.instructions[1].name, script.instructions[1].d], ['KSHORT', 3]);
assert.deepEqual([script.instructions[5].name, script.instructions[5].d], ['KSHORT', 2]);
assert.deepEqual([script.instructions[7].name, script.instructions[7].d], ['KSHORT', 30203]);
const methodTable = parseLuaJit(fs.readFileSync(trackedFile('analysis/scratchpad/game-rules-20261114/MethodTable.data.lua.bin')));
assert.equal(methodTable.prototypes[1].constants[methodTable.prototypes[1].instructions[8].c].value, 'EGreaterThan');
assert.equal(methodTable.prototypes[1].instructions[9].c, 3);
assert.equal(methodTable.prototypes[3].constants[methodTable.prototypes[3].instructions[280].d].value, 'MissionMgr');
assert.equal(methodTable.prototypes[3].constants[methodTable.prototypes[3].instructions[281].c].value, 'GetPassedSection');
assert.equal(methodTable.prototypes[3].instructions[282].c, 2);
// Check the original comparator body as well as its name: argument 1 <=
// argument 0 returns true, so the section threshold is inclusive (>=).
const methodUtilBytes = fs.readFileSync(trackedFile(decisionRoot + 'method461/assets/1434396068272510500-MethodUtil.lua.bin'));
assert.equal(sha(methodUtilBytes), '46530e7ec05aaa7d7befd60ec94afa84bf173b831d1f9fe4ff779ea99eecdb49');
const methodUtil = parseLuaJit(methodUtilBytes);
const methodUtilRoot = methodUtil.prototypes[methodUtil.rootPrototype];
assert.equal(methodUtilRoot.constants[methodUtilRoot.instructions[10].c].value, 'EGreaterThan');
assert.equal(methodUtilRoot.constants[methodUtilRoot.instructions[9].d].prototype, 2);
assert.deepEqual(methodUtil.prototypes[2].instructions.map(({ name, a, d }) => [name, a, d]), [
  ['ISLE', 1, 0], ['JMP', 2, 32770], ['KPRI', 2, 1],
  ['JMP', 3, 32769], ['KPRI', 2, 2], ['RET1', 2, 2]
]);
const originalSkinData = skinEvidenceSources.find(source => source.source.endsWith('-BuySkinData.lua.bin'));
const freeProto = parseLuaJit(fs.readFileSync(trackedFile(originalSkinData.source))).prototypes[3];
const freeNames = freeProto.constants.filter(c => c.type === 'string').map(c => c.value);
for (const name of ['unlock_day', 'con_time', 'IsSameDay']) assert.ok(freeNames.includes(name));
assert.ok(!freeNames.some(name => /HasSkin|IsBuy|IsPay|HaveHero/.test(name)), 'Free-reward function must not gain a purchase requirement');

const documentedFeatures = parse(path.join(docRoot, 'appendices/feature-rule-decisions.json'));
const runtimeFeatures = parse(trackedFile('personal-server/config/fun-open-rules.json'));
assert.deepEqual(documentedFeatures.documentedSummary, { rules: 523, conditionsProved: 220, remainingGap: 303, newlyProvedRows: 44 });
assert.deepEqual(documentedFeatures.currentRuntimeSummary, runtimeFeatures.summary);
assert.equal(documentedFeatures.currentRuntimeSummary.ready, 177);
assert.equal(documentedFeatures.currentRuntimeSummary.evidenceGap, 346);
assert.deepEqual(evidenceManifest.documentedFeatureSummary, documentedFeatures.documentedSummary);
for (const entry of documentedFeatures.rows) {
  assert.deepEqual(entry.currentRuntimeRule, runtimeFeatures.rules.find(rule => rule.funId === entry.funId));
  assert.ok(entry.remainingGaps.every(gap => gap.scriptId !== 955132601007));
}
const skinGate = documentedFeatures.rows.find(entry => entry.funId === 1514);
assert.equal(skinGate.documentedStatus, 'conditions-proved');
assert.deepEqual(skinGate.documentedConditions, [{ type: 'passed_section_tid', operator: '>=', args: { sectionTid: 30203 } }]);
assert.equal(skinGate.currentRuntimeRule.sysSwitch, 92098);
assert.equal(skinGate.currentRuntimeRule.status, 'ready');

const finalRegister = parse(path.join(rules, 'final-rule-register.json'));
assert.equal(finalRegister.baseline, RULE_BASELINE);
assert.equal(finalRegister.investigationDefaultsAdopted, false);
assert.equal(finalRegister.moduleCount, 297);
assert.equal(finalRegister.commandCount, 1407);
assert.equal(finalRegister.policies.length, 16);
const policyIds = new Set(finalRegister.policies.map(policy => policy.id));
assert.equal(policyIds.size, 16);
assert.deepEqual(finalRegister.groups.map(g => g.task).sort(), moduleIndex.groups.map(g => g.task).sort());
const research = ['instances', 'buyskin175001'].flatMap(name => parse(trackedFile(decisionRoot + name + '/decisions.json')).groups);
assert.equal(research.length, 297);
assert.equal(new Set(research.map(g => g.task)).size, 297);
for (const group of research) if (group.sourceSectionSnapshot) {
  assert.equal(sha(group.sourceSectionSnapshot), group.source.sectionSha256, 'Historic source-section snapshot changed: ' + group.task);
}
for (const group of finalRegister.groups) {
  assert.ok(group.executionDecision.trim().length > 25);
  assert.equal(group.decisionId, `${RULE_BASELINE}/${group.task}`);
  assert.deepEqual(group.commandTypes, moduleIndex.groups.find(g => g.task === group.task).commands.map(c => c.type));
  const expected = taskOverrides[group.task] ?? research.find(g => g.task === group.task).decision;
  assert.equal(group.executionDecision, expected.replace(/C0/g, 'R1-ROLLOVER旧币冻结').replace(/C1/g, 'R1-ROLLOVER确定旧权益交付'));
  assert.ok(!/\bC[01]\b/.test(group.executionDecision), 'Unresolved shorthand: ' + group.task);
  assert.ok(!Object.hasOwn(group, 'originalAlgorithmsAllRecovered'), 'Coverage is not an original-recovery status');
  assert.ok(group.policyIds.length > 0 && group.policyIds.every(id => policyIds.has(id)));
  const sourceText = fs.readFileSync(path.resolve(rules, group.rulebook.split('#')[0]), 'utf8');
  assert.ok(sourceText.includes(`../rules/final-rule-register.md#${group.task.toLowerCase()})`), 'Missing exact R1 task link: ' + group.task);
}
assert.equal(finalRegister.evidenceNoteCount, finalRegister.evidenceNotes.length);
for (const note of finalRegister.evidenceNotes) {
  assert.ok(note.policyIds.length > 0 && note.policyIds.every(id => policyIds.has(id)));
  const line = fs.readFileSync(trackedFile(note.source), 'utf8').split(/\r?\n/)[note.line - 1];
  assert.equal(line, note.sourceText);
  assert.equal(sha(line), note.sourceTextSha256);
  assert.equal(note.executionState, 'decided-by-r1; source-evidence-qualification-preserved');
}
for (const task of ['DRAW-PYRAMID', 'DRAW-THREEADMONITION', 'DRAW-CHESS', 'DRAW-PRAYACT', 'DRAW-TURNTABLEACT',
  'DRAW-HUNDREDDRAWACT', 'PLAY-CARNIVAL', 'PLAY-MONOPOLYACT', 'PAY-DIAMONDBANKACT', 'PAY-SLOTGAMEACT', 'PAY-HUNDREDACC', 'PAY-ACCRECHARGEACT']) {
  const decision = finalRegister.groups.find(g => g.task === task);
  assert.equal(decision.specificOverride, true, 'Unaudited probabilistic/money suggestion: ' + task);
  assert.match(decision.executionDecision, /受限|不.*新/);
}
const skinText = fs.readFileSync(path.join(docRoot, 'activity-rulebooks/commerce-and-benefits.md'), 'utf8');
assert.ok(!skinText.includes('不能购买前先把附赠都领完'));
assert.ok(!skinText.includes('CrossTable和广告/功能奖励配置及领取状态缺失'));
const unresolvedText = fs.readFileSync(path.join(rules, 'unresolved.md'), 'utf8');
assert.ok(!unresolvedText.includes('原绝对世界活动是否应随本服平移'));
for (const name of ['buyskin175001', 'instances']) {
  const text = fs.readFileSync(trackedFile(decisionRoot + name + '/decisions.md'), 'utf8');
  assert.ok(text.includes('不是有效实施规范'));
  assert.ok(text.includes('final-rule-register.md'));
}
const historyDirectory = trackedFile('docs/plans/remaining-gameplay-20261106');
for (const name of fs.readdirSync(historyDirectory).filter(name => name.endsWith('.md'))) {
  const text = fs.readFileSync(path.join(historyDirectory, name), 'utf8');
  assert.ok(text.includes('<!-- r1-rule-status -->') && text.includes('12-final-rule-baseline.md'));
  assert.ok(!text.includes('旧文档冲突时以当前源码与更新日期为准'));
}

function markdownFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
    ? markdownFiles(path.join(directory, entry.name)) : entry.name.endsWith('.md') ? [path.join(directory, entry.name)] : []);
}
let linkCount = 0;
const anchors = new Map();
function anchorsIn(file) {
  if (anchors.has(file)) return anchors.get(file);
  const contents = fs.readFileSync(file, 'utf8').replace(/^```[^\n]*\n[\s\S]*?^```[^\n]*$/gm, '');
  const found = new Set(), duplicates = new Map();
  for (const match of contents.matchAll(/^#{1,6}\s+(.+)$/gm)) {
    const heading = match[1].trim().replace(/\s+#+\s*$/, '').replace(/<[^>]*>/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[`*~]/g, '').toLowerCase()
      .replace(/[^\p{L}\p{N}\p{M}_\-\s]/gu, '').replace(/\s/g, '-');
    const count = duplicates.get(heading) ?? 0;
    found.add(heading + (count ? '-' + count : ''));
    duplicates.set(heading, count + 1);
  }
  for (const match of contents.matchAll(/\b(?:id|name)=["']([^"']+)["']/g)) found.add(match[1]);
  anchors.set(file, found);
  return found;
}
const docs = [...markdownFiles(docRoot), path.join(root, 'docs/README.md'), path.join(root, 'AGENTS.md'),
  path.join(root, 'personal-server/README.md'), ...markdownFiles(historyDirectory),
  ...['docs/08-activity-fix-checklist.md', 'docs/09-system-completion-plan.md', 'docs/10-store-product-flow-remediation-plan.md',
    'agent/workflow/rule-baseline-20261115/implementation.md',
    ...['method461/report.md', 'buyskin175001/report.md', 'instances/report.md',
      'buyskin175001/decisions.md', 'instances/decisions.md'].map(file => decisionRoot + file)].map(trackedFile)];
const record = path.join(root, 'agent/workflow/detailed-rules-20261114/implementation.md');
if (fs.existsSync(record)) docs.push(record);
for (const file of docs) {
  const text = fs.readFileSync(file, 'utf8');
  if (text.includes('\uFFFD')) issues.push({ file: path.relative(root, file), reason: 'Unicode replacement character' });
  if (/[^\S\r\n]+\r?$/m.test(text)) issues.push({ file: path.relative(root, file), reason: 'Trailing whitespace' });
  const fences = text.match(/^```/gm) ?? [];
  if (fences.length % 2 !== 0) issues.push({ file: path.relative(root, file), reason: 'Unpaired code fence' });
  const prose = text.replace(/^```[^\n]*\n[\s\S]*?^```[^\n]*$/gm, '').replace(/`[^`\n]*`/g, '');
  for (const match of prose.matchAll(/\[[^\]\n]*\]\(([^)\n]+)\)/g)) {
    let target = match[1].trim();
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(target) || target.startsWith('mailto:')) continue;
    const [localTarget, fragment] = target.replace(/^<|>$/g, '').split('#');
    target = localTarget.split('?')[0];
    try { target = decodeURIComponent(target); } catch { /* Literal configuration strings are not URL-decoded. */ }
    linkCount++;
    const resolved = target ? path.resolve(path.dirname(file), target) : file;
    if (!fs.existsSync(resolved)) issues.push({ file: path.relative(root, file), target });
    else if (fragment && resolved.endsWith('.md') && !anchorsIn(resolved).has(decodeURIComponent(fragment))) {
      issues.push({ file: path.relative(root, file), target: (target || path.basename(file)) + '#' + fragment });
    }
  }
}
if (issues.length) {
  const grouped = new Map();
  for (const issue of issues) {
    const key = issue.target ?? issue.reason;
    if (!grouped.has(key)) grouped.set(key, new Set());
    grouped.get(key).add(issue.file);
  }
  console.error(JSON.stringify({ issueCount: issues.length,
    issues: [...grouped].map(([target, files]) => ({ target, files: [...files] })) }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ markdownFiles: docs.length, localLinks: linkCount,
  tableDocuments: tableCount, families: familyCount, recoveredRows: rowCount, unresolvedFamilies: unresolved,
  activities: activities.length, moduleGroups: moduleIndex.moduleCount, commands: moduleIndex.commandCount,
  rulebookCounts, activityPhaseRows: phaseDocument.rows.length,
  products: productLines.length, drawLibraries: rows('DrawTable', 'LibWeight').length, calendarDays: 90,
  baseline: RULE_BASELINE, dynamicDecisions: dynamic.rows.length, policies: policyIds.size,
  evidenceQualifications: finalRegister.evidenceNoteCount, lockedCompatibilitySources: lockedSources.sources.length,
  documentedFeatures: documentedFeatures.documentedSummary, currentRuntimeFeatures: { ready: 177, gap: 346 },
  checks: ['source/output SHA256', 'complete row counts and nonempty schemas', 'independent original values',
    'original time boundaries and stage overrides', 'unrebased original absolute dates',
    'independent R1 dates, day age and dream conflict boundaries', 'real scope identity isolation',
    'skin products/free windows and original qualification bytecode', 'documented proof versus runtime mapping',
    'all task decisions and source qualifications, rejected research defaults', 'historical priority withdrawal',
    'complete rulebook/command/product/library coverage', 'local links, heading anchors, fences and whitespace'] }, null, 2));
