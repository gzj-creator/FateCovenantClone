# 星魂卷轴（NorseRune）实现记录

- 更新日期：2026-10-31
- Worktree：`.worktree/system-soul-scroll-20261031`
- 分支：`feature/system-soul-scroll-20261031`
- 基线：`118039a`

当前结论：按用户选择“按证据自动判定”将“星魂卷轴”高置信映射到客户端
`NorseRuneMgr` / `project/norse_rune`，也就是模块表中的“时空符文”。四个静态命令、
登录模块、资源、等级表、信物分组和响应 schema 已实现到本地服务器。定向测试
12/12、个人服务器全量测试 327/327 通过；尚未做真实 APK 界面和视觉验收。

## 入口判定与协议证据

客户端没有可直接检索到“星魂卷轴”的本地化文字。模块表第 156 行给出的名称是
“时空符文”，目录为 `project/norse_rune`，manager 为 `NorseRuneMgr`。在所有模块中，
它是唯一具有“抽信物、替换、祈愿升级、符文类型升级”完整链路的候选，因此本实现
采用该映射。该映射来自静态结构，不是视觉实测。

登录模块为 `156`，schema 为 `pb_norse_rune`：

| 字段 | 类型 | 用途 |
| --- | --- | --- |
| `token_list` | repeated `pb_norse_rune_token` | 已拥有的 1–12 号信物 |
| `type_list` | repeated `pb_norse_rune_type` | 四种符文类型的等级 |
| `level` | uint32 | 当前祈愿等级 1–12 |
| `exp` | uint32 | 当前祈愿经验 |
| `draw_token` | `pb_norse_rune_token` | 重复信物等待替换的暂存结果 |

四个静态命令均由 `NorseRuneCmd.lua` 和 `NorseRuneMgr.lua` 交叉确认：

| 命令 | 客户端请求 | 成功响应 | 请求体 |
| --- | --- | --- | --- |
| 90201 | `req_norse_rune_draw` | `pb_norse_rune_draw_back` | 空 |
| 90202 | `req_norse_rune_replace` | `pb_norse_rune_token` | 空 |
| 90203 | `req_norse_rune_wish_level_up` | `pb_norse_rune_wish_level_up_back` | 空 |
| 90204 | `req_norse_rune_rune_level_up` | `pb_norse_rune_type` | 类型 1–4 |

客户端请求函数可确认以下顺序：抽签前检查当前 `Level.need_exp`，经验达到阈值时
返回“需先祈愿升级”错误；随后检查 `324002` 的库存和 `sub_count`。祈愿升级同样
检查经验阈值。重复信物不会直接覆盖槽位，抽签响应通过 `draw_token` 保存待替换
结果，90202 再提交替换。

配置表证据如下：

- 祈愿等级 1–12 的 `need_exp`、`sub_count`、`show_weight` 依次为
  `10000/100/6`、`10000/100/12`、`22500/150/18`、`22500/150/24`、
  `40000/200/30`，等级 6–12 为 `40000/200/36`。
- 每次抽签消耗 `sub_item=324002`，数量为当前等级的 `sub_count`。
- QualityWeight 只定义品质 1–5。本实现使用的等级权重行在
  `show_weight=6/12/18/24/30/36` 时均为 `[4400,2800,1600,800,400]`。
- 信物 1–3 属于类型 1，4–6 属于类型 2，7–9 属于类型 3，10–12 属于类型 4。
- 类型升级要求本类型三枚信物齐全，且三枚信物的最低等级大于当前类型等级；
  TypeAttr 为每种类型定义六个等级。

## 已实现行为

新增 `personal-server/config/norse-rune-tables.mjs` 与
`personal-server/game/norse-rune-service.mjs`，并在
`personal-server/game/gateway.mjs` 接入登录初始化与 90201–90204 路由。

- 登录时模块 `156` 为空则写入 `level=1`、`exp=0`、四种类型 `level=0`；重复登录
  幂等，不重置已有状态。
- 抽签在单一 SQLite 事务中扣除 `324002`、计算品质和信物、写入经验；空槽直接加入
  `token_list` 并返回 `add_token`，重复槽保留为 `draw_token`。
