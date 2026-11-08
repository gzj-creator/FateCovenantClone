import { GameError } from './hero-progression.mjs';
import { termArray, termInt } from './role-service.mjs';
import { rawBinary } from '../protocol/game-codec.mjs';

const SUPPORTED = new Set([304, 305]);

export function createStoryService({ store, codec, now = Date.now, logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };
  const stamp = () => new Date(now()).toISOString();

  function idsOf(input) {
    const list = termArray(input);
    const single = termInt(input);
    const values = list ? list.map(termInt).filter(value => value !== null) : single === null ? [] : [single];
    return [...new Set(values)].filter(value => Number.isSafeInteger(value) && value > 0);
  }

  function record(input, status) {
    const ids = idsOf(input);
    if (!ids.length) throw new GameError(1, 'Story command requires at least one story id');
    return store.transaction((model, db) => {
      const roleId = model.state.roleId;
      const write = status === 'finished'
        ? db.prepare('INSERT INTO role_stories (role_id,story_id,status,updated_at) VALUES (?,?,?,?) ON CONFLICT(role_id,story_id) DO UPDATE SET status=excluded.status,updated_at=excluded.updated_at')
        : db.prepare('INSERT OR IGNORE INTO role_stories (role_id,story_id,status,updated_at) VALUES (?,?,?,?)');
      for (const id of ids) write.run(roleId, id, status, stamp());
      log({ event: status === 'finished' ? 'story_finished' : 'story_touched', count: ids.length });
      return { value: { ids, status }, data: null };
    });
  }

  function loginPayload() {
    const model = store.read();
    const module = new Map(model.state.modules.value).get(88);
    let existingTid = null;
    try { existingTid = module ? termInt(module.value?.[0]) : null; } catch {}
    const tid = Number.isSafeInteger(existingTid) && existingTid > 0 ? existingTid : 1;
    let previous = null;
    try {
      const bytes = module ? rawBinary(module.value?.[1]) : Buffer.alloc(0);
      if (bytes.length) previous = codec.unpack('story_data', bytes);
    } catch {}
    const finished = [...new Set([
      ...(Array.isArray(previous?.finish_story_list) ? previous.finish_story_list : []).map(Number),
      ...store.inspect(db => db.prepare("SELECT story_id FROM role_stories WHERE role_id=? AND status='finished' ORDER BY story_id").all(model.state.roleId))
        .map(row => Number(row.story_id))
    ])].filter(Number.isSafeInteger).sort((left, right) => left - right);
    return {
      tid,
      payload: codec.pack('story_data', { ...(previous ?? {}), tid, finish_story_list: finished })
    };
  }

  return {
    supports: type => SUPPORTED.has(Number(type)),
    loginPayload,
    execute: async (type, context = {}) => {
      if (Number(type) === 304) return record(context.etf, 'finished');
      if (Number(type) === 305) return record(context.etf, 'touched');
      throw new GameError(1, 'Unsupported story command');
    }
  };
}
