# H1 ITEM-HOOK 证据与实施（2026-11-15）

批次：R1 H1，命令 78201、78202、78203、78204、78205。本记录只列本轮实际取得的原证据、已登记的离线表和仍然缺失的动作边界。五个 type 都缺少把“当前挂机实例/阶段”变为可结算产出的权威服务端生产者，因此本轮继续支付前失败关闭，不把表存在或客户端预览页存在当成玩法完成。

## 原证据

- 原配置：`HookTable.data.lua.bin`，SHA256 `363929DCF7CE5250A65885F33F99A7B9F43FA153A048B3F8F9A59E44120B29`。抽出的 `HookTable.data.rows.json` SHA256 为 `BFEA7411C418563651C9776FBD261D87C616F86A818756820C4C6209DD403713`。families 行数：FastHookType 3、FastItem 61、StyleStatus 2、Type 12、Stage 5593、RandomAward 60。
- `Type` 的 12 个 tid 为 10、17、18、19、20、22、23、24、25、26、27、28，分别指向 `HookPeakTowerData`、`HookGuildCampData`、`HookSoulTrialData`、`MagicalJourneyHookData`、`PetPlay*Data`、`GuildNationHookData`、`SummerActHookData`、`HookHomelandData`、`TriMatchTowerHookData` 等各玩法数据。`produce_period/max_fixed_period/fast_gather_type` 是类型级时钟和不变量，但 `Stage.belong_hook_type` 没有给出这些玩法实例的当前阶段快照，不能据此替客户端当前玩法状态。
- 同版 PB：`personal-server/assets/protobuf/hook.net.proto.bin`（SHA256 `9F9AA28514354F3043F2AF844AE025078D552D2A419C21BF0071138EC80150EC`）声明 `pb_hook_gather_or_preview_req{type_list,msg_bin}`、`pb_hook_fast_gather_req{type,count,msg_bin}`、`pb_hook_item_fast_req{item_id,times,msg_bin}`；响应分别为 `pb_hook_gather_rsp{res_changes,hooks}`、`pb_hook_preview_rsp{award,hook}`、`pb_hook_fast_rsp{res_changes,hooks,fast_hooks}`、`pb_hook_item_fast_rsp{res_changes,hooks}`。78205 没有请求 schema，客户端只发 ETF 后期待 `pb_res_to_client`。
- 存档 PB：`personal-server/assets/protobuf/hook.db.proto.bin`（SHA256 `4892591D45E096C8D5B837A57DA7DA4A62353B1A1A7CBBF1DABF36A064587300`）声明登录/同步 `pb_hook_info{hooks,fast_hooks}`。`pb_hook` 保存 `type`、float `cache_list`、`last_reap_time`、`last_gather_time`、`old_stage`、`rand_reap_time`；`pb_fast_hook.fast_count` 是 `pb_count_list_flush`。具体登录 slot 数字没有在这些 PB 中声明；客户端 `HookMgr:LoginParse` 只把该 slot 的载荷按 `pb_hook_info` 解码，本轮没有把某个未知数字槽推定成 Hook。
- 客户端生产入口：`HookCmd.lua.bin`（SHA256 `A40C8461FC94F091920B015F855C90965CAC309E6EF4340D4B74C5666DB69E2C`）构造上述三种 PB 请求以及 ETF 产物请求；`HookMgr.lua.bin`（SHA256 `2FEB4B43253518641AC3FCCCED4C72F4B5D2D5BBDCA58EF6EB6971C8FB851B3E`）包含 preview、gather、multi-gather、fast-gather、item-fast 和登录刷新调用者；`HookBaseData.lua.bin`（SHA256 `2D0014B17B52ACA9FB74348A981996A13779B834E3077703483F3B4AA208A72F`）含 `GetCacheAward/GetProduceCfg/GetRandomDropAward*/GetFastTime/CheckCanGetAward/ExpandHookAward/_CalcSpeedByUnit` 等消费者，但这些方法依赖各玩法自己的 data class、阶段、加成和幸运/随机时间状态。

## 离线表登记

