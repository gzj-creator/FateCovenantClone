# InviteActTable 规则参数

来源：[personal-server/assets/tables/InviteActTable.data.lua.json.gz](../../../../personal-server/assets/tables/InviteActTable.data.lua.json.gz)，SHA256：`affc48d6fdf878ad67150f5a3d213f2acaf66249127e29bca29821f35ef03524`。

[完整逐行JSON](InviteActTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[InviteTask](#invitetask)|48|decoded-rows|
|[InviteConst](#inviteconst)|1|decoded-rows|
|[InviteAct](#inviteact)|3|decoded-rows|

## InviteTask

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|period|number|48|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_des|number|48|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_list|array|48|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|type|number|48|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|48|本表行键；与其他表同值不自动代表同一对象。|
|target_count|number|48|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_param|number|48|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"task_des":13216,"award_list":[[25400204,80],[10064100,1],[101500,800]],"type":1801,"target_count":80,"task_param":0}`|
|2|`{"task_des":13218,"award_list":[[3831200,1],[157002,10000],[101500,50]],"type":1002,"target_count":50,"task_param":0}`|
|3|`{"task_des":13219,"award_list":[[2002,10],[17002,500],[101500,50]],"type":1602,"target_count":60,"task_param":0}`|
|4|`{"task_des":13220,"award_list":[[3002,10],[10054100,1],[101500,100]],"type":1003,"target_count":50,"task_param":0}`|
|5|`{"task_des":13221,"award_list":[[3831200,1],[19002,4],[101500,200]],"type":8102,"target_count":8,"task_param":0}`|
|6|`{"task_des":13222,"award_list":[[3002,5],[22002,1],[101500,50]],"type":1801,"target_count":20,"task_param":0}`|
|7|`{"task_des":13223,"award_list":[[1151200,1],[10054100,2],[101500,100]],"type":1801,"target_count":30,"task_param":0}`|
|8|`{"task_des":13224,"award_list":[[3002,10],[141002,10],[101500,200]],"type":1801,"target_count":35,"task_param":0}`|
|9|`{"task_des":13225,"award_list":[[3002,10],[10064100,1],[101500,200]],"type":1801,"target_count":60,"task_param":0}`|
|10|`{"task_des":13226,"award_list":[[808002,10],[10064100,1],[101500,500]],"type":1801,"target_count":70,"task_param":0}`|
|11|`{"task_des":13227,"award_list":[[3901200,1],[1030122,1],[101500,1000]],"type":1801,"target_count":88,"task_param":0}`|
|12|`{"task_des":13228,"award_list":[[3881200,1],[10054100,1],[101500,50]],"type":2301,"target_count":3000000,"task_param":0}`|
|13|`{"task_des":13229,"award_list":[[3881200,1],[10054100,1],[101500,100]],"type":2301,"target_count":6500000,"task_param":0}`|
|14|`{"task_des":13230,"award_list":[[3881200,1],[10064100,2],[101500,200]],"type":2301,"target_count":15000000,"task_param":0}`|
|15|`{"task_des":13231,"award_list":[[3891200,1],[472002,1],[101500,200]],"type":2301,"target_count":25000000,"task_param":0}`|
|16|`{"task_des":13232,"award_list":[[3881200,1],[10064100,2],[101500,500]],"type":2301,"target_count":35000000,"task_param":0}`|
|17|`{"task_des":13298,"award_list":[[25400204,80],[10064100,1],[101500,800]],"type":1801,"target_count":65,"task_param":0}`|
|18|`{"task_des":13218,"award_list":[[3831200,1],[157002,10000],[101500,50]],"type":1002,"target_count":50,"task_param":0}`|
|19|`{"task_des":13219,"award_list":[[2002,10],[17002,500],[101500,50]],"type":1602,"target_count":60,"task_param":0}`|
|20|`{"task_des":13220,"award_list":[[3002,10],[10054100,1],[101500,100]],"type":1003,"target_count":50,"task_param":0}`|
|21|`{"task_des":13221,"award_list":[[3831200,1],[19002,4],[101500,200]],"type":8102,"target_count":8,"task_param":0}`|
|22|`{"task_des":13222,"award_list":[[3002,5],[22002,1],[101500,50]],"type":1801,"target_count":20,"task_param":0}`|
|23|`{"task_des":13223,"award_list":[[1151200,1],[10054100,2],[101500,100]],"type":1801,"target_count":30,"task_param":0}`|
|24|`{"task_des":13224,"award_list":[[3002,10],[141002,10],[101500,200]],"type":1801,"target_count":35,"task_param":0}`|
|25|`{"task_des":13299,"award_list":[[3002,10],[10064100,1],[101500,200]],"type":1801,"target_count":50,"task_param":0}`|
|26|`{"task_des":13225,"award_list":[[808002,10],[10064100,1],[101500,500]],"type":1801,"target_count":60,"task_param":0}`|
|27|`{"task_des":13226,"award_list":[[3901200,1],[1030122,1],[101500,1000]],"type":1801,"target_count":70,"task_param":0}`|
|28|`{"task_des":13300,"award_list":[[3881200,1],[10054100,1],[101500,50]],"type":2301,"target_count":2000000,"task_param":0}`|
|29|`{"task_des":13301,"award_list":[[3881200,1],[10054100,1],[101500,100]],"type":2301,"target_count":3500000,"task_param":0}`|
|30|`{"task_des":13302,"award_list":[[3881200,1],[10064100,2],[101500,200]],"type":2301,"target_count":7500000,"task_param":0}`|
|31|`{"task_des":13303,"award_list":[[3891200,1],[472002,1],[101500,200]],"type":2301,"target_count":12000000,"task_param":0}`|
|32|`{"task_des":13304,"award_list":[[3881200,1],[10064100,2],[101500,500]],"type":2301,"target_count":18000000,"task_param":0}`|
|33|`{"task_des":13298,"award_list":[[25400204,80],[10064100,1],[101500,800]],"type":1801,"target_count":65,"task_param":0}`|
|34|`{"task_des":13218,"award_list":[[3831200,1],[157002,10000],[101500,50]],"type":1002,"target_count":50,"task_param":0}`|
|35|`{"task_des":13219,"award_list":[[2002,10],[17002,500],[101500,50]],"type":1602,"target_count":60,"task_param":0}`|
|36|`{"task_des":13220,"award_list":[[3002,10],[10054100,1],[101500,100]],"type":1003,"target_count":50,"task_param":0}`|
|37|`{"task_des":13221,"award_list":[[3831200,1],[19002,4],[101500,200]],"type":8102,"target_count":8,"task_param":0}`|
|38|`{"task_des":13222,"award_list":[[3002,5],[22002,1],[101500,50]],"type":1801,"target_count":20,"task_param":0}`|
|39|`{"task_des":13223,"award_list":[[1151200,1],[10054100,2],[101500,100]],"type":1801,"target_count":30,"task_param":0}`|
|40|`{"task_des":13224,"award_list":[[3002,10],[141002,10],[101500,200]],"type":1801,"target_count":35,"task_param":0}`|
|41|`{"task_des":13299,"award_list":[[3002,10],[10064100,1],[101500,200]],"type":1801,"target_count":50,"task_param":0}`|
|42|`{"task_des":13225,"award_list":[[808002,10],[10064100,1],[101500,500]],"type":1801,"target_count":60,"task_param":0}`|
|43|`{"task_des":13226,"award_list":[[3901200,1],[1030122,1],[101500,1000]],"type":1801,"target_count":70,"task_param":0}`|
|44|`{"task_des":13300,"award_list":[[3881200,1],[10054100,1],[101500,50]],"type":2301,"target_count":2000000,"task_param":0}`|
|45|`{"task_des":13301,"award_list":[[3881200,1],[10054100,1],[101500,100]],"type":2301,"target_count":3500000,"task_param":0}`|
|46|`{"task_des":13302,"award_list":[[3881200,1],[10064100,2],[101500,200]],"type":2301,"target_count":7500000,"task_param":0}`|
|47|`{"task_des":13303,"award_list":[[3891200,1],[472002,1],[101500,200]],"type":2301,"target_count":12000000,"task_param":0}`|
|48|`{"task_des":13304,"award_list":[[3881200,1],[10064100,2],[101500,500]],"type":2301,"target_count":18000000,"task_param":0}`|

## InviteConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|max_bind_count|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"max_bind_count":10}`|

## InviteAct

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|bind_reward|array|3|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|split_level|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|title_two_text_id|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bust_portrait|string|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|bg|string|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|act_title_text_id|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"bind_reward":[[1221200,1],[2002,20],[101500,1000]],"split_level":160}`|
|2|`{"bind_reward":[[1221200,1],[2002,20],[101500,1000]],"split_level":160}`|
|3|`{"bind_reward":[[1221200,1],[2002,20],[101500,1000]],"split_level":160}`|
