# EQUIP-ARTIFACT 实施记录（ArtifactCmd 37060–37075）

- 日期：2026-11-08
- 分支：`task/EQUIP-ARTIFACT-20261107`（worktree `.worktree/gameplay-20261106/equip-artifact`）
- 基线：提示词写作时 main `c4d4c12`；实际开工时 main 已被外部推进到 `866117e`（含 house-assistant 合并），本分支已 rebase 到该提交
- 提交：`eb35706` 资产/配置，`b078ee7` 服务与网关（后续追加本文件）
- 范围：个人服务器 `personal-server/`，不启停实时服务、不读写 `runtime.local-only.data`、不操作模拟器/ADB/APK、不连接原游戏服务器

## 权威状态

圣器状态只有一个权威位置：登录容器 module 50 slot 0 的 `pb_artifact_info`，`personal-server/game/resources.mjs` 的 `grantArtifact()` 已经在同一条形状上写入。

- `artifact_list: pb_artifact[]`：`tid/num/star/star_node/forge_list/stage/quality/level/break_level/is_fly_up/artifact_skin`
- `fetter_list: uint32[]`：已激活圣器羁绊 id
- `skill_list/lineup_list/inject_list/handbook_list`：保留既有字段，不伪造内容

`grantArtifact()` 新建的行只有 `{tid,num}`。`artifact-service.ensureLoginState()` 在登录时按 `Artifact` 配置补齐 `star=init_star`、`quality`（由 tid 前缀推出）、`star_node/stage/level/break_level/forge_list` 等，并写回同一 module 50，因此登录回包与后续命令读取同一份状态。

## 配置与资产

`tools/extract-artifact-table.mjs` 从客户端 Lua 项目 bundle 重新生成两份服务器资产（bundle `assets/Android/script/lua/64_lua_project.bundle`，SHA256 `2b1fd41f3fb40ea3d3dcd1b7d1591d3d17ffacbc6422c028de4dc02ad04ecdc7`，只读，不进入 Git）：

| 资产 | 行数/内容 | SHA256 |
| --- | --- | --- |
| `personal-server/assets/tables/ArtifactTable.data.lua.json.gz` | Artifact 18、Quality 5、QualityNode 6、QualityAddition 6、StarNode 55、StarAddition 135、StarAttrType 3、BreakUp 155、Forge 72、ForgeType 3、FlyUp 11、Fetter 130、HandbookPageConfig 18、HandbookAddition 30、LevelUp 5 | `c648e4bc8f382d660290596d31240863cb9ed2c8573865dfbd021da494bd1909` |
| `personal-server/assets/tables/ArtifactLevelUp.data.json.gz` | 5 个品质 × 601 级 = 3005 行，`tid = quality*10000 + level` | `576a2fdc3822b491068153d5b4f33fb7f68de3c6bcf6baab061e7652c1398729` |

生成命令：

```powershell
node tools/extract-artifact-table.mjs F:/projects/FateCovenantClone/assets/Android/script/lua/64_lua_project.bundle personal-server/assets/tables
```

生成器校验：每品质 601 行、`tid=quality*10000+level`、cost 单调不减、cost_type 仅 `0/391002`。`ArtifactLevelUp` 的行被扁平化，运行时不需解释 LuaJIT 字节码；`*_ValueIndex` 表不进入服务器配置（`readGeneratedTables` 不支持）。

`personal-server/config/artifact-tables.mjs` 提供：`artifactQualityOf()`、`starNode(quality,star)`、`breakUp(quality,breakLv)`、`forge(tid,stage)`、`forgeType(type)`、`flyUp(tid)`、`levelUp(quality,level)`、`fettersForArtifact(tid)`、`maxStarOf(tid)`。

关键常量证据：

- `GetCostChipCfg`（`Artifact.lua` proto 19，firstLine 347）取 `StarNode[quality*100 + star + 1]`，返回 `cost_num*node_num` 与 `smallStar*cost_num`；本服务按前者扣费，节点进度为 `star_node`。
- `BreakUp` key = `quality*100 + breakLv`，`levelLimit` 取当前突破行的 `up_level_limit`（0 突破时为 20）。
- `Forge` key = `artifactTid*100 + stage`，`ForgeType.cost_type` 为实际材料（13002/14002/15002）。
- `ItemTable.TID_ARTIFACT_UPURSTAR_STONE = 339002`（`ItemTable.lua` 字节码 pc 482：`KNUM 339002` → `TSETS TID_ARTIFACT_UPURSTAR_STONE`）；`ReqUpURStar` 同时校验 chip 与 `stone_num`。
- `ArtifactLevelUp.<quality>` 行 key = `quality*10000 + level`（`GetLevelUpCfg`），cost_type 391002。
- `FlyUp` key = artifact tid，cost 647002×10，`star_limit=6`。

## 逐 type 状态

