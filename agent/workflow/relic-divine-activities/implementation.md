# 圣器天池与神灵降世实现记录

更新时间：2026-11-01

基线：`feature/relic-divine-activities` / `45c0b21d59dddf8487b50489ba54cfaf0d1723f8`。任务开始前的工作区改动已登记并原样保留。

## 2026-11-01 登录幻武护佑引用自愈

状态：已部署，客户端重登成功。

重启服务后，客户端反复完成 TCP 握手，但 `909103` 登录初始化在模块 518 校验时抛出 `Fantasy equipment cannot bless itself`，网关没有发送登录回包。旧库存有 10 件幻武，`max_equip_id=10`；其中 4 条护佑引用指向自身、2 条引用不存在的 UID 11、8 条把同一护佑 UID 重复分配给多件主装备。

修复位于 `fantasy-equipment-inventory.mjs` / `fantasy-equipment-service.mjs`：`ensureLoginState()` 在严格校验前执行幂等引用修复，保留每个护佑 UID 的首个合法所有者，删除自引用、缺失 UID、重复 UID 和非法值。修复只改 `bless` 列表，保留全部装备主体、等级、星级、UID 水位线及模块 518 的编队/抽取块；同一状态第二次登录修复数为 0。

- 回归：`npm test` 全量 **519/519** 通过；新增用例覆盖自引用、缺失 UID、单条与跨装备重复、装备字段和水位线保留、SQLite 重开及幂等性。
- 实机：服务从 PID `41656` 切换到 PID `44688`，五个端口仍仅监听 `127.0.0.1`。客户端自动重连后，`18:16:33.693Z` 记录修复 14 条非法引用，`18:16:33.848Z` 发出 `login_sent`（146 模块），随后正常响应 8000/7000/1202 等命令；用户确认“连上了”。
- 数据：修复前一致备份 `p3/equipment-login-fix-20261101/game.pre-fantasy-bless-repair.local-only.sqlite`，SHA256 `f0cf4fed21f37475c73c2c075b18a866276af02002d3c2fc28893513daa03caa`；修复后备份 `game.post-fantasy-bless-repair.local-only.sqlite`，SHA256 `0be806bea2349e026ae1513e509eed3ed94d2046ecde43d30a5df6dc261e9f9d`，`integrity_check=ok`，10 件装备与 `max_equip_id=10` 均保留。验收摘要见同目录 `acceptance.local-only.json`。

## M1 共享幻武库存

状态：专项完成，等待 M2–M6 集成验收。

实现文件：

- `personal-server/game/fantasy-equipment-inventory.mjs`
- `personal-server/config/game-tables.mjs`：加载 `ItemTable.Chip`，建立 `FantasyChipByPointItem` / `FantasyChipByTid` 只读索引。
- `personal-server/test/fantasy-equipment-inventory.test.mjs`

关键结论：

- `ItemTable.Chip` 包含 32 条 `type=223` 幻武晶片；`point_item` 指向成品，`need_num` 为每件成品所需晶片数。
- `isUnique` 只认 `FantasyEquip.type=2` 且 `hero>0`；`isSpGod` 只认 `type=3`，不按品质猜测。
- 库存 API 包含 `read/save/ensure/validate/empty/find/findUid/create/remove/clone/addRaw/consumeRaw/rawQuantity/snapshot/mutate/assertCanRemove/referenceDetails`。
- 库存层不自开事务；调用方必须在同一个 `store.transaction()` 内完成资源、英雄、编队、活动状态、模块 518 和 PB 编码。
- `ensure()` 只初始化模块 518 第 0 块，第 1/2 块逐字节保留。

验证：M1 专项 10/10；与 M2/draw 合并专项 41/41。

## M2 FantasyEquipCmd `876xx`

状态：主体、规则审计和专项测试完成，等待 M6 网关集成与真实客户端验收。

实现文件：

