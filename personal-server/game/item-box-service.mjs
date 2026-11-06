import crypto from 'node:crypto';
import { GameError } from './hero-progression.mjs';
import { consumeResources, grantResources, rewardHandlerFor } from './resources.mjs';
import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';

// Backpack item commands (ItemCmd). Only rules fully described by shipped configuration run:
// ItemTable.Random_Box -> DrawTable lib (weighted group + weighted award), including configured guarantees.
// ItemTable.Designated_Box -> the configured fixed award list (151/157/159 use paths).
// ItemTable.OptionalBox -> the player's selected range entries (type 152 use_selected_box).
// ItemTable.OptionalSuitBox -> a suit box whose selected suit grants a fixed award_list (type 155).
// ItemTable.Chip -> chip composition (156) and one-key composition (158).
// ItemTable.Convert -> fixed manual conversion (154).
// Repeat boxes (153) and lottery boxes (157 lottery_list) are refused with a business error:
// this build ships no ItemTable.BoxRepeat rows and no lottery reward table, so neither rule
// can be reproduced from configuration. See
// agent/workflow/gameplay-completion/ITEM-ITEM/implementation.md for the evidence gap.
const MAX_USE = 999;
const MAX_BATCH = 20;
const MAX_ONE_KEY = 200;
const SKIN_MODULE = 65;
const HOUSE_ASSISTANT_MODULE = 148;
// Reward handlers that keep a countable row in model.resources instead of a bespoke module.
const RESOURCE_REWARD_KINDS = new Set(['item', 'currency', 'artifactCurrency']);
const GUARANTEE_FIELDS = ['noGuaranteeCount', 'openCount', 'counterGuaranteeCount', 'openTotalCount'];
const SCHEMA_STATEMENTS = [
  ['CREATE TABLE IF NOT EXISTS item_chip_compose_counts (',
    '  role_id INTEGER NOT NULL,',
    '  chip_tid INTEGER NOT NULL,',
    '  compose_count INTEGER NOT NULL DEFAULT 0,',
    '  updated_at TEXT NOT NULL,',
    '  PRIMARY KEY(role_id, chip_tid)',
    ')'],
  ['CREATE TABLE IF NOT EXISTS item_box_guarantee_state (',
    '  role_id INTEGER NOT NULL,',
    '  box_tid INTEGER NOT NULL,',
    '  no_guarantee_count INTEGER NOT NULL DEFAULT 0,',
    '  open_count INTEGER NOT NULL DEFAULT 0,',
    '  counter_guarantee_count INTEGER NOT NULL DEFAULT 0,',
    '  open_total_count INTEGER NOT NULL DEFAULT 0,',
    '  updated_at TEXT NOT NULL,',
    '  PRIMARY KEY(role_id, box_tid)',
    ')'],
  ['CREATE TABLE IF NOT EXISTS item_request_receipts (',
    '  role_id INTEGER NOT NULL,',
    '  request_key TEXT NOT NULL,',
    '  command_type INTEGER NOT NULL,',
    '  request_hash TEXT NOT NULL,',
    '  response_json TEXT NOT NULL,',
    '  created_at TEXT NOT NULL,',
    '  PRIMARY KEY(role_id, request_key)',
    ')']
].map(lines => lines.join('\n'));

