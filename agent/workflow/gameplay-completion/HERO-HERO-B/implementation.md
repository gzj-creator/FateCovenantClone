# HERO-HERO 卡补齐实施记录（剩余 18 条命令）

日期：2026-11-07。分支 task/HERO-HERO-B-20261107，worktree .worktree/gameplay-20261106/hero-hero2，起始基线 main@b5a44f0，提交前已 rebase 到 main@8dbceb2（含 SOC-MSG 通道与招募统计 ETF 推送）。
范围：HERO-HERO 卡 41 条命令里此前未路由的 18 条（602、627–631、634、635、637、641、651、652、654、656、661、666、672、673）。其余 23 条已有实现，本轮不动。
分簇详表：rent-share.md（627/628/629/630/631/634）、develop.md（637/641/656/666）、bond.md（602/654/661/672）、support.md（635/651/652/673）。

## 交付结构

- personal-server/game/gateway.mjs：新增 heroDevelop / heroBond / heroSupport / heroRent 四个服务与单一派发分支（heroCommandServices），登录时统一调用 ensureLoginState。全卡只有这一处共享改动。
- 四个服务模块：hero-develop-service.mjs、hero-bond-service.mjs、hero-support-service.mjs、hero-rent-service.mjs。
- 四个配置模块：config/hero-develop-tables.mjs（Cell、TrialTask）、config/hero-bond-tables.mjs（SchoolChoose 等）、config/hero-support-tables.mjs（DrawProgAward、DrawExchangeLineup、NormalDrawExchangeLineup）、config/hero-rent-tables.mjs（Rent、RentRule、Cell、Develop、DevelopInfoShare）。没有改 config/hero-tables.mjs。
- personal-server/game/recruit-service.mjs：移除 651/652/673 的空回包占位与 supports 项。网关的 recruit 分支在 heroCommand 分支之前，不移除这三条就永远轮不到支撑簇。
- 服务内建表：hero_rent_out_state、hero_share_cache（租借/分享）、hero_bond_fetter_activation（羁绊）、hero_draw_support（阵容支持）。均按 role_id 建主键、由服务内 ensureTables 创建，未改 game-store.mjs 迁移。

## 逐 type 状态（本轮 18 条）

