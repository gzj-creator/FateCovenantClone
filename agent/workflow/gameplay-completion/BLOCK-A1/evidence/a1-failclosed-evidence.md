# A1 三条 fail-closed 命令的客户端证据复核（2026-11-08）

范围：205 share_report、89601 req_star_mission_award、104701 req_destiny_pve_fight。
只使用仓库内离线证据：已解包 LuaJIT 字节码（analysis/scratchpad/time-temple-20261108）、客户端 protobuf 文本（personal-server/assets/protobuf）、表格 dump。未连接原服、未启停实时服务、未读写 runtime.local-only.data、未操作 ADB/APK。

证据源（SHA256，均可本机复核）：

| 文件 | SHA256 |
| --- | --- |
| core/14598954643145832000-Cmd.lua.bin | 36EBC52059977DE944DA4F57AB15CE0238ACB360E07FC976DD68F4F73D4453C8 |
| project/13504459777583070000-FightCmd.lua.bin | 482692F51D6872E454529BD2FB2F79B5923E5747B28EBA4E5799484363F53ED0 |
| project/7824923318130286000-FightReportMgr.lua.bin | 6C96D63404D4458870443853CD48E6C6FED7D7D8021E42784E1B5323060E5D9D |
| project/12220024299770170000-FightReportForm.lua.bin | E366FC3B554BF042485FB93E59F62DFA24FD26A4DC9F35D4C7591B92E90F736D |
| project/18104108858295468000-StarMissionCmd.lua.bin | 236F0644FBD297EFFB06551CC40D2B66B0F60EE3B76169725AAF623E3E03F813 |
| project/3712381569805115000-StarMissionMgr.lua.bin | 83BB0B5B141B6D5DFF56AECA520D77E8D63214183142A65FB20ACF03D2C77226 |
| project/863859474235759100-DestinyPveCmd.lua.bin | 1FFA0B6B4C6BC78295A43794A37D9E2F8D10D28AC09412C8C6978BFC34EF0CFF |
| project/9474201953748470000-DestinyPveActFightMgr.lua.bin | 15E74AEE216059747E15C826CF67508CC5B216809E646AAE253C2F3C6D5C01A8 |
| project/5872919610681180000-FightTable.Fight.120.data.lua.bin | E3E287D5F0C6DEE960B31EA3166443DAD5D90988D252F7FA6FF026F1ABC8D479 |
| project/4151505993076485000-FightTable.Custom.120.data.lua.bin | C9502D9691160382CE2A7C4F82A03FA45428597EBED61B757592EFF28D90EB5A |
| personal-server/assets/protobuf/destiny_pve.net.proto.bin | 7CD8A287B35A4941583B65C83137B2837AC8C70170CB39C828E2520FA8AE4939 |
| personal-server/assets/protobuf/fight_report.net.proto.bin | B9AE2D1117EE41A73C88388C938C978FCF8A1E4D6AFA2FD482FD3FF56724547C |

复现命令（在 a1-evidence worktree 运行）：

    node tools/extract-cmd-registry.mjs --cmd <Cmd.lua.bin> --lookup share_report,req_star_mission_award,req_destiny_pve_fight
    node tools/dump-luajit-prototypes.mjs <x.lua.bin> [字符串过滤]

## 1. 205 share_report：本版可达，按证据改为空回执

命令注册（Cmd.lua 原型 0，常量槽 c2s_index/c2s_back/c2s_switch）：

- c2s_index = 205
- c2s_back = nil
- c2s_switch = 29

请求构造（FightCmd.lua 原型 4，firstLine 54，bytecode offset 659）：

- EncodePB("pb_share_report", { fight_id = 参数1, fight_type = 参数2 })（TSETS 分别写 fight_id/fight_type）
- 返回 ("share_report", "pb_share_report", encoded)
- 字段号来自 fight_report.net.proto.bin 第 21 行：fight_id = 1 (int64)，fight_type = 2 (int32)

调用链（本版可达，先前“不可达/缺回包”的判断不成立）：

- FightReportMgr.lua 原型 5（firstLine 92，offset 544）方法 ShareReport：
  Seq.New():Send(FightCmd.share_report(...), 回调原型 4)
- FightReportForm.lua 原型 19（firstLine 350）调用 FightReportMgr.ShareReport(id)
- 回调原型 4（firstLine 94）常量：Err、NO_ERROR、UIKit、ShowError，即只在 err != NO_ERROR 时弹错误

回包语义：

- c2s_back 为空，Connection._DecodeMsg（Connection.lua 原型 24，firstLine 425）在没有 pb 名字时走 Codec.DecodeErl；负载为空时直接返回 Err.NO_ERROR 与空表（pc 112-115），不要求任何业务字段。
- 全量 Lua 项目中未找到 share 奖励、分享计数或分享记录表；RoleShareCmd/RoleShareTable/ChatShareMgr 属于角色/聊天分享，与 205 战报分享是两套东西。

处理方式：205 由 battle-record-service 校验 fight_id/fight_type 后回 code 0 的空帧，并写一条 battle_report_shared 审计日志；不发奖、不落库、不广播。依据是回包无 schema 且回调只判错，空成功帧是协议层唯一有证据的安全响应。

## 2. 89601 req_star_mission_award：本版不可达，保持 code 5

