# BATTLE-MARTIALCLUBACT 实施记录（武馆活动奖励）

日期：2026-11-08。分支 `task/A2-MARTIAL-20261108`（基线 main 8ebd5a1），worktree
`.worktree/gameplay-20261108/a2-martial`。只做服务端实现与静态自检：未启停实时服务、未读写运行
数据库、未操作模拟器/ADB/APK、未连接原游戏服务器。

## 任务范围

任务卡 `docs/plans/remaining-gameplay-20261106/01-battle.md` 的 `## BATTLE-MARTIALCLUBACT`：
模块 `MartialClubActCmd`，2 条命令此前未路由。

| type | 命令 | 请求 / 回包 | 本次状态 |
| ---: | --- | --- | --- |
| 84431 | `req_martial_act_pass_team_award` | etf `[bossId]` → `pb_martial_club_act_pass_award_rsp` | 已实现发放链路与领取位；本版配置 `first_award` 全为空，因此按 fail closed 拒绝（见缺口 1） |
| 84432 | `req_martial_act_server_award` | etf `[bossId?]` → `pb_martial_club_act_server_award_rsp` | 已实现（按 `server_award` 真实发奖 + `got_server_award` 位块） |

代码：`personal-server/game/martial-club-act-service.mjs`（新增）、`personal-server/game/gateway.mjs`
（纯增量：import、实例、84431–84432 派发块）。

## 配置与协议证据

- `MartialClubActTable`（`personal-server/assets/tables/MartialClubActTable.data.lua.json.gz`，本次新提取）：
  10 行，每行 `tid`、`first_award`、`server_award`。**全部 10 行的 `first_award` 都是空字面量**，
  `server_award` 携带真实奖励（例如首行 `[[179002,20]]` 形态由读取器校验为 `[tid,count]` 对）。
- `martial_club_act.db.proto.bin`：`pb_role_martial_club_act{got_server_award, got_pass_award}`（两个位块）。
- `martial_club_act.net.proto.bin`：`pb_martial_club_act_pass_award_rsp{res_change, got_pass_award}`、
  `pb_martial_club_act_server_award_rsp{res_change, got_server_award}`、登录块
  `pb_martial_club_act_login_data{award, roles[{boss_id, role_id[]}]}`。**没有请求消息定义**。
- `MartialClubActMgr` 常量：`passAwardGetState`/`serverAwardGetState` 位块、`ReqGetPassAward(bossId)`、
  `ReqGetServerAward`、`IsPassAwardGot`/`IsServerAwardGot`/`CanGetServerAward`。据此确定两条命令都是
  领取型：个人首通位块 + 全服位块，互不复用。
- `MartialClubActCmd` 常量显示 `req_martial_act_pass_team_award` 用 `EncodeErl`（ETF），
  `req_martial_act_server_award` 走 `EncodePB` 但**没有可恢复的请求 schema 字符串**；任务卡的
  schema 表把两条都记为 etf，本次按任务卡与 ETF 解码实现，并在 `implementation` 记为证据差异。

## 状态与发放语义

`martial_club_act_role`（幂等建表）：`role_id`、`got_pass_award`、`got_server_award`、`updated_at`。
两个位块以 boss tid 作为位号。

- 84431：要求 `martial_club_role.pass_team_boss >= bossId`（组队通关进度由武馆组队结算写入），
  位块未置位才可领；奖励取 `MartialClubActTable.first_award`。
- 84432：要求该 boss 在本服“已通关”（任意角色 `pass_team_boss >= bossId`，单服语义），
  位块未置位才可领；奖励取 `MartialClubActTable.server_award`，无参数时一次结算全部可领 boss。
- 重复领取一律 `GameError(3)`；boss 不在活动表 `GameError(5)`；非法 tid `GameError(1)`。
- 奖励经由 `resources.grantResources` 走钱包/资源模块，未识别的奖励 id 会以 `GameError(5)` 整笔回滚。

## 缺口（fail closed 并记录）

1. `first_award` 在本版客户端全为空：84431 在任何 boss 上都会以
   `GameError(5, 'Martial club activity pass award configuration is empty for boss N')` 拒绝，
   不会用固定奖励或其它表的奖池顶替。
2. 登录块 `pb_martial_club_act_login_data` 由活动框架挂在 module 92 的 `module_login_data` 上；本卡只提供
   `loginPayload()`/`ensureLoginState()`，活动框架挂载未接线，属于缺口。
3. `req_martial_act_server_award` 的请求编码在客户端是 `EncodePB` 但 schema 未恢复，见上。

## 自检

`node --check` 覆盖 `martial-club-act-service.mjs` 与 `gateway.mjs`；`git diff --check` 无输出。
按要求未执行 `npm test`、未启动服务、未发 TCP 请求。
