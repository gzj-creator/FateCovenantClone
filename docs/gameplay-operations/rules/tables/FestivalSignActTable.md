# FestivalSignActTable 规则参数

来源：[personal-server/assets/tables/FestivalSignActTable.data.lua.json.gz](../../../../personal-server/assets/tables/FestivalSignActTable.data.lua.json.gz)，SHA256：`c28fd6746f9ca4fdca64d14b70202815eb8baaff11e9a59ad68da9e9c2997d93`。

[完整逐行JSON](FestivalSignActTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[FestivalSignAct](#festivalsignact)|90|decoded-rows|
|[FestivalSignShow](#festivalsignshow)|10|decoded-rows|

## FestivalSignAct

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|item|number|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_special|boolean|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|count|number|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|date_show_name|number|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|90|本表行键；与其他表同值不自动代表同一对象。|
|version|number|90|版本引用；必须按活动类型及其消费者查对应版本表。|
|award_list|array|90|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|assert|undefined/number|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"item":101500,"is_special":false,"count":666,"version":1,"award_list":[[101500,666]]}`|
|102|`{"item":1581200,"is_special":false,"count":20,"version":1,"award_list":[[1581200,20]]}`|
|103|`{"item":2002,"is_special":false,"count":5,"version":1,"award_list":[[2002,5]]}`|
|104|`{"item":205908,"is_special":true,"count":1,"version":1,"award_list":[[205908,1]]}`|
|105|`{"item":22002,"is_special":false,"count":1,"version":1,"award_list":[[22002,1]]}`|
|106|`{"item":1581200,"is_special":false,"count":20,"version":1,"award_list":[[1581200,20]]}`|
|107|`{"item":2002,"is_special":false,"count":5,"version":1,"award_list":[[2002,5]]}`|
|108|`{"item":1581200,"is_special":false,"count":20,"version":1,"award_list":[[1581200,20]]}`|
|109|`{"item":3002,"is_special":false,"count":5,"version":1,"award_list":[[3002,5]]}`|
|110|`{"item":2002,"is_special":false,"count":5,"version":1,"award_list":[[2002,5]]}`|
|111|`{"item":1321200,"is_special":false,"count":1,"version":1,"award_list":[[1321200,1]]}`|
|112|`{"item":11200,"is_special":false,"count":1,"version":1,"award_list":[[11200,1]]}`|
|201|`{"item":101500,"is_special":false,"count":600,"version":2,"award_list":[[101500,600]]}`|
|202|`{"item":2002,"is_special":false,"count":10,"version":2,"award_list":[[2002,10]]}`|
|203|`{"item":1581200,"is_special":false,"count":30,"version":2,"award_list":[[1581200,30]]}`|
|204|`{"item":354208,"is_special":false,"count":1,"version":2,"award_list":[[354208,1]]}`|
|205|`{"item":101500,"is_special":false,"count":600,"version":2,"award_list":[[101500,600]]}`|
|206|`{"item":2002,"is_special":false,"count":5,"version":2,"award_list":[[2002,5]]}`|
|207|`{"item":1581200,"is_special":false,"count":30,"version":2,"award_list":[[1581200,30]]}`|
|208|`{"item":1321200,"is_special":false,"count":1,"version":2,"award_list":[[1321200,1]]}`|
|209|`{"item":101500,"is_special":false,"count":600,"version":2,"award_list":[[101500,600]]}`|
|210|`{"item":3002,"is_special":false,"count":5,"version":2,"award_list":[[3002,5]]}`|
|211|`{"item":11200,"is_special":false,"count":1,"version":2,"award_list":[[11200,1]]}`|
|212|`{"item":22002,"is_special":false,"count":1,"version":2,"award_list":[[22002,1]]}`|
|301|`{"item":2002,"is_special":false,"count":5,"version":3,"award_list":[[2002,5]]}`|
|302|`{"item":101500,"is_special":false,"count":666,"version":3,"award_list":[[101500,666]]}`|
|303|`{"item":2002,"is_special":false,"count":5,"version":3,"award_list":[[2002,5]]}`|
|304|`{"item":101500,"is_special":false,"count":888,"version":3,"award_list":[[101500,888]]}`|
|305|`{"item":2002,"is_special":false,"count":5,"version":3,"award_list":[[2002,5]]}`|
|306|`{"item":22002,"is_special":false,"count":1,"version":3,"award_list":[[22002,1]]}`|
|401|`{"item":101500,"is_special":false,"count":2888,"version":4,"award_list":[[101500,2888],[2281200,1]],"assert":302941100401}`|
|402|`{"item":101500,"is_special":false,"count":300,"version":4,"award_list":[[101500,300],[101500,300]],"assert":302941100401}`|
|403|`{"item":33002,"is_special":false,"count":5,"version":4,"award_list":[[33002,5],[33002,5]],"assert":302941100401}`|
|404|`{"item":2002,"is_special":false,"count":5,"version":4,"award_list":[[2002,5],[808002,5]],"assert":302941100401}`|
|405|`{"item":101500,"is_special":false,"count":300,"version":4,"award_list":[[101500,300],[101500,300]],"assert":302941100401}`|
|406|`{"item":11200,"is_special":false,"count":1,"version":4,"award_list":[[11200,1],[2281200,1]],"assert":302941100401}`|
|407|`{"item":101500,"is_special":false,"count":300,"version":4,"award_list":[[101500,300],[101500,300]],"assert":302941100401}`|
|408|`{"item":19002,"is_special":false,"count":3,"version":4,"award_list":[[19002,3],[19002,3]],"assert":302941100401}`|
|409|`{"item":33002,"is_special":false,"count":5,"version":4,"award_list":[[33002,5],[33002,5]],"assert":302941100401}`|
|410|`{"item":22002,"is_special":false,"count":2,"version":4,"award_list":[[22002,2],[22002,2]],"assert":302941100401}`|
|501|`{"item":20133200,"is_special":true,"count":1,"version":5,"award_list":[[20143200,1]]}`|
|502|`{"item":101500,"is_special":false,"count":1314,"version":5,"award_list":[[101500,1314]]}`|
|503|`{"item":4241200,"is_special":false,"count":1,"version":5,"award_list":[[4241200,1]]}`|
|504|`{"item":360908,"is_special":true,"count":1,"version":5,"award_list":[[360908,1]]}`|
|505|`{"item":4211200,"is_special":true,"count":80,"version":5,"award_list":[[4211200,80]]}`|
|506|`{"item":4241200,"is_special":false,"count":1,"version":5,"award_list":[[4241200,1]]}`|
|507|`{"item":1321200,"is_special":false,"count":1,"version":5,"award_list":[[1321200,1]]}`|
|508|`{"item":4241200,"is_special":false,"count":2,"version":5,"award_list":[[4241200,2]]}`|
|509|`{"item":19002,"is_special":false,"count":3,"version":5,"award_list":[[19002,3]]}`|
|510|`{"item":4241200,"is_special":false,"count":2,"version":5,"award_list":[[4241200,2]]}`|
|601|`{"item":20133200,"is_special":true,"count":1,"version":6,"award_list":[[20143200,1]]}`|
|602|`{"item":101500,"is_special":false,"count":1314,"version":6,"award_list":[[101500,1314]]}`|
|603|`{"item":4251200,"is_special":false,"count":1,"version":6,"award_list":[[4251200,1]]}`|
|604|`{"item":360908,"is_special":true,"count":1,"version":6,"award_list":[[360908,1]]}`|
|605|`{"item":20400504,"is_special":true,"count":80,"version":6,"award_list":[[20400504,80]]}`|
|606|`{"item":4251200,"is_special":false,"count":1,"version":6,"award_list":[[4251200,1]]}`|
|607|`{"item":1321200,"is_special":false,"count":1,"version":6,"award_list":[[1321200,1]]}`|
|608|`{"item":4251200,"is_special":false,"count":2,"version":6,"award_list":[[4251200,2]]}`|
|609|`{"item":19002,"is_special":false,"count":3,"version":6,"award_list":[[19002,3]]}`|
|610|`{"item":4251200,"is_special":false,"count":2,"version":6,"award_list":[[4251200,2]]}`|
|701|`{"item":20133200,"is_special":false,"count":1,"version":7,"award_list":[[20143200,1]]}`|
|702|`{"item":101500,"is_special":false,"count":1314,"version":7,"award_list":[[101500,1314]]}`|
|703|`{"item":4251200,"is_special":false,"count":1,"version":7,"award_list":[[4251200,1]]}`|
|704|`{"item":360908,"is_special":false,"count":1,"version":7,"award_list":[[360908,1]]}`|
|705|`{"item":20400504,"is_special":false,"count":80,"version":7,"award_list":[[20400504,80]]}`|
|706|`{"item":4251200,"is_special":false,"count":1,"version":7,"award_list":[[4251200,1]]}`|
|707|`{"item":1321200,"is_special":false,"count":1,"version":7,"award_list":[[1321200,1]]}`|
|708|`{"item":4251200,"is_special":false,"count":2,"version":7,"award_list":[[4251200,2]]}`|
|709|`{"item":19002,"is_special":false,"count":3,"version":7,"award_list":[[19002,3]]}`|
|710|`{"item":4251200,"is_special":false,"count":2,"version":7,"award_list":[[4251200,2]]}`|
|801|`{"item":101500,"is_special":false,"count":1314,"version":8,"award_list":[[101500,1314]]}`|
|802|`{"item":4251200,"is_special":false,"count":1,"version":8,"award_list":[[4251200,1]]}`|
|803|`{"item":4251200,"is_special":false,"count":2,"version":8,"award_list":[[4251200,2]]}`|
|804|`{"item":101500,"is_special":false,"count":888,"version":8,"award_list":[[101500,888]]}`|
|805|`{"item":4251200,"is_special":false,"count":2,"version":8,"award_list":[[4251200,2]]}`|
|901|`{"item":101500,"is_special":false,"count":1314,"version":9,"award_list":[[101500,1314]]}`|
|902|`{"item":4241200,"is_special":false,"count":1,"version":9,"award_list":[[4241200,1]]}`|
|903|`{"item":4241200,"is_special":false,"count":2,"version":9,"award_list":[[4241200,2]]}`|
|904|`{"item":101500,"is_special":false,"count":888,"version":9,"award_list":[[101500,888]]}`|
|905|`{"item":4241200,"is_special":false,"count":2,"version":9,"award_list":[[4241200,2]]}`|
|1001|`{"item":4251200,"is_special":false,"count":1,"version":10,"award_list":[[4251200,1]]}`|
|1002|`{"item":101500,"is_special":false,"count":888,"version":10,"award_list":[[101500,888]]}`|
|1003|`{"item":4251200,"is_special":false,"count":1,"version":10,"award_list":[[4251200,1]]}`|
|1004|`{"item":1321200,"is_special":false,"count":1,"version":10,"award_list":[[1321200,1]]}`|
|1005|`{"item":4251200,"is_special":false,"count":1,"version":10,"award_list":[[4251200,1]]}`|
|1006|`{"item":101500,"is_special":false,"count":888,"version":10,"award_list":[[101500,888]]}`|
|1007|`{"item":19002,"is_special":false,"count":3,"version":10,"award_list":[[19002,3]]}`|
|1008|`{"item":4251200,"is_special":false,"count":2,"version":10,"award_list":[[4251200,2]]}`|
|1009|`{"item":101500,"is_special":false,"count":888,"version":10,"award_list":[[101500,888]]}`|
|1010|`{"item":4251200,"is_special":false,"count":2,"version":10,"award_list":[[4251200,2]]}`|

## FestivalSignShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|10|本表行键；与其他表同值不自动代表同一对象。|
|prefab|string|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|role_icon|string|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|
|6|`{}`|
|7|`{}`|
|8|`{}`|
|9|`{}`|
|10|`{}`|
