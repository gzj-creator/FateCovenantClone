// R1 implementation decisions for documentation, not a game service.
// Original facts stay in the extracted tables and evidence reports.
import { clientDayBegin, clientDayZero, clientActFrameStage } from './documented-activity-time.mjs';

export const RULE_BASELINE = 'R1-20261115';
export const policies = [
  ['R1-SOURCE', '证据、版本与冲突', 'source', '原规则确证 / 复刻推定',
    '同版原表及实际消费者优先；本基线明确的推定次之。原值与推定分字段保存，实例、订单、局票据绑定规则指纹。新证据通过新版本生效，已提交结果不追改。'],
  ['R1-TIME', '时间与排期', 'time', '原规则确证 / 复刻推定',
    '默认UTC+8和05:00业务日；有原特殊时钟则从其规则。原world_time按绝对日期，历史复现只用单独回放轴。四项动态缺口按动态专项的显式R1实例，不猜461尾参或自动周期。'],
  ['R1-INSTANCE', '作用域与阶段', 'time', '工程契约 / 复刻推定',
    '按ActType.data_type而非时间枚举决定角色/服/跨服作用域；权威实例S/E及对应stage_time_list优先。空stage不自动视为进行期，动态专项中明确给出的推定50段须显式下发。跨服无外服时创建本服真实单服组并固定锚点，不伪造成员。'],
  ['R1-ACCESS', '开放、前驱与旧档', 'access', '原规则确证 / 明确受限',
    '可求值的原MethodScript按原表达式；不能求值的对应新增入口/变更按未满足处理，保留必要登录结构与已有合法权益。Guide按前驱和原奖励顺序，旧档不批量全开或清位。'],
  ['R1-RESOURCE', '对象、奖励与配置缺行', 'resources', '工程契约 / 明确受限',
    '先按原对象类型和版本解析奖励，不补数量、不借邻行、不把配置缺失当空奖成功。已产生的确定权益缺处理器则存唯一pending且不标到账；新的成本/产出必要行缺失时仅拒绝该变更，不扣费。'],
  ['R1-TASK', '任务和成就进度', 'resources', '工程契约 / 明确受限',
    '进度来自真实去重事件或权威状态，领奖不产进度。统计函数、前置或奖励映射缺失的具体档暂不可领；可证的独立档继续开放。位图、领取键和奖励同事务。'],
  ['R1-TRADE', '商品、限购与批量', 'trade', '原规则确证 / 工程契约',
    '原SKU/价格/币种/奖励/资格/限购同版绑定；钱包加款不计购买。零值按该type原消费者，不通用解释无限或禁售；仍无必要限购/付款依据的新增扣款拒绝。未证部分成功时整批原子提交，逐次更新阶梯价与计数。'],
  ['R1-RNG', '候选、权重与保底', 'random', '原规则确证 / 明确受限',
    '候选关系、权重层级、成本及必要保底规则齐全才新增抽取，逐抽更新并持久化结果。缺必要关系的具体消耗型抽取拒绝且不扣费；已有pending只领取一次，已证固定兑换/日奖继续执行。不得用均匀池、邻池、固定hash或展示概率补算法。'],
  ['R1-DEVELOP', '养成、返还与属性贡献', 'development', '原规则确证 / 明确受限',
    '成本、前驱、上限、目标对象和返还取本版本表及消费者；只允许链条完整的独立动作。没有成本/奖励或属性贡献的变更拒绝，不沿用随意固定片数/钻石/属性范围；已有对象读取与合法穿脱保留。'],
  ['R1-BATTLE', '固定敌阵与兼容战斗', 'battle', '原规则确证 / 复刻推定',
    '固定关取本关Fight→Team→Npc/Fighter/NpcAttr链。现有明确兼容战斗公式仅作为R1兼容，并锁定源码SHA256；不新增猜测倍率或把失败改胜。缺该模式必要敌阵/合法胜负校验则拒绝新挑战结算；未核对的兼容结果不进入正式竞技榜奖。'],
  ['R1-GAME', '局内玩法与结算', 'minigame', '工程契约 / 明确受限',
    '局票据、棋盘/种子和原移动规则由服务端固定；服务端操作轨迹决定分数和通关。无法验证某种局结果时拒绝该局结算，不信客户端score/finish；可独立证实的固定任务/日奖保留。重试不自行补门票。'],
  ['R1-SHARED', '多人、公会与共享实体', 'shared', '工程契约 / 明确受限',
    '真实成员共享同一Boss/矿/拍品/红包/赛场，角色次数另存；按职权和真实贡献判定。无匹配时保留真实空榜/单服组，原表明确的补偿单列。缺货源/成本/退款/结果依据的新增多人变更拒绝，不造对手或填满参与人数。'],
  ['R1-RANK', '排名、同分与冻结', 'ranking', '复刻推定 / 明确受限',
    '分值方向取原榜类型；未证同分规则时用本期首次精确达到当前分值的服务端已提交事件时间升序，再按数值role_id升序。再次到同值复用首次时间，重复事件不刷新；停更冻结同分键和榜快照。缺原名次奖表只展示真实名次，不发推测奖励。'],
  ['R1-ROLLOVER', '跨期、旧币与未领权益', 'rollover', '复刻推定',
    '原继承/回收/邮件消费者已证则从原规则。其余旧期货币保留账本且冻结，不能花入新期；已支付权益、已得pending与已达成固定未领奖保留旧期资格，不重抽、不猜汇率、不编自动邮件。未完成任务和未生成随机奖无补发资格。'],
  ['R1-COMPAT', '非经济兼容常量', 'compatibility', '复刻推定',
    '名称长度、列表分页和社交容量等非奖励/成本的既有本地常量暂按当前服务保留，绑定源码SHA256标兼容R1；不能把这条许可扩展到商品、概率、战斗敌阵或养成片数。新增未知通知只记偏好，不冒称外部消息已送达。'],
  ['R1-ATOMIC', '事务、防重和恢复', 'transactions', '工程契约',
    '资源、物件、统计、订单、领取位和可编码回包同事务；请求/票据/实例键防重。恢复只补遗漏步骤，停机不重置订单/领取；读操作不发奖，失败不返回空成功。新旧规则不在同一次交易混用。']
].map(([id, title, anchor, identity, action]) => ({ id, title, anchor, identity, action }));

