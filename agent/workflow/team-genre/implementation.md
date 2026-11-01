# 热门阵容 TeamGenre 领取

## 实际故障

2026-11-01 用户点击热门阵容的 20 钻石领取后，客户端发送 `91402 req_team_genre_quick_award`。实时事件日志中的请求体为 ETF 整数 `54`，随后重试为 `54`、`52`；旧服务没有注册 `91402`，因此每次都返回 `unsupported_command`。

证据：`analysis/experiments/private-server-20261025/p3/runtime.local-only-data/events.jsonl` 中 `2026-11-01T04:29:16.739Z`、`04:29:18.037Z`、`04:29:19.193Z`。

## 客户端协议

- `91401 req_team_genre_award`：请求体为 ETF 二进制包装的 `pb_team_genre_award_req { team_id, award_id }`，响应为 `pb_res_to_client`。
- `91402 req_team_genre_quick_award`：请求体只有流派类型 ETF 整数，响应为 `pb_team_genre_award_rsp { team, award }`。
- `91403 req_team_genre_get_info`：无请求参数，响应为 `pb_team_genre_role { genre_list }`。
- `pb_team_genre { team_id, receive_award(bytes), cycle_id }`。
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
