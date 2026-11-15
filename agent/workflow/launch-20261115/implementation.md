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

