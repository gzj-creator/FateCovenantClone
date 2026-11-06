# 模拟器连接本机个人服务器

2026-11-07 完成服务启动和模拟器连接验收。运行目标仅为 com.jzyx.ps，原版 com.jzyx.my 未操作。

## 当前结果

- 服务启动器使用 personal-server/runtime.local-only.data，五个端口 18880/18881/18882/18883/19090 均正常监听。
- 本次运行 PID 为 3512，仅作为当次状态；后续以 server.local-only.json 为准。
- 模拟器为 127.0.0.1:16448，隔离客户端 UID 为 10045，客户端 PID 为 3123。
- 已配置四项 ADB reverse：18880/18881/18882/19090。
- 已配置仅匹配目标地址 127.0.0.1 的 NAT 链：80→18880、10002→18881、3031→18881、3033→19090、9001→18882。
- 服务日志记录 game_connected、challenge_sent、handshake_accepted、login_sent；登录初始化发送 145 个模块，客户端随后进入游戏地图。
- 当前画面证据：analysis/experiments/private-server-20261025/p3/connect-verification-20261106/client-connected.png。

## 复现

~~~powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\run-server.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tools\local-server-device.ps1 -Action Status
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tools\local-server-device.ps1 -Action Launch
~~~

run-server.ps1 会启动或复用服务，并调用设备工具写入本机端口映射。设备工具把状态保存到 analysis/experiments/private-server-20261025/p3/network-state.local-only.json，不会提交运行状态。

## 边界

设备内核不支持 iptables owner 匹配，仓库清理后也没有保留旧的 UID BPF helper 生成器。当前工具因此使用只匹配设备回环地址 127.0.0.1 的 NAT 链，而不是旧版 UID 级出站隔离。外部地址不会被这组规则重定向，但该工具本身不封闭客户端的其他外网访问。

停止客户端和撤销映射：

~~~powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tools\local-server-device.ps1 -Action Stop
~~~

服务端仍需按 server.local-only.json 中的 PID 单独停止。本次没有停止服务或客户端，便于继续使用。

