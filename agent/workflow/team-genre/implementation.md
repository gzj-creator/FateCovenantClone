# 热门阵容 TeamGenre 领取

## 实际故障

2026-11-01 用户点击热门阵容的 20 钻石领取后，客户端发送 `91402 req_team_genre_quick_award`。实时事件日志中的请求体为 ETF 整数 `54`，随后重试为 `54`、`52`；旧服务没有注册 `91402`，因此每次都返回 `unsupported_command`。

证据：`analysis/experiments/private-server-20261025/p3/runtime.local-only-data/events.jsonl` 中 `2026-11-01T04:29:16.739Z`、`04:29:18.037Z`、`04:29:19.193Z`。

## 客户端协议

- `91401 req_team_genre_award`：请求体为 ETF 二进制包装的 `pb_team_genre_award_req { team_id, award_id }`，响应为 `pb_res_to_client`。
- `91402 req_team_genre_quick_award`：请求体只有流派类型 ETF 整数，响应为 `pb_team_genre_award_rsp { team, award }`。
- `91403 req_team_genre_get_info`：无请求参数，响应为 `pb_team_genre_role { genre_list }`。
- `pb_team_genre { team_id, receive_award(bytes), cycle_id }`。
- 字段名 `team_id` 在客户端实际传给 `GetCycleTid`，含义是主流派类型 TID（例如 `54`），不是 `StrategyTeamGenre` 的阵容 TID（例如 `5402`）。2026-11-01 真实客户端日志中的 `TeamGenreType(5104) is nil` 确认了该差异。
- `HeroDataMgr.ParseLogin` 的模块 10 第 9 个 Lua 槽位（数组下标 8）是 `TeamGenre`；模块 10 下标 7 仍由既有的 TeamSuggest 使用。

`TeamGenreMgr.ParseTeamGenrePb` 将每行写成 `collect_awards[team.team_id][team.cycle_id]`，位图来自 `team.receive_award`；快捷回包也按同一路径更新单行。

## 服务端实现

- `personal-server/game/team-genre-service.mjs` 读取并重建模块 10 下标 8。
- 新/旧规则由 `TeamGenreConst.rule_time_split` 与服务器开服时间决定，和客户端 `TeamGenreUtil.CheckIsNewGenreLogic` 一致。
- 每种主流派选择开服天数内已解锁、`unlock_open_day` 最大的周期；同一天按周期 TID 取配置中的后一项。当前服第 9 天，圣堂控制流选择 `5402`，与客户端截图一致。
- 收集度按当前周期 `TeamGenre.suggest_hero` 中玩家拥有的英雄数计算。
- `91402` 一次领取所有已达成且未领取的档位；当前 `TeamGenreAward` 每档发放 20 钻石 `101500`。
- 领取、资源和模块位图在同一 SQLite 事务中提交。`reward_claims` 使用 `claim_type=team_genre`、`claim_key=<cycle_id>:<team_id>:<award_id>` 防重。
- 位图按 award TID 写入；重复领取返回业务错误 `310`。

证据表：

- `TeamGenre`、`TeamGenreType`、`TeamGenreCycle`、`TeamGenreAward`、`TeamGenreConst` 来自 `analysis/reports/private-client-16448/.../HeroTable.data.lua.json`。
- 客户端函数证据来自同目录 `TeamGenreMgr.lua.json`、`TeamGenreUtil.lua.json` 和 `TeamGenreCmd.lua.json`。

## 验证

- `node --test personal-server/test/team-genre-service.test.mjs`：5/5 通过。
- 真实本机 TCP 用例走完整握手和登录，确认模块 10 下标 8 返回当前周期，`91402` 返回 `pb_team_genre_award_rsp`，3 档发放 60 钻石，重复请求返回 `310`；同时覆盖 `91401`、`91403` 和 SQLite 重开持久化。

上述验证属于组件与临时 TCP 验收。真实 APK 点击结果需部署后重新登录并点击热门阵容确认，页面成功反馈前不计用户验收。

## 2026-11-01 合并与部署

- `feature/team-genre-award-20261101` 已以快进方式合并到 `main`，提交 `6a7cba4 fix: implement team genre rewards`。
- 合并后的 `main` 上，TeamGenre 与原有 TeamSuggest 定向测试 `10/10` 通过，包括 `91402` 的真实本机 TCP 用例。
- 全量测试仍有任务、心愿树、礼包和若干网关既有用例失败；本次新增的 TeamGenre 用例均通过。其改动仅注册 `91401` 至 `91403`，未拦截其他命令。
- 部署前使用 `VACUUM INTO` 创建一致快照 `analysis/experiments/private-server-20261025/p3/team-genre-award-20261101/game.before-team-genre-deploy.local-only.sqlite`，376,832 字节，SHA-256 `DC709FA266F5E0BFB69A860756FCE569AD889D11E663F24888501D56D78D178D`，schema v10，`integrity_check=ok`。
- 服务于 `2026-11-01T07:17:22.159Z` 重启，PID `36616`，入口 `F:\projects\FateCovenantClone\personal-server\local-server.mjs`；五端口 `18880/18881/18882/18883/19090` 均由该 PID 监听且仅绑定 loopback，stderr 为空。
- 客户端随后在 `07:17:40.157Z` 自动断线重连，握手成功并在 `07:17:40.488Z` 完成 146 模块登录。
- 用户尚未在真实 APK 页面重新点击“圣堂控制流”的 20 钻石快捷领取，因此 UI 视觉验收仍待完成。成功标准为日志出现 `team_genre_command_committed type=91402`、无对应 `unsupported_command`、界面领取成功，且实时 SQLite 出现 `5402:5402:1..3` 并为钻石 `101500` 增加 60。

## 2026-11-01 客户端位图解析修正

- 真实客户端已正常发出 `91402`，服务端也到账并防重，但页面仍显示红点。设备日志定位到 `HeroTable.TeamGenreType(5104) is nil`，调用栈为 `TeamGenreMgr.InitTeamGenrePb -> GetCycleTid`。
- 根因是协议字段 `pb_team_genre.team_id` 尽管命名为 team，客户端实际把它当作主流派类型 TID（`51..59`）传给 `GetCycleTid`；首版错误写入了 `StrategyTeamGenre` 阵容 TID（`5104..5901`），使模块 10 登录解析在第一条记录中止。
- 登录模块与 `91402` 回包的 `team_id` 现统一写类型 TID，`cycle_id` 仍写周期 TID。旧版本已经落库的 `cycle:阵容:奖励` 领取流水继续兼容读取，避免对到账奖励重复发放。
- 新增覆盖登录记录的客户端形状，以及旧领取流水迁移的回归用例。TeamGenre 与 TeamSuggest 定向测试现为 `11/11` 通过。
