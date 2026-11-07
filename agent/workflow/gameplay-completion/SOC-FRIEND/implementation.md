# SOC-FRIEND 实施记录

日期：2026-11-07。分支：`task/SOC-FRIEND-20261107`。worktree：`.worktree/gameplay-20261106/soc-friend`。基线：main `9593baa`（分支已 rebase，checkpoint `bb339ae`）。

**状态：服务端完成（20001–20013 已派发并有真实 TCP/SQLite 覆盖），待 APK 验收；20012 类型分类、20013 语义与 friendship 资源结算为证据待补。**

| 层级 | 结果 |
| --- | --- |
| 业务服务 | 13 个 type 全部有处理路径，无空应答、无固定结果 |
| 网关派发 | `gateway.mjs` 在 growth-road 派发块后按数字 type 派发，ETF 解码 + PB 编码 |
| 临时 TCP | 通过，见 `test/friend-gateway.test.mjs` |
| SQLite 重开 | 通过，关系/申请/黑名单/每日账本/防重重开后仍生效 |
| 异常回滚 | PB 编码失败、SQLite 写入拒绝均整体回滚 |
| APK/UI | 未做（本轮禁止操作模拟器/APK/实时服务） |
| 登录槽/推送 | payload 与编码函数已就绪，接入由总控完成 |

## 交付文件

| 文件 | 说明 |
| --- | --- |
| `personal-server/config/friend-tables.mjs` | FriendTable 读取与校验，默认资产 `tableAsset('FriendTable.data.lua.json.gz')` |
| `personal-server/assets/tables/FriendTable.data.lua.json.gz` | Limit/Param/Recommend 三表，468 字节，由 `analysis/scratchpad/SOC-FRIEND/pack-friend-table.mjs` 从 checkpoint JSON 生成 |
| `personal-server/game/friend-service.mjs` | 独立好友服务（状态表、事务、13 条命令、登录 payload、推送编码） |
| `personal-server/game/gateway.mjs` | 仅新增 import、服务实例与一个派发块 |
| `personal-server/test/friend-service.test.mjs` | 15 项服务级测试 |
| `personal-server/test/friend-gateway.test.mjs` | 1 项真实临时 TCP 测试 |

未修改 `storage/game-store.mjs`、`battle-engine.mjs`、`game/effects/*` 或其他 agent 的服务。

## 协议与规则依据

### 已恢复的配置（配置事实）

`FriendTable.data.lua` SHA256 `96d8b595b96ef9248905d0c6010fdff21118c2d6b01a138db3d10beb800eeee0`；解释结果 `analysis/scratchpad/SOC-FRIEND/FriendTable.data.json` SHA256 `0686b8a3ce51c538197070c18b7bf188c1b2bd904534c3c66f5c483e4e037497`。

| 等级区间 | max_friend_count | max_receive_friendship_count | daily_present_rewards |
| --- | ---: | ---: | --- |
| 1–49 | 60 | 30 | `[[401900,300]]` |
| 50–59 | 80 | 40 | `[[401900,400]]` |
| 60–69 | 90 | 50 | `[[401900,500]]` |
| 70–999 | 100 | 60 | `[[401900,600]]` |

Param[1]：`max_apply_count=30`、`max_present_friendship_count=20`、`max_black_list_count=100`、`max_show_apply_count=99`、`recommend_count=5`、`recommend_lv_limit=10`、`max_search_count=5`、`recommend_reset_time=5`、`max_private_count=10`、`accuss_count=300`、`recommend_fight_life=604800`、`recommend_max_rank=10`、`friendship_exchange_ratio=100`、`present_exchange_ratio=10`；`present_rewards=[]`、`rev_rewards=[]`。

Recommend 常量：GENRE=1、GUILD=2、FIGHT=3、RANK=4（name 文本 ID 19999/19996/19997/19998）。

### 本轮新增的静态恢复（FriendMgr 原型）

原 checkpoint 已恢复 20001–20013 的参数形状；本轮继续核对回包如何使用，供编码对齐：

