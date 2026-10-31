# 累充同类系统剩余实施计划

## 基准与结论

- 计划日期：2026-10-31。
- 代码基线：main @ e4f98a8（merge: fix cumulative recharge thresholds）。
- 已完成并合入 main：
  - 92001 百元累充不再把已经是分值的 Group.amount 再乘 100。
  - 98620 活动累充按活动窗口、05:00 日界和 recharge_record.recent_record 的分值汇总，不再读取终身总额。
  - 当前百元档与版本 36 累充档位的金额门槛均有覆盖测试。
  - 合并后 npm test 为 207/207。
- 尚未完成：首充、充值福利、钻石返利重置、线性首充、充值额外奖励，以及 98620/92001 高档涉及的专用奖励持有类型。
- 当前代码合入不等于正在运行的服务已更新，也不等于真实客户端完成验收。部署、重启、重新登录和用户点击验收必须分别记录。

## 工作区与交付方式

1. 新建独立 worktree，例如 .worktree/remaining-recharge-systems，分支 feature/remaining-recharge-systems，基于当时最新的 main。
2. 不把主工作区现有的未提交改动带入分支。实施前重新执行 git status；本计划开始时已观察到的其他改动包括：
   - agent/workflow/fixes/README.md
   - agent/workflow/fixes/activity-calendar.md
   - agent/workflow/pet-activity/implementation.md
   - docs/07-private-server-feature-execution-plan.md
   - docs/08-activity-fix-checklist.md
   - agent/workflow/recruitment/implementation.md
   - personal-server/game/recruit-service.mjs
   - personal-server/game/recruit-pool-rules.mjs
   - personal-server/test/recruit-service.test.mjs
   - tools/IsolatedApkBuilder/Program.cs
   - tools/patch-wallet-payment-lua.mjs
   - agent/workflow/acc-recharge/remaining-implementation-plan.md（本交接文档本身）
3. 每个阶段独立提交，提交标题以 feat(recharge):、fix(recharge): 或 test(recharge): 开头。
4. 每阶段完成后更新本目录 implementation.md，记录静态证据、代码、测试、部署和真实验收边界。
5. 最后一阶段完成全量 npm test、SQLite 重开、真实 TCP 测试、部署与用户验收后再合并 main。
6. 仅修改服务端和测试时不改 APK，不更新 apk/README.md，也不生成无效 APK 快照。

## 总体验收原则

- 所有金额以分为单位。不得对已经是分值的配置再次乘 100。
- 终身累充读取 res_recharge_login.total_amount；活动窗口累充读取 recharge_record.recent_record；二者不能混用。
- 充值日界为本地 05:00。边界时刻、跨日、同一日多笔和窗口首末日必须有测试。
- 只有客户端真正触发 EVT_RECHARGE 的支付路径才计入累充或连续充值天数。16005 的 EVT_BUY_OR_REV 不能自动视为充值。
- 所有领取状态使用 Core.BitBlock 的 0-based、字节内 MSB-first 规则。
- 领取状态、奖励持有、资源变化、领取记录必须处于同一个 store.transaction。
- 不允许只返回 pb_res_to_client.changes 而不更新持久模块；也不允许更新领取位后因奖励不支持而部分成功。
- 协议载荷使用现有 codec.pack/unpack。不得手拼 protobuf，不得到未确认的命令上猜请求结构。
- 每个登录模块必须先解析旧数据；缺字段时按客户端默认值补齐；旧用户数据不得被清空。
- SQLite schema 版号取实施基线上的“下一个可用版本”，不要把本计划中的 v10 当作固定值。

## 先决条件：客户端入口与当前活动证据

在实现领取前完成一张 recharge-surface-matrix，至少包含：管理器、登录模块、配置表、充值口径、命令、状态字段、当前是否可见、真实请求证据、实现状态。

必须重点核验：

