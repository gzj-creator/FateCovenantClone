# MatchPvpTable 规则参数

来源：[personal-server/assets/tables/MatchPvpTable.data.lua.json.gz](../../../../personal-server/assets/tables/MatchPvpTable.data.lua.json.gz)，SHA256：`917f824c24d0661f14b4e2d8a2569cfd8e6ac59abcfee1412a4d311416b6972f`。

[完整逐行JSON](MatchPvpTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Params](#params)|2|decoded-rows|
|[Rank](#rank)|10|decoded-rows|
|[ServerType](#servertype)|2|decoded-rows|
|[Match](#match)|24|decoded-rows|
|[BotLib](#botlib)|66|decoded-rows|
|[StageSettle](#stagesettle)|7|decoded-rows|
|[Level](#level)|12|decoded-rows|
|[LevelParam](#levelparam)|12|decoded-rows|
|[DayTask](#daytask)|8|decoded-rows|
|[DailyRank](#dailyrank)|7|decoded-rows|
|[StateType](#statetype)|5|decoded-rows|
|[State](#state)|10|decoded-rows|
|[Type](#type)|2|decoded-rows|

## Params

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|fun_open|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|day_page_red|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|day_red|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|stage_page_red|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|stage_red|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|server_rank|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cross_rank|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|recover_id|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|data_type|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|place_data|string|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|stage_check|null|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|stage_get|null|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lineup_type|null|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"fun_open":1159,"day_page_red":10508,"day_red":10507,"stage_page_red":10506,"stage_red":10505,"server_rank":74,"cross_rank":75,"recover_id":6,"data_type":14}`|
|2|`{"fun_open":1066,"day_page_red":0,"day_red":0,"stage_page_red":0,"stage_red":0,"server_rank":60,"cross_rank":61,"recover_id":0,"data_type":12,"stage_check":null,"stage_get":null,"lineup_type":null}`|

## Rank

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|10|本表行键；与其他表同值不自动代表同一对象。|
|type|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rank_range|array|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|10|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|201|`{"type":2,"rank_range":[1,1],"award":[[71200,120],[22002,4]]}`|
|202|`{"type":2,"rank_range":[2,2],"award":[[71200,90],[22002,3]]}`|
|203|`{"type":2,"rank_range":[3,3],"award":[[71200,80],[22002,2]]}`|
|204|`{"type":2,"rank_range":[4,10],"award":[[71200,60],[22002,2]]}`|
|205|`{"type":2,"rank_range":[11,20],"award":[[71200,30],[22002,2]]}`|
|206|`{"type":2,"rank_range":[21,50],"award":[[71200,25],[22002,1]]}`|
|207|`{"type":2,"rank_range":[51,100],"award":[[101900,1200],[22002,1]]}`|
|208|`{"type":2,"rank_range":[101,200],"award":[[101900,900],[22002,1]]}`|
|209|`{"type":2,"rank_range":[201,500],"award":[[101900,600],[22002,1]]}`|
|210|`{"type":2,"rank_range":[501,5000],"award":[[101900,400]]}`|

## ServerType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|

## Match

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|24|本表行键；与其他表同值不自动代表同一对象。|
|type|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|power|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bot|array|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|promote_bot|array/object|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"type":1,"power":100000}`|
|102|`{"type":1,"power":200000}`|
|103|`{"type":1,"power":300000}`|
|104|`{"type":1,"power":400000}`|
|105|`{"type":1,"power":500000}`|
|106|`{"type":1,"power":1000000}`|
|107|`{"type":1,"power":2000000}`|
|108|`{"type":1,"power":3000000}`|
|109|`{"type":1,"power":4000000}`|
|110|`{"type":1,"power":5000000}`|
|111|`{"type":1,"power":10000000}`|
|112|`{"type":1,"power":50000000}`|
|201|`{"type":2,"power":100000}`|
|202|`{"type":2,"power":200000}`|
|203|`{"type":2,"power":300000}`|
|204|`{"type":2,"power":400000}`|
|205|`{"type":2,"power":500000}`|
|206|`{"type":2,"power":1000000}`|
|207|`{"type":2,"power":2000000}`|
|208|`{"type":2,"power":3000000}`|
|209|`{"type":2,"power":4000000}`|
|210|`{"type":2,"power":5000000}`|
|211|`{"type":2,"power":10000000}`|
|212|`{"type":2,"power":50000000}`|

## BotLib

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|66|本表行键；与其他表同值不自动代表同一对象。|
|score|number|66|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|power|number|66|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_tid|number|66|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hight_fight_tid|number|66|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lv|number|66|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|win_rate|number|66|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|style|number|66|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"score":400,"power":100000,"fight_tid":1500001,"hight_fight_tid":1500023,"lv":52,"win_rate":30}`|
|102|`{"score":400,"power":100000,"fight_tid":1500002,"hight_fight_tid":1500024,"lv":52,"win_rate":40}`|
|103|`{"score":400,"power":200000,"fight_tid":1500003,"hight_fight_tid":1500025,"lv":52,"win_rate":35}`|
|104|`{"score":400,"power":200000,"fight_tid":1500004,"hight_fight_tid":1500026,"lv":52,"win_rate":38}`|
|105|`{"score":400,"power":300000,"fight_tid":1500005,"hight_fight_tid":1500027,"lv":52,"win_rate":31}`|
|106|`{"score":400,"power":300000,"fight_tid":1500006,"hight_fight_tid":1500028,"lv":52,"win_rate":41}`|
|107|`{"score":400,"power":400000,"fight_tid":1500007,"hight_fight_tid":1500029,"lv":52,"win_rate":36}`|
|108|`{"score":400,"power":400000,"fight_tid":1500008,"hight_fight_tid":1500030,"lv":52,"win_rate":39}`|
|109|`{"score":400,"power":500000,"fight_tid":1500009,"hight_fight_tid":1500031,"lv":52,"win_rate":32}`|
|110|`{"score":400,"power":500000,"fight_tid":1500010,"hight_fight_tid":1500032,"lv":52,"win_rate":42}`|
|111|`{"score":400,"power":1000000,"fight_tid":1500011,"hight_fight_tid":1500033,"lv":52,"win_rate":37}`|
|112|`{"score":400,"power":1000000,"fight_tid":1500012,"hight_fight_tid":1500034,"lv":52,"win_rate":40}`|
|113|`{"score":400,"power":2000000,"fight_tid":1500013,"hight_fight_tid":1500035,"lv":57,"win_rate":33}`|
|114|`{"score":400,"power":2000000,"fight_tid":1500014,"hight_fight_tid":1500036,"lv":57,"win_rate":43}`|
|115|`{"score":400,"power":3000000,"fight_tid":1500015,"hight_fight_tid":1500037,"lv":57,"win_rate":38}`|
|116|`{"score":400,"power":3000000,"fight_tid":1500016,"hight_fight_tid":1500038,"lv":57,"win_rate":41}`|
|117|`{"score":400,"power":4000000,"fight_tid":1500017,"hight_fight_tid":1500039,"lv":60,"win_rate":34}`|
|118|`{"score":400,"power":4000000,"fight_tid":1500018,"hight_fight_tid":1500040,"lv":60,"win_rate":44}`|
|119|`{"score":400,"power":5000000,"fight_tid":1500019,"hight_fight_tid":1500041,"lv":63,"win_rate":39}`|
|120|`{"score":400,"power":5000000,"fight_tid":1500020,"hight_fight_tid":1500042,"lv":63,"win_rate":42}`|
|121|`{"score":400,"power":10000000,"fight_tid":1500021,"hight_fight_tid":1500043,"lv":75,"win_rate":35}`|
|122|`{"score":400,"power":10000000,"fight_tid":1500022,"hight_fight_tid":1500044,"lv":75,"win_rate":45}`|
|151|`{"score":400,"power":100000,"fight_tid":1500051,"hight_fight_tid":1500073,"lv":52,"win_rate":30}`|
|152|`{"score":400,"power":100000,"fight_tid":1500052,"hight_fight_tid":1500074,"lv":52,"win_rate":40}`|
|153|`{"score":400,"power":200000,"fight_tid":1500053,"hight_fight_tid":1500075,"lv":52,"win_rate":35}`|
|154|`{"score":400,"power":200000,"fight_tid":1500054,"hight_fight_tid":1500076,"lv":52,"win_rate":38}`|
|155|`{"score":400,"power":300000,"fight_tid":1500055,"hight_fight_tid":1500077,"lv":52,"win_rate":31}`|
|156|`{"score":400,"power":300000,"fight_tid":1500056,"hight_fight_tid":1500078,"lv":52,"win_rate":41}`|
|157|`{"score":400,"power":400000,"fight_tid":1500057,"hight_fight_tid":1500079,"lv":52,"win_rate":36}`|
|158|`{"score":400,"power":400000,"fight_tid":1500058,"hight_fight_tid":1500080,"lv":52,"win_rate":39}`|
|159|`{"score":400,"power":500000,"fight_tid":1500059,"hight_fight_tid":1500081,"lv":52,"win_rate":32}`|
|160|`{"score":400,"power":500000,"fight_tid":1500060,"hight_fight_tid":1500082,"lv":52,"win_rate":42}`|
|161|`{"score":400,"power":1000000,"fight_tid":1500061,"hight_fight_tid":1500083,"lv":52,"win_rate":37}`|
|162|`{"score":400,"power":1000000,"fight_tid":1500062,"hight_fight_tid":1500084,"lv":52,"win_rate":40}`|
|163|`{"score":400,"power":2000000,"fight_tid":1500063,"hight_fight_tid":1500085,"lv":57,"win_rate":33}`|
|164|`{"score":400,"power":2000000,"fight_tid":1500064,"hight_fight_tid":1500086,"lv":57,"win_rate":43}`|
|165|`{"score":400,"power":3000000,"fight_tid":1500065,"hight_fight_tid":1500087,"lv":57,"win_rate":38}`|
|166|`{"score":400,"power":3000000,"fight_tid":1500066,"hight_fight_tid":1500088,"lv":57,"win_rate":41}`|
|167|`{"score":400,"power":4000000,"fight_tid":1500067,"hight_fight_tid":1500089,"lv":60,"win_rate":34}`|
|168|`{"score":400,"power":4000000,"fight_tid":1500068,"hight_fight_tid":1500090,"lv":60,"win_rate":44}`|
|169|`{"score":400,"power":5000000,"fight_tid":1500069,"hight_fight_tid":1500091,"lv":63,"win_rate":39}`|
|170|`{"score":400,"power":5000000,"fight_tid":1500070,"hight_fight_tid":1500092,"lv":63,"win_rate":42}`|
|171|`{"score":400,"power":10000000,"fight_tid":1500071,"hight_fight_tid":1500093,"lv":75,"win_rate":35}`|
|172|`{"score":400,"power":10000000,"fight_tid":1500072,"hight_fight_tid":1500094,"lv":75,"win_rate":45}`|
|201|`{"score":1250,"power":100000,"fight_tid":1400001,"hight_fight_tid":1400001,"lv":37,"win_rate":10}`|
|202|`{"score":1250,"power":100000,"fight_tid":1400002,"hight_fight_tid":1400002,"lv":37,"win_rate":10}`|
|203|`{"score":1250,"power":200000,"fight_tid":1400003,"hight_fight_tid":1400003,"lv":37,"win_rate":10}`|
|204|`{"score":1250,"power":200000,"fight_tid":1400004,"hight_fight_tid":1400004,"lv":37,"win_rate":10}`|
|205|`{"score":1250,"power":300000,"fight_tid":1400005,"hight_fight_tid":1400005,"lv":37,"win_rate":10}`|
|206|`{"score":1250,"power":300000,"fight_tid":1400006,"hight_fight_tid":1400006,"lv":37,"win_rate":10}`|
|207|`{"score":1250,"power":400000,"fight_tid":1400007,"hight_fight_tid":1400007,"lv":37,"win_rate":10}`|
|208|`{"score":1250,"power":400000,"fight_tid":1400008,"hight_fight_tid":1400008,"lv":37,"win_rate":10}`|
|209|`{"score":1250,"power":500000,"fight_tid":1400009,"hight_fight_tid":1400009,"lv":37,"win_rate":10}`|
|210|`{"score":1250,"power":500000,"fight_tid":1400010,"hight_fight_tid":1400010,"lv":37,"win_rate":10}`|
|211|`{"score":1250,"power":1000000,"fight_tid":1400011,"hight_fight_tid":1400011,"lv":37,"win_rate":10}`|
|212|`{"score":1250,"power":1000000,"fight_tid":1400012,"hight_fight_tid":1400012,"lv":37,"win_rate":10}`|
|213|`{"score":1250,"power":2000000,"fight_tid":1400013,"hight_fight_tid":1400013,"lv":42,"win_rate":10}`|
|214|`{"score":1250,"power":2000000,"fight_tid":1400014,"hight_fight_tid":1400014,"lv":42,"win_rate":10}`|
|215|`{"score":1250,"power":3000000,"fight_tid":1400015,"hight_fight_tid":1400015,"lv":42,"win_rate":10}`|
|216|`{"score":1250,"power":3000000,"fight_tid":1400016,"hight_fight_tid":1400016,"lv":42,"win_rate":10}`|
|217|`{"score":1250,"power":4000000,"fight_tid":1400017,"hight_fight_tid":1400017,"lv":45,"win_rate":10}`|
|218|`{"score":1250,"power":4000000,"fight_tid":1400018,"hight_fight_tid":1400018,"lv":45,"win_rate":10}`|
|219|`{"score":1250,"power":5000000,"fight_tid":1400019,"hight_fight_tid":1400019,"lv":48,"win_rate":10}`|
|220|`{"score":1250,"power":5000000,"fight_tid":1400020,"hight_fight_tid":1400020,"lv":48,"win_rate":10}`|
|221|`{"score":1250,"power":10000000,"fight_tid":1400021,"hight_fight_tid":1400021,"lv":60,"win_rate":10}`|
|222|`{"score":1250,"power":10000000,"fight_tid":1400022,"hight_fight_tid":1400022,"lv":60,"win_rate":10}`|

## StageSettle

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|7|本表行键；与其他表同值不自动代表同一对象。|
|type|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|7|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|100|`{"type":1,"award":[[2261200,2],[801900,300]]}`|
|101|`{"type":1,"award":[[2261200,4],[801900,400],[22002,1]]}`|
|102|`{"type":1,"award":[[2261200,6],[801900,450],[22002,2]]}`|
|103|`{"type":1,"award":[[2261200,8],[801900,500],[22002,2]]}`|
|104|`{"type":1,"award":[[2261200,10],[801900,600],[22002,3]]}`|
|105|`{"type":1,"award":[[2261200,12],[801900,800],[22002,3]]}`|
|106|`{"type":1,"award":[[2261200,15],[801900,1000],[22002,4],[346208,1]]}`|

## Level

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|12|本表行键；与其他表同值不自动代表同一对象。|
|type|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|integral|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|des|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lv_index|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|icon|string|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|object/array|12|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|100|`{"type":1,"lv_index":0,"award":{"global":"TableEmpty"}}`|
|101|`{"type":1,"lv_index":0,"award":[[101500,300],[2261200,2]]}`|
|102|`{"type":1,"lv_index":0,"award":[[101500,350],[5760202,1]]}`|
|103|`{"type":1,"lv_index":0,"award":[[101500,400],[2261200,4]]}`|
|104|`{"type":1,"lv_index":1,"award":[[101500,450],[5760202,1]]}`|
|105|`{"type":1,"lv_index":1,"award":[[101500,500],[2261200,6]]}`|
|106|`{"type":1,"lv_index":1,"award":[[101500,600],[2261200,8]]}`|
|201|`{"type":2,"lv_index":0,"award":{"global":"TableEmpty"}}`|
|202|`{"type":2,"lv_index":0,"award":[[101500,50],[18002,10]]}`|
|203|`{"type":2,"lv_index":0,"award":[[101500,50],[18002,10]]}`|
|204|`{"type":2,"lv_index":1,"award":[[101500,100],[19002,1]]}`|
|205|`{"type":2,"lv_index":1,"award":[[101500,100],[18002,20]]}`|

## LevelParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|12|本表行键；与其他表同值不自动代表同一对象。|
|img_bg|string|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_shadow|string|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_label|string|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|100|`{}`|
|101|`{}`|
|102|`{}`|
|103|`{}`|
|104|`{}`|
|105|`{}`|
|106|`{}`|
|201|`{}`|
|202|`{}`|
|203|`{}`|
|204|`{}`|
|205|`{}`|

## DayTask

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|8|本表行键；与其他表同值不自动代表同一对象。|
|type|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_type|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_key|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_count|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|8|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|des|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|brief_des|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"type":1,"task_type":12401,"task_key":0,"task_count":2,"award":[[801900,10]]}`|
|102|`{"type":1,"task_type":12401,"task_key":0,"task_count":5,"award":[[801900,20]]}`|
|103|`{"type":1,"task_type":12401,"task_key":0,"task_count":8,"award":[[801900,20]]}`|
|104|`{"type":1,"task_type":12401,"task_key":0,"task_count":10,"award":[[801900,30]]}`|
|201|`{"type":2,"task_type":7002,"task_key":0,"task_count":5,"award":[[801900,10]]}`|
|202|`{"type":2,"task_type":7002,"task_key":0,"task_count":10,"award":[[801900,20]]}`|
|203|`{"type":2,"task_type":7003,"task_key":0,"task_count":2,"award":[[801900,20]]}`|
|204|`{"type":2,"task_type":7003,"task_key":0,"task_count":5,"award":[[801900,30]]}`|

## DailyRank

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|7|本表行键；与其他表同值不自动代表同一对象。|
|type|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|level|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|7|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|100|`{"type":1,"level":100,"award":[[2261200,2],[801900,40]]}`|
|101|`{"type":1,"level":101,"award":[[2261200,3],[801900,50]]}`|
|102|`{"type":1,"level":102,"award":[[2261200,4],[801900,60]]}`|
|103|`{"type":1,"level":103,"award":[[2261200,5],[801900,70]]}`|
|104|`{"type":1,"level":104,"award":[[2261200,6],[801900,80]]}`|
|105|`{"type":1,"level":105,"award":[[2261200,7],[801900,90]]}`|
|106|`{"type":1,"level":106,"award":[[2261200,8],[801900,100]]}`|

## StateType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|

## State

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|10|本表行键；与其他表同值不自动代表同一对象。|
|type|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|date|array|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"type":1}`|
|102|`{"type":1}`|
|103|`{"type":1}`|
|104|`{"type":1}`|
|105|`{"type":1}`|
|201|`{"type":2}`|
|202|`{"type":2}`|
|203|`{"type":2}`|
|204|`{"type":2}`|
|205|`{"type":2}`|

## Type

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|show_name|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|init_score|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|min_score|number|2|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|min_win_gain|number|2|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|fight_report_num|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lock_fight_report_max|number|2|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|palace_season|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_report_period|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|new_season_rank_back|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|open_level|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|start_day|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|elo_k|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|peak_duel_show_count|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cancel_ur_mode_day|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_tid|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|high_rank_day|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|high_rank_fight|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skip_anim|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|matching_time|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|share_rank|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|auto_fight|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|auto_fight_count|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"init_score":100,"min_score":100,"min_win_gain":3,"fight_report_num":15,"lock_fight_report_max":5,"fight_report_period":3,"new_season_rank_back":999,"open_level":58,"start_day":15,"peak_duel_show_count":20,"cancel_ur_mode_day":28,"fight_tid":1501001,"high_rank_day":52,"high_rank_fight":1501003,"matching_time":[2,3],"share_rank":50,"auto_fight":31,"auto_fight_count":10}`|
|2|`{"init_score":0,"min_score":0,"min_win_gain":0,"fight_report_num":0,"lock_fight_report_max":0,"fight_report_period":0,"new_season_rank_back":0,"open_level":0,"start_day":0,"peak_duel_show_count":0,"cancel_ur_mode_day":0,"fight_tid":0,"high_rank_day":0,"high_rank_fight":0,"matching_time":[],"share_rank":0,"auto_fight":0,"auto_fight_count":0}`|
