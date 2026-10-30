# 现有 APK 接入自有兼容服务器：下一 Session 提示词

## 17:13 最新状态，覆盖下文旧 unsigned/54 项记录

先读 `agent/workflow/README.md` 与 `agent/workflow/protocol-prerequisites/implementation.md`。用户要求先核实配置、改址、签名、编码、加密和采集基础，再由用户操作供agent关联业务接口；每项大工作完成立即沉淀 `agent/workflow/{节点}/`，尽量节省token。

本session已完成：v2隔离包签名/对齐/安装com.jzyx.ps，UID10042；同步resources.arsc包名修复首版Unity资源ID0崩溃；APK已采用本机地址、接受本地version_adr.txt、QuickSDK初始化成功并进入手机号SDK登录页。真正账号登录/区服/网关/大厅未验收。此前unknown POST已确认为/sdk/tracker/log埋点。

使用 `p2/isolated-v2/com.jzyx.ps.signed.apk`，SHA25685c2a01c5383d9e0346a7de53f921d8a617e366ffe39294209579306aa2b66c1，禁止重新安装p1首版。签名身份在p1/isolated/*.local-only.*，更新时复用。构建器、签名脚本及实操见工作流client-endpoint。

60/60组件通过；可选packet AES与C#向量对照通过，尚未在实际APK握手后验收；tcpdump本机PCAP采集/回放自测通过，未抓原服务业务。最终设备root=false、实例2已重启，隔离包停止，规则/reverse/监听清理。原应用未改、原数据库hash仍一致。最新证据 `analysis/experiments/private-server-20261025/p2/`。后续按实际用户操作开始登录采集，先验证真实握手和会话字段，不宣称全部前置APK验收完成。

继续 `F:\projects\FateCovenantClone` 的现有 APK 兼容服务器任务，实际实现并验证，不要回到旧Unity复刻路线，不要只给计划。上一session已按我的要求保存和收尾。

## 授权和边界

我已停止玩游戏，允许在模拟器 `127.0.0.1:16448`、原应用 `com.jzyx.my` 及本项目隔离测试包 `com.jzyx.ps` 上做可恢复实验、启停、日志/截图和本机联调。常规已授权步骤直接执行，无需重复询问。保留原APK和应用数据，优先隔离副本，不卸载/覆盖原安装、不清除唯一数据。只对本机/自有服务实验，不连接或破解原服务器。多agent可并行，但主agent独占设备。所有ADB命令必须显式 `-s 127.0.0.1:16448`；禁止混用16416。PowerShell为主。

## 先读

1. `AGENTS.md`
2. `docs/06-personal-server-handoff.md`，以其中最新实验检查点为准。
3. `analysis/notes/07-private-client-feasibility.md`
4. `personal-server/README.md`
5. `analysis/experiments/private-server-20261025/session-close/status.json`
6. 继续二进制分析前读 `.agents/skills/reverse-engineer-anything/SKILL.md`，使用已有证据/工具，不重新安装或反复修复MCP。

然后按需要只读直接依赖：

- `analysis/reports/private-client-16448/endpoint-selection-direct-dependencies.md`
- `analysis/reports/private-client-16448/android-login/sdk-config-direct-evidence.md`、`README.md`、`sdk-login-contract.json`
- `analysis/reports/private-client-16448/lua-bundles/login-http-contract.md`
- `analysis/reports/private-client-16448/native-loading/findings.md`
- `analysis/reports/private-client-16448/per-uid-bpf-local-routing.md`，注意其最初静态结果已被session-close中的运行成功记录更新。
- `analysis/reports/private-client-16448/handshake-aes-harness/README.md`
- `analysis/reports/private-client-16448/gateway-probe/README.md`
- `analysis/reports/private-client-16448/lua-bundles/etf-initialization-direct-dependencies.md`
- `analysis/reports/private-client-16448/lua-bundles/initialization-payload-contracts.md`

## 已完成和未完成

- 统一组件测试54/54通过：SDK13、区服9、分帧17、首帧观察3、握手5、网关probe7。先运行 `npm test --prefix .\personal-server`，再检查ADB。不要把组件测试当APK验收。
- 原APK本地文件 `analysis/apk/device-pull-16448/com.jzyx.my/base.apk`，4,116,389,041B，SHA256 `b724dfbaa5687ebbfc9ce1b930e9bd88ca74f9b6afc3838d1e20acf66cd8ba5e`。设备SHA256曾复核一致。无需重拉4GB或重复全包分析。
- 已恢复包内 `game_config.json` 的Host/ListPorts/UpdateAddr/AppDownloadAddr覆盖入口。正常Formal启动不会选择ServerAddressInternal的“本地”条目，不能因该资产存在宣称可直接选本地。
- SDK appInfo按当前证书解密确实失败；initSDK可回退initExternal。QuickSDK配置已按实际DEX解密链成功恢复26字段，参数均非空。原值只在 `analysis/experiments/private-server-20261025/p1/config/quicksdk.local-only.json` / XML，已gitignore，不要对话或日志输出key/token/密码。初始化选择onepass，尚未真实SDK登录验收。
- 严格AESprofile和网关probe已实现。C#本机harness证实16B输入Write后final-flush前输出16B，而finalized是32B；尚未证明APK/IL2CPP完全一致。probe只捕获脱敏login_sdk后停止，不发送猜测ETF。
- 已恢复ETF类型映射、三个时间参数、模块列表[id,payload]和8个ahead模块形状；24份protobuf schema及import验证通过。仍没有合法完整登录状态、ETF业务返回、大厅、战斗、结算或持久化实现。未知协议只追直接依赖，不猜空表或假成功。
- 原APK曾在UID10041的本机隔离保护下启动。本机观察日志 `p1/http-observer-20261025.txt` 于07:37:22.749Z收到367B POST，包名/版本头匹配目标，但route=unknown，返回501。它证明有APK请求到达本机，不证明SDK/区服已接受。07:35至07:36的三条server_config GET是主agent curl测试，不是APK。

## 现有隔离 APK，直接继续使用

成功产物：`analysis/experiments/private-server-20261025/p1/isolated/com.jzyx.ps.unsigned.apk`

- 4,115,279,336B，SHA256 `8460075131df0b6e01d799c042c7253c316dc4bff986a63a0bd91c10f00e363e`。
- 已改10处精确AXML字符串：package、7个provider authorities、2个wxapi aliases；Java类名保持原样。
- game_config加本机端点，所有11904个保留成员内容hash和压缩method逐一复核，2个成员patched、3个签名成员移除。没有acmeis marker覆盖。
- `patch-manifest.json`、`builder-source-identity.json`、`manifest-decoded.txt`在同目录。工具 `tools/build-isolated-apk.ps1` / `tools/IsolatedApkBuilder/Program.cs` 已存在。
- 尚未zipalign、签名、安装或启动。使用独立本机测试证书，旁路安装，不替换com.jzyx.my。
- `com.jzyx.ps.failed-ziparchive-method.apk`是首轮失败产物，绝对不要签名安装；不必重建已有成功产物。
- 本机build-tools `C:\Users\gzj\AppData\Local\Android\Sdk\build-tools\36.0.0\`有zipalign/apksigner/aapt2，JDK21可用。

## 备份与风险事实

- 原外部快照 `analysis/experiments/private-server-20261025/p0/backup/external-data/`：19文件/12,043,521B，manifest在p0。
- 当前补拉快照 `p0/backup/external-data-live-20261025-1510/com.jzyx.my/`：21文件/12,072,082B；仅新增2日志，其余19文件hash相同。
- CE/DE私有备份 `p0/backup/private-appdata-user0-20261025.tar`：171,008B，SHA256 `26cef8458784aae163cd05433fcb6f049a14e959813eaabeb38d6e21e5eab480`，设备与本机一致。contains账号信息，不能输出或提交版本库。
- `adb backup`产生的0B文件不是备份。
- 必须保留前轮操作事实：隔离用户10失败后，一次推送误写回用户0外部目录。数据库与原快照hash一致，私有数据未覆盖；不可描述成隔离迁移成功，也不要重复push。
- 收尾外部LocalData.db仍为SHA256 `4d79fdb8d0f725c93f8ed0391197423847cb2687f836e70e52debec8f6af5d41`。
- 登录模块会按server_db_ver变化调用DeleteRoleDataAll，新角色时间分支也会DeleteRoleTable。任何登录成功/大厅数据实验都用独立包和独立数据，不拿原角色试猜测回包。

## 设备已经恢复，重新实验前重建保护

收尾时16448在线，用户0，原APK无进程且force-stopped；隔离包未安装。全部本次host监听器、reverse、FC_P1_*链、BPF pin和设备helper已清理。MuMu实例2 root_permission=false，重启完成，su不可用。实例2已通过MuMuManager info核实就是16448；不要碰实例1/16416。

已验证可恢复网络路径：

1. MuMuManager位于 `E:\Mumu\MuMuPlayer\nx_main\MuMuManager.exe`；`info --vmindex 2`必须先确认adb_port=16448。`setting --vmindex 2 --key root_permission --value true` 后 `control --vmindex 2 restart`，所有ADB仍显式16448。原设置备份在p0/recovery-config。
2. 内核没有iptables owner match，直接 `-m owner`会失败。不要重复此路线。用已有Node生成器 `analysis/tools/build-uid-bpf-helper.mjs` 生成匹配**实际隔离包UID**的socket BPF helper；原10041二进制不能用于新UID。
3. 原BPF load曾EPERM，解决是helper进程先setrlimit(RLIMIT_MEMLOCK,unlimited)。生成器已带此逻辑；成功参考 `p1/uid-bpf-helper-memlock-x86_64`，pin原为 `/sys/fs/bpf/fc_p1_uid`，收尾已删除。
4. `analysis/tools/set-personal-server-network.ps1` 支持 `-Action Protect|Status|Restore -Package com.jzyx.ps -TargetUid <实际UID> -BpfPin /sys/fs/bpf/fc_p1_ps_uid`。先load并pin实际UID的helper，再Protect。默认包/UID是原com.jzyx.my/10041，隔离包必须显式传参。
5. 原UID已运行验证：xt_bpf对IPv4/IPv6 OUTPUT匹配正确，loopback可通，指定IPv4端口NAT REDIRECT至本机，其他外部IPv4/IPv6拒绝，UID2000不受影响。下次为新UID重新做仅本机/宿主/设备自身地址的正反验证，确认两族保护后才启动隔离游戏。不能全系统断网、改全局netd map或原服务器探测。
6. 映射80->18880 SDK观察/服务、10002或3031->18881列表、3033->19090网关、9001->18882更新观察；adb reverse只转本地端口，不自动改写硬编码IP。原守卫脚本的NAT配合BPF限定目标UID；隔离包game_config本身也已指向loopback。
7. 本机服务仅bind127.0.0.1；未知SDK/更新route先metadata分类并501，确认直接依赖后再实现，不能空响应装成功。现有observer仅识别固定routes且package匹配写死com.jzyx.my，支持隔离包时应调整归属判断，避免误判或泄露rawURL/请求体。

## 下一步实际执行顺序

1. 复跑54项测试、检查16448在线/前台/进程/root/reverse/端口，读取成功APK patch manifest。
2. zipalign、独立证书签名、apksigner verify及aapt2核对，旁路安装com.jzyx.ps并停止，取得新UID。原安装保留。
3. 启用可逆root并为该UID生成/加载memlock BPF helper，挂IPv4/IPv6防外连与本机转发，使用自有本地探针验证，不接触原服务器。
4. 恢复隔离包实际SDK、更新/版本配置直接依赖和本机HTTP服务，取得APK请求分类与客户端截图；需要原打包配置可使用已解密本地JSON，测试账号必须自有，不使用用户真实凭证。
5. P1：真实APK接受protobuf区服列表并显示本地测试服。P2：网关verify/challenge/严格reply，然后捕获并解码login_sdk。P3：基于已恢复模块契约实现合法ETF初始化、进入大厅。最后最小战斗、一次性结算、重启持久化闭环。

每里程碑保存日志、截图、测试结果和下一检查点到analysis，更新交接文档，明确区分“源码完成 / 组件通过 / APK收到请求 / 客户端接受 / 可玩闭环”。不要将原39项旧文档或曾经2%左右的粗估当作新的验收；以证据为准。
