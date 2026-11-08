import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import crypto from 'node:crypto';
import { E, encodeEtf, decodeEtf, binary, revive, rawBinary, createGameCodec } from '../protocol/game-codec.mjs';
import { createGameStore } from '../storage/game-store.mjs';
import { createHeroProgression, GameError } from './hero-progression.mjs';
import { createHeroExtraService } from './hero-extra-service.mjs';
import { createHeroDevelopService } from './hero-develop-service.mjs';
import { createHeroBondService } from './hero-bond-service.mjs';
import { createHeroSupportService } from './hero-support-service.mjs';
import { createHeroRentService } from './hero-rent-service.mjs';
import { createHeroMasteryService } from './hero-mastery-service.mjs';
import { buildLineupAttrInfo } from './attribute-service.mjs';
import { readAttributeTables } from '../config/attribute-tables.mjs';
import { createLineupService } from './lineup-service.mjs';
import { createLeaderEquipService } from './leader-equip-service.mjs';
import { createEquipService } from './equip-service.mjs';
import { createLeaderEquipDevelopService } from './leader-equip-develop-service.mjs';
import { createWarRuneService } from './war-rune-service.mjs';
import { createMuseumService } from './museum-service.mjs';
import { createPetService } from './pet-service.mjs';
import { createTreasureService } from './treasure-service.mjs';
import { createElvesService } from './elves-service.mjs';
import { createElvesBeadService } from './elves-bead-service.mjs';
import { createDevelopExtraService } from './develop-extra-service.mjs';
import { createRelicService } from './relic-service.mjs';
import { readRelicTables } from '../config/relic-tables.mjs';
import { createCabinService, CAMPSITE_MODULE_ID } from './cabin-service.mjs';
import { createHouseAssistantService, HOUSE_ASSISTANT_MODULE_ID } from './house-assistant-service.mjs';
import { readHouseAssistantTables } from '../config/house-assistant-tables.mjs';
import { createRankService } from './rank-service.mjs';
import { createRankAchieveService } from './rank-achieve-service.mjs';
import { createFirstWeekGoalService } from './first-week-goal-service.mjs';
import { createGrowthRoadService } from './growth-road-service.mjs';
import { createFunctionManualService } from './function-manual-service.mjs';
import { createTaskActivityService } from './task-activity-service.mjs';
import { readFunctionManualTables, readTaskActivityTables } from '../config/item-task-tables.mjs';
import { createFriendService } from './friend-service.mjs';
import { createMessageService } from './message-service.mjs';
import { createArtifactService } from './artifact-service.mjs';
import { createChatService } from './chat-service.mjs';
import { readRankAchieveTables } from '../config/rank-achieve-tables.mjs';
import { createFeatureService } from './feature-service.mjs';
import { readFantasyEquipTables, readHeroTables, readLeaderEquipTables } from '../config/hero-tables.mjs';
import { readEquipTables } from '../config/equip-tables.mjs';
import { readGameTables } from '../config/game-tables.mjs';
import { readOnlineGiftTables } from '../config/online-gift-tables.mjs';
import { createOnlineGiftService } from './online-gift-service.mjs';
import { createWalletService } from './wallet-service.mjs';
import { createWelfareService } from './welfare-service.mjs';
import { createTaskService } from './task-service.mjs';
import { createEveryTaskService } from './every-task-service.mjs';
import { createSprintService } from './sprint-service.mjs';
import { createItemBoxService } from './item-box-service.mjs';
import { createMissionFightService } from './mission-fight-service.mjs';
import { createBattleRecordService } from './battle-record-service.mjs';
import { createCommonMapService } from './common-map-service.mjs';
import { createStarMissionService } from './star-mission-service.mjs';
import { readCommonMapTables } from '../config/common-map-tables.mjs';
import { readStarMissionTables } from '../config/star-mission-tables.mjs';
import { createMissionExtraService } from './mission-extra-service.mjs';
import { createActivityReadService } from './activity-read-service.mjs';
import { createHundredDrawService } from './hundred-draw-service.mjs';
import { createBonusDrawService } from './bonus-draw-service.mjs';
import { createDrawActivityService } from './draw-activity-service.mjs';
import { createCmsService } from './cms-service.mjs';
import { createGuildNationAssistService } from './guild-nation-assist-service.mjs';
import { activityWindow, createActivityCalendar, serverDayNumber } from './activity-calendar.mjs';
import { createAccRechargeService } from './acc-recharge-service.mjs';
import { createGroupBuyActService } from './group-buy-act-service.mjs';
import { readGroupBuyActTables } from '../config/group-buy-act-tables.mjs';
import { createDragonLandActService } from './dragon-land-act-service.mjs';
import { readDragonLandTables } from '../config/dragon-land-tables.mjs';
import { createDiamondBankActService } from './diamond-bank-act-service.mjs';
import { readDiamondBankActTables } from '../config/diamond-bank-act-tables.mjs';
import { createFreePrivilegeActService } from './free-privilege-act-service.mjs';
import { readFreePrivilegeActTables } from '../config/free-privilege-act-tables.mjs';
import { createSlotGameActService } from './slot-game-act-service.mjs';
import { createActRewardService, ACT_REWARD_ETF_TYPES } from './act-reward-service.mjs';
import { readActActivityTables } from '../config/act-activity-tables.mjs';
import { readSlotGameActTables } from '../config/slot-game-act-tables.mjs';
import { createMinigameActService } from './minigame-act-service.mjs';
import { readMinigameActTables } from '../config/minigame-act-tables.mjs';
import { createHundredAccService } from './hundred-acc-service.mjs';
import { createPetActivityService } from './pet-activity-service.mjs';
import { createShopService } from './shop-service.mjs';
import { createVoucherService } from './voucher-service.mjs';
import { createPermitService } from './permit-service.mjs';
import { createMonthPermitService } from './month-permit-service.mjs';
import { createMonthlyCardService } from './monthly-card-service.mjs';
import { createMailService } from './mail-service.mjs';
import { createRecruitService } from './recruit-service.mjs';
import { createHeroHandbookService } from './hero-handbook-service.mjs';
import { createGuildRosterService } from './guild-roster-service.mjs';
import { createGuildSocietyService } from './guild-society-service.mjs';
import { createSocialCommunityService } from './social-community-service.mjs';
import { createGuildActivityService } from './guild-activity-service.mjs';
import { createHeroFavorService } from './hero-favor-service.mjs';
import { createTeamSuggestService } from './team-suggest-service.mjs';
import { createTeamGenreService } from './team-genre-service.mjs';
import { createDestinyService } from './destiny-service.mjs';
import { createEliteMissionService } from './elite-mission-service.mjs';
import { createEliteMissionBattle } from './elite-mission-battle.mjs';
import { createPeakTowerService } from './peak-tower-service.mjs';
import { readPeakTowerTables } from '../config/peak-tower-tables.mjs';
import { createGeneralDungeonService } from './general-dungeon-service.mjs';
import { readGeneralDungeonTables } from '../config/general-dungeon-tables.mjs';
import { createFameHallService } from './fame-hall-service.mjs';
import { createWorldBossService } from './world-boss-service.mjs';
import { createPitLordService } from './pit-lord-service.mjs';
import { createRedCliffService } from './red-cliff-service.mjs';
import { readRedCliffTables } from '../config/dungeon-activity-tables.mjs';
import { createTowerDefenseService } from './tower-defense-service.mjs';
import { readTowerDefenseTables } from '../config/dungeon-activity-tables.mjs';
import { createSoulTrialService } from './soul-trial-service.mjs';
import { createScarletTrialService } from './scarlet-trial-service.mjs';
import { readSoulTrialTables, readScarletTrialTables } from '../config/dungeon-activity-tables.mjs';
import { createCampTowerService } from './camp-tower-service.mjs';
import { createDestinyPveService } from './destiny-pve-service.mjs';
import { readCampTowerTables, readDestinyPveTables } from '../config/dungeon-activity-tables.mjs';
import { readDestinyTables } from '../config/destiny-tables.mjs';
import { createMagicCircleService } from './magic-circle-service.mjs';
import { readMagicCircleTables } from '../config/magic-circle-tables.mjs';
import { createNorseRuneService } from './norse-rune-service.mjs';
import { readNorseRuneTables } from '../config/norse-rune-tables.mjs';
import { createHeroDrawActivityService } from './hero-draw-activity-service.mjs';
import { createFantasyDrawService } from './fantasy-draw-service.mjs';
import { createFantasyEquipmentService } from './fantasy-equipment-service.mjs';
import { createFantasySharedDrawService } from './fantasy-shared-draw-service.mjs';
import { createArtifactDrawPool } from './artifact-draw-pool.mjs';
import { createDemigodDrawPool } from './demigod-draw-pool.mjs';
import { createResidentFantasyDrawPool } from './resident-fantasy-draw-pool.mjs';
import { createArtifactDrawActService } from './artifact-draw-act-service.mjs';
import { loadFantasyActTables } from './fantasy-act-tables.mjs';
import { createDemigodActService } from './demigod-act-service.mjs';
import { createFantasyEquipActService } from './fantasy-equip-act-service.mjs';
import { mergeRelicLoginContainer, RELIC_ACTIVITY_LOGIN_MODULE_ID } from './relic-divine-login.mjs';
import { createWishTreasureService } from './wish-treasure-service.mjs';
import { createWishTreeService } from './wish-tree-service.mjs';
import { createWeekHuntService } from './week-hunt-service.mjs';
import { createFirstRechargeService } from './first-recharge-service.mjs';
import { createRechargeBonusService } from './recharge-bonus-service.mjs';
import { createLineFirstRechargeService } from './line-first-recharge-service.mjs';
import { createRechargeRebateResetService } from './recharge-rebate-reset-service.mjs';
import { createRechargeExtraAwardService } from './recharge-extra-award-service.mjs';
import { createTimeTempleService } from './time-temple-service.mjs';
import { createBenefitCommerceService } from './benefit-commerce-service.mjs';
import { createGuideService } from './guide-service.mjs';
import { createRoleService } from './role-service.mjs';
import { createStoryService } from './story-service.mjs';
import { createCdkeyService } from './cdkey-service.mjs';
import { createActFrameService } from './act-frame-service.mjs';
import { createSkinService } from './skin-service.mjs';
import { readGuideAwards } from '../config/guide-awards.mjs';
import { roleLoginDayCount } from './recharge-rules.mjs';
import { GameFrameDecoder, encodeGameFrame, isInitialVerifyPayload } from '../game-framing.mjs';
import { createServerHandshakeChallenge, LOCAL_AES_PROFILE } from '../game-handshake.mjs';

