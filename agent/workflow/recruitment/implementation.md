# 招募功能实现

日期：2026-10-29

## 本次范围

- 工作分支：`feature/recruitment`
- 工作目录：`F:\projects\FateCovenantClone\.worktree\recruitment`
- 根因：网关没有处理 `599/600/601`，购买抽卡券和抽卡均返回 `LOCAL_NOT_IMPLEMENTED`；同时客户端 `HeroDataMgr:DrawNumLimit` 在招募记录存在时直接读取 `daily_can_draw_num`，旧记录缺少该字段会表现为 0 次可抽。
- 已实现普通招募、高级招募、友情招募、心愿招募，以及心愿选择/取消、招募支持数据和跑马灯读取。
- 未部署到运行中的服务，未操作模拟器、客户端或原版 `com.jzyx.my`。

## 协议与数据

- `599 req_draw_buy_magic_scroll`：高级抽卡券 `3002`，单张 800 钻石，每日 60、终身 600。
- `600 req_draw_buy_normal_scroll`：普通抽卡券 `2002`，单张 250 钻石，每日 1200、终身 8000。
- `601 draw_hero`：支持库 `1` 普通、`2` 高级、`3` 友情、`10` 心愿。正数 `point_draw_num` 优先；否则 `draw_type=1` 使用配置的最大连抽数，其余为单抽。
- `642/643/657/658`：读取并持久化普通心愿和扩展心愿的英雄、槽位。
- `651/652`：返回空的角色/服务器支持列表。
- `673`：返回空的自定义跑马灯数据。
- `DailyCanDrawNum`：与客户端 `HeroDataMgr:DrawNumLimit` 对齐。高级招募初始 `1,000,000` 次，心愿招募初始 `10,000` 次；抽卡后扣减，跨天按 `HeroTable.DrawNumLimit` 恢复。

首次解锁时，`decompose_args.extra` 仍是 ETF 编码的英雄 TID；资源变化 `pb_res_change.extra` 则是 ETF 二进制列表，元素为 protobuf `hero`。英雄本体、碎片和招募计数均在同一个 SQLite 事务内写入；重复英雄按 `Quality.convert_piece_new` 转换为碎片。

> 2026-10-31 覆盖：首次解锁不再写 `decompose_args`。完整碎片包和 `change.extra` 已分别负责结果卡与即时英雄对象；再追加 `decompose_args` 会让同一英雄生成两张卡，十连出现新英雄时超出结果页 10 个槽位并触发 `Transform child out of bounds`。

> 2026-10-30 修复：新英雄也必须按 `Quality.convert_piece_new` 发放碎片包，不能只发 1 个碎片；否则 `HeroDrawUILogic.FilterAwards` 的 `floor(num / convert_piece_new)` 为 0，结果页会以 `executeCount = 0` 崩溃。详见 [fixes/recruit-result-no-card.md](../fixes/recruit-result-no-card.md)。

## 持久化与限制

- 招募信息保存在 module 10 的 `pb_hero_draw_info`；普通/高级购票信息分别保存在 module 10 的索引 9 和 10。
- 每日和终身购票次数保存在角色 metadata，重开数据库后继续生效。
- 新英雄写入 `heroes` 表，资源写入 `resources` 表；编码或 SQLite 写入失败会整体回滚。
- 普通/高级保底分别读取 `Guaranteed[1/2]`，友情和心愿读取 `Guaranteed[85/10]`；保底品质由对应池规则决定，不再把所有 `quality >= 50` 当成同一特殊组。
- 客户端配置的 `Group 101/102/103/110` 奖励明细仍为空，无法恢复原服成员和概率。2026-10-31 起各库改用显式本地兼容规则，不再使用 77 名全英雄公共池。
- 心愿英雄实际保存在 `lib=2` 的 `wish_hero_list/extra_wish_list`；服务端按精英池规则校验，库10保留为独立招募库。

## 验证

- `npm test --prefix .\personal-server`：`211/211` 通过。
- 新增招募专项测试覆盖：两种购票、钻石不足、购买上限、四库消耗、每日可抽次数、单抽/连抽、新英雄与重复英雄、登录模块中的新英雄恢复、保底跨重启、编码失败回滚、心愿与辅助读取、空跑马灯。
- `gameplay-gateway.test.mjs` 使用临时 loopback 端口和数据库副本完成真实帧 `600 -> 601`，确认 ETF 购票请求、protobuf 抽卡、资源扣除和响应均可解码。
- 当前仅为组件和临时 TCP 验收，不代表真实 APK 招募画面和动画已通过。后续部署后需由用户在隔离客户端验证四种招募、新英雄展示、重复转碎片、重启后次数和保底。

