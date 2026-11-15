import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { readCareerLifeTables } from '../config/career-life-tables.mjs';
import { readMissionTables } from '../config/mission-tables.mjs';
import { hasBit, setBit } from './bit-block.mjs';
import { GameError } from './hero-progression.mjs';

export const CAREER_LIFE_MODULE_ID = 153;
export const CAREER_LIFE_STORY_AWARD = 85804;

const MISSION_MODULE_ID = 8;
const CODE_INVALID = 1;
const CODE_STATE = 5;
const fail = (code, message) => { throw new GameError(code, message); };

function scalarBinary(module, label) {
  if (!module) return Buffer.alloc(0);
  if (Array.isArray(module.value) || module.value?.type !== 'Buffer' || module.bits !== 8) {
    fail(CODE_STATE, `${label} login module is not a scalar binary payload`);
  }
  try { return rawBinary(module); } catch { fail(CODE_STATE, `${label} login module is malformed`); }
}

function canonicalBytes(value, label) {
  if (value === undefined || value === null || value === '') return Buffer.alloc(0);
  if (typeof value !== 'string') fail(CODE_STATE, `${label} is not a protobuf bytes value`);
  const bytes = Buffer.from(value, 'base64');
  if (bytes.toString('base64') !== value) fail(CODE_STATE, `${label} is not canonical base64`);
  return bytes;
}

function trimBitBlock(bits) {
  let length = bits.length;
  while (length > 0 && bits[length - 1] === 0) length -= 1;
  return bits.subarray(0, length);
}

function validateStoryBits(bits, maxChapter) {
  if (hasBit(bits, 0)) fail(CODE_STATE, 'CareerLife story bitmap contains unknown chapter 0');
  for (let chapter = maxChapter + 1; chapter < bits.length * 8; chapter += 1) {
    if (hasBit(bits, chapter)) fail(CODE_STATE, `CareerLife story bitmap contains unknown chapter ${chapter}`);
  }
}

function normalizeState(raw, tables) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    fail(CODE_STATE, 'CareerLife login data is invalid');
  }
  const storyBits = canonicalBytes(raw.story_bin, 'CareerLife story_bin');
  validateStoryBits(storyBits, tables.maxChapter);
  // Preserve boss/pass state exactly while validating their protobuf bytes so a
  // story claim cannot canonicalize or erase unrelated progress.
  canonicalBytes(raw.boss_bin, 'CareerLife boss_bin');
  canonicalBytes(raw.pass_award, 'CareerLife pass_award');
  return { ...raw, story_bin: storyBits };
}

function protobufState(state) {
  return { ...state, story_bin: state.story_bin.toString('base64') };
}

