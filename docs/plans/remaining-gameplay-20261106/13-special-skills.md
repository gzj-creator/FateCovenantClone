# 英雄特殊技能逐项补齐计划

当前 76 个英雄、1076 条技能引用中，277 条仍标记 requiresInvestigation，涉及 72 个英雄。

这些是近似、证据不足或待清理标记的清单，不是“277 个完全没实现技能”的结论。主线已调用技能效果和触发器。先完成 CORE-BATTLE / CORE-SKILL-GATES，再按 HERO ID 派发；重核现有执行器后仍缺的语义才实施。

每个英雄任务的描述、限制及源码定位保存在 [skill-gap-inventory.json](skill-gap-inventory.json)；完整 effects/triggers 从当前 skill-database.json 按 heroId + skillId 读取，不复制大份技能库。只改分配的英雄；共享执行器变更交 CORE-BATTLE 负责人；技能库写入遵守现有 apply-hero-skill-patch.mjs 流程。

每条需给出：原描述逐句对应、精确与近似之分、执行器能力、等级/星级门槛、目标/倍率/触发/持续/次数、真实战斗结果断言。缺少天极或专有计数时，不能用普通能量/一回合 BUFF 偷换语义。已实际修好的旧标记可带证据清除。

## SKILL-1010101：吟游诗人

补齐或核销 1 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `6910001014` | Skill 6910001014 / Ultimate | Ultimate: missing description (metadata fallback). Implemented as generic 2.0x physical damage single target (requires investigation). |

## SKILL-1010201：鱼缸头

补齐或核销 1 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `6910001015` | Skill 6910001015 / Ultimate | 未写 notes；需对照完整描述及 effects 确认，不能据标记直接认定完全缺失。 |

## SKILL-1020201：猎魔人

补齐或核销 1 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `6910001010` | Skill 6910001010 / Ultimate | Ultimate: missing description (metadata fallback). Implemented as generic 2.0x physical damage single target (requires investigation). |

## SKILL-1020501：影盾骑士

补齐或核销 1 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `312050174` | 盘石之固 / Mastery | Approximation: "next incoming damage -15%" is modelled as 15% damage reduction for 1 round after normal/skill use; single-hit consumption is not representable. requiresInvestigation. |

## SKILL-1030101：露奈尔

补齐或核销 3 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `313010174` | 盘石之固 / Mastery | Approximation: "next incoming damage -15%" is modelled as 15% damage reduction for 1 round after normal/skill use; single-hit consumption is not representable. requiresInvestigation. |
| `120001019` | 防护加持 / Passive | Approximation: "before the first ultimate" damage reduction is modelled as 20% for 2 rounds from the first ultimate-use trigger; the pre-ultimate window itself is not representable. requiresInvestigation. |
| `6103010109` | 露奈尔_稀有技能 / Ultimate | Rare ultimate: at round end shield all allies for 5% of Lunair max HP (1 round). Polar-night doubling and the {0} status layer are not modelled. requiresInvestigation. |

## SKILL-1030201：银爵艾伦

补齐或核销 2 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `313020175` | 定制策略 / Mastery | TargetSelector supports front-row-highest-attack; restored exact front-row target semantics. |
| `6910001004` | Skill 6910001004 / Ultimate | Ultimate: missing description (metadata fallback). Implemented as generic 2.0x physical damage single target (requires investigation). |

## SKILL-1030301：观星者

补齐或核销 2 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `120001002` | 生命偷取 / Passive | Passive: ultimate damage 10% converted to self HP (lifesteal). Approximated as heal 20% attack; exact damage tracking requires engine integration. requiresInvestigation. |
| `6910001005` | Skill 6910001005 / Ultimate | Ultimate: missing description (metadata fallback). Implemented as generic 2.0x physical damage single target (requires investigation). |

## SKILL-1030401：黑鸦女爵

补齐或核销 1 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `6910001006` | Skill 6910001006 / Ultimate | Ultimate: missing description (metadata fallback). Implemented as generic 2.0x physical damage single target (requires investigation). |

## SKILL-1030501：灾祸双子

补齐或核销 2 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `6103030103` | 海瑟_稀有技能 / Ultimate | Rare ultimate: when hit, shield the lowest-HP allies for 10% of Hesser max HP for 2 rounds (doubled from round 3, max 3 per round). Same-row energy resistance/speed buffs and shield-conditional control/energy/status resistance are not modelled (target types unavailable). requiresInvestigation. |
| `6910001007` | Skill 6910001007 / Ultimate | Ultimate: missing description (metadata fallback). Generic 2.0x physical damage single. |

## SKILL-1030601：梦魅

补齐或核销 1 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `313060174` | 如梦初醒 / Mastery | Approximation: 'next ultimate damage +15%' is modelled as a 1-round damage-bonus after normal/skill use because the trigger framework cannot scope to the next ultimate. requiresInvestigation. |

## SKILL-1030701：罪欲夜影

补齐或核销 1 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `6910001059` | Skill 6910001059 / Ultimate | Ultimate: missing description (metadata fallback). Generic 2.0x physical damage single. |

## SKILL-1040101：弥撒

补齐或核销 9 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `2104010123` | 极·蚀光魔云 / Ultimate | Ultimate: 130% magical damage to all enemies; domain heals all allies 10% max HP and +10% attack for 2 rounds. Magic-energy domain (魔能) stacking per round/on hit/on ultimate and Tianji cost (3) require engine integration (requiresInvestigation). |
| `314010171` | 幽森挽歌 / Mastery | Mastery: each round start all allies gain 2 layers of 魔能 (ignore defense +20% per layer, approximated +0.4); on battle start self final damage reduction +5%. 魔能 stacking/buff naming requires investigation. |
| `314010172` | 枯荣之契 / Mastery | Mastery: first ultimate each round reduces a random enemy Tianji by 1 (approximated energy loss 100); when ally hit by normal attack gain 1 魔能 layer (max 3/round, approximated self ignore-defense +0.2); on battle start max HP +5%. Tianji/layer mechanics require investigation. |
| `314010173` | 超群技艺 / Mastery | Mastery: ultimate deals extra true damage to front-row enemies = 2% caster max HP * 魔能 layers (max 16%, approximated base 2%); all real damage +15% (115%); on battle start status hit and resist +10%. Layer scaling requires investigation. |
| `314010174` | 蚀光律动 / Mastery | Mastery: after normal/skill gain 1 Tianji (approx energy +100); when ally hit by normal attack gain shield 5% max HP (max 5/round, approximated self); after normal/skill highest-attack ally gains 1 魔能 layer for 2 rounds (approx highest-HP ally). Tianji/layer/selection require investigation. |
| `314010175` | 冥幕微光 / Mastery | Mastery: 魔能 triggers at most 4 times per battle, healing allies 100% max HP + 1000 energy (approximated on ultimate use, max 4); on ultimate use all allies heal 3% max HP. Trigger condition (魔能 threshold) requires investigation. |
| `120000032` | 反弹 / Passive | Passive: when hit by back-row enemy, rebound rate +10% (back-row attacker condition not enforced). |
| `120000037` | 亢奋 / Passive | Passive: when enemy knocked back/killed, self gains 100 energy (approximated as on-kill). |
| `6910001001` | Skill 6910001001 / Ultimate | Ultimate: missing description (metadata fallback). Generic 2.0x physical damage single. |

## SKILL-1040201：爱蜜莉

