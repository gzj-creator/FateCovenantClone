# 百派争鸣活动实现与验收记录

## 范围

- 日期：2026-10-31
- Worktree：`F:\projects\FateCovenantClone\.worktree\hundred-schools`
- 实现分支：`feature/hundred-schools`（集成部署在 `main`）
- 活动：`117001`（function `117`，登录模块 `92`）
- 本机测试模式：`all-open`
- 未修改 APK；本次只有个人服务器代码和测试变化，因此没有生成新的 APK 快照。

## 根因与修复

1. 选择流派发送 `100302`，服务端原先没有对应路由，真实客户端得到服务器错误。
   - 新增 ETF 单整数参数解析和 `100302` 路由。
   - 流派 ID 按 `HeroDrawActGenreRank` 校验并持久化到模块 `92` 内嵌的 `pb_hero_draw_act_data`。
   - 重登、任务计算和直接 SQLite 重开均保留流派。
2. 选中流派后的星级任务原先无法正确计算。
   - `draw_exchange_id` 直接查询 `NormalDrawExchangeLineup`，再汇总所选阵容英雄星级。
   - 个人抽数、全服抽数、核心英雄星级分别对应任务类型 `1/2/3`。
3. 任务领奖发送 `100301`，服务端原先未实现。
   - 新增 `100301` 路由，返回 `pb_hero_draw_act_task_reward_back`。
   - 奖励位使用客户端同格式 BitBlock，同时以 `activity_claims` 做 SQLite 幂等保护。
   - 34 条配置任务的奖励都已执行领取测试；类型 `10` 的圣器/资源奖励补充到角色货币落点。
4. 限时招募礼包页显示配置错误。
   - 模块 `92` 的子活动 `module_login_data` 改为 `ETF(BINARY(pb_hero_draw_act_data))`。
   - `role_data` 补齐 `recharge_limit_info.refresh_time/buy_num_list`，购买次数在登录同步时从 SQLite 回填。
5. 礼包购买与支付链路不完整。
   - 免费和资源礼包走 `16005`；现金礼包走 `16004 -> 1900 -> 16003`。
   - 当前 13 个礼包支持类型 `16/46/106`，购买扣费、奖励、活动次数和 `flag 92` 在同一事务内提交。
   - 模式 6“终身限购”不再在新活动周期归零；模式 1 按每日、2/3 按每周、4/5/7 按活动期统计。
   - 共享商品 `40008/40010` 由客户端走 `DailyDiscountMgr.RechargeGift`，购买请求携带 JSON 元组而不是百派版本号；提交后同时更新 DailyDiscount 与百派礼包状态，并在 `1900` 中返回 `flag 40/92`。DailyDiscount 额外购买不会生成第二条百派记录，百派直接购买也不会占用 DailyDiscount 配额。
6. 榜单页和推荐礼包页缺少可解析数据。
   - `180/181/182/183` 的 `2008/2011` 查询返回结构化空榜，`85901` 返回百派礼包实时购买次数。
7. 登录公共活动解析还存在一个独立客户端截断问题。
   - `ActivityMgr.ParseParallelAct` 会把 `module_login_data` 经 `DecodeErl` 后直接交给活动自己的 `LoginParse`。
   - 宠物活动 `83028` 原先错误地放入 `pb_pet_act_begin`，但客户端按 `pb_pet_act_player_list` 解码，导致模块 92 登录阶段出现 protobuf 类型错位。
   - 现改为在平行活动组和模块 83 中都返回 `pb_pet_act_player_list`。百派活动继续使用自己的 `pb_hero_draw_act_data`。

## 2026-11-08 时间窗口与 `880101` 参数修复

### 活动性质

- `117001` 是限时活动，不是常驻活动。`ActivityTable.Func[117]` 的 `from_type=0`，对应 `ACT_TYPE_TABLE_CONFIG`，主体应按活动表配置时间开放。
- 活动配置为 `server_day=4`、`server_start_time=18000`、`duration_day=5`、`end_time=18000`。因此正常 `schedule` 模式下，服务器开到第 4 天 05:00 后开放 5 天，过期后显示“已结束”是正确行为。
- 当前个人服务器使用 `all-open`，测试模式要求所有活动持续可进入，所以这里不应结束。

