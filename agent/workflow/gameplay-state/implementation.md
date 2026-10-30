# 本机养成状态与 SQLite（2026-10-25）

## 2026-10-30 旅途经验与第 6 上阵位

用户反馈旅途下一关需要 6 名伙伴，而第 6 格要求团长 10 级；当前存档团长只有 9 级，无法继续。客户端门槛本身正常：`FunOpenTable` 的 1102/1103 都以上阵位图标和 `tip_params=[[10]]` 开放第 6 格。问题在本机服没有结算旅途胜利的团长经验，先前战斗胜负和伤害模拟没有导致等级异常。

`RoleTable.Level` 证据：9 级 `reach_exp=90`、`mission_award_num=45`；10 级 `reach_exp=50`、`mission_award_num=50`，`LevelSetting.max_level=300`。`RoleExpUpForm` 把 `pb_res_change.extra` 按 ETF 二元组 `[等级, 当前经验]` 解码，`RoleExpRes` 再刷新等级和经验。修改前 SQLite 的 role 为 `level=9` 且没有 `exp` 字段，等效经验 0；旅途模块当前指向 `40210`。

本轮修改：`config/game-tables.mjs` 加载 `RoleTable.Level/LevelSetting`；`protocol/game-codec.mjs` 增加 ETF 整数二元组编码；`game/mission-fight-service.mjs` 每次旅途胜利按战前等级发放 `RoleTable.Level.mission_award_num`，递归扣除 `reach_exp` 并更新 `model.role.level/exp`，返回 `tid=140000` 的 `pb_res_change`，`extra=[newLevel,newExp]`。重复刷已通关关卡仍发经验，但不重复发首通奖励。另为本机缺少 `FightTable.Fight.410` 的 40210 章节 Boss 增加 40209 敌人兜底，日志会记录 `enemyFallback`；这是本机兼容数据，不是原服事实。

组件验证：`mission-fight-service.test.mjs` 12/12、全量 `npm test` 168/168 通过；新增覆盖首场 +45、经验持久化、9→10 级、重复刷经验、40210 兜底及章节 5 游标。尚未部署到正在运行的服务（本轮读取 PID 38688，端口 18880/18881/18882/18883/19090），也未做真实 APK 验收。部署后从 9 级 0 经验开始，刷两次已通关旅途各得 45 经验即可升到 10 级。

23:44新增[余额/订单与管理页](../wallet-admin/implementation.md)和[冲榜任务领奖](../activity-ranking/implementation.md)，SQLite四新表幂等创建，原九类表部署前后完全一致，保留所有养成/编队。91/91组件通过；v8b安装并重开，充值与领奖APK验收待用户操作。以下排行榜未实现描述为旧状态：2000/2008/2011已有空榜读接口、79104任务领奖已部署，最终榜单结算尚无。

## 22:14 用户验收与小队修复（覆盖后文待验状态）

用户明确反馈“小队能进，升级升星正常”。真实APK日志：22:12:48 type209/seq10和208/seq12编队提交，22:13:00 type639/seq19升星提交，22:13:02 type636/seq21升级提交，22:13:20 type639/seq22再次升星提交，随后有新连接登录成功。SQLite实际记录：2020601等级8→9、格子4同步9，经验7870→7470；2020601和1020601各增长3段升星进度，两种对应碎片各30→0。当前是0星进度3/6，不是直接增加整星。SQLite完整性ok。突破638和满6段进整星仍仅组件测试，未让用户在本轮验证。

小队报错实因为218 req_lineup_exchange_version未实现；同时发现第一版迁移把module9的pb_lineup_login误当pb_role_lineup解析，已修正为外层登录包→pre_lineup嵌套解析。数据库升级user_version=2，修复时从保留module9恢复真实预设，增加play_lineups表，保留英雄/资源和其他状态。登录始终重建完整pb_lineup_login，保留英雄库及自定义阵容字节。旧版本误解析不再作为养成绑定依据。

新增game/lineup-service.mjs处理208玩法编队、209预设保存、218版本切换。版本枚举来自PreLineupMgr：DEFAULT=0、AFK=1；切换在active/standby间交换，重复相同请求不再交换。首次备用为空时复制当前队伍作为本机兼容策略，非原服已验证规则。保存验证英雄拥有、格子、位置/英雄重复，事务持久化并回PB；209 handle_types支持本机已有玩法类型和0（仅保存）。

75/75测试通过，新增v1→v2仅修复编队不丢养成、版本反复切换和重开数据库、编队/位置校验、完整module9重建及TCP218/209/208。部署前使用SQLite backup生成一致备份；证据analysis/experiments/private-server-20261025/p3/lineup-fix-20261025-221137/，含server-before.local-only.log、game-before.local-only.sqlite、accepted-game.local-only.sqlite、acceptance.local-only.json。运行服务PID38232，以server.local-only.json实时核对；服务、隔离客户端、UID隔离/reverse保持运行。

本段为最新结论，后文72项/数据库v1/小队未实现/用户待验为第一轮部署历史。战斗、招募、排行榜2011、5星后独立试炼及其他养成仍未实现。

## 本轮实现与分界

用户在隔离客户端反馈升级、升星显示服务器错误。旧网关对 type636/type639 返回 LOCAL_NOT_IMPLEMENTED。现新增升级636、突破638、普通升星639；角色、格子、资源与引导数据使用 SQLite。72/72 自动测试通过，其中新增9项覆盖业务、迁移、事务和真实本机 TCP。已部署并重启隔离客户端，用户界面操作验收仍待反馈，不能写为 APK 养成已验收。

