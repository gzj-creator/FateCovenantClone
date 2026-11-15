# HomelandTable 规则参数

来源：[personal-server/assets/tables/HomelandTable.data.lua.json.gz](../../../../personal-server/assets/tables/HomelandTable.data.lua.json.gz)，SHA256：`c883025a9ccc4c13b6e709e392a208316c50ebee842636e95f082670f183b5b2`。

[完整逐行JSON](HomelandTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[FurnitureSuitAlbum](#furnituresuitalbum)|10|decoded-rows|
|[FurnitureAlbum](#furniturealbum)|121|decoded-rows|
|[FurnitureType](#furnituretype)|12|decoded-rows|
|[FurnitureQuality](#furniturequality)|4|decoded-rows|
|[FurnitureBigType](#furniturebigtype)|4|decoded-rows|
|[FurnitureSuit](#furnituresuit)|10|decoded-rows|
|[Furniture](#furniture)|121|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[Room](#room)|30|decoded-rows|
|[HouseStyle](#housestyle)|1|decoded-rows|
|[House](#house)|5|decoded-rows|
|[Task](#task)|2|decoded-rows|
|[Level](#level)|40|decoded-rows|

## FurnitureSuitAlbum

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|10|本表行键；与其他表同值不自动代表同一对象。|
|show_img|string|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr|array|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|10|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|happiness|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"attr":[[205,1000],[206,1000],[210,1000],[188,330]],"award":[[101500,1000]]}`|
|2|`{"attr":[[205,1000],[206,1000],[210,1000],[188,330]],"award":[[101500,1000]]}`|
|3|`{"attr":[[205,1000],[206,1000],[210,1000],[188,330]],"award":[[101500,1000]]}`|
|4|`{"attr":[[205,1000],[206,1000],[210,1000],[188,330]],"award":[[101500,1000]]}`|
|50|`{"attr":[[205,400],[206,400],[210,400],[188,280]],"award":[[101500,1000]]}`|
|51|`{"attr":[[205,400],[206,400],[210,400],[188,280]],"award":[[101500,1000]]}`|
|52|`{"attr":[[205,400],[206,400],[210,400],[188,280]],"award":[[101500,1000]]}`|
|53|`{"attr":[[205,400],[206,400],[210,400],[188,280]],"award":[[101500,1000]]}`|
|100|`{"attr":[[205,200],[206,200],[210,200],[188,250]],"award":[[101500,1000]]}`|
|101|`{"attr":[[205,200],[206,200],[210,200],[188,250]],"award":[[101500,1000]]}`|

## FurnitureAlbum

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|121|本表行键；与其他表同值不自动代表同一对象。|
|attr|array|121|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|effect_hero|object|121|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sp_attr|object|121|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|happiness|number|121|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|100014400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100024400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100034400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100044400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100054400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100064400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100074400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100084400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100094400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100104400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100114400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100124400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100134400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100144400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100154400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100164400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100174400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100184400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100194400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100204400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100214400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100224400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100234400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100244400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100254400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100264400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100274400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100284400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100294400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100304400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100314400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100324400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100334400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100344400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100354400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100364400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100374400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100384400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100394400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100404400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100414400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100424400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100434400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100444400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100454400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100464400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100474400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100484400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100494400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100504400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100514400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100524400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100534400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100544400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100554400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100564400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100574400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100584400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100594400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100604400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100614400|`{"attr":[[201,25000],[202,3750],[209,500]],"sp_attr":{"global":"TableEmpty"}}`|
|100624400|`{"attr":[[201,25000],[202,3750],[209,500]],"sp_attr":{"global":"TableEmpty"}}`|
|100634400|`{"attr":[[201,25000],[202,3750],[209,500]],"sp_attr":{"global":"TableEmpty"}}`|
|100644400|`{"attr":[[201,25000],[202,3750],[209,500]],"sp_attr":{"global":"TableEmpty"}}`|
|100654400|`{"attr":[[201,25000],[202,3750],[209,500]],"sp_attr":{"global":"TableEmpty"}}`|
|100664400|`{"attr":[[201,25000],[202,3750],[209,500]],"sp_attr":{"global":"TableEmpty"}}`|
|100674400|`{"attr":[[201,25000],[202,3750],[209,500]],"sp_attr":{"global":"TableEmpty"}}`|
|100684400|`{"attr":[[201,25000],[202,3750],[209,500]],"sp_attr":{"global":"TableEmpty"}}`|
|100694400|`{"attr":[[201,25000],[202,3750],[209,500]],"sp_attr":{"global":"TableEmpty"}}`|
|100704400|`{"attr":[[201,25000],[202,3750],[209,500]],"sp_attr":{"global":"TableEmpty"}}`|
|100714400|`{"attr":[[201,25000],[202,3750],[209,500]],"sp_attr":{"global":"TableEmpty"}}`|
|100724400|`{"attr":[[201,25000],[202,3750],[209,500]],"sp_attr":{"global":"TableEmpty"}}`|
|100734400|`{"attr":[[201,25000],[202,3750],[209,500]],"sp_attr":{"global":"TableEmpty"}}`|
|100744400|`{"attr":[[201,25000],[202,3750],[209,500]],"sp_attr":{"global":"TableEmpty"}}`|
|100754400|`{"attr":[[201,25000],[202,3750],[209,500]],"sp_attr":{"global":"TableEmpty"}}`|
|100764400|`{"attr":[[201,25000],[202,3750],[209,500]],"sp_attr":{"global":"TableEmpty"}}`|
|100774400|`{"attr":[[201,25000],[202,3750],[209,500]],"sp_attr":{"global":"TableEmpty"}}`|
|100784400|`{"attr":[[201,25000],[202,3750],[209,500]],"sp_attr":{"global":"TableEmpty"}}`|
|100794400|`{"attr":[[201,25000],[202,3750],[209,500]],"sp_attr":{"global":"TableEmpty"}}`|
|100804400|`{"attr":[[201,25000],[202,3750],[209,500]],"sp_attr":{"global":"TableEmpty"}}`|
|100814400|`{"attr":[[201,25000],[202,3750],[209,500]],"sp_attr":{"global":"TableEmpty"}}`|
|100824400|`{"attr":[[201,25000],[202,3750],[209,500]],"sp_attr":{"global":"TableEmpty"}}`|
|100834400|`{"attr":[[201,25000],[202,3750],[209,500]],"sp_attr":{"global":"TableEmpty"}}`|
|100844400|`{"attr":[[201,25000],[202,3750],[209,500]],"sp_attr":{"global":"TableEmpty"}}`|
|100854400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100864400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100874400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100884400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100894400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100904400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100914400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100924400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100934400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100944400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100954400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100964400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100974400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|100984400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|100994400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|101004400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|101014400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|101024400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|101034400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|101044400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|101054400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|101064400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|101074400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|101084400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|101094400|`{"attr":[[201,30000],[202,4500],[209,600]],"sp_attr":{"global":"TableEmpty"}}`|
|101104400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|101114400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|101124400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|101134400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|101144400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|101154400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|101164400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|101174400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|101184400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|101194400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|101204400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|
|101214400|`{"attr":[[201,50000],[202,7500],[209,1000]],"sp_attr":{"global":"TableEmpty"}}`|

## FurnitureType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|12|本表行键；与其他表同值不自动代表同一对象。|
|cell_num|array|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|big_type|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sort|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|default_img|string|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|icon|string|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|place_type|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|expand_img|object/array|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"cell_num":[6,7],"big_type":1,"place_type":1,"expand_img":{"global":"TableEmpty"}}`|
|2|`{"cell_num":[6,6],"big_type":1,"place_type":1,"expand_img":{"global":"TableEmpty"}}`|
|3|`{"cell_num":[6,5],"big_type":1,"place_type":1,"expand_img":{"global":"TableEmpty"}}`|
|4|`{"cell_num":[4,6],"big_type":1,"place_type":1,"expand_img":{"global":"TableEmpty"}}`|
|5|`{"cell_num":[3,4],"big_type":1,"place_type":1,"expand_img":{"global":"TableEmpty"}}`|
|6|`{"cell_num":[3,5],"big_type":1,"place_type":1,"expand_img":{"global":"TableEmpty"}}`|
|7|`{"cell_num":[6,2],"big_type":2,"place_type":2,"expand_img":{"global":"TableEmpty"}}`|
|8|`{"cell_num":[4,6],"big_type":2,"place_type":0,"expand_img":{"global":"TableEmpty"}}`|
|9|`{"cell_num":[2,3],"big_type":2,"place_type":0,"expand_img":{"global":"TableEmpty"}}`|
|10|`{"cell_num":[2,4],"big_type":3,"place_type":0,"expand_img":{"global":"TableEmpty"}}`|
|11|`{"cell_num":[2,4],"big_type":3,"place_type":0,"expand_img":{"global":"TableEmpty"}}`|
|12|`{"cell_num":[8,24],"big_type":4,"place_type":3,"expand_img":["img_jyxt_qiangzi02_x.png","img_jyxt_qiangzi03_x.png"]}`|

## FurnitureQuality

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|quality_index|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|prosperity_value|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|icon|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|suit_quality_icon|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|suit_quality_bg|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|suit_quality_small|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|30|`{"quality_index":1,"prosperity_value":10,"suit_quality_icon":"dk_jjxt_tj_jindu_lan.png","suit_quality_bg":"dk_jjxt_tj_neirong_lan.png","suit_quality_small":"dk_jyxt_jjjh_lan.png"}`|
|40|`{"quality_index":2,"prosperity_value":20,"suit_quality_icon":"dk_jjxt_tj_jindu_zi.png","suit_quality_bg":"dk_jjxt_tj_neirong_zi.png","suit_quality_small":"dk_jyxt_jjjh_zi.png"}`|
|50|`{"quality_index":3,"prosperity_value":60,"suit_quality_icon":"dk_jjxt_tj_jindu_cheng.png","suit_quality_bg":"dk_jjxt_tj_neirong_cheng.png","suit_quality_small":"dk_jyxt_jjjh_cheng.png"}`|
|60|`{"quality_index":4,"prosperity_value":500,"suit_quality_icon":"dk_jjxt_tj_jindu_xuancai.png","suit_quality_bg":"dk_jjxt_tj_neirong_xuancai.png","suit_quality_small":"dk_jyxt_jjjh_xuancai.png"}`|

## FurnitureBigType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|show_name|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|layer|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|

## FurnitureSuit

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|10|本表行键；与其他表同值不自动代表同一对象。|
|show_name|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_img|string|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|quality|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|release_time|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"quality":60,"release_time":1782594000}`|
|2|`{"quality":60,"release_time":1782594000}`|
|3|`{"quality":60,"release_time":1782594000}`|
|4|`{"quality":60,"release_time":1789074000}`|
|50|`{"quality":50,"release_time":1782594000}`|
|51|`{"quality":50,"release_time":1782594000}`|
|52|`{"quality":50,"release_time":1782594000}`|
|53|`{"quality":50,"release_time":1785186000}`|
|100|`{"quality":40,"release_time":1782594000}`|
|101|`{"quality":40,"release_time":1785186000}`|

## Furniture

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|121|本表行键；与其他表同值不自动代表同一对象。|
|show_img|string|121|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_prefab|string|121|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|expand_img|object/array|121|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|121|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|suit|number|121|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|effect|string|121|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|100014400|`{"expand_img":{"global":"TableEmpty"},"type":1}`|
|100024400|`{"expand_img":{"global":"TableEmpty"},"type":2}`|
|100034400|`{"expand_img":{"global":"TableEmpty"},"type":3}`|
|100044400|`{"expand_img":{"global":"TableEmpty"},"type":4}`|
|100054400|`{"expand_img":{"global":"TableEmpty"},"type":5}`|
|100064400|`{"expand_img":{"global":"TableEmpty"},"type":6}`|
|100074400|`{"expand_img":{"global":"TableEmpty"},"type":7}`|
|100084400|`{"expand_img":{"global":"TableEmpty"},"type":8}`|
|100094400|`{"expand_img":{"global":"TableEmpty"},"type":9}`|
|100104400|`{"expand_img":{"global":"TableEmpty"},"type":10}`|
|100114400|`{"expand_img":{"global":"TableEmpty"},"type":11}`|
|100124400|`{"expand_img":["img_jyxt_louti.png","img_jyxt_ceng_bang.png"],"type":12}`|
|100134400|`{"expand_img":{"global":"TableEmpty"},"type":1}`|
|100144400|`{"expand_img":{"global":"TableEmpty"},"type":2}`|
|100154400|`{"expand_img":{"global":"TableEmpty"},"type":3}`|
|100164400|`{"expand_img":{"global":"TableEmpty"},"type":4}`|
|100174400|`{"expand_img":{"global":"TableEmpty"},"type":5}`|
|100184400|`{"expand_img":{"global":"TableEmpty"},"type":6}`|
|100194400|`{"expand_img":{"global":"TableEmpty"},"type":7}`|
|100204400|`{"expand_img":{"global":"TableEmpty"},"type":8}`|
|100214400|`{"expand_img":{"global":"TableEmpty"},"type":9}`|
|100224400|`{"expand_img":{"global":"TableEmpty"},"type":10}`|
|100234400|`{"expand_img":{"global":"TableEmpty"},"type":11}`|
|100244400|`{"expand_img":["img_jyxt_louti_haibin.png","img_jyxt_ceng_bang_haibin.png"],"type":12}`|
|100254400|`{"expand_img":{"global":"TableEmpty"},"type":1}`|
|100264400|`{"expand_img":{"global":"TableEmpty"},"type":2}`|
|100274400|`{"expand_img":{"global":"TableEmpty"},"type":3}`|
|100284400|`{"expand_img":{"global":"TableEmpty"},"type":4}`|
|100294400|`{"expand_img":{"global":"TableEmpty"},"type":5}`|
|100304400|`{"expand_img":{"global":"TableEmpty"},"type":7}`|
|100314400|`{"expand_img":{"global":"TableEmpty"},"type":6}`|
|100324400|`{"expand_img":{"global":"TableEmpty"},"type":8}`|
|100334400|`{"expand_img":{"global":"TableEmpty"},"type":9}`|
|100344400|`{"expand_img":{"global":"TableEmpty"},"type":10}`|
|100354400|`{"expand_img":{"global":"TableEmpty"},"type":11}`|
|100364400|`{"expand_img":["img_jyxt_louti_mofa.png","img_jyxt_ceng_bang_mofa.png"],"type":12}`|
|100374400|`{"expand_img":{"global":"TableEmpty"},"type":1}`|
|100384400|`{"expand_img":{"global":"TableEmpty"},"type":2}`|
|100394400|`{"expand_img":{"global":"TableEmpty"},"type":3}`|
|100404400|`{"expand_img":{"global":"TableEmpty"},"type":4}`|
|100414400|`{"expand_img":{"global":"TableEmpty"},"type":5}`|
|100424400|`{"expand_img":{"global":"TableEmpty"},"type":6}`|
|100434400|`{"expand_img":{"global":"TableEmpty"},"type":7}`|
|100444400|`{"expand_img":{"global":"TableEmpty"},"type":8}`|
|100454400|`{"expand_img":{"global":"TableEmpty"},"type":9}`|
|100464400|`{"expand_img":{"global":"TableEmpty"},"type":10}`|
|100474400|`{"expand_img":{"global":"TableEmpty"},"type":11}`|
|100484400|`{"expand_img":["img_jyxt_louti_senlin.png","img_jyxt_ceng_bang_senlin.png"],"type":12}`|
|100494400|`{"expand_img":{"global":"TableEmpty"},"type":1}`|
|100504400|`{"expand_img":{"global":"TableEmpty"},"type":2}`|
|100514400|`{"expand_img":{"global":"TableEmpty"},"type":3}`|
|100524400|`{"expand_img":{"global":"TableEmpty"},"type":4}`|
|100534400|`{"expand_img":{"global":"TableEmpty"},"type":5}`|
|100544400|`{"expand_img":{"global":"TableEmpty"},"type":6}`|
|100554400|`{"expand_img":{"global":"TableEmpty"},"type":7}`|
|100564400|`{"expand_img":{"global":"TableEmpty"},"type":8}`|
|100574400|`{"expand_img":{"global":"TableEmpty"},"type":9}`|
|100584400|`{"expand_img":{"global":"TableEmpty"},"type":10}`|
|100594400|`{"expand_img":{"global":"TableEmpty"},"type":11}`|
|100604400|`{"expand_img":["img_jyxt_louti_yuanmu.png","img_jyxt_ceng_bang_yuanmu.png"],"type":12}`|
|100614400|`{"expand_img":{"global":"TableEmpty"},"type":1}`|
|100624400|`{"expand_img":{"global":"TableEmpty"},"type":2}`|
|100634400|`{"expand_img":{"global":"TableEmpty"},"type":3}`|
|100644400|`{"expand_img":{"global":"TableEmpty"},"type":4}`|
|100654400|`{"expand_img":{"global":"TableEmpty"},"type":5}`|
|100664400|`{"expand_img":{"global":"TableEmpty"},"type":6}`|
|100674400|`{"expand_img":{"global":"TableEmpty"},"type":7}`|
|100684400|`{"expand_img":{"global":"TableEmpty"},"type":8}`|
|100694400|`{"expand_img":{"global":"TableEmpty"},"type":9}`|
|100704400|`{"expand_img":{"global":"TableEmpty"},"type":10}`|
|100714400|`{"expand_img":{"global":"TableEmpty"},"type":11}`|
|100724400|`{"expand_img":["img_jyxt_louti_z2.png","img_jyxt_ceng_bang_z2.png"],"type":12}`|
|100734400|`{"expand_img":{"global":"TableEmpty"},"type":1}`|
|100744400|`{"expand_img":{"global":"TableEmpty"},"type":2}`|
|100754400|`{"expand_img":{"global":"TableEmpty"},"type":3}`|
|100764400|`{"expand_img":{"global":"TableEmpty"},"type":4}`|
|100774400|`{"expand_img":{"global":"TableEmpty"},"type":5}`|
|100784400|`{"expand_img":{"global":"TableEmpty"},"type":6}`|
|100794400|`{"expand_img":{"global":"TableEmpty"},"type":7}`|
|100804400|`{"expand_img":{"global":"TableEmpty"},"type":8}`|
|100814400|`{"expand_img":{"global":"TableEmpty"},"type":9}`|
|100824400|`{"expand_img":{"global":"TableEmpty"},"type":10}`|
|100834400|`{"expand_img":{"global":"TableEmpty"},"type":11}`|
|100844400|`{"expand_img":["img_jyxt_louti_z2.png","img_jyxt_ceng_bang_z2.png"],"type":12}`|
|100854400|`{"expand_img":{"global":"TableEmpty"},"type":1}`|
|100864400|`{"expand_img":{"global":"TableEmpty"},"type":2}`|
|100874400|`{"expand_img":{"global":"TableEmpty"},"type":3}`|
|100884400|`{"expand_img":{"global":"TableEmpty"},"type":4}`|
|100894400|`{"expand_img":{"global":"TableEmpty"},"type":5}`|
|100904400|`{"expand_img":{"global":"TableEmpty"},"type":6}`|
|100914400|`{"expand_img":{"global":"TableEmpty"},"type":7}`|
|100924400|`{"expand_img":{"global":"TableEmpty"},"type":8}`|
|100934400|`{"expand_img":{"global":"TableEmpty"},"type":9}`|
|100944400|`{"expand_img":{"global":"TableEmpty"},"type":10}`|
|100954400|`{"expand_img":{"global":"TableEmpty"},"type":11}`|
|100964400|`{"expand_img":["img_jyxt_louti_anhei.png","img_jyxt_ceng_bang_anhei.png"],"type":12}`|
|100974400|`{"expand_img":{"global":"TableEmpty"},"type":6}`|
|100984400|`{"expand_img":{"global":"TableEmpty"},"type":1}`|
|100994400|`{"expand_img":{"global":"TableEmpty"},"type":2}`|
|101004400|`{"expand_img":{"global":"TableEmpty"},"type":3}`|
|101014400|`{"expand_img":{"global":"TableEmpty"},"type":4}`|
|101024400|`{"expand_img":{"global":"TableEmpty"},"type":5}`|
|101034400|`{"expand_img":{"global":"TableEmpty"},"type":6}`|
|101044400|`{"expand_img":{"global":"TableEmpty"},"type":7}`|
|101054400|`{"expand_img":{"global":"TableEmpty"},"type":8}`|
|101064400|`{"expand_img":{"global":"TableEmpty"},"type":9}`|
|101074400|`{"expand_img":{"global":"TableEmpty"},"type":10}`|
|101084400|`{"expand_img":{"global":"TableEmpty"},"type":11}`|
|101094400|`{"expand_img":["img_jyxt_louti_tianguo.png","img_jyxt_ceng_bang_tianguo.png"],"type":12}`|
|101104400|`{"expand_img":{"global":"TableEmpty"},"type":1}`|
|101114400|`{"expand_img":{"global":"TableEmpty"},"type":2}`|
|101124400|`{"expand_img":{"global":"TableEmpty"},"type":3}`|
|101134400|`{"expand_img":{"global":"TableEmpty"},"type":4}`|
|101144400|`{"expand_img":{"global":"TableEmpty"},"type":5}`|
|101154400|`{"expand_img":{"global":"TableEmpty"},"type":7}`|
|101164400|`{"expand_img":{"global":"TableEmpty"},"type":6}`|
|101174400|`{"expand_img":{"global":"TableEmpty"},"type":8}`|
|101184400|`{"expand_img":{"global":"TableEmpty"},"type":9}`|
|101194400|`{"expand_img":{"global":"TableEmpty"},"type":10}`|
|101204400|`{"expand_img":{"global":"TableEmpty"},"type":11}`|
|101214400|`{"expand_img":["img_jyxt_louti_mxe.png","img_jyxt_ceng_bang_mxe.png"],"type":12}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|empty_quality|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|like_award|array|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|day_support_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_condition|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"empty_quality":"icon_jyxt_jiajupingzhi_kong.png","like_award":[[833502,10],[201500,1000]],"day_support_time":5,"show_condition":486419400001}`|

## Room

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|30|本表行键；与其他表同值不自动代表同一对象。|
|house|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|unlock_level|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"house":1,"unlock_level":1}`|
|2|`{"house":1,"unlock_level":7}`|
|3|`{"house":1,"unlock_level":9}`|
|4|`{"house":1,"unlock_level":15}`|
|5|`{"house":1,"unlock_level":15}`|
|6|`{"house":1,"unlock_level":15}`|
|7|`{"house":2,"unlock_level":9}`|
|8|`{"house":2,"unlock_level":11}`|
|9|`{"house":2,"unlock_level":11}`|
|10|`{"house":2,"unlock_level":17}`|
|11|`{"house":2,"unlock_level":17}`|
|12|`{"house":2,"unlock_level":17}`|
|13|`{"house":3,"unlock_level":13}`|
|14|`{"house":3,"unlock_level":13}`|
|15|`{"house":3,"unlock_level":13}`|
|16|`{"house":3,"unlock_level":19}`|
|17|`{"house":3,"unlock_level":19}`|
|18|`{"house":3,"unlock_level":19}`|
|19|`{"house":4,"unlock_level":21}`|
|20|`{"house":4,"unlock_level":21}`|
|21|`{"house":4,"unlock_level":21}`|
|22|`{"house":4,"unlock_level":21}`|
|23|`{"house":4,"unlock_level":21}`|
|24|`{"house":4,"unlock_level":21}`|
|25|`{"house":5,"unlock_level":23}`|
|26|`{"house":5,"unlock_level":23}`|
|27|`{"house":5,"unlock_level":23}`|
|28|`{"house":5,"unlock_level":23}`|
|29|`{"house":5,"unlock_level":23}`|
|30|`{"house":5,"unlock_level":23}`|

## HouseStyle

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|show_name|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|unlock_item|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_img|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bg_top|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bg_bottom|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bg_effect|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|house_top|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|house_middle|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|house_bottom|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|spirit_courtyard_icon|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|favour_icon|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|other_icon|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"unlock_item":0,"house_top":"img_jyxt_fangding.png","house_middle":"img_jyxt_geceng.png","house_bottom":"img_jyxt_fangdi.png"}`|

## House

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|unlock_level|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"unlock_level":1}`|
|2|`{"unlock_level":9}`|
|3|`{"unlock_level":13}`|
|4|`{"unlock_level":21}`|
|5|`{"unlock_level":23}`|

## Task

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|award|array|2|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|priority|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|desc|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_type|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_count|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_param|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award":[[101500,50]],"task_type":1307,"task_count":1,"task_param":0}`|
|2|`{"award":[[101500,150],[833502,150]],"task_type":100817,"task_count":5,"task_param":0}`|

## Level

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|40|本表行键；与其他表同值不自动代表同一对象。|
|cost_item|array|40|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|tips|number|40|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|prosperity_num|number|40|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|object/array|40|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|hook|number|40|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"cost_item":[[41002,0]],"prosperity_num":0,"award":{"global":"TableEmpty"}}`|
|2|`{"cost_item":[[41002,2]],"prosperity_num":100,"award":{"global":"TableEmpty"}}`|
|3|`{"cost_item":[[41002,3]],"prosperity_num":400,"award":{"global":"TableEmpty"}}`|
|4|`{"cost_item":[[41002,5]],"prosperity_num":0,"award":[[833502,300],[101500,100],[830602,2]]}`|
|5|`{"cost_item":[[41002,10]],"prosperity_num":1500,"award":{"global":"TableEmpty"}}`|
|6|`{"cost_item":[[41002,10]],"prosperity_num":0,"award":[[833502,500],[101500,200],[830602,3]]}`|
|7|`{"cost_item":[[41002,10]],"prosperity_num":2000,"award":{"global":"TableEmpty"}}`|
|8|`{"cost_item":[[41002,10]],"prosperity_num":0,"award":[[833502,1000],[101500,300],[830602,5]]}`|
|9|`{"cost_item":[[41002,15]],"prosperity_num":4000,"award":{"global":"TableEmpty"}}`|
|10|`{"cost_item":[[41002,15]],"prosperity_num":0,"award":[[833502,1000],[101500,300],[830602,5]]}`|
|11|`{"cost_item":[[41002,15]],"prosperity_num":7000,"award":{"global":"TableEmpty"}}`|
|12|`{"cost_item":[[41002,15]],"prosperity_num":0,"award":[[833502,1500],[101500,500],[830602,10]]}`|
|13|`{"cost_item":[[41002,20]],"prosperity_num":7500,"award":{"global":"TableEmpty"}}`|
|14|`{"cost_item":[[41002,20]],"prosperity_num":0,"award":[[833502,1500],[101500,500],[830602,10]]}`|
|15|`{"cost_item":[[41002,25]],"prosperity_num":8125,"award":{"global":"TableEmpty"}}`|
|16|`{"cost_item":[[41002,25]],"prosperity_num":4375,"award":[[833502,1500],[101500,500],[830602,10]]}`|
|17|`{"cost_item":[[41002,25]],"prosperity_num":10000,"award":{"global":"TableEmpty"}}`|
|18|`{"cost_item":[[41002,25]],"prosperity_num":5000,"award":[[833502,1500],[101500,500],[830602,10]]}`|
|19|`{"cost_item":[[41002,25]],"prosperity_num":17500,"award":{"global":"TableEmpty"}}`|
|20|`{"cost_item":[[41002,25]],"prosperity_num":0,"award":[[833502,3000],[101500,1000],[830602,20]]}`|
|21|`{"cost_item":[[41002,30]],"prosperity_num":20000,"award":{"global":"TableEmpty"}}`|
|22|`{"cost_item":[[41002,35]],"prosperity_num":0,"award":[[833502,3000],[101500,1000],[830602,20]]}`|
|23|`{"cost_item":[[41002,40]],"prosperity_num":22500,"award":{"global":"TableEmpty"}}`|
|24|`{"cost_item":[[41002,45]],"prosperity_num":0,"award":[[833502,3000],[101500,1000],[830602,20]]}`|
|25|`{"cost_item":[[41002,50]],"prosperity_num":25000,"award":{"global":"TableEmpty"}}`|
|26|`{"cost_item":[[41002,60]],"prosperity_num":0,"award":[[833502,3000],[101500,1000],[830602,20]]}`|
|27|`{"cost_item":[[41002,70]],"prosperity_num":30000,"award":{"global":"TableEmpty"}}`|
|28|`{"cost_item":[[41002,80]],"prosperity_num":0,"award":[[833502,3000],[101500,1000],[830602,20]]}`|
|29|`{"cost_item":[[41002,90]],"prosperity_num":35000,"award":{"global":"TableEmpty"}}`|
|30|`{"cost_item":[[41002,100]],"prosperity_num":0,"award":[[833502,3000],[101500,1000],[830602,20]]}`|
|31|`{"cost_item":[[41002,105]],"prosperity_num":35000,"award":{"global":"TableEmpty"}}`|
|32|`{"cost_item":[[41002,105]],"prosperity_num":0,"award":[[833502,3000],[101500,1000],[830602,20]]}`|
|33|`{"cost_item":[[41002,105]],"prosperity_num":40000,"award":{"global":"TableEmpty"}}`|
|34|`{"cost_item":[[41002,110]],"prosperity_num":0,"award":[[833502,3000],[101500,1000],[830602,20]]}`|
|35|`{"cost_item":[[41002,110]],"prosperity_num":45000,"award":{"global":"TableEmpty"}}`|
|36|`{"cost_item":[[41002,110]],"prosperity_num":0,"award":[[833502,3000],[101500,1000],[830602,20]]}`|
|37|`{"cost_item":[[41002,110]],"prosperity_num":50000,"award":{"global":"TableEmpty"}}`|
|38|`{"cost_item":[[41002,115]],"prosperity_num":0,"award":[[833502,3000],[101500,1000],[830602,20]]}`|
|39|`{"cost_item":[[41002,115]],"prosperity_num":0,"award":[[833502,5000],[101500,1500],[830602,50]]}`|
|40|`{"cost_item":[[41002,115]],"prosperity_num":50000,"award":{"global":"TableEmpty"}}`|
