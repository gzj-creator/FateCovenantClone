# 橘屋助手四指令实现（2026-11-08）

## 现象与根因

登录进入游戏后弹出“橘屋参数错误”。运行日志中客户端反复发送以下请求：

- 指令：`88202 req_house_assistant_choose_assist`
- 请求记录：`{ scene_tid: 1, assistant_tid: 10063200 }`
- 旧服务响应：`unsupported_command`、`errCode: -1`
- 旧堆栈：`LOCAL_NOT_IMPLEMENTED:88202`

登录模块 148 存在，但 `use` 为空，因此客户端会用默认主场景选择补齐并发送 `88202`。服务端没有实现 `HouseAssistantCmd` 的四个指令，导致正常登录流程收到未实现错误。

## 客户端协议

| 指令 | 请求 | 响应 | 服务端行为 |
| --- | --- | --- | --- |
| `88201` | `pb_house_assistant_use_req_list` | `pb_house_assistant_use_rsp` | 按 `scene_tid` 写入 `use_bg` |
| `88202` | `pb_house_assistant_use_req_list` | `pb_house_assistant_use_rsp` | 按 `scene_tid` 写入 `use_assistant` |
| `88203` | `pb_house_assistant_trial_req` | `pb_house_assistant_trial_rsp` | 保存当前选择到 `last_use`，应用试用外观并记录截止时间 |
| `88204` | `pb_house_assistant_trial_cancel_req` | `pb_house_assistant_trial_rsp` | 删除试用；最后一个试用结束后恢复 `last_use` |

`scene_tid` 为位置编号：`1=Main`、`2=Support`。在 `88201` 中，请求的 `assistant_tid` 字段复用为背景物品 tid。

客户端表中的 4 个试用记录为：

| 试用 id | 物品 tid | 时长 | 活动 tid | 类型 |
| --- | ---: | ---: | ---: | --- |
| 1 | 10163200 | 259200 秒 | 1006001 | 助手 |
| 2 | 20133200 | 259200 秒 | 1006001 | 背景 |
| 3 | 10163200 | 259200 秒 | 1006002 | 助手 |
| 4 | 20133200 | 259200 秒 | 1006002 | 背景 |

客户端默认主场景助手为 `10043200`，默认主场景背景为 `20013200`。`HouseAssistantMgr.SetDefInfo` 会在这两个默认物品缺失时补入资源；服务端登录修复执行相同行为。

## 实现

- `personal-server/game/house-assistant-service.mjs` 负责模块 148 的读取、校验、持久化和四个指令。
- `personal-server/config/house-assistant-tables.mjs` 从客户端 `HouseAssistantTable` dump 读取场景与试用配置。
- `personal-server/assets/tables/HouseAssistantTable.data.lua.json.gz` 保存对应客户端表证据。
- `gateway.mjs` 在登录时修复模块 148，并将 `88201–88204` 分发到新服务；成功记录 `house_assistant_committed`，失败记录 `house_assistant_rejected`。
- 选择试用品不要求玩家拥有该物品；普通选择要求对应物品存在于模块 148 的 `res` 且数量大于零。
- 试用期间禁止普通选择覆盖临时外观。最后一个试用取消或登录时清理到期试用后，服务端恢复 `last_use`。
- 所有请求先完整校验，再在同一 SQLite 事务中写入，非法场景、物品类型错误、未拥有物品、冲突试用项和编码失败都会回滚。

## 验证

定向验证：

```powershell
cd personal-server
node --test --test-concurrency=1 test/house-assistant.test.mjs test/house-assistant-gateway.test.mjs
```

结果：服务单元测试 6 项、真实 TCP 网关测试 1 项，共 7 项全部通过。网关测试覆盖登录模块 148、`88202`、`88201`、`88203`、`88204`，并断言四个类型均未进入 `LOCAL_NOT_IMPLEMENTED`。

合入最新 `main` 后执行 `npm test`：共 2385 项，pass 2383、fail 0、skipped 2。全量测试同时覆盖本功能与 `main` 上新增的百抽活动，合并后的路由注册未产生回归。

## 验收边界

本轮完成服务端与 TCP 协议验证。未重启当前实时服务，未修改或安装 APK，也未操作模拟器；因此真实客户端弹出错误是否消失仍需在部署新服务后由用户登录确认。
## 2026-11-08 零值场景兼容与旧结构迁移

### 复现与证据

- 实时库 `role 100001` 的模块 148 当前内容为：`res = [10023200, 10043200, 10063200, 20013200]`，`use = [{ scene_tid: 1, use_assistant: 10063200 }]`；主场景没有 `use_bg`，Support(2) 也没有记录。
- 客户端 `HouseAssistantMgr.ReqChangeSceneBg` 会遍历 `ASSISTANT_PLACE`，为每个场景构造 `{ scene_tid, assistant_tid = GetCurSceneTid(place) }`。没有选择背景的场景会传入 0；88201 的 `assistant_tid` 字段复用为背景物品 tid，protobuf 的 uint64 零值在服务端读到的就是 0 或缺省。
- 旧 `parseRequests()` 对每个 `assistant_tid` 调用 `positiveInteger()`，一条零值会让整个请求返回 `GameError(1, 'House-assistant item is invalid')`，网关记录 `house_assistant_rejected`，客户端显示“橘屋参数出错”。
- 客户端旧版 `pb_house_assistant_info_old` 把 `use_bg`、`use_assistant` 直接放在字段 2、3（varint）。用新的 `pb_house_assistant_info` 解码旧 payload 时，protobufjs 会静默跳过这两个字段，导致旧存档的选择丢失。

### 修复

- `88201`、`88202` 现在允许 `assistant_tid = 0`：0 表示该场景没有选择，跳过物品类型与拥有校验，并在 `use_bg` / `use_assistant` 中写入 `'0'`。非零物品仍执行原有场景、类型和拥有校验。
- `readState()` 先尝试旧结构；仅当旧结构确实带有选择（`use_bg > 0` 或 `use_assistant > 0`）时，将其转换为 `scene_tid = 1` 的新结构，否则按新结构解码。正常的新 payload 不会被旧结构误判。
- 返回的 `use` 行保留零值场景，客户端原有的默认展示补齐逻辑不受影响。

### 验证

定向测试：

```powershell
cd personal-server
node --test --test-concurrency=1 test/house-assistant.test.mjs test/house-assistant-gateway.test.mjs
```

结果：9 项全部通过。新增用例覆盖实时库同形态的单场景选择 payload、88201/88202 的零值场景请求，以及旧 `pb_house_assistant_info_old` payload 的迁移；真实 TCP 网关用例确认两个类型均未进入 `LOCAL_NOT_IMPLEMENTED`。

全量测试：在 worktree 的 `personal-server` 执行 `npm test`，共 2752 项，pass 2750、fail 0、skipped 2，日志 `analysis/test-runs/house-assistant-zero-20261108/full.log`。

### 验收边界

本轮只修改服务端代码和测试，未重启实时服务、未修改实时数据库、未操作模拟器或 APK。部署新服务后，进入橘屋或切换场景不再应因零值选择返回“橘屋参数出错”；仍需用户重启服务后实测确认。