## 复现

```powershell
cd F:\projects\FateCovenantClone
npm test --prefix .\personal-server
```

## 2026-10-31 冒险十连空白与圣装招募修复

- 冒险池空白根因：十连中每名首次获得的英雄会同时产生完整碎片资源变化、即时英雄 `extra` 和 `decompose_args`；客户端把后两者都计作结果卡，导致十连出现 12/13 张卡，而 `HeroDrawResultShowForm` 只有 10 个槽位，最终在 `ShowDrawCard` 抛 `Transform child out of bounds`。现在 `decompose_args` 始终为空，首次英雄仍完整发放碎片、即时英雄对象并写入数据库，恰好生成 10 张卡。
- 圣装入口根因：功能位 `1348` 未开放时 `LeaderEquipDrawMgr.GetCurLib()` 返回 `nil`，`HeroDrawForm` 随后回落到普通冒险库；`HeroTable.Draw[116..121].fun_open=1322` 也未开放。`sprintPreview` 现在同时开放 `1322/1348`，重启后会持久写回登录模块。
- 圣装 `601` 现在识别 `draw_lib=116..121`，按 `LeaderEquipTable.Grade.draw_lib` 与 `LeaderEquip.grade` 选择当前阶级装备，消费 `Draw` 配置的 `2002`，每个结果返回一个唯一 `pb_leader_equip`，同事务更新模块 175 的 `equip_list/max_uid`。
- 本地奖池暂以对应 grade 装备等权抽取；现有 `DrawTable.Group` 未导出 `lib_range` 和完整原服权重，不能把该规则标为官方概率。
- 定向 `recruit-service.test.mjs` 为 `23/23`，全量 `npm test --prefix .\personal-server` 为 `291/291`，`git diff --check` 与语法检查通过。当前代码尚未部署到 PID 4488；用户测试结束后重启服务，再做真实 APK 的两项验收。

## 2026-10-31 各池独立规则修复

根因：`recruit-service.mjs` 对所有 `lib` 共用一套 `30/40/50/60/70` 品质权重和同一个 `Hero.chip > 0` 英雄池，`drawOne()` 也不接收池规则，因此精英 `lib=2` 可以产生超凡品质70；日志已在 `2026-10-30T04:49:30.919Z` 和 `2026-10-30T04:49:41.349Z` 分别记录奈奈子 `5040601/quality=70` 与弥撒 `1040101/quality=60`。这些角色来自错误抽取，不是 agent 手工写入测试角色。

新增 `personal-server/game/recruit-pool-rules.mjs`，当前本地兼容矩阵为：

| lib | 池 | 品质权重（30/40/50/60/70） | 保底 | 门槛/能力 |
|---:|---|---|---|---|
| 1 | 冒险 | 50%/30%/15%/5%/0 | 50抽，至少50品 | 品质60在累计100抽后开放 |
| 2 | 精英 | 35%/45%/18.5%/1.5%/0 | 30抽，至少50品 | 冒险累计30抽解锁；已有抽卡进度兼容保留；心愿在累计100抽后开放 |
| 3 | 友情 | 62%/29%/9%/0/0 | 200抽，至少50品 | 不产生品质60/70 |
| 10 | 独立库10 | 38%/34%/25%/3%/0 | 30抽，至少50品 | 品质60在累计100抽后开放；不产生品质70 |

规则细节：

- 品质60用四个库的 `draw_count` 合计作为累计完成抽数；检查发生在每次单抽之前。完成99抽时不可出，完成100抽后下一次抽取才进入候选。
- 品质70从当前四个基础库全部排除。原错误产生的品质60/70英雄仍在存档中，本轮没有自动删除角色、碎片或资源。
- 冒险/精英/友情使用 `get_way=32/33/34` 的本地普通候选集合；库10使用扩展集合 `32/33/34/77/91/100/502`。客户端动态组仍未给出正式名单，未知项不会回退到全英雄池。
- `drawOne()` 现按池分别选择品质、保底品质和候选英雄。旧全局 `qualityWeights/byQuality/pool` 已移除。
- `guaranteed_special` 与本地规则值做启动校验，不一致时服务拒绝启动。
- `642/643` 主心愿和 `657/658` 扩展心愿只允许 `lib=2`。服务端强制累计100抽、品质50最多2名、品质60最多1名、不可重复且必须属于精英池。抽取命中品质50/60时从对应已选英雄中产生。
- 新存档未完成冒险30抽前，服务端拒绝 `lib=2`；已有 `lib=2` 抽卡进度作为兼容解锁，防止升级后把当前玩家锁在池外。
- 抽取事件新增 `ruleVersion=1` 和每张卡的 `wishHero`，便于后续审计。

