# 执行状态

2026-11-06 建表。2026-11-07 第一轮并行实施与集成验收，同日第二轮续接 CORE-BATTLE-A、SOC-FRIEND 并新增 PLAY-FISHINGACT。

2026-11-08 新增[子卡划分](14-subtask-cards.md)：01–10 的 272 张任务卡按命令功能族拆成 381 张可独立派发的子卡，供多路 agent 并行领取；本表继续记录任务卡粒度的交付与缺口。

全部 276 个模块任务见 [任务索引](task-index.md)，默认状态均为“待领取”；72 个英雄技能任务见 [技能计划](13-special-skills.md)。下表登记已领取任务和七个共享任务。

交付与整卡销项分开计数：当前 59 个模块任务、3 个共享任务已有玩法实现交付合入 main，共 62 项，其中包括部分交付和证据待补项。另行提交的配置审计、测试或未知业务拒绝，不当作新增玩法完成。完整分母为 276 个模块 + 7 个共享 + 72 个英雄技能 = 355 项；62/355 约 17.5% 仅表示已有实现交付的任务占比，不表示工作量或完整玩法完成率。另有 1 个共享任务（CORE-TIME-TEMPLE）已用注册表全表证据闭合为“本版本不可达”，不计入上面的实现交付数，也不构成 APK 验收。尚无任务达到“全部证据闭合、只差 APK 操作”的整卡状态。

2026-11-07 第二轮：CORE-BATTLE-A 与 SOC-FRIEND 两个 checkpoint 已续接完成并合入 main，另完成 PLAY-FISHINGACT；三者均通过合并后的定向回归与一次主线全量，业务层为“服务端完成”，各自的证据缺口与 APK 验收边界见下表。

