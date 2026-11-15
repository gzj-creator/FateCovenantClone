# C ITEM-HOOK 独立复核（78201—78205，2026-11-15）

范围：78201 gather、78202 preview、78203 fast gather、78204 fast produce item、78205 produce item。
本记录是对上一轮 `h1-item-hook.md` 的**独立复核**：重新读取原表、同版 PB、客户端调用者与消费者后，**结论一致——五条命令继续在变更前失败关闭**，但本轮把上一轮未落盘的映射、常量与外部码补齐成可被机器校验的证据，防止后续实现重新猜。

基线：分支 `task/r1-remaining-c-20261115`，提交 12a6a16 建立的独立 worktree。未改任何共享文件。

## 1. 结论（逐 type）

| type | 名称 | 状态 | 支付前仍缺的边界（摘要） |
| --- | --- | --- | --- |
| 78201 | `req_hook_gather` | 仍失败关闭 | 12 个 hook type 的原服务端模块（`peak_tower_hook` 等）均未取得；产出时钟、上限、小数余量取整、游标推进、随机产出与奖励消费者无法闭合 |
| 78202 | `req_hook_preview` | 仍失败关闭 | preview 必须复用同一套未闭合的产出/随机消费者；把已存 `cache_list` 原样当预览会伪造新增产出 |
| 78203 | `req_hook_fast_gather` | 仍失败关闭 | 仅 type 2 的时间与三档价格可达；每 type 的免费/付费次数、`pb_count_list_flush` 语义、`msg_bin` 与写回未闭合 |
| 78204 | `req_hook_fast_produce_item` | 仍失败关闭 | `FastItem` 的 sec/max_speed/item 行可达，但 times 上限、成本与产物落库消费者未取得 |
| 78205 | `req_hook_produce_item` | 仍失败关闭 | 客户端只发 ETF、无请求字段；操作对象、状态变化与资源增量消费者均未取得 |

没有任何一条从 `r1-fail-closed-command-service.mjs` 移除，也没有新增可达 service。

## 2. 原证据

### 2.1 原表（同版客户端 bundle）

| 文件 | SHA256 | 结构 |
| --- | --- | --- |
| `HookTable.data.lua.bin` | `363929DCF7CE5250A65885F33F99A7B9F43FA153A048B3F8F9F9A59E44120B29` | 六族：FastHookType 3、FastItem 61、StyleStatus 2、Type 12、Stage 5593、RandomAward 60 |
| `HookTable.lua.bin` | `ED7E4FA544FF47394D0F2E0689259F1BAB20725C2E28D4C1DE71A7614521C024` | 常量块与 `StageByIndex`/`StageCount` 访问器 |
| `HookBaseData.lua.bin` | `2D0014B17B52ACA9FB74348A981996A13779B834E3077703483F3B4AA208A72F` | 产率/预览消费者 |
| `HookCmd.lua.bin` | `A40C8461FC94F091920B015F855C90965CAC309E6EF4340D4B74C5666DB69E2C` | 五个请求构造 |
| `HookMgr.lua.bin` | `2FEB4B43253518641AC3FCCCED4C72F4B5D2D5BBDCA58EF6EB6971C8FB851B3E` | preview/gather 发送与登录解析 |
| `hook.net.proto.bin` | `9F9AA28514354F3043F2AF844AE025078D552D2A419C21BF0071138EC80150EC` | 网络 schema |
| `hook.db.proto.bin` | `4892591D45E096C8D5B837A57DA7DA4A62353B1A1A7CBBF1DABF36A064587300` | 存档/登录 schema |
| `HookTable.data.json.gz`（仓库资产） | `38ED372AB14C4524174BBBDCC6874C631859E5BBFCCA4FAF28F36E2908BFC466` | 与上表同源导出 |

注：上一轮记录把 `HookTable.data.lua.bin` 的 SHA256 抄成 `…B3F8F9A59E44120B29`，本轮重新哈希得到 `…B3F8F9F9A59E44120B29`（多一个 `F9`）。以本轮为准。

### 2.2 同版 PB 形状

- 请求：`pb_hook_gather_or_preview_req{type_list,msg_bin}`（78201/78202）、`pb_hook_fast_gather_req{type,count,msg_bin}`（78203）、`pb_hook_item_fast_req{item_id,times,msg_bin}`（78204）、78205 只有 ETF 无请求字段。
- 响应：`pb_hook_gather_rsp{res_changes,hooks}`、`pb_hook_preview_rsp{award,hook}`、`pb_hook_fast_rsp{res_changes,hooks,fast_hooks}`、`pb_hook_item_fast_rsp{res_changes,hooks}`、78205 为 `pb_res_to_client`。
- 存档：`pb_hook{type,cache_list(float),last_reap_time,last_gather_time,old_stage,rand_reap_time}`、`pb_fast_hook.fast_count`，整体为 `pb_hook_info{hooks,fast_hooks}`。

