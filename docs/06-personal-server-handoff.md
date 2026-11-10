# 个人服务器兼容实验：续接计划

## 2026-11-11 双账号隔离与命运二服裸机部署

当前远端 `main` 为 `1da5abd`，线上 release 为
`/data/disk1/game/releases/release-20261110T172155Z`，使用 systemd 裸机部署，不使用 Docker。
线上数据库已是 v19：原账号 `local-1` 继续使用 12 级角色 `100002`；手机号
`17607270093` 使用独立 1 级角色 `100003`。100 万张、每张 1 元的代金券已通过管理 API
发到角色 `100003` 的邮件，待用户在游戏内领取。

区服名修复为只显示一次“命运二服”，正式开服时间为
`2026-11-11T00:00:00+08:00`。部署前 v18 SQLite 完整备份位于
`/data/disk1/game/backups/pre-account-isolation-20261110T172155Z`，完整性为 `ok`。
代码改动、验证计数、端口和迁移证据见
[双账号隔离与部署](../agent/workflow/account-isolation-20261111/implementation.md)。

## 2026-10-31 冒险十连结果卡与圣装招募待部署修复

冒险十连空白已从真实 APK 和 Lua 调用链定位：首次获得的英雄被完整碎片资源变化、即时英雄 `extra`、`decompose_args` 重复计为结果卡，十连只要有 2/3 名新英雄就会生成 12/13 张卡，超出 `HeroDrawResultShowForm` 的 10 个槽位并抛 `Transform child out of bounds`。服务端已移除首次英雄的 `decompose_args`，碎片、即时英雄对象和 SQLite 英雄记录保持不变。

圣装招募不可用的直接原因是功能位 `1348` 关闭后 `LeaderEquipDrawMgr.GetCurLib()` 返回 `nil`，界面回落到普通冒险库；抽卡配置的 `fun_open=1322` 也需同时开放。服务端现已开放两项功能位，并支持 `draw_lib=116..121` 的圣装抽取、唯一装备实体、`2002` 消耗和模块 175 持久化。本地奖池按对应阶级装备等权抽取，原服完整权重因导出表缺少 `lib_range` 尚未恢复。

定向招募测试 `23/23`、全量组件测试 `291/291`、语法检查和 `git diff --check` 均通过。代码尚未部署到当时运行的 PID 4488；需在用户测试结束后的维护窗口重启服务，再验收冒险十连恰好 10 张卡、圣装入口不再回落、十件装备入库和重登持久化。本修复只改服务端，不修改 APK，不触发 APK 快照更新。

## 2026-10-31 招募池独立规则（已部署）

