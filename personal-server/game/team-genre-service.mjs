import { serializedBinary } from '../protocol/game-codec.mjs';
import { serverDayNumber } from './activity-calendar.mjs';
import { setBit } from './bit-block.mjs';
import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';

const HERO_MODULE_ID = 10;
// HeroDataMgr.ParseLogin decodes the ninth Lua entry as pb_team_genre_role.
const TEAM_GENRE_SLOT = 8;
const CLAIM_TYPE = 'team_genre';
const AWARD_BLOCK_BYTES = 2;

function integer(value, field) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw new GameError(1, `Invalid team genre ${field}`);
  return number;
}

function seconds(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return 0;
  return number > 100000000000 ? Math.floor(number / 1000) : Math.floor(number);
}

function awardTotals(awards) {
  const totals = new Map();
  for (const award of awards) {
    for (const value of award?.award ?? []) {
      const tid = Number(value?.[0]), count = Number(value?.[1]);
      if (!Number.isSafeInteger(tid) || tid <= 0 || !Number.isSafeInteger(count) || count <= 0) {
        throw new GameError(5, 'Invalid team genre reward configuration');
      }
      totals.set(tid, (totals.get(tid) ?? 0) + count);
    }
  }
  return [...totals.entries()];
}

function heroTids(model) {
  const result = new Set();
  for (const hero of model.heroInfo.hero_list ?? []) {
    const tid = Number(hero.tid);
    if (Number.isSafeInteger(tid) && tid > 0 && Number(hero.count ?? 1) > 0) result.add(tid);
  }
  return result;
}

export function calculateTeamGenreProgress(teamRow, ownedHeroTids) {
  const heroes = teamRow?.suggest_hero ?? [];
  const owned = ownedHeroTids instanceof Set ? ownedHeroTids : new Set([...ownedHeroTids].map(Number));
  return heroes.reduce((count, heroTid) => count + (owned.has(Number(heroTid)) ? 1 : 0), 0);
}

function emptyRole() {
  return { genre_list: [] };
}

function readRole(model, codec) {
  const module = new Map(model.state.modules.value).get(HERO_MODULE_ID);
  if (!module || !Array.isArray(module.value)) throw new GameError(5, 'Hero login module is missing');
  const bytes = Buffer.from(module.value[TEAM_GENRE_SLOT]?.value?.data ?? []);
  if (!bytes.length) return emptyRole();
  try {
    const value = codec.unpack('pb_team_genre_role', bytes);
    return { genre_list: Array.isArray(value.genre_list) ? value.genre_list : [] };
  } catch {
    return emptyRole();
  }
}

function writeRole(model, codec, value) {
  const modules = new Map(model.state.modules.value);
  const module = modules.get(HERO_MODULE_ID);
  if (!module || !Array.isArray(module.value)) throw new GameError(5, 'Hero login module is missing');
  while (module.value.length <= TEAM_GENRE_SLOT) module.value.push(serializedBinary(Buffer.alloc(0)));
  module.value[TEAM_GENRE_SLOT] = serializedBinary(codec.pack('pb_team_genre_role', value));
  model.state.modules.value = [...modules];
}

function claimKey(cycleId, typeId, awardId) {
  return `${cycleId}:${typeId}:${awardId}`;
}

function claimedAwards(db, roleId) {
  const result = new Map();
  const rows = db.prepare('SELECT claim_key FROM reward_claims WHERE role_id=? AND claim_type=?').all(roleId, CLAIM_TYPE);
  for (const row of rows) {
    const match = /^(\d+):(\d+):(\d+)$/.exec(String(row.claim_key));
    if (!match) continue;
    const cycleId = Number(match[1]), teamId = Number(match[2]), awardId = Number(match[3]);
    const key = `${cycleId}:${teamId}`;
    if (!result.has(key)) result.set(key, new Set());
    result.get(key).add(awardId);
  }
  return result;
}

function claimedAwardIds(claims, cycle) {
  return new Set([
    ...(claims.get(`${cycle.cycleId}:${cycle.type}`) ?? []),
    ...(claims.get(`${cycle.cycleId}:${cycle.teamId}`) ?? [])
  ]);
}

