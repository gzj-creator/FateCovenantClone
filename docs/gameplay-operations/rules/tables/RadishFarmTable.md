# RadishFarmTable 规则参数

来源：[personal-server/assets/tables/RadishFarmTable.data.lua.json.gz](../../../../personal-server/assets/tables/RadishFarmTable.data.lua.json.gz)，SHA256：`cdc5fd8ef5cf3d7bc36266d72699067829f49964a01393537c321c945914ba6b`。

[完整逐行JSON](RadishFarmTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[GrowState](#growstate)|3|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[MultiShow](#multishow)|3|decoded-rows|
|[Gift](#gift)|97|decoded-rows|
|[Activity](#activity)|16|decoded-rows|
|[ActivityType](#activitytype)|2|decoded-rows|

## GrowState

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|speed_up_per|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|progress|array|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"speed_up_per":5,"progress":[0,33]}`|
|2|`{"speed_up_per":5,"progress":[34,66]}`|
|3|`{"speed_up_per":5,"progress":[67,99]}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|max_unique_relic|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|recycle_prop|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|recycle_scale|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|recycle_award|number|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"max_unique_relic":3,"recycle_prop":644002,"recycle_scale":5,"recycle_award":101500}`|

## MultiShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|icon|string|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|

## Gift

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|recharge_tid|number|97|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|group|number|97|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|select_in_list|boolean|97|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|97|本表行键；与其他表同值不自动代表同一对象。|
|act_version|number|97|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"group":1,"select_in_list":false,"act_version":1}`|
|2|`{"group":1,"select_in_list":true,"act_version":1}`|
|3|`{"group":1,"select_in_list":true,"act_version":1}`|
|4|`{"group":1,"select_in_list":true,"act_version":1}`|
|5|`{"group":1,"select_in_list":true,"act_version":1}`|
|6|`{"group":1,"select_in_list":true,"act_version":1}`|
|11|`{"group":1,"select_in_list":false,"act_version":2}`|
|12|`{"group":1,"select_in_list":true,"act_version":2}`|
|13|`{"group":1,"select_in_list":true,"act_version":2}`|
|14|`{"group":1,"select_in_list":true,"act_version":2}`|
|15|`{"group":1,"select_in_list":true,"act_version":2}`|
|16|`{"group":1,"select_in_list":true,"act_version":2}`|
|21|`{"group":1,"select_in_list":false,"act_version":3}`|
|22|`{"group":1,"select_in_list":true,"act_version":3}`|
|23|`{"group":1,"select_in_list":true,"act_version":3}`|
|24|`{"group":1,"select_in_list":true,"act_version":3}`|
|25|`{"group":1,"select_in_list":true,"act_version":3}`|
|26|`{"group":1,"select_in_list":true,"act_version":3}`|
|27|`{"group":1,"select_in_list":false,"act_version":4}`|
|28|`{"group":1,"select_in_list":true,"act_version":4}`|
|29|`{"group":1,"select_in_list":true,"act_version":4}`|
|30|`{"group":1,"select_in_list":true,"act_version":4}`|
|31|`{"group":1,"select_in_list":true,"act_version":4}`|
|32|`{"group":1,"select_in_list":true,"act_version":4}`|
|33|`{"group":1,"select_in_list":false,"act_version":5}`|
|34|`{"group":1,"select_in_list":true,"act_version":5}`|
|35|`{"group":1,"select_in_list":true,"act_version":5}`|
|36|`{"group":1,"select_in_list":true,"act_version":5}`|
|37|`{"group":1,"select_in_list":true,"act_version":5}`|
|38|`{"group":1,"select_in_list":true,"act_version":5}`|
|39|`{"group":1,"select_in_list":false,"act_version":6}`|
|40|`{"group":1,"select_in_list":true,"act_version":6}`|
|41|`{"group":1,"select_in_list":true,"act_version":6}`|
|42|`{"group":1,"select_in_list":true,"act_version":6}`|
|43|`{"group":1,"select_in_list":true,"act_version":6}`|
|44|`{"group":1,"select_in_list":true,"act_version":6}`|
|45|`{"group":1,"select_in_list":false,"act_version":7}`|
|46|`{"group":1,"select_in_list":true,"act_version":7}`|
|47|`{"group":1,"select_in_list":true,"act_version":7}`|
|48|`{"group":1,"select_in_list":true,"act_version":7}`|
|49|`{"group":1,"select_in_list":true,"act_version":7}`|
|50|`{"group":1,"select_in_list":true,"act_version":7}`|
|51|`{"group":1,"select_in_list":false,"act_version":8}`|
|52|`{"group":1,"select_in_list":true,"act_version":8}`|
|53|`{"group":1,"select_in_list":true,"act_version":8}`|
|54|`{"group":1,"select_in_list":true,"act_version":8}`|
|55|`{"group":1,"select_in_list":true,"act_version":8}`|
|56|`{"group":1,"select_in_list":true,"act_version":8}`|
|57|`{"group":1,"select_in_list":false,"act_version":9}`|
|58|`{"group":1,"select_in_list":true,"act_version":9}`|
|59|`{"group":1,"select_in_list":true,"act_version":9}`|
|60|`{"group":1,"select_in_list":true,"act_version":9}`|
|61|`{"group":1,"select_in_list":true,"act_version":9}`|
|62|`{"group":1,"select_in_list":true,"act_version":9}`|
|63|`{"group":2,"select_in_list":false,"act_version":101}`|
|64|`{"group":2,"select_in_list":true,"act_version":101}`|
|65|`{"group":2,"select_in_list":true,"act_version":101}`|
|66|`{"group":2,"select_in_list":true,"act_version":101}`|
|67|`{"group":1,"select_in_list":true,"act_version":101}`|
|68|`{"group":1,"select_in_list":true,"act_version":101}`|
|69|`{"group":2,"select_in_list":true,"act_version":101}`|
|70|`{"group":1,"select_in_list":false,"act_version":10}`|
|71|`{"group":1,"select_in_list":true,"act_version":10}`|
|72|`{"group":1,"select_in_list":true,"act_version":10}`|
|73|`{"group":1,"select_in_list":true,"act_version":10}`|
|74|`{"group":1,"select_in_list":true,"act_version":10}`|
|75|`{"group":1,"select_in_list":true,"act_version":10}`|
|76|`{"group":1,"select_in_list":false,"act_version":11}`|
|77|`{"group":1,"select_in_list":true,"act_version":11}`|
|78|`{"group":1,"select_in_list":true,"act_version":11}`|
|79|`{"group":1,"select_in_list":true,"act_version":11}`|
|80|`{"group":1,"select_in_list":true,"act_version":11}`|
|81|`{"group":1,"select_in_list":true,"act_version":11}`|
|82|`{"group":1,"select_in_list":false,"act_version":12}`|
|83|`{"group":1,"select_in_list":true,"act_version":12}`|
|84|`{"group":1,"select_in_list":true,"act_version":12}`|
|85|`{"group":1,"select_in_list":true,"act_version":12}`|
|86|`{"group":1,"select_in_list":true,"act_version":12}`|
|87|`{"group":1,"select_in_list":true,"act_version":12}`|
|91|`{"group":1,"select_in_list":false,"act_version":13}`|
|92|`{"group":1,"select_in_list":true,"act_version":13}`|
|93|`{"group":1,"select_in_list":true,"act_version":13}`|
|94|`{"group":1,"select_in_list":true,"act_version":13}`|
|95|`{"group":1,"select_in_list":true,"act_version":13}`|
|96|`{"group":1,"select_in_list":true,"act_version":13}`|
|101|`{"group":1,"select_in_list":false,"act_version":14}`|
|102|`{"group":1,"select_in_list":true,"act_version":14}`|
|103|`{"group":1,"select_in_list":true,"act_version":14}`|
|104|`{"group":1,"select_in_list":true,"act_version":14}`|
|105|`{"group":1,"select_in_list":true,"act_version":14}`|
|106|`{"group":1,"select_in_list":true,"act_version":14}`|
|107|`{"group":1,"select_in_list":false,"act_version":15}`|
|108|`{"group":1,"select_in_list":true,"act_version":15}`|
|109|`{"group":1,"select_in_list":true,"act_version":15}`|
|110|`{"group":1,"select_in_list":true,"act_version":15}`|
|111|`{"group":1,"select_in_list":true,"act_version":15}`|
|112|`{"group":1,"select_in_list":true,"act_version":15}`|

## Activity

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|award|array|16|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|help_award|array|16|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|rand_award|number|16|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|type|number|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|16|本表行键；与其他表同值不自动代表同一对象。|
|compensation_award|array|16|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|max_event_cell|number|16|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|cell_max_index|number|16|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|exchange_award|array|16|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|finish_sec|number|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|day_help_times|number|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award":[[377002,5]],"rand_award":0,"type":1,"compensation_award":[[377002,20]],"max_event_cell":9,"cell_max_index":9,"exchange_award":[[510002,1],[511002,1],[24002,1],[333002,1],[22002,1],[23002,1]],"day_help_times":5}`|
|2|`{"award":[[377002,5]],"rand_award":0,"type":1,"compensation_award":[[377002,20]],"max_event_cell":9,"cell_max_index":9,"exchange_award":[[510002,1],[511002,1],[24002,1],[333002,1],[22002,1],[23002,1]],"day_help_times":5}`|
|3|`{"award":[[377002,5]],"rand_award":0,"type":1,"compensation_award":[[377002,20]],"max_event_cell":9,"cell_max_index":9,"exchange_award":[[510002,1],[511002,1],[24002,1],[333002,1],[22002,1],[23002,1]],"day_help_times":5}`|
|4|`{"award":[[377002,5]],"rand_award":0,"type":1,"compensation_award":[[377002,20]],"max_event_cell":9,"cell_max_index":9,"exchange_award":[[500002,1],[498002,1],[24002,1],[333002,1],[22002,1],[23002,1]],"day_help_times":5}`|
|5|`{"award":[[377002,5]],"rand_award":0,"type":1,"compensation_award":[[377002,20]],"max_event_cell":9,"cell_max_index":9,"exchange_award":[[599002,1],[598002,1],[24002,1],[333002,1],[22002,1],[23002,1]],"day_help_times":5}`|
|6|`{"award":[[377002,5]],"rand_award":0,"type":1,"compensation_award":[[377002,20]],"max_event_cell":9,"cell_max_index":9,"exchange_award":[[621002,1],[622002,1],[24002,1],[333002,1],[22002,1],[23002,1]],"day_help_times":5}`|
|7|`{"award":[[377002,5]],"rand_award":0,"type":1,"compensation_award":[[377002,20]],"max_event_cell":9,"cell_max_index":9,"exchange_award":[[624002,1],[625002,1],[24002,1],[333002,1],[22002,1],[23002,1]],"day_help_times":5}`|
|8|`{"award":[[377002,5]],"rand_award":0,"type":1,"compensation_award":[[377002,20]],"max_event_cell":9,"cell_max_index":9,"exchange_award":[[629002,1],[630002,1],[24002,1],[333002,1],[22002,1],[23002,1]],"day_help_times":5}`|
|9|`{"award":[[377002,5]],"rand_award":0,"type":1,"compensation_award":[[377002,20]],"max_event_cell":9,"cell_max_index":9,"exchange_award":[[510002,1],[101200,1],[1321200,1],[24002,1],[333002,1],[22002,1]],"day_help_times":5}`|
|10|`{"award":[[377002,5]],"rand_award":0,"type":1,"compensation_award":[[377002,20]],"max_event_cell":9,"cell_max_index":9,"exchange_award":[[1001002,1],[1002002,1],[1003002,1],[1004002,1],[24002,1],[22002,1]],"day_help_times":5}`|
|11|`{"award":[[377002,5]],"rand_award":0,"type":1,"compensation_award":[[377002,20]],"max_event_cell":9,"cell_max_index":9,"exchange_award":[[1001002,1],[1002002,1],[1003002,1],[1004002,1],[510002,1],[511002,1]],"day_help_times":5}`|
|12|`{"award":[[377002,5]],"rand_award":0,"type":1,"compensation_award":[[377002,20]],"max_event_cell":9,"cell_max_index":9,"exchange_award":[[1001002,1],[1002002,1],[1003002,1],[1004002,1],[24002,1],[22002,1]],"day_help_times":5}`|
|13|`{"award":[[377002,5]],"rand_award":0,"type":1,"compensation_award":[[377002,20]],"max_event_cell":9,"cell_max_index":9,"exchange_award":[[598002,1],[599002,1],[589002,1],[588002,1],[497002,1],[498002,1]],"day_help_times":5}`|
|14|`{"award":[[377002,5]],"rand_award":0,"type":1,"compensation_award":[[377002,20]],"max_event_cell":9,"cell_max_index":9,"exchange_award":[[621002,1],[625002,1],[622002,1],[624002,1],[500002,1],[517002,1]],"day_help_times":5}`|
|15|`{"award":[[377002,5]],"rand_award":0,"type":1,"compensation_award":[[377002,20]],"max_event_cell":9,"cell_max_index":9,"exchange_award":[[1001002,1],[1002002,1],[1003002,1],[1004002,1],[24002,1],[22002,1]],"day_help_times":5}`|
|101|`{"award":[[644002,5]],"rand_award":0,"type":2,"compensation_award":[[644002,20]],"max_event_cell":9,"cell_max_index":9,"exchange_award":[[1001002,1],[1002002,1],[1003002,1],[1004002,1]],"day_help_times":5}`|

## ActivityType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|help_mgs|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
