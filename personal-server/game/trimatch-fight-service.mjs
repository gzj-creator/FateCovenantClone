import { encodeEtfIntegerTuple } from '../protocol/game-codec.mjs';
import { BATTLE_RESULT, FIGHT_INITIAL_ENERGY, simulateBattle } from './battle-engine.mjs';
import {
  CODE_INVALID, CODE_STATE, fail, integer, isoSeconds,
  ensureRoleState, ensureTrimatchTables, fightersOfRole, powerOf, teamSitesOf
} from './trimatch-core.mjs';

// Triple match fight pipeline (BATTLE-TRIPLEMATCHFIGHT, 115001-115006).
//
// Evidence used by this module:
//  * TripleMatchFightCmd registers six commands. 115001 (req_triple_match_fight),
//    115002 (triple_match_fight_swap) and 115004 (triple_match_fight_ready) wrap
//    their payload with Codec.EncodePB; retry, giveup and get_record send a bare
//    Erlang term (the fight id) through Codec.EncodeErl.
//  * FightTripleMatchFightMgr.ReqStartFight reads
//    TripleMatchFightTable.TripleMatchFight[fightTid].lineup and the fighting
//    line-up; ReqSwap sends id/x1/y1/x2/y2/round_id/phase_id/client_op_id;
//    ReqReady sends fightId/roundId/operatePhaseId.
//  * TripleMatchFightTable.lua assigns TID_ACTION_FIGHT_START .. TID_ACTION_BOARD_SWAP
//    to ids 1..19, matching the shipped ActionType rows, so the report below uses
//    those actionType ids.
//  * Team.attr holds TripleMatchFightTable.NpcAttr tids. Summing hp*1 + atk*8 +
//    def*50 (BattleTriMatchPowerConst) over a team reproduces the shipped
//    Team.show_power for 632 of 642 teams (median ratio 1.067), so the enemy
//    fighters come from the real table instead of a scaled copy of the player.
//  * Board resolution of a swap (match detection, elimination order, damage
//    attribution, angle accumulation) has no shipped evidence: the client Lua
//    only replays del_list pushed by the server. Swaps are recorded and
//    acknowledged without touching the board and no 11901 delta is pushed.
const FIGHT_START = 115001;
const FIGHT_SWAP = 115002;
const FIGHT_RETRY = 115003;
const FIGHT_READY = 115004;
const FIGHT_GIVEUP = 115005;
const FIGHT_RECORD = 115006;
const SUPPORTED = [FIGHT_START, FIGHT_SWAP, FIGHT_RETRY, FIGHT_READY, FIGHT_GIVEUP, FIGHT_RECORD];

// TripleMatchFightTable TID_ACTION_* ids.
const ACTION_FIGHT_START = 1;
const ACTION_FIGHT_END = 2;
const ACTION_ROUND_START = 3;
const ACTION_ROUND_END = 4;
const ACTION_SKILL_START = 5;
const ACTION_SKILL_END = 6;
const ACTION_HURT = 11;
const ACTION_RECOVER = 12;
const ACTION_UPDATE_ANGER = 13;
const ACTION_DEAD = 15;
const ACTION_UPDATE_ATTR = 16;

// TripleMatchFightTable.Attr 26 is the shield channel; the engine's shield
// events are reported through it.
const ATTR_SHIELD = 26;
// The fight lifecycle has no configured expiry, so the deployment keeps a stored
// report for a week before 115006 stops replaying it.
const REPORT_RETENTION_SECONDS = 7 * 86400;
const MAX_SWAP_OPERATIONS = 4096;