验证：

- 招募专项 `10/10` 通过，覆盖四套不同权重、品质70隔离、99/100抽边界、精英30抽解锁和旧进度兼容、品质50/60心愿配额、心愿命中替换及保底。
- 全量 `npm test --prefix .\personal-server` 为 `211/211` 通过。
- 只读核对当前运行数据库：`lib1.draw_count=4`、`lib2.draw_count=50`，合计54，因此品质60仍锁定；`lib2` 已有抽卡进度继续可进入。该库中已有的两名品质50心愿只保留展示，累计100抽前不会参与抽取替换。
- 服务 PID 12980 当前仍有客户端约31秒一次的连接保活；本轮没有停止、重启或部署到运行进程。代码与测试已完成，需在客户端退出或维护窗口重启本机服务后生效。

## 2026-11-07 新英雄限定角色不得进入普通招募池

设计口径修正：`HeroTable.Hero.get_way` 只是获取渠道标记，不能证明角色属于冒险/精英/友情池。梦魅等新英雄限定角色由客户端 `NewHeroExclusiveTable.WishDrawHero` 和独立 `draw_lib` 管理；此前标准池按 `get_way=32/33/34` 猜测成员，会把梦魅 `1030601`、罪欲夜影 `1030701` 以及品质60限定角色 `1040101`、`4040101` 混入普通池。

修复采用数据驱动的角色分组：

- `personal-server/config/new-hero-exclusive-heroes.json` 是从 `NewHeroExclusiveTable.WishDrawHero` 生成的紧凑清单，共 21 名去重角色。当前源 dump SHA256 为 `9609b94138a797877123bdf1d4eb450db5df295058a47a558084db4367bb1723`。
- `recruit-hero-groups.mjs` 校验并加载排除分组；清单缺失、损坏、重复或组为空时启动失败，避免静默放行。
- 冒险 `lib=1`、精英 `lib=2`、友情 `lib=3` 声明排除 `newHeroExclusive`；限定库 `lib=10` 保留该组，因为客户端 `Draw.draw_type=1011` 对应 `NEW_HERO_LIMIT_DRAW`。
- 构建有效池时按规则和排除组过滤，再移除没有候选的品质。当前普通池没有合法的品质60角色，因此品质60权重自动收缩；以后 HeroTable 加入非限定品质60角色时，99/100 抽门槛和原权重会自动恢复，无需再改抽取代码。
- `RECRUIT_RULE_VERSION` 从 1 升到 2，审计日志可区分旧错误抽取。

生成与校验命令（需要客户端 LuaJIT dump 和 HeroTable）：

```powershell
node personal-server/scripts/generate-new-hero-exclusive-heroes.mjs --table <NewHeroExclusiveTable.data.json> --hero-table <HeroTable.data.lua.json[.gz]>
node personal-server/scripts/generate-new-hero-exclusive-heroes.mjs --table <NewHeroExclusiveTable.data.json> --hero-table <HeroTable.data.lua.json[.gz]> --check
```

验证结果：

- `node --test test/recruit-pool-restrictions.test.mjs`：4/4 通过，覆盖清单加载、普通池排除、限定库保留、未来普通品质60自动恢复和缺失分组 fail-closed。
- `node --test test/recruit-service.test.mjs`：27/27 通过，含真实 store/codec 下的100抽边界、品质70隔离、心愿和保底回归。
- 全量 `npm test` 在本 worktree 因未跟踪的分析资产/旧 handoff SQLite 缺失而产生无关失败，包括 `FantasyEquipActTable.data.json` 和 `handoff-game.local-only.sqlite`；不能记为全量通过。
- 本轮未部署、未重启实时服务、未操作设备。

## 2026-10-31 首次角色、招募统计与半神招募修复

工作分支：`fix/recruitment-bugfix-20261031`。基线为 `main@30143e1`；修复位于隔离 worktree，测试通过后部署。

### 首次角色和小队同步

