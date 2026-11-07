import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { consumeResources } from './resources.mjs';
import { readHeroBondTables } from '../config/hero-bond-tables.mjs';

// HeroCmd 602 (req_choose_hero_school), 654 (req_active_fetter), 661
// (req_hero_diff) and 672 (req_hero_select_pendant). The shared dispatch in
// gateway.mjs owns request decoding/response framing; this module owns the
// business rules for its own type list.
// Contract: agent/workflow/gameplay-completion/HERO-HERO-B/service-contract.md
const COMMAND_CHOOSE_SCHOOL = 602;
const COMMAND_ACTIVE_FETTER = 654;
const COMMAND_HERO_DIFF = 661;
const COMMAND_SELECT_PENDANT = 672;
const SUPPORTED = [COMMAND_CHOOSE_SCHOOL, COMMAND_ACTIVE_FETTER, COMMAND_HERO_DIFF, COMMAND_SELECT_PENDANT];

const HERO_MODULE_ID = 10;
// HeroDataMgr.LoginParse decodes module 10 zero-based: [0] pb_hero_info,
// [1] numeric res, [2] pb_hero_draw_info, ... recruit-service reads and writes
// the same slot 2, so the school choice lands in the authoritative draw record.
const DRAW_INFO_SLOT = 2;
// HeroTable.TID_QUALITY_DRAW_LIB = 2. Evidence: HeroTable.lua bytecode assigns
// TID_NORMAL_DRAW_LIB=1, TID_QUALITY_DRAW_LIB=2, TID_LOVE_DRAW_LIB=3, and
// HeroDataMgr:GetCurChooseSchool reads custom_choose_index from the recruit
// record of that draw lib.
const QUALITY_DRAW_LIB = 2;
// FetterEffectCondition 101 dispatches to HeroFetterMgr.GatherHeroCondition,
// the only condition a normal gather fetter can satisfy on its own; 201-207 are
// lineup-scoped and computed from the current lineup.
const FETTER_CONDITION_GATHER = 101;
const FETTER_TABLE = 'hero_bond_fetter_activation';
const MAX_UINT32 = 0xffffffff;

const CODE_INVALID = 1;
const CODE_STATE = 5;
const CODE_INSUFFICIENT = 301;
const CODE_LOCKED = 305;
const CODE_CONTENT = 3001;

const fail = (code, message) => { throw new GameError(code, message); };

function positiveId(value, field) {
  const id = Number(value ?? 0);
  if (!Number.isSafeInteger(id) || id <= 0 || id > MAX_UINT32) fail(CODE_INVALID, 'Invalid hero ' + field);
  return id;
}

function heroUidValue(value) {
  const uid = Number(value ?? 0);
  if (!Number.isSafeInteger(uid) || uid <= 0) fail(CODE_INVALID, 'Invalid hero uid');
  return uid;
}

function ensureTables(db) {
  db.exec('CREATE TABLE IF NOT EXISTS ' + FETTER_TABLE + ' ('
    + 'role_id INTEGER NOT NULL,'
    + 'hero_tid INTEGER NOT NULL,'
    + 'fetter_idx INTEGER NOT NULL,'
    + 'activated_at TEXT NOT NULL,'
    + 'PRIMARY KEY(role_id, hero_tid, fetter_idx))');
}

function tidList(entry) {
  const list = Array.isArray(entry) ? entry : [entry];
  return list
    .map(value => Number(value))
    .filter(value => Number.isSafeInteger(value) && value > 0);
}

