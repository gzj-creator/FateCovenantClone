# ITEM-ITEM 交付记录：碎片合成、手动兑换与重复箱/抽奖箱分支

状态（2026-11-07）：156/158/154 服务端业务 + 临时 TCP + SQLite 重开通过；151/152/155/157/159 回归通过。
153 与 157.lottery_list 本版本不可达/证据阻塞，已路由为明确业务错误，不用空包占位。
APK 实测与视觉验收未做（本轮不启停实时服务、不操作模拟器）。

分支 `task/ITEM-ITEM-20261106`，基于 main `5f87d34`。

## 静态证据

| type | 命令 | 静态记录 | 请求编码 |
| ---: | --- | --- | --- |
| 151 | use_box | `tcp:c2s:151:use_box` | protobuf `simple_use` |
| 152 | use_selected_box | `tcp:c2s:152:use_selected_box` | protobuf `selected_use` |
| 153 | use_repeat_box | `tcp:c2s:153:use_repeat_box` | ETF，单 positional（仅 tid） |
| 154 | manual_convert_item | `tcp:c2s:154:manual_convert_item` | ETF，单 positional（仅 tid） |
| 155 | use_selected_suit_box | `tcp:c2s:155:use_selected_suit_box` | ETF，两个 positional |
| 156 | req_chip_compose | `tcp:c2s:156:req_chip_compose` | protobuf `simple_use{tid,num}` |
| 157 | batch_use_box | `tcp:c2s:157:batch_use_box` | `pb_batch_use_box_req{box_list,lottery_list}` |
| 158 | req_one_key_chip_compose | `tcp:c2s:158:req_one_key_chip_compose` | `pb_one_key_compose{one_key_compose[]}` |
| 159 | req_one_key_use_item | `tcp:c2s:159:req_one_key_use_item` | `pb_one_key_use{use[]}` |

响应统一 `pb_res_to_client{changes[],is_overflow}`（`item.net.proto.bin`）。
重复箱状态 `pb_box_repeat{tid,num,uid,get_time,use_times}`、保底 `pb_box_guarantee` /
`pb_box_guarantee_list` 见 `item_box.db.proto.bin`；碎片登录结构 `pb_chip_info{chip_compose[]}`、
`chip_compose{chip_tid,guaranteed_count}` 见 `hero.db.proto.bin` / `hero_chip.db.proto.bin`。

## 配置事实（`ItemTable.data.lua.json`）

- `Chip` 158 行：HeroChip 77、ArtifactChip 18、FantasyEquipChip 32、ElvesChip 16、ItemChip 2、MatchHeroChip 13；
  `need_num` 分布 20/30/60/80/100，`point_item` 指向成品。除 MatchHeroChip 的 13 个目标外，
  其余目标都能被 `grantResources` 的 handler 覆盖；MatchHero 目标（如 10014700 → 10014600）无 handler，
  因此在扣材料前明确拒绝。
- `Convert` 172 行，源物品为 `EquipMatProp`(16)/`Skin`(97)/`ItemFigure`(1)/`ItemRoleSkin`(21)/
  `HouseAssistantItem`(34)/`EmojiItem`(3)；每行 `convert_list` 恰有 1 条固定奖励
  （示例 `157002 -> [[201500,2]]`、`100212 -> [[623002,4]]`、`10013200 -> [[101500,2000]]`）。
- `BoxRepeat` **0 行**；没有任何 Item 行的 type=85（`BoxRepeat`/res_type 1300）；采集的登录 module 54
  （BoxResMgr，重复箱）为空 `{value:[],improper:false}` ⇒ 153 在本客户端不可达。
  `BoxRepeatAward` 13 行存在，但没有 BoxRepeat 行引用它们。
- `ItemLottery` 仅有 4 个物品 `100013400/100023400/100033400/100043400`（乐乐卡 1–4）；
  没有任何表把它们映射到奖池，也没有采集到抽奖结果 ⇒ `lottery_list` 奖励规则证据阻塞。
- `Pay_Box` 2 行（100223/2601200）仍按“需充值处理器”拒绝，不在本任务范围。

## 实现

`personal-server/config/game-tables.mjs`
- ItemTable 读取列表增加 `Convert`，供 154 使用（只读表，无共享行为变化）。

`personal-server/game/item-box-service.mjs`（保留 151/152/155/157/159 全部原逻辑）
- 构造函数新增可选 `heroTables`、`now`；启动时幂等创建 3 张表：
  `item_chip_compose_counts`、`item_box_guarantee_state`、`item_request_receipts`。
- 防重：网关按 `connectionId:seq` 生成 requestKey，事务内比对 `command_type`+payload SHA-256；
  相同请求回放已提交的 `pb_res_to_client` 字节（不重掷随机），同一 key 不同 payload 返回 code 1。
  无 context 的直接服务调用不启用防重，保持既有单测语义。
