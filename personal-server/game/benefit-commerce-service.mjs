import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';

// 块 I（PAY-*，#212–#264）的命令入口。96 条原本未路由的命令里，只有三条具备
// 完整证据可以真实结算（87301 永久卡每日奖励、84602 公主体力补领、16006 龙晶
// 充值走既有 16005 充值链路）；其余命令的 tid 配置表没有随客户端包导出，无法
// 在不知道奖励内容的情况下发放资源，因此在这里按家族 fail closed：返回明确的
// 错误码与原因、写入审计日志，避免用固定空包销项。
export const PERMANENT_CARD_MODULE_ID = 62;
export const PRINCESS_MODULE_ID = 126;
export const BENEFIT_COMMANDS = Object.freeze({
  PERMANENT_CARD_AWARD: 87301,
  PRINCESS_AWARD_SUPPLEMENT: 84602
});

const dayIndex = seconds => Math.floor((Number(seconds) + 10800) / 86400);

// 每个家族代表一张任务卡。reason 会同时进入错误信息和日志，便于把服务端拒绝
// 还原到具体缺失的证据。
const REFUSAL_FAMILIES = [
  { card: 'PAY-TRIGGERGIFT', types: [18001, 18002], reason: 'TriggerGiftTable 未导出：触发礼包的 tid、次数与奖励配置无证据' },
  { card: 'PAY-UPSTARGIFT', types: [31052, 31053], reason: 'UpStarGiftTable 未导出：升星礼包档位与活动版本配置无证据' },
  { card: 'PAY-VIP', types: [33001, 33002, 76301], reason: 'VipTable 未导出：VIP 等级、礼包与经验兑换配置无证据' },
  { card: 'PAY-PERMIT', types: [35003, 35004, 35006, 35007, 35008, 35009, 35010, 35011], reason: 'ETF 请求契约与买级/福利/期数配置未取得：只有已实现的 35001/35002/35005 可结算' },
  { card: 'PAY-FUNDACT', types: [51001], reason: 'FundActTable 未导出：基金活动等级与奖励配置无证据' },
  { card: 'PAY-NOTIFYGIFT', types: [76201], reason: '平台推送礼包数据由 GMC 下发，本服没有对应配置与推送通道' },
  { card: 'PAY-REDENVELOPE', types: [77001, 77002, 77003], reason: '红包配置表未导出：红包 tid 与掉落奖励无证据，且 pb_client_red_envelope 定义缺失' },
  { card: 'PAY-VIPGIFT', types: [77101], reason: '公主赠送礼包由平台推送，配置表未导出', },
  { card: 'PAY-FASHION', types: [82602, 82603, 82604], reason: 'FashionTable 未导出：时装激活道具、等级成长与消耗配置无证据' },
  { card: 'PAY-VIPCITY', types: [82701], reason: 'VipCityTable 未导出：VIP 城市建筑与重建消耗配置无证据' },
  { card: 'PAY-RECOVERY', types: [87401], reason: 'RecoveryTable 未导出：追回资源清单与免费额度配置无证据' },
  { card: 'PAY-PRINCESS', types: [84603], reason: '跨期刷新补领的能量来源与刷新周期未取得证据；84601/84602 已真实结算' },
  { card: 'PAY-WEEKENDBONUS', types: [87501, 87502], reason: 'WeekendBonusTable 未导出：周末奖励档位与游玩次数阈值配置无证据' },
  { card: 'PAY-LEVELSPRINT', types: [88101], reason: 'LevelSprintTable 未导出：等级冲刺档位奖励配置无证据' },
  { card: 'PAY-HEATGIFT', types: [88601, 88602], reason: 'HeatGiftTable 未导出：全服应援值与全服礼包限购配置无证据' },
  { card: 'PAY-FLASHSALE', types: [88701, 88702], reason: 'FlashSaleTable 未导出：砍价初始价、暴击与英雄奖励配置无证据' },
  { card: 'PAY-ASSISTANT', types: [88901, 88902, 88903], reason: 'AssistantTable 未导出：玩法助手功能项与执行命令配置无证据' },
  { card: 'PAY-PREBOOK', types: [92401, 92402], reason: 'PrebookTable 未导出：预约任务档位与分享奖励配置无证据' },
  { card: 'PAY-ROLESHARE', types: [92501], reason: 'RoleShareTable 未导出：分享奖励配置无证据' },
  { card: 'PAY-CROSS', types: [92601, 92602, 92603], reason: 'CrossTable 未导出：跨服广告与功能奖励配置无证据' },
  { card: 'PAY-REDRAIN', types: [92901, 92902, 92903], reason: 'RedRainTable 未导出：红包雨轮次、权重与保底配置无证据' },
  { card: 'PAY-DIAMONDFUND', types: [93201, 93202], reason: 'DiamondFundTable 只有 tid 与 recharge_tid：稳健/幸运的每日奖励档位无证据' },
  { card: 'PAY-WEEKHUNT', types: [93401, 93402, 93403], reason: 'WeekHuntTable 只有字节码：任务进度函数与升级礼包档位未解码' },
  { card: 'PAY-LINKGIFT', types: [97401], reason: 'LinkGiftTable 未导出：联动礼包自选档位配置无证据' },
  { card: 'PAY-VIPLINK', types: [98001], reason: 'VipLinkTable 未导出：VIP 联动展示配置无证据' },
  { card: 'PAY-GEMREBATEACT', types: [98630], reason: 'GemRebateActTable 未导出：宝石返利投入与返利比例无证据' },
  { card: 'PAY-APPEARANCERELEASEACT', types: [98800], reason: 'AppearanceReleaseActTable 未导出：外观上新互动配置无证据' },
  { card: 'PAY-CAKEACTIVITY', types: [99000, 99001, 99002], reason: 'CakeActivityTable 未导出：蛋糕每日/充值托盘奖励配置无证据' },
  { card: 'PAY-QUADRUPLECROSS', types: [99500, 99501, 99502], reason: 'QuadrupleCrossTable 未导出：四重跨期随机与档位奖励配置无证据' },
  { card: 'PAY-FINANCEMANAGEACT', types: [99901, 99902], reason: 'FinanceManageActTable 未导出：理财档位与返利比例无证据' },
  { card: 'PAY-SKINCRYSTAL', types: [100401], reason: 'SkinCrystalTable 未导出：皮肤水晶商品配置无证据' },
  { card: 'PAY-REBATESHOPACT', types: [100701], reason: 'RebateShopActTable 未导出：返利商店档位配置无证据' },
  { card: 'PAY-DIVINEREALMACT', types: [101701], reason: 'DivineRealmActTable 未导出：神域礼包档位配置无证据' },
  { card: 'PAY-BONUSSHOP', types: [101903], reason: 'BonusShopTable 未导出：奖励商店商品与货币配置无证据' },
  { card: 'PAY-AUCTION', types: [102701, 102702, 102703, 102704, 102705], reason: 'AuctionTable 未导出：拍卖场次、底价、分红与流拍规则无证据' },
  { card: 'PAY-SKINRECHARGE', types: [103601], reason: 'SkinRechargeTable 未导出：皮肤充值角色/档位配置无证据' },
  { card: 'PAY-BUYSKINACT', types: [104001], reason: 'BuySkinActTable 未导出：购皮肤活动免费档位配置无证据' },
  { card: 'PAY-ACTSHOP', types: [104801, 104802, 104803], reason: 'ActShopTable 未导出：活动商店商品、货币与等级奖励配置无证据' },
  { card: 'PAY-PREMIUMACT', types: [105401], reason: 'PremiumActTable 未导出：增值活动免费档位配置无证据' },
  { card: 'PAY-RECYCLEACT', types: [105901], reason: 'RecycleActTable 未导出：回收折算比例配置无证据' },
  { card: 'PAY-VICKREYAUCTIONACT', types: [106101, 106102], reason: 'VickreyAuctionActTable 未导出：密封拍卖场次与结算规则无证据' },
  { card: 'PAY-GIFTBOXACT', types: [106301], reason: 'GiftBoxActTable 未导出：礼盒档位与领取条件配置无证据' },
  { card: 'PAY-SUBSCRIPTIONACT', types: [107301, 107302, 107303], reason: 'SubscriptionActTable 未导出：订阅周期、领取与入场配置无证据' },
  { card: 'PAY-NEWPERMITACT', types: [107401], reason: 'NewPermitActTable 未导出：新通行证档位奖励配置无证据' }
];

