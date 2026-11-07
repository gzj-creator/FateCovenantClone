# HERO-HERO 剩余命令：服务接入契约（总控维护）

本文件约定 HERO-HERO 四个分簇模块的统一接入形状，供各分簇负责人并行实现。总控只改 `personal-server/game/gateway.mjs` 的派发与登录挂载，分簇负责人不要修改该文件。

## 模块

| 分簇 | 文件 | type |
| --- | --- | --- |
| 培养/试炼/一键 | `personal-server/game/hero-develop-service.mjs` | 637、641、656、666 |
| 羁绊/变异/挂件/学院 | `personal-server/game/hero-bond-service.mjs` | 602、654、661、672 |
| 支援/跑马灯/招募进度 | `personal-server/game/hero-support-service.mjs` | 635、651、652、673 |
| 租借/分享 | `personal-server/game/hero-rent-service.mjs` | 627、628、629、630、631、634 |

每个模块导出一个工厂：

```js
export function createHero<Cluster>Service({ store, codec, tables, heroTables, now, logger }) {
  return {
    supports(type),                       // 本簇 type 返回 true，其余 false
    async decode(type, raw, helpers),      // 可选；把请求字节解成 execute 的 input
    execute(type, input),                  // 返回 { schema, value, data, pushes?, valueForLog? }
    ensureLoginState()                    // 可选；登录时补齐登录数据
  };
}
```

`decode` 的 `helpers`：

- `unpack(schema, buffer)`：protobuf 解码，空 buffer 会解成默认值对象。
- `etf(buffer)`：返回 `{ value }` 之后的负载（ETF 解码结果的 `value`，已剥掉 `{ value, type }` 包装）。
- `singleId(buffer, message)`：ETF 单 id 参数，非法时抛 `GameError(1, message)`。

## 硬性要求

1. `execute` 必须同步执行，并在 `store.transaction(model[, db])` 内完成“读权威状态→校验→改状态→消耗/发奖→`codec.pack`”。`codec.pack` 必须在事务内，编码失败要整体回滚。
2. 权威状态只来自当前存档 `model`（`model.role`、`model.heroInfo`、`model.resources`、`model.state.modules` 等）。不得伪造全服/跨角色数据；缺证据的分支返回明确业务码并在交付文档登记缺口。
3. 业务码沿用现有约定：`1` 参数非法、`5` 状态/顺序非法、`301` 资源不足、`305` 未解锁或上限、`3001` 内容不存在、`3006` 碎片不足。参照 `hero-extra-service.mjs` / `hero-progression.mjs`。
4. 需要额外持久化的中间态（例如待确认结果）用服务内 `ensureTables` + `store.inspect(db => ...)` 建表，不改 `game-store.mjs` 迁移；表名带模块前缀，主键含 `role_id`。
5. 配置读取：如需 `HeroTable` 中未加载的表，新建 `personal-server/config/hero-<cluster>-tables.mjs`，用 `readJsonAsset(tableAsset('HeroTable.data.lua.json'))` + `readGeneratedDump(parsed, [names])` 自取；不要改 `config/hero-tables.mjs`。
6. 资源工具复用 `consumeResources` / `grantResources`（`./resources.mjs`），错误类型复用 `GameError`（`./hero-progression.mjs`）。
7. 只改本簇服务文件、本簇 config、本簇测试、本簇交付文档；不要动 `gateway.mjs`、`hero-progression.mjs`、`recruit-service.mjs`、`hero-extra-service.mjs`、`game-store.mjs`、battle/friend/fishing 等其它模块。

## 测试

- 服务测试：`personal-server/test/hero-<cluster>-service.test.mjs`，覆盖正常、非法 id/资源不足/未解锁、防重、跨日/周期、SQLite 重开、编码或写入失败回滚。
- 网关测试：`personal-server/test/hero-<cluster>-gateway.test.mjs`，照搬 `test/hero-extra-gateway.test.mjs` 的临时端口 + 真实握手 + 真实数字 type 路径。
- 只跑自己的测试文件：`node --test --test-concurrency=1 test/hero-<cluster>-*.test.mjs`（在 `personal-server` 目录）。不要跑全量 `npm test`。

## 证据

- 客户端 Lua（LuaJIT 字节码，可用 `tools/luajit-bytecode-parse.mjs` 解析；`HeroDevelopMgr.lua` 等需要先打补丁，参考 `agent/workflow/gameplay-completion/SOC-FRIEND/inspect-evidence.mjs`）：`F:/projects/FateCovenantClone/.worktree/recruit-20261101/.scratch/out/luaproject/`。
- proto：`personal-server/assets/protobuf/*.proto.bin`（文本 proto，可直接读）。
- 表：`personal-server/assets/tables/HeroTable.data.lua.json.gz`（LuaJIT dump，用 `readGeneratedDump` 读）。
