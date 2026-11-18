# G6 引导停留在 205020：下一步检查冒险笔记节点 955

日期：2026-11-18（Asia/Shanghai）

分支/worktree：`main` / `F:\projects\FateCovenantClone`

基线提交：`89b410a`

状态：隔离 APK 已复现；确认卡在 205020 之后，未验证 364070 通过，未改业务。

## 现象与触发

新手引导进入流程 `369` 的 `205020` 后，客户端日志记录“引导操作完成/引导成功完成”，但界面停在后续旁白，没有继续自动触发 `364070`；重新点击也没有新的服务端引导请求。

## 证据

- `analysis/experiments/launch-20261115/client-info-guide-click-20261117.txt`：`205020` 在 2026-11-17 23:06:07 完成，之后没有服务端引导写请求。
- 引导进程 `369` 的 key 列表为 `[205005, 205023, 364070]`；`205020` 不是持久化 key，因此完成它时没有 8000 请求是正常现象。
- `analysis/scratchpad/game-rules-20261114/MethodScript.data.lua.bin`：`MethodScript.ScriptEval(scriptId)` 按 `scriptId * 2` 索引。步骤 `364070` 的 `trigger_condition=688832064070`，乘二为 `1377664128140`，对应 proto 1083。
- `364070` 条件包含 `FunOpenMgr.IsOpen(1046)`、`GuideMgr.GuideNodeEnable(955)`、对应英雄数量条件和 `GuideMgr.GuideOverByTid(368)`。
- 运行库模块 3/16 状态：功能 `1046=true`；流程 `368` 最新 key `364069` 已结束；流程 `369` 最新 key `205023` 未结束。服务端条件 1、4 均满足。
- `analysis/tmp/adventure-note-20261118/AdventureNoteForm.lua.bin`：界面打开时执行
  `GuideMgr.RegisterGuideNode(GuideTable.TID_ADVENTURE_NOTE_RETURN, GetBackNode())`，即节点 `955` 由冒险笔记页面打开时注册，其 `GetBackNode()` 是页面返回按钮。它不同于旅途地图的 `MissionWorldForm`。

## 根因

本次登录的服务端投影满足已核对的功能位和前置流程；客户端已接受 `205020` 的高亮点击。下一步 `364070` 还检查本地节点 `955`，而实测点击旅途没有打开注册该节点的冒险笔记页面。节点不在模块 3/16 的持久化字段里，不能通过修改数据库 key 或伪造 8000 回包补齐。尚未确认本账号冒险笔记入口可达性和其余触发条件的实时值。

## 修复/处理

没有修改服务端、运行库或 APK。北京时间 2026-11-18 21:54:43，隔离客户端记录 `369/205020` 操作完成、成功完成；21:55:05 打开 `MissionWorldForm`，21:56:45 点击 `_ndBack` 回到大厅。没有 `AdventureNoteForm` 打开或 `364070` 触发、完成记录。复验日志见 `analysis/tmp/guide-followup-20261118/info-focus.local-only.txt`，界面见同目录 `travel/screen.png` 和 `after-return/screen.png`。

复盘：前次把旅途地图和冒险笔记当作同一页面，把回大厅后的看板娘字幕当成引导验收，未要求日志出现 `364070` 的触发和完成，因此错误标记为已通过。旧截图保留为界面证据，不再作为引导通过证据。

## 验证

| 级别 | 内容 | 结果 |
| --- | --- | --- |
| 静态证据 | 进程 key、MethodScript proto 1083、`AdventureNoteForm` 的 955 注册 | 通过 |
| 运行状态 | 功能 1046、流程 368/369 key 与 is_over 投影 | 通过 |
| 隔离 APK | 高亮大厅按钮 → `205020` 完成；旅途地图 → 返回未触发 `364070` | 已复现，未通过 |
| 组件、临时 TCP、部署 | 仅调查，未改服务端或 APK | 未执行 |

客户端截图：

- `analysis/experiments/launch-20261115/client-guide-adventure-note-20261118.png`
- `analysis/experiments/launch-20261115/client-guide-after-adventure-return3-20261118.png`
- `analysis/experiments/launch-20261115/client-guide-364070-next-20261118.png`

客户端日志：`analysis/experiments/launch-20261115/client-info-guide-adventure-return-20261118.txt`。

## 防复发

- 引导卡住时先同时核对服务端流程 key/is_over、MethodScript 条件和客户端 `GuideNodeEnable` 注册点。
- 非持久化 step（如 `205020`）完成时没有 8000 请求不代表服务端漏包。
- 不得为等待客户端本地节点的步骤强写数据库或伪造服务端返回；按真实界面路径验证。
- 验收先核对实际打开的是注册节点的表单，再核对目标 step 的触发、完成日志；对于持久化 key 另核对 8000 回执和重登后的进度。不能凭大厅字幕判定完成。
- 上述规则已加入 `BUG-MEMORY.md`。

## 未验证项与边界

- 本次闭环到 `205020` 已完成；`364070` 的实际触发、完成及重登保存均未验收。
