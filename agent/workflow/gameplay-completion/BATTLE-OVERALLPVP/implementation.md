# BATTLE-OVERALLPVP 实现说明（A2 卡）

分支：`task/A2-OVERALLPVP-20261108`
工作树：`.worktree/gameplay-20261108/a2-overallpvp`
范围：`OverallPvpCmd` 101101–101130 共 30 条命令，全部为全服 PVP（预告 → 预赛 → 预赛结算 → 双败淘汰 → 淘汰结算 → 决赛 → 决赛结算）。

本卡只做服务端与协议接线：未启停实时服务、未读写运行库、未操作模拟器/ADB/APK，未跑 `npm test`，未写真实 TCP/SQLite 证据。下文“实现”仅指代码与静态检查层面，**不是** APK 可玩验收。

## 证据与真值来源

- 客户端命令表：`analysis/scratchpad/time-temple-20261108/project/18026411376499538000-OverallPvpCmd.lua.bin`。30 个请求函数经 `dump-luajit-prototypes.mjs` 解析，逐个确认编码方式（见下节）。
- 管理器：`OverallPvpMgr.lua.bin`、`OverallPrelimsMgr.lua.bin`、`OverallElmsMgr.lua.bin`、`OverallPvpGuessMgr.lua.bin`、`OverallChampionMgr.lua.bin`、`OverallPvpUtil.lua.bin`。
- 配置常量：`OverallPvpTable.lua.bin` 头部原型逐条 `KSHORT` 读出：`OVERALL_PVP_PRE_CHALLENGE_TIMES=0`、`OVERALL_PVP_PRE_REFRESH_TIMES=1`、`TID_OVERALL_NOTIFY_STAGE=1`、`TID_OVERALL_PRELIMS_STAGE=2`、`TID_OVERALL_PRELIMS_SETTLE_STAGE=3`、`TID_OVERALL_KO_STAGE=4`、`TID_OVERALL_KO_SETTLE_STAGE=5`、`TID_OVERALL_FINALS_STAGE=6`、`TID_OVERALL_FINALS_SETTLE_STAGE=7`、`TID_OVERALL_ELMS_CONST=1`、`TID_OVERALL_PVP_MATCH_LOW/MID/HIGH=1/2/3`、`TID_OVERALL_PVP_PRELIMS_CONST=1`。
- 数据表：`personal-server/assets/tables/OverallPvpTable.data.lua.json.gz`（`tools/extract-shipped-table.mjs` 从同目录 `14079943816236153000-OverallPvpTable.data.lua.bin` 复现），SHA256 `FF33C71F…79ED8`。
- 协议：`personal-server/assets/protobuf/overall_pvp.{db,net}.proto.bin`、`overall_final.{db,net}.proto.bin`、`flush_time.db.proto.bin`。

## 请求编码（逐条核对 `OverallPvpCmd.lua`）

29 条走 `Codec.EncodeErl`（参数可选，空请求合法）；以下 3 条走 `Codec.EncodePB`：

| type | 请求消息 | 字段 |
| --- | --- | --- |
| 101125 | `pb_overall_pvp_fight_guess_req` | `guess_turn`、`guess_role_id` |
| 101126 | `pb_overall_pvp_rank_guess_req` | `role_list` |
| 101127 | `pb_overall_pvp_guess_req` | `guess_type`、`guess_turn`、`guess_role_id` |

ETF 参数形态（来自调用方原型）：101102 传 `{tid}`（`TNEW`+`TSETB`），101106 传 `0`/`1`（两个常量），101109 传 `KPRI` 常量，其余无参或传 id。服务端用 `scalarArgument()` 统一接受 `number`、`[number]`、`{tid}`，保证线上形态待验时不会因表格/标量差异直接 500。

## 周期与阶段机

