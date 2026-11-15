# DiamondBankActTable 规则参数

来源：[personal-server/assets/tables/DiamondBankActTable.data.lua.json.gz](../../../../personal-server/assets/tables/DiamondBankActTable.data.lua.json.gz)，SHA256：`826d81baace4c278c3df190caf439f07ceac3e4440aaf51f1ff01208288f2114`。

[完整逐行JSON](DiamondBankActTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[VerRecharge](#verrecharge)|5|decoded-rows|
|[LiveTask](#livetask)|14|decoded-rows|
|[Ver](#ver)|1|decoded-rows|

## VerRecharge

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|version|number|5|版本引用；必须按活动类型及其消费者查对应版本表。|
|recharge_id|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|day_buy_times|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_buy_additionally|boolean|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|batch_update|array|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"version":1,"day_buy_times":1,"is_buy_additionally":false}`|
|2|`{"version":1,"day_buy_times":1,"is_buy_additionally":true}`|
|3|`{"version":1,"day_buy_times":1,"is_buy_additionally":true}`|
|4|`{"version":1,"day_buy_times":1,"is_buy_additionally":true}`|
|5|`{"version":1,"day_buy_times":1,"is_buy_additionally":false}`|

## LiveTask

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|14|本表行键；与其他表同值不自动代表同一对象。|
|ver|number|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|keep_type|number|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|target_count|number|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_param|number|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|14|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|priority|number|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|group|number|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"type":4701,"keep_type":0,"target_count":50,"task_param":0,"award":[[820902,50]],"group":1}`|
|102|`{"type":4701,"keep_type":0,"target_count":150,"task_param":0,"award":[[820902,100]],"group":1}`|
|103|`{"type":1,"keep_type":0,"target_count":500,"task_param":0,"award":[[820902,50]],"group":1}`|
|104|`{"type":1,"keep_type":0,"target_count":1000,"task_param":0,"award":[[820902,100]],"group":1}`|
|105|`{"type":2604,"keep_type":0,"target_count":600,"task_param":0,"award":[[820902,200]],"group":1}`|
|106|`{"type":2604,"keep_type":0,"target_count":3000,"task_param":0,"award":[[820902,500]],"group":1}`|
|107|`{"type":2603,"keep_type":1,"target_count":1,"task_param":0,"award":[[820902,1000]],"group":2}`|
|108|`{"type":2603,"keep_type":1,"target_count":3,"task_param":0,"award":[[820902,1500]],"group":2}`|
|109|`{"type":2603,"keep_type":1,"target_count":5,"task_param":0,"award":[[820902,2000]],"group":2}`|
|110|`{"type":2603,"keep_type":1,"target_count":7,"task_param":0,"award":[[820902,3000]],"group":2}`|
|111|`{"type":1802,"keep_type":1,"target_count":1,"task_param":0,"award":[[820902,100]],"group":2}`|
|112|`{"type":1802,"keep_type":1,"target_count":3,"task_param":0,"award":[[820902,150]],"group":2}`|
|113|`{"type":1802,"keep_type":1,"target_count":5,"task_param":0,"award":[[820902,200]],"group":2}`|
|114|`{"type":1802,"keep_type":1,"target_count":7,"task_param":0,"award":[[820902,300]],"group":2}`|

## Ver

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|open_use_item|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|open_add_num|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|gift|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|act_item|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|add_item|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rage|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_limit|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|recharge_rage|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_duo_value|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bank_kong_res|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bank_shao_res|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bank_duo_res|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bank_man_res|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bank_yilingqu_res|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"open_use_item":[[101500,1000]],"open_add_num":1000,"act_item":820902,"add_item":101500,"max_limit":10000,"show_duo_value":3000}`|
