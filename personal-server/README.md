# 本机客户端兼容组件原型

2026-10-31 活动修复 worktree：新增配置文件驱动的开服活动日历，并将超凡魔灵活动 `83028` 的登录数据、`module 83`、专属商城 `5070005`、九款现世礼包和 `85901` 推荐礼包状态接到同一活动开关。当前 `personal-server/config/activity-calendar.json` 使用 `all-open` 供测试；改为 `schedule` 后按 `serverOpenedAt` 和活动表的时间字段过滤。免费、资源与钱包礼包均支持限购和幂等。组件及临时 TCP 已验证，尚未部署到实时服务，真实 APK 待验收；详见[实现记录](../agent/workflow/pet-activity/implementation.md)。

2026-10-28 更新：新增代金券机制（分支 `feature/voucher-mail`）。管理端可通过游戏邮件发放代金券，玩家在游戏内领取后道具 `701500` 进入背包；原生 `16004 req_recharge_by_token` 按 `price / score_token_rate` 自动计算张数并抵扣，管理端 `/api/purchase` 支持按金额部分抵扣。SQLite schema v3 新增 `voucher_skus`、`game_mails`、`voucher_grants`、`voucher_redemptions`；组件测试 **112/112** 通过。真实 APK 的邮件领取与 16004 支付尚未验收。方案、协议证据、接口与限制见[代金券邮件与抵扣实现](../agent/workflow/voucher-mail/implementation.md)。

2026-10-26 部署后复修：用户实测“点击摆脱追兵显示配置出错了”“进入大厅显示服务器错误”。证据确认客户端 `Err.CONFIG_ERROR=5`（即该文案），且 `MissionUIMgr` 普通关卡只编码 `mission_fight_req{mission_id,is_assistant}`，`chapter_tid/section_idx` 不上线；201 校验已改为 `mission_id>0` 即普通关卡。大厅 1202 `req_shops_info` 按请求 shop id 返回空商品组，53002 活动阶段同步与 53001 一致返回空变更，消除进入大厅的未实现错误。统一测试 **103/103** 通过；证据、边界与未验收状态见[修复记录](../agent/workflow/fixes/mission-fight.md)与[hall-entry](../agent/workflow/fixes/hall-entry.md)。商店购买、真实活动阶段推进仍未实现。

2026-10-26 更新：新增旅途普通关卡战斗（201/202/203/204/207/213，确定性结算并推进 module 8 主线进度）、配置化随机宝箱开启（151/157/159，仅 `Random_Box`+`DrawTable` 权重且无保底）、活动读取（110308/110303/116004）。选择/付费/重复宝箱、垂钓与助力升超凡的业务命令、魔灵养成/投放均明确拒绝而非伪造。统一测试 102/102 通过；逐项证据与边界见 [修复记录](../agent/workflow/fixes/README.md)。服务与客户端未重启，运行库未写入测试数据。

2026-10-25 23:44最新：[余额与Web管理](../agent/workflow/wallet-admin/implementation.md)已部署，地址http://127.0.0.1:18883/，管理密钥在runtime.local-only.data/admin-key.local-only.txt。后台加余额，普通支持商品从余额扣款并发游戏资源，订单/流水/领取均SQLite持久化。91/91测试通过，管理页桌面/手机实测通过，v8b隔离APK已安装重开。真实游戏充值和冲榜79104领奖待用户验证；[活动记录](../agent/workflow/activity-ranking/implementation.md)。服务五端口保持运行，原有存档逐表无变化。以下未实现榜单/活动为历史，复杂商品和战斗/招募仍有缺口。

2026-10-25 22:14最新：用户已确认“小队能进，升级升星正常”。新增小队208/209/218，修正module9嵌套登录结构并迁移SQLite v2，完整保留养成数据；75/75组件测试通过。真实APK命令与SQLite已核对：英雄升到9级、两个英雄各升3段进度、经验和碎片同步扣除。服务与客户端保持运行。实现/迁移/验收证据见[玩法状态](../agent/workflow/gameplay-state/implementation.md)。后文待验和小队未实现均为旧状态；突破、满6段进星目前仅组件测试，战斗/招募/后续试炼仍待做。

2026-10-25 22:05更新：升级636、突破638、普通升星639已实现并部署；游戏状态迁移到 SQLite，72/72测试通过，APK养成操作待用户验证。模块已拆分为 game/、storage/、protocol/、config/；根入口和兼容导出保留。数据库位于 p3/runtime.local-only.data/game.local-only.sqlite，原JSON已备份并只导入一次。详细表结构、事务、复现与验收分界见[玩法状态实操](../agent/workflow/gameplay-state/implementation.md)。当前服务与隔离客户端保持运行，下文未实现养成为旧状态；独立试炼、战斗及招募仍未实现。

