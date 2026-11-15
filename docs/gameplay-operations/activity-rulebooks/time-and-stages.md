# 活动时间、业务日与阶段计算

更新：2026-11-14。本文核对本地原客户端Lua字节码，解释旧 `ActivityTable.Activity` 与新 `ActFrameTable.Act` 的阶段消费者。两套字段不能套用同一算法：旧表的 `state_end_day` 逐段累加到独立日期游标；新框架优先采用服务器下发的 `stage_time_list`，没有对应下发记录时才计算客户端备用区间。两者均不得跳过0天阶段。

这是静态客户端规则与离线算术核对，不是原服实际排期、服务器实现或APK验收。执行统一按[最终R1基线](../12-final-rule-baseline.md)及[四项动态专项](../rules/dynamic-schedule-decisions.md)；原表、原算法、当前代码差异和R1推定分列。当前世界时间平移只是待修实现差异，不能作正式排期，入口见[活动总章](../07-activities-and-calendar.md)、[逐活动配置](../rules/activities.md)和[前90天排期参数](../rules/activity-calendar.md)。

## 1. 日界：GetDayZero也依赖05:00刷新日

设 `D=86400`，`T` 为 `TimeKit` 配置的时区秒偏移，`f` 为刷新日内秒数。本轮核对的 `FlushTimeTable.COMMON_FLUSH_TIME=18000`，即05:00。本文所有阶段函数调用 `FlushTime.GetDayZero/GetDayBegin` 时均未指定其他刷新tid，因此使用此默认值。

```text
dayIndex(t)  = max(0, floor((t + T - f) / D))
DayBegin(t)  = dayIndex(t) * D - T + f
DayZero(t)   = DayBegin(t) - f
```

`DayBegin(t)` 是所属业务日的05:00；`DayZero(t)` 是该业务日对应日期的00:00。后者不是无条件取时间戳所在自然日的午夜：以 `T=28800`（UTC+8）为例，11月14日04:59:59的 `DayZero` 是11月13日00:00，11月14日05:00的 `DayZero` 才是11月14日00:00。计算阶段时必须保留这一步，不能替换为普通自然日取整。

`T` 不是该Lua中写死的UTC+8。`TimeKit.InitBaseTime` 接收时区偏移，默认初始化由 `t-os.time(os.date("!*t",t))` 计算；离线排期必须注明采用的时区。原客户端运行时最终采用的偏移，仍须由对应会话下发或运行证据确认。

证据：`FlushTime.lua` 原型6（原行74，pc0—11）选择默认刷新值；原型24（原行250，pc0—8）组合 `Days2Second(GetDayIndex(...))`；原型25（原行259，pc0—10）在业务日起点减去刷新秒数。`TimeKit.lua` 原型0/19/25分别完成时区相加、日序号及反算；原型2 pc11写入时区偏移。`FlushTimeTable.lua` 根原型26 pc10—11写入18000。

## 2. 两套原枚举

时间类型数字在两表中的含义不同。

| 数字 | 旧ActivityTable | 新ActFrameTable |
| ---: | --- | --- |
| 0 | SERVER_TIME | CREATE_TIME |
| 1 | WORLD_TIME | SERVER_TIME |
| 2 | DIVINE_REALM_TIME | WORLD_TIME |
| 3 | DIVINE_STAGE_TIME | DIVINE_REALM_TIME |
| 4 | 本版未声明对应时间常量 | DIVINE_STAGE_TIME |
| 5 | 本版未声明对应时间常量 | FUNC_TIME |

两表的阶段ID常量相同：0=`NOT_OPEN`，10=`PREVIEW`，50=`RUNNING`，51—55=`RUNNING1`至`RUNNING5`，60=`NOTICE_RUNNING`，90=`PUBLICITY`，99=`END`。60不能仅凭名字等同自动发奖，90也不能由显示倒计时推导服务器结算算法。

证据：`ActivityTable.lua` 根原型209 pc45—51为时间枚举、pc313—333为阶段枚举；`ActFrameTable.lua` 根原型65 pc27—37及pc271—291分别对应两组枚举。旧时间工具的结束哨兵为 `STATE_END_END_TIME=4294967295`，来自 `ActivityTimeUtil.lua` 根原型29 pc2—3，不是无穷大。

## 3. 旧Activity：整体窗口和日期基点

以下函数来自 `ActivityTimeUtil.lua`，`S` 为整体起点，`E` 为整体终点，`B` 为独立日期基点。

```text
GetServerStartEndTime(openTime, cfg):
    B = DayBegin(openTime) + (cfg.server_day - 1) * D
    S = DayZero(B) + cfg.server_start_time
    E = DayZero(B + cfg.duration_day * D) + cfg.end_time
    return S, E, B

GetWorldStartEndTime(cfg):
    S = cfg.world_time
    B = DayBegin(S)
    E = DayZero(B + cfg.duration_day * D) + cfg.end_time
    return S, E, B
```