补齐或核销 7 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `2104020123` | 迷情掌控 / Ultimate | Ultimate: 130% magical damage to all enemies; heal self 3% max HP per rose layer (approx); 花欲盛放 self -20% ultimate/deity damage taken +20% crit resist +20% crit damage reduction for 1 round; Tianji cost 3; 粉/白/红·余香 and rose-layer scaling require engine integration (requiresInvestigation). |
| `314020171` | 猫诱 / Mastery | Mastery: battle start & each action apply rose (pink) + 粉·余香 to all enemies (approx on-round-start); all enemies final damage bonus/reduction -20%; on battle start self final damage reduction +5%. Rose application and 粉·余香 require investigation. |
| `314020172` | 舔舐 / Mastery | Mastery: first ultimate each round reduces a random enemy Tianji by 1 (approx energy loss 100); when hit by normal attack reduce all enemies heal/shield bonus by 2% (max 10); on battle start max HP +5%. Tianji/heal-shield reduction require investigation. |
| `314020173` | 魅惑 / Mastery | Mastery: battle start & each action apply rose (white) + 白·余香 to all enemies (requires investigation); when enemy dispels buff extra true damage 60% defense (max 5/enemy/round) requires engine integration; on battle start crit resist +5% and crit damage reduction +10%. Rose/dispel-damage require investigation. |
| `314020174` | 偷心 / Mastery | Mastery: after normal/skill gain 1 Tianji (approx energy +100); when hit by normal attack all allies gain shield 6% max HP (max 5/round); after normal/skill self next damage taken -15%. Tianji requires investigation. |
| `314020175` | 迷情 / Mastery | Mastery: battle start & each action apply rose (red) + 红·余香 to all enemies (requires investigation); ultimate/deity deals extra true damage = 80% defense * rose types (approx 240 base); first 3 rounds damage taken -8%; round 3 end heal self 5% max HP. Rose scaling requires investigation. |
| `6910001063` | Skill 6910001063 / Ultimate | Ultimate: missing description (metadata fallback). Generic 2.0x physical damage single. |

## SKILL-1040301：伊丽丝

补齐或核销 11 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `2104030123` | 魂归彼岸 / Ultimate | Ultimate: 130% magical damage to all enemies; adds 1-5 layers 魂殇 (approx -2% attack/defense for 2 rounds, 1 layer). Battle-start 彼岸花 on enemies and death-based 魂 gain, plus Tianji cost 3, require engine integration (requiresInvestigation). |
| `314030171` | 幽焰噬魂 / Mastery | Mastery: battle start gain 2 soul layers; when gaining soul via death (incl. overflow) gain shield 20% max HP (approx on battle start). Soul death-trigger not wired (requiresInvestigation). |
| `314030172` | 灵灯眠魂 / Mastery | Mastery: first ultimate each round reduces a random enemy Tianji by 1 (approx energy loss 100); after self ultimate all allies shield bonus +5%, max 5 stacks, removed at round end (stack cap not enforced). requiresInvestigation. |
| `314030173` | 引魂归灯 / Mastery | Mastery: when self gains soul via death (incl. overflow), other allies gain shield 10% max HP (approx on battle start); every 2 soul gains self gains 1 layer {0} (unknown, not wired). requiresInvestigation. |
| `314030175` | 安魂长眠 / Mastery | Mastery (metadata only): soul cap raised to 8; when soul reaches 8, ultimate enhanced to 永眠终曲: 30% chance to inflict {0} (status unknown, approximated stun) on target, max 2/unit/round. Requires investigation. |
| `314030174` | 梦萦魂绕 / Mastery | Mastery: after normal/skill gain 1 Tianji (approx energy +100); all allies damage taken -20% and ultimate damage +20%. Soul cap 8 and 永眠终曲 enhancement handled in 314030175 (requiresInvestigation). [audit-20261105: description trimmed: catalog dump had merged the next skill text into this row] |
| `120000033` | 陷阵 / Passive | Passive: damage to front-row enemies +10% (front-row condition not enforced). requiresInvestigation. |
| `120000035` | 齐心 / Passive | Passive: damage +3% per teammate in battle (max 15%, approximated max +0.15). Teammate count not enforced. requiresInvestigation. |
| `120000036` | 急救 / Passive | Passive: when ally HP < 50%, healing to them +15% (ally HP condition not enforced). requiresInvestigation. |
| `120000041` | 蓄势 / Passive | Passive: from round 2, ignore defense +15% (round gating not enforced). requiresInvestigation. |
| `6910001067` | Skill 6910001067 / Ultimate | Ultimate: missing description (metadata fallback). Generic 2.0x physical damage single. |

## SKILL-2010101：鼠鼠埃文

补齐或核销 3 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `120000014` | 格挡 / Passive | Passive: before 2nd ultimate, ultimate damage taken -20% (approximated as battle-start permanent reduction; requires investigation). |
| `120001001` | 双重攻击 / Passive | Passive: first round, after normal/skill, release one extra normal/skill (no energy). Approximated as an extra 1.0x physical damage attack in round 1; extra-action engine support requires investigation (requiresInvestigation). |
| `6910001027` | Skill 6910001027 / Ultimate | Ultimate: missing description (metadata fallback). Implemented as generic 2.0x physical damage single target (requires investigation). |

## SKILL-2010201：兔兔瑞贝卡

补齐或核销 4 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `120000002` | 锁定 / Passive | Passive: damage to targets with HP > 50% +10% (target HP condition not enforced; approximated as permanent damage-bonus on battle start). requiresInvestigation. |
| `120000014` | 格挡 / Passive | Passive: before 2nd ultimate, ultimate damage taken -20% (approximated as battle-start permanent reduction; requires investigation). |
| `120001002` | 生命偷取 / Passive | Passive: ultimate damage 10% converted to self HP (lifesteal). Approximated as heal 20% attack; exact damage tracking requires engine integration. requiresInvestigation. |
| `6910001028` | Skill 6910001028 / Ultimate | Ultimate: missing description (metadata fallback). Implemented as generic 2.0x physical damage single target (requires investigation). |

## SKILL-2020101：流沙王子

补齐或核销 1 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `6910001022` | Skill 6910001022 / Ultimate | Ultimate: missing description (metadata fallback). Generic 2.0x physical damage single. |

## SKILL-2020201：武姬月

补齐或核销 4 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `120000009` | 鼓舞 / Passive | Passive: gain 25 energy on ally normal/skill (approximated as self trigger; ally condition requires investigation). |
| `120000014` | 格挡 / Passive | Passive: ultimate damage taken -20% before 2nd ultimate (approximated as one-time; exact turn tracking requires investigation). |
| `120001002` | 生命偷取 / Passive | Passive: ultimate damage 10% converted to self HP (lifesteal). Approximated as heal 20% attack; exact damage tracking requires engine integration. |
| `6910001023` | Skill 6910001023 / Ultimate | Ultimate: metadata fallback damage 2.0x single (requires investigation). |

## SKILL-2020301：极地投手

补齐或核销 3 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `322030175` | 高光时刻 / Mastery | Mastery (metadata only): on ultimate use, 30% chance to gain 1 stack of 狂野 (effect unknown, approximated as strengthened buff). Requires investigation. |
| `120001007` | 激昂一击 / Passive | Passive: after kill, next ultimate damage +25% (approximated as damage-bonus for 2 rounds; exact consumption on ultimate requires engine support). Requires investigation. |
| `6910001024` | Skill 6910001024 / Ultimate | Ultimate: metadata fallback damage 2.0x single (requires investigation). |

## SKILL-2020401：哞哞号手

补齐或核销 3 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `322040175` | 无处遁形 / Mastery | Mastery: 焦热 additionally lowers enemy final evasion 10%; evasion stat not supported, approximated as self hit-rate +10% (requiresInvestigation). |
| `120001008` | 奋力一击 / Passive | Passive: ultimate damage to highest-HP enemy +30%; target-HP condition not enforced (requiresInvestigation). |
| `6910001025` | Skill 6910001025 / Ultimate | Ultimate, metadata fallback -> 2.0x physical damage single (requiresInvestigation). |

## SKILL-2020501：炎拳

补齐或核销 3 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `322050174` | 无间囚笼 / Mastery | Mastery: after normal/skill, 30% chance to apply 1 stack of chain (锁链) to target, lasting 2 rounds. Chain status not modeled in engine (requiresInvestigation). |
| `322050175` | 锢魂之咒 / Mastery | Approximation: chain is not modelled as a stacked status with per-layer stats, so the enhancement is expressed as -5% crit rate and -5% evasion on the attacked target for 2 rounds, gated on the target already carrying a debuff. requiresInvestigation. |
| `6910001026` | Skill 6910001026 / Ultimate | Ultimate: missing description (metadata fallback). Implemented as generic 2.0x physical damage single target (requires investigation). |

## SKILL-2020601：影之菖蒲

补齐或核销 1 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `6202060112` | 无限瞬杀 / Passive | Approximation: unlimited ultimate follow-ups are not modelled; one extra 50% ATK physical follow-up is applied on ultimate use as a conservative stand-in. requiresInvestigation. |

## SKILL-2030101：玉灵墨