1. FirstRechargeMgr 的空请求 16001 如何选择档位和天数。客户端本地循环顺序不能直接当作服务端任意选择权。
2. RechargeBonusMgr 的 88301/88302 ETF 参数、选组是否可改、第二次领取请求中的取模语义，以及第 2 轮是否重置组和领取位。
3. RechargeRebateResetActMgr 当前实际开放的 act_id。RechargeRebateResetTable 有 3 条历史配置，不能全部无条件开启。
4. LineFirstRechargeMgr 的当前活动 ID、解锁链、购买触发点、102101/102102 精确 ETF 参数和 choose_tid 规则。
5. RechargeExtraAwardMgr 的实际所属链路。当前证据指向钻石充值附加奖励和龙晶购买次数，不应先入为主地归为普通累充领取。
6. ItemTitle、ItemRoleSkin、EmojiItem、SpRelicItem 等 obj_class 的真实登录模块、唯一持有和重复持有规则。
7. GetTotalAmount、GetDayRangeAmount、EVT_RECHARGE、DispatchRechargeEvent 的全部引用，防止遗漏另一个累充管理器。

建议保存：

- agent/workflow/acc-recharge/recharge-surface-matrix.md
- agent/workflow/acc-recharge/runtime-requests.md

如果当前 UI 未开放某活动，先保存在离线字节码和静态协议证据中；不要为让历史配置出现而伪造活动时间或领取状态。

## 支撑模块与命令清单

| 系统 | 登录/状态位置 | 命令 | 响应/状态 | 关键结论 |
| --- | --- | --- | --- | --- |
| 首充 | 模块 51 | 16001 req_get_first_recharge_reward，ETF 空请求 | pb_res_rev_first_recharge_reward | FirstRecharge 配置 3 档，need_amount 为 600/3000/10000 分；每档 days=[1,2,3] |
| 充值福利 | 模块 149 | 88301 req_select_group；88302 req_get_recharge_bonus_award | pb_recharge_bonus；pb_recharge_bonus_back | 配置开服第 1 天和第 35 天两轮；第 2 轮可选组 1/2；共 24 个 Award |
| 钻石返利重置 | 活动登录态，通常在模块 92 的 state/module_login_data 中 | 100201 req_recharge_rebate_reset_award，ETF [act_id, slot] | pb_recharge_rebate_reset_enter / pb_recharge_rebate_reset_back | slot 0 为预览奖励，1..3 为每日奖励；必须按 Activity/ActFrame 当前窗口选实际活动 |
| 线性首充 | 模块 547 | 102101 req_line_first_recharge_choose；102102 req_line_first_recharge_rev | pb_line_first_recharge；pb_line_first_recharge_rev_back | 购买走标准充值链路；当前活动 ID 和解锁规则尚需补齐证据 |
| 充值额外奖励 | 模块 19 的 recharge_extra_award_info | 无独立领取命令 | 通过充值响应 extra_ret_list/extra_ret_map 下发 | 字段为 flush_day、buy_num_list；监听 EVT_RECHARGE 和部分 EVT_BUY_OR_REV |
| 百元累充 | 模块 166 | 92001 req_hundred_acc | pb_res_to_client | 已完成金额与领取主链，高档专用奖励仍依赖奖励持有系统 |
| 活动累充 | 模块 106 | 98620 req_acc_recharge_act_get_award | pb_res_to_client | 已完成窗口金额、BitBlock 与领取主链，高档专用奖励仍依赖奖励持有系统 |

协议源文件位于：

- analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__protobuf.bundle/textassets/
- first_recharge.db.proto.bin
- first_recharge.net.proto.bin
- recharge_bonus.db.proto.bin
- recharge_bonus.net.proto.bin
- recharge_rebate_reset.db.proto.bin
- recharge_rebate_reset.net.proto.bin
- recharge_extra_award.db.proto.bin
- line_first_recharge.db.proto.bin
- line_first_recharge.net.proto.bin

## 阶段 0：固化基线与覆盖面

目标：确定所有实际可达的累充同类入口，防止只修用户当前点到的页面。

任务：

1. 从 main 创建独立 worktree，确认 git status 干净。
2. 在 personal-server 执行 npm test，记录基线。
3. 自动扫描 Lua 管理器和命令：
   - *RechargeMgr
   - *AccRecharge*Mgr
   - *FirstRecharge*Mgr
   - *RechargeBonus*Mgr
   - *RechargeRebate*Mgr