`personal-server/config/overall-pvp-tables.mjs` 的 `resolveOverallPvpCycle()`：时钟落在 `Base` 某行 `[start_time,end_time)` 内时用该版本，否则用最后一版按 `end_time-start_time` 循环滚动。阶段取自 `Stage` 表（1:0–172800，2:172800–406800，3:406800–432000，4:432000–666000，5:666000–691200，6:691200–1011600，7:1011600–1159200）。分组：`preview=1`、`prelims=2–3`、`elms=4–5`、`finals=6`、`show=7`。

`openDay = floor(offset/86400)+1`，任务窗口、跨日重置、阶段结算都基于它。

## 命令处置（30/30）

“实现”= 读真实表 + 真实状态落库；“fail closed”= 用 `CODE_STATE(5)` + 具体原因拒绝，不编造对手或奖励。

| type | 命令 | 回包消息 | 处置 |
| --- | --- | --- | --- |
| 101101 | `elms_buy_count` | `pb_overall_pvp_elms_buy_count_back` | 实现：`ElmsBuy` 按购买序号计价扣 101500，需淘汰赛阶段且 `is_ticket` |
| 101102 | `rev_day_task_award` | `pb_overall_pvp_rev_task_award_back` | 实现：`Task.day_range` + 进度 + 按 tid 的 BitBlock |
| 101103 | `rev_period_task_award` | 同上 | 实现：`EachTask.prelims_lv` + `task_count` 门槛 |
| 101104 | `elms_match` | `pb_overall_pvp_elms_match_back` | **fail closed**：本地无 128 人双败对手 |
| 101105 | `prelims_match` | `pb_overall_pvp_prelims_refresh_opponent_back` | 实现：`PrelimsBot` 刷新对手，消耗免费/购买刷新次数 |
| 101106 | `prelims_buy_times` | `pb_overall_pvp_buy_times_back` | 实现：`PrelimsBuyTimes` 按 `buy_type`+`rang` 计价 |
| 101107 | `elms_sweep` | `pb_overall_pvp_elms_fight_back` | **fail closed**：无真实淘汰赛对手 |
| 101108 | `preview_reward` | 空包 | 实现：`PreviewRewards[version]`，仅预告阶段 |
| 101109 | `team_num_reward` | `pb_overall_pvp_team_num_award_back` | 实现：`Lineup` 按 `open_day` 解锁并写入 `team_award_list` |
| 101110 | `prelims_special_match` | `pb_overall_pvp_prelims_special_match_back` | 实现：不足 `init_bot_num` 时免费补齐 |
| 101111 | `report_person` | `pb_overall_pvp_report_obj` | 实现：按角色 id 读真实战报（空表即空列表） |
| 101112 | `report_top` | 同上 | 实现：按 `peak_report_num` 读巅峰战报 |
| 101113 | `elms_clear_group_dirty` | 空包 | 实现：清 `group_dirty` |
| 101114 | `elms_clear_final_dirty` | 空包 | 实现：清 `final_dirty` |
| 101115 | `enter_view` | 空包 | 实现：落 `enter_view/viewing` 标记；数据随 101122 下发 |
| 101116 | `exit_view` | 空包 | 实现：清标记 |
| 101117 | `elms_clear_fail_report` | 空包 | 实现：清 `fail_report_list` |
| 101118 | `scroll` | `pb_overall_pvp_scroll_list` | 实现：滚动条来自真实战报 |
| 101119 | `final_record` | `pb_overall_final_record_back` | **fail closed**：无真实决赛对阵 |
| 101120 | `final_watch_award` | `pb_receive_watch_award_back` | **fail closed**：无真实决赛 |
| 101121 | `rev_sign_task_award` | `pb_overall_pvp_rev_task_award_back` | 实现：`SignTask.day` + `receive_sign_tid` 单游标顺序领取 |
| 101122 | `get_info` | `pb_overall_pvp_get_info` | 实现：全量快照（见下） |
| 101123 | `try_init_lineup` | `pb_overall_pvp_enter_view_back` | 实现：返回已开放阵容并置 `init_index` |
| 101124 | `show_reward` | 空包 | 实现：`ShowRewards[version]`，仅决赛结算阶段 |
| 101125 | `fight_guess` | — | **fail closed**：无真实决赛对局 |
| 101126 | `rank_guess` | — | **fail closed**：无真实决赛排名 |
| 101127 | `fight_guess_reward` | `pb_overall_pvp_guess_award_back` | **fail closed**：无已结算决赛 |
| 101128 | `rank_guess_reward` | 同上 | **fail closed**：无已结算排名 |
| 101129 | `rank_guess_num` | `pb_overall_pvp_rank_guess_num_list` | 实现：按真实竞猜记录统计人气（空表即空列表） |
| 101130 | `history_data` | `pb_overall_pvp_history_version_list` | 实现：`Base.history_rank_len` 截断的历史榜单 |