2026-10-25 21:31最新：隔离v7 APK已通过SDK双层登录、平台状态、区服与真实网关握手，用户实测进入Local Adventurer大厅。63/63组件测试通过。启动入口为项目根目录 `node personal-server/local-server.mjs`；当前已有实例运行，勿重复启动。端口18880/18881/18882/19090均仅loopback。设备隔离及reverse正在用于用户验证，不能按下文历史实验收尾自动停止。

测试号码19900000000，验证码任意4位（如1234），不发送短信；本地测试模式显式启用，默认SDK工厂仍严格登录。QuickSDK的DES产品key必须8字节，MD5签名大写；Lua平台状态签名与SDK key分离。SDK token为进程内会话，重启服务需重登。已安装的是原APK的独立修改副本com.jzyx.ps，原版未覆盖。

大厅仍采用离线捕获的早期状态结构作为本机fixture，非完整玩法后端。type208/209/2011明确未实现，战斗、招募、养成、活动计时及资源异常待修。实际证据、依赖和复现见[SDK实操](../agent/workflow/sdk-login/implementation.md)、[大厅初始化](../agent/workflow/login-initialization/implementation.md)。下文60/54项和未登录结论均为历史。

2026-10-25本session更新：统一测试已为60项（原54+启动版本2+packet AES4）。v2隔离APK已真实采用本机地址、接受本地版本文件并完成SDK初始化，进入SDK登录页；账号登录、区服、网关与大厅仍未验收。最新实操及边界以 [agent/workflow](../agent/workflow/README.md) 为准，下文54项/unsigned为旧历史。新增启动服务 `startup-service.mjs` 和可选包加密工具 `game-packet-crypto.mjs`，后者尚未接入现有全false网关probe。设备实验已清理并恢复root=false。

当前包含账号 SDK HTTP、区服列表 HTTP/Protobuf、TCP 分帧、严格本地握手profile与网关探针。统一测试54项通过（SDK13、区服9、分帧17、首帧观察3、握手5、网关探针7）；最新结果在 `analysis/experiments/private-server-20261025/p1/components-54-tests.txt`，[原39项记录](../analysis/reports/private-client-16448/local-components-validation.json) 保留为历史。实际 APK 尚未接入；本地profile并未证明 APK/IL2CPP握手行为相同，不能据此进入自有服游玩。

2026-10-25会话收尾：原APK在目标UID本机隔离下发来一条包名/版本匹配的unknown HTTP POST，观察器返回501，不是SDK/区服成功。所有本次监听器、reverse、设备规则和BPF pin已清理，root恢复关闭，应用保持停止。下一步使用已构建的unsigned隔离包，详见 [续接提示词](../promot/2026-10-25-personal-server-next-session.md)。

使用 Node.js 26。SDK 与分帧仅用内置模块，区服使用锁定的 protobufjs 8.8.1；临时 HTTP 服务只绑定 127.0.0.1。测试结束关闭全部监听器，不修改 APK 或模拟器。

## 统一验证

从项目根目录执行：

```powershell
npm ci --prefix .\personal-server --ignore-scripts --no-audit --no-fund
npm test --prefix .\personal-server
```

依赖已在本轮安装，当前机器直接运行第二条即可；第一条供重新建立依赖环境。各组件 CLI 的参数都是本地测试配置，不会自动重定向现有 APK。

## 本地区服列表组件

`server-list.mjs` 是独立本机 HTTP 服务，支持 `POST /server_list`。`channel_login_servers` 和 `preferred_login_servers` 返回真实 `pb_login_servers` 二进制；`login_server` 返回真实 `pb_login_server`。`login_server_state` 回包类型尚未单独确认，因此明确返回 501。组件不会启动或连接配置中的游戏网关，也不代表 APK 已能进入游戏。

序列化使用官方 npm 源安装并锁定的 `protobufjs@8.8.1`，依赖记录于 `package.json` / `package-lock.json`，安装时禁用 lifecycle scripts。`server-list-codec.mjs` 默认使用本目录的完整 protobufjs；可通过 `PROTOBUFJS_PACKAGE_JSON` 指定已有库的绝对 `package.json` 路径。适配器读取已导出的 `server.net.proto`，并核对 SHA-256 `1f1a744f71e9dd5216b7ecc061383ef5ded3b2fe9072aa8e8785659e6f8df4d3`。未配置可用 codec 的工厂实例返回 501，不以 JSON 代替 protobuf。

