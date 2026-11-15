# CommonMapTable 规则参数

来源：[personal-server/assets/tables/CommonMapTable.data.lua.json.gz](../../../../personal-server/assets/tables/CommonMapTable.data.lua.json.gz)，SHA256：`1075dddfeec8d5304c1463405f8e884457336afe71cbcfad7eb82130e730a112`。

[完整逐行JSON](CommonMapTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[BuffGroup](#buffgroup)|2|decoded-rows|
|[Buff](#buff)|16|decoded-rows|
|[Area](#area)|2|decoded-rows|
|[BoxGroup](#boxgroup)|3|decoded-rows|
|[Box](#box)|8|decoded-rows|
|[Game](#game)|3|decoded-rows|
|[GameAward](#gameaward)|76|decoded-rows|
|[AwardPool](#awardpool)|10|decoded-rows|
|[FishingGame](#fishinggame)|8|decoded-rows|
|[Fight](#fight)|5|decoded-rows|
|[Node](#node)|11|decoded-rows|
|[CommonMap](#commonmap)|1|decoded-rows|
|[KeyType](#keytype)|2|decoded-rows|
|[Key](#key)|26|decoded-rows|
|[RandomKeyConst](#randomkeyconst)|2|decoded-rows|
|[RandomKey](#randomkey)|5|decoded-rows|
|[HideStory](#hidestory)|4|decoded-rows|
|[HideStoryOption](#hidestoryoption)|12|decoded-rows|

## BuffGroup

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|icon|string|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|desc|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|

## Buff

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|16|本表行键；与其他表同值不自动代表同一对象。|
|group|number|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attrs|array|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|icon|string|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|desc|number|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"group":1,"attrs":[[6,1000]]}`|
|2|`{"group":1,"attrs":[[11,1500]]}`|
|3|`{"group":1,"attrs":[[12,2000]]}`|
|4|`{"group":1,"attrs":[[13,1500]]}`|
|5|`{"group":1,"attrs":[[17,1500]]}`|
|6|`{"group":1,"attrs":[[57,1000]]}`|
|7|`{"group":1,"attrs":[[54,1000]]}`|
|8|`{"group":1,"attrs":[[59,3000]]}`|
|9|`{"group":2,"attrs":[[45,1000]]}`|
|10|`{"group":2,"attrs":[[15,1500]]}`|
|11|`{"group":2,"attrs":[[16,2000]]}`|
|12|`{"group":2,"attrs":[[23,1500]]}`|
|13|`{"group":2,"attrs":[[18,1500]]}`|
|14|`{"group":2,"attrs":[[58,1000]]}`|
|15|`{"group":2,"attrs":[[55,1000]]}`|
|16|`{"group":2,"attrs":[[60,3000]]}`|

## Area

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|cloud|string|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|

## BoxGroup

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|lib_range|array|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|icon|string|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"lib_range":[[40,5],[40,6],[100,7],[100,8]]}`|
|2|`{"lib_range":[[80,2],[100,3],[100,4]]}`|
|3|`{"lib_range":[[100,1]]}`|

## Box

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|8|本表行键；与其他表同值不自动代表同一对象。|
|weight|number|8|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|
|award_list|array|8|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"weight":100,"award_list":[[807002,5],[2021200,1],[1941200,2],[5301900,200],[502002,10]]}`|
|2|`{"weight":80,"award_list":[[5301900,50],[501002,160],[1941200,1],[502002,1]]}`|
|3|`{"weight":100,"award_list":[[5301900,30],[501002,240],[1931200,2],[502002,2]]}`|
|4|`{"weight":100,"award_list":[[5301900,20],[501002,380],[1931200,2]]}`|
|5|`{"weight":40,"award_list":[[5301900,50],[501002,200],[200114,3],[502002,1]]}`|
|6|`{"weight":40,"award_list":[[5301900,50],[501002,200],[200214,3],[502002,1]]}`|
|7|`{"weight":100,"award_list":[[5301900,30],[501002,320],[100114,5]]}`|
|8|`{"weight":100,"award_list":[[5301900,20],[501002,200],[100114,5],[502002,2]]}`|

## Game

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|game|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|desc|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|icon|string|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tips_bg|string|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tips_icon|string|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tips_title|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tips_des|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tips_pic_one|string|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tips_pic_two|string|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tips_des_one|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tips_des_two|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|count|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"count":5}`|
|2|`{"count":20}`|
|3|`{"count":3}`|

## GameAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|76|本表行键；与其他表同值不自动代表同一对象。|
|value_tid|number|76|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_list|array|76|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1101|`{"value_tid":111,"award_list":[[334002,1]]}`|
|1102|`{"value_tid":111,"award_list":[[335002,1]]}`|
|1103|`{"value_tid":111,"award_list":[[336002,1]]}`|
|1104|`{"value_tid":111,"award_list":[[337002,1]]}`|
|1105|`{"value_tid":111,"award_list":[[334002,1]]}`|
|1106|`{"value_tid":111,"award_list":[[335002,1]]}`|
|1107|`{"value_tid":111,"award_list":[[336002,1]]}`|
|1108|`{"value_tid":111,"award_list":[[337002,1]]}`|
|1109|`{"value_tid":111,"award_list":[[337002,1]]}`|
|1110|`{"value_tid":111,"award_list":[[337002,1]]}`|
|1111|`{"value_tid":112,"award_list":[[334002,1]]}`|
|1112|`{"value_tid":112,"award_list":[[335002,1]]}`|
|1113|`{"value_tid":112,"award_list":[[336002,1]]}`|
|1114|`{"value_tid":112,"award_list":[[337002,1]]}`|
|1115|`{"value_tid":112,"award_list":[[334002,1]]}`|
|1116|`{"value_tid":112,"award_list":[[335002,1]]}`|
|1117|`{"value_tid":112,"award_list":[[336002,1]]}`|
|1118|`{"value_tid":112,"award_list":[[337002,1]]}`|
|1119|`{"value_tid":112,"award_list":[[337002,1]]}`|
|1120|`{"value_tid":112,"award_list":[[337002,1]]}`|
|1201|`{"value_tid":0,"award_list":[[334002,1]]}`|
|1202|`{"value_tid":0,"award_list":[[335002,1]]}`|
|1203|`{"value_tid":0,"award_list":[[336002,1]]}`|
|1204|`{"value_tid":0,"award_list":[[337002,1]]}`|
|1205|`{"value_tid":0,"award_list":[[334002,1]]}`|
|1206|`{"value_tid":0,"award_list":[[335002,1]]}`|
|1207|`{"value_tid":0,"award_list":[[336002,1]]}`|
|1208|`{"value_tid":0,"award_list":[[337002,1]]}`|
|1301|`{"value_tid":131,"award_list":[[337002,1]]}`|
|1302|`{"value_tid":132,"award_list":[[337002,1]]}`|
|1303|`{"value_tid":133,"award_list":[[334002,1]]}`|
|1304|`{"value_tid":133,"award_list":[[335002,1]]}`|
|1305|`{"value_tid":133,"award_list":[[336002,1]]}`|
|1306|`{"value_tid":133,"award_list":[[334002,1]]}`|
|1307|`{"value_tid":133,"award_list":[[335002,1]]}`|
|1308|`{"value_tid":133,"award_list":[[336002,1]]}`|
|1309|`{"value_tid":133,"award_list":[[335002,1]]}`|
|1310|`{"value_tid":133,"award_list":[[336002,1]]}`|
|2101|`{"value_tid":211,"award_list":[[373002,1]]}`|
|2102|`{"value_tid":211,"award_list":[[374002,1]]}`|
|2103|`{"value_tid":211,"award_list":[[375002,1]]}`|
|2104|`{"value_tid":211,"award_list":[[376002,1]]}`|
|2105|`{"value_tid":211,"award_list":[[373002,1]]}`|
|2106|`{"value_tid":211,"award_list":[[374002,1]]}`|
|2107|`{"value_tid":211,"award_list":[[375002,1]]}`|
|2108|`{"value_tid":211,"award_list":[[376002,1]]}`|
|2109|`{"value_tid":211,"award_list":[[376002,1]]}`|
|2110|`{"value_tid":211,"award_list":[[376002,1]]}`|
|2111|`{"value_tid":212,"award_list":[[373002,1]]}`|
|2112|`{"value_tid":212,"award_list":[[374002,1]]}`|
|2113|`{"value_tid":212,"award_list":[[375002,1]]}`|
|2114|`{"value_tid":212,"award_list":[[376002,1]]}`|
|2115|`{"value_tid":212,"award_list":[[373002,1]]}`|
|2116|`{"value_tid":212,"award_list":[[374002,1]]}`|
|2117|`{"value_tid":212,"award_list":[[375002,1]]}`|
|2118|`{"value_tid":212,"award_list":[[376002,1]]}`|
|2119|`{"value_tid":212,"award_list":[[376002,1]]}`|
|2120|`{"value_tid":212,"award_list":[[376002,1]]}`|
|2201|`{"value_tid":0,"award_list":[[373002,1]]}`|
|2202|`{"value_tid":0,"award_list":[[374002,1]]}`|
|2203|`{"value_tid":0,"award_list":[[375002,1]]}`|
|2204|`{"value_tid":0,"award_list":[[376002,1]]}`|
|2205|`{"value_tid":0,"award_list":[[373002,1]]}`|
|2206|`{"value_tid":0,"award_list":[[374002,1]]}`|
|2207|`{"value_tid":0,"award_list":[[375002,1]]}`|
|2208|`{"value_tid":0,"award_list":[[376002,1]]}`|
|2301|`{"value_tid":231,"award_list":[[376002,1]]}`|
|2302|`{"value_tid":232,"award_list":[[376002,1]]}`|
|2303|`{"value_tid":233,"award_list":[[373002,1]]}`|
|2304|`{"value_tid":233,"award_list":[[374002,1]]}`|
|2305|`{"value_tid":233,"award_list":[[375002,1]]}`|
|2306|`{"value_tid":233,"award_list":[[373002,1]]}`|
|2307|`{"value_tid":233,"award_list":[[374002,1]]}`|
|2308|`{"value_tid":233,"award_list":[[375002,1]]}`|
|2309|`{"value_tid":233,"award_list":[[374002,1]]}`|
|2310|`{"value_tid":233,"award_list":[[375002,1]]}`|

## AwardPool

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|10|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|111|`{}`|
|112|`{}`|
|131|`{}`|
|132|`{}`|
|133|`{}`|
|211|`{}`|
|212|`{}`|
|231|`{}`|
|232|`{}`|
|233|`{}`|

## FishingGame

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|8|本表行键；与其他表同值不自动代表同一对象。|
|progress_interval|array|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|speed|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|point_type|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|point_icon|string|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"progress_interval":[[50,70],[15,25]],"speed":1.8,"point_type":1,"point_icon":"img_cwxyx_diaoyudian1.png"}`|
|2|`{"progress_interval":[[40,60],[10,20]],"speed":1.8,"point_type":1,"point_icon":"img_cwxyx_diaoyudian1.png"}`|
|3|`{"progress_interval":[[70,90],[40,60]],"speed":1.8,"point_type":1,"point_icon":"img_cwxyx_diaoyudian1.png"}`|
|4|`{"progress_interval":[[80,95],[30,45]],"speed":1.2,"point_type":2,"point_icon":"img_cwxyx_diaoyudian2.png"}`|
|5|`{"progress_interval":[[70,85],[25,40]],"speed":1.2,"point_type":2,"point_icon":"img_cwxyx_diaoyudian2.png"}`|
|6|`{"progress_interval":[[30,45],[60,75]],"speed":1.2,"point_type":2,"point_icon":"img_cwxyx_diaoyudian2.png"}`|
|7|`{"progress_interval":[[40,55],[75,90]],"speed":1.2,"point_type":2,"point_icon":"img_cwxyx_diaoyudian2.png"}`|
|8|`{"progress_interval":[[10,25],[40,55]],"speed":1.2,"point_type":2,"point_icon":"img_cwxyx_diaoyudian2.png"}`|

## Fight

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|award_list|array|5|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award_list":[[5301900,10],[501002,200]]}`|
|2|`{"award_list":[[5301900,10],[501002,120]]}`|
|3|`{"award_list":[[5301900,10],[501002,120]]}`|
|4|`{"award_list":[[5301900,30],[501002,200],[1931200,1]]}`|
|5|`{"award_list":[[5301900,50],[501002,300],[1941200,1],[502002,6]]}`|

## Node

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|11|本表行键；与其他表同值不自动代表同一对象。|
|is_explore|boolean|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|trigger_pb|string|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|editor_class_name|string|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|editor_class_params|object/array|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lua_node_class|object|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_event|boolean|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"is_explore":false,"is_event":false}`|
|2|`{"is_explore":false,"is_event":false}`|
|3|`{"is_explore":true,"is_event":true}`|
|4|`{"is_explore":true,"is_event":true}`|
|5|`{"is_explore":false,"is_event":true}`|
|6|`{"is_explore":true,"is_event":true}`|
|7|`{"is_explore":false,"is_event":true}`|
|8|`{"is_explore":true,"is_event":true}`|
|9|`{"is_explore":true,"is_event":true}`|
|10|`{"is_explore":false,"is_event":true}`|
|11|`{"is_explore":true,"is_event":true}`|

## CommonMap

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|init_pb_struct|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"init_pb_struct":"pb_pet_play_master"}`|

## KeyType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|3|`{}`|
|5|`{}`|

## Key

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|26|本表行键；与其他表同值不自动代表同一对象。|
|consume_list|array|26|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1301|`{"consume_list":[[334002,3]]}`|
|1302|`{"consume_list":[[335002,3]]}`|
|1303|`{"consume_list":[[336002,3]]}`|
|1304|`{"consume_list":[[334002,2],[335002,1]]}`|
|1305|`{"consume_list":[[335002,2],[336002,1]]}`|
|1306|`{"consume_list":[[334002,2],[336002,1]]}`|
|1307|`{"consume_list":[[334002,1],[335002,2]]}`|
|1308|`{"consume_list":[[334002,1],[336002,2]]}`|
|1309|`{"consume_list":[[335002,1],[336002,2]]}`|
|1310|`{"consume_list":[[334002,1],[335002,1],[336002,1]]}`|
|1501|`{"consume_list":[[334002,2],[335002,1],[336002,2]]}`|
|1502|`{"consume_list":[[334002,2],[335002,2],[336002,1]]}`|
|1503|`{"consume_list":[[334002,1],[335002,2],[336002,2]]}`|
|2301|`{"consume_list":[[373002,3]]}`|
|2302|`{"consume_list":[[374002,3]]}`|
|2303|`{"consume_list":[[375002,3]]}`|
|2304|`{"consume_list":[[373002,2],[374002,1]]}`|
|2305|`{"consume_list":[[374002,2],[375002,1]]}`|
|2306|`{"consume_list":[[373002,2],[375002,1]]}`|
|2307|`{"consume_list":[[373002,1],[374002,2]]}`|
|2308|`{"consume_list":[[373002,1],[375002,2]]}`|
|2309|`{"consume_list":[[374002,1],[375002,2]]}`|
|2310|`{"consume_list":[[373002,1],[374002,1],[375002,1]]}`|
|2501|`{"consume_list":[[373002,2],[374002,1],[375002,2]]}`|
|2502|`{"consume_list":[[373002,2],[374002,2],[375002,1]]}`|
|2503|`{"consume_list":[[373002,1],[374002,2],[375002,2]]}`|

## RandomKeyConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|item_keys|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|power_key|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|output_num|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"item_keys":[334002,335002,336002],"power_key":337002,"output_num":[5,5,5]}`|
|2|`{"item_keys":[373002,374002,375002],"power_key":376002,"output_num":[5,5,5]}`|

## RandomKey

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|show_name|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|desc|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|

## HideStory

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|story|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|story_title|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|talk|array|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|

## HideStoryOption

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|12|本表行键；与其他表同值不自动代表同一对象。|
|award_list|array|12|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|title|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|content|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|result|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award_list":[[501002,100]]}`|
|2|`{"award_list":[[1941200,1]]}`|
|3|`{"award_list":[[100114,5]]}`|
|4|`{"award_list":[[1941200,1]]}`|
|5|`{"award_list":[[501002,100]]}`|
|6|`{"award_list":[[100114,5]]}`|
|7|`{"award_list":[[100114,5]]}`|
|8|`{"award_list":[[501002,100]]}`|
|9|`{"award_list":[[1941200,1]]}`|
|10|`{"award_list":[[1941200,1]]}`|
|11|`{"award_list":[[100114,5]]}`|
|12|`{"award_list":[[501002,100]]}`|
