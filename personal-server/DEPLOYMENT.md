# 个人服务器部署

本目录包含个人服务器运行所需的代码、配置、表数据、协议 schema 和初始化种子。默认资产从 `personal-server/assets/` 读取，不再依赖仓库中的 `analysis/`、`agent/workflow/` 或已删除的 `unity/` 目录。客户端交付物仍是仓库 `apk/` 下的隔离 APK。

## 环境

- Node.js 26 或更高版本（`package.json` 要求 `>=26`）。
- npm，用于按 `package-lock.json` 安装锁定的 `protobufjs@8.8.1`。
- 默认服务只监听 `127.0.0.1`。

公网启动使用可读的 `config/public-server.json`：

```powershell
npm run start:public --prefix .\personal-server
```

配置中的 `servers` 数组是可扩展列表；当前第一项 ID 为 `1`、名称为“命运一服”、
游戏地址为 `140.143.142.251:19090`。后续增加独立区服时向该数组追加配置即可，
区服列表接口会返回全部条目并按 ID 响应登录选择。该配置让 SDK、区服列表、启动更新
和游戏网关监听 `0.0.0.0`，Web 管理端 `18883` 继续只监听 `127.0.0.1`。服务器安全组和本机防火墙必须放行 TCP
`18880`、`18881`、`18882`、`19090`；`18883` 保持不对公网开放。

如使用 Linux UFW，公网四端口的最小放行命令为：

```bash
sudo ufw allow 18880/tcp
sudo ufw allow 18881/tcp
sudo ufw allow 18882/tcp
sudo ufw allow 19090/tcp
```

## 首次启动

从项目根目录执行：

```powershell
npm ci --prefix .\personal-server --ignore-scripts --no-audit --no-fund
npm test --prefix .\personal-server
npm start --prefix .\personal-server
```

也可以在 `personal-server/` 中直接执行：

```powershell
npm ci --ignore-scripts --no-audit --no-fund
npm start
```

首次启动会在 `personal-server/runtime.local-only.data/` 创建运行目录。该目录包含 SQLite 存档、SDK 会话、管理密钥和运行日志，属于本机私有数据，不应提交 Git 或随分发包公开。已有该目录时，服务会继续使用其中的数据。

## 端口

| 服务 | 默认端口 | 环境变量 |
| --- | ---: | --- |
| SDK | 18880 | `FC_SDK_PORT` |
| 区服列表 | 18881 | `FC_SERVER_LIST_PORT` |
| 启动/更新 | 18882 | `FC_STARTUP_PORT` |
| 游戏网关 | 19090 | `FC_GAME_PORT` |
| Web 管理 | 18883 | `FC_ADMIN_PORT` |

每个变量接受 `0` 到 `65535` 的整数。值 `0` 表示由操作系统分配空闲端口；实际端口写入 `runtime.local-only.data/server.local-only.json` 的 `boundPorts`，区服列表也会广播实际游戏端口。

常用覆盖示例：

```powershell
$env:FC_LOCAL_DATA = 'D:\fc-server-data'
$env:FC_SDK_PORT = '0'
$env:FC_SERVER_LIST_PORT = '0'
$env:FC_STARTUP_PORT = '0'
$env:FC_GAME_PORT = '0'
$env:FC_ADMIN_PORT = '0'
npm start --prefix .\personal-server
```

启动成功后，可读取 `server.local-only.json` 核对五个实际端口。管理页完整地址保存在 `admin-url.local-only.txt`，其中包含访问密钥；不要把该文件内容粘贴到日志、截图或公开记录。

## 运行状态

运行目录中的主要文件：

- `game.local-only.sqlite`：游戏、钱包及活动持久化数据。
- `sdk-sessions.local-only.json`：SDK 会话。
- `admin-key.local-only.txt`：Web 管理访问密钥。
- `admin-url.local-only.txt`：带密钥的管理页地址。
- `server.local-only.json`：进程、开服时间、活动模式及实际端口。
- `events.jsonl`：结构化服务日志。

停止服务时向 Node 进程发送 `Ctrl+C` 或 `SIGTERM`。不需要删除运行目录；删除它会丢失存档和管理密钥。

## 资产覆盖

默认使用目录内的 `assets/`。如需用另一套同结构资产启动，可设置绝对路径：

```powershell
$env:FC_ASSET_ROOT = 'D:\fc-server-assets'
npm start --prefix .\personal-server
```

资产内容与查找规则见 [assets/README.md](assets/README.md)。

## 独立部署验证

以下测试会把完整 `personal-server/` 复制到系统临时目录，排除原运行数据和仓库分析目录，并使用随机端口启动五个服务：

```powershell
npm run test:deployment --prefix .\personal-server
```

测试会验证服务启动、实际端口、区服响应中的游戏端口、SQLite 与管理密钥创建以及正常关闭。它验证服务目录的自包含性，不代表 APK 已完成新的端到端验收。

## APK 边界

本次服务端审查没有修改 APK。现有可用快照和 `SubDownloadFinish=1` 前置条件仍以仓库 `apk/README.md` 为准；仅凭服务端组件测试不能宣称 APK 登录、大厅或全部玩法已经验收。
