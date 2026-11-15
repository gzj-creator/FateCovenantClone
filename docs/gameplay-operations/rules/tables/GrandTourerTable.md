# GrandTourerTable 规则参数

来源：[personal-server/assets/tables/GrandTourerTable.data.lua.json.gz](../../../../personal-server/assets/tables/GrandTourerTable.data.lua.json.gz)，SHA256：`e3b9e88524ee560d65a8f823b80ac4a87350dc1c468de67e2d42c211a49f278b`。

[完整逐行JSON](GrandTourerTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Const](#const)|1|decoded-rows|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|award_num_range|array|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|max_speed|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|destination_distance|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|default_speed|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|combo_show|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_item|number|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|magnet_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|distance_max|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|speed_add|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award_num_range":[300,450],"max_speed":100,"default_speed":20,"award_item":101500,"magnet_time":5,"distance_max":500,"speed_add":5}`|
