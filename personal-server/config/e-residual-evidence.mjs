import { readJsonAsset, tableAsset } from '../assets.mjs';

// R1 剩余命令 E 组（288、88401、88402、84901、84902）的原证据冻结层。
//
// 本模块只登记同版原表和客户端消费者能直接证明的事实，并把仍然缺失、会导致
// “先扣资源/先置领取位再补实现”的边界连同 decisionId 一起冻结。它不注册到网关，
// 不读取或修改任何玩家状态；五条命令继续由 r1-fail-closed-command-service 在支付
// 前返回 GameError(5)。若后续取得原服务端函数并改变下列任一结论，校验会立即失败，
// 迫使实施者重新打开对应 decisionId，而不是让旧的失败关闭理由悄悄过期。

const resCompletePath = tableAsset('ResCompleteTable.data.json.gz');
const resRollbackPath = tableAsset('ResRollbackTable.data.json.gz');
const taskGroupPath = tableAsset('TaskGroupTable.data.json.gz');

export const E_RESIDUAL_SOURCES = Object.freeze({
  resComplete: Object.freeze({
    bundle: 'ResCompleteTable.data.lua.bin',
    bundleSha256: '5F202F68363E6AD1E931B37A560EB2072345FCABEAEE2B5541C9D955A3337D35',
    asset: 'ResCompleteTable.data.json.gz',
    assetSha256: '9D612B293F51E035A47CA29AAB02F87EF515AB0C9806BBB660538B33CB87434E',
    families: Object.freeze({ Open: 3, Award: 1 })
  }),
  resRollback: Object.freeze({
    bundle: 'ResRollbackTable.data.lua.bin',
    bundleSha256: '381DB5022F4FFC32B0F183B58CEC0B31F5795F11E6D6D4E328CEE19518F0EC65',
    asset: 'ResRollbackTable.data.json.gz',
    assetSha256: '27F31320943E1C8E11E95784EFE66AD0A853DB9A8BBA87D944532612FB4AB424',
    families: Object.freeze({ Const: 1, Type: 8 })
  }),
  taskGroup: Object.freeze({
    bundle: 'TaskTable.data.lua.bin',
    bundleSha256: 'EF2157C0F875EE5EE5391AD1890607529442184F9D94950A448E67957DAEBA55',
    asset: 'TaskGroupTable.data.json.gz',
    assetSha256: 'A48549B7D9DA225C45A042BCF6D735711BD8CD09F1E23C0C5E52EB0218030215',
    families: Object.freeze({ Group: 6, GroupTask: 20, GroupFunc: 0, Type: 2, CommonTask: 4, CommonTaskGlobal: 4 }),
    note: 'TaskTable 的 TaskGroup 证据切片；Type 只保留 GroupTask 实际引用的 1202/8601 两行'
  })
});

export const E_RESIDUAL_DECISIONS = Object.freeze({
  288: 'R1-RESCOMPLETE-CLIENT-DOWNLOAD',
  88401: 'R1-RESROLLBACK-SERVER-PREVIEW',
  88402: 'R1-RESROLLBACK-SERVER-PREVIEW',
  84901: 'R1-TASKGROUP-GROUPFUNC',
  84902: 'R1-TASKGROUP-GROUPFUNC'
});

// 每个 type 的支付前阻断。列表顺序即证据优先级；任何一条都足以让该变更保持
// fail-closed，因为它们都位于“解析资格/成本/返还”之前，缺一项就无法安全结算。
export const E_RESIDUAL_BLOCKERS = Object.freeze({
  288: Object.freeze([
    'eligibility is the client download state (ResCompleteMgr.CanAward/IsDownloadFinish read one local UniCore download flag); no server-verifiable attestation exists',
    'req_res_complete_award carries no server-checkable chapter/day/size value, so a claim key cannot be derived from authoritative state',
    'the single Award row is known, but nothing proves which client/account may claim it once (original per-role claim record and source key are not recovered)'
  ]),
  88401: Object.freeze([
    'the preview list is computed by the original server; every client node only renders the returned res_list, so no client-side formula exists to recover',
    'rollback_res_id is an object id whose per-type meaning (hero/equip/artifact/relic/pet-equip/elves-bead/elves/pet) is not bound to a table row',
    'no authoritative development ledger exists to derive the amount actually consumed by the object'
  ]),
  88402: Object.freeze([
    'the refund consumer (which resources are returned and how much) is server-only and unrecovered; refresh_func in ResRollbackTable.Type is a post-response client refresh, not a refund formula',
    'object reset scope per rollback_type (stars/quality/level/blessings) and the to_client payload structure are not defined',
    'preview-then-execute fingerprint recheck and lineup/reference protection cannot be enforced without the two items above'
  ]),
  84901: Object.freeze([
    'TaskTable.GroupFunc is empty (0 rows), so the func_id that owns each group and the func_open condition cannot be derived',
    'group task progress producers for type 1202/8601 (progress_fun 10 / progress_type 2) are not wired to an authoritative counter in this server',
    'TaskTable.CommonTask keeps four shard references (1201/1202/1602/9001) whose rows are not parsed, so the task-level records cannot be resolved'
  ]),
  84902: Object.freeze([
    'TaskTable.GroupFunc is empty (0 rows); group ordering per func_id and the func_open gate required by pb_role_task_group are unknown',
    'group award rows are recovered (Group.award plus the previous-group got_award sequence), but their owning function and login module binding are not',
    'no evidence shows how the per-group got_award bitblock is indexed when a func owns several groups'
  ])
});