## 代码目录

| 路径（personal-server/ 下） | 职责 |
| --- | --- |
| local-server.mjs | 四项服务装配与启动入口 |
| game/gateway.mjs | 握手、会话验证、消息分发、登录初始化 |
| game/hero-progression.mjs | 升级、突破、普通升星与业务校验 |
| storage/game-store.mjs | SQLite、版本、旧存档迁移、事务及登录重建 |
| protocol/game-codec.mjs | ETF/PB 编解码与序列化结构恢复 |
| config/hero-tables.mjs | 从已解出的客户端配置读取养成表 |
| game/hero-progression.test.mjs | 业务及持久化回归测试 |

根目录 local-game.mjs、client-config.mjs 保留兼容导出。已有 SDK、区服等组件入口仍可独立运行。

## 数据库与迁移

数据库为 `analysis/experiments/private-server-20261025/p3/runtime.local-only.data/game.local-only.sqlite`，由 Node 26 内置 node:sqlite 管理，无新增 npm 依赖。user_version=1，WAL、foreign_keys、synchronous=FULL，写事务使用 BEGIN IMMEDIATE。

表：roles、heroes、hero_cells、resources、lineups、guides、login_modules、migrations。英雄等级/星级/星级进度/突破、格子等级/突破和资源数量分别有明确字段；资源数量以十进制文本保存 int64，运算使用 BigInt。完整 PB 字段保留在 payload_json；未实现登录模块保留独立快照，不随意删减装备、皮肤等字段。

空库首次启动读取 state.local-only.json，自动保留 state.local-only.pre-sqlite-backup.local-only.json，再在事务内写入所有表和迁移标记。旧 JSON 不删除、不再写入；之后启动优先读 SQLite，不重复导入旧 JSON。已有数据库版本高于1时明确拒绝。迁移失败回滚，不会保留半份角色。迁移前日志/JSON归档在 p3/progression-sqlite-20261025-220257/。

首次部署检查：roles1、heroes6、hero_cells6、resources13、login_modules145、lineups1、guides1、migrations1，PRAGMA integrity_check=ok。原始146条登录模块存在重复键，按原网关 Map 语义保留145个唯一模块。SDK会话仍是临时内存会话，服务重启后重新登录；游戏数据已持久化。

## 业务契约

- 636：PB pb_hero_up_lv_req → pb_hero_up_lv_ret。支持多级请求，逐级累加 UpLevel 当前级别成本。按编队 fighter.index/hero_id 绑定格子与英雄，同步同格子的英雄。等级不能超过团长等级乘 hero_lv_rate；突破节点按 UpStage.need_hero_lv 校验。
- 638：ETF 格子整数 → pb_hero_break_ret。按当前突破级别取 UpStage，验证英雄等级，同时扣金币和材料，更新格子及英雄突破级别。
- 639：ETF [hero_uid,段数] → pb_hero_up_star_ret。按基础品质*100+当前星级取 UpStarCost，每段扣对应英雄碎片，6段归为1星。保留完整hero字段。5星及后续独立试炼分支暂未实现，返回条件不足，不能通过639跳过。
- 回包资源包含权威 new_num 和负 diff_num。数量非法、英雄/格子不存在、材料不足、等级上限等返回对应客户端业务码，不再全部返回 -1 服务器错误。整个请求严格校验，不会材料不足时部分扣费或部分升级。普通升星具体规则来自客户端静态逻辑，仍需本机 APK 实测确认。

扣材料、状态修改、PB编码和数据库提交在同一同步事务；编码或写库失败全部回滚。登录时从数据库重建英雄、经验、金币、道具和编队模块，重登不回退到旧fixture。所有请求仅本机，未向原服请求或重放。

## 复现与测试

```powershell
npm test --prefix .\personal-server
node personal-server/local-server.mjs
```

第二条仅用于当前服务未运行时；部署后 PID37780，实时状态以 runtime.local-only.data/server.local-only.json 为准。18880/18881/18882/19090 均只监听127.0.0.1。隔离客户端重开后PID7279；仅操作 com.jzyx.ps，ADB始终指定127.0.0.1:16448，未触碰原版。

自动验证包括：旧存档只迁移一次、备份存在、模块保留、SQLite完整性、多级合计成本、字段保留、材料不足/绑定/上限、突破两项扣费、半星进度/6段进星、数据库重新打开、业务异常/编码异常/SQLite触发器写入拒绝的原子回滚、真实本机握手与序号匹配及业务错误后心跳仍可用。72项通过是组件验证，不是用户APK验收。

## 用户验收与遗留

隔离客户端已重新打开，提示用户测试号码19900000000、任意4位验证码1234重新登录，并测试一次升级和升星。当前角色团长9级，英雄8→9可升级一次，之后触发等级上限。其他初始1级格子可能先需突破；材料不足应显示业务提示。当前影之菖蒲30碎片、每段10，应增长3段而非直接整星。用户尚未反馈最终结果。

type208/209编队、2011排行榜、战斗、招募、后续试炼与其他养成仍未实现。大厅仍有离线fixture和活动资源缺口。网络隔离、reverse与服务保持运行供用户验证，不自动执行历史Stop清理。
