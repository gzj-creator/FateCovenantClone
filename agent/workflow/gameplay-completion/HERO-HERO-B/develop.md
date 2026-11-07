# HERO-HERO-B：637/656/641/666 培养·格子·试炼·一键 实施记录

日期：2026-11-07。分支 `task/HERO-HERO-B-20261107`，worktree `.worktree/gameplay-20261106/hero-hero2`。本簇只负责 HERO-HERO 卡里“英雄养成”这一组四条命令，网关派发与登录挂载由总控维护，未改动 `gateway.mjs`。

## 结论

| type | 命令 | 本批状态 |
| ---: | --- | --- |
| 637 | `req_develop_submit_hero` | 服务端完成（格子交换与等级同步为设计推断，见“事实与推断”） |
| 656 | `req_develop_batch_submit_hero` | 服务端完成（整批单事务，重复/非法条目整体回滚） |
| 641 | `req_develop_hero_trial` | 服务端完成（品质与星级增幅为推断，收敛在 `applyTrialOutcome()`） |
| 666 | `req_one_key_develop` | 服务端完成（空列表按“全部已拥有英雄”处理，石头自动选择为推断） |

全部为“服务端完成带证据缺口”，没有 APK 实测，不构成可玩验收。

## 交付文件

| 文件 | 说明 |
| --- | --- |
| `personal-server/game/hero-develop-service.mjs` | 四条命令的 decode / execute / ensureLoginState |
| `personal-server/config/hero-develop-tables.mjs` | 新建：只加载本簇独占的 `Cell`、`TrialTask` |
| `personal-server/test/hero-develop-service.test.mjs` | 9 项组件测试（真实 SQLite、重开保持、失败回滚） |
| `personal-server/test/hero-develop-gateway.test.mjs` | 1 项真实 TCP 测试（握手 + 909103 登录 + 637/641/656/666） |
| `agent/workflow/gameplay-completion/HERO-HERO-B/develop.md` | 本文件 |

未触碰 `gateway.mjs`、`hero-tables.mjs`、`game-store.mjs`、`hero-progression.mjs`、`recruit-service.mjs`、`hero-extra-service.mjs` 及战斗/好友/钓鱼等模块。

## 协议证据

`personal-server/assets/protobuf/hero_develop.net.proto.bin`（protobufjs 加载后实测字段）：

| 消息 | 字段 |
| --- | --- |
| `pb_hero_submit_req` | `hero_tid` uint32=1、`cell_index` uint32=2、`lineup_pos` uint32=3 |
| `pb_hero_submit_ret` | `cell_list` repeated `pb_hero_cell`=1、`change_hero_list` repeated `hero`=2、`change_lineup` repeated `pb_lineup`=3、`cur_pre_lineup` `pb_pre_lineup`=4 |
| `pb_hero_batch_submit_req` | `hero_list` repeated `pb_hero_submit_req`=1 |
| `pb_hero_wake_req` | `hero_tid` int32=1、`res` repeated `pb_res_obj`=2（641 与 640 共用） |
| `pb_hero_trial_ret` | `res` `pb_res_to_client`=1、`new_quality` uint32=2、`new_star` uint32=3、`trial` `pb_hero_trial`=4 |
| `pb_hero_trial` | `hero_tid` uint32=1、`task_progress` repeated `pb_hero_trial_task_progress`=2 |
| `pb_hero_trial_task_progress` | `type` uint32=1、`progress` uint32=2 |
| `pb_role_hero_trial` | `hero_trial` repeated `pb_hero_trial`=1 |
| `pb_hero_one_key_up_req` | `hero_tid_list` repeated int32=1 |
| `pb_hero_one_key_up_rsp` | `res` `pb_res_to_client`=1、`success_hero_list` repeated `pb_hero_develop_change`=2、`failed_hero_list` repeated `pb_hero_develop_change`=3、`change_hero_list` repeated `hero`=4 |
| `pb_hero_develop_change` | `hero_tid` int32、`before_star` int32、`after_star` int32、`before_quality` int32、`after_quality` int32、`success` bool |
| `pb_hero_cell` | `index` uint32=1、`level` uint32=2、`break_level` uint32=3、`hero_uid` uint64=4（已废弃，注释标明） |

656 没有独立的响应消息：proto 包里只有 `pb_hero_batch_submit_req`，因此批量提交复用 `pb_hero_submit_ret`（本实现按此返回）。

## 客户端证据（LuaJIT 转储）

客户端 Lua 目录 `.worktree/recruit-20261101/.scratch/out/luaproject`，用 `$env:TEMP\fc_dump.mjs` 与 `fc_proto.mjs` 按 prototype 索引读取。