export function createItemBoxService({ store, codec, tables, heroTables = null, random = Math.random, now = Date.now, logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };
  // HeroChip targets are hero tids, so composition needs the hero table inside the same
  // read-only view grantResources resolves handlers from.
  const grantTables = heroTables?.Hero ? { ...tables, Hero: heroTables.Hero } : tables;
  const timestamp = () => new Date(Number(now()) || Date.now()).toISOString();

  function ensureTables(db) {
    for (const statement of SCHEMA_STATEMENTS) db.exec(statement);
  }
  store.inspect(db => ensureTables(db));

  // Request receipts make a retransmitted command idempotent. The gateway supplies the
  // connection id and client sequence; direct service callers may omit context entirely.
  function requestScope(context) {
    if (!context) return null;
    const raw = context.requestId ?? (context.connection != null ? context.connection + ':' + (context.seq ?? 0) : null);
    if (raw == null) return null;
    const key = String(raw);
    if (!/^[A-Za-z0-9_.:-]{1,120}$/.test(key)) throw new GameError(1, 'Invalid item request ID');
    const type = Number(context.type);
    return { key, type: Number.isSafeInteger(type) && type > 0 ? type : 0 };
  }

  function fingerprintOf(type, descriptor) {
    return crypto.createHash('sha256').update(String(type)).update('|').update(JSON.stringify(descriptor)).digest('hex');
  }

  function reviveValue(value) {
    if (!value || !Array.isArray(value.changes)) return value;
    return {
      ...value,
      changes: value.changes.map(change => (change && change.new_bin)
        ? { ...change, new_bin: Buffer.isBuffer(change.new_bin) ? change.new_bin : Buffer.from(change.new_bin?.data ?? []) }
        : change)
    };
  }

  function commit(scope, descriptor, action) {
    return store.transaction((model, db) => {
      ensureTables(db);
      if (scope) {
        const stored = db.prepare('SELECT command_type,request_hash,response_json FROM item_request_receipts WHERE role_id=? AND request_key=?')
          .get(model.state.roleId, scope.key);
        if (stored) {
          if (Number(stored.command_type) !== scope.type || stored.request_hash !== fingerprintOf(scope.type, descriptor)) {
            throw new GameError(1, 'Item request ID was already used for a different request');
          }
          const replay = JSON.parse(stored.response_json);
          return { value: reviveValue(replay.value), data: Buffer.from(String(replay.data ?? ''), 'base64'), duplicate: true };
        }
      }
      const result = action(model, db);
      if (scope) {
        db.prepare('INSERT INTO item_request_receipts (role_id,request_key,command_type,request_hash,response_json,created_at) VALUES (?,?,?,?,?,?)')
          .run(model.state.roleId, scope.key, scope.type, fingerprintOf(scope.type, descriptor),
            JSON.stringify({ value: result.value, data: result.data.toString('base64') }), timestamp());
      }
      return { ...result, duplicate: false };
    });
  }

  function boxItem(tid) {
    const item = tables.Item.get(tid);
    if (!item) throw new GameError(5, 'Unknown item');
    const type = tables.Type.get(item.type);
    const objectClass = type?.obj_class?.reference ?? '';
    if (objectClass !== 'ItemBox' && objectClass !== 'ItemSuitBox') throw new GameError(5, 'This item is not an openable box');
    return item;
  }

  function randomRule(tid) {
    const draw = tables.Random_Box.get(tid);
    if (!draw) return null;
    const lib = tables.DrawLibWeight.get(draw.draw_lib);
    if (!lib) throw new GameError(5, 'Box draw library is missing from configuration');
    const groups = [...(lib.weight_group ?? [])].map(([weight, groupId]) => ({ weight, group: tables.DrawGroup.get(groupId) }));
    if (!groups.length || groups.some(entry => !entry.group)) throw new GameError(5, 'Box draw groups are missing from configuration');
    const groupEntries = ids => [...(ids ?? [])].map(groupId => {
      const group = tables.DrawGroup.get(groupId);
      if (!group) throw new GameError(5, 'Box guarantee group is missing from configuration');
      return { weight: 1, group };
    });
    const guaranteedGroups = groupEntries(lib.guaranteed_group);
    const counterGuaranteedGroups = groupEntries(lib.counter_guaranteed_group);
    const totalWeight = groups.reduce((sum, entry) => sum + Number(entry.weight ?? 0), 0);
    const guaranteedWeight = Number(lib.guaranteed_weight?.[0] ?? 0);
    const guaranteeThreshold = guaranteedGroups.length && guaranteedWeight > 0
      ? Math.max(1, Math.ceil(totalWeight / guaranteedWeight))
      : 0;
    return { kind: 'random', groups, guaranteedGroups, counterGuaranteedGroups, guaranteeThreshold };
  }

  function optionalRule(tid) {
    const optional = tables.OptionalBox.get(tid);
    if (!optional) return null;
    const optionalNum = Number(optional.optional_num);
    const range = Array.isArray(optional.range) ? optional.range : [];
    if (!Number.isSafeInteger(optionalNum) || optionalNum <= 0 || !range.length) throw new GameError(5, 'Optional box configuration is invalid');
    const options = range.map(entry => {
      if (!Array.isArray(entry) || entry.length < 2) throw new GameError(5, 'Optional box award is invalid');
      const rewardTid = Number(entry[0]), rewardNum = Number(entry[1]);
      if (!Number.isSafeInteger(rewardTid) || !Number.isSafeInteger(rewardNum) || rewardNum <= 0 || !tables.Item.has(rewardTid)) {
        // A few selectors award whole heroes rather than inventory items; those need a
        // hero-creation handler and must not be half-applied as an empty resource.
        throw new GameError(5, 'Optional box award is not an inventory item');
      }
      return [rewardTid, rewardNum];
    });
    return { kind: 'optional', optionalNum, options };
  }

  function designatedRule(tid) {
    const designated = tables.Designated_Box.get(tid);
    if (!designated) return null;
    const list = Array.isArray(designated.res_list) ? designated.res_list : [];
    if (!list.length) throw new GameError(5, 'Designated box configuration is invalid');
    const awards = list.map(entry => {
      if (!Array.isArray(entry) || entry.length < 2) throw new GameError(5, 'Designated box award is invalid');
      const rewardTid = Number(entry[0]), rewardNum = Number(entry[1]);
      if (!Number.isSafeInteger(rewardTid) || !Number.isSafeInteger(rewardNum) || rewardNum <= 0 || !tables.Item.has(rewardTid)) {
        throw new GameError(5, 'Designated box award is invalid');
      }
      return [rewardTid, rewardNum];
    });
    return { kind: 'designated', awards };
  }

  function rule(tid) {
    boxItem(tid);
    // Some legacy rows also appear in OptionalBox. The client checks the
    // fixed Designated_Box list before the random and optional rows.
    const designated = designatedRule(tid);
    if (designated) return designated;
    const random = randomRule(tid);
    if (random) return random;
    const optional = optionalRule(tid);
    if (optional) return optional;
    // Suit boxes carry no award of their own: the client always sends the chosen
    // suit index through type 155, so a non-selective use must be rejected.
    if (tables.OptionalSuitBox?.get(tid)) throw new GameError(5, 'Suit box requires a selection request');
    if (tables.Pay_Box.get(tid)) throw new GameError(5, 'Paid box requires a recharge handler');
    if (tables.BoxRepeat.get(tid)) throw new GameError(5, 'Repeatable box state is not implemented');
    throw new GameError(5, 'Box award rule is missing from configuration');
  }

  // Suit box selection (ItemCmd.use_selected_suit_box, type 155). The client sends
  // {tid, index}; ItemSuitBoxSelectUseForm stores the node's 1-based awardIndex in
  // _curSelectIndex, ItemSuitBoxSelectNode resolves OptionalSuitRes[range[awardIndex]]
  // and shows that row's award_list, so the index addresses the range position.
  function suitBoxOptions(tid) {
    const item = tables.Item.get(tid);
    if (!item) throw new GameError(5, 'Unknown item');
    const type = tables.Type.get(item.type);
    if ((type?.obj_class?.reference ?? '') !== 'ItemSuitBox') throw new GameError(5, 'This item is not a suit box');
    const box = tables.OptionalSuitBox?.get(tid);
    const range = Array.isArray(box?.range) ? box.range : [];
    if (!range.length) throw new GameError(5, 'Suit box configuration is missing');
    return range.map(suitId => {
      const row = tables.OptionalSuitRes?.get(Number(suitId));
      const list = Array.isArray(row?.award_list) ? row.award_list : [];
      if (!list.length) throw new GameError(5, 'Suit selection configuration is missing');
      const awards = list.map(entry => {
        if (!Array.isArray(entry) || entry.length < 2) throw new GameError(5, 'Suit selection award is invalid');
        const rewardTid = Number(entry[0]), rewardNum = Number(entry[1]);
        if (!Number.isSafeInteger(rewardTid) || !Number.isSafeInteger(rewardNum) || rewardNum <= 0) {
          throw new GameError(5, 'Suit selection award is invalid');
        }
        return [rewardTid, rewardNum];
      });
      return { suitId: Number(suitId), awards };
    });
  }

  function openSuitBox(request, context) {
    const tid = Number(Array.isArray(request) ? request[0] : request?.tid);
    const index = Number(Array.isArray(request) ? request[1] : request?.index);
    if (!Number.isSafeInteger(tid) || tid <= 0) throw new GameError(1, 'Invalid suit box request');
    if (!Number.isSafeInteger(index)) throw new GameError(1, 'Invalid suit box selection');
    const options = suitBoxOptions(tid);
    if (index < 1 || index > options.length) throw new GameError(1, 'Invalid suit box selection');
    const chosen = options[index - 1];
    const scope = requestScope(context);
    const result = commit(scope, { suitBox: [tid, index] }, model => {
      const held = model.resources.get(String(tid));
      if (!held || BigInt(held.num) < 1n) throw new GameError(1, 'Not enough suit boxes');
      held.num = String(BigInt(held.num) - 1n);
      const changes = [{ tid: String(tid), new_num: held.num, diff_num: '-1' }];
      changes.push(...grantResources(model, chosen.awards, tables).changes);
      const value = { changes: mergeChanges(changes), is_overflow: false };
      return { value, data: codec.pack('pb_res_to_client', value) };
    });
    log({ event: 'item_suit_box_opened', tid, index, suitId: chosen.suitId, awards: chosen.awards.length, changes: result.value.changes.length });
    return result;
  }

  function pickWeighted(entries, weightOf) {
    const total = entries.reduce((sum, entry) => sum + weightOf(entry), 0);
    if (!(total > 0)) throw new GameError(5, 'Box draw weights are invalid');
    let point = random() * total;
    for (const entry of entries) { point -= weightOf(entry); if (point < 0) return entry; }
    return entries[entries.length - 1];
  }

  // Random-box counters live in item_box_guarantee_state so they can also feed the
  // pb_box_guarantee_list payload; the metadata mirror keeps older readers working.
  function guaranteeState(model, db, tid) {
    model.state.boxGuarantees ??= {};
    const stored = db.prepare('SELECT no_guarantee_count,open_count,counter_guarantee_count,open_total_count'
      + ' FROM item_box_guarantee_state WHERE role_id=? AND box_tid=?').get(model.state.roleId, tid);
    const legacy = model.state.boxGuarantees[String(tid)] ?? {};
    const source = stored ? {
      noGuaranteeCount: stored.no_guarantee_count,
      openCount: stored.open_count,
      counterGuaranteeCount: stored.counter_guarantee_count,
      openTotalCount: stored.open_total_count
    } : legacy;
    const state = { tid };
    for (const field of GUARANTEE_FIELDS) {
      const value = Number(source[field]);
      state[field] = Number.isSafeInteger(value) && value > 0 ? value : 0;
    }
    return state;
  }

  function saveGuarantee(model, db, state) {
    model.state.boxGuarantees ??= {};
    model.state.boxGuarantees[String(state.tid)] = { ...state };
    db.prepare('INSERT INTO item_box_guarantee_state'
      + ' (role_id,box_tid,no_guarantee_count,open_count,counter_guarantee_count,open_total_count,updated_at)'
      + ' VALUES (?,?,?,?,?,?,?)'
      + ' ON CONFLICT(role_id,box_tid) DO UPDATE SET no_guarantee_count=excluded.no_guarantee_count,'
      + ' open_count=excluded.open_count,counter_guarantee_count=excluded.counter_guarantee_count,'
      + ' open_total_count=excluded.open_total_count,updated_at=excluded.updated_at')
      .run(model.state.roleId, state.tid, state.noGuaranteeCount, state.openCount,
        state.counterGuaranteeCount, state.openTotalCount, timestamp());
  }

  function roll(box, state) {
    const forceGuarantee = box.guaranteeThreshold > 0 && state.noGuaranteeCount + 1 >= box.guaranteeThreshold;
    const group = pickWeighted(forceGuarantee ? box.guaranteedGroups : box.groups, entry => entry.weight).group;
    const guaranteedIds = new Set(box.guaranteedGroups.map(entry => Number(entry.group.tid)));
    const counterIds = new Set(box.counterGuaranteedGroups.map(entry => Number(entry.group.tid)));
    const hitGuarantee = guaranteedIds.has(Number(group.tid));
    state.noGuaranteeCount = hitGuarantee ? 0 : state.noGuaranteeCount + 1;
    state.openCount += 1;
    state.openTotalCount += 1;
    if (counterIds.has(Number(group.tid))) state.counterGuaranteeCount += 1;
    const ranges = [...(group.lib_range ?? [])];
    if (!ranges.length) throw new GameError(5, 'Box draw award list is empty');
    const [, tid, num] = pickWeighted(ranges, entry => entry[0]);
    if (!tables.Item.has(tid) || !Number.isSafeInteger(num) || num <= 0) throw new GameError(5, 'Box draw award is invalid');
    return [tid, num];
  }

  function mergeChanges(changes) {
    const merged = new Map();
    for (const change of changes) {
      const existing = merged.get(change.tid);
      if (existing) { existing.new_num = change.new_num; existing.diff_num = String(BigInt(existing.diff_num) + BigInt(change.diff_num)); }
      else merged.set(change.tid, { ...change });
    }
    return [...merged.values()];
  }

  function open(entries, context) {
    if (!Array.isArray(entries) || !entries.length || entries.length > MAX_BATCH) throw new GameError(1, 'Invalid box request');
    const requests = entries.map(entry => {
      const tid = Number(entry?.tid), num = Number(entry?.num ?? 1);
      if (!Number.isSafeInteger(tid) || !Number.isSafeInteger(num) || num <= 0 || num > MAX_USE) throw new GameError(1, 'Invalid box request');
      return { tid, num, rule: rule(tid) };
    });
    // Type 151/157/159 are the non-selective use paths. Never consume an OptionalBox
    // without a selection: that would silently discard the box and award nothing.
    if (requests.some(request => request.rule.kind === 'optional')) throw new GameError(5, 'Optional box requires a selection request');
    const scope = requestScope(context);
    const result = commit(scope, { boxes: requests.map(request => [request.tid, request.num]) }, (model, db) => {
      const consumed = new Map(), awards = [];
      for (const request of requests) {
        const held = model.resources.get(String(request.tid));
        const need = (consumed.get(request.tid) ?? 0) + request.num;
        if (!held || BigInt(held.num) < BigInt(need)) throw new GameError(1, 'Not enough boxes');
        consumed.set(request.tid, need);
        if (request.rule.kind === 'random') {
          const guarantee = guaranteeState(model, db, request.tid);
          for (let n = 0; n < request.num; n++) awards.push(roll(request.rule, guarantee));
          saveGuarantee(model, db, guarantee);
        } else if (request.rule.kind === 'designated') {
          for (let n = 0; n < request.num; n++) awards.push(...request.rule.awards);
        }
      }
      const changes = [];
      for (const [tid, num] of consumed) {
        const held = model.resources.get(String(tid));
        held.num = String(BigInt(held.num) - BigInt(num));
        changes.push({ tid: String(tid), new_num: held.num, diff_num: String(-num) });
      }
      changes.push(...grantResources(model, awards, tables).changes);
      const value = { changes: mergeChanges(changes), is_overflow: false };
      return { value, data: codec.pack('pb_res_to_client', value) };
    });
    log({ event: 'item_box_opened', boxes: requests.map(request => request.tid), changes: result.value.changes.length, duplicate: result.duplicate });
    return result;
  }

  function openSelected(request, context) {
    if (!request || typeof request !== 'object' || Array.isArray(request)) throw new GameError(1, 'Invalid box request');
    const tid = Number(request.tid), num = Number(request.num ?? 1);
    if (!Number.isSafeInteger(tid) || !Number.isSafeInteger(num) || num <= 0 || num > MAX_USE) throw new GameError(1, 'Invalid box request');
    const boxRule = rule(tid);
    if (boxRule.kind !== 'optional') throw new GameError(5, 'This box does not accept a selection');
    const selected = request.selected;
    if (!Array.isArray(selected) || !selected.length || selected.length > MAX_USE) throw new GameError(1, 'Invalid box selection');
    const counts = new Map();
    let total = 0;
    for (const choice of selected) {
      const index = Number(choice?.index), count = Number(choice?.num ?? 1);
      if (!Number.isSafeInteger(index) || index < 1 || index > boxRule.options.length) throw new GameError(1, 'Invalid box selection');
      if (!Number.isSafeInteger(count) || count <= 0 || count > MAX_USE) throw new GameError(1, 'Invalid box selection');
      total += count;
      if (!Number.isSafeInteger(total) || total > MAX_USE * MAX_USE) throw new GameError(1, 'Invalid box selection');
      counts.set(index, (counts.get(index) ?? 0) + count);
    }
    const expected = boxRule.optionalNum * num;
    if (!Number.isSafeInteger(expected) || total !== expected) throw new GameError(1, 'Box selection count does not match');
    const scope = requestScope(context);
    const result = commit(scope, { selected: [tid, num, [...counts.entries()].map(([index, count]) => [index, count])] }, model => {
      const held = model.resources.get(String(tid));
      if (!held || BigInt(held.num) < BigInt(num)) throw new GameError(1, 'Not enough boxes');
      const awards = [];
      for (const [index, count] of counts) {
        const [rewardTid, rewardNum] = boxRule.options[index - 1];
        const amount = rewardNum * count;
        if (!Number.isSafeInteger(amount) || amount <= 0) throw new GameError(5, 'Optional box award is invalid');
        awards.push([rewardTid, amount]);
      }
      held.num = String(BigInt(held.num) - BigInt(num));
      const changes = [{ tid: String(tid), new_num: held.num, diff_num: String(-num) }];
      changes.push(...grantResources(model, awards, tables).changes);
      const value = { changes: mergeChanges(changes), is_overflow: false };
      return { value, data: codec.pack('pb_res_to_client', value) };
    });
    log({ event: 'item_box_opened', boxes: [tid], selected: [...counts.entries()], changes: result.value.changes.length });
    return result;
  }

  function readModuleValue(model, modules, moduleId, index, schema, fallback) {
    const module = modules.get(moduleId);
    const target = Array.isArray(module?.value) ? module.value[index] : null;
    if (!target) throw new GameError(5, 'Item module ' + moduleId + ' is unavailable');
    const bytes = rawBinary(target);
    return bytes.length ? codec.unpack(schema, bytes) : structuredClone(fallback);
  }

  function writeModuleValue(model, modules, moduleId, index, schema, value) {
    const module = modules.get(moduleId);
    if (!module || !Array.isArray(module.value)) throw new GameError(5, 'Item module ' + moduleId + ' is unavailable');
    while (module.value.length <= index) module.value.push(serializedBinary(Buffer.alloc(0)));
    module.value[index] = serializedBinary(codec.pack(schema, value));
    model.state.modules.value = [...modules];
  }

  // Manual conversion removes the source from whichever container owns it: ordinary
  // items and currencies live in model.resources, skins in login module 65 and
  // house-assistant items in module 148. One-off unlocks such as figure frames are not
  // countable rows and stay refused instead of being silently dropped.
  function spendCounted(model, modules, tid, num) {
    const handler = rewardHandlerFor(tid, grantTables);
    if (!handler) throw new GameError(5, 'Conversion source ' + tid + ' has no inventory handler');
    if (RESOURCE_REWARD_KINDS.has(handler.kind)) {
      const held = model.resources.get(String(tid));
      if (!held || BigInt(held.num) < BigInt(num)) throw new GameError(301, 'Not enough items to convert');
      held.num = String(BigInt(held.num) - BigInt(num));
      return { tid: String(tid), new_num: held.num, diff_num: String(-num) };
    }
    if (handler.kind === 'skin') {
      const data = readModuleValue(model, modules, SKIN_MODULE, 0, 'pb_skin_info', { skin_list: [] });
      data.skin_list ??= [];
      const row = data.skin_list.find(entry => Number(entry.id) === tid);
      if (!row || Number(row.num ?? 0) < num) throw new GameError(301, 'Not enough items to convert');
      row.num = Number(row.num ?? 0) - num;
      writeModuleValue(model, modules, SKIN_MODULE, 0, 'pb_skin_info', data);
      return { tid: String(tid), new_num: String(row.num), diff_num: String(-num) };
    }
    if (handler.kind === 'houseAssistant') {
      const data = readModuleValue(model, modules, HOUSE_ASSISTANT_MODULE, 0, 'pb_house_assistant_info',
        { res: [], use: [], trial: [], last_use: [] });
      data.res ??= [];
      const row = data.res.find(entry => Number(entry.tid) === tid);
      if (!row || BigInt(row.num ?? 0) < BigInt(num)) throw new GameError(301, 'Not enough items to convert');
      row.num = String(BigInt(row.num ?? 0) - BigInt(num));
      writeModuleValue(model, modules, HOUSE_ASSISTANT_MODULE, 0, 'pb_house_assistant_info', data);
      return { tid: String(tid), new_num: row.num, diff_num: String(-num) };
    }
    throw new GameError(5, 'Conversion source ' + tid + ' is not stored as a countable resource');
  }

  function convertRule(tid) {
    const row = tables.Convert?.get(tid);
    if (!row) throw new GameError(5, 'This item cannot be converted');
    const list = Array.isArray(row.convert_list) ? row.convert_list : [];
    if (!list.length) throw new GameError(5, 'Conversion award configuration is invalid');
    return list.map(entry => {
      if (!Array.isArray(entry) || entry.length < 2) throw new GameError(5, 'Conversion award configuration is invalid');
      const rewardTid = Number(entry[0]), rewardNum = Number(entry[1]);
      if (!Number.isSafeInteger(rewardTid) || !Number.isSafeInteger(rewardNum) || rewardNum <= 0 || !tables.Item.has(rewardTid)) {
        throw new GameError(5, 'Conversion award configuration is invalid');
      }
      return [rewardTid, rewardNum];
    });
  }

  function convertRequest(arg) {
    let tid, num = 1;
    if (typeof arg === 'number' || typeof arg === 'string') tid = Number(arg);
    else if (Array.isArray(arg)) {
      tid = Number(arg[0]);
      if (arg.length > 1) num = Number(arg[1]);
    } else if (arg && typeof arg === 'object') {
      tid = Number(arg.tid);
      if (arg.num != null) num = Number(arg.num);
    } else throw new GameError(1, 'Invalid convert item request');
    if (!Number.isSafeInteger(tid) || tid <= 0) throw new GameError(1, 'Invalid convert item request');
    if (!Number.isSafeInteger(num) || num <= 0 || num > MAX_USE) throw new GameError(1, 'Invalid convert item request');
    return { tid, num };
  }

  // ItemCmd.manual_convert_item (154) carries one ETF positional: the bag item tid
  // (static record tcp:c2s:154:manual_convert_item). The recovered shape converts one
  // item per request, so num defaults to 1; pair/object forms reuse the same fixed rate.
  function manualConvert(arg, context) {
    const request = convertRequest(arg);
    const awards = convertRule(request.tid);
    const scope = requestScope(context);
    const result = commit(scope, { convert: [request.tid, request.num] }, model => {
      const modules = new Map(model.state.modules.value);
      const spent = spendCounted(model, modules, request.tid, request.num);
      const granted = grantResources(model, awards.map(([tid, num]) => [tid, num * request.num]), grantTables);
      const value = { changes: mergeChanges([spent, ...granted.changes]), is_overflow: false };
      return { value, data: codec.pack('pb_res_to_client', value) };
    });
    log({ event: 'item_manual_converted', tid: request.tid, num: request.num, changes: result.value.changes.length, duplicate: result.duplicate });
    return result;
  }

  // ItemTable.Chip.need_num chips become one point_item; 156 composes one chip family
  // and 158 composes the one-key list. A target without a reward handler is refused
  // before any chip is spent (MatchHero chips in this build).
  function chipRule(tid) {
    const row = tables.Chip?.get(tid);
    if (!row) throw new GameError(5, 'This item is not a composable chip');
    if (!tables.Item.has(tid)) throw new GameError(5, 'Chip item is missing from configuration');
    const need = Number(row.need_num), point = Number(row.point_item);
    if (!Number.isSafeInteger(need) || need <= 0) throw new GameError(5, 'Chip compose configuration is invalid');
    if (!Number.isSafeInteger(point) || point <= 0) throw new GameError(5, 'Chip compose target is invalid');
    if (!rewardHandlerFor(point, grantTables)) throw new GameError(5, 'Chip target ' + point + ' has no reward handler');
    return { tid, need, point };
  }

  function addComposeCount(model, db, tid, num) {
    const stored = db.prepare('SELECT compose_count FROM item_chip_compose_counts WHERE role_id=? AND chip_tid=?')
      .get(model.state.roleId, tid);
    const next = Number(stored?.compose_count ?? 0) + num;
    db.prepare('INSERT INTO item_chip_compose_counts (role_id,chip_tid,compose_count,updated_at) VALUES (?,?,?,?)'
      + ' ON CONFLICT(role_id,chip_tid) DO UPDATE SET compose_count=excluded.compose_count,updated_at=excluded.updated_at')
      .run(model.state.roleId, tid, next, timestamp());
  }

  // pb_res_to_client has no per-entry result list, so a one-key request that cannot
  // cover every chip composes the affordable entries and logs the rest; a request where
  // nothing is affordable fails as a whole and consumes nothing.
  function composeEntries(model, db, requests, { partial }) {
    const changes = [], composed = [], skipped = [];
    for (const request of requests) {
      const chip = chipRule(request.tid);
      const cost = chip.need * request.num;
      if (!Number.isSafeInteger(cost) || cost <= 0) throw new GameError(5, 'Chip compose configuration is invalid');
      const held = BigInt(model.resources.get(String(request.tid))?.num ?? 0);
      if (held < BigInt(cost)) {
        if (!partial) throw new GameError(301, 'Not enough chips to compose');
        skipped.push(request.tid);
        continue;
      }
      changes.push(...consumeResources(model, [[request.tid, cost]], 301).changes);
      changes.push(...grantResources(model, [[chip.point, request.num]], grantTables).changes);
      addComposeCount(model, db, request.tid, request.num);
      composed.push(request.tid);
    }
    if (!composed.length) throw new GameError(301, 'Not enough chips to compose');
    const value = { changes: mergeChanges(changes), is_overflow: false };
    return { value, data: codec.pack('pb_res_to_client', value), composed, skipped };
  }

  function composeChip(entry, context) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new GameError(1, 'Invalid chip compose request');
    const tid = Number(entry.tid), num = Number(entry.num ?? 1);
    if (!Number.isSafeInteger(tid) || tid <= 0) throw new GameError(1, 'Invalid chip compose request');
    if (!Number.isSafeInteger(num) || num <= 0 || num > MAX_USE) throw new GameError(1, 'Invalid chip compose request');
    chipRule(tid);
    const scope = requestScope(context);
    const result = commit(scope, { chip: [tid, num] }, (model, db) => composeEntries(model, db, [{ tid, num }], { partial: false }));
    log({ event: 'item_chip_composed', tid, num, changes: result.value.changes.length, duplicate: result.duplicate });
    return result;
  }

  function composeChips(entries, context) {
    if (!Array.isArray(entries) || !entries.length || entries.length > MAX_ONE_KEY) throw new GameError(1, 'Invalid chip compose request');
    const merged = new Map();
    for (const entry of entries) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new GameError(1, 'Invalid chip compose request');
      const tid = Number(entry.tid), num = Number(entry.num ?? 1);
      if (!Number.isSafeInteger(tid) || tid <= 0) throw new GameError(1, 'Invalid chip compose request');
      if (!Number.isSafeInteger(num) || num <= 0 || num > MAX_USE) throw new GameError(1, 'Invalid chip compose request');
      chipRule(tid);
      merged.set(tid, (merged.get(tid) ?? 0) + num);
    }
    const requests = [];
    for (const [tid, num] of merged) {
      if (!Number.isSafeInteger(num) || num > MAX_USE) throw new GameError(1, 'Invalid chip compose request');
      requests.push({ tid, num });
    }
    const scope = requestScope(context);
    const result = commit(scope, { oneKey: requests.map(request => [request.tid, request.num]) },
      (model, db) => composeEntries(model, db, requests, { partial: true }));
    log({ event: 'item_one_key_chip_composed', composed: result.composed ?? [], skipped: result.skipped ?? [], duplicate: result.duplicate });
    return result;
  }

  // pb_box_repeat{tid,num,uid,get_time,use_times} exists in item_box.db.proto, but
  // ItemTable.BoxRepeat has zero rows, no Item row uses type 85 (BoxRepeat) and the
  // captured login module 54 (BoxResMgr) is empty: 153 is unreachable in this build.
  // The command is routed so a request gets a business error and consumes nothing.
  function openRepeat(arg) {
    const raw = Array.isArray(arg) ? (arg.length === 1 ? arg[0] : arg) : arg;
    const tid = Number(raw && typeof raw === 'object' ? raw.tid : raw);
    if (!Number.isSafeInteger(tid) || tid <= 0) throw new GameError(1, 'Invalid repeat box request');
    if ((tables.BoxRepeat?.size ?? 0) === 0) throw new GameError(5, 'Repeatable boxes are not configured in this client build');
    const item = tables.Item.get(tid);
    if (!item) throw new GameError(5, 'Unknown item');
    const type = tables.Type.get(Number(item.type));
    if ((type?.obj_class?.reference ?? '') !== 'BoxRepeat') throw new GameError(5, 'This item is not a repeatable box');
    if (!tables.BoxRepeat.has(tid)) throw new GameError(5, 'Repeatable box configuration is missing');
    throw new GameError(5, 'Repeatable box state is not implemented');
  }

  // ItemLottery rows ship (100013400..100043400) but no table maps them to a reward
  // library and no captured flow shows the result, so the draw cannot be replayed from
  // evidence. Reject instead of returning an empty success.
  function openLottery(list) {
    if (!Array.isArray(list) || !list.length || list.length > MAX_BATCH) throw new GameError(1, 'Invalid lottery box request');
    for (const entry of list) {
      const tid = Number(entry?.tid), num = Number(entry?.num ?? 1);
      if (!Number.isSafeInteger(tid) || tid <= 0) throw new GameError(1, 'Invalid lottery box request');
      if (!Number.isSafeInteger(num) || num <= 0 || num > MAX_USE) throw new GameError(1, 'Invalid lottery box request');
      const item = tables.Item.get(tid);
      if (!item) throw new GameError(5, 'Unknown item');
      const type = tables.Type.get(Number(item.type));
      if ((type?.obj_class?.reference ?? '') !== 'ItemLottery') throw new GameError(5, 'This item is not a lottery box');
    }
    throw new GameError(5, 'Lottery box rewards are not defined by the shipped configuration');
  }

  function composeCount(tid) {
    const roleId = store.read().state.roleId;
    const row = store.inspect(db => {
      ensureTables(db);
      return db.prepare('SELECT compose_count FROM item_chip_compose_counts WHERE role_id=? AND chip_tid=?').get(roleId, tid);
    });
    return Number(row?.compose_count ?? 0);
  }

  // pb_box_guarantee_list 登录槽位尚未定位，这里只提供已核对字段的编码结果，不注入未证实模块。
  function loginGuaranteePayload() {
    const roleId = store.read().state.roleId;
    const rows = store.inspect(db => {
      ensureTables(db);
      return db.prepare('SELECT box_tid,no_guarantee_count,open_count,counter_guarantee_count,open_total_count'
        + ' FROM item_box_guarantee_state WHERE role_id=? ORDER BY box_tid').all(roleId);
    });
    const value = { guarantee_list: rows.map(row => ({
      tid: row.box_tid,
      no_guarantee_count: row.no_guarantee_count,
      open_count: row.open_count,
      counter_guarantee_count: row.counter_guarantee_count,
      open_total_count: row.open_total_count
    })) };
    return { value, data: codec.pack('pb_box_guarantee_list', value) };
  }

  return {
    supports: type => [151, 152, 153, 154, 155, 156, 157, 158, 159].includes(type),
    open, openSelected, openSuitBox, openRepeat, manualConvert, composeChip, composeChips, openLottery,
    loginGuaranteePayload, composeCount, rule, suitBoxOptions, convertRule, chipRule
  };
}
