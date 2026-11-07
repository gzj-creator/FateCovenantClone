# PAY-FREEPRIVILEGEACT：免费特权及月度激活

分支 `task/PAY-FREEPRIVILEGEACT-20261108`，从 `main` @ `c0ba81a` 创建。范围只有 `FreePrivilegeActCmd` 的 110601、110602。服务端实现、真实临时 loopback TCP 与临时 SQLite 重开已验证；真实隔离客户端（APK）未验收。未启停实时服务、未读写 `runtime.local-only.data`、未操作 ADB/模拟器/APK、未连接原服。

## 逐 type 状态

| type | 协议 | 状态 | 实现要点 |
| ---: | --- | --- | --- |
| 110601 | ETF 单整数 `act_id` → PB `pb_free_privilege_act_activate_back` | 服务端完成，带证据缺口 | 校验活动行/版本/窗口后，在事务内写 `active_time`、把 `pb_permanent_card.free_endtime` 置为 `active_time + privilege_day × 86400`，并把同一权威状态同步进模块 92 活动条目；回包含 `act_data` 与更新后的 `permanent_card` |
| 110602 | ETF 单整数 `act_id` → PB `pb_free_privilege_act_activate_month_back` | 服务端完成，带证据缺口 | 要求版本的 `is_month_card=true` 且 `month_card>0`，复用月卡服务写入模块 20 的 `monthly_card` 行（`start_day` 用 05:00 日号），同事务写 `monthly_card_active_time` 并同步模块 92；回包含 `act_data`、整份 `pb_monthly_card_info` 与真实 `pb_res_to_client` |

两条命令重复请求都只确认既有激活时间，不重启窗口、不延长体验、不重复发月卡。

## 证据来源

| 文件 | 大小 | SHA256 |
| --- | ---: | --- |
| `analysis/scratchpad/time-temple-20261108/project/3077547558014218000-FreePrivilegeActTable.data.lua.bin` | 1,266 | `0b44f8cd768c4c9b440dca2997e58dae369bb0ada1b4b714c913e10126feeec8` |
| `.../4236431708482876000-FreePrivilegeActMgr.lua.bin` | 4,125 | `b01634489cec5f65db6a1d0577fd8e72768cca5324b73c0be9b0e9033e333475` |
| `.../5531791700235059000-FreePrivilegeActData.lua.bin` | 1,966 | `d7b08dce12b139d8d2b94b8e1dcf7d2bc0af226d28ee0b6618c4b423680b51ed` |
| `.../6917838327310698000-FreePrivilegeActCmd.lua.bin` | 497 | `5e435f84dfe9d72775af728914736015e5d4c999955acea1d54e9c9ffdf1f6c4` |
| `personal-server/assets/protobuf/free_privilege_act.net.proto.bin` | 843 | `09bb1295e1eca2585ca7dee07ba4ab9ed4b5f48fc5ed1eb9bbc79b3250eafb95` |
| `personal-server/assets/protobuf/free_privilege_act.db.proto.bin` | 546 | `f565b4024eb03f3e3ec38a580b673e868505c54e090682a16f57976f3b0e6b56` |

字节码按 `tools/luajit-bytecode-parse.mjs` 反汇编得到：

- `FreePrivilegeActCmd.lua` 只有两个转发函数，均走 `Codec.EncodeErl(param, cbDone, cbFail)`，即请求体是 ETF；`FreePrivilegeActMgr.ReqActivatePrivilege` / `ReqFreeBuyMonthCard` 传入 `actData:GetTid()`，即活动 tid 单值。
- `FreePrivilegeActData._ParseDataImpl` 直接 `Codec.DecodePB(pb_free_privilege_act_act_role_data, bin)`；`IsActiveMonthlyCard`/`IsActivePermanentCard` 分别判断 `monthly_card_active_time`/`active_time` 非零；`GetPermanentEndTime = active_time + Version.privilege_day × TimeKit.DAY_SECONDS`。
- 110601 回调：`RefreshByActData(act_data)`、`PermanentCardMgr:SetFreeEndTime(permanent_card.free_endtime)`，再以 `LocalizeTable.FREE_PRIVILEGE_ACTIVATE_ASSISTANT` 和 `act_data.privilege_day` 提示。
- 110602 回调：`RefreshByActData(act_data)`，`MonthlyCardMgr:ActiveMonthlyCardByCardInfo(monthly_card, res)`。
- `FreePrivilegeActMgr.IsCanFreeBuyMonthCard` 要求版本 `is_month_card`、`month_card≠0` 且当前未激活月卡；`GetRunningActData` 按 `TID_BIG_FREE_PRIVILEGE` 扫描运行中的实例。

