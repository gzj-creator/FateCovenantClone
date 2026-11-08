# ITEM-FUNCTIONMANUAL 实施记录

日期：2026-11-08
分支：`task/BLOCK-D-20261108`（worktree `.worktree/gameplay-20261108/block-d-20261108`）
基线：`main@bd650ba`

## 结论

已接通 `82301 req_function_manual_award`：ETF 单 `tid` 请求、`FunctionManualTable.Task` 真实任务条件、模块 `106` 登录快照（`pb_function_manual.got_award`）、领取位落 SQLite、资源按 `award` 发放、回包 `pb_function_manual_award_rsp`。任务进度只认本服已有的三个来源（主线游标、通关章节数、模块 21 统计），其余 `progress_fun` 明确返回业务错误 `5`，不按固定值放行。

状态：服务端完成（手册 28 行中仅统计源与主线章节源的行可领取，其余进度源阻塞）；未做 APK 验收。

## 配置与协议依据

- `ModuleTable` 行 `tid=106`（“功能手册”，`project/function_manual`）——登录容器号即模块 tid；同表 `show_name=8755` 是显示名文本 id，不是模块号（见块级记录中关于 `show_name` 的说明）。
- `personal-server/assets/protobuf/function_manual.table`：`pb_function_manual { bytes got_award }`、`pb_function_manual_award_rsp { bytes got_award; pb_res_to_client res_change }`。
- `FunctionManualCmd.lua` 反汇编字符串：`req_function_manual_award | EncodeErl | param`，即请求参数以 ETF 编码、只有一个 `param`；回包 `EncodePB`。
- `FunctionManualMgr.lua`：`LoginParse` 解 `pb_function_manual` 的 `got_award`；`IsReceiveAward(bitBlock, module, isReceive)`；`ReqFunctionManualAward` 前先判 `CheckTaskGroupFinish(task_list)`；`TASK_TYPE/TASK_PARAM/TASK_COUNT` 三元组交给 `TaskMgr.GetCurTaskProgress(type, param)`。
- `FunctionManualTaskNode.lua`：领取按钮仅在 `IsReceiveAward == false` 且 `CheckTaskGroupFinish(task_list)` 为真时可用。
- `FunctionManualTable.data.lua`（LuaJIT）由 `tools/extract-lua-table-rows.mjs` 抽取为 `personal-server/assets/tables/FunctionManualTable.rows.json.gz`：`Task` 28 行，字段 `tid, show_name, show_des, func_open, task_list, award, goup`。

## 实现

- `personal-server/config/item-task-tables.mjs`：校验 28 行、tid 唯一、`task_list` 三元组（type/param/count）与 `award` 奖励对。
- `personal-server/game/task-statistics.mjs`：`progress_type=2` 的统计进度（`TaskType.data` → `CountStatistics` 槽位、`stat_expand` → 统计 id 求和）。
- `personal-server/game/function-manual-service.mjs`：
  - 领取前置：行存在、未领取（`310`）、`task_list` 每项 `progress >= count`；不满足返回 `5` 并写出 `type`、`need`、`progress`。
  - 进度来源：`progress_type=2` → 模块 21 统计；`progress_fun=2` → 主线游标 `chapter*100+index`；`progress_fun=10` → 已通关章节数；其余（如 `180/182/185/...`）→ `5`。
  - 领取位 `function_manual_claims(role_id, manual_tid)` 与资源发放、PB 回包在同一 `store.transaction` 内提交；编码或 SQLite 失败整笔回滚。
  - 登录载荷 `pb_function_manual{ got_award }` 由领取位按 tid 置位生成，与回包读同一张表。
- `personal-server/game/gateway.mjs`：新增服务实例、登录槽位 `106`、`82301` 数字派发（ETF 解码后传入）。

## 验证

```powershell
cd personal-server
node --test test/function-manual-service.test.mjs test/item-task-gateway.test.mjs
```

- 配置：28 行、奖励对、`1201` 行存在、`5902` 行保留（证明未把不可达行删掉来“销项”）。
- 领取：统计 20 命中第 3 行（目标 1/10/20），发放 `201500+10000`、`31002+1`，回包 `got_award` 非空、`res_change` 真实增量；重复领取 `310`；重开 SQLite 后领取位仍生效。
- 拒绝：统计 5 时 `5`；`5902/2722` 行与 `1201/1202` 行在缺进度源的情况下 `5`；未知 tid、多 tid、空列表 `1`。
- 回滚：编码抛错时资源与领取位都未落库。
- 真实临时 TCP：`909103` 登录后模块 `106` 可解出 `pb_function_manual`，`82301` 成功、重复 `310`、不可达行 `5`。

## 推断与剩余证据

- `got_award` 的位序沿用本项目既有领取位约定（按行 `tid` 置位，见 ITEM-GROWTHROAD 的 `task_award`）。客户端 BitBlock 的具体下标未逐位反汇编。
- `progress_fun=2` 用游标 `chapter*100+index` 与 `task_list` 目标（如 `10203`）比较，属按编号规则的推断；`progress_fun=10` 用“整章全通”计数，与 ITEM-COMMONTASK 的既有实现一致。
- `task_list` 的第二位 `param` 原样保留在配置里，但当前只用于记录；统计源不按它细分。
- 28 行中可领取的行数取决于模块 21 是否已被既有玩法写入（统计源）以及主线进度；未写入时为 0 且不可领。
- `func_open`（1022/1099/1046 等）未参与服务端校验：功能是否开启属于客户端展示条件，且 `FunOpenTable` 未纳入本块资产。
