# 2026-11-15 统一规则基线与冲突清理

用户要求统一全部真实点、把不明确事项定成后续agent可直接采用的唯一基调，调研后允许撤回冲突旧文档。本轮范围是规则、规划、原证据及离线生成/校验工具；业务bug由其他agent完成。

## 有效入口与覆盖

- [唯一基线R1](../../../docs/gameplay-operations/12-final-rule-baseline.md)：区分原规则确证、复刻推定、工程契约及明确受限动作。
- [297任务裁定](../../../docs/gameplay-operations/rules/final-rule-register.md)：覆盖139系统组/881命令与158活动族/526命令，共1407命令；每任务关联具体规则节、版本政策与源指纹。
- [四项动态排期](../../../docs/gameplay-operations/rules/dynamic-schedule-decisions.md)：原字段不改，显式实例与阶段独立标R1推定。
- [规划](../../../docs/gameplay-operations/11-project-roadmap.md)和[运营手册](../../../docs/gameplay-operations/08-operations-runbook.md)按上述规则执行。

源数据本轮增加BuySkinActTable及CrossTable原bin，仅作为文档输入，不安装为业务资产。总计186来源（184压缩资产+2原bin）、184表文档、1921子表、256243原行；3个根索引解析阻断保留准确原因，必要缺行有明确受限规则，不借邻行。

## 已核事实与推定

175001原作用域是服务器（ActType175.data_type=1），不能把CREATE_TIME标签解释为个人创角。父174001业务关联、预热跳转2082、商品解锁1/3/17/31/45日、每条免费101500×50连续3个业务日、五SKU各32800分/每角色每期1次均有原表或消费者证据。免费奖没有先买或先拥有要求；con_time不导致商品3日后下架。功能1514断言955132601007已证为通关30203，另有开关92098；44条引用行新增原语义证据。文档条件已核220/剩余303与当前业务映射176/347分列，不把取证当部署。

R1明确推定175001继承父整体S/E，包含父预热，显式子50段；原空stage和duration0保留。父原绝对期为2025-06-27 05:00至2025-08-31 05:00，2026新服不自动复活。晚创角只剩余窗口，不补漏日日奖。

461三项未取得原服务器函数或目标原下发实例。十个32/64位Lua bundle共22604 TextAsset有界扫描，精确time_fun/time_fun_args只见schema，客户端消费链只读服务器实例；MethodScript无脚本461，同号动态参数不能证明命名空间相同。三份旧fixture无目标实例，关键blob相同且经过本服替换，不能当三份独立原服观测。原v10断言为DynamicArg462<=90，getter含义未取得。

R1按真实组主服业务日建立有限首期：梦境v10 day29、龙息v3 day79、梦境v11 day90，均05:00；首参服龄解释、整体E及空stage显式50是推定，不猜尾参[1,0]，不隐式循环。单逻辑区显式创建真实单服组。组日龄独立于当前serverDay午夜特殊分支。梦境50段结束即停止新操作，90仅公示；旧期冻结，新期按旧E当时或之后首个05:00顺延，scopeId防重。

其余未明确事项采用16项统一政策及逐任务决定：旧币留账冻结；已支付、已得pending、已达固定奖保留；没有具体原邮件不编补邮件；缺必要随机/成本/合法结果时仅拒绝该变更，不关整族。战斗既有兼容公式锁当前源码SHA并标兼容，NPC身份不借邻关，不靠赠角或强胜修复。

## 撤回的冲突内容

八份规则正文逐任务链接到最终裁定，不再由“当前实现”授予发布权限。撤回购买前不能领皮肤免费奖、CrossTable资产全缺、1514原语义未知等旧说法；正式world_time不平移，当前代码平移仅列实现差异。无证均匀池、猜概率/金额分母、固定片数、邻tid及空返奖等调查草案没有因此获准执行。