活动实例来自已落地的 `ActFrameTable`：`ActFrameType` 1072（`big_type=16`，`lua_module=FreePrivilegeActMgr`）；`ActFrameAct` 1060003（version 1，盛夏版）与 1060013（version 2，二周年版），均 `duration_day=30`、`refer_day=1`、`refer_start_time=18000`、`end_time=18000`，窗口由通用 `activityWindow` 计算。

## 配置

`tools/extract-free-privilege-table.mjs` 从上面的 `FreePrivilegeActTable.data.lua.bin` 重建两个子表，行数与字段缺失都会直接报错：

| 子表 | 行数 | 字段 |
| --- | ---: | --- |
| `Version` | 2 | `tid, privilege_day, is_month_card, month_card` |
| `Show` | 2 | `tid, prefab, title, desc, privilege_tips, txt_cards_tips` |

恢复出的行：

- Version 1：`privilege_day=30`、`is_month_card=true`、`month_card=1`
- Version 2：`privilege_day=30`、`is_month_card=true`、`month_card=1`

即两个活动版本都把 `MonthlyCardTable` 的 1 号月卡（`reward_period=30`）作为免费月卡。

| 交付文件 | 大小 | SHA256 |
| --- | ---: | --- |
| `personal-server/assets/tables/FreePrivilegeActTable.data.lua.json.gz` | 283 | `70e8c993411c907fdd579c569b71924b2edfe2335f6928046c490d6443bdc548` |
| `tools/extract-free-privilege-table.mjs` | 8,450 | `fe8e4b7b016b9d16a853c26ed0837de27ded0c6f4b89fd64a41e01e91f5e10cb` |
| `personal-server/config/free-privilege-act-tables.mjs` | 2,231 | `1649c3dfc44ae2f841f301b413c92629857a1c45014569de10d51058433ab1f3` |
| `personal-server/game/free-privilege-act-service.mjs` | 16,230 | `15eddd227bd036cd9b472671703f8051a8af2899f625145522c10830ca47d549` |
| `personal-server/test/free-privilege-act-service.test.mjs` | 13,225 | `643a91ab19460eb1fc8cba12b5ceae5592ed5ab2ab5b3dd7ccea639ad70d4002` |
| `personal-server/test/free-privilege-gateway.test.mjs` | 8,431 | `be760000f83094d354f2abe5bf657b46639cb9a5933b2fd247360141a0633974` |

## 服务实现

`personal-server/game/free-privilege-act-service.mjs`，由 `gateway.mjs` 构造，并在登录阶段同步模块 92。

角色状态表 `free_privilege_role_state(role_id, act_id, version, active_time, monthly_card_active_time, created_at, updated_at)` 在服务内 `CREATE TABLE IF NOT EXISTS` 幂等创建，未改 `storage/game-store.mjs` 迁移版本。模块 92 的 `module_login_data` 是 ETF 包裹（`0x83 0x6d` + 大端 u32 长度）的 `pb_free_privilege_act_act_role_data`，与 `ActivityMgr.DecodeErl` → `FreePrivilegeActData._ParseDataImpl` 的解包顺序一致。

登录同步：活动类型集合取自 `ActFrameType.lua_module=FreePrivilegeActMgr`，实例取自 `ActFrameAct`；优先取 actId 最大的已开始实例（all-open 下即 1060013），条目写 `state_data{act_id, cur_state_id:50, history_time}`。

110601：解析 act_id → 校验 `ActFrameAct` 行与 Version 配置（未知 1、缺配置 5）→ 校验窗口（停用 309）→ 事务内：

1. 未激活时写 `active_time=now`，并把模块 62 的 `pb_permanent_card.free_endtime` 设为 `now + privilege_day × 86400`；`element_list` 不新增，因为没有任何证据表明体验窗口会给永久卡所有权行。
2. 已激活时只确认存储值，不改写时间。
3. 同事务刷新模块 92，再编码 `pb_free_privilege_act_activate_back`；编码失败整笔回滚。

110602：解析 act_id → 校验版本 `is_month_card`、`month_card`（缺配置 5）→ 事务内调用月卡服务的 `activateFreeCard`：

- 卡片 id 必须存在于 `MonthlyCardTable`；当前时刻若该卡仍有效则拒绝（307），避免免费激活覆盖付费卡或重复延长。
- 写入的 `monthly_card` 行与 `purchase()` 形状一致（`start_day = rechargeDayIndex(now)`、`got_reward` 为空、`got_count=0`），因此现有的月卡领奖命令可以直接读取并发放每日奖励。
- 同事务写 `monthly_card_active_time`、刷新模块 92、编码回包；月卡模块 20 的写入在 SQLite 状态写入之前发生，触发器失败时两者一起回滚。