- 每次抽到英雄均按 `Quality[quality].convert_piece_new` 发放完整碎片包。结果为首次解锁时，同一 `pb_res_change.extra` 还携带 ETF 二进制列表，元素是 protobuf `hero`；客户端 `HeroRes.ResChange -> HeroMgr.AddHeroes` 可立即建立英雄缓存。
- 新英雄的 `uid=tid`，并立即写入 SQLite `heroes` 与登录模块 10。修复前裸 ETF 整数 extra 不生成即时英雄对象，且旧 UID 与 TID 不同会导致小队按 TID 查询不到。
- 首次解锁同时写 `decompose_args`，使用碎片 TID、完整碎片数和 ETF 整数英雄 TID；重复英雄不写英雄对象或 decompose 记录。

### 次数、积分和成就

- 每次 type 601 抽取同步 `draw_count`、`daily_draw_count`、`daily_can_draw_num` 和 `draw_num_kv_list`。
- 模块 21 的统计 TID 1 按招募库累计并推送 type 2000；登录时可按保存的 `draw_count` 回填历史统计。
- 招募成就统计 TID 75 取四个本地库 `draw_count` 合计。type 77901 返回自定义统计二进制列表，type 662 事务领取 `DrawAchievementAward[2]`，重复领取拒绝，位图和资源同一事务持久化。

### 半神招募

- 运行日志中的 type 87618 请求体为 ETF 整数列表，例如 `g2EC` 解码为 `[2]`，即客户端请求补买 2 张券；调用链是 `DemigodResidentDrawMgr.ReqDrawBuyDemigod`，回调随后直接调用 `HeroDrawUILogic.HandleDraw`，因此补买和抽取必须在同一请求内完成。
- 状态按客户端 `FantasyEquipMgr.LoginParse` 写到模块 518：索引 0 为 `pb_fantasy_equip_res`，索引 1 为原样保留的 `pb_fantasy_formation_list`，索引 2 为 `pb_fantasy_draw`。旧 `state.demigodDraw` 首次读取时迁移，编队槽不重写。
- type 87618 返回 `pb_fantasy_equip_draw_buy_rsp { res, draw }`。星钻补券、扣券、抽取、幻武 UID 分配、幻武列表和抽取状态均在一个事务内；响应资源变化按 TID 合并，不再发送错误的 10101 推送。
- 每次幻武结果是独立 `pb_res_change`，`diff_num=1`，`extra` 为单个 protobuf `pb_fantasy_equip`。幻武 UID 从 `max_equip_id` 递增并同步回模块 518。
- 配置来自 `DrawNormal[1]`：券 `808002`，星钻 `101500`，单价 400，日限 10、总限 70。type 87617 保存最多 4 个心愿槽；累计 100 抽解锁。`wish_ratio=[5000,10000]` 实现首次 50%、失败一次后必中，命中后失败计数清零。
- `Guaranteed[103].guaranteed_num=40` 写入每抽结果的保底标记并累计总抽数。客户端 `DrawGroup 60101/60102` 为空，无法恢复官方成员/概率，因此候选取 `DrawUnlock` 已解锁 TID，权重取 `FantasyEquip.lucky_value`；这是明确的本地兼容规则，不宣称为原服概率。
- 单抽/五连兼容推断：`buyCount==0` 或“现有券 + 补买数 >= 5”时执行五连，否则执行单抽。实际证据确认了 `[2]` 是补买数量；若 UI 还有未覆盖的组合，实机验收时按请求体和目标按钮继续校正。

### 验证和边界

- 招募+网关定向 `21/21`、全量 `220/220`、`git diff --check` 通过。
- 覆盖首次解锁/重复转换、即时英雄 extra、模块 10 恢复、小队 UID/TID 一致、统计回填和推送、成就防重、半神补券/扣券/幻武入库、UID 唯一、40 抽标记、心愿替换、模块 518 迁移、formation 保留、编码失败整体回滚。
- 尚未完成真实 APK 验收；本轮不修改 APK，不需要更新 `apk/` 快照或 `apk/README.md`。

## 2026-10-31 main 合并与部署

