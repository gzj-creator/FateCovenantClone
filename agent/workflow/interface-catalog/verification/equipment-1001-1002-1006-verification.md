# 装备接口 1001/1002/1006 真实流量验证报告

验证日期：2026-11-01（基于仓库当前 main 基线）

## 结论

- **未找到** `1001 req_equip_level_up`、`1002 req_equip_forge`、`1006 req_equip_wear` 的真实 TCP 请求/回包。
- 文档 `equipment-1001-1002-1006.md` 状态保持 `static-only`，不更新为 `observed`。
- 静态契约层（proto bin + static-schemas.json）与文档定义一致，无字段/类型/重复标记偏差；`res_change` 字段名在三个回包中均正确。

## 搜索范围

1. 注册采集清单：`analysis/tools/protocol/recordings.json`
   - `protocol-2026-10-25`（2555 包）
   - `protocol-2026-10-25-r2a`（1887 包）
2. 解码产物：
   - `/f/$RECYCLE.BIN/.../protocol-2026-10-25/decoded.local-only.json`
   - `/f/$RECYCLE.BIN/.../protocol-2026-10-25-r2a/decoded.local-only.json`
3. 操作证据：两份 `operations.jsonl`（无装备操作标记）
4. 静态契约：`static-schemas.json`、`equip.net.proto.bin`、`EquipCmd.lua` 编码器

## 真实流量查找结果

- 两份解码文件的 `result.messages` 中唯一 type 集合均**不包含** 1001/1002/1006：
  - `protocol-2026-10-25`：`{-1,0,201,202,207,208,209,508,636,638,1303,1402,2000,7000,7201,8000,8001,9131,10503,10507,53001,100601,102801,107703,117005,909103}`
  - `protocol-2026-10-25-r2a`：`{-1,0,201,202,207,208,209,508,601,1202,1303,1402,2000,7000,7201,8000,9010,9131,10503,10507,53001,85901,100601,102801,107703,909103}`
- 消息 `name` 集合中无 `req_equip_level_up` / `req_equip_forge` / `req_equip_wear`；仅出现 `equip_ids`（编队 fighter 字段）。
- `operations.jsonl` 无装备相关操作标记；coverage.md 明确 "equipment ... not yet isolated in current new-account tutorial"。
- 因此未找到可引用的 recording ID / packet number 示例。

## 原因说明

采集账号为新手教程号，用户游玩过程中未触发装备升级/锻造/穿戴操作（装备系统尚未解锁或未操作），故流量中不存在这三个接口。现有采集仅覆盖登录、引导、战斗、招募、编队、英雄升级/突破等。

## 静态契约一致性校验（无运行时解码，仅静态层）

对比 `equipment-1001-1002-1006.md` 与 `static-schemas.json` / `equip.net.proto.bin`：

| 接口 | 文档 | 静态 schema | 结果 |
| --- | --- | --- | --- |
| 1001 req | `pb_equip_level_up_req { repeated pb_equip_level_up_equip equips=1 }` | equips repeated pb_equip_level_up_equip, tag1 | 一致 |
| 1001 req item | `id uint32=1, add_level uint32=2` | id uint32 tag1, add_level uint32 tag2 | 一致 |
| 1001 rsp | `equips repeated pb_equip=1, res_change pb_res_to_client=2` | equips repeated pb_equip tag1, res_change pb_res_to_client tag2 | 一致 |
| 1002 req | `equips repeated pb_equip_forge_one=1, is_one_key bool=2` | 同 | 一致 |
| 1002 req item | `index uint32=1, equip_id uint32=2, times uint32=3` | 同 | 一致 |
| 1002 rsp | `res_change=1, equip repeated pb_equip=2, change_lineup repeated pb_lineup=3, cur_pre_lineup pb_pre_lineup=4` | 同 | 一致 |
| 1006 req | `wears repeated pb_equip_wear=1` | 同 | 一致 |
| 1006 req item | `index/id/tid uint32 =1/2/3` | 同 | 一致 |
| 1006 rsp | `res_change=1, equips repeated pb_equip=2, change_lineup=3, cur_pre_lineup=4` | 同 | 一致 |
| 编码方式 | 三个均为 protobuf | tcp-commands.md 标记 `pb` | 一致 |
| 资源字段 | 三个回包均为 `res_change`（非 `res`） | static schema 字段名 `res_change` | 一致 |

未发现任何不一致。

## 状态更新

- 未找到真实流量，保持文档状态 `static-only`，不修改 `equipment-1001-1002-1006.md` 状态行。
- `interfaces.json` 中三个 c2s 条目仍为 `observed:false, decoded:false, actionVerified:false`。