function integer(value, label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) {
    throw new Error(`Invalid E residual evidence ${label}: ${value}`);
  }
  return number;
}

function awardList(value, label) {
  if (!Array.isArray(value)) throw new Error(`E residual evidence ${label} is not a list`);
  return Object.freeze(value.map((pair, index) => {
    if (!Array.isArray(pair) || pair.length !== 2) throw new Error(`E residual evidence ${label}[${index}] is not a pair`);
    return Object.freeze([
      integer(pair[0], `${label}[${index}].tid`, { min: 1 }),
      integer(pair[1], `${label}[${index}].num`, { min: 0 })
    ]);
  }));
}

function rowsOf(parsed, family, expected) {
  if (!Array.isArray(parsed?.[family])) throw new Error(`E residual evidence is missing family ${family}`);
  if (parsed[family].length !== expected) {
    throw new Error(`E residual evidence family ${family} has ${parsed[family].length} rows; expected ${expected}`);
  }
  return parsed[family];
}

function byTid(rows, label) {
  const map = new Map();
  for (const row of rows) {
    const tid = integer(row?.tid, `${label}.tid`, { min: 1 });
    if (map.has(tid)) throw new Error(`E residual evidence ${label} has duplicate tid ${tid}`);
    map.set(tid, Object.freeze({ ...row, tid }));
  }
  return map;
}

function assertSameTids(map, expected, label) {
  const actual = [...map.keys()].sort((left, right) => left - right);
  const wanted = [...expected].sort((left, right) => left - right);
  if (actual.length !== wanted.length || actual.some((tid, index) => tid !== wanted[index])) {
    throw new Error(`E residual evidence ${label} tids changed: ${actual.join(',')}`);
  }
}

function sameAward(left, right) {
  return left.length === right.length
    && left.every((pair, index) => pair[0] === right[index][0] && pair[1] === right[index][1]);
}

function readResComplete(file) {
  const parsed = readJsonAsset(file);
  const open = rowsOf(parsed, 'Open', 3);
  const award = rowsOf(parsed, 'Award', 1);

  const openByTid = byTid(open, 'ResComplete.Open');
  assertSameTids(openByTid, [1, 2, 3], 'ResComplete.Open');
  for (const row of openByTid.values()) {
    // 这三列是“何时自动下载资源包”的门槛，不是领奖资格，必须独立命名以免混用。
    integer(row.old_player_day, `Open ${row.tid} old_player_day`);
    integer(row.download_chapter, `Open ${row.tid} download_chapter`);
    integer(row.second_chapter, `Open ${row.tid} second_chapter`, { min: 1 });
    integer(row.auto_download_day, `Open ${row.tid} auto_download_day`);
    integer(row.size, `Open ${row.tid} size`);
    integer(row.old_player_chapter, `Open ${row.tid} old_player_chapter`, { min: 1 });
  }

  const awardRow = award[0];
  if (integer(awardRow?.tid, 'ResComplete.Award.tid', { min: 1 }) !== 1) {
    throw new Error('ResComplete.Award is expected to hold the single tid 1 row');
  }
  // 原表用两个平行数组表示奖励：award 是资源 tid，award_n 是对应数量。逐项配对，
  // 缺数量不补 1，也不按索引回退到首行。
  if (!Array.isArray(awardRow.award) || !Array.isArray(awardRow.award_n)) {
    throw new Error('ResComplete.Award must hold parallel award and award_n arrays');
  }
  if (awardRow.award.length !== awardRow.award_n.length) {
    throw new Error('ResComplete.Award.award_n does not match award length');
  }
  const pairs = Object.freeze(awardRow.award.map((tid, index) => Object.freeze([
    integer(tid, `ResComplete.Award.award[${index}]`, { min: 1 }),
    integer(awardRow.award_n[index], `ResComplete.Award.award_n[${index}]`, { min: 0 })
  ])));
  if (!sameAward(pairs, [[101500, 200], [201500, 10000], [101800, 500]])) {
    throw new Error('ResComplete.Award rows changed; reopen ' + E_RESIDUAL_DECISIONS[288]);
  }

  return Object.freeze({
    command: 288,
    requestSchema: 'req_res_complete_award',
    awardTid: 1,
    award: pairs,
    autoDownloadOpenRows: [...openByTid.values()],
    eligibilitySource: 'client-download-state',
    serverVerifiableEligibility: false
  });
}

