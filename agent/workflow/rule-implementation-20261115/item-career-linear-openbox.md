# ITEM-CAREERLIFE / LINEARLEVEL / OPENSERVERBOX 实施证据（2026-11-15）

本记录覆盖46条批次中的`85804`、`93501`、`69301/69302`。三族使用各自原表、状态所有者、登录slot、领取位和消费者，不互相借奖励或完成状态。

## ITEM-CAREERLIFE 85804

- 原`CareerLifeTable`源SHA256为`825e93fc514bdebf683f96dfad1977bc1a05b437a2f45097cac4b0f925c49a90`，行摘要为`1e91dbefabda7c8828bb137a0202161a3a3b98acd84a38904e876bdd3a065c2d`；StoryChapter 18、Story 99、BossConst 1、Boss 0，18章的`res/res_count`全为0。功能`TID_CAREER_LIFE=1129`原门槛为角色15级。
- 同版PB请求为ETF `[chapterId]`，回包为`pb_career_life_back{career_life_info,res}`；登录模块153直接包含`pb_career_life`。
- 服务端以mission模块的权威游标和原`Section.index`检查该章每个`Story.open_mission`，包含`is_discard=true`剧情节点。成功时事务写`story_bin`对应章位；未知章、未通过、重复、损坏状态或缺失mission模块均在写入前err5，回包编码失败回滚。
- 原表奖励为空，因此成功回包不伪造资源变化。专项9/9、真实临时TCP、module153登录投影、重复拒绝和SQLite重开通过。

## ITEM-LINEARLEVEL 93501

- 原`LinearLevelTable`区分战斗type/level和宝箱index；每个type的宝箱行给出累计`pass_fight`、index和原奖励，模块535保存`pb_linear_level_role.linear_levels`及`box_award`位图。
- `linear-level-service.mjs`拒绝空/重复/未配置index；在真实累计通过门槛和未领位检查后，一次发原奖并置各box位，响应`pb_linear_level_box_award_rsp`。
- ETF/PB请求、门槛差1、重复、资源/编码失败、登录同步、SQLite重开和真实临时TCP通过。indexes不是关卡tid；本命令不与9010线性任务共用状态。

## ITEM-OPENSERVERBOX 69301/69302

- 原`OpenServerBoxTable`源SHA256为`76b425229956d285a62726a9d2dc8888e205d2b142c54b614c0e75c57f0172e0`，包含Version 4、每版OpenServerBox 30日和Progress 5日行。功能/章节当前配置门槛为通关60205。
- 69301按激活业务日的候选日、版本和领取游标发一日普通或付费奖，并推进`rev_days`；付费分支只认真实630070订单产生的`recharge_flag`，后台加余额不置位。69302按`need_progress`、版本和独立进度位发`pb_res_to_client`。
- SQL/版本漂移/跨日/损坏状态在扣发前err5；编码和持久化失败回滚。登录空态与历史投影、真实临时TCP、SQLite重开和付费订单选择通过。

## 验收边界

| 层级 | 85804 | 93501 | 69301/69302 |
| --- | --- | --- | --- |
| 原配置/PB/客户端调用者 | 已闭合 | 已闭合 | 已闭合 |
| 服务端事务 | 完成 | 完成 | 完成 |
| 登录同步 | 模块153已测 | 模块535已测 | 活动登录已测 |
| SQLite重开 | 通过 | 通过 | 通过 |
| 离线真实TCP | 通过 | 通过 | 通过 |
| 在线推送 | 未取得独立slot | 未取得独立slot | 未取得独立slot |
| APK | 未验收 | 未验收 | 未验收 |
| 生产TCP/生产库/部署 | 未验收 | 未验收 | 未验收 |

原服务端成功函数未取得，因此成功语义属于同版表/PB/客户端消费链的R1实现；本记录不声称原服二进制已逐指令复原。
