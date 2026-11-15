# ExperienceActTable 规则参数

来源：[personal-server/assets/tables/ExperienceActTable.data.lua.json.gz](../../../../personal-server/assets/tables/ExperienceActTable.data.lua.json.gz)，SHA256：`0a301469ac1a30353eabe213117cb817c0382b7f2c0205e254084af948c08ed7`。

[完整逐行JSON](ExperienceActTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Level](#level)|36|decoded-rows|
|[ActivityUnitType](#activityunittype)|1|decoded-rows|
|[Activity](#activity)|9|decoded-rows|

## Level

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|need_time|number|36|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ex_award|array|36|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award|array|36|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|version|number|36|版本引用；必须按活动类型及其消费者查对应版本表。|
|tid|number|36|本表行键；与其他表同值不自动代表同一对象。|
|title|number|36|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|need_num|array|36|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"need_time":7200,"ex_award":[[6301900,100]],"award":[[6301900,500]],"version":1,"need_num":[8,5,5,5]}`|
|2|`{"need_time":7200,"ex_award":[[6301900,80]],"award":[[6301900,400]],"version":1,"need_num":[7,5,5,5]}`|
|3|`{"need_time":7200,"ex_award":[[493002,20]],"award":[[493002,100]],"version":1,"need_num":[6,5,5,5]}`|
|4|`{"need_time":7200,"ex_award":[[495002,24]],"award":[[495002,120]],"version":1,"need_num":[6,5,5,5]}`|
|5|`{"need_time":7200,"ex_award":[[6301900,100]],"award":[[6301900,500]],"version":2,"need_num":[8,5,5,5]}`|
|6|`{"need_time":7200,"ex_award":[[6301900,80]],"award":[[6301900,400]],"version":2,"need_num":[7,5,5,5]}`|
|7|`{"need_time":7200,"ex_award":[[493002,20]],"award":[[493002,100]],"version":2,"need_num":[6,5,5,5]}`|
|8|`{"need_time":7200,"ex_award":[[495002,24]],"award":[[495002,120]],"version":2,"need_num":[6,5,5,5]}`|
|9|`{"need_time":7200,"ex_award":[[6301900,100]],"award":[[6301900,500]],"version":3,"need_num":[8,5,5,5]}`|
|10|`{"need_time":7200,"ex_award":[[6301900,80]],"award":[[6301900,400]],"version":3,"need_num":[7,5,5,5]}`|
|11|`{"need_time":7200,"ex_award":[[493002,20]],"award":[[493002,100]],"version":3,"need_num":[6,5,5,5]}`|
|12|`{"need_time":7200,"ex_award":[[495002,24]],"award":[[495002,120]],"version":3,"need_num":[6,5,5,5]}`|
|13|`{"need_time":7200,"ex_award":[[6301900,100]],"award":[[6301900,500]],"version":4,"need_num":[8,5,5,5]}`|
|14|`{"need_time":7200,"ex_award":[[6301900,80]],"award":[[6301900,400]],"version":4,"need_num":[7,5,5,5]}`|
|15|`{"need_time":7200,"ex_award":[[493002,20]],"award":[[493002,100]],"version":4,"need_num":[6,5,5,5]}`|
|16|`{"need_time":7200,"ex_award":[[495002,24]],"award":[[495002,120]],"version":4,"need_num":[6,5,5,5]}`|
|17|`{"need_time":7200,"ex_award":[[6301900,100]],"award":[[6301900,500]],"version":5,"need_num":[8,5,5,5]}`|
|18|`{"need_time":7200,"ex_award":[[6301900,80]],"award":[[6301900,400]],"version":5,"need_num":[7,5,5,5]}`|
|19|`{"need_time":7200,"ex_award":[[493002,20]],"award":[[493002,100]],"version":5,"need_num":[6,5,5,5]}`|
|20|`{"need_time":7200,"ex_award":[[495002,24]],"award":[[495002,120]],"version":5,"need_num":[6,5,5,5]}`|
|21|`{"need_time":7200,"ex_award":[[6301900,100]],"award":[[6301900,500]],"version":6,"need_num":[8,5,5,5]}`|
|22|`{"need_time":7200,"ex_award":[[6301900,80]],"award":[[6301900,400]],"version":6,"need_num":[7,5,5,5]}`|
|23|`{"need_time":7200,"ex_award":[[493002,20]],"award":[[493002,100]],"version":6,"need_num":[6,5,5,5]}`|
|24|`{"need_time":7200,"ex_award":[[495002,24]],"award":[[495002,120]],"version":6,"need_num":[6,5,5,5]}`|
|25|`{"need_time":7200,"ex_award":[[6301900,100]],"award":[[6301900,500]],"version":7,"need_num":[8,5,5,5]}`|
|26|`{"need_time":7200,"ex_award":[[6301900,80]],"award":[[6301900,400]],"version":7,"need_num":[7,5,5,5]}`|
|27|`{"need_time":7200,"ex_award":[[493002,20]],"award":[[493002,100]],"version":7,"need_num":[6,5,5,5]}`|
|28|`{"need_time":7200,"ex_award":[[495002,24]],"award":[[495002,120]],"version":7,"need_num":[6,5,5,5]}`|
|29|`{"need_time":7200,"ex_award":[[6301900,100]],"award":[[6301900,500]],"version":8,"need_num":[8,5,5,5]}`|
|30|`{"need_time":7200,"ex_award":[[6301900,80]],"award":[[6301900,400]],"version":8,"need_num":[7,5,5,5]}`|
|31|`{"need_time":7200,"ex_award":[[493002,20]],"award":[[493002,100]],"version":8,"need_num":[6,5,5,5]}`|
|32|`{"need_time":7200,"ex_award":[[495002,24]],"award":[[495002,120]],"version":8,"need_num":[6,5,5,5]}`|
|33|`{"need_time":7200,"ex_award":[[6891900,100]],"award":[[6891900,500]],"version":9,"need_num":[8,5,5,5]}`|
|34|`{"need_time":7200,"ex_award":[[6891900,80]],"award":[[6891900,400]],"version":9,"need_num":[7,5,5,5]}`|
|35|`{"need_time":7200,"ex_award":[[493002,20]],"award":[[493002,100]],"version":9,"need_num":[6,5,5,5]}`|
|36|`{"need_time":7200,"ex_award":[[495002,24]],"award":[[495002,120]],"version":9,"need_num":[6,5,5,5]}`|

## ActivityUnitType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|

## Activity

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|9|本表行键；与其他表同值不自动代表同一对象。|
|type|number|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|finish_num|number|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"type":1,"finish_num":1}`|
|2|`{"type":1,"finish_num":1}`|
|3|`{"type":1,"finish_num":1}`|
|4|`{"type":1,"finish_num":1}`|
|5|`{"type":1,"finish_num":1}`|
|6|`{"type":1,"finish_num":1}`|
|7|`{"type":1,"finish_num":1}`|
|8|`{"type":1,"finish_num":1}`|
|9|`{"type":1,"finish_num":1}`|
