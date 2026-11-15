# TowerDefenseTable 规则参数

来源：[personal-server/assets/tables/TowerDefenseTable.data.lua.json.gz](../../../../personal-server/assets/tables/TowerDefenseTable.data.lua.json.gz)，SHA256：`ad888ced18dd3aa1285828410287e4b43dfb864fbc067fbb643f4ee23a3d3fa7`。

[完整逐行JSON](TowerDefenseTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Wall](#wall)|1|decoded-rows|
|[Type](#type)|1|decoded-rows|
|[Week](#week)|6|decoded-rows|
|[Turns](#turns)|830|decoded-rows|
|[Monster](#monster)|28|decoded-rows|
|[Index](#index)|5|decoded-rows|
|[ElvesTowerAtk](#elvestoweratk)|2|decoded-rows|
|[Task](#task)|54|decoded-rows|

## Wall

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|max_hp|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|award|number|1|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|recovery_speed|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1000|`{"max_hp":300000,"award":6000,"recovery_speed":240}`|

## Type

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|access_mod|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|frequency|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|limit_show_turns|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|cumulate|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|init_index|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|init_turns|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|recover_mail_id|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"limit_show_turns":3,"init_index":1,"init_turns":1001001,"recover_mail_id":3281400}`|

## Week

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|interval_time|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tower_atk|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|elves_atk|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"interval_time":0}`|
|102|`{"interval_time":0}`|
|103|`{"interval_time":0}`|
|104|`{"interval_time":0}`|
|105|`{"interval_time":0}`|
|106|`{"interval_time":0}`|

## Turns

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|830|本表行键；与其他表同值不自动代表同一对象。|
|monster_type|array|830|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|monster_num|array|830|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|interval_time|number|830|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|random_award|number|830|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

下列3行用于说明结构；全部830行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001001|`{"monster_type":[25],"monster_num":[2],"interval_time":30,"random_award":0}`|
|1001002|`{"monster_type":[25],"monster_num":[2],"interval_time":90,"random_award":0}`|
|1001003|`{"monster_type":[25],"monster_num":[2],"interval_time":120,"random_award":0}`|

## Monster

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|28|本表行键；与其他表同值不自动代表同一对象。|
|hp|number|28|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_item|number|28|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award_num|number|28|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|atk|number|28|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|prefab|number|28|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|random_award|number|28|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"hp":5000,"award_item":6201900,"award_num":3,"random_award":1001}`|
|2|`{"hp":15000,"award_item":6201900,"award_num":4,"random_award":1002}`|
|3|`{"hp":25000,"award_item":6201900,"award_num":5,"random_award":1003}`|
|4|`{"hp":10000,"award_item":6201900,"award_num":5,"random_award":1004}`|
|5|`{"hp":30000,"award_item":6201900,"award_num":6,"random_award":1005}`|
|6|`{"hp":80000,"award_item":6201900,"award_num":8,"random_award":1006}`|
|7|`{"hp":40000,"award_item":6201900,"award_num":5,"random_award":1007}`|
|8|`{"hp":50000,"award_item":6201900,"award_num":8,"random_award":1008}`|
|9|`{"hp":120000,"award_item":6201900,"award_num":10,"random_award":1009}`|
|10|`{"hp":50000,"award_item":6201900,"award_num":5,"random_award":1010}`|
|11|`{"hp":70000,"award_item":6201900,"award_num":8,"random_award":1011}`|
|12|`{"hp":150000,"award_item":6201900,"award_num":10,"random_award":1012}`|
|13|`{"hp":60000,"award_item":6201900,"award_num":5,"random_award":1013}`|
|14|`{"hp":90000,"award_item":6201900,"award_num":8,"random_award":1014}`|
|15|`{"hp":180000,"award_item":6201900,"award_num":10,"random_award":1015}`|
|16|`{"hp":80000,"award_item":6201900,"award_num":5,"random_award":1016}`|
|17|`{"hp":110000,"award_item":6201900,"award_num":8,"random_award":1017}`|
|18|`{"hp":200000,"award_item":6201900,"award_num":10,"random_award":1018}`|
|19|`{"hp":90000,"award_item":6201900,"award_num":5,"random_award":1019}`|
|20|`{"hp":130000,"award_item":6201900,"award_num":8,"random_award":1020}`|
|21|`{"hp":250000,"award_item":6201900,"award_num":10,"random_award":1021}`|
|22|`{"hp":100000,"award_item":6201900,"award_num":5,"random_award":1022}`|
|23|`{"hp":150000,"award_item":6201900,"award_num":8,"random_award":1023}`|
|24|`{"hp":300000,"award_item":6201900,"award_num":10,"random_award":1024}`|
|25|`{"hp":1000,"award_item":6201900,"award_num":3,"random_award":1001}`|
|26|`{"hp":200000,"award_item":6201900,"award_num":5,"random_award":1022}`|
|27|`{"hp":300000,"award_item":6201900,"award_num":8,"random_award":1023}`|
|28|`{"hp":500000,"award_item":6201900,"award_num":10,"random_award":1024}`|

## Index

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|condition_args|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{"condition_args":1}`|
|1002|`{"condition_args":2}`|
|1003|`{"condition_args":4}`|
|1004|`{"condition_args":7}`|
|1005|`{"condition_args":9}`|

## ElvesTowerAtk

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|range|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|atk|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|100120|`{}`|
|200120|`{}`|

## Task

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|54|本表行键；与其他表同值不自动代表同一对象。|
|target_count|number|54|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|belong_type|number|54|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_list|array|54|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|des|number|54|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"target_count":5,"belong_type":1,"award_list":[[495002,20],[6201900,200]]}`|
|102|`{"target_count":10,"belong_type":1,"award_list":[[495002,20],[6201900,250]]}`|
|103|`{"target_count":10,"belong_type":1,"award_list":[[495002,20],[6201900,250]]}`|
|104|`{"target_count":10,"belong_type":1,"award_list":[[495002,20],[6201900,250]]}`|
|105|`{"target_count":10,"belong_type":1,"award_list":[[495002,20],[6201900,250]]}`|
|106|`{"target_count":10,"belong_type":1,"award_list":[[495002,20],[6201900,250]]}`|
|201|`{"target_count":15,"belong_type":1,"award_list":[[493002,10],[495002,20],[6201900,250]]}`|
|202|`{"target_count":20,"belong_type":1,"award_list":[[493002,10],[1010122,1],[6201900,250]]}`|
|203|`{"target_count":20,"belong_type":1,"award_list":[[493002,10],[1010122,1],[6201900,250]]}`|
|204|`{"target_count":20,"belong_type":1,"award_list":[[493002,10],[1010122,1],[6201900,250]]}`|
|205|`{"target_count":20,"belong_type":1,"award_list":[[493002,10],[1010122,1],[6201900,250]]}`|
|206|`{"target_count":20,"belong_type":1,"award_list":[[493002,10],[1010122,1],[6201900,250]]}`|
|301|`{"target_count":25,"belong_type":1,"award_list":[[1010122,1],[495002,30],[6201900,250]]}`|
|302|`{"target_count":35,"belong_type":1,"award_list":[[495002,30],[6201900,300]]}`|
|303|`{"target_count":35,"belong_type":1,"award_list":[[495002,30],[6201900,300]]}`|
|304|`{"target_count":35,"belong_type":1,"award_list":[[495002,30],[6201900,300]]}`|
|305|`{"target_count":35,"belong_type":1,"award_list":[[495002,30],[6201900,300]]}`|
|306|`{"target_count":35,"belong_type":1,"award_list":[[495002,30],[6201900,300]]}`|
|401|`{"target_count":35,"belong_type":1,"award_list":[[493002,10],[495002,30],[6201900,250]]}`|
|402|`{"target_count":50,"belong_type":1,"award_list":[[493002,10],[1010222,1],[6201900,300]]}`|
|403|`{"target_count":50,"belong_type":1,"award_list":[[493002,10],[1010222,1],[6201900,300]]}`|
|404|`{"target_count":50,"belong_type":1,"award_list":[[493002,10],[1010222,1],[6201900,300]]}`|
|405|`{"target_count":50,"belong_type":1,"award_list":[[493002,10],[1010222,1],[6201900,300]]}`|
|406|`{"target_count":50,"belong_type":1,"award_list":[[493002,10],[1010222,1],[6201900,300]]}`|
|501|`{"target_count":50,"belong_type":1,"award_list":[[1010222,1],[495002,50],[6201900,300]]}`|
|502|`{"target_count":65,"belong_type":1,"award_list":[[495002,50],[6201900,350]]}`|
|503|`{"target_count":65,"belong_type":1,"award_list":[[495002,50],[6201900,350]]}`|
|504|`{"target_count":65,"belong_type":1,"award_list":[[495002,50],[6201900,350]]}`|
|505|`{"target_count":65,"belong_type":1,"award_list":[[495002,50],[6201900,350]]}`|
|506|`{"target_count":65,"belong_type":1,"award_list":[[495002,50],[6201900,350]]}`|
|601|`{"target_count":65,"belong_type":1,"award_list":[[493002,10],[494002,1],[6201900,300]]}`|
|602|`{"target_count":80,"belong_type":1,"award_list":[[493002,10],[1020122,1],[6201900,350]]}`|
|603|`{"target_count":80,"belong_type":1,"award_list":[[493002,10],[1020122,1],[6201900,350]]}`|
|604|`{"target_count":80,"belong_type":1,"award_list":[[493002,10],[1020122,1],[6201900,350]]}`|
|605|`{"target_count":80,"belong_type":1,"award_list":[[493002,10],[1020122,1],[6201900,350]]}`|
|606|`{"target_count":80,"belong_type":1,"award_list":[[493002,10],[1020122,1],[6201900,350]]}`|
|701|`{"target_count":80,"belong_type":1,"award_list":[[1020122,1],[495002,50],[6201900,300]]}`|
|702|`{"target_count":90,"belong_type":1,"award_list":[[494002,1],[495002,50],[6201900,400]]}`|
|703|`{"target_count":90,"belong_type":1,"award_list":[[494002,1],[495002,50],[6201900,400]]}`|
|704|`{"target_count":90,"belong_type":1,"award_list":[[494002,1],[495002,50],[6201900,400]]}`|
|705|`{"target_count":90,"belong_type":1,"award_list":[[494002,1],[495002,50],[6201900,400]]}`|
|706|`{"target_count":90,"belong_type":1,"award_list":[[494002,1],[495002,50],[6201900,400]]}`|
|801|`{"target_count":95,"belong_type":1,"award_list":[[493002,15],[495002,50],[6201900,300]]}`|
|802|`{"target_count":100,"belong_type":1,"award_list":[[2171200,20],[1020222,1],[6201900,400]]}`|
|803|`{"target_count":100,"belong_type":1,"award_list":[[2171200,20],[1020222,1],[6201900,400]]}`|
|804|`{"target_count":100,"belong_type":1,"award_list":[[2171200,20],[1020222,1],[6201900,400]]}`|
|805|`{"target_count":100,"belong_type":1,"award_list":[[2171200,20],[1020222,1],[6201900,400]]}`|
|806|`{"target_count":100,"belong_type":1,"award_list":[[2171200,20],[1020222,1],[6201900,400]]}`|
|901|`{"target_count":110,"belong_type":1,"award_list":[[1020222,1],[494002,1],[6201900,300]]}`|
|902|`{"target_count":110,"belong_type":1,"award_list":[[493002,15],[494002,1],[6201900,400]]}`|
|903|`{"target_count":110,"belong_type":1,"award_list":[[493002,15],[494002,1],[6201900,400]]}`|
|904|`{"target_count":110,"belong_type":1,"award_list":[[493002,15],[494002,1],[6201900,400]]}`|
|905|`{"target_count":110,"belong_type":1,"award_list":[[493002,15],[494002,1],[6201900,400]]}`|
|906|`{"target_count":110,"belong_type":1,"award_list":[[493002,15],[494002,1],[6201900,400]]}`|