export function createCareerLifeService({
  store,
  codec,
  tables = readCareerLifeTables(),
  missionTables = readMissionTables(),
  logger = () => {}
}) {
  const log = event => { try { logger(event); } catch {} };

  function readCareerState(model, { writeCanonical = false } = {}) {
    const modules = new Map(model.state.modules.value);
    const module = modules.get(CAREER_LIFE_MODULE_ID);
    const bytes = scalarBinary(module, 'CareerLife');
    let state;
    if (bytes.length) {
      try { state = codec.unpack('pb_career_life', bytes); }
      catch { fail(CODE_STATE, 'CareerLife login data is malformed'); }
    } else state = {};
    state = normalizeState(state, tables);
    if (writeCanonical && !bytes.length) {
      modules.set(CAREER_LIFE_MODULE_ID, serializedBinary(codec.pack('pb_career_life', protobufState(state))));
      model.state.modules.value = [...modules];
    }
    return { modules, state, changed: writeCanonical && !bytes.length };
  }

  function passedMission(model) {
    const module = new Map(model.state.modules.value).get(MISSION_MODULE_ID);
    if (!module || !Array.isArray(module.value) || !module.value[0]) {
      fail(CODE_STATE, 'CareerLife authoritative mission module is missing');
    }
    let mission;
    try { mission = codec.unpack('pb_mission', rawBinary(module.value[0])); }
    catch { fail(CODE_STATE, 'CareerLife authoritative mission module is malformed'); }
    const id = Number(mission?.mission_id ?? 0);
    if (!Number.isSafeInteger(id) || id < 0) fail(CODE_STATE, 'CareerLife mission cursor is invalid');
    return id;
  }

  function assertChapterPassed(chapter, currentMission) {
    const stories = tables.storiesByChapter.get(chapter);
    // CareerLife gates use Section.index directly. Story predecessor rows such
    // as 10201 intentionally carry is_discard=true, so the ordinary battle
    // progression cursor (which filters those rows) cannot be used here.
    const currentSection = currentMission === 0 ? null : missionTables.sections.get(currentMission);
    if (currentMission > 0 && !currentSection) fail(CODE_STATE, `CareerLife current mission ${currentMission} is not configured`);
    const passedIndex = currentSection ? Number(currentSection.index) : -1;
    if (!Number.isSafeInteger(passedIndex)) fail(CODE_STATE, 'CareerLife current mission index is invalid');
    for (const story of stories) {
      const requiredSection = missionTables.sections.get(story.open_mission);
      if (!requiredSection) {
        fail(CODE_STATE, `CareerLife story ${story.tid} mission ${story.open_mission} is not configured`);
      }
      const requiredIndex = Number(requiredSection.index);
      if (!Number.isSafeInteger(requiredIndex)) fail(CODE_STATE, `CareerLife story ${story.tid} mission index is invalid`);
      if (requiredIndex > passedIndex) {
        fail(CODE_STATE, `R1-CAREERLIFE-GATE: chapter ${chapter} requires mission ${story.open_mission}`);
      }
    }
  }

  function claim(chapter) {
    if (!Number.isSafeInteger(chapter) || !tables.chapters.has(chapter)) {
      fail(CODE_STATE, `R1-CAREERLIFE-CHAPTER: chapter ${chapter} is not configured`);
    }
    return store.transaction(model => {
      const { modules, state } = readCareerState(model);
      if (hasBit(state.story_bin, chapter)) {
        fail(CODE_STATE, `R1-CAREERLIFE-CLAIMED: chapter ${chapter} is already claimed`);
      }
      assertChapterPassed(chapter, passedMission(model));

      state.story_bin = trimBitBlock(setBit(state.story_bin, chapter));
      modules.set(CAREER_LIFE_MODULE_ID, serializedBinary(codec.pack('pb_career_life', protobufState(state))));
      model.state.modules.value = [...modules];
      const value = {
        career_life_info: protobufState(state),
        // StoryChapter rows 1..18 all carry res=0/res_count=0. The claim still
        // records the original story bitmap and returns AwardKit's empty result.
        res: { changes: [], is_overflow: false }
      };
      const data = codec.pack('pb_career_life_back', value);
      log({ event: 'career_life_story_award_committed', chapter });
      return { schema: 'pb_career_life_back', value, data, valueForLog: { chapter } };
    });
  }

  async function decode(type, data, { etf } = {}) {
    if (Number(type) !== CAREER_LIFE_STORY_AWARD) fail(CODE_INVALID, 'Unsupported CareerLife command');
    if (typeof etf !== 'function') fail(CODE_STATE, 'CareerLife ETF decoder is unavailable');
    let decoded;
    try { decoded = await etf(Buffer.from(data ?? Buffer.alloc(0))); }
    catch { fail(CODE_INVALID, 'CareerLife request is not valid ETF'); }
    const value = decoded?.value ?? decoded;
    const chapter = Array.isArray(value) && value.length === 1 ? Number(value[0]) : Number(value);
    if (!Number.isSafeInteger(chapter) || chapter <= 0) fail(CODE_INVALID, 'Invalid CareerLife chapter');
    return chapter;
  }

  function execute(type, chapter) {
    if (Number(type) !== CAREER_LIFE_STORY_AWARD) fail(CODE_INVALID, 'Unsupported CareerLife command');
    return claim(Number(chapter));
  }

  function ensureLoginState() {
    return store.transaction(model => {
      const { state, changed } = readCareerState(model, { writeCanonical: true });
      return { changed, chapters: tables.chapters.size, claimed: [...tables.chapters.keys()].filter(chapter => hasBit(state.story_bin, chapter)).length };
    });
  }

  return {
    supports: type => Number(type) === CAREER_LIFE_STORY_AWARD,
    isEtfRequest: type => Number(type) === CAREER_LIFE_STORY_AWARD,
    requestEncoding: 'etf',
    responseSchema: 'pb_career_life_back',
    decode,
    execute,
    ensureLoginState
  };
}
