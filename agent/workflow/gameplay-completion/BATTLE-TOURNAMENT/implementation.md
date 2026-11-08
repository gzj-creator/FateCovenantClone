# BATTLE-TOURNAMENT 实施记录（巅峰对决/位面锦标赛）

日期：2026-11-08。分支 task/A2-MARTIAL-20261108（基线 main 8ebd5a1），worktree
.worktree/gameplay-20261108/a2-martial。只做服务端实现与静态自检：未启停实时服务、未读写运行
数据库、未操作模拟器/ADB/APK、未连接原游戏服务器。

## 任务范围

任务卡 docs/plans/remaining-gameplay-20261106/01-battle.md 的 BATTLE-TOURNAMENT：模块 TournamentCmd，
11 条命令此前全部未路由。

| type | 命令 | 请求 / 回包 | 本次状态 |
| ---: | --- | --- | --- |
| 88501 | req_tournament_clear_change | etf → 无回包 | 已实现：清零 base.score_change 与 score_cache |
| 88502 | req_tournament_day_award | etf [idx...] → pb_res_to_client | 已实现：按 DayTask（type 1）逐行发奖 + got_day_award 位块 |
| 88503 | req_tournament_season_award | etf [idx/tid...] → pb_res_to_client | 已实现：按 Level（type 1）段位奖励发放 + got_season_award 位块 |
| 88504 | req_tournament_palace | etf → pb_match_pvp_palace | 已实现读取路径；本赛季未结算，回空殿堂（缺口 2） |
| 88505 | req_tournament_fight | etf → pb_fight_response | 已实现真实 PvP 模拟 + 积分/名次/战报；对手阵容需部署注入（缺口 1） |
| 88506 | req_tournament_set_ignore | etf [bool] → 无回包 | 已实现：base.ignore_match_show |
| 88507 | req_tournament_set_read_report_time | etf [ts] → 无回包 | 已实现：base.read_report_time 单调前进 |
| 88508 | req_tournament_history_rank | etf → pb_hunter_arena_history_rank_rsp | 已实现：rank/score/season；hunter_arena 块留空（缺口 4） |
| 88509 | req_tournament_report_lock | protobuf pb_match_pvp_set_report_lock → 无回包 | 已实现：战报锁定落库并回写 base.fight_reports |
| 88510 | req_tournament_start_promote | etf → pb_tournament_role | 已实现晋级赛战斗与升段（缺口 1） |
| 88511 | req_tournament_enter_form | etf → pb_tournament_role | 已实现：按 Match.promote_bot + BotLib 生成晋级对手列表 |

代码：personal-server/game/tournament-service.mjs（新增，createTournamentService）、
personal-server/game/gateway.mjs（纯增量：import、tournamentRoster 选项、实例、88501–88511 派发块、
登录模块 150）。共享战斗由 personal-server/game/pvp-battle.mjs 提供（本卡未修改）。

## 协议与配置证据

- tournament.db.proto.bin：pb_tournament_role{base, promote[], stage, score_cache}、
  pb_tournament_promote{role_id（负数为机器人）, state, score}。
- tournament.net.proto.bin：登录块 pb_tournament_login{tournament, score, rank, season_state, palace}、
  跨天 pb_tournament_day_flush{res_change, tournament}、晋级赛 pb_tournament_promote_fight_rsp。
  该文件没有请求消息定义，与任务卡的「etf / —」一致。
- match_pvp.db.proto.bin：pb_match_pvp_base（got_day_award、got_season_award 两个位块、fight_reports、
  read_report_time、ignore_match_show、best_rank 等 25 个字段）。
- match_pvp.net.proto.bin：pb_match_pvp_fight_rsp{role_id, atk_change, def_change, def_base, palace,
  best_rank}、pb_match_pvp_palace、pb_match_pvp_set_report_lock{fight_uid, lock}。
- fight.net.proto.bin：pb_fight_response{report, rsp, stm{result, stm_data, exception}}；客户端
  MatchPVPNetMgr 的 REQ_FIGHT 分支把 stm.stm_data 解成 pb_match_pvp_fight_rsp。
- Cmd.lua（c2s_back）登记 88508 的回包为 pb_hunter_arena_history_rank_rsp，88509 的请求为 protobuf；
  c2s_index 显示其余命令走 EncodeErl（ETF）。
- 登录模块：personal-server/fixtures/login-modules.seed.json 的模块 150 只有一块 38 字节
  pb_tournament_login（TournamentMgr.ParseLoginData），本次按单块挂载。
- MatchPvpTable type 1（位面锦标赛）：init_score 100、min_score 100、min_win_gain 3、elo_k 22、
  fight_report_num 15、palace_season 5、fight_tid 1501001、high_rank_fight 1501003、auto_fight_count 10、
  start_day 15；type 2 属于时空冠位赛（HunterArenaCmd），本卡只经共享段位梯子读取。
