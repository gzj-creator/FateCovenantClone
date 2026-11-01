# 装备精炼与铭刻接口 1003/1004/1005 真实流量验证报告

验证日期：2026-11-01（基于仓库当前 main 基线）

## 结论

- **未找到** `1003 req_equip_refine`、`1004 req_equip_refine_one_key`、`1005 req_equip_inscription` 的真实 TCP 请求/回包。
- 文档 `equipment-1003-1004-1005.md` 状态保持 `static-only`，不更新为 `observed`。
- 静态契约层（proto bin + static-schemas.json + interfaces.json）与文档定义一致，无字段/类型/重复标记/编码方式偏差；1003 请求为 `etf`（无 proto 请求消息）、1004/1005 请求为 protobuf，1003 `multi` 单值 vs 1004 `multi` repeated 的差异在静态 schema 中正确反映。

## 搜索范围

1. 注册采集清单：`analysis/tools/protocol/recordings.json`
   - `protocol-2026-10-25`（2555 包，handoff 记录）
   - `protocol-2026-10-25-r2a`（1887 包，handoff 记录）
   - 两目录在当前 main 基线下均已清理（`.gitignore` 忽略 `*.local-only.*` / `captures` 未提交），仓库内无 `analysis/captures/` 目录。
2. 解码产物：仓库内无 `decoded.local-only.json` / `operations.jsonl`（已在采集收尾时移除）。
3. 服务端命令日志：`analysis/experiments/private-server-20261025/p3/runtime.local-only.data/events.jsonl`（164125 行）。
4. 服务端 wire-capture：`analysis/experiments/private-server-20261025/p3/wire-capture-20261028*.local-only/`（6 个 s2c bin 帧）。
5. 客户端日志：`analysis/experiments/private-server-20261025/p3/client-current-20261028.local-only.log`。
6. 静态契约：`static-schemas.json`、`interfaces.json`、`equip.net.proto.bin`、`EquipCmd.lua.bin`。

## 真实流量查找结果

- `events.jsonl` 中 `event=command` 的 distinct type 共 77 种，**不包含** 1003/1004/1005：
  ```
  -1, 108, 151, 152, 159, 201, 202, 208, 209, 218, 503, 506, 508, 599, 600, 601, 614, 636, 638, 639, 640, 642, 644, 645, 1112, 1202, 1308, 2000, 2001, 2011, 3003, 3004, 7000, 8000, 9005, 9010, 10507, 16003, 16004, 16005, 35001, 53001, 53002, 79104, 82101, 82601, 84601, 84603, 85901, 87601, 87614, 87618, 89001, 89501, 89801, 91402, 91403, 91501, 92001, 97101, 98401, 98620, 99229, 99300, 100301, 100302, 100601, 102801, 104901, 105012, 105802, 107703, 110303, 110305, 110308, 117005, 909103
  ```
  其中 `100301`/`100302` 为百派争鸣活动接口（hero draw activity），与本组装备接口无关；`100601` 为装备穿戴相关但非 1003/1004/1005。
- 全仓库 jsonl（13 个文件）中无任何 `"type": 1003/1004/1005` 命中。
- 客户端日志中无 `req_equip_refine` / `req_equip_refine_one_key` / `req_equip_inscription` 字符串。
- personal-server 代码中无 1003/1004/1005 装备精炼/铭刻 handler（仅 `fantasy-equipment-*` 与 `leader-equip-service`，无 refine/inscription 路由），故服务端未产生这些命令的 committed 事件。
- wire-capture 6 个 bin 帧均为登录/初始化 s2c（seq 1/19/24），内嵌 type 候选为 1088/2105/53312 等，不含 1003/1004/1005；对 1003/1004/1005 的 ZigZag 编码字节（`d6 0f`/`d8 0f`）在 s2c-1 帧中出现 1–2 次，但这些是 pb_s2c 内嵌字段的偶然字节，不是独立的 c2s 请求帧，且 wire-capture 仅含 s2c 方向。
- `interfaces.json` 中三个 c2s 条目仍为 `observed:false, decoded:false, actionVerified:false`，`runtime.observations=[]`、`requests=0`、`responses=0`。

