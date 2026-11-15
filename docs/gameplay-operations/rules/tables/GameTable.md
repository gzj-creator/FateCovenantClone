# GameTable 规则参数

来源：[personal-server/assets/tables/GameTable.data.lua.json.gz](../../../../personal-server/assets/tables/GameTable.data.lua.json.gz)，SHA256：`fd7cb270cdff9c85142ae922342c6c2abe7b8129667bf34caf732ee64549a109`。

[完整逐行JSON](GameTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[OverseaRegion](#oversearegion)|3|decoded-rows|
|[Base](#base)|1|decoded-rows|

## OverseaRegion

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|region_tag|string|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|currency|string|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|

## Base

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|secret_id|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|app_id|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sign_to_platform|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|business_id|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|version|string|1|版本引用；必须按活动类型及其消费者查对应版本表。|
|secret_key|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"version":"v5.3"}`|