- MatchPvpTable.DayTask（type 1）：4 行，task_type 全部 12401，task_count 2/5/8/10，奖励 801900。
- TaskTable.Type：12401 = CountStatistics 50 expand 1（挑战次数）、12402 = 50 expand 2（胜利次数），
  7002/7003 = CountStatistics 37 的 expand 1/2（时空冠位赛的挑战/胜利）。据此把 day task 进度映射到本服务
  的当日计数（缺口 5 记录本版数据里 103/104 行文本与 task_type 不一致的现象）。
- MatchPvpTable.Level（type 1）：7 行 100–106，integral 0/200/300/400/500/600/700，101 起带 award；
  作为赛季（段位）奖励梯子。MatchPVPNetMgr.ReqRevStageAward 与 MatchPvpRankAwardNode 证实
  req_tournament_season_award 就是段位奖励领取。
- MatchPvpTable.State（type 1）：101 [0,5,0]、102 [6,22,0]、103 [6,22,5]、104 [7,4,50]、105 [7,4,55]，
  用于 season_state.cur_season_close_stamp（104）与 next_season_open_stamp（101）的倒计时。

## 状态与业务语义

SQLite（幂等建表）：tournament_role（角色权威状态）、tournament_claims（领取幂等键）、
tournament_fight（战报 uid、双方段位、积分变化、锁定标记）。

- 段位：stage = stageForScore(1, score)，登录/结算时同步；MatchPvpTable.Level 是唯一来源。
- 名次：rank = 1 + 本服 tournament_role 中积分高于自己的角色数（单服语义，缺口 6）。
- 跨天：以 UTC 日界重置当日挑战/胜利计数、got_day_award 位块与 got_rank_award_day，并把
  base.last_flush_stamp 推进到登录时刻；积分、赛季计数、段位奖励位块保留。
- 88502：行序号（1 起）即客户端奖励索引与位块位号；进度 >= task_count 才能领，奖励经
  grantResources 发放，位块与 tournament_claims 同事务写入；无参数时领取全部可领行。
- 88503：Level 梯子序号（1 起）即位块位号；要求 score >= integral 且该行 award 非空；无参数时领取
  全部可领段位。
- 88505：真实 pvp-battle 模拟（攻方 = 本角色 lineup_type 1 阵容）。胜 +min_win_gain、负 -min_win_gain
  并以 min_score 兜底（elo_k 22 的公式无证据，缺口 3）；同事务更新
  fight_times/win_times/当日计数/连胜/score_change/max_score/stage/fight_reports（15 条）/best_rank
  与 tournament_fight，回 pb_fight_response，其中 stm.stm_data 是 pb_match_pvp_fight_rsp。
- 88509：按 fight_uid 找到本人战报并写 locked；找不到 GameError(5)。
- 88511：首次进入时从 Match.promote_bot（type 1 行）+ BotLib 取机器人，按积分距离取最近 3 个，
  role_id 取负数（proto 注释「负数为机器人」），state 置 0。
- 88510：对该列表中的一个对手打一场真实 PvP；胜把该位置 1、负置 2；全部为胜则升一段（段位梯子下一行，
  并把 score 提到该段 integral 以保持段位与积分一致）。已胜对手重复挑战 GameError(3)。
- 奖励全部经 resources.grantResources，未识别 id 会整笔回滚。

## 缺口（fail closed 并记录）

1. 对手阵容：88505/88510 需要部署注入 enemyRoster({score, stage, fightTid, botTid}) 才能开战；
   客户端表里没有任何对手阵容（FightTable.def_team 全为空），未注入时 GameError(5)，不回假战报。
2. 荣誉殿堂（88504）：只有赛季结算才会写入，本卡未实现赛季结算，登录与 88504 都回空 palaces。
3. 积分公式：elo_k 22、new_season_rank_back 999 等参数的真实公式未取得，本次用 min_win_gain 作为
   胜负增减，属于显式假设。
4. 88508 回包：Cmd.lua c2s_back 登记的是时空冠位赛的 pb_hunter_arena_history_rank_rsp，锦标赛只能填
   rank/score/season，hunter_arena 块留空。
5. 每日任务进度：DayTask 103/104 行文本是「胜利」类（des 60473）但 task_type 仍是 12401；本实现严格按
   task_type 映射到当日挑战次数，按行文本实现的差异记录在案。
6. 名次与跨服：单服名次由本服 tournament_role 推导，跨服组（CrossMgr/cross_open_day）未实现。
7. 跨天推送：pb_tournament_day_flush 是服务端主动下发的跨天包，本卡只在客户端下一次请求时懒刷新，
   未实现定时推送。
8. 自动战斗/bot 匹配（auto_fight、matching_time、skip_anim）未实现，属表现侧参数。

## 自检

node --check 覆盖 tournament-service.mjs 与 gateway.mjs；git diff --check 无输出。
按要求未执行 npm test、未启动服务、未发 TCP 请求、未读写运行数据库。