因此**未找到**可引用的 recording ID / packet number 示例。

## 原因说明

采集账号为新手教程号/当前游玩账号，用户游玩过程中未触发装备精炼/一键精炼/铭刻操作（装备系统精炼/铭刻入口未解锁或未操作），故流量中不存在这三个接口。现有采集仅覆盖登录、引导、战斗、招募、编队、英雄升级/突破、活动、钱包等。服务端 likewise 未实现 1003/1004/1005 handler，无法产生运行时证据。

## 静态契约一致性校验（无运行时解码，仅静态层）

对比 `equipment-1003-1004-1005.md` 与 `static-schemas.json` / `equip.net.proto.bin` / `interfaces.json`：

| 接口 | 文档 | 静态 schema | 结果 |
| --- | --- | --- | --- |
| 1003 req | ETF 参数，无 proto 请求消息（`schema=null`） | interfaces.json: `encoding=etf, schema=null, input-register 0` | 一致 |
| 1003 rsp | `pb_equip_refine_rsp { equip=1 pb_equip, multi=2 uint32, res_change=3 pb_res_to_client }` | `equip uint32?→pb_equip tag1, multi uint32 tag2 (repeated:false), res_change pb_res_to_client tag3` | 一致 |
| 1004 req | `pb_equip_refine_one_key_req { equip_id uint32=1, target_level uint32=2 }` | `equip_id uint32 tag1, target_level uint32 tag2` | 一致 |
| 1004 rsp | `pb_equip_refine_one_key_rsp { equip=1 pb_equip, res_change=2 pb_res_to_client, multi=3 repeated uint32, times=4 uint32 }` | `equip pb_equip tag1, res_change pb_res_to_client tag2, multi uint32 tag3 (repeated:true), times uint32 tag4` | 一致 |
| 1005 req | `pb_equip_inscription_req { equip_id uint32=1, target_level uint32=2 }` | `equip_id uint32 tag1, target_level uint32 tag2` | 一致 |
| 1005 rsp | `pb_equip_inscription_rsp { equip=1 pb_equip, res_change=2 pb_res_to_client }` | `equip pb_equip tag1, res_change pb_res_to_client tag2` | 一致 |
| 编码方式 | 1003 `etf`；1004/1005 `protobuf` | tcp-commands.md: 1003 `etf`，1004/1005 `pb` | 一致 |
| multi 差异 | 1003 单值 uint32；1004 repeated uint32 | static schema repeated 标记与文档一致 | 一致 |
| 共享结构 | `pb_equip` (8 字段)、`pb_res_to_client`/`pb_res_change`/`pb_res_src`/`pb_res_obj` | static schema 字段名/类型/重复标记与文档一致 | 一致 |
| 回包 envelope | `pb_s2c { seq, type, data, err }`，业务回复不设 type | 与文档 envelope 一致 | 一致 |

未发现任何不一致。

## 发现的问题

无字段/类型/编码/重复标记不一致。文档定义与静态产物完全匹配，且已正确区分：
- 请求编码：1003 `etf`/`schema=null`（无 proto 请求消息）vs 1004/1005 protobuf 请求消息。
- `multi`：1003 单值 `uint32` vs 1004 `repeated uint32`（字段名单数但必须按数组处理）。
- 回包字段数：1005 最简（仅 `equip` + `res_change`），无倍率/次数。
- 三个回包 `equip` 均为单个 `pb_equip`，非 repeated（与 1001/1002/1006 不同）。
- 资源字段统一为 `res_change`（非 `res`）。

## 状态更新

未找到真实流量，**不更新** `static-only` 状态。`interfaces.json`/`tcp-commands.md` 中这三个接口保持 `S`/`static-only`，`observed:false, decoded:false, actionVerified:false`。若后续捕获到真实流量，再按相同字段对照升级为 `observed`/`decoded`。
