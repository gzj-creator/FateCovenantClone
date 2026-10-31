# M7：综合验收与发布前审计

## 目标

验证 M1–M6 的组合行为，完成真实 TCP 和隔离 APK/UI 验收。该模块必须最后串行执行；任何组件测试都不能口头升级为“可玩验收”。

## 独占文件

- `personal-server/test/relic-divine-e2e.test.mjs`
- `personal-server/test/relic-divine-tcp.test.mjs`
- `agent/workflow/relic-divine-activities/implementation.md`
- 验收用的本地临时脚本、日志和分析产物（不提交敏感数据）

只有真实验收确实通过时，才允许按 AGENTS.md 同步 `apk/` 快照和更新 `apk/README.md`。未验收构建不得标为可用。

## 自动化验收

先在 worktree 的 `personal-server` 下运行：

```powershell
npm test
```

记录：

- 测试总数、通过数、失败数
- 运行耗时和 Node 版本
- 失败是否是既有问题；不能以“既有”为由跳过本任务新增失败

然后运行专项：

```powershell
node --test test/fantasy-draw-service.test.mjs test/fantasy-equipment-inventory.test.mjs test/fantasy-equipment-service.test.mjs test/fantasy-shared-draw-service.test.mjs test/artifact-draw-act-service.test.mjs test/demigod-act-service.test.mjs test/fantasy-equip-act-service.test.mjs test/relic-divine-gateway.test.mjs test/relic-divine-tcp.test.mjs
```

## 真实 TCP

使用本地测试服务器而不是组件直调：

- 握手、加密/不加密配置按现有测试 fixture。
- 每个命令至少一次真实 request bytes → gateway → SQLite → response bytes。
- 覆盖正常成功、业务拒绝、资源不足、活动未开放、重复请求、重启后读取状态。
- 记录命令 ID、request schema、response schema、返回码和日志证据。
- TCP 测试只证明服务端网络协议链路，不等于 APK UI 验收。

## APK/UI 验收

使用隔离包 `com.jzyx.ps` 和固定 ADB：

```text
E:\Mumu\MuMuPlayer\nx_main\adb.exe -s 127.0.0.1:16448
```

禁止操作 `com.jzyx.my`。用户正在游玩时，不擅自停应用、点击或改路由；需要界面操作时由用户配合或只在用户明确授权、游戏不忙时由 agent 操作。

验收清单：

- 进入圣器天池、神灵降世和常驻幻武池，无协议错误/卡死
- 单抽、连抽、券和钻石购买
- 心愿解锁与选择
- 概率展示、保底进度、轮次和累计抽数
- 装备创建、穿戴、卸下、升级、突破、升星、品质升级、碎片合成
- 圣器活动任务、试炼领奖、翻牌、新一轮、领奖、合成
- 神灵/幻武活动日弹珠、大奖弹珠、试炼奖励、穿戴、祝福、复制
- 每日刷新、跨日、重启后状态
- 推送后 UI 即时更新，重登录后状态一致
- 资源不足和非法操作不会导致客户端状态错乱

对每一步保存：时间、UI 页面/截图/日志路径、请求命令、响应、SQLite 前后值、是否成功。不能把“看到页面打开”当作完整命令验收。

## 文档

持续更新 `agent/workflow/relic-divine-activities/implementation.md`，至少包含：

- 每个命令与 Proto 的证据路径
- 数据表和规则来源
- 模块 ID、块顺序、登录 payload 证据
- 实现范围、共享服务和事务边界
- 专项/全量测试命令与结果
- 真实 TCP 结果
- APK/UI 结果和失败截图/日志
- 未验证假设、配置缺口、遗留项
- 设备包名、版本、安装来源和前置条件

## 发布门槛

只有以下全部成立才允许写“圣器天池和神灵降世可玩验收完成”：

- 所有计划命令有业务实现，不存在空壳、静默成功或未路由
- 所有专项测试和 `npm test` 通过
- 真实 TCP 全链路有记录
- 隔离 APK/UI 验收通过
- 模块顺序和模块 518 三块兼容通过
- 未验证假设和遗留项已经写明；不能把假设隐藏在实现里
- APK 快照只在真实验收通过后同步，且不提交 APK 文件