- `personal-server/game/fantasy-equipment-service.mjs`
- `personal-server/game/fantasy-draw-service.mjs`
- `personal-server/test/fantasy-equipment-service.test.mjs`
- `personal-server/test/fantasy-draw-service.test.mjs`
- `personal-server/test/fantasy-equipment-inventory.test.mjs`

已完成命令：`87601`、`87603–87611`、`87613–87618`。没有空成功分支。

请求与响应映射：

| 命令 | 请求 schema | 响应 schema / 行为 |
|---|---|---|
| 87601 | `pb_fantasy_equip_put_on_req` | `pb_fantasy_equip_put_on_rsp` |
| 87603 | `pb_fantasy_equip_take_off_req` | `pb_fantasy_equip_take_off_rsp` |
| 87604 | `pb_fantasy_equip_bless_req` | `pb_fantasy_equip_bless_rsp` |
| 87605 | `pb_fantasy_equip_id` | `pb_fantasy_equip_dev_rsp` |
| 87606 | `pb_fantasy_equip_level_up_req` | `pb_fantasy_equip_level_up_rsp` |
| 87607 | `pb_fantasy_equip_composite_req` | `pb_fantasy_equip_composite_rsp` |
| 87608 | `pb_fantasy_equip_dev_req` | `pb_fantasy_equip_dev_rsp` |
| 87609 | `pb_fantasy_equip_composite_req` | `pb_fantasy_equip_composite_rsp` |
| 87610 | ETF 单个 tid、tid 数组或 `{tids}` | `pb_res_to_client`；同事务创建模块 518 装备 |
| 87611 | `pb_fantasy_equip_lineup_custom_req` | `pb_fantasy_equip_lineup_custom_rsp` |
| 87613 | `pb_fantasy_equip_lineup_one_key_req` | `pb_fantasy_equip_lineup_one_key_rsp` |
| 87614 | `pb_fantasy_formation_list` | ETF fallback `1` |
| 87615 | `pb_fantasy_awakening_req` | `pb_fantasy_equip_dev_rsp` |
| 87616 | `pb_fantasy_awakening_req` | `pb_fantasy_equip_dev_rsp` |
| 87617 | `pb_fantasy_equip_draw_wish_req` | `pb_fantasy_draw` |
| 87618 | ETF 单个购买量 | `pb_fantasy_equip_draw_buy_rsp` |

核心规则和证据：

- `87601/87603` 严格用英雄 TID 匹配；跨英雄换装同时更新原持有人、新持有人、编队和自定义编队。
- 普通升星消耗材料总价值；超额价值按点写入 `1100119`。`need_cost=0` 时不接受材料。
- 普通满星走 `87609`，由 `FantasyQualityUp.next_quality_item` 决定目标成品，成功后 `star=0/star_node=0`。
- 专属/SP 使用 `FantasySpStarUp`。专属每次消耗 `cost_num`，SP 每次消耗 `ur_cost_num`。
- 客户端 `times=0` 按服务端一步处理；`args` 只能缺省或空数组。
- 专属星石按 `FantasyStarStoneTid[camp].item` 逐项扣除；`stone_tid` 已在该集合中时不重复扣。SP 只扣 `sp_god_stone_tid/sp_god_stone_num`，不再叠加专属星石。
- q60 SP 品质升级到 q70 时保持原 UID/TID，设置 `quality=70/star=5/star_node=0`；可继续 `87616`。q70 的独立 TID 是新神灵模板，不是 q60 升级映射。
- `87615/87616` 的空 `cost_list` 合法；非空时必须与服务器计算成本完全一致。
- `87610` 按 `ItemTable.Chip.need_num` 扣晶片并创建实例；非法批量、重复 tid、资源不足和并发只有一个请求成功。
- `87611/87613` 对装备归属、祝福槽、品质、英雄和编队类型做服务端校验；一键编队全有或全无。
- 模块 518 固定保持第 0/1/2 块为 `pb_fantasy_equip_res`、`pb_fantasy_formation_list`、`pb_fantasy_draw`。

