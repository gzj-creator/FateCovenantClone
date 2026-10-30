# FateCovenantClone 项目记忆

## 工作目录

- 项目根目录：`F:\projects\FateCovenantClone`
- 文档：`docs/`
- 分析证据：`analysis/`
- Unity 工程：`unity/`
- APK 快照：`apk/`（仅本地保存，不提交 Git；说明见 `apk/README.md`）

## APK 快照规则（持久）

每次涉及 APK 的修改，验收通过后必须把当前可用 APK 同步一份到项目 `apk/` 目录，并在 `apk/README.md` 记录文件名、大小、SHA256、包名/版本、来源、验收证据和已知前置条件（例如 PlayerPrefs）。APK 文件不提交 Git；只提交文档。未验收或仅组件测试通过的构建不得标为“可用快照”。

## 当前目标

2026-10-28 当前快照（覆盖下方旧状态）：主界面看板娘缺失已定位并实测修复。根因不是资源缺失，而是隔离客户端 PlayerPrefs 中 SubDownloadFinish=0 时，UniCore.RemoteLoadMgr.NeedRemoteLoad 将 sub_first 资源误判为远程下载；UpdateDownloader.AsyncAssetLackPreCheck 为空，AddRemoteLoad 报错，AssetBundle 请求未创建并在 6000 帧后超时，最终报 hero_sl_GuangZhiXin_new_talk.prefab load fail by bundle load timeOut 和 [MissAsset]。已在 /data/data/com.jzyx.ps/shared_prefs/com.jzyx.ps.v2.playerprefs.xml 写入 SubDownloadFinish=1 并重启，截图 analysis/experiments/private-server-20261025/p3/kanban-after-subdownload-20261028.png 确认看板娘恢复；修复后 Info 日志无 AddRemoteLoad/timeout/MissAsset。该值未烘焙进 APK，重装/清数据/换设备后需重新写入。当前可用 APK 快照已保存到 apk/com.jzyx.ps.v8b-working.apk（4,116,360,373 字节，SHA256 c33a192cd875fd9cda8e5a25104d49d5b2d4b5325056380efc53dc96de1ef3cf），仅本地保存、不提交 Git，说明见 apk/README.md。设备 ADB 使用 E:\Mumu\MuMuPlayer\nx_main\adb.exe -s 127.0.0.1:16448；原版 com.jzyx.my 未操作。服务实时状态以 p3/runtime.local-only.data/server.local-only.json 为准（本轮核对五端口 18880/18881/18882/18883/19090 均在 loopback 监听）。详见 agent/workflow/client-resource/implementation.md。

2026-10-25 23:59本session交接：接替提示词promot/2026-10-25-wallet-admin-handoff.md。实时服务PID1776、隔离客户端10836（须重新核对），五端口loopback、UID10042隔离及四项reverse保持，用户继续游玩，不启停/点击/清理。最新真实APK23:56:07手机号注册/QuickSDK/userStatus成功、23:56:08网关登录；23:56:32/33/34领取79104 act13016 task55021/55022/55023全部提交，SQLite三条activity_claims、module92领取位AAAH；钻石60、冲榜积分60。尚无用户口头视觉确认，游戏充值仍未实测。Web管理http://127.0.0.1:18883/，密钥在runtime.local-only.data/admin-key.local-only.txt，用户自行加余额；当前余额0/订单0/38个支持商品。92/92测试通过。handoff-game.local-only.sqlite一致备份和handoff-acceptance.local-only.json已保存，完整性ok。下轮优先用户加款→普通6元钻石充值→1900/16003/SQLite验收。原版不操作，所有ADB16448，不派子agent。

2026-10-25 23:54登录修复：新版用户“注册并登录”网络错误实际为SDK/user/phoneRegist未实现404，已按DEX证据补全仅localTestOtp模式的手机号注册兼容，签名和4位验证码校验、登录原local-1、不改密码/存档。92/92测试通过，部署后HTTP注册和token验证200；服务PID1776实时状态为准，未重开客户端，用户需再点注册登录。此处填写密码只是SDK表单，不是设置新账户密码；普通账号localtest/Local2026!是另一入口。详见wallet-admin/implementation.md最新段。