- `main@f32e4ac` 已通过合并提交 `d0cb52a` 合入 `fix/recruitment-bugfix-20261031`。三个冲突文件按两端语义合并：保留 `NormalDrawExchangeLineup`，网关同时传入 `fantasyEquipTables` 与百院招募活动回调，招募事务同时更新本修复的统计/推送和 main 的百院进度。
- 合并暴露的测试接收队列问题已修正：招募现在会发送 type 2000 统计推送，百院真实 TCP 用例改为按请求序号等待匹配回包，不再把队列里的合法推送误当成下一次命令回包。
- 招募、百院、网关定向 `28/28` 通过；合并后全量 `npm test --prefix .\personal-server` 为 `257/257` 通过，`git diff --check` 和冲突标记检查通过。
- 部署前使用 `VACUUM INTO` 创建一致备份 `analysis/experiments/private-server-20261025/p3/recruitment-bugfix-20261031/game.before-main-merge-deploy.local-only.sqlite`：339,968 字节，SHA256 `4fb26305268c72990d44d33e652e7dcf248966673d7ead418d7ec2fbb162a7d0`，schema v10，`integrity_check=ok`，roles=1、heroes=38、resources=69。
- 已从合并后的 worktree 部署个人服务，新 PID `43432`，`startedAt=2026-10-31T10:10:58.430Z`；`18880/18881/18882/18883/19090` 五个端口均由该 PID 在 `127.0.0.1` 监听，`local_server_ready` 已记录，隔离客户端已自动重连到 19090。部署错误日志为空；未停止、重启或点击客户端，未操作原版 `com.jzyx.my`。
- 真实 APK 验收仍待用户在现有隔离客户端执行：首次英雄结果卡与英雄库/小队即时展示、招募次数/积分增加、半神星钻补券后券立即增加并产生幻武结果、特聘/指定招募买券同步，以及重登后的持久化。

## 2026-10-31 特聘券购买即时同步修复

- 用户反馈特聘招募买券后星钻扣除，但特聘券数量没有立即增加。真实请求为 type 599 / seq 25，服务端返回 `recruit_committed`，SQLite 已扣星钻并增加 `3002`；修复前实时余额为星钻 `750`、普通券 `2002=4`、特聘券 `3002=8`，特聘购买计数 `daily=4,total=4`，确认不是购买事务丢失。
- 客户端 `HeroDrawMgr` 的 599 回调依次执行 `AwardKit.Parse(data.res)` 和 `SetMagicDrawBuyInfo(data.buy_info)`。`ResContainer.Change` 在资源对象尚不存在时依赖 `pb_res_change.new_bin` 的完整 `pb_res_obj { tid, num }`；服务端通用物品发放只返回 `tid/new_num/diff_num`，因此券的持久化数量虽已增加，客户端本地容器没有即时创建或刷新。
- `grantResources` 的 `handler.kind === 'item'` 现在同时写 `new_bin: codec.pack('pb_res_obj', { tid, num })`。该路径覆盖普通券、特聘券及背包物品发放；资源消耗逻辑不变。
- 招募回归测试对 type 600/599 的 `2002`、`3002` change 解码 `new_bin`，校验 TID 与购买后的真实余额完全一致。最新 `main@5e354e7` 已通过合并提交 `08e9ad4` 合入修复分支，合并后全量 `271/271` 通过。
- 部署前一致备份为 `analysis/experiments/private-server-20261025/p3/recruitment-ticket-sync-20261031/game.before-ticket-sync-deploy.local-only.sqlite`：344,064 字节，SHA256 `0975ab1d61aef339900c8d0ecadb074b1ee84b64185636397751328272da9463`，schema v10，`integrity_check=ok`。
- 已从修复 worktree 部署 PID `18688`，`startedAt=2026-10-31T10:40:15.125Z`；五端口仅监听 `127.0.0.1`，stderr 为空。隔离客户端在 10:40:20 自动完成握手和登录，`moduleCount=146`，未操作原版包或点击客户端。
- 用户此前购买的券在服务端已存在；现有客户端重连后应以登录数据显示余额。真实即时刷新仍需再次购买验收，当前 UI 是否显示 8 张特聘券也需用户视觉确认。

## 2026-10-31 特聘券 TID 映射纠正（supersedes the preceding ticket note）

- The earlier note called `3002` the special ticket. That was incorrect: the shipped tables define `Draw(2).cost_item=[3002]` as the elite ticket and `Draw(10).cost_item=[4002]` as the special ticket. `HeroTable.TID_MAGIC_DRAW_LIB` is `10`.
- The actual server bug was in `purchase()`: type `599` selected library `2`, so diamonds were charged and an elite ticket was granted. The immediate `new_bin` fix was valid but could not make the special page show a `3002` resource.
- `personal-server/game/recruit-service.mjs` now maps type `599` to library `10`. Regression coverage verifies `599 -> 4002`, `601/draw_lib=10` consumes `4002`, login/module-6 persistence, and transaction rollback. The merged main tree passes `291/291` service tests.
- Runtime remediation added 9 `4002` tickets, matching the persisted type-599 purchase total, while retaining the existing `3002` balance (including normal rewards). Before remediation: `3002=23`, `4002=0`; after: `3002=23`, `4002=9`. The SQLite backup is `analysis/experiments/private-server-20261025/p3/recruit-special-ticket-remediation-20261031/game.before-remediation.local-only.sqlite`, 352,256 bytes, SHA256 `D848D776BB2913CC781C91FE16941B4113848B2CF066F1C49847E2F14A78CA82`, integrity check `ok`.
- The service was restarted from the merged `main` tree as PID `16048` at `2026-10-31T13:06:35.228Z`; all five loopback ports are owned by that PID and the isolated client reconnected. Client-side visual confirmation of the displayed balance and a new purchase remains the final acceptance step.
- The service was restarted from the merged `main` tree as PID `16048` at `2026-10-31T13:06:35.228Z`; all five loopback ports are owned by that PID and the isolated client reconnected. Client-side visual confirmation of the displayed balance and a new purchase remains the final acceptance step.

