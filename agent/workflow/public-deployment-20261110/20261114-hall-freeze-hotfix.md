# 2026-11-14 新服大厅卡死热修

## 现象与证据

新发布上的真实登录已经发生，说明此前“客户端仍连接旧进程”的判断不成立。2026-11-14 01:14—01:15
CST 的两次连接均具备以下特征：

- 登录响应 145 个模块，模块 16 投影了持久化的 4 条引导进度（`added=4, total=4`）；客户端没有再发
  type `8000`，排除了引导状态未完成导致的阻塞。
- 客户端依次完成 `91403`、`1202`、`99229`、`108001`、`105702`、`102801`，随后发送 type `7000`
  并请求功能 `1054`。
- 服务端返回 `feature_request ids:[1054] allowed:[]`。之后没有大厅业务命令；其中一次连接只发送了
  type `111`，随后客户端关闭连接。没有 `handler_error`、`login_rejected` 或 `frame_error`。

## 根因

`FunOpenTable` 取证（`agent/workflow/evidence/E9-1.md`）确认 type `7000` 只接收 target 1，且 target
1 的行声明 `client_req_to_open=true`：客户端先执行开放条件，成功后再请求服务端确认并写入位图。

新版服务端把带 `evidence_gap` 的规则再次用于 type `7000` 请求，导致客户端已经确认的 `1054` 被
拒绝。旧可玩版本对同一状态请求会把 `1054` 从关闭改为开放；新版响应虽然长度和 protobuf 外形正常，
但缺少客户端等待的位，客户端停在功能开放确认阶段。

修复提交为 `df6c762`（`fix: honor client-confirmed feature opens`）：

- type `7000` 的 target 1 请求按协议提交客户端确认结果。
- 运营 `force_close` 仍优先，强制关闭会在登录位图中屏蔽且不改写持久化位图。
- target 2 继续由服务端 reconciliation 管理。
- 活动开放、暂停和排期逻辑未修改。

## 发布与验证

- 发布目录：`/data/disk1/game/releases/release-20261113T172542Z`。
- `RELEASE_COMMIT`：`df6c76234f98f85cf70655328af65752590d2e75`。
- 服务：`fate-covenant-realm-3.service`，PID `1536181`，`active (running)`。
- 停服备份：`/data/disk1/game/backups/pre-20261113T172542Z/data.tar.gz`，SHA256
  `2d8e05a62075ec292ab3ff575ee5c9bef93b1295e38fd4e46ec26b878e600983`。
- 全量 fast 测试 252 项，pass 250、fail 0、skipped 2；相关专项 33/33；部署测试 1/1。
- 活动排期审计 rows 1993、errors 0、`Result: PASS`；command dispatch audit check 通过。
- SQLite `integrity_check=ok`、`user_version=20`，accounts 1、roles 1。
- 使用线上库一致性副本和发布目录重放 type `7000 [1054]`：响应 102 字节，`1054` 从 `false` 变为
  `true`。

客户端热修后重新登录与大厅点击验收仍需实机确认；实机出现业务命令前，不将本次修复记为完整验收。