| 任务 ID | 状态 | 负责人 / 分支 | 服务 / TCP / SQLite 证据 | APK 验收 | 下一依赖或证据缺口 |
| --- | --- | --- | --- | --- | --- |
| PAY-ONLINEGIFT | 服务端完成（PeriodMax 精确语义待补） | `task/PAY-ONLINEGIFT-20261106` @ 4078f6e | 4 专项 + 真实握手/TCP 37010 + SQLite 重开 + 编码/SQLite 回滚；`game-store.mjs` 未改；合并后全量 2190/2190 | 未安排 | `PeriodMax` 历史选择规则待客户端对照；当前按服务器 05:00 日号映射配置周期；APK 验收待安排 |
| CORE-BATTLE | 服务端完成（A、B、C 已合入） | `task/CORE-BATTLE-A-20261107`、`task/CORE-BATTLE-B-20261108`（@ 50b9e6e，合入 main `8cb9161`） | A：通用效果专项 15/15、真实 TCP 201/207 证明实际 HP 伤害转治疗与回滚，修正 `actionScopedType()` phase 泄漏。B：新增 `proprietary-state`/`proprietary-rules` 与钩子接口；天极值资源与天极技付费（16 行识别、10 行价格均 3 点）、超凡生命（7 行）、召唤替死、护盾按比例摧毁（6 条）、伤害上限（2 条）、额外行动（4 条）、魔能领域与【魔能】【魂】【月光】层数；修复 `runHooks` 用钩子所有者当行动者导致队友行动误触发的缺陷。分支全量 2467/2465 pass、0 fail、2 skipped（总控复核），真实临时 TCP 201/207 证明额外行动与体力/结算链路，SQLite 触发器整笔回滚通过 | 未安排 | 天极值初始值/上限、6 行无价格天极技、每层具体数值（`{0}` 占位符）、【月光】获取来源与阈值、狐魅/命运领域、天极技复制、灵犀协狩/怒势、kill-chain 追击次数仍未接；专有事件尚无 proto 投影（CORE-BATTLE-C）；`120001001` 双重攻击改为真实额外行动、天极英雄不再以能量施放天极技属有据变更，需 APK 观感复核 |
| CORE-ATTR | 服务端完成（属性查询/战力/普通副本战斗同源；装备归属保持未接入） | `task/CORE-ATTR-20261106` @ ec41751；复核 `task/A1-CORE-RESIDUAL-20261108` @ `7c08a8c` | 既有 1316/战力/副本同源回归；A1 复核证明装备按 `pb_lineup_fighter.equip_ids` 逐英雄归属，模块 26 schema 未取证，已移除会全队重复计数的适配；装备范围回归与 A1 定向 79/79，最终主线全量 2689/2687 pass、2 skipped | 未安排 | 逐级成长分母、战力权重、1316 attr_list play_type、1314 回包、NpcAttr、速度表及装备/团长装备/图鉴/好感/法阵/符文/圣器属性来源仍未取证 |
| CORE-SKILL-GATES | 证据待补（已合入 AbilityLevel/mastery/soul 部分实现） | b87b99d；复核修复 e05533d/60b7ab7 | 专项累计 10/10；复核聚焦 37/37；总控技能/奖池/TCP 17/17；最终主线全量 2234/2234；mission 与 1316 共用 loadout；未改 gateway/game-store | 未安排 | 通用 Passive 突破筛选和每级倍率未完成；可达英雄 4040101 缺技能目录；AbilityLevel 索引与 mastery 完整选择/替换待证，不能认定整卡完成 |
| CORE-EVENTS | 证据待补/部分交付（53001/53002 未知推进拒绝） | `task/CORE-EVENTS-20261106` @ db2daa7；合入13231a4 | 真实临时 TCP 验证已证 ETF shape、坏编码/未知规则错误码及 module92/183 不变；相关回归 100/100；无迁移 | 未安排 | 三次 53001 空成功不能证明转换规则；53002 请求字段、53006 参数、状态枚举、任务函数/周期统计及结束结算仍待恢复；[交付记录](../../../agent/workflow/gameplay-completion/CORE-EVENTS/implementation.md) |
| CORE-DRAW-POOLS | 证据待补；已有圣器生产路径复核通过 | `task/CORE-DRAW-POOLS-20261106` @ be514bb；合入7599ef8 | 无奖励 resolver 注入：14 圣器版本正常/保底与 SQLite 重开；38 神灵版本和226无变更拒绝；真 TCP 601→7001、88932；相关回归102/102；最终主线全量2234/2234；静态配置报告与7资产SHA256见 implementation.md | 未安排 | 226的60101/60102及神灵56组lib_range为空；多心愿/替换阶段与神灵心愿/重置规则待证据；Fantasy Task 0行，不能推断当前版本无入口 |
| CORE-TIME-TEMPLE | 证据闭合：本版本不可达（八个编码器未注册） | `task/CORE-TIME-TEMPLE-20261108` @ ea91c18，合入 main `73afd43` | 反解 `Cmd.lua` 的 `c2s_index`/`c2s_back`/`c2s_switch` 全表（1407/1189/1407 槽），八个 `req_time_temple_*` 全部为 null；正控 `req_guild_info→21005`、`req_chat_msg_like→11014` 命中，证明注册表完整；`Connection:Send` 用 `Cmd.c2s_index[cmd]` 取值，nil 直接报错不外发；7700–7900/900–910 数值普查 0 条，90501–90507 属宠物活动、91001 属能量爆发、7801 是 S2C；冻结常量 `TIME_TEMPLE_UNREGISTERED_COMMANDS` + 5 项专项，真实 loopback 下 7801/7701/7702/7709 返回 `LOCAL_NOT_IMPLEMENTED` 且 module 159 载荷不变；顺带修复网关对空 `bytes` 载荷记录时抛错的既有缺陷（`payloadBytes()`） | 未安排（本版本无入口） | 结论只覆盖 1.55.090365，后续版本可能重新注册；`season_shop` 本版无调用点；`FunOpen 1199` 与 `MagicalJourneyMgr` 赛季开启条件未解码；四条命令连 `_back` schema 都没有；7801 真实触发时机与奖池/保底/价格规则未实现 |
| CORE-CABIN | 证据闭合（本版两命令已实现） | `task/A1-CORE-RESIDUAL-20261108` @ `7c08a8c` | 83201 解锁格、83202 重排英雄已由 cabin-service 实现，真实 TCP 与 SQLite 重开通过；客户端本版仅注册这两条 cabin 网络命令 | 未安排 | 房间任务、交互奖励和加速没有客户端网络入口；83201/83202 规则仍以现有证据为边界 |
| SOC-FRIEND | 服务端完成（20012/20013 语义与友情点结算证据待补） | `task/SOC-FRIEND-20261107`，合入 main | 20001–20013 全部网关派发；服务专项 15/15 + 真实临时 TCP 13 个 type + SQLite 重开 + PB 编码失败与 `friend_gifts` ABORT 触发器整体回滚；合并后好友/网关回归 35/35 | 未安排 | 数字登录槽未取证（`loginPayload` 已就绪，待总控选定槽位）；`FlushTime.NowDay` 日界为推断（用 serverDayNumber）；`daily_present_rewards` 发放触发点、favors 增量与友情币换算、20012 过滤语义、20013 举报参数与重复规则未知；2200/2202 推送载荷未取证 |
| SOC-MSG | 服务端完成（10508 登录槽与部分二进制载荷待补） | `task/SOC-MSG-20261107` @ a124472；合入 main b4880a9 | 10501–10511 全部有处理路径；新增 `message-service`、消息配置和 `MsgTable.ChannelType` 资产；恢复 1400–1403 推送类型；服务 + 真实临时 TCP 专项 13/13，合并后网关/登录/M5 回归通过 | 未安排 | 10508 payload 已就绪但登录模块数字槽位未取证；1400–1403 的 `sender_bin/extra_bin` 内容未反解；原服消息频控、历史分页与跨服聚合语义待补 |
| PLAY-FISHINGACT | 服务端完成（记录筛选与活动结束结算证据待补） | `task/PLAY-FISHINGACT-20261107`，合入 main | 110303/110304/110306/110307/110308/110309/110310 补齐，110301/110302/110305/110311 保留；新增 `fishing_act_catches` 真实收鱼记录驱动榜/记录；服务+TCP 14/14、网关 7/7（真实 seq 70–82）、合并后钓鱼/活动/网关 28/28；SQLite 重开与编码回滚通过 | 未安排 | 110308 筛选与上限未取证（当前按该活动全部渔获 id 倒序）；活动结束名次结算（HighScoreRank/ScoreRank）未实现；充值 FishBuy 139001/139002 直发鱼竿未接；天气/鱼竿加成与尺寸公式、错误文案映射未对齐 |
| BATTLE-ELITEMISSION | 服务端完成（敌方阵容映射与难度证据待补） | `task/BATTLE-ELITEMISSION-20261107`，合入 main | 87001/87002/87003 保留；201/202/207 分流精英关卡（report.type=6）与 BOSS（114），战报来自真实 `simulateBattle`；真实临时 TCP 87001→201→207 两关 + 越级拒绝 err 5，临时 SQLite 重开后 mission_id/领取位/boss_bin 保持，触发器和结算编码失败整体回滚；合并后定向 55/55 | 未安排 | 敌方阵容需部署注入 `eliteEnemies`（FightTable def_team 全库为空，EliteMission 无 enemy 字段，缺省明确拒绝）；201 预扣与 207 扣体力时点、`Boss.open_server_day`/`need_open_days`、精英难度与 award 可重复性未取证 |
| PLAY-HELPUPACT | 服务端完成（全服聚合与部分周期语义证据待补） | `task/PLAY-HELPUPACT-20261107`，合入 main | 116001 任务奖、116002 阶段奖、116003 发起助力、116004 真实累计次数；`HelpUpActTable` 资产落地，登录数据经模块 92 活动条目下发；专项 8/8（含真实 TCP）、合并后 help-up/活动/网关/m5 37/37；SQLite 重开与整笔回滚通过 | 未安排 | 每次 1 道具/1 次助力、信封抽奖、`cycle_type=1` 日环与周边界为推断；跨角色/跨服“全服”聚合无证据；活动窗口已过期需排期；APK 未验收 |
| PAY-GROUPBUYACT | 服务端完成（全服口径与客户端回包对照待补） | `task/PAY-GROUPBUYACT-20261107`，合入 main | 100601 按已支付订单聚合真实人数并叠加 `HeadCompensate` 补偿人数，100602 同事务校验→发奖→领取位→刷新 module 92；16005 回执追加 flag=93；专项 7/7、合并后 72/72（含真实 TCP 购买→统计→领奖）；SQLite 回滚/重开通过 | 未安排 | `last_refresh_sec` 语义未取原服样本；全服人数口径未与原服回包对照；20 人档在本配置不可达；无到期结算/退款撤销与 `pay_type=0` 现金团购分支 |
| PAY-DRAGONLANDACT | 服务端完成（战斗来源与日重置语义证据待补） | `task/PAY-DRAGONLANDACT-20261108` @ 831f9f3，合入 main `01821e4` | 107701 按 `DragonLandAct.award_day` 记自然日发日奖、107702 按 `BossAward` 剩余血量百分比档位发试炼奖、107703 用真实 BOSS 进度与 `dragon_land_contribution` 行替换原空包（无公会 5、未运行 309）；`DragonLandActTable` 资产由 LuaJIT 可复现生成；专项 8 项 + 真实 TCP 2 项 + SQLite 重开 + 编码失败与触发器 ABORT 整笔回滚；合并后定向 32/32 | 未安排 | 龙岛战斗 `pb_dragon_land_fight_req` 未路由，`recordBossDamage` 无生产调用方，新号试炼奖一律 311 fail closed；日奖周期是否每日重置缺原服证据（当前按活动自然日）；其它公会成员 BOSS 伤害与贡献无生产来源，不做推算；`IsTrialAwardCanReceived` 判定顺序未逐条反汇编 |
| PAY-DIAMONDBANKACT | 服务端完成（结算字段与多数任务进度证据待补） | `task/PAY-DIAMONDBANKACT-20261108` @ e6ef47d，合入 main `c0ba81a` | 110201/110202/110203 全部网关派发；`DiamondBankActTable` 可复现提取，模块 92 登录同步，任务领取、实际存款结算与开户存款落 SQLite；专项服务 14 项 + 真实 TCP 2 项 + SQLite 重开 + PB 编码失败/SQLite ABORT 回滚；合并后定向 61/61 | 未安排 | `rage`/`open_add_num`/`add_item` 的服务端语义无客户端引用证据；14 个任务仅 101/102 可从统计槽重建，103–114 当前 fail closed；`daily_discount_list` 的 `buy_additionally`/`refresh_time`、`max_limit` 溢出与银行礼包 138001–138005 购买链路待补；APK 未验收 |
| PAY-FREEPRIVILEGEACT | 服务端完成（月卡激活 res 与体验期永久卡权益语义待补） | `task/PAY-FREEPRIVILEGEACT-20261108` | 110601 写 `active_time` 并置模块 62 `free_endtime = active_time + privilege_day×86400`（表值 30 天），110602 复用月卡服务写模块 20 的 1 号月卡与 `monthly_card_active_time`，两条命令都刷新模块 92；`FreePrivilegeActTable` 由 LuaJIT 可复现生成；专项 10/10、真实 TCP 2/2、SQLite 重开、PB 编码失败与 SQLite 触发器整笔回滚；定向回归 61/61 | 未安排 | 110602 激活回包的 `res` 在所有表/调用点都没有奖励定义（当前返回真实空 changes）；永久卡体验不写 `element_list`，体验期每日奖励判定缺证据；重复激活错误码未取证（当前幂等确认）；APK 未验收；见 [交付记录](../../../agent/workflow/gameplay-completion/PAY-FREEPRIVILEGEACT/implementation.md) |
| PAY-SLOTGAMEACT | 服务端完成（倍率口径与日重置证据待补） | task/PAY-SLOTGAMEACT-20261108 @ 02a583f，合入 main 85ec949 | 110801 按 AwardLib 权重抽发奖库并扣 1 张入场券，110802 按 MultiplierLib 档位抽倍率并发放 floor(count×multiplier/100)；状态落 slot_game_act_role_state 与 slot_game_act_draws 两张幂等表，模块 92 登录同步；SlotGameActTable 由 LuaJIT 可复现生成；专项 14/14、真实 TCP 2/2、SQLite 重开、PB 编码失败与 SQLite 触发器整笔回滚；rebase 后定向 59/59 | 未安排 | challenge_multiplier=true 无规则回 5；count×multiplier/100 与 MultiplierLib.num 选档为表驱动推断；draw_num 是否按日重置无证据；Version.help_id=294 未使用；APK 未验收 |
| HERO-LINEUP | 服务端完成 | `task/HERO-LINEUP-20261106` @ cd3b3ea | 5 专项测试 + 真实 TCP 214→215→216→209→210→217 + 重开 DB；集成分支 30/30 | 未安排 | 217 回包 schema 未恢复（当前 ETF 回显索引）；名称长度上限属推断；214 请求形态待实测 |
| HERO-HERO | 服务端完成（18 条剩余命令已补齐；多项规则证据待补） | `task/HERO-HERO-20261106` @ ead0359；`task/HERO-HERO-B-20261107` @ d92122b；合入 main eb1b1e1 | B 批 602/627–631/634/635/637/641/651/652/654/656/661/666/672/673 全部有服务路径；专项 100/100、分支全量 2368（pass 2366 / fail 0 / skipped 2），合并后英雄/招募/网关/M5 定向 131/131；真实临时 TCP、SQLite 重开与编码/SQLite 回滚 | 未安排 | 635 `DrawProgAward` 0 行返回 3001；651/652/673 客户端本版本不可达；641 品质/星级/碎片规则为强推断；637 Cell 4–6、654/672 登录/属性影响、629–634 跨角色租借和其他角色登录槽仍缺证据；全部条目未 APK 验收 |
| DRAW-HUNDREDDRAWACT | 服务端完成（保底选择与非英雄星级奖证据待补） | `task/DRAW-HUNDREDDRAWACT-20261107` @ fa2d79d，合入 main | 117001–117005 全部网关派发；从 LuaJIT 资产可复现生成 `HundredDrawActTable`；真实临时 TCP 覆盖五命令，专项 8/8、活动/福利/网关 24/24；消耗/授予/领取位/跑马灯落 SQLite，重开及编码/SQLite 回滚通过 | 未安排 | `GuaranteeWeight` 服务端选择语义未恢复，当前保底按排序后的首个本体奖；宠物/精灵/幻装星级条件与 type-104 技能奖励、部分 target-chip 映射缺证据并 fail closed；APK 未验收 |
| DRAW-BONUSDRAW | 服务端完成（概率与折算语义证据待补） | `task/DRAW-BONUSDRAW-20261108` @ f2d0166，合入 main `72c8d4d` | 101901/101902/101904 全部网关派发；从 LuaJIT 资产可复现生成 `BonusDrawTable`；按当前池剩余 `cnt` 无放回抽取、BIG 提前停止、真实扣费/发奖/池记录落 SQLite；PB 编码失败与 SQLite 写入失败整笔回滚，重开保持；合并后百抽/活动/网关 19/19 | 未安排 | `Pool.probability` 单奖项权重与 `convert_item/convert_num` 折算规则未恢复；101902 的 ETF `cur_pool` 键/末尾回绕行为与 `.proto` 池 tid 注释冲突；101904 `can_choose` 未参与校验；没有登录数字槽证据，登录载荷尚不能接线；APK 未验收 |
| DRAW-BLOCK-F-F2 | 路径覆盖（44 条表驱动路径，21 条明确拒绝；有限路径未全部销项） | `task/BLOCK-F2-20261108` | 74 条原缺失命令均有明确路径；统一服务新增 65 条并按 role/module/version 持久化，既有百抽/奖励抽取/许愿树承担其余 9 条；服务专项 14/14、临时 TCP 3 条、PB 编码失败与 SQLite ABORT 整笔回滚 | 未安排 | BigLib/幸运值、多奖池祈愿、活动进度生产源、棋盘翻转映射、FlipCard/Lottery/HeroBlazon/TicketDraw/Cashback 奖池与全服状态等仍缺证据；逐族见 [BLOCK-F 实施记录](../../../agent/workflow/gameplay-completion/BLOCK-F/implementation.md) |
| SOC-CHAT | 服务端完成（公会/跨服/封禁/点赞 fail closed） | `task/SOC-CHAT-20261107` @ 5158c13，合入 main `680b2b7` | 11000–11014 全部网关派发；新增 `chat-service`、`ChatTable.Param`/`ReportConst` 资产与生成器；11000/11002 真实写 `message_history` 并推 1400、11013 按 ReportConst 去重与 24h 上限、11010 持久化设置、11012 幂等删除私聊目标；72 项定向（chat 15 + SOC-MSG 13 + 网关/m5）与合并后 44/44 通过，PB 编码失败与 SQLite ABORT 整体回滚、SQLite 重开通过 | 未安排 | 11001 无公会权威状态、11003 跨服聚合、11006/11008 封禁状态机、11014 点赞奖励无证据 fail closed；1400 为本服自定 wire type 未与抓包比对；频控参数（send_time_interval/count_limit_in_cd）已恢复但服务端未限速；11010 设置结构未反解且未挂登录；推送沿用全连接广播，多角色会话需按角色定向 |
| EQUIP-ARTIFACT | 服务端完成（4 条证据待补 fail closed，1 条部分交付） | `task/EQUIP-ARTIFACT-20261107` @ df3775e，合入 main `93bd156` | 37060/37061/37068/37069/37070/37071 真实状态+资源+回包，37074 部分交付；权威状态统一落 module 50 slot 0 `pb_artifact_info` 并由 `ensureLoginState()` 归一化；`ArtifactTable`/`ArtifactLevelUp` 资产由 LuaJIT 可复现生成；专项 12/12 + 真实 TCP（五成功命令 + 一条 fail closed）+ SQLite 重开 + PB 编码失败与 SQLite 触发器失败回滚；合并后定向 35/35 | 未安排 | 37062 品质、37072 inject、37073 handbook、37075 skin 缺语义 fail closed；37061 forge 累计口径、37069 star 阈值、37074 `star_limit=6` 与品质 50 上限 5 冲突为推断/拒绝；属性与战力接入未做 |
| EQUIP-RELIC | 服务端完成（保底/概率与登录 depot 槽位证据待补） | `task/EQUIP-RELIC-20261107` @ bfe4c15（rebase 后 c3bf25f 系列 + 空白修正），合入 main `e30f15c` | 89701/89702/89704/89705/89706/89707/89708/89709/89710/89711/89712 全部网关派发；新增 `relic-service` 与 `RelicTable` 资产（生成器可复现同哈希）；服务 10 项 + 真实 TCP 1 项（11 个 type）+ SQLite 重开 + 编码/写入失败整笔回滚；合并后定向 40/40 | 未安排 | `pb_relic_depot` 登录模块号未定位，仓库列表不随登录下发（`hero.relic` 与专属符文进度经模块 10 恢复）；`RecastTimes` 保底与 `recast_probability`/`variation_return` 语义无据，变异按消耗即成功；重置成本字段语义未定；穿戴按整组覆盖解释；`StageAttr`/`RecastAttr*`/`Suit`/`VariationAddition` 未汇入属性与战力 |
| HERO-MASTERY | 服务端完成（技能已由 CORE-SKILL-GATES 接线；属性与完整规则待补） | `task/HERO-MASTERY-20261106` @ 1afea74 | 5 专项测试 + 真实 TCP 660→659 + 故障回滚 + 重开 DB；合并后全量 2164/2164；b6e1766 接入星级/等级门槛与唯一 mastery 技能 | 未安排 | 659/660 请求仅确认含 tid；未突破时等级上限与完整解锁规则待实测；精通属性、每级技能倍率和突破换技能仍未闭合 |
| ITEM-SHOP | 服务端完成 | `task/ITEM-SHOP-20261106` @ 3ac6f3c | 15 专项测试 + 真实 TCP 1202→1203→1202 + 重开 DB；集成分支 26/26 | 未安排 | 1202–1205/1207/1208 ETF 请求形态待录制；1205 wipe 语义未取证；结算 data 布局未知；无刷新价格表 |
| ITEM-ITEM | 服务端完成（153/157 证据阻塞） | `task/ITEM-ITEM-20261106` @ c3e2df7 | 9 专项测试 + 真实 TCP 156/158/154 成功、153/157 返回 code 5；集成分支 47/47 | 未安排 | 153 本版本不可达（BoxRepeat 0 行、无 type=85 物品、module 54 空）；157.lottery_list 无奖池表；保底登录槽位未定位；MatchHeroChip 无奖励 handler |
| ITEM-EVERYTASK | 服务端完成（部分进度/奖励证据阻塞） | `task/ITEM-EVERYTASK-20261106` @ 9139333 | 8 专项测试 + 真实 TCP 9000 + 重登 module 91 + 跨期重置 + 故障回滚；冲突相关 35/35；合并后全量 2172/2172 | 未安排 | 日/主/周任务仅覆盖统计 progress_type=2、主线 cursor=1201、命途 5901/155；活跃档 200/400/600/800 为缺表推断；dynamic_award、周末加成与任务事件源未实现 |
| ITEM-MISSION | 服务端完成（509 common_task、512 boss 证据阻塞） | `task/ITEM-MISSION-20261106` @ 42b358e | 10 专项测试 + TCP 504/505/511/509 + 重开 DB；集成分支 63/63 | 未安排 | module 8 meal 槽位未确认；EnergyConst period/rate/limit 语义待原服对照；509 common_task_tids 无进度来源；512 无 Boss 通关写入路径 |
| BATTLE-PEAKTOWER | 服务端完成（部分证据阻塞） | `task/BATTLE-PEAKTOWER-20261106` @ 83b784f | 12 专项测试 + 真实 TCP 1103/1112 + 重开 DB + 故障回滚；合并后全量 2164/2164 | 未安排 | 1104 跨日重置配置未恢复；1109 限购/折扣语义；1112 回包 schema 未恢复；塔战斗仍依赖缺失的 FightTable 与通用派发 |
| BATTLE-RANK | 服务端完成（部分榜单事件/赛季结算阻塞） | `task/BATTLE-RANK-20261106` @ e1230b3 | 7 专项 + 真实 TCP、既有 rank 回归 41/41 + 重开 DB + 编码/SQLite 回滚；合并后全量 2171/2171 | 未安排 | 真实生产来源当前覆盖角色等级、主线、英雄星级、本地战力、尖塔；其余榜单缺所属模块事件；赛季冻结/邮件最终奖励与 2003/2004 部分数字绑定待证据 |
| BATTLE-GENERALDUNGEON | 服务端完成（事件规则部分证据阻塞） | `task/BATTLE-GENERALDUNGEON-20261106` @ a9e5718 | 7 专项测试 + 真实 TCP 78101–78107 + 重开 DB + 编码/claim 故障回滚；独立复核 37/37；合并后全量 2178/2178 | 未安排 | 宝箱与道具事件已闭合；战斗、抽取、Buff、对话、条件/跨层事件和额外数据仍待证据，当前逐类型明确拒绝 |
| BATTLE-FIGHT | 服务端完成（空回执，不计玩法交付） | `task/A1-EVIDENCE-20261108` @ `43aec9c` | 205 由客户端 `FightReportForm → FightReportMgr.ShareReport` 可达；校验正数 `fight_id/fight_type` 后返回 code 0 空帧，临时 TCP 与 PB 编解码通过 | 未安排 | 客户端未定义分享奖励、计数或记录，本实现不发奖不落库；APK 未验收 |
| BATTLE-REPORT | 服务端完成 | `task/BATTLE-CORE-20261108`，合入 main `c19e8dd` | 211 从真实战斗记录回调写 SQLite；212 校验记录、拒绝自赞、同向重复幂等、反向重复报错；临时 TCP/SQLite 重开/失败回滚通过 | 未安排 | 211 未下发 `lineup_info`；APK 未验收 |
| BATTLE-REDCLIFF | 服务端完成（部分轮次规则待证） | `task/BATTLE-DUNGEON-20261108`，合入 main `bd650ba` | 55001–55004 真实状态、结算与领取；临时 TCP/SQLite/回滚通过 | 未安排 | 重置周期与 `buff_lib` 展开规则未取证；201/207 通用派发接缝未调用 |
| BATTLE-SOULTRIAL | 服务端完成（付费翻牌语义待证） | `task/BATTLE-DUNGEON-20261108`，合入 main `bd650ba` | 87104/87105 抽取奖与每日免费次数，状态和领取落 SQLite | 未安排 | 超免费次数拒付，付费消耗语义未恢复；APK 未验收 |
| BATTLE-SCARLETTRIAL | 服务端完成（活动窗口待证） | `task/BATTLE-DUNGEON-20261108`，合入 main `bd650ba` | 89101/89102 任务奖与石头选择，战斗进度来自 `simulateBattle` | 未安排 | 活动版本窗口与通用战斗派发接缝未接入 |
| BATTLE-STARMISSION | 部分交付（89601/星级生产写入待补） | `task/A1-TABLES-20261108` @ `d4924bc` | 真实 34 版表装载；活动 id 经 `ActivityTable func=81` 映射 version；89602 真实 9/15/24 星档位奖励、89603 技能成本/父门槛、89604 原额退款；临时 TCP/SQLite 重开/回滚通过 | 未安排 | 89601 无调用点与参数证据，保持 code 5；星级写入、`pb_star_mission_role_info` 登录槽及租赁英雄/Attr 战斗接线未完成 |
| BATTLE-COMMONMAP | fail closed（真实表无地图实例） | `task/A1-TABLES-20261108` @ `d4924bc` | `CommonMapTable` 已装载并审计全部定义；`CommonMap` 仅 1 行、`Node` 11 行为节点类，无坐标/实例，90601–90603 统一返回 code 5；不计入实现交付 | 未安排 | 地图网格来自独立客户端 `RequireConfig(mapCfgFullName)`；需恢复实际 map config 后才能实现初始化、触发与扫荡 |
| BATTLE-FAMEHALL | 服务端完成（候选/阵容证据待补） | `task/BATTLE-BOSS-20261108`，合入 main `7ab8b81` | 91101–91111 状态、进入/选择/跳过/终止、阶段奖/补发、重置/扫荡；模块 50 圣器状态复用；真实 TCP/SQLite/回滚通过 | 未安排 | 掉落候选和敌方阵容注入缺失时 code 5；扫荡冷却、重置费用未完全取证 |
| BATTLE-WORLDBOSS | 服务端完成（BOSS 调度证据待补） | `task/BATTLE-BOSS-20261108`，合入 main `7ab8b81` | 91801–91805 地图进入离开、伤害/杀奖、历史榜与成就；状态落 SQLite | 未安排 | 无唯一 BOSS 调度或部署 `bossTid` 时 code 5；击杀档位选择待证 |
| BATTLE-PITLORD | 服务端完成（RankTable 绑定待证） | `task/BATTLE-BOSS-20261108`，合入 main `7ab8b81` | 92801–92804 真实榜单、每日快照、排名奖/补发与免费奖幂等；真实 TCP/SQLite/回滚通过 | 未安排 | 正式 RankTable `rank_id` 未取证，当前使用隔离命名空间 |
| BATTLE-CAMPTOWER | 服务端完成（开放日待证） | `task/BATTLE-DUNGEON-20261108`，合入 main `bd650ba` | 93601–93603 首通列表与战斗进度，状态来自真实 `simulateBattle` | 未安排 | `TypeOpenDays` 开启校验未接入；APK 未验收 |
| BATTLE-TOWERDEFENSE | 服务端完成（承伤结算待证） | `task/BATTLE-DUNGEON-20261108`，合入 main `bd650ba` | 97601–97605 驻守、结算和奖励，状态落 SQLite；专项/邻接回归通过 | 未安排 | 承伤/血量结算规则尚未恢复；APK 未验收 |
| BATTLE-DESTINYPVE | 部分交付 | `task/BATTLE-DUNGEON-20261108`，合入 main `bd650ba`；证据复核 `43aec9c` | 104702 层信息可用；确认真实战斗经 201 `fight_start` 的 stm 子载荷，结算解 `pb_destiny_pve_fight_rsp` | 未安排 | 104701 顶层无调用点；`FightTable.Fight` 的 `def_team` 为空，敌阵不可恢复，保持 code 5 |
| ITEM-COMMONTASK | 服务端完成（奖励/爬塔进度证据阻塞） | `task/ITEM-COMMONTASK-20261106` @ 321655f | 7 专项测试 + 同组列表事务 + 重开 DB + 故障回滚；合并后全量 2164/2164 | 未安排 | 四张组表 2774 行奖励列为空；progress_fun 12 无爬塔状态来源；module 90 线性槽位从 0 修正为 4，需 APK 联合验收 |
| ITEM-GUIDE | 服务端完成（奖励配置证据阻塞） | `task/ITEM-GUIDE-20261106` @ 042be27 | 9 专项测试 + 真实 TCP 8000→8001→8002 + 重开 DB + 故障回滚；合并后全量 2164/2164 | 未安排 | GuideTable 无 JSON 导出，生产 8001 对所有 awardTid 返回 code 5；8001 参数位置与 8002 不回帧均待 APK 实测 |
| ITEM-RANKACHIEVE | 服务端完成（多数成就事件源证据阻塞） | `task/ITEM-RANKACHIEVE-20261106` @ 9c1a880 | 7 专项测试 + 真实 TCP 43101→rsp/8601 + 模块 170 登录 + 重开 DB + 编码/SQLite 回滚；合并后全量 2190/2190 | 未安排 | 当前仅闭合巅峰塔 500/1000 层与可解析指定英雄拥有共 13 行；其余 71 行缺权威完成值来源并返回 code 5；`finish_award` 发放语义与跨服/公会完成信息待证据 |
| ITEM-GROWTHROAD | 服务端完成（1111–1113 任务进度证据阻塞） | `task/ITEM-GROWTHROAD-20261106` @ 8003e39 | 专项与 gateway 回归 16/16 + 真实 TCP 69001/69002 + 模块 53696 登录 + SQLite 重开 + 编码回滚；合并后全量 2215/2215 | 未安排 | `progress_fun=203/82`（1111–1113）无权威事件来源；ETF 单 tid 形状来自客户端反汇编、未取得实包；`award_new` 选择与过期 `rev_overdue/overdue_award` 语义待原服对照 |
| ITEM-FIRSTWEEKGOAL | 服务端完成（部分进度事件证据阻塞） | `task/ITEM-FIRSTWEEKGOAL-20261106` @ 6155312 | 6 项 service + 真实临时 TCP 67004/67005 + 登录模块 59015 + SQLite 重开 + 编码/SQLite 回滚；网关 14/14；合并后全量 2197/2197 | 未安排 | TaskType.progress_fun=1/3 尚无统一生产事件来源；当前统计源任务可领取，其余明确 code 5，不按固定进度放行 |
| ITEM-FUNCTIONMANUAL | 服务端完成（仅统计源/主线章节源可领，其余进度源 code 5） | `task/BLOCK-D-20261108` | 82301 按 `FunctionManualTable.Task` 28 行的 `task_list` 复核进度、领取位落 SQLite、`award` 真实发放、模块 106 登录同步；专项 6 项 + 真实 TCP 登录/82301/重复 310 失败行 5 + SQLite 重开 + 编码回滚；`FunctionManualTable.rows.json.gz` 由新增 `tools/extract-lua-table-rows.mjs` 可复现抽取 | 未安排 | `progress_fun=180/182/185/...` 无服务端事件来源，28 行中仅统计源与 `fun 2/10` 行可领；`got_award` 位序沿用项目既有按 tid 置位约定，未逐位反汇编；`func_open` 未参与服务端校验；APK 未验收；见 [交付记录](../../../agent/workflow/gameplay-completion/ITEM-FUNCTIONMANUAL/implementation.md) |
| ITEM-TASKACTIVITY | 服务端部分完成（1/2：105702 缺服务器活跃度） | `task/BLOCK-D-20261108` | 105701 按 `ActFrameTable` 类型 1003 窗口 + `TaskActivityTable.Lib` 版本任务 + 模块 21 统计复核，完成列表落 SQLite，登录把 `pb_task_activity_role_info` ETF 包进模块 92 条目；专项 7 项 + 真实 TCP 登录/105701/重复 310/105702 返回 5 + SQLite 重开 + 编码回滚 | 未安排 | `105702` 的 `server_vitality` 是全服活跃度，本服无权威生产方，按 5 拒绝；`task_param`/`Common.task_param`/`Tag.desc` 属展示配置未使用；APK 未验收；见 [交付记录](../../../agent/workflow/gameplay-completion/ITEM-TASKACTIVITY/implementation.md) |

