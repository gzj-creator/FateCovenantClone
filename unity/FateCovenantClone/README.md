# Unity 原型工程

固定编辑器为 Unity `6000.0.85f1`，URP `17.0.4`，uGUI `2.0.0`。当前已交付工程配置和运行源码，尚未用真实 Unity 完成导入、编译、场景生成、截图或 APK 构建。完整状态见 [开发状态](../../docs/05-development-status.md)。

## 当前内容

| 目录 | 责任与状态 |
| --- | --- |
| `Assets/Scripts/Battle/Domain/` | 无 UnityEngine 依赖的确定性战斗，程序集 `FateCovenant.Battle`；37 项独立断言通过 |
| `Assets/Scripts/Game/` | 图鉴、3 人编队、固定关卡、战斗快照、一次性奖励、版本化存档，程序集 `FateCovenant.Game`；8 个独立场景通过 |
| `Assets/Scripts/Presentation/` | Boot/Main/Stage/Battle 流程、图鉴/队伍/关卡/结算 UI、程序化人物/动作、基础效果、RuntimeSmoke；Unity 2022 Player API 兼容编译通过，待 Unity 6 编译与实际画面验证 |
| `Assets/Editor/ProjectAutomation.cs` | Setup/Test/Smoke/BuildAndroid/BuildWindows 自动化入口；待真实编辑器执行 |
| `Packages/manifest.json` | 固定直接包版本，实际包解析及锁文件待 Unity 导入 |
| `ProjectSettings/ProjectVersion.txt` | 固定编辑器版本，其余设置由 Setup 生成 |

当前没有手写场景文件。`ProjectAutomation.Setup` 创建 `Boot`、`Main`、`Battle` 和移动端 URP 资产，在 Boot 放入 `GameBootstrap`，配置竖屏、Android 包名 `com.fatecovenant.clone`、IL2CPP 和 ARM64。程序化人物、武器和声音由项目源码生成，未导入原游戏资源；这些占位内容不等于正式美术交付。

Stage 是 Main 场景中的独立页面，展示固定敌队、我方队伍和胜利奖励，再进入 Battle。`RuntimeSmoke.Begin` 已实现隔离 save/report/captures、三场普通/倍速/跳过、最终事件状态核对与 16:9/20:9 界面/相机检查，尚未运行。资产来源为原创程序几何、原创关节建模/动作、原创合成音效和 Unity 随附 `LegacyRuntime.ttf`；正式角色仍待建模/绑定/资产验收。

## 续接命令

在项目根目录 `F:\projects\FateCovenantClone` 使用 PowerShell。先安装匹配编辑器与 Android SDK/NDK/OpenJDK 模块，或用 `-EditorPath` 指定已核实的绝对路径。安装脚本下载缓存位于 `.toolchain/downloads/`，默认安装目录为 `.toolchain/Unity/6000.0.85f1/`；下载与安装成功均须查验，不代表后续运行通过。

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\install-unity-toolchain.ps1 -Action Download -Components All
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\install-unity-toolchain.ps1 -Action Install -Components All
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\unity-project.ps1 -Action Discover
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\unity-project.ps1 -Action Setup
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\unity-project.ps1 -Action Test
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\unity-project.ps1 -Action Smoke
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\unity-project.ps1 -Action BuildAndroid
```

批处理前关闭已打开的同工程编辑器，避免 UnityLockfile 冲突。Smoke 保留图形上下文；Setup/Test/Build 走无图形批处理。结果日志在 `analysis/test-runs/unity/`，Android 目标输出为 `builds/android/FateCovenantClone.apk`。构建成功后还需通过指定 ADB 设备 `127.0.0.1:16416` 安装、启动并检查完整流程与 logcat；当前尚无这部分验收结果。

不依赖 Unity 的验证入口：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\run-battle-core-tests.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\run-game-core-tests.ps1
```

另有 `tools/check-unity-runtime-compile.ps1 -ManagedPath <真实 Player 的 Managed 目录>`，按三份 asmdef 分别编译运行源码。当前通过的引用来自本机既有 Unity `2022.3.62f3c1` Player，报告在 `analysis/test-runs/runtime-compile/`；它不包含 Editor 源码，不代表 Unity 6、实际渲染、IL2CPP 或 Android 通过。
