import { rawBinary, serializedBinary } from '../protocol/game-codec.mjs';
import { GameError } from './hero-progression.mjs';
import { grantResources } from './resources.mjs';
import { gameDayIndex } from './time.mjs';

// 块 I（PAY-*，#212–#264）的命令入口。87301 永久卡每日奖励与 84602 公主体力
// 补领在这里真实结算，16006 龙晶充值走既有 16005 链路；其余家族只有在请求、
// 状态迁移、奖励和持久化均可证明时才可落地。当前 APK 已补齐多张活动表，但表
// 存在不等于购买、领奖、全服轮次和结算契约完整，因此未证明的命令继续 fail
// closed，并把具体缺失的状态字段或事务写进拒绝原因。
export const PERMANENT_CARD_MODULE_ID = 62;
export const PRINCESS_MODULE_ID = 126;
export const BENEFIT_COMMANDS = Object.freeze({
  PERMANENT_CARD_AWARD: 87301,
  PRINCESS_AWARD_SUPPLEMENT: 84602
});

const dayIndex = seconds => gameDayIndex(Number(seconds));

// 请求编码和 schema 取自 agent/workflow/interface-catalog/tcp-commands.md 与
// assets/protobuf 里的 net 描述。真实客户端对下面这些命令发的是 protobuf，
// 网关若统一按 ETF 解包，请求会在进入拒绝分支之前变成 code 1
// (Invalid benefit payload)，家族与缺失资产就查不出来。
export const BENEFIT_PROTOBUF_REQUESTS = Object.freeze({
  98800: 'pb_appearance_release_act_interact_req',
  99002: 'pb_cake_activity_select_plate_req',
  99901: 'pb_finance_manage_act_select_product_req',
  101701: 'pb_divine_realm_gift_select_req',
  102701: 'pb_auction_bid_req',
  102702: 'pb_auction_wish_req',
  101903: 'pb_bonus_shopping_req',
  104001: 'pb_buy_skin_free_req',
  104802: 'pb_act_buy_goods_req',
  104803: 'pb_act_shop_level_rewards_req',
  105401: 'pb_premium_free_award_req',
  105901: 'pb_recycle_act_recycle_req',
  106101: 'pb_vickrey_auction_act_info_req',
  106102: 'pb_vickrey_auction_act_bid_req',
  106301: 'pb_gift_box_receive_req',
  107301: 'pb_subscription_act_subscribe_req',
  107302: 'pb_subscription_act_subscribe_req',
  107401: 'pb_new_permit_award_req',
  88901: 'pb_assistant_setting_req',
  88902: 'pb_assistant_execute_req',
  92902: 'pb_red_rain_rev_award_req',
  93401: 'pb_week_common_task_req',
  93402: 'pb_week_common_progress_req',
  93403: 'pb_week_upgrade_gift_req',
  98630: 'pb_gem_rebate_req',
  35010: 'pb_permit_select_award_req',
  35011: 'pb_permit_choose_req'
});

// 拒绝日志只保留可读的标量字段，避免把整包二进制写进事件文件。
function summarizeRequest(value) {
  if (value == null) return null;
  if (Buffer.isBuffer(value)) return { bytes: value.length };
  if (Array.isArray(value)) return value.slice(0, 8).map(summarizeRequest);
  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value.toNumber === 'function') return Number(value.toNumber());
  const output = {};
  for (const [key, field] of Object.entries(value)) {
    if (Object.keys(output).length >= 8) break;
    if (field == null) continue;
    if (typeof field === 'number' || typeof field === 'string' || typeof field === 'boolean') output[key] = field;
    else if (typeof field.toNumber === 'function') output[key] = Number(field.toNumber());
    else if (Array.isArray(field) || typeof field === 'object') output[key] = summarizeRequest(field);
  }
  return output;
}

