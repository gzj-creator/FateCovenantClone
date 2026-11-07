# CORE-BATTLE-B 专有战斗机制实现记录

2026-11-08。范围：专有战斗机制（天极值、超凡生命、召唤替死、护盾摧毁、伤害上限、额外行动、领域、命名层数）。
worktree：`.worktree/gameplay-20261106/core-battle-b`，分支 `task/CORE-BATTLE-B-20261108`，基线 `680b2b7`（已 rebase main）。

## 结论

- 五个提交，HEAD `965a22d`：`efc0b5e`（状态容器与钩子接口）、`3c2d245`（超凡生命/召唤/破盾/伤害上限）、`59c9d12`（天极值与额外行动）、`60ee3fb`（魔能领域与命名层数）、`965a22d`（201/207/TCP 生产证据）。
- 全量 `npm test`：2453 项，pass 2451，fail 0，skipped 2（`analysis/test-runs/gameplay-20261106/core-battle-b-full-2.log`）。
- 生产链路已用临时 SQLite 与临时 loopback TCP 端口验证（201 报告、207 提交、重开重放一致、`reward_claims` RAISE(ABORT) 回滚）。
- 未做 APK 验收：本轮未启停实时服务、未读写 `runtime.local-only.data`、未操作模拟器/ADB/APK、未连原服。组件与生产链路通过不等于客户端可玩验收。

## 方法与证据门

`game/effects/proprietary-rules.mjs` 的每条规则都有 `requires`（描述原文片段或正则）和 `evidence`（引用原文），`config` 只转录原文写明的数值。`proprietaryRulesFor()` 在注册时重新比对当前 `skill-database.json` 的描述：描述被改动或缺失就整条规则失效，不会用旧数值继续生效。凡描述未写明的部分一律不实现，记录在下方缺口。

## 逐机制状态

| 机制 | 状态 | 触发技能行 | 证据与数值 |
| --- | --- | --- | --- |
| 天极值资源 | 已实现 | 全部天极技与相关 mastery | 独立于能量；默认 0，无上限（无配置证据，故不设上限） |
| 天极技施放与付费 | 已实现 10 行；6 行 fail-closed | 2104010123–2504060123 的 10 行 | `消耗3点天极值`；不足支付时改用普攻，不回退到能量 |
| 天极值获得 | 已实现 | 描述型：`314010174`、`324010174` 等 15 行 | `每回合普攻/绝招行动后额外获得1点天极值`，每回合 1 次，仅自身行动 |
| 天极值抽取 | 已实现 | 描述型：`314010172` 等 14 行 | `每回合首次释放终结技后降低敌方随机一人1点天极值`，仅对天极值 ≥1 的敌人 |
| 天极值清空 | 已实现 | `2504070123` | `随后清空目标的能量和天极值` |
| 超凡生命 | 已实现 | `354040171`、`354060171`、`354070171`、`2504010123`、`2504030123`、`2504050123`、`2504070123` | `自身超凡生命将提升至生命上限的100%`；伤害顺序 护盾→超凡生命→HP |
| 召唤替死 | 已实现 | `354060171` + `354060175` | 迪迪承担致命伤害，累计超过 100% 自身生命后退场；`重新召唤1次`、`每退出1次提升30%攻击`（永久） |
| 护盾按比例摧毁 | 已实现 | `2404030123`、`2404040123`（50%）、`2504040123`（35%）、`354010174`（终结技前 15%，4 次/回合）、`354030174`（终结技前目标 20%，4 次/回合）、`334020172`（任何动作前 10% 并均摊给友军） | 全部为原文数值 |
| 伤害上限 | 已实现 | `2504030123`（≤100% 攻击）、`324020171`（≤80% 攻击） | `不超过自身攻击力的100%`、`不超过自身攻击力80%` |
| 额外行动 | 已实现 4 条 | `120001001`、`334010173`、`344020172`、`324020173` | 首回合重复普攻/绝招（免费、不回能）；敌方阵亡追击 1 次/回合；受终结技后反击终结技 1 次/回合；行动后免费终结技且先摧毁 20% 护盾 |
| 领域 · 魔能领域 | 已实现 | `2104010123` | 2 回合；开启时友军回复 10% 最大生命、攻击力 +10%（2 回合）；领域内友军在回合开始、普攻/绝招行动、每回合首次终结技、受到伤害时各 +1 层【魔能】 |
| 命名层数 · 【魂】 | 已实现 | `2104030123`、`314030171`、`314030175` | 任意角色死亡 +1（每角色仅 1 次）；开局 +2；获得时 +20% 最大生命护盾（溢出也触发）；上限 8 |
| 命名层数 · 【月光】 | 部分实现 | `2404030123`、`2404040123` | 登记上限 100、每层 +0.5% 最终伤害加成与 +0.5% 无视防御；获取来源与天极技阈值加成未实现 |

