import { serializedBinary } from '../protocol/game-codec.mjs';
import { setBit } from './bit-block.mjs';
import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';

const HERO_MODULE_ID = 10;
// HeroDataMgr.ParseLogin decodes the eighth Lua entry as pb_hero_team_suggest.
const TEAM_SUGGEST_SLOT = 7;
const CLAIM_TYPE = 'team_suggest';

function integer(value, field) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw new GameError(1, `Invalid team suggestion ${field}`);
  return number;
}

function configuredRows(heroTables) {
  return [...(heroTables.TeamSuggest?.values() ?? [])]
    .sort((left, right) => Number(left.tid) - Number(right.tid));
}

function configuredAwards(heroTables, teamType) {
  return [...(heroTables.TeamSuggestAward?.values() ?? [])]
    .filter(row => Number(row.team_type) === Number(teamType))
    .sort((left, right) => Number(left.collect_percent) - Number(right.collect_percent) || Number(left.tid) - Number(right.tid));
}

function teamTypes(heroTables) {
  const types = new Set();
  for (const row of configuredRows(heroTables)) types.add(Number(row.team_type));
  for (const row of heroTables.TeamSuggestAward?.values() ?? []) types.add(Number(row.team_type));
  return [...types].filter(value => Number.isInteger(value) && value > 0).sort((left, right) => left - right);
}

function heroStars(model) {
  const result = new Map();
  for (const hero of model.heroInfo.hero_list ?? []) {
    const tid = Number(hero.tid), star = Math.max(0, Number(hero.star ?? 0));
    if (!Number.isSafeInteger(tid) || !Number.isFinite(star)) continue;
    result.set(tid, Math.max(result.get(tid) ?? 0, star));
  }
  return result;
}

function suggestionHeroTids(teamRow) {
  return new Set((teamRow?.suggest_hero ?? [])
    .map(suggestion => Number(suggestion?.[0]))
    .filter(Number.isSafeInteger));
}

export function calculateTeamSuggestProgress(teamRow, stars) {
  const suggestions = Array.isArray(teamRow?.suggest_hero) ? teamRow.suggest_hero : [];
  let maximum = 0, current = 0;
  for (const suggestion of suggestions) {
    const heroTid = Number(suggestion?.[0]);
    const targetStar = Math.max(0, Number(suggestion?.[1] ?? 0));
    if (!Number.isSafeInteger(heroTid) || !Number.isFinite(targetStar)) continue;
    // The client adds one to every stored star. Capping at the configured target
    // keeps a developed roster from displaying a collection rate above 100%.
    const collectedStar = Math.min(Math.max(0, stars.get(heroTid) ?? 0), targetStar);
    maximum += targetStar + 1;
    current += collectedStar + 1;
  }
  return {
    current,
    maximum,
    percent: maximum > 0 ? Math.floor(current * 100 / maximum) : 0
  };
}

export function collectTeamSuggest(teamRow, stars) {
  return {
    type: Number(teamRow.tid),
    progress: (teamRow.suggest_hero ?? []).map(suggestion => {
      const targetStar = Math.max(0, Number(suggestion?.[1] ?? 0));
      return Math.min(Math.max(0, stars.get(Number(suggestion?.[0])) ?? 0), targetStar) + 1;
    })
  };
}

export function parseTeamSuggestActivePayload(payload, heroTables) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new GameError(1, 'Invalid team suggestion activation payload');
  }
  const teamTid = integer(payload.type, 'team type');
  const team = heroTables.TeamSuggest?.get(teamTid);
  if (!team) throw new GameError(5, 'Team suggestion is not configured');
  if (!Array.isArray(payload.heroes) || payload.heroes.length === 0) {
    throw new GameError(1, 'Team suggestion activation requires heroes');
  }
  const configuredHeroes = suggestionHeroTids(team);
  const seen = new Set();
  const heroes = payload.heroes.map(entry => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new GameError(1, 'Invalid team suggestion activation hero');
    }
    const heroTid = integer(entry.hero_tid ?? entry.heroTid, 'hero id');
    const targetStar = integer(entry.target_star ?? entry.targetStar, 'hero target star');
    const hero = heroTables.Hero?.get(heroTid);
    if (!hero || !configuredHeroes.has(heroTid)) throw new GameError(5, 'Hero is not part of this team suggestion');
    if (targetStar > Math.max(0, Number(hero.max_star ?? 0))) {
      throw new GameError(1, 'Invalid team suggestion hero target star');
    }
    if (seen.has(heroTid)) throw new GameError(1, 'Duplicate team suggestion hero');
    seen.add(heroTid);
    return { hero_tid: heroTid, target_star: targetStar };
  });
  return { type: teamTid, heroes };
}