补齐或核销 1 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `6910001016` | Skill 6910001016 / Ultimate | Ultimate: missing description (metadata fallback). Implemented as generic 2.0x physical damage single target (requires investigation). |

## SKILL-2030201：龙之澜

补齐或核销 4 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `323020175` | 滔天巨浪 / Mastery | Mastery: on ultimate use, target damage taken +5% for 2 rounds (approximated as damage-reduction -0.05; requires investigation). |
| `120000025` | 戒备 / Passive | 自身有增益状态时抗暴率+30%（statType crit-resistance）；增益存在性未由引擎判定，按回合开始与获得增益两个时机施加。 |
| `6203020109` | 澜_稀有_总挂载 / Ultimate | 稀有技能：描述中的{0}为未解出的buff模板，近似为1回合5%最终伤害减免；战斗开始与敌方死亡时对我方全体施加。暴击伤害+5%（古域阵营翻倍、最多3层）以终结技使用触发近似，阵营数据与“{0}期间释放终结技”窗口判定未接入引擎。 |
| `6910001017` | Skill 6910001017 / Ultimate | Ultimate: metadata fallback. Generic 2.0x physical damage single target (requires investigation). |

## SKILL-2030301：剑心琉璃

补齐或核销 4 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `323030175` | 无极之道 / Mastery | Mastery: 式神 additionally grants self +5% ignore-defense and +10% crit (approximated as permanent self buff on battle start; 式神 condition not enforced). requiresInvestigation. |
| `120001007` | 激昂一击 / Passive | Passive: after kill, next ultimate damage +25% (approximated as damage-bonus for 2 rounds; exact consumption on ultimate requires engine support). Requires investigation. |
| `6203030106` | 琉璃_稀有技能 / Ultimate | Rare skill: on ultimate use, add true damage = 120% ATK split among skill targets (each <= 90% ATK; split/cap approximated as single-target 1.2x here); ultimate gains +15% damage bonus and +15% crit rate; if only 1 target, +15% crit damage (conditional, requiresInvestigation); target loses 10% ignore-defense-resist (not supported) and 5% defense for 1 round. requiresInvestigation. |
| `6910001018` | Skill 6910001018 / Ultimate | Ultimate: missing description (metadata fallback). Implemented as generic 2.0x physical damage single target (requires investigation). |

## SKILL-2030401：神拳汉娜

补齐或核销 2 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `120001002` | 生命偷取 / Passive | Passive: ultimate damage 10% converted to self HP (lifesteal). Approximated as heal 20% attack; exact damage tracking requires engine integration. requiresInvestigation. |
| `6910001019` | Skill 6910001019 / Ultimate | Ultimate: missing description (metadata fallback). Implemented as generic 2.0x physical damage single target (requires investigation). |

## SKILL-2030501：魅影莱娅

补齐或核销 3 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `323050174` | 加速节奏 / Mastery | Mastery: on normal/skill, 30% chance to apply 1 stack of pursuit (追杀) to self, lasting 2 rounds. Pursuit status not modeled in engine (requiresInvestigation). |
| `120001007` | 激昂一击 / Passive | Passive: after kill, next ultimate damage +25% (approximated as damage-bonus for 2 rounds; exact consumption on ultimate requires engine support). Requires investigation. |
| `6910001020` | Skill 6910001020 / Ultimate | Ultimate: metadata fallback -> 2.0x physical damage single (requiresInvestigation). |

## SKILL-2030601：司命

补齐或核销 1 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `6910001021` | Skill 6910001021 / Ultimate | Ultimate: metadata fallback -> 2.0x physical damage single (requiresInvestigation). |

## SKILL-2030701：游铃

补齐或核销 2 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `120001002` | 生命偷取 / Passive | Passive: ultimate damage 10% converted to self HP (lifesteal). Approximated as heal 20% attack; exact damage tracking requires engine integration. requiresInvestigation. |
| `6910001061` | Skill 6910001061 / Ultimate | Ultimate: metadata fallback (missing description). Implemented as generic 2.0x physical damage single target (requires investigation). |

## SKILL-2040101：赤霄

补齐或核销 9 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `2204010123` | 罪业尽销 / Ultimate | Ultimate: consumes 3 Tianji (not modeled), 130% magical damage to all enemies; if target has 噬炎 (flame), adds true damage = 30% of damage taken during 噬炎 (cap 180% atk) and removes 噬炎; on kill permanently -3% atk/def per target (max 3) and +1% atk/def to all allies (max 5 battles); otherwise restores 150 energy to all allies. 噬炎 tracking, Tianji, kill branching require engine integration (requiresInvestigation). |
| `324010171` | 龙行 / Mastery | Mastery: first 2 ultimates per round guaranteed crit and +60% final damage (crit guarantee not modeled; approximated as damage-bonus 0.60, maxTriggers 2); battle start final damage bonus +5%. [audit-20261105: timed duration rounds 0 -> 1 (applies during the round the ultimate is used)] |
| `324010172` | 神罚 / Mastery | Mastery: first ultimate each round reduces a random enemy Tianji by 1 (approximated energy loss 100); after ultimate applies 1 layer of 噬炎 (approximated as burn status, max 20 stacks) to all enemies; battle start attack +5%. {0}/噬炎 identity and Tianji require investigation. |
| `324010173` | 罪伞 / Mastery | Mastery: all ultimates/Tianji guaranteed crit and +60% final damage with no usage limit (crit guarantee approximated as crit-rate +1.0 and damage-bonus 0.60 on ultimate use); battle start crit-rate +5% and crit-damage +10%. [audit-20261105: timed duration rounds 0 -> 1 (applies during the round the ultimate is used)] |
| `324010174` | 神降 / Mastery | Mastery: after normal/skill gain 1 Tianji (approx energy +100); all allies ultimate damage +40% (permanent); after normal/skill next ultimate damage +15% (approximated 2 rounds). Tianji conversion requires investigation. |
| `324010175` | 业火 / Mastery | Mastery: each 10% crit-rate grants +10% crit-damage and +3% ignore-defense (cap +100% crit-damage/+30% ignore-defense) requires engine scaling (requiresInvestigation); on ultimate use +10% crit-rate and +15% crit-damage. [audit-20261105: timed duration rounds 0 -> 1 (applies during the round the ultimate is used)] |
| `120000018` | 破盾 / Passive | Passive: +15% damage to defense-type adventurers (target condition not enforced; approximated as permanent damage-bonus). |
| `120000025` | 戒备 / Passive | Passive: when self has buff, crit-resistance +30% (buff-presence condition approximated). |
| `6910001062` | Skill 6910001062 / Ultimate | Ultimate: metadata fallback -> 2.0x physical damage single (requiresInvestigation). |

## SKILL-2040201：幽艳瑞贝卡

补齐或核销 9 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `2204020123` | 捣蛋到底 / Ultimate | Ultimate: 130% magical damage to all enemies; consume all candy layers, each dealing 60% magical damage to a random unit. Candy (给了糖也捣蛋) layer scaling and per-layer application require engine integration (requiresInvestigation). Tianji cost 3. |
| `324020171` | 糖果礼花 / Mastery | Mastery: on ultimate, each candy deals extra 4% target max HP magical damage (cap 80% attack, not enforced); after self normal, +400 energy. Candy count scaling requires investigation. |
| `324020172` | 活力全开 / Mastery | Mastery: first ultimate each round reduces a random enemy Tianji by 1 (approx -100 energy); after self ultimate +10% final damage (max +30%), removed end of round. Tianji mapping requires investigation. |
| `324020173` | 送别礼物 / Mastery | 混合效果（主效果为伤害）：自身行动回合结束后再释放1次终结技，以“捣蛋到底”的130%全体法术伤害复刻一次作为近似；释放前摧毁敌方全体20%护盾无对应效果，近似为先驱散敌方全体1个可驱散增益（触发 priority -1 先于伤害）。每回合触发次数由引擎回合事件控制。 |
| `324020174` | 闪亮登场 / Mastery | Mastery: every round normal/skill grants +1 Tianji (approx +100 energy); after self ultimate, target final damage reduction -15% (max -60%), 2 rounds. Tianji mapping requires investigation. |
| `324020175` | 完美恶作剧 / Mastery | Mastery: first ultimate and first Tianji each round: +60% final crit and ignore 60% defense. First-use-per-round tracking requires investigation. |
| `120000009` | 鼓舞 / Passive | Passive: on ally normal/skill, self +25 energy (approximated as self trigger; ally condition requires investigation). |
| `120000014` | 格挡 / Passive | Passive: before 2nd ultimate, ultimate damage taken -20% (approximated as battle-start permanent reduction). |
| `6910001100` | Skill 6910001100 / Ultimate | Ultimate metadata fallback: damage 2.0x single (requiresInvestigation). |

