# 接替提示词：FateCovenantClone 个人服务器（战斗回放缺口 + 六项收尾）

你是接替 Codex 的主 agent。项目根目录 `F:\projects\FateCovenantClone`（Windows PowerShell）。先读：`AGENTS.md`、本提示词、`docs/07-private-server-feature-execution-plan.md`、`personal-server/README.md`、`agent/workflow/fixes/README.md` 与其中 `mission-fight.md`、`hall-entry.md`、`item-box.md`、`fishing-act.md`、`helpup-act.md`、`pet-spirit.md`、`wallet-balance.md`。以工作区实时状态为准，本文件里的 PID/连接状态只是 2026-10-26 09:35 快照。

## 当前实时状态快照（必须重新核对）

- Git：基线 `26982a4`；已提交 `43111c8`（六项首轮实现）、`3375dc2`（大厅 1202/53002 + mission_id-only 201）、`77862a4`（战斗回放门控）。工作区仍有大量不属于个人服务器的未跟踪产物，不得提交或删除。
- 个人服务器进程：写本提示词时 **已不在运行**（原 PID 26172 已消失，18880/18881/18882/18883/19090 无监听）。上一 session 的 `Start-Process` 随会话中断被终止。
- ADB：adb server 已重启，`127.0.0.1:16448` 当前未连接，四条 `adb reverse` 已丢失。必须先 `adb connect 127.0.0.1:16448`，再按 `analysis/experiments/private-server-20261025/p3/network-state.local-only.json` 恢复 `18880/18881/18882/19090` 四条 reverse，并只操作该序列号。
- 设备隔离：UID 10042 的 iptables/BPF 链上次检查仍在；用 `powershell -File tools/local-server-device.ps1 -Action Status` 只读复核后再 `-Action Launch`。
- 运行数据目录：`analysis/experiments/private-server-20261025/p3/runtime.local-only.data/`。SQLite v2、`integrity=ok`；`mission_id=20205`、`pass_count=9`、145 个登录模块、6 英雄、15 资源、钱包余额 0、订单 0、claims 3（已用 `deploy-20261026-0900` 一致备份恢复过战斗误推进）。
- Web 管理：`http://127.0.0.1:18883/`，密钥文件 `runtime.local-only.data/admin-key.local-only.txt`，**不得输出密钥**。
- 客户端账号：普通账号 `localtest` / `Local2026!`；手机账号 `19900000000` + 任意 4 位验证码。
- 当前服务不跑，客户端状态未知；用户需要你在恢复环境后自行判断并让其登录。

## 恢复环境的顺序

```powershell
adb connect 127.0.0.1:16448
adb -s 127.0.0.1:16448 devices -l
powershell -NoProfile -ExecutionPolicy Bypass -File tools/local-server-device.ps1 -Action Status
```

确认进程与端口无残留后启动（Hidden，日志重定向到 runtime.local-only.data）：

```powershell
$root='F:\projects\FateCovenantClone'
$dir=Join-Path $root 'analysis\experiments\private-server-20261025\p3\runtime.local-only.data'
Start-Process -FilePath 'F:\node\node.exe' -ArgumentList 'personal-server/local-server.mjs' -WorkingDirectory $root -WindowStyle Hidden `
  -RedirectStandardOutput (Join-Path $dir 'server-handoff.local-only.log') `
  -RedirectStandardError (Join-Path $dir 'server-handoff.local-only.err') -PassThru
```

然后：读 `server.local-only.json` 核对新 PID、确认五端口 loopback、stderr 为空、管理页 200；恢复 reverse：

```powershell
foreach($port in 18880,18881,18882,19090){ adb -s 127.0.0.1:16448 reverse "tcp:$port" "tcp:$port" }
adb -s 127.0.0.1:16448 reverse --list
```

最后 `tools/local-server-device.ps1 -Action Launch` 启动 `com.jzyx.ps`，截图确认处于登录/大厅；**不要操作原版 `com.jzyx.my`**，不要点击游戏代用户完成交易或领奖。

## 已完成与验收边界

