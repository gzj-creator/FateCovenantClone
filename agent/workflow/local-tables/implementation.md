# 配置表重建与热门阵容（TeamSuggest）恢复

日期：2026-11-01。范围：`personal-server` 启动时读取的客户端配置表。

## 现象

服务启动即报 `ENOENT ... bytecode/HeroTable.data.lua.json`，`readHeroTables()` 抛错，`heroTables.TeamSuggest` 为 `undefined`，登录时 `ensureLoginState()` 产不出 `collects`，88801 领奖随之失败。

## 根因

`analysis/` 由 `.git/info/exclude` 排除在版本控制之外（`git ls-files analysis` 为空），一次 `git clean -xfd` 之后整棵目录被删。受影响的不是单个 HeroTable：

- `config/*.mjs` 读取的 41 个表 dump（`bytecode/*.json`、`analysis/tmp/*`、`analysis/work/*`、`analysis/recruitment-debug/*`）全部缺失；`lineup-tables`、`magic-circle-tables` 依赖的 raw `.lua.bin` 同样缺失。
- `lua-bundles/login-protos/*.proto`、`handshake-aes-harness/fixtures.json`、`p2/packet-crypto/fixtures.json` 缺失，相关测试直接 ENOENT。
- 运行时目录 `p3/runtime.local-only.data` 只剩 sqlite 与 events，`server-key.local-only.json`、`update-manifest-364110.local-only.txt` 丢失。

崩溃前启动的服务进程（PID 37244，10:32 启动）仍在内存里持有旧表，所以客户端页面照常显示；重启即崩。

## 重建

新增两个受版本控制的工具，数据全部由 APK 内的 bundle 生成，无手工抄写行：

- `tools/unityfs-read.mjs`：只读 UnityFS 解析，`readTextAssets()` 返回 `{ pathId, name, bytes }`，文件名沿用既有解码目录的 `<pathId>-<name>` 约定。
- `tools/provision-local-tables.mjs`：按 `TABLES` 清单把 bundle 里的 LuaJIT 字节码转成 prototype dump（复用 `tools/dump-table-prototypes.mjs` 的 `buildPrototypeDump`），写回 `personal-server` 实际读取的路径。

```powershell
# 1) 从 apk/com.jzyx.ps.v9-working.apk 抽出三个 bundle 到 analysis/tmp/lua-bundles/
#    assets/Android/script/lua/64_lua_project.bundle (102,832,516B)
#    assets/Android/script/lua/64_lua_core.bundle    (393,040B)
#    assets/Android/script/lua/64_lua_general.bundle (838,422B)
# 2) 重建全部表
node tools/provision-local-tables.mjs --bundles analysis/tmp/lua-bundles
# 3) 校验（analysis/tools 为本地脚本，不入版本控制）
node analysis/tools/probe-table-paths.mjs
```

重建结果 41 项，7 个 config reader 全部可加载：hero 27 表、equip 15、lineup 1、magic-circle 8、mission 6、destiny 3、game 158。

## TeamSuggest 数据

- `TeamSuggest` 12 行：`tid` 100/101/102、200/201/202、300/301/302、400/401/402，四个分组各 3 档 `team_type`（1/2/3）。
- `TeamSuggestAward` 30 行（`tid` 101 起，按 `collect_percent` 10/20/30… 递增，`award` 如 `[[31002,2]]`）。
- `TeamSuggestType` 4 行，popularity 1225/1173/1189/1248，对应四个阵容分组标题。
- `TeamSuggestTeamType` 3 行，`unlock_percent` 0/60/85。

客户端对照：`analysis/experiments/private-server-20261025/p3/team-suggest-20261101/client-team-suggest-20261101.png` 显示圣堂控制流 3/6、古域爆发流 2/6、元素燃烧流 1/6，与 `calculateTeamSuggestProgress` 按玩家星级算出的收藏度一致。

## 同时恢复

- `p3/runtime.local-only.data/update-manifest-364110.local-only.txt`：取 APK `assets/update.txt`（933,635B，首行 `flag|{version,364110}`）。
- `lua-bundles/login-protos/*.proto`：由 `candidate/decoded/assets__Android__protobuf.bundle/textassets/*.proto.bin` 去 `.bin` 复原 656 个。
- 握手/包加密 fixtures：重跑 `tools/run-game-handshake-aes-harness.ps1` 与 `tools/run-game-packet-crypto-harness.ps1`；两者都在写 fixtures 之后的 `network-cil.json` 身份哈希步骤失败（该取证文件同样被删）。
- 测试用交接库：`p3/wallet-admin-20261025/handoff-game.local-only.sqlite` 原文件不可恢复，用 `analysis/tools/snapshot-game-db.mjs` 对在用库做 `VACUUM INTO` 快照（368,640B，user_version 10）。

## 测试

`cd personal-server; node --test test/*.test.mjs`

