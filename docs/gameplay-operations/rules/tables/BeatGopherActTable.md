# BeatGopherActTable 规则参数

来源：[personal-server/assets/tables/BeatGopherActTable.data.lua.json.gz](../../../../personal-server/assets/tables/BeatGopherActTable.data.lua.json.gz)，SHA256：`70ff0f173ee2c70904f79007181955d466c071b1cc133ebfcdfb0ae68c633307`。

[完整逐行JSON](BeatGopherActTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[BeatGopherRankAward](#beatgopherrankaward)|8|decoded-rows|
|[BeatGopherScoreAward](#beatgopherscoreaward)|3|decoded-rows|
|[BeatGopherNode](#beatgophernode)|3|decoded-rows|
|[BeatGopherVersion](#beatgopherversion)|1|decoded-rows|

## BeatGopherRankAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|8|本表行键；与其他表同值不自动代表同一对象。|
|version|number|8|版本引用；必须按活动类型及其消费者查对应版本表。|
|rank_range|array|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|8|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"version":1,"rank_range":[1,1],"award":[[101500,500],[208108,1]]}`|
|2|`{"version":1,"rank_range":[2,2],"award":[[101500,450]]}`|
|3|`{"version":1,"rank_range":[3,3],"award":[[101500,400]]}`|
|4|`{"version":1,"rank_range":[4,10],"award":[[101500,350]]}`|
|5|`{"version":1,"rank_range":[11,20],"award":[[101500,300]]}`|
|6|`{"version":1,"rank_range":[21,50],"award":[[101500,280]]}`|
|7|`{"version":1,"rank_range":[51,100],"award":[[101500,250]]}`|
|8|`{"version":1,"rank_range":[101,9999],"award":[[101500,200]]}`|

## BeatGopherScoreAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|version|number|3|版本引用；必须按活动类型及其消费者查对应版本表。|
|score|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_list|array|3|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"version":1,"score":2700,"award_list":[[709002,20]]}`|
|2|`{"version":1,"score":5400,"award_list":[[709002,25]]}`|
|3|`{"version":1,"score":9000,"award_list":[[709002,25]]}`|

## BeatGopherNode

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|score|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pic|string|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hide_time|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|prob|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"score":200,"prob":1000}`|
|2|`{"score":400,"prob":300}`|
|3|`{"score":-200,"prob":200}`|

## BeatGopherVersion

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|rank|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rank_mail|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rank_log_id|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|score_min|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|score_max|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|barrage_channel|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|red|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|default_list|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|game_list|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|interval|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|game_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skip_score|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_progress|boolean|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"rank":233,"rank_mail":7541400,"rank_log_id":121202,"score_min":0,"score_max":99999,"interval":600,"game_time":30000,"skip_score":[4000,5500],"award_progress":true}`|
