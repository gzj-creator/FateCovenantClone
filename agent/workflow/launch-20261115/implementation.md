# 2026-11-15 新账号上线与第三章复用修复

## 现象与根因

用户新建账号登录后直接进入第三章。服务日志显示登录落到 `roleId=100001`，该角色为 9 级、已有 Guide process 112 和 6 个英雄，是本地启动时保留的旧游戏结构模板。

根因在 QuickSDK 身份解析：本地模式的 `createQuickSdkIdentityResolver` 沿用了公网空服默认值 `bindFirstIdentityToPrimary=true`。首个 QuickSDK 身份因此绑定到预置主账号 `local-1`，再解析到模板角色 `100001`。客户端的“新账号”只更换了认证身份，服务端仍返回模板存档。

## 修复

- `personal-server/local-server.mjs` 在本地模式显式设置 `bindFirstIdentityToPrimary=false`，新 QuickSDK 身份使用 `local-quick-<uid-sha256>`，由账号库分配独立角色。
- 公有空服模式仍设置 `bindFirstIdentityToPrimary=true`，保留首个真实身份占用空服主占位角色的原有发布行为。
- `personal-server/test/quick-sdk-accounts.test.mjs` 新增本地模式身份隔离测试，断言首个 QuickSDK 身份不等于 `local-1`，且映射文件不写 `primaryUidHash`。
- `personal-server/test/self-contained-deployment.test.mjs` 的自检复制跳过 `*.local-only.*`，与真实发布脚本排除运行态私有文件的边界一致。
- `tools/local-server-device.ps1` 让 NAT 恢复可重复执行，并忽略 ADB 无输出时产生的空 reverse 行。

## 验证

- `npm test --prefix personal-server`：tests 484，pass 482，fail 0，skipped 2，duration 99.6 秒。
- 快速套件覆盖新号空 Guide、首角在 `10202` 后发放、第二角在 `20201` 前不发、Michelle/2-1 原始固定敌阵、合法败北、SQLite 重开，以及 25 条 R1 未闭合命令在状态变更前返回 `GameError(5)`。
- 两个 skipped 用例只因未提供 `FC_RECHARGE_CLIENT_BUNDLE` 的 v9 已验收 Lua 包，不计为通过或失败。

## 当前运行实例

- 修复后 PID：`39736`。
- 数据目录：`analysis/experiments/launch-20261115/server-data-fixed`。
- 开服时间：`2026-11-15T05:00:00+08:00`，Unix `1794690000`。
- 活动日历：`schedule` / `absolute`，当前钓鱼活动 `1074011`。
- 端口：SDK `18880`、列表 `18881`、启动 `18882`、游戏 `19090`、管理 `18883`，监听地址均为 `127.0.0.1`。
- 干净库仍有模板角色 `100001`，但 `accounts` 为空、没有 QuickSDK 身份映射；新认证身份不再复用模板角色。
- 设备串口：`127.0.0.1:16448`；reverse 保持 `18880/18881/18882/19090`。

## 模拟器账号缓存处理

只清理并备份了客户端账号状态文件 `JZAccountStorage.xml`、`JZUserId.xml`、`JZUserToken.xml`，设备备份目录为 `/data/local/tmp/fc-account-cache-20261115`。未删除 `com.jzyx.ps.v2.playerprefs.xml`，其中 `SubDownloadFinish=1` 保留。客户端已重新启动到协议、登录入口。

本轮早些时候曾误执行一次 `pm clear com.jzyx.ps`。APK 未卸载，客户端重启后重新生成了 `il2cpp`、`ResCompleteTemp` 等启动文件；当前客户端日志未出现 `MissAsset`、资源加载超时或 `AddRemoteLoad` 错误。外部 `Updates` 目录不在旧备份中，当前依赖 APK 内资源与 `SubDownloadFinish=1` 路径；实机新账号登录和首章仍需作为最终验收。

## 验收边界

本记录可以证明新账号复用模板档的根因已修复，服务端快速套件通过，修复版服务已启动；真实 APK 新账号登录后的角色 ID、等级、英雄、mission 光标及首章界面仍需用户创建账号后核对。未取证的后玩法命令继续明确拒绝，不能据此宣称全部玩法 1:1 完成。

## 2026-11-15 新手女仆奖励与三人编队修复

用户新建角色 `roleId=100002` 完成新手奖励和布阵后发现，服务端已有女仆 `1020601`，`lineups` 与 `play_lineups` 也已是三人，但当前客户端队伍仍找不到女仆。服务端 `8001` 女仆领奖和 `209` 三人编队均成功提交，故不是资源表、发奖事务或编队写入失败。

