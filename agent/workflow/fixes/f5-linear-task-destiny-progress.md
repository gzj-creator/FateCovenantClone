# F5 线性任务：星火当前阶段进度（2026-10-31）

## 结论

线性任务 `task_type=5901` 的进度函数是 `progress_type=1, progress_fun=155`，对应
`DestinyMgr.RealStage`。该函数直接返回登录模块 107 中保存的原始 `cur_stage`，不是界面
显示层另行归一化的 `curStage`，也不是已点亮的节点数。服务端已为这组线性任务补上只读进度
计算；未部署到实时服务，也未做真实 APK 验收。

## 影响范围

修复前，六个已完成对应星火阶段的线性任务在 9010 `req_finish_linear_task` 中都会落到
`Linear task progress is not implemented`，返回业务码 5，不发奖。任务表中共有 536 条
线性任务，`TaskType` 里 `progress_type=1 && progress_fun=155` 只有 `5901` 一行；
`SprintRankTask` 没有引用它。

| 任务 | 需要阶段 | 奖励 |
|---|---:|---|
| 10004 | 2 | 201500 × 2000 |
| 10020 | 3 | 2002 × 2 |
| 10030 | 4 | 101500 × 20 |
| 10041 | 5 | 201500 × 1000 |
| 10055 | 6 | 101500 × 20 |
| 10069 | 7 | 157002 × 100 |

## 客户端证据

1. `TaskTable.data.lua.json` 的 `TaskType[5901]`：

   ```json
   {
     "tid": 5901,
     "progress_type": 1,
     "progress_fun": 155,
     "progress_param": 0,
     "data": 0,
     "stat_expand": [],
     "reverse": false,
     "target_txt_func": { "reference": "DestinyMgr.GetDestinyName" }
   }
   ```

2. `MethodTable.data.lua.json` 的 `DynamicArgs[155]`：

   ```json
   {
     "tid": 155,
     "lua_interface": { "reference": "DestinyMgr.RealStage" },
     "change_event": [{ "reference": "DestinyMgr.UP_STAGE" }]
   }
   ```

3. `DestinyMgr.meta.json`：根原型 24 在约第 90 行注册 `RealStage` 到原型 4；原型 4 在
   第 91 行读取 `data.realStage` 后直接返回；`Init`（原型 23）在第 361 行执行
   `data.realStage = incoming.cur_stage`。因此任务进度使用原始 `cur_stage`，不能做减一或
   按节点计数。

4. 登录模块 107 的 `pb_destiny_data` 字段为 `cur_stage=int32(1)`、
   `slot_state=bytes(2)`。`destiny-service.mjs` 在登录时把旧模块 100 迁移到 107；迁移后
   100 只保留为审计副本。任务进度必须读 107，不能回退到可能过期的 100。

证据文件及 SHA256：

| 文件 | SHA256 |
|---|---|
| `analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_project.bundle/bytecode/TaskTable.data.lua.json` | `5C40F07FA48364BBEDD74A7F4C2795FC8143228B184A67464039C66E2EB52C1F` |
| `analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_general.bundle/bytecode/MethodTable.data.lua.json` | `B0F99AB2247F95A53E017A9401BE70976C91B1AE79CDBE44A3EFA36F1E5CD1E5` |
| `analysis/tmp/endgame-fixes/DestinyMgr.meta.json` | `2C293AA8A39E21CF00FCC45564A38EEB7A9640CA88A887A67339F8C8CFB2C727` |

## 实现

`personal-server/game/task-service.mjs` 新增 `DESTINY_MODULE=107` 和
`DESTINY_REAL_STAGE_PROGRESS=155`，只在 `progress_type=1` 且 `progress_fun=155` 时读取
`pb_destiny_data.cur_stage`。空模块、无法读取的模块包装、损坏 protobuf 或小于 1 的阶段
统一返回 `GameError(5, ...)`；其他 `progress_fun` 仍明确返回未实现。现有 9010 事务负责
奖励、`reward_claims`、模块 90 和响应编码的原子提交，本次没有改其边界。

## 验证

- `node --test test/task-service.test.mjs`：18/18 通过。新增覆盖六个任务的阶段不足与刚好
  达标、配置奖励、模块 90 领取位、重复领取、重开 SQLite、107 优先于旧 100、缺失/空/
  损坏/非法阶段、未知函数拒绝，以及编码失败和 SQLite 触发器失败时的事务回滚。
- `npm test`：307/307 通过。
- `gameplay-gateway.test.mjs` 新增临时 TCP 用例：真实握手和登录后发送 9010
  `[10004]`，在阶段 2 返回 `201500 × 2000`，随后重启数据库实例并从登录 ETF 读取模块 90
  的 `receive_tid=10004` 和模块 107 的 `cur_stage=2`。

## 边界

- 本修复只在隔离 worktree，基线 `6eaf2b7`，分支
  `fix/linear-task-destiny-progress-20261031`。未合并、未部署、未重启实时服务。
- 未修改正式 SQLite，未操作 APK、ADB 或模拟器。
- 组件测试、临时 TCP 和临时 SQLite 通过不等于真实 APK 视觉验收；六个任务的客户端点击、
  奖励提示和模块 90 刷新仍需部署后由用户验证。
