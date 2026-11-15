# 08 运营执行手册

更新：2026-11-14。配套[完整项目规划](11-project-roadmap.md)、[活动规则](07-activities-and-calendar.md)和[逐行活动日历](rules/activity-calendar.md)。本文列出可执行的运营核对、已存在的工具和异常处理；写入检查清单不代表相应玩法或自动化已经验收。

## 1. 运营目标与当前基线

玩法、排期、商品、奖励、资格与结算按原版还原，代金券是用户明确保留的定制系统。运营工具用于管理本服、处理事故和执行已核规则；临时开关不代替规则恢复，补偿不代替修复。

以下是2026-11-14仓库配置与发布脚本基线，**不是本轮实时服务器检查结果**。线上执行前必须重新读进程、unit、current链接和状态文件；历史PID、角色数量与发布目录不能当当前值。

| 项目 | 配置/约定 | 核对来源 |
| --- | --- | --- |
| 当前服 | activeServerId=3，命运三服 | `config/public-server.json` |
| launchProfile | public-realm-3-20261112 | 同上与runtime状态 |
| 开服时间 | 2026-11-12 18:00 UTC+8 | 同上与三服日历 |
| SDK/list/startup/game | 18880/18881/18882/19090 | public-server端口、实际监听与SDK地址 |
| 管理 | 127.0.0.1:18883 | 实际监听；远程经SSH隧道访问 |
| 服务 | fate-covenant-realm-3.service | 部署脚本默认，线上unit复核 |
| 发布根/current | `/data/disk1/game/releases`、`/data/disk1/game/current` | deploy-release.sh与readlink |
| 数据目录 | 脚本默认`/data/disk1/game/data-realm-3-live-20261112` | 实际FC_LOCAL_DATA优先；见下方不一致项 |
| 备份根 | `/data/disk1/game/backups` | deploy-release.sh与每次备份清单 |
| 日历 | config/activity-calendar-realm-3.json，schedule | 运行环境FC_ACTIVITY_CALENDAR_CONFIG |
| 角色ID | 配置roleId=100004 | 只是配置，不能据此推断当前首个/唯一玩家 |

本轮发现仓库 `deploy/fate-covenant-realm-3.service` 的 `FC_LOCAL_DATA`/`ReadWritePaths` 仍是 `data-realm-3-rollover`，与发布脚本默认不一致。下一次部署必须先查线上实际unit与override，确定正确数据目录并统一后再执行。不能直接照抄unit覆盖线上而指向另一库。

### 1.1 一次运营使用同一份基线

执行前把代码commit、客户端包/资源版本、实际区服配置、日历文件及哈希、原始表资产哈希、覆盖行、服务器当前时间、开服时间放入同一份记录。以UTC保存时间戳，供玩家阅读时同时给UTC+8；每个窗口注明开始含、结束不含，异常接口按自己的原边界另外记录。

以下四类信息分别保留：原版表/脚本事实、个人服务器当前算法、本服配置/临时覆盖、实际运行状态。生成文档中的本服窗口不能覆盖原表值；线上状态也不能反向证明该窗口是原版规则。原始数据、规则说明、业务实现和客户端验收分别见[规则目录](rules/README.md)、[活动族目录](rules/activities.md)、[问题与验收](09-defects-and-acceptance.md)。

只有代金券具有用户明确要求的定制规则。2026-11-15起，未取得原服务器规则的分支依[最终基线R1](12-final-rule-baseline.md)、[逐任务裁定](rules/final-rule-register.md)和[四项动态排期](rules/dynamic-schedule-decisions.md)执行，不由值班人员另选日界、奖池、回收或补发。活动改期、额外补偿、自动邮件、永久全开不能作为默认答案；原应得差额恢复和额外福利分别记账。

## 2. 职责与记录

每个变更记录：工单/原因、目标服、影响角色/活动期、原始配置与规则来源、修改前后差异、执行人/时间、代码提交、备份、验证结果和撤销方法。现有后台只有共享管理密钥和operator文字字段，**没有已实现的细粒度角色权限或双人审批系统**；不要把制度建议写成已有技术能力。

日常动作分为读状态、修改配置/覆盖、发券/加款/购买、发版/数据恢复。用同一个操作ID重试，避免复制表单生成新ID重复执行。对玩家说明问题、实际影响和处理结果，内部日志保留隐私字段的本地副本。

## 3. 每日巡检

| 检查 | 查看什么 | 异常时先做什么 |
| --- | --- | --- |
| 服务与监听 | unit active、MainPID、重启次数、四个游戏端口与回环管理端口 | 先保存日志和当前release，区分服务未起、端口冲突、配置错误 |
| 登录链 | SDK会话、区服、握手、登录模块、客户端后续命令 | 按最后成功命令查，不能大厅不动就默认网络不通 |
| 新号漏斗 | 创角、第一战、Award1、上阵、首章、Award2、2-1 | 特别检查guide_award_unconfigured和2-1连败 |
| 资源/支付 | 订单、扣款/核券、到账、待同步、异常回滚 | 先查唯一request_id与账本，禁止盲目补两次 |
| 活动 | 当前实例/期号/阶段、业务日、日历、override、倒计时 | 比较服务器时间和原配置窗口，勿先force_open |
| 定时任务 | due_at、done_at、attempts、last_error | 区分欠执行、反复失败和未知handler |
| 结算 | 冻结榜、邮件、settlement marker、未完成阶段 | 按幂等步骤补跑，不重建已完成奖励 |
| 数据与容量 | 一致备份完整性、磁盘、WAL、增长、账户/角色关联 | 停止继续发布或批量写入，先定位损坏与容量 |
| 用户反馈 | 版本、服、操作、时间、最后界面/错误、是否重登 | 优先复现规则与实际数据，不要求用户反复重装 |

