# HERO-HERO：614/647/663/664/665 小批实施记录

日期：2026-11-07。分支：`task/HERO-HERO-20261106`，worktree `.worktree/gameplay-20261106/hero-hero`，提交前 rebase 到 main `63b9f85`。本批只覆盖用户指定的五条已确认映射命令，HERO-HERO 卡其余命令保持原状。

## 结论

| type | 命令 | 本批状态 |
| ---: | --- | --- |
| 614 | `use_hero_chip` | 服务端完成（custom_tid 无证据，非 0 明确拒绝） |
| 647 | `req_hero_visit` | 服务端完成（Visit 品质映射为推断，见缺口） |
| 663 | `req_hero_reforge` | 服务端完成（锁价比例口径为推断） |
| 664 | `req_hero_reforge_save` | 服务端完成 |
| 665 | `req_hero_reforge_cancel` | 服务端完成 |

实现落在新模块 `personal-server/game/hero-extra-service.mjs`，网关只做最小新增：一个 import、一个服务构造、`loginPayload()` 一次 `ensureLoginState()` 和一块派发。没有改 `game-store.mjs` 迁移，重铸待决表由服务构造期 `CREATE TABLE IF NOT EXISTS` 建立。

## 协议与客户端证据

- 请求/响应 schema（`agent/workflow/interface-catalog/static-schemas.json`）：
  - `hero_chip_use` = { `tid` int32=1, `num` uint32=2, `custom_tid` int64=3 }，响应 `pb_res_to_client`。
  - `pb_hero_visit_rsp` = { `res_change` `pb_res_to_client`=1, `hero_visit` `pb_role_hero_visit`=2 }；`pb_role_hero_visit` = { `visited_heroes` repeated uint32=1, `last_refresh_time` uint32=2, `used_meet_times` uint32=3, `yesterday_visited_heroes` repeated uint32=4, `continue_meet_s` uint32=5 }，来源 `visit.db.proto.bin`。
  - `pb_hero_reforge_req` = { `hero_tid` uint32=1, `use_currency` bool=2, `lock_idx_list` repeated uint32=3 }，`pb_hero_reforge_back` = { `reforge`=1, `res`=2 }；`pb_hero_reforge` = { `attr_list` repeated `pb_attr_item`=1, `random_attr_list` repeated `pb_attr_item`=2 }，`pb_attr_item` = { `key` uint32=1, `value` uint64=2 }。
  - `hero` 消息字段 24 为 `reforge pb_hero_reforge`，因此保存结果写英雄行本身。
- 请求参数（`analysis/scratchpad/hero-extra-20261107` LuaJIT 转储）：
  - `HeroCmd` prototype 4/23/35/36/37 确认五个命令的编码选择：614 与 663 为 PB，647/664/665 为 ETF。
  - `HeroFavorMgr` prototype 49 `ReqVisit(heroTid)` 发送 `HeroCmd.req_hero_visit(heroTid, cb)`，即 ETF 单元素 `[hero_tid]`。
  - `HeroReforgeMgr` prototype 21/23 分别发送 `req_hero_reforge_save(heroTid)` 与 `req_hero_reforge_cancel(heroTid)`，均为 ETF `[hero_tid]`。
  - `HeroReforgeMgr` prototype 17 发送 `req_hero_reforge(heroTid, useCurrency, lockMapToList(lockMap), cb)`，对应 PB 三字段。
- 登录槽位：`HeroDataMgr.LoginParse`（prototype 3）按顺序解码模块 10：`login[1]=pb_hero_info`、`[2]=HeroNumericRes`、`[3]=pb_hero_draw_info`、`[4]=handbook`、`[5]=pb_role_hero_favour`、`[6]=pb_role_hero_visit`、`[7]=pb_role_hero_trial`…… 即零基槽位 5 是拜访状态。本批写槽位 5，槽位 4 仍由 `hero-favor-service` 独占。
- 碎片容器：`ItemTable` 中英雄碎片物品 `type=31` → `ItemTable.Type[31] = { res_type: 4, obj_class: 'HeroChip' }`，对应 `resources.mjs` 的 `4:HeroChip` 处理组（模块 6 组 2）；`Chip` 表的 `point_item` 指向英雄 tid，`need_num` 为合成所需数量（例：`21300104 → 1030101, need_num 60`）。

## 配置依据（HeroTable / ItemTable，实测解析）

| 表 | 行数 | 字段 | 样例 |
| --- | ---: | --- | --- |
| `VisitConst` | 1 | `meet_times`, `day_times` | `1 => { meet_times: 1, day_times: 3 }` |
| `Visit` | 3 | `chip_num`（主键为品质 tid） | `30=>10, 40=>10, 50=>5` |
| `VisitUnlock` | 59 | `unlock_asset`, `unlock_pass`, `unlock_player_lv`, `server_day_show` | `2010101 => unlock_player_lv 1` |
| `Reforge` | 76 | `recommend_attr`(6), `skill` | `1040301 => recommend_attr [134,66,6,171,21,5]` |
| `ReforgeAttr` | 25 | `weight`, `val_range`, `quality`, `score` | `5 => weight 858, val_range [[5500,[900,1500]],[3000,[1501,2100]],[1250,[2101,2700]],[250,[2701,3000]]]` |
| `ReforgeConst` | 1 | `cost_item/cost_num`, `cost_currency_item/cost_currency_num`, `attr_count`, `lock_price_ratio`, `reforge_quality`, `min_red_score`, `max_score` | `cost_item 710002 x10`，货币 `401500 x100`，`attr_count 4`，`lock_price_ratio [25000,60000]`，`reforge_quality 60` |

