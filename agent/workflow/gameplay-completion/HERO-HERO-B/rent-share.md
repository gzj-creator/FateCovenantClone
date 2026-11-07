# HERO-HERO 租借与分享（627/628/629/630/631/634）实现记录

负责人：HERO-HERO-B（总控本人承担本分簇）。分支 `task/HERO-HERO-B-20261107`，基线 `main@b5a44f0`。
代码：`personal-server/game/hero-rent-service.mjs`、`personal-server/config/hero-rent-tables.mjs`。

## 逐 type 状态

| type | 命令 | 状态 | 说明 |
| ---: | --- | --- | --- |
| 627 | `req_rent_out_hero` | 服务端完成（单角色真实状态） | 校验归属/星级/等级/重复/上限，写本地出租表，回 `pb_req_rent_out_back` |
| 628 | `req_rent_out_off_hero` | 服务端完成（单角色真实状态） | 下架全部出租英雄，进 `take_off_list`，无退款，回 `pb_req_rent_out_back` |
| 629 | `req_rent_in_hero` | 部分：本地清单清理可用，跨角色租入返回业务码 | 请求指向其他角色时 3001，并登记缺口 |
| 630 | `req_query_rent_out_info` | 部分：本角色出租详情可用，跨角色查询返回业务码 | 该命令在客户端是缓存请求，目标为其他玩家 |
| 631 | `req_rent_flush` | 部分：本角色出租/租入数据刷新可用，候选玩家列表缺证据 | 响应只含 `rent_in_one`/`rent_out_one`，已回真实本地数据 |
| 634 | `req_query_share_data` | 部分：本地分享缓存真实查询可用，跨角色与上传端缺口 | 数据源是服务器缓存，单角色部署无第三方数据 |

## 证据

proto（`personal-server/assets/protobuf/`，文本 proto）：

- `rent_hero.net.proto.bin`：`pb_req_rent_out{hero_uid_list, hero_index_list, rent_tid}` → `pb_req_rent_out_back{rent_out_one, res, to_client}`；`pb_req_rent{rent_tid, dest_rent_tid, index_list, rent_req_list, is_clear_cur}` → `pb_req_rent_back{rent_data, res, to_client}`；`pb_req_query_rent_hero_ret{role_rent_out_list: pb_role_rent_out_ret{role_id, rent_out}}`；`pb_rent_flush_ret{rent_in_one, rent_out_one}`。
- `rent_hero.db.proto.bin`：`pb_rent_out_hero{hero_uid, hero, power, rent_list, submit_time, index, owner_id}`、`pb_role_rent_out_one{rent_tid, rent_out_hero_list, valid_time, take_off_list}`、`pb_rent_out_off_hero{uid, rent_list}`、`pb_role_rent_one{rent_tid, rent_hero_list, valid_time}`、`pb_rent_hero{hero_uid, hero, power, owner_id, index}`。
- `hero_share.net.proto.bin`：`pb_hero_share_req{req_list: pb_hero_share_req_one{role_id, uid_list, share_tid}}` → `pb_hero_share_req_back{req_back_list: pb_hero_share_req_back_one{role_id, hero_share_list: pb_hero_share_info[]}}`；`pb_hero_share_info{share_list: pb_hero_one_share{share_type, data}, hero_uid}`。

客户端 Lua（`F:/projects/FateCovenantClone/.worktree/recruit-20261101/.scratch/out/luaproject/RentHeroMgr.lua`、`HeroShareMgr.lua`，LuaJIT 字节码，用 `tools/luajit-bytecode-parse.mjs` 解析）：

- `RentHeroMgr` 的命令入口：`ReqRentOut`(627)、`ReqRentOutOff`(628)、`ReqRentInHero`(629)、`ReqQueryRentOutInfo`(630)、`ReqFlushRentData`(631)；共享回包处理 `HandleCommonRet`(res + to_client)。
- `RentHeroMgr.LoginParse` 解码 `pb_role_rent_out_info`、`pb_role_rent_info`、`pb_rent_use_info`（Lua 槽位 login[1..3]），说明租借状态是登录模块数据。
- `RentHeroMgr.ReqQueryRentOutInfo` 通过 `cacheHandler` + `CalReqDestRoleIdL` + `HeroTable.Rent.lua_module` 组装 `req_query_rent_out_info`，日志含 “rent hero req player list is nil”，即该命令查的是**其他角色**的出租数据；本版本 `Rent` 行没有 `lua_module`，所以连目标角色列表都无法由配置算出。
- `HeroShareMgr.ReqShareData`/`GetHeroShareDataFromCache` 同样是缓存读取；`CreateShareData` 遍历 `HeroTable.DevelopInfoShare` → `HeroTable.Develop.<share_type>.lua_interface`（`HeroShare.GetShareData`/`EquipShare.GetShareData`）在**客户端**生成 `pb_hero_share_info` 后写入服务器缓存，服务端只负责存取。

配置（`HeroTable.data.lua.json.gz`，用 `readGeneratedDump` 读）：

