import { GameError } from './hero-progression.mjs';
import { consumeResources, grantResources } from './resources.mjs';

// HERO-HERO draw support/marquee/progress award. The dispatch in gateway.mjs is shared: this module owns
// the request decoding and the business rules for its own type list.
// Contract: agent/workflow/gameplay-completion/HERO-HERO-B/service-contract.md
const SUPPORTED = [635, 651, 652, 673];
const fail = (code, message) => { throw new GameError(code, message); };

export function createHeroSupportService({ store, codec, tables, heroTables, now = () => Date.now(), random = Math.random, logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };
  void store; void codec; void tables; void heroTables; void now; void random; void consumeResources; void grantResources; void log;
  return {
    supports: type => SUPPORTED.includes(Number(type)),
    async decode(type, raw, helpers) {
      void helpers;
      return { type, raw };
    },
    execute(type) {
      return fail(5, 'Hero draw support/marquee/progress award command is not implemented yet: ' + String(type));
    }
  };
}