## 2026-10-31 特聘保底计数与半神券即时同步

- 特聘招募保底看似一直停在 30 次的根因是记录键不一致。`Draw(10).is_record_by_type=true` 且 `draw_type=1011`；客户端 `HeroDataMgr:SetRecruitInfo` 按 `tid` 存储，`GetRecruitInfoByDrawLib(10)` 又通过 `GetRecruitTid(10)` 查找 `1011`，但服务端此前把同一记录写成 `tid=10`。服务端现在对 `is_record_by_type` 库使用 `draw_type` 作为记录 `tid`，同时保留 `draw_lib=10`；启动时的 `ensureLoginState` 会把现有记录规范为 `tid=1011`。普通品质连续抽取会累计 `guaranteed_count`，客户端剩余次数随之为 29、28……；达到 30 次时强制品质 50/60 并归零，这是新一轮保底。
- type 599 特聘购买仍映射到合成库 10，发放特聘券 `4002`，资源回包继续包含与最终余额一致的 `pb_res_obj.new_bin`；type 601/`draw_lib=10` 消费同一张券。
- 半神 87618 的补券与立即抽取曾在同一 `tid=808002` 上合并为净变化 0，旧实现会过滤该变化并保留购买阶段的过期 `new_bin`。`mergeResourceChanges` 现在以事务完成后 `model.resources` 的最终余额重建 `new_num/new_bin`；买 1 抽 1、买 5 抽 5 即使最终券数为 0，也会向客户端返回 `808002` 的零余额资源对象，供 `AwardKit/ResContainer` 建立或刷新库存。
- 定向测试 `node --test test/recruit-service.test.mjs` 为 `24/24`，覆盖 type 599→4002、特聘 `tid=1011` 与三次普通品质保底累计为 3、半神买 1/5 张后的零余额 `new_bin`、持久化与回滚；`node --test test/gameplay-gateway.test.mjs` 为 `3/3`；全量 `npm test` 为 `297/297`。
- 部署前使用 `VACUUM INTO` 生成一致备份 `analysis/experiments/private-server-20261025/p3/recruit-pity-demigod-20261031/game.before-pity-demigod-fix.local-only.sqlite`：360,448 字节，SHA256 `032E7298B89725F56A5BF51D3EF4FBB9AE2E2F3DBF5C254CB8B410B69F32B3F0`，schema v10，`integrity_check=ok`。
- 已从 worktree `F:\projects\FateCovenantClone\.worktree\recruitment-guarantee-demigod-20261031` 重启个人服务。未重启客户端；客户端自动重连。实时 PID `35640`，`startedAt=2026-10-31T14:41:31.479Z`，`18880/18881/18882/18883/19090` 均由该 PID 仅监听 `127.0.0.1`，stderr 为空。启动后数据库中的特聘记录已为 `tid=1011,draw_lib=10`，当前 `draw_count=9,guaranteed_count=0`；`4002=0`、`808002=0`、`101500=7050`，半神累计抽取 10 次。
- 客户端视觉验收待用户完成：特聘连续普通品质抽取时保底剩余数应下降；特聘券购买后应立即显示；半神星钻补券并抽取后应显示幻武结果且招募按钮状态恢复。本次未修改 APK，按持久规则无需新增 APK 快照。

## 2026-11-01 招募四项问题修复

