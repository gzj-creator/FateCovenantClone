# 开发状态与续接

> 2026-10-25 工作切换：用户本轮选择现有 APK 的个人服务器兼容分析，见 [当前进度](../analysis/notes/07-private-client-feasibility.md)。本页保留 Unity 旧路线与原验收状态，本轮不继续其安装/构建。

> 更新日期：2026-10-25（Asia/Singapore）
> 范围与验收依据：[04-system-roadmap.md](04-system-roadmap.md)；当前原型规则：[03-first-slice-spec.md](03-first-slice-spec.md)

当前交付是 R0–R2 的原型源码和独立 C# 验证。Unity 编辑器尚未实际打开工程，没有运行画面、成功构建的 APK 或 MuMu 安装运行证据；R0、R1、R2 均不能标记为验收完成。接下来优先打通真实 Unity 和设备链路，不等待成品号，也不继续用新手号升级解锁替代开发。

## 1. 交付与验证分界

| 范围 | 源码已交付 | 已有验证 | 尚缺验收 |
| --- | --- | --- | --- |
| R0 工程基线 | Unity 版本/包清单、程序集、URP/场景/Android 设置自动化、构建入口和日志路径 | PowerShell 脚本解析检查无错误；官方版本元数据已记录 | 实际编辑器导入与包解析、Setup 生成场景、Unity 编译、Android 构建/安装/启动 |
| R1 战斗切片 | 3v3 确定性内核、预结算事件播放、程序化关节角色/动作、竞技场/镜头/飘字/弹道/命中环、倍速/跳过/胜负与 MVP、RuntimeSmoke | 战斗 37 项断言与 20 个种子回归通过；Unity 2022 Player API 运行程序集兼容编译通过 | Unity 6 图形运行、Smoke 实际执行、连续三场、事件与画面一致、倍速/跳过、竖屏适配、正式角色与完整技能演出、设备性能 |
| R2 本地循环 | 6 项图鉴/3 名拥有、属性/技能/获取来源、程序化 3D 查看、三人站位交换、独立固定关卡页、战斗票据/奖励、版本化本地存档 | 独立游戏逻辑编译及 8 个场景通过；运行程序集兼容编译通过 | UI 交互和布局、Unity 文件 API/暂停恢复、设备重启后存档、首次可玩 APK；后续角色替换尚缺 |

程序化人物含躯干/头/四肢关节、披风和武器形状，源码实现基础待机、位移、挥击、受击闪白与倒地。它们是流程占位资产，不表示正式角色建模、材质、绑定、动画、头像或角色专属技能特效已完成。当前场景与效果也未经截图检查，不据源码推定画面正确或性能达标。

## 2. 当前实现

### 战斗领域层

位置：`unity/FateCovenantClone/Assets/Scripts/Battle/Domain/`，程序集 `FateCovenant.Battle`，不引用 UnityEngine。

- 行动按速度降序，同速先我方后敌方，再按队内阵位；单体目标为最低生命比例存活单位，比例相同选靠前阵位。
- 基础伤害为 `max(1, round(ATK * 2.6) - floor(DEF * 0.5))`，先对攻击乘积取整再减防。技能倍率、战意倍率、随机浮动和暴击倍率作用于该基础值，最终取整且最低 1；`round` 使用 C# 默认中点舍入。
- 实现伤害、治疗、护盾、怒气、战意、死亡和胜负；没有嘲讽、加攻、控制、完整被动、天极或法阵规则。精确原游戏规则仍待成品号证据。
- 同一模拟器重复 `Run()` 会重置战斗状态和随机源；场上实例使用 `ally:0` / `enemy:0` 等 ID，与角色定义 ID 分离。
- 事件包含剩余生命/护盾、护盾吸收量和行动者怒气/战意，表现层无需解析状态字符串。

以上是项目自定原型规则，不是已恢复的原游戏机制。

### 图鉴与本地循环

位置：`Assets/Scripts/Game/`，程序集 `FateCovenant.Game`，同样不引用 UnityEngine。

- 图鉴登记 6 项，3 名初始角色已拥有且可部署；另 3 名是未拥有的敌方图鉴项，本切片没有获得方式。技能说明读取实际定义，没有宣传未实现的嘲讽/加攻。
- 当前 UI 提供按名称固定排序、全部/已拥有筛选、属性与技能说明、来源和可旋转的程序化模型。底层保留可上阵、模型/技能状态字段；正式美术均标记待完成。
- 编队必须正好 3 名互不重复的已拥有可部署角色；当前界面只交换初始三人的站位，没有额外可用角色替换。站位顺序会影响同生命比例时的选敌，修改会保存。
- 固定关卡 ID 为 `arena_01`，已有独立 `Stage` 页面，展示敌队程序化模型、我方队伍与胜利奖励。主界面/队伍页先进入关卡页，再由 Challenge 开战；目前只有一个关卡。首场种子为 12345，后续按挑战序号推进；胜利奖励为项目自定的 100 金币。
- 开战先保存票据、双方 ID 顺序、种子和规则版本；未结算战斗可在重启后恢复。奖励以保存的票据重新模拟，不信任界面传回的结果，重复确认不会再次入账。
- 存档当前使用版本 1 的 `profile.fcsave` 记录格式，包含校验和、修订号、文件锁、暂存写入与原子替换；可从备份或已持久化的中断写入恢复，损坏文件另存保留。遇到更高存档版本或未知规则版本时保留文件并报错。没有旧版本迁移实现。旧实施方案的 JSON 仅是早期选择，不代表当前格式。

