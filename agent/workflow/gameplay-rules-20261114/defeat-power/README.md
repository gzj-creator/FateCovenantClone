# 败北战力显示与 Fight102 独立取证

日期：2026-11-14。范围：只读检查本地 v11 APK 已提取的 32/64 位 Lua bundle，新增离线补丁工具和证据。未操作设备、实时服务或运行数据库，未生成、安装或验收新 APK。

## 结论与验收状态

|问题|静态结论|当前状态|
|---|---|---|
|主线败北页敌方战力为 0|`FightResultMissionForm` 优先按 `NpcAttr.power × NPC 数量` 算显示值；原表 NpcAttr 1–47 的 power 都是 0，2-1 的 Team201 使用 NpcAttr12，因此结果为 0|根因已定位；离线显示修复候选 18/18 通过；APK 未验收|
|原版是否显示过正数|缺少原服败北战报和截图；已检查的原客户端静态逻辑在早期关卡确实会算 0|未确认，不能把候选补丁称为找回原版正数|
|Fight102 两人固定攻队是否强制覆盖玩家编队|静态 Fight102.atk_team=[91102]，但没有对应原服战报；Team91102.loc2 计算到的 Fighter9110202 缺行|证据阻断；不能标固定攻方已还原|
|敌技能 1900110101 / 2900550111 的准确描述|完整扫描当前 bundle 的 174 个 Ability/AbilityDes/AttrAbility 分片，0 个解析失败；两技能有 Ability 分类行，无对应 AbilityDes；AbilityShow.des_redirect=0|目标、倍率和效果仍未知，不能用职业模板或相同动画推断|
|FirstFightCustomize 是否使 Fight102 分阶段/必胜|只有 GuideAnimScene 调用，绑定演出战斗 90022/90023；所检查函数处理登场、隐藏/显示、对话和转场，不提供必胜战报|不适用于 Fight102；不能据此造预置胜利|
|Custom102.custom_star=5 是否增强攻方|精确非表字段消费者为 DestinyPveActFightMgr 的敌人预览 Hero.star；未找到主线战斗属性增强消费者|不能作为增强或放水依据|

主 agent 的接入决定：缺少原服证据时继续使用请求/持久编队作为攻方，守方按原 NPC 表恢复；固定攻方解释独立登记为阻断。此决定不等于确认原服也使用该攻方规则。

## 显示链与候选补丁

静态调用链：

1. `FightResultMissionForm.lua` proto16 / 源码行 287：`GetDefTeamPower(report.tid, #battle_list)`，再经 `CountMulPower` 显示。
2. `HeroPowerCalculator.lua` proto4 / 源码行 120：`floor(NpcAttr[Team.team_lv].power * #Team.npc)`。
3. `Fight201 → Team201 → team_lv12`，四个 NPC，NpcAttr12.power=0。
4. `FightTable.Custom.0` 的 101/102/104/105/201/301/403 行存在，`def_power=[]`，并非缺表。
5. 通用 `FightResultCommonForm.lua` proto10 / 源码行 194 已从最终队战报读 `fightReport.battle_list[#battle_list].def_power`。

候选补丁只改主线结果页：原静态战力为正时完整保留原调用及难度倍率；静态值不大于 0 时，用最终队战报的正数 `def_power`。战报数值不再重复乘难度；缺失、零、负值不伪造正数。服务端仍必须给出真实、可信的战报战力。

这属于针对用户报告的显示修复候选，会改变早期原静态显示行为。未恢复原服算法，未改战斗表、奖励、敌方属性或胜负。

工具：

- [patch-defeat-power-lua.mjs](../../../../tools/patch-defeat-power-lua.mjs)：锁定两个原脚本 SHA256，只接受已知版本；保持 6316 字节，仅修改 `[4537,5004)`，保留自定义 LuaJIT 四字节原型头；拒绝重复补丁。
- [test-defeat-power-lua.mjs](../../../../tools/test-defeat-power-lua.mjs)：32/64 位共 18 项指令解释测试。
- [build-defeat-power-bundle.mjs](../../../../tools/build-defeat-power-bundle.mjs)：替换一个 TextAsset 后逐字节核对所有 10928 个 TextAsset。

复现测试：

```powershell
node tools/test-defeat-power-lua.mjs analysis/scratchpad/defeat-power-20261114/32-FightResultMissionForm.lua.bin analysis/scratchpad/defeat-power-20261114/64-FightResultMissionForm.lua.bin
```

