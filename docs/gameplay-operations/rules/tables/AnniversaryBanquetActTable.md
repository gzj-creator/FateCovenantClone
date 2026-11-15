# AnniversaryBanquetActTable 规则参数

来源：[personal-server/assets/tables/AnniversaryBanquetActTable.data.lua.json.gz](../../../../personal-server/assets/tables/AnniversaryBanquetActTable.data.lua.json.gz)，SHA256：`f63473a16ce130b9ac691770ae1179640d31ce25f833f61c1c5d2a7af0822dbb`。

[完整逐行JSON](AnniversaryBanquetActTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Task](#task)|45|decoded-rows|
|[Version](#version)|3|decoded-rows|
|[TaskType](#tasktype)|3|decoded-rows|
|[Process](#process)|36|decoded-rows|

## Task

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|target_count|number|45|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ext_param|number|45|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|45|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|type|number|45|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|index|number|45|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|process_add|number|45|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|act_task_type|number|45|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|45|本表行键；与其他表同值不自动代表同一对象。|
|asserts|undefined/number|45|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|version|number|45|版本引用；必须按活动类型及其消费者查对应版本表。|
|task_param|number|45|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"target_count":1,"award":[[101500,20]],"type":1803,"act_task_type":1,"version":1,"task_param":0}`|
|2|`{"target_count":100,"award":[[101500,50]],"type":14301,"act_task_type":1,"version":1,"task_param":0}`|
|3|`{"target_count":1,"award":[[101500,50]],"type":6901,"act_task_type":1,"version":1,"task_param":0}`|
|4|`{"target_count":1,"award":[[101500,50]],"type":1805,"act_task_type":1,"version":1,"task_param":0}`|
|11|`{"target_count":50,"award":[[101500,200]],"type":1003,"act_task_type":2,"version":1,"task_param":0}`|
|12|`{"target_count":5,"award":[[101500,200]],"type":100810,"act_task_type":2,"version":1,"task_param":0}`|
|13|`{"target_count":20000,"award":[[101500,300]],"type":1,"act_task_type":2,"version":1,"task_param":0}`|
|14|`{"target_count":10,"award":[[101500,300]],"type":1802,"act_task_type":2,"version":1,"task_param":0}`|
|15|`{"target_count":12000,"award":[[101500,500]],"type":8302,"act_task_type":2,"version":1,"task_param":0}`|
|21|`{"target_count":0,"award":[[210108,1]],"type":1199,"act_task_type":3,"asserts":508543300021,"version":1,"task_param":3030501}`|
|22|`{"target_count":1,"award":[[101500,5000]],"type":1199,"act_task_type":3,"asserts":508543300021,"version":1,"task_param":3030501}`|
|23|`{"target_count":2,"award":[[22002,2]],"type":1199,"act_task_type":3,"asserts":508543300021,"version":1,"task_param":3030501}`|
|24|`{"target_count":3,"award":[[5911200,3]],"type":1199,"act_task_type":3,"asserts":508543300021,"version":1,"task_param":3030501}`|
|25|`{"target_count":4,"award":[[830702,5]],"type":1199,"act_task_type":3,"asserts":508543300021,"version":1,"task_param":3030501}`|
|26|`{"target_count":5,"award":[[10173200,1]],"type":1199,"act_task_type":3,"asserts":508543300021,"version":1,"task_param":3030501}`|
|201|`{"target_count":1,"award":[[101500,20]],"type":1803,"act_task_type":1,"version":2,"task_param":0}`|
|202|`{"target_count":100,"award":[[101500,50]],"type":14301,"act_task_type":1,"version":2,"task_param":0}`|
|203|`{"target_count":1,"award":[[101500,50]],"type":6901,"act_task_type":1,"version":2,"task_param":0}`|
|204|`{"target_count":1,"award":[[101500,50]],"type":1805,"act_task_type":1,"version":2,"task_param":0}`|
|211|`{"target_count":50,"award":[[101500,200]],"type":1003,"act_task_type":2,"version":2,"task_param":0}`|
|212|`{"target_count":5,"award":[[101500,200]],"type":100810,"act_task_type":2,"version":2,"task_param":0}`|
|213|`{"target_count":20000,"award":[[101500,300]],"type":1,"act_task_type":2,"version":2,"task_param":0}`|
|214|`{"target_count":10,"award":[[101500,300]],"type":1802,"act_task_type":2,"version":2,"task_param":0}`|
|215|`{"target_count":12000,"award":[[101500,500]],"type":8302,"act_task_type":2,"version":2,"task_param":0}`|
|221|`{"target_count":0,"award":[[210108,1]],"type":1199,"act_task_type":3,"asserts":508543300021,"version":2,"task_param":3030501}`|
|222|`{"target_count":1,"award":[[101500,5000]],"type":1199,"act_task_type":3,"asserts":508543300021,"version":2,"task_param":3030501}`|
|223|`{"target_count":2,"award":[[22002,2]],"type":1199,"act_task_type":3,"asserts":508543300021,"version":2,"task_param":3030501}`|
|224|`{"target_count":3,"award":[[5911200,3]],"type":1199,"act_task_type":3,"asserts":508543300021,"version":2,"task_param":3030501}`|
|225|`{"target_count":4,"award":[[830702,5]],"type":1199,"act_task_type":3,"asserts":508543300021,"version":2,"task_param":3030501}`|
|226|`{"target_count":5,"award":[[10173200,1]],"type":1199,"act_task_type":3,"asserts":508543300021,"version":2,"task_param":3030501}`|
|301|`{"target_count":1,"award":[[101500,20]],"type":1803,"act_task_type":1,"version":3,"task_param":0}`|
|302|`{"target_count":100,"award":[[101500,50]],"type":14301,"act_task_type":1,"version":3,"task_param":0}`|
|303|`{"target_count":1,"award":[[101500,50]],"type":6901,"act_task_type":1,"version":3,"task_param":0}`|
|304|`{"target_count":1,"award":[[101500,50]],"type":1805,"act_task_type":1,"version":3,"task_param":0}`|
|311|`{"target_count":50,"award":[[101500,200]],"type":1003,"act_task_type":2,"version":3,"task_param":0}`|
|312|`{"target_count":5,"award":[[101500,200]],"type":100810,"act_task_type":2,"version":3,"task_param":0}`|
|313|`{"target_count":20000,"award":[[101500,300]],"type":1,"act_task_type":2,"version":3,"task_param":0}`|
|314|`{"target_count":10,"award":[[101500,300]],"type":1802,"act_task_type":2,"version":3,"task_param":0}`|
|315|`{"target_count":12000,"award":[[101500,500]],"type":8302,"act_task_type":2,"version":3,"task_param":0}`|
|321|`{"target_count":0,"award":[[210108,1]],"type":1199,"act_task_type":3,"asserts":508543300021,"version":3,"task_param":3030501}`|
|322|`{"target_count":1,"award":[[101500,5000]],"type":1199,"act_task_type":3,"asserts":508543300021,"version":3,"task_param":3030501}`|
|323|`{"target_count":2,"award":[[22002,2]],"type":1199,"act_task_type":3,"asserts":508543300021,"version":3,"task_param":3030501}`|
|324|`{"target_count":3,"award":[[5911200,3]],"type":1199,"act_task_type":3,"asserts":508543300021,"version":3,"task_param":3030501}`|
|325|`{"target_count":4,"award":[[830702,5]],"type":1199,"act_task_type":3,"asserts":508543300021,"version":3,"task_param":3030501}`|
|326|`{"target_count":5,"award":[[10173200,1]],"type":1199,"act_task_type":3,"asserts":508543300021,"version":3,"task_param":3030501}`|

## Version

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tip1|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|memory_act|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|help|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tip2|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|help_give_back|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|

## TaskType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|show_name|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|

## Process

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|36|本表行键；与其他表同值不自动代表同一对象。|
|award|array|36|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|index|number|36|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|version|number|36|版本引用；必须按活动类型及其消费者查对应版本表。|
|process_req|number|36|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award":[[5911200,5]],"version":1}`|
|2|`{"award":[[5911200,5]],"version":1}`|
|3|`{"award":[[5451200,6]],"version":1}`|
|4|`{"award":[[5451200,6]],"version":1}`|
|5|`{"award":[[5441200,1]],"version":1}`|
|6|`{"award":[[25500704,10]],"version":1}`|
|7|`{"award":[[5911200,5]],"version":1}`|
|8|`{"award":[[5911200,5]],"version":1}`|
|9|`{"award":[[5451200,6]],"version":1}`|
|10|`{"award":[[5451200,6]],"version":1}`|
|11|`{"award":[[5441200,1]],"version":1}`|
|12|`{"award":[[25500704,20]],"version":1}`|
|201|`{"award":[[5911200,5]],"version":2}`|
|202|`{"award":[[5911200,5]],"version":2}`|
|203|`{"award":[[5451200,6]],"version":2}`|
|204|`{"award":[[5451200,6]],"version":2}`|
|205|`{"award":[[5441200,1]],"version":2}`|
|206|`{"award":[[25500704,10]],"version":2}`|
|207|`{"award":[[5911200,5]],"version":2}`|
|208|`{"award":[[5911200,5]],"version":2}`|
|209|`{"award":[[5451200,6]],"version":2}`|
|210|`{"award":[[5451200,6]],"version":2}`|
|211|`{"award":[[5441200,1]],"version":2}`|
|212|`{"award":[[25500704,20]],"version":2}`|
|301|`{"award":[[5911200,5]],"version":3}`|
|302|`{"award":[[5911200,5]],"version":3}`|
|303|`{"award":[[5451200,6]],"version":3}`|
|304|`{"award":[[5451200,6]],"version":3}`|
|305|`{"award":[[5441200,1]],"version":3}`|
|306|`{"award":[[25500704,10]],"version":3}`|
|307|`{"award":[[5911200,5]],"version":3}`|
|308|`{"award":[[5911200,5]],"version":3}`|
|309|`{"award":[[5451200,6]],"version":3}`|
|310|`{"award":[[5451200,6]],"version":3}`|
|311|`{"award":[[5441200,1]],"version":3}`|
|312|`{"award":[[25500704,20]],"version":3}`|
