# Git 工作区整理记录

## 2026-11-01 server launcher

- `scripts/run.bat` calls `scripts/run-server.ps1` and starts the server from the checkout that owns `main`, so invoking it from another worktree cannot accidentally launch stale code.
- The launcher is idempotent: it checks that the published `server.local-only.json` PID still belongs to a live `node.exe` before starting another instance.
- Missing locked dependencies are installed with `npm ci`; startup logs stay in `runtime.local-only.data` as timestamped `.local-only.out.log` and `.local-only.err.log` files.
- When the MuMu ADB device is available, the launcher restores only the four required `adb reverse` mappings (`18880/18881/18882/19090`). It does not install device NAT rules.

## 2026-10-30 当前检查点

- 整理开始时 `main` 为 `238f6d8`，没有 stash；工作区包含大量已暂存的项目文档、协议目录、服务端修复、测试和少量根目录临时产物。
- 将可保留的项目记忆、接口目录、交接文档和忽略规则提交为 `46337fb`。
- 将已通过测试的服务端充值、QuickSDK 失败反馈、商城初始化、代金券抵扣、百元累充和对应测试提交为 `6ca343d`。
- 将 Lua 字节码 offset 工具提交为 `b424d9c`，将隔离 APK 的本机 SDK 支付回调补丁提交为 `274304e`。
- `feature/activity-fixes` 的钓鱼岛解锁是唯一确实未进入 `main` 的功能实现；解决配置表与网关冲突后以 `e938f0f` 合并。
- 合并后执行 `npm test --prefix personal-server`，结果为 **175/175 通过**。

## 分支核对

| 分支 | 结论 |
| --- | --- |
| `feature/activity-fixes` | 已合入 `main`，包含钓鱼岛状态持久化、首次解锁奖励及协议测试。 |
| `feature/acc-recharge-claim-fix` | 分支提交已在 `main`；脏工作区中的 service/test 与当前实现一致，网关只有 4 行旧实现，没有新增内容需要回收。 |
| `feature/gift-self-select` / `feature/welfare-gift-fix` | 提交号未成为祖先，但选择宝箱、福利领取、礼包购买代码和说明文件均已在 `main`，无需重放旧分支。 |
| `feature/stamina-task-fix` | 对应体能任务配置代码和测试已在 `main`；旧分支无需再次合并。 |
| `feature/voucher-mail` | 对应购买记录持久化和 remove-operate-display 回执已在 `main`。 |
| `character-skills`、`recruit-hero-grant`、`recruitment`、`reward-claims-inventory` | 已由祖先提交包含在 `main`。 |

`recruit-hero-grant` worktree 仍保留 7 个未跟踪的临时 Lua 分析脚本；没有已验证的实现改动需要合并。`.worktree/`、根目录 scratch JSON、空文件 `$out` 和 `backup.ab` 已加入忽略，未删除。

## 验收边界

- 本次不修改 APK，未操作设备或服务，不需要更新 APK 快照。
- 上述验收为组件、数据库与真实本机 TCP 网关测试，不把测试通过扩大为真实客户端视觉验收。

## 2026-10-30 22:49 部署

- 已停止旧实例并从 `main`（`b1650fc`）启动最新服务，运行 `PID 37484`，五个端口均只监听 `127.0.0.1`。
- 启动前重新执行 `npm test --prefix personal-server`，**175/175 通过**。
- 健康检查通过：管理页与 `/api/state` 返回 200，启动版本文件返回 200，SDK/区服/管理/游戏网关均可建立 TCP 连接。
- 实时 PID 与端口以 `analysis/experiments/private-server-20261025/p3/runtime.local-only.data/server.local-only.json` 为准；启动日志为同目录 `server-latest-20261030-2249.local-only.*.log`。
