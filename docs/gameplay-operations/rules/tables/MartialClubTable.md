# MartialClubTable 规则参数

来源：[personal-server/assets/tables/MartialClubTable.data.lua.json.gz](../../../../personal-server/assets/tables/MartialClubTable.data.lua.json.gz)，SHA256：`13a0a022e6b4b64c819d71b4b89cb312312ec51bac8b98a2a7366f4c6a03a405`。

[完整逐行JSON](MartialClubTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Power](#power)|160|decoded-rows|
|[Team](#team)|80|decoded-rows|
|[HelpAward](#helpaward)|10|decoded-rows|
|[TeamBuff](#teambuff)|2|decoded-rows|
|[TeamConst](#teamconst)|1|decoded-rows|
|[TeamSkip](#teamskip)|1|decoded-rows|
|[EnterLimitType](#enterlimittype)|2|decoded-rows|
|[EmployThank](#employthank)|3|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[FightType](#fighttype)|3|decoded-rows|
|[BuyFight](#buyfight)|4|decoded-rows|
|[CountLib](#countlib)|15|decoded-rows|
|[Chapter](#chapter)|20|decoded-rows|
|[MartialClub](#martialclub)|80|decoded-rows|
|[AwardLib](#awardlib)|5666|decoded-rows|

## Power

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|160|本表行键；与其他表同值不自动代表同一对象。|
|martial_club|number|160|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|power_limit|number|160|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"power_limit":0}`|
|102|`{"power_limit":180000}`|
|103|`{"power_limit":240000}`|
|104|`{"power_limit":300000}`|
|201|`{"power_limit":0}`|
|202|`{"power_limit":220000}`|
|203|`{"power_limit":280000}`|
|204|`{"power_limit":340000}`|
|301|`{"power_limit":0}`|
|302|`{"power_limit":280000}`|
|303|`{"power_limit":410000}`|
|304|`{"power_limit":540000}`|
|401|`{"power_limit":0}`|
|402|`{"power_limit":410000}`|
|403|`{"power_limit":640000}`|
|404|`{"power_limit":870000}`|
|501|`{"power_limit":0}`|
|502|`{"power_limit":370000}`|
|503|`{"power_limit":530000}`|
|504|`{"power_limit":690000}`|
|601|`{"power_limit":0}`|
|602|`{"power_limit":530000}`|
|603|`{"power_limit":850000}`|
|604|`{"power_limit":1170000}`|
|701|`{"power_limit":0}`|
|702|`{"power_limit":850000}`|
|703|`{"power_limit":1250000}`|
|704|`{"power_limit":1650000}`|
|801|`{"power_limit":0}`|
|802|`{"power_limit":1250000}`|
|803|`{"power_limit":1650000}`|
|804|`{"power_limit":2050000}`|
|901|`{"power_limit":0}`|
|902|`{"power_limit":570000}`|
|903|`{"power_limit":750000}`|
|904|`{"power_limit":930000}`|
|1001|`{"power_limit":0}`|
|1002|`{"power_limit":750000}`|
|1003|`{"power_limit":1060000}`|
|1004|`{"power_limit":1370000}`|
|1101|`{"power_limit":0}`|
|1102|`{"power_limit":1060000}`|
|1103|`{"power_limit":2030000}`|
|1104|`{"power_limit":3000000}`|
|1201|`{"power_limit":0}`|
|1202|`{"power_limit":2030000}`|
|1203|`{"power_limit":3000000}`|
|1204|`{"power_limit":3970000}`|
|1301|`{"power_limit":0}`|
|1302|`{"power_limit":740000}`|
|1303|`{"power_limit":950000}`|
|1304|`{"power_limit":1160000}`|
|1401|`{"power_limit":0}`|
|1402|`{"power_limit":950000}`|
|1403|`{"power_limit":1580000}`|
|1404|`{"power_limit":2210000}`|
|1501|`{"power_limit":0}`|
|1502|`{"power_limit":1580000}`|
|1503|`{"power_limit":2500000}`|
|1504|`{"power_limit":3420000}`|
|1601|`{"power_limit":0}`|
|1602|`{"power_limit":2500000}`|
|1603|`{"power_limit":3420000}`|
|1604|`{"power_limit":4340000}`|
|1701|`{"power_limit":0}`|
|1702|`{"power_limit":1080000}`|
|1703|`{"power_limit":1360000}`|
|1704|`{"power_limit":1640000}`|
|1801|`{"power_limit":0}`|
|1802|`{"power_limit":1360000}`|
|1803|`{"power_limit":2230000}`|
|1804|`{"power_limit":3100000}`|
|1901|`{"power_limit":0}`|
|1902|`{"power_limit":2230000}`|
|1903|`{"power_limit":3690000}`|
|1904|`{"power_limit":5150000}`|
|2001|`{"power_limit":0}`|
|2002|`{"power_limit":3690000}`|
|2003|`{"power_limit":5150000}`|
|2004|`{"power_limit":6610000}`|
|2101|`{"power_limit":0}`|
|2102|`{"power_limit":1450000}`|
|2103|`{"power_limit":1680000}`|
|2104|`{"power_limit":1910000}`|
|2201|`{"power_limit":0}`|
|2202|`{"power_limit":1680000}`|
|2203|`{"power_limit":3060000}`|
|2204|`{"power_limit":4440000}`|
|2301|`{"power_limit":0}`|
|2302|`{"power_limit":3060000}`|
|2303|`{"power_limit":4580000}`|
|2304|`{"power_limit":6100000}`|
|2401|`{"power_limit":0}`|
|2402|`{"power_limit":4580000}`|
|2403|`{"power_limit":6100000}`|
|2404|`{"power_limit":7620000}`|
|2501|`{"power_limit":0}`|
|2502|`{"power_limit":2030000}`|
|2503|`{"power_limit":2320000}`|
|2504|`{"power_limit":2610000}`|
|2601|`{"power_limit":0}`|
|2602|`{"power_limit":2320000}`|
|2603|`{"power_limit":4180000}`|
|2604|`{"power_limit":6040000}`|
|2701|`{"power_limit":0}`|
|2702|`{"power_limit":4180000}`|
|2703|`{"power_limit":5970000}`|
|2704|`{"power_limit":7760000}`|
|2801|`{"power_limit":0}`|
|2802|`{"power_limit":5970000}`|
|2803|`{"power_limit":7760000}`|
|2804|`{"power_limit":9550000}`|
|2901|`{"power_limit":0}`|
|2902|`{"power_limit":2500000}`|
|2903|`{"power_limit":2860000}`|
|2904|`{"power_limit":3220000}`|
|3001|`{"power_limit":0}`|
|3002|`{"power_limit":2860000}`|
|3003|`{"power_limit":5050000}`|
|3004|`{"power_limit":7240000}`|
|3101|`{"power_limit":0}`|
|3102|`{"power_limit":5050000}`|
|3103|`{"power_limit":7650000}`|
|3104|`{"power_limit":10250000}`|
|3201|`{"power_limit":0}`|
|3202|`{"power_limit":7650000}`|
|3203|`{"power_limit":10250000}`|
|3204|`{"power_limit":12850000}`|
|3301|`{"power_limit":0}`|
|3302|`{"power_limit":3220000}`|
|3303|`{"power_limit":3550000}`|
|3304|`{"power_limit":3880000}`|
|3401|`{"power_limit":0}`|
|3402|`{"power_limit":3550000}`|
|3403|`{"power_limit":6800000}`|
|3404|`{"power_limit":10050000}`|
|3501|`{"power_limit":0}`|
|3502|`{"power_limit":6800000}`|
|3503|`{"power_limit":10810000}`|
|3504|`{"power_limit":14820000}`|
|3601|`{"power_limit":0}`|
|3602|`{"power_limit":10810000}`|
|3603|`{"power_limit":14820000}`|
|3604|`{"power_limit":18830000}`|
|3701|`{"power_limit":0}`|
|3702|`{"power_limit":4180000}`|
|3703|`{"power_limit":4590000}`|
|3704|`{"power_limit":5000000}`|
|3801|`{"power_limit":0}`|
|3802|`{"power_limit":4590000}`|
|3803|`{"power_limit":8560000}`|
|3804|`{"power_limit":12530000}`|
|3901|`{"power_limit":0}`|
|3902|`{"power_limit":8560000}`|
|3903|`{"power_limit":13250000}`|
|3904|`{"power_limit":17940000}`|
|4001|`{"power_limit":0}`|
|4002|`{"power_limit":13250000}`|
|4003|`{"power_limit":17940000}`|
|4004|`{"power_limit":22630000}`|

## Team

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|80|本表行键；与其他表同值不自动代表同一对象。|
|fight_id|number|80|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|first_award|array|80|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|suppress_skill|number|80|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_fight_award|array|80|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|show_fight_rate|array|80|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|boss_pic|string|80|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_elite|boolean|80|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|boss_name|number|80|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|unlock_des|number|80|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|recommend_power|number|80|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|recommend_power_rate|number|80|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|model_scale|number|80|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|assistant_param|number|80|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"fight_id":6800001,"first_award":[[2002109,1],[2002209,1]],"suppress_skill":100000004,"show_fight_award":[[1241200,1],[1251200,1],[331002,165],[332002,50]],"show_fight_rate":[900,100,-1,-1],"is_elite":false,"unlock_des":61838,"recommend_power":400000,"recommend_power_rate":10}`|
|2|`{"fight_id":6800002,"first_award":[[2002309,1],[2002409,1]],"suppress_skill":100000004,"show_fight_award":[[1241200,1],[1251200,1],[331002,165],[332002,50]],"show_fight_rate":[880,120,-1,-1],"is_elite":false,"unlock_des":61839,"recommend_power":500000,"recommend_power_rate":10}`|
|3|`{"fight_id":6800003,"first_award":[[101500,100],[179002,30]],"suppress_skill":100000004,"show_fight_award":[[1241200,1],[1251200,1],[331002,165],[332002,50]],"show_fight_rate":[860,140,-1,-1],"is_elite":false,"unlock_des":61841,"recommend_power":600000,"recommend_power_rate":10}`|
|4|`{"fight_id":6800004,"first_award":[[101500,100],[179002,30]],"suppress_skill":100000004,"show_fight_award":[[1241200,1],[1251200,1],[331002,165],[332002,50]],"show_fight_rate":[840,160,-1,-1],"is_elite":false,"unlock_des":61840,"recommend_power":700000,"recommend_power_rate":10}`|
|5|`{"fight_id":6800005,"first_award":[[101500,100],[179002,40]],"suppress_skill":100000004,"show_fight_award":[[1241200,1],[1251200,1],[331002,165],[332002,50]],"show_fight_rate":[700,300,-1,-1],"is_elite":true,"unlock_des":61838,"recommend_power":850000,"recommend_power_rate":10}`|
|6|`{"fight_id":6800006,"first_award":[[101500,100],[179002,40]],"suppress_skill":100000004,"show_fight_award":[[1241200,1],[1251200,1],[331002,165],[332002,50]],"show_fight_rate":[680,320,-1,-1],"is_elite":true,"unlock_des":61839,"recommend_power":950000,"recommend_power_rate":10}`|
|7|`{"fight_id":6800007,"first_award":[[101500,100],[179002,50]],"suppress_skill":100000004,"show_fight_award":[[1241200,1],[1251200,1],[331002,165],[332002,50]],"show_fight_rate":[660,340,-1,-1],"is_elite":true,"unlock_des":61841,"recommend_power":1050000,"recommend_power_rate":10}`|
|8|`{"fight_id":6800008,"first_award":[[101500,100],[179002,50]],"suppress_skill":100000004,"show_fight_award":[[1241200,1],[1251200,1],[331002,165],[332002,50]],"show_fight_rate":[640,360,-1,-1],"is_elite":true,"unlock_des":61840,"recommend_power":1200000,"recommend_power_rate":10}`|
|9|`{"fight_id":6800009,"first_award":[[101500,100],[179002,40]],"suppress_skill":100000004,"show_fight_award":[[1241200,1],[1251200,1],[331002,165],[332002,50]],"show_fight_rate":[500,500,-1,-1],"is_elite":true,"unlock_des":61838,"recommend_power":1350000,"recommend_power_rate":10}`|
|10|`{"fight_id":6800010,"first_award":[[101500,100],[179002,40]],"suppress_skill":100000004,"show_fight_award":[[1241200,1],[1251200,1],[331002,165],[332002,50]],"show_fight_rate":[480,520,-1,-1],"is_elite":true,"unlock_des":61839,"recommend_power":1500000,"recommend_power_rate":10}`|
|11|`{"fight_id":6800011,"first_award":[[101500,100],[179002,50]],"suppress_skill":100000004,"show_fight_award":[[1241200,1],[1251200,1],[331002,165],[332002,50]],"show_fight_rate":[460,540,-1,-1],"is_elite":true,"unlock_des":61841,"recommend_power":1650000,"recommend_power_rate":10}`|
|12|`{"fight_id":6800012,"first_award":[[101500,100],[179002,50]],"suppress_skill":100000004,"show_fight_award":[[1241200,1],[1251200,1],[331002,165],[332002,50]],"show_fight_rate":[440,560,-1,-1],"is_elite":true,"unlock_des":61840,"recommend_power":1900000,"recommend_power_rate":10}`|
|13|`{"fight_id":6800013,"first_award":[[101500,100],[179002,40]],"suppress_skill":100000004,"show_fight_award":[[1241200,1],[1251200,1],[331002,165],[1261200,1],[332002,50]],"show_fight_rate":[300,600,-1,100,-1],"is_elite":true,"unlock_des":61838,"recommend_power":2100000,"recommend_power_rate":10}`|
|14|`{"fight_id":6800014,"first_award":[[101500,100],[179002,40]],"suppress_skill":100000004,"show_fight_award":[[1241200,1],[1251200,1],[331002,165],[1261200,1],[332002,50]],"show_fight_rate":[260,620,-1,120,-1],"is_elite":true,"unlock_des":61839,"recommend_power":2350000,"recommend_power_rate":10}`|
|15|`{"fight_id":6800015,"first_award":[[101500,100],[179002,50]],"suppress_skill":100000004,"show_fight_award":[[1241200,1],[1251200,1],[331002,165],[1261200,1],[332002,50]],"show_fight_rate":[220,640,-1,140,-1],"is_elite":true,"unlock_des":61841,"recommend_power":2600000,"recommend_power_rate":10}`|
|16|`{"fight_id":6800016,"first_award":[[101500,100],[179002,50]],"suppress_skill":100000004,"show_fight_award":[[1241200,1],[1251200,1],[331002,165],[1261200,1],[332002,50]],"show_fight_rate":[180,660,-1,160,-1],"is_elite":true,"unlock_des":61840,"recommend_power":2850000,"recommend_power_rate":10}`|
|17|`{"fight_id":6800017,"first_award":[[101500,100],[179002,40]],"suppress_skill":100000004,"show_fight_award":[[1241200,1],[1251200,1],[331002,165],[1261200,1],[332002,50]],"show_fight_rate":[100,700,-1,200,-1],"is_elite":true,"unlock_des":61838,"recommend_power":3100000,"recommend_power_rate":10}`|
|18|`{"fight_id":6800018,"first_award":[[101500,100],[179002,40]],"suppress_skill":100000004,"show_fight_award":[[1241200,1],[1251200,1],[331002,165],[1261200,1],[332002,50]],"show_fight_rate":[60,720,-1,220,-1],"is_elite":true,"unlock_des":61839,"recommend_power":3350000,"recommend_power_rate":10}`|
|19|`{"fight_id":6800019,"first_award":[[101500,100],[179002,50]],"suppress_skill":100000004,"show_fight_award":[[1241200,1],[1251200,1],[331002,165],[1261200,1],[332002,50]],"show_fight_rate":[20,740,-1,240,-1],"is_elite":true,"unlock_des":61841,"recommend_power":3600000,"recommend_power_rate":10}`|
|20|`{"fight_id":6800020,"first_award":[[101500,100],[179002,50]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,165],[1261200,1],[332002,50]],"show_fight_rate":[740,-1,260,-1],"is_elite":true,"unlock_des":61840,"recommend_power":3850000,"recommend_power_rate":10}`|
|21|`{"fight_id":6800021,"first_award":[[101500,100],[179002,40],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,165],[1261200,1],[332002,50],[1371200,1],[668002,1]],"show_fight_rate":[650,-1,300,-1,50,-1],"is_elite":true,"unlock_des":61838,"recommend_power":4100000,"recommend_power_rate":10}`|
|22|`{"fight_id":6800022,"first_award":[[101500,100],[179002,40],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,165],[1261200,1],[332002,50],[1371200,1],[668002,1]],"show_fight_rate":[628,-1,320,-1,52,-1],"is_elite":true,"unlock_des":61839,"recommend_power":4350000,"recommend_power_rate":10}`|
|23|`{"fight_id":6800023,"first_award":[[101500,100],[179002,50],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,165],[1261200,1],[332002,50],[1371200,1],[668002,1]],"show_fight_rate":[606,-1,340,-1,54,-1],"is_elite":true,"unlock_des":61841,"recommend_power":4600000,"recommend_power_rate":10}`|
|24|`{"fight_id":6800024,"first_award":[[101500,100],[179002,50],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,165],[1261200,1],[332002,50],[1371200,1],[668002,1]],"show_fight_rate":[584,-1,360,-1,56,-1],"is_elite":true,"unlock_des":61840,"recommend_power":4850000,"recommend_power_rate":10}`|
|25|`{"fight_id":6800025,"first_award":[[101500,100],[179002,40],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,165],[1261200,1],[332002,50],[1371200,1],[668002,1]],"show_fight_rate":[540,-1,400,-1,60,-1],"is_elite":true,"unlock_des":61838,"recommend_power":5100000,"recommend_power_rate":10}`|
|26|`{"fight_id":6800026,"first_award":[[101500,100],[179002,40],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,165],[1261200,1],[332002,50],[1371200,1],[668002,1]],"show_fight_rate":[518,-1,420,-1,62,-1],"is_elite":true,"unlock_des":61839,"recommend_power":5350000,"recommend_power_rate":10}`|
|27|`{"fight_id":6800027,"first_award":[[101500,100],[179002,50],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,165],[1261200,1],[332002,50],[1371200,1],[668002,1]],"show_fight_rate":[496,-1,440,-1,64,-1],"is_elite":true,"unlock_des":61841,"recommend_power":5600000,"recommend_power_rate":10}`|
|28|`{"fight_id":6800028,"first_award":[[101500,100],[179002,50],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,165],[1261200,1],[332002,50],[1371200,1],[668002,1]],"show_fight_rate":[474,-1,460,-1,66,-1],"is_elite":true,"unlock_des":61840,"recommend_power":5850000,"recommend_power_rate":10}`|
|29|`{"fight_id":6800029,"first_award":[[101500,100],[179002,40],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,165],[1261200,1],[332002,50],[1371200,1],[668002,1]],"show_fight_rate":[430,-1,500,-1,69,-1],"is_elite":true,"unlock_des":61838,"recommend_power":6200000,"recommend_power_rate":10}`|
|30|`{"fight_id":6800030,"first_award":[[101500,100],[179002,40],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,165],[1261200,1],[332002,50],[1371200,1],[668002,1]],"show_fight_rate":[408,-1,520,-1,72,-1],"is_elite":true,"unlock_des":61839,"recommend_power":6550000,"recommend_power_rate":10}`|
|31|`{"fight_id":6800031,"first_award":[[101500,100],[179002,50],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,165],[1261200,1],[332002,50],[1371200,1],[668002,1]],"show_fight_rate":[386,-1,540,-1,74,-1],"is_elite":true,"unlock_des":61841,"recommend_power":6900000,"recommend_power_rate":10}`|
|32|`{"fight_id":6800032,"first_award":[[101500,100],[179002,50],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,170],[1261200,1],[332002,52],[1371200,1],[668002,1]],"show_fight_rate":[364,-1,560,-1,76,-1],"is_elite":true,"unlock_des":61840,"recommend_power":7250000,"recommend_power_rate":10}`|
|33|`{"fight_id":6800033,"first_award":[[101500,100],[179002,40],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,175],[1261200,1],[332002,54],[1371200,1],[668002,1]],"show_fight_rate":[320,-1,600,-1,80,-1],"is_elite":true,"unlock_des":61838,"recommend_power":7650000,"recommend_power_rate":10}`|
|34|`{"fight_id":6800034,"first_award":[[101500,100],[179002,40],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,180],[1261200,1],[332002,56],[1371200,1],[668002,1]],"show_fight_rate":[298,-1,620,-1,82,-1],"is_elite":true,"unlock_des":61839,"recommend_power":8050000,"recommend_power_rate":10}`|
|35|`{"fight_id":6800035,"first_award":[[101500,100],[179002,50],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,185],[1261200,1],[332002,58],[1371200,1],[668002,1]],"show_fight_rate":[276,-1,640,-1,84,-1],"is_elite":true,"unlock_des":61841,"recommend_power":8450000,"recommend_power_rate":10}`|
|36|`{"fight_id":6800036,"first_award":[[101500,100],[179002,50],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,190],[1261200,1],[332002,60],[1371200,1],[668002,1]],"show_fight_rate":[254,-1,660,-1,86,-1],"is_elite":true,"unlock_des":61840,"recommend_power":8850000,"recommend_power_rate":10}`|
|37|`{"fight_id":6800037,"first_award":[[101500,100],[179002,40],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,195],[1261200,1],[332002,62],[1371200,1],[668002,1]],"show_fight_rate":[210,-1,700,-1,89,-1],"is_elite":true,"unlock_des":61838,"recommend_power":10600000,"recommend_power_rate":10}`|
|38|`{"fight_id":6800038,"first_award":[[101500,100],[179002,40],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,200],[1261200,1],[332002,64],[1371200,1],[668002,1]],"show_fight_rate":[188,-1,720,-1,92,-1],"is_elite":true,"unlock_des":61839,"recommend_power":12350000,"recommend_power_rate":10}`|
|39|`{"fight_id":6800039,"first_award":[[101500,100],[179002,50],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,205],[1261200,1],[332002,66],[1371200,1],[668002,1]],"show_fight_rate":[166,-1,740,-1,94,-1],"is_elite":true,"unlock_des":61841,"recommend_power":14100000,"recommend_power_rate":10}`|
|40|`{"fight_id":6800040,"first_award":[[101500,100],[179002,50],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,210],[1261200,1],[332002,68],[1371200,1],[668002,1]],"show_fight_rate":[144,-1,760,-1,96,-1],"is_elite":true,"unlock_des":61840,"recommend_power":15850000,"recommend_power_rate":10}`|
|41|`{"fight_id":6800041,"first_award":[[101500,100],[179002,40],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,220],[1261200,1],[332002,72],[1371200,1],[668002,1]],"show_fight_rate":[140,-1,762,-1,98,-1],"is_elite":true,"unlock_des":61838,"recommend_power":20300000,"recommend_power_rate":10}`|
|42|`{"fight_id":6800042,"first_award":[[101500,100],[179002,40],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,220],[1261200,1],[332002,72],[1371200,1],[668002,1]],"show_fight_rate":[137,-1,764,-1,99,-1],"is_elite":true,"unlock_des":61839,"recommend_power":22500000,"recommend_power_rate":10}`|
|43|`{"fight_id":6800043,"first_award":[[101500,100],[179002,50],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,230],[1261200,1],[332002,76],[1371200,1],[668002,1]],"show_fight_rate":[134,-1,766,-1,100,-1],"is_elite":true,"unlock_des":61841,"recommend_power":24700000,"recommend_power_rate":10}`|
|44|`{"fight_id":6800044,"first_award":[[101500,100],[179002,50],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,230],[1261200,1],[332002,76],[1371200,1],[668002,1]],"show_fight_rate":[131,-1,768,-1,101,-1],"is_elite":true,"unlock_des":61840,"recommend_power":26900000,"recommend_power_rate":10}`|
|45|`{"fight_id":6800045,"first_award":[[101500,100],[179002,40],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,240],[1261200,1],[332002,80],[1371200,1],[668002,1]],"show_fight_rate":[128,-1,770,-1,102,-1],"is_elite":true,"unlock_des":61838,"recommend_power":31500000,"recommend_power_rate":10}`|
|46|`{"fight_id":6800046,"first_award":[[101500,100],[179002,40],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,240],[1261200,1],[332002,80],[1371200,1],[668002,1]],"show_fight_rate":[125,-1,772,-1,103,-1],"is_elite":true,"unlock_des":61839,"recommend_power":34600000,"recommend_power_rate":10}`|
|47|`{"fight_id":6800047,"first_award":[[101500,100],[179002,50],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,250],[1261200,1],[332002,84],[1371200,1],[668002,1]],"show_fight_rate":[122,-1,774,-1,104,-1],"is_elite":true,"unlock_des":61841,"recommend_power":37700000,"recommend_power_rate":10}`|
|48|`{"fight_id":6800048,"first_award":[[101500,100],[179002,50],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,250],[1261200,1],[332002,84],[1371200,1],[668002,1]],"show_fight_rate":[119,-1,776,-1,105,-1],"is_elite":true,"unlock_des":61840,"recommend_power":40800000,"recommend_power_rate":10}`|
|49|`{"fight_id":6800049,"first_award":[[101500,100],[179002,40],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,260],[1261200,1],[332002,88],[1371200,1],[668002,1]],"show_fight_rate":[116,-1,778,-1,106,-1],"is_elite":true,"unlock_des":61838,"recommend_power":44300000,"recommend_power_rate":10}`|
|50|`{"fight_id":6800050,"first_award":[[101500,100],[179002,40],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,260],[1261200,1],[332002,88],[1371200,1],[668002,1]],"show_fight_rate":[113,-1,780,-1,107,-1],"is_elite":true,"unlock_des":61839,"recommend_power":48700000,"recommend_power_rate":10}`|
|51|`{"fight_id":6800051,"first_award":[[101500,100],[179002,50],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,270],[1261200,1],[332002,88],[1371200,1],[668002,1]],"show_fight_rate":[110,-1,782,-1,108,-1],"is_elite":true,"unlock_des":61841,"recommend_power":53100000,"recommend_power_rate":10}`|
|52|`{"fight_id":6800052,"first_award":[[101500,100],[179002,50],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,270],[1261200,1],[332002,92],[1371200,1],[668002,1]],"show_fight_rate":[107,-1,784,-1,109,-1],"is_elite":true,"unlock_des":61840,"recommend_power":57500000,"recommend_power_rate":10}`|
|53|`{"fight_id":6800053,"first_award":[[101500,100],[179002,40],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,280],[1261200,1],[332002,92],[1371200,1],[668002,1]],"show_fight_rate":[104,-1,786,-1,110,-1],"is_elite":true,"unlock_des":61838,"recommend_power":62200000,"recommend_power_rate":10}`|
|54|`{"fight_id":6800054,"first_award":[[101500,100],[179002,40],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,280],[1261200,1],[332002,92],[1371200,1],[668002,1]],"show_fight_rate":[101,-1,788,-1,111,-1],"is_elite":true,"unlock_des":61839,"recommend_power":68700000,"recommend_power_rate":10}`|
|55|`{"fight_id":6800055,"first_award":[[101500,100],[179002,50],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,280],[1261200,1],[332002,96],[1371200,1],[668002,1]],"show_fight_rate":[98,-1,790,-1,112,-1],"is_elite":true,"unlock_des":61841,"recommend_power":75200000,"recommend_power_rate":10}`|
|56|`{"fight_id":6800056,"first_award":[[101500,100],[179002,50],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,290],[1261200,1],[332002,96],[1371200,1],[668002,1]],"show_fight_rate":[95,-1,792,-1,113,-1],"is_elite":true,"unlock_des":61840,"recommend_power":81700000,"recommend_power_rate":10}`|
|57|`{"fight_id":6800057,"first_award":[[101500,100],[179002,40],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,290],[1261200,1],[332002,96],[1371200,1],[668002,1]],"show_fight_rate":[92,-1,794,-1,114,-1],"is_elite":true,"unlock_des":61838,"recommend_power":93000000,"recommend_power_rate":10}`|
|58|`{"fight_id":6800058,"first_award":[[101500,100],[179002,40],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,290],[1261200,1],[332002,100],[1371200,1],[668002,1]],"show_fight_rate":[89,-1,796,-1,115,-1],"is_elite":true,"unlock_des":61839,"recommend_power":102000000,"recommend_power_rate":10}`|
|59|`{"fight_id":6800059,"first_award":[[101500,100],[179002,50],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,300],[1261200,1],[332002,100],[1371200,1],[668002,1]],"show_fight_rate":[86,-1,798,-1,116,-1],"is_elite":true,"unlock_des":61841,"recommend_power":111000000,"recommend_power_rate":10}`|
|60|`{"fight_id":6800060,"first_award":[[101500,100],[179002,50],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,300],[1261200,1],[332002,100],[1371200,1],[668002,1]],"show_fight_rate":[83,-1,800,-1,117,-1],"is_elite":true,"unlock_des":61840,"recommend_power":120000000,"recommend_power_rate":10}`|
|61|`{"fight_id":6800061,"first_award":[[101500,100],[179002,40],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,300],[1261200,1],[332002,100],[1371200,1],[668002,1]],"show_fight_rate":[82,-1,801,-1,118,-1],"is_elite":true,"unlock_des":61838,"recommend_power":129000000,"recommend_power_rate":10}`|
|62|`{"fight_id":6800062,"first_award":[[101500,100],[179002,40],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,300],[1261200,1],[332002,100],[1371200,1],[668002,1]],"show_fight_rate":[80,-1,802,-1,118,-1],"is_elite":true,"unlock_des":61839,"recommend_power":138000000,"recommend_power_rate":10}`|
|63|`{"fight_id":6800063,"first_award":[[101500,100],[179002,50],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,300],[1261200,1],[332002,100],[1371200,1],[668002,1]],"show_fight_rate":[79,-1,803,-1,119,-1],"is_elite":true,"unlock_des":61841,"recommend_power":147000000,"recommend_power_rate":10}`|
|64|`{"fight_id":6800064,"first_award":[[101500,100],[179002,50],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,300],[1261200,1],[332002,100],[1371200,1],[668002,1]],"show_fight_rate":[77,-1,804,-1,119,-1],"is_elite":true,"unlock_des":61840,"recommend_power":156000000,"recommend_power_rate":10}`|
|65|`{"fight_id":6800065,"first_award":[[101500,100],[179002,40],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,300],[1261200,1],[332002,100],[1371200,1],[668002,1]],"show_fight_rate":[76,-1,805,-1,120,-1],"is_elite":true,"unlock_des":61838,"recommend_power":165000000,"recommend_power_rate":10}`|
|66|`{"fight_id":6800066,"first_award":[[101500,100],[179002,40],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,300],[1261200,1],[332002,100],[1371200,1],[668002,1]],"show_fight_rate":[74,-1,806,-1,120,-1],"is_elite":true,"unlock_des":61839,"recommend_power":174000000,"recommend_power_rate":10}`|
|67|`{"fight_id":6800067,"first_award":[[101500,100],[179002,50],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,300],[1261200,1],[332002,100],[1371200,1],[668002,1]],"show_fight_rate":[73,-1,807,-1,121,-1],"is_elite":true,"unlock_des":61841,"recommend_power":183000000,"recommend_power_rate":10}`|
|68|`{"fight_id":6800068,"first_award":[[101500,100],[179002,50],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,300],[1261200,1],[332002,100],[1371200,1],[668002,1]],"show_fight_rate":[71,-1,808,-1,121,-1],"is_elite":true,"unlock_des":61840,"recommend_power":192000000,"recommend_power_rate":10}`|
|69|`{"fight_id":6800069,"first_award":[[101500,100],[179002,40],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,300],[1261200,1],[332002,100],[1371200,1],[668002,1]],"show_fight_rate":[70,-1,809,-1,122,-1],"is_elite":true,"unlock_des":61838,"recommend_power":201000000,"recommend_power_rate":10}`|
|70|`{"fight_id":6800070,"first_award":[[101500,100],[179002,40],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,300],[1261200,1],[332002,100],[1371200,1],[668002,1]],"show_fight_rate":[68,-1,810,-1,122,-1],"is_elite":true,"unlock_des":61839,"recommend_power":210000000,"recommend_power_rate":10}`|
|71|`{"fight_id":6800071,"first_award":[[101500,100],[179002,50],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,300],[1261200,1],[332002,100],[1371200,1],[668002,1]],"show_fight_rate":[67,-1,811,-1,123,-1],"is_elite":true,"unlock_des":61841,"recommend_power":219000000,"recommend_power_rate":10}`|
|72|`{"fight_id":6800072,"first_award":[[101500,100],[179002,50],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,300],[1261200,1],[332002,100],[1371200,1],[668002,1]],"show_fight_rate":[65,-1,812,-1,123,-1],"is_elite":true,"unlock_des":61840,"recommend_power":228000000,"recommend_power_rate":10}`|
|73|`{"fight_id":6800073,"first_award":[[101500,100],[179002,40],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,300],[1261200,1],[332002,100],[1371200,1],[668002,1]],"show_fight_rate":[64,-1,813,-1,124,-1],"is_elite":true,"unlock_des":61838,"recommend_power":237000000,"recommend_power_rate":10}`|
|74|`{"fight_id":6800074,"first_award":[[101500,100],[179002,40],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,300],[1261200,1],[332002,100],[1371200,1],[668002,1]],"show_fight_rate":[62,-1,814,-1,124,-1],"is_elite":true,"unlock_des":61839,"recommend_power":246000000,"recommend_power_rate":10}`|
|75|`{"fight_id":6800075,"first_award":[[101500,100],[179002,50],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,300],[1261200,1],[332002,100],[1371200,1],[668002,1]],"show_fight_rate":[61,-1,815,-1,125,-1],"is_elite":true,"unlock_des":61841,"recommend_power":255000000,"recommend_power_rate":10}`|
|76|`{"fight_id":6800076,"first_award":[[101500,100],[179002,50],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,300],[1261200,1],[332002,100],[1371200,1],[668002,1]],"show_fight_rate":[59,-1,816,-1,125,-1],"is_elite":true,"unlock_des":61840,"recommend_power":264000000,"recommend_power_rate":10}`|
|77|`{"fight_id":6800077,"first_award":[[101500,100],[179002,40],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,300],[1261200,1],[332002,100],[1371200,1],[668002,1]],"show_fight_rate":[58,-1,817,-1,126,-1],"is_elite":true,"unlock_des":61838,"recommend_power":273000000,"recommend_power_rate":10}`|
|78|`{"fight_id":6800078,"first_award":[[101500,100],[179002,40],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,300],[1261200,1],[332002,100],[1371200,1],[668002,1]],"show_fight_rate":[56,-1,818,-1,126,-1],"is_elite":true,"unlock_des":61839,"recommend_power":282000000,"recommend_power_rate":10}`|
|79|`{"fight_id":6800079,"first_award":[[101500,100],[179002,50],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,300],[1261200,1],[332002,100],[1371200,1],[668002,1]],"show_fight_rate":[55,-1,819,-1,127,-1],"is_elite":true,"unlock_des":61841,"recommend_power":291000000,"recommend_power_rate":10}`|
|80|`{"fight_id":6800080,"first_award":[[101500,100],[179002,50],[379002,10]],"suppress_skill":100000004,"show_fight_award":[[1251200,1],[331002,300],[1261200,1],[332002,100],[1371200,1],[668002,1]],"show_fight_rate":[53,-1,820,-1,127,-1],"is_elite":true,"unlock_des":61840,"recommend_power":300000000,"recommend_power_rate":10}`|

## HelpAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|10|本表行键；与其他表同值不自动代表同一对象。|
|award|array|10|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|times|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award":[[31002,5]],"times":5}`|
|2|`{"award":[[31002,5]],"times":10}`|
|3|`{"award":[[31002,5]],"times":50}`|
|4|`{"award":[[32002,5]],"times":100}`|
|5|`{"award":[[32002,5]],"times":200}`|
|6|`{"award":[[32002,5]],"times":300}`|
|7|`{"award":[[32002,5]],"times":500}`|
|8|`{"award":[[32002,5]],"times":600}`|
|9|`{"award":[[32002,5]],"times":800}`|
|10|`{"award":[[32002,5]],"times":1000}`|

## TeamBuff

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|skill|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"skill":6910000003}`|
|2|`{"skill":6910000004}`|

## TeamConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|invite_cd|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|invite_all_cd|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|add_bot_cd|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|extra_award_member_num|number|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|team_extra_award_num|number|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|query_team_max|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|special_quality|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_npc_count|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|auto_fight_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|employ_tip_max_count|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|challenge_count_per_day|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_challenge_count|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"extra_award_member_num":3,"team_extra_award_num":20,"query_team_max":10,"special_quality":50,"max_npc_count":3,"auto_fight_time":3,"employ_tip_max_count":10,"challenge_count_per_day":5,"max_challenge_count":5}`|

## TeamSkip

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|unlock|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bot_skip_sec|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"unlock":516969000001}`|

## EnterLimitType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|

## EmployThank

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|des|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|cost_item|number|1|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|cost_num|number|1|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|open_award|array|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|no_merge_award|array|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|boss_num_per_chapter|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|relic_quality|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|assert_resolve|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"cost_item":100022900,"cost_num":0,"open_award":[[100022900,30]],"no_merge_award":[9],"boss_num_per_chapter":4,"relic_quality":[20,30,40],"assert_resolve":132944400001}`|

## FightType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|

## BuyFight

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|cost|number|4|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|cost_n|number|4|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"cost":101500,"cost_n":50}`|
|2|`{"cost":101500,"cost_n":50}`|
|3|`{"cost":101500,"cost_n":80}`|
|4|`{"cost":101500,"cost_n":80}`|

## CountLib

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|15|本表行键；与其他表同值不自动代表同一对象。|
|count|number|15|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|weight|number|15|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"count":1,"weight":100}`|
|2|`{"count":2,"weight":100}`|
|3|`{"count":3,"weight":100}`|
|4|`{"count":4,"weight":100}`|
|5|`{"count":1,"weight":70}`|
|6|`{"count":2,"weight":30}`|
|7|`{"count":3,"weight":30}`|
|10|`{"count":1,"weight":98}`|
|11|`{"count":2,"weight":2}`|
|12|`{"count":0,"weight":82}`|
|13|`{"count":1,"weight":18}`|
|14|`{"count":0,"weight":78}`|
|15|`{"count":1,"weight":22}`|
|16|`{"count":0,"weight":74}`|
|17|`{"count":1,"weight":26}`|

## Chapter

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|20|本表行键；与其他表同值不自动代表同一对象。|
|unlock_cross_type|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|unlock_level|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|chapter_name|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|server_award|array|20|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|chapter_bg|string|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"unlock_cross_type":0,"unlock_level":34,"server_award":[[1241200,2]]}`|
|2|`{"unlock_cross_type":0,"unlock_level":34,"server_award":[[1251200,1]]}`|
|3|`{"unlock_cross_type":0,"unlock_level":34,"server_award":[[1251200,1]]}`|
|4|`{"unlock_cross_type":0,"unlock_level":34,"server_award":[[1261200,1]]}`|
|5|`{"unlock_cross_type":0,"unlock_level":34,"server_award":[[1261200,1]]}`|
|6|`{"unlock_cross_type":0,"unlock_level":50,"server_award":[[1271200,1]]}`|
|7|`{"unlock_cross_type":0,"unlock_level":50,"server_award":[[1271200,1]]}`|
|8|`{"unlock_cross_type":0,"unlock_level":50,"server_award":[[1181200,1]]}`|
|9|`{"unlock_cross_type":0,"unlock_level":50,"server_award":[[1181200,1]]}`|
|10|`{"unlock_cross_type":0,"unlock_level":50,"server_award":[[1181200,1]]}`|
|11|`{"unlock_cross_type":0,"unlock_level":60,"server_award":[[1271200,1]]}`|
|12|`{"unlock_cross_type":0,"unlock_level":60,"server_award":[[1271200,1]]}`|
|13|`{"unlock_cross_type":0,"unlock_level":60,"server_award":[[1181200,1]]}`|
|14|`{"unlock_cross_type":0,"unlock_level":60,"server_award":[[1181200,1]]}`|
|15|`{"unlock_cross_type":0,"unlock_level":60,"server_award":[[1181200,1]]}`|
|16|`{"unlock_cross_type":0,"unlock_level":70,"server_award":[[1271200,1]]}`|
|17|`{"unlock_cross_type":0,"unlock_level":70,"server_award":[[1271200,1]]}`|
|18|`{"unlock_cross_type":0,"unlock_level":70,"server_award":[[1181200,1]]}`|
|19|`{"unlock_cross_type":0,"unlock_level":70,"server_award":[[1181200,1]]}`|
|20|`{"unlock_cross_type":0,"unlock_level":70,"server_award":[[1181200,1]]}`|

## MartialClub

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|80|本表行键；与其他表同值不自动代表同一对象。|
|chapter|number|80|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_id|number|80|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|first_award|array|80|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|show_fight_award|array|80|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|fixed_fight_award|object|80|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|random_fight_award|array|80|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|random_fight_award_n|array|80|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|boss_icon|string|80|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|assistant_param|number|80|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"fight_id":4000001,"first_award":[[179002,20]],"show_fight_award":[[1241200,1],[1251200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[9000,1],[9000,2],[9000,3],[9000,4],[9000,5],[9000,6],[9000,7],[9000,8],[9000,9],[9000,10],[9000,11],[9000,12],[9000,13],[9000,14],[9000,15],[9000,16],[9000,17],[9000,18],[9000,19],[9000,20],[9000,21],[9000,22],[9000,23],[9000,24],[1000,25],[1000,26],[1000,27],[1000,28],[1000,29],[1000,30],[1000,31],[1000,32],[1000,33],[1000,34],[1000,35],[1000,36],[1000,37],[1000,38],[1000,39],[1000,40],[1000,41],[1000,42],[1000,43],[1000,44],[1000,45],[1000,46],[1000,47],[1000,48]]],"random_fight_award_n":[[[30,2]]]}`|
|2|`{"fight_id":4000002,"first_award":[[179002,20]],"show_fight_award":[[1241200,1],[1251200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[8800,49],[8800,50],[8800,51],[8800,52],[8800,53],[8800,54],[8800,55],[8800,56],[8800,57],[8800,58],[8800,59],[8800,60],[8800,61],[8800,62],[8800,63],[8800,64],[8800,65],[8800,66],[8800,67],[8800,68],[8800,69],[8800,70],[8800,71],[8800,72],[1200,73],[1200,74],[1200,75],[1200,76],[1200,77],[1200,78],[1200,79],[1200,80],[1200,81],[1200,82],[1200,83],[1200,84],[1200,85],[1200,86],[1200,87],[1200,88],[1200,89],[1200,90],[1200,91],[1200,92],[1200,93],[1200,94],[1200,95],[1200,96]]],"random_fight_award_n":[[[30,2]]]}`|
|3|`{"fight_id":4000003,"first_award":[[179002,30]],"show_fight_award":[[1241200,1],[1251200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[8600,97],[8600,98],[8600,99],[8600,100],[8600,101],[8600,102],[8600,103],[8600,104],[8600,105],[8600,106],[8600,107],[8600,108],[8600,109],[8600,110],[8600,111],[8600,112],[8600,113],[8600,114],[8600,115],[8600,116],[8600,117],[8600,118],[8600,119],[8600,120],[1400,121],[1400,122],[1400,123],[1400,124],[1400,125],[1400,126],[1400,127],[1400,128],[1400,129],[1400,130],[1400,131],[1400,132],[1400,133],[1400,134],[1400,135],[1400,136],[1400,137],[1400,138],[1400,139],[1400,140],[1400,141],[1400,142],[1400,143],[1400,144]]],"random_fight_award_n":[[[30,2]]]}`|
|4|`{"fight_id":4000004,"first_award":[[179002,30]],"show_fight_award":[[1241200,1],[1251200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[8400,145],[8400,146],[8400,147],[8400,148],[8400,149],[8400,150],[8400,151],[8400,152],[8400,153],[8400,154],[8400,155],[8400,156],[8400,157],[8400,158],[8400,159],[8400,160],[8400,161],[8400,162],[8400,163],[8400,164],[8400,165],[8400,166],[8400,167],[8400,168],[1600,169],[1600,170],[1600,171],[1600,172],[1600,173],[1600,174],[1600,175],[1600,176],[1600,177],[1600,178],[1600,179],[1600,180],[1600,181],[1600,182],[1600,183],[1600,184],[1600,185],[1600,186],[1600,187],[1600,188],[1600,189],[1600,190],[1600,191],[1600,192]]],"random_fight_award_n":[[[30,2]]]}`|
|5|`{"fight_id":4000005,"first_award":[[179002,40]],"show_fight_award":[[1241200,1],[1251200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[7000,193],[7000,194],[7000,195],[7000,196],[7000,197],[7000,198],[7000,199],[7000,200],[7000,201],[7000,202],[7000,203],[7000,204],[7000,205],[7000,206],[7000,207],[7000,208],[7000,209],[7000,210],[7000,211],[7000,212],[7000,213],[7000,214],[7000,215],[7000,216],[3000,217],[3000,218],[3000,219],[3000,220],[3000,221],[3000,222],[3000,223],[3000,224],[3000,225],[3000,226],[3000,227],[3000,228],[3000,229],[3000,230],[3000,231],[3000,232],[3000,233],[3000,234],[3000,235],[3000,236],[3000,237],[3000,238],[3000,239],[3000,240]]],"random_fight_award_n":[[[30,2]]]}`|
|6|`{"fight_id":4000006,"first_award":[[179002,40]],"show_fight_award":[[1241200,1],[1251200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[6800,241],[6800,242],[6800,243],[6800,244],[6800,245],[6800,246],[6800,247],[6800,248],[6800,249],[6800,250],[6800,251],[6800,252],[6800,253],[6800,254],[6800,255],[6800,256],[6800,257],[6800,258],[6800,259],[6800,260],[6800,261],[6800,262],[6800,263],[6800,264],[3200,265],[3200,266],[3200,267],[3200,268],[3200,269],[3200,270],[3200,271],[3200,272],[3200,273],[3200,274],[3200,275],[3200,276],[3200,277],[3200,278],[3200,279],[3200,280],[3200,281],[3200,282],[3200,283],[3200,284],[3200,285],[3200,286],[3200,287],[3200,288]]],"random_fight_award_n":[[[30,2]]]}`|
|7|`{"fight_id":4000007,"first_award":[[179002,50]],"show_fight_award":[[1241200,1],[1251200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[6600,289],[6600,290],[6600,291],[6600,292],[6600,293],[6600,294],[6600,295],[6600,296],[6600,297],[6600,298],[6600,299],[6600,300],[6600,301],[6600,302],[6600,303],[6600,304],[6600,305],[6600,306],[6600,307],[6600,308],[6600,309],[6600,310],[6600,311],[6600,312],[3400,313],[3400,314],[3400,315],[3400,316],[3400,317],[3400,318],[3400,319],[3400,320],[3400,321],[3400,322],[3400,323],[3400,324],[3400,325],[3400,326],[3400,327],[3400,328],[3400,329],[3400,330],[3400,331],[3400,332],[3400,333],[3400,334],[3400,335],[3400,336]]],"random_fight_award_n":[[[30,2]]]}`|
|8|`{"fight_id":4000008,"first_award":[[179002,50]],"show_fight_award":[[1241200,1],[1251200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[6400,337],[6400,338],[6400,339],[6400,340],[6400,341],[6400,342],[6400,343],[6400,344],[6400,345],[6400,346],[6400,347],[6400,348],[6400,349],[6400,350],[6400,351],[6400,352],[6400,353],[6400,354],[6400,355],[6400,356],[6400,357],[6400,358],[6400,359],[6400,360],[3600,361],[3600,362],[3600,363],[3600,364],[3600,365],[3600,366],[3600,367],[3600,368],[3600,369],[3600,370],[3600,371],[3600,372],[3600,373],[3600,374],[3600,375],[3600,376],[3600,377],[3600,378],[3600,379],[3600,380],[3600,381],[3600,382],[3600,383],[3600,384]]],"random_fight_award_n":[[[30,2]]]}`|
|9|`{"fight_id":4000009,"first_award":[[179002,50]],"show_fight_award":[[1241200,1],[1251200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[5000,385],[5000,386],[5000,387],[5000,388],[5000,389],[5000,390],[5000,391],[5000,392],[5000,393],[5000,394],[5000,395],[5000,396],[5000,397],[5000,398],[5000,399],[5000,400],[5000,401],[5000,402],[5000,403],[5000,404],[5000,405],[5000,406],[5000,407],[5000,408],[5000,409],[5000,410],[5000,411],[5000,412],[5000,413],[5000,414],[5000,415],[5000,416],[5000,417],[5000,418],[5000,419],[5000,420],[5000,421],[5000,422],[5000,423],[5000,424],[5000,425],[5000,426],[5000,427],[5000,428],[5000,429],[5000,430],[5000,431],[5000,432]]],"random_fight_award_n":[[[30,2]]]}`|
|10|`{"fight_id":4000010,"first_award":[[179002,50]],"show_fight_award":[[1241200,1],[1251200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[4800,433],[4800,434],[4800,435],[4800,436],[4800,437],[4800,438],[4800,439],[4800,440],[4800,441],[4800,442],[4800,443],[4800,444],[4800,445],[4800,446],[4800,447],[4800,448],[4800,449],[4800,450],[4800,451],[4800,452],[4800,453],[4800,454],[4800,455],[4800,456],[5200,457],[5200,458],[5200,459],[5200,460],[5200,461],[5200,462],[5200,463],[5200,464],[5200,465],[5200,466],[5200,467],[5200,468],[5200,469],[5200,470],[5200,471],[5200,472],[5200,473],[5200,474],[5200,475],[5200,476],[5200,477],[5200,478],[5200,479],[5200,480]]],"random_fight_award_n":[[[30,2]]]}`|
|11|`{"fight_id":4000011,"first_award":[[179002,50]],"show_fight_award":[[1241200,1],[1251200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[4600,481],[4600,482],[4600,483],[4600,484],[4600,485],[4600,486],[4600,487],[4600,488],[4600,489],[4600,490],[4600,491],[4600,492],[4600,493],[4600,494],[4600,495],[4600,496],[4600,497],[4600,498],[4600,499],[4600,500],[4600,501],[4600,502],[4600,503],[4600,504],[5400,505],[5400,506],[5400,507],[5400,508],[5400,509],[5400,510],[5400,511],[5400,512],[5400,513],[5400,514],[5400,515],[5400,516],[5400,517],[5400,518],[5400,519],[5400,520],[5400,521],[5400,522],[5400,523],[5400,524],[5400,525],[5400,526],[5400,527],[5400,528]]],"random_fight_award_n":[[[30,2]]]}`|
|12|`{"fight_id":4000012,"first_award":[[179002,50]],"show_fight_award":[[1241200,1],[1251200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[4400,529],[4400,530],[4400,531],[4400,532],[4400,533],[4400,534],[4400,535],[4400,536],[4400,537],[4400,538],[4400,539],[4400,540],[4400,541],[4400,542],[4400,543],[4400,544],[4400,545],[4400,546],[4400,547],[4400,548],[4400,549],[4400,550],[4400,551],[4400,552],[5600,553],[5600,554],[5600,555],[5600,556],[5600,557],[5600,558],[5600,559],[5600,560],[5600,561],[5600,562],[5600,563],[5600,564],[5600,565],[5600,566],[5600,567],[5600,568],[5600,569],[5600,570],[5600,571],[5600,572],[5600,573],[5600,574],[5600,575],[5600,576]]],"random_fight_award_n":[[[30,2]]]}`|
|13|`{"fight_id":4000013,"first_award":[[179002,50]],"show_fight_award":[[1241200,1],[1251200,1],[1261200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[3000,577],[3000,578],[3000,579],[3000,580],[3000,581],[3000,582],[3000,583],[3000,584],[3000,585],[3000,586],[3000,587],[3000,588],[3000,589],[3000,590],[3000,591],[3000,592],[3000,593],[3000,594],[3000,595],[3000,596],[3000,597],[3000,598],[3000,599],[3000,600],[6000,601],[6000,602],[6000,603],[6000,604],[6000,605],[6000,606],[6000,607],[6000,608],[6000,609],[6000,610],[6000,611],[6000,612],[6000,613],[6000,614],[6000,615],[6000,616],[6000,617],[6000,618],[6000,619],[6000,620],[6000,621],[6000,622],[6000,623],[6000,624],[1000,625],[1000,626],[1000,627],[1000,628],[1000,629],[1000,630],[1000,631],[1000,632],[1000,633],[1000,634],[1000,635],[1000,636],[1000,637],[1000,638],[1000,639],[1000,640],[1000,641],[1000,642],[1000,643],[1000,644],[1000,645],[1000,646],[1000,647],[1000,648]]],"random_fight_award_n":[[[30,2]]]}`|
|14|`{"fight_id":4000014,"first_award":[[179002,50]],"show_fight_award":[[1241200,1],[1251200,1],[1261200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[2600,649],[2600,650],[2600,651],[2600,652],[2600,653],[2600,654],[2600,655],[2600,656],[2600,657],[2600,658],[2600,659],[2600,660],[2600,661],[2600,662],[2600,663],[2600,664],[2600,665],[2600,666],[2600,667],[2600,668],[2600,669],[2600,670],[2600,671],[2600,672],[6200,673],[6200,674],[6200,675],[6200,676],[6200,677],[6200,678],[6200,679],[6200,680],[6200,681],[6200,682],[6200,683],[6200,684],[6200,685],[6200,686],[6200,687],[6200,688],[6200,689],[6200,690],[6200,691],[6200,692],[6200,693],[6200,694],[6200,695],[6200,696],[1200,697],[1200,698],[1200,699],[1200,700],[1200,701],[1200,702],[1200,703],[1200,704],[1200,705],[1200,706],[1200,707],[1200,708],[1200,709],[1200,710],[1200,711],[1200,712],[1200,713],[1200,714],[1200,715],[1200,716],[1200,717],[1200,718],[1200,719],[1200,720]]],"random_fight_award_n":[[[30,2]]]}`|
|15|`{"fight_id":4000015,"first_award":[[179002,50]],"show_fight_award":[[1241200,1],[1251200,1],[1261200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[2200,721],[2200,722],[2200,723],[2200,724],[2200,725],[2200,726],[2200,727],[2200,728],[2200,729],[2200,730],[2200,731],[2200,732],[2200,733],[2200,734],[2200,735],[2200,736],[2200,737],[2200,738],[2200,739],[2200,740],[2200,741],[2200,742],[2200,743],[2200,744],[6400,745],[6400,746],[6400,747],[6400,748],[6400,749],[6400,750],[6400,751],[6400,752],[6400,753],[6400,754],[6400,755],[6400,756],[6400,757],[6400,758],[6400,759],[6400,760],[6400,761],[6400,762],[6400,763],[6400,764],[6400,765],[6400,766],[6400,767],[6400,768],[1400,769],[1400,770],[1400,771],[1400,772],[1400,773],[1400,774],[1400,775],[1400,776],[1400,777],[1400,778],[1400,779],[1400,780],[1400,781],[1400,782],[1400,783],[1400,784],[1400,785],[1400,786],[1400,787],[1400,788],[1400,789],[1400,790],[1400,791],[1400,792]]],"random_fight_award_n":[[[30,2]]]}`|
|16|`{"fight_id":4000016,"first_award":[[179002,50]],"show_fight_award":[[1241200,1],[1251200,1],[1261200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[1800,793],[1800,794],[1800,795],[1800,796],[1800,797],[1800,798],[1800,799],[1800,800],[1800,801],[1800,802],[1800,803],[1800,804],[1800,805],[1800,806],[1800,807],[1800,808],[1800,809],[1800,810],[1800,811],[1800,812],[1800,813],[1800,814],[1800,815],[1800,816],[6600,817],[6600,818],[6600,819],[6600,820],[6600,821],[6600,822],[6600,823],[6600,824],[6600,825],[6600,826],[6600,827],[6600,828],[6600,829],[6600,830],[6600,831],[6600,832],[6600,833],[6600,834],[6600,835],[6600,836],[6600,837],[6600,838],[6600,839],[6600,840],[1600,841],[1600,842],[1600,843],[1600,844],[1600,845],[1600,846],[1600,847],[1600,848],[1600,849],[1600,850],[1600,851],[1600,852],[1600,853],[1600,854],[1600,855],[1600,856],[1600,857],[1600,858],[1600,859],[1600,860],[1600,861],[1600,862],[1600,863],[1600,864]]],"random_fight_award_n":[[[30,2]]]}`|
|17|`{"fight_id":4000017,"first_award":[[179002,50]],"show_fight_award":[[1241200,1],[1251200,1],[1261200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[1000,865],[1000,866],[1000,867],[1000,868],[1000,869],[1000,870],[1000,871],[1000,872],[1000,873],[1000,874],[1000,875],[1000,876],[1000,877],[1000,878],[1000,879],[1000,880],[1000,881],[1000,882],[1000,883],[1000,884],[1000,885],[1000,886],[1000,887],[1000,888],[7000,889],[7000,890],[7000,891],[7000,892],[7000,893],[7000,894],[7000,895],[7000,896],[7000,897],[7000,898],[7000,899],[7000,900],[7000,901],[7000,902],[7000,903],[7000,904],[7000,905],[7000,906],[7000,907],[7000,908],[7000,909],[7000,910],[7000,911],[7000,912],[2000,913],[2000,914],[2000,915],[2000,916],[2000,917],[2000,918],[2000,919],[2000,920],[2000,921],[2000,922],[2000,923],[2000,924],[2000,925],[2000,926],[2000,927],[2000,928],[2000,929],[2000,930],[2000,931],[2000,932],[2000,933],[2000,934],[2000,935],[2000,936]]],"random_fight_award_n":[[[30,2]]]}`|
|18|`{"fight_id":4000018,"first_award":[[179002,50]],"show_fight_award":[[1241200,1],[1251200,1],[1261200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[600,937],[600,938],[600,939],[600,940],[600,941],[600,942],[600,943],[600,944],[600,945],[600,946],[600,947],[600,948],[600,949],[600,950],[600,951],[600,952],[600,953],[600,954],[600,955],[600,956],[600,957],[600,958],[600,959],[600,960],[7200,961],[7200,962],[7200,963],[7200,964],[7200,965],[7200,966],[7200,967],[7200,968],[7200,969],[7200,970],[7200,971],[7200,972],[7200,973],[7200,974],[7200,975],[7200,976],[7200,977],[7200,978],[7200,979],[7200,980],[7200,981],[7200,982],[7200,983],[7200,984],[2200,985],[2200,986],[2200,987],[2200,988],[2200,989],[2200,990],[2200,991],[2200,992],[2200,993],[2200,994],[2200,995],[2200,996],[2200,997],[2200,998],[2200,999],[2200,1000],[2200,1001],[2200,1002],[2200,1003],[2200,1004],[2200,1005],[2200,1006],[2200,1007],[2200,1008]]],"random_fight_award_n":[[[30,2]]]}`|
|19|`{"fight_id":4000019,"first_award":[[179002,50]],"show_fight_award":[[1241200,1],[1251200,1],[1261200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[200,1009],[200,1010],[200,1011],[200,1012],[200,1013],[200,1014],[200,1015],[200,1016],[200,1017],[200,1018],[200,1019],[200,1020],[200,1021],[200,1022],[200,1023],[200,1024],[200,1025],[200,1026],[200,1027],[200,1028],[200,1029],[200,1030],[200,1031],[200,1032],[7400,1033],[7400,1034],[7400,1035],[7400,1036],[7400,1037],[7400,1038],[7400,1039],[7400,1040],[7400,1041],[7400,1042],[7400,1043],[7400,1044],[7400,1045],[7400,1046],[7400,1047],[7400,1048],[7400,1049],[7400,1050],[7400,1051],[7400,1052],[7400,1053],[7400,1054],[7400,1055],[7400,1056],[2400,1057],[2400,1058],[2400,1059],[2400,1060],[2400,1061],[2400,1062],[2400,1063],[2400,1064],[2400,1065],[2400,1066],[2400,1067],[2400,1068],[2400,1069],[2400,1070],[2400,1071],[2400,1072],[2400,1073],[2400,1074],[2400,1075],[2400,1076],[2400,1077],[2400,1078],[2400,1079],[2400,1080]]],"random_fight_award_n":[[[30,2]]]}`|
|20|`{"fight_id":4000020,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[7400,1081],[7400,1082],[7400,1083],[7400,1084],[7400,1085],[7400,1086],[7400,1087],[7400,1088],[7400,1089],[7400,1090],[7400,1091],[7400,1092],[7400,1093],[7400,1094],[7400,1095],[7400,1096],[7400,1097],[7400,1098],[7400,1099],[7400,1100],[7400,1101],[7400,1102],[7400,1103],[7400,1104],[2600,1105],[2600,1106],[2600,1107],[2600,1108],[2600,1109],[2600,1110],[2600,1111],[2600,1112],[2600,1113],[2600,1114],[2600,1115],[2600,1116],[2600,1117],[2600,1118],[2600,1119],[2600,1120],[2600,1121],[2600,1122],[2600,1123],[2600,1124],[2600,1125],[2600,1126],[2600,1127],[2600,1128]]],"random_fight_award_n":[[[30,2]]]}`|
|21|`{"fight_id":4000021,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[6500,1129],[6500,1130],[6500,1131],[6500,1132],[6500,1133],[6500,1134],[6500,1135],[6500,1136],[6500,1137],[6500,1138],[6500,1139],[6500,1140],[6500,1141],[6500,1142],[6500,1143],[6500,1144],[6500,1145],[6500,1146],[6500,1147],[6500,1148],[6500,1149],[6500,1150],[6500,1151],[6500,1152],[3000,1153],[3000,1154],[3000,1155],[3000,1156],[3000,1157],[3000,1158],[3000,1159],[3000,1160],[3000,1161],[3000,1162],[3000,1163],[3000,1164],[3000,1165],[3000,1166],[3000,1167],[3000,1168],[3000,1169],[3000,1170],[3000,1171],[3000,1172],[3000,1173],[3000,1174],[3000,1175],[3000,1176],[200,1177],[200,1178],[200,1179],[200,1180],[200,1181],[200,1182],[200,1183],[200,1184],[200,1185],[200,1186],[200,1187],[200,1188],[200,1189],[200,1190],[200,1191],[200,1192],[200,1193],[200,1194],[200,1195],[200,1196],[200,1197],[200,1198],[200,1199],[200,1200],[3600,1201],[2880,1202],[720,1203]]],"random_fight_award_n":[[[30,2]]]}`|
|22|`{"fight_id":4000022,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[6280,1204],[6280,1205],[6280,1206],[6280,1207],[6280,1208],[6280,1209],[6280,1210],[6280,1211],[6280,1212],[6280,1213],[6280,1214],[6280,1215],[6280,1216],[6280,1217],[6280,1218],[6280,1219],[6280,1220],[6280,1221],[6280,1222],[6280,1223],[6280,1224],[6280,1225],[6280,1226],[6280,1227],[3200,1228],[3200,1229],[3200,1230],[3200,1231],[3200,1232],[3200,1233],[3200,1234],[3200,1235],[3200,1236],[3200,1237],[3200,1238],[3200,1239],[3200,1240],[3200,1241],[3200,1242],[3200,1243],[3200,1244],[3200,1245],[3200,1246],[3200,1247],[3200,1248],[3200,1249],[3200,1250],[3200,1251],[208,1252],[208,1253],[208,1254],[208,1255],[208,1256],[208,1257],[208,1258],[208,1259],[208,1260],[208,1261],[208,1262],[208,1263],[208,1264],[208,1265],[208,1266],[208,1267],[208,1268],[208,1269],[208,1270],[208,1271],[208,1272],[208,1273],[208,1274],[208,1275],[3744,1276],[2995,1277],[745,1278]]],"random_fight_award_n":[[[30,2]]]}`|
|23|`{"fight_id":4000023,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[6060,1279],[6060,1280],[6060,1281],[6060,1282],[6060,1283],[6060,1284],[6060,1285],[6060,1286],[6060,1287],[6060,1288],[6060,1289],[6060,1290],[6060,1291],[6060,1292],[6060,1293],[6060,1294],[6060,1295],[6060,1296],[6060,1297],[6060,1298],[6060,1299],[6060,1300],[6060,1301],[6060,1302],[3400,1303],[3400,1304],[3400,1305],[3400,1306],[3400,1307],[3400,1308],[3400,1309],[3400,1310],[3400,1311],[3400,1312],[3400,1313],[3400,1314],[3400,1315],[3400,1316],[3400,1317],[3400,1318],[3400,1319],[3400,1320],[3400,1321],[3400,1322],[3400,1323],[3400,1324],[3400,1325],[3400,1326],[216,1327],[216,1328],[216,1329],[216,1330],[216,1331],[216,1332],[216,1333],[216,1334],[216,1335],[216,1336],[216,1337],[216,1338],[216,1339],[216,1340],[216,1341],[216,1342],[216,1343],[216,1344],[216,1345],[216,1346],[216,1347],[216,1348],[216,1349],[216,1350],[3888,1351],[3110,1352],[778,1353]]],"random_fight_award_n":[[[30,2]]]}`|
|24|`{"fight_id":4000024,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[5840,1354],[5840,1355],[5840,1356],[5840,1357],[5840,1358],[5840,1359],[5840,1360],[5840,1361],[5840,1362],[5840,1363],[5840,1364],[5840,1365],[5840,1366],[5840,1367],[5840,1368],[5840,1369],[5840,1370],[5840,1371],[5840,1372],[5840,1373],[5840,1374],[5840,1375],[5840,1376],[5840,1377],[3600,1378],[3600,1379],[3600,1380],[3600,1381],[3600,1382],[3600,1383],[3600,1384],[3600,1385],[3600,1386],[3600,1387],[3600,1388],[3600,1389],[3600,1390],[3600,1391],[3600,1392],[3600,1393],[3600,1394],[3600,1395],[3600,1396],[3600,1397],[3600,1398],[3600,1399],[3600,1400],[3600,1401],[560,1402],[560,1403],[560,1404],[560,1405],[560,1406],[560,1407],[560,1408],[560,1409],[560,1410],[560,1411],[560,1412],[560,1413],[560,1414],[560,1415],[560,1416],[560,1417],[560,1418],[560,1419],[560,1420],[560,1421],[560,1422],[560,1423],[560,1424],[560,1425],[4032,1426],[3226,1427],[806,1428]]],"random_fight_award_n":[[[30,2]]]}`|
|25|`{"fight_id":4000025,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[5400,1429],[5400,1430],[5400,1431],[5400,1432],[5400,1433],[5400,1434],[5400,1435],[5400,1436],[5400,1437],[5400,1438],[5400,1439],[5400,1440],[5400,1441],[5400,1442],[5400,1443],[5400,1444],[5400,1445],[5400,1446],[5400,1447],[5400,1448],[5400,1449],[5400,1450],[5400,1451],[5400,1452],[4000,1453],[4000,1454],[4000,1455],[4000,1456],[4000,1457],[4000,1458],[4000,1459],[4000,1460],[4000,1461],[4000,1462],[4000,1463],[4000,1464],[4000,1465],[4000,1466],[4000,1467],[4000,1468],[4000,1469],[4000,1470],[4000,1471],[4000,1472],[4000,1473],[4000,1474],[4000,1475],[4000,1476],[240,1477],[240,1478],[240,1479],[240,1480],[240,1481],[240,1482],[240,1483],[240,1484],[240,1485],[240,1486],[240,1487],[240,1488],[240,1489],[240,1490],[240,1491],[240,1492],[240,1493],[240,1494],[240,1495],[240,1496],[240,1497],[240,1498],[240,1499],[240,1500],[4320,1501],[3456,1502],[864,1503]]],"random_fight_award_n":[[[30,2]]]}`|
|26|`{"fight_id":4000026,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[5180,1504],[5180,1505],[5180,1506],[5180,1507],[5180,1508],[5180,1509],[5180,1510],[5180,1511],[5180,1512],[5180,1513],[5180,1514],[5180,1515],[5180,1516],[5180,1517],[5180,1518],[5180,1519],[5180,1520],[5180,1521],[5180,1522],[5180,1523],[5180,1524],[5180,1525],[5180,1526],[5180,1527],[4200,1528],[4200,1529],[4200,1530],[4200,1531],[4200,1532],[4200,1533],[4200,1534],[4200,1535],[4200,1536],[4200,1537],[4200,1538],[4200,1539],[4200,1540],[4200,1541],[4200,1542],[4200,1543],[4200,1544],[4200,1545],[4200,1546],[4200,1547],[4200,1548],[4200,1549],[4200,1550],[4200,1551],[248,1552],[248,1553],[248,1554],[248,1555],[248,1556],[248,1557],[248,1558],[248,1559],[248,1560],[248,1561],[248,1562],[248,1563],[248,1564],[248,1565],[248,1566],[248,1567],[248,1568],[248,1569],[248,1570],[248,1571],[248,1572],[248,1573],[248,1574],[248,1575],[4464,1576],[3571,1577],[893,1578]]],"random_fight_award_n":[[[30,2]]]}`|
|27|`{"fight_id":4000027,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[4960,1579],[4960,1580],[4960,1581],[4960,1582],[4960,1583],[4960,1584],[4960,1585],[4960,1586],[4960,1587],[4960,1588],[4960,1589],[4960,1590],[4960,1591],[4960,1592],[4960,1593],[4960,1594],[4960,1595],[4960,1596],[4960,1597],[4960,1598],[4960,1599],[4960,1600],[4960,1601],[4960,1602],[4400,1603],[4400,1604],[4400,1605],[4400,1606],[4400,1607],[4400,1608],[4400,1609],[4400,1610],[4400,1611],[4400,1612],[4400,1613],[4400,1614],[4400,1615],[4400,1616],[4400,1617],[4400,1618],[4400,1619],[4400,1620],[4400,1621],[4400,1622],[4400,1623],[4400,1624],[4400,1625],[4400,1626],[256,1627],[256,1628],[256,1629],[256,1630],[256,1631],[256,1632],[256,1633],[256,1634],[256,1635],[256,1636],[256,1637],[256,1638],[256,1639],[256,1640],[256,1641],[256,1642],[256,1643],[256,1644],[256,1645],[256,1646],[256,1647],[256,1648],[256,1649],[256,1650],[4608,1651],[3686,1652],[922,1653]]],"random_fight_award_n":[[[30,2]]]}`|
|28|`{"fight_id":4000028,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[4740,1654],[4740,1655],[4740,1656],[4740,1657],[4740,1658],[4740,1659],[4740,1660],[4740,1661],[4740,1662],[4740,1663],[4740,1664],[4740,1665],[4740,1666],[4740,1667],[4740,1668],[4740,1669],[4740,1670],[4740,1671],[4740,1672],[4740,1673],[4740,1674],[4740,1675],[4740,1676],[4740,1677],[4600,1678],[4600,1679],[4600,1680],[4600,1681],[4600,1682],[4600,1683],[4600,1684],[4600,1685],[4600,1686],[4600,1687],[4600,1688],[4600,1689],[4600,1690],[4600,1691],[4600,1692],[4600,1693],[4600,1694],[4600,1695],[4600,1696],[4600,1697],[4600,1698],[4600,1699],[4600,1700],[4600,1701],[264,1702],[264,1703],[264,1704],[264,1705],[264,1706],[264,1707],[264,1708],[264,1709],[264,1710],[264,1711],[264,1712],[264,1713],[264,1714],[264,1715],[264,1716],[264,1717],[264,1718],[264,1719],[264,1720],[264,1721],[264,1722],[264,1723],[264,1724],[264,1725],[4752,1726],[3801,1727],[951,1728]]],"random_fight_award_n":[[[30,2]]]}`|
|29|`{"fight_id":4000029,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[4300,1729],[4300,1730],[4300,1731],[4300,1732],[4300,1733],[4300,1734],[4300,1735],[4300,1736],[4300,1737],[4300,1738],[4300,1739],[4300,1740],[4300,1741],[4300,1742],[4300,1743],[4300,1744],[4300,1745],[4300,1746],[4300,1747],[4300,1748],[4300,1749],[4300,1750],[4300,1751],[4300,1752],[5000,1753],[5000,1754],[5000,1755],[5000,1756],[5000,1757],[5000,1758],[5000,1759],[5000,1760],[5000,1761],[5000,1762],[5000,1763],[5000,1764],[5000,1765],[5000,1766],[5000,1767],[5000,1768],[5000,1769],[5000,1770],[5000,1771],[5000,1772],[5000,1773],[5000,1774],[5000,1775],[5000,1776],[280,1777],[280,1778],[280,1779],[280,1780],[280,1781],[280,1782],[280,1783],[280,1784],[280,1785],[280,1786],[280,1787],[280,1788],[280,1789],[280,1790],[280,1791],[280,1792],[280,1793],[280,1794],[280,1795],[280,1796],[280,1797],[280,1798],[280,1799],[280,1800],[5040,1801],[4032,1802],[1008,1803]]],"random_fight_award_n":[[[30,2]]]}`|
|30|`{"fight_id":4000030,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[4080,1804],[4080,1805],[4080,1806],[4080,1807],[4080,1808],[4080,1809],[4080,1810],[4080,1811],[4080,1812],[4080,1813],[4080,1814],[4080,1815],[4080,1816],[4080,1817],[4080,1818],[4080,1819],[4080,1820],[4080,1821],[4080,1822],[4080,1823],[4080,1824],[4080,1825],[4080,1826],[4080,1827],[5200,1828],[5200,1829],[5200,1830],[5200,1831],[5200,1832],[5200,1833],[5200,1834],[5200,1835],[5200,1836],[5200,1837],[5200,1838],[5200,1839],[5200,1840],[5200,1841],[5200,1842],[5200,1843],[5200,1844],[5200,1845],[5200,1846],[5200,1847],[5200,1848],[5200,1849],[5200,1850],[5200,1851],[288,1852],[288,1853],[288,1854],[288,1855],[288,1856],[288,1857],[288,1858],[288,1859],[288,1860],[288,1861],[288,1862],[288,1863],[288,1864],[288,1865],[288,1866],[288,1867],[288,1868],[288,1869],[288,1870],[288,1871],[288,1872],[288,1873],[288,1874],[288,1875],[5184,1876],[4147,1877],[1037,1878]]],"random_fight_award_n":[[[30,2]]]}`|
|31|`{"fight_id":4000031,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[3860,1879],[3860,1880],[3860,1881],[3860,1882],[3860,1883],[3860,1884],[3860,1885],[3860,1886],[3860,1887],[3860,1888],[3860,1889],[3860,1890],[3860,1891],[3860,1892],[3860,1893],[3860,1894],[3860,1895],[3860,1896],[3860,1897],[3860,1898],[3860,1899],[3860,1900],[3860,1901],[3860,1902],[5400,1903],[5400,1904],[5400,1905],[5400,1906],[5400,1907],[5400,1908],[5400,1909],[5400,1910],[5400,1911],[5400,1912],[5400,1913],[5400,1914],[5400,1915],[5400,1916],[5400,1917],[5400,1918],[5400,1919],[5400,1920],[5400,1921],[5400,1922],[5400,1923],[5400,1924],[5400,1925],[5400,1926],[296,1927],[296,1928],[296,1929],[296,1930],[296,1931],[296,1932],[296,1933],[296,1934],[296,1935],[296,1936],[296,1937],[296,1938],[296,1939],[296,1940],[296,1941],[296,1942],[296,1943],[296,1944],[296,1945],[296,1946],[296,1947],[296,1948],[296,1949],[296,1950],[5328,1951],[4262,1952],[1066,1953]]],"random_fight_award_n":[[[30,2]]]}`|
|32|`{"fight_id":4000032,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[3640,1954],[3640,1955],[3640,1956],[3640,1957],[3640,1958],[3640,1959],[3640,1960],[3640,1961],[3640,1962],[3640,1963],[3640,1964],[3640,1965],[3640,1966],[3640,1967],[3640,1968],[3640,1969],[3640,1970],[3640,1971],[3640,1972],[3640,1973],[3640,1974],[3640,1975],[3640,1976],[3640,1977],[5600,1978],[5600,1979],[5600,1980],[5600,1981],[5600,1982],[5600,1983],[5600,1984],[5600,1985],[5600,1986],[5600,1987],[5600,1988],[5600,1989],[5600,1990],[5600,1991],[5600,1992],[5600,1993],[5600,1994],[5600,1995],[5600,1996],[5600,1997],[5600,1998],[5600,1999],[5600,2000],[5600,2001],[304,2002],[304,2003],[304,2004],[304,2005],[304,2006],[304,2007],[304,2008],[304,2009],[304,2010],[304,2011],[304,2012],[304,2013],[304,2014],[304,2015],[304,2016],[304,2017],[304,2018],[304,2019],[304,2020],[304,2021],[304,2022],[304,2023],[304,2024],[304,2025],[5472,2026],[4377,2027],[1095,2028]]],"random_fight_award_n":[[[30,2]]]}`|
|33|`{"fight_id":4000033,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[3200,2029],[3200,2030],[3200,2031],[3200,2032],[3200,2033],[3200,2034],[3200,2035],[3200,2036],[3200,2037],[3200,2038],[3200,2039],[3200,2040],[3200,2041],[3200,2042],[3200,2043],[3200,2044],[3200,2045],[3200,2046],[3200,2047],[3200,2048],[3200,2049],[3200,2050],[3200,2051],[3200,2052],[6000,2053],[6000,2054],[6000,2055],[6000,2056],[6000,2057],[6000,2058],[6000,2059],[6000,2060],[6000,2061],[6000,2062],[6000,2063],[6000,2064],[6000,2065],[6000,2066],[6000,2067],[6000,2068],[6000,2069],[6000,2070],[6000,2071],[6000,2072],[6000,2073],[6000,2074],[6000,2075],[6000,2076],[320,2077],[320,2078],[320,2079],[320,2080],[320,2081],[320,2082],[320,2083],[320,2084],[320,2085],[320,2086],[320,2087],[320,2088],[320,2089],[320,2090],[320,2091],[320,2092],[320,2093],[320,2094],[320,2095],[320,2096],[320,2097],[320,2098],[320,2099],[320,2100],[5760,2101],[4608,2102],[1152,2103]]],"random_fight_award_n":[[[30,2]]]}`|
|34|`{"fight_id":4000034,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[2980,2104],[2980,2105],[2980,2106],[2980,2107],[2980,2108],[2980,2109],[2980,2110],[2980,2111],[2980,2112],[2980,2113],[2980,2114],[2980,2115],[2980,2116],[2980,2117],[2980,2118],[2980,2119],[2980,2120],[2980,2121],[2980,2122],[2980,2123],[2980,2124],[2980,2125],[2980,2126],[2980,2127],[6200,2128],[6200,2129],[6200,2130],[6200,2131],[6200,2132],[6200,2133],[6200,2134],[6200,2135],[6200,2136],[6200,2137],[6200,2138],[6200,2139],[6200,2140],[6200,2141],[6200,2142],[6200,2143],[6200,2144],[6200,2145],[6200,2146],[6200,2147],[6200,2148],[6200,2149],[6200,2150],[6200,2151],[328,2152],[328,2153],[328,2154],[328,2155],[328,2156],[328,2157],[328,2158],[328,2159],[328,2160],[328,2161],[328,2162],[328,2163],[328,2164],[328,2165],[328,2166],[328,2167],[328,2168],[328,2169],[328,2170],[328,2171],[328,2172],[328,2173],[328,2174],[328,2175],[5904,2176],[4723,2177],[1181,2178]]],"random_fight_award_n":[[[30,2]]]}`|
|35|`{"fight_id":4000035,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[2760,2179],[2760,2180],[2760,2181],[2760,2182],[2760,2183],[2760,2184],[2760,2185],[2760,2186],[2760,2187],[2760,2188],[2760,2189],[2760,2190],[2760,2191],[2760,2192],[2760,2193],[2760,2194],[2760,2195],[2760,2196],[2760,2197],[2760,2198],[2760,2199],[2760,2200],[2760,2201],[2760,2202],[6400,2203],[6400,2204],[6400,2205],[6400,2206],[6400,2207],[6400,2208],[6400,2209],[6400,2210],[6400,2211],[6400,2212],[6400,2213],[6400,2214],[6400,2215],[6400,2216],[6400,2217],[6400,2218],[6400,2219],[6400,2220],[6400,2221],[6400,2222],[6400,2223],[6400,2224],[6400,2225],[6400,2226],[336,2227],[336,2228],[336,2229],[336,2230],[336,2231],[336,2232],[336,2233],[336,2234],[336,2235],[336,2236],[336,2237],[336,2238],[336,2239],[336,2240],[336,2241],[336,2242],[336,2243],[336,2244],[336,2245],[336,2246],[336,2247],[336,2248],[336,2249],[336,2250],[6048,2251],[4838,2252],[1210,2253]]],"random_fight_award_n":[[[30,2]]]}`|
|36|`{"fight_id":4000036,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[2540,2254],[2540,2255],[2540,2256],[2540,2257],[2540,2258],[2540,2259],[2540,2260],[2540,2261],[2540,2262],[2540,2263],[2540,2264],[2540,2265],[2540,2266],[2540,2267],[2540,2268],[2540,2269],[2540,2270],[2540,2271],[2540,2272],[2540,2273],[2540,2274],[2540,2275],[2540,2276],[2540,2277],[6600,2278],[6600,2279],[6600,2280],[6600,2281],[6600,2282],[6600,2283],[6600,2284],[6600,2285],[6600,2286],[6600,2287],[6600,2288],[6600,2289],[6600,2290],[6600,2291],[6600,2292],[6600,2293],[6600,2294],[6600,2295],[6600,2296],[6600,2297],[6600,2298],[6600,2299],[6600,2300],[6600,2301],[344,2302],[344,2303],[344,2304],[344,2305],[344,2306],[344,2307],[344,2308],[344,2309],[344,2310],[344,2311],[344,2312],[344,2313],[344,2314],[344,2315],[344,2316],[344,2317],[344,2318],[344,2319],[344,2320],[344,2321],[344,2322],[344,2323],[344,2324],[344,2325],[6192,2326],[4953,2327],[1239,2328]]],"random_fight_award_n":[[[30,2]]]}`|
|37|`{"fight_id":4000037,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[2100,2329],[2100,2330],[2100,2331],[2100,2332],[2100,2333],[2100,2334],[2100,2335],[2100,2336],[2100,2337],[2100,2338],[2100,2339],[2100,2340],[2100,2341],[2100,2342],[2100,2343],[2100,2344],[2100,2345],[2100,2346],[2100,2347],[2100,2348],[2100,2349],[2100,2350],[2100,2351],[2100,2352],[7000,2353],[7000,2354],[7000,2355],[7000,2356],[7000,2357],[7000,2358],[7000,2359],[7000,2360],[7000,2361],[7000,2362],[7000,2363],[7000,2364],[7000,2365],[7000,2366],[7000,2367],[7000,2368],[7000,2369],[7000,2370],[7000,2371],[7000,2372],[7000,2373],[7000,2374],[7000,2375],[7000,2376],[360,2377],[360,2378],[360,2379],[360,2380],[360,2381],[360,2382],[360,2383],[360,2384],[360,2385],[360,2386],[360,2387],[360,2388],[360,2389],[360,2390],[360,2391],[360,2392],[360,2393],[360,2394],[360,2395],[360,2396],[360,2397],[360,2398],[360,2399],[360,2400],[6480,2401],[5184,2402],[1296,2403]]],"random_fight_award_n":[[[30,2]]]}`|
|38|`{"fight_id":4000038,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[1880,2404],[1880,2405],[1880,2406],[1880,2407],[1880,2408],[1880,2409],[1880,2410],[1880,2411],[1880,2412],[1880,2413],[1880,2414],[1880,2415],[1880,2416],[1880,2417],[1880,2418],[1880,2419],[1880,2420],[1880,2421],[1880,2422],[1880,2423],[1880,2424],[1880,2425],[1880,2426],[1880,2427],[7200,2428],[7200,2429],[7200,2430],[7200,2431],[7200,2432],[7200,2433],[7200,2434],[7200,2435],[7200,2436],[7200,2437],[7200,2438],[7200,2439],[7200,2440],[7200,2441],[7200,2442],[7200,2443],[7200,2444],[7200,2445],[7200,2446],[7200,2447],[7200,2448],[7200,2449],[7200,2450],[7200,2451],[368,2452],[368,2453],[368,2454],[368,2455],[368,2456],[368,2457],[368,2458],[368,2459],[368,2460],[368,2461],[368,2462],[368,2463],[368,2464],[368,2465],[368,2466],[368,2467],[368,2468],[368,2469],[368,2470],[368,2471],[368,2472],[368,2473],[368,2474],[368,2475],[6624,2476],[5299,2477],[1325,2478]]],"random_fight_award_n":[[[30,2]]]}`|
|39|`{"fight_id":4000039,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[1660,2479],[1660,2480],[1660,2481],[1660,2482],[1660,2483],[1660,2484],[1660,2485],[1660,2486],[1660,2487],[1660,2488],[1660,2489],[1660,2490],[1660,2491],[1660,2492],[1660,2493],[1660,2494],[1660,2495],[1660,2496],[1660,2497],[1660,2498],[1660,2499],[1660,2500],[1660,2501],[1660,2502],[7400,2503],[7400,2504],[7400,2505],[7400,2506],[7400,2507],[7400,2508],[7400,2509],[7400,2510],[7400,2511],[7400,2512],[7400,2513],[7400,2514],[7400,2515],[7400,2516],[7400,2517],[7400,2518],[7400,2519],[7400,2520],[7400,2521],[7400,2522],[7400,2523],[7400,2524],[7400,2525],[7400,2526],[376,2527],[376,2528],[376,2529],[376,2530],[376,2531],[376,2532],[376,2533],[376,2534],[376,2535],[376,2536],[376,2537],[376,2538],[376,2539],[376,2540],[376,2541],[376,2542],[376,2543],[376,2544],[376,2545],[376,2546],[376,2547],[376,2548],[376,2549],[376,2550],[6768,2551],[5414,2552],[1354,2553]]],"random_fight_award_n":[[[30,2]]]}`|
|40|`{"fight_id":4000040,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[1440,2554],[1440,2555],[1440,2556],[1440,2557],[1440,2558],[1440,2559],[1440,2560],[1440,2561],[1440,2562],[1440,2563],[1440,2564],[1440,2565],[1440,2566],[1440,2567],[1440,2568],[1440,2569],[1440,2570],[1440,2571],[1440,2572],[1440,2573],[1440,2574],[1440,2575],[1440,2576],[1440,2577],[7600,2578],[7600,2579],[7600,2580],[7600,2581],[7600,2582],[7600,2583],[7600,2584],[7600,2585],[7600,2586],[7600,2587],[7600,2588],[7600,2589],[7600,2590],[7600,2591],[7600,2592],[7600,2593],[7600,2594],[7600,2595],[7600,2596],[7600,2597],[7600,2598],[7600,2599],[7600,2600],[7600,2601],[384,2602],[384,2603],[384,2604],[384,2605],[384,2606],[384,2607],[384,2608],[384,2609],[384,2610],[384,2611],[384,2612],[384,2613],[384,2614],[384,2615],[384,2616],[384,2617],[384,2618],[384,2619],[384,2620],[384,2621],[384,2622],[384,2623],[384,2624],[384,2625],[6912,2626],[5530,2627],[1382,2628]]],"random_fight_award_n":[[[30,2]]]}`|
|41|`{"fight_id":4000041,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[1400,4001],[1400,4002],[1400,4003],[1400,4004],[1400,4005],[1400,4006],[1400,4007],[1400,4008],[1400,4009],[1400,4010],[1400,4011],[1400,4012],[1400,4013],[1400,4014],[1400,4015],[1400,4016],[1400,4017],[1400,4018],[1400,4019],[1400,4020],[1400,4021],[1400,4022],[1400,4023],[1400,4024],[7620,4025],[7620,4026],[7620,4027],[7620,4028],[7620,4029],[7620,4030],[7620,4031],[7620,4032],[7620,4033],[7620,4034],[7620,4035],[7620,4036],[7620,4037],[7620,4038],[7620,4039],[7620,4040],[7620,4041],[7620,4042],[7620,4043],[7620,4044],[7620,4045],[7620,4046],[7620,4047],[7620,4048],[392,4049],[392,4050],[392,4051],[392,4052],[392,4053],[392,4054],[392,4055],[392,4056],[392,4057],[392,4058],[392,4059],[392,4060],[392,4061],[392,4062],[392,4063],[392,4064],[392,4065],[392,4066],[392,4067],[392,4068],[392,4069],[392,4070],[392,4071],[392,4072],[7056,4073],[5645,4074],[1411,4075]]],"random_fight_award_n":[[[30,2]]]}`|
|42|`{"fight_id":4000042,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[1370,4076],[1370,4077],[1370,4078],[1370,4079],[1370,4080],[1370,4081],[1370,4082],[1370,4083],[1370,4084],[1370,4085],[1370,4086],[1370,4087],[1370,4088],[1370,4089],[1370,4090],[1370,4091],[1370,4092],[1370,4093],[1370,4094],[1370,4095],[1370,4096],[1370,4097],[1370,4098],[1370,4099],[7640,4100],[7640,4101],[7640,4102],[7640,4103],[7640,4104],[7640,4105],[7640,4106],[7640,4107],[7640,4108],[7640,4109],[7640,4110],[7640,4111],[7640,4112],[7640,4113],[7640,4114],[7640,4115],[7640,4116],[7640,4117],[7640,4118],[7640,4119],[7640,4120],[7640,4121],[7640,4122],[7640,4123],[396,4124],[396,4125],[396,4126],[396,4127],[396,4128],[396,4129],[396,4130],[396,4131],[396,4132],[396,4133],[396,4134],[396,4135],[396,4136],[396,4137],[396,4138],[396,4139],[396,4140],[396,4141],[396,4142],[396,4143],[396,4144],[396,4145],[396,4146],[396,4147],[7128,4148],[5702,4149],[1426,4150]]],"random_fight_award_n":[[[30,2]]]}`|
|43|`{"fight_id":4000043,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[1340,4151],[1340,4152],[1340,4153],[1340,4154],[1340,4155],[1340,4156],[1340,4157],[1340,4158],[1340,4159],[1340,4160],[1340,4161],[1340,4162],[1340,4163],[1340,4164],[1340,4165],[1340,4166],[1340,4167],[1340,4168],[1340,4169],[1340,4170],[1340,4171],[1340,4172],[1340,4173],[1340,4174],[7660,4175],[7660,4176],[7660,4177],[7660,4178],[7660,4179],[7660,4180],[7660,4181],[7660,4182],[7660,4183],[7660,4184],[7660,4185],[7660,4186],[7660,4187],[7660,4188],[7660,4189],[7660,4190],[7660,4191],[7660,4192],[7660,4193],[7660,4194],[7660,4195],[7660,4196],[7660,4197],[7660,4198],[400,4199],[400,4200],[400,4201],[400,4202],[400,4203],[400,4204],[400,4205],[400,4206],[400,4207],[400,4208],[400,4209],[400,4210],[400,4211],[400,4212],[400,4213],[400,4214],[400,4215],[400,4216],[400,4217],[400,4218],[400,4219],[400,4220],[400,4221],[400,4222],[7200,4223],[5760,4224],[1440,4225]]],"random_fight_award_n":[[[30,2]]]}`|
|44|`{"fight_id":4000044,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[1310,4226],[1310,4227],[1310,4228],[1310,4229],[1310,4230],[1310,4231],[1310,4232],[1310,4233],[1310,4234],[1310,4235],[1310,4236],[1310,4237],[1310,4238],[1310,4239],[1310,4240],[1310,4241],[1310,4242],[1310,4243],[1310,4244],[1310,4245],[1310,4246],[1310,4247],[1310,4248],[1310,4249],[7680,4250],[7680,4251],[7680,4252],[7680,4253],[7680,4254],[7680,4255],[7680,4256],[7680,4257],[7680,4258],[7680,4259],[7680,4260],[7680,4261],[7680,4262],[7680,4263],[7680,4264],[7680,4265],[7680,4266],[7680,4267],[7680,4268],[7680,4269],[7680,4270],[7680,4271],[7680,4272],[7680,4273],[404,4274],[404,4275],[404,4276],[404,4277],[404,4278],[404,4279],[404,4280],[404,4281],[404,4282],[404,4283],[404,4284],[404,4285],[404,4286],[404,4287],[404,4288],[404,4289],[404,4290],[404,4291],[404,4292],[404,4293],[404,4294],[404,4295],[404,4296],[404,4297],[7272,4298],[5817,4299],[1455,4300]]],"random_fight_award_n":[[[30,2]]]}`|
|45|`{"fight_id":4000045,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[1280,4301],[1280,4302],[1280,4303],[1280,4304],[1280,4305],[1280,4306],[1280,4307],[1280,4308],[1280,4309],[1280,4310],[1280,4311],[1280,4312],[1280,4313],[1280,4314],[1280,4315],[1280,4316],[1280,4317],[1280,4318],[1280,4319],[1280,4320],[1280,4321],[1280,4322],[1280,4323],[1280,4324],[7700,4325],[7700,4326],[7700,4327],[7700,4328],[7700,4329],[7700,4330],[7700,4331],[7700,4332],[7700,4333],[7700,4334],[7700,4335],[7700,4336],[7700,4337],[7700,4338],[7700,4339],[7700,4340],[7700,4341],[7700,4342],[7700,4343],[7700,4344],[7700,4345],[7700,4346],[7700,4347],[7700,4348],[408,4349],[408,4350],[408,4351],[408,4352],[408,4353],[408,4354],[408,4355],[408,4356],[408,4357],[408,4358],[408,4359],[408,4360],[408,4361],[408,4362],[408,4363],[408,4364],[408,4365],[408,4366],[408,4367],[408,4368],[408,4369],[408,4370],[408,4371],[408,4372],[7344,4373],[5875,4374],[1469,4375]]],"random_fight_award_n":[[[30,2]]]}`|
|46|`{"fight_id":4000046,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[1250,4376],[1250,4377],[1250,4378],[1250,4379],[1250,4380],[1250,4381],[1250,4382],[1250,4383],[1250,4384],[1250,4385],[1250,4386],[1250,4387],[1250,4388],[1250,4389],[1250,4390],[1250,4391],[1250,4392],[1250,4393],[1250,4394],[1250,4395],[1250,4396],[1250,4397],[1250,4398],[1250,4399],[7720,4400],[7720,4401],[7720,4402],[7720,4403],[7720,4404],[7720,4405],[7720,4406],[7720,4407],[7720,4408],[7720,4409],[7720,4410],[7720,4411],[7720,4412],[7720,4413],[7720,4414],[7720,4415],[7720,4416],[7720,4417],[7720,4418],[7720,4419],[7720,4420],[7720,4421],[7720,4422],[7720,4423],[412,4424],[412,4425],[412,4426],[412,4427],[412,4428],[412,4429],[412,4430],[412,4431],[412,4432],[412,4433],[412,4434],[412,4435],[412,4436],[412,4437],[412,4438],[412,4439],[412,4440],[412,4441],[412,4442],[412,4443],[412,4444],[412,4445],[412,4446],[412,4447],[7416,4448],[5932,4449],[1484,4450]]],"random_fight_award_n":[[[30,2]]]}`|
|47|`{"fight_id":4000047,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[1220,4451],[1220,4452],[1220,4453],[1220,4454],[1220,4455],[1220,4456],[1220,4457],[1220,4458],[1220,4459],[1220,4460],[1220,4461],[1220,4462],[1220,4463],[1220,4464],[1220,4465],[1220,4466],[1220,4467],[1220,4468],[1220,4469],[1220,4470],[1220,4471],[1220,4472],[1220,4473],[1220,4474],[7740,4475],[7740,4476],[7740,4477],[7740,4478],[7740,4479],[7740,4480],[7740,4481],[7740,4482],[7740,4483],[7740,4484],[7740,4485],[7740,4486],[7740,4487],[7740,4488],[7740,4489],[7740,4490],[7740,4491],[7740,4492],[7740,4493],[7740,4494],[7740,4495],[7740,4496],[7740,4497],[7740,4498],[416,4499],[416,4500],[416,4501],[416,4502],[416,4503],[416,4504],[416,4505],[416,4506],[416,4507],[416,4508],[416,4509],[416,4510],[416,4511],[416,4512],[416,4513],[416,4514],[416,4515],[416,4516],[416,4517],[416,4518],[416,4519],[416,4520],[416,4521],[416,4522],[7488,4523],[5990,4524],[1498,4525]]],"random_fight_award_n":[[[30,2]]]}`|
|48|`{"fight_id":4000048,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[1190,4526],[1190,4527],[1190,4528],[1190,4529],[1190,4530],[1190,4531],[1190,4532],[1190,4533],[1190,4534],[1190,4535],[1190,4536],[1190,4537],[1190,4538],[1190,4539],[1190,4540],[1190,4541],[1190,4542],[1190,4543],[1190,4544],[1190,4545],[1190,4546],[1190,4547],[1190,4548],[1190,4549],[7760,4550],[7760,4551],[7760,4552],[7760,4553],[7760,4554],[7760,4555],[7760,4556],[7760,4557],[7760,4558],[7760,4559],[7760,4560],[7760,4561],[7760,4562],[7760,4563],[7760,4564],[7760,4565],[7760,4566],[7760,4567],[7760,4568],[7760,4569],[7760,4570],[7760,4571],[7760,4572],[7760,4573],[420,4574],[420,4575],[420,4576],[420,4577],[420,4578],[420,4579],[420,4580],[420,4581],[420,4582],[420,4583],[420,4584],[420,4585],[420,4586],[420,4587],[420,4588],[420,4589],[420,4590],[420,4591],[420,4592],[420,4593],[420,4594],[420,4595],[420,4596],[420,4597],[7560,4598],[6048,4599],[1512,4600]]],"random_fight_award_n":[[[30,2]]]}`|
|49|`{"fight_id":4000049,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[1160,4601],[1160,4602],[1160,4603],[1160,4604],[1160,4605],[1160,4606],[1160,4607],[1160,4608],[1160,4609],[1160,4610],[1160,4611],[1160,4612],[1160,4613],[1160,4614],[1160,4615],[1160,4616],[1160,4617],[1160,4618],[1160,4619],[1160,4620],[1160,4621],[1160,4622],[1160,4623],[1160,4624],[7780,4625],[7780,4626],[7780,4627],[7780,4628],[7780,4629],[7780,4630],[7780,4631],[7780,4632],[7780,4633],[7780,4634],[7780,4635],[7780,4636],[7780,4637],[7780,4638],[7780,4639],[7780,4640],[7780,4641],[7780,4642],[7780,4643],[7780,4644],[7780,4645],[7780,4646],[7780,4647],[7780,4648],[424,4649],[424,4650],[424,4651],[424,4652],[424,4653],[424,4654],[424,4655],[424,4656],[424,4657],[424,4658],[424,4659],[424,4660],[424,4661],[424,4662],[424,4663],[424,4664],[424,4665],[424,4666],[424,4667],[424,4668],[424,4669],[424,4670],[424,4671],[424,4672],[7632,4673],[6105,4674],[1527,4675]]],"random_fight_award_n":[[[30,2]]]}`|
|50|`{"fight_id":4000050,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[1130,4676],[1130,4677],[1130,4678],[1130,4679],[1130,4680],[1130,4681],[1130,4682],[1130,4683],[1130,4684],[1130,4685],[1130,4686],[1130,4687],[1130,4688],[1130,4689],[1130,4690],[1130,4691],[1130,4692],[1130,4693],[1130,4694],[1130,4695],[1130,4696],[1130,4697],[1130,4698],[1130,4699],[7800,4700],[7800,4701],[7800,4702],[7800,4703],[7800,4704],[7800,4705],[7800,4706],[7800,4707],[7800,4708],[7800,4709],[7800,4710],[7800,4711],[7800,4712],[7800,4713],[7800,4714],[7800,4715],[7800,4716],[7800,4717],[7800,4718],[7800,4719],[7800,4720],[7800,4721],[7800,4722],[7800,4723],[428,4724],[428,4725],[428,4726],[428,4727],[428,4728],[428,4729],[428,4730],[428,4731],[428,4732],[428,4733],[428,4734],[428,4735],[428,4736],[428,4737],[428,4738],[428,4739],[428,4740],[428,4741],[428,4742],[428,4743],[428,4744],[428,4745],[428,4746],[428,4747],[7704,4748],[6163,4749],[1541,4750]]],"random_fight_award_n":[[[30,2]]]}`|
|51|`{"fight_id":4000051,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[1100,4751],[1100,4752],[1100,4753],[1100,4754],[1100,4755],[1100,4756],[1100,4757],[1100,4758],[1100,4759],[1100,4760],[1100,4761],[1100,4762],[1100,4763],[1100,4764],[1100,4765],[1100,4766],[1100,4767],[1100,4768],[1100,4769],[1100,4770],[1100,4771],[1100,4772],[1100,4773],[1100,4774],[7820,4775],[7820,4776],[7820,4777],[7820,4778],[7820,4779],[7820,4780],[7820,4781],[7820,4782],[7820,4783],[7820,4784],[7820,4785],[7820,4786],[7820,4787],[7820,4788],[7820,4789],[7820,4790],[7820,4791],[7820,4792],[7820,4793],[7820,4794],[7820,4795],[7820,4796],[7820,4797],[7820,4798],[432,4799],[432,4800],[432,4801],[432,4802],[432,4803],[432,4804],[432,4805],[432,4806],[432,4807],[432,4808],[432,4809],[432,4810],[432,4811],[432,4812],[432,4813],[432,4814],[432,4815],[432,4816],[432,4817],[432,4818],[432,4819],[432,4820],[432,4821],[432,4822],[7776,4823],[6220,4824],[1556,4825]]],"random_fight_award_n":[[[30,2]]]}`|
|52|`{"fight_id":4000052,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[1070,4826],[1070,4827],[1070,4828],[1070,4829],[1070,4830],[1070,4831],[1070,4832],[1070,4833],[1070,4834],[1070,4835],[1070,4836],[1070,4837],[1070,4838],[1070,4839],[1070,4840],[1070,4841],[1070,4842],[1070,4843],[1070,4844],[1070,4845],[1070,4846],[1070,4847],[1070,4848],[1070,4849],[7840,4850],[7840,4851],[7840,4852],[7840,4853],[7840,4854],[7840,4855],[7840,4856],[7840,4857],[7840,4858],[7840,4859],[7840,4860],[7840,4861],[7840,4862],[7840,4863],[7840,4864],[7840,4865],[7840,4866],[7840,4867],[7840,4868],[7840,4869],[7840,4870],[7840,4871],[7840,4872],[7840,4873],[436,4874],[436,4875],[436,4876],[436,4877],[436,4878],[436,4879],[436,4880],[436,4881],[436,4882],[436,4883],[436,4884],[436,4885],[436,4886],[436,4887],[436,4888],[436,4889],[436,4890],[436,4891],[436,4892],[436,4893],[436,4894],[436,4895],[436,4896],[436,4897],[7848,4898],[6278,4899],[1570,4900]]],"random_fight_award_n":[[[30,2]]]}`|
|53|`{"fight_id":4000053,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[1040,4901],[1040,4902],[1040,4903],[1040,4904],[1040,4905],[1040,4906],[1040,4907],[1040,4908],[1040,4909],[1040,4910],[1040,4911],[1040,4912],[1040,4913],[1040,4914],[1040,4915],[1040,4916],[1040,4917],[1040,4918],[1040,4919],[1040,4920],[1040,4921],[1040,4922],[1040,4923],[1040,4924],[7860,4925],[7860,4926],[7860,4927],[7860,4928],[7860,4929],[7860,4930],[7860,4931],[7860,4932],[7860,4933],[7860,4934],[7860,4935],[7860,4936],[7860,4937],[7860,4938],[7860,4939],[7860,4940],[7860,4941],[7860,4942],[7860,4943],[7860,4944],[7860,4945],[7860,4946],[7860,4947],[7860,4948],[440,4949],[440,4950],[440,4951],[440,4952],[440,4953],[440,4954],[440,4955],[440,4956],[440,4957],[440,4958],[440,4959],[440,4960],[440,4961],[440,4962],[440,4963],[440,4964],[440,4965],[440,4966],[440,4967],[440,4968],[440,4969],[440,4970],[440,4971],[440,4972],[7920,4973],[6336,4974],[1584,4975]]],"random_fight_award_n":[[[30,2]]]}`|
|54|`{"fight_id":4000054,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[1010,4976],[1010,4977],[1010,4978],[1010,4979],[1010,4980],[1010,4981],[1010,4982],[1010,4983],[1010,4984],[1010,4985],[1010,4986],[1010,4987],[1010,4988],[1010,4989],[1010,4990],[1010,4991],[1010,4992],[1010,4993],[1010,4994],[1010,4995],[1010,4996],[1010,4997],[1010,4998],[1010,4999],[7880,5000],[7880,5001],[7880,5002],[7880,5003],[7880,5004],[7880,5005],[7880,5006],[7880,5007],[7880,5008],[7880,5009],[7880,5010],[7880,5011],[7880,5012],[7880,5013],[7880,5014],[7880,5015],[7880,5016],[7880,5017],[7880,5018],[7880,5019],[7880,5020],[7880,5021],[7880,5022],[7880,5023],[444,5024],[444,5025],[444,5026],[444,5027],[444,5028],[444,5029],[444,5030],[444,5031],[444,5032],[444,5033],[444,5034],[444,5035],[444,5036],[444,5037],[444,5038],[444,5039],[444,5040],[444,5041],[444,5042],[444,5043],[444,5044],[444,5045],[444,5046],[444,5047],[7992,5048],[6393,5049],[1599,5050]]],"random_fight_award_n":[[[30,2]]]}`|
|55|`{"fight_id":4000055,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[980,5051],[980,5052],[980,5053],[980,5054],[980,5055],[980,5056],[980,5057],[980,5058],[980,5059],[980,5060],[980,5061],[980,5062],[980,5063],[980,5064],[980,5065],[980,5066],[980,5067],[980,5068],[980,5069],[980,5070],[980,5071],[980,5072],[980,5073],[980,5074],[7900,5075],[7900,5076],[7900,5077],[7900,5078],[7900,5079],[7900,5080],[7900,5081],[7900,5082],[7900,5083],[7900,5084],[7900,5085],[7900,5086],[7900,5087],[7900,5088],[7900,5089],[7900,5090],[7900,5091],[7900,5092],[7900,5093],[7900,5094],[7900,5095],[7900,5096],[7900,5097],[7900,5098],[448,5099],[448,5100],[448,5101],[448,5102],[448,5103],[448,5104],[448,5105],[448,5106],[448,5107],[448,5108],[448,5109],[448,5110],[448,5111],[448,5112],[448,5113],[448,5114],[448,5115],[448,5116],[448,5117],[448,5118],[448,5119],[448,5120],[448,5121],[448,5122],[8064,5123],[6451,5124],[1613,5125]]],"random_fight_award_n":[[[30,2]]]}`|
|56|`{"fight_id":4000056,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[950,5126],[950,5127],[950,5128],[950,5129],[950,5130],[950,5131],[950,5132],[950,5133],[950,5134],[950,5135],[950,5136],[950,5137],[950,5138],[950,5139],[950,5140],[950,5141],[950,5142],[950,5143],[950,5144],[950,5145],[950,5146],[950,5147],[950,5148],[950,5149],[7920,5150],[7920,5151],[7920,5152],[7920,5153],[7920,5154],[7920,5155],[7920,5156],[7920,5157],[7920,5158],[7920,5159],[7920,5160],[7920,5161],[7920,5162],[7920,5163],[7920,5164],[7920,5165],[7920,5166],[7920,5167],[7920,5168],[7920,5169],[7920,5170],[7920,5171],[7920,5172],[7920,5173],[452,5174],[452,5175],[452,5176],[452,5177],[452,5178],[452,5179],[452,5180],[452,5181],[452,5182],[452,5183],[452,5184],[452,5185],[452,5186],[452,5187],[452,5188],[452,5189],[452,5190],[452,5191],[452,5192],[452,5193],[452,5194],[452,5195],[452,5196],[452,5197],[8136,5198],[6509,5199],[1627,5200]]],"random_fight_award_n":[[[30,2]]]}`|
|57|`{"fight_id":4000057,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[920,5201],[920,5202],[920,5203],[920,5204],[920,5205],[920,5206],[920,5207],[920,5208],[920,5209],[920,5210],[920,5211],[920,5212],[920,5213],[920,5214],[920,5215],[920,5216],[920,5217],[920,5218],[920,5219],[920,5220],[920,5221],[920,5222],[920,5223],[920,5224],[7940,5225],[7940,5226],[7940,5227],[7940,5228],[7940,5229],[7940,5230],[7940,5231],[7940,5232],[7940,5233],[7940,5234],[7940,5235],[7940,5236],[7940,5237],[7940,5238],[7940,5239],[7940,5240],[7940,5241],[7940,5242],[7940,5243],[7940,5244],[7940,5245],[7940,5246],[7940,5247],[7940,5248],[456,5249],[456,5250],[456,5251],[456,5252],[456,5253],[456,5254],[456,5255],[456,5256],[456,5257],[456,5258],[456,5259],[456,5260],[456,5261],[456,5262],[456,5263],[456,5264],[456,5265],[456,5266],[456,5267],[456,5268],[456,5269],[456,5270],[456,5271],[456,5272],[8208,5273],[6566,5274],[1642,5275]]],"random_fight_award_n":[[[30,2]]]}`|
|58|`{"fight_id":4000058,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[890,5276],[890,5277],[890,5278],[890,5279],[890,5280],[890,5281],[890,5282],[890,5283],[890,5284],[890,5285],[890,5286],[890,5287],[890,5288],[890,5289],[890,5290],[890,5291],[890,5292],[890,5293],[890,5294],[890,5295],[890,5296],[890,5297],[890,5298],[890,5299],[7960,5300],[7960,5301],[7960,5302],[7960,5303],[7960,5304],[7960,5305],[7960,5306],[7960,5307],[7960,5308],[7960,5309],[7960,5310],[7960,5311],[7960,5312],[7960,5313],[7960,5314],[7960,5315],[7960,5316],[7960,5317],[7960,5318],[7960,5319],[7960,5320],[7960,5321],[7960,5322],[7960,5323],[460,5324],[460,5325],[460,5326],[460,5327],[460,5328],[460,5329],[460,5330],[460,5331],[460,5332],[460,5333],[460,5334],[460,5335],[460,5336],[460,5337],[460,5338],[460,5339],[460,5340],[460,5341],[460,5342],[460,5343],[460,5344],[460,5345],[460,5346],[460,5347],[8280,5348],[6624,5349],[1656,5350]]],"random_fight_award_n":[[[30,2]]]}`|
|59|`{"fight_id":4000059,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[860,5351],[860,5352],[860,5353],[860,5354],[860,5355],[860,5356],[860,5357],[860,5358],[860,5359],[860,5360],[860,5361],[860,5362],[860,5363],[860,5364],[860,5365],[860,5366],[860,5367],[860,5368],[860,5369],[860,5370],[860,5371],[860,5372],[860,5373],[860,5374],[7980,5375],[7980,5376],[7980,5377],[7980,5378],[7980,5379],[7980,5380],[7980,5381],[7980,5382],[7980,5383],[7980,5384],[7980,5385],[7980,5386],[7980,5387],[7980,5388],[7980,5389],[7980,5390],[7980,5391],[7980,5392],[7980,5393],[7980,5394],[7980,5395],[7980,5396],[7980,5397],[7980,5398],[464,5399],[464,5400],[464,5401],[464,5402],[464,5403],[464,5404],[464,5405],[464,5406],[464,5407],[464,5408],[464,5409],[464,5410],[464,5411],[464,5412],[464,5413],[464,5414],[464,5415],[464,5416],[464,5417],[464,5418],[464,5419],[464,5420],[464,5421],[464,5422],[8352,5423],[6681,5424],[1671,5425]]],"random_fight_award_n":[[[30,2]]]}`|
|60|`{"fight_id":4000060,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[830,5426],[830,5427],[830,5428],[830,5429],[830,5430],[830,5431],[830,5432],[830,5433],[830,5434],[830,5435],[830,5436],[830,5437],[830,5438],[830,5439],[830,5440],[830,5441],[830,5442],[830,5443],[830,5444],[830,5445],[830,5446],[830,5447],[830,5448],[830,5449],[8000,5450],[8000,5451],[8000,5452],[8000,5453],[8000,5454],[8000,5455],[8000,5456],[8000,5457],[8000,5458],[8000,5459],[8000,5460],[8000,5461],[8000,5462],[8000,5463],[8000,5464],[8000,5465],[8000,5466],[8000,5467],[8000,5468],[8000,5469],[8000,5470],[8000,5471],[8000,5472],[8000,5473],[468,5474],[468,5475],[468,5476],[468,5477],[468,5478],[468,5479],[468,5480],[468,5481],[468,5482],[468,5483],[468,5484],[468,5485],[468,5486],[468,5487],[468,5488],[468,5489],[468,5490],[468,5491],[468,5492],[468,5493],[468,5494],[468,5495],[468,5496],[468,5497],[8424,5498],[6739,5499],[1685,5500]]],"random_fight_award_n":[[[30,2]]]}`|
|61|`{"fight_id":4000061,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[1400,4001],[1400,4002],[1400,4003],[1400,4004],[1400,4005],[1400,4006],[1400,4007],[1400,4008],[1400,4009],[1400,4010],[1400,4011],[1400,4012],[1400,4013],[1400,4014],[1400,4015],[1400,4016],[1400,4017],[1400,4018],[1400,4019],[1400,4020],[1400,4021],[1400,4022],[1400,4023],[1400,4024],[7620,4025],[7620,4026],[7620,4027],[7620,4028],[7620,4029],[7620,4030],[7620,4031],[7620,4032],[7620,4033],[7620,4034],[7620,4035],[7620,4036],[7620,4037],[7620,4038],[7620,4039],[7620,4040],[7620,4041],[7620,4042],[7620,4043],[7620,4044],[7620,4045],[7620,4046],[7620,4047],[7620,4048],[392,4049],[392,4050],[392,4051],[392,4052],[392,4053],[392,4054],[392,4055],[392,4056],[392,4057],[392,4058],[392,4059],[392,4060],[392,4061],[392,4062],[392,4063],[392,4064],[392,4065],[392,4066],[392,4067],[392,4068],[392,4069],[392,4070],[392,4071],[392,4072],[7056,4073],[5645,4074],[1411,4075]]],"random_fight_award_n":[[[30,2]]]}`|
|62|`{"fight_id":4000062,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[1370,4076],[1370,4077],[1370,4078],[1370,4079],[1370,4080],[1370,4081],[1370,4082],[1370,4083],[1370,4084],[1370,4085],[1370,4086],[1370,4087],[1370,4088],[1370,4089],[1370,4090],[1370,4091],[1370,4092],[1370,4093],[1370,4094],[1370,4095],[1370,4096],[1370,4097],[1370,4098],[1370,4099],[7640,4100],[7640,4101],[7640,4102],[7640,4103],[7640,4104],[7640,4105],[7640,4106],[7640,4107],[7640,4108],[7640,4109],[7640,4110],[7640,4111],[7640,4112],[7640,4113],[7640,4114],[7640,4115],[7640,4116],[7640,4117],[7640,4118],[7640,4119],[7640,4120],[7640,4121],[7640,4122],[7640,4123],[396,4124],[396,4125],[396,4126],[396,4127],[396,4128],[396,4129],[396,4130],[396,4131],[396,4132],[396,4133],[396,4134],[396,4135],[396,4136],[396,4137],[396,4138],[396,4139],[396,4140],[396,4141],[396,4142],[396,4143],[396,4144],[396,4145],[396,4146],[396,4147],[7128,4148],[5702,4149],[1426,4150]]],"random_fight_award_n":[[[30,2]]]}`|
|63|`{"fight_id":4000063,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[1340,4151],[1340,4152],[1340,4153],[1340,4154],[1340,4155],[1340,4156],[1340,4157],[1340,4158],[1340,4159],[1340,4160],[1340,4161],[1340,4162],[1340,4163],[1340,4164],[1340,4165],[1340,4166],[1340,4167],[1340,4168],[1340,4169],[1340,4170],[1340,4171],[1340,4172],[1340,4173],[1340,4174],[7660,4175],[7660,4176],[7660,4177],[7660,4178],[7660,4179],[7660,4180],[7660,4181],[7660,4182],[7660,4183],[7660,4184],[7660,4185],[7660,4186],[7660,4187],[7660,4188],[7660,4189],[7660,4190],[7660,4191],[7660,4192],[7660,4193],[7660,4194],[7660,4195],[7660,4196],[7660,4197],[7660,4198],[400,4199],[400,4200],[400,4201],[400,4202],[400,4203],[400,4204],[400,4205],[400,4206],[400,4207],[400,4208],[400,4209],[400,4210],[400,4211],[400,4212],[400,4213],[400,4214],[400,4215],[400,4216],[400,4217],[400,4218],[400,4219],[400,4220],[400,4221],[400,4222],[7200,4223],[5760,4224],[1440,4225]]],"random_fight_award_n":[[[30,2]]]}`|
|64|`{"fight_id":4000064,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[1310,4226],[1310,4227],[1310,4228],[1310,4229],[1310,4230],[1310,4231],[1310,4232],[1310,4233],[1310,4234],[1310,4235],[1310,4236],[1310,4237],[1310,4238],[1310,4239],[1310,4240],[1310,4241],[1310,4242],[1310,4243],[1310,4244],[1310,4245],[1310,4246],[1310,4247],[1310,4248],[1310,4249],[7680,4250],[7680,4251],[7680,4252],[7680,4253],[7680,4254],[7680,4255],[7680,4256],[7680,4257],[7680,4258],[7680,4259],[7680,4260],[7680,4261],[7680,4262],[7680,4263],[7680,4264],[7680,4265],[7680,4266],[7680,4267],[7680,4268],[7680,4269],[7680,4270],[7680,4271],[7680,4272],[7680,4273],[404,4274],[404,4275],[404,4276],[404,4277],[404,4278],[404,4279],[404,4280],[404,4281],[404,4282],[404,4283],[404,4284],[404,4285],[404,4286],[404,4287],[404,4288],[404,4289],[404,4290],[404,4291],[404,4292],[404,4293],[404,4294],[404,4295],[404,4296],[404,4297],[7272,4298],[5817,4299],[1455,4300]]],"random_fight_award_n":[[[30,2]]]}`|
|65|`{"fight_id":4000065,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[1280,4301],[1280,4302],[1280,4303],[1280,4304],[1280,4305],[1280,4306],[1280,4307],[1280,4308],[1280,4309],[1280,4310],[1280,4311],[1280,4312],[1280,4313],[1280,4314],[1280,4315],[1280,4316],[1280,4317],[1280,4318],[1280,4319],[1280,4320],[1280,4321],[1280,4322],[1280,4323],[1280,4324],[7700,4325],[7700,4326],[7700,4327],[7700,4328],[7700,4329],[7700,4330],[7700,4331],[7700,4332],[7700,4333],[7700,4334],[7700,4335],[7700,4336],[7700,4337],[7700,4338],[7700,4339],[7700,4340],[7700,4341],[7700,4342],[7700,4343],[7700,4344],[7700,4345],[7700,4346],[7700,4347],[7700,4348],[408,4349],[408,4350],[408,4351],[408,4352],[408,4353],[408,4354],[408,4355],[408,4356],[408,4357],[408,4358],[408,4359],[408,4360],[408,4361],[408,4362],[408,4363],[408,4364],[408,4365],[408,4366],[408,4367],[408,4368],[408,4369],[408,4370],[408,4371],[408,4372],[7344,4373],[5875,4374],[1469,4375]]],"random_fight_award_n":[[[30,2]]]}`|
|66|`{"fight_id":4000066,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[1250,4376],[1250,4377],[1250,4378],[1250,4379],[1250,4380],[1250,4381],[1250,4382],[1250,4383],[1250,4384],[1250,4385],[1250,4386],[1250,4387],[1250,4388],[1250,4389],[1250,4390],[1250,4391],[1250,4392],[1250,4393],[1250,4394],[1250,4395],[1250,4396],[1250,4397],[1250,4398],[1250,4399],[7720,4400],[7720,4401],[7720,4402],[7720,4403],[7720,4404],[7720,4405],[7720,4406],[7720,4407],[7720,4408],[7720,4409],[7720,4410],[7720,4411],[7720,4412],[7720,4413],[7720,4414],[7720,4415],[7720,4416],[7720,4417],[7720,4418],[7720,4419],[7720,4420],[7720,4421],[7720,4422],[7720,4423],[412,4424],[412,4425],[412,4426],[412,4427],[412,4428],[412,4429],[412,4430],[412,4431],[412,4432],[412,4433],[412,4434],[412,4435],[412,4436],[412,4437],[412,4438],[412,4439],[412,4440],[412,4441],[412,4442],[412,4443],[412,4444],[412,4445],[412,4446],[412,4447],[7416,4448],[5932,4449],[1484,4450]]],"random_fight_award_n":[[[30,2]]]}`|
|67|`{"fight_id":4000067,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[1220,4451],[1220,4452],[1220,4453],[1220,4454],[1220,4455],[1220,4456],[1220,4457],[1220,4458],[1220,4459],[1220,4460],[1220,4461],[1220,4462],[1220,4463],[1220,4464],[1220,4465],[1220,4466],[1220,4467],[1220,4468],[1220,4469],[1220,4470],[1220,4471],[1220,4472],[1220,4473],[1220,4474],[7740,4475],[7740,4476],[7740,4477],[7740,4478],[7740,4479],[7740,4480],[7740,4481],[7740,4482],[7740,4483],[7740,4484],[7740,4485],[7740,4486],[7740,4487],[7740,4488],[7740,4489],[7740,4490],[7740,4491],[7740,4492],[7740,4493],[7740,4494],[7740,4495],[7740,4496],[7740,4497],[7740,4498],[416,4499],[416,4500],[416,4501],[416,4502],[416,4503],[416,4504],[416,4505],[416,4506],[416,4507],[416,4508],[416,4509],[416,4510],[416,4511],[416,4512],[416,4513],[416,4514],[416,4515],[416,4516],[416,4517],[416,4518],[416,4519],[416,4520],[416,4521],[416,4522],[7488,4523],[5990,4524],[1498,4525]]],"random_fight_award_n":[[[30,2]]]}`|
|68|`{"fight_id":4000068,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[1190,4526],[1190,4527],[1190,4528],[1190,4529],[1190,4530],[1190,4531],[1190,4532],[1190,4533],[1190,4534],[1190,4535],[1190,4536],[1190,4537],[1190,4538],[1190,4539],[1190,4540],[1190,4541],[1190,4542],[1190,4543],[1190,4544],[1190,4545],[1190,4546],[1190,4547],[1190,4548],[1190,4549],[7760,4550],[7760,4551],[7760,4552],[7760,4553],[7760,4554],[7760,4555],[7760,4556],[7760,4557],[7760,4558],[7760,4559],[7760,4560],[7760,4561],[7760,4562],[7760,4563],[7760,4564],[7760,4565],[7760,4566],[7760,4567],[7760,4568],[7760,4569],[7760,4570],[7760,4571],[7760,4572],[7760,4573],[420,4574],[420,4575],[420,4576],[420,4577],[420,4578],[420,4579],[420,4580],[420,4581],[420,4582],[420,4583],[420,4584],[420,4585],[420,4586],[420,4587],[420,4588],[420,4589],[420,4590],[420,4591],[420,4592],[420,4593],[420,4594],[420,4595],[420,4596],[420,4597],[7560,4598],[6048,4599],[1512,4600]]],"random_fight_award_n":[[[30,2]]]}`|
|69|`{"fight_id":4000069,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[1160,4601],[1160,4602],[1160,4603],[1160,4604],[1160,4605],[1160,4606],[1160,4607],[1160,4608],[1160,4609],[1160,4610],[1160,4611],[1160,4612],[1160,4613],[1160,4614],[1160,4615],[1160,4616],[1160,4617],[1160,4618],[1160,4619],[1160,4620],[1160,4621],[1160,4622],[1160,4623],[1160,4624],[7780,4625],[7780,4626],[7780,4627],[7780,4628],[7780,4629],[7780,4630],[7780,4631],[7780,4632],[7780,4633],[7780,4634],[7780,4635],[7780,4636],[7780,4637],[7780,4638],[7780,4639],[7780,4640],[7780,4641],[7780,4642],[7780,4643],[7780,4644],[7780,4645],[7780,4646],[7780,4647],[7780,4648],[424,4649],[424,4650],[424,4651],[424,4652],[424,4653],[424,4654],[424,4655],[424,4656],[424,4657],[424,4658],[424,4659],[424,4660],[424,4661],[424,4662],[424,4663],[424,4664],[424,4665],[424,4666],[424,4667],[424,4668],[424,4669],[424,4670],[424,4671],[424,4672],[7632,4673],[6105,4674],[1527,4675]]],"random_fight_award_n":[[[30,2]]]}`|
|70|`{"fight_id":4000070,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[1130,4676],[1130,4677],[1130,4678],[1130,4679],[1130,4680],[1130,4681],[1130,4682],[1130,4683],[1130,4684],[1130,4685],[1130,4686],[1130,4687],[1130,4688],[1130,4689],[1130,4690],[1130,4691],[1130,4692],[1130,4693],[1130,4694],[1130,4695],[1130,4696],[1130,4697],[1130,4698],[1130,4699],[7800,4700],[7800,4701],[7800,4702],[7800,4703],[7800,4704],[7800,4705],[7800,4706],[7800,4707],[7800,4708],[7800,4709],[7800,4710],[7800,4711],[7800,4712],[7800,4713],[7800,4714],[7800,4715],[7800,4716],[7800,4717],[7800,4718],[7800,4719],[7800,4720],[7800,4721],[7800,4722],[7800,4723],[428,4724],[428,4725],[428,4726],[428,4727],[428,4728],[428,4729],[428,4730],[428,4731],[428,4732],[428,4733],[428,4734],[428,4735],[428,4736],[428,4737],[428,4738],[428,4739],[428,4740],[428,4741],[428,4742],[428,4743],[428,4744],[428,4745],[428,4746],[428,4747],[7704,4748],[6163,4749],[1541,4750]]],"random_fight_award_n":[[[30,2]]]}`|
|71|`{"fight_id":4000071,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[1100,4751],[1100,4752],[1100,4753],[1100,4754],[1100,4755],[1100,4756],[1100,4757],[1100,4758],[1100,4759],[1100,4760],[1100,4761],[1100,4762],[1100,4763],[1100,4764],[1100,4765],[1100,4766],[1100,4767],[1100,4768],[1100,4769],[1100,4770],[1100,4771],[1100,4772],[1100,4773],[1100,4774],[7820,4775],[7820,4776],[7820,4777],[7820,4778],[7820,4779],[7820,4780],[7820,4781],[7820,4782],[7820,4783],[7820,4784],[7820,4785],[7820,4786],[7820,4787],[7820,4788],[7820,4789],[7820,4790],[7820,4791],[7820,4792],[7820,4793],[7820,4794],[7820,4795],[7820,4796],[7820,4797],[7820,4798],[432,4799],[432,4800],[432,4801],[432,4802],[432,4803],[432,4804],[432,4805],[432,4806],[432,4807],[432,4808],[432,4809],[432,4810],[432,4811],[432,4812],[432,4813],[432,4814],[432,4815],[432,4816],[432,4817],[432,4818],[432,4819],[432,4820],[432,4821],[432,4822],[7776,4823],[6220,4824],[1556,4825]]],"random_fight_award_n":[[[30,2]]]}`|
|72|`{"fight_id":4000072,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[1070,4826],[1070,4827],[1070,4828],[1070,4829],[1070,4830],[1070,4831],[1070,4832],[1070,4833],[1070,4834],[1070,4835],[1070,4836],[1070,4837],[1070,4838],[1070,4839],[1070,4840],[1070,4841],[1070,4842],[1070,4843],[1070,4844],[1070,4845],[1070,4846],[1070,4847],[1070,4848],[1070,4849],[7840,4850],[7840,4851],[7840,4852],[7840,4853],[7840,4854],[7840,4855],[7840,4856],[7840,4857],[7840,4858],[7840,4859],[7840,4860],[7840,4861],[7840,4862],[7840,4863],[7840,4864],[7840,4865],[7840,4866],[7840,4867],[7840,4868],[7840,4869],[7840,4870],[7840,4871],[7840,4872],[7840,4873],[436,4874],[436,4875],[436,4876],[436,4877],[436,4878],[436,4879],[436,4880],[436,4881],[436,4882],[436,4883],[436,4884],[436,4885],[436,4886],[436,4887],[436,4888],[436,4889],[436,4890],[436,4891],[436,4892],[436,4893],[436,4894],[436,4895],[436,4896],[436,4897],[7848,4898],[6278,4899],[1570,4900]]],"random_fight_award_n":[[[30,2]]]}`|
|73|`{"fight_id":4000073,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[1040,4901],[1040,4902],[1040,4903],[1040,4904],[1040,4905],[1040,4906],[1040,4907],[1040,4908],[1040,4909],[1040,4910],[1040,4911],[1040,4912],[1040,4913],[1040,4914],[1040,4915],[1040,4916],[1040,4917],[1040,4918],[1040,4919],[1040,4920],[1040,4921],[1040,4922],[1040,4923],[1040,4924],[7860,4925],[7860,4926],[7860,4927],[7860,4928],[7860,4929],[7860,4930],[7860,4931],[7860,4932],[7860,4933],[7860,4934],[7860,4935],[7860,4936],[7860,4937],[7860,4938],[7860,4939],[7860,4940],[7860,4941],[7860,4942],[7860,4943],[7860,4944],[7860,4945],[7860,4946],[7860,4947],[7860,4948],[440,4949],[440,4950],[440,4951],[440,4952],[440,4953],[440,4954],[440,4955],[440,4956],[440,4957],[440,4958],[440,4959],[440,4960],[440,4961],[440,4962],[440,4963],[440,4964],[440,4965],[440,4966],[440,4967],[440,4968],[440,4969],[440,4970],[440,4971],[440,4972],[7920,4973],[6336,4974],[1584,4975]]],"random_fight_award_n":[[[30,2]]]}`|
|74|`{"fight_id":4000074,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[1010,4976],[1010,4977],[1010,4978],[1010,4979],[1010,4980],[1010,4981],[1010,4982],[1010,4983],[1010,4984],[1010,4985],[1010,4986],[1010,4987],[1010,4988],[1010,4989],[1010,4990],[1010,4991],[1010,4992],[1010,4993],[1010,4994],[1010,4995],[1010,4996],[1010,4997],[1010,4998],[1010,4999],[7880,5000],[7880,5001],[7880,5002],[7880,5003],[7880,5004],[7880,5005],[7880,5006],[7880,5007],[7880,5008],[7880,5009],[7880,5010],[7880,5011],[7880,5012],[7880,5013],[7880,5014],[7880,5015],[7880,5016],[7880,5017],[7880,5018],[7880,5019],[7880,5020],[7880,5021],[7880,5022],[7880,5023],[444,5024],[444,5025],[444,5026],[444,5027],[444,5028],[444,5029],[444,5030],[444,5031],[444,5032],[444,5033],[444,5034],[444,5035],[444,5036],[444,5037],[444,5038],[444,5039],[444,5040],[444,5041],[444,5042],[444,5043],[444,5044],[444,5045],[444,5046],[444,5047],[7992,5048],[6393,5049],[1599,5050]]],"random_fight_award_n":[[[30,2]]]}`|
|75|`{"fight_id":4000075,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[980,5051],[980,5052],[980,5053],[980,5054],[980,5055],[980,5056],[980,5057],[980,5058],[980,5059],[980,5060],[980,5061],[980,5062],[980,5063],[980,5064],[980,5065],[980,5066],[980,5067],[980,5068],[980,5069],[980,5070],[980,5071],[980,5072],[980,5073],[980,5074],[7900,5075],[7900,5076],[7900,5077],[7900,5078],[7900,5079],[7900,5080],[7900,5081],[7900,5082],[7900,5083],[7900,5084],[7900,5085],[7900,5086],[7900,5087],[7900,5088],[7900,5089],[7900,5090],[7900,5091],[7900,5092],[7900,5093],[7900,5094],[7900,5095],[7900,5096],[7900,5097],[7900,5098],[448,5099],[448,5100],[448,5101],[448,5102],[448,5103],[448,5104],[448,5105],[448,5106],[448,5107],[448,5108],[448,5109],[448,5110],[448,5111],[448,5112],[448,5113],[448,5114],[448,5115],[448,5116],[448,5117],[448,5118],[448,5119],[448,5120],[448,5121],[448,5122],[8064,5123],[6451,5124],[1613,5125]]],"random_fight_award_n":[[[30,2]]]}`|
|76|`{"fight_id":4000076,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[950,5126],[950,5127],[950,5128],[950,5129],[950,5130],[950,5131],[950,5132],[950,5133],[950,5134],[950,5135],[950,5136],[950,5137],[950,5138],[950,5139],[950,5140],[950,5141],[950,5142],[950,5143],[950,5144],[950,5145],[950,5146],[950,5147],[950,5148],[950,5149],[7920,5150],[7920,5151],[7920,5152],[7920,5153],[7920,5154],[7920,5155],[7920,5156],[7920,5157],[7920,5158],[7920,5159],[7920,5160],[7920,5161],[7920,5162],[7920,5163],[7920,5164],[7920,5165],[7920,5166],[7920,5167],[7920,5168],[7920,5169],[7920,5170],[7920,5171],[7920,5172],[7920,5173],[452,5174],[452,5175],[452,5176],[452,5177],[452,5178],[452,5179],[452,5180],[452,5181],[452,5182],[452,5183],[452,5184],[452,5185],[452,5186],[452,5187],[452,5188],[452,5189],[452,5190],[452,5191],[452,5192],[452,5193],[452,5194],[452,5195],[452,5196],[452,5197],[8136,5198],[6509,5199],[1627,5200]]],"random_fight_award_n":[[[30,2]]]}`|
|77|`{"fight_id":4000077,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[920,5201],[920,5202],[920,5203],[920,5204],[920,5205],[920,5206],[920,5207],[920,5208],[920,5209],[920,5210],[920,5211],[920,5212],[920,5213],[920,5214],[920,5215],[920,5216],[920,5217],[920,5218],[920,5219],[920,5220],[920,5221],[920,5222],[920,5223],[920,5224],[7940,5225],[7940,5226],[7940,5227],[7940,5228],[7940,5229],[7940,5230],[7940,5231],[7940,5232],[7940,5233],[7940,5234],[7940,5235],[7940,5236],[7940,5237],[7940,5238],[7940,5239],[7940,5240],[7940,5241],[7940,5242],[7940,5243],[7940,5244],[7940,5245],[7940,5246],[7940,5247],[7940,5248],[456,5249],[456,5250],[456,5251],[456,5252],[456,5253],[456,5254],[456,5255],[456,5256],[456,5257],[456,5258],[456,5259],[456,5260],[456,5261],[456,5262],[456,5263],[456,5264],[456,5265],[456,5266],[456,5267],[456,5268],[456,5269],[456,5270],[456,5271],[456,5272],[8208,5273],[6566,5274],[1642,5275]]],"random_fight_award_n":[[[30,2]]]}`|
|78|`{"fight_id":4000078,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[890,5276],[890,5277],[890,5278],[890,5279],[890,5280],[890,5281],[890,5282],[890,5283],[890,5284],[890,5285],[890,5286],[890,5287],[890,5288],[890,5289],[890,5290],[890,5291],[890,5292],[890,5293],[890,5294],[890,5295],[890,5296],[890,5297],[890,5298],[890,5299],[7960,5300],[7960,5301],[7960,5302],[7960,5303],[7960,5304],[7960,5305],[7960,5306],[7960,5307],[7960,5308],[7960,5309],[7960,5310],[7960,5311],[7960,5312],[7960,5313],[7960,5314],[7960,5315],[7960,5316],[7960,5317],[7960,5318],[7960,5319],[7960,5320],[7960,5321],[7960,5322],[7960,5323],[460,5324],[460,5325],[460,5326],[460,5327],[460,5328],[460,5329],[460,5330],[460,5331],[460,5332],[460,5333],[460,5334],[460,5335],[460,5336],[460,5337],[460,5338],[460,5339],[460,5340],[460,5341],[460,5342],[460,5343],[460,5344],[460,5345],[460,5346],[460,5347],[8280,5348],[6624,5349],[1656,5350]]],"random_fight_award_n":[[[30,2]]]}`|
|79|`{"fight_id":4000079,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[860,5351],[860,5352],[860,5353],[860,5354],[860,5355],[860,5356],[860,5357],[860,5358],[860,5359],[860,5360],[860,5361],[860,5362],[860,5363],[860,5364],[860,5365],[860,5366],[860,5367],[860,5368],[860,5369],[860,5370],[860,5371],[860,5372],[860,5373],[860,5374],[7980,5375],[7980,5376],[7980,5377],[7980,5378],[7980,5379],[7980,5380],[7980,5381],[7980,5382],[7980,5383],[7980,5384],[7980,5385],[7980,5386],[7980,5387],[7980,5388],[7980,5389],[7980,5390],[7980,5391],[7980,5392],[7980,5393],[7980,5394],[7980,5395],[7980,5396],[7980,5397],[7980,5398],[464,5399],[464,5400],[464,5401],[464,5402],[464,5403],[464,5404],[464,5405],[464,5406],[464,5407],[464,5408],[464,5409],[464,5410],[464,5411],[464,5412],[464,5413],[464,5414],[464,5415],[464,5416],[464,5417],[464,5418],[464,5419],[464,5420],[464,5421],[464,5422],[8352,5423],[6681,5424],[1671,5425]]],"random_fight_award_n":[[[30,2]]]}`|
|80|`{"fight_id":4000080,"first_award":[[179002,50]],"show_fight_award":[[1251200,1],[1261200,1],[1371200,1]],"fixed_fight_award":{"global":"TableEmpty"},"random_fight_award":[[[830,5426],[830,5427],[830,5428],[830,5429],[830,5430],[830,5431],[830,5432],[830,5433],[830,5434],[830,5435],[830,5436],[830,5437],[830,5438],[830,5439],[830,5440],[830,5441],[830,5442],[830,5443],[830,5444],[830,5445],[830,5446],[830,5447],[830,5448],[830,5449],[8000,5450],[8000,5451],[8000,5452],[8000,5453],[8000,5454],[8000,5455],[8000,5456],[8000,5457],[8000,5458],[8000,5459],[8000,5460],[8000,5461],[8000,5462],[8000,5463],[8000,5464],[8000,5465],[8000,5466],[8000,5467],[8000,5468],[8000,5469],[8000,5470],[8000,5471],[8000,5472],[8000,5473],[468,5474],[468,5475],[468,5476],[468,5477],[468,5478],[468,5479],[468,5480],[468,5481],[468,5482],[468,5483],[468,5484],[468,5485],[468,5486],[468,5487],[468,5488],[468,5489],[468,5490],[468,5491],[468,5492],[468,5493],[468,5494],[468,5495],[468,5496],[468,5497],[8424,5498],[6739,5499],[1685,5500]]],"random_fight_award_n":[[[30,2]]]}`|

## AwardLib

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5666|本表行键；与其他表同值不自动代表同一对象。|
|award|number|5666|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|award_n|number|5666|奖励数量数组；零与缺字段分别保留。|
|weight|number|5666|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|

下列3行用于说明结构；全部5666行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award":2001109,"award_n":1,"weight":9000}`|
|2|`{"award":2001209,"award_n":1,"weight":9000}`|
|3|`{"award":2001309,"award_n":1,"weight":9000}`|
