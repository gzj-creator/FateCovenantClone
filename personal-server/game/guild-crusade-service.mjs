import { GameError } from './hero-progression.mjs';

// GuildCrusadeCmd 105805 only asks for a ranking response whose schema,
// pb_guild_crusade_rank_rsp, is absent from the shipped guild_crusade protobuf
// bundle. Returning an ETF or empty payload would make the client decode it as
// protobuf using a schema this server does not have. The command is therefore
// routed explicitly and rejected as unavailable; the evidence gap is recorded
// in the E2 delivery note.
export const GUILD_CRUSADE_COMMANDS = Object.freeze({ rank: 105805 });

export function createGuildCrusadeService({ logger = () => {} } = {}) {
  const log = event => { try { logger(event); } catch {} };
  return {
    supports: type => Number(type) === GUILD_CRUSADE_COMMANDS.rank,
    async execute() {
      log({ event: 'guild_crusade_rank_unavailable', type: GUILD_CRUSADE_COMMANDS.rank, reason: 'response_schema_missing' });
      throw new GameError(5, 'Guild crusade rank response schema is missing');
    },
    commands: GUILD_CRUSADE_COMMANDS
  };
}
