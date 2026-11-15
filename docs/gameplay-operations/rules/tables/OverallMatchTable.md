# OverallMatchTable 规则参数

来源：[personal-server/assets/tables/OverallMatchTable.data.lua.json.gz](../../../../personal-server/assets/tables/OverallMatchTable.data.lua.json.gz)，SHA256：`13ef3ef6248512e09a6f0f3874d3947e09019ba716483e62ca6b52b00937ebcd`。

[完整逐行JSON](OverallMatchTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Type](#type)|1|decoded-rows|
|[Rule](#rule)|1|decoded-rows|

## Type

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|

## Rule

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|max_rank_diff|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|history_match_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|power_rate_min|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|power_rate_max|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|streak_start_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|streak_rate_step|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|online_wait_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"max_rank_diff":4,"history_match_count":10,"power_rate_min":90,"power_rate_max":120,"streak_start_count":3,"streak_rate_step":10,"online_wait_time":8,"fight":5}`|
