# 训练（HeroFavor）实现与验收记录

- 日期：2026-11-01
- 分支：`feature/system-training-20261031`
- Worktree：`F:/projects/FateCovenantClone/.worktree/system-training-20261031`
- 基线：`118039a`
- 状态：服务实现和自动化验证完成；APK 视觉/设备闭环尚未验收。

## 结论与名称映射

“训练”最终对应客户端功能 `HeroFavor`，中文界面为英雄训练/好感/游玩相关页面，并非 module 125 `TacticsForm`、`MartialClub` 或充值训练礼包。

客户端实际向服务端发起的 HeroFavor 写操作有三项：

| 功能 | Cmd | 请求/响应 | 服务实现 |
| --- | ---: | --- | --- |
| 送礼提升好感 | 646 | `pb_hero_favour_gift_req` / `pb_hero_favour_gift_rsp` | 完成 |
| 消耗道具游玩 | 649 | ETF `[hero_tid, flag]` / `pb_hero_favour_play_rsp` | 完成；`flag` 的原始语义仍未知 |
| 领取好感等级奖励 | 653 | `pb_hero_favour_level_award_req` / `pb_hero_favour_level_award_rsp` | 完成 |

登录状态是 module `10` 的零基 slot `4`，即 Lua 侧 `login[5]`，类型为 `pb_role_hero_favour`。功能开放常量为 `TID_HERO_FAVOR = 92`。

完整证据链：

1. `FunJumpTable.data.lua` 第 154 行把大厅跳转目标指向 `HeroFavorListForm`。
2. `HeroFavorListForm` 打开 `HeroFavorBaseForm`。
3. `HeroFavorBaseForm` 提供送礼、游玩、升级展示和奖励交互，并调用 `HeroFavorMgr.ReqSendGifts`、`ReqFavourPlay` 等入口。
4. `HeroFavorMgr` 维护账号与英雄的每日游玩次数、礼物好感、英雄好感等级、总好感等级及突破上限。
5. `HeroCmd` 静态声明只包含三项 HeroFavor 请求：`req_hero_favour_gift`、`req_hero_favour_play`、`req_hero_favour_level_award`。
6. `HeroDataMgr.LoginParse` 将 module 10 的 slot 4 解码为 `pb_role_hero_favour`。
7. `FunOpenTable` 以 `TID_HERO_FAVOR = 92` 控制该功能开放。

主要只读证据位于：

`analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_project.bundle/textassets/`

重点文件：

- `FunJumpTable.data.lua.json`
- `4043846597398058000-HeroFavorListForm.lua.bin`
- `10756417218725282000-HeroFavorBaseForm.lua.bin`
- `774541465700577200-HeroFavorMgr.lua.bin`
- `2456793199459520500-FunOpenTable.lua.bin`

## 排除候选

- `TacticsForm`/module 125 是战术阵型/策略界面，不具备 HeroFavor 的送礼、游玩、好感进阶和 module 10 slot 4 登录数据。
- `MartialClub` 是独立武馆系统，入口、Cmd 和登录状态均不同。
- 充值训练礼包属于商城/充值活动，没有 HeroFavor 的 UI、Manager、Cmd 和状态链。
- `req_hero_visit` 与 `req_hero_meet` 同 HeroFavorMgr 文件中共存，但受 `TID_HERO_VISIT` 控制，读写 `roleVisitData`，属于英雄拜访功能，不是训练页面的三项写操作。

## 已实现规则

### 送礼，Cmd 646

- 请求按英雄 tid 和礼物列表处理；同一请求中的重复礼物先聚合，再一次性扣除库存。
- 当前配置中礼物 `31002`、`32002`、`33002` 每份分别增加 `5`、`25`、`50` 好感。
- 更新英雄好感、`all_gift_times`、全账号总好感 `all_favour` 和总好感等级 `favour_level`。
- 礼物库存不足整笔拒绝，不产生部分好感或部分扣除。
- 好感超过当前英雄突破等级对应的 `FavourBreak.max_favor_level` 时整笔拒绝。`max_favor_level = 0` 表示不设上限。
- 英雄突破等级从角色名册同步到 HeroFavor 行，避免旧存档中冗余的 `break_level` 落后。

### 游玩，Cmd 649

- ETF 请求按 `[hero_tid, flag]` 解码；当前正常客户端路径发送第二个参数 `true`。
- 英雄存在对应 `PlaygroundUnlock` 配置且英雄好感等级达到 `unlock_favour_level` 后才能游玩。
- 每次消耗 `597002 x 1`。
- 全账号每日最多 4 次，单英雄每日最多 1 次。
- 成功只增加账号 `play_times`、英雄 `day_play_times` 和累计 `all_play_times`，不直接增加好感。
- 当前 `PlaygroundAward` 三条配置的 `add_fafour` 与 `award` 都是 0/空，因此不伪造游玩奖励。
- 每日计数按 Asia/Shanghai 05:00 刷新；刷新前保留原计数，刷新后归零并写回。

