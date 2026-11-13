# P0 命令派发对账证据

日期：2026-11-13

范围：`personal-server/config/command-catalog.json` 的 1407 条 C2S 命令、
`personal-server/game/gateway.mjs` 的顶层派发、各服务的 `supports(type)`，以及
`agent/workflow/interface-catalog/static-interfaces.json` 的编码与回包元数据。

## 复现

```powershell
cd personal-server
npm run audit:command-dispatch
npm run check:command-dispatch
npm test
```

`--check` 重新生成内存审计并与 checked-in 的 `config/command-dispatch-audit.json`
逐字节比较；source hash、summary 或 1407 条行集合发生漂移时以非零状态退出。

## 结果

- 总计：1407 条。
- 服务路由：1316 条。
- 网关直达：18 条。
- 多重 owner：6 条。
- 未路由：67 条；这些是 P2 的明确缺口，不计为已实现。
- owner 缺 `supports`：0。
- owner 没有任何目录 type：0。
- 服务支持目录外 type：0。
- 请求编码与静态接口不一致：172 条。
- 请求编码未验证：986 条。
- 回包运行时未验证：1407 条。
- 回包 schema 缺失：223 条。

编码和回包统计是证据缺口，不等于命令不可达，也不等于业务已验收。

## 启动校验

`createCommandRegistry()` 默认加载 `command-dispatch-audit.json` 并校验：

- schemaVersion 为 1，命令行数恰为 1407，type 唯一且全部存在于目录。
- 每行 name/access 与目录一致，status/owners/shadowedOwners/evidenceGaps 形状合法。
- `unrouted` 必须没有 owner，其余状态至少有一个 owner。
- summary 必须由行数据重新计算且完全一致。
- `ownerWithoutSupports`、`ownerWithoutCatalogTypes`、`supportedOutsideCatalog` 必须存在。

任何一项不满足，网关启动失败，避免目录、派发顺序和运行时能力静默漂移。

## 验证

- `npm run check:command-dispatch`：通过，summary 与上述结果一致。
- `npm test`：51 个文件、245 项，pass 243 / fail 0 / skipped 2。
- 未启停线上服务、未读写线上数据库、未操作模拟器/ADB/APK。

## 边界

- 67 条未路由仍由网关返回明确拒绝或等待后续实现，不在 P0 对账阶段伪造回包。
- 172/986/1407/223 条编码与回包缺口继续作为证据任务；调用路径存在不代表客户端协议已验证。
- 6 条多重 owner 仅记录实际命中顺序，后续需按客户端证据消除歧义。
