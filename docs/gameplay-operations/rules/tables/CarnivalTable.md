# CarnivalTable 规则参数

来源：[personal-server/assets/tables/CarnivalTable.data.lua.json.gz](../../../../personal-server/assets/tables/CarnivalTable.data.lua.json.gz)，SHA256：`3fe6424a336143e8543adf3987177a44ddd9c019b3c65317efb26ec1671619a7`。

[完整逐行JSON](CarnivalTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[TaskType](#tasktype)|8|decoded-rows|
|[Task](#task)|5|decoded-rows|
|[Item](#item)|5|decoded-rows|
|[WeekStory](#weekstory)|4|decoded-rows|
|[MonopolyBuild](#monopolybuild)|5|decoded-rows|
|[MonopolyBuildExtHandle](#monopolybuildexthandle)|1|decoded-rows|
|[MonopolyBuildLevel](#monopolybuildlevel)|5|decoded-rows|
|[MonopolyBuildPoint](#monopolybuildpoint)|28|decoded-rows|
|[MonopolyEventAward](#monopolyeventaward)|14|decoded-rows|
|[MonopolyEventShow](#monopolyeventshow)|0|decoded-rows|
|[MonopolyEventType](#monopolyeventtype)|5|decoded-rows|
|[MonopolyEvent](#monopolyevent)|22|decoded-rows|
|[Monopoly_box_custom](#monopoly_box_custom)|20|decoded-rows|
|[MonopolyEventCustom](#monopolyeventcustom)|31|decoded-rows|
|[MonopolyCircleAward](#monopolycircleaward)|10|decoded-rows|
|[MonopolyActionType](#monopolyactiontype)|1|decoded-rows|
|[MonopolyGamer](#monopolygamer)|2|rows-with-external-references|
|[SlotMachine](#slotmachine)|1|decoded-rows|
|[Good](#good)|9|decoded-rows|
|[JumpGameAward](#jumpgameaward)|15|decoded-rows|
|[PlaneGameAward](#planegameaward)|3|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[MonopolyAchieveAward](#monopolyachieveaward)|6|decoded-rows|
|[Level](#level)|25|decoded-rows|
|[AwardLib](#awardlib)|25|decoded-rows|
|[AwardType](#awardtype)|4|decoded-rows|
|[Award](#award)|8|decoded-rows|
|[DailyAward](#dailyaward)|5|decoded-rows|
|[MonopolyBuildShopLevel](#monopolybuildshoplevel)|10|decoded-rows|
|[SpriteOrderConst](#spriteorderconst)|1|decoded-rows|
|[SpriteOrder](#spriteorder)|128|decoded-rows|
|[MonopolyPath](#monopolypath)|58|decoded-rows|
|[MonopolyPathVersion](#monopolypathversion)|2|decoded-rows|
|[Add_Type](#add_type)|2|decoded-rows|
|[Dispatch](#dispatch)|5|decoded-rows|
|[MonopolyDispatchPoint](#monopolydispatchpoint)|44|decoded-rows|
|[MonopolyTech](#monopolytech)|121|decoded-rows|

## TaskType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|8|本表行键；与其他表同值不自动代表同一对象。|
|des|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

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

## Task

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|mission|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|item|array|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|index|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|count|array|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|need_num|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"item":[101500],"type":1,"count":[15],"need_num":1}`|
|2|`{"item":[101500],"type":8,"count":[15],"need_num":10}`|
|3|`{"item":[101500],"type":3,"count":[20],"need_num":1}`|
|4|`{"item":[101500],"type":6,"count":[20],"need_num":100}`|
|2000|`{"item":[101500],"type":7,"count":[30],"need_num":4}`|

## Item

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|is_random|boolean|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|effect_count|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|502000|`{"is_random":false}`|
|602000|`{"is_random":false}`|
|1002000|`{"is_random":false}`|
|1402000|`{"is_random":false}`|
|1502000|`{"is_random":false}`|

## WeekStory

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|week|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|week_story_id|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|

## MonopolyBuild

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|icon|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|prefab|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|audio|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|construct|boolean|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cell_num|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|output_res|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_count|number|5|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|addition|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|output_des|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_des|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_lv|number|5|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"cell_num":1,"max_count":4,"max_lv":5}`|
|2|`{"cell_num":1,"max_count":3,"max_lv":5}`|
|3|`{"cell_num":2,"max_count":1,"max_lv":3}`|
|4|`{"cell_num":2,"max_count":1,"max_lv":5}`|
|5|`{"cell_num":1,"max_count":1,"max_lv":10}`|

## MonopolyBuildExtHandle

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|extra_parse|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|shop_id|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|5|`{}`|

## MonopolyBuildLevel

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|yield|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|item|array|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|output|array|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"item":[391002,391002,391002,391002,391002]}`|
|2|`{"item":[17002,17002,17002,17002,17002]}`|
|3|`{"item":[1491200,1491200,1491200]}`|
|4|`{"item":[101500,101500,101500,101500,101500]}`|
|5|`{"item":[]}`|

## MonopolyBuildPoint

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|28|本表行键；与其他表同值不自动代表同一对象。|
|point|number|28|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"point":2}`|
|102|`{"point":4}`|
|103|`{"point":6}`|
|104|`{"point":8}`|
|105|`{"point":10}`|
|201|`{"point":2}`|
|202|`{"point":4}`|
|203|`{"point":6}`|
|204|`{"point":8}`|
|205|`{"point":10}`|
|301|`{"point":5}`|
|302|`{"point":10}`|
|303|`{"point":15}`|
|401|`{"point":3}`|
|402|`{"point":6}`|
|403|`{"point":9}`|
|404|`{"point":12}`|
|405|`{"point":15}`|
|501|`{"point":3}`|
|502|`{"point":6}`|
|503|`{"point":9}`|
|504|`{"point":12}`|
|505|`{"point":15}`|
|506|`{"point":18}`|
|507|`{"point":21}`|
|508|`{"point":24}`|
|509|`{"point":27}`|
|510|`{"point":30}`|

## MonopolyEventAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|res|number|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|prefab|string|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|14|本表行键；与其他表同值不自动代表同一对象。|
|awardtype|number|14|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|awards|array|14|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|2|`{"awardtype":1,"awards":[35000,35000,35000,35000,35000]}`|
|3|`{"awardtype":1,"awards":[1,1,1,1,1]}`|
|4|`{"awardtype":1,"awards":[2,2,2,2,2]}`|
|5|`{"awardtype":1,"awards":[8,8,8,8,8]}`|
|6|`{"awardtype":1,"awards":[10,10,10,10,10]}`|
|7|`{"awardtype":1,"awards":[5,5,5,5,5]}`|
|8|`{"awardtype":1,"awards":[8000,8000,8000,8000,8000]}`|
|9|`{"awardtype":1,"awards":[1,1,1,1,1]}`|
|10|`{"awardtype":1,"awards":[50,50,50,50,50]}`|
|11|`{"awardtype":3,"awards":[1,1,1,1,1]}`|
|12|`{"awardtype":2,"awards":[1,1,1,1,1]}`|
|13|`{"awardtype":2,"awards":[1,1,1,1,1]}`|
|14|`{"awardtype":2,"awards":[1,1,1,1,1]}`|
|15|`{"awardtype":2,"awards":[1,1,1,1,1]}`|

## MonopolyEventShow

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## MonopolyEventType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|
|6|`{}`|

## MonopolyEvent

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|build_id|number|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|22|本表行键；与其他表同值不自动代表同一对象。|
|can_magnet|boolean|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_fixed|boolean|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"type":6,"can_magnet":true,"is_fixed":true}`|
|2|`{"type":1,"can_magnet":true,"is_fixed":false}`|
|3|`{"type":1,"can_magnet":true,"is_fixed":false}`|
|4|`{"type":1,"can_magnet":true,"is_fixed":false}`|
|5|`{"type":1,"can_magnet":true,"is_fixed":false}`|
|6|`{"type":1,"can_magnet":true,"is_fixed":false}`|
|7|`{"type":1,"can_magnet":true,"is_fixed":false}`|
|8|`{"type":1,"can_magnet":true,"is_fixed":false}`|
|9|`{"type":1,"can_magnet":true,"is_fixed":false}`|
|10|`{"type":1,"can_magnet":true,"is_fixed":false}`|
|11|`{"type":1,"can_magnet":true,"is_fixed":false}`|
|12|`{"type":1,"can_magnet":true,"is_fixed":false}`|
|13|`{"type":1,"can_magnet":true,"is_fixed":false}`|
|14|`{"type":1,"can_magnet":true,"is_fixed":false}`|
|15|`{"type":1,"can_magnet":false,"is_fixed":false}`|
|16|`{"type":3,"can_magnet":false,"is_fixed":false}`|
|17|`{"type":4,"can_magnet":false,"is_fixed":true}`|
|18|`{"type":5,"can_magnet":true,"is_fixed":true}`|
|19|`{"type":5,"can_magnet":true,"is_fixed":true}`|
|20|`{"type":4,"can_magnet":false,"is_fixed":true}`|
|21|`{"type":4,"can_magnet":false,"is_fixed":true}`|
|22|`{"type":5,"can_magnet":false,"is_fixed":true}`|

## Monopoly_box_custom

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|20|本表行键；与其他表同值不自动代表同一对象。|
|item|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"item":120013000}`|
|2|`{"item":110163000}`|
|3|`{"item":100043000}`|
|4|`{"item":110203000}`|
|5|`{"item":120053000}`|
|6|`{"item":110103000}`|
|7|`{"item":120253000}`|
|8|`{"item":110113000}`|
|9|`{"item":120263000}`|
|10|`{"item":120273000}`|
|11|`{"item":120343000}`|
|12|`{"item":110373000}`|
|13|`{"item":120363000}`|
|14|`{"item":110383000}`|
|15|`{"item":120353000}`|
|16|`{"item":120293000}`|
|17|`{"item":100093000}`|
|18|`{"item":110303000}`|
|19|`{"item":120303000}`|
|20|`{"item":110313000}`|

## MonopolyEventCustom

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|31|本表行键；与其他表同值不自动代表同一对象。|
|event|number|31|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

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

## MonopolyCircleAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|10|本表行键；与其他表同值不自动代表同一对象。|
|award|array|10|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|build_point|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award":[[391002,50],[17002,100],[101500,40]],"build_point":10}`|
|2|`{"award":[[391002,50],[17002,100],[101500,40]],"build_point":20}`|
|3|`{"award":[[391002,100],[17002,200],[101500,40]],"build_point":30}`|
|4|`{"award":[[391002,100],[17002,200],[101500,80]],"build_point":40}`|
|5|`{"award":[[391002,150],[17002,200],[101500,80]],"build_point":50}`|
|6|`{"award":[[391002,150],[17002,300],[101500,80]],"build_point":60}`|
|7|`{"award":[[391002,200],[17002,300],[101500,120]],"build_point":70}`|
|8|`{"award":[[391002,200],[17002,300],[101500,120]],"build_point":80}`|
|9|`{"award":[[391002,250],[17002,450],[101500,120]],"build_point":90}`|
|10|`{"award":[[391002,250],[17002,450],[101500,160]],"build_point":100}`|

## MonopolyActionType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|step_range|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|weight|number|1|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101500|`{"step_range":[0,0],"weight":1000}`|

## MonopolyGamer

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|item|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|prefab|string|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skip_award|array|2|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|show_des|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|game_entry|object|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|17|`{"item":101500,"skip_award":[70,90]}`|
|21|`{"item":101500,"skip_award":[3,4,5]}`|

## SlotMachine

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|retry_n|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|item|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|count|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|weight|array|1|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"item":[101500,101500,101500,101500],"count":[50,150,250,350],"weight":[100,200,300,400]}`|

## Good

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|cost_item|number|9|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|discount|number|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|item|number|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|weight|number|9|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|
|tid|number|9|本表行键；与其他表同值不自动代表同一对象。|
|num|number|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|price|number|9|原价格整数；RechargeTable现金商品消费者使用分，其他表必须核币种和单位。|
|buy_num_limit|number|9|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10001|`{"cost_item":101500,"discount":6,"item":1002,"weight":10,"num":100,"price":60,"buy_num_limit":1}`|
|10002|`{"cost_item":101500,"discount":6,"item":1002,"weight":10,"num":200,"price":120,"buy_num_limit":1}`|
|10003|`{"cost_item":201500,"discount":0,"item":1002,"weight":10,"num":100,"price":100000,"buy_num_limit":1}`|
|10004|`{"cost_item":201500,"discount":0,"item":1002,"weight":10,"num":200,"price":200000,"buy_num_limit":1}`|
|10005|`{"cost_item":101500,"discount":7,"item":1002,"weight":10,"num":3,"price":420,"buy_num_limit":1}`|
|10006|`{"cost_item":101500,"discount":7,"item":1002,"weight":10,"num":5,"price":700,"buy_num_limit":1}`|
|10007|`{"cost_item":101500,"discount":6,"item":1002,"weight":10,"num":1,"price":3000,"buy_num_limit":1}`|
|10008|`{"cost_item":101500,"discount":6,"item":1002,"weight":10,"num":1,"price":3000,"buy_num_limit":1}`|
|10009|`{"cost_item":101500,"discount":6,"item":1002,"weight":10,"num":1,"price":3000,"buy_num_limit":1}`|

## JumpGameAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|diamand|number|15|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|miracle_count|number|15|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|15|本表行键；与其他表同值不自动代表同一对象。|
|up_mat_item|number|15|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|up_mat_count|number|15|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"miracle_count":2,"up_mat_item":101500,"up_mat_count":2}`|
|2|`{"miracle_count":2,"up_mat_item":101500,"up_mat_count":2}`|
|3|`{"miracle_count":3,"up_mat_item":101500,"up_mat_count":3}`|
|4|`{"miracle_count":3,"up_mat_item":101500,"up_mat_count":3}`|
|5|`{"miracle_count":5,"up_mat_item":101500,"up_mat_count":5}`|
|6|`{"miracle_count":2,"up_mat_item":101500,"up_mat_count":2}`|
|7|`{"miracle_count":2,"up_mat_item":101500,"up_mat_count":2}`|
|8|`{"miracle_count":3,"up_mat_item":101500,"up_mat_count":3}`|
|9|`{"miracle_count":3,"up_mat_item":101500,"up_mat_count":3}`|
|10|`{"miracle_count":5,"up_mat_item":101500,"up_mat_count":1}`|
|11|`{"miracle_count":2,"up_mat_item":101500,"up_mat_count":2}`|
|12|`{"miracle_count":2,"up_mat_item":101500,"up_mat_count":2}`|
|13|`{"miracle_count":3,"up_mat_item":101500,"up_mat_count":3}`|
|14|`{"miracle_count":3,"up_mat_item":101500,"up_mat_count":3}`|
|15|`{"miracle_count":5,"up_mat_item":101500,"up_mat_count":5}`|

## PlaneGameAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|item_min_drop_count|array|3|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|item_id|array|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|item_max_award_count|array|3|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|item_weight|array|3|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|item_max_drop_count|array|3|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"item_min_drop_count":[1,1],"item_id":[101500,101500],"item_max_award_count":[100,2],"item_weight":[99,1],"item_max_drop_count":[5,1]}`|
|2|`{"item_min_drop_count":[1],"item_id":[101500],"item_max_award_count":[80],"item_weight":[],"item_max_drop_count":[5]}`|
|3|`{"item_min_drop_count":[1],"item_id":[101500],"item_max_award_count":[150],"item_weight":[],"item_max_drop_count":[7]}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|big_build_lv_effect|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|act_duration|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|mono_item_max_num|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|dice_red_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|week_num|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|throw_interval|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|dice_flush_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|small_build_produce_effect|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|open_science_week|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|small_build_construct_effect|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|small_build_lv_effect|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|buy_dice_max_num|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|second_week_guide|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|big_build_construct_effect|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|move_speed|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|per_dice_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|box_id|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|dice_max_count|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|init_dice_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|big_build_produce_effect|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"big_build_lv_effect":"Effect_jianianhua_shengji_da.prefab","act_duration":604800,"mono_item_max_num":10,"dice_red_count":10,"week_num":5,"throw_interval":5,"dice_flush_time":86400,"open_science_week":2,"small_build_lv_effect":"Effect_jianianhua_shengji_xiao.prefab","buy_dice_max_num":5,"second_week_guide":1166,"move_speed":5,"per_dice_count":10,"dice_max_count":60,"init_dice_count":10}`|

## MonopolyAchieveAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|dice_num|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rewards|array|6|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|desc|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"dice_num":10,"rewards":[[402000,1]]}`|
|2|`{"dice_num":20,"rewards":[[402000,1]]}`|
|3|`{"dice_num":30,"rewards":[[402000,1]]}`|
|4|`{"dice_num":40,"rewards":[[402000,1]]}`|
|5|`{"dice_num":50,"rewards":[[402000,1]]}`|
|6|`{"dice_num":60,"rewards":[[402000,1]]}`|

## Level

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|25|本表行键；与其他表同值不自动代表同一对象。|
|num|array|25|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|item|array|25|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"num":[200,1],"item":[101500,101500]}`|
|2|`{"num":[270,2],"item":[101500,101500]}`|
|3|`{"num":[350,3],"item":[101500,101500]}`|
|4|`{"num":[420,5],"item":[101500,101500]}`|
|5|`{"num":[580,8],"item":[101500,101500]}`|
|6|`{"num":[700,12],"item":[101500,101500]}`|
|7|`{"num":[900,24],"item":[101500,101500]}`|
|8|`{"num":[1150,32],"item":[101500,101500]}`|
|9|`{"num":[1400,40],"item":[101500,101500]}`|
|10|`{"num":[1600,48],"item":[101500,101500]}`|
|11|`{"num":[1850,56],"item":[101500,101500]}`|
|12|`{"num":[2050,64],"item":[101500,101500]}`|
|13|`{"num":[2300,120],"item":[101500,101500]}`|
|14|`{"num":[2750,140],"item":[101500,101500]}`|
|15|`{"num":[3200,160],"item":[101500,101500]}`|
|16|`{"num":[3650,180],"item":[101500,101500]}`|
|17|`{"num":[4100,200],"item":[101500,101500]}`|
|18|`{"num":[4600,240],"item":[101500,101500]}`|
|19|`{"num":[5050,256],"item":[101500,101500]}`|
|20|`{"num":[5500,272],"item":[101500,101500]}`|
|21|`{"num":[5950,288],"item":[101500,101500]}`|
|22|`{"num":[6400,308],"item":[101500,101500]}`|
|23|`{"num":[6900,328],"item":[101500,101500]}`|
|24|`{"num":[7550,348],"item":[101500,101500]}`|
|25|`{"num":[8250,368],"item":[101500,101500]}`|

## AwardLib

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|25|本表行键；与其他表同值不自动代表同一对象。|
|num|array|25|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|25|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"num":[10,5,5,3,10,3,30,300000,200000],"award":[1,2,3,4,5,6,6,7,8]}`|
|2|`{"num":[10,5,5,3,10,3,30,300000,200000],"award":[1,2,3,4,5,6,6,7,8]}`|
|3|`{"num":[10,5,5,3,10,3,30,300000,200000],"award":[1,2,3,4,5,6,6,7,8]}`|
|4|`{"num":[10,5,5,3,10,3,30,300000,200000],"award":[1,2,3,4,5,6,6,7,8]}`|
|5|`{"num":[10,5,5,3,10,3,30,300000,200000],"award":[1,2,3,4,5,6,6,7,8]}`|
|6|`{"num":[10,5,5,3,10,3,30,300000,200000],"award":[1,2,3,4,5,6,6,7,8]}`|
|7|`{"num":[10,5,5,3,10,3,30,300000,200000],"award":[1,2,3,4,5,6,6,7,8]}`|
|8|`{"num":[10,5,5,3,10,3,30,300000,200000],"award":[1,2,3,4,5,6,6,7,8]}`|
|9|`{"num":[10,5,5,3,10,3,30,300000,200000],"award":[1,2,3,4,5,6,6,7,8]}`|
|10|`{"num":[10,5,5,3,10,3,30,300000,200000],"award":[1,2,3,4,5,6,6,7,8]}`|
|11|`{"num":[10,5,5,3,10,3,30,300000,200000],"award":[1,2,3,4,5,6,6,7,8]}`|
|12|`{"num":[10,5,5,3,10,3,30,300000,200000],"award":[1,2,3,4,5,6,6,7,8]}`|
|13|`{"num":[10,5,5,3,10,3,30,300000,200000],"award":[1,2,3,4,5,6,6,7,8]}`|
|14|`{"num":[10,5,5,3,10,3,30,300000,200000],"award":[1,2,3,4,5,6,6,7,8]}`|
|15|`{"num":[10,5,5,3,10,3,30,300000,200000],"award":[1,2,3,4,5,6,6,7,8]}`|
|16|`{"num":[10,5,5,3,10,3,30,300000,200000],"award":[1,2,3,4,5,6,6,7,8]}`|
|17|`{"num":[10,5,5,3,10,3,30,300000,200000],"award":[1,2,3,4,5,6,6,7,8]}`|
|18|`{"num":[10,5,5,3,10,3,30,300000,200000],"award":[1,2,3,4,5,6,6,7,8]}`|
|19|`{"num":[10,5,5,3,10,3,30,300000,200000],"award":[1,2,3,4,5,6,6,7,8]}`|
|20|`{"num":[10,5,5,3,10,3,30,300000,200000],"award":[1,2,3,4,5,6,6,7,8]}`|
|21|`{"num":[10,5,5,3,10,3,30,300000,200000],"award":[1,2,3,4,5,6,6,7,8]}`|
|22|`{"num":[10,5,5,3,10,3,30,300000,200000],"award":[1,2,3,4,5,6,6,7,8]}`|
|23|`{"num":[10,5,5,3,10,3,30,300000,200000],"award":[1,2,3,4,5,6,6,7,8]}`|
|24|`{"num":[10,5,5,3,10,3,30,300000,200000],"award":[1,2,3,4,5,6,6,7,8]}`|
|25|`{"num":[10,5,5,3,10,3,30,300000,200000],"award":[1,2,3,4,5,6,6,7,8]}`|

## AwardType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|is_random_one|boolean|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|quality|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_guaranteed|boolean|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|effect_time|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|daily_max_count|number|4|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|award_item|array|4|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"is_random_one":true,"quality":40,"is_guaranteed":false,"daily_max_count":0,"award_item":[1,2]}`|
|2|`{"is_random_one":false,"quality":40,"is_guaranteed":false,"daily_max_count":0,"award_item":[3,4]}`|
|3|`{"is_random_one":false,"quality":40,"is_guaranteed":false,"daily_max_count":0,"award_item":[5,6]}`|
|4|`{"is_random_one":false,"quality":40,"is_guaranteed":false,"daily_max_count":0,"award_item":[7,8]}`|

## Award

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|max_weight|number|8|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|
|per_add_weight|number|8|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|
|item|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|8|本表行键；与其他表同值不自动代表同一对象。|
|weight|number|8|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"max_weight":0,"per_add_weight":0,"item":2002,"type":1,"weight":0}`|
|2|`{"max_weight":0,"per_add_weight":0,"item":2002,"type":1,"weight":1250}`|
|3|`{"max_weight":0,"per_add_weight":0,"item":2002,"type":2,"weight":1250}`|
|4|`{"max_weight":0,"per_add_weight":0,"item":2002,"type":2,"weight":1250}`|
|5|`{"max_weight":0,"per_add_weight":0,"item":2002,"type":3,"weight":1250}`|
|6|`{"max_weight":0,"per_add_weight":0,"item":2002,"type":3,"weight":1250}`|
|7|`{"max_weight":0,"per_add_weight":0,"item":2002,"type":4,"weight":1250}`|
|8|`{"max_weight":0,"per_add_weight":0,"item":2002,"type":4,"weight":1250}`|

## DailyAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|daily_award|array|5|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|daily_award_num|array|5|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|mission|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"daily_award":[201500,101800],"daily_award_num":[28000,28000]}`|
|2|`{"daily_award":[201500,101800],"daily_award_num":[65000,65000]}`|
|3|`{"daily_award":[201500,101800],"daily_award_num":[126500,126500]}`|
|4|`{"daily_award":[201500,101800],"daily_award_num":[223500,223500]}`|
|5|`{"daily_award":[201500,101800],"daily_award_num":[372000,372000]}`|

## MonopolyBuildShopLevel

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|shop_cell_num|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|dice_num|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|10|本表行键；与其他表同值不自动代表同一对象。|
|sprite_num|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|501|`{"shop_cell_num":3,"dice_num":6,"sprite_num":1}`|
|502|`{"shop_cell_num":3,"dice_num":6,"sprite_num":2}`|
|503|`{"shop_cell_num":4,"dice_num":6,"sprite_num":2}`|
|504|`{"shop_cell_num":4,"dice_num":6,"sprite_num":3}`|
|505|`{"shop_cell_num":4,"dice_num":5,"sprite_num":3}`|
|506|`{"shop_cell_num":6,"dice_num":5,"sprite_num":3}`|
|507|`{"shop_cell_num":6,"dice_num":5,"sprite_num":4}`|
|508|`{"shop_cell_num":7,"dice_num":4,"sprite_num":4}`|
|509|`{"shop_cell_num":8,"dice_num":4,"sprite_num":5}`|
|510|`{"shop_cell_num":9,"dice_num":4,"sprite_num":5}`|

## SpriteOrderConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|refresh_cost|array|1|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|refresh_limit|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"refresh_cost":[[201500,5000]],"refresh_limit":5}`|

## SpriteOrder

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|belong_group|number|128|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|128|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|order_reward|array|128|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|tid|number|128|本表行键；与其他表同值不自动代表同一对象。|
|weight|number|128|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|
|show_desc|number|128|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"belong_group":1,"order_reward":[[6201900,20],[493002,10],[495002,20]],"weight":200}`|
|102|`{"belong_group":1,"order_reward":[[6201900,30],[493002,12],[495002,30]],"weight":300}`|
|103|`{"belong_group":1,"order_reward":[[6201900,40],[493002,15],[495002,40]],"weight":500}`|
|104|`{"belong_group":1,"order_reward":[[6201900,50],[493002,18],[495002,50]],"weight":1000}`|
|105|`{"belong_group":1,"order_reward":[[6201900,60],[493002,24],[495002,70]],"weight":1000}`|
|106|`{"belong_group":1,"order_reward":[[6201900,70],[493002,28],[495002,80]],"weight":500}`|
|107|`{"belong_group":1,"order_reward":[[6201900,80],[493002,30],[495002,60],[494002,1]],"weight":300}`|
|108|`{"belong_group":1,"order_reward":[[6201900,100],[493002,40],[495002,100],[494002,1]],"weight":200}`|
|109|`{"belong_group":1,"order_reward":[[6201900,20],[493002,10],[495002,20]],"weight":200}`|
|110|`{"belong_group":1,"order_reward":[[6201900,30],[493002,12],[495002,30]],"weight":300}`|
|111|`{"belong_group":1,"order_reward":[[6201900,40],[493002,15],[495002,40]],"weight":500}`|
|112|`{"belong_group":1,"order_reward":[[6201900,50],[493002,18],[495002,50]],"weight":1000}`|
|113|`{"belong_group":1,"order_reward":[[6201900,60],[493002,24],[495002,70]],"weight":1000}`|
|114|`{"belong_group":1,"order_reward":[[6201900,70],[493002,28],[495002,80]],"weight":500}`|
|115|`{"belong_group":1,"order_reward":[[6201900,80],[493002,30],[495002,60],[494002,1]],"weight":300}`|
|116|`{"belong_group":1,"order_reward":[[6201900,100],[493002,40],[495002,100],[494002,1]],"weight":200}`|
|117|`{"belong_group":1,"order_reward":[[6201900,20],[493002,10],[495002,20]],"weight":200}`|
|118|`{"belong_group":1,"order_reward":[[6201900,30],[493002,12],[495002,30]],"weight":300}`|
|119|`{"belong_group":1,"order_reward":[[6201900,40],[493002,15],[495002,40]],"weight":500}`|
|120|`{"belong_group":1,"order_reward":[[6201900,50],[493002,18],[495002,50]],"weight":1000}`|
|121|`{"belong_group":1,"order_reward":[[6201900,60],[493002,24],[495002,70]],"weight":1000}`|
|122|`{"belong_group":1,"order_reward":[[6201900,70],[493002,28],[495002,80]],"weight":500}`|
|123|`{"belong_group":1,"order_reward":[[6201900,80],[493002,30],[495002,60],[494002,1]],"weight":300}`|
|124|`{"belong_group":1,"order_reward":[[6201900,100],[493002,40],[495002,100],[494002,1]],"weight":200}`|
|125|`{"belong_group":1,"order_reward":[[6201900,20],[493002,10],[495002,20]],"weight":200}`|
|126|`{"belong_group":1,"order_reward":[[6201900,30],[493002,12],[495002,30]],"weight":300}`|
|127|`{"belong_group":1,"order_reward":[[6201900,40],[493002,15],[495002,40]],"weight":500}`|
|128|`{"belong_group":1,"order_reward":[[6201900,50],[493002,18],[495002,50]],"weight":1000}`|
|129|`{"belong_group":1,"order_reward":[[6201900,60],[493002,24],[495002,70]],"weight":1000}`|
|130|`{"belong_group":1,"order_reward":[[6201900,70],[493002,28],[495002,80]],"weight":500}`|
|131|`{"belong_group":1,"order_reward":[[6201900,80],[493002,30],[495002,60],[494002,1]],"weight":300}`|
|132|`{"belong_group":1,"order_reward":[[6201900,100],[493002,40],[495002,100],[494002,1]],"weight":200}`|
|201|`{"belong_group":2,"order_reward":[[6201900,20],[493002,10],[495002,40]],"weight":200}`|
|202|`{"belong_group":2,"order_reward":[[6201900,30],[493002,12],[495002,60]],"weight":300}`|
|203|`{"belong_group":2,"order_reward":[[6201900,40],[493002,15],[495002,80]],"weight":500}`|
|204|`{"belong_group":2,"order_reward":[[6201900,50],[493002,18],[495002,100]],"weight":1000}`|
|205|`{"belong_group":2,"order_reward":[[6201900,60],[493002,24],[495002,140]],"weight":1000}`|
|206|`{"belong_group":2,"order_reward":[[6201900,70],[493002,28],[495002,160]],"weight":500}`|
|207|`{"belong_group":2,"order_reward":[[6201900,80],[493002,30],[495002,120],[494002,1]],"weight":300}`|
|208|`{"belong_group":2,"order_reward":[[6201900,100],[493002,40],[495002,200],[494002,1]],"weight":200}`|
|209|`{"belong_group":2,"order_reward":[[6201900,20],[493002,10],[495002,40]],"weight":200}`|
|210|`{"belong_group":2,"order_reward":[[6201900,30],[493002,12],[495002,60]],"weight":300}`|
|211|`{"belong_group":2,"order_reward":[[6201900,40],[493002,15],[495002,80]],"weight":500}`|
|212|`{"belong_group":2,"order_reward":[[6201900,50],[493002,18],[495002,100]],"weight":1000}`|
|213|`{"belong_group":2,"order_reward":[[6201900,60],[493002,24],[495002,140]],"weight":1000}`|
|214|`{"belong_group":2,"order_reward":[[6201900,70],[493002,28],[495002,160]],"weight":500}`|
|215|`{"belong_group":2,"order_reward":[[6201900,80],[493002,30],[495002,120],[494002,1]],"weight":300}`|
|216|`{"belong_group":2,"order_reward":[[6201900,100],[493002,40],[495002,200],[494002,1]],"weight":200}`|
|217|`{"belong_group":2,"order_reward":[[6201900,20],[493002,10],[495002,40]],"weight":200}`|
|218|`{"belong_group":2,"order_reward":[[6201900,30],[493002,12],[495002,60]],"weight":300}`|
|219|`{"belong_group":2,"order_reward":[[6201900,40],[493002,15],[495002,80]],"weight":500}`|
|220|`{"belong_group":2,"order_reward":[[6201900,50],[493002,18],[495002,100]],"weight":1000}`|
|221|`{"belong_group":2,"order_reward":[[6201900,60],[493002,24],[495002,140]],"weight":1000}`|
|222|`{"belong_group":2,"order_reward":[[6201900,70],[493002,28],[495002,160]],"weight":500}`|
|223|`{"belong_group":2,"order_reward":[[6201900,80],[493002,30],[495002,120],[494002,1]],"weight":300}`|
|224|`{"belong_group":2,"order_reward":[[6201900,100],[493002,40],[495002,200],[494002,1]],"weight":200}`|
|225|`{"belong_group":2,"order_reward":[[6201900,20],[493002,10],[495002,40]],"weight":200}`|
|226|`{"belong_group":2,"order_reward":[[6201900,30],[493002,12],[495002,60]],"weight":300}`|
|227|`{"belong_group":2,"order_reward":[[6201900,40],[493002,15],[495002,80]],"weight":500}`|
|228|`{"belong_group":2,"order_reward":[[6201900,50],[493002,18],[495002,100]],"weight":1000}`|
|229|`{"belong_group":2,"order_reward":[[6201900,60],[493002,24],[495002,140]],"weight":1000}`|
|230|`{"belong_group":2,"order_reward":[[6201900,70],[493002,28],[495002,160]],"weight":500}`|
|231|`{"belong_group":2,"order_reward":[[6201900,80],[493002,30],[495002,120],[494002,1]],"weight":300}`|
|232|`{"belong_group":2,"order_reward":[[6201900,100],[493002,40],[495002,200],[494002,1]],"weight":200}`|
|301|`{"belong_group":3,"order_reward":[[6201900,20],[493002,10],[495002,40]],"weight":200}`|
|302|`{"belong_group":3,"order_reward":[[6201900,30],[493002,12],[495002,60]],"weight":300}`|
|303|`{"belong_group":3,"order_reward":[[6201900,40],[493002,15],[495002,80]],"weight":500}`|
|304|`{"belong_group":3,"order_reward":[[6201900,50],[493002,18],[495002,100]],"weight":1000}`|
|305|`{"belong_group":3,"order_reward":[[6201900,60],[493002,24],[495002,140]],"weight":1000}`|
|306|`{"belong_group":3,"order_reward":[[6201900,70],[493002,28],[495002,160]],"weight":500}`|
|307|`{"belong_group":3,"order_reward":[[6201900,80],[493002,30],[495002,120],[494002,1]],"weight":300}`|
|308|`{"belong_group":3,"order_reward":[[6201900,100],[493002,40],[495002,200],[494002,1]],"weight":200}`|
|309|`{"belong_group":3,"order_reward":[[6201900,20],[493002,10],[495002,40]],"weight":200}`|
|310|`{"belong_group":3,"order_reward":[[6201900,30],[493002,12],[495002,60]],"weight":300}`|
|311|`{"belong_group":3,"order_reward":[[6201900,40],[493002,15],[495002,80]],"weight":500}`|
|312|`{"belong_group":3,"order_reward":[[6201900,50],[493002,18],[495002,100]],"weight":1000}`|
|313|`{"belong_group":3,"order_reward":[[6201900,60],[493002,24],[495002,140]],"weight":1000}`|
|314|`{"belong_group":3,"order_reward":[[6201900,70],[493002,28],[495002,160]],"weight":500}`|
|315|`{"belong_group":3,"order_reward":[[6201900,80],[493002,30],[495002,120],[494002,1]],"weight":300}`|
|316|`{"belong_group":3,"order_reward":[[6201900,100],[493002,40],[495002,200],[494002,1]],"weight":200}`|
|317|`{"belong_group":3,"order_reward":[[6201900,20],[493002,10],[495002,40]],"weight":200}`|
|318|`{"belong_group":3,"order_reward":[[6201900,30],[493002,12],[495002,60]],"weight":300}`|
|319|`{"belong_group":3,"order_reward":[[6201900,40],[493002,15],[495002,80]],"weight":500}`|
|320|`{"belong_group":3,"order_reward":[[6201900,50],[493002,18],[495002,100]],"weight":1000}`|
|321|`{"belong_group":3,"order_reward":[[6201900,60],[493002,24],[495002,140]],"weight":1000}`|
|322|`{"belong_group":3,"order_reward":[[6201900,70],[493002,28],[495002,160]],"weight":500}`|
|323|`{"belong_group":3,"order_reward":[[6201900,80],[493002,30],[495002,120],[494002,1]],"weight":300}`|
|324|`{"belong_group":3,"order_reward":[[6201900,100],[493002,40],[495002,200],[494002,1]],"weight":200}`|
|325|`{"belong_group":3,"order_reward":[[6201900,20],[493002,10],[495002,40]],"weight":200}`|
|326|`{"belong_group":3,"order_reward":[[6201900,30],[493002,12],[495002,60]],"weight":300}`|
|327|`{"belong_group":3,"order_reward":[[6201900,40],[493002,15],[495002,80]],"weight":500}`|
|328|`{"belong_group":3,"order_reward":[[6201900,50],[493002,18],[495002,100]],"weight":1000}`|
|329|`{"belong_group":3,"order_reward":[[6201900,60],[493002,24],[495002,140]],"weight":1000}`|
|330|`{"belong_group":3,"order_reward":[[6201900,70],[493002,28],[495002,160]],"weight":500}`|
|331|`{"belong_group":3,"order_reward":[[6201900,80],[493002,30],[495002,120],[494002,1]],"weight":300}`|
|332|`{"belong_group":3,"order_reward":[[6201900,100],[493002,40],[495002,200],[494002,1]],"weight":200}`|
|401|`{"belong_group":4,"order_reward":[[6201900,20],[493002,10],[495002,40]],"weight":200}`|
|402|`{"belong_group":4,"order_reward":[[6201900,30],[493002,12],[495002,60]],"weight":300}`|
|403|`{"belong_group":4,"order_reward":[[6201900,40],[493002,15],[495002,80]],"weight":500}`|
|404|`{"belong_group":4,"order_reward":[[6201900,50],[493002,18],[495002,100]],"weight":1000}`|
|405|`{"belong_group":4,"order_reward":[[6201900,60],[493002,24],[495002,140]],"weight":1000}`|
|406|`{"belong_group":4,"order_reward":[[6201900,70],[493002,28],[495002,160]],"weight":500}`|
|407|`{"belong_group":4,"order_reward":[[6201900,80],[493002,30],[495002,120],[494002,1]],"weight":300}`|
|408|`{"belong_group":4,"order_reward":[[6201900,100],[493002,40],[495002,200],[494002,1]],"weight":200}`|
|409|`{"belong_group":4,"order_reward":[[6201900,20],[493002,10],[495002,40]],"weight":200}`|
|410|`{"belong_group":4,"order_reward":[[6201900,30],[493002,12],[495002,60]],"weight":300}`|
|411|`{"belong_group":4,"order_reward":[[6201900,40],[493002,15],[495002,80]],"weight":500}`|
|412|`{"belong_group":4,"order_reward":[[6201900,50],[493002,18],[495002,100]],"weight":1000}`|
|413|`{"belong_group":4,"order_reward":[[6201900,60],[493002,24],[495002,140]],"weight":1000}`|
|414|`{"belong_group":4,"order_reward":[[6201900,70],[493002,28],[495002,160]],"weight":500}`|
|415|`{"belong_group":4,"order_reward":[[6201900,80],[493002,30],[495002,120],[494002,1]],"weight":300}`|
|416|`{"belong_group":4,"order_reward":[[6201900,100],[493002,40],[495002,200],[494002,1]],"weight":200}`|
|417|`{"belong_group":4,"order_reward":[[6201900,20],[493002,10],[495002,40]],"weight":200}`|
|418|`{"belong_group":4,"order_reward":[[6201900,30],[493002,12],[495002,60]],"weight":300}`|
|419|`{"belong_group":4,"order_reward":[[6201900,40],[493002,15],[495002,80]],"weight":500}`|
|420|`{"belong_group":4,"order_reward":[[6201900,50],[493002,18],[495002,100]],"weight":1000}`|
|421|`{"belong_group":4,"order_reward":[[6201900,60],[493002,24],[495002,140]],"weight":1000}`|
|422|`{"belong_group":4,"order_reward":[[6201900,70],[493002,28],[495002,160]],"weight":500}`|
|423|`{"belong_group":4,"order_reward":[[6201900,80],[493002,30],[495002,120],[494002,1]],"weight":300}`|
|424|`{"belong_group":4,"order_reward":[[6201900,100],[493002,40],[495002,200],[494002,1]],"weight":200}`|
|425|`{"belong_group":4,"order_reward":[[6201900,20],[493002,10],[495002,40]],"weight":200}`|
|426|`{"belong_group":4,"order_reward":[[6201900,30],[493002,12],[495002,60]],"weight":300}`|
|427|`{"belong_group":4,"order_reward":[[6201900,40],[493002,15],[495002,80]],"weight":500}`|
|428|`{"belong_group":4,"order_reward":[[6201900,50],[493002,18],[495002,100]],"weight":1000}`|
|429|`{"belong_group":4,"order_reward":[[6201900,60],[493002,24],[495002,140]],"weight":1000}`|
|430|`{"belong_group":4,"order_reward":[[6201900,70],[493002,28],[495002,160]],"weight":500}`|
|431|`{"belong_group":4,"order_reward":[[6201900,80],[493002,30],[495002,120],[494002,1]],"weight":300}`|
|432|`{"belong_group":4,"order_reward":[[6201900,100],[493002,40],[495002,200],[494002,1]],"weight":200}`|

## MonopolyPath

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|58|本表行键；与其他表同值不自动代表同一对象。|
|belong_version|number|58|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cell_id|number|58|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"belong_version":1}`|
|102|`{"belong_version":1}`|
|103|`{"belong_version":1}`|
|104|`{"belong_version":1}`|
|105|`{"belong_version":1}`|
|106|`{"belong_version":1}`|
|107|`{"belong_version":1}`|
|108|`{"belong_version":1}`|
|109|`{"belong_version":1}`|
|110|`{"belong_version":1}`|
|111|`{"belong_version":1}`|
|112|`{"belong_version":1}`|
|113|`{"belong_version":1}`|
|114|`{"belong_version":1}`|
|115|`{"belong_version":1}`|
|116|`{"belong_version":1}`|
|117|`{"belong_version":1}`|
|118|`{"belong_version":1}`|
|119|`{"belong_version":1}`|
|120|`{"belong_version":1}`|
|121|`{"belong_version":1}`|
|122|`{"belong_version":1}`|
|123|`{"belong_version":1}`|
|124|`{"belong_version":1}`|
|125|`{"belong_version":1}`|
|126|`{"belong_version":1}`|
|127|`{"belong_version":1}`|
|128|`{"belong_version":1}`|
|201|`{"belong_version":2}`|
|202|`{"belong_version":2}`|
|203|`{"belong_version":2}`|
|204|`{"belong_version":2}`|
|205|`{"belong_version":2}`|
|206|`{"belong_version":2}`|
|207|`{"belong_version":2}`|
|208|`{"belong_version":2}`|
|209|`{"belong_version":2}`|
|210|`{"belong_version":2}`|
|211|`{"belong_version":2}`|
|212|`{"belong_version":2}`|
|213|`{"belong_version":2}`|
|214|`{"belong_version":2}`|
|215|`{"belong_version":2}`|
|216|`{"belong_version":2}`|
|217|`{"belong_version":2}`|
|218|`{"belong_version":2}`|
|219|`{"belong_version":2}`|
|220|`{"belong_version":2}`|
|221|`{"belong_version":2}`|
|222|`{"belong_version":2}`|
|223|`{"belong_version":2}`|
|224|`{"belong_version":2}`|
|225|`{"belong_version":2}`|
|226|`{"belong_version":2}`|
|227|`{"belong_version":2}`|
|228|`{"belong_version":2}`|
|229|`{"belong_version":2}`|
|230|`{"belong_version":2}`|

## MonopolyPathVersion

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|open_tid|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"open_tid":1239}`|
|2|`{"open_tid":1299}`|

## Add_Type

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|

## Dispatch

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|addition_type|array|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|produce_addition|array|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|point|array|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|unlock_level|array|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"addition_type":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],"point":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],"unlock_level":[2,3,5]}`|
|2|`{"addition_type":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],"point":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],"unlock_level":[2,3,5]}`|
|3|`{"addition_type":[],"point":[],"unlock_level":[]}`|
|4|`{"addition_type":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],"point":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],"unlock_level":[2,3,5]}`|
|5|`{"addition_type":[],"point":[],"unlock_level":[]}`|

## MonopolyDispatchPoint

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|44|本表行键；与其他表同值不自动代表同一对象。|
|point|number|44|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|30000|`{"point":1}`|
|30001|`{"point":2}`|
|30002|`{"point":3}`|
|30003|`{"point":4}`|
|30004|`{"point":5}`|
|30005|`{"point":6}`|
|30006|`{"point":7}`|
|30007|`{"point":8}`|
|30008|`{"point":9}`|
|30009|`{"point":10}`|
|30010|`{"point":11}`|
|40000|`{"point":2}`|
|40001|`{"point":3}`|
|40002|`{"point":4}`|
|40003|`{"point":5}`|
|40004|`{"point":6}`|
|40005|`{"point":7}`|
|40006|`{"point":8}`|
|40007|`{"point":9}`|
|40008|`{"point":10}`|
|40009|`{"point":11}`|
|40010|`{"point":12}`|
|50000|`{"point":3}`|
|50001|`{"point":4}`|
|50002|`{"point":5}`|
|50003|`{"point":6}`|
|50004|`{"point":7}`|
|50005|`{"point":8}`|
|50006|`{"point":9}`|
|50007|`{"point":10}`|
|50008|`{"point":11}`|
|50009|`{"point":12}`|
|50010|`{"point":13}`|
|60000|`{"point":4}`|
|60001|`{"point":5}`|
|60002|`{"point":6}`|
|60003|`{"point":7}`|
|60004|`{"point":8}`|
|60005|`{"point":9}`|
|60006|`{"point":10}`|
|60007|`{"point":11}`|
|60008|`{"point":12}`|
|60009|`{"point":13}`|
|60010|`{"point":14}`|

## MonopolyTech

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|build|number|121|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|showIcon|string|121|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|unlock_week|number|121|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|121|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|value|number|121|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|duration|number|121|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|showName|number|121|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|121|本表行键；与其他表同值不自动代表同一对象。|
|res|number|121|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|extra_rewards|array|121|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"unlock_week":2,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|102|`{"unlock_week":4,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|103|`{"unlock_week":6,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|104|`{"unlock_week":8,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|105|`{"unlock_week":10,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|106|`{"unlock_week":12,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|107|`{"unlock_week":14,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|108|`{"unlock_week":16,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|109|`{"unlock_week":18,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|110|`{"unlock_week":20,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|111|`{"unlock_week":22,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|112|`{"unlock_week":24,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|113|`{"unlock_week":26,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|114|`{"unlock_week":28,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|115|`{"unlock_week":30,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|116|`{"unlock_week":32,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|117|`{"unlock_week":34,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|118|`{"unlock_week":36,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|119|`{"unlock_week":38,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|120|`{"unlock_week":40,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|201|`{"unlock_week":2,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|202|`{"unlock_week":4,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|203|`{"unlock_week":6,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|204|`{"unlock_week":8,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|205|`{"unlock_week":10,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|206|`{"unlock_week":12,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|207|`{"unlock_week":14,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|208|`{"unlock_week":16,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|209|`{"unlock_week":18,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|210|`{"unlock_week":20,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|211|`{"unlock_week":22,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|212|`{"unlock_week":24,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|213|`{"unlock_week":26,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|214|`{"unlock_week":28,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|215|`{"unlock_week":30,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|216|`{"unlock_week":32,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|217|`{"unlock_week":34,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|218|`{"unlock_week":36,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|219|`{"unlock_week":38,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|220|`{"unlock_week":40,"type":0,"value":2,"duration":172800,"extra_rewards":[]}`|
|301|`{"unlock_week":3,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|302|`{"unlock_week":5,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|303|`{"unlock_week":7,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|304|`{"unlock_week":9,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|305|`{"unlock_week":11,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|306|`{"unlock_week":13,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|307|`{"unlock_week":15,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|308|`{"unlock_week":17,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|309|`{"unlock_week":19,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|310|`{"unlock_week":21,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|311|`{"unlock_week":23,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|312|`{"unlock_week":25,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|313|`{"unlock_week":27,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|314|`{"unlock_week":29,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|315|`{"unlock_week":31,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|316|`{"unlock_week":33,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|317|`{"unlock_week":35,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|318|`{"unlock_week":37,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|319|`{"unlock_week":39,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|320|`{"unlock_week":41,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|321|`{"unlock_week":42,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|322|`{"unlock_week":43,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|323|`{"unlock_week":44,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|324|`{"unlock_week":45,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|401|`{"unlock_week":3,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|402|`{"unlock_week":5,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|403|`{"unlock_week":7,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|404|`{"unlock_week":9,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|405|`{"unlock_week":11,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|406|`{"unlock_week":13,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|407|`{"unlock_week":15,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|408|`{"unlock_week":17,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|409|`{"unlock_week":19,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|410|`{"unlock_week":21,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|411|`{"unlock_week":23,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|412|`{"unlock_week":25,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|413|`{"unlock_week":27,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|414|`{"unlock_week":29,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|415|`{"unlock_week":31,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|416|`{"unlock_week":33,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|417|`{"unlock_week":35,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|418|`{"unlock_week":37,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|419|`{"unlock_week":39,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|420|`{"unlock_week":41,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|421|`{"unlock_week":42,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|422|`{"unlock_week":43,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|423|`{"unlock_week":44,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|424|`{"unlock_week":45,"type":2,"value":2000,"duration":172800,"extra_rewards":[]}`|
|501|`{"unlock_week":3,"type":2,"value":1000,"duration":172800,"extra_rewards":[]}`|
|502|`{"unlock_week":5,"type":2,"value":1000,"duration":172800,"extra_rewards":[]}`|
|503|`{"unlock_week":7,"type":2,"value":1000,"duration":172800,"extra_rewards":[]}`|
|504|`{"unlock_week":9,"type":2,"value":1000,"duration":172800,"extra_rewards":[]}`|
|505|`{"unlock_week":11,"type":2,"value":1000,"duration":172800,"extra_rewards":[]}`|
|506|`{"unlock_week":13,"type":2,"value":1000,"duration":172800,"extra_rewards":[]}`|
|507|`{"unlock_week":15,"type":2,"value":1000,"duration":172800,"extra_rewards":[]}`|
|508|`{"unlock_week":17,"type":2,"value":1000,"duration":172800,"extra_rewards":[]}`|
|509|`{"unlock_week":19,"type":2,"value":1000,"duration":172800,"extra_rewards":[]}`|
|510|`{"unlock_week":21,"type":2,"value":1000,"duration":172800,"extra_rewards":[]}`|
|511|`{"unlock_week":23,"type":2,"value":1000,"duration":172800,"extra_rewards":[]}`|
|512|`{"unlock_week":25,"type":2,"value":1000,"duration":172800,"extra_rewards":[]}`|
|513|`{"unlock_week":27,"type":2,"value":1000,"duration":172800,"extra_rewards":[]}`|
|514|`{"unlock_week":29,"type":2,"value":1000,"duration":172800,"extra_rewards":[]}`|
|515|`{"unlock_week":31,"type":2,"value":1000,"duration":172800,"extra_rewards":[]}`|
|516|`{"unlock_week":33,"type":2,"value":1000,"duration":172800,"extra_rewards":[]}`|
|517|`{"unlock_week":35,"type":2,"value":1000,"duration":172800,"extra_rewards":[]}`|
|518|`{"unlock_week":37,"type":2,"value":1000,"duration":172800,"extra_rewards":[]}`|
|519|`{"unlock_week":39,"type":2,"value":1000,"duration":172800,"extra_rewards":[]}`|
|520|`{"unlock_week":41,"type":2,"value":1000,"duration":172800,"extra_rewards":[]}`|
|521|`{"unlock_week":42,"type":2,"value":1000,"duration":172800,"extra_rewards":[]}`|
|522|`{"unlock_week":43,"type":2,"value":1000,"duration":172800,"extra_rewards":[]}`|
|523|`{"unlock_week":44,"type":2,"value":1000,"duration":172800,"extra_rewards":[]}`|
|524|`{"unlock_week":45,"type":2,"value":1000,"duration":172800,"extra_rewards":[]}`|
|601|`{"unlock_week":3,"type":0,"value":1,"duration":172800,"extra_rewards":[]}`|
|602|`{"unlock_week":5,"type":0,"value":1,"duration":172800,"extra_rewards":[]}`|
|603|`{"unlock_week":9,"type":0,"value":1,"duration":172800,"extra_rewards":[]}`|
|604|`{"unlock_week":13,"type":0,"value":1,"duration":172800,"extra_rewards":[]}`|
|605|`{"unlock_week":17,"type":0,"value":1,"duration":172800,"extra_rewards":[]}`|
|606|`{"unlock_week":21,"type":0,"value":1,"duration":172800,"extra_rewards":[]}`|
|607|`{"unlock_week":25,"type":0,"value":1,"duration":172800,"extra_rewards":[]}`|
|608|`{"unlock_week":29,"type":0,"value":1,"duration":172800,"extra_rewards":[]}`|
|701|`{"unlock_week":6,"type":0,"value":1,"duration":259200,"extra_rewards":[]}`|
