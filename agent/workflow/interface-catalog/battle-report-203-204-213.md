# 战斗报告读取接口参数（203 / 204 / 213）

本文面向接口实现，给出 `203`、`204`、`213` 的请求和回包参数。字段定义、tag、类型和调用侧编码均已从当前客户端静态产物核对；这三个接口尚无实观请求/回包，也没有运行时状态变更或客户端操作验收。

> 当前状态：`static-only`。本文可用于实现和编解码，不代表已捕获线上流量或已完成客户端操作验收。

任务指定名称与客户端静态命令名的对应关系：

| 任务指定名 | 客户端静态命令名 | type |
| --- | --- | --- |
| `req_fight_report` | `get_fight_report` | 203 |
| `req_last_fight_report` | `get_fight_report_battle` | 204 |
| `req_get_fight_report_list` | `get_fight_report_full` | 213 |

三个客户端命令都使用同一组请求/响应消息：请求 `pb_get_fight_report`，响应 `pb_fight_report_res`。差异仅在客户端调用入口（`FightCmd` 的不同函数）；静态证据没有显示请求字段或响应字段的差异。

静态契约来源：

- 机器可读目录：[interfaces.json](interfaces.json)
- 完整消息定义：[static-schemas.json](static-schemas.json)
- 战斗报告网络协议原文：`analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__protobuf.bundle/textassets/4691279346245734000-fight_report.net.proto.bin`，SHA256 `b9ae2d1117ee41a73c88388c938c978fcf8a1e4d6afa2fd482fd3ff56724547c`
- 战斗报告数据库协议原文：`analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__protobuf.bundle/textassets/14171542052218886000-fight.db.proto.bin`，SHA256 `3bddaecfdc9399acf7e0e745f877e245275a9efebe42975f4fed57dac291e256`
- Lua 编码器：`analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_project.bundle/textassets/13504459777583070000-FightCmd.lua.bin`，SHA256 `482692f51d6872e454529bd2fb2f79b5923e5747b28eba4e5799484363f53ed0`

## 传输信封

每条 TCP 消息前有 4 字节大端负载长度。握手阶段确定的 flags 决定是否加密，业务实现沿用现有网关，不在这里另定义握手、加密或签名。

请求由 `pb_c2s` 包裹：

```proto
message pb_c2s {
  uint32 seq = 1;   // 客户端请求序号，非零
  sint32 type = 2;  // 203 / 204 / 213
  bytes data = 3;   // 下表的请求 PB
  int64 time_ms = 4;
}
```

`type` 使用 `sint32/ZigZag`，`data` 是请求消息的 protobuf wire bytes。

成功回包由 `pb_s2c` 包裹：

```proto
message pb_net_err {
  sint32 err = 1;
  bytes vars = 2;
  string stacktrace = 3;
}

message pb_s2c {
  uint32 seq = 1;
  uint32 type = 2;
  bytes data = 3;
  pb_net_err err = 4;
}
```

业务回复必须复用请求的 `seq`，`data` 放对应响应 PB。本仓库当前网关的成功回复写法是只发送 `{seq, data}`，不带 `type`；客户端按非零 `seq` 关联请求。不要假设响应 `type` 等于 203/204/213。`seq=0` 的帧属于推送。

失败回复沿用现有网关模式：省略 `data`，发送 `{seq, err: {err: <code>}}`。上述 `send` 模式见 [`personal-server/game/gateway.mjs`](../../../personal-server/game/gateway.mjs)。

## 接口总表

| type | 客户端命令 | 请求 | 请求 payload | 成功响应 payload | 客户端编码入口 |
| ---: | --- | --- | --- | --- | --- |
| 203 | `get_fight_report` | `pb_get_fight_report` | `pb_get_fight_report` | `pb_fight_report_res` | `FightCmd.get_fight_report(fight_id)` |
| 204 | `get_fight_report_battle` | `pb_get_fight_report` | `pb_get_fight_report` | `pb_fight_report_res` | `FightCmd.get_fight_report_battle(fight_id)` |
| 213 | `get_fight_report_full` | `pb_get_fight_report` | `pb_get_fight_report` | `pb_fight_report_res` | `FightCmd.get_fight_report_full(fight_id)` |

