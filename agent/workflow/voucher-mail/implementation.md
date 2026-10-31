# 代金券邮件与抵扣实现

日期：2026-10-28。工作树：`F:\projects\FateCovenantClone-voucher`，分支 `feature/voucher-mail`。

状态：组件测试 112/112 通过。真实 APK 尚未验收；本文所有“客户端行为”均来自静态协议证据，不能等同于真机接受。

## 目标与方案

管理端通过游戏邮件发送代金券；玩家在游戏内领取后，代金券作为道具进入背包；付款时可以按代金券数量抵扣订单金额。

方案分四层：

1. **管理端发券**：管理页填写账户、面额（元）、有效天数、标题和备注。金额换算为整数分，再按单张面值换算为道具数量。服务端创建一封游戏邮件，并写入发券记录（`voucher_grants`）。
2. **游戏邮件**：登录模块 93 下发 `pb_rev_login_mail_info` 邮件摘要；`3000-3006` 处理一键删除、一键已读、一键领取、已读、领取、删除、详情；新邮件推送 type `900`。领取事务同时把代金券道具加入背包并标记发券记录已领取。
3. **付款抵扣**：原生客户端用 `16004 req_recharge_by_token`，ETF 参数顺序为 `[recharge_id, extra_param_str, item_tid]`。服务端按 `价格 ÷ score_token_rate` 自动计算张数，扣除背包道具 `701500`，写订单与抵扣流水，推送 `1900 res_recharge_success`（带 `is_use_token`、`use_item_tid`），客户端再发 `16003` 确认订单。管理端 `/api/purchase` 另支持按金额部分抵扣。
4. **一致性**：订单、代金券扣减、奖励发放、钱包流水、邮件领取在同一 SQLite 事务内完成；重复请求幂等；余额/券不足、超额抵扣、数据库约束或编码失败全部回滚。

## 协议与配置证据

- 邮件模块：`ModuleTable.data.lua.json` 中 `MailMgr` 为 module 93；`MailMgr.lua.bin` 字符串包含 `pb_rev_login_mail_info` 与 `mail_list`。登录字段按 `pb_rev_login_mail_info { repeated pb_mail_brief mail_list = 1 }` 写入。
- 邮件命令：`Cmd.lua.json` 确认 `one_key_del_mail=3000`、`one_key_read_mail=3001`、`one_key_award_mail=3002`、`read_mail=3003`、`award_mail=3004`、`del_mail=3005`、`req_mail_detail_info=3006`；`rev_new_mail=900`，响应 schema 为 `pb_rev_new_mail_info`。
- 邮件协议：`3353650769729336000-mail.net.proto.bin` 定义 `pb_rev_login_mail_info.mail_list`、`pb_mail_brief`、`pb_rev_new_mail_info`、`pb_rev_award_mail`、`pb_rev_one_key_award_mail`；`12373036208509750000-mail.db.proto.bin` 定义 `pb_mail`（注意 `pb_mail.award` 是 `pb_res_arg`，字段为 `tid/num`，与摘要的 `pb_mail_award.id/count` 不同）。
- 代金券配置：`RechargeTable.data.lua.json` 的 `Param` 第 1 行为 `coupon=701500`、`token_item=601500`、`score_token_rate=1`。
- 支付协议：`9668235657211420000-recharge.net.proto.bin` 的 `res_recharge_success` 含 `is_use_token=9`、`display_id=10`、`use_item_tid=11`；`RechargeMgr.lua.bin` 字符串包含 `req_recharge_by_token`、`GetScoreTokenRate`、`token_item`、`score`、`tokenItemTid`。其字节码 prototype 43（源码约 738-804 行）在 744 行计算 `math.round(price / GetScoreAmountRate())`，在 763 行以 `price / GetScoreTokenRate()` 得到 `priceCoupon`，并与 `CurrencyMgr.GetCoupon()` 的张数比较后调用 `RechargeByToken`；因此客户端按 `price / score_token_rate` 计算所需张数。
- **面值结论**：`score_token_rate=1` 表示 1 张代金券 = 1 分钱。¥6.00 订单需要 600 张，¥1.00 发放面额生成 100 张道具 `701500`。

证据根目录：`analysis/reports/private-client-16448/lua-bundles/candidate/decoded/`。

## 数据模型（SQLite schema v3）

| 表 | 用途 | 关键约束 |
| --- | --- | --- |
| `voucher_skus` | 代金券 SKU：道具 tid、单张面值（分）、标题 | `item_tid` 唯一；默认 `voucher-701500`，面值 1 分 |
| `game_mails` | 邮件正文、有效期、读/领/删状态、附件 JSON | `(role_id,request_id)` 唯一，支持管理端幂等 |
| `voucher_grants` | 每封发券邮件的发放记录与领取时间 | `mail_id` 唯一；`claimed_at` 为空表示待领取 |
| `voucher_redemptions` | 每笔订单的代金券抵扣明细 | `order_id` 主键，保证一单一抵扣 |

