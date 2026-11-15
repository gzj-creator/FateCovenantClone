# A 组：HeroBlazon 残留与 Intelli 复核（2026-11-15）

范围：`88951`、`88953`、`88956`、`701`、`702`。本轮对该 5 条命令做独立复核，不照抄上一轮结论；结论是 5 条全部继续在支付/置位前失败关闭，但补齐了三条此前未写死在证据里的决定性缺口。

## 逐 type 唯一状态

| type | 命令 | 状态 | 决策 ID | 支付前仍缺 |
| --- | --- | --- | --- | --- |
| 88951 | `req_hero_blazon_up(chapter_id, normal_blazon_list, special_blazon_list)` | 仍失败关闭 | `R1-HEROBLAZON-CHAPTER` | 普通格成本消费者与激活后 cell 结果位图 |
| 88953 | `req_hero_blazon_update_talent(talent_list)` | 仍失败关闭 | `R1-HEROBLAZON-TALENT` | 天赋点数产额为 0 的桩、`TalentUp.need_other_level` 缺列 |
| 88956 | `req_hero_blazon_reset_skill` | 仍失败关闭 | `R1-HEROBLAZON-SKILLRESET` | 全客户端无发送者、无技能重置成本/返还表族 |
| 701 | `req_intelli_unlock(intelli_id_list)` | 仍失败关闭 | `HERO-INTELLI` | 解锁脚本求值、营地资格、解锁代价 |
| 702 | `req_intelli_batch_handle(finish_list, start_list, is_assistant)` | 仍失败关闭 | `HERO-INTELLI` | 完成奖列、英雄派遣条件与选择权威、开始→完成状态机 |

没有一条可以登记为成功链或部分成功：三条 HeroBlazon 缺少的是服务端消费者/生产者本体，两条 Intelli 缺少的是原表列本身。

## 原证据（本轮实际读取）

- `HeroBlazonTable.data.lua.bin`，源 SHA256 `D0077B02FAB8422FBD584AEC4F6E5E1CC824C756EC7D29DF206331A7AFE278C9`；族行数 Param1 / Quality4 / TalentUp27 / Talent8 / TalentReset5 / ScoreBox6 / Attr720 / Skill88 / Level26 / AngerSkillType3 / AngerSkillDes48 / Chapter4 / BondAttr3200 / BondItemNeed492 / BondGroup128 / EmbedGroup110 / EmbedCell414。仓库内已落地资产为 `personal-server/assets/tables/HeroBlazonTable.data.json.gz`。
- `IntelliTable.data.lua.bin`，源 SHA256 `FCDA2236764D048EF111223C2A7F057221E822F4C546850185BB66907E3E19A9`；族行数 Type8 / Refresh41 / Quality4 / Award164 / AwardType4 / Const1 / Intelli24。落地资产 `personal-server/assets/tables/IntelliTable.data.json.gz`。
- 同版 PB：`hero_blazon.db.proto.bin`、`hero_blazon.net.proto.bin`、`intelli.db.proto.bin`（SHA256 `87392CFADE6D14C372BA4CAE779A16A5B22302B97D9804C86A3D67221218685B`）、`intelli.net.proto.bin`（SHA256 `FCD803DB4D589B5CDE0974C59F408FFE4FD44CDCC6D7C56A1B9A22DE859095F4`）。
- 客户端原型（`analysis/scratchpad/command-closure-46-20261115/hero`，共 262 个 `.prototypes.json`）：`HeroBlazonCmd`、`HeroBlazonMgr`、`HeroBlazonChapter`、`HeroBlazonTalentMgr`、`HeroBlazonTalentUtil`、`HeroBlazonSkillMgr`、`HeroBlazonBondMgr`、`HeroBlazonUtil`、`IntelliCmd`、`IntelliNetMgr`、`IntelliMgr`、`IntelliDispatchForm`、`Intelli`、`IntelliTable.data`。
- 登录槽：纹章模块 152（`pb_hero_blazon`），情报模块 27（`pb_intelli_info`）。两者均由既有实现/证据确认，本轮未新增或伪造登录槽。

## 本轮新增/加固的决定性证据

### 88956：全客户端没有发送者

对 262 个原型文件做精确字符串匹配（不是子串）：

```text
req_hero_blazon_reset_skill -> HeroBlazonCmd#3 (定义), HeroBlazonCmd#5 (命令表)
req_intelli_unlock          -> IntelliCmd#0, IntelliCmd#2, IntelliNetMgr#13
req_intelli_batch_handle    -> IntelliCmd#1, IntelliCmd#2, IntelliNetMgr#11
```

