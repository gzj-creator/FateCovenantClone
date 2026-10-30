# 实施方案

> 版本：0.1
> 状态：可执行初稿
> 更新日期：2026-10-24
> 依赖前提：Android 模拟器、ADB、REA、Unity 6 工具链可用

> 2026-10-25 范围更新：后续系统与交付批次以 [04-system-roadmap.md](04-system-roadmap.md) 为准。本文保留初版技术方案；旧 M 里程碑与近期清单为立项基线，不代表当前完成状态。图鉴、完整技能、养成、天极角色与法阵已纳入分阶段路线，专属武器延期。

## 1. 实施策略

项目采用“证据驱动 + 纵向切片”的方式推进。

1. 先采集原游戏的可观察行为。
2. 用最小代码验证核心战斗是否可玩。
3. 完成一条从启动到存档的完整闭环。
4. 再扩充角色、技能、关卡和表现。
5. 每个阶段都必须能构建、运行和回退。

不使用“先搭完整框架再填内容”的方式。首版框架只服务已确认需求，避免过度设计。

## 2. 工作分解

### A0 环境与设备基线

目标：确保后续所有分析可以重复。

交付物：

- Node、npm、JDK、Android SDK、ADB、REA、JADX、Unity Hub 和 Unity 6 可用。
- MuMu 设备和序列号固定记录。
- `REA_ADB_PATH`、`REA_JADX_MCP_JAR`、`JAVA_HOME` 持久化。
- Android Studio SDK 路径和 Unity Android 模块路径记录。

验证命令：

```powershell
node --version
java --version
javac --version
adb version
adb devices -l
$env:REA_ADB_PATH
$env:REA_JADX_MCP_JAR
$env:JAVA_HOME
```

退出标准：所有命令正常，`adb devices -l` 至少有一个状态为 `device` 的设备。

### A1 游戏与运行环境侦察

目标：确认游戏的真实包名、版本、引擎、资源结构和基础流程。

步骤：

1. 启动《命运圣契》并进入可操作界面。
2. 获取前台包名和进程号。
3. 记录设备型号、Android 版本、ABI、分辨率和 DPI。
4. 截取启动、主界面、编队、战斗、结算等截图。
5. 录制一段不少于 30 秒的核心流程视频。
6. 抓取包启动阶段和战斗阶段的 logcat。
7. 拉取 base APK 和全部 split APK。
8. 识别 Unity、Cocos、Unreal、Flutter 或其他技术栈。
9. 检查是否需要登录、下载资源或持续联网。

采集命令基准：

```powershell
adb -s $Serial shell dumpsys window | Select-String 'mCurrentFocus'
adb -s $Serial shell dumpsys activity activities | Select-String 'mResumedActivity'
adb -s $Serial shell wm size
adb -s $Serial shell wm density
adb -s $Serial shell getprop ro.product.cpu.abi

adb -s $Serial shell screencap -p /sdcard/fc_main.png
adb -s $Serial pull /sdcard/fc_main.png "$CaptureRoot\01-main.png"

adb -s $Serial shell screenrecord --time-limit 30 /sdcard/fc_flow.mp4
adb -s $Serial pull /sdcard/fc_flow.mp4 "$CaptureRoot\flow-30s.mp4"
```

退出标准：

- 包名和版本号明确。
- 引擎类型明确。
- APK 文件清单和哈希已记录。
- 至少有一条完整核心流程视频。
- 能判断是否强依赖服务器。

### A2 结构与数据侦察

目标：理解我们真正需要重写的系统，而不是复制资源。

步骤：

1. 使用 REA 检查 Android Manifest、类、方法和权限。
2. 检查是否包含 IL2CPP 元数据、AssetBundle、Lua、Cocos 脚本或远程资源清单。
3. 提取 `global-metadata.dat`、`libil2cpp.so` 和关键配置文件。
4. 搜索与角色、技能、关卡、战斗、奖励、编队、存档、登录相关的类型和字符串。
5. 将证据按系统编号，形成“事实、推断、未知”三类记录。
6. 建立机制流程表，不复制反编译代码进入正式项目。

重点问题：

- 战斗状态机有哪些阶段。
- 技能由配置还是脚本驱动。
- 角色属性字段有哪些。
- 关卡和敌人如何配置。
- 奖励和掉落是否在客户端计算。
- 存档是本地、远程还是混合。
- 角色展示使用什么动画和镜头。