客户端 `Info_latest.txt` 在 `20:42:52` 报 `HeroRes.lua.txt:62: bad argument #1 to 'ipairs' (table expected, got nil)`，随后 `209` 回包处理持续报 `hero nil` 和 `table index is nil`。`HeroRes.lua.bin` 的 `ResChange` 会把 `change.extra` 解码成 ETF 二进列表，再逐个按 `hero` protobuf 解码并调用 `HeroMgr.AddHeroes`。旧服务端女仆奖励只返回数量 `tid/new_num/diff_num`，因此奖励已落库但打开中的客户端英雄表没有即时加入女仆。

修复分为两项：

- `personal-server/game/resources.mjs` 在首次发放新英雄时返回该英雄的完整 protobuf ETF 列表作为 `change.extra`；重复英雄仍只增加数量，不伪造第二个英雄对象。
- `personal-server/storage/game-store.mjs` 在事务保存和登录物化时统一从权威 `lineups/play_lineups` 重算登录模块 9，保留未知字段并同步其中旧的编队副本。这样英雄、预编队和真实登录快照会同时更新。
- 回归测试解码女仆奖励的 `change.extra`，并覆盖女仆领奖、`209` 三人编队、原始模块 9、SQLite 重开；租借英雄星级/品质测试也改为明确核对 SQLite 中模块 9 的编队副本。

验证结果：

- `node --test test/guide-original-rules.test.mjs`：14/14 通过。
- `node --test test/leaser-starup-service.test.mjs`：11/11 通过。
- 女仆/编队/账号隔离/招募相关测试：51/51 通过。
- `npm test`：485 项，483 pass、0 fail、2 skipped；两个 skip 仍仅因未提供 v9 已验收 Lua 包 `FC_RECHARGE_CLIENT_BUNDLE`。

上线前使用 SQLite `VACUUM INTO` 生成一致备份：

- 备份：`analysis/experiments/launch-20261115/backups/pre-guide-hero-20261115T131500Z/game.local-only.sqlite`。
- 大小 `1,658,880` 字节，SHA256 `d8b9462f99cdb599719a9f426370cecf8c98144c83e1d5734062688c8bd47b9d`。
- `PRAGMA integrity_check=ok`；备份内有 2 个角色、1 个账号。

新服务 PID `32464`，继续使用 `analysis/experiments/launch-20261115/server-data-fixed` 和原开服时间 `2026-11-15T05:00:00+08:00`。SDK `18880`、列表 `18881`、启动 `18882`、游戏 `19090`、管理 `18883` 均由新 PID 仅监听 `127.0.0.1`；管理页返回 HTTP 200。服务日志为 `server-guide-hero-fix-20261115T131700Z.out.log`，stderr 为空。

客户端只执行 `am force-stop com.jzyx.ps` 后重开，未执行 `pm clear`，PlayerPrefs、账号缓存和本地存档均保留；重开后 `com.jzyx.ps` PID 为 `7933`，当前停在 QuickSDK 账号选择页。服务端和字节码回归已闭合本次两个缺失点，最终队伍是否出现女仆仍需用户在模拟器创建新账号完成视觉验收。

重开后用户继续使用 `roleId=100002` 实测，`8001` award 2 于 `seq=49` 提交，随后 `209` 于 `seq=52` 提交。服务端模块 10 当前英雄为 `2010101/2010201/1020601/2020601`，模块 9 当前主阵为 `1020601/2010201/2010101/2020601`，女仆已同时出现在英雄表和登录编队快照。新客户端日志 `Info_after_guide_hero_fix_runtime.txt` 中 `HeroRes.lua.txt:62`、`hero nil`、`table index is nil` 均为 0 次；这些旧错误没有在新回包路径复现。战斗界面中的最终视觉显示仍由用户当前模拟器操作确认。

## 2026-11-15 3-4 配置错误、首次入梦与开放门槛修复

### 3-4 配置错误

客户端日志中的完整错误链为 `ItemTable.Item(140000) is nil`，随后发生在 `AwardKit.Parse -> ResMgr.Parse -> FightSettlementMgr.DoModuleSettlement -> MissionUIMgr`。战斗结算本身已经成功，问题在结算奖励里的角色经验伪 ID：服务端把真实物品 `1140000` 错写成 `140000`，客户端无法从 ItemTable 找到该 ID。

`personal-server/game/mission-fight-service.mjs` 已改为 `1140000`，任务战斗回归测试覆盖普通关卡、30204 和重开后结算。`node --test test/mission-fight-service.test.mjs` 为 28/28 通过。

### 新手首抽与统计推包