export const domainPolicyIds = {
  '01': ['R1-ACCESS', 'R1-BATTLE', 'R1-SHARED', 'R1-RANK'],
  '02': ['R1-ACCESS', 'R1-DEVELOP', 'R1-RNG', 'R1-COMPAT'],
  '03': ['R1-ACCESS', 'R1-DEVELOP', 'R1-RNG'],
  '04': ['R1-RESOURCE', 'R1-TASK', 'R1-TRADE', 'R1-RNG'],
  '05': ['R1-ACCESS', 'R1-SHARED', 'R1-RANK', 'R1-COMPAT'],
  '06': ['R1-TIME', 'R1-INSTANCE', 'R1-RNG', 'R1-TASK', 'R1-TRADE'],
  '07': ['R1-TIME', 'R1-INSTANCE', 'R1-GAME', 'R1-TASK', 'R1-SHARED'],
  '08': ['R1-TIME', 'R1-INSTANCE', 'R1-TASK', 'R1-SHARED'],
  '09': ['R1-TIME', 'R1-INSTANCE', 'R1-TRADE', 'R1-TASK'],
  '10': ['R1-ACCESS', 'R1-BATTLE', 'R1-COMPAT']
};

export const domainDecisions = {
  '01': '原模式表和合法战斗票据决定挑战、次数与奖励；缺必要敌阵/星条件/赛程的分支不新增有奖结算。保留真实查询、已有合法结果及独立固定奖，真实参与者共享状态。',
  '02': '养成只执行本版本源对象、前驱、成本、目标及属性贡献完整的动作；合法穿脱/查询和既有对象保留，缺必要链的随机/消耗变更不扣费且拒绝。非经济界面常量按源码兼容R1。',
  '03': '装备和后期养成按本对象本版本成本、上限、词条与返还链；缺必要数据的具体培养/随机/分解动作不扣料不成功。禁止把当前固定片数、相邻tid和空返奖继续当原版规则。',
  '04': '真实资源类型、事件统计与原任务/商店行决定结果；没有必要奖励/前置/限购关系的具体领奖/购买明确拒绝。已有确定pending、原固定兑换和可证任务独立保留。',
  '05': '真实双方/成员、职权和同一共享实体决定社交公会操作；非经济容量按源码兼容R1。缺原货源、成本、赛程或奖励的分支不新增收费结算，不伪造对手和榜单。',
  '06': '候选、权重层级、保底/重置及成本完整才新增抽取；不完整的具体消耗抽取拒绝。独立任务、确定兑换和已得pending照原资格领取，期内状态按实例隔离。',
  '07': '服务端固定局票据/棋盘/状态并按合法操作计算成绩；缺合法成绩验证的局不发结果奖，不信客户端自报。原固定日奖/独立兑换及合法已得结果照常处理。',
  '08': '按原任务/签到/问卷/关系和真实事件判定资格，分活动实例保存日次与领取位；未知统计不补进度，不从领奖请求造完成。可证独立档继续开放。',
  '09': '原SKU、价格、内容、限购和支付成功订单决定权益及首累充；余额充值不计游戏购买。缺必要商品关系的具体扣款拒绝，已支付权益及确定日奖不丢失。',
  '10': '按原身份、Guide前驱和功能表达式开放；未知条件按未满足但保留登录结构。既有非经济显示/输入常量按源码兼容R1，不全开、不造新手奖、不提前赠角。'
};

