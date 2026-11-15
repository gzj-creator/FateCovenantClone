# H1 HERO-HEROBLAZON 证据与实施（2026-11-15）

批次：R1 H1，命令 88951、88953、88955、88956、88957。本记录只列本轮实际取得的证据与代码边界；未取得的部分继续失败关闭。

## 原证据

- 原表：`HeroBlazonTable.data.lua.bin`（analysis/scratchpad/time-temple-20261108/project/8647623730521538000-…），SHA256 `D0077B02FAB8422FBD584AEC4F6E5E1CC824C756EC7D29DF206331A7AFE278C9`。用 `tools/dump-table-prototypes.mjs` 生成原型 dump，再由 `personal-server/config/hero-tables.mjs#readGeneratedDump` 解析。families 行数：Param 1、Quality 4、TalentUp 27、Talent 8、TalentReset 5、ScoreBox 6、Attr 720、Skill 88、Level 26、AngerSkillType 3、AngerSkillDes 48、Chapter 4、BondAttr 3200、BondItemNeed 492、BondGroup 128、EmbedGroup 110、EmbedCell 414。
- 同资产另含 BondAttr/BondGroup/BondItemNeed/EmbedGroup/EmbedCell；此前 `HeroBlazonBondTable.data.json.gz` 只覆盖 BondAttr/BondGroup/Chapter，不含 EmbedGroup/EmbedCell/BondItemNeed。
- PB：`hero_blazon.db.proto.bin`（pb_hero_blazon：chapter_list/skill_list/talent_list/bond_list/reset_times/reset_timestamp/max_chart）、`hero_blazon.net.proto.bin`（pb_hero_blazon_up/up_back、update_talent_req/rsp、update_skill_back{skill_tid,res_client}、bond_up_rsp{res_client,update_talent_list}）。
- 客户端：`HeroBlazonCmd` 五个方法分别构造 req_hero_blazon_up(chapter_id,normal_blazon_list,special_blazon_list)、req_hero_blazon_update_talent(talent_list)、req_hero_blazon_update_skill(skill_tid)、req_hero_blazon_reset_skill(...)、req_hero_blazon_bond_up(next_bond_tid)；后三者走 EncodeErl。

## 88955 技能升星（已实现）

闭合链：

- `HeroBlazonSkillMgr.ReqUpStarSkill(skillTid)` 读 `HeroBlazonTable.Skill[skillTid].active_item`（`[[24002,n]]`）与 `active_chart_value`，用 `HeroBlazonUtil.GetChartValueByChapterTid(blazon_campus)` 比较图鉴值，资源不足回 `Err.RES_UNENOUGH`；随后发送单参数 `req_hero_blazon_update_skill`。
- `HeroBlazonSkillUtil.GetSkillSourceId = floor(tid/10)`、`GetSkillStar = tid%10`，Skill 行按 source 连续 0..N。
- `HeroBlazonMgr.GetChartValueByChapterTid` 直接委托 `HeroBlazonBondMgr.GetChartValueByChapterTid`，后者按本章节已拥有羁绊的 `BondAttr.chart_value` 求和。
- 回包 `pb_hero_blazon_update_skill_back{skill_tid,res_client}`；状态字段 `pb_hero_blazon.skill_list`（技能表编号）。

实现：`personal-server/game/hero-blazon-service.mjs`（88955）：同事务校验技能行、前置星级、图鉴值、材料，`consumeResources` 扣费后写模块 152 并编码回包。缺前置/图鉴不足/重复/未知行均 err5；材料不足 301。`star==0` 的基础技能激活（Storage 技能激活标记消费者未取得）保留 err5 `R1-HEROBLAZON-SKILL-BASE`。

边界：属性/技能进入战斗的最终投影尚未接入（本轮只保证权威技能状态与客户端回包）；真实 APK 外层 ETF 与生产 TCP 未验收。

## 88957 羁绊升星（已实现）

已证：请求参数为“下一星级 tid”（`BondData.GetNextStarTid = tid+1`，且 BondAttr 必须存在）；BondAttr tid = group×100+star；每组 5 个 `BondItemNeed.special_item`，客户端 `CheckResEnough/GetUnEnoughItemCount` 对每个材料按“数量>0”判断，等价每次升星消耗各 1；BondGroup.campus 映射章节；图鉴值取 BondAttr.chart_value。

回包消费者已闭合到“完整当前天赋分配列表”：`HeroBlazonBondMgr` 把 `update_talent_list` 交给`HeroBlazonTalentMgr.UpdateAllTalentData`，空列表会被解释为重置，因此服务必须保留并返回权威 `pb_hero_blazon.talent_list`，不能只返回本次差分。88957在单一事务内校验BondGroup、下一星BondAttr、组内五个`BondItemNeed.special_item`各1个、材料余额和最大星，扣料后按campus替换该组当前星并返回完整天赋列表；未知/满星/材料不足均在变更前拒绝，编码失败回滚。

## 88951 / 88953 / 88956（未实现，继续失败关闭）

- 88951：已有表能给出章节、普通/特殊材料格、Attr/Skill/EmbedG*，但 `HeroBlazonChapter` 的费用/Grade 消费者（GetAllAttrParams、CheckCellCanUpStar、GetNormalCellLevel 对应原型多为空壳/闭包）未闭合，不能确定“普通格升级/特殊纹章镶嵌/替换”的精确消耗与结果位图。
- 88953：已确认请求提交 `talent_list`，`HeroBlazonTalentMgr.ReqUpdateTalent` 发送 `req_hero_blazon_update_talent`；但天赋点预算来自各章节 `GetAllTalentValue`（原型为闭包，未映射实现体），`TalentUp.need_other_level` 与实际 `TalentData.GetCostPoint` 的组合关系未证，无法安全校验分配上限。
- 88956：`req_hero_blazon_reset_skill` 与 TalentReset 不同；重置范围、成本、返还消费者（HeroBlazonTable.TalentReset 仅用于天赋重置）尚未定位，禁止按固定钻石/固定返还实现。

## 验证

```powershell
node --test --test-concurrency=1 personal-server/test/hero-blazon-service.test.mjs
node --test --test-concurrency=1 personal-server/test/r1-fail-closed-command-service.test.mjs
```

结果：hero-blazon 专项与真实临时TCP共14/14。覆盖原表数量/索引、技能前置、图鉴门槛、材料精确扣减、余额不足301、重复与未知技能、基础技能失败关闭、非标量模块、88957下一星/五材料/最大星/完整天赋返回、SQLite重开、ETF单参数、回包schema与真实socket。

## 接线（已完成）

- `gateway.mjs` 已 import/实例化`heroBlazon`并加入`heroCommandServices`；登录循环执行其`ensureLoginState`。
- `r1-fail-closed-command-service.mjs`已移除88955和88957，仅保留88951/88953/88956；本轮后续接入91503后，当前全量为25条、10项任务。
- 88955/88957均为ETF请求，响应分别为`pb_hero_blazon_update_skill_back`和`pb_hero_blazon_bond_up_rsp`。

## 源文件

- `personal-server/assets/tables/HeroBlazonTable.data.json.gz`（由上述原 bundle 生成）
- `personal-server/config/hero-blazon-tables.mjs`
- `personal-server/game/hero-blazon-service.mjs`
- `personal-server/test/hero-blazon-service.test.mjs`
