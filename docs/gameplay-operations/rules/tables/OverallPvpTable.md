# OverallPvpTable 规则参数

来源：[personal-server/assets/tables/OverallPvpTable.data.lua.json.gz](../../../../personal-server/assets/tables/OverallPvpTable.data.lua.json.gz)，SHA256：`ff33c71f4b482d7aed3783fcdccc5a8692724ac2daa2f648b2db346750f79ed8`。

[完整逐行JSON](OverallPvpTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[TitleAddition](#titleaddition)|1|decoded-rows|
|[PastChampion](#pastchampion)|2|decoded-rows|
|[Task](#task)|11|decoded-rows|
|[ShowRewards](#showrewards)|3|decoded-rows|
|[Shop](#shop)|2|decoded-rows|
|[ArtifactUnlock](#artifactunlock)|3|decoded-rows|
|[Base](#base)|3|decoded-rows|
|[ReportParse](#reportparse)|3|decoded-rows|
|[DailyExtraAwad](#dailyextraawad)|117|decoded-rows|
|[EachTask](#eachtask)|11|decoded-rows|
|[GuessAward](#guessaward)|6|decoded-rows|
|[Guess](#guess)|3|decoded-rows|
|[SignTask](#signtask)|6|decoded-rows|
|[Lineup](#lineup)|12|decoded-rows|
|[Stage](#stage)|7|decoded-rows|
|[PreviewRewards](#previewrewards)|3|decoded-rows|
|[ExtraAwadLib](#extraawadlib)|3|decoded-rows|
|[GuessStage](#guessstage)|4|decoded-rows|
|[RankAward](#rankaward)|4|decoded-rows|
|[ElmsInit](#elmsinit)|3|decoded-rows|
|[ElmsConst](#elmsconst)|3|decoded-rows|
|[ElmsBuy](#elmsbuy)|999|decoded-rows|
|[ElmsRule](#elmsrule)|4|decoded-rows|
|[ElmsRankWinnerAward](#elmsrankwinneraward)|6|decoded-rows|
|[ElmsRankLoserAward](#elmsrankloseraward)|7|decoded-rows|
|[PrelimsMatch](#prelimsmatch)|3|decoded-rows|
|[PrelimsConst](#prelimsconst)|1|decoded-rows|
|[PrelimsBot](#prelimsbot)|22|decoded-rows|
|[PrelimsBotLib](#prelimsbotlib)|44|decoded-rows|
|[PrelimsBuyTimes](#prelimsbuytimes)|6|decoded-rows|
|[PrelimsLevel](#prelimslevel)|12|decoded-rows|

## TitleAddition

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|attrs|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|357508|`{"attrs":[[74,500],[75,500]]}`|

## PastChampion

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|skin|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|

## Task

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|11|本表行键；与其他表同值不自动代表同一对象。|
|task_type|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_count|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_param|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|day_range|array|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_fall|boolean|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|11|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|stage|number|11|ActFrame阶段引用数组；不同于旧Activity.state。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"task_type":100501,"task_count":1,"task_param":0,"day_range":[3,5],"is_fall":false,"award":[[7401900,150],[7501900,80],[7801900,100]],"stage":2}`|
|2|`{"task_type":100501,"task_count":3,"task_param":0,"day_range":[3,5],"is_fall":false,"award":[[7401900,200],[7501900,100],[7801900,100]],"stage":2}`|
|3|`{"task_type":100501,"task_count":5,"task_param":0,"day_range":[3,5],"is_fall":false,"award":[[7401900,250],[7501900,120],[7801900,200]],"stage":2}`|
|4|`{"task_type":100502,"task_count":1,"task_param":0,"day_range":[6,8],"is_fall":true,"award":[[7801900,200]],"stage":4}`|
|5|`{"task_type":100503,"task_count":1,"task_param":0,"day_range":[6,8],"is_fall":true,"award":[[7801900,300]],"stage":4}`|
|6|`{"task_type":100504,"task_count":1,"task_param":0,"day_range":[6,6],"is_fall":false,"award":[[7401900,300],[7501900,80],[7601900,80],[7801900,100]],"stage":4}`|
|7|`{"task_type":100504,"task_count":3,"task_param":0,"day_range":[6,6],"is_fall":false,"award":[[7401900,400],[7501900,100],[7601900,100],[7801900,100]],"stage":4}`|
|8|`{"task_type":100504,"task_count":5,"task_param":0,"day_range":[6,6],"is_fall":false,"award":[[7401900,500],[7501900,120],[7601900,120],[7801900,300]],"stage":4}`|
|9|`{"task_type":100504,"task_count":1,"task_param":0,"day_range":[7,8],"is_fall":false,"award":[[7401900,300],[7501900,80],[7601900,80],[7701900,150],[7801900,100]],"stage":4}`|
|10|`{"task_type":100504,"task_count":3,"task_param":0,"day_range":[7,8],"is_fall":false,"award":[[7401900,400],[7501900,100],[7601900,100],[7701900,200],[7801900,100]],"stage":4}`|
|11|`{"task_type":100504,"task_count":5,"task_param":0,"day_range":[7,8],"is_fall":false,"award":[[7401900,500],[7501900,120],[7601900,120],[7701900,250],[7801900,300]],"stage":4}`|

## ShowRewards

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|award_list|array|3|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award_list":[[101500,1]]}`|
|2|`{"award_list":[[101500,1]]}`|
|3|`{"award_list":[[101500,1]]}`|

## Shop

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|shop|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|server_range_lib|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|shop_red|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|currency|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"server_range_lib":[[11,5180001]]}`|
|2|`{"server_range_lib":[[11,5190001]]}`|

## ArtifactUnlock

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|unlock_day|array|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"unlock_day":[1,1,1,5,5,5]}`|
|2|`{"unlock_day":[1,1,1,4,4,4]}`|
|3|`{"unlock_day":[1,1,1,5,5,5]}`|

## Base

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|start_time|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|end_time|number|3|结束日期内秒偏移；不是单独完整时间戳。|
|show_name|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|condition|null|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lease_star_up_version|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|acc_recharge_task|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|history_rank_len|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skin_recharge_act|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|init_award|array|3|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"start_time":1741899600,"end_time":1743022800,"condition":null,"lease_star_up_version":1,"acc_recharge_task":106006,"history_rank_len":3,"init_award":[]}`|
|2|`{"start_time":1749762000,"end_time":1750798800,"condition":null,"lease_star_up_version":1,"acc_recharge_task":106016,"history_rank_len":3,"init_award":[[7401900,300]]}`|
|3|`{"start_time":1757365200,"end_time":1758488400,"condition":null,"lease_star_up_version":1,"acc_recharge_task":106022,"history_rank_len":3,"init_award":[[7401900,300]]}`|

## ReportParse

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|2|`{}`|
|4|`{}`|
|6|`{}`|

## DailyExtraAwad

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|117|本表行键；与其他表同值不自动代表同一对象。|
|ref|number|117|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|day_range|array/object|117|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|extra_award|array/object|117|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"day_range":[[2,7],[5,7],[6,7]],"extra_award":[1,2,3]}`|
|2|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|3|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|4|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|5|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|6|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|7|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|8|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|9|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|10|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|11|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|31|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|32|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|33|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|34|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|35|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|36|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|37|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|38|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|39|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|40|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|41|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|61|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|62|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|63|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|64|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|65|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|66|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|67|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|68|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|69|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|70|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|71|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|72|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|91|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|92|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|93|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|94|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|95|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|96|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|97|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|98|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|99|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|100|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|101|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|102|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|103|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|121|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|122|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|123|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|124|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|125|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|126|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|127|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|128|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|129|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|130|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|131|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|132|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|151|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|152|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|153|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|154|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|155|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|156|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|157|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|158|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|159|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|160|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|161|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|162|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|163|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|181|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|182|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|183|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|184|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|185|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|186|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|187|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|188|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|189|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|190|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|191|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|192|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|193|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|194|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|195|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|201|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|202|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|203|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|204|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|205|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|206|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|207|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|208|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|209|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|210|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|211|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|212|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|213|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|214|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|215|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|221|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|222|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|223|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|224|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|225|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|226|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|227|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|228|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|229|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|230|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|231|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|232|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|233|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|234|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|
|235|`{"day_range":{"global":"TableEmpty"},"extra_award":{"global":"TableEmpty"}}`|

## EachTask

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|11|本表行键；与其他表同值不自动代表同一对象。|
|task_type|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_count|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_param|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|prelims_lv|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|11|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|stage|number|11|ActFrame阶段引用数组；不同于旧Activity.state。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"task_type":100505,"task_count":1100,"task_param":0,"prelims_lv":2,"award":[[7901900,50],[101500,50],[2981200,2]],"stage":2}`|
|2|`{"task_type":100505,"task_count":1200,"task_param":0,"prelims_lv":3,"award":[[7901900,50],[101500,50],[2981200,2]],"stage":2}`|
|3|`{"task_type":100505,"task_count":1300,"task_param":0,"prelims_lv":4,"award":[[7901900,100],[101500,100],[2981200,3]],"stage":2}`|
|4|`{"task_type":100505,"task_count":1500,"task_param":0,"prelims_lv":5,"award":[[7901900,100],[101500,100],[2981200,3]],"stage":2}`|
|5|`{"task_type":100505,"task_count":1700,"task_param":0,"prelims_lv":6,"award":[[7901900,100],[101500,100],[2981200,3]],"stage":2}`|
|6|`{"task_type":100505,"task_count":1900,"task_param":0,"prelims_lv":7,"award":[[7901900,100],[101500,100],[2981200,4]],"stage":2}`|
|7|`{"task_type":100505,"task_count":2150,"task_param":0,"prelims_lv":8,"award":[[7901900,100],[101500,100],[2981200,4]],"stage":2}`|
|8|`{"task_type":100505,"task_count":2300,"task_param":0,"prelims_lv":9,"award":[[7901900,100],[101500,100],[2981200,4]],"stage":2}`|
|9|`{"task_type":100505,"task_count":2650,"task_param":0,"prelims_lv":10,"award":[[7901900,200],[101500,200],[2981200,5]],"stage":2}`|
|10|`{"task_type":100505,"task_count":2900,"task_param":0,"prelims_lv":11,"award":[[7901900,200],[101500,200],[2981200,5]],"stage":2}`|
|11|`{"task_type":100505,"task_count":3200,"task_param":0,"prelims_lv":12,"award":[[7901900,300],[101500,300],[2981200,8]],"stage":2}`|

## GuessAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|des|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_list|array|6|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award_list":[[101500,200],[7901900,30],[2981200,3]]}`|
|2|`{"award_list":[[101500,100],[7901900,15],[2981200,2]]}`|
|3|`{"award_list":[[101500,500],[7901900,100],[2981200,10]]}`|
|4|`{"award_list":[[101500,300],[7901900,80],[2981200,8]]}`|
|5|`{"award_list":[[101500,200],[7901900,60],[2981200,6]]}`|
|6|`{"award_list":[[101500,100],[7901900,50],[2981200,5]]}`|

## Guess

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|start_time|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|end_time|number|3|结束日期内秒偏移；不是单独完整时间戳。|
|guess_times|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|change_guess_times|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|guess_role_num|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_list|array|3|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"start_time":1758056400,"end_time":1758204000,"guess_times":3,"change_guess_times":0,"guess_role_num":1,"award_list":[[1,1],[0,2]]}`|
|2|`{"start_time":1758229200,"end_time":1758375600,"guess_times":3,"change_guess_times":0,"guess_role_num":1,"award_list":[[1,1],[0,2]]}`|
|3|`{"start_time":1758056400,"end_time":1758375600,"guess_times":1,"change_guess_times":5,"guess_role_num":3,"award_list":[[3,3],[2,4],[1,5],[0,6]]}`|

## SignTask

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|day|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|6|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|stage|number|6|ActFrame阶段引用数组；不同于旧Activity.state。|
|stage_day|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"day":3,"award":[[7801900,200],[7401900,100],[7501900,400]],"stage":2,"stage_day":1}`|
|2|`{"day":4,"award":[[7901900,100],[101500,100]],"stage":2,"stage_day":2}`|
|3|`{"day":5,"award":[[7801900,400],[101500,100]],"stage":2,"stage_day":3}`|
|4|`{"day":6,"award":[[7901900,100],[7601900,600]],"stage":4,"stage_day":1}`|
|5|`{"day":7,"award":[[7801900,1000],[101500,100]],"stage":4,"stage_day":2}`|
|6|`{"day":8,"award":[[7901900,300],[101500,100]],"stage":4,"stage_day":3}`|

## Lineup

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|12|本表行键；与其他表同值不自动代表同一对象。|
|version|number|12|版本引用；必须按活动类型及其消费者查对应版本表。|
|lineup|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|open_day|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_list|object/array|12|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10001|`{"version":1,"open_day":0,"award_list":{"global":"TableEmpty"}}`|
|10002|`{"version":1,"open_day":5,"award_list":[[7401900,400],[7501900,200]]}`|
|10003|`{"version":1,"open_day":7,"award_list":[[7401900,2100],[7501900,500],[7701900,650]]}`|
|10004|`{"version":1,"open_day":11,"award_list":[[7401900,900]]}`|
|20001|`{"version":2,"open_day":0,"award_list":{"global":"TableEmpty"}}`|
|20002|`{"version":2,"open_day":4,"award_list":[[7401900,400],[7501900,200]]}`|
|20003|`{"version":2,"open_day":6,"award_list":[[7401900,2100],[7501900,500],[7701900,650]]}`|
|20004|`{"version":2,"open_day":10,"award_list":[[7401900,900]]}`|
|30001|`{"version":3,"open_day":0,"award_list":{"global":"TableEmpty"}}`|
|30002|`{"version":3,"open_day":4,"award_list":[[7401900,400],[7501900,200]]}`|
|30003|`{"version":3,"open_day":7,"award_list":[[7401900,2100],[7501900,500],[7701900,650]]}`|
|30004|`{"version":3,"open_day":11,"award_list":[[7401900,900]]}`|

## Stage

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|7|本表行键；与其他表同值不自动代表同一对象。|
|start_time|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|continued_time|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"start_time":0,"continued_time":172800}`|
|2|`{"start_time":172800,"continued_time":234000}`|
|3|`{"start_time":406800,"continued_time":25200}`|
|4|`{"start_time":432000,"continued_time":234000}`|
|5|`{"start_time":666000,"continued_time":25200}`|
|6|`{"start_time":691200,"continued_time":320400}`|
|7|`{"start_time":1011600,"continued_time":147600}`|

## PreviewRewards

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|award_list|array|3|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award_list":[[645002,1],[642002,1],[206008,1],[206108,1],[206208,1],[353608,1],[353708,1],[353808,1],[300610,1],[11200,1],[101200,1],[2981200,1],[101500,1]]}`|
|2|`{"award_list":[[718002,1],[642002,1],[206008,1],[206108,1],[206208,1],[353608,1],[353708,1],[353808,1],[300610,1],[11200,1],[101200,1],[2981200,1],[101500,1]]}`|
|3|`{"award_list":[[809002,1],[642002,1],[206008,1],[206108,1],[206208,1],[353608,1],[353708,1],[353808,1],[300610,1],[11200,1],[101200,1],[2981200,1],[101500,1]]}`|

## ExtraAwadLib

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|extra_award|array|3|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"extra_award":[[7401900,300],[7501900,100]]}`|
|2|`{"extra_award":[[7601900,250]]}`|
|3|`{"extra_award":[[7701900,200]]}`|

## GuessStage

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|txt_name|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|divide_group|array|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|isWin|array|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|round|array|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|alphabet_group|array/object|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"divide_group":[676399,676400],"isWin":[true,false],"round":[1,1],"alphabet_group":[676428,676429,676430,676431]}`|
|2|`{"divide_group":[676399,676400],"isWin":[true,false],"round":[2,2],"alphabet_group":[676428,676429,676430,676431]}`|
|3|`{"divide_group":[676399,676436,676437],"isWin":[true,false,false],"round":[3,3,4],"alphabet_group":{"global":"TableEmpty"}}`|
|4|`{"divide_group":[676432,676433,676434,676435],"isWin":[true,false,false,true],"round":[4,5,6,5],"alphabet_group":{"global":"TableEmpty"}}`|

## RankAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|rank_id|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rank_rang|array|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_list|array|4|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"rank_id":191,"rank_rang":[1,1],"award_list":[101500,11,101500,21]}`|
|2|`{"rank_id":191,"rank_rang":[2,2],"award_list":[101500,12,101500,22]}`|
|3|`{"rank_id":191,"rank_rang":[3,10],"award_list":[101500,13,101500,23]}`|
|4|`{"rank_id":191,"rank_rang":[11,1000],"award_list":[101500,14,101500,24]}`|

## ElmsInit

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|src_rank|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|win_rank|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fail_rank|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|split_score|array|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"src_rank":191,"win_rank":189,"fail_rank":190,"split_score":[3200,1900]}`|
|2|`{"src_rank":191,"win_rank":189,"fail_rank":190,"split_score":[3200,1900]}`|
|3|`{"src_rank":191,"win_rank":189,"fail_rank":190,"split_score":[3200,1900]}`|

## ElmsConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|role_report_num|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|peak_report_num|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|peak_show|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|free_challenge|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|refresh_times|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|refresh_cd|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sweep_count|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_top_rank|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|top_num|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_item|number|3|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award_num|number|3|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|high_power_rate|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|climb_range|array|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"role_report_num":30,"peak_report_num":30,"free_challenge":20,"refresh_times":10,"refresh_cd":30,"sweep_count":10,"fight_top_rank":20,"top_num":5,"award_item":0,"award_num":0,"high_power_rate":110}`|
|2|`{"role_report_num":30,"peak_report_num":30,"free_challenge":20,"refresh_times":10,"refresh_cd":30,"sweep_count":10,"fight_top_rank":20,"top_num":5,"award_item":0,"award_num":0,"high_power_rate":110}`|
|3|`{"role_report_num":30,"peak_report_num":30,"free_challenge":20,"refresh_times":10,"refresh_cd":30,"sweep_count":10,"fight_top_rank":20,"top_num":5,"award_item":0,"award_num":0,"high_power_rate":110}`|

## ElmsBuy

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|999|本表行键；与其他表同值不自动代表同一对象。|
|cost_item|number|999|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|cost_num|number|999|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|

下列3行用于说明结构；全部999行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"cost_item":101500,"cost_num":10}`|
|2|`{"cost_item":101500,"cost_num":10}`|
|3|`{"cost_item":101500,"cost_num":10}`|

## ElmsRule

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|time|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|left_num|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|up_num|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"time":61200,"left_num":3000,"up_num":1000}`|
|2|`{"time":147600,"left_num":1000,"up_num":500}`|
|3|`{"time":201600,"left_num":1500,"up_num":300}`|
|4|`{"time":234000,"left_num":128,"up_num":0}`|

## ElmsRankWinnerAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|rank_range|array|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|6|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"rank_range":[1,10],"award":[[7901900,3000],[7801900,9000],[2981200,30]]}`|
|2|`{"rank_range":[11,50],"award":[[7901900,2800],[7801900,8500],[2981200,25]]}`|
|3|`{"rank_range":[51,128],"award":[[7901900,2500],[7801900,8000],[2981200,22]]}`|
|4|`{"rank_range":[129,500],"award":[[7901900,2200],[7801900,7000],[2981200,20]]}`|
|5|`{"rank_range":[501,1000],"award":[[7901900,2000],[7801900,6000],[2981200,18]]}`|
|6|`{"rank_range":[1001,1800],"award":[[7901900,1800],[7801900,5500],[2981200,16]]}`|

## ElmsRankLoserAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|7|本表行键；与其他表同值不自动代表同一对象。|
|rank_range|array|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|7|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"rank_range":[1,2000],"award":[[7901900,1500],[7801900,5000],[2981200,14]]}`|
|2|`{"rank_range":[2001,4000],"award":[[7901900,1200],[7801900,4000],[2981200,12]]}`|
|3|`{"rank_range":[4001,6000],"award":[[7901900,1000],[7801900,3000],[2981200,10]]}`|
|4|`{"rank_range":[6001,10000],"award":[[7901900,800],[7801900,2400],[2981200,8]]}`|
|5|`{"rank_range":[10001,30000],"award":[[7901900,500],[7801900,1600],[2981200,6]]}`|
|6|`{"rank_range":[30001,50000],"award":[[7901900,400],[7801900,1200],[2981200,5]]}`|
|7|`{"rank_range":[50001,990000],"award":[[7901900,300],[7801900,800],[2981200,3]]}`|

## PrelimsMatch

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|is_bot|boolean|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bot_match_score|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|match_min|number|3|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|match_max|number|3|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|down_score|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|up_score|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|times_limit|number|3|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"is_bot":true,"bot_match_score":1250,"match_min":-70,"match_max":30,"down_score":-50,"up_score":50,"times_limit":15}`|
|2|`{"is_bot":true,"bot_match_score":1200,"match_min":-50,"match_max":50,"down_score":-50,"up_score":50,"times_limit":15}`|
|3|`{"is_bot":true,"bot_match_score":1100,"match_min":-30,"match_max":70,"down_score":-50,"up_score":50,"times_limit":15}`|

## PrelimsConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|show_name|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|init_score|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|min_score|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|free_challenge_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|free_refresh_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_tid|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|high_rank_fight|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|matching_time|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|init_bot_num|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|init_bot_lib|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bot_server|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bot_server_name|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"init_score":1000,"min_score":1900,"free_challenge_count":20,"free_refresh_count":10,"fight_tid":1501001,"high_rank_fight":1501003,"matching_time":[2,3],"init_bot_num":3,"init_bot_lib":[101,102,103,104,105,106,107,108,109]}`|

## PrelimsBot

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|22|本表行键；与其他表同值不自动代表同一对象。|
|type|number|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|score|number|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|match_score|number|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|one_team_bot|number|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|two_team_bot|number|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"type":1,"score":1002,"match_score":1100}`|
|102|`{"type":1,"score":1017,"match_score":1100}`|
|103|`{"type":1,"score":1024,"match_score":1100}`|
|104|`{"type":1,"score":1039,"match_score":1100}`|
|105|`{"type":1,"score":1061,"match_score":1100}`|
|106|`{"type":1,"score":1073,"match_score":1100}`|
|107|`{"type":1,"score":1055,"match_score":1100}`|
|108|`{"type":1,"score":1088,"match_score":1100}`|
|109|`{"type":1,"score":1099,"match_score":1100}`|
|110|`{"type":1,"score":1125,"match_score":1200}`|
|111|`{"type":1,"score":1135,"match_score":1200}`|
|112|`{"type":1,"score":1167,"match_score":1200}`|
|113|`{"type":1,"score":1142,"match_score":1200}`|
|114|`{"type":1,"score":1136,"match_score":1200}`|
|115|`{"type":1,"score":1138,"match_score":1200}`|
|116|`{"type":1,"score":1127,"match_score":1200}`|
|117|`{"type":1,"score":1242,"match_score":1251}`|
|118|`{"type":1,"score":1236,"match_score":1251}`|
|119|`{"type":1,"score":1228,"match_score":1251}`|
|120|`{"type":1,"score":1258,"match_score":1251}`|
|121|`{"type":1,"score":1239,"match_score":1251}`|
|122|`{"type":1,"score":1274,"match_score":1251}`|

## PrelimsBotLib

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|44|本表行键；与其他表同值不自动代表同一对象。|
|score|number|44|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|power|number|44|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_tid|number|44|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lv|number|44|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|win_rate|number|44|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|style|number|44|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"score":400,"power":1373454,"fight_tid":10100001,"lv":52,"win_rate":30}`|
|102|`{"score":400,"power":1424012,"fight_tid":10100001,"lv":52,"win_rate":40}`|
|103|`{"score":400,"power":1481132,"fight_tid":10100001,"lv":52,"win_rate":35}`|
|104|`{"score":400,"power":1316451,"fight_tid":10100001,"lv":52,"win_rate":38}`|
|105|`{"score":400,"power":1366165,"fight_tid":10100001,"lv":52,"win_rate":31}`|
|106|`{"score":400,"power":1445698,"fight_tid":10100001,"lv":52,"win_rate":41}`|
|107|`{"score":400,"power":1296161,"fight_tid":10100001,"lv":52,"win_rate":36}`|
|108|`{"score":400,"power":1459560,"fight_tid":10100001,"lv":52,"win_rate":39}`|
|109|`{"score":400,"power":1419561,"fight_tid":10100001,"lv":52,"win_rate":32}`|
|110|`{"score":400,"power":2842313,"fight_tid":10100001,"lv":52,"win_rate":42}`|
|111|`{"score":400,"power":2364631,"fight_tid":10100001,"lv":52,"win_rate":37}`|
|112|`{"score":400,"power":2678413,"fight_tid":10100001,"lv":52,"win_rate":40}`|
|113|`{"score":400,"power":2356516,"fight_tid":10100001,"lv":57,"win_rate":33}`|
|114|`{"score":400,"power":2211651,"fight_tid":10100001,"lv":57,"win_rate":43}`|
|115|`{"score":400,"power":2841321,"fight_tid":10100001,"lv":57,"win_rate":38}`|
|116|`{"score":400,"power":2126561,"fight_tid":10100001,"lv":57,"win_rate":41}`|
|117|`{"score":400,"power":2542123,"fight_tid":10100001,"lv":60,"win_rate":34}`|
|118|`{"score":400,"power":4210156,"fight_tid":10100001,"lv":60,"win_rate":44}`|
|119|`{"score":400,"power":4103132,"fight_tid":10100001,"lv":63,"win_rate":39}`|
|120|`{"score":400,"power":4412316,"fight_tid":10100001,"lv":63,"win_rate":42}`|
|121|`{"score":400,"power":3946123,"fight_tid":10100001,"lv":75,"win_rate":35}`|
|122|`{"score":400,"power":3894156,"fight_tid":10100001,"lv":75,"win_rate":45}`|
|201|`{"score":400,"power":2746908,"fight_tid":10100004,"lv":52,"win_rate":30}`|
|202|`{"score":400,"power":2848024,"fight_tid":10100004,"lv":52,"win_rate":40}`|
|203|`{"score":400,"power":2962264,"fight_tid":10100004,"lv":52,"win_rate":35}`|
|204|`{"score":400,"power":2632902,"fight_tid":10100004,"lv":52,"win_rate":38}`|
|205|`{"score":400,"power":2732330,"fight_tid":10100004,"lv":52,"win_rate":31}`|
|206|`{"score":400,"power":2891396,"fight_tid":10100004,"lv":52,"win_rate":41}`|
|207|`{"score":400,"power":2592322,"fight_tid":10100004,"lv":52,"win_rate":36}`|
|208|`{"score":400,"power":2919120,"fight_tid":10100004,"lv":52,"win_rate":39}`|
|209|`{"score":400,"power":2839122,"fight_tid":10100004,"lv":52,"win_rate":32}`|
|210|`{"score":400,"power":5684626,"fight_tid":10100004,"lv":52,"win_rate":42}`|
|211|`{"score":400,"power":4729262,"fight_tid":10100004,"lv":52,"win_rate":37}`|
|212|`{"score":400,"power":5356826,"fight_tid":10100004,"lv":52,"win_rate":40}`|
|213|`{"score":400,"power":4713032,"fight_tid":10100004,"lv":57,"win_rate":33}`|
|214|`{"score":400,"power":4423302,"fight_tid":10100004,"lv":57,"win_rate":43}`|
|215|`{"score":400,"power":5682642,"fight_tid":10100004,"lv":57,"win_rate":38}`|
|216|`{"score":400,"power":4253122,"fight_tid":10100004,"lv":57,"win_rate":41}`|
|217|`{"score":400,"power":5084246,"fight_tid":10100004,"lv":60,"win_rate":34}`|
|218|`{"score":400,"power":8420312,"fight_tid":10100004,"lv":60,"win_rate":44}`|
|219|`{"score":400,"power":8206264,"fight_tid":10100004,"lv":63,"win_rate":39}`|
|220|`{"score":400,"power":8824632,"fight_tid":10100004,"lv":63,"win_rate":42}`|
|221|`{"score":400,"power":7892246,"fight_tid":10100004,"lv":75,"win_rate":35}`|
|222|`{"score":400,"power":7788312,"fight_tid":10100004,"lv":75,"win_rate":45}`|

## PrelimsBuyTimes

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|buy_type|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rang|array|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|consume_list|array|6|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"buy_type":0,"consume_list":[[101500,10]]}`|
|2|`{"buy_type":0,"consume_list":[[101500,10]]}`|
|3|`{"buy_type":0,"consume_list":[[101500,10]]}`|
|4|`{"buy_type":1,"consume_list":[[101500,10]]}`|
|5|`{"buy_type":1,"consume_list":[[101500,10]]}`|
|6|`{"buy_type":1,"consume_list":[[101500,10]]}`|

## PrelimsLevel

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|12|本表行键；与其他表同值不自动代表同一对象。|
|win_elo_k|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|def_elo_k|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|integral|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|des|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lv_des|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lv_index|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|icon|string|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|big_stage_icon|string|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lv_index_txt|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|12|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"win_elo_k":70,"lv_des":12475,"lv_index":0,"big_stage_icon":"ICON_duanwei_yongzhe.png","lv_index_txt":999470852,"award":[[7901900,100],[7801900,300],[2981200,3]]}`|
|2|`{"win_elo_k":70,"lv_des":12475,"lv_index":0,"big_stage_icon":"ICON_duanwei_yongzhe.png","lv_index_txt":999472092,"award":[[7901900,200],[7801900,500],[2981200,5]]}`|
|3|`{"win_elo_k":70,"lv_des":12475,"lv_index":0,"big_stage_icon":"ICON_duanwei_yongzhe.png","lv_index_txt":999472043,"award":[[7901900,260],[7801900,600],[2981200,6]]}`|
|4|`{"win_elo_k":70,"lv_des":12476,"lv_index":1,"big_stage_icon":"ICON_duanwei_qishi.png","lv_index_txt":999470852,"award":[[7901900,300],[7801900,700],[2981200,8]]}`|
|5|`{"win_elo_k":70,"lv_des":12476,"lv_index":1,"big_stage_icon":"ICON_duanwei_qishi.png","lv_index_txt":999472092,"award":[[7901900,350],[7801900,800],[2981200,10]]}`|
|6|`{"win_elo_k":70,"lv_des":12476,"lv_index":1,"big_stage_icon":"ICON_duanwei_qishi.png","lv_index_txt":999472043,"award":[[7901900,400],[7801900,1000],[2981200,12]]}`|
|7|`{"win_elo_k":60,"lv_des":12477,"lv_index":2,"big_stage_icon":"ICON_duanwei_lingzhu.png","lv_index_txt":999470852,"award":[[7901900,500],[7801900,1200],[2981200,14]]}`|
|8|`{"win_elo_k":60,"lv_des":12477,"lv_index":2,"big_stage_icon":"ICON_duanwei_lingzhu.png","lv_index_txt":999472092,"award":[[7901900,700],[7801900,1500],[2981200,16]]}`|
|9|`{"win_elo_k":60,"lv_des":12477,"lv_index":2,"big_stage_icon":"ICON_duanwei_lingzhu.png","lv_index_txt":999472043,"award":[[7901900,1000],[7801900,1800],[2981200,18]]}`|
|10|`{"win_elo_k":50,"lv_des":12478,"lv_index":3,"big_stage_icon":"ICON_duanwei_zongshi.png","lv_index_txt":999470852,"award":[[7901900,1500],[7801900,2000],[2981200,20]]}`|
|11|`{"win_elo_k":50,"lv_des":12478,"lv_index":3,"big_stage_icon":"ICON_duanwei_zongshi.png","lv_index_txt":999472092,"award":[[7901900,1800],[7801900,2500],[2981200,22]]}`|
|12|`{"win_elo_k":20,"lv_des":676122,"lv_index":4,"big_stage_icon":"ICON_duanwei_wanjiewangzhe.png","lv_index_txt":999472043,"award":[[7901900,2000],[7801900,3000],[2981200,25]]}`|
