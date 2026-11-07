# EQUIP-RELIC 交付记录：遗物穿戴、升级、升阶、洗炼、分解、重置、变异、专属符文与淬炼

状态（2026-11-08）：89701/89702/89704/89705/89706/89707/89708/89709/89710/89711/89712
共 11 条命令服务端完成，均有真实状态转移、资源消耗/授予与同事务回包；专项服务测试、真实临时
loopback TCP、临时 SQLite 重开、PB 编码失败回滚与 SQLite 写入失败整笔回滚全部通过。
APK 与客户端视觉验收未做（本轮不启停实时服务、不操作模拟器、不生成 APK）。

分支 `task/EQUIP-RELIC-20261107`，基于 main `866117e`。

## 静态证据

| type | 命令 | 请求编码 / schema | 响应 schema |
| ---: | --- | --- | --- |
| 89701 | `req_relic_break_up` | etf / 单值 relic uid | `pb_res_op_relic` |
| 89702 | `req_relic_recast` | protobuf `pb_req_recast_relic{relic_uid,index}` | `pb_res_op_relic` |
| 89704 | `req_relic_save_recast` | protobuf `pb_req_recast_relic` | `pb_res_op_relic` |
| 89705 | `req_relic_resolve` | protobuf `pb_req_resolve_relic{relic_uid_list}` | `pb_res_to_client` |
| 89706 | `req_relic_cancel_recast` | protobuf `pb_req_recast_relic` | `pb_res_op_relic` |
| 89707 | `req_relic_reset` | etf / 单值 relic uid | `pb_rsp_reset_relic` |
| 89708 | `req_relic_stage` | protobuf `pb_req_stage_relic{relic_uid,relic_uid_list}` | `pb_res_op_relic` |
| 89709 | `req_relic_wear` | protobuf `pb_relic_wear_req{wear_list[]}` | `pb_relic_wear_rsp` |
| 89710 | `req_relic_up_sp` | etf / 单值 hero tid | `pb_relic_sp_up_rsp` |
| 89711 | `req_relic_variation` | etf / 单值 relic uid | `pb_variation_back` |
| 89712 | `req_relic_refine` | etf / 单值 hero tid | `pb_relic_refine_back` |

协议依据：`personal-server/assets/protobuf/relic.net.proto.bin` 与
`relic.db.proto.bin`（客户端 `relic.net.proto.bin` 2828 字节，sha256
`95edd66cb84e150bb25e270d5314c50e9002d5ccdc58da48cbb10da4e2180a85`）。
字段语义直接取自脚本注释：`pb_relic.star` 是遗物等级、`pb_relic.stage` 是遗物星级、
`recast_skills` 是未保存的洗炼结果、`cur_skills` 是已保存技能、`stage_cost_relics`
记录升阶消耗；`pb_relic_refine_back.tid` 是英雄 tid，`refine_value`/`add_refine_value`
是专属符文淬炼总值与本次增量。

## 配置依据

- 资产：`personal-server/assets/tables/RelicTable.data.lua.json.gz`，251205 字节，
  SHA256 `c4e78da4a88967ca8db1ab7afd75b026b129af5f1215cf063a214f7df76bfc29`。
- 原始 LuaJIT：`analysis/scratchpad/relic-20261108/RelicTable.data.lua`，202076 字节，
  SHA256 `bf4bea62a43b3419bfc515e4fef9ae5c9ddd2a917c2d67e37d68f3f36ba2102f`。
- 复现：`node tools/extract-relic-table.mjs <RelicTable.data.lua> <RelicTable.data.lua.json.gz>`
  输出 `251205 bytes, 84 prototypes`，重新生成文件哈希与提交资产一致（已验证）。
- 解析：`personal-server/config/relic-tables.mjs` 用共享 LuaJIT dump 解释器还原 26 张表：
  Relic 96、Quality 4、Param 1、Sp 10、SpHero 38、SpSkill 114、SpRefine 11、SpRefineAttr 6、
  RecastSkill 16、RecastSkillProb 80、RecastAttrType 55、RecastAttrValue 825、RecastLib 7、
  RecastTimes 7、StageAttr 144、MainAttr 528、AttrQuality 6、VariationAddition 96、Suit 24、
  Recommend 76、DevelopType 4、ForgeConst 1、ForgeDisplay 1、ResolveDisplay 1、WishWeight 5、Type 4。

字段到规则的映射（全部来自上表，没有手写数值）：

