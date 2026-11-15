# FiveDayBossActTable 规则参数

来源：[personal-server/assets/tables/FiveDayBossActTable.data.lua.json.gz](../../../../personal-server/assets/tables/FiveDayBossActTable.data.lua.json.gz)，SHA256：`f7a5e70aee78a85eacb6bfffc54bc5dd998163b1f4be80303fbb8398195acf34`。

[完整逐行JSON](FiveDayBossActTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Task](#task)|25|decoded-rows|
|[Medal](#medal)|5|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[Layer](#layer)|5|decoded-rows|
|[Level](#level)|30|decoded-rows|
|[TimePass](#timepass)|5|decoded-rows|

## Task

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|jump|number|25|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|priority|number|25|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|25|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|type|number|25|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|25|本表行键；与其他表同值不自动代表同一对象。|
|target_count|number|25|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_param|number|25|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|day|number|25|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"award":[[391002,300]],"type":1802,"target_count":1,"task_param":0,"day":1}`|
|102|`{"award":[[391002,400]],"type":8302,"target_count":300,"task_param":0,"day":1}`|
|103|`{"award":[[157002,5000]],"type":1002,"target_count":10,"task_param":0,"day":1}`|
|104|`{"award":[[101500,50]],"type":1002,"target_count":20,"task_param":0,"day":1}`|
|105|`{"award":[[17002,500]],"type":1002,"target_count":30,"task_param":0,"day":1}`|
|201|`{"award":[[391002,300]],"type":1802,"target_count":2,"task_param":0,"day":2}`|
|202|`{"award":[[391002,400]],"type":8302,"target_count":600,"task_param":0,"day":2}`|
|203|`{"award":[[157002,5000]],"type":2202,"target_count":20,"task_param":8,"day":2}`|
|204|`{"award":[[17002,500]],"type":2202,"target_count":20,"task_param":12,"day":2}`|
|205|`{"award":[[101800,20000]],"type":2202,"target_count":20,"task_param":16,"day":2}`|
|301|`{"award":[[391002,300]],"type":1802,"target_count":3,"task_param":0,"day":3}`|
|302|`{"award":[[391002,400]],"type":8302,"target_count":900,"task_param":0,"day":3}`|
|303|`{"award":[[157002,5000]],"type":1602,"target_count":80,"task_param":0,"day":3}`|
|304|`{"award":[[101500,50]],"type":1602,"target_count":120,"task_param":0,"day":3}`|
|305|`{"award":[[17002,500]],"type":1602,"target_count":180,"task_param":0,"day":3}`|
|401|`{"award":[[391002,300]],"type":1802,"target_count":4,"task_param":0,"day":4}`|
|402|`{"award":[[391002,400]],"type":8302,"target_count":1200,"task_param":0,"day":4}`|
|403|`{"award":[[157002,5000]],"type":1002,"target_count":10,"task_param":0,"day":4}`|
|404|`{"award":[[17002,500]],"type":1002,"target_count":20,"task_param":0,"day":4}`|
|405|`{"award":[[101800,20000]],"type":1002,"target_count":30,"task_param":0,"day":4}`|
|501|`{"award":[[391002,300]],"type":1802,"target_count":5,"task_param":0,"day":5}`|
|502|`{"award":[[391002,400]],"type":8302,"target_count":1500,"task_param":0,"day":5}`|
|503|`{"award":[[101500,100]],"type":1201,"target_count":240210,"task_param":0,"day":5}`|
|504|`{"award":[[101500,100]],"type":1201,"target_count":260210,"task_param":0,"day":5}`|
|505|`{"award":[[101500,200]],"type":1602,"target_count":320,"task_param":0,"day":5}`|

## Medal

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|attr|array|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|apply_layer|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|showAttrDes|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|showName|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|need_day|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"attr":[[6,2000],[5,2000]],"showAttrDes":680058,"need_day":1}`|
|2|`{"attr":[[6,2000],[5,2000]],"showAttrDes":680058,"need_day":2}`|
|3|`{"attr":[[6,2000],[5,2000]],"showAttrDes":680058,"need_day":3}`|
|4|`{"attr":[[6,2000],[5,2000]],"showAttrDes":680058,"need_day":4}`|
|5|`{"attr":[[6,2000],[5,2000]],"showAttrDes":680058,"need_day":5}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|

## Layer

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|icon|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|name|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|

## Level

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|fight_tid|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|style|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_award|array|30|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|show_power|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|30|本表行键；与其他表同值不自动代表同一对象。|
|min_power|number|30|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|unlock_day|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|layer|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"fight_tid":11010001,"fight_award":[[2002,1],[101500,20],[201500,30000]],"show_power":157300,"min_power":143000,"unlock_day":1}`|
|102|`{"fight_tid":11010002,"fight_award":[[2002,1],[101500,20],[201500,30000]],"show_power":220220,"min_power":200200,"unlock_day":1}`|
|103|`{"fight_tid":11010003,"fight_award":[[2002,1],[101500,20],[201500,30000]],"show_power":314600,"min_power":286000,"unlock_day":1}`|
|104|`{"fight_tid":11010004,"fight_award":[[2002,2],[101500,50],[201500,30000]],"show_power":471900,"min_power":429000,"unlock_day":1}`|
|105|`{"fight_tid":11010005,"fight_award":[[2002,1],[101500,20],[201500,30000]],"show_power":786500,"min_power":715000,"unlock_day":1}`|
|106|`{"fight_tid":11010006,"fight_award":[[2002,3],[101500,50],[201500,50000]],"show_power":1195480,"min_power":1086800,"unlock_day":1}`|
|201|`{"fight_tid":11020001,"fight_award":[[157002,25000],[101500,20],[201500,30000]],"show_power":316800,"min_power":288000,"unlock_day":2}`|
|202|`{"fight_tid":11020002,"fight_award":[[17002,500],[101500,20],[201500,30000]],"show_power":506880,"min_power":460800,"unlock_day":2}`|
|203|`{"fight_tid":11020003,"fight_award":[[157002,25000],[101500,20],[201500,30000]],"show_power":696960,"min_power":633600,"unlock_day":2}`|
|204|`{"fight_tid":11020004,"fight_award":[[157002,50000],[101500,50],[201500,30000]],"show_power":950400,"min_power":864000,"unlock_day":2}`|
|205|`{"fight_tid":11020005,"fight_award":[[17002,500],[101500,20],[201500,30000]],"show_power":1425600,"min_power":1296000,"unlock_day":2}`|
|206|`{"fight_tid":11020006,"fight_award":[[157002,80000],[101500,100],[201500,50000]],"show_power":2059200,"min_power":1872000,"unlock_day":2}`|
|301|`{"fight_tid":11030001,"fight_award":[[391002,500],[101500,20],[201500,30000]],"show_power":629200,"min_power":572000,"unlock_day":3}`|
|302|`{"fight_tid":11030002,"fight_award":[[391002,500],[101500,20],[201500,30000]],"show_power":849420,"min_power":772200,"unlock_day":3}`|
|303|`{"fight_tid":11030003,"fight_award":[[391002,500],[101500,20],[201500,30000]],"show_power":1069640,"min_power":972400,"unlock_day":3}`|
|304|`{"fight_tid":11030004,"fight_award":[[392002,10],[101500,50],[201500,30000]],"show_power":1258400,"min_power":1144000,"unlock_day":3}`|
|305|`{"fight_tid":11030005,"fight_award":[[391002,500],[101500,20],[201500,30000]],"show_power":1887600,"min_power":1716000,"unlock_day":3}`|
|306|`{"fight_tid":11030006,"fight_award":[[392002,15],[101500,100],[201500,50000]],"show_power":3146000,"min_power":2860000,"unlock_day":3}`|
|401|`{"fight_tid":11040001,"fight_award":[[2002,2],[201500,30000],[201500,30000]],"show_power":862400,"min_power":784000,"unlock_day":4}`|
|402|`{"fight_tid":11040002,"fight_award":[[2002,2],[201500,30000],[201500,30000]],"show_power":1108800,"min_power":1008000,"unlock_day":4}`|
|403|`{"fight_tid":11040003,"fight_award":[[2002,2],[201500,30000],[201500,30000]],"show_power":1478400,"min_power":1344000,"unlock_day":4}`|
|404|`{"fight_tid":11040004,"fight_award":[[2002,3],[201500,30000],[201500,30000]],"show_power":1694000,"min_power":1540000,"unlock_day":4}`|
|405|`{"fight_tid":11040005,"fight_award":[[2002,2],[201500,30000],[201500,30000]],"show_power":3080000,"min_power":2800000,"unlock_day":4}`|
|406|`{"fight_tid":11040006,"fight_award":[[2002,5],[201500,50000],[201500,50000]],"show_power":4928000,"min_power":4480000,"unlock_day":4}`|
|501|`{"fight_tid":11050001,"fight_award":[[3002,2],[201500,30000],[201500,30000]],"show_power":1128600,"min_power":1026000,"unlock_day":5}`|
|502|`{"fight_tid":11050002,"fight_award":[[3002,2],[201500,30000],[201500,30000]],"show_power":1425600,"min_power":1296000,"unlock_day":5}`|
|503|`{"fight_tid":11050003,"fight_award":[[3002,2],[201500,30000],[201500,30000]],"show_power":1900800,"min_power":1728000,"unlock_day":5}`|
|504|`{"fight_tid":11050004,"fight_award":[[3002,3],[201500,30000],[201500,30000]],"show_power":2376000,"min_power":2160000,"unlock_day":5}`|
|505|`{"fight_tid":11050005,"fight_award":[[3002,2],[201500,30000],[201500,30000]],"show_power":3861000,"min_power":3510000,"unlock_day":5}`|
|506|`{"fight_tid":11050006,"fight_award":[[3002,5],[201500,50000],[201500,50000]],"show_power":6237000,"min_power":5670000,"unlock_day":5}`|

## TimePass

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|award|array|5|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|need_day|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|106|`{"award":[[2002,10]],"need_day":2}`|
|206|`{"award":[[157002,150000]],"need_day":3}`|
|306|`{"award":[[392002,35]],"need_day":4}`|
|406|`{"award":[[3002,5]],"need_day":5}`|
|506|`{"award":[[22002,1]],"need_day":5}`|
