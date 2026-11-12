# 活动文案、限时升星空白与登录配置错误：定位交接

本轮只定位，交由用户安排其他 agent 修复。没有修改业务代码、重启服务、操作设备或写入运行数据库。

## 证据基线

- 运行进程：`fate-covenant-realm-2.service`，入口 `/data/disk1/game/current/local-server.mjs`。
- current 指向 `/data/disk1/game/releases/release-20261111T085036Z`，`RELEASE_COMMIT=f1fed77572aad3538ffb1b6173551f52af121b98`。
- 对应源码工作树：`.worktree/main-activity-ticket-20261111`（main）。环境 cwd 下的 `FateCovenantClone-main/` 是另外的导出副本，不应当作当前线上源码基线。
- 日志：`/data/disk1/game/data/events.jsonl` 与 systemd journal。本轮数据库通过 `DatabaseSync(...,{readOnly:true})` 读取。
- 精简错误证据：`analysis/diagnostics/activity-ui-20261111/rejections.json`，不含 token、账号密码或管理密钥。下文时间均为 UTC；北京时间/新加坡时间加 8 小时。

## A. 登录后“配置出错”：已由线上日志确认

`2026-11-11T08:54:48.597Z` 起，客户端发送 `105702`，服务端记录：

```json
{"event":"task_activity_command_rejected","type":105702,"code":5,"message":"Task activity server vitality is not available"}
```

截至 `08:59:48` 共 12 次，后一个连接在 `08:57:48/08:58:48/08:59:48` 每分钟各请求三次；第一次连接也出现三次。活动同步日志列出通用任务活动 `1003001/1003004/1003006`，与三次轮询相符，但日志没有记录请求活动 ID，不能把每次请求准确分配到活动。

直接根因是 `personal-server/game/task-activity-service.mjs:244` 对所有 `105702` 无条件抛 `GameError(5)`。协议 `assets/protobuf/task_activity.net.proto.bin` 已有 `pb_task_activity_data_rsp { int64 server_vitality=1; }`。这不是表文件读取偶发失败，而是预留接口的主动拒绝，登录/页面轮询会持续触发全局错误。

现有 `test/task-activity-service.test.mjs:124` 甚至断言该读取接口应返回 5。修复时必须同步改变这项预期，补充登录自动读和轮询场景。先定义全服活跃值的权威来源与活动维度；如果该活动确实没有贡献，真实零值可以是合法状态，但不能用固定成功值替代聚合实现。数据不足时须调整活动可用性与客户端读取契约，避免每分钟弹错。

## B. 新超凡精灵：确认了服务端缺口，文案格式根因仍需客户端证据

当前登录的 `hundred_draw_login_synced` 包含 `20001/1102008`。新活动对应：

```text
ActFrameAct[1102008]: 百抽活动_精灵招募_首发_超凡璃璃，type=1102，version=8
HundredDrawActTable.Version[8]: target=[500520]，pool=103，gift=1841008，shop=182817
Pool[103]: theme_type=104，draw_item=836102，star_task_lib=103，guarantee_total_draw_times=100
```

这是百抽家族 `117001–117005`，不能仅因为页面写“精灵”就优先改旧版 `elves_act` 的 `100901–100903`。后者登录快照中的 `99022` 是旧小夜活动，当前日历日志已经将其移除。

已确认的代码问题与疑点：

1. **目标展示数据疑点。** 运行 DB 的 role `100002`、activity `1102008` 状态为累计 0、保底 0、`select_target_tid=0`。`hundred-draw-service.mjs:188` 的抽奖内部会回退到 `Version.target[0]=500520`，但 `actData()`（195–204）原样下发 0。固定池可能允许客户端自行使用版本默认目标，因此这条只能确认为内外数据不一致，尚不能直接断言是 `{0}` 的根因。应先核对客户端固定池目标解析分支，再统一登录和命令响应的目标语义。
2. **精灵主题没有目标资料解析。** `targetRow()`（208–214）只支持主题 101/102/103，104 返回 null。`chipFor/headFor/skinFor` 等分支也需按实际奖励类型审核，避免补好显示后抽奖/领奖仍返回 5。
3. **精灵升星领奖必定失败。** `starAwardCommand()`（431–439）只从 `model.heroInfo.hero_list` 找角色，并要求 `theme_type===101`，因此精灵主题 104 的 `117004` 即便请求合法、真实精灵星级达标，也会返回 code 5。精灵权威列表是 module 538 `pb_elves_develop`，参照 `game/elves-service.mjs`，不能从英雄列表找精灵。
4. **星级奖励配置实际存在。** `StarTask` library 103 有 10301（目标星级 5）、10302（6）、10303（8）等行；并非整个活动的升星档位表都缺失。部分奖励类型为 104，现有 `resolveAward()` 在未取得技能映射时继续拒绝，需一起处理。
5. **模块 183 的载荷疑点。** `hundredDraw.synchronizeLogin()` 只更新模块 92 活动载荷；`gateway.mjs:969` 的 `loginActFrameGroups()` 只传父子活动 ID/窗口，`activity-calendar.mjs:442` 为新增模块 183 行填 `Buffer.alloc(0)`。当前网关 `loginActivities` 合并了圣器/累充/祈福的数据，没有对应百抽载荷。这是打开活动有入口但内容空白的重点检查项。必须核对客户端 HundredDrawActData 实际从 92、183 或两者组合解析，不能仅按“行已存在”验收。

