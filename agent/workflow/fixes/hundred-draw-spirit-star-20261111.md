+# 新超凡精灵百抽：保底文案、升星页空白与精灵主题实现修复

- 日期：2026-11-11（Asia/Shanghai）
- 分支：`fix/hundred-draw-spirit-star-20261111`
- Worktree：`/data/disk1/projects/FateCovenantClone/.worktree/hundred-draw-spirit-20261111`
- 基线：main `f1fed77572aad3538ffb1b6173551f52af121b98`
- 范围：百抽家族 `117001–117005` 的登录数据与升星逻辑，重点是 `ActFrameAct[1102008]`（超凡璃璃）。未部署、未重启线上服务、未写运行数据库、未操作 APK/ADB。

## 配置链（已核对）

```text
ActFrameAct[1102008]  type=1102 version=8  百抽活动_精灵招募_首发_超凡璃璃
HundredDrawActTable.Version[8]  target=[500520] pool=103 gift=1841008 shop=182817
HundredDrawActTable.Pool[103]   theme_type=104 draw_item=836102 star_task_lib=103
                                pool_type=101 guarantee_lib=103 guarantee_total_draw_times=100
HundredDrawActTable.StarTask[10301..10304] target=5/6/8/10
```

同一卡池也被 `1102006`（version 6，霄霄，target 500120）使用，说明 pool 103 是精灵主题而非英雄主题；旧版 `elves_act 100901–100903` 不在本次范围。

## 已证实的根因

### 1. 登录块编码不符合客户端契约（主因）

线上数据库 `login_modules`（role 100002，只读）与登录抓包种子 `fixtures/login-modules.seed.json` 中，模块 92 `pb_act_login.act_list[].module_login_data` 的每一条都以 `83 6d`（ETF BINARY_EXT）+ 长度开头，即客户端先执行 `Codec.DecodeErl` 再交给活动 `LoginParse`（与 `agent/workflow/hundred-schools/implementation.md` 记录的 `ActivityMgr.ParseParallelAct` 证据一致）。模块 183 的 `pb_act_role_login_data.module_login_data` 同样是 `0x836d + uint32BE length + protobuf` 的块序列。

修复前 `hundred-draw-service.mjs` 直接把裸 protobuf 写进这两个字段，客户端解析活动数据会失败或得到空数据：

- 首次进入时目标、累计抽数、保底次数都按默认值显示；
- 保底文案的目标名无法代入，页面留下未替换的 `{0}`；
- 升星页拿不到目标，页面内容为空。

### 2. 固定池目标没有下发

`targetTid()` 在内部会回退到 `Version.target[0]`，但 `actData()` 原样下发 `select_target_tid=0`。线上 role 100002 的 `1102008` 与 `20001` 状态都是累计 0、保底 0、目标 0。固定池（`pool_type=101`）只有一个配置目标，服务端现在在登录和命令响应中统一下发 `500520`，并把规范化后的目标写回 SQLite；下放池（`pool_type=102`）在玩家选择前保持 0，避免把默认值伪装成玩家选择。

### 3. 升星领奖只认英雄

`starAwardCommand()` 只查 `model.heroInfo.hero_list` 并要求 `theme_type===101`，精灵主题必然返回 code 5。权威星级来源已核对：

| 主题 | 权威容器 | 说明 |
| --- | --- | --- |
| 101 英雄 | `heroInfo.hero_list[].star` | 原有行为 |
| 102 魔灵 | 模块 158 `pb_pet_develop_data.pets[].star`（index 0） | 与 `pet-service.mjs` 一致 |
| 104 精灵 | 模块 538 `pb_elves_develop.elves[].star` | 与 `elves-service.mjs` 一致 |
| 103 幻武 | 无 | `Pool[105].star_task_lib=0`，没有升星档位 |

未拥有目标时星级按 0 处理并返回 311（未达标），不再返回“配置错误”。模块缺失仍返回 5，避免吞掉服务端数据错误。

### 4. 碎片奖励映射只覆盖英雄