function readResRollback(file) {
  const parsed = readJsonAsset(file);
  const constant = rowsOf(parsed, 'Const', 1)[0];
  const typeRows = rowsOf(parsed, 'Type', 8);
  const types = byTid(typeRows, 'ResRollback.Type');
  assertSameTids(types, [1, 2, 3, 4, 5, 6, 7, 8], 'ResRollback.Type');

  const minStar = integer(constant?.can_rollback_min_star, 'Const.can_rollback_min_star', { min: 1 });
  const toStar = integer(constant?.rollback_to_star, 'Const.rollback_to_star', { min: 0 });
  if (minStar !== 6 || toStar !== 5) {
    throw new Error(`ResRollback.Const changed (${minStar}->${toStar}); reopen ${E_RESIDUAL_DECISIONS[88401]}`);
  }

  const expected = new Map([
    [1, ['HeroDataMgr.HeroResetUpData', 500]],
    [2, ['EquipDataMgr.EquipResetUpData', 100]],
    [3, ['ArtifactMgr.ArtifactResetUpData', 100]],
    [4, ['RelicMgr.RelicResetUpData', 100]],
    [5, ['PetEquipMgr.EquipResetUpData', 100]],
    [6, ['ElvesBeadMgr.ResetUpData', 100]],
    [7, ['ElvesMgr.ResetUpData', 100]],
    [8, ['PetMgr.ResetUpData', 100]]
  ]);
  const frozenTypes = new Map();
  for (const row of types.values()) {
    const reference = row.refresh_func?.reference ?? null;
    const [wantReference, wantCost] = expected.get(row.tid);
    if (reference !== wantReference) {
      throw new Error(`ResRollback.Type ${row.tid} refresh_func changed to ${reference}; reopen ${E_RESIDUAL_DECISIONS[88402]}`);
    }
    if (integer(row.cost_item, `Type ${row.tid} cost_item`, { min: 1 }) !== 101500) {
      throw new Error(`ResRollback.Type ${row.tid} cost_item changed`);
    }
    if (integer(row.cost_item_num, `Type ${row.tid} cost_item_num`, { min: 0 }) !== wantCost) {
      throw new Error(`ResRollback.Type ${row.tid} cost_item_num changed`);
    }
    integer(row.update_attr_play, `Type ${row.tid} update_attr_play`);
    integer(row.bi_log, `Type ${row.tid} bi_log`, { min: 1 });
    integer(row.refresh_free_time, `Type ${row.tid} refresh_free_time`);
    frozenTypes.set(row.tid, Object.freeze({
      tid: row.tid,
      refreshFunc: reference,
      costItem: 101500,
      costItemNum: wantCost,
      updateAttrPlay: Number(row.update_attr_play),
      biLog: Number(row.bi_log),
      refreshFreeTime: Number(row.refresh_free_time)
    }));
  }

  return Object.freeze({
    commands: Object.freeze([88401, 88402]),
    requestSchema: 'pb_res_rollback_req{rollback_type,rollback_res_id}',
    previewSchema: 'pb_res_rollback_preview_ret{res_list}',
    executeSchema: 'pb_res_rollback_ret{res,to_client}',
    constant: Object.freeze({ minStar, toStar }),
    types: frozenTypes,
    refundFormulaRecovered: false
  });
}

