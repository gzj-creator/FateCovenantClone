# DreamTrialActTable 规则参数

来源：[personal-server/assets/tables/DreamTrialActTable.data.lua.json.gz](../../../../personal-server/assets/tables/DreamTrialActTable.data.lua.json.gz)，SHA256：`365fcf7ce21356b82b6e9d2e253cc8e63d68a0fd190998d8eaf80fed8822bd47`。

[完整逐行JSON](DreamTrialActTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[PersonAward](#personaward)|30|decoded-rows|
|[GuildAward](#guildaward)|0|decoded-rows|
|[Damage](#damage)|60|decoded-rows|
|[AwardShow](#awardshow)|50|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[Monster](#monster)|18|decoded-rows|
|[Award](#award)|60|decoded-rows|
|[Rank](#rank)|5|decoded-rows|
|[ActiveScore](#activescore)|4|decoded-rows|
|[Version](#version)|6|decoded-rows|

## PersonAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|30|本表行键；与其他表同值不自动代表同一对象。|
|version|number|30|版本引用；必须按活动类型及其消费者查对应版本表。|
|rank_range|array|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|30|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"version":1,"rank_range":[1,1],"award":[[10140217,60],[3051200,3],[901900,300]]}`|
|102|`{"version":1,"rank_range":[2,2],"award":[[10140217,45],[3051200,2],[901900,270]]}`|
|103|`{"version":1,"rank_range":[3,3],"award":[[10140217,30],[3051200,1],[901900,240]]}`|
|104|`{"version":1,"rank_range":[4,10],"award":[[10140217,15],[901900,180]]}`|
|105|`{"version":1,"rank_range":[11,50],"award":[[10140217,10],[901900,150]]}`|
|201|`{"version":2,"rank_range":[1,1],"award":[[10140317,60],[3051200,3],[901900,300]]}`|
|202|`{"version":2,"rank_range":[2,2],"award":[[10140317,45],[3051200,2],[901900,270]]}`|
|203|`{"version":2,"rank_range":[3,3],"award":[[10140317,30],[3051200,1],[901900,240]]}`|
|204|`{"version":2,"rank_range":[4,10],"award":[[10140317,15],[901900,180]]}`|
|205|`{"version":2,"rank_range":[11,50],"award":[[10140317,10],[901900,150]]}`|
|301|`{"version":3,"rank_range":[1,1],"award":[[10140617,60],[3051200,3],[901900,300]]}`|
|302|`{"version":3,"rank_range":[2,2],"award":[[10140617,45],[3051200,2],[901900,270]]}`|
|303|`{"version":3,"rank_range":[3,3],"award":[[10140617,30],[3051200,1],[901900,240]]}`|
|304|`{"version":3,"rank_range":[4,10],"award":[[10140617,15],[901900,180]]}`|
|305|`{"version":3,"rank_range":[11,50],"award":[[10140617,10],[901900,150]]}`|
|401|`{"version":4,"rank_range":[1,1],"award":[[10140517,60],[3051200,3],[901900,300]]}`|
|402|`{"version":4,"rank_range":[2,2],"award":[[10140517,45],[3051200,2],[901900,270]]}`|
|403|`{"version":4,"rank_range":[3,3],"award":[[10140517,30],[3051200,1],[901900,240]]}`|
|404|`{"version":4,"rank_range":[4,10],"award":[[10140517,15],[901900,180]]}`|
|405|`{"version":4,"rank_range":[11,50],"award":[[10140517,10],[901900,150]]}`|
|1001|`{"version":10,"rank_range":[1,1],"award":[[4541200,60],[3051200,3],[901900,300]]}`|
|1002|`{"version":10,"rank_range":[2,2],"award":[[4541200,45],[3051200,2],[901900,270]]}`|
|1003|`{"version":10,"rank_range":[3,3],"award":[[4541200,30],[3051200,1],[901900,240]]}`|
|1004|`{"version":10,"rank_range":[4,10],"award":[[4541200,15],[901900,180]]}`|
|1005|`{"version":10,"rank_range":[11,50],"award":[[4541200,10],[901900,150]]}`|
|1101|`{"version":11,"rank_range":[1,1],"award":[[4541200,60],[3051200,3],[901900,300]]}`|
|1102|`{"version":11,"rank_range":[2,2],"award":[[4541200,45],[3051200,2],[901900,270]]}`|
|1103|`{"version":11,"rank_range":[3,3],"award":[[4541200,30],[3051200,1],[901900,240]]}`|
|1104|`{"version":11,"rank_range":[4,10],"award":[[4541200,15],[901900,180]]}`|
|1105|`{"version":11,"rank_range":[11,50],"award":[[4541200,10],[901900,150]]}`|

## GuildAward

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## Damage

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|60|本表行键；与其他表同值不自动代表同一对象。|
|type|number|60|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hit_Interval|array|60|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|harm|array|60|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|base_points|number|60|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|reference_value|number|60|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|more_damage|number|60|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|more_value|number|60|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"type":1,"hit_Interval":[0,1000000],"base_points":50,"reference_value":50,"more_damage":0,"more_value":0}`|
|2|`{"type":1,"hit_Interval":[1000001,5000000],"base_points":100,"reference_value":100,"more_damage":0,"more_value":0}`|
|3|`{"type":1,"hit_Interval":[5000001,10000000],"base_points":200,"reference_value":150,"more_damage":0,"more_value":0}`|
|4|`{"type":1,"hit_Interval":[10000001,25000000],"base_points":350,"reference_value":250,"more_damage":0,"more_value":0}`|
|5|`{"type":1,"hit_Interval":[25000001,70000000],"base_points":600,"reference_value":500,"more_damage":0,"more_value":0}`|
|6|`{"type":1,"hit_Interval":[70000001,400000000],"base_points":1100,"reference_value":1000,"more_damage":0,"more_value":0}`|
|7|`{"type":1,"hit_Interval":[400000001,1200000000],"base_points":2100,"reference_value":2000,"more_damage":0,"more_value":0}`|
|8|`{"type":1,"hit_Interval":[1200000001,2500000000],"base_points":4100,"reference_value":3000,"more_damage":0,"more_value":0}`|
|9|`{"type":1,"hit_Interval":[2500000001,3500000000],"base_points":7100,"reference_value":4000,"more_damage":0,"more_value":0}`|
|10|`{"type":1,"hit_Interval":[3500000001,70000000000],"base_points":11100,"reference_value":5000,"more_damage":700000000,"more_value":1}`|
|11|`{"type":2,"hit_Interval":[0,4000000],"base_points":50,"reference_value":50,"more_damage":0,"more_value":0}`|
|12|`{"type":2,"hit_Interval":[4000001,100000000],"base_points":100,"reference_value":100,"more_damage":0,"more_value":0}`|
|13|`{"type":2,"hit_Interval":[100000001,400000000],"base_points":200,"reference_value":150,"more_damage":0,"more_value":0}`|
|14|`{"type":2,"hit_Interval":[400000001,800000000],"base_points":350,"reference_value":250,"more_damage":0,"more_value":0}`|
|15|`{"type":2,"hit_Interval":[800000001,1750000000],"base_points":600,"reference_value":500,"more_damage":0,"more_value":0}`|
|16|`{"type":2,"hit_Interval":[1750000001,3250000000],"base_points":1100,"reference_value":1000,"more_damage":0,"more_value":0}`|
|17|`{"type":2,"hit_Interval":[3250000001,5000000000],"base_points":2100,"reference_value":2000,"more_damage":0,"more_value":0}`|
|18|`{"type":2,"hit_Interval":[5000000001,6750000000],"base_points":4100,"reference_value":3000,"more_damage":0,"more_value":0}`|
|19|`{"type":2,"hit_Interval":[6750000001,8750000000],"base_points":7100,"reference_value":4000,"more_damage":0,"more_value":0}`|
|20|`{"type":2,"hit_Interval":[8750000001,175000000000],"base_points":11100,"reference_value":5000,"more_damage":1750000000,"more_value":1}`|
|21|`{"type":3,"hit_Interval":[0,17500000],"base_points":50,"reference_value":50,"more_damage":0,"more_value":0}`|
|22|`{"type":3,"hit_Interval":[17500001,525000000],"base_points":100,"reference_value":100,"more_damage":0,"more_value":0}`|
|23|`{"type":3,"hit_Interval":[525000001,1750000000],"base_points":200,"reference_value":150,"more_damage":0,"more_value":0}`|
|24|`{"type":3,"hit_Interval":[1750000001,3500000000],"base_points":350,"reference_value":250,"more_damage":0,"more_value":0}`|
|25|`{"type":3,"hit_Interval":[3500000001,7000000000],"base_points":600,"reference_value":500,"more_damage":0,"more_value":0}`|
|26|`{"type":3,"hit_Interval":[7000000001,13000000000],"base_points":1100,"reference_value":1000,"more_damage":0,"more_value":0}`|
|27|`{"type":3,"hit_Interval":[13000000001,20000000000],"base_points":2100,"reference_value":2000,"more_damage":0,"more_value":0}`|
|28|`{"type":3,"hit_Interval":[20000000001,27000000000],"base_points":4100,"reference_value":3000,"more_damage":0,"more_value":0}`|
|29|`{"type":3,"hit_Interval":[27000000001,35000000000],"base_points":7100,"reference_value":4000,"more_damage":0,"more_value":0}`|
|30|`{"type":3,"hit_Interval":[35000000001,700000000000],"base_points":11100,"reference_value":5000,"more_damage":7000000000,"more_value":1}`|
|31|`{"type":4,"hit_Interval":[0,35000000],"base_points":50,"reference_value":50,"more_damage":0,"more_value":0}`|
|32|`{"type":4,"hit_Interval":[35000001,1050000000],"base_points":100,"reference_value":100,"more_damage":0,"more_value":0}`|
|33|`{"type":4,"hit_Interval":[1050000001,3500000000],"base_points":200,"reference_value":150,"more_damage":0,"more_value":0}`|
|34|`{"type":4,"hit_Interval":[3500000001,7000000000],"base_points":350,"reference_value":250,"more_damage":0,"more_value":0}`|
|35|`{"type":4,"hit_Interval":[7000000001,14000000000],"base_points":600,"reference_value":500,"more_damage":0,"more_value":0}`|
|36|`{"type":4,"hit_Interval":[14000000001,26000000000],"base_points":1100,"reference_value":1000,"more_damage":0,"more_value":0}`|
|37|`{"type":4,"hit_Interval":[26000000001,40000000000],"base_points":2100,"reference_value":2000,"more_damage":0,"more_value":0}`|
|38|`{"type":4,"hit_Interval":[40000000001,54000000000],"base_points":4100,"reference_value":3000,"more_damage":0,"more_value":0}`|
|39|`{"type":4,"hit_Interval":[54000000001,70000000000],"base_points":7100,"reference_value":4000,"more_damage":0,"more_value":0}`|
|40|`{"type":4,"hit_Interval":[70000000001,1400000000000],"base_points":11100,"reference_value":5000,"more_damage":14000000000,"more_value":1}`|
|41|`{"type":5,"hit_Interval":[0,70000000],"base_points":50,"reference_value":50,"more_damage":0,"more_value":0}`|
|42|`{"type":5,"hit_Interval":[70000001,2100000000],"base_points":100,"reference_value":100,"more_damage":0,"more_value":0}`|
|43|`{"type":5,"hit_Interval":[2100000001,7000000000],"base_points":200,"reference_value":150,"more_damage":0,"more_value":0}`|
|44|`{"type":5,"hit_Interval":[7000000001,14000000000],"base_points":350,"reference_value":250,"more_damage":0,"more_value":0}`|
|45|`{"type":5,"hit_Interval":[14000000001,28000000000],"base_points":600,"reference_value":500,"more_damage":0,"more_value":0}`|
|46|`{"type":5,"hit_Interval":[28000000001,52000000000],"base_points":1100,"reference_value":1000,"more_damage":0,"more_value":0}`|
|47|`{"type":5,"hit_Interval":[52000000001,80000000000],"base_points":2100,"reference_value":2000,"more_damage":0,"more_value":0}`|
|48|`{"type":5,"hit_Interval":[80000000001,108000000000],"base_points":4100,"reference_value":3000,"more_damage":0,"more_value":0}`|
|49|`{"type":5,"hit_Interval":[108000000001,140000000000],"base_points":7100,"reference_value":4000,"more_damage":0,"more_value":0}`|
|50|`{"type":5,"hit_Interval":[140000000001,2800000000000],"base_points":11100,"reference_value":5000,"more_damage":28000000000,"more_value":1}`|
|51|`{"type":6,"hit_Interval":[0,350000000],"base_points":50,"reference_value":50,"more_damage":0,"more_value":0}`|
|52|`{"type":6,"hit_Interval":[350000001,10000000000],"base_points":100,"reference_value":100,"more_damage":0,"more_value":0}`|
|53|`{"type":6,"hit_Interval":[10000000001,35000000000],"base_points":200,"reference_value":150,"more_damage":0,"more_value":0}`|
|54|`{"type":6,"hit_Interval":[35000000001,70000000000],"base_points":350,"reference_value":250,"more_damage":0,"more_value":0}`|
|55|`{"type":6,"hit_Interval":[70000000001,140000000000],"base_points":600,"reference_value":500,"more_damage":0,"more_value":0}`|
|56|`{"type":6,"hit_Interval":[140000000001,260000000000],"base_points":1100,"reference_value":1000,"more_damage":0,"more_value":0}`|
|57|`{"type":6,"hit_Interval":[260000000001,400000000000],"base_points":2100,"reference_value":2000,"more_damage":0,"more_value":0}`|
|58|`{"type":6,"hit_Interval":[400000000001,540000000000],"base_points":4100,"reference_value":3000,"more_damage":0,"more_value":0}`|
|59|`{"type":6,"hit_Interval":[540000000001,700000000000],"base_points":7100,"reference_value":4000,"more_damage":0,"more_value":0}`|
|60|`{"type":6,"hit_Interval":[700000000001,14000000000000],"base_points":11100,"reference_value":5000,"more_damage":140000000000,"more_value":1}`|

## AwardShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|50|本表行键；与其他表同值不自动代表同一对象。|
|type|number|50|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|50|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1101|`{"type":11,"award":[25400204,4]}`|
|1102|`{"type":11,"award":[20400504,8]}`|
|1103|`{"type":11,"award":[10140217,30]}`|
|1104|`{"type":11,"award":[3051200,5]}`|
|1201|`{"type":12,"award":[25400204,4]}`|
|1202|`{"type":12,"award":[20400504,8]}`|
|1203|`{"type":12,"award":[10140217,30]}`|
|1204|`{"type":12,"award":[3051200,5]}`|
|2101|`{"type":21,"award":[25400204,4]}`|
|2102|`{"type":21,"award":[20400504,8]}`|
|2103|`{"type":21,"award":[4521200,30]}`|
|2104|`{"type":21,"award":[3051200,5]}`|
|2201|`{"type":22,"award":[25400204,4]}`|
|2202|`{"type":22,"award":[20400504,8]}`|
|2203|`{"type":22,"award":[4521200,30]}`|
|2204|`{"type":22,"award":[3051200,5]}`|
|3101|`{"type":31,"award":[25400204,4]}`|
|3102|`{"type":31,"award":[20400504,8]}`|
|3103|`{"type":31,"award":[4531200,30]}`|
|3104|`{"type":31,"award":[3051200,5]}`|
|3201|`{"type":32,"award":[25400204,4]}`|
|3202|`{"type":32,"award":[20400504,8]}`|
|3203|`{"type":32,"award":[4531200,30]}`|
|3204|`{"type":32,"award":[3051200,5]}`|
|4101|`{"type":41,"award":[25400204,4]}`|
|4102|`{"type":41,"award":[20400504,8]}`|
|4103|`{"type":41,"award":[4541200,30]}`|
|4104|`{"type":41,"award":[3051200,5]}`|
|4201|`{"type":42,"award":[25400204,4]}`|
|4202|`{"type":42,"award":[20400504,8]}`|
|4203|`{"type":42,"award":[4541200,30]}`|
|4204|`{"type":42,"award":[3051200,5]}`|
|10101|`{"type":101,"award":[21500104,4]}`|
|10102|`{"type":101,"award":[4591200,8]}`|
|10103|`{"type":101,"award":[25400204,4]}`|
|10104|`{"type":101,"award":[20400504,8]}`|
|10105|`{"type":101,"award":[4541200,30]}`|
|10106|`{"type":101,"award":[850002,3]}`|
|10107|`{"type":101,"award":[22002,5]}`|
|10108|`{"type":101,"award":[494002,12]}`|
|10109|`{"type":101,"award":[493002,600]}`|
|10201|`{"type":102,"award":[21500104,4]}`|
|10202|`{"type":102,"award":[4591200,8]}`|
|10203|`{"type":102,"award":[25400204,4]}`|
|10204|`{"type":102,"award":[20400504,8]}`|
|10205|`{"type":102,"award":[4541200,30]}`|
|10206|`{"type":102,"award":[850002,3]}`|
|10207|`{"type":102,"award":[22002,5]}`|
|10208|`{"type":102,"award":[494002,12]}`|
|10209|`{"type":102,"award":[493002,600]}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|fight_restore_num|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_cooldown|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|robbery_restore_num|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|robbery_cooldown|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|robbery_reference|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|being_robbed_num|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rob_rank_between|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pvp_fight_tid|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"fight_restore_num":3,"fight_cooldown":7200,"robbery_restore_num":3,"being_robbed_num":3,"rob_rank_between":5,"pvp_fight_tid":16010001}`|

## Monster

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|18|本表行键；与其他表同值不自动代表同一对象。|
|belong|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|nick_name|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|style|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_tid|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pre_monster|object/array|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hp|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|decay_hp|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|decay_day|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|decay_time|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rank_score_index|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|active_score_index|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_index|number|18|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|ui_scale|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|settle_order|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr|array|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ui_pos|array|17|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ui_node_pos|array|17|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ui_arrow_pos|array|17|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ui_aura_pos|array|17|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|11|`{"type":0,"fight_tid":16010011,"pre_monster":{"global":"TableEmpty"},"hp":625000,"decay_hp":1500,"decay_day":2,"decay_time":60,"rank_score_index":1,"active_score_index":1,"award_index":11,"attr":[[1,100000000000000]]}`|
|12|`{"type":0,"fight_tid":16010012,"pre_monster":{"global":"TableEmpty"},"hp":1050000,"decay_hp":1800,"decay_day":2,"decay_time":60,"rank_score_index":1,"active_score_index":1,"award_index":11,"attr":[[1,100000000000000]]}`|
|13|`{"type":1,"fight_tid":16010013,"pre_monster":[11,12],"hp":2500000,"decay_hp":4500,"decay_day":4,"decay_time":60,"rank_score_index":1,"active_score_index":1,"award_index":12,"attr":[[1,100000000000000]]}`|
|21|`{"type":0,"fight_tid":16010111,"pre_monster":{"global":"TableEmpty"},"hp":625000,"decay_hp":1500,"decay_day":2,"decay_time":60,"rank_score_index":1,"active_score_index":1,"award_index":21,"attr":[[1,100000000000000]]}`|
|22|`{"type":0,"fight_tid":16010112,"pre_monster":{"global":"TableEmpty"},"hp":1050000,"decay_hp":1800,"decay_day":2,"decay_time":60,"rank_score_index":1,"active_score_index":1,"award_index":21,"attr":[[1,100000000000000]]}`|
|23|`{"type":1,"fight_tid":16010113,"pre_monster":[21,22],"hp":2500000,"decay_hp":4500,"decay_day":4,"decay_time":60,"rank_score_index":1,"active_score_index":1,"award_index":22,"attr":[[1,100000000000000]]}`|
|31|`{"type":0,"fight_tid":16010211,"pre_monster":{"global":"TableEmpty"},"hp":625000,"decay_hp":1500,"decay_day":2,"decay_time":60,"rank_score_index":1,"active_score_index":1,"award_index":31,"attr":[[1,100000000000000]]}`|
|32|`{"type":0,"fight_tid":16010212,"pre_monster":{"global":"TableEmpty"},"hp":1050000,"decay_hp":1800,"decay_day":2,"decay_time":60,"rank_score_index":1,"active_score_index":1,"award_index":31,"attr":[[1,100000000000000]]}`|
|33|`{"type":1,"fight_tid":16010213,"pre_monster":[31,32],"hp":2500000,"decay_hp":4500,"decay_day":4,"decay_time":60,"rank_score_index":1,"active_score_index":1,"award_index":32,"attr":[[1,100000000000000]]}`|
|41|`{"type":0,"fight_tid":16010311,"pre_monster":{"global":"TableEmpty"},"hp":625000,"decay_hp":1500,"decay_day":2,"decay_time":60,"rank_score_index":1,"active_score_index":1,"award_index":41,"attr":[[1,100000000000000]]}`|
|42|`{"type":0,"fight_tid":16010312,"pre_monster":{"global":"TableEmpty"},"hp":1050000,"decay_hp":1800,"decay_day":2,"decay_time":60,"rank_score_index":1,"active_score_index":1,"award_index":41,"attr":[[1,100000000000000]]}`|
|43|`{"type":1,"fight_tid":16010313,"pre_monster":[41,42],"hp":2500000,"decay_hp":4500,"decay_day":4,"decay_time":60,"rank_score_index":1,"active_score_index":1,"award_index":42,"attr":[[1,100000000000000]]}`|
|101|`{"type":0,"fight_tid":16010411,"pre_monster":{"global":"TableEmpty"},"hp":625000,"decay_hp":1500,"decay_day":2,"decay_time":60,"rank_score_index":1,"active_score_index":1,"award_index":101,"attr":[[1,900000000000000]]}`|
|102|`{"type":0,"fight_tid":16010412,"pre_monster":{"global":"TableEmpty"},"hp":1050000,"decay_hp":1800,"decay_day":2,"decay_time":60,"rank_score_index":1,"active_score_index":1,"award_index":101,"attr":[[1,900000000000000]]}`|
|103|`{"type":1,"fight_tid":16010413,"pre_monster":[101,102],"hp":2500000,"decay_hp":4500,"decay_day":4,"decay_time":60,"rank_score_index":1,"active_score_index":1,"award_index":102,"attr":[[1,900000000000000]]}`|
|111|`{"type":0,"fight_tid":16010511,"pre_monster":{"global":"TableEmpty"},"hp":12000000,"decay_hp":30000,"decay_day":2,"decay_time":60,"rank_score_index":1,"active_score_index":1,"award_index":101,"attr":[[1,900000000000000]]}`|
|112|`{"type":0,"fight_tid":16010512,"pre_monster":{"global":"TableEmpty"},"hp":20000000,"decay_hp":35000,"decay_day":2,"decay_time":60,"rank_score_index":1,"active_score_index":1,"award_index":101,"attr":[[1,900000000000000]]}`|
|113|`{"type":1,"fight_tid":16010513,"pre_monster":[111,112],"hp":48000000,"decay_hp":85000,"decay_day":4,"decay_time":60,"rank_score_index":1,"active_score_index":1,"award_index":102,"attr":[[1,900000000000000]]}`|

## Award

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|60|本表行键；与其他表同值不自动代表同一对象。|
|type|number|60|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|score_range|array|60|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|60|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|auction_id|number|60|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"type":11,"score_range":[110,999],"award":[[901900,50],[21002,5]]}`|
|2|`{"type":11,"score_range":[90,109],"award":[[901900,50],[21002,5]]}`|
|3|`{"type":11,"score_range":[70,89],"award":[[901900,50],[21002,5]]}`|
|4|`{"type":11,"score_range":[30,69],"award":[[901900,50],[21002,5]]}`|
|5|`{"type":11,"score_range":[10,29],"award":[[901900,50],[21002,5]]}`|
|6|`{"type":11,"score_range":[0,9],"award":[[901900,50],[21002,5]]}`|
|7|`{"type":12,"score_range":[110,999],"award":[[901900,50],[21002,5]]}`|
|8|`{"type":12,"score_range":[90,109],"award":[[901900,50],[21002,5]]}`|
|9|`{"type":12,"score_range":[70,89],"award":[[901900,50],[21002,5]]}`|
|10|`{"type":12,"score_range":[30,69],"award":[[901900,50],[21002,5]]}`|
|11|`{"type":12,"score_range":[10,29],"award":[[901900,50],[21002,5]]}`|
|12|`{"type":12,"score_range":[0,9],"award":[[901900,50],[21002,5]]}`|
|13|`{"type":21,"score_range":[110,999],"award":[[901900,50],[21002,5]]}`|
|14|`{"type":21,"score_range":[90,109],"award":[[901900,50],[21002,5]]}`|
|15|`{"type":21,"score_range":[70,89],"award":[[901900,50],[21002,5]]}`|
|16|`{"type":21,"score_range":[30,69],"award":[[901900,50],[21002,5]]}`|
|17|`{"type":21,"score_range":[10,29],"award":[[901900,50],[21002,5]]}`|
|18|`{"type":21,"score_range":[0,9],"award":[[901900,50],[21002,5]]}`|
|19|`{"type":22,"score_range":[110,999],"award":[[901900,50],[21002,5]]}`|
|20|`{"type":22,"score_range":[90,109],"award":[[901900,50],[21002,5]]}`|
|21|`{"type":22,"score_range":[70,89],"award":[[901900,50],[21002,5]]}`|
|22|`{"type":22,"score_range":[30,69],"award":[[901900,50],[21002,5]]}`|
|23|`{"type":22,"score_range":[10,29],"award":[[901900,50],[21002,5]]}`|
|24|`{"type":22,"score_range":[0,9],"award":[[901900,50],[21002,5]]}`|
|25|`{"type":31,"score_range":[110,999],"award":[[901900,50],[21002,5]]}`|
|26|`{"type":31,"score_range":[90,109],"award":[[901900,50],[21002,5]]}`|
|27|`{"type":31,"score_range":[70,89],"award":[[901900,50],[21002,5]]}`|
|28|`{"type":31,"score_range":[30,69],"award":[[901900,50],[21002,5]]}`|
|29|`{"type":31,"score_range":[10,29],"award":[[901900,50],[21002,5]]}`|
|30|`{"type":31,"score_range":[0,9],"award":[[901900,50],[21002,5]]}`|
|31|`{"type":32,"score_range":[110,999],"award":[[901900,50],[21002,5]]}`|
|32|`{"type":32,"score_range":[90,109],"award":[[901900,50],[21002,5]]}`|
|33|`{"type":32,"score_range":[70,89],"award":[[901900,50],[21002,5]]}`|
|34|`{"type":32,"score_range":[30,69],"award":[[901900,50],[21002,5]]}`|
|35|`{"type":32,"score_range":[10,29],"award":[[901900,50],[21002,5]]}`|
|36|`{"type":32,"score_range":[0,9],"award":[[901900,50],[21002,5]]}`|
|37|`{"type":41,"score_range":[110,999],"award":[[901900,50],[21002,5]]}`|
|38|`{"type":41,"score_range":[90,109],"award":[[901900,50],[21002,5]]}`|
|39|`{"type":41,"score_range":[70,89],"award":[[901900,50],[21002,5]]}`|
|40|`{"type":41,"score_range":[30,69],"award":[[901900,50],[21002,5]]}`|
|41|`{"type":41,"score_range":[10,29],"award":[[901900,50],[21002,5]]}`|
|42|`{"type":41,"score_range":[0,9],"award":[[901900,50],[21002,5]]}`|
|43|`{"type":42,"score_range":[110,999],"award":[[901900,50],[21002,5]]}`|
|44|`{"type":42,"score_range":[90,109],"award":[[901900,50],[21002,5]]}`|
|45|`{"type":42,"score_range":[70,89],"award":[[901900,50],[21002,5]]}`|
|46|`{"type":42,"score_range":[30,69],"award":[[901900,50],[21002,5]]}`|
|47|`{"type":42,"score_range":[10,29],"award":[[901900,50],[21002,5]]}`|
|48|`{"type":42,"score_range":[0,9],"award":[[901900,50],[21002,5]]}`|
|49|`{"type":101,"score_range":[110,999],"award":[[901900,50],[21002,5]]}`|
|50|`{"type":101,"score_range":[90,109],"award":[[901900,50],[21002,5]]}`|
|51|`{"type":101,"score_range":[70,89],"award":[[901900,50],[21002,5]]}`|
|52|`{"type":101,"score_range":[30,69],"award":[[901900,50],[21002,5]]}`|
|53|`{"type":101,"score_range":[10,29],"award":[[901900,50],[21002,5]]}`|
|54|`{"type":101,"score_range":[0,9],"award":[[901900,50],[21002,5]]}`|
|55|`{"type":102,"score_range":[110,999],"award":[[901900,50],[21002,5]]}`|
|56|`{"type":102,"score_range":[90,109],"award":[[901900,50],[21002,5]]}`|
|57|`{"type":102,"score_range":[70,89],"award":[[901900,50],[21002,5]]}`|
|58|`{"type":102,"score_range":[30,69],"award":[[901900,50],[21002,5]]}`|
|59|`{"type":102,"score_range":[10,29],"award":[[901900,50],[21002,5]]}`|
|60|`{"type":102,"score_range":[0,9],"award":[[901900,50],[21002,5]]}`|

## Rank

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|type|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rank_range|array|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|auction_score|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"type":1,"rank_range":[1,1],"auction_score":60}`|
|2|`{"type":1,"rank_range":[2,2],"auction_score":40}`|
|3|`{"type":1,"rank_range":[3,3],"auction_score":30}`|
|4|`{"type":1,"rank_range":[4,5],"auction_score":10}`|
|5|`{"type":1,"rank_range":[6,999],"auction_score":0}`|

## ActiveScore

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|type|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|active_player_range|array|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|score|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"type":1,"score":0}`|
|2|`{"type":1,"score":10}`|
|3|`{"type":1,"score":40}`|
|4|`{"type":1,"score":50}`|

## Version

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|harm_type|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|6|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|open_time|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|end_time|number|6|结束日期内秒偏移；不是单独完整时间戳。|
|player_rank|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|guild_rank|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|guild_damage_rank|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_award_index|array|6|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"harm_type":1,"award":[[901900,50],[21002,5]],"open_time":25200,"end_time":61200,"player_rank":283,"guild_rank":284,"guild_damage_rank":285,"show_award_index":[11,12]}`|
|2|`{"harm_type":2,"award":[[901900,50],[21002,5]],"open_time":25200,"end_time":61200,"player_rank":290,"guild_rank":291,"guild_damage_rank":292,"show_award_index":[21,22]}`|
|3|`{"harm_type":3,"award":[[901900,50],[21002,5]],"open_time":25200,"end_time":61200,"player_rank":293,"guild_rank":294,"guild_damage_rank":295,"show_award_index":[31,32]}`|
|4|`{"harm_type":4,"award":[[901900,50],[21002,5]],"open_time":25200,"end_time":61200,"player_rank":299,"guild_rank":300,"guild_damage_rank":301,"show_award_index":[41,42]}`|
|10|`{"harm_type":5,"award":[[901900,50],[21002,5]],"open_time":25200,"end_time":61200,"player_rank":299,"guild_rank":300,"guild_damage_rank":301,"show_award_index":[101,102]}`|
|11|`{"harm_type":6,"award":[[901900,50],[21002,5]],"open_time":25200,"end_time":61200,"player_rank":299,"guild_rank":300,"guild_damage_rank":301,"show_award_index":[101,102]}`|
