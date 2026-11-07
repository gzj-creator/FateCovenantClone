# ITEM-GUIDE：引导领奖与网络检查

分支 `task/ITEM-GUIDE-20261106`（基于 main a5300de）。范围：`GuideCmd` 模块 8001 `req_guide_award`、8002 `req_check_guide_net`；8000 `req_save_guide_process` 保持原实现并纳入回归。

## 一、协议证据

| 命令 | 请求编码 | 请求 schema | 响应 | 证据 |
| --- | --- | --- | --- | --- |
| 8000 `req_save_guide_process` | protobuf | `pb_req_save_process` | `pb_req_save_process_back` | `personal-server/assets/protobuf/guide.net.proto.bin`（491 字节） |
| 8001 `req_guide_award` | etf | 无 schema（参数位置） | `pb_res_to_client` | `agent/workflow/interface-catalog/static-interfaces.json` 记录 `tcp:c2s:8001:req_guide_award`；响应 schema 见 `personal-server/assets/protobuf/res.net.proto.bin` |
| 8002 `req_check_guide_net` | etf | 无 schema | 无响应体（etf-fallback，schema null） | 记录 `tcp:c2s:8002:req_check_guide_net`，其 evidence 只列出 `Cmd.lua` 的 `c2s_index`，没有 8001/8000 记录里的 `c2s_back` 条目 |

引导数据结构（`guide.db.proto.bin`）：

```proto
message pb_guide { repeated pb_guide_process process_list = 1; bytes award = 2; }
message pb_guide_process { int32 process_id = 1; int32 key_id = 2; bool is_over = 3; }
message pb_req_save_process { repeated pb_req_save_process_param req_list = 1; }
message pb_req_save_process_param { uint32 process_id = 1; uint32 key_id = 2; }
message pb_req_save_process_back { repeated pb_guide_process process_list = 1; }
```

客户端行为证据（LuaJIT 反汇编/字符串，来源 `.worktree/recruit-20261101/.scratch/out/luaproject/`）：

- `GuideCmd` 只有三个方法，8001/8002 用 `EncodeErl`（ETF），8000 用 `EncodePB`（`pb_req_save_process`）。
- `GuideMgr` 的 `CheckGuideNet` 路径：`EnsureHasLogin → GetGameLogicSession`，失败走 `NET_CONNECT_ERR` 回调，成功则 `GuideCmd:req_check_guide_net(...)`；只挂了错误回调，没有成功回包处理。
- `GuideMgr` 的领奖路径：取 `GuideTable` 的 `Award` 行，`AwardKit:Parse` 出奖励后调用 `req_guide_award`，回包按资源变更处理（对应 `pb_res_to_client`）。
- `GuideAwardStep:HandleOver` 通过 `NetMgr` 请求并等待 `GuideAwardReceived`，即 8001 是有回包的请求/响应命令。

## 二、实现

新增 `personal-server/game/guide-service.mjs`：

- `supports(type)` 仅覆盖 8001/8002；8000 仍在 gateway 原处，未改动。
- 8001 `award(input)`：
  1. 从 ETF 参数中取 `awardTid`，兼容标量、参数列表（`[guideData, awardTid, awardBin]`）、键值表（`award_tid`/`awardTid`）与字符串；取不到或非正整数按参数错误拒绝（code 1）。
  2. 查奖励配置行 `{ awardTid → processId, keyId, items }`；无该行时记 `guide_award_unconfigured` 并以 code 5 拒绝，不发放凭空奖励。
  3. 单条 `store.transaction` 内完成：校验 `state.guides[keyId] === processId`（步骤未保存 → code 1）→ 查 `reward_claims`（`claim_type='guide_award'`，`claim_key=processId:keyId:awardTid`）防重（重复 → code 310）→ 写领取位 → `grantResources` 发奖 → 编码 `pb_res_to_client`。编码或 SQLite 任一失败整体回滚（`pack` 在事务内调用）。
