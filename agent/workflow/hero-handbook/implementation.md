# 英雄图鉴点亮

## 协议与客户端消费

- 英雄图鉴功能 ID 为 `10009`，不是 module 137 的陈列室；父登录模块是 module 10 `HeroDataMgr`。
- `HeroDataMgr.LoginParse` 原型 3（源行 85）把 module 10 的第 4 项解码为 `pb_hero_all_handbook_record`，随后交给 `HeroHandbookMgr.ParseData`。本地存储数组下标为 3。
- `HeroHandbookMgr.ParseData` 解码 `records` 和 `own_rev`；`GetHeroHandbookState` 在 record 不存在时返回 `UnActive`。因此只填 `pb_hero_info.hero_list` 不会点亮服务端登录响应中的图鉴。
- record 字段为 `tid`、`quality`、`star`、`is_mutant`。客户端以 `HeroTable.Hero.not_in_guide` 区分玩家图鉴和内部角色。

## 实现

- 新增 `personal-server/game/hero-handbook-service.mjs`。登录响应构建前，从关系型 `heroInfo.hero_list` 重建 module 10 / slot 3。
- 排除配置缺失及 `not_in_guide=true` 的角色。同一 `tid` 有多条记录时选择更高 `star`；星级相同时选择更高 `quality`，并合并已有的变异状态，避免去重时降级或误删标记。
- 招募、邮件、活动或其他入口只要最终写入同一 `heroInfo.hero_list`，下次登录就会点亮；SQLite 重开后仍可重建。
- 已有 `own_rev` 原样保留。点亮流程不根据角色背包伪造“拥有奖励已领取”位图。
- `loginPayload()` 在 `recruit.ensureLoginState()` 之后执行图鉴同步，真实登录 ETF 同时包含既有招募状态修复和生成后的图鉴槽位。

## 验证

- `node --test test/hero-handbook.test.mjs`：3/3 通过。覆盖既有英雄点亮、隐藏角色排除、重复记录合并、`own_rev` 保持、SQLite 重开、招募新英雄后点亮，以及真实 `loginPayload` ETF 的 module 10 / slot 3 反向解码。
- `node --test test/hero-handbook.test.mjs test/recruit-service.test.mjs test/hero-progression.test.mjs test/gameplay-gateway.test.mjs`：24/24 通过。
- 完整 `npm test`：179 项中 166 通过、13 失败。失败均属既有 voucher、month-permit、recommend-gift 金额配置差异，与本次图鉴改动无关；图鉴专项和相关回归均通过。
- 本轮为服务端组件与协议级验证。尚未覆盖到正在运行的本机服务，也未取得 APK 内视觉验收，不能标记为设备可玩验收。本轮未修改 APK。
- 644 图鉴升级、645 一键升级、655 拥有奖励领取不在“点亮”实现范围内；未用推测规则补接口。
