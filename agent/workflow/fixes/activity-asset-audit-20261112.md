# 活动资产、未实现入口与实现偏差审计

更新时间：2026-11-12（Asia/Shanghai）。本审计基于分支 `fix/up-star-gift-20261111` 和本地 APK 交付资产，
不以 `FateCovenantClone-main/` 导出副本为基线，也没有修改运行数据库、实时服务、ADB、客户端或 APK。

## 基线

开工时已执行并核对：

```text
git worktree list
git status --short
git log --oneline --decorate -15
git fetch origin
git log --oneline --decorate origin/main -10
```

- worktree：`.worktree/up-star-gift-20261111`。
- 分支：`fix/up-star-gift-20261111`。
- 初始 HEAD：`b044a0d`，已包含 `95112fb`、`3a1518f` 的合并历史。
- fetch 后 `origin/main` 仍为 `3a1518f`，不存在需要只读核对或合并的新提交。
- 交付校验：559 个文件、219 TextAssets、27 UI bundles、18 tables、67 required checks，`failures=[]`。

用户要求的 `agent/workflow/fixes/activity-ui-diagnosis-20261111.md` 在当前 worktree 中不存在。
同一文件存在于 `.worktree/main-activity-ticket-20261111/agent/workflow/fixes/`，本轮已只读阅读；其中的
`105702` 无条件 code 5 根因已在当前代码改为模块 21 槽 29 维度 2 的真实零值/聚合读取，不能把旧诊断继续当当前故障。

## 本分支已修复

| 入口 | 修复 | 证据 | 仍缺 |
| --- | --- | --- | --- |
| 独立限时升星 31052/31053 | 登录版本块修复、当前版本选择、免费任务按真实英雄/魔灵/精灵星级领奖、同事务发奖与领取位写回 | APK UpStarGiftTable/Lua/protobuf + 临时 TCP；无真实命令日志 | 当前开放 40/49/52/56/111 全部为充值礼包，无免费行；充值购买仍走 RechargeMgr；未做用户视觉验收 |
| ActShop 104801 | 按 ActFrame 与 ActShopTable 返回开放商店，ETF/protobuf 玩家状态可创建和保留 | APK ActShopTable/Mgr/protobuf + 临时 TCP；无真实命令日志 | 104802 购买和 104803 多层领奖仍未闭合 |

详细记录：[up-star-gift-20261111.md](up-star-gift-20261111.md)、[act-shop-20261112.md](act-shop-20261112.md)。

## 当前正式排期的活动入口快照

基准时间 2026-11-11 18:29 UTC；目标服开服 2026-11-11 00:00 +08:00；参考服开服 2026-10-01 00:00 +08:00。
以下为静态排期结果，不是线上请求证实。

| 家族 | 当前开放 ActFrame/Activity |
| --- | --- |
| LinkGift | type 93：93053、93054、93059、93064、93071 |
| AppearanceRelease | type 103：103022、103023 |
| BuySkin | type 175：175003、175005、175007 |
| Vickrey | type 1008：1008004、1008005、1018014 |
| GiftBox | type 1013：1013004、1013007、1013008 |
| Subscription | type 1014：1015005、1015006 |
| NewPermit | type 1016：1016004、1016005、1019314、1016319 |
| Permit | type 62：188045、188055；35001/35002/35005 已有真实路径 |
| PremiumAct | type 184 共 16 行：184005、1007002、184304、184305、184011、184501、184016、185018、186314、184703、184320、184205、186420、186421、186513、1841008 |
| RebateShop | 旧 Activity func 138：138004 |
| ActShop | 182007、182010、187314、182503、182604、182212、182608、182817 |
| LevelSprint | 67001 的 `discard_time=1753909200` 已早于基准时间，因此当前不进入正式排期；旧文档把它列为开放项是错误 |