- 首个 QuickSDK 本地身份不再绑定旧模板角色，新账号从第一章和空招募计数开始。
- 新手女仆会即时以完整英雄 protobuf 发入客户端，同时服务端持久化英雄和编队，登录模块 9 从权威编队重建。
- 首次普通冒险招募固定第一张为薇尔 `4030801`；单抽可立即获得，十连只有第一张固定，其后沿用原池规则。仅当该账号全部招募库累计抽数都为 0 时触发，重开和后续抽卡不会重复触发。
- `type 2000` 成长统计推包原先错误套用了 ETF `binary + integer` tuple；客户端 `CountStatisticsMgr` 期待裸 `pb_count_statics_send_list` bytes。招募和每日任务两处推包均已改为裸 protobuf，并由真实 TCP 测试解码验证。

### FunOpen 门槛

重新按脚本指令核对后，`FunOpenTable` 导出结果为 523 条：183 条可执行、340 条证据缺口；271 个断言全部映射，其中 94 个断言已恢复。已恢复的比较方向和开服语义包括：

- `1006` 旧首充：通关 `30203` 且开服时间不晚于 `1744318799`；当前新服已过该截止点。
- `1413` 新首充：通关 `30203` 后开放。
- `1017` 商城：通关 `80208`（8-8）后开放。
- `1155` 永久梦中小屋：旧服等级 60 条件，或开服时间不早于 `1757451600` 时到开服第 24 天。
- `1514`：维持 `30203` 门槛。

`ServerInfo.OpenTime`、`all` 和 `any` 已进入规则提取器与运行期求值器；未经逐指令核验的复合表达式继续 fail closed，不按相似结构猜测。

### 梦中小屋活动窗口

原表 `1024001` 是四天期梦境活动，`duration_day=4`、`refer_day=1`、`server_start_time=18000`、`stage_duration_day=[3,1]`。以 `1794690000` 开服时运行期窗口为 `1794690000..1795035600`，第一阶段 3 天、第二阶段 1 天，因此开服第一天可见属于表内行为。它是四天期活动，与开服第 24 天才开放的永久梦中小屋系统 `1155` 不是同一对象。大厅截图中约 6 天 2 小时的倒计时尚待继续区分是否为顶部周倒计时，当前不以该截图修改活动实例窗口。

### 验证

- 任务战斗专项：28/28。
- 招募、统计推包、FunOpen、每日任务与真实 TCP 相关专项：59/59。
- `npm test --prefix personal-server`：487 项，pass 485、fail 0、skipped 2；两个 skipped 仍只因未提供已验收 v9 Lua 包 `FC_RECHARGE_CLIENT_BUNDLE`，与本批修复无关。
- 尚不能据此宣称剩余 25 条 R1 P0/P1 或全部原版玩法已闭合。

### 部署记录

代码提交 `4300461`（`fix: repair launch guide rewards and open rules`）。切换前再次对实时库执行 SQLite `.backup`：

- 备份：`analysis/experiments/launch-20261115/backups/pre-launch-fixes-20261115T151955Z/game.local-only.sqlite`。
- 大小 `1,667,072` 字节，SHA256 `6975e926832610140119c7f031b30b021a7cf81f7dad24c034679a26853d5dcf`。
- `PRAGMA integrity_check=ok`，2 个角色、1 个账号。

旧 PID `32464` 已停止；新服务 PID `8108`，继续使用同一数据目录和开服时间 `1794690000`。五端口均仅监听 `127.0.0.1`，管理页 HTTP 200，stderr 为 0 字节。日志为 `analysis/experiments/launch-20261115/server-final-fixes-20261115T152108Z.out.log`。

客户端仅执行 `am force-stop com.jzyx.ps` 后正常重开，未执行 `pm clear`，未代用户点击 UI。当前停在 QuickSDK“选择账号”页，截图 `analysis/experiments/launch-20261115/client-ready-final-fixes.png`；用户可点“其他账号登录”创建新号做最终视觉验收。

## 2026-11-16 转场卡死与登录模块补齐

### 屏幕不可点击

`com.jzyx.ps` 前台 Activity 和 Unity 渲染都正常，截图中全屏 `LoadingProgressBgForm` 仍可见并拦截触摸。`client-logs/Info_after_guide_hero_fix_runtime.txt` 的异常来自新手引导完成后的 `MainHouseForm` 打开事件：

```text
GuildWarMgr.lua.txt:887: attempt to index field 'entryData' (a nil value)
GuildWarMgr.GetRealTimeMap <- GuildWarMgr event callback
<- MainHouseForm <- MainUITagNode <- MainUIForm <- MainUIMgr.EnterHome
<- GuideCommClickForm
```

异常中断 `EnterHome` 后没有关闭 `LoadingProgressBgForm`；不是 Android ANR，也不是服务端返回了未知空白页。

