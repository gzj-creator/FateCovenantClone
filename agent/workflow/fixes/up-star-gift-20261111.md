# 独立“限时升星 / 升星礼包”：登录版本块、版本选择与配置缺口

2026-11-11。分支 `fix/upstar-config-recovery-20261111`，worktree
`.worktree/upstar-config-recovery-20261111`，基于最新 main `95112fb`。最新 main 已合并通用任务活动与
百抽精灵修复；本轮没有使用 `FateCovenantClone-main/` 导出副本，也没有修改、复用或覆盖其他 agent 的
worktree。未启停线上服务、写入运行数据库或操作客户端/ADB/APK；运行库仅以 `readOnly: true` 读取。

## 结论

问题在最新 main 上仍存在。`31052/31053` 仍由 `benefit-commerce-service.mjs` 的
`PAY-UPSTARGIFT` 整族拒绝，模块 92 的独立升星登录块也有实际缺口：线上两个角色都带 66 个历史版本、
`cur_choose_version=0`，且缺少当前排期开放的 `25111`。本轮修复了有证据支持的登录版本块、选中版本、
`31053` 选择与持久化，并把 `31052` 从错误的 ETF 解码路径移到真实 protobuf 请求路径。

`UpStarGiftTable` 在当前环境不可得，因此无法确定档位 id、养成条件、奖励和礼包限购。`31052` 继续以
code 5 和具体缺表原因失败关闭，不伪造进度、不猜奖励、不返回空成功。因而独立升星登录层可以恢复，
“真实档位领取”仍未完成。

## 证据

### 线上证实

- 运行库 `/data/disk1/game/data/game.local-only.sqlite` 中，角色 `100002`、`100003` 的
  `login_modules.module_id=92` 都含 func 25 并行组：66 条 `states_data`、66 条
  `pb_up_star_gift_master.info_list`、`cur_choose_version=0`，且没有 `act_id=25111`。
- `/data/disk1/game/data/events.jsonl` 的真实登录事件 `activity_login_calendar_applied` 在 server day 1
  保留 `25042/25051/25053/25056/25072/25073/25074/25075`，没有 `25111`。
- 日志没有 `31052/31053` 请求或 `benefit_command_refused` 事件。因此“模块 92 数据缺版本和没有选中版本”
  是线上数据证实的问题；“用户实际打开的是独立升星还是百抽 `1102008/theme104` 内页”仍无 UI/请求关联证据。

### 静态确认

- `ModuleTable`：`92037 活动_限时升星 → project/activity/up_star_gift`，登录模块为 92。
- `ActivityTable` 有 104 行 `func=25`。正式排期第 1 天当前开放的登记行为：
  `25042(v40)`、`25051(v49)`、`25053(v52)`、`25056(v56)`、`25072(v72)`、`25073(v73)`、
  `25074(v74)`、`25075(v75)`、`25111(v111)`。
- `ActivityTable.func=25` 只给出活动 id 与客户端版本号，不能替代 `UpStarGiftTable` 的档位内容。
- `up_star_gift.db.proto.bin`：
  - `pb_up_star_gift_master { repeated pb_time_limit_up_star info_list = 1; uint32 cur_choose_version = 2; }`
  - `pb_time_limit_up_star { uint32 version = 1; uint64 act_id = 2; bytes award_bin = 3; pb_recharge_limit_info buy_limit_info = 4; }`
- `up_star_gift.net.proto.bin`：`pb_up_star_gift_req { repeated int32 ids = 1; }` 与
  `pb_up_star_gift_back { pb_time_limit_up_star info = 1; pb_res_to_client res = 2; }`。
- `tcp-commands.md` 和静态接口目录确认 `31052` 是 protobuf `pb_up_star_gift_req`，`31053` 是 ETF 单值。

### 待验证

- `cur_choose_version=0` 时选择“开窗时间最新的当前版本”是服务端为避免空选择采用的可重复规则；现有静态
  索引没有 `UpStarGiftMgr` 的默认选择分支，无法证明客户端原本也会选同一项。用户/客户端仍可通过
  `31053` 选择其它当前开放版本。
