import { serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
export function grantResources(model, awards, tables) {
  const totals = new Map();
  for (const [id, amount] of awards) {
    if (!Number.isSafeInteger(id) || !Number.isSafeInteger(amount) || amount <= 0 || !tables.Item.has(id)) throw new GameError(5, 'Unsupported reward resource');
    totals.set(String(id), (totals.get(String(id)) ?? 0n) + BigInt(amount));
  }
  const modules = new Map(model.state.modules.value), changes = [];
  for (const [id, amount] of totals) {
    const type = tables.Type.get(tables.Item.get(Number(id)).type)?.res_type;
    if (type === 140000) {
      const num = BigInt(model.role.exp ?? 0) + amount;
      if (num > 4294967295n) throw new GameError(1, 'Resource limit reached');
      model.role.exp = Number(num);
      changes.push({ tid: id, new_num: String(num), diff_num: String(amount) });
      continue;
    }
    let item = model.resources.get(id);
    if (!item) {
      // 1200 is the inventory item-box/shard family (for example 7-day-login
      // hero-shard boxes). It is a normal stackable inventory entry, not a
      // currency that needs a separate server-side wallet.
      if (![2, 4, 1000, 1200, 1500, 1800, 1900, 3300].includes(type)) throw new GameError(5, 'Reward resource requires its own gameplay handler');
      let location;
      if (type === 1500) {
        const occupied = [...model.resources.values()].filter(x => x.location[0] === 5).map(x => x.location[2]);
        location = [5, null, Math.max(-1, ...occupied) + 1];
      } else if (type === 1800) {
        const occupied = [...model.resources.values()].filter(x => x.location[0] === 10 && x.location[1] === 1).map(x => x.location[2]);
        location = [10, 1, Math.max(-1, ...occupied) + 1];
      } else {
        const groups = modules.get(6).value;
        // Inventory groups are observed at: general props 0, consumables/shards 1,
        // hero chips 2, hero experience 3 and special items 9.
        const group = type === 2 ? 0 : (type === 1000 || type === 1200) ? 1 : type === 4 ? 2 : type === 1900 ? 3 : 9;
        while (groups.length <= group) groups.push({ value: [], improper: false });
        const entry = groups[group].value.length;
        groups[group].value.push(serializedBinary(Buffer.alloc(0)));
        location = [6, group, entry];
      }
      item = { tid: id, num: '0', location }; model.resources.set(id, item);
    }
    const num = BigInt(item.num) + amount;
    if (num > 9223372036854775807n) throw new GameError(1, 'Resource limit reached');
    item.num = String(num); changes.push({ tid: id, new_num: item.num, diff_num: String(amount) });
  }
  model.state.modules.value = [...modules];
  return { changes };
}
