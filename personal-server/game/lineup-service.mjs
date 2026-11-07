import { GameError } from './hero-progression.mjs';
import { encodeEtfInteger, rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { readLineupTables } from '../config/lineup-tables.mjs';
const fail = (code, message) => { throw new GameError(code, message); };

const EDIT_PLAY_LINEUP = 208;
const EDIT_PRE_LINEUP = 209;
const SET_PRE_LINEUP_INDEX = 210;
const CUSTOM_PRE_LINEUP_NEW = 214;
const CUSTOM_PRE_LINEUP_SET_NAME = 215;
const CUSTOM_PRE_LINEUP_SET = 216;
const CUSTOM_PRE_LINEUP_DELETE = 217;
const LINEUP_EXCHANGE_VERSION = 218;
const supportedTypes = [EDIT_PLAY_LINEUP, EDIT_PRE_LINEUP, SET_PRE_LINEUP_INDEX, CUSTOM_PRE_LINEUP_NEW,
  CUSTOM_PRE_LINEUP_SET_NAME, CUSTOM_PRE_LINEUP_SET, CUSTOM_PRE_LINEUP_DELETE, LINEUP_EXCHANGE_VERSION];
// LineupCmd encodes 210, 217 and 218 as Erlang terms; the remaining commands carry protobuf payloads.
const etfTypes = new Set([SET_PRE_LINEUP_INDEX, CUSTOM_PRE_LINEUP_DELETE, LINEUP_EXCHANGE_VERSION]);
const requestSchemas = new Map([
  [EDIT_PLAY_LINEUP, 'pb_edit_lineup_req'],
  [EDIT_PRE_LINEUP, 'pb_edit_pre_lineup_req'],
  [CUSTOM_PRE_LINEUP_NEW, 'pb_custom_pre_lineup_list'],
  [CUSTOM_PRE_LINEUP_SET_NAME, 'pb_custom_lineup_set_name_req'],
  [CUSTOM_PRE_LINEUP_SET, 'pb_custom_lineup_set_req']
]);
// LineupTable.TemplateConst: max_lineup=20, create_lineup_index=0, main_lineup_index=-1.
// The -1 entry mirrors the current preset and is part of the twenty entries.
const CUSTOM_MAIN_INDEX = -1;
const CUSTOM_FIRST_INDEX = 0;
const CUSTOM_MAX_ENTRIES = 20;
// LineupTable.Type.team_count reaches five teams; the client limit for custom names is not recovered.
const MAX_TEAMS = 5;
const MAX_NAME_LENGTH = 20;

// The ordinary preset editor sends handle_types=[0]. Apply that wildcard to
// every configured single-team lineup whose LineupTable.Type row is
// same_with_pre=true. Multi-team rows need their own team-source mapping and
// are deliberately left untouched until that mapping is evidenced.
function sharedPreSingleTeamTypes(lineupTables) {
  return new Set([...lineupTables.Type.values()]
    .filter(row => row.same_with_pre === true && Number(row.team_count) === 1)
    .map(row => Number(row.tid)));
}

// LineupTable.Type.same_with_custom marks the play lineup types that may point
// at a custom preset through pb_lineup.custom_lineup_index.
function customPresetTypes(lineupTables) {
  return new Set([...lineupTables.Type.values()]
    .filter(row => row.same_with_custom === true)
    .map(row => Number(row.tid)));
}

function currentPreset(model) {
  return model.lineups.pre_lineups.find(pre => pre.index === (model.lineups.cur_pre_index || 1));
}

// ETF integers decode to plain numbers; a single-element tuple or list wraps one.
function etfScalar(value) {
  if (Array.isArray(value)) return value.length === 1 ? etfScalar(value[0]) : undefined;
  if (value && typeof value === 'object' && Array.isArray(value.value)) return value.value.length === 1 ? etfScalar(value.value[0]) : undefined;
  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'bigint') return value;
  return undefined;
}

function integerValue(value) {
  if (typeof value === 'number') return Number.isSafeInteger(value) ? value : null;
  if (typeof value === 'bigint') return value >= BigInt(Number.MIN_SAFE_INTEGER) && value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : null;
  if (typeof value === 'string' && /^-?\d+$/.test(value.trim())) {
    const parsed = Number(value.trim());
    return Number.isSafeInteger(parsed) ? parsed : null;
  }
  return null;
}

