# InviteOldActTable 规则参数

来源：[personal-server/assets/tables/InviteOldActTable.data.lua.json.gz](../../../../personal-server/assets/tables/InviteOldActTable.data.lua.json.gz)，SHA256：`e541eb1094dfb8aaa711e6248119559292d6753a2d1c067a7e11a720c59c64c0`。

[完整逐行JSON](InviteOldActTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[InviteOldTask](#inviteoldtask)|24|decoded-rows|
|[InviteOldAct](#inviteoldact)|3|decoded-rows|

## InviteOldTask

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|award_list|array|24|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|task_type|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|24|本表行键；与其他表同值不自动代表同一对象。|
|task_des|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|period|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|target_count|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_param|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|limit_get_count|number|24|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101001|`{"award_list":[[25400204,80],[10064100,1],[101500,500]],"task_type":1,"type":100602,"task_des":13236,"target_count":28000000,"task_param":0,"limit_get_count":1}`|
|101002|`{"award_list":[[25400204,80],[10074100,3],[101500,500]],"task_type":1,"type":100602,"task_des":13237,"target_count":38000000,"task_param":0,"limit_get_count":1}`|
|101003|`{"award_list":[[3002,10],[10054100,1],[101500,50]],"task_type":1,"type":100601,"task_des":13233,"target_count":20,"task_param":0,"limit_get_count":3}`|
|101004|`{"award_list":[[3002,10],[10054100,1],[101500,200]],"task_type":1,"type":100601,"task_des":13234,"target_count":35,"task_param":0,"limit_get_count":2}`|
|101005|`{"award_list":[[390002,1],[10064100,1],[101500,500]],"task_type":1,"type":100601,"task_des":13235,"target_count":70,"task_param":0,"limit_get_count":2}`|
|101006|`{"award_list":[[23002,1],[10054100,1],[101500,200]],"task_type":1,"type":100602,"task_des":13238,"target_count":8000000,"task_param":0,"limit_get_count":2}`|
|101007|`{"award_list":[[3891200,1],[10064100,1],[101500,200]],"task_type":1,"type":100602,"task_des":13239,"target_count":16000000,"task_param":0,"limit_get_count":2}`|
|101008|`{"award_list":[[3901200,1],[1030122,1],[101500,500]],"task_type":1,"type":100602,"task_des":13240,"target_count":32000000,"task_param":0,"limit_get_count":2}`|
|101009|`{"award_list":[[4441200,1],[10064100,1],[101500,500]],"task_type":1,"type":100602,"task_des":13305,"target_count":12000000,"task_param":0,"limit_get_count":1}`|
|101010|`{"award_list":[[4441200,1],[10074100,3],[101500,500]],"task_type":1,"type":100602,"task_des":13306,"target_count":15000000,"task_param":0,"limit_get_count":1}`|
|101011|`{"award_list":[[3002,10],[10054100,1],[101500,50]],"task_type":1,"type":100601,"task_des":13233,"target_count":20,"task_param":0,"limit_get_count":3}`|
|101012|`{"award_list":[[3002,10],[10054100,1],[101500,200]],"task_type":1,"type":100601,"task_des":13234,"target_count":35,"task_param":0,"limit_get_count":2}`|
|101013|`{"award_list":[[390002,1],[10064100,1],[101500,500]],"task_type":1,"type":100601,"task_des":13309,"target_count":50,"task_param":0,"limit_get_count":2}`|
|101014|`{"award_list":[[23002,1],[10054100,1],[101500,200]],"task_type":1,"type":100602,"task_des":13307,"target_count":3000000,"task_param":0,"limit_get_count":2}`|
|101015|`{"award_list":[[3891200,1],[10064100,1],[101500,200]],"task_type":1,"type":100602,"task_des":13308,"target_count":5000000,"task_param":0,"limit_get_count":2}`|
|101016|`{"award_list":[[3901200,1],[1030122,1],[101500,500]],"task_type":1,"type":100602,"task_des":13238,"target_count":8000000,"task_param":0,"limit_get_count":2}`|
|101017|`{"award_list":[[4441200,1],[10064100,1],[101500,500]],"task_type":1,"type":100602,"task_des":13305,"target_count":12000000,"task_param":0,"limit_get_count":1}`|
|101018|`{"award_list":[[4441200,1],[10074100,3],[101500,500]],"task_type":1,"type":100602,"task_des":13306,"target_count":15000000,"task_param":0,"limit_get_count":1}`|
|101019|`{"award_list":[[3002,10],[10054100,1],[101500,50]],"task_type":1,"type":100601,"task_des":13233,"target_count":20,"task_param":0,"limit_get_count":3}`|
|101020|`{"award_list":[[3002,10],[10054100,1],[101500,200]],"task_type":1,"type":100601,"task_des":13234,"target_count":35,"task_param":0,"limit_get_count":2}`|
|101021|`{"award_list":[[390002,1],[10064100,1],[101500,500]],"task_type":1,"type":100601,"task_des":13309,"target_count":50,"task_param":0,"limit_get_count":2}`|
|101022|`{"award_list":[[23002,1],[10054100,1],[101500,200]],"task_type":1,"type":100602,"task_des":13307,"target_count":3000000,"task_param":0,"limit_get_count":2}`|
|101023|`{"award_list":[[3891200,1],[10064100,1],[101500,200]],"task_type":1,"type":100602,"task_des":13308,"target_count":5000000,"task_param":0,"limit_get_count":2}`|
|101024|`{"award_list":[[3901200,1],[1030122,1],[101500,500]],"task_type":1,"type":100602,"task_des":13238,"target_count":8000000,"task_param":0,"limit_get_count":2}`|

## InviteOldAct

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|invite_code_text_id|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tips_text_id|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bust_portrait|string|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|bg|string|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|act_title_text_id|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