错误码：1 非法参数/伪造成本，5 配置或持久化数据损坏，301 资源不足，305 解锁条件不足，306 装备不存在，307 容量/上限，308 业务状态不允许。

事务与持久化：所有库存、资源、英雄、编队、抽卡购买/心愿和模块 518 写入均在同一 SQLite 事务；响应 PB 编码在提交前执行，编码或 SQLite 写失败完整回滚。装备 UID 水位、祝福、编队、raw 数量、心愿、购买次数及每日状态均重建服务后可恢复。

验证命令与结果：

```powershell
cd personal-server
node --test test/fantasy-equipment-service.test.mjs test/fantasy-equipment-inventory.test.mjs test/fantasy-draw-service.test.mjs
```

结果：41/41 通过。覆盖正常 PB、非法/伪造参数、资源不足、上限、重复、并发、编码/SQLite 异常回滚、重启恢复和模块 518 块隔离。

全量测试当前阻塞：worktree 中既有测试夹具 `analysis/experiments/private-server-20261025/p3/wallet-admin-20261025/handoff-game.local-only.sqlite` 的 `user_version=10`，本分支 `game-store.mjs` 仅接受到 9，导致 44 个既有测试在打开夹具时失败。该问题不属于 M1/M2 测试，M7 必须选择兼容夹具或审查集成对应存储迁移后再跑全量，不能忽略。

未证假设：活动试炼占用通过 `extraReferences` 补充；生产 APK 的完整展示和真实请求时序仍待 M6–M7 验收。

## M3 标准 601 三池分流

状态：专项完成，等待 M4/M5 活动回调与 M6 网关接线。

实现文件：

- `personal-server/game/fantasy-shared-draw-service.mjs`
- `personal-server/game/artifact-draw-pool.mjs`
- `personal-server/game/demigod-draw-pool.mjs`
- `personal-server/game/resident-fantasy-draw-pool.mjs`
- `personal-server/test/fantasy-shared-draw-service.test.mjs`

对外接口：`supports601(drawLib)` 与 `execute601(request)`。执行入口只创建一个 SQLite 事务；奖池、活动回调、`hero_draw_back` 编码和事务提交任一失败都会完整回滚资源、库存、任务/活动状态及抽数。

分流：

- 圣器天池：`ArtifactDrawVersion.draw_lib` 的无歧义版本集合；当前测试覆盖 `181`，并用活动 `assertOpen` 注入窗口。
- 神灵降世：`DemigodDraw.draw_lib`；同一 `draw_lib` 有多个版本时必须通过 `resolveVersion` 明确选择，否则返回 `305`。
- 常驻幻武：`HeroTable.Draw` 的 `226`，状态同时写入模块 518 第 2 块 `pb_fantasy_draw`。

服务端规则：

- 请求只提供池、抽数、成本选项和附加参数；成本、权重、奖励、保底和实例 UID 均由服务端表与随机源决定。
- 普通/保底权重与奖励组来自 `DrawLibWeight` / `DrawGroup`；抽取前校验所有组、总权重和奖励数量。
- 圣器、神灵累计抽数、保底、日计数、刷新时间和版本状态保存在 `model.state.fantasyDrawPools`，随 SQLite 角色 metadata 恢复。
- 常驻幻武持久化 `total_draw_times`、`wish_fail_times`、`wish_list`、每日购买余量；心愿概率使用服务端 `wish_ratio`，失败递增、命中清零。
- 幻武实例通过 M1 inventory 创建，回包 `pb_res_change.diff_num` 为实例数，`extra` 为单实例 `pb_fantasy_equip`。
- 模块 518 第 0/1/2 块在常驻抽卡中独立保存，编队块不被覆盖。

错误码：1 请求非法，5 抽卡配置或奖池结构错误，301 资源不足，305 活动关闭/版本歧义/未解锁，306/307/308 由库存状态返回。

