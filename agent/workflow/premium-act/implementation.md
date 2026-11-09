# 白绫现世礼包商店实现记录

## 范围

- 日期：2026-11-08
- Worktree：`F:\projects\FateCovenantClone\.worktree\premium-gift-shop-20261108`
- 分支：`fix/premium-gift-shop-20261108`
- 目标活动：`1841010`（`ActFrame` 类型 `184`，`PremiumActMgr` 付费商城）
- 本轮修改个人服务器代码、配置、测试和实现记录，并对本机实时服务做了带一致性备份的重启；未操作模拟器、ADB 或 APK。

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

## 部署与实时登录证据

- 重启前使用 `VACUUM INTO` 生成一致备份：`analysis/experiments/private-server-20261025/p3/premium-act-20261108/game.before-deploy.local-only.sqlite`，1,417,216 字节，SHA256 `16BC950B4FA18D41D5364A159E96FA6CC8B0352E62AE601A1496BFEEFF0F9402`，schema v18，`PRAGMA integrity_check=ok`，角色 1、登录模块 145。
- 新服务 PID `42156`，启动时间 `2026-11-08T13:48:51.878Z`，五个端口仍全部仅监听 loopback；stderr 为空。
- 客户端自动重连并完成登录；实时事件 `premium_act_login_synced` 的 `actIds` 包含 `1841010`，其 `gifts` 为 `1270973..1270982` 的 10 个礼包。`activity_login_calendar_applied` 的 `premiumActivityIds` 也包含 `1841010`，随后 `login_sent` 返回 145 个模块。
- 服务端登录数据、礼包购买和限购链路已由测试覆盖；仍待用户打开白绫现世礼包页确认列表、价格和点击后的视觉效果。

## 2026-11-09 卡片对对碰礼包售罄刷新修复

- Worktree：`F:\projects\FateCovenantClone\.worktree\matching-gift-soldout-20261109`
- 分支：`fix/matching-gift-soldout-20261109`
- 现象：`184401` 的 98 元卡片对对碰礼包购买成功、服务端限购计数也已写入，但客户端内存中的购买状态没有更新，通常要重新登录后才显示售罄。
- 根因：客户端活动礼包管理器把数字活动 ID 作为 `16004`/`16005` 的 `extra_param` 发出，并在充值成功事件中从回包 `extra_params` 取回该 ID；旧服务端只把该数字当作 `activity_version`，回包又使用普通每日折扣的三元组，因此客户端无法定位本次购买所属的活动。

修复内容：

- `PremiumActService` 的礼包配置、可购检查和限购计数接受显式 `activityId`。同一个 `RechargeTable` SKU 被多个开放活动共享、而请求没有携带活动 ID 时明确拒绝，避免把购买金额串记到错误活动。
- `PetActivityService` 采用同样的显式活动 ID 规则，并新增运行状态查询，供现金商品列表只展示当前活动可购买的宠物礼包。
- `gateway.mjs` 把 `16004` 的数字活动参数同时解析为 `activity_id` 和 `activity_version`；`wallet-service.mjs` 在 Premium、Pet 和其他活动礼包的 `res_recharge_success.extra_params` 中回传数字活动 ID，使客户端无需重登即可刷新内存限购状态。每日折扣继续使用原来的 `[additional, period, day]` 三元组上下文。
- `welfare-service.mjs` 的 `16005` 路径接受数字活动 ID，覆盖 Premium、Pet 和组队购买礼包等由客户端 `RechargeOrBuyGift` 定位活动 ID 的礼包。
- 组队购买礼包使用数字活动 ID 后不再把 `buy_cycle_limit=5` 误解为体力周期；真实网关测试改为发送客户端实际使用的数字参数。

同类管理器审计：

- 客户端字节码确认 `PremiumActMgr`、`PetActGiftMgr`、`GroupBuyActGiftMgr`、`SummerActMgr`、`TowerActMgr`、`ArtifactDrawActMgr`、`HeroRareActMgr`、`GiftActMgr`、`HeroDownActMgr` 和 `AppearanceReleaseActGiftMgr` 都从 `extraParams` 定位活动 ID，统一由数字活动 ID 原样回传的规则覆盖。
- `DailyDiscount`、`WishTree`、`WeekHunt` 和 `RecommendGift` 继续使用三元组或自身 protobuf 更新上下文，未改为数字回传。
- `HeroDraw` 通过 `flag 92` 的 protobuf 更新，不属于本根因。`TriggerGift`、`HoardWheel`、`BuySkinAct` 等服务端尚未完整实现的活动不伪造购买成功；客户端事件语义相同不等于服务端活动已经支持。

验证：

- `node --test test/premium-act.test.mjs`：5/5 通过，包含同一个共享 SKU 在两个卡片对对碰活动中分别计入 1 次并返回各自活动 ID。
- `node --test test/pet-activity.test.mjs`：4/4 通过，包含共享宠物礼包按活动隔离库存、限购和充值刷新。
- `node --test test/group-buy-act-service.test.mjs`：7/7 通过，包含真实临时 TCP 网关的 `16005` 购买。
- `node --test test/wallet-service.test.mjs`：24/24 通过，包含每日折扣、周猎、心愿树和数字活动 ID 回包回归。
- 全量 `npm test`：2788 项，`pass 2786`、`fail 0`、`skipped 2`、`cancelled 0`、`todo 0`，耗时 461151.4994 ms；日志为 `F:\projects\FateCovenantClone\analysis\test-runs\premium-act-20261109\matching-gift-soldout-full.log`。
- 修改文件通过 `node --check`，`git diff --check` 通过。
- 本轮未启停实时服务、未读写运行数据库、未操作模拟器/ADB/APK，不构成 APK 验收，也没有新增可用 APK 快照。