三个入口在静态证据中都把单个 `fight_id` 寄存器值写入 `pb_get_fight_report.fight_id`；`pb_get_fight_report.fight_id` 字段本身是 `repeated int64`，因此客户端通常传单元素数组，服务端按数组处理。

## type 203：战斗报告读取（`get_fight_report`）

请求消息：

```proto
message pb_get_fight_report {
  repeated int64 fight_id = 1;  // 战斗id
}
```

| 路径 | tag | 类型 | 重复 | 参数 |
| --- | ---: | --- | --- | --- |
| `fight_id` | 1 | `int64` | 是 | 战斗 id 列表。字段名是单数但类型为 repeated；decode 输出按字符串处理 |

请求对象形状：

```json
{
  "fight_id": ["0"]
}
```

上例只表示字段形状，示例数值不代表合法游戏数据。`FightCmd.get_fight_report` 把输入寄存器值直接写入 `fight_id`；静态证据没有额外字段。

回包消息：

```proto
message pb_fight_report_res {
  repeated pb_fight_report report = 1;  // 战报
}
```

| 路径 | tag | 类型 | 重复 | 参数 |
| --- | ---: | --- | --- | --- |
| `report` | 1 | `pb_fight_report` | 是 | 战报列表。字段名是单数但类型为 repeated |

## type 204：最近战斗报告（`get_fight_report_battle`）

请求消息与 203 相同：`pb_get_fight_report`（`repeated int64 fight_id = 1`）。

回包消息与 203 相同：`pb_fight_report_res`（`repeated pb_fight_report report = 1`）。

静态证据中 204 的 Lua 编码器与 203 完全同形，仅函数名和 `firstLine/bytecodeOffset` 不同；没有显示请求字段或响应字段的差异。实现端不能仅凭 type 区分不同的请求 schema。

## type 213：战斗报告列表（`get_fight_report_full`）

请求消息与 203 相同：`pb_get_fight_report`（`repeated int64 fight_id = 1`）。

回包消息与 203 相同：`pb_fight_report_res`（`repeated pb_fight_report report = 1`）。

静态证据中 213 的 Lua 编码器与 203 完全同形，仅函数名和 `firstLine/bytecodeOffset` 不同；没有显示请求字段或响应字段的差异。

## 共享战斗报告结构

三个接口的回包都使用下面的 `pb_fight_report` 及其嵌套结构。

```proto
message pb_fight_report {
  int64 id = 1;                              // 战斗Id
  int64 tid = 2;                             // 战斗Tid
  int32 type = 3;                            // 战斗类型
  int64 atk_role_id = 4;                     // 进攻方角色Id
  int64 def_role_id = 5;                     // 防守方角色Id
  repeated pb_fight_report_battle battle_list = 6;   // 战报对战数据列表
  int64 time = 7;                            // 战报时间/秒
  int32 final_result = 8;                    // 战斗最终结果
  bool finish = 9;                           // 是否已结算
  bytes req = 10;                            // 发起战斗的数据缓存（战报回放会用到）
  repeated pb_fight_report_battle add_battle_list = 11;  // 加时赛对战数据列表
  bool ignore_inherit = 12;                  // 忽略战斗数据继承
  int32 atk_rank = 13;                       // 进攻方团队评级
  int32 def_rank = 14;                       // 防守方团队评级
  int32 team_count = 15;                     // 队伍数量
  uint64 atk_power = 16;                     // 进攻方总战力
  uint64 def_power = 17;                     // 防守方总战力
}
```

