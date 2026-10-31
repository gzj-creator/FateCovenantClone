# M2：FantasyEquipCmd `876xx`

## 目标

在保留阶段一已有 `87617–87618` 的基础上，完成并审计 `87601`、`87603–87611`、`87613–87618`。这些命令是三个抽卡池、活动试炼和心愿系统的前置。

## 独占文件

允许修改：

- `personal-server/game/fantasy-equipment-service.mjs`
- `personal-server/game/fantasy-draw-service.mjs`
- `personal-server/test/fantasy-equipment-service.test.mjs`（新建）
- `personal-server/test/fantasy-draw-service.test.mjs`

依赖 M1。禁止直接修改 `gateway.mjs`；把所需 request schema 和 response schema 列在交接中，由 M6 接线。

## 命令与 Proto

| 命令 | 请求 | 响应/行为 |
|---|---|---|
| `87601 req_fantasy_equip_put_on` | `pb_fantasy_equip_put_on_req` | `pb_fantasy_equip_put_on_rsp` |
| `87603 req_fantasy_equip_take_off` | `pb_fantasy_equip_take_off_req` | `pb_fantasy_equip_take_off_rsp` |
| `87604 req_fantasy_equip_bless` | `pb_fantasy_equip_bless_req` | `pb_fantasy_equip_bless_rsp` |
| `87605 req_fantasy_equip_break_up` | `pb_fantasy_equip_id` | `pb_fantasy_equip_dev_rsp` |
| `87606 req_fantasy_equip_levelup` | `pb_fantasy_equip_level_up_req` | `pb_fantasy_equip_level_up_rsp` |
| `87607 req_fantasy_equip_starup` | `pb_fantasy_equip_composite_req` | `pb_fantasy_equip_composite_rsp` |
| `87608 req_fantasy_equip_sp_starup` | `pb_fantasy_equip_dev_req` | `pb_fantasy_equip_dev_rsp` |
| `87609 req_fantasy_equip_composite` | `pb_fantasy_equip_composite_req` | `pb_fantasy_equip_composite_rsp` |
| `87610 req_fantasy_equip_synthesis` | ETF | `pb_res_to_client` |
| `87611 req_fantasy_lineup_custom` | `pb_fantasy_equip_lineup_custom_req` | `pb_fantasy_equip_lineup_custom_rsp` |
| `87613 req_fantasy_one_key_lineup_custom` | `pb_fantasy_equip_lineup_one_key_req` | `pb_fantasy_equip_lineup_one_key_rsp` |
| `87614 rep_fantasy_in_formation` | `pb_fantasy_formation_list` | ETF fallback |
| `87615 req_fantasy_equip_sp_quality_up` | `pb_fantasy_awakening_req` | `pb_fantasy_equip_dev_rsp` |
| `87616 req_fantasy_equip_ur_star_up` | `pb_fantasy_awakening_req` | `pb_fantasy_equip_dev_rsp` |
| `87617 req_fantasy_equip_draw_set_wish` | `pb_fantasy_equip_draw_wish_req` | `pb_fantasy_draw` |
| `87618 req_fantasy_equip_draw_buy` | ETF 单个购买量 | `pb_fantasy_equip_draw_buy_rsp` |

## 已知实现缺陷与规则

### 穿戴与卸下

- `hero_tid` 必须只匹配 `hero.tid`，不能同时接受 `hero.uid`。
- 校验该英雄存在、装备存在且 tid/uid 一致、可上阵、品质门槛、专属英雄匹配。
- 同英雄重复穿戴应稳定成功或稳定拒绝，且不产生重复编队行。
- 跨英雄替换时，原英雄和原持有人都要更新 `fantasy_equip/fantasy_tid`，返回 `changed_hero`、卸下装备和编队变化。
- 卸下已无装备应为稳定的无操作或明确业务错误，不能破坏编队。

### 升星与品质升级

- 客户端确认 `GetStarCostTid = quality * 1000 + star`。
- 普通幻武使用 `FantasyStarUp`；专属 q50 使用 `FantasySpStarUp`；SP q60/70 使用专属/SP 星表。
- 当前普通 `starUp()` 错误地让专属走普通表，必须拆开。
- 普通材料价值：
  - 当前行 `need_mat` 是材料档位，`need_cost * value(need_mat)` 是总价值。
  - `need_cost=0` 时可免费升星。
  - 可提交普通幻武、raw 或由一键合成产生的材料；专属和 SP 装备不得当普通材料。
  - 不能用 quality/star 完全相等作为唯一材料条件。
  - 删除无证据的 `materialSpec % 1000 === 5` 分支。