退出标准：

- 形成一份经证据支持的系统清单。
- 标注可复刻、需替代、不可复刻的部分。
- 能够用一句话描述完整核心循环。

### A3 玩法规格冻结

目标：把观察结果变成可实现的规则。

交付物：

- 核心循环图。
- 战斗状态机。
- 角色属性表。
- 技能规则表。
- 关卡和敌人配置。
- 战斗结算公式。
- 界面流程图。
- 首版内容清单。

要求：

- 每条规则写明来源：原游戏证据、项目自定或暂定假设。
- 对无法读取的数值，用可调参数替代，不追求虚假的精确。
- 首版角色数量控制在 3 至 6 名，敌人类型控制在 1 至 3 种。
- 首版关卡控制在 1 至 2 个。

退出标准：

- 开发者不查看原游戏也能实现一局战斗。
- 每个系统都有明确输入、输出和失败条件。
- 范围外功能进入 backlog，不进入首版。

### A4 Unity 工程基线

目标：建立能构建到 Android 的最小工程。

步骤：

1. 用 Unity 6 LTS 创建 3D 项目。
2. 启用 URP，建立移动端质量档。
3. 建立 `Boot`、`Main`、`Battle` 场景。
4. 设置 Android 包名、ARM64、IL2CPP 和开发构建。
5. 建立基础目录和程序集划分。
6. 建立日志、异常和版本信息入口。
7. 构建空包并安装到 MuMu。

退出标准：

- 编辑器能进入空场景。
- APK 能安装、启动并显示版本信息。
- logcat 中无应用级持续异常。

### A5 战斗纵向切片

目标：完成首版最重要的一段体验。

最小范围：

- 3 名我方角色。
- 1 组敌人。
- 1 个可重复挑战关卡。
- 每名角色至少 1 个普攻和 1 个技能。
- 血量、伤害、受击、死亡、胜负。
- 敌方基础行为。
- 战斗结束奖励。

实施顺序：

1. 定义数据结构和战斗事件。
2. 完成无 UI、无 3D 的确定性战斗内核。
3. 接入最小 3D 角色和站位。
4. 接入技能、受击、死亡表现。
5. 接入战斗 UI 和日志。
6. 接入结算和奖励。
7. 进行编辑器测试和模拟器测试。

退出标准：

- 从主界面进入战斗并完成结算。
- 战斗结果受编队和技能影响。
- 同一随机种子得到可复现结果。
- 连续完成 3 场战斗无阻塞。

### A6 主界面、编队和存档

目标：把单场战斗变成可重复的产品闭环。

范围：

- 主界面入口。
- 角色列表和角色详情。
- 3 人编队。
- 关卡选择。
- 奖励和货币。
- 版本化本地存档。
- 战斗结果回到主界面。

退出标准：

- 修改编队后进入战斗，队伍数据正确。
- 获得奖励后重启应用，奖励仍在。
- 存档损坏时可以安全回退或重新开始。

### A7 表现、性能和安卓验收

目标：把原型变成可稳定游玩的首版。

工作项：

- 统一角色材质和灯光。
- 增加技能镜头、命中停顿、屏幕震动和基础音效。
- 控制同屏粒子数量。
- 检查加载时间和包体。
- 适配 16:9 和更宽屏幕。
- 测试暂停、切后台和恢复。
- 测试低内存和长时间运行。

退出标准：

- Android 上稳定完成完整核心循环。
- 无明显 UI 溢出、黑屏、输入失效或崩溃。
- 性能达到预设预算，具体数字在设备基线后确定。

## 3. 技术栈

| 层 | 选择 | 说明 |
| --- | --- | --- |
| 引擎 | Unity 6 LTS | 3D、动画、UI、Android 构建 |
| 渲染 | URP | 移动端可控、易于优化 |
| 脚本 | C# | Unity 主语言 |
| 数据 | ScriptableObject 优先，JSON 辅助 | 编辑期配置简单，运行时可序列化 |
| 存档 | 版本化 JSON | 可读、可迁移、易测试 |
| UI | Unity UI 或 UI Toolkit，二选一并锁定 | 首版避免混用两套复杂体系 |
| 输入 | Unity Input System 或直接触摸适配层 | 以移动端点击为主 |
| 音频 | Unity AudioSource 和混音组 | 首版不引入复杂中间件 |
| 构建 | Unity Android Build Support | IL2CPP + ARM64 |
| 分析 | ADB、REA、JADX、7-Zip 可选 | 只用于研究，不进入游戏运行时 |
| 版本控制 | Git + Git LFS | 大模型、音频和视频使用 LFS |

