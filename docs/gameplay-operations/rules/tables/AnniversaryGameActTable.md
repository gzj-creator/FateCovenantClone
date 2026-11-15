# AnniversaryGameActTable 规则参数

来源：[personal-server/assets/tables/AnniversaryGameActTable.data.lua.json.gz](../../../../personal-server/assets/tables/AnniversaryGameActTable.data.lua.json.gz)，SHA256：`b59fc8c5ad601371c722c35b3ad30fc2daadd75a49ca37ae594323c7e907e9f4`。

[完整逐行JSON](AnniversaryGameActTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[AnniversaryGameAct](#anniversarygameact)|4|decoded-rows|
|[Award](#award)|6|decoded-rows|
|[Version](#version)|5|decoded-rows|
|[PlayCard](#playcard)|12|decoded-rows|

## AnniversaryGameAct

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|score_range|array|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skip_score|array|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|game_time|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rank_type|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|58|`{"score_range":[0,10000],"skip_score":[4000,5000],"game_time":0,"rank_type":236}`|
|59|`{"score_range":[10000,30000],"skip_score":[25000,30000],"game_time":30000,"rank_type":235}`|
|60|`{"score_range":[0,10000],"skip_score":[4000,5000],"game_time":0,"rank_type":236}`|
|61|`{"score_range":[10000,30000],"skip_score":[25000,30000],"game_time":30000,"rank_type":235}`|

## Award

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|award|array|6|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|15801|`{"award":[[8801900,1000],[101500,100]]}`|
|15901|`{"award":[[8801900,1000],[101500,100]]}`|
|25901|`{"award":[[6821900,600],[101500,100]]}`|
|35901|`{"award":[[6821900,600],[101500,100]]}`|
|46001|`{"award":[[6821900,600],[101500,100]]}`|
|56101|`{"award":[[6821900,600],[101500,100]]}`|

## Version

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|award_times|number|5|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|card_count|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|open_type|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|games|array|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award_times":1,"card_count":30,"open_type":0}`|
|2|`{"award_times":1,"card_count":30,"open_type":1}`|
|3|`{"award_times":1,"card_count":30,"open_type":1}`|
|4|`{"award_times":1,"card_count":30,"open_type":1}`|
|5|`{"award_times":1,"card_count":30,"open_type":1}`|

## PlayCard

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|game|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|icon|string|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|12|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|
|6|`{}`|
|7|`{}`|
|8|`{}`|
|9|`{}`|
|10|`{}`|
|11|`{}`|
|12|`{}`|
