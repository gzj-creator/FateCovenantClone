# 活动时间、榜单入口与任务领奖

2026-10-31：[排行榜通用协议扩展](leaderboard-api.md)在 `feature/avatar-profile` 分支补齐 `2002/2005/2006/2007/2009/2010`，并保留已实现的 `2000/2001/2008/2011` 空榜/未上榜语义；组件和临时 TCP 共 267/267 通过，尚未部署或 APK 验收。

23:59最新真实APK证据覆盖下方待验：23:56:32、33、34分别发79104 act_id13016、task55021/55022/55023，seq28/31/34全部sprint_reward_committed。SQLite已持久化三条activity_claims，module92 receive_data=AAAH，refresh_day20751；当前钻石60、冲榜积分60。未手改真实排名，使用module150当日96名。用户尚未口头反馈奖励展示，不能写完整活动玩法验收。证据wallet-admin-20261025/handoff-acceptance.local-only.json和handoff-game.local-only.sqlite，integrity_check=ok。

更新：2026-10-25 23:44。

## 用户已验收

用户确认限时冲榜入口显示，并在解锁修复后确认详情可打开。前一轮证据p3/sprint-entry-fix-20261025/acceptance.local-only.json；84/84组件通过。FunOpenMgr使用按1000拆分的target和MSB-first位图，sprintPreview仅打开1039/1537详情入口，不发奖励。2000/2008/2011返回符合PB结构的空榜；没有模拟其他玩家或排名结果。活动倒计时修复、ETF结构具体以现有时间迁移源码与测试为准，所有活动玩法仍未验收。

## 本轮任务领奖

game/sprint-service.mjs实现79104 pb_sprint_rank_task_receive_req→pb_sprint_rank_task_receive_rsp。module92 pb_act_login的act_parallel_list中，module_login_data为ETF四binary列表，第2项是pb_sprint_task_data。rank_task_list.type_tid使用act_id而非SprintType。配置通过OpenServerSprintTable、TaskTable解析。

领取验证任务归属、活动运行状态、暂停状态、任务进度和每日/一次领取位；按配置发award及rank_score_item积分，在同一SQLite事务内写activity_claims、资源及嵌套领取位。异步ETF编码提前完成，事务内核对module92快照，PB编码失败或中途某项不达标全部回滚。每日任务按05:00刷新，重登保留领取位。请求日志只记actId、taskIds及拒绝原因，便于用户操作定位。

进度目前支持统计计数、角色等级、HunterArena/Tournament每日最佳排名和段位；未知函数明确拒绝，不伪造完成。TaskType7004/7005对应HunterArena，700x中的具体映射以progress_fun452/453/454/455为准。

重要纠错：旧截图显示的是“巅峰对决”子页，即任务55021等Tournament任务，不能因默认SprintType55就按55001/HunterArena验证。运行存档module150.tournament.base.best_rank已有当日96名，故55021/55022/55023分别200/150/100名目标可通过；module121的HunterArena best_rank为空不能凭空写入96。本轮没有改真实库排名。组件测试已覆盖Tournament配置选择、混合不达标请求全回滚以及无Hunter记录时拒领。

91项完整测试通过；领取防重、重开SQLite、资源与积分/位图更新已组件验证。用户真实APK领奖仍待验收；最终排名结算/邮件奖励不在79104任务奖励范围，未实现。活动完整时间窗口校验、其他统计时间区间与未知进度函数仍待完善，不能称所有冲榜功能完成。
