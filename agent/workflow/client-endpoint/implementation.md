# 客户端改址实操

2026-10-25 21:31更新：目前已安装独立v7，非下文v2。进一步修改quicksdk.xml的product_code/product_key、callbackUrl/dataPut/trueNameCheck/quicksdk_server_ip_config和quick_server_config列表为本机；product_key严格8字节fclocal1，is_auto_login保留字符串1。common登录DEX补丁仅FC_LOCAL_COMMON_LOGIN=1时启用，v7未启用，沿用手机号UI。v7已通过本机SDK、区服、网关进入大厅，本次未重建/重装。源APK及com.jzyx.my保留；v7路径p3/isolated-local-v7/com.jzyx.ps.signed.apk，签名/对齐身份在同目录signed-artifact.json。

日期：2026-10-25。仅本机兼容实验，保留原 APK 和 `com.jzyx.my` 安装。

最新验收：v2 已旁路安装，UID10042。APK 日志明确采用本机 Host、区服端口和更新 URL；本机实际收到更新请求；提供真实版本格式后进入 SDK 登录页。SDK 账号登录、区服响应和网关仍未验收。

## 改动入口

`assets/game_config.json` 以 JSON 解析后保留原字段，增加：

```json
{
  "Host": "127.0.0.1",
  "ListPorts": "18881",
  "UpdateAddr": "http://127.0.0.1:18882/update/res",
  "AppDownloadAddr": "http://127.0.0.1:18882/update/app"
}
```

正常 Formal 启动读取此配置；仅修改 `ServerAddressInternal.asset` 的本地条目无效。已有 `META-INF/acmeis_...` 名称标记会覆盖 JSON，需要检查并同步处理。本次源包无此标记。

并行安装需要精确修改二进制 Manifest：包名 `com.jzyx.ps`、七个 provider authorities、两个 wxapi aliases；保留 Java 类名。还必须同步 `resources.arsc` 的资源包名，再去除原签名成员并重新签名。不得对整个 APK 任意替换字符串。

首版仅修改 Manifest 与配置，可以安装，但在隐私确认后崩溃：`UnityPlayer -> com.unity3d.player.J -> Resources$NotFoundException: String resource ID #0x0`。v2 按资源表 chunk 解析 `RES_TABLE_PACKAGE_TYPE=0x0200`，将唯一包名字段从 `com.jzyx.my` 改为 `com.jzyx.ps`，保留 package ID127、资源 ID、表大小与其余字节。aapt2、全成员 hash 校验和 APK 重启验证后，Unity 正常启动。此项是实操发现的必要修复。

## 已执行命令

在项目根目录使用 PowerShell：

```powershell
# unsigned 包已生成，不重复运行覆盖。
powershell -NoProfile -ExecutionPolicy Bypass -File tools/build-isolated-apk.ps1 -Build
# 本轮实际运行，完成对齐、独立证书签名、签名/对齐/包名验证。
powershell -NoProfile -ExecutionPolicy Bypass -File tools/sign-isolated-apk.ps1
```

签名脚本使用 build-tools 36.0.0、JDK 21、`zipalign -P 16 4`、独立 RSA3072 测试证书及 apksigner v1/v2/v3。密码随机生成，仅保存在 `.local-only.*` 文件并通过进程环境传入；不得提交密码或密钥。脚本拒绝覆盖已有输出。

v2 构建器逐成员复核 11903 个保留成员的内容 hash 和压缩方法，只修改 Manifest、game_config、resources.arsc 三个成员，删除三个原签名成员。

成功运行产物：`analysis/experiments/private-server-20261025/p2/isolated-v2/com.jzyx.ps.signed.apk`，4,116,360,373 字节，SHA256 `85c2a01c5383d9e0346a7de53f921d8a617e366ffe39294209579306aa2b66c1`。p1 中的首版保留作为失败运行证据，不再安装它。

v2 本轮实际运行的重建、签名和更新安装命令：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/build-isolated-apk.ps1 -Build -OutputApk analysis/experiments/private-server-20261025/p2/isolated-v2/com.jzyx.ps.unsigned.apk
powershell -NoProfile -ExecutionPolicy Bypass -File tools/sign-isolated-apk.ps1 -UnsignedApk analysis/experiments/private-server-20261025/p2/isolated-v2/com.jzyx.ps.unsigned.apk -OutputDirectory analysis/experiments/private-server-20261025/p2/isolated-v2 -SigningDirectory analysis/experiments/private-server-20261025/p1/isolated
& 'C:/Users/gzj/AppData/Local/Android/Sdk/platform-tools/adb.exe' -s 127.0.0.1:16448 install -r --no-streaming analysis/experiments/private-server-20261025/p2/isolated-v2/com.jzyx.ps.signed.apk
```

`-SigningDirectory` 必须复用首次测试证书，才能在保留隔离包数据的情况下更新。现有输出已存在，脚本拒绝覆盖，复现时使用新的输出目录。

## 证据与验收

- 地址读取与优先级：`analysis/reports/private-client-16448/endpoint-selection-direct-dependencies.md`。
- 原包、v2 改动明细及逐成员校验：`analysis/experiments/private-server-20261025/p2/isolated-v2/patch-manifest.json`。
- 本轮签名与对齐：同目录 `signed-artifact.json`、`signature-verification.txt`、`signed-badging.txt`。
- unsigned 包已构建，签名包通过 apksigner verify、zipalign check 和 aapt2 包名验证。
- APK 改址采用已验收：`p2/local-version-response.local-only.log` 中 `specified change actualAddress` 明确为127.0.0.1和18881；`p2/http-observer.txt` 中18882收到版本请求。日志可能含设备标识，仅保存在 gitignore 的本地文件。
- UI：`p2/v2-loaded.png` 是缺少版本服务时的网络错误；`p2/local-version-response.png` 是本机版本响应被接受后的 SDK 登录页。均不是大厅。

## 接续与恢复

首次旁路安装已成功，随后已用上述 v2 命令更新同一隔离包；原应用未替换：

```powershell
& 'C:/Users/gzj/AppData/Local/Android/Sdk/platform-tools/adb.exe' -s 127.0.0.1:16448 install --no-streaming 'analysis/experiments/private-server-20261025/p1/isolated/com.jzyx.ps.signed.apk'
```

安装后先停止隔离包，查询实际 UID，为该 UID 重建 IPv4/IPv6 本机网络保护并验证，之后才能启动游戏。`adb reverse` 只转发本地端口，SDK 硬编码地址另由 UID 限定 NAT 处理；只改游戏配置不能覆盖全部 SDK 地址。

重签影响 SDK 的签名相关 appInfo 解密，必须单独验证外部配置回退与登录响应。使用隔离包独立数据，不迁移或覆盖原角色。

停止实验时先停止隔离包，再清理本次 reverse、规则与 BPF pin，恢复模拟器原 root 设置；保留原 APK、数据备份和测试签名身份。