迁移名 `voucher-mail-v3`，`PRAGMA user_version=3`；旧 v1/v2 数据库升级只新增表和索引，不改写已有角色、英雄、资源、编队、活动领取数据。

## 服务与接口

### 游戏服务

- `game/voucher-service.mjs`：读取 `RechargeParam`，维护 SKU；`balance()` 按背包 `701500` 数量计算余额；`quote()` 校验抵扣张数与金额；`consume()` 在订单事务内扣券并写 `voucher_redemptions`；`snapshot()` 供管理端汇总。
- `game/mail-service.mjs`：`issueVoucher()` 创建邮件和发券记录；`loginPayload()` 生成 module 93；`claim()`/`claimOneKey()` 发放附件并同步领取状态；过期邮件不可领取但可删除；未领取且未过期的奖励邮件不可删除；`detail()` 按 `pb_mail` 编码（附件使用 `tid/num`）。
- `game/wallet-service.mjs`：`buy()` 新增 `voucher_amount_cents`、`voucher_count`、`voucher_item_tid` 三种入口；订单快照增加 `voucher_quantity`、`voucher_amount_cents`、`balance_paid_cents`；`1900` 推送带代金券标记。
- `game/gateway.mjs`：登录写入 module 93；路由邮件 `3000-3006`；路由原生 `16004`；返回 `mail`、`voucher` 供管理端/测试使用。

### 管理 API