## 4. Unity 架构

### 4.1 分层

```text
Presentation
  UI、3D 角色视图、动画、特效、相机、音频

Application
  场景流程、战斗编排、输入映射、存档调用

Domain
  角色、技能、伤害、状态、回合或时间轴规则、奖励

Data
  ScriptableObject、JSON 配置、内容目录

Infrastructure
  文件、日志、本地化、时间、随机数、平台服务
```

原则：

- Domain 不引用 UnityEngine，便于确定性测试。
- Presentation 只消费战斗事件，不直接改数值。
- 数据定义和运行时实例分离。
- 所有随机行为走统一随机源。

### 4.2 建议目录

```text
Assets/
  Scenes/
    Boot.unity
    Main.unity
    Battle.unity
  Scripts/
    Core/
      App/
      Events/
      Save/
      Services/
    Battle/
      Domain/
      Runtime/
      Presentation/
    Content/
      Characters/
      Skills/
      Enemies/
      Stages/
    UI/
  Art/
    Characters/
    Environments/
    VFX/
    UI/
  Audio/
  Prefabs/
  Settings/
  Tests/
    EditMode/
    PlayMode/
```

### 4.3 核心模块

**Boot**

- 初始化配置和存档。
- 检查版本和资源完整性。
- 进入主界面。

**ContentCatalog**

- 按 ID 提供角色、技能、敌人和关卡定义。
- 启动时校验重复 ID 和缺失引用。

**SaveService**

- 读写版本化存档。
- 写入使用临时文件后原子替换。
- 提供迁移和损坏恢复。

**BattleKernel**

- 输入：编队、敌人组、关卡、随机种子。
- 输出：事件序列和最终结果。
- 不依赖场景、动画和帧率。

**BattleRunner**

- 推进战斗时间或回合。
- 触发事件。
- 处理暂停、倍速和跳过。

**BattlePresenter**

- 消费事件，播放动画、特效、飘字、镜头和音效。
- 不决定战斗结果。

**RewardService**

- 依据关卡结果生成奖励。
- 更新存档。

## 5. 战斗模型的可变设计

在确认原游戏战斗类型前，不把核心固定成单一模式。初始接口应支持：

- 回合驱动。
- 时间轴驱动。
- 自动攻击加手动技能。
- 半即时行动条。

统一定义：

```text
BattleCommand
  actorId
  skillId
  targetIds
  issuedAt

BattleEvent
  type
  sourceId
  targetIds
  values
  timestamp

BattleOutcome
  victory
  survivingActors
  statistics
  randomSeed
```

不管原游戏采用哪种模式，表现层都只监听 `BattleEvent`。这样侦察结论只会替换 `BattleRunner` 的调度方式，不会重写整个 UI 和表现层。

## 6. 数据模型

### CharacterDefinition

- ID、显示名、定位。
- 基础生命、攻击、防御、速度。
- 普攻 ID、技能 ID。
- 模型、头像、动画控制器。
- 初始等级和成长参数。

### SkillDefinition

- ID、名称、描述。
- 目标规则。
- 消耗、冷却或能量。
- 伤害公式标识。
- 状态效果。
- 动画、特效和音效引用。

### EnemyDefinition

- ID、生命、攻击、防御、速度。
- 行为规则。
- 模型和表现引用。

### StageDefinition

- ID、名称、推荐等级。
- 敌人组。
- 胜利和失败条件。
- 奖励表。
- 背景和镜头配置。

### SaveData

- 存档版本。
- 玩家货币和资源。
- 角色列表和等级。
- 当前编队。
- 关卡完成记录。
- 设置项。

## 7. 内容管线

首版采用最小内容管线：

1. 新建 ScriptableObject 定义。
2. 填入角色、技能、敌人和关卡。
3. 由 ContentCatalog 启动校验。
4. 在开发构建中显示缺失 ID 和无效引用。
5. 通过一个测试场景直接加载指定关卡。

不做首版编辑器工具，等配置数量超过手工维护成本再补。

## 8. 测试方案

### 单元测试

- 伤害公式。
- 技能目标选择。
- 状态叠加和过期。
- 死亡和胜负判定。
- 奖励生成。
- 存档序列化和迁移。

