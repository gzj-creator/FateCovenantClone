import { GameError } from './hero-progression.mjs';
import { GUILD_MODULE_ID } from './guild-roster-service.mjs';
import { rawBinary } from '../protocol/game-codec.mjs';

const GUILD_NATION_ASSIST_LIST = 99229;

function currentGuildId(state, codec) {
  const module = new Map(state.modules.value).get(GUILD_MODULE_ID);
  if (!module) throw new GameError(5, 'Guild login state is missing');
  let login;
  try {
    login = codec.unpack('pb_res_guild_login', rawBinary(module));
  } catch {
    throw new GameError(5, 'Guild login state is invalid');
  }
  const text = String(login.guildId ?? '0').trim();
  if (!/^[0-9]+$/.test(text)) throw new GameError(5, 'Guild login id is invalid');
  return BigInt(text) === 0n ? null : text;
}

export function createGuildNationAssistService({ codec, store, now = Date.now }) {
  const currentSeconds = () => Math.max(0, Math.trunc(Number(now()) / 1000));

  function query(input) {
    if (input !== undefined && input !== null) {
      throw new GameError(1, 'Guild nation assist list takes no parameters');
    }
    const guildId = currentGuildId(store.state(), codec);
    if (!guildId) return { data: codec.pack('pb_guild_nation_assist_list_back', { list: [] }), value: { list: [], guildId: null }, guildId: null };
    const timestamp = currentSeconds();
    const rows = store.inspect(db => db.prepare(`
      SELECT assist_id,requester_role_id,target_type,target_id,max_num,assist_num,finish_time,target_lv
      FROM guild_nation_assists
      WHERE guild_id=? AND finish_time>? AND assist_num<max_num
      ORDER BY finish_time ASC, assist_id ASC
    `).all(guildId, timestamp));
    const list = rows.map(row => ({
      role_id: String(row.requester_role_id),
      target_type: Number(row.target_type),
      target_id: Number(row.target_id),
      max_num: Number(row.max_num),
      assist_num: Number(row.assist_num),
      finish_time: String(row.finish_time),
      target_lv: Number(row.target_lv),
      id: String(row.assist_id)
    }));
    const value = { list };
    return { data: codec.pack('pb_guild_nation_assist_list_back', value), value, guildId };
  }

  return {
    supports: type => Number(type) === GUILD_NATION_ASSIST_LIST,
    execute: query
  };
}
