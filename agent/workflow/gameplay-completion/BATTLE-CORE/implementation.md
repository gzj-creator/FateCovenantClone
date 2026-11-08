# BATTLE-CORE：战报、通关记录、通用地图与星级关卡（块 A1 第 1/2/10/11 卡）

2026-11-08。分支 `task/BATTLE-CORE-20261108`，工作树 `.worktree/gameplay-20261106/a1-core-battle`，基于 main `8ebd5a1`。提交 `7a49fd2`。

覆盖任务卡：BATTLE-FIGHT（205）、BATTLE-REPORT（211/212）、BATTLE-COMMONMAP（90601–90603）、BATTLE-STARMISSION（89601–89604）。

## 依据（只列本次实际用到并核对过的证据）

- `personal-server/assets/protobuf/fight_report.net.proto.bin`：`pb_pass_record_req {pass_tid, id}`、`pb_pass_record_vote_req {pass_tid, id, fight_id, type, is_up_vote}`、`pb_share_report {fight_id, fight_type}`。
- `personal-server/assets/protobuf/fight_report.db.proto.bin`：`pb_pass_record {pass_info_list}`、`pb_pass_info {pass_type, fight_id, role_id, pass_score, sub_pass_score, lineup_info, show_info, vote_info}`、`pb_pass_info_vote {up_vote, down_vote}`、`pb_fight_report_light`。
- `personal-server/assets/protobuf/common_map.net.proto.bin` / `common_map.db.proto.bin`：90601→`pb_common_map_init_back {fun_bin, res}`；90602→`pb_common_map_node_trigger {map_tid, sub_id, is_line, x, y, param}` → `pb_common_map_node_trigger_back {res, map_tid, sub_id, trigger_node, add_buff_list}`；90603→`pb_common_map_sweep_trigger {map_tid, sub_id}` → `pb_common_map_sweep_trigger_back {res, map_info}`；`pb_common_map`/`pb_common_map_node` 的 x/y/type/db_data/cfg_data/is_over/ext_data 与 line_list/evt_list/buff_list/over_data。
- `personal-server/assets/protobuf/star_mission.net.proto.bin` / `star_mission.db.proto.bin`：89602→`pb_star_mission_chapter_award_req {activity_id, award_tid}` → `pb_star_mission_chapter_award_rsp {chapter, res_change}`；89603 `pb_star_mission_skill_req {activity_id, skill_tid}`、89604 `pb_star_mission_skill_reset_req {activity_id}` 都回 `pb_res_to_client`；章节状态 `pb_star_mission_chapter {chapter, mission_star, chapter_star_award}`，二者为 BitBlock 字节（与 `game/bit-block.mjs` 的客户端 BitBlock 语义一致）。
- 复用链路：`game/mission-fight-service.mjs` 的 `reportBattle`（真实 `simulateBattle` + 属性装配 + 行动流）、`game/resources.mjs` 的 `grantResources/consumeResources`、`storage/game-store.mjs` 的 `store.transaction/inspect`、`game/bit-block.mjs`。
- 205/211/212 在客户端没有 c2s_back 之外的共享/点赞规则证据；`pb_share_report` 无回包也无分享落库语义。

## 改动

- 新增 `game/battle-record-service.mjs`：205（拒绝）、211（`pb_pass_record`）、212（点赞）。211 从 `battle_pass_records` 读真实记录并按 `pass_score, fight_id` 排序，点赞数由 `battle_pass_votes` 聚合；212 校验记录存在、拒绝自赞、同向重复幂等、反向重复报错，成功时无回包。`recordPass()` 由网关在 207 净胜结算后调用（`pass_tid` = 战报 `tid`/FightTable 行，`id` = 关卡 mission_id，`pass_score` = 战斗回合数）。
- 新增 `game/common-map-service.mjs` + `config/common-map-tables.mjs`：90601 按配置初始化并持久化 `pb_common_map` 到 `common_map_state`；90602 对节点做真实结算（有 `fight` 的节点走 `reportBattle` → `simulateBattle`，失败时节点保持未通关、不发奖；胜利才置 `is_over` 并按 `award` 发奖、追加 buff、校验前置节点）；90603 对已通关且 `repeat` 的节点重新跑一次真实战斗并再次结算奖励，返回最新 `map_info`。
- 新增 `game/star-mission-service.mjs` + `config/star-mission-tables.mjs`：89602 依据已得星数校验章节阈值、只发一次章节奖励并置领取位；89603 用星数当技能点、按技能 `cost` 与 `max_level` 校验并持久化；89604 清空技能分配（技能点随之返还）；89601 拒绝。状态存 `star_mission_state`（原始 BitBlock 十六进制 + 技能 JSON）。
- `storage/game-store.mjs`：新增 4 张幂等表 `battle_pass_records`、`battle_pass_votes`、`common_map_state`、`star_mission_state` 及一个查询索引。这些表是纯增量（`CREATE TABLE IF NOT EXISTS`，无数据迁移），因此 `user_version` 仍为 16，`version > 16` 保护不变，既有断言 `user_version == 16` 的测试保持通过。
- `game/mission-fight-service.mjs`：新增可选 `onSettlementCommitted` 回调（仅在 207 净胜结算提交后触发，失败只记日志不回滚结算），`pending` 增加 `fightTid`/`rounds` 供战报记录使用。既有 201/202/203/204/207/213/503/506 行为不变。
- `game/gateway.mjs`：只做增量。新增 3 个服务实例化与一个派发分支（`battleRecords/commonMap/starMission`，type 205/211/212/89601–89604/90601–90603），位置在 `fight.supports` 之后、`tasks.supports` 之前；recruit 仍在 `heroCommandServices` 之前、`hundredDraw` 仍在 `activityRead` 之前，未删除任何既有派发块或登录同步。loginPayload 未新增模块号：该卡 4 组命令都没有取回登录槽位编号的证据，按“不猜数字槽位”的规则保持空缺。

