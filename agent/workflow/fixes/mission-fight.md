# G1 旅途（主线关卡）战斗服务器错误

状态：最小配置化战斗回放已实现，组件测试 + 临时 TCP 集成通过；**APK 实测与视觉验收未完成**。

## 证据（真实请求）

- 运行事件日志 `runtime.local-only.data/events.jsonl`：type 201（`fight_start`）多次 `unsupported_command`，最新 2026-10-25T16:30:46Z，请求体 45 字节，与主线 `mission_fight_req` 结构一致。
- 接口目录：`tcp:c2s:201:fight_start` → 请求 `pb_fight_request`、响应 `pb_fight_response`（`agent/workflow/interface-catalog/static-interfaces.json`）。
- `656561243903878900-fight.net.proto.bin`：`pb_fight_request{fight_tid,enemy_id,stm_type,req,loc[],ignore_inherit,is_pure_fight}`、`pb_fight_response{report,rsp,stm,rent_data}`、`pb_fight_stm{result,stm_data,exception}`、`pb_fight_settlement_request/response`。
- 客户端 Lua `MissionUIMgr.AttackResult`：`Codec.DecodePB('mission_to_client', stm_data)`；`FightMgr` 响应分支在 `report.finish` 时用 `ImmediateSettlement` 结果打开 `FightResultMissionForm`，否则 `RequestSettlement`（207）。
- `mission.net.proto.bin`：`mission_to_client{res,fight_result,conversation,mission_meal,mission,is_boss,boss_tid,boss_pass_item}`、`mission_fight_req{chapter_tid,section_idx,mission_id,is_assistant,boss_tid}`。
- 登录模块快照：module 8 首段可解码为 `pb_mission{mission_id=20205,pass_count.count=9}`，用于推进/持久化主线进度。

## 根因

网关没有 type 201/202/207 任何处理器，客户端直接收到 `LOCAL_NOT_IMPLEMENTED`，界面显示服务器错误。

## 实现（`personal-server/game/mission-fight-service.mjs`）

- 201：要求 `req` 可解码为 `mission_fight_req` 且 `chapter_tid/section_idx/mission_id` 均为正数，否则业务错误 5；事务内把 module 8 的 `pb_mission.mission_id` 推进到不倒退的最大值并 `pass_count.count+1`；回包 `pb_fight_response{report{finish=true,final_result=1,battle_list=[]},stm{result=1,stm_data=mission_to_client,exception=false}}`。
- 202：清理待结算并空回包。207：返回同一 `stm`（一次性，第二次返回业务错误 1）。203/204/213：返回最近一次战报。

## 实现边界（必须说明）

- **不做战斗动作回放**：`pb_fight_report.battle_list[].action_list` 由原服战斗引擎产生，本地不伪造动作序列，因此是“即时结算”而非逐回合战斗表现。
- **不发奖励**：`mission_to_client.res.changes` 为空，未按 `MissionTable` 配置推导首通/宝箱奖励；主线进度会前进，但关卡奖励与任务进度未实现。
- 只支持普通主线（非 BOSS、非扫荡、非精英、非纯战斗、非租借）；其他战斗类型（竞技场、塔、活动等）仍返回业务错误 5。
- 未实现难度递增、失败记录、通关记录点赞、章节宝箱、扫荡。

## 复现

```powershell
node --test personal-server/test/mission-fight-service.test.mjs
node --test personal-server/test/gameplay-gateway.test.mjs
```

测试使用从 `p3/wallet-admin-20261025/handoff-game.local-only.sqlite` 复制出的临时库与临时端口，验证：结算一次生效、207 重放同一 `stm`、进度不回退、重启后仍持久、非主线请求不改状态、编码失败回滚。

## 2026-10-26 08:46 部署后反馈复修

- 实测：用户进入大厅后点击主线“摆脱追兵”（第 3 章第 5 关），客户端显示“配置出错了”。
- 证据：`events.jsonl` 2026-10-26T00:46:09.885Z `fight_rejected type=201 seq=22 code=5`，`message="Only ordinary mission fights are implemented"`，请求体 45 字节。
- 文案来源：`assets__Android__script__lua__64_lua_core` 的 `Err.lua.bin` 规范化错误表给出 `CONFIG_ERROR=5`、`SERVER_ERR=2`、`RESERVE_SERVER_BUSY=-1`，因此 code 5 即客户端“配置出错了”。
- 请求形状证据：`MissionUIMgr.lua.bin`（lua_project，proto 99 常量池）普通关卡攻击路径为 `FightDefCustomObj.SetRequest(Codec.EncodePB('mission_fight_req', { mission_id = ..., is_assistant = AutoFightMgr.IsAutoState() }))`，`chapter_tid`/`section_idx` 不上线，保持 protobuf 默认 0。
- 根因：旧校验要求 `chapter_tid > 0` 且 `section_idx > 0`，与真实客户端编码不一致，所有普通关卡请求都被判成“非普通主线”。
- 修复：`mission_id > 0` 即按普通关卡处理，`chapter_tid`/`section_idx` 允许缺省（负数或非整数仍拒绝）；BOSS+小助手组合继续拒绝；结算日志新增 `isAssistant`/`bossTid`。
- 测试：`mission-fight-service.test.mjs` 新增“real MissionUIMgr encoder only sends mission_id”用例（含 `is_assistant=true` 接受、BOSS+助手拒绝）；`gameplay-gateway.test.mjs` 新增真实 TCP 的 mission_id-only 201 结算。全套 **103/103**。
- 边界不变：确定性即时结算，无动作回放、无关卡奖励/任务推进；本条仍需用户重启后 APK 复测与视觉确认。

