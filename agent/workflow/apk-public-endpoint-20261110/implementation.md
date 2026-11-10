# 公网地址 APK

## 结果

- 基线：`apk/com.jzyx.ps.v10-recharge-fix.apk`，4,185,758,937 字节，SHA256 `d7beb6464ed305336704c5e1150093e66eed8a66ff41fdee45b5256d1ad0ecae`。
- 修改前备份：`apk/com.jzyx.ps.v10-before-public-endpoint-20261110.apk`，大小与 SHA256 已核对一致。
- 输出：`apk/release/com.jzyx.ps.v11-public-140.143.142.251.apk`，4,185,759,009 字节，SHA256 `3caa14ca150f8259f5e83d263e6a0a43f9b94df7eb9e3d3f58e0fdc494970d95`。
- APK 不进入 Git；`apk/release/.gitignore` 排除 APK 与 idsig。

## 修改

- `assets/game_config.json`：`Host`、`UpdateAddr`、`AppDownloadAddr` 中的 `127.0.0.1` 改为 `140.143.142.251`。
- `assets/quicksdk.xml`：6 个 SDK 服务地址中的 `127.0.0.1` 改为 `140.143.142.251`。
- 端口保持 `18880`、`18881`、`18882`、`19090`。
- 删除旧签名后，以现有测试证书重新执行 16 KB zipalign 和 v1/v2/v3 签名。

## 验收边界

按用户要求直接出包，未运行设备登录、联网或配置逐成员复核。
