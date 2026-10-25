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
    let item = model.resources.get(id);
    if (!item) {
      const type = tables.Type.get(tables.Item.get(Number(id)).type)?.res_type;
      if (![2, 1000, 1500, 1800, 1900, 3300].includes(type)) throw new GameError(5, 'Reward resource requires its own gameplay handler');
      let location;
      if (type === 1500) {
        const occupied = [...model.resources.values()].filter(x => x.location[0] === 5).map(x => x.location[2]);
        location = [5, null, Math.max(-1, ...occupied) + 1];
      } else if (type === 1800) {
        const occupied = [...model.resources.values()].filter(x => x.location[0] === 10 && x.location[1] === 1).map(x => x.location[2]);
        location = [10, 1, Math.max(-1, ...occupied) + 1];
      } else {
        const groups = modules.get(6).value;
        // The client inventory groups are ordered by res_type: 2,1000,1800,1900,...
        const group = type === 2 ? 0 : type === 1000 ? 1 : type === 1900 ? 3 : 9;
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
