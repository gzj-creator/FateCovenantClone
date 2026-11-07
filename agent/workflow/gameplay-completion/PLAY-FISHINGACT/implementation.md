# PLAY-FISHINGACT 实施记录：鱼竿、图鉴、等级/进度/上榜奖励与记录

日期：2026-11-07
分支：task/PLAY-FISHINGACT-20261107（worktree .worktree/gameplay-20261106/play-fishingact）
任务卡：docs/plans/remaining-gameplay-20261106/07-exploration-minigames.md 的 PLAY-FISHINGACT 小节

## 范围与结论

本轮把 FishingActCmd 的 5 条拒绝分支和 2 条固定空结果改成真实业务，并保持 110301/110302/110305/110311 的既有路径：

| type | 命令 | 本轮行为 |
| ---: | --- | --- |
| 110303 | req_fishing_act_get_fish_top | 按活动捞出每鱼尺寸前三名，数据来自本轮落库的真实渔获 |
| 110304 | req_fishing_act_book_award | 图鉴领奖：未捕获→311，重复→310，发 Fish.first_award，置 book_state 位 |
| 110306 | req_fishing_act_change_rod | 换竿：须已激活（免费或已拥有 Rod.item），无响应体，落 SQLite |
| 110307 | req_fishing_act_level_award | 等级奖：按 score 对应等级校验，发 Level.unlock_reward，置 level_state 位 |
| 110308 | req_fishing_act_get_record | 返回本活动最近渔获（鱼、尺寸、分数、角色名、地图） |
| 110309 | req_fishing_act_up_rank_award | 特殊鱼总尺寸达到 Version.rank_need_score 后一次领取 up_rank_award |
| 110310 | req_fishing_act_progress_award | 进度奖：按图鉴解锁数量校验，发 Progress.award，置 progress_state 位 |

状态分级：服务端完成；组件测试、临时 TCP（真实数字 type + ETF）、SQLite 重开与编码失败回滚通过；本轮不做 APK/UI 视觉验收（任务边界不启停实时服务、不操作模拟器）。

## 配置与协议依据

请求/响应（personal-server/assets/protobuf/ 中的 fishing 相关 proto 与 interface-catalog 静态目录）：

- 110303/110308/110309：ETF 单参数（活动 id），响应分别为 pb_fishing_act_get_top_rsp、pb_fishing_act_get_record_rsp、pb_fishing_act_data_res；本轮在 gateway 中新增 fishingEtfTypes 解码，经 options.etfValue 传入服务。
- 110304/110310：pb_fishing_act_common_list_req{act_id, repeated value} → pb_fishing_act_data_res。
- 110306/110307：pb_fishing_act_common_req{act_id, value} → 110306 无响应 schema（空 Buffer），110307 → pb_fishing_act_data_res。

配置事实（FishingActTable 全表 dump 见 analysis/scratchpad/PLAY-FISHINGACT/fishing-tables.json）：

| 表 | 关键字段 | 本轮用途 |
| --- | --- | --- |
| ActFrameAct | version | 1074001–1074011 → FishingVersion 1–11；本轮实测活动 1074003 → version 3 |
| FishingVersion | island_version、level_library、illustrated_guide_version_library、fishing_rod_library、rank_need_score、up_rank_award | 图鉴/等级/鱼竿库版本与上榜门槛 |
| FishingFish | version、type、first_award、value_type、obtained_money | 图鉴鱼集合（type=0）与图鉴首捕奖励；value_type=1 为特殊鱼 |
| FishingLevel | belonging_version、level、unlock_reward | 等级奖 |
| FishingProgress | version、progress、award | 进度奖（version 对比 FishingVersion.tid，不是 level/island 库） |
| FishingRod | ver、item、is_free | 换竿前置：免费或已拥有 rod.item |

1074003 的具体值：island_version=2、level_library=2、illustrated_guide_version_library=1、fishing_rod_library=1、rank_need_score=80000、up_rank_award=[[101500,2000],[392002,80],[391002,2000]]；level tid=201..253，progress tid=301..305，codex 鱼为 tid 101..140 中 type=0 的 35 条，鱼竿 1..4。

## 客户端证据（LuaJIT prototype）

证据工具与产物在 analysis/scratchpad/PLAY-FISHINGACT/（dump.mjs、view.mjs、fishing-tables.json、各 *.protos.jsonl）。该目录被 /analysis/ 全局排除，不进入提交。

- FishingActData #24/#25/#26：level_state、book_state、progress_state 均为 Core.BitBlock.Get(_actInfo.<state>, tid)，位索引就是对应表的 tid（0 基、MSB-first），与仓库 personal-server/game/bit-block.mjs 的 hasBit/setBit 一致。
- FishingActUtil #17（GetCodexFishList）：按 FishMap 过滤 version==illustrated_guide_version_library 且 type==FISH_TYPE_FISH(0) 并排序。
- FishingActData #27（GetCodexUnlockCount）：遍历 GetCodexFishList 并对每鱼调用 IsFishUnlocked(tid) 累加，即“已记录图鉴鱼条数”。
- FishingActData #44/#45/#46：等级奖、图鉴奖、进度奖红点分别用 IsLevelStateReceived / IsBookStateReceived / IsProgressStateReceived 判断领取位，进度奖阈值取 Progress.progress。
- FishingActMgr #35（SetRod）：只更新本地角色数据并 Fire EVT_ROD_CHANGED；110306 回包体保持空 Buffer。
- FishingActLevelAwardNode #7：等级奖展示 Level.unlock_reward；FishingActCodexNode（#1 SetData 等）展示 Fish.first_award 并驱动图鉴红点。
- FishingActData #32：go_rank_reward 即上榜奖领取标志。

## 实现说明

personal-server/game/activity-read-service.mjs：

