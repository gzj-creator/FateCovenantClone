# MonthPermitTable 规则参数

来源：[personal-server/assets/tables/MonthPermitTable.data.lua.json.gz](../../../../personal-server/assets/tables/MonthPermitTable.data.lua.json.gz)，SHA256：`550c77b9604e8a148eef462e422ccaa2c6834d2ed99ab84250e97ee28ce98848`。

[完整逐行JSON](MonthPermitTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[TaskType](#tasktype)|3|decoded-rows|
|[Task](#task)|168|decoded-rows|
|[LvName](#lvname)|0|decoded-rows|
|[UpLv](#uplv)|90|decoded-rows|
|[Gear](#gear)|36|decoded-rows|
|[Cycle](#cycle)|8|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[GearLv](#gearlv)|1440|decoded-rows|
|[BuyExp](#buyexp)|4|decoded-rows|

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

## Task

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|day_type|number|168|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|priority|number|168|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|add_exp|number|168|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|168|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|168|本表行键；与其他表同值不自动代表同一对象。|
|version|number|168|版本引用；必须按活动类型及其消费者查对应版本表。|
|task_param|number|168|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|target_count|number|168|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"day_type":1,"add_exp":50,"type":4701,"version":1,"task_param":0,"target_count":100}`|
|102|`{"day_type":1,"add_exp":50,"type":100801,"version":1,"task_param":0,"target_count":1}`|
|103|`{"day_type":1,"add_exp":100,"type":1002,"version":1,"task_param":0,"target_count":10}`|
|104|`{"day_type":1,"add_exp":100,"type":1402,"version":1,"task_param":0,"target_count":5}`|
|105|`{"day_type":1,"add_exp":100,"type":6509,"version":1,"task_param":0,"target_count":1}`|
|106|`{"day_type":1,"add_exp":100,"type":8103,"version":1,"task_param":0,"target_count":5}`|
|107|`{"day_type":1,"add_exp":100,"type":100803,"version":1,"task_param":0,"target_count":3}`|
|108|`{"day_type":1,"add_exp":50,"type":100805,"version":1,"task_param":0,"target_count":3}`|
|109|`{"day_type":1,"add_exp":50,"type":2407,"version":1,"task_param":0,"target_count":3}`|
|201|`{"day_type":2,"add_exp":300,"type":100806,"version":1,"task_param":0,"target_count":6}`|
|202|`{"day_type":2,"add_exp":500,"type":8301,"version":1,"task_param":0,"target_count":5000}`|
|203|`{"day_type":2,"add_exp":300,"type":1003,"version":1,"task_param":0,"target_count":50}`|
|204|`{"day_type":2,"add_exp":1000,"type":1,"version":1,"task_param":0,"target_count":20000}`|
|205|`{"day_type":2,"add_exp":500,"type":100809,"version":1,"task_param":0,"target_count":70}`|
|206|`{"day_type":2,"add_exp":300,"type":100810,"version":1,"task_param":0,"target_count":5}`|
|207|`{"day_type":2,"add_exp":300,"type":100804,"version":1,"task_param":0,"target_count":30}`|
|301|`{"day_type":3,"add_exp":3000,"type":12403,"version":1,"task_param":0,"target_count":106}`|
|302|`{"day_type":3,"add_exp":5000,"type":100807,"version":1,"task_param":0,"target_count":4}`|
|303|`{"day_type":3,"add_exp":3000,"type":8303,"version":1,"task_param":0,"target_count":25000}`|
|304|`{"day_type":3,"add_exp":1500,"type":100808,"version":1,"task_param":0,"target_count":1}`|
|305|`{"day_type":3,"add_exp":3000,"type":7001,"version":1,"task_param":0,"target_count":13}`|
|1011|`{"day_type":1,"add_exp":50,"type":4701,"version":2,"task_param":0,"target_count":100}`|
|1012|`{"day_type":1,"add_exp":50,"type":100801,"version":2,"task_param":0,"target_count":1}`|
|1013|`{"day_type":1,"add_exp":100,"type":1002,"version":2,"task_param":0,"target_count":10}`|
|1014|`{"day_type":1,"add_exp":100,"type":1402,"version":2,"task_param":0,"target_count":5}`|
|1015|`{"day_type":1,"add_exp":100,"type":6509,"version":2,"task_param":0,"target_count":1}`|
|1016|`{"day_type":1,"add_exp":100,"type":8103,"version":2,"task_param":0,"target_count":5}`|
|1017|`{"day_type":1,"add_exp":100,"type":100803,"version":2,"task_param":0,"target_count":3}`|
|1018|`{"day_type":1,"add_exp":50,"type":100805,"version":2,"task_param":0,"target_count":3}`|
|1019|`{"day_type":1,"add_exp":50,"type":2407,"version":2,"task_param":0,"target_count":3}`|
|1201|`{"day_type":2,"add_exp":300,"type":100806,"version":2,"task_param":0,"target_count":6}`|
|1202|`{"day_type":2,"add_exp":500,"type":8303,"version":2,"task_param":0,"target_count":5000}`|
|1203|`{"day_type":2,"add_exp":300,"type":1003,"version":2,"task_param":0,"target_count":50}`|
|1204|`{"day_type":2,"add_exp":1000,"type":1,"version":2,"task_param":0,"target_count":20000}`|
|1205|`{"day_type":2,"add_exp":500,"type":100809,"version":2,"task_param":0,"target_count":70}`|
|1206|`{"day_type":2,"add_exp":300,"type":100810,"version":2,"task_param":0,"target_count":5}`|
|1207|`{"day_type":2,"add_exp":300,"type":100804,"version":2,"task_param":0,"target_count":30}`|
|1301|`{"day_type":3,"add_exp":3000,"type":12403,"version":2,"task_param":0,"target_count":106}`|
|1302|`{"day_type":3,"add_exp":5000,"type":100807,"version":2,"task_param":0,"target_count":4}`|
|1303|`{"day_type":3,"add_exp":3000,"type":8303,"version":2,"task_param":0,"target_count":25000}`|
|1304|`{"day_type":3,"add_exp":1500,"type":100808,"version":2,"task_param":0,"target_count":1}`|
|1305|`{"day_type":3,"add_exp":3000,"type":7001,"version":2,"task_param":0,"target_count":13}`|
|2011|`{"day_type":1,"add_exp":50,"type":4701,"version":3,"task_param":0,"target_count":100}`|
|2012|`{"day_type":1,"add_exp":50,"type":100801,"version":3,"task_param":0,"target_count":1}`|
|2013|`{"day_type":1,"add_exp":50,"type":1002,"version":3,"task_param":0,"target_count":10}`|
|2014|`{"day_type":1,"add_exp":50,"type":1402,"version":3,"task_param":0,"target_count":5}`|
|2015|`{"day_type":1,"add_exp":50,"type":6509,"version":3,"task_param":0,"target_count":1}`|
|2016|`{"day_type":1,"add_exp":50,"type":8103,"version":3,"task_param":0,"target_count":5}`|
|2017|`{"day_type":1,"add_exp":50,"type":100803,"version":3,"task_param":0,"target_count":3}`|
|2018|`{"day_type":1,"add_exp":50,"type":100805,"version":3,"task_param":0,"target_count":3}`|
|2019|`{"day_type":1,"add_exp":50,"type":2407,"version":3,"task_param":0,"target_count":3}`|
|2201|`{"day_type":2,"add_exp":200,"type":100806,"version":3,"task_param":0,"target_count":6}`|
|2202|`{"day_type":2,"add_exp":500,"type":8303,"version":3,"task_param":0,"target_count":5000}`|
|2203|`{"day_type":2,"add_exp":300,"type":1003,"version":3,"task_param":0,"target_count":50}`|
|2204|`{"day_type":2,"add_exp":500,"type":1,"version":3,"task_param":0,"target_count":20000}`|
|2205|`{"day_type":2,"add_exp":300,"type":100809,"version":3,"task_param":0,"target_count":70}`|
|2206|`{"day_type":2,"add_exp":200,"type":100810,"version":3,"task_param":0,"target_count":5}`|
|2207|`{"day_type":2,"add_exp":200,"type":100804,"version":3,"task_param":0,"target_count":30}`|
|2301|`{"day_type":3,"add_exp":1500,"type":12403,"version":3,"task_param":0,"target_count":106}`|
|2302|`{"day_type":3,"add_exp":2800,"type":1,"version":3,"task_param":0,"target_count":100000}`|
|2303|`{"day_type":3,"add_exp":2800,"type":8303,"version":3,"task_param":0,"target_count":25000}`|
|2304|`{"day_type":3,"add_exp":1500,"type":100808,"version":3,"task_param":0,"target_count":1}`|
|2305|`{"day_type":3,"add_exp":1500,"type":7001,"version":3,"task_param":0,"target_count":13}`|
|3001|`{"day_type":1,"add_exp":50,"type":4701,"version":4,"task_param":0,"target_count":100}`|
|3002|`{"day_type":1,"add_exp":50,"type":100801,"version":4,"task_param":0,"target_count":1}`|
|3003|`{"day_type":1,"add_exp":100,"type":1002,"version":4,"task_param":0,"target_count":10}`|
|3004|`{"day_type":1,"add_exp":100,"type":1402,"version":4,"task_param":0,"target_count":5}`|
|3005|`{"day_type":1,"add_exp":100,"type":6509,"version":4,"task_param":0,"target_count":1}`|
|3006|`{"day_type":1,"add_exp":100,"type":8103,"version":4,"task_param":0,"target_count":5}`|
|3007|`{"day_type":1,"add_exp":100,"type":100803,"version":4,"task_param":0,"target_count":3}`|
|3008|`{"day_type":1,"add_exp":50,"type":100805,"version":4,"task_param":0,"target_count":3}`|
|3009|`{"day_type":1,"add_exp":50,"type":2407,"version":4,"task_param":0,"target_count":3}`|
|3010|`{"day_type":2,"add_exp":300,"type":100806,"version":4,"task_param":0,"target_count":6}`|
|3011|`{"day_type":2,"add_exp":500,"type":8301,"version":4,"task_param":0,"target_count":5000}`|
|3012|`{"day_type":2,"add_exp":300,"type":1003,"version":4,"task_param":0,"target_count":50}`|
|3013|`{"day_type":2,"add_exp":1000,"type":1,"version":4,"task_param":0,"target_count":20000}`|
|3014|`{"day_type":2,"add_exp":500,"type":100809,"version":4,"task_param":0,"target_count":70}`|
|3015|`{"day_type":2,"add_exp":300,"type":100810,"version":4,"task_param":0,"target_count":5}`|
|3016|`{"day_type":2,"add_exp":300,"type":100804,"version":4,"task_param":0,"target_count":30}`|
|3017|`{"day_type":3,"add_exp":3000,"type":12403,"version":4,"task_param":0,"target_count":106}`|
|3018|`{"day_type":3,"add_exp":5000,"type":100807,"version":4,"task_param":0,"target_count":4}`|
|3019|`{"day_type":3,"add_exp":3000,"type":8303,"version":4,"task_param":0,"target_count":25000}`|
|3020|`{"day_type":3,"add_exp":1500,"type":100808,"version":4,"task_param":0,"target_count":1}`|
|3021|`{"day_type":3,"add_exp":3000,"type":7001,"version":4,"task_param":0,"target_count":13}`|
|4001|`{"day_type":1,"add_exp":50,"type":4701,"version":5,"task_param":0,"target_count":100}`|
|4002|`{"day_type":1,"add_exp":50,"type":100801,"version":5,"task_param":0,"target_count":1}`|
|4003|`{"day_type":1,"add_exp":50,"type":1002,"version":5,"task_param":0,"target_count":10}`|
|4004|`{"day_type":1,"add_exp":50,"type":1402,"version":5,"task_param":0,"target_count":5}`|
|4005|`{"day_type":1,"add_exp":50,"type":6509,"version":5,"task_param":0,"target_count":1}`|
|4006|`{"day_type":1,"add_exp":50,"type":8103,"version":5,"task_param":0,"target_count":5}`|
|4007|`{"day_type":1,"add_exp":50,"type":100803,"version":5,"task_param":0,"target_count":3}`|
|4008|`{"day_type":1,"add_exp":50,"type":100805,"version":5,"task_param":0,"target_count":3}`|
|4009|`{"day_type":1,"add_exp":50,"type":2407,"version":5,"task_param":0,"target_count":3}`|
|4010|`{"day_type":2,"add_exp":200,"type":100806,"version":5,"task_param":0,"target_count":6}`|
|4011|`{"day_type":2,"add_exp":500,"type":8303,"version":5,"task_param":0,"target_count":5000}`|
|4012|`{"day_type":2,"add_exp":300,"type":1003,"version":5,"task_param":0,"target_count":50}`|
|4013|`{"day_type":2,"add_exp":500,"type":1,"version":5,"task_param":0,"target_count":20000}`|
|4014|`{"day_type":2,"add_exp":300,"type":100809,"version":5,"task_param":0,"target_count":70}`|
|4015|`{"day_type":2,"add_exp":200,"type":100810,"version":5,"task_param":0,"target_count":5}`|
|4016|`{"day_type":2,"add_exp":200,"type":100804,"version":5,"task_param":0,"target_count":30}`|
|4017|`{"day_type":3,"add_exp":1500,"type":12403,"version":5,"task_param":0,"target_count":106}`|
|4018|`{"day_type":3,"add_exp":2800,"type":1,"version":5,"task_param":0,"target_count":100000}`|
|4019|`{"day_type":3,"add_exp":2800,"type":8303,"version":5,"task_param":0,"target_count":25000}`|
|4020|`{"day_type":3,"add_exp":1500,"type":100808,"version":5,"task_param":0,"target_count":1}`|
|4021|`{"day_type":3,"add_exp":1500,"type":7001,"version":5,"task_param":0,"target_count":13}`|
|5001|`{"day_type":1,"add_exp":50,"type":4701,"version":6,"task_param":0,"target_count":100}`|
|5002|`{"day_type":1,"add_exp":50,"type":100801,"version":6,"task_param":0,"target_count":1}`|
|5003|`{"day_type":1,"add_exp":50,"type":1002,"version":6,"task_param":0,"target_count":10}`|
|5004|`{"day_type":1,"add_exp":50,"type":1402,"version":6,"task_param":0,"target_count":5}`|
|5005|`{"day_type":1,"add_exp":50,"type":6509,"version":6,"task_param":0,"target_count":1}`|
|5006|`{"day_type":1,"add_exp":50,"type":8103,"version":6,"task_param":0,"target_count":5}`|
|5007|`{"day_type":1,"add_exp":50,"type":100803,"version":6,"task_param":0,"target_count":3}`|
|5008|`{"day_type":1,"add_exp":50,"type":100805,"version":6,"task_param":0,"target_count":3}`|
|5009|`{"day_type":1,"add_exp":50,"type":2407,"version":6,"task_param":0,"target_count":3}`|
|5010|`{"day_type":2,"add_exp":200,"type":100813,"version":6,"task_param":0,"target_count":5}`|
|5011|`{"day_type":2,"add_exp":500,"type":100814,"version":6,"task_param":0,"target_count":5}`|
|5012|`{"day_type":2,"add_exp":300,"type":1003,"version":6,"task_param":0,"target_count":50}`|
|5013|`{"day_type":2,"add_exp":500,"type":1,"version":6,"task_param":0,"target_count":20000}`|
|5014|`{"day_type":2,"add_exp":300,"type":100809,"version":6,"task_param":0,"target_count":70}`|
|5015|`{"day_type":2,"add_exp":200,"type":100810,"version":6,"task_param":0,"target_count":5}`|
|5016|`{"day_type":2,"add_exp":200,"type":100804,"version":6,"task_param":0,"target_count":30}`|
|5017|`{"day_type":3,"add_exp":1500,"type":100811,"version":6,"task_param":0,"target_count":1}`|
|5018|`{"day_type":3,"add_exp":2800,"type":1,"version":6,"task_param":0,"target_count":100000}`|
|5019|`{"day_type":3,"add_exp":2800,"type":8303,"version":6,"task_param":0,"target_count":25000}`|
|5020|`{"day_type":3,"add_exp":1500,"type":100815,"version":6,"task_param":0,"target_count":250}`|
|5021|`{"day_type":3,"add_exp":1500,"type":100812,"version":6,"task_param":0,"target_count":1}`|
|6001|`{"day_type":1,"add_exp":50,"type":4701,"version":7,"task_param":0,"target_count":100}`|
|6002|`{"day_type":1,"add_exp":50,"type":100801,"version":7,"task_param":0,"target_count":1}`|
|6003|`{"day_type":1,"add_exp":50,"type":1002,"version":7,"task_param":0,"target_count":10}`|
|6004|`{"day_type":1,"add_exp":50,"type":1402,"version":7,"task_param":0,"target_count":5}`|
|6005|`{"day_type":1,"add_exp":50,"type":6509,"version":7,"task_param":0,"target_count":1}`|
|6006|`{"day_type":1,"add_exp":50,"type":8103,"version":7,"task_param":0,"target_count":5}`|
|6007|`{"day_type":1,"add_exp":50,"type":100803,"version":7,"task_param":0,"target_count":3}`|
|6008|`{"day_type":1,"add_exp":50,"type":100805,"version":7,"task_param":0,"target_count":3}`|
|6009|`{"day_type":1,"add_exp":50,"type":2407,"version":7,"task_param":0,"target_count":3}`|
|6010|`{"day_type":2,"add_exp":200,"type":100813,"version":7,"task_param":0,"target_count":5}`|
|6011|`{"day_type":2,"add_exp":500,"type":100814,"version":7,"task_param":0,"target_count":5}`|
|6012|`{"day_type":2,"add_exp":300,"type":1003,"version":7,"task_param":0,"target_count":50}`|
|6013|`{"day_type":2,"add_exp":500,"type":1,"version":7,"task_param":0,"target_count":20000}`|
|6014|`{"day_type":2,"add_exp":300,"type":100809,"version":7,"task_param":0,"target_count":70}`|
|6015|`{"day_type":2,"add_exp":200,"type":100810,"version":7,"task_param":0,"target_count":5}`|
|6016|`{"day_type":2,"add_exp":200,"type":100804,"version":7,"task_param":0,"target_count":30}`|
|6017|`{"day_type":3,"add_exp":1500,"type":100811,"version":7,"task_param":0,"target_count":1}`|
|6018|`{"day_type":3,"add_exp":2800,"type":1,"version":7,"task_param":0,"target_count":100000}`|
|6019|`{"day_type":3,"add_exp":2800,"type":8303,"version":7,"task_param":0,"target_count":25000}`|
|6020|`{"day_type":3,"add_exp":1500,"type":100815,"version":7,"task_param":0,"target_count":250}`|
|6021|`{"day_type":3,"add_exp":1500,"type":100812,"version":7,"task_param":0,"target_count":1}`|
|7001|`{"day_type":1,"add_exp":100,"type":4701,"version":8,"task_param":0,"target_count":100}`|
|7002|`{"day_type":1,"add_exp":100,"type":100801,"version":8,"task_param":0,"target_count":1}`|
|7003|`{"day_type":1,"add_exp":100,"type":1002,"version":8,"task_param":0,"target_count":10}`|
|7004|`{"day_type":1,"add_exp":100,"type":1402,"version":8,"task_param":0,"target_count":5}`|
|7005|`{"day_type":1,"add_exp":100,"type":6509,"version":8,"task_param":0,"target_count":1}`|
|7006|`{"day_type":1,"add_exp":100,"type":8103,"version":8,"task_param":0,"target_count":5}`|
|7007|`{"day_type":1,"add_exp":100,"type":100803,"version":8,"task_param":0,"target_count":3}`|
|7008|`{"day_type":1,"add_exp":50,"type":100805,"version":8,"task_param":0,"target_count":3}`|
|7009|`{"day_type":1,"add_exp":50,"type":2407,"version":8,"task_param":0,"target_count":3}`|
|7010|`{"day_type":2,"add_exp":300,"type":100806,"version":8,"task_param":0,"target_count":6}`|
|7011|`{"day_type":2,"add_exp":500,"type":8301,"version":8,"task_param":0,"target_count":5000}`|
|7012|`{"day_type":2,"add_exp":300,"type":1003,"version":8,"task_param":0,"target_count":50}`|
|7013|`{"day_type":2,"add_exp":1000,"type":1,"version":8,"task_param":0,"target_count":20000}`|
|7014|`{"day_type":2,"add_exp":500,"type":100809,"version":8,"task_param":0,"target_count":70}`|
|7015|`{"day_type":2,"add_exp":300,"type":100810,"version":8,"task_param":0,"target_count":5}`|
|7016|`{"day_type":2,"add_exp":300,"type":100804,"version":8,"task_param":0,"target_count":30}`|
|7017|`{"day_type":3,"add_exp":3000,"type":12403,"version":8,"task_param":0,"target_count":106}`|
|7018|`{"day_type":3,"add_exp":5000,"type":100807,"version":8,"task_param":0,"target_count":4}`|
|7019|`{"day_type":3,"add_exp":3000,"type":8303,"version":8,"task_param":0,"target_count":25000}`|
|7020|`{"day_type":3,"add_exp":3000,"type":100808,"version":8,"task_param":0,"target_count":1}`|
|7021|`{"day_type":3,"add_exp":3000,"type":7001,"version":8,"task_param":0,"target_count":13}`|

## LvName

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## UpLv

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|need_lv|number|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|90|本表行键；与其他表同值不自动代表同一对象。|
|lib|number|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_big_award|boolean|90|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|exp|number|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"need_lv":1,"lib":1,"is_big_award":false,"exp":1000}`|
|102|`{"need_lv":2,"lib":1,"is_big_award":false,"exp":2000}`|
|103|`{"need_lv":3,"lib":1,"is_big_award":false,"exp":3000}`|
|104|`{"need_lv":4,"lib":1,"is_big_award":false,"exp":4000}`|
|105|`{"need_lv":5,"lib":1,"is_big_award":false,"exp":5000}`|
|106|`{"need_lv":6,"lib":1,"is_big_award":false,"exp":6000}`|
|107|`{"need_lv":7,"lib":1,"is_big_award":false,"exp":7000}`|
|108|`{"need_lv":8,"lib":1,"is_big_award":false,"exp":8000}`|
|109|`{"need_lv":9,"lib":1,"is_big_award":false,"exp":9000}`|
|110|`{"need_lv":10,"lib":1,"is_big_award":true,"exp":10000}`|
|111|`{"need_lv":11,"lib":1,"is_big_award":false,"exp":11000}`|
|112|`{"need_lv":12,"lib":1,"is_big_award":false,"exp":12000}`|
|113|`{"need_lv":13,"lib":1,"is_big_award":false,"exp":13000}`|
|114|`{"need_lv":14,"lib":1,"is_big_award":false,"exp":14000}`|
|115|`{"need_lv":15,"lib":1,"is_big_award":false,"exp":15000}`|
|116|`{"need_lv":16,"lib":1,"is_big_award":false,"exp":16000}`|
|117|`{"need_lv":17,"lib":1,"is_big_award":false,"exp":17000}`|
|118|`{"need_lv":18,"lib":1,"is_big_award":false,"exp":18000}`|
|119|`{"need_lv":19,"lib":1,"is_big_award":false,"exp":19000}`|
|120|`{"need_lv":20,"lib":1,"is_big_award":true,"exp":20000}`|
|121|`{"need_lv":21,"lib":1,"is_big_award":false,"exp":21000}`|
|122|`{"need_lv":22,"lib":1,"is_big_award":false,"exp":22000}`|
|123|`{"need_lv":23,"lib":1,"is_big_award":false,"exp":23000}`|
|124|`{"need_lv":24,"lib":1,"is_big_award":false,"exp":24000}`|
|125|`{"need_lv":25,"lib":1,"is_big_award":false,"exp":25000}`|
|126|`{"need_lv":26,"lib":1,"is_big_award":false,"exp":26000}`|
|127|`{"need_lv":27,"lib":1,"is_big_award":false,"exp":27000}`|
|128|`{"need_lv":28,"lib":1,"is_big_award":false,"exp":28000}`|
|129|`{"need_lv":29,"lib":1,"is_big_award":false,"exp":29000}`|
|130|`{"need_lv":30,"lib":1,"is_big_award":true,"exp":30000}`|
|131|`{"need_lv":31,"lib":1,"is_big_award":false,"exp":33000}`|
|132|`{"need_lv":32,"lib":1,"is_big_award":false,"exp":36000}`|
|133|`{"need_lv":33,"lib":1,"is_big_award":false,"exp":39000}`|
|134|`{"need_lv":34,"lib":1,"is_big_award":false,"exp":42000}`|
|135|`{"need_lv":35,"lib":1,"is_big_award":false,"exp":45000}`|
|136|`{"need_lv":36,"lib":1,"is_big_award":false,"exp":48000}`|
|137|`{"need_lv":37,"lib":1,"is_big_award":false,"exp":51000}`|
|138|`{"need_lv":38,"lib":1,"is_big_award":false,"exp":54000}`|
|139|`{"need_lv":39,"lib":1,"is_big_award":false,"exp":57000}`|
|140|`{"need_lv":40,"lib":1,"is_big_award":false,"exp":60000}`|
|201|`{"need_lv":1,"lib":2,"is_big_award":false,"exp":1000}`|
|202|`{"need_lv":2,"lib":2,"is_big_award":false,"exp":2000}`|
|203|`{"need_lv":3,"lib":2,"is_big_award":false,"exp":3000}`|
|204|`{"need_lv":4,"lib":2,"is_big_award":false,"exp":4000}`|
|205|`{"need_lv":5,"lib":2,"is_big_award":false,"exp":5000}`|
|206|`{"need_lv":6,"lib":2,"is_big_award":false,"exp":6000}`|
|207|`{"need_lv":7,"lib":2,"is_big_award":false,"exp":7000}`|
|208|`{"need_lv":8,"lib":2,"is_big_award":false,"exp":8000}`|
|209|`{"need_lv":9,"lib":2,"is_big_award":false,"exp":9000}`|
|210|`{"need_lv":10,"lib":2,"is_big_award":true,"exp":10000}`|
|211|`{"need_lv":11,"lib":2,"is_big_award":false,"exp":11000}`|
|212|`{"need_lv":12,"lib":2,"is_big_award":false,"exp":12000}`|
|213|`{"need_lv":13,"lib":2,"is_big_award":false,"exp":13000}`|
|214|`{"need_lv":14,"lib":2,"is_big_award":false,"exp":14000}`|
|215|`{"need_lv":15,"lib":2,"is_big_award":false,"exp":15000}`|
|216|`{"need_lv":16,"lib":2,"is_big_award":false,"exp":16000}`|
|217|`{"need_lv":17,"lib":2,"is_big_award":false,"exp":17000}`|
|218|`{"need_lv":18,"lib":2,"is_big_award":false,"exp":18000}`|
|219|`{"need_lv":19,"lib":2,"is_big_award":false,"exp":19000}`|
|220|`{"need_lv":20,"lib":2,"is_big_award":true,"exp":20000}`|
|221|`{"need_lv":21,"lib":2,"is_big_award":false,"exp":21000}`|
|222|`{"need_lv":22,"lib":2,"is_big_award":false,"exp":22000}`|
|223|`{"need_lv":23,"lib":2,"is_big_award":false,"exp":23000}`|
|224|`{"need_lv":24,"lib":2,"is_big_award":false,"exp":24000}`|
|225|`{"need_lv":25,"lib":2,"is_big_award":false,"exp":25000}`|
|226|`{"need_lv":26,"lib":2,"is_big_award":false,"exp":26000}`|
|227|`{"need_lv":27,"lib":2,"is_big_award":false,"exp":27000}`|
|228|`{"need_lv":28,"lib":2,"is_big_award":false,"exp":28000}`|
|229|`{"need_lv":29,"lib":2,"is_big_award":false,"exp":29000}`|
|230|`{"need_lv":30,"lib":2,"is_big_award":true,"exp":30000}`|
|231|`{"need_lv":31,"lib":2,"is_big_award":false,"exp":32000}`|
|232|`{"need_lv":32,"lib":2,"is_big_award":false,"exp":34000}`|
|233|`{"need_lv":33,"lib":2,"is_big_award":false,"exp":36000}`|
|234|`{"need_lv":34,"lib":2,"is_big_award":false,"exp":38000}`|
|235|`{"need_lv":35,"lib":2,"is_big_award":false,"exp":40000}`|
|236|`{"need_lv":36,"lib":2,"is_big_award":false,"exp":42000}`|
|237|`{"need_lv":37,"lib":2,"is_big_award":false,"exp":44000}`|
|238|`{"need_lv":38,"lib":2,"is_big_award":false,"exp":46000}`|
|239|`{"need_lv":39,"lib":2,"is_big_award":false,"exp":48000}`|
|240|`{"need_lv":40,"lib":2,"is_big_award":false,"exp":50000}`|
|301|`{"need_lv":1,"lib":3,"is_big_award":false,"exp":1000}`|
|302|`{"need_lv":2,"lib":3,"is_big_award":false,"exp":2000}`|
|303|`{"need_lv":3,"lib":3,"is_big_award":false,"exp":3000}`|
|304|`{"need_lv":4,"lib":3,"is_big_award":false,"exp":4000}`|
|305|`{"need_lv":5,"lib":3,"is_big_award":false,"exp":5000}`|
|306|`{"need_lv":6,"lib":3,"is_big_award":false,"exp":6000}`|
|307|`{"need_lv":7,"lib":3,"is_big_award":false,"exp":7000}`|
|308|`{"need_lv":8,"lib":3,"is_big_award":false,"exp":8000}`|
|309|`{"need_lv":9,"lib":3,"is_big_award":false,"exp":9000}`|
|310|`{"need_lv":10,"lib":3,"is_big_award":true,"exp":10000}`|

## Gear

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|version|number|36|版本引用；必须按活动类型及其消费者查对应版本表。|
|buy_add_exp|number|36|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|add_exp_rage|number|36|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|add_max_exp|number|36|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|tid|number|36|本表行键；与其他表同值不自动代表同一对象。|
|recharge|number|36|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"version":1,"buy_add_exp":0,"add_exp_rage":0,"add_max_exp":0}`|
|2|`{"version":1,"buy_add_exp":1000,"add_exp_rage":1000,"add_max_exp":1000}`|
|3|`{"version":1,"buy_add_exp":2000,"add_exp_rage":1000,"add_max_exp":1000}`|
|4|`{"version":1,"buy_add_exp":3000,"add_exp_rage":1000,"add_max_exp":1000}`|
|5|`{"version":1,"buy_add_exp":4000,"add_exp_rage":1000,"add_max_exp":1000}`|
|11|`{"version":2,"buy_add_exp":0,"add_exp_rage":0,"add_max_exp":0}`|
|12|`{"version":2,"buy_add_exp":1000,"add_exp_rage":1000,"add_max_exp":1000}`|
|13|`{"version":2,"buy_add_exp":2000,"add_exp_rage":1000,"add_max_exp":1000}`|
|14|`{"version":2,"buy_add_exp":3000,"add_exp_rage":1000,"add_max_exp":1000}`|
|15|`{"version":2,"buy_add_exp":4000,"add_exp_rage":1000,"add_max_exp":1000}`|
|21|`{"version":3,"buy_add_exp":0,"add_exp_rage":0,"add_max_exp":0}`|
|22|`{"version":3,"buy_add_exp":1000,"add_exp_rage":1000,"add_max_exp":1000}`|
|23|`{"version":3,"buy_add_exp":1000,"add_exp_rage":1000,"add_max_exp":1000}`|
|24|`{"version":3,"buy_add_exp":2000,"add_exp_rage":1000,"add_max_exp":1000}`|
|25|`{"version":3,"buy_add_exp":2000,"add_exp_rage":1000,"add_max_exp":1000}`|
|31|`{"version":4,"buy_add_exp":0,"add_exp_rage":0,"add_max_exp":0}`|
|32|`{"version":4,"buy_add_exp":1000,"add_exp_rage":1000,"add_max_exp":1000}`|
|33|`{"version":4,"buy_add_exp":2000,"add_exp_rage":1000,"add_max_exp":1000}`|
|34|`{"version":4,"buy_add_exp":3000,"add_exp_rage":1000,"add_max_exp":1000}`|
|35|`{"version":4,"buy_add_exp":4000,"add_exp_rage":1000,"add_max_exp":1000}`|
|41|`{"version":5,"buy_add_exp":0,"add_exp_rage":0,"add_max_exp":0}`|
|42|`{"version":5,"buy_add_exp":1000,"add_exp_rage":1000,"add_max_exp":1000}`|
|43|`{"version":5,"buy_add_exp":1000,"add_exp_rage":1000,"add_max_exp":1000}`|
|44|`{"version":5,"buy_add_exp":2000,"add_exp_rage":1000,"add_max_exp":1000}`|
|45|`{"version":5,"buy_add_exp":2000,"add_exp_rage":1000,"add_max_exp":1000}`|
|51|`{"version":6,"buy_add_exp":0,"add_exp_rage":0,"add_max_exp":0}`|
|52|`{"version":6,"buy_add_exp":1000,"add_exp_rage":1000,"add_max_exp":1000}`|
|53|`{"version":6,"buy_add_exp":2000,"add_exp_rage":1000,"add_max_exp":1000}`|
|61|`{"version":7,"buy_add_exp":0,"add_exp_rage":0,"add_max_exp":0}`|
|62|`{"version":7,"buy_add_exp":1000,"add_exp_rage":1000,"add_max_exp":1000}`|
|63|`{"version":7,"buy_add_exp":2000,"add_exp_rage":1000,"add_max_exp":1000}`|
|71|`{"version":8,"buy_add_exp":0,"add_exp_rage":0,"add_max_exp":0}`|
|72|`{"version":8,"buy_add_exp":1000,"add_exp_rage":1000,"add_max_exp":1000}`|
|73|`{"version":8,"buy_add_exp":2000,"add_exp_rage":1000,"add_max_exp":1000}`|
|74|`{"version":8,"buy_add_exp":3000,"add_exp_rage":1000,"add_max_exp":1000}`|
|75|`{"version":8,"buy_add_exp":4000,"add_exp_rage":1000,"add_max_exp":1000}`|

## Cycle

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|exp_param|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|settle_mail|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|last_buy_exp_day|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|week_add_exp|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|8|本表行键；与其他表同值不自动代表同一对象。|
|recharge|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|exp_item|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tip_buy_exp_day|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lv_below|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|login_add_exp|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|buy_max_lv|number|8|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|buy_exp_lib|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|up_lv_lib|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|go_func|undefined|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|func_open|number|8|完整功能开放ID；条件见功能开放附录，不能直接当等级。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"exp_param":161033,"last_buy_exp_day":7,"week_add_exp":10000,"exp_item":10004200,"tip_buy_exp_day":3,"lv_below":30,"login_add_exp":1000,"buy_max_lv":30,"buy_exp_lib":1,"up_lv_lib":1,"func_open":1552}`|
|2|`{"exp_param":161033,"last_buy_exp_day":7,"week_add_exp":10000,"exp_item":10004200,"tip_buy_exp_day":3,"lv_below":30,"login_add_exp":1000,"buy_max_lv":30,"buy_exp_lib":1,"up_lv_lib":1,"func_open":1552}`|
|3|`{"exp_param":161033,"last_buy_exp_day":7,"week_add_exp":10000,"exp_item":10004200,"tip_buy_exp_day":3,"lv_below":30,"login_add_exp":1000,"buy_max_lv":30,"buy_exp_lib":2,"up_lv_lib":2,"func_open":1552}`|
|4|`{"exp_param":161033,"last_buy_exp_day":7,"week_add_exp":10000,"exp_item":10004200,"tip_buy_exp_day":3,"lv_below":30,"login_add_exp":1000,"buy_max_lv":30,"buy_exp_lib":1,"up_lv_lib":1,"func_open":1552}`|
|5|`{"exp_param":161033,"last_buy_exp_day":7,"week_add_exp":10000,"exp_item":10004200,"tip_buy_exp_day":3,"lv_below":30,"login_add_exp":1000,"buy_max_lv":30,"buy_exp_lib":2,"up_lv_lib":2,"func_open":1552}`|
|6|`{"exp_param":161033,"last_buy_exp_day":7,"week_add_exp":10000,"exp_item":10014200,"tip_buy_exp_day":3,"lv_below":30,"login_add_exp":1000,"buy_max_lv":30,"buy_exp_lib":2,"up_lv_lib":2,"func_open":1552}`|
|7|`{"exp_param":161033,"last_buy_exp_day":7,"week_add_exp":10000,"exp_item":10014200,"tip_buy_exp_day":3,"lv_below":30,"login_add_exp":1000,"buy_max_lv":30,"buy_exp_lib":2,"up_lv_lib":2,"func_open":1552}`|
|8|`{"exp_param":161033,"last_buy_exp_day":7,"week_add_exp":10000,"exp_item":10004200,"tip_buy_exp_day":3,"lv_below":30,"login_add_exp":1000,"buy_max_lv":30,"buy_exp_lib":1,"up_lv_lib":1,"func_open":1552}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|over_mail_notice|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|over_mail_notice_day|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"over_mail_notice_day":3}`|

## GearLv

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1440|本表行键；与其他表同值不自动代表同一对象。|
|gear|number|1440|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|1440|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|level|number|1440|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部1440行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1101|`{"gear":1,"award":[[10054100,1]],"level":1}`|
|1102|`{"gear":1,"award":[[101500,100]],"level":2}`|
|1103|`{"gear":1,"award":[[201500,50000]],"level":3}`|

## BuyExp

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|buy_num|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|buy_exp_price|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lib|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|buy_exp_price_num|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|add_exp|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"buy_num":1,"buy_exp_price":101500,"lib":1,"buy_exp_price_num":3000,"add_exp":1000}`|
|2|`{"buy_num":30,"buy_exp_price":101500,"lib":1,"buy_exp_price_num":3000,"add_exp":1000}`|
|11|`{"buy_num":1,"buy_exp_price":101500,"lib":2,"buy_exp_price_num":3000,"add_exp":1000}`|
|12|`{"buy_num":30,"buy_exp_price":101500,"lib":2,"buy_exp_price_num":3000,"add_exp":1000}`|
