# ROLE-ROLE 实现记录

日期：2026-11-08。分支：`feat/block-j-role-support`。范围：J 块 #266。

## 状态

服务端完成，客户端静态表与字节码证据已补。未做 APK 验收。

## 客户端证据

- `RoleTable.data.lua`：`ChangeName[1]` 为 `101500 x200`，名字长度 1–6；`WatchVideoAward[1].reward` 为 `101500 x50`；`FigureRank` 含等级、战力、道具与奖励门槛；`FigureConst`、姓名前后缀及 `VeteranConst` 可解析。
- `RoleFigureMgr.lua`：稳定外观 BitBlock 的 head/frame/title/bubble offset 分别为 1000/2000/3000；位序号由 `floor((tid-8)/100)-offset` 得到。
- `RoleCmd.lua` 与 `RoleMgr.lua`：确认 1301–1317 及 111/112 的客户端入口。`VeteranConst` 只提供跳过后的角色/任务/背包初始化内容，不提供新旧账号资格门槛。

## 实现

- 命令：104–112、1301–1315、1317；1316 沿用共享属性实现。
- 改名、等级奖、FigureRank、视频奖励、姓名词缀均从客户端表读取。
- 权威状态落在 `roles.profile_json`、`role_profile_extra`、`role_figure_items`、`reward_claims`，同一事务内完成状态和回包编码。
- 修复稳定外观已有 BitBlock 时 `ownedFigure()` 仍判未拥有的缺陷；称号位图使用正确偏移。
- 111/112 在未显式提供 `veteranConfig` 时使用本地保守策略；资格规则没有客户端权威来源。

## 验证

- `test/block-j-role-support.test.mjs` 覆盖改名、随机名、等级奖、FigureRank、视频奖励、姓名占用、稳定 BitBlock 与 Veteran 显式策略。
- 专项 13/13 通过；临时 loopback TCP 覆盖登录和 161，不把 ROLE-ROLE 的其余命令宣称为 APK 实测。
- 合并最新 main 后全量 `npm test`：2734 项，pass 2732、fail 0、skipped 2；日志 `analysis/test-runs/gameplay-20261106/block-j-after-main-full.log`。

## 缺口

- 111/112 的“旧账号等级/天数/任务条件”没有客户端规则。当前本地策略和空奖励只用于安全兜底，不能视为原服事实。
- 未操作 APK，未验证客户端实际动画、红点与奖励展示。未启停实时服务、未读写运行数据库。
