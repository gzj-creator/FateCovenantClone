# RedCliffTable 规则参数

来源：[personal-server/assets/tables/RedCliffTable.data.lua.json.gz](../../../../personal-server/assets/tables/RedCliffTable.data.lua.json.gz)，SHA256：`a2e977215be528114ac4a23e231040352cc5963f4db40f4a09e2ff9cda880ab7`。

[完整逐行JSON](RedCliffTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Buff](#buff)|3|decoded-rows|
|[SkillDes](#skilldes)|0|decoded-rows|
|[BuffType](#bufftype)|2|decoded-rows|
|[Event](#event)|4|decoded-rows|
|[Level](#level)|36|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[StarAward](#staraward)|4|decoded-rows|

## Buff

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|skill|object|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|weight|object|3|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|
|pos|object|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"skill":{"global":"TableEmpty"},"weight":{"global":"TableEmpty"}}`|
|2|`{"skill":{"global":"TableEmpty"},"weight":{"global":"TableEmpty"}}`|
|3|`{"skill":{"global":"TableEmpty"},"weight":{"global":"TableEmpty"}}`|

## SkillDes

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## BuffType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|

## Event

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|

## Level

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|36|本表行键；与其他表同值不自动代表同一对象。|
|first_fight_id|number|36|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|power_min|number|36|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|power_max|number|36|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|res_list|array|36|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|mystery_box|object/array|36|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|buff_lib|object/array|36|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"first_fight_id":8000001,"power_min":4500,"power_max":5500,"buff_lib":{"global":"TableEmpty"}}`|
|102|`{"first_fight_id":8000002,"power_min":4500,"power_max":5500,"buff_lib":{"global":"TableEmpty"}}`|
|103|`{"first_fight_id":8000003,"power_min":5000,"power_max":6000,"buff_lib":[1,2,3]}`|
|104|`{"first_fight_id":8000004,"power_min":5000,"power_max":6000,"buff_lib":{"global":"TableEmpty"}}`|
|105|`{"first_fight_id":8000005,"power_min":6000,"power_max":6500,"buff_lib":{"global":"TableEmpty"}}`|
|106|`{"first_fight_id":8000006,"power_min":6000,"power_max":6500,"buff_lib":[1,2,3]}`|
|107|`{"first_fight_id":8000007,"power_min":6500,"power_max":7000,"buff_lib":{"global":"TableEmpty"}}`|
|108|`{"first_fight_id":8000008,"power_min":6500,"power_max":7000,"buff_lib":{"global":"TableEmpty"}}`|
|109|`{"first_fight_id":8000009,"power_min":7000,"power_max":7500,"buff_lib":[1,2,3]}`|
|110|`{"first_fight_id":8000010,"power_min":7500,"power_max":8000,"buff_lib":{"global":"TableEmpty"}}`|
|111|`{"first_fight_id":8000011,"power_min":8500,"power_max":9000,"buff_lib":[1,2,3]}`|
|112|`{"first_fight_id":8000012,"power_min":8500,"power_max":9000,"buff_lib":{"global":"TableEmpty"}}`|
|201|`{"first_fight_id":8000101,"power_min":5500,"power_max":6500,"buff_lib":{"global":"TableEmpty"}}`|
|202|`{"first_fight_id":8000102,"power_min":5500,"power_max":6500,"buff_lib":{"global":"TableEmpty"}}`|
|203|`{"first_fight_id":8000103,"power_min":6000,"power_max":7000,"buff_lib":[1,2,3]}`|
|204|`{"first_fight_id":8000104,"power_min":6000,"power_max":7000,"buff_lib":{"global":"TableEmpty"}}`|
|205|`{"first_fight_id":8000105,"power_min":7000,"power_max":8000,"buff_lib":{"global":"TableEmpty"}}`|
|206|`{"first_fight_id":8000106,"power_min":7000,"power_max":8000,"buff_lib":[1,2,3]}`|
|207|`{"first_fight_id":8000107,"power_min":7500,"power_max":8500,"buff_lib":{"global":"TableEmpty"}}`|
|208|`{"first_fight_id":8000108,"power_min":8000,"power_max":9000,"buff_lib":{"global":"TableEmpty"}}`|
|209|`{"first_fight_id":8000109,"power_min":8000,"power_max":9000,"buff_lib":[1,2,3]}`|
|210|`{"first_fight_id":8000110,"power_min":8000,"power_max":9000,"buff_lib":{"global":"TableEmpty"}}`|
|211|`{"first_fight_id":8000111,"power_min":9000,"power_max":10000,"buff_lib":[1,2,3]}`|
|212|`{"first_fight_id":8000112,"power_min":9000,"power_max":10000,"buff_lib":{"global":"TableEmpty"}}`|
|301|`{"first_fight_id":8000201,"power_min":7000,"power_max":8000,"buff_lib":{"global":"TableEmpty"}}`|
|302|`{"first_fight_id":8000202,"power_min":7000,"power_max":8000,"buff_lib":{"global":"TableEmpty"}}`|
|303|`{"first_fight_id":8000203,"power_min":7000,"power_max":8500,"buff_lib":[1,2,3]}`|
|304|`{"first_fight_id":8000204,"power_min":7000,"power_max":8500,"buff_lib":{"global":"TableEmpty"}}`|
|305|`{"first_fight_id":8000205,"power_min":8000,"power_max":9000,"buff_lib":{"global":"TableEmpty"}}`|
|306|`{"first_fight_id":8000206,"power_min":8000,"power_max":9000,"buff_lib":[1,2,3]}`|
|307|`{"first_fight_id":8000207,"power_min":8500,"power_max":9500,"buff_lib":{"global":"TableEmpty"}}`|
|308|`{"first_fight_id":8000208,"power_min":9000,"power_max":10000,"buff_lib":{"global":"TableEmpty"}}`|
|309|`{"first_fight_id":8000209,"power_min":9000,"power_max":10000,"buff_lib":[1,2,3]}`|
|310|`{"first_fight_id":8000210,"power_min":9000,"power_max":10000,"buff_lib":{"global":"TableEmpty"}}`|
|311|`{"first_fight_id":8000211,"power_min":10000,"power_max":11000,"buff_lib":[1,2,3]}`|
|312|`{"first_fight_id":8000212,"power_min":10000,"power_max":11000,"buff_lib":{"global":"TableEmpty"}}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|refresh_fight|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|star_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"refresh_fight":3,"star_count":3}`|

## StarAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|phase_star|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|res_list|array|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"phase_star":9}`|
|2|`{"phase_star":18}`|
|3|`{"phase_star":27}`|
|4|`{"phase_star":36}`|
