# BATTLE-TOPARENA 实施记录（巅峰竞技）

日期：2026-11-08。分支 task/A2-MARTIAL-20261108（基线 main 8ebd5a1），worktree
.worktree/gameplay-20261108/a2-martial。只做服务端实现与静态自检：未启停实时服务、未读写运行
数据库、未操作模拟器/ADB/APK、未连接原游戏服务器。

## 任务范围

任务卡 docs/plans/remaining-gameplay-20261106/01-battle.md 的 BATTLE-TOPARENA：模块 TopArenaCmd，
18 条命令此前全部未路由。

| type | 命令 | 请求 / 回包 | 本次状态 |
| ---: | --- | --- | --- |
| 98500 | req_top_arena_pre_favorite | etf / — | 已实现：本服积分前 3 角色作唯一热门项（cross_id=0） |
| 98505 | req_top_arena_get_rank_reward | etf / pb_res_to_client | 已实现：RankReward 预览名次奖励，每赛季一次 |
| 98526 | req_top_arena_semi_server_help | pb_top_arena_server_help_req / pb_top_arena_server_help_rsp | 已实现：助力次数累加本服助力池，每日上限 help_max |
| 98527 | req_top_arena_semi_get_server_help_reward | pb_top_arena_server_help_reward_req / pb_top_arena_server_help_rsp | 已实现：HelpAward 阈值奖励 + 位块 |
| 98532 | req_top_arena_semi_get_server_help_res | etf / pb_res_to_client | 已实现：助力点按 help_exchange_ratio 兑换 exchange_item，每日限额 |
| 98560 | req_top_arena_final_attack | pb_top_arena_attack_req / pb_top_arena_attack_rsp | 已实现：决赛占领空擂台（无战斗模拟，缺口 3） |
| 98561 | req_top_arena_final_guess | pb_top_arena_guess_req / pb_top_arena_guess | 已实现：登记支持对象，结算未实现（缺口 4） |
| 98562 | req_top_arena_final_battle_record | pb_get_fight_report / pb_fight_report_res | 已实现：读 top_arena_fight 存下的真实战报 |
| 98563 | req_top_arena_final_get_rank_reward | etf / pb_res_to_client | 已实现：决赛名次奖励，每赛季一次 |
| 98564 | req_top_arena_final_get_server_rank | etf / pb_top_arena_get_server_rank_rsp | 已实现：本服总积分与队长（单服近似，缺口 2） |
| 98565 | req_top_arena_final_join | etf / pb_top_arena_semi_data | 已实现：写 joined/has_counted/groupId/area_tid |
| 98580 | req_top_arena_get_history | pb_top_arena_winner_history_req / pb_top_arena_winner_history_rsp | 已实现读取路径；无赛季结算故历届为空（缺口 5） |
| 98581 | req_top_arena_set_declaration | etf / pb_top_arena_history_win_info | 已实现：宣言落库，回包按 Cmd.lua 登记类型构造 |
| 98582 | req_top_arena_vote | etf / pb_res_to_client | 已实现：公示期点赞，PublicityConst 每日上限 + 达标发奖 |
| 98583 | req_top_arena_get_server_help | etf / pb_top_arena_server_help_info_rsp | 已实现：读本服助力池 |
| 98590 | req_top_arena_enter | etf / pb_top_arena_enter_rsp | 已实现：回本服擂台占用表 |
| 98601 | req_top_arena_publicity_server_award | etf / pb_res_to_client | 已实现：RankServerAward，名次 1，每赛季一次 |
| 98602 | req_top_arena_server_max_rank_award | etf / pb_res_to_client | 已实现：RankServerMaxAward，名次 1，每赛季一次 |

代码：personal-server/game/top-arena-service.mjs（新增，createTopArenaService）；表读取
personal-server/config/top-arena-tables.mjs 与表资产
personal-server/assets/tables/TopArenaTable.data.lua.json.gz（均在前序提交中落地）；gateway 为纯增量
（import、实例、98500-98602 派发块）。

## 协议与配置证据