这些指标目前可由日志、SQL与后台状态人工核对；本仓库没有证据表明已部署完整自动告警/数据看板。零错误日志也不能证明用户按钮能点，1054/102801曾有协议正常返回但客户端等待的事故。

## 4. 线上只读检查命令

以下在Linux服务器会话中执行，不在Windows PowerShell里直接运行。路径必须先按unit确认。

```bash
systemctl show fate-covenant-realm-3.service -p MainPID -p NRestarts -p ActiveState -p SubState
systemctl cat fate-covenant-realm-3.service
readlink -f /data/disk1/game/current
cat /data/disk1/game/current/RELEASE_COMMIT
ss -lntp
journalctl -u fate-covenant-realm-3.service --since '30 minutes ago' --no-pager
```

只查看unit中需要的环境与路径，不复制含密钥的文件到对话。状态文件`server.local-only.json`包含pid、startedAt、activeServerId、launchProfileId、serverOpenedAt、activityMode、servers、listenHosts、boundPorts；核进程是否与状态文件匹配，旧文件不能代表当前监听。

数据库只读查询应在一致副本或已有只读管理连接上执行；不要用会自动迁移的createLocalGame打开线上库做检查。核心检查SQL：

```sql
PRAGMA integrity_check;
PRAGMA user_version;
SELECT count(*) AS roles FROM roles;
SELECT count(*) AS accounts FROM accounts;
SELECT role_id, guide_key, process_id FROM guides WHERE role_id=:role_id;
SELECT claim_type, claim_key, created_at FROM reward_claims
 WHERE role_id=:role_id AND claim_type='guide_award';
SELECT uid,tid,level,star,star_progress,break_level FROM heroes WHERE role_id=:role_id;
SELECT key,due_at,done_at,attempts,last_error FROM scheduler_job ORDER BY due_at;
SELECT server_id,act_id,period_no,stage,settled_at FROM activity_instance WHERE server_id=3;
```

SQL参数必须绑定，表存在与schema以当前版本为准。`guides`有行不能证明已发赠角；要同时查reward_claims、英雄与登录module16。`integrity_check=ok`也不能证明玩法状态正确。

## 5. 管理端连接与实际接口

界面地址`http://127.0.0.1:18883/`，管理key由本地运维安全持有，不写本文档。远程使用SSH本地转发，将本机18883转到服务器127.0.0.1:18883；不要改后台公网监听来图方便。

API要求正确的127.0.0.1 Host、Bearer key；POST必须JSON，存在Origin时必须同源，最大请求体8192字节。当前实现见 [admin/server.mjs](../../personal-server/admin/server.mjs)。

| 方法/路径 | 输入 | 返回/作用 |
| --- | --- | --- |
| GET `/api/state` | 无 | 钱包/订单/产品等快照，可含代金券汇总 |
| GET `/api/vouchers` | 无 | 发放、领取、核销、余额与统计 |
| GET `/api/activity?serverId=3` | 服ID必须显式 | instances、overrides、settlements |
| GET `/api/feature/overrides?serverId=3` | 服ID | 功能覆盖历史 |
| GET `/api/scheduler` | 无 | 定时任务状态 |
| POST `/api/credit` | account_id、amount_cents、request_id、note | 加钱包余额，幂等；不发游戏商品 |
| POST `/api/purchase` | account_id、product_id、request_id；可选voucher_count/amount、activity/period等 | 原商品购买，扣费发奖，返回真实订单结果 |
| POST `/api/vouchers/issue` | account_id、request_id、quantity或amount_cents；可选标题/内容/有效期 | 发送代金券邮件，领取后才入背包 |
| POST `/api/activity/preview` | serverId、actId、kind、startAt、endAt、conditions | 预览覆盖的阶段结果，不正式写覆盖 |
| POST `/api/activity/override` | serverId、actId、kind、时间/条件、reason、operator | 记录临时覆盖；force_open/close_early需要confirm:true |
| POST `/api/activity/override/revoke` | id、operator、reason | 撤销指定覆盖，保留历史 |
| POST `/api/activity/tick` | JSON对象 | 推进活动运行时，可能写阶段并触发结算 |
| POST `/api/feature/override` | serverId、funId、mode、reason、operator | force_open或force_close |
| POST `/api/feature/override/revoke` | id、operator、reason | 撤销功能覆盖 |
| POST `/api/scheduler/run` | JSON对象 | 执行到期任务，可能产生业务写入 |