## SKILL-3010101：抱抱信使

补齐或核销 2 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `120001007` | 激昂一击 / Passive | Passive: after kill, next ultimate damage +25% (approximated as damage-bonus for 2 rounds; exact consumption on ultimate requires engine support). Requires investigation. |
| `6910001040` | Skill 6910001040 / Ultimate | Ultimate: missing description (metadata fallback). Implemented as generic 2.0x physical damage single target (requires investigation). |

## SKILL-3010201：糖果侦探

补齐或核销 2 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `331020175` | 伟大创造 / Mastery | Mastery: on ultimate use, back-row allies +12% crit damage for 2 rounds (back-row ally targeting approximated as all-allies; requires investigation). |
| `6910001041` | Skill 6910001041 / Ultimate | Ultimate: missing description (metadata fallback). Implemented as generic 2.0x physical damage single target (requires investigation). |

## SKILL-3010301：赏金猎人

补齐或核销 1 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `6910001042` | Skill 6910001042 / Ultimate | Ultimate: metadata fallback (missing description). Implemented as generic 2.0x physical damage single target (requires investigation). |

## SKILL-3020101：热力厨娘

补齐或核销 3 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `332010174` | 盘石之固 / Mastery | 普攻/绝招后“下一次受伤”减免15%，引擎无单次消耗伤害减免，近似为1回合15%最终伤害减免。 |
| `120000054` | 鼓舞 / Passive | 描述为友方普攻/绝招时回复25能量；触发器只能绑定自身普攻，友方事件未接入，按自身普攻近似。 |
| `6910001035` | Skill 6910001035 / Ultimate | Ultimate: metadata fallback (missing description). Implemented as generic 2.0x physical damage single target (requires investigation). |

## SKILL-3020201：啵啵水母

补齐或核销 2 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `120001015` | 均衡卸力 / Passive | Passive: after ultimate, evasion +20% for 1 round (evasion stat approximated; requiresInvestigation). |
| `6910001036` | Skill 6910001036 / Ultimate | Ultimate: metadata fallback -> 2.0x physical damage single (requiresInvestigation). |

## SKILL-3020301：闪耀甜心

补齐或核销 2 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `120000054` | 鼓舞 / Passive | 描述为友方普攻/绝招时回复25能量；触发器只能绑定自身普攻，友方事件未接入，按自身普攻近似。 |
| `6910001037` | Skill 6910001037 / Ultimate | Ultimate: metadata fallback (missing description). Implemented as generic 2.0x physical damage single target (requires investigation). |

## SKILL-3020401：秘典魔女

补齐或核销 2 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `120000054` | 鼓舞 / Passive | 描述为友方普攻/绝招时回复25能量；触发器只能绑定自身普攻，友方事件未接入，按自身普攻近似。 |
| `6910001038` | Skill 6910001038 / Ultimate | Ultimate: metadata fallback (missing description). Implemented as generic 2.0x physical damage single target (requires investigation). |

## SKILL-3020501：灵刃艾莉

补齐或核销 4 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `120000018` | 破盾 / Passive | 未写 notes；需对照完整描述及 effects 确认，不能据标记直接认定完全缺失。 |
| `120000025` | 戒备 / Passive | 未写 notes；需对照完整描述及 effects 确认，不能据标记直接认定完全缺失。 |
| `120000028` | 鹰眼 / Passive | Passive: when HP > 50%, hit rate +15% (approximated as permanent; condition not gated). |
| `6910001039` | Skill 6910001039 / Ultimate | Ultimate: missing description (metadata fallback). Generic 2.0x physical damage single. requiresInvestigation. |

## SKILL-3030201：冰镰使徒

补齐或核销 2 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `6303020105` | 伊丽莎白_稀有技能 / Ultimate | 稀有技能：可执行的“任意攻击附加20%伤害加成”已实现为攻击时获得20%伤害加成；基础伤害沿用元数据兜底1.0x物理单击。按目标减益层数触发的≥3层回15%最大生命、≥6层按已损生命提升暴击率/暴击伤害（≤25%）、≥9层回200能量需要减益层数与目标状态条件，引擎未接入，待调查。 |
| `6910001029` | Skill 6910001029 / Ultimate | Ultimate: missing description (metadata fallback). Generic 2.0x physical damage single. requiresInvestigation. |

## SKILL-3030301：厉火之咒

补齐或核销 3 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `120001002` | 生命偷取 / Passive | Passive: ultimate damage 10% converted to self HP (lifesteal). Approximated as heal 20% attack; exact damage tracking requires engine integration. requiresInvestigation. |
| `6910001030` | Skill 6910001030 / Ultimate | Ultimate: missing description (metadata fallback). Generic 2.0x physical damage single. requiresInvestigation. |
| `333030174` | 炽星魔焰 / Mastery | 30% chance to add 1 burn layer for 2 rounds after normal/skill. Trigger chance cannot be rolled by processTriggers; stack count not tracked. restored by audit-20261105 (row was dropped by the catalog dump). |

## SKILL-3030401：剪刀新娘

补齐或核销 1 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `6910001031` | Skill 6910001031 / Ultimate | Ultimate: missing description (metadata fallback). Generic 2.0x physical damage single. requiresInvestigation. |

## SKILL-3030501：蜜雪儿

补齐或核销 5 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `333050175` | 嘎嘣脆 / Mastery | Mastery: frozen enemies take +20% crit damage (requires investigation). |
| `120001008` | 奋力一击 / Passive | Passive: ultimate damage to highest-HP enemy +30%; target-HP condition not enforced (requiresInvestigation). |
| `6401030108` | 蜜雪儿_稀有技能 / Ultimate | Rare: ice cone with freeze/silence/energy; simplified to damage (requires investigation). |
| `6910000104` | Skill 6910000104 / Ultimate | Ultimate: missing description (metadata fallback). Generic 2.0x physical damage single. requiresInvestigation. |
| `6910001032` | Skill 6910001032 / Ultimate | Ultimate: missing description (metadata fallback). Generic 2.0x physical damage single. requiresInvestigation. |

## SKILL-3030601：莉莉丝

补齐或核销 4 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `120000014` | 格挡 / Passive | 未写 notes；需对照完整描述及 effects 确认，不能据标记直接认定完全缺失。 |
| `120001008` | 奋力一击 / Passive | 未写 notes；需对照完整描述及 effects 确认，不能据标记直接认定完全缺失。 |
| `6303060111` | 莉莉丝_稀有技能 / Ultimate | 未写 notes；需对照完整描述及 effects 确认，不能据标记直接认定完全缺失。 |
| `6910001033` | Skill 6910001033 / Ultimate | 未写 notes；需对照完整描述及 effects 确认，不能据标记直接认定完全缺失。 |

## SKILL-3030701：焰舞

补齐或核销 3 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `120000014` | 格挡 / Passive | Passive: before 2nd ultimate, ultimate damage taken -20% (approximated as battle-start permanent reduction; requires investigation). |
| `120001008` | 奋力一击 / Passive | Passive: ultimate damage to highest-HP enemy +30%; target-HP condition not enforced (requiresInvestigation). |
| `6910001034` | Skill 6910001034 / Ultimate | Ultimate: missing description (metadata fallback). Generic 2.0x physical damage single. requiresInvestigation. |

## SKILL-3040101：伊娃