只有 `server_day` 减1；`duration_day` 直接乘86400，不减1，也不强制至少1天。原世界时间分支直接读取 `world_time`，没有本服日期平移。时间工具先查询 `ActivityMgr.GetCustomCfg(tid)`，若其 `start_time>0`，改用该记录的 `S/E`，并令 `B=DayBegin(S)`；表来源活动随后仍按原 `state` 数组分段。

开服时间还受活动功能的 `data_type/cross_type` 影响：跨服类型可采用对应主服开服时间，普通类型采用 `ServerInfo.OpenTime`。`DIVINE_REALM_TIME` 分支取得神域建立日，转时间戳后调用上述服务器时间函数；`DIVINE_STAGE_TIME` 取得神域阶段开放时间后调用它。缺少对应跨服状态时，部分分支直接返回 `(0,0,0)`。没有这些动态输入，不能由 `server_day` 单独生成真实开放日期。

证据：原型21（原行488）pc0—19为custom覆盖，pc20—37为主服/本服时间选择，pc38—104为各时间类型分流；原型22（原行528）pc0—30为服务器公式；原型23（原行538）pc0—19为世界公式。

## 4. 旧Activity：逐段累计的是日期游标

原型19 `GetGetActStatesByTabCfg` 维护两个游标，必须分别初始化和更新。以下伪代码保留原数组顺序，`nil` 表示配置错误结果。

```text
GetTableStates(S, E, B, cfg):
    if E <= S: return []
    out = [(0, 0, S)]
    if cfg.state is empty:
        append out (50, S, E)
        append out (99, E, 4294967295)
        return out

    cursorDay = B
    cursorTime = S
    hasRunning = false
    lastState = 0
    for i, stateId in cfg.state, in original array order:
        if stateId == 50: hasRunning = true
        nextDay = cursorDay + cfg.state_end_day[i] * D
        nextTime = DayZero(nextDay) + cfg.state_end_time[i]
        append out (stateId, cursorTime, nextTime)
        cursorDay = nextDay
        cursorTime = nextTime
        lastState = stateId

    if cursorTime > E: return nil
    if hasRunning:
        if cursorTime != E: return nil
    else:
        if lastState > 50 or cursorTime == E: return nil
        append out (50, cursorTime, E)
    append out (99, E, 4294967295)
    return out
```

因此 `state_end_day=[1,5]` 表示依次推进1天、再推进5天，不是从起点数到第1天、第5天。日内秒数不是继续累加到上一阶段结束时间：每次从单独的 `cursorDay` 取 `DayZero` 后加该段的 `state_end_time`。

0天只表示日期游标不前进，日内结束时间仍可产生有效小时或分钟窗口。原循环没有逐段检查 `nextTime>=cursorTime`，也没有自动修复倒序或删除零长度记录。文档生成或实现验收应单列这些异常，不能为了产出整齐区间擅改原配置。

表来源的 `GetActStateByTimeByTabCfg` 按 `start<=at<end` 命中状态；`at>=E` 返回99，`at<S` 返回0。原型25/27的单状态查询会在命中时提前返回，不能宣称所有查询都会先完成整表校验。上述完整性条件明确属于原型19的整表构造路径。

证据：原型19（原行414）pc51—52初始化两个游标，pc65—77计算下个日期和结束点，pc78—89生成区间并分别更新游标，pc94—140检查整体终点和补隐含RUNNING。原型25（原行551）pc57—77复用两个游标算法；原型27（原行629）pc5—16判断整体范围、pc47—67计算并查询分段。

### 真实旧表例子

下表以该活动自身起始业务日为D1，令 `S=B=D1 05:00`、时区UTC+8。D1不是统一的服务器开服第1天；例如74002的 `server_day=16`，其D1相当于服务器第16天。例子只验证时间算术，不评估原表的服务器开服时间上下界、功能锁或本期资格。

| 活动tid / 原备注 | state / state_end_day / state_end_time | 计算结果 |
| --- | --- | --- |
| 12003 / 竞技场评定 | `[50,60,90]` / `[2,0,0]` / `[75600,79200,82800]` | 50：D1 05:00→D3 21:00；60：D3 21:00→22:00；90：D3 22:00→23:00。后两段各1小时。整体 `duration_day=2,end_time=82800`，E=D3 23:00。 |
| 74002 / 幻武活动2 | `[10,50]` / `[1,5]` / `[18000,18000]` | 10：D1 05:00→D2 05:00；50：D2 05:00→D7 05:00。整体持续6天，不能把第二段终点算成D6。 |
| 77024 / 新英雄活动_SP命运三姝3 | `[10,50]` / `[0,0]` / `[18000,18060]` | 10：D1 05:00→05:00，长度0；50：D1 05:00→05:01，长度60秒。整体 `duration_day=0,end_time=18060` 仍有有效窗口。 |

