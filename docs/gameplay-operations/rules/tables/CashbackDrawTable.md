# CashbackDrawTable 规则参数

来源：[personal-server/assets/tables/CashbackDrawTable.data.lua.json.gz](../../../../personal-server/assets/tables/CashbackDrawTable.data.lua.json.gz)，SHA256：`9275198ee5530881c4c20aa66de7523deb4ae8f276b5130b99e4b1cb494dfe5a`。

[完整逐行JSON](CashbackDrawTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[AwardLib](#awardlib)|130|decoded-rows|
|[Act](#act)|3|decoded-rows|
|[Round](#round)|13|decoded-rows|
|[ProAward](#proaward)|18|decoded-rows|

## AwardLib

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|130|本表行键；与其他表同值不自动代表同一对象。|
|weight|number|130|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|
|award|number|130|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|need_draw|number|130|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_num|number|130|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|round|number|130|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_big|boolean|130|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"weight":1000,"award":2002,"need_draw":0,"award_num":3,"round":1,"is_big":false}`|
|102|`{"weight":1000,"award":101500,"need_draw":0,"award_num":200,"round":1,"is_big":false}`|
|103|`{"weight":1000,"award":2002,"need_draw":0,"award_num":5,"round":1,"is_big":false}`|
|104|`{"weight":1000,"award":101500,"need_draw":0,"award_num":300,"round":1,"is_big":false}`|
|105|`{"weight":1000,"award":101500,"need_draw":3,"award_num":600,"round":1,"is_big":false}`|
|106|`{"weight":1000,"award":3002,"need_draw":3,"award_num":5,"round":1,"is_big":false}`|
|107|`{"weight":1000,"award":101500,"need_draw":3,"award_num":1000,"round":1,"is_big":false}`|
|108|`{"weight":1000,"award":23002,"need_draw":5,"award_num":1,"round":1,"is_big":false}`|
|109|`{"weight":1000,"award":22002,"need_draw":5,"award_num":1,"round":1,"is_big":false}`|
|110|`{"weight":1000,"award":101500,"need_draw":8,"award_num":6888,"round":1,"is_big":true}`|
|201|`{"weight":10000,"award":2002,"need_draw":0,"award_num":3,"round":2,"is_big":false}`|
|202|`{"weight":10000,"award":101500,"need_draw":0,"award_num":200,"round":2,"is_big":false}`|
|203|`{"weight":10000,"award":2002,"need_draw":0,"award_num":5,"round":2,"is_big":false}`|
|204|`{"weight":10000,"award":101500,"need_draw":0,"award_num":300,"round":2,"is_big":false}`|
|205|`{"weight":7000,"award":101500,"need_draw":3,"award_num":600,"round":2,"is_big":false}`|
|206|`{"weight":7000,"award":3002,"need_draw":3,"award_num":5,"round":2,"is_big":false}`|
|207|`{"weight":7000,"award":101500,"need_draw":3,"award_num":1000,"round":2,"is_big":false}`|
|208|`{"weight":5000,"award":496002,"need_draw":5,"award_num":1,"round":2,"is_big":false}`|
|209|`{"weight":5000,"award":472002,"need_draw":5,"award_num":1,"round":2,"is_big":false}`|
|210|`{"weight":3000,"award":2281200,"need_draw":8,"award_num":1,"round":2,"is_big":true}`|
|301|`{"weight":10000,"award":2002,"need_draw":0,"award_num":3,"round":3,"is_big":false}`|
|302|`{"weight":10000,"award":101500,"need_draw":0,"award_num":200,"round":3,"is_big":false}`|
|303|`{"weight":10000,"award":2002,"need_draw":0,"award_num":5,"round":3,"is_big":false}`|
|304|`{"weight":10000,"award":101500,"need_draw":0,"award_num":300,"round":3,"is_big":false}`|
|305|`{"weight":7000,"award":101500,"need_draw":3,"award_num":600,"round":3,"is_big":false}`|
|306|`{"weight":7000,"award":3002,"need_draw":3,"award_num":5,"round":3,"is_big":false}`|
|307|`{"weight":7000,"award":101500,"need_draw":3,"award_num":1000,"round":3,"is_big":false}`|
|308|`{"weight":5000,"award":496002,"need_draw":5,"award_num":1,"round":3,"is_big":false}`|
|309|`{"weight":5000,"award":472002,"need_draw":5,"award_num":1,"round":3,"is_big":false}`|
|310|`{"weight":3000,"award":2281200,"need_draw":8,"award_num":1,"round":3,"is_big":true}`|
|401|`{"weight":10000,"award":2002,"need_draw":0,"award_num":3,"round":4,"is_big":false}`|
|402|`{"weight":10000,"award":101500,"need_draw":0,"award_num":200,"round":4,"is_big":false}`|
|403|`{"weight":10000,"award":2002,"need_draw":0,"award_num":5,"round":4,"is_big":false}`|
|404|`{"weight":10000,"award":101500,"need_draw":0,"award_num":300,"round":4,"is_big":false}`|
|405|`{"weight":7000,"award":101500,"need_draw":3,"award_num":600,"round":4,"is_big":false}`|
|406|`{"weight":7000,"award":3002,"need_draw":3,"award_num":5,"round":4,"is_big":false}`|
|407|`{"weight":7000,"award":101500,"need_draw":3,"award_num":1000,"round":4,"is_big":false}`|
|408|`{"weight":5000,"award":496002,"need_draw":5,"award_num":1,"round":4,"is_big":false}`|
|409|`{"weight":5000,"award":472002,"need_draw":5,"award_num":1,"round":4,"is_big":false}`|
|410|`{"weight":3000,"award":25400204,"need_draw":8,"award_num":80,"round":4,"is_big":true}`|
|501|`{"weight":1000,"award":2002,"need_draw":0,"award_num":3,"round":5,"is_big":false}`|
|502|`{"weight":1000,"award":101500,"need_draw":0,"award_num":200,"round":5,"is_big":false}`|
|503|`{"weight":1000,"award":2002,"need_draw":0,"award_num":5,"round":5,"is_big":false}`|
|504|`{"weight":1000,"award":101500,"need_draw":0,"award_num":300,"round":5,"is_big":false}`|
|505|`{"weight":1000,"award":101500,"need_draw":3,"award_num":600,"round":5,"is_big":false}`|
|506|`{"weight":1000,"award":3002,"need_draw":3,"award_num":5,"round":5,"is_big":false}`|
|507|`{"weight":1000,"award":101500,"need_draw":3,"award_num":1000,"round":5,"is_big":false}`|
|508|`{"weight":1000,"award":23002,"need_draw":5,"award_num":1,"round":5,"is_big":false}`|
|509|`{"weight":1000,"award":22002,"need_draw":5,"award_num":1,"round":5,"is_big":false}`|
|510|`{"weight":1000,"award":101500,"need_draw":8,"award_num":5888,"round":5,"is_big":true}`|
|601|`{"weight":10000,"award":2002,"need_draw":0,"award_num":3,"round":6,"is_big":false}`|
|602|`{"weight":10000,"award":101500,"need_draw":0,"award_num":200,"round":6,"is_big":false}`|
|603|`{"weight":10000,"award":2002,"need_draw":0,"award_num":5,"round":6,"is_big":false}`|
|604|`{"weight":10000,"award":101500,"need_draw":0,"award_num":300,"round":6,"is_big":false}`|
|605|`{"weight":7000,"award":101500,"need_draw":3,"award_num":600,"round":6,"is_big":false}`|
|606|`{"weight":7000,"award":3002,"need_draw":3,"award_num":5,"round":6,"is_big":false}`|
|607|`{"weight":7000,"award":101500,"need_draw":3,"award_num":1000,"round":6,"is_big":false}`|
|608|`{"weight":5000,"award":496002,"need_draw":5,"award_num":1,"round":6,"is_big":false}`|
|609|`{"weight":5000,"award":472002,"need_draw":5,"award_num":1,"round":6,"is_big":false}`|
|610|`{"weight":3000,"award":2281200,"need_draw":8,"award_num":1,"round":6,"is_big":true}`|
|701|`{"weight":10000,"award":2002,"need_draw":0,"award_num":3,"round":7,"is_big":false}`|
|702|`{"weight":10000,"award":101500,"need_draw":0,"award_num":200,"round":7,"is_big":false}`|
|703|`{"weight":10000,"award":2002,"need_draw":0,"award_num":5,"round":7,"is_big":false}`|
|704|`{"weight":10000,"award":101500,"need_draw":0,"award_num":300,"round":7,"is_big":false}`|
|705|`{"weight":7000,"award":101500,"need_draw":3,"award_num":600,"round":7,"is_big":false}`|
|706|`{"weight":7000,"award":3002,"need_draw":3,"award_num":5,"round":7,"is_big":false}`|
|707|`{"weight":7000,"award":101500,"need_draw":3,"award_num":1000,"round":7,"is_big":false}`|
|708|`{"weight":5000,"award":496002,"need_draw":5,"award_num":1,"round":7,"is_big":false}`|
|709|`{"weight":5000,"award":472002,"need_draw":5,"award_num":1,"round":7,"is_big":false}`|
|710|`{"weight":3000,"award":2281200,"need_draw":8,"award_num":1,"round":7,"is_big":true}`|
|801|`{"weight":10000,"award":2002,"need_draw":0,"award_num":3,"round":8,"is_big":false}`|
|802|`{"weight":10000,"award":101500,"need_draw":0,"award_num":200,"round":8,"is_big":false}`|
|803|`{"weight":10000,"award":2002,"need_draw":0,"award_num":5,"round":8,"is_big":false}`|
|804|`{"weight":10000,"award":101500,"need_draw":0,"award_num":300,"round":8,"is_big":false}`|
|805|`{"weight":7000,"award":101500,"need_draw":3,"award_num":600,"round":8,"is_big":false}`|
|806|`{"weight":7000,"award":3002,"need_draw":3,"award_num":5,"round":8,"is_big":false}`|
|807|`{"weight":7000,"award":101500,"need_draw":3,"award_num":1000,"round":8,"is_big":false}`|
|808|`{"weight":5000,"award":496002,"need_draw":5,"award_num":1,"round":8,"is_big":false}`|
|809|`{"weight":5000,"award":472002,"need_draw":5,"award_num":1,"round":8,"is_big":false}`|
|810|`{"weight":3000,"award":4411200,"need_draw":8,"award_num":1,"round":8,"is_big":true}`|
|901|`{"weight":1000,"award":2002,"need_draw":0,"award_num":3,"round":9,"is_big":false}`|
|902|`{"weight":1000,"award":101500,"need_draw":0,"award_num":200,"round":9,"is_big":false}`|
|903|`{"weight":1000,"award":2002,"need_draw":0,"award_num":5,"round":9,"is_big":false}`|
|904|`{"weight":1000,"award":101500,"need_draw":0,"award_num":300,"round":9,"is_big":false}`|
|905|`{"weight":1000,"award":101500,"need_draw":3,"award_num":600,"round":9,"is_big":false}`|
|906|`{"weight":1000,"award":3002,"need_draw":3,"award_num":5,"round":9,"is_big":false}`|
|907|`{"weight":1000,"award":101500,"need_draw":3,"award_num":1000,"round":9,"is_big":false}`|
|908|`{"weight":1000,"award":23002,"need_draw":5,"award_num":1,"round":9,"is_big":false}`|
|909|`{"weight":1000,"award":22002,"need_draw":5,"award_num":1,"round":9,"is_big":false}`|
|910|`{"weight":1000,"award":101500,"need_draw":8,"award_num":5888,"round":9,"is_big":true}`|
|1001|`{"weight":10000,"award":2002,"need_draw":0,"award_num":3,"round":10,"is_big":false}`|
|1002|`{"weight":10000,"award":101500,"need_draw":0,"award_num":200,"round":10,"is_big":false}`|
|1003|`{"weight":10000,"award":2002,"need_draw":0,"award_num":5,"round":10,"is_big":false}`|
|1004|`{"weight":10000,"award":101500,"need_draw":0,"award_num":300,"round":10,"is_big":false}`|
|1005|`{"weight":7000,"award":101500,"need_draw":3,"award_num":600,"round":10,"is_big":false}`|
|1006|`{"weight":7000,"award":3002,"need_draw":3,"award_num":5,"round":10,"is_big":false}`|
|1007|`{"weight":7000,"award":101500,"need_draw":3,"award_num":1000,"round":10,"is_big":false}`|
|1008|`{"weight":5000,"award":496002,"need_draw":5,"award_num":1,"round":10,"is_big":false}`|
|1009|`{"weight":5000,"award":472002,"need_draw":5,"award_num":1,"round":10,"is_big":false}`|
|1010|`{"weight":3000,"award":4371200,"need_draw":8,"award_num":80,"round":10,"is_big":true}`|
|1101|`{"weight":10000,"award":2002,"need_draw":0,"award_num":3,"round":11,"is_big":false}`|
|1102|`{"weight":10000,"award":101500,"need_draw":0,"award_num":200,"round":11,"is_big":false}`|
|1103|`{"weight":10000,"award":2002,"need_draw":0,"award_num":5,"round":11,"is_big":false}`|
|1104|`{"weight":10000,"award":101500,"need_draw":0,"award_num":300,"round":11,"is_big":false}`|
|1105|`{"weight":7000,"award":101500,"need_draw":3,"award_num":600,"round":11,"is_big":false}`|
|1106|`{"weight":7000,"award":3002,"need_draw":3,"award_num":5,"round":11,"is_big":false}`|
|1107|`{"weight":7000,"award":101500,"need_draw":3,"award_num":1000,"round":11,"is_big":false}`|
|1108|`{"weight":5000,"award":496002,"need_draw":5,"award_num":1,"round":11,"is_big":false}`|
|1109|`{"weight":5000,"award":472002,"need_draw":5,"award_num":1,"round":11,"is_big":false}`|
|1110|`{"weight":3000,"award":4381200,"need_draw":8,"award_num":1,"round":11,"is_big":true}`|
|1201|`{"weight":10000,"award":2002,"need_draw":0,"award_num":3,"round":12,"is_big":false}`|
|1202|`{"weight":10000,"award":101500,"need_draw":0,"award_num":200,"round":12,"is_big":false}`|
|1203|`{"weight":10000,"award":2002,"need_draw":0,"award_num":5,"round":12,"is_big":false}`|
|1204|`{"weight":10000,"award":101500,"need_draw":0,"award_num":300,"round":12,"is_big":false}`|
|1205|`{"weight":7000,"award":101500,"need_draw":3,"award_num":600,"round":12,"is_big":false}`|
|1206|`{"weight":7000,"award":3002,"need_draw":3,"award_num":5,"round":12,"is_big":false}`|
|1207|`{"weight":7000,"award":101500,"need_draw":3,"award_num":1000,"round":12,"is_big":false}`|
|1208|`{"weight":5000,"award":496002,"need_draw":5,"award_num":1,"round":12,"is_big":false}`|
|1209|`{"weight":5000,"award":472002,"need_draw":5,"award_num":1,"round":12,"is_big":false}`|
|1210|`{"weight":3000,"award":4971200,"need_draw":8,"award_num":1,"round":12,"is_big":true}`|
|1211|`{"weight":10000,"award":2002,"need_draw":0,"award_num":3,"round":13,"is_big":false}`|
|1212|`{"weight":10000,"award":101500,"need_draw":0,"award_num":200,"round":13,"is_big":false}`|
|1213|`{"weight":10000,"award":2002,"need_draw":0,"award_num":5,"round":13,"is_big":false}`|
|1214|`{"weight":10000,"award":101500,"need_draw":0,"award_num":300,"round":13,"is_big":false}`|
|1215|`{"weight":7000,"award":101500,"need_draw":3,"award_num":600,"round":13,"is_big":false}`|
|1216|`{"weight":7000,"award":3002,"need_draw":3,"award_num":5,"round":13,"is_big":false}`|
|1217|`{"weight":7000,"award":101500,"need_draw":3,"award_num":1000,"round":13,"is_big":false}`|
|1218|`{"weight":5000,"award":496002,"need_draw":5,"award_num":1,"round":13,"is_big":false}`|
|1219|`{"weight":5000,"award":472002,"need_draw":5,"award_num":1,"round":13,"is_big":false}`|
|1220|`{"weight":3000,"award":4411200,"need_draw":8,"award_num":1,"round":13,"is_big":true}`|

## Act

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|award_num|number|3|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|need_recharge|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|number|3|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award_num":100,"need_recharge":12,"award":818102}`|
|2|`{"award_num":100,"need_recharge":12,"award":818102}`|
|3|`{"award_num":100,"need_recharge":12,"award":818102}`|

## Round

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|13|本表行键；与其他表同值不自动代表同一对象。|
|version|number|13|版本引用；必须按活动类型及其消费者查对应版本表。|
|turn|number|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cost_num|number|13|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"version":1,"turn":1,"cost_num":200}`|
|2|`{"version":1,"turn":2,"cost_num":400}`|
|3|`{"version":1,"turn":3,"cost_num":600}`|
|4|`{"version":1,"turn":4,"cost_num":1200}`|
|5|`{"version":2,"turn":1,"cost_num":200}`|
|6|`{"version":2,"turn":2,"cost_num":400}`|
|7|`{"version":2,"turn":3,"cost_num":600}`|
|8|`{"version":2,"turn":4,"cost_num":1200}`|
|9|`{"version":3,"turn":1,"cost_num":200}`|
|10|`{"version":3,"turn":2,"cost_num":400}`|
|11|`{"version":3,"turn":3,"cost_num":600}`|
|12|`{"version":3,"turn":4,"cost_num":1200}`|
|13|`{"version":3,"turn":5,"cost_num":1200}`|

## ProAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|18|本表行键；与其他表同值不自动代表同一对象。|
|version|number|18|版本引用；必须按活动类型及其消费者查对应版本表。|
|pro|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|18|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"version":1,"award":[[101500,500]]}`|
|2|`{"version":1,"award":[[10054100,2]]}`|
|3|`{"version":1,"award":[[3002,2]]}`|
|4|`{"version":1,"award":[[3002,2]]}`|
|5|`{"version":1,"award":[[3002,3]]}`|
|6|`{"version":1,"award":[[3002,3]]}`|
|7|`{"version":2,"award":[[101500,500]]}`|
|8|`{"version":2,"award":[[10054100,2]]}`|
|9|`{"version":2,"award":[[3002,2]]}`|
|10|`{"version":2,"award":[[3002,2]]}`|
|11|`{"version":2,"award":[[3002,3]]}`|
|12|`{"version":2,"award":[[3002,3]]}`|
|13|`{"version":3,"award":[[101500,500]]}`|
|14|`{"version":3,"award":[[10054100,2]]}`|
|15|`{"version":3,"award":[[3002,2]]}`|
|16|`{"version":3,"award":[[3002,2]]}`|
|17|`{"version":3,"award":[[3002,3]]}`|
|18|`{"version":3,"award":[[3002,3]]}`|