补齐或核销 8 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `2304010123` | 终末之章 / Ultimate | Ultimate: consumes 3 Tianji, 180% magical damage to back row, +5% max HP per 2 怒势 (max 25%), applies 1 撕裂, +1 共熠. Complex (怒势/撕裂/共熠 tracking, Tianji) requires investigation. |
| `334010171` | 源初 / Mastery | Mastery: battle start applies {0} buff to all allies (+40% crit damage) and self final damage +5%. {0} is rare follow-up skill (灵犀协狩) not implemented; requires investigation. |
| `334010172` | 禁果 / Mastery | Mastery: first ultimate each round reduces a random enemy Tianji by 1 (approx energy loss 100); {0} shield amount +100% (not modeled); battle start attack +5%. Tianji/shield require investigation. |
| `334010173` | 狮袭 / Mastery | Mastery: on enemy death trigger {0} follow-up once per round (and at round end if no death) - not modeled; battle start crit rate +5% and crit damage +10%. {0} follow-up requires investigation. |
| `334010174` | 创世 / Mastery | Mastery: after normal/skill gain 1 Tianji (approx energy +100) and next damage taken -15% for 1 round; {0} follow-up destroys 8% shield from all enemies and distributes to allies (not modeled). Requires investigation. |
| `334010175` | 终末 / Mastery | Mastery: first 3 rounds damage taken -8% (approx timed 3 rounds) and recover 5% max HP at end of round 3; {0} follow-up enhanced to all enemies +40% final damage and +40% crit rate (not modeled). Requires investigation. |
| `120001007` | 激昂一击 / Passive | Passive: after kill, next ultimate damage +25% (approximated as damage-bonus for 2 rounds; exact consumption on ultimate requires engine support). Requires investigation. |
| `6910001060` | Skill 6910001060 / Ultimate | Ultimate: missing description (metadata fallback). Generic 2.0x physical damage single. requiresInvestigation. |

## SKILL-3040201：阿涅斯

补齐或核销 8 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `2304020123` | 罪冠共鸣 / Ultimate | Ultimate: 130% magical damage to all enemies; detonate up to 5 焚魂 layers (remaining turns damage); heal self 3% missing HP per 焚魂 layer (max 60%); +50 energy per 腾焰 layer; activate 反噬 until round end (40% chance 火刑). (Detonation/heal scaling/反噬 require investigation.) |
| `334020171` | 冥焰妖华 / Mastery | Mastery: before each attack add 1 undispellable 焚魂 to all enemies (requires investigation); final damage bonus +5% on battle start. |
| `334020172` | 幽域迷心 / Mastery | Mastery: first ultimate each round reduces random enemy Tianji by 1; each attack destroys 10% shields on all enemies and redistributes to allies; attack +5% on battle start. (Tianji/shield redistribution require investigation.) |
| `334020173` | 伪约解构 / Mastery | Mastery: DoT damage +40%; each attack triggers 焚魂 extra once; crit rate +5% and crit damage +10% on battle start. (DoT/焚魂 trigger require investigation.) |
| `334020174` | 骸骨咏叹 / Mastery | Mastery: after normal/skill +1 Tianji (requires investigation); all allies real damage taken -40% (approx general damage-reduction); after normal/skill next ultimate damage +15%. |
| `334020175` | 魔神跪拜 / Mastery | Mastery: ultimate enhanced (ignore defense +20% permanent, max +60%); all attacks incl DoT crit damage +60%; on ultimate use crit rate +10% and crit damage +15%. (Stacking cap and 神启烬印 enhancement require investigation.) |
| `120000014` | 格挡 / Passive | Passive: before 2nd ultimate, ultimate damage taken -20% (approximated as battle-start permanent reduction; requires investigation). |
| `6910001064` | Skill 6910001064 / Ultimate | Ultimate: missing description (metadata fallback). Generic 2.0x physical damage single. requiresInvestigation. |

## SKILL-4010101：星之子

补齐或核销 3 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `120000014` | 格挡 / Passive | Passive: before 2nd ultimate, ultimate damage taken -20% (approximated as battle-start permanent reduction; requires investigation). |
| `120001002` | 生命偷取 / Passive | Passive: ultimate damage 10% converted to self HP (lifesteal). Approximated as heal 20% attack; exact damage tracking requires engine integration. requiresInvestigation. |
| `6910001056` | Skill 6910001056 / Ultimate | Ultimate: missing description (metadata fallback). Generic 2.0x physical damage single. requiresInvestigation. |

## SKILL-4010201：骑士利欧

补齐或核销 1 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `6910001057` | Skill 6910001057 / Ultimate | Ultimate: missing description (metadata fallback). Generic 2.0x physical damage single. requiresInvestigation. |

## SKILL-4010301：咩咩医生

补齐或核销 2 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `341030175` | 向阳而生 / Mastery | Mastery: on ultimate use, heal highest-attack ally for 5% max HP (approximated as highest-HP ally; target selection requires investigation). |
| `6910001058` | Skill 6910001058 / Ultimate | Ultimate: missing description (metadata fallback). Generic 2.0x physical damage single. requiresInvestigation. |

## SKILL-4020101：辉光神女

补齐或核销 2 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `342010175` | 引光同行 / Mastery | Mastery: at end of first round, all allies gain 100 energy. requiresInvestigation (round gating approximated). |
| `6910001051` | Skill 6910001051 / Ultimate | Ultimate: missing description (metadata fallback). Implemented as generic 2.0x physical damage single target (requires investigation). requiresInvestigation. |

## SKILL-4020201：爱心射手

补齐或核销 2 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `120001007` | 激昂一击 / Passive | Passive: after kill, next ultimate damage +25% (approximated as damage-bonus for 2 rounds; exact consumption on ultimate requires engine support). Requires investigation. |
| `6910001052` | Skill 6910001052 / Ultimate | Ultimate: metadata fallback damage 2.0x single (requires investigation). |

## SKILL-4020301：光枪守卫

补齐或核销 1 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `6910001053` | Skill 6910001053 / Ultimate |  |

## SKILL-4020401：铁拳莫林

补齐或核销 2 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `342040175` | 荡破千军 / Mastery | Mastery: on battle start, reduce all enemies status-resist by 5% (energy-reduction resist part requires investigation). |
| `6910001054` | Skill 6910001054 / Ultimate | Ultimate: missing description (metadata fallback). Implemented as generic 2.0x physical damage single target (requires investigation). requiresInvestigation. Ultimate: missing description (metadata fallback). |

## SKILL-4020501：蔷薇游侠

补齐或核销 2 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `120001002` | 生命偷取 / Passive | Passive: ultimate damage 10% converted to self HP (lifesteal). Approximated as heal 20% attack; exact damage tracking requires engine integration. requiresInvestigation. |
| `6910001055` | Skill 6910001055 / Ultimate | Ultimate: missing description (metadata fallback). Implemented as generic 2.0x physical damage single target (requires investigation). |

## SKILL-4030101：梦语

补齐或核销 6 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `343010172` | 健壮 / Mastery | Mastery: max HP +5% on battle start. Stat type max-hp-percent not in STAT_TYPES (requires investigation). |
| `343010173` | 超群技艺 / Mastery | Mastery: status hit and resist +10% on battle start. Stat types not in STAT_TYPES (requires investigation). |
| `343010175` | 预言梦境 / Mastery | Mastery: on ultimate use, all allies +10% crit damage reduction for 2 rounds. Stat type crit-damage-reduction not in STAT_TYPES (requires investigation). |
| `120000032` | 反弹 / Passive | Passive: when hit by back-row enemy, rebound rate +10% (back-row condition not enforced). |
| `120000037` | 亢奋 / Passive | Passive: when enemy knocked back/killed, self gains 100 energy (approximated as on-kill). |
| `6910001043` | Skill 6910001043 / Ultimate | Ultimate: missing description (metadata fallback). Generic 2.0x magical damage single. requiresInvestigation. |

## SKILL-4030201：赫拉

补齐或核销 7 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `343020172` | 健壮 / Mastery | Mastery: max HP +5% on battle start. Stat type max-hp-percent not in STAT_TYPES (requires investigation). |
| `343020173` | 超群技艺 / Mastery | Mastery: status hit and resist +10% on battle start. Stat types not in STAT_TYPES (requires investigation). |
| `343020175` | 灼目圣光 / Mastery | Mastery: on ultimate use, reduce target energy recovery speed by 5% for 2 rounds. Approximated as energy-bonus -0.05 (energy-recovery-speed not a standard statType; requiresInvestigation). |
| `120000032` | 反弹 / Passive | Passive: when hit by back-row enemy, rebound rate +10% (back-row condition not enforced). |
| `120000037` | 亢奋 / Passive | Passive: when enemy knocked back/killed, self gains 100 energy (approximated as on-kill). |
| `120001002` | 生命偷取 / Passive | Passive: ultimate damage 10% converted to self HP (lifesteal). Approximated as heal 20% attack; exact damage tracking requires engine integration. requiresInvestigation. |
| `6910001044` | Skill 6910001044 / Ultimate | Ultimate: missing description (metadata fallback). Generic 2.0x magical damage single. requiresInvestigation. |

