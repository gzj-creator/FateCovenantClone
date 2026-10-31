# 排行榜协议扩展（2026-10-31）

本工作在 `.worktree/avatar-profile`、分支 `feature/avatar-profile` 完成，接续大厅头像触发的 `2001 get_rank_info` 修复。

## 根因与客户端契约

排行榜主列表此前只接入 `2000/2008/2011`，头像页另补了 `2001`；其余排行榜入口仍会落入网关的 `unsupported_command`。客户端 `RankMgr.lua`、`RankCrossMgr.lua` 和对应 Form 的字节码确认了以下参数：

| type | 客户端接口 | 请求 | 本地响应 |
|---|---|---|---|
| 2002 | `get_rank_top_data` | `[rankId, showCount]` | 保留 `rankId` 的空 `rank_to_client` |
| 2005 | `get_rank_cross_top` | `[rankId, showCount]`，实际调用量 3 | 空 `pb_rank_cross_group_top.top_list` |
| 2006 | `batch_get_personal_rank_first` | 榜单 ID ETF 列表 | 以首个 ID 为 `rank_id` 的空 `rank_to_client` |
| 2007 | `get_appoint_rank` | `[rankId, roleId]` | 保留两个 ID 的未上榜 `rank_info` |
| 2009 | `update_rank_bubble` | 已裁剪的字符串 | 空 ETF 成功回包，提示写入本地档案 |
| 2010 | `req_batch_get_rank` | `[roleId, rankIdList]` | 每个请求榜单一条未上榜 `rank_info` |

证据来自 `analysis/reports/private-client-16448/lua-bundles/candidate/decoded/` 下的 `RankMgr.lua.bin`、`RankCrossMgr.lua.bin`、`RankUILogic.lua.bin`、`HunterArenaPeakDuelForm.lua.bin` 和 `CrossEntranceForm.lua.bin`。`rank.net.proto` 确认了 `rank_to_client`、`rank_info`、`pb_rank_cross_group_top` 与 `pb_rev_rank` 的字段。

## 实现边界

- `personal-server/game/rank-service.mjs` 现在声明并处理 `2000/2001/2002/2005/2006/2007/2008/2009/2010/2011`。
- 当前数据库只有本机角色，没有已验证的其他玩家、结算名次或跨服榜数据。因此榜单返回明确空列表，个人查询返回 `rank=0/value=0`；不会伪造玩家、名次、积分或奖励。
- 榜单查询不写存档。`2009` 校验非空且最多 56 个字符，提示保存在角色 metadata 的 `rankBubble`，后续 `rank_to_client.bubbles` 会带回；这是单角色本地服的持久化，不冒充其他玩家的气泡。
- `4031/4032` 是竞技场匹配接口，不属于本轮排行榜查询面，未纳管。

## 验证

```powershell
node --test personal-server/test/rank-service.test.mjs
node --test --test-name-pattern "gateway authenticates locally" personal-server/test/hero-progression.test.mjs
npm test --prefix personal-server
```

- 单元测试覆盖所有新响应 schema、ID 保留、批量列表去重、嵌套 ETF 参数、56 字符边界和非法参数。
- 临时 loopback TCP 网关完成真实握手与登录，逐条发送 `2002/2005/2006/2007/2010`，并发送 `2009` 后从下一张 `2000` 榜单读回提示。日志均出现 `rank_sent`，上述排行榜类型均无 `unsupported_command`。
- 全量结果为 **267/267 通过**。完整输出：`analysis/experiments/private-server-20261025/p3/leaderboard-api-20261031/tests.local-only.log`。

本轮未停止共享服务、未部署、未操作客户端或 ADB，也未修改 APK。真实 APK 仍需在合并部署后逐个打开排行榜入口验收；空榜显示和用户气泡持久化也需视觉确认。
