# HundredAccTable 规则参数

来源：[personal-server/assets/tables/HundredAccTable.data.lua.json.gz](../../../../personal-server/assets/tables/HundredAccTable.data.lua.json.gz)，SHA256：`2b9b2853731398e0593eacce51f47dbaf76fd309a317caba18adb5df7064178d`。

[完整逐行JSON](HundredAccTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Group](#group)|10|decoded-rows|
|[Reward](#reward)|10|decoded-rows|
|[HundredAcc](#hundredacc)|1|decoded-rows|
|[Recommend](#recommend)|7|rows-with-external-references|

## Group

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|10|本表行键；与其他表同值不自动代表同一对象。|
|amount|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

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

## Reward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|reward|array|10|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|acc_group|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|10|本表行键；与其他表同值不自动代表同一对象。|
|max_show_cnt|number|10|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|split_stamp|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bg|string|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|desc|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|get_day_index|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|desc_bg|string|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|split_reward|array|10|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|clip_name|string|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|disable_red|boolean|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"reward":[[101500,100]],"acc_group":1,"max_show_cnt":1,"get_day_index":0,"split_reward":[[101500,100]]}`|
|2|`{"reward":[[1501200,1],[101500,300]],"acc_group":2,"max_show_cnt":2,"get_day_index":0,"split_reward":[[1501200,1],[101500,300]]}`|
|3|`{"reward":[[23300504,60],[2002,10]],"acc_group":3,"max_show_cnt":2,"get_day_index":0,"split_reward":[[41200,1],[2002,10]]}`|
|4|`{"reward":[[10063200,1],[23300504,60]],"acc_group":4,"max_show_cnt":2,"get_day_index":0,"split_reward":[[10063200,1],[41200,1]]}`|
|5|`{"reward":[[200210,1],[5002002,1]],"acc_group":5,"max_show_cnt":1,"get_day_index":0,"split_reward":[[200210,1],[5002002,1]]}`|
|6|`{"reward":[[22300204,30],[23300504,120]],"acc_group":6,"max_show_cnt":1,"get_day_index":0,"split_reward":[[22300204,30],[41200,2]]}`|
|7|`{"reward":[[23300504,180],[22300204,30]],"acc_group":7,"max_show_cnt":1,"get_day_index":0,"split_reward":[[23300504,180],[22300204,30]]}`|
|8|`{"reward":[[355708,1],[627002,1]],"acc_group":8,"max_show_cnt":1,"get_day_index":0,"split_reward":[[355708,1],[627002,1]]}`|
|9|`{"reward":[[23300504,240],[400108,1]],"acc_group":9,"max_show_cnt":1,"get_day_index":0,"split_reward":[[23300504,240],[400108,1]]}`|
|10|`{"reward":[[22300204,30],[170112,1]],"acc_group":10,"max_show_cnt":1,"get_day_index":0,"split_reward":[[22300204,30],[170112,1]]}`|

## HundredAcc

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|move_day_cnt|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|normal_draw_second_wish_bubble_show_cond|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|get_way|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_entry_day|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"move_day_cnt":7,"normal_draw_second_wish_bubble_show_cond":966289600001,"show_entry_day":5}`|

## Recommend

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|param|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|has_buy_func|object|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|jump|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|7|本表行键；与其他表同值不自动代表同一对象。|
|title|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|gift|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|petmit_icon|string|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|order|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"has_buy_func":{"reference":"HundredAccMgr.IsBuyMonthCard"},"type":1}`|
|2|`{"has_buy_func":{"reference":"HundredAccMgr.IsBuyMonthCard"},"type":1}`|
|3|`{"has_buy_func":{"reference":"HundredAccMgr.IsBuyPermit"},"type":3}`|
|4|`{"has_buy_func":{"reference":"HundredAccMgr.IsBuyPermanentCard"},"type":2}`|
|5|`{"has_buy_func":{"reference":"HundredAccMgr.IsBuyPermit"},"type":3}`|
|6|`{"has_buy_func":{"reference":"HundredAccMgr.IsBuyStartGift"},"type":0}`|
|7|`{"has_buy_func":{"reference":"HundredAccMgr.IsBuyStartGift"},"type":0}`|
