# JourneyFightTable 规则参数

来源：[personal-server/assets/tables/JourneyFightTable.data.json.gz](../../../../personal-server/assets/tables/JourneyFightTable.data.json.gz)，SHA256：`f57f8faf8611dd3ee14341c96e6e33cc4b2783d05e0ba4fdbab3a24adc5b6038`。

[完整逐行JSON](JourneyFightTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Fight](#fight)|3566|decoded-rows|
|[Team](#team)|10744|decoded-rows|
|[Fighter](#fighter)|4518|decoded-rows|
|[AttrAbility](#attrability)|1099|decoded-rows|

## Fight

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|skip_result|boolean|3566|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skip_all_battle|boolean|3566|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|form|number|3566|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|3566|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skip|number|3566|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|3566|本表行键；与其他表同值不自动代表同一对象。|
|def_loc_sign|boolean|3566|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|atk_team_lv|array|3566|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|def_team|array|3566|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_skip_all_btn|boolean|3566|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lineup_rule|array|3566|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|atk_team|array|3566|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|mask_def_power|boolean|3566|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skip_lineup|boolean|3566|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|exit|boolean|3566|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|result_rule|number|3566|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|disable_one_key_lineup|boolean|3566|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|scene|number|3566|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lineup|number|3566|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|def_team_lv|array|3566|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部3566行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"type":1,"def_loc_sign":true,"atk_team_lv":[],"mask_def_power":true,"def_team_lv":[]}`|
|2|`{"type":1,"def_loc_sign":true,"atk_team_lv":[],"mask_def_power":true,"def_team_lv":[]}`|
|3|`{"type":1,"def_loc_sign":true,"atk_team_lv":[],"mask_def_power":true,"def_team_lv":[]}`|

## Team

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|10744|本表行键；与其他表同值不自动代表同一对象。|
|loc|array|10744|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|team_lv|number|10744|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|npc|array|10744|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部10744行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"loc":[2,5],"team_lv":15,"npc":[9002800,3020200]}`|
|2|`{"loc":[2,4,6],"team_lv":15,"npc":[3030200,9003000,9003000]}`|
|3|`{"loc":[1,2,3,4,5,6],"team_lv":15,"npc":[9002900,9002900,9002900,9002900,2030400,9002900]}`|

## Fighter

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|view_custom|number|4518|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|4518|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4518|本表行键；与其他表同值不自动代表同一对象。|
|is_boss|boolean|4518|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|power|number|4518|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|add_ab|array|4518|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部4518行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|2|`{"type":0,"is_boss":false,"power":0}`|
|3|`{"type":0,"is_boss":false,"power":0}`|
|4|`{"type":0,"is_boss":false,"power":0}`|

## AttrAbility

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1099|本表行键；与其他表同值不自动代表同一对象。|
|attr_type|array|1099|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr_value|array|1099|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部1099行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|39001101|`{"attr_type":[89],"attr_value":[500]}`|
|39001201|`{"attr_type":[89],"attr_value":[800]}`|
|39001301|`{"attr_type":[89],"attr_value":[1500]}`|
