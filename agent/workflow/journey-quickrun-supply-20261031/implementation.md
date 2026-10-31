# 旅途快跑与旅途补给修复（2026-10-31）

## 状态与工作区

- 独立 worktree：`F:\projects\FateCovenantClone\.worktree\journey-quickrun-supply-20261031`
- 分支：`fix/journey-quickrun-supply-20261031`
- 基线：`0fb31e5`
- 修改范围：个人服务器端的共享预设编队同步，以及章节补给箱的解锁和批量领取幂等。未修改 APK 或客户端资源。
- 验收状态：专项测试、全量组件测试和临时端口真实 TCP 网关测试通过；尚未部署到实时服务，未重启服务，未操作客户端，尚未做真实 APK 验收。

## Bug 1：旅途快跑提示“上阵人数不足”

### 根因

登录模块 9 的当前 `pre_lineup` 已经是 6 人：`4030601, 2030301, 5040601, 4030301, 1040101, 4030801`；但 SQLite `play_lineups` 中共用预设的类型 `1/76/77` 仍保存旧 4 人：`2010101, 2010201, 1020601, 2020601`。`LineupTable.Type` 对这三个类型都配置了 `same_with_pre=true` 和 `team_fighter_num=[6]`，客户端可见主预设与旅途玩法实际读取的阵容因此分叉。

客户端 `PreLineupMgr.ReqUpdateLineup` 在普通布阵提交时发送 `handle_types=[0]`。旧服务把 `0` 当成 no-op，没有把主预设复制到旅途玩法阵容。`0` 作为通配符是根据客户端发送逻辑和 `same_with_pre` 配置推断出的服务端兼容行为；尚未通过原服对应回包做逐字段验证。

### 实现

- `personal-server/game/lineup-service.mjs` 新增共享预设类型集合 `1/76/77`。
- 类型 209 编辑预设时，`handle_types=[0]` 同步全部已存在的共享阵容；显式类型仍只同步对应目标。
- 新增登录态修复：每次登录构建 payload 前，把类型 `1/76/77` 与当前 `pre_lineup` 对齐，并返回实际修复的类型。
- 没有覆盖独立功能阵容；测试中的类型 4 保持不变。
- `personal-server/game/gateway.mjs` 在登录流程调用修复，并在确实改动数据时记录 `shared_pre_lineups_repaired`。

## Bug 2：旅途补给无法领取并提示“未解锁”

### 根因

实时请求是命令 `506 req_inner_box_award`，ETF 参数为 `[1,2,3,4]`。旧实现有两个相互叠加的问题：

1. 章节通关计数将“首个未通关节点”误算为已通关。当前节点仍为 `mission_id` 指向的节点时，该节点不能计入已通关数量；必须在完成任务、游标推进到下一节点后才能解锁对应宝箱。
2. 批量领取包含一个已领箱子时，旧逻辑直接整批返回 `310`。客户端一次提交多个可见箱子时，这会阻止其余未领箱子；而 `reward_claims` 与模块 8 BitBlock 也可能一前一后出现，缺少缺失记录的修复和幂等处理。

### 实现

- `personal-server/game/mission-fight-service.mjs` 的当前章节通关数改为只统计 `section.index < currentSection.index` 的节点。
- 移除批量请求中“任一箱已领即整批 310”的预检查。
- 在一个事务内逐箱检查 BitBlock 和 `reward_claims`：只有两个持久化位置都未记录时才发放奖励。
- 已经存在于任一领取记录的箱子跳过当前解锁门槛，使旧边界逻辑产生过领取记录的整批重试仍能成功；只有真正会新发奖的箱子才要求达到 `need_pass`。
- BitBlock 已有记录但 `reward_claims` 缺失时，只补齐领取流水，不重复发奖。
- 全部已领时返回成功，响应 `res_change.changes=[]`，并保持原 BitBlock。

## 测试

- `hero-progression.test.mjs` 新增共享预设修复用例：登录修复类型 `1/76/77`，保留类型 4；209 的 `handle_types=['0']` 返回 `copy_lineup=[1,76,77]`；重启后修复保持幂等。
- `mission-fight-service.test.mjs` 覆盖：3-5 未完成时箱子仍锁定；游标推进到 4-1 后可领；单箱重复领取；先领 1 后再请求 `[1,2,3,4]` 只发 2–4；当前游标回到 4-10 时已领四箱仍返回空成功；重启后重复请求为空变更；BitBlock 已领但流水缺失时不重复发奖。
- `gameplay-gateway.test.mjs` 的真实 TCP 网关用例改为验证重复领取成功且无资源变化。
- 专项测试：`node --test test/mission-fight-service.test.mjs test/hero-progression.test.mjs`，36/36 通过。
- TCP 网关专项：`node --test test/gameplay-gateway.test.mjs`，3/3 通过。
- 全量：`npm test --prefix personal-server`，298/298 通过。
- `git diff --check` 与修改文件的 `node --check` 通过。

用 `node:sqlite` backup API 复制 2026-10-31 14:43:28 UTC 的实时数据库后在副本上验证：`mission_id=40210`，`pre_lineup` 为 6 人；类型 `1/76/77` 修复前均为旧 4 人，修复后均为主预设 6 人；客户端原始 `[1,2,3,4]` 补给领取重试成功且 `res_change.changes=[]`，BitBlock 不变；`reward_claims` 已有 `1..4`，`PRAGMA integrity_check=ok`。快照 SHA256 为 `67b5c1478aed3ac08d14b077d83a3b675d3373ede4219b1e31015d4e344cd458`，证据在 `analysis/tmp/journey-fix-20261031/current-snapshot-verification.local-only.json`。该验证只修改副本，不是 APK 验收。

## 部署与验收边界

开始验证时实时状态为 PID `46916`，端口 `18880/18881/18882/18883/19090`。验证过程中状态文件显示实时服务由其他流程变更为 PID `35640`；本 worktree 没有执行部署、重启服务、修改实时 SQLite 或操作隔离客户端，因此不能据此认定 PID `35640` 已加载本分支。部署并重新登录后，服务端登录修复会自动把现有类型 `1/76/77` 对齐到 6 人主预设；之后再由用户在真实 APK 中验证旅途快跑可进入，以及 3-5 通关后的补给箱可领取。

本次是纯服务端修复，不生成新 APK，也不更新 APK 快照记录。只有在实时服务部署并完成真实客户端操作后，才能把两项问题标记为 APK 验收完成。