| type | 命令 | 模块 | 状态 | 要点与缺口 |
| ---: | --- | --- | --- | --- |
| 602 | req_choose_hero_school | hero-bond-service | 服务端完成 | 按 SchoolChoose 行与 SchoolChooseConst.hit=8 校验后写模块 10 槽位 2 的 custom_choose_index，回 pb_hero_recruit；fix_hero 定向发放未在抽卡链路兑现 |
| 627 | req_rent_out_hero | hero-rent-service | 服务端完成（单角色真实状态） | 归属/星级/等级/重复/上限校验后写 hero_rent_out_state，回 pb_req_rent_out_back |
| 628 | req_rent_out_off_hero | hero-rent-service | 服务端完成（单角色真实状态） | 下架全部出租英雄进 take_off_list，无退款 |
| 629 | req_rent_in_hero | hero-rent-service | 部分：本地清理可用，跨角色回业务码 | 指向其他角色时 3001，is_clear_cur 的本机清理生效 |
| 630 | req_query_rent_out_info | hero-rent-service | 部分：本角色详情可用 | 该命令在客户端查其他角色；Rent.lua_module 为空，配置算不出可租玩家列表 |
| 631 | req_rent_flush | hero-rent-service | 部分：本角色出租/租入刷新可用 | 回包只含 rent_in_one/rent_out_one；候选玩家列表缺证据 |
| 634 | req_query_share_data | hero-rent-service | 部分：本服缓存真实查询 | hero_share_cache 命中真实返回，其他角色 3001；上传端在客户端侧，本任务无该命令 |
| 635 | req_rev_recruit_progress_award | hero-support-service | 服务端完成（业务码 + 配置缺口） | HeroTable.DrawProgAward 本版本 0 行，无奖励配置，回 3001 并登记 hero_draw_progress_award_unconfigured |
| 637 | req_develop_submit_hero | hero-develop-service | 服务端完成 | 格子校验、占用交换/替换、等级随格子同步，回 pb_hero_submit_ret；站位交换细节未完全还原 |
| 641 | req_develop_hero_trial | hero-develop-service | 服务端完成（强推断） | star=5 + TrialTask 达标 + 碎片/觉醒石校验（碎片取 Quality.trial_piece_num，觉醒石取 UpStarCost[品质*100+5]，与 640 同源），品质升档、星级 +1，基线写模块 10 槽位 6 |
| 651 | req_draw_support_lineup | hero-support-service | 服务端完成（单角色真实状态） | 校验 DrawExchangeLineup / NormalDrawExchangeLineup 行后写 hero_draw_support，同库重复上报覆盖 |
| 652 | req_draw_get_support_data | hero-support-service | 服务端完成（单角色真实状态） | role_support 为本角色选择，server_support 为本服角色计数；不含跨服聚合 |
| 654 | req_active_fetter | hero-bond-service | 服务端完成（客户端不可达） | 校验归属、Fetter 行、索引、条件 101、重复激活，写 hero_bond_fetter_activation |
| 656 | req_develop_batch_submit_hero | hero-develop-service | 服务端完成 | 整批先校验后应用，任一非法项整批回滚，重复 tid 判 1 |
| 661 | req_hero_diff | hero-bond-service | 服务端完成 | 扣 Diff.diff_item × diff_num（533002 × 10）后置 hero.diff=1，回 pb_hero_diff_back；编码失败整体回滚 |
| 666 | req_one_key_develop | hero-develop-service | 服务端完成 | 空列表等于全部已拥有英雄，循环升星到上限，5 星试炼门槛停手，成功/失败分列 |
| 672 | req_hero_select_pendant | hero-bond-service | 服务端完成（无调用方） | 按部位合并写 hero.pendant_select_list（hero 字段 27），pendant_tid=0 清空该部位 |
| 673 | req_draw_marquee | hero-support-service | 服务端完成（真实空集） | 单角色部署没有其他玩家的抽卡播报，回 0 条空字节 |

## 已有实现、本轮未改动的 23 条

599 / 600（抽卡券购买）、601（抽卡）在 recruit-service；614（使用碎片）、647（拜访）、663 / 664 / 665（重铸）在 hero-extra-service；636（升级）、638（突破）、639（普通升星）、640（高级升星）在 hero-progression；642 / 643 / 657 / 658（心愿与额外心愿的选择、移除）、662（抽卡成就奖励）在 recruit-service；644 / 645 / 655（图鉴升级与奖励）在 hero-handbook-service；646 / 649 / 653（好感赠送、互动、等级奖励）在 hero-favor-service。

## 证据

- proto：personal-server/assets/protobuf/ 下的文本 proto（hero_draw、rent_hero、hero_share、hero_develop、hero_fetter 等）。651/652 的请求并没有对应 message，客户端用普通 ETF 元组发送。
- 客户端 Lua：F:/projects/FateCovenantClone/.worktree/recruit-20261101/.scratch/out/luaproject/（LuaJIT 字节码，用 tools/luajit-bytecode-parse.mjs 解析）。HeroCmd.lua 的注册表是 type 与请求名的唯一来源；四种 ETF 型请求函数只有 1 个实参、没有字段名。
- 配置：HeroTable.data.lua.json（readGeneratedDump 读）。Rent 1 行（tid=2、min_star=5、cache_flush_time=60）、RentRule 1 行（fun_open=1056）、Cell 6 行、TrialTask 180 行（key=hero_tid*100+stage）、DevelopConst.keep_trial_type=6702、SchoolChoose 4 行 + SchoolChooseConst.hit=8、Fetter 79 行、Diff 68 行、Pendant 2 行、StarPendant 6 行、DrawExchangeLineup 4 行、NormalDrawExchangeLineup 4 行、DrawProgAward 0 行。
- 651/652/673 在客户端没有 manager/UI 调用方；673 的真正消费者是 HundredDrawActMgr（117005，属 DRAW-HUNDREDDRAWACT 任务）。654 的 ReqActivateNormalFetter 无调用方，Hero:IsFetterActive 是 return true 的空实现；672 只有定义无调用方。

