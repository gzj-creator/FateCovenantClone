# BATTLE-RANK 实施与验证记录

日期：2026-11-07

- 分支：`task/BATTLE-RANK-20261106`
- 工作树：`.worktree/gameplay-20261106/battle-rank`
- 当前状态：服务端完成；真实配置子集、2000-2011 路由、临时 TCP、SQLite 重开和回滚已验证。APK 未验收。
- 主线：已合并总控最新本地 `main@b765657`；`main` 中的 207 体力同步、邮件推送刷新、活动登录期限、module 90 任务槽位和 ITEM-EVERYTASK 路由均保留，全量回归通过。

## 配置与协议依据

- `RankCmd.lua` 声明命令 2000-2011；只有 2004 `batch_get_player_hero_rank` 使用 protobuf `pb_batch_seq_rank`，其余请求按 ETF 解码。
- `RankMgr.lua` 和 `RankCrossMgr.lua` 的调用结构用于恢复单榜、指定玩家、Top N、批量、跨服分组、备份和气泡请求；2008 单榜、2011 多榜均返回备份视图。
- `rank.net.proto` 定义 `rank_to_client`、`rank_info`、`pb_rev_rank`、`pb_batch_rev_rank` 和 `pb_rank_cross_group_top`；`rank.db.proto` 定义持久化对象 `pb_rank_obj { id, value, extra }`。
- 已将 `RankTable.data.lua` 转为个人服务器资产 `personal-server/assets/tables/RankTable.data.lua.json.gz`：Bubble 1、Group 9、TypeConfig 284、Config 312、MainTag 97。读取器对行数做完整校验，截断配置会阻止启动。
- rank ID 合法性以 `Config` 为准；`TypeConfig` 是稀疏配置，缺失时使用已声明的默认排序参数。已知 ID 包括 ARENA=1、PEAK_TOWER=2、POWER=3、ROLE_LEVEL=10、MISSION=31、HERO_STAR_COUNT=44、SWAP_ARENA=53、PET_SCORE=115、TREASURE_SCORE=119。

证据哈希：

| 文件 | SHA-256 |
| --- | --- |
| 提交的 `RankTable.data.lua.json.gz` | `B882310CC8CC1F72D2DFB94E1A90464995FCD257952A2A8BBC365095EA367135` |
| 源 `RankTable.data.lua` | `67962B081F578447E22CCC2DEF13DDD74B82067FA38B1F11EB41588892AD0DDD` |
| `rank.net.proto` | `B98E12FEA5F7F239C216EA79EF39BF230BB234E48908A6A3851369F8D793912E` |
| `rank.db.proto` | `89A77A6A1BE30EEA0F94ECF0FF4446D238926ED9C39A916EEDBA7A2F860303CB` |

## 权威状态与规则

`rank_entries` 以 `(rank_id, scope_key, period_key, participant_id)` 为主键，值以 TEXT 保存 uint64，确保超出 JS 安全整数后仍按 BigInt 排序。`rank_backups` 保存每次更新前的同榜快照，供 2008/2011 读取；首次变化前没有旧快照时才回退到当前权威榜。

生产状态同步的来源如下：

| 榜单 | 来源 |
| --- | --- |
| 角色等级 rank 10 | 持久化角色等级的 `role.level` |
| 主线 rank 31 | module 8 中 `pb_mission.mission_id` 的已通关游标 |
| 英雄星级 rank 44 | 已拥有英雄 `star` 字段总和 |
| 战力 rank 3 | 主阵容英雄的真实等级与品质，按当前本地服务器战斗规则 `1000 + level*100 + quality*10` 求和 |
| 尖塔 rank 2 | `peak_tower_state.max_layer` |

当前本地服务器只有一个角色权威状态，跨服榜按榜单行内真实 `server_id` 分组，单服部署会只出现本地分组，不伪造远端玩家。榜单读取、权威同步和响应编码在同一 SQLite 事务中完成。战力公式依赖尚未完成的 CORE-ATTR；该公式是本地服务器现有规则，不是原服事实。

正常榜降序，`is_reverse_rank` 升序；`min_rank_value` 过滤无效分数，`show_rank_num` 和 `max_rank` 限制回包。同分按 participant ID 数值升序，作为确定性本地规则；原服同分次序未取得独立证据。

