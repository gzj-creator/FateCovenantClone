# B LINEUPSNAPSHOT + NEWHEROEXCLUSIVE 证据与实施（2026-11-15）

批次：R1 剩余 25 条中的 B 组，命令 `87701`、`87702`、`88963`、`88964`、`88967`。本轮独立复核原表、同版 PB、客户端生产/消费者，并把可机读的原表登记为离线配置；**五条命令的成功链都没有闭合，全部继续支付前 `GameError(5)`**。表存在、协议存在和客户端界面存在都不等于玩法完成。

## 逐 type 状态

| type | 命令 | 已闭合 | 支付前仍缺 | 状态 |
| --- | --- | --- | --- | --- |
| `87701` | `req_lineup_snapshot_hero` | 同版 PB、客户端解码与登录 host、机器人 id 编码、`RobotLineup` 2 行 | 快照写入生产者、引用计数/清理、日界、跨角色可见范围 | 仍失败关闭 |
| `87702` | `req_lineup_snapshot_list` | `pb_lineup_snapshot_list{snapshot_list}`、`key_list` 来自登录下发的快照元数据 | 与 87701 相同的生产者/引用/日界缺口 | 仍失败关闭 |
| `88963` | `req_new_hero_exclusive_choose_hero` | `Version→WishDraw→WishDrawHero` 候选推导；回包 `pb_shop_info`；状态 `pb_new_hero_exclusive_draw.draw_hero_tid/act_version` | ETF 两字段无 schema、活动实例绑定、换选限制、登录模块槽 | 仍失败关闭 |
| `88964` | `req_new_hero_exclusive_rev_story_award` | `StoryAward` 197 行、`group_version`、位索引 `tid%1000`、`tid%100` 请求分解、奖励行 | 剧情日/战斗前驱生产者、`StoryAward.fight` 语义（194/197 行为 0）、登录模块槽 | 仍失败关闭 |
| `88967` | `req_rev_new_hero_exclusive_lineup_award` | 只有 Cmd 表项；回包 `pb_res_to_client` | 无 `LineupAward` 表族、无客户端消费者、ETF 参数未知 | 仍失败关闭 |

## 原证据

### 阵容镜像（87701/87702）

- 客户端命令表：`analysis/scratchpad/time-temple-20261108/project/741419067300874000-LineupSnapshotCmd.lua.bin`，SHA256 `0ED651A3BB5D9707D71C13A2292BA9D88168CEFFCA4F462C1717B94418C3F10C`。只有 `req_lineup_snapshot_hero`、`req_lineup_snapshot_list` 两个 EncodeErl 生产者；**没有任何写入快照的请求**。
- 客户端管理器：`13321936048003377000-LineupSnapshotMgr.lua.bin`，SHA256 `A1DD70420851C356D9A91C29AAE63B732A539F145A1B423510BD87079C3D50B8`。方法 `LoginParse`（模块载荷解码为 `pb_lineup_hero_server`）、`RevLineupHeroServer`、`GetClientShowData`、`ParseRobotId`、`UpdateLineupSnapshot`。
- 原表：`7215874549648651000-LineupSnapshotTable.data.lua.bin`，SHA256 `14F2F7B74B3031264140C4FC39A8984050C95E98E4DD01724B9171EB65D646A6`。`Const` 1 行（`tid=1, lineup_hero_refresh=7`，单位未在表中声明）、`RobotLineup` 2 行（各 6 个 hero tid）。
- 同版 PB：`lineup_snapshot.db.proto.bin` SHA256 `4D037BE23F597DCA55A79B027CF1448C007BC340F59201620DA9443D8CCBCC0D`；`pb_lineup_snapshot{role_id,role_name,figure,level,lineup,power,hero_list,hero_attr,day,reference}`、`pb_lineup_snapshot_key{role_id,day,power}`、`pb_lineup_hero_server{day,hero_list{heros{tid,mutant,diff,loc,rare}}}`。`lineup_snapshot.net.proto.bin` SHA256 `A6D0C2F869ACADD34272C40363B61B006DB491140088A33C80FAB8C97D705109`。
- 引用消费者（原配置里真实存在的 key 宿主）：`common_map.db.proto.bin`、`dream.db.proto.bin`、`guild_explore.db.proto.bin`、`guild_gvg.db.proto.bin`、`guild_joint.db.proto.bin` 都以 `pb_lineup_snapshot_key` 保存镜像 key。它们证明快照是共享对象，但没有给出谁在何时创建快照、`reference` 如何增减。
- 客户端调用者：`PetPlayMgr:ReqLineup`（`analysis/.../hero/PetPlayMgr.prototypes.json` proto 21）把登录下发的 `snapshot_list` 经 `LineupSnapshotMgr:GetClientShowData` 转成 `key_list` 再请求 87702。**请求键完全来自服务端先前下发**，因此服务端没有快照时客户端也无从请求。