## 2026-10-26 09:02 APK 实测：进入战斗卡住（回放缺口确认）

- 现象：201 已被接受并结算（日志 `mission_fight_settled missionId=30201 previousMissionId=20205`），客户端进入 FightScene 后无角色、画面卡住。
- 客户端日志：`input\FightSceneFightState.lua.txt:192: attempt to index field 'unscaledStepScheduler' (a nil value)` 每帧重复；该字段由 `_PlayBattle` 在处理战报后创建，空 `battle_list` 时根本不会执行到那里。
- `FightMgr` 响应处理（proto12, lines201-235）：只有 `stmType == FightTable.STM_TYPE_SYNC` 才走 `FightSettlementMgr.ImmediateSettlement`；普通主线由 MissionUIMgr 设为 `PLAY_TYPE.NORMAL`，必然进入 `FightScene.StaticOpenToFight` 播放战报。`stm.exception` 分支会直接 `StaticOutFightScene` 退出，不产生结算界面。
- 原服战报实测结构（capture-workflow/battle-and-lineup.md）：`battle_list=1`、攻方简要阵容3人、整场 fighter_list 11 个实体、`action_list` 71-74 条；动作项格式为 `pb_generic{proto=<动作枚举>, bin=<pb_fat_* 消息>}`（FightParseCtxMgr proto9 的 `Codec.DecodePB('pb_generic')` → `ProtobufKey` → `Codec.DecodePB(name, bin)`）。
- 结论：本机服务没有战斗引擎与动作流生成器，无法用空战报或伪造动作满足客户端；已加 `playbackEnabled` 开关，默认关闭时 201 返回业务错误5（“配置出错了”提示），不再进入卡死场景。
- 后续实现条件：需生成至少包含攻守双方 `fighter_list`、`atk/def_brief_lineup` 与 `pb_generic` 动作序列（round_ready/harm/battle_over 等）的最小战报，或找到客户端支持的同步结算开关；在此之前该关卡不可玩，状态为未验收。

## 2026-10-26 22:05 最小可播放战报

- `MissionTable.Section` 按请求 `mission_id` 提供真实敌人列表：`30201` 的 `fight=301`、`enemy=[9002100,9002600]`；敌人表为空的主线节点（如 `20205`）继续以业务错误 5 拒绝，不伪造 BOSS。
- 攻方优先取自 201 请求的 `loc`，缺省时取服务端当前旅程编队（`playLineups type=1`）。英雄、NPC、技能配置从现有 Lua 表适配器读取；英雄等级、星级、品质及技能 ID 使用 SQLite 中当前存档，不写回或扣资源。
- 战报包含一项 `battle_list`、攻守双方 `fighter_list` 与 brief lineup。敌方最终 HP 为 0，攻方保留 HP；不伪造伤害、奖励或技能结算。
- `action_list` 使用客户端 `FightParseCtxMgr` 已确认的 `pb_generic` 容器，按顺序编码 `107 pb_fat_round_ready{round=1}`、`112 pb_fat_round_over{round=1}`、`104 pb_fat_battle_over{why=1}`。这三个动作分别产生 `RoundReadyStep`、回合结束步骤和 `FightOverStep`，使 `_PlayBattle` 创建 `unscaledStepScheduler` 并完成回放。
- `30201` 的测试战报为 4 名攻方、2 名守方、3 个动作；三个内部消息与 `pb_generic` 外层均通过 codec 正反向解码。缺失敌方配置时事务不推进 module 8。
- 新增 `config/mission-tables.mjs`，扩展 `config/hero-tables.mjs` 读取 `Ability`、`Npc`、`Npc_Ability`。配置源为同版本候选 bundle 生成的 `MissionTable.data.lua.json`；该生成证据仍按项目约定留在 `analysis/`，不提交。
- `missionFightPlayback:true` 已在本地运行入口开启。定向 `mission-fight-service.test.mjs` 5/5、`gameplay-gateway.test.mjs` 1/1，全套 **104/104** 通过。
- 当前验收级别仍为组件 + 临时 TCP；下一步必须在隔离 APK 由用户自行点击主线战斗，确认角色出现、动作步骤结束、胜利结算及 207 回执，之后才能记为 APK/可玩验收。
