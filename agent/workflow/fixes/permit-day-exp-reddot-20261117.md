# PT1 通行证经验、领取位与新号重置不一致

日期：2026-11-17，部署验证 2026-11-18（Asia/Shanghai）

分支/worktree：`fix/permit-exp-reddot-20261117` / `.worktree/permit-exp-reddot-20261117`

基线提交：`6999752c218d1dc592b28b47fb3dccadab44ce64`

状态：组件、临时 TCP 与部署健康检查通过，APK 真机待用户验收

## 现象与触发

通行证显示没有经验时仍出现可领取状态；领取后红点仍存在。当前账号 1401 在
2026-11-16T15:48:01Z 和 2026-11-17T14:19:11Z 两次执行 35005，分别返回
level=2、levels=[1,2] 和 level=3、levels=[3]，但用户界面仍观察到红点。

另审到新号初始化会从抓包模板继承通行证账号进度，以及空奖励档不会写入领取位，
这些问题会让后续新号重复出现同类状态。

## 证据

- `analysis/incoming/activity-ticket-20261111/expanded/prototypes/13981504185066738000-PermitUtil.lua.prototypes.json`：`PermitUtil.CalcOpenDay` 为 `min(FlushTime.NowDay() - open_day + 1, cycle)`。
- `analysis/incoming/activity-ticket-20261111/expanded/prototypes/5979698041866817000-PermitCycleTypeBase.lua.prototypes.json`：`GetExp` 最终为 `base_exp + _permitData.buy_exp`；`CheckHaveAward` 只检查 `receive_free` / `receive_permit`，不检查奖励数组是否为空。
- `analysis/incoming/activity-ticket-20261111/expanded/prototypes/6398770379544680000-PermitNewMgr.lua.prototypes.json`：`CheckRedDot` 复用 `CheckHaveAward`；1401 的 `one_key_custom_red_dot=0`，未购买账号仍可能显示客户端自己的购买提示红点。
- `analysis/experiments/launch-20261115/server-data-fixed/events.jsonl`：当前账号两次 35005 的等级与已领取列表。
- `analysis/tmp/permit-lua/module38-100002.json`：登录模块 38 的实时账号状态，显示等级 1 至 3 的 `receive_free=true`。
- `personal-server/assets/protobuf/permit.db.proto.bin`：`pb_permit_info` 含 `period`、`open_day`、`is_pay`、`buy_num`、`is_settle`、`levels`、`buy_exp`、`award_idx`、`is_choose`、`is_join_compensate`；`pb_permit_data` 还含两个补偿日字段。
- `agent/workflow/fixes/payment-permit-receive-20261101.md`：既有修复只补齐 35005 路由和真实资源领取；本次是已接通后的经验总式、空奖励领取位和新号重置缺陷，不是同一根因复发。

## 根因

1. `personal-server/game/permit-service.mjs` 的经验计算只返回动态开服日基础值或资源数量，漏加登录数据里的 `buy_exp`，与客户端 `GetExp` 不一致。
2. `claim()` 把领取状态写入错误地绑定在 `free_award.length > 0` / `permit_award.length > 0` 上。客户端领取红点只看领取位；空奖励档因此永远无法完成领取，后续请求也仍会被视为可领取。
3. `personal-server/game/new-account-state.mjs` 的 `resetPermits()` 只覆盖 `open_day`、`levels`、`is_pay`，会保留模板中的 `buy_num` 等账号字段；外层补偿日也没有重置，新号会继承账号进度。

## 修复

按客户端通用语义修改：经验统一为基础经验加 `buy_exp`；达到等级且请求对应轨道时，无论奖励数组是否为空都写入领取位，仅将非空奖励追加到资源发放；新号只保留通行证 id，并显式重置 `pb_permit_info` 和 `pb_permit_data` 的全部账号进度字段。

不按 1401、7106、当前账号或 `open_day=20772` 写特判；不改已核验的日期序号公式，也不伪造 `is_pay=true`。

## 验证

| 级别 | 内容 | 结果 |
| --- | --- | --- |
| 组件测试 | 新增专项覆盖动态经验、资源经验、`buy_exp`、空奖励领取位、全量状态、新号字段重置与重复领取；专项 12/12，相关支付/通行证 35/35；完整 fast 套件 534 项 pass 532 / fail 0 / skipped 2 | 通过 |
| 临时 TCP | `permit-receive.test.mjs` 的真实 loopback 35005/105803 回包、事件与 SQLite 持久化 | 通过 |
| 部署 | 以 `main@20dc167` 从 main 根目录启动 PID `31860`；保留 `FC_SERVER_OPENED_AT=1794690000`，五端口仅监听 loopback，`local_server_ready` 已记录，stderr 为空，管理页 HTTP 200，SQLite `quick_check=ok`；停服前数据备份在 `analysis/experiments/launch-20261115/server-data-fixed/backups/pre-permit-deploy-20261118-084045/` | 通过 |
| APK 真机 | 未改 APK、未操作设备；等待用户重新登录检查领取后红点与新号通行证状态 | 待验收 |

## 防复发

- 新增组件回归，直接断言客户端的 `base_exp + buy_exp` 语义。
- 新增空免费/付费奖励档的领取位与幂等断言，确保 `CheckHaveAward` 的输入状态完整。
- 新号回归同时注入非零 `period/buy_num/is_settle/buy_exp/award_idx/is_choose/is_join_compensate` 与补偿日，断言全部归零。
- 在 `BUG-MEMORY.md` 记录“领取位不能依赖奖励数组非空”“新号必须清空全部通行证账号字段”。

## 未验证项与边界

服务已部署，客户端红点是否消失仍待用户重新登录后做 APK 真机验收；本记录不把部署
健康检查当作可玩验收。购买提示红点来自客户端 `one_key_custom_red_dot` 与 `!HavePay`
的原逻辑；本修复不伪造购买状态，最终是否仍需调整界面表现要在客户端逻辑层面另行确认。
