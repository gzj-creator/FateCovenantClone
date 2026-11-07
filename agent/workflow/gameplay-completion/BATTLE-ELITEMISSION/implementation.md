# BATTLE-ELITEMISSION 精英任务战斗闭环

工作树：`F:\\projects\\FateCovenantClone\\.worktree\\gameplay-20261106\\battle-elitemission`，分支 `task/BATTLE-ELITEMISSION-20261107`，基线 `main@ea31832`。

## 范围

精英任务（EliteMission）真实战斗闭环：精英关卡/精英 BOSS 通过既有 FightCmd 201（开战）→ 207（结算）入口，用服务端 `simulateBattle` 产出战报，在同一事务内写精英进度、领取位、资源、回包字节；重复 207 与重复通关不二次发奖；编码或 SQLite 失败整体回滚；重开 SQLite 后状态保持。

本轮未启停实时服务、未读写 `runtime.local-only.data`、未操作模拟器/ADB/APK、未连接原服。全部验证使用临时目录 SQLite 与临时 loopback 端口。

既有 87001/87002/87003（选择关卡/宝箱领取/章节领取）保持原实现，本轮仅把共用函数改为可导出复用，回归通过。

## 协议与配置证据

协议（`personal-server/assets/protobuf/elite_mission.net.proto.bin`，明文）：

- `pb_elite_mission_req { uint64 mission_id = 1; int32 boss_id = 2; }`，注释“精英主线战斗请求数据（战斗为关卡或者BOSS）”。
- `pb_elite_mission_back { pb_elite_mission mission_info = 1; pb_res_to_client res = 2; bool is_boss = 3; uint64 boss_tid = 4; }`，注释“精英主线战斗返回数据”。
- `pb_elite_mission { uint64 mission_id = 1; bytes boss_bin = 2; bytes box_award_bin = 3; pb_mission_difficulty difficulty = 4; }`。
- 对比：`mission_fight_req` 的 `mission_id` 在字段 3，字段 1/2 是 `chapter_tid/section_idx`，因此按 `pb_elite_mission_req` 解析普通主线请求会得到 0，两条链路不会互相误判。

客户端（LuaJIT 字节码 `.worktree/recruit-20261101/.scratch/out/luaproject/`）：

- `EliteMissionMgr.AttackMission` 组 `pb_elite_mission_req{ mission_id }`，`AttackBoss` 组 `{ boss_id }`；两者都走 `FightCreateObj` + `FightMgr` + `PLAY_TYPE.NORMAL`，即与主线共用 201/207。
- `AttackResult` 把结算 `stm.stm_data` 解为 `pb_elite_mission_back`，读取 `is_boss`/`boss_tid`/`mission_info`，胜利后 `SaveAttackedBoss(bossTid)` 并触发 `PASS_ELITE_BOSS`/`PASS_MISSION_ELITE`。
- `GetEnemyMaxPower` 路径为 `EliteMissionTable[tid].fight → FightTable.Fight[fightId].def_team → FightTable.Team`，即客户端自己也只能从 `def_team` 取敌方阵容。

配置（`personal-server/config/game-tables.mjs` 与 `EliteMissionTable.data.lua` 全表列名核对）：

- `EliteMission` 4585 行，列：`tid,index,belong_chapter,monster_type,scene_state,btn_text,story,fight,game,assert*,need_level,need_open_days,award,assistant_param`，**没有 enemy 字段**。101 行：`index=1, belong_chapter=1, fight=15000101, award=[[125202,1],[201500,400],[101800,300]]`。
- `Boss` 90 行：`tid,open_chapter,open_server_day,fight,recommend_power,award,show_*`。1 行：`open_chapter=1, fight=15900001, award=[[2002,5],[25002,2],[101500,200]]`。
- `Base` 1 行：`cost_item=100012900, cost_num=5`（与主线 `SweepConst.cost_item/cost_num` 同一体力道具）。
- `FightTable.Fight[15000101]`：`type=6, scene=33, lineup=77, def_team=null, mask_def_power=true, exit=true, def_team_lv=null`；`FightTable.Fight[15900001]`：`type=114, skip=4, skip_all_battle=true, def_team=null`。两者 `TypeClient.multi_fight_model=0`、`Type.settle_type=0/max_round=15`，即普通单场战斗。
- 全库 50,630 条 shipped `Fight` 行 `def_team` 全为 null；`MissionTable.Section` 的 `fight` 是 101/1501 等另一组 id（3491 行），与 15000101 不存在对应，因此精英任务在客户端包里**没有敌方阵容来源**。

## 实现

新增 `personal-server/game/elite-mission-battle.mjs`（`createEliteMissionBattle`）：