4. 自动引用扫描：
   - GetTotalAmount
   - GetDayRangeAmount
   - EVT_RECHARGE
   - DispatchRechargeEvent
   - recharge_record
   - recharge_extra_award_info
5. 将每条入口分为：
   - 当前活动开放且客户端有 UI；
   - 管理器存在但当前无开放入口；
   - 仅历史配置，没有管理器/命令引用；
   - 非累充，只是购买或普通礼包。
6. 对“当前开放且客户端有 UI”的入口，必须在本计划内实现；对其余暂缓项记录证据，不得只凭配置表存在就实现。

完成标准：

- 每个相关 manager、command、module、table 都在矩阵中有归属。
- 不再出现“只知道当前报错点，不知道还有哪些类似入口”的状态。

## 阶段 1：统一充值金额与日界规则

目标：把已修复的金额口径变成共享能力，后续首充、返利和连续充值直接复用。

建议新增 personal-server/game/recharge-rules.mjs，至少提供：

1. rechargeDayIndex(timestampSeconds)：按本地 05:00 划分。
2. lifetimeRechargeCents(modules, codec)：读取模块 19 的 total_amount。
3. rangeRechargeCents(modules, codec, startDay, endDay)：只汇入闭区间的 recent_record.amount。
4. assertCents(value, label)：拒绝负数、非整数、溢出和借 Number 精度绕过的值。
5. claimPeriod(...)：生成可追踪、不可冲突的周期键。
6. normalizeEtfNumber(value)：只接受服务端预期形态的单一整数。

重构要求：

- acc-recharge-service.mjs 与 hundred-acc-service.mjs 改用共享函数。
- 保持现有 7/7 与 5/5 测试通过；新增共享规则的边界测试。
- 建立充值事件真值表：16004 余额/代金券支付、SDK 支付、16005 礼包、宠物充值礼包分别是否触发 EVT_RECHARGE、是否写 total_amount、是否写 recent_record、是否推进充值福利天数。
- 16005 当前不得并入终身或活动窗口累充，除非新的真实客户端事件证据推翻该结论。

测试：

- 05:00 前 1 秒、05:00、05:00 后 1 秒。
- 活动开始日、结束日和窗口外记录。
- 同一日多笔只生成一个日号记录，但金额全部累计。
- total_amount 与 recent_record 不一致时按各自系统规则处理，不能悄悄互相兜底。
- 直接购买 600/3000/6800/19800 分商品后的金额增量。

## 阶段 2：通用奖励持有与发放系统

目标：让所有当前累充奖励都能正确持有、同步登录态并可重复重开，而不是在第一次发放专用资源时失败。

### 2.1 现有缺口

当前 grantResources 主要按 ItemTable.Type.res_type 和少量 inventoryGroups 判断，存在三类问题：

1. 非 Item 奖励直接失败，例如首充英雄 3030501、当前累充中的英雄 1040101/3040101。
2. 专用 obj_class 与普通道具共用 res_type=2，可能被错误写入普通背包，例如 FantasyEquipChip、EmojiItem、SpRelicItem、ItemRoleSkin。
3. 已有 98620/92001 高档奖励覆盖多个独立登录模块，当前服务没有这些持有处理器。

当前活动奖励中需要覆盖的 obj_class/res_type 至少包括：

- 普通可栈资源：ItemProp、ItemBase、ItemBox。
- HeroChip。
- Hero 原始奖励（当前不是 ItemTable 行）。
- ItemTitle。
- Artifact。
- Skin。
- Pet、PetChip。
- Treasure。
- FantasyEquip、FantasyEquipChip。
- Elves、ElvesChip、ElvesBead。
- HouseAssistantItem。
- EmojiItem、ItemRoleSkin。
- SpRelicItem。
- ItemSpiritCourtyard。

已知对应登录模块：

- Artifact：模块 50。
- Skin：模块 65。
- HouseAssistantItem：模块 148。
- Pet/PetChip：模块 158 的登录数据至少是首要核验点。
- FantasyEquip/FantasyEquipChip：模块 518。
- Treasure：模块 534。
- Elves/ElvesChip：模块 538。
- ElvesBead：模块 539。
- ItemSpiritCourtyard：模块 553。
- Hero 由现有 heroes/model.heroInfo 与模块 10 维护。