### 补记的引擎缺陷修正

`runHooks()` 会为场上每个单位调用其钩子，而处理器把第一个参数（钩子所有者）当成了行动者。`shield-destroy`、`tianji-gain`、`tianji-drain`、`extra-action` 因此会在**别人**的行动里触发（例如天极英雄在队友行动后回天极值、`双重攻击`在队友行动后重复施放）。现已统一改为从 `payload.actor` 取行动者并校验归属；同时 `runHooks` 只在处理器真正触发（返回非 `false`）时才消耗 `oncePerRound`/`oncePerBattle`/`maxPerRound` 预算，避免守卫未命中就吃掉次数。

## 生产行为变更（需要评审注意）

1. `120001001`（双重攻击）由「额外一次 1.0 倍物理伤害的近似」改为真实的**额外行动**：首回合在同一次行动结束后立即再动一次，动作类型与上回合同类，不支付能量、不获得行动级能量回复。首发角色 `2010101` 因此首回合多一次攻击。
2. 天极技不再消耗能量：能量满的天极英雄只有在天极值够付价格时才施放，否则打普攻。没有价格描述的 6 行（`2404030123`、`2404040123`、`2504030123`、`2504040123`、`2504050123`、`2504070123`）在当前证据下不会作为主动行动施放。
3. 相关旧断言按最终行为更新：`test/battle-engine.test.mjs`（2 处）、`test/battle-common-effects.test.mjs`（天极技能行改用显式价格的 fixture）、`test/hero-skill-gates.test.mjs`（用额外行动代替旧的 on-attack 触发事件）、`test/skill-battle-integration.test.mjs`（额外行动有独立 action id）、`test/battle-proprietary-mechanics.test.mjs`（终结技守卫改用真实终结技）。

## 接口定义

`game/effects/proprietary-state.mjs` 新增容器与操作：

- 容器：`createProprietaryState(unit)`（`tianji{value,max}`、`superHp`、`layers`/`layerStats`/`layerDefs`、`summons`/`summonPolicy`、`hooks`、`counters`、`rules`、`warnings`）、`proprietaryOf(unit)`。
- 天极值：`tianjiValue`、`tianjiCap`、`gainTianji`、`spendTianji`、`drainTianji`。
- 超凡生命与召唤：`superHpValue`、`addSuperHp`、`summonGuard`、`activeSummon`、`dismissSummon`。
- 层数：`addLayer(unit, name, count, {max, perLayer})`、`layerValue`、`setLayer`、`consumeLayers`、`layerModifiers`。
- 领域：`openDomain(state, {name, ownerId, team, rounds})`、`activeDomains(state, name?)`、`advanceDomains(state)`（每回合结束递减并移除过期领域）。
- 钩子：`PROPRIETARY_HOOKS`（battle-start / round-start / action-start / before-action / ultimate-use / damage-dealt / damage-taken / unit-death / action-end / round-end）、`registerHook(unit, hook, handler, {oncePerRound, oncePerBattle, maxPerRound, maxPerBattle})`、`runHooks(state, hook, payload, events, filter)`（深度上限 4）。处理器返回 `false` 表示未触发（不消耗预算），返回 `null` 表示已生效但无结果，返回 `{kind:'extra-action'}` 由引擎入队。
- 结算：`absorbDamage`（护盾→超凡生命→HP，致命伤害转给召唤）、`capDamage`、`destroyShield`、`resetProprietaryRound`。
- 事件种类 `PROPRIETARY_EVENT_KINDS`：`proprietary-tianji`、`proprietary-super-hp`、`proprietary-layer`、`proprietary-summon`、`proprietary-domain`、`proprietary-shield-destroyed`、`proprietary-damage-capped`。

