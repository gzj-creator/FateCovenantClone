# VoteActTable 规则参数

来源：[personal-server/assets/tables/VoteActTable.data.lua.json.gz](../../../../personal-server/assets/tables/VoteActTable.data.lua.json.gz)，SHA256：`ce18f519f8646e3ae6d4042bbe187382d92b957ad95b4cbb95b857eb95ff37bc`。

[完整逐行JSON](VoteActTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Task](#task)|5|decoded-rows|
|[Group](#group)|10|decoded-rows|
|[SubStage](#substage)|4|decoded-rows|
|[Object](#object)|50|decoded-rows|
|[Blind](#blind)|10|decoded-rows|
|[Guess](#guess)|4|decoded-rows|
|[Version](#version)|1|decoded-rows|
|[ProgressAward](#progressaward)|5|decoded-rows|
|[Config](#config)|1|decoded-rows|
|[Stage](#stage)|3|decoded-rows|

## Task

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|task_count|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|5|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|task_type|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_des|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|version|number|5|版本引用；必须按活动类型及其消费者查对应版本表。|
|task_param|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"task_count":1,"award":[[680002,1]],"task_type":1803,"task_des":678285,"version":1,"task_param":0}`|
|102|`{"task_count":40,"award":[[680002,1]],"task_type":4701,"task_des":678286,"version":1,"task_param":0}`|
|103|`{"task_count":80,"award":[[680002,1]],"task_type":4701,"task_des":678286,"version":1,"task_param":0}`|
|104|`{"task_count":120,"award":[[680002,1]],"task_type":4701,"task_des":678286,"version":1,"task_param":0}`|
|105|`{"task_count":160,"award":[[680002,1]],"task_type":4701,"task_des":678286,"version":1,"task_param":0}`|

## Group

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|object_list|array|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|version|number|10|版本引用；必须按活动类型及其消费者查对应版本表。|
|ret_object_list|array|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|group_name|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|10|本表行键；与其他表同值不自动代表同一对象。|
|select|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"version":1,"group_name":678154,"select":3}`|
|102|`{"version":1,"group_name":678155,"select":3}`|
|103|`{"version":1,"group_name":678156,"select":3}`|
|104|`{"version":1,"group_name":678157,"select":3}`|
|105|`{"version":1,"group_name":678158,"select":3}`|
|106|`{"version":1,"group_name":678159,"select":3}`|
|107|`{"version":1,"group_name":678160,"select":2}`|
|108|`{"version":1,"group_name":678161,"select":2}`|
|109|`{"version":1,"group_name":678162,"select":2}`|
|110|`{"version":1,"group_name":678163,"select":2}`|

## SubStage

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|start_sec|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|group|array|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|blind_award|array|4|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|blind_times|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|version|number|4|版本引用；必须按活动类型及其消费者查对应版本表。|
|end_sec|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"start_sec":0,"group":[101,102,103],"blind_award":[[680002,2]],"blind_times":12,"version":1}`|
|102|`{"start_sec":86400,"group":[104,105,106],"blind_award":[[680002,2]],"blind_times":13,"version":1}`|
|103|`{"start_sec":172800,"group":[107,108,109],"blind_award":[[680002,2]],"blind_times":9,"version":1}`|
|104|`{"start_sec":345600,"group":[110],"blind_award":[[680002,2]],"blind_times":3,"version":1}`|

## Object

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|init_popular|number|50|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|blind_scale_l|undefined|50|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pull_vote_des|number|50|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|blind_scale_r|undefined|50|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|50|本表行键；与其他表同值不自动代表同一对象。|
|settle_pos|array|50|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|settle_scale|array|50|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|blind_pos_l|undefined|50|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|success_vote_des|number|50|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|blind_pos_r|undefined|50|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|object|number|50|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"init_popular":0}`|
|2|`{"init_popular":0}`|
|3|`{"init_popular":0}`|
|4|`{"init_popular":0}`|
|5|`{"init_popular":0}`|
|6|`{"init_popular":0}`|
|7|`{"init_popular":0}`|
|8|`{"init_popular":0}`|
|9|`{"init_popular":0}`|
|10|`{"init_popular":0}`|
|11|`{"init_popular":0}`|
|12|`{"init_popular":0}`|
|13|`{"init_popular":0}`|
|14|`{"init_popular":0}`|
|15|`{"init_popular":0}`|
|16|`{"init_popular":0}`|
|17|`{"init_popular":0}`|
|18|`{"init_popular":0}`|
|19|`{"init_popular":0}`|
|20|`{"init_popular":0}`|
|21|`{"init_popular":0}`|
|22|`{"init_popular":0}`|
|23|`{"init_popular":0}`|
|24|`{"init_popular":0}`|
|25|`{"init_popular":0}`|
|26|`{"init_popular":0}`|
|27|`{"init_popular":0}`|
|28|`{"init_popular":0}`|
|29|`{"init_popular":0}`|
|30|`{"init_popular":0}`|
|31|`{"init_popular":0}`|
|32|`{"init_popular":0}`|
|33|`{"init_popular":0}`|
|34|`{"init_popular":0}`|
|35|`{"init_popular":0}`|
|36|`{"init_popular":0}`|
|37|`{"init_popular":0}`|
|38|`{"init_popular":0}`|
|39|`{"init_popular":0}`|
|40|`{"init_popular":0}`|
|41|`{"init_popular":0}`|
|42|`{"init_popular":0}`|
|43|`{"init_popular":0}`|
|44|`{"init_popular":0}`|
|45|`{"init_popular":0}`|
|46|`{"init_popular":0}`|
|47|`{"init_popular":0}`|
|48|`{"init_popular":0}`|
|49|`{"init_popular":0}`|
|50|`{"init_popular":0}`|

## Blind

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|10|本表行键；与其他表同值不自动代表同一对象。|
|blind_group|array|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"blind_group":[[1,2],[3,4],[5,6],[7,8]]}`|
|102|`{"blind_group":[[9,10],[11,12],[13,14],[15,16]]}`|
|103|`{"blind_group":[[17,18],[19,20],[21,22],[23,24]]}`|
|104|`{"blind_group":[[25,26],[27,28],[29,30],[31,32]]}`|
|105|`{"blind_group":[[33,34],[35,36],[37,38],[39,40]]}`|
|106|`{"blind_group":[[41,42],[43,44],[45,46],[47,48],[49,50]]}`|
|107|`{"blind_group":[[1,2],[9,10],[3,11]]}`|
|108|`{"blind_group":[[17,18],[19,25],[26,27]]}`|
|109|`{"blind_group":[[33,34],[41,43],[35,42]]}`|
|110|`{"blind_group":[[1,25],[9,17],[33,41]]}`|

## Guess

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|award_name|number|4|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award_desc|number|4|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award|array|4|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|version|number|4|版本引用；必须按活动类型及其消费者查对应版本表。|
|cnt|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"award_name":678144,"award_desc":669224,"award":[[3221200,10]],"version":1}`|
|102|`{"award_name":678143,"award_desc":669223,"award":[[3221200,12]],"version":1}`|
|103|`{"award_name":678142,"award_desc":669222,"award":[[3221200,14]],"version":1}`|
|104|`{"award_name":678141,"award_desc":669221,"award":[[3221200,16]],"version":1}`|

## Version

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|covert_item_num|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|covert_item|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|obj|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cost_item|number|1|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|final_vote_red|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|vote_award|array|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|other_vote_red|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|daily_task_red|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|guess_end_sec|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|guess_cnt|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pro_task_red|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"covert_item_num":100,"covert_item":201500,"cost_item":680002,"vote_award":[[3231200,1],[679002,1]],"daily_task_red":174730714661,"pro_task_red":174730711275}`|

## ProgressAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|version|number|5|版本引用；必须按活动类型及其消费者查对应版本表。|
|cnt|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|5|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"version":1,"award":[[101500,100]]}`|
|102|`{"version":1,"award":[[101500,300]]}`|
|103|`{"version":1,"award":[[101500,520]]}`|
|104|`{"version":1,"award":[[207708,1],[681002,1]]}`|
|105|`{"version":1,"award":[[101500,520]]}`|

## Config

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|left_ro|undefined|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|right_loc|undefined|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|right_ro|undefined|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|left_loc|undefined|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|right_scale|undefined|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|left_scale|undefined|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|blind_form_bg|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|

## Stage

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|start_sec|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|stage_type|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sub_stage|array|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|version|number|3|版本引用；必须按活动类型及其消费者查对应版本表。|
|end_sec|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"start_sec":0,"stage_type":1,"sub_stage":[101,102],"version":1}`|
|102|`{"start_sec":172800,"stage_type":2,"sub_stage":[103],"version":1}`|
|103|`{"start_sec":345600,"stage_type":3,"sub_stage":[104],"version":1}`|