### 好感等级奖励，Cmd 653

- 请求包含英雄 tid 和奖励 tid 列表。
- 奖励是否解锁以该英雄当前好感对比 `FavourLevel.need_favor` 判断。
- 当前等级 2 至 13 的配置奖励均为 `101500 x 10`。
- 领取状态写入英雄行 `got_level_award` 位图；重复领取、未解锁、未知奖励、重复请求 tid 均整笔拒绝。
- 奖励发放、位图更新和 Client/Login 状态写入处于同一事务，编码或 SQLite 失败会一起回滚。

## 持久化与 Gateway 接入

`personal-server/game/hero-favor-service.mjs` 负责：

- 解码、规范化和写回 module 10 slot 4。
- 根据全部英雄好感重算 `all_favour` 与总好感等级。
- 校验拥有英雄、礼物、游玩条件和奖励条件。
- 在事务内扣资源、发奖励、更新位图和编码响应。
- 登录时修复旧状态、同步突破等级并按 05:00 边界刷新每日计数。

`personal-server/config/hero-tables.mjs` 新增读取：

`AllFavourLevel`、`FavourConst`、`FavourGift`、`FavourBreak`、`FavourLevel`、`PlaygroundUnlock`、`PlaygroundAward`。

`personal-server/game/gateway.mjs` 在登录前调用 `ensureLoginState()`，并接入 Cmd `646`、`649`、`653`：

- 646/653 使用 protobuf 解码。
- 649 使用 ETF 解码，并兼容 ETF 库直接返回数组或返回 `{ value }` 包装。
- 成功写 `hero_favour_committed` 日志；拒绝写 `hero_favour_rejected`，不泄露完整请求。
- 返回实际响应字节和业务错误，不再落到 `LOCAL_NOT_IMPLEMENTED`。

## 验证结果

专项测试：

```powershell
cd F:\projects\FateCovenantClone\.worktree\system-training-20261031\personal-server
node --test test/hero-favor-service.test.mjs
```

- `9/9` 通过。

全量测试：

```powershell
cd F:\projects\FateCovenantClone\.worktree\system-training-20261031\personal-server
npm test
```

- `324/324` 通过，`fail 0`。

覆盖内容：

- module 10 slot 4 初始化、规范化、登录同步和 SQLite 重开。
- 送礼聚合、库存扣除、好感/等级重算、突破上限与持久化。
- 游玩解锁、资源扣除、单英雄/全账号每日上限、05:00 边界刷新。
- 等级奖励解锁、位图防重、未知奖励和事务回滚。
- 未知英雄/礼物、库存不足、状态与响应编码失败回滚。
- 真实 `loginPayload` ETF 解码。
- 真实 TCP 握手后通过 646/649/653 校验响应、错误码和后续登录。

## 证据边界与未证实事项

- “必须拥有英雄”是服务端安全推断；静态客户端通常从拥有列表中进入，但尚无专门违规请求动态抓包。
- 突破等级上限在客户端配置和 UI 中存在；整笔礼物跨过上限时全部拒绝是本实现的谨慎策略，原始服务器是否允许部分使用尚未动态验证。
- `got_level_award` 当前按奖励配置 `tid` 作位图下标，与测试中的 ETF 位序一致；原始服务端对稀疏/高位 tid 的完整位图约定尚未取得动态证据。
- 游玩 ETF 第二个布尔参数已保留并校验，但当前忽略其业务语义；正常客户端路径发送 `true`，该参数是否表示自动/确认/快速路径仍未知。
- 错误码 `308`、`309`、`310`、`311` 已通过本模块与 TCP 测试，仍需 APK 操作确认客户端提示文案与原始服务器完全一致。
- 当前配置的 `PlaygroundAward` 奖励为空，因此没有实现或伪造随机游玩奖励。
- 本次未部署、未重启实时服务，也未操作 APK/模拟器；自动化与临时 TCP 通过不等于 APK 视觉、设备可玩或长期 SQLite 实机验收。

## 设备验收待办

1. 使用隔离客户端登录后打开训练页，确认列表、好感、总等级和每日次数显示正常。
2. 分别执行送礼、游玩和等级奖励领取，核对资源、好感、位图、红点和客户提示。
3. 重启客户端和本地服务，确认 SQLite、module 10 slot 4 与登录界面状态一致。
4. 跨 05:00 或注入测试时钟验证每日次数刷新。
5. 只有完成上述 APK 实测后，才能把该模块标记为设备可玩验收完成。

## 变更文件

- `personal-server/config/hero-tables.mjs`
- `personal-server/game/gateway.mjs`
- `personal-server/game/hero-favor-service.mjs`
- `personal-server/test/hero-favor-service.test.mjs`
- `agent/workflow/training/implementation.md`