export const taskOverrides = {
  'ROLE-UNKNOWN': '正式游戏会话拒绝type10 GM变更；运维操作只在独立管理身份授权和审计下执行，不能由普通客户端请求绕过资格或发资源。',
  'ROLE-FUNOPEN': '原条件已核220条、仍缺证303条；当前业务映射ready177/gap346是实现差异。955132601007固定为PassedSection>=30203，含1514在内44行已证。缺证只限制对应新增功能，不能删客户端必要模块。Fun1218等级>=32且服龄>=2并核模块161，错误旧位保留审计不自动清除。',
  'ROLE-REDDOT': '39001只保存已知红点/显示偏好，按认证角色分区；未知标记明确拒绝，不改变资源、功能位、任务或领奖资格。',
  'ROLE-ACTIVITY': '53001只能推进真实实例到时间决定的阶段；客户端不能指定跳阶段或变相续期。整体与阶段数据按R1-TIME/R1-INSTANCE，返回原结构。',
  'ROLE-ACTFRAME': '53002保留真实实例查询；53003—53006普通会话拒绝GM开期/跳段/清理。管理员变更仍不得取消已支付权益或绕过角色/商品资格。',
  'ITEM-GUIDE': 'Award1在10202通关后发1020601×1，Award2在20201通关后发2020601×1；校验前驱、原位图和防重，8000归属/8001中间完成标记照原契约。',
  'HERO-LINEUP': '普通编队校验自己拥有的英雄/格子、唯一loc/uid和Lineup.Type队数；多队不复制普通单队。格子4—6的原条件不可求值则不新解锁；名称/预设容量暂按现源码兼容R1。',
  'EQUIP-WARRUNE': '现有151002×1、2—7随机key/100—500随机value等本地算法不用于新增正式养成；原成本/词条行接通的独立动作才能执行。已存战纹查询与合法穿脱保留。',
  'EQUIP-PET': '禁止以petTid+1和star+2等兼容公式新增合成/培养；原每级/星成本、目标与能力贡献链完整的动作才开放，已有本体/引用读取和合法上阵保留。',
  'EQUIP-ELVES': '已有精灵、助战与皮肤归属保留；新升星/天赋/突破/变异必须有原成本前驱及属性贡献，tid+1/固定上限本身不授权扣料。',
  'EQUIP-ELVESBEAD': '原珠本体/精灵互引决定合法穿脱；固定珠tid和本地星级上限不用于新增养成或分解返还，缺原成本/返还的分支拒绝且不扣料。',
  'EQUIP-TREASURE': '禁用拼接碎片tid、star+1和固定10阶段作正式培养/抽取依据；已有秘宝/套装可读，原链完整的独立穿戴或领取保留，不发空奖成功。',
  'EQUIP-MUSEUM': '已存藏品保留；固定10人气、n×100档位和空奖不能用于新增消耗激活/领奖。按Museum原价值、目标和实际奖励接通后逐动作开放。',
  'DRAW-HUNDREDBONUS': '不使用拼接随机值%11产生有价结果；缺原分布/bonus映射的新随机与结算受限。只读真实已有日志和领取已冻结合法结果，日次数按原free_num/limit_num检查。',
  'DRAW-PYRAMID': 'Ceil.award给出候选但未证明各格概率、special推进与重置消费者，88941新消耗翻格受限；不以等概率无放回补原分布。真实已开格/层和已生成结果保留；88942仅凭真实事件及原Task固定奖领取。期末币无已证换算则冻结，不据trans_rate1000猜分母。',
  'DRAW-THREEADMONITION': '原Const的资格费与抽取道具分别保留，不由两字段就证明双扣与均匀索引。88965/88961新扣费入局抽取在双成本/索引分布必要关系未闭合时受限；已有合法索引和pending保留，88962仅凭已冻结finish_index与原箱奖一次领取。',
  'DRAW-CHESS': 'FixedAward原序、special是否提前结束与is_daily_reset继承链尚无原消费者；新91901及依赖未证轮终条件的91904受限，不按本地固定序生成新有价结果。原轮/已开格/已得结果保留，91906凭真实已完成轮和原turn_award一次领取；空Task/Exchange/ChooseAward分支拒绝，不清旧币。',
  'DRAW-PRAYACT': '五索引自选必须合法且保存；critical_ration分母、critical_val分布与is_direct/AwardRation关系未闭合，新的消耗祈愿受限，不自定10000分母或均匀区间。原已冻结进度和已达progress_val的确定自选奖按原权益一次交付。',
  'DRAW-TURNTABLEACT': 'min_num、weight、big_num原值保留；大奖触发前后/重置关系未闭合时不把big_num49直接公告第50抽保证。新的受该必要保底影响的消耗抽取受限，原已提交抽数/已得奖和独立固定任务保留，不另造保底奖或循环。',
  'DRAW-HUNDREDDRAWACT': '按本版本Pool保留probability_num、weight及guarantee_total_draw_times原值，不自行选择字段优先级或本体保底触发算法。必要分布/保底未闭合的新抽取受限；原已生成pending、已证固定任务及原商品完整的独立购买不随整族关闭。',
  'DRAW-LOTTERY': '3901无合法候选时不新消耗彩票也不开奖；过期旧券保留旧期账本并冻结，缺原兑换公式不清券、不折钻。',
  'DRAW-TICKETDRAW': '没有真实持券参与和冻结开奖结果时不发名次奖；只展示真实历史，原settle_time不自行解释为每日固定开奖钟点。',
  'PLAY-CARNIVAL': '保存真实位置、建筑、已开事件与未领成果；原骰子分布/事件消费者未闭合的新掷骰和有奖事件结算受限，不以1—6均匀或本地测试地图补算法。原init/刷新/封顶/购买字段保存，独立原成本结果完整的建筑动作及真实固定任务保留。',
  'PLAY-MONOPOLYACT': '保存真实局与个人/公会贡献；普通/高级骰缺原分布/选择消费者时不新扣骰有奖步进，不推1—6均匀。合法已冻结战斗/事件成果可结一次；107806补给及缺共享账本的援助拒绝，公会榜由成员真实事件生成。',
  'PAY-DIAMONDBANKACT': '原Ver/任务/余额和已提交存款账本保留。rage/recharge_rage分母、存款币与结算币转换必要关系未闭合时，138001及新增开户/存款/利息结算对应扣费分支受限；不从rage10000猜每日100%收益或1:1入账，已有确定支付权益保留，旧币冻结。',
  'PAY-SLOTGAMEACT': '已生成合法pending原奖按110802一次领取；不挑战分支只领该已冻结原奖。新110801消耗、挑战倍率的multiplier分母/阈值/分布必要关系未闭合时受限，不自定扣1券、/100或draw_num阈值算法；原完整且已证的独立档照常处理。',
  'PAY-HUNDREDACC': '保留原Group.amount/get_day_index/split_stamp及两套原奖。真实已支付订单单列分金额，但amount100与分/元的映射未证，新的充值达标领奖分支受限，不推100分或100元。已冻结且合法的旧期资格只交付当时选定一支奖励一次，不相加或跨split_stamp重复领。',
  'PAY-ACCRECHARGEACT': '真实本期订单按原付款币种计账，acc_cnt与acc_cnt_new原值保留。variant及分/元阈值映射已证的档逐项执行；未证具体档的新增达标领奖受限，不把5000和50直接换算后收费达标发奖。后台加款不计，退款不复活已领位，原确定权益跨E保留。',
  'PAY-CROSS': '广告完成、功能免费、真实支付资格分账；CrossTable本轮已取得的是跨服分组/神域表，不能当广告/功能礼包的价奖配置。92601—3缺其实际档位/来源/价奖关系的变更受限，真实已有状态可读，不再声称所有CrossTable资产缺失。',
  'PAY-BUYSKINACT': '175001按动态专项继承父174001整体窗口；五商品按子50起点第1/3/17/31/45日解锁。免费日奖独立于购买且按05:00日一次；不因晚创角重开整期。',
  'ACT-CHRISTMASACT': '正式实例及divide_sec/available_sec保留原绝对日期，不因新服开服平移；历史回放只在声明的统一回放轴整体映射。日道具05:00各一次、装扮累计期内保留，心愿选择不发奖。缺分布的愿望随机变更受限；旧装扮道具按R1-ROLLOVER冻结，不从appearance推转换奖。',
  'ACT-SPRINGFESTIVALACT': '装扮、日道具、商店资格分账；正式实例、Period.divide_sec及关联Collect绝对日期保持原值。仅显式历史回放才统一映射所有关联字段。ShopAward须真实购买/消费；convert_param单位未证的自动兑换受限，旧币按R1-ROLLOVER冻结，不猜10:1或1000:1。',
  'ACT-SUMMERACT': '父174001按原阶段时钟；水枪/灵珠用本版init/next_tid逐档扣费，任务消费真实事件，175001子皮肤按R1-DYN-175001。缺权威养成/迁移/结算的具体分支受限；clean_item无已证转换消费者时旧币冻结，不销毁旧币或永久皮肤。',
  'ACT-COLLECTEXCHANGEACT': '本version各sub材料合并全额扣除后发add，正limit按每角色每实例上限。limit=0的原含义未证，则该行新增兑换受限，不能擅改为无限或至少1次；正上限且成本/奖励完整的行继续。跨期素材保留旧期冻结账本，真实玩法事件才生产掉落。',
  'PLAY-DREAMTRIALACT': '1037001/v10与1037002/v11按显式R1首期和同type互斥切代；50段结束后不新开战/抢夺，90只公示。局内日窗R1推定为UTC+8 07:00—17:00，日恢复05:00分别按原3次、冷却7200秒；真实伤害/抢夺和共享榜由合法票据/共同账本产生，缺生产链的收益结算受限。',
  'PAY-DRAGONLANDACT': '1036008按R1跨服组主服day79 05:00首期至day93 04:50，显式50段且不隐式循环。本族日奖R1明确保留现dayZero对应UTC+8 00:00（非原日界已证）；Boss按真实伤害、75/50/25/0剩余百分比档，重复幂等。缺本Boss战斗生产链的奖档拒绝，不向下一Boss溢伤，公会只聚合真实成员。'
};