| 字段 | tag | 类型 | 重复 | 说明 |
| --- | ---: | --- | --- | --- |
| `id` | 1 | `int64` | 否 | 战斗 Id；decode 输出按字符串处理 |
| `tid` | 2 | `int64` | 否 | 战斗 Tid；decode 输出按字符串处理 |
| `type` | 3 | `int32` | 否 | 战斗类型 |
| `atk_role_id` | 4 | `int64` | 否 | 进攻方角色 Id；decode 输出按字符串处理 |
| `def_role_id` | 5 | `int64` | 否 | 防守方角色 Id；decode 输出按字符串处理 |
| `battle_list` | 6 | `pb_fight_report_battle` | 是 | 战报对战数据列表 |
| `time` | 7 | `int64` | 否 | 战报时间/秒；decode 输出按字符串处理 |
| `final_result` | 8 | `int32` | 否 | 战斗最终结果 |
| `finish` | 9 | `bool` | 否 | 是否已结算 |
| `req` | 10 | `bytes` | 否 | 发起战斗的数据缓存，战报回放会用到 |
| `add_battle_list` | 11 | `pb_fight_report_battle` | 是 | 加时赛对战数据列表 |
| `ignore_inherit` | 12 | `bool` | 否 | 忽略战斗数据继承 |
| `atk_rank` | 13 | `int32` | 否 | 进攻方团队评级 |
| `def_rank` | 14 | `int32` | 否 | 防守方团队评级 |
| `team_count` | 15 | `int32` | 否 | 队伍数量（进攻方数量 * 100 + 防守方数量） |
| `atk_power` | 16 | `uint64` | 否 | 进攻方总战力；decode 输出按字符串处理 |
| `def_power` | 17 | `uint64` | 否 | 防守方总战力；decode 输出按字符串处理 |

`pb_fight_report_battle`：

```proto
message pb_fight_report_battle {
  int32 atk_team_index = 1;                      // 进攻方队伍下标
  int32 def_team_index = 2;                      // 防守方队伍下标
  repeated pb_fighter_base_info fighter_list = 3; // 战斗者列表
  repeated bytes action_list = 4;                // 战斗行为列表
  int32 over_reason = 5;                        // 对战结束原因
  int32 over_round = 6;                         // 结束回合
  int32 result = 7;                             // 每场对战的结果
  bool is_add_battle = 8;                       // 是否是附加赛
  uint64 atk_power = 9;                         // 进攻方战力
  uint64 def_power = 10;                        // 防守方战力
  pb_fight_report_lineup atk_brief_lineup = 11; // 进攻方阵容
  pb_fight_report_lineup def_brief_lineup = 12; // 防守方阵容
}
```

| 字段 | tag | 类型 | 重复 | 说明 |
| --- | ---: | --- | --- | --- |
| `atk_team_index` | 1 | `int32` | 否 | 进攻方队伍下标 |
| `def_team_index` | 2 | `int32` | 否 | 防守方队伍下标 |
| `fighter_list` | 3 | `pb_fighter_base_info` | 是 | 战斗者列表 |
| `action_list` | 4 | `bytes` | 是 | 战斗行为列表 |
| `over_reason` | 5 | `int32` | 否 | 对战结束原因 |
| `over_round` | 6 | `int32` | 否 | 结束回合 |
| `result` | 7 | `int32` | 否 | 每场对战的结果 |
| `is_add_battle` | 8 | `bool` | 否 | 是否是附加赛 |
| `atk_power` | 9 | `uint64` | 否 | 进攻方战力；decode 输出按字符串处理 |
| `def_power` | 10 | `uint64` | 否 | 防守方战力；decode 输出按字符串处理 |
| `atk_brief_lineup` | 11 | `pb_fight_report_lineup` | 否 | 进攻方阵容 |
| `def_brief_lineup` | 12 | `pb_fight_report_lineup` | 否 | 防守方阵容 |

`pb_fight_report_lineup`：

```proto
message pb_fight_report_lineup {
  repeated pb_fight_report_lineup_team team_list = 1;
}
```

| 字段 | tag | 类型 | 重复 | 说明 |
| --- | ---: | --- | --- | --- |
| `team_list` | 1 | `pb_fight_report_lineup_team` | 是 | 队伍列表 |

`pb_fight_report_lineup_team`：

```proto
message pb_fight_report_lineup_team {
  uint64 team_index = 1;                           // 第几队
  repeated pb_fight_report_fighter fighter_list = 2; // 战斗者简要信息
}
```

| 字段 | tag | 类型 | 重复 | 说明 |
| --- | ---: | --- | --- | --- |
| `team_index` | 1 | `uint64` | 否 | 第几队；decode 输出按字符串处理 |
| `fighter_list` | 2 | `pb_fight_report_fighter` | 是 | 战斗者简要信息 |

`pb_fight_report_fighter`：

```proto
message pb_fight_report_fighter {
  uint64 tid = 1;        // 英雄tid
  bool is_mutant = 2;    // 是否变异
}
```