- top_arena.net.proto.bin：请求 pb_top_arena_server_help_req{count}、
  pb_top_arena_server_help_reward_req{tid_list}、pb_top_arena_attack_req{group_id, area_tid, index,
  team_id}、pb_top_arena_guess_req{tid, support_obj_id, area_idx}、pb_top_arena_winner_history_req{term_list}；
  回包 pb_top_arena_favorite_rsp{favorite_list}、pb_top_arena_server_help_rsp{res, help_point,
  server_help_award}、pb_top_arena_server_help_info_rsp{help_point}、pb_top_arena_attack_rsp{area_data_list,
  role_top_arena_data}、pb_top_arena_enter_rsp{area_data}、pb_top_arena_area_changed{server_area_data_list}、
  pb_top_arena_get_server_rank_rsp{server_rank_list}、pb_top_arena_winner_history_rsp{now_term,
  history_wins_list}。
- top_arena.db.proto.bin：pb_top_arena_semi_data（18 个字段，含 score_list、server_help_award 位块、
  help_exchange 位块、is_help、got_server_award、got_max_server_award、has_counted）、
  pb_top_arena_guess{season, guess_list}、pb_top_arena_guess_info{tid, obj_list, is_got_award}、
  pb_top_arena_guess_obj{win_obj_id, is_win}、pb_arena_role_info{index, role_id, team_id, lode_time,
  scatter_tid, group_area_uid}、pb_server_top_arena_data{group_area_uid, role_list}、
  pb_top_arena_history_win_info{term, rank_list, arena_contribute_list}、pb_top_arena_score_info。
- fight_report.net.proto.bin：pb_get_fight_report{fight_id}、pb_fight_report_res{report}；
  fight.db.proto.bin 提供 pb_fight_report 本体，98562 用它把库里的战报字节解回对象再打包。
- res.net.proto.bin：pb_res_to_client 是 98505/98532/98563/98582/98601/98602 的回包载体。
- Cmd.lua 证据：TopArenaCmd.lua.bin 的字符串表给出 18 条命令名，c2s_back 把回包登记为上表类型；
  c2s_index 显示 98526/98527/98560/98561/98562/98580 走 EncodePB（protobuf），其余走 EncodeErl
  （ETF），与 gateway 派发块的分流一致。
- 登录模块：personal-server/fixtures/login-modules.seed.json 的模块 113 只解出一块
  pb_top_arena_tower_data，而 TopArenaMgr.LoginParse 期望 4 块（爬塔/海选/历史冠军/商店）。按证据缺口
  处理，本次不挂登录块，只保留 ensureLoginState()，见缺口 1。
- TopArenaTable.data.lua（提取后 30 张子表）：Act 10 行、Time 10 行、Stage 3 行、Area 9 行（stage 2，
  fight_tid 9730002-9730010）、RankType 10 行（10242 起）、RankReward 100 行、RankServerAward 42 行、
  RankServerMaxAward 30 行、HelpConst（progress_total 100000、help_tid 6601900、exchange_item
  [[1011000,100]]、exchange_count 150、help_max 300、help_count 100、award [[6701900,100],[101500,50]]）、
  HelpAward 5 行、HelpStage 3 行、GuessType 2 行、GuessAward 6 行、PublicityConst（role_like_cout 3、
  team_like_cout 1、role_like_award_list [[201500,5000]]、team_like_award_list [[201500,20000]]）、
  Const（help_exchange_ratio 200、max_fight_report 15、debuff_time 1200、challenge_state
  [[3,4],[5,6],[7,8]]）、RuleConst.enter_times 1。

## 状态与业务语义

SQLite（幂等建表）：top_arena_activity（单行 id=1，赛季/状态/起止时间/本服助力点）、
top_arena_role（角色权威状态：赛季、积分总和、joined、海选数据 JSON、竞猜 JSON、宣言）、
top_arena_claims（领取幂等键）、top_arena_ring（group_area_uid + slot_index 的擂台占用）、
top_arena_fight（战报 uid 与 report_hex）。

