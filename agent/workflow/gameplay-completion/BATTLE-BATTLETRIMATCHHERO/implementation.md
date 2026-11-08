# BATTLE-BATTLETRIMATCHHERO 实施记录（三消战斗英雄升级升星）

日期：2026-11-08。分支 `task/A2-TRIMATCH-20261108`（基线 main 8ebd5a1），worktree
`.worktree/gameplay-20261108/a2-trimatch`。本任务只写服务端代码，未启停实时服务、未读写
`runtime.local-only.data`、未操作模拟器/ADB/APK，验证手段限于 `node --check` 与
`git diff --check`。没有组件测试与真实 TCP/SQLite 运行，因此不能记为已验收。

## 任务范围

任务卡 `docs/plans/remaining-gameplay-20261106/01-battle.md` 的 `## BATTLE-BATTLETRIMATCHHERO`：
模块 `BattleTriMatchHeroCmd`，2 条命令此前完全未路由。

| type | 命令 | 请求 / 回包 | 本次状态 |
| ---: | --- | --- | --- |
| 112001 | `req_battle_tri_match_hero_up_lv` | protobuf `pb_battle_tri_match_hero_up_lv_req` → `pb_battle_tri_match_hero_up_lv_rsp` | 已实现（按 `UpLevel` 行逐级扣料，单次上限 200 级） |
| 112002 | `req_battle_tri_match_hero_up_star` | protobuf `pb_battle_tri_match_hero_up_star_req` → `pb_battle_tri_match_hero_up_star_rsp` | 已实现（按 `UpStar` 行扣料，星数上限由配置行决定） |

## 证据

### 客户端命令模块（LuaJIT 字节码字符串常量）

`analysis/scratchpad/time-temple-20261108/project/4310465233535268000-BattleTriMatchHeroCmd.lua.bin`
的 protobuf 构造原型给出请求字段与回包名：

- 112001：`Codec.EncodePB(pb_battle_tri_match_hero_up_lv_req, {site_idx, up_lv_times})`
- 112002：`Codec.EncodePB(pb_battle_tri_match_hero_up_star_req, {hero_tid})`
- 命令表 `BattleTriMatchHeroCmd` 只登记 `req_battle_tri_match_hero_up_lv`、
  `req_battle_tri_match_hero_up_star` 两项，与任务卡一致。

### protobuf

`personal-server/assets/protobuf/battle_tri_match_hero.net.proto.bin`（明文 proto3）定义
`pb_battle_tri_match_hero_up_lv_req{site_idx, up_lv_times}`、
`pb_battle_tri_match_hero_up_lv_rsp{res, change_site_data}`、
`pb_battle_tri_match_hero_up_star_req{hero_tid}`、
`pb_battle_tri_match_hero_up_star_rsp{res, change_hero_data}`；`change_site_data` 复用
`pb_battle_tri_match_site_data{index, hero_tid, level_tid}`，`change_hero_data` 复用
`pb_battle_tri_match_hero_data{tid, star}`。

### 表数据

`tools/extract-trimatch-tables.mjs` 从 `BattleTriMatchHeroTable.data.lua.bin` 还原出
`personal-server/assets/tables/BattleTriMatchHeroTable.data.lua.json.gz`：

- `Const`（1 行）：`cell_count=4`，即每方 4 个培养位。
- `BattleTriMatchPowerConst`（1 行）：`hp_ratio=1, atk_ratio=8, def_ratio=50`，
  用于三消战力换算；`damage_add_ratio/damage_sub__ratio=100` 本轮未使用。
- `Hero`（13 行）：`tid/quality/profession/camp/style/attr_template`。
- `UpLevel`（550 行）：等级 1–550，`is_break` 标记突破级，`cost_item` 为升级消耗；
  第 1 级 `cost_item=[]`。
- `UpStar`（78 行 = 13 英雄 × 6 星）：`star=0` 行为 `TableEmpty` 空消耗模板，`star>=1` 为
  真实消耗，`attr` 是 `[[4,hp%],[5,atk%],[6,def%]]`（万分之一系数）。
- `Attr`（1100 行）+ `AttrTemplate`（2 行）：按 `template:level_tid` 给出基础属性。

## 实现

共享状态与属性管线在 `personal-server/game/trimatch-core.mjs`，命令层在
`personal-server/game/trimatch-service.mjs`：

- 建表：`trimatch_site`（每角色每培养位一行，`hero_tid/level_tid`）、`trimatch_hero`
  （`hero_tid/star`）、`trimatch_ident`（阵容 uid 计数器）。全部
  `CREATE TABLE IF NOT EXISTS`，由 `ensureTrimatchTables` 幂等建立。
- `ensureRoleState`：首次访问按 `cell_count` 建位（`hero_tid=0`，等级取 `UpLevel` 最小级），
  再把背包中已拥有的英雄卡（英雄 tid 即资源 tid，数量 >0）按 tid 升序填入空位。
- 112001：从当前 `level_tid` 沿 `UpLevel` 连续行前进，逐级校验 `cost_item` 可负担后扣料，
  写入新的 `level_tid`，回包带 `pb_battle_tri_match_site_data` 与资源变化。
- 112002：校验英雄已拥有，取 `UpStar` 中 `star+1` 行扣料，写 `trimatch_hero.star`，
  回包带 `pb_battle_tri_match_hero_data`。
- 资源统一走 `resources.grantResources/consumeResources`，与钱包/背包同一口径。

## 降级与缺口

- 英雄"是否拥有"以英雄卡资源数量 >0 判定（客户端 `MatchHeroRes` 语义），没有登录模块
  单独下发表；真实登录回包如何呈现这批英雄仍无运行时证据。
- 升级不校验前置突破条件之外的门槛；`is_break` 仅作为普通行参与扣料，突破是否另有等级
  上限或额外限制无证据。
- 星级上限完全由 `UpStar` 行决定（当前 5 星），未接入 `ability` 技能解锁联动。
- 回包字段采用配置文件反推的名称，没有抓包对照；`res.is_overflow` 恒为 `false`。

## 验证

`node --check` 通过（`trimatch-core.mjs`、`trimatch-service.mjs`、`config/trimatch-tables.mjs`
等）。未运行 `npm test`，未做临时 TCP 与 SQLite 重开验证。
