import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { hasBit, setBit } from './bit-block.mjs';
import { GameError } from './hero-progression.mjs';
import { rechargeClaimKey, rechargeDayIndex, requireRechargeRequestTuple } from './recharge-rules.mjs';
import { grantResources } from './resources.mjs';

const MODULE_ID = 547;
const SELECT_COMMAND = 102101;
const CLAIM_COMMAND = 102102;
const EXTRA_RET_HANDLE = 99;
const ACTIVE_RECHARGE_TYPE = 113;

const seconds = value => {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.floor(number > 100000000000 ? number / 1000 : number);
};

function readInfo(modules, codec) {
  const module = modules.get(MODULE_ID);
  const bytes = module ? rawBinary(module) : Buffer.alloc(0);
  if (!bytes.length) return { tid: 0, open_time: 0, end_time: 0, choose_tid: 0, buy_list: [] };
  return codec.unpack('pb_line_first_recharge', bytes);
}

function writeInfo(modules, info, codec) {
  modules.set(MODULE_ID, serializedBinary(codec.pack('pb_line_first_recharge', info)));
}

function groupList(tables) {
  return [...tables.LineFirstRechargeGroup.values()].sort((left, right) => Number(left.start_time) - Number(right.start_time));
}

function activeGroup(tables, at) {
  return groupList(tables)
    .filter(group => Number(group.start_time) <= at && (!Number(group.end_time) || at < Number(group.end_time)))
    .at(-1) ?? null;
}

function stagesForGroup(tables, group) {
  const groups = groupList(tables);
  const index = groups.findIndex(item => Number(item.tid) === Number(group.tid));
  const nextStart = Number(groups[index + 1]?.start_tid ?? Number.MAX_SAFE_INTEGER);
  const start = Number(group.start_tid);
  return [...tables.LineFirstRecharge.values()]
    .filter(stage => Number(stage.tid) >= start && Number(stage.tid) < nextStart)
    .sort((left, right) => Number(left.tid) - Number(right.tid));
}

function groupForStage(tables, tid) {
  const value = Number(tid);
  return groupList(tables).find(group => stagesForGroup(tables, group).some(stage => Number(stage.tid) === value)) ?? null;
}

function chooseList(tables, tid) {
  return [...tables.LineFirstRechargeChoose.values()]
    .filter(choose => Number(choose.belong) === Number(tid))
    .sort((left, right) => Number(left.tid) - Number(right.tid));
}

function defaultChoose(tables, tid) {
  return Number(chooseList(tables, tid)[0]?.tid ?? 0);
}

function nextStage(stages, tid) {
  return stages.find(stage => Number(stage.tid) > Number(tid)) ?? null;
}

function backfillPurchases(db, info, group, stages, tables) {
  if (!db || !Array.isArray(info.buy_list)) return 0;
  const products = new Map();
  for (const stage of stages) {
    for (const choose of chooseList(tables, stage.tid)) {
      products.set(Number(choose.gift), { stage: Number(stage.tid), choose: Number(choose.tid) });
    }
  }
  const bought = new Set(info.buy_list.map(row => Number(row.tid)));
  const start = Number(group.start_time);
  const end = Number(group.end_time);
  let added = 0;
  for (const order of db.prepare('SELECT product_id,created_at FROM recharge_orders ORDER BY rowid').all()) {
    const purchase = products.get(Number(order.product_id));
    if (!purchase || bought.has(purchase.stage)) continue;
    const buyTime = Math.floor(Date.parse(order.created_at) / 1000);
    if (!Number.isSafeInteger(buyTime) || buyTime < start || end && buyTime >= end) continue;
    info.buy_list.push({ tid: purchase.stage, buy_time: buyTime, rev_bin: Buffer.alloc(0), choose_tid: purchase.choose });
    bought.add(purchase.stage);
    added += 1;
  }
  return added;
}

