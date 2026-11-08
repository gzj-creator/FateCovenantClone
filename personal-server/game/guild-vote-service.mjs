import { GameError } from './hero-progression.mjs';
import { GUILD_JOB } from './guild-roster-service.mjs';
import {
  ensureCoopTables, guildContext, readDoc, writeDoc, claimOnce, toSeconds, resOf, grantAwards,
  asInteger, etfArgs, decodeCoopRequest
} from './guild-coop-shared.mjs';

// GuildVoteCmd 98702/99701. The president starts a topic; every guild member
// may cast one vote per topic until the deadline. Votes are stored per guild so
// 98702 and 99701 read the same authority, and the voter award is idempotent.
export const GUILD_VOTE_COMMANDS = Object.freeze({ vote: 98702, start: 99701 });
const SCOPE = 'guild_vote';
const REQUEST_SCHEMAS = { 98702: 'pb_guild_vote_req' };

export function createGuildVoteService({ store, codec, tables, coopTables, now = Date.now, logger = () => {} }) {
  const config = coopTables.vote;
  const log = event => { try { logger(event); } catch {} };
  const supported = new Set(Object.values(GUILD_VOTE_COMMANDS));

  function voteDoc(db, context, at) {
    const existing = readDoc(db, SCOPE, context.guildId, '0', 'state');
    if (existing) {
      existing.votes = existing.votes ?? {};
      return existing;
    }
    return writeDoc(db, SCOPE, context.guildId, '0', 'state', { votes: {} }, at);
  }

  function activeVote(doc, type, at) {
    const vote = doc.votes[String(type)];
    if (!vote) throw new GameError(5, 'No guild vote is running');
    if (at >= Number(vote.deadline)) throw new GameError(5, 'Guild vote has ended');
    return vote;
  }

  function infoView(vote) {
    return {
      type: String(vote.type),
      member_vote: Object.entries(vote.members ?? {}).map(([roleId, choice]) => ({ role_id: roleId, vote: String(choice) })),
      deadline: Number(vote.deadline),
      start_time: Number(vote.start)
    };
  }

  function vote(input) {
    const type = asInteger(input?.type, 'vote type', { min: 1 });
    const choice = String(input?.vote ?? '').trim();
    if (!/^[0-9]+$/.test(choice) || choice === '0') throw new GameError(1, 'Invalid vote candidate');
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      const doc = voteDoc(db, context, at);
      const ballot = activeVote(doc, type, at);
      if (!ballot.candidates.includes(choice)) throw new GameError(1, 'Vote candidate does not exist');
      if (ballot.members?.[context.roleId]) throw new GameError(3, 'A vote has already been cast');
      ballot.members = { ...(ballot.members ?? {}), [context.roleId]: choice };
      const changes = claimOnce(db, { scope: SCOPE, guildId: context.guildId, roleId: context.roleId, key: 'vote:' + type, period: String(ballot.start), at }) ? grantAwards(model, tables, config.reward) : [];
      writeDoc(db, SCOPE, context.guildId, '0', 'state', doc, at);
      return { data: codec.pack('pb_guild_vote_info', infoView(ballot)), value: { type, choice, voters: Object.keys(ballot.members).length } };
    });
  }

  function start(input) {
    const args = etfArgs(input);
    const type = args.length ? asInteger(args[0], 'vote type', { min: 1 }) : 1;
    return store.transaction((model, db) => {
      ensureCoopTables(db);
      const at = toSeconds(now);
      const context = guildContext(model, codec);
      if (Number(context.job) !== GUILD_JOB.PRESIDENT) throw new GameError(5, 'Only the president may start a guild vote');
      const doc = voteDoc(db, context, at);
      const running = doc.votes[String(type)];
      if (running && at < Number(running.deadline)) throw new GameError(3, 'A guild vote is already running');
      const candidates = context.members.map(member => String(member.role_id)).sort((left, right) => (BigInt(left) < BigInt(right) ? -1 : 1)).slice(0, config.candidateCount);
      const ballot = { type, start: at, deadline: at + config.durationSeconds, candidates, members: {} };
      doc.votes[String(type)] = ballot;
      writeDoc(db, SCOPE, context.guildId, '0', 'state', doc, at);
      return { data: codec.pack('pb_guild_vote_info', infoView(ballot)), value: { type, candidates: candidates.length } };
    });
  }

  async function execute(type, bytes) {
    const command = Number(type);
    const input = await decodeCoopRequest(codec, REQUEST_SCHEMAS, command, bytes);
    const result = command === 98702 ? vote(input) : start(input);
    log({ event: 'guild_vote_command', type: command, ...result.value });
    return result;
  }
  return { supports: type => supported.has(Number(type)), execute, commands: GUILD_VOTE_COMMANDS, requestSchemas: REQUEST_SCHEMAS };
}
