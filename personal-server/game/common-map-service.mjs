import { GameError } from './hero-progression.mjs';
import { COMMON_MAP_LAYOUT_GAP } from '../config/common-map-tables.mjs';

// CommonMapCmd 90601-90603.
//
// Evidence: pb_common_map_init_back / pb_common_map_node_trigger /
// pb_common_map_node_trigger_back / pb_common_map_sweep_trigger /
// pb_common_map_sweep_trigger_back in assets/protobuf/common_map.net.proto.bin,
// and pb_common_map / pb_common_map_node in common_map.db.proto.bin.
//
// The shipped CommonMapTable (assets/tables/CommonMapTable.data.lua.json.gz)
// holds the shared definitions and one CommonMap row whose only field is
// init_pb_struct = pb_pet_play_master. CommonMapMgr.ReqInitMap decodes the
// request body with that schema and hands it to lua_handle_init_map; the grid
// itself comes from RequireConfig(mapCfgFullName), a separate client map config
// module. No node coordinates, no per-map node list and no map instance state
// ship in the table we can read, so there is nothing to answer init/trigger/
// sweep with.
//
// Every command therefore fails closed with code 5 and COMMON_MAP_LAYOUT_GAP
// instead of serving a fabricated layout. The earlier fixture-only layout engine
// (hand-made node coordinates, fabricated awards) is gone.
export function createCommonMapService({ tables, logger = () => {} } = {}) {
  const unavailable = () => new GameError(5, COMMON_MAP_LAYOUT_GAP);

  return {
    supports: type => [90601, 90602, 90603].includes(type),
    execute(type) {
      if (![90601, 90602, 90603].includes(type)) throw new GameError(1, 'Unsupported common map command');
      try {
        logger({
          event: 'common_map_command_refused',
          type,
          tableAvailable: Boolean(tables?.available),
          mapRows: tables?.maps?.size ?? 0
        });
      } catch {}
      throw unavailable();
    }
  };
}
