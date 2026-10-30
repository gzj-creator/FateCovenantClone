# 线性任务体力进度显示负数修复（2026-10-30）

## 症状

主界面“今日累计消耗体”入口打开任务页后，“累计消耗体力10点”显示
`(-40170/10)`。

## 根因

1. `task-service.mjs` 在领取主线线性任务 `10001` 时，把当前主线进度
   `mission_id=40210` 写成了 `pb_linear_task.snapshot_val`。
2. `MainLinearTaskMgr.CalcItemState`（Lua proto 8，约第 184 行）对
   `need_active` 任务执行：

   ```lua
   value = TaskMgr.GetCurTaskProgress(cfg.task_type, cfg.target_param, true)
   if cfg.need_active then
       local task = self.taskMap[cfg.type]
       if task then value = value - (task.snapshot_val or 0) end
   end
   ```

3. `TaskTable.LinearTask` 的 536 行全部是 `type=1`，共用一个
   `taskMap[1]`。任务 `10183`（`task_type=1002`、`need_active=true`、
   `target_count=10`）会读取体力统计 `10001290000` 的 `total=40`，再减去
   主线快照 `40210`：

   ```text
   40 - 40210 = -40170
   ```

证据：当前存档 `login_modules.module_id=90` 的 payload 解码为
`{task_list:[{type:1,receive_tid:10001,snapshot_val:40210}]}`；
`module_id=8` 的 `mission_id=40210`；`module_id=21` 中统计 id
`10001290000` 的 `total=40`；Lua 反汇编确认上述减法没有按任务 id 做限制。

## 修复

- 领取任务时不再把已领取任务的进度写入 `snapshot_val`，改为 `0`。任务的
  已领取状态仍由 `receive_tid` 保存，防重复领取逻辑不变。
- 数据库升级到 `user_version=5`，迁移
  `linear-task-snapshot-v5` 清理已有 module 90 中所有非零
  `snapshot_val`，使已发生问题的存档也能在服务重启/重新登录后恢复。
- `snapshot_val` 仍保留给未来实现“需要激活的进行中任务”；当前本地服务
  尚未实现任务激活命令，因此不保存历史进度伪基线。

## 验证

- worktree `npm test --prefix personal-server`：155/155 通过；合并到当前 main 后
  全套测试 163/163 通过。
- 新增回归测试：领取主线任务后体力任务不再继承主线快照；v5 迁移清理
  旧 module 90 快照。
- 对当前运行数据库副本执行新存储迁移后验证：module 90 为
  `{task_list:[{type:1,receive_tid:10001}]}`，体力统计 total=40，
  计算值 `40 - 0 = 40`，`user_version=5`。

## 部署与验收状态

- 2026-10-30 已合并到 `main`（提交 `bdc13a6`），并重启本地服务。
- 重启前使用 SQLite 序列化快照生成一致备份
  `analysis/experiments/private-server-20261025/p3/stamina-task-fix-20261030/game-before-v5.local-only.sqlite`，
  大小 286720 字节，SHA256
  `06e3f1ab520721caf3e033ab14a5857b2dea26de7c5ae44297f88948411d74e4`，备份与原库
  `integrity_check` 均为 `ok`。
- 新服务 PID `31784`，启动时间 `2026-10-30T00:33:51.352Z`；五个端口
  `18880/18881/18882/18883/19090` 均只监听 `127.0.0.1`。
- v5 迁移已执行：`user_version=5`，module 90 为
  `{task_list:[{type:1,receive_tid:10001}]}`，体力统计 total=40，计算值
  `40/10`，库完整性 `ok`，新服务 stderr 为空；隔离客户端已自动重连。
- 仍需用户打开任务页做视觉确认；此前不能标记为“显示已验收”。
- 任务激活/快照重建的完整服务器语义仍未实现；本次只消除已领取任务遗留
  快照造成的错误显示，不伪造激活进度。

## 点击领取“配置出错了”修复（9010）