| 字段 | tag | 类型 | 重复 | 说明 |
| --- | ---: | --- | --- | --- |
| `tid` | 1 | `uint64` | 否 | 英雄 tid；decode 输出按字符串处理 |
| `is_mutant` | 2 | `bool` | 否 | 是否变异 |

`pb_fighter_base_info`：

```proto
message pb_fighter_base_info {
  int64 id = 1;
  int64 tid = 2;
  int32 role_type = 3;
  // tag 4 在 proto 中缺失
  int64 uid = 5;
  int64 role = 6;
  int32 team = 7;
  int32 team_index = 8;
  int32 loc = 9;
  int32 star = 10;
  int32 level = 11;
  int32 quality = 12;
  int64 hp = 13;
  int64 max_hp = 14;
  bool enable = 15;
  int64 final_hp = 16;
  int64 style = 17;
  repeated uint64 pet = 18;
  int32 source = 19;
  repeated pb_fighter_attr init_attr = 20;
  repeated int64 ability_list = 21;
  repeated pb_fighter_inherit_common inherit_list = 22;
  bool is_mutant = 23;
  int64 fantasy_equip_tid = 24;
  int32 mastery = 25;
  uint64 hero_diff = 26;
  repeated pb_fighter_attr all_attr = 27;
  repeated int64 hero_other_ab_list = 28;
  int32 reforge_skill_n = 29;
  // tag 30 在 proto 中缺失
  uint64 water_gun = 31;
  repeated uint64 skin_tid = 32;
  repeated uint64 help_elves = 33;
}
```

| 字段 | tag | 类型 | 重复 | 说明 |
| --- | ---: | --- | --- | --- |
| `id` | 1 | `int64` | 否 | 战斗者 id；decode 输出按字符串处理 |
| `tid` | 2 | `int64` | 否 | 战斗者模板 id；decode 输出按字符串处理 |
| `role_type` | 3 | `int32` | 否 | 角色类型 |
| `uid` | 5 | `int64` | 否 | 唯一 id；decode 输出按字符串处理 |
| `role` | 6 | `int64` | 否 | 角色 id；decode 输出按字符串处理 |
| `team` | 7 | `int32` | 否 | 队伍 |
| `team_index` | 8 | `int32` | 否 | 队伍下标 |
| `loc` | 9 | `int32` | 否 | 站位 |
| `star` | 10 | `int32` | 否 | 星级 |
| `level` | 11 | `int32` | 否 | 等级 |
| `quality` | 12 | `int32` | 否 | 品质 |
| `hp` | 13 | `int64` | 否 | 当前生命；decode 输出按字符串处理 |
| `max_hp` | 14 | `int64` | 否 | 最大生命；decode 输出按字符串处理 |
| `enable` | 15 | `bool` | 否 | 是否启用 |
| `final_hp` | 16 | `int64` | 否 | 结算生命；decode 输出按字符串处理 |
| `style` | 17 | `int64` | 否 | 风格；decode 输出按字符串处理 |
| `pet` | 18 | `uint64` | 是 | 宠物列表；decode 输出按字符串处理 |
| `source` | 19 | `int32` | 否 | 来源 |
| `init_attr` | 20 | `pb_fighter_attr` | 是 | 初始属性 |
| `ability_list` | 21 | `int64` | 是 | 技能列表；decode 输出按字符串处理 |
| `inherit_list` | 22 | `pb_fighter_inherit_common` | 是 | 继承列表 |
| `is_mutant` | 23 | `bool` | 否 | 是否变异 |
| `fantasy_equip_tid` | 24 | `int64` | 否 | 幻装装备 tid；decode 输出按字符串处理 |
| `mastery` | 25 | `int32` | 否 | 精通 |
| `hero_diff` | 26 | `uint64` | 否 | 英雄差异；decode 输出按字符串处理 |
| `all_attr` | 27 | `pb_fighter_attr` | 是 | 全部属性 |
| `hero_other_ab_list` | 28 | `int64` | 是 | 其他技能列表；decode 输出按字符串处理 |
| `reforge_skill_n` | 29 | `int32` | 否 | 重铸技能数 |
| `water_gun` | 31 | `uint64` | 否 | 水枪；decode 输出按字符串处理 |
| `skin_tid` | 32 | `uint64` | 是 | 皮肤 tid 列表；decode 输出按字符串处理 |
| `help_elves` | 33 | `uint64` | 是 | 助战精灵列表；decode 输出按字符串处理 |

