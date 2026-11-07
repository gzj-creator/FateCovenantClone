# Personal-server workflow

2026-11-07：[月度战令任务经验领取后进度仍为 0](monthly-pass-exp-progress-20261107/implementation.md)。`105804` 旧路径只增加 `buy_exp_num`，没有发放 `10004200` 经验资源；现已改为同事务发放经验并返回资源变化，增加旧 `task_get` 的一次性幂等补偿。定向月战令/真实 TCP 16/16、全量 2314 项（pass 2312、skipped 2）通过。

2026-11-01：[商店、装备与套装箱的配置表证据](interface-catalog/config-table-evidence.md)。三张此前无法落地的配置表已从客户端产物取全：装备表从字节码转成服务可读 dump（80 件装备、2000 行按类型分键的等级消耗、6 个格子上限），接入 `config/equip-tables.mjs` 并有 4 项断言；`OptionalSuitBox`/`OptionalSuitRes` 加入物品表读取，155 `use_selected_suit_box` 已按“range 的 1 基位置选套装并整包发奖”实现并有 5 项测试，非选择式开箱遇到套装箱改为明确拒绝。接口目录里 153 与 155 的类型号错位一并纠正。商店 1201/1203 的价格分档算法已从 `ShopBase` 解出，但 `buy_count` 重置、`shop.version` 递增和 1204/1206 字段仍缺运行时证据，购买接口继续返回明确未实现。真实套装箱奖励是 Relic 圣器，本机还没有 `9:Relic` 奖励处理器，发奖仍显式失败。

