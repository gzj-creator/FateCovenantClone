# 本机大厅初始化验收

更新：2026-10-25 21:31，Asia/Singapore。

## 运行证据

隔离v7于21:29:07接受preferred_login_servers的pb_login_servers，21:29:08连接本机19090；21:29:09.105发送99字节challenge，.117收到通过验证的reply，.130发送909103的ETF登录四元组。login_sent记录原始146条模块pair，其中145个去重模块；Map转换沿用已有实现。verify_code实际原样使用本机QuickSDK的已签发token，verifySession校验通过，不需要恢复历史原服的@数字载体，也未无条件绕过会话校验。

用户确认“已出现区服或进入大厅”；随后ADB截图明确显示Local Adventurer、9级、战力7224、本机大厅及旅途/小队/招募入口。至21:29:40仍有心跳。只验收preferred_login_servers路径，不能据此宣布其他区服操作均已由APK验收。

证据：analysis/experiments/private-server-20261025/p3/server.stdout.local-only.log、hall-login.local-only.log、hall.local-only.png；runtime.local-only.data/state.local-only.json为当前独立本机存档，勿覆盖旧存档或原应用数据。

## 数据来源及边界

local-game.mjs从已停止录制r2a的game:tcp-69:s2c:103离线结构fixture初始化，仅本机使用。身份role100001/server1、昵称、本机登录时间与跨服空成员被替换；其他模块大部分仍为采集时的早期状态，非独立重建全部规则，不可称完整个人服务器。ETF库目前来自analysis/tools/protocol/node_modules/erlang_js，尚未纳入personal-server依赖。

已接入帧头/握手/登录、心跳、少量初始化空读和8000引导保存。引导记录目前保存但没有全部合回登录模块，不能声称重启引导恢复完成。

## 已知缺口

- 首次初始化遇到209/208编队命令，明确返回LOCAL_NOT_IMPLEMENTED；2011 req_batch_get_rank_backup同样未实现。原始登录fixture显示大厅不代表初始化零错误。
- 战斗、结算、奖励、角色升级/突破、招募与其持久化待实现和用户操作验收。不要对未知命令统一回成功。
- 大厅活动显示约2075天倒计时，说明fixture的活动时间/时钟仍未归一化。
- hall-login.local-only.log记录MainHouseForm入口uires/pic_sc_susu02.bundle加载异常，涉及LineFirstRechargeEntrance.lua:83。截图能显示大厅，但资源/入口交互仍需修复，未验收完整UI无错误。
- 广告/埋点、公告等HTTP仍有404。未知URL只保留pathSha256；部分已对应sdk/tracker/log及ad/api/active，不混作登录失败。

下一步由用户逐项操作可见功能，优先小队/编队→旅途/战斗。agent读取本地日志，复用统一接口目录的已恢复契约逐项实现。用户验证期间保持客户端和服务运行，不为记文档重启。
