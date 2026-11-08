import { serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';
import { reportBattle } from './mission-fight-service.mjs';
import { commonMapConfig } from '../config/common-map-tables.mjs';

// CommonMapCmd 90601-90603.
//
// Evidence: pb_common_map_init_back / pb_common_map_node_trigger /
// pb_common_map_node_trigger_back / pb_common_map_sweep_trigger /
// pb_common_map_sweep_trigger_back in assets/protobuf/common_map.net.proto.bin
// and pb_common_map / pb_common_map_node in common_map.db.proto.bin. The map
// layout and node rows live in the client's CommonMapTable, which is not
// extracted yet, so every command fails closed with code 5 until the table is
// shipped in assets/tables; node settlement itself is real (simulateBattle
// through the shared reportBattle builder) and is covered by fixture tests.
const NODE_OVER_KEY = 'over';

function emptyRes() {
  return { changes: [], is_overflow: false };
}

export function createCommonMapService({
  store, codec, tables, heroTables, gameTables, attributeTables, now = Date.now, logger = () => {}
}) {
  const log = event => { try { logger(event); } catch {} };
  // reportBattle's encounter.tables is the mission-table shape (a holder with
  // .heroes = HeroTable/Npc/Ability), not the flat hero table object.
  const battleTables = { heroes: heroTables };

  function mapRow(mapTid) {
    const config = commonMapConfig(tables, mapTid);
    if (!config) throw new GameError(5, 'Common map configuration missing: ' + mapTid);
    return config;
  }

  function loadMap(model, db, config) {
    const roleId = model.state.roleId;
    const row = db.prepare('SELECT map_json FROM common_map_state WHERE role_id=? AND map_tid=?').get(roleId, config.tid);
    if (row) return JSON.parse(row.map_json);
    // Initial map state mirrors pb_common_map: line_list carries walkable path
    // nodes, evt_list the triggerable event nodes.
    const map = { x: config.x, y: config.y, line_list: [], evt_list: [], buff_list: [], over_data: { select_option_list: [] } };
    for (const node of config.nodes) {
      const entry = {
        x: node.x, y: node.y, type: node.type, db_data: node.dbData, cfg_data: node.index,
        is_over: false, ext_data: ''
      };
      if (node.isLine) map.line_list.push(entry); else map.evt_list.push(entry);
    }
    return map;
  }

  function saveMap(db, roleId, map) {
    db.prepare('INSERT INTO common_map_state VALUES (?,?,?,?) ON CONFLICT(role_id,map_tid) DO UPDATE SET map_json=excluded.map_json, updated_at=excluded.updated_at')
      .run(roleId, map.__tid, JSON.stringify(map), new Date(now()).toISOString());
  }

  function nodeAt(map, x, y) {
    return [...map.line_list, ...map.evt_list].find(node => Number(node.x) === x && Number(node.y) === y) ?? null;
  }

  function settleNode(model, config, node, map) {
    const configNode = config.nodes[Number(node.cfg_data)];
    if (!configNode) throw new GameError(5, 'Common map node configuration missing');
    if (configNode.need >= 0) {
      const required = [...map.line_list, ...map.evt_list].find(entry => Number(entry.cfg_data) === configNode.need);
      if (!required) throw new GameError(5, 'Common map node prerequisite configuration missing');
      if (!required.is_over) throw new GameError(5, 'Common map node prerequisite is not cleared');
    }
    let result = null;
    if (configNode.enemies.length) {
      const battle = reportBattle(
        codec, model, { missionId: config.tid }, { fight_tid: 0 }, attributeTables,
        { mission: { fight: 0 }, enemies: configNode.enemies, tables: battleTables }
      );
      result = battle.simulation.result;
      log({ event: 'common_map_battle_resolved', mapTid: config.tid, node: configNode.index, result, rounds: battle.simulation.overRound });
      if (result !== 1) return { result, res: emptyRes(), over: false };
    }
    const awards = [], changes = [], newlyCleared = !node.is_over;
    if (newlyCleared) {
      node.is_over = true;
      awards.push(...configNode.award);
      for (const buff of configNode.buffs) if (!map.buff_list.includes(buff)) map.buff_list.push(buff);
      if (awards.length) changes.push(...grantResources(model, awards, gameTables ?? heroTables).changes);
    }
    return { result, res: { changes, is_overflow: false }, over: node.is_over, newlyCleared, buffs: configNode.buffs };
  }

  function init(mapTid) {
    const maps = mapTid === undefined || mapTid === null
      ? [...tables.maps.keys()]
      : [Number(mapTid)];
    if (!tables.available || !maps.length) throw new GameError(5, 'Common map configuration missing');
    return store.transaction((model, db) => {
      const packed = [];
      for (const tid of maps) {
        const config = mapRow(tid);
        const map = loadMap(model, db, config);
        map.__tid = config.tid;
        saveMap(db, model.state.roleId, map);
        packed.push(codec.pack('pb_common_map', {
          x: map.x, y: map.y, line_list: map.line_list, evt_list: map.evt_list,
          buff_list: map.buff_list, over_data: map.over_data
        }));
      }
      const value = { fun_bin: packed[0] ?? Buffer.alloc(0), res: emptyRes() };
      return { value, data: codec.pack('pb_common_map_init_back', value) };
    });
  }

  function trigger(request) {
    const mapTid = Number(request?.map_tid ?? 0);
    if (!Number.isSafeInteger(mapTid) || mapTid <= 0) throw new GameError(1, 'Invalid common map id');
    const x = Number(request?.x ?? 0), y = Number(request?.y ?? 0);
    if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y)) throw new GameError(1, 'Invalid common map node coordinate');
    const config = mapRow(mapTid);
    return store.transaction((model, db) => {
      const map = loadMap(model, db, config);
      map.__tid = config.tid;
      const node = nodeAt(map, x, y);
      if (!node) throw new GameError(5, 'Common map node is missing');
      const settled = settleNode(model, config, node, map);
      saveMap(db, model.state.roleId, map);
      const value = {
        res: settled.res,
        map_tid: mapTid,
        sub_id: Number(request?.sub_id ?? 0),
        trigger_node: node,
        add_buff_list: settled.newlyCleared ? settled.buffs : []
      };
      return { value, data: codec.pack('pb_common_map_node_trigger_back', value) };
    });
  }

  function sweep(request) {
    const mapTid = Number(request?.map_tid ?? 0);
    if (!Number.isSafeInteger(mapTid) || mapTid <= 0) throw new GameError(1, 'Invalid common map id');
    const subId = Number(request?.sub_id ?? 0);
    if (!Number.isSafeInteger(subId) || subId < 0) throw new GameError(1, 'Invalid common map node id');
    const config = mapRow(mapTid);
    return store.transaction((model, db) => {
      const map = loadMap(model, db, config);
      map.__tid = config.tid;
      const node = [...map.line_list, ...map.evt_list].find(entry => Number(entry.cfg_data) === subId) ?? null;
      if (!node) throw new GameError(5, 'Common map node is missing');
      const configNode = config.nodes[subId];
      if (!configNode) throw new GameError(5, 'Common map node configuration missing');
      if (!node.is_over) throw new GameError(5, 'Common map node is not cleared');
      if (!configNode.repeat) throw new GameError(5, 'Common map node cannot be swept');
      if (!configNode.enemies.length && !configNode.award.length) throw new GameError(5, 'Common map node has no sweep settlement');
      let changes = [];
      if (configNode.enemies.length) {
        const battle = reportBattle(
          codec, model, { missionId: config.tid }, { fight_tid: 0 }, attributeTables,
          { mission: { fight: 0 }, enemies: configNode.enemies, tables: battleTables }
        );
        const result = battle.simulation.result;
        log({ event: 'common_map_sweep_resolved', mapTid: config.tid, node: subId, result, rounds: battle.simulation.overRound });
        if (result !== 1) throw new GameError(1, 'Common map sweep battle is lost');
      }
      if (configNode.award.length) changes = grantResources(model, configNode.award, gameTables ?? heroTables).changes;
      saveMap(db, model.state.roleId, map);
      const mapInfo = {
        x: map.x, y: map.y, line_list: map.line_list, evt_list: map.evt_list,
        buff_list: map.buff_list, over_data: map.over_data
      };
      const value = { res: { changes, is_overflow: false }, map_info: mapInfo };
      return { value, data: codec.pack('pb_common_map_sweep_trigger_back', value) };
    });
  }

  return {
    supports: type => [90601, 90602, 90603].includes(type),
    execute(type, input) {
      if (type === 90601) return init(input?.map_tid);
      if (type === 90602) return trigger(input);
      if (type === 90603) return sweep(input);
      throw new GameError(1, 'Unsupported common map command');
    }
  };
}