## 服务规则（本批实现）

- 614：校验碎片配置与英雄未拥有；消耗 `need_num` 个碎片（请求 `num >= need_num` 即可，多余部分不扣），把英雄写入权威英雄列表，并在碎片变化的 `extra` 中用 ETF 二进制列表附带 `hero` PB，沿用招募流程已验证的“客户端从 res change 学习新英雄”方式。编码失败与 SQLite 失败整体回滚。
- 647：校验英雄已拥有、`VisitUnlock` 存在且 `unlock_player_lv` 满足；同一英雄每日一次，且每日最多 `VisitConst.day_times`(3) 名；按英雄品质查 `Visit.chip_num`，发放该英雄 `Hero.chip` 碎片；`visited_heroes`、`used_meet_times`、`last_refresh_time` 写入模块 10 槽位 5，跨 05:00（UTC+3 偏移日号）把当日列表搬入 `yesterday_visited_heroes` 并清零。`continue_meet_s` 原样保留。
- 663：要求英雄已拥有、`Reforge` 有该英雄行、品质 `>= reforge_quality`(60)，且没有待保存结果；按 `use_currency` 选 `401500 x100` 或 `710002 x10`，锁属性附加 `ceil(base * ratio / 100000)`；按 `ReforgeAttr.weight` 无放回抽 4 个不同属性键，按 `val_range` 权重选区间并在区间内取值；锁定下标的已有属性原样保留。候选与随机结果在同一事务写 `hero_reforge_pending`。
- 664：只接受本次待决结果，将 `{ attr_list, random_attr_list }` 写入英雄字段 24 并删除待决行；谎造属性无入口，因为回包只来自服务端自己保存的候选。
- 665：丢弃待决结果，返回当前已保存重铸；`663` 已扣的消耗不退。
- 编码与持久化：五个命令的编码/写入均在 `store.transaction` 内；编码异常、资源不足或 SQLite 写入拒绝会同时回滚资源、英雄行与待决表。

## 机器验证

| 层 | 命令 | 结果 |
| --- | --- | --- |
| 专项服务 | `node --test --test-concurrency=1 test/hero-extra-service.test.mjs` | 8/8 通过（合成/重复/不足/编码回滚、拜访限额/跨日/未拥有/未解锁、重铸成本/锁定/保存/取消/待决重开/回滚/品质门槛） |
| 真实 TCP | `node --test --test-concurrency=1 test/hero-extra-gateway.test.mjs` | 1/1 通过（握手登录、模块 10 槽位 5、614、647、663/664/665） |
| 回归 | 加上 `gameplay-gateway`、`hero-favor`、`hero-progression` | 44/44 通过 |
| 格式 | `git diff --check main..HEAD` | 通过 |

未启停实时服务、未操作模拟器/ADB、未读写 `runtime.local-only.data`、未生成 APK。

## 明确剩余与证据缺口

- 本卡其余命令仍未路由：602、627、628、629、630、631、634、635、637、641、651、652、654、656、661、666、672、673；本批不改变其状态。
- 614：`custom_tid` 在客户端 `HeroChip.Use` 中直接透传，但当前 `Chip` 表 158 行的 `hero_group` 全为空，未见可选碎片场景；本地服务对非 0 返回 code 5。客户端 `num > need_num` 时的实际行为未录制，本批按“只扣一份 need_num、合成一个英雄”实现。
- 647：`Visit` 表在客户端 Lua 中没有任何引用，只有 `VisitConst`/`VisitUnlock` 被 UI 使用；“品质 → chip_num”映射是配置字段推断。`meet_times` 的准确口径、`unlock_pass` 的关卡校验、`RecoveryTable.TID_PRIVILEGE_TOWN_HERO` 特权倍率未实现；`used_meet_times` 仅计数回显。
- 663：`lock_price_ratio` 的缩放基数与档位语义（按锁指数累加还是单档乘数）未取得权威证据，本批按十万分比、按锁数量选档推断；`recommend_attr` 是否决定抽取池、`min_red_score`/`max_score` 的重铸保留与红点规则未实现；技能解锁（`Reforge.skill` 500/600/700）只随英雄数据回登录，没有独立技能状态。
- 重铸属性目前只保存与回包，尚未进入战斗属性计算（归 CORE-ATTR/CORE-SKILL-GATES）。
- 服务错误码：`HERO_ALREADY_OWN_CANNOT_COMPOSE`/`CHIP_NOT_ENOUGH` 等 HeroErr 名称到线上 code 的映射未取得，本批沿用现有英雄服务约定（1 无效、5 状态/配置、301 不足、305 未解锁、3001 不存在），客户端文案待真机复核。
- APK 验收未安排；本批仅服务端、内存与临时 TCP 层通过。