- `matches(request)`：`pb_fight_request.req` 按 `pb_elite_mission_req` 解析出唯一目标（`mission_id` 或 `boss_id`），且按 `mission_fight_req` 解析不出 `mission_id`，才归精英链路。
- `start(request)`：校验 `EliteMission`/`Boss`/`Chapter` 行存在、开局解锁（`index ≤ 当前+1`，首关必须 index 最小；BOSS `open_chapter ≤ 当前精英章节`）、体力足够（`Base.cost_item/cost_num`，错误码 301），然后复用 `reportBattle` 生成 fighters/`action_list`/`simulation`。201 回包 `pb_fight_response{ report{ type=6|114, tid=fight, finish=false, req, team_count=101 }, rsp:{}, stm{pb_elite_mission_back 当前状态} }`，`finish=false` 才会触发客户端 207。
- `settlement()`：`store.transaction` 内 `ensureTables → readModule → 体力扣除 → 胜利时写进度/首领位/首通奖励 → writeModule → 事务内 codec.pack(pb_elite_mission_back) 与 pb_fight_settlement_response`。胜利关卡按 `index` 单调推进 `mission_id`；`elite_mission_clear:<tid>`、`elite_mission_boss:<tid>` 领取位保证只发一次；失败只扣体力。重复 207 返回缓存字节。
- `boss_bin`：按 `BitBlock`（与 `box_award_bin`、`pb_mission.boss_bin` 同编码）以 boss tid 置位，异步编码在事务外完成、事务内比对原值防并发覆盖。
- 敌方来源：`enemyProvider(fightTid, row) → npc tid 数组`。缺省/非法时抛 `GameError(5, 'Elite mission enemy configuration is missing')`，不伪造阵容。

改动点：

- `personal-server/game/mission-fight-service.mjs`：`reportBattle` 增加可选 `encounter` 参数并导出；`createMissionFightService` 新增可选 `eliteBattle`，201 在主线判定前分流、207/202 委托给 elite 模块。
- `personal-server/game/elite-mission-service.mjs`：仅将 `ensureTables/readModule/writeModule/configuredAwards` 导出以复用，业务逻辑未改。
- `personal-server/game/gateway.mjs`：`createLocalGame` 新增 `eliteEnemies` 参数，连接级 `createMissionFightService` 注入 `eliteBattle`。派发块未改（201/202/207 已在 `fight.supports`）。

测试：`personal-server/test/battle-elitemission-loop.test.mjs`（11 项）。

## 复现与结果

```powershell
cd personal-server
node --test test/battle-elitemission-loop.test.mjs test/elite-mission-service.test.mjs test/mission-fight-service.test.mjs `
  test/battle-common-effects-production.test.mjs test/skill-battle-integration.test.mjs `
  test/battle-peaktower-service.test.mjs test/attribute-service.test.mjs
```

- 结果 67/67 通过（含新增 11 项、既有 87001/87002/87003 8 项、主线 201/207 与战斗回放回归）。日志：`analysis/test-runs/gameplay-20261106/battle-elitemission-targeted.log`。
- gateway/系统回归：`node --test test/gameplay-gateway.test.mjs test/system-integration.test.mjs` → 8/8 通过，日志 `analysis/test-runs/gameplay-20261106/battle-elitemission-gateway-regression.log`。
- 真实临时 TCP（`createLocalGame` + 握手 AES + 909103 登录 + 帧解码）：87001(101) → 201(101) → 207 → 87001(102) → 201(102) → 207 → 201(105) 被拒 `err=5`，账户模块 140 落到 `mission_id=102`。覆盖在 `battle-elitemission-loop.test.mjs` 最后一个用例。
- SQLite 实测（临时库，脚本 `analysis/scratchpad/BATTLE-ELITEMISSION/evidence-sqlite.mjs`，结果 `analysis/test-runs/gameplay-20261106/battle-elitemission-sqlite.json`）：关卡 101/102 各扣 5 体力并发首次通关奖励；重打 101 只扣 5 体力、无奖励；BOSS 1 扣 5 体力发 `Boss.award` 并置位；累计体力 120→100；重开库后 `mission_id=102`、三条领取位（`elite_mission_clear:101/102`、`elite_mission_boss:1`）、`boss_bin` 8 字节均保持。
- 回滚用例：`reward_claims` INSERT 触发器失败、结算回包编码失败都使体力/进度/领取位整体回滚，随后可重试成功。

## 证据分层与限制

- 服务端组件：通过（含真实 `simulateBattle` 胜/负两态、事务回滚、重开持久化）。
- 真实临时 TCP 网关：通过（87001+201+207 全链路，错误码路径）。
- SQLite：通过（临时库，触发失败回滚与重开保持）。
- APK / 真机：**未做**。本轮边界不允许操作模拟器与实时服务，不能称“可玩验收”。

## 剩余证据缺口

1. 敌方阵容：`FightTable.Fight.def_team` 全库为 null，`EliteMission` 无 enemy 字段，客户端装包取不到精英敌人；`Team` 表键与 fight 的映射亦未取证（`team_lv` 去重 188 个 vs 71 条 6 人分队行不对应）。因此部署需要通过 `eliteEnemies` 注入真实阵容，否则按设计返回 `err 5`。
2. 体力扣除时点：`Base.cost_item/cost_num` 与主线同道具，按 207 结算扣 5 点是沿用主线契约的推断；真实服是否在 201 预扣尚无抓包证据。
3. `Boss.open_server_day`、`EliteMission.need_open_days` 未实现（缺可靠的本地开服日/活动日历口径）。
4. 精英难度（`pb_mission_difficulty`/`AnchorDiff`/`DiffcultyPass`）仅原样读写，没有难度选择与难度奖励规则。
5. “首通奖励只发一次”取自任务要求与主线一致；`award` 是否可重复刷尚无抓包证据，当前按一次性领取位处理。
6. `team_count=101`、`report.type=6/114` 沿用主线既有值与 `FightTable.Type/TypeClient` 行；APK 端未验收。

## 状态判定

服务端完成（组件 + 真实临时 TCP + SQLite 回滚/重开均通过），**无 APK 验收**。精英战斗在未注入 `eliteEnemies` 的部署中会明确拒绝开战。
