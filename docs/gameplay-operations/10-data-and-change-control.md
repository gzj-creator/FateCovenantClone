# 10 数据字典、配置与变更管理

## 1. ID空间与字段字典

| 名称 | 含义 | 本轮例子/误用风险 |
| --- | --- | --- |
| serverId | 区服，不是账户/角色 | 当前配置3；跨服scope不能沿用server:1默认 |
| account_id | SDK/钱包账户身份 | 与role_id关联，昵称不可作为唯一键 |
| role_id | 玩家角色身份 | 不能把config.roleId或历史role1当所有玩家 |
| hero.tid | 原英雄配置ID | 3030501蜜雪儿；1020601为引导奖英雄 |
| hero.uid | 玩家拥有对象ID | 新号/多账号uid规则由服务器生成，不得串角色 |
| npcTid | 战斗NPC配置ID | 3030500，通过relation_hero关联蜜雪儿 |
| cell.index | 养成格/阵位索引 | 可能承载等级突破，不能直接当hero.uid |
| lineup type | 玩法/编队类型 | 与team_index、preset index分别处理 |
| loc | 战斗位置 | Team105为5，不是数组下标0 |
| Section.tid | 主线节点 | 10205首章末战、10206剧情、20201为2-1 |
| Fight.tid | 战斗配置 | 105/201，不能用Section ID查询敌战力 |
| report.id | 对局战报流水 | 与Fight配置ID、结算票据分别保存 |
| Team.tid | 静态队伍模板 | 105敌队；91102攻方引用已提取，其强制出战语义待证 |
| team_lv | 原队伍模板字段 | 已恢复链用作NpcAttr键，不能当玩家等级 |
| Process/key/Step | 引导流程/检查点/具体步骤 | Process104、key106004、Step106004各有独立语义 |
| Award.tid | 引导奖励配置 | 1和2不是Process ID，不能请求一律发同一个奖 |
| funId | 功能开放ID | 目标域与位图分组；不等于活动ID |
| actId/version/period | 活动实例/内容版本/期号 | 1074011与命令107401是不同空间 |
| taskId | 对应任务定义 | 必须加所属活动/期号或永久任务范围 |
| shop/goods/product | 商店、商品位、现金商品 | 现金product不必等于道具tid，复用商品需上下文 |
| request_id | 一次交易/补发幂等请求 | 重试相同ID且参数一致，不能每点一次生成新ID |
| currency tid/amount | 游戏资源ID与整数数量 | 金额分、券张数、钻石数分别储存 |

## 2. 配置与消费者

| 规则 | 原版来源/本地配置入口 | 当前主要消费者 |
| --- | --- | --- |
| 初始档 | Role.FirstCreationAward、原登录初始化 | new-account-state、game-store、local-game |
| 主线/体力/扫荡 | MissionTable | mission-tables、mission-fight、mission-extra、energy |
| 真实敌阵 | JourneyFightTable资产对应Fight/Team/Fighter/AttrAbility分片 | mission-fight已接fight-team-resolver守方模板；NPC技能和附加属性仍缺 |
| NPC/技能/属性 | HeroTable.Npc/Npc_Ability/NpcAttr/NpcAttrRatio、AttrType等 | attribute-tables/service、hero-skill-loadout、battle-engine |
| 引导 | GuideTable与GuideMgr/Step/Cmd | guide-awards、guide-service、gateway8000、module16 |
| 功能开放 | FunOpenTable/MethodScript/MethodTable | fun-open-rules.json、feature-rules/service、overrides |
| 养成 | Hero/Equip/Artifact/Relic/Fantasy等各族表 | config各reader、对应服务、属性装配 |
| 奖励/资源 | Res/Item/Draw和各玩法award表 | resources、item-box、recruit与各领取服务 |
| 活动 | Activity/ActFrame和各族版本表 | activity-calendar/lifecycle/runtime、各活动服务 |
| 商品 | Recharge、Shop、各活动gift/permit表 | wallet、shop、benefit、各活动购买解析器 |
| 区服/运营 | public-server、launch-profile、activity-calendar-realm-3 | local-server、SDK/list、scheduler、admin |

