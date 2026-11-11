# 独立“限时升星 / 升星礼包”：登录版本块、版本选择与配置缺口

2026-11-11。分支 `fix/up-star-gift-20261111`，worktree `.worktree/up-star-gift-20261111`，基于最新
main `f1fed77`（线上 `release-20261111T085036Z`，`RELEASE_COMMIT=f1fed77572aad3538ffb1b6173551f52af121b98`）。
本轮没有启停服务、写入运行数据库或操作客户端/ADB/APK；运行库只用 `DatabaseSync(..., {readOnly:true})` 读取。

## 结论

1. `31052/31053` 在 main 上被 `benefit-commerce-service.mjs` 的 `PAY-UPSTARGIFT` 整族主动拒绝；
   网关还把两条命令都按 ETF 解码，因此 `31052` 的 protobuf 请求会先被判成 code 1，看不到真实缺口。
2. 登录块不是“完全缺失”：模块 92 的 func 25 并行组里确有参考服 534 字节的
   `pb_up_star_gift_master`，66 个版本，`cur_choose_version=0`。问题在于正式排期下开放的 9 个版本里
   `25111`（限时升星_天极汐夜新服0906）不在该快照中，同时没有任何有效选中版本，页面拿不到可渲染的当前版本。
3. 独立升星的档位条件与奖励属于 `UpStarGiftTable`，本环境任何来源都没有该表。本轮实现登录版本块、
   版本选择与持久化；`31052` 保留 code 5 的明确拒绝，不猜奖励、不发空成功。

## 证据

### 线上与运行库（只读）

- `/data/disk1/game/data/events.jsonl` 的 `activity_login_calendar_applied`（08:55:23、08:56:55、08:57:13 UTC）
  在 `actFrameAdjustedActivityIds` 中保留 `25072/25056/25051/25053/25073/25075/25074/25042`，
  没有 `25111`。
- 运行库两个角色（100002、100003）的 `login_modules.module_id=92` 里，func 25 并行组
  `module_login_data` 都是 534 字节、66 条 `info_list`，`cur_choose_version=0`，
  `award_bin` 与 `buy_limit_info` 全部为空。
- 该 66 条与并行组的 66 个 `states_data` 一一对应；解码后每条只有 `version` 与 `act_id`
  （`83 6d 00 00 02 10` 为 ETF BINARY_EXT 包装，内层是 protobuf `repeated{version, act_id}`）。
- 日志里没有任何 `31052/31053` 请求或 `benefit_command_refused` 事件。也就是说这两个命令的
  拒绝是潜在故障，当前“空白”来自登录数据与选中版本，而不是某次命令报错。

### 客户端静态配置

- `ActivityTable` 共 104 行 `func=25`，`version=tid-25000`，`ref_name` 为
  “限时升星/精灵升星/魔灵升星/首周招募…升星”。正式排期第 1 天在窗口内的是
  `25042(v40) 25051(v49) 25053(v52) 25056(v56) 25072(v72) 25073(v73) 25074(v74) 25075(v75) 25111(v111)`。
- `ModuleTable`：`92037 活动_限时升星 → project/activity/up_star_gift`。
- `up_star_gift.db.proto`：`pb_up_star_gift_master{ info_list, cur_choose_version }`，
  `pb_time_limit_up_star{ version, act_id, award_bin, buy_limit_info }`；
  `up_star_gift.net.proto`：`pb_up_star_gift_req{ repeated int32 ids }`、`pb_up_star_gift_back{ info, res }`。

### UpStarGiftTable 的查找范围（均未找到）

- `personal-server/assets/tables` 185 个表资产，没有 `UpStarGiftTable`。
- `personal-server/assets/protobuf` 只有 `up_star_gift.db.proto.bin` 与 `up_star_gift.net.proto.bin`。
- `git log --all -- '*UpStarGift*'` 为空；`git log -S UpStarGiftTable` 只有 PAY-BLOCK-I 的拒绝实现。
- 当前环境没有 APK 与解码后的 lua bundle（`analysis/reports/private-client-16448/lua-bundles/...` 不存在，
  `apk/release/` 为空）；`personal-server/assets/protocol/update-manifest-364110.txt` 只有
  `Android/ui/project/activity/upstargift.bundle` 等界面包，没有数据表。
