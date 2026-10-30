# 接口采集前置条件

日期：2026-10-25。按用户新顺序，先核实非业务基础，再由用户逐项操作采集接口；不自动连接原服务器。

## 核对状态

| 层 | 已确认 | 仍须联调 |
| --- | --- | --- |
| 改包与证书 | v2并行安装UID10042；资源表改名修复Unity崩溃；独立签名与对齐验证 | 可选第三方组件按包名构造URI的其他路径 |
| 地址与网络 | APK实际采用本机地址；新UID的IPv4/IPv6隔离、reverse与清理验证 | 换设备/换UID必须重新验证 |
| 启动资源 | APK接受与包内资源版本匹配的本地版本JSON | 真正缺失资源的更新分支 |
| SDK | 配置恢复、签名规则、证书依赖、初始化成功、账号/会话字段 | 手机号分支、真实本机账号登录、实际所用appKey与token接受 |
| HTTP区服 | 参数、签名、PB类型、显示谓词；UTF8 Base64直接CIL确认 | APK请求的最终MIME/回包接受 |
| TCP与握手 | 分帧、challenge、回复、超时及early AES；跨语言验证 | APK实际回复与所选模式 |
| 包加密 | CBC/Zeros、IV、MD5前缀、方向差异、边界；独立C#向量验证 | 实际加密开关及APK provider一致性 |
| 编码/会话 | PB信封、ETF桥类型、seq、单调计时和时间字段尺度 | 真实请求中的完整账号衔接与初始状态 |
| 采集 | tcpdump4.9.2/libpcap1.9.1；本机PCAP采集、响应保存与回放自测通过 | 游戏流量归属、实际握手与加密样本 |

“尚须联调”中的实际账号、握手和回包接受无法只凭离线文档证明，会作为首次登录采集的验收点。不能宣称接口之外所有事项已经在APK上完成。

## 新增直接证据

`analysis/tools/inspect-protocol-prerequisites.ps1` 产生 `p2/protocol-prerequisites-evidence.json`：`CryptoUtils.Base64Encrypt`确实是UTF8后Base64；HTTP参数字典进入 `UnityWebRequest.Post(string,Dictionary<string,string>)`。这是方法级证据，尚未观察实际区服请求的MIME。

SDK HTTP删ASCII空格，而区服签名保留空格；不要共用签名实现。SDK响应JSON、区服响应PB、游戏登录内部ETF是三条独立解析链。HTTP Content-Encoding与业务层压缩亦应分开。

入口文档：[改址](../client-endpoint/implementation.md)、[版本](../startup-version/implementation.md)、[SDK](../sdk-login/prerequisites.md)、[加密与网关](../gateway-handshake/crypto.md)、[采集流程](../capture-workflow/recording.md)。

## 首次采集顺序

1. 明确原包正常游玩或隔离包本机联调，记录包名/UID，不混用证据；设备仅16448。
2. 在建立连接前开始记录，保存握手与IV；用户登录，先核对SDK签名及账号字段传递。
3. 核对区服PB和网关真实回复，再关联login_sdk及ETF。
4. 确认大厅后，一次只操作一个功能，记录请求、回包、推送与操作前后状态。

不收集密码或验证码到常规文档；原始必要数据使用 `.local-only.*`，文档只记脱敏字段、结构、时序和来源。
