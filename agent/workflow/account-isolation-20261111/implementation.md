# 双账号存档隔离与命运二服正式部署

## 结果

- 2026-11-11 完成，功能提交 `1da5abd` 已快进到远端 `origin/main`。
- 部署方式为 Ubuntu 裸机 systemd，不使用 Docker。
- 当前 release：`/data/disk1/game/releases/release-20261110T172155Z`。
- `/data/disk1/game/current` 已原子切换到该 release。
- 服务 `fate-covenant-realm-2.service` 为 `enabled + active + Restart=always`，环境 `TZ=Asia/Shanghai`。
- 公网监听 `18880/18881/18882/19090`，管理端仅监听 `127.0.0.1:18883`。

## 账号隔离

- SQLite schema 从 v18 迁移到 v19，新增 `accounts` 表，账号到角色为一对一映射。
- 原账号 `local-1` 保留并继续映射角色 `100002`；部署后核对该角色仍为 12 级。
- 手机号 `17607270093` 使用稳定 SDK 身份 `local-phone-17607270093`，通过真实 SDK 注册、网关握手与 909103 登录创建独立角色 `100003`，等级为 1。
- `AsyncLocalStorage` 将每个 TCP 连接的请求、事务、钱包、邮件和在线奖励绑定到各自角色。
- 登录前的非登录业务请求被拒绝；邮件推送按目标角色定向，不广播给其他在线账号。
- SDK 余额支付和 QuickSDK 支付从签名请求或当前 session 解析账号，不再固定使用 `local-1`。

## 服名与开服配置

- 区服列表 `name` 为“命运二服”，`nick_name` 改为空字符串，客户端不再拼接出“命运二服命运二服”。
- 正式开服时间为 `2026-11-11T00:00:00+08:00`，Unix `1794326400`。
- 区服接口实测返回 ID 2、名称“命运二服”、`nick_name=""`、地址 `140.143.142.251:19090`。
- `server.net.proto` 的签名校验会先把 LF/CRLF 规范化到导出文件原本的 CRLF 形式；Git 中的 LF 源文件也能通过校验，避免干净 checkout 启动失败。

## 部署前备份

- 备份目录：`/data/disk1/game/backups/pre-account-isolation-20261110T172155Z`。
- 备份包含整个 v18 数据目录、原 current release 记录和管理密钥，目录权限 `700`，密钥内容未写入文档。
- 主 SQLite 备份 SHA256：`0f3e4fdb243fb7388e0896053ce4ec736efb7abd0558647b73d81f5a79f67911`。
- 备份 `PRAGMA integrity_check` 为 `ok`，源版本为 v18，仅含 `local-1 -> 100002`。

## 代金券发放

- 通过受保护的管理 API 发放 `mail_id=1` 到角色 `100003`。
- `request_id="voucher-1m-20261111-17607270093"`，标题“百万代金券到账”。
- `quantity=1000000`，单张面额 `100` 分，总额 `100000000` 分。
- 邮件创建后尚未领取；用户需要用手机号账号进入游戏，在邮件中领取。

## 验证

- 账号隔离专项 2/2 通过，包括两个同时在线 TCP 会话、不同角色隔离、重启持久化、定向发券和领奖隔离。
- SDK、区服、配置、钱包、邮件等关联专项合计 74/74 通过。
- 账号启动迁移、launch profile、全新部署副本共 8/8 通过；release 内再次执行部署测试 1/1 通过。
- 全量回归执行 2819 项，首轮为 pass `2816`、fail `1`、skipped `2`。唯一失败是部署测试仍断言旧开服 epoch；修正为 `1794326400` 后，相关 8 项和 release 部署测试均通过。
- 上线库 v19 `PRAGMA integrity_check` 为 `ok`；`accounts` 保留 `local-1 -> 100002`，并新增 `local-phone-17607270093 -> 100003`。
- 新 release 启动日志、五个监听端口、管理页 HTTP 200、区服 Protobuf 和时区均已核对。

## 操作边界

- 不输出管理密钥、SDK token 或手机号验证码。
- 保留部署前完整备份和旧 `100002` 存档。
- 后续新增区服或账号时继续沿用“手机号/SDK 身份 -> `accounts` -> 独立 role_id”的映射，不在协议层复用旧角色号。
