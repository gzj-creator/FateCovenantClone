# T1：设备网络恢复因缺失 ADB reverse 提前中断

日期：2026-11-18（Asia/Shanghai）

触发环境：部署梦中小屋修复后，启动 MuMu 实例 2（`127.0.0.1:16448`）与隔离客户端 `com.jzyx.ps`。

## 现象与触发

- `tools/local-server-device.ps1 -Action Status` 报 `Recorded network setup is incomplete`。
- `-Action Setup` 要求先执行 `Restore`。
- `-Action Restore` 在设备上当时并不存在 `tcp:18880` reverse 时输出 `adb.exe: error: listener 'tcp:18880' not found`并以非零状态退出，因此后续的状态文件归档没有执行。
- 现场核对：`adb reverse --list` 为空，`iptables -t nat -S FC_LOCAL_NAT` 报链不存在，说明网络资源已清掉，失败发生在“删除不存在的资源”和“归档状态”之间。
- 证据状态文件：`analysis/experiments/private-server-20261025/p3/network-state.local-only.json`。

## 根因

`RemoveLoopbackSetup()` 和 `RemoveLegacySetup()` 直接在 `$ErrorActionPreference = 'Stop'` 下调用 `adb reverse --remove`。Windows PowerShell 会把 ADB 的 stderr 转为可终止错误，即使该端口本来就不存在；于是 `RemoveRecordedSetup()` 在执行 `Move-Item` 归档状态前中断。

恢复操作应对“资源已经不存在”具有幂等性；这里把已经是目标状态的 reverse 当成了致命错误。

## 修复范围

- 新增去除 reverse 的局部容错函数，两条 `Restore` 路径共用。
- 不改包名、UID、iptables 映射、ADB serial 或客户端数据。
- 恢复后仍执行实际链、reverse 和状态文件核对。

## 验证等级

| 级别 | 内容 | 结果 |
| --- | --- | --- |
| 组件 | PowerShell 语法与静态检查 | 通过 |
| 设备 | 在 reverse 不存在时执行 `Restore`，然后 `Setup` | `Restore` 退出 0 并归档状态；`Setup` 退出 0，五条 NAT 和四条 ADB reverse 全部恢复 |
| 部署 | 重新建立本地端口、reverse 和客户端启动 | 隔离客户端 `com.jzyx.ps` 启动到 QuickSDK 账号登录页 |

## 防复发措施

- 所有设备清理子步骤必须可重复执行，缺失 chain、rule、reverse 或 state 不能阻止后续归档。
- `Restore` 验收同时检查命令退出码、实际转发规则已清除、状态文件已移入 `.stopped-*`；不能只看 ADB 将单个话未找到误判为整体失败。
- 下次遇到 `Recorded network setup is incomplete`，先按 T1 检查是否仅为资源已清但状态未归档，再重建。

## 未验证项与边界

- 修复后状态文件为 `network-state.local-only.json`，五条 NAT 与 18880/18881/18882/19090 四条 reverse 已核对。
- 本项不解决 MuMu 未启动、root 不可用或包未安装；这些情况仍应明确报错。