当前无成长系统，快照只冻结已有静态规则所需的 ID/顺序/种子/版本；后续接入养成时需冻结完整解析属性和技能配置。

### Unity 表现与自动化

位置：`Assets/Scripts/Presentation/` 和 `Assets/Editor/ProjectAutomation.cs`。

`GameBootstrap` 管理 Boot → Main → Stage → Battle、图鉴/队伍页面及结算返回。图鉴和战斗使用同一角色定义；战斗事件通过实例 ID 定位程序化人物。当前 UI 文案为英文占位，最终内容与视觉尚需校正。

版本固定 Unity `6000.0.85f1`、URP `17.0.4`、uGUI `2.0.0`。`ProjectVersion.txt` 和 `manifest.json` 已存在；实际包解析及锁文件待编辑器生成。Setup 将创建 Boot/Main/Battle 场景和 URP 资产，配置竖屏、IL2CPP、ARM64、Android 包名 `com.fatecovenant.clone`、应用版本 `0.2.0`。这些目前是待执行的配置代码。

`RuntimeSmoke.Begin` 已落盘，使用独立的存档、JSON 报告和截图目录。源码覆盖三场普通/倍速/跳过播放、最终 HP/护盾/怒气/战意/死亡状态与事件核对、重复奖励检查、重新打开存档，以及 540×960 和 540×1200 的界面文字/相机非空/角色入镜检查。Smoke 入口已编译，尚未运行，没有对应成功报告或实际截图；自动边界检查也不能替代对截图的人工审阅。

### 资产来源清单

| 资产类别 | 当前来源 | 交付限制 |
| --- | --- | --- |
| 场景与基础特效 | 项目原创程序几何、线条、材质参数与 Shader 调用，位于 `ArenaView.cs` / `GameBootstrap.cs` | 需实际渲染、构图与性能验收 |
| 人物、披风、武器与动作 | 项目原创程序化关节建模、网格与动作，位于 `ProceduralActor.cs` | 占位资产；正式角色建模、材质、绑定、动画、头像和技能资产待制作及验收 |
| 命中与技能提示音 | 项目原创波形合成音效，位于 `ArenaView.Tone` | 占位声音，尚未实际试听与混音验收 |
| 界面字体 | Unity 随附 `LegacyRuntime.ttf`，由 `Resources.GetBuiltinResource<Font>` 加载 | 通过 Unity 随附资源机制使用；未新增外部字体文件，最终构建随对应 Unity 许可分发 |

未将原游戏模型、纹理、动画、音频或界面资产导入 `unity/`。原游戏 APK、截图和录像仅保留在 `analysis/` 作本地分析证据，不列为最终构建资产。

## 3. 独立测试证据

在项目根目录执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\run-battle-core-tests.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\run-game-core-tests.ps1
```

战斗结果：37 项断言通过，覆盖普通/暴击伤害、治疗目标与上限、完整/部分护盾吸收、战意累积/消耗、同速顺序、死亡后重新选敌、败局、同实例重复 Run、镜像角色与非法阵容。默认种子 12345 结果保持 6 回合、我方 2 人存活、3979 总伤害、72 条事件；种子 1–20 全胜，战斗长度 6–7 回合。日志：[battle-core/last-run.txt](../analysis/test-runs/battle-core/last-run.txt)。

游戏逻辑结果：8 个场景通过，覆盖图鉴/技能文案、编队与战斗输入、快照/中断/一次性奖励、并发会话与写失败、损坏备份恢复、暂存写入恢复、更高存档及未知规则版本保护、严格输入与校验和。日志：[game-core/last-run.txt](../analysis/test-runs/game-core/last-run.txt)，每次独立产物保留在该目录的 `run-*` 子目录。

上述测试由本机 C# 编译器直接执行，不包含 UnityEngine 相关源码。它们不验证 Shader、Canvas、动画、实际声音、Mono/IL2CPP 平台文件行为、帧率或设备输入。

运行程序集兼容编译也已通过：`tools/check-unity-runtime-compile.ps1` 使用本机 `F:/projects/Unity-Project/StarfallChronicle/Builds/StarfallChronicle_Data/Managed` 中来自 Unity `2022.3.62f3c1` Player 的真实托管程序集，按 asmdef 引用关系分别编译 `FateCovenant.Battle`、`FateCovenant.Game`、`FateCovenant.Presentation`，包括 RuntimeSmoke。报告：[runtime-compile/report.json](../analysis/test-runs/runtime-compile/report.json)，日志：[runtime-compile/last-run.txt](../analysis/test-runs/runtime-compile/last-run.txt)。这里只借用 API 引用，没有导入该 Player 的资产；它不编译 Editor 源码，不验证 Unity 6、包解析、场景、渲染、IL2CPP 或 Android。

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\check-unity-runtime-compile.ps1 -ManagedPath 'F:\projects\Unity-Project\StarfallChronicle\Builds\StarfallChronicle_Data\Managed'
```