## SKILL-4030301：天启之子

补齐或核销 4 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `343030175` | 永世罪罚 / Mastery | Mastery: 圣裁 buff grants extra -8% final damage reduction. Exact trigger (shield synergy? on-round-start?) requires investigation; modeled as permanent damage-reduction on round start. |
| `120000014` | 格挡 / Passive | Passive: before 2nd ultimate, ultimate damage taken -20% (approximated as battle-start permanent reduction; requires investigation). |
| `120001008` | 奋力一击 / Passive | Passive: ultimate damage to highest-HP enemy +30%; target-HP condition not enforced (requiresInvestigation). |
| `6910001045` | Skill 6910001045 / Ultimate | Ultimate: missing description (metadata fallback). Generic 2.0x physical damage single. requiresInvestigation. |

## SKILL-4030401：圣棺裁决

补齐或核销 7 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `343040172` | 健壮 / Mastery | Mastery: max HP +5% on battle start. Stat type max-hp-percent not in STAT_TYPES (requires investigation). |
| `343040173` | 超群技艺 / Mastery | Mastery: status hit and resist +10% on battle start. Stat types not in STAT_TYPES (requires investigation). |
| `343040175` | 虔心受洗 / Mastery | Mastery: 赎罪之棺 extra +20% being-crit probability. Approximated as crit-resist -0.20 on self (requires investigation). |
| `120000032` | 反弹 / Passive | Passive: when hit by back-row enemy, rebound rate +10% (back-row condition not enforced). |
| `120000045` | 坚毅 / Passive | Passive: first 2 rounds, sacred-artifact damage taken -35%. Approximated as damage-reduction 0.35 for 2 rounds (requires investigation). |
| `6403040106` | 夏弥尔_稀有技能 / Ultimate | Rare skill: complex hp-threshold/ultimate effect. Implemented as generic 2.0x magical damage single (requires investigation). |
| `6910001046` | Skill 6910001046 / Ultimate | Ultimate: missing description (metadata fallback). Generic 2.0x magical damage single. requiresInvestigation. |

## SKILL-4030501：武神蕾娜

补齐或核销 4 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `343050174` | 惩奸除恶 / Mastery | Mastery: after normal/skill, self normal/skill damage +2% for 1 round, max 5 stacks. Stacking behavior requires investigation. |
| `120000014` | 格挡 / Passive | Passive: before 2nd ultimate, ultimate damage taken -20% (approximated as battle-start permanent reduction; requires investigation). |
| `6403050105` | 蕾娜_稀有技能 / Ultimate | Rare skill: control-effect stacking + 16% lost-HP true damage (scaled by stacks, cap 240% ATK). Approximated as 1.6x true damage single; requires investigation. |
| `6910001047` | Skill 6910001047 / Ultimate | Ultimate: missing description (metadata fallback). Generic 2.0x physical damage single. requiresInvestigation. |

## SKILL-4030601：灵珑

补齐或核销 5 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `343060172` | 健壮 / Mastery | Mastery: max HP +5% on battle start. Stat type max-hp-percent not in STAT_TYPES (requires investigation). |
| `343060173` | 闪光翼击 / Mastery | Mastery: status hit and resist +10% on battle start. Stat types not in STAT_TYPES (requires investigation). |
| `120000032` | 反弹 / Passive | Passive: when hit by back-row enemy, rebound rate +10% (back-row condition not enforced). |
| `120000037` | 亢奋 / Passive | Passive: when enemy knocked back/killed, self gains 100 energy (approximated as on-kill). |
| `6910001048` | Skill 6910001048 / Ultimate | Ultimate: missing description (metadata fallback). Generic 2.0x magical damage single. requiresInvestigation. |

## SKILL-4030801：薇尔

补齐或核销 6 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `343080172` | 健壮 / Mastery | Mastery: max HP +5% on battle start. Stat type max-hp-percent not in STAT_TYPES (requires investigation). |
| `343080173` | 超群技艺 / Mastery | Mastery: status hit and resist +10% on battle start. Stat types not in STAT_TYPES (requires investigation). |
| `343080175` | 勇气礼赞 / Mastery | Mastery: on ultimate use, heal target for 5% max HP. Target approximated as lowest-HP ally (requires investigation). |
| `120000032` | 反弹 / Passive | Passive: when hit by back-row enemy, rebound rate +10% (back-row condition not enforced). |
| `120000037` | 亢奋 / Passive | Passive: when enemy knocked back/killed, self gains 100 energy (approximated as on-kill). |
| `6910001050` | Skill 6910001050 / Ultimate | Ultimate: missing description (metadata fallback). Generic 2.0x magical damage single. requiresInvestigation. |

## SKILL-4040201：命运三姝

补齐或核销 8 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `2404020123` | 命运无章 / Ultimate | Ultimate: consumes 3 Tianji, 130% physical damage to all enemies, grants 1 真实命运 (final damage +10%, max 10 stacks; every 2 stacks next ultimate becomes true damage), releases 命运领域 for 2 rounds (front-row enemies take 10% max HP true damage with 50% (100% from fate heroes) chance on any attack; back-row enemies take 30% ATK true damage). Complex (stacking/domain/Tianji) requires investigation. |
| `344020171` | 命运滚石 / Mastery | Mastery: ultimate becomes 命运审判 (all damage true, no 2-stack requirement); all true damage dealt +30% (130%); final damage bonus +5% on battle start. Complex (true-damage conversion) requires investigation. |
| `344020172` | 幸运利剪 / Mastery | Mastery: first ultimate each round lowers a random enemy Tianji by 1; after being hit by an ultimate, immediately cast one ultimate (max once per round); attack +5% on battle start. Complex (Tianji/counter-cast) requires investigation. |
| `344020173` | 三人成虎 / Mastery | Mastery: ultimate deals extra true damage equal to 2% max HP * 真实命运 stacks (max 20%); on enemy death immediately cast one free ultimate (max once per round); crit rate +5% and crit damage +10% on battle start. Complex (scaling/counter-cast) requires investigation. |
| `344020174` | 进化魔方 / Mastery | Mastery: after normal/skill gain 1 Tianji (approx energy +100); each 真实命运 stack +5% final crit rate (max 50%); next ultimate damage +15% after normal/skill. Complex (Tianji/stacking) requires investigation. |
| `344020175` | 一锤定音 / Mastery | Mastery: on death immediately revive with 100% HP and 1000 energy, and after revival all damage bonus and damage reduction +20%; on ultimate use extra crit rate +10% and crit damage +15%. Complex (revive) requires investigation. |
| `120000014` | 格挡 / Passive | Passive: before 2nd ultimate, ultimate damage taken -20% (approximated as battle-start permanent reduction; requires investigation). |
| `6910001049` | Skill 6910001049 / Ultimate | Ultimate: missing description (metadata fallback). Generic 2.0x physical damage single. requiresInvestigation. |

## SKILL-4040301：汐夜

补齐或核销 8 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `2404030123` | 溟渊重生 / Ultimate | Ultimate: destroy 50% current shields on all enemies + 130% physical damage; moonlight-layer based bonuses (20/40/60/80/100) and first-100-layer bond choice (requires investigation). |
| `344030171` | 圣辉沐愈 / Mastery | Mastery: Tianji true damage 0.4% maxHP*{moonlight} (requires investigation); each normal attack permanently +4% final damage reduction and heal bonus (max 20%); final damage +5% on battle start. |
| `344030172` | 光刃断罪 / Mastery | Mastery: first ultimate each round reduces random enemy Tianji by 1 (requires investigation); counter-attack on being hit by ultimate, max 2 per round (requires investigation); attack +5% on battle start. |
| `344030173` | 瞳寂渊语 / Mastery | Mastery: Tianji true damage 0.3% maxHP*{moonlight} (requires investigation); each normal attack permanently +4% final damage bonus and heal bonus (max 20%); crit rate +5% and crit damage +10% on battle start. |
| `344030174` | 溺亡盛礼 / Mastery | Mastery: +1 Tianji after normal/skill (requires investigation); heal all allies 10% max HP when hit by ultimate, max 3 per round (approximated); next ultimate damage +15% after normal/skill. |
| `344030175` | 蚀宫陷阱 / Mastery | Mastery: first Tianji each round refunds 100 moonlight (requires investigation); first Tianji grants +20% max HP and 100% max HP heal (requires investigation, max-hp-percent stat not in STAT_TYPES); on ultimate use crit rate +10% and crit damage +15%. |
| `120000014` | 格挡 / Passive | Passive: before 2nd ultimate, ultimate damage taken -20% (approximated as battle-start permanent reduction; requires investigation). |
| `6910001065` | Skill 6910001065 / Ultimate | Ultimate: missing description (metadata fallback). Generic 2.0x physical damage single. requiresInvestigation. |