完整原值见 [ActivityTable JSON](../rules/tables/ActivityTable.json) 的 `families.Activity.rows`。

### 平台自定义来源是另一条路径

`from_type=ACT_TYPE_PLATFORM_CUSTOM` 调用原型20，只构造0、50、99三条记录，不读取上述 `state_end_day`。其原型28按 `S<=at<=E` 判断RUNNING，包含结束点E；这一边界与表来源原型27不同。不能为了统一表格，把平台custom的实际判定也改写成左闭右开。本文逐表例子均采用表来源分支。

## 5. 新ActFrame：下发优先，备用算法依赖server.start_time

`Activity.GetInitEndTime` 原型21只返回 `_server.start_time/end_time`；没有 `_server` 时返回 `(0,0)`。该函数没有从 `refer_day/world_time/duration_day` 静态计算整体窗口的备用分支。本轮由此不能证明原服务器如何实现新框架的全部时间类型和 `time_fun`。

`Activity.GetStageTime(stageId)` 原型25先按阶段ID查询 `_server.stage_time_list`；查到对应记录就直接返回其中的起止时间。配置数组只提供没有该阶段下发记录时的客户端备用算法：

```text
GetStageTime(q, server, cfg):
    if server is absent: return 0, 0
    supplied = first record in server.stage_time_list where stage_id == q
    if supplied exists: return supplied.start_time, supplied.end_time

    previousDays = 0
    currentDays = 0
    previousEndTime = 0
    currentEndTime = 0
    for i, stageId in cfg.stage, in original array order:
        if q < stageId: break
        if stageId < q:
            previousDays += cfg.stage_duration_day[i]
            previousEndTime = cfg.stage_end_time[i]
        else if stageId == q:
            currentDays = cfg.stage_duration_day[i]
            currentEndTime = cfg.stage_end_time[i]

    start = server.start_time + previousDays * D
    if previousEndTime > 0:
        start = DayZero(start) + previousEndTime
    end = DayZero(start + currentDays * D) + currentEndTime
    return start, end
```

第一段 `previousDays=previousEndTime=0`，因此直接保留 `server.start_time`。上一阶段结束秒数为0时，也不对当前 `start` 取 `DayZero`；但计算 `end` 时始终取 `DayZero`，包括 `currentEndTime=0` 的情况。`currentDays` 不减1，天数为0仍照常计算。算法按阶段ID进行大小比较，并按原数组顺序遇到更大ID即停止，不能先排序或改为普通数组下标累计后声称等价。

该函数未用 `server.end_time` 截断区间，也未补齐缺失数组项。不能用“总活动还没结束”推出某段一定可玩，更不能把客户端计算结果当作服务器实际允许操作的时间。

证据：`Activity.lua` 原型21（原行319）pc0—10为整体起止读取；原型25（原行345）pc0—17为下发优先，pc18—48为四个累加量及阶段ID比较，pc51—64计算起点与 `previousEndTime>0` 分支，pc65—77计算终点并返回。

### 真实新表例子

以下均明确假设 `server.start_time=D1 05:00`、UTC+8，且没有对应阶段的服务器覆盖记录。这是该原客户端备用算法的结果，不是已采集的服务器下发记录。

| 活动tid / 原备注 | stage / stage_duration_day / stage_end_time | 备用算法结果 |
| --- | --- | --- |
| 1074003 / 钓鱼活动_线性新服_0628 | `[50,90]` / `[4,1]` / `[79200,18000]` | 50：D1 05:00→D5 22:00；90：D5 22:00→D6 05:00。90段虽然配置1天，实际区间为7小时。 |
| 1039013 / 大富翁活动_0904新服 | `[50,90]` / `[4,0]` / `[79140,86340]` | 50：D1 05:00→D5 21:59；90：D5 21:59→D5 23:59。0天的90段仍有2小时。 |

完整原值见 [ActFrameTable JSON](../rules/tables/ActFrameTable.json) 的 `families.Act.rows`。

本版884条 `Act` 中811条 `stage=[]`。空数组不能由此函数证明自动生成RUNNING；缺少权威 `stage_time_list` 时，阶段应记为未确定。另有182603、182604：`stage=[50],stage_duration_day=[26],stage_end_time=[]`。备用算法读取空缺结束项后无法正常完成加法；本轮只能登记数组不全/需要下发覆盖，不能代填0。没有服务器覆盖样本，也不能据此断言原服实际异常。