### “已结束”根因

- 客户端 `HeroDrawActGiftForm:_SetCountTime()` 通过 `HeroDrawActMgr:GetRemainTime()` 调用 `ActivityTimeUtil.GetInitEndTime(actId)`。
- `ActivityTimeUtil.GetInitEndBeginDayCfgTime()` 在执行 `ACT_TYPE_TABLE_CONFIG` 的表配置时间计算前，先读取 `ActivityMgr:GetCustomCfg(tid)`。只要 `act_custom_list` 中存在该活动且 `start_time >= 0`，客户端就优先采用定制窗口。
- 旧 `all-open` 实现把每个定制窗口改成 `start_time=0`、`end_time=0`。客户端把 `0` 当成真实的 Unix 时间，因此窗口是 1970 年的零长度区间，判定活动已经结束。
- 模块 `183` 没有 `117001` 不是本问题根因；模块 `92` 的 `act_custom_list` 已足以驱动该活动倒计时，未向模块 `183` 盲目插入伪数据。
- `activity-calendar.mjs` 现在按原定制窗口、活动表配置窗口、服务器开服时间的顺序选择一个有效周期，滚动出包含当前时间且非零的窗口，并让活动状态 `history_time.enter_time` 与窗口起点一致。同一周期内重复登录得到相同窗口，不会每次登录重新起算。

### `880101` 参数错误根因

- 真实客户端购买免费招募礼包时发送 `16005`：`recharge_id=880101`、`buy_num=1`、`extra_param="[]"`。
- 旧实现把 `[]` 交给 `parseRechargeExtraParam()`；该函数要求至少包含一个 `[is_extra_buy, period, day]` 元组，于是抛出“参数必须包含元组”并返回 `code=1`。该商品的购买界面本来就没有周期元组。
- `welfare-service.mjs` 现在只对 `880101` 且原始参数严格等于 `[]` 的情况归一化为无周期购买，并记录 `purchase_extra_param_defaulted`。其他商品仍走严格解析，没有放宽 `type=46`、`buy_cycle_limit=5` 或其他周期商品。

### 验证与部署

- 定向回归：`activity-calendar`、`hundred-schools`、`gameplay-gateway` 共 `23/23` 通过；包含 `all-open` 当前窗口、重复登录稳定、`schedule` 过期关闭、`880101 extra_param="[]"` 真实 TCP 购买、重复购买限制和 `40008` 严格拒绝。
- 全量回归：`npm test --prefix personal-server` 共 `2386` 项，`2384` 通过、`0` 失败、`2` 跳过；日志为 `analysis/test-runs/hundred-schools-fix-20261108-full.log`。
- 部署前使用 `node:sqlite` backup API 生成一致备份 `analysis/experiments/private-server-20261025/p3/hundred-schools-time-gift-fix-20261108/game.before-deploy.local-only.sqlite`：679936 字节，SHA256 `FA1594A1BCF23228B88EF64458CF8B2D8009867ECF64352DE1085458C78F2232`，schema v16，`PRAGMA integrity_check=ok`，角色 1、登录模块 145。
- 新服务 PID `36780`，启动时间 `2026-11-07T17:42:02.995Z`，入口 `personal-server/local-server.mjs`；`18880/18881/18882/18883/19090` 均仅监听 `127.0.0.1`，stderr 为空。
- 现有客户端在重启后自动重连并完成 145 个模块登录。实时登录事件 `2026-11-07T17:42:03Z` 中 `117001` 定制窗口为 `1793739600..1794171600`（`2026-11-03T21:00:00Z` 至 `2026-11-08T21:00:00Z`），`history_time.enter_time=1793739600`，窗口覆盖当前时间且 `cur_state_id=50`。
- 本次没有修改 APK 或操作模拟器。礼包实际点击与活动页面视觉状态由用户下一次操作确认；服务端链路已由真实 TCP 测试覆盖。

## 2026-11-08 白绫付费商城（1841010）时间同步

### 现象与根因

