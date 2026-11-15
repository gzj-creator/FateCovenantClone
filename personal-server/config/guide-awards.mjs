import { readGuideTables } from './guide-tables.mjs';

// GuideAwardStep asks for its award BEFORE HandleOver saves the same key.
// Early trigger predicates recovered from MethodScript.data.lua:
// 439774806001 requires passed Section >=10202;
// 439774810001 requires passed Section >=20201.
const MISSION_GATES = new Map([[1, 10202], [2, 20201], [11, 30204]]);
// MethodTable.Method 10 = FunOpenMgr.IsOpen, 79 = GuideMgr.GuideOverByTid.
// Empty dynamic-argument lists in MethodScript are TNEW, not TDUP; the actual
// FNEW/KNUM assignments resolve these predicates even though the older generic
// MethodScript index omitted them.
const PROCESS_GATES = new Map([
  [206, { completedGuides: [235] }],
  [366, { openFeatures: [1542] }],
  [10360, { openFeatures: [1625] }],
  [10361, { openFeatures: [1542], completedGuides: [10360] }],
  [10391, { openFeatures: [1635], completedGuides: [10390] }]
]);

export function readGuideAwards() {
  const tables = readGuideTables();
  const awards = new Map();
  for (const row of tables.Award.values()) {
    if (!Array.isArray(row.award_i) || row.award_i.length !== row.award_n?.length) {
      throw new Error('Invalid GuideTable.Award row: ' + row.tid);
    }
    const steps = [...tables.Step.values()].filter(step => step.step_module?.reference === 'GuideAwardStep'
      && Number(step.ref_int_param) === Number(row.tid));
    const paths = steps.flatMap(step => [...tables.Process.values()]
      .filter(process => [...(process.normal_steps ?? []), ...(process.special_steps ?? [])].flat().includes(step.tid))
      .map(process => ({ processId: process.tid, keyId: step.tid,
        ...PROCESS_GATES.get(Number(process.tid)) })));
    awards.set(Number(row.tid), {
      awardTid: Number(row.tid), items: row.award_i.map((tid, index) => [Number(tid), Number(row.award_n[index])]),
      paths, minMission: MISSION_GATES.get(Number(row.tid)) ?? null,
      processId: paths[0]?.processId, keyId: paths[0]?.keyId
    });
  }
  return awards;
}
