# DrawTable 规则参数

来源：[personal-server/assets/tables/DrawTable.data.lua.json.gz](../../../../personal-server/assets/tables/DrawTable.data.lua.json.gz)，SHA256：`0e5974286da5d19a7811b24a0c020f2f8c3772ca762eddc704662b60e924df53`。

[完整逐行JSON](DrawTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[SkinConst](#skinconst)|1|decoded-rows|
|[SkinDialogue](#skindialogue)|2|decoded-rows|
|[SkinShow](#skinshow)|4|decoded-rows|
|[RandomDrawWish](#randomdrawwish)|6|decoded-rows|
|[LibWeight](#libweight)|589|decoded-rows|
|[Group](#group)|820|decoded-rows|
|[Item](#item)|2540|decoded-rows|

## SkinConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|interval_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"interval_time":8}`|

## SkinDialogue

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|interval_time|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|bubble_des|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_time|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"interval_time":8,"show_time":5}`|
|2|`{"interval_time":0,"show_time":5}`|

## SkinShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|assert|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|isNew|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|weight|number|4|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|100712|`{"assert":254606700001,"weight":100}`|
|101500|`{"assert":254606700001,"weight":100}`|
|150312|`{"assert":41613701402,"weight":100}`|
|201500|`{"assert":254606700001,"weight":110}`|

## RandomDrawWish

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|piece_group|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_prefab|string|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|draw_lib|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|300113|`{"piece_group":20103,"draw_lib":30}`|
|300120|`{"piece_group":20403,"draw_lib":31}`|
|300213|`{"piece_group":20104,"draw_lib":30}`|
|300220|`{"piece_group":20404,"draw_lib":31}`|
|300313|`{"piece_group":20105,"draw_lib":30}`|
|300320|`{"piece_group":20405,"draw_lib":31}`|

## LibWeight

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|counter_guaranteed_group|array|589|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|guaranteed_weight|array|589|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|
|against_guaranteed_group_num|number|589|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|guaranteed_group|array|589|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|589|本表行键；与其他表同值不自动代表同一对象。|
|reset_guaranteed_top_num|number|589|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|weight_group|array|589|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|
|max_draw_num|number|589|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

下列3行用于说明结构；全部589行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"counter_guaranteed_group":[],"guaranteed_weight":[40],"against_guaranteed_group_num":1,"guaranteed_group":[6],"reset_guaranteed_top_num":1,"weight_group":[[205,6],[5000,7],[4720,8]],"max_draw_num":2}`|
|102|`{"counter_guaranteed_group":[],"guaranteed_weight":[40],"against_guaranteed_group_num":1,"guaranteed_group":[1],"reset_guaranteed_top_num":1,"weight_group":[[400,1],[5000,7],[4600,8]],"max_draw_num":2}`|
|103|`{"counter_guaranteed_group":[],"guaranteed_weight":[20],"against_guaranteed_group_num":1,"guaranteed_group":[9],"reset_guaranteed_top_num":1,"weight_group":[[200,9],[5000,10],[4800,11]],"max_draw_num":1}`|

## Group

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|820|本表行键；与其他表同值不自动代表同一对象。|
|lib_range|array|820|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部820行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"lib_range":[]}`|
|2|`{"lib_range":[]}`|
|3|`{"lib_range":[]}`|

## Item

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2540|本表行键；与其他表同值不自动代表同一对象。|
|res|number|2540|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|weight|number|2540|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|
|num|number|2540|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部2540行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|210001|`{"weight":700,"num":2}`|
|210002|`{"weight":500,"num":666}`|
|210003|`{"weight":1000,"num":1}`|