| BLOCK-E1（#87、#91–#106） | 服务端完成（82 条真实路径 + 46 条 fail closed；#88–#90 为此前批次） | `task/BLOCK-E1-20261108` | 171、21001–21031、85501–85505 公会，46001–84701 社交社区，83101–91209 公会活动全部网关派发；服务专项 26 项 + 真实临时 TCP 1 项；合并 main 并再并块 D 后全量 2673（pass 2671 / fail 0 / skipped 2）；SQLite 重开与 PB 编码失败回滚通过；未改 game-store | 未安排 | Guild*Table 数值行、171 block 映射、21017/83105 回包、46002/77601/79201 ETF 元素形状未取证；[交付记录](../../../agent/workflow/gameplay-completion/BLOCK-E1/implementation.md) |
## 集成与验收记录（2026-11-07 第一轮）

- 集成分支：`gameplay/integration-20261107b`（基于含 207 体力、邮件推送和活动登录期限修复的 main `7b5af58`），已以 `--no-ff` 合入 main `7750864`。
- 已合并：HERO-LINEUP、ITEM-SHOP、ITEM-ITEM、ITEM-GUIDE、BATTLE-PEAKTOWER、BATTLE-RANK、BATTLE-GENERALDUNGEON、HERO-MASTERY、ITEM-MISSION、ITEM-COMMONTASK、ITEM-EVERYTASK、PAY-ONLINEGIFT、ITEM-RANKACHIEVE。手工冲突重点处理了 `gateway.mjs` 多派发共存、在线礼包登录会话与成就登录同步共存、ITEM-MISSION 对 module 8 体力槽的保留，以及 ITEM-COMMONTASK 的 module 90 通用组 0–3 / 线性组 4 槽位。
- 主线保持审计：`main` 是集成分支的严格祖先，`HEAD..main` 为空；`energy.mjs`、`mission-progress.mjs`、`resources.mjs`、`game-store.mjs`、`mail-service.mjs`、`activity-calendar.mjs`、`relic-divine-login.mjs` 与 main 原实现一致。207 结算/体力、新邮件推送、ActFrame/fishing 登录期限的定向回归 74/74 通过。
- ITEM-EVERYTASK 已 rebase 到含首批任务的 main；保留 `createItemBoxService({ ..., heroTables })`、207 体力、邮件推送、活动期限及 module 90 槽位语义，冲突相关 35/35 通过，再以 `--no-ff` 合入 main `77c5b5f`。BATTLE-RANK 已基于该主线完成并把原空榜替换为 SQLite 权威排序，以 `--no-ff` 合入 main `7713406`；独立复核 41/41，通过后 main 全量 2171/2171。BATTLE-GENERALDUNGEON rebase 时只与总控状态表冲突，保留总控版本，代码与 BATTLE-RANK 网关派发共存；独立复核 37/37，以 `--no-ff` 合入 main `e406136`，合并后全量 2178/2178。PAY-ONLINEGIFT 以 `--no-ff` 合入 main `5ea053c`；ITEM-RANKACHIEVE 再次 rebase 时手工保留 `onlineGift.beginSession()` 与 `rankAchieve.ensureLoginState()` 两条登录路径，独立复核 26/26，以 `--no-ff` 合入 main `13f99a7`。最终 main 全量 `node --test --test-concurrency=1 test/*.test.mjs`：tests 2190 / pass 2190 / fail 0。日志：`analysis/test-runs/gameplay-20261106/main-after-rankachieve-onlinegift-full.log`。
- 当前没有启停实时服务、操作模拟器、读写 `runtime.local-only.data` 或生成 APK；上表“服务端完成”均只表示业务、临时 TCP、SQLite 与回归层通过，APK 验收仍单列。
- ITEM-FIRSTWEEKGOAL 以 `--no-ff` 合入 main `bf5d95b`；独立专项 14/14，合并后 main 全量 2197/2197。网关保留 `onlineGift.beginSession()`、`rankAchieve.ensureLoginState()` 与首周目标模块 59015 三条登录路径，并保留既有数字 type 派发；207 结算/体力、邮件推送与活动期限定向回归 60/60 再次通过。全量日志：`analysis/test-runs/gameplay-20261106/main-after-firstweekgoal-full.log`。
- HERO-HERO、ITEM-GROWTHROAD、CORE-ATTR 依次以 --no-ff 合入 main d375bf6、8979fe5、427f9e5。每次合并前均确认 main 为分支祖先、git diff --check 通过，并逐项检查网关同时保留 onlineGift、rankAchieve、heroExtra、firstWeekGoal、growthRoad 与 1316 属性路由；git diff 未覆盖 207 结算/体力、邮件推送、活动期限或 module8/90 多槽。三次合并后的全量回归依次为 2206/2206、2215/2215、2219/2219。最终日志：analysis/test-runs/gameplay-20261106/main-after-core-attr-full.log。
- CORE-SKILL-GATES 提交 b87b99d 以 --no-ff 合入 main b6e1766。合并前工作区干净、main 为分支祖先、git diff --check 通过；gateway.mjs/game-store.mjs 未变，207 路径仅增加技能 loadout 输入。合并后 npm test 为 2226/2226，fail 0。运行摘要见 analysis/test-runs/gameplay-20261106/main-after-core-skill-gates-summary.md。通用 Passive 的突破筛选和等级倍率仍未实现，整卡状态为证据待补；全量通过不能替代这些业务验收。
- 总控独立技能复核补丁 e05533d/60b7ab7 分别以 --no-ff 合入 7e27826/d252af1：修复显式空技能列表重新加载全目录，以及普通1040201误选metadata占位技能；专项累计10/10。CORE-DRAW-POOLS 的 be514bb 以 --no-ff 合入7599ef8，只提交配置审计与生产路径复核；CORE-EVENTS 的 db2daa7 以 --no-ff 合入13231a4，只落实未知推进拒绝与证据，均不当作新玩法完成。
- 最终 main13231a4 在 personal-server 执行 npm test：tests2234 / pass2234 / fail0 / skipped0，退出0，duration_ms216911.0109。完整日志：analysis/test-runs/gameplay-20261106/main-after-core-skill-events-draw-full.log。技能/生产奖池/TCP单独联合复核17/17也通过；未引入新运行资产或部署依赖。
- 合并保持核对：96d4c18/4ee1f8b/7b5af58均为主线祖先；game-store、energy、mission-progress、mail-service、task-service、activity-calendar与1a15105无差异，gateway保留onlineGift/rankAchieve/heroExtra/firstWeekGoal/growthRoad登录和1316路由。冲突仅发生于总控状态表，逐行保留最新各任务状态后解决；测试期间未变更业务源码。
- 后续已派发 CORE-BATTLE-A 和 SOC-FRIEND，各自独立worktree；SOC-FRIEND另有只读证据辅助。尚无两项代码交付，不计入上述18项；实时服务、运行库和APK仍未操作。