```powershell
$env:SERVER_LIST_SIGNING_KEY = 'temporary-local-server-list-key'
$env:LOCAL_SERVER_ID = '1'
$env:LOCAL_SERVER_NAME = 'S1 Local test server'
$env:LOCAL_SERVER_EXTRANET_IP = '127.0.0.1:19090'
$env:SERVER_LIST_PORT = '18881'
node .\personal-server\server-list.mjs
```

`LOCAL_SERVER_EXTRANET_IP` 必须显式配置成自有 IPv4:port；示例地址仅是测试配置，没有自动启动对应游戏网关。服务始终只绑定 `127.0.0.1`，支持端口 `0`，按 Ctrl+C 关闭。签名 key 由本地配置注入，没有恢复或输出 APK 内的真实 key。

请求表单字段为 `method,json,sign`，`json` 是原参数 JSON 的 UTF-8 Base64。签名仅对原参数按键升序拼接 `key=value&...&key=<signingKey>` 再取小写 MD5，保留 ASCII 空格；外层三个表单字段不进入签名。使用导出的 `encodeServerListRequest` 可构造本地测试请求。表单 MIME 依照当前本地实现选择，原客户端 C# 重载的具体编码仍需独立联调验证。

配置服的 `state=0`、`show_state=1`、维护时间为 0，显示/开放时间早于当前时间；角色列表为空，`limit_login=false`。这些是符合静态可见性谓词的本地设计值，不是原服务端事实。未知区服、错误签名、非法字段或未知操作明确报错。日志只记录固定操作名和状态，不记录请求身份、签名或原始 URL。

```powershell
node --test .\personal-server\test\server-list.test.mjs
```

测试通过真实本机 HTTP 验证列表、首选列表和单服二进制回包，再由 protobufjs 反向解码核对类型、字段与地址，同时覆盖坏签名、非法区服 ID、未知操作、缺失 codec 和关闭行为。所有 listener 在测试结束时关闭。

## 账号 SDK 组件

`sdk-service.mjs` 是根据 APK 静态证据实现的账号 SDK 服务骨架，只监听 `127.0.0.1`，不使用外部依赖或持久数据库。支持本地账号登录和续登，不代表客户端已接受响应；战斗、养成、背包和游戏存档尚未实现。

静态契约和证据见 `analysis/reports/private-client-16448/android-login/README.md`、`sdk-login-contract.json` 与 `sdk-login-evidence.json`。

## 运行测试

在项目根目录执行：

```powershell
node --test .\personal-server\test\sdk-service.test.mjs
```

测试通过真实本机 HTTP 请求验证登录、续登、错误签名、错误密码、未知账号、伪造 token、错误用户、过期、空 banner、未知路由、输入限制和日志脱敏。测试使用端口 `0` 自动分配端口，并在结束时关闭全部 listener；过期测试使用可注入时钟，无需等待。

## 临时测试配置

通过环境变量配置 appId、appKey 和一个本地账号。`SDK_PASSWORD_MD5` 是测试密码的 32 位小写 MD5，不接受明文密码。下面全部为临时测试值，不是 APK 的原配置或原服务端密钥。

```powershell
$env:SDK_APP_ID = 'local-sdk-test'
$env:SDK_APP_KEY = 'local-test-key-change-me'
$env:SDK_LOGIN_CODE = 'local-player'
$env:SDK_PASSWORD_MD5 = '5f4dcc3b5aa765d61d8327deb882cf99'
$env:SDK_USER_ID = 'local-1'
$env:SDK_NICKNAME = 'Local test player'
$env:SDK_PORT = '18880'
node .\personal-server\sdk-service.mjs
```

该示例 digest 对应弱测试密码 `password`，仅适用于本机验证。服务没有默认账号或默认密钥；缺少必要配置时直接退出。关闭终端或按 Ctrl+C 停止。`SDK_PORT=0` 可自动选端口，启动日志会显示实际地址。

这些配置不会使现有 APK 自动接入。实际接入需要独立验证 APK 所用 appId/appKey、初始化路径、目标地址重定向和重签影响；该原型没有修改 APK 或模拟器。

## 接口与约束

