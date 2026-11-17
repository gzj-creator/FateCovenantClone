# N1 奖励数量越过协议位宽与精灵珠 UID 精度

状态：已修复并通过组件、真实 codec、临时 SQLite 与重开库验证；未部署、未做 APK 真机验收。

`resources.mjs` 的通用道具/货币使用 BigInt 并限制 int64，但英雄 count、圣器/皮肤/幻武原卡 num 使用 Number 直接相加，没有限制 int32；珍宝 chip_num 是 uint32，也没有边界。protobufjs.fromObject 不负责拒绝越界，会把 int32 最大值加一编码成负数、uint32 最大值加一编码成 0。家政资源 num 缺失 int64 上限检查。精灵珠 max_uid/uid 是 int64，却先转 Number，超过2^53后产生重复 UID。

证据：原协议 `hero`、`pb_artifact`、`pb_skin`、`pb_fantasy_equip_raw` 的数量字段为 int32，`pb_treasure_card.chip_num` 为 uint32，`pb_house_assistant_res.num`、`pb_elves_bead_data.max_uid`、`pb_elves_bead.uid` 为 int64。`reward-quantity-boundaries.test.mjs` 用真实 codec、临时数据库和原资源处理器覆盖最大合法值/加一拒绝/事务回滚/大 UID 连续性；不以假想普通体力超大值作为问题证据。

修复使用各协议真实上限，禁止静默截断或绕回；整个奖励请求仍由原事务回滚。验证日志：`analysis/test-runs/numeric-audit-20261117/quantity-before.log`、`quantity-after.log`。未部署、未操作活库或 APK。每增加一个独立数量处理器都必须同时核对原协议位宽和累计边界。

## 同轮调用链复查（先记复盘再补修）

2026-11-17：发奖后的精灵珠养成服务仍把 `max_uid` 和珠 UID 经 `numeric` 转为 Number，升级/升星/穿脱/分解以不精确的 Number 查找。上一组测试只覆盖发奖端，没有覆盖下游服务，不能据此关闭大编号问题。补测相邻大 UID 的精确选择、升级后 max_uid 保留、穿戴引用、重开库，以及越过 int64 上限拒绝，再统一该服务的 UID 为十进制字符串。养成消耗/返还仍有 R1 已登记的原证据缺口，本次仅修编号传递，不能把这些测试当作原养成规则验收。

同一轮审计又发现同根因在四个下游再现：`leader-equip-develop-service.mjs` 用 Number 比较团长装备 UID；`minigame-act-service.mjs` 将源点库、英雄指派和合成材料整体转 Number；`pet-service.mjs` 将灵核库、最大库 UID 和消耗 UID 转 Number；`exploration-act-service.mjs` 将家园礼物 `gift_uid` 及计数器转 Number。上一轮测试只断言发奖、升级、重开库等精灵珠路径，没有按“生成 → 执行命令 → 引用/消耗 → 重开”的维度反查其他执行服务，因此无法抽捉同类的下游转换。

本次在修正前增加双链试验：`2^53` 与 `2^53+1` 必须作为不同实例；创建上下文必须精确选择目标、保留相邻项、按一递增 counter；引用和消耗必须在重开库后保持一致；`int64/uint64` 越界必须拒绝并整笔回滚。测试分别放在实现服务对应的专项文件，并在 BUG-MEMORY 的数量边界清单增加 BigInt 维护。

### 执行服务全链复查第二次复发

2026-11-17：上一轮按“生成 → 执行命令 → 引用/消耗 → 重开”补测时只覆盖了源点、灵核、团长装备和家园礼物，没有把同一审查维度扩到其余已实现活动。`minigame-act-service.mjs` 的家园家具 UID、`homelandDepot.max_uid`、大富翁 `event_uid`/event UID、精灵庭院委托 UID 仍先转 `Number`；它们的原协议分别是 `int64`。家园输出还把 `max_uid` 固定为 0，相邻大 UID 会合并成同一键；大富翁会命中错误事件；精灵庭院的提交、发布和取消会操作相邻的错误委托。`guild-auction-service.mjs` 的拍卖品 UID 也仍要求安全 Number，而请求字段分别是 `int64`/`uint64`。

