# RoleBackTable 规则参数

来源：[personal-server/assets/tables/RoleBackTable.data.lua.json.gz](../../../../personal-server/assets/tables/RoleBackTable.data.lua.json.gz)，SHA256：`dc8a09b90e95f616be6a987de4e3a9c1163fac05ef85b4f5baafb3301aae4e12`。

[完整逐行JSON](RoleBackTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[New](#new)|1|decoded-rows|
|[Old](#old)|1|decoded-rows|

## New

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|award|array|1|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|keep_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|money|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|min_recharge|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|money_item|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_monthly_discount|boolean|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award":[[209708,1],[3002,20],[2002,50],[101500,8888]],"keep_time":864000,"money":100,"min_recharge":98,"money_item":601500,"is_monthly_discount":false}`|

## Old

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|keep_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|e_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|leave_hours|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|s_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|level|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"keep_time":864000,"e_time":1791665999,"s_time":1789074000,"level":30}`|
