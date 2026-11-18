# R3 抽到新英雄后小队不显示

故障发生：2026-11-18（UTC+08:00）；修复验证：2026-11-19；独立 worktree 基线：`820d977`。

## 现象与证据

- 用户反馈抽到角色后，小队再次找不到该角色。原工作目录日志 `analysis/experiments/launch-20261115/server-data-fixed/events.jsonl:37606` 记录 23:33:09 的普通招募 `601/seq459`；`37608` 的 `recruit_committed` 明确记录首次获得 `1020101`，不是重复抽取，也不是 601 拒绝。该日志不含原始回包，错误回包形状由源码与修复前测试重现。
- 已提取的客户端产物位于 `analysis/scratchpad/`：`mail-push-20261107/ResKit.lua.bin` L60 和 `ResMgr.lua.bin` L125 表明按 `change.tid` 的资源类型派发，不按 `extra` 的内容派发；同目录 `ResTable.data.lua.bin` 将本体类（`…01`）派给 `HeroRes`、碎片类（`…04`）派给 `ItemRes`。该英雄的对应碎片是 `21200104`。
- `time-temple-20261108/project/14258149367034044000-HeroRes.lua.bin` L59 只在英雄资源处理器里读取 ETF 二进制列表并调用 `HeroMgr.AddHeroes`。`8938649499070740000-ItemRes.lua.bin` L127 处理背包容器，不注册英雄。`1518078154846958800-HeroDrawMgr.lua.bin` L81 在回调解析资源后读取新英雄集合；`2408547250794972000-HeroDrawUILogic.lua.bin` L487 直接接受本体奖励为一张结果卡，只有碎片卡才按兑换数量展开。

## 根因与复发复盘

- 601 旧代码在碎片 `tid` 上写入正确格式的英雄 PB，客户端因资源类型不同把它送到 `ItemRes`，没有触发 `HeroRes → HeroMgr.AddHeroes`。614 碎片合成也把英雄 PB 挂在碎片扣除上，是同一缺口。
- [旧结果卡修复](recruit-result-no-card.md)只验证碎片能生成卡、`extra` 可解码及 `uid=tid`；[模块 10 修复](recruit-first-hero-ownership.md)解决持久快照。旧组件测试甚至直接从模块 10 取 UID 进行 209 编辑，未检查客户端在不重登时能否从 601 回包把英雄放入名单。
- 先补按资源 TID 检查的回归：单抽一张本体卡；十连首获走本体、同批及已拥有抽取走碎片；临时 TCP 从 601 英雄变化取得 UID 后立即 209，重开再读模块 10；614 的碎片扣除与英雄本体变化分开检验。

## 修复与防复发

- `601` 首次获得只发 `diff_num=1` 的英雄本体变更，`extra` 为 ETF 列表内嵌英雄 protobuf。已拥有（包括同一十连中先拿到、后又抽到）的结果才发 `Quality.convert_piece_new` 碎片。保持 `decompose_args=[]`，避免一抽产生额外结果卡。
- `614` 分别返回碎片扣除和英雄本体发放。两条路径共用 `grantResources` 的本体处理器，保留 `uid=tid`、招募库/合成来源与事务回滚；不改奖池、概率、保底、消耗配置或历史发放。
- 以后新增英雄即时发放必须按客户端资源派发断言 `change.tid`、数量和 `extra`；还要让 209 的 UID 来自发放回包，不能从 SQLite 或重登快照替代。模块 10 重登断言独立保留。

## 验证与未验证项

- 修复前，601 组件和临时 TCP 缺少英雄本体变更，614 仍把英雄 `extra` 附在负数碎片行；改后四个相关测试文件 50/50 通过，日志 `analysis/test-runs/recruit-squad-live-sync-20261118/focused.log`。
- 临时 TCP 从 601 本体变更取得 UID，同一连接立即 209 上阵，重开 SQLite 后登录模块 9/10 仍有原编队及英雄；覆盖单抽、同批重复、普通重复、614 合成/重复拒绝和编码失败回滚。
- Windows 下 `npm run test:all` 因启动参数过长报 `ENAMETOOLONG`（同目录 `npm-test-all-launch.log`）。在 `personal-server/` 用 `node --test --test-concurrency=2 --test-reporter=tap "test/*.test.mjs"` 跑完 338 个文件：3306 项，3303 通过、1 失败、2 跳过；同目录 `all.log`。唯一失败是基线的命令分派审计快照过期：`gateway.mjs`、`static-interfaces.json` 及审计快照均与 `820d977` 对应工作树内容无改动，两个输入的 SHA256 已与快照声明不符。本次不修改该快照。
- 未部署，未读取或改写实时 SQLite，未操作设备/APK。本次仅验证服务端和临时 TCP，不等于客户端界面验收。部署后先用原账号重登查看已获得的 `1020101`，无需为确认它再次抽卡；新的即时显示待 APK 验收。