- 赛程：本项目没有取得巅峰竞技的活动帧表，改以 store.serverOpenedAt 为第 0 天锚定
  TopArenaTable.Time（day 0-4，state 1-10），周期 7 天；season 取 Act 的 tid 按周期轮转，state_id 取已
  过的 Time 行最大 tid。阶段由 Stage 行推导（1：state 1-3、2：state 3-8、3：state 9-10）。这是显式假设，
  记入缺口 2。
- 名次：98505/98563 的名次 = 1 + 本服同赛季积分总和更高的角色数；RankReward 的排行榜类型按
  Act 顺序与 RankType 顺序配对（假设，缺口 2）。
- 助力：98526 每次最多 help_count(100) 次，个人每日累计不超过 help_max(300)，累加到 top_arena_activity
  的 help_point 并置 is_help；98527 按 HelpAward 的 help_count 阈值发奖，位块位号取行序号（1 起）；
  98532 每次消耗 help_exchange_ratio(200) 点换 exchange_item，每人每日上限 exchange_count(150)，
  用 help_exchange 位块记录当天已兑换次数。日界按 UTC 懒刷新（help_day/help_day_count/help_exchange），
  与客户端 CrossDay 行为对齐。
- 决赛：98560 以 group_area_uid = group_id 100000 + area_tid 定位擂台，被他人占用返回 GameError(5)，
  否则写入占用并回 pb_top_arena_attack_rsp；scatter_tid 恒为 0（Scatter 与 Area 的映射未取得，缺口 6）。
  98561 校验 GuessType 与阶段后登记支持对象，重复提交返回 GameError(3)。98565 落 joined/has_counted、
  groupId 默认 1、area_tid 默认最小 Area。98564 用本服积分总和作为服务器积分，队长取本服第一。
- 公示：98582 需 stage 3；每日点赞次数上限 role_like_cout + team_like_cout，达到 role_like_cout 时发
  role_like_award_list，达到总上限时追加 team_like_award_list。98601/98602 分别按 RankServerAward /
  RankServerMaxAward 的 version（=当前赛季）取第 1 名段奖励，各每赛季一次，位标记落在
  got_server_award / got_max_server_award。
- 奖励全部经 resources.grantResources 发放，未识别 id 整笔回滚。

## 缺口（fail closed 并记录）

1. 登录块未接线：模块 113 只解出一块 pb_top_arena_tower_data，与 TopArenaMgr.LoginParse 期望的四块
   不符；ensureLoginState 已实现但未在登录流程调用，客户端登录后看到的巅峰竞技数据只能靠后续请求拉取。
2. 赛程与名次均为推导：开服日锚定 + 7 天周期 + Act 轮转、RankType 与 Act 按序配对、单服积分当作排名
   依据，都缺少活动帧表证据；跨服（group_id/cross_id/战区、真实服务器排名）未实现。
3. 决赛擂台战斗未实现：98560 只做占位登记，没有 pvp-battle 模拟、没有 debuff_time 重伤、没有防守方
   被踢下擂台与 pb_top_arena_fight_push_rsp 推送。
4. 竞猜结算与奖励未实现：GuessAward 发放、is_got_award、guess_list 的 is_win 都留待真实结算。
5. 历届冠军与宣言展示：没有赛季结算，98580 的历届列表恒为空，98581 只落库宣言并回空 rank_list /
   arena_contribute_list。
6. scatter_tid 与 Area 的映射未取得（Const.challenge_state 与 AreaCustom/Scatter 的关系未解），决赛擂台
   一律写 0。
7. RuleConst.enter_times(1) 未强校验：98590 进入次数没有计数。
8. 表现侧与主动推送未覆盖：req_top_arena_semi_next_area、req_top_arena_exit、爬塔（pre_fight 等）不在本卡
   的 18 条内；pb_top_arena_auto_flush_rsp / pb_top_arena_state_changed 等主动下发未实现，客户端靠下次
   请求懒刷新。

## 自检

node --check 通过 personal-server/game/top-arena-service.mjs 与 personal-server/game/gateway.mjs；
git diff --check 无输出；引用的 protobuf 消息名与 TopArenaTable 字段均已对照 assets 逐一核对。按要求未
执行 npm test、未启动服务、未发 TCP 请求、未读写运行数据库。