- 因此档位 id、达标条件、奖励和礼包限购都无法核对；没有用 `RechargeTable type 110` 之类的近似表替代，
  因为现有证据不能证明它们就是升星礼包的档位。

## 修复内容

### 新服务 `personal-server/game/up-star-gift-service.mjs`

- `synchronizeLogin(activity, at)`
  - 解析模块 92 并行组的 ETF BINARY_EXT + protobuf 载荷（旧代码若直接按裸 protobuf 解析会报
    `illegal tag: field number 0`）。
  - 按 `ActivityTable.func=25` 与活动日历计算当前开放版本；补齐缺失的状态行和 `info_list` 条目
    （当前补的是 `25111`），保留参考服已有的历史版本行，不删除、不改写其领取位。
  - `cur_choose_version` 若仍指向开放版本则保留；为空或已过期时选开窗时间最新的开放版本。
- `31053 req_up_star_choose_version`：ETF 整数版本号。只接受当前开放的版本，事务内写回模块 92；
  重复选择同一版本返回 `changed=false`，不重复写库。
- `31052 req_up_star_gift_award`：解析 `pb_up_star_gift_req`，校验 `ids` 非空、正整数、去重、上限 100，
  校验当前选中版本仍在活动窗口内，然后因 `UpStarGiftTable` 缺失返回 code 5 与具体原因，且不写领取位。

### 网关与拒绝清单

- `gateway.mjs`：新增 import、服务实例、登录同步调用（模块 92 打包前）和派发分支；
  `31052` 走 `unpackRequest('pb_up_star_gift_req', ...)`，`31053` 走 ETF 单整数。
- `benefit-commerce-service.mjs`：移除 `PAY-UPSTARGIFT` 的整族拒绝，保留注释说明由新服务接管。

## 回归

`personal-server/test/up-star-gift-service.test.mjs`（7 项）：

1. 登录同步补齐 `25111` 状态与 `info_list`，保留 66 条历史版本，选中开放版本。
2. 有效选择保留、过期选择修复。
3. `31053` 选择、幂等与重登恢复。
4. `31053` 拒绝未开放/未知版本且不写库。
5. `31052` 校验请求并因缺表返回 code 5，不写领取位。
6. 序列化失败时事务回滚。
7. 真实网关：`31052` 按 protobuf 解码（code 5 而不是 code 1）、`31053` 按 ETF 解码、登录响应里已有
   `25111` 与有效选中版本。

全量 `npm test`（`node --test --test-concurrency=1 test/*.test.mjs`）：2852 项、2850 通过、0 失败、
2 跳过（`duration_ms` 1479467），其中包含本文件新增的 7 项。改完最后一处代码后用同一命令复跑
`up-star-gift-service`、`benefit-commerce-service`、`benefit-commerce-gateway`、`activity-calendar`、
`activity-read-service`、`activity-schedule-audit` 六个文件，40/40 通过。

## REFUSAL_FAMILIES 复核（只算当前可见入口）

方法：用 `ActFrameTable.ActType` 的 `lua_module` 把当前开放活动映射到管理器，再对照拒绝清单；
同时确认这些命令号没有被更早的派发分支接管（`rg` 全仓只有 `benefit-commerce-service.mjs` 命中）。