### 新英雄专属（88963/88964/88967）

- 客户端命令表：`10190101094397501000-NewHeroExclusiveCmd.lua.bin`，SHA256 `3D49859B89547ACE287D00ECBF81FCD93CD83BE497388640D212DA2F9763892B`。三条命令均为 EncodeErl，参数是从调用处透传的 Lua 表；没有声明 PB schema，命令审计的 `runtimeRequestEncoding` 仍为 `unverified`。
- 客户端管理器：`12545751469003895000-NewHeroExclusiveMgr.lua.bin`，SHA256 `0F3CE114896C846D7514FF214C8D54D2D29C52366C761DC189B0F4956CB38A77`。
  - `ReqChooseHero(version, heroTid, drawTid)`：先按 `version` 取版本对象，再`GetDrawTidByHeroTid(version,heroTid)` 与 `GetWishDrawHeroTid(drawTid)` 交叉校验，发送的表只有 `{version, drawTid}` 两个字段；`heroTid` 不上送。
  - `ReqStoryAward(tid)`：`field1=tid % 100`、`field2=tid`、`field3=floor(tid/100) % 10`。
  - `LoginParse` 依次解析 `pb_new_hero_exclusive_story_all`、`_draw_all`、`_gift_all` 三个登录载荷（params 下标 1/2/3），**具体模块号没有在客户端常量里出现**。
- 版本数据对象：`3997342565208695000-NewHeroActVersionData.lua.bin`，SHA256 `DE57E6390D0A68004EE724751EDF846D0DE80F840194CA5374E9C325815AD229`。`SetStoryInfo` 把 `award_rev_states` 包成 `Core.BitBlock`；`StoryDayAwardOver(tid)` = `BitBlock.Get(tid % CONST_STORY_DELTA)`；`SetStoryAwardRev(tid)` 置同一索引。
- 常量定义位置：`NewHeroExclusiveMgr` 根 chunk（prototype 101）`KSHORT 1000 → CONST_STORY_DELTA`、`KSHORT 100 → CONST_TYPE_STORY_DELTA`。两个常量不同，不能用其中一个替代另一个；这正是 `26101` 与 `26001` 能落在不同位（101 / 1）的原因。
- 原表：`2745016975394251000-NewHeroExclusiveTable.data.lua.bin`，SHA256 `F384FCD255E1E382485B7FB46E6594C43A3081DA3D71E335798828410EACDC30`。13 个族：`HeroLegendStyle 22`、`HeroExclusiveEntry 390`、`PopCustom 6`、`Decorate 75`、`WishDrawShowBubble 6`、`GiftRecommend 54`、`Gift 9`、`GiftRelease 140`、`HeroExclusiveShopVersion 63`、`Version 75`、`StoryAward 197`、`WishDrawHero 42`、`WishDraw 69`。**没有 LineupAward 族**。
- 同版 PB：`new_hero_exclusive.db.proto.bin` SHA256 `762DA92453EEFC70F1548936F755A80F3C317EEFEA844EF3F3899325B80FA09A`（`pb_new_hero_exclusive_story{bytes award_rev_states; uint64 version}`、`pb_new_hero_exclusive_draw{draw_hero_tid,act_version,rev_hero_tid_list,draw_num,draw_awards,limit_draw_num}`、`pb_new_hero_exclusive_gift`，以及三个 `*_all` 列表）；`new_hero_exclusive.net.proto.bin` SHA256 `E049DBF0F65030EA29A285D8914592D06856468C792C3DE8597D26CC355668D5` 只有 `pb_new_hero_exclusive_open_ret`，**没有三条请求的 schema**。

