# BATTLE-PLAYMATCH 实施记录（玩法匹配 98900-98901）

日期：2026-11-08。分支 `task/A2-ARENA-20261108`，worktree
`.worktree/gameplay-20261108/a2-arena`。只做服务端实现与静态检查：未启停实时服务、
未读写运行数据库、未操作模拟器/ADB/APK，未跑 `npm test`。

## 任务范围

`PlayMatchCmd.lua` 只有两条命令，此前没有路由：

| type | 命令 | 请求编码 | 回包 | 状态 |
| ---: | --- | --- | --- | --- |
| 98900 | `req_play_match_start` | EncodeErl(nil) | ETF 回执 | 已实现（建排队票据） |
| 98901 | `req_play_match_cancel` | EncodeErl(nil) | ETF 回执 | 已实现（清票据） |

## 证据来源

- `PlayMatchCmd.lua.bin`：两个 `req_play_match_*` 都用 `Codec.EncodeErl`，没有 protobuf 请求。
- `PlayMatchMgr.lua.bin`：只挂了 `ReqPlayMatch`、`ReqCancelPlayMatch`、`RevStageChange` 三个空函数体，
  本构建里没有解析回包的分支；`personal-server/assets/protobuf` 也确实没有 `play_match.*.proto.bin`。
  因此回包用 ETF 整数元组，`log` 里带真实票据信息。
- 表数据：`PlayMatchTable` 经 `tools/extract-arena-tables.mjs` 提取为
  `personal-server/assets/tables/PlayMatchTable.data.lua.json.gz`；读取器 `readPlayMatchTables`。

## 用到的表字段

`Play`：`{tid:1, match_type:1, module:"play_cake", module_c:"PlayCakeMgr", data:"pb_cake_play", state_lib:1}`。
`PlayStateLib[1].state_list=[1,2,3,2,3,2,3,2,3,2,3,4]`。`PlayStateType` 4 行（`keep_time` 3/10/1/2）。
`Robot` 3 行（`rand_power:[1000,3000]`）。

## 权威状态（SQLite）

```sql
play_match_queue(role_id PK, play_tid, match_type, module, state, started_at, expires_at, updated_at)
```

匹配窗口时长按 `PlayStateLib[state_lib].state_list` 逐阶段累加 `PlayStateType.keep_time`
（当前配置合计 60 秒），重复开始会续期同一行，取消则删行。

## 失败关闭分支

`Play` 表为空、`state_lib` 缺失、某个阶段缺 `keep_time` 都报 `5`；`supports` 之外的 type 报 `1`。

## 未闭合缺口

- **回合推送缺失**：`module` 是 `play_cake`，真正的回合推进依赖 `PlayCakeMgr` 的状态推送，
  该推送的 type 与服务端权威状态没有证据，所以本服务只登记匹配票据与窗口，不伪造比赛阶段。
- **机器人对手**：`Robot.rand_power` 只有战力区间，没有阵容来源，未接入匹配。
- 回包格式是 ETF 整数元组（`[1, play_tid, keep, expires_at]` / `[0|1]`），因为客户端本构建里
  没有该命令的解析函数；恢复出真实回包 schema 后需要替换。
- 未做 APK 验收。
