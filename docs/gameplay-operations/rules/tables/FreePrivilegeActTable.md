# FreePrivilegeActTable 规则参数

来源：[personal-server/assets/tables/FreePrivilegeActTable.data.lua.json.gz](../../../../personal-server/assets/tables/FreePrivilegeActTable.data.lua.json.gz)，SHA256：`70e8c993411c907fdd579c569b71924b2edfe2335f6928046c490d6443bdc548`。

[完整逐行JSON](FreePrivilegeActTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Version](#version)|2|decoded-rows|
|[Show](#show)|2|decoded-rows|

## Version

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|privilege_day|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_month_card|boolean|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|month_card|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"privilege_day":30,"is_month_card":true}`|
|2|`{"privilege_day":30,"is_month_card":true}`|

## Show

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|prefab|string|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|title|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|desc|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|privilege_tips|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|txt_cards_tips|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
