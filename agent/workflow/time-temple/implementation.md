# 时空神殿协议与登录实现

更新：2026-11-01。当前只交付客户端证据能够闭合的 module 159 登录态与 S2C 7801 推送载荷。八个请求编码器的数字 Cmd 映射缺失，业务路由、资源变化和概率规则未实现，不能把本分支称为“时空神殿可玩”。

## 证据链

| 层 | 已确认证据 | 结论 |
| --- | --- | --- |
| 界面/Manager | `TimeTempleMainForm`、详情/抽取/培养等表单；`TimeTempleMgr` 原型含 `DecodePB(pb_time_temple_data)`、`UpdatePbData`、`RevDrawUpdateMsg` | 页面属于 `project/time_temple`，module 159 是神殿完整状态，S2C 7801 更新抽取信息 |
| 请求 Cmd | `TimeTempleCmd.lua.bin` 原型 0-7 定义 8 个 `req_time_temple_*` 编码器 | 可确认请求名称、编码器和参数构造，不能确认线上数字 type |
| 请求 schema | `req_time_temple_runes_skill_select` 使用 `Codec.EncodePB('pb_time_temple_select_runes_skills', { select_runes })`；其余七项调用 `Codec.EncodeErl` | 两条编码路径均有静态证据 |
| 登录 module | 本地真实登录 ETF `game:tcp-69:s2c:103` 含 module 159；值形状是单元素 ETF 列表，唯一元素为 0 字节二进制 | `pb_time_temple_data` 解码为 `bond_data=[]`、`runes_data=[]`、`god_data=[]`、`select_runes=[]`；重编码仍为 0 字节 |
| 推送 | `Cmd.lua.json` 同时把 `rev_time_tempe_draw_msg` 映射为 wire type 7801；`Port.lua` 分发到 `TimeTempleMgr.RevDrawUpdateMsg` | 7801 的 envelope 为 `pb_s2c`，payload schema 为 `pb_time_temple_draw` |
| 状态 schema | `time_temple.db.proto.bin` 定义 `pb_time_temple_data`、`pb_time_temple_bond`、`pb_time_temple_runes`、`pb_time_temple_god`、`pb_time_temple_season_runes`、`pb_time_temple_draw`、`pb_time_temple_limit_gift` | 字段号、类型和嵌套关系已固化，见 `static-evidence.json` |
| 推送 schema | `pb_time_temple_draw` 字段 1-4 为 `season_id:uint32`、`draw_num:uint32`、`award_phase_num:uint32`、`award_state:bytes` | 推送可编码、可反向解码；触发时机仍未观察到 |
| 配置 | `TimeTempleTable.lua.bin` 与 `TimeTempleTable.data.lua.bin` 存在 | 配置表名称可证，等级、消耗、概率、奖池和保底语义尚未逐字段闭合 |

详细哈希、命令名和 schema 字段见 [static-evidence.json](static-evidence.json)。

## 已实现

- `personal-server/game/time-temple-service.mjs`
  - 登录时检查 module 159。缺失时创建取证得到的稳定空态：单元素 ETF 列表 + 0 字节 `pb_time_temple_data`。
  - 已有 module 必须保持观测到的列表形状；首槽损坏或 protobuf 不可解码时显式拒绝，不覆盖未知状态。
  - 提供严格的 `pb_time_temple_draw` 编码器与 `publishDraw`：仅接受 uint32 字段和字节 `award_state`，通过现有订阅者机制发送 type 7801。
  - 没有把“发布一个合法推送”伪装成抽取、奖励或概率业务完成；也没有建立任何未证实的定时或自动触发。
- `personal-server/game/gateway.mjs`
  - 登录 payload 生成前调用 `timeTemple.ensureLoginState()`。
  - 返回 `timeTemple` 服务用于临时集成测试和后续已证实业务接入。

## 验证

专项命令：

```powershell
node --test test/time-temple-service.test.mjs
```

结果：1/1 通过。测试覆盖：

1. 删除 module 159 后重新登录，服务端补回稳定空态并写入 SQLite。
2. 登录 ETF 中 module 159 保持“单元素列表 + 0 字节 protobuf”。
3. 关闭并重开同一 SQLite 数据库后再次登录，空态仍存在。
4. 通过真实临时 TCP 握手/登录后调用 `publishDraw`，客户端侧收到 type 7801，payload 可反解。
5. 负数 uint32 和非字节 `award_state` 被拒绝。

验收层级仅为组件、临时 TCP 和 SQLite 重开。未部署运行服务，未生成 APK，未操作模拟器，因此不代表 APK 实测或用户视觉验收。

## 阻塞：请求数字 Cmd 未映射

以下八个编码器只存在于 `TimeTempleCmd.lua.bin`，在候选客户端下载物的 `Cmd.lua.json`、`Port.lua.json`、`Connection.lua.json` 以及其他 `Cmd.lua.json` 中没有数字 `c2s` / `c2s_index` 映射；`Cmd.lua.json` 只含 S2C 7801：

| 请求编码器 | 当前可证编码 | 数字 type |
| --- | --- | ---: |
| `req_time_temple_embryo_up` | ETF | 未找到 |
| `req_time_temple_bond_up` | ETF | 未找到 |
| `req_time_temple_runes_collect` | ETF | 未找到 |
| `req_time_temple_runes_up` | ETF | 未找到 |
| `req_time_temple_runes_skill_select` | PB `pb_time_temple_select_runes_skills` | 未找到 |
| `req_time_temple_god_up` | ETF | 未找到 |
| `req_time_temple_season_shop` | ETF | 未找到 |
| `req_time_temple_draw_award` | ETF | 未找到 |

有界搜索只覆盖已下载候选包中的上述映射文件；它证明当前包内没有可用数字映射，不声称请求在客户端其他地方永不注册。

因此本分支不添加猜测的网关分支：错误数字会把 `LOCAL_NOT_IMPLEMENTED` 变成错误业务路由。解除阻塞需要取得已解锁时空神殿的运行时请求，记录 `pb_c2s.type` 与 seq，再关联 Manager 调用和回包；随后还需补齐各操作配置、资源事务、重复领取/保底边界及 response schema。

## 未覆盖

- 神殿抽取、胚胎升级、羁绊升级、符文收集/升级/技能选择、神格升级、季商店、抽奖奖励领取。
- 冷却、刷新时间、奖池概率、保底、价格、资源扣除和奖励发放。
- 7801 的真实游戏触发时机；当前只证明载荷格式与发送通道。
- 运行服务部署、APK、模拟器、用户视觉验收。