- `over_value = submittedValue - requiredValue`。所有提交材料都消费；每个超量价值点通过同事务创建对应数量的 `ItemTable.TID_FANTASY_EQUIP_ONE_STAR`，证据 tid 为 `1100119`。禁止吞掉超量材料。
- 普通升星达到 `is_max_star` 后拒绝 `87607`，要求品质升级 `87609`；成功升星 `star += 1`、`star_node = 0`。
- `87609` 仅在当前行 `is_max_star` 时执行；目标品质来自 `FantasyQualityUp.next_quality_item`，目标 Item 决定新 quality，随后 `star=0/star_node=0`。

### 专属与 SP

- `GetStarUpChipNum`：SP 取 `ur_cost_num`，其他取 `cost_num`，不能两个字段同时扣。
- 专属/SP 晶片来自 `ItemTable.Chip[point_item == equip.tid]`。
- 成本与 `node_num - star_node` 相关，必须按客户端字节码逐步推进，不能按固定一次处理。
- `stone_tid/stone_num`、`sp_god_stone_tid/sp_god_stone_num` 和数据行 `FantasyStarStoneTid` 都要纳入服务端成本：
  - 1 → `[651002, 22002]`
  - 2 → `[652002, 22002]`
  - 3 → `[653002, 22002]`
  - 4 → `[654002, 22002]`
- 客户端发送 `times=0` 时视为一次“按服务端规则推进”，不能当非法值拒绝。
- `87615/87616` 客户端 `cost_list` 只能用于与权威成本一致性检查，不能决定扣除项。

### 祝福

- `pb_fantasy_equip_bless_material.composite_req` 必须实现：先一键合成祝福材料，再参与祝福，整个流程同事务。
- 校验主装备、祝福槽位置/数量/品质解锁、目标 tid/quality/star、材料价值、超额补偿。
- 主角穿戴、已被祝福、作为主装备本人或重复提交的装备不能当材料。
- 卡片、材料、英雄引用、模块 518 和资源变化要产生完整 `equips/changed_hero/res/over_value`。

### 碎片合成 `87610`

- 请求是 ETF，可能一次携带多个 tid；M6 必须按实际结构解包。
- 通过 `ItemTable.Chip.point_item` 和 `need_num` 校验 raw 数量。
- 每件成品消耗该晶片的 `need_num`，通过 M1 创建装备并增加 raw/资源回包。
- 不能假定一个 raw 数量生成一件成品。
- 非法列表、重复 tid、未知晶片或数量不足时整个批次回滚。

### 编队

- `87611` 的 `hero_tid` 严格按 TID 匹配。
- `bless_equip` 数量、位置、归属、品质和可上阵性必须服务端校验。
- `lineup_type` 不能越界或越权。
- custom attr type 4 的 `pb_lineup_custom_fantasy_info` 必须做 PB pack/unpack 往返。
- `87613` 全有或全无；任一角色/装备失败则回滚全部英雄和编队。
- `87614` 是 ETF fallback，需要明确空值、多条 formation 和重复 UID/slot 的语义。
- 所有编队更新后，模块 518 第 1/2 块和英雄列表必须一致，重启后仍一致。

### 心愿与购买

- 保留现有 `87617`：累计抽数、解锁数量、候选合法性、去重和持久化。
- 保留现有 `87618`：商品 `FantasyDrawNormal#1`、钻石 `101500`、券 `808002`、日上限 10、终身 70、跨日刷新和同一事务。
- 只做必要修正；不要重写或回退阶段一。

## 测试门槛

测试文件必须覆盖每个命令的正常 PB 回包以及：

- 空 ID、未知 tid、uid/tid 不一致、错误 hero UID 被当作 TID
- 伪造数量、奖励、material、cost_list、times、target quality/star
- 资源/raw 不足后的完全回滚
- 普通、专属、SP 三条升星路径和边界星/节点
- 品质升级、满星限制、免费升星、总材料价值与 `over_value=1100119` 入库
- 祝福内一键合成、祝福槽上限、重复材料、穿戴装备上锁
- 晶片 `need_num` 合成、批内失败回滚、删除最后一 raw 行
- 穿戴替换、跨英雄替换、重复穿戴、卸下、专属错配、编队同步
- 心愿候选/解锁/重复、购买上限/跨日/重启
- 重复请求和并发请求
- SQLite 编码错误/写入错误回滚
- 模块 518 第 0/1/2 块互不覆盖

## 完成标准

- 所有 16 个命令有真实业务实现，不保留空壳或“成功后什么都不做”的分支。
- 专项测试通过，且没有通过修改测试掩盖现有错误。
- 交接中列出每个命令最终请求 schema、响应 schema、错误码、持久化字段和证据文件。