没有通用`/api/grant-hero`、`/api/refund`、`/api/mail/send`或“一键补全部奖励”HTTP接口。服务内有邮件issue/enqueue能力，不等于对外存在同名路由。`preview`不是完整业务dry-run，它只评估阶段，不证明奖池、奖励、资格都可执行。

已通过安全方式设置本机`FC_OPS_TOKEN`时，可只读查询：

```powershell
$opsHeaders = @{ Authorization = 'Bearer ' + $env:FC_OPS_TOKEN }
Invoke-RestMethod -Uri 'http://127.0.0.1:18883/api/activity?serverId=3' -Headers $opsHeaders
Invoke-RestMethod -Uri 'http://127.0.0.1:18883/api/scheduler' -Headers $opsHeaders
```

不在shell历史中输入真实key字面量。API默认serverId可能为1，因此三服请求始终显式传3。

## 6. 开服、逐期活动与排期操作

### 6.1 生成入口、输入与报告

从项目根目录生成完整规则与日历说明：

```powershell
node tools/build-detailed-rule-docs.mjs
```

输出入口为[活动日历](rules/activity-calendar.md)、[全部活动族](rules/activities.md)、[原始表目录](rules/tables/README.md)和[规则总目录](rules/README.md)。日历用来查看day1/day2/day3和前30/90天窗口，并分别保留原 `world_time`、本服当前算法窗口与rebase标签。先核报告内的配置与来源哈希；新服开服时间不同或原表更新后，应重新生成对应报告，不能只把旧报告标题中的“三服”替换成新服名字。

既有[排期审计脚本](../../personal-server/scripts/audit-activity-schedule.mjs)接受 `FC_ACTIVITY_CALENDAR_CONFIG` 选择日历，`--json`输出结构化报告。下面只读资产并将结果保存到本地分析目录，不连接或修改运行服：

```powershell
$opsCalendarPath = (Resolve-Path 'personal-server/config/activity-calendar-realm-3.json').Path
$opsPreviousCalendar = $env:FC_ACTIVITY_CALENDAR_CONFIG
$opsReportDir = 'analysis/operations/realm-3-calendar-20261114'
New-Item -ItemType Directory -Force -Path $opsReportDir | Out-Null
try {
    $env:FC_ACTIVITY_CALENDAR_CONFIG = $opsCalendarPath
    node personal-server/scripts/audit-activity-schedule.mjs --json |
        Set-Content -LiteralPath "$opsReportDir/schedule-audit.json" -Encoding UTF8
    if ($LASTEXITCODE -ne 0) { throw '活动静态窗口审计失败，检查已保存报告。' }
} finally {
    if ($null -eq $opsPreviousCalendar) {
        Remove-Item Env:FC_ACTIVITY_CALENDAR_CONFIG -ErrorAction SilentlyContinue
    } else {
        $env:FC_ACTIVITY_CALENDAR_CONFIG = $opsPreviousCalendar
    }
}
```

新服使用自己的独立日历文件，审计时将上面的路径指向该文件；不要修改正在运行服的配置来试算另一个服。一次报告至少保存：serverId、开服时间、referenceOpenedAt、windowAnchor、mode、客户端/资产版本、生成器commit、配置SHA256、生成时间。详细文档生成器以其报告声明的输入为准，不假定它支持未列出的命令行参数。

审计中的 `errors`、`unresolved`、跨表ID冲突和窗口种类都要阅读。`Result: PASS`只表示该脚本覆盖的静态结构/时间检查通过；动态时间未解、当前生命周期拒绝、功能门槛、奖池、商品和实际命令不可用可能同时存在。静态窗口清单不等于运行数据库已建立全部实例；当前runtime会观察登录投影中的活动，tick主要推进已存在实例。

### 6.2 原绝对日期与本服日历分开

| 时间层 | 核对内容 | 解释与执行边界 |
| --- | --- | --- |
| 原版绝对排期 | 原 `world_time`、duration/end、discard_time、服务器开放范围与版本 | 保留原Unix值和UTC+8日期。原表写某年某日不表示“每个新服第N天” |
| 原版相对字段 | `refer_day/server_day`、起始偏移、阶段、开服/创角/参与资格 | 表字段与消费者共同决定，不能把所有day字段套同一日界 |
| 当前本服计算差异 | `serverOpenedAt`、`activityReferenceOpenedAt`、`activityWindowAnchor`、当前calendar/lifecycle | 当前代码把 `world_time` 按完整秒差平移、标 `server-relative-world`。这已被R1正式绝对日期规则替代，仅留作待修差异，不能据此发布 |
| 自定义窗口 | 登录custom行、原锚点、已rebase标记、运营覆盖 | custom窗口使用自己的锚点规则，不能再按reference重复平移。保存原窗口、一次平移后的值与来源 |
| 实际运行 | instance/period/stage、最新有效override、角色资格、客户端倒计时 | 需要同时核实例和角色。某低等级号不可见不应把全服实例改为关闭 |

当前世界时间rebase使用秒差，不只是替换日期；目标服18:00、参考服00:00时，原日内时刻也可能移动。报告中必须同时显示原值和计算值，不能将后者引用为“原版每天这个时间开放”。`discard_time`等限制仍按当前消费者独立判断，不能因窗口平移就自行平移所有字段。

