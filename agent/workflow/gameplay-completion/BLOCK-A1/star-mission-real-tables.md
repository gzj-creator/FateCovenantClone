# StarMission 真实表适配与 CommonMap 证否（A1-TABLES）

分支 `task/A1-TABLES-20261108`，worktree `.worktree/gameplay-20261108/a1-tables`，起点 `1616438`。
本轮只改代码、测试与文档；未启停实时服务、未读写 `runtime.local-only.data`、未操作 ADB/APK。

## 真实资产

`tools/extract-shipped-table.mjs` 从客户端 `64_lua_project.bundle` 抽出两张表，已放入
`personal-server/assets/tables/`（草稿原件在 `analysis/tmp/a1-tables-unused/`）：

| 资产 | SHA256 |
| --- | --- |
| `StarMissionTable.data.lua.json.gz` | `2D3151EA…7E48` |
| `CommonMapTable.data.lua.json.gz` | `1075DDDF…A112` |

## StarMission：真实 schema 与键

`StarMissionTable` 有七个子表：`StarMission`(1232)、`Attr`(34)、`Constant`(34)、`Skill`(748)、
`Chapter`(5)、`ChapterAward`(462)、`Hero`(36)。

- **行按 `version` 分组，不按活动 id**。客户端 `StarMissionMgr.GetVision(actTid) = actData[actTid]:Version()`，
  再用 `_InitLevelLData` 按版本建 `StarMissionValueIndex` / `ChapterAwardValueIndex`。
- 版本 1..34 完整；每章 8 关，每关 `star_rule` 恒 3 条（章节上限 24 星）。
- `ChapterAward.star` 只有 9 / 15 / 24；tid 形如 `version*10000 + chapter*100 + box`（v1 第 1 章为 10101/10102/10103）。
  奖励分别是 `175002×150`、`175002×300`、`174002×1`（全部为 `2:ItemProp` 可发放物品）。
- `Skill`：`times` 是等级上限（1 或 3），`cost_id` 恒为 `177002`（背包物品），`cost_num` ∈ {2,4}，
  `parent_node` 为空表（根技能）或父技能 tid 数组；`StarMissionMgr.CheckSkillParentActive` 要求父技能全部到 `times`。
- `pb_star_mission_chapter {chapter, mission_star, chapter_star_award}` 的两个星字段是 ETF 编码的 BitBlock
  （`StarMissionMgr.GetCurStarCount` 按位 popcount）；章节奖励位按章内档位顺序 0/1/2 索引。
- 活动 → 版本：`ActivityTable.Activity` 中 `func === 81` 的「SP新英雄活动副本」家族共 39 行、版本恰为 1..34
  （如 v1=81001，v9=81009/81010/81011）。证据是版本区间与 `StarMissionTable.Hero` 的 60 品质英雄租赁行吻合；
  该映射以常量 `STAR_MISSION_ACTIVITY_FUNC = 81` 固化，属于代码假设而非逐行文本证据，已在 `config/star-mission-tables.mjs` 注明。

## 代码

- `personal-server/config/star-mission-tables.mjs`：真实 reader。逐行校验（缺失子表、重复阈值、奖励对、
  父技能缺失、奖励需求超过章节上限均抛错），导出 `readStarMissionTables / starMissionActivity /
  starMissionActivityVersion / starMissionTier` 与 `STAR_MISSION_ACTIVITY_FUNC`。
- `personal-server/game/star-mission-service.mjs`：重写。
  - 89602：活动 id → 版本 → `ChapterAward` 档位；按 bit 幂等置位，事务内 `grantResources` 发放真实奖励，
    回 `pb_star_mission_chapter_award_rsp`（含 `res_change`）。
  - 89603：校验等级上限与父技能门槛，事务内 `consumeResources` 扣 `cost_id × cost_num`，回 `pb_res_to_client`。
  - 89604：按 `sum(level × cost_num)` 原样退还同一 `cost_id`，清空技能表，回 `pb_res_to_client`。
  - 89601：无响应 schema、无参数证据，继续 `GameError(5, STAR_MISSION_AWARD_REFUSAL)`。
