# G2 背包宝箱开启报错

状态：组件测试 + 临时 TCP 集成通过；**APK 实测与视觉验收未完成**。

## 证据

- 运行事件日志：type 159 `req_one_key_use_item` 于 2026-10-25T15:16:26Z 返回 `unsupported_command`，请求体 9 字节（单个 `simple_use`）。
- 接口目录：`ItemCmd` type 151 `use_box`(`simple_use`)、152 `use_selected_box`(`selected_use`)、153/154/155(ETF)、156、157 `batch_use_box`(`pb_batch_use_box_req`)、158、159 `req_one_key_use_item`(`pb_one_key_use`)；响应统一 `pb_res_to_client{changes[],is_overflow}`。
- `general/res.net.proto.bin`、`item.net.proto.bin`、`item_box.net.proto.bin` 提供上述结构；`item_box.db.proto.bin` 说明保底对象 `pb_box_guarantee`。
- 配置：`ItemTable` 的 `Item`(4171)/`Type`(93)/`Random_Box`(146)/`Designated_Box`(63)/`OptionalBox`(344)/`BoxRepeat`(0)/`Pay_Box`(2)；`DrawTable` 的 `LibWeight`(589)/`Group`(820)/`Item`(2540)。
- 存档事实（handoff 备份只读查询）：唯一可开启宝箱为 `2261200`（数量 2，`Type=84`，`obj_class=ItemBox`，`res_type=1200`），其规则来自 `Random_Box.draw_lib=472`；`LibWeight[472].weight_group=[[50,49034],[9950,49035]]`，`Group.lib_range=[[weight,res,num],...]`，保底字段全空。其余背包物品为材料/货币类，不是宝箱。

## 根因

网关没有 151/157/159 处理器；宝箱不是“未实现”就是直接报错。

## 实现（`personal-server/game/item-box-service.mjs`）

- 仅执行**完全由配置定义**的普通随机宝箱：`ItemBox/ItemSuitBox` 类 + `Random_Box` + `DrawTable` 权重（先按 `weight_group` 选组，再按 `lib_range` 权重选奖励）且无任何保底字段。
- 事务内合并同一 tid 的扣减与发放，回包 `pb_res_to_client{changes}`；库存不足、数量非法、未知物品全部拒绝且不改状态。
- 明确拒绝：`OptionalBox`（选择语义未证实）、`Designated_Box`（规则未证实）、`Pay_Box`（需充值处理器）、`BoxRepeat`（需重复箱状态）、含保底的抽奖库；157 的 `lottery_list` 非空直接拒绝。
- 151 = 单个 `simple_use`；159 = `pb_one_key_use.use[]`；157 = `pb_batch_use_box_req.box_list[]`。152/153/155/156/158 未接入。

## 实现边界

- 随机数来自服务端（测试注入确定随机），因此同一请求可能得到不同奖励；这是配置定义的随机宝箱行为，不是伪造。
- 保底计数、`pb_box_guarantee` 持久化、`new_bin/extra` 资源附加数据、宝箱批量展示文案均未实现。
- 奖励资源仍受 `grantResources` 限定：若抽到尚未支持 `res_type` 的奖励，整笔使用回滚并报错（不会吞箱）。

## 复现

```powershell
node --test personal-server/test/item-box-service.test.mjs
node --test personal-server/test/gameplay-gateway.test.mjs
```

注：`DrawTable.data.lua.json` 是本轮新增的生成产物（`analysis/tools/dump-lua-file.mjs` 从 `lua-bundles/.../textassets/*-DrawTable.data.lua.bin` 生成），个人服务器读取它来解释抽取库；重新生成命令：`node analysis/tools/dump-lua-file.mjs <DrawTable.data.lua.bin> analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_project.bundle/bytecode/DrawTable.data.lua.json`。
