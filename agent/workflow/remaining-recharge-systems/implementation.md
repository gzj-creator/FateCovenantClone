# 商城与充值全链路修复

日期：2026-10-31

## 工作版本

- worktree：`.worktree/remaining-recharge-systems`
- branch：`feature/remaining-recharge-systems`
- 业务修复提交：`d08dca9 fix: complete recharge shop flows`
- 合并前的实时服务不能作为本轮修复已部署的证据：进程命令行只有
  `personal-server/local-server.mjs` 相对路径，无法确认加载的是本 worktree。后续部署必须使用本 worktree 的绝对脚本路径。

## 已定位问题

- `97101` 特惠返利领取没有网关路由，会落为未实现命令，所以界面即使显示可领取次数也没有可执行逻辑。
- `16004` 一键购买与 `16005` 礼包购买、限购、重启回填和登录同步没有走同一套订单依据；旧 `307` 分支还可能被网关静默确认，导致客户端等待后续推送或显示服务器错误。
- 普通礼包购买曾只接受少数 `RechargeTable.type`，资源价、余额价、免费礼包和后续新增礼包无法统一持久化。
- `46003` 批量补买需要逐项检查 `is_buy_additionally` 涉及的普通次数；旧逻辑没有把 `tid 2` 与 `tid 5` 作为整笔事务统一校验。
- 礼包只剩部分可买时，前端可能存在“一键购买”入口；服务端需要以完整事务拒绝或完成，不能边提交边失败。

## 实现结果

- 新增 `personal-server/config/wish-treasure-tables.mjs` 与
  `personal-server/game/wish-treasure-service.mjs`。
  - `97101` 按 `awardId = type * 1000 + phase` 校验开放阶段、对应购买窗口和重复领取。
  - 当前配置中 `1013 -> 134817`、`2013 -> 134917`。
  - 领取事务同时写登录模块 `172.rev_list`、秘宝模块 `534` 和 `reward_claims`，重登后保留。
  - 秘宝奖励按同一 tid 单卡合并，重复获得只累加 `chip_num`。
- 网关接入 `97101`，不再返回 `unsupported_command`；购买成功后先推送 `9132` 特惠返利状态，再推送 `1900`。
- `16004` 删除对协议错误 `307` 的静默空 ack；业务失败会明确返回客户端。
- `46003` 批量补买仅检查所有 `is_buy_additionally=true` 的受影响普通次数，且 `tid 2`、`tid 5` 必须同时满足；任一不足则整笔返回 `307`，不扣款、不建单、不发奖、不改模块。
- `16005` 严格解析 `[[is_extra_buy, period, day]]`，普通礼包不再限制为 type 46/76。免费、余额价和资源价礼包统一建 `recharge_orders`、写模块 `19` 并发放完整奖励。
- 周期限购由 `rechargeCycleKey` 和订单历史统一计算；购买结果提供 `period/day_index`，重启后可从订单回填，避免界面次数与服务端不一致。
- 普通现金商品扩展为 `pay_type=0`、正价格、`sync_handle=0`，且所有奖励均有显式处理器；未知奖励仍在扣款前拒绝。
- 百校、宠物、月卡、通行证等专用礼包保留原分支。宠物礼包继续先返回专属 `flag`，不插入通用 `flag 73`，避免客户端库存刷新失效。

## 自动化证据

`npm test --prefix personal-server` 在合并最新 `main` 后通过 **244/244**。新增覆盖包括：

- `1013/2013` 领取、奖励、模块 `172/534`、持久化、重复领取和未开放阶段。
- 网关真实路由 `97101`，以及购买后 `9132` 必须先于 `1900`。
- `46003` 批量补买、普通次数耗尽后的整体回滚。
- 资源价 `16005` 礼包及数据库重开后的限购恢复。
- 重复优惠购买返回协议错误 `307`，不再等待后续 `1900`。
- 所有配置充值奖励都有唯一显式处理器。

测试只证明组件、临时 SQLite 和真实 TCP 网关路径；尚未替代隔离 APK 的点击和重登验收。

## 部署与真机验收边界

- 部署前必须备份实时 `game.local-only.sqlite`、`-wal` 和 `-shm`。
- 合并到 `main` 后，新服务必须从主仓库入口的绝对路径启动，工作目录为项目根目录。
- 启动后核对 `server.local-only.json`、进程命令行、五个 loopback 端口及 ready 日志。
- 用户真机验收：特惠返利可点击并到账，重登后领取次数保持；`16004/16005` 不再服务器错误；日志无 `unsupported_command type=97101`，且购买推送顺序为 `9132 -> 1900`。
- 本轮未修改 APK，不需要创建新的 APK 快照；原版 `com.jzyx.my` 不操作。

## 2026-10-31 合并与部署

- 商城修复提交 `d08dca9`，随后合并最新 `main`；`v10` 待发奖励兼容和显式奖励处理器修复提交为
  `105f2de`，并已快进合入 `main`。
- `main` 全量测试 **248/248 通过**。
- 最终部署前一致备份为
  `analysis/experiments/private-server-20261025/p3/remaining-recharge-20261031-164316/game.before-final-recharge-deploy.local-only.sqlite`，
  SHA256 `13068b3d5bf31879df0b5aed96dc0234a6432f105f7d6a3da5e1f71bc2672b9f`，
  `integrity_check=ok`、`user_version=10`，`pending_rewards` 表存在。
- 初次切换发现实时库已是 `v10`，而分支合并后的存储层只接受 `v9`，新进程拒绝启动；已立即恢复旧主入口，
  将未提交的 `v10` 改动纳入分支并按显式奖励处理器适配后重新验证。
- 最终服务 PID `44160`，工作目录 `F:\projects\FateCovenantClone`，入口为绝对路径
  `F:\projects\FateCovenantClone\personal-server\local-server.mjs`；
  `18880/18881/18882/18883/19090` 均由该进程监听且只监听 `127.0.0.1`，stderr 为 0。
- 最终启动日志、部署结果、失败切换日志及恢复记录位于同目录 `server-final-recharge.*.log`、
  `final-deploy-result.local-only.json` 和 `recovery-main-result.local-only.json`。
- 自动化、真实 TCP、SQLite 重开均通过，但隔离 APK 的“特惠返利可点击/到账、重登保留”和
  “一键购买/礼包购买不再服务器错误”仍需用户实际点击确认，不能仅凭本记录标为真机验收完成。