验证命令与结果：

```powershell
cd personal-server
node --test test/fantasy-equipment-service.test.mjs test/fantasy-equipment-inventory.test.mjs test/fantasy-draw-service.test.mjs test/fantasy-shared-draw-service.test.mjs
```

结果：M1–M3 合并专项 56/56 通过，其中 M3 为 15/15。覆盖注册冲突、三池分流、版本歧义、伪造成本、概率/保底边界、十连、心愿、唯一 UID、模块 518 分块、并发串行、编码/SQLite 异常回滚和重启恢复。

明确假设：

- 静态恢复的神灵/常驻 `DrawGroup.lib_range` 为空，生产接线必须由 M5/M6 注入有证据的奖励组；不得用等概率假数据替代。
- 圣器活动窗口和神灵版本选择通过注入解析器确定；未注入时只接受无歧义静态映射。
- 常驻心愿覆盖发生在普通奖励组生成之后，再按 `wish_ratio` 替换；该覆盖顺序仍待真实客户端验收。
- 601 协议无请求 ID，服务端可通过串行事务防止并发超扣，但无法把用户主动重复发出的相同 PB 识别为同一幂等请求。

## 存储 schema 10 修复

外部 SQLite 夹具已经使用 schema 10，旧分支只接受到 9，导致 44 个既有测试在打开夹具时失败。已在 `personal-server/storage/game-store.mjs` 接受到 10，并幂等创建 `pending_rewards` 表、索引和 `pending-rewards-v10` 迁移；相关 schema 断言已同步到 10。修复后 M5 子任务首次运行全量为 310/310 通过，M7 仍须在最终集成后重跑。

## M4 ArtifactDrawActCmd `101801–101806`

状态：M4 实现与总控复核完成，等待 M6 网关/登录接线及 M7 真实链路验收。

实现文件：

- `personal-server/game/artifact-draw-act-service.mjs`
- `personal-server/test/artifact-draw-act-service.test.mjs`

六条命令均返回精确 schema：

| 命令 | 请求 | 响应 |
|---|---|---|
| 101801 | `pb_req_artifact_trials_daily_reward_req` | `pb_res_to_client` |
| 101802 | `pb_artifact_draw_task_award_req` | `pb_artifact_draw_task_award_rsp` |
| 101803 | `pb_artifact_fragments_draw_req` | `pb_artifact_fragments_draw_rsp` |
| 101804 | `pb_artifact_fragments_new_turn_req` | `pb_fragments_draw_info` |
| 101805 | `pb_artifact_fragments_claim_req` | `pb_artifact_fragments_claim_rsp` |
| 101806 | `pb_artifact_fragments_synthesis_req` | `pb_artifact_fragments_synthesis_rsp` |

证据与规则：

- `Activity` 中 `func=159` 的真实活动为 `159001–159014`，各自 `version=1–14` 映射 `ArtifactDrawVersion.tid=1–14`。公共命令和登录只接受真实活动 ID；版本号仅供 M3 内部事件使用，且必须唯一解析到真实活动，无法唯一解析时 fail-closed。
- `ArtifactDrawActMgr.GetTaskIndex(taskId)=taskId % 1000`；每日、周期和试炼奖励位各自独立，不再使用 `actTid*1000+taskId`。
- `101803` 的格子、轮次、次数、消耗、炸弹和特别奖均由服务端表/随机源决定；客户端伪造 `cost_tid/draw_times/awards/got_special/bomb` 无效。
- `101804` 仅在回合已结束且本轮奖励已领取后进入下一轮；重复结算或最终轮后继续结算拒绝。
- `101805` 只能领取一次；并发请求只有一个成功。`101806` 只在活动已结束、最终奖励已领且碎片足够时合成，重复合成拒绝。
- 每日边界按服务端 05:00 刷新；活动运行状态、轮次、翻格、领取位、任务计数、碎片、合成和抽卡累计均写入 SQLite `artifactDrawActs`，重启恢复。
- 所有资源、幻武实例、模块 518 块 0 和活动状态写入、PB 编码在同一事务内；编码或 SQLite 异常完整回滚。模块 518 的块 0/1/2 分别保持 `pb_fantasy_equip_res`、`pb_fantasy_formation_list`、`pb_fantasy_draw`。
- 登录 payload 只返回未包装的内层 `pb_artifact_draw_player_list` / `pb_artifact_draw_server_list`，并明确模块 183、`pb_act_role_login` 条目和 `0x836d + uint32BE length` 外层包装证据；M6 负责合并条目，不能覆盖其他活动。

