# 命运二服生产部署

## 生产边界

- 发布包只包含代码、静态资源、协议表、初始化模板和版本化配置。
- SQLite、SDK 会话、管理密钥、日志和备份只写入外部持久卷。
- 源码树和容器镜像中不得包含 `*.sqlite`、WAL、SHM 或运行目录。
- 新服开服时间和活动窗口由 `config/public-server.json` 与
  `config/activity-calendar.json` 共同确定。两者不一致时服务拒绝启动。
- 同一外部持久卷绑定到固定的 `launchProfileId`。配置与卷内档案不一致时服务拒绝启动，
  不会把旧服数据自动改写成新服数据。
- 发布镜像是不可变制品；修改配置后重新构建并用同一个外部卷重建容器。

## 当前发布档案

| 项目 | 值 |
| --- | --- |
| 区服 | ID `2`，命运二服 |
| 角色 | `100002` |
| 开服时间 | `2026-11-11T00:00:00+08:00` |
| 活动参考服开服 | `2026-10-01T00:00:00+08:00` |
| 活动模板锚点 | `2026-10-24T05:00:00+08:00` |
| 发布档案 | `public-realm-2-20261110` |
| 游戏入口 | `140.143.142.251:19090` |

首次建库会把登录模板中模块 92 和模块 183 的绝对活动时间，从活动模板锚点整体平移到
新服开服时间。活动表中的 `world_time` 则按
`目标服开服 + (world_time - 活动参考服开服)` 换算；`refer_day/server_day` 始终从目标服
开服日计算。开服时刻对应第 1 天，活动日边界为 `05:00 +08:00`。

白绫 `1102010` 的目标服窗口为 `2026-11-26 05:00` 至 `2026-12-01 05:00`，即第 16 天
开启、第 21 天结束。

`mode` 当前为 `schedule`。正式上线不得改成 `all-open`。`all-open` 只适合使用独立临时数据目录的功能测试。

## Docker 部署

在项目根目录执行：

```bash
docker compose build
docker compose up -d
docker compose ps
```

首次启动时外部命名卷为：

```text
fate-covenant-realm-2-20261110
```

容器根文件系统只读，持久卷挂载在 `/var/lib/fate-covenant/realm-2`。业务服务以非 root
用户运行，丢弃 Linux capabilities，并禁止提权。

端口策略：

| 服务 | 端口 | 暴露范围 |
| --- | ---: | --- |
| SDK | 18880 | 公网 TCP |
| 区服列表 | 18881 | 公网 TCP |
| 启动/更新 | 18882 | 公网 TCP |
| 游戏网关 | 19090 | 公网 TCP |
| Web 管理 | 18883 | 仅宿主机 `127.0.0.1` |

云安全组和主机防火墙只放行前四个端口，禁止对公网开放 `18883`。

## 启动验收

```bash
docker compose ps
docker compose logs --tail=100 realm-2
docker compose exec realm-2 node -e "const fs=require('node:fs');const s=JSON.parse(fs.readFileSync('/var/lib/fate-covenant/realm-2/server.local-only.json'));console.log(JSON.stringify(s,null,2))"
```

必须核对：

- `activeServerId` 为 `2`。
- `launchProfileId` 为 `public-realm-2-20261110`。
- `serverOpenedAt` 为 `1794326400`。
- `activityReferenceOpenedAt` 为 `1790784000`。
- 当前 `serverDay` 为 `1`，到开服后 24 小时进入第 2 天。
- 区服接口只广播命运二服及游戏地址 `140.143.142.251:19090`。
- 容器健康检查通过，并在持久卷中生成游戏数据库和管理密钥。

正式验收还需要使用公网 APK 完成 SDK 登录、区服选择、网关握手、进入大厅和首个开服活动检查。
组件测试或容器启动通过不能替代客户端验收。

部署前运行全表活动时间审计：

```bash
npm run audit:activity-schedule --prefix personal-server
```

审计必须输出 `Result: PASS` 和 `Errors: 0`。当前统计为 1,993 行活动、1,989 个可静态还原窗口、
73 个分段活动时长全部一致；4 个动态或无时间配置项单独列出，不能当作永久活动。

## 备份与回滚

在停服窗口内备份整个外部卷最稳妥。在线备份至少应对 SQLite 使用 `VACUUM INTO`，不要直接复制正在写入的主库或单独 WAL。

```bash
docker compose stop realm-2
docker run --rm \
  -v fate-covenant-realm-2-20261110:/data:ro \
  -v "$PWD/backups:/backup" \
  alpine sh -c 'tar -C /data -czf /backup/fate-covenant-realm-2-$(date +%Y%m%dT%H%M%S).tgz .'
docker compose start realm-2
```

回滚镜像时继续挂载同一个外部卷。若必须回到旧服时间线，应同时恢复与旧镜像匹配的数据卷；
不要把旧卷挂到不同 `launchProfileId` 的新版本上，服务会按设计拒绝启动。

## 本地开发

普通本地启动默认读取同一活动日历配置。需要开放全部活动测试时，应使用单独配置文件和
全新临时数据目录，不要让生产卷绑定测试档案：

```powershell
$env:FC_LOCAL_DATA = Join-Path $env:TEMP 'fc-local-test'
$env:FC_ACTIVITY_CALENDAR_CONFIG = 'D:\path\to\all-open-calendar.json'
npm start --prefix .\personal-server
```

公网模式强制要求 `FC_LOCAL_DATA` 是源码树之外的绝对路径，并验证配置中的开服时间。

## 独立部署验证

```powershell
npm run test:deployment --prefix .\personal-server
```

该测试会复制发布目录、主动排除 SQLite，从空的外部目录启动完整服务，并检查开服档案、
区服响应、运行库创建、数据库不进入发布副本以及公网模式缺失持久目录时拒绝启动。