月卡服务只新增 `activateFreeCard`，`purchase`/`claim`/`assertPurchaseAvailable` 行为未改。

## 网关接入

`personal-server/game/gateway.mjs` 共 6 处纯增量改动：两条 import；服务构造（注入 `monthlyCard`）；登录阶段 `freePrivilegeAct.synchronizeLogin` 与日志字段 `freePrivilegeActId`；在 `diamondBankAct` 之后、`hundredAcc` 之前插入 110601/110602 派发块；返回对象追加 `freePrivilegeAct`。

既有顺序全部保留：`recruit.supports` 仍在 `heroCommandServices` 之前，百抽/bonus draw 仍在通用 `activityRead` 之前，其它登录同步与派发未移动。

## 复现命令

```powershell
cd personal-server
node --test --test-concurrency=1 test/free-privilege-act-service.test.mjs
node --test --test-concurrency=1 test/free-privilege-gateway.test.mjs
node --test --test-concurrency=1 test/free-privilege-act-service.test.mjs test/free-privilege-gateway.test.mjs test/monthly-card-reward.test.mjs test/diamond-bank-act-service.test.mjs test/diamond-bank-gateway.test.mjs test/gameplay-gateway.test.mjs test/m5-command-matrix.test.mjs test/purchase-flow-regression.test.mjs test/login-business-reads.test.mjs
node --test --test-concurrency=1 test/*.test.mjs   # 全量
```

表重建：

```powershell
node tools/extract-free-privilege-table.mjs <FreePrivilegeActTable.data.lua.bin> personal-server/assets/tables/FreePrivilegeActTable.data.lua.json.gz
```

## 证据

- 专项服务（`test/free-privilege-act-service.test.mjs`，10 项）：表提取行数与字段；登录同步写模块 92；110601 激活 30 天体验并持久化、重复请求不延长、重开数据库仍有效；110602 写模块 20 与 `monthly_card_active_time`、重复请求不重启、重开仍有效；免费月卡可走现有月卡领奖命令；未知活动 id 回 1；窗口关闭回 309；缺版本/缺体验天数/缺月卡配置分别回 1/5/5；两条命令回包编码失败各自整笔回滚；SQLite 触发器失败时模块 20、模块 92 与状态行一起回滚。
- 临时 TCP（`test/free-privilege-gateway.test.mjs`，2 项）：真实 `verify` 握手与 909103 登录后，模块 92 出现该活动条目；110601 用 ETF 单整数、110602 用单元素 ETF tuple 各走通一次并核对回包；关闭并重开 SQLite 后模块 92 的激活时间保持；未知 id 回 err 1、空请求体回 err 2。
- 定向回归 61/61 通过（free-privilege 服务与网关、月卡领奖、钻石银行服务与网关、gameplay-gateway、m5-command-matrix、purchase-flow-regression、login-business-reads），日志 `analysis/scratchpad/pay-free-privilegeact-20261108/targeted.log`。

## 未验收与缺口

- APK 未验收：未启停实时服务、未操作模拟器/ADB、未生成新 APK。真实客户端打开免费特权界面、点免费领取、观察永久卡体验倒计时与月卡红点仍未验证。
- 110602 的 `res` 当前为空 `changes`：恢复到的所有表、proto 与调用点都没有“激活时额外发什么奖励”的定义；月卡本身有 30 天每日奖励（走既有月卡领奖）。若后续取得原服样本，需要复核这里是否应带首日奖励。
- 永久卡体验只写 `free_endtime`，不写 `element_list`；免费体验期内永久卡每日奖励是否可领、由哪条命令判定，尚缺客户端/服务端证据。
- 重复激活的错误码未取证：当前实现是幂等确认（返回既有状态），而不是返回错误码，避免客户端重试时出现未定义错误。
- 两个版本都指向 1 号月卡是表事实；`month_card` 与 `MonthlyCardTable` 的绑定只由字段名与客户端 `ActiveMonthlyCardByCardInfo` 调用链支撑，未取得原服回包样本。
- 时间基准沿用通用 `activityWindow`（05:00 日界）；`privilege_day` 的起算点是否就是 `active_time` 由客户端 `GetPermanentEndTime` 反推，未与原服对照。
- 模块 92 条目在重复激活分支不会重写；登录同步每次都会重写，因此以数据库状态为准。