- `HeroCmd`：命令名与 schema 一一对应，`req_develop_submit_hero → pb_hero_submit_req`、`req_develop_batch_submit_hero → pb_hero_batch_submit_req`、`req_develop_hero_trial → pb_hero_wake_req`（字段 `hero_tid`、`res`）、`req_one_key_develop → pb_hero_one_key_up_req`（字段 `hero_tid_list`）。
- `HeroDevelopMgr` prototype 8 `ReqSubmitHero(hero_tid, cell_index, lineup_pos)`：先取当前预设索引，再交给 `RoleLineupMgr.ReqSubmitHero`。
- `RoleLineupMgr` prototype 51 `ReqSubmitHero`：`PreLineupUtils.CopyPreLineup` → `PreLineupUtils.SubmitHeroL` 预测新阵容 → `PreLineupMgr:ReqBatchUpdateLineup({req})`，即 637 携带的是本次变化的单条 `pb_hero_submit_req`。
- `PreLineupUtils` prototype 32 `SubmitHeroL`、39 `HandleExistHero`、40 `HandleNotExistHero`、41 `ExchangeCellFighter`：`cell_index` 必须落在 1..6，否则客户端直接 `LogErrorTrace('cellIdx is invalid')`；`lineup_pos` 为 0 时回退成 `cell_index`；目标格子已占用时走交换/占位分支，命中已有站位时对调 `loc`。
- `HeroDevelopMgr` prototype 13（641 回包处理）：`hero:SetQuality(rsp.new_quality)`、`hero:SetStar(rsp.new_star)`，随后 `AwardKit.Parse(rsp.res)`、`HeroDevelopMgr.UpdateTrialProgress(rsp.trial)`、刷新属性并派发 `EV_HERO_TRAIL`/`EV_HERO_STAR_CHANGE_TASK`。品质与星级都由服务端数值直接覆盖。
- `HeroTrailMgr` prototype 0（试炼属性预览）：在 `QualityList` 里找下一个品质；星级用 `hero.star + 1` 拼 `HighStarAddAttr[hero_tid * 10000 + star + 1]`；品质为 `TID_QA_GOLD` 时改为按下一品质重算基础属性。
- `HeroRisingStarMgr` prototype 14/15/16/17：`IsFirstStageUpStar = IsInUnrivaled(hero) and star < 5`、`IsInTrail = IsInUnrivaled(hero) and star == 5`、`IsInUnrivaled = quality <= TID_QA_WHITE`、`IsLastTrail = quality == TID_QA_GOLD`；`MAX_PROGRESS = 6`、`FIRST_STAGE_STAR_C = 5`、`MAX_STAR_C = 10`。
- `HeroDataMgr.LoginParse`（prototype 3）：模块 10 零基槽位 6 为 `pb_role_hero_trial`（Lua `login[7]`，`TGETB a=9 b=1 c=7`）。
- `BagpackMgr` prototype 16/17：`ReqOneKeyDevelop(cbDone)` 发送空 `pb_hero_one_key_up_req`，回包只读 `res` 与 `change_hero_list`（逐条 `HeroDataMgr.GetHero(uid)` → `InitBySrcHero`）后弹 `BagpackOneKeySuccessForm`。

## 配置依据（实测解析）

`HeroTable.data.lua.json` 用 `readGeneratedDump` 解析：

| 表 | 行数 | 关键字段 | 样例 |
| --- | ---: | --- | --- |
| `Cell` | 6 | `guide_node`、`assert`、`assert_param`、`lock_tips` | 1–3 行无 `assert`；4 行 `assert 377309400004`、`assert_param [2,1]`；5/6 行 `assert 955132601046`、`assert_param [10]` |
| `TrialTask` | 180（60 英雄 × 品质 30/40/50） | `task` = `[[6702, target]]` | `103010130 => [[6702, 3]]`、`…140 => [[6702, 4]]`、`…150 => [[6702, 5]]` |
| `Quality`（已由 hero-tables 加载） | 5 | `trial_piece_num` | 30→180、40→240、50→240、60→0、70→0 |
| `UpStarCost` | 50（品质 30/40/50/60/70 × 星 0–9） | `piece_num`、`stone_num` | `4005 => piece 240 / stone 2`、`5005 => piece 120 / stone 2`、`7009 => stone 20` |
| `UpStarStone` | 21 | `item`（阵营×品质允许的觉醒石） | `1040 => [649002, 651002, 22002]`、`1050 => [651002, 22002]` |
| `DevelopConst` | 1 | `hero_lv_rate 1`、`keep_trial_type [6702]` | — |

`TrialTask` 覆盖的 60 个英雄里，基础品质 50 的 27 个、40 的 22 个、30 的 10 个（另 1 个 tid 在 Hero 表中缺失）；品质 60/70 的英雄没有任何试炼行，与 `trial_piece_num` 在 60/70 为 0 一致。