2026-10-25 23:44最新覆盖下方排行榜未实现：用户已验冲榜详情可打开。Web管理页http://127.0.0.1:18883/已部署，账户local-1/19900000000余额初始0；管理加款、余额购买、订单流水以及79104任务领奖落SQLite，四新表幂等创建、保留user_version2和全部养成/编队，原九类表逐表无变化。91/91组件通过，含SDK购买签名/会话/余额、事务回滚、防重、真实TCP1900/16003及管理页面桌面/手机操作。v8b隔离APK使用原签名安装-r成功并重开；SDK支付走本机余额，真实APK充值/领奖待用户验证。管理密钥在p3/runtime.local-only.data/admin-key.local-only.txt，勿输出；浏览器自动打开被策略拒绝，用户手动URL+密钥。服务PID35132须实时读取server.local-only.json，五端口18880/18881/18882/18883/19090均loopback。原版未操作，UID10042隔离/reverse保持，仅ADB16448。冲榜截图巅峰对决对应55021等Tournament任务，module150已有今日96名；Hunter module121无排名，不得伪造。2000/2008/2011为空榜读接口，最终结算/复杂商品/战斗/招募仍未做。详见agent/workflow/wallet-admin/implementation.md、activity-ranking/implementation.md和p3/wallet-admin-20261025/证据。

2026-10-25 22:14最新覆盖下方待验/小队未实现：用户确认“小队能进，升级升星正常”。真实APK209/208编队及639/636养成均提交，SQLite实际英雄2020601升9级、格子4同步、经验7870→7470；2020601和1020601各升3段进度，对应碎片各30→0。新增game/lineup-service.mjs支持208/209/218，版本DEFAULT0/AFK1；修复module9外层pb_lineup_login嵌套pre_lineup解析，SQLite user_version2、play_lineups新表，迁移仅修编队不覆写养成。75/75测试通过。突破638/满6段进整星仅组件验证；战斗/招募/排行榜2011/5星后试炼仍未实现。服务PID38232（须读实时状态），隔离客户端/UID10042网络隔离和reverse保持运行，原版未操作，仅ADB -s 127.0.0.1:16448。详见agent/workflow/gameplay-state/implementation.md；一致备份与用户验收证据p3/lineup-fix-20261025-221137/。

2026-10-25 22:05最新养成/存储更新覆盖下方“养成未实现”：升级636、突破638、普通升星639已实现并部署；游戏状态落SQLite（p3/runtime.local-only.data/game.local-only.sqlite），角色/英雄/格子/资源/编队/引导/模块快照分表，旧JSON备份一次迁移。代码拆personal-server/game、storage、protocol、config，根入口兼容保留。72/72组件测试通过，含本机TCP、事务异常/编码异常/实际SQLite写入拒绝回滚及重开数据库；APK养成操作待用户反馈，不能称可玩验收。5星后试炼未实现，639不能跳过；战斗/招募/编队208/209等缺口仍在。服务已重启PID37780，隔离客户端com.jzyx.ps重开PID7279，均须实时读取；SDK会话内存、服务重启需任意4位验证码重登。原版未操作；仅ADB -s 127.0.0.1:16448。服务四端口loopback、UID10042隔离/reverse保持供用户验证。细节agent/workflow/gameplay-state/implementation.md，迁移前证据p3/progression-sqlite-20261025-220257/。

