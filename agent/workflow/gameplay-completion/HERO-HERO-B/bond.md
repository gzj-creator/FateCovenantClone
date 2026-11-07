# HERO-HERO 羁绊/变异/挂件/学院（602/654/661/672）实现记录

负责人：HERO-HERO-B。分支 `task/HERO-HERO-B-20261107`，基线 `main@b5a44f0`；工作目录 `.worktree/gameplay-20261106/hero-hero2`。

交付代码：`personal-server/game/hero-bond-service.mjs`（替换骨架，保留导出名 `createHeroBondService`）、`personal-server/config/hero-bond-tables.mjs`、`personal-server/test/hero-bond-service.test.mjs`、`personal-server/test/hero-bond-gateway.test.mjs`。未改动 `gateway.mjs`、`hero-tables.mjs`、`game-store.mjs`、`hero-progression.mjs`、`recruit-service.mjs`、`hero-extra-service.mjs` 及战斗/好友/钓鱼模块；网关侧 `heroCommandServices` 已有本服务的装配分支（`gateway.mjs` 导入并 `supports` 派发，本任务只填充服务体）。

## 逐 type 状态

| type | 命令 | 状态 | 说明 |
| ---: | --- | --- | --- |
| 602 | `req_hero_choose_school` | 服务端完成 | ETF 单值（学院索引），写入模块 10 第 2 槽 `pb_hero_draw_info` 的 2 号档 `custom_choose_index`，回 `pb_hero_recruit` |
| 654 | `req_active_fetter` | 服务端完成（客户端不可达） | PB `pb_active_fetter_req`，校验归属/羁绊行/索引/条件 101/已激活，写 `hero_bond_fetter_activation`，回空包 |
| 661 | `req_hero_diff` | 服务端完成 | ETF 单值（英雄 uid），扣 `Diff.diff_item × diff_num` 资源，置 `hero.diff=1`，回 `pb_hero_diff_back{res,new_hero}` |
| 672 | `req_hero_select_pendant` | 服务端完成 | PB `pb_hero_select_pendant_req`，校验部位/挂件配置/星级/解锁道具/`StarPendant` 行，合并写入 `hero.pendant_select_list`，回 `pb_hero_select_pendant_rsp` |

“服务端完成”指：命令可达、校验与持久化按现有证据实现、临时 TCP 回包结构正确；不含隔离客户端实机验收。

## 证据

proto（`personal-server/assets/protobuf/`）：

- `hero.net.proto.bin`：`pb_active_fetter_req{uint64 hero_tid=1, uint32 fetter_idx=2}`；`pb_hero_select_pendant_req{int64 hero_uid=1, repeated pb_hero_pendant_select pendants=2}`，`pb_hero_pendant_select{int32 index=1 // 部位 id, int64 pendant_tid=2}`，回包 `pb_hero_select_pendant_rsp{repeated pb_hero_pendant_select pendants=1}`。
- `hero.db.proto.bin`：`pb_hero_diff_back{pb_res_to_client res=1, hero new_hero=2}`；`hero` 字段 14 `uint32 mutant`（HeroMutantTable 变异 tid）、21 `uint64 diff`（全英雄变异标记，0 = 未变异）、27 `repeated pb_hero_pendant_select pendant_select_list`；`pb_hero_recruit` 字段 15 `custom_choose_index`（新手定制英雄选择第几种）。