function readTaskGroup(file) {
  const parsed = readJsonAsset(file);
  const groupRows = rowsOf(parsed, 'Group', 6);
  const taskRows = rowsOf(parsed, 'GroupTask', 20);
  const funcRows = rowsOf(parsed, 'GroupFunc', 0);
  const typeRows = rowsOf(parsed, 'Type', 2);
  const commonTask = rowsOf(parsed, 'CommonTask', 4);
  const commonGlobal = rowsOf(parsed, 'CommonTaskGlobal', 4);

  const groups = byTid(groupRows, 'TaskTable.Group');
  assertSameTids(groups, [1001, 1002, 1003, 1004, 1005, 1006], 'TaskTable.Group');
  const tasks = byTid(taskRows, 'TaskTable.GroupTask');
  assertSameTids(tasks, [
    100101, 100201, 100202, 100203, 100301, 100302, 100303, 100304,
    100401, 100402, 100403, 100404, 100501, 100502, 100503, 100504,
    100601, 100602, 100603, 100604
  ], 'TaskTable.GroupTask');

  for (const group of groups.values()) {
    const award = awardList(group.award, `Group ${group.tid} award`);
    if (!sameAward(award, [[201500, 1]])) {
      throw new Error(`TaskTable.Group ${group.tid} award changed; reopen ${E_RESIDUAL_DECISIONS[84902]}`);
    }
    if (!Array.isArray(group.tasks) || group.tasks.length === 0) {
      throw new Error(`TaskTable.Group ${group.tid} has no task list`);
    }
    for (const taskTid of group.tasks) {
      if (!tasks.has(integer(taskTid, `Group ${group.tid} tasks[]`, { min: 1 }))) {
        throw new Error(`TaskTable.Group ${group.tid} references unknown GroupTask ${taskTid}`);
      }
    }
  }

  const typeIndex = byTid(typeRows, 'TaskTable.Type');
  if (typeIndex.get(1202)?.progress_fun !== 10 || typeIndex.get(1202)?.progress_type !== 1) {
    throw new Error('TaskTable.Type 1202 changed; reopen ' + E_RESIDUAL_DECISIONS[84901]);
  }
  if (typeIndex.get(8601)?.progress_type !== 2 || typeIndex.get(8601)?.data !== 42) {
    throw new Error('TaskTable.Type 8601 changed; reopen ' + E_RESIDUAL_DECISIONS[84901]);
  }
  for (const task of tasks.values()) {
    if (!typeIndex.has(Number(task.type))) {
      throw new Error(`TaskTable.GroupTask ${task.tid} references Type ${task.type} outside the frozen slice`);
    }
    const award = awardList(task.award, `GroupTask ${task.tid} award`);
    if (task.tid === 100101 ? award.length !== 0 : !sameAward(award, [[201500, 1]])) {
      throw new Error(`TaskTable.GroupTask ${task.tid} award changed; reopen ${E_RESIDUAL_DECISIONS[84901]}`);
    }
    integer(task.target_count, `GroupTask ${task.tid} target_count`, { min: 0 });
    integer(task.task_key, `GroupTask ${task.tid} task_key`);
  }

  if (funcRows.length !== 0) {
    throw new Error('TaskTable.GroupFunc is no longer empty; reopen ' + E_RESIDUAL_DECISIONS[84901]);
  }

  return Object.freeze({
    commands: Object.freeze([84901, 84902]),
    taskRequestSchema: 'pb_task_group_task_award_req{tid_list}',
    groupRequestSchema: 'pb_task_group_group_award_req{tid_list}',
    responseSchema: 'pb_task_group_{task,group}_award_rsp{res_change,task_group}',
    loginSchema: 'pb_role_task_group{func_id,task_groups[{group_id,got_award}],got_award,func_open}',
    groups,
    tasks,
    groupFuncRows: funcRows.length,
    typeIndex,
    commonTaskShards: Object.freeze([...commonTask]),
    commonTaskGlobal: Object.freeze([...commonGlobal]),
    groupAwardRowsRecovered: true,
    funcBindingRecovered: false
  });
}

let defaultCache;

export function readEResidualEvidence(options = {}) {
  const resCompleteFile = options.resComplete ?? resCompletePath;
  const resRollbackFile = options.resRollback ?? resRollbackPath;
  const taskGroupFile = options.taskGroup ?? taskGroupPath;
  const isDefault = resCompleteFile === resCompletePath
    && resRollbackFile === resRollbackPath
    && taskGroupFile === taskGroupPath;
  if (isDefault && defaultCache) return defaultCache;

  const evidence = Object.freeze({
    rVersion: 'R1',
    gameplayReady: false,
    decisions: E_RESIDUAL_DECISIONS,
    blockers: E_RESIDUAL_BLOCKERS,
    sources: E_RESIDUAL_SOURCES,
    resComplete: readResComplete(resCompleteFile),
    resRollback: readResRollback(resRollbackFile),
    taskGroup: readTaskGroup(taskGroupFile)
  });
  if (isDefault) defaultCache = evidence;
  return evidence;
}