验证命令与结果：

```powershell
cd personal-server
node --test test/artifact-draw-act-service.test.mjs
```

总控亲自重跑为 18/18 通过。六条命令逐项覆盖正常 PB、非法活动/ID/index、伪造参数、资源或资格不足、活动关闭、重复/并发、PB 编码异常、SQLite 异常回滚和重启恢复；另验证跨日刷新、领取位图、轮到来顺序、合成门槛、M3 回调伪造版本、模块 183 不覆盖及 518 三块隔离。

## M5 DemigodActCmd `983xx` 与 FantasyEquipActCmd `889xx`

状态：M5 实现、生产表接入、总控复核完成；等待 M6 网关/登录容器/推送接线与 M7 真实链路验收。

实现文件：

- `personal-server/game/fantasy-act-tables.mjs`
- `personal-server/game/fantasy-act-shared-service.mjs`
- `personal-server/game/demigod-act-service.mjs`
- `personal-server/game/fantasy-equip-act-service.mjs`
- `personal-server/test/demigod-act-service.test.mjs`
- `personal-server/test/fantasy-act-shared-service.test.mjs`
- `personal-server/test/fantasy-equip-act-service.test.mjs`
- `personal-server/test/m5-command-matrix.test.mjs`

命令与精确回包：

| 命令 | 行为 / 响应 |
|---|---|
| `98301/98302/98303` | 日弹珠、大奖弹珠、试炼奖励，`pb_res_to_client` |
| `98304/98305` | 试炼主幻武、祝福整表替换，精确 wear / wear bless PB |
| `98306` | 服务端复制幻武实例并生成新 UID，`pb_demigod_act_trial` |
| `98307` | 抽卡累计奖励，`pb_demigod_act_draw_award_back` |
| `98308` | 心愿选择，ETF fallback `1` |
| `88922/88924/88927/88928` | 日弹珠、心愿、服务端投票选奖、试炼奖励 |
| `88929/88930/88931` | 试炼主幻武、祝福、复制，精确活动 PB |
| `88932` | 活动任务领奖；生产表为空时明确 `306 Unknown fantasy activity task` |

真实生产映射与数据结论：

- Fantasy 的 `Activity.func=74` 真实 ID 为 `74001..74005`，一一映射业务版本 `1..5`；Demigod 的 `Activity.func=102` 真实 ID 为 `102001..102038`，一一映射业务版本 `1..38`。公开命令与登录初始化只接受真实活动 ID，内部 M3 提交事件可以显式传业务版本，但会唯一反解到真实活动 ID。
- `func=98` / `980xx` 不并入神灵降世；其版本数量和名称与 `DemigodAct` 契约不一致。
- 表数量：Fantasy `Task=0`、`DrawWish=42`、`Draw=5`、`Pre=5`、`PreShow=30`、`Trial=12`、`TrialDamage=72`；Demigod `DemigodAct=38`、`Draw=38`、`DrawAward=454`、`Trial=73`；`MarblesConst=1`、`Marbles=162`、`max_run_time=12`。
- `88927` 不接受客户端候选或奖励。服务端按当前版本 `PreShow` 权重选出生效幻武，再按 `Pre` 的完整 AwardKit 发奖；客户端只收到服务端结果。
- `88932` 只有真实配置任务才能领奖。生产 Fantasy Task 为空，因此生产导入时返回 `306`；正常领奖路径只能用测试注入的任务定义验证，不能伪造生产任务或空成功。