## 测试与证据

- 本轮新增 39 项测试：test/hero-rent-service.test.mjs 7 + test/hero-rent-gateway.test.mjs 1；test/hero-bond-service.test.mjs 12 + test/hero-bond-gateway.test.mjs 1；test/hero-support-service.test.mjs 7 + test/hero-support-gateway.test.mjs 1；test/hero-develop-service.test.mjs 9 + test/hero-develop-gateway.test.mjs 1。
- 每个分簇的服务测试覆盖正常路径、非法参数、资源不足、重复操作、编码/写入失败回滚、临时 SQLite 重开保持；网关测试是临时 loopback 端口 + 真实握手 + 真实 909103 登录 + 真实数字 type + SQLite 状态断言。
- hero 相关全量回归 142 项、142 通过、0 失败（含 hero-progression、hero-extra、hero-favor、hero-handbook、hero-lineup、hero-mastery、hero-skill-gates、四个分簇、recruit-service、gameplay-gateway），日志 analysis/test-runs/hero-hero-b/hero-suites-full.log（该轮在 rebase 到 main@8dbceb2 之后执行）。
- 未跑全量 npm test（留给总控合并后统一跑）；未启停实时服务、未读写 runtime.local-only.data、未操作模拟器/ADB/APK、未连原服。

## 剩余证据缺口汇总

1. 635：DrawProgAward 为 0 行，奖励形状与领奖位字段都取不到；服务端只回业务码。
2. 租借跨角色：629/630/631 依赖其他角色的出租数据，Rent.lua_module 为空，配置算不出可租玩家；634 的上传端在客户端侧。
3. 租借登录槽位：RentHeroMgr.LoginParse 读 login[1..3]，但模块 id 在可解析 Lua 里没有给出，重登后客户端侧租借 UI 不会恢复。
4. 651/652/673：客户端不发这三条命令、请求无字段名；652 的 server_support 不含跨服聚合，673 的跑马灯在单角色部署恒为空。
5. 654 / 672：客户端不可达，服务端表只是记账；羁绊与挂件对属性/战斗的影响未接入。
6. 641：品质升一档 + 星级 +1 属强推断（客户端直读回包、HeroTrailMgr 预览用 star+1），已收敛在 applyTrialOutcome() 便于修正；6702 任务口径不可复现（TaskTable.Type[6702].progress_fun=171），当前以“星级总数减去模块 10 槽位 6 基线”近似；试炼属性加成属 CORE-ATTR。
7. 637：Cell 4–6 的 assert（MethodScript 377309400004 / 955132601046）本地无法求值，登录补状态只自动开 1–3 格；站位交换细节未完全还原。

## 复现

cd F:/projects/FateCovenantClone/.worktree/gameplay-20261106/hero-hero2/personal-server
node --test --test-concurrency=1 test/hero-rent-service.test.mjs test/hero-rent-gateway.test.mjs test/hero-bond-service.test.mjs test/hero-bond-gateway.test.mjs test/hero-support-service.test.mjs test/hero-support-gateway.test.mjs test/hero-develop-service.test.mjs test/hero-develop-gateway.test.mjs

分簇配置速查：node "$env:TEMP/fc_tbl.mjs" Rent RentRule Cell SchoolChoose TrialTask DrawExchangeLineup DrawProgAward

## APK 边界

全部分簇只做服务端与临时 TCP 验证，没有隔离客户端 com.jzyx.ps 实机操作，也没有真实设备验收。状态一律记“服务端完成带证据缺口”，不构成 APK 验收。
