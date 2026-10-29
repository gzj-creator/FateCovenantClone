import { serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';

const inventoryGroups = new Map([[2, 0], [4, 2], [1000, 1], [1900, 3], [3300, 9]]);

function resourceType(item, tables) {
  return tables.Type.get(item.type)?.res_type;
}

function appendLocation(model, modules, type) {
  if (type === 1500) {
    const occupied = [...model.resources.values()].filter(x => x.location[0] === 5).map(x => x.location[2]);
    return [5, null, Math.max(-1, ...occupied) + 1];
  }
  if (type === 1800) {
    const occupied = [...model.resources.values()].filter(x => x.location[0] === 10 && x.location[1] === 1).map(x => x.location[2]);
    return [10, 1, Math.max(-1, ...occupied) + 1];
  }
  const group = inventoryGroups.get(type);
  if (group === undefined) return undefined;
  const groups = modules.get(6).value;
  while (groups.length <= group) groups.push({ value: [], improper: false });
  if (!Array.isArray(groups[group].value)) groups[group] = { value: [], improper: false };
  const entry = groups[group].value.length;
  groups[group].value.push(serializedBinary(Buffer.alloc(0)));
  return [6, group, entry];
}

function totalsOf(awards) {
  const totals = new Map();
  for (const [id, amount] of awards) {
    if (!Number.isSafeInteger(id) || !Number.isSafeInteger(amount) || amount <= 0) throw new GameError(5, 'Invalid resource amount');
    totals.set(String(id), (totals.get(String(id)) ?? 0n) + BigInt(amount));
  }
  return totals;
}

export function grantResources(model, awards, tables) {
  const totals = totalsOf(awards);
  for (const id of totals.keys()) if (!tables.Item.has(Number(id))) throw new GameError(5, 'Unsupported reward resource');
  const modules = new Map(model.state.modules.value), changes = [];
  for (const [id, amount] of totals) {
    let item = model.resources.get(id);
    if (!item) {
      const type = resourceType(tables.Item.get(Number(id)), tables);
      const location = appendLocation(model, modules, type);
      if (!location) throw new GameError(5, 'Reward resource requires its own gameplay handler');
      item = { tid: id, num: '0', location }; model.resources.set(id, item);
    }
    const num = BigInt(item.num) + amount;
    if (num > 9223372036854775807n) throw new GameError(1, 'Resource limit reached');
    item.num = String(num); changes.push({ tid: id, new_num: item.num, diff_num: String(amount) });
  }
  model.state.modules.value = [...modules];
  return { changes };
}

export function consumeResources(model, costs, insufficientCode = 301) {
  const totals = new Map();
  for (const [id, amount] of costs) {
    if (!Number.isSafeInteger(id) || !Number.isSafeInteger(amount) || amount < 0) throw new GameError(5, 'Invalid resource cost');
    totals.set(String(id), (totals.get(String(id)) ?? 0n) + BigInt(amount));
  }
  for (const [id, amount] of totals) {
    if (BigInt(model.resources.get(id)?.num ?? 0) < amount) throw new GameError(insufficientCode, 'Insufficient resource');
  }
  const changes = [];
  for (const [id, amount] of totals) {
    if (amount === 0n) continue;
    const item = model.resources.get(id);
    item.num = (BigInt(item.num) - amount).toString();
    changes.push({ tid: id, new_num: item.num, diff_num: (-amount).toString() });
  }
  return { changes };
}