- W1 余额充值：管理加款、余额购买、订单/流水/SQLite、防重测试已通过；真实 6 元商品购买仍需用户操作与视觉确认。
- G2 宝箱：仅 `Random_Box`+`DrawTable` 权重且无保底；实测宝箱 `2261200` Type 84、draw_lib 472。选择/付费/未知规则明确 code 5 拒绝。等等待用户开启确认。
- G3 海岛垂钓：110308/110303 空读取、116004 times=0；垂钓/领奖明确拒绝。入口打开待用户确认。
- G4 超凡冒险者、G5 新超凡魔灵：仍缺真实请求证据；用户点击后按 `events.jsonl` 的 `unsupported_command`/`payloadHead` 定位（候选模块 158/160/92059、命令 905xx/90731-90748/909xx）。不得按中文名猜映射或伪造奖励/概率。
- H1 大厅错误：1202 按请求 shop id 返回空商品组、53002 空 change_list；商店购买与真实阶段推进仍未实现。
- 统一测试：`npm test --prefix personal-server` = **104/104 通过**。

## 当前唯一硬阻塞：G1 主线战斗回放

事实（已由 APK 实测与 Lua 字节码确认）：

- MissionUIMgr 普通关卡只编码 `mission_fight_req{mission_id,is_assistant}`，`chapter_tid/section_idx` 为默认 0；现服务已接受（`3375dc2`）。
- 客户端普通主线固定 `PLAY_TYPE.NORMAL`，一定 `FightScene.StaticOpenToFight` 并播放 `report.battle_list[].action_list`，不是“服务端结算即弹结果”。
- 空战报会导致 `input\FightSceneFightState.lua.txt:192 attempt to index field 'unscaledStepScheduler' (a nil value)` 每帧刷屏、无角色、卡死。现用 `playbackEnabled` 默认关闭，201 返回业务 code 5（客户端显示“配置出错了”），不再卡死。
- 动作项格式：`pb_generic{int32 proto, bytes bin}`，`bin` 为对应 `pb_fat_*`（round_ready / action_before / harm / fighter_die / battle_over 等），FightParseCtxMgr 用 `ProtobufKey` 查 schema 名再 `Codec.DecodePB`。
- 原服战报结构（`agent/workflow/capture-workflow/battle-and-lineup.md`）：battle_list=1、攻方 brief lineup 3、fighter_list 11 实体、action_list 71-74 条；`stm` 在 201 与 207 完全相同。
- FightMgr proto12：`stmType==STM_TYPE_SYNC` 才 ImmediateSettlement；`report.finish` 只在 `PLAY_TYPE.WITHOUT` 分支直接开结果；`stm.exception` 分支只 `StaticOutFightScene` 退出、不结算。

下一步（按证据推进，不伪造奖励）：

1. 从 lua-bundles 提取 `FightTable` 等必要配置（参考 `analysis/tools/dump-lua-file.mjs` 生成 `DrawTable.data.lua.json` 的方式），确认 fight tid 的敌方阵容、`skip`、自定义字段和 `STM_TYPE`。
2. 用请求 `loc` + 本机英雄表构造攻方 `pb_fighter_base_info` 与 `atk_brief_lineup`，用 FightTable 构造守方；字段至少含 tid/role/team/team_index/loc/level/star/hp/max_hp/style。
3. 生成最小可播 action 序列（`pb_generic(proto=pb_fat_round_ready / pb_fat_harm / pb_fat_battle_over, bin=...)`），先离线用 codec 编解码并写组件测试；确认客户端能接受后再打开 `playbackEnabled`。
4. 若最小战报仍无法播放，明确记录失败证据并保持 201 拒绝，不得用空壳或伪造奖励强行标成可玩。
5. 组件测试用 `personal-server/test/`，真实网关测试必须用临时端口 + 从一致备份复制的临时库；绝不向运行库写测试数据。

## 约束

- 仅 `personal-server/` 内代码、测试、fixture 与必要文档可提交；客户端复刻资料、Unity、ADB 工具、analysis 产物不提交。
- 不删除或覆盖运行库、WAL、管理员/服务器密钥、本地私有配置；不输出密钥。
- 用户自己加款、购买、点击、领奖；agent 不代点，不停止/重启原版、不修改 UID 隔离与 reverse（只允许恢复已记录的既有 reverse）。
- 每次改动后跑全套测试并记录数字；没有 APK 实测与用户视觉确认的功能一律标“未验收”。
- 每项工作完成后更新 `agent/workflow/fixes/<feature>.md` 与 `docs/07` 状态，提交信息写清根因与边界。