`/data/disk1/game/data/events.jsonl` 共 1,169 行，当前 43 个拒绝家族的 83 个命令 type 均未出现。
因此下表中没有“线上证实”的拒绝家族；线上实际触发仍待用户操作或后续日志。静态确认只能证明路由、表/协议/脚本、
当前拒绝原因，不能证明这 83 个命令今天一定被客户端调用。

## REFUSAL_FAMILIES 全量矩阵

“当前行为”均会返回 code 5 和具体家族原因；`87301` 永久卡每日奖励、`84602` 公主体力补领已有真实结算，不在拒绝矩阵内。

| 家族 / type | 当前入口 | 可用静态资产 | 准确缺口与当前边界 | 证据等级 |
| --- | --- | --- | --- | --- |
| `PAY-TRIGGERGIFT` 18001-18002 | 未见可静态绑定的当前 ActFrame | `trigger_gift.db/net` protobuf | 缺 TriggerGiftTable、触发条件/次数、玩家 trigger 记录与奖励；拒绝 | 静态确认路由，入口待验证 |
| `PAY-VIP` 33001-33002、76301 | 非普通活动窗口；无可靠绑定 | `vip.db/net` protobuf | 缺 VipTable、VIP 礼包/加成档位、经验兑换和领取记录；拒绝 | 静态确认 |
| `PAY-PERMIT` 35003-35004、35006-35011 | type 62：188045、188055 | PermitTable、permit protobuf、完整 Permit Lua | 35003 买级、35004 换期、35006-35009 福利/手动结算、35010/35011 选奖/换期的购买、递进与回滚语义未闭合；拒绝 | 静态确认 |
| `PAY-FUNDACT` 51001 | 未建立活动映射 | fund_act protobuf | 缺 FundActTable、等级奖励与领取位；拒绝 | 静态确认 |
| `PAY-NOTIFYGIFT` 76201 | 平台推送，非 ActFrame | notify_gift protobuf | 本服无 GMC 商品/推送源、接收位与时效配置；拒绝 | 静态确认 |
| `PAY-REDENVELOPE` 77001-77003 | 未建立活动映射 | `pb_red_envelope`/`pb_red_envelopes` protobuf | 缺 RedEnvelopeTable、红包池/掉落、发送者维度、领取记录；旧“schema 完全缺失”文案已纠正；拒绝 | 静态确认 |
| `PAY-VIPGIFT` 77101 | 平台推送 | vip_gift db/net、登录模块结构 | 缺 VipGiftTable/GMC 下发、`received_gift` 位图写入与有效期；拒绝 | 待验证 |
| `PAY-FASHION` 82602-82604 | 系统入口；非活动 ID | FashionTable、模块 110 的 `pb_fashion_data`、fashion protobuf | FashionCmd/Mgr/Data Lua 与运行样本未交付；激活/穿戴/升级参数、消耗、错误码和原子写回未闭合；旧“FashionTable 未导出”已纠正；拒绝 | 静态确认 |
| `PAY-VIPCITY` 82701 | 未建立活动映射 | vip_city protobuf | 缺 VipCityTable、建筑状态与重建消耗契约；拒绝 | 静态确认 |
| `PAY-RECOVERY` 87401 | 未建立活动映射 | recovery db/net | 缺 RecoveryTable、可追回资源、免费额度与领取日期；拒绝 | 静态确认 |
| `PAY-PRINCESS` 84603 | PrincessTable 当前系统配置 | PrincessTable、princess protobuf、已有 84601/84602 | 跨期刷新后的能量来源、周期边界和补领历史未闭合；84603 拒绝 | 静态确认 |
| `PAY-WEEKENDBONUS` 87501-87502 | 未建立 ActFrame 绑定 | WeekendBonusTable、weekend_bonus protobuf、模块 145 | 请求 tid→WeekendBonus/Func.skip_func 映射、today/total play_count 权威来源、`reward_bin` 写回未闭合；拒绝 | 待验证 |
| `PAY-LEVELSPRINT` 88101 | 67001 已废弃，当前无开放入口 | LevelSprintTable、pb_level_sprint | 升级/等级来源、免费档领取编码、领取位与重复错误未闭合；拒绝 | 静态确认（入口关闭） |
| `PAY-HEATGIFT` 88601-88602 | 未建立活动映射 | heat_gift db/net | 缺 HeatGiftTable、全服应援值聚合、限购与全服礼包；拒绝 | 待验证 |
| `PAY-FLASHSALE` 88701-88702 | 未建立独立 ActFrame 绑定 | ActivityTable 内 FlashSaleTaskGroup=3/Task=30/Version=2/Const=2/Gift=2，flash_sale protobuf | 任务版本选择、2301/1201/1115 进度来源、砍价公式、gift_hero 与玩家领取位未闭合；拒绝 | 待验证 |
| `PAY-ASSISTANT` 88901-88903 | 非普通活动窗口 | assistant db/net | 缺 AssistantTable、功能项、执行命令与设置记录；拒绝 | 静态确认 |
| `PAY-PREBOOK` 92401-92402 | 未建立活动映射 | prebook db/net | 缺 PrebookTable、预约任务/分享奖励及领取位；拒绝 | 静态确认 |
| `PAY-ROLESHARE` 92501 | 未建立活动映射 | role_share db | 缺 RoleShareTable、分享行为证据和发奖记录；拒绝 | 静态确认 |
| `PAY-CROSS` 92601-92603 | 未建立活动映射 | cross db/net | 缺 CrossTable、广告/功能奖励条件及领取状态；拒绝 | 静态确认 |
| `PAY-REDRAIN` 92901-92903 | 未建立活动映射 | red_rain db/net | 缺 RedRainTable、轮次、权重、保底与领取记录；拒绝 | 静态确认 |
| `PAY-DIAMONDFUND` 93201-93202 | 未建立 ActFrame 绑定 | DiamondFundTable、diamond_fund protobuf | Type/SteadyFundAward/FortuneFundAward 已可解，但购买周期、day_award 选择、minimum_count、day_award_history 未闭合；拒绝 | 待验证 |
| `PAY-WEEKHUNT` 93401-93403 | Week Hunt 作为限时礼包上下文，当前有别的购买服务路径 | WeekHunt bytecode table、week_hunt protobuf | task_id 权威进度、common_progress/week_common_task 位图、93403 免费/升级礼包迁移未闭合；拒绝 | 待验证 |
| `PAY-LINKGIFT` 97401 | type 93 的 5 个开放活动 | LinkGiftTable、db proto、完整 LinkGift Lua | `custom_list` 的 normal_tid/choose_gift 选择约束、版本作用域、写回顺序与非法自选错误未闭合；拒绝 | 静态确认 |
| `PAY-VIPLINK` 98001 | 未建立活动映射 | vip_link db/net | 缺 VipLinkTable、展示关系和解锁条件；拒绝 | 待验证 |
| `PAY-GEMREBATEACT` 98630 | 未建立活动映射 | gem_rebate_act db/net | 缺 GemRebateActTable、投入档位、返利比例和领取记录；拒绝 | 静态确认 |
| `PAY-APPEARANCERELEASEACT` 98800 | type 103：103022、103023 | AppearanceReleaseActTable、db/net、完整 AppearanceRelease Lua | `interact_state` 位/计数编码、NPC idx 对应、每日上限、奖励领取持久化未闭合；拒绝 | 静态确认 |
| `PAY-CAKEACTIVITY` 99000-99002 | ActivityTable 仅有 PlayCake 部分配置；当前无稳定绑定 | cake_activity db/net（播放蛋糕片段）、ActivityTable PlayCake* | 缺 CakeActivityTable 或等价完整每日/充值托盘奖励；托盘选择与领取位未闭合；拒绝 | 待验证 |
| `PAY-QUADRUPLECROSS` 99500-99502 | 未建立活动映射 | quadruple_cross.db | 缺 QuadrupleCrossTable、跨期随机池、免费/付费档和领取位；拒绝 | 静态确认 |
| `PAY-FINANCEMANAGEACT` 99901-99902 | 未建立活动映射 | finance_manage_act db/net | 缺 FinanceManageActTable、产品/返利比例、选择与返利记录；拒绝 | 静态确认 |
| `PAY-SKINCRYSTAL` 100401 | 未建立活动映射 | skin 相关 protobuf | 缺 SkinCrystalTable、商品/货币/限购与持有记录；拒绝 | 静态确认 |
| `PAY-REBATESHOPACT` 100701 | 旧 Activity func 138：138004 | RebateShopActTable、db proto、完整 RebateShop Lua | 实际消费累计来源、`is_global_cost` 账本、Award.cost 匹配和 got_shop_award 持久化未闭合；拒绝 | 静态确认 |
| `PAY-DIVINEREALMACT` 101701 | 未建立活动映射 | divine_realm_act db/net | 缺 DivineRealmActTable、礼包档位/资格与领取状态；拒绝 | 静态确认 |
| `PAY-BONUSSHOP` 101903 | 未建立活动映射 | bonus_shop db/net | 缺 BonusShopTable、商品、货币、限购和领取位；拒绝 | 静态确认 |
| `PAY-AUCTION` 102701-102705 | 未建立活动映射 | auction db/net | 缺 AuctionTable 与全服场次、底价、出价、分红和流拍状态；拒绝 | 静态确认 |
| `PAY-SKINRECHARGE` 103601 | 未建立活动映射 | skin_recharge db/net | 缺 SkinRechargeTable、角色/档位、皮肤发放与领取记录；拒绝 | 静态确认 |
| `PAY-BUYSKINACT` 104001 | type 175：175003、175005、175007 | BuySkinActTable、BuySkin Lua、buy_skin protobuf | `item_id` 的免费条目、unlock_day/gift 条件、领取时间窗和无补领规则未闭合；拒绝 | 静态确认 |
| `PAY-ACTSHOP` 104802-104803 | 104801 已由独立服务处理；相同 8 个商店行开放 | ActShopTable/Mgr、db/net、完整 ActShop Lua | 104802 的购买计数/货币扣除与 104803 的多层 history/claimed 状态迁移未闭合；拒绝 | 静态确认 |
| `PAY-PREMIUMACT` 105401 | type 184 的 16 个开放行 | PremiumActTable、Premium Lua、premium protobuf | Free.asserts 条件、免费档领取规则和当前 1002 版本无 Free 行的行为未闭合；拒绝 | 静态确认 |
| `PAY-RECYCLEACT` 105901 | 未建立活动映射 | recycle_act db/net | 缺 RecycleActTable、折算比例、数量上限和回收流水；拒绝 | 静态确认 |
| `PAY-VICKREYAUCTIONACT` 106101-106102 | type 1008：1008004、1008005、1018014 | VickreyAuctionActTable、db/net、完整 Vickrey Lua | 跨玩家密封出价集合、前五隐私、第二价格成交、扣款退款与结算写回未闭合；106101 读取也依赖未实现的全服场次；拒绝 | 静态确认 |
| `PAY-GIFTBOXACT` 106301 | type 1013：1013004、1013007、1013008 | GiftBoxActTable、db/net、GiftBox Lua | Box 购买、Gift 可领、base_recharge 门槛与 box_bought_list/gift_get_list 状态迁移未闭合；拒绝 | 静态确认 |
| `PAY-SUBSCRIPTIONACT` 107301-107303 | type 1014：1015005、1015006 | SubscriptionActTable、db/net、完整 Subscription Lua | 全服 round 名单、配额抽签、winner 公示、资源扣除和结算邮件未闭合；拒绝 | 静态确认 |
| `PAY-NEWPERMITACT` 107401 | type 1016：1016004、1016005、1019314、1016319 | NewPermitActTable、db/net、完整 NewPermit Lua | Tier.recharge/condition/add_value 经验计算、pay_list 来源、奖励条件和结算邮件迁移未闭合；拒绝 | 静态确认 |