`ModuleTable.data.lua` 中 `24047` 行的路径为 `project/guild_war`。客户端 `GuildWarMgr.LoginParse` 按下列顺序读取四个 binary：`pb_guild_war_entry`、`pb_guild_war_data`、`pb_guild_war_record`、`pb_guild_war_person`。服务端此前没有返回模块 24047，因此 `entryData` 为 nil。

`guild-activity-service.mjs` 现在生成四段空但合法的 protobuf，`gateway.mjs` 在活动门禁处理后仍向登录容器写入模块 24047。空数据只让客户端管理器初始化，不会打开公会战或伪造战场状态。

### 登录异常

- 模块 113 的客户端原型顺序是 role、act、match。服务端已从 act、role、match 改为 role、act、match；此前 act 被当作 role 解码会在字段 5 触发 bytes/varint 类型错误。
- 模块 4 的 `RedDotMgr.LoginParse` 要求 ETF 列表，元素是 `single_red_info` binary。服务端已从单个 `all_saved_red` protobuf 改为 ETF 列表，并把 `loginRedDots()` 改为异步；gateway 在登录容器中使用它的编码结果。

### 活动 118003 告警

客户端 `ActivityServerData` 在 `cur_state_id` 不在活动 `state` 配置中时打印 `act {0} not exist state {1}`。原表 `ActivityTable.Activity(118003)` 的 `func=118`、`server_day=1`、`duration_day=7`，但 `state=[]`；同族的 118001/118002 明确配置了 `[10,50]`。服务端按运行期写入 `cur_state_id=50`，客户端打印告警后仍继续调用该功能的 `LoginParse`。

因此这是随客户端表带出的状态配置告警，不是模块缺失、登录失败或转场卡顿原因。现有证据不能证明应向客户端伪装一个表内不存在的状态；本轮保留 7 天活动、真实模块数据和不伪状态。

### 验证

- 模块 113 登录顺序专项：1/1 通过。
- 模块 4 角色支持专项：15/15 通过。
- 公会战模块 24047 与四段 binary 专项：2/2 通过。
- `gameplay-gateway.test.mjs`：7/7 通过。
- `npm test --prefix personal-server`：490 项，pass 488、fail 0、skipped 2；两个 skipped 仍只因未设置已验收 v9 Lua 包环境变量 `FC_RECHARGE_CLIENT_BUNDLE`。

本轮未修改 APK，因此不新增 APK 快照。仍不能据此宣称剩余 25 条 R1 P0/P1 或全部原版玩法已闭合。

### 部署记录

- 旧服务 PID `8108` 已停止；新服务 PID `24700`，继续使用 `analysis/experiments/launch-20261115/server-data-fixed`、开服时间 `1794690000` 和 `schedule` / `absolute` 活动模式。
- SDK `18880`、列表 `18881`、启动 `18882`、游戏 `19090`、管理 `18883` 五端口均由新 PID 仅监听 `127.0.0.1`。
- 启动日志为 `analysis/experiments/launch-20261115/server-login-contracts-20261115T163020Z.out.log`；stderr 为 `0` 字节，管理页 `http://127.0.0.1:18883/` 返回 HTTP `200`。
- 切换前一致备份为 `analysis/experiments/launch-20261115/backups/pre-login-contracts-20261115T162846Z/game.local-only.sqlite`，大小 `1,675,264` 字节，SHA256 `cf72addc31d17791f802bef4bcb4acce1f4cd71d4a39076551a3a37a238bf2f0`，`PRAGMA integrity_check=ok`；备份内有 `2` 个角色、`1` 个账号。

## 2026-11-16 引导演示战与功能开放修复

- `GuideDemoFightStep` 引导演示战 `235002 -> fight_tid=90024` 改用双方固定配置队伍，报告类型取 `Fight[90024].type=4`；201/207 不推进主线、不扣体力、不发奖、不写引导位。
- 名人堂旧引导别名 `1105` 与当前功能 `1218` 绑定同一已证实门槛（角色等级 ≥32、开服日 ≥2），修复引导 `291004` 在低等级仍弹“新功能开启：勇闯名人堂”。
- 登录调和对 `status=ready` 且条件明确为 false 的遗留开放位执行删除；evidence-gap 与 `force_open` 不删除。当前角色已清除旧 `1218`/`1155` 位。
- 梦境活动 `1573/1024001` 恢复为通关 `30203` 开放；`1024001` 当前四天活动窗口属于表内行为。永久梦中小屋 `1155` 仍按原等级 60 或服龄 24 天规则关闭。
- 相关专项测试 42/42 通过；本批修改前全量 `npm test` 为 495 项、pass 493、fail 0、skipped 2。修改后未重启服务，等待下一 agent 部署后做客户端引导与名人堂视觉复验。

本轮未修改 APK，不新增 APK 快照。

