# H2 HERO-INTELLI 证据与实现（2026-11-15）

任务族：`HERO-INTELLI`，命令 `701`、`702`。本轮只处理该族，不改共享网关、失败关闭表、命令审计配置、`docs/**` 或其他 agent 的实施文件。

结论：同版原始数据和客户端调用足以确认协议、列表字段、品质计时和部分索引，但不足以证明解锁资格、派遣英雄选择、奖励公式、刷新跨日以及完成领取状态机。因此 `701/702` 继续支付前失败关闭；客户端开始和完成列表不能直接推到服务端状态，也没有把表存在当成玩法完成。

## 原证据

- 原配置：`analysis/scratchpad/time-temple-20261108/project/16322518041393162000-IntelliTable.data.lua.bin`，SHA256 `FCDA2236764D048EF111223C2A7F057221E822F4C546850185BB66907E3E19A9`。七族行数为 `Type 8 / Refresh 41 / Quality 4 / Award 164 / AwardType 4 / Const 1 / Intelli 24`。
- `Type` 的 tid 为 1 到 8，分别引用 `unlock` `389242300001` 到 `389242300008`，每行 `unlock_params=[3]`。
- `Refresh` 按 `star_limit 0..40` 映射品质：0..10 为 20，11..20 为 30，21..30 为 40，31..40 为 50。
- `Quality` 20/30/40/50 的 `finish_time` 均为 7200 秒；`quality_property` 分别为 8002/8006/8013/8003。
- `Award` 164 行包含 `fixed_award_n/extra_award_n`，`AwardType` 1 到 4 指向 31002/32002/33002/201500，权重 25/15/10/25；`Const.fixed_award=[[1,1],[2,1],[4,1]]`。这些行不能单独解释情报完成奖。
- 同版 PB：`intelli.net.proto.bin` SHA256 `FCD803DB4D589B5CDE0974C59F408FFE4FD44CDCC6D7C56A1B9A22DE859095F4`。`701` 请求 `pb_intelli_unlock_req.intelli_id_list`；`702` 请求 `pb_intelli_batch_handle.finish_list/start_list/is_assistant`；两者响应均为 `intelli_to_client{res,intelli_list}`。
- 存档 PB：`intelli.db.proto.bin` SHA256 `87392CFADE6D14C372BA4CAE779A16A5B22302B97D9804C86A3D67221218685B`。`pb_intelli_info` 含 `intelli_list/last_refresh_stamp`；单项含 `tid/type/finish_time/finished/award_type/star`。命令注册证据确认该登录载荷位于模块 27。
- 客户端生产者：`IntelliCmd.lua.bin` SHA256 `408FFF360B5AA4867D93BE24FBAB7F795521202F7B3B1F3D8D044F0D854E03FA` 构造上述两个请求；`IntelliNetMgr.lua.bin` SHA256 `272FC1579580715A144CAC9CC97EDD0B4FCCFEC94311EA1AC1E21A209E5E8773` 发送请求并把 `intelli_to_client.res/intelli_list` 交给 `IntelliMgr`。
- 客户端消费者：`IntelliMgr.lua.bin` SHA256 `C6C58A1F4B1254C71DBE5DEFDFB5C6359707A8C23013922C19FF5E799F3BEE73`。`ParseLogin` 把模块 27 解码为 `pb_intelli_info`；状态由 `finish_time`、服务端时钟和 `finished` 共同决定。`CreateIntelliByType` 只生成客户端对象 `{type,award_type=AwardByIndex(1).tid,star=0}`。
- 派遣 UI：`IntelliDispatchForm.lua.bin` SHA256 `A7787A0AB42462F37BC4AB4A8A81D848F8998B156C00AFFC74ABCD3AF8DCD95C`。客户端会检查候选英雄、数量和资源，但 `702` PB 不携带英雄 uid；服务端如何选择、校验或保存派遣英雄没有取得。

## 原始数据的硬缺口

客户端 `IntelliMgr` 读取 `IntelliTable.Intelli(tid)` 的以下玩法字段：

- `award`、`award_n`：完成奖 tid/数量；
- `hero_star`、`hero_quality`：每个槽位的英雄门槛；
- `conditions[slot]`：星级、阵营和品质条件。