18/18 通过，包含正静态路径与原函数逐调用一致、正/零/负/缺失战报、uint64 大值、最终队索引、不重复倍率、拒绝二次补丁。使用离线指令解释器和惰性 stub，未运行客户端 Lua，不能替代真实 APK 验收。结果落盘于 `analysis/scratchpad/defeat-power-20261114/test-result.json`。

离线构建方式（输出目录必须不存在）：

```powershell
node tools/build-defeat-power-bundle.mjs analysis/scratchpad/defeat-power-20261114/v11-64_lua_project.bundle analysis/scratchpad/defeat-power-20261114/new-candidate-64
node tools/build-defeat-power-bundle.mjs analysis/scratchpad/defeat-power-20261114/v11-32_lua_project.bundle analysis/scratchpad/defeat-power-20261114/new-candidate-32
```

## 已核对的哈希

|对象|SHA256|
|---|---|
|v11 64 bundle|`2b1fd41f3fb40ea3d3dcd1b7d1591d3d17ffacbc6422c028de4dc02ad04ecdc7`|
|v11 32 bundle|`61367b276e5447ad6a7e23aceb7a2c48d1fadf2b39aedf4b5fefb0991a10087a`|
|64 原目标脚本|`f99aae429a312db11d3fda4ecafce6f987088820b51f414a428adeb24299ca1a`|
|64 候选目标脚本|`4544f929358e3f39841aaee91051899aa5d186c2a13b9ddf7ee9cf7df886091e`|
|32 原目标脚本|`730b4c201bc5a50ee2e2a441002001cf44d963b9aa5b0a806b48ba2f64310b59`|
|32 候选目标脚本|`e7be5b8a9b40695fe89428b54916a5aa4c49b65bfdbe1c46f3ba544346de74f0`|
|64 候选 bundle|`ce8205d5c7c9fb5cfc2f05628a1aa3646de187babc1468a5bedd040b367e7fcf`|
|32 候选 bundle|`6bcb1fbb22bfedb5f11b2dcaaa9c1b0bee09adace026503afec45d60f192ec6b`|

32 位原 bundle 为 36692917 字节，现有 `replaceTextAsset` 按 raw 重建后为 102832509 字节；10928 个 TextAsset 内容核验通过，除目标脚本外完全一致。容器压缩布局变化不等于已通过客户端装载。

## Fight102 的确定事实与缺口

`Fight102`：`atk_team=[91102]`、`def_team=[102]`。`Team91102` 为等级 1、NPC `[9005500,9005600]`、loc `[2,5]`；`Team102` 为四个 `9100500`、等级 1、loc `[2,4,5,6]`。

`FightKit.lua` proto2 / 行 76 使用 `Team.tid * 100 + loc` 生成 Fighter id。因此 loc2 对应 9110202；原 Fighter 分片内没有这行，却有 9110201 和 9110205。两者 `power=0`、`add_ab=[]`。不能用成员下标或 9110201 替代 9110202，也不能把这份配置直接断言为服务端强制攻队。

NPC9005500/9005600 分别使用造型 2010101/2010201，原能力为普通攻击、绝招及 3900400149/3900400151；NPC9100500 使用 1900110101/2900550111 及相同两个属性类能力。149/151 的 Ability.type=4，但四个 AttrAbility 分片中没有对应属性行；154/155 的属性不能移植过去。

已恢复的原文（保留数值，不把名称相似当作等效技能）：

|技能|原名称与原描述（去显示色标）|
|---|---|
|1201010101|金钱攻势；对敌方单体造成 100% 的物理伤害|
|1201020101|兔兔飞弹；对敌方单体造成 100% 的物理伤害|
|2201010111|一锤定音；对敌方后排目标造成 108% 的物理伤害，附加 10% 最终伤害提升|
|2201020111|萝卜强袭；对前方单体目标造成 211% 的物理伤害，并降低敌方 10% 的伤害减免，持续 2 回合|
|120001031|普攻/绝招额外回复 200 点能量|
|120001027|受到普攻/绝招回复 150 点能量|
|1900110101 / 2900550111|未恢复准确原文；不能补写推测文本|

原文本来源为本地 `sub_first/config/core/language.bundle` 的语言 TextAsset，提取文件 `sub-first-language.bin`。文字只证明该版本技能描述，不自动证明当前模拟器实现、触发时点或完整数值公式。

