# 英雄图鉴点亮、升级与拥有奖励

## 结论

本轮在 worktree `feature/system-hero-handbook-20261031` 完成 644/645/655 三条图鉴命令、登录同步和 655 奖励路径。`npm test --prefix personal-server` 303/303 通过。未部署、未操作设备、未改运行库或 APK。

## 协议与客户端消费

- 功能 ID `10009`，父登录模块 module 10 `HeroDataMgr`，slot 3 = `pb_hero_all_handbook_record`。
- `HeroDataMgr.LoginParse` 原型 3（源行 85）把 module 10 第 4 项解码为 `pb_hero_all_handbook_record`，再交给 `HeroHandbookMgr.ParseData`。
- `pb_hero_handbook_record`：`tid`、`quality`、`star`、`is_mutant`。
- `pb_hero_all_handbook_record`：`records`、`own_rev`（按 `HeroTable.Hero.index` 的位图，MSB 优先）。
- `pb_hero_handbook_raise_one_key_req`：`repeated int32 hero_id`。
- `pb_hero_handbook_raise_up_rsp`：`repeated pb_hero_handbook_record records`。
- `pb_hero_handbook_own_award_back`：`bytes rev_bin`、`pb_res_to_client res_change`。
- 644 与 655 都没有 protobuf 请求消息，参数是裸 ETF 标量；645 使用 protobuf 请求。

命令映射（`Cmd.lua.json` 根原型常量表）：

| 命令 | 类型 | 请求 | 响应 |
| --- | --- | --- | --- |
| `req_req_hero_handbook_raise_level` | 644 | 裸 ETF 英雄 tid | `pb_hero_handbook_raise_up_rsp` |
| `req_req_hero_handbook_raise_one_key` | 645 | `pb_hero_handbook_raise_one_key_req` | `pb_hero_handbook_raise_up_rsp` |
| `req_hero_handbook_own_award` | 655 | 裸 ETF 英雄 tid | `pb_hero_handbook_own_award_back` |

## 证据

- proto：`analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__protobuf.bundle/textassets/6348954308615736000-hero_handbook.net.proto.bin` 与同目录 `1066664323711193100-hero_handbook.db.proto.bin`。
- Cmd 映射：`analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_core.bundle/bytecode/Cmd.lua.json`。
- `analysis/tools/HeroHandbookMgr.lua.json`：原型 1 登录解析、20 `SeqRaiseStar`、21 领取回调、22 `ReqOwnAward`、23 `GetHeroHandbookState`、29 `RefreshAllData`、33 `GetHeroCanUpgradeCount`、45 `CheckOwnAwardCanGot`、48 `ReqRaiseStarOneKey`、53/55 记录解析、60 `GetOrCreateHandbookData`。
- `analysis/tmp/endgame-fixes/HeroCmd.json`：原型 20/21/29 是 644/645/655 的编码包装。
- `analysis/tools/HeroHandbookRaiseStarForm.lua.json`：原型 5 `_CountHandbookValue`（升星预览）。
- `analysis/tools/HeroHandbookInfoNode.lua.json`：原型 25 `_OnClick`。
- 配置：`HeroTable.data.lua.json` 的 `Hero`、`Quality`、`HandbookConstant`、`Handbook`。

## 规则

### 登录同步（ensureLoginState）

- 从 `heroInfo.hero_list` 重建缺失记录：`star=0`、`quality=HeroTable.Hero[tid].quality`、合并 `is_mutant`。
- 排除 `not_in_guide=true`；同一 tid 多行取最高 star，其次最高 quality。
- 已有 codex 进度与 `own_rev` 原样保留，不根据背包伪造“已领取”位图。
- 每次登录重写 module 10 slot 3；重复执行不新增记录。

### 644 raiseOne(heroId)

- 请求是裸 ETF 整数；`HeroHandbookRaiseStarForm._OnRaiseStarClick` 与 `HeroHandbookInfoNode._OnClick` 都调用 `HeroHandbookMgr.SeqRaiseStar(self._heroTid)`。
- 一次调用只推进一步，上限是拥有英雄的 `star` / `quality`：
  - star < 5：先升 star；
  - star == 5：按 `HeroHandbookRaiseStarForm._CountHandbookValue` 的品阶阶梯处理。quality 为 50 时同时推进品阶与 star；quality 为 60 且未到 star 上限时先升 star；其余情况升 quality；
  - star > 5：先升 star，到顶后升 quality。
