# LeaseTable 规则参数

来源：[personal-server/assets/tables/LeaseTable.data.lua.json.gz](../../../../personal-server/assets/tables/LeaseTable.data.lua.json.gz)，SHA256：`b66237e75b7373d18d69fca041c2efee476288d9a3b42e795faf2a4fac4ada02`。

[完整逐行JSON](LeaseTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Func](#func)|1|decoded-rows|
|[Extra](#extra)|0|decoded-rows|
|[Unit](#unit)|4|decoded-rows|
|[Lineup](#lineup)|4|decoded-rows|

## Func

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|day_refresh|boolean|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"day_refresh":false}`|

## Extra

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## Unit

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|pb|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|

## Lineup

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|use_times|object|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lose_use_times|boolean|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|use_lease|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|filter_hero|null|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|can_remove|boolean|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|107|`{"use_times":{"global":"TableEmpty"},"lose_use_times":false,"use_lease":1,"filter_hero":null,"can_remove":false}`|
|108|`{"use_times":{"global":"TableEmpty"},"lose_use_times":false,"use_lease":1,"filter_hero":null,"can_remove":false}`|
|109|`{"use_times":{"global":"TableEmpty"},"lose_use_times":false,"use_lease":1,"filter_hero":null,"can_remove":false}`|
|110|`{"use_times":{"global":"TableEmpty"},"lose_use_times":false,"use_lease":1,"filter_hero":null,"can_remove":false}`|