## 服务规则（本批实现）

### 权威状态与不变量

- 权威格子：`model.heroInfo.cell_list`（`index` / `level` / `break_level`）。
- 权威阵容：`model.lineups.pre_lineups[cur_pre_index].lineup.fighter_list`，fighter 的 `index` 是养成格子、`loc` 是战斗站位、`hero_id` 是英雄 tid。
- 不变量 `syncHeroCellState`：英雄只要出现在任一预设在编阵容（优先级从低到高：`playLineups`、模块 9 的自定义预设 `custom_pre_lineup`、其它预设、当前预设）且该格子存在，则 `hero.level = cell.level`、`hero.breakthrough_level = cell.break_level`；不在任何阵容里的英雄回落 `level = 1 / break_level = 0`。依据是 `pb_single_hero` 注释（“放入格子后变成格子的等级，下架后变为1级”）与种子数据一致（英雄 `2020601` lv8/b1 与格子 4 lv8/b1 完全对应，其余英雄 lv1）。

### 637 提交英雄进格子

1. 校验 `hero_tid` 合法且已拥有（否则 3001）、`cell_index` ∈ 1..6（否则 1）、`lineup_pos` ∈ 0..6（否则 1，0 表示与 `cell_index` 相同）、目标格子存在（否则 305 未解锁）。
2. 目标格子已有别的英雄、且当前英雄也在本预设别的格子 → 两者交换格子并互换站位。
3. 目标格子已有别的英雄、当前英雄不在预设里 → 占位英雄被替换出预设，其等级随不变量回落。
4. 其余情况直接把英雄写到目标格子。
5. 站位冲突时取 1..6 的空位，保证一个预设内 `loc` 唯一。
6. 回包 `pb_hero_submit_ret`：完整 `cell_list`、等级/突破有变化的 `change_hero_list`、空 `change_lineup`、当前 `cur_pre_lineup`。

客户端本地也会预测一次阵容（`SubmitHeroL`），只从回包取 `cell_list`/`change_hero_list`，`change_lineup` 与 `cur_pre_lineup` 目前不是客户端必需字段。

### 656 批量提交

同一事务内按顺序应用 637 的规则：先把整批参数（重复 tid、格子范围、拥有关系、格子解锁）全部校验完再动手；任一非法条目抛业务码，整批回滚。重复 `hero_tid` 判 1。回包同样使用 `pb_hero_submit_ret`。

### 641 英雄试炼

1. 必须已拥有（3001）、`hero.star == 5`（否则 5，不在首个星级上限）。
2. `TrialTask[hero_tid * 100 + 当前品质]` 必须存在（否则 305）；品质 30/40/50 才有行，60/70 无行即无试炼。
3. 任务进度 `progress = star - 登录槽位基线`（基线缺省 0），要求 `progress >= target`（target 3/4/5），否则 5。
4. 消耗：`Hero.chip × Quality[品质].trial_piece_num`（不足 3006）+ `UpStarCost[品质*100+5].stone_num` 颗觉醒石，石头种类取自 `UpStarStone[阵营*1000+品质].item`。请求可显式指定一种（`pb_res_obj.num` 允许 0 或恰好等于 `stone_num`，与 640 同规则），也可留空由服务端挑一种足够的。
5. 效果 `applyTrialOutcome()`：品质升到 `QualityList` 的下一档，星级 +1，`star_progress` 归零。
6. 回包 `pb_hero_trial_ret`：`res.changes`、`new_quality`、`new_star`、`trial{hero_tid, task_progress[{6702, progress}]}`；同时把该英雄的试炼基线写进模块 10 槽位 6 的 `pb_role_hero_trial`。

### 666 一键升星

- 请求 `hero_tid_list` 为空（客户端就是这样发的）时按“全部已拥有英雄”处理；非空时先整体校验（非法/重复/未拥有整批报错，1 或 3001）。
- 每个英雄循环升星到 `Hero.max_star`：`star < 5` 用纯碎片，把当前 `star_progress` 补满一整星（`UpStarCost.piece_num × (6 - progress)`）；`star >= 5` 时需要碎片 + 觉醒石（`UpStarCost.stone_num`，种类自动挑一种够用的），并写入 `up_star_high_consume` 记录，规则与 640 一致。
- `star == 5` 且该英雄在该品质下有 `TrialTask` 行时停手：试炼必须走 641，一键不跳过试炼门槛。
- 资源不足或已达上限只是业务结果，不抛异常：成功者进 `success_hero_list` 并附 `hero` 记录到 `change_hero_list`，未变动者进 `failed_hero_list`（`success=false`，含前后星级/品质）。一键不改品质。

### 登录补状态 ensureLoginState