当前 `activityWindow` 对相对日使用开服所在自然日零点再加原始起始偏移；`serverDay`标签则依据当前统一时间函数。原起始偏移是05:00时才会落在该时点，不能无条件把所有活动起点设成05:00。不同来源同ID、父子继承、自定义窗口和缺失时间类型必须分别列出；静态审计选用某一来源，不等于原版冲突语义已经证明。

`all-open`是测试模式。它的循环窗口、固定当前钓鱼ID和对齐行为不应出现在正式1:1日历事实中。175001及time_fun461三项已有明确R1实例首期与阶段，见动态专项；其他未核必要资格限制对应新增变更且保留读取/确定权益，不能写成原版永久关闭。

### 6.3 开服day1、day2、day3和前30/90天

以下按当前 `time.mjs` 和三服配置计算，UTC+8。它们是核查报告的日期坐标；每一天有哪些活动，逐行查[活动日历](rules/activity-calendar.md)，不凭活动名称另编一个首周顺序。

| 检查日 | 当前本服时间范围 | 当日必须核的业务 |
| --- | --- | --- |
| 开服前 | 2026-11-12 18:00之前 | 区服/launchProfile、实际数据目录、日历/原表版本、day1与后续转换清单、端口、备份/恢复、管理端和新号初始档；未开放不应受理本服玩法 |
| day1 | 11-12 18:00≤t<11-13 05:00 | 只开放规则允许的实例和角色入口；核首次登录、初始资源、首战、赠角、首章/2-1；检查首日限购、签到、首充/累充计数及首个阶段边界 |
| day2 | 11-13 05:00≤t<11-14 05:00 | 对照day1→day2新增/结束/转阶段；核日次/签到/限购只重置相应scope；开服日门槛与等级条件同时检查。名人堂不是“到day2自动所有人开放”，还需等级≥32及模块条件 |
| day3 | 11-14 05:00≤t<11-15 05:00 | 核day2→day3变化、分日任务与仍在进行的首周实例；检查跨期商品/奖励位没有提前清零，重登和在线结果一致 |
| day4–7 | 按各日次05:00边界及活动自有窗口 | 每日对照实际实例与首周预演；核首周目标、成长/登录奖励、各活动阶段、商品售罄、未领、关闭和结算 |
| day8–30 | 前30天视图覆盖的全部窗口与转换点 | 检查首周向常规循环衔接、同家族版本切换、跨周/月、终身与期内限购、回归/创角日资格和首轮赛季 |
| day31–90 | 90天视图中的后续窗口与显式期 | 检查历史榜/权益、累计与旧币冻结、赛季/父子重叠及后期功能；461默认仅day29/79/90显式首期，不从持续天数推导循环；后续日历无条目即不新建 |

新服按相同方法生成自己的日期坐标；day1通常不足24小时，不能在开服满24小时时再进入day2。午夜或05:00前开服遵循当前函数的开服自然日锚定，必须使用工具计算，不手工套“三服18:00”的偏移。

开新服执行清单：

1. 确定独立serverId、launchProfile、开服时刻、端口/地址和外置数据路径；配置、unit、发布脚本和状态文件一致，账号/钱包与角色作用域明确。
2. 新服确实要求空库时，在独立目录验证无历史账户/角色/购买/活动个人进度；首次真实创角应产生完整新号。已有服不得通过清库来满足“开服检查”。
3. 固定原客户端与表资产版本和R1规则指纹，生成day1/day2/day3、30/90天报告；原绝对日期、当前代码rebase差异、R1推定首期与具体受限动作分列，检查父子窗口、互斥和重复商品上下文。
4. 为当期每个活动建立第6.4节的准备记录和第6.5节的族别检查，执行门槛前后、窗口前后和重登验证；缺实现或缺语义保留阻断项，不能强开后声称准备完成。
5. 将对应配置、版本、备份与恢复记录随发布保存。启动后读回实际服/开服时间/mode/端口，验证真实登录及预定首日流程。
6. 首周每次日切后对照报告；每个自有阶段边界另外核对。到day7、day30、day90时归档差异与实际结果，为下一窗口重新生成报告。

30/90天报告展示基于已取得资产和当前算法可计算的排期，不证明已经取得原服未来90天全部动态投放。只有准确时间字段而缺父子/条件/结算的活动，应在报告中保留该限制，不能把“窗口内”写成“可购买/可领奖”。

### 6.4 每期准备、阶段与结束的操作清单

每期记录绑定`baseline + scope + scopeId + actId + version + occurrenceId + S/E`，个人记录再加roleId/来源键；服务器、公会、跨服scope不能一律退化成serverId。同一族多个活动ID分别记录，父子活动、任务和榜保存原关联。不是每个活动都有全部阶段：原state/stage能算则按原消费者，四项R1显式推定段按[专项](rules/dynamic-schedule-decisions.md)并保留身份，不自行增加领奖/展示段。

