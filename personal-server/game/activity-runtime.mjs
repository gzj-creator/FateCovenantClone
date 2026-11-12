import { serverDayNumber } from './activity-calendar.mjs';
import { activityGate, applyOverride, evaluateActivity } from './activity-lifecycle.mjs';

function seconds(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return number > 100000000000 ? Math.floor(number / 1000) : Math.floor(number);
}

function activityIds(activity) {
  return [...new Set([
    ...(activity?.act_list ?? []).map(entry => Number(entry?.state_data?.act_id)),
    ...(activity?.act_parallel_list ?? []).flatMap(group => (group?.states_data ?? []).map(state => Number(state?.act_id)))
  ].filter(id => Number.isSafeInteger(id) && id > 0))];
}

export function createActivityRuntime({
  store, calendar, tables, activityStore, featureService = null,
  now = Date.now, logger = () => {}, onSettle = null, onStageChanged = null
}) {
  if (!store?.inspect) throw new TypeError('store.inspect is required');
  if (!activityStore?.upsertInstance) throw new TypeError('activityStore is required');
  const clock = () => Math.floor(Number(now()) / 1000);
  const log = event => { try { logger(event); } catch {} };
  const configFor = actId => tables?.ActFrameAct?.get(Number(actId)) ?? tables?.Activity?.get(Number(actId)) ?? null;
  const serverId = () => {
    try { return Number(store.read().state.serverId ?? 1); } catch {
      return Number(store.inspect(db => db.prepare('SELECT server_id FROM roles LIMIT 1').get()?.server_id) ?? 1);
    }
  };

  function evaluate(actId, at, { activity = null, window = null, funOpen = null, role = null, override = null } = {}) {
    const config = configFor(actId);
    if (!config) return { status: 'closed', visible: false, reason: 'missing_config' };
    return evaluateActivity({
      config,
      at,
      serverOpenedAt: calendar.serverOpenedAt,
      activityReferenceOpenedAt: calendar.activityReferenceOpenedAt,
      windowOverride: window ?? calendar.windowFor?.(actId, activity) ?? null,
      override,
      funOpen,
      role
    });
  }

  function instanceFor(actId, periodNo) {
    return activityStore.instance(serverId(), Number(actId), Number(periodNo));
  }

  // Persist the windows that module 92 is about to send. This is deliberately
  // write-only with respect to login: the existing calendar still decides which
  // rows the captured client accepts, while the instance table gives the
  // scheduler a durable target for later stage changes.
  function synchronizeLogin(activity, at = clock()) {
    const srv = serverId();
    const model = store.read();
    const role = { ...model.role, createDay: Number(model.role?.createDay ?? 1) };
    const open = featureService?.openIds ? featureService.openIds() : null;
    const changed = [];
    for (const actId of activityIds(activity)) {
      const config = configFor(actId);
      if (!config) continue;
      const window = calendar.windowFor?.(actId, activity) ?? null;
      if (!window) continue;
      const override = activityStore.activeOverride?.(srv, actId, at) ?? null;
      const result = evaluate(actId, at, { activity, window, funOpen: open, role, override });
      const periodNo = Math.max(1, serverDayNumber(calendar.serverOpenedAt, window.start));
      const effectiveWindow = result.window ?? window;
      activityStore.observeInstance({
        serverId: srv, actId, periodNo, family: String(config.type ?? config.func ?? ''),
        previewAt: effectiveWindow.start, openAt: effectiveWindow.start, closeAt: effectiveWindow.end,
        showUntil: effectiveWindow.end, stage: result.status
      });
      changed.push({ actId, periodNo, stage: result.status, reason: result.reason ?? null });
    }
    return changed;
  }

  // The scheduler calls this every minute. A row created at login keeps its
  // period; stage changes only advance it and settlement is keyed by the
  // activity/period pair so a restart cannot apply the same closure twice.
  function tick(at = clock()) {
    const srv = serverId();
    const changes = [];
    for (const row of activityStore.listInstances(srv)) {
      if (row.show_until == null && row.close_at == null) continue;
      const window = { start: Number(row.open_at ?? row.preview_at), end: Number(row.show_until ?? row.close_at) };
      if (!(window.start > 0 && window.end > window.start)) continue;
      const override = activityStore.activeOverride?.(srv, Number(row.act_id), at) ?? null;
      // Pause and force-close are visibility switches, not lifecycle closure.
      // Keep the running instance intact so progress survives resume.
      if (override?.kind === 'pause' || override?.kind === 'force_close') continue;
      const result = evaluate(Number(row.act_id), at, { window, override });
      if (result.status === row.stage) continue;
      const previous = row.stage;
      const change = { actId: Number(row.act_id), periodNo: Number(row.period_no), from: previous, to: result.status };
      if (previous === 'running' && result.status !== 'running') {
        if (activityStore.settlementDone(srv, row.act_id, row.period_no, 0, 'lifecycle')) continue;
        try { onSettle?.({ ...change, row: result }); } catch (error) {
          // Keep the instance in running so the next scheduler tick retries. A
          // failed backup or settlement must never advance the visible stage.
          log({ event: 'activity_settle_failed', actId: change.actId, periodNo: change.periodNo, message: error.message });
          continue;
        }
        activityStore.markSettlement(srv, row.act_id, row.period_no, 0, 'lifecycle');
      }
      activityStore.setStage(srv, row.act_id, row.period_no, result.status, result.status === 'closed' ? at : null);
      activityStore.audit('scheduler', 'activity.stage', `${srv}:${row.act_id}:${row.period_no}`,
        { stage: previous }, { stage: result.status, reason: result.reason ?? null }, 'activity lifecycle');
      changes.push(change);
      log({ event: 'activity_stage_changed', ...change });
      try { onStageChanged?.(change); } catch (error) { log({ event: 'activity_stage_callback_failed', message: error.message }); }
    }
    return changes;
  }

  function gate(actId, need, at = clock()) {
    const row = activityStore.instance(serverId(), Number(actId));
    if (!row) return false;
    const override = activityStore.activeOverride?.(serverId(), Number(actId), at) ?? null;
    if (override?.kind === 'pause' || override?.kind === 'force_close') return false;
    const base = row.open_at != null && row.show_until != null
      ? { start: Number(row.open_at), end: Number(row.show_until) }
      : null;
    const resolved = applyOverride(base, override, at);
    if (resolved.closed || !resolved.window) return false;
    if (resolved.window.start > at || at >= resolved.window.end) return false;
    return activityGate(row.stage, need);
  }

  return { synchronizeLogin, tick, gate, evaluate, instanceFor };
}