统计：**22 条实现 + 8 条 fail closed = 30/30**。

## 101122 快照组装

`pre_person`（分数、剩余挑战/刷新、对手列表、胜负场、`refresh_day`、是否结算/初始化、最高分）、`elms_person`（资格、分组、排名、挑战/匹配 flush、对手、脏标记、失败战报）、`final_person`（未参赛：`join_version=0`、`is_player=false`、`day_watch` 归零）、`task_role`（`day_bin`/`season_bin` 两块 BitBlock、`day_ref_time`、`receive_sign_tid`）、`pvp_data`（版本、阶段、各阶段绝对起止时间）、`preview_person`/`show_person`（是否已领）、`pvp_person`（`team_award_list`/`settle_index`/`init_index`/`version`/`spec_handle`）、`guess_person`（真实竞猜记录，空即空）。字段 8 `enter_view_back` 故意留空，避免重复下发租借/商店数据。

## 状态与幂等

服务内自建 8 张表（`CREATE TABLE IF NOT EXISTS`，`store.inspect` 建表）：

- `overall_pvp_state`：版本、结算/初始化标记、`team_award`、进场标记。
- `overall_pvp_prelims`：分数、最高分、挑战/匹配使用与购买、胜负场、`refresh_day`、对手列表、刷新时间（`PRIMARY KEY(role_id,version)`）。
- `overall_pvp_elms`：资格、胜者/败者组、排名、挑战/匹配 flush、对手、脏标记、失败战报（同日重置挑战/购买/对手，跨日保留资格与排名）。
- `overall_pvp_claims`：`(role_id, claim_type, claim_key)` 主键，`day_task`/`season_task` 键为 `版本:tid`，`extra_day` 键含 `cycleStart:day:tid:index`，`preview`/`show` 键为版本，`sign_task` 键为 tid。
- `overall_pvp_reports`：战报（`fight_uid` 主键），供 101111/101112/101118 读取；本卡没有写入路径，空表返回空列表。
- `overall_pvp_guesses` / `overall_pvp_rank_guesses`：竞猜记录（竞猜命令 fail closed，故当前只读为空）。
- `overall_pvp_history`：历史名次。

BitBlock 采用仓库既有 `game/bit-block.mjs`：零基、字节内 MSB 优先，位序 `tid-1`。

## 规则落地（可直接对照表）

- `PrelimsConst`：`init_score=1000`、`free_challenge_count=20`、`free_refresh_count=10`、`init_bot_num=3`、`init_bot_lib=[101..109]`、`fight_tid=1501001`。
- 预赛对手：从 `init_bot_lib` 取与本人分数最接近的机器人为起点，连续取 3 条；机器人 role_id 用 `700000000000 + PrelimsBot.tid` 合成，`is_bot=true`。
- `PrelimsBuyTimes`：`buy_type=0` 挑战、`1` 匹配；`rang` 1–10/11–20/21–30，每档 `101500×10`。
- `ElmsInit.split_score=[3200,1900]`：进入淘汰赛阶段后按预赛最高分推导资格，≥3200 胜者组、≥1900 败者组、否则无资格（`elmsQualification`）。
- `ElmsConst`：`role_report_num=30`、`peak_report_num=30`、`peak_show=50`、`free_challenge=20`、`sweep_count=10`。
- `RankAward` 用的是 `rank_rang`（不是 `rank_range`），`ElmsRankWinnerAward/ElmsRankLoserAward` 用 `rank_range`，读取时分别处理。
- 任务类型：100501 预赛挑战次数、100502 淘汰赛挑战次数、100503 淘汰赛扫荡、100504 淘汰赛胜利、100505 预赛积分。100503/100504 在本地恒为 0（对应命令 fail closed），因此相关任务无法冒领。
- `DailyExtraAwad`：`day_range[i]` 与 `extra_award[i]` 按下标配对，命中当前 `openDay` 即追加 `ExtraAwadLib` 奖励，每个周期实例只发一次。

