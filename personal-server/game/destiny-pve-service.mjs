import { readDestinyPveTables } from '../config/dungeon-activity-tables.mjs';
import {
  CODE_INVALID, CODE_STATE, ensureTables, fail, integer, readActivityState, unixSeconds
} from './dungeon-activity-shared.mjs';

// DestinyPveCmd 104701 fight and 104702 layer_info. The fight reply schema and
// FightTable.def_team enemy lineup are not available in this tree, so 104701
// fails closed; 104702 answers from authoritative local pass state.
export const DESTINY_PVE_COMMANDS = [104701, 104702];
const ACTIVITY = 'destiny_pve';

export function createDestinyPveService({
  store, codec, tables = readDestinyPveTables(), now = Date.now, logger = () => {}
}) {
  const log = event => { try { logger(event); } catch {} };
  if (!tables?.layers?.size) throw new Error('Destiny PvE configuration is unavailable');

  function supports(type) { return DESTINY_PVE_COMMANDS.includes(type); }

  // 104701 requires the missing pb_destiny_pve_fight_rsq definition and a
  // FightTable.def_team lineup. Rejecting keeps a client-reported win from
  // advancing a layer.
  async function fight() {
    log({ event: 'destiny_pve_fight_rejected' });
    fail(CODE_STATE, 'Destiny PvE fight is unavailable: fight reply schema and FightTable.def_team are not recovered');
  }

  async function layerInfo(input) {
    const list = Array.isArray(input?.layer_list) ? input.layer_list : (Array.isArray(input) ? input : []);
    if (!list.length) fail(CODE_INVALID, 'Destiny PvE layer list is empty');
    const requested = list.map(layer => integer(layer, 1, Number.MAX_SAFE_INTEGER, 'Invalid destiny PvE layer'));
    const rows = store.inspect(db => {
      ensureTables(db);
      const byLayer = new Map(requested.map(layer => [layer, { layer, count: 0, role_id: 0, pass_time: 0, power: 0, update_time: 0 }]));
      const all = db.prepare("SELECT role_id, state_json FROM dungeon_activity_state WHERE activity='destiny_pve'").all();
      for (const row of all) {
        let parsed;
        try { parsed = JSON.parse(row.state_json); } catch { continue; }
        const passed = Number(parsed?.layer ?? 0);
        for (const entry of byLayer.values()) {
          if (passed < entry.layer) continue;
          entry.count += 1;
          const passTime = Number(parsed?.passTime ?? 0);
          if (!entry.pass_time || (passTime && passTime < entry.pass_time)) {
            entry.role_id = Number(row.role_id);
            entry.pass_time = passTime;
            entry.power = Number(parsed?.power ?? 0);
            entry.update_time = passTime;
          }
        }
      }
      return [...byLayer.values()];
    });
    log({ event: 'destiny_pve_layer_info_read', layers: requested.length, entries: rows.length });
    return {
      value: { layers: requested.length },
      data: codec.pack('pb_destiny_pve_layer_info_rsq', {
        layer_info_list: rows.map(entry => ({
          layer: entry.layer,
          count: entry.count,
          hero_list: [],
          lineup_list: [],
          update_time: entry.update_time,
          role_id: entry.role_id,
          pass_time: entry.pass_time,
          power: entry.power
        }))
      })
    };
  }

  // Seam for the fight pipeline: stores the authoritative pass and the first
  // pass timestamp/power used by 104702 aggregates.
  async function recordPass({ layer, simulation, power = 0 }) {
    const target = integer(layer, 1, Number.MAX_SAFE_INTEGER, 'Invalid destiny PvE layer');
    if (!tables.layers.has(target)) fail(CODE_STATE, 'Destiny PvE layer configuration is missing');
    if (!simulation || !Array.isArray(simulation.events)) fail(CODE_INVALID, 'Destiny PvE pass requires a battle engine simulation');
    const end = [...simulation.events].reverse().find(event => event && event.kind === 'battle-end');
    if (!end) fail(CODE_INVALID, 'Destiny PvE simulation is missing the battle result');
    const won = Number(end.result) === 1 && Number(simulation.result) === 1;
    return store.transaction((model, db) => {
      ensureTables(db);
      const nowMs = now();
      const state = readActivityState(db, model.state.roleId, ACTIVITY, { layer: 0, passTime: 0, power: 0 });
      if (won && target > Number(state.layer ?? 0)) {
        db.prepare(`INSERT INTO dungeon_activity_state (role_id, activity, state_json, updated_at)
          VALUES (?,?,?,?) ON CONFLICT(role_id, activity) DO UPDATE SET state_json=excluded.state_json, updated_at=excluded.updated_at`)
          .run(model.state.roleId, ACTIVITY, JSON.stringify({ layer: target, passTime: unixSeconds(nowMs), power: Number(power) || 0 }), new Date(nowMs).toISOString());
      }
      log({ event: 'destiny_pve_pass_recorded', layer: target, won });
      return { value: { layer: target, won } };
    });
  }

  async function execute(type, input) {
    if (type === 104701) return fight();
    if (type === 104702) return layerInfo(input);
    fail(CODE_INVALID, 'Unsupported destiny PvE command');
  }

  return { supports, execute, fight, layerInfo, recordPass };
}