// Evidence-debt sentences remain facts about missing evidence. These mappings
// fix implementation behaviour without changing those facts.
export function policiesForText(text, domain) {
  const result = new Set(['R1-SOURCE', 'R1-ATOMIC', 'R1-RESOURCE', 'R1-ROLLOVER', ...(domainPolicyIds[domain] ?? [])]);
  for (const [pattern, ids] of [
    [/时间|日界|刷新|排期|阶段|跨日|周期|实例|duration|time_fun|DayZero|world_time/i, ['R1-TIME', 'R1-INSTANCE']],
    [/跨期|继承|回收|清币|未领|邮件|过期|结算/, ['R1-ROLLOVER']],
    [/随机|概率|保底|权重|候选|奖池|抽取|翻牌|洗炼|重铸/, ['R1-RNG']],
    [/付费|支付|SKU|商品|价格|限购|充值|批量|购买|扣费/i, ['R1-TRADE']],
    [/任务|成就|统计|进度|事件|累计|位图/, ['R1-TASK']],
    [/养成|升级|突破|升星|合成|分解|返还|穿戴|词条|属性贡献/, ['R1-DEVELOP']],
    [/敌阵|战斗|伤害|被动|技能|战力|胜负|Fight|Npc/i, ['R1-BATTLE']],
    [/棋盘|局内|步数|碰撞|移动|客户端.*(?:得分|成绩|分数)|小游戏/, ['R1-GAME']],
    [/跨服|公会|全服|共享|拍卖|多人|对手|匹配/, ['R1-SHARED']],
    [/排行|排名|并列|同分|冻结/, ['R1-RANK']],
    [/门槛|资格|解锁|开放|前驱|引导|MethodScript|FunOpen/i, ['R1-ACCESS']],
    [/名称|字数|分页|容量|聊天|通知|屏蔽|举报/, ['R1-COMPAT']]
  ]) if (pattern.test(text)) ids.forEach(id => result.add(id));
  return [...result];
}

