# ActivityTable 规则参数

来源：[personal-server/assets/tables/ActivityTable.data.lua.json.gz](../../../../personal-server/assets/tables/ActivityTable.data.lua.json.gz)，SHA256：`2b9b7814f793248cffd72029bc330f77275ee51c3865e1c5897935c91867a234`。

[完整逐行JSON](ActivityTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[ActDrawAwardLib](#actdrawawardlib)|455|decoded-rows|
|[ActDrawAward](#actdrawaward)|55|decoded-rows|
|[ActDrawAwardOpen](#actdrawawardopen)|3|decoded-rows|
|[CrossServerActivity](#crossserveractivity)|9|decoded-rows|
|[DivineMainAward](#divinemainaward)|1|decoded-rows|
|[DivineMainDrawShow](#divinemaindrawshow)|11|decoded-rows|
|[OverallActYearTask](#overallactyeartask)|1|decoded-rows|
|[PlayCakeDailyReward](#playcakedailyreward)|3|decoded-rows|
|[PlayCakeActivity](#playcakeactivity)|1|decoded-rows|
|[PlayCakeConst](#playcakeconst)|1|decoded-rows|
|[TravelGlobalPermitTask](#travelglobalpermittask)|25|decoded-rows|
|[TravelGlobalPermitBase](#travelglobalpermitbase)|0|decoded-rows|
|[TravelGlobalPermitChanllenge](#travelglobalpermitchanllenge)|5|decoded-rows|
|[UnchartedReward](#unchartedreward)|3|decoded-rows|
|[VersionActivity](#versionactivity)|1|decoded-rows|
|[NewHeroBelong](#newherobelong)|43|decoded-rows|
|[ThemeGroupContent](#themegroupcontent)|4|decoded-rows|
|[ThemeGroup](#themegroup)|2|decoded-rows|
|[Theme](#theme)|11|rows-with-external-references|
|[MutexGroup](#mutexgroup)|42|decoded-rows|
|[MutexType](#mutextype)|1|decoded-rows|
|[Mutex](#mutex)|5|decoded-rows|
|[Promotion](#promotion)|1|decoded-rows|
|[Entrance](#entrance)|4|rows-with-external-references|
|[Func](#func)|118|rows-with-external-references|
|[Server](#server)|7|decoded-rows|
|[State](#state)|11|decoded-rows|
|[Activity](#activity)|1109|decoded-rows|
|[FlashSaleTaskGroup](#flashsaletaskgroup)|3|decoded-rows|
|[FlashSaleTask](#flashsaletask)|30|decoded-rows|
|[FlashSaleVersion](#flashsaleversion)|2|decoded-rows|
|[FlashSaleConst](#flashsaleconst)|2|decoded-rows|
|[FlashSaleGift](#flashsalegift)|2|decoded-rows|

## ActDrawAwardLib

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|455|本表行键；与其他表同值不自动代表同一对象。|
|draw_num|number|455|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|draw_award|array|455|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|is_big|boolean|455|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部455行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{"draw_num":10,"draw_award":[[499002,5],[2171200,20]],"is_big":true}`|
|1002|`{"draw_num":30,"draw_award":[[499002,5],[2171200,20]],"is_big":true}`|
|1003|`{"draw_num":60,"draw_award":[[499002,5],[2171200,20]],"is_big":true}`|

## ActDrawAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|item_title_name|number|55|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_lib|array|55|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|init_count|number|55|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|settle_res_exchange|number|55|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|55|本表行键；与其他表同值不自动代表同一对象。|
|add_count|number|55|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|red_dot|number|55|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|77019|`{"item_title_name":670571,"award_lib":[3001,3002,3003,3004,3005,3006,3007],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|77020|`{"item_title_name":670571,"award_lib":[4001,4002,4003,4004,4005,4006,4007],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|77021|`{"item_title_name":670571,"award_lib":[5001,5002,5003,5004,5005,5006,5007],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|77022|`{"item_title_name":670571,"award_lib":[10001,10002,10003,10004,10005,10006,10007],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|77023|`{"item_title_name":670571,"award_lib":[9001,9002,9003,9004,9005,9006,9007],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|77025|`{"item_title_name":670571,"award_lib":[11001,11002,11003,11004,11005,11006,11007],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|77027|`{"item_title_name":670571,"award_lib":[11001,11002,11003,11004,11005,11006,11007],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|77028|`{"item_title_name":670571,"award_lib":[13001,13002,13003,13004,13005,13006,13007],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|77034|`{"item_title_name":670571,"award_lib":[16001,16002,16003,16004,16005,16006,16007],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|77040|`{"item_title_name":670571,"award_lib":[11001,11002,11003,11004,11005,11006,11007],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|77042|`{"item_title_name":670571,"award_lib":[13001,13002,13003,13004,13005,13006,13007],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|77043|`{"item_title_name":670571,"award_lib":[18001,18002,18003,18004,18005,18006,18007],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|77048|`{"item_title_name":670571,"award_lib":[21001,21002,21003,21004,21005,21006,21007,21008,21009,21010,21011,21012],"init_count":15,"settle_res_exchange":17,"add_count":5}`|
|77054|`{"item_title_name":670571,"award_lib":[26001,26002,26003,26004,26005,26006,26007,26008,26009,26010,26011,26012],"init_count":15,"settle_res_exchange":29,"add_count":5}`|
|77055|`{"item_title_name":670571,"award_lib":[27001,27002,27003,27004,27005,27006],"init_count":15,"settle_res_exchange":29,"add_count":5}`|
|83010|`{"item_title_name":670571,"award_lib":[6001,6002,6003,6004,6005,6006],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|83011|`{"item_title_name":670571,"award_lib":[7001,7002,7003,7004,7005,7006],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|83012|`{"item_title_name":670571,"award_lib":[7001,7002,7003,7004,7005,7006],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|83013|`{"item_title_name":670571,"award_lib":[14001,14002,14003,14004,14005,14006,14007,14008,14009,14010,14011],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|83014|`{"item_title_name":670571,"award_lib":[12001,12002,12003,12004,12005,12006,12007,12008,12009,12010,12011],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|83015|`{"item_title_name":670571,"award_lib":[14001,14002,14003,14004,14005,14006,14007,14008,14009,14010,14011],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|83016|`{"item_title_name":670571,"award_lib":[14001,14002,14003,14004,14005,14006,14007,14008,14009,14010,14011],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|83017|`{"item_title_name":670571,"award_lib":[12001,12002,12003,12004,12005,12006,12007,12008,12009,12010,12011],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|83018|`{"item_title_name":670571,"award_lib":[6001,6002,6003,6004,6005,6006],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|83019|`{"item_title_name":670571,"award_lib":[14101,14102,14103,14104,14105,14106,14107,14108,14109,14110,14111],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|83020|`{"item_title_name":670571,"award_lib":[20001,20002,20003,20004,20005,20006,20007,20008,20009,20010,20011],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|83021|`{"item_title_name":670571,"award_lib":[22001,22002,22003,22004,22005,22006,22007,22008,22009,22010,22011],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|83022|`{"item_title_name":670571,"award_lib":[25001,25002,25003,25004,25005,25006,25007,25008,25009,25010,25011],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|83023|`{"item_title_name":670571,"award_lib":[28001,28002,28003,28004,28005,28006,28007,28008,28009,28010,28011],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|83024|`{"item_title_name":670571,"award_lib":[31001,31002,31003,31004,31005,31006,31007,31008,31009],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|83025|`{"item_title_name":670571,"award_lib":[34001,34002,34003,34004,34005,34006,34007,34008,34009,34010,34011,34012,34013],"init_count":15,"settle_res_exchange":39,"add_count":5}`|
|83026|`{"item_title_name":670571,"award_lib":[37001,37002,37003,37004,37005,37006,37007,37008,37009,37010,37011,37012,37013],"init_count":15,"settle_res_exchange":39,"add_count":5}`|
|83027|`{"item_title_name":670571,"award_lib":[38001,38002,38003,38004,38005,38006,38007,38008,38009,38010,38011],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|83028|`{"item_title_name":670571,"award_lib":[40001,40002,40003,40004,40005,40006,40007,40008,40009,40010,40011,40012,40013],"init_count":15,"settle_res_exchange":39,"add_count":5}`|
|83029|`{"item_title_name":670571,"award_lib":[41001,41002,41003,41004,41005,41006,41007,41008,41009,41010,41011],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|83030|`{"item_title_name":670571,"award_lib":[43001,43002,43003,43004,43005,43006,43007,43008,43009,43010,43011,43012,43013],"init_count":15,"settle_res_exchange":39,"add_count":5}`|
|83031|`{"item_title_name":670571,"award_lib":[44001,44002,44003,44004,44005,44006,44007,44008,44009,44010,44011,44012,44013],"init_count":15,"settle_res_exchange":39,"add_count":5}`|
|101005|`{"item_title_name":670571,"award_lib":[1001,1002,1003,1004,1005,1006],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|101006|`{"item_title_name":670571,"award_lib":[8001,8002,8003,8004,8005,8006],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|101009|`{"item_title_name":670571,"award_lib":[15001,15002,15003,15004,15005,15006,15007,15008,15009,15010,15011],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|101012|`{"item_title_name":670571,"award_lib":[17001,17002,17003,17004,17005,17006,17007,17008,17009,17010,17011],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|101013|`{"item_title_name":670571,"award_lib":[8001,8002,8003,8004,8005,8006],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|101014|`{"item_title_name":670571,"award_lib":[19001,19002,19003,19004,19005,19006,19007,19008,19009,19010,19011],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|101015|`{"item_title_name":670571,"award_lib":[23001,23002,23003,23004,23005,23006,23007,23008,23009,23010,23011],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|101016|`{"item_title_name":670571,"award_lib":[24001,24002,24003,24004,24005,24006,24007,24008,24009,24010,24011],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|101017|`{"item_title_name":670571,"award_lib":[29001,29002,29003,29004,29005,29006,29007,29008,29009,29010,29011],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|101018|`{"item_title_name":670571,"award_lib":[30001,30002,30003,30004,30005,30006,30007,30008,30009,30010,30011],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|101019|`{"item_title_name":670571,"award_lib":[32001,32002,32003,32004,32005,32006,32007,32008,32009,32010,32011],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|101020|`{"item_title_name":670571,"award_lib":[33001,33002,33003,33004,33005,33006,33007,33008,33009,33010,33011,33012],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|101021|`{"item_title_name":670571,"award_lib":[35001,35002,35003,35004,35005,35006,35007,35008,35009,35010,35011],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|101022|`{"item_title_name":670571,"award_lib":[33001,33002,33003,33004,33005,33006,33007,33008,33009,33010,33011,33012],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|101023|`{"item_title_name":670571,"award_lib":[36001,36002,36003,36004,36005,36006,36007,36008,36009,36010,36011,36012],"init_count":15,"settle_res_exchange":41,"add_count":5}`|
|101024|`{"item_title_name":670571,"award_lib":[39001,39002,39003,39004,39005,39006,39007,39008,39009,39010,39011,39012],"init_count":15,"settle_res_exchange":0,"add_count":5}`|
|101025|`{"item_title_name":670571,"award_lib":[42001,42002,42003,42004,42005,42006,42007,42008,42009,42010,42011,42012],"init_count":15,"settle_res_exchange":41,"add_count":5}`|
|101026|`{"item_title_name":670571,"award_lib":[45001,45002,45003,45004,45005,45006,45007,45008,45009,45010,45011,45012],"init_count":15,"settle_res_exchange":41,"add_count":5}`|

## ActDrawAwardOpen

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|open_tid|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|mail|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|77|`{"open_tid":1366}`|
|83|`{"open_tid":1367}`|
|101|`{"open_tid":1368}`|

## CrossServerActivity

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|relation_act|number|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|9|本表行键；与其他表同值不自动代表同一对象。|
|extra_red|number|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_arena|boolean|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|relation_red|number|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|90001|`{"is_arena":false}`|
|90002|`{"is_arena":true}`|
|90003|`{"is_arena":false}`|
|90004|`{"is_arena":true}`|
|90005|`{"is_arena":false}`|
|90006|`{"is_arena":false}`|
|90007|`{"is_arena":true}`|
|90008|`{"is_arena":false}`|
|90009|`{"is_arena":true}`|

## DivineMainAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|award|array|1|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|157001|`{"award":[[20083200,1]]}`|

## DivineMainDrawShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|act_type|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|default_type|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_pic|string|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|11|本表行键；与其他表同值不自动代表同一对象。|
|default_show_condition|undefined/number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|act_res_id|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"act_type":3,"default_type":1}`|
|2|`{"act_type":3,"default_type":1}`|
|3|`{"act_type":3,"default_type":1}`|
|4|`{"act_type":1,"default_type":1}`|
|5|`{"act_type":1,"default_type":0}`|
|6|`{"act_type":1,"default_type":1}`|
|7|`{"act_type":3,"default_type":0,"default_show_condition":693599500007}`|
|8|`{"act_type":1,"default_type":0}`|
|9|`{"act_type":1,"default_type":0}`|
|10|`{"act_type":1,"default_type":0}`|
|11|`{"act_type":1,"default_type":0}`|

## OverallActYearTask

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|target_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_des|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|1|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|type|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|title|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_param|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|day|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"target_count":0,"task_des":0,"award":[],"type":0,"task_param":0,"day":0}`|

## PlayCakeDailyReward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|version|number|3|版本引用；必须按活动类型及其消费者查对应版本表。|
|award|array|3|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|need_num|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"version":1,"award":[[495002,120],[495002,120]],"need_num":10}`|
|2|`{"version":1,"award":[[495002,121],[495002,121]],"need_num":11}`|
|3|`{"version":1,"award":[[495002,122],[495002,122]],"need_num":12}`|

## PlayCakeActivity

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|version|number|1|版本引用；必须按活动类型及其消费者查对应版本表。|
|play|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"version":1}`|

## PlayCakeConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|rand_num|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|round_num|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"rand_num":[1,5],"round_num":5}`|

## TravelGlobalPermitTask

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|challenge|number|25|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_list|array|25|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|type|number|25|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|25|本表行键；与其他表同值不自动代表同一对象。|
|target_count|number|25|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award_list":[[101500,50]],"type":1803,"target_count":1}`|
|2|`{"award_list":[[101500,50]],"type":1201,"target_count":214}`|
|3|`{"award_list":[[101500,50]],"type":1201,"target_count":218}`|
|4|`{"award_list":[[101500,50]],"type":1201,"target_count":310}`|
|5|`{"award_list":[[101500,50]],"type":1201,"target_count":320}`|
|6|`{"award_list":[[101500,50]],"type":1201,"target_count":410}`|
|7|`{"award_list":[[101500,50]],"type":1402,"target_count":3}`|
|8|`{"award_list":[[101500,50]],"type":1402,"target_count":6}`|
|9|`{"award_list":[[101500,50]],"type":1602,"target_count":10}`|
|10|`{"award_list":[[101500,50]],"type":1602,"target_count":20}`|
|11|`{"award_list":[[101500,50]],"type":1602,"target_count":24}`|
|12|`{"award_list":[[101500,50]],"type":2402,"target_count":1}`|
|13|`{"award_list":[[101500,50]],"type":2402,"target_count":2}`|
|14|`{"award_list":[[101500,50]],"type":1101,"target_count":80}`|
|15|`{"award_list":[[101500,50]],"type":1101,"target_count":100}`|
|16|`{"award_list":[[101500,50]],"type":1803,"target_count":1}`|
|17|`{"award_list":[[101500,50]],"type":1602,"target_count":30}`|
|18|`{"award_list":[[101500,50]],"type":1602,"target_count":35}`|
|19|`{"award_list":[[101500,50]],"type":1602,"target_count":40}`|
|20|`{"award_list":[[101500,50]],"type":1602,"target_count":50}`|
|23|`{"award_list":[[101500,50]],"type":1402,"target_count":10}`|
|24|`{"award_list":[[101500,50]],"type":1402,"target_count":15}`|
|25|`{"award_list":[[101500,50]],"type":2406,"target_count":4}`|
|26|`{"award_list":[[101500,50]],"type":2406,"target_count":8}`|
|29|`{"award_list":[[101500,50]],"type":1101,"target_count":120}`|

## TravelGlobalPermitBase

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## TravelGlobalPermitChanllenge

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|title_name|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|

## UnchartedReward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|item|array|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|8|`{"item":[]}`|
|62|`{"item":[]}`|
|74|`{"item":[]}`|

## VersionActivity

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|loading_poster|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|server_day|number|1|旧Activity相对开服日字段；不是角色创角天数。|
|login_cg|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|duration_day|number|1|配置持续天数；0须保留，不能擅自改为1。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"server_day":150,"duration_day":5}`|

## NewHeroBelong

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|43|本表行键；与其他表同值不自动代表同一对象。|
|scarlet_trial|number|43|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|star_mission|number|43|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|77015|`{"star_mission":81003}`|
|77016|`{"star_mission":81004}`|
|77024|`{"star_mission":81005}`|
|77026|`{"star_mission":81006}`|
|77029|`{"star_mission":81007}`|
|77030|`{"star_mission":81008}`|
|77031|`{"star_mission":81009}`|
|77032|`{"star_mission":81010}`|
|77033|`{"star_mission":81011}`|
|77035|`{"star_mission":81012}`|
|77036|`{"star_mission":81013}`|
|77037|`{"star_mission":81014}`|
|77038|`{"star_mission":81015}`|
|77039|`{"star_mission":81016}`|
|77041|`{"star_mission":81017}`|
|77044|`{"star_mission":81018}`|
|77045|`{"star_mission":81019}`|
|77046|`{"star_mission":81020}`|
|77047|`{"star_mission":81021}`|
|77049|`{"star_mission":81022}`|
|77050|`{"star_mission":81023}`|
|77052|`{"star_mission":81025}`|
|77053|`{"star_mission":81026}`|
|77056|`{"star_mission":81027}`|
|77057|`{"star_mission":81028}`|
|77058|`{"star_mission":81029}`|
|77059|`{"star_mission":81030}`|
|77060|`{"star_mission":81031}`|
|77061|`{"star_mission":0}`|
|77062|`{"star_mission":81032}`|
|77063|`{"star_mission":81033}`|
|77064|`{"star_mission":81034}`|
|77065|`{"star_mission":81035}`|
|77066|`{"star_mission":0}`|
|77067|`{"star_mission":81036}`|
|77068|`{"star_mission":81037}`|
|77069|`{"star_mission":0}`|
|77070|`{"star_mission":0}`|
|77071|`{"star_mission":81038}`|
|77072|`{"star_mission":81039}`|
|77073|`{"star_mission":0}`|
|77074|`{"star_mission":0}`|
|77075|`{"star_mission":0}`|

## ThemeGroupContent

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|sort|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|theme_group|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|theme|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|4|`{"theme_group":1}`|
|8|`{"theme_group":2}`|
|43|`{"theme_group":1}`|
|49|`{"theme_group":1}`|

## ThemeGroup

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|title|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_tab|boolean|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|background|string|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|icon|string|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|order|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"is_tab":true,"background":"img_xinfuzhongbanghuodongbeijingtu.png"}`|
|2|`{"is_tab":true,"background":"img_xshd_bg.png"}`|

## Theme

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|open_func|undefined/object|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tag_normal_icon|string|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|style_priority|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|theme|undefined|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|11|本表行键；与其他表同值不自动代表同一对象。|
|title|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tag_light_icon|string|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|banner|string|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bg_prefab|string|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|entrance_style|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tag_module|undefined/object|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|0|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{"open_func":{"reference":"OpenServerSprintForm.Open"}}`|
|5|`{}`|
|8|`{"open_func":{"reference":"GrowthRoadForm.Open"}}`|
|34|`{"open_func":{"reference":"ChoiceUpStarForm.Open"}}`|
|43|`{"open_func":{"reference":"FirstWeekGoalForm.Open"}}`|
|44|`{}`|
|45|`{}`|
|49|`{}`|

## MutexGroup

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|42|本表行键；与其他表同值不自动代表同一对象。|
|act|number|42|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|42|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{"type":1}`|
|1002|`{"type":1}`|
|1003|`{"type":1}`|
|1004|`{"type":1}`|
|1005|`{"type":1}`|
|1006|`{"type":1}`|
|1007|`{"type":1}`|
|1008|`{"type":1}`|
|1009|`{"type":1}`|
|1010|`{"type":1}`|
|1011|`{"type":1}`|
|1012|`{"type":1}`|
|1013|`{"type":1}`|
|1014|`{"type":1}`|
|1015|`{"type":1}`|
|1016|`{"type":1}`|
|1017|`{"type":1}`|
|1018|`{"type":1}`|
|1019|`{"type":1}`|
|1020|`{"type":1}`|
|1021|`{"type":1}`|
|1022|`{"type":1}`|
|1023|`{"type":1}`|
|1024|`{"type":1}`|
|1025|`{"type":1}`|
|1026|`{"type":1}`|
|1027|`{"type":1}`|
|1028|`{"type":1}`|
|1029|`{"type":1}`|
|1030|`{"type":1}`|
|1031|`{"type":1}`|
|1032|`{"type":1}`|
|1033|`{"type":1}`|
|1034|`{"type":1}`|
|1035|`{"type":1}`|
|1036|`{"type":1}`|
|1037|`{"type":1}`|
|1038|`{"type":1}`|
|1039|`{"type":1}`|
|1040|`{"type":1}`|
|1041|`{"type":1}`|
|1042|`{"type":1}`|

## MutexType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|

## Mutex

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|mutex_type|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|172001|`{"mutex_type":1}`|
|172002|`{"mutex_type":1}`|
|172003|`{"mutex_type":1}`|
|172004|`{"mutex_type":1}`|
|172010|`{"mutex_type":1}`|

## Promotion

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tips|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|effect|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|effect_pos|undefined|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|main|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tips_property|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bg|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|goto|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|title|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|

## Entrance

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|title_size|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_time|boolean|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|entry_prefab|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|red_path|array|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|title_property|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|title|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skip_func|object|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|extra_prefab|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|dynamic_banner|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|time_property|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|effect|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|time_pos|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|banner|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|title_pos|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|title_align|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|guide_node|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|title_space|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|4|`{"show_time":false,"skip_func":{"reference":"OpenServerSprintForm.Open"},"time_property":0}`|
|8|`{"show_time":true,"skip_func":{"reference":"GrowthRoadForm.Open"},"time_property":0}`|
|34|`{"show_time":true,"skip_func":{"reference":"ChoiceUpStarForm.Open"},"time_property":0}`|
|49|`{"show_time":false,"skip_func":{"reference":"MultiLoginForm.Open"},"time_property":0}`|

## Func

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|func_open|number|118|完整功能开放ID；条件见功能开放附录，不能直接当等级。|
|is_parallel|boolean|118|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|118|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|server_stage_limited|number|118|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|tid|number|118|本表行键；与其他表同值不自动代表同一对象。|
|from_type|number|118|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|data_type|number|118|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lua_module|object|118|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cross_type|number|118|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"func_open":1009,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|9|`{"func_open":1044,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|12|`{"func_open":1039,"is_parallel":true,"server_stage_limited":0,"from_type":0,"data_type":1,"cross_type":0}`|
|13|`{"func_open":1039,"is_parallel":true,"server_stage_limited":0,"from_type":0,"data_type":2,"cross_type":0}`|
|14|`{"func_open":1039,"is_parallel":true,"server_stage_limited":0,"from_type":0,"data_type":2,"cross_type":7}`|
|15|`{"func_open":1039,"is_parallel":true,"server_stage_limited":0,"from_type":0,"data_type":2,"cross_type":9}`|
|17|`{"func_open":1035,"is_parallel":true,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|18|`{"func_open":1250,"is_parallel":true,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|19|`{"func_open":1280,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|20|`{"func_open":1124,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|25|`{"func_open":1033,"is_parallel":true,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|46|`{"func_open":1030,"is_parallel":false,"server_stage_limited":3,"from_type":0,"data_type":0,"cross_type":0}`|
|53|`{"func_open":1031,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|54|`{"func_open":1029,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|56|`{"func_open":1069,"is_parallel":true,"server_stage_limited":3,"from_type":0,"data_type":0,"cross_type":0}`|
|57|`{"func_open":1070,"is_parallel":true,"server_stage_limited":3,"from_type":0,"data_type":0,"cross_type":0}`|
|60|`{"func_open":1126,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|61|`{"func_open":1130,"is_parallel":true,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|63|`{"func_open":1141,"is_parallel":false,"server_stage_limited":3,"from_type":0,"data_type":1,"cross_type":0}`|
|66|`{"func_open":1009,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|67|`{"func_open":1158,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|68|`{"func_open":1175,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|70|`{"func_open":1161,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":1,"cross_type":0}`|
|72|`{"func_open":1163,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|74|`{"func_open":1172,"is_parallel":false,"server_stage_limited":3,"from_type":0,"data_type":1,"cross_type":0}`|
|75|`{"func_open":1167,"is_parallel":false,"server_stage_limited":3,"from_type":0,"data_type":1,"cross_type":0}`|
|76|`{"func_open":1194,"is_parallel":true,"server_stage_limited":3,"from_type":0,"data_type":1,"cross_type":0}`|
|77|`{"func_open":1193,"is_parallel":true,"server_stage_limited":3,"from_type":0,"data_type":0,"cross_type":0}`|
|78|`{"func_open":1169,"is_parallel":false,"server_stage_limited":3,"from_type":0,"data_type":0,"cross_type":0}`|
|79|`{"func_open":1188,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":1,"cross_type":0}`|
|81|`{"func_open":1192,"is_parallel":true,"server_stage_limited":3,"from_type":0,"data_type":0,"cross_type":0}`|
|82|`{"func_open":1202,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|83|`{"func_open":1208,"is_parallel":true,"server_stage_limited":3,"from_type":0,"data_type":1,"cross_type":0}`|
|84|`{"func_open":1211,"is_parallel":false,"server_stage_limited":3,"from_type":0,"data_type":1,"cross_type":0}`|
|86|`{"func_open":1226,"is_parallel":false,"server_stage_limited":3,"from_type":0,"data_type":0,"cross_type":0}`|
|87|`{"func_open":1235,"is_parallel":false,"server_stage_limited":3,"from_type":0,"data_type":0,"cross_type":0}`|
|88|`{"func_open":1251,"is_parallel":false,"server_stage_limited":3,"from_type":0,"data_type":0,"cross_type":0}`|
|89|`{"func_open":1252,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|90|`{"func_open":1268,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":3,"cross_type":0}`|
|91|`{"func_open":1265,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|92|`{"func_open":1235,"is_parallel":false,"server_stage_limited":3,"from_type":0,"data_type":3,"cross_type":0}`|
|94|`{"func_open":1292,"is_parallel":false,"server_stage_limited":3,"from_type":0,"data_type":0,"cross_type":0}`|
|96|`{"func_open":1292,"is_parallel":false,"server_stage_limited":3,"from_type":0,"data_type":3,"cross_type":0}`|
|97|`{"func_open":1294,"is_parallel":false,"server_stage_limited":3,"from_type":0,"data_type":1,"cross_type":0}`|
|98|`{"func_open":1294,"is_parallel":false,"server_stage_limited":3,"from_type":0,"data_type":2,"cross_type":0}`|
|99|`{"func_open":1300,"is_parallel":false,"server_stage_limited":3,"from_type":0,"data_type":0,"cross_type":0}`|
|100|`{"func_open":1303,"is_parallel":false,"server_stage_limited":3,"from_type":0,"data_type":0,"cross_type":0}`|
|101|`{"func_open":1304,"is_parallel":true,"server_stage_limited":3,"from_type":0,"data_type":0,"cross_type":0}`|
|102|`{"func_open":1172,"is_parallel":false,"server_stage_limited":3,"from_type":0,"data_type":1,"cross_type":0}`|
|104|`{"func_open":1340,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":2,"cross_type":5}`|
|105|`{"func_open":1342,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|107|`{"func_open":1344,"is_parallel":true,"server_stage_limited":3,"from_type":0,"data_type":0,"cross_type":0}`|
|108|`{"func_open":1345,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":1,"cross_type":0}`|
|109|`{"func_open":1347,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":2,"cross_type":0}`|
|110|`{"func_open":1348,"is_parallel":false,"server_stage_limited":3,"from_type":0,"data_type":0,"cross_type":0}`|
|111|`{"func_open":1355,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":3,"cross_type":7}`|
|112|`{"func_open":1370,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":1,"cross_type":0}`|
|113|`{"func_open":1369,"is_parallel":true,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|114|`{"func_open":1371,"is_parallel":true,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|115|`{"func_open":1372,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|116|`{"func_open":1372,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|117|`{"func_open":1373,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":1,"cross_type":0}`|
|118|`{"func_open":1008,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|120|`{"func_open":1292,"is_parallel":false,"server_stage_limited":3,"from_type":0,"data_type":3,"cross_type":7}`|
|121|`{"func_open":1294,"is_parallel":false,"server_stage_limited":3,"from_type":0,"data_type":2,"cross_type":7}`|
|122|`{"func_open":1374,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|123|`{"func_open":1377,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|124|`{"func_open":1069,"is_parallel":true,"server_stage_limited":0,"from_type":0,"data_type":3,"cross_type":0}`|
|125|`{"func_open":1069,"is_parallel":true,"server_stage_limited":0,"from_type":0,"data_type":3,"cross_type":7}`|
|128|`{"func_open":1344,"is_parallel":true,"server_stage_limited":0,"from_type":0,"data_type":3,"cross_type":0}`|
|129|`{"func_open":1344,"is_parallel":true,"server_stage_limited":0,"from_type":0,"data_type":3,"cross_type":7}`|
|130|`{"func_open":1070,"is_parallel":true,"server_stage_limited":0,"from_type":0,"data_type":3,"cross_type":0}`|
|131|`{"func_open":1070,"is_parallel":true,"server_stage_limited":0,"from_type":0,"data_type":3,"cross_type":7}`|
|132|`{"func_open":1380,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|133|`{"func_open":1380,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":3,"cross_type":0}`|
|134|`{"func_open":1380,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":3,"cross_type":7}`|
|135|`{"func_open":1381,"is_parallel":true,"server_stage_limited":0,"from_type":0,"data_type":1,"cross_type":0}`|
|136|`{"func_open":1381,"is_parallel":true,"server_stage_limited":0,"from_type":0,"data_type":2,"cross_type":0}`|
|137|`{"func_open":1381,"is_parallel":true,"server_stage_limited":0,"from_type":0,"data_type":2,"cross_type":7}`|
|138|`{"func_open":1382,"is_parallel":true,"server_stage_limited":3,"from_type":0,"data_type":0,"cross_type":0}`|
|139|`{"func_open":1382,"is_parallel":true,"server_stage_limited":0,"from_type":0,"data_type":3,"cross_type":0}`|
|140|`{"func_open":1382,"is_parallel":true,"server_stage_limited":0,"from_type":0,"data_type":3,"cross_type":7}`|
|150|`{"func_open":1401,"is_parallel":true,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|151|`{"func_open":1402,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|152|`{"func_open":1403,"is_parallel":true,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|153|`{"func_open":1404,"is_parallel":true,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|154|`{"func_open":1406,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|155|`{"func_open":1407,"is_parallel":false,"server_stage_limited":3,"from_type":0,"data_type":0,"cross_type":0}`|
|156|`{"func_open":1070,"is_parallel":true,"server_stage_limited":3,"from_type":0,"data_type":0,"cross_type":0}`|
|157|`{"func_open":1409,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|158|`{"func_open":1029,"is_parallel":false,"server_stage_limited":3,"from_type":0,"data_type":0,"cross_type":0}`|
|159|`{"func_open":1410,"is_parallel":true,"server_stage_limited":0,"from_type":0,"data_type":1,"cross_type":0}`|
|160|`{"func_open":1411,"is_parallel":false,"server_stage_limited":3,"from_type":0,"data_type":0,"cross_type":0}`|
|161|`{"func_open":1412,"is_parallel":true,"server_stage_limited":3,"from_type":0,"data_type":0,"cross_type":0}`|
|162|`{"func_open":1029,"is_parallel":true,"server_stage_limited":0,"from_type":0,"data_type":1,"cross_type":0}`|
|163|`{"func_open":1428,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|164|`{"func_open":1437,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|165|`{"func_open":1438,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":1,"cross_type":0}`|
|166|`{"func_open":1443,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|167|`{"func_open":1444,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":1,"cross_type":0}`|
|168|`{"func_open":1445,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|169|`{"func_open":1448,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|171|`{"func_open":1450,"is_parallel":true,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|172|`{"func_open":1508,"is_parallel":true,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|173|`{"func_open":1029,"is_parallel":true,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|179|`{"func_open":1528,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|180|`{"func_open":1537,"is_parallel":true,"server_stage_limited":0,"from_type":0,"data_type":1,"cross_type":0}`|
|181|`{"func_open":1538,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":2,"cross_type":11}`|
|188|`{"func_open":1554,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|189|`{"func_open":1547,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":0,"cross_type":0}`|
|190|`{"func_open":1340,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":2,"cross_type":0}`|
|191|`{"func_open":1340,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":2,"cross_type":7}`|
|192|`{"func_open":1340,"is_parallel":false,"server_stage_limited":3,"from_type":0,"data_type":2,"cross_type":9}`|
|193|`{"func_open":1340,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":2,"cross_type":11}`|
|194|`{"func_open":1372,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":2,"cross_type":11}`|
|195|`{"func_open":1340,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":2,"cross_type":12}`|
|196|`{"func_open":1029,"is_parallel":false,"server_stage_limited":0,"from_type":0,"data_type":1,"cross_type":0}`|
|996|`{"func_open":1213,"is_parallel":false,"server_stage_limited":0,"from_type":1,"data_type":0,"cross_type":0}`|

## Server

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|7|本表行键；与其他表同值不自动代表同一对象。|
|server_type|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|server_id_limited|array|7|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|77021|`{"server_type":7,"server_id_limited":[]}`|
|160002|`{"server_type":8,"server_id_limited":[]}`|
|160012|`{"server_type":8,"server_id_limited":[]}`|
|160022|`{"server_type":8,"server_id_limited":[]}`|
|161002|`{"server_type":8,"server_id_limited":[]}`|
|161012|`{"server_type":8,"server_id_limited":[]}`|
|161022|`{"server_type":8,"server_id_limited":[]}`|

## State

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|11|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|0|`{}`|
|10|`{}`|
|50|`{}`|
|51|`{}`|
|52|`{}`|
|53|`{}`|
|54|`{}`|
|55|`{}`|
|60|`{}`|
|90|`{}`|
|99|`{}`|

## Activity

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|world_limit_day|number|1109|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|state_end_day|array|1109|原阶段日期数组；是否累计/分段以对应消费者为准，不能只凭名称推算。|
|server_day|number|1109|旧Activity相对开服日字段；不是角色创角天数。|
|world_time|number|1109|原配置绝对Unix秒；当前本服是否平移另列，不能把平移后的日期写成原值。|
|discard_time|number|1109|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|state|array|1109|旧活动阶段ID数组；与state_end_day/state_end_time逐项配对。|
|end_time|number|1109|结束日期内秒偏移；不是单独完整时间戳。|
|server_mini_open_limited|number|1109|允许参与的服务器开服时间下界原值。|
|server_max_open_limited|number|1109|允许参与的服务器开服时间上界原值。|
|server_start_time|number|1109|旧Activity日期内秒偏移；与server_day组合使用。|
|ref_name|string|1109|原配置内部备注名；不等同当前界面本地化名称。|
|state_end_time|array|1109|原阶段日内时间数组；0天阶段仍可能有时分窗口。|
|time_type|number|1109|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|func|number|1109|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1109|本表行键；与其他表同值不自动代表同一对象。|
|duration_day|number|1109|配置持续天数；0须保留，不能擅自改为1。|
|server_limited_type|number|1109|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|world_limit_state|number|1109|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|version|number|1109|版本引用；必须按活动类型及其消费者查对应版本表。|
|join_server_day|number|1109|服务器资格字段；需同时检查当前服龄与其他开放约束。|

下列3行用于说明结构；全部1109行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|9001|`{"world_limit_day":0,"state_end_day":[],"server_day":1,"world_time":0,"discard_time":0,"state":[],"end_time":0,"server_mini_open_limited":0,"server_max_open_limited":0,"server_start_time":0,"ref_name":"神魔抽1","state_end_time":[],"time_type":0,"func":9,"duration_day":9999,"server_limited_type":0,"world_limit_state":0,"version":1,"join_server_day":0}`|
|12003|`{"world_limit_day":0,"state_end_day":[2,0,0],"server_day":1,"world_time":0,"discard_time":0,"state":[50,60,90],"end_time":82800,"server_mini_open_limited":0,"server_max_open_limited":1757278799,"server_start_time":18000,"ref_name":"竞技场评定","state_end_time":[75600,79200,82800],"time_type":0,"func":12,"duration_day":2,"server_limited_type":0,"world_limit_state":0,"version":1,"join_server_day":0}`|
|12004|`{"world_limit_day":0,"state_end_day":[1,4],"server_day":3,"world_time":0,"discard_time":0,"state":[10,50],"end_time":18000,"server_mini_open_limited":0,"server_max_open_limited":1757278799,"server_start_time":18000,"ref_name":"擂台赛评定","state_end_time":[18000,18000],"time_type":0,"func":12,"duration_day":5,"server_limited_type":0,"world_limit_state":0,"version":2,"join_server_day":0}`|

## FlashSaleTaskGroup

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|get_way|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|get_way_title|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|

## FlashSaleTask

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|task_des|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_group|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_type|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|30|本表行键；与其他表同值不自动代表同一对象。|
|version|number|30|版本引用；必须按活动类型及其消费者查对应版本表。|
|task_param|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"task_des":0,"task_group":1,"task_type":2301,"version":1,"task_param":150000}`|
|102|`{"task_des":0,"task_group":1,"task_type":2301,"version":1,"task_param":250000}`|
|103|`{"task_des":0,"task_group":1,"task_type":2301,"version":1,"task_param":350000}`|
|104|`{"task_des":0,"task_group":1,"task_type":2301,"version":1,"task_param":370000}`|
|105|`{"task_des":0,"task_group":1,"task_type":2301,"version":1,"task_param":400000}`|
|111|`{"task_des":0,"task_group":2,"task_type":1201,"version":1,"task_param":60210}`|
|112|`{"task_des":0,"task_group":2,"task_type":1201,"version":1,"task_param":80210}`|
|113|`{"task_des":0,"task_group":2,"task_type":1201,"version":1,"task_param":130210}`|
|114|`{"task_des":0,"task_group":2,"task_type":1201,"version":1,"task_param":160210}`|
|115|`{"task_des":0,"task_group":2,"task_type":1201,"version":1,"task_param":180210}`|
|121|`{"task_des":0,"task_group":3,"task_type":1115,"version":1,"task_param":10}`|
|122|`{"task_des":0,"task_group":3,"task_type":1115,"version":1,"task_param":18}`|
|123|`{"task_des":0,"task_group":3,"task_type":1115,"version":1,"task_param":26}`|
|124|`{"task_des":0,"task_group":3,"task_type":1115,"version":1,"task_param":30}`|
|125|`{"task_des":0,"task_group":3,"task_type":1115,"version":1,"task_param":32}`|
|201|`{"task_des":0,"task_group":1,"task_type":2301,"version":2,"task_param":500000}`|
|202|`{"task_des":0,"task_group":1,"task_type":2301,"version":2,"task_param":600000}`|
|203|`{"task_des":0,"task_group":1,"task_type":2301,"version":2,"task_param":700000}`|
|204|`{"task_des":0,"task_group":1,"task_type":2301,"version":2,"task_param":750000}`|
|205|`{"task_des":0,"task_group":1,"task_type":2301,"version":2,"task_param":800000}`|
|211|`{"task_des":0,"task_group":2,"task_type":1201,"version":2,"task_param":190210}`|
|212|`{"task_des":0,"task_group":2,"task_type":1201,"version":2,"task_param":210210}`|
|213|`{"task_des":0,"task_group":2,"task_type":1201,"version":2,"task_param":230210}`|
|214|`{"task_des":0,"task_group":2,"task_type":1201,"version":2,"task_param":240210}`|
|215|`{"task_des":0,"task_group":2,"task_type":1201,"version":2,"task_param":260210}`|
|221|`{"task_des":0,"task_group":3,"task_type":1115,"version":2,"task_param":33}`|
|222|`{"task_des":0,"task_group":3,"task_type":1115,"version":2,"task_param":35}`|
|223|`{"task_des":0,"task_group":3,"task_type":1115,"version":2,"task_param":37}`|
|224|`{"task_des":0,"task_group":3,"task_type":1115,"version":2,"task_param":39}`|
|225|`{"task_des":0,"task_group":3,"task_type":1115,"version":2,"task_param":40}`|

## FlashSaleVersion

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|img_icon_posY|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|gift_hero|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|img_title|string|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_icon|string|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"gift_hero":[3030501]}`|
|2|`{"gift_hero":[1030101,3030601,2030201,4030501]}`|

## FlashSaleConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|task_award|array|2|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|effect_split_price|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"task_award":[[101500,50]]}`|
|2|`{"task_award":[[101500,50]]}`|

## FlashSaleGift

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|gift|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
