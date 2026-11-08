import {
  CODE_STATE, CODE_LIMIT, CODE_INVALID, CODE_INSUFFICIENT, fail, integer, isoSeconds,
  ensureTrimatchTables, ensureRoleState, readSites, writeSite, readHeroStars, writeHeroStar,
  readEquips, writeEquip, takeLineupUid, readIdent, grant, consume, affordable
} from './trimatch-core.mjs';
import {
  heroLevelRow, heroStarRow, heroStarCost, equipLevelRow, equipNextLevelRow, equipCost,
  triMatchCellCount, triMatchMaxPreset
} from '../config/trimatch-tables.mjs';

// BattleTriMatchHeroCmd   112001-112002  hero training and star up
// BattleTriMatchEquipCmd  113001-113003  equipment training and exchange
// BattleTriMatchLineupCmd 114001-114005  preset and playing lineups
const HERO_UP_LV = 112001;
const HERO_UP_STAR = 112002;
const EQUIP_UP = 113001;
const EQUIP_SWAP = 113002;
const EQUIP_MULTIPLE_UP = 113003;
const LINEUP_ADD = 114001;
const LINEUP_EDIT = 114002;
const LINEUP_SET_NAME = 114003;
const LINEUP_DELETE = 114004;
const EDIT_PLAYING_LINEUP = 114005;
const SUPPORTED = [HERO_UP_LV, HERO_UP_STAR, EQUIP_UP, EQUIP_SWAP, EQUIP_MULTIPLE_UP,
  LINEUP_ADD, LINEUP_EDIT, LINEUP_SET_NAME, LINEUP_DELETE, EDIT_PLAYING_LINEUP];

const MAX_UP_LEVEL_TIMES = 200;
const MAX_EQUIP_UP_TIMES = 200;

function teamsOf(lineup) {
  const teams = Array.isArray(lineup?.team_list) ? lineup.team_list : [];
  return teams.map((team) => {
    const teamId = Number(team?.team_id ?? 1);
    if (!Number.isSafeInteger(teamId)) fail(CODE_INVALID, 'Invalid triple match lineup team id');
    const sites = Array.isArray(team?.sites) ? team.sites : [];
    return {
      team_id: teamId,
      sites: sites.map((site) => ({
        site_index: integer(site?.site_index, 1, Number.MAX_SAFE_INTEGER, 'Invalid triple match lineup site'),
        hero_tid: Number(site?.hero_tid ?? 0)
      }))
    };
  });
}