负数显示恢复后，用户点击“今日累计消耗体”任务，客户端发送 9010
`req_finish_linear_task`，服务返回 `errCode=5`，日志为
`Linear task group is not configured`。

根因有两层：旧服务按 `LinearTask.task_type` 去 `CommonTaskGlobal` 中查找
module 90 分组，但客户端按 `LinearTask.type` 存取任务组；当前 536 条线性
任务均为 `type=1`，应使用 module 90 的 slot 0。任务进度也不能只处理主线
`1201`：`progress_type=2` 要先由 `TaskType.data` 找到
`CountStatisticsTable.CountStatistics` 分组，再从登录 module 21 对应槽位
汇总 `stat_expand` 指定 id 的 `total`。module 21 的 slot 0 是最大长度前缀，
角色统计行从 slot 1 起按非 custom、`type=0` 的行排序。

当前可点击的 `10002` 为 `task_type=8301`、`target_count=10`、奖励
`101800 x1000`；真实存档统计为 `40/10`。另一个常见体力任务 `10183`
（`task_type=1002`）当前约 `1/10`，服务应返回“任务未完成”，不能发奖。

验证结果：

- worktree 全量测试 `157/157` 通过。新增 `10002` 统计组领取、奖励、登录
  数据、SQLite 领取位、重开后防重，以及 `10183` 进度不足用例。
- 修复前运行库一致备份在
  `analysis/experiments/private-server-20261025/p3/stamina-task-fix-20261030/game-before-statistics-fix.local-only.sqlite`，
  `integrity_check=ok`、`user_version=5`，SHA256
  `485a1aca4a14939f54208170949f0e9a7259b5c8431d6f1a83757d5e5d970a48`。
- 在该备份副本上领取 `10002` 成功：资源 `101800` 由 5440 增至 6440，
  module 90 写入 `receive_tid=10002`，领取表新增 `claim_key=10002`；重开后
  再领返回 `310`，库完整性仍为 `ok`。证据见同目录
  `statistics-fix-acceptance.local-only.json` 与
  `accepted-statistics-fix.local-only.sqlite`。

真实客户端视觉验收仍待用户重新打开任务页并点击领取；在该证据出现前，
只记为组件测试和真实存档副本验收通过。

### 合并与部署（2026-10-30）

- worktree 修复提交为 `cb050d7`；限定五个文件合入 `main` 的提交为
  `5aa0a21`，未提交或覆盖 `main` 中其他现有改动。
- 合并后 `main` 全量测试 `165/165` 通过。
- 重启前一致备份为同目录
  `game-before-statistics-deploy.local-only.sqlite`，大小 286720 字节，
  SHA256
  `7dfd97812ac053d347ffcb15184fa4443594c188f4946f3ea8d2ae888b63e030`；
  备份 `integrity_check=ok`、`user_version=5`。
- 旧服务 PID `31784` 的命令行确认为 `personal-server/local-server.mjs` 后
  停止。新服务 PID `32160`，启动时间 `2026-10-30T04:48:54.323Z`；
  `18880/18881/18882/18883/19090` 均归新 PID 且只监听 `127.0.0.1`，stderr
  为 0 字节，运行库 `integrity_check=ok`。
- 新网关的 9010 拒绝日志会同时记录 `taskId`，后续若用户点击其它任务，可
  直接按日志中的任务 id 继续核对统计组。
- 客户端随后自动重连并实际点击：12:49:53 seq 27 提交 `10002`，12:49:55
  seq 28 提交 `10003`，两次均为 `linear_task_committed`，各发一份奖励；新
  服务日志没有 `linear_task_rejected`、`not configured` 或 9010 业务错误。
- 运行库现记录 `claim_key=10001/10002/10003`，module 90 为
  `{task_list:[{type:1,receive_tid:10003}]}`，`101800=6440`，
  `integrity_check=ok`。真实客户端点击链路已通过；截图式视觉确认尚未单独
  归档，因此不把该缺项写成已有截图证据。
