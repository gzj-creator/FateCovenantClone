import { GameError } from './hero-progression.mjs';
import {
  ensureCoopTables, guildContext, readDoc, writeDoc, claimOnce, appendEvent, toSeconds,
  resOf, grantAwards, spendResources, asInteger, etfArgs, decodeCoopRequest,
  rosterScores, lineupPower, damageFromPower, DIAMOND_TID
} from './guild-coop-shared.mjs';

// GuildExpeditionCmd 101601-101615. A weekly local round keeps city
// declarations, positions, guesses, likes and fight reports in the common
// cooperation store. All award requests use claim markers, and city, build and
// role rankings are derived from recorded actions rather than a seeded table.
export const GUILD_EXPEDITION_COMMANDS = Object.freeze({
  serverInfo: 101601, declare: 101602, inspire: 101603, fightReport: 101604,
  cityRank: 101605, guildInnerRank: 101606, buildRank: 101607,
  guessInfo: 101608, guess: 101609, cityPosList: 101610,
  buildPosList: 101611, like: 101612, guildInfo: 101613,
  grass: 101614, cityInfoList: 101615
});
const SCOPE = 'guild_expedition';
const REQUEST_SCHEMAS = { 101609: 'pb_guild_expedition_guess_req', 101614: 'pb_guild_expedition_pos_fight_req' };

