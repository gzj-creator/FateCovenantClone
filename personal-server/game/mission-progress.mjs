let missionOrderCache = null;

export const OFFLINE_FIXTURE_LAST_CLEARED_MISSION_ID = 20205;
export const OFFLINE_FIXTURE_PASS_COUNT = 9;
export const PREMATURE_OFFLINE_FIXTURE_MISSION_ID = 30201;
// The fixture role is level 9. At that level the client renders a full
// 140/140 stamina bar, but the captured login modules never contained the
// mutable currency row that the mission cost path must consume.
export const OFFLINE_FIXTURE_STARTER_ROLE_LEVEL = 9;
export const OFFLINE_FIXTURE_STAMINA_TID = '100012900';
export const OFFLINE_FIXTURE_STARTER_STAMINA = 140;

export function missionOrder(sections) {
  if (!missionOrderCache || missionOrderCache.sections !== sections) {
    const entries = [...sections.entries()]
      .filter(([, section]) => !section?.is_discard)
      .sort((left, right) => Number(left[1]?.index ?? left[0]) - Number(right[1]?.index ?? right[0]) || Number(left[0]) - Number(right[0]));
    missionOrderCache = { sections, entries };
  }
  return missionOrderCache.entries;
}

export function missionPosition(sections, missionId) {
  return missionOrder(sections).findIndex(([id]) => Number(id) === Number(missionId));
}

export function previousMissionId(sections, missionId) {
  const order = missionOrder(sections), position = missionPosition(sections, missionId);
  return position > 0 ? Number(order[position - 1][0]) : Number(missionId);
}

export function rollbackPrematureOfflineFixtureMissionCursor(mission, sections) {
  const current = Number(mission?.mission_id ?? 0);
  if (current !== PREMATURE_OFFLINE_FIXTURE_MISSION_ID) return false;
  const previous = previousMissionId(sections, current);
  if (previous !== OFFLINE_FIXTURE_LAST_CLEARED_MISSION_ID) {
    throw new Error(`Premature fixture cursor has an unexpected predecessor: ${current} -> ${previous}`);
  }
  mission.mission_id = String(previous);
  return true;
}
