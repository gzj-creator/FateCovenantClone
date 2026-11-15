# 2026-11-15 新账号上线与第三章复用修复

## 现象与根因

用户新建账号登录后直接进入第三章。服务日志显示登录落到 `roleId=100001`，该角色为 9 级、已有 Guide process 112 和 6 个英雄，是本地启动时保留的旧游戏结构模板。

根因在 QuickSDK 身份解析：本地模式的 `createQuickSdkIdentityResolver` 沿用了公网空服默认值 `bindFirstIdentityToPrimary=true`。首个 QuickSDK 身份因此绑定到预置主账号 `local-1`，再解析到模板角色 `100001`。客户端的“新账号”只更换了认证身份，服务端仍返回模板存档。

## 修复

- `personal-server/local-server.mjs` 在本地模式显式设置 `bindFirstIdentityToPrimary=false`，新 QuickSDK 身份使用 `local-quick-<uid-sha256>`，由账号库分配独立角色。
- 公有空服模式仍设置 `bindFirstIdentityToPrimary=true`，保留首个真实身份占用空服主占位角色的原有发布行为。
- `personal-server/test/quick-sdk-accounts.test.mjs` 新增本地模式身份隔离测试，断言首个 QuickSDK 身份不等于 `local-1`，且映射文件不写 `primaryUidHash`。
- `personal-server/test/self-contained-deployment.test.mjs` 的自检复制跳过 `*.local-only.*`，与真实发布脚本排除运行态私有文件的边界一致。
- `tools/local-server-device.ps1` 让 NAT 恢复可重复执行，并忽略 ADB 无输出时产生的空 reverse 行。

## 验证

- `npm test --prefix personal-server`：tests 484，pass 482，fail 0，skipped 2，duration 99.6 秒。
- 快速套件覆盖新号空 Guide、首角在 `10202` 后发放、第二角在 `20201` 前不发、Michelle/2-1 原始固定敌阵、合法败北、SQLite 重开，以及 25 条 R1 未闭合命令在状态变更前返回 `GameError(5)`。
- 两个 skipped 用例只因未提供 `FC_RECHARGE_CLIENT_BUNDLE` 的 v9 已验收 Lua 包，不计为通过或失败。

## 当前运行实例

- 修复后 PID：`39736`。
- 数据目录：`analysis/experiments/launch-20261115/server-data-fixed`。
- 开服时间：`2026-11-15T05:00:00+08:00`，Unix `1794690000`。
- 活动日历：`schedule` / `absolute`，当前钓鱼活动 `1074011`。
- 端口：SDK `18880`、列表 `18881`、启动 `18882`、游戏 `19090`、管理 `18883`，监听地址均为 `127.0.0.1`。
- 干净库仍有模板角色 `100001`，但 `accounts` 为空、没有 QuickSDK 身份映射；新认证身份不再复用模板角色。
- 设备串口：`127.0.0.1:16448`；reverse 保持 `18880/18881/18882/19090`。

## 模拟器账号缓存处理

只清理并备份了客户端账号状态文件 `JZAccountStorage.xml`、`JZUserId.xml`、`JZUserToken.xml`，设备备份目录为 `/data/local/tmp/fc-account-cache-20261115`。未删除 `com.jzyx.ps.v2.playerprefs.xml`，其中 `SubDownloadFinish=1` 保留。客户端已重新启动到协议、登录入口。

本轮早些时候曾误执行一次 `pm clear com.jzyx.ps`。APK 未卸载，客户端重启后重新生成了 `il2cpp`、`ResCompleteTemp` 等启动文件；当前客户端日志未出现 `MissAsset`、资源加载超时或 `AddRemoteLoad` 错误。外部 `Updates` 目录不在旧备份中，当前依赖 APK 内资源与 `SubDownloadFinish=1` 路径；实机新账号登录和首章仍需作为最终验收。

## 验收边界

本记录可以证明新账号复用模板档的根因已修复，服务端快速套件通过，修复版服务已启动；真实 APK 新账号登录后的角色 ID、等级、英雄、mission 光标及首章界面仍需用户创建账号后核对。未取证的后玩法命令继续明确拒绝，不能据此宣称全部玩法 1:1 完成。