function validateTeam(model, team) {
  if (!team || !Number.isInteger(team.team_id) || team.team_id < 1) fail(51558, 'Invalid team');
  const cells = new Set(), positions = new Set(), heroes = new Set();
  for (const fighter of team.fighter_list ?? []) {
    const uid = String(fighter.hero_id);
    if (!model.heroInfo.hero_list.some(hero => String(hero.uid) === uid)) fail(3001, 'Hero does not exist');
    if (!model.heroInfo.cell_list.some(cell => cell.index === fighter.index)) fail(3029, 'Hero cell does not exist');
    if (!Number.isInteger(fighter.loc) || fighter.loc < 1 || fighter.loc > 6) fail(51551, 'Invalid fighter position');
    if (positions.has(fighter.loc) || cells.has(fighter.index)) fail(51554, 'Duplicate position or cell');
    if (heroes.has(uid)) fail(51555, 'Duplicate hero');
    positions.add(fighter.loc); cells.add(fighter.index); heroes.add(uid);
  }
  if (heroes.size > 6) fail(51503, 'Too many fighters');
}
function syncHeroes(model) {
  const current = currentPreset(model);
  if (!current) fail(51553, 'Current preset does not exist');
  const changed = [];
  for (const fighter of current.lineup.fighter_list ?? []) {
    const hero = model.heroInfo.hero_list.find(hero => String(hero.uid) === String(fighter.hero_id));
    const cell = model.heroInfo.cell_list.find(cell => cell.index === fighter.index);
    if (hero.level !== cell.level || (hero.breakthrough_level ?? 0) !== (cell.break_level ?? 0)) {
      hero.level = cell.level; hero.breakthrough_level = cell.break_level ?? 0; changed.push(hero);
    }
  }
  return changed;
}

function copyCurrentPreset(model, input, sharedPreTypes) {
  const current = currentPreset(model);
  if (!current) fail(51553, 'Current preset does not exist');
  const handles = [...new Set(input.handle_types ?? [])];
  const wildcard = handles.some(handle => String(handle) === '0');
  const targets = new Set();
  for (const handle of handles) {
    if (String(handle) === '0') continue;
    const lineup = model.playLineups.find(candidate => String(candidate.type) === String(handle));
    if (!lineup) fail(51552, 'Unknown lineup copy target');
    targets.add(lineup);
  }
  if (wildcard) {
    for (const lineup of model.playLineups) {
      if (sharedPreTypes.has(Number(lineup.type))) targets.add(lineup);
    }
  }
  const copy = [];
  for (const lineup of targets) {
    lineup.team_list = [structuredClone(current.lineup)];
    copy.push(lineup);
  }
  return copy;
}