- 8002 `checkNet(input)`：解析可选 `module` 并记日志，无状态变更、不回包（客户端无 c2s_back，只有错误回调；回任何帧都可能被当作未知响应，因此最小且有据的回包是不回帧）。
- `execute(type, input)` 为 async，未知 type 抛 code 1。

`personal-server/game/gateway.mjs` 只在 8000 处理之后新增一个派发块：`if (guide.supports(type))` → `decodeEtf` → `guide.execute` → 有返回值才 `send(seq, result.data)`；异常按既有约定 `send(seq, Buffer.alloc(0), { err: code })` 并记 `guide_command_rejected`。同时给 `createLocalGame` 增加可选 `guideAwards`（默认 `readGuideAwards()`），便于测试注入配置行。

新增 `personal-server/config/guide-awards.mjs`：`readGuideAwards()` 返回 `Map<awardTid, row>`，当前行表为空，注释写明缺口。

未改动：`storage/game-store.mjs`、`battle-engine.mjs`、`game/effects/*`、`config/skill-database.json`、`fixtures/game.sqlite`、`docs/plans` 状态表。

## 三、测试

新增 `personal-server/test/item-guide-service.test.mjs`（9 项，全部通过）：

- 正常领取：`pb_res_to_client` 有 101500 +20，资源与 `reward_claims` 同步写入；重复调用拒绝。
- ETF 参数形态：标量、`[data, awardTid, bin]`、键值表、字符串、空值。
- 未完成步骤：未保存 key、以及保存了别的 process/key 都拒绝，资源和领取位不变。
- 非法步骤：未配置 awardTid、非数字、0、undefined 全部拒绝且无写操作。
- 编码失败回滚：`pack('pb_res_to_client')` 抛错时资源与领取位均回滚。
- SQLite 失败回滚：`reward_claims` 插入触发器 ABORT 时资源不变、无领取位。
- 重开数据库：发放后的资源保留，重复领取仍被拒。
- 8002：无状态变更、无返回体；`supports` 只认 8001/8002。
- 真实 TCP：`createLocalGame` 临时端口，登录后 8000 保存 `key_id=11/process_id=900` 并回 `pb_req_save_process_back`；8001 回 `pb_res_to_client` 且资源 +20；8002 发后无回帧（下一帧是 seq 5 的回包）；重复 8001 得到 `err.err = 310` 且资源不重复。

`npm test`（`personal-server`）：2093 项，2090 通过，3 失败，全部是既有的 `test/login-business-reads.test.mjs` 缺本地证据库（`ENOENT` 拷贝 fixture），与基线一致，按要求未修。

## 四、未闭合缺口

1. **引导奖励配置行缺失（主要缺口）**：客户端 `GuideTable` 有 `Process/ProcessExclusion/Node/Event/Award/Step/Const/Battle/Drag/Education/FirstBattle/Sound/Type` 子表，但只有 LuaJIT 字节码（`.worktree/recruit-20261101/.scratch/out/luaproject/GuideTable.data.lua`，307,620 字节），仓库里没有该表的 JSON 导出，`personal-server/assets/tables` 的 44 张表也不含 GuideTable。因此 `awardTid → 步骤 → 道具数量` 无法取证，`config/guide-awards.mjs` 行表为空，生产环境 8001 对任何 awardTid 都返回 code 5 `Guide award is not configured`。领取位、步骤校验、事务与回包链路已在测试中用注入行验证；补上 `GuideTable.Award` 与 `GuideTable.Step` 导出后只需填行表，无需改服务逻辑。
2. **8001 请求 ETF 参数精确形状未实测**：静态只能确定是 ETF 且客户端把 guide 数据与 award tid 一起发送；服务按多种形态容错解析，真实客户端参数的位置语义仍需一次实际 APK 操作抓包确认。
3. **8002 是否绝不回包**：依据静态目录缺 `c2s_back` 登记与 `GuideMgr` 只挂错误回调推断；未在真机验证“不回帧”客户端无副作用。
4. **APK 验收未做**：按要求本阶段不启停实时服务、不操作模拟器，本轮只有服务端 + 临时 TCP 证据。