## 复现命令

```powershell
cd F:\projects\FateCovenantClone\.worktree\gameplay-20261106\a1-core-battle\personal-server
node --test test\battle-record-service.test.mjs test\common-map-service.test.mjs test\star-mission-service.test.mjs test\battle-core-gateway.test.mjs
node --test test\battle-elitemission-loop.test.mjs test\hero-progression.test.mjs test\diamond-bank-gateway.test.mjs test\activity-read-service.test.mjs
```

## 测试统计

2026-11-08 一次性运行 8 个文件共 52 项：pass 52，fail 0，skipped 0，日志 `analysis/test-runs/gameplay-20261106/battle-core-20261108.log`。

- 服务单测 12 项：211 空表、`recordPass`→211→212→重开、自赞/未知记录/非法参数、205 拒绝、212 插入失败回滚、90601 初始化与重开、90602 真实战斗胜利只发一次奖、90602 战斗失败不发奖、90603 扫荡真实结算与 `repeat=false` 拒绝、缺配置 fail closed + PB 编码失败回滚、89602 章节奖励幂等与重开、阈值不足拒绝、89603/89604 技能点与重置、89601/缺配置/PB 编码失败回滚。
- 真实临时 loopback TCP 1 项（`test/battle-core-gateway.test.mjs`）：909103 登录后逐 type 发 211/212/205/90601/90602/89602，验证空表回包与错误码，再关闭网关重开同一 SQLite，211 仍返回已记录通关。
- 回归 39 项：精英关卡 201/207 闭环、养成回滚、充值网关、活动读取（含 `user_version == 16` 断言）全通过。

## fail closed 清单

| 命令 | 行为 | 原因 |
| --- | --- | --- |
| 205 `share_report` | 错误码 5，无写入 | 无回包 schema、无分享落库/奖励语义证据 |
| 212 `req_pass_record_vote` | 自赞→5；未知记录→5；反向重复→1 | 自赞限制与每日点赞上限无证据 |
| 89601 `req_star_mission_award` | 错误码 5 | 请求参数与奖励映射均无证据 |
| 90601–90603 | 错误码 5 | `CommonMapTable` 未抽取进 `assets/tables` |
| 89602–89604 | 错误码 5 | `StarMissionTable` 未抽取进 `assets/tables` |

## 缺口

- `CommonMapTable`、`StarMissionTable` 尚未从客户端 Lua 包抽取，生产环境下 90601–90603、89602–89604 全部 fail closed；本次用注入配置的 fixture 证明了结算逻辑本身真实可用（含 `simulateBattle`）。表落地后只需把对应 `assets/tables/*.json.gz` 放入即可启用，无需改代码。
- `pb_common_map_init_back.fun_bin` 按“packed `pb_common_map`”下发是本地推断；`pb_common_map_node_trigger.param` 的 key/game/line 三种形态未解析，目前忽略 `param`。
- 211 的 `pass_tid` 语义（通关记录表 tid）与 `id`（业务关卡 id）按“战报 tid + mission_id”落库，未取得原服映射证据；`pass_score` 暂用回合数，`lineup_info` 未下发（战报阵容快照未接线）。
- `mission_star` 的星数来源（星级关卡 896xx 战斗入口不在本卡范围）未接线，测试通过直接写入 BitBlock 模拟；技能点规则按“1 星=1 点、每级消耗 skill.cost”实现，属本地推断。
- 206/207 之外的战斗类型（精英、活动、PVP）尚未向 `battle_pass_records` 写入通关记录。
- 未做 APK/客户端验收；本轮未启停实时服务、未读写 `runtime.local-only.data`、未操作模拟器或 ADB、未连原服。
