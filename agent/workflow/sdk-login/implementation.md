# 本机 SDK 登录实操

更新：2026-10-25 21:31，Asia/Singapore。用户操作登录；agent仅修改本机服务并在已授权的重启边界重开隔离客户端。

## 已验收

- 独立修改副本com.jzyx.ps/UID10042，v7；原APK与原版安装未覆盖。所有ADB使用-s 127.0.0.1:16448。
- 号码19900000000、任意4位验证码如1234，仅本机测试；不发短信，不使用原服账号或真实验证码。工厂默认未启用该模式，local-server显式localTestOtp=true。
- phoneAccountCheck→模拟sms/send→phoneLogin均返回rcode0；随机64hex token、有效期3600秒，后续校验本进程签发session。
- QuickSDK的POST /v2/users/checkLogin校验product_code/json_data/sign，排序参数后追加&productKey，MD5大写；json_data为Base64 DES/ECB/PKCS5Padding。8字节key重复三次用Node des-ede3等价处理。APK onLoginSuccess已真实通过。
- POST /user/userStatus的appid来自Lua GameTable.Base，不是quicksdk.xml；PlatformVisitor/PlatformTool按排序参数追加&key=后小写MD5。离线捕获http:tcp-28:c2s:0核对appid和签名均匹配。配置读取GameTable.data原型6的字段索引表及值数组，不能直接将字段索引当值。
- userStatus仅在本地OTP模式+显式platform配置启用，严格字段/签名/本机userid/活跃session；契约本身不带token，不能声称逐请求token认证。返回顶层与result同构，虚构本机成人测试字段及号码，不调用真实实名接口。

## 实操和证据

源码：personal-server/sdk-service.mjs、quick-sdk.mjs、local-server.mjs；APK构建配置tools/IsolatedApkBuilder/Program.cs。测试：`npm test --prefix personal-server`，63/63通过，包括新增状态接口签名、身份、会话到期及模式关闭校验。

2026-10-25 21:29:06.954手机号登录200，21:29:07.051 QuickSDK200，21:29:07.069 userStatus200，随后区服/网关成功。p3/server.stdout.local-only.log、hall-login.local-only.log、hall.local-only.png（完整路径analysis/experiments/private-server-20261025/p3）。旧v7-login-error2.local-only.log保留原userStatus404根因。服务未知路由只记录method+pathSha256，不输出账号、验证码、签名或token。

服务当前运行，不重复启动。实时状态：p3/runtime.local-only.data/server.local-only.json。如后续确需重启，先核对PID的Win32_Process.CommandLine包含personal-server/local-server.mjs，再停止该进程；以Start-Process node、WorkingDirectory项目根目录、WindowStyle Hidden及stdout/stderr重定向启动。等待local_server_ready后再操作客户端。SDK session仅在内存，服务重启需重登。

本轮重启后PID18008、客户端6323，仅作为检查点；不可长期硬编码。仍保留UID10042的IPv4/IPv6隔离、BPF pin和四端口reverse，root=true；这是本机实验，不是仍在采集原服。勿在用户验证时自动Stop。

## 遗留

userStatus不等于完整账号/实名/支付后台。公告、广告埋点、客服等未知HTTP仍明确404，尚不阻止大厅；付款不在当前范围。玩法缺口及大厅证据见../login-initialization/implementation.md。