`NpcAttr.lua` proto0 / 行 39 的 CalcAttr 第一个参数在错误信息中称 `fighterNpcTid`；proto1 / 行 68 的 MakeHeroNpcAttr 调用 `CalcAttr(hero.tid, 0, hero.level, ...)`；proto2 / 行 81 查 `HeroTable.NpcAttrRatio[fighterNpcTid * 10]`。此路径使用 NPC tid，不能传入 team id 或 Fighter id。三个 NPC 的 `tid*10` 均无比例行。固定 NPC 也没有可玩英雄 2010101/2010201 的 BattleAttr 行，不能把可玩英雄加成擅自搬给固定 NPC。

FirstFightCustomize 只存在于自身和 GuideAnimScene 的精确引用。GuideAnimScene proto9/10 分别创建 Fight90022/90023；前者注入第二回合对话、暂停、取消与转场，后者删启动提示。EntranceParse1/2 调整出场可见性和场景时间线。所检查链路不含伤害增强、预置胜利或 Fight102 的条件分支。没有原服服务器逻辑，不能扩大为“任何新手战都没有剧本”的结论。

仍阻断：真实 Fight102 的攻方身份/属性/能量/动作/胜负；两敌技能的目标和倍率；`custom_star` 的服务端语义；项目能量定值的原版依据。`SpecialAb1.skill_base=1000` 只证明绝招基准，不能证明初始能量 500、每次加 250、挨打加 80。MissionCustom.lua 当前解析失败，未宣称该脚本审查完整。

## APK 接入与后续验收

1. 接入前从当前可用 APK 复制独立备份，核对大小和 SHA256，保留至少上一版；不覆盖唯一备份，不自动删包。
2. 从当前 APK 获取两架构 bundle 后分别补丁。工具只锁定目标脚本 hash，未知版本立即停，不能为通过而放开 hash。
3. `tools/build-recharge-fix-apk.ps1` 锁定旧 v9 及旧 bundle hash，不可直接用于当前 v11。若复用封装逻辑，需只替换两个 lua_project 成员并逐成员核验，保留地址、钱包、代金券等既有改动。
4. `repack-apk-preserving-v1.ps1` 不是通用 Lua 替换入口；`build-wallet-payment-apk.ps1` 会额外改 DEX/语言，不宜直接调用。使用现有签名目录 `personal-server/secrets/apk-signing.local-only.data`，避免无意换证书。
5. 安装后验 2-1 败北正数与战报一致、后期原静态正数路径、重试/重登、多队最终队索引及难度倍率；确认不改胜负、奖励。未完成前只标候选。
6. APK 验收通过后才同步到 `apk/`，更新 `apk/README.md` 的文件、大小、hash、包信息、来源、验收与前置条件。APK 不提交 Git。

## 证据与复现入口

全部分析产物位于 `analysis/scratchpad/defeat-power-20261114/`，未提交资源包：

- `current-bundle-evidence.json`：当前 APK bundle/脚本身份及原表行。
- `findings.json`：败北显示链、早期 power=0 和候选限制。
- `candidate-32/defeat-power-bundle.json`、`candidate-64/defeat-power-bundle.json`：逐 TextAsset 核验与候选 hash。
- `test-result.json`：18/18 指令测试结果。
- `enemy-skill-search.json`：174 个分片的 rowCount/hash 与命中行、描述缺口。
- `first-fight-static-evidence.json`、`*.prototypes.json`：脚本 hash、精确文字引用、逐原型指令。
- `first-fight-team-shards.json`：Team91102/Fight90022/90023；列出六个其他分片的不支持 opcode，未把失败分片当负搜索成功。
- `fight102-findings.json`：可整合的结构化结论、原语言原文、NPC ratio、固定攻方阻断。

重跑独立取证：

```powershell
node analysis/scratchpad/defeat-power-20261114/investigate.mjs
node analysis/scratchpad/defeat-power-20261114/scan-skills.mjs
node analysis/scratchpad/defeat-power-20261114/summarize.mjs
```

这些脚本只读取本地 bundle/表并写本分析目录，不请求原服务器。使用项目 REA 技能约束区分静态事实、推论与未知；此轮沿用已有提取产物及项目格式解析器，没有新增 REA 引擎运行或原服运行证据。