**证据限制：** 可访问日志中没有用户此次点击引发的 `117001/117004/31052/31053/100901–100903` 错误事件，也没有客户端 Lua 日志或 UI 调用栈。`t2d`、`{0}` 是否由占位符语法/参数顺序/目标缺失造成，尚不能通过服务端日志定论。修复 agent 应检查当前 APK 的百抽精灵界面、保底文案 TextTable 条目和格式化调用，并对照真实登录响应。保留用户原文“再招募 t2d 必得 {0}”，不要在无客户端证据时宣称已证实服务器参数编码错误。

## C. 限时升星空白：需要区分两条实现路径

如果是新超凡精灵页面内的升星页，先按 B 的百抽 theme 104、library 103 与登录载荷排查；它有档位配置，但领奖判断只支持英雄。

如果是旧版独立“限时升星/升星礼包”，对应 `up_star_gift`：

- `assets/protobuf/up_star_gift.db.proto.bin` 定义 `pb_up_star_gift_master.info_list/cur_choose_version`，以及每期 version/act_id/award_bin/buy_limit_info。
- `game/benefit-commerce-service.mjs:23` 将 `31052/31053` 整族配置为主动拒绝，原因是 `UpStarGiftTable` 未导出。本次资产目录确实没有该表。
- 当前日历日志仍保留 `25072/25056/25051/25053/25073/25075/25074/25042` 等 func 25 升星活动，其中模块 92 是共享大块历史快照数据；没有找到服务端按真实星级、领取记录重建这一家族登录内容的实现。

这证明独立升星家族尚有真实实现缺口，但无法仅凭“空白”认定用户打开的就是该家族。需要先从客户端面板调用/选中版本确认路径，不能把缺失 `UpStarGiftTable` 当作百抽内置星级任务空白的已证实根因。

## D. 同类问题范围与建议分工

1. **任务活动 agent：** 修复 `105702` 的全服值读取与登录轮询，变更现有 code 5 断言；覆盖首次登录、三个活动同时轮询、重连与跨角色/活动统计隔离。
2. **百抽精灵 agent：** 聚焦 `1102008/version8/pool103/theme104`，核对真实文案模板和 92/183 载荷；解决固定目标解析、精灵星级与奖励映射。扩展到主题 102/103 的非英雄星级任务，它们也被同一个 `theme!==101` 分支拒绝。覆盖登录即开页、首次抽取前的保底/名称、抽奖后重登、达标领取、防重与事务回滚。
3. **独立升星及配置完整性 agent：** 明确 `31052/31053` 的配置与登录契约，取得表资产后实现，不猜奖励；审计有入口但只有 fail-closed 实现的活动家族。`benefit-commerce-service.mjs` 的 REFUSAL_FAMILIES 可作候选清单，但其中旧注释可能已被优先路由覆盖，必须逐项核对实际派发，不能把清单全部算作当前线上故障。

历史日志另有 `10507/type12` 返回 5 共 5 次、`107703` 返回 309 共 9 次，均在 11 月 10 日，当前 main 已含其修复（参照 `entry-display-config-error-20261111.md`），不应将旧记录当作当前版本新增故障。当前最新错误来源是 105702。

验收必须检查最终发到客户端的模块载荷和实际 UI；“行存在”“命令已路由”“旧测试全绿”均不足以证明活动内容可见。文案正确之外，领奖要使用真实养成进度并保持幂等；不得通过吞掉全部 code 5、伪造达标状态或随意发奖消除弹窗。

## 本轮检查

在对应 main 工作树运行 `node --test --test-concurrency=1 test/task-activity-service.test.mjs test/hundred-draw-service.test.mjs`，16/16 通过。该结果确认现有组件行为可复现，不代表上述问题修复：其中一项明确要求 105702 抛 code 5，百抽星级成功路径只验证英雄。本轮未做 APK 验收。
