# PeakTowerTable 规则参数

来源：[personal-server/assets/tables/PeakTowerTable.data.lua.json.gz](../../../../personal-server/assets/tables/PeakTowerTable.data.lua.json.gz)，SHA256：`4671531d2a1bf01dd9c428be36b5734b4bd52331fb864b584ed8d2dfded6cae2`。

[完整逐行JSON](PeakTowerTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Shop](#shop)|14|decoded-rows|
|[FighterCustomRule](#fightercustomrule)|1|decoded-rows|
|[LayerRange](#layerrange)|3|decoded-rows|
|[FighterChooseRule](#fighterchooserule)|165|decoded-rows|
|[ShowAward](#showaward)|2|decoded-rows|
|[Global](#global)|1|decoded-rows|
|[Story](#story)|0|decoded-rows|
|[FightVictory](#fightvictory)|7|decoded-rows|
|[PeakSpecialAward](#peakspecialaward)|27|decoded-rows|
|[Type](#type)|27|decoded-rows|
|[PeakTower](#peaktower)|9000|decoded-rows|
|[Stage](#stage)|3|decoded-rows|
|[DiffRankAttr](#diffrankattr)|151|decoded-rows|
|[DiffRank](#diffrank)|324|decoded-rows|

## Shop

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|14|本表行键；与其他表同值不自动代表同一对象。|
|tower|number|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|layer|number|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|goods|array|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|currency|number|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|price|number|14|原价格整数；RechargeTable现金商品消费者使用分，其他表必须核币种和单位。|
|original_price|number|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"price":588,"original_price":4000}`|
|2|`{"price":688,"original_price":4500}`|
|3|`{"price":888,"original_price":6000}`|
|4|`{"price":998,"original_price":6500}`|
|5|`{"price":1688,"original_price":12000}`|
|6|`{"price":2188,"original_price":15000}`|
|7|`{"price":2388,"original_price":16000}`|
|8|`{"price":2688,"original_price":18000}`|
|9|`{"price":2888,"original_price":20000}`|
|10|`{"price":3088,"original_price":21000}`|
|11|`{"price":3288,"original_price":22000}`|
|12|`{"price":3688,"original_price":25000}`|
|13|`{"price":3888,"original_price":26000}`|
|14|`{"price":6666,"original_price":30000}`|

## FighterCustomRule

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|hero|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|5|`{"hero":[1020601]}`|

## LayerRange

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|range|array|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|

## FighterChooseRule

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|165|本表行键；与其他表同值不自动代表同一对象。|
|hero|number|165|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|layer_range|number|165|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|power_factor|array|165|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"hero":1040101,"power_factor":[0.95,1.1,1.1,1.1,1.1,1.1]}`|
|2|`{"hero":1030101,"power_factor":[1.02,1,1.05,1.05,1,1]}`|
|3|`{"hero":1030201,"power_factor":[0.9,1,1.05,1.1,1,1]}`|
|4|`{"hero":1030301,"power_factor":[1.1,1.05,1,1,1,1]}`|
|5|`{"hero":1030401,"power_factor":[0.95,1,1,1,1,1]}`|
|6|`{"hero":1030501,"power_factor":[1,1,1,1,1,1]}`|
|7|`{"hero":1020101,"power_factor":[0.9,0.9,1,1,1,1]}`|
|8|`{"hero":1020201,"power_factor":[0.95,1,1,1,1,1]}`|
|9|`{"hero":1020301,"power_factor":[1,1,1,1,1,1]}`|
|10|`{"hero":1020401,"power_factor":[0.92,0.98,1,1,1,1]}`|
|11|`{"hero":1020501,"power_factor":[0.95,1,1,1,1,1]}`|
|12|`{"hero":1020601,"power_factor":[0.95,1,1,1,1,1]}`|
|13|`{"hero":1010101,"power_factor":[0.9,0.9,1,1,1,1]}`|
|14|`{"hero":1010201,"power_factor":[1,1,1,1,1,1]}`|
|15|`{"hero":2030101,"power_factor":[0.91,1,1,1.05,1,1]}`|
|16|`{"hero":2030201,"power_factor":[0.91,0.95,1,1.05,1,1]}`|
|17|`{"hero":2030301,"power_factor":[1,1.1,1.05,1.05,1,1]}`|
|18|`{"hero":2030401,"power_factor":[1.1,1.1,1,1,1,1]}`|
|19|`{"hero":2020101,"power_factor":[1.1,1.1,1,1,1,1]}`|
|20|`{"hero":2020201,"power_factor":[1,1,1,1,1,1]}`|
|21|`{"hero":2020301,"power_factor":[1,1,1,1,1,1]}`|
|22|`{"hero":2020401,"power_factor":[0.9,1,1,1,1,1]}`|
|23|`{"hero":2020501,"power_factor":[0.9,1,1,1,1,1]}`|
|24|`{"hero":2020601,"power_factor":[1.1,1.1,1.05,1,1,1]}`|
|25|`{"hero":2010101,"power_factor":[0.95,1,1,1,1,1]}`|
|26|`{"hero":2010201,"power_factor":[1,1,1,1,1,1]}`|
|27|`{"hero":2030501,"power_factor":[1.15,1.1,1.05,1,1,1]}`|
|28|`{"hero":3030201,"power_factor":[1.05,1.1,1,1,1,1]}`|
|29|`{"hero":3030301,"power_factor":[0.95,1,1,1,1,1]}`|
|30|`{"hero":3030401,"power_factor":[0.9,1,1,1,1,1]}`|
|31|`{"hero":3030501,"power_factor":[0.97,1.05,1.05,1.05,1,1]}`|
|32|`{"hero":3030601,"power_factor":[0.95,1,1,1,1,1]}`|
|33|`{"hero":3020101,"power_factor":[0.9,0.9,0.9,1,1,1]}`|
|34|`{"hero":3020201,"power_factor":[0.9,0.9,1,1,1,1]}`|
|35|`{"hero":3020301,"power_factor":[0.9,1,1,1,1,1]}`|
|36|`{"hero":3020401,"power_factor":[1,1,1,1,1,1]}`|
|37|`{"hero":3020501,"power_factor":[0.95,1,1,1,1,1]}`|
|38|`{"hero":3010101,"power_factor":[1.1,1.05,1,1,1,1]}`|
|39|`{"hero":3010201,"power_factor":[1,1,1,1,1,1]}`|
|40|`{"hero":3010301,"power_factor":[0.9,1,1,1,1,1]}`|
|41|`{"hero":4030101,"power_factor":[0.9,0.95,1,1,1,1]}`|
|42|`{"hero":4030201,"power_factor":[0.9,1,1,1,1,1]}`|
|43|`{"hero":4030301,"power_factor":[0.9,1,1,1,1,1]}`|
|44|`{"hero":4030401,"power_factor":[0.9,1,1,1,1,1]}`|
|45|`{"hero":4030501,"power_factor":[1.05,1.05,1,1,1,1]}`|
|46|`{"hero":4030601,"power_factor":[0.9,1,1,1,1,1]}`|
|47|`{"hero":4040201,"power_factor":[1.1,1.1,1,1,1,1]}`|
|48|`{"hero":4020101,"power_factor":[0.9,1,1,1,1,1]}`|
|49|`{"hero":4020201,"power_factor":[0.9,1,1,1,1,1]}`|
|50|`{"hero":4020301,"power_factor":[1.1,1.05,1,1,1,1]}`|
|51|`{"hero":4020401,"power_factor":[0.9,0.9,1,1,1,1]}`|
|52|`{"hero":4020501,"power_factor":[1,1,1,1,1,1]}`|
|53|`{"hero":4010101,"power_factor":[1,1,1,1,1,1]}`|
|54|`{"hero":4010201,"power_factor":[1.1,1,1,1,1,1]}`|
|55|`{"hero":4010301,"power_factor":[0.9,0.9,1,1,1,1]}`|
|1001|`{"hero":1040101,"power_factor":[0.97,1.1,1.1,1.1,1.1,1.1]}`|
|1002|`{"hero":1030101,"power_factor":[1.02,1,1.03,1.03,1,1]}`|
|1003|`{"hero":1030201,"power_factor":[0.94,1,1.03,1.07,1,1]}`|
|1004|`{"hero":1030301,"power_factor":[1.07,1.03,1,1,1,1]}`|
|1005|`{"hero":1030401,"power_factor":[0.94,1,1,1,1,1]}`|
|1006|`{"hero":1030501,"power_factor":[1,1,1,1,1,1]}`|
|1007|`{"hero":1020101,"power_factor":[0.94,0.94,1,1,1,1]}`|
|1008|`{"hero":1020201,"power_factor":[0.97,1,1,1,1,1]}`|
|1009|`{"hero":1020301,"power_factor":[1,1,1,1,1,1]}`|
|1010|`{"hero":1020401,"power_factor":[0.97,1,1,1,1,1]}`|
|1011|`{"hero":1020501,"power_factor":[0.97,1,1,1,1,1]}`|
|1012|`{"hero":1020601,"power_factor":[0.97,1,1,1,1,1]}`|
|1013|`{"hero":1010101,"power_factor":[0.94,0.94,1,1,1,1]}`|
|1014|`{"hero":1010201,"power_factor":[1,1,1,1,1,1]}`|
|1015|`{"hero":2030101,"power_factor":[0.95,1,1,1.03,1,1]}`|
|1016|`{"hero":2030201,"power_factor":[0.95,1,1,1.03,1,1]}`|
|1017|`{"hero":2030301,"power_factor":[1,1.07,1.03,1.03,1,1]}`|
|1018|`{"hero":2030401,"power_factor":[1.07,1.07,1,1,1,1]}`|
|1019|`{"hero":2020101,"power_factor":[1.07,1.07,1,1,1,1]}`|
|1020|`{"hero":2020201,"power_factor":[1,1,1,1,1,1]}`|
|1021|`{"hero":2020301,"power_factor":[1,1,1,1,1,1]}`|
|1022|`{"hero":2020401,"power_factor":[0.97,1,1,1,1,1]}`|
|1023|`{"hero":2020501,"power_factor":[0.97,1,1,1,1,1]}`|
|1024|`{"hero":2020601,"power_factor":[1.04,1.07,1.03,1,1,1]}`|
|1025|`{"hero":2010101,"power_factor":[1,1,1,1,1,1]}`|
|1026|`{"hero":2010201,"power_factor":[1,1,1,1,1,1]}`|
|1027|`{"hero":2030501,"power_factor":[1.1,1.07,1.03,1,1,1]}`|
|1028|`{"hero":3030201,"power_factor":[1.07,1.07,1,1,1,1]}`|
|1029|`{"hero":3030301,"power_factor":[0.94,1,1,1,1,1]}`|
|1030|`{"hero":3030401,"power_factor":[0.94,1,1,1,1,1]}`|
|1031|`{"hero":3030501,"power_factor":[0.97,1.03,1.03,1.03,1,1]}`|
|1032|`{"hero":3030601,"power_factor":[0.95,1,1,1,1,1]}`|
|1033|`{"hero":3020101,"power_factor":[0.94,0.94,0.94,1,1,1]}`|
|1034|`{"hero":3020201,"power_factor":[0.94,0.94,1,1,1,1]}`|
|1035|`{"hero":3020301,"power_factor":[0.94,1,1,1,1,1]}`|
|1036|`{"hero":3020401,"power_factor":[1,1,1,1,1,1]}`|
|1037|`{"hero":3020501,"power_factor":[1,1,1,1,1,1]}`|
|1038|`{"hero":3010101,"power_factor":[1.07,1.03,1,1,1,1]}`|
|1039|`{"hero":3010201,"power_factor":[1,1,1,1,1,1]}`|
|1040|`{"hero":3010301,"power_factor":[0.94,1,1,1,1,1]}`|
|1041|`{"hero":4030101,"power_factor":[0.94,0.97,1,1,1,1]}`|
|1042|`{"hero":4030201,"power_factor":[0.94,1,1,1,1,1]}`|
|1043|`{"hero":4030301,"power_factor":[0.94,1,1,1,1,1]}`|
|1044|`{"hero":4030401,"power_factor":[0.94,1,1,1,1,1]}`|
|1045|`{"hero":4030501,"power_factor":[1.03,1.03,1,1,1,1]}`|
|1046|`{"hero":4030601,"power_factor":[0.94,1,1,1,1,1]}`|
|1047|`{"hero":4040201,"power_factor":[1.07,1.07,1,1,1,1]}`|
|1048|`{"hero":4020101,"power_factor":[0.94,1,1,1,1,1]}`|
|1049|`{"hero":4020201,"power_factor":[0.94,1,1,1,1,1]}`|
|1050|`{"hero":4020301,"power_factor":[1.07,1.03,1,1,1,1]}`|
|1051|`{"hero":4020401,"power_factor":[0.94,0.94,1,1,1,1]}`|
|1052|`{"hero":4020501,"power_factor":[1,1,1,1,1,1]}`|
|1053|`{"hero":4010101,"power_factor":[1,1,1,1,1,1]}`|
|1054|`{"hero":4010201,"power_factor":[1.07,1,1,1,1,1]}`|
|1055|`{"hero":4010301,"power_factor":[0.94,0.94,1,1,1,1]}`|
|2001|`{"hero":1040101,"power_factor":[0.98,1.1,1.1,1.1,1.1,1.1]}`|
|2002|`{"hero":1030101,"power_factor":[1,1,1.02,1.02,1,1]}`|
|2003|`{"hero":1030201,"power_factor":[0.96,1,1.02,1.04,1,1]}`|
|2004|`{"hero":1030301,"power_factor":[1.04,1.02,1,1,1,1]}`|
|2005|`{"hero":1030401,"power_factor":[0.98,1,1,1,1,1]}`|
|2006|`{"hero":1030501,"power_factor":[1,1,1,1,1,1]}`|
|2007|`{"hero":1020101,"power_factor":[0.96,0.96,1,1,1,1]}`|
|2008|`{"hero":1020201,"power_factor":[1,1,1,1,1,1]}`|
|2009|`{"hero":1020301,"power_factor":[1,1,1,1,1,1]}`|
|2010|`{"hero":1020401,"power_factor":[0.98,1,1,1,1,1]}`|
|2011|`{"hero":1020501,"power_factor":[1,1,1,1,1,1]}`|
|2012|`{"hero":1020601,"power_factor":[1,1,1,1,1,1]}`|
|2013|`{"hero":1010101,"power_factor":[0.96,0.96,1,1,1,1]}`|
|2014|`{"hero":1010201,"power_factor":[1,1,1,1,1,1]}`|
|2015|`{"hero":2030101,"power_factor":[0.98,1,1,1.02,1,1]}`|
|2016|`{"hero":2030201,"power_factor":[0.98,1,1,1.02,1,1]}`|
|2017|`{"hero":2030301,"power_factor":[1,1.04,1.02,1.02,1,1]}`|
|2018|`{"hero":2030401,"power_factor":[1.04,1.04,1,1,1,1]}`|
|2019|`{"hero":2020101,"power_factor":[1.04,1.04,1,1,1,1]}`|
|2020|`{"hero":2020201,"power_factor":[1,1,1,1,1,1]}`|
|2021|`{"hero":2020301,"power_factor":[1,1,1,1,1,1]}`|
|2022|`{"hero":2020401,"power_factor":[0.98,1,1,1,1,1]}`|
|2023|`{"hero":2020501,"power_factor":[0.98,1,1,1,1,1]}`|
|2024|`{"hero":2020601,"power_factor":[1.02,1.04,1.02,1,1,1]}`|
|2025|`{"hero":2010101,"power_factor":[1,1,1,1,1,1]}`|
|2026|`{"hero":2010201,"power_factor":[1,1,1,1,1,1]}`|
|2027|`{"hero":2030501,"power_factor":[1.06,1.04,1.02,1,1,1]}`|
|2028|`{"hero":3030201,"power_factor":[1.04,1.04,1,1,1,1]}`|
|2029|`{"hero":3030301,"power_factor":[0.98,1,1,1,1,1]}`|
|2030|`{"hero":3030401,"power_factor":[0.96,1,1,1,1,1]}`|
|2031|`{"hero":3030501,"power_factor":[0.98,1.02,1.02,1.02,1,1]}`|
|2032|`{"hero":3030601,"power_factor":[0.98,1,1,1,1,1]}`|
|2033|`{"hero":3020101,"power_factor":[0.96,0.96,0.96,1,1,1]}`|
|2034|`{"hero":3020201,"power_factor":[0.96,0.96,1,1,1,1]}`|
|2035|`{"hero":3020301,"power_factor":[0.96,1,1,1,1,1]}`|
|2036|`{"hero":3020401,"power_factor":[1,1,1,1,1,1]}`|
|2037|`{"hero":3020501,"power_factor":[1,1,1,1,1,1]}`|
|2038|`{"hero":3010101,"power_factor":[1.04,1.02,1,1,1,1]}`|
|2039|`{"hero":3010201,"power_factor":[1,1,1,1,1,1]}`|
|2040|`{"hero":3010301,"power_factor":[0.96,1,1,1,1,1]}`|
|2041|`{"hero":4030101,"power_factor":[0.96,0.98,1,1,1,1]}`|
|2042|`{"hero":4030201,"power_factor":[0.96,1,1,1,1,1]}`|
|2043|`{"hero":4030301,"power_factor":[0.96,1,1,1,1,1]}`|
|2044|`{"hero":4030401,"power_factor":[0.96,1,1,1,1,1]}`|
|2045|`{"hero":4030501,"power_factor":[1.02,1.02,1,1,1,1]}`|
|2046|`{"hero":4030601,"power_factor":[0.96,1,1,1,1,1]}`|
|2047|`{"hero":4040201,"power_factor":[1.04,1.04,1,1,1,1]}`|
|2048|`{"hero":4020101,"power_factor":[0.96,1,1,1,1,1]}`|
|2049|`{"hero":4020201,"power_factor":[0.96,1,1,1,1,1]}`|
|2050|`{"hero":4020301,"power_factor":[1.04,1.02,1,1,1,1]}`|
|2051|`{"hero":4020401,"power_factor":[0.96,0.96,1,1,1,1]}`|
|2052|`{"hero":4020501,"power_factor":[1,1,1,1,1,1]}`|
|2053|`{"hero":4010101,"power_factor":[1,1,1,1,1,1]}`|
|2054|`{"hero":4010201,"power_factor":[1.04,1,1,1,1,1]}`|
|2055|`{"hero":4010301,"power_factor":[0.96,0.96,1,1,1,1]}`|

## ShowAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|loop_time|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pass_award|array|2|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"loop_time":3,"pass_award":[157002]}`|
|11|`{"loop_time":3,"pass_award":[]}`|

## Global

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|fast_harvest_layer|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fast_harvest_red_layer|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|layer_award_delay_time|number|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|dispatch_layer|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skip_layer|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|flee_layer|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|flee_max_layer|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|record_open_layer|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skip_battle_layer|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skip_layer_tip|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_show_count|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|speed|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|scale|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bubble_cd|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rapid_fighting|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|auto_fight_show|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|auto_fight_open|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|auto_fight_open_tips|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|auto_fight_bubble_cd|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hook_layer|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|power_estimation|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tip_hide_sec|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_show_cnt|number|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|employ_tip_cond_main|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|instant_quick_fight_open|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"layer_award_delay_time":1000,"flee_max_layer":30,"record_open_layer":30,"max_show_count":5,"speed":55,"rapid_fighting":10,"auto_fight_show":153379200003,"auto_fight_open":153379200003,"auto_fight_open_tips":9,"auto_fight_bubble_cd":8000,"power_estimation":10,"award_show_cnt":4,"employ_tip_cond_main":[40,2],"instant_quick_fight_open":40277400003}`|

## Story

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## FightVictory

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|7|本表行键；与其他表同值不自动代表同一对象。|
|des|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|14|`{}`|
|15|`{}`|
|16|`{}`|
|17|`{}`|
|20|`{}`|
|22|`{}`|
|23|`{}`|

## PeakSpecialAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|27|本表行键；与其他表同值不自动代表同一对象。|
|award|array/object|27|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award":[["img_tgjl_shouyi.png",667194]]}`|
|2|`{"award":{"global":"TableEmpty"}}`|
|3|`{"award":{"global":"TableEmpty"}}`|
|4|`{"award":{"global":"TableEmpty"}}`|
|5|`{"award":{"global":"TableEmpty"}}`|
|6|`{"award":{"global":"TableEmpty"}}`|
|7|`{"award":{"global":"TableEmpty"}}`|
|8|`{"award":{"global":"TableEmpty"}}`|
|9|`{"award":{"global":"TableEmpty"}}`|
|10|`{"award":{"global":"TableEmpty"}}`|
|11|`{"award":{"global":"TableEmpty"}}`|
|12|`{"award":{"global":"TableEmpty"}}`|
|13|`{"award":{"global":"TableEmpty"}}`|
|14|`{"award":{"global":"TableEmpty"}}`|
|15|`{"award":{"global":"TableEmpty"}}`|
|16|`{"award":{"global":"TableEmpty"}}`|
|17|`{"award":{"global":"TableEmpty"}}`|
|18|`{"award":{"global":"TableEmpty"}}`|
|19|`{"award":{"global":"TableEmpty"}}`|
|20|`{"award":{"global":"TableEmpty"}}`|
|21|`{"award":{"global":"TableEmpty"}}`|
|22|`{"award":{"global":"TableEmpty"}}`|
|23|`{"award":{"global":"TableEmpty"}}`|
|24|`{"award":{"global":"TableEmpty"}}`|
|25|`{"award":{"global":"TableEmpty"}}`|
|26|`{"award":{"global":"TableEmpty"}}`|
|27|`{"award":{"global":"TableEmpty"}}`|

## Type

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|27|本表行键；与其他表同值不自动代表同一对象。|
|func_name|number|27|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|layer_range|array|27|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|limit_layer|number|27|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|special|boolean|27|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|27|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|tower_prefab|string|27|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pass_award|array|27|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|scene|string|27|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|icon|string|27|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|preview_img|string|27|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"func_name":668986,"limit_layer":3000,"award":[[21100404,30],[24300404,60]],"pass_award":[157002,17002]}`|
|2|`{"func_name":668988,"limit_layer":3000,"award":[[21100404,60],[24300404,20]],"pass_award":[157002,17002]}`|
|3|`{"func_name":668990,"limit_layer":3000,"award":[[21100404,60],[24300404,20]],"pass_award":[157002,17002]}`|
|4|`{"func_name":668987,"limit_layer":3000,"award":[[651002,2],[24300404,20]],"pass_award":[157002,17002]}`|
|5|`{"func_name":668989,"limit_layer":3000,"award":[[652002,2],[24300404,30]],"pass_award":[157002,17002]}`|
|6|`{"func_name":668991,"limit_layer":3000,"award":[[654002,2],[24300404,30]],"pass_award":[157002,17002]}`|
|7|`{"func_name":668992,"limit_layer":3000,"award":[[653002,2],[479002,30]],"pass_award":[157002,17002]}`|
|8|`{"func_name":668994,"limit_layer":3000,"award":[[652002,2],[24300404,30]],"pass_award":[157002,17002]}`|
|9|`{"func_name":668996,"limit_layer":3000,"award":[[654002,2],[479002,30]],"pass_award":[157002,17002]}`|
|10|`{"func_name":668993,"limit_layer":3000,"award":[[653002,2],[24300404,30]],"pass_award":[157002,17002]}`|
|11|`{"func_name":668995,"limit_layer":3000,"award":[[651002,2],[479002,40]],"pass_award":[157002,17002]}`|
|12|`{"func_name":668997,"limit_layer":3000,"award":[[654002,2],[24300404,60]],"pass_award":[157002,17002]}`|
|13|`{"func_name":668998,"limit_layer":3000,"award":[[653002,2],[479002,40]],"pass_award":[157002,17002]}`|
|14|`{"func_name":669000,"limit_layer":3000,"award":[[651002,2],[24300404,60]],"pass_award":[157002,17002]}`|
|15|`{"func_name":669002,"limit_layer":3000,"award":[[652002,2],[479002,50]],"pass_award":[157002,17002]}`|
|16|`{"func_name":668999,"limit_layer":3000,"award":[[653002,2],[24300404,60]],"pass_award":[157002,17002]}`|
|17|`{"func_name":669001,"limit_layer":3000,"award":[[651002,2],[479002,50]],"pass_award":[157002,17002]}`|
|18|`{"func_name":669003,"limit_layer":3000,"award":[[652002,2],[24300404,60]],"pass_award":[157002,17002]}`|
|19|`{"func_name":668998,"limit_layer":3000,"award":[[654002,2],[479002,60]],"pass_award":[157002,17002]}`|
|20|`{"func_name":669000,"limit_layer":3000,"award":[[23002,1],[24300404,60]],"pass_award":[157002,17002]}`|
|21|`{"func_name":669002,"limit_layer":3000,"award":[[23002,1],[479002,60]],"pass_award":[157002,17002]}`|
|22|`{"func_name":668999,"limit_layer":3000,"award":[[23002,1],[24300404,60]],"pass_award":[157002,17002]}`|
|23|`{"func_name":669001,"limit_layer":3000,"award":[[23002,1],[479002,60]],"pass_award":[157002,17002]}`|
|24|`{"func_name":669003,"limit_layer":3000,"award":[[23002,1],[24300404,60]],"pass_award":[157002,17002]}`|
|25|`{"func_name":668998,"limit_layer":3000,"award":[[23002,1],[479002,60]],"pass_award":[157002,17002]}`|
|26|`{"func_name":669000,"limit_layer":3000,"award":[[23002,1],[24300404,60]],"pass_award":[157002,17002]}`|
|27|`{"func_name":669002,"limit_layer":3000,"award":[[23002,1],[479002,60]],"pass_award":[157002,17002]}`|

## PeakTower

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|9000|本表行键；与其他表同值不自动代表同一对象。|
|fight|number|9000|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pass_award|array|9000|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|pass_award_n|array|9000|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|fighting_power|number|9000|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tip_type|number|9000|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|monster_style|number|9000|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tower_name|number|9000|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tower_index|number|9000|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|assistant_param|number|9000|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部9000行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"fight":1010001,"pass_award":[157002,201500,101800],"pass_award_n":[600,2200,50],"fighting_power":15009,"tip_type":0}`|
|2|`{"fight":1010002,"pass_award":[157002,201500,101800],"pass_award_n":[600,2200,50],"fighting_power":15528,"tip_type":0}`|
|3|`{"fight":1010003,"pass_award":[157002,201500,101800],"pass_award_n":[600,2200,50],"fighting_power":17034,"tip_type":0}`|

## Stage

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|max_layer|number|3|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"max_layer":9000}`|
|2|`{"max_layer":9000}`|
|3|`{"max_layer":9000}`|

## DiffRankAttr

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|151|本表行键；与其他表同值不自动代表同一对象。|
|beyond_range|array|151|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|power_mul|number|151|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"power_mul":0}`|
|2|`{"power_mul":0}`|
|3|`{"power_mul":0}`|
|4|`{"power_mul":0}`|
|5|`{"power_mul":0}`|
|6|`{"power_mul":0}`|
|7|`{"power_mul":0}`|
|8|`{"power_mul":0}`|
|9|`{"power_mul":0}`|
|10|`{"power_mul":0}`|
|11|`{"power_mul":0}`|
|12|`{"power_mul":0}`|
|13|`{"power_mul":0}`|
|14|`{"power_mul":0}`|
|15|`{"power_mul":0}`|
|16|`{"power_mul":0}`|
|17|`{"power_mul":0}`|
|18|`{"power_mul":0}`|
|19|`{"power_mul":0}`|
|20|`{"power_mul":0}`|
|21|`{"power_mul":0}`|
|22|`{"power_mul":0}`|
|23|`{"power_mul":0}`|
|24|`{"power_mul":0}`|
|25|`{"power_mul":0}`|
|26|`{"power_mul":0}`|
|27|`{"power_mul":0}`|
|28|`{"power_mul":0}`|
|29|`{"power_mul":0}`|
|30|`{"power_mul":0}`|
|31|`{"power_mul":0}`|
|32|`{"power_mul":0}`|
|33|`{"power_mul":0}`|
|34|`{"power_mul":0}`|
|35|`{"power_mul":0}`|
|36|`{"power_mul":0}`|
|37|`{"power_mul":0}`|
|38|`{"power_mul":0}`|
|39|`{"power_mul":0}`|
|40|`{"power_mul":0}`|
|41|`{"power_mul":0}`|
|42|`{"power_mul":0}`|
|43|`{"power_mul":0}`|
|44|`{"power_mul":0}`|
|45|`{"power_mul":0}`|
|46|`{"power_mul":0}`|
|47|`{"power_mul":0}`|
|48|`{"power_mul":0}`|
|49|`{"power_mul":0}`|
|50|`{"power_mul":0}`|
|51|`{"power_mul":0}`|
|52|`{"power_mul":0}`|
|53|`{"power_mul":0}`|
|54|`{"power_mul":0}`|
|55|`{"power_mul":0}`|
|56|`{"power_mul":0}`|
|57|`{"power_mul":0}`|
|58|`{"power_mul":0}`|
|59|`{"power_mul":0}`|
|60|`{"power_mul":0}`|
|61|`{"power_mul":0}`|
|62|`{"power_mul":0}`|
|63|`{"power_mul":0}`|
|64|`{"power_mul":0}`|
|65|`{"power_mul":0}`|
|66|`{"power_mul":0}`|
|67|`{"power_mul":0}`|
|68|`{"power_mul":0}`|
|69|`{"power_mul":0}`|
|70|`{"power_mul":0}`|
|71|`{"power_mul":0}`|
|72|`{"power_mul":0}`|
|73|`{"power_mul":0}`|
|74|`{"power_mul":0}`|
|75|`{"power_mul":0}`|
|76|`{"power_mul":0}`|
|77|`{"power_mul":0}`|
|78|`{"power_mul":0}`|
|79|`{"power_mul":0}`|
|80|`{"power_mul":0}`|
|81|`{"power_mul":0}`|
|82|`{"power_mul":0}`|
|83|`{"power_mul":0}`|
|84|`{"power_mul":0}`|
|85|`{"power_mul":0}`|
|86|`{"power_mul":0}`|
|87|`{"power_mul":0}`|
|88|`{"power_mul":0}`|
|89|`{"power_mul":0}`|
|90|`{"power_mul":0}`|
|91|`{"power_mul":0}`|
|92|`{"power_mul":0}`|
|93|`{"power_mul":0}`|
|94|`{"power_mul":0}`|
|95|`{"power_mul":0}`|
|96|`{"power_mul":0}`|
|97|`{"power_mul":0}`|
|98|`{"power_mul":0}`|
|99|`{"power_mul":0}`|
|100|`{"power_mul":0}`|
|101|`{"power_mul":0}`|
|102|`{"power_mul":0}`|
|103|`{"power_mul":0}`|
|104|`{"power_mul":0}`|
|105|`{"power_mul":0}`|
|106|`{"power_mul":0}`|
|107|`{"power_mul":0}`|
|108|`{"power_mul":0}`|
|109|`{"power_mul":0}`|
|110|`{"power_mul":0}`|
|111|`{"power_mul":0}`|
|112|`{"power_mul":0}`|
|113|`{"power_mul":0}`|
|114|`{"power_mul":0}`|
|115|`{"power_mul":0}`|
|116|`{"power_mul":0}`|
|117|`{"power_mul":0}`|
|118|`{"power_mul":0}`|
|119|`{"power_mul":0}`|
|120|`{"power_mul":0}`|
|121|`{"power_mul":0}`|
|122|`{"power_mul":0}`|
|123|`{"power_mul":0}`|
|124|`{"power_mul":0}`|
|125|`{"power_mul":0}`|
|126|`{"power_mul":0}`|
|127|`{"power_mul":0}`|
|128|`{"power_mul":0}`|
|129|`{"power_mul":0}`|
|130|`{"power_mul":0}`|
|131|`{"power_mul":0}`|
|132|`{"power_mul":0}`|
|133|`{"power_mul":0}`|
|134|`{"power_mul":0}`|
|135|`{"power_mul":0}`|
|136|`{"power_mul":0}`|
|137|`{"power_mul":0}`|
|138|`{"power_mul":0}`|
|139|`{"power_mul":0}`|
|140|`{"power_mul":0}`|
|141|`{"power_mul":0}`|
|142|`{"power_mul":0}`|
|143|`{"power_mul":0}`|
|144|`{"power_mul":0}`|
|145|`{"power_mul":0}`|
|146|`{"power_mul":0}`|
|147|`{"power_mul":0}`|
|148|`{"power_mul":0}`|
|149|`{"power_mul":0}`|
|150|`{"power_mul":0}`|
|151|`{"power_mul":0}`|

## DiffRank

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|324|本表行键；与其他表同值不自动代表同一对象。|
|base_layer|number|324|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部324行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"base_layer":9000}`|
|2|`{"base_layer":9000}`|
|3|`{"base_layer":9000}`|