- 独立升星入口与百抽精灵升星页的视觉对应关系未知。本轮未修改百抽 `1102008/theme104` 服务。
- 当前同类礼包是否实际发送被拒绝的命令未有客户端请求证据；“入口可见”不等于该家族一定触发当前拒绝。

### `UpStarGiftTable` 查找范围

以下位置均未找到该表，也没有可解码的客户端 Lua data bundle 或 APK：

- `personal-server/assets/tables` 的 185 个表资产及其 gzip 内容；
- `personal-server/assets/protobuf`（只有两份 `up_star_gift` proto）；
- `git log --all`、全仓对象名搜索与 git 历史搜索；
- `agent/workflow/interface-catalog` 的静态接口、schema、字节码索引和活动表；
- `/data/disk1` 下的文件名搜索、Lua project/core/general bundle 搜索和 APK 文件名搜索；
- `update-manifest-364110.txt` 只有 `upstargift.bundle` 等界面资源，没有数据表。

现有 `award_bin` 是玩家领取位，`buy_limit_info` 是玩家礼包购买位；两者为空只能说明参考玩家没有领取/购买，
不能恢复档位数量和奖励内容。没有用 `RechargeTable type=110` 等近似表代替，因为无法证明其与升星档位一一对应。

## 修复

### 登录与版本选择

新增 `personal-server/game/up-star-gift-service.mjs`：

- 从模块 92 func 25 并行组的 `module_login_data` 解包 ETF BINARY_EXT 与
  `pb_up_star_gift_master`，保留全部历史版本、`award_bin` 和 `buy_limit_info`。
- 按 `ActivityTable.func=25` 与共享活动日历补齐当前开放但快照缺失的 `states_data` 和 `info_list` 行；
  当前正式数据补齐 `25111`，不删除或改写已有玩家态。
- 已选版本仍在当前窗口内时保留；未选择或已过期时选开窗时间最新的开放版本。首次真实登录结果为
  9 个开放版本、`info_list=67`、`cur_choose_version=111`。
- 所有变更先在副本上完成并成功编码，再写回活动对象；损坏载荷不会被当作空态重建，登录日志记录
  `up_star_gift_login_rejected`，原载荷保持不变。
- `31053 req_up_star_choose_version` 只接受当前开放版本，在 SQLite 事务内写回模块 92；重复选择返回
  `changed=false`，重登保留选择；“登录态待修复但选择的正是恢复默认值”也会持久化修复内容。

### 领取边界

- `31052` 在网关先按 `pb_up_star_gift_req` 解码，再校验 ids 非空、正整数、去重和数量上限。
- 当前版本与窗口可校验，但档位条件和奖励缺少权威配置，因此在任何写入前返回 code 5，错误信息明确指向
  `UpStarGiftTable`。没有产生领取位、资源或事务部分写入。

### 共享文件改动

- `personal-server/game/gateway.mjs`：仅新增 import、实例、模块 92 编码前的登录同步和
  `31052/31053` 优先派发块。
- `personal-server/game/benefit-commerce-service.mjs`：仅移除 `PAY-UPSTARGIFT` 整族拒绝项。
- 未修改百抽、精灵、活动日历或数据库 schema。

## 回归

`personal-server/test/up-star-gift-service.test.mjs` 共 10 项，覆盖：

1. 多版本：当前 9 个开放版本全部进入状态与版本块，`25111` 被补齐，历史 66 条不删除。
2. 无数据：快照没有 func 25 并行组时，仅根据静态活动和日历生成完整当前版本块。
3. 无开放版本：不写状态、不选版本。
4. 有效选择保留，过期选择修复。
5. 损坏登录载荷：不覆盖原玩家态或伪装成功。
6. `31053` 选择、幂等、重登恢复。
7. 陈旧登录态请求恢复默认版本时仍持久化缺失行。
8. 未开放/未知版本拒绝且不写库。
9. `31052` 请求校验、缺表拒绝且不写领取位。
10. 序列化失败事务回滚；真实 TCP 网关分别按 protobuf/ETF 解码两条命令。

相关定向文件同时覆盖共享 benefit 路由与活动日历，定向回归 41/41 通过。个人服务器全量
`npm test` 为 2871 项、2869 通过、0 失败、2 跳过，耗时 1,287,363 ms。由于缺少 `UpStarGiftTable`，
“未达标/已达标、正常防重复领取、成功领奖的事务回滚、奖励持久化”无法进行有意义实现；没有用常量门槛或
假奖励制造表面通过。该缺口是后续实现档位领取的前置条件。

