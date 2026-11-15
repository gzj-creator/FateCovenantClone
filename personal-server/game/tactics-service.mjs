import { readTacticsTables } from '../config/tactics-tables.mjs';
import { consumeResources, grantResources } from './resources.mjs';
import { GameError } from './hero-progression.mjs';
import { readTacticsState, writeTacticsLevels } from './tactics-state.mjs';

const COMMAND_LEVEL_UP = 84501;
const COMMAND_RESET_CHAPTER = 84502;
const SUPPORTED = Object.freeze([COMMAND_LEVEL_UP, COMMAND_RESET_CHAPTER]);

const CODE_INVALID = 1;
const CODE_STATE = 5;

const fail = (code, message) => { throw new GameError(code, message); };

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) fail(CODE_INVALID, `Invalid ${label}`);
  return number;
}

export function createTacticsService({
  store, codec, tables = readTacticsTables(), resourceTables = null,
  now = Date.now, logger = () => {}
}) {
  const log = event => { try { logger(event); } catch {} };

  function ensureLoginState() {
    const model = store.read();
    const state = readTacticsState({ model, codec, tables });
    return {
      persisted: state.persisted,
      chapterCount: state.master?.info_list?.length ?? 0,
      leveledNodes: [...state.levels.values()].filter(level => level > 0).length
    };
  }

  function levelUp(tidInput) {
    const tid = positiveInteger(tidInput, 'tactics node tid');
    const config = tables.nodeForTid(tid);
    if (!config) fail(CODE_STATE, 'Tactics node is not configured');

    return store.transaction(model => {
      const state = readTacticsState({ model, codec, tables });
      const currentLevel = state.levels.get(tid) ?? 0;
      if (currentLevel >= tables.levelsPerNode) fail(CODE_STATE, 'Tactics node is already at maximum level');

      if (config.parentNode !== 0) {
        const parent = tables.nodeForTid(config.parentNode);
        if (!parent) fail(CODE_STATE, 'Tactics parent node is not configured');
        const parentLevel = state.levels.get(parent.tid) ?? 0;
        if (parentLevel < config.openNext) {
          fail(CODE_STATE, `Tactics node ${tid} requires parent ${parent.tid} level ${config.openNext}`);
        }
      } else if (config.chapter > 1) {
        const previousChapter = config.chapter - 1;
        const previous = tables.chapterForTid(previousChapter);
        if (!previous) fail(CODE_STATE, 'Tactics previous chapter is not configured');
        const previousPoints = tables.totalPoints(state.levels, previousChapter);
        if (previousPoints < previous.openNext) {
          fail(CODE_STATE, `Tactics chapter ${config.chapter} requires ${previousPoints}/${previous.openNext} points in chapter ${previousChapter}`);
        }
      }

      const nextLevel = currentLevel + 1;
      const attrTid = config.levelAttrs[nextLevel - 1];
      const attr = tables.attrForTid(attrTid);
      if (!attr) fail(CODE_STATE, 'Tactics level attribute is not configured');
      const consumed = consumeResources(model, [[attr.costItem, attr.cost]], 301, { codec, now });

      state.levels.set(tid, nextLevel);
      writeTacticsLevels(model, codec, tables, state.levels);
      const value = {
        node_info: { node_tid: tid, level: nextLevel },
        res: { changes: consumed.changes, is_overflow: false }
      };
      const data = codec.pack('pb_tactics_level_up_back', value);
      log({
        event: 'tactics_level_up_committed',
        tid,
        chapter: config.chapter,
        parentTid: config.parentNode,
        from: currentLevel,
        to: nextLevel,
        costItem: attr.costItem,
        costNum: attr.cost,
        attrTid,
        chapterPoints: tables.totalPoints(state.levels, config.chapter)
      });
      return {
        schema: 'pb_tactics_level_up_back',
        value,
        data,
        valueForLog: {
          tid,
          chapter: config.chapter,
          from: currentLevel,
          to: nextLevel,
          costItem: attr.costItem,
          costNum: attr.cost
        }
      };
    });
  }

  function resetChapter(chapterInput) {
    const chapterTid = positiveInteger(chapterInput, 'tactics chapter tid');
    const chapter = tables.chapterForTid(chapterTid);
    if (!chapter) fail(CODE_STATE, 'Tactics chapter is not configured');

    return store.transaction(model => {
      const state = readTacticsState({ model, codec, tables });
      const points = tables.totalPoints(state.levels, chapterTid);
      if (points === 0) fail(CODE_STATE, `Tactics chapter ${chapterTid} has no points to reset`);

      // TacticsForm.ResReqResetChapter only sends a chapter id.  The original
      // Client and client immediately refresh the tactics point item from the
      // response.  The only spendable resource in every Attr row is
      // TID_TACTICS_POINT, so the chapter reset refunds exactly the sum of the
      // configured costs of every currently-owned level in that chapter.
      let refund = 0;
      for (const node of tables.nodesByChapter.get(chapterTid)) {
        const level = state.levels.get(node.tid) ?? 0;
        for (let index = 0; index < level; index += 1) {
          const attr = tables.attrForTid(node.levelAttrs[index]);
          if (!attr || attr.costItem !== tables.tacticsPointItem) {
            fail(CODE_STATE, `Tactics reset cost for node ${node.tid} level ${index + 1} is invalid`);
          }
          refund += attr.cost;
          if (!Number.isSafeInteger(refund)) fail(CODE_STATE, 'Tactics reset refund exceeds the supported integer range');
        }
        state.levels.set(node.tid, 0);
      }
      if (!resourceTables?.Item) fail(CODE_STATE, 'Tactics reward resource tables are unavailable');
      const granted = grantResources(
        model,
        [[tables.tacticsPointItem, refund]],
        resourceTables,
        { codec, now }
      );
      const master = writeTacticsLevels(model, codec, tables, state.levels);
      const value = { master_info: master, res: { changes: granted.changes, is_overflow: false } };
      const data = codec.pack('pb_tactics_reset_back', value);
      log({
        event: 'tactics_chapter_reset_committed',
        chapterTid,
        refund,
        resetPoints: points
      });
      return {
        schema: 'pb_tactics_reset_back',
        value,
        data,
        valueForLog: { chapterTid, refund, resetPoints: points }
      };
    });
  }

  async function decode(type, data, { etf } = {}) {
    const commandType = Number(type);
    if (!SUPPORTED.includes(commandType)) fail(CODE_INVALID, 'Unsupported tactics command');
    if (typeof etf !== 'function') fail(CODE_STATE, 'Tactics ETF decoder is unavailable');
    const input = Buffer.from(data ?? Buffer.alloc(0));
    if (!input.length) fail(CODE_INVALID, 'Tactics request is empty');
    let decoded;
    try { decoded = await etf(input); }
    catch { fail(CODE_INVALID, 'Tactics request is not valid ETF'); }
    const candidate = Array.isArray(decoded)
      ? decoded.length === 1 ? decoded[0] : undefined
      : decoded;
    return positiveInteger(candidate, 'tactics node tid');
  }

  function execute(type, input) {
    const commandType = Number(type);
    if (commandType === COMMAND_LEVEL_UP) return levelUp(input);
    if (commandType === COMMAND_RESET_CHAPTER) return resetChapter(input);
    fail(CODE_INVALID, 'Unsupported tactics command');
  }

  return {
    supports: type => SUPPORTED.includes(Number(type)),
    isEtfRequest: type => SUPPORTED.includes(Number(type)),
    requestSchema: () => null,
    responseSchema: type => Number(type) === COMMAND_LEVEL_UP
      ? 'pb_tactics_level_up_back' : 'pb_tactics_reset_back',
    ensureLoginState,
    decode,
    execute
  };
}

export const TACTICS_COMMANDS = SUPPORTED;
