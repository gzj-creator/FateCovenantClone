# FameHallTable 规则参数

来源：[personal-server/assets/tables/FameHallTable.data.lua.json.gz](../../../../personal-server/assets/tables/FameHallTable.data.lua.json.gz)，SHA256：`e02e815a501b17c41396e8fd3c666898d55b7c91cd9a9d2d2bfd40d52c0f2fa3`。

[完整逐行JSON](FameHallTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Fight](#fight)|450|decoded-rows|
|[DevType](#devtype)|5|decoded-rows|
|[Attr](#attr)|11|decoded-rows|
|[DevBadge](#devbadge)|34|decoded-rows|
|[DevBadgeType](#devbadgetype)|3|decoded-rows|
|[HeroBuff](#herobuff)|20|decoded-rows|
|[FameHalFantasyEquipStar](#famehalfantasyequipstar)|6|decoded-rows|
|[HeroType](#herotype)|4|decoded-rows|
|[Hero](#hero)|41|decoded-rows|
|[Shop](#shop)|1|decoded-rows|
|[DevDropArtifact](#devdropartifact)|4|decoded-rows|
|[DevDropType](#devdroptype)|6|decoded-rows|
|[DevDropChangeHero](#devdropchangehero)|4|decoded-rows|
|[DevDropHero](#devdrophero)|5|decoded-rows|
|[ResetType](#resettype)|2|decoded-rows|
|[EnemyStar](#enemystar)|450|decoded-rows|
|[EnemyFormatLoc](#enemyformatloc)|7|decoded-rows|
|[EnemyTeamFormat](#enemyteamformat)|4|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[EndPassAward](#endpassaward)|72|decoded-rows|
|[Difficulty](#difficulty)|12|decoded-rows|
|[DifficultyShow](#difficultyshow)|12|decoded-rows|

## Fight

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|score|number|450|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|drop|number|450|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|artifact_star|number|450|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sp_star|number|450|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|450|本表行键；与其他表同值不自动代表同一对象。|
|team_star|array|450|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr|array|450|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部450行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"score":0,"artifact_star":1,"sp_star":1,"team_star":[10101],"attr":[[1,198000],[2,23100],[76,13200]]}`|
|102|`{"score":0,"artifact_star":1,"sp_star":1,"team_star":[10201],"attr":[[1,200400],[2,23380],[76,13360]]}`|
|103|`{"score":0,"artifact_star":1,"sp_star":1,"team_star":[10301],"attr":[[1,202800],[2,23660],[76,13520]]}`|

## DevType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|erl_mod|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|weight_dec|array|5|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"weight_dec":[[6,20],[10,0]]}`|
|2|`{"weight_dec":[[10,0]]}`|
|3|`{"weight_dec":[]}`|
|4|`{"weight_dec":[]}`|
|5|`{"weight_dec":[[5,0]]}`|

## Attr

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|11|本表行键；与其他表同值不自动代表同一对象。|
|attr|array|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|0|`{"attr":[[1,264000],[2,44000],[76,26400]]}`|
|1|`{"attr":[[1,276000],[2,46000],[76,27600]]}`|
|2|`{"attr":[[1,288000],[2,48000],[76,28800]]}`|
|3|`{"attr":[[1,300000],[2,50000],[76,30000]]}`|
|4|`{"attr":[[1,312000],[2,52000],[76,31200]]}`|
|5|`{"attr":[[1,324000],[2,54000],[76,32400]]}`|
|6|`{"attr":[[1,336000],[2,56000],[76,33600]]}`|
|7|`{"attr":[[1,348000],[2,58000],[76,34800]]}`|
|8|`{"attr":[[1,360000],[2,60000],[76,36000]]}`|
|9|`{"attr":[[1,372000],[2,62000],[76,37200]]}`|
|10|`{"attr":[[1,384000],[2,64000],[76,38400]]}`|

## DevBadge

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|param|string|34|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_special|boolean|34|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|34|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|34|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|34|本表行键；与其他表同值不自动代表同一对象。|
|show_bottom|number|34|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|icon|string|34|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|weight|array|34|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|
|des|number|34|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"is_special":false,"type":3,"weight":[100,100,100,100,100]}`|
|2|`{"is_special":false,"type":3,"weight":[100,100,100,100,100]}`|
|3|`{"is_special":false,"type":3,"weight":[100,100,100,100,100]}`|
|4|`{"is_special":false,"type":3,"weight":[100,100,100,100,100]}`|
|5|`{"is_special":false,"type":3,"weight":[100,100,100,100,100]}`|
|6|`{"is_special":false,"type":3,"weight":[100,100,100,100,100]}`|
|7|`{"is_special":false,"type":3,"weight":[100,100,100,100,100]}`|
|8|`{"is_special":false,"type":3,"weight":[100,100,100,100,100]}`|
|9|`{"is_special":false,"type":3,"weight":[100,100,100,100,100]}`|
|10|`{"is_special":false,"type":3,"weight":[100,100,100,100,100]}`|
|11|`{"is_special":false,"type":3,"weight":[100,100,100,100,100]}`|
|12|`{"is_special":false,"type":3,"weight":[100,100,100,100,100]}`|
|13|`{"is_special":false,"type":3,"weight":[100,100,100,100,100]}`|
|14|`{"is_special":false,"type":3,"weight":[100,100,100,100,100]}`|
|15|`{"is_special":false,"type":3,"weight":[100,100,100,100,100]}`|
|16|`{"is_special":false,"type":3,"weight":[100,100,100,100,100]}`|
|17|`{"is_special":false,"type":3,"weight":[100,100,100,100,100]}`|
|18|`{"is_special":true,"type":3,"weight":[100,100,100,100,100]}`|
|19|`{"is_special":false,"type":3,"weight":[100,100,100,100,100]}`|
|20|`{"is_special":false,"type":3,"weight":[100,100,100,100,100]}`|
|21|`{"is_special":true,"type":3,"weight":[100,100,100,100,100]}`|
|22|`{"is_special":true,"type":3,"weight":[100,100,100,100,100]}`|
|23|`{"is_special":false,"type":3,"weight":[100,100,100,100,100]}`|
|24|`{"is_special":false,"type":3,"weight":[100,100,100,100,100]}`|
|25|`{"is_special":false,"type":3,"weight":[100,100,100,100,100]}`|
|26|`{"is_special":false,"type":3,"weight":[100,100,100,100,100]}`|
|27|`{"is_special":true,"type":3,"weight":[100,100,100,100,100]}`|
|28|`{"is_special":false,"type":3,"weight":[100,100,100,100,100]}`|
|29|`{"is_special":false,"type":3,"weight":[100,100,100,100,100]}`|
|30|`{"is_special":false,"type":3,"weight":[100,100,100,100,100]}`|
|31|`{"is_special":true,"type":3,"weight":[100,100,100,100,100]}`|
|32|`{"is_special":true,"type":3,"weight":[100,100,100,100,100]}`|
|33|`{"is_special":false,"type":3,"weight":[100,100,100,100,100]}`|
|34|`{"is_special":false,"type":3,"weight":[100,100,100,100,100]}`|

## DevBadgeType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|

## HeroBuff

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|20|本表行键；与其他表同值不自动代表同一对象。|
|skill|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|star|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"skill":280000101,"star":10,"type":3}`|
|102|`{"skill":280000102,"star":20,"type":3}`|
|103|`{"skill":280000103,"star":30,"type":3}`|
|104|`{"skill":280000104,"star":45,"type":3}`|
|105|`{"skill":280000105,"star":60,"type":3}`|
|201|`{"skill":280000201,"star":10,"type":2}`|
|202|`{"skill":280000202,"star":20,"type":2}`|
|203|`{"skill":280000203,"star":30,"type":2}`|
|204|`{"skill":280000204,"star":45,"type":2}`|
|205|`{"skill":280000205,"star":60,"type":2}`|
|301|`{"skill":280000301,"star":10,"type":1}`|
|302|`{"skill":280000302,"star":20,"type":1}`|
|303|`{"skill":280000303,"star":30,"type":1}`|
|304|`{"skill":280000304,"star":45,"type":1}`|
|305|`{"skill":280000305,"star":60,"type":1}`|
|401|`{"skill":280000401,"star":10,"type":4}`|
|402|`{"skill":280000402,"star":20,"type":4}`|
|403|`{"skill":280000403,"star":30,"type":4}`|
|404|`{"skill":280000404,"star":45,"type":4}`|
|405|`{"skill":280000405,"star":60,"type":4}`|

## FameHalFantasyEquipStar

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|attr|array|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|25000|`{"attr":[[1,12000],[2,2000],[76,1200]]}`|
|25001|`{"attr":[[1,18000],[2,3000],[76,1800]]}`|
|25002|`{"attr":[[1,24000],[2,4000],[76,2400]]}`|
|25003|`{"attr":[[1,36000],[2,6000],[76,3600]]}`|
|25004|`{"attr":[[1,42000],[2,7000],[76,4200]]}`|
|25005|`{"attr":[[1,48000],[2,8000],[76,4800]]}`|

## HeroType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|string_des|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_icon|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr_icon|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|string_name|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|small_icon|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"attr_icon":"img_mrt_ranshao.png"}`|
|2|`{"attr_icon":"img_mrt_baofa.png"}`|
|3|`{"attr_icon":"img_mrt_fangyu.png"}`|
|4|`{"attr_icon":"img_mrt_kongzhi.png"}`|

## Hero

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|41|本表行键；与其他表同值不自动代表同一对象。|
|base_weight|array|41|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|
|type|number|41|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1010101|`{"base_weight":[50,50,30,0,0],"type":4}`|
|1010201|`{"base_weight":[50,50,30,0,0],"type":1}`|
|1020101|`{"base_weight":[50,50,30,0,0],"type":3}`|
|1020201|`{"base_weight":[50,50,30,0,0],"type":4}`|
|1020401|`{"base_weight":[100,100,60,0,0],"type":3}`|
|1020501|`{"base_weight":[50,50,30,0,0],"type":3}`|
|1020601|`{"base_weight":[100,100,60,0,0],"type":3}`|
|1030101|`{"base_weight":[50,100,100,100,100],"type":3}`|
|1030201|`{"base_weight":[50,50,30,0,0],"type":4}`|
|1030301|`{"base_weight":[50,50,30,0,0],"type":4}`|
|1030401|`{"base_weight":[50,100,100,100,100],"type":3}`|
|1030501|`{"base_weight":[50,100,100,100,100],"type":3}`|
|2010101|`{"base_weight":[50,50,30,0,0],"type":2}`|
|2010201|`{"base_weight":[50,50,30,0,0],"type":2}`|
|2020401|`{"base_weight":[100,100,60,0,0],"type":2}`|
|2020601|`{"base_weight":[100,100,60,0,0],"type":2}`|
|2030101|`{"base_weight":[50,100,100,100,100],"type":3}`|
|2030201|`{"base_weight":[50,100,100,100,100],"type":2}`|
|2030301|`{"base_weight":[50,100,100,100,100],"type":2}`|
|2030401|`{"base_weight":[50,100,100,100,100],"type":2}`|
|2030501|`{"base_weight":[50,100,100,100,100],"type":2}`|
|3020101|`{"base_weight":[100,100,60,0,0],"type":1}`|
|3020201|`{"base_weight":[50,50,30,0,0],"type":1}`|
|3020301|`{"base_weight":[50,50,30,0,0],"type":1}`|
|3020501|`{"base_weight":[50,50,30,0,0],"type":4}`|
|3030201|`{"base_weight":[50,100,100,100,100],"type":1}`|
|3030301|`{"base_weight":[50,100,100,100,100],"type":1}`|
|3030401|`{"base_weight":[50,100,100,100,100],"type":1}`|
|3030501|`{"base_weight":[50,100,100,100,100],"type":2}`|
|3030601|`{"base_weight":[50,100,100,100,100],"type":1}`|
|4010101|`{"base_weight":[50,50,30,0,0],"type":1}`|
|4010301|`{"base_weight":[50,50,30,0,0],"type":4}`|
|4020101|`{"base_weight":[100,100,60,0,0],"type":4}`|
|4020201|`{"base_weight":[50,50,30,0,0],"type":4}`|
|4020301|`{"base_weight":[50,50,30,0,0],"type":4}`|
|4030101|`{"base_weight":[50,100,100,100,100],"type":4}`|
|4030201|`{"base_weight":[50,100,100,100,100],"type":4}`|
|4030301|`{"base_weight":[50,50,30,0,0],"type":4}`|
|4030401|`{"base_weight":[50,100,100,100,100],"type":4}`|
|4030501|`{"base_weight":[50,100,100,100,100],"type":4}`|
|4030801|`{"base_weight":[50,50,30,0,0],"type":4}`|

## Shop

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|hero_star|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|badge_price|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|hero_price|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|badge_num|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hero_num|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"hero_star":3,"badge_price":60,"hero_price":[[50,30],[40,20],[30,10]],"badge_num":3,"hero_num":6}`|

## DevDropArtifact

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|stage|number|4|ActFrame阶段引用数组；不同于旧Activity.state。|
|weight|array|4|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"stage":10,"weight":[[1,100],[2,0]]}`|
|2|`{"stage":20,"weight":[[1,90],[2,0]]}`|
|3|`{"stage":30,"weight":[[1,80],[2,0]]}`|
|4|`{"stage":99999,"weight":[[1,80],[2,0]]}`|

## DevDropType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|exchange|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|repeated|boolean|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|num|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|erl_mod|string|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"exchange":0,"repeated":true,"num":1}`|
|2|`{"exchange":0,"repeated":false,"num":3}`|
|3|`{"exchange":0,"repeated":false,"num":3}`|
|4|`{"exchange":0,"repeated":false,"num":3}`|
|5|`{"exchange":0,"repeated":false,"num":3}`|
|6|`{"exchange":2,"repeated":false,"num":3}`|

## DevDropChangeHero

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|stage|number|4|ActFrame阶段引用数组；不同于旧Activity.state。|
|weight|array|4|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"stage":10,"weight":[[50,100],[50,0]]}`|
|2|`{"stage":20,"weight":[[50,100],[50,0]]}`|
|3|`{"stage":30,"weight":[[50,100],[50,0]]}`|
|4|`{"stage":99999,"weight":[[50,100],[50,0]]}`|

## DevDropHero

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|stage|number|5|ActFrame阶段引用数组；不同于旧Activity.state。|
|weight|array|5|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"stage":5,"weight":[[1,100],[3,0]]}`|
|2|`{"stage":10,"weight":[[1,100],[3,0]]}`|
|3|`{"stage":20,"weight":[[1,100],[5,0]]}`|
|4|`{"stage":30,"weight":[[1,100],[5,0]]}`|
|5|`{"stage":99999,"weight":[[1,100],[5,0]]}`|

## ResetType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|stage|number|2|ActFrame阶段引用数组；不同于旧Activity.state。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"stage":0}`|
|2|`{"stage":5}`|

## EnemyStar

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|450|本表行键；与其他表同值不自动代表同一对象。|
|hero_loc_star|array|450|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部450行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10101|`{"hero_loc_star":[[1,0],[2,0],[3,0],[4,0],[5,0],[6,0]]}`|
|10201|`{"hero_loc_star":[[1,1],[2,0],[3,0],[4,0],[5,0],[6,0]]}`|
|10301|`{"hero_loc_star":[[1,1],[2,1],[3,0],[4,0],[5,0],[6,0]]}`|

## EnemyFormatLoc

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|7|本表行键；与其他表同值不自动代表同一对象。|
|loc|array|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"loc":[1,2,3,4,5,6]}`|
|2|`{"loc":[1,2,3]}`|
|3|`{"loc":[4,5,6]}`|
|4|`{"loc":[1,2,4]}`|
|5|`{"loc":[3,5,6]}`|
|6|`{"loc":[2,4,6]}`|
|7|`{"loc":[1,3,5]}`|

## EnemyTeamFormat

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|team_format|array|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|open_day|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|sp_hero_limit|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|sp_up_enemy|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|init_star|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|normal_orange_aritfact|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_jump|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|treasure_orange_aritfact|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|score_item_id|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|reset_open|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|day_reset_times|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"open_day":2,"sp_hero_limit":6,"init_star":0,"fight_jump":4,"score_item_id":1801900,"reset_open":5,"day_reset_times":99999}`|

## EndPassAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|72|本表行键；与其他表同值不自动代表同一对象。|
|stage|number|72|ActFrame阶段引用数组；不同于旧Activity.state。|
|award|array|72|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|change_award|array|72|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"stage":104,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|102|`{"stage":108,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|103|`{"stage":112,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|104|`{"stage":116,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|105|`{"stage":120,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|106|`{"stage":125,"award":[[3002,10]],"change_award":[[3002,8]]}`|
|201|`{"stage":205,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|202|`{"stage":210,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|203|`{"stage":215,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|204|`{"stage":220,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|205|`{"stage":225,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|206|`{"stage":230,"award":[[3002,10]],"change_award":[[3002,8]]}`|
|301|`{"stage":306,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|302|`{"stage":312,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|303|`{"stage":318,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|304|`{"stage":324,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|305|`{"stage":330,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|306|`{"stage":335,"award":[[3002,10]],"change_award":[[3002,8]]}`|
|401|`{"stage":407,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|402|`{"stage":414,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|403|`{"stage":421,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|404|`{"stage":428,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|405|`{"stage":435,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|406|`{"stage":440,"award":[[3002,10]],"change_award":[[3002,8]]}`|
|501|`{"stage":508,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|502|`{"stage":516,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|503|`{"stage":524,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|504|`{"stage":532,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|505|`{"stage":540,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|506|`{"stage":545,"award":[[3002,10]],"change_award":[[3002,8]]}`|
|601|`{"stage":608,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|602|`{"stage":616,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|603|`{"stage":624,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|604|`{"stage":632,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|605|`{"stage":640,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|606|`{"stage":650,"award":[[3002,10]],"change_award":[[3002,8]]}`|
|701|`{"stage":704,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|702|`{"stage":708,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|703|`{"stage":712,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|704|`{"stage":716,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|705|`{"stage":720,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|706|`{"stage":725,"award":[[3002,10]],"change_award":[[3002,8]]}`|
|801|`{"stage":805,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|802|`{"stage":810,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|803|`{"stage":815,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|804|`{"stage":820,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|805|`{"stage":825,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|806|`{"stage":830,"award":[[3002,10]],"change_award":[[3002,8]]}`|
|901|`{"stage":906,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|902|`{"stage":912,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|903|`{"stage":918,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|904|`{"stage":924,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|905|`{"stage":930,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|906|`{"stage":935,"award":[[3002,10]],"change_award":[[3002,8]]}`|
|1001|`{"stage":1007,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|1002|`{"stage":1014,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|1003|`{"stage":1021,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|1004|`{"stage":1028,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|1005|`{"stage":1035,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|1006|`{"stage":1040,"award":[[3002,10]],"change_award":[[3002,8]]}`|
|1101|`{"stage":1108,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|1102|`{"stage":1116,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|1103|`{"stage":1124,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|1104|`{"stage":1132,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|1105|`{"stage":1140,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|1106|`{"stage":1145,"award":[[3002,10]],"change_award":[[3002,8]]}`|
|1201|`{"stage":1208,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|1202|`{"stage":1216,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|1203|`{"stage":1224,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|1204|`{"stage":1232,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|1205|`{"stage":1240,"award":[[3002,3]],"change_award":[[3002,3]]}`|
|1206|`{"stage":1250,"award":[[3002,10]],"change_award":[[3002,8]]}`|

## Difficulty

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tips|array|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|unlock_condition|array|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|init_hero_count|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|12|本表行键；与其他表同值不自动代表同一对象。|
|check_toggle|boolean|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tip_params|array|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|difficulty_show|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|talk|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|enemy_lineup|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sweep_award|array|12|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|enemy_team_format|array|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_stage|number|12|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"unlock_condition":[],"init_hero_count":6,"fight":9200001,"sweep_award":[[391002,1600],[392002,5],[1801900,600]],"max_stage":125}`|
|2|`{"unlock_condition":[918220900002],"init_hero_count":6,"fight":9200006,"sweep_award":[[391002,1700],[392002,5],[1801900,600]],"max_stage":230}`|
|3|`{"unlock_condition":[918220900003],"init_hero_count":6,"fight":9200005,"sweep_award":[[391002,1800],[392002,6],[1801900,600]],"max_stage":335}`|
|4|`{"unlock_condition":[918220900004],"init_hero_count":6,"fight":9200002,"sweep_award":[[391002,1900],[392002,6],[1801900,600]],"max_stage":440}`|
|5|`{"unlock_condition":[918220900005],"init_hero_count":6,"fight":9200003,"sweep_award":[[391002,1950],[392002,6],[1801900,600]],"max_stage":545}`|
|6|`{"unlock_condition":[918220900006],"init_hero_count":6,"fight":9200004,"sweep_award":[[391002,2000],[392002,7],[1801900,600]],"max_stage":650}`|
|7|`{"unlock_condition":[796420300001],"init_hero_count":6,"fight":9200007,"sweep_award":[[391002,2050],[392002,7],[1801900,600]],"max_stage":725}`|
|8|`{"unlock_condition":[918220900008],"init_hero_count":6,"fight":9200008,"sweep_award":[[391002,2100],[392002,7],[1801900,600]],"max_stage":830}`|
|9|`{"unlock_condition":[918220900009],"init_hero_count":6,"fight":9200009,"sweep_award":[[391002,2150],[392002,8],[1801900,600]],"max_stage":935}`|
|10|`{"unlock_condition":[918220900010],"init_hero_count":6,"fight":9200010,"sweep_award":[[391002,2200],[392002,8],[1801900,600]],"max_stage":1040}`|
|11|`{"unlock_condition":[918220900011],"init_hero_count":6,"fight":9200011,"sweep_award":[[391002,2250],[392002,8],[1801900,600]],"max_stage":1145}`|
|12|`{"unlock_condition":[918220900012],"init_hero_count":6,"fight":9200012,"sweep_award":[[391002,2300],[392002,8],[1801900,600]],"max_stage":1250}`|

## DifficultyShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|difficulty_bg|string|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|scene_idx|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|12|本表行键；与其他表同值不自动代表同一对象。|
|stage|number|12|ActFrame阶段引用数组；不同于旧Activity.state。|
|scene_name|string|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"stage":1}`|
|2|`{"stage":1}`|
|3|`{"stage":1}`|
|4|`{"stage":1}`|
|5|`{"stage":1}`|
|6|`{"stage":1}`|
|7|`{"stage":2}`|
|8|`{"stage":2}`|
|9|`{"stage":2}`|
|10|`{"stage":2}`|
|11|`{"stage":2}`|
|12|`{"stage":2}`|
