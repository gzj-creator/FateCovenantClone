# ROLE-REDDOT 实现记录

日期：2026-11-08。分支：`feat/block-j-role-support`。范围：J 块 #270。

## 状态

服务端完成，客户端无回包契约与登录投影已确认。未做 APK 验收。

## 客户端证据

- `RedDotCmd.lua`：39001 由 `Seq:New():Cast` 发送，没有回调，服务端无需回包。
- 登录模块 4 对应 `all_saved_red`，客户端从 `saved_red_list` 恢复红点。

## 实现

- 39001 接收 protobuf `red_change_info`，按 `path_bin` 的 base64 形式落 SQLite。
- 删除列表兼容客户端原始二进制路径和已编码 base64 文本。
- 登录模块 4 从 `role_red_dots` 重建；命令成功时 `data: null`，网关不发送空响应。

## 验证

- 服务专项覆盖新增、更新、删除、原始/文本路径与 SQLite 重开。
- 临时 loopback TCP 发送 39001 后立即发送 53006；53006 的 seq 连续，证明没有插入空帧；重开 SQLite 再登录后模块 4 恢复完整路径、状态、计数和 extra。

## 缺口

- 未逐个验证客户端所有红点路径的显示效果。
- 未做 APK 实机验收。