export const dynamicSpecifications = [
  { actId: 175001, decisionId: 'R1-DYN-175001', originalFact: 'CREATE_TIME枚举值0，但ActType175.data_type=1为服务器作用域；空stage、duration_day=0没有自身可用窗口。SummerActTable关联175001，原跳转2082硬传此ID。',
    decision: '继承174001父实例整体S/E，显式下发50段覆盖同一窗口；解锁日以子50段S起算。正式绝对日期已过则不开放，晚创角不重开也不补已过日奖。',
    identity: '复刻推定', scope: 'server', parentActId: 174001, automaticRecurrence: false },
  { actId: 1036008, decisionId: 'R1-DYN-1036008', originalFact: 'FUNC_TIME=5；461,[79,1,0]；14天、04:50结束；type1046为cross_type9。原客户端只读服务端实例，未找到461原计算函数。',
    decision: 'R1显式首期取跨服组主服第79业务日05:00，整体至第93日04:50，显式50段；仅登记这一期，不从duration或尾参推导自动复发。',
    identity: '复刻推定', scope: 'cross-group', minimumOpeningDay: 79, automaticRecurrence: false },
  { actId: 1037001, decisionId: 'R1-DYN-1037001', originalFact: '461,[29,1,0]；version10；50/90段为3/1天，结束22:00/05:00。assert确证为DynamicArg462<=90，但462没有已取到的getter。',
    decision: 'R1显式首期取跨服组主服第29业务日05:00；进行至第32日22:00，公示至第33日05:00。462推定按同一主服服龄；仅新建期在day<=90时合格，旧期按冻结窗口收尾。',
    identity: '复刻推定', scope: 'cross-group', minimumOpeningDay: 29, maximumNewInstanceOpeningDay: 90, automaticRecurrence: false },
  { actId: 1037002, decisionId: 'R1-DYN-1037002', originalFact: '461,[90,1,0]；version11；50/90段同前，无1037001的assert。',
    decision: 'R1显式首期取跨服组主服第90业务日05:00；进行至第93日22:00，公示至第94日05:00。day90新建期选择v11；若同type旧期未结束，推迟到旧期结束后的首个05:00，不重置旧期。',
    identity: '复刻推定', scope: 'cross-group', minimumOpeningDay: 90, automaticRecurrence: false }
];

