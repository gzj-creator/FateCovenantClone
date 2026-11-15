# CmsTable 规则参数

来源：[personal-server/assets/tables/CmsTable.data.lua.json.gz](../../../../personal-server/assets/tables/CmsTable.data.lua.json.gz)，SHA256：`0486d0f1e4aebe123dd6fe5d876b03c5d8ce43484e8848cdc6b8f29a523de47b`。

[完整逐行JSON](CmsTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Cms](#cms)|1|decoded-rows|

## Cms

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|fun_open|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|req_duration|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pb|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"fun_open":1203,"req_duration":1800}`|
