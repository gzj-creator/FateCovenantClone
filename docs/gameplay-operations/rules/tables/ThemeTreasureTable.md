# ThemeTreasureTable 规则参数

来源：[personal-server/assets/tables/ThemeTreasureTable.data.lua.json.gz](../../../../personal-server/assets/tables/ThemeTreasureTable.data.lua.json.gz)，SHA256：`d1b7e8001e765fe51e52acf68674258351744e88a25cb14d86663465156689b0`。

[完整逐行JSON](ThemeTreasureTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Main](#main)|30|decoded-rows|
|[Hunt](#hunt)|30|decoded-rows|
|[Draw](#draw)|0|decoded-rows|
|[Const](#const)|30|decoded-rows|
|[Guide](#guide)|1|decoded-rows|
|[Map](#map)|0|decoded-rows|
|[MapBox](#mapbox)|2880|decoded-rows|
|[CustomBox](#custombox)|5|decoded-rows|
|[DayTask](#daytask)|0|decoded-rows|
|[DrawInfo](#drawinfo)|0|decoded-rows|
|[ExchangeGroup](#exchangegroup)|134|decoded-rows|
|[Exchange](#exchange)|380|decoded-rows|
|[ChallengeTask](#challengetask)|331|decoded-rows|
|[ChallengeGroup](#challengegroup)|30|decoded-rows|
|[Rank](#rank)|300|decoded-rows|
|[Gift](#gift)|315|decoded-rows|
|[UIInfo](#uiinfo)|5|decoded-rows|
|[Sub](#sub)|18|rows-with-external-references|
|[ExchangeShow](#exchangeshow)|4|decoded-rows|
|[HuntShow](#huntshow)|4|decoded-rows|
|[TaskShow](#taskshow)|4|decoded-rows|
|[OreStyle](#orestyle)|2|decoded-rows|
|[HuntCellEffect](#huntcelleffect)|3|decoded-rows|
|[TowerStyle](#towerstyle)|2|decoded-rows|
|[GiftShow](#giftshow)|4|decoded-rows|

## Main

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|fight_id|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sub_act|array|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|popup_form|boolean|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|30|本表行键；与其他表同值不自动代表同一对象。|
|show_status|array|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_model|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|story|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|entrance_icon|string|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|role_style|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sub_act_ui|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|artifact_tag|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_play_enter_anim|boolean|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|entrance_title|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"fight_id":1000005,"type":1,"is_play_enter_anim":true}`|
|2|`{"fight_id":1000005,"type":1,"is_play_enter_anim":true}`|
|3|`{"fight_id":1000005,"type":1,"is_play_enter_anim":true}`|
|4|`{"fight_id":1000005,"type":1,"is_play_enter_anim":true}`|
|5|`{"fight_id":1000005,"type":1,"is_play_enter_anim":true}`|
|6|`{"fight_id":1000005,"type":1,"is_play_enter_anim":true}`|
|7|`{"fight_id":1000005,"type":1,"is_play_enter_anim":true}`|
|8|`{"fight_id":1000005,"type":1,"is_play_enter_anim":true}`|
|9|`{"fight_id":1000005,"type":1,"is_play_enter_anim":true}`|
|10|`{"fight_id":1000005,"type":1,"is_play_enter_anim":true}`|
|11|`{"fight_id":1000005,"type":1,"is_play_enter_anim":true}`|
|12|`{"fight_id":1000005,"type":1,"is_play_enter_anim":true}`|
|13|`{"fight_id":1000005,"type":1,"is_play_enter_anim":true}`|
|14|`{"fight_id":1000005,"type":1,"is_play_enter_anim":true}`|
|15|`{"fight_id":1000005,"type":1,"is_play_enter_anim":true}`|
|16|`{"fight_id":1000005,"type":1,"is_play_enter_anim":true}`|
|17|`{"fight_id":1000005,"type":1,"is_play_enter_anim":true}`|
|18|`{"fight_id":1000005,"type":1,"is_play_enter_anim":true}`|
|19|`{"fight_id":1000005,"type":1,"is_play_enter_anim":true}`|
|20|`{"fight_id":1000005,"type":1,"is_play_enter_anim":true}`|
|21|`{"fight_id":1000005,"type":1,"is_play_enter_anim":true}`|
|22|`{"fight_id":1000005,"type":1,"is_play_enter_anim":true}`|
|23|`{"fight_id":1000005,"type":1,"is_play_enter_anim":true}`|
|24|`{"fight_id":1000005,"type":1,"is_play_enter_anim":true}`|
|25|`{"fight_id":1000005,"type":1,"is_play_enter_anim":true}`|
|26|`{"fight_id":1000005,"type":1,"is_play_enter_anim":true}`|
|27|`{"fight_id":1000005,"type":1,"is_play_enter_anim":true}`|
|28|`{"fight_id":1000005,"type":1,"is_play_enter_anim":true}`|
|29|`{"fight_id":1000005,"type":1,"is_play_enter_anim":true}`|
|30|`{"fight_id":1000005,"type":1,"is_play_enter_anim":false}`|

## Hunt

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|award_preview|number|30|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|custom_info|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cost_count|number|30|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|special_probability|number|30|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|
|tid|number|30|本表行键；与其他表同值不自动代表同一对象。|
|treasure_item|array|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|special_item|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cost_id|number|30|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|normal_preview|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award_preview":0,"cost_count":1,"special_probability":0,"treasure_item":[],"special_item":0,"cost_id":173002}`|
|2|`{"award_preview":0,"cost_count":1,"special_probability":0,"treasure_item":[],"special_item":0,"cost_id":173002}`|
|3|`{"award_preview":0,"cost_count":1,"special_probability":0,"treasure_item":[],"special_item":0,"cost_id":173002}`|
|4|`{"award_preview":0,"cost_count":1,"special_probability":0,"treasure_item":[],"special_item":0,"cost_id":173002}`|
|5|`{"award_preview":0,"cost_count":1,"special_probability":0,"treasure_item":[],"special_item":0,"cost_id":173002}`|
|6|`{"award_preview":0,"cost_count":1,"special_probability":0,"treasure_item":[],"special_item":0,"cost_id":173002}`|
|7|`{"award_preview":0,"cost_count":1,"special_probability":0,"treasure_item":[],"special_item":0,"cost_id":173002}`|
|8|`{"award_preview":0,"cost_count":1,"special_probability":0,"treasure_item":[],"special_item":0,"cost_id":173002}`|
|9|`{"award_preview":0,"cost_count":1,"special_probability":0,"treasure_item":[],"special_item":0,"cost_id":173002}`|
|10|`{"award_preview":0,"cost_count":1,"special_probability":0,"treasure_item":[],"special_item":0,"cost_id":173002}`|
|11|`{"award_preview":0,"cost_count":1,"special_probability":0,"treasure_item":[],"special_item":0,"cost_id":173002}`|
|12|`{"award_preview":0,"cost_count":1,"special_probability":0,"treasure_item":[],"special_item":0,"cost_id":173002}`|
|13|`{"award_preview":0,"cost_count":1,"special_probability":0,"treasure_item":[],"special_item":0,"cost_id":173002}`|
|14|`{"award_preview":0,"cost_count":1,"special_probability":0,"treasure_item":[],"special_item":0,"cost_id":173002}`|
|15|`{"award_preview":0,"cost_count":1,"special_probability":0,"treasure_item":[],"special_item":0,"cost_id":173002}`|
|16|`{"award_preview":0,"cost_count":1,"special_probability":0,"treasure_item":[],"special_item":0,"cost_id":173002}`|
|17|`{"award_preview":0,"cost_count":1,"special_probability":0,"treasure_item":[],"special_item":0,"cost_id":173002}`|
|18|`{"award_preview":0,"cost_count":1,"special_probability":0,"treasure_item":[],"special_item":0,"cost_id":173002}`|
|19|`{"award_preview":0,"cost_count":1,"special_probability":0,"treasure_item":[],"special_item":0,"cost_id":173002}`|
|20|`{"award_preview":0,"cost_count":1,"special_probability":0,"treasure_item":[],"special_item":0,"cost_id":173002}`|
|21|`{"award_preview":0,"cost_count":1,"special_probability":0,"treasure_item":[],"special_item":0,"cost_id":173002}`|
|22|`{"award_preview":0,"cost_count":1,"special_probability":0,"treasure_item":[],"special_item":0,"cost_id":173002}`|
|23|`{"award_preview":0,"cost_count":1,"special_probability":0,"treasure_item":[],"special_item":0,"cost_id":173002}`|
|24|`{"award_preview":0,"cost_count":1,"special_probability":0,"treasure_item":[],"special_item":0,"cost_id":173002}`|
|25|`{"award_preview":0,"cost_count":1,"special_probability":0,"treasure_item":[],"special_item":0,"cost_id":173002}`|
|26|`{"award_preview":0,"cost_count":1,"special_probability":0,"treasure_item":[],"special_item":0,"cost_id":173002}`|
|27|`{"award_preview":0,"cost_count":1,"special_probability":0,"treasure_item":[],"special_item":0,"cost_id":173002}`|
|28|`{"award_preview":0,"cost_count":1,"special_probability":0,"treasure_item":[],"special_item":0,"cost_id":173002}`|
|29|`{"award_preview":0,"cost_count":1,"special_probability":0,"treasure_item":[],"special_item":0,"cost_id":173002}`|
|30|`{"award_preview":0,"cost_count":1,"special_probability":0,"treasure_item":[],"special_item":0,"cost_id":173002}`|

## Draw

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|step|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|treasure_probability|number|30|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|
|multiple_open|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loop_step|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|move_up_step|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|treasure_guaranteed|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cancel_move_res|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|box_award|number|30|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|camera_move_time|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|total_count|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|run_effect_step|array|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|move_speed_one|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_tips_show|number|30|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award_tips_hide|number|30|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|move_up_speed|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|personal_challenge_turn|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_step|number|30|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|res_exchange|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|free_times|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|30|本表行键；与其他表同值不自动代表同一对象。|
|move_speed_ten|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|refresh_interval|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_arrow_offset|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|move_up_res|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|target_step|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|init_award|array|30|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|help_tid|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"step":10,"treasure_probability":0,"multiple_open":50,"loop_step":100,"move_up_step":100,"treasure_guaranteed":10,"box_award":303,"total_count":540,"run_effect_step":[6,99],"move_speed_one":2,"award_tips_show":5000,"award_tips_hide":15000,"move_up_speed":20,"personal_challenge_turn":7,"max_step":100,"res_exchange":2,"free_times":0,"move_speed_ten":10,"refresh_interval":60,"target_step":10,"init_award":[[173002,5]]}`|
|2|`{"step":10,"treasure_probability":0,"multiple_open":50,"loop_step":100,"move_up_step":100,"treasure_guaranteed":10,"box_award":303,"total_count":540,"run_effect_step":[6,99],"move_speed_one":2,"award_tips_show":5000,"award_tips_hide":15000,"move_up_speed":20,"personal_challenge_turn":7,"max_step":100,"res_exchange":3,"free_times":0,"move_speed_ten":10,"refresh_interval":60,"target_step":10,"init_award":[[173002,5]]}`|
|3|`{"step":10,"treasure_probability":0,"multiple_open":50,"loop_step":100,"move_up_step":100,"treasure_guaranteed":10,"box_award":303,"total_count":540,"run_effect_step":[6,99],"move_speed_one":2,"award_tips_show":5000,"award_tips_hide":15000,"move_up_speed":20,"personal_challenge_turn":7,"max_step":100,"res_exchange":5,"free_times":0,"move_speed_ten":10,"refresh_interval":60,"target_step":10,"init_award":[[173002,5]]}`|
|4|`{"step":10,"treasure_probability":0,"multiple_open":50,"loop_step":100,"move_up_step":100,"treasure_guaranteed":10,"box_award":303,"total_count":540,"run_effect_step":[6,99],"move_speed_one":2,"award_tips_show":5000,"award_tips_hide":15000,"move_up_speed":20,"personal_challenge_turn":7,"max_step":100,"res_exchange":5,"free_times":0,"move_speed_ten":10,"refresh_interval":60,"target_step":10,"init_award":[[173002,5]]}`|
|5|`{"step":10,"treasure_probability":0,"multiple_open":50,"loop_step":100,"move_up_step":100,"treasure_guaranteed":10,"box_award":303,"total_count":540,"run_effect_step":[6,99],"move_speed_one":2,"award_tips_show":5000,"award_tips_hide":15000,"move_up_speed":20,"personal_challenge_turn":7,"max_step":100,"res_exchange":5,"free_times":0,"move_speed_ten":10,"refresh_interval":60,"target_step":10,"init_award":[[173002,5]]}`|
|6|`{"step":10,"treasure_probability":0,"multiple_open":50,"loop_step":100,"move_up_step":100,"treasure_guaranteed":10,"box_award":303,"total_count":540,"run_effect_step":[6,99],"move_speed_one":2,"award_tips_show":5000,"award_tips_hide":15000,"move_up_speed":20,"personal_challenge_turn":7,"max_step":100,"res_exchange":5,"free_times":0,"move_speed_ten":10,"refresh_interval":60,"target_step":10,"init_award":[[173002,5]]}`|
|7|`{"step":10,"treasure_probability":0,"multiple_open":50,"loop_step":100,"move_up_step":100,"treasure_guaranteed":10,"box_award":303,"total_count":540,"run_effect_step":[6,99],"move_speed_one":2,"award_tips_show":5000,"award_tips_hide":15000,"move_up_speed":20,"personal_challenge_turn":7,"max_step":100,"res_exchange":5,"free_times":0,"move_speed_ten":10,"refresh_interval":60,"target_step":10,"init_award":[[173002,5]]}`|
|8|`{"step":10,"treasure_probability":0,"multiple_open":50,"loop_step":100,"move_up_step":100,"treasure_guaranteed":10,"box_award":303,"total_count":540,"run_effect_step":[6,99],"move_speed_one":2,"award_tips_show":5000,"award_tips_hide":15000,"move_up_speed":20,"personal_challenge_turn":7,"max_step":100,"res_exchange":5,"free_times":0,"move_speed_ten":10,"refresh_interval":60,"target_step":10,"init_award":[[173002,5]]}`|
|9|`{"step":10,"treasure_probability":0,"multiple_open":50,"loop_step":100,"move_up_step":100,"treasure_guaranteed":10,"box_award":303,"total_count":540,"run_effect_step":[6,99],"move_speed_one":2,"award_tips_show":5000,"award_tips_hide":15000,"move_up_speed":20,"personal_challenge_turn":7,"max_step":100,"res_exchange":5,"free_times":0,"move_speed_ten":10,"refresh_interval":60,"target_step":10,"init_award":[[173002,5]]}`|
|10|`{"step":10,"treasure_probability":0,"multiple_open":50,"loop_step":100,"move_up_step":100,"treasure_guaranteed":10,"box_award":303,"total_count":540,"run_effect_step":[6,99],"move_speed_one":2,"award_tips_show":5000,"award_tips_hide":15000,"move_up_speed":20,"personal_challenge_turn":7,"max_step":100,"res_exchange":5,"free_times":0,"move_speed_ten":10,"refresh_interval":60,"target_step":10,"init_award":[[173002,5]]}`|
|11|`{"step":10,"treasure_probability":0,"multiple_open":50,"loop_step":100,"move_up_step":100,"treasure_guaranteed":10,"box_award":303,"total_count":540,"run_effect_step":[6,99],"move_speed_one":2,"award_tips_show":5000,"award_tips_hide":15000,"move_up_speed":20,"personal_challenge_turn":7,"max_step":100,"res_exchange":5,"free_times":0,"move_speed_ten":10,"refresh_interval":60,"target_step":10,"init_award":[[173002,5]]}`|
|12|`{"step":10,"treasure_probability":0,"multiple_open":50,"loop_step":100,"move_up_step":100,"treasure_guaranteed":10,"box_award":303,"total_count":328,"run_effect_step":[6,99],"move_speed_one":2,"award_tips_show":5000,"award_tips_hide":15000,"move_up_speed":20,"personal_challenge_turn":7,"max_step":100,"res_exchange":5,"free_times":0,"move_speed_ten":10,"refresh_interval":60,"target_step":10,"init_award":[[173002,0]]}`|
|13|`{"step":10,"treasure_probability":0,"multiple_open":50,"loop_step":100,"move_up_step":100,"treasure_guaranteed":10,"box_award":303,"total_count":328,"run_effect_step":[6,99],"move_speed_one":2,"award_tips_show":5000,"award_tips_hide":15000,"move_up_speed":20,"personal_challenge_turn":7,"max_step":100,"res_exchange":5,"free_times":0,"move_speed_ten":10,"refresh_interval":60,"target_step":10,"init_award":[[173002,0]]}`|
|14|`{"step":10,"treasure_probability":0,"multiple_open":50,"loop_step":100,"move_up_step":100,"treasure_guaranteed":10,"box_award":303,"total_count":410,"run_effect_step":[6,99],"move_speed_one":2,"award_tips_show":5000,"award_tips_hide":15000,"move_up_speed":20,"personal_challenge_turn":7,"max_step":100,"res_exchange":5,"free_times":0,"move_speed_ten":10,"refresh_interval":60,"target_step":10,"init_award":[[173002,5]]}`|
|15|`{"step":10,"treasure_probability":0,"multiple_open":50,"loop_step":100,"move_up_step":100,"treasure_guaranteed":10,"box_award":303,"total_count":540,"run_effect_step":[6,99],"move_speed_one":2,"award_tips_show":5000,"award_tips_hide":15000,"move_up_speed":20,"personal_challenge_turn":7,"max_step":100,"res_exchange":5,"free_times":0,"move_speed_ten":10,"refresh_interval":60,"target_step":10,"init_award":[[173002,5]]}`|
|16|`{"step":10,"treasure_probability":0,"multiple_open":50,"loop_step":100,"move_up_step":100,"treasure_guaranteed":10,"box_award":303,"total_count":335,"run_effect_step":[6,99],"move_speed_one":2,"award_tips_show":5000,"award_tips_hide":15000,"move_up_speed":20,"personal_challenge_turn":7,"max_step":100,"res_exchange":5,"free_times":0,"move_speed_ten":10,"refresh_interval":60,"target_step":10,"init_award":[[173002,5]]}`|
|17|`{"step":10,"treasure_probability":0,"multiple_open":50,"loop_step":100,"move_up_step":100,"treasure_guaranteed":10,"box_award":303,"total_count":540,"run_effect_step":[6,99],"move_speed_one":2,"award_tips_show":5000,"award_tips_hide":15000,"move_up_speed":20,"personal_challenge_turn":7,"max_step":100,"res_exchange":5,"free_times":0,"move_speed_ten":10,"refresh_interval":60,"target_step":10,"init_award":[[173002,5]]}`|
|18|`{"step":10,"treasure_probability":0,"multiple_open":50,"loop_step":100,"move_up_step":100,"treasure_guaranteed":10,"box_award":303,"total_count":328,"run_effect_step":[6,99],"move_speed_one":2,"award_tips_show":5000,"award_tips_hide":15000,"move_up_speed":20,"personal_challenge_turn":7,"max_step":100,"res_exchange":5,"free_times":0,"move_speed_ten":10,"refresh_interval":60,"target_step":10,"init_award":[[173002,0]]}`|
|19|`{"step":10,"treasure_probability":0,"multiple_open":50,"loop_step":100,"move_up_step":100,"treasure_guaranteed":10,"box_award":303,"total_count":328,"run_effect_step":[6,99],"move_speed_one":2,"award_tips_show":5000,"award_tips_hide":15000,"move_up_speed":20,"personal_challenge_turn":7,"max_step":100,"res_exchange":5,"free_times":0,"move_speed_ten":10,"refresh_interval":60,"target_step":10,"init_award":[[173002,0]]}`|
|20|`{"step":10,"treasure_probability":0,"multiple_open":50,"loop_step":100,"move_up_step":100,"treasure_guaranteed":10,"box_award":303,"total_count":328,"run_effect_step":[6,99],"move_speed_one":2,"award_tips_show":5000,"award_tips_hide":15000,"move_up_speed":20,"personal_challenge_turn":7,"max_step":100,"res_exchange":5,"free_times":0,"move_speed_ten":10,"refresh_interval":60,"target_step":10,"init_award":[[173002,0]]}`|
|21|`{"step":10,"treasure_probability":0,"multiple_open":50,"loop_step":100,"move_up_step":100,"treasure_guaranteed":10,"box_award":303,"total_count":328,"run_effect_step":[6,99],"move_speed_one":2,"award_tips_show":5000,"award_tips_hide":15000,"move_up_speed":20,"personal_challenge_turn":7,"max_step":100,"res_exchange":5,"free_times":0,"move_speed_ten":10,"refresh_interval":60,"target_step":10,"init_award":[[173002,0]]}`|
|22|`{"step":10,"treasure_probability":0,"multiple_open":50,"loop_step":100,"move_up_step":100,"treasure_guaranteed":10,"box_award":303,"total_count":328,"run_effect_step":[6,99],"move_speed_one":2,"award_tips_show":5000,"award_tips_hide":15000,"move_up_speed":20,"personal_challenge_turn":7,"max_step":100,"res_exchange":5,"free_times":0,"move_speed_ten":10,"refresh_interval":60,"target_step":10,"init_award":[[173002,0]]}`|
|23|`{"step":10,"treasure_probability":0,"multiple_open":50,"loop_step":100,"move_up_step":100,"treasure_guaranteed":10,"box_award":303,"total_count":328,"run_effect_step":[6,99],"move_speed_one":2,"award_tips_show":5000,"award_tips_hide":15000,"move_up_speed":20,"personal_challenge_turn":7,"max_step":100,"res_exchange":5,"free_times":0,"move_speed_ten":10,"refresh_interval":60,"target_step":10,"init_award":[[173002,0]]}`|
|24|`{"step":10,"treasure_probability":0,"multiple_open":50,"loop_step":100,"move_up_step":100,"treasure_guaranteed":10,"box_award":303,"total_count":328,"run_effect_step":[6,99],"move_speed_one":2,"award_tips_show":5000,"award_tips_hide":15000,"move_up_speed":20,"personal_challenge_turn":7,"max_step":100,"res_exchange":5,"free_times":0,"move_speed_ten":10,"refresh_interval":60,"target_step":10,"init_award":[[173002,0]]}`|
|25|`{"step":10,"treasure_probability":0,"multiple_open":50,"loop_step":100,"move_up_step":100,"treasure_guaranteed":10,"box_award":303,"total_count":328,"run_effect_step":[6,99],"move_speed_one":2,"award_tips_show":5000,"award_tips_hide":15000,"move_up_speed":20,"personal_challenge_turn":7,"max_step":100,"res_exchange":5,"free_times":0,"move_speed_ten":10,"refresh_interval":60,"target_step":10,"init_award":[[173002,0]]}`|
|26|`{"step":10,"treasure_probability":0,"multiple_open":50,"loop_step":100,"move_up_step":100,"treasure_guaranteed":10,"box_award":303,"total_count":328,"run_effect_step":[6,99],"move_speed_one":2,"award_tips_show":5000,"award_tips_hide":15000,"move_up_speed":20,"personal_challenge_turn":7,"max_step":100,"res_exchange":5,"free_times":0,"move_speed_ten":10,"refresh_interval":60,"target_step":10,"init_award":[[173002,0]]}`|
|27|`{"step":10,"treasure_probability":0,"multiple_open":50,"loop_step":100,"move_up_step":100,"treasure_guaranteed":10,"box_award":303,"total_count":538,"run_effect_step":[6,99],"move_speed_one":2,"award_tips_show":5000,"award_tips_hide":15000,"move_up_speed":20,"personal_challenge_turn":7,"max_step":100,"res_exchange":5,"free_times":0,"move_speed_ten":10,"refresh_interval":60,"target_step":10,"init_award":[[173002,3]]}`|
|28|`{"step":10,"treasure_probability":0,"multiple_open":50,"loop_step":100,"move_up_step":100,"treasure_guaranteed":10,"box_award":303,"total_count":328,"run_effect_step":[6,99],"move_speed_one":2,"award_tips_show":5000,"award_tips_hide":15000,"move_up_speed":20,"personal_challenge_turn":7,"max_step":100,"res_exchange":5,"free_times":0,"move_speed_ten":10,"refresh_interval":60,"target_step":10,"init_award":[[173002,0]]}`|
|29|`{"step":10,"treasure_probability":0,"multiple_open":50,"loop_step":100,"move_up_step":100,"treasure_guaranteed":10,"box_award":303,"total_count":328,"run_effect_step":[6,99],"move_speed_one":2,"award_tips_show":5000,"award_tips_hide":15000,"move_up_speed":20,"personal_challenge_turn":7,"max_step":100,"res_exchange":5,"free_times":0,"move_speed_ten":10,"refresh_interval":60,"target_step":10,"init_award":[[173002,0]]}`|
|30|`{"step":10,"treasure_probability":0,"multiple_open":50,"loop_step":100,"move_up_step":100,"treasure_guaranteed":10,"box_award":303,"total_count":538,"run_effect_step":[6,99],"move_speed_one":2,"award_tips_show":5000,"award_tips_hide":15000,"move_up_speed":20,"personal_challenge_turn":7,"max_step":100,"res_exchange":5,"free_times":0,"move_speed_ten":10,"refresh_interval":60,"target_step":10,"init_award":[[173002,3]]}`|

## Guide

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|award|array|1|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award":[[201500,10]]}`|

## Map

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## MapBox

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2880|本表行键；与其他表同值不自动代表同一对象。|
|version|number|2880|版本引用；必须按活动类型及其消费者查对应版本表。|
|step_number|number|2880|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部2880行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1000008|`{"version":1,"step_number":6}`|
|1000022|`{"version":1,"step_number":6}`|
|1000034|`{"version":1,"step_number":4}`|

## CustomBox

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|version|number|5|版本引用；必须按活动类型及其消费者查对应版本表。|
|award|array|5|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{"version":1,"award":[[423002,2]]}`|
|1002|`{"version":1,"award":[[392002,1]]}`|
|1003|`{"version":1,"award":[[301200,2]]}`|
|1004|`{"version":1,"award":[[33002,5]]}`|
|1005|`{"version":1,"award":[[20002,5]]}`|

## DayTask

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## DrawInfo

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## ExchangeGroup

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|version|number|134|版本引用；必须按活动类型及其消费者查对应版本表。|
|leve_spec_item|number|134|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|extra_award|number|134|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|unlock_count|number|134|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|134|本表行键；与其他表同值不自动代表同一对象。|
|num|number|134|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|items|array|134|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|leve_spec_count|number|134|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{"version":1,"leve_spec_item":1311200,"extra_award":0,"unlock_count":0,"num":0,"items":[1001,1002,1003],"leve_spec_count":2}`|
|1002|`{"version":1,"leve_spec_item":1311200,"extra_award":0,"unlock_count":300,"num":0,"items":[1004,1005,1006],"leve_spec_count":4}`|
|1003|`{"version":1,"leve_spec_item":3002,"extra_award":0,"unlock_count":800,"num":0,"items":[1007,1008,1009],"leve_spec_count":20}`|
|1004|`{"version":1,"leve_spec_item":11200,"extra_award":0,"unlock_count":1500,"num":0,"items":[1010,1011,1012],"leve_spec_count":1}`|
|1005|`{"version":1,"leve_spec_item":431200,"extra_award":0,"unlock_count":2500,"num":0,"items":[1013,1014,1015],"leve_spec_count":60}`|
|1006|`{"version":1,"leve_spec_item":300610,"extra_award":0,"unlock_count":4000,"num":0,"items":[1016,1017,1018],"leve_spec_count":1}`|
|2001|`{"version":2,"leve_spec_item":2002,"extra_award":0,"unlock_count":0,"num":0,"items":[2001,2002,2003],"leve_spec_count":10}`|
|2002|`{"version":2,"leve_spec_item":3002,"extra_award":0,"unlock_count":300,"num":0,"items":[2004,2005,2006],"leve_spec_count":10}`|
|2003|`{"version":2,"leve_spec_item":1321200,"extra_award":0,"unlock_count":800,"num":0,"items":[2007,2008,2009],"leve_spec_count":2}`|
|2004|`{"version":2,"leve_spec_item":11200,"extra_award":0,"unlock_count":1500,"num":0,"items":[2010,2011,2012],"leve_spec_count":1}`|
|2005|`{"version":2,"leve_spec_item":24002,"extra_award":0,"unlock_count":2500,"num":0,"items":[2013,2014,2015],"leve_spec_count":3}`|
|2006|`{"version":2,"leve_spec_item":300610,"extra_award":0,"unlock_count":4000,"num":0,"items":[2016,2017,2018],"leve_spec_count":1}`|
|3001|`{"version":3,"leve_spec_item":2002,"extra_award":0,"unlock_count":0,"num":0,"items":[3001,3002,3003],"leve_spec_count":10}`|
|3002|`{"version":3,"leve_spec_item":3002,"extra_award":0,"unlock_count":300,"num":0,"items":[3004,3005,3006],"leve_spec_count":10}`|
|3003|`{"version":3,"leve_spec_item":1321200,"extra_award":0,"unlock_count":800,"num":0,"items":[3007,3008,3009],"leve_spec_count":2}`|
|3004|`{"version":3,"leve_spec_item":11200,"extra_award":0,"unlock_count":1500,"num":0,"items":[3010,3011,3012],"leve_spec_count":1}`|
|3005|`{"version":3,"leve_spec_item":24002,"extra_award":0,"unlock_count":2500,"num":0,"items":[3013,3014,3015],"leve_spec_count":3}`|
|3006|`{"version":3,"leve_spec_item":300710,"extra_award":0,"unlock_count":4000,"num":0,"items":[3016,3017,3018],"leve_spec_count":1}`|
|4001|`{"version":4,"leve_spec_item":1311200,"extra_award":0,"unlock_count":0,"num":0,"items":[4001,4002,4003],"leve_spec_count":2}`|
|4002|`{"version":4,"leve_spec_item":1311200,"extra_award":0,"unlock_count":300,"num":0,"items":[4004,4005,4006],"leve_spec_count":4}`|
|4003|`{"version":4,"leve_spec_item":3002,"extra_award":0,"unlock_count":800,"num":0,"items":[4007,4008,4009],"leve_spec_count":20}`|
|4004|`{"version":4,"leve_spec_item":11200,"extra_award":0,"unlock_count":1500,"num":0,"items":[4010,4011,4012],"leve_spec_count":1}`|
|4005|`{"version":4,"leve_spec_item":431200,"extra_award":0,"unlock_count":2500,"num":0,"items":[4013,4014,4015],"leve_spec_count":60}`|
|4006|`{"version":4,"leve_spec_item":300610,"extra_award":0,"unlock_count":4000,"num":0,"items":[4016,4017,4018],"leve_spec_count":1}`|
|5001|`{"version":5,"leve_spec_item":2002,"extra_award":0,"unlock_count":0,"num":0,"items":[5001,5002,5003],"leve_spec_count":10}`|
|5002|`{"version":5,"leve_spec_item":3002,"extra_award":0,"unlock_count":300,"num":0,"items":[5004,5005,5006],"leve_spec_count":10}`|
|5003|`{"version":5,"leve_spec_item":1321200,"extra_award":0,"unlock_count":800,"num":0,"items":[5007,5008,5009],"leve_spec_count":2}`|
|5004|`{"version":5,"leve_spec_item":11200,"extra_award":0,"unlock_count":1500,"num":0,"items":[5010,5011,5012],"leve_spec_count":1}`|
|5005|`{"version":5,"leve_spec_item":24002,"extra_award":0,"unlock_count":2500,"num":0,"items":[5013,5014,5015],"leve_spec_count":3}`|
|5006|`{"version":5,"leve_spec_item":300710,"extra_award":0,"unlock_count":4000,"num":0,"items":[5016,5017,5018],"leve_spec_count":1}`|
|6001|`{"version":6,"leve_spec_item":2002,"extra_award":0,"unlock_count":0,"num":0,"items":[6001,6002,6003],"leve_spec_count":10}`|
|6002|`{"version":6,"leve_spec_item":3002,"extra_award":0,"unlock_count":300,"num":0,"items":[6004,6005,6006],"leve_spec_count":10}`|
|6003|`{"version":6,"leve_spec_item":1321200,"extra_award":0,"unlock_count":800,"num":0,"items":[6007,6008,6009],"leve_spec_count":2}`|
|6004|`{"version":6,"leve_spec_item":11200,"extra_award":0,"unlock_count":1500,"num":0,"items":[6010,6011,6012],"leve_spec_count":1}`|
|6005|`{"version":6,"leve_spec_item":24002,"extra_award":0,"unlock_count":2500,"num":0,"items":[6013,6014,6015],"leve_spec_count":3}`|
|6006|`{"version":6,"leve_spec_item":300610,"extra_award":0,"unlock_count":4000,"num":0,"items":[6016,6017,6018],"leve_spec_count":1}`|
|7001|`{"version":7,"leve_spec_item":2002,"extra_award":0,"unlock_count":0,"num":0,"items":[7001,7002,7003],"leve_spec_count":10}`|
|7002|`{"version":7,"leve_spec_item":3002,"extra_award":0,"unlock_count":300,"num":0,"items":[7004,7005,7006],"leve_spec_count":10}`|
|7003|`{"version":7,"leve_spec_item":1321200,"extra_award":0,"unlock_count":800,"num":0,"items":[7007,7008,7009],"leve_spec_count":2}`|
|7004|`{"version":7,"leve_spec_item":11200,"extra_award":0,"unlock_count":1500,"num":0,"items":[7010,7011,7012],"leve_spec_count":1}`|
|7005|`{"version":7,"leve_spec_item":333002,"extra_award":0,"unlock_count":2500,"num":0,"items":[7013,7014,7015],"leve_spec_count":2}`|
|7006|`{"version":7,"leve_spec_item":300610,"extra_award":0,"unlock_count":4000,"num":0,"items":[7016,7017,7018],"leve_spec_count":1}`|
|8001|`{"version":8,"leve_spec_item":2002,"extra_award":0,"unlock_count":0,"num":0,"items":[8001,8002,8003],"leve_spec_count":10}`|
|8002|`{"version":8,"leve_spec_item":3002,"extra_award":0,"unlock_count":300,"num":0,"items":[8004,8005,8006],"leve_spec_count":10}`|
|8003|`{"version":8,"leve_spec_item":1321200,"extra_award":0,"unlock_count":800,"num":0,"items":[8007,8008,8009],"leve_spec_count":2}`|
|8004|`{"version":8,"leve_spec_item":11200,"extra_award":0,"unlock_count":1500,"num":0,"items":[8010,8011,8012],"leve_spec_count":1}`|
|8005|`{"version":8,"leve_spec_item":333002,"extra_award":0,"unlock_count":2500,"num":0,"items":[8013,8014,8015],"leve_spec_count":2}`|
|8006|`{"version":8,"leve_spec_item":300710,"extra_award":0,"unlock_count":4000,"num":0,"items":[8016,8017,8018],"leve_spec_count":1}`|
|9001|`{"version":9,"leve_spec_item":2002,"extra_award":0,"unlock_count":0,"num":0,"items":[9001,9002,9003],"leve_spec_count":10}`|
|9002|`{"version":9,"leve_spec_item":3002,"extra_award":0,"unlock_count":300,"num":0,"items":[9004,9005,9006],"leve_spec_count":10}`|
|9003|`{"version":9,"leve_spec_item":1321200,"extra_award":0,"unlock_count":800,"num":0,"items":[9007,9008,9009],"leve_spec_count":2}`|
|9004|`{"version":9,"leve_spec_item":11200,"extra_award":0,"unlock_count":1500,"num":0,"items":[9010,9011,9012],"leve_spec_count":1}`|
|9005|`{"version":9,"leve_spec_item":333002,"extra_award":0,"unlock_count":2500,"num":0,"items":[9013,9014,9015],"leve_spec_count":2}`|
|9006|`{"version":9,"leve_spec_item":2221200,"extra_award":0,"unlock_count":4000,"num":0,"items":[9016,9017,9018],"leve_spec_count":1}`|
|10001|`{"version":10,"leve_spec_item":2002,"extra_award":0,"unlock_count":0,"num":0,"items":[10001,10002,10003],"leve_spec_count":10}`|
|10002|`{"version":10,"leve_spec_item":3002,"extra_award":0,"unlock_count":300,"num":0,"items":[10004,10005,10006],"leve_spec_count":10}`|
|10003|`{"version":10,"leve_spec_item":1321200,"extra_award":0,"unlock_count":800,"num":0,"items":[10007,10008,10009],"leve_spec_count":2}`|
|10004|`{"version":10,"leve_spec_item":11200,"extra_award":0,"unlock_count":1500,"num":0,"items":[10010,10011,10012],"leve_spec_count":1}`|
|10005|`{"version":10,"leve_spec_item":24002,"extra_award":0,"unlock_count":2500,"num":0,"items":[10013,10014,10015],"leve_spec_count":3}`|
|10006|`{"version":10,"leve_spec_item":300610,"extra_award":0,"unlock_count":4000,"num":0,"items":[10016,10017,10018],"leve_spec_count":1}`|
|11001|`{"version":11,"leve_spec_item":2002,"extra_award":0,"unlock_count":0,"num":0,"items":[11001,11002,11003],"leve_spec_count":10}`|
|11002|`{"version":11,"leve_spec_item":3002,"extra_award":0,"unlock_count":300,"num":0,"items":[11004,11005,11006],"leve_spec_count":10}`|
|11003|`{"version":11,"leve_spec_item":1321200,"extra_award":0,"unlock_count":800,"num":0,"items":[11007,11008,11009],"leve_spec_count":2}`|
|11004|`{"version":11,"leve_spec_item":11200,"extra_award":0,"unlock_count":1500,"num":0,"items":[11010,11011,11012],"leve_spec_count":1}`|
|11005|`{"version":11,"leve_spec_item":24002,"extra_award":0,"unlock_count":2500,"num":0,"items":[11013,11014,11015],"leve_spec_count":3}`|
|11006|`{"version":11,"leve_spec_item":300810,"extra_award":0,"unlock_count":4000,"num":0,"items":[11016,11017,11018],"leve_spec_count":1}`|
|12001|`{"version":12,"leve_spec_item":2781200,"extra_award":0,"unlock_count":0,"num":0,"items":[12001,12002,12003],"leve_spec_count":1}`|
|12002|`{"version":12,"leve_spec_item":1321200,"extra_award":0,"unlock_count":300,"num":0,"items":[12004,12005,12006],"leve_spec_count":2}`|
|12003|`{"version":12,"leve_spec_item":2221200,"extra_award":0,"unlock_count":850,"num":0,"items":[12007],"leve_spec_count":1}`|
|13001|`{"version":13,"leve_spec_item":2781200,"extra_award":0,"unlock_count":0,"num":0,"items":[13001,13002,13003],"leve_spec_count":1}`|
|13002|`{"version":13,"leve_spec_item":1321200,"extra_award":0,"unlock_count":300,"num":0,"items":[13004,13005,13006],"leve_spec_count":2}`|
|13003|`{"version":13,"leve_spec_item":300810,"extra_award":0,"unlock_count":850,"num":0,"items":[13007],"leve_spec_count":1}`|
|14001|`{"version":14,"leve_spec_item":1321200,"extra_award":0,"unlock_count":0,"num":0,"items":[14001,14002,14003,14004,14005,14006,14007,14008],"leve_spec_count":2}`|
|14002|`{"version":14,"leve_spec_item":300610,"extra_award":0,"unlock_count":1200,"num":0,"items":[14009,14010,14011,14012],"leve_spec_count":4}`|
|15001|`{"version":15,"leve_spec_item":1311200,"extra_award":0,"unlock_count":0,"num":0,"items":[15001,15002,15003],"leve_spec_count":2}`|
|15002|`{"version":15,"leve_spec_item":1311200,"extra_award":0,"unlock_count":300,"num":0,"items":[15004,15005,15006],"leve_spec_count":4}`|
|15003|`{"version":15,"leve_spec_item":3002,"extra_award":0,"unlock_count":800,"num":0,"items":[15007,15008,15009],"leve_spec_count":20}`|
|15004|`{"version":15,"leve_spec_item":11200,"extra_award":0,"unlock_count":1500,"num":0,"items":[15010,15011,15012],"leve_spec_count":1}`|
|15005|`{"version":15,"leve_spec_item":431200,"extra_award":0,"unlock_count":2500,"num":0,"items":[15013,15014,15015],"leve_spec_count":60}`|
|15006|`{"version":15,"leve_spec_item":300610,"extra_award":0,"unlock_count":4000,"num":0,"items":[15016,15017,15018],"leve_spec_count":1}`|
|16001|`{"version":16,"leve_spec_item":3002,"extra_award":0,"unlock_count":0,"num":0,"items":[16001,16002,16003],"leve_spec_count":10}`|
|16002|`{"version":16,"leve_spec_item":1321200,"extra_award":0,"unlock_count":400,"num":0,"items":[16004,16005,16006],"leve_spec_count":2}`|
|16003|`{"version":16,"leve_spec_item":300710,"extra_award":0,"unlock_count":950,"num":0,"items":[16007],"leve_spec_count":1}`|
|17001|`{"version":17,"leve_spec_item":2002,"extra_award":0,"unlock_count":0,"num":0,"items":[17001,17002,17003],"leve_spec_count":10}`|
|17002|`{"version":17,"leve_spec_item":3002,"extra_award":0,"unlock_count":300,"num":0,"items":[17004,17005,17006],"leve_spec_count":10}`|
|17003|`{"version":17,"leve_spec_item":1321200,"extra_award":0,"unlock_count":800,"num":0,"items":[17007,17008,17009],"leve_spec_count":2}`|
|17004|`{"version":17,"leve_spec_item":11200,"extra_award":0,"unlock_count":1500,"num":0,"items":[17010,17011,17012],"leve_spec_count":1}`|
|17005|`{"version":17,"leve_spec_item":24002,"extra_award":0,"unlock_count":2500,"num":0,"items":[17013,17014,17015],"leve_spec_count":3}`|
|17006|`{"version":17,"leve_spec_item":300710,"extra_award":0,"unlock_count":4000,"num":0,"items":[17016,17017,17018],"leve_spec_count":1}`|
|18001|`{"version":18,"leve_spec_item":2781200,"extra_award":0,"unlock_count":0,"num":0,"items":[18001,18002,18003],"leve_spec_count":1}`|
|18002|`{"version":18,"leve_spec_item":1321200,"extra_award":0,"unlock_count":300,"num":0,"items":[18004,18005,18006],"leve_spec_count":2}`|
|18003|`{"version":18,"leve_spec_item":300710,"extra_award":0,"unlock_count":850,"num":0,"items":[18007],"leve_spec_count":1}`|
|19001|`{"version":19,"leve_spec_item":2781200,"extra_award":0,"unlock_count":0,"num":0,"items":[19001,19002,19003],"leve_spec_count":1}`|
|19002|`{"version":19,"leve_spec_item":1321200,"extra_award":0,"unlock_count":300,"num":0,"items":[19004,19005,19006],"leve_spec_count":2}`|
|19003|`{"version":19,"leve_spec_item":300610,"extra_award":0,"unlock_count":850,"num":0,"items":[19007],"leve_spec_count":1}`|
|20001|`{"version":20,"leve_spec_item":2781200,"extra_award":0,"unlock_count":0,"num":0,"items":[20001,20002,20003],"leve_spec_count":1}`|
|20002|`{"version":20,"leve_spec_item":1321200,"extra_award":0,"unlock_count":300,"num":0,"items":[20004,20005,20006],"leve_spec_count":2}`|
|20003|`{"version":20,"leve_spec_item":300710,"extra_award":0,"unlock_count":850,"num":0,"items":[20007],"leve_spec_count":1}`|
|21001|`{"version":21,"leve_spec_item":2781200,"extra_award":0,"unlock_count":0,"num":0,"items":[21001,21002,21003],"leve_spec_count":1}`|
|21002|`{"version":21,"leve_spec_item":1321200,"extra_award":0,"unlock_count":300,"num":0,"items":[21004,21005,21006],"leve_spec_count":2}`|
|21003|`{"version":21,"leve_spec_item":2821200,"extra_award":0,"unlock_count":850,"num":0,"items":[21007],"leve_spec_count":1}`|
|22001|`{"version":22,"leve_spec_item":2781200,"extra_award":0,"unlock_count":0,"num":0,"items":[22001,22002,22003],"leve_spec_count":1}`|
|22002|`{"version":22,"leve_spec_item":1321200,"extra_award":0,"unlock_count":300,"num":0,"items":[22004,22005,22006],"leve_spec_count":2}`|
|22003|`{"version":22,"leve_spec_item":300710,"extra_award":0,"unlock_count":850,"num":0,"items":[22007],"leve_spec_count":1}`|
|23001|`{"version":23,"leve_spec_item":2781200,"extra_award":0,"unlock_count":0,"num":0,"items":[23001,23002,23003],"leve_spec_count":1}`|
|23002|`{"version":23,"leve_spec_item":1321200,"extra_award":0,"unlock_count":300,"num":0,"items":[23004,23005,23006],"leve_spec_count":2}`|
|23003|`{"version":23,"leve_spec_item":300610,"extra_award":0,"unlock_count":850,"num":0,"items":[23007],"leve_spec_count":1}`|
|24001|`{"version":24,"leve_spec_item":2781200,"extra_award":0,"unlock_count":0,"num":0,"items":[24001,24002,24003],"leve_spec_count":1}`|
|24002|`{"version":24,"leve_spec_item":1321200,"extra_award":0,"unlock_count":300,"num":0,"items":[24004,24005,24006],"leve_spec_count":2}`|
|24003|`{"version":24,"leve_spec_item":300710,"extra_award":0,"unlock_count":850,"num":0,"items":[24007],"leve_spec_count":1}`|
|25001|`{"version":25,"leve_spec_item":2781200,"extra_award":0,"unlock_count":0,"num":0,"items":[25001,25002,25003],"leve_spec_count":1}`|
|25002|`{"version":25,"leve_spec_item":1321200,"extra_award":0,"unlock_count":300,"num":0,"items":[25004,25005,25006],"leve_spec_count":2}`|
|25003|`{"version":25,"leve_spec_item":2221200,"extra_award":0,"unlock_count":850,"num":0,"items":[25007],"leve_spec_count":1}`|
|26001|`{"version":26,"leve_spec_item":2781200,"extra_award":0,"unlock_count":0,"num":0,"items":[26001,26002,26003],"leve_spec_count":1}`|
|26002|`{"version":26,"leve_spec_item":1321200,"extra_award":0,"unlock_count":300,"num":0,"items":[26004,26005,26006],"leve_spec_count":2}`|
|26003|`{"version":26,"leve_spec_item":300810,"extra_award":0,"unlock_count":850,"num":0,"items":[26007],"leve_spec_count":1}`|
|27001|`{"version":27,"leve_spec_item":1311200,"extra_award":0,"unlock_count":0,"num":0,"items":[27001,27002,27003],"leve_spec_count":2}`|
|27002|`{"version":27,"leve_spec_item":1311200,"extra_award":0,"unlock_count":300,"num":0,"items":[27004,27005,27006],"leve_spec_count":4}`|
|27003|`{"version":27,"leve_spec_item":3002,"extra_award":0,"unlock_count":800,"num":0,"items":[27007,27008,27009],"leve_spec_count":20}`|
|27004|`{"version":27,"leve_spec_item":431200,"extra_award":0,"unlock_count":1500,"num":0,"items":[27010,27011,27012],"leve_spec_count":60}`|
|27005|`{"version":27,"leve_spec_item":300110,"extra_award":0,"unlock_count":2500,"num":0,"items":[27013,27014,27015],"leve_spec_count":1}`|
|27006|`{"version":27,"leve_spec_item":300610,"extra_award":0,"unlock_count":4000,"num":0,"items":[27016,27017,27018],"leve_spec_count":1}`|
|28001|`{"version":28,"leve_spec_item":2781200,"extra_award":0,"unlock_count":0,"num":0,"items":[28001,28002,28003],"leve_spec_count":1}`|
|28002|`{"version":28,"leve_spec_item":1321200,"extra_award":0,"unlock_count":300,"num":0,"items":[28004,28005,28006],"leve_spec_count":2}`|
|28003|`{"version":28,"leve_spec_item":300810,"extra_award":0,"unlock_count":850,"num":0,"items":[28007],"leve_spec_count":1}`|
|29001|`{"version":29,"leve_spec_item":2781200,"extra_award":0,"unlock_count":0,"num":0,"items":[29001,29002,29003],"leve_spec_count":1}`|
|29002|`{"version":29,"leve_spec_item":1321200,"extra_award":0,"unlock_count":300,"num":0,"items":[29004,29005,29006],"leve_spec_count":2}`|
|29003|`{"version":29,"leve_spec_item":300810,"extra_award":0,"unlock_count":850,"num":0,"items":[29007],"leve_spec_count":1}`|
|30001|`{"version":30,"leve_spec_item":1311200,"extra_award":0,"unlock_count":0,"num":0,"items":[30001,30002,30003],"leve_spec_count":2}`|
|30002|`{"version":30,"leve_spec_item":1311200,"extra_award":0,"unlock_count":300,"num":0,"items":[30004,30005,30006],"leve_spec_count":4}`|
|30003|`{"version":30,"leve_spec_item":3002,"extra_award":0,"unlock_count":800,"num":0,"items":[30007,30008,30009],"leve_spec_count":20}`|
|30004|`{"version":30,"leve_spec_item":431200,"extra_award":0,"unlock_count":1500,"num":0,"items":[30010,30011,30012],"leve_spec_count":60}`|
|30005|`{"version":30,"leve_spec_item":300110,"extra_award":0,"unlock_count":2500,"num":0,"items":[30013,30014,30015],"leve_spec_count":1}`|
|30006|`{"version":30,"leve_spec_item":101200,"extra_award":0,"unlock_count":4000,"num":0,"items":[30016,30017,30018],"leve_spec_count":1}`|

## Exchange

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|380|本表行键；与其他表同值不自动代表同一对象。|
|count|number|380|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|item|number|380|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|currency|number|380|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|group|number|380|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|notice_text|number|380|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|limit_count|number|380|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|gift|array|380|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sign|boolean|380|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|price|number|380|原价格整数；RechargeTable现金商品消费者使用分，其他表必须核币种和单位。|
|order|number|380|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部380行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{"count":90,"item":18002,"group":1,"limit_count":1,"price":300}`|
|1002|`{"count":4000,"item":17002,"group":1,"limit_count":1,"price":300}`|
|1003|`{"count":2,"item":1311200,"group":1,"limit_count":1,"price":300}`|

## ChallengeTask

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|count|array|331|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_special_show|boolean|331|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|331|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|type|number|331|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|331|本表行键；与其他表同值不自动代表同一对象。|
|version|number|331|版本引用；必须按活动类型及其消费者查对应版本表。|
|target|number|331|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|special_show|boolean|331|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部331行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|110001|`{"count":[1688,200],"is_special_show":false,"award":[101500,4401900],"type":0,"version":1,"target":20}`|
|110002|`{"count":[200],"is_special_show":false,"award":[4401900],"type":0,"version":1,"target":60}`|
|110003|`{"count":[10,200],"is_special_show":false,"award":[2002,4401900],"type":0,"version":1,"target":75}`|

## ChallengeGroup

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|count|array|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_award|boolean|30|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award|array|30|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|tid|number|30|本表行键；与其他表同值不自动代表同一对象。|
|version|number|30|版本引用；必须按活动类型及其消费者查对应版本表。|
|tasks|array|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{"count":[],"show_award":true,"award":[],"version":1,"tasks":[110001,110002,110003,110004,110005,110006,110007,110008,110009,110010]}`|
|2001|`{"count":[],"show_award":true,"award":[],"version":2,"tasks":[210001,210002,210003,210004,210005,210006,210007,210008,210009,210010]}`|
|3001|`{"count":[],"show_award":true,"award":[],"version":3,"tasks":[310001,310002,310003,310004,310005,310006,310007,310008,310009,310010]}`|
|4001|`{"count":[],"show_award":true,"award":[],"version":4,"tasks":[410001,410002,410003,410004,410005,410006,410007,410008,410009,410010]}`|
|5001|`{"count":[],"show_award":true,"award":[],"version":5,"tasks":[510001,510002,510003,510004,510005,510006,510007,510008,510009,510010]}`|
|6001|`{"count":[],"show_award":true,"award":[],"version":6,"tasks":[610001,610002,610003,610004,610005,610006,610007,610008,610009,610010]}`|
|7001|`{"count":[],"show_award":true,"award":[],"version":7,"tasks":[710001,710002,710003,710004,710005,710006,710007,710008,710009,710010]}`|
|8001|`{"count":[],"show_award":true,"award":[],"version":8,"tasks":[810001,810002,810003,810004,810005,810006,810007,810008,810009,810010]}`|
|9001|`{"count":[],"show_award":true,"award":[],"version":9,"tasks":[910001,910002,910003,910004,910005,910006,910007,910008,910009,910010]}`|
|10001|`{"count":[],"show_award":true,"award":[],"version":10,"tasks":[1010001,1010002,1010003,1010004,1010005,1010006,1010007,1010008,1010009,1010010]}`|
|11001|`{"count":[],"show_award":true,"award":[],"version":11,"tasks":[1110001,1110002,1110003,1110004,1110005,1110006,1110007,1110008,1110009,1110010]}`|
|12001|`{"count":[],"show_award":true,"award":[],"version":12,"tasks":[1210001,1210002,1210003,1210004,1210005,1210006,1210007,1210008]}`|
|13001|`{"count":[],"show_award":true,"award":[],"version":13,"tasks":[1310001,1310002,1310003,1310004,1310005,1310006,1310007,1310008]}`|
|14001|`{"count":[],"show_award":true,"award":[],"version":14,"tasks":[1410001,1410002,1410003,1410004,1410005,1410006,1410007,1410008,1410009]}`|
|15001|`{"count":[],"show_award":true,"award":[],"version":15,"tasks":[1510001,1510002,1510003,1510004,1510005,1510006,1510007,1510008,1510009,1510010]}`|
|16001|`{"count":[],"show_award":true,"award":[],"version":16,"tasks":[1610001,1610002,1610003,1610004,1610005,1610006,1610007,1610008]}`|
|17001|`{"count":[],"show_award":true,"award":[],"version":17,"tasks":[1710001,1710002,1710003,1710004,1710005,1710006,1710007,1710008,1710009,1710010]}`|
|18001|`{"count":[],"show_award":true,"award":[],"version":18,"tasks":[1810001,1810002,1810003,1810004,1810005,1810006,1810007,1810008]}`|
|19001|`{"count":[],"show_award":true,"award":[],"version":19,"tasks":[1910001,1910002,1910003,1910004,1910005,1910006,1910007,1910008]}`|
|20001|`{"count":[],"show_award":true,"award":[],"version":20,"tasks":[2010001,2010002,2010003,2010004,2010005,2010006,2010007,2010008]}`|
|21001|`{"count":[],"show_award":true,"award":[],"version":21,"tasks":[2110001,2110002,2110003,2110004,2110005,2110006,2110007,2110008]}`|
|22001|`{"count":[],"show_award":true,"award":[],"version":22,"tasks":[2210001,2210002,2210003,2210004,2210005,2210006,2210007,2210008]}`|
|23001|`{"count":[],"show_award":true,"award":[],"version":23,"tasks":[2310001,2310002,2310003,2310004,2310005,2310006,2310007,2310008]}`|
|24001|`{"count":[],"show_award":true,"award":[],"version":24,"tasks":[2410001,2410002,2410003,2410004,2410005,2410006,2410007,2410008]}`|
|25001|`{"count":[],"show_award":true,"award":[],"version":25,"tasks":[2510001,2510002,2510003,2510004,2510005,2510006,2510007,2510008]}`|
|26001|`{"count":[],"show_award":true,"award":[],"version":26,"tasks":[2610001,2610002,2610003,2610004,2610005,2610006,2610007,2610008]}`|
|27001|`{"count":[],"show_award":true,"award":[],"version":27,"tasks":[2710001,2710002,2710003,2710004,2710005,2710006,2710007,2710008,2710009,2710010]}`|
|28001|`{"count":[],"show_award":true,"award":[],"version":28,"tasks":[2810001,2810002,2810003,2810004,2810005,2810006,2810007,2810008]}`|
|29001|`{"count":[],"show_award":true,"award":[],"version":29,"tasks":[2910001,2910002,2910003,2910004,2910005,2910006,2910007,2910008]}`|
|30001|`{"count":[],"show_award":true,"award":[],"version":30,"tasks":[3010001,3010002,3010003,3010004,3010005,3010006,3010007,3010008,3010009,3010010]}`|

## Rank

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|300|本表行键；与其他表同值不自动代表同一对象。|
|version|number|300|版本引用；必须按活动类型及其消费者查对应版本表。|
|award|array|300|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|rank_range|array|300|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{"version":1,"award":[[201500,100000]],"rank_range":[1,1]}`|
|1002|`{"version":1,"award":[[201500,80000]],"rank_range":[2,2]}`|
|1003|`{"version":1,"award":[[201500,60000]],"rank_range":[3,3]}`|
|1004|`{"version":1,"award":[[201500,50000]],"rank_range":[4,10]}`|
|1005|`{"version":1,"award":[[201500,40000]],"rank_range":[11,20]}`|
|1006|`{"version":1,"award":[[201500,30000]],"rank_range":[21,50]}`|
|1007|`{"version":1,"award":[[201500,25000]],"rank_range":[51,100]}`|
|1008|`{"version":1,"award":[[201500,20000]],"rank_range":[101,200]}`|
|1009|`{"version":1,"award":[[201500,15000]],"rank_range":[201,500]}`|
|1010|`{"version":1,"award":[[201500,10000]],"rank_range":[501,2000]}`|
|2001|`{"version":2,"award":[[201500,100000]],"rank_range":[1,1]}`|
|2002|`{"version":2,"award":[[201500,80000]],"rank_range":[2,2]}`|
|2003|`{"version":2,"award":[[201500,60000]],"rank_range":[3,3]}`|
|2004|`{"version":2,"award":[[201500,50000]],"rank_range":[4,10]}`|
|2005|`{"version":2,"award":[[201500,40000]],"rank_range":[11,20]}`|
|2006|`{"version":2,"award":[[201500,30000]],"rank_range":[21,50]}`|
|2007|`{"version":2,"award":[[201500,25000]],"rank_range":[51,100]}`|
|2008|`{"version":2,"award":[[201500,20000]],"rank_range":[101,200]}`|
|2009|`{"version":2,"award":[[201500,15000]],"rank_range":[201,500]}`|
|2010|`{"version":2,"award":[[201500,10000]],"rank_range":[501,1000]}`|
|3001|`{"version":3,"award":[[201500,100000]],"rank_range":[1,1]}`|
|3002|`{"version":3,"award":[[201500,80000]],"rank_range":[2,2]}`|
|3003|`{"version":3,"award":[[201500,60000]],"rank_range":[3,3]}`|
|3004|`{"version":3,"award":[[201500,50000]],"rank_range":[4,10]}`|
|3005|`{"version":3,"award":[[201500,40000]],"rank_range":[11,20]}`|
|3006|`{"version":3,"award":[[201500,30000]],"rank_range":[21,50]}`|
|3007|`{"version":3,"award":[[201500,25000]],"rank_range":[51,100]}`|
|3008|`{"version":3,"award":[[201500,20000]],"rank_range":[101,200]}`|
|3009|`{"version":3,"award":[[201500,15000]],"rank_range":[201,500]}`|
|3010|`{"version":3,"award":[[201500,10000]],"rank_range":[501,1000]}`|
|4001|`{"version":4,"award":[[201500,100000]],"rank_range":[1,1]}`|
|4002|`{"version":4,"award":[[201500,80000]],"rank_range":[2,2]}`|
|4003|`{"version":4,"award":[[201500,60000]],"rank_range":[3,3]}`|
|4004|`{"version":4,"award":[[201500,50000]],"rank_range":[4,10]}`|
|4005|`{"version":4,"award":[[201500,40000]],"rank_range":[11,20]}`|
|4006|`{"version":4,"award":[[201500,30000]],"rank_range":[21,50]}`|
|4007|`{"version":4,"award":[[201500,25000]],"rank_range":[51,100]}`|
|4008|`{"version":4,"award":[[201500,20000]],"rank_range":[101,200]}`|
|4009|`{"version":4,"award":[[201500,15000]],"rank_range":[201,500]}`|
|4010|`{"version":4,"award":[[201500,10000]],"rank_range":[501,1000]}`|
|5001|`{"version":5,"award":[[201500,100000]],"rank_range":[1,1]}`|
|5002|`{"version":5,"award":[[201500,80000]],"rank_range":[2,2]}`|
|5003|`{"version":5,"award":[[201500,60000]],"rank_range":[3,3]}`|
|5004|`{"version":5,"award":[[201500,50000]],"rank_range":[4,10]}`|
|5005|`{"version":5,"award":[[201500,40000]],"rank_range":[11,20]}`|
|5006|`{"version":5,"award":[[201500,30000]],"rank_range":[21,50]}`|
|5007|`{"version":5,"award":[[201500,25000]],"rank_range":[51,100]}`|
|5008|`{"version":5,"award":[[201500,20000]],"rank_range":[101,200]}`|
|5009|`{"version":5,"award":[[201500,15000]],"rank_range":[201,500]}`|
|5010|`{"version":5,"award":[[201500,10000]],"rank_range":[501,1000]}`|
|6001|`{"version":6,"award":[[201500,100000]],"rank_range":[1,1]}`|
|6002|`{"version":6,"award":[[201500,80000]],"rank_range":[2,2]}`|
|6003|`{"version":6,"award":[[201500,60000]],"rank_range":[3,3]}`|
|6004|`{"version":6,"award":[[201500,50000]],"rank_range":[4,10]}`|
|6005|`{"version":6,"award":[[201500,40000]],"rank_range":[11,20]}`|
|6006|`{"version":6,"award":[[201500,30000]],"rank_range":[21,50]}`|
|6007|`{"version":6,"award":[[201500,25000]],"rank_range":[51,100]}`|
|6008|`{"version":6,"award":[[201500,20000]],"rank_range":[101,200]}`|
|6009|`{"version":6,"award":[[201500,15000]],"rank_range":[201,500]}`|
|6010|`{"version":6,"award":[[201500,10000]],"rank_range":[501,1000]}`|
|7001|`{"version":7,"award":[[201500,100000]],"rank_range":[1,1]}`|
|7002|`{"version":7,"award":[[201500,80000]],"rank_range":[2,2]}`|
|7003|`{"version":7,"award":[[201500,60000]],"rank_range":[3,3]}`|
|7004|`{"version":7,"award":[[201500,50000]],"rank_range":[4,10]}`|
|7005|`{"version":7,"award":[[201500,40000]],"rank_range":[11,20]}`|
|7006|`{"version":7,"award":[[201500,30000]],"rank_range":[21,50]}`|
|7007|`{"version":7,"award":[[201500,25000]],"rank_range":[51,100]}`|
|7008|`{"version":7,"award":[[201500,20000]],"rank_range":[101,200]}`|
|7009|`{"version":7,"award":[[201500,15000]],"rank_range":[201,500]}`|
|7010|`{"version":7,"award":[[201500,10000]],"rank_range":[501,1000]}`|
|8001|`{"version":8,"award":[[201500,100000]],"rank_range":[1,1]}`|
|8002|`{"version":8,"award":[[201500,80000]],"rank_range":[2,2]}`|
|8003|`{"version":8,"award":[[201500,60000]],"rank_range":[3,3]}`|
|8004|`{"version":8,"award":[[201500,50000]],"rank_range":[4,10]}`|
|8005|`{"version":8,"award":[[201500,40000]],"rank_range":[11,20]}`|
|8006|`{"version":8,"award":[[201500,30000]],"rank_range":[21,50]}`|
|8007|`{"version":8,"award":[[201500,25000]],"rank_range":[51,100]}`|
|8008|`{"version":8,"award":[[201500,20000]],"rank_range":[101,200]}`|
|8009|`{"version":8,"award":[[201500,15000]],"rank_range":[201,500]}`|
|8010|`{"version":8,"award":[[201500,10000]],"rank_range":[501,1000]}`|
|9001|`{"version":9,"award":[[201500,100000]],"rank_range":[1,1]}`|
|9002|`{"version":9,"award":[[201500,80000]],"rank_range":[2,2]}`|
|9003|`{"version":9,"award":[[201500,60000]],"rank_range":[3,3]}`|
|9004|`{"version":9,"award":[[201500,50000]],"rank_range":[4,10]}`|
|9005|`{"version":9,"award":[[201500,40000]],"rank_range":[11,20]}`|
|9006|`{"version":9,"award":[[201500,30000]],"rank_range":[21,50]}`|
|9007|`{"version":9,"award":[[201500,25000]],"rank_range":[51,100]}`|
|9008|`{"version":9,"award":[[201500,20000]],"rank_range":[101,200]}`|
|9009|`{"version":9,"award":[[201500,15000]],"rank_range":[201,500]}`|
|9010|`{"version":9,"award":[[201500,10000]],"rank_range":[501,1000]}`|
|10001|`{"version":10,"award":[[201500,100000]],"rank_range":[1,1]}`|
|10002|`{"version":10,"award":[[201500,80000]],"rank_range":[2,2]}`|
|10003|`{"version":10,"award":[[201500,60000]],"rank_range":[3,3]}`|
|10004|`{"version":10,"award":[[201500,50000]],"rank_range":[4,10]}`|
|10005|`{"version":10,"award":[[201500,40000]],"rank_range":[11,20]}`|
|10006|`{"version":10,"award":[[201500,30000]],"rank_range":[21,50]}`|
|10007|`{"version":10,"award":[[201500,25000]],"rank_range":[51,100]}`|
|10008|`{"version":10,"award":[[201500,20000]],"rank_range":[101,200]}`|
|10009|`{"version":10,"award":[[201500,15000]],"rank_range":[201,500]}`|
|10010|`{"version":10,"award":[[201500,10000]],"rank_range":[501,1000]}`|
|11001|`{"version":11,"award":[[201500,100000]],"rank_range":[1,1]}`|
|11002|`{"version":11,"award":[[201500,80000]],"rank_range":[2,2]}`|
|11003|`{"version":11,"award":[[201500,60000]],"rank_range":[3,3]}`|
|11004|`{"version":11,"award":[[201500,50000]],"rank_range":[4,10]}`|
|11005|`{"version":11,"award":[[201500,40000]],"rank_range":[11,20]}`|
|11006|`{"version":11,"award":[[201500,30000]],"rank_range":[21,50]}`|
|11007|`{"version":11,"award":[[201500,25000]],"rank_range":[51,100]}`|
|11008|`{"version":11,"award":[[201500,20000]],"rank_range":[101,200]}`|
|11009|`{"version":11,"award":[[201500,15000]],"rank_range":[201,500]}`|
|11010|`{"version":11,"award":[[201500,10000]],"rank_range":[501,1000]}`|
|12001|`{"version":12,"award":[[201500,100000]],"rank_range":[1,1]}`|
|12002|`{"version":12,"award":[[201500,80000]],"rank_range":[2,2]}`|
|12003|`{"version":12,"award":[[201500,60000]],"rank_range":[3,3]}`|
|12004|`{"version":12,"award":[[201500,50000]],"rank_range":[4,10]}`|
|12005|`{"version":12,"award":[[201500,40000]],"rank_range":[11,20]}`|
|12006|`{"version":12,"award":[[201500,30000]],"rank_range":[21,50]}`|
|12007|`{"version":12,"award":[[201500,25000]],"rank_range":[51,100]}`|
|12008|`{"version":12,"award":[[201500,20000]],"rank_range":[101,200]}`|
|12009|`{"version":12,"award":[[201500,15000]],"rank_range":[201,500]}`|
|12010|`{"version":12,"award":[[201500,10000]],"rank_range":[501,1000]}`|
|13001|`{"version":13,"award":[[201500,100000]],"rank_range":[1,1]}`|
|13002|`{"version":13,"award":[[201500,80000]],"rank_range":[2,2]}`|
|13003|`{"version":13,"award":[[201500,60000]],"rank_range":[3,3]}`|
|13004|`{"version":13,"award":[[201500,50000]],"rank_range":[4,10]}`|
|13005|`{"version":13,"award":[[201500,40000]],"rank_range":[11,20]}`|
|13006|`{"version":13,"award":[[201500,30000]],"rank_range":[21,50]}`|
|13007|`{"version":13,"award":[[201500,25000]],"rank_range":[51,100]}`|
|13008|`{"version":13,"award":[[201500,20000]],"rank_range":[101,200]}`|
|13009|`{"version":13,"award":[[201500,15000]],"rank_range":[201,500]}`|
|13010|`{"version":13,"award":[[201500,10000]],"rank_range":[501,1000]}`|
|14001|`{"version":14,"award":[[201500,100000]],"rank_range":[1,1]}`|
|14002|`{"version":14,"award":[[201500,80000]],"rank_range":[2,2]}`|
|14003|`{"version":14,"award":[[201500,60000]],"rank_range":[3,3]}`|
|14004|`{"version":14,"award":[[201500,50000]],"rank_range":[4,10]}`|
|14005|`{"version":14,"award":[[201500,40000]],"rank_range":[11,20]}`|
|14006|`{"version":14,"award":[[201500,30000]],"rank_range":[21,50]}`|
|14007|`{"version":14,"award":[[201500,25000]],"rank_range":[51,100]}`|
|14008|`{"version":14,"award":[[201500,20000]],"rank_range":[101,200]}`|
|14009|`{"version":14,"award":[[201500,15000]],"rank_range":[201,500]}`|
|14010|`{"version":14,"award":[[201500,10000]],"rank_range":[501,1000]}`|
|15001|`{"version":15,"award":[[201500,100000]],"rank_range":[1,1]}`|
|15002|`{"version":15,"award":[[201500,80000]],"rank_range":[2,2]}`|
|15003|`{"version":15,"award":[[201500,60000]],"rank_range":[3,3]}`|
|15004|`{"version":15,"award":[[201500,50000]],"rank_range":[4,10]}`|
|15005|`{"version":15,"award":[[201500,40000]],"rank_range":[11,20]}`|
|15006|`{"version":15,"award":[[201500,30000]],"rank_range":[21,50]}`|
|15007|`{"version":15,"award":[[201500,25000]],"rank_range":[51,100]}`|
|15008|`{"version":15,"award":[[201500,20000]],"rank_range":[101,200]}`|
|15009|`{"version":15,"award":[[201500,15000]],"rank_range":[201,500]}`|
|15010|`{"version":15,"award":[[201500,10000]],"rank_range":[501,1000]}`|
|16001|`{"version":16,"award":[[201500,100000]],"rank_range":[1,1]}`|
|16002|`{"version":16,"award":[[201500,80000]],"rank_range":[2,2]}`|
|16003|`{"version":16,"award":[[201500,60000]],"rank_range":[3,3]}`|
|16004|`{"version":16,"award":[[201500,50000]],"rank_range":[4,10]}`|
|16005|`{"version":16,"award":[[201500,40000]],"rank_range":[11,20]}`|
|16006|`{"version":16,"award":[[201500,30000]],"rank_range":[21,50]}`|
|16007|`{"version":16,"award":[[201500,25000]],"rank_range":[51,100]}`|
|16008|`{"version":16,"award":[[201500,20000]],"rank_range":[101,200]}`|
|16009|`{"version":16,"award":[[201500,15000]],"rank_range":[201,500]}`|
|16010|`{"version":16,"award":[[201500,10000]],"rank_range":[501,1000]}`|
|17001|`{"version":17,"award":[[201500,100000]],"rank_range":[1,1]}`|
|17002|`{"version":17,"award":[[201500,80000]],"rank_range":[2,2]}`|
|17003|`{"version":17,"award":[[201500,60000]],"rank_range":[3,3]}`|
|17004|`{"version":17,"award":[[201500,50000]],"rank_range":[4,10]}`|
|17005|`{"version":17,"award":[[201500,40000]],"rank_range":[11,20]}`|
|17006|`{"version":17,"award":[[201500,30000]],"rank_range":[21,50]}`|
|17007|`{"version":17,"award":[[201500,25000]],"rank_range":[51,100]}`|
|17008|`{"version":17,"award":[[201500,20000]],"rank_range":[101,200]}`|
|17009|`{"version":17,"award":[[201500,15000]],"rank_range":[201,500]}`|
|17010|`{"version":17,"award":[[201500,10000]],"rank_range":[501,1000]}`|
|18001|`{"version":18,"award":[[201500,100000]],"rank_range":[1,1]}`|
|18002|`{"version":18,"award":[[201500,100000]],"rank_range":[1,1]}`|
|18003|`{"version":18,"award":[[201500,100000]],"rank_range":[1,1]}`|
|18004|`{"version":18,"award":[[201500,100000]],"rank_range":[1,1]}`|
|18005|`{"version":18,"award":[[201500,100000]],"rank_range":[1,1]}`|
|18006|`{"version":18,"award":[[201500,100000]],"rank_range":[1,1]}`|
|18007|`{"version":18,"award":[[201500,100000]],"rank_range":[1,1]}`|
|18008|`{"version":18,"award":[[201500,100000]],"rank_range":[1,1]}`|
|18009|`{"version":18,"award":[[201500,100000]],"rank_range":[1,1]}`|
|18010|`{"version":18,"award":[[201500,100000]],"rank_range":[1,1]}`|
|19001|`{"version":19,"award":[[201500,100000]],"rank_range":[1,1]}`|
|19002|`{"version":19,"award":[[201500,100000]],"rank_range":[1,1]}`|
|19003|`{"version":19,"award":[[201500,100000]],"rank_range":[1,1]}`|
|19004|`{"version":19,"award":[[201500,100000]],"rank_range":[1,1]}`|
|19005|`{"version":19,"award":[[201500,100000]],"rank_range":[1,1]}`|
|19006|`{"version":19,"award":[[201500,100000]],"rank_range":[1,1]}`|
|19007|`{"version":19,"award":[[201500,100000]],"rank_range":[1,1]}`|
|19008|`{"version":19,"award":[[201500,100000]],"rank_range":[1,1]}`|
|19009|`{"version":19,"award":[[201500,100000]],"rank_range":[1,1]}`|
|19010|`{"version":19,"award":[[201500,100000]],"rank_range":[1,1]}`|
|20001|`{"version":20,"award":[[201500,100000]],"rank_range":[1,1]}`|
|20002|`{"version":20,"award":[[201500,100000]],"rank_range":[1,1]}`|
|20003|`{"version":20,"award":[[201500,100000]],"rank_range":[1,1]}`|
|20004|`{"version":20,"award":[[201500,100000]],"rank_range":[1,1]}`|
|20005|`{"version":20,"award":[[201500,100000]],"rank_range":[1,1]}`|
|20006|`{"version":20,"award":[[201500,100000]],"rank_range":[1,1]}`|
|20007|`{"version":20,"award":[[201500,100000]],"rank_range":[1,1]}`|
|20008|`{"version":20,"award":[[201500,100000]],"rank_range":[1,1]}`|
|20009|`{"version":20,"award":[[201500,100000]],"rank_range":[1,1]}`|
|20010|`{"version":20,"award":[[201500,100000]],"rank_range":[1,1]}`|
|21001|`{"version":21,"award":[[201500,100000]],"rank_range":[1,1]}`|
|21002|`{"version":21,"award":[[201500,80000]],"rank_range":[2,2]}`|
|21003|`{"version":21,"award":[[201500,60000]],"rank_range":[3,3]}`|
|21004|`{"version":21,"award":[[201500,50000]],"rank_range":[4,10]}`|
|21005|`{"version":21,"award":[[201500,40000]],"rank_range":[11,20]}`|
|21006|`{"version":21,"award":[[201500,30000]],"rank_range":[21,50]}`|
|21007|`{"version":21,"award":[[201500,25000]],"rank_range":[51,100]}`|
|21008|`{"version":21,"award":[[201500,20000]],"rank_range":[101,200]}`|
|21009|`{"version":21,"award":[[201500,15000]],"rank_range":[201,500]}`|
|21010|`{"version":21,"award":[[201500,10000]],"rank_range":[501,1000]}`|
|22001|`{"version":22,"award":[[201500,100000]],"rank_range":[1,1]}`|
|22002|`{"version":22,"award":[[201500,80000]],"rank_range":[2,2]}`|
|22003|`{"version":22,"award":[[201500,60000]],"rank_range":[3,3]}`|
|22004|`{"version":22,"award":[[201500,50000]],"rank_range":[4,10]}`|
|22005|`{"version":22,"award":[[201500,40000]],"rank_range":[11,20]}`|
|22006|`{"version":22,"award":[[201500,30000]],"rank_range":[21,50]}`|
|22007|`{"version":22,"award":[[201500,25000]],"rank_range":[51,100]}`|
|22008|`{"version":22,"award":[[201500,20000]],"rank_range":[101,200]}`|
|22009|`{"version":22,"award":[[201500,15000]],"rank_range":[201,500]}`|
|22010|`{"version":22,"award":[[201500,10000]],"rank_range":[501,1000]}`|
|23001|`{"version":23,"award":[[201500,100000]],"rank_range":[1,1]}`|
|23002|`{"version":23,"award":[[201500,80000]],"rank_range":[2,2]}`|
|23003|`{"version":23,"award":[[201500,60000]],"rank_range":[3,3]}`|
|23004|`{"version":23,"award":[[201500,50000]],"rank_range":[4,10]}`|
|23005|`{"version":23,"award":[[201500,40000]],"rank_range":[11,20]}`|
|23006|`{"version":23,"award":[[201500,30000]],"rank_range":[21,50]}`|
|23007|`{"version":23,"award":[[201500,25000]],"rank_range":[51,100]}`|
|23008|`{"version":23,"award":[[201500,20000]],"rank_range":[101,200]}`|
|23009|`{"version":23,"award":[[201500,15000]],"rank_range":[201,500]}`|
|23010|`{"version":23,"award":[[201500,10000]],"rank_range":[501,1000]}`|
|24001|`{"version":24,"award":[[201500,100000]],"rank_range":[1,1]}`|
|24002|`{"version":24,"award":[[201500,80000]],"rank_range":[2,2]}`|
|24003|`{"version":24,"award":[[201500,60000]],"rank_range":[3,3]}`|
|24004|`{"version":24,"award":[[201500,50000]],"rank_range":[4,10]}`|
|24005|`{"version":24,"award":[[201500,40000]],"rank_range":[11,20]}`|
|24006|`{"version":24,"award":[[201500,30000]],"rank_range":[21,50]}`|
|24007|`{"version":24,"award":[[201500,25000]],"rank_range":[51,100]}`|
|24008|`{"version":24,"award":[[201500,20000]],"rank_range":[101,200]}`|
|24009|`{"version":24,"award":[[201500,15000]],"rank_range":[201,500]}`|
|24010|`{"version":24,"award":[[201500,10000]],"rank_range":[501,1000]}`|
|25001|`{"version":25,"award":[[201500,100000]],"rank_range":[1,1]}`|
|25002|`{"version":25,"award":[[201500,80000]],"rank_range":[2,2]}`|
|25003|`{"version":25,"award":[[201500,60000]],"rank_range":[3,3]}`|
|25004|`{"version":25,"award":[[201500,50000]],"rank_range":[4,10]}`|
|25005|`{"version":25,"award":[[201500,40000]],"rank_range":[11,20]}`|
|25006|`{"version":25,"award":[[201500,30000]],"rank_range":[21,50]}`|
|25007|`{"version":25,"award":[[201500,25000]],"rank_range":[51,100]}`|
|25008|`{"version":25,"award":[[201500,20000]],"rank_range":[101,200]}`|
|25009|`{"version":25,"award":[[201500,15000]],"rank_range":[201,500]}`|
|25010|`{"version":25,"award":[[201500,10000]],"rank_range":[501,1000]}`|
|26001|`{"version":26,"award":[[201500,100000]],"rank_range":[1,1]}`|
|26002|`{"version":26,"award":[[201500,80000]],"rank_range":[2,2]}`|
|26003|`{"version":26,"award":[[201500,60000]],"rank_range":[3,3]}`|
|26004|`{"version":26,"award":[[201500,50000]],"rank_range":[4,10]}`|
|26005|`{"version":26,"award":[[201500,40000]],"rank_range":[11,20]}`|
|26006|`{"version":26,"award":[[201500,30000]],"rank_range":[21,50]}`|
|26007|`{"version":26,"award":[[201500,25000]],"rank_range":[51,100]}`|
|26008|`{"version":26,"award":[[201500,20000]],"rank_range":[101,200]}`|
|26009|`{"version":26,"award":[[201500,15000]],"rank_range":[201,500]}`|
|26010|`{"version":26,"award":[[201500,10000]],"rank_range":[501,1000]}`|
|27001|`{"version":27,"award":[[201500,100000]],"rank_range":[1,1]}`|
|27002|`{"version":27,"award":[[201500,80000]],"rank_range":[2,2]}`|
|27003|`{"version":27,"award":[[201500,60000]],"rank_range":[3,3]}`|
|27004|`{"version":27,"award":[[201500,50000]],"rank_range":[4,10]}`|
|27005|`{"version":27,"award":[[201500,40000]],"rank_range":[11,20]}`|
|27006|`{"version":27,"award":[[201500,30000]],"rank_range":[21,50]}`|
|27007|`{"version":27,"award":[[201500,25000]],"rank_range":[51,100]}`|
|27008|`{"version":27,"award":[[201500,20000]],"rank_range":[101,200]}`|
|27009|`{"version":27,"award":[[201500,15000]],"rank_range":[201,500]}`|
|27010|`{"version":27,"award":[[201500,10000]],"rank_range":[501,1000]}`|
|28001|`{"version":28,"award":[[201500,100000]],"rank_range":[1,1]}`|
|28002|`{"version":28,"award":[[201500,80000]],"rank_range":[2,2]}`|
|28003|`{"version":28,"award":[[201500,60000]],"rank_range":[3,3]}`|
|28004|`{"version":28,"award":[[201500,50000]],"rank_range":[4,10]}`|
|28005|`{"version":28,"award":[[201500,40000]],"rank_range":[11,20]}`|
|28006|`{"version":28,"award":[[201500,30000]],"rank_range":[21,50]}`|
|28007|`{"version":28,"award":[[201500,25000]],"rank_range":[51,100]}`|
|28008|`{"version":28,"award":[[201500,20000]],"rank_range":[101,200]}`|
|28009|`{"version":28,"award":[[201500,15000]],"rank_range":[201,500]}`|
|28010|`{"version":28,"award":[[201500,10000]],"rank_range":[501,1000]}`|
|29001|`{"version":29,"award":[[201500,100000]],"rank_range":[1,1]}`|
|29002|`{"version":29,"award":[[201500,80000]],"rank_range":[2,2]}`|
|29003|`{"version":29,"award":[[201500,60000]],"rank_range":[3,3]}`|
|29004|`{"version":29,"award":[[201500,50000]],"rank_range":[4,10]}`|
|29005|`{"version":29,"award":[[201500,40000]],"rank_range":[11,20]}`|
|29006|`{"version":29,"award":[[201500,30000]],"rank_range":[21,50]}`|
|29007|`{"version":29,"award":[[201500,25000]],"rank_range":[51,100]}`|
|29008|`{"version":29,"award":[[201500,20000]],"rank_range":[101,200]}`|
|29009|`{"version":29,"award":[[201500,15000]],"rank_range":[201,500]}`|
|29010|`{"version":29,"award":[[201500,10000]],"rank_range":[501,1000]}`|
|30001|`{"version":30,"award":[[201500,100000]],"rank_range":[1,1]}`|
|30002|`{"version":30,"award":[[201500,80000]],"rank_range":[2,2]}`|
|30003|`{"version":30,"award":[[201500,60000]],"rank_range":[3,3]}`|
|30004|`{"version":30,"award":[[201500,50000]],"rank_range":[4,10]}`|
|30005|`{"version":30,"award":[[201500,40000]],"rank_range":[11,20]}`|
|30006|`{"version":30,"award":[[201500,30000]],"rank_range":[21,50]}`|
|30007|`{"version":30,"award":[[201500,25000]],"rank_range":[51,100]}`|
|30008|`{"version":30,"award":[[201500,20000]],"rank_range":[101,200]}`|
|30009|`{"version":30,"award":[[201500,15000]],"rank_range":[201,500]}`|
|30010|`{"version":30,"award":[[201500,10000]],"rank_range":[501,1000]}`|

## Gift

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|condition_max|number|315|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|buy_cycle_limit|number|315|Recharge购买周期引用；不是允许购买次数本身。|
|can_buy_times|number|315|原可购次数字段；0含义必须结合类型处理器，不默认无限。|
|condition_total|number|315|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|315|本表行键；与其他表同值不自动代表同一对象。|
|is_fast_buy|boolean|315|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_rule|number|315|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|order|number|315|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|activity_id|number|315|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|day_add_times|number|315|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|version|number|315|版本引用；必须按活动类型及其消费者查对应版本表。|
|show_effect|string|315|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部315行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|510001|`{"condition_max":0,"buy_cycle_limit":0,"can_buy_times":1,"condition_total":0,"is_fast_buy":true,"day_add_times":1,"version":1}`|
|510002|`{"condition_max":0,"buy_cycle_limit":0,"can_buy_times":2,"condition_total":0,"is_fast_buy":true,"day_add_times":0,"version":1}`|
|510003|`{"condition_max":0,"buy_cycle_limit":0,"can_buy_times":1,"condition_total":0,"is_fast_buy":true,"day_add_times":0,"version":1}`|

## UIInfo

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|custom_exchange|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_show|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hunt_show|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rank_desc|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|title|array|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|form_bg|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|gift_show|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|popup_bg|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"custom_exchange":3,"task_show":3,"rank_desc":59504}`|
|2|`{"custom_exchange":1,"task_show":2,"rank_desc":59504}`|
|3|`{"custom_exchange":2,"task_show":1,"rank_desc":59504}`|
|4|`{"custom_exchange":4,"task_show":4,"rank_desc":59505}`|
|5|`{"custom_exchange":2,"task_show":1,"rank_desc":59504}`|

## Sub

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|cost_item|number|18|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|page_idx|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|open_func|object|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|18|本表行键；与其他表同值不自动代表同一对象。|
|title|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|before_func|undefined/object|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|normal_icon|string|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|select_icon|string|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|red_dot|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"cost_item":173002,"open_func":{"reference":"TreasureHuntScene.StaticOpen"},"type":1,"select_icon":"img_syxb_xunbao.png"}`|
|2|`{"cost_item":4401900,"open_func":{"reference":"TreasureServerTaskForm.StaticOpen"},"type":2,"select_icon":"img_hdqy_renwu.png"}`|
|3|`{"cost_item":401500,"open_func":{"reference":"TreasureGiftForm.StaticOpen"},"type":3,"select_icon":"img_bb_an_saishibujii2.png"}`|
|4|`{"cost_item":4401900,"open_func":{"reference":"TreasureExchangeForm.StaticOpen"},"type":4,"select_icon":"img_btslm_duihuan.png"}`|
|5|`{"cost_item":0,"open_func":{"reference":"TreasureRankForm.StaticOpen"},"type":5,"select_icon":"icon_dsthd_paihang2.png"}`|
|6|`{"cost_item":0,"open_func":{"reference":"ThemeOreHuntForm.StaticOpen"},"type":1,"select_icon":"img_syxb_xunbao.png"}`|
|7|`{"cost_item":0,"open_func":{"reference":"ThemeDrawForm.StaticOpen"},"type":1,"before_func":{"reference":"ThemeTreasureUILogic.OpenDrawForm"},"select_icon":"img_syxb_xunbao.png"}`|
|8|`{"cost_item":0,"open_func":{"reference":"TreasureDrawTaskForm.StaticOpen"},"type":2,"before_func":{"reference":"ThemeTreasureUILogic.OpenOtherForm"},"select_icon":"img_syxb_tiaozhan.png"}`|
|9|`{"cost_item":0,"open_func":{"reference":"TreasureDrawGiftForm.StaticOpen"},"type":3,"before_func":{"reference":"ThemeTreasureUILogic.OpenOtherForm"},"select_icon":"img_syxb_libao.png"}`|
|10|`{"cost_item":0,"open_func":{"reference":"TreasureDrawExchangeForm.StaticOpen"},"type":4,"before_func":{"reference":"ThemeTreasureUILogic.OpenOtherForm"},"select_icon":"img_syxb_duihuan.png"}`|
|11|`{"cost_item":0,"open_func":{"reference":"TreasureRankForm.StaticOpen"},"type":5,"select_icon":"icon_dsthd_paihang2.png"}`|
|12|`{"cost_item":0,"open_func":{"reference":"ThemePetDrawForm.StaticOpen"},"type":1,"before_func":{"reference":"ThemeTreasureUILogic.OpenPetDraw"},"select_icon":"img_syxb_xunbao.png"}`|
|13|`{"cost_item":0,"open_func":{"reference":"TreasurePetTaskForm.StaticOpen"},"type":2,"select_icon":"img_syxb_tiaozhan.png"}`|
|14|`{"cost_item":0,"open_func":{"reference":"TreasurePetGiftForm.StaticOpen"},"type":3,"select_icon":"img_syxb_libao.png"}`|
|15|`{"cost_item":0,"open_func":{"reference":"TreasurePetExchangeForm.StaticOpen"},"type":4,"select_icon":"img_syxb_duihuan.png"}`|
|16|`{"cost_item":0,"open_func":{"reference":"TreasureRankForm.StaticOpen"},"type":5,"select_icon":"icon_dsthd_paihang2.png"}`|
|17|`{"cost_item":0,"open_func":{"reference":"TreasureDailyTaskForm.StaticOpen"},"type":6,"select_icon":"img_syxb_tiaozhan.png"}`|
|18|`{"cost_item":4401900,"open_func":{"reference":"TreasureExchangeNewForm.StaticOpen"},"type":4,"select_icon":"img_btslm_duihuan.png"}`|

## ExchangeShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|move_dis|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cover_text|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|covert_bg|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|form_bg|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|def_pos|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|move_bg|boolean|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|

## HuntShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|button_txt|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|special_award|number|4|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|self_progress|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|server_progress|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bubble_bg|array|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"special_award":62531,"self_progress":64745,"server_progress":55304}`|
|2|`{"special_award":56149,"self_progress":56148,"server_progress":56147}`|
|3|`{"special_award":56149,"self_progress":56148,"server_progress":56147}`|
|4|`{"special_award":56149,"self_progress":56148,"server_progress":56147}`|

## TaskShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|task_desc|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_text_normal|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_text_select|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_btn_bg|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|form_bg|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"task_desc":64745,"task_text_normal":5017,"task_text_select":6025,"task_btn_bg":"img_dsthd_wmtz_wxz.png"}`|
|2|`{"task_desc":56150,"task_text_normal":5030,"task_text_select":5003,"task_btn_bg":"img_ccxb_grtz_wxz.png"}`|
|3|`{"task_desc":55395,"task_text_normal":5017,"task_text_select":6025,"task_btn_bg":"img_ccxb_grtz_wxz.png"}`|
|4|`{"task_desc":55395,"task_text_normal":5017,"task_text_select":6025,"task_btn_bg":"img_ccxb_grtz_wxz.png"}`|

## OreStyle

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|normal_item_prefab|string|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|back_prefab|string|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|road_prefab|string|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|special_item_prefab|string|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|2001|`{"normal_item_prefab":"CS_NormalItem.prefab","special_item_prefab":"CS_Treasurebox.prefab"}`|
|2002|`{"normal_item_prefab":"CS_NormalItem.prefab","special_item_prefab":"CS_Treasurebox.prefab"}`|

## HuntCellEffect

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|2002|`{}`|
|33002|`{}`|
|423002|`{}`|

## TowerStyle

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|normal_item_prefab|string|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|dice_prefab|string|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|back_prefab|string|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|road_prefab|string|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|special_item_prefab|string|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{"normal_item_prefab":"TreasureHuntSceneAwardNode.prefab","special_item_prefab":"TreasureHuntSceneAwardNode.prefab"}`|
|1002|`{"normal_item_prefab":"TreasureHuntSceneAwardNode.prefab","special_item_prefab":"TreasureHuntSceneAwardNode.prefab"}`|

## GiftShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|form_bg|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
