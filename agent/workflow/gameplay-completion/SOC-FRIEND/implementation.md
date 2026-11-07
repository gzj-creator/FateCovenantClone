# SOC-FRIEND 实施记录

日期：2026-11-07。分支：`task/SOC-FRIEND-20261107`。worktree：`.worktree/gameplay-20261106/soc-friend`。当前基线：`e90ef1e`。

**状态：未完成，仅证据与设计 checkpoint。** 总控要求在换 session 前停止扩展。尚无好友服务代码、运行配置、网关接入补丁或测试交付；不得据此把 SOC-FRIEND 记为服务端完成。以下设计尚未实现，解析所得规则与未知行为分开记录。

## 权威状态与边界

当前 `game-store.read()` 选取存档中的首个角色，网关使用同一权威角色；本任务不扩展认证，不接受客户端提供 actor id。推荐与查询只使用 `roles` 中存在的真实本地角色，不用离线登录 fixture 中的旧好友或公会占位成员伪造玩家。生产存档只有一个角色时，推荐结果为空有实际数据依据。

好友关系采用无向规范化角色对；申请与黑名单采用有向角色对；赠送及领取以发送者、接收者、服务器日作用域的账本防重。关系、资格与领取位从这些表计算，登录模块与请求响应共用同一投影。业务修改与响应编码在现有同步 SQLite 事务内完成；失败整体回滚。角色不存在、自加、黑名单、好友或申请上限、重复/过期领取分别校验。

实现仅新增独立服务、模块自有幂等表初始化、必要运行配置及测试。`gateway.mjs`、登录容器、`game-store.mjs` 全局迁移、公共资源与配置读取器由总控维护，接入补丁单独提供。

## 证据入口

- `inventory.json` / `static-interfaces.json` 的 `tcp:c2s:20001:req_apply_friends` 至 `tcp:c2s:20013:req_friend_save_report` 为命令映射，不能由 `input-register` 推断参数形状。
- 可部署 `personal-server/assets/protobuf/friend.net.proto.bin` 与 `friend.db.proto.bin` 已含好友、申请、黑名单、好感和按日友情数据结构。
- 原 `analysis/reports/private-client-16448/...` 路径已不存在。已定位只读旧解包树 `.worktree/recruit-20261101/.scratch/out/luaproject/` 中的 `FriendCmd.lua`、`FriendMgr.lua`、`FriendTable.data.lua`、`FriendTable.lua` 和 `FriendErr.lua`；这些是 LuaJIT v2 字节码，使用现有解析器恢复，不执行客户端 Lua。
- 旧解包树与当前 v9 APK 的逐文件对应关系尚未独立确认；资产进入生产前必须保留这个来源缺口，不能把历史静态恢复冒充当前客户端实测。
- 按 `reverse-engineer-anything` skill 只读核对隔离 APK：`apk/com.jzyx.ps.v9-working.apk` SHA256 `1fd5fe0a2e18e9add821efb6c404d9464b5e3609be0e8af605d47bada441b473`。REA inspection `ev_bcc2a0e1c45f3b7b16a84e897856d0e3479b838bb754d432ef501f704c48af76`；中央目录共有 11910 个文件条目，无完整性矛盾。`64_lua_project.bundle` 条目为 102832516 字节，SHA256 `90595989c0d3dc93b0fa6e741a334b1b4ec7432153addd9ca451593e23782012`。UnityPy 直读没有 TextAsset，不能据此判断缺少好友模块；后续改用已解包树。未改 APK。

## 尚在恢复

13 条命令的参数、FriendMgr 登录模块/槽与推送映射、友情奖励触发和好感变化、服务器日定义与失败码尚未全部恢复。FriendTable 的 `present_rewards/rev_rewards=[]` 与等级表 `daily_present_rewards` 必须按 Manager 调用区分，不能把每日奖励误当每次赠送奖励。

### 已恢复配置

`FriendTable.data.lua` 的 SHA256 为 `96d8b595b96ef9248905d0c6010fdff21118c2d6b01a138db3d10beb800eeee0`。离线提取结果保存在本 worktree 的 `analysis/scratchpad/SOC-FRIEND/FriendTable.data.json`，SHA256 为 `0686b8a3ce51c538197070c18b7bf188c1b2bd904534c3c66f5c483e4e037497`。此文件是本地证据，尚未收纳为生产配置。

| 等级区间 | 好友上限 | 每日领取上限 | daily_present_rewards 原值 |
| --- | --- | --- | --- |
| 1-49 | 60 | 30 | `[[401900,300]]` |
| 50-59 | 80 | 40 | `[[401900,400]]` |
| 60-69 | 90 | 50 | `[[401900,500]]` |
| 70-999 | 100 | 60 | `[[401900,600]]` |

`Param[1]` 中已恢复：`max_apply_count=30`、`max_present_friendship_count=20`、`recommend_count=5`、`recommend_lv_limit=10`、`max_search_count=5`、`max_black_list_count=100`、`recommend_reset_time=5`、`max_private_count=10`、`accuss_count=300`、`recommend_fight_life=604800`、`recommend_max_rank=10`、`friendship_exchange_ratio=100`、`present_exchange_ratio=10`、`max_show_apply_count=99`；`present_rewards=[]`、`rev_rewards=[]`。数值是配置事实，具体结算触发与 `recommend_reset_time` 单位尚未确认。

### 已恢复 Manager 行为

