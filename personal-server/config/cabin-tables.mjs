// Values extracted from CampsiteTable.data.lua (client bundle):
// 13383511913250537000-CampsiteTable.data.lua.bin
// sha256 f2081abc4c586e4df0873462c3baac3d182bb425fff80d88a7d44b86e798c627.
// Only server-authoritative fields are kept here; presentation strings and
// attribute aggregation remain client-side.

export const CAMPSITE_MODULE_ID = 114;

export const CAMPSITE_CONST = Object.freeze({
  maxCell: 4,
  initCell: 3,
  unlockId: '101500',
  unlockCount: 1000,
  oneKeyCount: 24
});

const GROUP_ROWS = [
  { groupId: 1, camp: 1, profession: 0, unlockLevel: 42, unlockCount: 500, gridNum: 4, featureId: 1037 },
  { groupId: 2, camp: 2, profession: 0, unlockLevel: 42, unlockCount: 1000, gridNum: 4, featureId: 1037 },
  { groupId: 3, camp: 3, profession: 0, unlockLevel: 42, unlockCount: 1500, gridNum: 4, featureId: 1037 },
  { groupId: 4, camp: 4, profession: 0, unlockLevel: 42, unlockCount: 2000, gridNum: 4, featureId: 1037 },
  { groupId: 5, camp: 0, profession: 1, unlockLevel: 44, unlockCount: 1000, gridNum: 4, featureId: 1060 },
  { groupId: 6, camp: 0, profession: 4, unlockLevel: 44, unlockCount: 1500, gridNum: 4, featureId: 1060 },
  { groupId: 7, camp: 0, profession: 3, unlockLevel: 44, unlockCount: 2000, gridNum: 4, featureId: 1060 },
  { groupId: 8, camp: 0, profession: 2, unlockLevel: 44, unlockCount: 3000, gridNum: 4, featureId: 1060 },
  { groupId: 9, camp: 9, profession: 0, unlockLevel: 42, unlockCount: 500, gridNum: 4, featureId: 1037 }
];

export const CAMPSITE_GROUPS = new Map(GROUP_ROWS.map(row => [row.groupId, Object.freeze(row)]));

export function campsiteGroup(groupId) {
  return CAMPSITE_GROUPS.get(Number(groupId)) ?? null;
}

export function campsiteGroupsForRoleLevel(level) {
  const roleLevel = Number(level);
  if (!Number.isSafeInteger(roleLevel)) return [];
  return [...CAMPSITE_GROUPS.values()]
    .filter(group => roleLevel >= group.unlockLevel)
    .sort((left, right) => left.groupId - right.groupId);
}
