# 启动版本检查实操

日期：2026-10-25。此节点已通过 APK 验证，只证明启动版本检查通过。

## 契约与本地数据

改址后的 APK 实际请求 `GET /update/res/version_adr.txt`。`UniCore.VersionConfig.Parse` 使用 JSON，必需字符串 `version` 和 `reqAppVer`，资源版本取 `System.Version.Revision`。其他已检查字段缺失时走解析器的默认分支。

包内 `assets/update.txt` 首行是 `flag|{version,364110}`；应用版本为 `1.55.090365`。本机服务据此返回：

```json
{"version":"1.55.090365.364110","reqAppVer":"1.55.090365"}
```

这是与本地完整资源相匹配的自有配置，不是原服务端响应。客户端仍执行资源检查；若检测到缺失/损坏会进入下载分支，不能以此文件替代资源清单或任意返回成功。

## 已执行

```powershell
$env:LOCAL_APP_VERSION='1.55.090365'
$env:LOCAL_ASSET_VERSION='364110'
node personal-server/startup-service.mjs --listen
```

仅监听127.0.0.1:18882，并经16448专属 reverse 转发。未知路由明确501。服务已停止，reverse已清理。

## 验证与证据

- 静态复现：`analysis/tools/inspect-local-updater.ps1`；证据 `analysis/experiments/private-server-20261025/p2/updater-evidence.json`。
- 服务：`personal-server/startup-service.mjs`；两个 HTTP 测试覆盖格式、未知请求和日志脱敏。
- APK 实测：`p2/startup-service.txt` 于08:40:32.357Z记录版本响应200；随后 `p2/local-version-response.png` 显示SDK手机号登录页。
- SDK初始化成功事件亦已出现，但尚无本机账号登录、区服或网关验收。
- 先前367B unknown POST已通过路径SHA256与DEX字面量对应为 `/sdk/tracker/log`，属于埋点，不能再作为登录或区服证据。
