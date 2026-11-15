# BattleTriMatchLineupTable 规则参数

来源：[personal-server/assets/tables/BattleTriMatchLineupTable.data.lua.json.gz](../../../../personal-server/assets/tables/BattleTriMatchLineupTable.data.lua.json.gz)，SHA256：`2f316adb59fdb4ca48cc9d7117ad0041856d13ad898ef8163c74403a9f639204`。

[完整逐行JSON](BattleTriMatchLineupTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Const](#const)|1|decoded-rows|
|[Suggest](#suggest)|4|decoded-rows|
|[Type](#type)|3|decoded-rows|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|max_preset|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|preset_min_length|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|preset_max_length|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"max_preset":20,"preset_min_length":1,"preset_max_length":6}`|

## Suggest

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|suggest_hero|array|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_condition|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|title|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|des|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sort|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"suggest_hero":[10014600,10024600,10034600,10134600],"show_condition":148081100001}`|
|2|`{"suggest_hero":[10044600,10054600,10064600,10134600],"show_condition":148081100001}`|
|3|`{"suggest_hero":[10074600,10084600,10094600,10134600],"show_condition":148081100001}`|
|4|`{"suggest_hero":[10104600,10114600,10124600,10134600],"show_condition":148081100001}`|

## Type

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