ItemTitle、EmojiItem、ItemRoleSkin、SpRelicItem 的具体登录模块和可写 schema 仍需从客户端对象管理器和 proto 中确认；确认前不得用普通背包充当已持有。

### 2.2 实现方式

1. 新增 award-handler.mjs 或等价注册表。
2. 先根据 item tid 查 ItemTable；查不到时再按 HeroTable 或明确领域解析，禁止猜。
3. 根据 obj_class 优先选择处理器，不能只看 res_type。
4. 普通 ItemProp/ItemBase/ItemBox 继续使用现有资源逻辑，但只允许进入明确白名单。
5. 每个专用处理器负责：
   - 解析当前登录模块或专用表。
   - 判断新获得、重复获得、数量累加、转换或已拥有。
   - 修改持久状态。
   - 返回与客户端一致的 tid/new_num/diff_num changes。
6. 在事务中先 preflight 整组奖励，确认所有奖励都能解析后再写任何状态。
7. 仍然保留 SQLite 事务作为最终原子回滚边界。
8. 不允许未知 obj_class 落回普通 ItemProp 分支。

### 2.3 覆盖测试

新增一项全配置奖励覆盖测试，遍历：

- AccRechargeAward
- HundredAccReward
- FirstRecharge.Award
- RechargeBonus.Award
- RechargeRebateReset.Act.daily_award
- LineFirstRecharge 的全部 award

断言每个奖励 ID 都恰好解析到一个有效处理器。测试失败信息必须输出表名、奖励行、item tid、obj_class 和 res_type。

每个专用处理器至少测试：

- 首次获得。
- 已有后重复获得。
- 数量/唯一状态正确。
- 登录模块包含新状态。
- pb_res_to_client.changes 与模块状态一致。
- close 后重开 SQLite 仍存在。
- 处理器抛错时领取记录、BitBlock 和全部奖励回滚。
- pack 抛错或 SQLite 约束失败时整体回滚。

完成标准：

- 当前所有可发放奖励无 unsupported resource。
- 不再存在 res_type=2 的专用物品被误写成普通道具的路径。
- 高档 98620/92001 的奖励可在真实账号一致性备份副本上完整领取并重开。

## 阶段 3：首充模块 51

配置：

- FirstRechargeTable.FirstRecharge：
  - tid 1，need_amount 600，days 1/2/3，rewards 1/2/3。
  - tid 2，need_amount 3000，days 1/2/3，rewards 4/5/6。
  - tid 3，need_amount 10000，days 1/2/3，rewards 7/8/9。
- FirstRechargeTable.Award 的 9 个奖励全部纳入奖励覆盖测试。

实现：

1. game-tables.mjs 读取 FirstRecharge 和 Award。
2. 新增 first-recharge-service.mjs。
3. 登录时解析/补齐模块 51 的 pb_first_recharge。
4. 16001 请求为空；服务器按真实客户端语义选择“当前可领取的档位/天”，并返回 pb_res_rev_first_recharge_reward。
5. 成功时：
   - 发放对应 Award。
   - 用 setBit 更新 grade_map 对应 pb_first_recharge_grade.reward_states。
   - 写 reward_claims，claim_type=first_recharge，claim_key 包含 grade 和 day。
   - 返回更新后的 grade_list 与 pb_res_to_client。
6. 重复领取、未达金额、未解锁天、功能未开放必须使用与客户端 ErrorTable 匹配的错误码。

实施前必须确认：

- GetUnlockDayCount 的起点是角色登录天、创建天还是首次充值天。
- 空请求一次只领一项还是可领取全部；多个档位/天同时可领时的确定顺序。
- reward_states 的位索引是否直接等于配置 day 值，还是 day-1。

测试：

