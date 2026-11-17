# B2 战斗投影丢失暴击、暴伤、阵营和完整战力

状态：已修复并通过组件回归；未部署、未做 APK 真机验收。

## 现象、触发与证据

用户要求审计全部数值系统，静态追踪 `assembleHeroAttributes → reportBattle / simulatePvpBattle → normalizeUnit → effectiveCrit*` 发现：属性层的 `critRate / critHarm` 没有进入战斗；基础暴伤固定 1.5，备用攻击用职业暴击下限覆盖实际 0 值。PvP 在两次对象转换中丢失 camp，阵营条件治疗/回能无法触发；PvP 战报只按四维重算战力，漏掉已组装的属性加成。

原表 `AttrType[11/12].value_type=1 / show_factor=10000`，薇尔基础 `crit=500 / crit_harm=15000`。属性生产者已明确给出 5% 和 1.5 倍，接入时只转换单位，不推定新的原服伤害公式。阵营消费由 `effects/effect-executor.mjs::targetCampMultiplier` 和已恢复的技能提供。

## 根因与修复范围

手工挑选战斗字段漏掉数值输入；战报另行重算已存在的权威战力。覆盖全部普通/精英/固定引导演示战斗和共用 PvP 战斗入口。保留未提供基础暴击时的既有备用职业行为；明确传入 0 时不得被覆盖。其他尚未恢复的抗暴、增减伤等完整 actor 通道单独登记审计缺口，不称已经恢复。

## 验证与防复发

新增 `personal-server/test/combat-numeric-projection.test.mjs`，先在旧实现运行，覆盖基础暴击 0/100%、基础暴伤、主线属性投影、PvP 阵营倍率与权威战力。

修复后结果：`projection-development-after.log` 9/9 通过，`focused-final.log` 82/82 通过；覆盖显式 0 暴击不被职业默认值覆盖、100% 不被截为 75%、主线传入基础暴击/暴伤、PvP 保留阵营和完整权威战力。验证等级为组件和直接战斗回归；未新增原服完整伤害公式的临时 TCP/真机验证，未部署、未写活库、未进行 APK 验收。
