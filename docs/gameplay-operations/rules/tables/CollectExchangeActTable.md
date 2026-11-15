# CollectExchangeActTable 规则参数

来源：[personal-server/assets/tables/CollectExchangeActTable.data.lua.json.gz](../../../../personal-server/assets/tables/CollectExchangeActTable.data.lua.json.gz)，SHA256：`055d6f6ef833d42a5f45178806d40227d4106be8a8824b9a53a5ce2cec043dd8`。

[完整逐行JSON](CollectExchangeActTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[CollectExchangeAward](#collectexchangeaward)|56|decoded-rows|
|[CollectExchangeConst](#collectexchangeconst)|3|decoded-rows|

## CollectExchangeAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|56|本表行键；与其他表同值不自动代表同一对象。|
|show_red_dot|boolean|56|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|add|array|56|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sub|array|56|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|version|number|56|版本引用；必须按活动类型及其消费者查对应版本表。|
|limit|number|56|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{"version":1,"limit":1}`|
|1002|`{"version":1,"limit":2}`|
|1003|`{"version":1,"limit":1}`|
|1004|`{"version":1,"limit":1}`|
|1005|`{"version":1,"limit":3}`|
|1006|`{"version":1,"limit":3}`|
|1007|`{"version":1,"limit":2}`|
|1008|`{"version":1,"limit":5}`|
|1009|`{"version":1,"limit":5}`|
|1010|`{"version":1,"limit":3}`|
|1011|`{"version":1,"limit":3}`|
|1012|`{"version":1,"limit":3}`|
|1013|`{"version":1,"limit":30}`|
|1014|`{"version":1,"limit":25}`|
|1015|`{"version":1,"limit":20}`|
|1016|`{"version":1,"limit":10}`|
|1017|`{"version":1,"limit":5}`|
|2001|`{"version":2,"limit":1}`|
|2002|`{"version":2,"limit":1}`|
|2003|`{"version":2,"limit":1}`|
|2004|`{"version":2,"limit":1}`|
|2005|`{"version":2,"limit":1}`|
|2006|`{"version":2,"limit":3}`|
|2007|`{"version":2,"limit":2}`|
|2008|`{"version":2,"limit":3}`|
|2009|`{"version":2,"limit":5}`|
|2010|`{"version":2,"limit":4}`|
|2011|`{"version":2,"limit":1}`|
|2012|`{"version":2,"limit":3}`|
|2013|`{"version":2,"limit":3}`|
|2014|`{"version":2,"limit":3}`|
|2015|`{"version":2,"limit":30}`|
|2016|`{"version":2,"limit":25}`|
|2017|`{"version":2,"limit":20}`|
|2018|`{"version":2,"limit":10}`|
|2019|`{"version":2,"limit":5}`|
|3001|`{"version":3,"limit":1}`|
|3002|`{"version":3,"limit":1}`|
|3003|`{"version":3,"limit":1}`|
|3004|`{"version":3,"limit":1}`|
|3005|`{"version":3,"limit":1}`|
|3006|`{"version":3,"limit":2}`|
|3007|`{"version":3,"limit":2}`|
|3008|`{"version":3,"limit":2}`|
|3009|`{"version":3,"limit":2}`|
|3010|`{"version":3,"limit":5}`|
|3011|`{"version":3,"limit":3}`|
|3012|`{"version":3,"limit":2}`|
|3013|`{"version":3,"limit":3}`|
|3014|`{"version":3,"limit":3}`|
|3015|`{"version":3,"limit":3}`|
|3016|`{"version":3,"limit":30}`|
|3017|`{"version":3,"limit":25}`|
|3018|`{"version":3,"limit":20}`|
|3019|`{"version":3,"limit":10}`|
|3020|`{"version":3,"limit":5}`|

## CollectExchangeConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|power|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_item|array|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|red_daily|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|red_dot|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"power":604002,"show_item":[[611002,1]]}`|
|2|`{"power":604002,"show_item":[[611002,1]]}`|
|3|`{"power":604002,"show_item":[[611002,1]]}`|
