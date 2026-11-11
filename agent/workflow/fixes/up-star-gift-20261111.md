# 独立“限时升星 / 升星礼包”：完整登录、版本选择与免费任务领奖

更新时间：2026-11-12（Asia/Shanghai）。分支 `fix/up-star-gift-20261111`，worktree
`.worktree/up-star-gift-20261111`。开工时 HEAD 为 `b044a0d`，已合入 main `95112fb` 与
`origin/main 3a1518f`；最终 fetch 后 `origin/main` 仍为 `3a1518f`，所以没有再合并 main。

本轮没有启停实时服务、没有写运行数据库、没有操作客户端、ADB 或 APK。运行库只以只读方式检查。

## 结论

1. `31053` 现在只接受当前正在运行且有 `UpStarGiftTable` 配置的版本。历史版本、过期版本、未知版本和
   `0` 都不会被当作“自动选择”；登录同步会在原选择为空或已失效时，自动选择当前开放期中开窗时间最新的一版。
2. `31052.ids` 是 `UpStarGift.tid`，不是版本号或活动 ID。服务从真实英雄、魔灵和精灵养成数据判断任务是否达标，
   检查当前版本的 `award_bin` 后，才按静态表的 `award` 发奖。
3. `gift=0` 才是免费任务奖励；`gift>0` 是充值商品，必须继续走 RechargeMgr，不能由 31052 发放。表内 508 个
   非零 `gift` 全部能在当前 `RechargeTable` 找到同 tid 的商品；30 个免费行只存在于历史版本 2–6。
4. 当前正式排期开放的 40/49/52/56/111 版本全部只有充值礼包行，没有免费任务档位。因此当前真实活动里
   `31052` 对这些行应返回明确的充值流程拒绝；免费领奖路径由历史配置和隔离测试证明，不能被描述成当前 111
   版本存在免费可领奖励。
5. 发奖、领取位和模块 92 写回在同一 SQLite 事务中完成。资源、protobuf/ETF 编码或模块持久化任一失败都会整体回滚；
   完整重放返回空资源变更，不重复发奖。

## 证据等级

- **线上/运行库（只读，已证实现状）**：两个角色 `100002/100003` 的模块 92 中，func 25 并行组的
  `module_login_data` 外层为 534 字节，ETF BINARY_EXT 内层为 528 字节；解码为 66 条 `info_list`，
  `cur_choose_version=0`，没有 `25111`，所有 `award_bin` 为空。这个样本只证明旧运行状态，不被直接写回。
- **线上命令样本**：`/data/disk1/game/data/events.jsonl` 没有 `31052/31053` 请求或对应拒绝事件。因此命令修复的
  证据等级是静态确认加临时 TCP，不是线上命令回放。
- **静态确认**：当前 APK 的 `UpStarGiftCmd/Mgr/NewNode/Table` Lua prototype、`ActivityTable`、
  `TaskTable`、`ItemTable`、`HeroTable`、`RechargeTable`、两份 up-star protobuf 与 538 行活动表共同闭合契约。
- **客户端视觉**：尚未由用户重登并操作确认，本文不记为 APK/视觉验收。

## 来源资产与哈希

`node analysis/incoming/activity-ticket-20261111/verify-delivery.mjs` 的结果为：559 个文件、
219 个 TextAsset、27 个 UI bundle、18 张表、67 个必需检查，失败数 0。

- APK `com.jzyx.ps`，versionName `1.55.090365`，versionCode `362155`，assetVersion `364110`：
  SHA256 `3caa14ca150f8259f5e83d263e6a0a43f9b94df7eb9e3d3f58e0fdc494970d95`。
- `64_lua_project.bundle`：SHA256 `2b1fd41f3fb40ea3d3dcd1b7d1591d3d17ffacbc6422c028de4dc02ad04ecdc7`。
- `64_lua_core.bundle`：SHA256 `054c3a1d5de29f66b5f41f413ac56a473ee7b95ccf1226b343068b79cdd3be56`。
- `526731904065320800-UpStarGiftTable.data.lua.bin`：SHA256
  `fbef7e9b68bf34af736e446d825c02ffd77f3eec6f4722a60fed1fc6df66f569`。
- `15441160127181445000-UpStarGiftMgr.lua.bin`：SHA256
  `89e49d65a6969b0753c8d90d70b361853a5db242aac310b8d556eb246449198d`。
- `1086730739918066200-UpStarGiftCmd.lua.bin`：SHA256
  `5abd182fe773a35f546b085dbfc136b94d0f362099c651f0185f32464e958de2`。
- 已纳入运行资产链的 `personal-server/assets/tables/UpStarGiftTable.data.lua.json.gz`：SHA256
  `3cba6b25d8a9fdab300b830c46656940b601bcd8f7f863e355f1c42e5e3a394c`，与交付目录中的
  `expanded/tables/UpStarGiftTable.json.gz` 逐字节一致。

可重复提取命令：