1. 对 `Cell` 表中没有 `assert` 的行（1–3）补建缺失格子（level 1、break 0）；4–6 行的 `assert` 是 MethodScript 脚本，本地无法求值，保持不自动开启。
2. 保证模块 10 至少到槽位 6（槽位 6 为空 buffer 时与现状等价）。
3. 执行 `syncHeroCellState` 修复英雄等级/突破等级。

## 事实与推断

| 项目 | 依据 | 判定 |
| --- | --- | --- |
| 637/656/641/666 的请求 schema 与字段 | proto 包实测 + `HeroCmd` 常量表 | 事实 |
| `cell_index` 1..6、`lineup_pos` 0 回退格子号 | `PreLineupUtils` proto 39/40 | 事实 |
| 英雄等级随格子、下架回 1 级 | `pb_single_hero` 注释 + 种子数据一致 | 事实（注释即契约） |
| 641 品质升一档、星级 +1 | 回包 `new_quality`/`new_star` 被客户端直接 Set，`HeroTrailMgr` 预览用 `star+1` | 强推断（未 APK 验证） |
| 试炼碎片口径 `Quality.trial_piece_num` | `HeroRisingStarMgr.GetElevateHeroStarChipCount` 在 `IsInTrail` 时用该值 | 事实（读码） |
| 试炼石头口径 `UpStarCost[品质*100+5].stone_num` | 与 640 觉醒同表同列 | 推断 |
| 试炼任务 6702 = 英雄星级 | `TaskTable.Type[6702].progress_fun = 171` 不可复现，target 3/4/5 在 star 5 时恒满足 | 推断，见缺口 1 |
| 格子占用时交换/替换 | 客户端 `ExchangeCellFighter`/`HandleNotExistHero` 走交换与空位 | 部分推断 |
| 666 空列表 = 全部英雄 | `BagpackMgr.ReqOneKeyDevelop` 无参调用 | 强推断 |
| 666 自动选石头、不跳试炼 | 无客户端证据，按 640 规则与 `CanTrail` 门槛推导 | 推断 |
| `Cell` 4–6 行开启条件 | `assert` 为 MethodScript，本地不可求值 | 缺口 |

## 复现命令

```powershell
cd F:\projects\FateCovenantClone\.worktree\gameplay-20261106\hero-hero2\personal-server
node --test --test-concurrency=1 test/hero-develop-*.test.mjs
```

2026-11-07 实测：`tests 10`、`pass 10`、`fail 0`（9 项组件 + 1 项真实 TCP 网关）。网关用例用临时 loopback 端口与临时 SQLite 完成真实握手、`909103` 登录（读模块 10 校验 6 个格子与英雄 `2020601` lv8），再依次发送 637/641/656/666，逐条解码回包并回读 SQLite（英雄品质 50、星级 6、`hero_trial` 落槽位 6、资源 −240 碎片与 −2 石头）。

组件用例另外覆盖：格子交换后的等级跟随、未拥有 3001、非法格子 1、锁定格子 305、批量重复 1 与整批回滚、试炼缺碎片 3006 / 缺石头 301 / 错阵营石头 1、星级不足 5、一键资源不足走 `failed_hero_list`、一键在试炼门槛停手、品质 60 英雄可一键突破 5 星、`codec.pack` 抛错整体回滚、SQLite 重开后状态保持、`ensureLoginState` 补建 1–3 格并把越界英雄等级修回。

## 证据缺口

1. 6702 试炼任务的真实统计口径无法复现（`TaskTable.Type[6702]` 只有 `progress_fun 171` 与 `param_txt_func HeroMgr.GetHeroNameByTid`），本实现以“英雄星级”近似，因此“试炼按钮是否亮起、任务进度条数值”必须靠 APK 实测确认。
2. `Cell` 4–6 的 `assert`（`377309400004` / `955132601046`）是客户端脚本，登录补状态不自动开启；玩家首次解锁这三格仍需客户端原逻辑触发。
3. 637 的交换/替换细节：客户端 `HandleExistHero`/`HandleNotExistHero` 的站位交换顺序未完全还原，服务端保证“一格一个英雄、站位唯一”，但同一批操作下的 `loc` 分配可能与客户端预测不同（客户端只读 `cell_list`/`change_hero_list`，影响有限）。
4. 666 的石头自动选择与“跳过试炼”边界是推断；客户端 UI 是否允许一键跨过 5 星需要实测。
5. 试炼附带的属性加成（`HighStarAddAttr` / `Quality` 属性重算）属 CORE-ATTR 范围，本簇只改品质与星级字段，不写属性。
6. 四条命令均未 APK 实测：未启停实时服务、未读写 `runtime.local-only.data`、未操作模拟器与 APK。可玩验收待总控合并后在隔离客户端按 `docs/plans/remaining-gameplay-20261106/11-dispatch-and-acceptance.md` 执行。