// 每个家族代表一张任务卡。reason 会同时进入错误信息和日志，便于把服务端拒绝
// 还原到具体缺失的证据。
const REFUSAL_FAMILIES = [
  { card: 'PAY-TRIGGERGIFT', types: [18001, 18002], reason: 'TriggerGiftTable 未导出：触发礼包的 tid、次数与奖励配置无证据' },
  // 31052/31053 由 up-star-gift-service.mjs 接管：登录版本块、版本选择与
  // 真实活动窗口已实现；31052/31053 由独立 UpStarGift service 在进入本
  // benefit-commerce 路由前处理，充值礼包仍由 RechargeMgr 处理。
  { card: 'PAY-VIP', types: [33001, 33002, 76301], reason: 'VipTable 未导出：VIP 等级、礼包与经验兑换配置无证据' },
  { card: 'PAY-PERMIT', types: [35003, 35004, 35006, 35007, 35008, 35009, 35010, 35011], reason: 'PermitTable 已导出，35001/35002/35005 可结算；35003/35004/35006-35009 的买级、期数调整、福利与手动结算规则未取得，35010/35011 的选奖与换期规则未取得' },
  { card: 'PAY-FUNDACT', types: [51001], reason: 'FundActTable 未导出：基金活动等级与奖励配置无证据' },
  { card: 'PAY-NOTIFYGIFT', types: [76201], reason: '平台推送礼包数据由 GMC 下发，本服没有对应配置与推送通道' },
  { card: 'PAY-REDENVELOPE', types: [77001, 77002, 77003], reason: 'RedEnvelopeTable 未导出：red_envelope.db/net protobuf 已导出 pb_red_envelope 与复数响应，但红包池、掉落奖励、发送者维度和权威领取位仍无证据' },
  { card: 'PAY-VIPGIFT', types: [77101], reason: '公主赠送礼包由平台推送，配置表未导出', },
  { card: 'PAY-FASHION', types: [82602, 82603, 82604], reason: 'FashionTable、pb_fashion_data/pb_fashion_lv_back 与模块 110 已导出；缺 FashionCmd/Mgr/Data 的 Lua prototype 和运行样本，82602/82603/82604 的激活、穿戴、升级参数与原子写回仍未闭合' },
  { card: 'PAY-VIPCITY', types: [82701], reason: 'VipCityTable 未导出：VIP 城市建筑与重建消耗配置无证据' },
  { card: 'PAY-RECOVERY', types: [87401], reason: 'RecoveryTable 未导出：追回资源清单与免费额度配置无证据' },
  { card: 'PAY-PRINCESS', types: [84603], reason: '跨期刷新补领的能量来源与刷新周期未取得证据；84601/84602 已真实结算' },
  { card: 'PAY-WEEKENDBONUS', types: [87501, 87502], reason: 'WeekendBonusTable 的 Func/Shop/Const/WeekendBonus/ProgressAward 与模块 145 登录数据已导出并装载；87501/87502 的请求 tid 到 WeekendBonus/Func.skip_func 映射、today/total play_count 的权威记录来源及 reward_bin 写回仍未取得客户端 Lua 或运行样本证据' },
  { card: 'PAY-LEVELSPRINT', types: [88101], reason: 'LevelSprintTable 与 pb_level_sprint 已导出，但 88101 的升级来源、免费档领取编码及重复领取错误尚无运行样本；实现前不能只凭档位表发奖' },
  { card: 'PAY-HEATGIFT', types: [88601, 88602], reason: 'HeatGiftTable 未导出：全服应援值与全服礼包限购配置无证据' },
  { card: 'PAY-FLASHSALE', types: [88701, 88702], reason: 'FlashSaleTaskGroup/FlashSaleTask/FlashSaleVersion/FlashSaleConst/FlashSaleGift 已包含在 ActivityTable 中，但任务版本选择、2301/1201/1115 进度的权威来源、砍价价格/暴击算法、gift_hero 选取和玩家领取位均未由 Lua 与样本闭合' },
  { card: 'PAY-ASSISTANT', types: [88901, 88902, 88903], reason: 'AssistantTable 未导出：玩法助手功能项与执行命令配置无证据' },
  { card: 'PAY-PREBOOK', types: [92401, 92402], reason: 'PrebookTable 未导出：预约任务档位与分享奖励配置无证据' },
  { card: 'PAY-ROLESHARE', types: [92501], reason: 'RoleShareTable 未导出：分享奖励配置无证据' },
  { card: 'PAY-CROSS', types: [92601, 92602, 92603], reason: 'CrossTable 未导出：跨服广告与功能奖励配置无证据' },
  { card: 'PAY-REDRAIN', types: [92901, 92902, 92903], reason: 'RedRainTable 未导出：红包雨轮次、权重与保底配置无证据' },
  { card: 'PAY-DIAMONDFUND', types: [93201, 93202], reason: 'DiamondFundTable 的 Type/SteadyFundAward/FortuneFundAward 已可解码（含充值 tid、15 日奖励和幸运权重），但购买周期、day_award 领取选择、minimum_count 保底及 day_award_history 写回尚未由 Lua 或运行样本闭合' },
  { card: 'PAY-WEEKHUNT', types: [93401, 93402, 93403], reason: 'WeekHuntTable 字节码中的 TaskType/Period/Const/Task/Progress/OldTask 已可解码，Period/Const 也用于购买台账；但 93401/93402 的 task_id 进度来源、common_progress/week_common_task 位图编码与 93403 免费/升级礼包领取迁移仍缺 Lua 或运行样本证据' },
  { card: 'PAY-LINKGIFT', types: [97401], reason: 'LinkGiftTable 与 pb_link_gift_master 已导出，但 custom_list 的 normal_tid/choose_gift 选择约束、版本作用域、写回顺序及非法自选错误仍未由 Lua 与运行样本闭合' },
  { card: 'PAY-VIPLINK', types: [98001], reason: 'VipLinkTable 未导出：VIP 联动展示配置无证据' },
  { card: 'PAY-GEMREBATEACT', types: [98630], reason: 'GemRebateActTable 未导出：宝石返利投入与返利比例无证据' },
  { card: 'PAY-APPEARANCERELEASEACT', types: [98800], reason: 'AppearanceReleaseActTable、交互请求和 pb_appearance_release_act 已导出，但 interact_state 的位/计数编码、NPC idx 对应、每日上限和领取记录迁移仍未闭合' },
  { card: 'PAY-CAKEACTIVITY', types: [99000, 99001, 99002], reason: 'CakeActivityTable 未导出：蛋糕每日/充值托盘奖励配置无证据' },
  { card: 'PAY-QUADRUPLECROSS', types: [99500, 99501, 99502], reason: 'QuadrupleCrossTable 未导出：四重跨期随机与档位奖励配置无证据' },
  { card: 'PAY-FINANCEMANAGEACT', types: [99901, 99902], reason: 'FinanceManageActTable 未导出：理财档位与返利比例无证据' },
  { card: 'PAY-SKINCRYSTAL', types: [100401], reason: 'SkinCrystalTable 未导出：皮肤水晶商品配置无证据' },
  { card: 'PAY-REBATESHOPACT', types: [100701], reason: 'RebateShopActTable 与 pb_rebate_shop_act 已导出，但实际消费累计来源、is_global_cost 账本、Award.cost 匹配及 got_shop_award 持久化映射仍未闭合' },
  { card: 'PAY-DIVINEREALMACT', types: [101701], reason: 'DivineRealmActTable 未导出：神域礼包档位配置无证据' },
  { card: 'PAY-BONUSSHOP', types: [101903], reason: 'BonusShopTable 未导出：奖励商店商品与货币配置无证据' },
  { card: 'PAY-AUCTION', types: [102701, 102702, 102703, 102704, 102705], reason: 'AuctionTable 未导出：拍卖场次、底价、分红与流拍规则无证据' },
  { card: 'PAY-SKINRECHARGE', types: [103601], reason: 'SkinRechargeTable 未导出：皮肤充值角色/档位配置无证据' },
  { card: 'PAY-BUYSKINACT', types: [104001], reason: 'BuySkinActTable 与 pb_buy_skin_person 已导出，但 item_id 对应的免费条目、unlock_day/gift 条件、每次领取时间窗及无补领规则仍无运行契约' },
  // 104801 由 act-shop-service.mjs 读取当前 ActFrame 与 pb_act_shop_db_info；
  // 购买与多层等级领奖仍需证明 times/history_tid/claimed_tid_list 的写入事务。
  { card: 'PAY-ACTSHOP', types: [104802, 104803], reason: 'ActShopTable 已导出，104801 读路径由独立服务实现；104802 的购买计数/货币扣除与 104803 的多层奖励领取事务尚未由 Lua 和样本完整证明' },
  { card: 'PAY-PREMIUMACT', types: [105401], reason: 'PremiumActTable 已导出（100/104/108 版本有 Free 行），但免费档位的解锁条件 asserts 与领取规则未解码；当前白绫活动 1841010 的版本 1002 本身没有 Free 行' },
  { card: 'PAY-RECYCLEACT', types: [105901], reason: 'RecycleActTable 未导出：回收折算比例配置无证据' },
  { card: 'PAY-VICKREYAUCTIONACT', types: [106101, 106102], reason: 'VickreyAuctionActTable、db/net protobuf 与 Lua 已导出，但跨玩家密封出价集合、前五名隐私、第二价格成交、扣款退款和结算写回仍缺全服契约' },
  { card: 'PAY-GIFTBOXACT', types: [106301], reason: 'GiftBoxActTable 与 pb_gift_box_role_info 已导出，但 Box 购买、Gift 可领、base_recharge 门槛以及 box_bought_list/gift_get_list 的状态迁移仍未闭合' },
  { card: 'PAY-SUBSCRIPTIONACT', types: [107301, 107302, 107303], reason: 'SubscriptionActTable、db/net protobuf 与 Cmd 已导出；302 的请求 shape 已确认，但全服 round 名单、配额抽签、winner 公示、资源扣除和结算邮件仍缺服务端契约' },
  { card: 'PAY-NEWPERMITACT', types: [107401], reason: 'NewPermitActTable、pb_new_permit_role_info 与结算协议已导出，但 Tier.recharge/condition/add_value 的经验计算、pay_list 来源、奖励条件和结算邮件迁移仍未闭合' }
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

  function requestSchema(type) {
    return BENEFIT_PROTOBUF_REQUESTS[Number(type)] ?? null;
  }

  function execute(type, input, schema = requestSchema(type)) {
    if (Number(type) === BENEFIT_COMMANDS.PERMANENT_CARD_AWARD) return permanentCardAward(input);
    if (Number(type) === BENEFIT_COMMANDS.PRINCESS_AWARD_SUPPLEMENT) return princessAwardSupplement(input);
    const family = REFUSALS.get(Number(type));
    if (!family) throw new GameError(1, 'Unsupported benefit command');
    log({
      event: 'benefit_command_refused', type: Number(type), card: family.card,
      encoding: schema ? 'protobuf' : 'etf', schema, reason: family.reason,
      request: summarizeRequest(input)
    });
    throw new GameError(5, family.card + ': ' + family.reason);
  }

  return {
    supports: type => REFUSALS.has(Number(type)) || Object.values(BENEFIT_COMMANDS).includes(Number(type)),
    execute,
    requestSchema,
    refusals: REFUSALS,
    commands: BENEFIT_COMMANDS
  };
}