- 156 `composeChip(simple_use)`：按 `Chip.need_num * num` 扣碎片、发 `num` 个 `point_item`，
  同一事务内写 `item_chip_compose_counts`；材料不足 code 301，未知/非 Chip tid code 5。
- 158 `composeChips(pb_one_key_compose)`：整批先做语法与配置校验（任一非法整批拒绝），
  重复 tid 聚合；库存不足的条目跳过，全部都不足才 code 301（`pb_res_to_client` 没有逐条结果字段，
  这是保守推断，已在此记录）。
- 154 `manualConvert(ETF tid)`：按 `Convert.convert_list` 固定兑换；源物品按所属容器扣减——
  普通物品/货币走 `model.resources`，皮肤走登录 module 65 `pb_skin_info`，家具助手物品走 module 148
  `pb_house_assistant_info`；一次性解锁（ItemFigure）无计数容器，明确 code 5。
  单 positional 语义下 num=1；同时接受 `[tid,num]`/`{tid,num}` 以复用同一固定倍率。
- 153 `openRepeat`：校验 tid 后返回 “Repeatable boxes are not configured in this client build”（code 5），不扣任何资源。
- 157 `openLottery`：校验 `lottery_list` 形状与 ItemLottery 类型后返回
  “Lottery box rewards are not defined by the shipped configuration”（code 5）。
- 随机箱保底计数器改为 `item_box_guarantee_state` 为主、metadata `state.boxGuarantees` 同事务镜像；
  新增 `loginGuaranteePayload()` 输出可解码的 `pb_box_guarantee_list`，**未注入任何登录模块**
  （槽位未定位）。
- `supports()` 扩展为 151,152,153,154,155,156,157,158,159。

`personal-server/game/gateway.mjs`
- `createItemBoxService` 传入 `heroTables`。
- 仍在同一个 `if (itemBox.supports(type))` 受保护块内派发：152/155 保持原路径，新增 153/154/156/158，
  157 在 `lottery_list` 非空时走 `openLottery`，其余保持 `open(box_list)`；159/151 保持原逻辑。
  每次调用带 `{connection:id, seq, type}` 作为防重 scope。

## 验证

```powershell
cd personal-server
node --test test/item-item-service.test.mjs test/item-box-service.test.mjs test/item-suit-box.test.mjs test/gameplay-gateway.test.mjs
npm test
```

- `test/item-item-service.test.mjs` 9 项：碎片合成正常/持久化与计数、非法 tid 与数量、材料不足不落库、
  一键合成部分成功与全部失败、重复 tid 聚合、固定兑换正常与不足、requestKey 回放与 payload 冲突、
  重开数据库后防重仍有效、重复箱/抽奖箱/不可计数来源拒绝、保底 SQLite 持久化与 `pb_box_guarantee_list`
  编码、编码失败回滚。
- `test/gameplay-gateway.test.mjs` 真实临时 TCP：156 扣 60 碎片发 1 hero、158 一键合成、
  154 ETF 兑换 `157002 -> 201500 x2`、153 返回 code 5、157 `lottery_list` 返回 code 5，
  并与既有 151/152/155/157/159 断言一起通过。
- 151/152/155/157/159 既有 `item-box-service.test.mjs`(12) 与 `item-suit-box.test.mjs`(5) 全部回归通过。
- 全量 `npm test`：见提交说明；除 `test/login-business-reads.test.mjs` 3 项缺失本地证据库的既有失败外无新增失败。

## 未闭合缺口

- **153 本版本不可达**：`ItemTable.BoxRepeat` 0 行、无 type=85 物品、登录 module 54 为空；
  `pb_box_repeat` 的 `use_times/get_time` 语义与奖励表未取得，已在代码与测试中固定为业务错误。
- **157.lottery_list 奖励规则未知**：只有 4 个 ItemLottery 物品，无奖池/概率表，也无采集回包。
- **登录槽位未定位**：`pb_box_guarantee_list` 与 `pb_chip_info` 的模块号没有证据，未注入登录；
  `loginGuaranteePayload()` 只提供已核对字段的编码能力，`chip_compose.guaranteed_count` 语义未知，
  因此没有生成 `pb_chip_info`。
- **MatchHeroChip** 13 个目标在 `grantResources` 无 handler，合成明确拒绝。
- **HeroChip 合成**用通用 hero reward handler 生成/累加 hero（uid 语义沿用现有实现），
  重复英雄的 uid/卡片语义仍需真实客户端验证。
- **154 源容器**：皮肤（module 65）、家具助手（module 148）按现有资源 handler 的权威容器扣减；
  ItemFigure 一次性解锁不可按数量扣减，已拒绝。真实客户端批量兑换的 num 语义仍待 APK 验收。
- APK/视觉验收未做；本轮未启停实时服务、未操作模拟器、未改动 `fixtures/game.sqlite` 与 `apk/`。