export function createGuildExpeditionService({ store, codec, tables, heroTables, coopTables, now = Date.now, logger = () => {} }) {
  const config = coopTables.expedition;
  const log = event => { try { logger(event); } catch {} };
  const supported = new Set(Object.values(GUILD_EXPEDITION_COMMANDS));

  function freshWorld(at) {
    const start = Math.floor(at / config.periodSeconds) * config.periodSeconds;
    return {
      period: { start, end: start + config.periodSeconds },
      round: Math.floor((at - start) / config.roundSeconds) + 1,
      declare: 0, points: 0, positions: {}, guesses: {}, reports: {}, likes: {}
    };
  }

  function worldDoc(db, guildId, at) {
    const existing = readDoc(db, SCOPE, guildId, '0', 'world');
    if (existing && at < Number(existing.period.end)) return existing;
    return writeDoc(db, SCOPE, guildId, '0', 'world', freshWorld(at), at);
  }

  function personDoc(db, guildId, roleId, at) {
    return readDoc(db, SCOPE, guildId, roleId, 'state') ?? {
      inspire: 0, guesses: [], like: 0, grass: 0, fights: 0, reports: []
    };
  }

  function positions(world) {
    return Object.entries(world.positions).map(([uid, pos]) => ({
      uid,
      occupy_role_id: pos.roleId,
      occupy_team_id: pos.teamId,
      guild_id: pos.guildId
    }));
  }

  function cityList(world, context) {
    return config.cityIds.map(cityId => ({
      city_id: cityId,
      guild_id_list: Number(world.declare) === cityId ? [context.guildId] : []
    }));
  }

  function roleView(person) {
    return {
      team_list: [], point: Number(person.inspire ?? 0), inspire_count: {},
      can_enter_expedition: true, guess_role_ids: person.guesses,
      like_time: Number(person.like ?? 0), challenge_damage: 0,
      grass_point: Number(person.grass ?? 0), def_num: 0, inspire_point: Number(person.inspire ?? 0)
    };
  }

  function serverView(world, context) {
    return {
      version: Math.floor(world.period.start / config.periodSeconds) + 1,
      version_start_time: world.period.start,
      version_end_time: world.period.end,
      round_list: [{ round_tid: world.round, duration: config.roundSeconds }],
      settled_round: Math.max(0, Number(world.round) - 1),
      pos_list: positions(world), city_list: cityList(world, context),
      guess_role_list: [], support_times: 0, fit_list: []
    };
  }

  function guildView(world, context) {
    return {
      proclaim_city: Number(world.declare),
      proclaim_type: world.declare ? 1 : 0,
      guild_point: Number(world.points),
      inspire_point: 0,
      results: [],
      role_id_list: context.members.map(member => String(member.role_id)),
      report_list: Object.values(world.reports).flat(),
      proclaim_time: Number(world.declareAt ?? 0),
      top_role_id_list: [], check_role_id_list: []
    };
  }

  function rankScores(world, context) {
    return rosterScores(store.inspect(db => db), { scope: SCOPE, guildId: context.guildId, members: context.members });
  }

  function handled(command, input) {
    const args = etfArgs(input);
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const world = worldDoc(db, context.guildId, at);
      const person = personDoc(db, context.guildId, context.roleId, at);
      let changes = [];
      let data = Buffer.alloc(0);
      let value = {};

      switch (command) {
        case GUILD_EXPEDITION_COMMANDS.serverInfo:
          data = codec.pack('pb_guild_expedition_info', serverView(world, context));
          value = { round: world.round };
          break;
        case GUILD_EXPEDITION_COMMANDS.declare: {
          if (world.declare) throw new GameError(3, 'The guild already declared this round');
          const city = asInteger(args[0] ?? config.cityIds[0], 'expedition city', { min: 1 });
          if (!config.cityIds.includes(city)) throw new GameError(1, 'Expedition city does not exist');
          changes = spendResources(model, [[DIAMOND_TID, config.declareCost]], { code: 301, codec });
          world.declare = city;
          world.declareAt = at;
          appendEvent(db, { scope: SCOPE, guildId: context.guildId, roleId: context.roleId, kind: 'expedition_declare', amount: 1, details: { city }, at });
          value = { city };
          break;
        }
        case GUILD_EXPEDITION_COMMANDS.inspire: {
          changes = spendResources(model, [[DIAMOND_TID, config.inspireCost]], { code: 301, codec });
          person.inspire += 1;
          world.points += 1;
          appendEvent(db, { scope: SCOPE, guildId: context.guildId, roleId: context.roleId, kind: 'expedition_inspire', amount: 1, details: {}, at });
          data = codec.pack('pb_guild_expedition_inspire_back', { res: resOf(changes), count_info: {}, role_point: person.inspire });
          value = { inspire: person.inspire };
          break;
        }
        case GUILD_EXPEDITION_COMMANDS.fightReport: {
          const reports = Object.values(world.reports).flat();
          data = codec.pack('pb_guild_expedition_req_report_back', { report_list: reports });
          value = { reports: reports.length };
          break;
        }
        case GUILD_EXPEDITION_COMMANDS.cityRank: {
          data = codec.pack('pb_guild_expedition_city_guild_rank', { rank_list: world.declare ? [{
            guild_id: context.guildId, guild_name: Buffer.from(context.guild.name ?? 'Local Guild'),
            score: world.points, power: lineupPower(model, heroTables), role_num: context.members.length
          }] : [] });
          value = { declared: Boolean(world.declare) };
          break;
        }
        case GUILD_EXPEDITION_COMMANDS.guildInnerRank: {
          const scores = rankScores(world, context);
          data = codec.pack('pb_guild_expedition_city_role_rank', { rank_list: scores.map(row => ({ role_id: row.role_id, score: row.score, power: 0 })) });
          value = { ranks: scores.length };
          break;
        }
        case GUILD_EXPEDITION_COMMANDS.buildRank: {
          data = codec.pack('pb_guild_expedition_build_guild_rank', { rank_list: [{
            guild_id: context.guildId, guild_name: Buffer.from(context.guild.name ?? 'Local Guild'),
            pos_num: Object.keys(world.positions).length, value: world.points
          }] });
          value = { positions: Object.keys(world.positions).length };
          break;
        }
        case GUILD_EXPEDITION_COMMANDS.guessInfo:
          data = codec.pack('pb_guild_expedition_guess_info_back', { guess_role_list: Object.entries(world.guesses).map(([roleId, ids]) => ({ role_id: roleId, guess_num: ids.length, support_role_ids: [] })) });
          value = { guesses: person.guesses.length };
          break;
        case GUILD_EXPEDITION_COMMANDS.guess: {
          const targets = Array.isArray(input?.role_id_list) ? input.role_id_list.map(String) : [];
          if (!targets.length) throw new GameError(1, 'Guess role list is empty');
          changes = spendResources(model, [[DIAMOND_TID, config.guessCost]], { code: 301, codec });
          person.guesses = [...new Set([...person.guesses, ...targets])];
          world.guesses[context.roleId] = person.guesses;
          data = codec.pack('pb_guild_expedition_guess_back', {
            guess_role_list: Object.entries(world.guesses).map(([roleId, ids]) => ({ role_id: roleId, guess_num: ids.length, support_role_ids: [] })),
            role_info: roleView(person)
          });
          value = { selected: targets.length };
          break;
        }
        case GUILD_EXPEDITION_COMMANDS.cityPosList:
        case GUILD_EXPEDITION_COMMANDS.buildPosList:
          data = codec.pack('pb_guild_expedition_pos_list', { pos_list: positions(world) });
          value = { positions: Object.keys(world.positions).length };
          break;
        case GUILD_EXPEDITION_COMMANDS.like: {
          const period = String(world.period.start);
          if (!claimOnce(db, { scope: SCOPE, guildId: context.guildId, roleId: context.roleId, key: 'like', period, at })) throw new GameError(310, 'Like reward was already claimed');
          person.like = at;
          world.likes[context.roleId] = at;
          changes = grantAwards(model, tables, config.likeAward, { codec, now });
          data = codec.pack('pb_res_to_client', resOf(changes));
          value = { likes: Object.keys(world.likes).length };
          break;
        }
        case GUILD_EXPEDITION_COMMANDS.guildInfo:
          data = codec.pack('pb_guild_expedition_guild', guildView(world, context));
          value = { declared: Boolean(world.declare), points: world.points };
          break;
        case GUILD_EXPEDITION_COMMANDS.grass: {
          const buildTid = asInteger(input?.build_tid, 'build tid', { min: 1 });
          const pos = asInteger(input?.pos, 'position', { min: 1, max: config.posCount });
          const teamId = asInteger(input?.team_id, 'team id', { min: 1 });
          const damage = damageFromPower(lineupPower(model, heroTables), config.fightPercent);
          person.grass += damage;
          world.points += damage;
          world.positions[pos] = { roleId: context.roleId, teamId, guildId: context.guildId, buildTid };
          const report = { id: world.period.start * 1000 + pos, tid: buildTid, type: 1, atk_role_id: context.roleId, def_role_id: 0, time: at, final_result: 1, req: Buffer.alloc(0) };
          (world.reports[pos] ??= []).push(report);
          appendEvent(db, { scope: SCOPE, guildId: context.guildId, roleId: context.roleId, kind: 'expedition_fight', amount: damage, details: { pos, buildTid }, at });
          data = codec.pack('pb_guild_expedition_pos_fight_back', { res: resOf(changes), pos_info_list: positions(world), role_info: roleView(person) });
          value = { damage, pos };
          break;
        }
        case GUILD_EXPEDITION_COMMANDS.cityInfoList:
          data = codec.pack('pb_guild_expedition_city_info_list', { city_list: cityList(world, context) });
          value = { cities: config.cityIds.length };
          break;
        default: throw new GameError(1, 'Unknown expedition command');
      }

      writeDoc(db, SCOPE, context.guildId, '0', 'world', world, at);
      writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', person, at);
      world.period.start = Number(world.period.start);
      return { data, value };
    });
  }

  async function execute(type, bytes) {
    const command = Number(type);
    if (!supported.has(command)) throw new GameError(1, 'Unknown expedition command');
    const input = await decodeCoopRequest(codec, REQUEST_SCHEMAS, command, bytes);
    const result = handled(command, input);
    log({ event: 'guild_expedition_command', type: command, ...result.value });
    return result;
  }
  return { supports: type => supported.has(Number(type)), execute, commands: GUILD_EXPEDITION_COMMANDS, requestSchemas: REQUEST_SCHEMAS };
}
