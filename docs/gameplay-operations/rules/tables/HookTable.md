# HookTable 规则参数

来源：[personal-server/assets/tables/HookTable.data.json.gz](../../../../personal-server/assets/tables/HookTable.data.json.gz)，SHA256：`38ed372ab14c4524174bbbdcc6874c631859e5bbfcca4faf28f36e2908bfc466`。

[完整逐行JSON](HookTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[FastHookType](#fasthooktype)|3|decoded-rows|
|[FastItem](#fastitem)|61|decoded-rows|
|[StyleStatus](#stylestatus)|2|decoded-rows|
|[Type](#type)|12|rows-with-external-references|
|[Stage](#stage)|5593|decoded-rows|
|[RandomAward](#randomaward)|60|decoded-rows|

## FastHookType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|fast_gather_time|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|free_fast_addition|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fast_gather_price|array|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|unlock_assert|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tip|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|red_path|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tip_params|array|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|pay_fast_addition|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fast_time_addition|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fast_gather_cost_item|number|3|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|fast_gather_n|array|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hook_type|array|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|2|`{"fast_gather_time":7200,"free_fast_addition":0,"fast_gather_price":[50,100,150],"unlock_assert":955132601139,"pay_fast_addition":0,"fast_time_addition":76,"fast_gather_cost_item":101500,"hook_type":[10]}`|
|4|`{"fast_gather_time":0,"free_fast_addition":0,"fast_gather_price":[],"unlock_assert":955132601003,"pay_fast_addition":0,"fast_time_addition":0,"fast_gather_cost_item":0,"hook_type":[22]}`|
|5|`{"fast_gather_time":0,"free_fast_addition":0,"fast_gather_price":[],"unlock_assert":955132601003,"pay_fast_addition":0,"fast_time_addition":0,"fast_gather_cost_item":0,"hook_type":[25]}`|

## FastItem

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|sec|number|61|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_speed|number|61|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|item|array|61|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|61|本表行键；与其他表同值不自动代表同一对象。|
|label|number|61|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hook_type|number|61|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|263002|`{"max_speed":2200300,"item":[180002],"hook_type":4}`|
|264002|`{"max_speed":2200600,"item":[180002],"hook_type":4}`|
|265002|`{"max_speed":2200900,"item":[180002],"hook_type":4}`|
|266002|`{"max_speed":2201200,"item":[180002],"hook_type":4}`|
|267002|`{"max_speed":2201500,"item":[180002],"hook_type":4}`|
|268002|`{"max_speed":2201800,"item":[180002],"hook_type":4}`|
|269002|`{"max_speed":2200300,"item":[180002],"hook_type":4}`|
|270002|`{"max_speed":2200600,"item":[180002],"hook_type":4}`|
|271002|`{"max_speed":2200900,"item":[180002],"hook_type":4}`|
|272002|`{"max_speed":2201200,"item":[180002],"hook_type":4}`|
|273002|`{"max_speed":2201500,"item":[180002],"hook_type":4}`|
|274002|`{"max_speed":2201800,"item":[180002],"hook_type":4}`|
|275002|`{"max_speed":2200300,"item":[180002],"hook_type":4}`|
|276002|`{"max_speed":2200600,"item":[180002],"hook_type":4}`|
|277002|`{"max_speed":2200900,"item":[180002],"hook_type":4}`|
|278002|`{"max_speed":2201200,"item":[180002],"hook_type":4}`|
|279002|`{"max_speed":2201500,"item":[180002],"hook_type":4}`|
|280002|`{"max_speed":2201800,"item":[180002],"hook_type":4}`|
|281002|`{"max_speed":2200300,"item":[181002],"hook_type":4}`|
|282002|`{"max_speed":2200600,"item":[181002],"hook_type":4}`|
|283002|`{"max_speed":2200900,"item":[181002],"hook_type":4}`|
|284002|`{"max_speed":2201200,"item":[181002],"hook_type":4}`|
|285002|`{"max_speed":2201500,"item":[181002],"hook_type":4}`|
|286002|`{"max_speed":2201800,"item":[181002],"hook_type":4}`|
|287002|`{"max_speed":2200300,"item":[181002],"hook_type":4}`|
|288002|`{"max_speed":2200600,"item":[181002],"hook_type":4}`|
|289002|`{"max_speed":2200900,"item":[181002],"hook_type":4}`|
|290002|`{"max_speed":2201200,"item":[181002],"hook_type":4}`|
|291002|`{"max_speed":2201500,"item":[181002],"hook_type":4}`|
|292002|`{"max_speed":2201800,"item":[181002],"hook_type":4}`|
|293002|`{"max_speed":2200300,"item":[181002],"hook_type":4}`|
|294002|`{"max_speed":2200600,"item":[181002],"hook_type":4}`|
|295002|`{"max_speed":2200900,"item":[181002],"hook_type":4}`|
|296002|`{"max_speed":2201200,"item":[181002],"hook_type":4}`|
|297002|`{"max_speed":2201500,"item":[181002],"hook_type":4}`|
|298002|`{"max_speed":2201800,"item":[181002],"hook_type":4}`|
|299002|`{"max_speed":2200300,"item":[180002,181002],"hook_type":4}`|
|300002|`{"max_speed":2200600,"item":[180002,181002],"hook_type":4}`|
|301002|`{"max_speed":2200900,"item":[180002,181002],"hook_type":4}`|
|302002|`{"max_speed":2201200,"item":[180002,181002],"hook_type":4}`|
|303002|`{"max_speed":2201500,"item":[180002,181002],"hook_type":4}`|
|304002|`{"max_speed":2201800,"item":[180002,181002],"hook_type":4}`|
|305002|`{"max_speed":2200300,"item":[180002,181002],"hook_type":4}`|
|306002|`{"max_speed":2200600,"item":[180002,181002],"hook_type":4}`|
|307002|`{"max_speed":2200900,"item":[180002,181002],"hook_type":4}`|
|308002|`{"max_speed":2201200,"item":[180002,181002],"hook_type":4}`|
|309002|`{"max_speed":2201500,"item":[180002,181002],"hook_type":4}`|
|310002|`{"max_speed":2201800,"item":[180002,181002],"hook_type":4}`|
|311002|`{"max_speed":2200300,"item":[180002,181002],"hook_type":4}`|
|312002|`{"max_speed":2200600,"item":[180002,181002],"hook_type":4}`|
|313002|`{"max_speed":2200900,"item":[180002,181002],"hook_type":4}`|
|314002|`{"max_speed":2201200,"item":[180002,181002],"hook_type":4}`|
|315002|`{"max_speed":2201500,"item":[180002,181002],"hook_type":4}`|
|316002|`{"max_speed":2201800,"item":[180002,181002],"hook_type":4}`|
|317002|`{"max_speed":2200600,"item":[180002,181002],"hook_type":4}`|
|318002|`{"max_speed":2200600,"item":[180002,181002],"hook_type":4}`|
|319002|`{"max_speed":2200600,"item":[180002,181002],"hook_type":4}`|
|320002|`{"max_speed":2200600,"item":[180002,181002],"hook_type":4}`|
|321002|`{"max_speed":2200600,"item":[180002,181002],"hook_type":4}`|
|322002|`{"max_speed":2200600,"item":[180002,181002],"hook_type":4}`|
|323002|`{"max_speed":2200600,"item":[180002,181002],"hook_type":4}`|

## StyleStatus

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|status|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|3|`{}`|

## Type

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|long_random_period|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_fixed_period|number|12|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|guide|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|init_produce_time|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|open_func|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|red_dot|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|erl_module|string|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|use_hook_common_sort|boolean|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_time_addition|number|12|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|receive_tips_mission|array|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|def_mission|array|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rate_addition|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|quick_red_unlock|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|produce_addition|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|integrity_produce|boolean|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_red_time|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|short_random_period|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|flush_interval|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|12|本表行键；与其他表同值不自动代表同一对象。|
|hide_speed_ui|boolean|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fast_gather_type|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|data_class|object|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|style_status|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|produce_period|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_time|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|init_award|array|12|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|clear_cache|boolean|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10|`{"long_random_period":3600,"max_fixed_period":86400,"init_produce_time":0,"open_func":1139,"use_hook_common_sort":true,"max_time_addition":0,"rate_addition":0,"quick_red_unlock":0,"show_red_time":0,"short_random_period":60,"flush_interval":60,"fast_gather_type":2,"show_time":0,"init_award":[[157002,50],[17002,20]]}`|
|17|`{"long_random_period":3600,"max_fixed_period":86400,"init_produce_time":0,"open_func":0,"use_hook_common_sort":true,"max_time_addition":0,"rate_addition":0,"quick_red_unlock":0,"show_red_time":72000,"short_random_period":1,"flush_interval":1,"fast_gather_type":0,"show_time":0,"init_award":[]}`|
|18|`{"long_random_period":3600,"max_fixed_period":86400,"init_produce_time":0,"open_func":0,"use_hook_common_sort":true,"max_time_addition":0,"rate_addition":0,"quick_red_unlock":0,"show_red_time":72000,"short_random_period":1,"flush_interval":1,"fast_gather_type":0,"show_time":0,"init_award":[]}`|
|19|`{"long_random_period":3600,"max_fixed_period":86400,"init_produce_time":0,"open_func":0,"use_hook_common_sort":true,"max_time_addition":0,"rate_addition":0,"quick_red_unlock":0,"show_red_time":72000,"short_random_period":1,"flush_interval":1,"fast_gather_type":0,"show_time":0,"init_award":[]}`|
|20|`{"long_random_period":3600,"max_fixed_period":86400,"init_produce_time":0,"open_func":0,"use_hook_common_sort":false,"max_time_addition":0,"rate_addition":0,"quick_red_unlock":0,"show_red_time":0,"short_random_period":600,"flush_interval":600,"fast_gather_type":0,"show_time":0,"init_award":[]}`|
|22|`{"long_random_period":86400,"max_fixed_period":172800,"init_produce_time":0,"open_func":0,"use_hook_common_sort":false,"max_time_addition":0,"rate_addition":0,"quick_red_unlock":0,"show_red_time":0,"short_random_period":60,"flush_interval":60,"fast_gather_type":4,"show_time":0,"init_award":[[180002,8000],[181002,8000]]}`|
|23|`{"long_random_period":18000,"max_fixed_period":604800,"init_produce_time":0,"open_func":0,"use_hook_common_sort":true,"max_time_addition":0,"rate_addition":0,"quick_red_unlock":0,"show_red_time":0,"short_random_period":1800,"flush_interval":1800,"fast_gather_type":0,"show_time":0,"init_award":[[334002,10],[335002,10],[336002,10]]}`|
|24|`{"long_random_period":18000,"max_fixed_period":604800,"init_produce_time":0,"open_func":0,"use_hook_common_sort":true,"max_time_addition":0,"rate_addition":0,"quick_red_unlock":0,"show_red_time":0,"short_random_period":1800,"flush_interval":1800,"fast_gather_type":0,"show_time":0,"init_award":[[373002,10],[374002,10],[375002,10]]}`|
|25|`{"long_random_period":18000,"max_fixed_period":259200,"init_produce_time":0,"open_func":0,"use_hook_common_sort":true,"max_time_addition":0,"rate_addition":0,"quick_red_unlock":0,"show_red_time":0,"short_random_period":300,"flush_interval":60,"fast_gather_type":5,"show_time":0,"init_award":[[103700,8000],[203700,8000]]}`|
|26|`{"long_random_period":3600,"max_fixed_period":86400,"init_produce_time":0,"open_func":0,"use_hook_common_sort":true,"max_time_addition":0,"rate_addition":0,"quick_red_unlock":0,"show_red_time":7200,"short_random_period":60,"flush_interval":60,"fast_gather_type":0,"show_time":0,"init_award":[[721002,200],[723002,100],[729002,30]]}`|
|27|`{"long_random_period":3600,"max_fixed_period":28800,"init_produce_time":0,"open_func":0,"use_hook_common_sort":false,"max_time_addition":0,"rate_addition":0,"quick_red_unlock":0,"show_red_time":0,"short_random_period":3600,"flush_interval":3600,"fast_gather_type":0,"show_time":0,"init_award":[]}`|
|28|`{"long_random_period":3600,"max_fixed_period":36000,"init_produce_time":0,"open_func":0,"use_hook_common_sort":false,"max_time_addition":0,"rate_addition":0,"quick_red_unlock":0,"show_red_time":0,"short_random_period":3600,"flush_interval":300,"fast_gather_type":0,"show_time":0,"init_award":[]}`|

## Stage

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5593|本表行键；与其他表同值不自动代表同一对象。|
|fixed_award|array|5593|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|random_award|array|5593|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|belong_hook_type|number|5593|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部5593行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|600101|`{"fixed_award":[[201500,216000],[101800,144000]],"random_award":[],"belong_hook_type":0}`|
|600102|`{"fixed_award":[[201500,216000],[101800,144000]],"random_award":[],"belong_hook_type":0}`|
|600103|`{"fixed_award":[[201500,216000],[101800,144000]],"random_award":[],"belong_hook_type":0}`|

## RandomAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|60|本表行键；与其他表同值不自动代表同一对象。|
|random_produce|number|60|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|short_period_rate|number|60|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"random_produce":0,"short_period_rate":250}`|
|2|`{"random_produce":0,"short_period_rate":200}`|
|3|`{"random_produce":0,"short_period_rate":400}`|
|4|`{"random_produce":0,"short_period_rate":200}`|
|5|`{"random_produce":0,"short_period_rate":50}`|
|6|`{"random_produce":0,"short_period_rate":80}`|
|7|`{"random_produce":0,"short_period_rate":105}`|
|8|`{"random_produce":0,"short_period_rate":300}`|
|9|`{"random_produce":0,"short_period_rate":300}`|
|10|`{"random_produce":0,"short_period_rate":300}`|
|11|`{"random_produce":0,"short_period_rate":300}`|
|12|`{"random_produce":0,"short_period_rate":350}`|
|13|`{"random_produce":0,"short_period_rate":350}`|
|14|`{"random_produce":0,"short_period_rate":400}`|
|15|`{"random_produce":0,"short_period_rate":400}`|
|16|`{"random_produce":0,"short_period_rate":400}`|
|17|`{"random_produce":0,"short_period_rate":450}`|
|18|`{"random_produce":0,"short_period_rate":450}`|
|19|`{"random_produce":0,"short_period_rate":500}`|
|20|`{"random_produce":0,"short_period_rate":500}`|
|21|`{"random_produce":0,"short_period_rate":7}`|
|22|`{"random_produce":0,"short_period_rate":10}`|
|23|`{"random_produce":0,"short_period_rate":14}`|
|24|`{"random_produce":0,"short_period_rate":17}`|
|25|`{"random_produce":0,"short_period_rate":21}`|
|26|`{"random_produce":0,"short_period_rate":24}`|
|27|`{"random_produce":0,"short_period_rate":28}`|
|28|`{"random_produce":0,"short_period_rate":24}`|
|29|`{"random_produce":0,"short_period_rate":28}`|
|30|`{"random_produce":0,"short_period_rate":31}`|
|31|`{"random_produce":0,"short_period_rate":35}`|
|32|`{"random_produce":0,"short_period_rate":1}`|
|33|`{"random_produce":0,"short_period_rate":2}`|
|34|`{"random_produce":0,"short_period_rate":3}`|
|35|`{"random_produce":202,"short_period_rate":5}`|
|36|`{"random_produce":203,"short_period_rate":42}`|
|37|`{"random_produce":201,"short_period_rate":130}`|
|38|`{"random_produce":201,"short_period_rate":130}`|
|39|`{"random_produce":201,"short_period_rate":130}`|
|40|`{"random_produce":201,"short_period_rate":130}`|
|41|`{"random_produce":201,"short_period_rate":130}`|
|42|`{"random_produce":201,"short_period_rate":130}`|
|43|`{"random_produce":201,"short_period_rate":130}`|
|44|`{"random_produce":201,"short_period_rate":130}`|
|48|`{"random_produce":701,"short_period_rate":14}`|
|49|`{"random_produce":702,"short_period_rate":12}`|
|50|`{"random_produce":703,"short_period_rate":9}`|
|51|`{"random_produce":704,"short_period_rate":7}`|
|52|`{"random_produce":705,"short_period_rate":10000}`|
|53|`{"random_produce":706,"short_period_rate":10000}`|
|54|`{"random_produce":707,"short_period_rate":1041}`|
|55|`{"random_produce":1201,"short_period_rate":4000}`|
|61|`{"random_produce":205,"short_period_rate":50}`|
|62|`{"random_produce":205,"short_period_rate":133}`|
|63|`{"random_produce":205,"short_period_rate":200}`|
|64|`{"random_produce":205,"short_period_rate":250}`|
|71|`{"random_produce":206,"short_period_rate":33}`|
|72|`{"random_produce":206,"short_period_rate":100}`|
|73|`{"random_produce":206,"short_period_rate":133}`|
|74|`{"random_produce":206,"short_period_rate":166}`|
