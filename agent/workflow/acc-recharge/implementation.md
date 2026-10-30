# 累充活动奖励领取

## 2026-10-30 服务器错误修复

用户点击新服累充活动奖励时弹出“服务器错误”。根因不是活动配置或充值数据不足，而是客户端发送的 `98620 req_acc_recharge_act_get_award` 没有服务端路由；旧网关把它当作未知命令并返回 `err=-1 LOCAL_NOT_IMPLEMENTED:98620`。

真实请求已由日志中的 `payloadHead` 解码为：

- `act_id=106036`
- `award_tid=36001101`
- 另观察到 `36001102` 和重复的 `36001101` 请求

活动配置位于 `ActFrameTable.Act[106036]`，`type=106`、`version=36`、`ref_name=新服_累充活动_3期_新`。对应奖励配置在 `AccRechargeActTable.Award`：

| award_tid | 累计充值门槛 | 奖励 |
| --- | ---: | --- |
| 36001101 | 6800 | 807002 x10 |
| 36001102 | 12800 | 807002 x10 |
| 36001103 | 19800 | 807002 x15 |
| 36001104 | 32800 | 807002 x15、101500 x500、472002 x1 |

客户端 `AccRechargeActCmd` 编码 `pb_acc_recharge_award_req`；`AccRechargeActMgr` 的成功回调按 `pb_res_to_client` 解码并交给 `AwardKit.Parse`。领取状态从登录模块 106 的 `pb_acc_recharge_list.list[]` 读取，每项按 `act_id` 对应一条 100 字节 `award_state`。客户端通过 `Core.BitBlock` 读取该状态，位索引为 `award_tid % 100`（0-based、每字节 MSB-first）；2026-10-31 已修正首版把它当作逐档字节数组的实现，见下节。

## 实现

- `personal-server/config/game-tables.mjs` 新增读取 `AccRechargeActTable.Award`。
- `personal-server/game/acc-recharge-service.mjs` 实现 98620：
  - 校验活动 `type=106`、奖励与活动 `version` 一致。
  - 从登录模块 19 的 `res_recharge_login.total_amount` 读取累计充值。
  - 在同一 SQLite 事务中发放 `pb_res_to_client` 奖励、写入 `activity_claims`（period 为 `v<version>`）并更新模块 106 的 `award_state`。
  - 重复领取返回 310；累计充值不足返回 311。
- `personal-server/game/gateway.mjs` 在活动只读接口之后增加 98620 路由，成功记录 `acc_recharge_committed`，业务拒绝记录 `acc_recharge_rejected`。
- `personal-server/test/acc-recharge-service.test.mjs` 覆盖真实配置、前三档领取、重复领取、额度不足、模块 106 持久化、数据库重开后的幂等，以及真实 TCP 握手和 98620 网关路由。

## 验证

- `node --test test/acc-recharge-service.test.mjs`：2/2 通过。
- `npm test`（`personal-server`）：167/167 通过。
- 使用本次部署前 SQLite 一致备份的副本模拟真实账号：
  - 初始 `total_amount=20400`，模块 106 为空，807002 为 0。
  - 36001101、36001102、36001103 分别返回 807002 的 `10/10/15`，累计到 35。
  - 再次领取 36001101 返回 310；36001104 返回 311。
  - 模块 106 的 100 字节状态前三位为 `1,1,1`，其余为 0；`activity_claims` 为 3 行。
  - 关闭并重新打开数据库后再次领取返回 310，领取记录保持 3 行。

证据目录：`analysis/experiments/private-server-20261025/p3/acc-recharge-claim-20261030-133204/`。其中 `simulation-check.local-only.json` 保存上述副本结果。

## 部署

- 部署前一致备份：`game.before-acc-recharge.local-only.sqlite`，`integrity_check=ok`、`user_version=5`，SHA256 `72fff34983e8c006bef06e052305e17a62eafb2049ade324f022d4e36508f973`。
- 旧服务 PID 38844，首次部署为 PID 32572，启动时间 `2026-10-30T05:33:14.361Z`。
- 部署后 `05:39:59Z` 服务又启动了一次（PID 36532），原因未记录；当前实时状态以 `server.local-only.json` 为准，启动时代码已晚于本次修改。
- 18880/18881/18882/18883/19090 五端口均由当前服务监听且仅绑定 `127.0.0.1`。
- 隔离客户端在 `05:33:45.507Z` 及 `05:40:02.156Z` 自动重连，均完成 145 个模块的登录初始化；未重启或操作客户端。
- 部署后真实库仍为 0 条 106036 领取记录、模块 106 空、807002 为 0；副本测试未写入运行库。
- 本次不修改 APK，不需要更新 `apk/README.md` 或 APK 快照。