## 正常读取请求仍被拒绝或空白的检查

| type / 命令 | 当前判断 |
| --- | --- |
| 82602 `req_fashion_act` | 请求名和通用资源响应显示它是客户端交互入口；FashionTable/模块 110/protobuf 已在仓内，但缺本轮 Cmd/Mgr/Data Lua，暂不能证明是纯读取或安全重放。文案已改成精确缺口，非“表缺失”。 |
| 77002/77003 红包信息 | 读取语义明确，但缺 RedEnvelopeTable、红包实例和玩家领取记录，必须拒绝。 |
| 88602 HeatGift server_info | 读取语义明确，但缺 HeatGiftTable 和全服聚合，不能用固定零值/空列表消除错误。 |
| 98001 VIP link show | 读取语义明确，但缺 VipLinkTable 与解锁关系。 |
| 102705 auction detail | 读取语义明确，但缺 AuctionTable 和全服拍卖状态。 |
| 106101 Vickrey info | 表/协议/Lua 已有，但 first five、轮次、玩家出价和结算状态没有权威服务端模型；暂拒绝。 |
| 93401 Week Hunt common task | 名称接近读取，但 task_id 进度来源与位图编码未证明；暂拒绝。 |
| 104801 ActShop info | 已修复并返回真实开放商店/空关闭态。 |