| 原型 / 源码行 | 事实 |
| --- | --- |
| 18 / 272（20001 回调） | 遍历 `res.friend_list` 逐个 `AddNewFriendById`；因此 `friend_list` 是“本次新建立的好友”，不是申请 id 回显 |
| 18 / 272 | 失败时调用 `UIKit.ShowError(err_list[1])`；`err_list` 元素是错误码，不是角色 id |
| 22 / 360（20003 回调） | 请求 id 先从 applyList 移除，`success_list` 逐个加为好友，`err_list[1]` 显示错误码 |
| 27 / 394（20005 调用方） | 已在黑名单 → `PLAYER_ALREADY_IN_YOUR_BLACKLIST`；黑名单长度 > `MAX_BLACKLIST_COUNT` → `BLACKLIST_COUNT_MAX` |
| 30 / 470（20007 回调） | 用 `res.friendship` 覆盖 friendshipInfo，`AwardKit.Parse(res.res)`，再逐个 `UpdateFriend(res.friend_list[i])`；并在 changes 中找 `tid == ItemTable.TID_FRIENDSHIP` 显示赠花提示 |
| 44 / 688 + 43 / 695（20009） | 参数可为字符串（先 `tonumber`）；回包只带角色 id，随后 `PlayerDataMgr.ReqDataListByType(TID_FRIEND_DATA_TYPE)` 取玩家资料（属 SOC-MSG 10504/10505） |
| 48 / 712 + 47 / 720（20010） | 推荐冷却由 `RECOMMEND_RESET_TIME` 控制；回包经 `GetRoleIdL` 收集角色 id |
| 46 / 734 | `GetRoleType...` 走 Recommend 表标签，说明 `recommend_types` 是玩家标签列表 |
| 87 / 1154 | `GetRoleIdL` 用硬编码 `CONST_MAX_RECOMMEND_COUNT=10` 截断，超过 10 个角色 id 丢弃 |
| 88 / 1165 | `GetRecommendTypeL` 无截断地收集每个玩家的 `recommend_types` |
| 50 / 758、51 / 770 | 20012 传调用方参数；20013 传两个参数（R0、R1） |
| 84 / 1125、85 / 1137 | 日切换只清 `present_today`、`to_receive_today`、`received_count_today` 并写 `day`，不清 `received_today`/`flower` |

### 临时脚本核对结论（脚本已删除，不进入交付）

- `.tmp-proto-check.mjs`：用 `createGameCodec()` 直接 pack/unpack `res_friend_login`（12 字节）、`res_friendship_change`（14 字节）、`res_friend_reduce`（4 字节）、`res_query_friend_player`（10 字节）、`res_apply_friends`（`err_list:[5]` → 3 字节）。结论：`friend.net.proto.bin` 与 `friend.db.proto.bin` 在当前 codec 中可直接解析（跨文件 import 不需额外解析步骤）；proto3 会省略零值，所以全空消息长度为 0，网关侧不能把“空 data”当成失败。
- `.tmp-item-check.mjs`：`ItemTable` 中 401900 的 `name=800376`、`icon=Icon_Equip_youqingdian.png`、`type=13`，即“友情点”，说明 `daily_present_rewards=[[401900,N]]` 是友情点数额而非普通道具；其发放触发点仍未取证，因此本轮不结算。

## 实现设计

### 权威状态与 actor

- actor 固定为 `store.read().state.roleId` 与 `model.role.level`，不接受客户端传入的 actor。
- 目标角色只允许 `roles` 表中真实存在的 `role_id`；缺失即业务失败（code 5）。当前生产存档只有一个角色，所以推荐列表为空、加好友目标必然不存在，这是数据事实而不是占位。
- 多角色测试通过向 `roles` 插入完整角色行提供第二个玩家；这不代表生产认证已支持多角色登录。

### 表（服务内 ensure，不改 game-store 迁移）

| 表 | 作用 | 关键约束 |
| --- | --- | --- |
| `friend_links` | 双向好友关系、favors | PK(role_id,friend_role_id)，CHECK 非自反 |
| `friend_applies` | 待处理申请（有向） | PK(role_id,applicant_role_id)，重复申请天然防重 |
| `friend_blacklist` | 黑名单（有向） | PK(role_id,blocked_role_id) |
| `friend_friendship` | day / flower 快照 | 每角色一行 |
| `friend_gifts` | 每日赠送/领取账本 | PK(day,giver_role_id,receiver_role_id)，`received_at` 区分待收与已收 |
| `friend_reports` | 20013 报告留痕 | UNIQUE(role_id,day,arguments_json) |

`present_today` / `to_receive_today` / `received_today` / `received_count_today` 全是 `friend_gifts` 的投影，按服务器日过滤，因此跨日自动清空，不需要额外重置写入。

### 日界

