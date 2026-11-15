# FestivalMonsterActTable 规则参数

来源：[personal-server/assets/tables/FestivalMonsterActTable.data.lua.json.gz](../../../../personal-server/assets/tables/FestivalMonsterActTable.data.lua.json.gz)，SHA256：`23036198044dede9ea9a834ec75ee662a30b3e81db65f7542a304f7710c8c740`。

[完整逐行JSON](FestivalMonsterActTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[FestivalMonsterAct](#festivalmonsteract)|1|decoded-rows|
|[Award](#award)|3|decoded-rows|
|[Display](#display)|1|decoded-rows|

## FestivalMonsterAct

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|countdown_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|red_tid|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|assistant_time|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|total_hp|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|normal_hurt|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_item|number|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|fight_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|crit_hurt|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_count|number|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"countdown_time":3,"assistant_time":[40,60],"total_hp":2200,"award_item":604002,"fight_count":2,"award_count":2}`|

## Award

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|belong_version|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|time_span|array|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_count|number|3|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|award_item|number|3|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{"belong_version":1,"time_span":[0,20],"award_count":4,"award_item":2831200}`|
|1002|`{"belong_version":1,"time_span":[21,40],"award_count":3,"award_item":2831200}`|
|1003|`{"belong_version":1,"time_span":[41,999],"award_count":2,"award_item":2831200}`|

## Display

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|crit_hit_angle|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|belong_version|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fire_move_speed|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hit_area_asset|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|fire_angle|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hit_angle|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fire_move_angle|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|crit_hit_area_asset|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hit_area_angle|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"belong_version":1,"fire_move_speed":80}`|