2026-10-25 21:31最新状态覆盖下方采集中/root=false/v2未登录旧描述：原版被动采集已停止（r2a1887包、0丢包、224/224即时游戏负载解码，两轮480条）；用户现已切换为个人服务器联调。隔离APK v7 com.jzyx.ps/UID10042已登录本机服并显示Local Adventurer大厅，用户确认与截图一致。手机号任意4位验证码仅本机测试、不发短信；第二层QuickSDK大写MD5与8字节DES配置已修复，/user/userStatus使用Lua独立平台签名及有效本机会话。21:29:07 SDK/status/区服preferred_login_servers均200，21:29:09真实APK握手接受、909103响应146条原始模块记录（145去重模块）并进入大厅。63/63组件测试通过。服务18008、客户端6323当时运行；四端口18880/18881/18882/19090仅loopback，root=true及UID10042隔离/reverse保留供用户验证，不擅自Stop或清理。原版com.jzyx.my停止且未替换。仅ADB -s 127.0.0.1:16448。大厅是离线采集结构fixture+本机身份，不是完整独立后端；type208/209编队、2011排行榜当前返回LOCAL_NOT_IMPLEMENTED；战斗/招募/养成未实现，活动倒计时异常且首充入口资源uires/pic_sc_susu02.bundle报错。不可将显示大厅等同全部功能可玩。证据与复现：agent/workflow/sdk-login/implementation.md、login-initialization/implementation.md；服务状态每次操作前实时读取server.local-only.json，不把本段PID当永久值。

2026-10-25 19:33采样更新：用户进入招募并询问是否全点，已明确不需要穷举；单次“指定招募冒险者→完成选择”实际触发draw_hero type601/seq69，req game:tcp-69:c2s:2646/1604,1606包，rsp s2c:39307/1608包，PB请求/回包解码并操作关联；不能记为单独保存心愿选择。返回招募库与请求匹配，资源一负一正，后截图为R星之子展示；资源extra/目标映射/抽数枚举/保底与持久化仍未验。新轮1619包/0丢包、160/160游戏负载解码；两轮合并4174包/416条，HTTP19/12/3、命令24/24/7、push4/4/0，另4控制。详见capture-workflow/recruitment.md和r2a/recruitment-check.json。采集仍运行PID4467/4488、root=true；允许用户正常跳过展示继续引导，不要求所有招募项点一遍；不得agent点击/启停/改路由。

2026-10-25 19:27续接更新：用户暂停后授权重开并自行登录，新录制analysis/captures/protocol-2026-10-25-r2a/正在采集，PID4467/4488，root设置true且su UID0已验证；仅设备16448。一次暂停边界重启使root生效；新UID限定IPv4/IPv6被动规则自检6包/0丢包，不改路由。用户误登账号后明确要求再次重开，tcp-29为误登账号，tcp-69为其后正确账号；用户已确认正确账号大厅+20秒静置，不跨账号比较状态。当前1249包/0丢包，64/64即时游戏负载解码，正确账号99/46字节握手及登录return1通过。多轮namespace合并已实现，合并两轮3804包/320条游戏消息、1760接口，旧轮目录和PCAP哈希保持不变；目录schemaVersion2，注册表analysis/tools/protocol/recordings.json。当前用户恢复游玩，只被动观察，不启停/点击/改路由；等待新功能反馈。暂停/结束时Stop必须显式指定r2a目录，不能使用旧默认目录。详情agent/workflow/capture-workflow/second-recording.md和multiple-recordings.md；本段覆盖下方“采集已停/root=false”的旧轮收尾。

2026-10-25 19:10本轮已按用户要求保存总结并交接：采集已停止，原版游戏保持运行，未重启。最终2555包、0内核丢包、256/256即时游戏负载解码；实观HTTP19/命令20/push4，已解码接口HTTP12/命令20/push4，操作验证HTTP3/命令6，另4传输控制。完整目录1760项（静态1742+实观新增HTTP14+控制4）。root设置false读回确认，su已不可用；4216/4237采集PID消失，reverse空。本次准确规则/pin/helper删除命令均成功，关root后未重复特权读规则；已有conntrack标记随连接过期，不改路由。证据analysis/captures/protocol-2026-10-25/cleanup-verification.json。最新接替提示词promot/2026-10-25-protocol-capture-handoff.md；本段覆盖下方所有“采集仍运行/root=true”的历史描述。下一轮先核对用户是否在玩，不能直接对已清理的旧目录Checkpoint或Start。新录制用新目录；现目录生成器只合并单份runtime，需先扩展带recording namespace的多轮合并，避免新session覆盖旧动态覆盖及flow/message ID碰撞。用户负责游玩，继续被动观察、不主动请求/重放原服，功能随引导逐步解锁。