| 时点 | 具体操作 | 必须读回的结果 | 异常判定 |
| --- | --- | --- | --- |
| 准备 | 固定原配置/版本/时间、资格、父子关系；核奖池/奖励/资源处理器、商品/限购、事件源、任务、榜单、货币和未领政策；存副本测试结果 | 一期规则卡、原值/本服窗口、全部操作和奖励出口、结算幂等键、已知未知 | 引用为空/错ID、需要服务器下发却缺数据、家族只拒绝、奖励无处理器，均不能记可运营 |
| 开始前 | 对照该期实例和最新有效覆盖，检查个人状态未串旧期；在开始前1秒尝试本期写操作 | 读/显示按原关闭或预热；未提前扣费、发奖或计数；结构模块完整 | 提前可抽/可买/可战，或因删结构行导致登录失败 |
| 预热 | 核原preview和独立子实例；只开允许的预热操作 | 客户端与服务器阶段一致；175001按专项在父预热已有独立50段可售卖 | 将父阶段一刀切传给全部子活动，或给无合法子实例的商城提前售卖 |
| 进行开始 | 在开始瞬间及之后验证合法操作；分别核达标/未达标角色 | 实例/期号正确，在线与重登一致；成本、奖品、次数、累计、记录落同一范围 | 只有入口可见但命令拒绝、过期版本仍可交易、待领奖励二次到账 |
| 进行中 | 对照购买/抽取/战斗/任务来源和实际收益；检查日切与个人限购、自选、排名 | 各计数由合法已提交业务驱动；失败不消耗；榜单为真实数据 | 客户端自报可刷分、同SKU串活动、每日重登把已领奖励重新变可领 |
| 进入领奖 | 停止原不允许的新增操作，保留已达标未领；核旧期pending和子商店范围 | `operate`关闭、合法`claim`仍可，是否结算及冻结按该族原触发点 | 结束后仍买/抽，或仅领奖阶段被整体关闭导致合法未领丢失 |
| 进入展示 | 使用原结果/冻结榜和剩余倒计时，核展示期是否仍有独立补领 | 原不可操作项拒绝；旧期结果可查询；不混入下一期实时榜 | 展示期延长被解释为重新售卖；旧排名随新期变动 |
| 结算触发 | 读取该族原触发时点，取得一致备份/快照；冻结参与者与榜，计算原奖励，写邮件/对象与marker | 每步同事务或可追踪幂等提交；失败可续跑；已完成步骤不重发 | 没有参与/未达标也发排名奖、marker成功但资源/邮件缺失、重复tick重复奖励 |
| 关闭/过期 | 按该族原政策处理未领、专属货币、兑换、邮件有效期；归档期状态 | 已关闭写操作拒绝；清理/保留/转换有精确规则与账本 | 未知货币统一清零，或仅因界面关闭把合法已得物品删除 |
| 下一期开始 | 分别迁移原允许累计、重建期内计数/领取位/pending/池/自选/限购/榜单 | 新旧期能区分查询与请求；永久项保留，期内项正确初始化 | 全清module92造成永久进度丢失，或保留旧领取位导致本期无法领 |
| 中断恢复 | 覆盖开始/结束/领奖/结算期间断线与服务重启；再次执行同操作/同任务 | 最终状态与不中断一致，账本唯一，在线同步可通过重登补回 | 仅内存记录导致订单/对局/结算丢失，或错误重放已发奖励 |

现有统一状态映射为10预热、50进行、60领奖、90展示；当前通用门禁允许read读取这些阶段、operate仅running、claim允许running/claim。此映射是核对当前行为的入口，各族消费者与原配置的特殊例外必须单列。结算是有副作用的任务，不是给所有活动增加同一个客户端状态；当前runtime在离开running时调用结算链，不能据此证明每个原家族都应在同一时点发所有奖励。

### 6.5 不同活动族必须补齐的专用检查

| 活动族 | 当期准备与运营必须核的额外项 |
| --- | --- |
| 招募/转盘/翻牌/拼图/千百抽 | 正确lib/group/权重/候选、逐抽保底与跨期、轮次/棋盘、自选、pending和累计领取分离、重复转换、抽取日志 |
| 签到/成长/首周/收集兑换 | 按开服还是创角还是自然日期计算；每日日次、前驱、真实统计源、补签/补领、兑换是否消费、跨日已领奖励 |
| 付费礼包/通行证/基金/银行/返利 | 商品价/档位/奖励、原资格和限购scope、自选、子礼包一键购买、付费轨/日奖、16004→订单→1900/16003、余额/券与累充口径 |
| 团购/订阅/密封拍卖 | 真实购买人数/订单归属、截止封盘、配额/赢家/成交价/退款分红、并发和补偿档位、未参与不能领取 |
| 战斗/竞技/冲榜 | 固定敌阵或真实对手快照、原属性技能、合法参赛/次数、结果统计、排名scope/同分、冻结/邮件与赛程跨期 |
| 探索/三消/配对/烘焙/垂钓 | 地图/棋盘/配方/鱼种、合法操作与服务端校验、开局票据、分数/重量来源、局内恢复、轮次、任务/排行榜和专属物品 |
| 公会/助力/邀请/回归 | 真实身份/关系/公会资格、共享进度和个人进度、加入/退出/离线日、多人并发、双方奖励、赛季/邀请绑定 |
| 节庆/夏日/周年等复合活动 | 主活动与PVE/PVP/小游戏/养成/商店/任务的父子ID和时间；不能只验一个商店就把整组标为通过 |