客户端 Lua（`F:\projects\FateCovenantClone\.worktree\recruit-20261101\.scratch\out\luaproject\`，LuaJIT 字节码，经 `tools/luajit-bytecode-parse.mjs` 解析）：

- `HeroCmd.lua`：602 与 661 用 ETF 单值（`EncodeErl`，一个参数）；654 用 PB `pb_active_fetter_req`；672 的 `req_hero_select_pendant` 只在此文件定义，没有 Lua 调用方。
- 602：`HeroDataMgr:ReqHeroChooseSchool(index)` 发 ETF 单值，回调（HeroDataMgr 数组 61）执行 `SortWishHeroList(info); recruitInfos[info.tid]=info; Fire(EVT_HERO_CHOOSE_SCHOOL_FINISH)`，因此回包是 `pb_hero_recruit` 而非专用响应。`GetCurChooseSchool()` 取 `GetRecruitInfoByDrawLib(TID_QUALITY_DRAW_LIB).custom_choose_index`，`CheckIsChooseSchool()` 判 `>0`；`HeroDrawUILogic:CheckSchoolChooseOpen` 用 `SchoolChooseConst.hit` 作为开放门槛；`GetRecruitTid(lib)` 在 `Draw[lib].is_record_by_type=false` 时返回 `lib` 本身。
- 602 常量：`TID_NORMAL_DRAW_LIB=1, TID_QUALITY_DRAW_LIB=2, TID_LOVE_DRAW_LIB=3`（HeroTable.lua 数组 1437，pc 897–902）；`Draw[2]={is_record_by_type:false, draw_type:1001,...}`，故记录 tid 为 2。
- 654：`HeroFetterMgr:ReqActivateNormalFetter(heroTid, fetterIdx)` 先查 `hero:IsFetterActive(idx)` 与 `GetDefaultFetter(heroTid).gathers[idx].success`，再 `Send(HeroCmd.req_active_fetter(heroTid, fetterIdx, callback))`，回调体为 `function() end`（数组 40，RET0），客户端从不解析回包。`Hero:IsFetterActive` 是 `return true` 的空实现（Hero.lua 数组 8）；`ReqActivateNormalFetter` 在整个 Lua 工程中没有调用方；`HeroFetterMgr` 没有 `LoginParse`，hero protobuf 也没有羁绊字段 —— 说明该客户端版本没有持久化羁绊激活状态，羁绊由持有英雄/编队实时计算。
- 654 语义：`CalFetterInfo(heroTid, lineup)` → `CalGather` 遍历 `Fetter[tid].gather_args`（1 起）与对应 `gather_condition[i]`；`FetterEffectCondition[101]=HeroFetterMgr.GatherHeroCondition`（要求拥有列出的英雄），201–207 为编队内条件；`FetterEffectNormal[quality]` 是按品质的属性加成（30→700、40→1000、50→1600，属性 5/6/26/27）。
- 661：`HeroDiffMgr:ReqDiff(uid)` → `HeroCmd.req_hero_diff(uid, cb)`；响应处理（数组 7）为 `HeroDataMgr:GetHero(uid)`、`hero:InitBySrcHero(new_hero)`、`AwardKit.Parse(res)`，并触发 `EVT_HERO_DIFF_SUCCESS`。就绪判断（数组 6）：`Diff[tid]` 存在、`not hero:IsDiff()`、`FunOpen`、`DevelopUnlock`、`ResKit.CheckResEnough(diff_item, diff_num)`。`Hero:IsDiff()` 为 `diff ~= nil and diff > 0`，属性来自 `Diff[tid].attrs` 的客户端本地合并（`AttributeKit.MergeAttrByCfg`）。
- 661 与变异礼包的区别：`hero.mutant` 走 `HeroMutantMgr` 的有偿礼包路径（`pb_hero_mutant_gift_buy_back` 后 `SetMutantId(mutant)`），与 `hero.diff` 是两条链，本服务只处理 `diff`。
- 672：客户端校验在 `HeroDataUtils.TryAddPendantCfg(selectPartType, pendantTid, …)`（数组 29）：`Pendant[pendant_tid].unlock_star` 不超过英雄星级、`PendantPartTypeExist(part_type)`、`part_type == selectPartType`（否则日志 “英雄挂件部位不匹配”）。`HeroDataUtils.GetHeroPendantCfgList` 把 `StarPendant[star].pendant` 与 `hero.pendantSelectList` 合并展示；UI（`LineupMultiPendantEditForm`）实际走 `ReqUpdateLineup`。

配置（`HeroTable.data.lua.json.gz`，经 `readJsonAsset(tableAsset(...))` + `readGeneratedDump` 读取）：

- `Diff` 68 行，按英雄 tid 键：`{diff_item, diff_num:10, skill:6910001xxx, attrs:[[5,200],[6,200],[26,200],[27,200]], skill_desc, diff_name}`。
- `Pendant` 2 行：`1:{unlock_star:6, part_type:1, unlock_item:0}`、`2:{unlock_star:8, part_type:1, unlock_item:0}`。
- `StarPendant` 6 行：英雄 5040701 星级 5..10，星级 6/7 给 `pendant[1]`、星级 8 及以上给 `pendant[2]`。
- `PendantPartType` 1 行（tid 1）；`SchoolChoose` 4 行 `{1:{type:200, fix_hero:1030101}, 2:{type:100, fix_hero:2030201}, 3:{type:400, fix_hero:3030601}, 4:{type:300, fix_hero:4030501}}`；`SchoolChooseConst{1:{hit:8}}`。
- `Fetter` 79 行，例如 1040101 的 `gather_args=[[1030501],[1030301],[1030401],[4030401]]`、`gather_condition=[101,101,101,101]`。
- `Item` 533002 → type 32 → `Type[32]={res_type:2, obj_class:'HeroDiffItem'}`，即 `resources.mjs` 的 `2:HeroDiffItem` 组，可直接用 `grantResources`/`consumeResources` 处理。

## 事实与推断

事实（上面 proto/Lua/配置均经实际读取）：

- 602/661 的请求体是 ETF 单值，654/672 是 protobuf；672 的回包复用同一 `pb_hero_pendant_select` 结构。
- 654 在当前客户端无法被触发，也没有登录槽位承载羁绊状态；客户端只在“拥有列出的英雄”这一条条件上做展示计算。
- 661 的扣费口径是 `Diff[tid].diff_item × diff_num`（14 个可用英雄共用 533002，`diff_num=10`），`hero.diff` 只需大于 0 即视为已变异。
- 672 的挂件 1/2 分别要求 6 星和 8 星，部位类型都为 1（同部位互斥）。

推断（已在代码注释与本文件标注）：

- 661 的具体 `diff` 非零值：客户端只判 `>0`，proto 无枚举说明，实现取 1；真实服务器可能写入 `Diff` 行 tid，无法从现有证据判定。
- 672 的“`pendant_tid=0` 表示清空该部位”与“按部位合并而非整体覆盖”是按 `HeroDataUtils` 的合并读取逻辑推断，Lua 无调用方可直接对照。
- 602 的学院索引直接存进档位 `custom_choose_index`，不在此命令内发放 `SchoolChoose.fix_hero`；客户端该调用也不解析任何奖励字段。

## 实现要点

- `createHeroBondService({ store, codec, tables, heroTables, bondTables = readHeroBondTables(), now, random, logger })`：网关不传 `bondTables`，默认自读；`execute` 全部同步，事务由 `store.transaction` 包裹，错误经 `fail(code)` 抛 `GameError`（1 参数错误 / 5 状态冲突 / 301 资源不足 / 305 未解锁 / 3001 内容不存在）。
- 602：`positiveId` 校验索引 → 直取 `SchoolChoose` 键、回退文件顺序 → 读模块 10 第 2 槽 `pb_hero_draw_info`（与 recruit-service 同槽），按 `tid===2 || draw_lib===2` 找档位，缺失时补建 → 已选（`custom_choose_index≠0`）或 `draw_count < SchoolChooseConst.hit` 拒绝 → 写 `custom_choose_index` 并回 `pb_hero_recruit`。
- 654：校验英雄已拥有（3001）、`Fetter[hero_tid]` 存在（305）、索引不越界（3001）、条件为 101（305）、gather 英雄全部拥有（5）、未重复（5），插入 `hero_bond_fetter_activation(role_id, hero_tid, fetter_idx, activated_at)`（`store.inspect` 建表），返回空 payload。
- 661：按 uid 找英雄（3001）、`Diff` 行存在（305）、未变异（5）→ `consumeResources([[diff_item, diff_num]], 301)` → `hero.diff=1` → 回 `pb_hero_diff_back{res:{changes,is_overflow:false}, new_hero}`；编码失败整体回滚。
- 672：先规范化 pendants（部位必须存在于 `PendantPartType`，重复部位与负数 tid 拒绝），事务内按部位合并；每项校验挂件配置（3001）、`part_type===index`（1）、`unlock_star<=hero.star`（305）、`unlock_item` 持有（305）、`StarPendant` 行允许（305）；结果按部位升序写回 `hero.pendant_select_list` 并回 `pb_hero_select_pendant_rsp`。

## 缺口（未取得证据，未伪造）

1. **602 的定制抽发放**：`SchoolChoose.fix_hero` 只在客户端选中后用于后续抽卡定向，服务端未在抽卡链路里兑现（未改 `recruit-service.mjs`）；本命令只记档位。
2. **654 客户端不可达**：`ReqActivateNormalFetter` 无调用方、`IsFetterActive` 是空实现、无 `LoginParse` 与 hero 羁绊字段，故 `hero_bond_fetter_activation` 只是服务端记账，客户端 UI 不会因它改变；激活后的属性加成由客户端 `FetterEffectNormal` 本地计算。
3. **661 的技能与属性生效**：`Diff[tid].attrs`/`skill` 由客户端本地合并进属性与技能，服务端未接入战斗技能表，实际战斗数值与技能替换未验证；`FunOpen`/`DevelopUnlock` 前置未在服务端复刻。
4. **672 无调用方**：`req_hero_select_pendant` 只在 `HeroCmd.lua` 定义，UI 走编队更新，合并/清空语义为推断；挂件对属性/战斗的影响未接入。
5. **登录槽位**：672 的 `pendant_select_list` 随 hero 记录下发（hero 字段 27），登录模块无需新增；654 无槽位可用（见缺口 2）；602 复用模块 10 第 2 槽，需要客户端已存在该槽位（`recruit-service` 首抽后创建）。

## 复现

```powershell
cd F:\projects\FateCovenantClone\.worktree\gameplay-20261106\hero-hero2\personal-server
node --test --test-concurrency=1 test/hero-bond-service.test.mjs test/hero-bond-gateway.test.mjs
```

查看配置行：

```powershell
node -e "import('./config/hero-bond-tables.mjs').then(m=>{const b=m.readHeroBondTables(); console.log(JSON.stringify(b.Fetter.get(1040101))); console.log(JSON.stringify([...b.Pendant])); console.log(JSON.stringify([...b.StarPendant])); console.log(JSON.stringify([...b.SchoolChooseConst]));})"
```

## 测试证据

- `test/hero-bond-service.test.mjs`：12 项全通过。覆盖 602 正常写入 + 阈值 8 抽前拒绝 + 已选拒绝 + 重开保持 + 未知索引 3001 + 非正索引/坏 ETF/protobuf 体 1 + 编码失败回滚；654 正常激活（缺 gather 英雄 5 → 补齐成功 → 重复 5 → 重开仍 5 → 第 2 条羁绊需另 1 名 gather 英雄）+ 未拥有 3001 + 无羁绊行英雄 305 + 越界 3001 + 索引 0 为 1；661 扣 10 个 533002、`hero.diff=1`、重复 5、重开保持、未拥有 3001、道具不足 301 且不扣不写、无 `Diff` 行 305、编码失败回滚道具；672 选 2 号挂件、升星后升到 2 号、清空、重开保持、未知部位 3001、部位不匹配 1、重复部位 1、空请求 1、编码失败不落库；未知 type 返回 1。
- `test/hero-bond-gateway.test.mjs`：1 项端到端通过。临时目录 + 临时 SQLite + loopback 临时端口，真实握手（`ClientKey1234567`）、真实数字 type 602/654/661/672、登录 `909103` 校验模块 10 仍在登录容器；断言 602 回 `pb_hero_recruit.custom_choose_index=2` 且重复为 err 5、654 缺 gather 英雄 err 5 后成功且回包 0 字节、重复 5、越界 3001、661 回 `pb_hero_diff_back.res` 扣 `-10` 且 `new_hero.diff=1`、SQLite 资源归零、重复 5、672 回 `[{1,'2'}]` 且 hero 记录同步、1 号挂件在 8 星行下 305、部位 9 为 3001。
- 本次运行只用了 `hero-bond-*` 两个测试文件，未跑全量 `npm test`；未启停实时服务、未读写 `runtime.local-only.data`、未操作模拟器/ADB/APK。

## APK 边界

本簇只做服务端与临时 TCP 验证，没有隔离客户端 `com.jzyx.ps` 实机操作：602 的学院选择界面、654 的羁绊展示、661 的变异按钮与 672 的挂件界面能否真正走通，取决于上面列出的客户端可达性与槽位缺口。不构成 APK 验收。