`chipFor()` 原先只读英雄行的 `chip`。已核对的权威映射是 `ItemTable.Chip`：`point_item=500520 → tid=500521`（type 191/192，需求 100 片），英雄 `5040701 → 25500704` 同样存在。现在统一按 `point_item` 反查，英雄行 `chip` 仅作回退。这样 `ProcessAward[10303/10318]` 的 `award_type=103, num=100` 能真实发放精灵碎片。

### 5. `draw_target_time` 写成了时间戳

proto 注释为“抽中大奖次数”，原实现写入 `at`（Unix 秒）。现改为次数累加；`ten_target_times`（十抽内命中次数）在十连中命中时累加。该计数规则依据 proto 注释推定，未取得原服计数口径证据。

### 6. 奖励类型 104

`StarTask` 的 8/10 星档位（`10303/10304`，以及英雄 `10103`、魔灵 `10203`）使用 `award_type=104` 且 `award_item=0`。客户端 `HundredDrawActUtil` 的该分支读取 `RelicTable.SpHero[target].item`，服务端已按此实现英雄映射；精灵、魔灵没有等价的“本体专属道具”表，继续明确返回 code 5，不猜奖励。

## 文案与空白页结论

- 已证实：登录数据编码错误会导致 `HundredDrawActData` 解析失败，目标、保底与领取位全部缺失；固定池目标 0 也使目标名无法解析。这两项足以造成“目标名不显示、保底文案剩占位符、升星页无内容”。
- 未证实：用户原文“再招募 t2d 必得 {0}”中的 `t2d` 与 `{0}` 的具体模板和格式化调用。当前 checkout 没有 TextTable/客户端 UI Lua 静态资产（`analysis/` 未随 worktree 保留），无法在服务端侧确认占位符语法、参数顺序或本地化标签。需要 APK/客户端日志验收。
- 未证实：客户端固定池是否自行使用 `Version.target[0]` 而不读 `select_target_tid`。服务端现在两种语义一致，因此该分支差异不再影响结果，但最终文案仍需实机确认。

## 测试

- `node --test --test-concurrency=1 test/hundred-draw-service.test.mjs test/hundred-draw-gateway.test.mjs`：18/18 通过。
  - 新增覆盖：固定池登录目标/保底；模块 92 `83 6d` 包装；模块 183 行同块；精灵 5 星领取、防重、重登；4 星拒绝；8 星 type104 明确拒绝；魔灵模块 158 星级；精灵碎片 500521；命中次数；响应编码失败回滚。
- 定向回归：`premium-act` 10/10、`gameplay-gateway` 7/7、`activity-calendar + welfare-service` 31/31、`acc-recharge-service + system-integration` 16/16、`launch-profile + draw-activity-gateway + help-up-act` 15/15。
- 全量回归：`node --test --test-concurrency=1 test/*.test.mjs`，2853 项，pass 2851、fail 0、skipped 2，退出码 0。日志保存于 `/tmp/hundred-draw-full.log`；该日志为临时文件，未提交。

## 待 APK 验收

1. 重新登录后打开 `1102008`：保底文案应显示“再招募 100 次必得 璃璃”（首次未抽），目标名与保底次数不再为 0 或占位符。
2. 升星页应显示 5/6/8/10 星档位与当前星级；抽到精灵后重登仍保持。
3. 5 星领取 `10301`（`836102 x10`）、6 星领取 `10302`（`850002 x1`）应成功且不可重复；8/10 星仍按当前边界拒绝，需先取得 type104 精灵映射证据。
4. 仍缺 `ActShopTable`，`182817` 兑换商店维持明确拒绝。

## 其余边界

- `GuaranteeWeight` 的权重曲线语义未取证，抽奖仍按 `guarantee_total_draw_times` 强制第 100 抽命中本体；未改变概率模型。
- proto 的 `pb_hundred_draw_pool_data` 要求保底跨“同类型同主题活动”继承，本服务仍按 `act_id` 保存保底，未实现跨期继承。
- `pb_hundred_draw_act_data.buy_limit_info` 由付费礼包服务维护，本服务不写入。

