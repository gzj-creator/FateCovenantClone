# ITEM-COMMONTASK 实施记录（9005 req_finish_common_task）

分支：`task/ITEM-COMMONTASK-20261106`，worktree `.worktree/gameplay-20261106/item-commontask`，基线 main `a5300de`。
本轮只做服务端实现、专项测试与交付记录；未启停实时服务、未操作模拟器、未读写 `runtime.local-only.data`。

## 结论

9005 已接入真实业务路径：ETF 参数（单个任务 id 或同组 id 列表）→ 权威进度校验 → SQLite 领取记录 + 模块 90 `receive_list` 位图 → `common_receive_back` 回包，全部在一个事务内提交，重复领取回 310，进度不足回 5。9010 主线线性任务保留，并按同一模块槽位布局修正。

仍未闭合的两项在文末“剩余缺口”单列：通用任务奖励列在客户端表中为空，以及爬塔（type 1602）进度函数没有本服数据源。

## 协议与客户端依据

- `CommonTaskCmd.req_finish_common_task(param, cbDone, cbFail)`：`EncodeErl(param)`，参数是任务 tid 或 tid 列表（ETF）。
- `CommonTaskMgr.LoginParse`：模块 90 的 `serverDataL` 每个槽位按 `TaskTable.CommonTaskGlobalByIndex(i)`（i=1..`CommonTaskGlobalCount`）取组配置，用 `Codec.DecodePbList('pb_common_task')` 解码，`Core.BitBlock` 还原 `receive_list`；`progress_type == ONLY_STATE` 用 `StateTask`，否则 `ProgressTask`，最后交给 `MainLinearTaskMgr.LoginParse`。
- `pb_common_task { bytes receive_list = 1; }`，`common_receive_back { pb_common_task common_task = 1; pb_res_to_client res = 2; }`。
- `CommonTask.lua` 的 `GetState` 用 `receiveList:Get(tid % 10000)` 判断是否已领取，`BASE_NUMBER = 10000`。
- `MethodTable`：`progress_fun` 2 = `MissionMgr.GetPassedSection`、10 = `GetPassedChapter`、12 = `PeakTowerMgr.GetTowerLayer`、247 = `EliteMissionMgr.GetPassedChapter`、155 = `DestinyMgr.RealStage`。

组配置（`TaskTable.CommonTaskGlobal`，按 tid 排序）：`1→1201`、`3→1602`、`4→1202`、`5→9001`。捕获的真实登录包里模块 90 有 5 个空槽位，正好是 4 个通用任务组加 1 个线性任务组，因此槽位按“通用组顺序在前、线性组在后”排布：1201→0、1602→1、1202→2、9001→3，线性 type 1→4。

## 新增与修改

- `personal-server/assets/tables/TaskTable.CommonTask.{1201,1202,1602,9001}.data.lua.bin`：客户端 `TaskTable.CommonTask.<type>` 原始 LuaJIT 数据块（`TaskTable.data.lua` 里只存文件名）。行数 565/179/1800/230，tid = `type*10000+序号`。
- `personal-server/config/common-task-tables.mjs`：定向解析（每行是字面量数组 + 共享字段名表，字段序 `tid,type,target_count,award,award_n,effect,show_award,show_award_n`），校验行数、tid 区间、重复行，并按 `CommonTaskGlobal` 生成组槽位。
- `personal-server/game/task-service.mjs`：新增 9005 领取、进度函数、奖励映射与位图写回；9010 的线性槽位改为“通用组数量 + (type-1)”。
- `personal-server/game/gateway.mjs`：任务路由按 type 分支解析 ETF；9005 接受单个 id 或 id 列表，9010 仍是单 id。
- `personal-server/test/item-commontask-service.test.mjs`：新增 7 项专项测试；`test/task-service.test.mjs` 与 `test/gameplay-gateway.test.mjs` 读取线性任务槽位的地方随布局改为 4（`loginModuleBytes` 增加槽位参数）。

已确认不受影响：`storage/game-store.mjs` 的 v5 迁移只处理升级到 5 的旧库，且空槽直接跳过，新库不会带着通用任务数据重跑该迁移。

## 进度口径

旅程节点编号是 `chapter*100 + index`（组 1201 的 target 从 106 起、组 1202 的 target 是章节数，两者与该编号一致）：

- `progress_fun = 2`（1201）：取主线游标所在节点，返回 `chapter*100 + index - 1`，即最后一个已通过节点。
- `progress_fun = 10`（1202）：统计“所有节点 key 都落在游标之前”的章节数。
- `progress_fun = 247`（9001）：用模块 140 `pb_elite_mission.mission_id` 定位精英节点，按同样口径统计已通过章节数。
- `progress_fun = 12`（1602，爬塔层数）：本服没有爬塔登录模块与状态来源，明确回 `GameError(5, 'Common task progress is not implemented')`，不猜测层数。
- 其他 `progress_fun` 同样明确拒绝。

判定全部读服务端状态（模块 8 主线游标、模块 140 精英游标），不接受客户端上报完成。

## 事务、防重与回包

`store.transaction` 内依次：读模块 90 对应组槽位的 `pb_common_task` → 位图与 `reward_claims` 双重查重 → 校验进度 → 置位（`setBit`，MSB-first，索引 `tid % 10000`）→ 写 `reward_claims(claim_type='common_task', claim_key=String(tid))` → 有奖励配置时 `grantResources` → 回写槽位并编码 `common_receive_back`。任一步抛错（编码或 SQLite 写入失败）整体回滚；实测触发器拒绝插入时模块与资源都不变。

codec 把 protobuf bytes 解成 base64 字符串，服务端用 `binaryField` 同时接受 base64 与 ETF 二进制对象，写回统一编码为 base64。

## 验证

```powershell
cd .worktree\gameplay-20261106\item-commontask\personal-server
node --test test/item-commontask-service.test.mjs   # 7/7 通过
npm test
```

专项测试覆盖：组配置与槽位、已通过章节可领、进度不足被拒且状态不变、重复领取 310、重开数据库仍 310、非法 id、跨组列表、同组列表一次事务领取、爬塔进度明确拒绝、SQLite 触发器失败回滚。

## 剩余缺口

1. **奖励列为空**：四张组表 2774 行的 `award`/`award_n`/`effect` 全为 nil（`show_award` 亦为 0），客户端表里没有通用任务奖励数据。实现按 `award`+`award_n`（或成对数组）通用映射，当前数据下领取只置领取位、`res.changes` 为空。真实奖励需要服务端奖励配置证据，不能编造。
2. **爬塔进度**：`progress_fun 12` 依赖 `PeakTowerMgr.GetTowerLayer`，本服没有爬塔模块/状态，1602 组的领取目前不可达。
3. **模块 90 槽位**：布局依据是捕获登录包的 5 个空槽加客户端解析顺序；9010 的槽位随之从 0 移到 4，属于本轮发现并修正的历史偏差，需要在隔离 APK 上做一次线性任务与通用任务的联合视觉验收。
4. 未做 APK 验收；真实客户端操作由总控安排。
