# ROLE-SKIN 实现记录

日期：2026-11-08。分支：`feat/block-j-role-support`。范围：J 块 #274。

## 状态

服务端表驱动实现完成，显式 ETF 兑换路径可用；真实客户端 UI 兑换链存在协议缺口，因此不是客户端闭环。未做 APK 验收。

## 客户端证据

- `SkinCmd.lua`：76004 `req_choose_exchange_skin` 与 76005 `req_exchange_skin` 都使用 `EncodeErl`。
- `SkinDrawMgr.lua`：76004 由 `Seq:Send` 发出，没有回调；76005 同样没有回调，但成功时客户端会处理 `pb_res_to_client` 奖励变化。
- `SkinMgr.lua` 的 `SetChooseExchangeSkin` 只写客户端本地 Storage，不发 76004。`SkinDrawMgr` 的兑换动作先无参数调用 `SetChooseExchangeSkin(tid)`，随后调用无参数 `ReqExchangeSkin()`。因此真实 UI 的 76005 是空请求。
- 全 bundle 的业务代码没有发现调用 `req_choose_exchange_skin`。
- `SkinTable.data.lua`：皮肤 100712 兑换价为 `2701900 x1`，基础分 360、图鉴行 4；强化 60001–60005 的消耗为 `628002 x3/6/9/12/15`。

## 实现

- 76003 按真实皮肤表校验英雄和拥有状态后穿戴。
- 76004 接受显式皮肤 ID，记录待兑换选择；成功不回包。
- 76005 保留显式皮肤 ID 的兑换能力，扣真实兑换道具并授予皮肤、回 `pb_res_to_client`。空 76005 明确返回 err 1，不根据 pending、唯一未拥有皮肤或其他猜测选择目标。
- 76007/76008 按 `SkinHandbookShow` 与真实分数生成图鉴；76009 按 `SkinIncrease` 扣除真实资源，最多 5 级。
- 76009 同时更新 SQLite 与登录模块 65 的 `increase_level`。仅存在于模块 65 的客户端已拥有皮肤也可强化，数量保持不变；关门重开 SQLite 后再次登录仍能读到正确等级。

## 验证

- 服务专项覆盖未知皮肤、improper ETF、重复选择、显式兑换、真实扣费、穿戴、5 级强化、图鉴和 SQLite 重开。
- 临时 loopback TCP 验证空 76005 返回 err 1；紧接着发送 76004 proper ETF 和显式 76005 proper ETF，收到扣 1 个 2701900、加 1 个 100712 的 `pb_res_to_client`。
- 专项 13/13 通过；真实 loopback TCP 还覆盖 76009 扣 3 个 628002、服务重开后模块 65 等级保持 1。
- 合并最新 main 后全量 `npm test`：2734 项，pass 2732、fail 0、skipped 2；日志 `analysis/test-runs/gameplay-20261106/block-j-after-main-full.log`。

## 缺口

- 真实客户端 UI 从不发送 76004，并发送空 76005；当前服务端无法从该 UI 完成兑换。需要客户端侧补正、原服抓包或可验证的兼容规则，不能用本地猜测补洞。
- 未做 APK 实机验收。
