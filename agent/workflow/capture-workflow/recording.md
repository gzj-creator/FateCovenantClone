# 用户操作与协议采集

续接状态：新一轮`analysis/captures/protocol-2026-10-25-r2a/`正在采集，root=true且su已验证。正确账号已进大厅并静置20秒，新握手/登录已通过，详见[第二轮](second-recording.md)。多轮合并和编号隔离已完成，见[多轮管理](multiple-recordings.md)。Checkpoint/Mark/Stop必须显式指定r2a目录，旧默认目录已停止；下文收尾仅指第一轮。

招募检查点已完成一次操作关联，见[招募证据](recruitment.md)。无需全点招募项；当前新轮1619包/0丢包，160/160即时游戏负载解码，采集继续运行。

收尾更新：本轮已保存最终2555包并停止/清理，root设置false且su不可用，游戏保持运行。下文“仍运行”只指早期检查点。下一session先读[最新接替提示词](../../../promot/2026-10-25-protocol-capture-handoff.md)，不能直接启动旧采集state或只用新runtime覆盖旧目录。

统一交付已生成：[接口目录](../interface-catalog/README.md)、[动态覆盖](../interface-catalog/coverage.md)。[战斗与编队](battle-and-lineup.md)记录两场战斗及手动第三位上阵的请求、回包和状态比较。未解锁功能随用户正常引导逐步补，不要求额外消费。机器目录只记录快照；采集持续运行时，先Checkpoint，再decode-capture.mjs和build-interface-catalog.mjs刷新。27项codec测试通过；flow/方向/offset消息ID不会随追加C2S流量重编号。

最新实测：[首次登录链解码](login-decode.md)。原版首次登录、真实99字节挑战/46字节回复、PB请求与ETF四元组响应已验证；用户已进入大厅。当前被动采集仍运行，后续按单项操作补动态覆盖。初次登录的本地只读数据库问题已按[存储修复](storage-repair.md)保留证据并修复。

日期：2026-10-25。此文规定后续分工，不代表已采集原游戏业务流量。

下一agent执行提示：[协议采集续接](../../../promot/2026-10-25-protocol-capture-next-agent.md)。用户操作顺序：[游玩清单](player-checklist.md)。

用户操作游戏；agent只做已授权的目标进程日志、截图、协议观察与整理。采集前确认包名/UID及设备16448，用户游玩时不由agent点按钮、停应用或改路由。原包正常游玩与隔离包本机联调分别保存。

## 工具验证

设备已有 `/system/bin/tcpdump` 4.9.2/libpcap1.9.1。`analysis/tools/test-local-packet-capture.ps1` 使用独立本机18889端口和adb reverse，临时可逆root，只捕获自己的loopback HTTP探针，再以tcpdump读取PCAP验证固定响应；最后清理进程、映射与设备临时文件，恢复root=false并重启。

本轮自测通过：`analysis/experiments/private-server-20261025/p2/capture-selftest/status.json` 的 `capturePassed=true`，`loopback.pcap` 与 `decoded-local-probe.txt` 都保留同一固定HTTP响应。即使工具自测通过，也不证明游戏协议或TLS内容已解密。

实操注意：`tcpdump --immediate-mode` 确保短录制及时保存包；Toybox nc在stdin EOF时会提前关闭，需要短暂保留stdin才能收到经adb reverse的响应。本机探针已完成此验证，失败诊断和成功PCAP均保留。

复现：`powershell -NoProfile -ExecutionPolicy Bypass -File analysis/tools/test-local-packet-capture.ps1`。会暂时重启实例2，不应在用户游玩期间运行。

## 一次操作的记录

每次保留操作编号、时间、界面前后截图、连接/请求顺序、消息type与seq、字段类型、回包/推送及状态变化。关联客户端schema和直接消费者；未知字段标为未知，不靠字段名猜业务意义。

抓包从连接建立前开始，保留完整握手与包IV。实际业务采集须按目标进程socket地址/端口制定过滤器并验证归属，不直接抓整台模拟器全部流量。PCAP及含账号内容的原日志保存 `.local-only.*` 并留在analysis；对话与文档不输出凭证。

如果存在HTTPS，PCAP通常只能提供TLS元数据；可选包AES可依据已恢复格式分析，但真实样本仍需校验。若有额外加密/压缩或缺失握手，先补该层证据，再解释业务。当前没有安装CA、关闭证书校验或绕过登录。

接口节点完成后立即在 `agent/workflow/{大任务节点}/` 保存实操、复现命令、证据、验收与遗留问题。