export function createLineFirstRechargeService({ store, codec, tables, now = Date.now, logger = () => {} }) {
  if (!tables.LineFirstRechargeGroup || !tables.LineFirstRechargeChoose || !tables.LineFirstRecharge) {
    throw new Error('Linear first-recharge configuration is missing');
  }
  const log = event => { try { logger(event); } catch {} };
  const currentSeconds = () => seconds(now());

  function normalizeState(modules, at, db = null) {
    const before = modules.get(MODULE_ID) ? JSON.stringify(readInfo(modules, codec)) : null;
    const group = activeGroup(tables, at);
    if (!group) return { info: readInfo(modules, codec), group: null, stages: [], changed: false };
    const stages = stagesForGroup(tables, group);
    const stageIds = new Set(stages.map(stage => Number(stage.tid)));
    let info = readInfo(modules, codec);
    const existingGroup = groupForStage(tables, info.tid);
    if (!Number(info.tid) || Number(existingGroup?.tid) !== Number(group.tid)) {
      info = {
        tid: Number(group.start_tid),
        open_time: Number(group.start_time),
        end_time: Number(group.end_time),
        choose_tid: defaultChoose(tables, group.start_tid),
        buy_list: []
      };
    }
    info.buy_list = (info.buy_list ?? []).filter(row => stageIds.has(Number(row.tid)));
    backfillPurchases(db, info, group, stages, tables);
    const bought = new Set(info.buy_list.map(row => Number(row.tid)));
    let stage = stages.find(row => Number(row.tid) === Number(info.tid)) ?? stages.find(row => !bought.has(Number(row.tid))) ?? stages.at(-1) ?? null;
    if (stage && bought.has(Number(stage.tid))) {
      stage = stages.find(row => Number(row.tid) > Number(stage.tid) && !bought.has(Number(row.tid))) ?? stage;
    }
    info.tid = Number(stage?.tid ?? 0);
    info.open_time = Number(info.open_time || group.start_time);
    info.end_time = Number(info.end_time || group.end_time);
    const choices = chooseList(tables, info.tid);
    if (!choices.some(choose => Number(choose.tid) === Number(info.choose_tid))) info.choose_tid = Number(choices[0]?.tid ?? 0);
    const after = JSON.stringify(info);
    if (before !== after) writeInfo(modules, info, codec);
    return { info, group, stages, changed: before !== after };
  }

  function ensureLoginState() {
    return store.transaction((model, db) => {
      const modules = new Map(model.state.modules.value);
      const result = normalizeState(modules, currentSeconds(), db);
      if (result.changed) model.state.modules.value = [...modules];
      return result;
    });
  }

  function select(value) {
    const [chooseTid] = requireRechargeRequestTuple(value, 1, 'Linear first-recharge choice');
    const at = currentSeconds();
    return store.transaction(model => {
      const modules = new Map(model.state.modules.value);
      const { info, group } = normalizeState(modules, at);
      if (!group) throw new GameError(309, 'Linear first-recharge is not open');
      if ((info.buy_list ?? []).some(row => Number(row.tid) === Number(info.tid))) throw new GameError(310, 'Current linear first-recharge stage is already purchased');
      const choose = tables.LineFirstRechargeChoose.get(chooseTid);
      if (!choose || Number(choose.belong) !== Number(info.tid)) throw new GameError(5, 'Linear first-recharge choice is not configured for the current stage');
      info.choose_tid = chooseTid;
      writeInfo(modules, info, codec);
      model.state.modules.value = [...modules];
      const data = codec.pack('pb_line_first_recharge', info);
      log({ event: 'line_first_recharge_choice_selected', stage: Number(info.tid), chooseTid });
      return { value: { info }, data };
    });
  }

  function validatePurchase({ modules, product, at }) {
    const { info, group, stages, changed } = normalizeState(modules, at);
    if (!group) throw new GameError(309, 'Linear first-recharge is not open');
    if (Number(product?.type) !== ACTIVE_RECHARGE_TYPE) throw new GameError(5, 'Linear first-recharge product type is invalid');
    if ((info.buy_list ?? []).some(row => Number(row.tid) === Number(info.tid))) throw new GameError(307, 'Linear first-recharge stage was already purchased');
    const choose = tables.LineFirstRechargeChoose.get(Number(info.choose_tid));
    if (!choose || Number(choose.belong) !== Number(info.tid)) throw new GameError(5, 'Linear first-recharge choice is missing');
    if (Number(choose.gift) !== Number(product.tid)) throw new GameError(5, 'Linear first-recharge product does not match the selected gift');
    const stage = tables.LineFirstRecharge.get(Number(info.tid));
    if (!stage || !stages.some(row => Number(row.tid) === Number(stage.tid))) throw new GameError(5, 'Linear first-recharge stage is missing');
    return { info, group, stages, stage, choose, changed };
  }

  function assertPurchaseAvailable({ modules, product, at = currentSeconds() }) {
    return validatePurchase({ modules, product, at });
  }

  function purchase({ modules, product, at }) {
    const context = validatePurchase({ modules, product, at });
    const { info, stages, stage, choose } = context;
    const buyInfo = {
      tid: Number(stage.tid),
      buy_time: at,
      rev_bin: Buffer.alloc(0),
      choose_tid: Number(choose.tid)
    };
    info.buy_list.push(buyInfo);
    const following = nextStage(stages, stage.tid);
    if (following) {
      info.tid = Number(following.tid);
      info.choose_tid = defaultChoose(tables, following.tid);
    }
    writeInfo(modules, info, codec);
    const data = codec.pack('pb_line_first_recharge', info);
    log({ event: 'line_first_recharge_purchase_recorded', stage: Number(stage.tid), productId: Number(product.tid), nextStage: Number(info.tid) });
    return {
      info,
      buyInfo,
      extraRetList: [{ flag: EXTRA_RET_HANDLE, data }],
      data
    };
  }

  function claim(value) {
    const [tid, awardIndex] = requireRechargeRequestTuple(value, 2, 'Linear first-recharge claim');
    if (awardIndex <= 0) throw new GameError(1, 'Linear first-recharge award index must be positive');
    const at = currentSeconds();
    return store.transaction((model, db) => {
      const modules = new Map(model.state.modules.value);
      const { info, group } = normalizeState(modules, at);
      if (!group) throw new GameError(309, 'Linear first-recharge is not open');
      const buyInfo = (info.buy_list ?? []).find(row => Number(row.tid) === tid);
      if (!buyInfo) throw new GameError(1, 'Linear first-recharge stage has not been purchased');
      const stage = tables.LineFirstRecharge.get(tid);
      const award = stage?.award?.[awardIndex - 1];
      if (!stage || !Array.isArray(award) || award.length !== 2) throw new GameError(5, 'Linear first-recharge award is not configured');
      const elapsedDays = rechargeDayIndex(at) - rechargeDayIndex(buyInfo.buy_time);
      if (awardIndex > elapsedDays) throw new GameError(1, 'Linear first-recharge award is not open yet');
      const bits = Buffer.from(buyInfo.rev_bin ?? '', 'base64');
      if (hasBit(bits, awardIndex)) throw new GameError(310, 'Linear first-recharge award was already claimed');
      const key = rechargeClaimKey('line_first_recharge', tid, awardIndex);
      if (db.prepare('SELECT 1 FROM reward_claims WHERE role_id=? AND claim_type=? AND claim_key=?').get(model.state.roleId, 'line_first_recharge', key)) {
        throw new GameError(310, 'Linear first-recharge award was already claimed');
      }
      const res = grantResources(model, [[Number(award[0]), Number(award[1])]], tables, { codec });
      buyInfo.rev_bin = setBit(bits, awardIndex).toString('base64');
      const updatedModules = new Map(model.state.modules.value);
      writeInfo(updatedModules, info, codec);
      model.state.modules.value = [...updatedModules];
      db.prepare('INSERT INTO reward_claims VALUES (?,?,?,?)').run(
        model.state.roleId, 'line_first_recharge', key, new Date(at * 1000).toISOString()
      );
      const response = { res, buy_info: buyInfo };
      log({ event: 'line_first_recharge_award_claimed', stage: tid, awardIndex, changes: res.changes.length });
      return { value: response, data: codec.pack('pb_line_first_recharge_rev_back', response) };
    });
  }

  function supportsProduct(productOrId) {
    const product = typeof productOrId === 'object' ? productOrId : tables.Recharge?.get(Number(productOrId));
    return Number(product?.type) === ACTIVE_RECHARGE_TYPE
      && [...tables.LineFirstRechargeChoose.values()].some(choose => Number(choose.gift) === Number(product.tid));
  }

  return {
    supports: type => type === SELECT_COMMAND || type === CLAIM_COMMAND,
    execute(type, value) { return type === SELECT_COMMAND ? select(value) : claim(value); },
    ensureLoginState,
    assertPurchaseAvailable,
    purchase,
    supportsProduct,
    moduleId: MODULE_ID
  };
}