`game/effects/proprietary-rules.mjs` 导出：`PROPRIETARY_SKILL_RULES`、`setProprietarySkillRules`、`proprietaryRulesFor(skills)`、`proprietarySkillEffects(skill, definitions)`（给技能效果打 `damageCap`、注入前置破盾）、`proprietaryTriggerAllowed(skill, trigger)`（剔除被真实规则取代的近似触发器）、`isDeitySkill(skill)`（ability.type 2 且 run_type 5）、`tianjiCostFor(skill)`（描述价格，缺省 `null`）、`initProprietaryBattle(unit, state, events)`。

`game/battle-engine.mjs` 契约变化：

- `turnState.events` 指向事件流，供规则直接写可观测事件；`turnState.round`、`turnState.random` 可用于规则。
- `state.actionContext.actionType` 取值 `'attack'` / `'ultimate'` / `'tianji'`；天极技不再走 `before-ultimate-use` / `on-ultimate-use`，改走 `on-tianji-use`。
- `ACTION_END` 的 payload 增加 `skill`（本次施放的目录技能行），供领域等规则识别施放来源；`extra: true` 标记免费额外行动。
- `DAMAGE_TAKEN` / `DAMAGE_DEALT` payload 增加 `actionType`，领域层数按伤害来源类型判定。
- 额外行动队列：`enqueueProprietaryAction` / `drainProprietaryActions` / `executeExtraAction`，嵌套深度上限 3，免费行动不支付能量与天极值。

## 规则表（skill id → 规则）

| skill id | kind | 关键数值 |
| --- | --- | --- |
| 354040171 / 354060171 / 354070171 / 2504010123 / 2504030123 / 2504050123 / 2504070123 | super-hp | 100% 最大生命 |
| 354060171 / 354060175 | summon-guard / summon-resummon | hpRatio 1、吸收上限 100%、3 回合；再召唤 1 次、每次退场 +30% 攻击 |
| 2404030123 / 2404040123 | shield-destroy（skill） | 当前护盾 50% |
| 2504040123 | shield-destroy（skill） | 当前护盾 35% |
| 354010174 / 354030174 | shield-destroy（hook, 终结技前） | 全体 15% / 目标 20%，4 次/回合 |
| 334020172 | shield-destroy（hook, 任何动作前） | 全体 10%，均摊给友军 |
| 2504030123 / 324020171 | damage-cap | ≤100% 攻击 / ≤80% 攻击 |
| 120001001 | extra-action | 首回合、action-end、oncePerBattle、同类型重复 |
| 334010173 | extra-action | 敌方阵亡追击终结技，1 次/回合 |
| 344020172 | extra-action | 受终结技后反击终结技，1 次/回合 |
| 324020173 | extra-action | action-end 免费终结技，先摧毁 20% 护盾 |
| 314010174 / 324010174 等（描述型） | tianji-gain | 每回合 +1，仅自身行动 |
| 314010172 / 324010172 等（描述型） | tianji-drain | 每回合首次终结技后，敌方随机 1 人 -1 |
| 2504070123 | clear-resource | 清空目标能量与天极值 |
| 2104010123 | domain | 魔能领域 2 回合；回复 10% 最大生命；攻击 +10%；【魔能】四种触发各 +1 |
| 2104030123 / 314030171 / 314030175 | layer | 【魂】死亡 +1（每人一次）、开局 +2、护盾 20%、上限 8 |
| 2404030123 / 2404040123 | layer | 【月光】上限 100，每层 +0.5% 伤害加成、+0.5% 无视防御 |

## 测试与复现

工作目录 `personal-server`：

