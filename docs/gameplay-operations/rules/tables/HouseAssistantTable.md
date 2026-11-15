# HouseAssistantTable 规则参数

来源：[personal-server/assets/tables/HouseAssistantTable.data.lua.json.gz](../../../../personal-server/assets/tables/HouseAssistantTable.data.lua.json.gz)，SHA256：`1aa0b5c748b50d49131f4fbd7c5b002f42797619ceca01fd0ee6d72e4b0ad60b`。

[完整逐行JSON](HouseAssistantTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Scene](#scene)|2|decoded-rows|
|[Trial](#trial)|4|decoded-rows|

## Scene

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|

## Trial

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|duration|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|act_tid|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|id|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10163200|`{"duration":259200}`|
|10163200|`{"duration":259200}`|
|20133200|`{"duration":259200}`|
|20133200|`{"duration":259200}`|
