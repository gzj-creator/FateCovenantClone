# CapsuleToyTable 规则参数

来源：[personal-server/assets/tables/CapsuleToyTable.data.lua.json.gz](../../../../personal-server/assets/tables/CapsuleToyTable.data.lua.json.gz)，SHA256：`6613a266f26d2bc9e78236f01f5b4aab9942774844cb5e62e61113cd7a06930e`。

[完整逐行JSON](CapsuleToyTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[ExchangeCombine](#exchangecombine)|18|decoded-rows|
|[ExchangePreview](#exchangepreview)|6|decoded-rows|
|[ExchangeGroup](#exchangegroup)|3|decoded-rows|
|[Exchange](#exchange)|30|decoded-rows|
|[PoolOutput](#pooloutput)|36|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[Rank](#rank)|1|decoded-rows|
|[Collect](#collect)|9|decoded-rows|
|[Version](#version)|1|decoded-rows|
|[Gift](#gift)|6|decoded-rows|
|[Type](#type)|6|decoded-rows|
|[Color](#color)|4|decoded-rows|
|[CapsuleToy](#capsuletoy)|24|decoded-rows|

## ExchangeCombine

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|limit_text|number|18|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|tid|number|18|本表行键；与其他表同值不自动代表同一对象。|
|icon|string|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|toy|array|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|desc|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"limit_text":0}`|
|2|`{"limit_text":0}`|
|3|`{"limit_text":678554}`|
|4|`{"limit_text":678554}`|
|5|`{"limit_text":678554}`|
|6|`{"limit_text":678554}`|
|7|`{"limit_text":0}`|
|8|`{"limit_text":0}`|
|9|`{"limit_text":678554}`|
|10|`{"limit_text":678554}`|
|11|`{"limit_text":678554}`|
|12|`{"limit_text":678554}`|
|13|`{"limit_text":0}`|
|14|`{"limit_text":0}`|
|15|`{"limit_text":678554}`|
|16|`{"limit_text":678554}`|
|17|`{"limit_text":678554}`|
|18|`{"limit_text":678554}`|

## ExchangePreview

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|award_num|array|6|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|belong_group|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"award_num":[[101500,30000]],"belong_group":1}`|
|102|`{"award_num":[[101500,6000]],"belong_group":1}`|
|103|`{"award_num":[[101500,30000]],"belong_group":2}`|
|104|`{"award_num":[[101500,6000]],"belong_group":2}`|
|105|`{"award_num":[[101500,30000]],"belong_group":3}`|
|106|`{"award_num":[[101500,6000]],"belong_group":3}`|

## ExchangeGroup

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|

## Exchange

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|30|本表行键；与其他表同值不自动代表同一对象。|
|priority|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|notice|boolean|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_num|array|30|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|group|array|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|num|array|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|limit|number|30|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|belong_group|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"award_num":[[101500,30000]],"group":[1,1],"num":[1,1],"limit":1,"belong_group":1}`|
|102|`{"award_num":[[101500,6000]],"group":[2,4],"num":[1,1],"limit":1,"belong_group":1}`|
|103|`{"award_num":[[101500,5700]],"group":[2,5],"num":[1,1],"limit":1,"belong_group":1}`|
|104|`{"award_num":[[101500,5500]],"group":[2,6],"num":[1,1],"limit":1,"belong_group":1}`|
|105|`{"award_num":[[101500,600]],"group":[3,4,6],"num":[1,1,1],"limit":2,"belong_group":1}`|
|106|`{"award_num":[[101500,450]],"group":[3,5,5],"num":[1,1,1],"limit":2,"belong_group":1}`|
|107|`{"award_num":[[101500,300]],"group":[4,5,5],"num":[1,1,1],"limit":2,"belong_group":1}`|
|108|`{"award_num":[[101500,250]],"group":[4,6,6],"num":[1,1,1],"limit":3,"belong_group":1}`|
|109|`{"award_num":[[101500,50]],"group":[5,6,6],"num":[1,1,1],"limit":3,"belong_group":1}`|
|110|`{"award_num":[[101500,30]],"group":[6,6,6],"num":[1,1,1],"limit":2,"belong_group":1}`|
|111|`{"award_num":[[101500,30000]],"group":[7,7],"num":[1,1],"limit":1,"belong_group":2}`|
|112|`{"award_num":[[101500,6000]],"group":[8,10],"num":[1,1],"limit":1,"belong_group":2}`|
|113|`{"award_num":[[101500,5700]],"group":[8,11],"num":[1,1],"limit":1,"belong_group":2}`|
|114|`{"award_num":[[101500,5500]],"group":[8,12],"num":[1,1],"limit":1,"belong_group":2}`|
|115|`{"award_num":[[101500,600]],"group":[9,10,12],"num":[1,1,1],"limit":2,"belong_group":2}`|
|116|`{"award_num":[[101500,450]],"group":[9,11,11],"num":[1,1,1],"limit":2,"belong_group":2}`|
|117|`{"award_num":[[101500,300]],"group":[10,11,11],"num":[1,1,1],"limit":2,"belong_group":2}`|
|118|`{"award_num":[[101500,250]],"group":[10,12,12],"num":[1,1,1],"limit":3,"belong_group":2}`|
|119|`{"award_num":[[101500,50]],"group":[11,12,12],"num":[1,1,1],"limit":3,"belong_group":2}`|
|120|`{"award_num":[[101500,30]],"group":[12,12,12],"num":[1,1,1],"limit":2,"belong_group":2}`|
|121|`{"award_num":[[101500,30000]],"group":[13,13],"num":[1,1],"limit":1,"belong_group":3}`|
|122|`{"award_num":[[101500,6000]],"group":[14,16],"num":[1,1],"limit":1,"belong_group":3}`|
|123|`{"award_num":[[101500,5700]],"group":[14,17],"num":[1,1],"limit":1,"belong_group":3}`|
|124|`{"award_num":[[101500,5500]],"group":[14,18],"num":[1,1],"limit":1,"belong_group":3}`|
|125|`{"award_num":[[101500,600]],"group":[15,16,18],"num":[1,1,1],"limit":2,"belong_group":3}`|
|126|`{"award_num":[[101500,450]],"group":[15,17,17],"num":[1,1,1],"limit":2,"belong_group":3}`|
|127|`{"award_num":[[101500,300]],"group":[16,17,17],"num":[1,1,1],"limit":2,"belong_group":3}`|
|128|`{"award_num":[[101500,250]],"group":[16,18,18],"num":[1,1,1],"limit":3,"belong_group":3}`|
|129|`{"award_num":[[101500,50]],"group":[17,18,18],"num":[1,1,1],"limit":3,"belong_group":3}`|
|130|`{"award_num":[[101500,30]],"group":[18,18,18],"num":[1,1,1],"limit":2,"belong_group":3}`|

## PoolOutput

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|36|本表行键；与其他表同值不自动代表同一对象。|
|num|number|36|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|toy|number|36|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pool|number|36|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"num":3,"pool":1}`|
|2|`{"num":2,"pool":1}`|
|3|`{"num":4,"pool":1}`|
|4|`{"num":2,"pool":1}`|
|5|`{"num":4,"pool":1}`|
|6|`{"num":2,"pool":1}`|
|7|`{"num":7,"pool":1}`|
|8|`{"num":4,"pool":1}`|
|9|`{"num":7,"pool":1}`|
|10|`{"num":4,"pool":1}`|
|11|`{"num":7,"pool":1}`|
|12|`{"num":4,"pool":1}`|
|13|`{"num":3,"pool":2}`|
|14|`{"num":2,"pool":2}`|
|15|`{"num":4,"pool":2}`|
|16|`{"num":2,"pool":2}`|
|17|`{"num":4,"pool":2}`|
|18|`{"num":2,"pool":2}`|
|19|`{"num":7,"pool":2}`|
|20|`{"num":4,"pool":2}`|
|21|`{"num":7,"pool":2}`|
|22|`{"num":4,"pool":2}`|
|23|`{"num":7,"pool":2}`|
|24|`{"num":4,"pool":2}`|
|25|`{"num":3,"pool":3}`|
|26|`{"num":2,"pool":3}`|
|27|`{"num":4,"pool":3}`|
|28|`{"num":2,"pool":3}`|
|29|`{"num":4,"pool":3}`|
|30|`{"num":2,"pool":3}`|
|31|`{"num":7,"pool":3}`|
|32|`{"num":4,"pool":3}`|
|33|`{"num":7,"pool":3}`|
|34|`{"num":4,"pool":3}`|
|35|`{"num":7,"pool":3}`|
|36|`{"num":4,"pool":3}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|draw_cost_item|number|1|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|unlock_multi_draw|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|recycle_item|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|exchange_big_num|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|multi_draw_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|collect_value|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|draw_limit_num|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|recycle_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|draw_cost_num|number|1|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"draw_cost_item":707002,"unlock_multi_draw":10,"recycle_item":101500,"exchange_big_num":1500,"multi_draw_count":5,"collect_value":708002,"draw_limit_num":20,"recycle_count":10,"draw_cost_num":1}`|

## Rank

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|rank_id|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|162|`{"rank_id":229}`|

## Collect

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|9|本表行键；与其他表同值不自动代表同一对象。|
|collect_count|number|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_item|number|9|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award_count|number|9|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"collect_count":50,"award_item":101500,"award_count":50}`|
|2|`{"collect_count":100,"award_item":101500,"award_count":100}`|
|3|`{"collect_count":150,"award_item":101500,"award_count":200}`|
|4|`{"collect_count":200,"award_item":101500,"award_count":300}`|
|5|`{"collect_count":300,"award_item":101500,"award_count":400}`|
|6|`{"collect_count":450,"award_item":101500,"award_count":600}`|
|7|`{"collect_count":600,"award_item":101500,"award_count":800}`|
|8|`{"collect_count":800,"award_item":101500,"award_count":1000}`|
|9|`{"collect_count":1000,"award_item":207808,"award_count":1}`|

## Version

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|exchange|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pool|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"exchange":[1,2,3],"pool":[1,2,3]}`|

## Gift

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|version|number|6|版本引用；必须按活动类型及其消费者查对应版本表。|
|gift|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"version":1}`|
|102|`{"version":1}`|
|103|`{"version":1}`|
|104|`{"version":1}`|
|105|`{"version":1}`|
|106|`{"version":1}`|

## Type

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|item_tid|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"item_tid":683002}`|
|2|`{"item_tid":687002}`|
|3|`{"item_tid":691002}`|
|4|`{"item_tid":695002}`|
|5|`{"item_tid":699002}`|
|6|`{"item_tid":703002}`|

## Color

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|

## CapsuleToy

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|collect_item|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|collect_count|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|recycle_item|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|color|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|24|本表行键；与其他表同值不自动代表同一对象。|
|recycle_count|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|683002|`{"collect_item":708002,"collect_count":80,"recycle_item":101500,"type":1,"recycle_count":1500}`|
|684002|`{"collect_item":708002,"collect_count":140,"recycle_item":101500,"type":1,"recycle_count":2000}`|
|685002|`{"collect_item":708002,"collect_count":140,"recycle_item":101500,"type":1,"recycle_count":2000}`|
|686002|`{"collect_item":708002,"collect_count":140,"recycle_item":101500,"type":1,"recycle_count":2000}`|
|687002|`{"collect_item":708002,"collect_count":25,"recycle_item":101500,"type":2,"recycle_count":120}`|
|688002|`{"collect_item":708002,"collect_count":50,"recycle_item":101500,"type":2,"recycle_count":240}`|
|689002|`{"collect_item":708002,"collect_count":50,"recycle_item":101500,"type":2,"recycle_count":240}`|
|690002|`{"collect_item":708002,"collect_count":50,"recycle_item":101500,"type":2,"recycle_count":240}`|
|691002|`{"collect_item":708002,"collect_count":25,"recycle_item":101500,"type":3,"recycle_count":120}`|
|692002|`{"collect_item":708002,"collect_count":50,"recycle_item":101500,"type":3,"recycle_count":240}`|
|693002|`{"collect_item":708002,"collect_count":50,"recycle_item":101500,"type":3,"recycle_count":240}`|
|694002|`{"collect_item":708002,"collect_count":50,"recycle_item":101500,"type":3,"recycle_count":240}`|
|695002|`{"collect_item":708002,"collect_count":5,"recycle_item":101500,"type":4,"recycle_count":8}`|
|696002|`{"collect_item":708002,"collect_count":15,"recycle_item":101500,"type":4,"recycle_count":16}`|
|697002|`{"collect_item":708002,"collect_count":15,"recycle_item":101500,"type":4,"recycle_count":16}`|
|698002|`{"collect_item":708002,"collect_count":15,"recycle_item":101500,"type":4,"recycle_count":16}`|
|699002|`{"collect_item":708002,"collect_count":5,"recycle_item":101500,"type":5,"recycle_count":8}`|
|700002|`{"collect_item":708002,"collect_count":15,"recycle_item":101500,"type":5,"recycle_count":16}`|
|701002|`{"collect_item":708002,"collect_count":15,"recycle_item":101500,"type":5,"recycle_count":16}`|
|702002|`{"collect_item":708002,"collect_count":15,"recycle_item":101500,"type":5,"recycle_count":16}`|
|703002|`{"collect_item":708002,"collect_count":5,"recycle_item":101500,"type":6,"recycle_count":8}`|
|704002|`{"collect_item":708002,"collect_count":15,"recycle_item":101500,"type":6,"recycle_count":16}`|
|705002|`{"collect_item":708002,"collect_count":15,"recycle_item":101500,"type":6,"recycle_count":16}`|
|706002|`{"collect_item":708002,"collect_count":15,"recycle_item":101500,"type":6,"recycle_count":16}`|