```text
node tools/extract-lua-table-rows.mjs \
  analysis/incoming/activity-ticket-20261111/expanded/textassets/526731904065320800-UpStarGiftTable.data.lua.bin \
  personal-server/assets/tables/UpStarGiftTable.data.lua.json.gz
```

提取器只解释生成表构造器和静态数组，不执行客户端 Lua。运行时不依赖未提交的 `analysis/`；所需 gzip 已进入
`personal-server/assets/tables/`。

## ETF/protobuf 登录包装

模块 92 的 func 25 并行组中，`module_login_data` 外层是 ETF `0x83 0x6d` + uint32 BE 长度，内层是
`pb_up_star_gift_master`。不能直接把外层当 protobuf。

```proto
pb_up_star_gift_master {
  repeated pb_time_limit_up_star info_list = 1;
  uint32 cur_choose_version = 2;
}
pb_time_limit_up_star {
  uint32 version = 1;
  uint64 act_id = 2;
  bytes award_bin = 3;
  pb_recharge_limit_info buy_limit_info = 4;
}
pb_up_star_gift_req { repeated int32 ids = 1; }
pb_up_star_gift_back { pb_time_limit_up_star info = 1; pb_res_to_client res = 2; }
```

`buy_limit_info` 是充值限购状态：`refresh_time` 与 `buy_num_list{recharge_id,buy_num,refresh_time,used_extra_times}`。
免费任务领奖只保留并回写它，不据此发放充值商品。

## UpStarGiftTable 字段全集

| 子表/字段 | 行数与真实语义 |
| --- | --- |
| `UpStarGift` 538 | 每个活动版本的领奖/商品档位。 |
| `UpStarGift.tid` | 客户端资格 id，即 31052 `ids`；数值编码 `version=floor(tid/100)`、领取位 `tid%100`。 |
| `UpStarGift.type` | `TaskTable.Type` 键，不是英雄/精灵 id。实际只有 1199、13005、14701。 |
| `UpStarGift.version` | 期次版本；与 `ActivityTable.version`、`Show.tid` 对应，并必须等于 `floor(tid/100)`。 |
| `UpStarGift.target_count` | `TaskTable.Type.progress_fun` 对应养成值的门槛。当前三类均为星级门槛，不是累计任务次数。 |
| `UpStarGift.task_param` | 养成目标 tid：1199 为 HeroTable tid；13005 为 ItemTable type=171 的魔灵 tid；14701 为 ItemTable type=191 的精灵 tid。 |
| `UpStarGift.gift` | `0` 表示免费任务奖励；非零值是 RechargeTable tid，由充值购买流程处理。508 个非零值均一一命中 RechargeTable。 |
| `UpStarGift.award` | 免费档的实际资源 `[ItemTable tid, count]` 集合。服务只发此列，不用 RechargeTable 反推。 |
| `UpStarGift.one_key` | 一键礼包成员标记；对应 `UpStarOneKeyGift` 与 Mgr 的 one-key 红点/购买路径。当前 538 行全为 0。 |
| `UpStarGift.star_unLock` | 额外展示门槛；非零时读取 `Show.show_style` 指向英雄的最高星级。不是 `target_count` 的替代。 |
| `UpStarGift.ignore_red_dot` | 客户端红点抑制展示位。 |
| `UpStarGift.is_special_show` | 特殊展示样式位。 |
| `Show` 109 | 每期展示配置；`tid=version`，`show_style` 是锁星级校验所用展示英雄，`hero` 是对应展示对象，另有 `is_choose/ui_style_idx/main_jump_version` 等 UI 字段。 |
| `HeroShow` 88 | 背景、头像、进度、特殊礼包底图等纯展示资源。 |
| `Const` 1 | `hero_item_show=[101500,401500]`，是资源展示白名单。 |
| `UpStarOneKeyGift` 1 | 一键礼包定义；当前唯一行是 version 2、gift 540213、target_count 5、Hero 3030501；该 gift 命中 RechargeTable。 |

表内实际 type 分布与来源：

| type | 行数 | TaskTable.progress_fun | 进度来源 | task_param |
| ---: | ---: | ---: | --- | --- |
| 1199 | 390 | 66 | 英雄最高星级/突破后的星数 | HeroTable tid |
| 13005 | 74 | 362 | 模块 158 `pb_pet_develop_data.pets` 的 star | ItemTable type 171 |
| 14701 | 74 | 363 | 模块 538 `pb_elves_develop.elves` 的 star | ItemTable type 191 |

客户端 `UpStarGiftNewNode` 的 `ReqTaskAward`/`ReqBuyRechargeGift` 分支、Mgr 的 `ReqTaskAward`、
`GetAwardRedDotStateByVersion`、`GetGiftTidListByVersion`、`ReqChooseActVersion` 与上述字段共同证明：
版本选择、免费任务领取和充值礼包购买是三条不同路径。

## 领取位与请求语义