## 已闭合的原事实（可由机器复核）

- 每行 `Version.wish_draw_version` 都存在于 `WishDraw`（75/75，0 个悬空引用）。
- 每行 `WishDraw.hero[]` 都存在于 `WishDrawHero`（0 个悬空引用）；`WishDrawHero` 42 行只覆盖 21 个不同英雄，即同一英雄存在两条入口行。
- `StoryAward` 的位索引 `tid % 1000` 在同一 `group_version` 内唯一（含 `26/28/30` 的第二波 `101xx`）。
- `StoryAward` 197 行全部带 `award`，但 `fight` 只有 3 行非 0（`1001..1003` → `8200003..8200005`），其余 194 行为 0——剧情奖的“何时可领”不能由该列单独推出。
- 27 个 `Version` 的 `wish_draw_version` 命中某个 `StoryAward.group_version`，其余版本没有剧情奖组。

## 为什么仍然失败关闭

- `87701/87702`：本服没有任何代码写 `pb_lineup_snapshot`，也没有任何功能把 `pb_lineup_snapshot_key` 当作真实引用保存。若按请求现场复制当前阵容，就是把“当前阵容”伪装成历史快照，直接违反 R1「不能读取当前阵容伪称历史」。
- `88963`：候选集合可以推导，但请求只有两个 opaque ETF 字段、缺活动实例绑定；更关键的是换选语义（是否可改选、改选是否清空 `rev_hero_tid_list`/抽取进度）在客户端和表中都没有定义。凭“选择不发英雄”就写 `draw_hero_tid` 仍可能覆盖原版不可逆选择。
- `88964`：领取键（`tid%1000`）与奖励行已闭合，但“这一天/这一章何时解锁”没有生产者；`StoryAward.fight` 只覆盖 3 行，其余 194 行没有任何前驱字段。放行任意已存在的 `StoryAward` 会让玩家一次领完整个 version。
- `88967`：配置里没有阵容奖族，客户端也没有任何消费者（全仓只有 `NewHeroExclusiveCmd` 出现 `lineup_award`），奖励行和资格都无从谈起。
- 三者共同的登录投影缺口：`pb_new_hero_exclusive_{story,draw,gift}_all` 的真实模块号未定位，服务端即使改了状态也没有已证的登录 slot 可投影。

## 本轮实现（离线证据登记，不是成功链）

- `personal-server/assets/tables/LineupSnapshotTable.data.json.gz`（152 B，由上述原表行级转储生成，`Const`/`RobotLineup` 原样保留）。
- `personal-server/assets/tables/NewHeroExclusiveTable.data.json.gz`（15,273 B，13 族原样保留，未补 `LineupAward`，未补剧情日字段）。
- `personal-server/config/lineup-snapshot-tables.mjs`：严格行数、tid、6 英雄列表校验；`gameplayReady=false`，`gameplayBlockers` 固定列出生产者/引用/日界/机器人模板四条缺口。
- `personal-server/config/new-hero-exclusive-tables.mjs`：13 族行数、`Version→WishDraw→WishDrawHero` 引用、`StoryAward` 位索引唯一性与奖励二元组校验；导出 `drawCandidates(version)`、`storyAwardGroup(version)`、`storyAwardBitIndex(tid)`、`STORY_DELTA=1000`/`TYPE_STORY_DELTA=100`；`gameplayReady=false`。
- 两个配置都**没有注册到网关或命令派发**，因此不会改变任何运行时行为；`r1-fail-closed-command-service.mjs` 中五个 type 原样保留。

## 验证

```powershell
node --test --test-concurrency=1 personal-server/test/lineup-snapshot-tables.test.mjs personal-server/test/new-hero-exclusive-tables.test.mjs
node --check personal-server/config/lineup-snapshot-tables.mjs
node --check personal-server/config/new-hero-exclusive-tables.mjs
git diff --check
```

