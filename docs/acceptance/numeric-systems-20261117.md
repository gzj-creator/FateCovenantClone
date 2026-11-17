# 2026-11-17 全数值排查验收

状态：代码修复与离线验证完成；未部署、未重启实时服务、未读写运行数据库、未操作设备或 APK。本文是 2026-11-17 数值审计的结果入口，验证等级按组件、临时 TCP、存档重开、部署和 APK 真机分开记录。

基线：R1（2026-11-15）加 [R2 数值增补](../gameplay-operations/13-numeric-r2-amendment.md)。代码基线提交 `2d08ce2`，本轮改动尚未提交。源码、协议、原证据和测试日志的指纹见 [R2 源码清单](../../analysis/numeric-audit-20261117/r2-source-manifest.json)。

## 1. 用户问题与结论

用户反馈薇尔普通攻击一次约 3k，而面板攻击只有几百。核查确认这不是正常的技能倍率，而是英雄属性组装把攻击值从原公式的 245 算成了 3321，旧模拟普攻因此可复现 3184 点伤害。

初始薇尔 `4030801`、等级 1、`star=0`、`star_progress=0`、`quality=50`、`breakthrough_level=0` 的正确基础结果为 HP 1530、攻击 245、物理防御 105、法术防御 105、属性战力 408。旧实现的 HP 8874、攻击 3321、双防 155 已撤回，不再作为测试金值或文档公式。

根因集中在 `personal-server/game/attribute-service.mjs` 及其配置注释：

- 低星索引误用了 `camp`，正确索引是 `min(storedStar, 5) * 10000 + quality * 100 + star_progress`。初始薇尔 `camp=4` 时旧代码读取了 4 星品质 50 的行；正确行是 `5000`。
- `StarAddAttr.*_sum_add` 是当前星级行的累计固定加值，旧代码把它当百分比；同一行的 `hp/attack/physical_def/magic_def` 是升星小段增量，不能重复叠加。
- `HighStarAddAttr` 的四维是 10000 精度百分比，旧代码按固定值加到四维。
- `BaseAttrNew` 成长使用原消费者常量 100，不是 10000；基础四维和最终四维按原逻辑向下取整。
- 1316 属性缓存键缺少 `star_progress`，小段升星后会返回旧属性。

修复后的回归固定原数值，并覆盖阵营独立、`star_progress` 0→2、等级 1→2 成长、高星比例、属性缓存刷新，以及 1316 与主线 201/207 的真实临时 TCP 路径。

## 2. 本轮修复清单

| 编号 | 现象与根因 | 修复范围 | 结果与验证 |
| --- | --- | --- | --- |
| B1 | 薇尔普攻 3k：星级索引误用阵营、`sum_add` 固定值与高星百分比互换、成长精度错误、取整错误、缓存键遗漏小段 | `attribute-service.mjs`、`attribute-tables.mjs`、属性与 1316/201/207 测试 | 初始薇尔恢复 HP 1530/攻击 245/双防 105/战力 408；组件、真实临时 TCP、SQLite 重开通过 |
| B2 | 主线、精英、引导演示和 PvP 丢失基础暴击、暴伤、阵营；PvP 战报只按四维重算战力 | `battle-engine.mjs`、`pvp-battle.mjs`、`mission-fight-service.mjs`、`effects/effect-executor.mjs` 及相关测试 | 属性 11/12 按 10000 精度转入暴击概率/暴伤；显式 0 不被职业默认值覆盖，100% 不被截为 75%；PvP 保留阵营和完整权威战力 |
| B3 | 专精升级、专精突破、普通突破天赋扣料并保存进度，但属性不增加 | `attribute-service.mjs`、`develop-support.mjs`、专精与突破测试 | 突破天赋逐级累计；专精等级按 `MasteryGroup.level_range` 逐行累计；专精突破只取当前累计行；`AttrType.exchange` 44 展开到 24/25；659/660 临时 TCP 通过 |
| N1 | 英雄、圣器、皮肤、幻武原卡、珍宝、家政资源数量越过真实协议位宽；精灵珠等 int64 UID 先转 Number | `resources.mjs`、`develop-support.mjs`、`elves-bead-service.mjs`、`pet-service.mjs`、`exploration-act-service.mjs`、`leader-equip-*.mjs`、`minigame-act-service.mjs`、`guild-auction-service.mjs`、`trimatch-*.mjs`、`mail-service.mjs`、`hunter-arena-service.mjs`、`overall-pvp-service.mjs`、`swap-arena-service.mjs`、`battle-record-service.mjs` 等 | 按 int32/uint32/int64 上限先检查累计值再编码，越界整笔回滚；相邻 `2^53`/`2^53+1` 作为不同实例；SQLite 大 UID 以文本读取，对外字段低 ID 保持 Number、高 ID 返回十进制字符串，内部持久化按既有类型或精确字符串保存 |
| N2 | ItemBox 重试回执只恢复 `new_bin`，`extra` 的 Buffer 在 JSON 回执中丢失；专精 TCP 使用非法业务日；登录集成强求已撤回的虚构公会；派发审计产物陈旧 | `item-box-service.mjs`、专精与登录测试、派发审计清单 | 回执递归恢复所有 Buffer，首次、重试、重开库后 `extra/new_bin` 逐字节一致且只扣料一次；专精测试显式建立合法业务日；登录测试断言未入公会 `guildId=0` 且无虚构成员；1407 条派发清单重生成 |
| N3 | 代金券余额先转 Number，面值乘法和管理页再次丢精度；快照累计抵扣只汇总最近 100 条 | `voucher-service.mjs`、`admin/numeric-format.js`、`admin/server.mjs`、`admin/admin.js` | 张数与分使用 BigInt；JSON 安全范围内保持 number，超界输出十进制字符串；管理页直接格式化整数分；累计抵扣遍历全账本；库存、支付、HTTP、重开库回归通过 |