- 599/600、2999/3000、9999/10000 分边界。
- 同档第 1/2/3 天先后解锁。
- 多档同时满足时顺序稳定且每次只写正确领取项。
- 重复请求返回已领取错误且不重复发奖。
- 模块 51 grade_map、BitBlock、reward_claims、奖励变化一致。
- 数据库重开、真实 TCP 16001 往返。
- 三个档位的 9 个奖励均能通过专用处理器发放。

## 阶段 4：充值福利模块 149

配置：

- RechargeBonus 第 1 轮：open_day=1，tid=1，group=[1]。
- RechargeBonus 第 2 轮：open_day=35，tid=2，group=[1,2]。
- Award tid 101-112 属于组 1，201-212 属于组 2。
- 共 24 个奖励，is_big_award 只影响展示，不能用于绕开领取校验。

状态：

- pb_recharge_bonus.tid
- pb_recharge_bonus.group
- pb_recharge_bonus.award_bin
- pb_recharge_bonus.last_recharge_day
- pb_recharge_bonus.acc_recharge_days

实现：

1. game-tables.mjs 读取 RechargeBonus、Group、Award。
2. 新增 recharge-bonus-service.mjs，并接入模块 149 登录同步。
3. 88301 校验当前轮、可选组、选择是否允许修改；成功后更新 group 并返回 pb_recharge_bonus。
4. 88302 校验当前轮、已选组、累计充值天数和目标日领取位；成功后更新 award_bin、发奖、写 reward_claims，返回 pb_recharge_bonus_back。
5. 钱包真实充值事务内更新模块 149：
   - 每个 05:00 日界最多 acc_recharge_days + 1。
   - 同一天多笔只推进一次。
   - last_recharge_day 记录实际推进的日号。
   - 更新必须与钱包订单同一事务提交。
6. 轮次切换时根据真实客户端行为初始化或保留 group/award_bin。不得把上一轮领取位直接复用。

测试：

- 未选组不能领奖。
- 选组后按天解锁；day=1/2/3 的领取位按 BitBlock 写对。
- 同一日多笔充值只增加一天。
- 05:00 边界前后两笔增加两天。
- 16005 和其他 EVT_BUY_OR_REV 路径不增加天数。
- 第 1 轮和第 2 轮的 tid、可选组、领取位隔离。
- 重复领取、越级领取、错误组、活动未开放均拒绝。
- 真实 16004 钱包购买后同一事务中订单、模块 19 和模块 149 同时成功或同时回滚。
- SQLite 重开、真实 TCP 88301/88302。

## 阶段 5：钻石返利重置活动

配置与状态：

- RechargeRebateResetTable.Act 当前有 3 条历史配置，每条 daily_award 有 3 项。
- pb_recharge_rebate_reset 状态为 act_id 和 award_bin。
- 进入活动响应包含 pb_recharge_rebate_reset_enter，必要时同时携带 recharge_extra_info。

实现前门禁：

1. 从 ActivityTable 和 ActFrameTable 解析每条 RechargeRebateResetTable 配置的激活窗口及实际 act_id。
2. 只允许 activity calendar 当前运行或处于 preview 的配置进入登录态。
3. 从 Mgr 确认 GetAwardState 的开放天数条件和 award_bin 位索引。
4. 确认活动进入时 recharge_extra_info 为 nil 与非 nil 的准确阶段差异。

实现：

1. 在活动登录 state 中写入/解析 pb_recharge_rebate_reset。
2. 100201 接受精确 ETF `[act_id, slot]`。`RechargeRebateResetActMgr.ReqClaimAward` prototype 11 明确发送这两个参数；slot 0 对应 preview_award，slot 1..3 对应 daily_award 的第 1..3 项，每次只领指定项。原计划的“空请求”已由字节码证据纠正。
3. 领取时检查活动窗口、开放天、BitBlock、claim 记录。
4. 同一事务发奖、写位、写 reward_claims，并返回 pb_recharge_rebate_reset_back。
5. 若同时有两个活动候选，必须按配置优先级或真实客户端规则确定一个；不能随机选择。

测试：

- 3 条配置均未开放、preview、running、closed 四种状态。
- 只开放 1 条活动时正确选择；多个候选时确定性选择。
- 开放日到达前不可领，开放首日和末日可领。
- 重复领取与错误活动不得写任何状态。
- 模块 92/活动 state、award_bin、reward_claims、奖励变化一致。
- 重开数据库与真实 TCP 100201。

