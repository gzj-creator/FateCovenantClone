# 英雄图鉴覆盖表

状态：644 / 645 / 655 与登录同步已在 `feature/system-hero-handbook-20261031` 实现并通过服务测试。本轮只改 worktree，未部署、未操作设备、未改运行库或 APK。

## 命令覆盖

| 命令 | 名称 | 请求 | 响应 | 状态 | 证据 |
| --- | --- | --- | --- | --- | --- |
| 644 | `req_req_hero_handbook_raise_level` | 裸 ETF 英雄 tid（无 pb 请求消息） | `pb_hero_handbook_raise_up_rsp` | 已实现 | `Cmd.lua.json` 常量表；`HeroCmd.lua.json` 原型 20；`HeroHandbookMgr.lua.json` 原型 20 `SeqRaiseStar` |
| 645 | `req_req_hero_handbook_raise_one_key` | `pb_hero_handbook_raise_one_key_req.hero_id` | `pb_hero_handbook_raise_up_rsp` | 已实现 | `Cmd.lua.json`；`HeroCmd.lua.json` 原型 21；`HeroHandbookMgr.lua.json` 原型 48 `ReqRaiseStarOneKey` |
| 655 | `req_hero_handbook_own_award` | 裸 ETF 英雄 tid（无 pb 请求消息；无 payload 时按兼容路径领取全部） | `pb_hero_handbook_own_award_back` | 已实现 | `Cmd.lua.json`；`HeroCmd.lua.json` 原型 29；`HeroHandbookMgr.lua.json` 原型 22 `ReqOwnAward`、原型 45 `CheckOwnAwardCanGot` |

## 登录同步

- module 10 `HeroDataMgr`，slot 3 = `pb_hero_all_handbook_record{records, own_rev}`。
- 缺失记录按拥有英雄补齐：`star=0`、`quality=HeroTable.Hero[tid].quality`、合并 `is_mutant`。
- 排除 `HeroTable.Hero.not_in_guide=true`；同 tid 多行取最高 star，其次最高 quality。
- 已有 codex 进度与 `own_rev` 原样保留，幂等。

## 明确不在本轮范围

- `HeroLegendBook`（module 154）的 89801 `handle_star`、89802 `handle_bless`、89803 `handle_level`、89804 `handle_stage` 是另一套系统，未实现，仍返回 `LOCAL_NOT_IMPLEMENTED`。
- 图鉴属性/战力的服务端重算（`GetTotalProperty`、`CalcAttrMap`、`CalcAddAttrKvL`）未实现；客户端按记录自行计算。
- 644/645 的资源或材料消耗：客户端 `SeqRaiseStar` / `ReqRaiseStarOneKey` 都不携带消耗，配置表也没有图鉴升星成本列，服务端不扣资源。
- 655 的 `res_change` 目前为空：`HeroTable.HandbookConstant`（tid=1）在现版本是 `award_item=0`、`award_count=0`。服务已按该配置动态发放，非零配置时走 `grantResources`。
- 图鉴 UI 在本版本没有调用 `ReqOwnAward` 的入口（`HeroHandbookInfoNode._OnClick` 只调 `SeqRaiseStar`），655 属于协议兼容实现。
- 未在运行中的本机服务、模拟器、APK 或真实账号验证；没有视觉验收。

## 验收命令

- `node --test personal-server/test/hero-handbook.test.mjs`：11/11。
- `node --test personal-server/test/hero-handbook.test.mjs personal-server/test/recruit-service.test.mjs personal-server/test/hero-progression.test.mjs personal-server/test/gameplay-gateway.test.mjs`：54/54。
- `npm test --prefix personal-server`：303/303，0 失败。