- `Rent` 只有 1 行：`tid=2, min_star=5, min_lv=0, max_rent_in_num=5, max_rent_out_num=0, single_max_rent_num=0, rent_power_rate=1.2, rent_check=true, cache_flush_time=60, flush_type=0, reset_type=1, is_fight=false`。
- `RentRule` 只有 1 行：`tid=3, fun_open=1056, max_fight_num=1, max_num_one_fight=1, flush_type=0, fail_count=true`（战斗内使用次数限制，本簇未使用）。
- `Cell` 6 行（格子 1..6），`DevelopInfoShare` 1 行 `{share_type:[1,2,8,9,10]}`，`Develop` 行 1=`HeroShare.GetShareData`、行 2=`EquipShare.GetShareData`。

## 事实与推断

事实：

- `Rent`/`RentRule`/`Cell`/`DevelopInfoShare` 的取值如上；`rent_tid` 只有 2 一个合法值。
- 627/628 的响应结构完整携带出租清单与下架清单；629 的回包携带租入清单；631 同时回租入与出租两份数据。
- 630 与 634 在客户端都走缓存通道，语义是查其他角色。

推断（已在代码注释与本文件标注）：

- 出租有效期用 `Rent.cache_flush_time`（60）×60 秒推算 `valid_time`；配置里没有独立的“出租时长”字段，属推断。
- 630 的请求负载是“目标角色 id 列表”（`CalReqDestRoleIdL`），本实现接受 ETF 列表/单值，仅匹配本角色。
- 627 的 `hero_index_list` 按 `Cell` 行数（6）做 1..6 校验；请求没有要求英雄必须在编队内，故未强制 pre_lineup 归属。
- `pb_rent_out_hero.power` 用项目既有的兼容战力公式 `assembleHeroAttributes().power`（`attribute-service.mjs` 已注明不是原版公式）。

## 缺口（未取得证据，未伪造）

1. **跨角色出租/租入**：629 需要其他角色的 `pb_rent_out_hero` 数据；本服只有一份存档，因此对 `dest_role_id` 不等于本角色的请求返回 3001，并保留 `is_clear_cur` 的本地清理语义。
2. **630 目标角色列表**：`Rent.lua_module` 为空，配置无法算出“可租借玩家”；实现只对本角色返回真实出租详情。
3. **631 候选刷新**：客户端的刷新候选来自服务器侧的租赁匹配，配置无对应来源，回包只回本角色真实数据。
4. **634 上传端**：`HeroShareMgr.CreateShareData` 是客户端生成的二进制并写入服务器缓存，本任务范围（HeroCmd）内没有上传命令；本地缓存表 `hero_share_cache` 为空时回真实空列表，指向其他角色时回 3001。
5. **登录槽位**：`RentHeroMgr.LoginParse` 读某个模块的 login[1..3]，但模块 id 没有在可解析的 Lua 中给出（`BaseModule.New('RentHeroMgr')` 未显式带 id），本实现把权威状态放在服务端表 `hero_rent_out_state`，登录 payload 未挂租借模块——重登后客户端侧租借 UI 需要该槽位才能真正恢复。

## 复现

```powershell
cd F:\projects\FateCovenantClone\.worktree\gameplay-20261106\hero-hero2\personal-server
node --test --test-concurrency=1 test/hero-rent-service.test.mjs test/hero-rent-gateway.test.mjs
```

查看配置行：

```powershell
node "$env:TEMP\fc_tbl.mjs" Rent RentRule Cell DevelopInfoShare Develop
```

## 测试证据

- `test/hero-rent-service.test.mjs`：7 项，覆盖 627 正常/重复/不存在英雄/未知 rent_tid/越界索引/空列表、星级门槛 305、临时 SQLite 重开后的列表保持（631 读回）、628 下架与二次下架 5、629 跨角色 3001 与 `is_clear_cur` 清理、630 本角色返回与其他角色 3001、634 本地缓存命中（含 `pb_hero_share_info` 解包）与其他角色 3001、以及编码失败整体回滚（`hero_rent_out_state` 无残留行）。
- `test/hero-rent-gateway.test.mjs`：1 项端到端 TCP，临时 loopback 端口 + 真实握手 + 真实数字 type 627/628/629/630/631/634，登录 `909103` 校验模块 10 仍在登录容器里，回包按 proto 解出确认资源/状态字段。
- 相关回归：`hero-progression`、`hero-extra-service`、`hero-extra-gateway`、`recruit-service`、`hero-mastery`、`hero-handbook`、`hero-favor`、`hero-lineup`、`gameplay-gateway` 合计 47 项通过（`hero-progression + hero-extra-gateway + recruit-service` 47/47，见总控日志）。

## APK 边界

本簇只做服务端与临时 TCP 验证，未做隔离客户端 `com.jzyx.ps` 实机操作；租借 UI 是否能真正打开还取决于上面的登录槽位与跨角色数据缺口。不构成 APK 验收。

