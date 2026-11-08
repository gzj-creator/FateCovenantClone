import { GameError } from './hero-progression.mjs';
import {
  ensureCoopTables, guildContext, readDoc, writeDoc, toSeconds, asInteger, optionalInteger, etfArgs,
  decodeCoopRequest
} from './guild-coop-shared.mjs';

// SlgMapCmd 99100-99102. These commands maintain which map blocks the role has
// subscribed to and whether the role currently sits inside the SLG map. The
// block list is persisted so a reconnect restores the same subscription set;
// view pushes themselves still need a recovered push type before they can be
// emitted, which is recorded in the delivery notes.
export const SLG_MAP_COMMANDS = Object.freeze({ addBlockView: 99100, enter: 99101, leave: 99102 });
const SCOPE = 'slg_map';
const REQUEST_SCHEMAS = { 99100: 'pb_slg_map_view_req' };

export function createSlgMapService({ store, codec, coopTables, now = Date.now, logger = () => {} }) {
  const config = coopTables.slg;
  const log = event => { try { logger(event); } catch {} };
  const supported = new Set(Object.values(SLG_MAP_COMMANDS));

  function stateDoc(db, context, at) {
    const existing = readDoc(db, SCOPE, context.guildId, context.roleId, 'state');
    if (existing) return existing;
    return writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', { blocks: [], funTid: 0, enteredAt: 0 }, at);
  }

  function addBlockView(input) {
    const funTid = asInteger(input?.fun_tid, 'map function tid', { min: 1 });
    const blocks = Array.isArray(input?.block_list) ? input.block_list : [];
    if (!blocks.length) throw new GameError(1, 'Block list is empty');
    if (blocks.length > config.maxBlocksPerRequest) throw new GameError(1, 'Block list is too large');
    const ids = blocks.map(block => String(block).trim());
    if (ids.some(id => !/^[0-9]+$/.test(id))) throw new GameError(1, 'Invalid map block id');
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const doc = stateDoc(db, context, at);
      doc.funTid = funTid;
      doc.blocks = [...new Set([...(doc.blocks ?? []), ...ids])].slice(-256);
      writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', doc, at);
      return { data: Buffer.alloc(0), value: { funTid, blocks: doc.blocks.length } };
    });
  }

  function enter(input) {
    const args = etfArgs(input);
    if (args.length > 1) throw new GameError(1, 'Map enter takes at most one parameter');
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const doc = stateDoc(db, context, at);
      doc.enteredAt = at;
      if (args.length) doc.funTid = asInteger(args[0], 'map function tid', { min: 1 });
      writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', doc, at);
      return { data: Buffer.alloc(0), value: { enteredAt: at, funTid: doc.funTid } };
    });
  }

  function leave() {
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const doc = stateDoc(db, context, at);
      doc.enteredAt = 0;
      writeDoc(db, SCOPE, context.guildId, context.roleId, 'state', doc, at);
      return { data: Buffer.alloc(0), value: { left: true } };
    });
  }

  const handlers = { 99100: addBlockView, 99101: enter, 99102: leave };
  async function execute(type, bytes) {
    const command = Number(type);
    const handler = handlers[command];
    if (!handler) throw new GameError(1, 'Unknown SLG map command');
    const input = await decodeCoopRequest(codec, REQUEST_SCHEMAS, command, bytes);
    const result = handler(input);
    log({ event: 'slg_map_command', type: command, ...result.value });
    return result;
  }
  return { supports: type => supported.has(Number(type)), execute, commands: SLG_MAP_COMMANDS, requestSchemas: REQUEST_SCHEMAS };
}
