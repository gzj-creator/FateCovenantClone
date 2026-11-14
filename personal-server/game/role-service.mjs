import { GameError } from './hero-progression.mjs';
import { grantResources, consumeResources } from './resources.mjs';
import { buildLineupAttrInfo } from './attribute-service.mjs';
import { hasBit, setBit } from './bit-block.mjs';
import { E, encodeEtf, rawBinary } from '../protocol/game-codec.mjs';

// Block J role authority. RoleCmd stores everything that the client reads back
// from to_client_role_info inside roles.profile_json so login module 2 stays
// byte-identical; slow-changing ownership lives in the role_* tables created by
// game-store migrations through v18.
export const ROLE_COMMAND_TYPES = Object.freeze([
  10, 104, 105, 106, 109, 110, 111, 112, 161,
  1301, 1302, 1303, 1304, 1305, 1306, 1307, 1308, 1309, 1310, 1311,
  1312, 1313, 1314, 1315, 1317,
  39001, 78901, 98201
]);

const SUPPORTED = new Set(ROLE_COMMAND_TYPES);
const DAY_SECONDS = 86400;

export function termValue(value) {
  if (value === null || value === undefined) return value;
  if (Buffer.isBuffer(value)) return value;
  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'bigint') return value;
  if (typeof value === 'object') {
    if (value.value?.type === 'Buffer' && Array.isArray(value.value.data)) return Buffer.from(value.value.data);
    const raw = value.value;
    if (Buffer.isBuffer(raw)) return raw;
    if (raw && typeof raw === 'object' && raw.type === 'Buffer' && Array.isArray(raw.data)) return Buffer.from(raw.data);
    if (raw instanceof Map) return raw;
    if (Array.isArray(raw)) return raw;
  }
  return value;
}

export function termArray(value) {
  const unwrapped = termValue(value);
  if (Array.isArray(unwrapped)) return unwrapped.map(termValue);
  return null;
}

export function termMap(value) {
  const unwrapped = termValue(value);
  if (!(unwrapped instanceof Map)) return null;
  const result = {};
  for (const [key, entry] of unwrapped) {
    const plainKey = termValue(key);
    const name = Buffer.isBuffer(plainKey) ? plainKey.toString('utf8') : String(plainKey);
    result[name] = termValue(entry);
  }
  return result;
}

export function termInt(value) {
  const unwrapped = termValue(value);
  if (typeof unwrapped === 'number' && Number.isSafeInteger(unwrapped)) return unwrapped;
  if (typeof unwrapped === 'bigint') {
    const narrowed = Number(unwrapped);
    return Number.isSafeInteger(narrowed) ? narrowed : null;
  }
  if (typeof unwrapped === 'string' && /^-?[0-9]+$/.test(unwrapped.trim())) return Number(unwrapped.trim());
  return null;
}

export function termText(value) {
  const unwrapped = termValue(value);
  if (typeof unwrapped === 'string') return unwrapped;
  if (Buffer.isBuffer(unwrapped)) return unwrapped.toString('utf8');
  return null;
}

export function termBinary(value) {
  const unwrapped = termValue(value);
  if (Buffer.isBuffer(unwrapped)) return Buffer.from(unwrapped);
  if (unwrapped instanceof Uint8Array) return Buffer.from(unwrapped);
  if (typeof unwrapped === 'string') return Buffer.from(unwrapped, 'base64');
  if (unwrapped && unwrapped.type === 'Buffer' && Array.isArray(unwrapped.data)) return Buffer.from(unwrapped.data);
  return null;
}

export function properList(value) {
  if (value && typeof value === 'object' && !Buffer.isBuffer(value) && 'value' in value) {
    if (value.improper !== false || !Array.isArray(value.value)) return null;
    return value.value.map(termValue);
  }
  if (Array.isArray(value)) return value.map(termValue);
  return null;
}

function firstOf(value, pick) {
  const direct = pick(value);
  if (direct !== null && direct !== undefined) return direct;
  const list = termArray(value);
  if (list) {
    for (const entry of list) {
      const found = pick(entry);
      if (found !== null && found !== undefined) return found;
    }
  }
  const map = termMap(value);
  if (map) {
    for (const entry of Object.values(map)) {
      const found = pick(entry);
      if (found !== null && found !== undefined) return found;
    }
  }
  return null;
}

const firstInt = value => firstOf(value, termInt);
const firstText = value => firstOf(value, termText);

function intList(value) {
  const list = termArray(value);
  if (list) return list.map(termInt).filter(entry => entry !== null);
  const single = termInt(value);
  return single === null ? [] : [single];
}

function textList(value) {
  const list = termArray(value);
  if (list) return list.map(termText).filter(entry => entry !== null && entry.length > 0);
  const single = termText(value);
  return single ? [single] : [];
}

function roleName(role) {
  const raw = role?.nick_name;
  if (!raw) return '';
  const bytes = termBinary(raw);
  return bytes ? bytes.toString('utf8') : '';
}

function setRoleName(role, name) { role.nick_name = Buffer.from(name, 'utf8'); }

function ensureFigure(role) {
  if (!role.figure_simple_info || typeof role.figure_simple_info !== 'object') role.figure_simple_info = {};
  const figure = role.figure_simple_info;
  if (!figure.head_info) figure.head_info = { tid: '0', expire_time: '0', is_red: false, level: 0 };
  if (!figure.frame_info) figure.frame_info = { tid: '0', expire_time: '0', is_red: false, level: 0 };
  if (!figure.title_info) figure.title_info = { tid: '0', expire_time: '0', is_red: false, level: 0 };
  if (!figure.new_chat_bubble) figure.new_chat_bubble = { tid: '0', expire_time: '0', is_red: false, level: 0 };
  if (figure.sex === undefined) figure.sex = 1;
  if (figure.set_sex_times === undefined) figure.set_sex_times = 0;
  if (figure.rank === undefined) figure.rank = 0;
  if (figure.style_id === undefined) figure.style_id = '0';
  return figure;
}