同版 `IntelliTable.Intelli` 的 24 行实际只有 `tid/quality/show_name/des_id` 四列，LuaJIT 常量边界、字段映射和逐行数组均已复核，不存在上述玩法列。`MethodScript.data.json.gz` SHA256 `7EB11C931A68A54DC67EF0F4E7572AEF22DCAB31AE0F0A52A2F811E4B7B0D6E6` 的 `tables` 为空，仓库内也未找到对应原始 `MethodScript.data.lua.bin`；因此 `Type.unlock` 的 `ScriptEval` 不能求值。

这些字段不能分别从 `Refresh/Award/AwardType` 拼接：表间只有类型和索引关系，没有证明哪一行适用于哪个 type/star/slot，也没有证明 `fixed_award_n/extra_award_n` 的抽样与叠加方式。`CampsiteTable.Group`、功能/营地状态与时区日界亦未闭合。

## 逐 type 结论

| type | 已闭合 | 支付前仍缺的边界 | 当前状态 |
| --- | --- | --- | --- |
| `701 req_intelli_unlock` | 同版 PB、模块 27 登录载荷、八条 Type unlock id、客户端发送和响应消费者 | `MethodScript.ScriptEval` 无可执行原配置；Campsite 功能/营地开放资格未恢复；逐 id 列表校验、重复解锁返回、持久化与刷新代价均未证 | 保留 `GameError(5)`；不写解锁位、不扣资源、不改刷新时间 |
| `702 req_intelli_batch_handle` | PB 的开始/完成/is_assistant 外形；两小时 Quality 时钟；Award/AwardType 原行；服务端列表登录投影字段 | Intelli 行缺完成奖和英雄条件；服务端无法从无英雄 uid 的 PB 证明派遣选择；开始置数、`finished` 独立领取位、奖励抽取/数量、自动派遣、跨日刷新和重复请求结果均未闭合 | 保留 `GameError(5)`；不开始、不改 `finish_time/finished/star/award_type`、不发奖、不移除英雄派遣 |

即使请求只包含合法的 `start_list` 或 `finish_list`，当前也不能把两者都当成完成：`start_list` 必须先建立带 finish_time 的权威实例，`finish_list` 只能领取已完成且尚未领取的实例。缺少这两段状态转移时，任何部分成功都会制造不可回滚权益。

## 离线表登记

- 新增 `personal-server/assets/tables/IntelliTable.data.json.gz`，SHA256 `A7C599E55A3E1C85485081B8216FF11377EEB0DC6DEB95B1979C13C5DB335CC0`。资产原样保留七族，没有补入缺失玩法列。
- 新增 `personal-server/config/intelli-tables.mjs`，校验准确行数、Type 解锁脚本/参数、Refresh 星限与品质引用、7200 秒计时、核心 Award/AwardType 索引，并明确列出缺失的五列。`gameplayReady=false`，防止后续误把离线表登记当成可执行规则。
- 新增 `personal-server/test/intelli-evidence.test.mjs`，固定原表事实和“不得视为玩法完成”的边界。该配置未注册到网关或命令服务。

## 验证

```powershell
node --test --test-concurrency=1 personal-server/test/intelli-evidence.test.mjs
node --check personal-server/config/intelli-tables.mjs
npm --prefix personal-server run check:command-dispatch
git diff --check
```

实际结果：专项 `6/6` 通过，`node --check` 通过；命令审计为 `total=1407/serviceRoute=1383/gatewayRoute=18/multiOwner=6/unrouted=0`，未改变 `701/702` 的现有失败关闭状态；`git diff --check` 通过（仅有仓库既存换行提示）。未注册服务，未改共享文件；没有可移出失败关闭表的 type。

未验收项：真实临时 TCP、SQLite 变更/重开、登录同步、在线推送、APK、生产部署均为“未验收”。`701/702` 没有可执行的成功动作，因此本族没有伪造成功路径。

## 父 agent 合并说明

本族只合并三个新增离线文件和本记录。不要删除 `r1-fail-closed-command-service.mjs` 的 `701/702`；共享命令审计的现有标注仍准确。若后续要升级规则，需要补齐上述原列/解锁脚本和真实服务端处理链，或取得原服务端函数作为新证据并走 R2/冻结实例兼容流程。
