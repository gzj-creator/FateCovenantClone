# WeekendBonusTable 规则参数

来源：[personal-server/assets/tables/WeekendBonusTable.data.lua.json.gz](../../../../personal-server/assets/tables/WeekendBonusTable.data.lua.json.gz)，SHA256：`5bb9ab53821f25706847fd174d8f5d2fedfd367b230fddede5eb18955e37b8c9`。

[完整逐行JSON](WeekendBonusTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Func](#func)|2|rows-with-external-references|
|[Shop](#shop)|4|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[WeekendBonus](#weekendbonus)|2|decoded-rows|
|[ProgressAward](#progressaward)|4|decoded-rows|

## Func

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|func_pb|string|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lua_module|object|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"func_pb":"pb_act_pin_ball_role"}`|
|2|`{"func_pb":"pb_grand_tourer"}`|

## Shop

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|shop_group|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"shop_group":5080001}`|
|2|`{"shop_group":5080002}`|
|3|`{"shop_group":5080003}`|
|4|`{"shop_group":5080004}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|racing_left_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_num|number|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|progress|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|award_item|number|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|open_day_limit|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|exchange_cost|number|1|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|open_week_day_range|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bubble_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"racing_left_time":3600,"award_num":150,"progress":[60,120],"award_item":101500,"open_day_limit":5,"exchange_cost":4001900,"open_week_day_range":[6,7]}`|

## WeekendBonus

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|add|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|simple_title|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|title_icon|string|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|2|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|title|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skip_func|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|count|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|item_sort|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|simple_icon|string|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|des|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award":[101500],"skip_func":16,"count":[388],"item_sort":1}`|
|2|`{"award":[2002],"skip_func":98,"count":[2],"item_sort":1}`|

## ProgressAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|need_progress|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|item|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|count|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"need_progress":1,"item":4001900,"count":40}`|
|2|`{"need_progress":2,"item":4001900,"count":50}`|
|3|`{"need_progress":3,"item":4001900,"count":50}`|
|4|`{"need_progress":4,"item":4001900,"count":60}`|
