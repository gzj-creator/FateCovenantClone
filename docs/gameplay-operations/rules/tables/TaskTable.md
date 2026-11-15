# TaskTable 规则参数

来源：[personal-server/assets/tables/TaskTable.data.lua.json.gz](../../../../personal-server/assets/tables/TaskTable.data.lua.json.gz)，SHA256：`ae2f8ccae9084e25958f5439c0c424314c69505bed52bfd4e9376ab306edface`。

[完整逐行JSON](TaskTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[MainLinearFunc](#mainlinearfunc)|31|decoded-rows|
|[MainLinearUnlock](#mainlinearunlock)|55|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[Type](#type)|608|rows-with-external-references|
|[GroupTask](#grouptask)|20|decoded-rows|
|[Group](#group)|6|decoded-rows|
|[GroupFunc](#groupfunc)|0|decoded-rows|
|[MissionWorldCartoon](#missionworldcartoon)|0|decoded-rows|
|[MissionLife](#missionlife)|102|decoded-rows|
|[TalkRole](#talkrole)|219|decoded-rows|
|[Talk](#talk)|4167|decoded-rows|
|[Story](#story)|978|decoded-rows|
|[StoryEmote](#storyemote)|54|decoded-rows|
|[CatoonTalk](#catoontalk)|20|decoded-rows|
|[CatoonBullet](#catoonbullet)|1483|decoded-rows|
|[CatoonChapter](#catoonchapter)|173|decoded-rows|
|[Catoon](#catoon)|1412|decoded-rows|
|[WeeklyTask](#weeklytask)|4|decoded-rows|
|[MainTask](#maintask)|484|decoded-rows|
|[DailyTaskConst](#dailytaskconst)|1|decoded-rows|
|[DailyTaskTipsCheck](#dailytasktipscheck)|26|decoded-rows|
|[DailyTaskVitality](#dailytaskvitality)|2|decoded-rows|
|[DailyTaskOffsetGroup](#dailytaskoffsetgroup)|15|decoded-rows|
|[DailyTask](#dailytask)|117|decoded-rows|
|[DailyTaskExtraAward](#dailytaskextraaward)|5|rows-with-external-references|
|[LinearTaskConst](#lineartaskconst)|1|decoded-rows|
|[LinearTaskType](#lineartasktype)|1|decoded-rows|
|[LinearTask](#lineartask)|536|decoded-rows|
|[CommonTask](#commontask)|未知|unresolved：Empty/non-row output; field map not independently recovered|
|[CommonTaskGlobal](#commontaskglobal)|4|decoded-rows|

## MainLinearFunc

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|31|本表行键；与其他表同值不自动代表同一对象。|
|icon|string|31|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|des|number|31|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1045|`{}`|
|1051|`{}`|
|1052|`{}`|
|1053|`{}`|
|1054|`{}`|
|1059|`{}`|
|1060|`{}`|
|1061|`{}`|
|1066|`{}`|
|1067|`{}`|
|1068|`{}`|
|1116|`{}`|
|1133|`{}`|
|1151|`{}`|
|1155|`{}`|
|1159|`{}`|
|1168|`{}`|
|1173|`{}`|
|1174|`{}`|
|1195|`{}`|
|1198|`{}`|
|1199|`{}`|
|1206|`{}`|
|1209|`{}`|
|1210|`{}`|
|1218|`{}`|
|1224|`{}`|
|1239|`{}`|
|1264|`{}`|
|1297|`{}`|
|1306|`{}`|

## MainLinearUnlock

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|55|本表行键；与其他表同值不自动代表同一对象。|
|text|array|55|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|func|array|55|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"func":[1059]}`|
|2|`{"func":[1053,1054]}`|
|3|`{"func":[1174]}`|
|4|`{"func":[1052,1173]}`|
|5|`{"func":[1051]}`|
|6|`{"func":[1218]}`|
|7|`{"func":[]}`|
|8|`{"func":[]}`|
|9|`{"func":[1195,1068]}`|
|10|`{"func":[1066,1067]}`|
|11|`{"func":[1061]}`|
|12|`{"func":[]}`|
|13|`{"func":[1151]}`|
|14|`{"func":[]}`|
|15|`{"func":[]}`|
|16|`{"func":[]}`|
|17|`{"func":[1168,1133]}`|
|18|`{"func":[1209]}`|
|19|`{"func":[]}`|
|20|`{"func":[]}`|
|21|`{"func":[]}`|
|22|`{"func":[]}`|
|23|`{"func":[]}`|
|24|`{"func":[]}`|
|25|`{"func":[1206]}`|
|26|`{"func":[]}`|
|27|`{"func":[1297,1306]}`|
|28|`{"func":[]}`|
|29|`{"func":[]}`|
|30|`{"func":[]}`|
|31|`{"func":[]}`|
|32|`{"func":[]}`|
|33|`{"func":[]}`|
|34|`{"func":[]}`|
|35|`{"func":[]}`|
|36|`{"func":[]}`|
|37|`{"func":[]}`|
|38|`{"func":[]}`|
|39|`{"func":[]}`|
|40|`{"func":[]}`|
|41|`{"func":[]}`|
|42|`{"func":[]}`|
|43|`{"func":[]}`|
|44|`{"func":[]}`|
|45|`{"func":[]}`|
|46|`{"func":[]}`|
|47|`{"func":[]}`|
|48|`{"func":[]}`|
|49|`{"func":[]}`|
|50|`{"func":[]}`|
|51|`{"func":[]}`|
|52|`{"func":[]}`|
|53|`{"func":[]}`|
|54|`{"func":[]}`|
|55|`{"func":[]}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|linear_lv|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|main_task_last_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"linear_lv":40,"main_task_last_time":1757278800}`|

## Type

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|data|number|608|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|progress_fun|number|608|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|stat_expand|array|608|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skip|number|608|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|608|本表行键；与其他表同值不自动代表同一对象。|
|reverse|boolean|608|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|progress_param|number|608|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|title|number|608|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|unLock_Hide|boolean|608|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|des|number|608|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|target_txt_func|undefined/object|608|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|param_txt_func|undefined/object|608|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sort_weight|number|608|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|
|progress_type|number|608|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部608行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"progress_fun":0,"stat_expand":[1015001],"progress_param":0,"unLock_Hide":false,"sort_weight":0,"progress_type":2}`|
|2|`{"progress_fun":0,"stat_expand":[2015001],"progress_param":0,"unLock_Hide":false,"sort_weight":0,"progress_type":2}`|
|1002|`{"progress_fun":0,"stat_expand":[1],"progress_param":0,"unLock_Hide":false,"sort_weight":5,"progress_type":2}`|

## GroupTask

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|award|array|20|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|type|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|20|本表行键；与其他表同值不自动代表同一对象。|
|target_count|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_key|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|100101|`{"award":[],"type":8601,"target_count":3,"task_key":0}`|
|100201|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|
|100202|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|
|100203|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|
|100301|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|
|100302|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|
|100303|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|
|100304|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|
|100401|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|
|100402|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|
|100403|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|
|100404|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|
|100501|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|
|100502|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|
|100503|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|
|100504|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|
|100601|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|
|100602|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|
|100603|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|
|100604|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|

## Group

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|need_seq|boolean|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_scale|number|6|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award|array|6|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|award_pos|array|6|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|is_customized|boolean|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tasks|array|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{"need_seq":false,"award_scale":0.6,"award":[[201500,1]],"award_pos":[0.54,1.124],"is_customized":true,"tasks":[100101]}`|
|1002|`{"need_seq":false,"award_scale":0.7,"award":[[201500,1]],"award_pos":[0.54,1.32],"is_customized":false,"tasks":[100201,100202,100203]}`|
|1003|`{"need_seq":false,"award_scale":0.6,"award":[[201500,1]],"award_pos":[0.54,1.124],"is_customized":false,"tasks":[100301,100302,100303,100304]}`|
|1004|`{"need_seq":false,"award_scale":0.6,"award":[[201500,1]],"award_pos":[0.54,1.124],"is_customized":false,"tasks":[100401,100402,100403,100404]}`|
|1005|`{"need_seq":false,"award_scale":0,"award":[[201500,1]],"award_pos":[],"is_customized":false,"tasks":[100501,100502,100503,100504]}`|
|1006|`{"need_seq":false,"award_scale":0,"award":[[201500,1]],"award_pos":[],"is_customized":false,"tasks":[100601,100602,100603,100604]}`|

## GroupFunc

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## MissionWorldCartoon

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## MissionLife

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|cartoon|number|102|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|high_story|number|102|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|open_mission|number|102|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|102|本表行键；与其他表同值不自动代表同一对象。|
|show_type|number|102|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|normal_story|number|102|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"open_mission":10202,"show_type":1}`|
|2|`{"open_mission":0,"show_type":0}`|
|3|`{"open_mission":0,"show_type":0}`|
|4|`{"open_mission":0,"show_type":0}`|
|5|`{"open_mission":0,"show_type":0}`|
|6|`{"open_mission":0,"show_type":0}`|
|7|`{"open_mission":20201,"show_type":0}`|
|8|`{"open_mission":20201,"show_type":0}`|
|9|`{"open_mission":20205,"show_type":0}`|
|10|`{"open_mission":30201,"show_type":1}`|
|11|`{"open_mission":30203,"show_type":1}`|
|12|`{"open_mission":30203,"show_type":0}`|
|13|`{"open_mission":30202,"show_type":1}`|
|14|`{"open_mission":30204,"show_type":0}`|
|15|`{"open_mission":30205,"show_type":0}`|
|16|`{"open_mission":40201,"show_type":1}`|
|17|`{"open_mission":40203,"show_type":1}`|
|18|`{"open_mission":40206,"show_type":1}`|
|19|`{"open_mission":40210,"show_type":1}`|
|20|`{"open_mission":40210,"show_type":2}`|
|21|`{"open_mission":50201,"show_type":1}`|
|22|`{"open_mission":50203,"show_type":1}`|
|23|`{"open_mission":50206,"show_type":1}`|
|24|`{"open_mission":50210,"show_type":1}`|
|25|`{"open_mission":50210,"show_type":2}`|
|26|`{"open_mission":0,"show_type":0}`|
|27|`{"open_mission":60201,"show_type":1}`|
|28|`{"open_mission":60203,"show_type":1}`|
|29|`{"open_mission":60203,"show_type":2}`|
|30|`{"open_mission":60206,"show_type":1}`|
|31|`{"open_mission":60210,"show_type":1}`|
|32|`{"open_mission":60210,"show_type":2}`|
|33|`{"open_mission":70201,"show_type":1}`|
|34|`{"open_mission":70203,"show_type":1}`|
|35|`{"open_mission":70206,"show_type":1}`|
|36|`{"open_mission":70210,"show_type":1}`|
|37|`{"open_mission":70210,"show_type":2}`|
|38|`{"open_mission":0,"show_type":0}`|
|39|`{"open_mission":80201,"show_type":1}`|
|40|`{"open_mission":80203,"show_type":1}`|
|41|`{"open_mission":80206,"show_type":1}`|
|42|`{"open_mission":80210,"show_type":1}`|
|43|`{"open_mission":0,"show_type":0}`|
|44|`{"open_mission":0,"show_type":0}`|
|45|`{"open_mission":90201,"show_type":1}`|
|46|`{"open_mission":90203,"show_type":1}`|
|47|`{"open_mission":90206,"show_type":1}`|
|48|`{"open_mission":90210,"show_type":1}`|
|49|`{"open_mission":90210,"show_type":2}`|
|50|`{"open_mission":0,"show_type":0}`|
|51|`{"open_mission":100201,"show_type":1}`|
|52|`{"open_mission":100203,"show_type":1}`|
|53|`{"open_mission":100203,"show_type":2}`|
|54|`{"open_mission":100206,"show_type":1}`|
|55|`{"open_mission":100206,"show_type":2}`|
|56|`{"open_mission":100210,"show_type":1}`|
|57|`{"open_mission":100210,"show_type":2}`|
|58|`{"open_mission":0,"show_type":0}`|
|59|`{"open_mission":110201,"show_type":1}`|
|60|`{"open_mission":110201,"show_type":2}`|
|61|`{"open_mission":110203,"show_type":1}`|
|62|`{"open_mission":110206,"show_type":1}`|
|63|`{"open_mission":110210,"show_type":1}`|
|64|`{"open_mission":110210,"show_type":2}`|
|65|`{"open_mission":120201,"show_type":1}`|
|66|`{"open_mission":120203,"show_type":1}`|
|67|`{"open_mission":120203,"show_type":2}`|
|68|`{"open_mission":120206,"show_type":1}`|
|69|`{"open_mission":120206,"show_type":2}`|
|70|`{"open_mission":120210,"show_type":1}`|
|71|`{"open_mission":0,"show_type":0}`|
|72|`{"open_mission":130201,"show_type":1}`|
|73|`{"open_mission":130203,"show_type":1}`|
|74|`{"open_mission":130206,"show_type":1}`|
|75|`{"open_mission":130210,"show_type":1}`|
|76|`{"open_mission":130210,"show_type":2}`|
|77|`{"open_mission":140201,"show_type":1}`|
|78|`{"open_mission":140203,"show_type":1}`|
|79|`{"open_mission":140206,"show_type":1}`|
|80|`{"open_mission":140210,"show_type":1}`|
|81|`{"open_mission":140210,"show_type":2}`|
|82|`{"open_mission":0,"show_type":0}`|
|83|`{"open_mission":150201,"show_type":1}`|
|84|`{"open_mission":150203,"show_type":1}`|
|85|`{"open_mission":150206,"show_type":1}`|
|86|`{"open_mission":150210,"show_type":1}`|
|87|`{"open_mission":150210,"show_type":2}`|
|88|`{"open_mission":160201,"show_type":1}`|
|89|`{"open_mission":160203,"show_type":1}`|
|90|`{"open_mission":160206,"show_type":1}`|
|91|`{"open_mission":160210,"show_type":1}`|
|92|`{"open_mission":160210,"show_type":2}`|
|93|`{"open_mission":170201,"show_type":1}`|
|94|`{"open_mission":170203,"show_type":1}`|
|95|`{"open_mission":170206,"show_type":1}`|
|96|`{"open_mission":170210,"show_type":1}`|
|97|`{"open_mission":170210,"show_type":2}`|
|98|`{"open_mission":180201,"show_type":1}`|
|99|`{"open_mission":180203,"show_type":1}`|
|100|`{"open_mission":180206,"show_type":1}`|
|101|`{"open_mission":180210,"show_type":1}`|
|102|`{"open_mission":180210,"show_type":2}`|

## TalkRole

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|style|number|219|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rot_left|number|219|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|219|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|isSelf|boolean|219|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|219|本表行键；与其他表同值不自动代表同一对象。|
|vertical_drawing_name|string|219|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pos|undefined|219|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|name_bg|string|219|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rot_right|number|219|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pos_right|undefined|219|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|head_name|string|219|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|vertical_drawing_pos|undefined|219|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|vertical_drawing_scale|undefined|219|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|default_idle|string|219|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|scale|number|219|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pos_left|undefined|219|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"vertical_drawing_name":""}`|
|2|`{"vertical_drawing_name":""}`|
|3|`{"vertical_drawing_name":""}`|
|4|`{"vertical_drawing_name":""}`|
|5|`{"vertical_drawing_name":""}`|
|6|`{"vertical_drawing_name":""}`|
|7|`{"vertical_drawing_name":""}`|
|8|`{"vertical_drawing_name":"Icon_Hero_TY_LingShu.png"}`|
|9|`{"vertical_drawing_name":""}`|
|10|`{"vertical_drawing_name":""}`|
|11|`{"vertical_drawing_name":""}`|
|12|`{"vertical_drawing_name":""}`|
|13|`{"vertical_drawing_name":""}`|
|14|`{"vertical_drawing_name":""}`|
|15|`{"vertical_drawing_name":"Icon_Hero_TY_TuTuZhanShi.png"}`|
|16|`{"vertical_drawing_name":""}`|
|17|`{"vertical_drawing_name":""}`|
|18|`{"vertical_drawing_name":""}`|
|19|`{"vertical_drawing_name":""}`|
|20|`{"vertical_drawing_name":""}`|
|21|`{"vertical_drawing_name":""}`|
|22|`{"vertical_drawing_name":""}`|
|23|`{"vertical_drawing_name":""}`|
|24|`{"vertical_drawing_name":"Icon_Hero_TY_ChenXiHaoShou.png"}`|
|25|`{"vertical_drawing_name":""}`|
|26|`{"vertical_drawing_name":""}`|
|27|`{"vertical_drawing_name":""}`|
|29|`{"vertical_drawing_name":""}`|
|30|`{"vertical_drawing_name":""}`|
|31|`{"vertical_drawing_name":""}`|
|32|`{"vertical_drawing_name":""}`|
|33|`{"vertical_drawing_name":""}`|
|34|`{"vertical_drawing_name":""}`|
|35|`{"vertical_drawing_name":""}`|
|36|`{"vertical_drawing_name":""}`|
|37|`{"vertical_drawing_name":""}`|
|38|`{"vertical_drawing_name":""}`|
|39|`{"vertical_drawing_name":""}`|
|40|`{"vertical_drawing_name":""}`|
|41|`{"vertical_drawing_name":""}`|
|42|`{"vertical_drawing_name":""}`|
|43|`{"vertical_drawing_name":""}`|
|44|`{"vertical_drawing_name":""}`|
|45|`{"vertical_drawing_name":""}`|
|46|`{"vertical_drawing_name":""}`|
|47|`{"vertical_drawing_name":""}`|
|48|`{"vertical_drawing_name":""}`|
|49|`{"vertical_drawing_name":""}`|
|50|`{"vertical_drawing_name":""}`|
|51|`{"vertical_drawing_name":""}`|
|52|`{"vertical_drawing_name":""}`|
|53|`{"vertical_drawing_name":""}`|
|54|`{"vertical_drawing_name":""}`|
|56|`{"vertical_drawing_name":""}`|
|57|`{"vertical_drawing_name":""}`|
|58|`{"vertical_drawing_name":""}`|
|59|`{"vertical_drawing_name":""}`|
|60|`{"vertical_drawing_name":""}`|
|61|`{"vertical_drawing_name":""}`|
|62|`{"vertical_drawing_name":""}`|
|63|`{"vertical_drawing_name":""}`|
|64|`{"vertical_drawing_name":""}`|
|65|`{"vertical_drawing_name":""}`|
|66|`{"vertical_drawing_name":""}`|
|67|`{"vertical_drawing_name":""}`|
|68|`{"vertical_drawing_name":""}`|
|69|`{"vertical_drawing_name":""}`|
|70|`{"vertical_drawing_name":""}`|
|71|`{"vertical_drawing_name":""}`|
|72|`{"vertical_drawing_name":""}`|
|73|`{"vertical_drawing_name":""}`|
|74|`{"vertical_drawing_name":"img_aoliweiya01jingya.png"}`|
|75|`{"vertical_drawing_name":"img_aoliweiya02wink.png"}`|
|76|`{"vertical_drawing_name":"img_aoliweiya03deyi.png"}`|
|77|`{"vertical_drawing_name":"img_aoliweiya04ganga.png"}`|
|78|`{"vertical_drawing_name":"img_aoliweiya05jinghuang.png"}`|
|79|`{"vertical_drawing_name":"img_aoliweiya06daxiao.png"}`|
|80|`{"vertical_drawing_name":"img_aoliweiya07fennu.png"}`|
|81|`{"vertical_drawing_name":"img_aoliweiya08renzhen.png"}`|
|82|`{"vertical_drawing_name":"img_jinlinwang01kuxiao.png"}`|
|83|`{"vertical_drawing_name":"img_jinlinwang02danyou.png"}`|
|84|`{"vertical_drawing_name":"img_jinlinwang03zilian.png"}`|
|85|`{"vertical_drawing_name":"img_luobo01weixiao.png"}`|
|86|`{"vertical_drawing_name":"img_luobo02jingya.png"}`|
|87|`{"vertical_drawing_name":"img_mixuer01jingya.png"}`|
|88|`{"vertical_drawing_name":"img_mixuer02cry.png"}`|
|89|`{"vertical_drawing_name":"img_mixuer03sad.png"}`|
|90|`{"vertical_drawing_name":"img_mixuer04smile.png"}`|
|91|`{"vertical_drawing_name":"img_mixuer05yansu.png"}`|
|92|`{"vertical_drawing_name":""}`|
|93|`{"vertical_drawing_name":""}`|
|95|`{"vertical_drawing_name":""}`|
|96|`{"vertical_drawing_name":""}`|
|97|`{"vertical_drawing_name":""}`|
|98|`{"vertical_drawing_name":""}`|
|99|`{"vertical_drawing_name":"img_laiya01shengqi.png"}`|
|100|`{"vertical_drawing_name":"img_laiya02daxiao.png"}`|
|101|`{"vertical_drawing_name":"img_laiya03jingya.png"}`|
|102|`{"vertical_drawing_name":"img_laiya04ganga.png"}`|
|103|`{"vertical_drawing_name":"img_laiya05zixin.png"}`|
|104|`{"vertical_drawing_name":"img_laiya06yansu.png"}`|
|105|`{"vertical_drawing_name":"img_laiya07shiwang.png"}`|
|106|`{"vertical_drawing_name":"img_yalungelin01jingya.png"}`|
|107|`{"vertical_drawing_name":"img_yalungelin02daxiao.png"}`|
|108|`{"vertical_drawing_name":"img_yalungelin03weixiao.png"}`|
|109|`{"vertical_drawing_name":""}`|
|110|`{"vertical_drawing_name":"img_mixuer06fennu.png"}`|
|111|`{"vertical_drawing_name":"img_mixuer07haixiu.png"}`|
|112|`{"vertical_drawing_name":"img_laiya08jusang.png"}`|
|113|`{"vertical_drawing_name":""}`|
|114|`{"vertical_drawing_name":""}`|
|115|`{"vertical_drawing_name":""}`|
|116|`{"vertical_drawing_name":""}`|
|117|`{"vertical_drawing_name":""}`|
|118|`{"vertical_drawing_name":""}`|
|119|`{"vertical_drawing_name":""}`|
|120|`{"vertical_drawing_name":""}`|
|121|`{"vertical_drawing_name":""}`|
|122|`{"vertical_drawing_name":""}`|
|123|`{"vertical_drawing_name":""}`|
|124|`{"vertical_drawing_name":""}`|
|125|`{"vertical_drawing_name":""}`|
|126|`{"vertical_drawing_name":""}`|
|127|`{"vertical_drawing_name":""}`|
|128|`{"vertical_drawing_name":""}`|
|129|`{"vertical_drawing_name":""}`|
|130|`{"vertical_drawing_name":""}`|
|131|`{"vertical_drawing_name":""}`|
|132|`{"vertical_drawing_name":""}`|
|133|`{"vertical_drawing_name":""}`|
|134|`{"vertical_drawing_name":""}`|
|135|`{"vertical_drawing_name":""}`|
|136|`{"vertical_drawing_name":""}`|
|138|`{"vertical_drawing_name":""}`|
|140|`{"vertical_drawing_name":"Icon_Hero_TY_XuFengMuZhe.png"}`|
|141|`{"vertical_drawing_name":""}`|
|142|`{"vertical_drawing_name":""}`|
|143|`{"vertical_drawing_name":""}`|
|144|`{"vertical_drawing_name":""}`|
|145|`{"vertical_drawing_name":""}`|
|146|`{"vertical_drawing_name":"Icon_Hero_TY_AnYuZhiZhu.png"}`|
|147|`{"vertical_drawing_name":"Icon_Hero_TY_HuanFengQiShi.png"}`|
|148|`{"vertical_drawing_name":"Icon_Hero_TY_ShenLongJiSi.png"}`|
|149|`{"vertical_drawing_name":"Icon_Hero_TY_YiBiLiSi.png"}`|
|150|`{"vertical_drawing_name":"Icon_Hero_TY_FeiZhiEGui.png"}`|
|151|`{"vertical_drawing_name":""}`|
|152|`{"vertical_drawing_name":""}`|
|153|`{"vertical_drawing_name":""}`|
|154|`{"vertical_drawing_name":""}`|
|156|`{"vertical_drawing_name":""}`|
|161|`{"vertical_drawing_name":""}`|
|166|`{"vertical_drawing_name":""}`|
|167|`{"vertical_drawing_name":""}`|
|171|`{"vertical_drawing_name":""}`|
|175|`{"vertical_drawing_name":""}`|
|177|`{"vertical_drawing_name":""}`|
|179|`{"vertical_drawing_name":""}`|
|180|`{"vertical_drawing_name":""}`|
|182|`{"vertical_drawing_name":""}`|
|183|`{"vertical_drawing_name":""}`|
|184|`{"vertical_drawing_name":""}`|
|185|`{"vertical_drawing_name":""}`|
|188|`{"vertical_drawing_name":""}`|
|190|`{"vertical_drawing_name":""}`|
|192|`{"vertical_drawing_name":""}`|
|195|`{"vertical_drawing_name":""}`|
|197|`{"vertical_drawing_name":""}`|
|203|`{"vertical_drawing_name":""}`|
|204|`{"vertical_drawing_name":"Icon_Hero_TY_ZhuGuangZhiYing.png"}`|
|205|`{"vertical_drawing_name":""}`|
|206|`{"vertical_drawing_name":""}`|
|207|`{"vertical_drawing_name":""}`|
|208|`{"vertical_drawing_name":""}`|
|209|`{"vertical_drawing_name":""}`|
|210|`{"vertical_drawing_name":""}`|
|211|`{"vertical_drawing_name":""}`|
|212|`{"vertical_drawing_name":""}`|
|213|`{"vertical_drawing_name":""}`|
|214|`{"vertical_drawing_name":""}`|
|215|`{"vertical_drawing_name":""}`|
|216|`{"vertical_drawing_name":""}`|
|217|`{"vertical_drawing_name":""}`|
|218|`{"vertical_drawing_name":""}`|
|219|`{"vertical_drawing_name":""}`|
|220|`{"vertical_drawing_name":""}`|
|221|`{"vertical_drawing_name":""}`|
|222|`{"vertical_drawing_name":""}`|
|223|`{"vertical_drawing_name":""}`|
|224|`{"vertical_drawing_name":""}`|
|225|`{"vertical_drawing_name":""}`|
|226|`{"vertical_drawing_name":""}`|
|227|`{"vertical_drawing_name":""}`|
|228|`{"vertical_drawing_name":""}`|
|229|`{"vertical_drawing_name":""}`|
|230|`{"vertical_drawing_name":""}`|
|231|`{"vertical_drawing_name":""}`|
|232|`{"vertical_drawing_name":""}`|
|233|`{"vertical_drawing_name":"img_rlyy_mixueer.png"}`|
|234|`{"vertical_drawing_name":"img_rlyy_geleisi.png"}`|
|235|`{"vertical_drawing_name":"img_rlyy_changpu.png"}`|
|236|`{"vertical_drawing_name":""}`|
|237|`{"vertical_drawing_name":""}`|
|238|`{"vertical_drawing_name":""}`|
|239|`{"vertical_drawing_name":""}`|
|240|`{"vertical_drawing_name":""}`|
|241|`{"vertical_drawing_name":""}`|
|242|`{"vertical_drawing_name":""}`|
|243|`{"vertical_drawing_name":""}`|
|244|`{"vertical_drawing_name":""}`|
|245|`{"vertical_drawing_name":""}`|
|246|`{"vertical_drawing_name":""}`|
|247|`{"vertical_drawing_name":""}`|
|248|`{"vertical_drawing_name":""}`|
|249|`{"vertical_drawing_name":""}`|
|250|`{"vertical_drawing_name":""}`|
|251|`{"vertical_drawing_name":""}`|
|252|`{"vertical_drawing_name":""}`|
|253|`{"vertical_drawing_name":""}`|
|254|`{"vertical_drawing_name":""}`|

## Talk

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|shake_time|number|4167|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4167|本表行键；与其他表同值不自动代表同一对象。|
|translate_text|undefined|4167|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|middle_role|number|4167|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_role|number|4167|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|right_role|number|4167|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|shake_range|number|4167|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|optional_img|array|4167|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|text|number|4167|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_horizontal_optional|boolean|4167|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rotation|undefined|4167|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|action_count|number|4167|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|adaption_if|number|4167|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|optional|array|4167|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cartoon_pic|string|4167|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pic_loc|undefined|4167|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|small_pic_loc|undefined|4167|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|talk_node_loc|undefined|4167|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|action|string|4167|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ui_effect|string|4167|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hide_optional_mask|boolean|4167|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|music|number|4167|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|timeline_action|string|4167|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|left_role|number|4167|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|node_size|array|4167|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|small_pic|string|4167|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|talk_time|number|4167|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|belong_story|number|4167|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部4167行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|3263001|`{"shake_time":0,"is_horizontal_optional":false,"action_count":0,"timeline_action":"","talk_time":0}`|
|3264001|`{"shake_time":0,"is_horizontal_optional":false,"action_count":0,"timeline_action":"","talk_time":0}`|
|3265001|`{"shake_time":0,"is_horizontal_optional":false,"action_count":0,"timeline_action":"","talk_time":0}`|

## Story

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|music|number|978|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_have_next|boolean|978|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|translate_text|undefined|978|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|978|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|978|本表行键；与其他表同值不自动代表同一对象。|
|catoon|number|978|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|text|number|978|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_tid|number|978|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|view_type|number|978|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|time_line|array|978|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|background|string|978|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|custom_param|number|978|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|custom_func|undefined|978|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|need_clear_bg|boolean|978|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部978行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1004|`{"is_have_next":false,"type":0,"fight_tid":0,"time_line":[],"background":"","need_clear_bg":false}`|
|1050|`{"is_have_next":false,"type":4,"fight_tid":0,"time_line":[],"background":"","need_clear_bg":false}`|
|1100|`{"is_have_next":false,"type":4,"fight_tid":0,"time_line":[],"background":"","need_clear_bg":false}`|

## StoryEmote

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|scene_role|number|54|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|scale|number|54|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|wait_time_ms|number|54|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|54|本表行键；与其他表同值不自动代表同一对象。|
|offset|undefined|54|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|emote_prefab|string|54|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|9001002|`{"wait_time_ms":2000}`|
|9002002|`{"wait_time_ms":2000}`|
|9003002|`{"wait_time_ms":2000}`|
|9004002|`{"wait_time_ms":2000}`|
|9005002|`{"wait_time_ms":2000}`|
|9006002|`{"wait_time_ms":2000}`|
|9007002|`{"wait_time_ms":2000}`|
|9008002|`{"wait_time_ms":2000}`|
|9009002|`{"wait_time_ms":2000}`|
|9010002|`{"wait_time_ms":2000}`|
|9011002|`{"wait_time_ms":2000}`|
|9012002|`{"wait_time_ms":2000}`|
|9013002|`{"wait_time_ms":2000}`|
|9014002|`{"wait_time_ms":2000}`|
|9015002|`{"wait_time_ms":2000}`|
|9016002|`{"wait_time_ms":2000}`|
|9017002|`{"wait_time_ms":2000}`|
|9018002|`{"wait_time_ms":2000}`|
|9019002|`{"wait_time_ms":2000}`|
|9020002|`{"wait_time_ms":2000}`|
|9021002|`{"wait_time_ms":2000}`|
|9022002|`{"wait_time_ms":2000}`|
|9023002|`{"wait_time_ms":2000}`|
|9024002|`{"wait_time_ms":2000}`|
|9025002|`{"wait_time_ms":2000}`|
|9026002|`{"wait_time_ms":2000}`|
|9027002|`{"wait_time_ms":2000}`|
|9028002|`{"wait_time_ms":2000}`|
|9029002|`{"wait_time_ms":2000}`|
|9030002|`{"wait_time_ms":2000}`|
|9031002|`{"wait_time_ms":2000}`|
|9032002|`{"wait_time_ms":2000}`|
|9033002|`{"wait_time_ms":2000}`|
|9034002|`{"wait_time_ms":2000}`|
|9035002|`{"wait_time_ms":2000}`|
|9036002|`{"wait_time_ms":2000}`|
|9037002|`{"wait_time_ms":2000}`|
|9038002|`{"wait_time_ms":2000}`|
|9039002|`{"wait_time_ms":2000}`|
|9040002|`{"wait_time_ms":2000}`|
|9041002|`{"wait_time_ms":2000}`|
|9042002|`{"wait_time_ms":2000}`|
|9043002|`{"wait_time_ms":2000}`|
|9044002|`{"wait_time_ms":2000}`|
|9045002|`{"wait_time_ms":2000}`|
|9046002|`{"wait_time_ms":2000}`|
|9047002|`{"wait_time_ms":2000}`|
|9048002|`{"wait_time_ms":2000}`|
|9049002|`{"wait_time_ms":2000}`|
|9050002|`{"wait_time_ms":2000}`|
|9051002|`{"wait_time_ms":2000}`|
|9052002|`{"wait_time_ms":2000}`|
|9053002|`{"wait_time_ms":2000}`|
|9054002|`{"wait_time_ms":2000}`|

## CatoonTalk

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|20|本表行键；与其他表同值不自动代表同一对象。|
|text|undefined|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|font_id|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|font_size|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|font_width|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|txt_id|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|style|string|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|dub|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

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
|19|`{}`|
|20|`{}`|

## CatoonBullet

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|type_value|number|1483|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|1483|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|text|undefined|1483|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|font_id|number|1483|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1483|本表行键；与其他表同值不自动代表同一对象。|
|font_size|number|1483|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|txt_id|number|1483|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|text_value|number|1483|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|belong_story|number|1483|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部1483行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"type_value":-1,"type":2,"text_value":253}`|
|2|`{"type_value":31,"type":1,"text_value":0}`|
|3|`{"type_value":0,"type":0,"text_value":0}`|

## CatoonChapter

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|173|本表行键；与其他表同值不自动代表同一对象。|
|catoon|array|173|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|forbid_jump|boolean|173|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bgm|number|173|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

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
|19|`{}`|
|20|`{}`|
|21|`{}`|
|22|`{}`|
|23|`{}`|
|24|`{}`|
|25|`{}`|
|26|`{}`|
|27|`{}`|
|28|`{}`|
|29|`{}`|
|30|`{}`|
|31|`{}`|
|32|`{}`|
|33|`{}`|
|34|`{}`|
|35|`{}`|
|36|`{}`|
|37|`{}`|
|38|`{}`|
|39|`{}`|
|40|`{}`|
|41|`{}`|
|42|`{}`|
|43|`{}`|
|44|`{}`|
|46|`{}`|
|47|`{}`|
|48|`{}`|
|49|`{}`|
|52|`{}`|
|53|`{}`|
|55|`{}`|
|56|`{}`|
|57|`{}`|
|58|`{}`|
|59|`{}`|
|60|`{}`|
|61|`{}`|
|62|`{}`|
|63|`{}`|
|64|`{}`|
|65|`{}`|
|66|`{}`|
|67|`{}`|
|68|`{}`|
|69|`{}`|
|70|`{}`|
|71|`{}`|
|72|`{}`|
|73|`{}`|
|74|`{}`|
|75|`{}`|
|76|`{}`|
|77|`{}`|
|78|`{}`|
|79|`{}`|
|80|`{}`|
|81|`{}`|
|82|`{}`|
|83|`{}`|
|84|`{}`|
|85|`{}`|
|86|`{}`|
|87|`{}`|
|88|`{}`|
|89|`{}`|
|90|`{}`|
|91|`{}`|
|92|`{}`|
|93|`{}`|
|94|`{}`|
|95|`{}`|
|96|`{}`|
|97|`{}`|
|98|`{}`|
|99|`{}`|
|100|`{}`|
|101|`{}`|
|102|`{}`|
|103|`{}`|
|104|`{}`|
|105|`{}`|
|106|`{}`|
|107|`{}`|
|108|`{}`|
|109|`{}`|
|110|`{}`|
|111|`{}`|
|112|`{}`|
|113|`{}`|
|114|`{}`|
|115|`{}`|
|116|`{}`|
|117|`{}`|
|118|`{}`|
|119|`{}`|
|120|`{}`|
|121|`{}`|
|122|`{}`|
|123|`{}`|
|124|`{}`|
|125|`{}`|
|126|`{}`|
|127|`{}`|
|128|`{}`|
|129|`{}`|
|130|`{}`|
|131|`{}`|
|132|`{}`|
|133|`{}`|
|134|`{}`|
|135|`{}`|
|136|`{}`|
|137|`{}`|
|138|`{}`|
|139|`{}`|
|140|`{}`|
|141|`{}`|
|142|`{}`|
|143|`{}`|
|144|`{}`|
|145|`{}`|
|146|`{}`|
|147|`{}`|
|148|`{}`|
|149|`{}`|
|150|`{}`|
|151|`{}`|
|152|`{}`|
|153|`{}`|
|154|`{}`|
|155|`{}`|
|156|`{}`|
|157|`{}`|
|158|`{}`|
|159|`{}`|
|160|`{}`|
|161|`{}`|
|162|`{}`|
|163|`{}`|
|164|`{}`|
|165|`{}`|
|166|`{}`|
|167|`{}`|
|168|`{}`|
|169|`{}`|
|170|`{}`|
|171|`{}`|
|172|`{}`|
|173|`{}`|
|174|`{}`|
|175|`{}`|
|176|`{}`|
|177|`{}`|

## Catoon

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|talk|array|1412|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|prefab|string|1412|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|1412|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1412|本表行键；与其他表同值不自动代表同一对象。|
|icon|string|1412|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部1412行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|2001|`{}`|
|2002|`{}`|
|2003|`{}`|

## WeeklyTask

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|award|array|4|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|type|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|target_count|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sortOrder|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award":[[3002,1]],"type":4702,"target_count":300}`|
|2|`{"award":[[3002,1]],"type":4702,"target_count":500}`|
|3|`{"award":[[3002,1]],"type":4702,"target_count":900}`|
|4|`{"award":[[3002,2]],"type":4702,"target_count":1400}`|

## MainTask

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|other_param|number|484|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|484|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|type|number|484|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|484|本表行键；与其他表同值不自动代表同一对象。|
|target_count|number|484|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|target_param|number|484|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部484行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|11020001|`{"award":[[31002,5]],"type":1102,"target_count":5,"target_param":0}`|
|11020002|`{"award":[[32002,5]],"type":1102,"target_count":10,"target_param":0}`|
|11020003|`{"award":[[33002,5]],"type":1102,"target_count":15,"target_param":0}`|

## DailyTaskConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|dynamic_open_day|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_tips_red_dot_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|every_max_compensate_times|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|dynamic_award_param|number|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|asserts|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_compensate_times|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"dynamic_open_day":20,"show_tips_red_dot_count":3,"every_max_compensate_times":2,"dynamic_award_param":15000,"asserts":186948600103,"max_compensate_times":10}`|

## DailyTaskTipsCheck

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|26|本表行键；与其他表同值不自动代表同一对象。|
|fun_open|number|26|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|red_dot|number|26|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"fun_open":0}`|
|2|`{"fun_open":0}`|
|3|`{"fun_open":0}`|
|4|`{"fun_open":1164}`|
|5|`{"fun_open":0}`|
|6|`{"fun_open":0}`|
|7|`{"fun_open":0}`|
|8|`{"fun_open":0}`|
|9|`{"fun_open":0}`|
|10|`{"fun_open":0}`|
|11|`{"fun_open":0}`|
|12|`{"fun_open":0}`|
|13|`{"fun_open":0}`|
|14|`{"fun_open":0}`|
|15|`{"fun_open":0}`|
|16|`{"fun_open":0}`|
|17|`{"fun_open":0}`|
|18|`{"fun_open":0}`|
|19|`{"fun_open":0}`|
|20|`{"fun_open":0}`|
|21|`{"fun_open":0}`|
|22|`{"fun_open":0}`|
|23|`{"fun_open":0}`|
|24|`{"fun_open":0}`|
|25|`{"fun_open":0}`|
|26|`{"fun_open":0}`|

## DailyTaskVitality

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|open_day|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_4|array|2|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award_2_n|array|2|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|value|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_3_n|array|2|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award_4_n|array|2|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award_1|array|2|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award_1_n|array|2|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award_3|array|2|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award_2|array|2|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"open_day":1,"award_4":[],"award_2_n":[],"value":[200],"award_3_n":[],"award_4_n":[],"award_1":[2002],"award_1_n":[1],"award_3":[],"award_2":[]}`|
|2|`{"open_day":12,"award_4":[],"award_2_n":[],"value":[200],"award_3_n":[],"award_4_n":[],"award_1":[2002,473002],"award_1_n":[1,3],"award_3":[],"award_2":[]}`|

## DailyTaskOffsetGroup

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|15|本表行键；与其他表同值不自动代表同一对象。|
|open_day|number|15|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"open_day":1}`|
|2|`{"open_day":1}`|
|3|`{"open_day":1}`|
|4|`{"open_day":1}`|
|5|`{"open_day":1}`|
|6|`{"open_day":1}`|
|7|`{"open_day":1}`|
|8|`{"open_day":1}`|
|9|`{"open_day":1}`|
|10|`{"open_day":1}`|
|11|`{"open_day":1}`|
|12|`{"open_day":2}`|
|13|`{"open_day":3}`|
|14|`{"open_day":8}`|
|15|`{"open_day":15}`|

## DailyTask

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|day_range|array|117|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|dynamic_award|array|117|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award|array|117|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|type|number|117|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|117|本表行键；与其他表同值不自动代表同一对象。|
|is_award_role_exp|boolean|117|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|sortOrder|number|117|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|weekend_bonus_item|number|117|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|event|array|117|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|vitality|number|117|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|assert|undefined/number|117|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|target_count|number|117|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|compensate_group_id|number|117|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"day_range":[1,999999],"dynamic_award":[],"award":[[101500,10]],"type":1803,"is_award_role_exp":true,"weekend_bonus_item":101500,"target_count":1,"compensate_group_id":1}`|
|2|`{"day_range":[1,1],"dynamic_award":[],"award":[[101500,10]],"type":1203,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300002,"target_count":20,"compensate_group_id":2}`|
|3|`{"day_range":[1,1],"dynamic_award":[],"award":[[101500,10]],"type":1002,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300002,"target_count":10,"compensate_group_id":3}`|
|4|`{"day_range":[1,1],"dynamic_award":[],"award":[[17002,50]],"type":1603,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300004,"target_count":10,"compensate_group_id":4}`|
|5|`{"day_range":[1,1],"dynamic_award":[],"award":[[17002,50]],"type":1302,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300004,"target_count":1,"compensate_group_id":5}`|
|6|`{"day_range":[1,1],"dynamic_award":[],"award":[[201500,2500]],"type":13301,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300006,"target_count":5,"compensate_group_id":6}`|
|7|`{"day_range":[1,1],"dynamic_award":[],"award":[[901900,10]],"type":2407,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300006,"target_count":2,"compensate_group_id":7}`|
|8|`{"day_range":[1,1],"dynamic_award":[],"award":[[401900,50]],"type":1811,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300002,"target_count":1,"compensate_group_id":8}`|
|9|`{"day_range":[1,1],"dynamic_award":[],"award":[[201500,2500]],"type":1806,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300002,"target_count":1,"compensate_group_id":9}`|
|10|`{"day_range":[1,1],"dynamic_award":[],"award":[[101500,10]],"type":1701,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300002,"target_count":1,"compensate_group_id":10}`|
|11|`{"day_range":[1,1],"dynamic_award":[],"award":[[101900,50]],"type":1402,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300002,"target_count":3,"compensate_group_id":11}`|
|31|`{"day_range":[2,2],"dynamic_award":[],"award":[[101500,10]],"type":1203,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300031,"target_count":10,"compensate_group_id":2}`|
|32|`{"day_range":[2,2],"dynamic_award":[],"award":[[101500,10]],"type":1002,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300031,"target_count":10,"compensate_group_id":3}`|
|33|`{"day_range":[2,2],"dynamic_award":[],"award":[[391002,50]],"type":8301,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300031,"target_count":50,"compensate_group_id":12}`|
|34|`{"day_range":[2,2],"dynamic_award":[],"award":[[201500,2500]],"type":13502,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300031,"target_count":1,"compensate_group_id":9}`|
|35|`{"day_range":[2,2],"dynamic_award":[],"award":[[17002,50]],"type":1603,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300031,"target_count":5,"compensate_group_id":4}`|
|36|`{"day_range":[2,2],"dynamic_award":[],"award":[[17002,50]],"type":1304,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300031,"target_count":1,"compensate_group_id":5}`|
|37|`{"day_range":[2,2],"dynamic_award":[],"award":[[201500,2500]],"type":13301,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300031,"target_count":5,"compensate_group_id":6}`|
|38|`{"day_range":[2,2],"dynamic_award":[],"award":[[901900,10]],"type":2407,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300031,"target_count":2,"compensate_group_id":7}`|
|39|`{"day_range":[2,2],"dynamic_award":[],"award":[[201500,2500]],"type":1811,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300031,"target_count":1,"compensate_group_id":8}`|
|40|`{"day_range":[2,2],"dynamic_award":[],"award":[[101500,10]],"type":1701,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300031,"target_count":1,"compensate_group_id":10}`|
|41|`{"day_range":[2,2],"dynamic_award":[],"award":[[101900,50],[701600,100]],"type":1402,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300031,"target_count":3,"compensate_group_id":11}`|
|61|`{"day_range":[3,3],"dynamic_award":[],"award":[[101500,10]],"type":1002,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300061,"target_count":10,"compensate_group_id":3}`|
|62|`{"day_range":[3,3],"dynamic_award":[],"award":[[179002,50]],"type":8103,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300061,"target_count":3,"compensate_group_id":13}`|
|63|`{"day_range":[3,3],"dynamic_award":[],"award":[[2001900,500],[701600,50]],"type":6508,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300061,"target_count":1,"compensate_group_id":9}`|
|64|`{"day_range":[3,3],"dynamic_award":[],"award":[[391002,50]],"type":8301,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300061,"target_count":50,"compensate_group_id":12}`|
|65|`{"day_range":[3,3],"dynamic_award":[],"award":[[17002,50]],"type":1603,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300061,"target_count":5,"compensate_group_id":4}`|
|66|`{"day_range":[3,3],"dynamic_award":[],"award":[[17002,50]],"type":1304,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300061,"target_count":1,"compensate_group_id":5}`|
|67|`{"day_range":[3,3],"dynamic_award":[],"award":[[201500,2500]],"type":13301,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300061,"target_count":5,"compensate_group_id":6}`|
|68|`{"day_range":[3,3],"dynamic_award":[],"award":[[101500,10]],"type":8301,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300061,"target_count":100,"compensate_group_id":2}`|
|69|`{"day_range":[3,3],"dynamic_award":[],"award":[[901900,10]],"type":2407,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300061,"target_count":2,"compensate_group_id":7}`|
|70|`{"day_range":[3,3],"dynamic_award":[],"award":[[401900,50]],"type":1811,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300061,"target_count":1,"compensate_group_id":8}`|
|71|`{"day_range":[3,3],"dynamic_award":[],"award":[[101500,10]],"type":1701,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300061,"target_count":1,"compensate_group_id":10}`|
|72|`{"day_range":[3,3],"dynamic_award":[],"award":[[101900,50],[701600,50]],"type":1402,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300061,"target_count":3,"compensate_group_id":11}`|
|91|`{"day_range":[4,5],"dynamic_award":[],"award":[[101500,10]],"type":1002,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300091,"target_count":10,"compensate_group_id":3}`|
|92|`{"day_range":[4,5],"dynamic_award":[],"award":[[101900,50],[701600,40]],"type":7002,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300091,"target_count":5,"compensate_group_id":4}`|
|93|`{"day_range":[4,5],"dynamic_award":[],"award":[[179002,50]],"type":8103,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300091,"target_count":3,"compensate_group_id":13}`|
|94|`{"day_range":[4,5],"dynamic_award":[],"award":[[2001900,500],[701600,30]],"type":6508,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300091,"target_count":1,"compensate_group_id":9}`|
|95|`{"day_range":[4,5],"dynamic_award":[],"award":[[391002,50]],"type":8301,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300091,"target_count":50,"compensate_group_id":13}`|
|96|`{"day_range":[4,5],"dynamic_award":[],"award":[[17002,50]],"type":1304,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300091,"target_count":1,"compensate_group_id":5}`|
|97|`{"day_range":[4,5],"dynamic_award":[],"award":[[17002,50]],"type":1603,"is_award_role_exp":false,"weekend_bonus_item":101500,"assert":234640300091,"target_count":5,"compensate_group_id":0}`|
|98|`{"day_range":[4,5],"dynamic_award":[],"award":[[201500,2500]],"type":13301,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300091,"target_count":5,"compensate_group_id":6}`|
|99|`{"day_range":[4,5],"dynamic_award":[],"award":[[101500,10]],"type":8301,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300091,"target_count":100,"compensate_group_id":2}`|
|100|`{"day_range":[4,5],"dynamic_award":[],"award":[[901900,10]],"type":2407,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300091,"target_count":2,"compensate_group_id":7}`|
|101|`{"day_range":[4,5],"dynamic_award":[],"award":[[401900,50]],"type":1811,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300091,"target_count":1,"compensate_group_id":8}`|
|102|`{"day_range":[4,5],"dynamic_award":[],"award":[[101500,10]],"type":1701,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300091,"target_count":1,"compensate_group_id":10}`|
|103|`{"day_range":[4,5],"dynamic_award":[],"award":[[101900,50],[701600,30]],"type":1402,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300091,"target_count":3,"compensate_group_id":11}`|
|121|`{"day_range":[6,7],"dynamic_award":[],"award":[[101500,10]],"type":1002,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300121,"target_count":10,"compensate_group_id":3}`|
|122|`{"day_range":[6,7],"dynamic_award":[],"award":[[101900,50],[701600,40]],"type":7002,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300121,"target_count":5,"compensate_group_id":4}`|
|123|`{"day_range":[6,7],"dynamic_award":[],"award":[[179002,50]],"type":8103,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300121,"target_count":3,"compensate_group_id":13}`|
|124|`{"day_range":[6,7],"dynamic_award":[],"award":[[2001900,500],[701600,30]],"type":6508,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300121,"target_count":1,"compensate_group_id":9}`|
|125|`{"day_range":[6,7],"dynamic_award":[],"award":[[391002,50]],"type":1603,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300121,"target_count":5,"compensate_group_id":0}`|
|126|`{"day_range":[6,7],"dynamic_award":[],"award":[[17002,50]],"type":1304,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300121,"target_count":1,"compensate_group_id":5}`|
|127|`{"day_range":[6,7],"dynamic_award":[],"award":[[201500,2500]],"type":13301,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300121,"target_count":5,"compensate_group_id":6}`|
|128|`{"day_range":[6,7],"dynamic_award":[],"award":[[101500,10]],"type":8301,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300121,"target_count":100,"compensate_group_id":2}`|
|129|`{"day_range":[6,7],"dynamic_award":[],"award":[[901900,10]],"type":2407,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300121,"target_count":2,"compensate_group_id":7}`|
|130|`{"day_range":[6,7],"dynamic_award":[],"award":[[401900,50]],"type":1811,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300121,"target_count":1,"compensate_group_id":8}`|
|131|`{"day_range":[6,7],"dynamic_award":[],"award":[[101500,10]],"type":1701,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300121,"target_count":1,"compensate_group_id":10}`|
|132|`{"day_range":[6,7],"dynamic_award":[],"award":[[101900,50],[701600,30]],"type":1402,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300121,"target_count":3,"compensate_group_id":11}`|
|151|`{"day_range":[8,14],"dynamic_award":[],"award":[[2201900,20]],"type":12311,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300151,"target_count":3,"compensate_group_id":14}`|
|152|`{"day_range":[8,14],"dynamic_award":[],"award":[[101500,10]],"type":1002,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300151,"target_count":10,"compensate_group_id":3}`|
|153|`{"day_range":[8,14],"dynamic_award":[],"award":[[101900,50],[701600,40]],"type":7002,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300151,"target_count":5,"compensate_group_id":4}`|
|154|`{"day_range":[8,14],"dynamic_award":[],"award":[[179002,50]],"type":8103,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300151,"target_count":1,"compensate_group_id":13}`|
|155|`{"day_range":[8,14],"dynamic_award":[],"award":[[2001900,500],[701600,30]],"type":6508,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300151,"target_count":1,"compensate_group_id":9}`|
|156|`{"day_range":[8,14],"dynamic_award":[],"award":[[391002,50]],"type":14002,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300151,"target_count":1,"compensate_group_id":12}`|
|157|`{"day_range":[8,14],"dynamic_award":[],"award":[[17002,50]],"type":1304,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300151,"target_count":1,"compensate_group_id":5}`|
|158|`{"day_range":[8,14],"dynamic_award":[],"award":[[201500,2500]],"type":13301,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300151,"target_count":5,"compensate_group_id":6}`|
|159|`{"day_range":[8,14],"dynamic_award":[],"award":[[101500,10]],"type":8301,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300151,"target_count":100,"compensate_group_id":2}`|
|160|`{"day_range":[8,14],"dynamic_award":[],"award":[[901900,10]],"type":2407,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300151,"target_count":2,"compensate_group_id":7}`|
|161|`{"day_range":[8,14],"dynamic_award":[],"award":[[401900,50]],"type":1805,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300151,"target_count":1,"compensate_group_id":8}`|
|162|`{"day_range":[8,14],"dynamic_award":[],"award":[[101500,10]],"type":1701,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300151,"target_count":1,"compensate_group_id":10}`|
|163|`{"day_range":[8,14],"dynamic_award":[],"award":[[101900,50],[701600,30]],"type":1402,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300151,"target_count":3,"compensate_group_id":11}`|
|181|`{"day_range":[15,28],"dynamic_award":[],"award":[[201500,1000]],"type":12105,"is_award_role_exp":false,"weekend_bonus_item":101500,"assert":234640300181,"target_count":1,"compensate_group_id":0}`|
|182|`{"day_range":[15,28],"dynamic_award":[],"award":[[801900,5],[701600,30]],"type":12401,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300182,"target_count":3,"compensate_group_id":15}`|
|183|`{"day_range":[15,28],"dynamic_award":[],"award":[[2201900,20]],"type":12311,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300182,"target_count":1,"compensate_group_id":14}`|
|184|`{"day_range":[15,28],"dynamic_award":[],"award":[[101500,10]],"type":1002,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300182,"target_count":1,"compensate_group_id":3}`|
|185|`{"day_range":[15,28],"dynamic_award":[],"award":[[101900,50],[701600,30]],"type":7002,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300182,"target_count":3,"compensate_group_id":4}`|
|186|`{"day_range":[15,28],"dynamic_award":[],"award":[[179002,50]],"type":8103,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300182,"target_count":1,"compensate_group_id":13}`|
|187|`{"day_range":[15,28],"dynamic_award":[],"award":[[2001900,500],[701600,20]],"type":6508,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300182,"target_count":1,"compensate_group_id":9}`|
|188|`{"day_range":[15,28],"dynamic_award":[],"award":[[391002,50]],"type":14002,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300182,"target_count":1,"compensate_group_id":12}`|
|189|`{"day_range":[15,28],"dynamic_award":[],"award":[[17002,50]],"type":1304,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300182,"target_count":1,"compensate_group_id":5}`|
|190|`{"day_range":[15,28],"dynamic_award":[],"award":[[201500,2500]],"type":13301,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300182,"target_count":5,"compensate_group_id":6}`|
|191|`{"day_range":[15,28],"dynamic_award":[],"award":[[101500,10]],"type":8301,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300182,"target_count":100,"compensate_group_id":2}`|
|192|`{"day_range":[15,28],"dynamic_award":[],"award":[[901900,10]],"type":2407,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300182,"target_count":2,"compensate_group_id":7}`|
|193|`{"day_range":[15,28],"dynamic_award":[],"award":[[401900,50]],"type":1805,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300182,"target_count":1,"compensate_group_id":8}`|
|194|`{"day_range":[15,28],"dynamic_award":[],"award":[[101500,10]],"type":1701,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300182,"target_count":1,"compensate_group_id":10}`|
|195|`{"day_range":[15,28],"dynamic_award":[],"award":[[101900,50],[701600,20]],"type":1402,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300182,"target_count":3,"compensate_group_id":11}`|
|201|`{"day_range":[29,34],"dynamic_award":[],"award":[[201500,1000]],"type":12105,"is_award_role_exp":false,"weekend_bonus_item":101500,"assert":234640300201,"target_count":1,"compensate_group_id":0}`|
|202|`{"day_range":[29,34],"dynamic_award":[],"award":[[801900,5],[701600,30]],"type":12401,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300201,"target_count":3,"compensate_group_id":15}`|
|203|`{"day_range":[29,34],"dynamic_award":[],"award":[[2201900,20]],"type":12311,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300201,"target_count":1,"compensate_group_id":14}`|
|204|`{"day_range":[29,34],"dynamic_award":[],"award":[[101500,10]],"type":1002,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300201,"target_count":1,"compensate_group_id":3}`|
|205|`{"day_range":[29,34],"dynamic_award":[],"award":[[101900,50],[701600,30]],"type":7002,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300201,"target_count":3,"compensate_group_id":4}`|
|206|`{"day_range":[29,34],"dynamic_award":[],"award":[[179002,50]],"type":8103,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300201,"target_count":1,"compensate_group_id":13}`|
|207|`{"day_range":[29,34],"dynamic_award":[],"award":[[2001900,500],[701600,20]],"type":6508,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300201,"target_count":1,"compensate_group_id":9}`|
|208|`{"day_range":[29,34],"dynamic_award":[],"award":[[391002,50]],"type":14002,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300201,"target_count":1,"compensate_group_id":12}`|
|209|`{"day_range":[29,34],"dynamic_award":[],"award":[[17002,50]],"type":1304,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300201,"target_count":1,"compensate_group_id":5}`|
|210|`{"day_range":[29,34],"dynamic_award":[],"award":[[201500,2500]],"type":13303,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300201,"target_count":1,"compensate_group_id":6}`|
|211|`{"day_range":[29,34],"dynamic_award":[],"award":[[101500,10]],"type":8301,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300201,"target_count":100,"compensate_group_id":2}`|
|212|`{"day_range":[29,34],"dynamic_award":[],"award":[[901900,10]],"type":2407,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300201,"target_count":2,"compensate_group_id":7}`|
|213|`{"day_range":[29,34],"dynamic_award":[],"award":[[401900,50]],"type":1805,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300201,"target_count":1,"compensate_group_id":8}`|
|214|`{"day_range":[29,34],"dynamic_award":[],"award":[[101500,10]],"type":1701,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300201,"target_count":1,"compensate_group_id":10}`|
|215|`{"day_range":[29,34],"dynamic_award":[],"award":[[101900,50],[701600,20]],"type":1402,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":234640300201,"target_count":3,"compensate_group_id":11}`|
|221|`{"day_range":[35,99999],"dynamic_award":[],"award":[[401900,50]],"type":13817,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":983580210861,"target_count":1,"compensate_group_id":8}`|
|222|`{"day_range":[35,99999],"dynamic_award":[],"award":[[201500,1000]],"type":12105,"is_award_role_exp":false,"weekend_bonus_item":101500,"assert":983580210861,"target_count":1,"compensate_group_id":0}`|
|223|`{"day_range":[35,99999],"dynamic_award":[],"award":[[801900,5],[701600,30]],"type":12401,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":983580210861,"target_count":3,"compensate_group_id":15}`|
|224|`{"day_range":[35,99999],"dynamic_award":[],"award":[[2201900,20]],"type":12311,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":983580210861,"target_count":1,"compensate_group_id":14}`|
|225|`{"day_range":[35,99999],"dynamic_award":[],"award":[[101500,10]],"type":1002,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":983580210861,"target_count":1,"compensate_group_id":3}`|
|226|`{"day_range":[35,99999],"dynamic_award":[],"award":[[101900,50],[701600,30]],"type":7002,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":983580210861,"target_count":3,"compensate_group_id":4}`|
|227|`{"day_range":[35,99999],"dynamic_award":[],"award":[[179002,50]],"type":8103,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":983580210861,"target_count":1,"compensate_group_id":13}`|
|228|`{"day_range":[35,99999],"dynamic_award":[],"award":[[2001900,500],[701600,20]],"type":6508,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":983580210861,"target_count":1,"compensate_group_id":9}`|
|229|`{"day_range":[35,99999],"dynamic_award":[],"award":[[391002,50]],"type":14002,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":983580210861,"target_count":1,"compensate_group_id":12}`|
|230|`{"day_range":[35,99999],"dynamic_award":[],"award":[[17002,50]],"type":1304,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":983580210861,"target_count":1,"compensate_group_id":5}`|
|231|`{"day_range":[35,99999],"dynamic_award":[],"award":[[201500,2500]],"type":13303,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":983580210861,"target_count":1,"compensate_group_id":6}`|
|232|`{"day_range":[35,99999],"dynamic_award":[],"award":[[101500,10]],"type":8301,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":983580210861,"target_count":100,"compensate_group_id":2}`|
|233|`{"day_range":[35,99999],"dynamic_award":[],"award":[[901900,10]],"type":2407,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":983580210861,"target_count":2,"compensate_group_id":7}`|
|234|`{"day_range":[35,99999],"dynamic_award":[],"award":[[101500,10]],"type":1701,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":983580210861,"target_count":1,"compensate_group_id":10}`|
|235|`{"day_range":[35,99999],"dynamic_award":[],"award":[[101900,50],[701600,20]],"type":1402,"is_award_role_exp":true,"weekend_bonus_item":101500,"assert":983580210861,"target_count":3,"compensate_group_id":11}`|

## DailyTaskExtraAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|lua_interface|undefined/object|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|
|6|`{}`|

## LinearTaskConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|soft_guide_hide_level|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"soft_guide_hide_level":160201}`|

## LinearTaskType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|

## LinearTask

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|award|array|536|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|target_count|number|536|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_type|number|536|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|536|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|536|本表行键；与其他表同值不自动代表同一对象。|
|sortOrder|number|536|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|target_param|number|536|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|funcId|number|536|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|need_active|boolean|536|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_big_node|boolean|536|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部536行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10001|`{"award":[[101500,50]],"target_count":30204,"task_type":1201,"type":1,"target_param":0,"funcId":0,"need_active":false,"is_big_node":false}`|
|10002|`{"award":[[101800,1000]],"target_count":10,"task_type":8301,"type":1,"target_param":0,"funcId":0,"need_active":true,"is_big_node":false}`|
|10003|`{"award":[[157002,500]],"target_count":40203,"task_type":1201,"type":1,"target_param":0,"funcId":0,"need_active":false,"is_big_node":false}`|

## CommonTask

未恢复：Empty/non-row output; field map not independently recovered。不能把解析失败当作原表0行。

## CommonTaskGlobal

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|type|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"type":1201}`|
|3|`{"type":1602}`|
|4|`{"type":1202}`|
|5|`{"type":9001}`|
