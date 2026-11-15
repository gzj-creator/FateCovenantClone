# E 组 R1 残余命令独立复核（288、88401/88402、84901/84902）

批次：R1 剩余 25 条命令，E 组。基线提交 `12a6a16`，worktree `.worktree/r1-remaining-20261115/e`。

结论：**五条命令全部维持支付前失败关闭，没有一条可以登记为成功链或部分成功。** 本轮把三族原表、同版 PB、客户端调用者与消费者做成可直接复核的冻结证据，并新增漂移守卫：一旦 `GroupFunc` 出现行、回退成本变化或补全奖励行变化，载入即抛错，迫使后续 agent 重新打开 decisionId 而不是沿用过期拒绝理由。

## 1. 逐 type 状态

| type | 命令 | 状态 | decisionId | 支付前仍缺 |
| --- | --- | --- | --- | --- |
| 288 | `req_res_complete_award` | 仍失败关闭 | `R1-RESCOMPLETE-CLIENT-DOWNLOAD` | 资格只来自客户端资源下载状态；领取键无法由权威状态推导 |
| 88401 | `req_res_rollback_preview` | 仍失败关闭 | `R1-RESROLLBACK-SERVER-PREVIEW` | 预览 `res_list` 由原服务端计算，客户端只渲染；无返还公式 |
| 88402 | `req_res_rollback` | 仍失败关闭 | `R1-RESROLLBACK-SERVER-PREVIEW` | 返还消费者、对象重置范围、`to_client` 结构、执行前指纹复核 |
| 84901 | `req_task_group_task_award` | 仍失败关闭 | `R1-TASKGROUP-GROUPFUNC` | `GroupFunc` 0 行；type 1202/8601 进度生产者未接 |
| 84902 | `req_task_group_group_award` | 仍失败关闭 | `R1-TASKGROUP-GROUPFUNC` | 组奖行已恢复，但 func_id/func_open 与领取位索引无定义 |

五条命令仍在 `personal-server/game/r1-fail-closed-command-service.mjs` 表中，网关在读取或修改状态之前返回 `GameError(5)`。

## 2. 原证据

### 288 ResComplete

- 原表 `ResCompleteTable.data.lua.bin`，SHA256 `5f202f68363e6ad1e931b37a560eb2072345fcabeaee2b5541c9d955a3337d35`。族行数 `Open 3`、`Award 1`。
- `Award` 只有 tid 1，且按**平行数组**给出：`award=[101500,201500,101800]`、`award_n=[200,10000,500]`。逐项配对后为 `101500×200`、`201500×10000`、`101800×500`；缺数量不补 1。
- `Open` 三行 `tid 1/2/3` 携带 `old_player_day`、`download_chapter`、`second_chapter`、`auto_download_day`、`size`、`old_player_chapter`，控制的是**何时自动下载资源包**（`ResCompleteMgr.UpdateFuncOpen`/`LimitFirstDownload`/`TryForceDownload`），不是领奖资格，不能互用。
- 客户端：`ResCompleteCmd` SHA256 `8b97f04fca218c82fbfa1439ba65e1b333ba84390c7a091507e7d93aa32e4e94`；`ResCompleteMgr` SHA256 `ae82d45f23b5729d370aa006eac73036e50af19e3224b06b96aff7824dd160f1`；`ResDownloadForm` SHA256 `decdf52de482e468aa1313a7be79a4c4c98705f75fb6c10135caa1b0f9a23d2d`。
- 决定性字节码：`ResCompleteMgr.CanAward()` 为 `NOT upvalue0`，`IsDownloadFinish()` 为 `RET1 upvalue0`，同一 upvalue 由 `GameDownloadFinished`/子包初始化写入；`ReqAward` 先 `Assert(CanAward)`、`Assert(IsDownloadFinish)` 再发送。即资格是**客户端下载完成标志**。
- `ResDownloadForm` 的 `_UpdateAward` 用 `ResCompleteTable.Award.TID_AWARD` 渲染 `award/award_n`，`_UpdateProgress` 用 `CanAward`/`IsDownloadFinish` 决定按钮——客户端不参与服务端资格判定。

### 88401/88402 ResRollback

