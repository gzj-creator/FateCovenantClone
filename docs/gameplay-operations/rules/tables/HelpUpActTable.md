# HelpUpActTable 规则参数

来源：[personal-server/assets/tables/HelpUpActTable.data.lua.json.gz](../../../../personal-server/assets/tables/HelpUpActTable.data.lua.json.gz)，SHA256：`e548f4dd622b28bff69b40ae6f2ae114912dca609537d49ba76c98e193f91df3`。

[完整逐行JSON](HelpUpActTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Task](#task)|4|decoded-rows|
|[Show](#show)|1|decoded-rows|
|[Version](#version)|1|decoded-rows|
|[FakeChannel](#fakechannel)|4|decoded-rows|
|[FakeShow](#fakeshow)|3|decoded-rows|
|[Stage](#stage)|3|decoded-rows|
|[Award](#award)|16|decoded-rows|

## Task

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|jump_func|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|4|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|task_type|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|belonging_version|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|task_name|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cycle_type|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|target_count|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_param|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sort|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"jump_func":30203,"award":[[834102,5]],"task_type":100816,"belonging_version":1,"task_name":689047,"cycle_type":1,"target_count":1,"task_param":0}`|
|102|`{"jump_func":3121,"award":[[834102,5]],"task_type":6712,"belonging_version":1,"task_name":692636,"cycle_type":1,"target_count":1,"task_param":0}`|
|103|`{"jump_func":17,"award":[[834102,5]],"task_type":4701,"belonging_version":1,"task_name":57884,"cycle_type":1,"target_count":100,"task_param":0}`|
|104|`{"jump_func":11,"award":[[834102,5]],"task_type":8301,"belonging_version":1,"task_name":60919,"cycle_type":1,"target_count":100,"task_param":0}`|

## Show

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|fake_channel|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|envelope_title|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fake_item_num_multi|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|envelope_signature|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|help_times_interval|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|envelope_content|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|txt_preview_desc|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fake_group|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fake_channel_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fake_official_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|txt_slogan|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_slogan|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_bg|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"fake_item_num_multi":5,"fake_group":1,"fake_channel_count":200,"fake_official_count":1397}`|

## Version

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|award_group|number|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|cost_item|number|1|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|stage_library|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fake_gen_end_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|help_times|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fake_gen_interval|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fake_gen_num|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|recycle_mail_tid|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fake_gen_start_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_library|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cost_item_max|number|1|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award_group":1,"cost_item":834102,"stage_library":1,"fake_gen_end_time":79200,"fake_gen_interval":1,"fake_gen_num":60,"recycle_mail_tid":9501400,"fake_gen_start_time":28800,"task_library":1,"cost_item_max":10}`|

## FakeChannel

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|group|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|prefix|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|channel_count|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"group":1,"prefix":"S","channel_count":1429}`|
|102|`{"group":1,"prefix":"Y","channel_count":1215}`|
|103|`{"group":1,"prefix":"H","channel_count":22}`|
|104|`{"group":1,"prefix":"X","channel_count":17}`|

## FakeShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|group|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|weight|number|3|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|
|multi|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"group":1,"weight":6}`|
|102|`{"group":1,"weight":3}`|
|103|`{"group":1,"weight":1}`|

## Stage

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|ani_pendant_thanks|string|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ani_thanks|string|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|3|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|img_stage|string|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|hero|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|effect_bg|string|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|star|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ani_interact|string|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ani_pendant_interact|string|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|stage|number|3|ActFrame阶段引用数组；不同于旧Activity.state。|
|stage_name|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_bg|string|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|belonging_version|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|time_ani_interact|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|talk_style|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|txt_interact|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|txt_thanks|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|stage_num|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"award":[[5111200,5],[3401200,1]],"hero":3030501,"star":5,"stage":1,"stage_name":691006,"belonging_version":1,"time_ani_interact":3.5,"stage_num":5000000}`|
|102|`{"award":[[3021200,3],[10064100,5]],"hero":5040701,"star":4,"stage":2,"stage_name":691007,"belonging_version":1,"time_ani_interact":3.5,"stage_num":10000000}`|
|103|`{"award":[[25500704,20],[835702,1]],"hero":5040701,"star":6,"stage":3,"stage_name":691008,"belonging_version":1,"time_ani_interact":3.5,"stage_num":15000000}`|

## Award

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|group|number|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|16|本表行键；与其他表同值不自动代表同一对象。|
|weight|number|16|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|
|award|array|16|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"group":1,"weight":100,"award":[[101500,88]]}`|
|102|`{"group":1,"weight":100,"award":[[392002,1]]}`|
|103|`{"group":1,"weight":100,"award":[[20002,1]]}`|
|104|`{"group":1,"weight":100,"award":[[21002,8]]}`|
|105|`{"group":1,"weight":100,"award":[[901900,88]]}`|
|106|`{"group":1,"weight":100,"award":[[17002,88]]}`|
|107|`{"group":1,"weight":100,"award":[[18002,3]]}`|
|108|`{"group":1,"weight":100,"award":[[179002,8]]}`|
|109|`{"group":1,"weight":100,"award":[[493002,8]]}`|
|110|`{"group":1,"weight":100,"award":[[501002,88]]}`|
|111|`{"group":1,"weight":100,"award":[[101800,8888]]}`|
|112|`{"group":1,"weight":100,"award":[[157002,8888]]}`|
|113|`{"group":1,"weight":100,"award":[[31002,8]]}`|
|114|`{"group":1,"weight":100,"award":[[139002,8]]}`|
|115|`{"group":1,"weight":100,"award":[[391002,88]]}`|
|116|`{"group":1,"weight":100,"award":[[201500,8888]]}`|
