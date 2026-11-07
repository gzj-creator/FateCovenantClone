// Guide step awards: awardTid -> { processId, keyId, items }.
//
// Evidence boundary: the client owns the guide flow in GuideTable
// (Process/ProcessExclusion/Node/Event/Award/Step/... tables) and the decoded
// bytecode of GuideTable.data.lua has not been materialized into rows, so no
// step reward amount is evidenced yet. GuideCmd:req_guide_award responses use
// pb_res_to_client, which means the real server grants items for the requested
// award tid; without GuideTable.Award rows the grant amounts would have to be
// invented. Rows therefore stay empty until that table is exported, and the
// service rejects an award tid that has no row instead of paying a guess.
const GUIDE_AWARD_ROWS = [
  // { awardTid: <GuideTable.Award id>, processId: <process tid>, keyId: <step id>, items: [[<item tid>, <count>]] }
];

export function readGuideAwards() {
  const awards = new Map();
  for (const row of GUIDE_AWARD_ROWS) awards.set(Number(row.awardTid), row);
  return awards;
}
