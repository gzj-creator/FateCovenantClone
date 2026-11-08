# BATTLE-TRIMATCHTOWER 实施记录（三消爬塔活动）

日期：2026-11-08。分支 `task/A2-TRIMATCH-20261108`，worktree
`.worktree/gameplay-20261108/a2-trimatch`。本卡只做服务端实现，未启停实时服务、未读写运行数据库、
未操作模拟器/ADB/APK、未派子 agent；验证只用 `node --check` 与 `git diff --check`。

## 任务范围

模块 `TriMatchTowerCmd`，3 条命令此前完全没有路由。

| type | 命令 | 请求 / 回包 | 本次状态 |
| ---: | --- | --- | --- |
| 119001 | `req_tri_match_tower_rec_process_award` | protobuf `pb_tri_match_tower_rec_process_award_req` → `pb_tri_match_tower_rec_process_award_rsp` | 已实现（进度校验、位图防重、真实发奖、回活动数据） |
| 119002 | `req_tri_match_tower_recover_stamina` | protobuf `pb_tri_match_tower_recover_stamina_req` → `pb_tri_match_tower_recover_stamina_rsp` | 已实现（惰性自然回复 + 体力道具补充） |
| 119003 | `req_tri_match_tower_act_get_pass` | protobuf `pb_tri_match_tower_act_get_pass_req` → `pb_tri_match_tower_act_get_pass_rsp` | 已实现（从首通记录组 `pass_list`） |

3 条命令全部实现：3/3。

## 配置与协议证据

### protobuf（明文 .proto，直接读取）

`personal-server/assets/protobuf/tri_match_tower.net.proto.bin`、
`tri_match_tower.db.proto.bin`：

- `pb_tri_match_tower_rec_process_award_req{act_id, tid_list}` →
  `pb_tri_match_tower_rec_process_award_rsp{data: {act_data, res}, award: bytes}`。
- `pb_tri_match_tower_recover_stamina_req{act_id}` →
  `pb_tri_match_tower_recover_stamina_rsp{data: {act_data, res}}`。
- `pb_tri_match_tower_act_get_pass_req{act_id}` →
  `pb_tri_match_tower_act_get_pass_rsp{pass_list}`。
- `pb_tri_match_tower_act_data{act_tid, tower, got_progress_award(bytes), buy_limit_info,
  stamina, stamina_last_update_time, last_settlement_fight_id}`。
- `pb_tri_match_tower_pass_lineup_data{tower, role_id, hero_list(pb_tri_match_pass_hero), power,
  min_power}`，`pb_tri_match_pass_hero{base_data: pb_battle_tri_match_hero_data{tid,star}, lv}`。
- `pb_res_to_client` 就是通用资源变化包，复用既有 `grant/consume` 产出的 `changes`。

### 客户端 LuaJIT 字节码

来源目录 `analysis/scratchpad/time-temple-20261108/project/`，用
`tools/dump-luajit-prototypes.mjs` 读取：

- `TriMatchTowerCmd.lua.bin` 三条命令都用 `Codec.EncodePB`，请求字段顺序为
  `{act_id, tid_list}` / `{act_id}` / `{act_id}`。
- `TriMatchTowerMgr.lua.bin`：119001 回包用 `AwardKit.Parse(res)` 处理奖励并刷新活动数据；
  119002 只在本地按时间重算出的体力低于服务端存储值时才发送；119003 结果存为 `pass_list`。
  登录侧通过 `ActMgr.GetActListByBigType(TID_BIG_TRI_MATCH_PVE_ACT)` 取活动列表。
- `TriMatchTowerData.lua.bin`：`IsProgressAwardReceived` 用 BitMap 读
  `got_progress_award`（按 `ProAward.tid` 作位下标）；`GetStamina/GetCurStamina` 用
  `TimeKit.NowSec` 按 `Version.recover_time/recover_num/max_stamina` 客户端本地重算体力。
- `TriMatchTowerUtil` 的 `GetAvailableProgressAwardTidList` 拿 `ProAward.pro` 与已通关层数比较，
  因此“进度达到即领”是客户端同样的判定。

### 活动实例（`ActFrameAct` / `ActFrameType`）

- `ActFrameAct` 中 `type === 1302` 的实例是 `1302001`（三消爬塔），`ActFrameType` 里
  1302 指向 `TriMatchTowerData`。服务端活动 id 由这张表推导，不写死。

### 表数据（`TriMatchTowerTable`）

| 子表 | 行数 | 关键字段与样例 |
| --- | ---: | --- |
| `Version` | 1 | `{tid:1, mission_lib:1, pro_award_lib:1, recover_time:3600, recover_num:1, max_stamina:10, init_stamina:10, del_stamina:1, stamina_item:1014800, permit_act:1016319, auto_unlock:100, ...}` |
| `Mission` | 500 | `{tid, lib, pre_mission, index, fight_tid, hook, buff, mission_icon, award}`；1→`fight_tid 300001, index 1`，500→`fight_tid 300500, index 500` |
| `ProAward` | 37 | `{tid, lib, pro, award}`；`pro` 取 10/20/30…500，即通关 `ProAward.pro` 层可领该档 |
| `Buff` | 4 | `{tid, buff_desc, camp[4], attr[4], value[4]}`，例如 `{tid:1, camp:[2,2,5,5], attr:[10,11,10,11], value:[500,500,500,500]}`；关卡内战斗 buff，本轮不改战斗属性，未接 |

