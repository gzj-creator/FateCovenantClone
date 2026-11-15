# RegularGiftTable 规则参数

来源：[personal-server/assets/tables/RegularGiftTable.data.lua.json.gz](../../../../personal-server/assets/tables/RegularGiftTable.data.lua.json.gz)，SHA256：`471a42b9171de367100e0196dd3cd794ff9298ae0351171640df04bc15d800e9`。

[完整逐行JSON](RegularGiftTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[PriceAnchor](#priceanchor)|1|decoded-rows|
|[Type](#type)|22|decoded-rows|
|[Group](#group)|88|decoded-rows|
|[RegularGift](#regulargift)|11|decoded-rows|

## PriceAnchor

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|jump|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|finish_jump|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|get_tips|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|jump_tips|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|24001007|`{}`|

## Type

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|22|本表行键；与其他表同值不自动代表同一对象。|
|setFreeRed|boolean|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|other_control|boolean|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|forbid|boolean|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"setFreeRed":true}`|
|2|`{"setFreeRed":true}`|
|3|`{"setFreeRed":true}`|
|4|`{"setFreeRed":false}`|
|5|`{"setFreeRed":false}`|
|7|`{"setFreeRed":false}`|
|8|`{"setFreeRed":false}`|
|16|`{"setFreeRed":false}`|
|17|`{"setFreeRed":false}`|
|18|`{"setFreeRed":false}`|
|19|`{"setFreeRed":false}`|
|20|`{"setFreeRed":false}`|
|21|`{"setFreeRed":false}`|
|22|`{"setFreeRed":false}`|
|23|`{"setFreeRed":true}`|
|24|`{"setFreeRed":false}`|
|25|`{"setFreeRed":false}`|
|26|`{"setFreeRed":false}`|
|27|`{"setFreeRed":false}`|
|28|`{"setFreeRed":false}`|
|29|`{"setFreeRed":false}`|
|30|`{"setFreeRed":false}`|

## Group

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|88|本表行键；与其他表同值不自动代表同一对象。|
|top_value_pick_supply_priority|number|88|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sort_num|number|88|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_condition|number/null|88|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|banner|string|88|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|gifts|array|88|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|front_Color|number|88|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001001|`{"top_value_pick_supply_priority":501,"sort_num":501,"show_condition":19257301001}`|
|1001002|`{"top_value_pick_supply_priority":501,"sort_num":501,"show_condition":19257301002}`|
|1001003|`{"top_value_pick_supply_priority":501,"sort_num":501,"show_condition":19257301003}`|
|1001004|`{"top_value_pick_supply_priority":502,"sort_num":502,"show_condition":null}`|
|1001005|`{"top_value_pick_supply_priority":503,"sort_num":503,"show_condition":186948600101}`|
|1001006|`{"top_value_pick_supply_priority":511,"sort_num":511,"show_condition":8776201002}`|
|1001007|`{"top_value_pick_supply_priority":512,"sort_num":512,"show_condition":8776201003}`|
|1001008|`{"top_value_pick_supply_priority":513,"sort_num":513,"show_condition":8776201004}`|
|1001009|`{"top_value_pick_supply_priority":514,"sort_num":514,"show_condition":8776201005}`|
|1001010|`{"top_value_pick_supply_priority":515,"sort_num":515,"show_condition":8776201006}`|
|1001011|`{"top_value_pick_supply_priority":504,"sort_num":504,"show_condition":955132601044}`|
|1001012|`{"top_value_pick_supply_priority":506,"sort_num":506,"show_condition":19257301012}`|
|1001013|`{"top_value_pick_supply_priority":505,"sort_num":505,"show_condition":19257301013}`|
|1001014|`{"top_value_pick_supply_priority":504,"sort_num":504,"show_condition":19257301014}`|
|1001015|`{"top_value_pick_supply_priority":500,"sort_num":500,"show_condition":563498640817}`|
|1001016|`{"top_value_pick_supply_priority":501,"sort_num":501,"show_condition":19257301016}`|
|1001017|`{"top_value_pick_supply_priority":507,"sort_num":507,"show_condition":null}`|
|1001018|`{"top_value_pick_supply_priority":501,"sort_num":500,"show_condition":19257301018}`|
|1001019|`{"top_value_pick_supply_priority":501,"sort_num":500,"show_condition":19257301018}`|
|1001020|`{"top_value_pick_supply_priority":501,"sort_num":500,"show_condition":19257301020}`|
|1001021|`{"top_value_pick_supply_priority":501,"sort_num":500,"show_condition":19257301020}`|
|2001001|`{"top_value_pick_supply_priority":257,"sort_num":257,"show_condition":19257301014}`|
|2001002|`{"top_value_pick_supply_priority":262,"sort_num":262,"show_condition":19258301002}`|
|2001003|`{"top_value_pick_supply_priority":261,"sort_num":261,"show_condition":19258301003}`|
|2001004|`{"top_value_pick_supply_priority":260,"sort_num":260,"show_condition":19258301004}`|
|2001005|`{"top_value_pick_supply_priority":259,"sort_num":259,"show_condition":19258301005}`|
|2001006|`{"top_value_pick_supply_priority":258,"sort_num":258,"show_condition":19258301006}`|
|2001007|`{"top_value_pick_supply_priority":266,"sort_num":266,"show_condition":null}`|
|2001008|`{"top_value_pick_supply_priority":267,"sort_num":267,"show_condition":null}`|
|2001009|`{"top_value_pick_supply_priority":251,"sort_num":251,"show_condition":983580210601}`|
|2001010|`{"top_value_pick_supply_priority":250,"sort_num":250,"show_condition":983580210601}`|
|2001011|`{"top_value_pick_supply_priority":249,"sort_num":249,"show_condition":983580210601}`|
|2001012|`{"top_value_pick_supply_priority":248,"sort_num":248,"show_condition":563498640817}`|
|2001013|`{"top_value_pick_supply_priority":249,"sort_num":249,"show_condition":19257301016}`|
|2001014|`{"top_value_pick_supply_priority":263,"sort_num":263,"show_condition":19258301014}`|
|2001015|`{"top_value_pick_supply_priority":256,"sort_num":256,"show_condition":983580210701}`|
|2001016|`{"top_value_pick_supply_priority":268,"sort_num":268,"show_condition":null}`|
|2001017|`{"top_value_pick_supply_priority":254,"sort_num":254,"show_condition":19258301017}`|
|2001018|`{"top_value_pick_supply_priority":253,"sort_num":253,"show_condition":19258301017}`|
|2001019|`{"top_value_pick_supply_priority":252,"sort_num":252,"show_condition":19258301019}`|
|2001020|`{"top_value_pick_supply_priority":256,"sort_num":256,"show_condition":19258301020}`|
|2001021|`{"top_value_pick_supply_priority":256,"sort_num":256,"show_condition":19258301021}`|
|2001022|`{"top_value_pick_supply_priority":255,"sort_num":255,"show_condition":41612219002}`|
|2001023|`{"top_value_pick_supply_priority":255,"sort_num":247,"show_condition":19257301018}`|
|2001024|`{"top_value_pick_supply_priority":255,"sort_num":248,"show_condition":19257301018}`|
|2001025|`{"top_value_pick_supply_priority":255,"sort_num":247,"show_condition":19257301020}`|
|2001026|`{"top_value_pick_supply_priority":255,"sort_num":248,"show_condition":19257301020}`|
|2001027|`{"top_value_pick_supply_priority":252,"sort_num":242,"show_condition":254606700001}`|
|2001028|`{"top_value_pick_supply_priority":253,"sort_num":243,"show_condition":254606700001}`|
|22001001|`{"top_value_pick_supply_priority":0,"sort_num":1,"show_condition":null}`|
|24001001|`{"top_value_pick_supply_priority":0,"sort_num":0,"show_condition":null}`|
|24001002|`{"top_value_pick_supply_priority":0,"sort_num":0,"show_condition":null}`|
|24001003|`{"top_value_pick_supply_priority":0,"sort_num":0,"show_condition":null}`|
|24001004|`{"top_value_pick_supply_priority":0,"sort_num":0,"show_condition":null}`|
|24001005|`{"top_value_pick_supply_priority":0,"sort_num":0,"show_condition":null}`|
|24001006|`{"top_value_pick_supply_priority":0,"sort_num":0,"show_condition":null}`|
|24001007|`{"top_value_pick_supply_priority":0,"sort_num":0,"show_condition":187548001067}`|
|24001008|`{"top_value_pick_supply_priority":0,"sort_num":0,"show_condition":null}`|
|25001001|`{"top_value_pick_supply_priority":0,"sort_num":31,"show_condition":955132601060}`|
|25001002|`{"top_value_pick_supply_priority":0,"sort_num":32,"show_condition":955132601060}`|
|25001003|`{"top_value_pick_supply_priority":0,"sort_num":11,"show_condition":null}`|
|25001004|`{"top_value_pick_supply_priority":0,"sort_num":12,"show_condition":null}`|
|25001005|`{"top_value_pick_supply_priority":0,"sort_num":13,"show_condition":null}`|
|25001006|`{"top_value_pick_supply_priority":0,"sort_num":33,"show_condition":null}`|
|25001007|`{"top_value_pick_supply_priority":0,"sort_num":34,"show_condition":null}`|
|25001008|`{"top_value_pick_supply_priority":0,"sort_num":36,"show_condition":null}`|
|25001009|`{"top_value_pick_supply_priority":0,"sort_num":37,"show_condition":187548001274}`|
|25001010|`{"top_value_pick_supply_priority":0,"sort_num":21,"show_condition":null}`|
|25001011|`{"top_value_pick_supply_priority":0,"sort_num":22,"show_condition":null}`|
|25001012|`{"top_value_pick_supply_priority":0,"sort_num":23,"show_condition":null}`|
|25001013|`{"top_value_pick_supply_priority":0,"sort_num":35,"show_condition":null}`|
|25001014|`{"top_value_pick_supply_priority":0,"sort_num":36,"show_condition":187548001274}`|
|25001015|`{"top_value_pick_supply_priority":0,"sort_num":37,"show_condition":955132601241}`|
|25001016|`{"top_value_pick_supply_priority":0,"sort_num":10,"show_condition":null}`|
|26001001|`{"top_value_pick_supply_priority":0,"sort_num":0,"show_condition":null}`|
|26001002|`{"top_value_pick_supply_priority":0,"sort_num":0,"show_condition":null}`|
|27001001|`{"top_value_pick_supply_priority":0,"sort_num":0,"show_condition":null}`|
|27001002|`{"top_value_pick_supply_priority":0,"sort_num":0,"show_condition":null}`|
|28001001|`{"top_value_pick_supply_priority":0,"sort_num":0,"show_condition":null}`|
|28001002|`{"top_value_pick_supply_priority":0,"sort_num":0,"show_condition":null}`|
|28001003|`{"top_value_pick_supply_priority":0,"sort_num":0,"show_condition":null}`|
|28001004|`{"top_value_pick_supply_priority":0,"sort_num":0,"show_condition":null}`|
|29001001|`{"top_value_pick_supply_priority":0,"sort_num":0,"show_condition":null}`|
|29001002|`{"top_value_pick_supply_priority":0,"sort_num":0,"show_condition":null}`|
|29001003|`{"top_value_pick_supply_priority":0,"sort_num":0,"show_condition":null}`|
|30001001|`{"top_value_pick_supply_priority":0,"sort_num":0,"show_condition":null}`|
|30001002|`{"top_value_pick_supply_priority":0,"sort_num":0,"show_condition":null}`|
|30001003|`{"top_value_pick_supply_priority":0,"sort_num":0,"show_condition":null}`|

## RegularGift

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|11|本表行键；与其他表同值不自动代表同一对象。|
|type|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|refresh_type|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|title|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|banner|string|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|limit_txt|number|11|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|groups|array|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|jump|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{"type":1,"refresh_type":1,"limit_txt":0,"groups":[1001001,1001002,1001003,1001004,1001005,1001006,1001007,1001008,1001009,1001010,1001011,1001012,1001013,1001014,1001015,1001016,1001017,1001018,1001019,1001020,1001021]}`|
|2001|`{"type":2,"refresh_type":2,"limit_txt":0,"groups":[2001001,2001002,2001003,2001004,2001005,2001006,2001007,2001008,2001009,2001010,2001011,2001012,2001013,2001014,2001015,2001016,2001017,2001018,2001019,2001020,2001021,2001022,2001023,2001024,2001025,2001026,2001027,2001028]}`|
|22001|`{"type":22,"refresh_type":6,"limit_txt":0,"groups":[22001001]}`|
|23001|`{"type":23,"refresh_type":4,"limit_txt":0,"groups":[]}`|
|24001|`{"type":17,"refresh_type":0,"limit_txt":0,"groups":[24001001,24001002,24001003,24001004,24001005,24001006,24001007,24001008]}`|
|25001|`{"type":25,"refresh_type":0,"limit_txt":0,"groups":[25001001,25001002,25001003,25001004,25001005,25001006,25001007,25001008,25001009,25001010,25001011,25001012,25001013,25001014,25001015,25001016]}`|
|26001|`{"type":26,"refresh_type":1,"limit_txt":0,"groups":[26001001,26001002]}`|
|27001|`{"type":27,"refresh_type":2,"limit_txt":0,"groups":[27001001,27001002]}`|
|28001|`{"type":28,"refresh_type":1,"limit_txt":0,"groups":[28001001,28001002,28001003,28001004]}`|
|29001|`{"type":29,"refresh_type":2,"limit_txt":0,"groups":[29001001,29001002,29001003]}`|
|30001|`{"type":30,"refresh_type":2,"limit_txt":0,"groups":[30001001,30001002,30001003]}`|
