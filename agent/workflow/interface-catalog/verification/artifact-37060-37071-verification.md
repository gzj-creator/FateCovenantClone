# 圣器接口 37060–37071 验证报告

## 结论

未在仓库中找到目标接口 `37060/37061/37062/37070/37071` 的真实 TCP 请求/回包流量。本次验证仅能确认静态契约与文档定义的一致性，**不能**将状态从 `static-only` 升级为 `observed`。五个接口维持 `static-only`。

## 搜索范围与方法

1. capture 目录：仓库内无 `analysis/captures/protocol-2026-10-25/`（已按 handoff 清理）；仅存 `analysis/experiments/private-server-20261025/p3/wire-capture-20261028.local-only/` 与 `...-story508.local-only/`（均为 s2c 单向帧）。
2. 服务端命令日志：`analysis/experiments/private-server-20261025/p3/runtime.local-only.data/events.jsonl`（34,669 条 command 事件，77 种 distinct type）中**不存在**任何 `3706x/3707x` 类型；全仓库 events.jsonl 均无。
3. 客户端日志：`p3/*.local-only.log` 全部 grep 无命中。
4. 二进制/文本全局扫描：对所有非 node_modules/.git/.apk 文件按 ZigZag 编码字节（`88 c3 04`/`8a c3 04`/`9c c3 04`/`8c c3 04`/`9e c3 04`，即 field 2 = type）扫描，命中仅 patch-manifest 与图片（误报），无流量。
5. wire-capture bin 解码：6 个 s2c bin 帧（seq 1/19/24）解码后仅含登录/初始化消息（内嵌 type 候选 1088/2105/53312 等），不含 37060–37071。

## wire-capture 证据

| 文件 | 帧 | seq | 内容 |
| --- | --- | --- | --- |
| `wire-capture-20261028.local-only/s2c-1-1793140533589-*.bin` | 1 | 1 | 登录初始化（无 artifact 类型） |
| `wire-capture-20261028.local-only/s2c-1-1793141128545-*.bin` | 1 | 1 | 登录初始化（无 artifact 类型） |
| `wire-capture-20261028-story508.local-only/s2c-1-1793149380639-*.bin` | 1 | 1 | 登录初始化 |
| `wire-capture-20261028-story508.local-only/s2c-1-1793151038189-*.bin` | 1 | 1 | 登录初始化 |
| `wire-capture-20261028-story508.local-only/s2c-19-1793151293797-*.bin` | 1 | 19 | 初始化推送（内嵌 type 1088/2105/53312） |
| `wire-capture-20261028-story508.local-only/s2c-24-1793151593815-*.bin` | 1 | 24 | 初始化推送 |

结论：这些 bin 文件均为登录/初始化 s2c，不包含圣器养成操作流量。

## 文档与静态 schema 对比（无真实流量，故以 static-schemas.json + proto bin 为对照）

### 37060 `req_artifact_synthesis`

- 文档：请求 `pb_artifact_star_up_req` {tid uint32, times uint32}；回包 `pb_artifact_back` {res, artifact}。
- 静态 schema：`pb_artifact_star_up_req` tid uint32 / times uint32；`pb_artifact_back` res + artifact。一致。
- 编码：protobuf（文档与 static 一致）。

### 37061 `req_artifact_strength`

- 文档：请求 `pb_req_artifact_forge` {tid int64, forge_list repeated {type int32, forge_count int32}}；回包 `pb_artifact_back`。
- 静态 schema：tid int64；forge_list repeated `pb_req_artifact_forge_one`；type int32 / forge_count int32。一致。
- tid 类型 int64（decode 为字符串）与文档一致。

### 37070 `req_artifact_level_up`

- 文档：请求 `pb_artifact_level_up_req` {tid uint32, times uint32}；回包 `pb_artifact_level_up_rsp` {res_change, artifact}。
- 静态 schema：一致。
- 资源字段名 `res_change`（非 `res`）与文档一致。

### 37062 `req_artifact_quality`

- 文档：请求 ETF 单参数（tid，类型未确认）；回包 `pb_artifact_back` {res, artifact}。
- 静态：request encoding etf，schema null；response `pb_artifact_back`。一致。
- 文档已正确标注 ETF 请求无 protobuf schema、类型未确认。

### 37071 `req_artifact_break_level_up`

- 文档：请求 ETF 单参数（tid）；回包 `pb_artifact_break_level_up_rsp` {res_change, artifact}。
- 静态：request encoding etf；response `pb_artifact_break_level_up_rsp`。一致。

## 共享结构核对

- `pb_artifact`：tid int64, num int32, star int32, star_node int32, forge_list uint32 repeated, stage uint32, quality int32, level int32, break_level int32, is_fly_up bool, artifact_skin int32 — 与 proto bin 一致。
- `pb_res_to_client` / `pb_res_change` / `pb_res_src` — 与 proto bin 一致。

## 发现的问题

无字段/类型/编码不一致。文档定义与静态产物完全匹配，且已正确区分：
- `res`（37060/61/62）vs `res_change`（37070/71）
- 请求 tid uint32（37060/70）vs int64（37061）vs ETF 未确认（37062/71）
- protobuf 请求（37060/61/70）vs ETF 请求（37062/71）

## 状态更新

未找到真实流量，**不更新** `static-only` 状态。`interfaces.json`/`tcp-commands.md` 中这五个接口保持 `S`/`static-only`。若后续捕获到真实流量，再按相同字段对照升级为 `observed`/`decoded`。
