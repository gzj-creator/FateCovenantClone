# 个人服务器 APK 快照

2026-11-07 用户最终规则：**APK 只放在本目录，不进入 Git 历史，也不通过 Git LFS 提交**。每次修改前先保留上一版的独立备份并校验大小、SHA256，验收后再保存新版本。保留至少上一版，不覆盖唯一备份，不自动删除旧备份。只提交说明文档和代码；签名材料、密码和设备数据备份仍仅本地保存。

## 当前快照

| 项目 | 值 |
| --- | --- |
| 文件 | `com.jzyx.ps.v10-recharge-fix.apk` |
| 大小 | 4,185,758,937 字节 |
| SHA256 | `d7beb6464ed305336704c5e1150093e66eed8a66ff41fdee45b5256d1ad0ecae` |
| 包名 / 版本 | `com.jzyx.ps` / `1.55.090365`，versionCode `362155` |
| 签名 | v1/v2/v3、16 KB zipalign 验证通过 |
| 证书 SHA256 | `994c7d946fc38c8d7fff2cb77be9847a73eb248920d57185f355ce7059729fc7` |
| 来源 | `analysis/experiments/recharge-fix-20261107/signed-installed-base/com.jzyx.ps.signed.apk` |
| 内容 | 修复每日礼包及共享累充，保留设备已有冲榜配置修正 |
| 安装校验 | 已安装 base.apk 哈希与本快照相同，新 UID `10046` |
| 验收 | 已登录本地服大厅，看板娘正常；146 个恢复文件校验一致；本轮未执行消费充值 |

## 使用条件

- 只操作隔离包 `com.jzyx.ps`，设备 `127.0.0.1:16448`；原版 `com.jzyx.my` 不操作。
- 使用 `tools/local-server-device.ps1` 配置端口和启动；服务状态以 `personal-server/runtime.local-only.data/server.local-only.json` 为准。
- 看板娘仍依赖 `/data/user/0/com.jzyx.ps/shared_prefs/com.jzyx.ps.v2.playerprefs.xml` 中的 `SubDownloadFinish=1`，未烘焙进 APK。
- 数据恢复需按实际 UID 修复 owner、缓存 group、SELinux 标签，不要硬编码旧 UID。
- 原证书私钥缺失，本次完整备份后重装并恢复数据。新旧证书不同，不能直接相互 `install -r`。
- 新签名材料位于 `personal-server/secrets/apk-signing.local-only.data/`，后续更新需保留该目录，不提交私钥或密码。
- Git 不保存 APK，本目录需要随项目另外备份。
- APK 基于原客户端修改、包含原资源，仅供本地个人服务器联调，不作最终发行包。

## 本地回退

替换前从设备拉取的实际安装包保存在 `apk/com.jzyx.ps.v9-before-recharge-fix.apk`，SHA256 `70d0f7d6e01e95e62d4616cf51882c1373a299cffed7917e65b3722fa8667620`，大小 4,185,758,901 字节。它与旧 `com.jzyx.ps.v9-working.apk` 不同，额外包含冲榜配置修正。两者均不提交。备份来源为 `analysis/experiments/recharge-fix-20261107/device-backup.local-only.data/com.jzyx.ps.installed-before.local-only.apk`。

完整数据备份及逐文件恢复校验在上述来源目录，保留 `SubDownloadFinish=1`。回退前再次备份当前数据，避免覆盖之后的进度。

验证证据位于 `analysis/experiments/recharge-fix-20261107/`：构建记录 `apk-installed-base/recharge-fix-apk.json`、签名记录 `signed-installed-base/`、恢复记录 `device-backup.local-only.data/restore-verification.local-only.json`，大厅截图 `device-validation.local-only.data/login/screen.png`。组件修复和 2239 项服务测试见 [修复记录](../agent/workflow/fixes/daily-discount-acc-recharge-20261107.md)。