function previousReceiveAward(previous, typeId, cycleId) {
  const row = (previous.genre_list ?? []).find(value =>
    Number(value.team_id) === typeId && Number(value.cycle_id) === cycleId
  );
  if (!row || row.receive_award === undefined || row.receive_award === null) return Buffer.alloc(AWARD_BLOCK_BYTES);
  const bytes = Buffer.from(row.receive_award, typeof row.receive_award === 'string' ? 'base64' : undefined);
  return Buffer.alloc(AWARD_BLOCK_BYTES).fill(bytes.subarray(0, AWARD_BLOCK_BYTES));
}

function receiveAward(previous, cycle, claims) {
  let bits = previousReceiveAward(previous, cycle.type, cycle.cycleId);
  // Early versions stored claim keys with the strategy-team TID. Keep reading
  // those rows so already-granted rewards immediately render as claimed after
  // the client-shape fix, without granting them again.
  for (const awardId of claimedAwardIds(claims, cycle)) bits = setBit(bits, awardId);
  return bits;
}

function binaryBytes(value) {
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (value?.value instanceof Uint8Array) return Buffer.from(value.value);
  if (value?.value?.type === 'Buffer' && Array.isArray(value.value.data)) return Buffer.from(value.value.data);
  if (Array.isArray(value)) return Buffer.from(value);
  return null;
}

