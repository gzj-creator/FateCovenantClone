import { GameError } from './hero-progression.mjs';
import { termArray, termInt } from './role-service.mjs';

const SUPPORTED = new Set([304, 305]);

export function createStoryService({ store, now = Date.now, logger = () => {} }) {
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
      const write = db.prepare('INSERT OR REPLACE INTO role_stories (role_id,story_id,status,updated_at) VALUES (?,?,?,?)');
      for (const id of ids) write.run(roleId, id, status, stamp());
      log({ event: status === 'finished' ? 'story_finished' : 'story_touched', count: ids.length });
      return { value: { ids, status }, data: null };
    });
  }

  return {
    supports: type => SUPPORTED.has(Number(type)),
    execute: async (type, context = {}) => {
      if (Number(type) === 304) return record(context.etf, 'finished');
      if (Number(type) === 305) return record(context.etf, 'touched');
      throw new GameError(1, 'Unsupported story command');
    }
  };
}
