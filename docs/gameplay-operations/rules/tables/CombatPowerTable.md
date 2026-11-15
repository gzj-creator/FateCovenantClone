# CombatPowerTable 规则参数

来源：[personal-server/assets/tables/CombatPowerTable.rows.json.gz](../../../../personal-server/assets/tables/CombatPowerTable.rows.json.gz)，SHA256：`5bfba02e55eddd265f691426e8346a454bcf875dca7ae22e91f7db1e03ac15be`。

[完整逐行JSON](CombatPowerTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[CPGlobalExtra](#cpglobalextra)|0|decoded-rows|
|[SubModuleGroup](#submodulegroup)|22|decoded-rows|
|[Subtype](#subtype)|21|decoded-rows|
|[Comparison](#comparison)|18|decoded-rows|
|[CPAttr](#cpattr)|21|decoded-rows|
|[CPConstant](#cpconstant)|1|decoded-rows|
|[CPAbility](#cpability)|15|decoded-rows|
|[ComparisonSuggestOpen](#comparisonsuggestopen)|5|decoded-rows|
|[SubModule](#submodule)|46|decoded-rows|
|[ModuleCalculate](#modulecalculate)|120|decoded-rows|
|[CPBreak](#cpbreak)|24|decoded-rows|
|[CPSkillShineUpon](#cpskillshineupon)|782|decoded-rows|
|[SpecialAttrType](#specialattrtype)|23|decoded-rows|
|[CPHeroStarQuality](#cpherostarquality)|20|decoded-rows|

## CPGlobalExtra

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## SubModuleGroup

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|22|本表行键；与其他表同值不自动代表同一对象。|
|comparison|number|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|name|number|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|jump|number|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|suggest_icon_dark|string|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|suggest_icon_light|string|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|
|6|`{}`|
|7|`{}`|
|8|`{}`|
|9|`{}`|
|11|`{}`|
|12|`{}`|
|13|`{}`|
|14|`{}`|
|15|`{}`|
|16|`{}`|
|17|`{}`|
|18|`{}`|
|19|`{}`|
|20|`{}`|
|21|`{}`|
|22|`{}`|
|23|`{}`|

## Subtype

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|21|本表行键；与其他表同值不自动代表同一对象。|
|attr_range|array|21|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|single_rating_play_type|number|21|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"attr_range":[1,6,11],"single_rating_play_type":1}`|
|2|`{"attr_range":[7,12,51,52,9],"single_rating_play_type":0}`|
|3|`{"attr_range":[2,50],"single_rating_play_type":0}`|
|4|`{"attr_range":[8],"single_rating_play_type":0}`|
|5|`{"attr_range":[3],"single_rating_play_type":3}`|
|6|`{"attr_range":[5,59,60],"single_rating_play_type":0}`|
|7|`{"attr_range":[54],"single_rating_play_type":54}`|
|8|`{"attr_range":[4,55],"single_rating_play_type":0}`|
|9|`{"attr_range":[13],"single_rating_play_type":0}`|
|10|`{"attr_range":[16],"single_rating_play_type":0}`|
|11|`{"attr_range":[15,17],"single_rating_play_type":15}`|
|12|`{"attr_range":[56,57,58],"single_rating_play_type":0}`|
|13|`{"attr_range":[61,62],"single_rating_play_type":0}`|
|14|`{"attr_range":[51,7],"single_rating_play_type":0}`|
|15|`{"attr_range":[9],"single_rating_play_type":0}`|
|16|`{"attr_range":[12],"single_rating_play_type":0}`|
|17|`{"attr_range":[59,60],"single_rating_play_type":0}`|
|18|`{"attr_range":[69,70],"single_rating_play_type":0}`|
|19|`{"attr_range":[72,73],"single_rating_play_type":0}`|
|20|`{"attr_range":[75],"single_rating_play_type":0}`|
|21|`{"attr_range":[82],"single_rating_play_type":82}`|

## Comparison

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|18|本表行键；与其他表同值不自动代表同一对象。|
|name|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|power|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|node|string|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|jump|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|order|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|use_scroll_rect|boolean|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|combat_order|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|combat_icon|string|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"power":1,"use_scroll_rect":false}`|
|2|`{"power":2,"use_scroll_rect":false}`|
|3|`{"power":3,"use_scroll_rect":false}`|
|4|`{"power":5,"use_scroll_rect":false}`|
|5|`{"power":7,"use_scroll_rect":false}`|
|6|`{"power":8,"use_scroll_rect":true}`|
|7|`{"power":4,"use_scroll_rect":false}`|
|8|`{"power":6,"use_scroll_rect":false}`|
|9|`{"power":9,"use_scroll_rect":false}`|
|11|`{"power":11,"use_scroll_rect":false}`|
|12|`{"power":10,"use_scroll_rect":false}`|
|13|`{"power":12,"use_scroll_rect":false}`|
|14|`{"power":13,"use_scroll_rect":true}`|
|15|`{"power":17,"use_scroll_rect":false}`|
|16|`{"power":18,"use_scroll_rect":true}`|
|17|`{"power":19,"use_scroll_rect":true}`|
|18|`{"power":20,"use_scroll_rect":false}`|
|19|`{"power":21,"use_scroll_rect":false}`|

## CPAttr

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|21|本表行键；与其他表同值不自动代表同一对象。|
|influence_attr|number|21|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ignore_init|number|21|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|factor|array/object|21|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"influence_attr":0,"ignore_init":0}`|
|2|`{"influence_attr":0,"ignore_init":0}`|
|5|`{"influence_attr":0,"ignore_init":0}`|
|6|`{"influence_attr":0,"ignore_init":0}`|
|9|`{"influence_attr":1,"ignore_init":0}`|
|10|`{"influence_attr":2,"ignore_init":0}`|
|11|`{"influence_attr":2,"ignore_init":0}`|
|12|`{"influence_attr":2,"ignore_init":15000}`|
|13|`{"influence_attr":2,"ignore_init":0}`|
|14|`{"influence_attr":0,"ignore_init":0}`|
|15|`{"influence_attr":1,"ignore_init":0}`|
|16|`{"influence_attr":1,"ignore_init":0}`|
|17|`{"influence_attr":2,"ignore_init":0}`|
|18|`{"influence_attr":1,"ignore_init":0}`|
|19|`{"influence_attr":2,"ignore_init":0}`|
|20|`{"influence_attr":1,"ignore_init":0}`|
|21|`{"influence_attr":2,"ignore_init":0}`|
|22|`{"influence_attr":1,"ignore_init":0}`|
|23|`{"influence_attr":1,"ignore_init":0}`|
|24|`{"influence_attr":0,"ignore_init":0}`|
|26|`{"influence_attr":0,"ignore_init":0}`|

## CPConstant

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|hp_ratio|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|special_ratio|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|speed_fix_ratio|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|speed_base|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|artifact_crit_def_harm|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hero_crit_def_harm|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|power_change_tips_condition|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bubble_percent|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bubble_val|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"hp_ratio":60000,"speed_fix_ratio":50,"speed_base":220,"hero_crit_def_harm":1.5,"power_change_tips_condition":420586900001}`|

## CPAbility

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|15|本表行键；与其他表同值不自动代表同一对象。|
|skill_1|array|15|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skill_3|array|15|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skill_4|array|15|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"skill_1":[0,1500,3000,4500],"skill_3":[1200,1800,3600,5400],"skill_4":[1500,2700,3900]}`|
|2|`{"skill_1":[0,1500,3000,4500],"skill_3":[1200,1800,3600,5400],"skill_4":[1500,2700,3900]}`|
|3|`{"skill_1":[0,1500,3000,4500],"skill_3":[1200,1800,3600,5400],"skill_4":[1500,2700,3900]}`|
|4|`{"skill_1":[0,1500,3000,4500],"skill_3":[1200,1800,3600,5400],"skill_4":[1500,2700,3900]}`|
|5|`{"skill_1":[0,1500,3000,4500],"skill_3":[1200,1800,3600,5400],"skill_4":[1500,2700,3900]}`|
|6|`{"skill_1":[0,1500,3000,4500],"skill_3":[1200,1800,3600,5400],"skill_4":[1500,2700,3900]}`|
|7|`{"skill_1":[0,1500,3000,4500],"skill_3":[1200,1800,3600,5400],"skill_4":[1500,2700,3900]}`|
|8|`{"skill_1":[0,1500,3000,4500],"skill_3":[1200,1800,3600,5400],"skill_4":[1500,2700,3900]}`|
|9|`{"skill_1":[0,1500,3000,4500],"skill_3":[1200,1800,3600,5400],"skill_4":[1500,2700,3900]}`|
|10|`{"skill_1":[0,1500,3000,4500],"skill_3":[1200,1800,3600,5400],"skill_4":[1500,2700,3900]}`|
|11|`{"skill_1":[0,1500,3000,4500],"skill_3":[1200,1800,3600,5400],"skill_4":[1500,2700,3900]}`|
|12|`{"skill_1":[0,1500,3000,4500],"skill_3":[1200,1800,3600,5400],"skill_4":[1500,2700,3900]}`|
|13|`{"skill_1":[0,1500,3000,4500],"skill_3":[1200,1800,3600,5400],"skill_4":[1500,2700,3900]}`|
|14|`{"skill_1":[0,1500,3000,4500],"skill_3":[1200,1800,3600,5400],"skill_4":[1500,2700,3900]}`|
|15|`{"skill_1":[0,1500,3000,4500],"skill_3":[1200,1800,3600,5400],"skill_4":[1500,2700,3900]}`|

## ComparisonSuggestOpen

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|type|array|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|condition|object|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tips|array|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tip_params|array|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"type":[1,2,3,4,5,6,7,8,9,12,11,13,14],"condition":{"global":"TableEmpty"}}`|
|2|`{"type":[1,2,3,4,5,7,8,9,12,11,13,14],"condition":{"global":"TableEmpty"}}`|
|3|`{"type":[1,2,3,4,5,8,12,11,13,14],"condition":{"global":"TableEmpty"}}`|
|4|`{"type":[1,4,12,11,13],"condition":{"global":"TableEmpty"}}`|
|5|`{"type":[1],"condition":{"global":"TableEmpty"}}`|

## SubModule

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|46|本表行键；与其他表同值不自动代表同一对象。|
|group|number|46|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"group":1}`|
|2|`{"group":1}`|
|3|`{"group":1}`|
|4|`{"group":2}`|
|5|`{"group":2}`|
|6|`{"group":3}`|
|7|`{"group":3}`|
|8|`{"group":3}`|
|9|`{"group":3}`|
|10|`{"group":3}`|
|11|`{"group":7}`|
|12|`{"group":4}`|
|13|`{"group":4}`|
|14|`{"group":4}`|
|15|`{"group":4}`|
|16|`{"group":4}`|
|17|`{"group":8}`|
|18|`{"group":8}`|
|19|`{"group":5}`|
|20|`{"group":5}`|
|21|`{"group":5}`|
|22|`{"group":6}`|
|23|`{"group":9}`|
|24|`{"group":12}`|
|25|`{"group":12}`|
|26|`{"group":11}`|
|27|`{"group":11}`|
|28|`{"group":13}`|
|29|`{"group":13}`|
|30|`{"group":14}`|
|31|`{"group":0}`|
|32|`{"group":0}`|
|33|`{"group":1}`|
|34|`{"group":5}`|
|35|`{"group":3}`|
|36|`{"group":6}`|
|37|`{"group":9}`|
|38|`{"group":7}`|
|39|`{"group":8}`|
|40|`{"group":8}`|
|41|`{"group":15}`|
|42|`{"group":16}`|
|43|`{"group":17}`|
|44|`{"group":18}`|
|45|`{"group":19}`|
|46|`{"group":20}`|

## ModuleCalculate

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|120|本表行键；与其他表同值不自动代表同一对象。|
|data_list|array|120|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|
|6|`{}`|
|7|`{}`|
|8|`{}`|
|9|`{}`|
|10|`{}`|
|11|`{}`|
|12|`{}`|
|13|`{}`|
|14|`{}`|
|15|`{}`|
|16|`{}`|
|17|`{}`|
|18|`{}`|
|19|`{}`|
|20|`{}`|
|21|`{}`|
|22|`{}`|
|23|`{}`|
|24|`{}`|
|25|`{}`|
|26|`{}`|
|27|`{}`|
|28|`{}`|
|29|`{}`|
|30|`{}`|
|31|`{}`|
|32|`{}`|
|33|`{}`|
|34|`{}`|
|35|`{}`|
|36|`{}`|
|37|`{}`|
|38|`{}`|
|39|`{}`|
|40|`{}`|
|41|`{}`|
|42|`{}`|
|43|`{}`|
|44|`{}`|
|45|`{}`|
|46|`{}`|
|47|`{}`|
|48|`{}`|
|49|`{}`|
|50|`{}`|
|51|`{}`|
|52|`{}`|
|53|`{}`|
|54|`{}`|
|55|`{}`|
|56|`{}`|
|57|`{}`|
|58|`{}`|
|59|`{}`|
|60|`{}`|
|61|`{}`|
|62|`{}`|
|63|`{}`|
|64|`{}`|
|65|`{}`|
|66|`{}`|
|67|`{}`|
|68|`{}`|
|69|`{}`|
|70|`{}`|
|71|`{}`|
|72|`{}`|
|73|`{}`|
|74|`{}`|
|75|`{}`|
|76|`{}`|
|77|`{}`|
|78|`{}`|
|79|`{}`|
|80|`{}`|
|81|`{}`|
|82|`{}`|
|83|`{}`|
|84|`{}`|
|85|`{}`|
|86|`{}`|
|87|`{}`|
|88|`{}`|
|89|`{}`|
|90|`{}`|
|91|`{}`|
|92|`{}`|
|93|`{}`|
|94|`{}`|
|95|`{}`|
|96|`{}`|
|97|`{}`|
|98|`{}`|
|99|`{}`|
|100|`{}`|
|101|`{}`|
|102|`{}`|
|103|`{}`|
|104|`{}`|
|105|`{}`|
|106|`{}`|
|107|`{}`|
|108|`{}`|
|109|`{}`|
|110|`{}`|
|111|`{}`|
|112|`{}`|
|113|`{}`|
|114|`{}`|
|115|`{}`|
|116|`{}`|
|117|`{}`|
|118|`{}`|
|119|`{}`|
|120|`{}`|

## CPBreak

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|24|本表行键；与其他表同值不自动代表同一对象。|
|break_value|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|24|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|group|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|special|boolean|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|target|object/array|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"break_value":50000,"award":[[391002,200]],"group":1,"target":{"global":"TableEmpty"}}`|
|2|`{"break_value":100000,"award":[[391002,200]],"group":1,"target":{"global":"TableEmpty"}}`|
|3|`{"break_value":150000,"award":[[391002,400]],"group":1,"target":{"global":"TableEmpty"}}`|
|4|`{"break_value":200000,"award":[[423002,20],[392002,2],[391002,400]],"group":1,"target":[[1,20000],[2,10000],[3,20000],[4,40000],[5,0],[6,40000],[7,30000],[8,20000],[9,20000],[12,0],[11,0]]}`|
|5|`{"break_value":250000,"award":[[391002,200]],"group":2,"target":{"global":"TableEmpty"}}`|
|6|`{"break_value":300000,"award":[[391002,200]],"group":2,"target":{"global":"TableEmpty"}}`|
|7|`{"break_value":350000,"award":[[391002,400]],"group":2,"target":{"global":"TableEmpty"}}`|
|8|`{"break_value":400000,"award":[[423002,20],[392002,2],[391002,400]],"group":2,"target":[[1,40000],[2,20000],[3,40000],[4,80000],[5,20000],[6,80000],[7,40000],[8,40000],[9,40000],[12,0],[11,0]]}`|
|9|`{"break_value":500000,"award":[[391002,200]],"group":3,"target":{"global":"TableEmpty"}}`|
|10|`{"break_value":600000,"award":[[391002,200]],"group":3,"target":{"global":"TableEmpty"}}`|
|11|`{"break_value":700000,"award":[[391002,400]],"group":3,"target":{"global":"TableEmpty"}}`|
|12|`{"break_value":800000,"award":[[423002,20],[392002,2],[391002,400]],"group":3,"target":[[1,80000],[2,40000],[3,80000],[4,160000],[5,40000],[6,160000],[7,80000],[8,80000],[9,80000],[12,0],[11,0]]}`|
|13|`{"break_value":900000,"award":[[391002,200]],"group":4,"target":{"global":"TableEmpty"}}`|
|14|`{"break_value":1000000,"award":[[391002,200]],"group":4,"target":{"global":"TableEmpty"}}`|
|15|`{"break_value":1500000,"award":[[391002,400]],"group":4,"target":{"global":"TableEmpty"}}`|
|16|`{"break_value":2000000,"award":[[423002,20],[392002,2],[391002,400]],"group":4,"target":[[1,200000],[2,100000],[3,200000],[4,400000],[5,100000],[6,400000],[7,200000],[8,200000],[9,200000],[12,0],[11,0]]}`|
|17|`{"break_value":3000000,"award":[[391002,200]],"group":5,"target":{"global":"TableEmpty"}}`|
|18|`{"break_value":4000000,"award":[[391002,200]],"group":5,"target":{"global":"TableEmpty"}}`|
|19|`{"break_value":5000000,"award":[[391002,400]],"group":5,"target":{"global":"TableEmpty"}}`|
|20|`{"break_value":6000000,"award":[[423002,20],[392002,2],[391002,400]],"group":5,"target":[[1,600000],[2,300000],[3,600000],[4,1200000],[5,300000],[6,1200000],[7,600000],[8,600000],[9,600000],[12,0],[11,0]]}`|
|21|`{"break_value":7000000,"award":[[391002,200]],"group":6,"target":{"global":"TableEmpty"}}`|
|22|`{"break_value":8000000,"award":[[391002,200]],"group":6,"target":{"global":"TableEmpty"}}`|
|23|`{"break_value":9000000,"award":[[391002,400]],"group":6,"target":{"global":"TableEmpty"}}`|
|24|`{"break_value":10000000,"award":[[423002,20],[392002,2],[391002,400]],"group":6,"target":[[1,1000000],[2,500000],[3,1000000],[4,2000000],[5,500000],[6,2000000],[7,1000000],[8,1000000],[9,1000000],[12,0],[11,0]]}`|

## CPSkillShineUpon

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|782|本表行键；与其他表同值不自动代表同一对象。|
|skill_power|number|782|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部782行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|110001001|`{"skill_power":3000}`|
|110001002|`{"skill_power":6000}`|
|110001003|`{"skill_power":9000}`|

## SpecialAttrType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|23|本表行键；与其他表同值不自动代表同一对象。|
|type|number|23|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hero_special_ratio|number|23|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|master_special_ratio|number|23|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"type":11,"hero_special_ratio":800000}`|
|2|`{"type":15,"hero_special_ratio":800000}`|
|3|`{"type":12,"hero_special_ratio":800000}`|
|4|`{"type":16,"hero_special_ratio":800000}`|
|5|`{"type":17,"hero_special_ratio":800000}`|
|6|`{"type":18,"hero_special_ratio":800000}`|
|7|`{"type":13,"hero_special_ratio":800000}`|
|8|`{"type":23,"hero_special_ratio":800000}`|
|9|`{"type":33,"hero_special_ratio":800000}`|
|10|`{"type":34,"hero_special_ratio":800000}`|
|11|`{"type":35,"hero_special_ratio":800000}`|
|12|`{"type":36,"hero_special_ratio":800000}`|
|13|`{"type":37,"hero_special_ratio":800000}`|
|14|`{"type":38,"hero_special_ratio":800000}`|
|15|`{"type":39,"hero_special_ratio":800000}`|
|16|`{"type":40,"hero_special_ratio":800000}`|
|17|`{"type":41,"hero_special_ratio":800000}`|
|18|`{"type":42,"hero_special_ratio":800000}`|
|19|`{"type":30,"hero_special_ratio":0}`|
|20|`{"type":31,"hero_special_ratio":0}`|
|21|`{"type":28,"hero_special_ratio":0}`|
|22|`{"type":29,"hero_special_ratio":0}`|
|23|`{"type":32,"hero_special_ratio":0}`|

## CPHeroStarQuality

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|20|本表行键；与其他表同值不自动代表同一对象。|
|power|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|3001|`{"power":600}`|
|3002|`{"power":1000}`|
|3003|`{"power":1500}`|
|3004|`{"power":2000}`|
|3005|`{"power":2500}`|
|4001|`{"power":840}`|
|4002|`{"power":1500}`|
|4003|`{"power":2250}`|
|4004|`{"power":3000}`|
|4005|`{"power":3750}`|
|5001|`{"power":1200}`|
|5002|`{"power":2000}`|
|5003|`{"power":3000}`|
|5004|`{"power":4000}`|
|5005|`{"power":5000}`|
|6006|`{"power":5000}`|
|6007|`{"power":5000}`|
|6008|`{"power":5000}`|
|6009|`{"power":5000}`|
|6010|`{"power":5000}`|