export function createTriMatchService({ store, codec, tables, gameTables, logger = () => {}, now = Date.now }) {
  const log = event => { try { logger(event); } catch {} };
  const cells = triMatchCellCount(tables);
  const maxPreset = triMatchMaxPreset(tables);
  if (!cells) throw new Error('Triple match hero const cell_count is missing');

  function siteData(site) {
    return { index: site.index, hero_tid: site.hero_tid, level_tid: site.level_tid };
  }

  function heroData(tid, star) {
    return { tid, star };
  }

  function equipDataOf(db, roleId) {
    const equips = readEquips(db, roleId);
    const list = [];
    for (const [siteIndex, types] of [...equips.entries()].sort((left, right) => left[0] - right[0])) {
      list.push({
        site_idx: siteIndex,
        equips: [...types.entries()].sort((left, right) => left[0] - right[0]).map(([typeTid, levelTid]) => ({
          equip_type_tid: typeTid,
          level_tid: levelTid
        }))
      });
    }
    return list;
  }

  function lineupRecord(row) {
    let teams = [];
    try { teams = JSON.parse(row.team_list); } catch { teams = []; }
    return {
      uid: Number(row.uid),
      gen_time: Number(row.gen_time ?? 0),
      team_list: Array.isArray(teams) ? teams : [],
      name: row.name ?? ''
    };
  }

  // 112001: raise the trained level of one site. Every step consumes the cost
  // configured on the next Hero.UpLevel row; the break levels are ordinary rows
  // with is_break set, matching the "升级 包含突破" client comment.
  function heroUpLevel(model, db, input) {
    const nowMs = now();
    const siteIdx = integer(input?.site_idx, 1, cells, 'Invalid triple match site index');
    const times = integer(input?.up_lv_times ?? 1, 1, MAX_UP_LEVEL_TIMES, 'Invalid triple match hero level up times');
    const state = ensureRoleState(model, db, tables, model.state.roleId, nowMs);
    const site = state.sites.find(candidate => candidate.index === siteIdx);
    if (!site) fail(CODE_STATE, 'Triple match site is missing');
    if (!site.hero_tid) fail(CODE_STATE, 'Triple match site has no hero');
    let levelTid = site.level_tid;
    const steps = [];
    for (let index = 0; index < times; index += 1) {
      const current = heroLevelRow(tables, levelTid);
      if (!current) fail(CODE_STATE, 'Triple match hero level configuration is missing');
      const nextTid = Number(current.tid) + 1;
      const next = heroLevelRow(tables, nextTid);
      if (!next || Number(next.level) !== Number(current.level) + 1) break;
      steps.push(next);
      levelTid = nextTid;
    }
    if (!steps.length) fail(CODE_LIMIT, 'Triple match hero level is already at the maximum');
    if (!steps.every(row => affordable(model, row.cost_item ?? []))) {
      fail(CODE_INSUFFICIENT, 'Triple match hero level material is insufficient');
    }
    const changes = [];
    for (const row of steps) {
      const result = consume(model, row.cost_item ?? [], codec, nowMs);
      changes.push(...result.changes);
    }
    site.level_tid = levelTid;
    writeSite(db, model.state.roleId, site, nowMs);
    log({ event: 'trimatch_hero_up_level', siteIdx, steps: steps.length, levelTid });
    return {
      value: { siteIdx, level : Number(heroLevelRow(tables, levelTid)?.level ?? 0), steps: steps.length },
      data: codec.pack('pb_battle_tri_match_hero_up_lv_rsp', {
        res: { changes, is_overflow: false },
        change_site_data: siteData(site)
      })
    };
  }

  // 112002: star up one owned hero. The cost is the Hero.UpStar row of the next
  // star; the star level is capped by the configured rows of that hero.
  function heroUpStar(model, db, input) {
    const nowMs = now();
    const heroTid = integer(input?.hero_tid, 1, Number.MAX_SAFE_INTEGER, 'Invalid triple match hero');
    const state = ensureRoleState(model, db, tables, model.state.roleId, nowMs);
    const owned = state.owned.find(hero => hero.tid === heroTid);
    if (!owned) fail(CODE_STATE, 'Triple match hero is not owned');
    const currentStar = state.stars.get(heroTid) ?? 0;
    const nextRow = heroStarRow(tables, heroTid, currentStar + 1);
    if (!nextRow) fail(CODE_LIMIT, 'Triple match hero star is already at the maximum');
    const costs = heroStarCost(nextRow);
    if (!costs.length) fail(CODE_STATE, 'Triple match hero star cost configuration is missing');
    if (!affordable(model, costs)) fail(CODE_INSUFFICIENT, 'Triple match hero chip is insufficient');
    const result = consume(model, costs, codec, nowMs);
    const star = currentStar + 1;
    writeHeroStar(db, model.state.roleId, heroTid, star, nowMs);
    log({ event: 'trimatch_hero_up_star', heroTid, star });
    return {
      value: { heroTid, star },
      data: codec.pack('pb_battle_tri_match_hero_up_star_rsp', {
        res: { changes: result.changes, is_overflow: false },
        change_hero_data: heroData(heroTid, star)
      })
    };
  }

  function equipUpOne(model, db, roleId, siteIndex, equipType, changes, nowMs, { skipUnaffordable = false } = {}) {
    const equips = readEquips(db, roleId);
    const current = equips.get(siteIndex)?.get(equipType);
    if (!current) fail(CODE_STATE, 'Triple match equip is missing');
    const next = equipNextLevelRow(tables, current);
    if (!next) return null;
    const costs = equipCost(next);
    if (!affordable(model, costs)) {
      if (skipUnaffordable) return null;
      fail(CODE_INSUFFICIENT, 'Triple match equip material is insufficient');
    }
    const result = consume(model, costs, codec, nowMs);
    changes.push(...result.changes);
    writeEquip(db, roleId, siteIndex, equipType, Number(next.tid), nowMs);
    return { site_idx: siteIndex, equip_type_tid: equipType, level_tid: Number(next.tid) };
  }

  // 113001: upgrade one equipment type of a site, or every type of the site once
  // when is_one_key is set.
  function equipUp(model, db, input) {
    const nowMs = now();
    const siteIdx = integer(input?.site_idx, 1, cells, 'Invalid triple match site index');
    const oneKey = input?.is_one_key === true;
    const equipType = oneKey ? 0 : integer(input?.equip_type_id, 1, Number.MAX_SAFE_INTEGER, 'Invalid triple match equip type');
    const state = ensureRoleState(model, db, tables, model.state.roleId, nowMs);
    const site = state.sites.find(candidate => candidate.index === siteIdx);
    if (!site) fail(CODE_STATE, 'Triple match site is missing');
    const types = oneKey ? [...tables.equipTypes.keys()] : [equipType];
    if (!oneKey && !tables.equipTypes.has(equipType)) fail(CODE_STATE, 'Triple match equip type configuration is missing');
    const changes = [];
    const changed = [];
    for (const type of types) {
      const result = equipUpOne(model, db, model.state.roleId, siteIdx, type, changes, nowMs, { skipUnaffordable: oneKey });
      if (result) changed.push(result);
    }
    if (!changed.length) fail(CODE_LIMIT, 'Triple match equip is already at the maximum');
    log({ event: 'trimatch_equip_up', siteIdx, oneKey, changed: changed.length });
    return {
      value: { siteIdx, oneKey, changed },
      data: codec.pack('pb_battle_tri_match_equip_up_rsp', {
        res_change: { changes, is_overflow: false },
        change_equips: [
          { site_idx: siteIdx, equips: changed.map(entry => ({ equip_type_tid: entry.equip_type_tid, level_tid: entry.level_tid })) }
        ]
      })
    };
  }

  // 113002: exchange a whole slot or a single equipment type between two slots.
  function equipSwap(model, db, input) {
    const nowMs = now();
    const site1 = integer(input?.site_idx1, 1, cells, 'Invalid triple match equip swap site');
    const site2 = integer(input?.site_idx2, 1, cells, 'Invalid triple match equip swap site');
    const type1 = integer(input?.equip_type_id1 ?? 0, 0, Number.MAX_SAFE_INTEGER, 'Invalid triple match equip type');
    const type2 = integer(input?.equip_type_id2 ?? 0, 0, Number.MAX_SAFE_INTEGER, 'Invalid triple match equip type');
    const state = ensureRoleState(model, db, tables, model.state.roleId, nowMs);
    if (!state.sites.some(site => site.index === site1) || !state.sites.some(site => site.index === site2)) {
      fail(CODE_STATE, 'Triple match site is missing');
    }
    const equips = readEquips(db, model.state.roleId);
    const types1 = equips.get(site1) ?? new Map();
    const types2 = equips.get(site2) ?? new Map();
    if (!type1 && !type2) {
      // Whole slot exchange: every configured type moves between the two slots.
      for (const typeTid of tables.equipTypes.keys()) {
        const left = types1.get(typeTid), right = types2.get(typeTid);
        if (left === undefined || right === undefined) fail(CODE_STATE, 'Triple match equip is missing');
        writeEquip(db, model.state.roleId, site1, typeTid, right, nowMs);
        writeEquip(db, model.state.roleId, site2, typeTid, left, nowMs);
      }
    } else {
      if (!type1 || !type2) fail(CODE_INVALID, 'Triple match equip swap needs both equipment types');
      if (!tables.equipTypes.has(type1) || !tables.equipTypes.has(type2)) fail(CODE_STATE, 'Triple match equip type configuration is missing');
      const left = types1.get(type1), right = types2.get(type2);
      if (left === undefined || right === undefined) fail(CODE_STATE, 'Triple match equip is missing');
      writeEquip(db, model.state.roleId, site1, type1, right, nowMs);
      writeEquip(db, model.state.roleId, site2, type2, left, nowMs);
    }
    const after = readEquips(db, model.state.roleId);
    const changeEquips = [site1, site2].filter((value, index, list) => list.indexOf(value) === index).map((siteIndex) => ({
      site_idx: siteIndex,
      equips: [...(after.get(siteIndex)?.entries() ?? [])].sort((left, right) => left[0] - right[0])
        .map(([equipTypeTid, levelTid]) => ({ equip_type_tid: equipTypeTid, level_tid: levelTid }))
    }));
    log({ event: 'trimatch_equip_swap', site1, site2, type1, type2 });
    return {
      value: { site1, site2, type1, type2 },
      data: codec.pack('pb_battle_tri_match_equip_swap_rsp', { change_equips: changeEquips })
    };
  }

  // 113003: repeated upgrade of every equipment type of one site.
  function equipMultipleUp(model, db, input) {
    const nowMs = now();
    const siteIdx = integer(input?.site_idx, 1, cells, 'Invalid triple match site index');
    const times = integer(input?.times ?? 1, 1, MAX_EQUIP_UP_TIMES, 'Invalid triple match equip up times');
    const state = ensureRoleState(model, db, tables, model.state.roleId, nowMs);
    if (!state.sites.some(site => site.index === siteIdx)) fail(CODE_STATE, 'Triple match site is missing');
    const changes = [];
    const changed = new Map();
    for (let round = 0; round < times; round += 1) {
      let progressed = false;
      for (const typeTid of tables.equipTypes.keys()) {
        const result = equipUpOne(model, db, model.state.roleId, siteIdx, typeTid, changes, nowMs, { skipUnaffordable: true });
        if (result) { changed.set(typeTid, result.level_tid); progressed = true; }
      }
      if (!progressed) break;
    }
    if (!changed.size) fail(CODE_LIMIT, 'Triple match equip is already at the maximum');
    log({ event: 'trimatch_equip_multiple_up', siteIdx, times, changed: changed.size });
    return {
      value: { siteIdx, changed: [...changed.entries()] },
      data: codec.pack('pb_battle_tri_match_equip_multiple_up_rsp', {
        res_change: { changes, is_overflow: false },
        change_equips: [
          { site_idx: siteIdx, equips: [...changed.entries()].sort((left, right) => left[0] - right[0]).map(([equipTypeTid, levelTid]) => ({ equip_type_tid: equipTypeTid, level_tid: levelTid })) }
        ]
      })
    };
  }

  function validateTeams(model, db, teams, { allowEmpty = false } = {}) {
    const owned = new Set(ensureRoleState(model, db, tables, model.state.roleId, now()).owned.map(hero => hero.tid));
    const seenSites = new Set(), seenHeroes = new Set();
    const normalized = teams.map(team => ({
      team_id: team.team_id,
      sites: team.sites.filter(site => site.hero_tid || site.site_index).map((site) => {
        if (site.site_index < 1 || site.site_index > cells) fail(CODE_INVALID, 'Triple match lineup site is out of range');
        if (seenSites.has(site.site_index)) fail(CODE_INVALID, 'Triple match lineup site is duplicated');
        if (!owned.has(site.hero_tid)) fail(CODE_STATE, 'Triple match lineup hero is not owned');
        if (seenHeroes.has(site.hero_tid)) fail(CODE_INVALID, 'Triple match lineup hero is duplicated');
        seenSites.add(site.site_index);
        seenHeroes.add(site.hero_tid);
        return { site_index: site.site_index, hero_tid: site.hero_tid };
      })
    }));
    if (!allowEmpty && !normalized.length) fail(CODE_INVALID, 'Triple match lineup is empty');
    return normalized;
  }

  function lineupAdd(model, db, input) {
    const nowMs = now();
    const teams = validateTeams(model, db, teamsOf(input?.lineup));
    const count = Number(db.prepare('SELECT COUNT(*) AS total FROM trimatch_lineup WHERE role_id=?').get(model.state.roleId)?.total ?? 0);
    if (count >= maxPreset) fail(CODE_LIMIT, 'Triple match lineup preset limit is reached');
    const uid = takeLineupUid(db, model.state.roleId, nowMs);
    const name = String(input?.lineup?.name ?? '').slice(0, 32);
    db.prepare('INSERT INTO trimatch_lineup VALUES (?,?,?,?,?,?)')
      .run(model.state.roleId, uid, Math.floor(nowMs / 1000), name, JSON.stringify(teams), isoSeconds(nowMs));
    log({ event: 'trimatch_lineup_add', uid, teams: teams.length });
    return {
      value: { uid },
      data: codec.pack('pb_battle_tri_match_lineup_add_rsp', {
        change_lineup: { uid, gen_time: Math.floor(nowMs / 1000), team_list: teams, name }
      })
    };
  }

  function lineupEdit(model, db, input) {
    const nowMs = now();
    const uid = integer(input?.lineup?.uid, 1, Number.MAX_SAFE_INTEGER, 'Invalid triple match lineup uid');
    const row = db.prepare('SELECT * FROM trimatch_lineup WHERE role_id=? AND uid=?').get(model.state.roleId, uid);
    if (!row) fail(CODE_STATE, 'Triple match lineup preset is missing');
    const teams = validateTeams(model, db, teamsOf(input?.lineup));
    const name = String(input?.lineup?.name ?? row.name ?? '').slice(0, 32);
    db.prepare('UPDATE trimatch_lineup SET team_list=?, name=?, updated_at=? WHERE role_id=? AND uid=?')
      .run(JSON.stringify(teams), name, isoSeconds(nowMs), model.state.roleId, uid);
    log({ event: 'trimatch_lineup_edit', uid, teams: teams.length });
    return {
      value: { uid },
      data: codec.pack('pb_battle_tri_match_lineup_edit_rsp', {
        change_lineup: { uid, gen_time: Number(row.gen_time ?? 0), team_list: teams, name }
      })
    };
  }

  function lineupSetName(model, db, input) {
    const nowMs = now();
    const uid = integer(input?.uid, 1, Number.MAX_SAFE_INTEGER, 'Invalid triple match lineup uid');
    const name = String(input?.name ?? '').trim();
    const min = Number(tables.lineupConst?.preset_min_length ?? 1);
    const max = Number(tables.lineupConst?.preset_max_length ?? 6);
    if (name.length < min || name.length > max) fail(CODE_INVALID, 'Triple match lineup name length is invalid');
    const row = db.prepare('SELECT * FROM trimatch_lineup WHERE role_id=? AND uid=?').get(model.state.roleId, uid);
    if (!row) fail(CODE_STATE, 'Triple match lineup preset is missing');
    db.prepare('UPDATE trimatch_lineup SET name=?, updated_at=? WHERE role_id=? AND uid=?').run(name, isoSeconds(nowMs), model.state.roleId, uid);
    const record = lineupRecord(row);
    record.name = name;
    log({ event: 'trimatch_lineup_set_name', uid, name });
    return { value: { uid, name }, data: codec.pack('pb_battle_tri_match_lineup_set_name_rsp', { change_lineup: record }) };
  }

  function lineupDelete(model, db, input) {
    const uid = integer(input?.uid, 1, Number.MAX_SAFE_INTEGER, 'Invalid triple match lineup uid');
    const result = db.prepare('DELETE FROM trimatch_lineup WHERE role_id=? AND uid=?').run(model.state.roleId, uid);
    if (!result.changes) fail(CODE_STATE, 'Triple match lineup preset is missing');
    log({ event: 'trimatch_lineup_delete', uid });
    return { value: { uid }, data: codec.pack('pb_battle_tri_match_lineup_delete_rsp', {}) };
  }

  // 114005: the deployment used by the triple match fights.
  function editPlayingLineup(model, db, input) {
    const nowMs = now();
    const lineup = input?.lineup ?? input;
    const type = integer(lineup?.type ?? 1, 1, 99, 'Invalid triple match playing lineup type');
    const teams = validateTeams(model, db, teamsOf(lineup), { allowEmpty: true });
    if (!teams.length || !teams.some(team => team.sites.length)) fail(CODE_INVALID, 'Triple match playing lineup is empty');
    db.prepare(`INSERT INTO trimatch_playing_lineup (role_id, lineup_type, team_list, updated_at) VALUES (?,?,?,?)
      ON CONFLICT(role_id, lineup_type) DO UPDATE SET team_list=excluded.team_list, updated_at=excluded.updated_at`)
      .run(model.state.roleId, type, JSON.stringify(teams), isoSeconds(nowMs));
    log({ event: 'trimatch_playing_lineup_edit', type, sites: teams.reduce((total, team) => total + team.sites.length, 0) });
    return {
      value: { type },
      data: codec.pack('pb_battle_tri_match_edit_playing_lineup_rsp', {
        lineup: { type, team_list: teams }
      })
    };
  }

  function supports(type) { return SUPPORTED.includes(Number(type)); }

  async function execute(type, input) {
    const command = Number(type);
    if (!SUPPORTED.includes(command)) fail(CODE_INVALID, 'Unsupported triple match command');
    return store.transaction((model, db) => {
      ensureTrimatchTables(db);
      if (command === HERO_UP_LV) return heroUpLevel(model, db, input);
      if (command === HERO_UP_STAR) return heroUpStar(model, db, input);
      if (command === EQUIP_UP) return equipUp(model, db, input);
      if (command === EQUIP_SWAP) return equipSwap(model, db, input);
      if (command === EQUIP_MULTIPLE_UP) return equipMultipleUp(model, db, input);
      if (command === LINEUP_ADD) return lineupAdd(model, db, input);
      if (command === LINEUP_EDIT) return lineupEdit(model, db, input);
      if (command === LINEUP_SET_NAME) return lineupSetName(model, db, input);
      if (command === LINEUP_DELETE) return lineupDelete(model, db, input);
      if (command === EDIT_PLAYING_LINEUP) return editPlayingLineup(model, db, input);
      fail(CODE_INVALID, 'Unsupported triple match command');
    });
  }

  // Read only snapshot used by the fight, tower and PVP services.
  function snapshot(roleId) {
    return store.inspect((db) => {
      ensureTrimatchTables(db);
      const sites = readSites(db, roleId);
      const stars = readHeroStars(db, roleId);
      const equips = [...readEquips(db, roleId).entries()].map(([siteIndex, types]) => ({
        site_idx: siteIndex,
        equips: [...types.entries()].map(([equip_type_tid, level_tid]) => ({ equip_type_tid, level_tid }))
      }));
      const lineups = db.prepare('SELECT * FROM trimatch_lineup WHERE role_id=? ORDER BY uid').all(roleId).map(lineupRecord);
      const playing = db.prepare('SELECT * FROM trimatch_playing_lineup WHERE role_id=?').all(roleId).map((row) => {
        let teamList = [];
        try { teamList = JSON.parse(row.team_list); } catch { teamList = []; }
        return { type: Number(row.lineup_type), team_list: Array.isArray(teamList) ? teamList : [] };
      });
      return { sites, stars: [...stars.entries()], equips, lineups, playing };
    });
  }

  return { supports, execute, snapshot, requestSchemas: {
    [HERO_UP_LV]: 'pb_battle_tri_match_hero_up_lv_req',
    [HERO_UP_STAR]: 'pb_battle_tri_match_hero_up_star_req',
    [EQUIP_UP]: 'pb_battle_tri_match_equip_up_req',
    [EQUIP_SWAP]: 'pb_battle_tri_match_equip_swap_req',
    [EQUIP_MULTIPLE_UP]: 'pb_battle_tri_match_equip_multiple_up_req',
    [LINEUP_ADD]: 'pb_battle_tri_match_lineup_add_req',
    [LINEUP_EDIT]: 'pb_battle_tri_match_lineup_edit_req',
    [LINEUP_SET_NAME]: 'pb_battle_tri_match_lineup_set_name_req',
    [LINEUP_DELETE]: 'pb_battle_tri_match_lineup_delete_req',
    [EDIT_PLAYING_LINEUP]: 'pb_battle_tri_match_edit_playing_lineup_req'
  } };
}
