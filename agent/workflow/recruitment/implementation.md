# 招募功能实现

日期：2026-10-29

## 本次范围

- 工作分支：`feature/recruitment`
- 工作目录：`F:\projects\FateCovenantClone\.worktree\recruitment`
- 根因：网关没有处理 `599/600/601`，购买抽卡券和抽卡均返回 `LOCAL_NOT_IMPLEMENTED`；同时客户端 `HeroDataMgr:DrawNumLimit` 在招募记录存在时直接读取 `daily_can_draw_num`，旧记录缺少该字段会表现为 0 次可抽。
- 已实现普通招募、高级招募、友情招募、心愿招募，以及心愿选择/取消、招募支持数据和跑马灯读取。
- 未部署到运行中的服务，未操作模拟器、客户端或原版 `com.jzyx.my`。

## 协议与数据

- `599 req_draw_buy_magic_scroll`：高级抽卡券 `3002`，单张 800 钻石，每日 60、终身 600。
- `600 req_draw_buy_normal_scroll`：普通抽卡券 `2002`，单张 250 钻石，每日 1200、终身 8000。
- `601 draw_hero`：支持库 `1` 普通、`2` 高级、`3` 友情、`10` 心愿。正数 `point_draw_num` 优先；否则 `draw_type=1` 使用配置的最大连抽数，其余为单抽。
- `642/643/657/658`：读取并持久化普通心愿和扩展心愿的英雄、槽位。
- `651/652`：返回空的角色/服务器支持列表。
- `673`：返回空的自定义跑马灯数据。
- `DailyCanDrawNum`：与客户端 `HeroDataMgr:DrawNumLimit` 对齐。高级招募初始 `1,000,000` 次，心愿招募初始 `10,000` 次；抽卡后扣减，跨天按 `HeroTable.DrawNumLimit` 恢复。

新英雄仍通过客户端既有的 `ItemTable.Chip[award.tid] + award.extra` 路径识别。`extra` 是 ETF 编码的英雄 TID，不是 protobuf 英雄对象。英雄本体、碎片和招募计数均在同一个 SQLite 事务内写入；重复英雄按 `Quality.convert_piece_new` 转换为碎片。

> 2026-10-30 修复：新英雄也必须按 `Quality.convert_piece_new` 发放碎片包，不能只发 1 个碎片；否则 `HeroDrawUILogic.FilterAwards` 的 `floor(num / convert_piece_new)` 为 0，结果页会以 `executeCount = 0` 崩溃。详见 [fixes/recruit-result-no-card.md](../fixes/recruit-result-no-card.md)。

## 持久化与限制

- 招募信息保存在 module 10 的 `pb_hero_draw_info`；普通/高级购票信息分别保存在 module 10 的索引 9 和 10。
- 每日和终身购票次数保存在角色 metadata，重开数据库后继续生效。
- 新英雄写入 `heroes` 表，资源写入 `resources` 表；编码或 SQLite 写入失败会整体回滚。
- 普通/高级保底分别读取 `Guaranteed[1/2]`，友情和心愿读取 `Guaranteed[3/10]`；达到阈值后强制至少品质 50。
- 客户端配置的 `Group 101/102/103/110` 奖励明细为空，无法恢复原服概率。当前本机兼容池使用 `Hero.chip > 0` 的 77 名英雄，品质权重为 `30/40/50/60/70 = 50%/30%/15%/4.5%/0.5%`。这些是本机占位概率，不是原游戏事实。
- 心愿英雄可保存和取消，但本次没有伪造原服未取证的软保底权重。

## 验证

- `npm test --prefix .\personal-server`：`141/141` 通过。
- 新增招募专项测试覆盖：两种购票、钻石不足、购买上限、四库消耗、每日可抽次数、单抽/连抽、新英雄与重复英雄、登录模块中的新英雄恢复、保底跨重启、编码失败回滚、心愿与辅助读取、空跑马灯。
- `gameplay-gateway.test.mjs` 使用临时 loopback 端口和数据库副本完成真实帧 `600 -> 601`，确认 ETF 购票请求、protobuf 抽卡、资源扣除和响应均可解码。
- 当前仅为组件和临时 TCP 验收，不代表真实 APK 招募画面和动画已通过。后续部署后需由用户在隔离客户端验证四种招募、新英雄展示、重复转碎片、重启后次数和保底。

## 复现

```powershell
cd F:\projects\FateCovenantClone\.worktree\recruitment
npm test --prefix .\personal-server
```
