import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';

// Backpack boxes. Only rules fully described by shipped configuration are executed:
// ItemTable.Random_Box -> DrawTable lib (weighted group + weighted award) without guarantee state.
// Selection, pay, repeat and lottery boxes stay unsupported on purpose.
const MAX_USE = 999;

export function createItemBoxService({ store, codec, tables, random = Math.random, logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };

  function rule(tid) {
    const item = tables.Item.get(tid);
    if (!item) throw new GameError(5, 'Unknown item');
    const type = tables.Type.get(item.type);
    const objectClass = type?.obj_class?.reference ?? '';
    if (objectClass !== 'ItemBox' && objectClass !== 'ItemSuitBox') throw new GameError(5, 'This item is not an openable box');
    const draw = tables.Random_Box.get(tid);
    if (draw) {
      const lib = tables.DrawLibWeight.get(draw.draw_lib);
      if (!lib) throw new GameError(5, 'Box draw library is missing from configuration');
      const guarantees = (lib.guaranteed_weight?.length ?? 0) > 0 || (lib.guaranteed_group?.length ?? 0) > 0
        || (lib.counter_guaranteed_group?.length ?? 0) > 0 || (lib.against_guaranteed_group_num ?? 0) > 0;
      if (guarantees) throw new GameError(5, 'Box draw guarantee state is not implemented');
      const groups = [...(lib.weight_group ?? [])].map(([weight, groupId]) => ({ weight, group: tables.DrawGroup.get(groupId) }));
      if (!groups.length || groups.some(entry => !entry.group)) throw new GameError(5, 'Box draw groups are missing from configuration');
      return { kind: 'random', groups };
    }
    if (tables.OptionalBox.get(tid)) throw new GameError(5, 'Optional box selection is not implemented');
    if (tables.Designated_Box.get(tid)) throw new GameError(5, 'Designated box rule is not implemented');
    if (tables.Pay_Box.get(tid)) throw new GameError(5, 'Paid box requires a recharge handler');
    if (tables.BoxRepeat.get(tid)) throw new GameError(5, 'Repeatable box state is not implemented');
    throw new GameError(5, 'Box award rule is missing from configuration');
  }

  function pickWeighted(entries, weightOf) {
    const total = entries.reduce((sum, entry) => sum + weightOf(entry), 0);
    if (!(total > 0)) throw new GameError(5, 'Box draw weights are invalid');
    let point = random() * total;
    for (const entry of entries) { point -= weightOf(entry); if (point < 0) return entry; }
    return entries[entries.length - 1];
  }

  function roll(box) {
    const group = pickWeighted(box.groups, entry => entry.weight).group;
    const ranges = [...(group.lib_range ?? [])];
    if (!ranges.length) throw new GameError(5, 'Box draw award list is empty');
    const [, tid, num] = pickWeighted(ranges, entry => entry[0]);
    if (!tables.Item.has(tid) || !Number.isSafeInteger(num) || num <= 0) throw new GameError(5, 'Box draw award is invalid');
    return [tid, num];
  }

  function open(entries) {
    if (!Array.isArray(entries) || !entries.length || entries.length > 20) throw new GameError(1, 'Invalid box request');
    const requests = entries.map(entry => {
      const tid = Number(entry.tid), num = Number(entry.num ?? 1);
      if (!Number.isSafeInteger(tid) || !Number.isSafeInteger(num) || num <= 0 || num > MAX_USE) throw new GameError(1, 'Invalid box request');
      return { tid, num, rule: rule(tid) };
    });
    const result = store.transaction(model => {
      const consumed = new Map(), awards = [];
      for (const request of requests) {
        const held = model.resources.get(String(request.tid));
        const need = (consumed.get(request.tid) ?? 0) + request.num;
        if (!held || BigInt(held.num) < BigInt(need)) throw new GameError(1, 'Not enough boxes');
        consumed.set(request.tid, need);
        if (request.rule.kind === 'random') for (let n = 0; n < request.num; n++) awards.push(roll(request.rule));
      }
      const changes = [];
      for (const [tid, num] of consumed) {
        const held = model.resources.get(String(tid));
        held.num = String(BigInt(held.num) - BigInt(num));
        changes.push({ tid: String(tid), new_num: held.num, diff_num: String(-num) });
      }
      changes.push(...grantResources(model, awards, tables).changes);
      const merged = new Map();
      for (const change of changes) {
        const existing = merged.get(change.tid);
        if (existing) { existing.new_num = change.new_num; existing.diff_num = String(BigInt(existing.diff_num) + BigInt(change.diff_num)); }
        else merged.set(change.tid, { ...change });
      }
      const value = { changes: [...merged.values()], is_overflow: false };
      return { value, data: codec.pack('pb_res_to_client', value) };
    });
    log({ event: 'item_box_opened', boxes: requests.map(request => request.tid), changes: result.value.changes.length });
    return result;
  }

  return { supports: type => [151, 157, 159].includes(type), open, rule };
}