`105702` task activity server vitality 是另一条已经修复的读取链路；历史诊断里的“无条件 code 5”不再对应当前代码。

## 实现偏差与待验证项

- `LevelSprintTable/RebateShopActTable` 已在交付资产中；旧文档的“表未导出”不正确。LevelSprint 67001 已过期，
  RebateShop 138004 仍在窗口内，但两条命令的状态机仍未实现。
- `PAY-LINKGIFT` 旧文档曾说只有 db proto、没有 net；本轮核对到 `link_gift.db.proto.bin`，接口目录也确认 97401 是 ETF。
  当前阻断是自选状态机，不是网络协议缺失。
- `PAY-REDENVELOPE` 并非 protobuf 完全缺失；缺的是配置表、红包实例和持久化。
- `PAY-FASHION` 并非 FashionTable 缺失；缺客户端 Cmd/Mgr/Data Lua 和运行样本。
- `PAY-PREMIUMACT`、`PAY-PERMIT` 的旧“表/协议缺失”文案已在上一轮修正。
- `time_fun=461` 仍只有 1036008、1037001、1037002，参数 `[79,1,0]`、`[29,1,0]`、`[90,1,0]`。
  ActivityTimeUtil 没有使用该字段的直接证据，本轮未实现，也未猜三元组。
