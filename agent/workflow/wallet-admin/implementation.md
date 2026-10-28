# 本机账户余额与管理页

23:59交接检查点：真实APK23:56:07注册、QuickSDK和userStatus均200，23:56:08握手及登录145模块成功，注册补丁已被APK实际接受。随后三次79104领奖提交，见活动文档。运行管理API200、38商品、余额0、累计加款0、订单0；真实充值仍待用户。新一致备份handoff-game.local-only.sqlite及handoff-acceptance.local-only.json已保存。下一session提示词promot/2026-10-25-wallet-admin-handoff.md。服务/隔离客户端保持，不清理reverse。

23:54登录补丁：用户点击“注册并登录”网络错误，日志路径SHA256 3d49e27c...与离线SDK的/user/phoneRegist精确匹配，旧服务对此404。已补显式localTestOtp模式下的localPhoneRegister，必需字段appid/phone/password/verifyCode/sign，严格校验签名和4位本机验证码，登录既有local-1，不改密码或存档。普通账号localtest/Local2026!与此手机号注册页不同。92/92测试通过，含注册→token验证、默认模式404、非法签名/验证码、原密码仍有效；部署后真实HTTP注册和token验证均200。当前服务PID1776须实时读取状态，客户端未重启/点击，等待用户重试。证据registration-tests.local-only.txt、registration-http.local-only.json。APK注册回调接受仍待用户确认。

更新：2026-10-25 23:44，Asia/Singapore。仅个人本机服务；真实支付、短信及原服均未调用。

## 已实现与部署

- 管理页：`http://127.0.0.1:18883/`。账户余额、管理加款、余额购买、最近100笔订单及流水。当前本机账户local-1/19900000000，角色100001；不是多账户注册系统。
- 管理接口使用随机Bearer密钥；本机文件`analysis/experiments/private-server-20261025/p3/runtime.local-only.data/admin-key.local-only.txt`保存密钥，`admin-url.local-only.txt`保存带fragment的快捷链接。不在公开日志输出密钥。仅监听127.0.0.1，并校验Host、Origin、JSON类型和请求大小。
- 账户余额按整数分存SQLite，管理加款不直接发游戏货币。充值购买同一事务完成余额扣减、游戏资源增加、订单和流水保存；请求ID防重复，数据库或编码失败全部回滚。
- 新表：local_wallets、wallet_ledger、recharge_orders、activity_claims。现有user_version=2兼容保留。默认余额0，本轮未擅自给运行账户加款。
- SDK POST /pay/recharge/order仅显式本机测试模式开启；校验签名、有效本机登录会话、账户、角色、区服、商品和金额。业务端使用配置价格，拒绝客户端金额不一致。
- 当前支持配置中type1/43/81、pay_type0、sync_handle0、基本货币奖励的商品；月卡、礼包业务、英雄/装备、复杂首充奖励没有统一实现，不返回假成功。示例商品11：6元换60钻石；商品1：30元换300龙晶。
- 成功后推送1900 res_recharge_success；更新module19的total_amount、recent_record/max_record、tmp_recharge_record。客户端16003 ETF订单确认后标记已确认并清理待确认记录。即时通知失败不改变已提交订单，重登仍有资源和订单记录。
- total_amount和record.amount沿用Recharge.price的分单位，RechargeMgr第54函数line943/949/954明确直接累加price。FlushTimeTable.data配置日刷新18000秒，即UTC+08:00的05:00，日索引floor((Unix秒+10800)/86400)。

## 源码与验证

- admin/server.mjs、index.html、admin.css、admin.js：管理HTTP和页面。
- game/wallet-service.mjs：余额、商品、订单；game/resources.mjs：基本资源发放；storage/game-store.mjs：事务与表。
- config/game-tables.mjs、hero-tables.mjs：只读解释客户端生成配置，不执行客户端Lua。
- sdk-service.mjs：本机SDK购买；game/gateway.mjs：1900推送及16003确认。
- npm test --prefix personal-server：91/91通过。含签名/会话/金额拒绝、SQLite重开、防重、资源新建、数据库与编码回滚、断连后订单保留，以及真实本机TCP1900推送和ETF16003确认。
- node analysis/tools/verify-wallet-admin.mjs <证据目录> <playwright/index.mjs>：独立临时SQLite中通过100.25元加款→6元购买→94.25元余额、订单/流水tab、1440×1000桌面及390×844手机版。截图已检查；真实运行库未写测试订单。
- 证据目录：analysis/experiments/private-server-20261025/p3/wallet-admin-20261025/，含tests、browser-check、desktop/mobile截图、game-before一致备份、before快照、deployment-check。

## 部署和客户端

23:40服务重启后PID35132，实时值以runtime.local-only.data/server.local-only.json为准。五端口18880/18881/18882/18883/19090均属于该进程且仅127.0.0.1。九类原有表逐表比对未变化，SQLite integrity_check=ok，原有英雄/资源/编队保留。

