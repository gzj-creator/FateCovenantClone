# HeroBlazonDrawTable 规则参数

来源：[personal-server/assets/tables/HeroBlazonDrawTable.data.lua.json.gz](../../../../personal-server/assets/tables/HeroBlazonDrawTable.data.lua.json.gz)，SHA256：`093e8dc7710854d64a31907c8dded7377cec924a5886b61fb5d65c6347e65be2`。

[完整逐行JSON](HeroBlazonDrawTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Const](#const)|1|decoded-rows|
|[HeroBlazonDraw](#heroblazondraw)|4|decoded-rows|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|one_draw|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|red_dot_show_num|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|many_draw|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"one_draw":1,"red_dot_show_num":10,"many_draw":5}`|

## HeroBlazonDraw

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|draw_lib|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|can_more_draw|boolean|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|replace_consume_list|array|4|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|box_name|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|mark_key|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|positive_guarantee|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|big_imgIcon|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|probability_detail|number|4|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|
|consume_list|array|4|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|max_daily_draw|number|4|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|order|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|probability_type|number|4|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|
|imgIcon|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|max_daily_replace|number|4|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|replace_way|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|counter_guarantee|array|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|unlock_many_draw_num|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"draw_lib":3201,"can_more_draw":true,"replace_consume_list":[],"probability_detail":11711,"consume_list":[[395002,1]],"max_daily_draw":1000,"probability_type":11701,"max_daily_replace":0,"counter_guarantee":[20,3],"unlock_many_draw_num":25}`|
|2|`{"draw_lib":3202,"can_more_draw":true,"replace_consume_list":[],"probability_detail":11712,"consume_list":[[396002,1]],"max_daily_draw":1000,"probability_type":11702,"max_daily_replace":0,"counter_guarantee":[10,2],"unlock_many_draw_num":25}`|
|3|`{"draw_lib":3203,"can_more_draw":true,"replace_consume_list":[],"probability_detail":11713,"consume_list":[[397002,1]],"max_daily_draw":1000,"probability_type":11703,"max_daily_replace":0,"counter_guarantee":[10,2],"unlock_many_draw_num":25}`|
|4|`{"draw_lib":3204,"can_more_draw":false,"replace_consume_list":[],"probability_detail":11714,"consume_list":[[398002,1]],"max_daily_draw":1000,"probability_type":11704,"max_daily_replace":0,"counter_guarantee":[10,5],"unlock_many_draw_num":25}`|
