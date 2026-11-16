# Bug 记忆与防复发清单

更新时间：2026-11-16（Asia/Shanghai）

用户 2026-11-16 持久规则：**每个修过的 bug 都要记进持久记忆，之后不允许再犯同类错误。** 本文件是修复入口和防复发清单；逐项证据仍写在 `agent/workflow/fixes/` 下的单独文档里。

## 每次修复的必做流程

1. **开工前**：先读本清单和 `agent/workflow/fixes/README.md`，按症状、命令号、模块号、活动 ID 搜索 `rg -n "关键词" agent/workflow/fixes docs`。已有结论优先复用证据；不能凭印象否定旧结论。
2. **定位时**：用真实证据确认触发路径（`events.jsonl`、抓包、客户端 Lua/表资产、只读数据库），记录请求 type、seq、时间和旧响应。禁止只按命令名或旧文档猜行为。
3. **修复时**：同类问题要一次性审计全部调用点，不只修用户当前点到的入口。
4. **完成后**：在 `agent/workflow/fixes/` 新建或更新记录，按 [TEMPLATE.md](TEMPLATE.md) 至少写清：
   - 现象与触发（用户操作、请求 type/seq、时间）
   - 证据路径（日志、抓包、Lua/表资产、数据库只读核对）
   - 根因（具体到代码行、字段或时序，不写“配置问题”这类空话）
   - 修复内容与影响范围
   - 验证等级：组件、临时 TCP、部署、APK 真机，分别写明
   - 防复发措施：新增的测试、断言、校验或不变量
   - 未验证项和已知边界
5. **同步索引**：更新 `agent/workflow/fixes/README.md` 表格；若产生新的错误类别，追加到本文件“防复发清单”。
6. **复发处理**：同一根因第二次出现时，先写复发复盘（为什么上一条记录和测试没拦住），补上能抓住它的测试或断言，再改代码。禁止只改代码不补记忆。

**没有记录、没有索引、没有防复发措施的修复，视为未完成。**

## 防复发清单

### 1. 客户端数据契约

- 登录模块编号按客户端 `ModuleTable` 查证：星火是模块 107，不是 100；模块号写错时客户端读到空字节并显示未激活。[destiny-star-regression-handoff.md](destiny-star-regression-handoff.md)
- 模块 92、183 的 `module_login_data` 必须用 `0x836d + uint32BE length + protobuf` 包装，客户端会再执行 `Codec.DecodeErl`；写入裸 protobuf 会导致活动空白或静默失败。[hundred-draw-spirit-star-20261111.md](hundred-draw-spirit-star-20261111.md)
- 资源发放的 `pb_res_change` 要带完整 `pb_res_obj` 的 `new_bin`，否则服务端已扣款发券，客户端券对象仍不刷新。[recruit-purchase-ticket-sync.md](recruit-purchase-ticket-sync.md)
- `snapshot_val` 按客户端 `CalcItemState` 的语义填写，不能把当前 `mission_id` 直接当快照值。[linear-task-snapshot.md](linear-task-snapshot.md)

### 2. 事务与持久化

- SQLite 权威表与登录模块快照必须在同一事务里重建；写回前先 materialize 派生模块，避免旧快照反复覆盖新数据（模块 10 招募问题）。[recruit-first-hero-ownership.md](recruit-first-hero-ownership.md)
- 发奖、领取位、模块写回、订单记录放在同一事务；编码或数据库失败整体回滚。通知推送失败不回滚已提交订单。[wallet-balance.md](wallet-balance.md)

### 3. 校验顺序与错误码

- 限购、活动限购、日折扣状态检查放在余额检查之前，否则余额不足 301 会盖住限购 307，客户端收到错误提示。[purchase-limit-error.md](purchase-limit-error.md)
- 明确区分用户输入错误、已达上限和服务端缺口；不要把不同原因都返回同一个 code 5。

### 4. 活动读取与生命周期

- 客户端会遍历探测未开放活动；读取接口（107703、104801 等）应返回空状态或关闭标志，不能抛全局“配置出错”。[entry-display-config-error-20261111.md](entry-display-config-error-20261111.md)、[act-shop-20261112.md](act-shop-20261112.md)
- 同一活动可能存在新旧两代 ID/type（20001 与 1102 都指向百抽），版本表要做代际映射，不能只接受新 type。[activity-ticket-audit-20261111.md](activity-ticket-audit-20261111.md)
- 世界时间活动按“目标服开服 + (world_time - 参考服开服)”换算；同一行同时有明确 `world_time` 和默认 `refer_day/server_day` 时以 `world_time` 为准。[activity-relative-time-20261111.md](activity-relative-time-20261111.md)
- 登录模块 1 第 5 项 `ServerInfo.OpenTime` 使用活动日历的开服时间，不能用角色 `createdAt`；区服列表的 `release_time/show_time/open_time` 必须同一基准，不允许隐式回退 `now - 1`。[sprint-claim-expired.md](sprint-claim-expired.md)
- 附加账本（Week Hunt、希望树返利）在活动关闭或周期结束时只跳过记账，不能否决仍在开放的主购买。[limited-recruit-gift-week-hunt-20261110.md](limited-recruit-gift-week-hunt-20261110.md)、[wish-tree-rebate-cycle-20261108.md](wish-tree-rebate-cycle-20261108.md)
- 客户端会定时轮询的读取命令不是预留接口；缺实现时返回真实聚合或空状态，不能无条件拒绝（105702 全服活跃值）。[activity-server-vitality-20261111.md](activity-server-vitality-20261111.md)

### 5. 活动版本与奖励

- 版本号、活动 ID、表 tid 是不同概念：31053 的参数是版本，31052.ids 是 `UpStarGift.tid`；`gift=0` 才是免费任务奖励，`gift>0` 必须走 RechargeMgr。[up-star-gift-20261111.md](up-star-gift-20261111.md)
- 发奖前核对静态表与 `award_bin`，按真实英雄/魔灵/精灵养成数据判断达标，不能只看活动行是否存在。

### 6. 网关与命令

- 用户报“服务器错误”时先查 `events.jsonl` 的真实 type/seq 和旧响应；`unsupported_command` 通常只是缺 handler，不能凭界面猜接口（2001 头像排行）。[avatar-rank-info.md](avatar-rank-info.md)
- 新 handler 按 `agent/workflow/interface-catalog/` 的 schema 解码请求，字段名和类型以协议和客户端 Lua 为准。

### 7. 验证与发布

- 组件测试、临时 TCP、部署、APK 真机是四个不同等级；记录里必须写清哪一级通过，不能把组件通过写成可玩验收。
- APK 修改前先备份当前可用包并核对 SHA256；验收通过后更新 `apk/README.md`；未验收构建不得标“可用快照”。
- 操作实时服务、运行库或设备前先读当前状态文件和进程，不继承旧 PID、旧路径和旧通过数字。

### 8. 文档与基线

- R1 是唯一规则基线；旧规划、旧 defaults、旧调查建议和导出副本 `FateCovenantClone-main/` 都不能覆盖 R1 或冒充现行源码。
- 新证据改变推定必须升级 R 版本，不混改已冻结实例。

## 记录索引

全部修复条目及结论见 [README.md](README.md)。新增条目时按“编号、故障、文档、当前结论”补一行；编号取下一个未使用的字母/数字组合，不重复使用。
