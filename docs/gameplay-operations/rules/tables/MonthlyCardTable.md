# MonthlyCardTable 规则参数

来源：[personal-server/assets/tables/MonthlyCardTable.data.lua.json.gz](../../../../personal-server/assets/tables/MonthlyCardTable.data.lua.json.gz)，SHA256：`babcde539be88cfc171b0c9e5bdad859fc5af2d993d0c332d0bc04b69470270d`。

[完整逐行JSON](MonthlyCardTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Period](#period)|1|decoded-rows|
|[Award](#award)|1|decoded-rows|
|[MonthlyCard](#monthlycard)|7|decoded-rows|

## Period

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|start_day|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|4|`{"start_day":3}`|

## Award

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|reward|array|1|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|4007|`{"reward":[[178002,15]]}`|

## MonthlyCard

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|reward|array|7|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|bg|string|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_name|string|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|7|本表行键；与其他表同值不自动代表同一对象。|
|recharge|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|reward_period|number|7|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|rebate|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|role_back_recharge|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|addition|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|display_type|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sever_open_day|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|active_icon|string|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|addition_award|number|7|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|item_recharge|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"reward":[[122702,1],[8501900,2],[101500,300]],"reward_period":30,"sever_open_day":0,"addition_award":0,"item_recharge":150021}`|
|2|`{"reward":[[122702,2],[8501900,4],[101500,600]],"reward_period":30,"sever_open_day":0,"addition_award":0,"item_recharge":0}`|
|3|`{"reward":[[101500,688]],"reward_period":7,"sever_open_day":0,"addition_award":0,"item_recharge":0}`|
|4|`{"reward":[[101500,10]],"reward_period":7,"sever_open_day":0,"addition_award":0,"item_recharge":0}`|
|5|`{"reward":[[101500,600]],"reward_period":90,"sever_open_day":12,"addition_award":0,"item_recharge":0}`|
|6|`{"reward":[[101500,60]],"reward_period":90,"sever_open_day":0,"addition_award":0,"item_recharge":0}`|
|7|`{"reward":[[101500,200],[1581200,4]],"reward_period":30,"sever_open_day":0,"addition_award":0,"item_recharge":0}`|