- 以 2020601（初始 quality 40、上限 star 10 / quality 70）为例，连续调用得到的 (star, quality)：1/40、2/40、3/40、4/40、5/40、5/50、6/60、7/60、8/60、9/60、10/60、10/70，之后 no-op。
- 记录超过英雄实际状态时 no-op，不会倒退回写。
- 响应 `pb_hero_handbook_raise_up_rsp{records:[record]}`；未拥有或隐藏英雄返回业务错误 3001，非法 tid 返回 1。

### 645 raiseOneKey(heroIds)

- 请求 `pb_hero_handbook_raise_one_key_req.hero_id`；客户端 `ReqRaiseStarOneKey(camp)` 先按阵营收集可升级英雄 tid 列表。
- 去重；空列表或非法 id 返回 1；任一英雄未拥有返回 3001，整批不写入。
- 单事务内每个英雄推进一步，响应全部记录。

### 655 claimOwnAward(heroId?)

- `HeroCmd.req_hero_handbook_own_award` 与 644 的包装同形（`EncodeErl(R0)`），`HeroHandbookMgr.ReqOwnAward` 与 `SeqRaiseStar` 一样透传 R0；`CheckOwnAwardCanGot(tid)` 按单英雄判断 `HeroMgr.ExistHero(tid) and not own_rev:Get(HeroTable.Hero[tid].index)`。因此请求参数是英雄 tid。
- 有 payload：只领取该英雄；未拥有或隐藏返回 3001。
- 无 payload：保留本地工具/兼容路径，领取全部已拥有且未领取的英雄。
- 位图写在 `own_rev`，按 `HeroTable.Hero.index`、MSB 优先；重复领取幂等，始终返回完整 `rev_bin`。
- 奖励：客户端唯一的拥有奖励配置是 `HeroTable.HandbookConstant`（tid=1）。现版本 `award_item=0`、`award_count=0`，所以 `res_change.changes` 为空是正确的。服务按配置动态发放，非零时用 `grantResources` 发放 `award_count × 新领取数量`。
- 本版本客户端 UI 没有调用 `ReqOwnAward` 的入口；该命令按协议补齐，属于兼容实现。

## 实现位置

- `personal-server/game/hero-handbook-service.mjs`：图鉴服务本体。
- `personal-server/game/gateway.mjs`：644/645/655 路由、错误码和 `hero_handbook_committed` / `hero_handbook_rejected` 日志。
- `personal-server/config/hero-tables.mjs`：HeroTable 白名单增加 `HandbookConstant`。
- `personal-server/test/hero-handbook.test.mjs`：11 项测试。

## 验证

- `node --test personal-server/test/hero-handbook.test.mjs`：11/11。
- `node --test personal-server/test/hero-handbook.test.mjs personal-server/test/recruit-service.test.mjs personal-server/test/hero-progression.test.mjs personal-server/test/gameplay-gateway.test.mjs`：54/54。
- `npm test --prefix personal-server`：303/303，0 失败。
- 覆盖：登录建记录/保留进度与 `own_rev`、招募新英雄点亮、644 单步/上限/品阶阶梯/记录超前 no-op/编码失败回滚/重开、645 去重/原子拒绝、655 单英雄/全量/幂等/奖励配置/拒绝、SQLite 写入失败回滚、真实 `loginPayload` ETF、真实 TCP 握手后 644/645/655 不返回 `LOCAL_NOT_IMPLEMENTED`。

## 未覆盖

- 未在运行中的本机服务、模拟器、APK 或真实账号验证；没有视觉验收。
- 图鉴属性/战力的服务端重算（`GetTotalProperty`、`CalcAttrMap`、`CalcAddAttrKvL`）未实现，客户端按记录自行计算。
- 644/645 不扣资源或材料：客户端请求和配置表都没有图鉴升星成本列，没有证据支持消耗。
- `HeroLegendBook`（module 154）89801/89802/89803/89804 属另一系统，未实现。
- 655 非零奖励只在测试里用注入表验证；正式表当前是 0/0。