证据助手 `/root/soc_friend_evidence` 完成 `FriendMgr.lua` 离线解析：92 个 prototype，root 91，完整 EOF 校验；prototype 48 的常量边界歧义通过实际指令常量类型约束消除，不以首选候选兜底。结果：`analysis/scratchpad/SOC-FRIEND/FriendMgr.parsed.json`，SHA256 `1a21641d47f4c5748b44a3812bef57022a1b490b235b1f33ce7cd7af3c26ff3a`。这里的行号为客户端原源码行信息，不是 JSON 文件行号。

- `LoginParse`（源码第 64 行）按 `res_friend_login` 解 PB；登录模块数字 ID 与容器槽位仍未定位。
- `ResetFriendship`（第 1137 行）清空 `present_today`、`to_receive_today`，设 `received_count_today=0`、`day=NowDay`；没有清空 `received_today` 或 `flower`。`NowDay` 的时间来源、时区与刷新边界仍未知，不能直接套用充值 05:00 日切或活动午夜日切。
- `20007`（第 450 行）先对原参数 `R0` 进行 `ipairs`，随后原样编码，已证为角色 ID 列表。
- `20008` 将 `R0` 原样编码；尚无调用者证据确认它是单 ID、列表或其他形状。
- `20011`（第 527 行）构造 Lua 数组 `{presentIds, receiveIds}`，对应 ETF proper list `[presentIds, receiveIds]`，不是 tuple。第 607 行发送 `[ids,[]]`；第 646 行发送 `[[],ids]`。

### 协议与状态

原始 `staticRecordId` 沿用 `docs/plans/remaining-gameplay-20261106/inventory.json`，不复制静态大报告。当前已核对命令与 PB 回包：

| type | 操作 | 已知响应 |
| --- | --- | --- |
| 20001 | req_apply_friends | res_apply_friends |
| 20002 | req_remove_friend | 尚未恢复 |
| 20003 | req_agree_friend_applies | res_agree_applies |
| 20004 | req_refuse_friend_applies | 尚未恢复 |
| 20005 | req_add_to_blacklist | 尚未恢复 |
| 20006 | req_remove_from_blacklist | 尚未恢复 |
| 20007 | req_present_friendship | res_friendship_change |
| 20008 | req_receive_friendship | res_friendship_change |
| 20009 | req_query_friend | res_query_friend_player |
| 20010 | req_recommend_friend_list | res_query_friend_player |
| 20011 | req_one_key_present_and_rev | res_friendship_change |
| 20012 | req_friend_recommend_types | res_query_friend_player |
| 20013 | req_friend_save_report | 尚未恢复 |

`res_friend_login` 包含 `pb_friend` 和 `pb_friendship`。`pb_friend` 含旧 `friends`、申请、黑名单及带 `favors` 的 `friend_list`。`pb_friendship` 含 `day/present_today/to_receive_today/received_count_today/received_today/flower`。`res_friendship_change` 含友情数据、`pb_res_to_client` 资源差量及改变的好友数据。未知回包不能据 schema 缺失改为空成功。

静态目录已证推送 `2200=res_friend_append`、`2201=res_friend_reduce`、`2202=res_friend_apply_append`、`2203=res_friendship_change`。其中 `2203` 的 Manager prototype 55（源码第 820 行）读取 ETF 数组第一个元素为 PB `pb_friendship`，第二个元素为 PB `pb_friend_data`；外层编码与同名命令响应不同，不能直接复用 `res_friendship_change` PB。其余推送形状及线上接受仍未验证。完整 payload 证据、原文件 SHA256 和恢复命令见同目录 [evidence.md](evidence.md)；可复现脚本 [inspect-evidence.mjs](inspect-evidence.mjs) 已进入 checkpoint。

## 下一步交接

1. 先读本记录及证据助手补充文件，复用上述 JSON 和已解包 LuaJIT；不要重复对 APK 尝试 UnityPy 直读。旧 Lua 树位于主项目 `.worktree/recruit-20261101/.scratch/out/luaproject/`，不在本 worktree 的同名目录。
2. 对最新 main 做只读差异检查并更新基线，保留 main 已有修复；本次只有文档 checkpoint，不需把好友文档合并当业务交付。
3. 从已恢复 Manager/UI 调用继续核对剩余 ETF 参数、登录模块、推送、FriendErr、NowDay 和奖励/好感实际触发。缺少的行为逐条列为证据待补，不能编奖励或猜命令。
4. 将可证 FriendTable 收纳进 `personal-server/assets`，新增独立配置读取和好友服务；角色验证只认真实 `roles`。复用 `grantResources` 和 `store.transaction((model, db) => ...)`，编码也在事务内。
5. 新增临时 SQLite 业务、资源不足、上限、黑名单、双向关系、跨日、防重、重开数据库、编码/真实 SQLite 写失败整体回滚验证。多角色测试使用完整 actor 专属 fixture/adapter，并记录它不代表当前生产认证支持多角色登录。
6. 向总控提交 gateway/登录/推送接入补丁，由总控维护共用文件；用现有 challenge/login 的临时端口与真实数字 type 做 TCP 验收，随后登记实际通过范围。普通 helper 测试不能认定网关接通。

## 验收

尚未运行新模块 service、临时 TCP、SQLite 重开或故障回滚验收。`npm ci` 仅为独立 worktree 准备依赖；基线主线已有的 2234/2234 回归由总控验证，不是 SOC-FRIEND 测试成绩。本次 checkpoint 的脚本 `node --check`、FriendTable 数据恢复及 FriendMgr prototype 84/85 指令复现均通过；提交前运行 `git diff --check`，不再跑新全量测试。

真实 APK/UI 由用户后续安排；本轮未启停实时服务、未访问运行数据库、未操作模拟器或原游戏服务器、未修改 APK。REA 只读会话已关闭，无待收尾运行进程。