## 命令实现

| type | 命令 | 实现结果 |
| ---: | --- | --- |
| 2000 | `get_rank_data` | 返回指定榜的当前真实排名、本人名次/分数、总数、气泡和按配置截断的 Top 列表 |
| 2001 | `get_rank_info` | 按 rank ID 与玩家 ID 返回真实 `rank_info` |
| 2002 | `get_rank_top_data` | 返回请求 Top N，并受 `show_rank_num`/`max_rank` 限制 |
| 2003 | `batch_get_hero_rank` | ETF 批量读取，返回同一权威行的 `pb_rev_rank` |
| 2004 | `batch_get_player_hero_rank` | 网关用 PB 解码 `pb_batch_seq_rank`，返回 `pb_batch_rev_rank` |
| 2005 | `get_rank_cross_top` | 按真实 `server_id` 分组返回配置榜 Top |
| 2006 | `batch_get_personal_rank_first` | 从请求榜列表中确定榜单并返回榜首 |
| 2007 | `get_appoint_rank` | 返回指定玩家在指定榜的真实名次 |
| 2008 | `get_rank_backup` | 返回最近一次更新前快照；无快照时回退当前榜 |
| 2009 | `update_rank_bubble` | 保留原气泡能力，56 个 Unicode 字符以内，事务持久化并出现在后续榜单 |
| 2010 | `req_batch_get_rank` | ETF 旧版批量指定玩家榜信息 |
| 2011 | `req_batch_get_rank_backup` | 批量返回备份视图；空列表返回空 `client_list` |

## 验证

专项命令：

```powershell
cd F:\projects\FateCovenantClone\.worktree\gameplay-20261106\battle-rank\personal-server
node --test test/rank-service.test.mjs
node --test test/hero-progression.test.mjs
node --test test/hundred-schools.test.mjs
npm test
npm run test:deployment
```

结果：

- rank service：7/7，通过权威主线状态、SQLite 重开、降序/反向榜/阈值/同分、ETF/PB 批量、跨服分组、备份、气泡、编码失败回滚和 SQLite trigger 写失败回滚。
- real gateway：`hero-progression.test.mjs` 19/19；通过实际握手与数字 type 2000-2011 请求/响应，断言均产生 `rank_sent`，其中 2003 走 ETF、2004 走 protobuf。
- 相关活动回归：`hundred-schools.test.mjs` 8/8。
- 合并总控最新 `main@b765657` 后全量：2171/2171，0 fail；覆盖主线已有功能和本任务相关测试。
- `npm run test:deployment`：1/1，干净 `personal-server` 副本无需仓库 `analysis/` 即可启动。

事务证据包括响应编码前写入后抛错时 `rank_entries` 为 0，以及 SQLite `BEFORE INSERT` 拒绝时同步整体回滚。重开数据库后排名及气泡仍可读，防重键仍有效。

## 证据阻塞与边界

- 未取得各榜单赛季起止、版本切换、冻结时点和最终排名邮件奖励的权威配置/服务端逻辑，因此当前生产榜使用 `period_key=persistent`；未伪造切换或发奖。存储结构保留 `period_key`，待 CORE-EVENTS 或对应活动任务提供真实周期和奖励配置后接线。
- 当前完成真实来源的榜单是 rank 2/3/10/31/44。其余 307 个 Config 榜可由配置校验和通用事务写入，但竞技、公会、活动、宠物、宝箱等分数仍缺少所属模块的生产事件来源，继续为空榜；不以测试 `recordScore` 或假数据冒充已实现。
- CORE-ATTR 未完成，战力榜的公式和英雄属性不完整；必须随 CORE-ATTR 对齐。
- 跨服远端聚合未实现；单机部署只读取本地 SQLite 的真实分组。多服同步属于后续部署拓扑任务。
- 原服同分次序、季度奖励和部分请求细节没有独立线上证据；本文件所述确定性规则属于本地实现，不能标为原服务端完全一致。
- 未启停实时服务，未操作模拟器、APK 或运行数据库。APK/UI 排行榜、跨日切换与最终结算视觉验收仍未进行，状态不能据此标为 APK 验收通过。