同一根因的后续复查还覆盖了：精灵珠发奖/升级/升星/穿脱/分解、团长装备 UID、源点库与合成、魔灵灵核、家园礼物与家具、大富翁事件、精灵庭院委托、拍卖商品、三消阵容/战斗/PvP/爬塔、邮件 ID、Hunter/Overall/Swap Arena 战报 ID、英雄 661/627/628 UID 和通关战报 211/212 ID。它们都按“生成 → 执行命令 → 引用/消耗 → 重开库”检查，不只替换写入点。

## 3. 静态审计覆盖

`analysis/numeric-audit-20261117/r2-source-inventory.json` 对 `personal-server` 的 337 个源码文件逐一计算 SHA256，并按取整、定点缩放、随机/概率、数量、来源缺口模式扫描。213 个文件共 1175 行命中候选，分布如下：

| 领域 | 文件数 | 候选行 |
| --- | ---: | ---: |
| 战斗 | 28 | 197 |
| 经济 | 22 | 83 |
| 奖励与资源 | 19 | 82 |
| 随机抽取 | 20 | 191 |
| 养成 | 57 | 144 |
| 协议、管理与运行 | 23 | 29 |
| 排期与社交活动 | 168 | 449 |

1175 是待人工复核的算术候选行，不是 1175 个 bug。审计脚本不能证明原服公式完整还原，只用于固定审阅范围。

`analysis/numeric-audit-20261117/r2-hero-matrix.json` 对 337 个 HeroTable 行分类：77 个可玩英雄、260 个无 chip 的 NPC/外观模板。对 77 个可玩英雄覆盖等级 1/2/60/300、初始星级至 10 星、突破 0/2、合法升星小段、每个专精等级/突破行和四种阵营，共 12511 个属性组合、308 个阵营独立性检查、5775 个专精检查，失败 0。NPC/外观模板单独保留，不为它们伪造玩家属性。

`analysis/numeric-audit-20261117/protocol-long-uids.txt` 从协议 schema 提取 166 个 int64/uint64 字段（113 个 int64、53 个 uint64），用于反查持久化 allocator、SQLite 读取、JSON/HTTP 输出和业务查找。幻武的 uint64 实例 UID 与 int32 allocator 的混合位宽、圣器 `repeated uint32` 的英雄引用、三消 action 内部模拟实体 ID 和社交评论 int32 UID 已逐项区分，不能只因字段名相似就扩大为大 UID 修复。

## 4. 测试与证据

本轮主要证据位于 `analysis/test-runs/numeric-audit-20261117/`。关键结果：

| 证据 | 结果 |
| --- | --- |
| `focused-final.log` | 82/82 通过，覆盖属性、战斗投影、养成、代金券、奖励边界、1316/201/207 真实临时 TCP |
| `projection-development-after.log` | 9/9 通过，覆盖基础暴击 0/100%、暴伤、PvP 阵营与完整战力、专精/突破天赋 |
| `downstream-after.log` | 37/37 通过，覆盖下游养成、代金券、管理 HTTP 和数量边界 |
| `receipt-and-validation-after.log` | 17/17 通过，覆盖道具回执、派发审计、合法业务日和 659/660 真实临时 TCP |
| `int64-endgame-after.log` | 12/12 通过 |
| `int64-source-after.log` | 38/38 通过 |
| `int64-home-puzzle-after.log` | 11/11 通过 |
| `int64-minigame-after.log` | 42/42 通过 |
| `int64-auction-after.log` | 8/8 通过 |
| `trimatch-int64-after.log` | 3/3 通过 |
| `mail-id-after.log` | 10/10 通过 |
| `report-int64-after.log` | 2/2 通过 |
| `swap-arena-int64-after.log` | 3/3 通过 |
| `hero-uid-after.log` | 2/2 通过 |
| `battle-record-int64-after.log` | 5/5 通过 |
| `premium-act-after.log` | 10/10 通过（含源点大 UID 内部持久化与购买限购回归） |
| `trimatch-lineup-int64-after.log` | 6/6 通过 |
| `trimatch-fight-int64-after.log` | 3/3 通过 |

