# RankAchieveTable 规则参数

来源：[personal-server/assets/tables/RankAchieveTable.data.json.gz](../../../../personal-server/assets/tables/RankAchieveTable.data.json.gz)，SHA256：`e5e3e0ee84e7dd8f72ab680f8c7cebe1ccb82bd0824a19a89d97dc526307cc94`。

[完整逐行JSON](RankAchieveTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[RankAchieve](#rankachieve)|84|decoded-rows|
|[EventType](#eventtype)|59|decoded-rows|
|[EventTimeSeparate](#eventtimeseparate)|6|decoded-rows|
|[Type](#type)|4|decoded-rows|

## RankAchieve

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|84|本表行键；与其他表同值不自动代表同一对象。|
|type|number|84|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|event_type|number|84|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|event_param|number/string|84|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|finish_award|array|84|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award|array|84|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|desc|number|84|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|title|number|84|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|prefab_type|number|84|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|event_param_convert|number/array|84|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|funcOpen|number|84|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|priority|number|84|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{"type":1,"event_type":8,"finish_award":[[301508,1]],"award":[[101500,50]],"event_param_convert":1,"funcOpen":0}`|
|1002|`{"type":1,"event_type":18,"finish_award":[[302208,1]],"award":[[101500,50]],"event_param_convert":0,"funcOpen":0}`|
|1003|`{"type":1,"event_type":6,"finish_award":[[301608,1]],"award":[[101500,50]],"event_param_convert":500,"funcOpen":1056}`|
|1004|`{"type":1,"event_type":6,"finish_award":[[301708,1]],"award":[[101500,50]],"event_param_convert":1000,"funcOpen":1056}`|
|1005|`{"type":1,"event_type":5,"finish_award":[[301908,1]],"award":[[101500,50]],"event_param_convert":5000000,"funcOpen":1224}`|
|1006|`{"type":1,"event_type":5,"finish_award":[[302008,1]],"award":[[101500,50]],"event_param_convert":10000000,"funcOpen":1224}`|
|1007|`{"type":1,"event_type":9,"finish_award":[[302108,1]],"award":[[101500,50]],"event_param_convert":0,"funcOpen":1064}`|
|1008|`{"type":1,"event_type":26,"finish_award":[[304508,1]],"award":[[101500,50]],"event_param_convert":0,"funcOpen":1064}`|
|1009|`{"type":1,"event_type":7,"finish_award":[[301808,1]],"award":[[101500,50]],"event_param_convert":4,"funcOpen":1105}`|
|1010|`{"type":1,"event_type":25,"finish_award":[[304408,1]],"award":[[101500,50]],"event_param_convert":10,"funcOpen":0}`|
|1011|`{"type":1,"event_type":19,"finish_award":[[302308,1]],"award":[[101500,50]],"event_param_convert":6000,"funcOpen":1066}`|
|1012|`{"type":1,"event_type":20,"finish_award":[[302408,1]],"award":[[101500,50]],"event_param_convert":106,"funcOpen":1159}`|
|1013|`{"type":1,"event_type":43,"finish_award":[[350208,1]],"award":[[101500,50]],"event_param_convert":480,"funcOpen":1286}`|
|2001|`{"type":2,"event_type":17,"finish_award":[[302508,1]],"award":[[101500,50]],"event_param_convert":[521604011],"funcOpen":0}`|
|2002|`{"type":2,"event_type":15,"finish_award":[[302608,1]],"award":[[101500,50]],"event_param_convert":1,"funcOpen":0}`|
|2003|`{"type":2,"event_type":15,"finish_award":[[302708,1]],"award":[[101500,50]],"event_param_convert":3,"funcOpen":0}`|
|2004|`{"type":2,"event_type":15,"finish_award":[[302808,1]],"award":[[101500,50]],"event_param_convert":5,"funcOpen":0}`|
|2005|`{"type":2,"event_type":21,"finish_award":[[303308,1]],"award":[[101500,50]],"event_param_convert":1000,"funcOpen":0}`|
|2006|`{"type":2,"event_type":22,"finish_award":[[303408,1]],"award":[[101500,50]],"event_param_convert":1000,"funcOpen":0}`|
|2007|`{"type":2,"event_type":4,"finish_award":[[302908,1]],"award":[[101500,50]],"event_param_convert":5,"funcOpen":1023}`|
|2008|`{"type":2,"event_type":16,"finish_award":[[303008,1]],"award":[[101500,50]],"event_param_convert":7,"funcOpen":1023}`|
|2009|`{"type":2,"event_type":3,"finish_award":[[303108,1]],"award":[[101500,50]],"event_param_convert":0,"funcOpen":1195}`|
|2010|`{"type":2,"event_type":23,"finish_award":[[303508,1]],"award":[[101500,50]],"event_param_convert":200,"funcOpen":1195}`|
|2011|`{"type":2,"event_type":24,"finish_award":[[303608,1]],"award":[[101500,50]],"event_param_convert":100,"funcOpen":1247}`|
|2012|`{"type":2,"event_type":31,"finish_award":[[347908,1]],"award":[[101500,50]],"event_param_convert":4,"funcOpen":1264}`|
|2013|`{"type":2,"event_type":34,"finish_award":[[348008,1]],"award":[[101500,50]],"event_param_convert":1,"funcOpen":1206}`|
|2014|`{"type":2,"event_type":34,"finish_award":[[348108,1]],"award":[[101500,50]],"event_param_convert":3,"funcOpen":1206}`|
|2015|`{"type":2,"event_type":34,"finish_award":[[348208,1]],"award":[[101500,50]],"event_param_convert":5,"funcOpen":1206}`|
|2016|`{"type":2,"event_type":35,"finish_award":[[348308,1]],"award":[[101500,50]],"event_param_convert":0,"funcOpen":1209}`|
|2017|`{"type":2,"event_type":35,"finish_award":[[348408,1]],"award":[[101500,50]],"event_param_convert":0,"funcOpen":1209}`|
|2018|`{"type":2,"event_type":36,"finish_award":[[348508,1]],"award":[[101500,50]],"event_param_convert":0,"funcOpen":1209}`|
|2019|`{"type":2,"event_type":16,"finish_award":[[303208,1]],"award":[[101500,50]],"event_param_convert":8,"funcOpen":1023}`|
|2020|`{"type":2,"event_type":39,"finish_award":[[349208,1]],"award":[[101500,50]],"event_param_convert":1,"funcOpen":1297}`|
|2021|`{"type":2,"event_type":39,"finish_award":[[349308,1]],"award":[[101500,50]],"event_param_convert":3,"funcOpen":1297}`|
|2022|`{"type":2,"event_type":17,"finish_award":[[350808,1]],"award":[[101500,50]],"event_param_convert":0,"funcOpen":1353}`|
|2023|`{"type":2,"event_type":48,"finish_award":[[346308,1]],"award":[[101500,50]],"event_param_convert":[550801060],"funcOpen":1193}`|
|2024|`{"type":2,"event_type":45,"finish_award":[[347508,1]],"award":[[101500,50]],"event_param_convert":0,"funcOpen":1151}`|
|2025|`{"type":2,"event_type":45,"finish_award":[[347608,1]],"award":[[101500,50]],"event_param_convert":0,"funcOpen":1151}`|
|2026|`{"type":2,"event_type":53,"finish_award":[[354408,1]],"award":[[101500,50]],"event_param_convert":[550801065],"funcOpen":1405}`|
|2027|`{"type":2,"event_type":53,"finish_award":[[356408,1]],"award":[[101500,50]],"event_param_convert":[560010058],"funcOpen":1440}`|
|2028|`{"type":2,"event_type":53,"finish_award":[[356708,1]],"award":[[101500,50]],"event_param_convert":[560010057],"funcOpen":1441}`|
|2029|`{"type":2,"event_type":59,"finish_award":[[357408,1]],"award":[[101500,50]],"event_param_convert":0,"funcOpen":1451}`|
|2030|`{"type":2,"event_type":53,"finish_award":[[358608,1]],"award":[[101500,50]],"event_param_convert":[560010059],"funcOpen":1452}`|
|2031|`{"type":2,"event_type":53,"finish_award":[[358908,1]],"award":[[101500,50]],"event_param_convert":[560010060],"funcOpen":1453}`|
|2032|`{"type":2,"event_type":53,"finish_award":[[359408,1]],"award":[[101500,50]],"event_param_convert":[560010061],"funcOpen":1455}`|
|2033|`{"type":2,"event_type":53,"finish_award":[[359708,1]],"award":[[101500,50]],"event_param_convert":[560010062],"funcOpen":1456}`|
|2034|`{"type":2,"event_type":53,"finish_award":[[360008,1]],"award":[[101500,50]],"event_param_convert":[6505178],"funcOpen":1457}`|
|2035|`{"type":2,"event_type":53,"finish_award":[[360308,1]],"award":[[101500,50]],"event_param_convert":[560010064],"funcOpen":1461}`|
|3001|`{"type":3,"event_type":10,"finish_award":[[303808,1]],"award":[[101500,50]],"event_param_convert":0,"funcOpen":0}`|
|3002|`{"type":3,"event_type":2,"finish_award":[[303708,1]],"award":[[101500,50]],"event_param_convert":0,"funcOpen":0}`|
|3003|`{"type":3,"event_type":12,"finish_award":[[303908,1]],"award":[[101500,50]],"event_param_convert":600,"funcOpen":0}`|
|3004|`{"type":3,"event_type":29,"finish_award":[[345808,1]],"award":[[101500,50]],"event_param_convert":10,"funcOpen":0}`|
|3005|`{"type":3,"event_type":30,"finish_award":[[345908,1]],"award":[[101500,50]],"event_param_convert":10,"funcOpen":0}`|
|3006|`{"type":3,"event_type":40,"finish_award":[[349408,1]],"award":[[101500,50]],"event_param_convert":10,"funcOpen":0}`|
|3007|`{"type":3,"event_type":40,"finish_award":[[349508,1]],"award":[[101500,50]],"event_param_convert":10,"funcOpen":0}`|
|3008|`{"type":3,"event_type":40,"finish_award":[[349608,1]],"award":[[101500,50]],"event_param_convert":10,"funcOpen":0}`|
|3009|`{"type":3,"event_type":41,"finish_award":[[349708,1]],"award":[[101500,50]],"event_param_convert":10,"funcOpen":0}`|
|3010|`{"type":3,"event_type":41,"finish_award":[[349808,1]],"award":[[101500,50]],"event_param_convert":10,"funcOpen":0}`|
|3011|`{"type":3,"event_type":41,"finish_award":[[349908,1]],"award":[[101500,50]],"event_param_convert":10,"funcOpen":0}`|
|3012|`{"type":3,"event_type":42,"finish_award":[[350308,1]],"award":[[101500,50]],"event_param_convert":5,"funcOpen":0}`|
|3013|`{"type":3,"event_type":46,"finish_award":[[347708,1]],"award":[[101500,50]],"event_param_convert":0,"funcOpen":1151}`|
|3014|`{"type":3,"event_type":58,"finish_award":[[357308,1]],"award":[[101500,50]],"event_param_convert":0,"funcOpen":1446}`|
|4001|`{"type":4,"event_type":13,"finish_award":[[304108,1]],"award":[[101500,50]],"event_param_convert":5,"funcOpen":0}`|
|4002|`{"type":4,"event_type":14,"finish_award":[[304008,1]],"award":[[101500,50]],"event_param_convert":0,"funcOpen":0}`|
|4003|`{"type":3,"event_type":11,"finish_award":[[304208,1]],"award":[[101500,50]],"event_param_convert":100,"funcOpen":0}`|
|4005|`{"type":4,"event_type":28,"finish_award":[[346108,1]],"award":[[101500,50]],"event_param_convert":0,"funcOpen":0}`|
|4006|`{"type":3,"event_type":37,"finish_award":[[348808,1]],"award":[[101500,50]],"event_param_convert":0,"funcOpen":1296}`|
|4007|`{"type":2,"event_type":38,"finish_award":[[348908,1]],"award":[[101500,50]],"event_param_convert":0,"funcOpen":1296}`|
|1001001|`{"type":1,"event_type":8,"finish_award":[[346708,1]],"award":[[101500,50]],"event_param_convert":1,"funcOpen":1040}`|
|1001002|`{"type":1,"event_type":18,"finish_award":[[346808,1]],"award":[[101500,50]],"event_param_convert":0,"funcOpen":1040}`|
|1001003|`{"type":1,"event_type":9,"finish_award":[[346608,1]],"award":[[101500,50]],"event_param_convert":0,"funcOpen":1064}`|
|1001004|`{"type":1,"event_type":26,"finish_award":[[346508,1]],"award":[[101500,50]],"event_param_convert":0,"funcOpen":1064}`|
|1002001|`{"type":2,"event_type":17,"finish_award":[[346308,1]],"award":[[101500,50]],"event_param_convert":[550801060],"funcOpen":1193}`|
|1002013|`{"type":2,"event_type":32,"finish_award":[[347508,1]],"award":[[101500,50]],"event_param_convert":0,"funcOpen":1151}`|
|1002014|`{"type":2,"event_type":32,"finish_award":[[347608,1]],"award":[[101500,50]],"event_param_convert":0,"funcOpen":1151}`|
|1002015|`{"type":3,"event_type":33,"finish_award":[[347708,1]],"award":[[101500,50]],"event_param_convert":0,"funcOpen":1151}`|
|2001001|`{"type":1,"event_type":49,"finish_award":[[352208,1]],"award":[[101500,50]],"event_param_convert":1,"funcOpen":1040}`|
|2001002|`{"type":1,"event_type":50,"finish_award":[[352308,1]],"award":[[101500,50]],"event_param_convert":0,"funcOpen":1040}`|
|2001003|`{"type":1,"event_type":51,"finish_award":[[352108,1]],"award":[[101500,50]],"event_param_convert":0,"funcOpen":1064}`|
|2001004|`{"type":1,"event_type":52,"finish_award":[[352008,1]],"award":[[101500,50]],"event_param_convert":0,"funcOpen":1064}`|
|3001001|`{"type":1,"event_type":54,"finish_award":[[354908,1]],"award":[[101500,50]],"event_param_convert":1,"funcOpen":1040}`|
|3001002|`{"type":1,"event_type":55,"finish_award":[[355008,1]],"award":[[101500,50]],"event_param_convert":0,"funcOpen":1040}`|
|3001003|`{"type":1,"event_type":56,"finish_award":[[354808,1]],"award":[[101500,50]],"event_param_convert":0,"funcOpen":1064}`|
|3001004|`{"type":1,"event_type":57,"finish_award":[[354708,1]],"award":[[101500,50]],"event_param_convert":0,"funcOpen":1064}`|

## EventType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|59|本表行键；与其他表同值不自动代表同一对象。|
|cross_stage|number|59|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cross_fun|number|59|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|unit|number|59|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|compare_rule|number|59|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"cross_stage":0}`|
|2|`{"cross_stage":0}`|
|3|`{"cross_stage":0}`|
|4|`{"cross_stage":0}`|
|5|`{"cross_stage":0}`|
|6|`{"cross_stage":0}`|
|7|`{"cross_stage":0}`|
|8|`{"cross_stage":1}`|
|9|`{"cross_stage":1}`|
|10|`{"cross_stage":0}`|
|11|`{"cross_stage":0}`|
|12|`{"cross_stage":0}`|
|13|`{"cross_stage":0}`|
|14|`{"cross_stage":0}`|
|15|`{"cross_stage":0}`|
|16|`{"cross_stage":0}`|
|17|`{"cross_stage":1}`|
|18|`{"cross_stage":1}`|
|19|`{"cross_stage":0}`|
|20|`{"cross_stage":0}`|
|21|`{"cross_stage":0}`|
|22|`{"cross_stage":0}`|
|23|`{"cross_stage":0}`|
|24|`{"cross_stage":0}`|
|25|`{"cross_stage":0}`|
|26|`{"cross_stage":1}`|
|27|`{"cross_stage":0}`|
|28|`{"cross_stage":0}`|
|29|`{"cross_stage":0}`|
|30|`{"cross_stage":0}`|
|31|`{"cross_stage":1}`|
|32|`{"cross_stage":1}`|
|33|`{"cross_stage":1}`|
|34|`{"cross_stage":1}`|
|35|`{"cross_stage":0}`|
|36|`{"cross_stage":0}`|
|37|`{"cross_stage":0}`|
|38|`{"cross_stage":0}`|
|39|`{"cross_stage":0}`|
|40|`{"cross_stage":0}`|
|41|`{"cross_stage":0}`|
|42|`{"cross_stage":1}`|
|43|`{"cross_stage":0}`|
|44|`{"cross_stage":0}`|
|45|`{"cross_stage":0}`|
|46|`{"cross_stage":0}`|
|47|`{"cross_stage":0}`|
|48|`{"cross_stage":0}`|
|49|`{"cross_stage":2}`|
|50|`{"cross_stage":2}`|
|51|`{"cross_stage":2}`|
|52|`{"cross_stage":2}`|
|53|`{"cross_stage":0}`|
|54|`{"cross_stage":3}`|
|55|`{"cross_stage":3}`|
|56|`{"cross_stage":3}`|
|57|`{"cross_stage":3}`|
|58|`{"cross_stage":0}`|
|59|`{"cross_stage":0}`|

## EventTimeSeparate

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|cross_time|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|server_time|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|17|`{"cross_time":1733778000,"server_time":0}`|
|32|`{"cross_time":1733778000,"server_time":0}`|
|33|`{"cross_time":1733778000,"server_time":0}`|
|45|`{"cross_time":0,"server_time":1733778000}`|
|46|`{"cross_time":0,"server_time":1733778000}`|
|48|`{"cross_time":0,"server_time":1733778000}`|

## Type

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|show_name|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