`Mission` 行没有最低战力列，所以 119003 的 `min_power` 只能回 `0`。

## 实现

新增 `personal-server/game/trimatch-tower-service.mjs`（`createTriMatchTowerService`），
复用 `trimatch-core.mjs` 的 `grant/consume/affordable/ensureTrimatchTables` 与
`bit-block.mjs` 的 `hasBit/setBit`。

### 权威状态（SQLite，事务内幂等建表）

```sql
trimatch_tower_state(role_id, act_id, tower, got_progress_award TEXT(hex),
                     stamina, stamina_last_update, last_settlement_fight_id,
                     updated_at, PK(role_id,act_id))
trimatch_tower_clear(role_id, act_id, tower, fight_uid, hero_list_json, power,
                     created_at, PK(role_id,act_id,tower))
```

`got_progress_award` 按 protobuf 的 `bytes` 语义以 hex 文本落库，读取时还原成 `Buffer`
回包；位图位下标就是 `ProAward.tid`。`trimatch_tower_clear` 每层一行，由结算缝写入，
119003 只读不写，客户端无法伪造首通阵容。

### 各命令业务

- **119001 领进度奖励**：`tid_list` 非空、≤256、无重复；每个 tid 必须在 `ProAward` 里，
  `state.tower >= ProAward.pro` 才可领，已领过的位（`hasBit`）报 `CODE_LIMIT`。
  整批校验通过后才 `grant()` 发奖并一次性写位图，任何一条不合法都整批回滚。
  回包 `pb_tri_match_tower_rec_process_award_rsp.data = {act_data, res:{changes,is_overflow:false}}`。
- **119002 恢复体力**：先按 `recover_time/recover_num/max_stamina` 惰性补到“当前应有多少体力”
  （满体力时直接把 last_update 推到当前时间）；已满报 `CODE_LIMIT`。如果自然回复没有产出任何体力
  （说明计时还没走完一个周期），才消耗 1 个 `Version.stamina_item` 换 `recover_num` 点体力，
  材料不足报 301。回包 `pb_tri_match_tower_recover_stamina_rsp.data = {act_data, res}`。
- **119003 首通阵容**：按 `act_id` 从 `trimatch_tower_clear` 升序组装 `pass_list`，
  英雄用 `base_data{tid,star} + lv`，`power` 取首通时记录的战力，`min_power` 回 0（表里没有该列）。
- **结算缝 `settle(model, db, payload)`**：由三消战斗服务在 115001 落库后回调。
  `fight_tid` 命中 `Mission.fight_tid` 才算爬塔关卡；失败扣 `Version.del_stamina` 并记录
  `last_settlement_fight_id`；胜利只有 `Mission.index === tower + 1` 才推进层数并存首通阵容
  （越级、重复打旧层都只更新 `last_settlement_fight_id`，不推进、不覆盖首通）。
  胜负来自服务端模拟结果，客户端没有自报胜负的入口。

## 验证

按任务纪律只做静态检查：`node --check` 覆盖 `trimatch-tower-service.mjs`（以及最后一起提交的
`gateway.mjs`），`git diff --check` 无空白/冲突标记问题。本卡未运行 `npm test`、未起本地服务、
未连真实 TCP、未读写运行数据库、未做 APK 验收，因此**没有**任何“已实测”结论。

## 未闭合缺口

- **119001 的 `award` bytes 未填**：回包里还有一个 `bytes award` 字段，客户端 `AwardKit.Parse`
  读的是 `data.res`，`award` 具体编码未恢复，当前留空。
- **119002 语义是推断**：客户端只发 `act_id`，请求里没有道具 id/数量；“自然回复没到点就用 1 个
  `stamina_item` 换 `recover_num`”是按 `Version` 字段与客户端按钮行为推出来的，原服的判定顺序
  （先在服务端刷时间还是直接补一次）没有实测证据。
- **119003 的 `min_power` 固定为 0**：`Mission` 表没有最低战力列，也没有观察到全服数据来源。
- **登录模块 92 未同步**：爬塔活动状态还没有写进 `pb_tri_match_tower_act_info` 的登录下发，
  客户端活动面板在拿到该数据前可能看不到层数与体力；本卡只实现命令侧。
- **`del_stamina` 只在失败时扣**：胜利不扣体力，理由是三消战斗本身在开战阶段已经算完整场；
  原服是否在开战即扣、失败是否再扣一次没有证据。
- **Buff 未接**：`Mission.buff` / `TriMatchTowerTable.Buff` 是关卡内战斗加成，本轮战斗属性链路
  没有读取它。
- **`pre_mission` 未校验**：推进只按 `index === tower + 1`，没有用 `pre_mission` 链做额外校验。
- **跨活动实例**：多个 `type 1302` 实例同时存在时只取 tid 最大的一个做默认活动；请求里的
  `act_id` 必须是配置实例，其余报 `CODE_STATE`。