2026-10-25 19:05采样更新：用户完成一次突破type638/seq97（ETF→pb_hero_break_ret），确认同一英雄breakthrough_level较登录基线+1、其他hero字段保留，资源两条负增量；随后单击升级type636/seq102（pb_hero_up_lv_req→pb_hero_up_lv_ret），请求2494/2496包、回包2498包。当前2517包checkpoint、248/248即时游戏负载解码、丢包0；目录实观HTTP19/命令20/push4，操作验证HTTP3/命令6，另4传输控制。状态细节见capture-workflow/hero-progression.md，完整战斗动作/嵌套结算/全部登录模块仍未完整解码。用户仍正常游玩，保持采集直到明确暂停/结束，避免每场普通战斗都要求停顿；新功能按单次操作关联。其余快照记录保留。

2026-10-25 动态目录检查点：agent/workflow/interface-catalog/已生成README、interfaces.json、HTTP/TCP/推送目录和coverage.md。静态HTTP28+C2S1407+push307；当前实观HTTP19/命令16/推送4，另列4项传输控制；121/121即时游戏负载已解码，1903包checkpoint无丢包/游戏缺口。用户手动完成seq37 req_edit_pre_lineup(type209)第三位上阵，内部比较原2条保留+新增1条、回包匹配；第二场fight_start seq40与settlement seq42完整标记并验证，队伍3人。type208初始化自动流量不能算手动操作。用户要求后续功能慢慢解锁，当前等待本场结算确认后的新功能反馈。采集仍在运行，不结束/清理，直到用户暂停或结束；以capture-state.json和目录snapshot为准。新细节见capture-workflow/battle-and-lineup.md；codec离线27项测试通过。公开shape不含动态字典key或scalar内容，完整值只存.local-only.json；messageId已改flow+direction+offset避免追加数据重编号。

2026-10-25 协议采集新检查点：原版 com.jzyx.my/UID10041 已由用户登录进入大厅并静置20秒。真实99字节challenge与46字节reply的AES/flags验证通过，当前3个包加密/签名开关全false；login_sdk type909103/seq1的PB请求和ETF四元组响应(code1)已解码，checkpoint内29/29游戏消息负载解码，tcpdump丢包0。首次点击登录因LocalData.db和三份日志归属shell导致只读异常，已备份后仅修正这4个文件owner/context，修复前后DB hash与旧基线相同；用户自行关闭后agent按明确授权重开。详见agent/workflow/capture-workflow/login-decode.md、storage-repair.md。当前原版用户正在游玩，UID限定NFLOG组42与目标logcat仍运行，root=true；不得agent点击/停应用/重启/改路由。capture-state.json保留本次PID和规则；结束时用analysis/tools/protocol-capture.ps1 -Action Stop保存/清理并恢复root设置false，不重启用户游戏。当前数据在analysis/captures/protocol-2026-10-25/，全部原始敏感产物.local-only.*。下方隔离私服APK未验收结论仍有效，原服被动成功不等于隔离包已接入自有服。

最新用户要求已生成下个agent的抓包提示词：`promot/2026-10-25-protocol-capture-next-agent.md`。用户配合顺序：`agent/workflow/capture-workflow/player-checklist.md`。先采首次登录并验证可解码，再逐模块用户操作；目标输出HTTP/TCP/推送统一接口目录及覆盖表到 `agent/workflow/interface-catalog/`，区分静态声明、实际观察、已解码、操作验证；不承诺一次游玩覆盖全部。用户手动正常通信仅被动观察，agent不主动请求或重放原服，用户游玩时不点击/停应用/改路由。

