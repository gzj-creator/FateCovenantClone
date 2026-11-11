import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';

// The captured login fixture starts at role level 9. A new account must not
// inherit that progression, so reset every player-owned login module that the
// client renders before the first tutorial mission.
export const STARTER_ROLE_LEVEL = 1;
export const STARTER_STAMINA = 120;
export const DEFAULT_STARTER_HEROES = Object.freeze([2010101, 2010201]);

function readModule(modules, id) {
  const entry = modules.get(id);
  if (!entry) throw new Error(`Login module ${id} is missing from the account template`);
  return entry;
}

function emptySerialized() {
  return serializedBinary(Buffer.alloc(0));
}

function clearModule(modules, id) {
  const entry = readModule(modules, id);
  modules.set(id, Array.isArray(entry.value) && typeof entry.improper === 'boolean'
    ? { ...entry, value: entry.value.map(emptySerialized) }
    : emptySerialized());
}

function resetHeroes(modules, codec, starterHeroes) {
  const entry = readModule(modules, 10);
  if (!Array.isArray(entry.value) || !entry.value[0]) throw new Error('Hero login module 10 is malformed');
  const current = codec.unpack('pb_hero_info', rawBinary(entry.value[0]));
  const byTid = new Map((current.hero_list ?? []).map(hero => [String(hero.tid), hero]));
  const heroList = starterHeroes.map(tid => {
    const template = byTid.get(String(tid));
    if (!template) throw new Error(`Starter hero ${tid} is missing from the login template`);
    return {
      ...template,
      uid: String(tid),
      tid: String(tid),
      count: 1,
      level: 1,
      star: 0,
      star_progress: 0,
      breakthrough_level: 0,
      relic: [],
      source_point_list: [],
      pendant_select_list: [],
      up_star_high_consume: []
    };
  });
  const cells = (current.cell_list ?? []).map(cell => ({ ...cell, level: 1, break_level: 0 }));
  // HeroDataMgr reads slot 0 as the roster and every following slot as a
  // separate progression container. Keep the template's slot count, but do
  // not let currency, recruitment, handbook, training or extra data from the
  // captured level-9 account survive into a new save.
  const values = entry.value.map(emptySerialized);
  values[0] = serializedBinary(codec.pack('pb_hero_info', { hero_list: heroList, cell_list: cells }));
  modules.set(10, { ...entry, value: values });
  return new Set(heroList.map(hero => String(hero.tid)));
}

function resetLineups(modules, codec, heroTids) {
  const entry = readModule(modules, 9);
  const login = codec.unpack('pb_lineup_login', rawBinary(entry));
  const filterFighters = fighters => (fighters ?? [])
    .filter(fighter => heroTids.has(String(fighter.hero_id)))
    .map((fighter, index) => ({ ...fighter, index: index + 1, equip_ids: [], relic_ids: ['0', '0', '0', '0'] }));
  const filterLineup = lineup => ({
    ...lineup,
    fighter_list: filterFighters(lineup.fighter_list),
    team_list: (lineup.team_list ?? []).map(team => ({
      ...team,
      fighter_list: filterFighters(team.fighter_list),
      lease_fighter_list: []
    })),
    artifact_list: [],
    lease_fighter_list: [],
    pet_list: [],
    elves_list: [],
    lease_pet: [],
    lease_elves: [],
    lease_artifact: []
  });
  const resetRoleLineup = bytes => {
    const roleLineup = codec.unpack('pb_role_lineup', Buffer.from(bytes, 'base64'));
    for (const key of ['pre_lineups', 'pre_lineups_standby']) {
      roleLineup[key] = (roleLineup[key] ?? []).map(preset => ({
        ...preset,
        lineup: filterLineup(preset.lineup)
      }));
    }
    return roleLineup;
  };
  const roleLineup = resetRoleLineup(login.pre_lineup);
  login.pre_lineup = codec.pack('pb_role_lineup', roleLineup).toString('base64');
  if (login.custom_pre_lineup) {
    login.custom_pre_lineup = codec.pack('pb_role_lineup', resetRoleLineup(login.custom_pre_lineup)).toString('base64');
  }
  login.lineups = (login.lineups ?? []).map(bytes => codec.pack('pb_lineup',
    filterLineup(codec.unpack('pb_lineup', Buffer.from(bytes, 'base64')))).toString('base64'));
  login.lineup_hero_libs = [];
  modules.set(9, serializedBinary(codec.pack('pb_lineup_login', login)));
  return roleLineup;
}

