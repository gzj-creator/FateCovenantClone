# EnjoyBlessingActTable 规则参数

来源：[personal-server/assets/tables/EnjoyBlessingActTable.data.lua.json.gz](../../../../personal-server/assets/tables/EnjoyBlessingActTable.data.lua.json.gz)，SHA256：`e5dda58bca93ab699e365da70b4d2bfb40ccd5a2432f2025c964a9b3fdb4a2ca`。

[完整逐行JSON](EnjoyBlessingActTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Version](#version)|2|decoded-rows|
|[Purchase](#purchase)|14|decoded-rows|
|[Recharge](#recharge)|5|decoded-rows|
|[Show](#show)|2|decoded-rows|
|[Rebate](#rebate)|9|decoded-rows|

## Version

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rebate_library|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|stop_day|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|gift_library|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|back_item|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|shake_active|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|recharge_library|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"rebate_library":1,"stop_day":18,"gift_library":1,"back_item":601500,"recharge_library":1}`|
|2|`{"rebate_library":1,"stop_day":18,"gift_library":2,"back_item":601500,"recharge_library":1}`|

## Purchase

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|jump_func|number|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|back_limit|number|14|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|back_item|number|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|14|本表行键；与其他表同值不自动代表同一对象。|
|gift|number|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"jump_func":38,"back_limit":1,"back_item":600,"type":1}`|
|2|`{"jump_func":141,"back_limit":1,"back_item":1000,"type":1}`|
|3|`{"jump_func":2856,"back_limit":1,"back_item":600,"type":1}`|
|4|`{"jump_func":2856,"back_limit":1,"back_item":1000,"type":1}`|
|5|`{"jump_func":2856,"back_limit":1,"back_item":2000,"type":1}`|
|6|`{"jump_func":2856,"back_limit":1,"back_item":3000,"type":1}`|
|7|`{"jump_func":2855,"back_limit":1,"back_item":1200,"type":1}`|
|11|`{"jump_func":38,"back_limit":1,"back_item":600,"type":2}`|
|12|`{"jump_func":141,"back_limit":1,"back_item":1000,"type":2}`|
|13|`{"jump_func":2856,"back_limit":1,"back_item":600,"type":2}`|
|14|`{"jump_func":2856,"back_limit":1,"back_item":1000,"type":2}`|
|15|`{"jump_func":2856,"back_limit":1,"back_item":2000,"type":2}`|
|16|`{"jump_func":2856,"back_limit":1,"back_item":3000,"type":2}`|
|17|`{"jump_func":3068,"back_limit":1,"back_item":1200,"type":2}`|

## Recharge

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|back_item|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|back_limit|number|5|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|type|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|acc_cnt_new|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"back_item":100,"back_limit":10,"type":1}`|
|2|`{"back_item":200,"back_limit":20,"type":1}`|
|3|`{"back_item":500,"back_limit":30,"type":1}`|
|4|`{"back_item":1000,"back_limit":40,"type":1}`|
|5|`{"back_item":8800,"back_limit":50,"type":1}`|

## Show

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|txt_rebate_tips|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|txt_rebate_title|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|txt_deposit_title|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|

## Rebate

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|back_weight|array|9|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|
|tid|number|9|本表行键；与其他表同值不自动代表同一对象。|
|back_num|array|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|have|array|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"back_weight":[1],"back_num":[100],"type":1}`|
|2|`{"back_weight":[1,30],"back_num":[100,600],"type":1}`|
|3|`{"back_weight":[1,30,50],"back_num":[100,600,3000],"type":1}`|
|4|`{"back_weight":[30,50,19],"back_num":[600,3000,6800],"type":1}`|
|5|`{"back_weight":[20,20,20],"back_num":[3000,6800,9800],"type":1}`|
|6|`{"back_weight":[20,20,20],"back_num":[6800,9800,12800],"type":1}`|
|7|`{"back_weight":[20,20,20],"back_num":[9800,12800,32800],"type":1}`|
|8|`{"back_weight":[20,20,19],"back_num":[12800,32800,64800],"type":1}`|
|9|`{"back_weight":[10,15,69],"back_num":[12800,32800,64800],"type":1}`|