- 原表 `ResRollbackTable.data.lua.bin`，SHA256 `381db5022f4ffc32b0f183b58cec0b31f5795f11e6d6d4e328cee19518f0ec65`。`Const 1` + `Type 8`。
- `Const`：`can_rollback_min_star=6`、`rollback_to_star=5`。
- `Type` 八行全部 `cost_item=101500`；成本 `500/100/100/100/100/100/100/100`；`refresh_func` 依次指向 `HeroDataMgr.HeroResetUpData`、`EquipDataMgr.EquipResetUpData`、`ArtifactMgr.ArtifactResetUpData`、`RelicMgr.RelicResetUpData`、`PetEquipMgr.EquipResetUpData`、`ElvesBeadMgr.ResetUpData`、`ElvesMgr.ResetUpData`、`PetMgr.ResetUpData`；另带 `update_attr_play`、`bi_log`、`refresh_free_time`。
- 同版 PB `res_rollback.net.proto.bin`：`pb_res_rollback_req{rollback_type,rollback_res_id}`、`pb_res_rollback_preview_ret{repeated pb_res_obj res_list}`、`pb_res_rollback_ret{pb_res_to_client res, bytes to_client}`。
- 客户端 `ResRollbackCmd` SHA256 `754f173922b934bd502bcd3b5422b9954ca21a3ce77d319722c82ed3d60725af` 只构造上述两个 PB；`ResRollbackMgr` SHA256 `f9191d9f772f3cb57e0a24e3476cd9dbfdb6abf60ed1882399276630a0e0d58a` 的预览回调把 `to_client` 交给 `refresh_func.Call`、`AwardKit.Parse(res)`、`ShowAward`；`ResourceResetAwardForm` 只把收到的 `res_list` 逐项渲染（`SplitResToSingle` 拆遗物/灵珠），**客户端不计算返还**。
- `ResRollbackMgr.GetEquipAndHeroTidMap` 从当前预设阵容取 `hero_id`/`equip_ids`，`HeroResourceResetNode.Click` 用 `RES_ROLLBACK_LINEUP_HERO_CANOT_ROLLBACK` 阻止上阵英雄回退——这是引用保护，不是返还公式。
- 因此 `refresh_func` 是执行后的**客户端数据刷新钩子**；把预览或回退金额从它反推会把 UI 刷新当成收益公式。

### 84901/84902 TaskGroup

- 原表 `TaskTable.data.lua.bin`，SHA256 `ef2157c0f875ee5ee5391ad1890607529442184f9d94950a448e67957daeba55`。
- `Group 6`（tid 1001–1006；每行 `award=[[201500,1]]`、`need_seq=false`、`award_scale`/`award_pos` 是展示缩放与坐标、`tasks` 列出成员）；`GroupTask 20`（100101；100201–100604；除 100101 的 `award=[]` 外均为 `[[201500,1]]`，`type` 仅 1202/8601）；`GroupFunc` **0 行**。
- `Type 1202`：`progress_fun=10`、`progress_type=1`；`Type 8601`：`progress_type=2`、`data=42`、`stat_expand=[2500200]`。`MethodTable.DynamicArgs.tid=10` 指向 `MissionMgr.GetPassedChapter`（`method-selected.json`，源 SHA256 `78133b0174f3cf3f70d2d2b1ed087c78082be0fc865789c92f070c277530b52e`）。
- `CommonTask` 四行是**分片引用**（`TaskTable.CommonTask.1201/1202/1602/9001.data.lua`），根索引未解析；`CommonTaskGlobal` 四行把 tid 1/3/4/5 映射到 type 1201/1602/1202/9001。
- 同版 PB：`task.net.proto.bin` 的 `pb_task_group_task_award_req{repeated uint32 tid_list}`（不可跨功能）、`pb_task_group_group_award_req{tid_list}`、回包 `{res_change, task_group}`；`task.db.proto.bin` 的 `pb_role_task_group{func_id, task_groups[{group_id,got_award}], got_award, func_open}`。
- 客户端 `TaskGroupMgr` SHA256 `5580b4c2e00b059701f4a30b5004eddf7ef7be17614e42308ef24d38d4ec9c93`：`LoginParse` 解 `pb_role_task_group`，`FuncCfg` 读 `TaskTable.GroupFunc`，`GetCurTaskGroup` 读 `GroupByIndex`，`IsCanFetchTask` 要求组内任务全部完成，`IsCanFetchGroup` 读 `got_award` 位图并按 `GroupArrayByFunc` 取上一组，`ReqFetchTask/ReqFetchGroup` 分别发 84901/84902。数字登录槽未取得，**不推定**。

## 3. 为什么不能实现成功链

- 288：资格是客户端下载状态，服务端无法把“我下载完了”变成可复核事实；请求也不带章节/天数/大小等可校验值，无法构造权威唯一键。原版 `AWARD_HAS_GET` 语义保留在客户端断言，本版仍以 `err5` 明确拒绝，不置任何领取位。
- 88401/88402：预览本身就是服务端的返还计算；没有该公式就没有 `res_list`，也就没有任何可以“先预览、后执行”的合法动作。用星级成本表反推全额返还属于推定而非证据，且 `update_attr_play` 取值差异说明八类对象的重置范围不同。
- 84901/84902：`GroupFunc` 为 0 行时，`func_id`、`func_open`、组归属与组间顺序都无定义；组奖行虽已恢复，仍不能据此打开任何一组。`CommonTask` 根索引只有四个分片名，type 1202/8601 的进度来源也未接到本服权威统计。

## 4. 本轮新增文件