function ensureFightTables(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS trimatch_fight (
    role_id INTEGER NOT NULL,
    fight_uid INTEGER NOT NULL,
    fight_tid INTEGER NOT NULL,
    fight_type INTEGER NOT NULL,
    is_pve INTEGER NOT NULL,
    lineup_type INTEGER NOT NULL,
    board_tid INTEGER NOT NULL,
    board_json TEXT NOT NULL,
    red_team_json TEXT NOT NULL,
    blue_team_json TEXT NOT NULL,
    atk_power TEXT NOT NULL,
    def_power TEXT NOT NULL,
    atk_role_id INTEGER NOT NULL,
    def_role_id INTEGER NOT NULL,
    result INTEGER NOT NULL,
    attempt INTEGER NOT NULL,
    round_id INTEGER NOT NULL,
    phase_id INTEGER NOT NULL,
    remaining_ms INTEGER NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY(role_id, fight_uid)
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS trimatch_fight_action (
    role_id INTEGER NOT NULL,
    fight_uid INTEGER NOT NULL,
    seq INTEGER NOT NULL,
    action_type INTEGER NOT NULL,
    payload BLOB NOT NULL,
    PRIMARY KEY(role_id, fight_uid, seq)
  )`);
  // client_op_id is the client's monotonic swap id; the primary key makes a
  // retried request idempotent.
  db.exec(`CREATE TABLE IF NOT EXISTS trimatch_fight_op (
    role_id INTEGER NOT NULL,
    fight_uid INTEGER NOT NULL,
    client_op_id INTEGER NOT NULL,
    round_id INTEGER NOT NULL,
    phase_id INTEGER NOT NULL,
    x1 INTEGER NOT NULL,
    y1 INTEGER NOT NULL,
    x2 INTEGER NOT NULL,
    y2 INTEGER NOT NULL,
    is_auto INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY(role_id, fight_uid, client_op_id)
  )`);
}

// mulberry32 keeps the served board and the battle seed reproducible for a
// (role, fight, attempt) triple.
function makeRandom(seed) {
  let state = seed >>> 0 || 1;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(...parts) {
  let seed = 0x811c9dc5;
  for (const part of parts) {
    const text = String(part);
    for (let index = 0; index < text.length; index += 1) {
      seed ^= text.charCodeAt(index);
      seed = Math.imul(seed, 0x01000193);
    }
  }
  return seed >>> 0 || 1;
}

function npcAttributes(row) {
  const flat = { hp: 0, atk: 0, def: 0 };
  for (const pair of Array.isArray(row?.attr) ? row.attr : []) {
    if (!Array.isArray(pair) || pair.length !== 2) fail(CODE_STATE, 'Triple match enemy attribute row is invalid');
    const attr = Number(pair[0]), value = Number(pair[1]);
    if (!Number.isFinite(value)) fail(CODE_STATE, 'Triple match enemy attribute value is invalid');
    if (attr === 1) flat.hp += value;
    else if (attr === 2) flat.atk += value;
    else if (attr === 3) flat.def += value;
  }
  if (flat.hp <= 0 || flat.atk <= 0) fail(CODE_STATE, 'Triple match enemy attribute row has no health or attack');
  return {
    hp: Math.max(1, Math.round(flat.hp)),
    atk: Math.max(1, Math.round(flat.atk)),
    def: Math.max(0, Math.round(flat.def))
  };
}

function fightAction(actionType, field, value) {
  return { actionType, [field]: value };
}

export function createTriMatchFightService({
  store,
  codec,
  tables,
  gameTables = null,
  now = Date.now,
  logger = () => {},
  hooks = {}
}) {
  const log = event => { try { logger(event); } catch {} };
  if (!tables?.fightRows?.size) throw new Error('Triple match fight configuration is unavailable');

  function typeRowOf(fightTid) {
    const row = tables.fightRows.get(Number(fightTid));
    if (!row) fail(CODE_STATE, 'Triple match fight configuration is missing: ' + fightTid);
    const typeRow = tables.fightTypes.get(Number(row.type));
    if (!typeRow) fail(CODE_STATE, 'Triple match fight type configuration is missing: ' + row.type);
    return { row, typeRow };
  }

  const packAction = (actionType, field, value) => codec.pack('action', fightAction(actionType, field, value));

  // Enemy line-up: TripleMatchFight.def_team -> Team -> NpcAttr.
  function enemyFighters(row) {
    const team = tables.fightTeams.get(Number(row.def_team));
    if (!team) fail(CODE_STATE, 'Triple match enemy team configuration is missing: ' + row.def_team);
    const npcs = Array.isArray(team.npc) ? team.npc.map(Number) : [];
    const locs = Array.isArray(team.loc) ? team.loc.map(Number) : [];
    const attrs = Array.isArray(team.attr) ? team.attr.map(Number) : [];
    if (!npcs.length) fail(CODE_STATE, 'Triple match enemy team is empty: ' + row.def_team);
    if (npcs.length !== locs.length || locs.length !== attrs.length) {
      fail(CODE_STATE, 'Triple match enemy team row is inconsistent: ' + row.def_team);
    }
    const fighters = npcs.map((npcTid, index) => {
      const npcRow = tables.fightNpcs.get(npcTid);
      if (!npcRow) fail(CODE_STATE, 'Triple match enemy npc configuration is missing: ' + npcTid);
      const attrRow = tables.npcAttrs.get(attrs[index]);
      if (!attrRow) fail(CODE_STATE, 'Triple match enemy attribute configuration is missing: ' + attrs[index]);
      const attributes = npcAttributes(attrRow);
      return {
        uid: 201 + index,
        tid: npcTid,
        level: Number(attrRow.show_level ?? 1),
        loc: locs[index],
        star: Number(npcRow.star ?? 0),
        profession: Number(npcRow.profession ?? 0),
        attributes,
        power: powerOf(tables, attributes)
      };
    });
    const computed = fighters.reduce((sum, fighter) => sum + fighter.power, 0);
    const showPower = Number(team.show_power ?? 0);
    if (showPower > 0 && Math.abs(computed / showPower - 1) > 0.15) {
      // The tutorial and hand tuned teams (Team 1-105) carry placeholder
      // show_power values; the mismatch is reported instead of overriding rows.
      log({ event: 'trimatch_enemy_power_mismatch', team: Number(team.tid), computed, showPower });
    }
    return fighters;
  }

  function playerFighters(model, db, roleId, lineupType) {
    const sites = teamSitesOf(model, db, tables, roleId, lineupType);
    const fighters = fightersOfRole(model, db, tables, roleId, sites);
    if (!fighters.length) fail(CODE_STATE, 'Triple match lineup has no deployed hero');
    return fighters.map((fighter, index) => ({
      uid: 101 + index,
      tid: fighter.hero_tid,
      level: fighter.level,
      loc: fighter.site_index,
      star: fighter.star,
      profession: Number(tables.heroes.get(fighter.hero_tid)?.profession ?? 0),
      attributes: { hp: fighter.attributes.hp, atk: fighter.attributes.atk, def: fighter.attributes.def },
      power: fighter.power
    }));
  }

  function fighterRow(fighter) {
    return {
      uid: fighter.uid,
      tid: fighter.tid,
      level: fighter.level,
      loc: fighter.loc,
      maxHp: fighter.attributes.hp,
      anger: FIGHT_INITIAL_ENERGY,
      hp: fighter.attributes.hp,
      star: fighter.star
    };
  }

  const teamList = (fighters, teamUid) => [{ uid: teamUid, fighters: fighters.map(fighterRow) }];

  // TileLib rows with a non-zero weight are the pool the board is filled from.
  function boardTiles(row, seed) {
    const board = tables.fightBoards.get(Number(row.board));
    if (!board) fail(CODE_STATE, 'Triple match board configuration is missing: ' + row.board);
    const xTiles = Number(board.x_tile), yTiles = Number(board.y_tile);
    if (!Number.isSafeInteger(xTiles) || !Number.isSafeInteger(yTiles) || xTiles <= 0 || yTiles <= 0) {
      fail(CODE_STATE, 'Triple match board size is invalid: ' + row.board);
    }
    const pool = (tables.fightTilesByLib.get(Number(board.tile_lib)) ?? []).filter(tile => Number(tile.weight) > 0);
    if (!pool.length) fail(CODE_STATE, 'Triple match tile library is empty: ' + board.tile_lib);
    const total = pool.reduce((sum, tile) => sum + Number(tile.weight), 0);
    const random = makeRandom(seed);
    const tiles = [];
    for (let x = 1; x <= xTiles; x += 1) {
      for (let y = 1; y <= yTiles; y += 1) {
        let roll = random() * total, chosen = pool[pool.length - 1];
        for (const tile of pool) {
          roll -= Number(tile.weight);
          if (roll <= 0) { chosen = tile; break; }
        }
        tiles.push({ x, y, tid: Number(chosen.tid) });
      }
    }
    return { board, tiles };
  }

  const boardMap = tiles => ({ tile_list: tiles.map(tile => ({ x: tile.x, y: tile.y, tid: tile.tid })) });

  // Projects the battle engine event stream into triple match report actions.
  // Payload shapes that are not recovered (buff add/remove, revive, board swap)
  // are dropped rather than invented.
  function reportActions({ fightType, fightTid, atkRoleId, defRoleId, atkPower, defPower, redTeams, blueTeams }, simulation) {
    const list = [packAction(ACTION_FIGHT_START, 'fightStart', {
      fightType,
      fightTid,
      redTeams,
      blueTeams,
      redRoleId: atkRoleId,
      blueRoleId: defRoleId,
      red_power: atkPower,
      blue_power: defPower
    })];
    let open = null;
    const closeAction = () => {
      if (!open) return;
      list.push(packAction(ACTION_SKILL_END, 'skillEnd', { casterUid: open.uid, skillTid: open.skillTid }));
      open = null;
    };
    for (const event of simulation.events) {
      if (event.kind === 'round-start') {
        list.push(packAction(ACTION_ROUND_START, 'roundStart', { roundIndex: event.round, operate_team: 1 }));
      } else if (event.kind === 'action-start' || event.kind === 'passive-action-start') {
        closeAction();
        const skillTid = Number(event.abilityId ?? 0);
        open = { uid: event.srcId, skillTid };
        list.push(packAction(ACTION_SKILL_START, 'skillStart', {
          casterUid: event.srcId,
          skillTid,
          targetUids: (event.aimList ?? []).map(Number),
          assistUids: (event.assistIds ?? []).map(Number),
          triggerSkillTid: 0,
          skillLevel: 1
        }));
      } else if (event.kind === 'damage') {
        for (const harm of event.harms ?? []) {
          const value = Math.max(0, Number(harm.value ?? 0));
          list.push(packAction(ACTION_HURT, 'hurt', {
            source: 1,
            type: 1,
            targetUid: harm.aimId,
            delHp: -value,
            isCritical: false,
            tid: open?.skillTid ?? 0,
            finalHp: Number(harm.hp ?? 0),
            sourceUid: harm.srcId,
            realValue: value,
            hurtType: 1
          }));
        }
      } else if (event.kind === 'heal') {
        const value = Number(event.actualHeal ?? event.value ?? 0);
        if (value > 0) {
          list.push(packAction(ACTION_RECOVER, 'recover', {
            targetUid: event.aimId,
            value,
            finalHp: Number(event.hp ?? event.newHp ?? 0),
            sourceUid: Number(event.srcId ?? 0)
          }));
        }
      } else if (event.kind === 'shield') {
        list.push(packAction(ACTION_UPDATE_ATTR, 'updateAttr', {
          heroUid: event.aimId,
          fightAttrList: [{ type: ATTR_SHIELD, value: Number(event.shield ?? 0) }]
        }));
      } else if (event.kind === 'anger-sync') {
        for (const attr of event.attrList ?? []) {
          // FightAttrType 67 is the anger channel the triple match client reads
          // from pb_fat_attr_sync; the anger action carries it directly.
          if (Number(attr.attrType) !== 67) continue;
          list.push(packAction(ACTION_UPDATE_ANGER, 'updateAnger', {
            targetUid: attr.aimId,
            value: Number(attr.attrValue ?? 0)
          }));
        }
      } else if (event.kind === 'death') {
        list.push(packAction(ACTION_DEAD, 'dead', { uid: event.aimId }));
      } else if (event.kind === 'round-end') {
        closeAction();
        list.push(packAction(ACTION_ROUND_END, 'roundEnd', { win_team: 0 }));
      }
    }
    closeAction();
    list.push(packAction(ACTION_FIGHT_END, 'fightEnd', { fightResult: Number(simulation.result) }));
    return list;
  }

  function runSimulation(redFighters, blueFighters, maxRounds, seed) {
    const engineUnit = fighter => ({
      id: fighter.uid,
      role: fighter.tid,
      profession: fighter.profession,
      loc: fighter.loc,
      abilityId: 0,
      activeAbilityId: 0,
      maxHp: fighter.attributes.hp,
      attack: fighter.attributes.atk,
      defense: fighter.attributes.def,
      // TripleMatchFightTable has no per fighter speed column; Type.default_speed
      // is the playback speed. A constant combat speed keeps the turn order
      // deterministic on loc/id.
      speed: 100,
      initialEnergy: FIGHT_INITIAL_ENERGY,
      skills: []
    });
    return simulateBattle({
      attackers: redFighters.map(engineUnit),
      defenders: blueFighters.map(engineUnit),
      seed,
      maxRounds
    });
  }

  function persistedFight(db, roleId, fightUid) {
    const row = db.prepare('SELECT * FROM trimatch_fight WHERE role_id=? AND fight_uid=?').get(roleId, fightUid);
    if (!row) fail(CODE_STATE, 'Triple match fight is missing: ' + fightUid);
    return row;
  }

  function storedActions(db, roleId, fightUid) {
    return db.prepare('SELECT payload FROM trimatch_fight_action WHERE role_id=? AND fight_uid=? ORDER BY seq').all(roleId, fightUid)
      .map(row => Buffer.from(row.payload));
  }

  function writeActions(db, roleId, fightUid, actions) {
    db.prepare('DELETE FROM trimatch_fight_action WHERE role_id=? AND fight_uid=?').run(roleId, fightUid);
    const insert = db.prepare('INSERT INTO trimatch_fight_action VALUES (?,?,?,?,?)');
    actions.forEach((payload, index) => {
      insert.run(roleId, fightUid, index + 1, actionTypeOf(payload), payload);
    });
  }

  const actionTypeOf = payload => Number(codec.unpack('action', payload).actionType ?? 0);

  function fightStateOf(row) {
    const redTeams = JSON.parse(row.red_team_json);
    const blueTeams = JSON.parse(row.blue_team_json);
    return { row, redTeams, blueTeams };
  }

  function responseOf(row, actions) {
    const { redTeams, blueTeams } = fightStateOf(row);
    return codec.pack('pb_triple_match_fight_response', {
      id: String(row.fight_uid),
      tid: String(row.fight_tid),
      type: Number(row.fight_type),
      red_role_id: String(row.atk_role_id),
      blue_role_id: String(row.def_role_id),
      map: { tile_list: JSON.parse(row.board_json) },
      atk_power: row.atk_power,
      def_power: row.def_power,
      action_list: actions.map(payload => payload),
      round_id: String(row.round_id),
      phase_id: String(row.phase_id),
      remaining_ms: Number(row.remaining_ms),
      is_pve: Number(row.is_pve) === 1,
      red_teams: redTeams,
      blue_teams: blueTeams
    });
  }

  // Builds (or rebuilds) one fight attempt: board, both line-ups, the real
  // battle engine simulation and the report actions derived from it.
  function planAttempt(model, db, roleId, { fightTid, defRoleId, attempt, fightUid }) {
    const { row, typeRow } = typeRowOf(fightTid);
    ensureRoleState(model, db, tables, roleId, now());
    const lineupType = Number(row.lineup);
    const redFighters = playerFighters(model, db, roleId, lineupType);
    const blueFighters = enemyFighters(row);
    const seed = hashSeed(roleId, fightTid, attempt);
    const { tiles } = boardTiles(row, seed);
    const atkPower = redFighters.reduce((sum, fighter) => sum + fighter.power, 0);
    const defPower = blueFighters.reduce((sum, fighter) => sum + fighter.power, 0);
    const maxRounds = Math.max(1, Math.min(100, Number(typeRow.max_round ?? 15)));
    const simulation = runSimulation(redFighters, blueFighters, maxRounds, seed);
    const redTeams = teamList(redFighters, 1);
    const blueTeams = teamList(blueFighters, 1);
    const actions = reportActions({
      fightType: Number(row.type),
      fightTid: Number(fightTid),
      atkRoleId: roleId,
      defRoleId,
      atkPower,
      defPower,
      redTeams,
      blueTeams
    }, simulation);
    const isPve = !Boolean(typeRow.need_countdown);
    return {
      row, typeRow, tiles, simulation, actions, redTeams, blueTeams,
      isPve,
      defRoleId,
      atkPower, defPower,
      remainingMs: isPve ? 0 : Math.max(0, Number(tables.fightConst?.op_timeout ?? 15) * 1000),
      roundId: 1,
      phaseId: 1,
      attempt,
      fightUid,
      fightScene: Number(row.fight_scene ?? 0)
    };
  }

  function storePlan(db, roleId, plan, { created, status }) {
    const updatedAt = isoSeconds(now());
    const insert = db.prepare(`INSERT INTO trimatch_fight
      (role_id, fight_uid, fight_tid, fight_type, is_pve, lineup_type, board_tid, board_json, red_team_json,
       blue_team_json, atk_power, def_power, atk_role_id, def_role_id, result, attempt, round_id, phase_id,
       remaining_ms, status, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(role_id, fight_uid) DO UPDATE SET
        fight_tid=excluded.fight_tid, fight_type=excluded.fight_type, is_pve=excluded.is_pve,
        lineup_type=excluded.lineup_type, board_tid=excluded.board_tid, board_json=excluded.board_json,
        red_team_json=excluded.red_team_json, blue_team_json=excluded.blue_team_json,
        atk_power=excluded.atk_power, def_power=excluded.def_power, atk_role_id=excluded.atk_role_id,
        def_role_id=excluded.def_role_id, result=excluded.result, attempt=excluded.attempt,
        round_id=excluded.round_id, phase_id=excluded.phase_id, remaining_ms=excluded.remaining_ms,
        status=excluded.status, updated_at=excluded.updated_at`);
    insert.run(
      roleId, plan.fightUid, Number(plan.row.tid), Number(plan.row.type), plan.isPve ? 1 : 0,
      Number(plan.row.lineup), Number(plan.row.board), JSON.stringify(plan.tiles),
      JSON.stringify(plan.redTeams), JSON.stringify(plan.blueTeams),
      String(plan.atkPower), String(plan.defPower), roleId, plan.defRoleId ?? 0,
      Number(plan.simulation.result), plan.attempt, plan.roundId, plan.phaseId,
      plan.remainingMs, status, created, updatedAt
    );
    writeActions(db, roleId, plan.fightUid, plan.actions);
  }

  function nextFightUid(db, roleId) {
    const row = db.prepare('SELECT COALESCE(MAX(fight_uid), 0) AS uid FROM trimatch_fight WHERE role_id=?').get(roleId);
    return Number(row?.uid ?? 0) + 1;
  }

  // 115001: open a fight of the configured fight table row. The result and the
  // report come from a real battle engine run over the shipped line-ups.
  function startFight(model, db, input) {
    const roleId = model.state.roleId;
    const fightTid = integer(input?.fight_tid, 1, Number.MAX_SAFE_INTEGER, 'Invalid triple match fight tid');
    const defRoleId = Number(input?.enemy_id ?? 0);
    if (!Number.isSafeInteger(defRoleId) || defRoleId < 0) fail(CODE_INVALID, 'Invalid triple match enemy id');
    const fightUid = nextFightUid(db, roleId);
    const plan = planAttempt(model, db, roleId, { fightTid, defRoleId, attempt: 1, fightUid });
    storePlan(db, roleId, plan, { created: isoSeconds(now()), status: 'running' });
    // Settlement hooks let the owning activity (triple match tower) advance its
    // progress from this real result instead of a client claim.
    if (typeof hooks.onFightSettled === 'function') {
      hooks.onFightSettled(model, db, {
        fightUid,
        fightTid,
        fightType: Number(plan.row.type),
        result: Number(plan.simulation.result),
        powers: plan.atkPower,
        fighters: plan.redTeams[0].fighters.map(fighter => ({ tid: fighter.tid, star: fighter.star, level: fighter.level }))
      });
    }
    log({
      event: 'trimatch_fight_started', fightUid, fightTid, type: Number(plan.row.type),
      isPve: plan.isPve, fighters: plan.redTeams[0].fighters.length, enemies: plan.blueTeams[0].fighters.length,
      atkPower: plan.atkPower, defPower: plan.defPower, result: Number(plan.simulation.result),
      round: plan.simulation.overRound ?? 0, actions: plan.actions.length
    });
    return {
      value: { fightUid, fightTid, type: Number(plan.row.type), result: Number(plan.simulation.result), actions: plan.actions.length },
      data: responseOf(persistedFight(db, roleId, fightUid), storedActions(db, roleId, fightUid))
    };
  }

  // 115002: record one swap request. The client uses Cast() without a reply, so
  // an empty payload is returned; the board resolution itself is not implemented
  // because the elimination rule has no shipped evidence.
  function swapTile(model, db, input) {
    const roleId = model.state.roleId;
    const fightUid = integer(input?.id, 1, Number.MAX_SAFE_INTEGER, 'Invalid triple match fight id');
    const row = persistedFight(db, roleId, fightUid);
    if (row.status !== 'running') fail(CODE_STATE, 'Triple match fight is not running');
    const x1 = integer(input?.x1, 1, 64, 'Invalid triple match swap coordinate');
    const y1 = integer(input?.y1, 1, 64, 'Invalid triple match swap coordinate');
    const x2 = integer(input?.x2, 1, 64, 'Invalid triple match swap coordinate');
    const y2 = integer(input?.y2, 1, 64, 'Invalid triple match swap coordinate');
    const clientOpId = integer(input?.client_op_id ?? 0, 0, Number.MAX_SAFE_INTEGER, 'Invalid triple match swap id');
    const roundId = Number(input?.round_id ?? 0), phaseId = Number(input?.phase_id ?? 0);
    const board = tables.fightBoards.get(Number(row.board_tid));
    if (!board) fail(CODE_STATE, 'Triple match board configuration is missing: ' + row.board_tid);
    const maxX = Number(board.x_tile), maxY = Number(board.y_tile);
    if (x1 > maxX || x2 > maxX || y1 > maxY || y2 > maxY) fail(CODE_INVALID, 'Triple match swap coordinate is outside the board');
    if (x1 === x2 && y1 === y2) fail(CODE_INVALID, 'Triple match swap does not move a tile');
    if (clientOpId > 0) {
      const existing = db.prepare('SELECT 1 FROM trimatch_fight_op WHERE role_id=? AND fight_uid=? AND client_op_id=?')
        .get(roleId, fightUid, clientOpId);
      if (existing) {
        log({ event: 'trimatch_swap_replayed', fightUid, clientOpId });
        return { value: { fightUid, clientOpId, replayed: true }, data: Buffer.alloc(0) };
      }
    }
    const ops = Number(db.prepare('SELECT COUNT(*) AS total FROM trimatch_fight_op WHERE role_id=? AND fight_uid=?').get(roleId, fightUid)?.total ?? 0);
    if (ops >= MAX_SWAP_OPERATIONS) fail(CODE_STATE, 'Triple match swap operations are exhausted');
    db.prepare('INSERT INTO trimatch_fight_op VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(
      roleId, fightUid, clientOpId, roundId, phaseId, x1, y1, x2, y2, input?.is_auto ? 1 : 0, isoSeconds(now())
    );
    // Fail closed: adjacency, match detection, elimination and the resulting
    // damage are unproven, so the board and the report are left untouched and no
    // 11901 delta is pushed.
    log({ event: 'trimatch_swap_recorded_without_resolution', fightUid, clientOpId, roundId, phaseId, x1, y1, x2, y2, isAuto: Boolean(input?.is_auto) });
    return { value: { fightUid, clientOpId, replayed: false, resolved: false }, data: Buffer.alloc(0) };
  }

  // 115003: rebuild the same fight row from scratch (new board, new simulation).
  function retryFight(model, db, input) {
    const roleId = model.state.roleId;
    const requested = fightIdArgument(input);
    const existing = requested
      ? persistedFight(db, roleId, requested)
      : db.prepare('SELECT * FROM trimatch_fight WHERE role_id=? ORDER BY fight_uid DESC LIMIT 1').get(roleId);
    if (!existing) fail(CODE_STATE, 'Triple match fight is missing');
    if (existing.status === 'given_up') fail(CODE_STATE, 'Triple match fight was given up');
    const attempt = Number(existing.attempt ?? 1) + 1;
    const plan = planAttempt(model, db, roleId, {
      fightTid: Number(existing.fight_tid),
      defRoleId: Number(existing.def_role_id ?? 0),
      attempt,
      fightUid: Number(existing.fight_uid)
    });
    db.prepare('DELETE FROM trimatch_fight_op WHERE role_id=? AND fight_uid=?').run(roleId, plan.fightUid);
    storePlan(db, roleId, plan, { created: existing.created_at, status: 'running' });
    log({ event: 'trimatch_fight_retried', fightUid: plan.fightUid, fightTid: Number(existing.fight_tid), attempt, result: Number(plan.simulation.result) });
    return {
      value: { fightUid: plan.fightUid, attempt, result: Number(plan.simulation.result) },
      data: responseOf(persistedFight(db, roleId, plan.fightUid), storedActions(db, roleId, plan.fightUid))
    };
  }

  // 115004: the client asks for the authoritative operate window. Only the
  // configured per-operation timeout can be served; the board operate phase
  // itself is not modelled.
  function ready(model, db, input) {
    const roleId = model.state.roleId;
    const fightUid = integer(input?.fight_id, 1, Number.MAX_SAFE_INTEGER, 'Invalid triple match fight id');
    const row = persistedFight(db, roleId, fightUid);
    if (row.status !== 'running') fail(CODE_STATE, 'Triple match fight is not running');
    const roundId = integer(input?.round_id ?? row.round_id, 0, Number.MAX_SAFE_INTEGER, 'Invalid triple match round id');
    const phaseId = integer(input?.phase_id ?? row.phase_id, 0, Number.MAX_SAFE_INTEGER, 'Invalid triple match phase id');
    if (roundId !== Number(row.round_id) || phaseId !== Number(row.phase_id)) {
      fail(CODE_STATE, 'Triple match operate phase is out of date');
    }
    log({ event: 'trimatch_fight_ready', fightUid, roundId, phaseId, remainingMs: Number(row.remaining_ms) });
    return {
      value: { fightUid, roundId, phaseId, remainingMs: Number(row.remaining_ms) },
      data: codec.pack('pb_triple_match_fight_ready_rsp', {
        remaining_ms: Number(row.remaining_ms),
        round_id: String(roundId),
        phase_id: String(phaseId)
      })
    };
  }

  // 115005: abandon the fight. The stored result becomes a loss so a later
  // 115006 replay is consistent with the activity outcome.
  function giveUp(model, db, input) {
    const roleId = model.state.roleId;
    const requested = fightIdArgument(input);
    const row = requested
      ? persistedFight(db, roleId, requested)
      : db.prepare('SELECT * FROM trimatch_fight WHERE role_id=? ORDER BY fight_uid DESC LIMIT 1').get(roleId);
    if (!row) fail(CODE_STATE, 'Triple match fight is missing');
    if (row.status === 'given_up') {
      log({ event: 'trimatch_fight_giveup_replayed', fightUid: Number(row.fight_uid) });
      return { value: { fightUid: Number(row.fight_uid), result: BATTLE_RESULT.LOSS }, data: encodeEtfIntegerTuple([]) };
    }
    db.prepare('UPDATE trimatch_fight SET status=?, result=?, updated_at=? WHERE role_id=? AND fight_uid=?')
      .run('given_up', BATTLE_RESULT.LOSS, isoSeconds(now()), roleId, Number(row.fight_uid));
    log({ event: 'trimatch_fight_given_up', fightUid: Number(row.fight_uid), fightTid: Number(row.fight_tid) });
    return { value: { fightUid: Number(row.fight_uid), result: BATTLE_RESULT.LOSS }, data: encodeEtfIntegerTuple([]) };
  }

  // 115006: replay of the stored report, built from the actions that were
  // produced by the real simulation.
  function getRecord(model, db, input) {
    const roleId = model.state.roleId;
    const requested = fightIdArgument(input);
    const row = requested
      ? persistedFight(db, roleId, requested)
      : db.prepare('SELECT * FROM trimatch_fight WHERE role_id=? ORDER BY fight_uid DESC LIMIT 1').get(roleId);
    if (!row) fail(CODE_STATE, 'Triple match fight is missing');
    const actions = storedActions(db, roleId, Number(row.fight_uid));
    if (!actions.length) fail(CODE_STATE, 'Triple match fight report is missing');
    const created = Math.floor(new Date(row.created_at).getTime() / 1000);
    // A record is served as-is while it is inside the retention window; a stale
    // row fails closed instead of returning a report the activity already closed.
    const ageSeconds = Math.floor(now() / 1000) - created;
    if (Number.isSafeInteger(created) && ageSeconds > REPORT_RETENTION_SECONDS) {
      fail(CODE_STATE, 'Triple match fight report has expired');
    }
    log({ event: 'trimatch_fight_record_read', fightUid: Number(row.fight_uid), actions: actions.length });
    return {
      value: { fightUid: Number(row.fight_uid), actions: actions.length },
      data: codec.pack('pb_triple_match_fight_report', {
        fight_id: String(row.fight_uid),
        fight_tid: String(row.fight_tid),
        fight_type: Number(row.fight_type),
        create_time: String(created),
        expire_time: String(created + REPORT_RETENTION_SECONDS),
        action_list: actions,
        map: { tile_list: JSON.parse(row.board_json) }
      })
    };
  }

  // Retry, giveup and get_record arrive as a bare Erlang term carrying the fight
  // id; an empty or absent payload falls back to the newest fight of the role.
  function fightIdArgument(input) {
    const value = input && typeof input === 'object' && !Array.isArray(input) ? (input.value ?? input) : input;
    const candidate = Array.isArray(value) ? value[0] : value;
    if (candidate === undefined || candidate === null || candidate === '') return null;
    const id = Number(candidate);
    if (!Number.isSafeInteger(id) || id <= 0) return null;
    return id;
  }

  function supports(type) { return SUPPORTED.includes(Number(type)); }

  async function execute(type, input) {
    const command = Number(type);
    if (!SUPPORTED.includes(command)) fail(CODE_INVALID, 'Unsupported triple match fight command');
    return store.transaction((model, db) => {
      ensureTrimatchTables(db);
      ensureFightTables(db);
      if (command === FIGHT_START) return startFight(model, db, input);
      if (command === FIGHT_SWAP) return swapTile(model, db, input);
      if (command === FIGHT_RETRY) return retryFight(model, db, input);
      if (command === FIGHT_READY) return ready(model, db, input);
      if (command === FIGHT_GIVEUP) return giveUp(model, db, input);
      if (command === FIGHT_RECORD) return getRecord(model, db, input);
      fail(CODE_INVALID, 'Unsupported triple match fight command');
    });
  }

  // Read only view used by the tower and PVP services and by the delivery note.
  function state(roleId) {
    return store.inspect(db => {
      ensureTrimatchTables(db);
      ensureFightTables(db);
      return db.prepare('SELECT * FROM trimatch_fight WHERE role_id=? ORDER BY fight_uid').all(roleId).map(row => ({
        fight_uid: Number(row.fight_uid),
        fight_tid: Number(row.fight_tid),
        fight_type: Number(row.fight_type),
        is_pve: Number(row.is_pve) === 1,
        result: Number(row.result),
        attempt: Number(row.attempt),
        status: row.status,
        atk_power: row.atk_power,
        def_power: row.def_power
      }));
    });
  }

  return {
    supports,
    execute,
    state,
    requestSchemas: {
      [FIGHT_START]: 'pb_triple_match_fight_request',
      [FIGHT_SWAP]: 'pb_triple_match_fight_swap_tile_req',
      [FIGHT_READY]: 'pb_triple_match_fight_ready_req'
    }
  };
}

