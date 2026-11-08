# ROLE-STORY 实现记录

日期：2026-11-08。分支：`feat/block-j-role-support`。范围：J 块 #269。

## 状态

服务端完成，登录模块 88 已按客户端结构回填。未做 APK 验收。

## 客户端证据

- `StoryCmd.lua`：304/305 是无回包命令。
- 登录模块 88 是二元素结构 `[storyTid, binary(story_data)]`；304/305 的业务状态最终从 `story_data.finish_story_list` 投影。

## 实现

- 304 标记完成，305 只标记接触。305 不会把已完成的剧情降级。
- 登录时读取模块 88 的 slot 1，合并旧 `finish_story_list` 与 SQLite `role_stories`，保留其他 protobuf 字段后重新编码。
- 命令为 fire-and-forget；成功时不发送空 ETF/空 protobuf 帧。

## 验证

- 服务专项覆盖 slot 1、旧字段保留、304/305 状态合并和 SQLite 重开。
- 临时 loopback TCP 连续发送 304、305，再发送 53006；53006 的 seq 未被无回包命令污染。重新登录后模块 88 包含完成项而不包含仅接触项。

## 缺口

- 剧情解锁对任务、地图和其他模块的下游推送没有恢复。
- 未做 APK 实机验收。