即 88956 只有协议定义与命令注册，没有任何 Cmd/Mgr/Form 构造该请求；`HeroBlazonSkillMgr` 方法集里也没有 reset 方法。再加上 `HeroBlazonTable` 的 17 个族中没有技能重置成本族（`TalentReset` 是天**天赋**重置阶梯，成本 0/200/400/600/1000 货币 101500，不能挪用），本条的成本、范围、返还消费者三项都无从取得。任何实现都会自造价格。

对照：701/702 有真实发送者（`IntelliCmd` + `IntelliNetMgr`），所以它们的缺口不在“没人调用”，而在原表列和解锁脚本。

### 88953：天赋点产额是 0，阈值列缺失

- `HeroBlazonUtil.GetAllTalentValue` 函数体只有两条指令：`KSHORT 0` + `RET1`，即**恒返回 0**；`HeroBlazonChapter.GetAllTalentValue` 同样恒返回 0。
- `HeroBlazonTalentMgr.GetResidueTalentPoint` = `HeroBlazonUtil.GetAllTalentValue() - self:GetAllCostTalentPoint()`，因此在同版客户端里任何分配都只会得到 ≤0 的余量。这说明本快照的天赋系统未启用（`Param.talent_open=20` 对应的开放链同样未接），**不能**据此推出“服务端预算为 0，所有分配都非法”。
- `HeroBlazonTalentMgr.GetCanLvUpMaxLvAndLimitLv` 读取 `HeroBlazonTable.TalentUpByIndex(tid).need_other_level`，而落地 `TalentUp` 27 行的列只有 `tid/range_min/range_max`，没有 `need_other_level`。客户端的等级上限判定字段在本版表里不存在。
- 结论：预算产额与“需要他项等级”这两个必要关系都无法确定，安全校验不存在。

### 88951：普通格列表的客户端生产者是空桩

- 特殊格路径闭合到请求形状：`HeroBlazonMgr.ReqActiveSpecBlazon` 组装 `{cell_id = cellId, attr_id = HeroBlazon.StaticItemTidToAttrTid(itemTid)}`，先做 `ResMgr.GetNum(itemTid) > 0` 的客户端预检，再走 `ReqOpBlazonMgr(chapterId, nil, {cell})`。
- 普通格路径 `ReqNormalBlazonUp` 取 `chapter:GetAllAttrParams()` 作为 `normal_blazon_list`，而 `HeroBlazonChapter.GetAllAttrParams` 函数体是 `TNEW + RET1`，即**恒返回空表**。因此本版客户端发出的普通格列表永远是空表。
- `Chapter.normal_cell = [[1002,650],[1002,400]]`（4 章相同）与 `EmbedCell.special_item`（414 行）只证明“表里有成本列”，没有证明服务端按哪个下标逐格扣费、一次操作可以带几格、激活后 cell 的星级/attr 落哪个 PB 字段。
- 结论：请求两半分别缺生产者（普通）与结果投影（特殊），不足以实现。

### 701/702：Intelli 缺的列是表结构层面的

- 用 `tools/dump-table-prototypes.mjs` 解开原 bundle 后，`Intelli` 构造原型 20 的字段映射常量只有 `tid/quality/show_name/des_id` 四列；`Intelli_ValueIndex` 只是按 quality 分组的平面索引数组 `[1..6]/[7..12]/[13..18]/[19..24]`，不含玩法字段。
- 客户端确实读 `award`、`award_n`、`hero_star`、`hero_quality`、`conditions`：`IntelliMgr#24` 读 `award/award_n`，#28/#29 读 `hero_star`，#14/#40 读 `hero_quality`，#22/#29/#30 读 `conditions`。这些字段在本版表里一律为 nil。
- 因此 `Award`(164) / `AwardType`(4) / `Const.fixed_award=[[1,1],[2,1],[4,1]]` 只能说明“奖励池存在”，无法证明某个 type/star 槽对应哪一行、抽取与叠加怎么算。
- `Type.unlock = 389242300001..8`（`unlock_params=[3]`）需要 `ScriptEval`。仓库内可找到的 `MethodScript.data.lua.bin`（`analysis/scratchpad/game-rules-20261114/`，SHA256 `89D91E90E1303DE26E79AA9F598F025EF122362C31F27049042BDFAC4D7917C3`，346452 字节，共 1882 个原型）根原型只注册 `MethodTable.Method` 与 `MethodTable.DynamicArgs`（1881 个闭包 + 动态参数字典），是方法/条件注册表，**不含按 389242300001–8 索引的解锁脚本行**。之前记录的“MethodScript 为空”在抽取结果上仍然成立，本轮把原因写清楚了。

