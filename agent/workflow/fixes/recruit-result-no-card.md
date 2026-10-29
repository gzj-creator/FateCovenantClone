# R1 招募完成后没有角色卡

状态：服务端根因已修复；组件测试与临时 TCP 集成通过，**真实 APK 复验待用户再次招募**（2026-10-30）。

工作分支：`feature/recruit-hero-grant`  
工作目录：`F:\projects\FateCovenantClone\.worktree\recruit-hero-grant`

## 现象与证据

- 用户 2026-10-30 00:19 在隔离客户端 `com.jzyx.ps` 普通招募 1 次，打开 `HeroGetDisplayForm` 并跳过后，`HeroDrawResultShowForm` 无角色卡。
- 服务端实际已发放：`analysis/experiments/private-server-20261025/p3/runtime.local-only.data/events.jsonl` 的 `2026-10-29T16:25:21.902Z` 记录 `recruit_committed`，type 601、lib 1、count 1、`newHeroes:["1030101"]`、quality 50、guaranteed false。
- SQLite：`heroes` 有 uid=4030802、tid=1030101、level=1、star=0；`resources` 有英雄碎片 tid=21300104、amount=1。
- 客户端日志 `analysis/experiments/private-server-20261025/p3/recruit-no-hero.local-only.log:181`：

```text
XLua.LuaException: c# exception:System.ArgumentException: executeCount = 0
[C]: in function 'Repeat'
input\HeroDrawResultShowForm.lua.txt:395: in function 'ShowDrawCard'
input\HeroDrawResultShowForm.lua.txt:311: in function 'Refresh'
input\HeroDrawUILogic.lua.txt:444: in function 'ShowDrawResult'
input\HeroDrawUILogic.lua.txt:701: in function 'OpenResultForm'
input\HeroGetDisplayForm.lua.txt:287: in function '_Close'
```

## 根因

客户端 Lua 的招募结果卡不是直接按英雄对象生成，而是按碎片奖励换算：

- `HeroDrawResultShowForm.Refresh`（L309）读取 `showParams.outOfOrderAwardL`；`ShowDrawCard`（L395）对该数组调用 `form:Repeat(#awards, ...)`，数组为空时抛出 `executeCount = 0`。
- `HeroDrawUILogic.HandleDrawOperateData`（L288-289）用 `HeroDrawUILogic.FilterAwards(drawBackData.drawLib, drawResL, true)` 生成 `outOfOrderAwardL`。
- `HeroDrawUILogic.FilterAwards`（L487-511）对 `resType == TID_RES_TYPE_CHIP` 的奖励执行：
  `n = award.resObj.num / HeroDrawUILogic.GetDrawHeroChipConvertCnt(drawLib, heroTid)`，然后 `for i = 1, n do table.insert(result, AwardKit.CreateAward(tid, 1)) end`。
- `GetDrawHeroChipConvertCnt`（L572-580）对新转化库（普通/高级/友情/心愿，含 lib 1）使用 `HeroTable.Quality(quality).convert_piece_new`。
- 配置：1030101 的 quality=50，`convert_piece_new=60`；旧服务端对新英雄只发 1 个碎片，`n = 1 / 60 = 0.016`，`for i = 1, 0.016` 执行 0 次，结果页数组为空并崩溃。
- 旧服务端对重复英雄已经按 `convert_piece_new` 发放碎片，所以重复英雄能正常显示 1 张卡；这反向验证了“每个抽到的英雄 = 1 个 convert_piece_new 碎片包”的客户端语义。

## 修复

`personal-server/game/recruit-service.mjs`：

- `draw()` 中所有抽到的英雄，无论新英雄还是重复英雄，都发放 `Quality.convert_piece_new` 个该英雄碎片。
- 新英雄仍设置 `change.extra = encodeEtfInteger(result.tid)` 并写入 `hero_list`；客户端 `HeroMgr.HandleNewHeroes` 通过 ETF 编码的 extra 创建英雄。
- `decompose_args` 改为 `[]`。原服 601 抓包只有 `res`/`recruit_info`，没有 `decompose_args`；客户端 `HeroDrawMgr` 会把 `decompose_args` 逐项追加为额外 award，而 `res.changes` 已经能生成结果卡，保留该字段会重复出卡。
- 仅修改服务端，不改 APK、客户端资源或加密；不需要 APK 快照。

## 测试

- `personal-server/test/recruit-service.test.mjs`：新英雄碎片数断言为 `convert_piece_new`（1010101、quality 30 → 10），并断言 `diff_num / convert_piece_new == 1`、`decompose_args == []`；重复英雄仍为 `convert_piece_new`。
- `npm test --prefix .\personal-server`：worktree 内 **157/157 通过**。
- `personal-server/test/gameplay-gateway.test.mjs` 的真实 loopback `600 -> 601` 流程通过；该流程只校验抽卡响应可解码和资源扣除，不校验碎片 bundle 大小。

## 边界与待验

- 修复只改变“每次抽到英雄时发放给客户端的碎片 bundle 大小”，不改变抽卡概率、保底、英雄品质或已有存档。
- 失败的那次抽卡已经给账号留下了 1030101 和 1 个碎片；这 1 个碎片保留，不删除。下一次抽到已拥有英雄会获得完整 `convert_piece_new` 碎片并显示 1 张卡。
- 这不是客户端显示层的临时绕过；未在真实 APK 上再次招募并确认结果页出现角色卡前，不标记“可玩验收通过”。

## 复现

```powershell
cd F:\projects\FateCovenantClone\.worktree\recruit-hero-grant
npm test --prefix .\personal-server
```
