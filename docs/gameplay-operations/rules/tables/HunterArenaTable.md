# HunterArenaTable 规则参数

来源：[personal-server/assets/tables/HunterArenaTable.data.lua.json.gz](../../../../personal-server/assets/tables/HunterArenaTable.data.lua.json.gz)，SHA256：`361ec6778534e3c01d8ebf8894491ac312efde6b5314b75d81972a0a595ff429`。

[完整逐行JSON](HunterArenaTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Const](#const)|1|decoded-rows|
|[Rank](#rank)|10|decoded-rows|
|[ServerType](#servertype)|3|decoded-rows|
|[BotMatch](#botmatch)|60|decoded-rows|
|[BotConst](#botconst)|1|decoded-rows|
|[BotLib](#botlib)|88|decoded-rows|
|[Level](#level)|16|decoded-rows|
|[DayTask](#daytask)|4|decoded-rows|
|[State](#state)|5|decoded-rows|
|[DoubleRank](#doublerank)|10|decoded-rows|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|init_score|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|min_score|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|min_win_gain|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|fight_report_num|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lock_fight_report_max|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|palace_season|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_report_period|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|new_season_rank_back|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|open_level|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|start_day|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|elo_k|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|peak_duel_show_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_tid|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|double_fight_tid|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skip_anim|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|matching_time|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|share_rank|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|auto_fight|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|auto_fight_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"init_score":1100,"min_score":1000,"min_win_gain":5,"fight_report_num":15,"lock_fight_report_max":5,"fight_report_period":3,"new_season_rank_back":999,"open_level":38,"start_day":4,"peak_duel_show_count":20,"fight_tid":[[1,1400000],[18,1400000],[27,1400000],[51,1400000]],"double_fight_tid":1400100,"matching_time":[0,2],"share_rank":50,"auto_fight":20,"auto_fight_count":10}`|

## Rank

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|10|本表行键；与其他表同值不自动代表同一对象。|
|rank_range|array|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|10|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"rank_range":[1,1],"award":[[300208,1],[22002,4],[2002,40],[801900,2000],[19002,6]]}`|
|2|`{"rank_range":[2,2],"award":[[300308,1],[22002,3],[2002,30],[801900,1500],[19002,5]]}`|
|3|`{"rank_range":[3,3],"award":[[300408,1],[22002,2],[2002,25],[801900,1200],[19002,5]]}`|
|4|`{"rank_range":[4,10],"award":[[22002,2],[2002,20],[801900,900],[19002,4]]}`|
|5|`{"rank_range":[11,20],"award":[[22002,2],[2002,15],[801900,700],[19002,3]]}`|
|6|`{"rank_range":[21,50],"award":[[22002,1],[2002,10],[801900,550],[19002,3]]}`|
|7|`{"rank_range":[51,100],"award":[[22002,1],[2002,8],[801900,500],[19002,2]]}`|
|8|`{"rank_range":[101,200],"award":[[22002,1],[2002,6],[801900,450],[19002,2]]}`|
|9|`{"rank_range":[201,500],"award":[[22002,1],[2002,5],[801900,400],[19002,1]]}`|
|10|`{"rank_range":[501,5000],"award":[[2002,4],[801900,350],[19002,1]]}`|

## ServerType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|

## BotMatch

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|60|本表行键；与其他表同值不自动代表同一对象。|
|power|number|60|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bot|array|60|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10001|`{"power":100000}`|
|10002|`{"power":200000}`|
|10003|`{"power":300000}`|
|10004|`{"power":400000}`|
|10005|`{"power":500000}`|
|10006|`{"power":1000000}`|
|10007|`{"power":2000000}`|
|10008|`{"power":3000000}`|
|10009|`{"power":4000000}`|
|10010|`{"power":5000000}`|
|10011|`{"power":10000000}`|
|10012|`{"power":50000000}`|
|680001|`{"power":195000}`|
|680002|`{"power":390000}`|
|680003|`{"power":585000}`|
|680004|`{"power":780000}`|
|680005|`{"power":975000}`|
|680006|`{"power":1950000}`|
|680007|`{"power":3900000}`|
|680008|`{"power":5850000}`|
|680009|`{"power":7800000}`|
|680010|`{"power":9750000}`|
|680011|`{"power":19500000}`|
|680012|`{"power":97500000}`|
|1000001|`{"power":290000}`|
|1000002|`{"power":580000}`|
|1000003|`{"power":870000}`|
|1000004|`{"power":1160000}`|
|1000005|`{"power":1450000}`|
|1000006|`{"power":2900000}`|
|1000007|`{"power":5800000}`|
|1000008|`{"power":8700000}`|
|1000009|`{"power":11600000}`|
|1000010|`{"power":14500000}`|
|1000011|`{"power":29000000}`|
|1000012|`{"power":145000000}`|
|1010001|`{"power":385000}`|
|1010002|`{"power":770000}`|
|1010003|`{"power":1155000}`|
|1010004|`{"power":1540000}`|
|1010005|`{"power":1925000}`|
|1010006|`{"power":3850000}`|
|1010007|`{"power":7700000}`|
|1010008|`{"power":11550000}`|
|1010009|`{"power":15400000}`|
|1010010|`{"power":19250000}`|
|1010011|`{"power":38500000}`|
|1010012|`{"power":192500000}`|
|1580001|`{"power":100000}`|
|1580002|`{"power":200000}`|
|1580003|`{"power":300000}`|
|1580004|`{"power":400000}`|
|1580005|`{"power":500000}`|
|1580006|`{"power":1000000}`|
|1580007|`{"power":2000000}`|
|1580008|`{"power":3000000}`|
|1580009|`{"power":4000000}`|
|1580010|`{"power":5000000}`|
|1580011|`{"power":10000000}`|
|1580012|`{"power":50000000}`|

## BotConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|match_score|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|match_base_per|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|robot_team_power_ratio|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"match_score":2400,"match_base_per":3000,"robot_team_power_ratio":[100,95,95,95]}`|

## BotLib

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|88|本表行键；与其他表同值不自动代表同一对象。|
|score|number|88|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|power|number|88|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_tid|number|88|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lv|number|88|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|robot_figure|number|88|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"score":2200,"power":100000,"fight_tid":1400001,"lv":37}`|
|2|`{"score":2400,"power":100000,"fight_tid":1400002,"lv":37}`|
|3|`{"score":2200,"power":200000,"fight_tid":1400003,"lv":37}`|
|4|`{"score":2400,"power":200000,"fight_tid":1400004,"lv":37}`|
|5|`{"score":2200,"power":300000,"fight_tid":1400005,"lv":37}`|
|6|`{"score":2400,"power":300000,"fight_tid":1400006,"lv":37}`|
|7|`{"score":2200,"power":400000,"fight_tid":1400007,"lv":37}`|
|8|`{"score":2400,"power":400000,"fight_tid":1400008,"lv":37}`|
|9|`{"score":2200,"power":500000,"fight_tid":1400009,"lv":37}`|
|10|`{"score":2400,"power":500000,"fight_tid":1400010,"lv":37}`|
|11|`{"score":2200,"power":1000000,"fight_tid":1400011,"lv":37}`|
|12|`{"score":2400,"power":1000000,"fight_tid":1400012,"lv":37}`|
|13|`{"score":2200,"power":2000000,"fight_tid":1400013,"lv":42}`|
|14|`{"score":2400,"power":2000000,"fight_tid":1400014,"lv":42}`|
|15|`{"score":2200,"power":3000000,"fight_tid":1400015,"lv":42}`|
|16|`{"score":2400,"power":3000000,"fight_tid":1400016,"lv":42}`|
|17|`{"score":2200,"power":4000000,"fight_tid":1400017,"lv":45}`|
|18|`{"score":2400,"power":4000000,"fight_tid":1400018,"lv":45}`|
|19|`{"score":2200,"power":5000000,"fight_tid":1400019,"lv":48}`|
|20|`{"score":2400,"power":5000000,"fight_tid":1400020,"lv":48}`|
|21|`{"score":2200,"power":10000000,"fight_tid":1400021,"lv":60}`|
|22|`{"score":2400,"power":10000000,"fight_tid":1400022,"lv":60}`|
|101|`{"score":2200,"power":195000,"fight_tid":1400101,"lv":37}`|
|102|`{"score":2400,"power":195000,"fight_tid":1400102,"lv":37}`|
|103|`{"score":2200,"power":390000,"fight_tid":1400103,"lv":37}`|
|104|`{"score":2400,"power":390000,"fight_tid":1400104,"lv":37}`|
|105|`{"score":2200,"power":585000,"fight_tid":1400105,"lv":37}`|
|106|`{"score":2400,"power":585000,"fight_tid":1400106,"lv":37}`|
|107|`{"score":2200,"power":780000,"fight_tid":1400107,"lv":37}`|
|108|`{"score":2400,"power":780000,"fight_tid":1400108,"lv":37}`|
|109|`{"score":2200,"power":975000,"fight_tid":1400109,"lv":37}`|
|110|`{"score":2400,"power":975000,"fight_tid":1400110,"lv":37}`|
|111|`{"score":2200,"power":1950000,"fight_tid":1400111,"lv":37}`|
|112|`{"score":2400,"power":1950000,"fight_tid":1400112,"lv":37}`|
|113|`{"score":2200,"power":3900000,"fight_tid":1400113,"lv":42}`|
|114|`{"score":2400,"power":3900000,"fight_tid":1400114,"lv":42}`|
|115|`{"score":2200,"power":5850000,"fight_tid":1400115,"lv":42}`|
|116|`{"score":2400,"power":5850000,"fight_tid":1400116,"lv":42}`|
|117|`{"score":2200,"power":7800000,"fight_tid":1400117,"lv":45}`|
|118|`{"score":2400,"power":7800000,"fight_tid":1400118,"lv":45}`|
|119|`{"score":2200,"power":9750000,"fight_tid":1400119,"lv":48}`|
|120|`{"score":2400,"power":9750000,"fight_tid":1400120,"lv":48}`|
|121|`{"score":2200,"power":19500000,"fight_tid":1400121,"lv":60}`|
|122|`{"score":2400,"power":19500000,"fight_tid":1400122,"lv":60}`|
|201|`{"score":2200,"power":290000,"fight_tid":1400201,"lv":37}`|
|202|`{"score":2400,"power":290000,"fight_tid":1400202,"lv":37}`|
|203|`{"score":2200,"power":580000,"fight_tid":1400203,"lv":37}`|
|204|`{"score":2400,"power":580000,"fight_tid":1400204,"lv":37}`|
|205|`{"score":2200,"power":870000,"fight_tid":1400205,"lv":37}`|
|206|`{"score":2400,"power":870000,"fight_tid":1400206,"lv":37}`|
|207|`{"score":2200,"power":1160000,"fight_tid":1400207,"lv":37}`|
|208|`{"score":2400,"power":1160000,"fight_tid":1400208,"lv":37}`|
|209|`{"score":2200,"power":1450000,"fight_tid":1400209,"lv":37}`|
|210|`{"score":2400,"power":1450000,"fight_tid":1400210,"lv":37}`|
|211|`{"score":2200,"power":2900000,"fight_tid":1400211,"lv":37}`|
|212|`{"score":2400,"power":2900000,"fight_tid":1400212,"lv":37}`|
|213|`{"score":2200,"power":5800000,"fight_tid":1400213,"lv":42}`|
|214|`{"score":2400,"power":5800000,"fight_tid":1400214,"lv":42}`|
|215|`{"score":2200,"power":8700000,"fight_tid":1400215,"lv":42}`|
|216|`{"score":2400,"power":8700000,"fight_tid":1400216,"lv":42}`|
|217|`{"score":2200,"power":11600000,"fight_tid":1400217,"lv":45}`|
|218|`{"score":2400,"power":11600000,"fight_tid":1400218,"lv":45}`|
|219|`{"score":2200,"power":14500000,"fight_tid":1400219,"lv":48}`|
|220|`{"score":2400,"power":14500000,"fight_tid":1400220,"lv":48}`|
|221|`{"score":2200,"power":29000000,"fight_tid":1400221,"lv":60}`|
|222|`{"score":2400,"power":29000000,"fight_tid":1400222,"lv":60}`|
|301|`{"score":2200,"power":385000,"fight_tid":1400301,"lv":37}`|
|302|`{"score":2400,"power":385000,"fight_tid":1400302,"lv":37}`|
|303|`{"score":2200,"power":770000,"fight_tid":1400303,"lv":37}`|
|304|`{"score":2400,"power":770000,"fight_tid":1400304,"lv":37}`|
|305|`{"score":2200,"power":1155000,"fight_tid":1400305,"lv":37}`|
|306|`{"score":2400,"power":1155000,"fight_tid":1400306,"lv":37}`|
|307|`{"score":2200,"power":1540000,"fight_tid":1400307,"lv":37}`|
|308|`{"score":2400,"power":1540000,"fight_tid":1400308,"lv":37}`|
|309|`{"score":2200,"power":1925000,"fight_tid":1400309,"lv":37}`|
|310|`{"score":2400,"power":1925000,"fight_tid":1400310,"lv":37}`|
|311|`{"score":2200,"power":3850000,"fight_tid":1400311,"lv":37}`|
|312|`{"score":2400,"power":3850000,"fight_tid":1400312,"lv":37}`|
|313|`{"score":2200,"power":7700000,"fight_tid":1400313,"lv":42}`|
|314|`{"score":2400,"power":7700000,"fight_tid":1400314,"lv":42}`|
|315|`{"score":2200,"power":11550000,"fight_tid":1400315,"lv":42}`|
|316|`{"score":2400,"power":11550000,"fight_tid":1400316,"lv":42}`|
|317|`{"score":2200,"power":15400000,"fight_tid":1400317,"lv":45}`|
|318|`{"score":2400,"power":15400000,"fight_tid":1400318,"lv":45}`|
|319|`{"score":2200,"power":19250000,"fight_tid":1400319,"lv":48}`|
|320|`{"score":2400,"power":19250000,"fight_tid":1400320,"lv":48}`|
|321|`{"score":2200,"power":38500000,"fight_tid":1400321,"lv":60}`|
|322|`{"score":2400,"power":38500000,"fight_tid":1400322,"lv":60}`|

## Level

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|16|本表行键；与其他表同值不自动代表同一对象。|
|integral|number|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|des|number|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|big_stage|number|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lv_index|number|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|icon|string|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|elo_index_fix|number|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|range|array|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|expand_value|number|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|expand_limit|number|16|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|integral_diff_limit|number|16|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|losing_streak|number|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|16|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"big_stage":0,"lv_index":0,"elo_index_fix":800,"expand_value":100,"expand_limit":8,"integral_diff_limit":800,"award":[]}`|
|2|`{"big_stage":0,"lv_index":0,"elo_index_fix":800,"expand_value":100,"expand_limit":8,"integral_diff_limit":800,"award":[[101500,50],[18002,10]]}`|
|3|`{"big_stage":0,"lv_index":0,"elo_index_fix":800,"expand_value":100,"expand_limit":8,"integral_diff_limit":800,"award":[[101500,50],[18002,10]]}`|
|4|`{"big_stage":1,"lv_index":1,"elo_index_fix":800,"expand_value":100,"expand_limit":8,"integral_diff_limit":800,"award":[[3002,1],[19002,1]]}`|
|5|`{"big_stage":1,"lv_index":1,"elo_index_fix":800,"expand_value":100,"expand_limit":8,"integral_diff_limit":800,"award":[[101500,100],[18002,20]]}`|
|6|`{"big_stage":1,"lv_index":1,"elo_index_fix":800,"expand_value":100,"expand_limit":8,"integral_diff_limit":800,"award":[[101500,100],[18002,20]]}`|
|7|`{"big_stage":2,"lv_index":2,"elo_index_fix":800,"expand_value":100,"expand_limit":8,"integral_diff_limit":800,"award":[[3002,2],[19002,2]]}`|
|8|`{"big_stage":2,"lv_index":2,"elo_index_fix":800,"expand_value":100,"expand_limit":10,"integral_diff_limit":1000,"award":[[101500,150],[18002,30]]}`|
|9|`{"big_stage":2,"lv_index":2,"elo_index_fix":600,"expand_value":100,"expand_limit":10,"integral_diff_limit":1000,"award":[[101500,150],[18002,30]]}`|
|10|`{"big_stage":3,"lv_index":3,"elo_index_fix":500,"expand_value":100,"expand_limit":10,"integral_diff_limit":1000,"award":[[3002,2],[19002,2]]}`|
|11|`{"big_stage":3,"lv_index":3,"elo_index_fix":400,"expand_value":100,"expand_limit":12,"integral_diff_limit":1200,"award":[[101500,200],[18002,40]]}`|
|12|`{"big_stage":3,"lv_index":3,"elo_index_fix":300,"expand_value":100,"expand_limit":12,"integral_diff_limit":1200,"award":[[101500,200],[18002,40]]}`|
|13|`{"big_stage":4,"lv_index":4,"elo_index_fix":200,"expand_value":100,"expand_limit":12,"integral_diff_limit":1200,"award":[[24002,1],[18002,50]]}`|
|14|`{"big_stage":4,"lv_index":4,"elo_index_fix":100,"expand_value":100,"expand_limit":12,"integral_diff_limit":1200,"award":[[23002,1],[19002,3]]}`|
|15|`{"big_stage":4,"lv_index":4,"elo_index_fix":100,"expand_value":100,"expand_limit":12,"integral_diff_limit":1200,"award":[[101500,300],[18002,50]]}`|
|16|`{"big_stage":5,"lv_index":5,"elo_index_fix":0,"expand_value":100,"expand_limit":12,"integral_diff_limit":1200,"award":[[101500,500],[19002,4]]}`|

## DayTask

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|task_type|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_key|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_count|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|4|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|des|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|brief_des|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"task_type":7002,"task_key":0,"task_count":5,"award":[[801900,10]]}`|
|2|`{"task_type":7002,"task_key":0,"task_count":10,"award":[[801900,10]]}`|
|3|`{"task_type":7003,"task_key":0,"task_count":2,"award":[[801900,20]]}`|
|4|`{"task_type":7003,"task_key":0,"task_count":5,"award":[[801900,20]]}`|

## State

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|date|array|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|

## DoubleRank

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|10|本表行键；与其他表同值不自动代表同一对象。|
|rank_range|array|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|10|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"rank_range":[1,1],"award":[[300208,1],[22002,5],[2002,45],[801900,2100],[19002,8]]}`|
|2|`{"rank_range":[2,2],"award":[[300308,1],[22002,4],[2002,40],[801900,1600],[19002,7]]}`|
|3|`{"rank_range":[3,3],"award":[[300408,1],[22002,3],[2002,30],[801900,1300],[19002,6]]}`|
|4|`{"rank_range":[4,10],"award":[[22002,3],[2002,25],[801900,1000],[19002,5]]}`|
|5|`{"rank_range":[11,20],"award":[[22002,2],[2002,20],[801900,800],[19002,4]]}`|
|6|`{"rank_range":[21,50],"award":[[22002,2],[2002,15],[801900,650],[19002,4]]}`|
|7|`{"rank_range":[51,100],"award":[[22002,2],[2002,10],[801900,600],[19002,3]]}`|
|8|`{"rank_range":[101,200],"award":[[22002,1],[2002,8],[801900,550],[19002,3]]}`|
|9|`{"rank_range":[201,500],"award":[[22002,1],[2002,6],[801900,500],[19002,2]]}`|
|10|`{"rank_range":[501,5000],"award":[[22002,1],[2002,5],[801900,450],[19002,1]]}`|