- `personal-server/assets/tables/ResCompleteTable.data.json.gz`（资产 SHA256 `9D612B293F51E035A47CA29AAB02F87EF515AB0C9806BBB660538B33CB87434E`）
- `personal-server/assets/tables/ResRollbackTable.data.json.gz`（资产 SHA256 `27F31320943E1C8E11E95784EFE66AD0A853DB9A8BBA87D944532612FB4AB424`）
- `personal-server/assets/tables/TaskGroupTable.data.json.gz`（资产 SHA256 `A48549B7D9DA225C45A042BCF6D735711BD8CD09F1E23C0C5E52EB0218030215`；TaskTable 的 TaskGroup 切片，Type 只保留 1202/8601）
- `personal-server/config/e-residual-evidence.mjs`：严格校验三族行数、逐行字段、组奖、回退成本、`GroupFunc` 为空；导出五个 decisionId 与支付前阻断列表；`gameplayReady=false`。
- `personal-server/test/e-residual-evidence.test.mjs`：6 项，锁事实、锁 `GameError(5)`，并用三份变异资产证明漂移会重新打开 decisionId。

## 5. 验证

```powershell
node --test --test-concurrency=1 personal-server/test/e-residual-evidence.test.mjs
node --test --test-concurrency=1 personal-server/test/r1-fail-closed-command-service.test.mjs `
  personal-server/test/command-registry.test.mjs personal-server/test/e-residual-evidence.test.mjs
```

结果：专项 6/6；合并 13/13 通过，含共享真实临时 TCP（25 条逐条 err5、登录后持久化状态逐字节不变）与注册表 5/5。

## 6. 需要总控串行处理的共享文件

1. `personal-server/game/r1-fail-closed-command-service.mjs`：五条**不移除**，建议把原因改成下列措辞（现有共享专项未断言具体字符串，可安全替换）：
   - `288`: `ITEM-RESCOMPLETE: award row 1 is recovered but claim eligibility is client download state with no server-verifiable attestation or authoritative claim key`
   - `88401`: `ITEM-RESROLLBACK: the preview res_list comes from the unrecovered server-side refund formula; clients only render it`
   - `88402`: `ITEM-RESROLLBACK: original refund consumer, per-type object reset scope, to_client payload and pre-execution fingerprint are not recovered`
   - `84901`: `ITEM-TASKGROUP: GroupFunc has 0 rows and the type 1202/8601 group-task progress producers are not wired`
   - `84902`: `ITEM-TASKGROUP: group award rows are recovered but GroupFunc (func_id/func_open) is empty, so group-stage eligibility is undefined`
2. `docs/gameplay-operations/09-defects-and-acceptance.md`：E 行补“证据复核完成、仍失败关闭”，并写明 `GroupFunc` 0 行、288 资格为客户端下载状态、88401 预览由服务端公式生成。
3. `docs/gameplay-operations/system-rulebooks/economy-tasks-shops.md`：`#res-complete`/`#res-rollback`/`#task-group` 各补一句本轮新增事实，不改裁定。
4. `agent/workflow/rule-implementation-20261115/implementation.md`：追加“E 组复核：5 条维持失败关闭”，不得计入完成。

## 7. 需总控注意的仓库级缺陷（非本组业务）

`personal-server/config/command-dispatch-audit.json` 记录的是**CRLF 工作副本**的 `gateway.mjs`/`command-catalog.json` 哈希：`HEAD` blob 的 LF 版本实际为 `437FDD5622C63323902FCE06B1C5964F390BB2E24CEE57F6F0E1C0371C6B346E`（gateway）与 `005C7527E2EC55AD061A3ADD178EFE30E34ABEE2E5D029DC4F23A7DF20F6DAB9`（catalog），而审计文件记录 `02AF58E7…`/`38FE0BD8…`。因此在任何 LF 干净检出上 `npm run check:command-dispatch` 都会报 stale，`command-dispatch-runtime.test.mjs` 也随之失败。

本轮实测：在 LF 工作树执行一次 `npm run audit:command-dispatch` 后 `check:command-dispatch` 与 `command-dispatch-runtime` 均通过，且计数完全不变（`total=1407/serviceRoute=1383/gatewayRoute=18/multiOwner=6/unrouted=0`，`requestEncodingMismatch=186`、`requestEncodingUnverified=933`、`responseRuntimeUnverified=1407`、`responseSchemaMissing=223`），仅两个 source hash 需要更新。建议总控在主工作树以 `core.autocrlf=false` 重新生成并单独提交该审计文件。

## 8. 分层验收

| 层级 | 结果 |
| --- | --- |
| 原证据闭合 | 表/PB/客户端调用链已冻结；五条均因关键环节缺失而**未闭合成功链** |
| R1 推定 | 无新增推定 |
| 服务端完成 | 无（五条均在变更前 err5） |
| 离线 TCP | 已验（共享 25 条逐条 err5、状态不变） |
| 存档/重开 | 本轮无写入，不适用 |
| APK | 未验收 |
| 生产 TCP / 生产库 | 未验收 |
| 部署 | 未执行 |

未启停实时服务、未读写生产数据库、未操作模拟器/ADB/APK、未部署。
