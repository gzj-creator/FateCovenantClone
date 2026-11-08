import { GameError } from './hero-progression.mjs';
import {
  ensureCoopTables, guildContext, readDoc, writeDoc, appendEvent, toSeconds, resOf, grantAwards,
  spendResources, etfArgs, decodeCoopRequest, DIAMOND_TID
} from './guild-coop-shared.mjs';

// GuildHuntCmd 103401-103403. Attendance and support are persisted per guild
// role; the response advertises the configured round and real support totals.
// Boss HP and day-change pushes are not listed in the recovered push catalog,
// so the service returns the authoritative server snapshot instead.
export const GUILD_HUNT_COMMANDS = Object.freeze({ attend: 103401, support: 103402, serverInfo: 103403 });
const SCOPE = 'guild_hunt';

export function createGuildHuntService({ store, codec, tables, coopTables, now = Date.now, logger = () => {} }) {
  const config = coopTables.hunt;
  const log = event => { try { logger(event); } catch {} };
  const supported = new Set(Object.values(GUILD_HUNT_COMMANDS));

  function freshState(at) {
    const start = Math.floor(at / config.roundSeconds) * config.roundSeconds;
    return { start, end: start + config.roundSeconds, attend: {}, support: {} };
  }

  function stateDoc(db, guildId, at) {
    const doc = readDoc(db, SCOPE, guildId, '0', 'state') ?? freshState(at);
    if (at >= Number(doc.end)) {
      doc.start = Math.floor(at / config.roundSeconds) * config.roundSeconds;
      doc.end = doc.start + config.roundSeconds;
      doc.attend = {};
      doc.support = {};
    }
    return doc;
  }

  function serverView(doc, context) {
    const bosses = config.stages.map(stage => ({
      stage_tid: stage.stage,
      boss_tid: stage.boss,
      level: stage.level,
      damage: Number(doc.support[stage.stage] ?? 0),
      monster_list: [],
      base_damage: 0
    }));
    return {
      id: 1,
      begin_time: doc.start,
      end_time: doc.end,
      round_list: [{ tid: 1, begin_time: doc.start, end_time: doc.end }],
      settled_round: 0,
      boss_list: bosses,
      join_guild_id_list: Object.keys(doc.attend).length ? [context.guildId] : [],
      super_guild_id_list: [],
      rate: 10000
    };
  }

  function handled(command, input) {
    if (etfArgs(input).length) throw new GameError(1, 'Guild hunt command takes no parameters');
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const doc = stateDoc(db, context.guildId, at);
      if (command === 103401) {
        if (!doc.attend[context.roleId]) {
          doc.attend[context.roleId] = at;
          appendEvent(db, { scope: SCOPE, guildId: context.guildId, roleId: context.roleId, kind: 'hunt_attend', amount: 1, details: { round: doc.start }, at });
        }
        writeDoc(db, SCOPE, context.guildId, '0', 'state', doc, at);
        return { data: Buffer.alloc(0), value: { attended: true, attendees: Object.keys(doc.attend).length } };
      }
      if (command === 103402) {
        const changes = spendResources(model, [[DIAMOND_TID, config.supportCost]], { code: 301, codec });
        const awards = grantAwards(model, tables, config.supportAward, { codec, now });
        const previous = Number(doc.support[context.roleId] ?? 0);
        doc.support[context.roleId] = previous + 1;
        appendEvent(db, { scope: SCOPE, guildId: context.guildId, roleId: context.roleId, kind: 'hunt_support', amount: 1, details: { round: doc.start }, at });
        writeDoc(db, SCOPE, context.guildId, '0', 'state', doc, at);
        return { data: codec.pack('pb_res_to_client', resOf([...changes, ...awards])), value: { support: doc.support[context.roleId] } };
      }
      writeDoc(db, SCOPE, context.guildId, '0', 'state', doc, at);
      return { data: codec.pack('pb_guild_hunt_server', serverView(doc, context)), value: { round: doc.start, attendees: Object.keys(doc.attend).length } };
    });
  }

  async function execute(type, bytes) {
    const command = Number(type);
    if (!supported.has(command)) throw new GameError(1, 'Unknown guild hunt command');
    const input = await decodeCoopRequest(codec, null, command, bytes);
    const result = handled(command, input);
    log({ event: 'guild_hunt_command', type: command, ...result.value });
    return result;
  }
  return { supports: type => supported.has(Number(type)), execute, commands: GUILD_HUNT_COMMANDS };
}