最终快速套件（95 个测试文件）为 530 项、528 通过、0 失败、2 跳过（`final-quick.log`）。

最终全量 `npm run test:all --prefix personal-server`（337 个测试文件）为 3289 项、3287 通过、0 失败、2 跳过，耗时 641 秒（`final-test-all.log`）。两项跳过均因未设置已验收的 v9 Lua 包 `FC_RECHARGE_CLIENT_BUNDLE`，与本轮修改无关。

验证等级：

- B1：组件通过，真实临时 TCP 的 1316/201/207 通过，SQLite 重开通过；未部署、未做 APK 真机。
- B2：组件通过，PvP 直接战斗回归通过；未新增原服伤害公式的 TCP/真机验证。
- B3：组件通过，659/660 真实临时 TCP 通过，SQLite 重开通过；未部署、未做 APK 真机。
- N1：组件、真实 codec、临时 SQLite 和重开通过；覆盖的服务有的没有独立 TCP 入口，不能把组件通过写成全部网关验收。
- N2：组件、真实临时 TCP 659/660、全量派发审计通过；未部署。
- N3：组件、管理 HTTP、SQLite 重开通过；游戏内支付网关的旧路径由既有集成测试覆盖，未做新一轮真机。

## 5. 原版证据缺口与已知边界

本轮修正确认的是已取得原消费者和协议证据的属性来源、单位、投影和数量边界，没有取得原服完整战斗算法。以下仍未验收：

- 命中、抗暴、物理/法术分离、最终增伤/减伤、完整的防御减伤和技能备用通道仍没有完整原服证据；速度、怒气、双防折合等继续按 R1 的兼容规则。
- 装备、次级 actor 属性及其他未接入来源不能因本次属性测试通过就视为全部恢复；本轮只接入已由原消费者确认的突破天赋、专精等级、专精突破和 `AttrType.exchange`。
- 636/638 等成长成本、返还和部分资源消耗仍保留 R1 已登记的证据缺口，本轮没有改动原成本索引。
- 随机/保底在缺少候选、权重或配置行时继续 fail closed，不猜概率、不先扣费；不能把拒绝当成已实现随机玩法。
- `pb_item_time_res_db.max_uid` / `pb_item_time_res.uid` 目前只有 schema，没有业务处理器，已登记为验收缺口。
- `pb_gmc_notify_gift` / `pb_player_notify_gift` / `pb_single_notify_gift` / `pb_notify_gift_client` 等通知赠礼字段同样只有协议或命令目录记录，当前没有业务 handler；这类请求按未实现命令 fail closed，不伪造推送赠礼状态。
- 幻武 `pb_fantasy_equip.uid` 为 uint64，但持久化 allocator 和 `pb_fantasy_equip_id.uid/max_equip_id` 为 int32，当前按 int32 水位约束，不能声称支持完整 uint64 实例空间。
- 公会弹劾 `impeach_uid` 协议为 int64，本服实际存的是自增角色号，属于安全整数范围；没有把它当作高 UID 实例生成器。
- 本轮未部署、未重启实时服务、未读写运行数据库、未操作设备或 APK。已有战报、结算、订单和冻结活动实例不追算；上线时必须明确切换实现版本，并按本文重新做客户端复核。

## 6. 复现与发布前检查

离线审计与回归命令（项目根目录）：

```powershell
node personal-server/scripts/audit-numeric-systems.mjs analysis/numeric-audit-20261117/r2-source-inventory.json
node personal-server/scripts/audit-hero-numeric-matrix.mjs analysis/numeric-audit-20261117/r2-hero-matrix.json
node --test personal-server/test/hero-attribute-fidelity.test.mjs personal-server/test/hero-development-attributes.test.mjs personal-server/test/combat-numeric-projection.test.mjs
node --test personal-server/test/reward-quantity-boundaries.test.mjs personal-server/test/voucher-integer-precision.test.mjs
npm test --prefix personal-server
npm run test:all --prefix personal-server
git diff --check
```

发布前先做一致数据库备份并记录 SHA256，再明确切换服务实现版本；客户端至少复核英雄面板、1316 属性、普通主线 201/207、专精扣料后属性和 PvP 战报战力。发布验收通过前，不得把本文件的组件/临时 TCP 结果写成线上已生效或全部玩法 1:1。

## 7. 验收结论

薇尔普攻 3k 的属性输入错误已定位并修复，初始属性回到 HP 1530、攻击 245、双防 105、战力 408；战斗投影、养成属性来源、资源数量边界、长 UID 传递、回执幂等和代金券精度均有离线回归。静态目录、英雄矩阵和协议长 UID 清单固定了本次审阅范围，最终全量测试结果见第 4 节。

本结论只到组件、临时 TCP 和临时 SQLite 重开等级，不包含部署、运行库迁移、客户端视觉或 APK 真机验收，也不能替代原服完整伤害、命中、抗暴和最终增减伤公式的后续证据工作。