- `31052.ids` 非空、最多 100、均为正整数、不得重复，并且每项必须是 `UpStarGift.tid`。
- 只处理 `master.cur_choose_version` 对应版本的行；跨版本 id 返回 code 5。
- `award_bin` 是版本内 BitBlock，索引为 `tid % 100`，字节内按 MSB-first。
- 完整重放同一 ids 返回 0 资源变更的成功回包；部分已领、部分未领返回 code 310，不产生部分发奖。
- `gift>0`、`one_key!=0`、空 award 分别返回具体 code 5；不会把充值礼包或占位行当免费奖励。
- 服务从不信任 ids 自带的“已达标”含义，门槛始终从 Hero/模块 158/模块 538 的权威数据读取。

## 版本选择与登录恢复

- 静态 `ActivityTable.func=25` 共 104 行。2026-11-11 18:29 UTC 的正式排期中，已废弃的 72–75 行不会再进入运行集，
  实际开放版本为 40、49、52、56、111，活动为 25042、25051、25053、25056、25111。
- 登录保留既有 66 条历史 `info_list`；其中重复版本 91 的领取位按位或合并，再选择当前 25091、排除已废弃 25098。
- 当前开放但缺失的 25111 会补 status 和 info 行；其他已不在 ActivityTable 的历史行保留，避免丢旧领取记录。
- 如果 `cur_choose_version` 仍指向开放版本则保留；为 0、过期或未知时，自动选择当前开放版本中开窗时间最新的一版。
  这是登录恢复，不表示 31053 接受 0。
- `31053` 只能选当前开放、已配置且存在于登录数据中的版本。选择同一版本幂等；历史、过期、未知版本返回 309；
  当前开放但缺 UpStarGiftTable 的行返回 code 5。

## 31052 的原子结算

1. 读取模块 92 的 `pb_act_login`，找到 func 25 并行组，解码 ETF + `pb_up_star_gift_master`。
2. 重算当前版本、规范化历史和当前 info 行，校验选中版本仍在运行且有静态表。
3. 校验 ids、版本、免费行、award、任务进度与 `Show.show_style` 的 `star_unLock`。
4. 在 SQLite 事务内设置 `award_bin`，先预编码 `pb_act_login`，再调用既有 `grantResources` 发奖。
5. 把资源模型变化和 canonical 模块 92 一起提交；随后编码 `pb_up_star_gift_back`。任何一步抛错都会回滚事务。
6. 进程重开测试重新从 SQLite 读取模块 92 和资源，领取位与资源均保持，不依赖内存状态。

准确错误行为：

| 条件 | 返回/行为 |
| --- | --- |
| ActivityTable 无 func 25 配置 | code 5 |
| 模块 92 或会话结构缺失 | code 5 |
| 表中没有运行版本 | code 309 |
| 选中版本不在运行集 | code 309 |
| 开放版本缺 UpStarGiftTable/Show | code 5 |
| ids 空、超 100、非整数、非正、重复、未知 | code 1 |
| id 属于其他版本 | code 5 |
| id 是充值商品、one-key 或空 award | code 5 |
| 任务星级不足或展示 `star_unLock` 不足 | code 5 |
| 全部 id 已领 | 成功、空资源变更 |
| 同一请求部分 id 已领 | code 310，全部不发 |
| grant、编码或 SQLite 持久化失败 | 抛错并整体回滚 |

## 回归

`up-star-gift-service.test.mjs` 覆盖多版本、历史保存、重复版本 91、选择幂等与重登、非法 ids、跨版本隔离、
英雄/魔灵/精灵进度、展示星锁、当前付费行不进入 31052、完整重放、部分重放、grant 失败与持久化失败回滚、
成功重开恢复、ETF/protobuf wrapper、以及真实网关优先于 benefit-commerce 的路由。

定向套件同时运行 ActShop、benefit 解码/网关、activity-calendar、activity-read-service：61/61 通过。
最终全量 `npm test` 为 2891 项、pass 2889、fail 0、skipped 2；两项跳过均因未设置
`FC_RECHARGE_CLIENT_BUNDLE`。日志为 `analysis/test-runs/up-star-gift-20261112/full-final.log`。

## 限制与未验收项

- 当前 111 版本所有 5 行都是充值礼包；本修复并未把充值购买移植到 31052，购买仍由既有 RechargeMgr/支付链负责。
- 本轮没有真实 31052/31053 请求样本，也没有用户视觉确认；临时 TCP 只证明协议路由、事务和回包。
- `ignore_red_dot`、`is_special_show`、HeroShow 与 one-key 红点属于客户端展示，服务端只影响资格/领取判断；
  需真实 UI 样本确认所有展示分支。
- 百抽精灵 `1102008/theme104` 的内部升星由另一 agent 负责，本轮未修改。
- 独立升星当前的空白是否由用户已进入的页面实际触发仍未由 UI 日志确认；本修复闭合的是模块 92、版本和
  UpStarGiftTable 契约，不把无请求证据的视觉症状宣称为已验收。