## fail closed 明细

| type | 错误码 | 原因 |
| --- | --- | --- |
| 101104 | 5 | `Overall PVP elimination match needs a real bracket opponent list` |
| 101107 | 5 | `Overall PVP elimination sweep needs real bracket opponents` |
| 101119 | 5 | `Overall PVP final record needs a real cross-server final bracket` |
| 101120 | 5 | `Overall PVP watch award needs a real final bracket` |
| 101125 | 5 | `Overall PVP fight guess needs a real final bracket pair` |
| 101126 | 5 | `Overall PVP rank guess needs a real final ranking` |
| 101127 | 5 | `Overall PVP fight guess reward needs a settled final round` |
| 101128 | 5 | `Overall PVP rank guess reward needs a settled final ranking` |

## 已知缺口（需 TCP 验收）

1. **回包形态**：部分命令没有专属 `_back` 消息（101108、101113、101114、101115、101116、101117、101124），服务端回空包。客户端 `OverallPvpMgr` 的解码器先判 `string.isEmptyOrNil` 再 `DecodePB`，空包安全；但真实回包是否应携带 `pb_res_to_client` 仍需抓包确认。
2. **101123 回包**：推断为 `pb_overall_pvp_enter_view_back`（该消息含 `repeated pb_lineup lineup_list`，且是唯一带阵容列表的可复用结构），未经线上验证。
3. **BitBlock 位序**：沿用 `tid-1` + MSB 优先，需以任务面板实际点亮为准确认。
4. **次数语义**：`pre_person.challenge_times/match_times` 按“剩余次数”返回（依据 `OverallPrelimsMgr.GetRefreshTimes()` 的用法），若客户端按“已用次数”渲染需调整。
5. **`day_ref_time`**：返回当日 00:00 的绝对秒；也可能是天数，需抓包对照。
6. **`pre_person.is_init`/`is_settle`**：本地没有预赛结算流程，恒为 false；客户端是否会重播预赛开场需实测。
7. **预赛战斗**：`FightTable 1501001` 的预赛对战不在本卡 30 条命令内，本卡不写 `score`/`win_times`/`fight_times`/战报，因此预赛任务与积分相关命令在真实战斗接入前只能拿到初始分数。
8. **淘汰赛/决赛**：跨服 128 人对阵与前 3 排名在单机不可达，相关 8 条命令永久 fail closed。
9. **101123 阵容**：只回当前版本已开放且 `play_lineups` 中存在的玩法阵容类型（`Lineup.lineup` 107–110），不含租借英雄/圣器/宠物/精灵数据。
10. **无登录模块**：`OverallPvpMgr` 没有恢复出登录模块槽位，因此不伪造模块 id；客户端靠 101122 取快照。

## 验证

- `node --check personal-server/game/overall-pvp-service.mjs`：通过。
- `node --check personal-server/game/gateway.mjs`：通过。
- `git diff --check`：通过（网关文件仅 30 行新增，未改动既有中文注释）。
- 未执行：`npm test`、真实 TCP/SQLite 集成、APK 联调（按本卡约束）。

## 提交

- `5046b81` feat(A2-OVERALLPVP)：抽出 `OverallPvpTable` 资产 + 读取器
- `cb11c85` feat(A2-OVERALLPVP)：实现 101101–101130 服务
- `ff18680` feat(A2-OVERALLPVP)：网关接线与登录状态初始化