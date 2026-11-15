# SpringFestivalActTable 规则参数

来源：[personal-server/assets/tables/SpringFestivalActTable.data.lua.json.gz](../../../../personal-server/assets/tables/SpringFestivalActTable.data.lua.json.gz)，SHA256：`dd0a7347adb94058ee6a1a762d630cef4207fc30eb31c1b4ed88b1fdd93e0458`。

[完整逐行JSON](SpringFestivalActTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Period](#period)|1|decoded-rows|
|[ShopAward](#shopaward)|9|decoded-rows|
|[DailyAwad](#dailyawad)|102|decoded-rows|
|[FormJumpVersion](#formjumpversion)|2|rows-with-external-references|
|[ShopItem](#shopitem)|10|decoded-rows|
|[DressAward](#dressaward)|3|decoded-rows|
|[Msg](#msg)|4|decoded-rows|
|[Dress](#dress)|1|decoded-rows|
|[Preview](#preview)|5|decoded-rows|
|[Gift](#gift)|5|decoded-rows|

## Period

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|appearance_act|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tip_show_max_count|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|convert_src_item|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|collect_exchange_act|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|divide_sec|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|acc_recharge_tip_show_sec|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|jump_version|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tip_show_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|entry_title|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|convert_param|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|appearance_act_entry|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|act_finance|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|acc_recharge_tip_show_times|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|convert_new_item|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|116001|`{"tip_show_max_count":4,"convert_src_item":[603002,620002],"collect_exchange_act":[114001,114002,114003],"jump_version":1,"tip_show_time":4,"convert_param":[10,1000],"acc_recharge_tip_show_times":6,"convert_new_item":[101500,101500]}`|

## ShopAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|9|本表行键；与其他表同值不自动代表同一对象。|
|version|number|9|版本引用；必须按活动类型及其消费者查对应版本表。|
|cost_diamond|number|9|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|award|array|9|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"version":1,"cost_diamond":1000,"award":[[603002,2]]}`|
|102|`{"version":1,"cost_diamond":6000,"award":[[603002,3]]}`|
|103|`{"version":1,"cost_diamond":12000,"award":[[603002,5]]}`|
|104|`{"version":1,"cost_diamond":18000,"award":[[603002,5]]}`|
|105|`{"version":1,"cost_diamond":24000,"award":[[603002,5]]}`|
|106|`{"version":1,"cost_diamond":30000,"award":[[603002,5]]}`|
|107|`{"version":1,"cost_diamond":36000,"award":[[603002,5]]}`|
|108|`{"version":1,"cost_diamond":42000,"award":[[603002,5]]}`|
|109|`{"version":1,"cost_diamond":50000,"award":[[603002,5]]}`|

## DailyAwad

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|102|本表行键；与其他表同值不自动代表同一对象。|
|dress_daily_award|array|102|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10001|`{"dress_daily_award":[[602002,1]]}`|
|10002|`{"dress_daily_award":[[602002,1]]}`|
|10003|`{"dress_daily_award":[[602002,1]]}`|
|10004|`{"dress_daily_award":[[602002,1]]}`|
|10005|`{"dress_daily_award":[[602002,1]]}`|
|10006|`{"dress_daily_award":[[602002,1]]}`|
|10007|`{"dress_daily_award":[[602002,1]]}`|
|10008|`{"dress_daily_award":[[602002,1]]}`|
|10009|`{"dress_daily_award":[[602002,1]]}`|
|10010|`{"dress_daily_award":[[602002,1]]}`|
|10011|`{"dress_daily_award":[[602002,1]]}`|
|10031|`{"dress_daily_award":[[602002,1]]}`|
|10032|`{"dress_daily_award":[[602002,1]]}`|
|10033|`{"dress_daily_award":[[602002,1]]}`|
|10034|`{"dress_daily_award":[[602002,1]]}`|
|10035|`{"dress_daily_award":[[602002,1]]}`|
|10036|`{"dress_daily_award":[[602002,1]]}`|
|10037|`{"dress_daily_award":[[602002,1]]}`|
|10038|`{"dress_daily_award":[[602002,1]]}`|
|10039|`{"dress_daily_award":[[602002,1]]}`|
|10040|`{"dress_daily_award":[[602002,1]]}`|
|10041|`{"dress_daily_award":[[602002,1]]}`|
|10061|`{"dress_daily_award":[[602002,1]]}`|
|10062|`{"dress_daily_award":[[602002,1]]}`|
|10063|`{"dress_daily_award":[[602002,1]]}`|
|10064|`{"dress_daily_award":[[602002,1]]}`|
|10065|`{"dress_daily_award":[[602002,1]]}`|
|10066|`{"dress_daily_award":[[602002,1]]}`|
|10067|`{"dress_daily_award":[[602002,1]]}`|
|10068|`{"dress_daily_award":[[602002,1]]}`|
|10069|`{"dress_daily_award":[[602002,1]]}`|
|10070|`{"dress_daily_award":[[602002,1]]}`|
|10071|`{"dress_daily_award":[[602002,1]]}`|
|10072|`{"dress_daily_award":[[602002,1]]}`|
|10091|`{"dress_daily_award":[[602002,1]]}`|
|10092|`{"dress_daily_award":[[602002,1]]}`|
|10093|`{"dress_daily_award":[[602002,1]]}`|
|10094|`{"dress_daily_award":[[602002,1]]}`|
|10095|`{"dress_daily_award":[[602002,1]]}`|
|10096|`{"dress_daily_award":[[602002,1]]}`|
|10097|`{"dress_daily_award":[[602002,1]]}`|
|10098|`{"dress_daily_award":[[602002,1]]}`|
|10099|`{"dress_daily_award":[[602002,1]]}`|
|10100|`{"dress_daily_award":[[602002,1]]}`|
|10101|`{"dress_daily_award":[[602002,1]]}`|
|10102|`{"dress_daily_award":[[602002,1]]}`|
|10103|`{"dress_daily_award":[[602002,1]]}`|
|10121|`{"dress_daily_award":[[602002,1]]}`|
|10122|`{"dress_daily_award":[[602002,1]]}`|
|10123|`{"dress_daily_award":[[602002,1]]}`|
|10124|`{"dress_daily_award":[[602002,1]]}`|
|10125|`{"dress_daily_award":[[602002,1]]}`|
|10126|`{"dress_daily_award":[[602002,1]]}`|
|10127|`{"dress_daily_award":[[602002,1]]}`|
|10128|`{"dress_daily_award":[[602002,1]]}`|
|10129|`{"dress_daily_award":[[602002,1]]}`|
|10130|`{"dress_daily_award":[[602002,1]]}`|
|10131|`{"dress_daily_award":[[602002,1]]}`|
|10132|`{"dress_daily_award":[[602002,1]]}`|
|10151|`{"dress_daily_award":[[602002,1]]}`|
|10152|`{"dress_daily_award":[[602002,1]]}`|
|10153|`{"dress_daily_award":[[602002,1]]}`|
|10154|`{"dress_daily_award":[[602002,1]]}`|
|10155|`{"dress_daily_award":[[602002,1]]}`|
|10156|`{"dress_daily_award":[[602002,1]]}`|
|10157|`{"dress_daily_award":[[602002,1]]}`|
|10158|`{"dress_daily_award":[[602002,1]]}`|
|10159|`{"dress_daily_award":[[602002,1]]}`|
|10160|`{"dress_daily_award":[[602002,1]]}`|
|10161|`{"dress_daily_award":[[602002,1]]}`|
|10162|`{"dress_daily_award":[[602002,1]]}`|
|10163|`{"dress_daily_award":[[602002,1]]}`|
|10181|`{"dress_daily_award":[[602002,1]]}`|
|10182|`{"dress_daily_award":[[602002,1]]}`|
|10183|`{"dress_daily_award":[[602002,1]]}`|
|10184|`{"dress_daily_award":[[602002,1]]}`|
|10185|`{"dress_daily_award":[[602002,1]]}`|
|10186|`{"dress_daily_award":[[602002,1]]}`|
|10187|`{"dress_daily_award":[[602002,1]]}`|
|10188|`{"dress_daily_award":[[602002,1]]}`|
|10189|`{"dress_daily_award":[[602002,1]]}`|
|10190|`{"dress_daily_award":[[602002,1]]}`|
|10191|`{"dress_daily_award":[[602002,1]]}`|
|10192|`{"dress_daily_award":[[602002,1]]}`|
|10193|`{"dress_daily_award":[[602002,1]]}`|
|10194|`{"dress_daily_award":[[602002,1]]}`|
|10195|`{"dress_daily_award":[[602002,1]]}`|
|10201|`{"dress_daily_award":[[602002,1]]}`|
|10202|`{"dress_daily_award":[[602002,1]]}`|
|10203|`{"dress_daily_award":[[602002,1]]}`|
|10204|`{"dress_daily_award":[[602002,1]]}`|
|10205|`{"dress_daily_award":[[602002,1]]}`|
|10206|`{"dress_daily_award":[[602002,1]]}`|
|10207|`{"dress_daily_award":[[602002,1]]}`|
|10208|`{"dress_daily_award":[[602002,1]]}`|
|10209|`{"dress_daily_award":[[602002,1]]}`|
|10210|`{"dress_daily_award":[[602002,1]]}`|
|10211|`{"dress_daily_award":[[602002,1]]}`|
|10212|`{"dress_daily_award":[[602002,1]]}`|
|10213|`{"dress_daily_award":[[602002,1]]}`|
|10214|`{"dress_daily_award":[[602002,1]]}`|
|10215|`{"dress_daily_award":[[602002,1]]}`|

## FormJumpVersion

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|shop|object|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|gem_rebate|object|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|draw_skin|object|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|main|object|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|fund|object|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ready|object|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|acc_recharge|object|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|finance|object|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|collect|object|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|popup|object|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skin_shop|object|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|preview|object|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sign|object|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|monster|object|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"draw_skin":{"reference":"SpringFestivalForm.StaticOpen"}}`|
|2|`{"draw_skin":{"reference":"CommonFestivalForm.StaticOpen"}}`|

## ShopItem

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|act|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|icon|string|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|big_award|boolean|10|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|tid|number|10|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|5160101001|`{"big_award":true}`|
|5160102001|`{"big_award":true}`|
|5160103001|`{"big_award":false}`|
|5160104001|`{"big_award":false}`|
|5160105001|`{"big_award":false}`|
|5160106001|`{"big_award":false}`|
|5160107001|`{"big_award":false}`|
|5160108001|`{"big_award":false}`|
|5160109001|`{"big_award":false}`|
|5160110001|`{"big_award":false}`|

## DressAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|is_special|boolean|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|3|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|act_id|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|available_sec|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|server_range|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001101|`{"is_special":false,"award":[[352508,1]]}`|
|1001102|`{"is_special":false,"award":[[101500,666]]}`|
|1001103|`{"is_special":true,"award":[[600002,1]]}`|

## Msg

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|msg_format|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|icon|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|

## Dress

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|award|array|1|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|cost_num|number|1|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|cost_tid|number|1|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|max_draw_cnt|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|116001|`{"award":[[2831200,1]],"cost_num":1,"cost_tid":602002,"max_draw_cnt":999}`|

## Preview

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|act|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|show_name|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bg_img|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|preview_text|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|end_time|number|5|结束日期内秒偏移；不是单独完整时间戳。|
|start_time|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"end_time":1707080399,"start_time":1738011600}`|
|2|`{"end_time":1707080399,"start_time":1738011600}`|
|3|`{"end_time":1707080399,"start_time":1738011600}`|
|4|`{"end_time":1707080399,"start_time":1738011600}`|
|5|`{"end_time":1707080399,"start_time":1738011600}`|

## Gift

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|act|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|gift|array|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|