isolated-local-v8b/com.jzyx.ps.signed.apk基于原APK独立修改副本，复用p1/isolated签名身份，签名/对齐校验通过，ADB install -r成功。仍为com.jzyx.ps/UID10042，版本名沿用原值；保留数据、隔离及四项reverse。23:43只重开隔离客户端，原版com.jzyx.my未操作。v8b signed SHA256：c33a192cd875fd9cda8e5a25104d49d5b2d4b5325056380efc53dc96de1ef3cf。

构建环境FC_LOCAL_COMMON_LOGIN=1、FC_LOCAL_BALANCE_PAY=1；LocalSdkDex保留OrderInfo构造，将支付入口指向本机order接口并以Toast返回结果，商品资源由游戏1900推送处理。源码包含原DEX哈希及原指令字节校验，重算SHA1/Adler32；客户端真实购买仍待用户操作，不能将91项组件通过等同APK充值验收。登录号码19900000000，任意4位验证码。

自动打开管理浏览器的两种Start-Process调用被自动审批拒绝，原因仅返回blocked by policy；不绕过该限制。用户可手动打开本机URL并填文件中的管理密钥。

## 遗留

- 等用户实际加款、游戏内购买、1900到账/16003确认及重登结果。
- 目前单账户；复杂商品须分别实现对应玩法和额外奖励。
- 管理页面为本机测试运维入口，不涉及真实支付网关。

## 2026-10-28 购买后报错与限购状态修复

- 根因1：购买成功后客户端必发 `type=108 req_remove_operate_display`，旧网关按未知命令回 `errCode -1 LOCAL_NOT_IMPLEMENTED:108`，客户端因此弹“服务器错误”和错误的日志id。现 108 作为 UI-only 空成功应答并记录 `operate_display_removed`（commit `2bb3217`）。
- 根因2：限购状态依赖 `res_recharge_login.buy_gift_record`（模块19）与 85901 `pb_recommend_gift_active_rsp.buy_times`，此前两者为空/恒为0，所以买完仍可点击。现购买成功写 flag 73 + 模块19，服务启动时按 `recharge_orders` 回填；85901 按 `recharge_orders` 统计返回 `buy_times`（commits `5bf9643`、`d526f39`）。
- 实测：05:40:49Z 产品 40010（1200 券）购买成功，同一连接的 108 请求返回 `operate_display_removed`，不再出现 `unsupported_command:108`。订单 46003(900)、40008(3000)、40010(1200)；代金券余额 4900；模块19 `buy_gift_record` 三条齐全。
- 测试：`node --test test/*.test.mjs` 129/129 通过；新增 `personal-server/test/recommend-gift-count.test.mjs`，经真实 TCP 握手+登录后断言 85901 返回 40008=1、46003=0（commit `6713e6d`）。
- 服务：PID 以 `runtime.local-only.data/server.local-only.json` 实时为准（本轮 34692，2026-10-28T14:15:51Z 启动），五端口均 loopback；客户端未重启，自动断线重连并重新登录。待用户重开“超值精选”确认已购卡片显示与剩余次数。

## 2026-10-29 每日特惠补买修复

- 根因：`buy_times` 达到 `can_buy_times` 后，钱包服务直接返回 307，没有使用模块108每行 `buy_additionally`；同时 ETF 的第二个参数解码为 `OtpErlangBinary`，旧解析器没有读取 `[isExtraBuy, period, day]`，日志无法确认客户端补买标记。
- 修复：首次购买只增加 `buy_times`；首次次数耗尽后，若该行仍有 `buy_additionally`，则扣减并完成补买，继续通过 1900 推送 `pb_daily_discount_all`（flag 40）。订单和钱包流水记录 `daily_discount_additional` 与 `requested_extra_buy`；重启回填只把普通订单计入 `buy_times`，补买订单不消耗首次限购。
- 验证：`npm test --prefix personal-server` 为 137/137 通过；真实 TCP 用例覆盖 `40010` 首次购买后以 `isExtraBuy=true` 补买、推送、模块108从6降到5及订单 payload 标记，另覆盖补买耗尽、重启保持和旧限购应答。`46003` 配置本身 `is_buy_additionally=false`，不能作为补买商品。
- 部署核对：修改前进程 PID32312 启动于2026-10-28T16:46:16Z，包含 `3e1efea` 的已提交每日特惠同步，但不包含本次补买改动。提交 `da42286` 后已备份 SQLite 并重启服务端为 PID17888（2026-10-28T17:09:38Z），五端口仅 loopback；客户端未重启，17:09:47Z 自动握手并完成145模块登录。备份与部署证据在 `analysis/experiments/private-server-20261025/p3/daily-discount-additional-20261029-010915/`。