- StarMissionCmd.lua 原型 0（firstLine 10）：直接 Codec.EncodeErl(原始参数 0)，不构造具名对象；与 89602-89604 的 EncodePB 具名请求不同。
- Cmd.lua：c2s_index = 89601，c2s_back = nil，c2s_switch = 92057。
- 全项目精确搜索字符串 req_star_mission_award，仅命中 Cmd.lua.bin 与 StarMissionCmd.lua.bin 自身（10,929 个 project 资产 + 166 个 core 资产）；没有任何 UI/Mgr 调用点。
- StarMissionMgr.lua 实际只引用 req_star_mission_chapter_award、req_star_mission_skill、req_star_mission_skill_reset（89602-89604）。

结论：该命令在本版客户端不可达，请求参数语义与奖励映射都无法由客户端证据确定，继续保持错误码 5，不猜测 award id 与奖励。

## 3. 104701 req_destiny_pve_fight：顶层命令不可达；真实战斗走 201 + 结算 stm 流；敌方阵容仍缺

请求定义（destiny_pve.net.proto.bin）：

    message pb_destiny_pve_fight_req { uint32 activity_id = 1; }

DestinyPveCmd.lua 原型 0（firstLine 10）只把 activity_id 写入 pb_destiny_pve_fight_req。

命令注册：c2s_index = 104701，c2s_back = "pb_destiny_pve_fight_rsq"。该名字在随包 protobuf 中不存在；同一文件里定义的是 pb_destiny_pve_fight_rsp。但这并不构成真正缺口：客户端不通过 c2s_back 名字解析这场战斗的回包。

真实流程（DestinyPveActFightMgr.lua）：

- 原型 7（firstLine 17）StartFight：DestinyPveTable.Layer[GetLayerTid()].fight_id 取关卡战斗 id；FightCreateObj.New(fight_id)；SetRequest(Codec.EncodePB("pb_destiny_pve_fight_req", { activity_id = GetActTid() }))；随后走本地 FightMgr.Start。
- FightMgr.lua 原型 11（firstLine 147）EnterFighting：打包 FightCmd.fight_start（201），请求含 fight_tid、enemy_id、stm_type 与上面 GetRequest 得到的 req 二进制。
- 结算：DestinyPveActFightMgr.lua 原型 9（firstLine 105）以 Codec.DecodePB("pb_destiny_pve_fight_rsp", stm_data) 解码，再 AwardKit.Parse(res)、FightResultBaseObj.New、SetFightReport/SetPassRecord。

即：104701 这个顶层命令在本版没有调用点（字符串同样只出现在 Cmd.lua 与 DestinyPveCmd.lua），命运回廊的战斗请求作为 201 fight_start 的 stm 子载荷发送，结果从通用结算 stm 流里解 pb_destiny_pve_fight_rsp。先前的“回包 schema 缺失”是误判。

真正的阻断项是敌方阵容：

- DestinyPveActFightMgr.lua 原型 11（firstLine 163）GetEnemyHeroList：FightTable.Fight[fightId].def_team → FightTable.Team[teamId].npc → HeroTable.Npc[npcId].relation_hero；custom_star 取自 FightTable.Custom[fightId]。
- 随包数据：DestinyPveTable.Layer 的 fight_id 从 12010001 起；FightTable.Fight.120 分片共 301 行，def_team 全为 null。示例行 12010001 原始数组（21 列 schema）为
  [null,12010001,137,43,false,159,1,false,null,0,null,null,null,null,false,0,false,true,false,false,true]
  对应 tid=12010001、type=137、scene=43、lineup=159、atk_team=null、def_team=null、atk_team_lv=null、def_team_lv=null。
- FightTable.Custom.120 的 schema 只有 custom_pet/tid/boss_tip/custom_caption/default_speed/figure_rank_repress/def_power/custom_star/custom_extra_skill_show/custom_elves，没有 def_team。

因此服务端拿不到 12010001 之后的敌方队伍与 NPC 列表，无法用本地 simulateBattle 生成权威战报。104701 以及命运回廊的 201 战斗入口继续保持 code 5；补齐条件是按 fight_id 提供真实 def_team → Team.npc → HeroTable.Npc 敌方阵容（或经部署注入的等价阵容表），不得凭空构造胜负与战报。

## 变更与测试

代码变更（本分支）：

- personal-server/game/battle-record-service.mjs：205 由抛 code 5 改为校验参数后回空成功帧并记日志；删除 REPORT_SHARE_REFUSAL 导出。
- personal-server/test/battle-record-service.test.mjs：205 用真实 pb_share_report 编解码断言回执、空帧与非法参数。
- personal-server/test/battle-core-gateway.test.mjs：临时 TCP 网关断言 205 返回 code 0 且负载长度为 0。

测试证据：

- 变更前三条 fail-closed 定向：14/14 通过，日志 analysis/test-runs/gameplay-20261106/a1-evidence-failclosed-focused.log。
- 变更后 205 + 网关（含 211/212/89602 回归）：5/5 通过，日志 analysis/test-runs/gameplay-20261106/a1-evidence-205-ack.log。

未完成项：89601 与 104701 未改代码，保留 code 5；104701 需敌方阵容数据，89601 需客户端调用点或动态流量证据。
