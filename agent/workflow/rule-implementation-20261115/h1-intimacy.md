# H1 HERO-FAVOURINTIMACY 667/670 证据与实施（2026-11-15）

批次：R1 H1，命令667、670、671。三命令均已从通用失败关闭表迁出；671随后由同一服务补成原故事终章页领取。

## 原证据

- 原表：`HeroTable.data.lua.json.gz`，SHA256 `03E95433BE6D5AF3D0AA17FB0C4D4224E67E7F342B502FDC3A3B65ABF27F2561`。恢复Base16、Item4、Level50、Const1、Cycle2、Charm30及故事相关族。
- PB：`hero_favour_intimacy.net.proto.bin`，SHA256 `DACCF5F8A4D07BC650654A2D1EE24776D120F59544F97985EB1E366AE976250E`。667请求`hero_tid/items`，响应`hero_data/all_data/res_change`；670请求`hero_tid`，响应`all_data/award`；671请求`hero_tid/page_id`。
- 客户端：`FavourIntimacyMgr.prototypes.json`，SHA256 `395845B6DBC6FF07E1B63DC5AA4BB33383BD1DC33DB39F79727461DC8BBE0485`。`IsInSameCycle`以`IsSameDay`处理cycle1、以`IsSameWeek`处理cycle2；Const为`user_date_cycle=2/user_date_times_limit=30/hero_date_cycle=1`。回包由`AwardKit.Parse`消费。
- 登录：`HeroDataMgr.ParseLogin`把模块10第12个值（slot11）解析为`pb_hero_favour_intimacy`。

## 667/670实现

- `personal-server/config/favour-intimacy-tables.mjs`读取Base/Item/Level/Const/Cycle/Charm和故事表。
- `personal-server/game/hero-intimacy-service.mjs`接入网关`heroCommandServices`。667/670是直接PB，不按ETF解码。
- 667验证英雄拥有、Base `show_entry_time`、物品和数量，在单一事务中合并成本、按Level `need_intimacy`升级、扣物并写独立亲密度状态。
- 670验证当前Level的`date_times`、用户周限30与英雄日限，发放`date_award/date_chip_num`并更新两层次数及最后时间。
- 模块10 slot11写`pb_hero_favour_intimacy`；登录时`ensureLoginState`按当前时间归一化日/周次数。
- 编码、资源或状态任一失败由SQLite事务回滚，资源不足返回301。

## R1推定

等级`award/chip_num`与约会`date_chip_num`通过667/670的`res_change/award`由客户端`AwardKit.Parse`消费；`chip_num`对应`Hero.chip`。客户端未出现独立等级奖/约会奖领取命令。上述推定未冒充原服务端函数已取得。

## 671故事奖

- 原表严格读取`StoryChapter=16`、`StoryChapterPage=86`、`StoryChapterChoice=80`、`StoryChapterPageShow=202`。每个英雄的`FavourIntimacyBase.hero_story`必须存在，每故事恰好5个choice，每个choice都有`endingType>0`且带原奖励的终章页。
- 671按`hero_tid/page_id`核英雄拥有、故事归属、页面所属choice、终章类型、choice亲密度门槛、独立`story_got_bin`位和原奖励。成功后只置该页位、发原奖并返回`pb_hero_intimacy_story_rsp`，其他页面和次数保留。
- 未知英雄/页面、越权故事、非终章页、亲密度不足、重复领取和损坏状态都在支付前err5；资源/编码失败整笔回滚。

## 验证

```powershell
node --test --test-concurrency=1 personal-server/test/hero-intimacy-service.test.mjs personal-server/test/hero-intimacy-gateway.test.mjs
```

结果9/9通过：原表、667赠礼/升级/chip、670约会奖/日周期/周周期、671终章页与独立位图、未知/未拥有/关闭入口、次数/重复拒绝前不变、编码失败回滚、SQLite重开，以及真实临时socket登录、路由、模块10 slot11持久化和重复约会拒绝。

## 验收边界

|层级|状态|
|---|---|
|原表/PB/客户端消费链|667/670/671已闭合|
|服务端事务与网关|667/670/671完成|
|登录slot11|临时TCP与重开通过|
|真实APK|未验收|
|生产TCP/生产库/部署|未验收|
|亲密度进入战斗属性|未闭合|
