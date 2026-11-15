# ArenaContestTable 规则参数

来源：[personal-server/assets/tables/ArenaContestTable.data.lua.json.gz](../../../../personal-server/assets/tables/ArenaContestTable.data.lua.json.gz)，SHA256：`3d01441d179330d9206face941b6b79a16a106d02188f73bf415311c6058024d`。

[完整逐行JSON](ArenaContestTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[ArenaDailyTask](#arenadailytask)|0|decoded-rows|
|[ShowAward](#showaward)|1|decoded-rows|
|[RankAward](#rankaward)|39|decoded-rows|
|[CongratulateAward](#congratulateaward)|3|decoded-rows|
|[GuessAward](#guessaward)|3|decoded-rows|
|[WatchAward](#watchaward)|1|decoded-rows|
|[BigState](#bigstate)|6|decoded-rows|
|[Show](#show)|8|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[Timer](#timer)|70|decoded-rows|
|[Round](#round)|2|decoded-rows|
|[CrossTimer](#crosstimer)|76|decoded-rows|
|[RoundState](#roundstate)|33|decoded-rows|
|[StateEnum](#stateenum)|19|decoded-rows|
|[State](#state)|21|decoded-rows|
|[FightTime](#fighttime)|46|decoded-rows|
|[BarrageConst](#barrageconst)|1|decoded-rows|
|[Barrage](#barrage)|8|decoded-rows|

## ArenaDailyTask

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## ShowAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|res_list|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|

## RankAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|39|本表行键；与其他表同值不自动代表同一对象。|
|cross_stage|number|39|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rank_range|array|39|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|39|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"cross_stage":0,"rank_range":[1,1],"award":[[300108,1],[101900,3200],[392002,13],[391002,1600]]}`|
|2|`{"cross_stage":0,"rank_range":[2,2],"award":[[101900,2800],[392002,12],[391002,1500]]}`|
|3|`{"cross_stage":0,"rank_range":[3,4],"award":[[101900,2400],[392002,11],[391002,1400]]}`|
|4|`{"cross_stage":0,"rank_range":[5,8],"award":[[101900,2100],[392002,10],[391002,1300]]}`|
|5|`{"cross_stage":0,"rank_range":[9,16],"award":[[101900,1900],[392002,9],[391002,1200]]}`|
|6|`{"cross_stage":0,"rank_range":[17,32],"award":[[101900,1700],[392002,8],[391002,1100]]}`|
|7|`{"cross_stage":0,"rank_range":[33,64],"award":[[101900,1500],[392002,7],[391002,1000]]}`|
|8|`{"cross_stage":0,"rank_range":[65,128],"award":[[101900,1300],[392002,6],[391002,900]]}`|
|9|`{"cross_stage":0,"rank_range":[129,5000],"award":[[101900,1200],[392002,5],[391002,800]]}`|
|101|`{"cross_stage":1,"rank_range":[1,1],"award":[[347808,1],[101900,3200],[392002,14],[391002,1700]]}`|
|102|`{"cross_stage":1,"rank_range":[2,2],"award":[[101900,2800],[392002,13],[391002,1600]]}`|
|103|`{"cross_stage":1,"rank_range":[3,4],"award":[[101900,2400],[392002,12],[391002,1500]]}`|
|104|`{"cross_stage":1,"rank_range":[5,8],"award":[[101900,2100],[392002,11],[391002,1400]]}`|
|105|`{"cross_stage":1,"rank_range":[9,16],"award":[[101900,1900],[392002,10],[391002,1300]]}`|
|106|`{"cross_stage":1,"rank_range":[17,32],"award":[[101900,1700],[392002,9],[391002,1200]]}`|
|107|`{"cross_stage":1,"rank_range":[33,64],"award":[[101900,1500],[392002,8],[391002,1100]]}`|
|108|`{"cross_stage":1,"rank_range":[65,128],"award":[[101900,1300],[392002,7],[391002,1000]]}`|
|109|`{"cross_stage":1,"rank_range":[129,256],"award":[[101900,1200],[392002,6],[391002,900]]}`|
|110|`{"cross_stage":1,"rank_range":[257,5000],"award":[[101900,1100],[392002,5],[391002,800]]}`|
|201|`{"cross_stage":2,"rank_range":[1,1],"award":[[352408,1],[101900,3200],[392002,15],[391002,1800]]}`|
|202|`{"cross_stage":2,"rank_range":[2,2],"award":[[101900,2800],[392002,14],[391002,1700]]}`|
|203|`{"cross_stage":2,"rank_range":[3,4],"award":[[101900,2400],[392002,13],[391002,1600]]}`|
|204|`{"cross_stage":2,"rank_range":[5,8],"award":[[101900,2100],[392002,12],[391002,1500]]}`|
|205|`{"cross_stage":2,"rank_range":[9,16],"award":[[101900,1900],[392002,11],[391002,1400]]}`|
|206|`{"cross_stage":2,"rank_range":[17,32],"award":[[101900,1700],[392002,10],[391002,1300]]}`|
|207|`{"cross_stage":2,"rank_range":[33,64],"award":[[101900,1500],[392002,9],[391002,1200]]}`|
|208|`{"cross_stage":2,"rank_range":[65,128],"award":[[101900,1300],[392002,8],[391002,1100]]}`|
|209|`{"cross_stage":2,"rank_range":[129,256],"award":[[101900,1200],[392002,7],[391002,1000]]}`|
|210|`{"cross_stage":2,"rank_range":[257,5000],"award":[[101900,1100],[392002,6],[391002,900]]}`|
|301|`{"cross_stage":3,"rank_range":[1,1],"award":[[355108,1],[101900,3200],[392002,16],[391002,1900]]}`|
|302|`{"cross_stage":3,"rank_range":[2,2],"award":[[101900,2800],[392002,15],[391002,1800]]}`|
|303|`{"cross_stage":3,"rank_range":[3,4],"award":[[101900,2400],[392002,14],[391002,1700]]}`|
|304|`{"cross_stage":3,"rank_range":[5,8],"award":[[101900,2100],[392002,13],[391002,1600]]}`|
|305|`{"cross_stage":3,"rank_range":[9,16],"award":[[101900,1900],[392002,12],[391002,1500]]}`|
|306|`{"cross_stage":3,"rank_range":[17,32],"award":[[101900,1700],[392002,11],[391002,1400]]}`|
|307|`{"cross_stage":3,"rank_range":[33,64],"award":[[101900,1500],[392002,10],[391002,1300]]}`|
|308|`{"cross_stage":3,"rank_range":[65,128],"award":[[101900,1300],[392002,9],[391002,1200]]}`|
|309|`{"cross_stage":3,"rank_range":[129,256],"award":[[101900,1200],[392002,8],[391002,1100]]}`|
|310|`{"cross_stage":3,"rank_range":[257,5000],"award":[[101900,1100],[392002,7],[391002,1000]]}`|

## CongratulateAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|award|array|3|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award":[[201500,1000]]}`|
|2|`{"award":[[201500,1000]]}`|
|3|`{"award":[[201500,1000]]}`|

## GuessAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|res_list|array|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|

## WatchAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|need_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|res_list|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"need_time":60}`|

## BigState

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|
|6|`{}`|

## Show

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|8|本表行键；与其他表同值不自动代表同一对象。|
|navigation_name|string|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

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

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|fun_open|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|server_day|number|1|旧Activity相对开服日字段；不是角色创角天数。|
|one_key_open|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|player_lv|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|guess_interval|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_calc_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rev_award_max_round|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|popularity_refresh|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|congratulate_msg|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|congratulate_valid_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|congratulate_msg_max|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|play_back_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|main_house_tip_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|guess_record_show_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|invitation_level|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cross_open_day|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|congratulate_num_max|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|group_role_num|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"fun_open":1064,"server_day":3,"one_key_open":254606700001,"player_lv":25,"guess_interval":60,"fight_calc_time":120,"rev_award_max_round":9,"popularity_refresh":[[3600,5],[3601,60]],"congratulate_valid_time":3600,"congratulate_msg_max":5,"play_back_time":150,"main_house_tip_time":20,"guess_record_show_count":7,"invitation_level":20,"cross_open_day":13,"congratulate_num_max":3,"group_role_num":[128,256]}`|

## Timer

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|70|本表行键；与其他表同值不自动代表同一对象。|
|time|number|70|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_start_server_timer|boolean|70|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"time":44400,"is_start_server_timer":true}`|
|102|`{"time":44970,"is_start_server_timer":true}`|
|103|`{"time":45000,"is_start_server_timer":true}`|
|104|`{"time":45270,"is_start_server_timer":true}`|
|105|`{"time":45300,"is_start_server_timer":true}`|
|106|`{"time":45570,"is_start_server_timer":true}`|
|107|`{"time":45600,"is_start_server_timer":true}`|
|108|`{"time":45870,"is_start_server_timer":true}`|
|109|`{"time":45900,"is_start_server_timer":true}`|
|110|`{"time":46170,"is_start_server_timer":true}`|
|111|`{"time":46200,"is_start_server_timer":true}`|
|112|`{"time":46470,"is_start_server_timer":true}`|
|113|`{"time":46500,"is_start_server_timer":true}`|
|114|`{"time":46770,"is_start_server_timer":true}`|
|115|`{"time":46800,"is_start_server_timer":true}`|
|116|`{"time":47070,"is_start_server_timer":true}`|
|117|`{"time":47100,"is_start_server_timer":true}`|
|118|`{"time":47370,"is_start_server_timer":true}`|
|119|`{"time":47400,"is_start_server_timer":true}`|
|130|`{"time":48600,"is_start_server_timer":true}`|
|131|`{"time":64800,"is_start_server_timer":true}`|
|132|`{"time":65130,"is_start_server_timer":true}`|
|133|`{"time":65160,"is_start_server_timer":true}`|
|134|`{"time":65490,"is_start_server_timer":true}`|
|135|`{"time":65520,"is_start_server_timer":true}`|
|136|`{"time":65970,"is_start_server_timer":true}`|
|137|`{"time":66000,"is_start_server_timer":true}`|
|138|`{"time":66330,"is_start_server_timer":true}`|
|139|`{"time":66360,"is_start_server_timer":true}`|
|140|`{"time":66690,"is_start_server_timer":true}`|
|141|`{"time":66720,"is_start_server_timer":true}`|
|142|`{"time":67050,"is_start_server_timer":true}`|
|143|`{"time":67080,"is_start_server_timer":true}`|
|144|`{"time":67410,"is_start_server_timer":true}`|
|145|`{"time":67440,"is_start_server_timer":true}`|
|146|`{"time":67770,"is_start_server_timer":true}`|
|147|`{"time":67800,"is_start_server_timer":true}`|
|201|`{"time":67830,"is_start_server_timer":true}`|
|202|`{"time":68400,"is_start_server_timer":true}`|
|203|`{"time":68404,"is_start_server_timer":true}`|
|204|`{"time":68408,"is_start_server_timer":true}`|
|205|`{"time":68412,"is_start_server_timer":true}`|
|206|`{"time":68416,"is_start_server_timer":true}`|
|301|`{"time":71996,"is_start_server_timer":true}`|
|302|`{"time":72000,"is_start_server_timer":true}`|
|303|`{"time":72004,"is_start_server_timer":true}`|
|304|`{"time":72008,"is_start_server_timer":true}`|
|305|`{"time":72012,"is_start_server_timer":true}`|
|306|`{"time":72016,"is_start_server_timer":true}`|
|401|`{"time":73916,"is_start_server_timer":true}`|
|402|`{"time":73920,"is_start_server_timer":true}`|
|403|`{"time":73924,"is_start_server_timer":true}`|
|404|`{"time":73928,"is_start_server_timer":true}`|
|405|`{"time":73932,"is_start_server_timer":true}`|
|406|`{"time":73936,"is_start_server_timer":true}`|
|501|`{"time":74876,"is_start_server_timer":true}`|
|502|`{"time":74880,"is_start_server_timer":true}`|
|503|`{"time":74884,"is_start_server_timer":true}`|
|504|`{"time":74888,"is_start_server_timer":true}`|
|505|`{"time":74892,"is_start_server_timer":true}`|
|506|`{"time":74896,"is_start_server_timer":true}`|
|601|`{"time":75420,"is_start_server_timer":true}`|
|701|`{"time":18000,"is_start_server_timer":false}`|
|702|`{"time":75420,"is_start_server_timer":false}`|
|703|`{"time":82800,"is_start_server_timer":false}`|
|704|`{"time":82800,"is_start_server_timer":false}`|
|705|`{"time":44400,"is_start_server_timer":false}`|
|706|`{"time":46800,"is_start_server_timer":false}`|
|707|`{"time":72000,"is_start_server_timer":false}`|
|708|`{"time":86400,"is_start_server_timer":false}`|

## Round

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|max_round|number|2|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|point_max_round|number|2|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|group_start_round|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|four_start_round|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|final_start_round|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"max_round":30,"point_max_round":9,"group_start_round":10,"four_start_round":19,"final_start_round":22}`|
|2|`{"max_round":33,"point_max_round":9,"group_start_round":10,"four_start_round":19,"final_start_round":25}`|

## CrossTimer

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|76|本表行键；与其他表同值不自动代表同一对象。|
|time|number|76|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_start_server_timer|boolean|76|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"time":44400,"is_start_server_timer":true}`|
|102|`{"time":44970,"is_start_server_timer":true}`|
|103|`{"time":45000,"is_start_server_timer":true}`|
|104|`{"time":45150,"is_start_server_timer":true}`|
|105|`{"time":45180,"is_start_server_timer":true}`|
|106|`{"time":45330,"is_start_server_timer":true}`|
|107|`{"time":45360,"is_start_server_timer":true}`|
|108|`{"time":45510,"is_start_server_timer":true}`|
|109|`{"time":45540,"is_start_server_timer":true}`|
|110|`{"time":45690,"is_start_server_timer":true}`|
|111|`{"time":45720,"is_start_server_timer":true}`|
|112|`{"time":45870,"is_start_server_timer":true}`|
|113|`{"time":45900,"is_start_server_timer":true}`|
|114|`{"time":46050,"is_start_server_timer":true}`|
|115|`{"time":46080,"is_start_server_timer":true}`|
|116|`{"time":46230,"is_start_server_timer":true}`|
|117|`{"time":46260,"is_start_server_timer":true}`|
|118|`{"time":46410,"is_start_server_timer":true}`|
|119|`{"time":46440,"is_start_server_timer":true}`|
|130|`{"time":46800,"is_start_server_timer":true}`|
|131|`{"time":64800,"is_start_server_timer":true}`|
|132|`{"time":65130,"is_start_server_timer":true}`|
|133|`{"time":65160,"is_start_server_timer":true}`|
|134|`{"time":65490,"is_start_server_timer":true}`|
|135|`{"time":65520,"is_start_server_timer":true}`|
|136|`{"time":65970,"is_start_server_timer":true}`|
|137|`{"time":66000,"is_start_server_timer":true}`|
|138|`{"time":66330,"is_start_server_timer":true}`|
|139|`{"time":66360,"is_start_server_timer":true}`|
|140|`{"time":66690,"is_start_server_timer":true}`|
|141|`{"time":66720,"is_start_server_timer":true}`|
|142|`{"time":67050,"is_start_server_timer":true}`|
|143|`{"time":67080,"is_start_server_timer":true}`|
|144|`{"time":67410,"is_start_server_timer":true}`|
|145|`{"time":67440,"is_start_server_timer":true}`|
|146|`{"time":67770,"is_start_server_timer":true}`|
|147|`{"time":67800,"is_start_server_timer":true}`|
|160|`{"time":67830,"is_start_server_timer":true}`|
|161|`{"time":68400,"is_start_server_timer":true}`|
|162|`{"time":68410,"is_start_server_timer":true}`|
|163|`{"time":68420,"is_start_server_timer":true}`|
|164|`{"time":68430,"is_start_server_timer":true}`|
|165|`{"time":68440,"is_start_server_timer":true}`|
|201|`{"time":68450,"is_start_server_timer":true}`|
|202|`{"time":68460,"is_start_server_timer":true}`|
|203|`{"time":68470,"is_start_server_timer":true}`|
|204|`{"time":68480,"is_start_server_timer":true}`|
|205|`{"time":68490,"is_start_server_timer":true}`|
|206|`{"time":68500,"is_start_server_timer":true}`|
|301|`{"time":71996,"is_start_server_timer":true}`|
|302|`{"time":72000,"is_start_server_timer":true}`|
|303|`{"time":72004,"is_start_server_timer":true}`|
|304|`{"time":72008,"is_start_server_timer":true}`|
|305|`{"time":72012,"is_start_server_timer":true}`|
|306|`{"time":72016,"is_start_server_timer":true}`|
|401|`{"time":73916,"is_start_server_timer":true}`|
|402|`{"time":73920,"is_start_server_timer":true}`|
|403|`{"time":73924,"is_start_server_timer":true}`|
|404|`{"time":73928,"is_start_server_timer":true}`|
|405|`{"time":73932,"is_start_server_timer":true}`|
|406|`{"time":73936,"is_start_server_timer":true}`|
|501|`{"time":74876,"is_start_server_timer":true}`|
|502|`{"time":74880,"is_start_server_timer":true}`|
|503|`{"time":74884,"is_start_server_timer":true}`|
|504|`{"time":74888,"is_start_server_timer":true}`|
|505|`{"time":74892,"is_start_server_timer":true}`|
|506|`{"time":74896,"is_start_server_timer":true}`|
|601|`{"time":75420,"is_start_server_timer":true}`|
|701|`{"time":18000,"is_start_server_timer":false}`|
|702|`{"time":75420,"is_start_server_timer":false}`|
|703|`{"time":82800,"is_start_server_timer":false}`|
|704|`{"time":82800,"is_start_server_timer":false}`|
|705|`{"time":44400,"is_start_server_timer":false}`|
|706|`{"time":46800,"is_start_server_timer":false}`|
|707|`{"time":72000,"is_start_server_timer":false}`|
|708|`{"time":86400,"is_start_server_timer":false}`|

## RoundState

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|33|本表行键；与其他表同值不自动代表同一对象。|
|local_big_state|number|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|local_small_state|number|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cross_big_state|number|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cross_small_state|number|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"local_big_state":2,"local_small_state":0,"cross_big_state":2,"cross_small_state":0}`|
|2|`{"local_big_state":2,"local_small_state":0,"cross_big_state":2,"cross_small_state":0}`|
|3|`{"local_big_state":2,"local_small_state":0,"cross_big_state":2,"cross_small_state":0}`|
|4|`{"local_big_state":2,"local_small_state":0,"cross_big_state":2,"cross_small_state":0}`|
|5|`{"local_big_state":2,"local_small_state":0,"cross_big_state":2,"cross_small_state":0}`|
|6|`{"local_big_state":2,"local_small_state":0,"cross_big_state":2,"cross_small_state":0}`|
|7|`{"local_big_state":2,"local_small_state":0,"cross_big_state":2,"cross_small_state":0}`|
|8|`{"local_big_state":2,"local_small_state":0,"cross_big_state":2,"cross_small_state":0}`|
|9|`{"local_big_state":2,"local_small_state":0,"cross_big_state":2,"cross_small_state":0}`|
|10|`{"local_big_state":4,"local_small_state":1004,"cross_big_state":4,"cross_small_state":2004}`|
|11|`{"local_big_state":4,"local_small_state":1004,"cross_big_state":4,"cross_small_state":2004}`|
|12|`{"local_big_state":4,"local_small_state":1004,"cross_big_state":4,"cross_small_state":2004}`|
|13|`{"local_big_state":4,"local_small_state":1005,"cross_big_state":4,"cross_small_state":2005}`|
|14|`{"local_big_state":4,"local_small_state":1005,"cross_big_state":4,"cross_small_state":2005}`|
|15|`{"local_big_state":4,"local_small_state":1005,"cross_big_state":4,"cross_small_state":2005}`|
|16|`{"local_big_state":4,"local_small_state":1006,"cross_big_state":4,"cross_small_state":2006}`|
|17|`{"local_big_state":4,"local_small_state":1006,"cross_big_state":4,"cross_small_state":2006}`|
|18|`{"local_big_state":4,"local_small_state":1006,"cross_big_state":4,"cross_small_state":2006}`|
|19|`{"local_big_state":5,"local_small_state":1007,"cross_big_state":5,"cross_small_state":2007}`|
|20|`{"local_big_state":5,"local_small_state":1007,"cross_big_state":5,"cross_small_state":2007}`|
|21|`{"local_big_state":5,"local_small_state":1007,"cross_big_state":5,"cross_small_state":2007}`|
|22|`{"local_big_state":6,"local_small_state":1008,"cross_big_state":5,"cross_small_state":2008}`|
|23|`{"local_big_state":6,"local_small_state":1008,"cross_big_state":5,"cross_small_state":2008}`|
|24|`{"local_big_state":6,"local_small_state":1008,"cross_big_state":5,"cross_small_state":2008}`|
|25|`{"local_big_state":6,"local_small_state":1009,"cross_big_state":6,"cross_small_state":2009}`|
|26|`{"local_big_state":6,"local_small_state":1009,"cross_big_state":6,"cross_small_state":2009}`|
|27|`{"local_big_state":6,"local_small_state":1009,"cross_big_state":6,"cross_small_state":2009}`|
|28|`{"local_big_state":6,"local_small_state":1010,"cross_big_state":6,"cross_small_state":2010}`|
|29|`{"local_big_state":6,"local_small_state":1010,"cross_big_state":6,"cross_small_state":2010}`|
|30|`{"local_big_state":6,"local_small_state":1010,"cross_big_state":6,"cross_small_state":2010}`|
|31|`{"local_big_state":0,"local_small_state":0,"cross_big_state":6,"cross_small_state":2011}`|
|32|`{"local_big_state":0,"local_small_state":0,"cross_big_state":6,"cross_small_state":2011}`|
|33|`{"local_big_state":0,"local_small_state":0,"cross_big_state":6,"cross_small_state":2011}`|

## StateEnum

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|19|本表行键；与其他表同值不自动代表同一对象。|
|fight_duration|number|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cross_fight_duration|number|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"fight_duration":0,"cross_fight_duration":0}`|
|2|`{"fight_duration":180,"cross_fight_duration":180}`|
|3|`{"fight_duration":0,"cross_fight_duration":0}`|
|4|`{"fight_duration":360,"cross_fight_duration":360}`|
|5|`{"fight_duration":0,"cross_fight_duration":0}`|
|6|`{"fight_duration":360,"cross_fight_duration":360}`|
|7|`{"fight_duration":0,"cross_fight_duration":0}`|
|8|`{"fight_duration":360,"cross_fight_duration":360}`|
|9|`{"fight_duration":0,"cross_fight_duration":0}`|
|10|`{"fight_duration":150,"cross_fight_duration":100}`|
|11|`{"fight_duration":0,"cross_fight_duration":0}`|
|12|`{"fight_duration":150,"cross_fight_duration":100}`|
|13|`{"fight_duration":0,"cross_fight_duration":0}`|
|14|`{"fight_duration":160,"cross_fight_duration":160}`|
|15|`{"fight_duration":0,"cross_fight_duration":0}`|
|16|`{"fight_duration":160,"cross_fight_duration":160}`|
|17|`{"fight_duration":0,"cross_fight_duration":0}`|
|18|`{"fight_duration":160,"cross_fight_duration":160}`|
|19|`{"fight_duration":0,"cross_fight_duration":0}`|

## State

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|21|本表行键；与其他表同值不自动代表同一对象。|
|start_time|number|21|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|end_time|number|21|结束日期内秒偏移；不是单独完整时间戳。|
|state|number|21|旧活动阶段ID数组；与state_end_day/state_end_time逐项配对。|
|arena_type|number|21|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|big_state|number|21|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{"start_time":0,"end_time":45000,"state":1,"arena_type":0,"big_state":1}`|
|1002|`{"start_time":45000,"end_time":46800,"state":2,"arena_type":0,"big_state":2}`|
|1003|`{"start_time":46800,"end_time":64800,"state":3,"arena_type":0,"big_state":3}`|
|1004|`{"start_time":64800,"end_time":66000,"state":4,"arena_type":0,"big_state":4}`|
|1005|`{"start_time":66000,"end_time":67200,"state":6,"arena_type":0,"big_state":4}`|
|1006|`{"start_time":67200,"end_time":68400,"state":8,"arena_type":0,"big_state":4}`|
|1007|`{"start_time":68400,"end_time":72000,"state":12,"arena_type":0,"big_state":5}`|
|1008|`{"start_time":72000,"end_time":73980,"state":14,"arena_type":0,"big_state":6}`|
|1009|`{"start_time":73980,"end_time":74940,"state":16,"arena_type":0,"big_state":6}`|
|1010|`{"start_time":74940,"end_time":75600,"state":18,"arena_type":0,"big_state":6}`|
|2001|`{"start_time":0,"end_time":45000,"state":1,"arena_type":1,"big_state":1}`|
|2002|`{"start_time":45000,"end_time":46800,"state":2,"arena_type":1,"big_state":2}`|
|2003|`{"start_time":46800,"end_time":64800,"state":3,"arena_type":1,"big_state":3}`|
|2004|`{"start_time":64800,"end_time":66000,"state":4,"arena_type":1,"big_state":4}`|
|2005|`{"start_time":66000,"end_time":67200,"state":6,"arena_type":1,"big_state":4}`|
|2006|`{"start_time":67200,"end_time":68400,"state":8,"arena_type":1,"big_state":4}`|
|2007|`{"start_time":68400,"end_time":70200,"state":10,"arena_type":1,"big_state":5}`|
|2008|`{"start_time":70200,"end_time":72000,"state":12,"arena_type":1,"big_state":5}`|
|2009|`{"start_time":72000,"end_time":73980,"state":14,"arena_type":1,"big_state":6}`|
|2010|`{"start_time":73980,"end_time":74940,"state":16,"arena_type":1,"big_state":6}`|
|2011|`{"start_time":74940,"end_time":75600,"state":18,"arena_type":1,"big_state":6}`|

## FightTime

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|46|本表行键；与其他表同值不自动代表同一对象。|
|start_time|array|46|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1007011|`{"start_time":[68400,68550,68700]}`|
|1007012|`{"start_time":[68850,69000,69150]}`|
|1007013|`{"start_time":[69300,69450,69600]}`|
|1007014|`{"start_time":[69750,69900,70050]}`|
|1007021|`{"start_time":[70200,70350,70500]}`|
|1007022|`{"start_time":[70650,70800,70950]}`|
|1007023|`{"start_time":[71100,71250,71400]}`|
|1007024|`{"start_time":[71550,71700,71850]}`|
|1008011|`{"start_time":[72000,72160,72320]}`|
|1008012|`{"start_time":[72480,72640,72800]}`|
|1008013|`{"start_time":[72960,73120,73280]}`|
|1008014|`{"start_time":[73440,73600,73760]}`|
|1009015|`{"start_time":[73920,74080,74240]}`|
|1009016|`{"start_time":[74400,74560,74720]}`|
|1010017|`{"start_time":[74880,75040,75200]}`|
|2007011|`{"start_time":[68400,68500,68600]}`|
|2007012|`{"start_time":[68700,68800,68900]}`|
|2007013|`{"start_time":[69000,69100,69200]}`|
|2007014|`{"start_time":[69300,69400,69500]}`|
|2007021|`{"start_time":[68400,68500,68600]}`|
|2007022|`{"start_time":[68700,68800,68900]}`|
|2007023|`{"start_time":[69000,69100,69200]}`|
|2007024|`{"start_time":[69300,69400,69500]}`|
|2007031|`{"start_time":[70200,70300,70400]}`|
|2007032|`{"start_time":[70500,70600,70700]}`|
|2007033|`{"start_time":[70800,70900,71000]}`|
|2007034|`{"start_time":[71100,71200,71300]}`|
|2007041|`{"start_time":[70200,70300,70400]}`|
|2007042|`{"start_time":[70500,70600,70700]}`|
|2007043|`{"start_time":[70800,70900,71000]}`|
|2007044|`{"start_time":[71100,71200,71300]}`|
|2008015|`{"start_time":[69600,69700,69800]}`|
|2008016|`{"start_time":[69900,70000,70100]}`|
|2008025|`{"start_time":[69600,69700,69800]}`|
|2008026|`{"start_time":[69900,70000,70100]}`|
|2008035|`{"start_time":[71400,71500,71600]}`|
|2008036|`{"start_time":[71700,71800,71900]}`|
|2008045|`{"start_time":[71400,71500,71600]}`|
|2008046|`{"start_time":[71700,71800,71900]}`|
|2009011|`{"start_time":[72000,72160,72320]}`|
|2009012|`{"start_time":[72480,72640,72800]}`|
|2009013|`{"start_time":[72960,73120,73280]}`|
|2009014|`{"start_time":[73440,73600,73760]}`|
|2010015|`{"start_time":[73920,74080,74240]}`|
|2010016|`{"start_time":[74400,74560,74720]}`|
|2011017|`{"start_time":[74880,75040,75200]}`|

## BarrageConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|move_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|random_max|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|random_min|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|show_rank|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"move_time":5,"random_max":10,"random_min":2,"show_rank":8}`|

## Barrage

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|8|本表行键；与其他表同值不自动代表同一对象。|
|weight|number|8|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|
|barrage|array|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"weight":40}`|
|2|`{"weight":20}`|
|3|`{"weight":10}`|
|4|`{"weight":6}`|
|5|`{"weight":6}`|
|6|`{"weight":6}`|
|7|`{"weight":6}`|
|8|`{"weight":6}`|
