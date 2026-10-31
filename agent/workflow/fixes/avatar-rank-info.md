# 点击头像时报服务器出错

2026-10-31：在 `.worktree/avatar-profile`、分支 `feature/avatar-profile` 实现并验证。创建基线为 `f32e4ac`，随后 rebase 到最新 `main`（`5e354e7`），保留同期充值修复。状态为服务端组件及临时 TCP 验证通过，尚未合入主分支或部署，APK 界面待验收。

## 根因与证据

用户点击大厅头像时，`runtime.local-only.data/events.jsonl` 中出现三次 `2001 get_rank_info`：

| UTC 时间 | seq | 旧响应 |
| --- | --- | --- |
| 2026-10-31T10:22:39.820Z | 46 | `unsupported_command`、`err=-1` |
| 2026-10-31T10:22:43.285Z | 48 | `unsupported_command`、`err=-1` |
| 2026-10-31T10:22:51.986Z | 49 | `unsupported_command`、`err=-1` |

三次 ETF 请求相同：14 字节、Base64 `g2wAAAACYTViAAGGoWo=`，解码为 `[53,100001]`。旧网关返回 `LOCAL_NOT_IMPLEMENTED:2001`，客户端因此弹出服务器错误。

静态契约见 `agent/workflow/interface-catalog/tcp-commands.md` 的 `2001 get_rank_info`：ETF 请求、`rank_info` Protobuf 响应。已有客户端字节码分析定位到 `RoleInterfaceForm` 打开时调用 `RankMgr:ReqSelfRankInfo(SwapArenaMgr.GetRankId())`，`RankTable` 将 53 定义为 `TID_RANK_SWAP_ARENA`。分析临时产物保留在 `analysis/tmp/avatar-rank-decompile/`，本轮复用既有结果。

响应 schema 来源为 `analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__protobuf.bundle/textassets/18016158660931916000-rank.net.proto.bin`：`id`、`rank_id`、`rank`、`value`、`extra`。

## 实现与边界

- `personal-server/game/rank-service.mjs` 新增 `2001`，复用现有网关排名路由。
- 请求须包含两个正的安全整数 `[rankId, roleId]`；非法参数返回业务错误 1。
- 当前没有本地竞技场榜单记录，按已有空榜策略返回请求中的角色和榜单 ID、`rank=0`、`value=0`、空 `extra`，不生成竞争排名。零值在 Protobuf 中可省略，解码校验采用默认值语义。
- 读取不写入存档，不改变 `2000/2008/2011` 行为；不包含头像更换、改名或竞技场玩法实现。

## 验证与复现

在 worktree 根目录执行：

```powershell
node --test personal-server/test/rank-service.test.mjs
node --test --test-name-pattern "gateway authenticates locally" personal-server/test/hero-progression.test.mjs
npm test --prefix personal-server
```

- 排名单元测试 5/5，通过目标 ID 保留、未上榜响应、捕获 ETF 列表以及参数校验。
- 网关回归使用临时 SQLite 和 loopback 临时端口完成握手、登录，发送上述原始 14 字节请求，校验 seq、无错误响应和 `rank_info` 解码；日志出现 `rank_sent type=2001`，无 `unsupported_command type=2001`。非法请求返回 `rank_rejected code=1`。
- 更新到当前基线后的全量测试为 **264/264 通过**。完整输出：`analysis/experiments/private-server-20261025/p3/avatar-rank-info-20261031/tests.local-only.log`。
- worktree 的 `analysis/` 和 `personal-server/fixtures/` 使用指向主工作树本地资料的 Junction；依赖通过 `npm ci --prefix personal-server` 安装。

## 部署与验收状态

本轮未启停共享服务、未操作客户端或 ADB、未修改 APK。检查期间其他会话更新过运行实例，因此不能用当前服务 PID 或重连记录证明头像修复已经生效。

后续将本分支集成部署后，由用户再次点击大厅头像；核对 `command type=2001` 后为成功回包和 `rank_sent`，头像页正常显示且不再弹出服务器错误，才可记录真实 APK 验收通过。当前不涉及 APK 构建或快照更新。
