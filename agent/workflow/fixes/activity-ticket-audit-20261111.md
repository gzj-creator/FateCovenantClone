# 活动开放但抽奖券不可获取：修复与同类项审计

日期：2026-11-11（Asia/Shanghai）

Worktree：`.worktree/activity-ticket-20261111`

分支：`fix/activity-ticket-20261111`

## 结论

本次真实问题不是抽奖券物品或 `PremiumActTable` 奖励缺失，而是活动代际兼容性回归：

- 客户端活动 `20001` 位于旧 `ActivityTable.Act`，字段为 `func=20`、`version=1`。
- `HundredDrawActTable.Version[1]` 明确映射抽奖池 `101`、礼包商城 `1841001` 和兑换商店 `182810`。
- 抽奖池 `101.draw_item=835802`。`PremiumActTable` 版本 `1001` 的免费礼包 `1270963` 真实发 30 张 `835802`，资源礼包 `1270964` 消耗 3000 钻石发 1 张；后续现金礼包同样发该券。
- 旧 `hundred-draw-service` 只接受 `ActFrameAct.type=1102`，因此 `20001` 的登录同步和 `117001-117005` 都不进入百抽服务。旧版通用活动读取对 `117005` 返回空包的习惯也被替换，所以活动入口可见但运行链路中断。
- 真实事件 `/data/disk1/game/data/events.jsonl` 第 85 行记录了 `2026-11-10T16:08:19.443Z command type=117005 seq=21 bytes=8`，与上述配置和代码路径一致。

修复后，`20001` 与 `1102` 共用同一权威抽奖状态机；登录时按 `Version.gift/shop` 映射将父活动、礼包商城和兑换商店作为同一有效窗口写入 module 183，PremiumAct 再写入礼包登录块。礼包购买记录仍按实际活动 `1841001` 落 SQLite。

## 回归证据

新增真实临时 TCP 测试使用正式开服时间、`launchProfile` 重定位和 `activityMode=schedule`，测试时刻为开服后 8 分 19 秒，早于静态表 `05:00` 窗口：

1. module 92 中存在 `20001`，其 `module_login_data` 可解为 `pb_hundred_draw_act_data`。
2. module 183 同时存在 `20001(type=20)`、`1841001(type=184)`、`182810(type=182)`，并与父活动共享窗口。
3. `1270963` 礼包购买成功，实际增加 `835802 x30`，购买记录归属 `1841001`。
4. `117001 act_id=20001 times=10` 成功，实际扣除 `835802 x10`，SQLite 累计抽数为 `10`。
5. `117005 act_id=20001` 成功返回可解码的 `pb_hundred_draw_act_marquee_rsp`，不再因旧活动类型报配置错误。

定向回归命令：

```bash
cd personal-server
node --test --test-concurrency=1 \
  test/hundred-draw-service.test.mjs \
  test/hundred-draw-gateway.test.mjs \
  test/activity-calendar.test.mjs \
  test/premium-act.test.mjs \
  test/launch-profile.test.mjs \
  test/gameplay-gateway.test.mjs
```

结果：43 项，43 通过，0 失败。

### 合并最新主线后的验证

修复提交为 `624bf68`，随后合入当时最新 `origin/main`（`8f1bf50`，包含账号隔离），合并提交为 `bd58e72`。以下验证均在该合并树上完成：

| 测试 | 结果 | 证据 |
|---|---|---|
| 百抽、登录活动、PremiumAct、launch profile、玩法网关定向回归 | 43/43 通过 | `analysis/test-runs/activity-ticket-20261111/targeted-after-merge.log`，SHA256 `03226d050c1535c4369ae6864605aff7e3ce452103e13597ba641a636204699b` |
| 账号隔离专项 | 2/2 通过 | `analysis/test-runs/activity-ticket-20261111/account-isolation-after-merge.log`，SHA256 `6dcb0ff61e478a371d74a609513672e2bdb51d4bce2cfede08bc3b57e25ee46a` |
| 先前全量中的 server-list/self-contained 换行失败 | 11/11 通过，确认与本次活动修改无关 | `analysis/test-runs/activity-ticket-20261111/prior-failures-after-merge.log`，SHA256 `f2b67dfeaf060f23605af1ca9a70467d8a8498720d59304d4266b69ac5696ad8` |
| 全量 `npm test` | 2823 项，pass 2821，fail 0，skipped 2，todo 0 | `analysis/test-runs/activity-ticket-20261111/full-after-merge.log`，SHA256 `9682446b63e4aae272ecf07201d0fdb9fa322b0c3e8ca4b52b940739103d121a` |