const REFUSALS = new Map(REFUSAL_FAMILIES.flatMap(family => family.types.map(type => [type, family])));

export function createBenefitCommerceService({ store, codec, tables, now = Date.now, logger = () => {} }) {
  const log = event => { try { logger(event); } catch {} };

  function assertNoArgument(value, label) {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value) && value.length === 0) return;
    throw new GameError(1, label + ' takes no arguments');
  }

  function readPermanentCard(modules) {
    const moduleValue = modules.get(PERMANENT_CARD_MODULE_ID);
    if (!moduleValue) throw new GameError(5, 'Permanent card login data is unavailable');
    const card = codec.unpack('pb_permanent_card', rawBinary(moduleValue));
    card.element_list ??= [];
    card.record_list ??= [];
    return card;
  }

  // 87301 req_permanent_card_award：永久卡行的 reward 是每日领取的固定奖励，
  // day_limit 是天数上限。登录模块 62 的 element_list.last_reward_day 记录最后
  // 领取日（04:00 UTC+8 跨日），与 126/134 等日常模块使用同一套日索引。
  function permanentCardAward(input) {
    assertNoArgument(input?.value ?? input, 'Permanent card award');
    const at = Math.floor(Number(now()) / 1000);
    const today = dayIndex(at);
    const result = store.transaction(model => {
      const modules = new Map(model.state.modules.value);
      const card = readPermanentCard(modules);
      if (!card.element_list.length) throw new GameError(5, 'Permanent card is not active');
      const awards = [];
      for (const element of card.element_list) {
        const config = tables.PermanentCard?.get(Number(element.tid));
        if (!config) throw new GameError(5, 'Permanent card configuration is unavailable');
        if (Number(element.last_reward_day) === today) throw new GameError(310, 'Permanent card reward already claimed');
        awards.push(...(Array.isArray(config.reward) ? config.reward : []));
        element.last_reward_day = today;
        element.data_version = Number(element.data_version ?? 0) + 1;
      }
      const res = grantResources(model, awards, tables, { codec });
      modules.set(PERMANENT_CARD_MODULE_ID, serializedBinary(codec.pack('pb_permanent_card', card)));
      model.state.modules.value = [...modules];
      return { card, res };
    });
    log({
      event: 'permanent_card_award_claimed', day: today,
      cards: result.card.element_list.map(row => Number(row.tid)), changes: result.res.changes.length
    });
    return { value: result, data: codec.pack('pb_permanent_card_back', { card: result.card, res: result.res }) };
  }

  // 84602 req_princess_award_supplement：公主每日体力（EnergyAward type 1/2）在
  // 玩家当天没有点领取时的补领入口。补领把 pb_princess.energy 的当日领取位一起
  // 前移，因此 84601 当天再领会返回 310，不会重复发放。
  function princessAwardSupplement(input) {
    assertNoArgument(input?.value ?? input, 'Princess award supplement');
    const at = Math.floor(Number(now()) / 1000);
    const today = dayIndex(at);
    const result = store.transaction(model => {
      const modules = new Map(model.state.modules.value);
      const moduleValue = modules.get(PRINCESS_MODULE_ID);
      if (!moduleValue) throw new GameError(5, 'Princess login data is unavailable');
      const princess = codec.unpack('pb_princess', rawBinary(moduleValue));
      const energy = princess.energy ??= {};
      const supplement = princess.supplement ??= {};
      supplement.princess_energy ??= [];
      const lastSupplementDay = Number(supplement.last_supplement_day ?? 0);
      if (lastSupplementDay >= today) throw new GameError(310, 'Princess supplement already claimed');
      const awards = [];
      const moon = Number(energy.last_noon_day ?? 0) < today;
      const night = Number(energy.last_night_day ?? 0) < today;
      for (const [param, pending] of [[1, moon], [2, night]]) {
        if (!pending) continue;
        const config = tables.EnergyAward?.get(param);
        if (!config) throw new GameError(5, 'Princess energy award configuration is unavailable');
        awards.push([config.award_item, config.award_count]);
      }
      if (!awards.length) throw new GameError(310, 'Princess energy is already claimed today');
      if (moon) energy.last_noon_day = String(today);
      if (night) energy.last_night_day = String(today);
      supplement.last_supplement_day = String(today);
      supplement.princess_energy.push({ day: String(today), moon, night });
      const res = grantResources(model, awards, tables, { codec });
      modules.set(PRINCESS_MODULE_ID, serializedBinary(codec.pack('pb_princess', princess)));
      model.state.modules.value = [...modules];
      return { supplement, res };
    });
    log({ event: 'princess_award_supplement_claimed', day: today, changes: result.res.changes.length });
    return { value: result, data: codec.pack('pb_princess_supplement_back', { supplement: result.supplement, res: result.res }) };
  }

  function execute(type, input) {
    if (Number(type) === BENEFIT_COMMANDS.PERMANENT_CARD_AWARD) return permanentCardAward(input);
    if (Number(type) === BENEFIT_COMMANDS.PRINCESS_AWARD_SUPPLEMENT) return princessAwardSupplement(input);
    const family = REFUSALS.get(Number(type));
    if (!family) throw new GameError(1, 'Unsupported benefit command');
    log({ event: 'benefit_command_refused', type: Number(type), card: family.card, reason: family.reason });
    throw new GameError(5, family.card + ': ' + family.reason);
  }

  return {
    supports: type => REFUSALS.has(Number(type)) || Object.values(BENEFIT_COMMANDS).includes(Number(type)),
    execute,
    refusals: REFUSALS,
    commands: BENEFIT_COMMANDS
  };
}