## SKILL-4040401：千千结

补齐或核销 2 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `2404040123` | 绛丝乱舞 / Ultimate | Ultimate: destroy 50% current shields on all enemies + 130% physical damage; moonlight-layer based bonuses (20/40/60/80/100) and first-100-layer bond choice (requires investigation). |
| `6910001065` | Skill 6910001065 / Ultimate | Ultimate: missing description (metadata fallback). Generic 2.0x physical damage single. requiresInvestigation. |

## SKILL-5040101：夜璃

补齐或核销 8 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `2504010123` | 噬世之宴 / Ultimate | Ultimate: consumes 3 Tianji, 130% magical damage to all enemies; on crit reduces target energy recovery 10% (max 50%, 2 rounds) and allies next ultimate ignores 35% defense; first ultimate each round +50% crit rate. 虚像蛇影 aura (dodge/heal/energy/ignore-defense) and Tianji require investigation. |
| `354010172` | 潜能蕴养 / Mastery | Mastery: first ultimate each round reduces a random enemy Tianji by 1 (approx energy loss 100); after ultimate all allies +10% final damage (max 40%, removed at round end, approximated timed 1 round, max 4 triggers). Tianji/潜伏 require investigation. |
| `354010173` | 核心突破 / Mastery | Mastery: on exit 潜伏 state gain permanent +60% damage reduction and transfer 潜伏 to highest-attack ally (once per battle); in 潜伏 +20% hit rate. 潜伏 state tracking requires investigation (approximated as permanent on battle start). |
| `354010174` | 极意自现 / Mastery | Mastery: after normal/skill gain 1 Tianji (approx energy +100); before ultimate destroy 15% shield of all enemies (max 4/round, approximated as negative shield). Shield destruction/Tianji require investigation. [audit-20261105: negative shield multiplier replaced by shield-bonus stat-modifier (executor cannot destroy numeric shields proportionally)] |
| `354010175` | 真我超越 / Mastery | Mastery: on exit 潜伏 state immune to energy drain and next 2 control effects, and grant all allies 1000 energy + 1 Tianji. 潜伏 state/immunity require investigation (approximated as one-time energy gain on battle start). |
| `120000017` | 收割 / Passive | Passive: +10% damage to targets with HP below 50% (target HP condition not enforced; approximated as permanent damage-bonus). requiresInvestigation. |
| `120000020` | 洞察 / Passive | Passive: +20% crit rate when attacking targets with HP above 50% (target HP condition not enforced; approximated as permanent crit-rate). requiresInvestigation. |
| `120000026` | 刺杀 / Passive | Passive: +20% damage to back-row enemies (target position condition not enforced; approximated as permanent damage-bonus). requiresInvestigation. |

## SKILL-5040201：苏苏

补齐或核销 8 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `2504020123` | 曼舞鞭终 / Ultimate | Ultimate: consumes 3 Tianji, 130% magical damage to all enemies; all allies gain 1 狐佑 layer (+15% max HP heal after each normal/skill for 2 rounds) and 狐魅领域 (+20% final damage, +100 energy after normal/skill); enemies -20% final damage and -100 energy after normal/skill. Tianji cost, 狐佑 stacking and domain require investigation. |
| `354020172` | 灵狐曳影 / Mastery | Mastery: first ultimate each round reduces a random enemy 1 Tianji (approx energy loss 100); at round start 苏苏 gains shield 60% max HP. Tianji mechanic requires investigation. |
| `354020174` | 浅雾缠枝 / Mastery | Mastery: after self normal/skill, +1 Tianji (approx energy +100); at round end heal lowest-HP ally for all missing HP. Tianji mechanic requires investigation. |
| `354020175` | 魅霭封喉 / Mastery | Mastery: {fox domain} copied skills ignore 100% defense and +100% final damage; first normal/skill action restores 1000 energy to all allies. Domain/copy mechanics require investigation. |
| `120000033` | 陷阵 / Passive | Passive: damage to front-row enemies +10% (front-row condition not enforced). requiresInvestigation. |
| `120000035` | 齐心 / Passive | Passive: damage +3% per teammate in battle (max 15%, approximated max +0.15). Teammate count not enforced. requiresInvestigation. |
| `120000036` | 急救 / Passive | Passive: when ally HP < 50%, healing to them +15% (ally HP condition not enforced). requiresInvestigation. |
| `120000041` | 蓄势 / Passive | Passive: from round 2, ignore defense +15% (round gating not enforced). requiresInvestigation. |

## SKILL-5040301：千千结

补齐或核销 8 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `2504030123` | 绛丝乱舞 / Ultimate | Ultimate: 130% physical damage to all enemies ignoring 50% DEF, plus 15% max-HP true damage against 【致盲】 targets. The 致盲 conditional and the 100%-ATK cap on the extra damage are not modelled, so the extra hit is applied unconditionally as percent-max-hp damage; 天极值, 【乱针结护】 and 超凡生命 clauses from the merged description remain unmodelled. Mixed effects: first effect is damage. |
| `354030172` | 潜能蕴养 / Mastery | Mastery: after the first ultimate each round a random enemy loses 1 天极值 (approximated as 1 energy loss on a single target because 天极值 is not modelled); each ultimate grants +20% final damage bonus, removable at round end, up to 3 stacks. The ally half-bonus for other 冲锋 allies and the exact stack/removal timing are not modelled. |
| `354030173` | 核心突破 / Mastery | Mastery: the first ultimate each round is guaranteed to crit, approximated as +100% crit rate for one round on the first ultimate of the round. The {0} placeholder is unresolved in the catalog text, and 【裁断】 low-HP execution plus 10% attack steal are not modelled. |
| `354030174` | 极意自现 / Mastery | Mastery: after normal/skill actions gain 1 天极值 (approximated as +100 energy); before each ultimate destroy 20% of the target's shield, limited to 4 triggers per round. The effect framework cannot subtract shields directly, so the shield-destruction clause is registered as a positive shield entry on the target as a placeholder and remains an approximation. Per-round trigger reset is approximated with a battle-wide maxTriggers of 4. |
| `354030175` | 真我超越 / Mastery | Mastery: 【乱针结护】 is granted to all allies for the first 2 rounds, one extra 天极技 per round, guaranteed crit on the first 天极技 of each round, and all damage bonuses raised to 50%. Approximated with a single once-per-battle +50% damage-bonus trigger; 天极技 follow-up, guaranteed crit and the all-allies 乱针结护 state are not modelled. |
| `120000017` | 收割 / Passive | Passive: +10% damage against targets below 50% HP. Target HP condition is not enforced by the effect framework, so the bonus is approximated as a permanent self damage-bonus. |
| `120000020` | 洞察 / Passive | Passive: +20% crit rate when attacking targets above 50% HP. Target HP condition is not enforced, so the bonus is approximated as a permanent crit-rate. |
| `120000026` | 刺杀 / Passive | Passive: +20% damage against back-row enemies. Target position is not available to the effect framework, so the bonus is approximated as a permanent damage-bonus. |

## SKILL-5040401：零

