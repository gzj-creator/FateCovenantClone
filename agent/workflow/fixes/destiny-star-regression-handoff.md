# 星火整体回归修复交接计划

更新时间：2026-10-31

## 2026-10-31 根因与修复

- 用户在 main 服务上再次进入星火，仍显示第一阶段；页面截图为
  `analysis/experiments/private-server-20261025/p3/destiny-current-user-20261031.png`。
- 客户端 `ModuleTable.data.lua` 的 107 行注册 `DestinyMgr`，`ModuleMgr` 按模块 ID
  获取登录数据；100 并非星火模块。此前服务误将进度写入 100，而客户端实际收到的
  107 是空字节，因此登录后显示未激活状态。旧文中“页面读取 module 100”的说法有误。
- `DestinyMgr.Init` 接收 `cur_stage=2` 后保持 `curStage=2`，从当前阶段的位图寻找
  下一节点；`DestinyForm.InitStateForm` 将 `CurStage` 传入阶段选择。
- 服务登录时优先使用非空 107；若 107 缺失或为空，则从旧 100 迁移，100 保留为
  审计副本。此后升级只读写 107，避免旧副本覆盖新进度。非法非空 107 直接报错并
  回滚，避免静默覆盖。
- 隔离测试覆盖从 100 迁移 `cur_stage=2,slot_state=0x70`、登录 ETF 的 107 字节、
  SQLite 重开、旧阶段及重复节点不扣费、204 只扣一次、第三阶段与最终阶段。
  组件测试通过不等于客户端视觉验收；部署和用户确认另行记录。

## 工作区

- Worktree：`F:\projects\FateCovenantClone\.worktree\destiny-star-stage`
- 分支：`fix/destiny-star-stage`
- 已有修复提交：`cf0c39f fix: make destiny stage transitions idempotent`
- 该提交已合入 `main`；新修复必须继续在本 worktree 和该分支完成。

## 用户看到的问题

- 星火整体疑似损坏，页面“重置到 0”，之前激活的节点不见。
- 已满阶段没有正确呈现为“进入下一阶段”的状态。

## 已确认事实

- 当前正式 SQLite 的数据没有丢。module 100 为：
  `{"data":[8,2,18,13,112,0,0,0,0,0,0,0,0,0,0,0,0]}`。
- 解包后为 `cur_stage=2`、`slot_state=0x70`，即第二阶段 201、202、203 已点亮。
- 资源 25002 当前确实为 0，这是点亮节点后的材料余额，不等于状态被重置。
- 数据库 `quick_check=ok`、`integrity_check=ok`、`user_version=10`。
- 2026-10-31T11:52:22Z 与 11:52:28Z 的真实 82601 请求均携带
  `curStage=2`；服务端返回 `cur_stage=2`，后续请求也确实写入了 201、202、203。
- 因此现有证据不能支持“数据重置”或“阶段回退”的结论。
- 20:09 的设备截图仍显示第一阶段“岩星 I”和已锁的第二阶段，但该截图产生于
  正式服务切回 main 之前，不能单独证明当前部署仍有页面错误。
- 正式服务曾由 `.worktree/acc-recharge-display-fix` 中的旧入口占用，随后已停掉；
  当前服务 PID 为 `41512`，入口为
  `F:\projects\FateCovenantClone\personal-server\local-server.mjs`，五端口均只监听
  `127.0.0.1`，客户端已于 12:14:05Z 自动重连并登录成功。

## 证据位置