实际结果：专项 9/9 通过（`LineupSnapshot` 3 项、`NewHeroExclusive` 6 项），`node --check` 两文件通过，`git diff --check` 通过。

真实临时 TCP、SQLite 变更/重开、登录同步均**未验收**：本组没有任何成功路径，强行跑一条“成功”TCP 只会证明伪造链可用。失败关闭本身由现存 `r1-fail-closed-command-service` 专项和派发审计覆盖，归总控在合并后统一复跑。

## 给总控的共享文件改动建议

1. `personal-server/game/r1-fail-closed-command-service.mjs`：**不要删除任何一条**。建议把原因文本换成本轮已定位的精确缺口（原文 → 新文）：
   - `87701: 'HERO-LINEUPSNAPSHOT: snapshot creation, freeze identity and visibility are not recovered'` → `'HERO-LINEUPSNAPSHOT: no pb_lineup_snapshot writer, reference and day/visibility producer (B-R1-87701)'`
   - `87702: 'HERO-LINEUPSNAPSHOT: snapshot-day boundary and frozen historical projection are not recovered'` → `'HERO-LINEUPSNAPSHOT: same missing producer as 87701; key_list is server-fed (B-R1-87702)'`
   - `88963: 'HERO-NEWHEROEXCLUSIVE: legal candidate set and change-selection limits are not recovered'` → `'HERO-NEWHEROEXCLUSIVE: ETF field schema, instance binding and re-selection semantics unrecovered; candidates derive from Version/WishDraw (B-R1-88963)'`
   - `88964: 'HERO-NEWHEROEXCLUSIVE: story-version predecessor and award mapping are not recovered'` → `'HERO-NEWHEROEXCLUSIVE: story award rows and tid%1000 bits are recovered, but the day/fight unlock producer is not (B-R1-88964)'`
   - `88967: 'HERO-NEWHEROEXCLUSIVE: lineup-award eligibility and original award rows are not recovered'` → `'HERO-NEWHEROEXCLUSIVE: no LineupAward table family or client consumer exists; award rows unknown (B-R1-88967)'`
2. `personal-server/config/command-dispatch-audit.json`：本组五个 type 的 owner 应保持 `r1FailClosed`；合并后重跑 `npm --prefix personal-server run check:command-dispatch` 即可，无需手改。
3. `docs/gameplay-operations/09-defects-and-acceptance.md`：建议在 R1 台账新增一行「B 组 87701/87702/88963/88964/88967：原表与协议已登记（`LineupSnapshotTable`、`NewHeroExclusiveTable`），成功链仍失败关闭，缺口见本记录」。
4. `docs/gameplay-operations/system-rulebooks/heroes-equipment.md`：建议在 `lineup-snapshot` 行补「PB 已核：`pb_lineup_snapshot{role_id,day,power,reference}`、`pb_lineup_hero_server`；原配置中 `common_map/dream/guild_explore/guild_gvg/guild_joint` 以 `pb_lineup_snapshot_key` 引用」；在 `new-hero-exclusive` 行补「`CONST_STORY_DELTA=1000`、`CONST_TYPE_STORY_DELTA=100`、候选推导 `Version→WishDraw→WishDrawHero`、表内无 LineupAward 族」，两者仍保留“需恢复”列。
5. `agent/workflow/rule-implementation-20261115/implementation.md`：建议追加 B 组小节，引用本文件，并把通用失败关闭集合保持为 25 条（本组零移出）。

## 验收分层

| 层 | 结果 |
| --- | --- |
| 原证据已闭合 | 表族行数、SHA256、PB 形状、位索引常量、候选推导 |
| R1 推定 | 本组未新增推定；`lineup_hero_refresh=7` 的单位仍未推定 |
| 服务端完成 | 未完成（五条全部失败关闭） |
| 离线 TCP | 未验收（无成功路径） |
| 存档/重开 | 未验收（无状态写入） |
| APK | 未验收 |
| 生产 TCP / 生产库 | 未读写、未验收 |
| 部署 | 未部署 |

本轮未启停实时服务、未读写生产库、未操作模拟器/ADB/APK、未部署。