## 阶段 6：线性首充模块 547

这是首充完成后的独立链，不应与模块 51 混成一个状态机。

先补齐证据：

1. 提取 LineFirstRechargeTable.data 的当前活动 ID、礼包链、时间窗口、价格、奖励和自选奖励。
2. 从 LineFirstRechargeMgr/Cmd 确认真实购买是否只走 RechargeTable 标准充值，还是还有独立购买命令。
3. 确认 102101 choose 和 102102 rev 的 ETF 参数。
4. 确认 pb_line_first_recharge.buy_limit_info、buy_mission、choose_tid 的来源。
5. 确认登录初始化中模块 547 是否存在，以及首次购买如何创建记录。

实现：

1. game-tables.mjs 读取 LineFirstRecharge 的完整相关表。
2. 接入模块 547 登录同步。
3. 钱包真实充值事务中更新当前解锁 tid、open_time、end_time、choose_tid 与 buy_limit_info。
4. 102101 只允许在当前可选礼包范围内选择；切换是否允许以客户端规则为准。
5. 102102 按 pb_line_first_recharge_buy.rev_bin 的 BitBlock 领取，更新 buy_list 中对应条目并写 reward_claims。
6. 充值响应中的 extra_ret_list/extra_ret_map 必须携带客户端期望的模块信息。

测试：

- 当前活动未开放、开放但未充值、已购买未选择、已选择未领取、已领取。
- choose_tid 非法、跨轮次、已购买后切换。
- 领取 BitBlock、buy_list、reward_claims 与奖励一致。
- 钱包购买与模块 547 同一事务；重复订单不二次解锁。
- 重开数据库、真实 TCP 102101/102102。

## 阶段 7：充值额外奖励与钱包响应

目标：先确认它是“充值附加奖励”还是“额外累充奖励”，再按真实事件接入。

已知：

- 数据在模块 19 的 recharge_extra_award_info。
- pb_recharge_extra_award_info 字段为 flush_day 和 buy_num_list。
- RechargeExtraAwardMgr 监听 EVT_RECHARGE 与部分 EVT_BUY_OR_REV。
- 相关逻辑包含 DragonCrystal 充值、购买次数、ExtraFixReward、MAX_AWARD_NUM 和 60 天刷新提示。
- 它不是当前服务端的独立领取命令。

任务：

1. 解码 Mgr 的 OnRecharge/OnGiftBuyOrRev、GetExtraAdd、GetAwardCount，制作事件真值表。
2. 确认 flush_day 的重置基准是 05:00 日号还是 60 天周期号。
3. 确认哪些 RechargeTable.type 累加 buy_num_list，哪些只发一次性附加奖励。
4. 在 wallet-service 当前事务内：
   - 更新买次数。
   - 到达 flush_day 时按客户端规则重置。
   - 计算本次额外奖励。
   - 更新模块 19。
   - 将正确 extra_ret entry 放入充值结果。
5. 所有计数、余额、订单、模块 19、奖励必须同事务。

测试：

- 首次购买、重复购买、同周期多次购买。
- 60 天边界前后。
- 不同 recharge_id 计数隔离。
- 触发 EVT_RECHARGE 的路径更新，16005 非充值路径按证据决定是否更新。
- 奖励上限 MAX_AWARD_NUM 和固定附加奖励边界。
- extra_ret_list/extra_ret_map 的 tid、数量和持久状态一致。
- 重开数据库、真实充值响应验收。

## 阶段 8：最终同类入口清扫

在关闭任务前重新执行入口扫描，形成“已实现/暂缓”表。

当前已知暂缓项：

- WeekAccRechargeParam、WeekAccReward、WeekAccRecharge 配置存在，但暂未找到管理器引用。
- ForeverIncreaseGift 和充值赠礼选择等只有静态配置/管理器线索时，先等待 UI、命令或真实请求证据。
- 没找到客户端引用的历史配置不得因此自动开启，也不得写入“已修复”。

最终清扫要求：

