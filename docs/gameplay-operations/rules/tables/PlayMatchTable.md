# PlayMatchTable 规则参数

来源：[personal-server/assets/tables/PlayMatchTable.data.lua.json.gz](../../../../personal-server/assets/tables/PlayMatchTable.data.lua.json.gz)，SHA256：`ee902fb6a6e8d3a7660ec0f49ee8dc6c79e0687dd1f3e341d4a6731c381438ca`。

[完整逐行JSON](PlayMatchTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Robot](#robot)|3|decoded-rows|
|[Play](#play)|1|decoded-rows|
|[PlayStateLib](#playstatelib)|1|decoded-rows|
|[PlayStateType](#playstatetype)|4|decoded-rows|

## Robot

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|match_type|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rand_power|array|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rand_head_list|array|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"match_type":1,"rand_power":[1000,3000]}`|
|2|`{"match_type":1,"rand_power":[1000,3000]}`|
|3|`{"match_type":1,"rand_power":[1000,3000]}`|

## Play

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|match_type|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|module|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|module_c|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|data|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|state_lib|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"match_type":1,"state_lib":1}`|

## PlayStateLib

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|state_list|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"state_list":[1,2,3,2,3,2,3,2,3,2,3,4]}`|

## PlayStateType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|keep_time|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|start_fun|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|start_fun_c|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"keep_time":3,"start_fun":"ready_handler","start_fun_c":""}`|
|2|`{"keep_time":10,"start_fun":"round_start_handler","start_fun_c":""}`|
|3|`{"keep_time":1,"start_fun":"round_end_handler","start_fun_c":""}`|
|4|`{"keep_time":2,"start_fun":"end_handler","start_fun_c":""}`|