export function createTeamGenreService({ store, codec, tables, heroTables, calendar, now = Date.now }) {
  function atSeconds() { return seconds(now()); }

  function rules() {
    const split = Number([...heroTables.TeamGenreConst?.values() ?? []][0]?.rule_time_split ?? 0);
    // TeamGenreUtil.CheckIsNewGenreLogic selects against the server's opening
    // timestamp, not the player's current login time.
    const openedAt = seconds(calendar?.serverOpenedAt ?? store.serverOpenedAt);
    const useNew = !split || openedAt >= split;
    return {
      useNew,
      cycles: useNew ? heroTables.TeamGenreCycle : heroTables.TeamGenreCycleOld,
      awards: useNew ? heroTables.TeamGenreAward : heroTables.TeamGenreAwardOld,
      cycleName: useNew ? 'TeamGenreCycle' : 'TeamGenreCycleOld',
      awardName: useNew ? 'TeamGenreAward' : 'TeamGenreAwardOld'
    };
  }

  function teamRowFor(cycle) {
    const teamId = Number(cycle?.cycle_team);
    return heroTables.StrategyTeamGenre?.get(teamId) ?? heroTables.TeamGenre?.get(teamId) ?? null;
  }

  function selectCurrentCycle(typeValue) {
    const type = integer(typeValue, 'type');
    const active = rules();
    if (!active.cycles) throw new GameError(5, `Missing ${active.cycleName}`);
    const openedAt = Number(calendar?.serverOpenedAt ?? store.serverOpenedAt);
    const day = Math.max(1, serverDayNumber(openedAt, atSeconds()));
    const candidates = [...active.cycles.values()]
      .filter(row => Number(row.type) === type && Number(row.unlock_open_day) <= day)
      .filter(row => teamRowFor(row))
      .sort((left, right) => Number(left.unlock_open_day) - Number(right.unlock_open_day) || Number(left.tid) - Number(right.tid));
    const selected = candidates.at(-1);
    if (!selected) throw new GameError(5, 'Team genre cycle is not open');
    return {
      type,
      cycleId: Number(selected.tid),
      teamId: Number(selected.cycle_team),
      cycle: selected,
      team: teamRowFor(selected)
    };
  }

  function currentCycles() {
    const active = rules();
    const types = new Set();
    for (const row of heroTables.TeamGenreType?.values() ?? []) {
      if (!row.main_genre) continue;
      const type = Number(row.tid);
      if ([...active.cycles?.values() ?? []].some(cycle => Number(cycle.type) === type)) types.add(type);
    }
    const result = [];
    for (const type of [...types].sort((left, right) => left - right)) {
      try { result.push(selectCurrentCycle(type)); } catch (error) {
        if (!(error instanceof GameError) || error.code !== 5) throw error;
      }
    }
    return result;
  }

  function configuredAwards() {
    return [...(rules().awards?.values() ?? [])].sort((left, right) => Number(left.tid) - Number(right.tid));
  }

  function buildRole(model, db, previous = readRole(model, codec)) {
    const claims = claimedAwards(db, model.state.roleId);
    return {
      genre_list: currentCycles().map(cycle => ({
        // Despite its name, the client calls GetCycleTid(team_id), so this
        // field is the main genre type TID (51..59), not the lineup-team TID.
        team_id: cycle.type,
        cycle_id: cycle.cycleId,
        receive_award: receiveAward(previous, cycle, claims)
      }))
    };
  }

  function ensureLoginState() {
    return store.transaction((model, db) => {
      const previous = readRole(model, codec);
      const value = buildRole(model, db, previous);
      writeRole(model, codec, value);
      return {
        genreCount: value.genre_list.length,
        claimedCount: [...claimedAwards(db, model.state.roleId).values()].reduce((sum, set) => sum + set.size, 0)
      };
    });
  }

  function claimCycle(model, db, cycle, awardRows) {
    if (!awardRows.length) throw new GameError(310, 'Reward already claimed');
    const created = new Date(now()).toISOString();
    const insert = db.prepare('INSERT INTO reward_claims VALUES (?,?,?,?)');
    for (const award of awardRows) {
      insert.run(model.state.roleId, CLAIM_TYPE, claimKey(cycle.cycleId, cycle.type, Number(award.tid)), created);
    }
    const granted = grantResources(model, awardTotals(awardRows), tables, { codec });
    const previous = readRole(model, codec);
    const role = buildRole(model, db, previous);
    writeRole(model, codec, role);
    return { granted, role, team: role.genre_list.find(row => Number(row.team_id) === cycle.type && Number(row.cycle_id) === cycle.cycleId) };
  }

  function quickClaim(typeValue) {
    const type = integer(typeValue, 'type');
    return store.transaction((model, db) => {
      const cycle = selectCurrentCycle(type);
      const progress = calculateTeamGenreProgress(cycle.team, heroTids(model));
      const claims = claimedAwardIds(claimedAwards(db, model.state.roleId), cycle);
      const pending = configuredAwards().filter(award => Number(award.tid) <= progress && !claims.has(Number(award.tid)));
      const result = claimCycle(model, db, cycle, pending);
      return {
        value: { type, teamTid: cycle.teamId, cycleTid: cycle.cycleId, progress, awardIds: pending.map(award => Number(award.tid)), changes: result.granted.changes },
        data: codec.pack('pb_team_genre_award_rsp', {
          team: result.team,
          award: { changes: result.granted.changes, is_overflow: false }
        })
      };
    });
  }

  function resolveRequestedCycle(typeId) {
    for (const cycle of currentCycles()) if (cycle.type === typeId) return cycle;
    return selectCurrentCycle(typeId);
  }

  function manualClaim(requestValue) {
    const bytes = binaryBytes(requestValue);
    if (!bytes?.length) throw new GameError(1, 'Invalid team genre award payload');
    let request;
    try { request = codec.unpack('pb_team_genre_award_req', bytes); } catch { throw new GameError(1, 'Invalid team genre award payload'); }
    const teamId = integer(request.team_id, 'team id');
    const awardId = integer(request.award_id, 'award id');
    return store.transaction((model, db) => {
      const cycle = resolveRequestedCycle(teamId);
      const award = configuredAwards().find(row => Number(row.tid) === awardId);
      if (!award) throw new GameError(5, 'Team genre award is not configured');
      const progress = calculateTeamGenreProgress(cycle.team, heroTids(model));
      if (awardId > progress) throw new GameError(5, 'Team genre collection progress is insufficient');
      const claims = claimedAwardIds(claimedAwards(db, model.state.roleId), cycle);
      if (claims.has(awardId)) throw new GameError(310, 'Reward already claimed');
      const result = claimCycle(model, db, cycle, [award]);
      return {
        value: { teamTid: cycle.teamId, cycleTid: cycle.cycleId, type: cycle.type, progress, awardIds: [awardId], changes: result.granted.changes },
        data: codec.pack('pb_res_to_client', { changes: result.granted.changes, is_overflow: false })
      };
    });
  }

  function getInfo() {
    return store.transaction((model, db) => {
      const role = buildRole(model, db);
      writeRole(model, codec, role);
      return { value: { genreCount: role.genre_list.length }, data: codec.pack('pb_team_genre_role', role) };
    });
  }

  function execute(type, payload) {
    if (type === 91401) return manualClaim(payload);
    if (type === 91402) return quickClaim(payload);
    if (type === 91403) return getInfo();
    throw new GameError(1, 'Unsupported team genre command');
  }

  return {
    supports: type => type === 91401 || type === 91402 || type === 91403,
    selectCurrentCycle,
    calculateProgress: (type, model) => calculateTeamGenreProgress(selectCurrentCycle(type).team, heroTids(model)),
    ensureLoginState,
    quickClaim,
    manualClaim,
    getInfo,
    execute
  };
}