两份调查建议的JSON和源段SHA保留为历史快照；Markdown撤下未审核算法正文，只保留最终决定映射，通用defaults未整体采用。2026-11-06目录19份Markdown及3份旧专项计划标历史，撤回“旧文档冲突以当前源码为准”和“所有活动相对开服”优先级。AGENTS、文档入口及个人服务器README指向R1。原证据债务不伪改为“隐藏算法已恢复”。

## 复现与验证

在项目根目录PowerShell执行，均为离线文档工具：

```powershell
node tools/build-gameplay-doc-evidence.mjs
node tools/build-detailed-rule-docs.mjs
node tools/build-detailed-rule-docs.mjs --check
node tools/verify-detailed-rule-docs.mjs
git diff --check
```

校验独立核对原表、商品/免费奖、44行功能语义、固定预期日期、05:00前开服、梦境互斥顺延和不同scopeId隔离；检查297任务/1407命令全集、政策和证据限定覆盖、原字段不改、未宣称恢复461、输入/输出SHA、历史定位、链接和锚点。128份系统调查源码指纹须与调查时完全一致，避免兼容公式引用漂移。

1514比较方向另从原MethodUtil根原型13到比较原型2核对：参数1≤参数0时返回true，原条件确为含等号的PassedSection≥30203。最终校验锁定该模块SHA、绑定关系和完整六条比较指令，不仅检查EGreaterThan名称。

已通过的文档校验覆盖258份Markdown、10973条本地链接、297任务/1407命令、4项动态排期、16项政策、220处证据限定，以及128份锁定调查源码。功能条件已核220条/剩余303条，与当前业务ready176/gap347分别核验。生成一致性由`--check`独立检查；原始数据恢复阻断3项保留准确状态，不计为恢复完成。首次验证发现的累充受限措辞与两个旧死链接已修正，初次失败日志保留作调查记录，以最终验证日志为准。

本轮校验输出保存于[验证目录](../../../analysis/test-runs/rule-baseline-20261115/)。最终清单见[manifest](../../../docs/gameplay-operations/rules/manifest.json)，其中调查源段的旧哈希是历史证据，当前文件哈希另列，二者不混淆。

## 实施交接提示词

可直接交给后续agent的提示词位于[2026-11-15 R1全量实施交接](../../../promot/2026-11-15-r1-full-implementation-agent.md)。文件包含一份通用约束、46条失败关闭命令的四个不重叠批次和最终独立验收提示词：

- H1为英雄战力、好感与纹章，9条；
- H2为英雄传奇、情报、租借重置、快照、新英雄版本权益与战术重置，13条；
- I1为生涯、成长目标、周期任务、资源补全、任务奖与任务组，11条；
- I2为挂机、线性宝箱、神秘商店、开服宝箱与资源回退，13条。

四批合计46条，无重复、无遗漏。提示词要求先固定同版原配置、PB、客户端消费者、权威状态、成本与前驱、结果/返还和作用域，再实现成功路径；仅某子动作取证时，已证动作可开放，缺失动作仍在支付前返回错误5。所有批次必须更新失败关闭集合、R1验收表、原证据债务和实施记录，并分别登记专项、真实临时TCP、存档/重开、APK与生产状态。

交接稿完成后复跑`node tools/build-detailed-rule-docs.mjs --check`、`node tools/verify-detailed-rule-docs.mjs`、`git diff --check`及`npm --prefix personal-server run check:command-dispatch`，均通过。派发审计仍为`total=1407/serviceRoute=1383/gatewayRoute=18/multiOwner=6/unrouted=0/requestEncodingMismatch=173/requestEncodingUnverified=980/responseRuntimeUnverified=1407/responseSchemaMissing=223`；四批命令集合与46项当前失败关闭表逐type相等。

## 操作与验收边界

本轮未修改业务服务、运行数据库、线上配置或APK，未启停服务、操作模拟器/ADB、连接原服，也未执行Git提交。本次追加实施交接稿仅修改离线文档。此前其他任务的脏工作树与`.codex/config.toml`保留。文档覆盖与独立算例通过只证明规则口径/来源/生成一致，不是玩法1:1、真实客户端或上线验收；后续实现不得把“明确受限”销项为玩法完成。