- 新超凡魔灵「白绫」的百抽活动主体是 `1102010`（`type=1102`，`百抽活动_魔灵招募_首发_超凡白绫`），配置窗口 `1792098000..1792530000`（2026-10-16 05:00 至 2026-10-21 05:00，Asia/Shanghai）。
- 同期付费商城是独立的 `1841010`（`type=184`，`百抽活动_付费商城_首发_超凡白绫`），兑换商店是 `182819`（`type=182`）。
- 实时登录快照的 module 183 只有父活动 `1102010` 的 player/server 行，没有 `1841010`；客户端查不到 ActFrame 行后回退到静态 `ActFrameTable` 时间，于是商城礼包页显示“活动已结束”。
- `all-open` 原先只延长 module 183 中已经存在的活动行，不能补齐快照中缺失的子活动行，因此父活动仍可进入，但付费商城时间不同步。

### 修复

- `activity-calendar.mjs` 的 `normalizeActFrameLogin()` 在 `all-open` 下扫描 `ActFrameAct`，为缺失的 `type=182/184` 子活动补建 player/server 行；匹配条件为与任一已存活动具有相同 `world_time`、`duration_day`、`end_time` 和 `server_day_limit`。
- 新行统一写入 `cur_stage_id=50`、`is_pause=false`、`loop_count=0`，开始时间不晚于当前时间，结束时间至少覆盖当前时间后的 365 天；重复登录不会重复插入。
- 白绫快照实际补入 `182819` 和 `1841010`，`1841010` 的 server/player 行都能通过 `pb_act_server_data` / `pb_act_role_login` 编解码往返。

### 验证

- `test/activity-calendar.test.mjs` 新增真实配置回归：仅有 `1102010` 父行时，`all-open` 必须补出 `182819` 和 `1841010`，并验证重复调用不重复插入。定向 `activity-calendar` 9/9 通过。
- `activity-calendar`、`gameplay-gateway`、`hundred-schools` 定向回归 24/24 通过。
- 全量 `node --test --test-concurrency=1 test/*.test.mjs`：2426 项，2424 通过、0 失败、2 跳过，日志 `analysis/test-runs/white-ribbon-paid-shop-20261108-full.log`。

### 部署与实时登录证据

- 重启前一致性备份：`analysis/experiments/private-server-20261025/p3/white-ribbon-paid-shop-20261108/game.before-white-ribbon-paid-shop.local-only.sqlite`，724,992 字节，SHA256 `60F6CC714EA8D9759BFA96CA0351DD17810C48FE062CA15A62C2E793AFA4FF06`，schema v16，`PRAGMA integrity_check=ok`，角色 1、登录模块 145。
- 本地服务已重启为 PID `41576`，启动时间 `2026-11-07T18:49:37Z`；`18880/18881/18882/18883/19090` 均仅监听 loopback，stderr 为空；客户端自动重连并完成 145 模块登录。
- 实时登录事件 `2026-11-07T18:49:47.928Z` 的 `actFrameAdjustedActivityIds` 已包含 `182819` 和 `1841010`；同时 `1102001..1102010` 十个百抽活动进入 module 92。没有代替用户点击礼包页面，最终视觉显示由用户下一次打开页面确认。

## 客户端协议证据

- `HeroDrawActCmd.lua.json`：选流派命令为 `req_hero_draw_act_set_draw_exchange`，领任务命令为 `req_hero_draw_act_task_reward`，两者都是单个整数参数。
- `HeroDrawActMgr.lua.json`：只新增上述两类游戏命令；礼包、榜单和推荐使用现有通用协议。
- `ActivityMgr.lua.json` prototype 6：平行活动组执行 `Codec.DecodeErl(state.module_login_data)` 后调用 `funcModule.LoginParse`。
- `HeroDrawActTable.data.lua.json`：版本 1 的 34 条任务和 13 个礼包均从正式配置表加载。
- `RechargeTable.data.lua.json`：`BuyCycleLimit` 1 为每日、2/3 为每周、4/5/7 为活动期间、6 为终身。

## 验证

