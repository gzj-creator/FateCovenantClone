# 名人堂条件、在线开放协议与空服登录修复

日期：2026-11-14。此记录只覆盖静态原版规则和临时 SQLite/TCP 测试；未接触运行服务、在线数据库、ADB 或 APK，没有客户端可玩验收。

## 原版条件

`FunOpenTable.TID_FAME_HALL=1218`。`FunOpen(1218)` 为 target1、switch0、sys_switch161，asserts 为 `955132601037` 和 `983580210601`，tip_params 为 `[[32],[2]]`。`Show(1218)` 不存在，所以 `FunOpenMgr.GetFunAsserts` 使用原行的断言。

- `MethodScript` proto202、源行425：Method3 比较 DynamicArg1 与32，恢复为角色等级 >=32。
- `MethodScript` proto35、源行91：Method3 比较 DynamicArg4 与2，恢复为开服日 >=2。
- `MethodTable` 的 Method3 是 `EGreaterThan`，DynamicArgs1/4 分别调用 `GetRoleLv` / `GetServerOpenDay`。
- `FunOpenData.Check` proto8、源行82，pc17将结果置true，pc29–31仅在当前结果非false时采纳下一个断言，pc46–51仅最终结果非false才请求开放。这是所有断言的 AND。
- 客户端另用 `ModuleSwitch.IsOpen(161)` 屏蔽模块入口；服务端现有条件引擎不实现该客户端模块配置，以上两个数值条件不是绕过模块开关的理由。

提取器以前把所有多断言都标记缺口；现只对无 `Show` 动态替换且每个断言都已恢复的行生成 AND。原8行Show保持缺口。523行中ready从164变为176，gap从359变为347；新增12行，不撤销原ready行。

另修 `indexMethodScripts` 仅接受TDUP参数列表的遗漏：原脚本也会用 `TNEW d=0` 表示无动态参数。索引从1014增至1880个函数（新增866个空参数列表）；271个开放断言全部命中，但其中只有85个断言属于已支持的数值表达式，其余仍明确缺口。

## 已证实的两个实现错误

### 7201把分组ID当功能ID

`FunOpenMgr.RevFunOpenNotify` proto33、源行527，将 `{message.target_tid}` 传给 `OpenFunAndNotify`；后者proto42、源行624对每个完整功能ID调用 `GetFunData` / `UnPackFunId` / `BitBlock.Set`。它不会使用extra数据Reset整段bitmap。

旧实现把 `target_tid=1` 和 `extra_ret_list=[{flag:1,data:整段bitmap}]` 发给客户端。1是登录 `target_list` 使用的分组ID，不是此通知中的完整功能ID。现对每个新功能单独发7201，例如1218，extra为空。`fun_open_to_client.flag` 原注释是自定义数据标识，不是加位操作码。测试已按独立客户端消费方式检查每条通知与持久化位图一致。

7000继续确认尚未恢复的客户端表达式，包括1054，避免大厅等待。已恢复的规则重新核对条件；过早请求1218在 `fail_id_list` 返回，不设置其开放位。没有全面拒绝7000。

### 空库首号在创角前读取功能位

真实临时TCP复现：空库→握手成功→909103→`Game database has no role`→断线。原因是网关先调用 `features.openIds()` 判门禁，随后才到 `resolveAccount()`。现仅ready阶段执行功能门禁；尚未登录阶段已有只允许909101/909102/909103的检查。保留已登录连接门禁和登录验证。

## 1级弹窗的定位边界

以下证据排除了几种直接猜测，但没有闭合用户弹出名人堂引导的根因，FID-005不能据本记录关闭：

1. 当前v11 64位Bundle里的GuideTable与调查文件SHA256相同；32/64位Guide表都没有 `GuideFameHallFirstEnterStep` 引用。当前718条Step没有此模块；类脚本自身存在不等于它被配置为引导步骤。
2. project目录对 `FameHallFirstEnterForm` 的引用只在该脚本、表单自身和ProjectAssets资产索引中；这是有界静态搜索，不能排除外部资源或运行期入口。
3. 模块161确认为 `FameHallMgr`。结构fixture和freshAccount生成的161都没有阶段、难度、英雄或client_show残留；freshAccount的模块3开放位和模块16引导记录为空。
4. `local-new-user-debug-20261114-1425/server-data-01/events.jsonl` 的实际7000请求中没有1218。不能宣称这些日志证明客户端曾请求提前解锁名人堂。
5. 已持久化的错误开放位没有在本次启动时自动删除；如需修受影响存档，须先预览真实字段与规则，不做全量清引导或清开放位。

