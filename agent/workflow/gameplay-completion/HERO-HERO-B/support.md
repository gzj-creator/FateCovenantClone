# HERO-HERO 抽卡支持簇（635/651/652/673）实现记录

负责人：HERO-HERO-B（总控本人承担本分簇）。分支 task/HERO-HERO-B-20261107，基线 main@b5a44f0。
代码：personal-server/game/hero-support-service.mjs、personal-server/config/hero-support-tables.mjs；同时把 recruit-service.mjs 里 651/652/673 的空回包占位移除（原先它抢路由，本簇永远收不到请求）。

## 逐 type 状态

| type | 命令 | 状态 | 说明 |
| ---: | --- | --- | --- |
| 635 | req_rev_recruit_progress_award | 服务端完成（业务码 + 配置缺口） | HeroTable.DrawProgAward 本版本 0 行，没有奖励配置；实现按“无配置”回 3001 并记录 hero_draw_progress_award_unconfigured，不伪造奖励 |
| 651 | req_draw_support_lineup | 服务端完成（单角色真实状态） | 校验 DrawExchangeLineup / NormalDrawExchangeLineup 行后写入 hero_draw_support，同一抽卡库重复上报覆盖，回 pb_draw_support_back |
| 652 | req_draw_get_support_data | 服务端完成（单角色真实状态） | 从 hero_draw_support 读真实聚合：role_support 为本角色自己的选择，server_support 为本服所有角色的计数 |
| 673 | req_draw_marquee | 服务端完成（真实空集） | 跑马灯是其他玩家的抽卡播报，单角色部署没有数据源，回真 0 条（data 为空字节），日志 hero_draw_marquee_empty |

## 证据

proto（personal-server/assets/protobuf/，文本 proto）：

- hero_draw.net.proto.bin：pb_rev_draw_progress_award_back{res, new_recruit}（635 回包）、pb_draw_support_back{role_support, server_support}（651/652 回包）、pb_draw_marquee_req{draw_lib, param} → pb_draw_marquee_rsp{data}（673）。
- hero_draw.db.proto.bin：pb_draw_wish_list{support_list: pb_draw_wish_support[]}、pb_draw_wish_support{lineup_type, support_num}。lineup_type 是 uint64（解包为十进制字符串），support_num 是 uint32。
- 651/652 的请求在这套 proto 里没有对应 message（客户端用普通 ETF 元组发送），所以按 ETF 解码：[draw_lib, lineup_type]、单值、对象三种形态都接受。

客户端 Lua（F:/projects/FateCovenantClone/.worktree/recruit-20261101/.scratch/out/luaproject/HeroCmd.lua，LuaJIT 字节码，用 tools/luajit-bytecode-parse.mjs 解析）：

- 注册表里对应的请求函数：HeroCmd.req_rev_recruit_progress_award（proto 11）、req_draw_support_lineup（proto 25）、req_draw_get_support_data（proto 26）、req_draw_marquee（proto 40）。
- 三个 ETF 型函数（proto 11/25/26）指令形状完全一致：取常量名 → 调 EncodeErl(name, ...)，只有 1 个实参、没有字段名，请求结构无法从客户端侧还原。
- 没有任何 manager/UI 调用方：全部 Lua 工程里未出现对 ReqDrawSupportLineup / ReqDrawGetSupportData / ReqRevRecruitProgressAward 的调用；DrawMgr.ReqDrawMarquee 只作为通用 API 存在，真正的跑马灯消费者是 HundredDrawActMgr（117005，属 DRAW-HUNDREDDRAWACT 任务）。即本客户端版本不会主动发这四条命令。

配置（HeroTable.data.lua.json，用 readGeneratedDump 读）：

- DrawProgAward：0 行（DrawProgAward_List 访问器存在、表归属 HeroTable 已核实）。因为没有行，列名与奖励形状都无从取得。
- DrawExchangeLineup：4 行，字段 tid / hero / popularity / relation_type / is_recommend / order / title_txt / des；tid=1 是 hero:[1030101,1030501,2040201]、popularity:1512。
- NormalDrawExchangeLineup：4 行，同结构但英雄数为 2；tid=1 是 hero:[1030101,1030501]、popularity:1512。