补齐或核销 11 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `2504040123` | 湮灭力场 / Ultimate | Ultimate: reduces enemy shields by 35%, deals 20% of self max HP magical damage to all enemies (+40% if no shield), adds 损坏, silences highest-attack enemy; self damage reduction +10% per surviving ally; auto-casts ultimate on first Tianji damage taken each round (ignoring control). Complex Tianji/shield-reduction/damage-reduction require investigation. |
| `354040171` | 本源感知 / Mastery | Mastery: on battle start gain super-life (HP to 100% max), on {0} trigger cleanse all allies control + 1000 energy each. Approximated as full heal + energy + cleanse on round start. {0} trigger condition requires investigation. |
| `354040172` | 潜能蕴养 / Mastery | Mastery: first ultimate each round reduces a random enemy 1 Tianji (approx energy loss 100); at round start all allies gain shield 35% max HP. Tianji mechanic requires investigation. [audit-20261105: shield duration timed/0 -> permanent (description gives no round limit; shield lasts until consumed)] |
| `354040173` | 核心突破 / Mastery | Mastery: first 2 rounds, if no ally dead and >=2 adventurers, self immune to death; on ultimate use cleanse 3 debuffs from all allies. Approximated as protection status 2 rounds + dispel. requires investigation. |
| `354040174` | 极意自现 / Mastery | Mastery: after self normal/skill gain 1 Tianji (approx energy +100); at round end heal all allies 25% max HP. Tianji mechanic requires investigation. |
| `354040175` | 真我超越 / Mastery | Mastery: {0} resurrection ignores revival restrictions, grants 3 Tianji + immunity to next 3 ultimate/Tianji damage; ultimate additionally dispels 3 random buffs from all enemies. Approximated as energy gain + dispel. requires investigation. |
| `120000031` | 镇定 / Passive | Passive: when self has buff, damage reduction +10%. Condition (has buff) not enforced; approximated as permanent. requiresInvestigation. |
| `120000036` | 急救 / Passive | Passive: when ally HP < 50%, healing to them +15% (ally HP condition not enforced). requiresInvestigation. |
| `120000039` | 激怒 / Passive | Passive: when hit by normal/skill, gain 75 energy. Approximated as on-being-hit energy gain. requiresInvestigation. |
| `120000040` | 抵抗 / Passive | Passive: when HP < 70%, status resistance +20%. No status-resistance stat type; approximated as damage-reduction. requiresInvestigation. |
| `120000045` | 坚毅 / Passive | Passive: first 2 rounds, sacred-artifact damage taken -35%. Approximated as damage-reduction 0.35 for 2 rounds (requires investigation). |

## SKILL-5040501：烬

补齐或核销 5 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `2504050123` | 烬灭一击 / Ultimate | Ultimate: 130% physical damage to all enemies, adds 灰烬, damage converted to shield for self; +60% damage result reduction, reduces 10% per ultimate hit taken, +10% per ally ultimate (max 60%, resets per round); round start gain shield 50% max HP, first round self +4 layers 龙甲 +60% reduction, allies +2 layers; every 50% max HP healed triggers a free Tianji ultimate once per round. Complex Tianji/shield/damage-reduction require investigation. |
| `354050172` | 潜能蕴养 / Mastery | Mastery: first ultimate each round reduces a random enemy 1 Tianji (approx energy loss 100); at round start allies gain shield 100% max HP. Tianji mechanic requires investigation. [audit-20261105: shield duration timed/0 -> permanent (description gives no round limit; shield lasts until consumed)] |
| `354050173` | 核心突破 / Mastery | Mastery: after releasing 龙魂·裂石破天 keep full dragon-soul value; ultimate gains +100% final hit rate; during {0} each ultimate counterattack has 50% chance to trigger a free ultimate on {1} target, max 3 per battle. Dragon-soul/counterattack require investigation. |
| `354050174` | 极意自现 / Mastery | Mastery: after self normal/skill gain 1 Tianji (approx energy +100); at round start allies recover 25% max HP. Tianji mechanic requires investigation. |
| `354050175` | 真我超越 / Mastery | Mastery: dragon-soul value no longer cleared at round end and stacks until battle end; ultimate ignores shields and executes enemies below 25% HP. Approximated as energy gain at round end; requires investigation. |

## SKILL-5040601：奈奈子

补齐或核销 6 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `2504060123` | 元素倾泻 / Ultimate | Ultimate: 138% magic damage to all enemies; 僵直 approximated as 50% stun for 1 round; 进入战斗 damage taken -70% for 2 rounds approximated with a round-start damage-reduction trigger. Consuming 3 天极值, 倾泻/生命流失 conversion, 绯梦惊雷 free 天极技 loop and the 50%-HP counter damage boost are not modelled. Mixed effects: first effect is damage. |
| `354060171` | 本源感知 / Mastery | Mastery: summon 迪迪 that inherits 100% ATK/HP and absorbs fatal damage for 3 rounds. Approximated as a battle-start shield equal to 100% max HP for 3 rounds plus a once-per-battle full heal below 30% HP. Summon entity, 流星火雨 shared damage and 天极值 reduction are not modelled. |
| `354060173` | 核心突破 / Mastery | Mastery: 流星火雨 converts 僵直 into 倾泻; when 迪迪 leaves, 奈奈子 returns to full HP ignoring healing debuffs. Approximated as a once-per-battle full heal below 30% HP plus a 1-round +10% damage bonus on the first ultimate of each round (conversion mechanic not modelled). |
| `354060174` | 极意自现 / Mastery | Mastery: after each normal/skill action gain 1 天极值 (approximated as +100 energy because 天极值 is not modelled); counterattacks reduce enemy DEF by 5% up to 30% per round, approximated here as a stacking self defense debuff proxy on being-hit with max 6 triggers. Exact counter model requires investigation. |
| `354060175` | 真我超越 / Mastery | Mastery: 迪迪 can be re-summoned once per battle after leaving; every time 迪迪 leaves, 奈奈子 gains +30% ATK. Summon mechanics are not modelled, so the ATK bonus is registered as a once-per-battle on-death trigger approximation. |
| `120000014` | 格挡 / Passive | Passive: before the 2nd ultimate, ultimate damage taken -20%. Ultimate-only scope is not modelled; approximated as a once-per-battle permanent damage-reduction. |

## SKILL-5040701：绮梦·蜜雪儿

补齐或核销 7 条待复核引用。依赖 CORE-BATTLE、CORE-ATTR、CORE-SKILL-GATES；回归同英雄其余技能。

| 技能 ID | 名称 / 类别 | 当前登记的限制或近似 |
| --- | --- | --- |
| `2504070123` | 坠羽星落 / Ultimate | Ultimate: 138% magic damage to all enemies, then clears target energy (天极值 approximated as full energy loss). The extra 20% max-HP true damage is applied unconditionally because the 【绮梦】 debuff condition and the 100%-ATK cap cannot be evaluated, and failed actions / free 天极技 chains from 【绮梦·禁锢】 are not modelled. Mixed effects: first effect is damage. |
| `354070171` | 本源感知 / Mastery | Mastery (skill row reconstructed): battle start enters 【极寒幽隐】. Approximated as a once-per-battle full heal plus +30% evasion for 2 rounds; the 极寒幽隐 state itself and 超凡生命 (super-life) mechanic are not modelled. |
| `354070172` | 潜能蕴养 / Mastery | Mastery (skill row reconstructed): first ultimate each round drains 1 天极值 from a random enemy (approximated as 1 point of enemy energy loss because 天极值 is not modelled); 50% immunity to non-strong control is approximated as +50% status resistance. |
| `354070173` | 核心突破 / Mastery | Mastery (skill row reconstructed): each ultimate steals 5% final ATK (approximated as stacking +5% self attack-percent, max 4); opening action-priority -1 for all enemies approximated as -10% speed for the battle. 极寒幽隐 gating and per-target steal bookkeeping are not modelled. |
| `354070174` | 极意自现 / Mastery | Mastery (skill row reconstructed): +1 天极值 after each action, approximated as +100 energy after normal/skill actions. First-round full immunity to non-strong control has no representation in the current status framework and is not modelled. |
| `354070175` | 真我超越 / Mastery | Mastery (skill row reconstructed): each ultimate lowers target action priority by 1 (approximated as -10% target speed, stackable); the 50% chance to re-enter 极寒幽隐 on first exit is approximated as a once-per-battle +50% evasion for 1 round below 50% HP. 极寒幽隐 state is not modelled. |
| `120000014` | 格挡 / Passive | Passive: before the 2nd ultimate, ultimate damage taken -20%. Ultimate-only scope is not modelled; approximated as a once-per-battle permanent damage-reduction. |