下一步需要用户现场对应的表单/引导ID、实际登录模块与本地角色Storage状态，核对资源是否来自更新目录。不能以关闭玩法或猜测额外门槛代替根因定位。

## 修改与验证

修改文件：`tools/extract-fun-open-rules.mjs`、`personal-server/config/fun-open-rules.json`、`personal-server/game/feature-service.mjs`、`personal-server/game/gateway.mjs`的登录前门禁、`personal-server/test/event-bus.test.mjs`、`personal-server/test/fun-open-rules.test.mjs`；新增 `personal-server/test/fame-hall-fidelity.test.mjs`。

重建配置：

```powershell
node tools/extract-fun-open-rules.mjs --fun-open=analysis/tmp/g1-lua32/FunOpenTable.json.gz --fun-open-source=analysis/scratchpad/time-temple-20261108/project/2127792237940904700-FunOpenTable.data.lua.bin --method-script=analysis/scratchpad/game-rules-20261114/MethodScript.data.lua.bin --method-table=analysis/tmp/g2-residual/MethodTable.data.lua.json --out=personal-server/config/fun-open-rules.json
```

输入JSON与原64位字节码独立解释结果逐行对比：523条FunOpen使用的tid/target/switch/sys_switch/fun_name/asserts、8条Show的tid/assert/asserts/asserts_new，以及Target的tid/client_req_to_open，统一TableEmpty表示后，字段差异0。

专项覆盖：等级31/32/33、开服日1/2/3、新号1级/长期已开服、7000早开1218拒绝但1054正常确认、重开SQLite保留、新增功能逐条7201、无自定义伪bitmap、重复调和不发新通知、临时TCP空服首号创角成功后7000资格检查。

最终专项44/44通过，命令为：

```powershell
cd personal-server
node --test test/fame-hall-fidelity.test.mjs test/feature-overrides.test.mjs test/hero-progression.test.mjs test/fun-open-rules.test.mjs test/feature-rules.test.mjs test/event-bus.test.mjs test/command-fun-open-gates.test.mjs test/command-gate-gateway.test.mjs
```

其中新增6项fame-hall-fidelity测试含真实TCP首号创角；旧功能门禁、override、养成与事务回归均通过。`git diff --check`通过。它不等于设备弹窗修复已验收。

## 源文件身份

|文件|SHA256|
|---|---|
|2456793199459520500-FunOpenTable.lua.bin|70b8271705bf5ec152c6881fcd6ad599df026e41c89c59010f24e16cdbe35a4b|
|2127792237940904700-FunOpenTable.data.lua.bin|a7dbc28812f761a573837f62758ea210d378edf51d7b9df1c0329a0af12b9a99|
|13750569974938978000-FunOpenData.lua.bin|0fda82c9dc9fdedd7df52ac4671fa53fa0dfeb13506a14adee962493ef0fef32|
|15127623268047110000-FunOpenMgr.lua.bin|55d68b7e9510c1e5194ffb85a324234592569e1ef3989a6f74d86e6d7c10595b|
|424837726185043140-GuideTable.data.lua.bin|80a9fa31ede999bc2b5b071f8e6db29c5d4b36f6fe0bac0cd395d4304cca94b3|
|MethodScript.data.lua.bin|89d91e90e1303de26e79aa9f598f025ef122362c31f27049042bdfac4d7917c3|
|MethodTable.data.lua.bin|78133b0174f3cf3f70d2d2b1ed087c78082be0fc865789c92f070c277530b52e|

前5份位于 `analysis/scratchpad/time-temple-20261108/project/`，后2份位于 `analysis/scratchpad/game-rules-20261114/`。
