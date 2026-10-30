# 网关与加密前置核对

2026-10-25 21:29更新：隔离v7已连接127.0.0.1:19090，本机服务记录challenge_sent→handshake_accepted→909103登录→login_sent，之后截图和用户确认显示本机大厅。3开关仍全false；可选true分支仍只有组件验证。运行实现为local-game.mjs，不是下方只捕获即关闭的probe。证据详见[登录初始化](../login-initialization/implementation.md)。

日期：2026-10-25。静态契约和本机跨语言对照已完成，APK真实握手仍待首次本机登录验证。

## 连接与握手

帧头4字节大端，存payload长度，不含自身。首帧为ASCII `verify`。服务challenge的payload为99字节：16字节key、32字节server-verify密文、16字节预期明文、16字节client-verify、16字节包IV、3个开关。

握手AES使用UTF8 key/IV且按字符补空格至16；固定IV见 `personal-server/game-handshake.mjs`。本机.NET默认CBC、PKCS7。服务challenge需要完整32字节密文；客户端回复代码在CryptoStream最终flush前复制输出，因此16字节挑战的回复密文在本机实测只有16字节。不能用32字节最终填充结果替代。

回复依次为随机ASCII key16字节、early AES密文、3开关字节、应用版本UTF8。该层发送后即进入connected，没有额外服务确认包。默认验证超时2秒、连接超时5秒、心跳周期30秒；业务调用实际参数仍需采集确认。

握手key、包内固定packet key、SDK appKey、HTTP区服签名key是不同用途，不能混用。

## 可选数据包AES

`NetCrypto`明确设置AES128 CBC、Zeros；固定key引用代码，IV来自challenge80..95字节，每包新建变换器。

客户端发送路径：`paddingCount | AES([MD5(payload) if signature] + payload + zeroPadding)`。paddingCount为明文的一字节，范围0..15；原文恰好16字节对齐时不补整块。使用实际worker所调用重载的返回长度，不使用另一便捷重载多分配的尾部16字节。

重要方向差异：客户端接收路径只减去paddingCount，没有剥离或校验MD5前缀。`decryptIncomingPacket`保留此行为；自有服务另用 `decodeClientPacket` 校验并剥离C2S签名。不得对S2C擅自套用C2S格式。

实现：`personal-server/game-packet-crypto.mjs`。独立C# harness沿静态CIL重新实现TransformBlock，18个边界向量中17个有效；零长度且无签名在本机provider明确抛异常，该结果也保留。Node与C#逐字节一致；不是APK provider一致性的证明。

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/run-game-packet-crypto-harness.ps1
node --test personal-server/game-packet-crypto.test.mjs
```

原始CIL身份：`analysis/reports/private-client-16448/native-loading/network-cil.json`，Network DLL SHA256 `da3adac11dd39c975f0a4703f24e7cb98fe12e6189fbff589288881a6215fb83`。新向量及运行hash：`p2/packet-crypto/fixtures.json`、`run-identity.json`。

现有 `game-gateway-probe.mjs` 仍明确只允许3开关全false，完成严格握手与login_sdk元数据捕获后关闭，不发送未知业务成功包。新增包加密工具尚未接入该探针，不能据其存在声称探针已支持加密模式。

## 编码与序号

- Protobuf是序列化，不是加密。外层c2s type是sint32 ZigZag，s2c type为uint32。
- 首次seq=1，后续 `seq + seq%3 + 1`；回复依seq关联请求，seq=0为推送。
- `time_ms`来自启动后的单调计时，不能替换Unix毫秒。
- 游戏登录请求type909103，data是PB(login)；响应外层PB，内部data为ETF。ETF类型映射与模块数据契约分别记录于原分析报告，不把可解码等同于合法大厅状态。