function readTeamSuggest(model, codec) {
  const module = new Map(model.state.modules.value).get(HERO_MODULE_ID);
  if (!module || !Array.isArray(module.value)) throw new GameError(5, 'Hero login module is missing');
  const bytes = Buffer.from(module.value[TEAM_SUGGEST_SLOT]?.value?.data ?? []);
  return bytes.length
    ? codec.unpack('pb_hero_team_suggest', bytes)
    : { select: 0, collects: [], collect_award: [], stages: [] };
}

function writeTeamSuggest(model, codec, value) {
  const modules = new Map(model.state.modules.value);
  const module = modules.get(HERO_MODULE_ID);
  if (!module || !Array.isArray(module.value)) throw new GameError(5, 'Hero login module is missing');
  while (module.value.length <= TEAM_SUGGEST_SLOT) module.value.push(serializedBinary(Buffer.alloc(0)));
  module.value[TEAM_SUGGEST_SLOT] = serializedBinary(codec.pack('pb_hero_team_suggest', value));
  model.state.modules.value = [...modules];
}

function collectAwardBlocks(previous, heroTables, claimedAwards) {
  const blocks = new Map();
  for (const type of teamTypes(heroTables)) {
    const stored = Buffer.from(previous.collect_award?.[type - 1] ?? '', 'base64');
    blocks.set(type, Buffer.from(stored.length ? stored : Buffer.alloc(2)));
  }
  for (const [type, awardTid] of claimedAwards) {
    const block = blocks.get(type);
    if (block) blocks.set(type, setBit(block, awardTid % 100));
  }
  return [...blocks.entries()].sort(([left], [right]) => left - right).map(([, block]) => block);
}

function claimKey(type, awardTid) { return type + ':' + awardTid; }

function claimedAwards(db, roleId) {
  const result = [];
  for (const row of db.prepare('SELECT claim_key FROM reward_claims WHERE role_id=? AND claim_type=?').all(roleId, CLAIM_TYPE)) {
    const match = /^(\d+):(\d+)$/.exec(String(row.claim_key));
    if (match) result.push([Number(match[1]), Number(match[2])]);
  }
  return result;
}

function validPair(awardTid, teamTid, heroTables, explicitType = null) {
  const award = heroTables.TeamSuggestAward?.get(awardTid);
  const team = heroTables.TeamSuggest?.get(teamTid);
  if (!award || !team) return null;
  const type = Number(team.team_type);
  if (Number(award.team_type) !== type) return null;
  if (explicitType !== null && Number(explicitType) !== type) return null;
  return { awardTid, teamTid, teamType: type };
}

function uniqueCandidates(values) {
  const seen = new Set(), result = [];
  for (const value of values) {
    if (!value) continue;
    const key = value.awardTid + ':' + value.teamTid;
    if (seen.has(key)) continue;
    seen.add(key); result.push(value);
  }
  return result;
}

export function parseTeamSuggestClaimPayload(payload, heroTables) {
  if (payload && typeof payload === 'object' && !Array.isArray(payload) && !Array.isArray(payload.value)) {
    const awardTid = integer(payload.award_tid ?? payload.awardTid ?? payload.reward_tid ?? payload.rewardTid, 'award id');
    const teamTid = integer(payload.team_tid ?? payload.teamTid ?? payload.team ?? payload.team_id, 'team id');
    const explicitType = payload.team_type ?? payload.teamType ?? payload.type;
    const candidate = validPair(awardTid, teamTid, heroTables, explicitType === undefined ? null : explicitType);
    if (!candidate) throw new GameError(1, 'Invalid team suggestion reward');
    return candidate;
  }

  const source = Array.isArray(payload) ? payload : payload?.value;
  if (!Array.isArray(source)) throw new GameError(1, 'Invalid team suggestion reward payload');
  const numbers = source.flatMap(value => Array.isArray(value) ? value : [value]).map(Number);
  if (!numbers.length || numbers.some(value => !Number.isSafeInteger(value) || value < 0)) {
    throw new GameError(1, 'Invalid team suggestion reward payload');
  }

  const candidates = [];
  if (numbers.length >= 2) {
    // The client's ReqGetAward table is { awardTid, teamTid }. The reversed
    // form is accepted for protocol compatibility and disambiguated by config.
    candidates.push(validPair(numbers[0], numbers[1], heroTables));
    candidates.push(validPair(numbers[1], numbers[0], heroTables));
  }
  if (numbers.length >= 3) {
    candidates.push(validPair(numbers[0], numbers[2], heroTables, numbers[1]));
    candidates.push(validPair(numbers[2], numbers[0], heroTables, numbers[1]));
    candidates.push(validPair(numbers[1], numbers[2], heroTables, numbers[0]));
  }
  if (numbers.length === 1) {
    const teamTid = numbers[0], team = heroTables.TeamSuggest?.get(teamTid);
    if (team) {
      const award = configuredAwards(heroTables, team.team_type)[0];
      if (award) candidates.push({ awardTid: Number(award.tid), teamTid, teamType: Number(team.team_type) });
    }
  }
  const unique = uniqueCandidates(candidates);
  if (unique.length !== 1) throw new GameError(1, 'Invalid or ambiguous team suggestion reward payload');
  return unique[0];
}