- 新增 `personal-server/assets/tables/HookTable.data.json.gz`，SHA256 `38ED372AB14C4524174BBBDCC6874C631859E5BBFCCA4FAF28F36E2908BFC466`，保留六个原 family，未把空表或推定值补入。
- 新增 `personal-server/config/hook-tables.mjs`，严格校验各行数量、tid 唯一性、Type 时钟、FastHookType/FastItem 引用、Stage fixed_award 两元组和 RandomAward tid 引用。`Stage.random_award` 的原始形状是 RandomAward tid 列表，不是资源两元组；测试曾发现该差异并已按原表修正。
- 该配置只服务后续实现和证据核对，当前没有注册到命令派发，不会把表加载成功误当动作成功。

## 逐 type 结论

| type | 已证请求/状态 | 仍缺的支付前边界 | 状态 |
| --- | --- | --- | --- |
| 78201 req_hook_gather | `type_list/msg_bin`；回 `res_changes/hooks`；缓存与游标 PB 已证 | `msg_bin` 的玩法自定义解释，type→当前阶段/产率/累计上限，小数余量与发整取整，`last_reap_time/last_gather_time/old_stage/rand_reap_time` 的推进顺序，原奖励消费者 | `GameError(5)`，不扣资源、不推进游标、不发奖 |
| 78202 req_hook_preview | 复用 `type_list/msg_bin`；回 `award/hook` | 与 78201 相同的预览计算及“不回写”契约；现有缓存不能冒充随时间新增的预览 | `GameError(5)`，尤其不把 `cache_list` 原样当预览 |
| 78203 req_hook_fast_gather | `type/count/msg_bin`；回 `res_changes/hooks/fast_hooks`；FastHookType 2/4/5 与成本材料/价段行已登记 | type 对应的玩法阶段和快收可收费次数、免费/付费 count 下标、`pb_count_list_flush` 计数语义与上限，成本扣减和产出写回的事务边界 | `GameError(5)`，不先扣 101500 或其他道具 |
| 78204 req_hook_fast_produce_item | `item_id/times/msg_bin`；回 `res_changes/hooks`；FastItem 61 行的 `sec/max_speed/item/label` 已登记 | item_id 许可、times 上限、type/阶段到产率与加速效果、原成本和产出落库/资源消费者 | `GameError(5)`，不增加缓存或扣消耗 |
| 78205 req_hook_produce_item | 客户端 ETF 无请求字段；期待 `pb_res_to_client` | ETF 参数含义、操作对象、原状态变化和资源增量消费者均未取得；不能用空参数猜一次收取 | `GameError(5)`，不资源变更、不写 hook 状态 |

## 已有合法历史

按 R1 `ITEM-HOOK` 决定，已有 `cache_list` 的 float 缓存、`last_reap_time/last_gather_time/old_stage/rand_reap_time` 和 `pb_fast_hook.fast_count` 可作为只读权威存档并随登录原样投影；本轮没有迁移、清空或重算它们。由于客户端登录槽数字没有闭合，本 family 不新建兼容槽，等待父实现拿到总登录模块映射后串行接线。

## 验证

```powershell
node --test --test-concurrency=1 personal-server/test/hook-tables.test.mjs
node --check personal-server/config/hook-tables.mjs
```

实际结果：HookTable 结构专项 6/6 通过；`node --check` 通过。未注册服务、未移除共享失败关闭表、未做真实临时 TCP。未启停实时服务或设备，未读写生产库，未构建/安装 APK。

## 接线结论

- `personal-server/game/r1-fail-closed-command-service.mjs` 已保留 78201—78205 的显式原因；本轮不改该共享文件。
- `gateway.mjs`、命令审计配置和验收文档均未改；没有可以移除的 type。
- 父 agent 只需合并本 family 的离线表、配置、专项和本证据记录；不要因六个表校验通过而删除共享失败关闭项。

## 源文件

- `personal-server/assets/tables/HookTable.data.json.gz`
- `personal-server/config/hook-tables.mjs`
- `personal-server/test/hook-tables.test.mjs`