- 工作目录为 `.worktree/recruit-20261101`，分支 `fix/recruit-20261101`，修复基线已 rebase 到 `main@5297c28`。
- 问题 1 按用户最终要求保留客户端原始展示逻辑，不修改 Lua、APK、重复 SSR 的结果展示或动画触发条件。
- 问题 2 的最终规则限定在特聘池：只有本次抽中 `wish_hero_list` 中已选目标时，才清零 `guaranteed_count/high_guaranteed_count`；抽到非目标 SSR，或尚未选择目标时抽到 SSR，都继续累计。冒险、友情和独立心愿库仍按原品质规则刷新 SSR 保底。
- 问题 3 将半神 `87618` 收紧为“仅购券”：按数量扣除星钻、增加 `808002`、更新 `left_buy_times`，不再在同一请求内消费券或生成幻武。购券成功后由客户端原有 `601/draw_lib=226` 路径消费券并触发招募展示；定向测试覆盖购券持久化、随后抽取、幻武 `extra`、模块 518 更新和 `10101` 推送。
- 问题 4 的冲榜领取按 `TaskType.data` 定位模块 21 中对应的统计数据槽，并按 `stat_expand` 汇总指定 ID；日重置类型按当天 `count_list[0]`，其他类型按 `total`。活动开放时间仍统一使用 `calendar.serverOpenedAt`，详见 [sprint-claim-expired.md](../fixes/sprint-claim-expired.md)。
- 回归验证：招募、半神共享抽取与圣器网关定向测试 `45/45`；钱包和冲榜领取定向测试 `18/18`；`git diff --check` 通过。全量测试此前存在与本轮无关的既有数据库基线失败，不能用全量失败否定上述定向结果。
- 部署前使用 `VACUUM INTO` 备份数据库到 `analysis/experiments/private-server-20261025/p3/recruit-fixes-20261101/game-before.local-only.sqlite`；大小 376,832 字节，SHA256 `2938D351ADABC9D10C32E4CDA12F7CC8424C382472705FDE1866672B9BD7D742`，源库与备份的 `PRAGMA integrity_check` 均为 `ok`。
- 问题 3 版本曾从本 worktree 以 PID `24048` 启动，五个端口均由该 PID 在 `127.0.0.1` 监听，隔离客户端自动完成握手和登录，stderr 为空。随后公共五端口被另一工作树的服务接管；最终问题 2 的代码已通过测试和提交，真实客户端视觉验收仍以实际接管的最终服务版本为准。

## 2026-11-07 心愿单 `-11` 次显示修复

- 工作目录为 `.worktree/wishlist-negative-20261107`，分支 `fix/wishlist-negative-20261107`。用户看到“仍需招募 -11 次”，功能性真值是普通招募 `draw_count=111`，而心愿单解锁条件是 `>100`；数据库中的模块 21 普通招募统计也已经持久化为 `111`，功能 1228 的开启位仍为 `0`。
- 客户端逻辑按原设计保留：`HeroDrawUILogic.GetNormalDrawCount()` 通过 `CountStatisticsMgr:GetTotalCount(TID_COUNT_DRAW, {TID_NORMAL_DRAW_LIB})` 取得统计缓存；功能是否开启仍由 `type=7000` 确认。负数只是新版 `601` 响应中的 `draw_count=111` 与未更新的统计缓存共同造成的显示结果。
- 根因在私服 type `2000 rev_count_statistics_change` 的编码。客户端 `Cmd.s2c` 没有该消息的 protobuf schema，因此按原服抓包走 ETF fallback；`CountStatisticsMgr.RevCountStatisticsChange` 的第一个参数再执行 `Codec.DecodePB("pb_count_statics_send_list", data)`。原服证据见 `agent/workflow/interface-catalog/interfaces.json` 中的 `tcp:s2c:2000:rev_count_statistics_change`：外层为 ETF，两字段分别为 binary 和 number。私服此前直接发送裸 protobuf，客户端 ETF 解码报 `invalid version`，统计缓存未更新，也没有触发后续功能检查。
- `personal-server/protocol/game-codec.mjs` 新增同步 `encodeEtfBinaryAndSmallIntegerTuple`；招募统计和成就统计的 type 2000 推送现在都编码为 ETF `{PB binary, 0}`，内层 protobuf 仍为 `pb_count_statics_send_list`。这也保持招募事务的同步执行和失败回滚语义。
- 回归已覆盖黄金 ETF 字节、服务层两类统计推送和真实 TCP 网关：`game-codec` 5/5、`recruit-service` 27/27、`gameplay-gateway` 7/7；全量 `npm test` 为 2240 项中 2238 通过、0 失败、2 项按既有前置条件跳过，`git diff --check` 通过。
- 修复验证阶段未修改 Lua 或 APK，也未操作模拟器；合并与部署步骤见下。部署后需要客户端重新连接/登录或再完成一次招募以触发新的 type 2000；随后统计缓存应为 111，功能检查可提交 type 7000 并打开心愿单。真实客户端视觉验收仍待部署后完成。
- 2026-11-07 已将该修复以合并提交 `cb67348` 合入 `main`。合并时 `recruit-service.mjs` 只发生 import 冲突，保留 main 的 `readRecruitHeroExclusionGroups` 并同时引入 ETF tuple 编码器；合并后的协议、招募和真实 TCP 网关定向测试 `39/39` 通过。
- 合并后的 `main` 全量回归为 2329 项中 2327 通过、0 失败、2 项因未设置已接受的真实 Lua bundle 按既有条件跳过。
- 旧服务 PID `2676` 已于 2026-11-07T15:58:59Z 后停止；从 `main` 启动新 PID `9800`，`startedAt=2026-11-07T15:58:59.664Z`。`18880/18881/18882/18883/19090` 均由 PID `9800` 仅监听 `127.0.0.1`，stderr 为空，隔离客户端已自动重连并重新登录。运行日志为 `personal-server/runtime.local-only.data/server-20261107-235857.local-only.out.log` 与同名 `.err.log`。
- 服务器重启没有修改或重装 APK。心愿单的最终视觉验收仍应观察下一次招募触发的 type 2000 后，统计缓存更新为 111、功能开启请求与 UI 解锁结果。

