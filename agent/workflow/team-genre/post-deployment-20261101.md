# TeamGenre 类型 ID 修复部署验收

## 2026-11-01 部署结果

- 根因：`pb_team_genre.team_id` 被客户端当作 `TeamGenreType` 的主流派类型 TID 使用；首版误写 `5104..5901`，导致 `TeamGenreMgr.GetCycleTid` 报 `HeroTable.TeamGenreType(...) is nil`，领取位图无法解析。
- 修复：登录模块 10 槽位 8 和 `91402` 回包中的 `team_id` 改为主流派 TID `51..59`，`cycle_id` 仍为周期 TID；旧格式领取流水继续兼容读取，不重复发奖。
- 代码提交：`afeab25 fix: use team genre type ids in client state`，已推送到 `origin/main`。
- TeamGenre + TeamSuggest 定向测试：`11/11` 通过。

## 真实服务与客户端

- 服务 PID `22160`，启动时间 `2026-11-01T07:57:01.971Z`；`18880/18881/18882/18883/19090` 均由该进程绑定到 `127.0.0.1`，stderr 为 0 字节。
- 客户端在 `07:57:02.469Z` 自动重连，`07:57:02.494Z` 握手成功，`07:57:02.807Z` 完成 146 模块登录。
- 从实时 SQLite 解码的登录槽位为 `team_id=51..59`、对应 `cycle_id=5104,5204,...,5901`；不再出现阵容 ID `5104..5901` 填入 `team_id` 的错误形状。
- 已领取周期位图仍能从旧流水恢复：类型 `57` 的 `5701` 槽位为 `7000`，类型 `59` 的 `5901` 槽位为 `7800`。
- 重启后的客户端日志未再出现 `HeroTable.TeamGenreType(...) is nil`。

## 尚需 UI 复核

当前设备停留在主线地图，未自动点击用户界面。重新打开“热门阵容 → 圣堂控制流”后，已领取档位的红点应消失；截图应保存到 `analysis/experiments/private-server-20261025/p3/team-genre-award-20261101/`。