- `personal-server/storage/game-store.mjs`：schema v18（保留主线 Block J 的 v17）。旧 `star_mission_state`（按 `act_id` 单行）在迁移
  `star-mission-version-key-v18` 中 DROP，新建 `star_mission_chapter_state(role_id,version,chapter,star_bits,award_bits)`
  与 `star_mission_skill_state(role_id,version,skills_json)`。旧表只承载过 fixture 行，未接收过真实客户端领取。
- `personal-server/game/gateway.mjs`：`createStarMissionService` 增加 `activityTables: tables.Activity`。

## CommonMap：证否，保持 fail closed

`CommonMapTable` 的 18 个子表全是系统定义：`BuffGroup(2) Buff(16) Area(2) BoxGroup(3) Box(8) Game(3)
GameAward(76) AwardPool(10) FishingGame(8) Fight(5) Node(11) CommonMap(1) KeyType(2) Key(26) RandomKeyConst(2)
RandomKey(5) HideStory(4) HideStoryOption(12)`。

- `Node` 的 11 行是节点**类**（`editor_class_name` + `lua_node_class`，如 `BaseMapCellData` / `CMapBornPosNode`），
  没有坐标、没有每图节点实例。
- `CommonMap` 只有 1 行，唯一字段 `init_pb_struct = "pb_pet_play_master"`。
- `CommonMapMgr.ReqInitMap` 先 `Codec.DecodePB(init_pb_struct, fun_bin)` 再 `TryCall(lua_handle_init_map)`；
  地图网格来自 `RequireConfig(mapCfgFullName)`（如 `pet_play_map_01.lua`），是独立客户端模块，不在本表内。

因此 `pb_common_map_init_back` 需要的坐标/节点实例在可得证据里不存在，90601–90603 无法忠实实现。
`config/common-map-tables.mjs` 改为真实定义 reader（`definitions` + `maps` 仅 `{tid, initPbStruct, layout: null}`，
`layoutAvailable = false`），`game/common-map-service.mjs` 删除原先自造的坐标/奖励结算引擎，
三个命令一律 `GameError(5, COMMON_MAP_LAYOUT_GAP)`，并在日志里记录拒绝原因。`common_map_state` 表保留但不再使用。

## 测试

`personal-server` 全量 `npm test`（`node --test --test-concurrency=1 test/*.test.mjs`），日志
`analysis/test-runs/gameplay-20261106/a1-tables-full.log`。专项覆盖：

- `test/star-mission-service.test.mjs`：真实表 34 版本 / 8 关 / 9·15·24 档位；89602 发放 `175002×150` 且重开不重复；
  星级不足、未知活动、未知档位拒绝；89603 每级扣 `177002×2`、等级上限、父技能门槛、重开后技能表持久化；
  89604 按 `level × cost_num` 退款并清空；89601 拒绝；reply 编码失败不留领取位；表缺失时 fail closed。
- `test/common-map-service.test.mjs`：真实定义加载（17 个定义表、Node 11 行、1 个 CommonMap 行、`layout = null`）；
  90601–90603 全部 code 5 且消息等于 `COMMON_MAP_LAYOUT_GAP`。
- `test/battle-core-gateway.test.mjs`：临时 loopback TCP + 真实握手，89602 用真实 `activity_id=81001 / award_tid=10101`
  领取 `175002×150`，重开 SQLite 后重复请求不再发放；90601–90603 code 5；func 81 之外的活动 code 5。

## 仍 fail closed / 未实现

- 89601 `req_star_mission_award`：无 schema、无参数证据。
- 90601–90603：缺地图实例数据（上文证否）。
- 星级来源：真实入口是通用战斗管线 `pb_star_mission_fight_req {chapter, mission, act_id}`（不是 896xx），
  本服务只读 `mission_star`，不写；测试用直接写入 `star_mission_chapter_state` 的位块模拟已通关星级。
- 登录模块槽位：`pb_star_mission_role_info` / `pb_star_mission_skill_list` 属于哪个登录模块号仍无证据，
  客户端登录后暂不会看到已领取状态（服务端状态正确持久化）。
- `StarMissionTable.Attr`（关卡属性加成）与 `Hero`（租赁英雄）尚未接入战斗。

## 退役的伪造 fixture

旧实现的 `StarMissionAct` / `CommonMapNode` fixture（自造活动 94001、自造坐标与节点奖励）已删除，
相关测试改为读真实资产；仓库内不再存在只为旧 fixture 服务的配置形状。
