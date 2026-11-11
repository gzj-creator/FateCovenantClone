# QuickSDK 外部身份桥接

## 根因

锁定 APK 的手机号登录入口仍会先访问 APK 内硬编码的外部 QuickSDK 登录地址，取得 12 位平台 `uid/token`。游戏随后把该身份签入 `/v2/users/checkLogin`。旧 server 只接受自己签发的 64 位 token，所以隔离模拟器重启、设备 iptables NAT 丢失后，客户端得到外部身份，却会在 `checkLogin` 被 401 拒绝，表现为无法登录。

这不要求修改 APK。APK 发出的 `product_code/json_data/sign` 是 server 可以稳定对齐的协议边界；设备 NAT 也不应成为云端依赖。

## 当前实现

`createSdkService()` 新增可选 `quickSdkIdentityResolver`。它只在 QuickSDK 表单签名、产品号和载体结构全部校验通过后调用，输入为冻结对象：

```js
async ({ productCode, uid, token }) => ({ userId, loginCode, nickname })
```

返回 `null` 或抛错即拒绝登录。解析成功后 server 创建自己的会话并签发 64 位 token；`checkLogin` 返回的 `uid/user_token/token/platform_uid` 均使用 server 身份。后续 `tokenVerifySdk`、909103 网关登录和支付只使用该 server token。

当前 `local-server.mjs` 的单账号部署把所有通过签名校验的外部身份解析为 `local-1`。这样可以验证 APK 真实登录链路，不依赖外部平台 token 格式，也不要求 APK 或模拟器 NAT。原始外部 uid/token 不写日志，日志只记录长度和桥接结果。

## 云端接入边界

- 生产 resolver 必须向可信账号源验证外部 `uid/token`，不能只相信 APK 内可复制的 QuickSDK 产品密钥。
- resolver 可接自建账号库、QuickSDK 服务端校验或另一个身份服务，并返回稳定的 server 账号身份。
- 当前 wallet、充值订单、`local_wallets.account_id` 和游戏状态库仍以单账号 `local-1` 为业务边界。SDK 登录身份层已通用化，真正多账号上云还要把钱包、存档、角色和订单按返回的 `userId` 分区，并补账号隔离测试。
- 云端只部署 server；APK 继续请求其原有登录地址，再由 server 对齐 `checkLogin` 的签名与响应。客户端不需要重签或改包。

## 兼容与验证

- SDK 会话文件升级到 v2，保存 `userId/loginCode/nickname`；启动时兼容 v1 并原子迁移。token 仍只保存 SHA-256，不落明文。
- 过期会话在验证入口立即删除，避免重启或时钟异常时恢复。
- 测试覆盖外部签名身份桥接、server token 使用、伪造签名拒绝、resolver 拒绝、日志脱敏、v1 到 v2 迁移以及原持久会话行为。
- 部署真机验收只有在用户完成外部手机号登录、`checkLogin` 200、909103 登录成功后才算通过；组件测试不等同 APK 可玩验收。

## 2026-11-11 账号隔离回归修复

服务重启后客户端发送已签名的 12 位 QuickSDK 平台 `uid/token`，`quickLogin` 日志停在
`identity_resolver` 并返回 401。根因是 `1da5abd` 的账号隔离改动把解析器限制为服务器账号 ID：
它只接受 `local-1` 和 `local-phone-*`，却把外部 12 位平台身份也直接交给同一逻辑，导致主账号
桥接分支丢失。

修复新增 `quick-sdk-accounts.mjs`：已签名的 12 位外部身份恢复桥接到 `local-1`；服务器签发的
`local-phone-*` 身份继续解析到独立手机号账号；其他身份形状仍然拒绝。独立账号解析测试 `3/3`，
SDK 与部署测试 `28/28`，全量测试 `2,845` 项中 `2,843` 通过、`2` 跳过、`0` 失败。自包含部署测试
已实际启动服务并发出同款加密 `checkLogin`，返回 200、`uid=local-1` 和 64 位服务器会话 token。