| 接口 | 请求 | 行为 |
| --- | --- | --- |
| `POST /user/login` | `loginCode,password,appid,sign` | 校验已配置账号、密码 digest 和签名，随机签发 32 字节 token |
| `POST /user/tokenVerifySdk` | `access_token,appid,userid,sign` | 校验已签发且未过期的会话及用户，返回原到期时间 |
| `GET /banner/{gameId}/android-banner.json` | 无 | 返回 `{}`，对应静态观察到的配置缺失后继续分支 |
| `GET /banner/{gameId}/{numericChannel}-banner.json` | 无 | 同上 |
| 其他路由 | 任意 | HTTP 404，明确未实现；支付和身份绑定没有实现 |

POST 使用 `application/x-www-form-urlencoded;charset=UTF-8`。签名对加入 `sign` 之前的未编码参数按 Java UTF-16 字符串升序排序，拼接 `key=value&...&key=<appKey>`，删除全串 ASCII 空格，再取小写 MD5。不会删除制表符、换行或不换行空格。签名完成后再进行 URL 表单编码。

成功响应为 `{rcode:0,rdesc:'ok',result:{...}}`，`result` 包含契约中的 18 个类型一致字段。`expire_time` 是 int32 Unix 秒时间戳，默认一小时；会话验证不会自动延长。与静态 SDK 检查一致，当 `now > expiry` 时过期。失败响应使用非零 `rcode` 和 HTTP 4xx/5xx，不允许任意密码或未知用户成功。

账号的 `account_type='local'`、`status='1'`、空联系方式及 `sdk_id_verify=false` 是此本地测试服务的设计值，不是对原服务端实际数据的声明。本服务不收集或验证身份信息。

会话只在内存中保存，token 索引用 SHA-256；重启后失效。服务最多保留 1024 个有效会话，请求体最多 16 KiB。日志只记录固定路由名称、状态和端口，不记录密码、签名、token、账号或原始 URL。

## 工厂接口

```javascript
import { createSdkService } from './sdk-service.mjs';
const service = createSdkService({
  appId: 'test-app',
  appKey: 'test-key',
  account: { loginCode: 'player', passwordMd5: '5f4dcc3b5aa765d61d8327deb882cf99' },
  sessionTtlSeconds: 3600
});
const address = await service.listen(0);
try {
  // address.url points to the allocated loopback HTTP listener.
} finally {
  await service.close();
}
```

`nowSeconds` 可注入整数 Unix 秒时钟，`logger` 可注入仅接收已脱敏事件的函数。`close()` 幂等并清理会话和连接。没有对外绑定地址参数。

## TCP 分帧与握手字段

`game-framing.mjs` 提供 encodeGameFrame、GameFrameDecoder、isInitialVerifyPayload、encodeServerChallenge 和 parseServerChallenge。长度头为 4 字节大端，只记录 payload 长度；拆包器可处理碎片、粘包、空帧和截断，默认 64 KiB 是本地分配上限，不是已经证实的客户端接收上限。

99 字节 challenge 字段工具本身只放置调用者提供的字段。新增 `game-handshake.mjs` 通过显式选择本机 .NET Framework 验证的profile生成challenge并严格核对客户端早期cipher、flags、版本；精确fixture见 `analysis/reports/private-client-16448/handshake-aes-harness/`。目标APK运行时一致性仍未验收。

`game-gateway-observer.mjs` 只识别首帧后停止；`game-gateway-probe.mjs` 可执行verify/challenge/严格回复校验、定向解码login_sdk后停止，不发送未知业务回包。均只绑定loopback。探针CLI须显式 `--listen`、`GAME_AES_PROFILE`、版本、端口和三个为0的flags，配置见 `analysis/reports/private-client-16448/gateway-probe/`。`local-request-observer.mjs --listen` 仅脱敏记录HTTP分类并返回501，不伪造更新/登录成功。

## 当前验收边界

已验证的是本机组件行为和结构；未验证 APK 地址重定向、实际 SDK appId/appKey、重签与 appInfo 解密、客户端回包接受、网关握手、大厅初始化和玩法持久化。上一轮只分析本地副本；用户现已停止玩并授权16448可恢复运行实验，先备份并优先隔离测试副本，无需重复确认普通已授权操作。后续执行和验收顺序见 [续接计划](../docs/06-personal-server-handoff.md)。

静态下一层已定位：login_sdk 命令号 909103，内部为 login PB，外层为 pb_c2s；响应外层为 pb_s2c，登录 data 走 ETF。当前组件尚未实现该业务链、ETF 回包或模块初始化。完整证据和后续顺序见 [接入评估](../analysis/notes/07-private-client-feasibility.md)。
