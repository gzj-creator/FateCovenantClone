import { ACTIVITY_LOGIN_MODULE_ID, createFantasyActSharedService } from './fantasy-act-shared-service.mjs';

const SUPPORTED = new Set([88922, 88924, 88927, 88928, 88929, 88930, 88931, 88932]);

/** Thin protocol adapter. Fantasy activity tables are injected by M6. */
export function createFantasyEquipActService({ store, codec, tables, fantasyTables, now, activityTid = null, logger = () => {}, ...options }) {
  const log = event => { try { logger(event); } catch {} };
  const shared = createFantasyActSharedService({
    store, codec, tables, fantasyTables, now, fantasyActTid: activityTid, logger, ...options
  });

  function execute(type, input) {
    log({ event: 'fantasy_equip_act_execute_entry', type, input, inputHex: input?.toString('base64') });
    switch (Number(type)) {
      case 88922: return shared.claimDailyMarbles('fantasy');
      case 88924: return shared.setWish('fantasy', input);
      case 88927: return shared.claimVoteAward('fantasy');
      case 88928: return shared.claimTrialReward('fantasy', input);
      case 88929: return shared.wearTrialEquipment('fantasy', input);
      case 88930: return shared.wearTrialBless('fantasy', input');
      case 88931: return shared.copyTrial('fantasy', input);
      case 88932: return shared.claimTask('fantasy', input);
      default: throw Object.assign(new Error('Unsupported fantasy activity command'), { code: 1 });
    }
  }

  return {
    moduleId: ACTIVITY_LOGIN_MODULE_ID, shared, inventory: shared.inventory, execute,
    ensureLoginState: () => shared.ensureState('fantasy'),
    serializeLoginBlocks: () => shared.serializeLoginBlocks('fantasy'),
    recordDraw: (model, event, actTid) => shared.recordDraw(model, 'fantasy', event, actTid),
    recordTrialDamage: (model, tid, damage, actTid) => shared.recordTrialDamage(model, 'fantasy', tid, damage, actTid),
    recordTaskEvent: (model, event, actTid) => shared.recordTaskEvent(model, 'fantasy', event, actTid),
    createReferenceProvider: shared.createReferenceProvider,
    supports: type => SUPPORTED.has(Number(type))
  };
}