均需 `Authorization: Bearer <管理密钥>`（静态页面除外），仅监听 loopback，并校验 Host/Origin/JSON/请求大小：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/state` | 钱包快照并合并 `vouchers` 快照 |
| GET | `/api/vouchers` | 代金券 SKU、余额、邮件发放记录、抵扣流水、汇总 |
| POST | `/api/vouchers/issue` | 发送代金券邮件；字段 `account_id`、`amount_cents`、`request_id`、`expire_at`、可选 `title/content` |
| POST | `/api/credit` | 管理加款（原有） |
| POST | `/api/purchase` | 余额购买，可带 `voucher_amount_cents` 抵扣（原有扩展） |

管理页新增 4 个指标卡（账户余额、可用代金券、待领取、累计加款）、代金券 Tab（发放表单 + 发放记录）、订单表代金券/余额支付列，以及购买表单的抵扣输入和最大按钮。

## 关键不变量

- 发券请求 `request_id` 幂等：相同内容返回原邮件，不同内容拒绝。
- 领取只能成功一次；领取后 `game_mails.received=1` 且 `voucher_grants.claimed_at` 有值，背包 `701500` 数量与发放数量一致。
- 抵扣数量必须满足 `amount_cents = quantity × face_value_cents`，且不超过订单价格。
- 代金券余额以背包资源 `701500` 为准；发放记录只是账本，不能直接增加余额。
- 订单、扣券、奖励、钱包流水、邮件领取同一事务；任一失败全部回滚。
- 订单 `request_id` 重复且商品或券数量不同则拒绝，不能重复扣券。

## 实施计划与完成情况

| 阶段 | 内容 | 状态 |
| --- | --- | --- |
| M0 | 从 Lua/Protobuf 证据确认模块 93、邮件命令、16004 参数、券面值 | 完成 |
| M1 | SQLite v3 表、索引、迁移与事务回滚 | 完成 |
| M2 | 发券、登录摘要、详情、已读、领取、删除、一键操作、900 推送 | 完成 |
| M3 | 原生 16004 与余额购买抵扣、1900 推送、16003 确认 | 完成 |
| M4 | 管理页代金券 Tab、发放表单、订单列、抵扣预览 | 完成 |
| M5 | 组件/HTTP/真实 TCP 网关测试 | 完成（112/112） |
| M6 | 真实 APK 发券→领取→购买验收 | 待用户执行，未完成 |
| M7 | 断线重连幂等、SDK 代金券参数、多 SKU/多账户 | 后续增强 |

## 验证

```powershell
npm test --prefix personal-server
```

最近结果：`112/112` 通过。新增 `personal-server/test/mail-voucher.test.mjs` 覆盖：

- 发券幂等、登录 module 93 摘要、普通邮件；
- 领取一次、背包 701500 数量、发券记录同步、详情编码；
- 过期邮件不可领取/可删除，未领取未过期不可删除；
- 部分、全额、按张数抵扣及余额支付；
- 券不足、余额不足、超额抵扣、重复订单、数据库触发器、编码失败回滚；
- SQLite 重开后邮件/发放/抵扣/订单一致，`user_version=3` 与完整性检查；
- 管理页静态资源、鉴权、发券、购买与 `/api/state`/`/api/vouchers`；
- 真实 TCP 网关：登录 module 93 → `3002` 一键领取 → `16004` → `1900` → `16003` 确认。

另做了临时 Chrome 视觉烟测（不写入运行库）：1440×1000 桌面和 390×844 手机下代金券 Tab 正常渲染、手机无横向溢出；截图在临时目录，未提交。

## 已知限制

- **未做真实 APK 验收**：以上是组件测试与本地 TCP 回放，不代表真实客户端已接受 module 93、邮件命令和 16004。
- 原生 16004 的 `request_id` 由 `native:<连接UUID>:<seq>` 生成；断线重连后客户端若重发同一笔购买，服务端无法识别为同一请求，可能生成新订单。真实客户端是否会自动重发尚未验证；后续可在 `16004` 前增加按账户/商品/短时间窗的去重，或读取订单号回执。
- 当前只有一个 SKU（`701500`，单张 1 分）。若后续要发行不同面值道具，需要扩展 `voucher_skus` 与客户端配置；不能假设客户端认识新 tid。
- 管理端是单账户本地管理页（`local-1`），不是多账户后台；发券记录最多显示最近 100 条。
- 邮件过期只做“不可领取/可删除”，没有实现配置表的过期转化奖励；`900` 推送只带空 changes，客户端可能需要重新拉取邮件模块或下次登录刷新。
- 管理端 `POST /api/purchase` 的代金券抵扣依赖背包已有券；正常流程必须先让玩家在游戏内领取邮件。

## 变更文件

- `personal-server/game/voucher-service.mjs`（新增）
- `personal-server/game/mail-service.mjs`（新增）
- `personal-server/game/wallet-service.mjs`
- `personal-server/game/gateway.mjs`
- `personal-server/storage/game-store.mjs`
- `personal-server/config/game-tables.mjs`
- `personal-server/local-server.mjs`
- `personal-server/admin/server.mjs`、`index.html`、`admin.js`、`admin.css`
- `personal-server/test/mail-voucher.test.mjs`（新增）
- `personal-server/test/hero-progression.test.mjs`（迁移数量断言 2→3）

## 2026-10-28 ??????????????

- ???????68?? ????????? errCode=5????????????????????????
- ???
  1. RechargeTable ?????? 1300071 ? type=130 ? reward_tid=[]?? wallet-service.supported() ??? 1/43/81?? wallet.buy ? GameError(5)?????????????????
  2. res_recharge_success.get_token ???? false?extra_params ?????? RechargeMgr ?? get_token=true ? use_item_tid == CurrencyMgr.GetCouponItem() ?? extra_params[1] ?? totalAmount?????????????
- ???
  - personal-server/game/month-permit-service.mjs?? MonthPermitTable.Gear.version ? ActFrameTable.Act.version ????????? 1004012/version 5/gear 42/recharge 1300071??? 1300071 ?? module 183 ? pb_month_permit_info.pay_list??? res_recharge_success.extra_ret_list ?? {flag:116, data: pb_month_permit_info}???????
  - wallet-service.mjs??? type=130??????? get_token=true?extra_params ? ETF [product.price]?extra_ret_list ?????? handoff?
  - game-tables.mjs??? MonthPermitTable.Gear/Cycle ? ActFrameTable.Act/ActType?
  - mail-service.mjs??? tid ?? 11400?MailTable ?????????????????
- ???npm test 116/116 ????? month-permit-voucher.test.mjs ?????/?????flag116?pay_list ????????????????????????? SQLite ???? 1300071 ??????36 ???????? 1004012 ????? 35 ???????? 10000?3200?
- ????? APK ?? ?68 ?????????????????????

## 2026-10-31 代金券 1 元面值与累充修复（真实客户端部分验收）

本轮把代金券口径从“1 张 = 1 分”改为“1 张 = 1 元”，同时修正客户端支付确认文案和累充行为。

### 实现

- `personal-server/game/voucher-service.mjs` 固定 `FACE_VALUE_CENTS=100`；启动时把现有 `voucher_skus` 与 `voucher_grants` 的旧 1 分口径升级为 100 分。`¥6` 商品完整用券时扣 6 张。
- 钱包仍按商品原价累计充值。`wallet-service.mjs` 的 `res_recharge_login.total_amount` 增加 `product.price`，与实付余额和代金券抵扣比例无关；该行为已由普通商品、月卡和 type 46 钻石充值测试覆盖。
- 客户端 `RechargeTable.data.lua.json` 的 `score_token_rate` 从 `1` 改为 `100`，使原生 Lua 按 `价格 ÷ 100` 计算所需券数。
- 语言包同时修改了两套支付提示，避免不同路由继续显示旧文案：
  - `200009={0}不足，请补充后再试`
  - `1477=您当前拥有<color=#d19c27>{0}</color>礼券，本次购买将消耗<color=#d19c27>{1}</color>礼券，购买<color=#d19c27>{2}</color>后剩余<color=#d19c27>{3}</color>礼券，<color=#2F9A7D>消耗代金券计入累充</color>，是否确认？`
  - `2405=您拥有<color=#d19c27>{0}</color>代金券，本次消耗<color=#d19c27>{1}</color>张，购买<color=#d19c27>{2}</color>后剩余<color=#d19c27>{3}</color>张，本次消费计入累计充值，确认？`
