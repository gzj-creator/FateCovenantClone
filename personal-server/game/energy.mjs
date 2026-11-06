export const MISSION_ENERGY_MODULE_ID = 8;
export const MISSION_ENERGY_SLOT = 2;
export const MISSION_ENERGY_TID = '100012900';

function seconds(now) {
  const value = typeof now === 'function' ? now() : now;
  const milliseconds = Number(value);
  if (!Number.isFinite(milliseconds)) throw new Error('Energy recovery clock is invalid');
  return Math.floor(milliseconds / 1000);
}

export function energyMaxForRole(missionTables, tid, roleLevel) {
  const item = Number(tid), level = Number(roleLevel);
  const rows = [...(missionTables?.energyMax?.values?.() ?? [])]
    .filter(row => Number(row.item) === item && Number(row.level) <= level)
    .sort((left, right) => Number(left.level) - Number(right.level));
  return rows.length ? Number(rows.at(-1).max) : null;
}

// EnergyRes.GetNum in the shipped Lua uses one point per EnergyConst.period.
// rate is only used by the growth interfaces; dividing by it here would make
// the server overstate recovery and disagree with the client timer.
export function refreshEnergyResource(resource, { missionTables, roleLevel, now = Date.now } = {}) {
  if (!resource || String(resource.tid) !== MISSION_ENERGY_TID) return 0;
  const config = missionTables?.energyConst?.get?.(Number(resource.tid));
  const period = Number(config?.period);
  if (!Number.isSafeInteger(period) || period <= 0) return 0;

  const nowSeconds = seconds(now);
  const max = energyMaxForRole(missionTables, resource.tid, roleLevel);
  let amount = Number(resource.num ?? 0);
  let produceTime = Number(resource.produce_time ?? 0);
  if (!Number.isSafeInteger(amount) || amount < 0) throw new Error('Energy amount is invalid');
  if (!Number.isSafeInteger(produceTime) || produceTime <= 0) produceTime = nowSeconds;
  if (!Number.isSafeInteger(max) || max <= 0 || amount >= max) {
    resource.produce_time = produceTime;
    return 0;
  }

  const gained = Math.min(max - amount, Math.max(0, Math.floor((nowSeconds - produceTime) / period)));
  if (gained > 0) {
    amount += gained;
    produceTime += gained * period;
    // Once the natural cap is reached there is no next-production anchor.
    if (amount >= max) produceTime = nowSeconds;
    resource.num = String(amount);
    resource.produce_time = produceTime;
  }
  return gained;
}

export function refreshEnergyResources(model, options) {
  let gained = 0;
  for (const resource of model.resources?.values?.() ?? []) {
    gained += refreshEnergyResource(resource, { ...options, roleLevel: model.role?.level });
  }
  return gained;
}

export function isMissionEnergyResource(resource) {
  return String(resource?.tid) === MISSION_ENERGY_TID;
}

export function missionEnergyBin(codec, resource) {
  return codec.pack('pb_mission_energy_res', {
    tid: String(resource.tid),
    num: String(resource.num),
    produce_time: Number(resource.produce_time ?? 0)
  });
}
