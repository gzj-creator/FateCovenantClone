# 公网部署与命运一服

## 配置

- APK 服务地址：`140.143.142.251`。
- Web/SDK、区服列表、更新和游戏网关端口分别为 `18880`、`18881`、`18882`、`19090`。
- 新增可读 JSON 配置 `personal-server/config/public-server.json`，公网四项服务监听 `0.0.0.0`，Web 管理端继续只监听 `127.0.0.1`。
- `servers` 为数组；当前第一项 ID `1`，名称“命运一服”，广播游戏地址 `140.143.142.251:19090`。区服接口支持返回列表并按 ID 选择登录服。
- 启动命令：`npm run start:public --prefix .\personal-server`。

## 验证

定向测试：`node --test --test-concurrency=1 test/server-list.test.mjs test/sdk-service.test.mjs test/startup-service.test.mjs test/self-contained-deployment.test.mjs`。

结果：`37` 项，pass `37`，fail `0`。隔离部署测试实际启动完整服务，并反向解码区服响应，核对 ID、名称和广播地址；另覆盖多区服列表和按 ID 选择登录服。

## 上线边界

2026-11-10 从本机探测 `140.143.142.251` 的 `18880/18881/18882/19090/18883` 均未开放。需要把本提交部署到服务器、启动公网配置，并在云安全组和本机防火墙放行前四个 TCP 端口。管理端口 `18883` 不应向公网放行。尚未用公网 APK 完成登录验收。