export function createTeamSuggestService({ store, codec, tables, heroTables, now = Date.now }) {
  function buildLoginValue(model, db) {
    const previous = readTeamSuggest(model, codec);
    const stars = heroStars(model);
    const collects = configuredRows(heroTables).map(row => collectTeamSuggest(row, stars));
    const claims = claimedAwards(db, model.state.roleId);
    return {
      select: Number(previous.select ?? 0),
      collects,
      collect_award: collectAwardBlocks(previous, heroTables, claims),
      stages: previous.stages ?? []
    };
  }

  function ensureLoginState() {
    return store.transaction((model, db) => {
      const value = buildLoginValue(model, db);
      writeTeamSuggest(model, codec, value);
      return {
        collectCount: value.collects.length,
        claimedCount: claimedAwards(db, model.state.roleId).length,
        awardBlocks: value.collect_award.length
      };
    });
  }

  function claim(payload) {
    const request = parseTeamSuggestClaimPayload(payload, heroTables);
    return store.transaction((model, db) => {
      const team = heroTables.TeamSuggest.get(request.teamTid);
      const awards = configuredAwards(heroTables, request.teamType);
      if (!team || !awards.length) throw new GameError(5, 'Team suggestion reward is not configured');

      const claimed = new Set(claimedAwards(db, model.state.roleId)
        .filter(([type]) => type === request.teamType)
        .map(([, awardTid]) => awardTid));
      const next = awards.find(award => !claimed.has(Number(award.tid)));
      if (!next) throw new GameError(310, 'Reward already claimed');
      const award = heroTables.TeamSuggestAward.get(request.awardTid);
      if (!award) throw new GameError(5, 'Team suggestion reward is not configured');
      if (claimed.has(request.awardTid)) throw new GameError(310, 'Reward already claimed');
      if (Number(award.tid) !== Number(next.tid)) throw new GameError(1, 'Team suggestion rewards must be claimed in order');

      const progress = calculateTeamSuggestProgress(team, heroStars(model));
      if (progress.percent < Number(award.collect_percent)) {
        throw new GameError(5, 'Team suggestion collection progress is insufficient');
      }

      db.prepare('INSERT INTO reward_claims VALUES (?,?,?,?)').run(
        model.state.roleId,
        CLAIM_TYPE,
        claimKey(request.teamType, request.awardTid),
        new Date(now()).toISOString()
      );
      const granted = grantResources(model, award.award ?? [], tables, { codec });
      const previous = readTeamSuggest(model, codec);
      const updated = {
        ...previous,
        collect_award: collectAwardBlocks(previous, heroTables, claimedAwards(db, model.state.roleId))
      };
      writeTeamSuggest(model, codec, updated);
      return {
        value: {
          teamTid: request.teamTid,
          teamType: request.teamType,
          awardTid: request.awardTid,
          percent: progress.percent,
          changes: granted.changes
        },
        data: codec.pack('pb_res_to_client', { changes: granted.changes, is_overflow: false })
      };
    });
  }

  function active(payload) {
    const request = parseTeamSuggestActivePayload(payload, heroTables);
    const team = heroTables.TeamSuggest.get(request.type);
    return store.transaction((model, db) => {
      const previous = buildLoginValue(model, db);
      const collect = collectTeamSuggest(team, heroStars(model));
      const collects = previous.collects.filter(entry => Number(entry.type) !== request.type);
      collects.push(collect);
      collects.sort((left, right) => Number(left.type) - Number(right.type));
      const updated = { ...previous, collects };
      writeTeamSuggest(model, codec, updated);
      return {
        value: { teamTid: request.type, progress: collect.progress, heroes: request.heroes },
        data: codec.pack('pb_hero_team_suggest_collect', collect)
      };
    });
  }

  function select(teamTid) {
    const id = integer(teamTid, 'team id');
    if (!heroTables.TeamSuggest?.has(id)) throw new GameError(5, 'Team suggestion is not configured');
    return store.transaction((model, db) => {
      const updated = { ...buildLoginValue(model, db), select: id };
      writeTeamSuggest(model, codec, updated);
      return {
        value: { teamTid: id },
        data: codec.pack('pb_hero_team_suggest', updated)
      };
    });
  }

  return { supports: type => type === 88801 || type === 88802 || type === 88803, ensureLoginState, claim, active, select };
}
