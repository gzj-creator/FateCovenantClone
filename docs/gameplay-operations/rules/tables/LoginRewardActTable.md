# LoginRewardActTable 规则参数

来源：[personal-server/assets/tables/LoginRewardActTable.data.lua.json.gz](../../../../personal-server/assets/tables/LoginRewardActTable.data.lua.json.gz)，SHA256：`1eb5d85eb2436fa5a8fa2f5db1fbe98597dc2afa698515d37a54a06b6d3b1bff`。

[完整逐行JSON](LoginRewardActTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Award](#award)|5|decoded-rows|
|[LoginRewardAct](#loginrewardact)|1|decoded-rows|

## Award

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|item|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|belong_act|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|count|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"item":101500,"count":500}`|
|102|`{"item":101500,"count":1888}`|
|103|`{"item":174002,"count":1}`|
|104|`{"item":174002,"count":1}`|
|105|`{"item":1040101,"count":1}`|

## LoginRewardAct

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|mail_id|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|82001|`{}`|
