import { ACTIVITY_LOGIN_MODULE_ID, createFantasyActSharedService } from './fantasy-act-shared-service.mjs';

const SUPPORTED = new Set([98301, 98302, 98303, 98304, 98305, 98306, 98307, 98308]);

/** Thin protocol adapter. State and validation live in fantasy-act-shared-service. */
export function createDemigodActService({ store, codec, tables, now, activityTid = null, ...options }) {
  const shared = createFantasyActSharedService({
    store, codec, tables, now, demigodActTid: activityTid, ...options
  });

  function execute(type, input) {
    log({ event: 'demigod_execute_entry', type, input, inputHex: input?.toString('base64') });
    switch (Number(type)) {
      case 98301: return shared.claimDailyMarbles('demigod');
      case 98302: return shared.claimBigMarbles('demigod');
      case 98303: return shared.claimTrialReward('demigod', input);
      case 98304: return shared.wearTrialEquipment('demigod', input);
      case 98305: return shared.wearTrialBless('demigod', input);
      case 98306: return shared.copyTrial('demigod', input);
      case 98307: return shared.claimDemoGodDrawAward();
      case 98308: return shared.setWish('demigod', input);
      default: throw Object.assign(new Error('Unsupported demigod activity command'), { code: 1 });
    }
  }

  return {
    moduleId: ACTIVITY_LOGIN_MODULE_ID, shared, inventory: shared.inventory, execute,
    ensureLoginState: () => shared.ensureState('demigod'),
    serializeLoginBlocks: () => shared.serializeLoginBlocks('demigod'),
    recordDraw: (model, event, actTid) => shared.recordDraw(model, 'demigod', event, actTid),
    recordTrialDamage: (model, tid, damage, actTid) => shared.recordTrialDamage(model, 'demigod', tid, damage, actTid),
    recordTaskEvent: (model, event, actTid) => shared.recordTaskEvent(model, 'demigod', event, actTid),
    createReferenceProvider: shared.createReferenceProvider,
    supports: type => SUPPORTED.has(Number(type))
  };
}
