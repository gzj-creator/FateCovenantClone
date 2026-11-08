import { GameError } from './hero-progression.mjs';
import {
  ensureCoopTables, guildContext, readDoc, writeDoc, claimOnce, appendEvent, toSeconds,
  resOf, grantAwards, asInteger, optionalInteger, etfArgs, decodeCoopRequest,
  lineupPower, damageFromPower, bigSub
} from './guild-coop-shared.mjs';

// GuildGVGCmd 97001-97018. Map entities, team state, lode possession and task
// claims are persisted in the shared cooperation tables. The shipped client
// catalog names only pb_res_to_client for pick_box; the other request handlers
// are ETF/protobuf acknowledgements, so state is written first and the client
// receives the matching empty acknowledgement rather than a fabricated schema.
export const GUILD_GVG_COMMANDS = Object.freeze({
  pickBox: 97001, pickLode: 97002, attackLode: 97003, revLode: 97004,
  pickMonster: 97005, revMonster: 97006, pickBlock: 97007, pickHold: 97008,
  pvp: 97009, defenseHold: 97010, focus: 97011, task: 97012,
  unlockPortal: 97013, portal: 97014, cancelBlock: 97015,
  leaveHold: 97016, cancelMonster: 97017, leaveHoldFight: 97018
});
const SCOPE = 'guild_gvg';
const REQUEST_SCHEMAS = {
  97002: 'pb_guild_gvg_req', 97003: 'pb_guild_gvg_req', 97005: 'pb_guild_gvg_req',
  97007: 'pb_guild_gvg_req', 97008: 'pb_guild_gvg_req', 97010: 'pb_guild_gvg_req',
  97014: 'pb_guild_gvg_portal_req', 97015: 'pb_guild_gvg_req',
  97016: 'pb_guild_gvg_req', 97017: 'pb_guild_gvg_req', 97018: 'pb_guild_gvg_req'
};