`FlushTime.NowDay` 未取证。本轮采用仓库既有 `serverDayNumber(serverOpenedAt, at)`（登录 `day_count`、first-week-goal 同源），即“开服时间为起点的第 N 天”，**这是推断，不是客户端事实**；未套用充值 05:00 日切，也未套用 `dayZero` 的 +08:00 自然日。

### 命令语义（type → 行为 → 回包）

| type | 命令 | 行为 | 回包 | 失败码 |
| ---: | --- | --- | --- | --- |
| 20001 | req_apply_friends | 对真实角色建立有向申请；若对方已申请我则直接成为双向好友 | `res_apply_friends{friend_list=新好友, err_list=错误码}` | 1/5/310 |
| 20002 | req_remove_friend | 删除双向关系与未领取赠礼 | 空 | 5（非好友） |
| 20003 | req_agree_friend_applies | 同意收到的申请，双向写入并删除正反申请 | `res_agree_applies{success_list,err_list}` | 5/310 |
| 20004 | req_refuse_friend_applies | 删除收到的申请 | 空 | 5 |
| 20005 | req_add_to_blacklist | 写黑名单，上限 100 | 空 | 5/310 |
| 20006 | req_remove_from_blacklist | 删黑名单 | 空 | 310（不在名单） |
| 20007 | req_present_friendship | 校验好友、当日未赠、当日 ≤20 人，写账本 | `res_friendship_change`（res.changes 为空） | 5/310 |
| 20008 | req_receive_friendship | 校验待收、按等级领取上限（30/40/50/60） | `res_friendship_change` | 5/310 |
| 20009 | req_query_friend | 按 role_id 或昵称精确查真实角色，最多 `max_search_count=5`，排除自己 | `res_query_friend_player` | 1 |
| 20010 | req_recommend_friend_list | 真实角色中排除自己/好友/黑名单/待处理申请，上限 10（`CONST_MAX_RECOMMEND_COUNT`） | `res_query_friend_player` | 1 |
| 20011 | req_one_key_present_and_rev | `[presentIds, receiveIds]` 同一事务内赠+领；任一步失败整体回滚 | `res_friendship_change` | 1/5/310 |
| 20012 | req_friend_recommend_types | 按请求类型过滤推荐列表；类型分类未取证 → 当前恒为空 | `res_query_friend_player` | 1 |
| 20013 | req_friend_save_report | `[role_id, content]`：目标须真实、内容非空且 ≤ `accuss_count=300`，幂等留痕 | 空 | 1/5 |

共同约定：`applyCommand` 的 `err_list` 写错误码（由 prototype 18 的 `ShowError(err_list[1])` 反证）；`friend_list` 只放本次新建好友。错误码沿用仓库既有约定：1 = 非法参数/未知命令，5 = 业务不可用（不存在、非好友、上限、证据缺口），310 = 重复操作。

### 明确未结算的未知分支

- `daily_present_rewards`（友情点 300/400/500/600）发放触发点未取证 → 赠/领回包 **不** 下发 `res.changes`，不产生友情点增减。
- favors（好感度）增量、`friendship_exchange_ratio=100`、`present_exchange_ratio=10` 的换算关系未取证 → favors 恒为库内值（默认 0），不做推断换算。
- `flower` 的累积与消耗策略未取证 → 登录/回包读出库内值，默认为 0。
- `recommend_lv_limit`、`recommend_fight_life`、`recommend_max_rank` 的筛选语义未取证 → 不做等级/战力/排名过滤。
- `recommend_count=5` 与硬编码 `CONST_MAX_RECOMMEND_COUNT=10` 的区别：客户端截断确认是 10；服务端上限按 10 实现，5 只作为配置登记。
- `max_private_count=10` 属于聊天私聊名额（11012 等，SOC-CHAT），不在本模块使用。
- 20012 的推荐类型分类未取证 → 返回空列表并记录 `friend_recommend_types` 日志（gap 字段）。
- 20013 两个参数的含义是按 `[role_id, content]` 推断（`accuss_count=300` 作为长度上限）；原服失败码与是否允许重复举报未知。

## 复现命令

在工作树 `personal-server` 下：

```powershell
node --test --test-concurrency=1 test/friend-service.test.mjs
node --test --test-concurrency=1 test/friend-gateway.test.mjs
node --test --test-concurrency=1 test/gameplay-gateway.test.mjs test/m5-command-matrix.test.mjs test/login-business-reads.test.mjs test/item-growthroad-gateway.test.mjs test/general-dungeon-gateway.test.mjs
```

资产重新生成（仅在证据 JSON 变化时）：

```powershell
node ..\analysis\scratchpad\SOC-FRIEND\pack-friend-table.mjs
```