合并前同一定向集的日志也保存在 `analysis/test-runs/activity-ticket-20261111/targeted-before-merge.log`，SHA256 `acd4485fd8c944a218a223af5f56b0e7f8198d928cb5ad5869873e0869fcde0a`。

## 同类项审计

审计时刻固定为真实事件 `2026-11-10T16:08:19Z`（本地 `2026-11-11 00:08:19 +08:00`），正式开服时间为 `2026-11-11T00:00:00+08:00`，活动日历为 `schedule`。`20001` 的模块 92 自定义窗口从开服即开始，而其静态表 `server_start_time=18000` 要到本地 `05:00` 才开放；登录与抽奖判定必须以客户端实际收到的自定义窗口为准。

| 类型 / 活动族 | 当前证据 | 本次处理 | 仍存在的边界 |
|---|---|---|---|
| 旧百抽 `20001 / func=20` | 真实 `117005` 请求、完整百抽表与 PremiumAct 券奖励 | 已纳入百抽服务；父活动、礼包和兑换商店同步 | APK 视觉验收仍需用户操作 |
| 新百抽 `type=1102` | 既有 `1102001-1102010` 表与真实 TCP 回归 | 保留；同一父活动同步逻辑也覆盖现代礼包子行 | 保底权重、非英雄升星和部分奖励映射的既有证据缺口不改变 |
| 付费礼包 `type=184` | `PremiumActTable` 可驱动真实免费/资源/现金礼包；同一版本可对应多个活动 | 增加本次登录的父窗口记忆，避免材料化子行在后续可购检查中被静态过期窗口误判为关闭 | 共享 SKU 必须带活动 ID；客户端已验证会通过 `extra_param` 传入 |
| 兑换商店 `type=182 / 104801-104803` | 真实事件发生在本服 `00:08`，模块 92 没有 `type=182` 子行；按静态表到 `05:00` 后会有 `182001/182007/182010/187314/182503/182604/182608` 共 7 个窗口开放。全仓及本地资产路径均没有 `ActShopTable` | 将百抽的 `182810` 与父活动自定义窗口同步，使客户端拿到的百抽商店行有效 | 其余 182 商店缺商品、货币和等级奖励表，继续 `GameError(5)` 明确拒绝；不伪造商店 |
| 龙息之地 `107703` 历史拒绝 | 最近事件有 9 次 code 309；payload 解码为 `1036001/1036003/1036006`，三者静态窗口均未开放 | 未改业务逻辑；这些 ID 的拒绝符合当前表窗口 | `1036008` 使用未建模的 `time_fun=461`，后续需补客户端时间函数证据再验收整族 |
| 抽奖活动族 `draw-activity-service` | 部分英雄/棋局/转盘/彩票等族缺奖池或状态来源 | 保持表驱动路径与缺表明确拒绝 | 文档中列出的 fail-closed 族不能记为可玩 |
| 活动奖励 `act-reward-service` | 邀请、跨角色、公会全服进度等依赖本地服未建模的多角色数据 | 保持明确拒绝 | 不能用固定奖励伪装成功 |

## 验收边界

本轮没有启停实时服务、没有读写运行数据库、没有操作模拟器/ADB/APK。现有证据证明服务端正式排期下的协议与 SQLite 链路可用，不能替代用户打开礼包页、点击领取和完成抽奖后的 APK 视觉确认。

`182810` 兑换商店仍不是完整实现；本次修复的是父活动生命周期和券礼包同步。用户若从兑换商店而非 PremiumAct 礼包获取券，服务端会明确返回缺失配置错误，不会扣资源或伪造奖励。
