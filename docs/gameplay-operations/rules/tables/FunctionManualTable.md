# FunctionManualTable 规则参数

来源：[personal-server/assets/tables/FunctionManualTable.rows.json.gz](../../../../personal-server/assets/tables/FunctionManualTable.rows.json.gz)，SHA256：`bb6482fefffed921502a864bea65ac2d87741999cd031c072fb54714114a1d8d`。

[完整逐行JSON](FunctionManualTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Task](#task)|28|decoded-rows|

## Task

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|28|本表行键；与其他表同值不自动代表同一对象。|
|show_name|number|28|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_des|number|28|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_bg|string|28|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sign_icon|string|28|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|func_open|number|28|完整功能开放ID；条件见功能开放附录，不能直接当等级。|
|task_list|array|28|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|_task_type|null|28|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|_task_param|null|28|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|_task_count|null|28|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|28|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|goup|number|28|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"func_open":1022,"task_list":[[5902,0,2],[2722,1,2],[2724,1,1]],"_task_type":null,"_task_param":null,"_task_count":null,"award":[[25002,1],[201500,5000]]}`|
|2|`{"func_open":1099,"task_list":[[1201,1,10203],[1202,0,3],[1202,0,6]],"_task_type":null,"_task_param":null,"_task_count":null,"award":[[101800,2500],[201500,5000]]}`|
|3|`{"func_open":1046,"task_list":[[1003,1,1],[1003,1,10],[1003,1,20]],"_task_type":null,"_task_param":null,"_task_count":null,"award":[[201500,10000],[31002,1]]}`|
|4|`{"func_open":1097,"task_list":[[5801,5,3],[5801,10,4],[5801,15,5]],"_task_type":null,"_task_param":null,"_task_count":null,"award":[[101800,2000],[201500,3000]]}`|
|5|`{"func_open":1048,"task_list":[[1810,1,1],[1810,1,5],[1810,1,10]],"_task_type":null,"_task_param":null,"_task_count":null,"award":[[32002,1],[31002,1]]}`|
|6|`{"func_open":1098,"task_list":[[5801,15,6],[5802,2,6],[5802,3,3]],"_task_type":null,"_task_param":null,"_task_count":null,"award":[[201500,10000],[101800,5000]]}`|
|7|`{"func_open":1028,"task_list":[[6901,1,1],[6902,1,1],[6903,1,1]],"_task_type":null,"_task_param":null,"_task_count":null,"award":[[201500,10000],[101800,1000]]}`|
|8|`{"func_open":1056,"task_list":[[1602,1,10],[1304,1,1],[1602,1,50]],"_task_type":null,"_task_param":null,"_task_count":null,"award":[[157002,1000],[17002,300]]}`|
|9|`{"func_open":1055,"task_list":[[2202,30,1],[2203,1,1],[2206,1,1]],"_task_type":null,"_task_param":null,"_task_count":null,"award":[[157002,2000],[201500,10000]]}`|
|10|`{"func_open":1059,"task_list":[[2201,2,4],[2201,2,8],[2201,2,12]],"_task_type":null,"_task_param":null,"_task_count":null,"award":[[17002,300],[157002,2000]]}`|
|11|`{"func_open":1037,"task_list":[[6101,1,2],[6102,1,1],[6103,1,4]],"_task_type":null,"_task_param":null,"_task_count":null,"award":[[2002,1],[201500,5000]]}`|
|13|`{"func_open":1051,"task_list":[[1807,1,1],[1807,0,2],[2301,1,50000]],"_task_type":null,"_task_param":null,"_task_count":null,"award":[[201500,20000],[101800,2000]]}`|
|14|`{"func_open":1040,"task_list":[[1402,1,1],[1402,1,5],[1405,1,1000]],"_task_type":null,"_task_param":null,"_task_count":null,"award":[[101900,300],[2001900,2000]]}`|
|15|`{"func_open":1053,"task_list":[[2401,1,1],[2402,1,5],[12602,0,1]],"_task_type":null,"_task_param":null,"_task_count":null,"award":[[20002,5],[901900,20]]}`|
|16|`{"func_open":1105,"task_list":[[8801,0,1],[8802,0,1],[8803,0,1]],"_task_type":null,"_task_param":null,"_task_count":null,"award":[[391002,200],[201500,5000]]}`|
|17|`{"func_open":1195,"task_list":[[8102,0,1],[12701,0,6],[8104,0,1]],"_task_type":null,"_task_param":null,"_task_count":null,"award":[[1241200,1],[179002,200]]}`|
|18|`{"func_open":1064,"task_list":[[6503,1,1],[6503,1,2],[6504,1,5]],"_task_type":null,"_task_param":null,"_task_count":null,"award":[[391002,200],[20002,10]]}`|
|19|`{"func_open":1061,"task_list":[[2204,1,1],[2204,1,4],[2205,1,1]],"_task_type":null,"_task_param":null,"_task_count":null,"award":[[18002,10],[17002,200]]}`|
|20|`{"func_open":1066,"task_list":[[7002,0,10],[7003,0,5],[7001,0,4]],"_task_type":null,"_task_param":null,"_task_count":null,"award":[[101900,200],[2001900,3000]]}`|
|21|`{"func_open":1133,"task_list":[[10001,0,1],[1305,0,3],[10002,0,12]],"_task_type":null,"_task_param":null,"_task_count":null,"award":[[2201900,50],[101500,100]]}`|
|22|`{"func_open":1045,"task_list":[[9001,0,3],[9002,0,503],[9001,0,10]],"_task_type":null,"_task_param":null,"_task_count":null,"award":[[3002,1],[201500,30000]]}`|
|23|`{"func_open":1151,"task_list":[[12203,10,1],[12203,10,3],[12203,20,3]],"_task_type":null,"_task_param":null,"_task_count":null,"award":[[691200,1],[140002,5]]}`|
|24|`{"func_open":1155,"task_list":[[12104,0,1],[12105,0,1],[12102,0,2]],"_task_type":null,"_task_param":null,"_task_count":null,"award":[[681200,1],[140002,5]]}`|
|25|`{"func_open":1206,"task_list":[[12901,1,10],[12901,1,30],[12902,1,1]],"_task_type":null,"_task_param":null,"_task_count":null,"award":[[331002,50],[332002,20]]}`|
|26|`{"func_open":1199,"task_list":[[12831,0,5],[12831,0,20],[12832,0,5]],"_task_type":null,"_task_param":null,"_task_count":null,"award":[[326002,1],[101500,100]]}`|
|27|`{"func_open":1198,"task_list":[[12802,0,10],[12804,0,1],[12806,0,10]],"_task_type":null,"_task_param":null,"_task_count":null,"award":[[180002,1000],[181002,2000]]}`|
|28|`{"func_open":1159,"task_list":[[12401,0,5],[12401,0,10],[12402,0,5]],"_task_type":null,"_task_param":null,"_task_count":null,"award":[[801900,20],[101900,100]]}`|
|29|`{"func_open":1209,"task_list":[[13003,1,1],[13002,1,20],[13001,40,1]],"_task_type":null,"_task_param":null,"_task_count":null,"award":[[345015,1],[501002,50]]}`|