| type | 命令 | 状态 | 服务端行为 | 证据缺口 |
| ---: | --- | --- | --- | --- |
| 37060 | `req_artifact_synthesis` | 服务端完成 | protobuf `{tid,times}`；每 times 推进一个 star node，扣 chip×cost_num，UR 节点另扣 339002×stone_num；满 `node_num` 进位 star；上限 `init_star+max_star`；不足 301 | UR 石 id 已取证；客户端一次最多发送 `node_num-star_node` 个节点，服务端按同规则拒绝越界 |
| 37061 | `req_artifact_strength` | 服务端完成（累计口径为推断） | protobuf `{tid,forge_list}`；按当前 stage 的 `forge_count` 校验、按 ForgeType 扣材料、累加 `forge_list` | `forge_list` 是累计值还是每阶段重置未取得 `CorrectionForgeData` 实包；当前按累计（门槛单调递增且 stage 8 全 0） |
| 37062 | `req_artifact_quality` | 证据待补（fail closed code 5） | 明确拒绝 | `GetNextQualityTid` 的 tid 变换与升级后 star/level 是否重置未完整恢复；`QualityNode` 6 行只能覆盖部分 artifact |
| 37068 | `req_artifact_forge_promote` | 服务端完成 | ETF 单 tid；当前 stage 全部达标后 `stage+1`，回包 `pb_artifact` | 满级/最后阶段的客户端提示文案未取；无消耗 |
| 37069 | `req_artifact_fetter` | 服务端完成（阈值语义为推断） | ETF 单 tid；按 Fetter 表找出包含该圣器且所有 `[tid,star]` 已满足的组合，新的写入 `fetter_list`，回包 `pb_artifact_fetter` | 要求 star 是「等于」还是「大于等于」未取得实包；当前按 `>=` |
| 37070 | `req_artifact_level_up` | 服务端完成 | protobuf `{tid,times}`；逐级读取 `quality*10000+level`，扣 391002×cost_num，受当前突破 `up_level_limit` 限制 | 等级上限是否还受角色等级限制未取证；当前仅用 BreakUp.up_level_limit |
| 37071 | `req_artifact_break_level_up` | 服务端完成 | ETF 单 tid；校验角色等级 `unlock_role_level` 与圣器当前等级上限，扣 392002 等材料，`break_level+1` | 误差文案与最大突破等级边界未取 |
| 37072 | `req_artifact_inject` | 证据待补（fail closed code 5） | 明确拒绝 | ETF 为可变参数全透传（`MOV a=4 c=0` + `CALL b=0`），参数语义、状态字段 `inject_list` 用途均未恢复 |
| 37073 | `req_artifact_handbook_level_up` | 证据待补（fail closed code 5） | 明确拒绝 | 登录数字槽、升级消耗、`pb_u64_kv` 的 key/value 语义未恢复 |
| 37074 | `req_artifact_fly_up` | 部分交付 | ETF 单 tid；校验 `FlyUp.star_limit`、扣 config.cost、置 `is_fly_up=true`，重复操作拒绝 | `star_limit=6` 与品质 50 圣器 `max_star=5` 冲突：`star_limit` 大于该圣器上限时明确 fail closed；品质 60/70（上限 10）可正常飞升 |
| 37075 | `req_artifact_change_skin` | 证据待补（fail closed code 5） | 明确拒绝 | ArtifactSkin 表未提取，皮肤合法性/回包 schema 均未知 |

汇总：6 条完整服务端实现（37060/37061/37068/37069/37070/37071）、1 条部分交付（37074）、4 条明确 fail closed（37062/37072/37073/37075）。

## 测试与证据

复现：

```powershell
node --test --test-concurrency=1 personal-server/test/artifact-service.test.mjs personal-server/test/artifact-gateway.test.mjs
```

- 服务专项：12/12（包含 37060 star node/整星/UR 石、301 不足、37061+37068、37069 去重、37070 上限、37071 角色/等级门槛、37074、4 条 fail closed、`ensureLoginState` 归一化、SQLite 重开、PB 编码失败回滚、SQLite 写入失败回滚）。
- 真实临时 loopback TCP：覆盖 37060、37061、37069、37071、37074 与 37062 fail closed，登录成功后校验 module 50 中的圣器行；握手使用 `pb_c2s/pb_s2c` 真实帧。
- 合并前定向回归：`artifact-service`、`artifact-gateway`、`gameplay-gateway`、`equip-service` 合计 27/27，pass 27、fail 0，日志 `analysis/test-runs/gameplay-20261106/equip-artifact-focused.log`。
- 事务：所有状态/资源/回包编码在同一 `store.transaction` 内；PB 编码失败时 chip、星级整体回滚；`login_modules` 插入/更新 ABORT 触发器验证 SQLite 写入失败整体回滚。
- 重启：关闭并重开 SQLite 后 `star/level` 与资源保持，`ensureLoginState()` 第二次执行 `changed=false`。

## 网关

`gateway.mjs` 只加 20 行：1 条 import、1 个 `createArtifactService` 实例、登录区 `artifact.ensureLoginState()`、一个数字 type 派发块（protobuf 走 `artifact.decode`，其余走既有 `etfArgument`）。

保留项核对：`onlineGift.beginSession()`、`rankAchieve.ensureLoginState()`、`heroExtra.ensureLoginState()`、`firstWeekGoal.loginPayload()`、`growthRoad.ensureLoginState()`、`activityRead.synchronizeHelpUpLogin()`、`groupBuyAct.synchronizeLogin()`、`hundredDraw.synchronizeLogin()`、SOC-MSG 派发、1316 属性、67004/67005、69001/69002、20001–20013、钓鱼 ETF、精英 201/207、团购 100601/100602、207 结算/体力、邮件推送、活动期限、module 8/90 多槽、10501–10511、117001–117005 均未改动；recruit 仍先于 `heroCommandServices`，百抽仍先于通用 `activityRead`。

## 剩余证据与验收边界

未闭合：37062 品质升级映射与升级后状态；37072 inject 语义；37073 圣器图鉴等级登录槽/消耗/回包；37075 圣器皮肤表；37061 累计口径；37069 star 阈值是否含等于；37074 品质 50 的 `star_limit=6` 语义；圣器登录模块数字槽不需要额外槽（本身就是 module 50），但新增推送类型没有取证，当前不发送推送。

本任务没有任何 APK/UI 验收：未启停实时服务、未读写运行数据库、未操作模拟器/ADB/APK、未生成 APK 快照。服务端/TCP/SQLite 通过不等同可玩验收。