## 本轮改动

- 新增 `personal-server/config/hero-blazon-residual-evidence.mjs`：只读证据模块，加载时硬校验 `TalentUp` 仍缺 `need_other_level`、4 章 `normal_cell` 未变、`TalentReset` 五档成本未变、无 `SkillReset` 族、`EmbedCell` 414 行且 tid=group×100+index、`Param` 关键字段未变；对外暴露 `gameplayReady=false` 与三条 fail-closed 决策（含 decisionId）。本模块不注册到网关、不参与派发。
- 新增 `personal-server/test/r1-group-a-evidence.test.mjs`：锁定 5 条命令仍在共享失败关闭集合、`hero-blazon-service` 仍只支持 88955/88957、上述表结构事实、以及 Intelli 的两项阻断。
- 更新 `personal-server/config/intelli-tables.mjs` 的 `gameplayBlockers[1]`：把“MethodScript is empty”改成可复核的“只注册 MethodTable.Method / DynamicArgs，所以 Type.unlock 无法求值”。
- 相应更新 `personal-server/test/intelli-evidence.test.mjs` 的断言。

## 验证

```powershell
node --test --test-concurrency=1 personal-server/test/r1-group-a-evidence.test.mjs personal-server/test/intelli-evidence.test.mjs personal-server/test/hero-blazon-service.test.mjs
node --test --test-concurrency=1 personal-server/test/r1-fail-closed-command-service.test.mjs
node --check personal-server/config/hero-blazon-residual-evidence.mjs
node --check personal-server/config/intelli-tables.mjs
```

实际结果：三文件合计 26/26 通过（其中 88955/88957 既有专项与真实 TCP 网关用例全部通过）；共享失败关闭专项 2/2 通过，其真实临时 TCP 用例对 25 条未闭合命令逐条返回 err5 且登录后持久化状态逐字节不变。`node --check` 两项通过。

依赖说明：新 worktree 首次运行需要 `npm ci`（仅 protobufjs 2 个包），否则 `game-codec.mjs` 报 `ERR_MODULE_NOT_FOUND: protobufjs`。这不是代码回归。

## 未验收

- 服务端成功链：本组 5 条均无成功链，因为证据未闭合；本轮没有新增任何可执行变更。
- 离线真实 TCP：仅覆盖“err5 + 状态不变”的拒绝路径（共享专项）；没有可成功动作可验。
- 存档/重开：本组未写入任何业务状态，故无重开投影可验；88955/88957 的既有重开用例仍在通过。
- APK、生产 TCP、生产库、部署：均未验收；本轮未启停实时服务、未读写生产库、未操作模拟器/ADB/APK。

## 给总控的共享文件建议

1. `personal-server/game/r1-fail-closed-command-service.mjs`：**不要移除** 88951/88953/88956/701/702。建议把三条纹章原因替换为与本轮证据一致的措辞（其余不动）：
   - `88951`: `HERO-HEROBLAZON: normal-cell cost consumer and the activated-cell result bitmap are not recovered`
   - `88953`: `HERO-HEROBLAZON: the talent-point budget producer yields no points and TalentUp omits need_other_level`
   - `88956`: `HERO-HEROBLAZON: no client producer and no skill-reset cost or refund family are recovered`
   若总控希望保持原文，仅保留现状也可（原因集合不变）。
2. `personal-server/config/command-dispatch-audit.json`：无需改动；这 5 条仍走失败关闭，路由归属不变。
3. `docs/gameplay-operations/09-defects-and-acceptance.md`：建议在 R1 验收台账中把本组记为“证据复核完成、仍失败关闭”，并附本轮三条新证据（reset_skill 无生产者、天赋产额桩返回 0、Intelli 字段映射仅 4 列）。
4. rulebook `heroes-equipment.md` 的 `#hero-blazon` / `#intelli` 段可各补一句本轮新增事实，不改变现有裁定。
5. 总 `implementation.md`：建议追加一节“A 组复核：5 条维持失败关闭”，不要把它写成完成项。

