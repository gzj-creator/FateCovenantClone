# BakingActTable 规则参数

来源：[personal-server/assets/tables/BakingActTable.data.lua.json.gz](../../../../personal-server/assets/tables/BakingActTable.data.lua.json.gz)，SHA256：`2dc17b38d048709305d84cfc1bd389fe4c7e419d19ce890a67ae9a6422cc44cb`。

[完整逐行JSON](BakingActTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[EventShow](#eventshow)|2|decoded-rows|
|[Cheat](#cheat)|2|decoded-rows|
|[Global](#global)|1|decoded-rows|
|[Area](#area)|2|decoded-rows|
|[DailyRankAward](#dailyrankaward)|16|decoded-rows|
|[DailyRankVersion](#dailyrankversion)|10|decoded-rows|
|[FirecrackerActBubbleMsg](#firecrackeractbubblemsg)|12|decoded-rows|
|[Version](#version)|2|decoded-rows|
|[CakeItem](#cakeitem)|8|decoded-rows|
|[Vip](#vip)|1|decoded-rows|
|[SpecialEvent](#specialevent)|5|decoded-rows|
|[Lv](#lv)|102|decoded-rows|
|[RankAward](#rankaward)|16|decoded-rows|
|[Order](#order)|241|decoded-rows|
|[ItemType](#itemtype)|4|decoded-rows|
|[ItemShow](#itemshow)|5|decoded-rows|

## EventShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|event_desc|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_res|string|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|btn1_text|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|btn2_text|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|

## Cheat

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|belonging_version|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|effect_type|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cost_item|number|2|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|cost_item_num|number|2|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|effect_value|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|item|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"belonging_version":1,"cost_item":834802,"cost_item_num":1,"item":0}`|
|2|`{"belonging_version":1,"cost_item":834902,"cost_item_num":1,"item":6}`|

## Global

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|lock_lv|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|make_num|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|close_level|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|level_max|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|stamina_tip_threshold|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|board_full_tip_threshold|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|score_rate|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"lock_lv":5,"make_num":10,"close_level":100,"level_max":8,"stamina_tip_threshold":30,"score_rate":1}`|

## Area

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|belonging_version|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|grid_start_range|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|grid_end_range|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|need_cake_num|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"belonging_version":1,"grid_start_range":[3,3],"need_cake_num":0}`|
|2|`{"belonging_version":1,"grid_start_range":[0,0],"need_cake_num":10}`|

## DailyRankAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|16|本表行键；与其他表同值不自动代表同一对象。|
|belonging_version|number|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rank_range|array|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|16|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10101|`{"belonging_version":101,"rank_range":[1,1],"award":[[391002,600],[392002,30],[101500,600],[22002,3],[7006002,40]]}`|
|10102|`{"belonging_version":101,"rank_range":[2,2],"award":[[391002,400],[392002,20],[101500,400],[22002,2],[7006002,20]]}`|
|10103|`{"belonging_version":101,"rank_range":[3,3],"award":[[391002,300],[392002,12],[101500,300],[22002,2],[7006002,10]]}`|
|10104|`{"belonging_version":101,"rank_range":[4,5],"award":[[391002,200],[392002,6],[101500,200],[22002,1],[7006002,5]]}`|
|10105|`{"belonging_version":101,"rank_range":[6,10],"award":[[391002,150],[392002,4],[101500,150],[22002,1],[7006002,2]]}`|
|10106|`{"belonging_version":101,"rank_range":[11,20],"award":[[391002,120],[392002,3],[101500,120],[22002,1]]}`|
|10107|`{"belonging_version":101,"rank_range":[21,50],"award":[[391002,100],[392002,2],[101500,100]]}`|
|10108|`{"belonging_version":101,"rank_range":[51,200],"award":[[391002,60],[392002,1],[101500,60]]}`|
|20101|`{"belonging_version":201,"rank_range":[1,1],"award":[[391002,600],[392002,30],[101500,600],[22002,3],[7003002,40]]}`|
|20102|`{"belonging_version":201,"rank_range":[2,2],"award":[[391002,400],[392002,20],[101500,400],[22002,2],[7003002,20]]}`|
|20103|`{"belonging_version":201,"rank_range":[3,3],"award":[[391002,300],[392002,12],[101500,300],[22002,2],[7003002,10]]}`|
|20104|`{"belonging_version":201,"rank_range":[4,5],"award":[[391002,200],[392002,6],[101500,200],[22002,1],[7003002,5]]}`|
|20105|`{"belonging_version":201,"rank_range":[6,10],"award":[[391002,150],[392002,4],[101500,150],[22002,1],[7003002,2]]}`|
|20106|`{"belonging_version":201,"rank_range":[11,20],"award":[[391002,120],[392002,3],[101500,120],[22002,1]]}`|
|20107|`{"belonging_version":201,"rank_range":[21,50],"award":[[391002,100],[392002,2],[101500,100]]}`|
|20108|`{"belonging_version":201,"rank_range":[51,200],"award":[[391002,60],[392002,1],[101500,60]]}`|

## DailyRankVersion

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|10|本表行键；与其他表同值不自动代表同一对象。|
|belonging_version|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|nth_day|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|daily_rank_award|number|10|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"belonging_version":1,"nth_day":1,"daily_rank_award":101}`|
|102|`{"belonging_version":1,"nth_day":2,"daily_rank_award":101}`|
|103|`{"belonging_version":1,"nth_day":3,"daily_rank_award":101}`|
|104|`{"belonging_version":1,"nth_day":4,"daily_rank_award":101}`|
|105|`{"belonging_version":1,"nth_day":5,"daily_rank_award":101}`|
|201|`{"belonging_version":2,"nth_day":1,"daily_rank_award":201}`|
|202|`{"belonging_version":2,"nth_day":2,"daily_rank_award":201}`|
|203|`{"belonging_version":2,"nth_day":3,"daily_rank_award":201}`|
|204|`{"belonging_version":2,"nth_day":4,"daily_rank_award":201}`|
|205|`{"belonging_version":2,"nth_day":5,"daily_rank_award":201}`|

## FirecrackerActBubbleMsg

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|12|本表行键；与其他表同值不自动代表同一对象。|
|type|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|text|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"type":1}`|
|2|`{"type":1}`|
|3|`{"type":1}`|
|4|`{"type":1}`|
|5|`{"type":2}`|
|6|`{"type":2}`|
|7|`{"type":2}`|
|8|`{"type":2}`|
|9|`{"type":3}`|
|10|`{"type":3}`|
|11|`{"type":3}`|
|12|`{"type":3}`|

## Version

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|score_item|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|item|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|item_recover|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|recover_type|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|recover_time|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|recover_num|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_stamina|number|2|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|absolute_max_stamina|number|2|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|init_stamina|number|2|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|make_cost_stamina|number|2|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|title|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|recycle_mail_tid|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cheat_item_library|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|area_library|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cake_typ_library|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|privilege_library|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|daily_rank_library|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rank_library|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lv_library|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|abandon_item|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|abandon_item_num|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|abandon_weight|array|2|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|
|back_score|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|weight_formula|number|2|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|
|grid_size|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|score_rank_key|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|daily_score_rank_key|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|score_rank_mail_id|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|daily_score_rank_mail_id|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|item_size|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|gift|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|shop|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|daily_rank_settle_time|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|item_show_1|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|item_show_2|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|role_prefab|string|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|gen_limited_time_order_times|number|2|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"score_item":834502,"item":834602,"item_recover":10,"recover_type":0,"recover_time":1800,"recover_num":10,"max_stamina":200,"absolute_max_stamina":1000,"init_stamina":50,"make_cost_stamina":1,"recycle_mail_tid":9551400,"cheat_item_library":1,"area_library":1,"cake_typ_library":1,"privilege_library":1,"daily_rank_library":1,"rank_library":1,"lv_library":1,"abandon_item":834702,"abandon_item_num":1,"abandon_weight":[1,8],"back_score":10,"weight_formula":0.2,"score_rank_key":441,"daily_score_rank_key":442,"score_rank_mail_id":9541400,"daily_score_rank_mail_id":9531400,"item_size":80,"daily_rank_settle_time":61200,"item_show_1":834502,"item_show_2":834602,"gen_limited_time_order_times":3}`|
|2|`{"score_item":834502,"item":834602,"item_recover":10,"recover_type":0,"recover_time":1800,"recover_num":10,"max_stamina":200,"absolute_max_stamina":1000,"init_stamina":50,"make_cost_stamina":1,"recycle_mail_tid":9551400,"cheat_item_library":1,"area_library":1,"cake_typ_library":1,"privilege_library":1,"daily_rank_library":2,"rank_library":2,"lv_library":2,"abandon_item":834702,"abandon_item_num":1,"abandon_weight":[1,8],"back_score":10,"weight_formula":0.2,"score_rank_key":439,"daily_score_rank_key":440,"score_rank_mail_id":9541400,"daily_score_rank_mail_id":9531400,"item_size":80,"daily_rank_settle_time":61200,"item_show_1":834502,"item_show_2":834602,"gen_limited_time_order_times":3}`|

## CakeItem

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|8|本表行键；与其他表同值不自动代表同一对象。|
|item_type|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|icon_res|string|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|event_show|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|play_effect|string|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"item_type":1}`|
|2|`{"item_type":1}`|
|3|`{"item_type":1}`|
|4|`{"item_type":1}`|
|5|`{"item_type":2}`|
|6|`{"item_type":3}`|
|7|`{"item_type":4}`|
|8|`{"item_type":4}`|

## Vip

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|belonging_version|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|base_recharge|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|add_score_per|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tips|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"belonging_version":1,"base_recharge":1410001,"add_score_per":1000}`|

## SpecialEvent

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|item|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|reward_version|number|5|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award1|array|5|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award2|array|5|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"item":8,"reward_version":1,"award1":[[4371200,5]],"award2":[[4471200,5]]}`|
|201|`{"item":8,"reward_version":2,"award1":[[4371200,5]],"award2":[[4471200,5]]}`|
|301|`{"item":8,"reward_version":3,"award1":[[4371200,5]],"award2":[[4471200,5]]}`|
|401|`{"item":8,"reward_version":4,"award1":[[5741200,5]],"award2":[[5951200,5]]}`|
|501|`{"item":7,"reward_version":5,"award1":[[4371200,5]],"award2":[]}`|

## Lv

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|102|本表行键；与其他表同值不自动代表同一对象。|
|level|number|102|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|belonging_version|number|102|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|up_need_exp|number|102|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cake_weight_list|array|102|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|
|order_weight_list|array|102|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|
|cake_lv_list|array|102|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cake_lv_weight_list|array|102|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|
|yeast_lv_list|array|102|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|yeast_lv_weight_list|array|102|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|
|award|object/array|102|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|task_desc|number|102|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"level":1,"belonging_version":1,"up_need_exp":0,"cake_weight_list":[[100,1]],"order_weight_list":[[10000,999]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[100,0,0,0,0,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[100,0,0,0,0,0,0,0,0,0],"award":{"global":"TableEmpty"},"task_desc":690207}`|
|102|`{"level":2,"belonging_version":1,"up_need_exp":20,"cake_weight_list":[[200,1],[300,2],[200,3],[200,4],[50,5]],"order_weight_list":[[10000,101],[1500,201]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[100,0,0,0,0,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[100,0,0,0,0,0,0,0,0,0],"award":[[101500,100]],"task_desc":690207}`|
|103|`{"level":3,"belonging_version":1,"up_need_exp":500,"cake_weight_list":[[200,1],[300,2],[200,3],[200,4],[50,5]],"order_weight_list":[[10000,101],[1500,201]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[85,15,0,0,0,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[85,15,0,0,0,0,0,0,0,0],"award":[[830602,2],[101500,100]],"task_desc":690207}`|
|104|`{"level":4,"belonging_version":1,"up_need_exp":1500,"cake_weight_list":[[200,1],[300,2],[200,3],[200,4],[50,5]],"order_weight_list":[[10000,101],[1500,201]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[75,25,0,0,0,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[75,25,0,0,0,0,0,0,0,0],"award":[[6081200,5],[830602,3],[101500,100]],"task_desc":690207}`|
|105|`{"level":5,"belonging_version":1,"up_need_exp":3000,"cake_weight_list":[[200,1],[300,2],[200,3],[200,4],[50,5]],"order_weight_list":[[10000,101],[1500,201]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[65,35,0,0,0,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[65,35,0,0,0,0,0,0,0,0],"award":[[22002,1],[830602,5],[101500,100]],"task_desc":690207}`|
|106|`{"level":6,"belonging_version":1,"up_need_exp":5000,"cake_weight_list":[[200,1],[300,2],[200,3],[200,4],[50,5]],"order_weight_list":[[10000,101],[1500,201]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[55,45,0,0,0,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[55,45,0,0,0,0,0,0,0,0],"award":[[6081200,5],[830602,5],[101500,100]],"task_desc":690207}`|
|107|`{"level":7,"belonging_version":1,"up_need_exp":7500,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,102],[1500,202]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[25,60,15,0,0,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[25,60,15,0,0,0,0,0,0,0],"award":[[472002,1],[830602,5],[101500,100]],"task_desc":690207}`|
|108|`{"level":8,"belonging_version":1,"up_need_exp":11500,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,102],[1500,202]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[20,65,15,0,0,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[20,65,15,0,0,0,0,0,0,0],"award":[[6071200,5],[830602,5],[101500,100]],"task_desc":690207}`|
|109|`{"level":9,"belonging_version":1,"up_need_exp":17500,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,102],[1500,202]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[15,70,15,0,0,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[15,70,15,0,0,0,0,0,0,0],"award":[[6081200,5],[830602,5],[101500,100]],"task_desc":690207}`|
|110|`{"level":10,"belonging_version":1,"up_need_exp":24500,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,102],[1500,202]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[15,65,20,0,0,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[15,65,20,0,0,0,0,0,0,0],"award":[[22002,1],[830602,5],[101500,100]],"task_desc":690207}`|
|111|`{"level":11,"belonging_version":1,"up_need_exp":32500,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,102],[1500,202]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[10,65,25,0,0,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[10,65,25,0,0,0,0,0,0,0],"award":[[6071200,5],[830602,5],[101500,100]],"task_desc":690207}`|
|112|`{"level":12,"belonging_version":1,"up_need_exp":41500,"cake_weight_list":[[120,1],[320,2],[280,3],[280,4],[50,5]],"order_weight_list":[[10000,103],[1500,203]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,29,52,19,0,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,29,52,19,0,0,0,0,0,0],"award":[[6081200,5],[830602,5],[101500,100]],"task_desc":690207}`|
|113|`{"level":13,"belonging_version":1,"up_need_exp":54500,"cake_weight_list":[[120,1],[320,2],[280,3],[280,4],[50,5]],"order_weight_list":[[10000,103],[1500,203]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,25,55,20,0,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,25,55,20,0,0,0,0,0,0],"award":[[6071200,10],[830602,5],[101500,100]],"task_desc":690207}`|
|114|`{"level":14,"belonging_version":1,"up_need_exp":68000,"cake_weight_list":[[120,1],[320,2],[280,3],[280,4],[50,5]],"order_weight_list":[[10000,103],[1500,203]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,20,55,25,0,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,20,55,25,0,0,0,0,0,0],"award":[[6081200,20],[830602,5],[101500,100]],"task_desc":690207}`|
|115|`{"level":15,"belonging_version":1,"up_need_exp":83500,"cake_weight_list":[[120,1],[320,2],[280,3],[280,4],[50,5]],"order_weight_list":[[10000,103],[1500,203]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,15,60,25,0,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,15,60,25,0,0,0,0,0,0],"award":[[6071200,10],[830602,5],[101500,100]],"task_desc":690207}`|
|116|`{"level":16,"belonging_version":1,"up_need_exp":100000,"cake_weight_list":[[120,1],[320,2],[280,3],[280,4],[50,5]],"order_weight_list":[[10000,103],[1500,203]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,10,60,30,0,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,10,60,30,0,0,0,0,0,0],"award":[[6071200,20],[830602,5],[101500,100]],"task_desc":690207}`|
|117|`{"level":17,"belonging_version":1,"up_need_exp":118000,"cake_weight_list":[[110,1],[296,2],[297,3],[297,4],[50,5]],"order_weight_list":[[10000,104],[1500,204]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,63,37,0,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,63,37,0,0,0,0,0,0],"award":[[6071200,20],[830602,5],[101500,100]],"task_desc":690207}`|
|118|`{"level":18,"belonging_version":1,"up_need_exp":140000,"cake_weight_list":[[110,1],[296,2],[297,3],[297,4],[50,5]],"order_weight_list":[[10000,104],[1500,204]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,60,30,10,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,60,30,10,0,0,0,0,0],"award":[[6071200,40],[830602,5],[101500,100]],"task_desc":690207}`|
|119|`{"level":19,"belonging_version":1,"up_need_exp":165000,"cake_weight_list":[[110,1],[296,2],[297,3],[297,4],[50,5]],"order_weight_list":[[10000,104],[1500,204]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,50,35,15,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,50,35,15,0,0,0,0,0],"award":[[6071200,20],[830602,5],[101500,100]],"task_desc":690207}`|
|120|`{"level":20,"belonging_version":1,"up_need_exp":195000,"cake_weight_list":[[110,1],[296,2],[297,3],[297,4],[50,5]],"order_weight_list":[[10000,104],[1500,204]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,40,40,20,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,40,40,20,0,0,0,0,0],"award":[[6071200,40],[472002,1],[101500,100]],"task_desc":690207}`|
|121|`{"level":21,"belonging_version":1,"up_need_exp":230000,"cake_weight_list":[[110,1],[296,2],[297,3],[297,4],[50,5]],"order_weight_list":[[10000,104],[1500,204]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,30,45,25,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,30,45,25,0,0,0,0,0],"award":[[6071200,20],[830702,1],[101500,100]],"task_desc":690207}`|
|122|`{"level":22,"belonging_version":1,"up_need_exp":270000,"cake_weight_list":[[318,1],[286,2],[110,3],[286,4],[50,5]],"order_weight_list":[[10000,105],[1500,205]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,20,55,25,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,20,55,25,0,0,0,0,0],"award":[[6071200,20],[22002,1],[101500,100]],"task_desc":690207}`|
|123|`{"level":23,"belonging_version":1,"up_need_exp":320000,"cake_weight_list":[[318,1],[286,2],[110,3],[286,4],[50,5]],"order_weight_list":[[10000,105],[1500,205]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,15,60,25,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,15,60,25,0,0,0,0,0],"award":[[6071200,20],[830702,1],[101500,100]],"task_desc":690207}`|
|124|`{"level":24,"belonging_version":1,"up_need_exp":380000,"cake_weight_list":[[318,1],[286,2],[110,3],[286,4],[50,5]],"order_weight_list":[[10000,105],[1500,205]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,10,50,30,10,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,10,50,30,10,0,0,0,0],"award":[[6071200,20],[472002,1],[101500,100]],"task_desc":690207}`|
|125|`{"level":25,"belonging_version":1,"up_need_exp":450000,"cake_weight_list":[[318,1],[286,2],[110,3],[286,4],[50,5]],"order_weight_list":[[10000,105],[1500,205]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,47,37,16,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,47,37,16,0,0,0,0],"award":[[6071200,20],[830702,1],[101500,100]],"task_desc":690207}`|
|126|`{"level":26,"belonging_version":1,"up_need_exp":530000,"cake_weight_list":[[318,1],[286,2],[110,3],[286,4],[50,5]],"order_weight_list":[[10000,105],[1500,205]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[6071200,20],[22002,1],[101500,100]],"task_desc":690207}`|
|127|`{"level":27,"belonging_version":1,"up_need_exp":620000,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,106],[1500,206]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[6071200,20],[830702,1],[101500,100]],"task_desc":690207}`|
|128|`{"level":28,"belonging_version":1,"up_need_exp":720000,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,106],[1500,206]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[6071200,20],[472002,1],[101500,100]],"task_desc":690207}`|
|129|`{"level":29,"belonging_version":1,"up_need_exp":830000,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,106],[1500,206]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[6071200,20],[830702,2],[101500,100]],"task_desc":690207}`|
|130|`{"level":30,"belonging_version":1,"up_need_exp":950000,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,106],[1500,206]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[6071200,20],[22002,1],[101500,100]],"task_desc":690207}`|
|131|`{"level":31,"belonging_version":1,"up_need_exp":1080000,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,106],[1500,206]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[6071200,20],[830702,2],[101500,100]],"task_desc":690207}`|
|132|`{"level":32,"belonging_version":1,"up_need_exp":1220000,"cake_weight_list":[[297,1],[296,2],[111,3],[296,4],[50,5]],"order_weight_list":[[10000,107],[1500,207]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[6071200,20],[472002,1],[101500,100]],"task_desc":690207}`|
|133|`{"level":33,"belonging_version":1,"up_need_exp":1370000,"cake_weight_list":[[297,1],[296,2],[111,3],[296,4],[50,5]],"order_weight_list":[[10000,107],[1500,207]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[6071200,20],[830702,2],[101500,100]],"task_desc":690207}`|
|134|`{"level":34,"belonging_version":1,"up_need_exp":1530000,"cake_weight_list":[[297,1],[296,2],[111,3],[296,4],[50,5]],"order_weight_list":[[10000,107],[1500,207]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[6071200,20],[22002,1],[101500,100]],"task_desc":690207}`|
|135|`{"level":35,"belonging_version":1,"up_need_exp":1700000,"cake_weight_list":[[297,1],[296,2],[111,3],[296,4],[50,5]],"order_weight_list":[[10000,107],[1500,207]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[6071200,20],[830702,2],[101500,100]],"task_desc":690207}`|
|136|`{"level":36,"belonging_version":1,"up_need_exp":1880000,"cake_weight_list":[[297,1],[296,2],[111,3],[296,4],[50,5]],"order_weight_list":[[10000,107],[1500,207]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[6071200,20],[472002,1],[101500,100]],"task_desc":690207}`|
|137|`{"level":37,"belonging_version":1,"up_need_exp":2070000,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,108],[1500,208]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[6071200,20],[830702,2],[101500,100]],"task_desc":690207}`|
|138|`{"level":38,"belonging_version":1,"up_need_exp":2270000,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,108],[1500,208]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[6071200,20],[22002,1],[101500,100]],"task_desc":690207}`|
|139|`{"level":39,"belonging_version":1,"up_need_exp":2470000,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,108],[1500,208]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[6071200,40],[472002,1],[101500,100]],"task_desc":690207}`|
|140|`{"level":40,"belonging_version":1,"up_need_exp":2670000,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,108],[1500,208]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[6071200,40],[22002,1],[101500,100]],"task_desc":690207}`|
|141|`{"level":41,"belonging_version":1,"up_need_exp":2870000,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,108],[1500,208]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[6071200,40],[472002,1],[101500,100]],"task_desc":690207}`|
|142|`{"level":42,"belonging_version":1,"up_need_exp":3070000,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,109],[1500,209]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[6071200,40],[22002,1],[101500,100]],"task_desc":690207}`|
|143|`{"level":43,"belonging_version":1,"up_need_exp":3270000,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,109],[1500,209]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[6071200,40],[472002,1],[101500,100]],"task_desc":690207}`|
|144|`{"level":44,"belonging_version":1,"up_need_exp":3470000,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,109],[1500,209]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[6071200,40],[22002,1],[101500,100]],"task_desc":690207}`|
|145|`{"level":45,"belonging_version":1,"up_need_exp":3670000,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,109],[1500,209]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[6071200,40],[472002,1],[101500,100]],"task_desc":690207}`|
|146|`{"level":46,"belonging_version":1,"up_need_exp":3870000,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,109],[1500,209]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[6071200,40],[22002,1],[101500,100]],"task_desc":690207}`|
|147|`{"level":47,"belonging_version":1,"up_need_exp":4070000,"cake_weight_list":[[307,1],[307,2],[276,3],[110,4],[50,5]],"order_weight_list":[[10000,110],[1500,210]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[6071200,40],[472002,1],[101500,100]],"task_desc":690207}`|
|148|`{"level":48,"belonging_version":1,"up_need_exp":4270000,"cake_weight_list":[[307,1],[307,2],[276,3],[110,4],[50,5]],"order_weight_list":[[10000,110],[1500,210]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[6071200,40],[22002,1],[101500,100]],"task_desc":690207}`|
|149|`{"level":49,"belonging_version":1,"up_need_exp":4500000,"cake_weight_list":[[307,1],[307,2],[276,3],[110,4],[50,5]],"order_weight_list":[[10000,110],[1500,210]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[6071200,40],[472002,1],[101500,100]],"task_desc":690207}`|
|150|`{"level":50,"belonging_version":1,"up_need_exp":4750000,"cake_weight_list":[[307,1],[307,2],[276,3],[110,4],[50,5]],"order_weight_list":[[10000,110],[1500,210]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[6071200,40],[22002,1],[101500,100]],"task_desc":690207}`|
|151|`{"level":51,"belonging_version":1,"up_need_exp":5000000,"cake_weight_list":[[307,1],[307,2],[276,3],[110,4],[50,5]],"order_weight_list":[[10000,110],[1500,210]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[6071200,40],[472002,1],[101500,100]],"task_desc":690207}`|
|201|`{"level":1,"belonging_version":2,"up_need_exp":0,"cake_weight_list":[[100,1]],"order_weight_list":[[10000,999]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[100,0,0,0,0,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[100,0,0,0,0,0,0,0,0,0],"award":{"global":"TableEmpty"},"task_desc":690207}`|
|202|`{"level":2,"belonging_version":2,"up_need_exp":20,"cake_weight_list":[[200,1],[300,2],[200,3],[200,4],[50,5]],"order_weight_list":[[10000,2101],[1500,2201]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[100,0,0,0,0,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[100,0,0,0,0,0,0,0,0,0],"award":[[101500,100]],"task_desc":690207}`|
|203|`{"level":3,"belonging_version":2,"up_need_exp":500,"cake_weight_list":[[200,1],[300,2],[200,3],[200,4],[50,5]],"order_weight_list":[[10000,2101],[1500,2201]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[85,15,0,0,0,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[85,15,0,0,0,0,0,0,0,0],"award":[[830602,2],[101500,100]],"task_desc":690207}`|
|204|`{"level":4,"belonging_version":2,"up_need_exp":1500,"cake_weight_list":[[200,1],[300,2],[200,3],[200,4],[50,5]],"order_weight_list":[[10000,2101],[1500,2201]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[75,25,0,0,0,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[75,25,0,0,0,0,0,0,0,0],"award":[[2002,10],[830602,3],[101500,100]],"task_desc":690207}`|
|205|`{"level":5,"belonging_version":2,"up_need_exp":3000,"cake_weight_list":[[200,1],[300,2],[200,3],[200,4],[50,5]],"order_weight_list":[[10000,2101],[1500,2201]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[65,35,0,0,0,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[65,35,0,0,0,0,0,0,0,0],"award":[[22002,1],[830602,5],[101500,100]],"task_desc":690207}`|
|206|`{"level":6,"belonging_version":2,"up_need_exp":5000,"cake_weight_list":[[200,1],[300,2],[200,3],[200,4],[50,5]],"order_weight_list":[[10000,2101],[1500,2201]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[55,45,0,0,0,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[55,45,0,0,0,0,0,0,0,0],"award":[[3002,10],[830602,5],[101500,100]],"task_desc":690207}`|
|207|`{"level":7,"belonging_version":2,"up_need_exp":7500,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,2102],[1500,2202]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[25,60,15,0,0,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[25,60,15,0,0,0,0,0,0,0],"award":[[22002,1],[830602,5],[101500,100]],"task_desc":690207}`|
|208|`{"level":8,"belonging_version":2,"up_need_exp":11500,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,2102],[1500,2202]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[20,65,15,0,0,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[20,65,15,0,0,0,0,0,0,0],"award":[[4371200,5],[830602,5],[101500,100]],"task_desc":690207}`|
|209|`{"level":9,"belonging_version":2,"up_need_exp":17500,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,2102],[1500,2202]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[15,70,15,0,0,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[15,70,15,0,0,0,0,0,0,0],"award":[[3002,10],[830602,5],[101500,100]],"task_desc":690207}`|
|210|`{"level":10,"belonging_version":2,"up_need_exp":24500,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,2102],[1500,2202]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[15,65,20,0,0,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[15,65,20,0,0,0,0,0,0,0],"award":[[22002,1],[830602,5],[101500,100]],"task_desc":690207}`|
|211|`{"level":11,"belonging_version":2,"up_need_exp":32500,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,2102],[1500,2202]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[10,65,25,0,0,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[10,65,25,0,0,0,0,0,0,0],"award":[[4371200,5],[830602,5],[101500,100]],"task_desc":690207}`|
|212|`{"level":12,"belonging_version":2,"up_need_exp":41500,"cake_weight_list":[[120,1],[320,2],[280,3],[280,4],[50,5]],"order_weight_list":[[10000,2103],[1500,2203]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,29,52,19,0,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,29,52,19,0,0,0,0,0,0],"award":[[3002,10],[830602,5],[101500,100]],"task_desc":690207}`|
|213|`{"level":13,"belonging_version":2,"up_need_exp":54500,"cake_weight_list":[[120,1],[320,2],[280,3],[280,4],[50,5]],"order_weight_list":[[10000,2103],[1500,2203]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,25,55,20,0,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,25,55,20,0,0,0,0,0,0],"award":[[22002,1],[830602,5],[101500,100]],"task_desc":690207}`|
|214|`{"level":14,"belonging_version":2,"up_need_exp":68000,"cake_weight_list":[[120,1],[320,2],[280,3],[280,4],[50,5]],"order_weight_list":[[10000,2103],[1500,2203]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,20,55,25,0,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,20,55,25,0,0,0,0,0,0],"award":[[4371200,10],[830602,5],[101500,100]],"task_desc":690207}`|
|215|`{"level":15,"belonging_version":2,"up_need_exp":83500,"cake_weight_list":[[120,1],[320,2],[280,3],[280,4],[50,5]],"order_weight_list":[[10000,2103],[1500,2203]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,15,60,25,0,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,15,60,25,0,0,0,0,0,0],"award":[[4371200,10],[830602,5],[101500,100]],"task_desc":690207}`|
|216|`{"level":16,"belonging_version":2,"up_need_exp":100000,"cake_weight_list":[[120,1],[320,2],[280,3],[280,4],[50,5]],"order_weight_list":[[10000,2103],[1500,2203]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,10,60,30,0,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,10,60,30,0,0,0,0,0,0],"award":[[4371200,20],[830602,5],[101500,100]],"task_desc":690207}`|
|217|`{"level":17,"belonging_version":2,"up_need_exp":118000,"cake_weight_list":[[110,1],[296,2],[297,3],[297,4],[50,5]],"order_weight_list":[[10000,2104],[1500,2204]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,63,37,0,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,63,37,0,0,0,0,0,0],"award":[[4371200,20],[830602,5],[101500,100]],"task_desc":690207}`|
|218|`{"level":18,"belonging_version":2,"up_need_exp":140000,"cake_weight_list":[[110,1],[296,2],[297,3],[297,4],[50,5]],"order_weight_list":[[10000,2104],[1500,2204]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,60,30,10,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,60,30,10,0,0,0,0,0],"award":[[4371200,20],[830602,5],[101500,100]],"task_desc":690207}`|
|219|`{"level":19,"belonging_version":2,"up_need_exp":165000,"cake_weight_list":[[110,1],[296,2],[297,3],[297,4],[50,5]],"order_weight_list":[[10000,2104],[1500,2204]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,50,35,15,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,50,35,15,0,0,0,0,0],"award":[[4371200,40],[830602,5],[101500,100]],"task_desc":690207}`|
|220|`{"level":20,"belonging_version":2,"up_need_exp":195000,"cake_weight_list":[[110,1],[296,2],[297,3],[297,4],[50,5]],"order_weight_list":[[10000,2104],[1500,2204]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,40,40,20,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,40,40,20,0,0,0,0,0],"award":[[4371200,40],[22002,1],[101500,100]],"task_desc":690207}`|
|221|`{"level":21,"belonging_version":2,"up_need_exp":230000,"cake_weight_list":[[110,1],[296,2],[297,3],[297,4],[50,5]],"order_weight_list":[[10000,2104],[1500,2204]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,30,45,25,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,30,45,25,0,0,0,0,0],"award":[[4371200,40],[830702,1],[101500,100]],"task_desc":690207}`|
|222|`{"level":22,"belonging_version":2,"up_need_exp":270000,"cake_weight_list":[[318,1],[286,2],[110,3],[286,4],[50,5]],"order_weight_list":[[10000,2105],[1500,2205]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,20,55,25,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,20,55,25,0,0,0,0,0],"award":[[4371200,40],[22002,1],[101500,100]],"task_desc":690207}`|
|223|`{"level":23,"belonging_version":2,"up_need_exp":320000,"cake_weight_list":[[318,1],[286,2],[110,3],[286,4],[50,5]],"order_weight_list":[[10000,2105],[1500,2205]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,15,60,25,0,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,15,60,25,0,0,0,0,0],"award":[[4371200,40],[830702,1],[101500,100]],"task_desc":690207}`|
|224|`{"level":24,"belonging_version":2,"up_need_exp":380000,"cake_weight_list":[[318,1],[286,2],[110,3],[286,4],[50,5]],"order_weight_list":[[10000,2105],[1500,2205]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,10,50,30,10,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,10,50,30,10,0,0,0,0],"award":[[4371200,40],[22002,1],[101500,100]],"task_desc":690207}`|
|225|`{"level":25,"belonging_version":2,"up_need_exp":450000,"cake_weight_list":[[318,1],[286,2],[110,3],[286,4],[50,5]],"order_weight_list":[[10000,2105],[1500,2205]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,47,37,16,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,47,37,16,0,0,0,0],"award":[[4371200,40],[830702,1],[101500,100]],"task_desc":690207}`|
|226|`{"level":26,"belonging_version":2,"up_need_exp":530000,"cake_weight_list":[[318,1],[286,2],[110,3],[286,4],[50,5]],"order_weight_list":[[10000,2105],[1500,2205]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[4371200,40],[22002,1],[101500,100]],"task_desc":690207}`|
|227|`{"level":27,"belonging_version":2,"up_need_exp":620000,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,2106],[1500,2206]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[4371200,40],[830702,1],[101500,100]],"task_desc":690207}`|
|228|`{"level":28,"belonging_version":2,"up_need_exp":720000,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,2106],[1500,2206]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[4371200,40],[22002,1],[101500,100]],"task_desc":690207}`|
|229|`{"level":29,"belonging_version":2,"up_need_exp":830000,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,2106],[1500,2206]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[4371200,40],[830702,2],[101500,100]],"task_desc":690207}`|
|230|`{"level":30,"belonging_version":2,"up_need_exp":950000,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,2106],[1500,2206]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[4371200,40],[22002,1],[101500,100]],"task_desc":690207}`|
|231|`{"level":31,"belonging_version":2,"up_need_exp":1080000,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,2106],[1500,2206]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[4371200,40],[830702,2],[101500,100]],"task_desc":690207}`|
|232|`{"level":32,"belonging_version":2,"up_need_exp":1220000,"cake_weight_list":[[297,1],[296,2],[111,3],[296,4],[50,5]],"order_weight_list":[[10000,2107],[1500,2207]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[4371200,40],[22002,1],[101500,100]],"task_desc":690207}`|
|233|`{"level":33,"belonging_version":2,"up_need_exp":1370000,"cake_weight_list":[[297,1],[296,2],[111,3],[296,4],[50,5]],"order_weight_list":[[10000,2107],[1500,2207]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[4371200,40],[830702,2],[101500,100]],"task_desc":690207}`|
|234|`{"level":34,"belonging_version":2,"up_need_exp":1530000,"cake_weight_list":[[297,1],[296,2],[111,3],[296,4],[50,5]],"order_weight_list":[[10000,2107],[1500,2207]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[4371200,40],[22002,1],[101500,100]],"task_desc":690207}`|
|235|`{"level":35,"belonging_version":2,"up_need_exp":1700000,"cake_weight_list":[[297,1],[296,2],[111,3],[296,4],[50,5]],"order_weight_list":[[10000,2107],[1500,2207]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[4371200,40],[830702,2],[101500,100]],"task_desc":690207}`|
|236|`{"level":36,"belonging_version":2,"up_need_exp":1880000,"cake_weight_list":[[297,1],[296,2],[111,3],[296,4],[50,5]],"order_weight_list":[[10000,2107],[1500,2207]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[4371200,40],[22002,1],[101500,100]],"task_desc":690207}`|
|237|`{"level":37,"belonging_version":2,"up_need_exp":2070000,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,2108],[1500,2208]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[4371200,40],[830702,2],[101500,100]],"task_desc":690207}`|
|238|`{"level":38,"belonging_version":2,"up_need_exp":2270000,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,2108],[1500,2208]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[4371200,40],[22002,1],[101500,100]],"task_desc":690207}`|
|239|`{"level":39,"belonging_version":2,"up_need_exp":2470000,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,2108],[1500,2208]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[4371200,40],[22002,1],[101500,100]],"task_desc":690207}`|
|240|`{"level":40,"belonging_version":2,"up_need_exp":2670000,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,2108],[1500,2208]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[4371200,40],[22002,1],[101500,100]],"task_desc":690207}`|
|241|`{"level":41,"belonging_version":2,"up_need_exp":2870000,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,2108],[1500,2208]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[4371200,40],[22002,1],[101500,100]],"task_desc":690207}`|
|242|`{"level":42,"belonging_version":2,"up_need_exp":3070000,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,2109],[1500,2209]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[4371200,40],[22002,1],[101500,100]],"task_desc":690207}`|
|243|`{"level":43,"belonging_version":2,"up_need_exp":3270000,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,2109],[1500,2209]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[4371200,40],[22002,1],[101500,100]],"task_desc":690207}`|
|244|`{"level":44,"belonging_version":2,"up_need_exp":3470000,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,2109],[1500,2209]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[4371200,40],[22002,1],[101500,100]],"task_desc":690207}`|
|245|`{"level":45,"belonging_version":2,"up_need_exp":3670000,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,2109],[1500,2209]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[4371200,40],[22002,1],[101500,100]],"task_desc":690207}`|
|246|`{"level":46,"belonging_version":2,"up_need_exp":3870000,"cake_weight_list":[[300,1],[150,2],[300,3],[150,4],[50,5]],"order_weight_list":[[10000,2109],[1500,2209]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[4371200,40],[22002,1],[101500,100]],"task_desc":690207}`|
|247|`{"level":47,"belonging_version":2,"up_need_exp":4070000,"cake_weight_list":[[307,1],[307,2],[276,3],[110,4],[50,5]],"order_weight_list":[[10000,2110],[1500,2210]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[4371200,40],[22002,1],[101500,100]],"task_desc":690207}`|
|248|`{"level":48,"belonging_version":2,"up_need_exp":4270000,"cake_weight_list":[[307,1],[307,2],[276,3],[110,4],[50,5]],"order_weight_list":[[10000,2110],[1500,2210]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[4371200,40],[22002,1],[101500,100]],"task_desc":690207}`|
|249|`{"level":49,"belonging_version":2,"up_need_exp":4500000,"cake_weight_list":[[307,1],[307,2],[276,3],[110,4],[50,5]],"order_weight_list":[[10000,2110],[1500,2210]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[4371200,40],[22002,1],[101500,100]],"task_desc":690207}`|
|250|`{"level":50,"belonging_version":2,"up_need_exp":4750000,"cake_weight_list":[[307,1],[307,2],[276,3],[110,4],[50,5]],"order_weight_list":[[10000,2110],[1500,2210]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[4371200,40],[22002,1],[101500,100]],"task_desc":690207}`|
|251|`{"level":51,"belonging_version":2,"up_need_exp":5000000,"cake_weight_list":[[307,1],[307,2],[276,3],[110,4],[50,5]],"order_weight_list":[[10000,2110],[1500,2210]],"cake_lv_list":[1,2,3,4,5,6,7,8,9,10],"cake_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"yeast_lv_list":[1,2,3,4,5,6,7,8,9,10],"yeast_lv_weight_list":[0,0,0,40,35,25,0,0,0,0],"award":[[4371200,40],[22002,1],[101500,100]],"task_desc":690207}`|

## RankAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|16|本表行键；与其他表同值不自动代表同一对象。|
|belonging_version|number|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rank_range|array|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|16|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"belonging_version":1,"rank_range":[1,1],"award":[[391002,5000],[392002,200],[101500,5000],[4391200,8],[25500704,80],[4381200,5],[1019002,3]]}`|
|102|`{"belonging_version":1,"rank_range":[2,2],"award":[[391002,3000],[392002,120],[101500,3000],[4391200,6],[25500704,40],[4381200,3],[1019002,2]]}`|
|103|`{"belonging_version":1,"rank_range":[3,3],"award":[[391002,2000],[392002,80],[101500,2000],[4391200,4],[25500704,20],[4381200,2],[1019002,1]]}`|
|104|`{"belonging_version":1,"rank_range":[4,5],"award":[[391002,1500],[392002,50],[101500,1500],[4391200,3],[25500704,10],[4381200,1]]}`|
|105|`{"belonging_version":1,"rank_range":[6,10],"award":[[391002,1000],[392002,30],[101500,1000],[4391200,2],[25500704,5]]}`|
|106|`{"belonging_version":1,"rank_range":[11,20],"award":[[391002,800],[392002,20],[101500,800],[4391200,1]]}`|
|107|`{"belonging_version":1,"rank_range":[21,50],"award":[[391002,600],[392002,15],[101500,600]]}`|
|108|`{"belonging_version":1,"rank_range":[51,200],"award":[[391002,500],[392002,10],[101500,500]]}`|
|201|`{"belonging_version":2,"rank_range":[1,1],"award":[[391002,5000],[392002,200],[101500,5000],[22002,8],[4381200,5],[1013002,3]]}`|
|202|`{"belonging_version":2,"rank_range":[2,2],"award":[[391002,3000],[392002,120],[101500,3000],[22002,6],[4381200,3],[1013002,2]]}`|
|203|`{"belonging_version":2,"rank_range":[3,3],"award":[[391002,2000],[392002,80],[101500,2000],[22002,4],[4381200,2],[1013002,1]]}`|
|204|`{"belonging_version":2,"rank_range":[4,5],"award":[[391002,1500],[392002,50],[101500,1500],[22002,3],[4381200,1]]}`|
|205|`{"belonging_version":2,"rank_range":[6,10],"award":[[391002,1000],[392002,30],[101500,1000],[22002,2]]}`|
|206|`{"belonging_version":2,"rank_range":[11,20],"award":[[391002,800],[392002,20],[101500,800],[22002,1]]}`|
|207|`{"belonging_version":2,"rank_range":[21,50],"award":[[391002,600],[392002,15],[101500,600]]}`|
|208|`{"belonging_version":2,"rank_range":[51,200],"award":[[391002,500],[392002,10],[101500,500]]}`|

## Order

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|241|本表行键；与其他表同值不自动代表同一对象。|
|group|number|241|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|weight|number|241|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|
|expire_time|number|241|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|icon|string|241|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cake_list|array|241|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|_cake_type|null|241|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|_cake_lv|null|241|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|_cake_num|null|241|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|_cake_add_weight|null|241|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|
|add_score|number|241|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|trigger_event_item|object/array|241|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|trigger_event_item_weight|object/array|241|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|
|trigger_event_item_rate|number|241|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|trigger_event_item_reward_lbrary|number|241|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award|object/array|241|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10001|`{"group":101,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":80,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10002|`{"group":101,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":40,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10003|`{"group":101,"weight":1500,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":80,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10004|`{"group":101,"weight":1500,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":80,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10005|`{"group":101,"weight":1500,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":40,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10006|`{"group":101,"weight":1500,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":40,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10007|`{"group":101,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":80,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10008|`{"group":101,"weight":1500,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":40,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10009|`{"group":101,"weight":1500,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":60,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10010|`{"group":101,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":40,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10011|`{"group":102,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":40,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10012|`{"group":102,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":160,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10013|`{"group":102,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":240,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10014|`{"group":102,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":320,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10015|`{"group":102,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":400,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10016|`{"group":102,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":240,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10017|`{"group":102,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":240,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10018|`{"group":102,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":240,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10019|`{"group":102,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":320,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10020|`{"group":102,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":200,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10021|`{"group":103,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":240,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10022|`{"group":103,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":720,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10023|`{"group":103,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":400,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10024|`{"group":103,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":320,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10025|`{"group":103,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":720,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10026|`{"group":103,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":720,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10027|`{"group":103,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":720,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10028|`{"group":103,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":960,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10029|`{"group":103,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":480,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10030|`{"group":103,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":640,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10031|`{"group":104,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":480,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10032|`{"group":104,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":800,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10033|`{"group":104,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":960,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10034|`{"group":104,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":960,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10035|`{"group":104,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":1120,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10036|`{"group":104,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":1120,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10037|`{"group":104,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":1280,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10038|`{"group":104,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":800,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10039|`{"group":104,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":1120,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10040|`{"group":104,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":960,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10041|`{"group":105,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":1280,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10042|`{"group":105,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":960,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10043|`{"group":105,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":640,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10044|`{"group":105,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":800,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10045|`{"group":105,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2240,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10046|`{"group":105,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":1280,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10047|`{"group":105,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2240,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10048|`{"group":105,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2240,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10049|`{"group":105,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2240,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10050|`{"group":105,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":1920,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10051|`{"group":106,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2560,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10052|`{"group":106,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2560,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10053|`{"group":106,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":1920,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10054|`{"group":106,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2240,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10055|`{"group":106,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":3840,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10056|`{"group":106,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2880,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10057|`{"group":106,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2880,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10058|`{"group":106,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2560,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10059|`{"group":106,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":3200,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10060|`{"group":106,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":3840,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10061|`{"group":107,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":3520,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10062|`{"group":107,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2240,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10063|`{"group":107,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2880,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10064|`{"group":107,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2560,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10065|`{"group":107,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":1920,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10066|`{"group":107,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":4480,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10067|`{"group":107,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":3840,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10068|`{"group":107,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":3520,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10069|`{"group":107,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2560,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10070|`{"group":107,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":960,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10071|`{"group":108,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":1920,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10072|`{"group":108,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2560,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10073|`{"group":108,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2560,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10074|`{"group":108,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":3840,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10075|`{"group":108,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":5760,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10076|`{"group":108,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":5120,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10077|`{"group":108,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":3200,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10078|`{"group":108,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":3200,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10079|`{"group":108,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2560,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10080|`{"group":108,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":1600,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10081|`{"group":109,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":1920,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10082|`{"group":109,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":4480,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10083|`{"group":109,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":4480,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10084|`{"group":109,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":3200,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10085|`{"group":109,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2560,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10086|`{"group":109,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":960,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10087|`{"group":109,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":4480,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10088|`{"group":109,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2560,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10089|`{"group":109,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":5760,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10090|`{"group":109,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":3200,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10091|`{"group":110,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":3200,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10092|`{"group":110,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2560,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10093|`{"group":110,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":1920,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10094|`{"group":110,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":3840,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10095|`{"group":110,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":5120,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10096|`{"group":110,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":3200,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10097|`{"group":110,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2560,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10098|`{"group":110,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":3200,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10099|`{"group":110,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":3840,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|10100|`{"group":110,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":3840,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|20001|`{"group":201,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":160,"trigger_event_item":[8],"trigger_event_item_weight":[1],"trigger_event_item_rate":2000,"trigger_event_item_reward_lbrary":1,"award":[[837202,1]]}`|
|20002|`{"group":201,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":140,"trigger_event_item":[8],"trigger_event_item_weight":[1],"trigger_event_item_rate":2000,"trigger_event_item_reward_lbrary":1,"award":[[837202,1]]}`|
|20003|`{"group":202,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":480,"trigger_event_item":[8],"trigger_event_item_weight":[1],"trigger_event_item_rate":4000,"trigger_event_item_reward_lbrary":2,"award":[[837202,2]]}`|
|20004|`{"group":202,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":560,"trigger_event_item":[8],"trigger_event_item_weight":[1],"trigger_event_item_rate":4000,"trigger_event_item_reward_lbrary":2,"award":[[837202,2]]}`|
|20005|`{"group":203,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":800,"trigger_event_item":[8],"trigger_event_item_weight":[1],"trigger_event_item_rate":10000,"trigger_event_item_reward_lbrary":3,"award":[[837202,2]]}`|
|20006|`{"group":203,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":640,"trigger_event_item":[8],"trigger_event_item_weight":[1],"trigger_event_item_rate":10000,"trigger_event_item_reward_lbrary":3,"award":[[837202,2]]}`|
|20007|`{"group":204,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":1280,"trigger_event_item":[8],"trigger_event_item_weight":[1],"trigger_event_item_rate":10000,"trigger_event_item_reward_lbrary":4,"award":[[837202,2]]}`|
|20008|`{"group":204,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":1280,"trigger_event_item":[8],"trigger_event_item_weight":[1],"trigger_event_item_rate":10000,"trigger_event_item_reward_lbrary":4,"award":[[837202,2]]}`|
|20009|`{"group":205,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2560,"trigger_event_item":[8],"trigger_event_item_weight":[1],"trigger_event_item_rate":10000,"trigger_event_item_reward_lbrary":4,"award":[[837202,5]]}`|
|20010|`{"group":205,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2560,"trigger_event_item":[8],"trigger_event_item_weight":[1],"trigger_event_item_rate":10000,"trigger_event_item_reward_lbrary":4,"award":[[837202,5]]}`|
|20011|`{"group":206,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":4480,"trigger_event_item":[8],"trigger_event_item_weight":[1],"trigger_event_item_rate":10000,"trigger_event_item_reward_lbrary":4,"award":[[837202,5]]}`|
|20012|`{"group":206,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":3520,"trigger_event_item":[8],"trigger_event_item_weight":[1],"trigger_event_item_rate":10000,"trigger_event_item_reward_lbrary":4,"award":[[837202,5]]}`|
|20013|`{"group":207,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":5120,"trigger_event_item":[8],"trigger_event_item_weight":[1],"trigger_event_item_rate":10000,"trigger_event_item_reward_lbrary":4,"award":[[837202,5]]}`|
|20014|`{"group":207,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":4480,"trigger_event_item":[8],"trigger_event_item_weight":[1],"trigger_event_item_rate":10000,"trigger_event_item_reward_lbrary":4,"award":[[837202,5]]}`|
|20015|`{"group":208,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":5120,"trigger_event_item":[8],"trigger_event_item_weight":[1],"trigger_event_item_rate":10000,"trigger_event_item_reward_lbrary":4,"award":[[837202,5]]}`|
|20016|`{"group":208,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":4160,"trigger_event_item":[8],"trigger_event_item_weight":[1],"trigger_event_item_rate":10000,"trigger_event_item_reward_lbrary":4,"award":[[837202,5]]}`|
|20017|`{"group":209,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":4480,"trigger_event_item":[8],"trigger_event_item_weight":[1],"trigger_event_item_rate":10000,"trigger_event_item_reward_lbrary":4,"award":[[837202,10]]}`|
|20018|`{"group":209,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2560,"trigger_event_item":[8],"trigger_event_item_weight":[1],"trigger_event_item_rate":10000,"trigger_event_item_reward_lbrary":4,"award":[[837202,10]]}`|
|20019|`{"group":210,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":4480,"trigger_event_item":[8],"trigger_event_item_weight":[1],"trigger_event_item_rate":10000,"trigger_event_item_reward_lbrary":4,"award":[[837202,10]]}`|
|20020|`{"group":210,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":4480,"trigger_event_item":[8],"trigger_event_item_weight":[1],"trigger_event_item_rate":10000,"trigger_event_item_reward_lbrary":4,"award":[[837202,10]]}`|
|99999|`{"group":999,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":20,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210001|`{"group":2101,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":80,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210002|`{"group":2101,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":40,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210003|`{"group":2101,"weight":1500,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":80,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210004|`{"group":2101,"weight":1500,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":80,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210005|`{"group":2101,"weight":1500,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":40,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210006|`{"group":2101,"weight":1500,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":40,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210007|`{"group":2101,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":80,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210008|`{"group":2101,"weight":1500,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":40,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210009|`{"group":2101,"weight":1500,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":60,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210010|`{"group":2101,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":40,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210011|`{"group":2102,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":40,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210012|`{"group":2102,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":160,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210013|`{"group":2102,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":240,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210014|`{"group":2102,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":320,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210015|`{"group":2102,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":400,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210016|`{"group":2102,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":240,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210017|`{"group":2102,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":240,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210018|`{"group":2102,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":240,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210019|`{"group":2102,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":320,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210020|`{"group":2102,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":200,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210021|`{"group":2103,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":240,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210022|`{"group":2103,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":720,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210023|`{"group":2103,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":400,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210024|`{"group":2103,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":320,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210025|`{"group":2103,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":720,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210026|`{"group":2103,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":720,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210027|`{"group":2103,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":720,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210028|`{"group":2103,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":960,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210029|`{"group":2103,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":480,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210030|`{"group":2103,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":640,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210031|`{"group":2104,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":480,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210032|`{"group":2104,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":800,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210033|`{"group":2104,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":960,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210034|`{"group":2104,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":960,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210035|`{"group":2104,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":1120,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210036|`{"group":2104,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":1120,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210037|`{"group":2104,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":1280,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210038|`{"group":2104,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":800,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210039|`{"group":2104,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":1120,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210040|`{"group":2104,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":960,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210041|`{"group":2105,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":1280,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210042|`{"group":2105,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":960,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210043|`{"group":2105,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":640,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210044|`{"group":2105,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":800,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210045|`{"group":2105,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2240,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210046|`{"group":2105,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":1280,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210047|`{"group":2105,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2240,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210048|`{"group":2105,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2240,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210049|`{"group":2105,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2240,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210050|`{"group":2105,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":1920,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210051|`{"group":2106,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2560,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210052|`{"group":2106,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2560,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210053|`{"group":2106,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":1920,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210054|`{"group":2106,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2240,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210055|`{"group":2106,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":3840,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210056|`{"group":2106,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2880,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210057|`{"group":2106,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2880,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210058|`{"group":2106,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2560,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210059|`{"group":2106,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":3200,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210060|`{"group":2106,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":3840,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210061|`{"group":2107,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":3520,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210062|`{"group":2107,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2240,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210063|`{"group":2107,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2880,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210064|`{"group":2107,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2560,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210065|`{"group":2107,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":1920,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210066|`{"group":2107,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":4480,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210067|`{"group":2107,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":3840,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210068|`{"group":2107,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":3520,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210069|`{"group":2107,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2560,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210070|`{"group":2107,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":960,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210071|`{"group":2108,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":1920,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210072|`{"group":2108,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2560,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210073|`{"group":2108,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2560,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210074|`{"group":2108,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":3840,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210075|`{"group":2108,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":5760,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210076|`{"group":2108,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":5120,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210077|`{"group":2108,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":3200,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210078|`{"group":2108,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":3200,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210079|`{"group":2108,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2560,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210080|`{"group":2108,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":1600,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210081|`{"group":2109,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":1920,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210082|`{"group":2109,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":4480,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210083|`{"group":2109,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":4480,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210084|`{"group":2109,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":3200,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210085|`{"group":2109,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2560,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210086|`{"group":2109,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":960,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210087|`{"group":2109,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":4480,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210088|`{"group":2109,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2560,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210089|`{"group":2109,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":5760,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210090|`{"group":2109,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":3200,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210091|`{"group":2110,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":3200,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210092|`{"group":2110,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2560,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210093|`{"group":2110,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":1920,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210094|`{"group":2110,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":3840,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210095|`{"group":2110,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":5120,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210096|`{"group":2110,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":3200,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210097|`{"group":2110,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2560,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210098|`{"group":2110,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":3200,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210099|`{"group":2110,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":3840,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|210100|`{"group":2110,"weight":1000,"expire_time":0,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":3840,"trigger_event_item":{"global":"TableEmpty"},"trigger_event_item_weight":{"global":"TableEmpty"},"trigger_event_item_rate":0,"trigger_event_item_reward_lbrary":0,"award":{"global":"TableEmpty"}}`|
|220001|`{"group":2201,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":160,"trigger_event_item":[7],"trigger_event_item_weight":[1],"trigger_event_item_rate":2000,"trigger_event_item_reward_lbrary":5,"award":[[837202,1]]}`|
|220002|`{"group":2201,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":140,"trigger_event_item":[7],"trigger_event_item_weight":[1],"trigger_event_item_rate":2000,"trigger_event_item_reward_lbrary":5,"award":[[837202,1]]}`|
|220003|`{"group":2202,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":480,"trigger_event_item":[7],"trigger_event_item_weight":[1],"trigger_event_item_rate":2000,"trigger_event_item_reward_lbrary":5,"award":[[837202,2]]}`|
|220004|`{"group":2202,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":560,"trigger_event_item":[7],"trigger_event_item_weight":[1],"trigger_event_item_rate":2000,"trigger_event_item_reward_lbrary":5,"award":[[837202,2]]}`|
|220005|`{"group":2203,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":800,"trigger_event_item":[7],"trigger_event_item_weight":[1],"trigger_event_item_rate":4000,"trigger_event_item_reward_lbrary":5,"award":[[837202,2]]}`|
|220006|`{"group":2203,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":640,"trigger_event_item":[7],"trigger_event_item_weight":[1],"trigger_event_item_rate":4000,"trigger_event_item_reward_lbrary":5,"award":[[837202,2]]}`|
|220007|`{"group":2204,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":1280,"trigger_event_item":[7],"trigger_event_item_weight":[1],"trigger_event_item_rate":4000,"trigger_event_item_reward_lbrary":5,"award":[[837202,2]]}`|
|220008|`{"group":2204,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":1280,"trigger_event_item":[7],"trigger_event_item_weight":[1],"trigger_event_item_rate":4000,"trigger_event_item_reward_lbrary":5,"award":[[837202,2]]}`|
|220009|`{"group":2205,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2560,"trigger_event_item":[7],"trigger_event_item_weight":[1],"trigger_event_item_rate":6000,"trigger_event_item_reward_lbrary":5,"award":[[837202,5]]}`|
|220010|`{"group":2205,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2560,"trigger_event_item":[7],"trigger_event_item_weight":[1],"trigger_event_item_rate":6000,"trigger_event_item_reward_lbrary":5,"award":[[837202,5]]}`|
|220011|`{"group":2206,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":4480,"trigger_event_item":[7],"trigger_event_item_weight":[1],"trigger_event_item_rate":6000,"trigger_event_item_reward_lbrary":5,"award":[[837202,5]]}`|
|220012|`{"group":2206,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":3520,"trigger_event_item":[7],"trigger_event_item_weight":[1],"trigger_event_item_rate":6000,"trigger_event_item_reward_lbrary":5,"award":[[837202,5]]}`|
|220013|`{"group":2207,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":5120,"trigger_event_item":[7],"trigger_event_item_weight":[1],"trigger_event_item_rate":10000,"trigger_event_item_reward_lbrary":5,"award":[[837202,5]]}`|
|220014|`{"group":2207,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":4480,"trigger_event_item":[7],"trigger_event_item_weight":[1],"trigger_event_item_rate":10000,"trigger_event_item_reward_lbrary":5,"award":[[837202,5]]}`|
|220015|`{"group":2208,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":5120,"trigger_event_item":[7],"trigger_event_item_weight":[1],"trigger_event_item_rate":10000,"trigger_event_item_reward_lbrary":5,"award":[[837202,5]]}`|
|220016|`{"group":2208,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":4160,"trigger_event_item":[7],"trigger_event_item_weight":[1],"trigger_event_item_rate":10000,"trigger_event_item_reward_lbrary":5,"award":[[837202,5]]}`|
|220017|`{"group":2209,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":4480,"trigger_event_item":[7],"trigger_event_item_weight":[1],"trigger_event_item_rate":10000,"trigger_event_item_reward_lbrary":5,"award":[[837202,10]]}`|
|220018|`{"group":2209,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":2560,"trigger_event_item":[7],"trigger_event_item_weight":[1],"trigger_event_item_rate":10000,"trigger_event_item_reward_lbrary":5,"award":[[837202,10]]}`|
|220019|`{"group":2210,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":4480,"trigger_event_item":[7],"trigger_event_item_weight":[1],"trigger_event_item_rate":10000,"trigger_event_item_reward_lbrary":5,"award":[[837202,10]]}`|
|220020|`{"group":2210,"weight":1000,"expire_time":900,"_cake_type":null,"_cake_lv":null,"_cake_num":null,"_cake_add_weight":null,"add_score":4480,"trigger_event_item":[7],"trigger_event_item_weight":[1],"trigger_event_item_rate":10000,"trigger_event_item_reward_lbrary":5,"award":[[837202,10]]}`|

## ItemType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|

## ItemShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|lv|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bg_res|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"lv":1}`|
|2|`{"lv":2}`|
|3|`{"lv":4}`|
|4|`{"lv":6}`|
|5|`{"lv":8}`|