- 热备份：`analysis/experiments/private-server-20261025/p3/destiny-feature-regression-20261031-2015/game.hot-backup.local-only.sqlite`
- 热备份 SHA256：`6808770EFEDC10FB8E173905CA7442A2F1DDADA72834305C5ABD65844C71E422`
- 修复前截图：`analysis/experiments/private-server-20261025/p3/destiny-star-stage-20261031-1951/device-regression.png`
- main 重启后截图：`analysis/experiments/private-server-20261025/p3/destiny-feature-regression-20261031-2015/current-after-main-redeploy.png`
- 服务日志：`analysis/experiments/private-server-20261025/p3/destiny-feature-regression-20261031-2015/server-main-destiny.local-only.out.log`
- 事件日志：`analysis/experiments/private-server-20261025/p3/runtime.local-only.data/events.jsonl`
- 客户端反汇编：`analysis/tmp/endgame-fixes/DestinyMgr.meta.json`、
  `analysis/tmp/endgame-fixes/DestinyForm.meta.json` 及同名 `.core.txt`。

## 修复原则

1. 先只读复现，不先改代码。用户正在游戏时，不代点、不启动或停止客户端、不改路由。
2. 不补造“打开星火”请求。协议事实是进入面板不发读取请求，页面读取登录下发的 module 100。
3. 不用恢复旧备份覆盖当前进度。任何新的服务重启前，必须先创建当前库的热一致性备份。
4. 优先修正服务端状态编码/阶段语义；只有证据证明客户端页码算法本身有问题时，才评估极小客户端补丁。
5. 不修改 APK，除非前面各层证据都排除且用户明确进入 APK 修改路径。

## 下一步计划

### 1. 验证 main 部署后的真实页面

- 让用户重新进入星火，只截屏和读取日志；不代替用户点击。
- 验收页面标题应为第二阶段，201、202、203 保持点亮，204 可继续操作。
- 若此步已经正确，把问题定性为旧 worktree 覆盖了修复并为部署流程加防回归，不继续改星火逻辑。

### 2. 如果页面仍回第一阶段

- 从 `DestinyMgr.meta.json` 的 prototype 23 `Init` 核对
  `cur_stage -> curStage/startId/curId/endId` 推导。
- 从 `DestinyForm.meta.json` 的 prototype 8 `InitStateForm`、prototype 33
  `InitStageNode`、prototype 35 `SetSelectStage` 以及布局组件 `Positioning` 核对
  `atStage/atShowStage` 最终页码。
- 将当前 `{cur_stage:2, slot_state:0x70}` 和若干合成状态喂给反汇编逻辑，找出
  哪一步把 atStage 变回 1，或哪一步把第二阶段的节点解释为第一阶段。

### 3. 最小修复候选

- 服务端只改一个状态语义点，例如阶段位图归属、响应阶段字段或完成阶段后的规范化值。
- 保留已实现的幂等语义：旧阶段重放不扣费、当前阶段重复节点不扣费、未来阶段仍拒绝。
- 不改变现有用户数据；如当前历史状态存在兼容性问题，只做一次性、可审计的迁移。

### 4. 测试

- 扩充 `personal-server/test/destiny-service.test.mjs`，至少覆盖：
  - 第一阶段完成后响应和登录下发的状态都能让客户端推导第二阶段；
  - 第二阶段部分点亮后 `cur_stage=2, slot_state=0x70` 可重开保存；
  - 第三阶段开始时不显示第一阶段完成态；
  - 旧阶段重放、同阶段重复和最后阶段行为不回退。
- 定向测试通过后跑 `personal-server` 全量测试。
- 正式库测试不得消耗资源，不得沿用真实 role 做写操作。

### 5. 部署和最终验收

- 重新读取 PID、命令行和数据库完整性；热备份当前库。
- 从 main 绝对入口启动服务，确认五端口 loopback，客户端自动重连。
- 用户确认“进入星火直接落在未满的第二阶段”，能继续点亮 204，并确认 201、202、203 仍在。
- 只有用户视觉确认后，才可标记修复完成。

## 完成标准

- 根因有代码路径和真实请求证据，不把症状归因成“缓存”或“数据损坏”。
- 正式库仍保留第二阶段和 201、202、203 的位图。
- 用户再次进入星火落在第二阶段，可继续点 204，不再出现完成阶段后错误回一阶段或业务码 5。
- 定向测试、全量测试、部署证据和用户视觉验收分别记录。
