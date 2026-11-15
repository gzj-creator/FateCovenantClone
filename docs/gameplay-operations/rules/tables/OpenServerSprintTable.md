# OpenServerSprintTable 规则参数

来源：[personal-server/assets/tables/OpenServerSprintTable.data.lua.json.gz](../../../../personal-server/assets/tables/OpenServerSprintTable.data.lua.json.gz)，SHA256：`374445cc2fab6b15d3587afbf1169fc1a9b7882b69e4f8f6c1c69963b4ddcbe7`。

[完整逐行JSON](OpenServerSprintTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[SprintTaskType](#sprinttasktype)|43|decoded-rows|
|[SprintTask](#sprinttask)|128|decoded-rows|
|[SprintUseItemAddScore](#sprintuseitemaddscore)|48|decoded-rows|
|[SprintServerSplit](#sprintserversplit)|2|decoded-rows|
|[SprintAward](#sprintaward)|3551|decoded-rows|
|[SprintCustomShow](#sprintcustomshow)|33|rows-with-external-references|
|[SprintConst](#sprintconst)|1|decoded-rows|
|[StrategyPower](#strategypower)|5|decoded-rows|
|[SprintRankTask](#sprintranktask)|1262|decoded-rows|
|[SprintArenaContestRankAwardEX](#sprintarenacontestrankawardex)|39|decoded-rows|
|[SprintUpRankCondition](#sprintuprankcondition)|1|decoded-rows|
|[SprintServerActivity](#sprintserveractivity)|19|decoded-rows|
|[SprintGift](#sprintgift)|113|rows-with-external-references|
|[SprintType](#sprinttype)|52|rows-with-external-references|
|[StrategyRes](#strategyres)|5|decoded-rows|
|[StrategyTeam](#strategyteam)|7|decoded-rows|

## SprintTaskType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|43|本表行键；与其他表同值不自动代表同一对象。|
|txt|number|43|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|activity|number|43|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|0|`{}`|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|
|6|`{}`|
|7|`{}`|
|33001|`{}`|
|33002|`{}`|
|33003|`{}`|
|33004|`{}`|
|33011|`{}`|
|34001|`{}`|
|34002|`{}`|
|34003|`{}`|
|34004|`{}`|
|35001|`{}`|
|35002|`{}`|
|35003|`{}`|
|35004|`{}`|
|36011|`{}`|
|37001|`{}`|
|37002|`{}`|
|37003|`{}`|
|37004|`{}`|
|39001|`{}`|
|39002|`{}`|
|39003|`{}`|
|39004|`{}`|
|42001|`{}`|
|42002|`{}`|
|42003|`{}`|
|42004|`{}`|
|48001|`{}`|
|48002|`{}`|
|48003|`{}`|
|48004|`{}`|
|49011|`{}`|
|53001|`{}`|
|53002|`{}`|
|53003|`{}`|
|53004|`{}`|

## SprintTask

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|task_value|number|128|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_receive_log|boolean|128|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|128|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|rank_score|number|128|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|128|本表行键；与其他表同值不自动代表同一对象。|
|receive_limit|number|128|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|des|number|128|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{"task_value":10,"award":[[201500,1]],"rank_score":0,"receive_limit":2}`|
|1002|`{"task_value":20,"award":[[201500,1]],"rank_score":0,"receive_limit":2}`|
|1003|`{"task_value":30,"award":[[201500,1]],"rank_score":0,"receive_limit":2}`|
|1004|`{"task_value":50,"award":[[201500,1]],"rank_score":0,"receive_limit":50}`|
|1005|`{"task_value":60,"award":[[201500,1]],"rank_score":0,"receive_limit":60}`|
|1006|`{"task_value":80,"award":[[201500,1]],"rank_score":0,"receive_limit":80}`|
|1007|`{"task_value":100,"award":[[201500,1]],"rank_score":0,"receive_limit":100}`|
|1008|`{"task_value":120,"award":[[201500,1]],"rank_score":0,"receive_limit":120}`|
|1009|`{"task_value":150,"award":[[201500,1]],"rank_score":0,"receive_limit":150}`|
|1010|`{"task_value":200,"award":[[201500,1]],"rank_score":0,"receive_limit":200}`|
|3001|`{"task_value":500,"award":[[201500,1]],"rank_score":0,"receive_limit":500}`|
|3002|`{"task_value":800,"award":[[201500,1]],"rank_score":0,"receive_limit":800}`|
|3003|`{"task_value":1000,"award":[[201500,1]],"rank_score":0,"receive_limit":1000}`|
|3004|`{"task_value":1200,"award":[[201500,1]],"rank_score":0,"receive_limit":1200}`|
|3005|`{"task_value":2000,"award":[[201500,1]],"rank_score":0,"receive_limit":2000}`|
|3006|`{"task_value":3000,"award":[[201500,1]],"rank_score":0,"receive_limit":3000}`|
|3007|`{"task_value":4000,"award":[[201500,1]],"rank_score":0,"receive_limit":4000}`|
|3008|`{"task_value":5000,"award":[[201500,1]],"rank_score":0,"receive_limit":5000}`|
|3009|`{"task_value":7000,"award":[[201500,1]],"rank_score":0,"receive_limit":7000}`|
|3010|`{"task_value":10000,"award":[[201500,1]],"rank_score":0,"receive_limit":10000}`|
|4001|`{"task_value":1500,"award":[[201500,1]],"rank_score":0,"receive_limit":1500}`|
|4002|`{"task_value":2000,"award":[[201500,1]],"rank_score":0,"receive_limit":2000}`|
|4003|`{"task_value":3000,"award":[[201500,1]],"rank_score":0,"receive_limit":3000}`|
|4004|`{"task_value":4000,"award":[[201500,1]],"rank_score":0,"receive_limit":4000}`|
|4005|`{"task_value":4500,"award":[[201500,1]],"rank_score":0,"receive_limit":4500}`|
|4006|`{"task_value":5000,"award":[[201500,1]],"rank_score":0,"receive_limit":5000}`|
|4007|`{"task_value":6000,"award":[[201500,1]],"rank_score":0,"receive_limit":6000}`|
|4008|`{"task_value":8000,"award":[[201500,1]],"rank_score":0,"receive_limit":8000}`|
|4009|`{"task_value":10000,"award":[[201500,1]],"rank_score":0,"receive_limit":10000}`|
|4010|`{"task_value":12000,"award":[[201500,1]],"rank_score":0,"receive_limit":12000}`|
|4011|`{"task_value":13000,"award":[[201500,1]],"rank_score":0,"receive_limit":13000}`|
|6001|`{"task_value":50,"award":[[201500,1]],"rank_score":0,"receive_limit":50}`|
|6002|`{"task_value":100,"award":[[201500,1]],"rank_score":0,"receive_limit":100}`|
|6003|`{"task_value":200,"award":[[201500,1]],"rank_score":0,"receive_limit":200}`|
|6004|`{"task_value":260,"award":[[201500,1]],"rank_score":0,"receive_limit":260}`|
|6005|`{"task_value":320,"award":[[201500,1]],"rank_score":0,"receive_limit":320}`|
|6006|`{"task_value":400,"award":[[201500,1]],"rank_score":0,"receive_limit":400}`|
|6007|`{"task_value":450,"award":[[201500,1]],"rank_score":0,"receive_limit":450}`|
|6008|`{"task_value":480,"award":[[201500,1]],"rank_score":0,"receive_limit":480}`|
|6009|`{"task_value":500,"award":[[201500,1]],"rank_score":0,"receive_limit":500}`|
|6010|`{"task_value":530,"award":[[201500,1]],"rank_score":0,"receive_limit":530}`|
|6011|`{"task_value":560,"award":[[201500,1]],"rank_score":0,"receive_limit":560}`|
|6012|`{"task_value":600,"award":[[201500,1]],"rank_score":0,"receive_limit":600}`|
|6013|`{"task_value":650,"award":[[201500,1]],"rank_score":0,"receive_limit":650}`|
|6014|`{"task_value":700,"award":[[201500,1]],"rank_score":0,"receive_limit":700}`|
|7001|`{"task_value":300000,"award":[[201500,1]],"rank_score":0,"receive_limit":0}`|
|7002|`{"task_value":500000,"award":[[201500,1]],"rank_score":0,"receive_limit":0}`|
|7003|`{"task_value":800000,"award":[[201500,1]],"rank_score":0,"receive_limit":0}`|
|7004|`{"task_value":1000000,"award":[[201500,1]],"rank_score":0,"receive_limit":0}`|
|7005|`{"task_value":1200000,"award":[[201500,1]],"rank_score":0,"receive_limit":0}`|
|7006|`{"task_value":1500000,"award":[[201500,1]],"rank_score":0,"receive_limit":1000}`|
|7007|`{"task_value":1800000,"award":[[201500,1]],"rank_score":0,"receive_limit":800}`|
|7008|`{"task_value":2000000,"award":[[201500,1]],"rank_score":0,"receive_limit":600}`|
|7009|`{"task_value":2200000,"award":[[201500,1]],"rank_score":0,"receive_limit":500}`|
|7010|`{"task_value":2400000,"award":[[201500,1]],"rank_score":0,"receive_limit":400}`|
|7011|`{"task_value":2700000,"award":[[201500,1]],"rank_score":0,"receive_limit":300}`|
|7012|`{"task_value":3000000,"award":[[201500,1]],"rank_score":0,"receive_limit":200}`|
|7013|`{"task_value":3500000,"award":[[201500,1]],"rank_score":0,"receive_limit":150}`|
|7014|`{"task_value":4000000,"award":[[201500,1]],"rank_score":0,"receive_limit":100}`|
|7015|`{"task_value":5000000,"award":[[201500,1]],"rank_score":0,"receive_limit":50}`|
|8001|`{"task_value":300000,"award":[[201500,1]],"rank_score":0,"receive_limit":300000}`|
|8002|`{"task_value":500000,"award":[[201500,1]],"rank_score":0,"receive_limit":500000}`|
|8003|`{"task_value":800000,"award":[[201500,1]],"rank_score":0,"receive_limit":800000}`|
|11001|`{"task_value":50,"award":[[157002,20000]],"rank_score":0,"receive_limit":9999999}`|
|11002|`{"task_value":100,"award":[[17002,500]],"rank_score":0,"receive_limit":9999999}`|
|11003|`{"task_value":200,"award":[[18002,20]],"rank_score":0,"receive_limit":9999999}`|
|11004|`{"task_value":400,"award":[[18002,30]],"rank_score":0,"receive_limit":9999999}`|
|11005|`{"task_value":600,"award":[[19002,1]],"rank_score":0,"receive_limit":9999999}`|
|12001|`{"task_value":50,"award":[[157002,30000]],"rank_score":0,"receive_limit":9999999}`|
|12002|`{"task_value":100,"award":[[17002,600]],"rank_score":0,"receive_limit":9999999}`|
|12003|`{"task_value":200,"award":[[18002,20]],"rank_score":0,"receive_limit":9999999}`|
|12004|`{"task_value":400,"award":[[18002,30]],"rank_score":0,"receive_limit":9999999}`|
|12005|`{"task_value":600,"award":[[19002,1]],"rank_score":0,"receive_limit":9999999}`|
|14001|`{"task_value":50,"award":[[157002,30000]],"rank_score":0,"receive_limit":9999999}`|
|14002|`{"task_value":100,"award":[[17002,600]],"rank_score":0,"receive_limit":9999999}`|
|14003|`{"task_value":200,"award":[[18002,20]],"rank_score":0,"receive_limit":9999999}`|
|14004|`{"task_value":400,"award":[[18002,30]],"rank_score":0,"receive_limit":9999999}`|
|14005|`{"task_value":600,"award":[[19002,1]],"rank_score":0,"receive_limit":9999999}`|
|17001|`{"task_value":50,"award":[[157002,30000]],"rank_score":0,"receive_limit":9999999}`|
|17002|`{"task_value":100,"award":[[17002,600]],"rank_score":0,"receive_limit":9999999}`|
|17003|`{"task_value":200,"award":[[18002,20]],"rank_score":0,"receive_limit":9999999}`|
|17004|`{"task_value":400,"award":[[18002,30]],"rank_score":0,"receive_limit":9999999}`|
|17005|`{"task_value":600,"award":[[19002,1]],"rank_score":0,"receive_limit":9999999}`|
|19001|`{"task_value":50,"award":[[157002,30000]],"rank_score":0,"receive_limit":9999999}`|
|19002|`{"task_value":100,"award":[[17002,600]],"rank_score":0,"receive_limit":9999999}`|
|19003|`{"task_value":200,"award":[[18002,20]],"rank_score":0,"receive_limit":9999999}`|
|19004|`{"task_value":400,"award":[[18002,30]],"rank_score":0,"receive_limit":9999999}`|
|19005|`{"task_value":600,"award":[[19002,1]],"rank_score":0,"receive_limit":9999999}`|
|21001|`{"task_value":50,"award":[[157002,30000]],"rank_score":0,"receive_limit":9999999}`|
|21002|`{"task_value":100,"award":[[17002,600]],"rank_score":0,"receive_limit":9999999}`|
|21003|`{"task_value":200,"award":[[18002,20]],"rank_score":0,"receive_limit":9999999}`|
|21004|`{"task_value":400,"award":[[18002,30]],"rank_score":0,"receive_limit":9999999}`|
|21005|`{"task_value":600,"award":[[19002,1]],"rank_score":0,"receive_limit":9999999}`|
|22001|`{"task_value":50,"award":[[157002,30000]],"rank_score":0,"receive_limit":9999999}`|
|22002|`{"task_value":100,"award":[[17002,600]],"rank_score":0,"receive_limit":9999999}`|
|22003|`{"task_value":200,"award":[[18002,20]],"rank_score":0,"receive_limit":9999999}`|
|22004|`{"task_value":400,"award":[[18002,30]],"rank_score":0,"receive_limit":9999999}`|
|22005|`{"task_value":600,"award":[[19002,1]],"rank_score":0,"receive_limit":9999999}`|
|25001|`{"task_value":50,"award":[[157002,20000]],"rank_score":0,"receive_limit":9999999}`|
|25002|`{"task_value":100,"award":[[17002,500]],"rank_score":0,"receive_limit":9999999}`|
|25003|`{"task_value":200,"award":[[18002,20]],"rank_score":0,"receive_limit":9999999}`|
|25004|`{"task_value":400,"award":[[18002,30]],"rank_score":0,"receive_limit":9999999}`|
|25005|`{"task_value":600,"award":[[19002,1]],"rank_score":0,"receive_limit":9999999}`|
|26001|`{"task_value":50,"award":[[157002,30000]],"rank_score":0,"receive_limit":9999999}`|
|26002|`{"task_value":100,"award":[[17002,600]],"rank_score":0,"receive_limit":9999999}`|
|26003|`{"task_value":200,"award":[[18002,20]],"rank_score":0,"receive_limit":9999999}`|
|26004|`{"task_value":400,"award":[[18002,30]],"rank_score":0,"receive_limit":9999999}`|
|26005|`{"task_value":600,"award":[[19002,1]],"rank_score":0,"receive_limit":9999999}`|
|45001|`{"task_value":50,"award":[[157002,20000]],"rank_score":0,"receive_limit":9999999}`|
|45002|`{"task_value":100,"award":[[17002,500]],"rank_score":0,"receive_limit":9999999}`|
|45003|`{"task_value":200,"award":[[18002,20]],"rank_score":0,"receive_limit":9999999}`|
|45004|`{"task_value":400,"award":[[18002,30]],"rank_score":0,"receive_limit":9999999}`|
|45005|`{"task_value":600,"award":[[19002,1]],"rank_score":0,"receive_limit":9999999}`|
|46001|`{"task_value":50,"award":[[157002,30000]],"rank_score":0,"receive_limit":9999999}`|
|46002|`{"task_value":100,"award":[[17002,600]],"rank_score":0,"receive_limit":9999999}`|
|46003|`{"task_value":200,"award":[[18002,20]],"rank_score":0,"receive_limit":9999999}`|
|46004|`{"task_value":400,"award":[[18002,30]],"rank_score":0,"receive_limit":9999999}`|
|46005|`{"task_value":600,"award":[[19002,1]],"rank_score":0,"receive_limit":9999999}`|
|52001|`{"task_value":50,"award":[[157002,20000]],"rank_score":0,"receive_limit":9999999}`|
|52002|`{"task_value":100,"award":[[17002,500]],"rank_score":0,"receive_limit":9999999}`|
|52003|`{"task_value":200,"award":[[18002,20]],"rank_score":0,"receive_limit":9999999}`|
|52004|`{"task_value":400,"award":[[18002,30]],"rank_score":0,"receive_limit":9999999}`|
|52005|`{"task_value":600,"award":[[19002,1]],"rank_score":0,"receive_limit":9999999}`|
|57001|`{"task_value":50,"award":[[157002,30000]],"rank_score":0,"receive_limit":9999999}`|
|57002|`{"task_value":100,"award":[[17002,600]],"rank_score":0,"receive_limit":9999999}`|
|57003|`{"task_value":200,"award":[[18002,20]],"rank_score":0,"receive_limit":9999999}`|
|57004|`{"task_value":400,"award":[[18002,30]],"rank_score":0,"receive_limit":9999999}`|
|57005|`{"task_value":600,"award":[[19002,1]],"rank_score":0,"receive_limit":9999999}`|

## SprintUseItemAddScore

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|48|本表行键；与其他表同值不自动代表同一对象。|
|add|number|48|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|item|number|48|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|48|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"item":2002,"type":33}`|
|2|`{"item":3002,"type":33}`|
|3|`{"item":808002,"type":33}`|
|4|`{"item":813002,"type":33}`|
|5|`{"item":814002,"type":33}`|
|6|`{"item":174102,"type":33}`|
|7|`{"item":2002,"type":34}`|
|8|`{"item":3002,"type":34}`|
|9|`{"item":808002,"type":34}`|
|10|`{"item":813002,"type":34}`|
|11|`{"item":814002,"type":34}`|
|12|`{"item":174102,"type":34}`|
|13|`{"item":2002,"type":35}`|
|14|`{"item":3002,"type":35}`|
|15|`{"item":808002,"type":35}`|
|16|`{"item":813002,"type":35}`|
|17|`{"item":814002,"type":35}`|
|18|`{"item":174102,"type":35}`|
|19|`{"item":2002,"type":37}`|
|20|`{"item":3002,"type":37}`|
|21|`{"item":808002,"type":37}`|
|22|`{"item":174402,"type":37}`|
|23|`{"item":817002,"type":37}`|
|24|`{"item":174102,"type":37}`|
|25|`{"item":2002,"type":39}`|
|26|`{"item":3002,"type":39}`|
|27|`{"item":808002,"type":39}`|
|28|`{"item":813002,"type":39}`|
|29|`{"item":814002,"type":39}`|
|30|`{"item":174102,"type":39}`|
|31|`{"item":2002,"type":42}`|
|32|`{"item":3002,"type":42}`|
|33|`{"item":808002,"type":42}`|
|34|`{"item":174402,"type":42}`|
|35|`{"item":817002,"type":42}`|
|36|`{"item":174102,"type":42}`|
|37|`{"item":2002,"type":48}`|
|38|`{"item":3002,"type":48}`|
|39|`{"item":808002,"type":48}`|
|40|`{"item":174402,"type":48}`|
|41|`{"item":817002,"type":48}`|
|42|`{"item":174202,"type":48}`|
|43|`{"item":2002,"type":53}`|
|44|`{"item":3002,"type":53}`|
|45|`{"item":808002,"type":53}`|
|46|`{"item":174302,"type":53}`|
|47|`{"item":817002,"type":53}`|
|48|`{"item":835802,"type":53}`|

## SprintServerSplit

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|double_act|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|single_act|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|divine_act|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|quattuor_act|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1040|`{}`|
|1064|`{}`|

## SprintAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3551|本表行键；与其他表同值不自动代表同一对象。|
|award|array|3551|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|rank|number|3551|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部3551行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{"award":[[201500,1]],"rank":1}`|
|1002|`{"award":[[201500,1]],"rank":2}`|
|1003|`{"award":[[201500,1]],"rank":3}`|

## SprintCustomShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|open_func|undefined/object|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|not_same_task_merge|boolean|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|big_award|number|33|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|big_award_img_scale|undefined|33|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|tid|number|33|本表行键；与其他表同值不自动代表同一对象。|
|big_award_img_pos|undefined|33|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|big_award_img|string|33|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|is_hide_treasure|boolean|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|big_award_desc_name|number|33|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|help|number|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rank_desc|number|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|gift_tip|number|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|24|`{"not_same_task_merge":false,"big_award":300610,"big_award_img":"","is_hide_treasure":false,"big_award_desc_name":6505003,"rank_desc":0}`|
|25|`{"not_same_task_merge":false,"big_award":300610,"big_award_img":"","is_hide_treasure":false,"big_award_desc_name":6505003,"rank_desc":0}`|
|26|`{"not_same_task_merge":false,"big_award":300610,"big_award_img":"","is_hide_treasure":false,"big_award_desc_name":6505003,"rank_desc":0}`|
|27|`{"not_same_task_merge":false,"big_award":300610,"big_award_img":"","is_hide_treasure":false,"big_award_desc_name":6505003,"rank_desc":0}`|
|28|`{"open_func":{"reference":"OpenServerSprintHeroMainForm.StaticOpen"},"not_same_task_merge":false,"big_award":300710,"big_award_img":"img_hd_dj_wuqiliandao.png","is_hide_treasure":false,"big_award_desc_name":6505004,"rank_desc":0}`|
|29|`{"open_func":{"reference":"OpenServerSprintPetMainForm.StaticOpen"},"not_same_task_merge":false,"big_award":300710,"big_award_img":"img_hd_dj_wuqiliandao.png","is_hide_treasure":false,"big_award_desc_name":6505004,"rank_desc":0}`|
|30|`{"open_func":{"reference":"OpenServerSprintElvesMainForm.StaticOpen"},"not_same_task_merge":false,"big_award":300910,"big_award_img":"img_hd_dj_wuqilanjian.png","is_hide_treasure":false,"big_award_desc_name":6505005,"rank_desc":0}`|
|31|`{"open_func":{"reference":"OpenServerSprintArenaMainForm.StaticOpen"},"not_same_task_merge":false,"big_award":300810,"big_award_img":"img_hd_dj_wuqishuqing.png","is_hide_treasure":false,"big_award_desc_name":6501028,"rank_desc":0}`|
|32|`{"open_func":{"reference":"OpenServerSprintRecruitForm.StaticOpen"},"not_same_task_merge":true,"big_award":140217,"big_award_img":"","is_hide_treasure":false,"big_award_desc_name":680506,"rank_desc":680483}`|
|33|`{"open_func":{"reference":"OpenServerSprintRecruitForm.StaticOpen"},"not_same_task_merge":false,"big_award":300710,"big_award_img":"","is_hide_treasure":false,"big_award_desc_name":6505004,"rank_desc":680484}`|
|34|`{"open_func":{"reference":"OpenServerSprintRecruitForm.StaticOpen"},"not_same_task_merge":false,"big_award":300710,"big_award_img":"","is_hide_treasure":false,"big_award_desc_name":6505004,"rank_desc":680484}`|
|35|`{"open_func":{"reference":"OpenServerSprintRecruitForm.StaticOpen"},"not_same_task_merge":false,"big_award":300710,"big_award_img":"","is_hide_treasure":false,"big_award_desc_name":6505004,"rank_desc":680484}`|
|36|`{"open_func":{"reference":"OpenServerSprintRecruitForm.StaticOpen"},"not_same_task_merge":true,"big_award":0,"big_award_img":"","is_hide_treasure":false,"big_award_desc_name":0,"rank_desc":680483}`|
|37|`{"open_func":{"reference":"OpenServerSprintRecruitForm.StaticOpen"},"not_same_task_merge":false,"big_award":0,"big_award_img":"","is_hide_treasure":false,"big_award_desc_name":0,"rank_desc":680484}`|
|38|`{"open_func":{"reference":"OpenServerSprintPetMainForm.StaticOpen"},"not_same_task_merge":false,"big_award":300710,"big_award_img":"img_hd_dj_wuqiliandao.png","is_hide_treasure":false,"big_award_desc_name":6505004,"rank_desc":0}`|
|39|`{"open_func":{"reference":"OpenServerSprintRecruitForm.StaticOpen"},"not_same_task_merge":false,"big_award":300710,"big_award_img":"","is_hide_treasure":false,"big_award_desc_name":6505004,"rank_desc":680484}`|
|41|`{"open_func":{"reference":"OpenServerSprintElvesMainForm.StaticOpen"},"not_same_task_merge":false,"big_award":300910,"big_award_img":"img_hd_dj_wuqilanjian.png","is_hide_treasure":false,"big_award_desc_name":6505005,"rank_desc":0}`|
|42|`{"open_func":{"reference":"OpenServerSprintRecruitForm.StaticOpen"},"not_same_task_merge":false,"big_award":300710,"big_award_img":"","is_hide_treasure":false,"big_award_desc_name":6505004,"rank_desc":680484}`|
|43|`{"open_func":{"reference":"OpenServerSprintArenaMainForm.StaticOpen"},"not_same_task_merge":false,"big_award":0,"big_award_img":"","is_hide_treasure":false,"big_award_desc_name":0,"rank_desc":0}`|
|44|`{"not_same_task_merge":false,"big_award":0,"big_award_img":"","is_hide_treasure":false,"big_award_desc_name":0,"rank_desc":0}`|
|45|`{"not_same_task_merge":false,"big_award":0,"big_award_img":"","is_hide_treasure":false,"big_award_desc_name":0,"rank_desc":0}`|
|46|`{"not_same_task_merge":false,"big_award":0,"big_award_img":"","is_hide_treasure":false,"big_award_desc_name":0,"rank_desc":0}`|
|47|`{"not_same_task_merge":false,"big_award":0,"big_award_img":"","is_hide_treasure":false,"big_award_desc_name":0,"rank_desc":0}`|
|48|`{"open_func":{"reference":"OpenServerSprintRecruitForm.StaticOpen"},"not_same_task_merge":false,"big_award":0,"big_award_img":"","is_hide_treasure":false,"big_award_desc_name":0,"rank_desc":680484}`|
|49|`{"open_func":{"reference":"OpenServerSprintRecruitForm.StaticOpen"},"not_same_task_merge":true,"big_award":0,"big_award_img":"","is_hide_treasure":false,"big_award_desc_name":0,"rank_desc":680483}`|
|50|`{"open_func":{"reference":"OpenServerSprintPetMainForm.StaticOpen"},"not_same_task_merge":false,"big_award":400210,"big_award_img":"img_hd_dj_wuqihuandao.png","is_hide_treasure":true,"big_award_desc_name":7900037,"rank_desc":0}`|
|51|`{"not_same_task_merge":false,"big_award":0,"big_award_img":"","is_hide_treasure":false,"big_award_desc_name":0,"rank_desc":0}`|
|52|`{"not_same_task_merge":false,"big_award":0,"big_award_img":"","is_hide_treasure":false,"big_award_desc_name":0,"rank_desc":0}`|
|53|`{"open_func":{"reference":"OpenServerSprintRecruitForm.StaticOpen"},"not_same_task_merge":false,"big_award":0,"big_award_img":"","is_hide_treasure":false,"big_award_desc_name":0,"rank_desc":680484}`|
|54|`{"open_func":{"reference":"OpenServerSprintElvesMainForm.StaticOpen"},"not_same_task_merge":false,"big_award":400210,"big_award_img":"img_hd_dj_wuqihuandao.png","is_hide_treasure":true,"big_award_desc_name":7900037,"rank_desc":0}`|
|55|`{"open_func":{"reference":"OpenServerSprintArenaMainForm.StaticOpen"},"not_same_task_merge":false,"big_award":0,"big_award_img":"","is_hide_treasure":false,"big_award_desc_name":0,"rank_desc":0}`|
|56|`{"not_same_task_merge":false,"big_award":0,"big_award_img":"","is_hide_treasure":false,"big_award_desc_name":0,"rank_desc":0}`|
|57|`{"not_same_task_merge":false,"big_award":0,"big_award_img":"","is_hide_treasure":false,"big_award_desc_name":0,"rank_desc":0}`|

## SprintConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|default_range|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_player_num|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|1|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|show_cd|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|jump_rank|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|badge_statistics|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rank_integral|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"task_player_num":10,"award":[[300210,1],[300310,1],[300410,1]],"jump_rank":10,"rank_integral":5401900}`|

## StrategyPower

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|icon|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skip|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|title|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|des|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|6|`{}`|

## SprintRankTask

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|task_count|number|1262|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|1262|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|task_type|number|1262|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|1262|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1262|本表行键；与其他表同值不自动代表同一对象。|
|reset_type|number|1262|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sub_type|number|1262|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rank_score_item|number|1262|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rank_score|number|1262|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_param|number|1262|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部1262行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|28001|`{"task_count":1,"award":[[101500,20]],"task_type":15509,"type":28,"reset_type":0,"sub_type":0,"rank_score_item":1581000,"rank_score":1,"task_param":0}`|
|28002|`{"task_count":2,"award":[[101500,20]],"task_type":15509,"type":28,"reset_type":0,"sub_type":0,"rank_score_item":1581000,"rank_score":1,"task_param":0}`|
|28003|`{"task_count":3,"award":[[101500,20]],"task_type":15509,"type":28,"reset_type":0,"sub_type":0,"rank_score_item":1581000,"rank_score":1,"task_param":0}`|

## SprintArenaContestRankAwardEX

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|39|本表行键；与其他表同值不自动代表同一对象。|
|award|array|39|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award":[[5401900,20]]}`|
|2|`{"award":[[5401900,18]]}`|
|3|`{"award":[[5401900,15]]}`|
|4|`{"award":[[5401900,10]]}`|
|5|`{"award":[[5401900,8]]}`|
|6|`{"award":[]}`|
|7|`{"award":[]}`|
|8|`{"award":[]}`|
|9|`{"award":[]}`|
|101|`{"award":[[5401900,20]]}`|
|102|`{"award":[[5401900,18]]}`|
|103|`{"award":[[5401900,15]]}`|
|104|`{"award":[[5401900,10]]}`|
|105|`{"award":[[5401900,8]]}`|
|106|`{"award":[]}`|
|107|`{"award":[]}`|
|108|`{"award":[]}`|
|109|`{"award":[]}`|
|110|`{"award":[]}`|
|201|`{"award":[[5401900,20]]}`|
|202|`{"award":[[5401900,18]]}`|
|203|`{"award":[[5401900,15]]}`|
|204|`{"award":[[5401900,10]]}`|
|205|`{"award":[[5401900,8]]}`|
|206|`{"award":[]}`|
|207|`{"award":[]}`|
|208|`{"award":[]}`|
|209|`{"award":[]}`|
|210|`{"award":[]}`|
|301|`{"award":[[5401900,20]]}`|
|302|`{"award":[[5401900,18]]}`|
|303|`{"award":[[5401900,15]]}`|
|304|`{"award":[[5401900,10]]}`|
|305|`{"award":[[5401900,8]]}`|
|306|`{"award":[]}`|
|307|`{"award":[]}`|
|308|`{"award":[]}`|
|309|`{"award":[]}`|
|310|`{"award":[]}`|

## SprintUpRankCondition

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|value|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|51|`{"value":260}`|

## SprintServerActivity

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|19|本表行键；与其他表同值不自动代表同一对象。|
|award|array|19|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|12010|`{"award":[[25400204,0],[429002,0],[392002,0]]}`|
|12011|`{"award":[[400808,0],[430002,0],[3002,0],[2001900,0]]}`|
|12012|`{"award":[[200608,0],[25400204,0],[429002,0],[2001900,0]]}`|
|12013|`{"award":[[201808,0],[25400204,0],[429002,0],[2001900,0]]}`|
|12014|`{"award":[[7002002,0],[3002,0],[392002,0]]}`|
|12015|`{"award":[[400808,0],[7002002,0],[3002,0],[2001900,0]]}`|
|12016|`{"award":[[200608,0],[7002002,0],[3002,0],[2001900,0]]}`|
|12017|`{"award":[[201808,0],[7002002,0],[3002,0],[2001900,0]]}`|
|13011|`{"award":[[400608,0],[636002,0],[2291200,0],[101900,0]]}`|
|13012|`{"award":[[25400204,0],[429002,0],[801900,0]]}`|
|13013|`{"award":[[203708,0],[25400204,0],[429002,0],[1881200,0]]}`|
|13014|`{"award":[[204008,0],[25400204,0],[429002,0],[1881200,0]]}`|
|13015|`{"award":[[400608,0],[7002002,0],[2291200,0],[101900,0]]}`|
|13016|`{"award":[[7002002,0],[3002,0],[801900,0]]}`|
|13017|`{"award":[[203708,0],[7002002,0],[3002,0],[1881200,0]]}`|
|13018|`{"award":[[204008,0],[7002002,0],[3002,0],[1881200,0]]}`|
|180011|`{"award":[[25400204,0],[3051200,0],[392002,0]]}`|
|180014|`{"award":[[25400204,0],[3051200,0],[392002,0]]}`|
|180015|`{"award":[[7002002,0],[3051200,0],[392002,0]]}`|

## SprintGift

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|recharge|number|113|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|relation_act|number|113|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|buy_func|object|113|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sprint_type|number|113|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|113|本表行键；与其他表同值不自动代表同一对象。|
|success_evt|object|113|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|gift_template|number|113|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sub_type|number|113|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|buy_info_func|object|113|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|order|number|113|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|2801|`{"buy_func":{"reference":"OpenServerSprintMgr.RechargeGift"},"sprint_type":28,"sub_type":1,"buy_info_func":{"reference":"OpenServerSprintMgr.GetGiftBuyInfo"}}`|
|2802|`{"buy_func":{"reference":"DailyDiscountMgr.RechargeGift"},"sprint_type":28,"sub_type":1,"buy_info_func":{"reference":"DailyDiscountMgr.GetGiftBuyInfo"}}`|
|2803|`{"buy_func":{"reference":"DailyDiscountMgr.RechargeGift"},"sprint_type":28,"sub_type":1,"buy_info_func":{"reference":"DailyDiscountMgr.GetGiftBuyInfo"}}`|
|2804|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":28,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|2805|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":28,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|2806|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":28,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|2807|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":28,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|2808|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":28,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|2809|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":28,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|2901|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":29,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|2902|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":29,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|3001|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":30,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|3002|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":30,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|3301|`{"buy_func":{"reference":"OpenServerSprintMgr.RechargeGift"},"sprint_type":33,"sub_type":1,"buy_info_func":{"reference":"OpenServerSprintMgr.GetGiftBuyInfo"}}`|
|3302|`{"buy_func":{"reference":"DailyDiscountMgr.RechargeGift"},"sprint_type":33,"sub_type":1,"buy_info_func":{"reference":"DailyDiscountMgr.GetGiftBuyInfo"}}`|
|3303|`{"buy_func":{"reference":"DailyDiscountMgr.RechargeGift"},"sprint_type":33,"sub_type":1,"buy_info_func":{"reference":"DailyDiscountMgr.GetGiftBuyInfo"}}`|
|3304|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":33,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|3305|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":33,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|3306|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":33,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|3307|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":33,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|3308|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":33,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|3309|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":33,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|3401|`{"buy_func":{"reference":"OpenServerSprintMgr.RechargeGift"},"sprint_type":34,"sub_type":1,"buy_info_func":{"reference":"OpenServerSprintMgr.GetGiftBuyInfo"}}`|
|3402|`{"buy_func":{"reference":"DailyDiscountMgr.RechargeGift"},"sprint_type":34,"sub_type":1,"buy_info_func":{"reference":"DailyDiscountMgr.GetGiftBuyInfo"}}`|
|3403|`{"buy_func":{"reference":"DailyDiscountMgr.RechargeGift"},"sprint_type":34,"sub_type":1,"buy_info_func":{"reference":"DailyDiscountMgr.GetGiftBuyInfo"}}`|
|3404|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":34,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|3405|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":34,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|3406|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":34,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|3407|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":34,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|3408|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":34,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|3409|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":34,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|3501|`{"buy_func":{"reference":"OpenServerSprintMgr.RechargeGift"},"sprint_type":35,"sub_type":1,"buy_info_func":{"reference":"OpenServerSprintMgr.GetGiftBuyInfo"}}`|
|3502|`{"buy_func":{"reference":"DailyDiscountMgr.RechargeGift"},"sprint_type":35,"sub_type":1,"buy_info_func":{"reference":"DailyDiscountMgr.GetGiftBuyInfo"}}`|
|3503|`{"buy_func":{"reference":"DailyDiscountMgr.RechargeGift"},"sprint_type":35,"sub_type":1,"buy_info_func":{"reference":"DailyDiscountMgr.GetGiftBuyInfo"}}`|
|3504|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":35,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|3505|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":35,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|3506|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":35,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|3507|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":35,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|3508|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":35,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|3509|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":35,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|3601|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":38,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|3602|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":38,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|3701|`{"buy_func":{"reference":"OpenServerSprintMgr.RechargeGift"},"sprint_type":37,"sub_type":1,"buy_info_func":{"reference":"OpenServerSprintMgr.GetGiftBuyInfo"}}`|
|3702|`{"buy_func":{"reference":"DailyDiscountMgr.RechargeGift"},"sprint_type":37,"sub_type":1,"buy_info_func":{"reference":"DailyDiscountMgr.GetGiftBuyInfo"}}`|
|3703|`{"buy_func":{"reference":"DailyDiscountMgr.RechargeGift"},"sprint_type":37,"sub_type":1,"buy_info_func":{"reference":"DailyDiscountMgr.GetGiftBuyInfo"}}`|
|3704|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":37,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|3705|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":37,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|3706|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":37,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|3707|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":37,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|3708|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":37,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|3709|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":37,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|3901|`{"buy_func":{"reference":"OpenServerSprintMgr.RechargeGift"},"sprint_type":39,"sub_type":1,"buy_info_func":{"reference":"OpenServerSprintMgr.GetGiftBuyInfo"}}`|
|3902|`{"buy_func":{"reference":"DailyDiscountMgr.RechargeGift"},"sprint_type":39,"sub_type":1,"buy_info_func":{"reference":"DailyDiscountMgr.GetGiftBuyInfo"}}`|
|3903|`{"buy_func":{"reference":"DailyDiscountMgr.RechargeGift"},"sprint_type":39,"sub_type":1,"buy_info_func":{"reference":"DailyDiscountMgr.GetGiftBuyInfo"}}`|
|3904|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":39,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|3905|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":39,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|3906|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":39,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|3907|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":39,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|3908|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":39,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|3909|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":39,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|4101|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":41,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|4102|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":41,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|4201|`{"buy_func":{"reference":"OpenServerSprintMgr.RechargeGift"},"sprint_type":42,"sub_type":1,"buy_info_func":{"reference":"OpenServerSprintMgr.GetGiftBuyInfo"}}`|
|4202|`{"buy_func":{"reference":"DailyDiscountMgr.RechargeGift"},"sprint_type":42,"sub_type":1,"buy_info_func":{"reference":"DailyDiscountMgr.GetGiftBuyInfo"}}`|
|4203|`{"buy_func":{"reference":"DailyDiscountMgr.RechargeGift"},"sprint_type":42,"sub_type":1,"buy_info_func":{"reference":"DailyDiscountMgr.GetGiftBuyInfo"}}`|
|4204|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":42,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|4205|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":42,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|4206|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":42,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|4207|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":42,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|4208|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":42,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|4209|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":42,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|4301|`{"buy_func":{"reference":"DailyDiscountMgr.RechargeGift"},"sprint_type":43,"sub_type":1,"buy_info_func":{"reference":"DailyDiscountMgr.GetGiftBuyInfo"}}`|
|4302|`{"buy_func":{"reference":"DailyDiscountMgr.RechargeGift"},"sprint_type":43,"sub_type":1,"buy_info_func":{"reference":"DailyDiscountMgr.GetGiftBuyInfo"}}`|
|4303|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":43,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|4304|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":43,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|4305|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":43,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|4306|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":43,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|4307|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":43,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|4308|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":43,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|4309|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":43,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|4310|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":43,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|4801|`{"buy_func":{"reference":"OpenServerSprintMgr.RechargeGift"},"sprint_type":48,"sub_type":1,"buy_info_func":{"reference":"OpenServerSprintMgr.GetGiftBuyInfo"}}`|
|4802|`{"buy_func":{"reference":"DailyDiscountMgr.RechargeGift"},"sprint_type":48,"sub_type":1,"buy_info_func":{"reference":"DailyDiscountMgr.GetGiftBuyInfo"}}`|
|4803|`{"buy_func":{"reference":"DailyDiscountMgr.RechargeGift"},"sprint_type":48,"sub_type":1,"buy_info_func":{"reference":"DailyDiscountMgr.GetGiftBuyInfo"}}`|
|4804|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":48,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|4805|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":48,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|4806|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":48,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|4807|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":48,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|4808|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":48,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|4809|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":48,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|4901|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":50,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|4902|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":50,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|5301|`{"buy_func":{"reference":"OpenServerSprintMgr.RechargeGift"},"sprint_type":53,"sub_type":1,"buy_info_func":{"reference":"OpenServerSprintMgr.GetGiftBuyInfo"}}`|
|5302|`{"buy_func":{"reference":"DailyDiscountMgr.RechargeGift"},"sprint_type":53,"sub_type":1,"buy_info_func":{"reference":"DailyDiscountMgr.GetGiftBuyInfo"}}`|
|5303|`{"buy_func":{"reference":"DailyDiscountMgr.RechargeGift"},"sprint_type":53,"sub_type":1,"buy_info_func":{"reference":"DailyDiscountMgr.GetGiftBuyInfo"}}`|
|5304|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":53,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|5305|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":53,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|5306|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":53,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|5307|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":53,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|5308|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":53,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|5309|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":53,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|5401|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":54,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|5402|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":54,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|5501|`{"buy_func":{"reference":"DailyDiscountMgr.RechargeGift"},"sprint_type":55,"sub_type":1,"buy_info_func":{"reference":"DailyDiscountMgr.GetGiftBuyInfo"}}`|
|5502|`{"buy_func":{"reference":"DailyDiscountMgr.RechargeGift"},"sprint_type":55,"sub_type":1,"buy_info_func":{"reference":"DailyDiscountMgr.GetGiftBuyInfo"}}`|
|5503|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":55,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|5504|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":55,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|5505|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":55,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|5506|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":55,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|5507|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":55,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|5508|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":55,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|5509|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":55,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|
|5510|`{"buy_func":{"reference":"RegularGiftMgr.RechargeGiftMulti"},"sprint_type":55,"sub_type":1,"buy_info_func":{"reference":"RegularGiftMgr.GetGiftBuyInfo"}}`|

## SprintType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|show_max_rank|number|52|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|count_time_bg|string|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rank_condition|number|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|condition_limit|array|52|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|title_name|string|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_tips|number|52|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|sprint_grade|number|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|alone_display|boolean|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_cfg_count|number|52|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award_tips_number|number|52|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|desc|number|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rank_type|number|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|mail_id|number|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|no_update_rank|boolean|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cross_type|number|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|value_interface|object/undefined|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|activity|number|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|gift_name|number|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|52|本表行键；与其他表同值不自动代表同一对象。|
|banner|string|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sprint_path|number|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fun_open|number|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|banner_bg|string|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|gift_banner|string|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cross_activity|number|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|effect_rank|number|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"show_max_rank":100,"count_time_bg":"img_hxpd_ditu2.png","rank_condition":53224,"condition_limit":[200,100,100],"award_tips":10001027,"award_cfg_count":10,"award_tips_number":10002021,"rank_type":23,"no_update_rank":false,"cross_type":0,"value_interface":{"reference":"OpenServerSprintMgr.RecruitCount"},"fun_open":0}`|
|6|`{"show_max_rank":100,"count_time_bg":"img_hxpd_ditu2.png","rank_condition":53229,"condition_limit":[500,300,300],"award_tips":10001027,"award_cfg_count":10,"award_tips_number":10002021,"rank_type":28,"no_update_rank":false,"cross_type":0,"value_interface":{"reference":"OpenServerSprintMgr.MissionLineupHeroLv"},"fun_open":0}`|
|7|`{"show_max_rank":200,"count_time_bg":"img_hxpd_ditu2.png","rank_condition":53230,"condition_limit":[1500000,1000000,1000000],"award_tips":10001027,"award_cfg_count":200,"award_tips_number":10002021,"rank_type":29,"no_update_rank":false,"cross_type":0,"value_interface":{"reference":"OpenServerSprintMgr.MissionLineupPower"},"fun_open":0}`|
|8|`{"show_max_rank":100,"count_time_bg":"img_hxpd_ditu2.png","rank_condition":0,"condition_limit":[],"award_tips":10001027,"award_cfg_count":7,"award_tips_number":10002021,"rank_type":51,"no_update_rank":false,"cross_type":0,"fun_open":0}`|
|9|`{"show_max_rank":100,"count_time_bg":"img_hxpd_ditu2.png","rank_condition":0,"condition_limit":[],"award_tips":10001027,"award_cfg_count":100,"award_tips_number":10002021,"rank_type":53,"no_update_rank":false,"cross_type":1,"fun_open":1040}`|
|10|`{"show_max_rank":100,"count_time_bg":"img_hxpd_ditu2.png","rank_condition":0,"condition_limit":[],"award_tips":10001027,"award_cfg_count":100,"award_tips_number":10002021,"rank_type":53,"no_update_rank":false,"cross_type":1,"fun_open":1040}`|
|11|`{"show_max_rank":0,"count_time_bg":"img_hxpd_ditu2.png","rank_condition":0,"condition_limit":[],"award_tips":10001027,"award_cfg_count":0,"award_tips_number":10002021,"rank_type":95,"no_update_rank":false,"cross_type":4,"fun_open":1064}`|
|12|`{"show_max_rank":0,"count_time_bg":"img_hxpd_ditu2.png","rank_condition":0,"condition_limit":[],"award_tips":10001027,"award_cfg_count":0,"award_tips_number":10002021,"rank_type":101,"no_update_rank":false,"cross_type":4,"fun_open":1064}`|
|13|`{"show_max_rank":100,"count_time_bg":"img_hxpd_ditu2.png","rank_condition":0,"condition_limit":[],"award_tips":10001027,"award_cfg_count":200,"award_tips_number":10002021,"rank_type":100,"no_update_rank":false,"cross_type":1,"fun_open":1040}`|
|14|`{"show_max_rank":0,"count_time_bg":"img_hxpd_ditu2.png","rank_condition":0,"condition_limit":[],"award_tips":10001027,"award_cfg_count":0,"award_tips_number":10002021,"rank_type":101,"no_update_rank":false,"cross_type":4,"fun_open":1064}`|
|15|`{"show_max_rank":100,"count_time_bg":"img_hxpd_ditu2.png","rank_condition":0,"condition_limit":[],"award_tips":10001027,"award_cfg_count":200,"award_tips_number":10002021,"rank_type":100,"no_update_rank":false,"cross_type":1,"fun_open":1040}`|
|16|`{"show_max_rank":100,"count_time_bg":"img_hxpd_ditu2.png","rank_condition":0,"condition_limit":[],"award_tips":10001027,"award_cfg_count":200,"award_tips_number":10002021,"rank_type":152,"no_update_rank":false,"cross_type":26,"fun_open":1040}`|
|17|`{"show_max_rank":0,"count_time_bg":"img_hxpd_ditu2.png","rank_condition":0,"condition_limit":[],"award_tips":10001027,"award_cfg_count":0,"award_tips_number":10002021,"rank_type":178,"no_update_rank":false,"cross_type":29,"fun_open":1064}`|
|18|`{"show_max_rank":100,"count_time_bg":"img_hxpd_ditu2.png","rank_condition":0,"condition_limit":[],"award_tips":10001027,"award_cfg_count":200,"award_tips_number":10002021,"rank_type":152,"no_update_rank":false,"cross_type":26,"fun_open":1040}`|
|19|`{"show_max_rank":0,"count_time_bg":"img_hxpd_ditu2.png","rank_condition":0,"condition_limit":[],"award_tips":10001027,"award_cfg_count":0,"award_tips_number":10002021,"rank_type":178,"no_update_rank":false,"cross_type":29,"fun_open":1064}`|
|20|`{"show_max_rank":100,"count_time_bg":"img_hxpd_ditu2.png","rank_condition":0,"condition_limit":[],"award_tips":10001027,"award_cfg_count":200,"award_tips_number":10002021,"rank_type":193,"no_update_rank":false,"cross_type":51,"fun_open":1040}`|
|21|`{"show_max_rank":0,"count_time_bg":"img_hxpd_ditu2.png","rank_condition":0,"condition_limit":[],"award_tips":10001027,"award_cfg_count":0,"award_tips_number":10002021,"rank_type":194,"no_update_rank":false,"cross_type":52,"fun_open":1064}`|
|22|`{"show_max_rank":0,"count_time_bg":"img_hxpd_ditu2.png","rank_condition":0,"condition_limit":[],"award_tips":10001027,"award_cfg_count":0,"award_tips_number":10002021,"rank_type":101,"no_update_rank":false,"cross_type":4,"fun_open":1064}`|
|23|`{"show_max_rank":100,"count_time_bg":"img_hxpd_ditu2.png","rank_condition":0,"condition_limit":[],"award_tips":10001027,"award_cfg_count":200,"award_tips_number":10002021,"rank_type":100,"no_update_rank":false,"cross_type":1,"fun_open":1040}`|
|24|`{"show_max_rank":100,"count_time_bg":"img_hxpd_ditu2.png","rank_condition":0,"condition_limit":[],"award_tips":10001027,"award_cfg_count":100,"award_tips_number":10002021,"rank_type":53,"no_update_rank":false,"cross_type":1,"fun_open":1040}`|
|25|`{"show_max_rank":0,"count_time_bg":"img_hxpd_ditu2.png","rank_condition":0,"condition_limit":[],"award_tips":10001027,"award_cfg_count":0,"award_tips_number":10002021,"rank_type":95,"no_update_rank":false,"cross_type":4,"fun_open":1064}`|
|26|`{"show_max_rank":0,"count_time_bg":"img_hxpd_ditu2.png","rank_condition":0,"condition_limit":[],"award_tips":10001027,"award_cfg_count":0,"award_tips_number":10002021,"rank_type":101,"no_update_rank":false,"cross_type":4,"fun_open":1064}`|
|27|`{"show_max_rank":100,"count_time_bg":"img_hxpd_ditu2.png","rank_condition":0,"condition_limit":[],"award_tips":10001027,"award_cfg_count":200,"award_tips_number":10002021,"rank_type":100,"no_update_rank":false,"cross_type":1,"fun_open":1040}`|
|28|`{"show_max_rank":100,"count_time_bg":"","rank_condition":0,"condition_limit":[],"award_tips":0,"award_cfg_count":0,"award_tips_number":0,"rank_type":265,"no_update_rank":false,"cross_type":0,"fun_open":1100}`|
|29|`{"show_max_rank":100,"count_time_bg":"","rank_condition":0,"condition_limit":[],"award_tips":0,"award_cfg_count":0,"award_tips_number":0,"rank_type":266,"no_update_rank":false,"cross_type":0,"fun_open":1209}`|
|30|`{"show_max_rank":100,"count_time_bg":"","rank_condition":0,"condition_limit":[],"award_tips":0,"award_cfg_count":0,"award_tips_number":0,"rank_type":267,"no_update_rank":false,"cross_type":0,"fun_open":1297}`|
|31|`{"show_max_rank":100,"count_time_bg":"","rank_condition":0,"condition_limit":[],"award_tips":0,"award_cfg_count":0,"award_tips_number":0,"rank_type":268,"no_update_rank":false,"cross_type":0,"fun_open":1066}`|
|32|`{"show_max_rank":100,"count_time_bg":"","rank_condition":0,"condition_limit":[],"award_tips":0,"award_cfg_count":0,"award_tips_number":0,"rank_type":2,"no_update_rank":true,"cross_type":0,"fun_open":1056}`|
|33|`{"show_max_rank":100,"count_time_bg":"","rank_condition":0,"condition_limit":[],"award_tips":0,"award_cfg_count":0,"award_tips_number":0,"rank_type":269,"no_update_rank":false,"cross_type":0,"fun_open":1046}`|
|34|`{"show_max_rank":100,"count_time_bg":"","rank_condition":0,"condition_limit":[],"award_tips":0,"award_cfg_count":0,"award_tips_number":0,"rank_type":269,"no_update_rank":false,"cross_type":0,"fun_open":1046}`|
|35|`{"show_max_rank":100,"count_time_bg":"","rank_condition":0,"condition_limit":[],"award_tips":0,"award_cfg_count":0,"award_tips_number":0,"rank_type":269,"no_update_rank":false,"cross_type":0,"fun_open":1046}`|
|36|`{"show_max_rank":100,"count_time_bg":"","rank_condition":681810,"condition_limit":[],"award_tips":0,"award_cfg_count":0,"award_tips_number":0,"rank_type":2,"no_update_rank":true,"cross_type":0,"fun_open":1056}`|
|37|`{"show_max_rank":100,"count_time_bg":"","rank_condition":681811,"condition_limit":[],"award_tips":0,"award_cfg_count":0,"award_tips_number":0,"rank_type":269,"no_update_rank":false,"cross_type":0,"fun_open":1046}`|
|38|`{"show_max_rank":100,"count_time_bg":"","rank_condition":681812,"condition_limit":[],"award_tips":0,"award_cfg_count":0,"award_tips_number":0,"rank_type":266,"no_update_rank":false,"cross_type":0,"fun_open":1209}`|
|39|`{"show_max_rank":100,"count_time_bg":"","rank_condition":0,"condition_limit":[],"award_tips":0,"award_cfg_count":0,"award_tips_number":0,"rank_type":269,"no_update_rank":false,"cross_type":0,"fun_open":1046}`|
|41|`{"show_max_rank":100,"count_time_bg":"","rank_condition":681813,"condition_limit":[],"award_tips":0,"award_cfg_count":0,"award_tips_number":0,"rank_type":267,"no_update_rank":false,"cross_type":0,"fun_open":1297}`|
|42|`{"show_max_rank":100,"count_time_bg":"","rank_condition":0,"condition_limit":[],"award_tips":0,"award_cfg_count":0,"award_tips_number":0,"rank_type":269,"no_update_rank":false,"cross_type":0,"fun_open":1046}`|
|43|`{"show_max_rank":100,"count_time_bg":"","rank_condition":0,"condition_limit":[],"award_tips":0,"award_cfg_count":0,"award_tips_number":0,"rank_type":268,"no_update_rank":false,"cross_type":0,"fun_open":1066}`|
|44|`{"show_max_rank":100,"count_time_bg":"img_hxpd_ditu2.png","rank_condition":0,"condition_limit":[],"award_tips":10001027,"award_cfg_count":100,"award_tips_number":10002021,"rank_type":53,"no_update_rank":false,"cross_type":1,"fun_open":1040}`|
|45|`{"show_max_rank":0,"count_time_bg":"img_hxpd_ditu2.png","rank_condition":0,"condition_limit":[],"award_tips":10001027,"award_cfg_count":0,"award_tips_number":10002021,"rank_type":95,"no_update_rank":false,"cross_type":4,"fun_open":1064}`|
|46|`{"show_max_rank":0,"count_time_bg":"img_hxpd_ditu2.png","rank_condition":0,"condition_limit":[],"award_tips":10001027,"award_cfg_count":0,"award_tips_number":10002021,"rank_type":101,"no_update_rank":false,"cross_type":4,"fun_open":1064}`|
|47|`{"show_max_rank":100,"count_time_bg":"img_hxpd_ditu2.png","rank_condition":0,"condition_limit":[],"award_tips":10001027,"award_cfg_count":100,"award_tips_number":10002021,"rank_type":100,"no_update_rank":false,"cross_type":1,"fun_open":1040}`|
|48|`{"show_max_rank":100,"count_time_bg":"","rank_condition":681811,"condition_limit":[],"award_tips":0,"award_cfg_count":0,"award_tips_number":0,"rank_type":269,"no_update_rank":false,"cross_type":0,"fun_open":1046}`|
|49|`{"show_max_rank":100,"count_time_bg":"","rank_condition":681810,"condition_limit":[],"award_tips":0,"award_cfg_count":0,"award_tips_number":0,"rank_type":2,"no_update_rank":true,"cross_type":0,"fun_open":1056}`|
|50|`{"show_max_rank":100,"count_time_bg":"","rank_condition":681812,"condition_limit":[],"award_tips":0,"award_cfg_count":0,"award_tips_number":0,"rank_type":266,"no_update_rank":false,"cross_type":0,"fun_open":1209}`|
|51|`{"show_max_rank":100,"count_time_bg":"img_hxpd_ditu2.png","rank_condition":0,"condition_limit":[],"award_tips":10001027,"award_cfg_count":100,"award_tips_number":10002021,"rank_type":53,"no_update_rank":false,"cross_type":1,"fun_open":1040}`|
|52|`{"show_max_rank":0,"count_time_bg":"img_hxpd_ditu2.png","rank_condition":0,"condition_limit":[],"award_tips":10001027,"award_cfg_count":0,"award_tips_number":10002021,"rank_type":95,"no_update_rank":false,"cross_type":4,"fun_open":1064}`|
|53|`{"show_max_rank":100,"count_time_bg":"","rank_condition":681811,"condition_limit":[],"award_tips":0,"award_cfg_count":0,"award_tips_number":0,"rank_type":269,"no_update_rank":false,"cross_type":0,"fun_open":1046}`|
|54|`{"show_max_rank":100,"count_time_bg":"","rank_condition":681813,"condition_limit":[],"award_tips":0,"award_cfg_count":0,"award_tips_number":0,"rank_type":267,"no_update_rank":false,"cross_type":0,"fun_open":1297}`|
|55|`{"show_max_rank":100,"count_time_bg":"","rank_condition":0,"condition_limit":[],"award_tips":0,"award_cfg_count":0,"award_tips_number":0,"rank_type":268,"no_update_rank":false,"cross_type":0,"fun_open":1066}`|
|56|`{"show_max_rank":100,"count_time_bg":"img_hxpd_ditu2.png","rank_condition":0,"condition_limit":[],"award_tips":10001027,"award_cfg_count":100,"award_tips_number":10002021,"rank_type":100,"no_update_rank":false,"cross_type":1,"fun_open":1040}`|
|57|`{"show_max_rank":0,"count_time_bg":"img_hxpd_ditu2.png","rank_condition":0,"condition_limit":[],"award_tips":10001027,"award_cfg_count":0,"award_tips_number":10002021,"rank_type":101,"no_update_rank":false,"cross_type":4,"fun_open":1064}`|

## StrategyRes

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|item|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|des|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"item":201500}`|
|2|`{"item":101500}`|
|3|`{"item":101800}`|
|4|`{"item":201500}`|
|5|`{"item":101500}`|

## StrategyTeam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|hero|array|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|des1|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|des2|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|7|本表行键；与其他表同值不自动代表同一对象。|
|title|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"hero":[]}`|
|2|`{"hero":[]}`|
|3|`{"hero":[]}`|
|4|`{"hero":[]}`|
|5|`{"hero":[]}`|
|6|`{"hero":[]}`|
|7|`{"hero":[]}`|
