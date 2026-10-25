# 下一session接替：余额充值与个人服务器联调

你在F:/projects/FateCovenantClone，PowerShell。先读AGENTS.md顶部最新段及agent/workflow/wallet-admin/implementation.md、activity-ranking/implementation.md。不要按旧协议采集交接重复Start/Stop，不继续Unity路线。

## 用户目标与当前状态

用户希望个人服务器逐功能可玩；已要求SQLite落库和代码模块分目录。本轮新增本机Web管理，管理员给账户加余额，游戏内充值扣余额。用户现在换session，服务、客户端、隔离/reverse全部继续保留，不能擅自清理。

2026-10-25 23:59检查点：服务PID1776，客户端PID10836，仅作记录，操作前实时读取analysis/experiments/private-server-20261025/p3/runtime.local-only.data/server.local-only.json并核对进程命令。五端口18880/18881/18882/18883/19090都只监听127.0.0.1。com.jzyx.ps/UID10042，设备127.0.0.1:16448；四项reverse18880/18881/18882/19090仍在，网络隔离/root保留。原版com.jzyx.my不操作。用户游玩时不自动点击或启停客户端。

## 管理页和加钱

- URL：http://127.0.0.1:18883/，在电脑浏览器打开。
- 输入管理密钥：analysis/experiments/private-server-20261025/p3/runtime.local-only.data/admin-key.local-only.txt的文件内容。含密钥快捷地址在同目录admin-url.local-only.txt；密钥不要输出到公开日志/文档。
- 页面“账户管理→增加账户余额”，账户local-1/19900000000，填人民币金额，点击增加余额；游戏内普通充值扣余额。
- 初始余额0、累计加款0、充值订单0。本轮没有给真实库擅自加款。支持38种配置商品（type1/43/81、pay_type0、sync_handle0、基本货币奖励）；先验证商品11的6元60钻石或商品1的30元300龙晶。复杂礼包、月卡、英雄额外奖励等明确不支持，不要假成功。
- 自动打开浏览器两种Start-Process被自动审批拒绝（blocked by policy），已告诉用户手动打开，不绕过。

## 已完成和真实运行证据

1. 用户此前确认小队、升级、普通升星正常；SQLite养成/编队保留。91→注册补丁后完整92/92测试通过。
2. v8b APK完成构建、复用原隔离证书签名、对齐校验和install -r，23:43已重开。仍是原APK修改的独立副本com.jzyx.ps，不是重写客户端；原版不覆盖。signed SHA256 c33a192cd875fd9cda8e5a25104d49d5b2d4b5325056380efc53dc96de1ef3cf。
3. 手机注册登录报网络错误根因/user/phoneRegist返回404，已按离线DEX证据补localPhoneRegister，严格签名和4位验证码，仅localTestOtp模式，回原local-1，不创建新角色/改密码。普通账号localtest/Local2026!是另一入口。手机号19900000000，验证码任意4位；注册页如要求密码可填Local2026!，只是本机兼容字段，不是新账户密码持久化。
4. 注册补丁后真实APK在23:56:07手机号注册200、QuickSDK200、userStatus200，23:56:08握手接受及145模块登录成功。不是只有手工HTTP测试。
5. 真实APK23:56:32/33/34依次请求79104 act13016、task55021/55022/55023，全部sprint_reward_committed；SQLite activity_claims已有三条，module92 receive_data=AAAH，refresh_day20751。钻石当前60，冲榜积分当前60。用户尚未口头确认领奖画面，但真实操作、回包提交和数据库证据存在。
6. 注意上述任务是“巅峰对决”Tournament子页，读取module150.tournament.base.best_rank当日96名；不是Hunter任务55001。module121 Hunter无排名，不能伪造96或给所有任务直接通过。
7. Web在临时SQLite经Playwright桌面1440×1000、手机版390×844及加款100.25→购买6元→94.25余额/订单/流水完整操作验证并看图通过。真实钱包游戏内购买仍未验，运行库没有充值订单。

## 源码

- personal-server/admin/：HTTP、HTML、CSS、JS，Bearer/Host/Origin/CSP，本机18883。
- game/wallet-service.mjs：余额整数分、加款、商品、扣款、幂等订单、待确认记录；1900 res_recharge_success推送，16003 ETF订单确认。
- game/sprint-service.mjs：79104任务进度/归属/领取位、事务发奖、activity_claims防重；最终排名结算未实现。
- game/resources.mjs：基本资源发放；部分module6组映射已按现有存档推导，只支持有限资源，不代表所有奖励。
- config/game-tables.mjs、hero-tables.mjs：客户端生成表静态解释；sdk-service.mjs：注册登录及/pay/recharge/order；game/gateway.mjs：TCP业务。
- storage/game-store.mjs：新增local_wallets、wallet_ledger、recharge_orders、activity_claims四表，user_version2保留。购买/发奖编码与DB失败原子回滚；通知失败不撤销成功订单。
- tools/IsolatedApkBuilder/Program.cs：FC_LOCAL_BALANCE_PAY=1定点DEX改支付入口，保留OrderInfo构造，直达本机SDK order并Toast结果；FC_LOCAL_COMMON_LOGIN=1沿用。

## 接下来按优先级

1. 等用户在管理页加款并操作游戏内普通充值。观察walletOrder、wallet_purchase_committed、1900及16003，查余额/资源/订单一致与重登持久化。不要自行加钱或点击消费。
2. 若充值失败，先查本机SDK路径/字段/金额及DEX真实调用。SDK有分转元步骤，现amount按元校验；cp_order幂等。保留业务失败，不扩大为任意充值成功。APK尚无成功购买证据。
3. 完善商品对应业务、首充/每日累计统计及复杂奖励时单独按配置实现。暂未实现全部商品。
4. 冲榜最终结算、完整时间窗口/统计区间和未知进度函数仍有缺口。已有2000/2008/2011空榜读接口，不能称排名模拟完整。
5. 战斗、招募、本轮未实现功能和5星后独立试炼仍需逐项做，保留用户已有养成数据。
6. 每个大节点更新agent/workflow细节文档，区分组件测试、APK真实请求、用户视觉验收。

## 证据与复现

目录analysis/experiments/private-server-20261025/p3/wallet-admin-20261025/：
- registration-tests.local-only.txt：92/92；tests.local-only.txt：前一版91/91。
- browser-check.local-only.json和admin-desktop/mobile截图。
- game-before.local-only.sqlite及before快照、deployment-check证明原九类表无变化。
- handoff-game.local-only.sqlite：23:58一致备份，包含用户新领奖；handoff-acceptance.local-only.json：真实注册/登录/三次79104、领取位/余额/资源，SQLite integrity_check=ok。
- server-registration.local-only.log/.err（当前服务，stderr为空）；runtime.local-only.data/events.jsonl为累计事件。
- isolated-local-v8b/签名APK及构建manifest，原证书p1/isolated。

统一测试：npm test --prefix personal-server。
服务启动：从项目根目录node personal-server/local-server.mjs，当前已运行不要重复开；若确需重启先核对实时PID命令再停，只重启本机服务，SDK会话在内存需用户重登。
ADB绝不省略-s 127.0.0.1:16448；原版不动、不连接原服、不清理UID隔离/reverse。不派子agent。
