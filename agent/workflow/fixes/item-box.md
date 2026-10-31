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
- 明确拒绝：`Designated_Box`（规则未证实）、`Pay_Box`（需充值处理器）、`BoxRepeat`（需重复箱状态）；157 的 `lottery_list` 非空直接拒绝。
- 151 = 单个 `simple_use`；159 = `pb_one_key_use.use[]`；157 = `pb_batch_use_box_req.box_list[]`。152/153/155/156/158 未接入。

## 实现边界

- 随机数来自服务端（测试注入确定随机），因此同一请求可能得到不同奖励；这是配置定义的随机宝箱行为，不是伪造。
- 2026-10-31 起，配置中带正保底的三个随机箱会持久化 `noGuaranteeCount/openCount/counterGuaranteeCount/openTotalCount`，达到本机兼容阈值后强制从 `guaranteed_group` 抽取；训练见 `personal-server/test/item-box-service.test.mjs`。`pb_box_guarantee` 登录回包槽位、`new_bin/extra` 资源附加数据和宝箱批量展示文案仍未实现。
- 奖励资源仍受 `grantResources` 限定：若抽到尚未支持 `res_type` 的奖励，整笔使用回滚并报错（不会吞箱）。

## 复现

```powershell
node --test personal-server/test/item-box-service.test.mjs
node --test personal-server/test/gameplay-gateway.test.mjs
```

注：`DrawTable.data.lua.json` 是本轮新增的生成产物（`analysis/tools/dump-lua-file.mjs` 从 `lua-bundles/.../textassets/*-DrawTable.data.lua.bin` 生成），个人服务器读取它来解释抽取库；重新生成命令：`node analysis/tools/dump-lua-file.mjs <DrawTable.data.lua.bin> analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_project.bundle/bytecode/DrawTable.data.lua.json`。

## 2026-10-29 自选礼包修复（`feature/gift-self-select`）

### 现象与根因

- 背包中的 `OptionalBox`（例如 `71200` SSR 冒险者碎片自选、`81200` SR、`91200` R）使用后客户端报“服务器发生错误”。
- 客户端 `ItemCmd` 将 `use_selected_box` 映射为 type 152，请求体为 `selected_use{tid,num,selected[{index,num}]}`；网关没有 152 分支，落入 `unsupported_command`。
- 即使接入 152，`item-box-service.rule()` 也会对 `OptionalBox` 直接抛 `Optional box selection is not implemented`；奖励中的 SSR/SR/R 冒险者碎片为 `res_type=4`（`HeroChip`），旧 `grantResources` allowlist 也不接受，会在扣箱后回滚。

### 协议与配置事实

- `selected_use`：`tid:int32`、`num:uint32`、`selected[]{index:uint32,num:uint32}`；响应仍为 `pb_res_to_client{changes[],is_overflow}`。
- 反编译 `ItemBox.lua` 的 `_ReqUseSelectedBox` 要求 `sum(selected[].num) == OptionalBox.optional_num * num`；`ItemBoxSelectUseForm/Node` 的 `index` 是 `OptionalBox.range` 的 1-based 原始下标，`range` 每项为 `[rewardTid,rewardNum]`。
- 当前 `OptionalBox` 共 344 个，`optional_num` 全为 1；`71200/81200/91200` 的选项分别为 27/22/10 个，全部奖励均存在 `ItemTable` 且 `res_type=4`。`11200` 是整卡自选，奖励是 Hero 而不是 `ItemTable` 物品，仍需独立创建英雄处理器，继续明确拒绝。

### 实现

- `personal-server/game/item-box-service.mjs`
  - `rule()` 现在识别 `OptionalBox`，校验 `optional_num`、`range`、奖励 tid 和数量；`openSelected()` 校验 tid/num、`selected` 非空、index 1..range.length、每项数量、聚合重复 index，并严格要求总数等于 `optional_num*num`。
  - 事务内扣除自选盒，按选择项发放 `range[index-1]` 的 `[rewardTid,rewardNum*count]`，合并 changes 后回 `pb_res_to_client`；库存不足、越界、数量不匹配、编码失败全部整笔回滚。
  - `open()`（151/157/159）保持随机箱逻辑；遇到 `OptionalBox` 时明确拒绝，避免“简单使用”绕开选择而吞箱。`supports()` 增加 152。
- `personal-server/game/gateway.mjs`：type 152 解包 `selected_use` 并调用 `openSelected()`，不再落到 `unsupported_command`。
- `personal-server/game/resources.mjs`：新增 `res_type=4`（HeroChip）允许发放，并放入 module 6 的 group 2（与现有英雄碎片容器一致）；仍不接受未实现域的资源类型。

### 验证

- `node --test personal-server/test/item-box-service.test.mjs`：7/7 通过；覆盖 `71200` 单开、multi-open、重复 index 聚合、空/越界/数量不匹配/库存不足原子拒绝、随机箱和自选箱编码失败回滚。
- `node --test personal-server/test/gameplay-gateway.test.mjs`：真实临时 TCP 网关通过；`159` 随机箱回归正常，`152` 自选箱返回 `pb_res_to_client`，扣 `71200` 1 个并发放 `21300104` 1 个，持久化到临时 SQLite。
- `npm test --prefix personal-server`：本工作树基线 121/121 通过（基于 `feature/welfare-gift-fix` 32243cc；主工作树另有未提交改动，未合并、未触碰）。

### 边界

- 本工作树没有启动/重启实时服务，没有修改实时 SQLite，也没有操作客户端；APK 实测与视觉验收仍未完成，不能把组件/TCP 通过写成可玩验收。
- `11200` 整卡自选、Relic/Artifact/Treasure/Pet/Elves 等需要各自域处理器或英雄创建的自选箱仍会明确报业务错误，不会伪造奖励或吞箱。