精确活动ID、版本、子表、奖励和商品在[全活动族目录](rules/activities.md)及其原表链接查找。该表列检查面，不给所有族统一成本、概率、重置时刻或补发政策。

### 6.6 变更窗口与运营覆盖

1. 查原规则、原绝对/相对窗口、本服计算、当前实例/period、最新有效override与玩家资格，确定是未到开放时间、功能未开、缺实现还是时间计算错误。
2. 在一致副本中预演原窗口与预定变更。检查预热、进行、领奖、展示各自边界和结算触发，核已有购买/pending/领奖/榜单/货币。
3. 记录目标服、活动ID、版本、期号、起止时间、影响对象、规则差异、原因及撤销方法。原版应有行为优先恢复已核规则；临时覆盖明确记为事故处理。
4. 用`/api/activity/preview`查看阶段，再按真实kind提交。force_open与close_early的`confirm:true`是现有接口字段，不是文档新增的用户授权流程。preview不验证奖池/商品/全部资格。
5. tick后读回instances、overrides、settlements与审计；用已知角色确认在线推送、入口、操作、已售罄及重新登录一致。
6. 到期撤销临时覆盖，检查未领、货币、冻结榜和补结算，归档前后差异。无法按原规则运营的分支继续留缺口，不能以永久强关销项。

支持的覆盖kind包括shift、extend、close_early、pause、resume、force_open、condition。force_open必须有界窗口。当前store保存startAt/endAt且记录at为操作时间，lifecycle的close_early读取override.at；精确“计划将来某时提前关闭”语义尚需修正/取证，不能误以为传endAt一定生效。

extend保留原最后声明阶段，不会自动变回进行期；已经展示的活动延长后不等于允许继续购买。多个覆盖以最新有效行生效，撤销最新一条可能重新暴露更早覆盖，撤销后必须重读。pause是可见性/访问覆盖，当前runtime不会据此正常结算并清理原实例；恢复也不等于自动延长全部时间和退还已消耗资源。

### 6.7 排期与活动异常的判定顺序

| 现象 | 先核对 | 可以下的结论与后续动作 |
| --- | --- | --- |
| “今天应开却没有” | 原绝对日期、本服rebase、serverDay、时间类型、discard/server限制、父活动、实例、override、角色门槛 | 区分原版排期未证、本服计算不同、缺实例、当前拒绝、个人不达标；不直接force_open |
| 低等级看见后期入口/引导 | 功能完整ID与位图、原条件、module switch、Guide/实际表单、角色Storage、更新资源版本 | 保留场景，不把“有该类脚本”当触发证据；不得清全部引导或阻断7000来代替定位 |
| 界面时间配置错误/倒计时不同 | 表版本、start/end/phase、custom窗口是否重复rebase、module92/183、父子阶段 | 比较原值与本服投影，定位具体行；只改服务端系统时间或要求重装不能证明修好 |
| 正在进行但所有操作code5/309 | need=read/operate/claim、角色资格、原表引用、家族实现、实际期号 | 时间开放和业务可用分开；缺规则/未实现仍是运营阻断 |
| 结束后还可买/抽/累计 | 实例与角色门禁、请求活动/版本、子商品上下文、缓存/在线推送、结算点 | 先保存已发生订单和收益，限制精确分支；不能删订单或把结束改远未来消除异常 |
| 已付费/已领奖但UI没更新 | 订单/领取唯一键、真实对象、模块、在线推送、重登 | 已提交仅补同步；未提交按原业务重试同ID；不能换request_id再扣一次 |
| 结算滞留或反复执行 | due/done/attempts/error、冻结榜、各step marker、邮件/资源、源期号 | 当前失败步骤按原幂等键续跑；只看“lifecycle已标记”不能推断全部玩家奖励已发 |
| 新期无奖励/旧分数沿用 | period/version、累计继承声明、日/期/终身scope、pending/领取位/限购/榜单 | 针对具体字段输出差异；不清全部活动数据或把所有累计永久保留 |
| 报告PASS但客户端失败 | 报告覆盖范围、动态未知、实际配置/实例、原消费脚本、APK操作 | 记录各层差异，PASS只保留其静态含义，不把失败场景销项 |

人工巡检发现阶段应切未切时，记录“预期边界/实际时间/最近tick/当前实例/错误”，再区分调度未执行和业务结算失败。现有检查周期与告警能力以实际运行状态为准；旧设计中的“5分钟自动报警”“全服邮件一键补发”不构成已部署能力。

### 6.8 一期是否可以归档为已验收

一期至少保存配置与来源、原绝对/本服窗口、所有实际阶段、实例/个人状态差异、正常与非法操作、订单/奖励/榜单/邮件/货币对账、结算重试、重登/重启和客户端结果。每个未核的原规则保持未核状态。

只能分别记录“文档覆盖”“静态窗口可计算”“服务端已实现”“APK场景通过”“线上该期完成”。缺业务、缺客户端或缺结算证据时，不能因报告已列出活动就归档为可运营或1:1完成。

## 7. 功能开关操作

