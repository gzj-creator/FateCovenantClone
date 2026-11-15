# PreheatActTable 规则参数

来源：[personal-server/assets/tables/PreheatActTable.data.lua.json.gz](../../../../personal-server/assets/tables/PreheatActTable.data.lua.json.gz)，SHA256：`fa553e062bf56ebcaaedb0e8c40aca465380bb057a8df1cdde5672c30be8c51f`。

[完整逐行JSON](PreheatActTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Award](#award)|10|decoded-rows|
|[DailyAward](#dailyaward)|4|decoded-rows|
|[PreheatAct](#preheatact)|4|rows-with-external-references|

## Award

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|10|本表行键；与其他表同值不自动代表同一对象。|
|effect|string|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|10|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|icon|string|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|available_sec|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|version|number|10|版本引用；必须按活动类型及其消费者查对应版本表。|
|server_range|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001101|`{"award":[[101500,666]],"version":1}`|
|1001102|`{"award":[[206308,1],[7401900,300]],"version":1}`|
|2001101|`{"award":[[101500,200]],"version":2}`|
|2001102|`{"award":[[101500,666]],"version":2}`|
|2001103|`{"award":[[206508,1]],"version":2}`|
|3001101|`{"award":[[101500,200]],"version":3}`|
|3001102|`{"award":[[101500,666]],"version":3}`|
|3001103|`{"award":[[206508,1]],"version":3}`|
|5001101|`{"award":[[101500,666]],"version":5}`|
|5001102|`{"award":[[209208,1],[7401900,300]],"version":5}`|

## DailyAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|daily_award|array|4|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"daily_award":[[638002,1]]}`|
|2|`{"daily_award":[[643002,1]]}`|
|3|`{"daily_award":[[643002,1]]}`|
|5|`{"daily_award":[[806002,1]]}`|

## PreheatAct

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|jump_func|object/undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cost_num|number|4|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|cost_tid|number|4|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|award|array|4|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|divide_sec|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|popup_func|object/undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|danmaku_id|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_red|number|4|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|max_draw_cnt|number|4|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|preheat_red|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"jump_func":{"reference":"PreheatActForm.StaticOpen"},"cost_num":1,"cost_tid":638002,"award":[[2981200,1]],"popup_func":{"reference":"PreheatActPopupForm.StaticOpen"},"award_red":174158680535,"max_draw_cnt":999}`|
|2|`{"cost_num":1,"cost_tid":643002,"award":[[101500,20]],"award_red":174254550418,"max_draw_cnt":999}`|
|3|`{"cost_num":1,"cost_tid":643002,"award":[[101500,20]],"award_red":174254550418,"max_draw_cnt":999}`|
|5|`{"jump_func":{"reference":"PreheatActYearForm.StaticOpen"},"cost_num":1,"cost_tid":806002,"award":[[101500,20]],"popup_func":{"reference":"PreheatActYearPopupForm.StaticOpen"},"award_red":175575452635,"max_draw_cnt":999}`|