## 事实与推断

事实：

- DrawProgAward 为空；两个兑换阵容表各 4 行；651/652 的请求在 proto 里没有 schema；四条命令在客户端都没有调用方。
- recruit-service.mjs 原来对 651/652 回空列表、对 673 回空 data，且 651/652/673 在它的 supports 列表里；网关的 recruit 分支在 heroCommand 分支之前，故必须先移除才轮到本簇。已移除，并在 test/recruit-service.test.mjs 里把三条断言改成指向新测试文件的注释。

推断（代码注释与本文件均已标注）：

- NormalDrawExchangeLineup 对应抽卡库 2、DrawExchangeLineup 对应抽卡库 1：由表名与 recruit 里默认 draw_lib=2 的既有约定推断；请求不带 draw_lib 时按 2 处理。
- 651 的单值实参按 lineup_type 解释（652 的单值实参按 draw_lib 解释）：请求只有 1 个实参且无字段名，语义无法确定；两种解释都只在本簇内部生效，失败时不写状态。
- support_num 记为“本服存档中选择该阵容的角色数”；role_support 只列本角色自己的选择（support_num=1）。proto 注释只写“心愿支持玩家信息 / 心愿服务器支持信息”，没有更细口径。
- popularity 是配置里的“人气”字段，本实现不把它当 support_num（两者不是同一概念）。

## 缺口（未取得证据，未伪造）

1. 635 奖励形状：DrawProgAward 为 0 行，无法读取列名、进度阈值与奖励资源；实现只回 3001 并登记缺口。若未来版本补上配置，需要重新取行 schema 再实现发奖与领奖位记录（pb_hero_recruit 里领奖位字段位置同样未取得证据）。
2. 跨服务器支持聚合：server_support 只统计本服务 SQLite 里的角色；原服是全区聚合，本部署没有数据源。
3. 651/652 真实语义：客户端不发这两条命令、请求也没有字段名，“谁给谁助力”的归属无法确认；实现只保证“我选了哪个阵容”这一层真实状态。
4. 673 跑马灯内容：跑马灯本应广播其他玩家的高星抽卡，单角色部署永远为空；真正的消费端（117005 百抽活动）不在本任务范围。
5. 登录槽位：三条命令都不在登录模块里（HeroCmd 侧无 LoginParse），重登后客户端不会恢复 651 的选择；服务端状态留在 hero_draw_support 表。

## 复现

cd F:/projects/FateCovenantClone/.worktree/gameplay-20261106/hero-hero2/personal-server
node --test --test-concurrency=1 test/hero-support-service.test.mjs test/hero-support-gateway.test.mjs test/recruit-service.test.mjs

查配置行：

node "$env:TEMP/fc_tbl.mjs" DrawExchangeLineup NormalDrawExchangeLineup DrawProgAward

## 测试证据

- test/hero-support-service.test.mjs：7 项。覆盖 type 归属、652 空集真值、651 写入后 652 读回与临时 SQLite 重开保持、同一抽卡库覆盖、两个抽卡库互不串、未知阵容/未知抽卡库/空负载拒绝、635 的 3001 与日志、673 空跑马灯与日志。
- test/hero-support-gateway.test.mjs：1 项端到端。临时 loopback 端口 + 真实握手 + 登录 909103（校验模块 10 仍在登录容器），真实数字 type 651/652/635/673，SQLite 断言 hero_draw_support 只有 1 行且 lineup_type=3。
- 回归：test/recruit-service.test.mjs 同批次 27/27 通过（三条旧断言已移出）。

## APK 边界

本簇只做服务端与临时 TCP 验证，未做隔离客户端 com.jzyx.ps 实机操作。因为客户端本版本不发这四条命令，“可玩验收”本身不适用；635 在配置为空时只回业务码，不构成 APK 验收。
