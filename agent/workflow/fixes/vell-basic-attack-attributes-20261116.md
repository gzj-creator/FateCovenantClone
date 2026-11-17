# B1 薇尔普攻 3k：星级属性索引与数值类型错误

日期：2026-11-16（Asia/Shanghai）

分支/worktree：`main`，`F:/projects/FateCovenantClone`。

基线提交：`2d08ce2`。

状态：已修复并通过组件、临时 TCP 与 SQLite 重开验证；未部署、未做 APK 真机验收。

## 现象与触发

用户反馈“薇尔平 A 一下 3k 多，攻击力才几百”。普通主线请求为 `201 -> 207`。本轮只读核对当前状态文件与 PID 27220 后检查日志：最近三场 `201` 为 2026-11-16T15:45:50.110Z / seq 30 / 40201、15:46:23.795Z / seq 40 / 40202、15:47:11.952Z / seq 48 / 40203。不能只凭反馈确定是哪一击。

只读查询当前运行库：角色 100001、100002 的薇尔均为 `tid=4030801 / level=1 / star=0 / star_progress=0 / quality=50 / breakthrough_level=0`。旧属性组装稳定产生 HP 8874、攻击 3321、双防 155；这正是普攻达到 3k 的属性输入，不是从几百攻击产生了合法的十倍技能倍率。

## 证据

- 当前状态：`analysis/experiments/launch-20261115/server-data-fixed/server.local-only.json`；只用作本次运行态核对，PID 不是永久常量。
- 原始请求日志：同目录 `events.jsonl` 第 13162、13198、13222 行及后续 `mission_fight_started`。
- 只读 SQLite：同目录 `game.local-only.sqlite`，`DatabaseSync({readOnly:true})` + `PRAGMA query_only=ON`，仅查询 `heroes`，未用会运行迁移的业务 store 打开活库。
- 原客户端 `HeroAttrCollect`：`analysis/scratchpad/time-temple-20261108/project/3515417647173561000-HeroAttrCollect.lua.bin`。原型 6 返回 star、starProgress、quality；原型 2 PC 40–57 将 `min(5,star), quality, starProgress` 传入 `GetHeroStarAddAttrTid`，读取四个 `*_sum_add`；PC 82–145 将这些值加到四维平值，并把 `HighStarAddAttr` 的四维写到对应百分比通道；成长除数为常量 100，先 `floor`。
- 原客户端 `HeroDevelopMgr.GetHeroStarAddAttrTid`：`analysis/scratchpad/hero-extra-20261107/HeroDevelopMgr.lua.bin` 及同目录 `HeroDevelopMgr.json` 原型 34，计算 `star*10000 + quality*100 + starProgress`。项目现有 LuaJIT 解析器不支持所有该文件的常量边界，复用已有完整原型导出，不将解析失败当作反证。
- 服务器原表：`personal-server/assets/tables/HeroTable.data.lua.json.gz` 经 `readAttributeTables()` 读取。`StarAddAttr[5000]` 四个累计值均为 0；`45000` 实际是 4 星品质 50 的属性，不能因 camp=4 给初始薇尔使用。
- 旧修复：`agent/workflow/battle-number-fix-20261108/implementation.md`，旧测试 `personal-server/test/attribute-service.test.mjs` 将错误攻击 3321 固定为期望。

## 复发复盘（先于代码修改）

2026-11-08 的修复只阻止了“把每一档星级都累加”，没有从原消费者核对索引三个参数的身份。随后仍用 camp 代替 star、用 star 代替 starProgress，并把名称含 `sum_add` 的平值误当百分比；高星百分比反而加成了平值。成长又误用百分比精度 10000 代替原常量 100。旧测试根据错误实现写死 8874/3321，缺少原始字段语义、阵营独立性、升星小段和等级成长断言，因而没拦住本次反馈。

旧记录也没有进入修复索引，且错误公式被 11-15 系统规则册复述。此次必须在代码修改前登记本记录，并添加可在旧实现上失败的原数值回归；同步纠正规则入口，避免再次把错误的工程输出当原版证据。

## 根因与修复范围

`personal-server/game/attribute-service.mjs::assembleHeroAttributes`：

1. 低星行应为 `min(storedStar,5)*10000 + quality*100 + star_progress`，与 camp 无关；只取当前累计行。
2. 低星四个 `*_sum_add` 是四维固定加值；`hp/attack/physical_def/magic_def` 是本小段增量，不重复叠加。
3. 高星四维是 10000 精度的比例，分别进入四个百分比通道。
4. 基础成长除以 100，基础四维及最终四维按原消费者向下取整。
5. 1316 属性缓存状态键必须包含 `star_progress`，避免小段升星后返回旧属性。

统一属性组装由主线、精英、竞技及 1316 查询共用，修复所有调用点；不针对薇尔单独砍伤害、不修改原表、技能倍率或已冻结的伤害兼容公式。初始薇尔应为 HP 1530、攻击 245、双防 105；实际浮动/暴击和目标防御仍决定每次伤害。

## 验证

| 级别 | 内容 | 结果 |
| --- | --- | --- |
| 组件测试 | 原数值、阵营独立、小段升星、成长、高星百分比与缓存回归 | 通过（`hero-attribute-fidelity.test.mjs`、`attribute-service.test.mjs`；`focused-final.log` 82/82） |
| 临时 TCP | 隔离测试库的 1316 和 201/207 | 通过（`focused-final.log` 中真实网关 1316/201/207 用例） |
| 部署 | 当前运行服务 | 未部署 |
| APK 真机 | 用户战斗飘字与面板复核 | 未验收 |

最终回归：初始薇尔 `4030801` 的错误 HP 8874/攻击 3321/双防 155 已撤回，固定为 HP 1530/攻击 245/双防 105/战力 408；旧模拟普攻 3184 不再复现，属性测试中的实际普攻落在百位区间。日志与失败前记录均在 `analysis/test-runs/vell-basic-attack-20261116/` 和 `analysis/test-runs/numeric-audit-20261117/`。

## 防复发

原数值测试必须独立于当前实现取值，至少固定初始薇尔攻击 245；用同一英雄切换 camp 验证四维不变；覆盖 star_progress 0→2、level 1→2、高星百分比和缓存刷新。复用原消费者命名与常量，而不是按列名猜单位。复发前后日志与证据保留在 `analysis/test-runs/vell-basic-attack-20261116/`。

## 未验证项与边界

未启停实时服务、未写运行库、未操作设备或修改 APK；原服完整伤害公式、原普攻 fallback 缺口和全部被动没有因此获得验证。不得宣称“所有战斗 1:1 已恢复”。