export function createLineupService({ store, codec, lineupTables = readLineupTables() }) {
  const sharedPreTypes = sharedPreSingleTeamTypes(lineupTables);
  const customTypes = customPresetTypes(lineupTables);

  function snapshotCustomRole(model) {
    const module = new Map(model.state.modules.value).get(9);
    if (!module) return null;
    const login = codec.unpack('pb_lineup_login', rawBinary(module));
    if (!login.custom_pre_lineup) return null;
    return codec.unpack('pb_custom_lineup_role', Buffer.from(login.custom_pre_lineup, 'base64'));
  }

  // The lineups table is authoritative. Rows written before this version only
  // carry the list inside login module 9, so those are adopted on first touch.
  function readCustomState(model) {
    if (Array.isArray(model.lineups.custom_pre_lineups)) {
      return { presets: structuredClone(model.lineups.custom_pre_lineups),
        curIndex: model.lineups.custom_cur_index, adopted: false };
    }
    const snapshot = snapshotCustomRole(model);
    const presets = (snapshot?.custom_pre_lineups ?? [])
      .filter(item => Number(item.index) !== CUSTOM_MAIN_INDEX)
      .map(item => structuredClone(item));
    // The captured role never carried cur_index, so an absent value stays absent.
    return { presets, curIndex: snapshot?.cur_index, adopted: true };
  }

  // The -1 entry always mirrors the currently selected preset.
  function mainCustomPreset(model) {
    const current = currentPreset(model);
    if (!current) fail(51553, 'Current preset does not exist');
    return { index: String(CUSTOM_MAIN_INDEX), type: '1', name: '', lineup_type_list: [],
      lineup: { type: 1, team_list: [structuredClone(current.lineup)], custom_attr: [] } };
  }

  function customPreLineupList(model, presets = readCustomState(model).presets) {
    return { custom_pre_lineups: [mainCustomPreset(model), ...structuredClone(presets)] };
  }

  function writeCustomState(model, presets, curIndex) {
    const ordered = structuredClone(presets).sort((left, right) => Number(left.index) - Number(right.index));
    model.lineups.custom_pre_lineups = ordered;
    if (curIndex === undefined || curIndex === null) delete model.lineups.custom_cur_index;
    else model.lineups.custom_cur_index = String(curIndex);
    const modules = new Map(model.state.modules.value);
    const module = modules.get(9);
    if (!module) return;
    const login = codec.unpack('pb_lineup_login', rawBinary(module));
    const role = { custom_pre_lineups: [mainCustomPreset(model), ...ordered] };
    if (curIndex !== undefined && curIndex !== null) role.cur_index = String(curIndex);
    login.custom_pre_lineup = codec.pack('pb_custom_lineup_role', role).toString('base64');
    modules.set(9, serializedBinary(codec.pack('pb_lineup_login', login)));
    model.state.modules.value = [...modules];
  }

  // uint64 index fields omit their default, so a missing protobuf index means
  // the first custom preset (LineupTable.TemplateConst.create_lineup_index=0).
  function customIndexOrFail(value, { main = false, allowDefault = false } = {}) {
    const index = value === undefined && allowDefault ? 0 : integerValue(value);
    if (index === null) fail(1, 'Invalid preset index');
    if (!main && index === CUSTOM_MAIN_INDEX) fail(51553, 'Main preset cannot be edited');
    if (!main && index < CUSTOM_FIRST_INDEX) fail(51553, 'Unknown preset');
    return index;
  }

  function presetName(value) {
    if (value === undefined || value === null) return '';
    if (typeof value !== 'string') fail(1, 'Invalid preset name');
    const name = value.trim();
    if ([...name].length > MAX_NAME_LENGTH) fail(51561, 'Preset name is too long');
    return name;
  }

  function assertUniqueName(presets, name, exceptIndex) {
    if (!name) return;
    for (const preset of presets) {
      if (Number(preset.index) === Number(exceptIndex)) continue;
      if (String(preset.name ?? '').trim() === name) fail(51560, 'Duplicate preset name');
    }
  }

  function prepareCustomLineup(model, lineup, { required = false } = {}) {
    let source = lineup && typeof lineup === 'object' ? lineup : null;
    if (!source) {
      if (required) fail(51556, 'Missing preset lineup');
      const current = currentPreset(model);
      if (!current) fail(51553, 'Current preset does not exist');
      source = { type: 1, team_list: [structuredClone(current.lineup)], custom_attr: [] };
    }
    const teams = Array.isArray(source.team_list) ? source.team_list : [];
    if (!teams.length) fail(51558, 'Missing lineup team');
    if (teams.length > MAX_TEAMS) fail(51503, 'Too many teams');
    const seen = new Set();
    for (const team of teams) {
      validateTeam(model, team);
      if (seen.has(team.team_id)) fail(51558, 'Duplicate team');
      seen.add(team.team_id);
    }
    const prepared = structuredClone(source);
    prepared.custom_attr = Array.isArray(source.custom_attr) ? structuredClone(source.custom_attr) : [];
    if (integerValue(prepared.type) === null) prepared.type = teams.length;
    return prepared;
  }

  function customPresetTypeCount(lineup) {
    return String((lineup.team_list ?? []).length || 1);
  }

  // pb_lineup.custom_lineup_index binds a play lineup to a custom preset and
  // LineupTable.Type.same_with_custom decides which types accept that binding.
  function bindLineupTypes(model, presets, index, types, teamList) {
    const accepted = [];
    for (const value of types) {
      const type = integerValue(value);
      if (type === null) fail(1, 'Invalid lineup type');
      const playLineup = model.playLineups.find(candidate => Number(candidate.type) === type);
      if (!playLineup) fail(51552, 'Unknown lineup type');
      if (!customTypes.has(type)) fail(51552, 'Lineup type does not accept custom presets');
      const foreign = presets.some(preset => Number(preset.index) !== index
        && (preset.lineup_type_list ?? []).map(Number).includes(type));
      const owner = Number(playLineup.custom_lineup_index ?? 0);
      if (foreign) fail(51562, 'Lineup type already uses another custom preset');
      if (owner > 0 && owner !== index) fail(51562, 'Lineup type already uses another custom preset');
      playLineup.custom_lineup_index = index;
      playLineup.team_list = structuredClone(teamList);
      if (!accepted.includes(type)) accepted.push(type);
    }
    return accepted;
  }

  function nextCustomIndex(presets) {
    const used = new Set(presets.map(preset => Number(preset.index)));
    for (let index = CUSTOM_FIRST_INDEX; index <= CUSTOM_MAX_ENTRIES; index += 1) if (!used.has(index)) return index;
    return fail(51559, 'Too many custom presets');
  }

  return {
    supports: type => supportedTypes.includes(type),
    isEtfRequest: type => etfTypes.has(type),
    requestSchema: type => requestSchemas.get(type),
    ensureLoginState() {
      return store.transaction(model => {
        const current = currentPreset(model);
        if (!current) return [];
        const repaired = [];
        for (const lineup of model.playLineups) {
          if (!sharedPreTypes.has(Number(lineup.type))) continue;
          const nextTeams = [structuredClone(current.lineup)];
          if (JSON.stringify(lineup.team_list) === JSON.stringify(nextTeams)) continue;
          lineup.team_list = nextTeams;
          repaired.push(Number(lineup.type));
        }
        const custom = readCustomState(model);
        if (custom.adopted) writeCustomState(model, custom.presets, custom.curIndex);
        return repaired;
      });
    },
    execute(type, input) {
      return store.transaction(model => {
        let schema, value, data;
        if (type === EDIT_PLAY_LINEUP) {
          const entries = input.lineup_list ?? [], seen = new Set();
          if (!entries.length) fail(51556, 'Missing lineup');
          for (const entry of entries) {
            if (seen.has(entry.type)) fail(51552, 'Duplicate lineup type');
            seen.add(entry.type);
            const existing = model.playLineups.findIndex(lineup => lineup.type === entry.type);
            if (existing < 0) fail(51552, 'Unknown lineup type');
            const teams = new Set();
            for (const team of entry.team_list ?? []) { validateTeam(model, team); if (teams.has(team.team_id)) fail(51558, 'Duplicate team'); teams.add(team.team_id); }
            if (!teams.size) fail(51558, 'Missing lineup team');
            model.playLineups[existing] = structuredClone(entry);
          }
          schema = 'pb_edit_lineup_rsp'; value = { lineup_list: entries };
        } else if (type === EDIT_PRE_LINEUP || type === LINEUP_EXCHANGE_VERSION) {
          let copy = [];
          if (type === LINEUP_EXCHANGE_VERSION) {
            if (input !== 0 && input !== 1) fail(1, 'Invalid lineup version');
            if ((model.lineups.version ?? 0) !== input) {
              const previous = model.lineups.pre_lineups;
              // A first switch initializes the alternate local layout from the saved team.
              model.lineups.pre_lineups = model.lineups.pre_lineups_standby?.length ? model.lineups.pre_lineups_standby : structuredClone(previous);
              model.lineups.pre_lineups_standby = previous;
              model.lineups.version = input;
              if (!model.lineups.pre_lineups.some(pre => pre.index === model.lineups.cur_pre_index)) model.lineups.cur_pre_index = model.lineups.pre_lineups[0].index;
            }
          } else {
            const entries = input.pre_lineup_list ?? [], seen = new Set();
            if (!entries.length) fail(51556, 'Missing preset');
            for (const entry of entries) {
              if (seen.has(entry.index)) fail(51553, 'Duplicate preset');
              seen.add(entry.index);
              const index = model.lineups.pre_lineups.findIndex(pre => pre.index === entry.index);
              if (index < 0) fail(51553, 'Unknown preset');
              validateTeam(model, entry.lineup);
              model.lineups.pre_lineups[index] = structuredClone(entry);
            }
            copy = copyCurrentPreset(model, input, sharedPreTypes);
          }
          const changed = syncHeroes(model);
          const custom = readCustomState(model);
          writeCustomState(model, custom.presets, custom.curIndex);
          schema = 'pb_edit_pre_lineup_rsp';
          value = { role_lineup: model.lineups, copy_lineup: copy, change_hero: changed, custom_pre_lineup_list: customPreLineupList(model, custom.presets) };
        } else if (type === SET_PRE_LINEUP_INDEX) {
          const index = integerValue(etfScalar(input));
          if (index === null) fail(1, 'Invalid preset index');
          const target = model.lineups.pre_lineups.find(pre => Number(pre.index) === index);
          if (!target) fail(51553, 'Unknown preset');
          model.lineups.cur_pre_index = target.index;
          const copy = copyCurrentPreset(model, { handle_types: ['0'] }, sharedPreTypes);
          syncHeroes(model);
          const custom = readCustomState(model);
          writeCustomState(model, custom.presets, custom.curIndex);
          schema = 'pb_set_pre_lineup_index_rsp'; value = { copy_lineup: copy };
        } else if (type === CUSTOM_PRE_LINEUP_NEW) {
          const proposals = input?.custom_pre_lineups;
          if (!Array.isArray(proposals)) fail(51556, 'Missing custom preset list');
          if (!proposals.length) fail(51556, 'Missing custom preset');
          const custom = readCustomState(model);
          const presets = custom.presets;
          for (const proposal of proposals) {
            const known = integerValue(proposal?.index);
            if (known !== null && presets.some(preset => Number(preset.index) === known)) continue;
            const name = presetName(proposal?.name);
            assertUniqueName(presets, name, null);
            if (presets.length + 2 > CUSTOM_MAX_ENTRIES) fail(51559, 'Too many custom presets');
            const lineup = prepareCustomLineup(model, proposal?.lineup);
            const index = nextCustomIndex(presets);
            const entry = { index, name, lineup, type: customPresetTypeCount(lineup), lineup_type_list: [] };
            presets.push(entry);
            entry.lineup_type_list = bindLineupTypes(model, presets, index, proposal?.lineup_type_list ?? [], lineup.team_list);
          }
          writeCustomState(model, presets, custom.curIndex);
          schema = 'pb_custom_pre_lineup_list'; value = customPreLineupList(model, presets);
        } else if (type === CUSTOM_PRE_LINEUP_SET_NAME) {
          const index = customIndexOrFail(input?.index, { allowDefault: true });
          const custom = readCustomState(model);
          const entry = custom.presets.find(preset => Number(preset.index) === index);
          if (!entry) fail(51553, 'Unknown preset');
          const name = presetName(input?.name);
          assertUniqueName(custom.presets, name, index);
          entry.name = name;
          writeCustomState(model, custom.presets, custom.curIndex);
          schema = 'pb_custom_pre_lineup'; value = entry;
        } else if (type === CUSTOM_PRE_LINEUP_SET) {
          const index = customIndexOrFail(input?.index, { allowDefault: true });
          const custom = readCustomState(model);
          const entry = custom.presets.find(preset => Number(preset.index) === index);
          if (!entry) fail(51553, 'Unknown preset');
          const lineup = prepareCustomLineup(model, input?.lineup, { required: true });
          entry.lineup = lineup;
          entry.type = customPresetTypeCount(lineup);
          const bound = new Set((entry.lineup_type_list ?? []).map(Number));
          for (const playLineup of model.playLineups) {
            const owner = Number(playLineup.custom_lineup_index ?? 0);
            if (owner > 0 && owner === index) bound.add(Number(playLineup.type));
          }
          entry.lineup_type_list = bindLineupTypes(model, custom.presets, index, [...bound], lineup.team_list);
          writeCustomState(model, custom.presets, custom.curIndex);
          schema = 'pb_custom_pre_lineup'; value = entry;
        } else if (type === CUSTOM_PRE_LINEUP_DELETE) {
          const index = customIndexOrFail(etfScalar(input));
          const custom = readCustomState(model);
          const position = custom.presets.findIndex(preset => Number(preset.index) === index);
          if (position < 0) fail(51553, 'Unknown preset');
          const [removed] = custom.presets.splice(position, 1);
          for (const playLineup of model.playLineups) {
            if (Number(playLineup.custom_lineup_index ?? 0) === index) playLineup.custom_lineup_index = 0;
          }
          const curIndex = custom.curIndex !== undefined && Number(custom.curIndex) === index ? undefined : custom.curIndex;
          writeCustomState(model, custom.presets, curIndex);
          // The delete response is an ETF fallback without a recovered schema; echo the removed index.
          schema = 'etf';
          value = { custom_pre_lineups: customPreLineupList(model, custom.presets).custom_pre_lineups, deleted_index: String(removed.index) };
          data = encodeEtfInteger(Number(removed.index));
        } else fail(1, 'Invalid lineup command');
        if (!data) data = codec.pack(schema, value);
        return { schema, value, data };
      });
    }
  };
}