2026-11-01：[幻武旧护佑引用导致重启后登录超时](relic-divine-activities/implementation.md#2026-11-01-登录幻武护佑引用自愈)。模块 518 的旧库存含自引用、缺失 UID 和重复所有者，导致 `909103` 登录初始化异常后无回包；现已在登录态初始化中做幂等清理，只移除非法护佑引用并保留 10 件装备、等级和水位线。全量 519/519 通过，实时服务已部署，客户端重登成功。

2026-11-01：[图鉴与七个后期系统整体验收](system-completion/acceptance.md)。图鉴、团员名册、法阵、星魂卷轴、训练、船舱和时空神殿均已由独立 worktree 完成可证实现并合入集成分支；联合登录检查 module 10/24/114/156/157/159 无重复、互不覆盖，SQLite 重开后保持。合并最新 `main` 后全量 402/402。验收层级为组件、真实登录 ETF、临时 loopback TCP 和临时 SQLite；未部署实时服务，未操作 ADB/MuMu/APK，未做 UI/视觉验收，也未生成 APK 快照。时空神殿 8 个 C2S 请求仍缺数字命令证据，除登录态与 7801 推送外保持阻塞。

2026-11-01：[船舱模块 114 解锁与上阵](cabin/implementation.md)。已实现 83201 req_unlock_cell、83202 re_place_hero 的一键多组提交、同批原子换位和登录模块 114 按等级重建；10 个服务测试和真实临时 TCP 网关测试通过，全量 326/326。尚未部署，未做 APK/UI 验收；房间升级、任务、交互、奖励领取和加速没有协议证据，保持未实现。

2026-10-31：[限购礼包错误日志 ID 修复](fixes/purchase-limit-error.md)。`wallet-service` 原先先查余额后查限购，售罄且余额不足时 QuickSDK 误报 `301/80000`；现已调整为先限购后余额，真实本机 SDK 对已售罄 `40010` 返回 `307/80001`，全量 `275/275` 通过，实时服务 PID 以 `server.local-only.json` 为准。

2026-10-31：[特聘券购买扣钻但券不即显修复](fixes/recruit-purchase-ticket-sync.md)。type 599 购买已在服务端事务扣星钻并写入特聘券 `3002`，但物品发放的 `pb_res_change` 缺少 `new_bin`，客户端 `AwardKit.Parse` 无法即时建立或刷新资源对象。物品发放回包现附完整 `pb_res_obj { tid, num }`；普通/特聘买券回归均校验解码后的新数量，最新 `main@5e354e7` 合并后全量 `271/271` 通过，worktree 服务 PID `18688`，真实 APK 再次购买验收待用户操作。

2026-10-31：[招募首次角色、次数/积分与半神补券修复](recruitment/implementation.md)。首英雄现在返回完整碎片卡包并即时写入英雄/模块 10，`uid=tid` 修复小队不可见；模块 21/75/77901 更新招募次数和积分。半神 type 87618 改为模块 518 下的补券、扣券、抽取、幻武入库事务，不再只扣星钻。`main@f32e4ac` 已通过 `d0cb52a` 合入，定向 28/28、全量 257/257 通过，并已从合并 worktree 部署新 PID `43432`。真实 APK 验收待用户点击，详见[首次角色修复](fixes/recruit-result-no-card.md)。

2026-10-30 21:33：[百元累充领取修复](acc-recharge/implementation.md#2026-10-30-百元累充-92001-领取修复)。真实客户端 `92001 req_hundred_acc` 旧网关返回 `LOCAL_NOT_IMPLEMENTED:92001`；已在独立 worktree 实现模块 166 首档事务领取、奖励发放、防重与重开验证，170/170 测试通过并从 worktree 部署，新 PID 以 `server.local-only.json` 为准。4 个实际变化文件已同步回 `main`，主目录 170/170 复验通过。真实点击验收待用户执行。

2026-10-30 13:33：[累充活动奖励领取](acc-recharge/implementation.md)。旧网关未实现 `98620 req_acc_recharge_act_get_award`，领取时返回 `LOCAL_NOT_IMPLEMENTED:98620`；现已按活动 106036/版本 36 实现事务领取、奖励发放、模块 106 状态和防重，167/167 测试通过并已部署（实时 PID 以状态文件为准）。真实客户端领取仍待用户点击验收。

2026-10-28 最新：[客户端资源：主界面看板娘缺失修复](client-resource/implementation.md)。隔离包 com.jzyx.ps 的 SubDownloadFinish=0 导致 sub_first 资源误入 RemoteLoadMgr，AddRemoteLoad 失败并在 6000 帧后报 MissAsset；写入 SubDownloadFinish=1 后截图确认看板娘恢复，修复后日志无 AddRemoteLoad/timeout/MissAsset。该值不在 APK 内，重装/清数据后需重设。当前可用快照保存在 apk/com.jzyx.ps.v9-working.apk（4,185,758,901 字节，SHA256 1fd5fe0a...），不提交 Git；说明见 apk/README.md。

2026-10-25 23:59交接：[下一session提示词](../../promot/2026-10-25-wallet-admin-handoff.md)。真实APK注册登录成功，三项79104任务领奖入SQLite；92项测试。管理页18883在线，账户余额0、订单0，待用户后台加钱后验证游戏充值。保持服务/隔离客户端和reverse运行，勿按旧采集记录清理。

2026-10-25 23:44最新：[账户余额与Web管理](wallet-admin/implementation.md)及[冲榜任务领奖](activity-ranking/implementation.md)已部署。91/91组件通过，真实TCP1900/16003和管理页桌面/手机测试通过；v8b隔离APK安装并重开。服务新增18883管理页，原有存档保留，游戏内充值/领奖等待用户验收。账号加款与余额扣费落SQLite，密钥仅保存在local-only文件。

2026-10-25 22:14最新：[小队、养成与SQLite](gameplay-state/implementation.md)用户已验收“小队能进，升级升星正常”；真实209/208/639/636提交与SQLite扣费/状态一致。新增小队版本切换218，修正module9两层解析，SQLite v2迁移保留养成；75/75测试通过。服务PID38232（实时状态文件为准）、隔离客户端和网络隔离保持运行。以下待验与小队未实现均为旧记录。

2026-10-25 22:05：[玩法状态与SQLite](gameplay-state/implementation.md)已实现升级636、突破638、普通升星639，SQLite分表、JSON一次迁移、事务扣费和重启恢复通过组件测试，统一72/72。已部署并重开隔离客户端，APK养成操作待用户确认。代码按game/storage/protocol/config分目录。服务/隔离/reverse保留供验证。

2026-10-25 21:31当前：隔离v7 APK已实际进入本机服大厅，SDK双层登录、userStatus、区服preferred_login_servers、网关握手/登录数据均有运行证据；用户确认与截图一致。63项组件测试通过。原版被动采集已停止，两轮480条解码游戏负载；现为用户参与本机服联调，root=true、UID10042隔离及reverse保留。最新实操：[SDK登录](sdk-login/implementation.md)、[大厅初始化](login-initialization/implementation.md)。下方“采集中/未登录/已清理”是历史。

大厅可见不等于完整可玩。初始化为离线结构fixture，type208/209编队、2011排行榜、战斗/招募/养成仍待实现；活动计时和首充资源有已知异常。当前不自动启停用户验证中的客户端或服务。

每完成一个大任务节点，立即在本目录对应子目录保存细节文档。记录实际步骤、复现命令、证据、验收结果和遗留问题；不能将源码或组件测试通过视为 APK 验收。

当前顺序：先核实接入、配置、签名、编码、加密、会话及采集工具，再由用户操作、agent 关联业务接口。最终登录目标仍为隔离 APK 接入自有服并进入大厅。

2026-10-25 原版被动采集已验证登录/大厅、手动第三位上阵和一场完整战斗。统一接口目录与动态覆盖见[接口目录](interface-catalog/README.md)及[覆盖表](interface-catalog/coverage.md)。这是原版用户正常游玩的证据，不代表隔离 APK 已登录自有服。本轮已按用户要求保存并交接，采集停止并清理、root设置false且su不可用，游戏未停止或重启。接替见[最新提示词](../../promot/2026-10-25-protocol-capture-handoff.md)。

后续[角色突破及升级](capture-workflow/hero-progression.md)已新增一次操作采样。当前解码覆盖只验收即时PB/ETF及已定向核对的嵌套字段；战斗动作、奖励和持久化仍需单独验证。

| 节点 | 文档 | 状态 |
| --- | --- | --- |
| 前置条件 | [核对总表](protocol-prerequisites/implementation.md) | 区分静态契约、本机对照和 APK 验收 |
| 客户端改址 | [实操记录](client-endpoint/implementation.md) | v2 已安装，APK 实际采用本机地址 |
| 启动版本 | [实操记录](startup-version/implementation.md) | APK 接受本地版本文件并进入 SDK 登录页 |
| SDK 登录 | [实操](sdk-login/implementation.md) | v7双层登录和平台状态真实通过，任意4位本机验证码 |
| 网关握手 | [加密核对](gateway-handshake/crypto.md) | 本机服真实APK握手接受；可选包加密仅组件验证 |
| 登录初始化 | [实操](login-initialization/implementation.md) | 本机大厅显示通过；fixture与玩法完整性有缺口 |
| 玩法状态 | [小队、养成与SQLite](gameplay-state/implementation.md) | 用户确认小队/升级/升星正常；SQLite v2；突破及完整进星仅组件，战斗结算待实现 |
| 客户端资源 | [看板娘与 sub_first 远程加载](client-resource/implementation.md) | SubDownloadFinish=1 实测恢复看板娘；APK 快照 apk/com.jzyx.ps.v9-working.apk，prefs 未烘焙 |
| 操作采集 | [首次登录](capture-workflow/login-decode.md)、[战斗与编队](capture-workflow/battle-and-lineup.md) | 原版登录、上阵与战斗有操作证据，后续功能逐步解锁 |
| 接口目录 | [统一目录](interface-catalog/README.md) | 静态与动态分列，未触发/未解锁/未知均保留缺口 |

旧证据保留在 `analysis/`，细节文档引用原文件，不重复复制大报告和敏感配置。

下一agent任务：[用户操作与全接口目录采集](../../promot/2026-10-25-protocol-capture-next-agent.md)；用户配合方式：[游玩清单](capture-workflow/player-checklist.md)。