| 规则 | 配置来源 |
| --- | --- |
| 遗物品质 | `Relic.tid` 首位数字 ×10（2001109→20，5001109→50），对应 `Quality` 行 |
| 部位/槽位 | `Relic.type`（1–4，对应 `Type` 的 pos） |
| 等级上限 | `Quality.max_star`（20→0、30→3、40→6、50→9） |
| 升级消耗 | `Quality.cost_chip[当前等级]` × 遗物晶石 `813002` |
| 分解产出 | `Quality.resolve_chip` × 遗物晶石 |
| 升阶上限/消耗 | `Param.max_stage`=5，`Quality.stage_cost[当前星级]` × `Quality.stage_cost_item` |
| 洗炼消耗/槽位 | `Param.recast_cost`=[379002,80]、`Param.recast_index_unlock_star`=[0,3,5]、`Param.skill_count`=3 |
| 洗炼技能池 | `RecastSkill.skill_id[品质位]` 权重取 `RecastSkillProb.probability` |
| 变异消耗/资格 | `Quality.is_variation`（仅 50）与 `Quality.variation_consume`=[[668002,10]] |
| 专属符文升级 | `Sp[下一级]`（cost、need_star、refine_value 门槛）+ `SpHero.item` |
| 专属符文淬炼 | `SpRefine.attr_scope` 定档、`SpRefine.cost` 消耗、`SpRefine.random_limit` 增量上限 |

`RELIC_CHIP_ITEM_TID = 813002` 的依据：`ItemTable` 中唯一的遗物系晶石（type 1、quality 50、
icon `icon_yw_zm.png`、get_way 530、cost_price 500），`Quality` 只给数量不给物品 id，因此在
`config/relic-tables.mjs` 单点登记。

## 状态模型与持久化

- `relic-service.mjs` 在构造时用 `store.inspect` 幂等创建 `relic_depot`（role_id、uid、tid、
  star、stage、is_variation、cur_skills_json、recast_skills_json、recast_datas_json、
  stage_cost_relics_json）与 `relic_counters`（uid 自增），不改 `storage/game-store.mjs`
  的 `user_version` 迁移。
- 穿戴关系仍以 `hero.relic`（repeated uint32）为权威，落在登录模块 10 的 `pb_hero_info`，
  因此重登后槽位可恢复；`hero.sp_relic_level` 与 `hero.sp_relic_refine_value` 同样属于英雄数据。
- 所有写入（depot 行、计数器、资源、英雄字段、回包编码）都在 `store.transaction` 的同一个
  BEGIN IMMEDIATE 内完成；回包 `codec.pack` 抛错或 SQLite 写入抛错都整笔回滚。
- `addRelics()` 是内部获取入口（遗物打造/抽取属其它模块），只供服务内与测试使用，不经客户端命令。

## 逐 type 状态

| type | 状态 | 状态转移 | 资源 | 业务码 |
| ---: | --- | --- | --- | --- |
| 89701 | 服务端完成 | `star+1`，不超过 `Quality.max_star` | 扣 `cost_chip[star]` 个 813002 | 305 上限、301 不足、5 配置缺失、1 非法 uid |
| 89702 | 服务端完成（保底语义待补） | 按品质抽取 `skill_count` 个技能写入 `recast_skills`，槽位计数 +1 | 扣 `Param.recast_cost` | 305 槽位未解锁/已满级、301、5、1 |
| 89704 | 服务端完成 | `cur_skills = recast_skills`，清空待保存结果与槽位计数 | 无 | 1 无待保存结果、305 槽位未解锁 |
| 89705 | 服务端完成 | 删除遗物，按品质发放晶石 | 发 `resolve_chip` 个 813002 | 1 已穿戴/重复、5 不存在、5 奖励配置缺失 |
| 89706 | 服务端完成 | 清空 `recast_skills` 与槽位计数（不返还） | 无 | 1 无待洗炼结果 |
| 89707 | 服务端完成（成本语义待补） | `stage=0`，按 `stage_cost_relics` 重铸并返还 `back_relic_l` | 无（表内无成本字段） | 1 已是 0 星、5 不存在 |
| 89708 | 服务端完成 | `stage+1`，材料从仓库移除并累计进 `stage_cost_relics` | 扣 `stage_cost_item`×`stage_cost[stage]`；材料遗物入库扣除 | 305 上限、5 品质无配置、1 自身/重复/穿戴中、301 |
| 89709 | 服务端完成 | 每英雄整组覆盖 `hero.relic` | 无 | 1 同部位重复/他人穿戴/hero 重复、5 遗物或英雄不存在 |
| 89710 | 服务端完成 | `sp_relic_level+1` | 扣 `SpHero.item`×`Sp.cost` | 305 等级上限/星级或淬炼值不足、5 无 SpHero 配置、301 |
| 89711 | 服务端完成 | `is_variation=true` | 扣 `Quality.variation_consume` | 305 品质不可变异/已变异、5 配置缺失 |
| 89712 | 服务端完成（增量规则推定） | `sp_relic_refine_value += 1..random_limit` | 扣 `SpHero.item`×`SpRefine.cost` | 305 超出末档、5 配置缺失、301 |

`gateway.mjs` 只加了三处最小增量：`createRelicService` / `readRelicTables` 的 import、
构造函数一行、以及 `leaderEquip.supports` 之后的一个数字 type 派发块（`relic_committed` /
`relic_rejected` 日志）。recruit 在 heroCommandServices 之前、百抽在通用 activityRead 之前、
house-assistant、onlineGift/rankAchieve/heroExtra/firstWeekGoal/growthRoad/helpUp/groupBuy 登录同步、
1316、67004/67005、69001/69002、20001–20013、钓鱼 ETF、精英 201/207、团购 100601/100602、
207 结算体力、邮件推送、活动期限、module 8/90 多槽、10501–10511、117001–117005 的既有顺序未改动。