## 集成与验收记录（2026-11-07 第二轮）

- 起点核对：会话开始时 main=1fb6824（仅文档）；会话期间主线被外部推进到 9593baa（合入 fix/daily-discount-acc-recharge-20261107，含 wallet-service/acc-recharge-service 业务改动）与 0c4f84e（v10 APK 文档）。本轮三个分支均以 9593baa 为基线，合并前分别 rebase 到当时最新 main，未覆盖外部业务改动；gateway 合并后逐项核对仍保留 onlineGift/rankAchieve/heroExtra/firstWeekGoal/growthRoad 登录、1316 属性、207 结算/体力、邮件推送与活动期限。
- CORE-BATTLE-A：`aa4a5d8` 系列以 `--no-ff` 合入 main，合并后战斗/技能/副本/网关定向 127/127；独立复核发现 phase 泄漏（终结技加成作用于动作内触发伤害）并已修正，转换效果固定后置；生产路径用真实临时 TCP 201/207、临时 SQLite 重开与 ABORT 触发器回滚验证，834 实际伤害对应 +83 治疗。日志：`analysis/test-runs/gameplay-20261106/main-after-core-battle-a-focused.log`。
- SOC-FRIEND：以 `--no-ff` 合入 main d1701a2；合并后 friend-service/friend-gateway/gameplay-gateway/m5-command-matrix/login-business-reads 35/35 通过，真实临时 TCP 覆盖 13 个 type、SQLite 重开与整体回滚。日志：`analysis/test-runs/gameplay-20261106/main-after-soc-friend-focused.log`。
- PLAY-FISHINGACT：rebase 后以 `--no-ff` 合入 main 3b2d8fa；合并后钓鱼/活动/网关 28/28 通过，真实 TCP seq 70–82、跨活动隔离、重复领奖 310、编码失败回滚。日志：`analysis/test-runs/gameplay-20261106/main-after-fishing-focused.log`。
- 主线全量：在 personal-server 执行 `npm test`，tests 2281 / pass 2279 / fail 0 / cancelled 0 / skipped 2 / todo 0，duration_ms 229348.9777，退出 0。完整日志：`analysis/test-runs/gameplay-20261106/main-after-battle-friend-fishing-full.log`。
- 本轮未启停实时服务、未读写 `runtime.local-only.data`、未操作模拟器/ADB/APK，也未连接原游戏服务器；三项均未进入 APK 验收，纯服务端改动未生成 APK。

