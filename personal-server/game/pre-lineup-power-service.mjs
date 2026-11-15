import { GameError } from './hero-progression.mjs';
import { assembleHeroAttributes } from './attribute-service.mjs';

// HERO-COMBATPOWER 803 / req_update_pre_lineup_power.
//
// The client cannot compute power by itself: pb_lineup_team.power is documented
// as "当前战力，目前用于向客户端发送战力值，客户端暂时没有提供计算战力的方式".
// The preset-lineup editor therefore asks the server to recompute the preset
// power whenever the shown lineup may have changed (HeroShowUILogicMgr
// CheckReqRefPower -> CombatPowerCmd.req_update_pre_lineup_power, throttled by
// HeroTable.ConstByIndex(1).req_ref_interval). The server recomputes from the
// authoritative hero roster and attribute chain; any power value carried by the
// client is never accepted.
export const COMMAND_UPDATE_PRE_LINEUP_POWER = 803;

const SUPPORTED = Object.freeze([COMMAND_UPDATE_PRE_LINEUP_POWER]);
const CODE_INVALID = 1;
const CODE_STATE = 5;

const fail = (code, message) => { throw new GameError(code, message); };

function stateInteger(value, label) {
  const number = Number(value ?? 0);
  if (!Number.isSafeInteger(number) || number < 0) fail(CODE_STATE, `Invalid ${label}`);
  return number;
}

// ETF integers decode to plain numbers; a single-element tuple or list wraps one.
function etfScalar(value) {
  if (Array.isArray(value)) return value.length === 1 ? etfScalar(value[0]) : undefined;
  if (value && typeof value === 'object' && Array.isArray(value.value)) {
    return value.value.length === 1 ? etfScalar(value.value[0]) : undefined;
  }
  if (typeof value === 'number') return Number.isSafeInteger(value) ? value : undefined;
  if (typeof value === 'bigint' && value >= BigInt(Number.MIN_SAFE_INTEGER) && value <= BigInt(Number.MAX_SAFE_INTEGER)) {
    return Number(value);
  }
  if (typeof value === 'string' && /^-?\d+$/.test(value.trim())) {
    const parsed = Number(value.trim());
    return Number.isSafeInteger(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function createPreLineupPowerService({
  store, codec, heroTables, attributeTables, globalAttrsForModel = () => ({}), logger = () => {}
}) {
  const log = event => { try { logger(event); } catch {} };

  function presetsOf(model) {
    const presets = model?.lineups?.pre_lineups;
    if (!Array.isArray(presets) || !presets.length) {
      fail(CODE_STATE, 'R1 803 HERO-COMBATPOWER: the role has no saved preset lineup');
    }
    return presets;
  }

  // The request carries the preset index the client is showing. An empty term or
  // index 0 addresses the currently selected preset (pb_role_lineup.cur_pre_index).
  function targetIndex(model, requested) {
    const presets = presetsOf(model);
    const current = Number(model.lineups.cur_pre_index ?? 0) || Number(presets[0]?.index ?? 0);
    const index = requested === undefined || requested === null || requested === 0 ? current : requested;
    const target = presets.find(preset => Number(preset.index) === Number(index));
    if (!target) fail(CODE_STATE, `R1 803 HERO-COMBATPOWER: preset lineup ${index} is not saved`);
    return { target, index: Number(target.index) };
  }

  function recompute(target, model) {
    const team = target.lineup;
    if (!team || typeof team !== 'object' || Array.isArray(team)) {
      fail(CODE_STATE, 'R1 803 HERO-COMBATPOWER: preset lineup team is malformed');
    }
    const fighters = Array.isArray(team.fighter_list) ? team.fighter_list : [];
    if (!fighters.length) {
      fail(CODE_STATE, 'R1 803 HERO-COMBATPOWER: the preset lineup has no fighter to recompute');
    }
    const heroes = new Map((model?.heroInfo?.hero_list ?? []).map(hero => [String(hero.uid), hero]));
    const globalAttrs = globalAttrsForModel(model) ?? {};
    let teamPower = 0;
    const fightersPower = [];
    for (const fighter of fighters) {
      const hero = heroes.get(String(fighter.hero_id));
      if (!hero) {
        fail(CODE_STATE, `R1 803 HERO-COMBATPOWER: fighter ${fighter.hero_id} is not owned`);
      }
      const assembled = assembleHeroAttributes({ hero, heroTables, attributeTables, globalAttrs });
      const power = stateInteger(assembled.power, 'hero power');
      fighter.power = String(power);
      teamPower += power;
      fightersPower.push({ heroId: String(hero.uid), power });
    }
    const previousPower = stateInteger(team.power, 'preset team power');
    const previousMax = stateInteger(team.max_power, 'preset team maximum power');
    team.power = String(teamPower);
    team.max_power = String(Math.max(previousMax, teamPower));
    return { teamPower, previousPower, previousMax, fightersPower };
  }

  async function decode(type, data, { etf } = {}) {
    if (Number(type) !== COMMAND_UPDATE_PRE_LINEUP_POWER) fail(CODE_INVALID, 'Unsupported combat-power command');
    const input = Buffer.from(data ?? Buffer.alloc(0));
    if (!input.length) return undefined;
    if (typeof etf !== 'function') fail(CODE_INVALID, 'Pre-lineup power request is not a decodable ETF term');
    let decoded;
    try { decoded = await etf(input); }
    catch { fail(CODE_INVALID, 'Pre-lineup power request is not valid ETF'); }
    const index = etfScalar(decoded?.value ?? decoded);
    if (index === undefined) fail(CODE_INVALID, 'Pre-lineup power request must carry a preset index');
    if (index < 0) fail(CODE_INVALID, 'Pre-lineup power request must carry a preset index');
    return index;
  }

  function execute(type, requested) {
    if (Number(type) !== COMMAND_UPDATE_PRE_LINEUP_POWER) fail(CODE_INVALID, 'Unsupported combat-power command');
    return store.transaction(model => {
      const { target, index } = targetIndex(model, requested);
      const result = recompute(target, model);
      // The client registers no response handler for this request
      // (CombatPowerCmd.req_update_pre_lineup_power is encode-only), so the
      // authoritative effect is the persisted preset power that module 9
      // (pb_role_lineup.pre_lineups) delivers on the next login/push. The reply
      // stays an empty acknowledgement.
      log({
        event: 'pre_lineup_power_recomputed',
        index,
        teamPower: result.teamPower,
        previousPower: result.previousPower,
        previousMax: result.previousMax,
        fighters: result.fightersPower.length
      });
      return {
        schema: null,
        value: { index, power: result.teamPower, maxPower: Math.max(result.previousMax, result.teamPower) },
        data: Buffer.alloc(0)
      };
    });
  }

  return {
    supports: type => SUPPORTED.includes(Number(type)),
    isEtfRequest: type => SUPPORTED.includes(Number(type)),
    requestSchema: () => null,
    decode,
    execute
  };
}

export const PRE_LINEUP_POWER_COMMANDS = SUPPORTED;