### 集成测试

- 从编队数据启动战斗。
- 事件序列驱动表现层。
- 结算写回存档。

### 设备测试

- MuMu 模拟器。
- 至少一台真实 Android 设备。
- 横屏和不同纵横比。
- 切后台恢复。
- 冷启动和重复进入战斗。

### 可复现性

- 战斗使用显式随机种子。
- 同一输入和种子必须产生相同事件序列。
- 性能测试固定场景、角色数量和特效预算。

## 9. 构建与发布流程

### 开发构建

- Scripting Backend：IL2CPP。
- Architecture：ARM64。
- Development Build：开启。
- 保留日志和调试符号。

### 首版候选构建

- 关闭 Development Build。
- 固定 Unity 和包依赖版本。
- 记录构建哈希和源提交。
- 输出 APK 到 `build/`。
- 在干净模拟器安装验证。

### 版本号

使用三段版本：

```text
0.1.0  环境和分析
0.2.0  战斗纵向切片
0.3.0  主界面、编队和存档
0.4.0  表现和性能
1.0.0  首版私用可玩版本
```

## 10. 分析产物规范

```text
analysis/
  captures/
    YYYYMMDD-HHMMSS-main.png
    YYYYMMDD-HHMMSS-battle.mp4
    YYYYMMDD-HHMMSS-logcat.txt
  apk/
    device-pull-01/
  il2cpp/
    global-metadata.dat
    libil2cpp.so
  notes/
    01-device.md
    02-core-loop.md
    03-battle.md
    04-ui-map.md
    05-evidence-index.md
```

每条结论记录：

- 日期和时间。
- 设备序列号、型号和 Android 版本。
- 游戏版本和 APK 哈希。
- 截图或视频文件名。
- 证据类型：直接观察、日志、静态分析、推断。
- 可信度：确认、较可信、未知。

## 11. 里程碑

### M0 环境基线

完成条件：ADB、JDK、REA、Unity 构建链路全部验证。

### M1 侦察完成

完成条件：包名、引擎、核心循环、战斗类型、联网依赖和 APK 结构明确。

### M2 可战斗原型

完成条件：无 UI、无美术也能跑完确定性战斗。

### M3 纵向切片

完成条件：主界面、编队、战斗、结算、存档完整闭环。

### M4 Android 可玩版

完成条件：APK 在模拟器和真机稳定运行，性能和体验达到验收线。

### M5 内容扩展

完成条件：新增角色、技能和关卡不修改核心代码。

## 12. 验收门

每个里程碑必须同时满足：

- 能构建。
- 能启动。
- 能完成对应闭环。
- 有自动化测试或明确的手工测试记录。
- 日志无新增持续异常。
- 文档与代码一致。
- 不包含原游戏未授权资产。

任何门未通过，不进入下一阶段。

## 13. 决策记录

| 日期 | 决策 | 理由 |
| --- | --- | --- |
| 2026-10-24 | 使用 Unity 6 LTS | Android 3D 能力、角色动画和构建工具成熟 |
| 2026-10-24 | 首版做纵向切片 | 以最小成本验证核心体验 |
| 2026-10-24 | 战斗核心与表现层分离 | 适应未知战斗类型并支持确定性测试 |
| 2026-10-24 | 原资源仅用于本地分析 | 避免最终构建混入未授权素材 |
| 2026-10-24 | 本地存档优先 | 保证离线可玩和可测试 |

## 14. 近期执行清单

- [ ] 配置 ADB PATH 和 `REA_ADB_PATH`。
- [ ] 启动 MuMu，确认 `adb devices -l` 出现设备。
- [ ] 获取《命运圣契》包名和版本。
- [ ] 抓取首批截图、视频、日志。
- [ ] 安装并验证 REA。
- [ ] 拉取 APK 和 split APK。
- [ ] 识别引擎和 IL2CPP。
- [ ] 写 `analysis/notes/02-core-loop.md`。
- [ ] 冻结首版范围。
- [ ] 创建 Unity 工程和空 APK。

## 15. 方案调整条件

出现以下任一情况时，重新评审实施方案：

- 游戏不是 Unity 3D。
- 游戏无法在 MuMu 正常运行。
- 核心玩法强依赖服务器。
- 取证结果与当前产品假设冲突。
- 首版范围无法在可接受时间内完成。
- 目标设备性能不足。

调整时先更新文档和决策记录，再修改代码。
