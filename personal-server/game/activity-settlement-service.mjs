import { GameError } from './hero-progression.mjs';

const CURRENCY_POLICIES = new Set(['none', 'clear_on_settle', 'keep_until_close']);
const STEP_PATTERN = /^[A-Za-z0-9_.:-]{1,80}$/;

function integer(value, field, { min = 1 } = {}) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min) throw new GameError(1, `${field} is invalid`);
  return number;
}

function familyName(instance) {
  return String(instance?.family ?? '').trim() || 'unclassified';
}

function mergeAwards(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const totals = new Map();
  for (const row of rows) {
    const tid = integer(row?.tid ?? row?.[0], 'mail award tid');
    const count = integer(row?.count ?? row?.num ?? row?.[1], 'mail award count');
    totals.set(String(tid), (totals.get(String(tid)) ?? 0) + count);
  }
  return [...totals].map(([tid, count]) => ({ tid: Number(tid), count }));
}

// Family handlers expose one synchronous settle(ctx) method and an explicit
// currency policy. Handlers never write a settlement marker themselves: every
// ctx.*Step writes the marker in the same SQLite transaction as its side effect.
export function createActivitySettlementService({
  store, activityStore, mail, families = [], now = Date.now, logger = () => {}
}) {
  if (!store?.transaction || !store?.inspect || !store?.runWithRole) throw new TypeError('Activity settlement store is unavailable');
  if (!activityStore?.markSettlement) throw new TypeError('Activity settlement journal is unavailable');
  if (!mail?.enqueueToRoleInTransaction || !mail?.publishNewMail) throw new TypeError('Activity settlement mail is unavailable');
  const handlers = Array.isArray(families) ? families : [...families];
  const at = () => Math.floor(Number(now()) / 1000);
  const log = event => { try { logger(event); } catch {} };

  function serverId(change) {
    if (Number.isSafeInteger(Number(change?.serverId)) && Number(change.serverId) > 0) return Number(change.serverId);
    try { return integer(store.read().state.serverId, 'serverId'); } catch {
      const row = store.inspect(db => db.prepare('SELECT server_id FROM roles LIMIT 1').get());
      return integer(row?.server_id, 'serverId');
    }
  }

  function handlerFor(instance, change) {
    const handler = handlers.find(candidate => typeof candidate?.settle === 'function'
      && (typeof candidate.matches === 'function'
        ? candidate.matches(instance, change)
        : candidate.id === familyName(instance)));
    if (!handler) {
      throw new GameError(5, `Activity settlement handler is not proven for family ${familyName(instance)}`);
    }
    if (!CURRENCY_POLICIES.has(handler.currencyPolicy)) {
      throw new GameError(5, `Activity settlement currency policy is not declared for family ${familyName(instance)}`);
    }
    return handler;
  }

  function settle(change) {
    const srv = serverId(change);
    const actId = integer(change?.actId, 'actId');
    const periodNo = integer(change?.periodNo, 'periodNo');
    const instance = activityStore.instance(srv, actId, periodNo);
    if (!instance) throw new GameError(5, 'Activity settlement instance does not exist');
    const handler = handlerFor(instance, change);
    const report = { serverId: srv, actId, periodNo, family: familyName(instance), handler: handler.id ?? familyName(instance), executed: [], skipped: [] };
    let current = null;

    function afterCommit(callback) {
      if (typeof callback !== 'function') throw new TypeError('After-commit callback must be a function');
      current.afterCommit.push(callback);
    }

    function txApi(db, model, roleId, step) {
      return Object.freeze({
        db, model, roleId, step,
        enqueueMail(message = {}) {
          if (roleId <= 0) throw new GameError(1, 'Activity mail requires a role step');
          const awards = mergeAwards(message.awards);
          if (!awards.length) throw new GameError(1, 'Activity settlement mail requires awards');
          const tag = String(message.tag ?? 'mail');
          if (!STEP_PATTERN.test(tag)) throw new GameError(1, 'Activity settlement mail tag is invalid');
          const requestId = `activity.${srv}.${actId}.${periodNo}.${roleId}.${step}.${tag}`;
          const result = mail.enqueueToRoleInTransaction({
            db, roleId, request_id: requestId,
            title: message.title ?? '活动结算',
            content: message.content ?? '活动已结束，未领取奖励已补发。',
            awards, expire_at: message.expire_at ?? 0, send_name: message.send_name ?? '系统'
          });
          if (!result.duplicate) afterCommit(() => mail.publishNewMail(result.mail_id, roleId));
          return result;
        },
        personalState({ carryCumulativeKeys = [] } = {}) {
          if (roleId <= 0) throw new GameError(1, 'Activity personal state requires a role step');
          return activityStore.ensurePersonalState({
            serverId: srv, actId, periodNo, roleId, carryCumulativeKeys
          }, db);
        },
        savePersonalState(state) {
          if (roleId <= 0) throw new GameError(1, 'Activity personal state requires a role step');
          return activityStore.savePersonalState({ serverId: srv, actId, periodNo, roleId, ...state }, db);
        },
        archivePersonalState() {
          if (roleId <= 0) throw new GameError(1, 'Activity personal state requires a role step');
          return activityStore.archivePersonalState({ serverId: srv, actId, periodNo, roleId, archivedAt: at() }, db);
        },
        snapshotRanking(boardKey, rows) {
          if (roleId !== 0) throw new GameError(1, 'Activity rank snapshot must be a global step');
          return activityStore.replaceRankSnapshot({ serverId: srv, actId, periodNo, boardKey, rows }, db);
        },
        clearPersonalCurrency() {
          activityStore.clearPersonalCurrency(srv, actId, periodNo, roleId > 0 ? roleId : null, db);
        }
      });
    }

    function runRoleStep(roleIdValue, name, callback) {
      const roleId = integer(roleIdValue, 'roleId');
      const step = String(name ?? '');
      if (!STEP_PATTERN.test(step)) throw new GameError(1, 'Activity settlement step is invalid');
      if (activityStore.settlementDone(srv, actId, periodNo, roleId, step)) {
        report.skipped.push({ roleId, step });
        return { skipped: true };
      }
      const result = store.runWithRole(roleId, () => store.transaction((model, db) => {
        current = { afterCommit: [] };
        const value = callback(txApi(db, model, roleId, step));
        if (value && typeof value.then === 'function') throw new Error('Activity settlement steps must be synchronous');
        activityStore.markSettlement(srv, actId, periodNo, roleId, step, db);
        return { value, afterCommit: current.afterCommit };
      }));
      for (const notify of result.afterCommit) {
        try { notify(); } catch (error) { log({ event: 'activity_settlement_notify_failed', actId, periodNo, roleId, step, message: error.message }); }
      }
      report.executed.push({ roleId, step });
      return result.value;
    }

    function runGlobalStep(name, callback) {
      const step = String(name ?? '');
      if (!STEP_PATTERN.test(step)) throw new GameError(1, 'Activity settlement step is invalid');
      if (activityStore.settlementDone(srv, actId, periodNo, 0, step)) {
        report.skipped.push({ roleId: 0, step });
        return { skipped: true };
      }
      let result;
      store.inspect(db => {
        db.exec('BEGIN IMMEDIATE');
        try {
          current = { afterCommit: [] };
          const value = callback(txApi(db, null, 0, step));
          if (value && typeof value.then === 'function') throw new Error('Activity settlement steps must be synchronous');
          activityStore.markSettlement(srv, actId, periodNo, 0, step, db);
          result = { value, afterCommit: current.afterCommit };
          db.exec('COMMIT');
        } catch (error) {
          db.exec('ROLLBACK');
          throw error;
        }
      });
      for (const notify of result.afterCommit) {
        try { notify(); } catch (error) { log({ event: 'activity_settlement_notify_failed', actId, periodNo, roleId: 0, step, message: error.message }); }
      }
      report.executed.push({ roleId: 0, step });
      return result.value;
    }

    const ctx = Object.freeze({
      instance, handler, serverId: srv, actId, periodNo, family: familyName(instance),
      inspect: action => store.inspect(action),
      roleStep: runRoleStep,
      globalStep: runGlobalStep,
      afterCommit,
      now: at
    });

    const value = handler.settle(ctx);
    if (value && typeof value.then === 'function') throw new Error('Activity settlement handlers must be synchronous');
    if (handler.currencyPolicy === 'clear_on_settle') {
      runGlobalStep('currency_clear', tx => tx.clearPersonalCurrency());
    }
    runGlobalStep('personal_state_archive', tx => {
      const target = tx.db;
      target.prepare('UPDATE activity_personal_state SET archived_at=?,updated_at=? WHERE server_id=? AND act_id=? AND period_no=? AND archived_at IS NULL')
        .run(at(), new Date(Number(now())).toISOString(), srv, actId, periodNo);
    });
    if (report.executed.length === 0 && report.skipped.length === 0) {
      throw new GameError(5, 'Activity settlement handler produced no durable steps');
    }
    log({ event: 'activity_settlement_completed', ...report });
    return { ...value, ...report };
  }

  function onStageChanged(change) {
    if (change?.to !== 'closed') return null;
    const srv = serverId(change);
    const instance = activityStore.instance(srv, Number(change.actId), Number(change.periodNo));
    if (!instance) return null;
    let handler;
    try { handler = handlerFor(instance, change); } catch (error) {
      log({ event: 'activity_settlement_close_failed', actId: change.actId, periodNo: change.periodNo, message: error.message });
      return null;
    }
    if (handler.currencyPolicy !== 'keep_until_close') return null;
    const step = 'currency_clear_on_close';
    if (activityStore.settlementDone(srv, Number(change.actId), Number(change.periodNo), 0, step)) return null;
    store.inspect(db => {
      db.exec('BEGIN IMMEDIATE');
      try {
        activityStore.clearPersonalCurrency(srv, Number(change.actId), Number(change.periodNo), null, db);
        activityStore.markSettlement(srv, Number(change.actId), Number(change.periodNo), 0, step, db);
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    });
    log({ event: 'activity_currency_cleared_on_close', actId: Number(change.actId), periodNo: Number(change.periodNo) });
    return true;
  }

  return { settle, onStageChanged };
}
