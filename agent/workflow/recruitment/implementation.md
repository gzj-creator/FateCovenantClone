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
