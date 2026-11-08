# 白绫现世礼包商店实现记录

## 范围

- 日期：2026-11-08
- Worktree：`F:\projects\FateCovenantClone\.worktree\premium-gift-shop-20261108`
- 分支：`fix/premium-gift-shop-20261108`
- 目标活动：`1841010`（`ActFrame` 类型 `184`，`PremiumActMgr` 付费商城）
- 本轮只修改个人服务器代码、配置和测试；未操作实时服务、运行数据库、模拟器、ADB 或 APK。

## 现象与根因

- 白绫百抽活动 `1102010` 同期有一个独立的付费商城活动 `1841010`（`type=184`）。商城主界面能打开，但“现世礼包”列表为空。
- `activity-calendar.mjs` 在 `all-open` 模式下已经能从父活动批次补出 `1841010` 的 player/server 行；但该 player 行的 `module_login_data` 仍为空。
- 客户端 `PremiumActData:_ParseDataImpl` 会解码 `pb_premium_act`，再按 `act_tid` 从 `recharge_list` 中查找当前活动。缺少这个 block 时活动数据为 nil，`PremiumActMgr:GetShowGiftList` 只能返回空列表。
- `PremiumActTable.data.lua` 中版本 `1002` 有 10 个白绫礼包；旧模块 183 里已有的类型 184 行包含过最小 `pb_premium_act` block，`1841010` 没有同步生成。

## 修复内容

- 新增 `personal-server/assets/tables/PremiumActTable.data.lua.json.gz`，读取 `Version`、`Config`、`Free`、`GiftShopShow` 四族行，并在加载时校验行数：`Version=110`、`Config=852`、`Free=72`、`GiftShopShow=5`。版本 `1002` 必须恰好有 10 个礼包。
- 新增 `personal-server/game/premium-act-service.mjs`：登录时扫描开放的 `ActFrame` 类型 184 活动，为 player 行写入或更新 ETF 包装的 `pb_premium_act` block。block 内包含 `act_tid`、`recharge_info.refresh_time`、从 `activity_purchases` 汇总的 `buy_num_list` 和空 `free_get_list`；重复登录会更新已有 block，不会重复插入。
- 新增 `personal-server/config/premium-act-tables.mjs` 负责表资产读取和索引；礼包通过 `PremiumActTable.Config.gift` 关联 `RechargeTable.type=128`。
- `wallet-service.mjs` 接入类型 128 礼包：免费礼包和资源礼包走 `16005`，现金礼包走 `16004` 的原生支付链路；购买次数写入 `activity_purchases`，返回 `flag 114` 的 `pb_recharge_limit_info`。
- `welfare-service.mjs` 对 PremiumAct 的 `16005` 请求使用默认的 `[false, 0, 0]` 上下文；该类礼包不使用百派/每日折扣的周期元组。
- 登录日志新增 `premiumActivityIds`，便于确认 `1841010` 是否进入本次活动登录同步。

## 配置边界

- 版本 `1002` 的 `PremiumActTable.Free` 没有行，因此白绫商城没有 `105401` 免费档位领取；`benefit-commerce-service.mjs` 对 `105401` 的 `PAY-PREMIUMACT` 明确拒绝保持原样，这是已记录的覆盖边界，不应伪造免费档位。
- 本轮使用 `PremiumActTable` 的礼包配置和 `RechargeTable` 的真实奖励/价格；不把客户端资源打包进 APK。

## 验证

- 新增 `personal-server/test/premium-act.test.mjs`，覆盖表内容、登录 `pb_premium_act` block、免费/资源/现金礼包、购买次数与限购、`schedule` 模式下活动关闭时拒绝。
- 定向 `node --test test/premium-act.test.mjs`：3/3 通过。
- 关联回归 `activity-calendar`、`wallet-service`、`welfare-service`、`pet-activity`、`benefit-commerce-gateway`、`gameplay-gateway`：56/56 通过。
- 合并最新 `main` 后全量 `npm test`：2756 项，2754 通过、0 失败、2 跳过；日志为 `analysis/test-runs/premium-act-20261108-full.log`。
- 修改和新增的 `.mjs` 均通过 `node --check`，`git diff --check` 通过。

## 待验收

- 服务端登录数据和购买链路已由测试覆盖；仍需用户在真实客户端打开白绫现世礼包页确认列表和价格显示。
- 当前没有启动、重启或写入实时服务数据库；部署前应使用运行库一致性备份，再重启服务并检查登录日志中的 `premiumActivityIds` 包含 `1841010`。