2026-10-25 本session最新检查点覆盖下方旧收尾：隔离包v2已对齐/独立签名/安装com.jzyx.ps，UID10042；首版资源表包名不一致导致Unity资源ID0崩溃，v2同步resources.arsc包名后修复。APK已实测采用127.0.0.1配置，接受本地version_adr.txt并进入SDK登录页；QuickSDK初始化成功，但账号登录/区服/网关/大厅未验收。先前unknown POST已确认为/sdk/tracker/log埋点。组件60/60通过（新增启动2项、包加密4项），握手/可选packet AES跨语言对照通过但APK真实握手仍待验；tcpdump本机PCAP采集回放自测通过。证据在analysis/experiments/private-server-20261025/p2/，最新文档在agent/workflow/README.md。用户最新顺序：先搞清楚接口之外的接入、配置、签名、编码、加密和采集前置，再由用户操作、agent关联接口；不自动操控用户正在玩的界面。原包和数据保留，原LocalData.db hash仍一致。本轮规则/reverse/监听已清理，root=false并重启，隔离包停止。

2026-10-25 本轮已按用户要求保存并收尾；下一session提示词在 `promot/2026-10-25-personal-server-next-session.md`，最新状态为 `docs/06-personal-server-handoff.md` 与 `analysis/experiments/private-server-20261025/session-close/status.json`。当前54项组件通过，备份和UID网络隔离已验证，隔离包com.jzyx.ps的unsigned APK已构建但未签名/安装。原APK有unknown HTTP POST到本机，尚无区服接受、登录/大厅/战斗验收。设备16448已停止应用、清理本次规则/reverse/pin/服务、恢复root=false并重启。下面39项是旧基线，续接以54项和最新记录为准。

2026-10-25 用户已将本轮工作切换为现有 APK 的个人服务器兼容分析；只有 APK，没有配套后端，已授权多 agent。最新用户已停止玩并明确允许在 127.0.0.1:16448（com.jzyx.my）做可恢复运行实验、应用启停、日志/截图、测试客户端与本机服务联调；旧“用户正在玩、只能离线分析”限制已被取代，无需重复申请常规操作授权。先保留原 APK、备份应用数据，优先隔离测试副本，不删除唯一数据；仅对本机/自有服务实验。主 agent 统一操作设备避免并行冲突。所有本轮 ADB 命令必须 -s 127.0.0.1:16448，覆盖后文旧路线的16416默认约定。进度/续接：docs/06-personal-server-handoff.md、analysis/notes/07-private-client-feasibility.md、personal-server/README.md。静态契约和39项组件测试不等于APK接入或可玩。以下Unity路线保留，本轮不继续其安装/构建。

复刻《命运圣契》的可玩核心循环，先完成 3D 小队战斗纵向切片，再做内容和美术扩展。原游戏只作本地分析对象，最终构建使用自制或已获授权的资产。

用户优先级：建模、特效、玩法机制；剧情可以直接跳过。

2026-10-25 已制定完整开发路线：`docs/04-system-roadmap.md`。范围包含战斗、角色图鉴、完整技能、基础养成、普通装备、圣器、星火，以及后续天极角色和法阵；专属武器系统延期，角色手持武器基础模型仍属角色美术。
用户将准备已解锁功能的成品号，届时通过正常界面与战斗验证后期规则；不继续依赖新手号逐级解锁。先做 R0 至 R2 的 Unity/3D 战斗/图鉴与存档闭环，不等待成品号或全角色资料。天极与法阵具体规则尚未确认，不能写成已知机制。

## 设备连接

MuMu 模拟器通过本机 ADB 端口连接：

```text
serial: 127.0.0.1:16416
```

连接命令：

```powershell
adb connect 127.0.0.1:16416
adb devices -l
```

已确认的设备信息：

- 型号：`V2185A`
- 产品：`PD2185`
- Android：`12`，API `32`
- ABI：主 ABI `x86_64`，兼容列表包含 `arm64-v8a`
- 分辨率：`1440x2560`
- 密度：`360`
- ADB：`C:\Users\gzj\AppData\Local\Android\Sdk\platform-tools\adb.exe`
- ADB 版本：`37.0.1-15733141`