- 定向测试：`node --test personal-server/test/pet-activity.test.mjs personal-server/test/hundred-schools.test.mjs`，9/9 通过。
- 集成 `main` 全量测试：`npm test --prefix personal-server`，230/230 通过。
- 34 个任务逐条领取、奖励位写入和重复领取拒绝通过。
- 13 个礼包的免费、资源、现金购买、限购、重开恢复和现金通知通过。
- 选流派、601 招募计数、任务、礼包、`85901`、`2008/2011` 通过真实临时 TCP 帧。
- 所有修改 `.mjs` 均通过 `node --check`；`git diff --check` 通过。

## 部署与数据保护

- 切换前一致性备份：
  - `analysis/experiments/private-server-20261025/p3/hundred-schools-shared-gift-20261031/game.local-only.pre-shared-gift-sync.sqlite`
  - 大小 `331776` 字节
  - SHA256 `663C990EBB4EB8911F72FB1A5A63B42EB7E2236CD1DB07EF0767C472CD1BAC68`
  - `PRAGMA integrity_check=ok`，`user_version=9`
- 活动首次实现前的一致性备份：
  - `analysis/experiments/private-server-20261025/p3/runtime.local-only.data/game.local-only.pre-hundred-schools-pet-fix-20261031.sqlite`
  - 大小 `319488` 字节
  - SHA256 `2D6FDA06D794C75E2188FFEB442D4AB37DD284EB3ECE65128695174D72BF471F`
  - `PRAGMA integrity_check=ok`，`user_version=9`
- 最终集成版服务 PID `32972`，入口为主仓库 `personal-server/local-server.mjs`，工作目录为主仓库根目录，启动时间 `2026-10-31T06:54:15.797Z`。
- `18880/18881/18882/18883/19090` 均确认仅监听 `127.0.0.1`。
- 最终日志：
  - `analysis/experiments/private-server-20261025/p3/hundred-schools-shared-gift-20261031/local-server.main-deploy.stdout.log`
  - `analysis/experiments/private-server-20261025/p3/hundred-schools-shared-gift-20261031/local-server.main-deploy.stderr.log`
  - stderr 为空。
- 代码提交：实现 `4497043`；共享礼包修复 `04072af`（在 `main` 上为 `7bf12bc`）。

## 真实客户端状态

服务器侧完整协议、事务与页面所需数据已通过组件和临时 TCP 测试。集成版重启后，隔离客户端进程 PID `24933` 已完成一次真实重连和登录：服务端在 `2026-10-31T06:54:28.520Z` 记录 `hero_draw_activity_login_synchronized`（`actId=117001`），随后记录 `login_sent`，返回 `146` 个模块。部署后的 `64` 条日志中 `handler_error=0`、`hero_draw_activity_rejected=0`、`unsupported_command 100301/100302=0`；客户端 logcat 也未命中 `PetActivityMgr`、protobuf `type mismatch` 或 `handler_error`。唯一未支持命令是 CMS `89501`，不属于本活动。

真实 APK 的逐页视觉验收仍需在用户操作后按顺序检查流派选择/命格、任务、限时招募礼包、推荐礼包和四个榜单；本次未代替用户点击活动页面，因此不能把组件、真实 TCP 和登录成功扩大表述为逐页人工验收完成。

## 2026-11-08 白绫现世礼包商店补全

- `1841010`（`ActFrame` 类型 `184`）的 player 行已由 all-open 批次补出，但缺少客户端需要的 `pb_premium_act` 登录 block，导致白绫现世礼包列表为空。
- 新增 `premium-act-service.mjs` 在登录时为开放的 184 活动生成/更新 `pb_premium_act`，并从 `activity_purchases` 回填礼包购买次数；同时补上类型 128 礼包的免费、资源和现金购买链路与 `flag 114` 限购回包。
- `PremiumActTable` 版本 `1002` 的 10 个礼包和购买路径已由 `test/premium-act.test.mjs` 覆盖；合并最新 `main` 后全量测试 2756 项（2754 通过、0 失败、2 跳过）。
- 详细根因、配置边界和待做实时客户端视觉验收见 [`agent/workflow/premium-act/implementation.md`](../premium-act/implementation.md)。
