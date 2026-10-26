# H1 进入大厅显示服务器错误

状态：组件测试 + 临时 TCP 集成通过，**APK 视觉复验待用户**。2026-10-26 08:45 用户登录后进入大厅时出现一次“服务器错误”提示。

## 证据（真实请求）

- `runtime.local-only.data/events.jsonl` 2026-10-26T00:45:53.451Z：`unsupported_command type=1202 seq=10`，`payloadHead=g2wAAAAGYc9hzmHJYcthzGHNag==`，ETF 解码为 `[207,206,201,203,204,218]`。接口目录 `1202 req_shops_info`：etf → `pb_query_shops_back`。
- 同文件 2026-10-26T00:45:55.718Z：`unsupported_command type=53002 seq=19`，ETF `[1004012]`。接口目录 `53002 req_act_stage_change`：etf → `pb_act_role_stage_change_back`，与已实现空回执的 `53001 req_activity_state_change` 在同一登录序列相邻。
- 两条均以 `err:-1` 返回（客户端 Err 表 `RESERVE_SERVER_BUSY=-1`、`SERVER_ERR=2`、`CONFIG_ERROR=5`），是“进入大厅即弹错误提示”的候选命令；此前每次登录均重复出现。
- `pb_query_shops_back{repeated pb_shop_info shops}`；`pb_shop_info{int32 id, repeated pb_shop_items_group items_groups, int32 version}`；`pb_act_role_stage_change_back{repeated pb_act_role_stage_change change_list}`。

## 实现

- 1202：解析请求中的 shop id，按原 id 返回 `pb_query_shops_back{shops:[{id, items_groups:[], version:0}]}`，纯读取；不生成商品、价格、刷新或购买能力。
- 53002：与 53001 一致返回空变更（空 `change_list`），表示本地账户当前没有服务器侧阶段迁移；日志 `activity_stage_sync_acknowledged`。
- 新增日志事件 `shop_info_sent`；`fight_rejected` 增加 `payloadHead`，便于后续继续定位。

## 边界

- 商店购买（1201/1203/16005）、商品刷新与真实活动阶段推进仍未实现，收到对应变更命令明确返回错误，不伪造奖励或库存。
- 117005（百抽跑马灯）等其余大厅轮询命令仍是 `unsupported_command`，如需再按 payload 定位。
- 若重启后仍弹“服务器错误”，按事件时间取 `unsupported_command`/`fight_rejected` 的 `payloadHead` 继续排查。

## 复现

```powershell
node --test personal-server/test/gameplay-gateway.test.mjs
npm test --prefix personal-server
```

gateway 集成用例使用临时端口与从 `handoff-game.local-only.sqlite` 复制的临时库，验证：1202 以请求 id `[207,206]` 回包且分组为空、53002 空回执无错误、mission_id-only 的 201 正常结算。