- 新增 fishing_act_catches 表（构造时 store.inspect 内 CREATE TABLE IF NOT EXISTS，含 (act_id,fish_id,size) 与 (act_id,id) 两个索引）。110302 单收、110311 批量收鱼在同一事务内插入渔获行（role_id、act_id、fish_id、size、score、map_id、name、caught_at）。name 取 model.role.nick_name（Buffer 或 store 中的 base64 字符串均可解），与客户端 pb_fishing_act_new_fish_record.name 对应。
- 110303：按 fish_id 分组、size 降序每题取前 3，输出 pb_fishing_act_fish_record{fish_id, data_list[{size,score,role_id}]}；单角色部署下只会出现本角色真实渔获。
- 110308：返回本活动全部真实渔获，按 id 倒序映射 fish_id/size/score/name/map_id。
- 110304：value 列表为 fish tid；校验配置（1）、已捕获（311）、未领取（310），发 first_award 并置 book_state 位。
- 110307：value 为 level tid；按 FishingLevel.belonging_version==FishingVersion.level_library 校验，当前等级用既有 fishingLevel(score) 计算，未达等级 → 311，重复 → 310，发 unlock_reward 并置 level_state 位。
- 110310：value 列表为 progress tid；Progress.version==FishingVersion.tid 过滤，阈值用“图鉴已捕获条数”，未达 → 311，重复 → 310，发 Progress.award 并置 progress_state 位。
- 110309：high_size ≥ rank_need_score 才可领取，go_rank_reward=1 后重复为 310，发 up_rank_award。
- 110306：syncRodLibrary 汇总“免费鱼竿 ∪ 拥有 Rod.item 的鱼竿 ∪ 既有 have_rod_list”，未激活 → 311；成功后落 rod 字段。
- 所有领取/换竿都在 store.transaction 内先校验、再发资源、再写位、最后 pack 响应；pack 抛错整体回滚（专项用例覆盖）。
- 110303/110308 无 ETF 参数时回退到当前运行中的钓鱼活动；若没有任何钓鱼活动在运行，则保持旧行为返回空列表（登录初始化兼容）。110309 无参数且无活动 → 309。
- 错误码沿用仓库约定：1 参数/配置非法，309 活动未运行/未初始化，310 已领取，311 条件不足，5 配置缺失/不支持。

personal-server/game/gateway.mjs：新增 fishingEtfTypes={110303,110308,110309}，在 activityRead 分支内用 etfArgument(..., {optional:true}) 解码活动 id 并透传；新增 6 个提交事件名便于日志定位。

既有路径语义修正：pb_fishing_act_role_data.high_size 注释为“特殊鱼总尺寸”，且 FishingActVersion.rank_need_score 用它做上榜判断，因此 recordCatch 由“全鱼最大尺寸”改为“仅 value_type==FISH_VALUE_TYPE_HIGH 的尺寸累加”；get_money_num 仍随特殊鱼累加，普通鱼只进 score/base_score。此改动同时影响 110301/110302/110311 的角色数据回包，属于有证据的修正，回归用例覆盖。

## 验证

日志保存在 analysis/test-runs/PLAY-FISHINGACT-20261107/（analysis/ 不入库）：

- focused.log：node --test test/activity-read-service.test.mjs test/fishing-act-service.test.mjs → 14/14 通过。
- gateway.log：node --test test/gameplay-gateway.test.mjs → 7/7 通过，含真实 TCP 握手后的 110301→110302→110303→110308→110304→110306→110307→110310→110309 全流程（seq 70–82）、重复领取 310、跨活动隔离、编码失败回滚。
- regression.log：node --test test/activity-calendar.test.mjs test/activity-calendar-config.test.mjs test/pet-activity.test.mjs test/hundred-schools.test.mjs test/relic-divine-gateway.test.mjs test/recharge-rebate-reset-service.test.mjs → 27/27 通过。

fishing-act-service.test.mjs 覆盖：图鉴奖一次性与重开保持、等级奖等级门槛与重开、进度奖计数与重开、上榜奖阈值与重开、鱼竿激活/切换/重开后抛竿读取、110303/110308 真实数据与跨活动隔离、编码失败整体回滚、活动结束/非法活动拒绝且状态不变、无参数登录读在无活动时返回空列表。

复现命令（personal-server 目录）：

```powershell
node --test test/activity-read-service.test.mjs test/fishing-act-service.test.mjs
node --test test/gameplay-gateway.test.mjs
```

## 证据缺口与后续

1. 110308“好渔获”筛选与展示条数上限未取证：当前返回该活动全部真实渔获（id 倒序），客户端若带筛选/分页参数需后续补抓。
2. 活动结束按名次结算奖励（HighScoreRank/ScoreRank 的 map_tid 名次区间）未实现：客户端提示为活动结束结算，不属于 110309 领取范围，需单独做定时/登录结算。
3. 鱼竿通过充值 FishingBuy(139001/139002) 直发的服务端链路未接入：当前靠 Rod.item 归属或既有 have_rod_list 识别，充值购买流程若绕过道具发放会暂时识别不到。
4. 错误文案（客户端 Err 表）未逐条映射验证，本轮只保证错误码落点符合仓库既有约定。
5. 天气、鱼竿加成、尺寸/概率公式的完整对齐仍未做；本轮只改了 high_size 语义。
6. APK/UI 验收未做（本轮边界禁止启停实时服务与操作模拟器），客户端显示与红点行为需后续实测。

## 变更文件

- personal-server/game/activity-read-service.mjs
- personal-server/game/gateway.mjs
- personal-server/test/activity-read-service.test.mjs
- personal-server/test/gameplay-gateway.test.mjs
- personal-server/test/fishing-act-service.test.mjs（新增）