这次复发说明只检查“已经发现的大 ID 服务”不足以关闭根因。修正前将新增协议边界测试：写入 `2^53` 与 `2^53+1` 的相邻家具、事件和委托，必须精确保留并命中目标；counter 越过 int64 上限必须拒绝且不落库；拍卖本地策略把商品 UID 设为相邻大整数时，关注和竞拍必须使用同一十进制字符串。回归范围还包含存档重开。限时资源的 `pb_item_time_res_db.max_uid`/`pb_item_time_res.uid` 在证据目录中只有 schema，当前没有任何业务处理器；该事实列入验收缺口，不能凭 schema 猜造实现。

### 执行服务全链复查第三次复发

2026-11-17：第二次复发复盘仍未覆盖三消战斗全链。`trimatch-core.mjs` 的阵容预设 counter 以 Number 读取 `next_lineup_uid` 并加一；`trimatch-fight-service.mjs` 以 `Number(MAX(fight_uid))+1` 分配战斗 UID，重试、放弃、取战报和状态读取又多次转 Number。原协议中 `pb_battle_tri_match_lineup.uid`、`pb_triple_match_fight_response.id`、交换/Ready 请求、战报和结算的 fight ID 均为 int64。相邻值越过 2^53 后，分配会重复、查询会命中错误战斗，Node SQLite 读取超出安全整数的 INTEGER 还可能直接抛错。三消 PVP 战报和爬塔结算同样把 `fight_uid` 转 Number。

这次在修正前新增失败测试：阵容 counter 从 2^53 起连续分配 2^53、2^53+1，重开库后继续；战斗 UID 从精确十进制最大值递增，相邻大 UID 的状态、重试、放弃和战报查询必须命中同一场；counter 到达 int64 上限后返回 code 305 且整笔事务不落库。所有 SQLite 读取长 UID 的路径改为 `CAST(... AS TEXT)`，业务层统一用 BigInt/十进制字符串，同时回归 PVP 战报与爬塔结算的持久化。

## 最终结果（2026-11-17）

| 链路 | 证据日志 | 结果 |
| --- | --- | --- |
| 基础数量边界 | `quantity-after.log` | 7/7 通过 |
| 下游养成与代金券 | `downstream-after.log` | 37/37 通过 |
| 团长装备、源点、灵核、家园礼物 | `int64-endgame-after.log`、`int64-source-after.log`、`int64-home-puzzle-after.log` | 12/12、38/38、11/11 通过 |
| 家园家具、大富翁、精灵庭院、拍卖 | `int64-minigame-after.log`、`int64-auction-after.log` | 42/42、8/8 通过 |
| 三消阵容/战斗/PvP/爬塔 | `trimatch-int64-after.log`、`trimatch-service.test.mjs` | 3/3 及阵容 6/6 通过 |
| 邮件大 ID | `mail-id-after.log` | 10/10 通过 |
| Hunter/Overall/Swap Arena 战报 | `report-int64-after.log`、`swap-arena-int64-after.log` | 2/2、3/3 通过 |
| 英雄 661/627/628 UID | `hero-uid-after.log` | 2/2 通过 |
| 通关战报 211/212 | `battle-record-int64-after.log` | 5/5 通过 |

这些回归覆盖相邻 `9007199254740992`/`9007199254740993` 不合并、对外低 ID 保持 Number、高 ID 返回十进制字符串、SQLite 重开和越界事务回滚。源点实例内部持久化采用十进制字符串以保持相邻大 UID 精确；对应的旧 `premium-act` 断言已同步为字符串，`premium-act-after.log` 10/10 通过。最终全量结果见 [验收文档](../../../docs/acceptance/numeric-systems-20261117.md) 与 `final-test-all.log`。