## 验证结果

| 测试 | 用例数 | 结果 |
| --- | ---: | --- |
| `friend-service.test.mjs` | 15 | 15 通过 |
| `friend-gateway.test.mjs`（真实握手 + 登录 + 数字 type） | 1 | 通过 |
| `gameplay-gateway.test.mjs` | 7 | 7 通过 |
| `m5-command-matrix.test.mjs` | 8 | 8 通过 |
| `login-business-reads.test.mjs` | 3 | 3 通过 |
| `item-growthroad-gateway.test.mjs` | 1 | 通过 |
| `general-dungeon-gateway.test.mjs` | 1 | 通过 |

覆盖要点：

- 双向关系（agree 后两条 `friend_links` 行；remove 后清零）。
- 申请上限、好友上限、黑名单 100、每日赠送 20、按等级每日领取 30/40/50/60。
- 跨日：推进一天后 `present_today`/`received_today` 归零且可再次赠送；`friendship.day` 递增。
- 防重：重复申请/赠送/领取/黑名单/移除返回 310 且状态不变。
- 事务：PB 编码抛错时申请、友谊、friendship 行全部回滚；对 `friend_gifts` 建 ABORT 触发器后 one-key 命令抛错且无任何账本行。
- SQLite 重开：关系、friendship、防重在 `fixture.open()` 后仍生效。
- 单角色存档：推荐为空，跨界目标申请返回 code 5，不生成任何第二玩家。

临时 TCP 测试通过 `createLocalGame({ verifySession })` 临时 loopback 端口走 verify/挑战/答复/909103 登录，再用真实 `pb_c2s{type,seq,data}` 发送 20001/20003/20007/20009/20010/20005/20006/20013/20004/20011/20002/20012 并解 PB 回包，同时直查 SQLite 断言落库。

## 总控接入清单

1. **登录容器**：`friend.loginPayload(clock())` 返回 `res_friend_login` 的 PB 字节；登录前可调 `friend.ensureLoginState(clock())` 生成 friendship 行。`FriendMgr.LoginParse` 的数字模块槽位未恢复，**禁止猜槽号**；请由总控选定槽位后执行 `modules.set(<slot>, binary(friend.loginPayload(clock())))`。
2. **指令派发**：本分支已在 `gateway.mjs` 的 growthRoad 之后加入 `friend.supports(type)` 派发块（import + `createFriendService` + 一个 ETF 解码/PB 发送块）。类型：20001–20013。合并时若总控改写了该区域，只需保留同样的 13 个 type 与 `decodeEtf(request.data)` 传参。
3. **推送**：
   - 2201 `res_friend_reduce`：`friend.pushPayload.reduce(roleId)`（PB）。
   - 2203 `res_friendship_change`：`await friend.pushPayload.friendshipChange(pbFriendship, pbFriendData)`，当前证据是 ETF `[binary(pb_friendship), binary(pb_friend_data)]`，与命令同名回包不同，不能复用。
   - 2200 `res_friend_append`、2202 `res_friend_apply_append`：静态目录只有名字，payload 未恢复；`pushPayload.append/applyAppend` 明确抛 code 5。
   - 每条命令返回的 `value.pushes` 列出 `{pushType, roleId}` 的目标角色；网关尚未向其他角色 socket 扇出（当前存档只有一个角色、也只有一个 socket）。接入推送时需要按 roleId 注册在线 socket 并调用上面对应编码函数。
4. **APK 验收**：好友 UI 需要登录模块 + 推送，且需要第二个真实角色；本轮未做设备验收。

## 证据缺口

1. `FriendMgr.LoginParse` 的数字登录模块槽位与实际线上接受。
2. `FlushTime.NowDay` 定义（本轮用 `serverDayNumber` 推断）。
3. `daily_present_rewards` 的发放触发点、友情点(401900) 增量的归属与频次。
4. favors 好感增量、`friendship_exchange_ratio`/`present_exchange_ratio` 的换算、`flower` 累积与消耗。
5. 推荐分类（GENRE/GUILD/FIGHT/RANK）的判定规则与 `recommend_lv_limit`/`recommend_fight_life`/`recommend_max_rank` 的筛选方式。
6. 20012 的类型过滤语义、20013 参数含义与是否允许重复举报。
7. 原服失败码映射（本轮沿用仓库 1/5/310 约定）。
8. 历史解包树与当前 v9 APK 的逐文件对应关系；真实 APK/UI 验收。