### 2.3 客户端调用者与状态所有者

- 生产者：`HookMgr` 的 preview/gather 路径先用 `Codec.EncodeErl(msg)` 生成 `msg_bin`，再交给 `HookCmd.req_hook_preview/req_hook_gather/req_hook_fast_gather/req_hook_fast_produce_item`；78205 由 `HookCmd.req_hook_produce_item` 直接包 ETF。
- 状态所有者：服务端 `pb_hook_info`（模块载荷 schema 已证）。
- 登录 slot：**未闭合**。`ModuleTable` tid 89（`ref_name` 新挂机、`e_dir` `project/hook`、`lua_module` `HookMgr`）只是功能注册行，不是承载 `pb_hook_info` 的数字登录槽。把 89 当登录槽属于伪造投影，本轮明确记录为未解析。

### 2.4 本轮新增的可证明材料

把 `HookTable.lua` 常量块与各 `*HookData` 子类的 `GetProduceId` 逐一读出并对回 Stage 行，得到：

- `CONST_TYPE_DELTA=100000`、`CONST_QUALITY_DELTA=1000`；
- `TID_PEAK_TOWER_LAYER_ONE=1000001`、`BEGIN=1000060`、`MAX=1004580`；
- `TID_HOOK_STAGE_PET_PLAY_1=2300000`、`_2=2400000`；
- `TID_SOUL_TRIAL_PRODUCE_ID_MIN=2000000`、`MAX=2000600`；
- 12 个 Type 的 `erl_module`/`data_class` 对应（如 type 10 → `peak_tower_hook`/`HookPeakTowerData`，17/18/19 → `hero_lease_hook`/`HookGuildCampData`，20 → `soul_trial_hook`，22 → `magical_journey_hook`，23/24 → `pet_play_hook`，25 → `guild_nation_hook`，26 → `summer_act_hook`，27 → `homeland_hook`，28 → `tri_match_tower_hook`）。

这些常量全部落在真实 Stage 行上（`1000001/1000060/1004580` belong 10，`2000000/2000600` belong 20，`2300000` belong 23，`2400000` belong 24），由 `hook-evidence.test.mjs` 断言。

另外两处此前未落盘的事实：

- `RandomAward.random_produce` 的 60 行中有 26 行非 0，取值为 `{201,202,203,205,206,701,702,703,704,705,706,707,1201}`，这些是**外部表 ID**（不在 HookTable 六族内），所有者为未解析。
- 带 `random_award` 的 Stage 共 3063 行，分布：type10 447、type20 12、type22 1801、type23 1、type24 1、type25 801。

## 3. 为什么仍然没有成功链

`HookBaseData` 能证明的是**客户端投影**：`GetProduceCfg` 取 `HookTable.Stage[GetProduceId()]`，`GetAllSpeed` 用 `fixed_award / max_fixed_period` 求每单位时间产率，`ExpandHookAward` 把 `num` 拆成整数份，`HookSoulTrialData.GetCacheAward` 只保留 `num>0` 的整数部分。但这些都是 UI 侧计算，**不能替证服务端**：

1. 12 个 type 对应的原服务端模块名（`erl_module`）虽已取得，模块本体（累积、上限、随机、快收计数）一个都没有；
2. `msg_bin` 是每 type 的 ETF term，不是 protobuf；同版 protobuf bundle 中**没有任何 hook 载荷族**（`hook.net/db.proto` 只有外层），所以 term 形状与服务端校验规则未闭合；
3. `RandomAward.random_produce` 指向 26 个外部 ID，拥有表未定位，无法证明随机产出；
4. `produce_addition`（type10=2、20=77、26=88、28=89）与 `AdditionMgr`/`GuildNationTechUtils` 的加成来源是客户端消费者，服务端对应关系未证；
5. `clear_cache=true`（type17/18/19）的重置时机未证；
6. type 23/24 的 `PetPlay*` 表族未定位，连 produce id 来源都缺；
7. 登录 slot 未闭合，无法把 `pb_hook_info` 正确下发。

按 R1「预览不前移 `last_reap_time`」「余量不丢」「fast 缺次数/成本只拒绝该快收」，这些缺口都必须在扣费、推进游标、发奖之前拒绝，因此五个 type 继续 `GameError(5)`。

## 4. 本轮实现（证据层，不在命令路径上）