- Web 管理页显示 `1 张 = ¥1.00`，默认发放 1 张，并明确“使用代金券的订单按商品原价计入累充”。
- APK 构建器现在同时替换 DEX、Lua 表和语言包。`forward6` 额外修正了单笔礼包按钮进入正常充值流程。

### 邮件发放与领取

通过 Web 管理 API 发放游戏邮件：

| 字段 | 值 |
| --- | --- |
| request_id | `voucher-1m-20261031` |
| mail_id | `2` |
| 标题 | `百万代金券到账` |
| 正文 | `已发放 1,000,000 张代金券，每张可抵扣 1 元。` |
| 数量 | `1,000,000` 张 |
| 面值 | `100` 分/张 |
| 总面值 | `100,000,000` 分（¥1,000,000） |
| 有效期 | 永不过期 |

真实客户端已完成邮件读取和领取。服务日志在 `2026-10-30T23:53:02.390Z` 记录 `3003 read_mail`，在 `23:53:06.792Z` 记录 `3004 award_mail`；SQLite 中 `game_mails.received=1`、`voucher_grants.claimed_at=2026-10-30T23:53:06.804Z`，代金券资源 `701500` 从 400 张增加到 `1,000,400` 张。

### 部署与验收证据

- 最新服务 PID 以 `analysis/experiments/private-server-20261025/p3/runtime.local-only.data/server.local-only.json` 为准；本轮核对为 PID `7256`，五个端口 `18880/18881/18882/18883/19090` 正常启动，SQLite schema v7、`integrity_check=ok`。
- 当前设备包为 `analysis/experiments/private-server-20261025/p3/isolated-voucher-1yuan-onkey-recharge-forward6-20261031/com.jzyx.ps.signed.apk`，4,185,758,901 字节，SHA256 `ae08340adf9faab19402567c5f4e92fae7bb7ceea52ab1ac21400c3128363bf5`；设备 `base.apk` 复算 SHA256 相同，v1/v2/v3 签名和 alignment 已验证。
- 设备安装后分配 UID `10045`，四个 ADB reverse 与 BPF 隔离均已按新 UID 重建；只使用 `127.0.0.1:16448`，未操作原版 `com.jzyx.my`。
- 测试：代金券与月卡专项 `16/16` 通过；全量测试在 `docs/07-private-server-feature-execution-plan.md` 记录为 `189/189`。专项覆盖真实 TCP `3002` 一键领取、`16004` 用券支付、`1900` 成功推送与 `16003` 确认，以及普通商品/月卡/type 46 的整单累充。
- 真实客户端已到达服务器选择页、完成本机 SDK 登录、进入大厅和充值商店；截图与日志位于 `isolated-voucher-1yuan-onkey-recharge-forward6-20261031/`，汇总见 `runtime-verification.json`。

### 真实支付、限额同步与 APK 验收（2026-10-31 完成）

- 真实客户端已完成 46003 一键购买：订单 local-6ff68d6d-927e-4761-a4bc-e4480d251e02，原价 900 分，消耗 9 张 ¥1 代金券，16004、1900、16003 链路成功，最终 acknowledged=1；星钻界面从 930 增至 1050。
- 代金券库存从 1,000,400 降至 1,000,391；使用代金券的订单按商品原价计入累充，支付提示已明确“消耗代金券计入累充”。
- 后续发现 46003 的 DailyDiscountRecharge.batch_update=[2,5] 未同步，导致 module 108 只把行 6 标记已购。现已改为同一事务应用批量依赖、重启按订单回填，并在代金券余额检查前先做限购预检。直接购买 40009、46002 或再次购买 46003 均返回 307 且不扣款。
- 新增钱包与真实 TCP 回归测试，完整 npm test --prefix personal-server 为 192/192 通过。运行库启动回填后行 6、2、5 均为 buy_times=1，schema v7、integrity_check=ok。
- 当前 APK 已固化为 apk/com.jzyx.ps.v9-working.apk，大小 4,185,758,901 字节，SHA256 1fd5fe0a2e18e9add821efb6c404d9464b5e3609be0e8af605d47bada441b473；v1/v2/v3 签名和安装副本哈希均已验证。
- 服务最新 PID 以 runtime.local-only.data/server.local-only.json 为准；本轮部署为 PID 8100。客户端自动重连并完成 145 模块登录，商店卡片视觉状态留待用户下次打开确认。
