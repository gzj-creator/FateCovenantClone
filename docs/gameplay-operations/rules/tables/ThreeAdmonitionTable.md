# ThreeAdmonitionTable 规则参数

来源：[personal-server/assets/tables/ThreeAdmonitionTable.data.lua.json.gz](../../../../personal-server/assets/tables/ThreeAdmonitionTable.data.lua.json.gz)，SHA256：`58ec12b02f84c512351dbd12920dc74283cdd61387a661761aa49dfd43de966e`。

[完整逐行JSON](ThreeAdmonitionTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[BoxAward](#boxaward)|9|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[DrawAward](#drawaward)|16|decoded-rows|
|[TalkContent](#talkcontent)|47|decoded-rows|
|[TalkCondition](#talkcondition)|21|decoded-rows|
|[StateImage](#stateimage)|9|decoded-rows|
|[Answer](#answer)|3|decoded-rows|

## BoxAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|9|本表行键；与其他表同值不自动代表同一对象。|
|finish_index_list|array|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|9|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"award":[[24400704,10]]}`|
|102|`{"award":[[3301900,500]]}`|
|103|`{"award":[[24300604,10]]}`|
|104|`{"award":[[101500,500]]}`|
|105|`{"award":[[24400704,10]]}`|
|106|`{"award":[[3301900,500]]}`|
|107|`{"award":[[101500,300]]}`|
|108|`{"award":[[24300604,10]]}`|
|109|`{"award":[[1041200,1]]}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|cost_item|number|1|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|draw_cost_item_num|number|1|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|first_answer|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|big_box_award_index|number|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|max_draw_count|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|award_draw_item_rate|number|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|draw_cost_item|number|1|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|cost_item_num|number|1|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"cost_item":3401900,"draw_cost_item_num":1,"first_answer":1,"big_box_award_index":9,"max_draw_count":16,"award_draw_item_rate":5,"draw_cost_item":3701900,"cost_item_num":15}`|

## DrawAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|16|本表行键；与其他表同值不自动代表同一对象。|
|award|array|16|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"award":[[24300604,5]]}`|
|102|`{"award":[[24400704,5]]}`|
|103|`{"award":[[146002,1]]}`|
|104|`{"award":[[146002,1]]}`|
|105|`{"award":[[3301900,200]]}`|
|106|`{"award":[[146002,1]]}`|
|107|`{"award":[[3301900,200]]}`|
|108|`{"award":[[146002,1]]}`|
|109|`{"award":[[3301900,200]]}`|
|110|`{"award":[[101500,100]]}`|
|111|`{"award":[[3301900,200]]}`|
|112|`{"award":[[101500,100]]}`|
|113|`{"award":[[24300604,5]]}`|
|114|`{"award":[[24400704,5]]}`|
|115|`{"award":[[146002,1]]}`|
|116|`{"award":[[146002,1]]}`|

## TalkContent

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|47|本表行键；与其他表同值不自动代表同一对象。|
|talk_time|number|47|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|next|number|47|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|image_state|number|47|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bubble_content|number|47|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bubble_type|number|47|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"talk_time":0.5,"next":2}`|
|2|`{"talk_time":0.5,"next":3}`|
|3|`{"talk_time":0.5,"next":4}`|
|4|`{"talk_time":0.5,"next":5}`|
|5|`{"talk_time":0.5,"next":6}`|
|6|`{"talk_time":0.5,"next":7}`|
|7|`{"talk_time":0.5,"next":8}`|
|8|`{"talk_time":0.5,"next":9}`|
|9|`{"talk_time":0.5,"next":10}`|
|10|`{"talk_time":0.5,"next":11}`|
|11|`{"talk_time":0.5,"next":12}`|
|12|`{"talk_time":0.5,"next":13}`|
|13|`{"talk_time":0.5,"next":14}`|
|14|`{"talk_time":0.5,"next":15}`|
|15|`{"talk_time":0.5,"next":16}`|
|16|`{"talk_time":0.8,"next":0}`|
|17|`{"talk_time":0.8,"next":0}`|
|18|`{"talk_time":0.8,"next":0}`|
|19|`{"talk_time":0.8,"next":0}`|
|20|`{"talk_time":0.3,"next":21}`|
|21|`{"talk_time":0.3,"next":0}`|
|22|`{"talk_time":0.8,"next":0}`|
|23|`{"talk_time":1,"next":0}`|
|24|`{"talk_time":0.6,"next":0}`|
|25|`{"talk_time":0.7,"next":0}`|
|26|`{"talk_time":0.7,"next":27}`|
|27|`{"talk_time":0.3,"next":0}`|
|28|`{"talk_time":1,"next":29}`|
|29|`{"talk_time":1,"next":0}`|
|30|`{"talk_time":0.6,"next":0}`|
|31|`{"talk_time":0.8,"next":0}`|
|32|`{"talk_time":0.8,"next":0}`|
|33|`{"talk_time":0.7,"next":0}`|
|34|`{"talk_time":0.8,"next":0}`|
|35|`{"talk_time":0.8,"next":0}`|
|36|`{"talk_time":0.6,"next":37}`|
|37|`{"talk_time":0.7,"next":0}`|
|38|`{"talk_time":0.8,"next":0}`|
|39|`{"talk_time":0.8,"next":0}`|
|40|`{"talk_time":0.8,"next":0}`|
|41|`{"talk_time":0.8,"next":0}`|
|42|`{"talk_time":0.8,"next":0}`|
|43|`{"talk_time":0.8,"next":44}`|
|44|`{"talk_time":0.8,"next":45}`|
|45|`{"talk_time":0.8,"next":46}`|
|46|`{"talk_time":0.8,"next":47}`|
|47|`{"talk_time":0.8,"next":0}`|

## TalkCondition

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|first_talk_content|number|21|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|total_win_count|number|21|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|mora_answer|number|21|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|21|本表行键；与其他表同值不自动代表同一对象。|
|talk_state|number|21|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"first_talk_content":25,"total_win_count":0,"talk_state":0}`|
|2|`{"first_talk_content":26,"total_win_count":0,"talk_state":1}`|
|3|`{"first_talk_content":28,"total_win_count":0,"talk_state":2}`|
|4|`{"first_talk_content":33,"total_win_count":1,"talk_state":0}`|
|5|`{"first_talk_content":34,"total_win_count":1,"talk_state":1}`|
|6|`{"first_talk_content":36,"total_win_count":1,"talk_state":2}`|
|7|`{"first_talk_content":30,"total_win_count":1,"talk_state":0}`|
|8|`{"first_talk_content":31,"total_win_count":1,"talk_state":1}`|
|9|`{"first_talk_content":32,"total_win_count":1,"talk_state":2}`|
|10|`{"first_talk_content":25,"total_win_count":1,"talk_state":0}`|
|11|`{"first_talk_content":26,"total_win_count":1,"talk_state":1}`|
|12|`{"first_talk_content":28,"total_win_count":1,"talk_state":2}`|
|13|`{"first_talk_content":33,"total_win_count":2,"talk_state":0}`|
|14|`{"first_talk_content":34,"total_win_count":2,"talk_state":1}`|
|15|`{"first_talk_content":36,"total_win_count":2,"talk_state":2}`|
|16|`{"first_talk_content":30,"total_win_count":2,"talk_state":0}`|
|17|`{"first_talk_content":31,"total_win_count":2,"talk_state":1}`|
|18|`{"first_talk_content":32,"total_win_count":2,"talk_state":2}`|
|19|`{"first_talk_content":25,"total_win_count":2,"talk_state":0}`|
|20|`{"first_talk_content":26,"total_win_count":2,"talk_state":1}`|
|21|`{"first_talk_content":28,"total_win_count":2,"talk_state":2}`|

## StateImage

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|role_name|number|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|image_right|string|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|9|本表行键；与其他表同值不自动代表同一对象。|
|image_left|string|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|talk_role|number|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

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

## Answer

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|target_answer|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"target_answer":3}`|
|2|`{"target_answer":1}`|
|3|`{"target_answer":2}`|