## 4. 工具链状态

已核实官方 Unity `6000.0.85f1` 为 LTS，revision 为 `ee7790f1426a`。元数据保留在 [official-release-6000.0.85f1.json](../analysis/test-runs/unity/official-release-6000.0.85f1.json)，本机探测/脚本解析/下载状态见 [toolchain-status.json](../analysis/test-runs/unity/toolchain-status.json)。

当前旧 `D:/Software/2022.3.62f3c1/Editor/Unity.exe` 和 `D:/Software/Unity/Unity Hub/Unity Hub.exe` 路径失效；标准 Hub 目录和工作区 `.toolchain` 目录也没有已确认可运行的固定版本编辑器。存在许可证文件不代表编辑器或许可证验证已通过。默认官方下载地址在当前网络重定向至地区域名后返回 HTTP 404，官方 CDN 尝试出现超时；尚无下载、安装或编辑器启动完成证据。

安装入口为 `tools/install-unity-toolchain.ps1`，校验官方版本元数据、文件长度/完整性和安装包签名，默认下载到 `.toolchain/downloads/`、安装到 `.toolchain/Unity/6000.0.85f1/`。工作区内安装不应修改已有的其他 Unity 版本。若下载路径仍不可用，继续核实可访问的官方来源或使用已安装的同版本编辑器，不能把失败记录记为工具链完成。

## 5. 准确续接顺序

1. 取得并验证 Unity `6000.0.85f1` 及其 Android Build Support、SDK/NDK/OpenJDK。可用安装脚本 Download/Install；已有同版本编辑器则传入绝对 `-EditorPath` 或设置 `FATE_UNITY_EDITOR`。不要静默切到 Unity 2022 或其他 6000.x 版本。
2. 用真实编辑器打开当前工程，核对包解析与编译错误；执行 Discover、Setup、Test。Setup 应生成 Boot/Main/Battle、URP 设置与 Android 参数，Test 检查配置，不等于运行验收。批处理前关闭同工程编辑器，避免锁冲突。
3. 执行 Smoke 并检查运行报告和截图。必须实际查看主界面/图鉴/队伍/战斗/技能/结算，确认非空、角色与文字无重叠、受击和血条一致、普通/倍速/跳过结果一致、三场连续挑战与重启保存正确；截图不能仅有菜单而遗漏战斗。Smoke 使用图形上下文，不能用无图形运行替代视觉验证。
4. 执行 BuildAndroid，核对 IL2CPP/ARM64、构建报告及 APK 真实存在；构建成功仍不代表安装或设备运行通过。目标输出为 `builds/android/FateCovenantClone.apk`。
5. 通过 ADB `-s 127.0.0.1:16416` 安装并启动 `com.fatecovenant.clone`，采集截图/录像与 logcat 到 `analysis/`，验证图鉴 → 站位调整 → 战斗 → 奖励 → 返回 → 重启的完整闭环、连续三场、暂停恢复及 16:9–20:9 竖屏构图；有问题时先修复再标记阶段完成。
6. 编辑器与设备基线通过后，制作首名正式自制角色及完整技能演出，再覆盖其他角色；后期规则采集与这部分开发并行，不等待完整角色资料。

常用入口：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\install-unity-toolchain.ps1 -Action Download -Components All
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\install-unity-toolchain.ps1 -Action Install -Components All
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\unity-project.ps1 -Action Discover
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\unity-project.ps1 -Action Setup
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\unity-project.ps1 -Action Test
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\unity-project.ps1 -Action Smoke
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\unity-project.ps1 -Action BuildAndroid
```

Unity 执行日志及动作结果放在 `analysis/test-runs/unity/`；Smoke 运行目标证据在其 `smoke/` 子目录。只有看到对应成功结果并实际检查截图、设备流程后，才更新本页的验收状态。

## 6. 原游戏侦察续接

侦察暂保持第 3 章第 5 关地图检查点：`analysis/captures/094-continue-journey.png`。不依据旧截图继续盲点；需要续接时先截图，按明确手势操作，剧情允许跳过。圣器/星火事实与旧摘要纠错见 `analysis/notes/06-relic-and-star.md`。

用户将准备已解锁功能的成品号，后续通过正常界面和战斗核实技能、阵容、养成、天极与法阵；这些尚未确认的规则不写入已知机制，也不阻塞当前工程与基础表现开发。