- 新增 `personal-server/config/hook-evidence.mjs`：冻结上节全部常量、type↔`erl_module`/`data_class` 映射、`msg_bin` ETF 事实、登录宿主未解析状态、逐 type blocker 与逐命令 readiness；另导出三个**仅供证据核对**的 produce-id 投影函数（`peakTowerProduceId`/`soulTrialProduceId`/`guildCampProduceId`），注释明确禁止接到命令路径。
- 新增 `personal-server/test/hook-evidence.test.mjs`（8 项）：常量落行、映射与资产一致、随机外部码与 Stage 分布固定、登录槽/msg_bin 未解析断言、逐 type blocker 数量 ≥3、`clear_cache` 只在 17/18/19、五条命令仍在 `R1_FAIL_CLOSED_COMMAND_REASONS` 且 `execute()` 抛 code 5、派发审计五条的 `reachableOwner` 仍为 `r1FailClosed`。
- 该模块**未** import 进 gateway，`hook.gameplayReady=false`。

## 5. 验证

```powershell
node --test --test-concurrency=1 personal-server/test/hook-evidence.test.mjs
node --test --test-concurrency=1 personal-server/test/hook-tables.test.mjs
node --test --test-concurrency=1 personal-server/test/r1-fail-closed-command-service.test.mjs
node --test --test-concurrency=1 personal-server/test/command-registry.test.mjs
node --test --test-concurrency=1 personal-server/test/command-dispatch-runtime.test.mjs
node --check personal-server/config/hook-evidence.mjs
npm --prefix personal-server run check:command-dispatch
```

结果：五文件合并运行 22/22 通过（含真实临时 TCP「gateway returns an explicit R1 business refusal and no state change for every unresolved type」，即五条命令均返回 err5 且无状态变化）；`node --check` 通过；命令审计 `total=1407/serviceRoute=1383/gatewayRoute=18/multiOwner=6/unrouted=0/requestEncodingMismatch=186/requestEncodingUnverified=933/responseRuntimeUnverified=1407/responseSchemaMissing=223`，与基线一致（本轮未新增可路由命令）。

### 环境注意（影响所有从提交新建的 worktree）

新建 worktree 默认 `core.autocrlf` 会把 `personal-server/config/command-dispatch-audit.json` 与 `agent/workflow/interface-catalog/static-interfaces.json` 检出为 CRLF，导致：① `check:command-dispatch` 报 stale；② 审计记录的 `staticInterfaces.sha256` 与 HEAD 不同。两者都是换行符伪差异，不是回归。处理：

```powershell
git config core.autocrlf false
Remove-Item personal-server/config/command-dispatch-audit.json, agent/workflow/interface-catalog/static-interfaces.json
git checkout -- personal-server/config/command-dispatch-audit.json agent/workflow/interface-catalog/static-interfaces.json
```

处理前 `command-dispatch-runtime.test.mjs` 也会因此失败；处理后 22/22 通过。另需 `personal-server/node_modules`（新 worktree 无依赖，可临时建 junction 指向主工作树）。

## 6. 给父 agent 的共享文件改动建议

本轮**不需要**改 `gateway.mjs`、`command-dispatch-audit.json`、`09-defects-and-acceptance.md`、rulebook 或 `final-rule-register`：五条命令状态未变。

唯一建议（可选，非必需）：在 `personal-server/game/r1-fail-closed-command-service.mjs` 的既有原因串尾部追加 decisionId，便于日志归因，例如

```
78201: 'ITEM-HOOK: type-to-rate/stage/cap and fractional cache consumer are not recovered (R1-HOOK-PRODUCER)',
```

如需同步 `personal-server/test/r1-fail-closed-command-service.test.mjs` 中对应字符串断言。不加也可，`GameError` 已按 R1 在变更前拒绝。

建议在总 `implementation.md` 增补一行：`ITEM-HOOK 78201—78205 经 C 组独立复核仍失败关闭；新增 hook-evidence.mjs 冻结 12 type 映射、produce-id 常量、RandomAward 外部码与登录槽未解析事实，专项 8/8。`

## 7. 分层验收

| 层 | 状态 |
| --- | --- |
| 原证据已闭合 | 原表六族、同版 PB 外层、客户端五条请求构造、`HookBaseData` 投影消费者、12 type 映射与 produce-id 常量：已闭合 |
| R1 推定 | 无新增推定（produce-id 投影函数仅复述客户端消费者，未升级为服务端规则） |
| 服务端完成 | 未完成（五条均无成功链，继续 err5） |
| 离线 TCP | 已验证（真实临时 TCP：五条返回业务错误 5 且状态不变） |
| 存档/重开 | 未验收（本轮不写 `pb_hook_info`；既有存档保持只读投影） |
| APK | 未验收 |
| 生产 TCP / 生产库 | 未验收 |
| 部署 | 未执行 |

