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