- 替换在单一事务中把 `draw_token` 写回对应信物槽并清除暂存；没有待替换信物时
  拒绝。
- 祈愿升级扣除当前阈值，保留超出阈值的经验，并持久化等级。
- 类型升级校验类型、三枚信物和最低信物等级，成功后类型等级加一。
- 所有资源、模块和响应编码位于同一事务；编码失败会回滚。
- ETF 请求支持空 body、scalar、单元素列表和 `{type}` 的宽兼容解析。
- 所有错误通过现有 `pb_s2c.err` 返回，业务失败不会写入部分状态。

以下三项没有足够证据证明原服精确规则，因此是本地实现选择，不能写成原服事实：

1. 每次抽签经验增量按 `sub_count × 10`：三个档位分别需要 10、15、20 次抽签跨过
   阈值；其他系数无法由客户端静态表唯一推出。
2. 新信物等级设为抽签时的当前祈愿等级：客户端每个信物带有 level，但没有独立的
   信物升级命令，TokenAttr 也定义了 1–12 级。
3. 1–12 号信物等概率：客户端配置只固定品质权重，没有发现信物变体权重表。

品质选择严格使用已提取的 QualityWeight 行；类型由抽中信物按三枚一组推导，不另做
随机映射。

## 验证与复现

已执行：

```powershell
node --check personal-server/game/norse-rune-service.mjs
node --check personal-server/game/gateway.mjs
node --check personal-server/test/norse-rune-service.test.mjs
node --test personal-server/test/norse-rune-service.test.mjs
cd personal-server
npm test
```

验证层次：

- 单元测试：表配置、初始化幂等、抽取扣费、等级权重行、空槽加入、重复槽暂存与替换、
  经验阈值、超额经验、三信物类型升级、非法请求、编码失败回滚、SQLite 重开。
- 临时 TCP 测试：真实 frame、挑战应答、登录 payload、模块 156、90201–90204 全路由，
  以及服务重开后的等级、经验和类型等级持久化。
- 定向测试：12/12 通过。
- 个人服务器全量测试：327/327 通过。
- `git diff --check` 通过。

## 未验收范围

- 未启动或操作 ADB、模拟器、实时服务、线上 SQLite 或 APK。
- 未在隔离 APK 中打开该功能、抽签或升级，因此没有 UI 对应关系、错误码文案、
  动画和实际资源刷新的视觉证据。
- 未捕获 90201–90204 的真实客户端成功流量；协议方向和 schema 来自静态客户端资源。
- “星魂卷轴”与“时空符文”的名称对应仍需后续菜单截图确认。
- 资源选变、经验增量与信物初始等级属于上述本地推断，真实 APK 验收后可能需要校正。

因此本分支可视为实现和组件/TCP 验收完成，不能标记为 APK 实测或完整可玩验收。
本次没有构建 APK，不涉及 `apk/` 快照更新。

## 证据路径

- `analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_general.bundle/bytecode/ModuleTable.data.lua.json`
  （模块表第 156 行；SHA256 `B68256C8CB29CDCC3D7E8CEA0EDE722C50D9B33FAA62BBA81ADD54ACCA408F6C`）
- `analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_project.bundle/textassets/11553036965960784000-NorseRuneMgr.lua.bin`
  （SHA256 `93A25AF5DBE38CF066FCEBD70566ED4F2E6DB645CD8537F112934D3E62F63FE4`）
- `analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_project.bundle/textassets/16794843155351548000-NorseRuneTable.data.lua.bin`
  （SHA256 `ED3CD8938AD1B6E5C3FDA534059E7481B7528079BF559D0C05FBED97C7844690`）
- `analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__protobuf.bundle/textassets/16887345429047118000-norse_rune.db.proto.bin`
  （SHA256 `58DB8B5C38CC2063C2ED8C9483EC325300137C346AAADFBCAE921F7C4B4D4579`）
- `agent/workflow/interface-catalog/tcp-commands.md`
- `agent/workflow/interface-catalog/static-schemas.json`