export { encodeEtf, decodeEtf, binary, revive, loadGameSchemas } from '../protocol/game-codec.mjs';
export function createLocalGame({
  databasePath,
  statePath,
  capturePath,
  verifySession,
  serverOpenedAt,
  activityMode = 'schedule',
  currentFishingActivityId,
  currentArtifactActivityId,
  currentDemigodActivityId,
  currentFantasyActivityId,
  relicDrawGroupResolver,
  sprintPreview = false,
  localWallet = false,
  missionFightPlayback = false,
  eliteEnemies = null,
  guideAwards = readGuideAwards(),
  now = Date.now,
  random = Math.random,
  logger = () => {}
}) {
  const codec = createGameCodec(), { root, pack, unpack } = codec;
  const clock = () => Number(now());
  function seed() {
    const capture = JSON.parse(fs.readFileSync(capturePath));
    const template = capture.privateFlows.find(x => x.messageId === 'game:tcp-69:s2c:103')?.decoded;
    if (!template || template[0] !== 1) throw new Error('Verified login structure missing');
    const modules = new Map(template[2].value);
    const role = unpack('to_client_role_info', rawBinary(modules.get(2)));
    role.nick_name = Buffer.from('Local Adventurer');
    role.res = { changes: [] };
    return { version: 1, roleId: 100001, serverId: 1, createdAt: Math.floor(clock() / 1000) - 86400,
      seedSource: 'offline captured early-game structural fixture; independent local test save',
      modules: template[2], rolePb: pack('to_client_role_info', role).toString('base64'), guides: {}, lineups: null };
  }
  const store = createGameStore({ databasePath: databasePath ?? path.join(path.dirname(statePath), 'game.local-only.sqlite'), legacyStatePath: statePath, seed, codec, serverOpenedAt });
  const heroTables = readHeroTables(), fantasyEquipTables = readFantasyEquipTables();
  const attributeTables = readAttributeTables();
  const leaderEquipTables = readLeaderEquipTables(), tables = readGameTables();
  const onlineGiftTables = readOnlineGiftTables();
  const fantasyActTables = loadFantasyActTables();
  const relicTables = { ...tables, ...fantasyActTables };
  const calendar = createActivityCalendar({
    tables,
    serverOpenedAt: serverOpenedAt ?? store.serverOpenedAt,
    mode: activityMode,
    currentFishingActivityId,
    now: clock
  });
  const secondsClock = () => Math.floor(clock() / 1000);
  if (relicDrawGroupResolver !== undefined && typeof relicDrawGroupResolver !== 'function') {
    throw new Error('relicDrawGroupResolver must be a function');
  }
  const artifactActivityRows = new Map([...tables.Activity.values()]
    .filter(row => Number(row?.func) === 159)
    .map(row => [Number(row.tid), row]));
  const relicActivityOverrides = new Map();
  for (const [kind, value] of [
    ['artifact', currentArtifactActivityId],
    ['demigod', currentDemigodActivityId],
    ['fantasy', currentFantasyActivityId]
  ]) {
    if (value == null) continue;
    const id = Number(value);
    if (!Number.isSafeInteger(id) || id < 1) throw new Error(`Invalid ${kind} activity id`);
    relicActivityOverrides.set(kind, id);
  }

  function parseActivityLogin(model = null) {
    try {
      const source = model ? model.state.modules : store.state().modules;
      const entry = new Map(source.value).get(92);
      return entry ? unpack('pb_act_login', rawBinary(entry)) : { act_list: [], act_parallel_list: [], act_pause_list: [], act_custom_list: [] };
    } catch (error) {
      logger({ event: 'relic_activity_login_parse_failed', message: error.message });
      return { act_list: [], act_parallel_list: [], act_pause_list: [], act_custom_list: [] };
    }
  }

  function activityStateRows(activity) {
    return [
      ...(activity.act_list ?? []).map(entry => ({ state: entry.state_data, data: entry })),
      ...(activity.act_parallel_list ?? []).flatMap(group => (group.states_data ?? []).map(state => ({ state, data: state })))
    ];
  }

  function stateDataFor(activity, actTid) {
    const id = Number(actTid);
    return activityStateRows(activity).find(row => Number(row.state?.act_id) === id)?.state ?? null;
  }

  function relicActivityConfig(kind, actTid) {
    const id = Number(actTid);
    if (kind === 'artifact') return artifactActivityRows.get(id) ?? null;
    if (kind === 'demigod') return relicTables.DemigodActSchedule?.get(id) ?? null;
    if (kind === 'fantasy') return relicTables.FantasyActSchedule?.get(id) ?? null;
    return null;
  }

  function relicActivityIds(kind) {
    if (kind === 'artifact') return [...artifactActivityRows.keys()].sort((left, right) => right - left);
    if (kind === 'demigod') return [...(relicTables.DemigodActSchedule?.keys() ?? [])].sort((left, right) => right - left);
    if (kind === 'fantasy') return [...(relicTables.FantasyActSchedule?.keys() ?? [])].sort((left, right) => right - left);
    return [];
  }

  function activityKindForId(actTid) {
    const id = Number(actTid);
    if (artifactActivityRows.has(id)) return 'artifact';
    if (relicTables.DemigodActSchedule?.has(id)) return 'demigod';
    if (relicTables.FantasyActSchedule?.has(id)) return 'fantasy';
    return null;
  }

  function activityIsOpen(kind, actTid, model = null, seconds = secondsClock()) {
    const id = Number(actTid);
    const config = relicActivityConfig(kind, id);
    if (!config) return false;
    const activity = parseActivityLogin(model);
    return calendar.isActivityRunning(id, stateDataFor(activity, id), activity, seconds);
  }

  function currentRelicActivityId(kind, model = null, seconds = secondsClock()) {
    const override = relicActivityOverrides.get(kind);
    if (override !== undefined) return override;
    const activity = parseActivityLogin(model);
    const fromLogin = activityStateRows(activity)
      .filter(row => activityKindForId(row.state?.act_id) === kind)
      .filter(row => activityIsOpen(kind, row.state?.act_id, model, seconds))
      .map(row => Number(row.state.act_id));
    if (fromLogin.length) return fromLogin.at(-1);
    return relicActivityIds(kind).find(id => activityIsOpen(kind, id, model, seconds)) ?? null;
  }

  function relicActivityWindow(actTid) {
    const id = Number(actTid), config = tables.Activity?.get(id);
    if (!config) throw new GameError(5, `Activity ${id} is missing for module 183`);
    const window = activityWindow(config, calendar.serverOpenedAt);
    if (!window) throw new GameError(5, `Activity ${id} has no reproducible login window`);
    return window;
  }

  function ensureRelicActivityLoginEntry(activity, actTid, seconds) {
    const id = Number(actTid);
    if (!id) return;
    const config = relicActivityConfig(activityKindForId(id), id);
    if (!config) throw new GameError(5, `Activity ${id} is not configured`);
    if (stateDataFor(activity, id)) return;
    const window = relicActivityWindow(id);
    activity.act_list.push({
      state_data: {
        act_id: id,
        cur_state_id: 50,
        history_time: [{ state_id: 50, enter_time: Math.max(Number(window.start), Number(seconds)) }]
      },
      module_login_data: Buffer.alloc(0)
    });
  }

  const heroDrawActivity = createHeroDrawActivityService({ store, codec, tables, heroTables, calendar, now: clock, logger });
  const fantasyDraw = createFantasyDrawService({ store, codec, tables, now: secondsClock });
  let demigodAct, fantasyEquipAct;
  const fantasyEquipment = createFantasyEquipmentService({
    store, codec, tables,
    extraReferences: (model, uid) => [
      ...(demigodAct?.shared.activityReferences(model) ?? []),
      ...(fantasyEquipAct?.shared.activityReferences(model) ?? [])
    ].filter(reference => Number(reference.uid) === Number(uid))
  });
  const artifactDrawAct = createArtifactDrawActService({
    store, codec, tables: relicTables, heroTables, inventory: fantasyEquipment.inventory,
    now: secondsClock, random, logger,
    assertOpen: ({ actTid, seconds, model }) => activityIsOpen('artifact', actTid, model, seconds)
  });
  const dynamicDemigodActivity = { valueOf: () => currentRelicActivityId('demigod') };
  const dynamicFantasyActivity = { valueOf: () => currentRelicActivityId('fantasy') };
  const relicActivityGate = ({ kind, actTid, seconds, model }) => activityIsOpen(kind, actTid, model, seconds);
  demigodAct = createDemigodActService({
    store, codec, tables: relicTables, fantasyTables: fantasyActTables,
    now: secondsClock, activityTid: dynamicDemigodActivity, assertOpen: relicActivityGate,
    marblesRandom: random, logger
  });
  fantasyEquipAct = createFantasyEquipActService({
    store, codec, tables: relicTables, fantasyTables: fantasyActTables,
    now: secondsClock, activityTid: dynamicFantasyActivity, assertOpen: relicActivityGate,
    marblesRandom: random, logger
  });
  const artifactDrawPool = createArtifactDrawPool({
    tables: relicTables, heroTables, random,
    resolveVersion: ({ drawLib, model, seconds }) => {
      const actTid = currentRelicActivityId('artifact', model, seconds);
      const row = actTid ? artifactActivityRows.get(actTid) : null;
      const version = relicTables.ArtifactDrawVersion.get(Number(row?.version));
      return Number(version?.draw_lib) === Number(drawLib) ? version?.tid : null;
    },
    assertOpen: ({ version, model, seconds }) => {
      const actTid = currentRelicActivityId('artifact', model, seconds);
      const row = actTid ? artifactActivityRows.get(actTid) : null;
      return Number(row?.version) === Number(version?.tid) && activityIsOpen('artifact', actTid, model, seconds);
    }
  });
  const demigodDrawPool = createDemigodDrawPool({
    tables: relicTables, heroTables, inventory: fantasyEquipment.inventory, codec, random,
    ...(relicDrawGroupResolver ? {
      resolveGroup: groupId => relicDrawGroupResolver({ kind: 'demigod', groupId: Number(groupId), tables: relicTables })
    } : {}),
    resolveVersion: ({ drawLib, model, seconds }) => {
      const actTid = currentRelicActivityId('demigod', model, seconds);
      const row = actTid ? relicTables.DemigodActSchedule?.get(actTid) : null;
      const version = relicTables.DemigodDraw.get(Number(row?.version));
      return Number(version?.draw_lib) === Number(drawLib) ? version?.tid : null;
    },
    assertOpen: ({ version, model, seconds }) => {
      const actTid = currentRelicActivityId('demigod', model, seconds);
      const row = actTid ? relicTables.DemigodActSchedule?.get(actTid) : null;
      return Number(row?.version) === Number(version?.tid) && activityIsOpen('demigod', actTid, model, seconds);
    }
  });
  const residentFantasyDrawPool = createResidentFantasyDrawPool({
    tables: relicTables, heroTables, inventory: fantasyEquipment.inventory, codec, random,
    ...(relicDrawGroupResolver ? {
      resolveGroup: groupId => relicDrawGroupResolver({ kind: 'resident_fantasy', groupId: Number(groupId), tables: relicTables })
    } : {}),
    assertOpen: () => true
  });
  const fantasySharedDraw = createFantasySharedDrawService({
    store, codec, now: secondsClock,
    pools: [artifactDrawPool, demigodDrawPool, residentFantasyDrawPool],
    onDraw: (model, detail) => {
      const pushEvents = [];
      if (detail.pool === 'artifact') {
        artifactDrawAct.onFantasyDraw(model, { ...detail, version: detail.event?.version });
        const drawConfig = heroTables.Draw.get(Number(detail.event?.drawLib));
        const guarantee = heroTables.Guaranteed.get(Number(drawConfig?.guaranteed));
        const pushValue = {
          wish_tid: 0,
          normal_guarantee_times: Number(guarantee?.guaranteed_num ?? 0),
          guarantee_progress: Number(detail.poolState?.guaranteed_count ?? 0),
          all_guarantee_times: Number(detail.poolState?.total_draw_count ?? 0)
        };
        pushEvents.push({ kind: 'fantasy_act_draw_update', pushType: 7001, schema: 'pb_fantasy_equip_act_draw', value: pushValue, data: codec.pack('pb_fantasy_equip_act_draw', pushValue) });
      } else if (detail.pool === 'demigod') {
        const draw = demigodAct.recordDraw(model, { count: detail.count }, detail.event?.version);
        const pushValue = { draw_num: Number(draw.draw_num ?? 0), wish_list: [], version_draw_num: String(draw.version_draw_num ?? '0') };
        pushEvents.push({ kind: 'demigod_act_draw_update', pushType: 9160, schema: 'pb_demigod_act_draw_back', value: pushValue, data: codec.pack('pb_demigod_act_draw_back', pushValue) });
      } else if (detail.pool === 'resident_fantasy') {
        fantasyEquipAct.recordDraw(model, { count: detail.count }, currentRelicActivityId('fantasy', model, detail.seconds));
      }
      return { pushEvents };
    }
  });
  const petActivity = createPetActivityService({ store, codec, tables, calendar, now: clock, logger });
  const shop = createShopService({
    store,
    codec,
    tables,
    now: clock,
    logger,
    fallbackShopInfo: shopId => petActivity.queryShops([shopId])[0]
  });
  const wishTreasure = createWishTreasureService({ store, codec, tables, calendar, now: clock, logger });
  const wishTree = createWishTreeService({ store, codec, tables, now: clock, logger });
  const weekHunt = createWeekHuntService({ store, codec, tables, now: clock });
  const firstRecharge = createFirstRechargeService({ store, codec, tables, now: clock, logger });
  const onlineGift = createOnlineGiftService({
    store, codec, tables: onlineGiftTables, gameTables: tables,
    serverOpenedAt: calendar.serverOpenedAt, now: clock, logger
  });
  const rechargeBonus = createRechargeBonusService({ store, codec, tables, calendar, now: clock, logger });
  const lineFirstRecharge = createLineFirstRechargeService({ store, codec, tables, now: clock, logger });
  const rechargeRebateReset = createRechargeRebateResetService({ store, codec, tables, calendar, now: clock, logger });
  const rechargeExtraAward = createRechargeExtraAwardService({ codec, tables, logger });
  const progression = createHeroProgression({ store, codec, tables: heroTables });
  const heroExtra = createHeroExtraService({ store, codec, tables, heroTables, now: clock, random, logger });
  // HERO-HERO residual commands are split by subsystem; each module owns the
  // decoding of its own type list so the dispatch stays one branch.
  const heroDevelop = createHeroDevelopService({ store, codec, tables, heroTables, now: clock, logger });
  const heroBond = createHeroBondService({ store, codec, tables, heroTables, now: clock, logger });
  const heroSupport = createHeroSupportService({ store, codec, tables, heroTables, now: clock, logger });
  const heroRent = createHeroRentService({ store, codec, tables, heroTables, now: clock, logger });
  const heroCommandServices = [heroDevelop, heroBond, heroSupport, heroRent];
  const heroMastery = createHeroMasteryService({ store, codec, heroTables });
  const lineups = createLineupService({ store, codec });
  const leaderEquip = createLeaderEquipService({ store, codec, tables: leaderEquipTables });
  const equip = createEquipService({ store, codec, tables: readEquipTables() });
  // Block C endgame development: the leader-equipment develop commands share
  // module 175 with the wear command; the remaining families keep their state in
  // login modules 158/534/538/539 or in develop_module_state.
  const endgameDevelopServices = [
    createLeaderEquipDevelopService({ store, codec }),
    createWarRuneService({ store, codec, now: clock, random }),
    createMuseumService({ store, codec, now: clock }),
    createPetService({ store, codec, now: clock }),
    createTreasureService({ store, codec }),
    createElvesService({ store, codec }),
    createElvesBeadService({ store, codec, now: clock }),
    createDevelopExtraService({ store, codec, now: clock })
  ];
  // ArtifactCmd 37060-37075. The artifact login payload is module 50 slot 0, so
  // ensureLoginState only normalises rows that grantArtifact() stored as {tid,num}.
  const artifact = createArtifactService({ store, codec, logger });
  const relic = createRelicService({ store, codec, tables: readRelicTables(), resourceTables: tables, random, now });
  const cabin = createCabinService({ store, codec, heroTables });
  const houseAssistant = createHouseAssistantService({
    store,
    codec,
    gameTables: tables,
    tables: readHouseAssistantTables(),
    now: clock
  });
  const ranks = createRankService({ codec, store, now: clock, logger });
  const rankAchieve = createRankAchieveService({
    store, codec, tables: readRankAchieveTables(), resourceTables: tables, now: clock, logger
  });
  const firstWeekGoal = createFirstWeekGoalService({
    store, codec, gameTables: tables, serverOpenedAt: calendar.serverOpenedAt, now: clock, logger
  });
  const growthRoad = createGrowthRoadService({
    store, codec, gameTables: tables, serverOpenedAt: calendar.serverOpenedAt, now: clock, logger
  });
  // ITEM-FUNCTIONMANUAL (FunctionManualCmd 82301) and ITEM-TASKACTIVITY
  // (TaskActivityCmd 105701). The handbook reads the client's FunctionManualTable
  // rows; the task activity rides on ActFrame type 1003 and keeps its finished
  // task list in its own SQLite table.
  const functionManual = createFunctionManualService({
    store, codec, tables: readFunctionManualTables(), gameTables: tables, now: clock, logger
  });
  const taskActivity = createTaskActivityService({
    store, codec, tables: readTaskActivityTables(), gameTables: tables,
    serverOpenedAt: calendar.serverOpenedAt, now: clock, logger
  });
  // FriendCmd 20001-20013. The login module slot for res_friend_login is not
  // recovered, so it stays out of the login container until the owner wires it.
  const friend = createFriendService({
    store, codec, serverOpenedAt: calendar.serverOpenedAt, now: clock, logger
  });
  // MsgCmd 10501-10511. ETF requests are decoded by Connection.EncodeErl; 10501
  // and 10510 carry protobuf pb_req_send_msg on the same envelope.
  const message = createMessageService({
    store, codec, serverOpenedAt: calendar.serverOpenedAt, now: clock, logger
  });
  const chat = createChatService({ store, codec, now: clock, logger });
  // Guild commands beyond the roster set: GuildCmd 21001-21031, GuildDataCmd
  // 171 and GuildActiveCmd 85501-85505 share module 24 with guild-roster.
  const guildSociety = createGuildSocietyService({
    store, codec, tables, serverOpenedAt: calendar.serverOpenedAt, now: clock, logger
  });
  // Social/community family: SupportCmd 46001-46002, map 75001-75005,
  // hero comments 76601-76605, relations 77501-77503, 77601, 79201, 84701.
  const community = createSocialCommunityService({
    store, codec, serverOpenedAt: calendar.serverOpenedAt, now: clock, logger
  });
  // Guild activity commands: red envelope 83101-83108, trial 83401-83411,
  // explore 89301-89352, guild war 90001-90016, duel 90701-90707, racing 91201-91209.
  const guildActivity = createGuildActivityService({
    store, codec, tables, serverOpenedAt: calendar.serverOpenedAt, now: clock, logger
  });
  const features = createFeatureService({ store, codec, sprintPreview });
  const recruit = createRecruitService({
    store,
    codec,
    tables,
    heroTables,
    fantasyEquipTables,
    leaderEquipTables,
    now: () => Math.floor(clock() / 1000),
    onDraw: (model, draw) => heroDrawActivity.recordDraw(model, { ...draw, seconds: Math.floor(draw.seconds) })
  });
  const handbook = createHeroHandbookService({ store, codec, heroTables, tables });
  const guildRoster = createGuildRosterService({ store, codec, now: () => Math.floor(clock() / 1000) });
  const heroFavor = createHeroFavorService({
    store, codec, heroTables, tables, now: () => Math.floor(clock() / 1000)
  });
  const teamSuggest = createTeamSuggestService({ store, codec, tables, heroTables, now: clock });
  const teamGenre = createTeamGenreService({ store, codec, tables, heroTables, calendar, now: clock });
  const destiny = createDestinyService({ store, codec, tables: readDestinyTables() });
  const eliteMission = createEliteMissionService({ store, codec, tables: readGameTables(), logger });
  const peakTower = createPeakTowerService({ store, codec, tables: readPeakTowerTables(), logger, now: clock });
  const generalDungeon = createGeneralDungeonService({ store, codec, tables: readGeneralDungeonTables(), gameTables: tables, logger, now: clock });
  // BATTLE-FAMEHALL / WORLDBOSS / PITLORD. Fame hall command payload encodings are
  // recovered from FameHallCmd.lua; the boss groups keep their own SQLite state.
  const fameHall = createFameHallService({ store, codec, gameTables: tables, artifact, now: clock, logger });
  const worldBoss = createWorldBossService({ store, codec, gameTables: tables, now: clock, logger });
  const pitLord = createPitLordService({ store, codec, gameTables: tables, now: clock, logger });
  // RedCliffCmd 55001-55004. ETF requests; state and claim bits live in the
  // shared dungeon activity tables so a restart keeps progress.
  const redCliff = createRedCliffService({ store, codec, tables: readRedCliffTables(), gameTables: tables, logger, now: clock, random });
  const towerDefense = createTowerDefenseService({ store, codec, tables: readTowerDefenseTables(), gameTables: tables, logger, now: clock });
  const soulTrial = createSoulTrialService({ store, codec, tables: readSoulTrialTables(), gameTables: tables, logger, now: clock });
  const scarletTrial = createScarletTrialService({ store, codec, tables: readScarletTrialTables(), gameTables: tables, logger, now: clock });
  const campTower = createCampTowerService({ store, codec, tables: readCampTowerTables(), gameTables: tables, logger, now: clock });
  const destinyPve = createDestinyPveService({ store, codec, tables: readDestinyPveTables(), logger, now: clock });
  const magicCircle = createMagicCircleService({ store, codec, tables: readMagicCircleTables(), now: clock });
  const norseRune = createNorseRuneService({ store, codec, tables: readNorseRuneTables(), random });
  const subscribers=new Set();
  const publish=(type,data)=>{for(const send of subscribers){try{send(type,data);}catch{logger({event:'wallet_subscriber_disconnected'});}}};
  const timeTemple=createTimeTempleService({store,codec,publish});
  const voucher=localWallet?createVoucherService({store,tables,logger}):undefined;
  const mail=voucher?createMailService({store,codec,tables,voucher,publish,logger}):undefined;
  const standardPermit=createPermitService({codec,tables,now:secondsClock});
  const monthPermit=createMonthPermitService({codec,tables});
  const monthPermitRepair=store.transaction((model,db)=>monthPermit.repairLegacyTaskExperience({model,db}));
  if(monthPermitRepair.changed) logger({event:'month_permit_task_exp_repaired',repairs:monthPermitRepair.repairs.map(({changes,...repair})=>repair)});
  const monthlyCard=createMonthlyCardService({codec,tables,now:secondsClock});
  const monthlyCardRepair=store.transaction(model=>monthlyCard.repairLegacyClaimBits({model}));
  if(monthlyCardRepair.changed) logger({event:'monthly_card_claim_bits_repaired',cards:monthlyCardRepair.repaired});
  const wallet=localWallet?createWalletService({
    store,codec,tables,voucher,monthPermit,monthlyCard,permitService:standardPermit,publish,logger,petActivity,heroDrawActivity,wishTreasure,wishTree,weekHunt,
    rechargeBonus,lineFirstRecharge,rechargeExtraAward,now:() => Math.floor(clock() / 1000)
  }):undefined;
  const welfare=createWelfareService({store,codec,tables,wallet,calendar,now:clock,logger});
  const benefitCommerce=createBenefitCommerceService({store,codec,tables,now:clock,logger});
  const tasks=createTaskService({store,codec,tables,logger});
  const everyTasks=createEveryTaskService({store,codec,tables,now:clock,logger});
  const sprint=createSprintService({store,codec,tables,calendar,now:clock});
  const itemBox=createItemBoxService({store,codec,tables,heroTables,logger});
  const guide=createGuideService({store,codec,tables,awards:guideAwards,now:clock,logger});
    // Block J role/support services. GM surfaces stay disabled unless the
    // deployment opts in through the environment or role metadata.
    const gmEnabled = () => process.env.FC_ALLOW_GM_COMMANDS === '1' || store.read().state.gmEnabled === true;
    const roleService = createRoleService({ store, codec, tables, heroTables, attributeTables, now: clock, logger, gmEnabled });
    const storyService = createStoryService({ store, now: clock, logger });
    const cdkeyService = createCdkeyService({ store, codec, tables, now: clock, logger });
    const actFrameService = createActFrameService({ store, codec, calendar, tables, now: clock, logger, gmEnabled });
    const skinService = createSkinService({ store, codec, tables, now: clock, logger });
  const activityRead=createActivityReadService({codec,store,tables,calendar,logger,now:clock,random});
  const hundredDraw=createHundredDrawService({store,codec,tables,calendar,now:clock,random,logger});
  // BonusDrawCmd 101901/101902/101904. The reward pools come from the shipped
  // BonusDrawTable; the draw command mirrors the client's pool bookkeeping.
  // There is no recovered login slot for BonusDrawMgr, so this service answers
  // commands only and keeps its state in its own tables.
  const bonusDraw=createBonusDrawService({store,codec,tables,now:clock,random,logger});
  // F-block draw activities with recovered table evidence (DRAW-TURNTABLEACT,
  // DRAW-CAPSULETOY draw, DRAW-THREEADMONITION extra draws).
  const drawActivity=createDrawActivityService({store,codec,tables,now:clock,random,logger});
  // Fishing reads whose request body is an ETF integer argument (activity id).
  const fishingEtfTypes=new Set([110303,110308,110309]);
  const cms=createCmsService({codec,store,tables,now:clock});
  const guildNationAssist=createGuildNationAssistService({codec,store,now:clock});
  // Mission commands around the journey fight path (meal, stamina exchange and
  // purchase, one-key rewards, chapter pass, boss awards). Dispatch stays in the
  // mission block below and is guarded by supports().
  const missionExtra = createMissionExtraService({ store, codec, now: clock, logger });
  const accRecharge=createAccRechargeService({store,codec,tables,calendar,logger});
  const groupBuyAct=createGroupBuyActService({store,codec,tables,groupBuyTables:readGroupBuyActTables(),calendar,now:clock,logger});
  const dragonLandAct=createDragonLandActService({store,codec,tables,dragonLandTables:readDragonLandTables(),calendar,now:clock,logger});
  const diamondBankAct=createDiamondBankActService({store,codec,tables,diamondBankTables:readDiamondBankActTables(),calendar,now:clock,logger});
  const freePrivilegeAct=createFreePrivilegeActService({store,codec,tables,freePrivilegeTables:readFreePrivilegeActTables(),calendar,monthlyCard,now:clock,logger});
  const slotGameAct=createSlotGameActService({store,codec,tables,slotGameTables:readSlotGameActTables(),calendar,now:clock,random,logger});
  // Festival, sign-in, limited-target and co-op activity commands (#180-#211).
  const actReward=createActRewardService({store,codec,tables,actTables:readActActivityTables(),calendar,now:clock,logger});
  // G2 exploration / mini-game block: puzzle, tile swap, mushroom monster,
  // gopher, tower, spirit courtyard, triple match, matching game, monopoly,
  // dream trial, diamond vein, source point, homeland album, homeland and
  // baking. Rules without shipped evidence fail closed inside the service.
  const minigameAct=createMinigameActService({store,codec,tables,minigameTables:readMinigameActTables(),calendar,now:clock,random,logger});
  const hundredAcc=createHundredAccService({store,codec,tables,logger});
  // BATTLE-CORE block: ReportCmd 205/211/212, CommonMapCmd 90601-90603 and
  // StarMissionCmd 89601-89604. Every handler reuses the shared resource,
  // battle and SQLite paths; the type ranges do not overlap any existing
  // dispatch branch, so the ordering constraints of recruit/heroCommandServices
  // and hundredDraw/activityRead stay untouched.
  const battleRecords = createBattleRecordService({ store, codec, logger, now: clock });
  // CommonMap keeps no layout: the shipped table has system definitions only,
  // so 90601-90603 fail closed inside the service.
  const commonMap = createCommonMapService({ tables: readCommonMapTables(), logger });
  // StarMission resolves an activity id to its version through ActivityTable
  // (func 81 family) and then reads chapters, thresholds, awards and skill costs
  // from the shipped StarMissionTable.
  const starMission = createStarMissionService({
    store, codec, tables: readStarMissionTables(), activityTables: tables.Activity,
    gameTables: tables, now: clock, logger
  });
  async function loginPayload() {
    const repairedLineups = lineups.ensureLoginState();
    if (repairedLineups.length) logger({ event: 'shared_pre_lineups_repaired', types: repairedLineups });
    recruit.ensureLoginState();
    fantasyDraw.ensureLoginState();
    const fantasyEquipmentRepairs = fantasyEquipment.ensureLoginState();
    if (fantasyEquipmentRepairs?.changed) logger({
      event: 'fantasy_equipment_bless_references_repaired',
      removed: fantasyEquipmentRepairs.removed,
      self: fantasyEquipmentRepairs.self,
      missing: fantasyEquipmentRepairs.missing,
      duplicate: fantasyEquipmentRepairs.duplicate,
      invalid: fantasyEquipmentRepairs.invalid
    });
    const fishingBenefits = activityRead.ensureActiveFishingBenefits();
    handbook.ensureLoginState();
    heroFavor.ensureLoginState();
    heroExtra.ensureLoginState();
    artifact.ensureLoginState();
    for (const service of heroCommandServices) service.ensureLoginState?.();
    teamSuggest.ensureLoginState();
    teamGenre.ensureLoginState();
    wishTreasure.ensureLoginState();
    wishTree.ensureLoginState();
    weekHunt.ensureLoginState();
    destiny.ensureLoginState();
    magicCircle.ensureLoginState();
    guildRoster.ensureLoginState();
    norseRune.ensureLoginState();
    everyTasks.ensureLoginState();
    timeTemple.ensureLoginState();
    lineFirstRecharge.ensureLoginState();
    cabin.ensureLoginState();
    const houseAssistantRepair = houseAssistant.ensureLoginState();
    if (houseAssistantRepair.defaults.length || houseAssistantRepair.expired.length) {
      logger({
        event: 'house_assistant_login_repaired',
        defaults: houseAssistantRepair.defaults,
        expired: houseAssistantRepair.expired,
        restored: houseAssistantRepair.restored
      });
    }
    rechargeBonus.synchronize();
    onlineGift.beginSession();
    rankAchieve.ensureLoginState();
    const state = store.state();
    const storedModules = new Map(state.modules.value);
    const list = revive(state.modules);
    const modules = new Map(list.value);
    const loginMilliseconds = clock();
    const loginSeconds = Math.floor(loginMilliseconds / 1000);
    const loginTime = pack('pb_login_time', { last_login: loginSeconds, last_logout: loginSeconds - 1, day_count: roleLoginDayCount(state.createdAt, loginSeconds), create_time: state.createdAt, online_time: 0 });
    modules.set(1, [binary('local-sqlite-v1'), state.roleId, binary(loginTime), state.serverId, calendar.serverOpenedAt, binary('Local Server'), binary(''), 0]);
    modules.set(2, binary(Buffer.from(state.rolePb, 'base64')));
    const rankAchieveLogin = rankAchieve.loginPayload();
    modules.set(rankAchieve.moduleId, [
      binary(rankAchieveLogin.person),
      binary(rankAchieveLogin.server),
      binary(rankAchieveLogin.cross),
      binary(rankAchieveLogin.cross)
    ]);
    modules.set(firstWeekGoal.moduleId, binary(firstWeekGoal.loginPayload(clock())));
    growthRoad.ensureLoginState(clock());
    modules.set(growthRoad.moduleId, binary(growthRoad.loginPayload(clock())));
    modules.set(functionManual.moduleId, binary(functionManual.loginPayload()));
    // Cross-server membership is deliberately empty in this single local server.
    modules.set(63, binary(pack('pb_cross_login', { cross_infos: [], role_info: pack('pb_cross_role', {}) })));
    if (state.lineups) modules.set(9, binary(Buffer.from(state.lineups, 'base64')));
    modules.set(guildRoster.moduleId, binary(guildRoster.loginPayload()));
    modules.set(CAMPSITE_MODULE_ID, binary(cabin.loginPayload()));
    modules.set(HOUSE_ASSISTANT_MODULE_ID, [binary(houseAssistant.loginPayload())]);
    if (mail) modules.set(93, binary(mail.loginPayload(state.roleId)));
    let activity;
    try {
      activity = storedModules.get(92)
        ? unpack('pb_act_login', rawBinary(storedModules.get(92)))
        : { act_list: [], act_parallel_list: [], act_pause_list: [], act_custom_list: [] };
    } catch (error) {
      logger({ event: 'activity_login_parse_failed', message: error.message });
      activity = { act_list: [], act_parallel_list: [], act_pause_list: [], act_custom_list: [] };
    }
    const beforeActivityIds = new Set([
      ...(activity.act_list ?? []).map(entry => Number(entry.state_data?.act_id)),
      ...(activity.act_parallel_list ?? []).flatMap(group => (group.states_data ?? []).map(state => Number(state.act_id)))
    ]);
    const schedule = calendar.applyLoginSchedule(activity, loginSeconds);
    const petLogin = await petActivity.synchronizeLogin(activity, loginSeconds);
    const heroDrawLogin = heroDrawActivity.synchronizeLogin(activity, loginSeconds);
    const currentArtifactId = currentRelicActivityId('artifact', null, loginSeconds);
    const currentDemigodId = currentRelicActivityId('demigod', null, loginSeconds);
    const currentFantasyId = currentRelicActivityId('fantasy', null, loginSeconds);
    for (const actTid of [currentArtifactId, currentDemigodId, currentFantasyId]) {
      if (actTid) ensureRelicActivityLoginEntry(activity, actTid, loginSeconds);
    }
    const rebateLogin = rechargeRebateReset.synchronizeLogin(activity, loginSeconds);
    const accRechargeLogin = accRecharge.synchronizeLogin(activity, loginSeconds);
    // HelpUpActData parses pb_help_up_act_login_data from the activity entry's
    // module_login_data, so the help-up block rides inside module 92.
    const helpUpLoginIds = activityRead.synchronizeHelpUpLogin(activity, loginSeconds);
    if (helpUpLoginIds.length) logger({ event: 'help_up_act_login_synced', actIds: helpUpLoginIds });
    // TaskActivityActMgr parses pb_task_activity_role_info out of each running
    // ActFrame type 1003 activity entry, so the block rides inside module 92.
    const taskActivityLoginIds = taskActivity.synchronizeLogin(activity, loginSeconds);
    if (taskActivityLoginIds.length) {
      logger({ event: 'task_activity_login_synced', actIds: taskActivityLoginIds });
    }
    const groupBuyActLogin = groupBuyAct.synchronizeLogin(activity, loginSeconds);
    // DragonLandActData parses pb_dragon_land_role_data from the activity entry's
    // module_login_data (ActFrameTable type 1036/1037/1044/1045/1046).
    const dragonLandLogin = dragonLandAct.synchronizeLogin(activity, loginSeconds);
    // DiamondBankActData parses pb_diamond_bank_act_role_data from the activity
    // entry's module_login_data (ActFrameTable type 1069).
    const diamondBankLogin = diamondBankAct.synchronizeLogin(activity, loginSeconds);
    // FreePrivilegeActData parses pb_free_privilege_act_act_role_data from the
    // activity entry's module_login_data (ActFrameTable type 1072).
    const freePrivilegeLogin = freePrivilegeAct.synchronizeLogin(activity, loginSeconds);
    // SlotGameActData parses pb_slot_game_act_role_data from the activity
    // entry's module_login_data (ActFrameTable type 1095 / 1306).
    const slotGameLoginIds = slotGameAct.synchronizeLogin(activity, loginSeconds);
    if (slotGameLoginIds.length) logger({ event: 'slot_game_act_login_synced', actIds: slotGameLoginIds });
    // The mini-game block writes its activity role data into the same module 92
    // entries (tower, gopher, triple match, matching game, monopoly, dream
    // trial, diamond vein and baking).
    const minigameLoginIds = minigameAct.synchronizeLogin(activity, loginSeconds);
    if (minigameLoginIds.length) logger({ event: 'minigame_act_login_synced', actIds: minigameLoginIds });
    // HundredDrawActData decodes pb_hundred_draw_act_data from the activity
    // entry's module_login_data (ActFrameTable type 1102).
    const hundredDrawLoginIds = hundredDraw.synchronizeLogin(activity, loginSeconds);
    if (hundredDrawLoginIds.length) logger({ event: 'hundred_draw_login_synced', actIds: hundredDrawLoginIds });
    const afterActivityIds = new Set([
      ...(activity.act_list ?? []).map(entry => Number(entry.state_data?.act_id)),
      ...(activity.act_parallel_list ?? []).flatMap(group => (group.states_data ?? []).map(entry => Number(entry.act_id)))
    ]);
    modules.set(92, binary(pack('pb_act_login', activity)));
    if (petLogin) modules.set(petActivity.moduleId, binary(petLogin.module));
    else modules.delete(petActivity.moduleId);
    const artifactIds = [...new Set([
      ...activityStateRows(activity)
        .filter(row => artifactActivityRows.has(Number(row.state?.act_id)))
        .map(row => Number(row.state.act_id)),
      ...(currentArtifactId ? [currentArtifactId] : [])
    ])].filter(id => activityIsOpen('artifact', id, null, loginSeconds));
    const artifactLogin = artifactIds.length ? artifactDrawAct.loginPayloads({ actTids: artifactIds }) : null;
    const demigodLogin = currentDemigodId ? (() => {
      demigodAct.ensureLoginState();
      return demigodAct.serializeLoginBlocks();
    })() : null;
    const fantasyLogin = currentFantasyId ? (() => {
      fantasyEquipAct.ensureLoginState();
      return fantasyEquipAct.serializeLoginBlocks();
    })() : null;
    const loginActivities = [];
    if (artifactLogin) {
      for (const player of artifactLogin.playerList.value.act_data_list ?? []) {
        const actTid = Number(player.act_tid);
        const window = relicActivityWindow(actTid);
        loginActivities.push({
          actTid, startTime: window.start, endTime: window.end,
          blocks: [codec.pack('pb_artifact_draw_player_list', { act_data_list: [player] })]
        });
      }
    }
    for (const payload of [demigodLogin, fantasyLogin].filter(Boolean)) {
      const actTid = Number(payload.act_tid);
      const window = relicActivityWindow(actTid);
      loginActivities.push({ actTid, startTime: window.start, endTime: window.end, blocks: payload.blocks });
    }
    let actFrameNormalization = null;
    if (loginActivities.length || calendar.mode === 'all-open') {
      const merged = mergeRelicLoginContainer({
        codec,
        entry: storedModules.get(RELIC_ACTIVITY_LOGIN_MODULE_ID) ?? null,
        activities: loginActivities,
        normalize: calendar.mode === 'all-open'
          ? ({ player, server }) => calendar.normalizeActFrameLogin(player, server, loginSeconds)
          : null
      });
      actFrameNormalization = merged.normalization;
      modules.set(RELIC_ACTIVITY_LOGIN_MODULE_ID, revive({ value: merged.values, improper: false }));
    }
    logger({
      event: 'activity_login_calendar_applied',
      activityMode: calendar.mode,
      serverOpenedAt: calendar.serverOpenedAt,
      serverDay: serverDayNumber(calendar.serverOpenedAt, loginSeconds),
      activeFishingActivityIds: schedule.fishingActivityIds,
      fishingBenefitActivityId: fishingBenefits.actId,
      petActivityId: petLogin?.actId ?? null,
      petShopId: petLogin?.shopId ?? null,
      heroDrawActivityId: heroDrawLogin?.actId ?? null,
      artifactActivityIds: artifactIds,
      demigodActivityId: currentDemigodId,
      fantasyActivityId: currentFantasyId,
      relicLoginActivityIds: loginActivities.map(value => value.actTid),
      actFrameAdjustedActivityIds: actFrameNormalization?.activityIds ?? [],
      heroDrawCount: heroDrawLogin?.drawData?.role_data?.draw_count ?? null,
      heroDrawGenreId: heroDrawLogin?.drawData?.role_data?.draw_exchange_id ?? null,
      rechargeRebateResetId: rebateLogin?.actId ?? null,
      accRechargeActivityIds: accRechargeLogin.activityIds,
      groupBuyActActivityId: groupBuyActLogin.actId,
      groupBuyActGiftIds: groupBuyActLogin.giftIds,
      dragonLandActId: dragonLandLogin.actId,
      diamondBankActId: diamondBankLogin.actId,
      freePrivilegeActId: freePrivilegeLogin.actId,
      slotGameActIds: slotGameLoginIds,
      removedActivityIds: [...beforeActivityIds].filter(id => !afterActivityIds.has(id)),
      addedActivityIds: [...afterActivityIds].filter(id => !beforeActivityIds.has(id))
    });
    return encodeEtf([1, [loginMilliseconds, 28800, 1], new E.OtpErlangList([...modules], false), false]);
  }
  async function mailArgument(data) {
    const decoded = await decodeEtf(data);
    const value = decoded?.value ?? decoded;
    if (Array.isArray(value)) {
      if (value.length === 1 && (typeof value[0] === 'number' || typeof value[0] === 'string')) return value[0];
      return value.map(item => typeof item === 'object' && item !== null ? item.mailid ?? item.mail_id ?? item.id : item);
    }
    if (typeof value === 'number' || typeof value === 'string') return value;
    if (value && typeof value === 'object') return value.mailid ?? value.mail_id ?? value.id;
    throw new GameError(1, 'Invalid mail command payload');
  }
  function rechargeOptions(value) {
    if (Number.isSafeInteger(value) && value > 0) return { activity_version: value };
    let bytes = null;
    if (Buffer.isBuffer(value)) bytes = value;
    else if (value?.value?.type === 'Buffer' && Array.isArray(value.value.data)) bytes = Buffer.from(value.value.data);
    // ETF binary values decode to OtpErlangBinary, whose payload is a Buffer.
    // The client sends the optional purchase tuple in this field.
    else if (value?.value instanceof Uint8Array) bytes = Buffer.from(value.value);
    else if (Array.isArray(value?.value)) bytes = Buffer.from(value.value);
    if (!bytes?.length) return {};
    try {
      const parsed = JSON.parse(bytes.toString('utf8'));
      const tuple = Array.isArray(parsed) && Array.isArray(parsed[1]) ? parsed[1] : [];
      return {
        is_extra_buy: tuple[0] === true,
        period: Number.isSafeInteger(Number(tuple[1])) ? Number(tuple[1]) : null,
        day_index: Number.isSafeInteger(Number(tuple[2])) ? Number(tuple[2]) : null
      };
    } catch { return {}; }
  }
  async function singleIdArgument(data, message) {
    const decoded = await decodeEtf(data);
    const value = decoded?.value ?? decoded;
    const candidate = Array.isArray(value) ? value.length === 1 ? value[0] : undefined : value;
    const id = Number(candidate);
    if (!Number.isSafeInteger(id) || id <= 0) throw new GameError(1, message);
    return id;
  }
  function unpackRequest(schema, data) {
    try {
      return unpack(schema, data ?? Buffer.alloc(0));
    } catch {
      throw new GameError(1, 'Invalid protobuf request for ' + schema);
    }
  }
  async function etfInput(data) {
    if (!data?.length) return undefined;
    const decoded = await decodeEtf(data);
    return decoded?.value ?? decoded;
  }
  async function etfArgument(data, message, { optional = false } = {}) {
    if (!data?.length) {
      if (optional) return null;
      throw new GameError(1, message);
    }
    let decoded;
    try {
      decoded = await decodeEtf(data);
    } catch {
      throw new GameError(1, message);
    }
    const value = decoded?.value ?? decoded;
    if (optional && (value == null || (Array.isArray(value) && value.length === 0))) return null;
    return Array.isArray(value) && value.length === 1 ? value[0] : value;
  }
  const artifactDrawActSchemas = Object.freeze({
    101801: 'pb_req_artifact_trials_daily_reward_req',
    101802: 'pb_artifact_draw_task_award_req',
    101803: 'pb_artifact_fragments_draw_req',
    101804: 'pb_artifact_fragments_new_turn_req',
    101805: 'pb_artifact_fragments_claim_req',
    101806: 'pb_artifact_fragments_synthesis_req'
  });
  const demigodActSchemas = Object.freeze({
    98303: 'pb_demigod_act_receive_trial_req',
    98304: 'pb_demigod_act_wear_equip_req',
    98305: 'pb_demigod_act_wear_bless_req'
  });
  const fantasyEquipActSchemas = Object.freeze({
    88928: 'pb_fantasy_act_receive_trial_req',
    88929: 'pb_fantasy_act_wear_equip_req',
    88930: 'pb_fantasy_act_wear_bless_req',
    88932: 'pb_fantasy_act_task_reward_req'
  });
  const noParameterEtfCommands = new Set([98301, 98302, 98307, 88922, 88927]);
  const scalarEtfActivityCommands = new Set([98306, 98308, 88924, 88931]);
  const storyMissionArgument = data => singleIdArgument(data, 'Invalid story mission payload');
  const sockets = new Set();
  const wireDumpDirectory = process.env.FATE_COVENANT_WIRE_DUMP_DIR;
  const server = net.createServer(socket => {
    if (sockets.size >= 8) { socket.destroy(); return; }
    sockets.add(socket);
    const id = crypto.randomUUID();
    const decoder = new GameFrameDecoder({ maxPayloadBytes: 1048576 });
    let phase = 'verify', challenge, chain = Promise.resolve(), onlineGiftSessionAttempted = false;
    const push=(type,data)=>{if(!socket.destroyed)socket.write(encodeGameFrame(pack('pb_s2c',{type,data})));};
    const log = event => logger({ connection: id, ...event });
    // protobufjs decodes an empty `bytes` field into a plain array, so rejection
    // and fallback logs must not assume the request payload is a Buffer.
    const payloadBytes = (data, limit) => {
      const bytes = Buffer.isBuffer(data) ? data
        : data instanceof Uint8Array ? Buffer.from(data)
        : Array.isArray(data) ? Buffer.from(data)
        : data ? Buffer.from(String(data)) : Buffer.alloc(0);
      return bytes.subarray(0, limit).toString('base64');
    };
    // The elite stage/boss requests reuse FightCmd 201/207; the elite battle
    // module owns their progress, stamina and rewards. Enemy line-ups are not
    // part of the shipped client data, so the deployment injects them.
    const fight = createMissionFightService({
      store,
      codec,
      logger: log,
      playbackEnabled: missionFightPlayback,
      eliteBattle: createEliteMissionBattle({ store, codec, logger: log, now: clock, enemyProvider: eliteEnemies }),
      // BATTLE-REPORT: every committed journey win becomes the pass record that
      // ReportCmd 211 lists. pass_tid is the FightTable row the battle reported
      // (pb_fight_report.tid) and id is the cleared mission id.
      onSettlementCommitted: ({ missionId, fightTid, rounds }) => {
        const passTid = Number(fightTid);
        if (!Number.isSafeInteger(passTid) || passTid <= 0) {
          log({ event: 'pass_record_skipped', missionId, reason: 'fight_tid_missing' });
          return;
        }
        const model = store.read();
        const fightId = passTid * 1000000 + (Number(missionId) % 1000000);
        battleRecords.recordPass({
          passTid,
          businessId: Number(missionId),
          passType: 1,
          fightId,
          passScore: Number(rounds) || 0,
          show: { pass_time: Math.floor(clock() / 1000), level: Number(model.role?.level ?? 0) }
        });
        log({ event: 'pass_record_committed', missionId, passTid, fightId });
      }
    });
    socket.setNoDelay(true); socket.setTimeout(180000);
    socket.on('timeout', () => socket.destroy());
    socket.on('error', error => log({ event: 'socket_error', code: error.code }));
    socket.on('close', () => {
      subscribers.delete(push); sockets.delete(socket);
      if (onlineGiftSessionAttempted) {
        try { onlineGift.endSession(); } catch (error) { log({ event: 'online_gift_session_close_failed', message: error.message }); }
      }
      log({ event: 'game_closed' });
    });
    const send = (seq, data = Buffer.alloc(0), err) => {
      const payload = pack('pb_s2c', { seq, ...(data.length ? { data } : {}), ...(err ? { err } : {}) });
      const frame = encodeGameFrame(payload);
      const diagnostics = {
        event: 's2c_frame_sent',
        seq,
        errCode: err?.err,
        payloadBytes: payload.length,
        frameBytes: frame.length,
        header: frame.subarray(0, 4).toString('hex'),
        frameSha256: crypto.createHash('sha256').update(frame).digest('hex')
      };
      if (wireDumpDirectory && payload.length >= 1024) {
        fs.mkdirSync(wireDumpDirectory, { recursive: true });
        const filename = 's2c-' + String(seq) + '-' + Date.now() + '-' + diagnostics.frameSha256.slice(0, 12) + '.bin';
        fs.writeFileSync(path.join(wireDumpDirectory, filename), frame, { mode: 0o600 });
        diagnostics.dumpFile = filename;
      }
      log(diagnostics);
      return socket.write(frame);
    };
    async function handle(payload) {
      if (phase === 'verify') {
        if (!isInitialVerifyPayload(payload, Buffer.from('verify'))) throw new Error('Invalid verify');
        challenge = createServerHandshakeChallenge({ profile: LOCAL_AES_PROFILE, flags: { encryptC2S: false, encryptS2C: false, signature: false }, expectedApplicationVersion: '1.55.090365' });
        socket.write(encodeGameFrame(challenge.payload)); phase = 'reply'; log({ event: 'challenge_sent' }); return;
      }
      if (phase === 'reply') {
        if (!challenge.verifyReply(payload).ok) throw new Error('Invalid handshake');
        phase = 'login'; log({ event: 'handshake_accepted' }); return;
      }
      const request = root.lookupType('pb_c2s').decode(payload);
      const { type, seq } = request;
      log({ event: 'command', type, seq, bytes: request.data?.length ?? 0 });
      // Heartbeat is one-way. A zero-length S2C frame leaves the client's
      // TcpConnectionWorker receive stream at offset 4 and corrupts the next frame.
      if (type === -1) return;
      if (onlineGift.supports(type)) {
        try {
          const decoded = request.data?.length ? await decodeEtf(request.data) : undefined;
          const result = onlineGift.execute(type, decoded?.value ?? decoded);
          send(seq, result.data);
          log({ event: 'online_gift_claim_committed', type, seq, ...result.value.online_gift });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'online_gift_claim_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (firstWeekGoal.supports(type)) {
        try {
          const decoded = request.data?.length ? await decodeEtf(request.data) : undefined;
          const result = firstWeekGoal.execute(type, decoded?.value ?? decoded);
          send(seq, result.data);
          log({ event: 'first_week_goal_command_committed', type, seq, ...result.value });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'first_week_goal_command_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (growthRoad.supports(type)) {
        try {
          const decoded = request.data?.length ? await decodeEtf(request.data) : undefined;
          const result = growthRoad.execute(type, decoded?.value ?? decoded);
          send(seq, result.data);
          log({ event: 'growth_road_command_committed', type, seq, ...result.value });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'growth_road_command_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (functionManual.supports(type)) {
        try {
          const decoded = request.data?.length ? await decodeEtf(request.data) : undefined;
          const result = functionManual.execute(type, decoded?.value ?? decoded);
          send(seq, result.data);
          log({ event: 'function_manual_command_committed', type, seq, ...result.value });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'function_manual_command_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (taskActivity.supports(type)) {
        try {
          const raw = request.data ?? Buffer.alloc(0);
          const result = taskActivity.isProtobufRequest(type)
            ? taskActivity.execute(type, raw)
            : taskActivity.execute(type, raw.length ? (await decodeEtf(raw))?.value : undefined);
          send(seq, result.data);
          log({ event: 'task_activity_command_committed', type, seq, ...result.value });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'task_activity_command_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (friend.supports(type)) {
        try {
          const decoded = request.data?.length ? await decodeEtf(request.data) : undefined;
          const result = friend.execute(type, decoded?.value ?? decoded);
          send(seq, result.data);
          log({ event: 'friend_command_committed', type, seq, ...result.value });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'friend_command_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (message.supports(type)) {
        try {
          let result;
          if (message.isProtobufRequest(type)) {
            result = message.executeBinary(type, request.data ?? Buffer.alloc(0));
          } else {
            const decoded = request.data?.length ? await decodeEtf(request.data) : undefined;
            result = message.execute(type, decoded?.value ?? decoded);
          }
          send(seq, result.data);
          log({ event: 'message_command_committed', type, seq, ...result.value });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'message_command_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (chat.supports(type)) {
        try {
          const result = await chat.execute(type, request.data ?? Buffer.alloc(0));
          send(seq, result.data);
          for (const pushed of result.pushes ?? []) publish(pushed.type, pushed.data);
          log({ event: 'chat_command_committed', type, seq, ...result.value });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'chat_command_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (guildSociety.supports(type)) {
        try {
          const schema = guildSociety.requestSchema(type);
          const input = schema
            ? unpackRequest(schema, request.data)
            : await etfInput(request.data);
          const result = guildSociety.execute(type, input);
          send(seq, result.data);
          for (const pushed of result.pushes ?? []) publish(pushed.type, pushed.data);
          log({ event: 'guild_society_command_committed', type, seq, ...result.value });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'guild_society_command_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (community.supports(type)) {
        try {
          const schema = community.requestSchema(type);
          const input = schema
            ? unpackRequest(schema, request.data)
            : await etfInput(request.data);
          const result = community.execute(type, input);
          send(seq, result.data);
          for (const pushed of result.pushes ?? []) publish(pushed.type, pushed.data);
          log({ event: 'community_command_committed', type, seq, ...result.value });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'community_command_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (guildActivity.supports(type)) {
        try {
          const schema = guildActivity.requestSchema(type);
          const input = schema
            ? unpackRequest(schema, request.data)
            : await etfInput(request.data);
          const result = guildActivity.execute(type, input);
          send(seq, result.data);
          for (const pushed of result.pushes ?? []) publish(pushed.type, pushed.data);
          log({ event: 'guild_activity_command_committed', type, seq, ...result.value });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'guild_activity_command_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (type === 909101 || type === 909102) {
        // LoginCmd dev helpers create an explicit local session for the dev
        // client. They stay disabled unless the deployment opts in, and they
        // still require the local server id plus a matching channel uid/role.
        try {
          const dev = root.lookupType('login_dev').decode(request.data ?? Buffer.alloc(0));
          const state = store.state();
          const enabled = process.env.FC_ALLOW_DEV_LOGIN === '1' || state.devLoginEnabled === true;
          if (!enabled) {
            send(seq, Buffer.alloc(0), { err: -1, stacktrace: 'Local dev login is disabled' });
            log({ event: 'login_dev_disabled', type, seq });
            return;
          }
          const serverMatches = Number(dev.login?.server_id ?? 0) === state.serverId;
          const roleMatches = type === 909102
            ? String(dev.login?.role_id ?? dev.uid_base ?? '0') === String(state.roleId)
            : Boolean(dev.login?.channel_uid);
          if (!serverMatches || !roleMatches) {
            send(seq, Buffer.alloc(0), { err: -1, stacktrace: 'Local dev login identity mismatch' });
            log({ event: 'login_dev_mismatch', type, seq, serverMatches, roleMatches });
            return;
          }
          const payload = await loginPayload();
          send(seq, payload); phase = 'ready'; subscribers.add(push);
          log({ event: 'login_dev_accepted', type, seq, roleId: state.roleId });
        } catch (error) {
          send(seq, Buffer.alloc(0), { err: -1, stacktrace: 'Invalid dev login payload' });
          log({ event: 'login_dev_rejected', type, seq, message: error.message });
        }
        return;
      }
      if (type === 909103) {
        const state = store.state();
        const login = root.lookupType('login').decode(request.data);
        if (login.server_id !== state.serverId || !verifySession(login.channel_uid, login.verify_code)) {
          log({ event: 'login_rejected', serverMatches: login.server_id === state.serverId, credentialFields: { uidLength: login.channel_uid.length, codeLength: login.verify_code.length, extraLength: login.channel_extra.length } });
          send(seq, Buffer.alloc(0), { err: -1, stacktrace: 'Local SDK session required' }); return;
        }
        onlineGiftSessionAttempted = true;
        const payload = await loginPayload();
        send(seq, payload); phase = 'ready'; subscribers.add(push); log({ event: 'login_sent', moduleCount: state.modules.value.length, roleId: state.roleId }); return;
      }
      if (phase !== 'ready') throw new Error('Login required');
      if (roleService.supports(type) || storyService.supports(type) || cdkeyService.supports(type)
        || actFrameService.supports(type) || skinService.supports(type)) {
        const service = roleService.supports(type) ? roleService
          : storyService.supports(type) ? storyService
            : cdkeyService.supports(type) ? cdkeyService
              : actFrameService.supports(type) ? actFrameService : skinService;
        const protobufRequests = new Set([161, 39001, 98201, 76003, 76006]);
        try {
          let etf;
          if (!protobufRequests.has(Number(type)) && request.data?.length) {
            etf = await decodeEtf(request.data);
          }
          const parsed = Number(type) === 161 ? unpack('pb_function_cache_req', request.data ?? Buffer.alloc(0))
            : Number(type) === 39001 ? unpack('red_change_info', request.data ?? Buffer.alloc(0))
              : Number(type) === 98201 ? unpack('pb_channel_push_open', request.data ?? Buffer.alloc(0))
                : Number(type) === 76003 ? unpack('pb_skin_wear_req', request.data ?? Buffer.alloc(0))
                  : Number(type) === 76006 ? unpack('pb_toggle_ignore_fantasy_skin_req', request.data ?? Buffer.alloc(0))
                    : undefined;
          const result = await service.execute(type, { etf, request: parsed });
          if (result?.etfTerm !== undefined) send(seq, await encodeEtf(result.etfTerm));
          else if (result?.data) send(seq, result.data);
          log({ event: 'role_support_command_committed', type, seq });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'role_support_command_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      // req_role_attr_info (1316) returns pb_attr_lineup_all_info. The request is
      // an optional ETF lineup type; all attribute numbers and lineup_power come
      // from the shared attribute service used by missions and the rank screen.
      if (type === 1316) {
        try {
          let lineupType = 1;
          if (request.data?.length) {
            try {
              const argument = Number(await etfArgument(request.data, 'Invalid attribute request'));
              if (Number.isSafeInteger(argument) && argument > 0) lineupType = argument;
            } catch {}
          }
          const value = buildLineupAttrInfo({ model: store.read(), lineupType, heroTables, attributeTables });
          send(seq, pack('pb_attr_lineup_all_info', value));
          log({ event: 'role_attr_info_sent', type, seq, lineupType, lineupPower: value.lineup_attr.lineup_power, entities: value.lineup_attr.attr_list.length });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'role_attr_info_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (type === 17001) {
        try {
          const requestData = unpackRequest('req_get_monthly_card_reward', request.data);
          const result = store.transaction(model => monthlyCard.claim({ model, request: requestData }));
          send(seq, pack('res_get_monthly_card_reward', result.response));
          log({
            event: 'monthly_card_reward_committed', type, seq,
            cardIds: result.cardIds, claims: result.claims, changes: result.changes
          });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'monthly_card_reward_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (type === 35001 || type === 35002 || type === 35005) {
        try {
          const permitId = Number(await etfArgument(request.data, 'Invalid standard permit payload'));
          const result = store.transaction(model => type === 35001
            ? standardPermit.claimFree({ model, permitId })
            : type === 35002
              ? standardPermit.claimPaid({ model, permitId })
              : standardPermit.claimAll({ model, permitId }));
          send(seq, pack('pb_permit_receive_back', result.response));
          log({ event: 'permit_reward_committed', type, seq, permitId: result.permitId, level: result.level, levels: result.levels.map(row => Number(row.level)) });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'permit_reward_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (type === 105801 || type === 105803) {
        try {
          let actId;
          let gearLvTid;
          if (type === 105801) {
            const requestData = unpackRequest('pb_month_permit_receive_req', request.data);
            actId = requestData.tid;
            gearLvTid = requestData.gear_lv_tid;
          } else {
            actId = request.data?.length ? await etfArgument(request.data, 'Invalid month permit payload', { optional: true }) : null;
          }
          const result = store.transaction(model => type === 105801
            ? monthPermit.claimReward({ model, actId, gearLvTid })
            : monthPermit.claimAll({ model, actId }));
          send(seq, pack('pb_month_permit_receive_back', result.response));
          log({ event: 'month_permit_reward_committed', type, seq, actId: result.actId, level: result.currentLevel, gearLvTids: result.claimed });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'month_permit_reward_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (type === 105802) {
        try {
          const requestData = unpackRequest('pb_month_permit_buy_exp_req', request.data);
          const result = store.transaction(model => monthPermit.buyLevel({ model, request: requestData }));
          send(seq, pack('pb_month_permit_buy_level_back', result.response));
          log({ event: 'month_permit_buy_level_committed', type, seq, actId: result.actId, expGain: result.expGain, cost: result.cost, buyExpNum: result.buyExpNum });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'month_permit_buy_level_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (type === 105804) {
        try {
          const requestData = unpackRequest('pb_month_permit_task_req', request.data);
          const result = store.transaction(model => monthPermit.claimTask({ model, request: requestData }));
          send(seq, pack('pb_month_permit_task_back', result.response));
          log({ event: 'month_permit_task_reward_committed', type, seq, actId: result.actId, taskIds: result.claimedTasks });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'month_permit_task_reward_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (mail && mail.supports(type)) {
        try {
          let result;
          if (type === 3000 || type === 3001 || type === 3002) {
            let ids = [];
            if (request.data?.length) {
              const value = await mailArgument(request.data);
              ids = Array.isArray(value) ? value : value === undefined ? [] : [value];
            }
            result = type === 3000 ? mail.deleteOneKey(ids) : type === 3001 ? mail.readOneKey(ids) : mail.claimOneKey(ids);
          } else {
            const mailId = await mailArgument(request.data);
            result = type === 3003 ? mail.read(mailId) : type === 3004 ? mail.claim(mailId) : type === 3005 ? mail.delete(mailId) : mail.detail(mailId);
          }
          if (Buffer.isBuffer(result)) send(seq, result);
          else send(seq, result?.data ?? Buffer.alloc(0));
          log({ event: 'mail_command_committed', type, seq });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'mail_command_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (itemBox.supports(type)) {
        try {
          const context = { connection: id, seq, type };
          let result;
          if (type === 152) {
            result = itemBox.openSelected(unpack('selected_use', request.data), context);
          } else if (type === 155) {
            // use_selected_suit_box encodes (tid, awardIndex) as two ETF positionals.
            result = itemBox.openSuitBox(await etfArgument(request.data, 'Invalid suit box payload'), context);
          } else if (type === 153) {
            // use_repeat_box carries one ETF positional (tcp:c2s:153:use_repeat_box).
            result = itemBox.openRepeat(await etfArgument(request.data, 'Invalid repeat box payload'));
          } else if (type === 154) {
            // manual_convert_item carries one ETF positional (tcp:c2s:154:manual_convert_item).
            result = itemBox.manualConvert(await etfArgument(request.data, 'Invalid convert item payload'), context);
          } else if (type === 156) {
            result = itemBox.composeChip(unpack('simple_use', request.data), context);
          } else if (type === 158) {
            result = itemBox.composeChips(unpack('pb_one_key_compose', request.data).one_key_compose ?? [], context);
          } else if (type === 157) {
            const batch = unpack('pb_batch_use_box_req', request.data);
            const lottery = batch.lottery_list ?? [];
            result = lottery.length ? itemBox.openLottery(lottery) : itemBox.open(batch.box_list ?? [], context);
          } else if (type === 159) {
            result = itemBox.open(unpack('pb_one_key_use', request.data).use ?? [], context);
          } else {
            result = itemBox.open([unpack('simple_use', request.data)], context);
          }
          send(seq, result.data); log({ event: 'item_box_committed', type, seq, changes: result.value.changes.length, duplicate: result.duplicate === true });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'item_box_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (type === 508) {
        try {
          const sectionTid = await storyMissionArgument(request.data);
          const result = fight.passStory(sectionTid);
          send(seq, result.data);
          log({ event: 'story_mission_passed', type, seq, sectionTid, previousMissionId: result.value.previousMissionId, missionId: result.value.mission.mission_id });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'story_mission_rejected', type, seq, code, message: error.message, payloadHead: payloadBytes(request.data, 64) });
        }
        return;
      }
      if (missionExtra.supports(type)) {
        try {
          const result = await missionExtra.execute(type, request.data);
          send(seq, result.data ?? Buffer.alloc(0));
          log({ event: 'mission_extra_committed', type, seq, bytes: result.data?.length ?? 0 });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'mission_extra_rejected', type, seq, code, message: error.message, payloadHead: payloadBytes(request.data, 64) });
        }
        return;
      }
      if (fight.supports(type)) {
        try {
          const result = await fight.execute(type, request.data);
          if (result.data.length) send(seq, result.data); else send(seq);
          log({ event: 'fight_handled', type, seq, missionId: result.value?.mission?.mission_id });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'fight_rejected', type, seq, code, message: error.message, payloadHead: payloadBytes(request.data, 64) });
        }
        return;
      }
      if (battleRecords.supports(type) || commonMap.supports(type) || starMission.supports(type)) {
        try {
          let input;
          if (type === 205) {
            input = request.data?.length ? unpack('pb_share_report', request.data) : {};
          } else if (type === 211) {
            input = unpack('pb_pass_record_req', request.data);
          } else if (type === 212) {
            input = unpack('pb_pass_record_vote_req', request.data);
          } else if (type === 90601) {
            // req_common_map_init carries no payload or one ETF map id.
            let mapTid;
            if (request.data?.length) {
              const decoded = await decodeEtf(request.data);
              const value = decoded?.value ?? decoded;
              mapTid = Number(Array.isArray(value) ? value[0] : value);
              if (!Number.isSafeInteger(mapTid) || mapTid <= 0) throw new GameError(1, 'Invalid common map id');
            }
            input = { map_tid: mapTid };
          } else if (type === 90602) {
            input = unpack('pb_common_map_node_trigger', request.data);
          } else if (type === 90603) {
            input = unpack('pb_common_map_sweep_trigger', request.data);
          } else if (type === 89602) {
            input = unpack('pb_star_mission_chapter_award_req', request.data);
          } else if (type === 89603) {
            input = unpack('pb_star_mission_skill_req', request.data);
          } else if (type === 89604) {
            input = unpack('pb_star_mission_skill_reset_req', request.data);
          }
          const service = battleRecords.supports(type) ? battleRecords : commonMap.supports(type) ? commonMap : starMission;
          const result = await service.execute(type, input);
          if (result?.data?.length) send(seq, result.data); else send(seq);
          log({ event: 'battle_core_committed', type, seq, detail: result?.value ?? null });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'battle_core_rejected', type, seq, code, message: error.message, payloadHead: payloadBytes(request.data, 64) });
        }
        return;
      }
      if (tasks.supports(type)) {
        let taskInput;
        try {
          // CommonTaskCmd.req_finish_common_task encodes the task id or an id list as ETF,
          // while linear tasks always carry one id.
          taskInput = type === 9005
            ? await etfArgument(request.data, 'Invalid common task payload')
            : await singleIdArgument(request.data, 'Invalid linear task payload');
          const result = tasks.execute(type, taskInput);
          send(seq, result.data);
          log({ event: type === 9005 ? 'common_task_committed' : 'linear_task_committed', type, seq, taskInput, changes: result.value.res_change.changes.length });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: type === 9005 ? 'common_task_rejected' : 'linear_task_rejected', type, seq, taskInput, code, message: error.message });
        }
        return;
      }
      if (everyTasks.supports(type)) {
        let input;
        try {
          input = await etfArgument(request.data, 'Invalid every-task payload', { optional: [9006, 9007, 9009].includes(type) });
          const result = everyTasks.execute(type, input);
          send(seq, result.data);
          everyTasks.logClaim(result);
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'every_task_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (hundredDraw.supports(type)) {
        try {
          const input = hundredDraw.decode(type, request.data ?? Buffer.alloc(0));
          const result = hundredDraw.execute(type, input);
          send(seq, result.data);
          log({ event: 'hundred_draw_command_committed', type, seq, ...result.valueForLog });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'hundred_draw_command_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (bonusDraw.supports(type)) {
        try {
          if (type === bonusDraw.commands.switch) {
            // Cmd.c2s_back carries no protobuf schema for 101902, so the client
            // decodes this reply body as an Erlang term. Send the authoritative
            // current pool as a map field named cur_pool.
            const drawTid = Number(await etfArgument(request.data, 'Invalid bonus draw switch payload'));
            const result = bonusDraw.execute(type, drawTid);
            const reply = new E.OtpErlangMap(new Map([[new E.OtpErlangBinary(Buffer.from('cur_pool')), result.value.cur_pool]]));
            send(seq, await encodeEtf(reply));
            log({ event: 'bonus_draw_switch_committed', type, seq, ...result.valueForLog });
          } else {
            const input = bonusDraw.decode(type, request.data ?? Buffer.alloc(0));
            const result = bonusDraw.execute(type, input);
            send(seq, result.data);
            log({ event: 'bonus_draw_command_committed', type, seq, ...result.valueForLog });
          }
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'bonus_draw_command_rejected', type, seq, code, message: error.message, payloadHead: payloadBytes(request.data, 64) });
        }
        return;
      }
      if (drawActivity.supports(type)) {
        try {
          const argument = await etfArgument(request.data, 'Invalid draw activity payload', { optional: true });
          const value = argument && typeof argument === 'object' ? argument.value ?? argument : argument;
          const times = value != null && Number.isFinite(Number(value)) ? Number(value) : undefined;
          const result = drawActivity.execute(type, { times });
          send(seq, result.data);
          log({ event: 'draw_activity_command_committed', type, seq, ...result.valueForLog });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'draw_activity_command_rejected', type, seq, code, message: error.message, payloadHead: payloadBytes(request.data, 64) });
        }
        return;
      }
      if (activityRead.supports(type)) {
        try {
          const etfValue = fishingEtfTypes.has(type)
            ? await etfArgument(request.data, 'Invalid fishing activity payload', { optional: true })
            : undefined;
          const result = activityRead.execute(type, request.data, { etfValue });
          send(seq, result.data);
          const event = ({
            110301: 'fishing_cast_committed', 110302: 'fishing_collect_committed',
            110303: 'fishing_top_sent', 110304: 'fishing_codex_award_committed',
            110305: 'fishing_map_unlock_committed', 110306: 'fishing_rod_changed',
            110307: 'fishing_level_award_committed', 110308: 'fishing_record_sent',
            110309: 'fishing_rank_award_committed', 110310: 'fishing_progress_award_committed',
            110311: 'fishing_batch_collect_committed'
          })[type] ?? 'activity_read_committed';
          log({ event, type, seq, ...result.valueForLog });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'activity_read_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (cms.supports(type)) {
        try {
          const cmsTid = await singleIdArgument(request.data, 'Invalid CMS type');
          const result = cms.execute(cmsTid);
          send(seq, result.data);
          log({ event: 'cms_questions_sent', type, seq, cmsTid, questionCount: result.value.question_list.length });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'cms_questions_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (guildNationAssist.supports(type)) {
        try {
          let unexpected = null;
          if (request.data?.length) {
            let decoded;
            try {
              decoded = await decodeEtf(request.data);
            } catch {
              throw new GameError(1, 'Invalid guild nation assist-list payload');
            }
            const value = decoded?.value ?? decoded;
            const isNilAtom = decoded?.constructor?.name === 'OtpErlangAtom' && decoded.value === 'nil';
            const isEmptyList = Array.isArray(value) && value.length === 0;
            if (!isNilAtom && !isEmptyList) unexpected = value;
          }
          if (unexpected !== null) throw new GameError(1, 'Guild nation assist list takes no parameters');
          const result = guildNationAssist.execute(null);
          send(seq, result.data);
          log({ event: 'guild_nation_assist_list_sent', type, seq, guildId: result.guildId, assistCount: result.value.list.length });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'guild_nation_assist_list_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (accRecharge.supports(type)) {
        try {
          const result=accRecharge.execute(request.data);
          send(seq,result.data);
          log({event:'acc_recharge_committed',type,seq});
        }catch(error){
          const code=error instanceof GameError?error.code:2;
          send(seq,Buffer.alloc(0),{err:code});
          log({event:'acc_recharge_rejected',type,seq,code,message:error.message,payloadHead:payloadBytes(request.data,64)});
        }
        return;
      }
      if (groupBuyAct.supports(type)) {
        try {
          const result = groupBuyAct.execute(type, request.data);
          send(seq, result.data);
          log({
            event: type === 100601 ? 'group_buy_server_data_sent' : 'group_buy_award_committed',
            type, seq, actId: result.value?.act_id ?? result.value?.actId
          });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({
            event: 'group_buy_rejected', type, seq, code, message: error.message,
            payloadHead: payloadBytes(request.data, 64)
          });
        }
        return;
      }
      if (dragonLandAct.supports(type)) {
        try {
          const result = dragonLandAct.execute(type, request.data);
          send(seq, result.data);
          log({ event: 'dragon_land_command_committed', type, seq, actId: result.actId });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({
            event: 'dragon_land_rejected', type, seq, code, message: error.message,
            payloadHead: payloadBytes(request.data, 64)
          });
        }
        return;
      }
      if (actReward.supports(type)) {
        try {
          // Sign-in and festival boards carry their argument list as an Erlang
          // term; the protobuf commands keep their request body untouched.
          const etfValue = ACT_REWARD_ETF_TYPES.has(type)
            ? await etfArgument(request.data, 'Invalid activity payload', { optional: true })
            : undefined;
          const result = actReward.execute(type, request.data, { etf: etfValue });
          send(seq, result.data ?? Buffer.alloc(0));
          log({ event: 'act_reward_committed', type, seq });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({
            event: 'act_reward_rejected', type, seq, code, message: error.message,
            payloadHead: payloadBytes(request.data, 64)
          });
        }
        return;
      }
      if (diamondBankAct.supports(type)) {
        let actId;
        try {
          if (type === 110201) {
            const result = diamondBankAct.execute(type, request.data);
            send(seq, result.data);
            actId = result.actId;
          } else {
            actId = await singleIdArgument(request.data, 'Invalid diamond bank activity id');
            const result = diamondBankAct.execute(type, null, actId);
            send(seq, result.data);
          }
          log({ event: 'diamond_bank_command_committed', type, seq, actId });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({
            event: 'diamond_bank_rejected', type, seq, actId, code, message: error.message,
            payloadHead: payloadBytes(request.data, 64)
          });
        }
        return;
      }
      if (freePrivilegeAct.supports(type)) {
        let actId;
        try {
          actId = await singleIdArgument(request.data, 'Invalid free privilege activity id');
          const result = freePrivilegeAct.execute(type, null, actId);
          send(seq, result.data);
          log({ event: 'free_privilege_command_committed', type, seq, actId });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({
            event: 'free_privilege_rejected', type, seq, actId, code, message: error.message,
            payloadHead: payloadBytes(request.data, 64)
          });
        }
        return;
      }
      if (slotGameAct.supports(type)) {
        try {
          const input = slotGameAct.decode(type, request.data ?? Buffer.alloc(0));
          const result = slotGameAct.execute(type, input);
          send(seq, result.data);
          log({
            event: type === 110801 ? 'slot_game_go_committed' : 'slot_game_draw_committed',
            type, seq, actId: result.actId, awardLibTid: result.awardLibTid,
            drawIndex: result.drawIndex, multiplier: result.multiplier
          });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({
            event: 'slot_game_rejected', type, seq, code, message: error.message,
            payloadHead: payloadBytes(request.data, 64)
          });
        }
        return;
      }
      if (minigameAct.supports(type)) {
        try {
          const input = await minigameAct.decode(type, request.data ?? Buffer.alloc(0));
          const result = minigameAct.execute(type, input);
          send(seq, result.data);
          log({ event: 'minigame_command_committed', type, seq, card: minigameAct.commandCard(type), actKey: result.actKey });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'minigame_rejected', type, seq, code, message: error.message, payloadHead: payloadBytes(request.data, 64) });
        }
        return;
      }
      if (hundredAcc.supports(type)) {
        try {
          const decoded = await decodeEtf(request.data);
          const groups = decoded?.value ?? decoded;
          const result = hundredAcc.execute(groups);
          send(seq, result.data);
          log({ event: 'hundred_acc_committed', type, seq, groups: result.value.groups });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'hundred_acc_rejected', type, seq, code, message: error.message, payloadHead: payloadBytes(request.data, 64) });
        }
        return;
      }
      if (firstRecharge.supports(type)) {
        try {
          const result = firstRecharge.execute();
          send(seq, result.data);
          log({ event: 'first_recharge_claimed', type, seq, changes: result.value.res.changes.length });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'first_recharge_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (rechargeBonus.supports(type)) {
        try {
          const decoded = await decodeEtf(request.data);
          const result = rechargeBonus.execute(type, decoded?.value ?? decoded);
          send(seq, result.data);
          log({ event: 'recharge_bonus_committed', type, seq });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'recharge_bonus_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (lineFirstRecharge.supports(type)) {
        try {
          let value;
          if (type === 102101) value = await singleIdArgument(request.data, 'Invalid linear first-recharge choice');
          else {
            const decoded = await decodeEtf(request.data);
            value = decoded?.value ?? decoded;
          }
          const result = lineFirstRecharge.execute(type, value);
          send(seq, result.data);
          log({ event: type === 102101 ? 'line_first_recharge_choice_committed' : 'line_first_recharge_award_committed', type, seq });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'line_first_recharge_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (rechargeRebateReset.supports(type)) {
        try {
          const decoded = await decodeEtf(request.data);
          const result = rechargeRebateReset.execute(type, decoded?.value ?? decoded);
          send(seq, result.data);
          log({ event: 'recharge_rebate_reset_committed', type, seq, actId: result.value.act_info.act_id, changes: result.value.res.changes.length });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'recharge_rebate_reset_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (heroDrawActivity.supports(type)) {
        let activityId;
        try {
          activityId = await singleIdArgument(request.data, type === 100301 ? 'Invalid hero draw activity task' : 'Invalid hero draw genre');
          const result = type === 100301
            ? heroDrawActivity.claimTask(activityId)
            : heroDrawActivity.selectGenre(activityId);
          if (result.data.length) send(seq, result.data); else send(seq);
          log({ event: type === 100301 ? 'hero_draw_task_claimed' : 'hero_draw_genre_selected', type, seq, activityId, ...result.valueForLog });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'hero_draw_activity_rejected', type, seq, activityId, code, message: error.message });
        }
        return;
      }
      if (welfare.supports(type)) {
        try {
          const result = await welfare.execute(type, request.data, { connection: id, seq });
          const data = type === 16005
            ? groupBuyAct.augmentPurchaseResponse(result.data, result.value?.recharge_id)
            : result.data;
          send(seq, data);
          log({ event: 'welfare_committed', type, seq, groupBuyActSync: type === 16005 && data !== result.data });
        } catch (error) {
          // RechargeMgr has a dedicated localized message for 16016. The
          // wallet's 307 is an internal QuickSDK code with no ErrorTable text.
          const code = error instanceof GameError ? (error.code === 307 ? 16016 : error.code) : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'welfare_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (benefitCommerce.supports(type)) {
        // 块 I（PAY-*）的礼包/通行证/基金/拍卖命令入口。可结算的命令在这里真实
        // 扣发并写回登录模块；配置表缺失的命令返回 5 与具体原因，避免用固定空包
        // 冒充已实现。
        try {
          const input = await etfArgument(request.data, 'Invalid benefit payload', { optional: true });
          const result = benefitCommerce.execute(type, input);
          send(seq, result.data);
          log({ event: 'benefit_command_committed', type, seq });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'benefit_command_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (wishTreasure.supports(type)) {
        let awardId;
        try {
          awardId = await singleIdArgument(request.data, 'Invalid wish-treasure award');
          const result = wishTreasure.claim(awardId);
          send(seq, result.data);
          log({ event: 'wish_treasure_committed', type, seq, awardId, rewardTid: result.value.res.changes[0]?.tid });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'wish_treasure_rejected', type, seq, awardId, code, message: error.message });
        }
        return;
      }
      if (wishTree.supports(type)) {
        let input;
        try {
          if (type === 91704) input = unpack('pb_wish_tree_select_req', request.data);
          else input = await singleIdArgument(request.data, 'Invalid wish-tree argument');
          const result = wishTree.execute(type, input);
          if (result.data?.length) send(seq, result.data); else send(seq);
          log({
            event: 'wish_tree_committed', type, seq,
            wishType: result.value?.type,
            awardTid: result.value?.award_tid,
            changes: result.value?.res?.changes?.length ?? 0
          });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'wish_tree_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if(sprint.supports(type)||wallet&&type===16003){
        try{
          if(type===16003){const decoded=await decodeEtf(request.data);const value=decoded?.value??decoded;const bytes=Buffer.isBuffer(value)?value:Array.isArray(value)?Buffer.from(value):null;wallet.acknowledge(bytes?bytes.toString():value);send(seq);}
          else{const claim=unpack('pb_sprint_rank_task_receive_req',request.data);log({event:'sprint_claim_requested',actId:claim.act_id,taskIds:claim.task_tid_list});const result=await sprint.execute(claim);send(seq,result.data);}
          log({event:type===16003?'recharge_acknowledged':'sprint_reward_committed',type,seq});
        }catch(error){const code=error instanceof GameError?error.code:2;send(seq,Buffer.alloc(0),{err:code});log({event:'gameplay_rejected',type,seq,code,message:error.message});}
        return;
      }
      if (wallet && type === 16004) {
        let productId;
        try {
          const decoded = await decodeEtf(request.data);
          const value = decoded?.value ?? decoded;
          const args = Array.isArray(value) ? value : [value];
          if (args.length < 3) throw new GameError(1, 'Invalid voucher recharge payload');
          productId = Number(args[0]);
          const options = rechargeOptions(args[1]);
          const itemTid = Number(args[2]);
          if (!Number.isSafeInteger(itemTid) || itemTid < 0) throw new GameError(1, 'Invalid recharge payment item');
          wallet.assertPurchaseAvailable({ product_id: productId, extra_buy: options.is_extra_buy, activity_version: options.activity_version, period: options.period, day_index: options.day_index });
          let order;
          if (itemTid === 0) {
            // RechargeMgr sends zero for normal balance payment.
            order = wallet.buy({ account_id: wallet.accountId, product_id: productId, request_id: 'native:' + id + ':' + seq, extra_buy: options.is_extra_buy, activity_version: options.activity_version, period: options.period, day_index: options.day_index });
          } else {
            const product = wallet.snapshot().products.find(value => value.id === productId);
            if (!product) throw new GameError(5, 'Unsupported voucher recharge product');
            const sku = voucher.sku();
            if (itemTid !== sku.item_tid) throw new GameError(5, 'Unsupported voucher item');
            // Native 16004 carries no voucher count. Use every available voucher
            // up to the order maximum and charge the remainder to balance.
            const available = voucher.balance().quantity;
            const maximum = voucher.autoCount(product.price_cents);
            const voucherCount = Math.min(available, maximum);
            if (voucherCount <= 0) throw new GameError(302, 'Voucher balance is insufficient');
            order = wallet.buy({ account_id: wallet.accountId, product_id: productId, request_id: 'native:' + id + ':' + seq, voucher_count: voucherCount, extra_buy: options.is_extra_buy, activity_version: options.activity_version, period: options.period, day_index: options.day_index });
          }
          send(seq, Buffer.from(order.notification, 'base64'));
          log({ event: 'voucher_recharge_committed', type, seq, productId, itemTid, orderId: order.order_id, voucherQuantity: order.voucher_quantity, voucherAmountCents: order.voucher_amount_cents, balancePaidCents: order.balance_paid_cents, extraBuy: options.is_extra_buy, period: options.period, dayIndex: options.day_index, additionalPurchase: order.daily_discount_additional });
        } catch (error) {
          // The native recharge UI maps 16016 to RechargeErr.RECHARGE_COUNT_NOT_ENOUGH.
          // Keep the wallet's internal 307 for QuickSDK, whose protocol uses 80001.
          const code = error instanceof GameError ? (error.code === 307 ? 16016 : error.code) : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'voucher_recharge_rejected', type, seq, code, message: error.message, payloadHead: payloadBytes(request.data, 160) });
        }
        return;
      }
      if (teamSuggest.supports(type)) {
        try {
          const decoded = await decodeEtf(request.data);
          const result = teamSuggest.claim(decoded?.value ?? decoded);
          send(seq, result.data);
          log({ event: 'team_suggest_award_committed', type, seq, ...result.value });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'team_suggest_award_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (teamGenre.supports(type)) {
        try {
          const decoded = request.data?.length ? await decodeEtf(request.data) : undefined;
          const result = teamGenre.execute(type, decoded?.value ?? decoded);
          send(seq, result.data);
          log({ event: 'team_genre_command_committed', type, seq, ...result.value });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'team_genre_command_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (features.supports(type)) {
        try {
          const result = features.execute(type, await decodeEtf(request.data));
          send(seq, result.data); log({ event: 'feature_committed', type, seq });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code }); log({ event: 'feature_rejected', type, seq, code });
        }
        return;
      }
      if (peakTower.supports(type)) {
        try {
          const input = type === 1103 ? unpack('peak_tower_sweeps_req', request.data) : (request.data?.length ? (await decodeEtf(request.data))?.value : undefined);
          const result = await peakTower.execute(type, input);
          send(seq, result.data);
          log({ event: 'peak_tower_committed', type, seq, ...result.value });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'peak_tower_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (generalDungeon.supports(type)) {
        try {
          let input;
          if (type === 78102 || type === 78104 || type === 78107) {
            const decoded = request.data?.length ? await decodeEtf(request.data) : undefined;
            input = decoded?.value ?? decoded;
          } else {
            const schemas = {
              78101: 'pb_dungeon_event_exe',
              78103: 'pb_enter_dungeon_level',
              78105: 'pb_dungeon_event_active',
              78106: 'pb_dungeon_sync_map'
            };
            input = unpack(schemas[type], request.data);
          }
          const result = await generalDungeon.execute(type, input);
          if (!result.noReply) send(seq, result.data);
          log({ event: 'general_dungeon_command_committed', type, seq, ...result.value });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'general_dungeon_command_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (fameHall.supports(type)) {
        try {
          const protobuf = { 91101: 'pb_fame_hall_enter_difficult', 91102: 'pb_fame_hall_choose_drop_req', 91103: 'pb_fame_hall_reward_req', 91104: 'pb_fame_hall_artifact_req' }[type];
          const input = protobuf ? unpack(protobuf, request.data) : (request.data?.length ? (await decodeEtf(request.data))?.value : undefined);
          const result = await fameHall.execute(type, input);
          if (!result.noReply) send(seq, result.data);
          log({ event: 'fame_hall_command_committed', type, seq, ...result.value });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'fame_hall_command_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (worldBoss.supports(type)) {
        try {
          const input = type === 91805 ? unpack('pb_world_boss_achieve_reward_req', request.data) : (request.data?.length ? (await decodeEtf(request.data))?.value : undefined);
          const result = await worldBoss.execute(type, input);
          if (!result.noReply) send(seq, result.data);
          log({ event: 'world_boss_command_committed', type, seq, ...result.value });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'world_boss_command_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (pitLord.supports(type)) {
        try {
          const result = await pitLord.execute(type, request.data?.length ? (await decodeEtf(request.data))?.value : undefined);
          if (!result.noReply) send(seq, result.data);
          log({ event: 'pit_lord_command_committed', type, seq, ...result.value });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'pit_lord_command_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (redCliff.supports(type)) {
        try {
          const decoded = request.data?.length ? await decodeEtf(request.data) : undefined;
          const input = decoded?.value ?? decoded;
          const result = await redCliff.execute(type, input);
          send(seq, result.data);
          log({ event: 'red_cliff_command_committed', type, seq, ...result.value });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'red_cliff_command_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (towerDefense.supports(type)) {
        try {
          let input;
          if (type === 97601) input = unpack('pb_tower_defense_garrison_req', request.data);
          else if (request.data?.length) { const decoded = await decodeEtf(request.data); input = decoded?.value ?? decoded; }
          const result = await towerDefense.execute(type, input);
          send(seq, result.data);
          log({ event: 'tower_defense_command_committed', type, seq, ...result.value });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'tower_defense_command_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (soulTrial.supports(type)) {
        try {
          const decoded = request.data?.length ? await decodeEtf(request.data) : undefined;
          const result = await soulTrial.execute(type, decoded?.value ?? decoded);
          send(seq, result.data);
          log({ event: 'soul_trial_command_committed', type, seq, ...result.value });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'soul_trial_command_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (scarletTrial.supports(type)) {
        try {
          const decoded = request.data?.length ? await decodeEtf(request.data) : undefined;
          const result = await scarletTrial.execute(type, decoded?.value ?? decoded);
          if (!result.noReply) send(seq, result.data);
          log({ event: 'scarlet_trial_command_committed', type, seq, ...result.value });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'scarlet_trial_command_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (campTower.supports(type)) {
        try {
          let input;
          if (type === 93601) input = unpack('pb_camp_tower_cross_award_req', request.data);
          else if (type === 93602) input = unpack('pb_camp_tower_first_award_req', request.data);
          else if (request.data?.length) { const decoded = await decodeEtf(request.data); input = decoded?.value ?? decoded; }
          const result = await campTower.execute(type, input);
          send(seq, result.data);
          log({ event: 'camp_tower_command_committed', type, seq, ...result.value });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'camp_tower_command_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (destinyPve.supports(type)) {
        try {
          const input = type === 104702 ? unpack('pb_destiny_pve_layer_info_req', request.data) : unpack('pb_destiny_pve_fight_req', request.data);
          const result = await destinyPve.execute(type, input);
          send(seq, result.data);
          log({ event: 'destiny_pve_command_committed', type, seq, ...result.value });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'destiny_pve_command_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (rankAchieve.supports(type)) {
        try {
          const input = unpack('pb_rank_achieve_award_req', request.data);
          const result = rankAchieve.execute(input);
          send(seq, result.data);
          for (const pushed of result.pushes) publish(pushed.type, pushed.data);
          log({ event: 'rank_achieve_committed', type, seq, ...result.value });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'rank_achieve_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (ranks.supports(type)) {
        try {
          // RankCmd.batch_get_player_hero_rank (2004) is the only rank command
          // encoded with protobuf pb_batch_seq_rank; the other requests are ETF.
          const input = type === 2004 ? unpack('pb_batch_seq_rank', request.data) : await decodeEtf(request.data);
          const result = ranks.execute(type, input);
          send(seq, result.data); log({ event: 'rank_sent', type, seq, boardCount: result.value.client_list?.length ?? 1 });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code }); log({ event: 'rank_rejected', type, seq, code });
        }
        return;
      }
      if (guildRoster.supports(type)) {
        try {
          const decoded = request.data?.length ? await decodeEtf(request.data) : undefined;
          const input = decoded?.value ?? decoded;
          const result = await guildRoster.execute(type, input);
          send(seq, result.data);
          for (const pushed of result.pushes ?? []) publish(pushed.type, pushed.data);
          log({ event: 'guild_roster_committed', type, seq, memberCount: result.value?.members?.length ?? result.value?.member_list?.length ?? null });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'guild_roster_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (lineups.supports(type)) {
        try {
          const input = lineups.isEtfRequest(type)
            ? (request.data?.length ? await decodeEtf(request.data) : undefined)
            : unpack(lineups.requestSchema(type), request.data);
          const result = lineups.execute(type, input);
          send(seq, result.data); log({ event: 'lineup_committed', type, seq });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'lineup_rejected', type, seq, code, errorName: error.name });
        }
        return;
      }
      if (artifactDrawAct.supports(type)) {
        try {
          const input = unpackRequest(artifactDrawActSchemas[type], request.data);
          const result = artifactDrawAct.execute(type, input);
          send(seq, result.data);
          log({ event: 'artifact_draw_act_committed', type, seq, actTid: input?.act_tid ?? null });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'artifact_draw_act_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (demigodAct.supports(type) || fantasyEquipAct.supports(type)) {
        try {
          const service = demigodAct.supports(type) ? demigodAct : fantasyEquipAct;
          let input = null;
          if (noParameterEtfCommands.has(Number(type))) {
            const unexpected = await etfArgument(request.data, 'Invalid fantasy activity payload', { optional: true });
            if (unexpected !== null) throw new GameError(1, 'Fantasy activity command takes no parameters');
          } else if (scalarEtfActivityCommands.has(Number(type))) {
            input = await etfArgument(request.data, 'Invalid fantasy activity scalar');
          } else {
            const schema = demigodActSchemas[type] ?? fantasyEquipActSchemas[type];
            input = unpackRequest(schema, request.data);
          }
          const result = service.execute(type, input);
          send(seq, result.data);
          log({ event: 'relic_activity_committed', type, seq, schema: result.schema });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'relic_activity_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (type === 601) {
        let drawRequest;
        try {
          drawRequest = unpackRequest('pb_draw_hero', request.data);
        } catch (error) {
          send(seq, Buffer.alloc(0), { err: error.code ?? 1 });
          log({ event: 'fantasy_shared_draw_rejected', type, seq, code: error.code ?? 1, message: error.message });
          return;
        }
        if (fantasySharedDraw.supports601(drawRequest.draw_lib)) {
          try {
            const result = fantasySharedDraw.execute601(drawRequest);
            send(seq, result.data);
            const pushes = Array.isArray(result.pushEvents) ? result.pushEvents : [];
            for (const event of pushes) {
              if (!Number.isSafeInteger(Number(event?.pushType)) || !Buffer.isBuffer(event?.data)) {
                logger({ event: 'realtime_push_skipped', sourceType: type, pushType: event?.pushType ?? null });
                continue;
              }
              publish(Number(event.pushType), event.data);
            }
            log({ event: 'fantasy_shared_draw_committed', type, seq, pool: result.pool, pushTypes: pushes.map(event => Number(event.pushType)), ...result.valueForLog });
          } catch (error) {
            const code = error instanceof GameError ? error.code : 2;
            send(seq, Buffer.alloc(0), { err: code });
            log({ event: 'fantasy_shared_draw_rejected', type, seq, code, message: error.message });
          }
          return;
        }
      }
      // 87618 is the resident demigod draw command. RecruitService owns the
      // atomic buy-and-draw flow and its pity/wish state; FantasyDrawService
      // retains ticket purchase as a directly tested helper for other callers.
      if (fantasyDraw.supports(type) && type !== 87618) {
        try {
          const result = type === 87617
            ? fantasyDraw.setWish(unpackRequest('pb_fantasy_equip_draw_wish_req', request.data))
            : fantasyDraw.buyTickets(await singleIdArgument(request.data, 'Invalid fantasy ticket purchase'));
          send(seq, result.data);
          log({ event: 'fantasy_draw_committed', type, seq });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'fantasy_draw_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (fantasyEquipment.supports(type)) {
        try {
          const requests = new Map([
            [87601, 'pb_fantasy_equip_put_on_req'],
            [87603, 'pb_fantasy_equip_take_off_req'],
            [87604, 'pb_fantasy_equip_bless_req'],
            [87605, 'pb_fantasy_equip_id'],
            [87606, 'pb_fantasy_equip_level_up_req'],
            [87607, 'pb_fantasy_equip_composite_req'],
            [87608, 'pb_fantasy_equip_dev_req'],
            [87609, 'pb_fantasy_equip_composite_req'],
            [87611, 'pb_fantasy_equip_lineup_custom_req'],
            [87613, 'pb_fantasy_equip_lineup_one_key_req'],
            [87614, 'pb_fantasy_formation_list'],
            [87615, 'pb_fantasy_awakening_req'],
            [87616, 'pb_fantasy_awakening_req']
          ]);
          const input = type === 87610
            ? await etfArgument(request.data, 'Invalid fantasy equipment synthesis')
            : unpackRequest(requests.get(type), request.data);
          const result = fantasyEquipment.execute(type, input);
          send(seq, result.data);
          log({ event: 'fantasy_equipment_committed', type, seq });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'fantasy_equipment_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (artifact.supports(type)) {
        try {
          const artifactInput = artifact.isProtobufRequest(type)
            ? artifact.decode(type, request.data ?? Buffer.alloc(0))
            : await etfArgument(request.data, 'Invalid artifact payload');
          const result = artifact.execute(type, artifactInput);
          send(seq, result.data);
          log({ event: 'artifact_command_committed', type, seq, ...result.valueForLog });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'artifact_command_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (equip.supports(type)) {
        try {
          let input = {};
          if (type === 1001) input = unpack('pb_equip_level_up_req', request.data);
          else if (type === 1002) input = unpack('pb_equip_forge_req', request.data);
          else if (type === 1003) {
            const decoded = await decodeEtf(request.data);
            input = decoded?.value ?? decoded;
          } else if (type === 1004) input = unpack('pb_equip_refine_one_key_req', request.data);
          else if (type === 1005) input = unpack('pb_equip_inscription_req', request.data);
          else if (type === 1006) input = unpack('pb_equip_wear_req', request.data);
          const result = equip.execute(type, input);
          send(seq, result.data);
          log({ event: 'equip_committed', type, seq });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'equip_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (leaderEquip.supports(type)) {
        try {
          const input = request.data?.length ? unpack('pb_leader_equip_wear_req', request.data) : {};
          const result = leaderEquip.execute(type, input);
          send(seq, result.data);
          log({ event: 'leader_equip_wear_committed', type, seq, ...result.valueForLog });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'leader_equip_wear_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (relic.supports(type)) {
        try {
          let input;
          if ([89702, 89704, 89706].includes(type)) input = request.data?.length ? unpack('pb_req_recast_relic', request.data) : {};
          else if (type === 89705) input = request.data?.length ? unpack('pb_req_resolve_relic', request.data) : {};
          else if (type === 89708) input = request.data?.length ? unpack('pb_req_stage_relic', request.data) : {};
          else if (type === 89709) input = request.data?.length ? unpack('pb_relic_wear_req', request.data) : {};
          else input = await etfArgument(request.data, 'Invalid relic payload');
          const result = relic.execute(type, input);
          send(seq, result.data);
          log({ event: 'relic_committed', type, seq, ...result.valueForLog });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'relic_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      const endgameDevelop = endgameDevelopServices.find(service => service.supports(type));
      if (endgameDevelop) {
        try {
          const decoded = endgameDevelop.decode(type, request.data);
          const input = decoded === undefined
            ? await etfArgument(request.data, 'Invalid endgame develop payload')
            : decoded;
          const result = endgameDevelop.execute(type, input);
          send(seq, result.data);
          log({ event: 'endgame_develop_committed', type, seq, ...result.valueForLog });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'endgame_develop_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (cabin.supports(type)) {
        try {
          const input = type === 83201 ? await decodeEtf(request.data) : unpack('pb_campsite_place', request.data);
          const result = cabin.execute(type, input?.value ?? input);
          send(seq, result.data);
          log({ event: 'cabin_committed', type, seq, ...result.valueForLog });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'cabin_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (houseAssistant.supports(type)) {
        try {
          const schema = type === 88203
            ? 'pb_house_assistant_trial_req'
            : type === 88204
              ? 'pb_house_assistant_trial_cancel_req'
              : 'pb_house_assistant_use_req_list';
          const input = request.data?.length ? unpack(schema, request.data) : {};
          const result = houseAssistant.execute(type, input);
          send(seq, result.data);
          log({ event: 'house_assistant_committed', type, seq, ...result.valueForLog });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'house_assistant_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (recruit.supports(type)) {
        try {
          let input;
          if ([601, 642, 657, 673, 87617].includes(type)) {
            const schema = type === 601
              ? 'pb_draw_hero'
              : type === 673
                ? 'pb_draw_marquee_req'
                : type === 87617
                  ? 'pb_fantasy_equip_draw_wish_req'
                  : 'pb_draw_choose_wish_req';
            input = request.data?.length ? unpack(schema, request.data) : {};
          } else if (request.data?.length) {
            const decoded = await decodeEtf(request.data), value = decoded?.value ?? decoded;
            input = Array.isArray(value) && value.length === 1 ? value[0] : value;
          }
          const result = recruit.execute(type, input);
          send(seq, result.data);
          for (const pushed of result.pushes ?? []) publish(pushed.type, pushed.data);
          log({ event: 'recruit_committed', type, seq, responseBytes: result.data.length, pushCount: result.pushes?.length ?? 0, ...result.valueForLog });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'recruit_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (handbook.supports(type)) {
        let heroId;
        try {
          let result;
          if (type === 644) {
            heroId = await singleIdArgument(request.data, 'Invalid hero handbook hero');
            result = handbook.raiseOne(heroId);
          } else if (type === 645) {
            const input = unpack('pb_hero_handbook_raise_one_key_req', request.data);
            result = handbook.raiseOneKey(input.hero_id ?? []);
          } else {
            heroId = request.data?.length ? await singleIdArgument(request.data, 'Invalid hero handbook hero') : undefined;
            result = handbook.claimOwnAward(heroId);
          }
          send(seq, result.data);
          log({ event: 'hero_handbook_committed', type, seq, heroId, recordCount: result.value.records?.length ?? 1, changedTids: result.value.changedTids });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'hero_handbook_rejected', type, seq, heroId, code, message: error.message });
        }
        return;
      }
      if (heroExtra.supports(type)) {
        try {
          let input;
          if (type === 614) input = unpackRequest('hero_chip_use', request.data);
          else if (type === 663) input = unpackRequest('pb_hero_reforge_req', request.data);
          else input = await singleIdArgument(request.data, 'Invalid hero command hero id');
          const result = heroExtra.execute(type, input);
          send(seq, result.data);
          log({ event: 'hero_extra_committed', type, seq, responseBytes: result.data.length, ...result.valueForLog });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'hero_extra_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      const heroCommand = heroCommandServices.find(service => service.supports(type));
      if (heroCommand) {
        let input;
        try {
          input = heroCommand.decode
            ? await heroCommand.decode(type, request.data, {
              unpack: unpackRequest,
              etf: async data => { const decoded = await decodeEtf(data); return decoded?.value ?? decoded; },
              singleId: singleIdArgument
            })
            : undefined;
          const result = heroCommand.execute(type, input);
          send(seq, result.data);
          for (const pushed of result.pushes ?? []) {
            if (!Number.isSafeInteger(Number(pushed?.type)) || !Buffer.isBuffer(pushed?.data)) {
              logger({ event: 'realtime_push_skipped', sourceType: type, pushType: pushed?.type ?? null });
              continue;
            }
            publish(Number(pushed.type), pushed.data);
          }
          log({ event: 'hero_command_committed', type, seq, responseBytes: result.data.length, pushCount: result.pushes?.length ?? 0, ...result.valueForLog });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'hero_command_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (progression.supports(type)) {
        try {
          const input = type === 636 ? unpack('pb_hero_up_lv_req', request.data) : type === 640 ? unpack('pb_hero_wake_req', request.data) : await decodeEtf(request.data);
          const result = progression.execute(type, input?.value ?? input);
          send(seq, result.data);
          const diagnostics = type === 636 ? {
            heroUid: String(input.hero_uid),
            cellIndex: input.cell_index,
            upLvCount: input.up_lv_count,
            newLv: result.value.new_lv,
            changedHeroes: result.value.change_hero_list.map(hero => ({ uid: String(hero.uid), level: hero.level })),
            responseBytes: result.data.length,
            responseSha256: crypto.createHash('sha256').update(result.data).digest('hex')
          } : {};
          log({ event: 'hero_progression_committed', type, seq, ...diagnostics });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'hero_progression_rejected', type, seq, code, errorName: error.name });
        }
        return;
      }
      if (heroMastery.supports(type)) {
        try {
          const decoded = await decodeEtf(request.data);
          const input = decoded?.value ?? decoded;
          const result = heroMastery.execute(type, input);
          send(seq, result.data);
          log({
            event: 'hero_mastery_committed', type, seq,
            heroTid: String(result.value.hero.tid),
            masteryLevel: result.value.hero.mastery_level ?? 0,
            masteryBreak: result.value.hero.mastery_break ?? 0,
            changes: result.value.res.changes.length
          });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'hero_mastery_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (magicCircle.supports(type)) {
        try {
          const input = type === 90402
            ? unpack('pb_magic_circle_level_up_req', request.data)
            : type === 90404
              ? unpack('pb_magic_circle_active_point_req', request.data)
              : await singleIdArgument(request.data, 'Invalid magic-circle id');
          const result = magicCircle.execute(type, input);
          send(seq, result.data);
          log({ event: 'magic_circle_committed', type, seq, ...result.valueForLog, changes: result.value.res_change.changes.length });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'magic_circle_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (destiny.supports(type)) {
        try {
          const result = await destiny.execute(type, request.data);
          send(seq, result.data);
          log({ event: 'destiny_node_committed', type, seq, curStage: result.value.destiny.cur_stage, changes: result.value.res_client.changes.length });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'destiny_node_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (norseRune.supports(type)) {
        try {
          const result = await norseRune.execute(type, request.data);
          send(seq, result.data);
          log({ event: 'norse_rune_committed', type, seq, wishLevel: result.value.level ?? undefined, exp: result.value.exp ?? undefined });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'norse_rune_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (heroFavor.supports(type)) {
        try {
          let input;
          if (type === 646) input = unpack('pb_hero_favour_gift_req', request.data);
          else if (type === 653) input = unpack('pb_hero_favour_level_award_req', request.data);
          else {
            const decoded = await decodeEtf(request.data);
            input = decoded?.value ?? decoded;
          }
          const result = heroFavor.execute(type, input);
          send(seq, result.data);
          log({ event: 'hero_favour_committed', type, seq, ...result.valueForLog });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'hero_favour_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (eliteMission.supports(type)) {
        try {
          let input;
          if (type === 87002) input = unpack('pb_elite_mission_box_award_req', request.data);
          else if (request.data?.length) {
            const decoded = await decodeEtf(request.data);
            input = decoded?.value ?? decoded;
          }
          const result = await eliteMission.execute(type, input);
          send(seq, result.data);
          logger({ event: 'elite_mission_committed', type, seq });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          logger({ event: 'elite_mission_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (type === 8000) {
        const requestData = unpack('pb_req_save_process', request.data);
        store.transaction(model => { for (const process of requestData.req_list ?? []) model.state.guides[process.key_id] = process.process_id; });
        // Return the evidenced response schema, with the requested process records.
        const responseType = root.lookupType('pb_req_save_process_back');
        send(seq, pack(responseType.name, { process_list: requestData.req_list })); return;
      }
      if (shop.supports(type)) {
        try {
          let input;
          if (type === 1201) input = unpackRequest('pb_req_buy_shop_item', request.data);
          else if (type === 1206) input = unpackRequest('pb_req_buy_history_item', request.data);
          else input = await etfArgument(request.data, 'Invalid shop payload', { optional: type === 1202 });
          const result = shop.execute(type, input, { connection: id, seq });
          // A null result means the request belongs to another shop family (pet-activity mall or an
          // unknown id); leave it to the legacy handlers below.
          if (result) {
            send(seq, result.data);
            log({ event: 'shop_committed', type, seq, shopId: result.value?.shop?.id ?? result.value?.shop_id ?? null });
            return;
          }
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'shop_rejected', type, seq, code, message: error.message });
          return;
        }
      }
      if (guide.supports(type)) {
        try {
          const decoded = request.data?.length ? await decodeEtf(request.data) : undefined;
          const result = await guide.execute(type, decoded?.value ?? decoded);
          // 8002 req_check_guide_net has no response schema and no c2s_back
          // registration, so a successful probe writes no frame back.
          if (result) send(seq, result.data);
          log({ event: 'guide_command_committed', type, seq, ...(result?.value ? { awardTid: result.value.awardTid, claimKey: result.value.claimKey, changes: result.value.res?.changes?.length } : {}) });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'guide_command_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (type === 1202) {
        // Hall entry asks for shop ids. Auto-refresh shops require one decodable group even when
        // their stock starts empty; the client dereferences group_data_bin during LoginFinish.
        let shopIds = [];
        try {
          const decoded = await decodeEtf(request.data);
          const value = decoded?.value ?? decoded;
          if (Array.isArray(value)) shopIds = value.filter(id => Number.isSafeInteger(id) && id > 0).slice(0, 32);
        } catch {}
        const autoRefreshIds = new Set([201, 202, 203, 204, 205, 206, 207]);
        const shopNow = Math.floor(clock() / 1000);
        const autoRefresh = pack('pb_shop_auto_refresh', {
          next_refresh_time: shopNow + 86400,
          limit_bought_count: 0,
          items_history_bought: []
        });
        const shops = petActivity.queryShops(shopIds).map(shop => {
          if (autoRefreshIds.has(Number(shop.id)) && !shop.items_groups.length) {
            shop.items_groups = [{ item_list: [], group_data_bin: autoRefresh }];
          }
          return shop;
        });
        send(seq, pack('pb_query_shops_back', { shops }));
        log({ event: 'shop_info_sent', type, seq, shopCount: shops.length, autoRefreshIds: shopIds.filter(id => autoRefreshIds.has(Number(id))), petShopId: shops.find(shop => Number(shop.id) === 5070005)?.id ?? null }); return;
      }
      if (type === 1201) {
        try {
          const requestData = unpack('pb_req_buy_shop_item', request.data);
          const result = petActivity.purchaseShop(requestData, { connection: id, seq });
          send(seq, result.data);
          log({ event: 'pet_activity_shop_purchase_committed', type, seq, shopId: requestData.shop_id, itemId: requestData.shop_item_id, count: requestData.count, duplicate: result.duplicate });
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'pet_activity_shop_purchase_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if (type === 85901) {
        try {
          const actives = unpack('pb_recommend_gift_active_req', request.data).actives ?? [];
          // buy_times drives the client's remaining-purchase badge. Mirror the
          // same recharge_orders count that wallet purchase limits enforce.
          const buyCounts = store.inspect(db => new Map(db.prepare('SELECT product_id, count(*) AS n FROM recharge_orders GROUP BY product_id').all().map(row => [Number(row.product_id), Number(row.n)])));
          const activityState = petActivity.loginActivity();
          const runningIds = new Set([
            ...(activityState.act_list ?? []).map(entry => Number(entry.state_data?.act_id)),
            ...(activityState.act_parallel_list ?? []).flatMap(group => (group.states_data ?? []).map(entry => Number(entry.act_id)))
          ]);
          const pausedIds = new Set((activityState.act_pause_list ?? []).map(Number));
          const gift_list = actives.flatMap(active => {
            const actId = Number(active.act_tid);
            if (!runningIds.has(actId) || pausedIds.has(actId) || !calendar.isActivityRunning(actId, null, activityState)) return [];
            const petCfg = tables.PetActivity?.get(actId);
            const heroDraw = actId === heroDrawActivity.activityId;
            const configuredGifts = heroDraw
              ? new Set(heroDrawActivity.giftIds())
              : petCfg ? new Set((tables.GiftShop?.get(Number(petCfg.gift))?.gift ?? []).map(Number)) : null;
            const requestedGifts = (active.gift_id ?? []).map(Number).filter(id => !configuredGifts || configuredGifts.has(id));
            if (!requestedGifts.length) return [];
            return [{
              act_tid: actId,
              buy_list: requestedGifts.map(rechargeTid => ({
                recharge_tid: rechargeTid,
                buy_times: heroDraw ? heroDrawActivity.giftPurchaseCount(rechargeTid) : petCfg ? petActivity.giftPurchaseCount(rechargeTid) : (buyCounts.get(rechargeTid) ?? 0)
              }))
            }];
          });
          send(seq, pack('pb_recommend_gift_active_rsp', { gift_list }));
          log({ event: 'recommend_gift_active_sent', type, seq, giftCount: gift_list.length, buyCount: gift_list.reduce((sum, gift) => sum + gift.buy_list.length, 0), boughtCount: gift_list.reduce((sum, gift) => sum + gift.buy_list.filter(buy => buy.buy_times > 0).length, 0) });
        } catch (error) {
          send(seq, Buffer.alloc(0), { err: 1 });
          log({ event: 'recommend_gift_active_rejected', type, seq, message: error.message });
        }
        return;
      }
      const reads = new Map([[100601, ['pb_group_buy_act_server', {}]]]);
      if (reads.has(type)) { const [schema, object] = reads.get(type); send(seq, pack(schema, object)); return; }
      if (type === 53001 || type === 53002) {
        try {
          let input;
          try {
            input = await decodeEtf(request.data);
          } catch {
            throw new GameError(1, 'Invalid activity synchronization ETF');
          }
          // The three captured 53001 requests are proper ETF lists containing
          // two integers. Their meanings and the 53002 argument contract are
          // unrecovered, so neither command may assert a state transition.
          if (type === 53001 && (
            !(input instanceof E.OtpErlangList) || input.improper !== false ||
            input.value.length !== 2 || !input.value.every(Number.isSafeInteger)
          )) throw new GameError(1, 'Unsupported activity synchronization shape');
          throw new GameError(5, 'Activity state transition contract is not recovered');
        } catch (error) {
          const code = error instanceof GameError ? error.code : 2;
          send(seq, Buffer.alloc(0), { err: code });
          log({ event: 'activity_stage_sync_rejected', type, seq, code, message: error.message });
        }
        return;
      }
      if ([108, 102801].includes(type)) {
        // 108 (req_remove_operate_display) is a UI-only acknowledgement after a purchase.
        send(seq);
        if (type === 108) log({ event: 'operate_display_removed', type, seq });
        return;
      }
      log({ event: 'unsupported_command', type, seq, payloadHead: payloadBytes(request.data, 64) });
      send(seq, Buffer.alloc(0), { err: -1, stacktrace: 'LOCAL_NOT_IMPLEMENTED:' + type });
    }
    socket.on('data', chunk => {
      try { for (const payload of decoder.push(chunk)) chain = chain.then(() => handle(payload)); }
      catch (error) { socket.destroy(); log({ event: 'frame_error', message: error.message }); }
      chain = chain.catch(error => { log({ event: 'handler_error', message: error.message }); socket.destroy(); });
    });
    log({ event: 'game_connected' });
  });
  return {
    root, loginPayload, store, wallet, mail, voucher, onlineGift, monthPermit, monthlyCard, calendar, handbook, petActivity, heroDrawActivity,
    fantasyDraw, fantasyEquipment, fantasySharedDraw, artifactDrawAct, demigodAct, fantasyEquipAct, tables,
    guildRoster, heroFavor, teamSuggest, teamGenre, destiny, wishTreasure, wishTree, timeTemple, magicCircle, norseRune, cabin, houseAssistant, rankAchieve,
    cms, guildNationAssist, groupBuyAct, dragonLandAct, diamondBankAct, freePrivilegeAct, message, hundredDraw,
    cms, guildNationAssist, groupBuyAct, dragonLandAct, diamondBankAct, freePrivilegeAct, slotGameAct, minigameAct, message, hundredDraw,
    listen(port = 19090) { return new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', () => resolve(server.address())); }); },
    close() { for (const socket of sockets) socket.destroy(); return new Promise(resolve => server.close(() => { store.close(); resolve(); })); }
  };
}
