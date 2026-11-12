# 命运三服生产部署

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
| 区服 | ID `3`，命运三服 |
| 角色 | `100004`（空服配置模板 ID；首位真实玩家从 `1` 开始） |
| 开服时间 | `2026-11-12T18:00:00+08:00` |
| 活动参考服开服 | `2026-10-01T00:00:00+08:00` |
| 活动模板锚点 | `2026-10-24T05:00:00+08:00` |
| 发布档案 | `public-realm-3-20261112` |
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
fate-covenant-realm-3-20261112
```

容器根文件系统只读，持久卷挂载在 `/var/lib/fate-covenant/realm-3`。业务服务以非 root
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
docker compose logs --tail=100 realm-3
docker compose exec realm-3 node -e "const fs=require('node:fs');const s=JSON.parse(fs.readFileSync('/var/lib/fate-covenant/realm-3/server.local-only.json'));console.log(JSON.stringify(s,null,2))"
```

必须核对：

- `activeServerId` 为 `3`。
- `launchProfileId` 为 `public-realm-3-20261112`。
- `serverOpenedAt` 为 `1794477600`。
- `activityReferenceOpenedAt` 为 `1790784000`。
- 当前 `serverDay` 为 `1`，到开服后 24 小时进入第 2 天。
- 区服接口只广播命运三服及游戏地址 `140.143.142.251:19090`。
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
docker compose stop realm-3
docker run --rm \
  -v fate-covenant-realm-3-20261112:/data:ro \
  -v "$PWD/backups:/backup" \
  alpine sh -c 'tar -C /data -czf /backup/fate-covenant-realm-3-$(date +%Y%m%dT%H%M%S).tgz .'
docker compose start realm-3
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
## 多区服（当前只启用命运三服）

`config/public-server.json` 当前只广播命运三服。2026-11-12 用户要求关闭命运二服，并
让命运三服占用二服原有的公网端口。多区服代码仍保留：将来重新启用两个区服时，每个区服
使用独立进程、数据目录和游戏端口，`FC_ACTIVE_SERVER_ID` 指定本进程服务的区服。

| 项目 | 当前值 |
| --- | --- |
| 区服 ID / 角色 | `3` / `100004` |
| 区服名称 | 命运三服 |
| 开服时间 | `2026-11-12T18:00:00+08:00` |
| 发布档案 | `public-realm-3-20261112` |
| 活动日历 | `config/activity-calendar-realm-3.json` |
| 数据目录（裸机） | `/data/disk1/game/data-realm-3-live-20261112` |
| 发布目录（裸机） | `/data/disk1/game/releases/release-20261112T131204Z` |
| 发布提交 | `7de7c725fe352c5cdcf8be73c1f2d4d85e607f98` |
| 公网端口 | 18880/18881/18882/19090，管理 18883 |
| systemd 单元 | `fate-covenant-realm-3.service` |

客户端使用 `18880` SDK、`18881` 区服列表、`18882` 更新检查和 `19090` 游戏网关；这些端口
原先已经对公网开放，不需要再新增安全组规则。管理页只在宿主机 `127.0.0.1:18883` 监听。

命运三服现在直接签发和验证自己的 SDK 会话，不再读取二服的 `sdk-sessions.local-only.json`。
`fate-covenant-realm-2.service` 保留在机器上供将来恢复，但保持停止并禁用。

公网空服首次建库不写入模板角色，只写入 `empty-realm-v1` 标记；首位账号登录时创建角色
`1`、等级 `1` 的完整新手存档，后续账号继续分配独立角色。发布档案会校验区服、开服时间和
活动窗口，但不会把空服首位角色强制改成模板角色 ID。

裸机发布与切换：

```bash
TS=$(date -u +%Y%m%dT%H%M%SZ)
REL=/data/disk1/game/releases/release-$TS
mkdir -p "$REL"
rsync -a --exclude node_modules --exclude "*.sqlite*" --exclude "*.local-only.*" \
  personal-server/ "$REL"/
(cd "$REL" && npm ci --omit=dev --no-audit --no-fund)
git -C <repo> rev-parse HEAD > "$REL/RELEASE_COMMIT"
```

停服备份整个数据目录，再原子切换 `current` 并只启动当前单元：

```bash
sudo systemctl stop fate-covenant-realm-3
tar -czf "backups/pre-$TS/data.tar.gz" -C /data/disk1/game data-realm-3-live-20261112
ln -sfn "releases/release-$TS" /data/disk1/game/current.next
mv -T /data/disk1/game/current.next /data/disk1/game/current
sudo systemctl start fate-covenant-realm-3
```

启动前对当前区服跑活动时间审计，结果必须为 `Result: PASS`：

```bash
FC_ACTIVITY_CALENDAR_CONFIG=config/activity-calendar-realm-3.json npm run audit:activity-schedule --prefix personal-server
```

## 2026-11-12 空服上线记录

切换前三服库备份在
`/data/disk1/game/backups/pre-empty-realm-20261112T131204Z/`，其中压缩包 SHA256 为
`e76ed1f0ffea27931f070afcc9db8d76011540c6300d9f49f7d42b556b0f637f`。旧目录
`data-realm-3-rollover` 未删除，新目录启动时角色和账号数均为 `0`。

验证结果：全量 `npm test` 1707 项、pass 1705、fail 0、skipped 2；部署测试 1/1。线上真实 SDK
手机号登录后经公网 `19090` 进入区服 3，创建 `roleId=1`、`level=1`、经验 `0`、148 个登录模块；
重载种子角色 `2010101/2010201` 均为 1 级；使用 `server_id=2` 被拒绝。重启三服后同一账号仍为
角色 1、等级 1，SQLite `integrity_check=ok`。两服 unit 状态为二服 inactive/disabled、三服
active/enabled。APK 大厅视觉验收仍待用户完成。
