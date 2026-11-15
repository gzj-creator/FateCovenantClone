# ThousandDrawTable 规则参数

来源：[personal-server/assets/tables/ThousandDrawTable.data.lua.json.gz](../../../../personal-server/assets/tables/ThousandDrawTable.data.lua.json.gz)，SHA256：`bffbaca106daf54ac2be8d53b60b7e4d36b1c5b1814d591831ce0fdaa031f776`。

[完整逐行JSON](ThousandDrawTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Item](#item)|46|decoded-rows|
|[Group](#group)|21|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[thousandDraw](#thousanddraw)|100|decoded-rows|

## Item

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|46|本表行键；与其他表同值不自动代表同一对象。|
|res|number|46|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|weight|number|46|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|
|num|number|46|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{"weight":10000,"num":1}`|
|1002|`{"weight":10000,"num":1}`|
|1003|`{"weight":10000,"num":1}`|
|1004|`{"weight":10000,"num":1}`|
|1005|`{"weight":10000,"num":1}`|
|1006|`{"weight":10000,"num":1}`|
|1007|`{"weight":10000,"num":1}`|
|1008|`{"weight":10000,"num":1}`|
|1009|`{"weight":10000,"num":1}`|
|1010|`{"weight":10000,"num":1}`|
|1011|`{"weight":10000,"num":1}`|
|1012|`{"weight":10000,"num":1}`|
|1013|`{"weight":10000,"num":1}`|
|1014|`{"weight":10000,"num":1}`|
|1015|`{"weight":10000,"num":1}`|
|1016|`{"weight":10000,"num":1}`|
|1101|`{"weight":2000,"num":1}`|
|1102|`{"weight":2000,"num":1}`|
|1103|`{"weight":2000,"num":1}`|
|1104|`{"weight":2000,"num":1}`|
|1105|`{"weight":2000,"num":1}`|
|1106|`{"weight":2000,"num":1}`|
|1107|`{"weight":2000,"num":1}`|
|1108|`{"weight":2000,"num":1}`|
|1109|`{"weight":2000,"num":1}`|
|1110|`{"weight":2000,"num":1}`|
|1111|`{"weight":2000,"num":1}`|
|1112|`{"weight":2000,"num":1}`|
|1113|`{"weight":2000,"num":1}`|
|1114|`{"weight":2000,"num":1}`|
|1115|`{"weight":2000,"num":1}`|
|1116|`{"weight":2000,"num":1}`|
|1117|`{"weight":2000,"num":1}`|
|1118|`{"weight":2000,"num":1}`|
|1119|`{"weight":2000,"num":1}`|
|1120|`{"weight":2000,"num":1}`|
|1201|`{"weight":1000,"num":1}`|
|1202|`{"weight":1000,"num":1}`|
|1203|`{"weight":1000,"num":1}`|
|1204|`{"weight":1000,"num":1}`|
|1205|`{"weight":1000,"num":1}`|
|1206|`{"weight":1000,"num":1}`|
|1207|`{"weight":1000,"num":1}`|
|1208|`{"weight":1000,"num":1}`|
|1209|`{"weight":1000,"num":1}`|
|1210|`{"weight":1000,"num":1}`|

## Group

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|21|本表行键；与其他表同值不自动代表同一对象。|
|lib_range|array|21|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"lib_range":[[10000,1030401,1]]}`|
|2|`{"lib_range":[[10000,1030501,1]]}`|
|3|`{"lib_range":[[10000,1030201,1]]}`|
|4|`{"lib_range":[[10000,1030101,1]]}`|
|5|`{"lib_range":[[10000,2030101,1]]}`|
|6|`{"lib_range":[[10000,2030201,1]]}`|
|7|`{"lib_range":[[10000,2030401,1]]}`|
|8|`{"lib_range":[[10000,2030301,1]]}`|
|9|`{"lib_range":[[10000,3030301,1]]}`|
|10|`{"lib_range":[[10000,3030201,1]]}`|
|11|`{"lib_range":[[10000,3030401,1]]}`|
|12|`{"lib_range":[[10000,3030601,1]]}`|
|13|`{"lib_range":[[10000,4030201,1]]}`|
|14|`{"lib_range":[[10000,4030401,1]]}`|
|15|`{"lib_range":[[10000,4030301,1]]}`|
|16|`{"lib_range":[[10000,4030501,1]]}`|
|17|`{"lib_range":[[2000,1020101,1],[2000,1020201,1],[2000,1020301,1],[2000,1020401,1],[2000,1020501,1]]}`|
|18|`{"lib_range":[[2000,2020101,1],[2000,2020201,1],[2000,2020301,1],[2000,2020401,1],[2000,2020501,1]]}`|
|19|`{"lib_range":[[2000,3020101,1],[2000,3020201,1],[2000,3020301,1],[2000,3020401,1],[2000,3020501,1]]}`|
|20|`{"lib_range":[[2000,4020101,1],[2000,4020201,1],[2000,4020301,1],[2000,4020401,1],[2000,4020501,1]]}`|
|21|`{"lib_range":[[1000,1010101,1],[1000,1010201,1],[1000,2010101,1],[1000,2010201,1],[1000,3010101,1],[1000,3010201,1],[1000,3010301,1],[1000,4010101,1],[1000,4010201,1],[1000,4010301,1]]}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|max_round|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|recommend|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"max_round":25}`|

## thousandDraw

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|two_random_min_times|number|100|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|one_random_min_times|number|100|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|total_times|number|100|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|two_draw_lib|number|100|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|100|本表行键；与其他表同值不自动代表同一对象。|
|one_draw_lib|number|100|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|one_random_max_times|number|100|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|three_draw_lib|number|100|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tower_layer|number|100|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|two_random_max_times|number|100|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":17,"one_draw_lib":1,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|1002|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":17,"one_draw_lib":3,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":2}`|
|1003|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":17,"one_draw_lib":2,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|1004|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":17,"one_draw_lib":1,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|1005|`{"two_random_min_times":2,"one_random_min_times":1,"total_times":10,"two_draw_lib":17,"one_draw_lib":3,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":3}`|
|1006|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":17,"one_draw_lib":4,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|1007|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":17,"one_draw_lib":1,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":2}`|
|1008|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":17,"one_draw_lib":3,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|1009|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":17,"one_draw_lib":2,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":3}`|
|1010|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":17,"one_draw_lib":1,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|1011|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":17,"one_draw_lib":3,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":2}`|
|1012|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":17,"one_draw_lib":4,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|1013|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":17,"one_draw_lib":1,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":2}`|
|1014|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":17,"one_draw_lib":3,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":3}`|
|1015|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":17,"one_draw_lib":2,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|1016|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":17,"one_draw_lib":1,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|1017|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":17,"one_draw_lib":3,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":2}`|
|1018|`{"two_random_min_times":2,"one_random_min_times":1,"total_times":10,"two_draw_lib":17,"one_draw_lib":4,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":3}`|
|1019|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":17,"one_draw_lib":1,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|1020|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":17,"one_draw_lib":3,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|1021|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":17,"one_draw_lib":2,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":2}`|
|1022|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":17,"one_draw_lib":1,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":3}`|
|1023|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":17,"one_draw_lib":3,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":2}`|
|1024|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":17,"one_draw_lib":4,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|1025|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":17,"one_draw_lib":2,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":2}`|
|2001|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":18,"one_draw_lib":5,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|2002|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":18,"one_draw_lib":7,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":2}`|
|2003|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":18,"one_draw_lib":6,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|2004|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":18,"one_draw_lib":5,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|2005|`{"two_random_min_times":2,"one_random_min_times":1,"total_times":10,"two_draw_lib":18,"one_draw_lib":7,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":3}`|
|2006|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":18,"one_draw_lib":8,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|2007|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":18,"one_draw_lib":5,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":2}`|
|2008|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":18,"one_draw_lib":7,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|2009|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":18,"one_draw_lib":6,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":3}`|
|2010|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":18,"one_draw_lib":5,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|2011|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":18,"one_draw_lib":7,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":2}`|
|2012|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":18,"one_draw_lib":8,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|2013|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":18,"one_draw_lib":5,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":2}`|
|2014|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":18,"one_draw_lib":7,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":3}`|
|2015|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":18,"one_draw_lib":6,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|2016|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":18,"one_draw_lib":5,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|2017|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":18,"one_draw_lib":7,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":2}`|
|2018|`{"two_random_min_times":2,"one_random_min_times":1,"total_times":10,"two_draw_lib":18,"one_draw_lib":8,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":3}`|
|2019|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":18,"one_draw_lib":5,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|2020|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":18,"one_draw_lib":7,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|2021|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":18,"one_draw_lib":6,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":2}`|
|2022|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":18,"one_draw_lib":5,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":3}`|
|2023|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":18,"one_draw_lib":7,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":2}`|
|2024|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":18,"one_draw_lib":8,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|2025|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":18,"one_draw_lib":6,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":2}`|
|3001|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":19,"one_draw_lib":9,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|3002|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":19,"one_draw_lib":11,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":2}`|
|3003|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":19,"one_draw_lib":10,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|3004|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":19,"one_draw_lib":9,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|3005|`{"two_random_min_times":2,"one_random_min_times":1,"total_times":10,"two_draw_lib":19,"one_draw_lib":11,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":3}`|
|3006|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":19,"one_draw_lib":12,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|3007|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":19,"one_draw_lib":9,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":2}`|
|3008|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":19,"one_draw_lib":11,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|3009|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":19,"one_draw_lib":10,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":3}`|
|3010|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":19,"one_draw_lib":9,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|3011|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":19,"one_draw_lib":11,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":2}`|
|3012|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":19,"one_draw_lib":12,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|3013|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":19,"one_draw_lib":9,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":2}`|
|3014|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":19,"one_draw_lib":11,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":3}`|
|3015|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":19,"one_draw_lib":10,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|3016|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":19,"one_draw_lib":9,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|3017|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":19,"one_draw_lib":11,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":2}`|
|3018|`{"two_random_min_times":2,"one_random_min_times":1,"total_times":10,"two_draw_lib":19,"one_draw_lib":12,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":3}`|
|3019|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":19,"one_draw_lib":9,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|3020|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":19,"one_draw_lib":11,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|3021|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":19,"one_draw_lib":10,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":2}`|
|3022|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":19,"one_draw_lib":9,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":3}`|
|3023|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":19,"one_draw_lib":11,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":2}`|
|3024|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":19,"one_draw_lib":12,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|3025|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":19,"one_draw_lib":10,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":2}`|
|4001|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":20,"one_draw_lib":13,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|4002|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":20,"one_draw_lib":15,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":2}`|
|4003|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":20,"one_draw_lib":14,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|4004|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":20,"one_draw_lib":13,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|4005|`{"two_random_min_times":2,"one_random_min_times":1,"total_times":10,"two_draw_lib":20,"one_draw_lib":15,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":3}`|
|4006|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":20,"one_draw_lib":16,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|4007|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":20,"one_draw_lib":13,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":2}`|
|4008|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":20,"one_draw_lib":15,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|4009|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":20,"one_draw_lib":14,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":3}`|
|4010|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":20,"one_draw_lib":13,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|4011|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":20,"one_draw_lib":15,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":2}`|
|4012|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":20,"one_draw_lib":16,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|4013|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":20,"one_draw_lib":13,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":2}`|
|4014|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":20,"one_draw_lib":15,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":3}`|
|4015|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":20,"one_draw_lib":14,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|4016|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":20,"one_draw_lib":13,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|4017|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":20,"one_draw_lib":15,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":2}`|
|4018|`{"two_random_min_times":2,"one_random_min_times":1,"total_times":10,"two_draw_lib":20,"one_draw_lib":16,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":3}`|
|4019|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":20,"one_draw_lib":13,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|4020|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":20,"one_draw_lib":15,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|4021|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":20,"one_draw_lib":14,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":2}`|
|4022|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":20,"one_draw_lib":13,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":3}`|
|4023|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":20,"one_draw_lib":15,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":2}`|
|4024|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":20,"one_draw_lib":16,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":1}`|
|4025|`{"two_random_min_times":1,"one_random_min_times":1,"total_times":10,"two_draw_lib":20,"one_draw_lib":14,"one_random_max_times":1,"three_draw_lib":21,"two_random_max_times":2}`|