// The R1 calendar is deliberately an explicit finite instance list. These
// dates are decisions, not a recovered implementation of server function 461.
export function projectDynamicDecisions(rows, openedAt, options = {}) {
  const source = new Map(rows.filter(v => v.sourceTable === 'ActFrameTable').map(v => [Number(v.row.tid), v]));
  const groupOpenedAt = options.groupMasterOpenedAt ?? openedAt;
  if (![openedAt, groupOpenedAt].every(Number.isSafeInteger)) throw new Error('Invalid opening timestamp');
  if (options.groupMasterOpenedAt != null && options.groupId == null) throw new Error('A provided group needs its real group identity');
  const realmId = String(options.realmId ?? 'example-realm-3');
  const groupId = String(options.groupId ?? `singleton:${realmId}`);
  if (!realmId || !groupId) throw new Error('An explicit realm/group identity is required');
  const dayOne = clientDayBegin(groupOpenedAt);
  const perDay = 86400;
  return dynamicSpecifications.map(spec => {
    const entry = source.get(spec.actId);
    if (!entry) throw new Error('Missing dynamic decision source row: ' + spec.actId);
    const r = entry.row;
    let start, end, stages, basis, qualification;
    if (spec.parentActId) {
      const parent = source.get(spec.parentActId)?.row;
      if (!parent || !(parent.world_time > 0)) throw new Error('Summer parent absolute start missing');
      start = Number(parent.world_time);
      end = clientDayZero(start + Number(parent.duration_day) * perDay) + Number(parent.end_time);
      basis = 'r1-inferred-parent-init-window-original-absolute-clock';
      stages = [{ stageId: 50, start, end, source: 'r1-explicit-server-stage-override' }];
      qualification = 'Fun1514原断言：PassedSection>=30203；角色拥有皮肤/商品限购另行检查。';
    } else {
      start = dayOne + (spec.minimumOpeningDay - 1) * perDay;
      end = clientDayZero(start + Number(r.duration_day) * perDay) + Number(r.end_time);
      basis = 'r1-explicit-first-instance-using-inferred-master-server-opening-day';
      stages = r.stage.length ? r.stage.map(stageId => clientActFrameStage(r, { start_time: start }, stageId))
        : [{ stageId: 50, start, end, source: 'r1-explicit-server-stage-override' }];
      qualification = '实例绑定真实cross-group/master opening；功能门槛与个人参与条件照原规则。';
    }
    return { ...spec, sourceTable: entry.sourceTable, version: r.version,
      rawTimeFields: Object.fromEntries(['time_type', 'time_fun', 'time_fun_args', 'world_time', 'refer_day', 'duration_day', 'end_time', 'stage', 'stage_duration_day', 'stage_end_time', 'asserts']
        .filter(k => Object.hasOwn(r, k)).map(k => [k, r[k]])),
      rawType: entry.type, remainingFunctionArgumentsInterpretation: spec.actId === 175001 ? 'not-applicable' : 'opaque-do-not-infer-weekday-or-cycle',
      originalServerFunctionRecovered: false, authoritativeOriginalInstanceObserved: false,
      exampleInput: { localOpenedAt: openedAt, groupMasterOpenedAt: groupOpenedAt, realmId, groupId,
        groupKind: options.groupMasterOpenedAt == null ? 'r1-local-singleton-example' : 'provided-real-group' },
      decidedFirstInstance: { start, end, basis, stages, occurrenceId: `${spec.decisionId}/first`,
        scopeId: spec.scope === 'server' ? realmId : groupId,
        instanceKey: `${RULE_BASELINE}/${spec.scope}/${encodeURIComponent(spec.scope === 'server' ? realmId : groupId)}/${spec.actId}/${r.version}/first/${start}` },
      qualification, evidenceStatus: 'original-fields-and-client-consumer-confirmed; scheduler-decision-is-inferred' };
  });
}

