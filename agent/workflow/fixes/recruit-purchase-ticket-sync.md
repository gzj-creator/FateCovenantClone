# 特聘券购买扣钻但券不即显修复

## 现象

用户在特聘招募中花星钻购买招募券，客户端显示星钻已经扣除，但特聘券数量没有立即增加。重连或重登后，服务端持久化数量仍存在。

## 证据与根因

- 2026-10-31T10:11:43.213Z 的真实请求为 type 599 / seq 25，服务端记录 `recruit_committed`，不是购买失败或客户端重复请求。
- 修复前 SQLite 中星钻 `101500=750`、普通券 `2002=4`、特聘券 `3002=8`，特聘购买计数 `daily=4,total=4`。本次购买已经扣钻并给 `3002` 增加 4 张。
- 客户端 `HeroDrawMgr` 的购买回调先执行 `AwardKit.Parse(data.res)`，再执行 `SetMagicDrawBuyInfo(data.buy_info)`。资源回调依赖 `pb_res_change.new_bin` 的完整 `pb_res_obj` 来创建本地资源对象。
- 服务端通用物品发放原先只返回 `tid/new_num/diff_num`，没有 `new_bin`。因此购买事务和 SQLite 写入成功，客户端券对象却无法即时建立或刷新。

## 修复

`grantResources` 对 `handler.kind === 'item'` 的发放结果附带：

```js
new_bin: codec.pack('pb_res_obj', {
  tid: String(id),
  num: String(newNum)
})
```

普通招募券与特聘券购买测试都解码 `new_bin`，并断言 `tid` 和 `num` 等于事务后的实际余额。资源消耗路径没有改动。

## 验证与部署

- 招募定向测试 `19/19` 通过。
- 合并最新 `main@5e354e7` 后，全量服务测试 `271/271` 通过，`git diff --check` 通过。
- 一致备份：`analysis/experiments/private-server-20261025/p3/recruitment-ticket-sync-20261031/game.before-ticket-sync-deploy.local-only.sqlite`，344,064 字节，SHA256 `0975ab1d61aef339900c8d0ecadb074b1ee84b64185636397751328272da9463`，完整性 `ok`。
- 服务已切换到修复 worktree，PID `18688`，五个端口仅监听 `127.0.0.1`，stderr 为空；隔离客户端自动重连并完成包含 146 个模块的登录。

## 尚待真实客户端确认

用户需要确认重连后的特聘券余额显示，并再次购买至少 1 张券，确认星钻扣减与特聘券数量在同一界面立即同步。当前组件与部署验证通过，不能替代真实 UI 验收。

## 2026-10-31 根因纠正与补发

The preceding diagnosis stopped at the missing `new_bin` field and used the wrong ticket name. The shipped contract is `3002=elite (Draw 2)` and `4002=special (Draw 10)`. Type 599 was selecting Draw 2, so it was issuing the wrong resource even after the `new_bin` response fix.

`recruit-service.mjs` now selects library 10 for type 599. The regression test covers purchase, special draw consumption, module-6/login persistence, and rollback; the merged main tree passes 291/291 service tests. The nine historical type-599 purchases were compensated with nine `4002` tickets in an idempotent transaction; the existing `3002` balance was left untouched. The remediation backup and live values are recorded in `agent/workflow/recruitment/implementation.md`.
