# G3 海岛垂钓活动报错

状态：组件测试 + 临时 TCP 集成通过；**活动入口与垂钓操作未验收**。

## 证据

- 运行事件日志：type 110308 `req_fishing_act_get_record` 于 2026-10-25T15:15:03Z 返回 `unsupported_command`（请求体 6 字节，ETF），说明用户确实进入过海岛垂钓并触发记录读取。
- 接口目录：`FishingActCmd` 110301 甩杆、110302 收获、110303 高分榜、110304 图鉴奖励、110305 解锁地图、110306 换杆、110307 等级奖励、110308 记录、110309 排名奖励、110310 进度奖励、110311 批量收获。
- `fishing_act.net.proto.bin`：`pb_fishing_act_get_record_rsp{record_list[]}`、`pb_fishing_act_get_top_rsp{high_score_list[]}` 允许空列表；`pb_fishing_act_data_res{data,res}`、`pb_fishing_act_get_rsp{data,fish_id,size,score,res}` 需要真实玩家数据。
- `ModuleTable`：92139 = `活动_钓鱼活动`（`e_dir=project/activity/fishing_act`）。当前登录 module 92（`pb_act_login`）的 13 条活动记录中没有该活动，垂钓活动数据/时段未出现在本账号存档。

## 根因

网关没有 110301-110311 任何处理器，读取记录的命令直接返回 `LOCAL_NOT_IMPLEMENTED`。

## 实现（`personal-server/game/activity-read-service.mjs`）

- 110308 → `pb_fishing_act_get_record_rsp{record_list: []}`；110303 → `pb_fishing_act_get_top_rsp{high_score_list: []}`（本地账号无记录时的诚实答案）。
- 110301/110302/110311（甩杆/收获/批量）与 110304-110307、110309、110310（各类奖励）返回业务错误 5，不生成鱼、不伪造概率或奖励。

## 实现边界与未解决

- **没有实现活动开启逻辑**：未把 92139 写入 module 92 活动列表，也未构造 `pb_fishing_act_role_data`。若客户端入口仍因“活动不在列表/时间未开”而打不开，需要下一步先取得该活动的 `ActivityTable` 时间段与登录数据结构证据。
- 未实现鱼竿、地图、图鉴、等级、排名、进度奖励与 QTE/批量垂钓。
- 若用户下次触发其它 1103xx 命令，事件日志会记录 `activity_read_rejected`/`unsupported_command` 与 `payloadHead`，据此再补。