`pb_fighter_attr`：

```proto
message pb_fighter_attr {
  int32 type = 1;
  int64 value = 2;
}
```

| 字段 | tag | 类型 | 重复 | 说明 |
| --- | ---: | --- | --- | --- |
| `type` | 1 | `int32` | 否 | 属性类型 |
| `value` | 2 | `int64` | 否 | 属性值；decode 输出按字符串处理 |

`pb_fighter_inherit_common`：

```proto
message pb_fighter_inherit_common {
  uint32 type = 1;
  int64 value = 2;
}
```

| 字段 | tag | 类型 | 重复 | 说明 |
| --- | ---: | --- | --- | --- |
| `type` | 1 | `uint32` | 否 | 继承类型 |
| `value` | 2 | `int64` | 否 | 继承值；decode 输出按字符串处理 |

## 共享数据库战报缓存结构（仅静态）

`pb_fight_report_list`（数据库协议，非本三接口的 wire 响应）：

```proto
message pb_fight_report_list {
  repeated pb_fight_report reports = 1;
}
```

该消息与 `pb_fight_report_res` 的字段同形（`reports` vs `report`），但不是 203/204/213 的响应包络。响应仍使用 `pb_fight_report_res.report`。

`pb_fight_report_id`（用于聊天分享的战报摘要，非本三接口的 wire 响应）：

```proto
message pb_fight_report_id {
  int64 id = 1;            // 战报ID
  string name = 2;         // 战报名字
  int64 atk_role_id = 3;   // 进攻方角色Id
  int64 def_role_id = 4;   // 防守方角色Id
  int64 time = 5;           // 战报时间/秒
  int64 tid = 6;            // 战斗Tid
  int32 type = 7;           // 战斗类型
  int32 final_result = 8;   // 战斗最终结果
  bytes req = 9;            // 发起战斗的数据缓存
}
```

| 字段 | tag | 类型 | 重复 | 说明 |
| --- | ---: | --- | --- | --- |
| `id` | 1 | `int64` | 否 | 战报 ID；decode 输出按字符串处理 |
| `name` | 2 | `string` | 否 | 战报名字 |
| `atk_role_id` | 3 | `int64` | 否 | 进攻方角色 Id；decode 输出按字符串处理 |
| `def_role_id` | 4 | `int64` | 否 | 防守方角色 Id；decode 输出按字符串处理 |
| `time` | 5 | `int64` | 否 | 战报时间/秒；decode 输出按字符串处理 |
| `tid` | 6 | `int64` | 否 | 战斗 Tid；decode 输出按字符串处理 |
| `type` | 7 | `int32` | 否 | 战斗类型 |
| `final_result` | 8 | `int32` | 否 | 战斗最终结果 |
| `req` | 9 | `bytes` | 否 | 发起战斗的数据缓存 |

## 实现交接约束

- 使用仓库现有 `personal-server/protocol/game-codec.mjs` 的 `codec.pack(schemaName, object)` / `codec.unpack(schemaName, bytes)`，保留 proto 的 snake_case 字段名。
- 三个接口的请求字段都是 `fight_id`（repeated int64），响应装备字段都是 `report`（repeated pb_fight_report）。
- `pb_get_fight_report.fight_id` 是单数字段名但 repeated；构造请求时按数组传入。
- `pb_fight_report_res.report` 是单数字段名但 repeated；构造响应时按数组传入。
- `int64/uint64/sint64` 在仓库现有 codec 的 decode 输出中按字符串处理；构造时不要经过可能丢失精度的 JavaScript `number`。
- 成功回包复用请求 `seq`；当前本机服实现的业务回复不设置 `pb_s2c.type`。
- `pb_fighter_base_info` 的 tag 4 和 tag 30 在 proto 中缺失，实现时不要自行补字段。
- 三个接口当前都只有静态契约，不能标记为“已捕获”“已解码回包”或“已操作验收”，除非后续提供对应运行时证据。
- 静态证据没有显示 203/204/213 的请求或响应字段差异；实现端如需区分语义，必须依赖后续运行时证据，不能仅凭 type 假设。