export function createHeroBondService({ store, codec, tables, heroTables, bondTables = readHeroBondTables(), now = () => Date.now(), random = Math.random, logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };
  void random;
  void tables;
  const fetterTable = bondTables.Fetter;
  const diffTable = bondTables.Diff;
  const schoolTable = bondTables.SchoolChoose;
  if (!fetterTable?.size) throw new Error('Hero fetter configuration is missing');
  if (!diffTable?.size) throw new Error('Hero diff configuration is missing');
  if (!schoolTable?.size) throw new Error('Hero school configuration is missing');
  const schoolConst = bondTables.SchoolChooseConst?.get(1);
  store.inspect(db => ensureTables(db));

  function currentSeconds() {
    const value = Number(now());
    if (!Number.isFinite(value)) fail(CODE_STATE, 'Hero bond clock is invalid');
    return value > 100000000000 ? Math.floor(value / 1000) : Math.floor(value);
  }

  function heroByUid(model, uid) {
    const hero = (model.heroInfo.hero_list ?? []).find(entry => Number(entry.uid) === uid);
    if (!hero) fail(CODE_CONTENT, 'Hero does not exist');
    return hero;
  }

  function ownedHeroByTid(model, tid) {
    const hero = (model.heroInfo.hero_list ?? []).find(entry => Number(entry.tid) === tid);
    if (!hero) fail(CODE_CONTENT, 'Hero is not owned');
    return hero;
  }

  // HeroDataMgr:GetRecruitTid(lib) = Draw[lib].is_record_by_type ?
  // Draw[lib].draw_type : lib, and GetRecruitInfoByDrawLib keys recruitInfos by
  // that value.
  function recruitRecordTid(lib) {
    const draw = heroTables?.Draw?.get(lib);
    return draw?.is_record_by_type ? Number(draw.draw_type) : lib;
  }

  function schoolRow(index) {
    const direct = schoolTable.get(index);
    if (direct) return direct;
    // Defensive fallback: the generated SchoolChooseByIndex index maps the first
    // SchoolChooseCount positions onto the rows in file order.
    const row = [...schoolTable.values()][index - 1];
    if (!row) fail(CODE_CONTENT, 'Hero school configuration is missing for index ' + index);
    return row;
  }

  function readDrawInfo(module) {
    const bytes = module.value[DRAW_INFO_SLOT] ? rawBinary(module.value[DRAW_INFO_SLOT]) : Buffer.alloc(0);
    const info = bytes.length ? codec.unpack('pb_hero_draw_info', bytes) : { recruit_list: [], achieve_list: [] };
    info.recruit_list ??= [];
    info.achieve_list ??= [];
    return info;
  }

  function writeDrawInfo(model, modules, module, info) {
    while (module.value.length <= DRAW_INFO_SLOT) module.value.push(serializedBinary(Buffer.alloc(0)));
    module.value[DRAW_INFO_SLOT] = serializedBinary(codec.pack('pb_hero_draw_info', info));
    model.state.modules.value = [...modules];
  }

  // 602: the client sends the SchoolChoose index, stores the returned
  // pb_hero_recruit as recruitInfos[recruit.tid] and fires
  // HeroDataMgr.EVT_HERO_CHOOSE_SCHOOL_FINISH. custom_choose_index is the only
  // persisted output: HeroDataMgr:GetCurChooseSchool reads it back and
  // HaveSchoolChooseHero derives the promised hero from SchoolChoose.fix_hero.
  function chooseSchool(input) {
    const index = positiveId(input?.index, 'school index');
    const row = schoolRow(index);
    return store.transaction(model => {
      const modules = new Map(model.state.modules.value);
      const module = modules.get(HERO_MODULE_ID);
      if (!module || !Array.isArray(module.value)) fail(CODE_STATE, 'Hero login module is missing');
      const drawInfo = readDrawInfo(module);
      const recordTid = recruitRecordTid(QUALITY_DRAW_LIB);
      let record = drawInfo.recruit_list.find(info =>
        Number(info.tid) === recordTid || Number(info.draw_lib) === QUALITY_DRAW_LIB);
      if (!record) {
        // The client only replaces its cached copy, so a fresh account can choose
        // before recruit-service ever wrote the record.
        record = { tid: recordTid, draw_lib: String(QUALITY_DRAW_LIB), custom_choose_index: 0, draw_count: 0 };
        drawInfo.recruit_list.push(record);
      }
      if (Number(record.custom_choose_index ?? 0) !== 0) fail(CODE_STATE, 'Hero school has already been chosen');
      // HeroDrawUILogic:CheckSchoolChooseOpen only offers the form once the
      // quality draw lib reached SchoolChooseConst.hit draws.
      const hit = Number(schoolConst?.hit ?? 0);
      if (hit > 0 && Number(record.draw_count ?? 0) < hit) fail(CODE_STATE, 'Hero school requires ' + hit + ' quality draws first');
      record.custom_choose_index = index;
      writeDrawInfo(model, modules, module, drawInfo);
      const value = record;
      const data = codec.pack('pb_hero_recruit', value);
      log({ event: 'hero_school_chosen', index, fixHero: Number(row.fix_hero ?? 0), recordTid });
      return {
        schema: 'pb_hero_recruit', value, data,
        valueForLog: { index, fixHero: Number(row.fix_hero ?? 0), recordTid }
      };
    });
  }

  // 654: HeroFetterMgr:ReqActivateNormalFetter validates
  // GetDefaultFetter(heroTid).gathers[fetterIdx].success and sends the request
  // with an empty callback, so the client never decodes a response.
  function activeFetter(input) {
    const heroTid = positiveId(input?.hero_tid, 'fetter hero tid');
    const fetterIdx = positiveId(input?.fetter_idx, 'fetter index');
    const config = fetterTable.get(heroTid);
    if (!config) fail(CODE_LOCKED, 'Hero has no normal fetter configuration');
    const gathers = Array.isArray(config.gather_args) ? config.gather_args : [];
    const conditions = Array.isArray(config.gather_condition) ? config.gather_condition : [];
    if (fetterIdx > gathers.length) fail(CODE_CONTENT, 'Hero fetter index is out of range');
    const condition = Number(conditions[fetterIdx - 1] ?? 0);
    if (condition !== FETTER_CONDITION_GATHER) fail(CODE_LOCKED, 'Hero fetter is not a gather fetter');
    const gatherHeroes = tidList(gathers[fetterIdx - 1]);
    if (!gatherHeroes.length) fail(CODE_STATE, 'Hero fetter gather list is empty');
    return store.transaction((model, db) => {
      ownedHeroByTid(model, heroTid);
      const missing = gatherHeroes.filter(tid => !(model.heroInfo.hero_list ?? []).some(hero => Number(hero.tid) === tid));
      if (missing.length) fail(CODE_STATE, 'Hero fetter gather heroes are not owned: ' + missing.join(','));
      const existing = db.prepare('SELECT fetter_idx FROM ' + FETTER_TABLE + ' WHERE role_id=? AND hero_tid=? AND fetter_idx=?')
        .get(model.state.roleId, heroTid, fetterIdx);
      if (existing) fail(CODE_STATE, 'Hero fetter is already activated');
      db.prepare('INSERT INTO ' + FETTER_TABLE + '(role_id,hero_tid,fetter_idx,activated_at) VALUES(?,?,?,?)')
        .run(model.state.roleId, heroTid, fetterIdx, new Date(currentSeconds() * 1000).toISOString());
      const value = { hero_tid: heroTid, fetter_idx: fetterIdx, gather_heroes: gatherHeroes };
      const data = Buffer.alloc(0);
      log({ event: 'hero_fetter_activated', heroTid, fetterIdx, gatherHeroes });
      return { schema: null, value, data, valueForLog: { heroTid, fetterIdx } };
    });
  }

  // 661: HeroDiffMgr:ReqDiff(uid) sends the hero uid; the response
  // pb_hero_diff_back is applied as hero:InitBySrcHero(new_hero) plus
  // AwardKit.Parse(res). Hero:IsDiff only tests diff > 0, so the persisted
  // marker is 1 for the single Diff row owned by that hero.
  function heroDiff(input) {
    const uid = heroUidValue(input?.uid);
    return store.transaction(model => {
      const hero = heroByUid(model, uid);
      const config = diffTable.get(Number(hero.tid));
      if (!config) fail(CODE_LOCKED, 'Hero diff is not available for this hero');
      if (Number(hero.diff ?? 0) > 0) fail(CODE_STATE, 'Hero has already been diffed');
      const itemTid = Number(config.diff_item ?? 0);
      const itemNum = Number(config.diff_num ?? 0);
      if (!Number.isSafeInteger(itemTid) || itemTid <= 0 || !Number.isSafeInteger(itemNum) || itemNum <= 0) {
        fail(CODE_STATE, 'Hero diff cost configuration is missing');
      }
      const spent = consumeResources(model, [[itemTid, itemNum]], CODE_INSUFFICIENT, { codec });
      hero.diff = 1;
      const value = { res: { changes: spent.changes, is_overflow: false }, new_hero: hero };
      const data = codec.pack('pb_hero_diff_back', value);
      log({ event: 'hero_diff_committed', uid, heroTid: Number(hero.tid), itemTid, itemNum });
      return {
        schema: 'pb_hero_diff_back', value, data,
        valueForLog: { uid, heroTid: Number(hero.tid), itemTid, itemNum }
      };
    });
  }

  // 672: pb_hero_select_pendant_req{hero_uid, pendants[{index=part_type,
  // pendant_tid}]}. HeroDataUtils.TryAddPendantCfg rejects a pendant whose
  // part_type differs from the selected part and whose unlock_star is above the
  // hero star; hero.pendant_select_list (hero field 27) is the stored result.
  function selectPendant(input) {
    const uid = heroUidValue(input?.hero_uid);
    const requested = Array.isArray(input?.pendants) ? input.pendants : [];
    if (!requested.length) fail(CODE_INVALID, 'Hero pendant selection is empty');
    const changes = new Map();
    for (const entry of requested) {
      const partType = positiveId(entry?.index, 'pendant part type');
      if (!bondTables.PendantPartType?.has(partType)) fail(CODE_CONTENT, 'Hero pendant part type is unknown');
      const rawTid = Number(entry?.pendant_tid ?? 0);
      if (!Number.isSafeInteger(rawTid) || rawTid < 0) fail(CODE_INVALID, 'Invalid hero pendant tid');
      if (changes.has(partType)) fail(CODE_INVALID, 'Duplicate hero pendant part type');
      changes.set(partType, rawTid);
    }
    return store.transaction(model => {
      const hero = heroByUid(model, uid);
      const star = Number(hero.star ?? 0);
      const current = new Map();
      for (const entry of Array.isArray(hero.pendant_select_list) ? hero.pendant_select_list : []) {
        const partType = Number(entry?.index ?? 0);
        const pendantTid = Number(entry?.pendant_tid ?? 0);
        if (Number.isSafeInteger(partType) && partType > 0) current.set(partType, pendantTid);
      }
      const starRow = [...(bondTables.StarPendant?.values() ?? [])]
        .find(row => Number(row?.hero) === Number(hero.tid) && Number(row?.star) === star);
      for (const [partType, pendantTid] of changes) {
        if (pendantTid === 0) { current.delete(partType); continue; }
        const config = bondTables.Pendant?.get(pendantTid);
        if (!config) fail(CODE_CONTENT, 'Hero pendant configuration is missing');
        if (Number(config.part_type ?? 0) !== partType) fail(CODE_INVALID, 'Hero pendant part type does not match the selection');
        if (Number(config.unlock_star ?? 0) > star) fail(CODE_LOCKED, 'Hero pendant is still locked');
        const unlockItem = Number(config.unlock_item ?? 0);
        if (unlockItem > 0 && BigInt(model.resources.get(String(unlockItem))?.num ?? 0) <= 0n) {
          fail(CODE_LOCKED, 'Hero pendant unlock item is missing');
        }
        if (starRow && Array.isArray(starRow.pendant) && !tidList(starRow.pendant).includes(pendantTid)) {
          fail(CODE_LOCKED, 'Hero pendant is not available at this star');
        }
        current.set(partType, pendantTid);
      }
      const value = {
        pendants: [...current].sort((left, right) => left[0] - right[0])
          .map(([index, pendantTid]) => ({ index, pendant_tid: String(pendantTid) }))
      };
      hero.pendant_select_list = value.pendants.map(entry => ({ index: entry.index, pendant_tid: entry.pendant_tid }));
      const data = codec.pack('pb_hero_select_pendant_rsp', value);
      log({ event: 'hero_pendant_selected', uid, heroTid: Number(hero.tid), parts: value.pendants.length });
      return {
        schema: 'pb_hero_select_pendant_rsp', value, data,
        valueForLog: { uid, heroTid: Number(hero.tid), parts: value.pendants.length }
      };
    });
  }

  async function singleValue(helpers, raw, message) {
    let decoded;
    try {
      decoded = await helpers.etf(raw);
    } catch {
      fail(CODE_INVALID, message);
    }
    const candidate = Array.isArray(decoded) ? (decoded.length === 1 ? decoded[0] : undefined) : decoded;
    const value = Number(candidate);
    if (!Number.isSafeInteger(value) || value <= 0) fail(CODE_INVALID, message);
    return value;
  }

  return {
    supports: type => SUPPORTED.includes(Number(type)),
    async decode(type, raw, helpers) {
      switch (Number(type)) {
        case COMMAND_CHOOSE_SCHOOL:
          return { index: await singleValue(helpers, raw, 'Invalid hero school index') };
        case COMMAND_ACTIVE_FETTER:
          return helpers.unpack('pb_active_fetter_req', raw);
        case COMMAND_HERO_DIFF:
          return { uid: await singleValue(helpers, raw, 'Invalid hero diff hero id') };
        case COMMAND_SELECT_PENDANT: {
          const request = helpers.unpack('pb_hero_select_pendant_req', raw);
          return { hero_uid: request.hero_uid, pendants: request.pendants ?? [] };
        }
        default:
          return fail(CODE_INVALID, 'Invalid hero bond command');
      }
    },
    execute(type, input) {
      switch (Number(type)) {
        case COMMAND_CHOOSE_SCHOOL: return chooseSchool(input);
        case COMMAND_ACTIVE_FETTER: return activeFetter(input);
        case COMMAND_HERO_DIFF: return heroDiff(input);
        case COMMAND_SELECT_PENDANT: return selectPendant(input);
        default: return fail(CODE_INVALID, 'Invalid hero bond command');
      }
    }
  };
}