源码路径统一从`personal-server/config/`、`game/`查；当前原资产在`assets/tables/`多为压缩JSON/prototype dump。prototype dump表示构造字节码分析结果，不代表已经正确解释成行；字段映射、共享表、nil、空数组和metatable应检查。

## 3. 登录模块与权威表

登录module是客户端读取视图，不应成为另一套互不一致的业务真相。当前game-store分表保存核心实体，同时保留未知结构字段供兼容。材料化要将权威更改同步回相应模块，而不是只在一个地方写成功。

| 模块 | 已核用途 | 关联权威数据/关注点 |
| --- | --- | --- |
| 2 | 角色信息 | roles/profile、等级经验、外观 |
| 3 | 功能开放位图 | FunOpen结果与运营遮蔽，不能跟Guide混为一表 |
| 5 | 通用货币容器 | resources的对应location；体力不是都放这里 |
| 6 | 道具背包分组 | 对象/资源处理器和group位置 |
| 8 | 主线与多种energy slot | mission_id/宝箱位与体力100012900 slot2等 |
| 9 | 登录编队嵌套 | lineups/play_lineups、pre_lineup/custom数据 |
| 10 | 英雄与多个养成slot | heroes、hero_cells及其他原slot；不能只保留slot0 |
| 16 | pb_guide | guides投影和原始MSB-first award位图；本轮修正中间is_over、替代Process和原子领奖同步 |
| 24 | 公会角色状态 | 公会目录/成员/申请/活动数据一致 |
| 38 | 通行证容器 | 周期、level/付费/领取、结构与资格分开 |
| 50 | Artifact圣器 | 已获得圣器、上阵与战斗技能 |
| 92/183 | 活动与新活动登录结构 | 服务器实例与个人资格分开，pause结构保留 |
| 93 | 邮件 | game_mails、已读/已领/删除/有效期与资源 |
| 108 | 每日特惠 | 购买次数、自选、补货、batch_update与重登 |
| 158 | 魔灵/宠物 | 本体、灵核/装备/养成关联 |
| 175 | 团长装备 | 本体与抽取/强化/重铸 |
| 518/534/538/539 | 神灵/秘宝/精灵/精灵珠等 | 按各proto与原脚本，不借通用bytes猜结构 |

本表列已核的重点，不替代所有登录模块slot清单。账号初始档审计应枚举当前实际登录响应，不把历史145/148模块数当不变契约；新增模块、空结构与客户端版本需一一记录。

## 4. 核心持久化字典

| 表/族 | 主键/作用域 | 意义与一致性 |
| --- | --- | --- |
| accounts/roles | account_id / role_id、server_id | 登录身份和角色档案；一个请求始终在正确role上下文 |
| login_modules | role_id,module_id | 客户端快照，保留结构但重建对应业务字段 |
| heroes/hero_cells | role_id,uid / role_id,cell_index | 本体与格子分开，payload保留扩展字段 |
| resources | role_id,tid | 整数amount、location、payload，不能在多个容器重复同tid |
| lineups/play_lineups | role_id / role_id,lineup_type | 预设/实际玩法编队与module9同步 |
| guides | role_id,guide_key | process_id检查点，不能替代领奖账本 |
| reward_claims | role_id,claim_type,claim_key | 引导、章节等一次性奖励幂等 |
| guide_award_repairs | 修复版本、角色、Award、planHash等 | 仅离线补原Award1/2，和原claim/位图一起提交；不是额外福利账本 |
| activity_claims/purchases | 角色+活动/任务/期等 | 任务领取、购买与期号 |
| pending_rewards | 对应幂等/实例范围 | 待领取与已入账分开，不能两边各发一次 |
| local_wallets/wallet_ledger | account_id / entry_id | 分为单位的余额及每笔变动 |
| recharge_orders | order_id；account_id,request_id唯一 | 商品交易、返回payload、ack与后续补同步 |
| voucher_skus/grants/redemptions | sku、mail/订单唯一 | 定制代金券面值、发放、领取与核销 |
| game_mails | mail_id；role_id,request_id唯一 | 邮件与奖励明细，领取事务与资源共同提交 |
| activity_instance | server_id,act_id,period_no | 全服窗口与阶段 |
| activity_personal_state | 服、活动、期、角色 | counters/cumulative/claims/currency分别管理 |
| activity_settlement | 服、活动、期、角色、step | 每个结算副作用与marker同事务 |
| activity_rank_snapshot | 服、活动、期、榜、名次 | 冻结排行与奖励依据 |
| activity_override/fun_open_override/ops_audit | 操作行id和目标范围 | 临时覆盖、撤销与前后差异 |
| scheduler_job | key | due/done/attempts/error，不能只看进程存活 |
| 各玩法state/log表 | role/guild/period或共享实例 | 逐服务审计真实权威，防个人与全服范围混用 |

