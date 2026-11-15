import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';

// The shipped ModuleTable binds TacticsMgr to tid 125 (project/tactics), and the
// verified Mgr login slots follow the table tid (152 HeroBlazon, 154
// HeroLegendBook, 162 MysteryShop). Slot 19 is res_recharge_login: writing
// tactics there replaced the wallet's cumulative-recharge payload and made the
// next login reject the module, so tactics moved to its own table row.
export const TACTICS_MODULE_ID = 125;
const TACTICS_MASTER_SCHEMA = 'pb_tactics_master';
const CODE_STATE = 5;

const fail = (message) => { throw new GameError(CODE_STATE, message); };

function stateInteger(value, label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value ?? 0);
  if (!Number.isSafeInteger(number) || number < min || number > max) fail(`Invalid ${label}`);
  return number;
}

function moduleBytes(module) {
  if (!module) return Buffer.alloc(0);
  if (Array.isArray(module.value) || module.value?.type !== 'Buffer' || module.bits !== 8) {
    fail('Tactics login module is not a scalar binary payload');
  }
  try {
    return rawBinary(module);
  } catch {
    fail('Tactics login module is malformed');
  }
}

function zeroLevels(tables) {
  return new Map([...tables.nodes.keys()].map(tid => [tid, 0]));
}

function nodeInfo(tid, level) {
  return { node_tid: tid, level };
}

export function canonicalTacticsMaster(tables, levels) {
  const infoList = [];
  for (const chapterTid of tables.chapterTids) {
    const root = tables.rootForChapter(chapterTid);
    const chapterNodes = tables.nodesByChapter.get(chapterTid);
    const subList = chapterNodes.map(node => nodeInfo(
      node.tid,
      stateInteger(levels.get(node.tid), `tactics node ${node.tid} level`, {
        min: 0,
        max: tables.levelsPerNode
      })
    ));
    infoList.push({
      chapter_tid: chapterTid,
      root_node: nodeInfo(root.tid, stateInteger(levels.get(root.tid), `tactics root ${root.tid} level`, {
        min: 0,
        max: tables.levelsPerNode
      })),
      // TacticsMgr.InitData consumes sub_list and does not read root_node. The
      // root therefore appears in both fields so its saved level survives login
      // while the dedicated root_node field remains populated for the PB schema.
      sub_list: subList
    });
  }
  return { info_list: infoList };
}

export function readTacticsState({ model, codec, tables }) {
  const modules = new Map(model.state.modules.value);
  const module = modules.get(TACTICS_MODULE_ID) ?? null;
  const bytes = moduleBytes(module);
  if (!bytes.length) {
    return { modules, module, bytes, levels: zeroLevels(tables), master: null, persisted: false };
  }

  let master;
  try {
    master = codec.unpack(TACTICS_MASTER_SCHEMA, bytes);
  } catch {
    fail('Tactics login data is invalid');
  }
  if (!master || typeof master !== 'object' || !Array.isArray(master.info_list)) {
    fail('Tactics login chapter list is invalid');
  }

  const levels = zeroLevels(tables);
  const seenChapters = new Set();
  const seenNodes = new Set();
  const applyNode = (rawNode, chapterTid, source) => {
    if (!rawNode || typeof rawNode !== 'object') fail(`Tactics ${source} is invalid`);
    const tid = stateInteger(rawNode.node_tid, `tactics ${source} node tid`, { min: 1 });
    const config = tables.nodeForTid(tid);
    if (!config) fail(`Tactics login data contains unknown node ${tid}`);
    if (config.chapter !== chapterTid) fail(`Tactics node ${tid} is in the wrong chapter`);
    const level = stateInteger(rawNode.level, `tactics node ${tid} level`, { min: 0, max: tables.levelsPerNode });
    if (seenNodes.has(tid)) {
      if (levels.get(tid) !== level) fail(`Tactics node ${tid} is duplicated with different levels`);
      return;
    }
    seenNodes.add(tid);
    levels.set(tid, level);
  };

  for (const chapter of master.info_list) {
    if (!chapter || typeof chapter !== 'object') fail('Tactics login chapter is invalid');
    const chapterTid = stateInteger(chapter.chapter_tid, 'tactics login chapter tid', { min: 1 });
    if (!tables.chapterForTid(chapterTid)) fail(`Tactics login data contains unknown chapter ${chapterTid}`);
    if (seenChapters.has(chapterTid)) fail(`Tactics chapter ${chapterTid} is duplicated`);
    seenChapters.add(chapterTid);
    if (!Array.isArray(chapter.sub_list)) fail(`Tactics chapter ${chapterTid} sub list is invalid`);

    if (chapter.root_node !== undefined && chapter.root_node !== null) {
      const rootTid = stateInteger(chapter.root_node.node_tid, `tactics chapter ${chapterTid} root node`, { min: 1 });
      const expected = tables.rootForChapter(chapterTid);
      if (rootTid !== expected.tid) fail(`Tactics chapter ${chapterTid} has the wrong root node`);
      applyNode(chapter.root_node, chapterTid, `chapter ${chapterTid} root`);
    }
    for (const node of chapter.sub_list) applyNode(node, chapterTid, `chapter ${chapterTid} sub node`);
  }

  return { modules, module, bytes, levels, master, persisted: true };
}

export function writeTacticsLevels(model, codec, tables, levels) {
  const modules = new Map(model.state.modules.value);
  const master = canonicalTacticsMaster(tables, levels);
  modules.set(TACTICS_MODULE_ID, serializedBinary(codec.pack(TACTICS_MASTER_SCHEMA, master)));
  model.state.modules.value = [...modules];
  return master;
}

export function collectTacticsBaseValues({ model, codec, tables }) {
  const state = readTacticsState({ model, codec, tables });
  return tables.collectBaseValues(state.levels);
}

export { TACTICS_MASTER_SCHEMA };
