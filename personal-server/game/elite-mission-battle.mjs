import { GameError } from './hero-progression.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readMissionTables } from '../config/mission-tables.mjs';
import { readAttributeTables } from '../config/attribute-tables.mjs';
import { reportBattle } from './mission-fight-service.mjs';
import { configuredAwards, ensureTables, readModule, writeModule } from './elite-mission-service.mjs';
import { consumeResources, grantResources } from './resources.mjs';
import { energyMaxForRole, refreshEnergyResources } from './energy.mjs';
import { decodeBitBlock, encodeBitBlock, hasBit, setBit } from './bit-block.mjs';
import { BATTLE_RESULT } from './battle-engine.mjs';

// Elite mission (精英任务) battles. The client opens the normal FightScene for
// both entries: EliteMissionMgr.AttackMission sends pb_fight_request.req =
// EncodePB('pb_elite_mission_req', { mission_id = <stage tid> }) and
// EliteMissionMgr.AttackBoss sends the same schema with { boss_id = <boss tid> }.
// AttackResult then decodes stm.stm_data as pb_elite_mission_back. The report
// therefore has to carry a replayable action stream (FightCmd 201) and the 207
// settlement has to commit the elite progress, its rewards and the answer bytes
// in one transaction.
const WIN = BATTLE_RESULT.WIN;

// FightTable.Fight rows for elite stages ship as type 6 and elite bosses as
// type 114 (EliteMission.fight = 15000101, Boss.fight = 15900001). Both type
// rows have multi_fight_model = 0, settle_type = 0 and max_round = 15, so they
// are ordinary single fights. pb_fight_report.type selects FightTable.TypeClient
// on the client, so the report has to advertise the same id as the fight row.
const STAGE_REPORT_TYPE = 6;
const BOSS_REPORT_TYPE = 114;
const CLEAR_CLAIM_TYPE = 'elite_mission_clear';
const BOSS_CLAIM_TYPE = 'elite_mission_boss';

function bytesOf(value) {
  if (!value) return Buffer.alloc(0);
  return Buffer.isBuffer(value) ? Buffer.from(value) : Buffer.from(String(value), 'base64');
}

function sameBytes(left, right) {
  return bytesOf(left).equals(bytesOf(right));
}

// pb_elite_mission_req { uint64 mission_id = 1; int32 boss_id = 2 }
// The journey payload (mission_fight_req) reuses the low field numbers for
// chapter_tid/section_idx, so a fight is only treated as an elite fight when the
// elite decode names one target and the journey decode names no mission.
function parseRequest(codec, request) {
  const bytes = bytesOf(request?.req);
  if (!bytes.length) return null;
  let elite;
  try {
    elite = codec.unpack('pb_elite_mission_req', bytes);
  } catch {
    return null;
  }
  const missionId = Number(elite?.mission_id ?? 0), bossId = Number(elite?.boss_id ?? 0);
  if (!Number.isSafeInteger(missionId) || !Number.isSafeInteger(bossId)) return null;
  try {
    if (Number(codec.unpack('mission_fight_req', bytes)?.mission_id ?? 0) > 0) return null;
  } catch {
    return null;
  }
  if (missionId > 0 && bossId > 0) return null;
  if (missionId > 0) return { kind: 'stage', id: missionId };
  if (bossId > 0) return { kind: 'boss', id: bossId };
  return null;
}