| 家族 | 命令 | 现在可见的入口（静态配置 + 正式排期） | 证据等级 | 结论 |
| --- | --- | --- | --- | --- |
| PAY-UPSTARGIFT | 31052/31053 | func 25：25042/25051/25053/25056/25072/25073/25074/25075/25111 | 线上登录数据 + 静态 | 本次修复登录/版本；领奖仍缺表 |
| PAY-ACTSHOP | 104801-104803 | ActShopMgr type 182：182007/182010/187314/182503/182604/182212/182608/182817（182810/182817 属百抽子商店，归百抽 agent） | 静态确认 | 入口存在，只有拒绝 |
| PAY-PREMIUMACT | 105401 | PremiumActMgr type 184：16 个（184005/1007002/184304/184305/…） | 静态确认 | 入口存在，只有拒绝 |
| PAY-LINKGIFT | 97401 | LinkGiftMgr type 93：93053/93054/93059/93064/93071 | 静态确认 | 入口存在，只有拒绝 |
| PAY-BUYSKINACT | 104001 | BuySkinActMgr type 175：175003/175005/175007 | 静态确认 | 入口存在，只有拒绝 |
| PAY-APPEARANCERELEASEACT | 98800 | AppearanceReleaseActMgr type 103：103022/103023 | 静态确认 | 入口存在，只有拒绝 |
| PAY-NEWPERMITACT | 107401 | NewPermitActMgr type 1016：1016004/1016005/1019314/1016319 | 静态确认 | 入口存在，只有拒绝 |
| PAY-VICKREYAUCTIONACT | 106101-106102 | VickreyAuctionActMgr type 1008：1008004/1008005/1018014 | 静态确认 | 入口存在，只有拒绝 |
| PAY-SUBSCRIPTIONACT | 107301-107303 | SubscriptionActMgr type 1014：1015005/1015006 | 静态确认 | 入口存在，只有拒绝 |
| PAY-GIFTBOXACT | 106301 | GiftBoxActMgr type 1013：1013004/1013007/1013008 | 静态确认 | 入口存在，只有拒绝 |
| PAY-PERMIT | 35003-35011 | PermitActMgr type 62：188045/188055（35001/35002/35005 已实现） | 静态确认 | 入口存在，仅部分命令可结算 |
| PAY-LEVELSPRINT | 88101 | 67001 等级冲刺1（func 67，ModuleTable 92044 level_sprint） | 静态（活动名与模块路径） | 待验证命令归属 |
| PAY-REBATESHOPACT | 100701 | 138004 神域秘市_返利商店（func 138） | 待验证 | 命令与活动的对应关系未证实 |
| 其余 28 个家族 | — | 当前排期没有对应开放活动 | 静态确认 | 不是当前线上故障 |

说明：`ActFrameTable.ActType` 对 func 67、138 没有行，这两行的管理器是按 `ModuleTable` 的活动名与路径
推断的，标为待验证；“入口可见”也不等于客户端一定会调用被拒绝的命令（例如部分礼包走
`16005` 充值链路），需要客户端请求日志才能把清单收敛成确定故障。

### 同类解码缺陷（已确认，本轮未改）

`benefit-commerce-service.mjs` 的派发统一按 ETF 解包，但下面这些被拒绝的命令实际是 protobuf 请求，
真实客户端发来时会在进入拒绝分支之前先变成 code 1（`Invalid benefit payload`），日志也拿不到
家族与原因：

`102702 98800 99002 99901 101701 104801 104802 104803 105401 105901 106101 106102 107301 107302
107401 35010 35011 101903 104001`（来源：`not-implemented-interfaces.md` 的编码列）。

其中 `104801 req_act_shop_info` 是读取命令，而 type 182 活动商店当前有 8 个开放入口；`107302`、
`106101` 也带读取语义。这一族需要先补 `ActShopTable` / `SubscriptionActTable` / `VickreyAuctionActTable`
才能给出真实数据，本轮没有用空包冒充成功。建议主 agent 把 benefit 派发按命令 schema 解码，
至少让拒绝落在 code 5 与具体家族原因上，并按当前可见入口排优先级。

## 证据缺口与限制

- `31052` 仍不可结算：没有 `UpStarGiftTable` 就无法知道每个 id 的达标条件、奖励和限购，不能宣称
  “升星礼包可领取”。补齐后需要把 `award()` 的拒绝分支替换为按 `award_bin` 位图写领取位并真实发奖。
- 没有客户端 UI/请求日志，无法证明用户看到的空白就是独立升星而不是百抽 `1102008/theme104` 的升星页；
  后者由另一 agent 负责，本轮未改百抽服务。
- 默认选中“开窗时间最新的开放版本”是客户端语义推断；如果拿到 UpStarGiftMgr 的 Lua 证据，应核对它
  是否在 `cur_choose_version=0` 时自行选择，再决定是否保留该默认值。
- 共享文件改动只有 `gateway.mjs`（import、实例、登录同步、派发）与 `benefit-commerce-service.mjs`
  的一行拒绝项；合并时注意与其它 agent 的网关改动相邻。
- 上述 protobuf 命令在 benefit 路径按 ETF 解码的问题仍然存在（本轮只修了 31052 一条），
  读取类入口（104801/107302/106101）的空白与报错需要单独排期。
- 本轮未部署、未重启线上服务、未做 APK/用户视觉验收。
- 本 worktree 的 `personal-server/node_modules` 是指向线上 release 共享依赖的软链接（便于复跑测试），
  已在 `.git/info/exclude` 排除，未进入提交。

