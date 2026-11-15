# MushroomMonsterTable 规则参数

来源：[personal-server/assets/tables/MushroomMonsterTable.data.lua.json.gz](../../../../personal-server/assets/tables/MushroomMonsterTable.data.lua.json.gz)，SHA256：`9718561ab2f97b0bf5ff6fc99cc2c40447519dcc8fe04f968ced96c079615c9e`。

[完整逐行JSON](MushroomMonsterTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[MushroomMonster](#mushroommonster)|1|decoded-rows|
|[ActAward](#actaward)|3|decoded-rows|
|[ActSpeed](#actspeed)|5|decoded-rows|
|[ActDisplay](#actdisplay)|1|decoded-rows|

## MushroomMonster

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|normal_score|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|crit_score|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|root_red_tid|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|red_tid|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|reward_red_tid|number|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|round_duration|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rank_id|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"normal_score":100,"crit_score":200,"fight_count":3,"reward_red_tid":174581026463,"round_duration":25,"rank_id":227}`|

## ActAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|belong_version|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|daily_act_val|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|need_times|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_item|number|3|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award_count|number|3|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{"belong_version":1,"need_times":1,"award_item":678002,"award_count":300}`|
|1002|`{"belong_version":1,"need_times":2,"award_item":678002,"award_count":400}`|
|1003|`{"belong_version":1,"need_times":3,"award_item":678002,"award_count":800}`|

## ActSpeed

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|belong_version|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|speed_max_time|number|5|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|speed_coff|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"belong_version":1,"speed_max_time":5,"speed_coff":0.5}`|
|2|`{"belong_version":1,"speed_max_time":10,"speed_coff":1.25}`|
|3|`{"belong_version":1,"speed_max_time":15,"speed_coff":1.5}`|
|4|`{"belong_version":1,"speed_max_time":20,"speed_coff":1.75}`|
|5|`{"belong_version":1,"speed_max_time":1000000000,"speed_coff":2}`|

## ActDisplay

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|belong_version|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hit_area_angle|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hit_angle|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|crit_hit_angle|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fire_angle|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fire_move_speed|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fire_move_angle|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hit_area_asset|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|crit_hit_area_asset|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"belong_version":1,"fire_move_speed":80}`|
