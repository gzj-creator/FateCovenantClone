# S1 SDK IP 地址探测返回 404 导致“配置出错”

日期：2026-11-18（Asia/Shanghai）

分支/worktree：`main` / `F:\projects\FateCovenantClone`

基线提交：`89b410a`

状态：已修复并完成组件/全量测试；部署结果见文末更新

## 现象与触发

客户端启动并完成 SDK 登录后请求
`GET /ad/api/ip_address//`。旧 SDK 服务没有该路由，返回 HTTP 404；客户端随后弹出“配置出错”。

客户端日志 `analysis/experiments/launch-20261115/client-info-guide-click-20261117.txt` 记录：

```text
2026-11-18 00:13:50.176 action: [警告]
HttpGetString err url=http://156.224.19.202/ad/api/ip_address//,
err=HTTP/1.1 404 Not Found
```

## 证据

- 客户端日志：`analysis/experiments/launch-20261115/client-info-guide-click-20261117.txt`
- 服务事件：`analysis/experiments/launch-20261115/server-data-fixed/events.jsonl`
- 2026-11-17T14:00:04.544Z 和 `.570Z` 连续记录两次 GET 的 `unimplemented_route`，路径 SHA256 为 `8a5edab282632443219e051e4ade2d1d5bbc671c781051bf1437897cbdfea0f1`。
- 客户端实际 URL 含末尾双斜杠，不能只按 `/ad/api/ip_address` 匹配。

## 根因

`personal-server/sdk-service.mjs` 的路由表只包含登录、Token 验证、Banner 和区服读取等路径。
`/ad/api/ip_address//` 落入 `unknown`，先记录 `unimplemented_route`，再返回 404。该接口是客户端正常启动链路的一部分，并非可忽略的可选请求。

## 修复

- 为精确路径 `/ad/api/ip_address//` 增加 `ipAddress` 路由。
- 仅允许 HTTP GET，返回 HTTP 200 和 `{"ip":"127.0.0.1"}`。
- 返回值来自本服实际监听地址，没有读取客户端请求参数，也没有放宽其他未知路由。

## 验证

| 级别 | 内容 | 结果 |
| --- | --- | --- |
| 组件测试 | `sdk-service.test.mjs`，包括真实 URL、GET 方法、200 响应体以及不得记录 `unimplemented_route` | 26/26 通过 |
| 全量测试 | `npm test --prefix personal-server` | 532 pass / 0 fail / 2 skipped |
| 部署 | `main@4e6f8ad` 下新 PID `8752` 直接 GET 该 URL | HTTP 200、响应 `{"ip":"127.0.0.1"}`，本轮日志 `unimplemented_route=0` |
| APK 真机 | 重登后检查该 URL 不再 404、启动不再弹“配置出错” | 隔离客户端已启动到 QuickSDK 账号登录页；用户重登验收待完成 |

## 防复发

- 固定回归测试必须保留末尾双斜杠，并同时断言 HTTP 200、响应体和没有 `unimplemented_route` 事件。
- SDK 启动链新增请求时，以客户端实际 URL 和方法为准；不能因为接口是基础设施接口就当作可选 404。
- 本规则已加入 `BUG-MEMORY.md` 的客户端状态镜像与辅助接口清单。

## 未验证项与边界

- `/ad/api/ip_address//` 当前返回本机回环地址；未来若公开部署，应明确该接口应返回公网出口地址还是客户端可见服务地址，并以真实客户端用途核对。
- 本次没有修改 APK；客户端侧只做重登和真实界面验收。