function resetResources(modules, codec, nowSeconds) {
  modules.set(5, serializedBinary(codec.pack('pb_currency_data', { res_list: [] })));
  const groups = readModule(modules, 6);
  modules.set(6, {
    ...groups,
    value: groups.value.map(group => Array.isArray(group.value) && typeof group.improper === 'boolean'
      ? { ...group, value: [] }
      : emptySerialized())
  });

  const mission = readModule(modules, 8);
  const values = [...mission.value];
  values[0] = serializedBinary(codec.pack('pb_mission', { mission_id: '0', pass_count: { count: 0 } }));
  values[1] = serializedBinary(codec.pack('pb_role_energy_res', { res: [] }));
  values[2] = serializedBinary(codec.pack('pb_role_energy_res', {
    res: [{ tid: '100012900', num: String(STARTER_STAMINA), produce_time: nowSeconds }]
  }));
  values[3] = serializedBinary(codec.pack('pb_role_energy_res', { res: [] }));
  values[4] = serializedBinary(codec.pack('pb_role_energy_res', { res: [] }));
  modules.set(8, { ...mission, value: values });
}

function resetPermits(modules, codec, nowSeconds) {
  const entry = readModule(modules, 38);
  const openDay = String(Math.floor((nowSeconds + 10800) / 86400));
  const values = entry.value.map(value => {
    try {
      const permit = codec.unpack('pb_permit_data', rawBinary(value));
      permit.permit_list = (permit.permit_list ?? []).map(info => ({
        ...info,
        open_day: openDay,
        levels: [],
        is_pay: false
      }));
      return serializedBinary(codec.pack('pb_permit_data', permit));
    } catch {
      return emptySerialized();
    }
  });
  modules.set(38, { ...entry, value: values });
}

function resetStaleProgress(modules, codec, nowSeconds) {
  // These modules contain account-bound progression rather than structural
  // configuration. Their protobuf shapes differ, and an empty message is valid
  // for both scalar and per-slot containers, so clear every existing slot.
  for (const id of [12, 16, 21, 26, 29, 65, 90]) clearModule(modules, id);
  resetPermits(modules, codec, nowSeconds);
}

/**
 * Returns a login-module map for a genuinely new account. The caller supplies
 * the captured structural template because it still carries every module and
 * schema that the client expects, but none of its player progression survives.
 */
export function createNewAccountModules({ modules, codec, roleName, starter = {}, now = Date.now }) {
  if (!(modules instanceof Map)) throw new TypeError('modules must be a Map');
  if (typeof codec?.pack !== 'function' || typeof codec?.unpack !== 'function') throw new TypeError('codec is required');
  const nowSeconds = Math.floor(Number(now) / 1000);
  if (!Number.isSafeInteger(nowSeconds) || nowSeconds <= 0) throw new TypeError('now must be a valid timestamp');
  const next = new Map(modules);
  const role = codec.unpack('to_client_role_info', rawBinary(readModule(next, 2)));
  role.nick_name = Buffer.from(String(roleName ?? '命运旅者'), 'utf8');
  role.level = STARTER_ROLE_LEVEL;
  role.exp = 0;
  role.create_time = nowSeconds;
  role.level_reward_record = 0;
  role.set_name_times = 0;
  role.figure_simple_info = {
    head_info: { tid: String(starter.defaultHead ?? 105308) },
    frame_info: { tid: String(starter.defaultFrame ?? 200108) },
    default_head: String(starter.defaultHead ?? 105308),
    style_id: '300003',
    rank: 1
  };
  role.figure_have_info = {
    limit_head_list: [], limit_frame_list: [], limit_title_list: [],
    inactive_title_list: [], limit_bubble_list: [],
    stable_head_info: '', stable_frame_info: '', stable_head_red: '', stable_frame_red: ''
  };
  role.res = { changes: [] };
  next.set(2, serializedBinary(codec.pack('to_client_role_info', role)));

  const heroTids = resetHeroes(next, codec, starter.heroes ?? DEFAULT_STARTER_HEROES);
  const lineups = resetResourcesAndLineups(next, codec, heroTids, nowSeconds);
  resetStaleProgress(next, codec, nowSeconds);
  return {
    modules: next,
    rolePb: codec.pack('to_client_role_info', role).toString('base64'),
    lineups
  };
}

function resetResourcesAndLineups(modules, codec, heroTids, nowSeconds) {
  resetResources(modules, codec, nowSeconds);
  return resetLineups(modules, codec, heroTids);
}

export function readStarterConfig(roleTables) {
  const row = roleTables?.FirstCreationAward?.rows?.[0] ?? {};
  const heroes = (row.heroes ?? []).map(entry => Number(Array.isArray(entry) ? entry[0] : entry?.tid)).filter(Number.isSafeInteger);
  return Object.freeze({
    heroes: heroes.length ? heroes : [...DEFAULT_STARTER_HEROES],
    defaultHead: Number(row.default_head ?? 105308),
    defaultFrame: Number(row.default_frame ?? 200108)
  });
}
