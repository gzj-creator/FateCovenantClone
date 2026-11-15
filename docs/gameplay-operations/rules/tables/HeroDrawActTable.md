# HeroDrawActTable 规则参数

来源：[personal-server/assets/tables/HeroDrawActTable.data.lua.json.gz](../../../../personal-server/assets/tables/HeroDrawActTable.data.lua.json.gz)，SHA256：`48d954e29bde34514ec4482f48f3a57d2149767347a1c01091f89b40cf8ac2fc`。

[完整逐行JSON](HeroDrawActTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[GenreRank](#genrerank)|4|decoded-rows|
|[Task](#task)|34|decoded-rows|
|[TaskType](#tasktype)|3|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[RankReward](#rankreward)|40|decoded-rows|
|[Gift](#gift)|1|decoded-rows|

## GenreRank

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|genre_team|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|rank_id|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"rank_id":180}`|
|2|`{"rank_id":181}`|
|3|`{"rank_id":182}`|
|4|`{"rank_id":183}`|

## Task

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|34|本表行键；与其他表同值不自动代表同一对象。|
|award_list|array|34|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|task_type|number|34|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_value|number|34|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|version|number|34|版本引用；必须按活动类型及其消费者查对应版本表。|
|des|number|34|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award_list":[[101500,100]],"task_type":1,"task_value":100,"version":1}`|
|2|`{"award_list":[[17002,300]],"task_type":1,"task_value":150,"version":1}`|
|3|`{"award_list":[[391002,250]],"task_type":1,"task_value":200,"version":1}`|
|4|`{"award_list":[[33002,5]],"task_type":1,"task_value":250,"version":1}`|
|5|`{"award_list":[[18002,15]],"task_type":1,"task_value":300,"version":1}`|
|6|`{"award_list":[[19002,1]],"task_type":1,"task_value":350,"version":1}`|
|7|`{"award_list":[[200110,1]],"task_type":1,"task_value":400,"version":1}`|
|8|`{"award_list":[[392002,10]],"task_type":1,"task_value":450,"version":1}`|
|9|`{"award_list":[[1221200,1]],"task_type":1,"task_value":500,"version":1}`|
|10|`{"award_list":[[22002,1]],"task_type":1,"task_value":600,"version":1}`|
|11|`{"award_list":[[1321200,1]],"task_type":1,"task_value":800,"version":1}`|
|12|`{"award_list":[[22002,1]],"task_type":1,"task_value":1000,"version":1}`|
|13|`{"award_list":[[1221200,1]],"task_type":1,"task_value":1200,"version":1}`|
|14|`{"award_list":[[1321200,1]],"task_type":1,"task_value":1400,"version":1}`|
|15|`{"award_list":[[1321200,1]],"task_type":1,"task_value":1700,"version":1}`|
|16|`{"award_list":[[1221200,1]],"task_type":1,"task_value":2000,"version":1}`|
|17|`{"award_list":[[179002,100]],"task_type":2,"task_value":0,"version":1}`|
|18|`{"award_list":[[179002,300]],"task_type":2,"task_value":2,"version":1}`|
|19|`{"award_list":[[1171200,1]],"task_type":2,"task_value":4,"version":1}`|
|20|`{"award_list":[[379002,240]],"task_type":2,"task_value":6,"version":1}`|
|21|`{"award_list":[[22002,1]],"task_type":2,"task_value":10,"version":1}`|
|22|`{"award_list":[[1321200,1]],"task_type":2,"task_value":12,"version":1}`|
|23|`{"award_list":[[22002,1]],"task_type":2,"task_value":16,"version":1}`|
|24|`{"award_list":[[1321200,1]],"task_type":2,"task_value":20,"version":1}`|
|25|`{"award_list":[[17002,200]],"task_type":3,"task_value":150000,"version":1}`|
|26|`{"award_list":[[391002,200]],"task_type":3,"task_value":200000,"version":1}`|
|27|`{"award_list":[[101500,150]],"task_type":3,"task_value":250000,"version":1}`|
|28|`{"award_list":[[18002,15]],"task_type":3,"task_value":300000,"version":1}`|
|29|`{"award_list":[[101500,150]],"task_type":3,"task_value":350000,"version":1}`|
|30|`{"award_list":[[179002,100]],"task_type":3,"task_value":400000,"version":1}`|
|31|`{"award_list":[[101500,150]],"task_type":3,"task_value":450000,"version":1}`|
|32|`{"award_list":[[19002,1]],"task_type":3,"task_value":500000,"version":1}`|
|33|`{"award_list":[[101500,150]],"task_type":3,"task_value":550000,"version":1}`|
|34|`{"award_list":[[392002,5]],"task_type":3,"task_value":600000,"version":1}`|

## TaskType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|add_draw_num|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|add_draw_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hero_list|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"add_draw_num":100,"add_draw_time":60,"hero_list":[1030101,2030201,3030601,4030501]}`|

## RankReward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|40|本表行键；与其他表同值不自动代表同一对象。|
|rank_range|array|40|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|40|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|rank_tid|number|40|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"rank_range":[1,1],"award":[[3002,10],[101500,666],[352708,1]],"rank_tid":180}`|
|2|`{"rank_range":[2,2],"award":[[3002,10],[101500,600],[352708,1]],"rank_tid":180}`|
|3|`{"rank_range":[3,3],"award":[[3002,10],[101500,500],[352708,1]],"rank_tid":180}`|
|4|`{"rank_range":[4,10],"award":[[3002,8],[101500,400]],"rank_tid":180}`|
|5|`{"rank_range":[11,20],"award":[[3002,7],[101500,350]],"rank_tid":180}`|
|6|`{"rank_range":[21,50],"award":[[3002,6],[101500,300]],"rank_tid":180}`|
|7|`{"rank_range":[51,100],"award":[[3002,5],[101500,250]],"rank_tid":180}`|
|8|`{"rank_range":[101,200],"award":[[3002,4],[101500,200]],"rank_tid":180}`|
|9|`{"rank_range":[201,500],"award":[[3002,3],[101500,150]],"rank_tid":180}`|
|10|`{"rank_range":[501,9999],"award":[[3002,2],[101500,100]],"rank_tid":180}`|
|11|`{"rank_range":[1,1],"award":[[3002,10],[101500,666],[352808,1]],"rank_tid":181}`|
|12|`{"rank_range":[2,2],"award":[[3002,10],[101500,600],[352808,1]],"rank_tid":181}`|
|13|`{"rank_range":[3,3],"award":[[3002,10],[101500,500],[352808,1]],"rank_tid":181}`|
|14|`{"rank_range":[4,10],"award":[[3002,8],[101500,400]],"rank_tid":181}`|
|15|`{"rank_range":[11,20],"award":[[3002,7],[101500,350]],"rank_tid":181}`|
|16|`{"rank_range":[21,50],"award":[[3002,6],[101500,300]],"rank_tid":181}`|
|17|`{"rank_range":[51,100],"award":[[3002,5],[101500,250]],"rank_tid":181}`|
|18|`{"rank_range":[101,200],"award":[[3002,4],[101500,200]],"rank_tid":181}`|
|19|`{"rank_range":[201,500],"award":[[3002,3],[101500,150]],"rank_tid":181}`|
|20|`{"rank_range":[501,9999],"award":[[3002,2],[101500,100]],"rank_tid":181}`|
|21|`{"rank_range":[1,1],"award":[[3002,10],[101500,666],[352908,1]],"rank_tid":182}`|
|22|`{"rank_range":[2,2],"award":[[3002,10],[101500,600],[352908,1]],"rank_tid":182}`|
|23|`{"rank_range":[3,3],"award":[[3002,10],[101500,500],[352908,1]],"rank_tid":182}`|
|24|`{"rank_range":[4,10],"award":[[3002,8],[101500,400]],"rank_tid":182}`|
|25|`{"rank_range":[11,20],"award":[[3002,7],[101500,350]],"rank_tid":182}`|
|26|`{"rank_range":[21,50],"award":[[3002,6],[101500,300]],"rank_tid":182}`|
|27|`{"rank_range":[51,100],"award":[[3002,5],[101500,250]],"rank_tid":182}`|
|28|`{"rank_range":[101,200],"award":[[3002,4],[101500,200]],"rank_tid":182}`|
|29|`{"rank_range":[201,500],"award":[[3002,3],[101500,150]],"rank_tid":182}`|
|30|`{"rank_range":[501,9999],"award":[[3002,2],[101500,100]],"rank_tid":182}`|
|31|`{"rank_range":[1,1],"award":[[3002,10],[101500,666],[353008,1]],"rank_tid":183}`|
|32|`{"rank_range":[2,2],"award":[[3002,10],[101500,600],[353008,1]],"rank_tid":183}`|
|33|`{"rank_range":[3,3],"award":[[3002,10],[101500,500],[353008,1]],"rank_tid":183}`|
|34|`{"rank_range":[4,10],"award":[[3002,8],[101500,400]],"rank_tid":183}`|
|35|`{"rank_range":[11,20],"award":[[3002,7],[101500,350]],"rank_tid":183}`|
|36|`{"rank_range":[21,50],"award":[[3002,6],[101500,300]],"rank_tid":183}`|
|37|`{"rank_range":[51,100],"award":[[3002,5],[101500,250]],"rank_tid":183}`|
|38|`{"rank_range":[101,200],"award":[[3002,4],[101500,200]],"rank_tid":183}`|
|39|`{"rank_range":[201,500],"award":[[3002,3],[101500,150]],"rank_tid":183}`|
|40|`{"rank_range":[501,9999],"award":[[3002,2],[101500,100]],"rank_tid":183}`|

## Gift

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|show_rule|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|gift|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
