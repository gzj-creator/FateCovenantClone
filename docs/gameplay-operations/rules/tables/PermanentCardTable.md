# PermanentCardTable 规则参数

来源：[personal-server/assets/tables/PermanentCardTable.data.lua.json.gz](../../../../personal-server/assets/tables/PermanentCardTable.data.lua.json.gz)，SHA256：`5b5aa7043277745750d5bab51ca3dfb47e1e1766c20314dc34c52b043b7eebfb`。

[完整逐行JSON](PermanentCardTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[PermanentCard](#permanentcard)|2|decoded-rows|

## PermanentCard

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|reward|array|2|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|day_limit|number|2|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|active_num|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|buy_day_limit|number|2|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|recharge|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|weekend_item|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|weekend_num|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|active_icon|string|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|active_item|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|display_type|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|discount_recharge|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ext_award_date|array|2|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"reward":[[101500,200]],"day_limit":15,"active_num":1,"buy_day_limit":0,"weekend_item":0,"weekend_num":0,"active_item":431002,"discount_recharge":0,"ext_award_date":[]}`|
|2|`{"reward":[[101500,500],[3002,2],[393002,3]],"day_limit":30,"active_num":0,"buy_day_limit":10,"weekend_item":0,"weekend_num":0,"active_item":0,"discount_recharge":490003,"ext_award_date":[[393002,1753045200]]}`|
