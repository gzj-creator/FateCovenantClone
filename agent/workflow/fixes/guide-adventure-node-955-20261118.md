# G6 引导停留在 205020：客户端等待旅途节点 955

日期：2026-11-18（Asia/Shanghai）

分支/worktree：`main` / `F:\projects\FateCovenantClone`

基线提交：`89b410a`

状态：已定位并完成客户端真实路径验证；服务端无需代码修改

## 现象与触发

新手引导进入流程 `369` 的 `205020` 后，客户端日志记录“引导操作完成/引导成功完成”，但界面停在后续旁白，没有继续自动触发 `364070`；重新点击也没有新的服务端引导请求。

## 证据

- `analysis/experiments/launch-20261115/client-info-guide-click-20261117.txt`：`205020` 在 2026-11-17 23:06:07 完成，之后没有服务端引导写请求。
- 引导进程 `369` 的 key 列表为 `[205005, 205023, 364070]`；`205020` 不是持久化 key，因此完成它时没有 8000 请求是正常现象。
- `analysis/scratchpad/game-rules-20261114/MethodScript.data.lua.bin`：`MethodScript.ScriptEval(scriptId)` 按 `scriptId * 2` 索引。`364070 * 2 = 1377664128140` 对应 proto 1083。
- `364070` 条件包含 `FunOpenMgr.IsOpen(1046)`、`GuideMgr.GuideNodeEnable(955)`、对应英雄数量条件和 `GuideMgr.GuideOverByTid(368)`。
- 运行库模块 3/16 状态：功能 `1046=true`；流程 `368` 最新 key `364069` 已结束；流程 `369` 最新 key `205023` 未结束。服务端条件 1、4 均满足。
- `analysis/tmp/adventure-note-20261118/AdventureNoteForm.lua.bin`：界面打开时执行
  `GuideMgr.RegisterGuideNode(Guide.TID_ADVENTURE_NOTE_RETURN, GetBackNode())`，即节点 `955` 由“旅途/冒险笔记”打开并在返回时注册。

## 根因

服务端引导投影没有丢数据。`364070` 还要等待客户端本地节点 `955`；该节点不在模块 3/16 的持久化字段里，不能通过修改数据库 key 或伪造 8000 回包补齐。

## 修复/处理

没有修改服务端业务。按客户端真实流程验证：

1. 从大厅点击右下角“旅途”；
2. 打开 `MissionWorldForm(Clone)` / `AdventureNoteForm`，注册节点 `955`；
3. 点击页面左上返回按钮 `_ndBack=true`；
4. 返回大厅后，客户端立即播放 `364070` 后续对白，先显示“锵锵！橘猫胖胖，橘屋棒棒！”，随后进入“光之心和圣器连在一起的……”对白。

## 验证

| 级别 | 内容 | 结果 |
| --- | --- | --- |
| 静态证据 | 进程 key、MethodScript proto 1083、`AdventureNoteForm` 的 955 注册 | 通过 |
| 运行状态 | 功能 1046、流程 368/369 key 与 is_over 投影 | 通过 |
| APK 真机 | 大厅“旅途” → 冒险地图 → 返回 → `364070` 后续对白 | 通过 |
| 服务端部署 | 该流程不依赖本次代码改动 | 无需部署 |

客户端截图：

- `analysis/experiments/launch-20261115/client-guide-adventure-note-20261118.png`
- `analysis/experiments/launch-20261115/client-guide-after-adventure-return3-20261118.png`
- `analysis/experiments/launch-20261115/client-guide-364070-next-20261118.png`

客户端日志：`analysis/experiments/launch-20261115/client-info-guide-adventure-return-20261118.txt`。

## 防复发

- 引导卡住时先同时核对服务端流程 key/is_over、MethodScript 条件和客户端 `GuideNodeEnable` 注册点。
- 非持久化 step（如 `205020`）完成时没有 8000 请求不代表服务端漏包。
- 不得为等待客户端本地节点的步骤强写数据库或伪造服务端返回；按真实界面路径验证。
- 上述规则已加入 `BUG-MEMORY.md`。

## 未验证项与边界

- 后续引导仍会依次要求其他客户端界面和操作；本次只闭环到 `364070` 已触发并开始播放后续对白。
