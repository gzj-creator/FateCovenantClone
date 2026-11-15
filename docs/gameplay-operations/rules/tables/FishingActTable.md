# FishingActTable 规则参数

来源：[personal-server/assets/tables/FishingActTable.data.lua.json.gz](../../../../personal-server/assets/tables/FishingActTable.data.lua.json.gz)，SHA256：`7ca1353b85044174870c7c23a576f8ceee1929426211768e54028b7247e63e0b`。

[完整逐行JSON](FishingActTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[QteGame](#qtegame)|6|decoded-rows|
|[Quality](#quality)|5|decoded-rows|
|[IsWeather](#isweather)|4|decoded-rows|
|[IslandWeight](#islandweight)|5|decoded-rows|
|[Island](#island)|35|decoded-rows|
|[IslandFish](#islandfish)|518|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[Version](#version)|11|decoded-rows|
|[HighScoreRank](#highscorerank)|40|decoded-rows|
|[ScoreRank](#scorerank)|40|decoded-rows|
|[Level](#level)|371|decoded-rows|
|[Buy](#buy)|2|decoded-rows|
|[Progress](#progress)|55|decoded-rows|
|[Rod](#rod)|4|decoded-rows|
|[Fish](#fish)|40|decoded-rows|

## QteGame

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|speed|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|progress_interval|array|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"speed":1.8,"progress_interval":[[50,70]]}`|
|2|`{"speed":1.8,"progress_interval":[[40,60]]}`|
|3|`{"speed":1.8,"progress_interval":[[70,90]]}`|
|4|`{"speed":1.2,"progress_interval":[[80,95]]}`|
|5|`{"speed":1.2,"progress_interval":[[70,85]]}`|
|6|`{"speed":1.2,"progress_interval":[[30,45]]}`|

## Quality

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|quality_tag_di|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|effect|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|text_tid|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|quality_di|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|effect_bg|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|30|`{"quality_tag_di":"bq_sqdy_zsjm_putong.png","quality_di":"dk_sqdy_yhtj_pz_lanse.png"}`|
|40|`{"quality_tag_di":"bq_sqdy_zsjm_xiyou.png","quality_di":"dk_sqdy_yhtj_pz_zise.png"}`|
|50|`{"quality_tag_di":"bq_sqdy_zsjm_chuanshuo.png","quality_di":"dk_sqdy_yhtj_pz_chengse.png"}`|
|60|`{"quality_tag_di":"bq_sqdy_zsjm_tianji.png","quality_di":"dk_sqdy_yhtj_pz_tianji.png"}`|
|70|`{"quality_tag_di":"bq_sqdy_zsjm_chaofan.png","quality_di":"dk_sqdy_yhtj_pz_chaofan.png"}`|

## IsWeather

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|short_desc|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|effect|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|num|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|desc|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|score_bonus|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|icon|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|circle_icon|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"num":5,"score_bonus":0}`|
|2|`{"num":5,"score_bonus":0}`|
|3|`{"num":5,"score_bonus":5000}`|
|4|`{"num":0,"score_bonus":0}`|

## IslandWeight

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|quality_type|array|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|generation_weight|array|5|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"quality_type":[30,40,50,60,70],"generation_weight":[80,20,0,0,0]}`|
|2|`{"quality_type":[30,40,50,60,70],"generation_weight":[0,85,15,0,0]}`|
|3|`{"quality_type":[30,40,50,60,70],"generation_weight":[0,0,85,15,0]}`|
|4|`{"quality_type":[30,40,50,60,70],"generation_weight":[0,0,0,90,10]}`|
|5|`{"quality_type":[30,40,50,60,70],"generation_weight":[0,0,0,0,100]}`|

## Island

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|belonging_version|number|35|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cost_num|number|35|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|weather_weight|array|35|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|
|island_name|number|35|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|35|本表行键；与其他表同值不自动代表同一对象。|
|quality_weight|number|35|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|
|unlock_level_condition|number|35|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|island_icon|string|35|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|island_bg|string|35|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|unlock_reward|array|35|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"belonging_version":1,"cost_num":1,"weather_weight":[[1,10],[2,5],[3,5]],"quality_weight":1,"unlock_level_condition":0,"unlock_reward":[[830902,500],[101500,500]]}`|
|2|`{"belonging_version":1,"cost_num":1,"weather_weight":[[1,5],[2,5],[3,10]],"quality_weight":2,"unlock_level_condition":2,"unlock_reward":[[830602,10],[101500,500]]}`|
|3|`{"belonging_version":1,"cost_num":1,"weather_weight":[[1,5],[2,10],[3,5]],"quality_weight":3,"unlock_level_condition":3,"unlock_reward":[[830702,3],[101500,1000]]}`|
|4|`{"belonging_version":1,"cost_num":1,"weather_weight":[[1,10],[2,5],[3,5]],"quality_weight":4,"unlock_level_condition":5,"unlock_reward":[[25500604,40],[101500,1000]]}`|
|5|`{"belonging_version":1,"cost_num":1,"weather_weight":[[1,5],[2,5],[3,10]],"quality_weight":5,"unlock_level_condition":7,"unlock_reward":[[25500604,40],[101500,3000]]}`|
|201|`{"belonging_version":2,"cost_num":1,"weather_weight":[[1,10],[2,5],[3,5]],"quality_weight":1,"unlock_level_condition":0,"unlock_reward":[[830902,500],[101500,500]]}`|
|202|`{"belonging_version":2,"cost_num":1,"weather_weight":[[1,5],[2,5],[3,10]],"quality_weight":2,"unlock_level_condition":2,"unlock_reward":[[830602,10],[101500,500]]}`|
|203|`{"belonging_version":2,"cost_num":1,"weather_weight":[[1,5],[2,10],[3,5]],"quality_weight":3,"unlock_level_condition":3,"unlock_reward":[[830702,3],[101500,1000]]}`|
|204|`{"belonging_version":2,"cost_num":1,"weather_weight":[[1,10],[2,5],[3,5]],"quality_weight":4,"unlock_level_condition":5,"unlock_reward":[[4040301,1],[101500,1000]]}`|
|205|`{"belonging_version":2,"cost_num":1,"weather_weight":[[1,5],[2,5],[3,10]],"quality_weight":5,"unlock_level_condition":7,"unlock_reward":[[4040301,1],[101500,3000]]}`|
|301|`{"belonging_version":3,"cost_num":1,"weather_weight":[[1,10],[2,5],[3,5]],"quality_weight":1,"unlock_level_condition":0,"unlock_reward":[[830902,500],[101500,500]]}`|
|302|`{"belonging_version":3,"cost_num":1,"weather_weight":[[1,5],[2,5],[3,10]],"quality_weight":2,"unlock_level_condition":2,"unlock_reward":[[830602,10],[101500,500]]}`|
|303|`{"belonging_version":3,"cost_num":1,"weather_weight":[[1,5],[2,10],[3,5]],"quality_weight":3,"unlock_level_condition":3,"unlock_reward":[[830702,3],[101500,1000]]}`|
|304|`{"belonging_version":3,"cost_num":1,"weather_weight":[[1,10],[2,5],[3,5]],"quality_weight":4,"unlock_level_condition":5,"unlock_reward":[[1040201,1],[101500,1000]]}`|
|305|`{"belonging_version":3,"cost_num":1,"weather_weight":[[1,5],[2,5],[3,10]],"quality_weight":5,"unlock_level_condition":7,"unlock_reward":[[1040201,1],[101500,3000]]}`|
|401|`{"belonging_version":4,"cost_num":1,"weather_weight":[[1,10],[2,5],[3,5]],"quality_weight":1,"unlock_level_condition":0,"unlock_reward":[[830902,500],[101500,500]]}`|
|402|`{"belonging_version":4,"cost_num":1,"weather_weight":[[1,5],[2,5],[3,10]],"quality_weight":2,"unlock_level_condition":2,"unlock_reward":[[830602,10],[101500,500]]}`|
|403|`{"belonging_version":4,"cost_num":1,"weather_weight":[[1,5],[2,10],[3,5]],"quality_weight":3,"unlock_level_condition":3,"unlock_reward":[[830702,3],[101500,1000]]}`|
|404|`{"belonging_version":4,"cost_num":1,"weather_weight":[[1,10],[2,5],[3,5]],"quality_weight":4,"unlock_level_condition":5,"unlock_reward":[[3040201,1],[101500,1000]]}`|
|405|`{"belonging_version":4,"cost_num":1,"weather_weight":[[1,5],[2,5],[3,10]],"quality_weight":5,"unlock_level_condition":7,"unlock_reward":[[3040201,1],[101500,3000]]}`|
|501|`{"belonging_version":5,"cost_num":1,"weather_weight":[[1,10],[2,5],[3,5]],"quality_weight":1,"unlock_level_condition":0,"unlock_reward":[[831502,500],[101500,500]]}`|
|502|`{"belonging_version":5,"cost_num":1,"weather_weight":[[1,5],[2,5],[3,10]],"quality_weight":2,"unlock_level_condition":2,"unlock_reward":[[830602,10],[101500,500]]}`|
|503|`{"belonging_version":5,"cost_num":1,"weather_weight":[[1,5],[2,10],[3,5]],"quality_weight":3,"unlock_level_condition":3,"unlock_reward":[[830702,3],[101500,1000]]}`|
|504|`{"belonging_version":5,"cost_num":1,"weather_weight":[[1,10],[2,5],[3,5]],"quality_weight":4,"unlock_level_condition":5,"unlock_reward":[[5741200,40],[101500,1000]]}`|
|505|`{"belonging_version":5,"cost_num":1,"weather_weight":[[1,5],[2,5],[3,10]],"quality_weight":5,"unlock_level_condition":7,"unlock_reward":[[5741200,40],[101500,3000]]}`|
|601|`{"belonging_version":6,"cost_num":1,"weather_weight":[[1,10],[2,5],[3,5]],"quality_weight":1,"unlock_level_condition":0,"unlock_reward":[[101500,500]]}`|
|602|`{"belonging_version":6,"cost_num":1,"weather_weight":[[1,5],[2,5],[3,10]],"quality_weight":2,"unlock_level_condition":2,"unlock_reward":[[830602,10],[101500,500]]}`|
|603|`{"belonging_version":6,"cost_num":1,"weather_weight":[[1,5],[2,10],[3,5]],"quality_weight":3,"unlock_level_condition":3,"unlock_reward":[[830702,3],[101500,1000]]}`|
|604|`{"belonging_version":6,"cost_num":1,"weather_weight":[[1,10],[2,5],[3,5]],"quality_weight":4,"unlock_level_condition":5,"unlock_reward":[[5771200,40],[101500,1000]]}`|
|605|`{"belonging_version":6,"cost_num":1,"weather_weight":[[1,5],[2,5],[3,10]],"quality_weight":5,"unlock_level_condition":7,"unlock_reward":[[5771200,80],[101500,3000]]}`|
|701|`{"belonging_version":7,"cost_num":1,"weather_weight":[[1,10],[2,5],[3,5]],"quality_weight":1,"unlock_level_condition":0,"unlock_reward":[[101500,500]]}`|
|702|`{"belonging_version":7,"cost_num":1,"weather_weight":[[1,5],[2,5],[3,10]],"quality_weight":2,"unlock_level_condition":2,"unlock_reward":[[830602,10],[101500,500]]}`|
|703|`{"belonging_version":7,"cost_num":1,"weather_weight":[[1,5],[2,10],[3,5]],"quality_weight":3,"unlock_level_condition":3,"unlock_reward":[[830702,3],[101500,1000]]}`|
|704|`{"belonging_version":7,"cost_num":1,"weather_weight":[[1,10],[2,5],[3,5]],"quality_weight":4,"unlock_level_condition":5,"unlock_reward":[[4371200,80],[101500,1000]]}`|
|705|`{"belonging_version":7,"cost_num":1,"weather_weight":[[1,5],[2,5],[3,10]],"quality_weight":5,"unlock_level_condition":7,"unlock_reward":[[4371200,80],[101500,3000]]}`|

## IslandFish

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|werther_weight|array|518|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|
|island|number|518|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|weight|number|518|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|
|tid|number|518|本表行键；与其他表同值不自动代表同一对象。|
|fish_type|number|518|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部518行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"werther_weight":[[1,40],[2,40],[3,40]],"weight":40,"fish_type":101}`|
|102|`{"werther_weight":[[1,40],[2,40],[3,40]],"weight":40,"fish_type":102}`|
|103|`{"werther_weight":[[1,40],[2,40],[3,40]],"weight":40,"fish_type":103}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|auto_qte_rate|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fail_rage|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|lock_name|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|weather_num|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|unlock_auto_num|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_fish_num|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|base_score|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|unlock_auto_qte_num|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"auto_qte_rate":8000,"lock_name":686340,"weather_num":20,"unlock_auto_num":20,"max_fish_num":50,"base_score":100,"unlock_auto_qte_num":20}`|

## Version

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|free_item_num|number|11|版本免费道具配置数量；本字段单独不能证明每日发放。|
|high_score_rank_key|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fishing_rod_library|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|buy_lib|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|help|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|heroPlay|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|default_weather|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|gift|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|money|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|heroPlayTime|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|score_rank_key|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ticket_item|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_hero_icon|string|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|score_item|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|island_version|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|res_exchange|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rank_need_score|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|11|本表行键；与其他表同值不自动代表同一对象。|
|show_hero_title|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|up_rank_award|array|11|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|shop|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|score_rank_lib|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|level_library|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|high_score_rank_lib|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|illustrated_guide_version_library|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"free_item_num":25,"high_score_rank_key":428,"fishing_rod_library":1,"buy_lib":1,"heroPlay":5040601,"money":821302,"heroPlayTime":15000,"score_rank_key":427,"ticket_item":821202,"show_hero_icon":"icon_xrhd_zjm_nainaizi.png","score_item":6901900,"island_version":1,"res_exchange":45,"rank_need_score":80000,"show_hero_title":686541,"up_rank_award":[[101500,2000],[392002,80],[391002,2000]],"score_rank_lib":1,"level_library":1,"high_score_rank_lib":1,"illustrated_guide_version_library":1}`|
|2|`{"free_item_num":25,"high_score_rank_key":411,"fishing_rod_library":1,"buy_lib":1,"heroPlay":4040301,"money":821302,"heroPlayTime":12000,"score_rank_key":406,"ticket_item":821202,"show_hero_icon":"icon_xrhd_zjm_xiye.png","score_item":6901900,"island_version":2,"res_exchange":45,"rank_need_score":80000,"show_hero_title":686542,"up_rank_award":[[101500,2000],[392002,80],[391002,2000]],"score_rank_lib":2,"level_library":2,"high_score_rank_lib":2,"illustrated_guide_version_library":1}`|
|3|`{"free_item_num":25,"high_score_rank_key":411,"fishing_rod_library":1,"buy_lib":1,"heroPlay":4040301,"money":821302,"heroPlayTime":12000,"score_rank_key":406,"ticket_item":821202,"show_hero_icon":"icon_xrhd_zjm_xiye.png","score_item":6901900,"island_version":2,"res_exchange":45,"rank_need_score":80000,"show_hero_title":686542,"up_rank_award":[[101500,2000],[392002,80],[391002,2000]],"score_rank_lib":2,"level_library":2,"high_score_rank_lib":2,"illustrated_guide_version_library":1}`|
|4|`{"free_item_num":25,"high_score_rank_key":411,"fishing_rod_library":1,"buy_lib":1,"heroPlay":1040201,"money":821302,"heroPlayTime":15000,"score_rank_key":406,"ticket_item":821202,"show_hero_icon":"icon_xrhd_zjm_aimili.png","score_item":6901900,"island_version":3,"res_exchange":45,"rank_need_score":80000,"show_hero_title":686542,"up_rank_award":[[101500,2000],[392002,80],[391002,2000]],"score_rank_lib":3,"level_library":3,"high_score_rank_lib":3,"illustrated_guide_version_library":1}`|
|5|`{"free_item_num":25,"high_score_rank_key":411,"fishing_rod_library":1,"buy_lib":1,"heroPlay":1040201,"money":821302,"heroPlayTime":15000,"score_rank_key":406,"ticket_item":821202,"show_hero_icon":"icon_xrhd_zjm_aimili.png","score_item":6901900,"island_version":3,"res_exchange":45,"rank_need_score":80000,"show_hero_title":686542,"up_rank_award":[[101500,2000],[392002,80],[391002,2000]],"score_rank_lib":3,"level_library":3,"high_score_rank_lib":3,"illustrated_guide_version_library":1}`|
|6|`{"free_item_num":25,"high_score_rank_key":411,"fishing_rod_library":1,"buy_lib":1,"heroPlay":3040201,"money":821302,"heroPlayTime":13000,"score_rank_key":406,"ticket_item":821202,"show_hero_icon":"icon_xrhd_zjm_aniesi.png","score_item":6901900,"island_version":4,"res_exchange":45,"rank_need_score":80000,"show_hero_title":686542,"up_rank_award":[[101500,2000],[392002,80],[391002,2000]],"score_rank_lib":4,"level_library":4,"high_score_rank_lib":4,"illustrated_guide_version_library":1}`|
|7|`{"free_item_num":25,"high_score_rank_key":411,"fishing_rod_library":1,"buy_lib":1,"heroPlay":3040201,"money":821302,"heroPlayTime":13000,"score_rank_key":406,"ticket_item":821202,"show_hero_icon":"icon_xrhd_zjm_aniesi.png","score_item":6901900,"island_version":4,"res_exchange":45,"rank_need_score":80000,"show_hero_title":686542,"up_rank_award":[[101500,2000],[392002,80],[391002,2000]],"score_rank_lib":4,"level_library":4,"high_score_rank_lib":4,"illustrated_guide_version_library":1}`|
|8|`{"free_item_num":25,"high_score_rank_key":428,"fishing_rod_library":1,"buy_lib":1,"heroPlay":5040601,"money":821302,"heroPlayTime":15000,"score_rank_key":427,"ticket_item":821202,"show_hero_icon":"icon_xrhd_zjm_nainaizi.png","score_item":6901900,"island_version":5,"res_exchange":45,"rank_need_score":80000,"show_hero_title":686545,"up_rank_award":[[101500,2000],[392002,80],[391002,2000]],"score_rank_lib":1,"level_library":5,"high_score_rank_lib":5,"illustrated_guide_version_library":1}`|
|9|`{"free_item_num":25,"high_score_rank_key":428,"fishing_rod_library":1,"buy_lib":1,"heroPlay":0,"money":821302,"heroPlayTime":0,"score_rank_key":427,"ticket_item":821202,"show_hero_icon":"","score_item":6901900,"island_version":6,"res_exchange":45,"rank_need_score":80000,"show_hero_title":0,"up_rank_award":[[101500,2000],[392002,80],[391002,2000]],"score_rank_lib":1,"level_library":6,"high_score_rank_lib":6,"illustrated_guide_version_library":1}`|
|10|`{"free_item_num":25,"high_score_rank_key":411,"fishing_rod_library":1,"buy_lib":1,"heroPlay":0,"money":821302,"heroPlayTime":0,"score_rank_key":406,"ticket_item":821202,"show_hero_icon":"","score_item":6901900,"island_version":7,"res_exchange":45,"rank_need_score":80000,"show_hero_title":0,"up_rank_award":[[101500,2000],[392002,80],[391002,2000]],"score_rank_lib":5,"level_library":7,"high_score_rank_lib":7,"illustrated_guide_version_library":1}`|
|11|`{"free_item_num":25,"high_score_rank_key":428,"fishing_rod_library":1,"buy_lib":1,"heroPlay":0,"money":821302,"heroPlayTime":0,"score_rank_key":427,"ticket_item":821202,"show_hero_icon":"","score_item":6901900,"island_version":6,"res_exchange":45,"rank_need_score":80000,"show_hero_title":0,"up_rank_award":[[101500,2000],[392002,80],[391002,2000]],"score_rank_lib":1,"level_library":6,"high_score_rank_lib":8,"illustrated_guide_version_library":1}`|

## HighScoreRank

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|40|本表行键；与其他表同值不自动代表同一对象。|
|map_tid|array|40|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|40|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|ver|number|40|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award":[[1018002,3],[4451200,240],[4391200,8]]}`|
|2|`{"award":[[1018002,2],[4451200,160],[4391200,6]]}`|
|3|`{"award":[[1018002,1],[4451200,80],[4391200,4]]}`|
|4|`{"award":[[4451200,40],[4391200,3]]}`|
|5|`{"award":[[4451200,20],[4391200,2]]}`|
|201|`{"award":[[1009002,3],[25400204,80],[22002,10]]}`|
|202|`{"award":[[1009002,2],[25400204,60],[22002,8]]}`|
|203|`{"award":[[1009002,1],[25400204,40],[22002,5]]}`|
|204|`{"award":[[25400204,20],[22002,3]]}`|
|205|`{"award":[[25400204,10],[22002,2]]}`|
|301|`{"award":[[1007002,3],[25400204,80],[22002,10]]}`|
|302|`{"award":[[1007002,2],[25400204,60],[22002,8]]}`|
|303|`{"award":[[1007002,1],[25400204,40],[22002,5]]}`|
|304|`{"award":[[25400204,20],[22002,3]]}`|
|305|`{"award":[[25400204,10],[22002,2]]}`|
|401|`{"award":[[1008002,3],[25400204,80],[22002,10]]}`|
|402|`{"award":[[1008002,2],[25400204,60],[22002,8]]}`|
|403|`{"award":[[1008002,1],[25400204,40],[22002,5]]}`|
|404|`{"award":[[25400204,20],[22002,3]]}`|
|405|`{"award":[[25400204,10],[22002,2]]}`|
|501|`{"award":[[5311200,3],[4451200,240],[4391200,8]]}`|
|502|`{"award":[[5311200,2],[4451200,160],[4391200,6]]}`|
|503|`{"award":[[5311200,1],[4451200,80],[4391200,4]]}`|
|504|`{"award":[[4451200,40],[4391200,3]]}`|
|505|`{"award":[[4451200,20],[4391200,2]]}`|
|601|`{"award":[[5311200,3],[5001200,240],[4391200,8]]}`|
|602|`{"award":[[5311200,2],[5001200,160],[4391200,6]]}`|
|603|`{"award":[[5311200,1],[5001200,80],[4391200,4]]}`|
|604|`{"award":[[5001200,40],[4391200,3]]}`|
|605|`{"award":[[5001200,20],[4391200,2]]}`|
|701|`{"award":[[1016002,3],[4381200,5],[22002,10]]}`|
|702|`{"award":[[1016002,2],[4381200,4],[22002,8]]}`|
|703|`{"award":[[1016002,1],[4381200,3],[22002,5]]}`|
|704|`{"award":[[4381200,2],[22002,3]]}`|
|705|`{"award":[[4381200,1],[22002,2]]}`|
|801|`{"award":[[5921200,3],[5001200,240],[4391200,8]]}`|
|802|`{"award":[[5921200,2],[5001200,160],[4391200,6]]}`|
|803|`{"award":[[5921200,1],[5001200,80],[4391200,4]]}`|
|804|`{"award":[[5001200,40],[4391200,3]]}`|
|805|`{"award":[[5001200,20],[4391200,2]]}`|

## ScoreRank

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|40|本表行键；与其他表同值不自动代表同一对象。|
|map_tid|array|40|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|40|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|ver|number|40|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award":[[4381200,6],[22002,10],[101500,3000],[392002,150],[391002,3000]]}`|
|2|`{"award":[[4381200,4],[22002,8],[101500,2000],[392002,100],[391002,2000]]}`|
|3|`{"award":[[4381200,3],[22002,5],[101500,1500],[392002,60],[391002,1500]]}`|
|4|`{"award":[[4381200,2],[22002,3],[101500,1000],[392002,30],[391002,1000]]}`|
|5|`{"award":[[4381200,1],[22002,2],[101500,800],[392002,20],[391002,800]]}`|
|6|`{"award":[[22002,1],[101500,600],[392002,15],[391002,600]]}`|
|7|`{"award":[[101500,500],[392002,10],[391002,500]]}`|
|8|`{"award":[[101500,300],[392002,5],[391002,300]]}`|
|201|`{"award":[[25400204,80],[22002,8],[101500,3000],[392002,150],[391002,3000]]}`|
|202|`{"award":[[25400204,60],[22002,6],[101500,2000],[392002,100],[391002,2000]]}`|
|203|`{"award":[[25400204,40],[22002,4],[101500,1500],[392002,60],[391002,1500]]}`|
|204|`{"award":[[25400204,20],[22002,3],[101500,1000],[392002,30],[391002,1000]]}`|
|205|`{"award":[[25400204,10],[22002,2],[101500,800],[392002,20],[391002,800]]}`|
|206|`{"award":[[22002,1],[101500,600],[392002,15],[391002,600]]}`|
|207|`{"award":[[101500,500],[392002,10],[391002,500]]}`|
|208|`{"award":[[101500,300],[392002,5],[391002,300]]}`|
|301|`{"award":[[25400204,80],[22002,8],[101500,3000],[392002,150],[391002,3000]]}`|
|302|`{"award":[[25400204,60],[22002,6],[101500,2000],[392002,100],[391002,2000]]}`|
|303|`{"award":[[25400204,40],[22002,4],[101500,1500],[392002,60],[391002,1500]]}`|
|304|`{"award":[[25400204,20],[22002,3],[101500,1000],[392002,30],[391002,1000]]}`|
|305|`{"award":[[25400204,10],[22002,2],[101500,800],[392002,20],[391002,800]]}`|
|306|`{"award":[[22002,1],[101500,600],[392002,15],[391002,600]]}`|
|307|`{"award":[[101500,500],[392002,10],[391002,500]]}`|
|308|`{"award":[[101500,300],[392002,5],[391002,300]]}`|
|401|`{"award":[[25400204,80],[22002,8],[101500,3000],[392002,150],[391002,3000]]}`|
|402|`{"award":[[25400204,60],[22002,6],[101500,2000],[392002,100],[391002,2000]]}`|
|403|`{"award":[[25400204,40],[22002,4],[101500,1500],[392002,60],[391002,1500]]}`|
|404|`{"award":[[25400204,20],[22002,3],[101500,1000],[392002,30],[391002,1000]]}`|
|405|`{"award":[[25400204,10],[22002,2],[101500,800],[392002,20],[391002,800]]}`|
|406|`{"award":[[22002,1],[101500,600],[392002,15],[391002,600]]}`|
|407|`{"award":[[101500,500],[392002,10],[391002,500]]}`|
|408|`{"award":[[101500,300],[392002,5],[391002,300]]}`|
|501|`{"award":[[7005002,160],[22002,8],[101500,3000],[392002,150],[391002,3000]]}`|
|502|`{"award":[[7005002,80],[22002,6],[101500,2000],[392002,100],[391002,2000]]}`|
|503|`{"award":[[7005002,40],[22002,4],[101500,1500],[392002,60],[391002,1500]]}`|
|504|`{"award":[[7005002,20],[22002,3],[101500,1000],[392002,30],[391002,1000]]}`|
|505|`{"award":[[7005002,10],[22002,2],[101500,800],[392002,20],[391002,800]]}`|
|506|`{"award":[[22002,1],[101500,600],[392002,15],[391002,600]]}`|
|507|`{"award":[[101500,500],[392002,10],[391002,500]]}`|
|508|`{"award":[[101500,300],[392002,5],[391002,300]]}`|

## Level

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|score|number|371|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|belonging_version|number|371|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|unlock_reward|array|371|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|is_big_reward|boolean|371|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|tid|number|371|本表行键；与其他表同值不自动代表同一对象。|
|level|number|371|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部371行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"score":1000,"belonging_version":1,"unlock_reward":[[830902,200],[101500,300]],"is_big_reward":false,"level":1}`|
|102|`{"score":5000,"belonging_version":1,"unlock_reward":[[830602,5],[101500,300]],"is_big_reward":false,"level":2}`|
|103|`{"score":15000,"belonging_version":1,"unlock_reward":[[830602,10],[101500,300]],"is_big_reward":false,"level":3}`|

## Buy

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tips|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rod|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|recharge|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ver|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|

## Progress

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|55|本表行键；与其他表同值不自动代表同一对象。|
|version|number|55|版本引用；必须按活动类型及其消费者查对应版本表。|
|award|array|55|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|progress|number|55|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"version":1,"award":[[101500,1000]],"progress":5}`|
|102|`{"version":1,"award":[[22002,1]],"progress":10}`|
|103|`{"version":1,"award":[[101500,3000]],"progress":15}`|
|104|`{"version":1,"award":[[22002,3]],"progress":23}`|
|105|`{"version":1,"award":[[5040601,1]],"progress":35}`|
|201|`{"version":2,"award":[[101500,1000]],"progress":5}`|
|202|`{"version":2,"award":[[22002,1]],"progress":10}`|
|203|`{"version":2,"award":[[101500,3000]],"progress":15}`|
|204|`{"version":2,"award":[[22002,3]],"progress":23}`|
|205|`{"version":2,"award":[[4040301,1]],"progress":35}`|
|301|`{"version":3,"award":[[101500,1000]],"progress":5}`|
|302|`{"version":3,"award":[[22002,1]],"progress":10}`|
|303|`{"version":3,"award":[[101500,3000]],"progress":15}`|
|304|`{"version":3,"award":[[22002,3]],"progress":23}`|
|305|`{"version":3,"award":[[4040301,1]],"progress":35}`|
|401|`{"version":4,"award":[[101500,1000]],"progress":5}`|
|402|`{"version":4,"award":[[22002,1]],"progress":10}`|
|403|`{"version":4,"award":[[101500,3000]],"progress":15}`|
|404|`{"version":4,"award":[[22002,3]],"progress":23}`|
|405|`{"version":4,"award":[[1040201,1]],"progress":35}`|
|501|`{"version":5,"award":[[101500,1000]],"progress":5}`|
|502|`{"version":5,"award":[[22002,1]],"progress":10}`|
|503|`{"version":5,"award":[[101500,3000]],"progress":15}`|
|504|`{"version":5,"award":[[22002,3]],"progress":23}`|
|505|`{"version":5,"award":[[1040201,1]],"progress":35}`|
|601|`{"version":6,"award":[[101500,1000]],"progress":5}`|
|602|`{"version":6,"award":[[22002,1]],"progress":10}`|
|603|`{"version":6,"award":[[101500,3000]],"progress":15}`|
|604|`{"version":6,"award":[[22002,3]],"progress":23}`|
|605|`{"version":6,"award":[[3040201,1]],"progress":35}`|
|701|`{"version":7,"award":[[101500,1000]],"progress":5}`|
|702|`{"version":7,"award":[[22002,1]],"progress":10}`|
|703|`{"version":7,"award":[[101500,3000]],"progress":15}`|
|704|`{"version":7,"award":[[22002,3]],"progress":23}`|
|705|`{"version":7,"award":[[3040201,1]],"progress":35}`|
|801|`{"version":8,"award":[[101500,1000]],"progress":5}`|
|802|`{"version":8,"award":[[22002,1]],"progress":10}`|
|803|`{"version":8,"award":[[101500,3000]],"progress":15}`|
|804|`{"version":8,"award":[[22002,3]],"progress":23}`|
|805|`{"version":8,"award":[[5741200,80]],"progress":35}`|
|901|`{"version":9,"award":[[101500,1000]],"progress":5}`|
|902|`{"version":9,"award":[[22002,1]],"progress":10}`|
|903|`{"version":9,"award":[[5771200,40]],"progress":15}`|
|904|`{"version":9,"award":[[22002,3]],"progress":23}`|
|905|`{"version":9,"award":[[5771200,80]],"progress":35}`|
|1001|`{"version":10,"award":[[101500,1000]],"progress":5}`|
|1002|`{"version":10,"award":[[22002,1]],"progress":10}`|
|1003|`{"version":10,"award":[[101500,3000]],"progress":15}`|
|1004|`{"version":10,"award":[[22002,3]],"progress":23}`|
|1005|`{"version":10,"award":[[4371200,80]],"progress":35}`|
|1101|`{"version":11,"award":[[101500,1000]],"progress":5}`|
|1102|`{"version":11,"award":[[22002,1]],"progress":10}`|
|1103|`{"version":11,"award":[[5771200,40]],"progress":15}`|
|1104|`{"version":11,"award":[[22002,3]],"progress":23}`|
|1105|`{"version":11,"award":[[5771200,80]],"progress":35}`|

## Rod

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tips|array|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|prefab|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|icon|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|auto_qte_success|boolean|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|item|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|change_di|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|score_bonus|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|high_bonus|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|effect|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|get_spine|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_free|boolean|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|money_bonus|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ver|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"item":100014500,"score_bonus":0,"is_free":true,"money_bonus":0}`|
|2|`{"item":100024500,"score_bonus":0,"is_free":false,"money_bonus":2000}`|
|3|`{"item":100034500,"score_bonus":2000,"is_free":false,"money_bonus":0}`|
|4|`{"item":100044500,"score_bonus":500,"is_free":false,"money_bonus":500}`|

## Fish

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|spawn_desc|number|40|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|icon|string|40|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|version|number|40|版本引用；必须按活动类型及其消费者查对应版本表。|
|type|number|40|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|40|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|value_type|number|40|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|initialmax_point|number|40|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|desc|number|40|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_point|number|40|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|obtained_item|array|40|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|initialmin_point|number|40|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|qte_num|number|40|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|obtained_exp|number|40|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|quality|number|40|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|obtained_money|number|40|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|40|本表行键；与其他表同值不自动代表同一对象。|
|init_point|number|40|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|first_award|array|40|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|wait_time|number|40|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"version":1,"type":0,"value_type":0,"initialmax_point":12000,"max_point":1000000,"obtained_item":[[201500,5000]],"initialmin_point":8000,"qte_num":0,"obtained_exp":50,"quality":30,"obtained_money":0,"init_point":100,"first_award":[[101500,10]],"wait_time":1000}`|
|102|`{"version":1,"type":0,"value_type":0,"initialmax_point":12000,"max_point":1000000,"obtained_item":[[201500,10000]],"initialmin_point":8000,"qte_num":0,"obtained_exp":100,"quality":30,"obtained_money":0,"init_point":100,"first_award":[[101500,10]],"wait_time":1000}`|
|103|`{"version":1,"type":0,"value_type":0,"initialmax_point":12000,"max_point":1000000,"obtained_item":[[201500,10000]],"initialmin_point":8000,"qte_num":0,"obtained_exp":100,"quality":30,"obtained_money":0,"init_point":100,"first_award":[[101500,10]],"wait_time":1000}`|
|104|`{"version":1,"type":0,"value_type":0,"initialmax_point":12000,"max_point":1000000,"obtained_item":[[201500,15000]],"initialmin_point":8000,"qte_num":0,"obtained_exp":150,"quality":30,"obtained_money":0,"init_point":1000,"first_award":[[101500,10]],"wait_time":1000}`|
|105|`{"version":1,"type":0,"value_type":1,"initialmax_point":13000,"max_point":1000000,"obtained_item":[],"initialmin_point":7000,"qte_num":1,"obtained_exp":200,"quality":30,"obtained_money":100,"init_point":10000,"first_award":[[101500,10]],"wait_time":1200}`|
|106|`{"version":1,"type":0,"value_type":0,"initialmax_point":12000,"max_point":1000000,"obtained_item":[[201500,5000]],"initialmin_point":8000,"qte_num":0,"obtained_exp":50,"quality":40,"obtained_money":0,"init_point":500,"first_award":[[101500,10]],"wait_time":1200}`|
|107|`{"version":1,"type":0,"value_type":0,"initialmax_point":12000,"max_point":1000000,"obtained_item":[[201500,10000]],"initialmin_point":8000,"qte_num":0,"obtained_exp":100,"quality":40,"obtained_money":0,"init_point":500,"first_award":[[101500,10]],"wait_time":1200}`|
|108|`{"version":1,"type":0,"value_type":0,"initialmax_point":12000,"max_point":1000000,"obtained_item":[[201500,15000]],"initialmin_point":8000,"qte_num":0,"obtained_exp":150,"quality":40,"obtained_money":0,"init_point":500,"first_award":[[101500,10]],"wait_time":1200}`|
|109|`{"version":1,"type":0,"value_type":0,"initialmax_point":12000,"max_point":1000000,"obtained_item":[[201500,15000]],"initialmin_point":8000,"qte_num":0,"obtained_exp":150,"quality":40,"obtained_money":0,"init_point":1500,"first_award":[[101500,10]],"wait_time":1200}`|
|110|`{"version":1,"type":0,"value_type":1,"initialmax_point":13000,"max_point":1000000,"obtained_item":[],"initialmin_point":7000,"qte_num":1,"obtained_exp":300,"quality":40,"obtained_money":120,"init_point":10000,"first_award":[[101500,10]],"wait_time":1500}`|
|111|`{"version":1,"type":0,"value_type":0,"initialmax_point":12000,"max_point":1000000,"obtained_item":[[201500,10000]],"initialmin_point":8000,"qte_num":0,"obtained_exp":100,"quality":50,"obtained_money":0,"init_point":1000,"first_award":[[101500,10]],"wait_time":1500}`|
|112|`{"version":1,"type":0,"value_type":0,"initialmax_point":12000,"max_point":1000000,"obtained_item":[[201500,15000]],"initialmin_point":8000,"qte_num":0,"obtained_exp":150,"quality":50,"obtained_money":0,"init_point":200,"first_award":[[101500,10]],"wait_time":1500}`|
|113|`{"version":1,"type":0,"value_type":0,"initialmax_point":12000,"max_point":1000000,"obtained_item":[[201500,20000]],"initialmin_point":8000,"qte_num":0,"obtained_exp":200,"quality":50,"obtained_money":0,"init_point":1200,"first_award":[[101500,10]],"wait_time":1500}`|
|114|`{"version":1,"type":0,"value_type":0,"initialmax_point":12000,"max_point":1000000,"obtained_item":[[201500,30000]],"initialmin_point":8000,"qte_num":0,"obtained_exp":300,"quality":50,"obtained_money":0,"init_point":200,"first_award":[[101500,10]],"wait_time":1500}`|
|115|`{"version":1,"type":0,"value_type":1,"initialmax_point":13000,"max_point":1000000,"obtained_item":[],"initialmin_point":7000,"qte_num":1,"obtained_exp":500,"quality":50,"obtained_money":150,"init_point":10000,"first_award":[[101500,10]],"wait_time":1800}`|
|116|`{"version":1,"type":0,"value_type":0,"initialmax_point":12000,"max_point":1000000,"obtained_item":[[201500,20000]],"initialmin_point":8000,"qte_num":0,"obtained_exp":200,"quality":60,"obtained_money":0,"init_point":1500,"first_award":[[101500,10]],"wait_time":1800}`|
|117|`{"version":1,"type":0,"value_type":0,"initialmax_point":12000,"max_point":1000000,"obtained_item":[[201500,20000]],"initialmin_point":8000,"qte_num":0,"obtained_exp":200,"quality":60,"obtained_money":0,"init_point":2000,"first_award":[[101500,10]],"wait_time":1800}`|
|118|`{"version":1,"type":0,"value_type":0,"initialmax_point":12000,"max_point":1000000,"obtained_item":[[201500,20000]],"initialmin_point":8000,"qte_num":0,"obtained_exp":200,"quality":60,"obtained_money":0,"init_point":2500,"first_award":[[101500,10]],"wait_time":1800}`|
|119|`{"version":1,"type":0,"value_type":0,"initialmax_point":12000,"max_point":1000000,"obtained_item":[[201500,30000]],"initialmin_point":8000,"qte_num":0,"obtained_exp":300,"quality":60,"obtained_money":0,"init_point":2000,"first_award":[[101500,10]],"wait_time":1800}`|
|120|`{"version":1,"type":0,"value_type":0,"initialmax_point":12000,"max_point":1000000,"obtained_item":[[201500,30000]],"initialmin_point":8000,"qte_num":0,"obtained_exp":300,"quality":60,"obtained_money":0,"init_point":1500,"first_award":[[101500,10]],"wait_time":1800}`|
|121|`{"version":1,"type":0,"value_type":0,"initialmax_point":12000,"max_point":1000000,"obtained_item":[[201500,40000]],"initialmin_point":8000,"qte_num":0,"obtained_exp":400,"quality":60,"obtained_money":0,"init_point":2500,"first_award":[[101500,10]],"wait_time":1800}`|
|122|`{"version":1,"type":0,"value_type":1,"initialmax_point":13000,"max_point":1000000,"obtained_item":[],"initialmin_point":7000,"qte_num":1,"obtained_exp":600,"quality":60,"obtained_money":200,"init_point":10000,"first_award":[[101500,10]],"wait_time":1800}`|
|123|`{"version":1,"type":0,"value_type":1,"initialmax_point":13000,"max_point":1000000,"obtained_item":[],"initialmin_point":7000,"qte_num":1,"obtained_exp":600,"quality":60,"obtained_money":200,"init_point":10000,"first_award":[[101500,10]],"wait_time":2000}`|
|124|`{"version":1,"type":0,"value_type":0,"initialmax_point":12000,"max_point":1000000,"obtained_item":[[201500,25000]],"initialmin_point":8000,"qte_num":0,"obtained_exp":250,"quality":70,"obtained_money":0,"init_point":3500,"first_award":[[101500,10]],"wait_time":2000}`|
|125|`{"version":1,"type":0,"value_type":0,"initialmax_point":12000,"max_point":1000000,"obtained_item":[[201500,30000]],"initialmin_point":8000,"qte_num":0,"obtained_exp":300,"quality":70,"obtained_money":0,"init_point":3000,"first_award":[[101500,10]],"wait_time":2000}`|
|126|`{"version":1,"type":0,"value_type":0,"initialmax_point":12000,"max_point":1000000,"obtained_item":[[201500,45000]],"initialmin_point":8000,"qte_num":0,"obtained_exp":450,"quality":70,"obtained_money":0,"init_point":2000,"first_award":[[101500,10]],"wait_time":2000}`|
|127|`{"version":1,"type":0,"value_type":0,"initialmax_point":12000,"max_point":1000000,"obtained_item":[[201500,45000]],"initialmin_point":8000,"qte_num":0,"obtained_exp":450,"quality":70,"obtained_money":0,"init_point":1000,"first_award":[[101500,10]],"wait_time":2000}`|
|128|`{"version":1,"type":0,"value_type":0,"initialmax_point":12000,"max_point":1000000,"obtained_item":[[201500,45000]],"initialmin_point":8000,"qte_num":0,"obtained_exp":450,"quality":70,"obtained_money":0,"init_point":5000,"first_award":[[101500,10]],"wait_time":2000}`|
|129|`{"version":1,"type":0,"value_type":0,"initialmax_point":12000,"max_point":1000000,"obtained_item":[[201500,60000]],"initialmin_point":8000,"qte_num":0,"obtained_exp":600,"quality":70,"obtained_money":0,"init_point":14000,"first_award":[[101500,10]],"wait_time":2200}`|
|130|`{"version":1,"type":0,"value_type":0,"initialmax_point":12000,"max_point":1000000,"obtained_item":[[201500,60000]],"initialmin_point":8000,"qte_num":0,"obtained_exp":600,"quality":70,"obtained_money":0,"init_point":2000,"first_award":[[101500,10]],"wait_time":2000}`|
|131|`{"version":1,"type":0,"value_type":0,"initialmax_point":12000,"max_point":1000000,"obtained_item":[[201500,80000]],"initialmin_point":8000,"qte_num":0,"obtained_exp":800,"quality":70,"obtained_money":0,"init_point":700,"first_award":[[101500,10]],"wait_time":2000}`|
|132|`{"version":1,"type":0,"value_type":0,"initialmax_point":12000,"max_point":1000000,"obtained_item":[[201500,80000]],"initialmin_point":8000,"qte_num":0,"obtained_exp":800,"quality":70,"obtained_money":0,"init_point":3000,"first_award":[[101500,10]],"wait_time":2000}`|
|133|`{"version":1,"type":0,"value_type":1,"initialmax_point":13000,"max_point":1000000,"obtained_item":[],"initialmin_point":7000,"qte_num":1,"obtained_exp":1000,"quality":70,"obtained_money":300,"init_point":10000,"first_award":[[101500,10]],"wait_time":2200}`|
|134|`{"version":1,"type":0,"value_type":1,"initialmax_point":13000,"max_point":1000000,"obtained_item":[],"initialmin_point":7000,"qte_num":1,"obtained_exp":1000,"quality":70,"obtained_money":300,"init_point":10000,"first_award":[[101500,10]],"wait_time":2200}`|
|135|`{"version":1,"type":0,"value_type":1,"initialmax_point":13000,"max_point":1000000,"obtained_item":[],"initialmin_point":7000,"qte_num":1,"obtained_exp":1000,"quality":70,"obtained_money":300,"init_point":10000,"first_award":[[101500,10]],"wait_time":2200}`|
|136|`{"version":1,"type":1,"value_type":0,"initialmax_point":13000,"max_point":1000000,"obtained_item":[[101500,200]],"initialmin_point":7000,"qte_num":0,"obtained_exp":0,"quality":30,"obtained_money":0,"init_point":0,"first_award":[],"wait_time":1200}`|
|137|`{"version":1,"type":1,"value_type":0,"initialmax_point":13000,"max_point":1000000,"obtained_item":[[101500,268]],"initialmin_point":7000,"qte_num":0,"obtained_exp":0,"quality":40,"obtained_money":0,"init_point":0,"first_award":[],"wait_time":1500}`|
|138|`{"version":1,"type":1,"value_type":0,"initialmax_point":13000,"max_point":1000000,"obtained_item":[[101500,350]],"initialmin_point":7000,"qte_num":0,"obtained_exp":0,"quality":50,"obtained_money":0,"init_point":0,"first_award":[],"wait_time":1800}`|
|139|`{"version":1,"type":1,"value_type":0,"initialmax_point":13000,"max_point":1000000,"obtained_item":[[101500,666]],"initialmin_point":7000,"qte_num":0,"obtained_exp":0,"quality":60,"obtained_money":0,"init_point":0,"first_award":[],"wait_time":2000}`|
|140|`{"version":1,"type":1,"value_type":0,"initialmax_point":13000,"max_point":1000000,"obtained_item":[[101500,1000]],"initialmin_point":7000,"qte_num":0,"obtained_exp":0,"quality":70,"obtained_money":0,"init_point":0,"first_award":[],"wait_time":2200}`|