## 集成与验收记录（2026-11-07 第二批）

- 会话期间主线再次被外部推进到 `28a1a53`（合入“普通招募池排除限定英雄”修正）。本批三项均 rebase 到该提交后合并，未覆盖该业务修复。
- PLAY-HELPUPACT 以 `--no-ff` 合入 main `1e6dfe9`；合并后 help-up/activity-read/activity-calendar/gameplay-gateway/m5-command-matrix 37/37 通过。日志：`analysis/test-runs/gameplay-20261106/main-after-play-helpupact-focused.log`。
- BATTLE-ELITEMISSION 先补 `diff --check` 的尾随空行（`ec9ebd7`）再以 `--no-ff` 合入 main `9c554fa`；合并后精英闭环/既有 elite service/主线 201-207/通用效果生产路径/gateway/招募池 55/55 通过。日志：`analysis/test-runs/gameplay-20261106/main-after-elitemission-focused.log`。
- PAY-GROUPBUYACT rebase 时在 `gateway.mjs` 登录活动区手工解决冲突，同时保留 `activityRead.synchronizeHelpUpLogin` 与 `groupBuyAct.synchronizeLogin`，再以 `--no-ff` 合入 main；合并后团购/welfare/购买流/wallet/gateway/精英闭环/help-up 72/72 通过。日志：`analysis/test-runs/gameplay-20261106/main-after-groupbuy-focused.log`。
- 最终主线全量：在 personal-server 执行 `npm test`，tests 2311 / pass 2309 / fail 0 / cancelled 0 / skipped 2 / todo 0，duration_ms 232871.9675，退出 0。完整日志：`analysis/test-runs/gameplay-20261106/main-after-batch2-full.log`。
- gateway 合并后仍保留 onlineGift/rankAchieve/heroExtra/firstWeekGoal/growthRoad/helpUp/groupBuy 登录同步、1316 属性、207 结算/体力、邮件推送、活动期限、20001–20013 好友派发、钓鱼 ETF 参数、精英 201/207 分流与团购 100601/100602；本批未启停实时服务、未读写运行数据库、未操作模拟器/ADB/APK，未生成 APK。

## 集成与验收记录（2026-11-08 第三批）

- SOC-MSG 以 `--no-ff` 合入 main `b4880a9`。10501–10511 均有处理路径，服务 + 真实临时 TCP 13/13；推送统一 ETF 编码修复随后合入 `cb67348`。10508 登录数字槽、消息频控、跨服聚合和部分二进制载荷仍缺证据。
- HERO-HERO-B 在独立工作树完成 18 条剩余命令，rebase 到 main `8dbceb2` 后以 `--no-ff` 合入 main `eb1b1e1`。分支全量 2368（pass 2366 / fail 0 / skipped 2），主线英雄/招募/网关/M5 定向 131/131。网关逐行保留既有登录同步和派发，招募服务仅移除 651/652/673 的旧空回包占位。
- DRAW-HUNDREDDRAWACT 在独立工作树实现 117001–117005，rebase 后以 `--no-ff` 合入 main `354e1ca`。专项 8/8，活动/福利/真实网关 24/24，logical table 资产生成可复现；SQLite 重开、PB 编码失败和 SQLite 写入失败均验证整笔回滚。保底权重选择和非英雄星级奖仍明确列为证据缺口。
- 三项都没有进入 APK 验收。本轮未启停实时服务、未读写 `runtime.local-only.data` 或运行数据库、未操作模拟器/ADB/APK、未连接原游戏服务器。

