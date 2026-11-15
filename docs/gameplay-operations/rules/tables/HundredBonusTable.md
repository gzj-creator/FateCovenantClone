# HundredBonusTable 规则参数

来源：[personal-server/assets/tables/HundredBonusTable.data.lua.json.gz](../../../../personal-server/assets/tables/HundredBonusTable.data.lua.json.gz)，SHA256：`bea6d3bceb0b6b7336e49d4117596b53d235dc5a9d7b63d7111885784fda8e98`。

[完整逐行JSON](HundredBonusTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Const](#const)|1|decoded-rows|
|[Robot](#robot)|2|decoded-rows|
|[HundredBonus](#hundredbonus)|2|decoded-rows|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|jump|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_mission|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|seq_cd|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|robot_num|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|role_num|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"robot_num":15,"role_num":15}`|

## Robot

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|money|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"money":[2368,2468,2588,1998,1888,3288,3688,5888]}`|
|2|`{"money":[5688,5689,5586,6288,6888,5546,5266,5869]}`|

## HundredBonus

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|limit_num|number|2|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|free_num|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|base_value|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|need_amount_list|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bonus|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"limit_num":3,"free_num":2,"base_value":6,"need_amount_list":[0]}`|
|2|`{"limit_num":3,"free_num":1,"base_value":10,"need_amount_list":[3000,6800]}`|