## 待用户验收

由用户在累充活动界面点击领取。验收时应确认客户端不再弹出“服务器错误”，奖励展示或背包出现对应 807002，且日志出现 `acc_recharge_committed`。领取后应核对 `activity_claims`、模块 106 和 807002 数量；未发生真实客户端领取前，只能记为服务端部署与副本验收完成。

## 2026-10-30 百元累充 92001 领取修复

用户继续点击“累充宝藏”后仍报错。真实请求在 `13:11:55.883Z` 到达，命令为 `92001 req_hundred_acc`、`seq=45`、负载 9 字节，ETF 解码为 `[1]`（原始 payload head `g2wAAAABYQFq`）。旧网关返回 `err=-1 LOCAL_NOT_IMPLEMENTED:92001`。这与已经实现的 `98620` 是两套不同累充活动：`92001` 对应登录模块 166、`HundredAccMgr`，配置在 `HundredAccTable.Group/Reward`。

当前账号模块 19 的 `res_recharge_login.total_amount=20400`（分），满足首档 100 元，对应奖励 `101500 x100`。`HundredAccTable.Group` 共 10 档，门槛为 100、600、3000、9000、18000、30000、50000、70000、100000、150000 元。

### 实现

- `personal-server/config/game-tables.mjs` 读取 `HundredAccTable` 的 `Group` 和 `Reward` 表。
- `personal-server/game/hundred-acc-service.mjs` 实现 `92001`：校验档位与累计充值，按 `Group.amount * 100` 比较登录模块 19 的总充值；在同一 SQLite 事务中发放奖励、写 `activity_claims`（`act_id=92001`、`period=hundred_acc`、`task_id=group_id`）并更新登录模块 166。
- 模块 166 的 `pb_hundred_acc.reward_list[]` 写入 `group_id`、`day_index`、`reward_id_list=[group_id]`、`reward_time`；首次领取补 `start_time`。重复领取返回 310，累计充值不足返回 311。
- `personal-server/game/gateway.mjs` 增加 ETF 解码、`92001` 分发、`pb_res_to_client` 回包，以及 `hundred_acc_committed` / `hundred_acc_rejected` 日志。
- `personal-server/test/hundred-acc-service.test.mjs` 覆盖配置首档、奖励变化、重复领取、额度不足、模块 166 持久化、SQLite 重开和真实 TCP 网关路由。
- 独立 worktree：`F:\projects\FateCovenantClone\.worktree\acc-recharge-claim-fix`，分支 `feature/acc-recharge-claim-fix`，基于 `94fd5dd`。

### 验证与部署

- `node --test test/hundred-acc-service.test.mjs`：2/2 通过。
- `npm test`：170/170 通过。
- 真实账号一致备份副本仿真：初始 `total_amount=20400`、模块 166 为空、`101500` 为 430；首档领取后 `101500` 变为 530，模块 166 写入首档记录，副本重复领取返回 310、第二档返回 311；关闭并重开数据库后重复领取仍为 310。证据为 `analysis/experiments/private-server-20261025/p3/hundred-acc-claim-20261030-212522/simulation-check.local-only.json`，源备份 SHA256 `5356d7b5685df735dcca620b5816b92134a826e61aa08bf9b2703469a766c5cb`。
- 部署前另做一致备份 `game.before-deploy.local-only.sqlite`，`integrity_check=ok`、`user_version=5`，SHA256 与上述副本源一致；真实运行库当时 `92001` 领取 0 条、模块 166 为空、`101500=430`。
- 服务从 worktree 启动：旧 PID 38688，新 PID 6028，启动时间 `2026-10-30T13:33:03.495Z`；18880/18881/18882/18883/19090 五端口均仅由该进程监听在 `127.0.0.1`。未改 APK，不需要更新 `apk/README.md` 或 APK 快照。

### 待用户验收

用户在累充宝藏首档再次点击领取。验收需观察日志出现 `command type=92001`、`hundred_acc_claim_committed` 和 `hundred_acc_committed`，并核对 `activity_claims` 新增 `task_id=1`、模块 166 首档记录和 `101500` 从 430 增加到 530。真实点击发生前只能记为组件测试、副本验收和部署完成。

### 已知边界