2026-11-07 第二批后换 session：续接提示词已保存为[剩余玩法计划下一 session](../../../promot/2026-11-07-remaining-gameplay-next-session.md)。main=b5a44f0；
下一批工作树 `hero-hero2`（HERO-HERO-B）、`soc-msg`（SOC-MSG）、`draw-hundred`（DRAW-HUNDREDDRAWACT）已创建且无提交，可直接复用；
上一轮中止未产生额外业务改动，不等待旧 agent。

## 集成与验收记录（2026-11-08 第四批）

- 起点核对：会话开始时 main 为 `7c5f5f2`（仅文档），最新业务提交 `354e1ca`。会话期间主线被外部推进到 `866117e`（`feat(house-assistant): implement four house commands`，含 gateway 增量），本轮三个业务分支都在该提交之后合并，未覆盖外部改动。
- 主线 post-batch3 全量：在 `7c5f5f2` 上执行 `npm test`，tests 2378 / pass 2376 / fail 0 / skipped 2、退出 0。因为后续 agent 在同一路径重跑，`analysis/test-runs/gameplay-20261106/main-after-batch3-full.log` 现在保存的是 `866117e`（含 house-assistant）上的运行：tests 2385 / pass 2383 / fail 0 / skipped 2，duration_ms 288520。两次基线都通过，日志路径内容以最近一次为准。
- `866117e` 网关基线定向：house-assistant、gameplay-gateway、m5-command-matrix、login-business-reads 共 26/26 通过，日志 `analysis/test-runs/gameplay-20261106/main-866117e-gateway-sanity.log`。
- EQUIP-ARTIFACT（`df3775e`）以 `--no-ff` 合入 main `93bd156`。合并前 `git merge-base --is-ancestor main HEAD`、`git diff --check`、`git diff --diff-filter=D` 均通过；总控独立复核 13/13，合并后定向 35/35（artifact + gateway + m5 + login + house-assistant + message + hundred-draw），日志 `main-after-equip-artifact-focused.log`。
- EQUIP-RELIC（`c3bf25f` 系列）由总控 rebase 到 `93bd156`：gateway 冲突只保留双方 import 与实例（`createArtifactService` + `createRelicService`），两处派发块共存，另补 `relic-tables.mjs` 尾随空行的空白修正提交 `bfe4c15`。总控独立复核 40/40，随后以 `--no-ff` 合入 main `e30f15c`。
- SOC-CHAT（`eabc10a`）由总控 rebase 到 `e30f15c`：gateway 仅 import 冲突，保留 artifact/relic/chat 三方；chat 派发位于 message 派发之后、909103 登录之前。总控独立复核 44/44（chat + SOC-MSG + gateway + m5），随后以 `--no-ff` 合入 main `680b2b7`。
- 合并后 gateway 逐项核对：`onlineGift.beginSession`、`rankAchieve.ensureLoginState`、`heroExtra.ensureLoginState`、`firstWeekGoal.loginPayload`、`growthRoad.ensureLoginState`、`activityRead.synchronizeHelpUpLogin`、`groupBuyAct.synchronizeLogin`、`hundredDraw.synchronizeLogin`、`artifact.ensureLoginState` 全部保留；1316、67004/67005、69001/69002、20001–20013、钓鱼 ETF、精英 201/207、团购 100601/100602、207 结算/体力、邮件推送、活动期限、module 8/90 多槽、10501–10511、11000–11014、117001–117005、37060–37075、89701–89712、house-assistant 派发共存；recruit 仍在 heroCommandServices 之前，百抽仍在通用 activityRead 之前。
- 本轮主线工作树存在另一个 session 的未提交改动（`activity-calendar.mjs`、`welfare-service.mjs` 及三个测试、hundred-schools 文档）与未跟踪 `assets/`。总控未清理、未覆盖、未提交这些改动；三次合并均未触碰这些路径。
- 三项都没有进入 APK 验收，未启停实时服务、未读写 `runtime.local-only.data` 或运行数据库、未操作模拟器/ADB/APK、未连接原游戏服务器。

## 集成与验收记录（2026-11-08 第五批）

- CORE-TIME-TEMPLE（`677c164`，rebase 后 `ea91c18`：空白修正）以 `--no-ff` 合入 main `73afd43`。结论是“证否”而非实现：`Cmd.lua` 注册表全表反解显示八个 `req_time_temple_*` 编码器在本版客户端没有数字 C2S type，`Connection:Send` 遇 nil 直接放弃发送。附带修复网关对空 `bytes` 请求载荷记录时抛错的既有缺陷（`payloadBytes()` 替换 8 处 `.subarray` 写法，响应字节不变）。总控复核 30/30（time-temple + gameplay-gateway + m5 + gateway-probe + message + hundred-draw + group-buy），`git diff --check` 空白问题已由 `ea91c18` 修正。rebase 时与总控状态表自动合并，保留本文件第四批内容与该任务的取证结论。
- 本批未进入 APK 验收：CORE-TIME-TEMPLE 在本版本没有可操作入口，未启停实时服务、未读写运行数据库、未操作模拟器/ADB/APK。
- PAY-DRAGONLANDACT（`3bffc18` 系列，总控补 `831f9f3`：复用 `payloadBytes()` 记录空载荷并清尾随空行）以 `--no-ff` 合入 main `01821e4`。107701/107702/107703 全部走真实表与本地状态，网关新增登录同步位于 groupBuyAct 之后、hundredDraw 之前，派发块位于 groupBuy 之后、hundredAcc 之前，原 107703 空包读取项已删除。总控复核 32/32（dragon-land 服务与网关 + gameplay-gateway + m5 + group-buy + hundred-draw + time-temple）。证据缺口：龙岛战斗命令未路由、日奖重置口径、跨成员公会聚合。
- CORE-BATTLE-B（`50b9e6e` 系列，总控补空白修正）以 `--no-ff` 合入 main `8cb9161`。新增专有战斗状态容器与规则模块，覆盖天极值付费、超凡生命、召唤替死、破盾、伤害上限、额外行动、魔能领域与三类命名层数，并修正 `runHooks` 用钩子所有者当行动者导致队友行动误触发的缺陷。该分支 rebase 到 `8d24290` 后由总控重跑全量：2467 项、pass 2465、fail 0、skipped 2（日志 `analysis/test-runs/gameplay-20261106/core-battle-b-full-verify-by-orchestrator.log`）。行为变更（`120001001` 改为真实额外行动、天极英雄不再以能量释放天极技）已同步到既有断言，仍需真实客户端复核手感。
- 本批仍无 APK 验收：CORE-BATTLE-B 与 PAY-DRAGONLANDACT 只有服务端与临时 TCP/SQLite 证据，未操作模拟器/ADB，未生成 APK。

## 集成与验收记录（2026-11-08 第六批）

- DRAW-BONUSDRAW（`f2d0166`，rebase 后六提交）以 `--no-ff` 合入 main `72c8d4d`。101901/101902/101904 全部走真实池状态、资源发放和 SQLite，专项/相关网关 41/41；主线合并后百抽/活动/网关 19/19。101902 的 ETF `cur_pool`、单奖项权重、折算与登录槽仍明确待证。
- 同一基线暴露 16004 许愿树周期边界缺陷：服务器 03:00 日界越过 `WishTreeGlobal.max_accrue_day` 后，wallet 在扣券后调用 `recordPurchase()` 抛 310，使整笔购买失败。代码修复 `bc73beb` 仅让 wallet 在明确 310 时记录 `wish_tree_rebate_skipped` 并继续购买，其他错误照常回滚；`wish-tree-service` 的周期外拒绝语义未改变。以 `--no-ff` 合入 main `b8b9bd5`，文档复核提交随后合入 `d84ce1f`。合并后购买/许愿树/代金券专项 65/65，分支全量 2481（pass 2479 / fail 0 / skipped 2）；日志 `main-after-wish-tree-rebate-focused.log`。
- PAY-DIAMONDBANKACT（`e6ef47d`）以 `--no-ff` 合入 main `c0ba81a`。110201/110202/110203 全部走配置、角色状态、资源与模块 92 登录；复核时修正了多任务 pending 奖励按任务数重复入账的问题。主线合并后定向 61/61，含真实临时 TCP、SQLite 重开、PB 编码失败与 SQLite 写入失败整笔回滚；日志 `main-after-diamond-bank-focused.log`。
- 三次合入均保留主线另一 session 的未提交改动和未跟踪 `assets/`。没有进入 APK 验收，未启停实时服务、未读写 `runtime.local-only.data` 或运行数据库、未操作模拟器/ADB/APK、未连接原游戏服务器。

## 集成与验收记录（2026-11-08 第七批）

- 起点 main db0437e。三项依次合入：PAY-FREEPRIVILEGEACT（rebase 后 228608b）以 --no-ff 合入 e1d35f4，合并后定向 61/61；PAY-SLOTGAMEACT（rebase 后 02a583f，gateway 7 处纯新增冲突逐段保留）以 --no-ff 合入 85ec949，rebase 后定向 59/59；CORE-BATTLE-C（0bd1bcf）以 --no-ff 合入 aa3272e，合并后战报与网关定向 38/38。
- CORE-BATTLE-C 把 pb_fat_buff_change(103) 与 pb_fat_harm(107) 接到真实模拟结果：state 增加/到期/驱散/死亡产出 buff-change 事件，治疗事件补齐战报字段；纠正上一轮 WIP 的 pb_buff_obj.sign 语义（true=增加、false=移除，overlay 是层数增量）。未证的 FightTable.Buff 行、属性增减、专有状态与 117/118/119 一律不发包，服务端状态照常计算并有测试守护。
- 三项均未进入 APK 验收；本轮未启停实时服务、未读写 runtime.local-only.data 或运行数据库、未操作模拟器/ADB、未生成 APK。主工作树未跟踪 assets/ 保持未提交。

