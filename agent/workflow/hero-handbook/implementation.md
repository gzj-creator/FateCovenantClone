# 图鉴升级、一键升级与拥有奖励 (644/645/655)

## 结论

本轮在 worktree `feature/interface-implementation-20261101` 完成 644/645/655 三条图鉴命令、登录同步和 655 奖励路径。`npm test --prefix personal-server` 343/343 通过。未部署、未操作设备、未改运行库或 APK。

## 实现文件

- `personal-server/game/hero-handbook-service.mjs`：从 system-hero-handbook worktree 移植完整实现（raiseOne / raiseOneKey / claimOwnAward / ensureLoginState）。
- `personal-server/game/gateway.mjs`：新增 `handbook.supports(type)` 路由（644/645/655）。
- `personal-server/config/hero-tables.mjs`：`readHeroTables` 新增 `HandbookConstant`。
- `personal-server/test/hero-handbook.test.mjs`：移植 11 项测试。

## 协议与客户端消费

- 功能 ID `10009`，父登录模块 module 10 `HeroDataMgr`，slot 3 = `pb_hero_all_handbook_record`。
- `pb_hero_handbook_record`：`tid`、`quality`、`star`、`is_mutant`。
- `pb_hero_all_handbook_record`：`records`、`own_rev`（按 `HeroTable.Hero.index` 的位图，MSB 优先）。
- `pb_hero_handbook_raise_one_key_req`：`repeated int32 hero_id`。
- `pb_hero_handbook_raise_up_rsp`：`repeated pb_hero_handbook_record records`。
- `pb_hero_handbook_own_award_back`：`bytes rev_bin`、`pb_res_to_client res_change`。
- 644 与 655 都没有 protobuf 请求消息，参数是裸 ETF 标量；645 使用 protobuf 请求。

## 关键实现要点

- **type 644**：裸 ETF 英雄 tid；一次调用推进一步（star<5 先升 star；star==5 按 quality 阶梯；star>5 先升 star 再升 quality）；上限为拥有英雄的 star/quality；未拥有或隐藏英雄返回 3001；非法 tid 返回 1；无资源消耗。
- **type 645**：protobuf `hero_id` 列表；去重；空列表或非法 id 返回 1；任一英雄未拥有返回 3001，整批不写入；单事务内每个英雄推进一步；响应全部记录。
- **type 655**：裸 ETF 英雄 tid（可省略以领取全部）；按 `HeroTable.Hero.index` 位图防重；`HandbookConstant` 配置 award_item/award_count 时发放奖励；无奖励配置时 res_change 为空；幂等。

## 测试

- `node --test test/hero-handbook.test.mjs`：11/11 通过。
- `npm test`：343/343 通过。
- 覆盖成功路径、幂等性、非法输入、资源不足（奖励配置）、事务回滚（SQLite 异常、编码异常）、重启持久化、真实 TCP 路径。

## 验收分级

- 组件测试 + 临时 TCP 测试通过。
- 未部署到运行服务、未操作设备、未修改 APK。