1. 所有客户端可达且与 EVT_RECHARGE、GetTotalAmount、GetDayRangeAmount 相关的命令，要么有处理器，要么有明确暂缓证据。
2. 活跃充值奖励中出现 LOCAL_NOT_IMPLEMENTED 视为未完成。
3. 活跃充值奖励中出现“普通背包兜底”或 unsupported resource 视为未完成。
4. 所有已领取状态重新登录后仍由模块响应正确显示。
5. 所有领取流程在 SQLite 重开后保持幂等。
6. 所有高档奖励在当前活动配置上至少通过配置覆盖测试和账号一致性备份副本；真实账号做到哪一档就验收哪一档，不虚报。

## 测试矩阵

| 类别 | 必测场景 |
| --- | --- |
| 金额 | 分单位、边界差 1 分、终身与活动窗口、无重复乘 100 |
| 时间 | 05:00 前一秒/整点/后一秒、窗口首末日、轮次切换、60 天刷新 |
| 登录态 | 旧模块空、旧模块缺字段、当前 BitBlock、关闭重开、重新登录 |
| 领取 | 首次、重复、越级、未解锁、未选组、错误活动、错误档位 |
| 原子性 | 任一奖励失败时状态和资源全部回滚 |
| 奖励 | 每种 obj_class 首次/重复/数量/登录模块/pb changes |
| 钱包 | 余额支付、代金券、SDK、16005、同一日多笔、跨日多笔 |
| 网关 | 每种命令的 ETF 解码、protobuf 响应、业务错误码、真实 TCP 握手 |
| 数据迁移 | 当前 user_version 升级、旧 fixture、integrity_check、重开 |
| 配置覆盖 | 遍历所有当前活动奖励行，无未注册处理器 |

建议测试文件：

- personal-server/test/recharge-rules.test.mjs
- personal-server/test/award-coverage.test.mjs
- personal-server/test/first-recharge-service.test.mjs
- personal-server/test/recharge-bonus-service.test.mjs
- personal-server/test/recharge-rebate-reset-service.test.mjs
- personal-server/test/line-first-recharge-service.test.mjs
- personal-server/test/recharge-extra-award.test.mjs

每项协议服务都应包含真实 TCP 网关测试，不能只直接调用 service.execute。

## 部署与真实验收

1. 部署前用 analysis/tools/backup-sqlite.mjs 做一致备份，记录 integrity_check、user_version、SHA256。
2. 只在一致性副本上先执行高金额、高档位、异常与迁移测试，禁止写真实运行库。
3. 实时读取 server.local-only.json 获取当前 PID，不沿用文档中的历史 PID。
4. 从新 worktree 启动服务，确认 18880/18881/18882/18883/19090 均由新进程监听在 127.0.0.1。
5. 用户重新登录后核对登录模块实际值。
6. 由用户操作真实界面完成可选入口验收；agent 不代替用户游玩。
7. 每次领取核对：
   - gateway 日志中的 command type、seq、业务拒绝码。
   - reward_claims/activity_claims。
   - 登录模块或专用状态。
   - pb_res_to_client.changes。
   - SQLite 重开后的幂等。
8. 未发生真实客户端操作前，只能记为“组件测试/副本验收/部署完成”。
9. 若最终修改了 APK，才按 AGENTS.md 的 APK 快照规则更新 apk/README.md；纯服务端修复不生成 APK 快照。

## 完成定义

全部同类任务完成必须同时满足：

- recharge-surface-matrix 不再有“当前可见但未实现”的累充或充值返利入口。
- 首充、充值福利、钻石返利重置、线性首充、充值额外奖励均有持久状态、登录同步、领取/触发逻辑和防重。
- 当前 98620/92001 所有活动奖励均可被奖励系统解析；高档不再因资源类型失败。
- 所有活跃奖励配置通过自动覆盖测试。
- 金额、05:00 日界、轮次、BitBlock 和真实充值事件均有权钱包级回归。
- SQLite 重开、失败回滚、真实 TCP 和部署后真实客户端验收证据齐全。
- main 合并后全量 npm test 通过，并且原有无关未提交改动未被误带或误提交。
