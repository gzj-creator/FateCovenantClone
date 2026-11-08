# ROLE-UNKNOWN 实现记录

日期：2026-11-08。分支：`feat/block-j-role-support`。范围：J 块 #265。

## 状态

服务端完成，命令词表是本地受审计的 GM 设计；客户端 ETF 请求契约未恢复。未做 APK 实机验收。

## 客户端证据

- `Cmd.lua` 只登记了 C2S `gm_cmd` 和 S2C `rev_gm_cmd` 名称通道。
- 已提取的项目脚本没有找到发送 `gm_cmd` 的专用 Cmd 模块或完整 ETF 参数构造；因此不能把本地 map 形状声称为原服契约。

## 实现

- 命令：10。
- 默认关闭，只有显式开启 GM 后才允许执行。
- 支持 status、grant、set_level、grant_figure 四个操作，写入 `gm_audit_entries`；业务、状态和回包同事务提交。
- 参数错误、GM 关闭、资源不足、重复操作和未拥有对象使用明确业务错误码，不回送固定空包。

## 验证

- `test/block-j-role-support.test.mjs`：13/13 通过，覆盖 GM 审计和 SQLite 重开。
- `test/block-j-role-gateway.test.mjs`：1/1 通过，覆盖真实 loopback framing。
- 合并最新 main 后全量 `npm test`：2734 项，pass 2732、fail 0、skipped 2，日志为 `analysis/test-runs/gameplay-20261106/block-j-after-main-full.log`。

## 缺口

- `gm_cmd` 的客户端 ETF 请求契约仍未恢复；当前实现只接受明确的本地 map，需要拿到真实请求后再校正。
- 本轮未启动或停止实时服务，未读写运行数据库，未操作模拟器、ADB 或 APK。