export function createGuildGvgService({ store, codec, tables, heroTables, coopTables, now = Date.now, logger = () => {} }) {
  const config = coopTables.gvg;
  const log = event => { try { logger(event); } catch {} };
  const supported = new Set(Object.values(GUILD_GVG_COMMANDS));

  function freshWorld(at) {
    const start = Math.floor(at / config.periodSeconds) * config.periodSeconds;
    return {
      period: { start, end: start + config.periodSeconds },
      monsters: Object.fromEntries(config.nodes.map(node => [node.node, { hp: node.monsterHp, dead: false }])),
      blocks: Object.fromEntries(config.nodes.map(node => [node.node, { hp: config.blockHp, guildId: 0 }])),
      holds: {}, lodes: {}, focus: 0, occupied: 0
    };
  }

  function worldDoc(db, guildId, at) {
    const existing = readDoc(db, SCOPE, guildId, '0', 'world');
    if (existing && at < Number(existing.period.end)) return existing;
    return writeDoc(db, SCOPE, guildId, '0', 'world', freshWorld(at), at);
  }

  function personDoc(db, guildId, roleId, at) {
    return readDoc(db, SCOPE, guildId, roleId, 'state') ?? {
      boxes: 0, tasks: 0, focus: 0, portals: [], nowNode: 0, holds: {}, teams: [], share: []
    };
  }

  function nodeFrom(input, args) {
    const raw = input?.map_node_id ?? args[0];
    return asInteger(raw, 'map node id', { min: 1, max: 4294967295 });
  }

  function teamFrom(input, args) {
    return optionalInteger(input?.team_id ?? args[1], 'team id', { min: 1, max: config.teamCount }) ?? 1;
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
      let value = {};

      switch (command) {
        case GUILD_GVG_COMMANDS.pickBox: {
          if (args.length > 1) throw new GameError(1, 'Pick box takes at most one parameter');
          const key = 'box:' + Math.floor(at / config.lodeSeconds);
          if (!claimOnce(db, { scope: SCOPE, guildId: context.guildId, roleId: context.roleId, key, period: String(world.period.start), at })) {
            throw new GameError(310, 'GVG box was already claimed');
          }
          person.boxes += 1;
          changes = grantAwards(model, tables, config.boxAwards, { codec, now });
          value = { boxes: person.boxes };
          break;
        }
        case GUILD_GVG_COMMANDS.pickLode:
        case GUILD_GVG_COMMANDS.attackLode:
        case GUILD_GVG_COMMANDS.leaveHoldFight: {
          const node = nodeFrom(input, args);
          const team = teamFrom(input, args);
          world.lodes[node] = { roleId: context.roleId, teamId: team, start: at, end: at + config.lodeSeconds };
          person.nowNode = node;
          appendEvent(db, { scope: SCOPE, guildId: context.guildId, roleId: context.roleId, kind: 'gvg_lode', amount: 1, details: { node }, at });
          value = { node, team, end: world.lodes[node].end };
          break;
        }
        case GUILD_GVG_COMMANDS.revLode: {
          if (args.length > 1) throw new GameError(1, 'Reveal lode takes at most one parameter');
          const node = optionalInteger(args[0], 'map node id', { min: 1 });
          const entries = Object.entries(world.lodes).filter(([id, lode]) => String(lode.roleId) === context.roleId && (node === null || Number(id) === node));
          if (!entries.length) throw new GameError(5, 'No lode is held by this role');
          for (const [id, lode] of entries) {
            const periods = Math.max(0, Math.floor((Math.min(at, Number(lode.end)) - Number(lode.start)) / config.lodeSeconds));
            if (periods && claimOnce(db, { scope: SCOPE, guildId: context.guildId, roleId: context.roleId, key: 'lode:' + id, period: String(lode.start), at })) {
              changes.push(...grantAwards(model, tables, config.lodeAwards, { codec, now }));
            }
          }
          value = { claimed: changes.length };
          break;
        }
        case GUILD_GVG_COMMANDS.pickMonster:
        case GUILD_GVG_COMMANDS.cancelMonster: {
          const node = nodeFrom(input, args);
          const monster = world.monsters[node];
          if (!monster) throw new GameError(1, 'GVG monster does not exist');
          if (command === GUILD_GVG_COMMANDS.pickMonster && !monster.dead) {
            const damage = damageFromPower(lineupPower(model, heroTables), config.attackPercent);
            monster.hp = bigSub(monster.hp, damage).toString();
            monster.dead = BigInt(monster.hp) === 0n;
            appendEvent(db, { scope: SCOPE, guildId: context.guildId, roleId: context.roleId, kind: 'gvg_damage', amount: damage, details: { node }, at });
            value = { node, damage, dead: monster.dead };
          } else {
            value = { node, cancelled: true };
          }
          break;
        }
        case GUILD_GVG_COMMANDS.revMonster: {
          const key = 'rev-monster';
          if (!claimOnce(db, { scope: SCOPE, guildId: context.guildId, roleId: context.roleId, key, period: String(world.period.start), at })) {
            throw new GameError(310, 'Monster reward was already claimed');
          }
          changes = grantAwards(model, tables, config.boxAwards, { codec, now });
          value = { claimed: true };
          break;
        }
        case GUILD_GVG_COMMANDS.pickBlock:
        case GUILD_GVG_COMMANDS.cancelBlock: {
          const node = nodeFrom(input, args);
          if (command === GUILD_GVG_COMMANDS.pickBlock) {
            world.blocks[node] ??= { hp: config.blockHp, guildId: 0 };
            person.nowNode = node;
            value = { node, picked: true };
          } else {
            person.nowNode = 0;
            value = { node, cancelled: true };
          }
          break;
        }
        case GUILD_GVG_COMMANDS.pickHold:
        case GUILD_GVG_COMMANDS.defenseHold:
        case GUILD_GVG_COMMANDS.leaveHold: {
          const node = nodeFrom(input, args);
          if (command === GUILD_GVG_COMMANDS.leaveHold) {
            delete person.holds[node];
            value = { node, left: true };
          } else {
            world.holds[node] = { guildId: context.guildId, start: at, guardHp: config.guardHp };
            person.holds[node] = at;
            person.nowNode = node;
            value = { node, held: true };
          }
          break;
        }
        case GUILD_GVG_COMMANDS.pvp: {
          const node = optionalInteger(args[0], 'map node id', { min: 1 });
          const score = Math.max(1, Math.floor(lineupPower(model, heroTables) / 100));
          appendEvent(db, { scope: SCOPE, guildId: context.guildId, roleId: context.roleId, kind: 'gvg_pvp', amount: score, details: { node }, at });
          world.occupied += 1;
          value = { node, score };
          break;
        }
        case GUILD_GVG_COMMANDS.focus: {
          const node = optionalInteger(args[0], 'map node id', { min: 1 });
          if (node === null) throw new GameError(1, 'Focus needs a map node');
          world.focus = node;
          person.focus = node;
          value = { node };
          break;
        }
        case GUILD_GVG_COMMANDS.task: {
          const row = config.taskAwards[0];
          if (!claimOnce(db, { scope: SCOPE, guildId: context.guildId, roleId: context.roleId, key: 'task:' + row.tid, period: String(world.period.start), at })) {
            throw new GameError(310, 'GVG task was already claimed');
          }
          person.tasks += 1;
          changes = grantAwards(model, tables, row.items, { codec, now });
          value = { task: row.tid, claimed: true };
          break;
        }
        case GUILD_GVG_COMMANDS.unlockPortal: {
          const tid = asInteger(args[0], 'portal tid', { min: 1 });
          if (!person.portals.includes(tid)) person.portals.push(tid);
          value = { portal: tid, unlocked: true };
          break;
        }
        case GUILD_GVG_COMMANDS.portal: {
          const tid = asInteger(input?.tid, 'portal tid', { min: 1 });
          person.portals = [...new Set([...person.portals, tid])];
          value = { portal: tid, points: Array.isArray(input?.point) ? input.point.length : 0 };
          break;
        }
        default: throw new GameError(1, 'Unknown GVG command');
      }

      writeDoc(db, SCOPE, context.guildId, '0', 'world', world, at);
      writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', person, at);
      const data = command === GUILD_GVG_COMMANDS.pickBox
        ? codec.pack('pb_res_to_client', resOf(changes))
        : Buffer.alloc(0);
      return { data, value };
    });
  }

  async function execute(type, bytes) {
    const command = Number(type);
    if (!supported.has(command)) throw new GameError(1, 'Unknown GVG command');
    const input = await decodeCoopRequest(codec, REQUEST_SCHEMAS, command, bytes);
    const result = handled(command, input);
    log({ event: 'guild_gvg_command', type: command, ...result.value });
    return result;
  }
  return { supports: type => supported.has(Number(type)), execute, commands: GUILD_GVG_COMMANDS, requestSchemas: REQUEST_SCHEMAS };
}
