import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';

// Backpack boxes. Only rules fully described by shipped configuration are executed:
// ItemTable.Random_Box -> DrawTable lib (weighted group + weighted award), including configured guarantees.
// ItemTable.Designated_Box -> the configured fixed award list (151/157/159 use paths).
// ItemTable.OptionalBox -> the player's selected range entries (type 152 use_selected_box).
// ItemTable.OptionalSuitBox -> a suit box whose selected suit grants a fixed award_list (type 155).
// Pay, repeat and lottery boxes stay unsupported on purpose.
const MAX_USE = 999;

export function createItemBoxService({ store, codec, tables, random = Math.random, logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };

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

  function openSuitBox(request) {
    const tid = Number(Array.isArray(request) ? request[0] : request?.tid);
    const index = Number(Array.isArray(request) ? request[1] : request?.index);
    if (!Number.isSafeInteger(tid) || tid <= 0) throw new GameError(1, 'Invalid suit box request');
    if (!Number.isSafeInteger(index)) throw new GameError(1, 'Invalid suit box selection');
    const options = suitBoxOptions(tid);
    if (index < 1 || index > options.length) throw new GameError(1, 'Invalid suit box selection');
    const chosen = options[index - 1];
    const result = store.transaction(model => {
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

  function guaranteeState(model, tid) {
    model.state.boxGuarantees ??= {};
    const key = String(tid);
    const state = model.state.boxGuarantees[key] ??= {};
    for (const field of ['noGuaranteeCount', 'openCount', 'counterGuaranteeCount', 'openTotalCount']) {
      state[field] = Number.isSafeInteger(Number(state[field])) && Number(state[field]) > 0 ? Number(state[field]) : 0;
    }
    state.tid = tid;
    model.state.boxGuarantees[key] = state;
    return state;
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

  function open(entries) {
    if (!Array.isArray(entries) || !entries.length || entries.length > 20) throw new GameError(1, 'Invalid box request');
    const requests = entries.map(entry => {
      const tid = Number(entry.tid), num = Number(entry.num ?? 1);
      if (!Number.isSafeInteger(tid) || !Number.isSafeInteger(num) || num <= 0 || num > MAX_USE) throw new GameError(1, 'Invalid box request');
      return { tid, num, rule: rule(tid) };
    });
    // Type 151/157/159 are the non-selective use paths. Never consume an OptionalBox
    // without a selection: that would silently discard the box and award nothing.
    if (requests.some(request => request.rule.kind === 'optional')) throw new GameError(5, 'Optional box requires a selection request');
    const result = store.transaction(model => {
      const consumed = new Map(), awards = [];
      for (const request of requests) {
        const held = model.resources.get(String(request.tid));
        const need = (consumed.get(request.tid) ?? 0) + request.num;
        if (!held || BigInt(held.num) < BigInt(need)) throw new GameError(1, 'Not enough boxes');
        consumed.set(request.tid, need);
        if (request.rule.kind === 'random') {
          const guarantee = guaranteeState(model, request.tid);
          for (let n = 0; n < request.num; n++) awards.push(roll(request.rule, guarantee));
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
    log({ event: 'item_box_opened', boxes: requests.map(request => request.tid), changes: result.value.changes.length });
    return result;
  }

  function openSelected(request) {
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
    const result = store.transaction(model => {
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

  return { supports: type => [151, 152, 155, 157, 159].includes(type), open, openSelected, openSuitBox, rule, suitBoxOptions };
}