2026-11-08 派发边界调整为三大块，见 [三大块](15-three-work-blocks.md)：块 A #1–#33（本 session）、块 B #34–#119、块 C #120–#276。

## 集成与验收记录（2026-11-08 第九批：块 I）

- 按 [15-three-work-blocks.md](15-three-work-blocks.md) 的块 I（#212–#264，53 卡 / 106 条缺失命令）实施，分支 `task/PAY-BLOCK-I-20261108`。先用真实网关逐条探测：114 条相关命令里 25 条已路由、89 条仍返回 `LOCAL_NOT_IMPLEMENTED`；派发文档的 106 条与之的差集来自 16001–16005、35001/35002/35005、37010、88201–88204、100601/100602、107701–107703、110201–110203、110601/110602、110801/110802、84601 等既有实现。
- 新增 `personal-server/game/benefit-commerce-service.mjs` 接管全部 89 条未路由命令。真实结算 3 条：16006 并入 welfare 既有 `purchaseGift`（与 16005 同 schema，走 wallet 下单/余额/订单/1900/16003），87301 按 `PermanentCardTable.reward` 发每日奖励并写模块 62 `last_reward_day`，84602 按 `EnergyAward` 补领当日公主午/夜体力并前移模块 126 领取位，使 84601 当天再领返回 310。
- 其余 86 条按任务卡分组 fail closed：返回 `err 5` 并附具体缺失证据（如“PAY-VIP: VipTable 未导出”），写 `benefit_command_refused` 审计日志。根因是这些玩法只有协议、没有随包导出的配置表（TriggerGift/UpStarGift/Vip/Fashion/WeekendBonus/Auction/ActShop 等 42 个族）；35003–35011 的 ETF 请求连参数 schema 都没有，77002 回包定义缺失。
- 专项 `personal-server/test/benefit-commerce-gateway.test.mjs` 4 项：块 I 的 112 条命令逐条真实握手往返断言无 `LOCAL_NOT_IMPLEMENTED`；87301 发奖、重复 310、带参 1、SQLite 重开保持；84602 双档补领与当日重复拒绝；33001/102701/107301 拒绝码 5。逐卡缺口见 [PAY-BLOCK-I 实施记录](../../../agent/workflow/gameplay-completion/PAY-BLOCK-I/implementation.md)。
- 本批无 APK 验收：未启停实时服务、未读写运行数据库、未操作模拟器/ADB，未连接原游戏服务器。

## 集成与验收记录（2026-11-08 第十批：块 F 续做）

- 按 [15-three-work-blocks.md](15-three-work-blocks.md) 的块 F（#120–#150）续做，分支 `task/BLOCK-F2-20261108`，worktree `.worktree/gameplay-20261108/block-f2`，起点 main `1616438`。F 的 74 条原缺失命令现有明确路径：统一 draw-activity 服务新增 65 条，既有百抽服务 5 条、奖励抽取服务 3 条、许愿树服务 1 条。65 条中 44 条具备表驱动成功路径，21 条因缺奖池、生产进度或权威全服状态无条件 fail closed；有路径不等同整卡或 APK 完成。
- 统一服务按 `(role,module,version)` 持久化计数器、领取位和选择项，新增真实角色日志；所有成功路径在同一 SQLite 事务中完成扣费、发奖、状态和 PB 编码。网关只对 34 条声明的 ETF 请求执行 ETF 解码，其余 protobuf 命令直接传原始 bytes，修复了把 PB 数据误送 ETF 的早期问题。
- 详细实现覆盖轮盘、三诫、金字塔、百倍奖励、棋盘、奖券成就、抽奖活动、神秘心愿、水果大奖选择、精灵选择、胶囊四命令、拼图、千抽、祈愿和翻牌累计奖等；棋盘 `is_special` 已纠正为展示标志，使用 `Param.max_turn` 结束回合。象棋翻转领奖在缺 `ActActive → ActTurn` 映射时明确拒绝。逐族规则及 21 条 fail closed 清单见 [BLOCK-F 实施记录](../../../agent/workflow/gameplay-completion/BLOCK-F/implementation.md)。
- 服务专项 14/14：真实资源变化、领取位/重开、棋盘 15 格、抽奖活动日志、千抽 pending/领取、祈愿阈值、翻牌 pending/claim、PB 编码失败回滚和 SQLite ABORT 回滚。临时端口真实握手/TCP 覆盖 104501→104502、109101→109102 成功及 105502 `err 5` 拒绝。分支全量 `npm test`：2609 项、pass 2607、fail 0、skip 2。
- 未做 APK/真实客户端验收；未启停实时服务、未读写运行数据库、未操作模拟器/ADB、未连接原游戏服务器。`102401`、`103502/103503` 等虽具有限制路径，但生产进度来源未接入时仍会明确拒绝，不能按“服务端完成”销项。

## 集成与验收记录（2026-11-08 第八批：块 F 首批）

- 按 [15-three-work-blocks.md](15-three-work-blocks.md) 的块 F（#120–#150，31 卡 / 74 条缺失命令）实施，分支 `task/BLOCK-F-20261108`。交付分两层：24 张活动配置表从客户端 LuaJIT 资产可复现抽取（`tools/extract-draw-activity-tables.mjs`，dump 落在 `personal-server/assets/tables`），并新增 `config/draw-activities-tables.mjs`；表解释器补 `UGET` 容错。
- 真实业务只完成三条：DRAW-TURNTABLEACT 107901、DRAW-CAPSULETOY 102301、DRAW-THREEADMONITION 88965。三者按表内价格扣费、按权重或上限发奖、写 `draw_activity_state`/`draw_activity_logs`，网关在 bonusDraw 之后、activityRead 之前派发。专项 4/4，draw-activity + gameplay-gateway + m5-command-matrix + hundred-draw-gateway + bonus-draw-gateway 定向全通过（日志 `analysis/tmp/f-block/focused.log`）。
- 其余 71 条仍是 `LOCAL_NOT_IMPLEMENTED`，不计完成：多数族卡在回包 `.db.proto` 数据消息未反解（`pb_capsule_toy_all`、`pb_chess`、`pb_thousand_draw_role_info` 等）或缺奖池表（`PuzzleVersion.draw_lib=5510`、`HeroBlazonDraw.draw_lib=3201`、`Lottery.Item.draw_lib=3901`）。逐族原因见 [BLOCK-F 实施记录](../../../agent/workflow/gameplay-completion/BLOCK-F/implementation.md)。
- 三条命令的 ETF 请求形态尚未与抓包比对，未做真实 TCP 端到端；未进入 APK 验收；未启停实时服务、未读写运行数据库、未操作模拟器/ADB、未连接原游戏服务器。

合并：`1e93174` 以 `--no-ff` 合入 main `74060e6`；冲突只在状态表，块 I（第九批）与块 F（第八批）两段并存保留。合并后定向 24/24 通过（draw-activity + gameplay-gateway + m5-command-matrix + benefit-commerce-gateway），日志 `analysis/tmp/f-block/main-after-merge.log`。

## 块 C 交付记录（2026-11-08）

分支 `task/BLOCK-C-20261108`，worktree `.worktree/gameplay-20261108/block-c-20261108`。16 张卡中 EQUIP-ARTIFACT/EQUIP-RELIC 已是服务端完成状态，本轮只回归；EQUIP-MAGICCIRCLE 无新增命令。其余 14 张卡的 59 条命令全部接入网关：

| 任务 ID | 状态 | 服务 / 证据 | 下一依赖或证据缺口 |
| --- | --- | --- | --- |
| EQUIP-EQUIP | 服务端完成（觉醒/批量精炼规则待证） | 1007 觉醒、1008 兑换、1009 批量精炼；消耗取 `EquipTable.Const.awaken_open`/`ResExchange.value`/`Refine.cost`；1001–1006 回归 11/11 | 觉醒是否等同“突破精炼上限”未取证；`ResExchange.value` 的比例语义需客户端对照 |
| EQUIP-ARTIFACT | 服务端完成（4 条 fail closed 待补） | 37060–37075 已在 main（`artifact-service.mjs`），本轮未改 | 与上一轮记录相同 |
| EQUIP-WARRUNE | 服务端完成（表生成阻塞） | 83001–83007；状态落 `develop_module_state`；消耗 ItemWarRuneChip | 登录槽位未恢复；WarRuneTable 为 LazyInit 生成器，等级/阶段消耗与属性池未取证 |
| EQUIP-MUSEUM | 服务端完成（奖励清单待补） | 85701/85702；博物馆人气与领取位落库，收藏激活消耗 MuseumCollectionItem | 人气奖奖励物品未落地，只落领取位 |
| EQUIP-FANTASYHANDBOOK | 服务端完成 | 89001；幻武图鉴星级落库，消耗 FantasyEquipChip | 幻武图鉴表与消耗比例待证 |
| EQUIP-RELIC | 服务端完成（保底/depot 槽位待补） | 89701–89712 已在 main（`relic-service.mjs`），本轮未改 | 与上一轮记录相同 |
| EQUIP-PET | 服务端完成（灵核容器与表生成阻塞） | 90731–90748 共 17 条；宠物本体走模块 158，灵核 uid 与灵祠槽位落库；消耗 PetChip/MutantItem | 灵核背包容器未对齐；PetTable 逐级消耗与灵核升星规则待证 |
| EQUIP-PETPLAY | 服务端完成（奖励清单待补） | 90901/90902；按周周期落领取位与地图推进 | PetPlayTable 奖励与地图配置未取证 |
| EQUIP-ENERGYBURST | 服务端完成（奖励清单待补） | 91001；领取位幂等落库 | EnergyBurstTable 奖励未落地 |
| EQUIP-TREASURE | 服务端完成（抽卡阶段奖励待补） | 93301–93306；秘宝走模块 534，升星消耗 TreasureChip，阶段领奖按位图落库 | 自选抽卡与魔法罐的天数规则未取证 |
| EQUIP-ELVES | 服务端完成（表生成阻塞） | 93701–93707；精灵走模块 538，消耗 ElvesChip/MutantItem | ElvesTable 天赋/破格消耗与皮肤校验未取证 |
| EQUIP-ELVESBEAD | 服务端完成（穿脱槽位待对齐） | 93751–93755；灵珠走模块 539，穿脱槽位落库 | 灵珠分解放回物品未取证；穿脱未写回精灵本体槽位 |
| EQUIP-LEADEREQUIP | 服务端完成（重铸 schema 缺失） | 98402–98407；团长装备走模块 175，98401 不变 | 98406 的 `pb_leader_equip_recast_back` 客户端 proto 缺失；98404 分解返还与 98402/98405 消耗未取证 |
| EQUIP-DIVINEEMBRYO | 服务端完成 | 102201；自选编号落库并回 `pb_divine_embryo_data` | 保底计数与礼包限购记录未接 |
| EQUIP-BADGE | 服务端完成（分页映射待补） | 104201；激活消耗徽章道具并回 `pb_badge_role` | BadgeTable 的分页归属未取证，当前统一落在 page 1 |