```text
node --test test/battle-proprietary-state.test.mjs
node --test test/battle-proprietary-mechanics.test.mjs
node --test test/battle-proprietary-tianji.test.mjs
node --test test/battle-proprietary-domain.test.mjs
node --test test/battle-proprietary-production.test.mjs
node --test test/battle-*.test.mjs test/effects/ test/skill-*.test.mjs test/mission-fight-service.test.mjs test/elite-mission-service.test.mjs test/hero-*.test.mjs
node --test --test-concurrency=1 test/*.test.mjs
```

统计与日志（worktree 内，不入 Git）：

- 新增用例：`battle-proprietary-state.test.mjs` 10 项、`battle-proprietary-mechanics.test.mjs` 5 项、`battle-proprietary-tianji.test.mjs` 6 项、`battle-proprietary-domain.test.mjs` 5 项、`battle-proprietary-production.test.mjs` 3 项。
- 战斗相关回归：1733 项全部通过（`core-battle-b-regression-3.log`；含前两轮 1728/1719 的失败修复记录 `core-battle-b-regression-1.log`、`core-battle-b-regression-2.log`）。
- 全量：2453 项，pass 2451，fail 0，skipped 2（`core-battle-b-full-2.log`）。

### 生产链路证据（`battle-proprietary-production.test.mjs`）

1. 201 任务战斗报告：角色 `2010101` 的首个普攻与紧随其后的重复动作是两个不同的 `pb_fat_action_before` action id，且各自带 `pb_fat_harm` 伤害包；201 不写库（任务仍为 `20205`）。
2. 207 提交：任务推进 `20205 → 30201`，体力 `120 → 115`，重开数据库后保持。
3. 回滚：对 `reward_claims` 建 `BEFORE INSERT ... RAISE(ABORT)` 触发器后 207 抛错，任务与体力不变；移除触发器后重试成功。
4. 临时 TCP：`createLocalGame` 监听随机端口，握手（challenge/AES）→ 909103 登录 → 201 → 207 全部成功；重开同一 SQLite 文件再取 201，action stream 与首次逐包相同（`deepEqual`）。

## 未覆盖边界与缺口

天极值：

- 初始天极值与上限没有任何配置或描述证据：当前默认 0、不设上限。需要客户端 TianjiTable 或 BUFF 表才能确定开局值。
- 6 行天极技（`2404030123`、`2404040123`、`2504030123`、`2504040123`、`2504050123`、`2504070123`）描述未写价格，fail-closed：不会作为主动行动施放，其"无消耗释放"类条款也尚未接入。
- 天极技的价格目前只支持"消耗N点天极值"写法；若后续文本改成别的表述需扩展解析。

层数与领域：

- 【魔能】每层效果来自 `314010171`「{0}会额外使拥有者无视防御提高20%」，原文用未解析的 `{0}` 占位符。因此本层只做**层数获取与领域**，不贡献属性；映射到【魔能】属推断，未写入规则。
- 【魂】每层的具体加成在目录中没有描述，只实现层数与上限。
- 【月光】缺少获取来源描述；天极技按 20/40/60/80/100 层的阈值加成（暴击率、增伤、暴伤、回 240 能量、无视 50% 防御）与首满 100 层的羁绊分支未实现。
- 其他领域（`2504020123` 狐魅领域、`2404020123` 命运领域）未实现：前者涉及全体增减伤与能量增扣，后者含 50%/100% 概率判定与"命运三姝"身份，需要更多数据证据。
- 复制类（`354020175`、`2504020123` 的天极技复制）、协同类（灵犀协狩 / 怒势）、`334010173` 的回合末兜底追击、`334010174` 追击前破盾 8%、kill-chain 追击次数默认 2（`6202060112`）未接入。
- 彼岸花同步回复、魂殇层数、撕裂、龙甲、乱针结护等未实现。

投影与客户端：

- `actionList` 目前只投影伤害/护盾/死亡/复活/能量；天极值、破盾、召唤、层数、领域事件只存在于引擎事件流，客户端看不到。属 CORE-BATTLE-C（BUFF tid 与 103 回放）。
- APK 未验收：以上全部为 worktree 内临时库与临时端口测试，未在隔离 APK 上实测。
