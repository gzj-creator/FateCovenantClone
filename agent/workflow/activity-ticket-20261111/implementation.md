# 活动客户端资产交付与 LuaJIT 多 root 恢复

更新时间：2026-11-11（Asia/Shanghai）

状态：本地 APK 只读提取、prototype 恢复、表解析、UI bundle 提取和交付校验完成。没有连接或回放原游戏服务器，没有启动实时服务，没有操作 ADB、模拟器或 APK。

## 本地交付入口

全部活动资产位于：

```text
analysis/incoming/activity-ticket-20261111
```

主要入口：

- `ACTIVITY-ASSETS-DELIVERY.md`：中文资产说明、来源、目录、覆盖和限制。
- `ACTIVITY-INFERENCES.md`：静态事实、`newpermit` 复用证据和 `time_fun` 置信度分层。
- `evidence-manifest.json`：APK、父 bundle、全部交付文件和必需项的总哈希清单。
- `expanded/assets.manifest.json`：219 个 TextAsset 与 prototype dump 的分项清单。
- `expanded/tables/tables.manifest.json`：18 个活动表的 JSON/gzip 清单。
- `expanded/ui/ui-bundles.manifest.json`：27 个 UI/texture bundle 及全 APK 相关条目。
- `verify-delivery.mjs`：交付完整性校验入口。

`analysis/` 由 `.git/info/exclude` 排除，因此上述原始 `.lua.bin`、JSON、bundle 和证据文件只保存在本地，不进入 Git。

## 来源身份

- APK：`apk/release/com.jzyx.ps.v11-public-140.143.142.251.apk`
- 包名：`com.jzyx.ps`
- versionName：`1.55.090365`
- versionCode：`362155`
- assetVersion：`364110`
- APK 字节数：`4,185,759,009`
- APK SHA256：`3caa14ca150f8259f5e83d263e6a0a43f9b94df7eb9e3d3f58e0fdc494970d95`
- `64_lua_project.bundle`：`102,832,516` 字节，SHA256 `2b1fd41f3fb40ea3d3dcd1b7d1591d3d17ffacbc6422c028de4dc02ad04ecdc7`
- `64_lua_core.bundle`：`393,040` 字节，SHA256 `054c3a1d5de29f66b5f41f413ac56a473ee7b95ccf1226b343068b79cdd3be56`

## 交付结果

- 219 个活动家族 TextAsset 原始 `.lua.bin`。
- 219 个 LuaJIT prototype JSON；此前失败的两个多 root 文件已恢复。
- 18 个可解析活动表的 `.json` 和 `.json.gz`。
- 27 个 UI/texture bundle。
- 7 个活动入口时间框架 Lua 原件与 prototype，放在 `expanded/support/time-fun/`。
- 当前交付目录共 558 个文件。

关键覆盖：

- P0：`UpStarGift*`，27 个 TextAsset；其中 `UpStarGiftTable` 已解析 538 行 `UpStarGift`。
- P1：`ActShop*`、`ActivityTimeUtil`、`ActFrameTable.data`、`ActivityTable.data`，共 15 个目标 TextAsset。
- P2：PremiumAct、LinkGift、Permit/NewPermit、Subscription、GiftBox、Vickrey、BuySkin、AppearanceRelease、LevelSprint、RebateShop 等家族。
- 公共：`Cmd.lua`、`ErrorTable.data.lua` 和全部名称含 `Assert`/`Condition` 的相关 TextAsset。

## LuaJIT 多 root 修复

提交 `920b56b` 为 `parseLuaJit` 增加显式 `allowMultipleRoots` 选项，并保留默认的严格单 root 校验。

修改文件：

- `tools/extract-battle-tables.mjs`
- `tools/dump-table-prototypes.mjs`
- `tools/dump-luajit-prototypes.mjs`

恢复结果：

- `UpStarGiftMgr.lua`：54 个 prototype，root `[0,1,53]`，模块 root 53，50 个命名方法。
- `AppearanceReleaseActMgr.lua`：26 个 prototype，root `[0,25]`，模块 root 25，24 个命名方法。

这两个文件原先的 `LuaJIT root/EOF mismatch` 已确认是解析器只接受单根导致的工具边界，不是 APK 缺少代码。

## 关键静态结论

- APK 没有独立的 `newpermit` UI bundle。
- `PermitActMainForm.lua` 直接引用 `NewPermitActMgr`、`NewPermitActUtil`、`NewPermitActTable`；`PermitActAwardNode.lua` 也引用 NewPermit 模块。
- `permitact.bundle` 含 `PermitActMainForm.prefab` 与 `PermitActAwardNode.prefab`，`ProjectAssets.lua` 含对应映射。因此 NewPermit 主界面高置信复用 `PermitActMainForm`；个别子面板是否同时使用 `permit.bundle` 仍需运行验证。
- `UpStarGiftMgr` 覆盖版本选择、任务领奖、充值礼包购买、主界面/实体打开和红点计算。
- `AppearanceReleaseActMgr` 覆盖活动数据、交互次数与奖励、交互请求、弹窗准入和红点刷新。

## `time_fun=461` 边界

ActFrame 表只有三行使用 `time_fun=461`：

| tid | 活动 | 参数 |
| ---: | --- | --- |
| `1036008` | 龙息之地活动8期 | `[79,1,0]` |
| `1037001` | 梦境试炼活动_通服 | `[29,1,0]` |
| `1037002` | 梦境试炼活动_通服_2期 | `[90,1,0]` |

`ActivityTimeUtil.lua` 的标准时间路径没有直接读取 `time_fun`，它负责服务端、世界、跨服和阶段时间。当前 `origin/main` 的活动相对时间修复已明确把这些动态活动作为 `time_fun` 静态缺口处理：优先使用登录快照中的自定义窗口；没有快照窗口时关闭，不默认永久开启。

## 校验

```powershell
node analysis\incoming\activity-ticket-20261111\build-evidence-manifest.mjs
node analysis\incoming\activity-ticket-20261111\verify-delivery.mjs
```

最终结果：

```json
{
  "textAssetsVerified": 219,
  "uiBundlesVerified": 27,
  "tablesVerified": 18,
  "requiredChecks": 67,
  "expectedMissing": 0,
  "failures": []
}
```

另已验证：

- 单 root 表仍使用严格模式，`UpStarGiftTable` 五张子表行数为 `1/109/538/1/88`。
- 多 root 管理文件在严格模式下明确拒绝，在显式多 root 模式下返回全部 root。
- 总清单包含 558 个交付文件并逐项校验大小与 SHA256。

## 给消费方 agent 的边界

- 优先使用原始 `.lua.bin` 和 prototype dump 推导协议字段、客户端流程与表关联。
- 表 JSON 可直接用于本地服务端配置，但必须保留来源与哈希。
- `newpermit` 复用属于静态高置信推断，尚未做 APK 运行验收；不要把“高置信”写成“已实测”。
- `time_fun=461` 的 `[A,1,0]` 语义仍缺独立证据；没有动态窗口时必须 fail closed。
- 不连接、不请求、不回放原游戏服务器；用户正常游玩时只做被动采集。
- 不提交 APK、`.lua.bin`、bundle 或完整 `analysis/` 目录。