force_close当前通过遮蔽发出的位图与业务override限制功能，不抹除玩家原始开放位；撤销后应恢复原位图。force_open是临时覆盖，不应写成角色永久达标。当前reconcile主要增位，历史错误开放的修复须输出精确角色/功能位差异，不能全清。

针对1级名人堂问题应先定位FunOpen/Guide触发，不能以关闭整个7000或删除活动模块救场；这可能重现大厅等待。临时关闭要核是否影响客户端必须完成的引导与后继入口，保存受影响角色现场。

## 8. 发券、加款与交易对账

先查账户归属与目标角色，不能凭昵称唯一识别。发券使用稳定request_id，quantity与amount_cents同时填写时必须相等（每张100分）。发送后查mail_id及voucher_grants；玩家领取后查claimed_at、received和背包；使用后查voucher_redemptions与订单。

钱包加款使用正整数分和唯一request_id，同ID同参数重试应duplicate，同ID不同参数应拒绝。购买按原商品和活动参数处理，不能用加款接口代替实际商品购买。

对账分别核：

| 账目 | 应满足 |
| --- | --- |
| 钱包 | 初始余额+加款−余额购买扣款=当前余额；ledger连续一致 |
| 商品订单 | 每个(account_id,request_id)只有一笔有效订单；实际商品/特权只生效一次 |
| 混合付款 | 券核销金额+余额扣款=订单商品价，金额全为分 |
| 发券邮件 | 已发行总量=待领+已领+其他有明确处置记录的状态；失效/删除单列 |
| 背包代金券 | 领取/其他合法来源−核销/其他合法支出=余额，历史初始导入单列 |
| 游戏累充 | 只来自实际游戏购买及原规则对应口径，不把钱包加款重复计入 |
| 联动奖励 | 每项首充/连充/活动进度按原对应购买事件，与订单一致 |

以上等式需将历史迁移、合法补发和冲正单独计入，不能为了等式平衡直接改原账本。

## 9. 缺奖与补偿处理

原版缺失奖励的恢复不是额外福利。先确定应得条件、已领取/已到账、实际差额、重复转化与受影响范围；形成逐角色补发预览、稳定幂等键、修复前后断言和可追踪来源。

例如引导Award1：不能只看没有1020601就认定没发，也可能曾获得后按原机制转换；必须查领取记录、来源、引导前驱和英雄变化。若当前确实空配置拒绝且未到账，恢复原奖励与引导状态，保留养成和通关。

生产存档修复前一致备份，在副本中运行、核其他表不变，再执行具体修复。现有后台没有通用英雄补发入口；本轮已提供Award1/2专项离线工具，不能直接手改hero_list而遗漏uid、模块和领取位。事故补偿若是额外运营策略，单独标记，不能混入原版应得奖励的定义。

### 9.1 原赠角缺失专项修复

入口：[repair-guide-awards.mjs](../../personal-server/scripts/repair-guide-awards.mjs)。只针对已经静止的离线SQLite库，不使用createGameStore启动迁移，不触碰在线库。邻近server状态文件记载活跃PID时，工具在打开库前拒绝；--confirm-offline不能绕过这项检查。

```powershell
node personal-server/scripts/repair-guide-awards.mjs --database <离线.sqlite> --output <预览.json>
node personal-server/scripts/repair-guide-awards.mjs --database <离线.sqlite> --apply --plan <预览.json> --backup-dir <独立备份目录> --confirm-offline
```

可重复添加--role <ID>限定角色，不使用昵称筛选。以上尖括号需换成实际路径，不要对文档中的活跃故障库路径照抄运行。执行前由已确定的维护窗口取得离线库；文档命令本身不代表已停服或已获得一致副本。

| 预览状态 | 条件 | 工具行为 |
| --- | --- | --- |
| eligible | 合法通关10202/20201、奖励位/账本未领、英雄不在权威表或登录快照 | 只补对应Award1/2原数量1 |
| already_claimed | 领取位或guide_award账本任一证明已领 | 不再发，不推断应再送碎片 |
| not_yet_eligible | 尚未达到对应合法主线前驱 | 不发；特别是2-1前不发Award2 |
| review_existing_hero | 英雄已存在但无领取证据 | 人工核来源，不重复发或自行转碎片 |
| review_missing_module / review_invalid_mission | 缺必要模块或主线不能映射 | 不猜进度、不补、不重建角色 |

工具保存全库逻辑指纹与planHash。应用先做SQLite一致备份（包含WAL已提交内容）、完整性与外键检查、在备份副本演练，再核源指纹与演练后指纹；源改变或提交结果不一致时拒绝/回滚。正常英雄养成、原英雄protobuf字节、格子、资源、编队、原Guide步骤与其他登录slot保留。每次实际发奖写guide_award_repairs及原领奖账本/位图；再次生成预览并执行应发放0。

当前专项临时库覆盖多角色、已有英雄复核、防重、指纹改变、SQLite失败回滚、WAL一致备份和活跃PID拒绝。尚未读取或修复用户正在运行的故障数据库，也没有该库的真实补发预览；不能在事故记录中写“已补发”。

## 10. 发版前检查与发布

