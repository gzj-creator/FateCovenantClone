# GrowthRoadTable 规则参数

来源：[personal-server/assets/tables/GrowthRoadTable.data.lua.json.gz](../../../../personal-server/assets/tables/GrowthRoadTable.data.lua.json.gz)，SHA256：`7abcb7098863c53fc5da4fd38c4596de40b463e741ef30c01038257f4efe6672`。

[完整逐行JSON](GrowthRoadTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Task](#task)|318|decoded-rows|
|[Version](#version)|1|decoded-rows|
|[Progress](#progress)|12|decoded-rows|
|[Tag](#tag)|4|decoded-rows|

## Task

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|318|本表行键；与其他表同值不自动代表同一对象。|
|tag|number|318|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|318|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|target_count|number|318|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|growth_value|number|318|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_list|array|318|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

下列3行用于说明结构；全部318行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{"type":1103,"target_count":1,"growth_value":20,"award_list":[[701900,20],[101500,100]]}`|
|1002|`{"type":1103,"target_count":2,"growth_value":20,"award_list":[[701900,20],[101500,100]]}`|
|1003|`{"type":1103,"target_count":3,"growth_value":20,"award_list":[[701900,20],[101500,100]]}`|

## Version

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|skin_limit_day|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|title|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|des|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skin_style|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skin_scale|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skin_title|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|frame_title|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|frame_icon|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skin_style_new|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cutting_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"skin_limit_day":9998,"cutting_time":1757278800}`|

## Progress

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|12|本表行键；与其他表同值不自动代表同一对象。|
|need_count|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|number|12|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|award_n|number|12|奖励数量数组；零与缺字段分别保留。|
|award_new|number|12|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award_new_n|number|12|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|overdue_award|number|12|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|overdue_award_n|number|12|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"need_count":200,"award":101500,"award_n":2500,"award_new":101500,"award_new_n":2500,"overdue_award":0,"overdue_award_n":0}`|
|102|`{"need_count":500,"award":101500,"award_n":2500,"award_new":101500,"award_new_n":2500,"overdue_award":0,"overdue_award_n":0}`|
|103|`{"need_count":1000,"award":101500,"award_n":5000,"award_new":101500,"award_new_n":5000,"overdue_award":0,"overdue_award_n":0}`|
|104|`{"need_count":1500,"award":101500,"award_n":5000,"award_new":101500,"award_new_n":5000,"overdue_award":0,"overdue_award_n":0}`|
|105|`{"need_count":2000,"award":101500,"award_n":5000,"award_new":101500,"award_new_n":5000,"overdue_award":0,"overdue_award_n":0}`|
|106|`{"need_count":2500,"award":39002,"award_n":1,"award_new":40002,"award_new_n":1,"overdue_award":101500,"overdue_award_n":8888}`|
|107|`{"need_count":3000,"award":101500,"award_n":5000,"award_new":101500,"award_new_n":5000,"overdue_award":0,"overdue_award_n":0}`|
|108|`{"need_count":3500,"award":101500,"award_n":5000,"award_new":101500,"award_new_n":5000,"overdue_award":0,"overdue_award_n":0}`|
|109|`{"need_count":4000,"award":101500,"award_n":5000,"award_new":101500,"award_new_n":5000,"overdue_award":0,"overdue_award_n":0}`|
|110|`{"need_count":5000,"award":101500,"award_n":5000,"award_new":101500,"award_new_n":5000,"overdue_award":0,"overdue_award_n":0}`|
|111|`{"need_count":6000,"award":101500,"award_n":5000,"award_new":101500,"award_new_n":5000,"overdue_award":0,"overdue_award_n":0}`|
|112|`{"need_count":8000,"award":203608,"award_n":1,"award_new":203608,"award_new_n":1,"overdue_award":0,"overdue_award_n":0}`|

## Tag

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|title|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
