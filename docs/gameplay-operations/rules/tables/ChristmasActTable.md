# ChristmasActTable 规则参数

来源：[personal-server/assets/tables/ChristmasActTable.data.lua.json.gz](../../../../personal-server/assets/tables/ChristmasActTable.data.lua.json.gz)，SHA256：`257df4a974c979c85496ba8bbfd427e142150a0a50fa728dabfb1dfc80b4510e`。

[完整逐行JSON](ChristmasActTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Period](#period)|1|decoded-rows|
|[ShopLib](#shoplib)|5|decoded-rows|
|[ShopAward](#shopaward)|9|decoded-rows|
|[DailyAwad](#dailyawad)|87|decoded-rows|
|[DressAward](#dressaward)|3|decoded-rows|
|[Msg](#msg)|4|decoded-rows|
|[Dress](#dress)|1|decoded-rows|
|[WishBigAward](#wishbigaward)|3|decoded-rows|
|[WishNormalAward](#wishnormalaward)|1|decoded-rows|
|[Wish](#wish)|1|decoded-rows|
|[Preview](#preview)|4|decoded-rows|

## Period

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|divide_sec|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|appearance_act|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|105001|`{}`|

## ShopLib

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|act|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|shop_lib|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"shop_lib":5120001}`|
|2|`{"shop_lib":5120002}`|
|3|`{"shop_lib":5120003}`|
|4|`{"shop_lib":5120004}`|
|5|`{"shop_lib":5120005}`|

## ShopAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|9|本表行键；与其他表同值不自动代表同一对象。|
|award|array|9|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|cost_diamond|number|9|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"award":[[585002,2]],"cost_diamond":1000}`|
|102|`{"award":[[585002,3]],"cost_diamond":6000}`|
|103|`{"award":[[585002,5]],"cost_diamond":12000}`|
|104|`{"award":[[585002,5]],"cost_diamond":18000}`|
|105|`{"award":[[585002,5]],"cost_diamond":24000}`|
|106|`{"award":[[585002,5]],"cost_diamond":30000}`|
|107|`{"award":[[585002,5]],"cost_diamond":36000}`|
|108|`{"award":[[585002,5]],"cost_diamond":42000}`|
|109|`{"award":[[585002,5]],"cost_diamond":50000}`|

## DailyAwad

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|87|本表行键；与其他表同值不自动代表同一对象。|
|wish_daily_award|array|87|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|dress_daily_award|array|87|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10001|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10002|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10003|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10004|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10005|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10006|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10007|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10008|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10009|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10010|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10011|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10031|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10032|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10033|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10034|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10035|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10036|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10037|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10038|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10039|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10040|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10041|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10061|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10062|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10063|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10064|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10065|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10066|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10067|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10068|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10069|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10070|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10071|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10072|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10091|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10092|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10093|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10094|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10095|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10096|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10097|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10098|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10099|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10100|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10101|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10102|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10103|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10121|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10122|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10123|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10124|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10125|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10126|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10127|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10128|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10129|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10130|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10131|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10132|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10151|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10152|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10153|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10154|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10155|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10156|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10157|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10158|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10159|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10160|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10161|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10162|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10163|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10181|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10182|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10183|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10184|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10185|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10186|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10187|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10188|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10189|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10190|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10191|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10192|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10193|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10194|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|
|10195|`{"wish_daily_award":[[584002,1]],"dress_daily_award":[[583002,1]]}`|

## DressAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|act_id|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|3|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|available_sec|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|server_range|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001101|`{"award":[[111608,1]]}`|
|1001102|`{"award":[[205008,1]]}`|
|1001103|`{"award":[[586002,1]]}`|

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
|105001|`{"award":[[101500,10]],"cost_num":1,"cost_tid":583002,"max_draw_cnt":5}`|

## WishBigAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|act_id|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_num|number|3|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award_tid|number|3|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|server_range|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1000401|`{"award_num":1,"award_tid":11200}`|
|1000402|`{"award_num":2,"award_tid":22002}`|
|1000403|`{"award_num":10,"award_tid":3002}`|

## WishNormalAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|act_id|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|server_range|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|draw_lib|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1000401|`{"draw_lib":156}`|

## Wish

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|need_progress|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cost_num|number|1|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|cost_tid|number|1|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|105001|`{"need_progress":50,"cost_num":1,"cost_tid":584002}`|

## Preview

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|act_id|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bg_img|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|preview_text|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|act_time|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"act_time":"12月24日-12月28日"}`|
|2|`{"act_time":"12月24日-12月28日"}`|
|3|`{"act_time":"12月24日-12月30日"}`|
|4|`{"act_time":"12月24日-12月28日"}`|
