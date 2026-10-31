# 项目文档索引

> 项目：FateCovenantClone
> 版本：0.2
> 状态：R0–R2 原型源码已交付，独立 C# 测试通过，Unity 与 Android 待验收
> 更新日期：2026-10-25

## 文档地图

| 文档 | 内容 | 何时阅读 |
| --- | --- | --- |
| [01-background-and-goals.md](01-background-and-goals.md) | 项目背景、产品目标、范围、原则、成功标准和风险 | 开始设计或判断需求优先级时 |
| [02-implementation-plan.md](02-implementation-plan.md) | 技术路线、侦察方法、Unity 架构、里程碑、测试和交付标准 | 每次进入开发或评审阶段时 |
| [03-first-slice-spec.md](03-first-slice-spec.md) | 3D 小队战斗的首版规则、表现、镜头、特效、数据契约和验收标准 | 开始实现战斗切片时 |
| [04-system-roadmap.md](04-system-roadmap.md) | 完整系统范围、成品号取证、图鉴/技能/养成/天极/法阵路线和验收 | 确定接下来实现什么、检查整体进度时 |
| [05-development-status.md](05-development-status.md) | 当前源码、验证证据、工具链限制、剩余工作与准确续接命令 | 每次续接开发、检查哪些内容实际通过时先读 |
| [09-system-completion-plan.md](09-system-completion-plan.md) | 图鉴剩余操作及团员名册、法阵、星魂卷轴、训练、船舱、时空神殿的分工与整体验收 | 分派模块、合并实现或核对后期系统进度时 |
| [10-store-product-flow-remediation-plan.md](10-store-product-flow-remediation-plan.md) | 商城限购、返利、通行证、表情包宝箱与主线任务奖励修复计划及验收状态 | 处理本轮商城/任务链路时 |

## 项目一句话定义

用 Unity 6 制作一款可在 Android 上独立运行的 3D 二次元小队战斗游戏原型，复刻《命运圣契》中经实际试玩确认的核心体验，而不是复制其完整商业内容或服务器。

## 当前事实

- 目标平台：Android。
- 运行方式：MuMu 模拟器，后续可构建独立 APK。
- MuMu ADB 设备序列号：`127.0.0.1:16416`。
- 游戏包名：`com.woobest.mysq.yofun.mumu`，版本 `1.55.090365`。
- 设备：Android 12 / API 32，屏幕 `1440x2560`，主 ABI `x86_64`。
- 目标类型：3D 小队自动战斗与角色收集；已有回合标识和技能演出证据，精确调度及公式待验证。
- 本项目计划本地独立运行；原游戏登录及服务器依赖尚未完整验证。
- 工作目录：`F:\projects\FateCovenantClone`。
- Unity 工程：`F:\projects\FateCovenantClone\unity\FateCovenantClone`，已写入版本/包清单、战斗/本地循环/程序化表现及编辑器自动化源码；固定 Unity `6000.0.85f1` / URP `17.0.4`，Boot/Main/Battle 场景由 Setup 生成，尚未经真实编辑器验证。
- 分析资料目录：`F:\projects\FateCovenantClone\analysis`。
- 项目记忆：`AGENTS.md`。
- 设备基线：[01-device.md](../analysis/notes/01-device.md)。

## 文档优先级

发生冲突时按以下顺序判断：

1. 用户的最新明确要求。
2. 实际试玩和可复现证据。
3. 本目录内的项目文档。
4. 对原游戏的主观印象或网络资料。

## 更新规则

- 每次确认新的游戏机制，更新背景文档中的“已确认事实”和“待验证假设”。
- 每次里程碑范围变化，更新实施方案中的范围、退出标准和风险。
- 不把猜测写成定论。未经试玩或日志验证的内容必须标记为“假设”。
- 重要决策记录在实施方案的“决策记录”中，包含日期、选择和理由。

## 下一步入口

先读 [05-development-status.md](05-development-status.md)。当前已通过战斗 37 项断言、本地循环 8 个场景及基于既有 Unity 2022 Player API 的三个运行程序集分开编译；这些不代表 Unity 6、运行画面或 APK 通过。独立关卡页和 RuntimeSmoke 源码已加入，Smoke 尚未运行。程序化关节角色与动作仍是占位表现，正式美术未完成。

下一步取得并核实匹配的 Unity 编辑器与 Android 模块，依次执行 `tools/unity-project.ps1` 的 Discover、Setup、Test、Smoke，查看报告和截图，再 BuildAndroid 并安装 MuMu 跑完整闭环。安装入口为 `tools/install-unity-toolchain.ps1`；不等待成品号推进现有工程。

完整开发路线以 [04-system-roadmap.md](04-system-roadmap.md) 为入口：先完成 R0 至 R2 的可玩 APK，再扩展完整技能、养成、天极角色和法阵。专属武器延期；成品号用于后续功能验证，不阻塞工程与基础战斗开发。

ADB 连接、游戏包识别、APK 拉取、引擎识别和首段正常战斗录像已经完成。
战斗观察见 `analysis/notes/02-battle-evidence.md`，静态清单见 `analysis/notes/03-static-inventory.md`。

新手引导、功能解锁和七日指引观察见 `analysis/notes/04-onboarding-system.md`。

启动公告、登录入口、加载、大厅和后续界面流程，以及最新续接位置，见
[05-startup-and-ui-flow.md](../analysis/notes/05-startup-and-ui-flow.md)。

2026-10-25 已补录圣器获得、第一槽上阵与星火激活，当前停在第 3 章第 5 关地图；
证据与旧会话摘要纠错见 [06-relic-and-star.md](../analysis/notes/06-relic-and-star.md)。

纯 C# 战斗内核位于 `unity/FateCovenantClone/Assets/Scripts/Battle/Domain/`，
可用 `tools/run-battle-core-tests.ps1` 编译和验证，不依赖 Unity 编辑器。
图鉴、编队、快照、奖励与存档逻辑位于 `Assets/Scripts/Game/`，可用 `tools/run-game-core-tests.ps1` 验证。两个入口的最新日志分别在 `analysis/test-runs/battle-core/last-run.txt` 与 `analysis/test-runs/game-core/last-run.txt`。
运行程序集的 API 兼容检查入口为 `tools/check-unity-runtime-compile.ps1 -ManagedPath <真实 Player 的 Managed 目录>`，当前引用来自本机 Unity `2022.3.62f3c1` Player；报告在 `analysis/test-runs/runtime-compile/report.json`。它不编译 Editor 源码，也不替代匹配 Unity 6 的实际验证。资产来源清单见开发状态文档。