招募服务已从“所有库共用一套品质权重与全英雄池”改为按 `lib=1/2/3/10` 使用独立规则。当前本地兼容矩阵中，精英库 `lib=2` 永不产生品质 70（超凡），品质 60（天极）只有累计完成 100 抽后才进入候选；99 抽完成时仍锁定，第 100 抽完成后下一次抽取才开放。友情库不产生品质 60/70，其余现有库也均排除品质 70。具体权重、保底、候选集与心愿约束见 [招募实现](../agent/workflow/recruitment/implementation.md#2026-10-31-各池独立规则修复)。

全量组件测试 `211/211` 通过。另对当前 SQLite 的 WAL 一致副本执行了一次真实服务构造和精英单抽：原状态 `lib1.draw_count=4`、`lib2.draw_count=50`，合计 54；抽取后 `lib2.draw_count=51`，结果品质 50，未出现品质 60/70，现有英雄和 `lib2` 两条心愿均保留。该结果验证了旧存档兼容，不代表用户界面验收。

用户明确要求重启后，已于 2026-10-31 13:30（Asia/Shanghai）停止旧 PID 12980，并以 `main@280002e` 启动新 PID 36204。18880/18881/18882/18883/19090 五个端口均恢复为 loopback 监听，客户端立即重新连接；`game_connected`、`challenge_sent`、`handshake_accepted`、`login_sent` 均成功，返回 146 个登录模块，新进程 stderr 为空。重启前 SQLite 独立备份位于 `analysis/experiments/private-server-20261025/p3/recruit-pool-restart-20261031-053048/game.before-restart.local-only.sqlite`，SHA256 为 `20a8b1d1beef0c9418fe0138888a15d6afd3bb7ac8a1b209521b3ed292834aed`。本轮未修改 APK，无需重建或更新 APK 快照。

## 2026-10-28 看板娘修复与可用快照

主界面看板娘缺失已定位并实测修复：根因不是资源缺失，而是隔离客户端 PlayerPrefs 中 SubDownloadFinish=0 时，UniCore.RemoteLoadMgr.NeedRemoteLoad 把 sub_first 资源误判为远程下载；UpdateDownloader.AsyncAssetLackPreCheck 为空导致 AddRemoteLoad 失败，AssetBundle 请求未创建并在 6000 帧后超时，报 hero_sl_GuangZhiXin_new_talk.prefab load fail by bundle load timeOut 和 [MissAsset]。在 /data/data/com.jzyx.ps/shared_prefs/com.jzyx.ps.v2.playerprefs.xml 写入 SubDownloadFinish=1 后，截图 analysis/experiments/private-server-20261025/p3/kanban-after-subdownload-20261028.png 确认看板娘恢复；修复后 Info 日志无 AddRemoteLoad/timeout/MissAsset。该值未烘焙进 APK，重装/清数据/换设备后需重新写入。

当前可用 APK 快照已保存到 apk/com.jzyx.ps.v9-working.apk（4,185,758,901 字节，SHA256 1fd5fe0a2e18e9add821efb6c404d9464b5e3609be0e8af605d47bada441b473），不提交 Git；说明见 apk/README.md。用户已要求把“每次涉及 APK 的修改，验收通过后同步一份到 apk/ 目录并记录元数据”作为持久规则写入 AGENTS.md。设备 ADB 使用 E:\Mumu\MuMuPlayer\nx_main\adb.exe -s 127.0.0.1:16448；原版 com.jzyx.my 未操作。

详细根因、代码路径、日志和修复步骤见 [客户端资源实操](../agent/workflow/client-resource/implementation.md)。

2026-10-25 23:59用户换session，最新完整提示词[余额管理接替](../promot/2026-10-25-wallet-admin-handoff.md)。真实APK注册补丁已成功登录，三个79104巅峰任务奖已提交入库，92/92测试。Web18883在线，余额0/订单0，等用户后台加钱后做真实充值闭环。服务PID1776、客户端10836仅检查点；隔离/reverse保持，不清理、不重置用户领奖状态。本轮一致备份含最新领奖，见wallet-admin-20261025/handoff-game.local-only.sqlite。

2026-10-25 23:44最新：用户要求管理Web加余额及游戏内余额充值，已部署[余额管理](../agent/workflow/wallet-admin/implementation.md)。管理http://127.0.0.1:18883/，密钥在p3/runtime.local-only.data/admin-key.local-only.txt。91项组件通过，页面桌面/手机验证通过；v8b独立副本已安装重开，原有SQLite逐表保留。服务PID35132仅检查点，实时读取状态文件，五端口loopback。冲榜79104任务领奖实现详见[活动记录](../agent/workflow/activity-ranking/implementation.md)，Tournament已有当日96名，不要给Hunter伪造排名。游戏内充值和领奖待用户验证；复杂商品、最终榜单结算、战斗/招募仍未实现。不要清理隔离/reverse。

2026-10-25 22:14最新覆盖下文待验：用户已确认“小队能进，升级升星正常”。真实APK209/208/639/636成功且SQLite数据一致，英雄8→9、两名英雄升星各3段、经验-400及两种碎片各-30。小队218版本切换已补，208/209保存事务入库；module9已修复为pb_lineup_login→pb_role_lineup两层，数据库v2迁移仅修编队并保留养成。75项测试通过，服务PID38232和隔离客户端保持运行，实时状态文件为准。突破和满6段进整星仅组件测试。证据与迁移备份见[玩法状态实操](../agent/workflow/gameplay-state/implementation.md)，战斗/招募/排行榜/后续试炼仍待做。

2026-10-25 22:05最新：用户升级/升星服务器错误源于636/639未实现，现已补升级636、突破638、普通升星639并部署。游戏状态已按角色、英雄、格子、资源、编队、引导、模块快照分表落SQLite，原JSON备份一次迁移，代码拆game/storage/protocol/config目录。72项组件测试通过，含真实本机TCP、写库失败原子回滚与重开数据库。服务重启PID37780、隔离客户端重开PID7279；实时状态以server.local-only.json为准，SDK需重登。用户APK升级/升星结果待反馈，不能标已验收；5星后试炼未实现。细节与复现见[玩法状态](../agent/workflow/gameplay-state/implementation.md)。保持服务和隔离运行，不自动清理。

## 2026-10-25 21:31 本机大厅已验收

本节覆盖以下历史采集/实验状态。用户切换为实现个人服务器、启动服务及隔离客户端并亲自验证。独立v7 APK（com.jzyx.ps/UID10042）现已实际接受本机SDK、平台状态、区服Protobuf、网关握手与ETF登录初始化，截图显示Local Adventurer大厅；用户也确认成功。当前63项组件测试通过。

当前服务和客户端保持运行；root=true、仅UID10042网络隔离和reverse保留。原版com.jzyx.my停止、APK未修改。仅设备16448。实时PID/端口以p3/runtime.local-only.data/server.local-only.json为准，启动与定位步骤见[SDK登录实操](../agent/workflow/sdk-login/implementation.md)。本次没有再安装APK，沿用已安装v7。

四位验证码任意输入，仅本机、不发短信。QuickSDK二层已真实回调成功；最新补齐的/user/userStatus独立校验Lua平台签名与本机身份/活跃会话，虚构身份字段仅用于隔离测试，未调用真实实名服务。

后续优先修复真实缺口，不能批量假成功：type208/209编队、2011排行榜未实现；战斗、招募、养成与变更持久化闭环待做。大厅初始化仍基于离线捕获fixture，活动计时异常和首充入口资源报错待处理。详见[大厅初始化与证据](../agent/workflow/login-initialization/implementation.md)。服务测试通过不代表这些玩法可用。

## 协议采集收尾（2026-10-25 19:10）

用户要求总结并清空上下文交接。最新接替提示词：[协议采集接替](../promot/2026-10-25-protocol-capture-handoff.md)。最终[覆盖表](../agent/workflow/interface-catalog/coverage.md)：静态1742项，统一目录1760项，实观HTTP19/命令20/push4，已解码HTTP12/命令20/push4；操作验证HTTP3/命令6，另4传输控制。2555包、0丢包、256/256即时游戏PB/ETF负载解码。完整战斗动作、奖励/持久化、其余登录模块和TLS明文仍有缺口。

**采集已停止并清理**，本节覆盖下方“仍运行”。游戏保持运行；root=false读回确认，su已不可用，原采集PID不存在、reverse空。准确临时规则/pin/helper删除命令成功，关root后无法再特权读回规则，未为此重新开root。详见analysis/captures/protocol-2026-10-25/cleanup-verification.json。不覆写已变动游戏存档，不撤销存储归属修复。

旧目录保留最终证据；新session须新目录/新连接，并先扩展多轮目录合并和录制ID命名空间，避免只导入新snapshot而丢失旧操作证据。控制器Start不负责建pin/filter，不能直接复用已Stop的旧state；准备步骤已写接替提示词。用户当前是否仍玩需实时核对，不在游玩期间agent启停/点击/重启/改路由。

## 原版协议采集检查点（2026-10-25 18:49 后）

此节覆盖下方仅关于原版采集的旧结论；隔离包自有服验收仍未完成。原版 com.jzyx.my/UID10041 已由用户正常登录进入大厅，99字节challenge/46字节reply的AES与flags验证通过，真实连接可选包加密/签名均false。login_sdk PB请求与ETF四元组响应已解码；模块列表146项的内层PB尚未整体验收。

19:05更新：用户又完成突破type638/seq97和单次升级type636/seq102，两组请求/回包可解码。最新2517包checkpoint丢包0、即时游戏负载248/248，实观命令20种；突破与单次升级纳入操作验证，升级全部/付费/高成本分支未做。见[角色养成采样](../agent/workflow/capture-workflow/hero-progression.md)。最新目录统计以coverage.md快照为准，下方较早16种命令数保留为历史。

统一目录：[入口](../agent/workflow/interface-catalog/README.md)、[覆盖表](../agent/workflow/interface-catalog/coverage.md)。静态HTTP28/TCP命令1407/推送307项，另合入实观HTTP路由和传输控制。当前观察HTTP19种/游戏命令16种/推送4种；动态采样持续增长，以机器目录的snapshot/hash为准。登录、seq37第三位上阵、第二场type201/207战斗有用户操作证据。初始化type208不算手动上阵。解锁功能逐步补，图鉴未解锁/未找到。

实操与安全边界：[登录](../agent/workflow/capture-workflow/login-decode.md)、[存储归属修复](../agent/workflow/capture-workflow/storage-repair.md)、[战斗和编队](../agent/workflow/capture-workflow/battle-and-lineup.md)。原包数据未清理；四个只读文件修复未改变当时数据库内容。游戏后续可正常写入变化，不要为恢复旧hash覆盖存档。

采集仍运行，UID限定NFLOG42和logcat的PID/规则在analysis/captures/protocol-2026-10-25/capture-state.json。只用16448。用户正在游玩，不启停应用/点击/重启/改路由。Checkpoint保存后运行decode-capture.mjs，再build-interface-catalog.mjs刷新目录；27项离线codec测试通过。结束时protocol-capture.ps1 -Action Stop保存并清理本次资源、恢复root设置false，不重启用户游戏；实际su可能待未来重启才失效，需区分设置恢复与运行态。

## 本 Session 最新检查点（2026-10-25 17:13）

本节覆盖下方15:57旧基线。用户最新要求：先核实接口之外的配置、加密和采集前置，再由用户操作、agent记录接口；所有大任务细节写入 `agent/workflow/{节点}/`。完整入口：[工作流索引](../agent/workflow/README.md)、[前置核对](../agent/workflow/protocol-prerequisites/implementation.md)。

- v2隔离APK已签名并更新安装，com.jzyx.ps/UID10042，原包未替换。成功包 `analysis/experiments/private-server-20261025/p2/isolated-v2/com.jzyx.ps.signed.apk`，SHA256 `85c2a01c5383d9e0346a7de53f921d8a617e366ffe39294209579306aa2b66c1`。同目录保留签名/对齐/逐成员校验。首版仅Manifest改名导致资源ID0崩溃，v2同步resources.arsc的package name后启动成功，勿再安装p1首版。
- APK实测采用127.0.0.1地址，资源版本来自assets/update.txt首行364110；本地version_adr.txt真实JSON被接受并进入SDK手机号登录页。QuickSDK初始化成功有目标UID日志。尚无SDK账号登录、区服接受、实际网关握手、ETF大厅或玩法验收。
- 原unknown POST路径SHA256已与DEX字面量对应为 `/sdk/tracker/log`，是埋点，不能再当登录/区服证据。
- 新增 `startup-service.mjs`、`game-packet-crypto.mjs`，60/60组件测试通过，结果p2/components-60-tests.txt。可选包AES由独立C# TransformBlock向量对照，18边界向量含1个明确空输入错误；并未接入现有全false握手probe，也未证明APK provider一致。
- UTF8 Base64和字典POST重载已直接读CIL确认，证据p2/protocol-prerequisites-evidence.json；SDK签名删空格而区服签名保留空格。
- 设备自带tcpdump可用，p2/capture-selftest/中本机HTTP PCAP采集与回放自测通过。没有采集原服务器业务流量；实际用户操作采集前仍需从连接建立开始、按目标socket制定过滤器、保护原始凭证。
- 16448的UID10042 IPv4/IPv6隔离计数、清理证据已留存。reverse和本机服务已清理、隔离包停止，root=false且实例2重启。原LocalData.db SHA256仍为4d79fdb8d0f725c93f8ed0391197423847cb2687f836e70e52debec8f6af5d41。

下一步：用户准备操作时先确认原包正常游玩或隔离包自有服联调，分别记录；从首次登录握手开始验证未决项，不先假定已能解密全部流量。不在用户游玩期间重启或改路由。

更新：2026-10-25 15:57（Asia/Singapore）。用户要求保存并换session，当前实验已收尾。提示词：[promot/2026-10-25-personal-server-next-session.md](../promot/2026-10-25-personal-server-next-session.md)。Unity旧路线本轮不推进。

## 最新授权

用户最新原话：

> 我现在不玩，你可以做实验，你可以继续列出后续计划，我换个session继续完成任务，给我提示词

该授权替代此前“用户正在玩，只能离线分析”的临时约束。允许后续 session 在 127.0.0.1:16448 上进行本项目所需的可恢复运行实验：ADB 检查、截图/日志、应用启停、测试客户端、本机服务联调与仅针对测试目标的地址配置。此前已授权多 agent 并行工作。常规已授权操作不重复询问。

不把上述授权扩展为删除原应用数据、卸载唯一原包、覆盖不可恢复存档、付费/购买资源或公开部署。先保存备份和可恢复方案，优先隔离测试副本；不能备份时避免有数据损失风险的替换。只对本机/自有服务实验，不连接或破解原游戏服务器，不绕过第三方账号、付费或访问控制。遇到系统工具审批按实际要求申请，不能自行绕过。

本轮已完成16448可恢复实验和收尾，记录在 `analysis/experiments/private-server-20261025/`。APK确有带匹配包名/版本的HTTP POST到达本机，但route为unknown、返回501；尚未证明区服或SDK登录被接受。网关、ETF、大厅、玩法均未验收。

## 必须先读

1. AGENTS.md：本轮目标、设备和旧 Unity 计划的区别。
2. analysis/notes/07-private-client-feasibility.md：完整恢复情况和证据校正。
3. personal-server/README.md：组件能力、配置和测试命令。
4. analysis/reports/private-client-16448/lua-bundles/login-http-contract.md：区服、登录信封和 ETF 返回链。
5. analysis/reports/private-client-16448/native-loading/findings.md：AES 特例、帧和原始 CIL 位置。
6. analysis/reports/private-client-16448/android-login/README.md 与 sdk-login-contract.json：SDK 实际字段及配置问题。
7. .agents/skills/reverse-engineer-anything/SKILL.md：继续二进制分析时使用该技能。

## 当前基线

- 工程 F:\projects\FateCovenantClone；PowerShell；目标包 com.jzyx.my。
- ADB：C:\Users\gzj\AppData\Local\Android\Sdk\platform-tools\adb.exe。目标必须显式 -s 127.0.0.1:16448；16416 是旧分析设备，禁止混用。
- APK：analysis/apk/device-pull-16448/com.jzyx.my/base.apk；SHA256 b724dfbaa5687ebbfc9ce1b930e9bd88ca74f9b6afc3838d1e20acf66cd8ba5e，4,116,389,041 字节。原文件保留不改。
- Node v26.12.1；protobufjs 8.8.1 已安装并写入锁文件，无需重复下载依赖。
- 已实现 SDK 登录/续登、区服列表/首选/单服的真实 HTTP 和 Protobuf、TCP 帧与 challenge 字段工具。
- 最近父 agent 实测 npm test --prefix .\personal-server：54/54 通过（SDK13、区服9、framing17、observer3、handshake5、probe7）；结果 `analysis/experiments/private-server-20261025/p1/components-54-tests.txt`。39项记录仍保留作为上一轮历史；全部属于组件验证，不是 APK 联调。
- 本轮观察器已停止，18880/18881/18882/19090无本项目监听器；设备reverse、本次iptables/ip6tables规则、BPF pin和helper均已清理。实例2 root_permission恢复false并重启，su不可用。新session必须重查。
- 原APK/原安装未替换或重签。已生成独立包com.jzyx.ps的unsigned衍生APK，尚未zipalign/签名/安装；原APK仅在UID本地隔离下启动观察，尚无自有服登录/大厅/战斗证据。

## 2026-10-25 实验检查点

- 指定设备在线，用户0，目标包 `com.jzyx.my`，UID10041，版本 `1.55.090365/362155`；设备与本地 APK SHA256 均为 `b724dfbaa5687ebbfc9ce1b930e9bd88ca74f9b6afc3838d1e20acf66cd8ba5e`。只操作16448；当前目标应用已强制停止。
- 外部数据原始快照19文件/12,043,521B；补拉当前快照21文件/12,072,082B，只有两份新增日志，19个旧文件哈希全部相同。数据库 SHA256 `4d79fdb8d0f725c93f8ed0391197423847cb2687f836e70e52debec8f6af5d41`。
- 前轮隔离用户10实验失败，随后一次推送误把备份写回用户0外部目录；必须保留这项记录。当前数据库与备份哈希一致，私有数据没有被覆盖。不可把那次推送描述为隔离用户数据迁移成功。
- Android `adb backup` 产物0B，不是备份。已用 MuMu 内建可逆 `root_permission` 开关为实例2（info明确ADB16448）启用root并重启；配置已保存在 `p0/recovery-config/`。应用停止后取得 CE/DE 私有数据归档 `p0/backup/private-appdata-user0-20261025.tar`，171,008B；设备与本机SHA256同为 `26cef8458784aae163cd05433fcb6f049a14e959813eaabeb38d6e21e5eab480`。归档含账号信息，不能输出内容或进入公共版本库。
- 收尾已执行：停止目标、移除本次IPv4/IPv6及NAT链和reverse、删除pin/helper，恢复root_permission=false并重启实例2。检查boot_completed=1、su不可用、目标无进程、reverse为空；不能碰实例1或16416。
- 正常启动不选 ServerAddressInternal 的“本地”资产。已确认可用入口是包内 `game_config.json` 的 Host/ListPorts/UpdateAddr/AppDownloadAddr，或包内 `META-INF/acmeis_...` marker；见 `endpoint-selection-direct-dependencies.md`，以隔离包应用这些配置。
- 原签名 SHA1 的 appInfo 解密仍失败；直接依赖已确认没有使用错误的hex/raw-key格式。QuickSDK包内配置已按其实际解密链恢复，外部SDK参数均非空，仅保存在 `p1/config/*.local-only.*`，不可对话输出。SDK实际初始化仍须运行验证。
- 本机 .NET Framework AES harness 已验证 Write后、final-flush前的精确结果；54项测试包含严格challenge/reply和login_sdk探针。但APK/IL2CPP运行时一致性仍未知，探针捕获后不发送未知ETF成功回包。
- 已发现登录模块会按 server_db_ver/新角色时间删除本地角色表；登录成功回包必须在隔离数据副本验收，不能对用户角色试空模块。ETF直接依赖、8个 ahead 模块与24份导出schema见 `lua-bundles/etf-initialization-direct-dependencies.md` 和 `initialization-payload-contracts.md`。
- 目标UID隔离已完成运行验证：iptables内核无owner；第一次BPF load返回EPERM，随后仅对helper进程设置RLIMIT_MEMLOCK=unlimited解决。`uid-bpf-helper-memlock-x86_64`已在16448加载并pin，仅匹配10041；xt_bpf用于IPv4/IPv6 OUTPUT与IPv4 NAT。用su切换目标UID访问本机验证loopback放行/指定端口重定向/其他IPv4和IPv6拒绝，shell UID2000不命中这些规则。所有探针只访问本机、模拟器自身或宿主地址，未探测原服务器。收尾前计数见 `session-close/network-before-cleanup.txt`；这些规则现已清理，不能假定下次仍在。
- 原APK于15:37左右在上述保护下启动。本机 `p1/http-observer-20261025.txt` 的07:37:22.749Z有POST，367B，packageMatchesTarget=true，packageVersionMatchesTarget=true，form MIME；unknown route、501。07:35至07:36三条server_config GET来自主agent curl，不是APK。其他无匹配头GET只能作为启动窗口流量，不能单独证明区服协议。原APK未触发网关。收尾数据库hash仍与原备份相同；当前截图为launcher，不能称为大厅图。
- 隔离构建已成功：`p1/isolated/com.jzyx.ps.unsigned.apk`，4,115,279,336B，SHA256 `8460075131df0b6e01d799c042c7253c316dc4bff986a63a0bd91c10f00e363e`。`tools/build-isolated-apk.ps1`与 `tools/IsolatedApkBuilder/Program.cs`保留复现工具；patch-manifest记录11904个原样成员、2个改动成员、3个移除签名成员，逐成员hash/compression校验及aapt2解码通过。精确修改10个AXML字符串，7个provider authorities全部唯一，Java类名保留。无acmeis marker。`.failed-ziparchive-method.apk`是首轮失败衍生物，禁止签名安装；不必重建成功产物。

下一检查点：对现有成功unsigned包做zipalign、本机独立测试证书签名及验证，旁路安装com.jzyx.ps，取得其实际UID；为该UID重新生成BPF helper并挂IPv4/IPv6保护（不能复用匹配10041的二进制），运行本机服务并启动隔离包。优先恢复其实际SDK/更新请求直接依赖，再验证二进制区服响应；P1整体仍未验收。详细收尾记录和可执行顺序见promot提示词及 `session-close/status.json`。

## 后续顺序与验收

### P0：确认设备和建立可恢复实验环境

先运行基线测试，再连接 127.0.0.1:16448 并检查设备/包版本、当前界面、已有日志。所有采集限定目标应用，不导出无关应用数据或系统凭证。保存基线截图、版本/签名/哈希、恢复步骤与本次实验编号到 analysis/；保留 APK 原始副本和原游戏数据。优先使用隔离客户端/副本；必要时用当前模拟器进行可恢复启停。

验收：记录设备身份、实验客户端身份、备份范围及可恢复办法，明确本次没有碰 16416。

### P1：恢复实际入口配置，证明请求到达自有服务

定向核对启动/更新配置优先级、SDK appId/appKey 获取、appInfo 对签名 SHA-1 的依赖及 server_config.txt；不要再无目的全包搜索或重新拉 4GB APK。选最小、可恢复的入口修改方式，保留修改前后文件和校验值。先支持本机，不需要云服务器。

服务保持绑定 loopback；若使用 adb reverse，命令必须带 16448，保存映射与清理命令。adb reverse 只映射设备本地端口，不能自动改写 APK 内硬编码外网 IP，仍须证明实际目标配置已被控制。屏蔽/重定向范围只限实验客户端，不做全系统网络改动。

验收：本机日志证明来自目标 APK 的 SDK/区服请求确实到达本机；区服响应被客户端接受并显示测试服。不要把自己用 fetch 访问成功当作此验收。日志避免记录密码/token/签名 key。

### P2：网关握手和业务消息编解码

并行可分为：原生握手分支、Lua/ETF 数据分支、入口配置/设备分支。各 agent 写入不同文件，由主 agent 串行执行模拟器和网络改动，避免抢设备。

复核真实连接参数和 AES helper 在最终块 flush 前取输出的行为，使用受控本地实验建立准确字节样本；不得套用标准 PKCS7 猜测。实现 TCP 网关与客户端 verify 回复校验，再用已恢复的 pb_c2s/pb_s2c schema 处理业务消息。验证分帧、粘包、超时、断开和重连；不接受任意认证值。

已知 login_sdk type=909103；外层 type 为 sint32（ZigZag），data 为 PB(login)。首次 seq=1，后续为 curSeq+curSeq%3+1。time_ms 来自 TimeKit.RealtimeSinceStartup，不能擅改为 Unix 毫秒。响应外层 pb_s2c，登录 data 走 ETF。

验收：真实 APK 完成自有网关握手，本机捕获并正确解码其 login_sdk，客户端接受与序号匹配的响应；单独测试脚本通过不等于 APK 通过。

### P3：登录成功与最小大厅状态

只追直接依赖：已恢复TimeKit三个时间参数、模块映射为逐项[id,payload]列表，以及8个ahead模块的位置/PB形状和24份schema；见上述新报告。ETF返回外层仍为[1]=1、[2]时间参数、[3]模块列表、[4]isNewRole。完整一致初始化数据和大厅后续模块仍须实现/验收，不能用任意空表或假成功标记搪塞。优先可信现成ETF库，类型映射以native ei证据为准。

实现自有本地测试账号、最小一致角色状态和持久保存，不使用用户真实第三方账号凭证。未实现命令显式记录并返回已确认格式的错误，不能一律成功。

验收：APK 真正进入自有服大厅，关键模块就绪、无持续报错；重启服务和客户端后可重复登录并恢复测试角色。

### P4：可玩最小闭环

依据客户端实际必需协议实现最小编队/关卡/战斗/结算/背包与持久化；服务端验证请求、一次性奖励和重复结算。先完成一条连贯玩法，再扩充图鉴、养成、圣器/星火，未知机制明确标记。

验收：连续三场 → 结算到账 → 重启存档 → 重复结算不重复发奖。分别保留截图/日志/状态快照，不以源码存在替代可玩验收。

### P5：自有远端部署（在本地闭环之后）

待获得用户服务器信息和明确部署范围后，再制作可复现部署、独立配置/密钥、日志和持久库备份；只开放必要端口，客户端配置指向自有地址。不提前购买云资源或公开服务。

## 已知陷阱

- SDK 签名会去掉 ASCII 空格；区服签名保留空格，二者不可混用。区服签名对原 params 而非 method/json/sign 外层计算。
- 区服回包直接 protobuf，不是 gzip/ETF；游戏登录内部回包才走 ETF。
- login_server_state 的响应仍未确认，当前明确 501。
- PE 变换正确边界为 129..254 XOR 偏移低字节、255..1000 XOR 0x80，>=1001 不变。旧 rea-boot-evidence.json 已作废；使用 corrected 证据和哈希。
- 当前 REA/JADX 能力见已有报告；优先现成静态解析器和 Mono.Cecil，不反复安装/改 MCP，不把当前没有的工具写成已运行。
- Unity 工程与原始资源不改；不将原游戏资产打包发布。

## 给新 session 的提示词

继续 F:\projects\FateCovenantClone 的“现有 APK 接入自有兼容服务器”任务。先读 AGENTS.md、docs/06-personal-server-handoff.md、analysis/notes/07-private-client-feasibility.md、personal-server/README.md，再读登录/原生网络的分支证据。不要回到旧 Unity 复刻路线。

我已停止玩游戏，明确允许你在 127.0.0.1:16448（com.jzyx.my）做本项目所需的可恢复运行实验、应用启停、日志/截图、测试客户端及本机服务联调；这替代旧的“用户在玩、仅离线分析”限制。可以多 agent 并行，但主 agent 统一操作模拟器。保留原 APK 和应用数据，先备份，优先隔离测试副本，不删除唯一数据。常规已授权步骤直接执行，无需重复询问。所有实验只针对本机/自有服务，不连接或破解原服务器。

当前54/54组件测试通过；已备份、验证UID网络隔离、构建unsigned隔离APK，并观察到一条匹配包名版本的unknown HTTP POST到本机，尚未区服/SDK验收。以 `promot/2026-10-25-personal-server-next-session.md` 的最新续接顺序为准，从隔离包签名/安装及其新UID保护继续，接着P1区服、P2网关/login_sdk、P3 ETF/大厅与玩法闭环。先复跑测试再查ADB，所有设备命令显式-s 127.0.0.1:16448。不得重拉4GB原包、替换原安装或重复全包分析。未知只追直接依赖，不猜成功回包；每里程碑保留analysis证据。
