# 限时活动月度战令购买修复

## Worktree

- 路径：`F:\\projects\\FateCovenantClone\\.worktree\\monthly-pass-purchase-fix-20261101`
- 分支：`fix/monthly-pass-purchase-20261101`
- 基线：`main` / `0184cdc`

## 根因

高级档商品 `1300071` 至 `1300074` 的原购买链路本来可用。2026-11-01 的 `1300072` 真实购买已成功扣现代金券，生成订单并通过 1900/flag 116 回填 `pay_list`。那次购买后本地服务进程退出造成断线，不能归因于高级档购买失败。

无法购买的是界面的“购买战令等级”操作。客户端发送 `105802` / `req_month_permit_buy_level`，请求解码为：

```text
tid = 1004012
buy_num = 1
```

旧网关没有处理 `105802`，最终返回 `unsupported_command` 和 `LOCAL_NOT_IMPLEMENTED`，因此客户端无法获得 `pb_month_permit_buy_level_back`。

## 修改

- `personal-server/config/game-tables.mjs`：加载 `MonthPermitTable.UpLv` 和 `BuyExp`。
- `personal-server/game/resources.mjs`：为月度战令经验资源类型 `4200:ItemBase` 注册模块 6 的普通 `ItemRes` 容器。
- `personal-server/game/month-permit-service.mjs`：新增 `buyLevel`，校验活动、配置、购买数量和 30 级上限，原子扣费、增加经验并持久化 `buy_exp_num`。
- `personal-server/game/gateway.mjs`：路由 `105802`，解码 `pb_month_permit_buy_exp_req`，事务内调用服务并返回 `pb_month_permit_buy_level_back`。
- `personal-server/test/month-permit-buy-level.test.mjs`：覆盖服务、SQLite 重启、边界和真实 TCP 网关。

## 协议与业务规则

- 请求：`pb_month_permit_buy_exp_req { tid: uint64, buy_num: uint64 }`
- 回包：`pb_month_permit_buy_level_back { buy_exp_num: uint64, res: pb_res_to_client }`
- 活动 `1004012` 使用 `ActFrameAct.version=5`。
- Cycle 5：`buy_exp_lib=2`、`up_lv_lib=2`、`buy_max_lv=30`、`exp_item=10004200`。
- BuyExp lib 2 的单次配置：`add_exp=1000`、`buy_exp_price=101500`、`buy_exp_price_num=3000`。
- 每次购买增加 1000 战令经验，消耗 3000 个物品 `101500`。
- `buy_exp_num` 按累计购买经验增加。
- 当前经验加本次购买经验不能超过 UpLv 中 30 级阈值 30000；越级、已到上限或余额不足均在扣费前拒绝。
- 扣费、经验变更和模块 183 的 `month_permit_data.month_permit_list[].buy_exp_num` 在同一个 SQLite 事务中提交或回滚。

## 验证

聚焦命令：

```powershell
node --test test/permit-feedback.test.mjs test/month-permit-voucher.test.mjs test/permit-purchase.test.mjs test/month-permit-buy-level.test.mjs
```

结果：16/16 通过。真实 TCP 测试确认 `105802` 不再进入 `unsupported_command`，并能解码回包、扣除 3000、增加 1000 经验及持久化 `buy_exp_num`。

完整命令：

```powershell
npm test
```

结果：523/523 通过，0 失败。

## 验收边界

- 服务层和真实 TCP 协议已通过组件测试。
- 合并后的主工作树服务已重启，PID `1080`，启动时间 `2026-11-01T02:59:29+08:00`；`18880/18881/18882/18883/19090` 五个端口均已确认可连接。
- 服务启动后隔离客户端已自动重新握手并完成 `909103` 登录初始化，日志位于 `runtime.local-only.data/server-monthly-pass-20261101-025927.local-only.out.log`。
- 尚未在正在运行的实际客户端中由用户点击验证“购买战令等级”的视觉效果、升级动画和领奖联动。
- 本次没有 APK 二进制变更，因此不产生新的 APK 可用快照。
- 实机验证前需要运行包含本修复的本地服务，并保留隔离客户端 `SubDownloadFinish=1` 前置条件。

## 遗留风险

- 本次只实现购买经验/等级；战令 30 级后的普通任务经验、领奖和其他战令命令仍按各自现有能力处理。
- 客户端购买按钮的额度提示仍由客户端自身依据等级和表格刷新；服务端已强制相同上限，越级请求会返回 307。