export function createEliteMissionBattle({
  store,
  codec,
  tables = readGameTables(),
  missionTables = readMissionTables(),
  attributeTables = readAttributeTables(),
  now = Date.now,
  logger = () => {},
  enemyProvider = null
}) {
  const log = event => { try { logger({ service: 'elite_mission_battle', ...event }); } catch {} };
  let pending = null, lastSettlement = null, fightIds = 0;

  const eliteTable = () => {
    if (!(tables?.EliteMission instanceof Map)) throw new GameError(5, 'Elite mission configuration is unavailable');
    return tables.EliteMission;
  };
  const stageConfig = id => eliteTable().get(Number(id));
  const progressIndex = info => Number(stageConfig(info?.mission_id)?.index ?? 0);
  const progressChapter = info => Number(stageConfig(info?.mission_id)?.belong_chapter ?? 0);

  // EliteMissionTable.Base row 1 owns the challenge price next to the red-dot
  // and boss-power settings of the same screen: cost_item 100012900 (stamina),
  // cost_num 5. The journey tables use the same item through SweepConst, so the
  // elite challenge reuses the ordinary stamina refresh/cap path.
  function staminaCost() {
    const base = tables.Base?.get(1);
    const item = Number(base?.cost_item), amount = Number(base?.cost_num);
    if (!Number.isSafeInteger(item) || item <= 0 || !Number.isSafeInteger(amount) || amount <= 0) {
      throw new GameError(5, 'Elite mission stamina configuration is invalid');
    }
    return [item, amount];
  }

  function assertStamina(model) {
    const refreshed = structuredClone(model);
    refreshEnergyResources(refreshed, { missionTables, now });
    const [item, amount] = staminaCost();
    if (BigInt(refreshed.resources.get(String(item))?.num ?? 0) < BigInt(amount)) {
      throw new GameError(301, 'Insufficient resource');
    }
  }

  function resolveTarget(info, target) {
    if (target.kind === 'boss') {
      const boss = tables.Boss?.get(target.id);
      if (!boss) throw new GameError(5, 'Elite boss configuration is missing');
      const fightTid = Number(boss.fight);
      if (!Number.isSafeInteger(fightTid) || fightTid <= 0) throw new GameError(5, 'Elite boss fight configuration is missing');
      const openChapter = Number(boss.open_chapter ?? 0);
      if (!Number.isSafeInteger(openChapter) || openChapter < 0) throw new GameError(5, 'Elite boss chapter gate is not configured');
      if (openChapter > progressChapter(info)) throw new GameError(5, 'Elite boss is not open');
      return {
        kind: 'boss', row: boss, missionId: target.id, fightTid, reportType: BOSS_REPORT_TYPE,
        awards: configuredAwards(boss, 'Elite boss'), claimType: BOSS_CLAIM_TYPE, claimKey: String(target.id)
      };
    }
    const row = stageConfig(target.id);
    if (!row) throw new GameError(5, 'Elite mission configuration is missing');
    if (!tables.Chapter?.get(Number(row.belong_chapter))) throw new GameError(5, 'Elite mission chapter configuration is missing');
    const targetIndex = Number(row.index);
    if (!Number.isSafeInteger(targetIndex) || targetIndex <= 0) throw new GameError(5, 'Elite mission progression configuration is invalid');
    const currentIndex = progressIndex(info);
    if (currentIndex > 0) {
      // The cursor is the furthest selectable stage (87001 enforces the same
      // rule), so only a cleared stage or its immediate successor may fight.
      if (targetIndex > currentIndex + 1) throw new GameError(5, 'Elite mission is not unlocked');
    } else {
      const firstIndex = Math.min(...[...eliteTable().values()].map(value => Number(value.index)).filter(Number.isSafeInteger));
      if (targetIndex !== firstIndex) throw new GameError(5, 'Elite mission is not unlocked');
    }
    const fightTid = Number(row.fight);
    if (!Number.isSafeInteger(fightTid) || fightTid <= 0) throw new GameError(5, 'Elite mission fight configuration is missing');
    return {
      kind: 'stage', row, missionId: target.id, fightTid, reportType: STAGE_REPORT_TYPE, index: targetIndex,
      awards: configuredAwards(row, 'Elite mission'), claimType: CLEAR_CLAIM_TYPE, claimKey: String(target.id)
    };
  }

  // Evidence gap: the shipped configuration carries no elite enemy team.
  // FightTable.Fight[<fight>].def_team is null in every shipped row (50,630
  // rows) and EliteMission has no enemy field, so the npc line-up is server
  // authoritative data that the client bundle does not contain. The deployment
  // supplies it through enemyProvider(fightTid, row); without it the fight is
  // refused instead of inventing a line-up.
  function resolveEnemies(target) {
    let enemies = null;
    try {
      enemies = enemyProvider ? enemyProvider(target.fightTid, target.row) : null;
    } catch (error) {
      if (error instanceof GameError) throw error;
      throw new GameError(5, 'Elite mission enemy configuration is missing');
    }
    if (!Array.isArray(enemies) || enemies.length === 0 || enemies.length > 6) {
      throw new GameError(5, 'Elite mission enemy configuration is missing');
    }
    const ids = enemies.map(Number);
    if (ids.some(id => !Number.isSafeInteger(id) || id <= 0)) {
      throw new GameError(5, 'Elite mission enemy configuration is missing');
    }
    return ids;
  }

  function missionBack(info, resolved, res) {
    return {
      mission_info: {
        mission_id: String(info.mission_id ?? '0'),
        boss_bin: info.boss_bin ?? Buffer.alloc(0),
        box_award_bin: info.box_award_bin ?? Buffer.alloc(0),
        difficulty: info.difficulty ?? undefined
      },
      res,
      is_boss: resolved?.kind === 'boss',
      boss_tid: resolved?.kind === 'boss' ? resolved.missionId : 0
    };
  }

  function matches(request) {
    try {
      return Boolean(request && parseRequest(codec, request));
    } catch {
      return false;
    }
  }

  function start(request) {
    const target = parseRequest(codec, request);
    if (!target) throw new GameError(1, 'Invalid elite mission fight request');
    const model = store.read();
    const { info } = readModule(model, codec);
    const resolved = resolveTarget(info, target);
    assertStamina(model);
    const enemies = resolveEnemies(resolved);
    const encounter = { mission: { fight: resolved.fightTid }, enemies, tables: missionTables, fallback: null };
    const mission = { missionId: resolved.missionId, bossTid: resolved.kind === 'boss' ? resolved.missionId : 0 };
    const battle = reportBattle(codec, model, mission, request, attributeTables, encounter);
    const { simulation, ...battleReport } = battle;
    const report = {
      id: String(++fightIds),
      tid: String(resolved.fightTid),
      type: resolved.reportType,
      atk_role_id: String(model.state.roleId),
      def_role_id: '0',
      battle_list: [battleReport],
      time: String(Math.floor(now() / 1000)),
      final_result: simulation.result,
      // FightMgr requests pb_fight_settlement_request (207) only when the report
      // is unfinished; progress, stamina and rewards are committed there.
      finish: false,
      req: request.req,
      team_count: 101
    };
    const preview = missionBack(info, resolved, { changes: [], is_overflow: false });
    const stm = { result: simulation.result, stm_data: codec.pack('pb_elite_mission_back', preview), exception: false };
    pending = { ...resolved, result: simulation.result, committed: false };
    lastSettlement = null;
    log({
      event: 'elite_mission_fight_started',
      kind: resolved.kind,
      missionId: resolved.missionId,
      fightTid: resolved.fightTid,
      reportType: report.type,
      previousMissionId: Number(info.mission_id ?? 0),
      settleType: Number(request.stm_type ?? 0),
      requestFightTid: Number(request.fight_tid ?? 0),
      enemyCount: enemies.length,
      attackerCount: battleReport.atk_brief_lineup.team_list[0].fighter_list.length,
      actionCount: battleReport.action_list.length,
      rounds: simulation.overRound,
      result: simulation.result,
      committed: false
    });
    return {
      value: { stm, mission: info, isBoss: resolved.kind === 'boss', bossTid: mission.bossTid },
      data: codec.pack('pb_fight_response', { report, rsp: {}, stm }),
      report
    };
  }

  function claimed(db, roleId, claimType, claimKey) {
    return Boolean(db.prepare('SELECT 1 FROM reward_claims WHERE role_id=? AND claim_type=? AND claim_key=?')
      .get(roleId, claimType, claimKey));
  }

  async function settlement() {
    if (!pending) {
      if (lastSettlement) return lastSettlement;
      throw new GameError(1, 'No pending elite mission settlement');
    }
    if (pending.committed) return lastSettlement;
    const snapshot = readModule(store.read(), codec);
    const expectedMissionId = String(snapshot.info.mission_id ?? '0');
    const expectedBossBin = bytesOf(snapshot.info.boss_bin);
    // BitBlock encoding is async, so the boss bitmap is prepared before the
    // transaction and re-checked against the committed value inside it.
    let nextBossBin = null;
    if (pending.kind === 'boss' && pending.result === WIN && !hasBit(await decodeBitBlock(expectedBossBin), pending.missionId)) {
      nextBossBin = await encodeBitBlock(setBit(await decodeBitBlock(expectedBossBin), pending.missionId));
    }
    const committed = store.transaction((model, db) => {
      ensureTables(db);
      const { info } = readModule(model, codec);
      if (String(info.mission_id ?? '0') !== expectedMissionId || !sameBytes(info.boss_bin, expectedBossBin)) {
        throw new GameError(1, 'Elite mission data changed; retry settlement');
      }
      const [item, amount] = staminaCost();
      refreshEnergyResources(model, { missionTables, now });
      const spent = consumeResources(model, [[item, amount]], 301, {
        codec,
        now,
        energyMax: tid => energyMaxForRole(missionTables, tid, model.role?.level)
      });
      let changes = spent.changes;
      let newlyCleared = false, awarded = false;
      if (pending.result === WIN) {
        if (pending.kind === 'boss' && nextBossBin) info.boss_bin = nextBossBin;
        if (pending.kind === 'stage' && pending.index > progressIndex(info)) {
          info.mission_id = String(pending.missionId);
          newlyCleared = true;
        }
        if (!claimed(db, model.state.roleId, pending.claimType, pending.claimKey)) {
          db.prepare('INSERT INTO reward_claims VALUES (?,?,?,?)').run(
            model.state.roleId, pending.claimType, pending.claimKey,
            new Date(Math.floor(now() / 1000) * 1000).toISOString()
          );
          const reward = grantResources(model, pending.awards, tables);
          changes = [...changes, ...reward.changes];
          awarded = true;
        }
      }
      writeModule(model, codec, info);
      const res = { changes, is_overflow: false };
      const back = missionBack(info, pending, res);
      const stm = { result: pending.result, stm_data: codec.pack('pb_elite_mission_back', back), exception: false };
      const data = codec.pack('pb_fight_settlement_response', { stm });
      return {
        value: { stm, mission: info, isBoss: pending.kind === 'boss', newlyCleared, awarded, changes },
        stm,
        data
      };
    });
    pending.committed = true;
    lastSettlement = { value: committed.value, data: committed.data };
    log({
      event: 'elite_mission_fight_committed',
      kind: pending.kind,
      missionId: pending.missionId,
      result: pending.result,
      newlyCleared: committed.value.newlyCleared,
      awarded: committed.value.awarded,
      changes: committed.value.changes.length
    });
    return lastSettlement;
  }

  function exit() {
    if (pending && !pending.committed) lastSettlement = null;
    if (pending) log({ event: 'elite_mission_fight_exited', kind: pending.kind, missionId: pending.missionId, result: pending.result, committed: pending.committed });
    pending = null;
    lastSettlement = null;
  }

  return {
    matches,
    start,
    settlement,
    exit,
    hasPending: () => Boolean(pending)
  };
}