## 验证

复现命令（PowerShell，均在 `.worktree/gameplay-20261106/equip-relic/personal-server` 下执行）：

```powershell
node --test --test-concurrency=1 test/relic-service.test.mjs test/relic-gateway.test.mjs
node --test --test-concurrency=1 test/relic-service.test.mjs test/relic-gateway.test.mjs test/relic-divine-gateway.test.mjs test/equip-service.test.mjs test/equip-tables.test.mjs test/leader-equip-service.test.mjs
node --test --test-concurrency=1 test/gameplay-gateway.test.mjs test/m5-command-matrix.test.mjs
npm test
```

| 证据 | 结果 | 日志 |
| --- | --- | --- |
| 专项服务 + 真实临时 loopback TCP | 11 项（service 10、gateway 1，覆盖 11 个 type 与 89706/89710/89712 业务拒绝） | `analysis/test-runs/gameplay-20261106/equip-relic-targeted.log` |
| relic/equip/leader-equip 回归 | 30 项全部通过 | 同上 |
| 网关与 M5 命令矩阵回归 | 16 项全部通过 | `analysis/test-runs/gameplay-20261106/equip-relic-gateway-regression.log` |
| personal-server 全量 `npm test` | 2396 项、pass 2394、fail 0、skipped 2 | `analysis/test-runs/gameplay-20261106/equip-relic-full.log` |

测试覆盖点：同部位冲突、非本人遗物（仓库不存在）、重复 uid、已穿戴遗物分解/升阶、资源不足 301、
品质无配置 fail closed 5、上限 305；`reopen()` 后 depot 行、`hero.relic`、`sp_relic_level`、
`sp_relic_refine_value` 与计数保持一致；注入 `codec.pack` 失败与 `relic_depot` INSERT 触发器失败时，
资源、星数、洗炼结果与英雄槽位都回滚。

## 缺口（未取得证据，未猜测）

1. **遗物仓库登录槽位未定位**：`pb_relic_depot{max_uid,relic_list}` 只出现在
   `relic.db.proto.bin` 与静态 schema 里，客户端 Lua 已不在仓库，登录 fixture 的 146 个模块中
   没有任何一个能解码出非空 depot，因此没有向登录包注入遗物仓库。重登后`hero.relic`（模块 10）
   与专属符文进度可恢复，但仓库列表本身不会下发；定位模块号后应补一个 module 写入。
2. **`Param.star_cost`(179002 神印结晶) 未被任何遗物命令使用**：升级按 `Quality.cost_chip`
   ×813002 计费（与 max_star 9 档一一对应）；该字段可能属于打造/其它系统，未消费。
3. **洗炼保底未实现**：`RecastTimes`（7 档 qualities 权重、guarantee_times、guarantee_quality）
   与 `Quality.recast_num/open_recast_num/recast_probability` 的档位键语义无权威证据；当前洗炼
   只按 `RecastSkillProb` 权重抽 `Param.skill_count` 个不重复技能，`recast_datas` 的三项计数只累加。
4. **变异概率未接入**：`Quality.recast_probability`、`variation_return`、`return_chip` 未使用；
   变异按"消耗即成功"，`variation_return` 与红遗物限次（`Param.reset_red_relic_n`=5）未验。
5. **重置成本未定**：`pb_rsp_reset_relic` 没有成本字段，`Param.reset_red_relic_n` 语义未定，
   当前重置不收费、只回退星级并返还记录过的材料。
6. **穿戴语义按整组覆盖实现**：`pb_relic_wear_one.relics` 是完整槽位集合还是增量未从客户端取证；
   空列表被解释为清空该英雄全部槽位。
7. **升阶材料数量无上限约束**：表里只给每星消耗的碎片数，未给材料数量规则，当前按请求列表全收。
8. **属性/战力未刷新**：`StageAttr`、`MainAttr`、`RecastAttrType/Value`、`Suit`、
   `VariationAddition` 未进入 `attribute-service` 计算，遗物加成不会体现在战力与战斗里。
9. **获取路径不在本任务**：遗物打造/抽取命令（客户端未声明 89703）未实现，仓库只能经
   `addRelics()` 内部入口获得；未验收真实客户端操作。
10. **APK/UI 未验收**：本轮按要求未启停实时服务、未读写 `runtime.local-only.data`、未操作模拟器。

## 改动文件

- `personal-server/game/relic-service.mjs`（新增，独立服务）
- `personal-server/config/relic-tables.mjs`（新增，RelicTable 读取与品质/晶石常量）
- `personal-server/assets/tables/RelicTable.data.lua.json.gz`（新增，配置资产）
- `tools/extract-relic-table.mjs`（新增，可复现生成器）
- `personal-server/game/gateway.mjs`（import + 构造 + 单一派发块）
- `personal-server/test/relic-service.test.mjs`、`personal-server/test/relic-gateway.test.mjs`（新增）
