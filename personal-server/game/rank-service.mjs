import { GameError } from './hero-progression.mjs';

export function createRankService({ codec }) {
  return {
    supports: type => [2000, 2008, 2011].includes(type),
    execute(type, input) {
      const request = Array.isArray(input) ? input : input?.value ?? input;
      const ids = type === 2008 ? [request] : request;
      if (![2000, 2008, 2011].includes(type) || !Array.isArray(ids) || ids.length > 100 || (type !== 2011 && ids.length !== 1) || ids.some(id => !Number.isSafeInteger(id) || id <= 0)) throw new GameError(1, 'Invalid ranking list');
      // No archived competition has been run locally; return an explicit empty board per ID.
      const boards = [...new Set(ids)].map(id => ({ rank_id: String(id), self_rank: 0, self_value: '0', rank_list: [], total: '0' }));
      const schema = type === 2011 ? 'rank_to_client_list' : 'rank_to_client';
      const value = type === 2011 ? { client_list: boards } : boards[0];
      return { schema, value, data: codec.pack(schema, value) };
    }
  };
}
