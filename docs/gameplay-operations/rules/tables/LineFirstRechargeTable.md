# LineFirstRechargeTable 规则参数

来源：[personal-server/assets/tables/LineFirstRechargeTable.data.json.gz](../../../../personal-server/assets/tables/LineFirstRechargeTable.data.json.gz)，SHA256：`13b0f44ffb5928931b39fcd53e0d04140dc7cdd6d7ff7e4bc5859c537aa87b79`。

[完整逐行JSON](LineFirstRechargeTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Group](#group)|4|rows-with-external-references|
|[Choose](#choose)|18|decoded-rows|
|[LineFirstRecharge](#linefirstrecharge)|18|decoded-rows|

## Group

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|anim_time|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|start_tid|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|jump_func|object|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|end_time|number|4|结束日期内秒偏移；不是单独完整时间戳。|
|start_time|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|style|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sky_prefab|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"start_tid":1,"jump_func":{"reference":"LineFirstRechargeForm.StaticOpen"},"end_time":1758488400,"start_time":0,"fight":90001}`|
|2|`{"start_tid":11,"jump_func":{"reference":"LineFirstRechargeForm.StaticOpen"},"end_time":1774817999,"start_time":1758488400,"fight":90001}`|
|3|`{"start_tid":21,"jump_func":{"reference":"LineFirstRechargeFormTuTu.StaticOpen"},"end_time":1789073999,"start_time":1774818000,"fight":90058}`|
|4|`{"start_tid":31,"jump_func":{"reference":"LineFirstRechargeFormSuSu.StaticOpen"},"end_time":0,"start_time":1789074000,"fight":90059}`|

## Choose

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|desc_text_id|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|desc|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bg|string|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_core_hero|array|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|18|本表行键；与其他表同值不自动代表同一对象。|
|belong|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|gift|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"is_core_hero":[]}`|
|1101|`{"is_core_hero":[]}`|
|1102|`{"is_core_hero":[]}`|
|1103|`{"is_core_hero":[]}`|
|1104|`{"is_core_hero":[]}`|
|2101|`{"is_core_hero":[]}`|
|2102|`{"is_core_hero":[]}`|
|2103|`{"is_core_hero":[]}`|
|3101|`{"is_core_hero":[]}`|
|3102|`{"is_core_hero":[]}`|
|3103|`{"is_core_hero":[]}`|
|3104|`{"is_core_hero":[]}`|
|3105|`{"is_core_hero":[]}`|
|3106|`{"is_core_hero":[]}`|
|3107|`{"is_core_hero":[]}`|
|3108|`{"is_core_hero":[]}`|
|3109|`{"is_core_hero":[]}`|
|3110|`{"is_core_hero":[]}`|

## LineFirstRecharge

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|entrance_name|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|entrance_prefab|string|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|18|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|entrance_icon|string|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|preview|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|duration|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|18|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award":[[2002,5],[2002,5]],"duration":0}`|
|11|`{"award":[[2002,6],[2002,8]],"duration":14}`|
|12|`{"award":[[2002,6],[2002,10]],"duration":14}`|
|13|`{"award":[[2002,10],[3002,5]],"duration":14}`|
|14|`{"award":[[3002,5],[3002,10]],"duration":14}`|
|21|`{"award":[[2002,10],[2002,10]],"duration":14}`|
|22|`{"award":[[20400504,40],[1151200,4]],"duration":14}`|
|23|`{"award":[[3051200,2],[1012002,1]],"duration":14}`|
|31|`{"award":[[2002,10],[2002,10]],"duration":28}`|
|32|`{"award":[[25400204,40],[3002,10]],"duration":28}`|
|33|`{"award":[[25400204,50],[4071200,1]],"duration":28}`|
|34|`{"award":[[25400204,70],[1151200,2]],"duration":28}`|
|35|`{"award":[[3051200,3],[1151200,2]],"duration":28}`|
|36|`{"award":[],"duration":28}`|
|37|`{"award":[],"duration":28}`|
|38|`{"award":[],"duration":28}`|
|39|`{"award":[],"duration":28}`|
|40|`{"award":[],"duration":28}`|
