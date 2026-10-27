# 福利领取与礼包购买修复

日期：2026-10-28

## 范围与根因

实时服务日志中以下命令返回 unsupported_command，客户端统一显示“服务器发生错误”：

| 命令 | 含义 | 根因 |
|---|---|---|
| 82101 | 7 日登录领奖 | 未实现 pb_multi_login_award_req |
| 84601 | 公主/福利体力奖励 | 未实现 pb_princess_req |
| 99300 | 每日特惠自选奖励 | 未实现 pb_daily_discount_select_req |
| 16005 | 礼包购买/免费领取 | 未实现 pb_recharge_buy_or_rev_req |
| 117005 | 百抽活动跑马灯 | 打开活动页时读取请求未应答 |

此外，7 日登录奖励中的 71200/11200 属于 res_type=1200 的道具箱/碎片，旧 grantResources 会以“需要单独玩法处理”拒绝。

## 实现

- personal-server/game/welfare-service.mjs（新增）
  - 82101：读取模块 92 pb_act_login，校验活动状态、版本（37）、天数、奖励配置；按 Core.BitBlock 的 0-based/MSB-first 规则写回 module_login_data；activity_claims 以 period=v<version> 幂等记录；奖励来自 MultiLoginTable.MultiLogin。
  - 84601：读取模块 126 pb_princess；type_tid=2 对应 PrincessTable.EnergyAward，param 1/2 分别写 last_noon_day/last_night_day，同日重复返回 310。
  - 99300：读取模块 108 pb_daily_discount_all，按 DailyDiscountTable.Recharge（短 tid 1..6 -> 真实 recharge_id）校验轮换，写入/更新 select_list。
  - 16005：转调 wallet.purchaseGift，响应 res_buy_or_Rev_gift。
- personal-server/game/wallet-service.mjs
  - 新增 purchaseGift：只处理 RechargeTable.type=46；免费礼包 pay_type=2, price=0；付费礼包 pay_type=0, price>0；can_buy_times 由 recharge_orders 计数强制；余额不足返回 301，超限返回 307；事务内发奖、扣款、写订单/流水，并更新模块 19 res_recharge_login.buy_gift_record。
- personal-server/game/resources.mjs
  - 允许 res_type=1200 的普通背包道具/碎片箱。
- personal-server/game/activity-read-service.mjs
  - 117005 返回空 pb_hundred_draw_act_marquee_rsp。
- personal-server/config/game-tables.mjs
  - 新增 Activity、MultiLogin/Const、PrincessTable 的 EnergyAward/Gift/LoginAward/HolidayAward、DailyDiscountTable 的轮换/自选表。
- personal-server/game/gateway.mjs
  - 在 sprint/wallet 分支前接入 welfare，业务错误按 GameError.code 返回，不再落到 LOCAL_NOT_IMPLEMENTED。

## 证据与验证

- 实时请求证据：analysis/experiments/private-server-20261025/p3/runtime.local-only.data/server-voucher-010245.local-only.log
  - 82101 EgMI9RwIrZ4D -> act_id=53037, award_tid=3701
  - 84601 CgQQAQgC -> type_tid=2, param=1
  - 99300 GJGiAQjIuAIQAQ== -> recharge_tid=40008, select_tid=1, day_index=20753
  - 16005 Eg1bW2ZhbHNlLDAsMF1dCMa4AhgB -> recharge_id=40006
- 配置表：analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_project.bundle/bytecode/ 下新增本地 dump：MultiLoginTable.data.lua.json、PrincessTable.data.lua.json、DailyDiscountTable.data.lua.json（analysis 为本地证据，不提交 Git）。
- 测试：npm test --prefix .\personal-server，117/117 通过，新增 5 项（4 项服务测试 + 1 项真实 TCP 网关测试）。
- 实时数据库副本端到端模拟：复制 game.local-only.sqlite 后通过真实 TCP 登录，82101 领取 3701/3702/3703 成功，84601 午餐成功，99300 选择成功，16005 免费礼包成功；余额 0 时购买 40008 返回业务错误 301。未修改实时数据库或服务。

## 部署状态与限制

- 本工作树为 feature/welfare-gift-fix，基线 5cf186e；主工作树有其他 agent 的未提交修改，未合并、未重启实时服务、未改客户端。
- 实时服务重启后需由主 agent 合并本分支，再按项目流程验收；重启前确认 analysis 中的三份 table dump 存在。
- 105802 是 `req_month_permit_buy_level`（月度战令购买等级，请求 `pb_month_permit_buy_exp_req { tid, buy_num }`），不是领奖；当前实时数据库没有模块 105，且该期活动数据/等级状态未建立，未实现。真正的领奖是 105801/105803/105804，同样缺少模块 105 数据，未伪造奖励。
- 其他未验证福利玩法（钓鱼、助力、节日奖励等）仍保持明确拒绝，不伪造奖励。
