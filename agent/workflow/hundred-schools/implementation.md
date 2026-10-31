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
