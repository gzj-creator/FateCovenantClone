# FirstRechargeTable 规则参数

来源：[personal-server/assets/tables/7289607387164353000-FirstRechargeTable.data.json.gz](../../../../personal-server/assets/tables/7289607387164353000-FirstRechargeTable.data.json.gz)，SHA256：`697c88198f1d6d16ac6c85c459bc83c739d707cf093e96da8fcabecb8562e405`。

[完整逐行JSON](FirstRechargeTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Award](#award)|9|decoded-rows|
|[Bubble](#bubble)|3|decoded-rows|
|[FirstRecharge](#firstrecharge)|3|decoded-rows|

## Award

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|9|本表行键；与其他表同值不自动代表同一对象。|
|award|array|9|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award":[[3030501,1]]}`|
|2|`{"award":[[101500,888]]}`|
|3|`{"award":[[101500,888]]}`|
|4|`{"award":[[2002,10]]}`|
|5|`{"award":[[17002,500]]}`|
|6|`{"award":[[17002,500]]}`|
|7|`{"award":[[23300504,60]]}`|
|8|`{"award":[[10063200,1]]}`|
|9|`{"award":[[23300504,60]]}`|

## Bubble

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|music|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|time|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|des|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"time":5000}`|
|2|`{"time":4000}`|
|3|`{"time":2000}`|

## FirstRecharge

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|need_amount|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_hero|array|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rewards|array|3|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|days|array|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|assert|undefined|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_condition|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"need_amount":600,"show_hero":[3030501],"rewards":[1,2,3],"days":[1,2,3],"show_condition":0}`|
|2|`{"need_amount":3000,"show_hero":[],"rewards":[4,5,6],"days":[1,2,3],"show_condition":0}`|
|3|`{"need_amount":10000,"show_hero":[],"rewards":[7,8,9],"days":[1,2,3],"show_condition":0}`|