## 2026-11-09 冒险/精英心愿单完成选择报配置错误

- 工作目录为 `.worktree/recruit-wishlist-20261109`，分支 `fix/recruit-wishlist-20261109`。实时日志 `personal-server/runtime.local-only.data/server-20261109-213506.local-only.out.log` 中，type 642 的冒险请求被 `Wish selection is not supported by this draw library` 拒绝，精英请求被 `Wish hero is not eligible for this draw library` 拒绝，确认不是客户端单次点击问题。
- 冒险 `lib=1` 此前配置为 `wish:null`；精英 `lib=2` 虽开放心愿，却用实际随机池 `pool.byTid` 校验。客户端两套心愿入口实际读取 `HeroTable.DrawExchangeHero`，其中部分品质 50 英雄（如 `1030601/3030501/4030601`）被 `NewHeroExclusiveTable.WishDrawHero` 排除出普通随机池，因此合法选择仍被服务端拒绝。
- `buildRecruitPoolCatalog()` 现在为冒险/精英分别构建独立的 `wishByTid` 心愿候选池，来源仍为 `DrawExchangeHero`；冒险只接收普通心愿槽 `slot_type=1`，精英接收 `slot_type=1/2`。普通随机池继续排除限定英雄，未被心愿候选或随机池污染的既有规则不变。
- 抽取时命中品质 50/60 后通过 `wishByTid` 选择目标，因此客户端可见、但不在普通随机池的心愿英雄也能正常成为定向结果。精英池保持“仅命中已选目标才重置保底”；冒险池保留原有按 SSR 品质重置保底的行为。
- 定向回归 `recruit-service.test.mjs` 与 `recruit-pool-restrictions.test.mjs` 共 `33/33` 通过，覆盖冒险/精英选择、限定或非普通池英雄、额外心愿、移除、品质配额、实际心愿命中以及随机池隔离。全量 `node --test --test-concurrency=1 --test-reporter=dot test/*.test.mjs` 已完成且无失败输出，`git diff --check` 通过。
- 本轮未重启实时服务、未读写运行数据库、未操作模拟器/ADB/APK。代码部署后需重启个人服务器，客户端再次打开两套心愿单并完成选择验收。
- 同类审查又收敛了三个问题：`HeroTable.NormalDrawWishCell` 中冒险主心愿为2格、额外心愿为1格，服务端现在按字段分别限制品质50数量；主心愿与额外心愿不能重复选择同一英雄；额外心愿已并入实际定向抽取候选，命中后在对应列表累计 `draw_num`，不再只是保存展示。
- `98101 draw_wish` 原先直接持久化客户端 `wish_tid`，没有确认抽取库和心愿目录。现在从 `DrawTable.RandomDrawWish` 严格校验 `draw_lib` 存在、`wish_tid` 存在且属于该库；合法选择仍持久化到原状态，错误值在写事务前拒绝。客户端本地无 `DevelopUnlock` 数据表，因此未伪造按解锁状态过滤。
- 招募与抽卡定向回归 `49/49` 通过；全量 `npm test` 为2788项，2786通过、0失败、2项因既有无Lua前置条件跳过。本轮仍未部署，实时服务继续运行旧代码；重启服务后需由用户重新完成冒险与精英心愿选择，并观察额外心愿 `draw_num` 是否随命中增长。
