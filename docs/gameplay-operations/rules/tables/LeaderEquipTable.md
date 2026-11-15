# LeaderEquipTable 规则参数

来源：[personal-server/assets/tables/LeaderEquipTable.data.lua.json.gz](../../../../personal-server/assets/tables/LeaderEquipTable.data.lua.json.gz)，SHA256：`d0b0af00ce7a03fa395c38ee1d90bc766a913c46877f4269f5bee7edab330566`。

[完整逐行JSON](LeaderEquipTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[DismissConst](#dismissconst)|1|decoded-rows|
|[ForgeConst](#forgeconst)|1|decoded-rows|
|[Forge](#forge)|24|decoded-rows|
|[StarAttr](#starattr)|576|decoded-rows|
|[Star](#star)|96|decoded-rows|
|[Quality](#quality)|6|decoded-rows|
|[IntensifyRate](#intensifyrate)|149|decoded-rows|
|[Intensify](#intensify)|1224|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[Level](#level)|3000|decoded-rows|
|[Type](#type)|6|decoded-rows|
|[LeaderEquip](#leaderequip)|144|decoded-rows|
|[Grade](#grade)|6|decoded-rows|

## DismissConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|dis_item|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|dis_quality|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"dis_item":514002,"dis_quality":[20,30,40]}`|

## ForgeConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|max_lv|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"max_lv":4}`|

## Forge

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|add_wish|array|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_wish|number|24|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|show_name|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|draw_lib|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|24|本表行键；与其他表同值不自动代表同一对象。|
|add_exp|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|up_exp|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|wish_hit_rate|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"add_wish":[2,3],"max_wish":1000,"draw_lib":131,"add_exp":10,"up_exp":0,"wish_hit_rate":10}`|
|102|`{"add_wish":[2,5],"max_wish":1000,"draw_lib":132,"add_exp":10,"up_exp":300,"wish_hit_rate":10}`|
|103|`{"add_wish":[3,6],"max_wish":1000,"draw_lib":133,"add_exp":10,"up_exp":500,"wish_hit_rate":10}`|
|104|`{"add_wish":[4,7],"max_wish":1000,"draw_lib":134,"add_exp":10,"up_exp":700,"wish_hit_rate":10}`|
|201|`{"add_wish":[2,3],"max_wish":1000,"draw_lib":135,"add_exp":10,"up_exp":0,"wish_hit_rate":10}`|
|202|`{"add_wish":[2,5],"max_wish":1000,"draw_lib":136,"add_exp":10,"up_exp":400,"wish_hit_rate":10}`|
|203|`{"add_wish":[3,6],"max_wish":1000,"draw_lib":137,"add_exp":10,"up_exp":600,"wish_hit_rate":10}`|
|204|`{"add_wish":[4,7],"max_wish":1000,"draw_lib":138,"add_exp":10,"up_exp":800,"wish_hit_rate":10}`|
|301|`{"add_wish":[2,3],"max_wish":1000,"draw_lib":139,"add_exp":10,"up_exp":0,"wish_hit_rate":10}`|
|302|`{"add_wish":[2,5],"max_wish":1000,"draw_lib":140,"add_exp":10,"up_exp":500,"wish_hit_rate":10}`|
|303|`{"add_wish":[3,6],"max_wish":1000,"draw_lib":141,"add_exp":10,"up_exp":800,"wish_hit_rate":10}`|
|304|`{"add_wish":[4,7],"max_wish":1000,"draw_lib":142,"add_exp":10,"up_exp":1100,"wish_hit_rate":10}`|
|401|`{"add_wish":[2,3],"max_wish":1000,"draw_lib":143,"add_exp":10,"up_exp":0,"wish_hit_rate":10}`|
|402|`{"add_wish":[2,5],"max_wish":1000,"draw_lib":144,"add_exp":10,"up_exp":700,"wish_hit_rate":10}`|
|403|`{"add_wish":[3,6],"max_wish":1000,"draw_lib":145,"add_exp":10,"up_exp":1000,"wish_hit_rate":10}`|
|404|`{"add_wish":[4,7],"max_wish":1000,"draw_lib":146,"add_exp":10,"up_exp":1400,"wish_hit_rate":10}`|
|501|`{"add_wish":[2,3],"max_wish":1000,"draw_lib":147,"add_exp":10,"up_exp":0,"wish_hit_rate":10}`|
|502|`{"add_wish":[2,5],"max_wish":1000,"draw_lib":148,"add_exp":10,"up_exp":800,"wish_hit_rate":10}`|
|503|`{"add_wish":[3,6],"max_wish":1000,"draw_lib":149,"add_exp":10,"up_exp":1200,"wish_hit_rate":10}`|
|504|`{"add_wish":[4,7],"max_wish":1000,"draw_lib":150,"add_exp":10,"up_exp":1650,"wish_hit_rate":10}`|
|601|`{"add_wish":[2,3],"max_wish":1000,"draw_lib":151,"add_exp":10,"up_exp":0,"wish_hit_rate":10}`|
|602|`{"add_wish":[2,5],"max_wish":1000,"draw_lib":152,"add_exp":10,"up_exp":1000,"wish_hit_rate":10}`|
|603|`{"add_wish":[3,6],"max_wish":1000,"draw_lib":153,"add_exp":10,"up_exp":1500,"wish_hit_rate":10}`|
|604|`{"add_wish":[4,7],"max_wish":1000,"draw_lib":154,"add_exp":10,"up_exp":2000,"wish_hit_rate":10}`|

## StarAttr

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|576|本表行键；与其他表同值不自动代表同一对象。|
|secondary_attr|array|576|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|second_attr_effect|array|576|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|equip|number|576|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr|array|576|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部576行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|2001018000|`{"secondary_attr":[],"second_attr_effect":[],"attr":[[209,0],[108,0]]}`|
|2001018001|`{"secondary_attr":[[65,100]],"second_attr_effect":[2],"attr":[[209,54],[108,100]]}`|
|2001018002|`{"secondary_attr":[[65,100],[67,100]],"second_attr_effect":[2,2],"attr":[[209,108],[108,150]]}`|

## Star

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|96|本表行键；与其他表同值不自动代表同一对象。|
|cost_num|number|96|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|dismiss_num|number|96|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|120000|`{"cost_num":0,"dismiss_num":30}`|
|120001|`{"cost_num":4,"dismiss_num":120}`|
|120002|`{"cost_num":4,"dismiss_num":480}`|
|120003|`{"cost_num":4,"dismiss_num":1920}`|
|130000|`{"cost_num":0,"dismiss_num":60}`|
|130001|`{"cost_num":3,"dismiss_num":180}`|
|130002|`{"cost_num":4,"dismiss_num":720}`|
|130003|`{"cost_num":4,"dismiss_num":2880}`|
|140000|`{"cost_num":0,"dismiss_num":100}`|
|140001|`{"cost_num":3,"dismiss_num":300}`|
|140002|`{"cost_num":3,"dismiss_num":900}`|
|140003|`{"cost_num":4,"dismiss_num":3600}`|
|150000|`{"cost_num":0,"dismiss_num":250}`|
|150001|`{"cost_num":2,"dismiss_num":500}`|
|150002|`{"cost_num":2,"dismiss_num":1000}`|
|150003|`{"cost_num":3,"dismiss_num":3000}`|
|220000|`{"cost_num":0,"dismiss_num":36}`|
|220001|`{"cost_num":4,"dismiss_num":144}`|
|220002|`{"cost_num":4,"dismiss_num":576}`|
|220003|`{"cost_num":4,"dismiss_num":2304}`|
|230000|`{"cost_num":0,"dismiss_num":72}`|
|230001|`{"cost_num":3,"dismiss_num":216}`|
|230002|`{"cost_num":4,"dismiss_num":864}`|
|230003|`{"cost_num":4,"dismiss_num":3456}`|
|240000|`{"cost_num":0,"dismiss_num":120}`|
|240001|`{"cost_num":3,"dismiss_num":360}`|
|240002|`{"cost_num":3,"dismiss_num":1080}`|
|240003|`{"cost_num":4,"dismiss_num":4320}`|
|250000|`{"cost_num":0,"dismiss_num":300}`|
|250001|`{"cost_num":2,"dismiss_num":600}`|
|250002|`{"cost_num":2,"dismiss_num":1200}`|
|250003|`{"cost_num":3,"dismiss_num":3600}`|
|320000|`{"cost_num":0,"dismiss_num":42}`|
|320001|`{"cost_num":4,"dismiss_num":168}`|
|320002|`{"cost_num":4,"dismiss_num":672}`|
|320003|`{"cost_num":4,"dismiss_num":2688}`|
|330000|`{"cost_num":0,"dismiss_num":84}`|
|330001|`{"cost_num":3,"dismiss_num":252}`|
|330002|`{"cost_num":4,"dismiss_num":1008}`|
|330003|`{"cost_num":4,"dismiss_num":4032}`|
|340000|`{"cost_num":0,"dismiss_num":140}`|
|340001|`{"cost_num":3,"dismiss_num":420}`|
|340002|`{"cost_num":3,"dismiss_num":1260}`|
|340003|`{"cost_num":4,"dismiss_num":5040}`|
|350000|`{"cost_num":0,"dismiss_num":350}`|
|350001|`{"cost_num":2,"dismiss_num":700}`|
|350002|`{"cost_num":2,"dismiss_num":1400}`|
|350003|`{"cost_num":3,"dismiss_num":4200}`|
|420000|`{"cost_num":0,"dismiss_num":45}`|
|420001|`{"cost_num":4,"dismiss_num":180}`|
|420002|`{"cost_num":4,"dismiss_num":720}`|
|420003|`{"cost_num":4,"dismiss_num":2880}`|
|430000|`{"cost_num":0,"dismiss_num":90}`|
|430001|`{"cost_num":3,"dismiss_num":270}`|
|430002|`{"cost_num":4,"dismiss_num":1080}`|
|430003|`{"cost_num":4,"dismiss_num":4320}`|
|440000|`{"cost_num":0,"dismiss_num":150}`|
|440001|`{"cost_num":3,"dismiss_num":450}`|
|440002|`{"cost_num":3,"dismiss_num":1350}`|
|440003|`{"cost_num":4,"dismiss_num":5400}`|
|450000|`{"cost_num":0,"dismiss_num":375}`|
|450001|`{"cost_num":2,"dismiss_num":750}`|
|450002|`{"cost_num":2,"dismiss_num":1500}`|
|450003|`{"cost_num":3,"dismiss_num":4500}`|
|520000|`{"cost_num":0,"dismiss_num":48}`|
|520001|`{"cost_num":4,"dismiss_num":192}`|
|520002|`{"cost_num":4,"dismiss_num":768}`|
|520003|`{"cost_num":4,"dismiss_num":3072}`|
|530000|`{"cost_num":0,"dismiss_num":96}`|
|530001|`{"cost_num":3,"dismiss_num":288}`|
|530002|`{"cost_num":4,"dismiss_num":1152}`|
|530003|`{"cost_num":4,"dismiss_num":4608}`|
|540000|`{"cost_num":0,"dismiss_num":160}`|
|540001|`{"cost_num":3,"dismiss_num":480}`|
|540002|`{"cost_num":3,"dismiss_num":1440}`|
|540003|`{"cost_num":4,"dismiss_num":5760}`|
|550000|`{"cost_num":0,"dismiss_num":400}`|
|550001|`{"cost_num":2,"dismiss_num":800}`|
|550002|`{"cost_num":2,"dismiss_num":1600}`|
|550003|`{"cost_num":3,"dismiss_num":4800}`|
|620000|`{"cost_num":0,"dismiss_num":60}`|
|620001|`{"cost_num":4,"dismiss_num":240}`|
|620002|`{"cost_num":4,"dismiss_num":960}`|
|620003|`{"cost_num":4,"dismiss_num":3840}`|
|630000|`{"cost_num":0,"dismiss_num":120}`|
|630001|`{"cost_num":3,"dismiss_num":360}`|
|630002|`{"cost_num":4,"dismiss_num":1440}`|
|630003|`{"cost_num":4,"dismiss_num":5760}`|
|640000|`{"cost_num":0,"dismiss_num":200}`|
|640001|`{"cost_num":3,"dismiss_num":600}`|
|640002|`{"cost_num":3,"dismiss_num":1800}`|
|640003|`{"cost_num":4,"dismiss_num":7200}`|
|650000|`{"cost_num":0,"dismiss_num":500}`|
|650001|`{"cost_num":2,"dismiss_num":1000}`|
|650002|`{"cost_num":2,"dismiss_num":2000}`|
|650003|`{"cost_num":3,"dismiss_num":6000}`|

## Quality

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|border_id|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_quality_name|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|show_quality_text_id|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|border|string|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10|`{"show_quality_name":0,"show_quality_text_id":0}`|
|20|`{"show_quality_name":6502600,"show_quality_text_id":4005}`|
|30|`{"show_quality_name":6502601,"show_quality_text_id":4004}`|
|40|`{"show_quality_name":6502602,"show_quality_text_id":4003}`|
|50|`{"show_quality_name":6502603,"show_quality_text_id":6043}`|
|60|`{"show_quality_name":6502604,"show_quality_text_id":0}`|

## IntensifyRate

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rate|number|149|原倍率/概率字段值；具体分母由该表消费者决定。|
|tid|number|149|本表行键；与其他表同值不自动代表同一对象。|
|lucky|number|149|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|100000|`{"rate":0}`|
|100001|`{"rate":5000}`|
|100002|`{"rate":6666}`|
|100003|`{"rate":10000}`|
|200000|`{"rate":0}`|
|200001|`{"rate":4000}`|
|200002|`{"rate":5000}`|
|200003|`{"rate":8000}`|
|200004|`{"rate":10000}`|
|300000|`{"rate":0}`|
|300001|`{"rate":3000}`|
|300002|`{"rate":4000}`|
|300003|`{"rate":5500}`|
|300004|`{"rate":7000}`|
|300005|`{"rate":10000}`|
|400000|`{"rate":0}`|
|400001|`{"rate":0}`|
|400002|`{"rate":3000}`|
|400003|`{"rate":5000}`|
|400004|`{"rate":7000}`|
|400005|`{"rate":9000}`|
|400006|`{"rate":10000}`|
|500000|`{"rate":0}`|
|500001|`{"rate":0}`|
|500002|`{"rate":0}`|
|500003|`{"rate":3000}`|
|500004|`{"rate":5000}`|
|500005|`{"rate":7000}`|
|500006|`{"rate":8000}`|
|500007|`{"rate":10000}`|
|600000|`{"rate":0}`|
|600001|`{"rate":0}`|
|600002|`{"rate":0}`|
|600003|`{"rate":0}`|
|600004|`{"rate":3000}`|
|600005|`{"rate":4000}`|
|600006|`{"rate":5000}`|
|600007|`{"rate":6000}`|
|600008|`{"rate":7000}`|
|600009|`{"rate":10000}`|
|700000|`{"rate":0}`|
|700001|`{"rate":0}`|
|700002|`{"rate":0}`|
|700003|`{"rate":0}`|
|700004|`{"rate":1000}`|
|700005|`{"rate":1500}`|
|700006|`{"rate":5000}`|
|700007|`{"rate":5000}`|
|700008|`{"rate":7000}`|
|700009|`{"rate":8000}`|
|700010|`{"rate":10000}`|
|800000|`{"rate":0}`|
|800001|`{"rate":0}`|
|800002|`{"rate":0}`|
|800003|`{"rate":0}`|
|800004|`{"rate":0}`|
|800005|`{"rate":1000}`|
|800006|`{"rate":1500}`|
|800007|`{"rate":5000}`|
|800008|`{"rate":5000}`|
|800009|`{"rate":5000}`|
|800010|`{"rate":7000}`|
|800011|`{"rate":10000}`|
|900000|`{"rate":0}`|
|900001|`{"rate":0}`|
|900002|`{"rate":0}`|
|900003|`{"rate":0}`|
|900004|`{"rate":0}`|
|900005|`{"rate":0}`|
|900006|`{"rate":1000}`|
|900007|`{"rate":1500}`|
|900008|`{"rate":2000}`|
|900009|`{"rate":5000}`|
|900010|`{"rate":5000}`|
|900011|`{"rate":5000}`|
|900012|`{"rate":6000}`|
|900013|`{"rate":7000}`|
|900014|`{"rate":10000}`|
|1000000|`{"rate":0}`|
|1000001|`{"rate":0}`|
|1000002|`{"rate":0}`|
|1000003|`{"rate":0}`|
|1000004|`{"rate":0}`|
|1000005|`{"rate":0}`|
|1000006|`{"rate":0}`|
|1000007|`{"rate":0}`|
|1000008|`{"rate":1000}`|
|1000009|`{"rate":1000}`|
|1000010|`{"rate":1500}`|
|1000011|`{"rate":2000}`|
|1000012|`{"rate":5000}`|
|1000013|`{"rate":5000}`|
|1000014|`{"rate":6000}`|
|1000015|`{"rate":6000}`|
|1000016|`{"rate":7000}`|
|1000017|`{"rate":10000}`|
|1100000|`{"rate":0}`|
|1100001|`{"rate":0}`|
|1100002|`{"rate":0}`|
|1100003|`{"rate":0}`|
|1100004|`{"rate":0}`|
|1100005|`{"rate":0}`|
|1100006|`{"rate":0}`|
|1100007|`{"rate":0}`|
|1100008|`{"rate":0}`|
|1100009|`{"rate":0}`|
|1100010|`{"rate":0}`|
|1100011|`{"rate":1000}`|
|1100012|`{"rate":1000}`|
|1100013|`{"rate":1200}`|
|1100014|`{"rate":1500}`|
|1100015|`{"rate":2000}`|
|1100016|`{"rate":3000}`|
|1100017|`{"rate":3000}`|
|1100018|`{"rate":3000}`|
|1100019|`{"rate":4000}`|
|1100020|`{"rate":5000}`|
|1100021|`{"rate":6000}`|
|1100022|`{"rate":10000}`|
|1200000|`{"rate":0}`|
|1200001|`{"rate":0}`|
|1200002|`{"rate":0}`|
|1200003|`{"rate":0}`|
|1200004|`{"rate":0}`|
|1200005|`{"rate":0}`|
|1200006|`{"rate":0}`|
|1200007|`{"rate":0}`|
|1200008|`{"rate":0}`|
|1200009|`{"rate":0}`|
|1200010|`{"rate":0}`|
|1200011|`{"rate":0}`|
|1200012|`{"rate":0}`|
|1200013|`{"rate":0}`|
|1200014|`{"rate":600}`|
|1200015|`{"rate":700}`|
|1200016|`{"rate":1000}`|
|1200017|`{"rate":1200}`|
|1200018|`{"rate":1500}`|
|1200019|`{"rate":3000}`|
|1200020|`{"rate":3000}`|
|1200021|`{"rate":3000}`|
|1200022|`{"rate":4000}`|
|1200023|`{"rate":4000}`|
|1200024|`{"rate":4000}`|
|1200025|`{"rate":5000}`|
|1200026|`{"rate":5000}`|
|1200027|`{"rate":6000}`|
|1200028|`{"rate":6000}`|
|1200029|`{"rate":10000}`|

## Intensify

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|cost|array|1224|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|tid|number|1224|本表行键；与其他表同值不自动代表同一对象。|
|attr|array|1224|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|dismiss_num|number|1224|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|equip|number|1224|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr_percent|number|1224|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部1224行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|2001018000|`{"cost":[[514002,0]],"attr":[[209,0],[108,0]],"dismiss_num":0,"attr_percent":0}`|
|2001018001|`{"cost":[[514002,100]],"attr":[[209,54],[108,100]],"dismiss_num":125,"attr_percent":300}`|
|2001018002|`{"cost":[[514002,120]],"attr":[[209,108],[108,250]],"dismiss_num":307,"attr_percent":300}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|intensify_min_quality|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|tips_item|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|intensify_ratio|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"intensify_min_quality":20}`|

## Level

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|cost|array|3000|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|tid|number|3000|本表行键；与其他表同值不自动代表同一对象。|
|attr|array|3000|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部3000行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10001|`{"cost":[[513002,160]],"attr":[[209,29],[108,10]]}`|
|10002|`{"cost":[[513002,160]],"attr":[[209,58],[108,20]]}`|
|10003|`{"cost":[[513002,160]],"attr":[[209,86],[108,30]]}`|

## Type

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|type_icon|string|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|forge_type_icon|string|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tips_item|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"type_icon":"img_szdz_zhusgbeiicon_touguan.png","forge_type_icon":"img_szdz_zhuangbeiicon_touguan.png"}`|
|2|`{"type_icon":"img_szdz_zhsn_doupeng.png","forge_type_icon":"img_szdz_zhuangbeiicon_doupeng.png"}`|
|3|`{"type_icon":"img_szdz_zhuaon_fazhang.png","forge_type_icon":"img_szdz_zhuangbeiicon_fazhang.png"}`|
|4|`{"type_icon":"img_sdn_xiongzhen.png","forge_type_icon":"img_szdz_zhuangbeiicon_xiongzhen.png"}`|
|5|`{"type_icon":"img_szdz_zbeiicon_xianglian.png","forge_type_icon":"img_szdz_zhuangbeiicon_xianglian.png"}`|
|6|`{"type_icon":"img_szdz_sgbeiicon_hufu.png","forge_type_icon":"img_szdz_zhuangbeiicon_hufu.png"}`|

## LeaderEquip

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|score|number|144|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|second_attr_effect|array|144|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|144|本表行键；与其他表同值不自动代表同一对象。|
|type|number|144|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|grade|number|144|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|icon|string|144|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|secondary_attr|array|144|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr|array|144|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|2001018|`{"score":2160,"second_attr_effect":[],"type":1,"secondary_attr":[],"attr":[[209,216],[108,50]]}`|
|2002018|`{"score":2160,"second_attr_effect":[],"type":2,"secondary_attr":[],"attr":[[201,2160],[108,50]]}`|
|2003018|`{"score":2160,"second_attr_effect":[],"type":3,"secondary_attr":[],"attr":[[202,360],[108,50]]}`|
|2004018|`{"score":2160,"second_attr_effect":[],"type":4,"secondary_attr":[],"attr":[[209,216],[108,50]]}`|
|2005018|`{"score":2160,"second_attr_effect":[],"type":5,"secondary_attr":[],"attr":[[201,2160],[108,50]]}`|
|2006018|`{"score":2160,"second_attr_effect":[],"type":6,"secondary_attr":[],"attr":[[202,360],[108,50]]}`|
|2007018|`{"score":8460,"second_attr_effect":[],"type":1,"secondary_attr":[],"attr":[[209,846],[108,400]]}`|
|2008018|`{"score":8460,"second_attr_effect":[],"type":2,"secondary_attr":[],"attr":[[201,8460],[108,400]]}`|
|2009018|`{"score":8460,"second_attr_effect":[],"type":3,"secondary_attr":[],"attr":[[202,1410],[108,400]]}`|
|2010018|`{"score":8460,"second_attr_effect":[],"type":4,"secondary_attr":[],"attr":[[209,846],[108,400]]}`|
|2011018|`{"score":8460,"second_attr_effect":[],"type":5,"secondary_attr":[],"attr":[[201,8460],[108,400]]}`|
|2012018|`{"score":8460,"second_attr_effect":[],"type":6,"secondary_attr":[],"attr":[[202,1410],[108,400]]}`|
|2013018|`{"score":19080,"second_attr_effect":[],"type":1,"secondary_attr":[],"attr":[[209,1908],[108,750]]}`|
|2014018|`{"score":19080,"second_attr_effect":[],"type":2,"secondary_attr":[],"attr":[[201,19080],[108,750]]}`|
|2015018|`{"score":19080,"second_attr_effect":[],"type":3,"secondary_attr":[],"attr":[[202,3180],[108,750]]}`|
|2016018|`{"score":19080,"second_attr_effect":[],"type":4,"secondary_attr":[],"attr":[[209,1908],[108,750]]}`|
|2017018|`{"score":19080,"second_attr_effect":[],"type":5,"secondary_attr":[],"attr":[[201,19080],[108,750]]}`|
|2018018|`{"score":19080,"second_attr_effect":[],"type":6,"secondary_attr":[],"attr":[[202,3180],[108,750]]}`|
|2019018|`{"score":39420,"second_attr_effect":[],"type":1,"secondary_attr":[],"attr":[[209,3942],[108,1150]]}`|
|2020018|`{"score":39420,"second_attr_effect":[],"type":2,"secondary_attr":[],"attr":[[201,39420],[108,1150]]}`|
|2021018|`{"score":39420,"second_attr_effect":[],"type":3,"secondary_attr":[],"attr":[[202,6570],[108,1150]]}`|
|2022018|`{"score":39420,"second_attr_effect":[],"type":4,"secondary_attr":[],"attr":[[209,3942],[108,1150]]}`|
|2023018|`{"score":39420,"second_attr_effect":[],"type":5,"secondary_attr":[],"attr":[[201,39420],[108,1150]]}`|
|2024018|`{"score":39420,"second_attr_effect":[],"type":6,"secondary_attr":[],"attr":[[202,6570],[108,1150]]}`|
|2025018|`{"score":79200,"second_attr_effect":[],"type":1,"secondary_attr":[],"attr":[[209,7920],[108,1850]]}`|
|2026018|`{"score":79200,"second_attr_effect":[],"type":2,"secondary_attr":[],"attr":[[201,79200],[108,1850]]}`|
|2027018|`{"score":79200,"second_attr_effect":[],"type":3,"secondary_attr":[],"attr":[[202,13200],[108,1850]]}`|
|2028018|`{"score":79200,"second_attr_effect":[],"type":4,"secondary_attr":[],"attr":[[209,7920],[108,1850]]}`|
|2029018|`{"score":79200,"second_attr_effect":[],"type":5,"secondary_attr":[],"attr":[[201,79200],[108,1850]]}`|
|2030018|`{"score":79200,"second_attr_effect":[],"type":6,"secondary_attr":[],"attr":[[202,13200],[108,1850]]}`|
|2031018|`{"score":153540,"second_attr_effect":[],"type":1,"secondary_attr":[],"attr":[[209,15354],[108,2550]]}`|
|2032018|`{"score":153540,"second_attr_effect":[],"type":2,"secondary_attr":[],"attr":[[201,153540],[108,2550]]}`|
|2033018|`{"score":153540,"second_attr_effect":[],"type":3,"secondary_attr":[],"attr":[[202,25590],[108,2550]]}`|
|2034018|`{"score":153540,"second_attr_effect":[],"type":4,"secondary_attr":[],"attr":[[209,15354],[108,2550]]}`|
|2035018|`{"score":153540,"second_attr_effect":[],"type":5,"secondary_attr":[],"attr":[[201,153540],[108,2550]]}`|
|2036018|`{"score":153540,"second_attr_effect":[],"type":6,"secondary_attr":[],"attr":[[202,25590],[108,2550]]}`|
|3037018|`{"score":3960,"second_attr_effect":[2],"type":1,"secondary_attr":[[409,400]],"attr":[[209,396],[108,100]]}`|
|3038018|`{"score":3960,"second_attr_effect":[2],"type":2,"secondary_attr":[[309,400]],"attr":[[201,3960],[108,100]]}`|
|3039018|`{"score":3960,"second_attr_effect":[2],"type":3,"secondary_attr":[[414,400]],"attr":[[202,660],[108,100]]}`|
|3040018|`{"score":3960,"second_attr_effect":[2],"type":4,"secondary_attr":[[314,400]],"attr":[[209,396],[108,100]]}`|
|3041018|`{"score":3960,"second_attr_effect":[2],"type":5,"secondary_attr":[[407,400]],"attr":[[201,3960],[108,100]]}`|
|3042018|`{"score":3960,"second_attr_effect":[2],"type":6,"secondary_attr":[[307,400]],"attr":[[202,660],[108,100]]}`|
|3043018|`{"score":10800,"second_attr_effect":[2],"type":1,"secondary_attr":[[409,500]],"attr":[[209,1080],[108,450]]}`|
|3044018|`{"score":10800,"second_attr_effect":[2],"type":2,"secondary_attr":[[309,500]],"attr":[[201,10800],[108,450]]}`|
|3045018|`{"score":10800,"second_attr_effect":[2],"type":3,"secondary_attr":[[414,500]],"attr":[[202,1800],[108,450]]}`|
|3046018|`{"score":10800,"second_attr_effect":[2],"type":4,"secondary_attr":[[314,500]],"attr":[[209,1080],[108,450]]}`|
|3047018|`{"score":10800,"second_attr_effect":[2],"type":5,"secondary_attr":[[407,500]],"attr":[[201,10800],[108,450]]}`|
|3048018|`{"score":10800,"second_attr_effect":[2],"type":6,"secondary_attr":[[307,500]],"attr":[[202,1800],[108,450]]}`|
|3049018|`{"score":23580,"second_attr_effect":[2],"type":1,"secondary_attr":[[409,600]],"attr":[[209,2358],[108,800]]}`|
|3050018|`{"score":23580,"second_attr_effect":[2],"type":2,"secondary_attr":[[309,600]],"attr":[[201,23580],[108,800]]}`|
|3051018|`{"score":23580,"second_attr_effect":[2],"type":3,"secondary_attr":[[414,600]],"attr":[[202,3930],[108,800]]}`|
|3052018|`{"score":23580,"second_attr_effect":[2],"type":4,"secondary_attr":[[314,600]],"attr":[[209,2358],[108,800]]}`|
|3053018|`{"score":23580,"second_attr_effect":[2],"type":5,"secondary_attr":[[407,600]],"attr":[[201,23580],[108,800]]}`|
|3054018|`{"score":23580,"second_attr_effect":[2],"type":6,"secondary_attr":[[307,600]],"attr":[[202,3930],[108,800]]}`|
|3055018|`{"score":48240,"second_attr_effect":[2],"type":1,"secondary_attr":[[409,800]],"attr":[[209,4824],[108,1300]]}`|
|3056018|`{"score":48240,"second_attr_effect":[2],"type":2,"secondary_attr":[[309,800]],"attr":[[201,48240],[108,1300]]}`|
|3057018|`{"score":48240,"second_attr_effect":[2],"type":3,"secondary_attr":[[414,800]],"attr":[[202,8040],[108,1300]]}`|
|3058018|`{"score":48240,"second_attr_effect":[2],"type":4,"secondary_attr":[[314,800]],"attr":[[209,4824],[108,1300]]}`|
|3059018|`{"score":48240,"second_attr_effect":[2],"type":5,"secondary_attr":[[407,800]],"attr":[[201,48240],[108,1300]]}`|
|3060018|`{"score":48240,"second_attr_effect":[2],"type":6,"secondary_attr":[[307,800]],"attr":[[202,8040],[108,1300]]}`|
|3061018|`{"score":96120,"second_attr_effect":[2],"type":1,"secondary_attr":[[409,1000]],"attr":[[209,9612],[108,2000]]}`|
|3062018|`{"score":96120,"second_attr_effect":[2],"type":2,"secondary_attr":[[309,1000]],"attr":[[201,96120],[108,2000]]}`|
|3063018|`{"score":96120,"second_attr_effect":[2],"type":3,"secondary_attr":[[414,1000]],"attr":[[202,16020],[108,2000]]}`|
|3064018|`{"score":96120,"second_attr_effect":[2],"type":4,"secondary_attr":[[314,1000]],"attr":[[209,9612],[108,2000]]}`|
|3065018|`{"score":96120,"second_attr_effect":[2],"type":5,"secondary_attr":[[407,1000]],"attr":[[201,96120],[108,2000]]}`|
|3066018|`{"score":96120,"second_attr_effect":[2],"type":6,"secondary_attr":[[307,1000]],"attr":[[202,16020],[108,2000]]}`|
|3067018|`{"score":183420,"second_attr_effect":[2],"type":1,"secondary_attr":[[409,1200]],"attr":[[209,18342],[108,2700]]}`|
|3068018|`{"score":183420,"second_attr_effect":[2],"type":2,"secondary_attr":[[309,1200]],"attr":[[201,183420],[108,2700]]}`|
|3069018|`{"score":183420,"second_attr_effect":[2],"type":3,"secondary_attr":[[414,1200]],"attr":[[202,30570],[108,2700]]}`|
|3070018|`{"score":183420,"second_attr_effect":[2],"type":4,"secondary_attr":[[314,1200]],"attr":[[209,18342],[108,2700]]}`|
|3071018|`{"score":183420,"second_attr_effect":[2],"type":5,"secondary_attr":[[407,1200]],"attr":[[201,183420],[108,2700]]}`|
|3072018|`{"score":183420,"second_attr_effect":[2],"type":6,"secondary_attr":[[307,1200]],"attr":[[202,30570],[108,2700]]}`|
|4073018|`{"score":5760,"second_attr_effect":[2,2],"type":1,"secondary_attr":[[409,400],[410,400]],"attr":[[209,576],[108,200]]}`|
|4074018|`{"score":5760,"second_attr_effect":[2,2],"type":2,"secondary_attr":[[309,400],[310,400]],"attr":[[201,5760],[108,200]]}`|
|4075018|`{"score":5760,"second_attr_effect":[2,2],"type":3,"secondary_attr":[[414,400],[413,400]],"attr":[[202,960],[108,200]]}`|
|4076018|`{"score":5760,"second_attr_effect":[2,2],"type":4,"secondary_attr":[[314,400],[313,400]],"attr":[[209,576],[108,200]]}`|
|4077018|`{"score":5760,"second_attr_effect":[2,2],"type":5,"secondary_attr":[[407,400],[408,400]],"attr":[[201,5760],[108,200]]}`|
|4078018|`{"score":5760,"second_attr_effect":[2,2],"type":6,"secondary_attr":[[307,400],[308,400]],"attr":[[202,960],[108,200]]}`|
|4079018|`{"score":14220,"second_attr_effect":[2,2],"type":1,"secondary_attr":[[409,500],[410,500]],"attr":[[209,1422],[108,550]]}`|
|4080018|`{"score":14220,"second_attr_effect":[2,2],"type":2,"secondary_attr":[[309,500],[310,500]],"attr":[[201,14220],[108,550]]}`|
|4081018|`{"score":14220,"second_attr_effect":[2,2],"type":3,"secondary_attr":[[414,500],[413,500]],"attr":[[202,2370],[108,550]]}`|
|4082018|`{"score":14220,"second_attr_effect":[2,2],"type":4,"secondary_attr":[[314,500],[313,500]],"attr":[[209,1422],[108,550]]}`|
|4083018|`{"score":14220,"second_attr_effect":[2,2],"type":5,"secondary_attr":[[407,500],[408,500]],"attr":[[201,14220],[108,550]]}`|
|4084018|`{"score":14220,"second_attr_effect":[2,2],"type":6,"secondary_attr":[[307,500],[308,500]],"attr":[[202,2370],[108,550]]}`|
|4085018|`{"score":30240,"second_attr_effect":[2,2],"type":1,"secondary_attr":[[409,600],[410,600]],"attr":[[209,3024],[108,900]]}`|
|4086018|`{"score":30240,"second_attr_effect":[2,2],"type":2,"secondary_attr":[[309,600],[310,600]],"attr":[[201,30240],[108,900]]}`|
|4087018|`{"score":30240,"second_attr_effect":[2,2],"type":3,"secondary_attr":[[414,600],[413,600]],"attr":[[202,5040],[108,900]]}`|
|4088018|`{"score":30240,"second_attr_effect":[2,2],"type":4,"secondary_attr":[[314,600],[313,600]],"attr":[[209,3024],[108,900]]}`|
|4089018|`{"score":30240,"second_attr_effect":[2,2],"type":5,"secondary_attr":[[407,600],[408,600]],"attr":[[201,30240],[108,900]]}`|
|4090018|`{"score":30240,"second_attr_effect":[2,2],"type":6,"secondary_attr":[[307,600],[308,600]],"attr":[[202,5040],[108,900]]}`|
|4091018|`{"score":61380,"second_attr_effect":[2,2],"type":1,"secondary_attr":[[409,800],[410,800]],"attr":[[209,6138],[108,1500]]}`|
|4092018|`{"score":61380,"second_attr_effect":[2,2],"type":2,"secondary_attr":[[309,800],[310,800]],"attr":[[201,61380],[108,1500]]}`|
|4093018|`{"score":61380,"second_attr_effect":[2,2],"type":3,"secondary_attr":[[414,800],[413,800]],"attr":[[202,10230],[108,1500]]}`|
|4094018|`{"score":61380,"second_attr_effect":[2,2],"type":4,"secondary_attr":[[314,800],[313,800]],"attr":[[209,6138],[108,1500]]}`|
|4095018|`{"score":61380,"second_attr_effect":[2,2],"type":5,"secondary_attr":[[407,800],[408,800]],"attr":[[201,61380],[108,1500]]}`|
|4096018|`{"score":61380,"second_attr_effect":[2,2],"type":6,"secondary_attr":[[307,800],[308,800]],"attr":[[202,10230],[108,1500]]}`|
|4097018|`{"score":120600,"second_attr_effect":[2,2],"type":1,"secondary_attr":[[409,1000],[410,1000]],"attr":[[209,12060],[108,2200]]}`|
|4098018|`{"score":120600,"second_attr_effect":[2,2],"type":2,"secondary_attr":[[309,1000],[310,1000]],"attr":[[201,120600],[108,2200]]}`|
|4099018|`{"score":120600,"second_attr_effect":[2,2],"type":3,"secondary_attr":[[414,1000],[413,1000]],"attr":[[202,20100],[108,2200]]}`|
|4100018|`{"score":120600,"second_attr_effect":[2,2],"type":4,"secondary_attr":[[314,1000],[313,1000]],"attr":[[209,12060],[108,2200]]}`|
|4101018|`{"score":120600,"second_attr_effect":[2,2],"type":5,"secondary_attr":[[407,1000],[408,1000]],"attr":[[201,120600],[108,2200]]}`|
|4102018|`{"score":120600,"second_attr_effect":[2,2],"type":6,"secondary_attr":[[307,1000],[308,1000]],"attr":[[202,20100],[108,2200]]}`|
|4103018|`{"score":224100,"second_attr_effect":[2,2],"type":1,"secondary_attr":[[409,1200],[410,1200]],"attr":[[209,22410],[108,2700]]}`|
|4104018|`{"score":224100,"second_attr_effect":[2,2],"type":2,"secondary_attr":[[309,1200],[310,1200]],"attr":[[201,224100],[108,2700]]}`|
|4105018|`{"score":224100,"second_attr_effect":[2,2],"type":3,"secondary_attr":[[414,1200],[413,1200]],"attr":[[202,37350],[108,2700]]}`|
|4106018|`{"score":224100,"second_attr_effect":[2,2],"type":4,"secondary_attr":[[314,1200],[313,1200]],"attr":[[209,22410],[108,2700]]}`|
|4107018|`{"score":224100,"second_attr_effect":[2,2],"type":5,"secondary_attr":[[407,1200],[408,1200]],"attr":[[201,224100],[108,2700]]}`|
|4108018|`{"score":224100,"second_attr_effect":[2,2],"type":6,"secondary_attr":[[307,1200],[308,1200]],"attr":[[202,37350],[108,2700]]}`|
|5109018|`{"score":7560,"second_attr_effect":[2,2,2],"type":1,"secondary_attr":[[409,400],[410,400],[415,4]],"attr":[[209,756],[108,350]]}`|
|5110018|`{"score":7560,"second_attr_effect":[2,2,2],"type":2,"secondary_attr":[[309,400],[310,400],[315,4]],"attr":[[201,7560],[108,350]]}`|
|5111018|`{"score":7560,"second_attr_effect":[2,2,2],"type":3,"secondary_attr":[[414,400],[413,400],[416,4]],"attr":[[202,1260],[108,350]]}`|
|5112018|`{"score":7560,"second_attr_effect":[2,2,2],"type":4,"secondary_attr":[[314,400],[313,400],[316,4]],"attr":[[209,756],[108,350]]}`|
|5113018|`{"score":7560,"second_attr_effect":[2,2,1],"type":5,"secondary_attr":[[407,400],[408,400],[28,400]],"attr":[[201,7560],[108,350]]}`|
|5114018|`{"score":7560,"second_attr_effect":[2,2,1],"type":6,"secondary_attr":[[307,400],[308,400],[29,400]],"attr":[[202,1260],[108,350]]}`|
|5115018|`{"score":17640,"second_attr_effect":[2,2,2],"type":1,"secondary_attr":[[409,500],[410,500],[415,5]],"attr":[[209,1764],[108,700]]}`|
|5116018|`{"score":17640,"second_attr_effect":[2,2,2],"type":2,"secondary_attr":[[309,500],[310,500],[315,5]],"attr":[[201,17640],[108,700]]}`|
|5117018|`{"score":17640,"second_attr_effect":[2,2,2],"type":3,"secondary_attr":[[414,500],[413,500],[416,5]],"attr":[[202,2940],[108,700]]}`|
|5118018|`{"score":17640,"second_attr_effect":[2,2,2],"type":4,"secondary_attr":[[314,500],[313,500],[316,5]],"attr":[[209,1764],[108,700]]}`|
|5119018|`{"score":17640,"second_attr_effect":[2,2,1],"type":5,"secondary_attr":[[407,500],[408,500],[28,500]],"attr":[[201,17640],[108,700]]}`|
|5120018|`{"score":17640,"second_attr_effect":[2,2,1],"type":6,"secondary_attr":[[307,500],[308,500],[29,500]],"attr":[[202,2940],[108,700]]}`|
|5121018|`{"score":36900,"second_attr_effect":[2,2,2],"type":1,"secondary_attr":[[409,600],[410,600],[415,6]],"attr":[[209,3690],[108,1050]]}`|
|5122018|`{"score":36900,"second_attr_effect":[2,2,2],"type":2,"secondary_attr":[[309,600],[310,600],[315,6]],"attr":[[201,36900],[108,1050]]}`|
|5123018|`{"score":36900,"second_attr_effect":[2,2,2],"type":3,"secondary_attr":[[414,600],[413,600],[416,6]],"attr":[[202,6150],[108,1050]]}`|
|5124018|`{"score":36900,"second_attr_effect":[2,2,2],"type":4,"secondary_attr":[[314,600],[313,600],[316,6]],"attr":[[209,3690],[108,1050]]}`|
|5125018|`{"score":36900,"second_attr_effect":[2,2,1],"type":5,"secondary_attr":[[407,600],[408,600],[28,600]],"attr":[[201,36900],[108,1050]]}`|
|5126018|`{"score":36900,"second_attr_effect":[2,2,1],"type":6,"secondary_attr":[[307,600],[308,600],[29,600]],"attr":[[202,6150],[108,1050]]}`|
|5127018|`{"score":74520,"second_attr_effect":[2,2,2],"type":1,"secondary_attr":[[409,800],[410,800],[415,8]],"attr":[[209,7452],[108,1750]]}`|
|5128018|`{"score":74520,"second_attr_effect":[2,2,2],"type":2,"secondary_attr":[[309,800],[310,800],[315,8]],"attr":[[201,74520],[108,1750]]}`|
|5129018|`{"score":74520,"second_attr_effect":[2,2,2],"type":3,"secondary_attr":[[414,800],[413,800],[416,8]],"attr":[[202,12420],[108,1750]]}`|
|5130018|`{"score":74520,"second_attr_effect":[2,2,2],"type":4,"secondary_attr":[[314,800],[313,800],[316,8]],"attr":[[209,7452],[108,1750]]}`|
|5131018|`{"score":74520,"second_attr_effect":[2,2,1],"type":5,"secondary_attr":[[407,800],[408,800],[28,800]],"attr":[[201,74520],[108,1750]]}`|
|5132018|`{"score":74520,"second_attr_effect":[2,2,1],"type":6,"secondary_attr":[[307,800],[308,800],[29,800]],"attr":[[202,12420],[108,1750]]}`|
|5133018|`{"score":145080,"second_attr_effect":[2,2,2],"type":1,"secondary_attr":[[409,1000],[410,1000],[415,10]],"attr":[[209,14508],[108,2450]]}`|
|5134018|`{"score":145080,"second_attr_effect":[2,2,2],"type":2,"secondary_attr":[[309,1000],[310,1000],[315,10]],"attr":[[201,145080],[108,2450]]}`|
|5135018|`{"score":145080,"second_attr_effect":[2,2,2],"type":3,"secondary_attr":[[414,1000],[413,1000],[416,10]],"attr":[[202,24180],[108,2450]]}`|
|5136018|`{"score":145080,"second_attr_effect":[2,2,2],"type":4,"secondary_attr":[[314,1000],[313,1000],[316,10]],"attr":[[209,14508],[108,2450]]}`|
|5137018|`{"score":145080,"second_attr_effect":[2,2,1],"type":5,"secondary_attr":[[407,1000],[408,1000],[28,1000]],"attr":[[201,145080],[108,2450]]}`|
|5138018|`{"score":145080,"second_attr_effect":[2,2,1],"type":6,"secondary_attr":[[307,1000],[308,1000],[29,1000]],"attr":[[202,24180],[108,2450]]}`|
|5139018|`{"score":264780,"second_attr_effect":[2,2,2],"type":1,"secondary_attr":[[409,1200],[410,1200],[415,12]],"attr":[[209,26478],[108,3150]]}`|
|5140018|`{"score":264780,"second_attr_effect":[2,2,2],"type":2,"secondary_attr":[[309,1200],[310,1200],[315,12]],"attr":[[201,264780],[108,3150]]}`|
|5141018|`{"score":264780,"second_attr_effect":[2,2,2],"type":3,"secondary_attr":[[414,1200],[413,1200],[416,12]],"attr":[[202,44130],[108,3150]]}`|
|5142018|`{"score":264780,"second_attr_effect":[2,2,2],"type":4,"secondary_attr":[[314,1200],[313,1200],[316,12]],"attr":[[209,26478],[108,3150]]}`|
|5143018|`{"score":264780,"second_attr_effect":[2,2,1],"type":5,"secondary_attr":[[407,1200],[408,1200],[28,1200]],"attr":[[201,264780],[108,3150]]}`|
|5144018|`{"score":264780,"second_attr_effect":[2,2,1],"type":6,"secondary_attr":[[307,1200],[308,1200],[29,1200]],"attr":[[202,44130],[108,3150]]}`|

## Grade

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|require_role_figure_rank|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|show_name|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|draw_lib|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_level|number|6|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|name_prop|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|name_bg|string|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"require_role_figure_rank":1,"draw_lib":116,"max_level":80}`|
|2|`{"require_role_figure_rank":9,"draw_lib":117,"max_level":160}`|
|3|`{"require_role_figure_rank":11,"draw_lib":118,"max_level":240}`|
|4|`{"require_role_figure_rank":14,"draw_lib":119,"max_level":320}`|
|5|`{"require_role_figure_rank":17,"draw_lib":120,"max_level":400}`|
|6|`{"require_role_figure_rank":20,"draw_lib":121,"max_level":500}`|