规则、事务与持久化：

- 每日刷新按北京时间 05:00；每日弹珠、奖励位、心愿、试炼、任务、抽数、保底相关累计和版本状态写入 SQLite `model.state.fantasyActState`，重启恢复。活动切期清空当期状态并保留 lifetime。
- `assertOpen` 在创建状态和消费资源之前执行；关闭返回 `305`，不留下空活动状态。
- 试炼伤害、抽数和任务进度只接受服务端 `recordTrialDamage`、`recordDraw`、`recordTaskEvent` 记录，客户端提交的次数、伤害、进度或奖励无效。
- 试炼装备校验真实 UID/TID、英雄、类型、品质和槽位；活动占用通过 M2 的 `extraReferences` 阻断普通穿戴，跨活动重复占用被拒绝。复制通过 M1 生成新 UID 并清空祝福引用。
- 库存、资源、活动状态、模块写入和响应 PB 编码位于同一 SQLite 事务；编码异常、SQLite 写失败和校验失败均回滚。
- M5 只返回三个未包装登录块；M6 负责模块 183 的条目合并与 `0x836d + uint32BE length` 包裹。Demigod 顺序为 `pb_demigod_act`、`pb_demigod_act_trial_data`、`pb_marbles_award_info`；Fantasy 顺序为 `pb_fantasy_equip_act`、`pb_fantasy_equip_act_trial_data`、`pb_marbles_award_info`，最终顺序仍需 M6 与真实容器证据核对。

验证命令与结果：

```powershell
cd personal-server
node --test test/demigod-act-service.test.mjs test/fantasy-act-shared-service.test.mjs test/fantasy-equip-act-service.test.mjs test/m5-command-matrix.test.mjs
npm test
```

总控亲自重跑 M5 四个专项为 40/40；全量先前暴露并修复了并发测试在建库阶段争 SQLite 锁的问题，修复后由总控重跑全量为 344/344。16 条命令逐项覆盖正常 PB、非法活动/ID/数量、伪造参数、资格或资源不足、活动关闭、重复/并发、PB 编码异常、SQLite 回滚和重启恢复。

尚未完成：M6 的 request schema、网关、模块 183、三方推送；M7 的真实 TCP 和隔离 APK/UI。公开 APK 中 `88927` AwardKit 解释及 `88932` 因生产任务表为空的可达性也必须在真实客户端验收中确认，当前不能称可玩验收完成。

## M6 登录容器、网关与推送

状态：实现和总控复核完成；等待 M7 综合链路与设备验收。

实现文件：

- `personal-server/game/gateway.mjs`
- `personal-server/game/relic-divine-login.mjs`
- `personal-server/test/relic-divine-gateway.test.mjs`

网关接入：

- `601` 在普通招募之前判断 M3 分流，服务端按 `draw_lib` 选择圣器、神灵或常驻幻武池；成功后按池发送 `7001 / pb_fantasy_equip_act_draw`、`9160 / pb_demigod_act_draw_back` 或 `10101 / pb_fantasy_draw`，失败抽取不推送。
- M2 的 `87601`、`87603–87611`、`87613–87618` 均有真实网关分支；`87610` 和 `87618` 使用 ETF 参数，其余使用对应 protobuf schema。
- M4 的 `101801–101806` 使用精确请求 schema 路由到活动服务。
- M5 的 `98301–98308` 与 `88922/88924/88927–88932` 已按无参数 ETF、标量 ETF、PB 三类请求解码后路由。

登录容器：