- 百抽精灵 `1102008/theme104` 属于另一 agent 范围。审计只记录其存在独立缺口，本分支没有改动内部升星逻辑。
- `ActShopCmd/Data/Mgr` 字节码虽已交付，但 104802/104803 的完整控制流尚未恢复到能证明账本顺序；
  缺的是具体状态迁移，不是能否读取表。
- 所有拒绝家族都缺当前客户端真实请求样本。上线前仍应在部署后按用户实际入口收集 `benefit_command_refused` 的
  card/schema/请求字段，再按实际触发优先级继续实现。

## 验收边界

- 本轮定向套件 61/61 通过；最终全量 `npm test` 为 2891 项、pass 2889、fail 0、skipped 2，两项跳过均因
  未设置 `FC_RECHARGE_CLIENT_BUNDLE`；日志 `analysis/test-runs/up-star-gift-20261112/full-final.log`。
  不以历史 2857 项基线代替最新结果。
- 没有部署、重启、发布、合并 main、写运行数据库、操作 ADB/客户端/APK 或做用户视觉验收。
- 本分支新增的表 gzip 只有 UpStarGiftTable 与 ActShopTable；其余交付表保留在未提交的 `analysis/incoming/`，
  因其操作契约尚未闭合，不盲目扩张运行资产和空成功路径。
