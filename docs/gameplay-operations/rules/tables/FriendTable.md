# FriendTable 规则参数

来源：[personal-server/assets/tables/FriendTable.data.lua.json.gz](../../../../personal-server/assets/tables/FriendTable.data.lua.json.gz)，SHA256：`87429568757c5c31e88858a50f1eae18088cfb471cfefeea2be56eb785d86f56`。

[完整逐行JSON](FriendTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Limit](#limit)|4|decoded-rows|
|[Param](#param)|1|decoded-rows|
|[Recommend](#recommend)|4|decoded-rows|

## Limit

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|lv_range|array|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|daily_present_rewards|array|4|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|max_friend_count|number|4|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|max_receive_friendship_count|number|4|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"lv_range":[1,49],"daily_present_rewards":[[401900,300]],"max_friend_count":60,"max_receive_friendship_count":30}`|
|2|`{"lv_range":[50,59],"daily_present_rewards":[[401900,400]],"max_friend_count":80,"max_receive_friendship_count":40}`|
|3|`{"lv_range":[60,69],"daily_present_rewards":[[401900,500]],"max_friend_count":90,"max_receive_friendship_count":50}`|
|4|`{"lv_range":[70,999],"daily_present_rewards":[[401900,600]],"max_friend_count":100,"max_receive_friendship_count":60}`|

## Param

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|recommend_max_rank|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|rev_rewards|array|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|present_rewards|array|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|friendship_exchange_ratio|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|accuss_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|recommend_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|recommend_lv_limit|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|max_private_count|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|max_present_friendship_count|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|max_show_apply_count|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|max_black_list_count|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|max_apply_count|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|recommend_fight_life|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|recommend_reset_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_search_count|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|present_exchange_ratio|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"recommend_max_rank":10,"rev_rewards":[],"present_rewards":[],"friendship_exchange_ratio":100,"accuss_count":300,"recommend_count":5,"recommend_lv_limit":10,"max_private_count":10,"max_present_friendship_count":20,"max_show_apply_count":99,"max_black_list_count":100,"max_apply_count":30,"recommend_fight_life":604800,"recommend_reset_time":5,"max_search_count":5,"present_exchange_ratio":10}`|

## Recommend

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|name|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|imgBg|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
