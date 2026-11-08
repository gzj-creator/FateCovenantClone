# BATTLE-BATTLETRIMATCHEQUIP 实施记录（三消战斗装备养成与交换）

日期：2026-11-08。分支 `task/A2-TRIMATCH-20261108`（基线 main 8ebd5a1），worktree
`.worktree/gameplay-20261108/a2-trimatch`。只写服务端代码，未启停实时服务、未读写运行数据库、
未操作模拟器/ADB/APK；验证限于 `node --check` 与 `git diff --check`，无组件/真实 TCP 证据。

## 任务范围

任务卡 `## BATTLE-BATTLETRIMATCHEQUIP`：模块 `BattleTriMatchEquipCmd`，3 条命令此前未路由。

| type | 命令 | 请求 / 回包 | 本次状态 |
| ---: | --- | --- | --- |
| 113001 | `req_battle_tri_match_equip_up` | `pb_battle_tri_match_equip_up_req` → `pb_battle_tri_match_equip_up_rsp` | 已实现（单件升级；`is_one_key` 时逐类型升一次） |
| 113002 | `req_battle_tri_match_equip_swap` | `pb_battle_tri_match_equip_swap_req` → `pb_battle_tri_match_equip_swap_rsp` | 已实现（整格交换 / 指定类型互换） |
| 113003 | `req_battle_tri_match_equip_multiple_up` | `pb_battle_tri_match_equip_multiple_up_req` → `pb_battle_tri_match_equip_multiple_up_rsp` | 已实现（按 `times` 轮次整格连升，材料不足即停） |

## 证据

### 客户端命令模块

`analysis/scratchpad/time-temple-20261108/project/12477988553395284000-BattleTriMatchEquipCmd.lua.bin`
字符串常量给出三个 protobuf 请求字段：

- 113001：`{site_idx, equip_type_id, is_one_key}`
- 113002：`{site_idx1, equip_type_id1, site_idx2, equip_type_id2}`
- 113003：`{site_idx, times}`

命令表只登记这三项，与任务卡一致。

### protobuf

`battle_tri_match_equip.net.proto.bin`：请求如上；回包 `pb_battle_tri_match_equip_up_rsp`
为 `{res_change, repeated change_equips}`，其中 `change_equips` 为
`pb_battle_tri_match_equip_site_data{site_idx, repeated equips}`，
`equips` 是 `pb_battle_tri_match_equip_data{equip_type_tid, level_tid}`；
`swap_rsp`/`multiple_up_rsp` 结构与 `up_rsp` 同形，差别只在是否有 `res_change`。

### 表数据

`BattleTriMatchEquipTable.data.lua.json.gz`（本次新提取）：

- `Type`（4 行）：武器/衣服/戒指/鞋子四类装备槽，`tid` 即 `equip_type_id`。
- `UpLevel`（2200 行 = 4 类 × 550 级）：每行含 `equip_type/level/quality/stage/is_break`、
  `cost_item`、`attr`（`[[2,atk],[1,hp]]` 等）。
- `Quality`（7 行）：品质底色资源，仅表现用。

## 实现

- 建表 `trimatch_equip(role_id, site_index, equip_type_tid, level_tid)`，主键
  `(role_id, site_index, equip_type_tid)`；`ensureRoleState` 首次为每个培养位补齐四类装备并取
  各自 `UpLevel` 首级作为初始等级。
- `equipUpOne`：按 `equip_type` 找到当前 `level_tid` 在同类列表中的下一行，扣 `cost_item`
  后写入；一键/连升模式下材料不足的行跳过（可负担则继续），全无进展时返回 `CODE_LIMIT`。
- 113002：`equip_type_id1/2` 均为 0 时按整格交换四类装备等级；否则要求两端类型都合法并按
  类型互换。回包按交换后真实行回填 `change_equips`。
- 113003：按 `times`（上限 200）循环整格四类各升一级，直到某轮没有任何一类能升级。
- 装备属性在 `trimatch-core.heroAttributes` 中并入英雄属性（`attr` 的 1/2/3 分别加
  hp/atk/def），供战斗与战力使用。

## 降级与缺口

- 交换只交换等级 `level_tid`，不交换品质/星级（配置里装备等级行已内含品质，因此实际表现
  等价）；若客户端期望交换整个 `pb_battle_tri_match_equip_data` 其余字段，需抓包确认。
- 一键升级当前只升一次；`is_one_key` 是否应连升到材料耗尽无证据，故保守处理。
- 突破级（`is_break=true`）只作为普通行参与扣料，未实现额外的突破条件校验。
- 没有登录下发表；装备数据在登录回包中的位置仍无证据。

## 验证

`node --check` 通过。未跑 `npm test`，未做真实 TCP / SQLite 重开验证。