## 目标应用

```text
package: com.woobest.mysq.yofun.mumu
versionName: 1.55.090365
versionCode: 362155
installer: server-file-mumu-app-store
```

base APK 已拉取到：

```text
analysis/apk/device-pull-01/com.woobest.mysq.yofun.mumu/base.apk
sha256: 43e304cb118d8cdbd3f8dbfb2881f0a48988adf402c528c95011ec6f35dcf476
```

已确认引擎：团结引擎（Tuanjie）+ IL2CPP，元数据版本 29，并带独立的 Lua 脚本包。

## 工具链事实

- Unity 编辑器版本固定 `6000.0.85f1`，URP `17.0.4`；Android IL2CPP 和 ARM64 已写入 Setup 源码，尚未构建/设备验证。
- Node.js `v26.12.1`。
- npm `11.14.1`。
- Microsoft OpenJDK `21.0.12.1`。
- `JAVA_HOME`：`C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot`。
- REA 源码：`F:\github\rea-main\rea-main`，版本 `6.7.0`。
- REA skill：`.agents/skills/reverse-engineer-anything`。
- REA MCP 配置：`.codex/config.toml`。
- REA 已验证 ADB 可访问；REA MCP 的 `open_binary` 受 Codex 审批策略限制，静态清单改用只读 PowerShell/ZIP 脚本。
- 旧 Hub 记录的 `D:/Software/2022.3.62f3c1/Editor/Unity.exe` 和 Hub 可执行路径均失效，不能当作可用编辑器。官方 Unity `6000.0.85f1` 元数据已核实；本机尚无匹配编辑器运行成功的证据。官方默认下载域在当前网络出现地区重定向后 404，下载/安装最终状态见 `docs/05-development-status.md`。
- 工具链入口：`tools/install-unity-toolchain.ps1` 下载/安装；`tools/unity-project.ps1` 提供 Discover/Setup/Test/Smoke/BuildAndroid/BuildWindows。不要把脚本已存在等同执行通过。

## 操作约定

- 每完成一项大工作，立即将实操步骤、复现命令、验证证据、验收结果与遗留问题写入 `agent/workflow/{大任务节点}/细节文档.md`；客户端改址、SDK登录、网关握手、登录初始化数据及玩法状态分别沉淀。明确区分组件测试、APK实测与可玩验收，未验收不得记为完成。
- 当前个人服务器任务先完成隔离客户端接入自有服并登录进入大厅，再推进战斗与持久化闭环。用户要求尽量节省token，复用已有证据，交流简洁。
- 最新执行顺序为先核实非业务前置和采集工具，再由用户游玩触发业务接口供agent记录。实际登录/握手/回包接受不能仅凭静态分析称已确认；用户游玩期间不由agent启停、点击或更改路由。

- 使用 PowerShell，不用 CMD 作为主要终端。
- ADB 命令必须带设备序列号 `-s 127.0.0.1:16416`，避免多设备歧义。
- 截图、视频、日志和分析产物保存到 `analysis/`。
- 未经证据确认的游戏行为标记为假设。
- 不把原游戏资源打包到最终 APK。
- 不连接或破解原游戏服务器。

## 当前阶段

已完成首轮游戏侦察、正常战斗录像、APK 拉取、引擎识别，以及 R0–R2 原型源码：工程版本/包清单、确定性战斗、图鉴/编队/独立固定关卡页/奖励/存档、程序化 Unity 表现与 RuntimeSmoke。战斗 37 项断言、本地循环 8 个独立 C# 场景及三个运行程序集的 Unity 2022 Player API 兼容编译已通过；Unity 6 导入/编译/画面、Smoke 实际运行、Android APK 和设备闭环均未验收。R0、R1、R2 不能标记阶段完成。

先读 `docs/05-development-status.md`，取得并核实匹配 Unity 与 Android 模块，执行 Discover → Setup → Test → Smoke，审阅截图/运行报告，再 BuildAndroid → MuMu 安装启动 → 连续三场与重启存档验证。不等待成品号。程序化关节模型和基础动作只是占位表现，正式建模/绑定/动画/特效仍需制作。

