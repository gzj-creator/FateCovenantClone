# P1 后期养成与扫荡接口修复

更新时间：2026-10-31（Asia/Singapore）

## 范围

本轮处理隔离客户端 `com.jzyx.ps` 反馈的四项问题：

1. type 636 英雄升级报错且等级不提升。
2. type 82601 星火无法点亮。
3. type 640 非凡觉醒显示服务器错误。
4. type 503 扫荡接口未实现。

工作区为 `.worktree/endgame-progression-fixes`，分支
`fix/endgame-progression-fixes`，基线 `22d3533`。

## 真实证据

- `2026-10-31T02:55:22Z`，type 636 `req_develop_up_lv` 返回业务码
  `331`。`UpStage[0].need_hero_lv=1`，旧代码把当前突破档的等级门槛
  当作升级上限，导致突破 0 的 1 级英雄升 2 级即被拒绝。
- `2026-10-31T02:56:47Z`，type 82601 `req_destiny_up` 返回
  `LOCAL_NOT_IMPLEMENTED`；ETF 请求为 `[101,102,103,104,105,106]`。
- `2026-10-31T02:55:25Z` 与 `02:59:21Z`，type 640
  `req_develop_up_star_high` 返回 `LOCAL_NOT_IMPLEMENTED`；真实请求为
  `pb_hero_wake_req{hero_tid:5040601,res:[{tid:821502}]}`。
- `2026-10-31T02:59:37Z` 起，type 503 `mission_sweep_passed` 多次返回
  `LOCAL_NOT_IMPLEMENTED`；真实请求为 `{tid:30202,times:1}`。

## 实现

### 636 升级

- 升级校验改为读取下一突破档 `UpStage[break_level+1].need_hero_lv`。
- `break_level=0` 可从 1 级升到 17 级；17 级后要求先突破，之后按下一档门槛继续。
- 保留 300 级上限、团长等级倍率、资源和绑定校验。

### 82601 星火

- 新增 `config/destiny-tables.mjs` 与 `game/destiny-service.mjs`。
- 登录时确保 module 100 为 `pb_destiny_data{cur_stage=1,slot_state=13字节}`。
- 只接受当前阶段节点；按 `nodeId % 100` 写入 MSB-first BitBlock。
- 合并并扣除节点 `active_res_list`；重复节点、跨阶段节点和材料不足均返回业务错误。
- 当前阶段全部节点点亮后推进 `cur_stage` 并清空下一阶段位图。
- 响应用 `pb_destiny_up_back{destiny,res_client}`，模块和资源在同一事务内持久化。

### 640 非凡觉醒

- 网关按 `pb_hero_wake_req` 解码，响应 `pb_hero_up_star_ret`。
- 客户端 `res` 只提交选中的材料类型；真实请求不包含 `num`。
- 服务端按品质和当前星级读取 `UpStarCost`，按阵营与品质读取
  `UpStarStone`，使用配置的 `stone_num=5`，同时扣除英雄碎片。
- 5040601 当前基础星级按配置的 5 星计算，成功后存档星级变为 6。
- 重复、未配置、材料不足和数量篡改均在写库前拒绝。

### 503 扫荡

- 网关接入 `pb_mission_sweep_passed_req` 与
  `pb_mission_sweep_passed_rsp`。
- 校验请求节点已通关、次数合法、`Sweep` 奖励和 `SweepConst` 消耗配置有效。
- 在单一事务内扣除扫荡券并发放配置奖励，返回最终资源变化和逐次奖励组。
- 当前表内 76 个可扫荡节点都是确定性奖励；存在随机奖励配置时明确拒绝，不伪造掉落。

## 验证

- `npm test --prefix personal-server`：**210/210 通过**。
- 定向测试覆盖真实 TCP 636、ETF 82601、PB 640、PB 503、SQLite 重开、资源不足、
  重复请求、非法配置和编码失败回滚。
- 640 网关测试使用真实客户端的 `res:[{tid:"821502"}]` 形状。
- 503 使用真实配置节点 `30202`，验证 `100012900-5` 和三项奖励。

## 验收状态

- 组件测试：通过。
- 临时 SQLite/TCP 集成：通过。
- 真实 APK 请求：待部署后核验。
- 用户视觉验收：待用户确认四项界面结果。

## 2026-10-31 运行环境备注

修复代码完成时，五个端口由另一个正在收尾的活动 worktree 服务占用，不能把该进程
误记为本次修复已部署。部署前必须重新读取
`runtime.local-only.data/server.local-only.json`、进程命令行和 SQLite 一致性，并使用
当前运行库的一致性备份。