验证：`node --test test/endgame-develop.test.mjs` 9/9；`test/equip-service.test.mjs`+`test/equip-tables.test.mjs` 11/11；网关可加载。未做真实 TCP 19090 联调、未做全量 `npm test` 复核、未进入 APK 验收；本轮未启停实时服务、未读写运行数据库、未操作模拟器/ADB。


## 集成与验收记录（2026-11-08 第十批：块 H）

- 按 [15-three-work-blocks.md](15-three-work-blocks.md) 的块 H（#180–#211，32 卡 / 94 条缺失命令）实施，分支 `task/ACT-REWARD-H-20261108`，工作树 `.worktree/gameplay-20261108/act-reward-h`。
- 表资产：`tools/extract-act-tables.mjs` 从客户端 Lua 项目包（`analysis/tmp/lua-bundles/64_lua_project.bundle`）重建 27 个活动表族的原型 dump，落在 `personal-server/assets/tables/*.data.lua.json.gz`；`config/act-activity-tables.mjs` 提供 29 个表键读取器。
- 服务：新增 `personal-server/game/act-reward-service.mjs`，94 条命令全部有路由，其中 92 条走真实业务（客户端表奖励、`activity_claims` 领取位、`act_reward_state` 进度），重复领取 310、未开始 309、余额不足 301，整笔事务回滚。
- 41 条按任务卡分组 fail closed（`err 5` 附缺失证据）：79103、99401/99402、100101、102906、104601/104602、106203/106205、118001，邀请与回归的 105201/105202/105250/105251/105303/105305/105307，以及夏日 PVE/PVP/养成/结算的 1037xx/1038xx/1039xx/1041xx 一族。逐条原因见 [ACT-REWARD-H 实施记录](../../../agent/workflow/gameplay-completion/ACT-REWARD-H/implementation.md)。
- 验证：专项 `test/act-reward-service.test.mjs` 9/9；合并后在工作树复核 `act-reward` + `gameplay-gateway` + `m5-command-matrix` 25/25；分支全量 `npm test` 2603 项、pass 2601、fail 0、skipped 2（日志 `analysis/test-runs/gameplay-20261106/main-after-block-h-full.log`）。
- 证据缺口：`*_bin` 领取位按 proto3 打包 repeated uint32 推断；预热表按 `act_id % 1000` 取 board、`<version><1000><index>` 编 Award、`available_sec` 视为自活动开始经过秒数，三处未与抓包对照；未接登录模块 92；无 APK 验收。本批未启停实时服务、未读写运行数据库、未操作模拟器/ADB/APK。
## 块 G2 执行记录（2026-11-08）

- 分支 task/BLOCK-G2-20261108（基于 main 8ebd5a1）完成 #163–#179 共 17 卡、96 条命令的服务端接入：personal-server/game/minigame-act-service.mjs + config/minigame-act-tables.mjs + 15 个表资产 + 网关派发与模块 92 登录同步。
- 状态：完整实现 6 卡（PUZZLEACT/TILESWAP/MUSHROOMMONSTER/GOPHERACT/MATCHINGGAMEACT/ALBUM）；服务端完成含明确拒绝 8 卡（TOWERACT/SPIRITCOURTYARD/TRIPLEMATCH/MONOPOLYACT/DREAMTRIALACT/DIAMONDVEINACT/HOMELAND/BAKINGACT）；仅明确拒绝 1 卡（SOURCEPOINT，源点实例未建模）；FISHINGACT 与 HELPUPACT 回归确认未改动。
- 明确拒绝均为 GameError(5, 缺口说明)，无空包/固定值销项。逐卡记录见 agent/workflow/gameplay-completion/<CARD>/implementation.md，块记录见 agent/workflow/gameplay-completion/BLOCK-G2/implementation.md。
- 测试：专项 17/17；分支内全量 2560 项 pass 2558 / fail 0 / skipped 2；合入 main（24f90e9）后在干净 worktree 复核 2632 项 pass 2630 / fail 0 / skipped 2；补跨块表格式兼容（88219ca）后，main 最终全量 2674 项 pass 2672 / fail 0 / skipped 2。未做 APK 实测，未启停实时服务、未操作设备。

## 块 D 交付记录（2026-11-08）

分支 `task/BLOCK-D-20261108`，worktree `.worktree/gameplay-20261108/block-d-20261108`，基于 `main@bd650ba`。块内 22 卡 / 58 条命令中，9 卡（ITEM-SHOP、ITEM-ITEM、ITEM-MISSION、ITEM-GUIDE、ITEM-EVERYTASK、ITEM-COMMONTASK、ITEM-RANKACHIEVE、ITEM-FIRSTWEEKGOAL、ITEM-GROWTHROAD）此前已合入 main，本轮处理剩余 13 卡 / 27 条命令。

- 交付 2 条：82301（ITEM-FUNCTIONMANUAL，模块 106，按 `FunctionManualTable.Task` 28 行复核 `task_list`，统计源与 `progress_fun` 2/10 行可领，其余进度源返回 5）；105701（ITEM-TASKACTIVITY，按 `ActFrameTable` 类型 1003 的窗口与 `TaskActivityTable.Lib` 版本任务复核，登录把 `pb_task_activity_role_info` 包进模块 92）。两条命令都写 SQLite 领取位、真实发奖，支持重开与编码失败回滚。
- 105702 未实现：`server_vitality` 需要全服活跃度，本服没有权威生产方，返回 5。
- 其余 10 卡 / 24 条命令逐卡记录阻塞证据：表未导出或行数为 0、奖励配置缺失、没有权威进度来源。没有用空包、固定值或客户端自报完成来销项。
- 新增 `tools/extract-lua-table-rows.mjs`（LuaJIT 字面量表行抽取）与 `FunctionManualTable.rows.json.gz`、`TaskActivityTable.rows.json.gz`。
- 验证：分支全量 2646 项 / pass 2644 / fail 0 / skipped 2，日志 `analysis/test-runs/gameplay-20261106/block-d-merged3-full.log`。`8ac7a73` 以 `--no-ff` 合入 main `78b1a46`；合并后 main tree 与测试提交 tree 相同（`dbe81e8`）。未启停实时服务、未读写运行数据库、未操作模拟器/ADB、未改动 APK。

## 块 J（#265–#276）交付记录（2026-11-08）

- 分支：feat/block-j-role-support（worktree .worktree/block-j-20261108），提交 fdffe0a，已合入 main。
- 新增服务：role-service（RoleCmd 23 条 + gm_cmd + 红点/日志/推送/玩家数据）、story-service、cdkey-service、act-frame-service（53001–53006）、skin-service（76003–76009）。
- 迁移：game-store v17 新增 role_profile_extra / role_stories / role_red_dots / role_channel_push / client_diagnostic_logs / cdkey_redemptions / role_figure_items / role_skins / hero_skin_wear / role_skin_state / role_skin_handbook / role_activity_stages / gm_audit_entries。
- 验证：test/block-j-role-support.test.mjs 4 项通过；gameplay-gateway、login-business-reads、system-integration 回归通过；SQLite 重开后 user_version=17 且角色/奖励/皮肤/剧情/红点/兑换状态保留。
- 证据缺口：FunctionCache 块 ID、RoleRank 与视频奖励行、皮肤/图鉴配置、开发登录回包字段、53001 双整数语义；均已在 agent/workflow/gameplay-completion/ROLE-*/implementation.md 记录，未以空包冒充完成。

## 2026-11-08 G1 探索与家园前半（#151-#162）

分支 task/G1-EXPLORATION-20261108（worktree .worktree/gameplay-20261108/g1-exploration）。98 条命令全部注册；真实状态迁移已覆盖 PLAY-EXPERIENCEACT（2）、PLAY-RADISHFARM（6）、PLAY-HOMEPUZZLEACT（9）、PLAY-MINIGAME（4）、PLAY-GRANDTOURER 每日令牌（1），共 22 条。其余 76 条以 err=5 显式 fail closed，不计作完成。11 张客户端活动表由 tools/extract-exploration-tables.mjs 恢复。专项 7/7 与 gateway 7/7 通过；无 APK 验收。详见 agent/workflow/gameplay-completion/G1-EXPLORATION/implementation.md。