## 2026-11-15 新手女仆奖励与三人编队修复

用户新建角色 `roleId=100002` 完成新手奖励和布阵后发现，服务端已有女仆 `1020601`，`lineups` 与 `play_lineups` 也已是三人，但当前客户端队伍仍找不到女仆。服务端 `8001` 女仆领奖和 `209` 三人编队均成功提交，故不是资源表、发奖事务或编队写入失败。

客户端 `Info_latest.txt` 在 `20:42:52` 报 `HeroRes.lua.txt:62: bad argument #1 to 'ipairs' (table expected, got nil)`，随后 `209` 回包处理持续报 `hero nil` 和 `table index is nil`。`HeroRes.lua.bin` 的 `ResChange` 会把 `change.extra` 解码成 ETF 二进列表，再逐个按 `hero` protobuf 解码并调用 `HeroMgr.AddHeroes`。旧服务端女仆奖励只返回数量 `tid/new_num/diff_num`，因此奖励已落库但打开中的客户端英雄表没有即时加入女仆。

修复分为两项：

- `personal-server/game/resources.mjs` 在首次发放新英雄时返回该英雄的完整 protobuf ETF 列表作为 `change.extra`；重复英雄仍只增加数量，不伪造第二个英雄对象。
- `personal-server/storage/game-store.mjs` 在事务保存和登录物化时统一从权威 `lineups/play_lineups` 重算登录模块 9，保留未知字段并同步其中旧的编队副本。这样英雄、预编队和真实登录快照会同时更新。
- 回归测试解码女仆奖励的 `change.extra`，并覆盖女仆领奖、`209` 三人编队、原始模块 9、SQLite 重开；租借英雄星级/品质测试也改为明确核对 SQLite 中模块 9 的编队副本。

验证结果：

- `node --test test/guide-original-rules.test.mjs`：14/14 通过。
- `node --test test/leaser-starup-service.test.mjs`：11/11 通过。
- 女仆/编队/账号隔离/招募相关测试：51/51 通过。
- `npm test`：485 项，483 pass、0 fail、2 skipped；两个 skip 仍仅因未提供 v9 已验收 Lua 包 `FC_RECHARGE_CLIENT_BUNDLE`。

上线前使用 SQLite `VACUUM INTO` 生成一致备份：

- 备份：`analysis/experiments/launch-20261115/backups/pre-guide-hero-20261115T131500Z/game.local-only.sqlite`。
- 大小 `1,658,880` 字节，SHA256 `d8b9462f99cdb599719a9f426370cecf8c98144c83e1d5734062688c8bd47b9d`。
- `PRAGMA integrity_check=ok`；备份内有 2 个角色、1 个账号。

新服务 PID `32464`，继续使用 `analysis/experiments/launch-20261115/server-data-fixed` 和原开服时间 `2026-11-15T05:00:00+08:00`。SDK `18880`、列表 `18881`、启动 `18882`、游戏 `19090`、管理 `18883` 均由新 PID 仅监听 `127.0.0.1`；管理页返回 HTTP 200。服务日志为 `server-guide-hero-fix-20261115T131700Z.out.log`，stderr 为空。

客户端只执行 `am force-stop com.jzyx.ps` 后重开，未执行 `pm clear`，PlayerPrefs、账号缓存和本地存档均保留；重开后 `com.jzyx.ps` PID 为 `7933`，当前停在 QuickSDK 账号选择页。服务端和字节码回归已闭合本次两个缺失点，最终队伍是否出现女仆仍需用户在模拟器创建新账号完成视觉验收。

重开后用户继续使用 `roleId=100002` 实测，`8001` award 2 于 `seq=49` 提交，随后 `209` 于 `seq=52` 提交。服务端模块 10 当前英雄为 `2010101/2010201/1020601/2020601`，模块 9 当前主阵为 `1020601/2010201/2010101/2020601`，女仆已同时出现在英雄表和登录编队快照。新客户端日志 `Info_after_guide_hero_fix_runtime.txt` 中 `HeroRes.lua.txt:62`、`hero nil`、`table index is nil` 均为 0 次；这些旧错误没有在新回包路径复现。战斗界面中的最终视觉显示仍由用户当前模拟器操作确认。