当前伤害沿用项目自定 `max(1, round(attack*2.6)-floor(defense*0.5))` 基础公式，非原游戏事实；已实现伤害/治疗/护盾，没有嘲讽、加攻、完整被动、天极或法阵机制。存档为版本 1 的 `profile.fcsave` 记录格式，含校验、临时写入、备份/中断恢复、战斗票据与一次性奖励，不是旧方案的 JSON。

运行编译入口：`tools/check-unity-runtime-compile.ps1 -ManagedPath <真实 Player 的 Managed 目录>`，当前引用来自 `F:/projects/Unity-Project/StarfallChronicle/Builds/StarfallChronicle_Data/Managed` 的 Unity `2022.3.62f3c1` Player；报告在 `analysis/test-runs/runtime-compile/`。该检查不包含 Editor 源码，不替代 Unity 6 或视觉验收。RuntimeSmoke 已有隔离存档/报告/截图、三场普通/倍速/跳过、最终事件状态与 16:9/20:9 界面/相机检查，尚未运行。

当前资产来源为项目原创程序几何、原创关节模型/动作、原创合成音效和 Unity 随附 `LegacyRuntime.ttf`；未导入原游戏资产。正式角色建模、材质、绑定、动画、头像与技能特效仍待制作和验收；来源清单见 `docs/05-development-status.md`。

## 当前证据入口

- `analysis/notes/02-battle-evidence.md`：战斗、镜头、特效和界面观察。
- `analysis/notes/03-static-inventory.md`：APK、IL2CPP 与 Lua 包事实及哈希。
- `analysis/notes/04-onboarding-system.md`：新手引导、功能解锁、招募展示与七日指引观察。
- `analysis/notes/05-startup-and-ui-flow.md`：启动公告、登录入口、加载、大厅、界面证据索引和续接位置。
- `analysis/notes/06-relic-and-star.md`：圣器获得、上阵、星火激活证据，以及旧会话摘要纠错。
- `docs/05-development-status.md`：工程开发续接、源码/测试/运行验收分界、当前工具链状态。

## 侦察续接检查点

- 已完成首次招募；招募券从 1 到 0，获得薇尔，已跳过后续剧情。
- 2026-10-25 已续接会话 `01a16e92-ab2d-7a21-a268-48b9996fdea5`：3-4 已通关，团长 12 级；史诗输出圣器破晓法杖已获得并确认放入第一出场槽；已执行星火激活，蓝色材料变为 0/1。
- 最新核对截图：`analysis/captures/094-continue-journey.png`，第 3 章第 5 关地图，“摆脱追兵”，体力 175/160，挑战消耗 x5，主线 3-4 任务已达成。
- 当前界面没有明确手势高亮。后续先查看实时截图，再按明确高亮/手势推进；剧情允许跳过，不随意点击其他功能。
- 旧会话摘要有误：067 为升级预告，不是灵装解锁；069 为演出，不是确认弹窗；070 为剧情，不是跳过结算。以截图及 `06-relic-and-star.md` 为准。
- 圣器战斗释放、编队、角色升级、装备强化与铭刻尚未完整实测；招募动画只有截图。圣器唤醒连续视频为 `analysis/captures/relic-02-awaken-tap.mp4`；`battle-04-relic-guide.mp4` 只录到地图，不是战斗。
- `docs/03-first-slice-spec.md`：首版战斗规则和表现验收标准。
- `analysis/captures/battle-02.mp4`：第 3-3 关正常战斗与结算，60 秒。
- `unity/FateCovenantClone/Assets/Scripts/Battle/Domain/`：已通过的纯 C# 战斗内核。
- 验证命令：`powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\run-battle-core-tests.ps1`。
- 本地循环验证：`powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\run-game-core-tests.ps1`；当前工程开发优先，以上新手号检查点仅用于将来需要时续接侦察。
