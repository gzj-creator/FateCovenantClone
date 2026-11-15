# EliteMissionTable 规则参数

来源：[personal-server/assets/tables/EliteMissionTable.data.lua.json.gz](../../../../personal-server/assets/tables/EliteMissionTable.data.lua.json.gz)，SHA256：`85c18d97e6d4cdc62f22a9df0163c0038810dc0e8a71ad914856e75b6ac74c45`。

[完整逐行JSON](EliteMissionTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Boss](#boss)|90|decoded-rows|
|[EliteMission](#elitemission)|4585|decoded-rows|
|[Box](#box)|1374|decoded-rows|
|[Base](#base)|1|decoded-rows|
|[Chapter](#chapter)|460|decoded-rows|
|[Stage](#stage)|4|decoded-rows|
|[DifficultyPersonalized](#difficultypersonalized)|4585|decoded-rows|
|[AnchorDiff](#anchordiff)|134|decoded-rows|
|[AnchorDiffAttr](#anchordiffattr)|307|decoded-rows|
|[DiffcultyConst](#diffcultyconst)|1|decoded-rows|
|[DiffcultyPower](#diffcultypower)|6|decoded-rows|
|[DiffcultyPass](#diffcultypass)|11|decoded-rows|

## Boss

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|show_style|number|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|low_power_tip_pos|undefined|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|90|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|tid|number|90|本表行键；与其他表同值不自动代表同一对象。|
|show_title|number|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|recommend_power|number|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name_icon|string|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight|number|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|open_chapter|number|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|open_server_day|number|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award":[[2002,5],[25002,2],[101500,200]],"recommend_power":4200000,"fight":15900001,"open_chapter":1,"open_server_day":0}`|
|2|`{"award":[[2002,5],[25002,2],[101500,200]],"recommend_power":4570000,"fight":15900002,"open_chapter":8,"open_server_day":0}`|
|3|`{"award":[[2002,5],[25002,2],[101500,200]],"recommend_power":5060000,"fight":15900003,"open_chapter":12,"open_server_day":0}`|
|4|`{"award":[[2002,5],[25002,2],[101500,200]],"recommend_power":5790000,"fight":15900004,"open_chapter":16,"open_server_day":0}`|
|5|`{"award":[[2002,5],[25002,2],[101500,200]],"recommend_power":6450000,"fight":15900005,"open_chapter":20,"open_server_day":0}`|
|6|`{"award":[[2002,5],[25002,2],[101500,300]],"recommend_power":6840000,"fight":15900006,"open_chapter":24,"open_server_day":0}`|
|7|`{"award":[[2002,5],[25002,2],[101500,300]],"recommend_power":8170000,"fight":15900007,"open_chapter":28,"open_server_day":0}`|
|8|`{"award":[[2002,5],[25002,2],[101500,300]],"recommend_power":9810000,"fight":15900008,"open_chapter":32,"open_server_day":0}`|
|9|`{"award":[[2002,5],[25002,2],[101500,300]],"recommend_power":11530000,"fight":15900009,"open_chapter":36,"open_server_day":0}`|
|10|`{"award":[[2002,5],[25002,2],[101500,300]],"recommend_power":13830000,"fight":15900010,"open_chapter":40,"open_server_day":0}`|
|11|`{"award":[[2002,5],[25002,2],[101500,400]],"recommend_power":18240000,"fight":15900011,"open_chapter":44,"open_server_day":0}`|
|12|`{"award":[[2002,5],[25002,2],[101500,400]],"recommend_power":21000000,"fight":15900012,"open_chapter":48,"open_server_day":0}`|
|13|`{"award":[[2002,5],[25002,2],[101500,400]],"recommend_power":27000000,"fight":15900013,"open_chapter":52,"open_server_day":0}`|
|14|`{"award":[[2002,5],[25002,2],[101500,400]],"recommend_power":30440000,"fight":15900014,"open_chapter":56,"open_server_day":0}`|
|15|`{"award":[[2002,5],[25002,2],[101500,400]],"recommend_power":33030000,"fight":15900015,"open_chapter":60,"open_server_day":0}`|
|16|`{"award":[[2002,5],[25002,3],[101500,500]],"recommend_power":34320000,"fight":15900016,"open_chapter":64,"open_server_day":0}`|
|17|`{"award":[[2002,5],[25002,3],[101500,500]],"recommend_power":36470000,"fight":15900017,"open_chapter":68,"open_server_day":0}`|
|18|`{"award":[[2002,5],[25002,3],[101500,500]],"recommend_power":40780000,"fight":15900018,"open_chapter":72,"open_server_day":0}`|
|19|`{"award":[[2002,5],[25002,3],[101500,500]],"recommend_power":45080000,"fight":15900019,"open_chapter":76,"open_server_day":0}`|
|20|`{"award":[[2002,5],[25002,3],[101500,500]],"recommend_power":49500000,"fight":15900020,"open_chapter":80,"open_server_day":0}`|
|21|`{"award":[[2002,5],[25002,3],[101500,600]],"recommend_power":53520000,"fight":15900021,"open_chapter":84,"open_server_day":0}`|
|22|`{"award":[[2002,5],[25002,3],[101500,600]],"recommend_power":58600000,"fight":15900022,"open_chapter":88,"open_server_day":0}`|
|23|`{"award":[[2002,5],[25002,3],[101500,600]],"recommend_power":62790000,"fight":15900023,"open_chapter":92,"open_server_day":0}`|
|24|`{"award":[[2002,5],[25002,3],[101500,600]],"recommend_power":62790000,"fight":15900024,"open_chapter":96,"open_server_day":0}`|
|25|`{"award":[[2002,5],[25002,3],[101500,600]],"recommend_power":72710000,"fight":15900025,"open_chapter":100,"open_server_day":0}`|
|26|`{"award":[[2002,5],[25002,3],[101500,700]],"recommend_power":78760000,"fight":15900026,"open_chapter":104,"open_server_day":0}`|
|27|`{"award":[[2002,5],[25002,3],[101500,700]],"recommend_power":86210000,"fight":15900027,"open_chapter":108,"open_server_day":0}`|
|28|`{"award":[[2002,5],[25002,3],[101500,700]],"recommend_power":95440000,"fight":15900028,"open_chapter":112,"open_server_day":0}`|
|29|`{"award":[[2002,5],[25002,3],[101500,700]],"recommend_power":104380000,"fight":15900029,"open_chapter":116,"open_server_day":0}`|
|30|`{"award":[[2002,5],[25002,3],[101500,700]],"recommend_power":115660000,"fight":15900030,"open_chapter":120,"open_server_day":0}`|
|31|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":126730000,"fight":15900031,"open_chapter":128,"open_server_day":0}`|
|32|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":140360000,"fight":15900032,"open_chapter":136,"open_server_day":0}`|
|33|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":153690000,"fight":15900033,"open_chapter":144,"open_server_day":0}`|
|34|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":170160000,"fight":15900034,"open_chapter":152,"open_server_day":0}`|
|35|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":186160000,"fight":15900035,"open_chapter":160,"open_server_day":0}`|
|36|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":206030000,"fight":15900036,"open_chapter":168,"open_server_day":0}`|
|37|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":225810000,"fight":15900037,"open_chapter":176,"open_server_day":0}`|
|38|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":255670000,"fight":15900038,"open_chapter":184,"open_server_day":0}`|
|39|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":292930000,"fight":15900039,"open_chapter":192,"open_server_day":0}`|
|40|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":339750000,"fight":15900040,"open_chapter":200,"open_server_day":0}`|
|41|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":389230000,"fight":15900041,"open_chapter":208,"open_server_day":0}`|
|42|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":450580000,"fight":15900042,"open_chapter":216,"open_server_day":0}`|
|43|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":516230000,"fight":15900043,"open_chapter":224,"open_server_day":0}`|
|44|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":598740000,"fight":15900044,"open_chapter":232,"open_server_day":0}`|
|45|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":722150000,"fight":15900045,"open_chapter":240,"open_server_day":0}`|
|46|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":866120000,"fight":15900046,"open_chapter":248,"open_server_day":0}`|
|47|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":1044370000,"fight":15900047,"open_chapter":256,"open_server_day":0}`|
|48|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":1256900000,"fight":15900048,"open_chapter":264,"open_server_day":0}`|
|49|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":1476290000,"fight":15900049,"open_chapter":272,"open_server_day":0}`|
|50|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":1695670000,"fight":15900050,"open_chapter":280,"open_server_day":0}`|
|51|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":1976760000,"fight":15900051,"open_chapter":288,"open_server_day":0}`|
|52|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":2257850000,"fight":15900052,"open_chapter":296,"open_server_day":0}`|
|53|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":2538940000,"fight":15900053,"open_chapter":304,"open_server_day":0}`|
|54|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":2826880000,"fight":15900054,"open_chapter":312,"open_server_day":0}`|
|55|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":3114820000,"fight":15900055,"open_chapter":320,"open_server_day":0}`|
|56|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":3402770000,"fight":15900056,"open_chapter":328,"open_server_day":0}`|
|57|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":3697570000,"fight":15900057,"open_chapter":336,"open_server_day":0}`|
|58|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":3992360000,"fight":15900058,"open_chapter":344,"open_server_day":0}`|
|59|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":4294020000,"fight":15900059,"open_chapter":352,"open_server_day":0}`|
|60|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":4595670000,"fight":15900060,"open_chapter":360,"open_server_day":0}`|
|61|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":4746500000,"fight":15900061,"open_chapter":360,"open_server_day":999}`|
|62|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":4897330000,"fight":15900062,"open_chapter":360,"open_server_day":999}`|
|63|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":5048160000,"fight":15900063,"open_chapter":360,"open_server_day":999}`|
|64|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":5198990000,"fight":15900064,"open_chapter":360,"open_server_day":999}`|
|65|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":5349810000,"fight":15900065,"open_chapter":360,"open_server_day":999}`|
|66|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":5500640000,"fight":15900066,"open_chapter":360,"open_server_day":999}`|
|67|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":5651470000,"fight":15900067,"open_chapter":360,"open_server_day":999}`|
|68|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":5802300000,"fight":15900068,"open_chapter":360,"open_server_day":999}`|
|69|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":5953120000,"fight":15900069,"open_chapter":360,"open_server_day":999}`|
|70|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":6103950000,"fight":15900070,"open_chapter":360,"open_server_day":999}`|
|71|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":6254780000,"fight":15900071,"open_chapter":360,"open_server_day":999}`|
|72|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":6405610000,"fight":15900072,"open_chapter":360,"open_server_day":999}`|
|73|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":6556430000,"fight":15900073,"open_chapter":360,"open_server_day":999}`|
|74|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":6707260000,"fight":15900074,"open_chapter":360,"open_server_day":999}`|
|75|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":6858090000,"fight":15900075,"open_chapter":360,"open_server_day":999}`|
|76|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":7008920000,"fight":15900076,"open_chapter":360,"open_server_day":999}`|
|77|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":7159740000,"fight":15900077,"open_chapter":360,"open_server_day":999}`|
|78|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":7310570000,"fight":15900078,"open_chapter":360,"open_server_day":999}`|
|79|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":7461400000,"fight":15900079,"open_chapter":360,"open_server_day":999}`|
|80|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":7612230000,"fight":15900080,"open_chapter":360,"open_server_day":999}`|
|81|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":7763050000,"fight":15900081,"open_chapter":360,"open_server_day":999}`|
|82|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":7913880000,"fight":15900082,"open_chapter":360,"open_server_day":999}`|
|83|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":8064710000,"fight":15900083,"open_chapter":360,"open_server_day":999}`|
|84|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":8215540000,"fight":15900084,"open_chapter":360,"open_server_day":999}`|
|85|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":8366360000,"fight":15900085,"open_chapter":360,"open_server_day":999}`|
|86|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":8517190000,"fight":15900086,"open_chapter":360,"open_server_day":999}`|
|87|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":8668020000,"fight":15900087,"open_chapter":360,"open_server_day":999}`|
|88|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":8818850000,"fight":15900088,"open_chapter":360,"open_server_day":999}`|
|89|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":8969670000,"fight":15900089,"open_chapter":360,"open_server_day":999}`|
|90|`{"award":[[2002,5],[25002,3],[101500,800]],"recommend_power":9120500000,"fight":15900090,"open_chapter":360,"open_server_day":999}`|

## EliteMission

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|story|number|4585|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|assistant_param|number|4585|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|4585|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|index|number|4585|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|assert_tips|number|4585|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|belong_chapter|number|4585|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|game|number|4585|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight|number|4585|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|btn_text|number|4585|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|assert_jump|number|4585|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4585|本表行键；与其他表同值不自动代表同一对象。|
|assert_desc|number|4585|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|need_level|number|4585|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|monster_type|number|4585|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|scene_state|number|4585|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|assert|undefined|4585|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|need_open_days|array|4585|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|assert_jump_param|number|4585|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部4585行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"award":[[125202,1],[201500,400],[101800,300]],"assert_tips":0,"fight":15000101,"assert_jump":0,"assert_desc":0,"need_level":0,"monster_type":0,"scene_state":2,"need_open_days":[[1727730000,10],[1729026000,10],[1729112400,5]],"assert_jump_param":0}`|
|102|`{"award":[[125302,1],[201500,400],[101800,300]],"assert_tips":0,"fight":15000102,"assert_jump":0,"assert_desc":0,"need_level":0,"monster_type":0,"scene_state":2,"need_open_days":[[1727730000,10],[1729026000,10],[1729112400,5]],"assert_jump_param":0}`|
|103|`{"award":[[125402,1],[201500,400],[101800,300]],"assert_tips":0,"fight":15000103,"assert_jump":0,"assert_desc":0,"need_level":0,"monster_type":0,"scene_state":2,"need_open_days":[[1727730000,10],[1729026000,10],[1729112400,5]],"assert_jump_param":0}`|

## Box

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1374|本表行键；与其他表同值不自动代表同一对象。|
|open_mission_id|number|1374|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|1374|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

下列3行用于说明结构；全部1374行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"open_mission_id":105,"award":[[25002,1],[101500,30],[201500,25000]]}`|
|2|`{"open_mission_id":205,"award":[[25002,1],[101500,30],[201500,25000]]}`|
|3|`{"open_mission_id":305,"award":[[25002,1],[101500,30],[201500,25000]]}`|

## Base

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|box_reddot|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cost_num|number|1|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|auto_fight_show|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|auto_fight_open|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|cost_item|number|1|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|extra_rand_rate|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cant_challenge_boss_power_gap|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|auto_fight_mission_tips|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|box_reddot_threshold|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|multi_team_unlock|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"cost_num":5,"auto_fight_show":211346500001,"auto_fight_open":211346500001,"cost_item":100012900,"extra_rand_rate":1000,"cant_challenge_boss_power_gap":1000,"auto_fight_mission_tips":0,"multi_team_unlock":[2,41,131,3,132,189,4,190,99999]}`|

## Chapter

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|loc_pos|array|460|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|chapter_name|number|460|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|460|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|move_speed|number|460|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|460|本表行键；与其他表同值不自动代表同一对象。|
|hero|array|460|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|map|string|460|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|enter_param|array|460|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|scene|string|460|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pass_chapter_type|number|460|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pass_chapter_prefab|string|460|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pass_chapter_title|string|460|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ani|string|460|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部460行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"loc_pos":[0,0],"award":[],"move_speed":2,"hero":[2010201,300000,2010101],"pass_chapter_type":0}`|
|2|`{"loc_pos":[0,0],"award":[],"move_speed":2,"hero":[2010201,300000,2010101],"pass_chapter_type":0}`|
|3|`{"loc_pos":[0,0],"award":[],"move_speed":2,"hero":[2010201,300000,2010101],"pass_chapter_type":0}`|

## Stage

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|max_chapter|number|4|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|click_tips|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|btn_tips|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|0|`{"max_chapter":460}`|
|1|`{"max_chapter":460}`|
|2|`{"max_chapter":460}`|
|3|`{"max_chapter":460}`|

## DifficultyPersonalized

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4585|本表行键；与其他表同值不自动代表同一对象。|
|power_mul|number|4585|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部4585行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"power_mul":0}`|
|102|`{"power_mul":0}`|
|103|`{"power_mul":0}`|

## AnchorDiff

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|134|本表行键；与其他表同值不自动代表同一对象。|
|base_layer_min|number|134|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|base_layer_max|number|134|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|5|`{"base_layer_min":101,"base_layer_max":46010}`|
|6|`{"base_layer_min":101,"base_layer_max":46010}`|
|7|`{"base_layer_min":101,"base_layer_max":46010}`|
|8|`{"base_layer_min":101,"base_layer_max":46010}`|
|9|`{"base_layer_min":101,"base_layer_max":46010}`|
|10|`{"base_layer_min":101,"base_layer_max":46010}`|
|11|`{"base_layer_min":101,"base_layer_max":46010}`|
|12|`{"base_layer_min":101,"base_layer_max":46010}`|
|13|`{"base_layer_min":101,"base_layer_max":46010}`|
|14|`{"base_layer_min":101,"base_layer_max":46010}`|
|15|`{"base_layer_min":101,"base_layer_max":46010}`|
|16|`{"base_layer_min":101,"base_layer_max":46010}`|
|17|`{"base_layer_min":101,"base_layer_max":46010}`|
|18|`{"base_layer_min":101,"base_layer_max":46010}`|
|19|`{"base_layer_min":101,"base_layer_max":46010}`|
|20|`{"base_layer_min":101,"base_layer_max":46010}`|
|21|`{"base_layer_min":101,"base_layer_max":46010}`|
|22|`{"base_layer_min":101,"base_layer_max":46010}`|
|23|`{"base_layer_min":101,"base_layer_max":46010}`|
|24|`{"base_layer_min":101,"base_layer_max":46010}`|
|25|`{"base_layer_min":101,"base_layer_max":46010}`|
|26|`{"base_layer_min":101,"base_layer_max":46010}`|
|27|`{"base_layer_min":101,"base_layer_max":46010}`|
|28|`{"base_layer_min":101,"base_layer_max":46010}`|
|29|`{"base_layer_min":101,"base_layer_max":46010}`|
|30|`{"base_layer_min":101,"base_layer_max":46010}`|
|31|`{"base_layer_min":101,"base_layer_max":46010}`|
|32|`{"base_layer_min":101,"base_layer_max":46010}`|
|33|`{"base_layer_min":101,"base_layer_max":46010}`|
|34|`{"base_layer_min":101,"base_layer_max":46010}`|
|35|`{"base_layer_min":101,"base_layer_max":46010}`|
|36|`{"base_layer_min":101,"base_layer_max":46010}`|
|37|`{"base_layer_min":101,"base_layer_max":46010}`|
|38|`{"base_layer_min":101,"base_layer_max":46010}`|
|39|`{"base_layer_min":101,"base_layer_max":46010}`|
|40|`{"base_layer_min":101,"base_layer_max":46010}`|
|41|`{"base_layer_min":101,"base_layer_max":46010}`|
|42|`{"base_layer_min":101,"base_layer_max":46010}`|
|43|`{"base_layer_min":101,"base_layer_max":46010}`|
|44|`{"base_layer_min":101,"base_layer_max":46010}`|
|45|`{"base_layer_min":101,"base_layer_max":46010}`|
|46|`{"base_layer_min":101,"base_layer_max":46010}`|
|47|`{"base_layer_min":101,"base_layer_max":46010}`|
|48|`{"base_layer_min":101,"base_layer_max":46010}`|
|49|`{"base_layer_min":101,"base_layer_max":46010}`|
|50|`{"base_layer_min":101,"base_layer_max":46010}`|
|51|`{"base_layer_min":101,"base_layer_max":46010}`|
|52|`{"base_layer_min":101,"base_layer_max":46010}`|
|53|`{"base_layer_min":101,"base_layer_max":46010}`|
|54|`{"base_layer_min":101,"base_layer_max":46010}`|
|55|`{"base_layer_min":101,"base_layer_max":46010}`|
|56|`{"base_layer_min":101,"base_layer_max":46010}`|
|57|`{"base_layer_min":101,"base_layer_max":46010}`|
|58|`{"base_layer_min":101,"base_layer_max":46010}`|
|59|`{"base_layer_min":101,"base_layer_max":46010}`|
|60|`{"base_layer_min":101,"base_layer_max":46010}`|
|61|`{"base_layer_min":101,"base_layer_max":46010}`|
|62|`{"base_layer_min":101,"base_layer_max":46010}`|
|63|`{"base_layer_min":101,"base_layer_max":46010}`|
|64|`{"base_layer_min":101,"base_layer_max":46010}`|
|65|`{"base_layer_min":101,"base_layer_max":46010}`|
|66|`{"base_layer_min":101,"base_layer_max":46010}`|
|67|`{"base_layer_min":101,"base_layer_max":46010}`|
|68|`{"base_layer_min":101,"base_layer_max":46010}`|
|69|`{"base_layer_min":101,"base_layer_max":46010}`|
|70|`{"base_layer_min":101,"base_layer_max":46010}`|
|71|`{"base_layer_min":101,"base_layer_max":46010}`|
|72|`{"base_layer_min":101,"base_layer_max":46010}`|
|73|`{"base_layer_min":101,"base_layer_max":46010}`|
|74|`{"base_layer_min":101,"base_layer_max":46010}`|
|75|`{"base_layer_min":101,"base_layer_max":46010}`|
|76|`{"base_layer_min":101,"base_layer_max":46010}`|
|77|`{"base_layer_min":101,"base_layer_max":46010}`|
|78|`{"base_layer_min":101,"base_layer_max":46010}`|
|79|`{"base_layer_min":101,"base_layer_max":46010}`|
|80|`{"base_layer_min":101,"base_layer_max":46010}`|
|81|`{"base_layer_min":101,"base_layer_max":46010}`|
|82|`{"base_layer_min":101,"base_layer_max":46010}`|
|83|`{"base_layer_min":101,"base_layer_max":46010}`|
|84|`{"base_layer_min":101,"base_layer_max":46010}`|
|85|`{"base_layer_min":101,"base_layer_max":46010}`|
|86|`{"base_layer_min":101,"base_layer_max":46010}`|
|87|`{"base_layer_min":101,"base_layer_max":46010}`|
|88|`{"base_layer_min":101,"base_layer_max":46010}`|
|89|`{"base_layer_min":101,"base_layer_max":46010}`|
|90|`{"base_layer_min":101,"base_layer_max":46010}`|
|91|`{"base_layer_min":101,"base_layer_max":46010}`|
|92|`{"base_layer_min":101,"base_layer_max":46010}`|
|93|`{"base_layer_min":101,"base_layer_max":46010}`|
|94|`{"base_layer_min":101,"base_layer_max":46010}`|
|95|`{"base_layer_min":101,"base_layer_max":46010}`|
|96|`{"base_layer_min":101,"base_layer_max":46010}`|
|97|`{"base_layer_min":101,"base_layer_max":46010}`|
|98|`{"base_layer_min":101,"base_layer_max":46010}`|
|99|`{"base_layer_min":101,"base_layer_max":46010}`|
|100|`{"base_layer_min":101,"base_layer_max":46010}`|
|101|`{"base_layer_min":101,"base_layer_max":46010}`|
|102|`{"base_layer_min":101,"base_layer_max":46010}`|
|103|`{"base_layer_min":101,"base_layer_max":46010}`|
|104|`{"base_layer_min":101,"base_layer_max":46010}`|
|105|`{"base_layer_min":101,"base_layer_max":46010}`|
|106|`{"base_layer_min":101,"base_layer_max":46010}`|
|107|`{"base_layer_min":101,"base_layer_max":46010}`|
|108|`{"base_layer_min":101,"base_layer_max":46010}`|
|109|`{"base_layer_min":101,"base_layer_max":46010}`|
|110|`{"base_layer_min":101,"base_layer_max":46010}`|
|111|`{"base_layer_min":101,"base_layer_max":46010}`|
|112|`{"base_layer_min":101,"base_layer_max":46010}`|
|113|`{"base_layer_min":101,"base_layer_max":46010}`|
|114|`{"base_layer_min":101,"base_layer_max":46010}`|
|115|`{"base_layer_min":101,"base_layer_max":46010}`|
|116|`{"base_layer_min":101,"base_layer_max":46010}`|
|117|`{"base_layer_min":101,"base_layer_max":46010}`|
|118|`{"base_layer_min":101,"base_layer_max":46010}`|
|119|`{"base_layer_min":101,"base_layer_max":46010}`|
|120|`{"base_layer_min":101,"base_layer_max":46010}`|
|121|`{"base_layer_min":101,"base_layer_max":46010}`|
|122|`{"base_layer_min":101,"base_layer_max":46010}`|
|123|`{"base_layer_min":101,"base_layer_max":46010}`|
|124|`{"base_layer_min":101,"base_layer_max":46010}`|
|125|`{"base_layer_min":101,"base_layer_max":46010}`|
|126|`{"base_layer_min":101,"base_layer_max":46010}`|
|127|`{"base_layer_min":101,"base_layer_max":46010}`|
|128|`{"base_layer_min":101,"base_layer_max":46010}`|
|129|`{"base_layer_min":101,"base_layer_max":46010}`|
|130|`{"base_layer_min":101,"base_layer_max":46010}`|
|131|`{"base_layer_min":101,"base_layer_max":46010}`|
|132|`{"base_layer_min":101,"base_layer_max":46010}`|
|133|`{"base_layer_min":101,"base_layer_max":46010}`|
|134|`{"base_layer_min":101,"base_layer_max":46010}`|
|135|`{"base_layer_min":101,"base_layer_max":46010}`|
|136|`{"base_layer_min":101,"base_layer_max":46010}`|
|137|`{"base_layer_min":101,"base_layer_max":46010}`|
|138|`{"base_layer_min":101,"base_layer_max":46010}`|

## AnchorDiffAttr

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|307|本表行键；与其他表同值不自动代表同一对象。|
|power_mul|number|307|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部307行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|100000|`{"power_mul":0}`|
|100001|`{"power_mul":0}`|
|100002|`{"power_mul":0}`|

## DiffcultyConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|start_mission_id|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_power_rate|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|power_start_mission|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pass_reduce_day|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pass_start_mission|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"start_mission_id":401,"max_power_rate":9750,"power_start_mission":101,"pass_reduce_day":9999,"pass_start_mission":101}`|

## DiffcultyPower

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|attr|array|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|0|`{"attr":[[54,0],[55,0]]}`|
|100|`{"attr":[[54,0],[55,0]]}`|
|200|`{"attr":[[54,0],[55,0]]}`|
|400|`{"attr":[[54,0],[55,0]]}`|
|700|`{"attr":[[54,0],[55,0]]}`|
|1000|`{"attr":[[54,0],[55,0]]}`|

## DiffcultyPass

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|11|本表行键；与其他表同值不自动代表同一对象。|
|desc|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr|array|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|0|`{"attr":[[13,0],[23,0]]}`|
|1|`{"attr":[[13,0],[23,0]]}`|
|100|`{"attr":[[13,0],[23,0]]}`|
|200|`{"attr":[[13,0],[23,0]]}`|
|300|`{"attr":[[13,0],[23,0]]}`|
|400|`{"attr":[[13,0],[23,0]]}`|
|500|`{"attr":[[13,0],[23,0]]}`|
|550|`{"attr":[[13,0],[23,0]]}`|
|600|`{"attr":[[13,0],[23,0]]}`|
|650|`{"attr":[[13,0],[23,0]]}`|
|700|`{"attr":[[13,0],[23,0]]}`|
