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
