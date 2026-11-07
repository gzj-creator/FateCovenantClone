const FANTASY_DRAW_LIB = 226;

function rewardsOf(row) {
  if (Array.isArray(row)) return row;
  return Array.isArray(row?.lib_range) ? row.lib_range : [];
}

function referencedGroupIds(weightConfig) {
  const ids = [
    ...(weightConfig?.weight_group ?? []).map(entry => Number(entry?.[1])),
    ...(weightConfig?.guaranteed_group ?? []).map(Number)
  ].filter(Number.isSafeInteger);
  return [...new Set(ids)].sort((left, right) => left - right);
}

function versionAudit({ kind, rows, tables, heroTables, candidateTable = null }) {
  const versions = [];
  const versionLibraries = [];
  const drawLibs = new Set();
  const groupIds = new Set();
  const missingGroupIds = new Set();
  const emptyGroupIds = new Set();
  const unavailableVersions = [];

  for (const row of rows) {
    const version = Number(row?.tid);
    const drawLib = Number(row?.draw_lib);
    if (!Number.isSafeInteger(version) || version < 1 || !Number.isSafeInteger(drawLib) || drawLib < 1) {
      unavailableVersions.push({ version: row?.tid ?? null, drawLib: row?.draw_lib ?? null, reasons: ['invalid-version-row'] });
      continue;
    }
    versions.push(version);
    versionLibraries.push({ version, drawLib });
    drawLibs.add(drawLib);
    const reasons = [];
    const drawConfig = heroTables.Draw.get(drawLib);
    const guaranteeConfig = heroTables.Guaranteed.get(Number(drawConfig?.guaranteed));
    const weightConfig = tables.DrawLibWeight.get(Number(drawConfig?.group_weight));

    if (!drawConfig) reasons.push('missing-hero-draw-row');
    if (!guaranteeConfig || !(Number(guaranteeConfig.guaranteed_num) > 0)) reasons.push('missing-guarantee-row');
    if (!weightConfig) reasons.push('missing-weight-row');

    const currentGroups = referencedGroupIds(weightConfig);
    for (const groupId of currentGroups) groupIds.add(groupId);
    if (!currentGroups.length) reasons.push('no-reward-groups');
    for (const groupId of currentGroups) {
      const group = tables.DrawGroup.get(groupId);
      if (!group) {
        missingGroupIds.add(groupId);
        reasons.push(`missing-group:${groupId}`);
      } else if (!rewardsOf(group).length) {
        emptyGroupIds.add(groupId);
        reasons.push(`empty-group:${groupId}`);
      }
    }

    if (candidateTable) {
      const candidates = candidateTable.get(version)?.draw_fantasy;
      if (!Array.isArray(candidates) || !candidates.length) reasons.push('missing-fantasy-candidates');
    }

    if (reasons.length) unavailableVersions.push({ version, drawLib, reasons });
  }

  const sortedVersions = [...new Set(versions)].sort((left, right) => left - right);
  return {
    kind,
    ready: sortedVersions.length > 0 && unavailableVersions.length === 0,
    versions: sortedVersions,
    versionLibraries: versionLibraries.sort((left, right) => left.version - right.version),
    drawLibs: [...drawLibs].sort((left, right) => left - right),
    groupIds: [...groupIds].sort((left, right) => left - right),
    missingGroupIds: [...missingGroupIds].sort((left, right) => left - right),
    emptyGroupIds: [...emptyGroupIds].sort((left, right) => left - right),
    unavailableVersions
  };
}

function residentAudit({ tables, heroTables }) {
  const drawConfig = heroTables.Draw.get(FANTASY_DRAW_LIB);
  const guaranteeConfig = heroTables.Guaranteed.get(Number(drawConfig?.guaranteed));
  const weightConfig = tables.DrawLibWeight.get(Number(drawConfig?.group_weight));
  const groupIds = referencedGroupIds(weightConfig);
  const reasons = [];

  if (!tables.FantasyDrawNormal?.get(1)) reasons.push('missing-normal-config');
  if (!tables.FantasyDrawNormalWish?.size) reasons.push('missing-wish-slots');
  if (!tables.FantasyDrawUnlock?.size) reasons.push('missing-unlock-candidates');
  if (!drawConfig) reasons.push('missing-hero-draw-row');
  if (!guaranteeConfig || !(Number(guaranteeConfig.guaranteed_num) > 0)) reasons.push('missing-guarantee-row');
  if (!weightConfig) reasons.push('missing-weight-row');
  if (!groupIds.length) reasons.push('no-reward-groups');

  const missingGroupIds = [], emptyGroupIds = [];
  for (const groupId of groupIds) {
    const group = tables.DrawGroup.get(groupId);
    if (!group) {
      missingGroupIds.push(groupId);
      reasons.push(`missing-group:${groupId}`);
    } else if (!rewardsOf(group).length) {
      emptyGroupIds.push(groupId);
      reasons.push(`empty-group:${groupId}`);
    }
  }

  return {
    kind: 'resident_fantasy',
    ready: reasons.length === 0,
    drawLib: FANTASY_DRAW_LIB,
    groupIds,
    missingGroupIds,
    emptyGroupIds,
    reasons,
    wishSlotRows: tables.FantasyDrawNormalWish?.size ?? 0,
    unlockRows: tables.FantasyDrawUnlock?.size ?? 0
  };
}

/** Report absent production rewards without generating substitute groups. */
export function auditProductionDrawPools({ tables, heroTables } = {}) {
  if (!(tables?.DrawGroup instanceof Map) || !(tables?.DrawLibWeight instanceof Map)) {
    throw new Error('Draw pool audit is missing DrawGroup or DrawLibWeight');
  }
  if (!(heroTables?.Draw instanceof Map) || !(heroTables?.Guaranteed instanceof Map)) {
    throw new Error('Draw pool audit is missing HeroTable.Draw or Guaranteed');
  }

  const artifact = versionAudit({
    kind: 'artifact', rows: tables.ArtifactDrawVersion?.values?.() ?? [], tables, heroTables
  });
  const demigod = versionAudit({
    kind: 'demigod', rows: tables.DemigodDraw?.values?.() ?? [], tables, heroTables,
    candidateTable: tables.DemigodDrawFantasy
  });
  const resident = residentAudit({ tables, heroTables });
  const tasks = {
    fantasyEquipActTaskRows: tables.FantasyEquipActTask instanceof Map ? tables.FantasyEquipActTask.size : null,
    demigodActTaskRows: tables.DemigodActTask instanceof Map ? tables.DemigodActTask.size : null
  };

  return {
    schemaVersion: 1,
    artifact,
    demigod,
    resident,
    tasks,
    summary: {
      ready: { artifact: artifact.ready, demigod: demigod.ready, resident: resident.ready },
      versions: { artifact: artifact.versions.length, demigod: demigod.versions.length },
      drawLibs: { artifact: artifact.drawLibs.length, demigod: demigod.drawLibs.length },
      rewardGroups: { artifact: artifact.groupIds.length, demigod: demigod.groupIds.length, resident: resident.groupIds.length },
      emptyRewardGroups: { artifact: artifact.emptyGroupIds.length, demigod: demigod.emptyGroupIds.length, resident: resident.emptyGroupIds.length },
      tasks
    }
  };
}