// Deliberately separate from time.serverDay's special opening-midnight case.
// A new instance also requires now >= masterOpenedAt; this is an age index,
// not permission to start before the actual server has opened.
export function r1GroupOpeningDay(now, masterOpenedAt) {
  if (![now, masterOpenedAt].every(Number.isSafeInteger)) throw new Error('Invalid group-age timestamp');
  return Math.floor((clientDayBegin(now) - clientDayBegin(masterOpenedAt)) / 86400) + 1;
}

export function firstNonOverlappingDreamStart(candidateStart, previousInstanceEnd) {
  if (!Number.isSafeInteger(candidateStart) || !Number.isSafeInteger(previousInstanceEnd)) throw new Error('Invalid instance boundary');
  const lower = Math.max(candidateStart, previousInstanceEnd);
  const begin = clientDayBegin(lower);
  return begin < lower ? begin + 86400 : begin;
}

// This documents newly proved semantics without changing the runtime feature
// mapping. Other assertions and dynamic show/switch gaps remain intact.
export function projectDocumentedFeatureRules(features) {
  const proved = { scriptId: 955132601007,
    condition: { type: 'passed_section_tid', operator: '>=', args: { sectionTid: 30203 } },
    evidence: 'MethodScript p194, Method3 EGreaterThan, DynamicArg2 MissionMgr.GetPassedSection; original bytecode, not an inferred role level' };
  const assertions = new Map(features.assertions.map(entry => [Number(entry.scriptId), entry]));
  assertions.set(proved.scriptId, { ...proved, status: 'ready' });
  const rows = features.rules.map(current => {
    const remainingGaps = (current.evidenceGap ?? []).filter(gap => Number(gap.scriptId) !== proved.scriptId);
    const conditions = (current.asserts ?? []).map(scriptId => assertions.get(Number(scriptId))?.condition);
    const complete = Array.isArray(current.asserts) && current.asserts.length > 0 && !remainingGaps.length && conditions.every(Boolean);
    return { funId: current.funId, currentRuntimeRule: current,
      documentedStatus: complete ? 'conditions-proved' : 'remaining-evidence-gap',
      documentedConditions: conditions.filter(Boolean), remainingGaps,
      newlyProvedScripts: (current.asserts ?? []).includes(proved.scriptId) ? [proved.scriptId] : [],
      executionDecision: complete ? 'Evaluate all documented conditions and original switches; proof does not mean unlocked.'
        : 'The corresponding new mutation requires the unresolved condition and is denied as unmet; keep initialization structure and existing lawful rights.' };
  });
  return { schemaVersion: 1, baseline: RULE_BASELINE, provedAssertions: [proved],
    currentRuntimeSummary: features.summary,
    documentedSummary: { rules: rows.length, conditionsProved: rows.filter(row => row.documentedStatus === 'conditions-proved').length,
      remainingGap: rows.filter(row => row.documentedStatus !== 'conditions-proved').length,
      newlyProvedRows: rows.filter(row => row.newlyProvedScripts.length).length }, rows };
}
