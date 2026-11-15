# LotteryTable 规则参数

来源：[personal-server/assets/tables/LotteryTable.data.lua.json.gz](../../../../personal-server/assets/tables/LotteryTable.data.lua.json.gz)，SHA256：`3c4670cf03974f7706914b916a00a33146f2d1efcb63724adade892cc62194b0`。

[完整逐行JSON](LotteryTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[PrizeType](#prizetype)|4|decoded-rows|
|[Item](#item)|4|decoded-rows|

## PrizeType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|name|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|

## Item

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|period_img|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_show|number|4|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|guarantee_tid|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|draw_lib|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|period|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|server_open_time|array|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|expire_time|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|100013400|`{"award_show":12001,"guarantee_tid":1,"draw_lib":3901,"server_open_time":[8,14],"expire_time":28}`|
|100023400|`{"award_show":12002,"guarantee_tid":1,"draw_lib":3901,"server_open_time":[15,22],"expire_time":36}`|
|100033400|`{"award_show":12003,"guarantee_tid":1,"draw_lib":3901,"server_open_time":[23,30],"expire_time":44}`|
|100043400|`{"award_show":12004,"guarantee_tid":1,"draw_lib":3901,"server_open_time":[31,9999],"expire_time":9999}`|