Windows本地验证从项目根目录执行：

```powershell
npm test --prefix personal-server
npm run test:all --prefix personal-server
npm run test:deployment --prefix personal-server
npm run check:command-dispatch --prefix personal-server
$env:FC_ACTIVITY_CALENDAR_CONFIG = (Resolve-Path 'personal-server/config/activity-calendar-realm-3.json').Path
npm run audit:activity-schedule --prefix personal-server
Remove-Item Env:FC_ACTIVITY_CALENDAR_CONFIG
```

`npm test`只有fast，不能写成全量。是否额外跑slow由改动决定，`test:all`已包含。命令派发审计过期时先`npm run audit:command-dispatch`更新后review差异。日历审计PASS表示结构/窗口审计通过，未解决时间类型与业务仍要单列。

当前Linux[发布脚本](../../personal-server/deploy/deploy-release.sh)要求干净checkout、HEAD=origin/main、依赖可安装、目录外置。它默认运行fast与deployment测试和日历审计，**不自动运行test:all**，完整验证在发版前单独完成。脚本会停服、一致备份、创建release、原子切current、启动并验证五端口/launchProfile/SQLite；失败回滚代码和备份数据。

确认线上unit、DATA_DIR、ReadWritePaths一致后才在Linux项目checkout执行脚本。脚本本身会fetch、stop/start与切换数据，不能当只读检查命令。

```bash
personal-server/deploy/deploy-release.sh
```

发布后核commit、实际PID、current、数据目录、活动与监听，进行真实SDK/区服/登录和目标玩法操作，观察服务日志、UI与数据库，再记录“已验收”。五端口健康不证明赠角或2-1已修复。

## 11. 备份、恢复与回滚

停服后备份整个实际数据目录，含SQLite所需文件、运行配置与本地材料；记录release commit、user_version、时间、大小、SHA256、源路径和角色/订单数量。在线复制单个.sqlite可能缺WAL，不作为一致备份；在线取副本应使用已验证的SQLite一致备份机制。

部署失败后的自动回滚适用于新版本未健康的短窗口。已经有玩家在新版本产生购买、发券、通关后，不能只为回旧代码直接恢复旧数据库，否则会丢合法进度和交易；必须先保留当前数据与差额，决定兼容代码回退或数据迁移/重放方案。

恢复前核目标绝对路径和备份hash，在独立目录演练打开、integrity、账户/角色、订单和目标操作；旧目录保留，避免覆盖唯一存档。完成后仍需真实客户端重登验收。保留周期和异地备份是运营待制定参数，本文不虚构当前已有自动异地备份与RPO/RTO承诺。

## 12. 常见事故处置

| 现象 | 排查顺序 | 禁止的“快速修复” |
| --- | --- | --- |
| 登录后大厅不能点 | 最后请求/回包、module16、7000、102801、模块结构、客户端异常 | 全开功能、删所有活动行、无限重启 |
| 角色没送/卡2-1 | 8001结果、原Award、前驱、英雄/资源/claim、原敌阵 | 给强角/加等级/强制赢代替原流程 |
| 首领/人数不对 | Section.fight、Fight/Team分片、NPC关联、战报 | 借隔壁关、用地图怪物字段 |
| 失败显示战力0 | fightTid、客户端计算链、NPC属性、队索引、mask | 填一个常数/复制玩家战力 |
| 活动时间不对 | 本服开服、参考服、业务日、time_type、override、版本 | 全改成永久开放 |
| 扣款未到账 | 订单request_id、ledger/核券、grant、module/推送、重登 | 换ID重买或不查记录再补一次 |
| 活动结算失败 | handler、last_error、settlement step、榜快照、邮件 | 删marker重跑所有玩家 |
| 数据/路径不一致 | 实际unit/override、current、FC_LOCAL_DATA、备份 | 把一个旧库拷到猜测目录覆盖 |

每次事故按“已查明/假设/已改/组件/链路/APK/发布”分别记录；当前用户反馈优先级见[问题与验收](09-defects-and-acceptance.md)。

## 13. APK运营与版本保存

本轮只生成败北战力的32/64位离线bundle候选，未修改、安装APK。以后涉及改包：先将当前可用包复制到项目apk目录带版本/时间后缀，核大小与SHA256并保留上一版；隔离包验收通过后保存新包并更新apk/README，记录包名版本、来源、签名/哈希、设备、验收与PlayerPrefs前提。APK不提交Git，不删除唯一备份。

败北候选的工具、输入脚本hash、逐TextAsset核验和验收步骤见[专项记录](../../agent/workflow/gameplay-rules-20261114/defeat-power/README.md)。旧充值改包脚本锁定v9及旧hash，不可直接拿来封装v11；需要保留当前地址、SDK、支付、代金券等既有改动。原静态战力正数路径必须与补丁前一致，战报fallback不得再乘难度倍率。

历史`SubDownloadFinish=1`是看板资源加载的必要前置，是否已烘焙到当前包须以apk/README与实测为准，不能因旧包成功而假定重装新设备也正确。设备当前约定ADB `-s 127.0.0.1:16448`；用户游玩时不点击、不停应用、不改路由，原版com.jzyx.my不操作。
