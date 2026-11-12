# Changelog

## 如何维护

- 版本规则：大改动升主版本，新功能升次版本，问题修复升修订版本。
- 更新时机：每次提交前更新；未发版内容写入 `Unreleased`，发版时整理为 `vX.Y.Z` 版本节。
- 标题格式：`## [Unreleased]` 或 `## [vX.Y.Z] - YYYY-MM-DD`。
- 内容粒度：按 Added、Changed、Fixed、Docs、Chore 等小节记录重要行为变化，不逐行抄录 diff。

## [Unreleased]

### Added

- 新增统一时间基准 `personal-server/game/time.mjs`：自然日、业务日（05:00）、服务器日与周起点集中计算，业务代码不再裸写 `10800/18000/28800` 等偏移；新增源码扫描测试防止回退。
- 新增唯一角色经验入口 `personal-server/game/role-level.mjs`：一次奖励可跨多级，满级经验封顶，主线与道具/奖励经验共用同一实现。
- 完善功能开放规则引擎与取证资产：`config/fun-open-rules.json` 现覆盖客户端 FunOpen 全 523 行并记录来源 SHA256，164 行由字节码证实为等级/创角天数/服务器日条件，359 行证据不足严格关闭；7000 申请按权威规则逐条复核。新增 `tools/extract-fun-open-rules.mjs` 与 LuaJIT 33-bit number/upvalue 边界回归测试。
- 新增活动生命周期引擎 `activity-lifecycle.mjs`：预告/进行/领奖/展示/关闭状态机，`read/operate/claim` 门禁，暂停、强开、延长、区服资格、玩家条件与父子活动判定。
- 新增通用调度器 `scheduler.mjs`：`scheduler_job` 表、到期执行、失败重试计数与启动补跑基础。
- 新增活动实例/覆盖/结算/审计持久化 `activity-store.mjs` 与运行时 `activity-runtime.mjs`：登录写入实例、每分钟推进阶段、离开进行态幂等结算，并支持活动窗口预演。
- 新增功能开放运营覆盖 `feature-overrides.mjs`：区服级 `force_open` / `force_close` 持久化、撤销和 `ops_audit` 留痕；紧急关闭只屏蔽下发与门禁，不改角色位图。
- 新增 1407 条命令目录 `config/command-catalog.json` 与注册表 `command-registry.mjs`：启动校验总数、type/name 唯一性和读写声明，支持按 `config/command-gate-rules.json` 对未开放功能执行写拒绝/读空态。
- 管理端新增“活动与开放”页：活动实例、活动覆盖、功能覆盖、预演、二次确认、撤销、立即检查阶段；结算前用 `VACUUM INTO` 自动备份。
- 新增 `scripts/measure-slow-files.mjs` 与 `npm run test:measure-slow`：逐文件计时并按阈值生成/增量更新慢测清单。

### Changed

- 测试分层进一步收紧：英雄技能校验、真实网关和多实例登录等 83 个耗时文件移入慢测清单，`npm test` 快速套件从 115 个文件降到 37 个，实测约 14 秒。
- 调度器支持 recurring job：handler 返回 `nextDueAt` 时，在完成标记之后重新登记下一轮，避免完成更新覆盖新任务。
- `serverDayNumber` 改为统一业务日口径：开服自然日锚定第 1 天，05:00 切换；18:00 开服次日 05:00 进入第 2 天，00:00 开服不再整体平移活动窗口。

### Fixed

