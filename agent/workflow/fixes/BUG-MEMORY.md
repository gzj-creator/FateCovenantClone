# Bug 记忆与防复发清单

更新时间：2026-11-18（Asia/Shanghai）

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
- Type 1085 梦中小屋必须按 `ServerInfo.OpenTime` 推导的开服天数判断：新区第 8 天起、老服世界时间期第 29 天起；不能按绝对公历日或旧 `refer_day=1` 行决定入口。新区只选择当前已到达的最新第 8/15/22 天代际，00:00—05:00 间隙不回退旧版本。[dream-house-schedule-login-20261118.md](dream-house-schedule-login-20261118.md)
- 2026-11-18 已由 `main@4e6f8ad` 部署并通过新进程、五端口、管理页、SQLite 和客户端启动检查；第 4 天登录隐藏 1085、第 8 天入口阶段和 `11502` 每日登录领奖仍须真机确认。[D1](dream-house-schedule-login-20261118.md)
- ActFrame 的非空 `stage/stage_duration_day/stage_end_time` 必须按原 `GetStageTime` 的数组顺序和阶段 ID 比较生成窗口，并让登录 `stage_time_list`、持久实例和 scheduler 共用同一结果；不完整数组 fail closed。[dream-house-schedule-login-20261118.md](dream-house-schedule-login-20261118.md)
- `TaskType=1803` 是活动内“每日登录游戏”，与选英雄、选宠物、试炼战报等局部选择无关。客户端显示“奖励已过期”可能只是服务端 `311 任务未完成` 的文案映射，先核 1803 进度语义，不要用放开领奖时限掩盖。[dream-house-schedule-login-20261118.md](dream-house-schedule-login-20261118.md)
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
- ADB/iptables 恢复必须对“已经没有目标资源”幂等；对已经清除的 reverse/chain 报错不能阻止其他资源清理和 `network-state` 状态归档。验收同时查退出码、实际规则和状态文件。[T1](local-device-restore-20261118.md)

### 8. 文档与基线

- 当前为R1加[数值R2增补](../../../docs/gameplay-operations/13-numeric-r2-amendment.md)；旧规划、旧defaults、旧调查建议和导出副本不能覆盖现行基线。R1冻结实例与历史SHA不因R2修复就地改写。
- 新证据改变推定必须升级 R 版本，不混改已冻结实例。

### 9. 英雄属性与战斗数值

- `GetHeroStarAddAttrTid` 的参数为星级、品质、升星小段，索引为 `min(star,5)*10000+quality*100+star_progress`，与阵营无关。低星 `*_sum_add` 是累计平值，高星四维是百分比；基础成长除以 100，百分比才除以 10000。必须从原消费者核对参数和单位，禁止仅凭字段名推断。[vell-basic-attack-attributes-20261116.md](vell-basic-attack-attributes-20261116.md)
- 属性缓存必须包含 `star_progress` 等全部实际贡献字段。回归固定原数值并覆盖阵营独立、小段升星、成长和高星比例，禁止把错误的当前输出写成正确期望。
- 属性到主线/PvP 战斗的每次对象转换都要保留基础暴击、暴伤和阵营；明确的 0 不得被职业默认值覆盖。战报复用完整权威战力，不能只拿四维重算。[B2](combat-numeric-projection-20261117.md)
- 养成测试必须验证扣料后的属性或技能结果；专精等级逐行累计、专精突破只取当前累计行、突破天赋逐级累计，并按 AttrType.exchange 处理聚合属性。[B3](hero-development-attribute-sources-20261117.md)

### 10. 数量与协议边界

- 数量按原 protobuf 字段分别限制 int32、uint32、int64；`protobufjs.fromObject` 会截断越界值，编码成功不能代替范围检查。既有值加奖励也必须检查总量；int64 UID 全程用 BigInt/字符串，不能先转 Number。[N1](reward-quantity-boundaries-20261117.md)
- 大整数必须沿发奖、养成查找、JSON/HTTP与显示整条链核对。数量尚为安全整数不代表乘面值后的金额安全；超出安全整数的JSON字段使用十进制字符串，显示直接格式化整数分。[N3](voucher-integer-precision-20261117.md)
- JSON回执必须递归恢复所有Buffer字段，不能只修new_bin而漏extra；第一次、重试和重开库后的响应必须一致且只扣料一次。测试显式建立合法开服日/门禁和真实公会状态，不恢复已撤回的虚构业务来满足旧断言。[N2](item-receipt-and-audit-fixtures-20261117.md)
- SQLite 的 int64 UID 列不能用裸 `SELECT *` 交给默认 Number 解码；查询用 `CAST(uid AS TEXT)`/`setReadBigInts(true)`，插入自增 ID 时单独读取返回行，业务层保持 BigInt 或十进制字符串。低 ID 可继续返回 Number，高 ID 必须返回字符串，禁止先转 Number 再查库。[N1](reward-quantity-boundaries-20261117.md)
- 修复一个发奖入口不代表长 ID 链闭合；必须按“生成 → 执行命令 → 引用/消耗 → 重开库”反查所有下游服务。已验证的实例 UID 链路同样适用于邮件、拍卖、家园、三消、战报和英雄借用/租借。[N1](reward-quantity-boundaries-20261117.md)

### 11. 通行证进度与领取状态

- 通行证经验必须按客户端 `PermitCycleTypeBase.GetExp` 计算为 `基础经验 + buy_exp`；动态开服日经验和资源经验都不能绕过购买经验。[PT1](permit-day-exp-reddot-20261117.md)
- 客户端领取红点只检查 `receive_free` / `receive_permit`，不检查奖励数组。只要达到等级的对应轨道尚未领取，服务端就必须写入领取位；奖励数组为空时只跳过资源追加，不能跳过状态变更。[PT1](permit-day-exp-reddot-20261117.md)
- 新建账号必须显式清空 `pb_permit_info` 的全部账号字段和外层补偿日，不能以展开模板对象的方式只覆盖少数字段。[PT1](permit-day-exp-reddot-20261117.md)
- 2026-11-18 已随 `main@20dc167` 部署并通过进程、端口、启动日志与 SQLite `quick_check`；领取后红点和新号通行证状态仍须由用户做 APK 验收。后续操作先实时读取运行状态，不复用旧 PID。[PT1](permit-day-exp-reddot-20261117.md)

### 12. 客户端状态镜像与辅助接口

- SDK 启动链中客户端实际请求的辅助地址必须按真实方法、真实路径处理。`/ad/api/ip_address//` 的双斜杠和 GET 都要原样匹配，返回 200；未知路由 404 会在客户端变成“配置出错”。[S1](sdk-ip-discovery-404-20261118.md)
- 任务进度先看 `TaskType` 的 `progress_type`/`progress_fun`。`ONLY_STATE + progress_fun=0` 的状态进度为 1，不得附加选英雄、选宠物或战斗计数；修复时必须审计该 Type 的全部调用点，并覆盖首次领取、重复领取和重开库。[M1](only-state-task-state-20261118.md)
- 引导 MethodScript 等待 `GuideNodeEnable` 时必须同时核对客户端界面注册节点；非持久化 step 完成没有 8000 请求是正常现象。`364070` 的节点 `955` 由旅途/冒险笔记打开并返回注册，不能靠改库或伪造服务端返回值跳过。[G6](guide-adventure-node-955-20261118.md)

## 记录索引

全部修复条目及结论见 [README.md](README.md)。新增条目时按“编号、故障、文档、当前结论”补一行；编号取下一个未使用的字母/数字组合，不重复使用。