## `REFUSAL_FAMILIES` 同类审计

审计方法：核对 `ActivityTable`/`ActFrameTable` 当前窗口、静态管理器类型、命令 schema，并搜索除
`gateway.mjs`、`benefit-commerce-service.mjs` 外的真实派发；旧注释若已被更早分支接管则不算当前故障。

| 家族 | 命令 | 当前可见入口 | 证据等级 | 结论 |
| --- | --- | --- | --- | --- |
| PAY-UPSTARGIFT | 31052/31053 | func 25：25042/25051/25053/25056/25072/25073/25074/25075/25111 | 线上数据 + 静态 | 本轮修登录/版本；领取因缺表仍拒绝 |
| PAY-ACTSHOP | 104801-104803 | ActShopMgr type 182 的 182007/182010/187314/182503/182604/182212/182608/182817 等 | 静态确认 | 有入口且只有拒绝；104801 是读取命令，缺 `ActShopTable` |
| PAY-PREMIUMACT | 105401 | PremiumActMgr type 184，当前多个 184 行开放 | 静态确认 | 有入口且只有拒绝；缺 Free 档位规则 |
| PAY-LINKGIFT | 97401 | LinkGiftMgr type 93：93053/93054/93059/93064/93071 | 静态确认 | 有入口且只有拒绝 |
| PAY-BUYSKINACT | 104001 | BuySkinActMgr type 175：175003/175005/175007 | 静态确认 | 有入口且只有拒绝 |
| PAY-APPEARANCERELEASEACT | 98800 | AppearanceReleaseActMgr type 103：103022/103023 | 静态确认 | 有入口且只有拒绝 |
| PAY-NEWPERMITACT | 107401 | NewPermitActMgr type 1016：1016004/1016005/1019314/1016319 | 静态确认 | 有入口且只有拒绝 |
| PAY-VICKREYAUCTIONACT | 106101/106102 | VickreyAuctionActMgr type 1008：1008004/1008005/1018014 | 静态确认 | 有入口且只有拒绝；106101 带读取语义 |
| PAY-SUBSCRIPTIONACT | 107301-107303 | SubscriptionActMgr type 1014：1015005/1015006 | 静态确认 | 有入口且只有拒绝；107302 带读取语义 |
| PAY-GIFTBOXACT | 106301 | GiftBoxActMgr type 1013：1013004/1013007/1013008 | 静态确认 | 有入口且只有拒绝 |
| PAY-PERMIT | 35003-35011 | PermitActMgr type 62：188045/188055 等 | 静态确认 | 35001/35002/35005 已有实现；其余只有拒绝 |
| PAY-LEVELSPRINT | 88101 | func 67：67001 等级冲刺1 | 待验证 | 活动在窗口且模块名吻合，但无直接 ActFrameType 映射 |
| PAY-REBATESHOPACT | 100701 | func 138：138004 神域秘市_返利商店 | 待验证 | 活动在窗口，命令归属和客户端调用仍需请求/字节码证据 |

其余 `REFUSAL_FAMILIES` 未在正式排期找到当前开放对应入口，不能列为本轮线上故障。另一个独立解码问题
仍存在：benefit 路径对部分 protobuf 拒绝命令统一按 ETF 解包，可能先返回 code 1。当前可见的读取类候选
至少包括 `104801`、`107302`、`106101`；报告已记录，未在本窄补丁中扩大修改。

## 剩余限制

- 取得经哈希校验的 `UpStarGiftTable` 和 `UpStarGiftMgr` 后，才能实现档位条件、奖励、礼包限购、
  `award_bin` 防重与 `buy_limit_info` 事务更新，并补齐未达标/达标/重复领取/奖励回滚测试。
- 需要用户重登后确认独立升星页面是否已显示当前版本；服务端单测和临时网关通过不能替代 UI 验收。
- 若用户所述“空白”来自百抽 `1102008/theme104`，应由百抽服务修复，本轮不触碰其内部升星逻辑。
- 未部署、未重启、未合并 main、未发布。
