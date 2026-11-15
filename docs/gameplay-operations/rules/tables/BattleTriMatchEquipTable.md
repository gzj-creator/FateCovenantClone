# BattleTriMatchEquipTable 规则参数

来源：[personal-server/assets/tables/BattleTriMatchEquipTable.data.lua.json.gz](../../../../personal-server/assets/tables/BattleTriMatchEquipTable.data.lua.json.gz)，SHA256：`8db0f559c4ccb48785fc2f6d2e57c5f73e8222e8cf4a635e894516af4efda4db`。

[完整逐行JSON](BattleTriMatchEquipTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[UpLevel](#uplevel)|2200|decoded-rows|
|[Quality](#quality)|7|decoded-rows|
|[Type](#type)|4|decoded-rows|

## UpLevel

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2200|本表行键；与其他表同值不自动代表同一对象。|
|show_name|number|2200|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|equip_type|number|2200|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|level|number|2200|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|quality|number|2200|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|stage|number|2200|ActFrame阶段引用数组；不同于旧Activity.state。|
|is_break|boolean|2200|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|star_type|number|2200|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|icon|string|2200|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cost_item|array|2200|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|attr|array|2200|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部2200行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{"equip_type":1,"level":1,"quality":10,"stage":0,"is_break":false,"star_type":0,"cost_item":[[835602,5]],"attr":[[2,15],[1,60]]}`|
|1002|`{"equip_type":1,"level":2,"quality":10,"stage":0,"is_break":false,"star_type":0,"cost_item":[[835602,10]],"attr":[[2,17],[1,68]]}`|
|1003|`{"equip_type":1,"level":3,"quality":10,"stage":0,"is_break":false,"star_type":0,"cost_item":[[835602,20]],"attr":[[2,19],[1,76]]}`|

## Quality

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|7|本表行键；与其他表同值不自动代表同一对象。|
|node_bg|string|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|effect|string|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10|`{}`|
|20|`{}`|
|30|`{}`|
|40|`{}`|
|50|`{}`|
|60|`{}`|
|70|`{}`|

## Type

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|show_name|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|def_icon|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