- 模块 183 保持客户端 ETF binary 列表结构，每个活动块使用 `0x83 0x6d + uint32BE length + protobuf` 包装。
- 同活动原位替换；模块中的其它活动、server list 和额外模块值逐字节保留。损坏包装和长度越界返回业务码 `5`。
- 神灵登录块顺序为 `pb_demigod_act`、`pb_demigod_act_trial_data`、`pb_marbles_award_info`；幻武活动顺序为 `pb_fantasy_equip_act`、`pb_fantasy_equip_act_trial_data`、`pb_marbles_award_info`。
- 模块 518 继续固定为第 0 块 `pb_fantasy_equip_res`、第 1 块 `pb_fantasy_formation_list`、第 2 块 `pb_fantasy_draw`；专项验证登录和抽取不覆盖第 1 块。

验证命令与结果：

```powershell
cd personal-server
node --test test/relic-divine-gateway.test.mjs
npm test
```

总控亲自重跑：网关专项 2/2；M1–M5 合并专项 114/114；全量 346/346，0 失败、0 跳过，约 44.5 秒。网关专项通过真实 loopback TCP 握手、登录、三类 `601`、全部 M2/M4/M5 命令进入对应服务、成功推送、失败不推送及 SQLite 重启恢复。

仍未完成或未证实：

- 生产数据中神灵与常驻幻武的 `DrawGroup.lib_range` 为空；没有证据确认的 `relicDrawGroupResolver` 时两池会 fail-closed，生产入口尚不能直接完成这两类抽取。
- 生产 Fantasy Task 表为空，`88932` 当前只能返回 `306`，不能伪造任务或空成功。
- M2 网关专项只证明 16 条命令均进入服务；每条正常业务成功路径由 M2 服务专项覆盖，尚未全部通过真实 TCP 执行成功路径。
- 三路推送只证明服务端生成并发送，客户端是否接收、时序和 UI 刷新尚未验收。
- M7 的真实 TCP 全链路矩阵、隔离 APK `com.jzyx.ps` 和 UI 验收尚未完成。

## 2026-11-01 合并收口（覆盖上方旧合入判定）

状态：用户明确要求跳过 M7，并将当前功能合入本地 `main`。本节覆盖上方“当前不能合入”的旧判断；M7 被主动放弃，不代表通过。

- M1-M6 已提交为 `ce02b64`。随后把本地主线 `f8f86b1` 合入本分支，`gateway.mjs` 冲突按双方功能并集解决：保留主线充值、队长装备、小屋、时间神殿、活动等路由，同时加入幻武、圣器天池、神灵降世、`601` 三池、模块 183 和 518 接线。
- 合并后修复了 3 个确定性回归：升星石按权威英雄阵营读取；神器奖励按模块 50 的实际客户端域验证；`87618` 由主线 `recruit-service` 原子购票并抽取，同时修复抽取实例的幻武品质和祝福字段，确保登录恢复能通过库存校验。
- 总控在合并工作树亲自运行 `npm test`：`518/518` 通过，`0` 失败、`0` 跳过，耗时约 53.6 秒。网关合并专项 `34/34` 通过，使用真实 loopback TCP 握手和帧编码。
- 未纳入提交的 `personal-server/test/relic-divine-tcp.unverified.mjs` 是中断的 M7 草稿，不属于 `*.test.mjs`，不得计入上述结果，也不得提交。
- 本次只完成本地分支合并，没有 push、merge 到远端、同步 `apk/` 或提交 APK。未执行隔离包 `com.jzyx.ps` 的真实 APK/UI 验收，未操作 `com.jzyx.my`。

保留的生产限制：神灵和常驻幻武生产 `DrawGroup.lib_range` 为空，缺少证据确认的 `relicDrawGroupResolver` 时 fail-closed；生产 Fantasy Task 表为空时 `88932` 返回 `306`；三路推送和真实 APK 接收/UI 刷新未验收。因此当前状态是“M1-M6 组件与真实 loopback TCP 回归通过、已按用户要求合入本地 main”，不是“圣器天池和神灵降世可玩验收完成”。
