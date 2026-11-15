# HeroLeaseTable 规则参数

来源：[personal-server/assets/tables/HeroLeaseTable.data.lua.json.gz](../../../../personal-server/assets/tables/HeroLeaseTable.data.lua.json.gz)，SHA256：`07aa6df9720d3659004042e7fdc7ffe0def9c7c91c6d477d936b6de2717bf21f`。

[完整逐行JSON](HeroLeaseTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[HeroLease](#herolease)|7|decoded-rows|
|[Hook](#hook)|3|decoded-rows|
|[Lineup](#lineup)|31|decoded-rows|

## HeroLease

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|7|本表行键；与其他表同值不自动代表同一对象。|
|max_lease_num|number|7|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|max_place_num|number|7|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|cache_flush_time|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|day_refresh|boolean|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lua_module|object/null|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lease_award_id|number|7|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|lease_award_num|number|7|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|lease_award_max|number|7|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"max_lease_num":3,"max_place_num":3,"cache_flush_time":60,"day_refresh":true,"lease_award_id":401900,"lease_award_num":20,"lease_award_max":10}`|
|3|`{"max_lease_num":0,"max_place_num":0,"cache_flush_time":0,"day_refresh":false,"lease_award_id":0,"lease_award_num":0,"lease_award_max":0}`|
|4|`{"max_lease_num":0,"max_place_num":0,"cache_flush_time":0,"day_refresh":false,"lease_award_id":0,"lease_award_num":0,"lease_award_max":0}`|
|5|`{"max_lease_num":0,"max_place_num":0,"cache_flush_time":0,"day_refresh":false,"lease_award_id":0,"lease_award_num":0,"lease_award_max":0}`|
|6|`{"max_lease_num":0,"max_place_num":0,"cache_flush_time":0,"day_refresh":false,"lease_award_id":0,"lease_award_num":0,"lease_award_max":0}`|
|7|`{"max_lease_num":0,"max_place_num":0,"cache_flush_time":0,"day_refresh":false,"lease_award_id":0,"lease_award_num":0,"lease_award_max":0}`|
|900008|`{"max_lease_num":0,"max_place_num":0,"cache_flush_time":0,"day_refresh":false,"lease_award_id":0,"lease_award_num":0,"lease_award_max":0}`|

## Hook

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|lease|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|index|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|17|`{}`|
|18|`{}`|
|19|`{}`|

## Lineup

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|31|本表行键；与其他表同值不自动代表同一对象。|
|use_times|number|31|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lose_use_times|boolean|31|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|use_lease|number|31|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|filter_hero|null|29|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_condition|number/null|31|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tips|number|31|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tip_params|array/object|31|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|can_remove|boolean|31|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|2|`{"use_times":1,"lose_use_times":false,"use_lease":1,"filter_hero":null,"show_condition":640609800002,"can_remove":true}`|
|26|`{"use_times":0,"lose_use_times":false,"use_lease":3,"filter_hero":null,"show_condition":null,"can_remove":true}`|
|28|`{"use_times":1,"lose_use_times":false,"use_lease":1,"filter_hero":null,"show_condition":640609800002,"can_remove":true}`|
|29|`{"use_times":1,"lose_use_times":false,"use_lease":1,"filter_hero":null,"show_condition":640609800002,"can_remove":true}`|
|42|`{"use_times":1,"lose_use_times":false,"use_lease":1,"filter_hero":null,"show_condition":null,"can_remove":true}`|
|43|`{"use_times":1,"lose_use_times":false,"use_lease":1,"filter_hero":null,"show_condition":640609800002,"can_remove":true}`|
|44|`{"use_times":0,"lose_use_times":false,"use_lease":4,"filter_hero":null,"show_condition":null,"can_remove":true}`|
|47|`{"use_times":1,"lose_use_times":false,"use_lease":1,"filter_hero":null,"show_condition":640609800002,"can_remove":true}`|
|48|`{"use_times":0,"lose_use_times":false,"use_lease":5,"show_condition":null,"can_remove":false}`|
|57|`{"use_times":0,"lose_use_times":false,"use_lease":6,"filter_hero":null,"show_condition":null,"can_remove":true}`|
|61|`{"use_times":0,"lose_use_times":false,"use_lease":6,"filter_hero":null,"show_condition":null,"can_remove":true}`|
|76|`{"use_times":1,"lose_use_times":false,"use_lease":1,"filter_hero":null,"show_condition":null,"can_remove":true}`|
|77|`{"use_times":1,"lose_use_times":false,"use_lease":1,"filter_hero":null,"show_condition":null,"can_remove":true}`|
|92|`{"use_times":1,"lose_use_times":false,"use_lease":1,"filter_hero":null,"show_condition":null,"can_remove":true}`|
|93|`{"use_times":1,"lose_use_times":false,"use_lease":1,"filter_hero":null,"show_condition":null,"can_remove":true}`|
|94|`{"use_times":1,"lose_use_times":false,"use_lease":1,"filter_hero":null,"show_condition":null,"can_remove":true}`|
|95|`{"use_times":1,"lose_use_times":false,"use_lease":1,"filter_hero":null,"show_condition":null,"can_remove":true}`|
|96|`{"use_times":1,"lose_use_times":false,"use_lease":1,"filter_hero":null,"show_condition":null,"can_remove":true}`|
|107|`{"use_times":0,"lose_use_times":false,"use_lease":7,"filter_hero":null,"show_condition":null,"can_remove":true}`|
|108|`{"use_times":0,"lose_use_times":false,"use_lease":7,"filter_hero":null,"show_condition":null,"can_remove":true}`|
|109|`{"use_times":0,"lose_use_times":false,"use_lease":7,"filter_hero":null,"show_condition":null,"can_remove":true}`|
|110|`{"use_times":0,"lose_use_times":false,"use_lease":7,"filter_hero":null,"show_condition":null,"can_remove":true}`|
|129|`{"use_times":1,"lose_use_times":false,"use_lease":1,"filter_hero":null,"show_condition":null,"can_remove":true}`|
|130|`{"use_times":1,"lose_use_times":false,"use_lease":1,"filter_hero":null,"show_condition":null,"can_remove":true}`|
|131|`{"use_times":1,"lose_use_times":false,"use_lease":1,"filter_hero":null,"show_condition":null,"can_remove":true}`|
|132|`{"use_times":1,"lose_use_times":false,"use_lease":1,"filter_hero":null,"show_condition":null,"can_remove":true}`|
|143|`{"use_times":1,"lose_use_times":false,"use_lease":1,"filter_hero":null,"show_condition":null,"can_remove":true}`|
|144|`{"use_times":1,"lose_use_times":false,"use_lease":1,"filter_hero":null,"show_condition":null,"can_remove":true}`|
|145|`{"use_times":1,"lose_use_times":false,"use_lease":1,"filter_hero":null,"show_condition":640609800002,"can_remove":true}`|
|146|`{"use_times":1,"lose_use_times":false,"use_lease":1,"filter_hero":null,"show_condition":640609800002,"can_remove":true}`|
|900001|`{"use_times":0,"lose_use_times":false,"use_lease":900008,"show_condition":null,"can_remove":false}`|