- 修复新账号只改角色等级却继承旧登录模块的问题：每次创建账号现在会生成完整的 1 级起始档，包括两名初始英雄、空任务/装备/战令进度、120 体力、初始编队和正确的通行证开服日；同服连续注册的账号保持独立角色。
- 修复 QuickSDK 外部身份全部落回 `local-1` 的问题：外部 UID 以 SHA-256 持久化映射到独立服务器账号，已有手机号账号继续按 `local-phone-*` 隔离，映射文件损坏时失败关闭。
- 新增 SQLite schema v20 一次性修复，仅识别旧实现产生的“顶层 1 级但仍是 9 级模板进度”角色，并保留角色号、创建时间、昵称和账号关联；已建立的 12 级主账号不受影响。
- 修复新账号 `mission_id=0` 时首关被误判为配置缺失的问题，首个可战斗关卡现在可以正常开始、结算、扣除体力并持久化进度。
- 独立限时升星 `31052` 现按 `UpStarGiftTable` 解码 ETF/protobuf 登录块，以模块 92 版本与领取位为权威状态，从英雄、魔灵和精灵真实星级校验门槛并同事务发放免费任务奖励；充值礼包行继续走 RechargeMgr，完整重放幂等，grant 或持久化失败整体回滚。
- 独立限时升星 `31053` 与登录同步只选择当前开放且有静态配置的版本；缺失的 25111 登录行会补齐，过期/零值选择会恢复，历史版本和非法版本不会被当成当前活动。
- 活动商店 `104801` 改用独立 ActShop 服务，按开放 ActFrame、`ActShopTable` 与 ETF/protobuf 玩家状态返回真实商店列表；缺少 104802/104803 状态机时继续明确拒绝，不再整族拒绝或返回空成功。
- 块 I 拒绝原因按最新 APK/Lua/表复核：修正 WeekendBonus、DiamondFund、WeekHunt、FlashSale、LinkGift、LevelSprint、RebateShop、AppearanceRelease、BuySkin、Vickrey、GiftBox、Subscription、NewPermit、Premium、Fashion 与 RedEnvelope 对缺失资产的过时描述。
- 修复新超凡精灵百抽 `1102008` 的登录数据编码：模块 92 与模块 183 的 `module_login_data` 统一改为客户端要求的 ETF BINARY 包装，并补齐模块 183 的 `pb_hundred_draw_act_data`，避免目标、保底与领取位整体解析失败。
- 固定池百抽在登录和命令响应中统一返回配置目标（`1102008` 为精灵 `500520`），并把规范化目标写回 SQLite；下放池在选择前仍保持 0。
- 百抽升星领奖按主题读取真实星级：英雄取角色列表、魔灵取模块 158、精灵取模块 538；碎片奖励统一按 `ItemTable.Chip.point_item` 反查，精灵 `500520` 正确映射到 `500521`。
- 百抽 `draw_target_time` 改为按 proto 注释累计命中次数，不再写入 Unix 时间戳；`ten_target_times` 在十连命中时累加。
- 百抽奖励类型 104 对英雄按 `RelicTable.SpHero` 发放；精灵、魔灵的 8/10 星档位缺少等价映射时继续明确拒绝，不发放猜测奖励。
- 修复服务重启后 QuickSDK 缓存身份无法登录：账号隔离解析器会忽略已签名的 12 位外部平台 `uid/token`，现将其桥接回主账号 `local-1`，同时继续按服务器签发的 `local-phone-*` 身份隔离手机号账号。
- 活动窗口统一按“目标服开服时间 + 表内相对时间”计算：世界时间活动相对参考服开服平移，日相对活动从目标服开服第 N 天计算，旧模块 183 和 stage 时间不再覆盖静态相对窗口。
- 校正活动持续时间解析和业务截止时间：保留显式 `duration_day=0`，统一处理非默认 `end_time`，宠物与百校等商城直接使用共享窗口终点。
- 白绫 `1102010` 调整到目标服开服第 16 天 `2026-11-26 05:00` 开启，模块 92 与父活动、礼包商城、兑换商店的模块 183 窗口保持一致。
- 新增活动全表排期审计，覆盖 1,993 行活动、世界时间换算、相对日窗口、分段时长和动态活动边界。
- 旧 `ActivityTable.func=20` 百抽活动 `20001` 现可使用与现代 `ActFrameAct.type=1102` 相同的抽取、领奖和跑马灯服务。
- 百抽登录同步会按版本表补齐礼包商城和兑换商店子活动，并使用父活动真实自定义窗口，覆盖新服零点开放但静态表五点开放的时间差。
- 龙岛活动数据探测读取未开放活动时返回完整空状态，不再因 `107703` 的 `code 309` 在进入游戏时提示“仅显示物品不可操作”；领奖接口仍对关闭活动失败关闭。
- 消息系统接入频道类型 `12` 的按 realm 本服频道分配，进入游戏时 `10507` 不再因 `code 5` 提示“配置出错了”。

### Docs

- 新增 `docs/plans/pending-work-20261112.md`：按“明确拒绝 / 待补证据 / 横切缺口 / 活动入口 / 仅待验收”五类口径汇总全项目待实现项，登记 13 个工作块 276 张卡 / 1252 条缺失命令的交付与拒绝清单，并盘点 10 个 worktree 的文档合并状态。
- 记录独立升星的完整表字段、任务类型、领取位、版本恢复、事务/幂等/回滚和当前免费行边界，见 `agent/workflow/fixes/up-star-gift-20261111.md`。
- 记录 ActShop 104801 数据链与 104802/104803 证据缺口，见 `agent/workflow/fixes/act-shop-20261112.md`；新增 43 家族/83 命令的活动资产审计矩阵，见 `agent/workflow/fixes/activity-asset-audit-20261112.md`。
- 记录新超凡精灵百抽的登录块编码根因、固定池目标语义、精灵/魔灵星级来源、类型 104 边界与 APK 待验收项，见 `agent/workflow/fixes/hundred-draw-spirit-star-20261111.md`。
- 记录活动参考服开服、目标服开服、登录模板锚点三种时间基准，以及全部活动审计和 4 个无法静态还原配置项的边界。
- 记录百抽奖券 `835802` 的领取、抽取与 SQLite 持久化真实 TCP 回归，以及缺失 `ActShopTable` 的明确拒绝边界。
- 记录进入游戏双错误弹窗的日志证据、根因、修复边界、目标回归与部署后验收事件。
- 新增 `docs/plans/full-service-p0-progress-20261112.md` 的实施状态与本轮完成证据，以及 `promot/2026-11-13-full-service-p0-next-agent.md` 的跨机器续接提示词。

### Chore

- 拆分快速与耗时测试入口：日常 `npm test` 保留单文件累计约一秒以下的单元回归，真实网关、部署和重型链路归入 `npm run test:slow`，`npm run test:all` 保留完整回归。