服务有些表在初始化时创建，查询前核schema。`PRAGMA user_version`是实际迁移状态，不在文档固定成当前线上值20。构造game实例会建表/迁移/刷新，不能当只读诊断工具打开生产库。

## 5. 表解析验证与本轮纠错

Fight/Team分片的register0是共享列表，不是字段map。旧readGeneratedDump直接按r0映射，生成有key但row={}的结果，导致“缺表”和借前关。正确方式从含`tid`的field→ordinal常量读取，按Lua索引解释TDUP/TGET/TSET/CALL，setmetatable仅作为数据行包装，禁止执行任意Lua代码。

本轮附录生成器重新解释原分片并与先前调查JSON逐行一致比较，Fight/Team各988行；同时读取Guide原始表。验证门槛包括：

1. 输入文件版本和SHA256、解析器版本、支持opcode，未知opcode明确失败。
2. 行数/必填字段非空、key与tid一致、数值/布尔/数组类型正确。
3. NPC/loc、award_i/award_n等平行数组长度相等，Lua1-based与空表正确。
4. 跨表引用可解，未命中区分确实不存在、懒加载和其他分片。
5. 选择独立原始常量/消费者脚本核对关键样例，不能两边都用同一错误reader验证。
6. 抽取全表与只取子表应一致；不得以“这几个样例能用”放过其他模式。

## 6. 变更单模板

```text
变更ID / 日期 / 目标服：
用户问题与预期：
原版版本、APK/脚本/表路径与SHA256：
原始规则（字段/函数/实测）：
当前行为与复现：
精确修改（资产/服务/同步/迁移）：
影响范围（英雄/关卡/活动/账户/商品）：
现有存档修复预览与幂等键：
组件 / 临时TCP / SQLite重开 / 故障回滚：
APK场景、包版本/哈希、截图/录像/日志：
发布commit / release / 实际数据目录 / 备份hash：
发布后验收：
遗留未知与回滚条件：
```

“原版规则”栏不能写“按当前代码”。计划与实际验证分开记录；本轮未执行的测试命令写待执行，不附历史通过数字。

## 7. 文档更新与索引

当前入口是[总目录](README.md)；历史Unity文档只作背景。2026-11-06任务计划覆盖1407静态命令，旧状态不可直接当现况；本轮生成的297个分组包含无需缺口任务卡的既有协议模块，因此与旧276个“需要补全任务”不是同一分母。

更新顺序：保存证据 → 修规则/数据 → 更新本章关系与相应玩法章 → 更新问题验收状态 → 重建机器清单和可读附录 → 校验链接/行数/哈希 → 写agent/workflow实施记录。目录统计始终标日期与口径，不发布“已复刻95%”之类由路由数计算的结论。

配置/源码变化后先更新派发审计，再运行附录生成器；不需要因为文档格式修改重跑全部业务测试。业务规则变化则按专项和联动范围验证，发布前执行相应完整检查。