- 重建前：444 通过 / 161 失败（大量 ENOENT）。
- 完成表与 fixtures 重建后：507 通过 / 77 失败。
- 剩余失败集中两类：交接库被替换成当前进度快照，`reward_claims` 等记录已存在（如 `Linear task reward already claimed` 7 项、各类 9010 领奖与购买流程）；`network-cil.json` 等取证产物缺失。

## 尚未解决

`p3/runtime.local-only.data/server-key.local-only.json` 丢失。它是 `/server_list` 请求签名校验用的密钥，来自客户端；全盘无副本，`64_lua_*` bundle、Lua 资源与 `Assembly-CSharp`/`Assembly.Framework.UniCore` 里都没有对应字面量。缺它时 `local-server.mjs` 直接读文件失败，服务无法重启。

## 验收边界

表加载与客户端页面数据一致，属于组件级验收。服务尚未重启，登录与 88801 真实链路未复验，不能记为可玩验收。

## 2026-11-01 运行时文件与会话恢复

复核 `cdd1249` 后确认：该提交重建了 41 个配置表，但 `analysis/` 仍受 `.git/info/exclude` 控制，运行时文件没有进入版本控制。现已恢复：

- `p3/server-key.local-only.json` 与 `p3/runtime.local-only.data/server-key.local-only.json` 内容一致，SHA-256 均为 `228EAE9666D55CDC1AB42A594BB8C06A21F8EEA2C9B0ADC44A7DBCA04237C059`。其中 key 是测试用临时签名 key，不是从原 APK 恢复出的原厂 key；原值只保留在 local-only 文件，不写入 Git。
- `runtime.local-only.data/update-manifest-364110.local-only.txt` 已存在，大小 933,635B，SHA-256 `8DD2A59325E139F333F6BDF3A8CC0E289368FDC5D54281B45D5E4A58E0EC42F1`。
- `runtime.local-only.data/sdk-sessions.local-only.json` 因清理丢失；已用设备 `JZUserToken.xml` 中仍然有效的 `local-1` token 做 SHA-256，恢复服务端会话条目。文件只保存 token 哈希、用户 ID 和到期时间，不保存原始 token。

恢复后服务于 `2026-11-01T05:50:27.548Z` 重启，实时 PID 以 `runtime.local-only.data/server.local-only.json` 为准（本轮为 27164），五端口正常启动且 stderr 为空。只读验证：

- 用恢复后的 key 对 `/server_list` 发送 `channel_login_servers`，返回 `200 application/octet-stream`。
- 用客户端现有 token 调用 `/user/tokenVerifySdk`，返回 `200`、`rcode=0`、`userid=local-1`、原到期时间 `1793980174`。

客户端此前日志中的 `Local SDK session required` 由会话文件丢失导致；修复后的接口验证已通过。客户端当前停留在登录流程，未代为点击或重启；用户完成登录并进入大厅后才能记为 APK 可玩验收。

## 2026-11-01 签名密钥与更新清单迁移

静态配置和更新清单已迁出易被清理的 `analysis/` 运行目录，改为 `personal-server` 的版本化配置：

- `/server_list` 签名密钥：`personal-server/secrets/server-list-signing-key.json`。已从客户端 bundle 解码出的 `LoginServerHttp.lua.json` 定位到类常量 `aMyvhEQ5rvyGRm2w`；该值与此前临时值 `fc-local-temp-signing-key-for-testing` 不同。
- 更新清单：`personal-server/config/update-manifest-364110.txt`，933,635B，SHA-256 为 `8DD2A59325E139F333F6BDF3A8CC0E289368FDC5D54281B45D5E4A58E0EC42F1`。
- `personal-server/local-server.mjs` 默认读取新路径，并允许用 `FC_SERVER_LIST_SIGNING_KEY_PATH`、`FC_UPDATE_MANIFEST_PATH` 临时覆盖。
- `.gitattributes` 将更新清单标为 `binary`，避免 Git 换行转换或文本 diff 改变清单字节。

`sdk-sessions.local-only.json` 是登录后动态变化且会过期的本机会话状态，仍留在运行时目录，不提交 Git。签名密钥是否与真实客户端一致，要以客户端实际 `/server_list` 表单中的 `json` 和 `sign` 重算结果为准；仅以服务端自造请求返回 200 不算真实链路验收。

服务改用新密钥后于 `2026-11-01T06:32:17.872Z` 重启，实时 PID 为 `20852`。仍在运行的客户端随后连续请求已由 401 变为 `preferred_login_servers 200`，界面显示 `Local Server` 和“踏上旅途”；用户确认恢复。现有客户端因此无需再重启。截图证据：`analysis/experiments/private-server-20261025/p3/server-list-key-probe-20261101/client-after-key-fix-20261101.png`。新密钥文件 SHA-256 为 `DBCAB5188896475842BC77E70F86744716C66820D8486A259CD4004238552D1C`。
