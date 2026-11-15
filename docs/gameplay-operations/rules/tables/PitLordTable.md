# PitLordTable 规则参数

来源：[personal-server/assets/tables/PitLordTable.data.lua.json.gz](../../../../personal-server/assets/tables/PitLordTable.data.lua.json.gz)，SHA256：`997c2a7f78449ff046733f2e2fb3180c5063507f8075b724f43b2653d05083cf`。

[完整逐行JSON](PitLordTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[HeroShow](#heroshow)|24|decoded-rows|
|[LevelShow](#levelshow)|8|decoded-rows|
|[Level](#level)|32|decoded-rows|
|[SuggestHero](#suggesthero)|16|decoded-rows|
|[Period](#period)|1|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[RankGroup](#rankgroup)|3|decoded-rows|
|[Rank](#rank)|36|decoded-rows|
|[PitLord](#pitlord)|4|decoded-rows|
|[ProgressAward](#progressaward)|160|decoded-rows|

## HeroShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|24|本表行键；与其他表同值不自动代表同一对象。|
|asserts|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1030101|`{"asserts":254606700001}`|
|1030401|`{"asserts":254606700001}`|
|1030601|`{"asserts":778050200102}`|
|1030701|`{"asserts":41613701002}`|
|1040101|`{"asserts":955132601266}`|
|1040201|`{"asserts":955132601441}`|
|2020601|`{"asserts":254606700001}`|
|2030201|`{"asserts":254606700001}`|
|2030301|`{"asserts":254606700001}`|
|2030601|`{"asserts":983580210124}`|
|2030701|`{"asserts":778050201811}`|
|2040101|`{"asserts":955132601440}`|
|3030201|`{"asserts":254606700001}`|
|3030301|`{"asserts":254606700001}`|
|3030501|`{"asserts":254606700001}`|
|3030601|`{"asserts":254606700001}`|
|3030701|`{"asserts":647323530701}`|
|3040101|`{"asserts":983580210003}`|
|4030101|`{"asserts":254606700001}`|
|4030201|`{"asserts":254606700001}`|
|4030401|`{"asserts":254606700001}`|
|4030501|`{"asserts":254606700001}`|
|4030601|`{"asserts":778050200102}`|
|4040201|`{"asserts":154269830517}`|

## LevelShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|8|本表行键；与其他表同值不自动代表同一对象。|
|level_name|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|level_img|string|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"level_name":665401,"level_img":"img_sysl_wenzi_putong1.png"}`|
|2|`{"level_name":665402,"level_img":"img_sysl_wenzi_putong2.png"}`|
|3|`{"level_name":665403,"level_img":"img_sysl_wenzi_jiannan1.png"}`|
|4|`{"level_name":665404,"level_img":"img_sysl_wenzi_jiannan2.png"}`|
|5|`{"level_name":665405,"level_img":"img_sysl_wenzi_shishi1.png"}`|
|6|`{"level_name":665406,"level_img":"img_sysl_wenzi_shishi2.png"}`|
|7|`{"level_name":665407,"level_img":"img_sysl_wenzi_emeng.png"}`|
|8|`{"level_name":665408,"level_img":"img_sysl_wenzi_wujin.png"}`|

## Level

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|max_hp|number|32|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|lord|number|32|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|32|本表行键；与其他表同值不自动代表同一对象。|
|level_show|number|32|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_endless|boolean|32|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_tid|number|32|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{"max_hp":10000000,"level_show":1,"is_endless":false,"fight_tid":9500001}`|
|1002|`{"max_hp":20000000,"level_show":2,"is_endless":false,"fight_tid":9500002}`|
|1003|`{"max_hp":35000000,"level_show":3,"is_endless":false,"fight_tid":9500003}`|
|1004|`{"max_hp":55000000,"level_show":4,"is_endless":false,"fight_tid":9500004}`|
|1005|`{"max_hp":80000000,"level_show":5,"is_endless":false,"fight_tid":9500005}`|
|1006|`{"max_hp":130000000,"level_show":6,"is_endless":false,"fight_tid":9500006}`|
|1007|`{"max_hp":200000000,"level_show":7,"is_endless":false,"fight_tid":9500007}`|
|1008|`{"max_hp":320000000,"level_show":8,"is_endless":true,"fight_tid":9500008}`|
|2001|`{"max_hp":10000000,"level_show":1,"is_endless":false,"fight_tid":9500009}`|
|2002|`{"max_hp":20000000,"level_show":2,"is_endless":false,"fight_tid":9500010}`|
|2003|`{"max_hp":35000000,"level_show":3,"is_endless":false,"fight_tid":9500011}`|
|2004|`{"max_hp":55000000,"level_show":4,"is_endless":false,"fight_tid":9500012}`|
|2005|`{"max_hp":80000000,"level_show":5,"is_endless":false,"fight_tid":9500013}`|
|2006|`{"max_hp":130000000,"level_show":6,"is_endless":false,"fight_tid":9500014}`|
|2007|`{"max_hp":200000000,"level_show":7,"is_endless":false,"fight_tid":9500015}`|
|2008|`{"max_hp":320000000,"level_show":8,"is_endless":true,"fight_tid":9500016}`|
|3001|`{"max_hp":10000000,"level_show":1,"is_endless":false,"fight_tid":9500017}`|
|3002|`{"max_hp":20000000,"level_show":2,"is_endless":false,"fight_tid":9500018}`|
|3003|`{"max_hp":35000000,"level_show":3,"is_endless":false,"fight_tid":9500019}`|
|3004|`{"max_hp":55000000,"level_show":4,"is_endless":false,"fight_tid":9500020}`|
|3005|`{"max_hp":80000000,"level_show":5,"is_endless":false,"fight_tid":9500021}`|
|3006|`{"max_hp":130000000,"level_show":6,"is_endless":false,"fight_tid":9500022}`|
|3007|`{"max_hp":200000000,"level_show":7,"is_endless":false,"fight_tid":9500023}`|
|3008|`{"max_hp":320000000,"level_show":8,"is_endless":true,"fight_tid":9500024}`|
|4001|`{"max_hp":22000000,"level_show":1,"is_endless":false,"fight_tid":9500025}`|
|4002|`{"max_hp":44000000,"level_show":2,"is_endless":false,"fight_tid":9500026}`|
|4003|`{"max_hp":77000000,"level_show":3,"is_endless":false,"fight_tid":9500027}`|
|4004|`{"max_hp":121000000,"level_show":4,"is_endless":false,"fight_tid":9500028}`|
|4005|`{"max_hp":176000000,"level_show":5,"is_endless":false,"fight_tid":9500029}`|
|4006|`{"max_hp":286000000,"level_show":6,"is_endless":false,"fight_tid":9500030}`|
|4007|`{"max_hp":440000000,"level_show":7,"is_endless":false,"fight_tid":9500031}`|
|4008|`{"max_hp":704000000,"level_show":8,"is_endless":true,"fight_tid":9500032}`|

## SuggestHero

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|add_skill|number|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|16|本表行键；与其他表同值不自动代表同一对象。|
|suggest_hero|array|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1000|`{"add_skill":290000518,"suggest_hero":[1030101,1030401]}`|
|1001|`{"add_skill":290000518,"suggest_hero":[1030101,1030401,1040101]}`|
|1002|`{"add_skill":290000518,"suggest_hero":[1030101,1030401,1040101,1030601]}`|
|1003|`{"add_skill":290000518,"suggest_hero":[1030101,1030401,1040101,1030601,1030701,1040201]}`|
|2000|`{"add_skill":290000519,"suggest_hero":[4030501,4030401]}`|
|2001|`{"add_skill":290000519,"suggest_hero":[4030501,4030401,4030601]}`|
|2002|`{"add_skill":290000519,"suggest_hero":[4030501,4030401,4030601,4040201]}`|
|2003|`{"add_skill":290000519,"suggest_hero":[4030101,4030201,4030501,4030401,4030601,4040201]}`|
|3000|`{"add_skill":290000520,"suggest_hero":[3030501,3030601]}`|
|3001|`{"add_skill":290000520,"suggest_hero":[3030501,3030601,3030201]}`|
|3002|`{"add_skill":290000520,"suggest_hero":[3030501,3030601,3030201,3030701]}`|
|3003|`{"add_skill":290000520,"suggest_hero":[3030301,3030501,3030601,3030201,3030701,3040101]}`|
|4000|`{"add_skill":290000521,"suggest_hero":[2020601,2030301]}`|
|4001|`{"add_skill":290000521,"suggest_hero":[2020601,2030301,2030201]}`|
|4002|`{"add_skill":290000521,"suggest_hero":[2020601,2030301,2030201,2030601]}`|
|4003|`{"add_skill":290000521,"suggest_hero":[2020601,2030301,2030201,2030601,2030701,2040101]}`|

## Period

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|open_day|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|open_lord|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"open_day":0,"open_lord":[1,2,3,4]}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|cache_rank_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cache_rank|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|free_award|array|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|lord_day|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|fun_open_day|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|entry_open_day|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"cache_rank_count":100,"cache_rank":4,"free_award":[[101500,50]],"lord_day":1,"fun_open_day":3,"entry_open_day":3}`|

## RankGroup

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|open_server_day|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"open_server_day":10}`|
|2|`{"open_server_day":50}`|
|3|`{"open_server_day":9999}`|

## Rank

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rank_group|number|36|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|single_award|array|36|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award|array|36|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|award_cross|array|36|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|tid|number|36|本表行键；与其他表同值不自动代表同一对象。|
|quadruple_award_cross|array|36|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|single_award_cross|array|36|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|rank_range_cross|number|36|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|divine_award_cross|array|36|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|divine_award|array|36|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|quadruple_award|array|36|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|rank_range|number|36|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{"rank_group":1,"single_award":[[6501900,500]],"award":[[6501900,500]],"award_cross":[[476002,6],[475002,100],[474002,200]],"quadruple_award_cross":[[476002,6],[475002,100],[474002,200]],"single_award_cross":[[476002,6],[475002,100],[474002,200]],"rank_range_cross":1,"divine_award_cross":[[476002,6],[475002,100],[474002,200]],"divine_award":[[6501900,500]],"quadruple_award":[[6501900,500]],"rank_range":1}`|
|1002|`{"rank_group":1,"single_award":[[6501900,400]],"award":[[6501900,400]],"award_cross":[[476002,5],[475002,80],[474002,160]],"quadruple_award_cross":[[476002,5],[475002,80],[474002,160]],"single_award_cross":[[476002,5],[475002,80],[474002,160]],"rank_range_cross":2,"divine_award_cross":[[476002,5],[475002,80],[474002,160]],"divine_award":[[6501900,400]],"quadruple_award":[[6501900,400]],"rank_range":2}`|
|1003|`{"rank_group":1,"single_award":[[6501900,300]],"award":[[6501900,300]],"award_cross":[[476002,4],[475002,60],[474002,120]],"quadruple_award_cross":[[476002,4],[475002,60],[474002,120]],"single_award_cross":[[476002,4],[475002,60],[474002,120]],"rank_range_cross":3,"divine_award_cross":[[476002,4],[475002,60],[474002,120]],"divine_award":[[6501900,300]],"quadruple_award":[[6501900,300]],"rank_range":3}`|
|1004|`{"rank_group":1,"single_award":[[6501900,270]],"award":[[6501900,270]],"award_cross":[[476002,3],[475002,50],[474002,100]],"quadruple_award_cross":[[476002,3],[475002,50],[474002,100]],"single_award_cross":[[476002,3],[475002,50],[474002,100]],"rank_range_cross":10,"divine_award_cross":[[476002,3],[475002,50],[474002,100]],"divine_award":[[6501900,270]],"quadruple_award":[[6501900,270]],"rank_range":10}`|
|1005|`{"rank_group":1,"single_award":[[6501900,250]],"award":[[6501900,250]],"award_cross":[[475002,40],[474002,80]],"quadruple_award_cross":[[475002,40],[474002,80]],"single_award_cross":[[475002,40],[474002,80]],"rank_range_cross":20,"divine_award_cross":[[475002,40],[474002,80]],"divine_award":[[6501900,250]],"quadruple_award":[[6501900,250]],"rank_range":20}`|
|1006|`{"rank_group":1,"single_award":[[6501900,220]],"award":[[6501900,220]],"award_cross":[[475002,35],[474002,70]],"quadruple_award_cross":[[475002,35],[474002,70]],"single_award_cross":[[475002,35],[474002,70]],"rank_range_cross":50,"divine_award_cross":[[475002,35],[474002,70]],"divine_award":[[6501900,220]],"quadruple_award":[[6501900,220]],"rank_range":50}`|
|1007|`{"rank_group":1,"single_award":[[6501900,200]],"award":[[6501900,200]],"award_cross":[[475002,30],[474002,60]],"quadruple_award_cross":[[475002,30],[474002,60]],"single_award_cross":[[475002,30],[474002,60]],"rank_range_cross":100,"divine_award_cross":[[475002,30],[474002,60]],"divine_award":[[6501900,200]],"quadruple_award":[[6501900,200]],"rank_range":100}`|
|1008|`{"rank_group":1,"single_award":[[6501900,180]],"award":[[6501900,180]],"award_cross":[[474002,60]],"quadruple_award_cross":[[474002,60]],"single_award_cross":[[474002,60]],"rank_range_cross":200,"divine_award_cross":[[474002,60]],"divine_award":[[6501900,180]],"quadruple_award":[[6501900,180]],"rank_range":200}`|
|1009|`{"rank_group":1,"single_award":[[6501900,160]],"award":[[6501900,160]],"award_cross":[[474002,60]],"quadruple_award_cross":[[474002,60]],"single_award_cross":[[474002,60]],"rank_range_cross":500,"divine_award_cross":[[474002,60]],"divine_award":[[6501900,160]],"quadruple_award":[[6501900,160]],"rank_range":500}`|
|1010|`{"rank_group":1,"single_award":[[6501900,150]],"award":[[6501900,150]],"award_cross":[[474002,60]],"quadruple_award_cross":[[474002,60]],"single_award_cross":[[474002,60]],"rank_range_cross":1000,"divine_award_cross":[[474002,60]],"divine_award":[[6501900,150]],"quadruple_award":[[6501900,150]],"rank_range":1000}`|
|1011|`{"rank_group":1,"single_award":[[6501900,150]],"award":[[6501900,150]],"award_cross":[[474002,60]],"quadruple_award_cross":[[474002,60]],"single_award_cross":[[474002,60]],"rank_range_cross":2000,"divine_award_cross":[[474002,60]],"divine_award":[[6501900,150]],"quadruple_award":[[6501900,150]],"rank_range":2000}`|
|1012|`{"rank_group":1,"single_award":[[6501900,150]],"award":[[6501900,150]],"award_cross":[[474002,60]],"quadruple_award_cross":[[474002,60]],"single_award_cross":[[474002,60]],"rank_range_cross":9999,"divine_award_cross":[[474002,60]],"divine_award":[[6501900,150]],"quadruple_award":[[6501900,150]],"rank_range":9999}`|
|5001|`{"rank_group":2,"single_award":[[6501900,500]],"award":[[6501900,500]],"award_cross":[[476002,6],[475002,100],[474002,200]],"quadruple_award_cross":[[476002,6],[475002,100],[474002,200]],"single_award_cross":[[476002,6],[475002,100],[474002,200]],"rank_range_cross":1,"divine_award_cross":[[476002,6],[475002,100],[474002,200]],"divine_award":[[6501900,500]],"quadruple_award":[[6501900,500]],"rank_range":1}`|
|5002|`{"rank_group":2,"single_award":[[6501900,400]],"award":[[6501900,400]],"award_cross":[[476002,5],[475002,80],[474002,160]],"quadruple_award_cross":[[476002,5],[475002,80],[474002,160]],"single_award_cross":[[476002,5],[475002,80],[474002,160]],"rank_range_cross":2,"divine_award_cross":[[476002,5],[475002,80],[474002,160]],"divine_award":[[6501900,400]],"quadruple_award":[[6501900,400]],"rank_range":2}`|
|5003|`{"rank_group":2,"single_award":[[6501900,300]],"award":[[6501900,300]],"award_cross":[[476002,4],[475002,60],[474002,120]],"quadruple_award_cross":[[476002,4],[475002,60],[474002,120]],"single_award_cross":[[476002,4],[475002,60],[474002,120]],"rank_range_cross":3,"divine_award_cross":[[476002,4],[475002,60],[474002,120]],"divine_award":[[6501900,300]],"quadruple_award":[[6501900,300]],"rank_range":3}`|
|5004|`{"rank_group":2,"single_award":[[6501900,270]],"award":[[6501900,270]],"award_cross":[[476002,3],[475002,50],[474002,100]],"quadruple_award_cross":[[476002,3],[475002,50],[474002,100]],"single_award_cross":[[476002,3],[475002,50],[474002,100]],"rank_range_cross":10,"divine_award_cross":[[476002,3],[475002,50],[474002,100]],"divine_award":[[6501900,270]],"quadruple_award":[[6501900,270]],"rank_range":10}`|
|5005|`{"rank_group":2,"single_award":[[6501900,250]],"award":[[6501900,250]],"award_cross":[[475002,40],[474002,80]],"quadruple_award_cross":[[475002,40],[474002,80]],"single_award_cross":[[475002,40],[474002,80]],"rank_range_cross":20,"divine_award_cross":[[475002,40],[474002,80]],"divine_award":[[6501900,250]],"quadruple_award":[[6501900,250]],"rank_range":20}`|
|5006|`{"rank_group":2,"single_award":[[6501900,220]],"award":[[6501900,220]],"award_cross":[[475002,35],[474002,70]],"quadruple_award_cross":[[475002,35],[474002,70]],"single_award_cross":[[475002,35],[474002,70]],"rank_range_cross":50,"divine_award_cross":[[475002,35],[474002,70]],"divine_award":[[6501900,220]],"quadruple_award":[[6501900,220]],"rank_range":50}`|
|5007|`{"rank_group":2,"single_award":[[6501900,200]],"award":[[6501900,200]],"award_cross":[[475002,30],[474002,60]],"quadruple_award_cross":[[475002,30],[474002,60]],"single_award_cross":[[475002,30],[474002,60]],"rank_range_cross":100,"divine_award_cross":[[475002,30],[474002,60]],"divine_award":[[6501900,200]],"quadruple_award":[[6501900,200]],"rank_range":100}`|
|5008|`{"rank_group":2,"single_award":[[6501900,180]],"award":[[6501900,180]],"award_cross":[[474002,60]],"quadruple_award_cross":[[474002,60]],"single_award_cross":[[474002,60]],"rank_range_cross":200,"divine_award_cross":[[474002,60]],"divine_award":[[6501900,180]],"quadruple_award":[[6501900,180]],"rank_range":200}`|
|5009|`{"rank_group":2,"single_award":[[6501900,160]],"award":[[6501900,160]],"award_cross":[[474002,60]],"quadruple_award_cross":[[474002,60]],"single_award_cross":[[474002,60]],"rank_range_cross":500,"divine_award_cross":[[474002,60]],"divine_award":[[6501900,160]],"quadruple_award":[[6501900,160]],"rank_range":500}`|
|5010|`{"rank_group":2,"single_award":[[6501900,150]],"award":[[6501900,150]],"award_cross":[[474002,60]],"quadruple_award_cross":[[474002,60]],"single_award_cross":[[474002,60]],"rank_range_cross":1000,"divine_award_cross":[[474002,60]],"divine_award":[[6501900,150]],"quadruple_award":[[6501900,150]],"rank_range":1000}`|
|5011|`{"rank_group":2,"single_award":[[6501900,150]],"award":[[6501900,150]],"award_cross":[[474002,60]],"quadruple_award_cross":[[474002,60]],"single_award_cross":[[474002,60]],"rank_range_cross":2000,"divine_award_cross":[[474002,60]],"divine_award":[[6501900,150]],"quadruple_award":[[6501900,150]],"rank_range":2000}`|
|5012|`{"rank_group":2,"single_award":[[6501900,150]],"award":[[6501900,150]],"award_cross":[[474002,60]],"quadruple_award_cross":[[474002,60]],"single_award_cross":[[474002,60]],"rank_range_cross":9999,"divine_award_cross":[[474002,60]],"divine_award":[[6501900,150]],"quadruple_award":[[6501900,150]],"rank_range":9999}`|
|999901|`{"rank_group":3,"single_award":[[6501900,500]],"award":[[6501900,500]],"award_cross":[[476002,6],[475002,100],[474002,200]],"quadruple_award_cross":[[476002,6],[475002,100],[474002,200]],"single_award_cross":[[476002,6],[475002,100],[474002,200]],"rank_range_cross":1,"divine_award_cross":[[476002,6],[475002,100],[474002,200]],"divine_award":[[6501900,500]],"quadruple_award":[[6501900,500]],"rank_range":1}`|
|999902|`{"rank_group":3,"single_award":[[6501900,400]],"award":[[6501900,400]],"award_cross":[[476002,5],[475002,80],[474002,160]],"quadruple_award_cross":[[476002,5],[475002,80],[474002,160]],"single_award_cross":[[476002,5],[475002,80],[474002,160]],"rank_range_cross":2,"divine_award_cross":[[476002,5],[475002,80],[474002,160]],"divine_award":[[6501900,400]],"quadruple_award":[[6501900,400]],"rank_range":2}`|
|999903|`{"rank_group":3,"single_award":[[6501900,300]],"award":[[6501900,300]],"award_cross":[[476002,4],[475002,60],[474002,120]],"quadruple_award_cross":[[476002,4],[475002,60],[474002,120]],"single_award_cross":[[476002,4],[475002,60],[474002,120]],"rank_range_cross":3,"divine_award_cross":[[476002,4],[475002,60],[474002,120]],"divine_award":[[6501900,300]],"quadruple_award":[[6501900,300]],"rank_range":3}`|
|999904|`{"rank_group":3,"single_award":[[6501900,270]],"award":[[6501900,270]],"award_cross":[[476002,3],[475002,50],[474002,100]],"quadruple_award_cross":[[476002,3],[475002,50],[474002,100]],"single_award_cross":[[476002,3],[475002,50],[474002,100]],"rank_range_cross":10,"divine_award_cross":[[476002,3],[475002,50],[474002,100]],"divine_award":[[6501900,270]],"quadruple_award":[[6501900,270]],"rank_range":10}`|
|999905|`{"rank_group":3,"single_award":[[6501900,250]],"award":[[6501900,250]],"award_cross":[[475002,40],[474002,80]],"quadruple_award_cross":[[475002,40],[474002,80]],"single_award_cross":[[475002,40],[474002,80]],"rank_range_cross":20,"divine_award_cross":[[475002,40],[474002,80]],"divine_award":[[6501900,250]],"quadruple_award":[[6501900,250]],"rank_range":20}`|
|999906|`{"rank_group":3,"single_award":[[6501900,220]],"award":[[6501900,220]],"award_cross":[[475002,35],[474002,70]],"quadruple_award_cross":[[475002,35],[474002,70]],"single_award_cross":[[475002,35],[474002,70]],"rank_range_cross":50,"divine_award_cross":[[475002,35],[474002,70]],"divine_award":[[6501900,220]],"quadruple_award":[[6501900,220]],"rank_range":50}`|
|999907|`{"rank_group":3,"single_award":[[6501900,200]],"award":[[6501900,200]],"award_cross":[[475002,30],[474002,60]],"quadruple_award_cross":[[475002,30],[474002,60]],"single_award_cross":[[475002,30],[474002,60]],"rank_range_cross":100,"divine_award_cross":[[475002,30],[474002,60]],"divine_award":[[6501900,200]],"quadruple_award":[[6501900,200]],"rank_range":100}`|
|999908|`{"rank_group":3,"single_award":[[6501900,180]],"award":[[6501900,180]],"award_cross":[[474002,60]],"quadruple_award_cross":[[474002,60]],"single_award_cross":[[474002,60]],"rank_range_cross":200,"divine_award_cross":[[474002,60]],"divine_award":[[6501900,180]],"quadruple_award":[[6501900,180]],"rank_range":200}`|
|999909|`{"rank_group":3,"single_award":[[6501900,160]],"award":[[6501900,160]],"award_cross":[[474002,60]],"quadruple_award_cross":[[474002,60]],"single_award_cross":[[474002,60]],"rank_range_cross":500,"divine_award_cross":[[474002,60]],"divine_award":[[6501900,160]],"quadruple_award":[[6501900,160]],"rank_range":500}`|
|999910|`{"rank_group":3,"single_award":[[6501900,150]],"award":[[6501900,150]],"award_cross":[[474002,60]],"quadruple_award_cross":[[474002,60]],"single_award_cross":[[474002,60]],"rank_range_cross":1000,"divine_award_cross":[[474002,60]],"divine_award":[[6501900,150]],"quadruple_award":[[6501900,150]],"rank_range":1000}`|
|999911|`{"rank_group":3,"single_award":[[6501900,150]],"award":[[6501900,150]],"award_cross":[[474002,60]],"quadruple_award_cross":[[474002,60]],"single_award_cross":[[474002,60]],"rank_range_cross":2000,"divine_award_cross":[[474002,60]],"divine_award":[[6501900,150]],"quadruple_award":[[6501900,150]],"rank_range":2000}`|
|999912|`{"rank_group":3,"single_award":[[6501900,150]],"award":[[6501900,150]],"award_cross":[[474002,60]],"quadruple_award_cross":[[474002,60]],"single_award_cross":[[474002,60]],"rank_range_cross":9999,"divine_award_cross":[[474002,60]],"divine_award":[[6501900,150]],"quadruple_award":[[6501900,150]],"rank_range":9999}`|

## PitLord

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|scale|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skills|array|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bg_fore_loc|undefined|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tag_icon|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_bg_fore|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|desc|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|suggest_desc|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|head_icon|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|strategy_icon|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bg_prefab|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_bg|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|introduce_desc|array|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_entrance|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|bg|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_nick_name|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"skills":[290000301,290000302,290000303],"strategy_icon":"img_sysl_bosska_qianyuanzhimu.png"}`|
|2|`{"skills":[290000401,290000402,290000403],"strategy_icon":"img_sysl_bosska_nushaduotouxi.png"}`|
|3|`{"skills":[290000201,290000202,290000203],"strategy_icon":"img_sysl_bosska_ronghuoyanmo.png"}`|
|4|`{"skills":[290000101,290000102,290000103],"strategy_icon":"img_sysl_bosska_huangyuanhaoxiaozhe.png"}`|

## ProgressAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|160|本表行键；与其他表同值不自动代表同一对象。|
|damage_value|number|160|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|160|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|level|number|160|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|100101|`{"damage_value":2000000,"award":[[3451200,10]],"level":1001}`|
|100102|`{"damage_value":4000000,"award":[[3451200,10]],"level":1001}`|
|100103|`{"damage_value":6000000,"award":[[3451200,10]],"level":1001}`|
|100104|`{"damage_value":8000000,"award":[[3451200,10]],"level":1001}`|
|100105|`{"damage_value":10000000,"award":[[3451200,20]],"level":1001}`|
|100201|`{"damage_value":4000000,"award":[[3451200,10]],"level":1002}`|
|100202|`{"damage_value":8000000,"award":[[3451200,10]],"level":1002}`|
|100203|`{"damage_value":12000000,"award":[[3451200,10]],"level":1002}`|
|100204|`{"damage_value":16000000,"award":[[3451200,10]],"level":1002}`|
|100205|`{"damage_value":20000000,"award":[[3451200,20]],"level":1002}`|
|100301|`{"damage_value":7000000,"award":[[3451200,10]],"level":1003}`|
|100302|`{"damage_value":14000000,"award":[[3451200,10]],"level":1003}`|
|100303|`{"damage_value":21000000,"award":[[3451200,10]],"level":1003}`|
|100304|`{"damage_value":28000000,"award":[[3451200,10]],"level":1003}`|
|100305|`{"damage_value":35000000,"award":[[3451200,20]],"level":1003}`|
|100401|`{"damage_value":11000000,"award":[[3451200,10]],"level":1004}`|
|100402|`{"damage_value":22000000,"award":[[3451200,10]],"level":1004}`|
|100403|`{"damage_value":33000000,"award":[[3451200,10]],"level":1004}`|
|100404|`{"damage_value":44000000,"award":[[3451200,10]],"level":1004}`|
|100405|`{"damage_value":55000000,"award":[[3451200,20]],"level":1004}`|
|100501|`{"damage_value":16000000,"award":[[474002,20]],"level":1005}`|
|100502|`{"damage_value":32000000,"award":[[474002,20]],"level":1005}`|
|100503|`{"damage_value":48000000,"award":[[474002,20]],"level":1005}`|
|100504|`{"damage_value":64000000,"award":[[475002,10]],"level":1005}`|
|100505|`{"damage_value":80000000,"award":[[475002,10]],"level":1005}`|
|100601|`{"damage_value":26000000,"award":[[474002,30]],"level":1006}`|
|100602|`{"damage_value":52000000,"award":[[474002,30]],"level":1006}`|
|100603|`{"damage_value":78000000,"award":[[475002,15]],"level":1006}`|
|100604|`{"damage_value":104000000,"award":[[475002,15]],"level":1006}`|
|100605|`{"damage_value":130000000,"award":[[476002,5]],"level":1006}`|
|100701|`{"damage_value":40000000,"award":[[474002,40]],"level":1007}`|
|100702|`{"damage_value":80000000,"award":[[474002,40]],"level":1007}`|
|100703|`{"damage_value":120000000,"award":[[475002,20]],"level":1007}`|
|100704|`{"damage_value":160000000,"award":[[475002,20]],"level":1007}`|
|100705|`{"damage_value":200000000,"award":[[476002,5]],"level":1007}`|
|100801|`{"damage_value":64000000,"award":[[474002,50]],"level":1008}`|
|100802|`{"damage_value":128000000,"award":[[474002,50]],"level":1008}`|
|100803|`{"damage_value":192000000,"award":[[475002,25]],"level":1008}`|
|100804|`{"damage_value":256000000,"award":[[475002,25]],"level":1008}`|
|100805|`{"damage_value":320000000,"award":[[476002,5]],"level":1008}`|
|200101|`{"damage_value":2000000,"award":[[3701200,10]],"level":2001}`|
|200102|`{"damage_value":4000000,"award":[[3701200,10]],"level":2001}`|
|200103|`{"damage_value":6000000,"award":[[3701200,10]],"level":2001}`|
|200104|`{"damage_value":8000000,"award":[[3701200,10]],"level":2001}`|
|200105|`{"damage_value":10000000,"award":[[3701200,20]],"level":2001}`|
|200201|`{"damage_value":4000000,"award":[[3701200,10]],"level":2002}`|
|200202|`{"damage_value":8000000,"award":[[3701200,10]],"level":2002}`|
|200203|`{"damage_value":12000000,"award":[[3701200,10]],"level":2002}`|
|200204|`{"damage_value":16000000,"award":[[3701200,10]],"level":2002}`|
|200205|`{"damage_value":20000000,"award":[[3701200,20]],"level":2002}`|
|200301|`{"damage_value":7000000,"award":[[3701200,10]],"level":2003}`|
|200302|`{"damage_value":14000000,"award":[[3701200,10]],"level":2003}`|
|200303|`{"damage_value":21000000,"award":[[3701200,10]],"level":2003}`|
|200304|`{"damage_value":28000000,"award":[[3701200,10]],"level":2003}`|
|200305|`{"damage_value":35000000,"award":[[3701200,20]],"level":2003}`|
|200401|`{"damage_value":11000000,"award":[[3701200,10]],"level":2004}`|
|200402|`{"damage_value":22000000,"award":[[3701200,10]],"level":2004}`|
|200403|`{"damage_value":33000000,"award":[[3701200,10]],"level":2004}`|
|200404|`{"damage_value":44000000,"award":[[3701200,10]],"level":2004}`|
|200405|`{"damage_value":55000000,"award":[[3701200,20]],"level":2004}`|
|200501|`{"damage_value":16000000,"award":[[474002,20]],"level":2005}`|
|200502|`{"damage_value":32000000,"award":[[474002,20]],"level":2005}`|
|200503|`{"damage_value":48000000,"award":[[474002,20]],"level":2005}`|
|200504|`{"damage_value":64000000,"award":[[475002,10]],"level":2005}`|
|200505|`{"damage_value":80000000,"award":[[475002,10]],"level":2005}`|
|200601|`{"damage_value":26000000,"award":[[474002,30]],"level":2006}`|
|200602|`{"damage_value":52000000,"award":[[474002,30]],"level":2006}`|
|200603|`{"damage_value":78000000,"award":[[475002,15]],"level":2006}`|
|200604|`{"damage_value":104000000,"award":[[475002,15]],"level":2006}`|
|200605|`{"damage_value":130000000,"award":[[476002,5]],"level":2006}`|
|200701|`{"damage_value":40000000,"award":[[474002,40]],"level":2007}`|
|200702|`{"damage_value":80000000,"award":[[474002,40]],"level":2007}`|
|200703|`{"damage_value":120000000,"award":[[475002,20]],"level":2007}`|
|200704|`{"damage_value":160000000,"award":[[475002,20]],"level":2007}`|
|200705|`{"damage_value":200000000,"award":[[476002,5]],"level":2007}`|
|200801|`{"damage_value":64000000,"award":[[474002,50]],"level":2008}`|
|200802|`{"damage_value":128000000,"award":[[474002,50]],"level":2008}`|
|200803|`{"damage_value":192000000,"award":[[475002,25]],"level":2008}`|
|200804|`{"damage_value":256000000,"award":[[475002,25]],"level":2008}`|
|200805|`{"damage_value":320000000,"award":[[476002,5]],"level":2008}`|
|300101|`{"damage_value":2000000,"award":[[3471200,10]],"level":3001}`|
|300102|`{"damage_value":4000000,"award":[[3471200,10]],"level":3001}`|
|300103|`{"damage_value":6000000,"award":[[3471200,10]],"level":3001}`|
|300104|`{"damage_value":8000000,"award":[[3471200,10]],"level":3001}`|
|300105|`{"damage_value":10000000,"award":[[3471200,20]],"level":3001}`|
|300201|`{"damage_value":4000000,"award":[[3471200,10]],"level":3002}`|
|300202|`{"damage_value":8000000,"award":[[3471200,10]],"level":3002}`|
|300203|`{"damage_value":12000000,"award":[[3471200,10]],"level":3002}`|
|300204|`{"damage_value":16000000,"award":[[3471200,10]],"level":3002}`|
|300205|`{"damage_value":20000000,"award":[[3471200,20]],"level":3002}`|
|300301|`{"damage_value":7000000,"award":[[3471200,10]],"level":3003}`|
|300302|`{"damage_value":14000000,"award":[[3471200,10]],"level":3003}`|
|300303|`{"damage_value":21000000,"award":[[3471200,10]],"level":3003}`|
|300304|`{"damage_value":28000000,"award":[[3471200,10]],"level":3003}`|
|300305|`{"damage_value":35000000,"award":[[3471200,20]],"level":3003}`|
|300401|`{"damage_value":11000000,"award":[[3471200,10]],"level":3004}`|
|300402|`{"damage_value":22000000,"award":[[3471200,10]],"level":3004}`|
|300403|`{"damage_value":33000000,"award":[[3471200,10]],"level":3004}`|
|300404|`{"damage_value":44000000,"award":[[3471200,10]],"level":3004}`|
|300405|`{"damage_value":55000000,"award":[[3471200,20]],"level":3004}`|
|300501|`{"damage_value":16000000,"award":[[474002,20]],"level":3005}`|
|300502|`{"damage_value":32000000,"award":[[474002,20]],"level":3005}`|
|300503|`{"damage_value":48000000,"award":[[474002,20]],"level":3005}`|
|300504|`{"damage_value":64000000,"award":[[475002,10]],"level":3005}`|
|300505|`{"damage_value":80000000,"award":[[475002,10]],"level":3005}`|
|300601|`{"damage_value":26000000,"award":[[474002,30]],"level":3006}`|
|300602|`{"damage_value":52000000,"award":[[474002,30]],"level":3006}`|
|300603|`{"damage_value":78000000,"award":[[475002,15]],"level":3006}`|
|300604|`{"damage_value":104000000,"award":[[475002,15]],"level":3006}`|
|300605|`{"damage_value":130000000,"award":[[476002,5]],"level":3006}`|
|300701|`{"damage_value":40000000,"award":[[474002,40]],"level":3007}`|
|300702|`{"damage_value":80000000,"award":[[474002,40]],"level":3007}`|
|300703|`{"damage_value":120000000,"award":[[475002,20]],"level":3007}`|
|300704|`{"damage_value":160000000,"award":[[475002,20]],"level":3007}`|
|300705|`{"damage_value":200000000,"award":[[476002,5]],"level":3007}`|
|300801|`{"damage_value":64000000,"award":[[474002,50]],"level":3008}`|
|300802|`{"damage_value":128000000,"award":[[474002,50]],"level":3008}`|
|300803|`{"damage_value":192000000,"award":[[475002,25]],"level":3008}`|
|300804|`{"damage_value":256000000,"award":[[475002,25]],"level":3008}`|
|300805|`{"damage_value":320000000,"award":[[476002,5]],"level":3008}`|
|400101|`{"damage_value":4400000,"award":[[3461200,10]],"level":4001}`|
|400102|`{"damage_value":8800000,"award":[[3461200,10]],"level":4001}`|
|400103|`{"damage_value":13200000,"award":[[3461200,10]],"level":4001}`|
|400104|`{"damage_value":17600000,"award":[[3461200,10]],"level":4001}`|
|400105|`{"damage_value":22000000,"award":[[3461200,20]],"level":4001}`|
|400201|`{"damage_value":8800000,"award":[[3461200,10]],"level":4002}`|
|400202|`{"damage_value":17600000,"award":[[3461200,10]],"level":4002}`|
|400203|`{"damage_value":26400000,"award":[[3461200,10]],"level":4002}`|
|400204|`{"damage_value":35200000,"award":[[3461200,10]],"level":4002}`|
|400205|`{"damage_value":44000000,"award":[[3461200,20]],"level":4002}`|
|400301|`{"damage_value":15400000,"award":[[3461200,10]],"level":4003}`|
|400302|`{"damage_value":30800000,"award":[[3461200,10]],"level":4003}`|
|400303|`{"damage_value":46200000,"award":[[3461200,10]],"level":4003}`|
|400304|`{"damage_value":61600000,"award":[[3461200,10]],"level":4003}`|
|400305|`{"damage_value":77000000,"award":[[3461200,20]],"level":4003}`|
|400401|`{"damage_value":24200000,"award":[[3461200,10]],"level":4004}`|
|400402|`{"damage_value":48400000,"award":[[3461200,10]],"level":4004}`|
|400403|`{"damage_value":72600000,"award":[[3461200,10]],"level":4004}`|
|400404|`{"damage_value":96800000,"award":[[3461200,10]],"level":4004}`|
|400405|`{"damage_value":121000000,"award":[[3461200,20]],"level":4004}`|
|400501|`{"damage_value":35200000,"award":[[474002,20]],"level":4005}`|
|400502|`{"damage_value":70400000,"award":[[474002,20]],"level":4005}`|
|400503|`{"damage_value":105600000,"award":[[474002,20]],"level":4005}`|
|400504|`{"damage_value":140800000,"award":[[475002,10]],"level":4005}`|
|400505|`{"damage_value":176000000,"award":[[475002,10]],"level":4005}`|
|400601|`{"damage_value":57200000,"award":[[474002,30]],"level":4006}`|
|400602|`{"damage_value":114400000,"award":[[474002,30]],"level":4006}`|
|400603|`{"damage_value":171600000,"award":[[475002,15]],"level":4006}`|
|400604|`{"damage_value":228800000,"award":[[475002,15]],"level":4006}`|
|400605|`{"damage_value":286000000,"award":[[476002,5]],"level":4006}`|
|400701|`{"damage_value":88000000,"award":[[474002,40]],"level":4007}`|
|400702|`{"damage_value":176000000,"award":[[474002,40]],"level":4007}`|
|400703|`{"damage_value":264000000,"award":[[475002,20]],"level":4007}`|
|400704|`{"damage_value":352000000,"award":[[475002,20]],"level":4007}`|
|400705|`{"damage_value":440000000,"award":[[476002,5]],"level":4007}`|
|400801|`{"damage_value":140800000,"award":[[474002,50]],"level":4008}`|
|400802|`{"damage_value":281600000,"award":[[474002,50]],"level":4008}`|
|400803|`{"damage_value":422400000,"award":[[475002,25]],"level":4008}`|
|400804|`{"damage_value":563200000,"award":[[475002,25]],"level":4008}`|
|400805|`{"damage_value":704000000,"award":[[476002,5]],"level":4008}`|