该账号当前仅达到首档，首档奖励类型已由现有 `grantResources` 支持并完成副本验证。较高档位含 `res_type` 3200、10、8、12 等资源，现有通用发放器尚未覆盖这些专用资源类型；提升到对应档位前仍需按实际物品类型补实现，不影响本次首档领取报错修复。

## 合并回 main

将 worktree 中 4 个实际变化文件同步回主工作树 `main`：`personal-server/config/game-tables.mjs`、`personal-server/game/gateway.mjs`、`personal-server/game/hundred-acc-service.mjs`、`personal-server/test/hundred-acc-service.test.mjs`。四份文件与已部署 worktree 的 SHA256 逐项一致；主目录重新执行 `node --test test/hundred-acc-service.test.mjs` 为 2/2，通过 `npm test` 为 170/170。主工作树原有未提交改动保留，未做 Git 提交或清理。

## 2026-10-31 累充领取状态位误读修复

用户反馈累充活动档位仍显示可领取，点击后却显示“未解锁”。本轮在独立 worktree `F:\projects\FateCovenantClone\.worktree\acc-recharge-unlock-fix`（分支 `feature/acc-recharge-unlock-fix`，基线 `b1650fc`）调查并修复。未修改或重启当前运行中的服务。

### 根因

客户端 `AccRechargeActData` 通过 `FAward:GetAwardState(idx)` 读取模块 106 的 `award_state`，`FAward` 再调用 `Core.BitBlock:Get(idx)`。`idx` 为配置的 `award_tid % CONFIG_TID_INTERVAL`，工程反编译证据显示 `CONFIG_TID_INTERVAL = 100`；BitBlock 的下标从 0 开始，并在每字节内按 MSB-first 排列。因此前三档 `award_tid=36001101/36001102/36001103` 对应位 `1/2/3`，正确的前四字节应为 `70 00 00 00`。

2026-10-30 首版实现把 `award_state` 当成“一档一个字节”，写入 `awardState[slot - 1] = 1`。前三档因此写成 `01 01 01 00`。客户端按 BitBlock 读取时，这些字节设置的是无关的位 7/15/23，位 1/2/3 仍未设置，所以界面继续显示可领取。点击后服务端又按同一错误字节数组判断重复领取，返回业务错误 `310 Reward already claimed`；客户端将这次服务端拒绝显示为用户看到的“未解锁”。

运行日志 `events.jsonl` 在 2026-10-30 16:30-16:32 多次记录 `acc_recharge_rejected`，`code:310`、`message:"Reward already claimed"`；故障是已领取状态位没被客户端读懂，不是累计充值额度不足（311）或活动时间未开放。

当前运行库的模块 106 已确认与该症状一致：活动 `106036` 与 `106037` 各有 3 条 `activity_claims`（任务分别为 `36001101-3`、`37001101-3`，period 分别为 `v36`、`v37`），两条 `award_state` 的前四字节都是 `01 01 01 00`。

### 修复

- `personal-server/game/acc-recharge-service.mjs` 改用现有的 `hasBit` / `setBit`，按 BitBlock 的 0-based、MSB-first 规则判断和写入领取位。
- 服务构造时调用幂等的 `repairAwardStates()`：从 `activity_claims` 中按活动当前 `v<version>` period 恢复位状态；只有重建结果与旧状态不一致时才在事务内更新模块 106。旧运行库中的 `106036`、`106037` 会在部署后的服务启动时自动修复，无需手工改库。
- `personal-server/test/acc-recharge-service.test.mjs` 断言前三档为 `70 00 00 00`，并新增“旧字节下标状态在重开时从 claims 修复”的回归测试。

### 验证

- `node --test test/acc-recharge-service.test.mjs`：3/3 通过。
- `npm test`：176/176 通过。
- 用 SQLite `-readonly` 备份当前运行库到临时副本后直接实例化修复后的服务：修复前两条状态均为 `01010100`，位 1/2/3 全为 false；修复日志只记录 `106036`、`106037` 两个活动，修复后均为 `70000000`，位 1/2/3 全为 true。运行中的原库未改动（`activity_claims` 仍为 6 条，模块 106 仍由真实服务持有）。

当前服务 PID 24124 及五个 loopback 端口保持运行，未部署、未重启。实际生效需要在用户结束当前游玩后从本 worktree 重启一次服务，并让客户端重新登录以刷新模块 106；启动时的修复会自动纠正现有活动状态。修复只涉及服务端，不修改 APK。
