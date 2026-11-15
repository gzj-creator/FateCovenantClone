# DreamTable 规则参数

来源：[personal-server/assets/tables/DreamTable.data.lua.json.gz](../../../../personal-server/assets/tables/DreamTable.data.lua.json.gz)，SHA256：`b542b90f9d03540fc1abad14e4192c138074e1c4c3a41bf0218bcbb2dcd45b1a`。

[完整逐行JSON](DreamTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[EventAward](#eventaward)|7|decoded-rows|
|[EventAwardNew](#eventawardnew)|7|decoded-rows|
|[Task](#task)|0|decoded-rows|
|[WeekAward](#weekaward)|5|decoded-rows|
|[WeekAwardNew](#weekawardnew)|5|decoded-rows|
|[FixAward](#fixaward)|1|decoded-rows|
|[FixAwardNew](#fixawardnew)|1|decoded-rows|
|[AwardSplit](#awardsplit)|1|decoded-rows|
|[BoxAward](#boxaward)|1|decoded-rows|
|[BoxAwardNew](#boxawardnew)|1|decoded-rows|
|[MonthAward](#monthaward)|4|decoded-rows|
|[MonthAwardNew](#monthawardnew)|4|decoded-rows|
|[MonsterType](#monstertype)|3|decoded-rows|
|[ChooseBuff](#choosebuff)|6|decoded-rows|
|[StoryStep](#storystep)|13|decoded-rows|
|[Story](#story)|4|decoded-rows|
|[CollectAward](#collectaward)|6|decoded-rows|
|[Collect](#collect)|18|decoded-rows|
|[StoryUI](#storyui)|18|decoded-rows|
|[Event](#event)|8|rows-with-external-references|
|[TaskEndType](#taskendtype)|2|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[BuffDes](#buffdes)|12|decoded-rows|
|[Group](#group)|7|decoded-rows|
|[GroupSeq](#groupseq)|1|decoded-rows|
|[GroupType](#grouptype)|5|decoded-rows|

## EventAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rand_award|array|7|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|tail_week_award|array|7|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award|array|7|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|tid|number|7|本表行键；与其他表同值不自动代表同一对象。|
|tail_week_rand_award|array|7|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"rand_award":[],"tail_week_award":[[771200,1],[140002,6]],"award":[[140002,6]],"tail_week_rand_award":[]}`|
|2|`{"rand_award":[],"tail_week_award":[[771200,1],[140002,5]],"award":[[140002,5]],"tail_week_rand_award":[]}`|
|3|`{"rand_award":[],"tail_week_award":[[771200,1],[140002,4]],"award":[[140002,4]],"tail_week_rand_award":[]}`|
|4|`{"rand_award":[],"tail_week_award":[[771200,3],[140002,9]],"award":[[140002,9]],"tail_week_rand_award":[]}`|
|5|`{"rand_award":[],"tail_week_award":[],"award":[],"tail_week_rand_award":[]}`|
|6|`{"rand_award":[],"tail_week_award":[[771200,3],[140002,8]],"award":[[771200,3],[140002,8]],"tail_week_rand_award":[]}`|
|7|`{"rand_award":[],"tail_week_award":[],"award":[],"tail_week_rand_award":[]}`|

## EventAwardNew

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rand_award|array|7|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|tail_week_award|array|7|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award|array|7|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|tid|number|7|本表行键；与其他表同值不自动代表同一对象。|
|tail_week_rand_award|array|7|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"rand_award":[],"tail_week_award":[[1000122,1],[495002,80]],"award":[[495002,80]],"tail_week_rand_award":[]}`|
|2|`{"rand_award":[],"tail_week_award":[[1000122,1],[495002,60]],"award":[[495002,60]],"tail_week_rand_award":[]}`|
|3|`{"rand_award":[],"tail_week_award":[[1000122,1],[495002,50]],"award":[[495002,50]],"tail_week_rand_award":[]}`|
|4|`{"rand_award":[],"tail_week_award":[[1000122,3],[495002,110]],"award":[[495002,110]],"tail_week_rand_award":[]}`|
|5|`{"rand_award":[],"tail_week_award":[],"award":[],"tail_week_rand_award":[]}`|
|6|`{"rand_award":[],"tail_week_award":[[1010122,1],[495002,90]],"award":[[1000222,1],[495002,90]],"tail_week_rand_award":[]}`|
|7|`{"rand_award":[],"tail_week_award":[],"award":[],"tail_week_rand_award":[]}`|

## Task

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## WeekAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|award|array|5|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|count|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tail_week_award|array|5|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award":[[771200,1],[140002,8]],"count":5,"tail_week_award":[[771200,3],[140002,8]]}`|
|2|`{"award":[[771200,1],[140002,8]],"count":10,"tail_week_award":[[771200,6],[140002,8]]}`|
|3|`{"award":[[771200,3],[140002,12]],"count":20,"tail_week_award":[[801200,2],[140002,12]]}`|
|4|`{"award":[[771200,3],[140002,16]],"count":32,"tail_week_award":[[801200,2],[140002,16]]}`|
|5|`{"award":[[801200,1],[141002,4]],"count":40,"tail_week_award":[[801200,4],[141002,4]]}`|

## WeekAwardNew

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|award|array|5|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|count|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tail_week_award|array|5|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award":[[3191200,1],[495002,100]],"count":5,"tail_week_award":[[3191200,3],[495002,100]]}`|
|2|`{"award":[[3191200,2],[495002,100]],"count":10,"tail_week_award":[[3191200,5],[495002,100]]}`|
|3|`{"award":[[3191200,2],[495002,200]],"count":20,"tail_week_award":[[3191200,8],[495002,200]]}`|
|4|`{"award":[[3191200,3],[495002,200]],"count":32,"tail_week_award":[[3191200,10],[495002,200]]}`|
|5|`{"award":[[3191200,5],[495002,300]],"count":40,"tail_week_award":[[3191200,15],[495002,300]]}`|

## FixAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|award|array|1|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|rand_award|number|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|tail_week_award|array|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|tail_week_rand_award|number|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award":[[801200,1],[771200,1],[141002,4]],"rand_award":0,"tail_week_award":[[801200,1],[771200,1],[141002,4]],"tail_week_rand_award":0}`|

## FixAwardNew

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|award|array|1|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|rand_award|number|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|tail_week_award|array|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|tail_week_rand_award|number|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award":[[3191200,5],[495002,50],[1010222,2]],"rand_award":0,"tail_week_award":[[3191200,5],[495002,50],[1010222,2]],"tail_week_rand_award":0}`|

## AwardSplit

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|server_open_day|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|server_open_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"server_open_day":24,"server_open_time":1758488400}`|

## BoxAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|tail_week_rand_award|array|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|rand_award|array|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|cost|array|1|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"tail_week_rand_award":[511],"rand_award":[501],"cost":[[101500,0],[101500,100],[101500,200]]}`|

## BoxAwardNew

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|tail_week_rand_award|array|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|rand_award|array|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|cost|array|1|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"tail_week_rand_award":[1601],"rand_award":[1501],"cost":[[101500,0],[101500,100],[101500,200]]}`|

## MonthAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|award|array|4|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|count|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award":[[2211200,30]],"count":30}`|
|2|`{"award":[[2211200,30]],"count":60}`|
|3|`{"award":[[2211200,30]],"count":90}`|
|4|`{"award":[[2211200,30]],"count":125}`|

## MonthAwardNew

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|award|array|4|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|count|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award":[[2171200,20]],"count":30}`|
|2|`{"award":[[2171200,20]],"count":60}`|
|3|`{"award":[[2171200,20]],"count":90}`|
|4|`{"award":[[2171200,20]],"count":125}`|

## MonsterType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|title_img|string|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|title_name|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|buff|array|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|

## ChooseBuff

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|rand_num|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|buff|array|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"rand_num":3}`|
|2|`{"rand_num":3}`|
|3|`{"rand_num":3}`|
|4|`{"rand_num":3}`|
|5|`{"rand_num":3}`|
|6|`{"rand_num":3}`|

## StoryStep

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|story_desc|number|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|start_talk|number|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|translate_title|array|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|story_step_group|number|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|13|本表行键；与其他表同值不自动代表同一对象。|
|title|array|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|translate_desc|array|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|story_title|number|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|desc|array|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|end_talk|array|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|translate_story_desc|undefined|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|translate_story_title|undefined|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"start_talk":2052,"story_step_group":1}`|
|2|`{"start_talk":2056,"story_step_group":2}`|
|3|`{"start_talk":2060,"story_step_group":2}`|
|4|`{"start_talk":2064,"story_step_group":2}`|
|5|`{"start_talk":2068,"story_step_group":3}`|
|6|`{"start_talk":2071,"story_step_group":3}`|
|7|`{"start_talk":2074,"story_step_group":3}`|
|8|`{"start_talk":2077,"story_step_group":3}`|
|9|`{"start_talk":2080,"story_step_group":3}`|
|10|`{"start_talk":2083,"story_step_group":3}`|
|11|`{"start_talk":2086,"story_step_group":3}`|
|12|`{"start_talk":2089,"story_step_group":3}`|
|13|`{"start_talk":2092,"story_step_group":3}`|

## Story

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|step|array|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"step":[[2,1],[3,1],[4,1]]}`|
|2|`{"step":[[5,2],[6,2],[7,2]]}`|
|3|`{"step":[[8,2],[9,2],[10,2]]}`|
|4|`{"step":[[11,2],[12,2],[13,2]]}`|

## CollectAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|need|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|award|array|6|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"need":3,"award":[[101500,400]]}`|
|2|`{"need":6,"award":[[101500,400]]}`|
|3|`{"need":9,"award":[[101500,400]]}`|
|4|`{"need":12,"award":[[101500,400]]}`|
|5|`{"need":15,"award":[[101500,400]]}`|
|6|`{"need":18,"award":[[101500,400]]}`|

## Collect

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|translate_result_title|undefined|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|collect_award|array|18|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|translate_result_desc|undefined|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|result_title|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|18|本表行键；与其他表同值不自动代表同一对象。|
|split_award|array|18|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|choice_step|array|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|result_desc|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"collect_award":[[140002,2],[1100119,1]],"split_award":[[1010122,1],[493002,10]],"choice_step":[1,1,1]}`|
|2|`{"collect_award":[[140002,2],[1100219,1]],"split_award":[[1010122,1],[493002,10]],"choice_step":[1,1,2]}`|
|3|`{"collect_award":[[140002,2],[1100319,1]],"split_award":[[1010122,1],[493002,10]],"choice_step":[1,2,1]}`|
|4|`{"collect_award":[[140002,2],[1100419,1]],"split_award":[[1010122,1],[493002,10]],"choice_step":[1,2,2]}`|
|5|`{"collect_award":[[140002,2],[1100119,1]],"split_award":[[1010122,1],[493002,10]],"choice_step":[1,3,1]}`|
|6|`{"collect_award":[[140002,2],[1100219,1]],"split_award":[[1010122,1],[493002,10]],"choice_step":[1,3,2]}`|
|7|`{"collect_award":[[140002,2],[1100319,1]],"split_award":[[1010122,1],[493002,10]],"choice_step":[2,1,1]}`|
|8|`{"collect_award":[[140002,2],[1100419,1]],"split_award":[[1010122,1],[493002,10]],"choice_step":[2,1,2]}`|
|9|`{"collect_award":[[140002,2],[1100119,1]],"split_award":[[1010122,1],[493002,10]],"choice_step":[2,2,1]}`|
|10|`{"collect_award":[[140002,2],[1100219,1]],"split_award":[[1010122,1],[493002,10]],"choice_step":[2,2,2]}`|
|11|`{"collect_award":[[140002,2],[1100319,1]],"split_award":[[1010122,1],[493002,10]],"choice_step":[2,3,1]}`|
|12|`{"collect_award":[[140002,2],[1100419,1]],"split_award":[[1010122,1],[493002,10]],"choice_step":[2,3,2]}`|
|13|`{"collect_award":[[140002,2],[1100119,1]],"split_award":[[1010122,1],[493002,10]],"choice_step":[3,1,1]}`|
|14|`{"collect_award":[[140002,2],[1100219,1]],"split_award":[[1010122,1],[493002,10]],"choice_step":[3,1,2]}`|
|15|`{"collect_award":[[140002,2],[1100319,1]],"split_award":[[1010122,1],[493002,10]],"choice_step":[3,2,1]}`|
|16|`{"collect_award":[[140002,2],[1100419,1]],"split_award":[[1010122,1],[493002,10]],"choice_step":[3,2,2]}`|
|17|`{"collect_award":[[140002,2],[1100119,1]],"split_award":[[1010122,1],[493002,10]],"choice_step":[3,3,1]}`|
|18|`{"collect_award":[[140002,2],[1100219,1]],"split_award":[[1010122,1],[493002,10]],"choice_step":[3,3,2]}`|

## StoryUI

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|icon|string|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_title_posY|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|18|本表行键；与其他表同值不自动代表同一对象。|
|img_title|string|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_title_posX|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|
|6|`{}`|
|7|`{}`|
|8|`{}`|
|9|`{}`|
|10|`{}`|
|11|`{}`|
|12|`{}`|
|13|`{}`|
|14|`{}`|
|15|`{}`|
|16|`{}`|
|17|`{}`|
|18|`{}`|

## Event

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|event_node_name|string|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|8|本表行键；与其他表同值不自动代表同一对象。|
|big_title_name|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|erl|string|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|dream_show_name|string|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|big_title_desc|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|event_ctor|object|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|
|6|`{}`|
|7|`{}`|
|8|`{}`|

## TaskEndType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|end_day|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"end_day":7}`|
|2|`{"end_day":28}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|week|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|week_max_buff|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|assistant_param2|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|assistant_param1|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|week_event_max|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|asserts|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|day_event_refresh_cost|array|1|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|event_refresh_cost_items|number|1|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"week_max_buff":3,"week_event_max":40,"asserts":796420300001,"day_event_refresh_cost":[[5,0],[10,30]],"event_refresh_cost_items":101500}`|

## BuffDes

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|12|本表行键；与其他表同值不自动代表同一对象。|
|skill_type|array|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skill_value|array|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|220000201|`{"skill_type":[15001],"skill_value":[2000]}`|
|220000202|`{"skill_type":[15002],"skill_value":[1000]}`|
|220000203|`{"skill_type":[15003],"skill_value":[1000]}`|
|220000204|`{"skill_type":[15004,15012],"skill_value":[1000,1500]}`|
|220000205|`{"skill_type":[15005],"skill_value":[2000]}`|
|220000206|`{"skill_type":[15006],"skill_value":[1000]}`|
|220000207|`{"skill_type":[15007],"skill_value":[500]}`|
|220000208|`{"skill_type":[15008,15013],"skill_value":[1000,1500]}`|
|220000209|`{"skill_type":[15009],"skill_value":[1500]}`|
|220000210|`{"skill_type":[15010],"skill_value":[1500]}`|
|220000211|`{"skill_type":[15011,15014],"skill_value":[1500,1500]}`|
|220000212|`{"skill_type":[5563,5562],"skill_value":[1000,1000]}`|

## Group

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|7|本表行键；与其他表同值不自动代表同一对象。|
|event|array|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"type":1}`|
|2|`{"type":1}`|
|3|`{"type":2}`|
|4|`{"type":3}`|
|5|`{"type":4}`|
|6|`{"type":4}`|
|7|`{"type":5}`|

## GroupSeq

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|group|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"group":[5,1,2,3,2,4]}`|

## GroupType

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
