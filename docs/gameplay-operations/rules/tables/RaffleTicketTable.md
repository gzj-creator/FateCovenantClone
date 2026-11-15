# RaffleTicketTable 规则参数

来源：[personal-server/assets/tables/RaffleTicketTable.data.lua.json.gz](../../../../personal-server/assets/tables/RaffleTicketTable.data.lua.json.gz)，SHA256：`b0713b92423eee6918bdb135822f0ed94989cc0c5161da0e361352f1b86d1da2`。

[完整逐行JSON](RaffleTicketTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Award](#award)|19|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[Achievement](#achievement)|5|decoded-rows|

## Award

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|award_n|number|19|奖励数量数组；零与缺字段分别保留。|
|award|number|19|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|type|number|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|19|本表行键；与其他表同值不自动代表同一对象。|
|banner|string|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|23|`{"award_n":20,"award":4371200,"type":4}`|
|24|`{"award_n":5,"award":3002,"type":4}`|
|25|`{"award_n":20,"award":4371200,"type":4}`|
|26|`{"award_n":5,"award":3002,"type":4}`|
|27|`{"award_n":40,"award":4371200,"type":4}`|
|1001|`{"award_n":80,"award":5001200,"type":0}`|
|1101|`{"award_n":1,"award":23002,"type":1}`|
|1102|`{"award_n":1,"award":22002,"type":1}`|
|1201|`{"award_n":2,"award":3002,"type":2}`|
|1202|`{"award_n":5,"award":2002,"type":2}`|
|1203|`{"award_n":888,"award":101500,"type":2}`|
|1301|`{"award_n":10,"award":179002,"type":3}`|
|1302|`{"award_n":2,"award":18002,"type":3}`|
|1303|`{"award_n":5,"award":21002,"type":3}`|
|1304|`{"award_n":100,"award":17002,"type":3}`|
|1305|`{"award_n":50,"award":391002,"type":3}`|
|1306|`{"award_n":5000,"award":157002,"type":3}`|
|1307|`{"award_n":10000,"award":101800,"type":3}`|
|1308|`{"award_n":10000,"award":201500,"type":3}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|sec_award|number|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|show_best_award|number|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|special_award|number|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|draw_lib|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|show_sec_award|array|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|help_id|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|third_award|number|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|show_first_award|array|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|first_award|number|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|show_third_award|array|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|show_group|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_spec_award|array|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"sec_award":112,"show_best_award":1001,"special_award":110,"draw_lib":23,"show_sec_award":[1201,1202,1203],"third_award":113,"show_first_award":[1101,1102],"first_award":111,"show_third_award":[1301,1302,1303,1304,1305,1306,1307,1308],"show_group":[110],"show_spec_award":[23,24,25,26,27]}`|

## Achievement

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|award|array|5|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|condition|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award":[[4371200,20]],"condition":25}`|
|2|`{"award":[[3002,5]],"condition":50}`|
|3|`{"award":[[4371200,20]],"condition":80}`|
|4|`{"award":[[3002,5]],"condition":110}`|
|5|`{"award":[[4371200,40]],"condition":150}`|
