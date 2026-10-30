# 下一 Agent：用户操作，采集协议与完整接口目录

继续 `F:\projects\FateCovenantClone` 的现有 APK 个人服务器兼容任务。本轮先做目标客户端协议采集与接口整理，不回到 Unity 路线，不先扩建猜测后端。用户负责正常游玩，你负责采集、解码、关联操作和输出文档。尽量少用token，复用现有证据。

## 先读与最新基线

1. `AGENTS.md`，本提示词为最新采集任务。
2. `agent/workflow/protocol-prerequisites/implementation.md`、`agent/workflow/capture-workflow/recording.md`。
3. `analysis/experiments/private-server-20261025/p2/status.json`。
4. 需要具体加密/配置时再读 `agent/workflow/gateway-handshake/crypto.md`、`sdk-login/prerequisites.md`、`client-endpoint/implementation.md`；继续二进制分析前读 `.agents/skills/reverse-engineer-anything/SKILL.md`，不重新安装工具或重做全包分析。

只操作设备 `127.0.0.1:16448`（MuMu实例2），每条ADB显式 `-s 127.0.0.1:16448`，禁止16416。ADB在 `C:/Users/gzj/AppData/Local/Android/Sdk/platform-tools/adb.exe`。PowerShell为主。

- 原包 `com.jzyx.my`、历史UID10041，供用户正常游玩；必须实时核对。原APK/安装/数据未替换，数据库hash仍与备份一致。
- 隔离包 `com.jzyx.ps`、UID10042已安装，只连本机。它目前只能到SDK登录页，无法用于原游戏全功能采集。不要让用户误开它，也不要把它改回外部服务器。
- v2已实测改址、版本检查和SDK初始化；账号登录/区服/实际网关/大厅未验收。60项是组件测试，不是APK协议全通过。
- 握手AES和可选packet AES有独立跨语言向量，实际APK模式及回复仍待采样确认；packet加密工具未接入现有全false网关probe。
- 设备tcpdump4.9.2/libpcap1.9.1的本机PCAP采集和回放自测已通过。最新收尾root=false、su不可用、reverse为空、无本次规则或监听，两个目标包均停止；先实时核对，不能假定状态不变。

## 授权与协作

用户已授权本项目所需可恢复设备实验和本人操作通信的采集。常规授权步骤无需重复询问。只被动观察用户手动正常游玩产生的目标客户端通信；不由agent主动请求、重放、探测或破解原服务器。不代输入真实密码/短信验证码，不代购买或消耗稀缺资源，不卸载原包、不清数据、不覆盖唯一备份。

先用一句话核对用户尚未开始、是否已在游戏内；准备工作和必要的可逆root/重启应在用户游玩前完成。一旦用户开始，不由agent点击、停应用、重启或改路由。需要重连样本时请用户自行操作。

不得全系统抓取其他应用通信；先制定目标socket/地址/端口过滤并验证归属。采集原包时禁止挂会把它导向本机的私服NAT/reverse规则。原包正常游玩和隔离包本机实验分开保存。

## 先验证采集能解码，再让用户批量操作

1. 核对目标包、UID、设备、用户当前界面和恢复方案，检查现有工具。已有 `analysis/tools/test-local-packet-capture.ps1` 仅为本机自测，会重启实例2，不要在用户游玩时直接运行。可复用其tcpdump/清理做法，但实际采集脚本需限定目标流量，停止指定PID，避免killall。
2. 建立可持续的目标PCAP、目标UID日志和操作时间标记，记录工具版本、过滤器、开始/结束时间、丢包计数及文件hash。从用户启动原游戏之前开始；根据已知端点/端口与进程socket完善过滤，不能只在进入大厅后才录，丢掉握手。
3. 发送“采集已开始，现在启动原版游戏并登录”。用户输入账号和验证码，登录后停在大厅20秒，先分析这一段。
4. 优先验证帧重组、实际握手、challenge IV/flags、AES长度/字节、PB信封、type/seq、login_sdk与ETF。成功解码后才开始收集更多功能，避免让用户玩一小时却只拿到不可解码密文。
5. HTTPS与自定义TCP分开处理。TLS抓包不等于有明文；若额外加密/压缩或工具受限，明确记录并追客户端直接依赖。不要擅自装CA、关闭证书校验或绕过认证，不把密文hash说成接口已恢复。

现有可复用代码：`personal-server/game-framing.mjs`、`game-handshake.mjs`、`game-packet-crypto.mjs`、`game-gateway-probe.mjs`；PB schema和接口映射位于 `analysis/reports/private-client-16448/lua-bundles/`。必要时定向查 `Cmd.lua`、`Port.lua`、`Connection.lua` 及对应PB/ETF消费者。

关键坑：SDK签名删除ASCII空格、区服签名保留；区服HTTP回PB；登录type909103，c2s type为sint32；seq初始1，后续seq+seq%3+1；time_ms是启动后计时；登录响应外层PB、data是ETF。C2S可带MD5前缀，客户端接收路径未见同样剥离逻辑，不能直接对称套用。unknown POST `/sdk/tracker/log`是埋点。

## 用户操作节奏

按 `agent/workflow/capture-workflow/player-checklist.md` 引导。一次一个动作，用短标记如“03-角色升级一次”，操作前后各停5至10秒。先开界面，后改状态；只做一次，必要时重复同种低成本操作2至3次验证动态字段。每完成一类，暂停分析和保存。

顺序：冷启动登录/选服 → 大厅静置 → 图鉴与编队 → 升级/装备 → 普通关卡完整战斗与领取 → 圣器/星火 → 已解锁的其他功能。正常、倍速、跳过、失败/重连等只在已有条件且用户愿意时分开采。天极/法阵等未解锁、付费或高成本功能记覆盖缺口，不诱导购买和重复消耗。

## 输出全部接口的含义与交付

建立尽可能完整的静态目录，再用动态样本逐项补证。不止HTTP URL，还要包含TCP命令、服务端推送和必需配置请求。用户没触发、账号没解锁或客户端有分支的接口不能称抓全。

固定输出到 `agent/workflow/interface-catalog/`：

- `README.md`：总入口、采集范围/客户端版本、复现与解码步骤。
- `interfaces.json`：统一目录。每项记录协议、HTTP method/path或TCP方向/type/name、请求/回包schema或ETF形状、签名/加密前置、触发操作、seq关联、关键状态变化、原始证据引用、确认程度及未知项。
- `http-interfaces.md`、`tcp-commands.md`、`server-pushes.md`：可阅读目录，按SDK/登录/角色/编队/战斗/结算/养成等模块分组。
- `coverage.md`：静态声明数、实际观察数、已解码数、已用操作验证数；清楚列出未解锁/未触发/未知/采集丢失，不把声明数当验收数。
- 每个大节点在 `agent/workflow/{大任务节点}/` 及时沉淀实操、复现命令、证据、验收和遗留问题；更新AGENTS与交接入口。

原始证据存 `analysis/captures/protocol-<本次时间>/`，PCAP与可能含凭证的日志命名 `.local-only.*`，确认gitignore生效。输出结构和脱敏例子，不输出密码、验证码、token、key、真实账号或设备标识。保存消息方向、时间、长度、type/seq及证据引用，避免混淆心跳、埋点与业务请求。

先完成“启动登录链可采集且可解释”的第一批里程碑并写文档，再带用户逐模块补全。用户暂停或结束时及时收尾：保存文件，终止本次捕获进程、清理本次临时资源并恢复原root设置；不重启正在游玩的实例。明确报告已恢复范围与缺口，不宣称仅靠一次游玩已获得所有接口。
