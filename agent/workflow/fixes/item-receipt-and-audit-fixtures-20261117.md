# N2 道具重试回执丢二进制与全量校验陈旧前置

状态：已修复并通过组件、真实临时 TCP 与全量派发审计；未部署、未做 APK 真机验收。

## 现象与证据

`analysis/test-runs/vell-basic-attack-20261116/full-numeric-audit.log`：3244项中3238通过、4失败、2跳过。4项分别为派发审计产物陈旧、专精 TCP 第一天被合法门禁309拦截、道具请求重试回执的extra未恢复Buffer、登录集成仍强求已撤回的虚构公会。

`analysis/test-runs/numeric-audit-20261117/focused-integration.log` 再次复现后三项。

## 根因、复盘与修复

- ItemBox `reviveValue` 只恢复顶层 changes[].new_bin，新增英雄奖励使用 extra（ETF序列化hero）后，在JSON回执重放时保留 `{type:'Buffer',data:[...]}`。相同的JSON二进制恢复问题在钱包已有处理，之前没有把所有回执消费者纳入验证。先利用已有失败的重试回归并增加重开库后的value/data相等断言，再递归恢复所有Buffer字段；保持回执中的原始data字节和幂等扣料。
- 专精 TCP 测试指定原开服时间与第二个业务日，不绕过1270门禁；合法开放后再验证659/660。
- 登录集成改为断言未建/未加入公会时guildId=0且没有虚构成员，继续验证所有模块和重登稳定性；不重新制造虚构公会让测试通过。
- 派发清单按现有工具重生成，保留全部1407条和差异计数；不篡改校验逻辑。

## 验证、防复发与边界

修复后结果：`receipt-and-validation-after.log` 17/17 通过，覆盖道具回执、派发审计、合法业务日、659/660 真实临时 TCP 和登录集成；`focused-final.log` 82/82 通过。道具回执检查第一次/重试/数据库重开后的 value 和 data 逐字节一致且只扣料一次。测试前置显式建立合法业务日和真实状态，不依赖旧 fixture 伪业务。仅代码、临时库和离线清单；未部署/操作运行库/设备/APK。
