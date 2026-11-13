# 阵容推荐收集度奖励实现

日期：2026-10-31

## 目标

补齐“阵容推荐 → 收集度达成”奖励领取命令 `88801 req_team_suggest_award`。实现位于独立 worktree：

- 路径：`F:/projects/FateCovenantClone/.worktree/recommend-lineup-collection-award-20261031`
- 分支：`feature/recommend-lineup-collection-award-20261031`
- 基线：`main` / `a6fa7f8`（rebase 到最新主分支）

## 协议与客户端证据

- 系统名是 `TeamSuggest`。`HeroDataMgr.ParseLogin` 将登录模块 10 的第 8 项（Lua 1-based）解析为 `pb_hero_team_suggest`，即 JS 下标 7。
- 静态命令目录：`88801 req_team_suggest_award`，ETF 请求；响应 `pb_res_to_client`。
- `TeamSuggestCmd.req_team_suggest_award` 使用 `Codec.EncodeErl`。`TeamSuggestMgr.ReqGetAward` 构造的请求表依次为 `{ awardTid, teamTid }`。
- `TeamSuggestAwardNode` 点击时传入当前未领取奖励的 `tid` 和当前推荐队伍 `teamTid`。
- `pb_hero_team_suggest` 字段：`select=1`、`collects=2`、`collect_award=3`、`stages=4`。
- `collects[].type` 使用 `TeamSuggest.tid`；`collects[].progress[i]` 是推荐英雄星级加 1。
- `collect_award` 是按队伍类型排序的 BitBlock 列表，位号为 `awardTid % 100`。
- `GetProgressByTeamTid` 的公式为：每个推荐英雄取 `star + 1`，除以每个英雄 `target_star + 1` 的总和，再向下取整为百分比。

关键证据：

- `analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__protobuf.bundle/textassets/12655761722772107000-team_suggest.db.proto.bin`
- `.../textassets/4474495167612463000-TeamSuggestMgr.lua.bin`
- `.../textassets/10732553770041820000-TeamSuggestCmd.lua.bin`
- `.../textassets/16687156807218825000-TeamSuggestAwardNode.lua.bin`
- 配置表：`HeroTable.data.lua.json` 中的 `TeamSuggest`、`TeamSuggestAward`、`TeamSuggestType`、`TeamSuggestTeamType`。

## 实现内容

- `personal-server/config/hero-tables.mjs` 增加四张 TeamSuggest 配置表。
- 新增 `personal-server/game/team-suggest-service.mjs`：
  - 登录时生成 12 条推荐队伍的 `collects`，进度按当前英雄星级计算并封顶到目标星级。
  - 保留已有 `select`、`stages` 和 `collect_award` 中已有位。
  - 从 `reward_claims`（`claim_type=team_suggest`）恢复已领取位。
  - 88801 按队伍类型顺序领取奖励，校验收集百分比，事务内写入领取记录并调用 `grantResources`。
  - 发奖成功后重写模块 10 下标 7，返回 `pb_res_to_client`。
  - 支持客户端实际使用的 `{awardTid, teamTid}` ETF 二元组，并对反向/带 type 的形式做配置校验。
- `personal-server/game/gateway.mjs` 在登录时同步 TeamSuggest，并路由 88801。
- 新增 `personal-server/test/team-suggest-service.test.mjs`。

## 验证

- 专项测试：`node --test test/team-suggest-service.test.mjs`，5/5 通过。
- 全量服务测试：`npm test`（worktree 的 `personal-server`），335/335 通过。
- 已覆盖：登录 12 条 collect、进度公式、10%/20% 连续领取、按配置发奖、BitBlock 位、重复领取拒绝、跨档跳领拒绝、进度不足拒绝、SQLite 重开持久化，以及真实 TCP 88801 请求/响应。

## 边界

- 本次没有部署到运行中的服务，也没有操作模拟器或 APK；因此只完成服务组件与真实 TCP 集成验收，不记为 APK 实机验收。
- `88802 req_team_suggest_active` 和 `88803 req_team_suggest_select` 当时不在本次范围，
  后于 2026-11-13 补齐，见下节。
- 奖励内容严格取 `TeamSuggestAward.award` 配置；当前 20% 档（`awardTid=102`）配置为 `[[31002,3]]`，没有硬编码“20 星钻”。
- worktree 内的 `analysis/` 和 `personal-server/fixtures/login-modules.local-only.json` 是本地测试前置，不提交。

## 2026-11-13 补齐激活与选择

本轮在 `.worktree/full-service-p1-20261113` 补齐上节遗留的两条命令：

- `88802 req_team_suggest_active` 按 `pb_hero_team_suggest_active` 解码。服务端读取
  `TeamSuggest.tid`，拒绝未配置队伍、空英雄列表、非本推荐队伍英雄、重复英雄和超过
  `Hero.max_star` 的目标星级；随后忽略客户端自报进度，按 SQLite 角色英雄真实星级重算
  完整 `pb_hero_team_suggest_collect`，同事务更新模块 10 下标 7 的收集度。
- `88803 req_team_suggest_select` 按 ETF 单整数队伍 id 解码，校验 `TeamSuggest` 行后保存
  `select`，返回完整 `pb_hero_team_suggest`；重开 SQLite 后选择仍保留。
- `88801` 保持原有 ETF `{awardTid, teamTid}` 领奖行为，因此三条命令共用同一登录快照和
  领取位状态。

验证使用临时 SQLite、源码和真实本机 TCP，不读写线上数据库：

- `node --test test/team-suggest-service.test.mjs`：7/7 通过，覆盖服务校验、权威进度、
  SQLite 重开和 `88801–88803` 的真实网关往返。
- `npm run audit:command-dispatch`：服务路由由 1316 增至 1318，未路由由 67 降至 65。
- `npm run check:command-dispatch`：1407 条目录与 checked-in 审计一致。

仍未操作线上服务、模拟器/ADB/APK，因此只记为服务端与真实 TCP 验收，不记为 APK 视觉
验收。