## 6. 生成阶段表时保留的证据层级

每条投影至少保存：原表、活动ID、版本、时间类型原数字、原数组、时区/刷新秒数、S/E/B来源、区间算法来源、是否有服务器阶段覆盖、零长度/倒序/缺项诊断。旧表的整表构造和新框架备用算法应单独标记。

将本服的未平移或平移窗口作为新框架的假设 `server.start_time` 时，结果必须标为“本服窗口输入＋原客户端备用阶段算法”。这不等同原客户端能够静态计算新框架整体窗口，更不等同原服权威下发。旧表缺少跨服动态基点、平台custom配置或本期资格时同样保留未知项。

当前 `personal-server/game/activity-lifecycle.mjs` 的分段实现不是本文算法的证据来源。本轮只完善规则与文档；发现的实现差异由相应修复任务处理，本文不宣称业务修复、上线或APK验收完成。

## 7. 原型、指令与文件身份

`pc` 和原型序号均从0计数，来自仓库 `tools/luajit-bytecode-parse.mjs` 的反汇编结构。原行号取字节码调试信息；混淆后的参数header不作为参数语义依据。本文没有引用 `analysis/tmp/ActivityTimeUtil.decompiled.txt` 中的失败反编译日志作为规则证明。

| 证据文件 | SHA256 |
| --- | --- |
| [ActivityTimeUtil.lua.bin](../../../analysis/scratchpad/time-temple-20261108/project/16510616264917154000-ActivityTimeUtil.lua.bin) | `2a8ec5cd9f54023ec4e44db31a1819a1ee0fd593c526683d9d5d8bfda0f12b25` |
| [Activity.lua.bin](../../../analysis/scratchpad/time-temple-20261108/project/17268122440433684000-Activity.lua.bin) | `f694219f8bb409aaff2c22f5bbcfb36bf0a427d5091d4f6f2f9cc8fbc391fc5b` |
| [FlushTime.lua.bin](../../../analysis/scratchpad/game-rules-20261114/time-assets/2608048538802469000-FlushTime.lua.bin) | `c4e637fdcf7299ec53c835bc0c4723d9e7b3fa25630a513dc3030ac8c5d81711` |
| [TimeKit.lua.bin](../../../analysis/scratchpad/game-rules-20261114/time-assets/3862134482850994700-TimeKit.lua.bin) | `9fbc074edd8194e1e741e0bb7ebd1580dd4124e64fa4667c4d44f917cecf6fe8` |
| [FlushTimeTable.lua.bin](../../../analysis/scratchpad/game-rules-20261114/time-assets/424803492374703360-FlushTimeTable.lua.bin) | `6bfbdcb3960828706d21e34ed001849f7f308dc81df791a9fb57793ea767e3fd` |
| [ActivityTable.lua.bin](../../../analysis/scratchpad/time-temple-20261108/project/6615133135189614000-ActivityTable.lua.bin) | `6063430c71abfb3f5b82858eb5d93bdaa514e705c7a5d34927d5a545e0cc1ac3` |
| [ActFrameTable.lua.bin](../../../analysis/scratchpad/time-temple-20261108/project/11089512760612760000-ActFrameTable.lua.bin) | `60b17a3ee94336fda79571f86a3fd165d1f209129a20e2b63b4b754aa46411cd` |
| 例子使用的 `personal-server/assets/tables/ActivityTable.data.lua.json.gz` | `2b9b7814f793248cffd72029bc330f77275ee51c3865e1c5897935c91867a234` |
| 例子使用的 `personal-server/assets/tables/ActFrameTable.data.lua.json.gz` | `728aef9e134741e4aecdee779dcf7f8a57a5723df437a6b934338410eee6c7df` |

`FlushTime`、`FlushTimeTable` 从本地 `64_lua_general.bundle` 提取，bundle SHA256为 `abf87577761c541535e9a53029c3b94c0776e19855a9f55c2cb50ab34f8d6529`；`TimeKit` 对应本地 `64_lua_core.bundle`，SHA256为 `054c3a1d5de29f66b5f41f413ac56a473ee7b95ccf1226b343068b79cdd3be56`，提取文件与既有TimeKit副本哈希一致。完整本地原型、字节偏移、例子和边界算术保存在 [time-stage-evidence.json](../../../analysis/scratchpad/game-rules-20261114/time-stage-evidence.json)。这些分析文件属于本地证据，不将原Lua打包进交付物。

本轮复核：保存的表dump中1109条旧活动和884条新活动，其时间/阶段字段与文档JSON的1993行逐项一致；5组例子、04:59:59与05:00边界、零长度和缺项记录已离线检查。检查只读取配置、解析指令和计算公式，没有连接原服、打开运行数据库、启停服务或操作设备。
