import { GameError } from './hero-progression.mjs';

// R1 requires commands with unresolved original consumers to reject the
// requested change before parsing prices/rewards or mutating state. Keeping
// these types here gives each one an auditable business refusal instead of the
// generic LOCAL_NOT_IMPLEMENTED fallback. A group must be removed from this
// table only when its complete producer/state/result chain is implemented.
export const R1_FAIL_CLOSED_COMMAND_REASONS = Object.freeze({
  88951: 'HERO-HEROBLAZON: normal-cell cost consumer and activated-cell result bitmap are not recovered [R1-HEROBLAZON-CHAPTER]',
  88953: 'HERO-HEROBLAZON: talent-point producer yields no points and TalentUp omits need_other_level [R1-HEROBLAZON-TALENT]',
  88956: 'HERO-HEROBLAZON: no client producer and no skill-reset cost or refund family are recovered [R1-HEROBLAZON-SKILLRESET]',
  701: 'HERO-INTELLI: unlock script evaluation, camp eligibility and unlock cost are not recovered [HERO-INTELLI-701]',
  702: 'HERO-INTELLI: completion award, dispatch eligibility/selection and start-to-finish state machine are not recovered [HERO-INTELLI-702]',
  87701: 'HERO-LINEUPSNAPSHOT: no pb_lineup_snapshot writer, reference, day or visibility producer [B-R1-87701]',
  87702: 'HERO-LINEUPSNAPSHOT: same missing producer as 87701; key_list is server-fed [B-R1-87702]',
  88963: 'HERO-NEWHEROEXCLUSIVE: ETF schema, instance binding and re-selection semantics unrecovered; candidates derive from Version/WishDraw [B-R1-88963]',
  88964: 'HERO-NEWHEROEXCLUSIVE: story award rows and tid%1000 bits are recovered, but the day/fight unlock producer is not [B-R1-88964]',
  88967: 'HERO-NEWHEROEXCLUSIVE: no LineupAward table family or client consumer exists; award rows unknown [B-R1-88967]',
  78201: 'ITEM-HOOK: type-to-rate/stage/cap and fractional cache consumer are not recovered [R1-HOOK-PRODUCER]',
  78202: 'ITEM-HOOK: preview schema and non-advancing cache contract are not recovered [R1-HOOK-PRODUCER]',
  78203: 'ITEM-HOOK: fast-gather count, cost and cap are not recovered [R1-HOOK-FASTGATHER]',
  78204: 'ITEM-HOOK: item production eligibility and fast-cost rows are not recovered [R1-HOOK-FASTITEM]',
  78205: 'ITEM-HOOK: produced-item table and original resource consumer are not recovered [R1-HOOK-PRODUCEITEM]',
  91501: 'ITEM-MYSTERYSHOP: per-cell candidate pool, auto-refresh weight stage, all_times_data/customize_auto_refresh_times advance and next_auto_refresh_time are not recovered [R1-ITEM-MYSTERYSHOP-AUTOREFRESH]',
  91502: 'ITEM-MYSTERYSHOP: manual price ladder and daily limit are recovered, but candidate generation and discount_items replacement are not [R1-ITEM-MYSTERYSHOP-MANUALREFRESH]',
  101301: 'ITEM-PERIODTASK: shipped PeriodTaskTable.Task has 0 rows (task_type/task_count/task_param/pre_task/refresh_type missing) [R1-ITEM-PERIODTASK-TASK]',
  101302: 'ITEM-PERIODTASK: shipped PeriodTaskTable.Stage has 0 rows (stage task_range and stage awards missing) [R1-ITEM-PERIODTASK-STAGE]',
  101303: 'ITEM-PERIODTASK: shipped PeriodTaskTable.Score and Version.score_item are empty (score thresholds and awards missing) [R1-ITEM-PERIODTASK-SCORE]',
  288: 'ITEM-RESCOMPLETE: award row 1 is recovered but claim eligibility is client download state with no server-verifiable attestation or authoritative claim key [R1-RESCOMPLETE-CLIENT-DOWNLOAD]',
  88401: 'ITEM-RESROLLBACK: the preview res_list comes from the unrecovered server-side refund formula; clients only render it [R1-RESROLLBACK-SERVER-PREVIEW]',
  88402: 'ITEM-RESROLLBACK: original refund consumer, per-type object reset scope, to_client payload and pre-execution fingerprint are not recovered [R1-RESROLLBACK-CONSUMER]',
  84901: 'ITEM-TASKGROUP: GroupFunc has 0 rows and the type 1202/8601 group-task progress producers are not wired [R1-TASKGROUP-GROUPFUNC]',
  84902: 'ITEM-TASKGROUP: group award rows are recovered but GroupFunc (func_id/func_open) is empty, so group-stage eligibility is undefined [R1-TASKGROUP-GROUPFUNC]'
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
