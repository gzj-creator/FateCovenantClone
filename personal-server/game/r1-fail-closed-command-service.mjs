import { GameError } from './hero-progression.mjs';

// R1 requires commands with unresolved original consumers to reject the
// requested change before parsing prices/rewards or mutating state. Keeping
// these types here gives each one an auditable business refusal instead of the
// generic LOCAL_NOT_IMPLEMENTED fallback. A group must be removed from this
// table only when its complete producer/state/result chain is implemented.
export const R1_FAIL_CLOSED_COMMAND_REASONS = Object.freeze({
  88951: 'HERO-HEROBLAZON: original chapter cost, material conversion and limit are not recovered',
  88953: 'HERO-HEROBLAZON: talent-point budget, reset cost and result projection are not recovered',
  88956: 'HERO-HEROBLAZON: skill reset scope, cost and refund consumer are not recovered',
  701: 'HERO-INTELLI: original intelligence slots, pool, refresh and reward consumers are not recovered',
  702: 'HERO-INTELLI: start/finish timing and reward transition are not recovered',
  87701: 'HERO-LINEUPSNAPSHOT: snapshot creation, freeze identity and visibility are not recovered',
  87702: 'HERO-LINEUPSNAPSHOT: snapshot-day boundary and frozen historical projection are not recovered',
  88963: 'HERO-NEWHEROEXCLUSIVE: legal candidate set and change-selection limits are not recovered',
  88964: 'HERO-NEWHEROEXCLUSIVE: story-version predecessor and award mapping are not recovered',
  88967: 'HERO-NEWHEROEXCLUSIVE: lineup-award eligibility and original award rows are not recovered',
  78201: 'ITEM-HOOK: type-to-rate/stage/cap and fractional cache consumer are not recovered',
  78202: 'ITEM-HOOK: preview schema and non-advancing cache contract are not recovered',
  78203: 'ITEM-HOOK: fast-gather count, cost and cap are not recovered',
  78204: 'ITEM-HOOK: item production eligibility and fast-cost rows are not recovered',
  78205: 'ITEM-HOOK: produced-item table and original resource consumer are not recovered',
  91501: 'ITEM-MYSTERYSHOP: discount pool, weights and automatic refresh boundary are not recovered',
  91502: 'ITEM-MYSTERYSHOP: manual refresh count/cost and tier pricing are not recovered',
  101301: 'ITEM-PERIODTASK: version/task table, producer and task award rows are not recovered',
  101302: 'ITEM-PERIODTASK: stage targets and original stage awards are not recovered',
  101303: 'ITEM-PERIODTASK: score producer and original score awards are not recovered',
  288: 'ITEM-RESCOMPLETE: completion type, eligibility, reward list and source key are not recovered',
  88401: 'ITEM-RESROLLBACK: rollback type-to-object/cost mapping is not recovered',
  88402: 'ITEM-RESROLLBACK: original refund consumer and object fingerprint recheck are not recovered',
  84901: 'ITEM-TASKGROUP: GroupFunc producer and task predecessor rules are not recovered',
  84902: 'ITEM-TASKGROUP: group-stage eligibility and original group awards are not recovered'
});

export const R1_FAIL_CLOSED_COMMAND_TYPES = Object.freeze(
  Object.keys(R1_FAIL_CLOSED_COMMAND_REASONS).map(Number)
);

const supported = new Set(R1_FAIL_CLOSED_COMMAND_TYPES);

export function r1FailClosedReason(type) {
  return R1_FAIL_CLOSED_COMMAND_REASONS[Number(type)] ?? null;
}

export function createR1FailClosedCommandService({ logger = () => {} } = {}) {
  const log = event => { try { logger(event); } catch {} };
  return {
    supports: type => supported.has(Number(type)),
    execute(type) {
      const commandType = Number(type);
      const reason = r1FailClosedReason(commandType);
      if (!reason) throw new GameError(1, 'Unknown R1 fail-closed command');
      log({ event: 'r1_command_refused', type: commandType, reason });
      throw new GameError(5, `R1 command ${commandType} is fail-closed: ${reason}`);
    },
    commands: R1_FAIL_CLOSED_COMMAND_TYPES
  };
}
