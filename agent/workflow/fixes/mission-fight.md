# G1 旅途（主线关卡）战斗服务器错误

状态：组件测试 + 临时 TCP 集成通过；**APK 实测与视觉验收未完成**。

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