export function validateRoleName(name, config = null) {
  const trimmed = String(name ?? '').trim();
  const minimum = Math.max(1, Number(config?.min_length ?? 1));
  const maximum = Math.max(minimum, Number(config?.max_length ?? 6));
  const length = [...trimmed].length;
  if (length < minimum || length > maximum) throw new GameError(1, `Role name must be between ${minimum} and ${maximum} characters`);
  if (/[\u0000-\u001f\u007f]/.test(trimmed)) throw new GameError(1, 'Role name contains control characters');
  return trimmed;
}

function profileName(profile) {
  const raw = profile?.nick_name;
  if (!raw) return '';
  const bytes = termBinary(raw);
  return bytes ? bytes.toString('utf8') : '';
}

export function createRoleService(options) {
  const {
    store, codec, tables, heroTables, attributeTables,
    now = Date.now, logger = () => {}, gmEnabled = () => false,
    veteranConfig = { min_level: 10, min_days: 7, skip_awards: [] }
  } = options;
  const log = event => { try { logger(event); } catch {} };
  const stamp = () => new Date(now()).toISOString();
  const currentSeconds = () => Math.floor(now() / 1000);
  const maxRoleLevel = () => Number(tables?.RoleLevelSetting?.get?.(1)?.max_level ?? 300);
  const changeNameConfig = () => tables?.ChangeName?.get?.(1) ?? { res: 101500, res_count: 200, min_length: 1, max_length: 6 };

  function audit(db, roleId, command, detail) {
    db.prepare('INSERT INTO gm_audit_entries (role_id,command,detail_json,created_at) VALUES (?,?,?,?)')
      .run(roleId, command, JSON.stringify(detail ?? {}), stamp());
  }

  function extra(db, roleId) {
    let row = db.prepare('SELECT * FROM role_profile_extra WHERE role_id=?').get(roleId);
    if (!row) {
      db.prepare('INSERT INTO role_profile_extra (role_id,updated_at) VALUES (?,?)').run(roleId, stamp());
      row = db.prepare('SELECT * FROM role_profile_extra WHERE role_id=?').get(roleId);
    }
    return row;
  }

  function sundryOf(row) {
    try { return JSON.parse(row.sundry_json ?? '{}'); } catch { return {}; }
  }

  function writeExtra(db, roleId, patch) {
    const row = extra(db, roleId);
    const next = {
      sundry_json: patch.sundry !== undefined ? JSON.stringify(patch.sundry) : row.sundry_json,
      recommend_lv: patch.recommend_lv !== undefined ? patch.recommend_lv : row.recommend_lv,
      veteran_json: patch.veteran !== undefined ? JSON.stringify(patch.veteran) : row.veteran_json,
      pass_all_mission_at: patch.pass_all_mission_at !== undefined ? patch.pass_all_mission_at : row.pass_all_mission_at,
      watch_video_day: patch.watch_video_day !== undefined ? patch.watch_video_day : row.watch_video_day
    };
    db.prepare('UPDATE role_profile_extra SET sundry_json=?,recommend_lv=?,veteran_json=?,pass_all_mission_at=?,watch_video_day=?,updated_at=? WHERE role_id=?')
      .run(next.sundry_json, next.recommend_lv, next.veteran_json, next.pass_all_mission_at, next.watch_video_day, stamp(), roleId);
    return { ...row, ...next };
  }

  function figureTable(kind) {
    return kind === 'head' ? tables?.FigureHead
      : kind === 'frame' ? tables?.FigureFrame
        : kind === 'title' ? tables?.FigureTitle
          : tables?.FigureChatBubble;
  }

  function figureRow(kind, tid) {
    return figureTable(kind)?.get?.(Number(tid)) ?? null;
  }

  function stableField(kind) {
    return kind === 'head' ? 'stable_head_info'
      : kind === 'frame' ? 'stable_frame_info'
        : kind === 'title' ? 'stable_title_info'
          : 'stable_bubble_info';
  }

  function stableOffset(kind) {
    return kind === 'head' ? 1000 : kind === 'frame' ? 2000 : 3000;
  }

  function stableBit(kind, tid) {
    const id = Number(tid);
    if (!Number.isSafeInteger(id) || id < 8) return -1;
    return Math.floor((id - 8) / 100) - stableOffset(kind);
  }

  function stableBytes(role, kind) {
    return termBinary(role?.figure_have_info?.[stableField(kind)]) ?? Buffer.alloc(0);
  }

  function stableEntries(role, kind) {
    const rows = [];
    const bits = stableBytes(role, kind);
    for (const [tid, config] of figureTable(kind) ?? []) {
      if (!hasBit(bits, stableBit(kind, tid))) continue;
      rows.push({ tid: String(tid), expire_time: '0', is_red: config?.not_red !== true, level: 0 });
    }
    return rows;
  }

  function ownedFigure(db, roleId, role, kind, tid) {
    if (!figureRow(kind, tid)) return null;
    if (kind === 'head') {
      const needLevel = Number(figureRow(kind, tid)?.need_level ?? 0);
      if (needLevel <= Number(role.level ?? 1)) return { tid: String(tid), expire_time: '0', is_red: false, level: 0 };
      return null;
    }
    const stable = stableEntries(role, kind).find(row => Number(row.tid) === Number(tid));
    if (stable) return stable;
    const stored = db.prepare('SELECT * FROM role_figure_items WHERE role_id=? AND kind=? AND tid=?').get(roleId, kind, Number(tid));
    return stored ? { tid: String(tid), expire_time: String(stored.expire_time), is_red: stored.red === 1, level: 0 } : null;
  }

  function figureItems(db, roleId, role, kind) {
    const rows = new Map();
    if (kind === 'head') {
      for (const [tid, row] of figureTable('head') ?? []) {
        if (Number(row.need_level ?? 0) <= Number(role.level ?? 1)) {
          rows.set(Number(tid), { tid: String(tid), expire_time: '0', is_red: row.not_red !== true, level: 0 });
        }
      }
    } else {
      for (const row of stableEntries(role, kind)) rows.set(Number(row.tid), row);
    }
    for (const stored of db.prepare('SELECT * FROM role_figure_items WHERE role_id=? AND kind=? ORDER BY tid').all(roleId, kind)) {
      rows.set(Number(stored.tid), { tid: String(stored.tid), expire_time: String(stored.expire_time), is_red: stored.red === 1, level: 0 });
    }
    return [...rows.values()].sort((left, right) => Number(left.tid) - Number(right.tid));
  }

  function haveInfo(db, roleId, role) {
    return {
      stable_head_info: stableBytes(role, 'head'),
      stable_frame_info: stableBytes(role, 'frame'),
      stable_title_info: stableBytes(role, 'title'),
      limit_head_list: figureItems(db, roleId, role, 'head'),
      limit_frame_list: figureItems(db, roleId, role, 'frame'),
      limit_title_list: figureItems(db, roleId, role, 'title'),
      inactive_title_list: [],
      stable_head_red: Buffer.alloc(0),
      stable_frame_red: Buffer.alloc(0),
      stable_title_red: Buffer.alloc(0),
      stable_style_red: Buffer.alloc(0),
      stable_bubble_info: stableBytes(role, 'bubble'),
      limit_bubble_list: figureItems(db, roleId, role, 'bubble'),
      stable_bubble_red: Buffer.alloc(0)
    };
  }

  function recordSundry(input) {
    const map = termMap(input);
    const tid = map ? termInt(map.tid) : firstInt(input);
    if (tid === null || tid <= 0) throw new GameError(1, 'Invalid sundry tid');
    if (tables?.RoleSundry && !tables.RoleSundry.get(tid)) throw new GameError(1, 'Unknown sundry tid');
    const valueInt = map ? (termInt(map.value_int) ?? 0) : 0;
    const rawValue = map?.value_pb ?? null;
    const valueBuf = Buffer.isBuffer(rawValue) ? rawValue : (typeof rawValue === 'string' ? Buffer.from(rawValue, 'utf8') : Buffer.alloc(0));
    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const row = extra(db, roleId);
      const sundry = sundryOf(row);
      const timeDay = Math.floor(currentSeconds() / DAY_SECONDS);
      sundry[String(tid)] = { value_int: valueInt, value_pb: valueBuf.toString('base64'), time_day: timeDay };
      writeExtra(db, roleId, { sundry });
      return {
        value: { tid, valueInt, timeDay, valueBytes: valueBuf.length },
        data: codec.pack('pb_role_sundry_item', { tid, value_int: valueInt, value_pb: valueBuf, time_day: timeDay })
      };
    });
  }

  function recordPassAllMission(input) {
    const list = properList(input);
    if (!list || list.length !== 0) throw new GameError(1, 'record_pass_all_mission requires an empty ETF list');
    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const missionModule = new Map(model.state.modules.value).get(8);
      const missionBytes = rawBinary(missionModule?.value?.[0]);
      const mission = missionBytes.length ? codec.unpack('pb_mission', missionBytes) : null;
      const safeMissionId = Number(mission?.mission_id ?? 0);
      if (!Number.isSafeInteger(safeMissionId) || safeMissionId <= 0) {
        throw new GameError(5, 'Authoritative mission cursor is unavailable');
      }
      writeExtra(db, roleId, { pass_all_mission_at: currentSeconds() });
      audit(db, roleId, 'record_pass_all_mission', { recordedAt: currentSeconds(), safeMissionId });
      return { value: { recorded: true, safeMissionId }, data: null };
    });
  }

  function requestRoleList() {
    const detailed = store.inspect(db => db.prepare('SELECT role_id,profile_json FROM roles ORDER BY role_id LIMIT 32').all()
      .map(row => {
        const profile = JSON.parse(row.profile_json);
        return {
          role_id: String(row.role_id),
          level: String(profile.level ?? 1),
          name: profileName(profile),
          figure: Number(profile.figure_simple_info?.head_info?.tid ?? 0),
          privilege: 0
        };
      }));
    return { value: { roles: detailed.length }, data: codec.pack('pb_account_roles', { roles: detailed }) };
  }

  function setRecommendLevel(input) {
    const level = firstInt(input);
    if (level === null || level < 0 || level > maxRoleLevel()) throw new GameError(1, 'Invalid recommend level');
    return store.transaction((model, db) => {
      writeExtra(db, model.state.roleId, { recommend_lv: level });
      return { value: { recommendLv: level }, data: null };
    });
  }

  function checkVeteran() {
    return store.transaction((model, db) => {
      const created = Number(model.role.create_time ?? 0);
      const days = created > 0 ? Math.floor((currentSeconds() - created) / DAY_SECONDS) + 1 : 1;
      const eligible = Number(model.role.level ?? 1) >= Number(veteranConfig.min_level ?? 10)
        && days >= Number(veteranConfig.min_days ?? 7);
      const state = { eligible, level: Number(model.role.level ?? 1), days, checked_at: currentSeconds() };
      writeExtra(db, model.state.roleId, { veteran: state });
      // The client sends this as a sequenced request and keeps the hall loading
      // until that sequence is acknowledged. The request has no recovered
      // response schema, so reply with the protocol's empty success payload.
      return { value: state, data: Buffer.alloc(0) };
    });
  }

  function veteranSkip() {
    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const row = extra(db, roleId);
      let state = {};
      try { state = JSON.parse(row.veteran_json ?? '{}'); } catch {}
      if (!state.eligible) throw new GameError(1, 'Role is not eligible for the veteran skip');
      if (state.skipped) throw new GameError(310, 'Veteran skip was already used');
      const awards = Array.isArray(veteranConfig.skip_awards) ? veteranConfig.skip_awards : [];
      const granted = awards.length ? grantResources(model, awardPairs(awards), tables) : { changes: [] };
      writeExtra(db, roleId, { veteran: { ...state, skipped: true, skipped_at: currentSeconds() } });
      return {
        value: { skipped: true, changes: granted.changes.length },
        data: codec.pack('pb_res_to_client', { changes: granted.changes, is_overflow: false })
      };
    });
  }

  function setRoleNameCommand(input) {
    const config = changeNameConfig();
    const name = validateRoleName(firstText(input) ?? '', config);
    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const taken = db.prepare('SELECT profile_json FROM roles WHERE role_id<>?').all(roleId)
        .some(row => profileName(JSON.parse(row.profile_json)) === name);
      if (taken) throw new GameError(420, 'Role name is already taken');
      const cost = [[Number(config.res), Number(config.res_count)]];
      const charged = consumeResources(model, cost, 301, { codec });
      setRoleName(model.role, name);
      model.role.set_name_times = Number(model.role.set_name_times ?? 0) + 1;
      return {
        value: { name, times: model.role.set_name_times },
        data: codec.pack('res_set_role_name', {
          nick_name: Buffer.from(name, 'utf8'),
          set_name_times: model.role.set_name_times,
          res: { changes: charged.changes, is_overflow: false }
        })
      };
    });
  }

  function randomRoleName() {
    const prefixes = [...(tables?.NamePrefix?.values?.() ?? [])].map(row => String(row?.text ?? '')).filter(Boolean);
    const suffixes = [...(tables?.NameSuffix?.values?.() ?? [])].map(row => String(row?.text ?? '')).filter(Boolean);
    const names = prefixes.flatMap(prefix => suffixes.map(suffix => prefix + suffix))
      .filter(name => [...name].length >= 1 && [...name].length <= Number(changeNameConfig().max_length ?? 6));
    if (!names.length) throw new GameError(5, 'Role name pool is not configured');
    const roleId = store.inspect(db => Number(db.prepare('SELECT role_id FROM roles LIMIT 1').get().role_id));
    const figure = ensureFigure(store.read().role);
    const index = (roleId + Number(figure.set_sex_times ?? 0) + Math.floor(now() / 1000)) % names.length;
    const name = names[index];
    return { value: { name }, etfTerm: new E.OtpErlangList([new E.OtpErlangBinary(Buffer.from(name, 'utf8'))], false) };
  }

  function levelReward() {
    return store.transaction((model, db) => {
      const role = model.role;
      const level = Number(role.level ?? 0);
      const claimed = Number(role.level_reward_record ?? 0);
      if (level <= claimed) throw new GameError(310, 'Level reward was already claimed');
      const items = [];
      for (let lv = claimed + 1; lv <= level; lv += 1) {
        const row = tables?.RoleLevel?.get?.(lv);
        const ids = Array.isArray(row?.reward_id) ? row.reward_id : [];
        const counts = Array.isArray(row?.reward_count) ? row.reward_count : [];
        ids.forEach((tid, index) => {
          const num = Number(counts[index] ?? 0);
          if (num > 0) items.push({ tid: Number(tid), num });
        });
      }
      const granted = items.length ? grantResources(model, awardPairs(items), tables) : { changes: [] };
      role.level_reward_record = level;
      return {
        value: { level, rewards: items.length, changes: granted.changes.length },
        data: codec.pack('res_get_level_reward', { res: { changes: granted.changes, is_overflow: false } })
      };
    });
  }

  function setFigure(input) {
    const tid = firstInt(input);
    if (tid === null || tid < 0) throw new GameError(1, 'Invalid figure tid');
    return store.transaction((model, db) => {
      const figure = ensureFigure(model.role);
      const entry = tid === 0
        ? { tid: '0', expire_time: '0', is_red: false, level: 0 }
        : ownedFigure(db, model.state.roleId, model.role, 'head', tid);
      if (!entry) throw new GameError(420, 'Figure is not owned');
      figure.head_info = entry;
      return { value: { tid }, data: codec.pack('pb_figure_simple_info', figure) };
    });
  }

  function activeTitle(input) {
    const tid = firstInt(input);
    if (tid === null || tid <= 0) throw new GameError(1, 'Invalid title tid');
    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const entry = ownedFigure(db, roleId, model.role, 'title', tid);
      if (!entry) throw new GameError(420, 'Title is not owned');
      const stored = db.prepare('SELECT * FROM role_figure_items WHERE role_id=? AND kind=? AND tid=?').get(roleId, 'title', tid);
      const figure = ensureFigure(model.role);
      figure.title_info = entry;
      if (stored?.red) db.prepare('UPDATE role_figure_items SET red=0 WHERE role_id=? AND kind=? AND tid=?').run(roleId, 'title', tid);
      return {
        value: { tid },
        data: codec.pack('pb_active_title_req_back', { simple_info: figure, have_info: haveInfo(db, roleId, model.role) })
      };
    });
  }

  function roleTitleAttr() {
    return store.transaction(model => {
      const figure = ensureFigure(model.role);
      const tid = Number(figure.title_info?.tid ?? 0);
      const row = tables?.FigureTitle?.get?.(tid) ?? null;
      const attrs = Array.isArray(row?.attrs) ? row.attrs : [];
      model.state.roleTitleAttr = { tid, attrs, hero_attrs: row?.hero_attrs ?? [], computed_at: currentSeconds() };
      return { value: { tid, attrs: attrs.length }, data: null };
    });
  }

  function checkSameName(input) {
    const name = validateRoleName(firstText(input) ?? '', changeNameConfig());
    const exists = store.inspect(db => db.prepare('SELECT profile_json FROM roles').all()
      .some(row => profileName(JSON.parse(row.profile_json)) === name));
    return { value: { name, exists, available: !exists }, etfTerm: !exists };
  }

  function refreshFigureRed() {
    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      db.prepare('UPDATE role_figure_items SET red=0 WHERE role_id=?').run(roleId);
      return { value: { roleId }, data: codec.pack('pb_figure_have_info', haveInfo(db, roleId, model.role)) };
    });
  }

  function setFigureSex(input) {
    const sex = firstInt(input);
    if (sex !== 1 && sex !== 2) throw new GameError(1, 'Invalid figure sex');
    return store.transaction(model => {
      const figure = ensureFigure(model.role);
      figure.sex = sex;
      figure.set_sex_times = Number(figure.set_sex_times ?? 0) + 1;
      return {
        value: { sex, times: figure.set_sex_times },
        data: codec.pack('pb_res_to_client', { changes: [], is_overflow: false })
      };
    });
  }

  function setFigureStyle(input) {
    const style = firstInt(input);
    if (style === null || style < 0) throw new GameError(1, 'Invalid figure style');
    const configured = style === 0 || heroTables?.Hero?.has?.(style) === true || tables?.FigureHead?.get?.(style) != null;
    if (!configured) throw new GameError(420, 'Figure style is not configured');
    return store.transaction(model => {
      ensureFigure(model.role).style_id = String(style);
      return { value: { style }, data: null };
    });
  }

  function setRoleNameSex(input) {
    const list = termArray(input) ?? [];
    const config = changeNameConfig();
    const name = validateRoleName(textList(list[0]).join('') || firstText(input) || '', config);
    const sex = termInt(list[1]);
    if (sex !== 1 && sex !== 2) throw new GameError(1, 'Invalid figure sex');
    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const taken = db.prepare('SELECT profile_json FROM roles WHERE role_id<>?').all(roleId)
        .some(row => profileName(JSON.parse(row.profile_json)) === name);
      if (taken) throw new GameError(420, 'Role name is already taken');
      const charged = consumeResources(model, [[Number(config.res), Number(config.res_count)]], 301, { codec });
      setRoleName(model.role, name);
      model.role.set_name_times = Number(model.role.set_name_times ?? 0) + 1;
      const figure = ensureFigure(model.role);
      figure.sex = sex;
      figure.set_sex_times = Number(figure.set_sex_times ?? 0) + 1;
      return {
        value: { name, sex },
        data: codec.pack('res_set_role_name_sex', {
          nick_name: Buffer.from(name, 'utf8'),
          set_name_times: model.role.set_name_times,
          res: { changes: charged.changes, is_overflow: false },
          simple_info: figure
        })
      };
    });
  }

  function rankRow(rank) {
    return tables?.FigureRank?.get?.(Number(rank)) ?? null;
  }

  function upRank() {
    return store.transaction(model => {
      const figure = ensureFigure(model.role);
      const current = Number(figure.rank ?? 0);
      const next = rankRow(current + 1);
      if (!next) throw new GameError(5, 'Role rank configuration is missing');
      if (Number(model.role.level ?? 0) < Number(next.level ?? 0)) {
        throw new GameError(430, 'Role level is too low for the next rank');
      }
      const power = Number(model.state.rolePower?.power ?? 0);
      if (!Number.isSafeInteger(power) || power < Number(next.power ?? 0)) {
        throw new GameError(431, 'Role power is too low for the next rank');
      }
      const item = Number(next.item ?? 0);
      const count = Number(next.item_count ?? 0);
      let consumed = { changes: [] };
      if (count > 0) {
        const resource = model.resources.get(String(item));
        if (!resource || Number(resource.num ?? 0) < count) throw new GameError(301, 'Insufficient role rank item');
        consumed = consumeResources(model, [[item, count]], 301, { codec });
      }
      figure.rank = current + 1;
      return {
        value: { rank: figure.rank, item, count, changes: consumed.changes },
        data: codec.pack('pb_role_figure_up_back', {
          leader_equips_forge_data: { lv: 0, exp: 0, wish: 0 },
          res: { changes: consumed.changes, is_overflow: false }
        })
      };
    });
  }

  function rankAward() {
    return store.transaction((model, db) => {
      const figure = ensureFigure(model.role);
      const rank = Number(figure.rank ?? 0);
      const row = rankRow(rank);
      if (!row) throw new GameError(5, 'Role rank configuration is missing');
      model.role.figure_have_info ??= {};
      let bits = termBinary(model.role.figure_have_info.rank_award_bin) ?? Buffer.alloc(0);
      const levelBit = (rank - 1) * 2 + 1;
      const powerBit = (rank - 1) * 2 + 2;
      const awards = [];
      const levelAward = Number(row.level_award ?? 0), levelAwardNum = Number(row.level_award_num ?? 0);
      const powerAward = Number(row.power_award ?? 0), powerAwardNum = Number(row.power_award_num ?? 0);
      if (levelAward > 0 && levelAwardNum > 0 && Number(model.role.level ?? 0) >= Number(row.level ?? 0) && !hasBit(bits, levelBit)) {
        awards.push([levelAward, levelAwardNum]);
        bits = setBit(bits, levelBit);
      }
      if (powerAward > 0 && powerAwardNum > 0 && Number(model.state.rolePower?.power ?? 0) >= Number(row.power ?? 0) && !hasBit(bits, powerBit)) {
        awards.push([powerAward, powerAwardNum]);
        bits = setBit(bits, powerBit);
      }
      model.role.figure_have_info.rank_award_bin = bits.toString('base64');
      const granted = awards.length ? grantResources(model, awards, tables, { codec }) : { changes: [] };
      return {
        value: { rank, changes: granted.changes.length },
        data: codec.pack('pb_role_figure_rank_award_back', {
          rank_award_bin: bits,
          res: { changes: granted.changes, is_overflow: false }
        })
      };
    });
  }

  function refreshPower() {
    return store.transaction(model => {
      const info = buildLineupAttrInfo({ model, lineupType: 1, heroTables, attributeTables });
      const power = String(info.lineup_attr?.lineup_power ?? '0');
      model.state.rolePower = { lineup_type: 1, power, computed_at: currentSeconds() };
      return { value: { power }, data: null };
    });
  }

  function setChatBubble(input) {
    const tid = firstInt(input);
    if (tid === null || tid < 0) throw new GameError(1, 'Invalid chat bubble tid');
    return store.transaction((model, db) => {
      const figure = ensureFigure(model.role);
      const entry = tid === 0
        ? { tid: '0', expire_time: '0', is_red: false, level: 0 }
        : ownedFigure(db, model.state.roleId, model.role, 'bubble', tid);
      if (!entry) throw new GameError(420, 'Chat bubble is not owned');
      figure.new_chat_bubble = entry;
      figure.chat_bubble = String(tid);
      return { value: { tid }, data: null };
    });
  }

  function watchVideoAward() {
    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const dayKey = stamp().slice(0, 10);
      const row = extra(db, roleId);
      if (row.watch_video_day === dayKey) throw new GameError(310, 'Video award was already claimed today');
      const awards = Array.isArray(tables?.WatchVideoAward?.get?.(1)?.reward) ? tables.WatchVideoAward.get(1).reward : [];
      if (!awards.length) throw new GameError(5, 'Video award configuration is missing');
      const granted = grantResources(model, awardPairs(awards), tables);
      writeExtra(db, roleId, { watch_video_day: dayKey });
      return {
        value: { day: dayKey, changes: granted.changes.length },
        data: codec.pack('pb_res_to_client', { changes: granted.changes, is_overflow: false })
      };
    });
  }

  function moduleBytes(model, moduleId, slot = null) {
    const module = new Map(model.state.modules.value).get(Number(moduleId));
    const target = slot === null ? module : module?.value?.[slot];
    return target ? rawBinary(target) : null;
  }

  function decodeModule(model, moduleId, slot, schema, fallback) {
    const bytes = moduleBytes(model, moduleId, slot);
    if (bytes === null || bytes.length === 0) return structuredClone(fallback);
    return codec.unpack(schema, bytes);
  }

  async function playerDataBlock(model, db, typeId, itemId, blockId) {
    const block = tables?.PlayerDataBlock?.get?.(blockId);
    if (!block) return null;
    const type = tables?.PlayerDataType?.get?.(typeId);
    if (type && !(type.block ?? []).map(Number).includes(Number(blockId))) return null;
    if (!type) {
      const func = tables?.PlayerDataFunc?.get?.(typeId);
      const lineups = (block.line_up ?? []).map(Number);
      if (!func || !lineups.some(lineup => (func.lineup ?? []).map(Number).includes(lineup))) return null;
    }
    if (String(itemId) !== String(model.state.roleId)) return null;

    if (block.is_pb) {
      switch (Number(blockId)) {
        case 1:
          return codec.pack('pb_player_info', {
            id: String(model.state.roleId), server_id: Number(model.state.serverId),
            name: Buffer.from(roleName(model.role), 'utf8'), level: Number(model.role.level ?? 1),
            figure_simple_info: ensureFigure(model.role)
          });
        case 2: {
          const guildLogin = decodeModule(model, 24, null, 'pb_res_guild_login', { guild_applies: [] });
          return codec.pack('pb_player_guild', guildLogin.guild ?? {});
        }
        case 3: {
          const allowedLineupTypes = new Set((block.line_up ?? []).map(Number));
          const lineupList = (model.playLineups ?? []).filter(lineup => allowedLineupTypes.has(Number(lineup?.type)));
          return codec.pack('pb_player_lineup', {
            hero_list: model.heroInfo?.hero_list ?? [], lineup_list: lineupList
          });
        }
        case 4: {
          const loginTime = decodeModule(model, 1, 2, 'pb_login_time', {});
          return codec.pack('pb_player_login', {
            last_login_time: Number(loginTime.last_login ?? currentSeconds()),
            last_logout_time: Number(loginTime.last_logout ?? currentSeconds() - 1),
            maybe_online: true
          });
        }
        case 7: {
          const artifact = decodeModule(model, 50, 0, 'pb_artifact_info', { artifact_list: [], skill_list: [] });
          return codec.pack('pb_player_artifact', {
            artifact_list: artifact.artifact_list ?? [], tid_list: artifact.skill_list ?? []
          });
        }
        case 12: {
          const skin = decodeModule(model, 65, 0, 'pb_skin_info', { skin_list: [] });
          return codec.pack('pb_skin_block', { skin_list: skin.skin_list ?? [] });
        }
        case 13: {
          const info = haveInfo(db, model.state.roleId, model.role);
          return codec.pack('pb_role_figure_block', {
            stable_title_info: info.stable_title_info,
            limit_title_list: info.limit_title_list
          });
        }
        case 16: {
          const lineupType = Number((block.line_up ?? [])[0] ?? 1);
          return codec.pack('pb_attr_lineup_all_info', buildLineupAttrInfo({ model, lineupType, heroTables, attributeTables }));
        }
        case 21:
          return moduleBytes(model, 10, 3) ?? codec.pack('pb_hero_all_handbook_record', { records: [], own_rev: Buffer.alloc(0) });
        case 22:
          return moduleBytes(model, 10, 4) ?? codec.pack('pb_role_hero_favour', {});
        default:
          return null;
      }
    }

    if (block.pb_struct_type === 'binary') {
      return moduleBytes(model, 35, null);
    }
    let value = null;
    if (Number(blockId) === 5) {
      const mission = decodeModule(model, 8, 0, 'pb_mission', {});
      value = Number(mission.mission_id ?? 0);
    }
    if (Number(blockId) === 24) {
      const fashion = decodeModule(model, 110, null, 'pb_fashion_data', { cur_id: 0, info_list: [] });
      value = Number(fashion.cur_id ?? 0);
    }
    if (!Number.isSafeInteger(value) || value < 0) return null;
    return encodeEtf(value);
  }

  async function playerData(request) {
    const typeId = Number(request?.type ?? 0);
    const items = Array.isArray(request?.item_list) ? request.item_list : [];
    if (!items.length) throw new GameError(1, 'Player data request has no items');
    const model = store.read();
    const db = store.inspect(value => value);
    const localRoleId = String(model.state.roleId);
    const itemList = [];
    for (const item of items.slice(0, 64)) {
      const id = String(item?.id ?? '0');
      const requested = [...new Set((item?.block_id_list ?? []).map(Number).filter(value => Number.isSafeInteger(value)))];
      const blockList = [];
      for (const blockId of requested) {
        const bytes = await playerDataBlock(model, db, typeId, id, blockId);
        if (bytes !== null) blockList.push({ block_id: blockId, block_bin: Buffer.from(bytes) });
      }
      itemList.push({ id, block_list: blockList });
    }
    log({ event: 'player_data_requested', type: typeId, items: itemList.length, localRoleId, blocks: itemList.reduce((sum, item) => sum + item.block_list.length, 0) });
    return { value: { type: typeId, items: itemList.length }, data: codec.pack('pb_function_cache_back', { item_list: itemList }) };
  }

  function saveRedDots(request) {
    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const nowStamp = stamp();
      const upsert = db.prepare('INSERT OR REPLACE INTO role_red_dots (role_id,path_key,state,show_count,extra_bin,updated_at) VALUES (?,?,?,?,?,?)');
      const changes = Array.isArray(request?.to_add_or_change_list) ? request.to_add_or_change_list : [];
      for (const entry of changes) {
        const path = termBinary(entry?.path_bin);
        if (!path?.length) throw new GameError(1, 'Red dot path is required');
        const key = path.toString('base64');
        const extra = termBinary(entry.extra) ?? Buffer.alloc(0);
        upsert.run(roleId, key, entry.state ? 1 : 0, Number(entry.show_count ?? 0), extra, nowStamp);
      }
      const deletions = Array.isArray(request?.to_del_list) ? request.to_del_list : [];
      const remove = db.prepare('DELETE FROM role_red_dots WHERE role_id=? AND path_key=?');
      for (const entry of deletions) {
        const text = termText(entry);
        if (!text) continue;
        const keys = new Set([Buffer.from(text, 'utf8').toString('base64')]);
        if (/^[A-Za-z0-9+/]+={0,2}$/.test(text) && text.length % 4 === 0) {
          const decoded = Buffer.from(text, 'base64');
          if (decoded.toString('base64') === text) keys.add(text);
        }
        for (const key of keys) remove.run(roleId, key);
      }
      return { value: { saved: changes.length, deleted: deletions.length }, data: null };
    });
  }

  function loginRedDots() {
    const model = store.read();
    const rows = store.inspect(db => db.prepare('SELECT * FROM role_red_dots WHERE role_id=? ORDER BY path_key').all(model.state.roleId));
    return codec.pack('all_saved_red', {
      saved_red_list: rows.map(row => ({
        state: row.state === 1,
        path_bin: Buffer.from(row.path_key, 'base64'),
        show_count: Number(row.show_count ?? 0),
        extra: termBinary(row.extra_bin) ?? Buffer.alloc(0)
      }))
    });
  }

  function clientLog(input) {
    const map = termMap(input);
    const description = map
      ? String(termText(map.desc) ?? termText(map.description) ?? JSON.stringify(Object.keys(map)))
      : String(firstText(input) ?? JSON.stringify(input ?? null));
    return store.transaction((model, db) => {
      db.prepare('INSERT INTO client_diagnostic_logs (role_id,day_count,description,payload_json,created_at) VALUES (?,?,?,?,?)')
        .run(model.state.roleId, Number(map?.day_count ?? 0), description.slice(0, 4000), JSON.stringify({ command: 78901 }), stamp());
      return { value: { stored: true, bytes: description.length }, data: null };
    });
  }

  function channelPush(request) {
    const messageId = Number(request?.message_id ?? 0);
    if (!Number.isSafeInteger(messageId) || messageId <= 0) throw new GameError(1, 'Invalid channel push message id');
    const isOpen = Boolean(request?.is_open);
    return store.transaction((model, db) => {
      db.prepare('INSERT OR REPLACE INTO role_channel_push (role_id,message_id,is_open,updated_at) VALUES (?,?,?,?)')
        .run(model.state.roleId, messageId, isOpen ? 1 : 0, stamp());
      return { value: { messageId, isOpen }, data: null };
    });
  }

  function loginChannelPush() {
    const model = store.read();
    const module = new Map(model.state.modules.value).get(173);
    const bytes = module ? rawBinary(module) : Buffer.alloc(0);
    const data = bytes.length ? codec.unpack('pb_channel_push_param', bytes) : {};
    data.open_list = store.inspect(db => db.prepare('SELECT message_id,is_open FROM role_channel_push WHERE role_id=? ORDER BY message_id').all(model.state.roleId))
      .map(row => ({ message_id: Number(row.message_id), is_open: row.is_open === 1 }));
    return codec.pack('pb_channel_push_param', data);
  }

  async function gmCommand(input) {
    if (!gmEnabled()) throw new GameError(403, 'GM commands are disabled');
    const map = termMap(input) ?? {};
    const command = String(map.command ?? map.cmd ?? termText(input) ?? 'status');
    const args = map.args && typeof map.args === 'object' ? map.args : map;
    const result = store.transaction((model, db) => {
      const roleId = model.state.roleId;
      let value;
      if (command === 'status') {
        value = {
          role_id: roleId,
          level: Number(model.role.level ?? 0),
          name: roleName(model.role),
          power: String(model.state.rolePower?.power ?? '0')
        };
      } else if (command === 'grant') {
        const tid = Number(args.tid ?? 0);
        const num = Number(args.num ?? 0);
        if (!Number.isSafeInteger(tid) || tid <= 0 || !Number.isSafeInteger(num) || num <= 0) {
          throw new GameError(1, 'GM grant requires tid and num');
        }
        const granted = grantResources(model, awardPairs([{ tid, num }]), tables);
        value = { granted: granted.changes.length, tid, num };
      } else if (command === 'set_level') {
        const level = Number(args.level ?? 0);
        if (!Number.isSafeInteger(level) || level < 1 || level > maxRoleLevel()) throw new GameError(1, 'Invalid GM level');
        model.role.level = level;
        value = { level };
      } else if (command === 'grant_figure') {
        const kind = String(args.kind ?? '');
        const tid = Number(args.tid ?? 0);
        if (!['head', 'frame', 'title', 'bubble'].includes(kind) || !figureRow(kind, tid)) {
          throw new GameError(1, 'GM figure grant requires a configured kind and tid');
        }
        db.prepare('INSERT OR REPLACE INTO role_figure_items (role_id,kind,tid,expire_time,red,source,created_at) VALUES (?,?,?,?,?,?,?)')
          .run(roleId, kind, tid, Number(args.expire_time ?? 0), 1, 'gm', stamp());
        value = { kind, tid };
      } else {
        throw new GameError(1, 'Unsupported GM command');
      }
      audit(db, roleId, command, value);
      return value;
    });
    const term = new E.OtpErlangMap(new Map(Object.entries(result).map(([key, value]) => [
      new E.OtpErlangBinary(Buffer.from(key, 'utf8')),
      typeof value === 'number' || typeof value === 'boolean' ? value : new E.OtpErlangBinary(Buffer.from(String(value), 'utf8'))
    ])));
    log({ event: 'gm_command_committed', command });
    return { value: result, etfTerm: term };
  }

  async function execute(type, context = {}) {
    const command = Number(type);
    switch (command) {
      case 10: return gmCommand(context.etf);
      case 104: return recordSundry(context.etf);
      case 105: return recordPassAllMission(context.etf);
      case 106: return requestRoleList();
      case 109:
        log({ event: 'role_net_checked', type: command });
        // req_ensure_net_ok is the final connectivity gate after hall
        // initialization. Returning null data suppressed the reply entirely,
        // leaving the client spinner waiting for seq 18. An empty frame is the
        // successful application-level acknowledgement for this ETF command.
        return { value: { ok: true }, data: Buffer.alloc(0) };
      case 110: return setRecommendLevel(context.etf);
      case 111: return checkVeteran();
      case 112: return veteranSkip();
      case 161: return playerData(context.request);
      case 1301: return setRoleNameCommand(context.etf);
      case 1302: return randomRoleName();
      case 1303: return levelReward();
      case 1304: return setFigure(context.etf);
      case 1305: return activeTitle(context.etf);
      case 1306: return roleTitleAttr();
      case 1307: return checkSameName(context.etf);
      case 1308: return refreshFigureRed();
      case 1309: return setFigureSex(context.etf);
      case 1310: return setFigureStyle(context.etf);
      case 1311: return setRoleNameSex(context.etf);
      case 1312: return upRank();
      case 1313: return rankAward();
      case 1314: return refreshPower();
      case 1315: return setChatBubble(context.etf);
      case 1317: return watchVideoAward();
      case 39001: return saveRedDots(context.request);
      case 78901: return clientLog(context.etf);
      case 98201: return channelPush(context.request);
      default: throw new GameError(1, 'Unsupported role command');
    }
  }

  return {
    supports: type => SUPPORTED.has(Number(type)),
    execute,
    loginRedDots,
    loginChannelPush,
    recordSundry,
    levelReward,
    setRoleName: setRoleNameCommand
  };
}

export function awardPairs(list) {
  const pairs = new Map();
  for (const entry of Array.isArray(list) ? list : []) {
    const tid = Number(Array.isArray(entry) ? entry[0] : entry?.tid ?? entry?.id ?? 0);
    const num = Number(Array.isArray(entry) ? entry[1] : entry?.num ?? entry?.count ?? 0);
    if (!Number.isSafeInteger(tid) || tid <= 0 || !Number.isSafeInteger(num) || num <= 0) continue;
    pairs.set(tid, (pairs.get(tid) ?? 0) + num);
  }
  return pairs;
}
