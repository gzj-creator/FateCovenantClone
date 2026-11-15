# TowerActTable 规则参数

来源：[personal-server/assets/tables/TowerActTable.data.lua.json.gz](../../../../personal-server/assets/tables/TowerActTable.data.lua.json.gz)，SHA256：`780451633d758621f5c2b97d1d22aacf3188f962f137fe82bd5311877691f548`。

[完整逐行JSON](TowerActTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[TowerAct](#toweract)|7|decoded-rows|
|[Task](#task)|49|decoded-rows|
|[Award](#award)|48|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[TurnChoose](#turnchoose)|14|decoded-rows|
|[Gift](#gift)|53|decoded-rows|

## TowerAct

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|7|本表行键；与其他表同值不自动代表同一对象。|
|step_cost|number|7|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|max_step|number|7|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|res_exchange|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|step_ratio|array|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|permit|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"step_cost":800002,"max_step":150,"res_exchange":13,"step_ratio":[[800,1],[200,2]]}`|
|2|`{"step_cost":800002,"max_step":150,"res_exchange":13,"step_ratio":[[800,1],[200,2]]}`|
|3|`{"step_cost":800002,"max_step":150,"res_exchange":13,"step_ratio":[[800,1],[200,2]]}`|
|4|`{"step_cost":800002,"max_step":150,"res_exchange":13,"step_ratio":[[800,1],[200,2]]}`|
|5|`{"step_cost":800002,"max_step":150,"res_exchange":13,"step_ratio":[[800,1],[200,2]]}`|
|6|`{"step_cost":800002,"max_step":150,"res_exchange":13,"step_ratio":[[800,1],[200,2]]}`|
|7|`{"step_cost":800002,"max_step":150,"res_exchange":13,"step_ratio":[[800,1],[200,2]]}`|

## Task

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|49|本表行键；与其他表同值不自动代表同一对象。|
|version|number|49|版本引用；必须按活动类型及其消费者查对应版本表。|
|task_type|number|49|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_param|number|49|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_count|number|49|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|act_param|number|49|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|49|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"version":1,"task_type":1803,"task_param":0,"task_count":1,"award":[[800002,5]]}`|
|102|`{"version":1,"task_type":1002,"task_param":0,"task_count":50,"award":[[800002,5]]}`|
|103|`{"version":1,"task_type":1,"task_param":0,"task_count":10000,"award":[[800002,5]]}`|
|104|`{"version":1,"task_type":12401,"task_param":0,"task_count":20,"award":[[800002,5]]}`|
|105|`{"version":1,"task_type":7002,"task_param":0,"task_count":20,"award":[[800002,5]]}`|
|106|`{"version":1,"task_type":14301,"task_param":0,"task_count":400,"award":[[800002,5]]}`|
|107|`{"version":1,"task_type":12311,"task_param":0,"task_count":20,"award":[[800002,5]]}`|
|201|`{"version":2,"task_type":1803,"task_param":0,"task_count":1,"award":[[800002,5]]}`|
|202|`{"version":2,"task_type":1002,"task_param":0,"task_count":50,"award":[[800002,5]]}`|
|203|`{"version":2,"task_type":1,"task_param":0,"task_count":10000,"award":[[800002,5]]}`|
|204|`{"version":2,"task_type":12401,"task_param":0,"task_count":20,"award":[[800002,5]]}`|
|205|`{"version":2,"task_type":7002,"task_param":0,"task_count":20,"award":[[800002,5]]}`|
|206|`{"version":2,"task_type":14301,"task_param":0,"task_count":400,"award":[[800002,5]]}`|
|207|`{"version":2,"task_type":12311,"task_param":0,"task_count":20,"award":[[800002,5]]}`|
|301|`{"version":3,"task_type":1803,"task_param":0,"task_count":1,"award":[[800002,5]]}`|
|302|`{"version":3,"task_type":1002,"task_param":0,"task_count":50,"award":[[800002,5]]}`|
|303|`{"version":3,"task_type":1,"task_param":0,"task_count":10000,"award":[[800002,5]]}`|
|304|`{"version":3,"task_type":12401,"task_param":0,"task_count":20,"award":[[800002,5]]}`|
|305|`{"version":3,"task_type":7002,"task_param":0,"task_count":20,"award":[[800002,5]]}`|
|306|`{"version":3,"task_type":14301,"task_param":0,"task_count":400,"award":[[800002,5]]}`|
|307|`{"version":3,"task_type":12311,"task_param":0,"task_count":20,"award":[[800002,5]]}`|
|401|`{"version":4,"task_type":1803,"task_param":0,"task_count":1,"award":[[800002,5]]}`|
|402|`{"version":4,"task_type":1002,"task_param":0,"task_count":50,"award":[[800002,5]]}`|
|403|`{"version":4,"task_type":1,"task_param":0,"task_count":10000,"award":[[800002,5]]}`|
|404|`{"version":4,"task_type":12401,"task_param":0,"task_count":20,"award":[[800002,5]]}`|
|405|`{"version":4,"task_type":7002,"task_param":0,"task_count":20,"award":[[800002,5]]}`|
|406|`{"version":4,"task_type":14301,"task_param":0,"task_count":400,"award":[[800002,5]]}`|
|407|`{"version":4,"task_type":12311,"task_param":0,"task_count":20,"award":[[800002,5]]}`|
|501|`{"version":5,"task_type":1803,"task_param":0,"task_count":1,"award":[[800002,5]]}`|
|502|`{"version":5,"task_type":1002,"task_param":0,"task_count":50,"award":[[800002,5]]}`|
|503|`{"version":5,"task_type":1,"task_param":0,"task_count":10000,"award":[[800002,5]]}`|
|504|`{"version":5,"task_type":12401,"task_param":0,"task_count":20,"award":[[800002,5]]}`|
|505|`{"version":5,"task_type":7002,"task_param":0,"task_count":20,"award":[[800002,5]]}`|
|506|`{"version":5,"task_type":14301,"task_param":0,"task_count":400,"award":[[800002,5]]}`|
|507|`{"version":5,"task_type":12311,"task_param":0,"task_count":20,"award":[[800002,5]]}`|
|601|`{"version":6,"task_type":1803,"task_param":0,"task_count":1,"award":[[800002,5]]}`|
|602|`{"version":6,"task_type":1002,"task_param":0,"task_count":50,"award":[[800002,5]]}`|
|603|`{"version":6,"task_type":1,"task_param":0,"task_count":10000,"award":[[800002,5]]}`|
|604|`{"version":6,"task_type":12401,"task_param":0,"task_count":20,"award":[[800002,5]]}`|
|605|`{"version":6,"task_type":7002,"task_param":0,"task_count":20,"award":[[800002,5]]}`|
|606|`{"version":6,"task_type":14301,"task_param":0,"task_count":400,"award":[[800002,5]]}`|
|607|`{"version":6,"task_type":12311,"task_param":0,"task_count":20,"award":[[800002,5]]}`|
|701|`{"version":7,"task_type":1803,"task_param":0,"task_count":1,"award":[[800002,5]]}`|
|702|`{"version":7,"task_type":1002,"task_param":0,"task_count":50,"award":[[800002,5]]}`|
|703|`{"version":7,"task_type":1,"task_param":0,"task_count":10000,"award":[[800002,5]]}`|
|704|`{"version":7,"task_type":12401,"task_param":0,"task_count":20,"award":[[800002,5]]}`|
|705|`{"version":7,"task_type":7002,"task_param":0,"task_count":20,"award":[[800002,5]]}`|
|706|`{"version":7,"task_type":14301,"task_param":0,"task_count":400,"award":[[800002,5]]}`|
|707|`{"version":7,"task_type":12311,"task_param":0,"task_count":20,"award":[[800002,5]]}`|

## Award

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|48|本表行键；与其他表同值不自动代表同一对象。|
|step|number|48|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|group|number|48|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_id|number|48|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award_num|number|48|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|100030|`{"step":30,"group":1,"award_id":391002,"award_num":1000}`|
|100050|`{"step":50,"group":1,"award_id":141200,"award_num":30}`|
|100080|`{"step":80,"group":1,"award_id":2111200,"award_num":30}`|
|100100|`{"step":100,"group":1,"award_id":390002,"award_num":1}`|
|100120|`{"step":120,"group":1,"award_id":392002,"award_num":10}`|
|100150|`{"step":150,"group":1,"award_id":400110,"award_num":1}`|
|200030|`{"step":30,"group":2,"award_id":391002,"award_num":1000}`|
|200050|`{"step":50,"group":2,"award_id":7001002,"award_num":20}`|
|200080|`{"step":80,"group":2,"award_id":2111200,"award_num":30}`|
|200100|`{"step":100,"group":2,"award_id":7001002,"award_num":20}`|
|200120|`{"step":120,"group":2,"award_id":392002,"award_num":10}`|
|200150|`{"step":150,"group":2,"award_id":7001002,"award_num":40}`|
|300030|`{"step":30,"group":3,"award_id":391002,"award_num":1000}`|
|300050|`{"step":50,"group":3,"award_id":141200,"award_num":30}`|
|300080|`{"step":80,"group":3,"award_id":2111200,"award_num":30}`|
|300100|`{"step":100,"group":3,"award_id":390002,"award_num":1}`|
|300120|`{"step":120,"group":3,"award_id":392002,"award_num":10}`|
|300150|`{"step":150,"group":3,"award_id":400210,"award_num":1}`|
|400030|`{"step":30,"group":4,"award_id":391002,"award_num":1000}`|
|400050|`{"step":50,"group":4,"award_id":7002002,"award_num":20}`|
|400080|`{"step":80,"group":4,"award_id":2111200,"award_num":30}`|
|400100|`{"step":100,"group":4,"award_id":7002002,"award_num":20}`|
|400120|`{"step":120,"group":4,"award_id":392002,"award_num":10}`|
|400150|`{"step":150,"group":4,"award_id":7002002,"award_num":40}`|
|500030|`{"step":30,"group":5,"award_id":391002,"award_num":1000}`|
|500050|`{"step":50,"group":5,"award_id":141200,"award_num":30}`|
|500080|`{"step":80,"group":5,"award_id":2111200,"award_num":30}`|
|500100|`{"step":100,"group":5,"award_id":390002,"award_num":1}`|
|500120|`{"step":120,"group":5,"award_id":392002,"award_num":10}`|
|500150|`{"step":150,"group":5,"award_id":400310,"award_num":1}`|
|600030|`{"step":30,"group":6,"award_id":391002,"award_num":1000}`|
|600050|`{"step":50,"group":6,"award_id":7003002,"award_num":20}`|
|600080|`{"step":80,"group":6,"award_id":2111200,"award_num":30}`|
|600100|`{"step":100,"group":6,"award_id":7003002,"award_num":20}`|
|600120|`{"step":120,"group":6,"award_id":392002,"award_num":10}`|
|600150|`{"step":150,"group":6,"award_id":7003002,"award_num":40}`|
|700030|`{"step":30,"group":7,"award_id":391002,"award_num":1000}`|
|700050|`{"step":50,"group":7,"award_id":141200,"award_num":30}`|
|700080|`{"step":80,"group":7,"award_id":2111200,"award_num":30}`|
|700100|`{"step":100,"group":7,"award_id":390002,"award_num":1}`|
|700120|`{"step":120,"group":7,"award_id":392002,"award_num":10}`|
|700150|`{"step":150,"group":7,"award_id":400410,"award_num":1}`|
|800030|`{"step":30,"group":8,"award_id":391002,"award_num":1000}`|
|800050|`{"step":50,"group":8,"award_id":7004002,"award_num":20}`|
|800080|`{"step":80,"group":8,"award_id":2111200,"award_num":30}`|
|800100|`{"step":100,"group":8,"award_id":7004002,"award_num":20}`|
|800120|`{"step":120,"group":8,"award_id":392002,"award_num":10}`|
|800150|`{"step":150,"group":8,"award_id":7004002,"award_num":40}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|move_speed|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fast_move_speed|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|move_more_condition|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|move_more_step|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|run_effect_step|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camera_move_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_effect_item|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"move_speed":10,"fast_move_speed":20,"move_more_condition":300,"move_more_step":100,"run_effect_step":[6,99],"show_effect_item":[425002,427002,428002,426002,392002,400210,400110]}`|

## TurnChoose

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|14|本表行键；与其他表同值不自动代表同一对象。|
|version|number|14|版本引用；必须按活动类型及其消费者查对应版本表。|
|turn_range|number|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|group_lib|array|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{"version":1,"turn_range":1,"group_lib":[1]}`|
|1002|`{"version":1,"turn_range":999999,"group_lib":[2]}`|
|2001|`{"version":2,"turn_range":1,"group_lib":[1,3,3]}`|
|2002|`{"version":2,"turn_range":999999,"group_lib":[2,4,4]}`|
|3001|`{"version":3,"turn_range":1,"group_lib":[1,3,3]}`|
|3002|`{"version":3,"turn_range":999999,"group_lib":[2,4,4]}`|
|4001|`{"version":4,"turn_range":1,"group_lib":[5,3,1]}`|
|4002|`{"version":4,"turn_range":999999,"group_lib":[6,4,2]}`|
|5001|`{"version":5,"turn_range":1,"group_lib":[5,3,1]}`|
|5002|`{"version":5,"turn_range":999999,"group_lib":[6,4,2]}`|
|6001|`{"version":6,"turn_range":1,"group_lib":[7,5,3]}`|
|6002|`{"version":6,"turn_range":999999,"group_lib":[8,6,4]}`|
|7001|`{"version":7,"turn_range":1,"group_lib":[7,5,3]}`|
|7002|`{"version":7,"turn_range":999999,"group_lib":[8,6,4]}`|

## Gift

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|53|本表行键；与其他表同值不自动代表同一对象。|
|version|number|53|版本引用；必须按活动类型及其消费者查对应版本表。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1220001|`{"version":1}`|
|1220002|`{"version":1}`|
|1220003|`{"version":1}`|
|1220004|`{"version":1}`|
|1220005|`{"version":1}`|
|1220006|`{"version":1}`|
|1220007|`{"version":1}`|
|1220011|`{"version":2}`|
|1220012|`{"version":2}`|
|1220013|`{"version":2}`|
|1220014|`{"version":2}`|
|1220015|`{"version":2}`|
|1220016|`{"version":2}`|
|1220017|`{"version":2}`|
|1220021|`{"version":3}`|
|1220022|`{"version":3}`|
|1220023|`{"version":3}`|
|1220024|`{"version":3}`|
|1220025|`{"version":3}`|
|1220026|`{"version":3}`|
|1220027|`{"version":3}`|
|1220031|`{"version":4}`|
|1220032|`{"version":4}`|
|1220033|`{"version":4}`|
|1220034|`{"version":4}`|
|1220035|`{"version":4}`|
|1220036|`{"version":4}`|
|1220037|`{"version":4}`|
|1220038|`{"version":4}`|
|1220041|`{"version":5}`|
|1220042|`{"version":5}`|
|1220043|`{"version":5}`|
|1220044|`{"version":5}`|
|1220045|`{"version":5}`|
|1220046|`{"version":5}`|
|1220047|`{"version":5}`|
|1220048|`{"version":5}`|
|1220051|`{"version":6}`|
|1220052|`{"version":6}`|
|1220053|`{"version":6}`|
|1220054|`{"version":6}`|
|1220055|`{"version":6}`|
|1220056|`{"version":6}`|
|1220057|`{"version":6}`|
|1220058|`{"version":6}`|
|1220061|`{"version":7}`|
|1220062|`{"version":7}`|
|1220063|`{"version":7}`|
|1220064|`{"version":7}`|
|1220065|`{"version":7}`|
|1220066|`{"version":7}`|
|1220067|`{"version":7}`|
|1220068|`{"version":7}`|
