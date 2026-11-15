# ActFrameTable 规则参数

来源：[personal-server/assets/tables/ActFrameTable.data.lua.json.gz](../../../../personal-server/assets/tables/ActFrameTable.data.lua.json.gz)，SHA256：`728aef9e134741e4aecdee779dcf7f8a57a5723df437a6b934338410eee6c7df`。

[完整逐行JSON](ActFrameTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[TimedCycleActivity](#timedcycleactivity)|1|decoded-rows|
|[ActMutexGroup](#actmutexgroup)|0|decoded-rows|
|[ActMutexType](#actmutextype)|0|decoded-rows|
|[ActMutex](#actmutex)|0|decoded-rows|
|[ActBigType](#actbigtype)|24|decoded-rows|
|[ActType](#acttype)|108|rows-with-external-references|
|[ActCrossType](#actcrosstype)|6|decoded-rows|
|[ActStage](#actstage)|11|decoded-rows|
|[Act](#act)|884|decoded-rows|
|[ActOldExpand](#actoldexpand)|20|decoded-rows|

## TimedCycleActivity

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|replace_activity|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|server_type|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|open_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loop_type|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|server_day_limit|number|1|现有消费者按服龄上限处理；原值和脚本依据分别核对。|
|open_day|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|duration|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"server_type":0,"open_time":75600,"loop_type":1,"server_day_limit":5,"open_day":[7],"duration":1800}`|

## ActMutexGroup

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## ActMutexType

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## ActMutex

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## ActBigType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|24|本表行键；与其他表同值不自动代表同一对象。|

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
|11|`{}`|
|12|`{}`|
|13|`{}`|
|14|`{}`|
|15|`{}`|
|16|`{}`|
|17|`{}`|
|18|`{}`|
|19|`{}`|
|20|`{}`|
|21|`{}`|
|22|`{}`|
|23|`{}`|
|24|`{}`|

## ActType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|is_sort_handler|boolean|108|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lua_entity|object|108|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|108|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cross_type|number|108|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|108|本表行键；与其他表同值不自动代表同一对象。|
|big_type|number|108|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|data_type|number|108|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lua_module|object|108|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ref_name|string|108|原配置内部备注名；不等同当前界面本地化名称。|
|func_open|number|108|完整功能开放ID；条件见功能开放附录，不能直接当等级。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|62|`{"is_sort_handler":false,"cross_type":0,"big_type":0,"data_type":1,"ref_name":"通行证活动","func_open":1140}`|
|93|`{"is_sort_handler":false,"cross_type":0,"big_type":0,"data_type":1,"ref_name":"链路礼包","func_open":1277}`|
|95|`{"is_sort_handler":false,"cross_type":0,"big_type":0,"data_type":2,"ref_name":"链路礼包_跨服","func_open":1277}`|
|103|`{"is_sort_handler":false,"cross_type":0,"big_type":0,"data_type":1,"ref_name":"活动_外观投放","func_open":1328}`|
|106|`{"is_sort_handler":false,"cross_type":0,"big_type":0,"data_type":1,"ref_name":"累充活动","func_open":1343}`|
|119|`{"is_sort_handler":false,"cross_type":7,"big_type":0,"data_type":2,"ref_name":"链路礼包_四极","func_open":1277}`|
|126|`{"is_sort_handler":false,"cross_type":0,"big_type":0,"data_type":2,"ref_name":"累充活动_双子","func_open":1343}`|
|127|`{"is_sort_handler":false,"cross_type":7,"big_type":0,"data_type":2,"ref_name":"累充活动_四极","func_open":1343}`|
|170|`{"is_sort_handler":false,"cross_type":0,"big_type":0,"data_type":1,"ref_name":"打地鼠活动","func_open":1449}`|
|174|`{"is_sort_handler":false,"cross_type":0,"big_type":0,"data_type":1,"ref_name":"夏日活动","func_open":1513}`|
|175|`{"is_sort_handler":false,"cross_type":0,"big_type":0,"data_type":1,"ref_name":"直购皮肤活动","func_open":1514}`|
|176|`{"is_sort_handler":false,"cross_type":0,"big_type":0,"data_type":0,"ref_name":"爬塔活动","func_open":1521}`|
|177|`{"is_sort_handler":false,"cross_type":0,"big_type":0,"data_type":1,"ref_name":"英雄下放活动","func_open":1524}`|
|178|`{"is_sort_handler":false,"cross_type":0,"big_type":0,"data_type":1,"ref_name":"周年庆小游戏活动","func_open":1524}`|
|179|`{"is_sort_handler":false,"cross_type":0,"big_type":0,"data_type":1,"ref_name":"开服福利活动","func_open":1525}`|
|180|`{"is_sort_handler":false,"cross_type":0,"big_type":0,"data_type":1,"ref_name":"五日boss活动","func_open":1532}`|
|181|`{"is_sort_handler":false,"cross_type":0,"big_type":0,"data_type":1,"ref_name":"国庆主题活动","func_open":1536}`|
|182|`{"is_sort_handler":false,"cross_type":0,"big_type":6,"data_type":1,"ref_name":"活动商店","func_open":1539}`|
|183|`{"is_sort_handler":false,"cross_type":0,"big_type":0,"data_type":1,"ref_name":"祈福活动","func_open":1540}`|
|184|`{"is_sort_handler":false,"cross_type":0,"big_type":3,"data_type":1,"ref_name":"付费商城","func_open":1541}`|
|185|`{"is_sort_handler":false,"cross_type":0,"big_type":0,"data_type":1,"ref_name":"祈福主题活动","func_open":1546}`|
|186|`{"is_sort_handler":false,"cross_type":11,"big_type":3,"data_type":2,"ref_name":"付费商城_战区","func_open":1541}`|
|187|`{"is_sort_handler":false,"cross_type":11,"big_type":6,"data_type":2,"ref_name":"活动商店_战区","func_open":1539}`|
|188|`{"is_sort_handler":false,"cross_type":11,"big_type":0,"data_type":2,"ref_name":"通行证活动_战区","func_open":1140}`|
|189|`{"is_sort_handler":false,"cross_type":12,"big_type":6,"data_type":2,"ref_name":"活动商店_战区2","func_open":1539}`|
|1000|`{"is_sort_handler":false,"cross_type":0,"big_type":0,"data_type":1,"ref_name":"主题活动","func_open":1548}`|
|1001|`{"is_sort_handler":false,"cross_type":0,"big_type":0,"data_type":1,"ref_name":"充值返利抽奖活动","func_open":1549}`|
|1002|`{"is_sort_handler":false,"cross_type":0,"big_type":0,"data_type":1,"ref_name":"选择故事章节活动","func_open":1550}`|
|1003|`{"is_sort_handler":false,"cross_type":0,"big_type":0,"data_type":1,"ref_name":"通用任务活动","func_open":1551}`|
|1004|`{"is_sort_handler":true,"cross_type":0,"big_type":0,"data_type":1,"ref_name":"月度战令活动","func_open":1552}`|
|1005|`{"is_sort_handler":false,"cross_type":0,"big_type":0,"data_type":1,"ref_name":"回收活动","func_open":1553}`|
|1006|`{"is_sort_handler":false,"cross_type":0,"big_type":0,"data_type":1,"ref_name":"主题活动_双旦夜店","func_open":1555}`|
|1007|`{"is_sort_handler":false,"cross_type":0,"big_type":1,"data_type":1,"ref_name":"消消乐活动","func_open":1565}`|
|1008|`{"is_sort_handler":false,"cross_type":0,"big_type":4,"data_type":1,"ref_name":"盲拍活动","func_open":1566}`|
|1009|`{"is_sort_handler":false,"cross_type":0,"big_type":7,"data_type":1,"ref_name":"主题活动2","func_open":1548}`|
|1012|`{"is_sort_handler":false,"cross_type":0,"big_type":5,"data_type":1,"ref_name":"爆竹迎春活动","func_open":1548}`|
|1013|`{"is_sort_handler":false,"cross_type":0,"big_type":0,"data_type":1,"ref_name":"礼盒活动","func_open":1548}`|
|1014|`{"is_sort_handler":false,"cross_type":0,"big_type":0,"data_type":1,"ref_name":"限时申购活动","func_open":1568}`|
|1015|`{"is_sort_handler":false,"cross_type":11,"big_type":0,"data_type":2,"ref_name":"限时申购活动_战区","func_open":1568}`|
|1016|`{"is_sort_handler":false,"cross_type":0,"big_type":2,"data_type":1,"ref_name":"新通行证活动","func_open":1548}`|
|1017|`{"is_sort_handler":false,"cross_type":11,"big_type":1,"data_type":2,"ref_name":"消消乐活动_战区","func_open":1565}`|
|1018|`{"is_sort_handler":false,"cross_type":11,"big_type":4,"data_type":2,"ref_name":"盲拍活动_战区","func_open":1566}`|
|1019|`{"is_sort_handler":false,"cross_type":11,"big_type":2,"data_type":2,"ref_name":"新通行证活动_战区","func_open":1548}`|
|1020|`{"is_sort_handler":false,"cross_type":11,"big_type":5,"data_type":2,"ref_name":"爆竹迎春活动_战区","func_open":1548}`|
|1021|`{"is_sort_handler":false,"cross_type":0,"big_type":0,"data_type":1,"ref_name":"对对碰活动","func_open":1572}`|
|1022|`{"is_sort_handler":false,"cross_type":0,"big_type":0,"data_type":1,"ref_name":"空活动","func_open":1548}`|
|1023|`{"is_sort_handler":false,"cross_type":11,"big_type":7,"data_type":2,"ref_name":"主题活动2_战区","func_open":1548}`|
|1033|`{"is_sort_handler":false,"cross_type":0,"big_type":12,"data_type":1,"ref_name":"大富翁活动","func_open":1548}`|
|1034|`{"is_sort_handler":false,"cross_type":0,"big_type":9,"data_type":1,"ref_name":"梦境试炼活动","func_open":1573}`|
|1035|`{"is_sort_handler":false,"cross_type":0,"big_type":0,"data_type":1,"ref_name":"转盘活动","func_open":1548}`|
|1036|`{"is_sort_handler":false,"cross_type":0,"big_type":8,"data_type":1,"ref_name":"龙息之地","func_open":1174}`|
|1037|`{"is_sort_handler":false,"cross_type":11,"big_type":8,"data_type":2,"ref_name":"龙息之地_战区","func_open":1174}`|
|1038|`{"is_sort_handler":false,"cross_type":11,"big_type":9,"data_type":2,"ref_name":"梦境试炼活动_战区","func_open":1573}`|
|1039|`{"is_sort_handler":false,"cross_type":11,"big_type":12,"data_type":2,"ref_name":"大富翁活动_战区","func_open":1548}`|
|1040|`{"is_sort_handler":false,"cross_type":11,"big_type":0,"data_type":2,"ref_name":"转盘活动_战区","func_open":1548}`|
|1041|`{"is_sort_handler":false,"cross_type":0,"big_type":9,"data_type":2,"ref_name":"梦境试炼活动_双子","func_open":1573}`|
|1042|`{"is_sort_handler":false,"cross_type":7,"big_type":9,"data_type":2,"ref_name":"梦境试炼活动_四极","func_open":1573}`|
|1043|`{"is_sort_handler":false,"cross_type":9,"big_type":9,"data_type":2,"ref_name":"梦境试炼活动_神域","func_open":1573}`|
|1044|`{"is_sort_handler":false,"cross_type":7,"big_type":8,"data_type":2,"ref_name":"龙息之地_四极","func_open":1174}`|
|1045|`{"is_sort_handler":false,"cross_type":0,"big_type":8,"data_type":2,"ref_name":"龙息之地_双子","func_open":1174}`|
|1046|`{"is_sort_handler":false,"cross_type":9,"big_type":8,"data_type":2,"ref_name":"龙息之地_神域","func_open":1174}`|
|1050|`{"is_sort_handler":false,"cross_type":0,"big_type":11,"data_type":1,"ref_name":"翻翻乐活动","func_open":1591}`|
|1051|`{"is_sort_handler":false,"cross_type":0,"big_type":10,"data_type":2,"ref_name":"星钻矿脉_双子","func_open":1590}`|
|1052|`{"is_sort_handler":false,"cross_type":7,"big_type":10,"data_type":2,"ref_name":"星钻矿脉_四极","func_open":1590}`|
|1053|`{"is_sort_handler":false,"cross_type":9,"big_type":10,"data_type":2,"ref_name":"星钻矿脉_神域","func_open":1590}`|
|1054|`{"is_sort_handler":false,"cross_type":11,"big_type":10,"data_type":2,"ref_name":"星钻矿脉_战区","func_open":1590}`|
|1055|`{"is_sort_handler":false,"cross_type":0,"big_type":2,"data_type":2,"ref_name":"新通行证活动_双子","func_open":1548}`|
|1056|`{"is_sort_handler":false,"cross_type":7,"big_type":2,"data_type":2,"ref_name":"新通行证活动_四极","func_open":1548}`|
|1057|`{"is_sort_handler":false,"cross_type":9,"big_type":2,"data_type":2,"ref_name":"新通行证活动_神域","func_open":1548}`|
|1058|`{"is_sort_handler":false,"cross_type":0,"big_type":10,"data_type":2,"ref_name":"空活动_双子","func_open":1548}`|
|1059|`{"is_sort_handler":false,"cross_type":11,"big_type":10,"data_type":2,"ref_name":"空活动_战区","func_open":1548}`|
|1060|`{"is_sort_handler":false,"cross_type":11,"big_type":0,"data_type":2,"ref_name":"礼盒活动_战区","func_open":1548}`|
|1061|`{"is_sort_handler":false,"cross_type":7,"big_type":0,"data_type":2,"ref_name":"空活动_四极","func_open":1548}`|
|1062|`{"is_sort_handler":false,"cross_type":0,"big_type":0,"data_type":1,"ref_name":"空活动_单服","func_open":1548}`|
|1063|`{"is_sort_handler":false,"cross_type":0,"big_type":10,"data_type":1,"ref_name":"星钻矿脉","func_open":1590}`|
|1064|`{"is_sort_handler":false,"cross_type":12,"big_type":0,"data_type":2,"ref_name":"通行证活动_战区2","func_open":1140}`|
|1065|`{"is_sort_handler":false,"cross_type":12,"big_type":7,"data_type":2,"ref_name":"主题活动2_战区2","func_open":1548}`|
|1066|`{"is_sort_handler":false,"cross_type":12,"big_type":12,"data_type":2,"ref_name":"大富翁活动_战区2","func_open":1548}`|
|1067|`{"is_sort_handler":false,"cross_type":12,"big_type":3,"data_type":2,"ref_name":"付费商城_战区2","func_open":1541}`|
|1068|`{"is_sort_handler":false,"cross_type":12,"big_type":0,"data_type":2,"ref_name":"转盘活动_战区2","func_open":1548}`|
|1069|`{"is_sort_handler":false,"cross_type":0,"big_type":0,"data_type":1,"ref_name":"钻石储蓄罐","func_open":1601}`|
|1071|`{"is_sort_handler":false,"cross_type":0,"big_type":18,"data_type":1,"ref_name":"纳福活动","func_open":1611}`|
|1072|`{"is_sort_handler":false,"cross_type":0,"big_type":16,"data_type":1,"ref_name":"免费特权活动","func_open":1612}`|
|1073|`{"is_sort_handler":false,"cross_type":0,"big_type":17,"data_type":1,"ref_name":"英雄签到活动","func_open":1613}`|
|1074|`{"is_sort_handler":true,"cross_type":0,"big_type":14,"data_type":1,"ref_name":"钓鱼活动_本服","func_open":1614}`|
|1075|`{"is_sort_handler":true,"cross_type":0,"big_type":14,"data_type":2,"ref_name":"钓鱼活动_双子","func_open":1614}`|
|1080|`{"is_sort_handler":false,"cross_type":0,"big_type":15,"data_type":1,"ref_name":"家园拼图活动_本服","func_open":1615}`|
|1085|`{"is_sort_handler":false,"cross_type":0,"big_type":13,"data_type":1,"ref_name":"家园活动_本服","func_open":1618}`|
|1086|`{"is_sort_handler":false,"cross_type":12,"big_type":13,"data_type":2,"ref_name":"家园活动_跨服","func_open":1618}`|
|1087|`{"is_sort_handler":false,"cross_type":0,"big_type":13,"data_type":2,"ref_name":"家园活动_双子","func_open":1618}`|
|1088|`{"is_sort_handler":false,"cross_type":12,"big_type":10,"data_type":2,"ref_name":"星钻矿脉_战区2","func_open":1590}`|
|1089|`{"is_sort_handler":false,"cross_type":12,"big_type":10,"data_type":2,"ref_name":"空活动_战区2","func_open":1548}`|
|1090|`{"is_sort_handler":false,"cross_type":12,"big_type":15,"data_type":2,"ref_name":"家园拼图活动_战区2","func_open":1615}`|
|1091|`{"is_sort_handler":false,"cross_type":12,"big_type":1,"data_type":2,"ref_name":"消消乐活动_战区2","func_open":1565}`|
|1092|`{"is_sort_handler":false,"cross_type":12,"big_type":4,"data_type":2,"ref_name":"盲拍活动_战区2","func_open":1566}`|
|1093|`{"is_sort_handler":false,"cross_type":12,"big_type":2,"data_type":2,"ref_name":"新通行证活动_战区2","func_open":1548}`|
|1094|`{"is_sort_handler":true,"cross_type":12,"big_type":14,"data_type":2,"ref_name":"钓鱼活动_战区2","func_open":1614}`|
|1095|`{"is_sort_handler":false,"cross_type":0,"big_type":0,"data_type":1,"ref_name":"老虎机活动","func_open":1548}`|
|1096|`{"is_sort_handler":false,"cross_type":0,"big_type":21,"data_type":3,"ref_name":"助力升超凡全服活动","func_open":1632}`|
|1101|`{"is_sort_handler":false,"cross_type":0,"big_type":19,"data_type":1,"ref_name":"烘焙活动","func_open":1631}`|
|1102|`{"is_sort_handler":false,"cross_type":0,"big_type":20,"data_type":1,"ref_name":"百抽活动","func_open":1633}`|
|1103|`{"is_sort_handler":true,"cross_type":12,"big_type":19,"data_type":2,"ref_name":"烘焙活动_战区2","func_open":1631}`|
|1301|`{"is_sort_handler":false,"cross_type":0,"big_type":0,"data_type":1,"ref_name":"周年庆宴会","func_open":1634}`|
|1302|`{"is_sort_handler":false,"cross_type":0,"big_type":23,"data_type":1,"ref_name":"三消爬塔活动","func_open":1635}`|
|1303|`{"is_sort_handler":false,"cross_type":0,"big_type":24,"data_type":1,"ref_name":"三消招募活动","func_open":1639}`|
|1304|`{"is_sort_handler":false,"cross_type":0,"big_type":22,"data_type":3,"ref_name":"三消pvp活动","func_open":1640}`|
|1305|`{"is_sort_handler":false,"cross_type":12,"big_type":5,"data_type":2,"ref_name":"爆竹迎春活动_战区2","func_open":1548}`|
|1306|`{"is_sort_handler":false,"cross_type":12,"big_type":0,"data_type":2,"ref_name":"老虎机活动_战区2","func_open":1548}`|

## ActCrossType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|0|`{}`|
|5|`{}`|
|7|`{}`|
|9|`{}`|
|11|`{}`|
|12|`{}`|

## ActStage

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|11|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|0|`{}`|
|10|`{}`|
|50|`{}`|
|51|`{}`|
|52|`{}`|
|53|`{}`|
|54|`{}`|
|55|`{}`|
|60|`{}`|
|90|`{}`|
|99|`{}`|

## Act

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|jump_func|number|884|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|884|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|time_type|number|884|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|world_time|number|884|原配置绝对Unix秒；当前本服是否平移另列，不能把平移后的日期写成原值。|
|duration_day|number|884|配置持续天数；0须保留，不能擅自改为1。|
|tid|number|884|本表行键；与其他表同值不自动代表同一对象。|
|end_time|number|884|结束日期内秒偏移；不是单独完整时间戳。|
|time_fun_args|array|884|动态时间函数原始参数。|
|asserts|undefined/number|884|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ref_name|string|884|原配置内部备注名；不等同当前界面本地化名称。|
|stage|array|884|ActFrame阶段引用数组；不同于旧Activity.state。|
|show_name|number|884|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|stage_end_time|array|884|ActFrame阶段结束时间字段原值。|
|server_day_limit|number|884|现有消费者按服龄上限处理；原值和脚本依据分别核对。|
|refer_day|number|884|ActFrame相对开服日字段，需连同refer_start_time及消费者读取。|
|refer_start_time|number|884|相对日期内的秒偏移原值；18000对应05:00。|
|stage_duration_day|array|884|ActFrame各段天数数组，与stage逐项配对。|
|time_fun|number|884|动态时间函数ID；没有恢复函数时，不能由静态字段断言完整窗口。|
|version|number|884|版本引用；必须按活动类型及其消费者查对应版本表。|

下列3行用于说明结构；全部884行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|62001|`{"jump_func":0,"type":62,"time_type":4,"world_time":0,"duration_day":5,"end_time":18000,"time_fun_args":[],"ref_name":"神域胚子下放活动1期_通行证","stage":[],"stage_end_time":[],"server_day_limit":0,"refer_day":10,"refer_start_time":18000,"stage_duration_day":[],"time_fun":0,"version":1}`|
|62002|`{"jump_func":0,"type":62,"time_type":2,"world_time":1744750800,"duration_day":5,"end_time":18000,"time_fun_args":[],"ref_name":"神域胚子下放活动1期_通行证_通服","stage":[],"stage_end_time":[],"server_day_limit":0,"refer_day":0,"refer_start_time":0,"stage_duration_day":[],"time_fun":0,"version":2}`|
|62011|`{"jump_func":0,"type":62,"time_type":4,"world_time":0,"duration_day":5,"end_time":18000,"time_fun_args":[],"ref_name":"神域胚子下放活动2期_通行证","stage":[],"stage_end_time":[],"server_day_limit":0,"refer_day":17,"refer_start_time":18000,"stage_duration_day":[],"time_fun":0,"version":3}`|

## ActOldExpand

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|20|本表行键；与其他表同值不自动代表同一对象。|
|jump_func|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|red_dot|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|12010|`{"jump_func":2400}`|
|12011|`{"jump_func":2401}`|
|12012|`{"jump_func":223}`|
|12013|`{"jump_func":2222}`|
|12014|`{"jump_func":3122}`|
|12015|`{"jump_func":3125}`|
|12016|`{"jump_func":223}`|
|12017|`{"jump_func":2222}`|
|13011|`{"jump_func":2402}`|
|13012|`{"jump_func":2440}`|
|13013|`{"jump_func":223}`|
|13014|`{"jump_func":2222}`|
|13015|`{"jump_func":3127}`|
|13016|`{"jump_func":3128}`|
|13017|`{"jump_func":223}`|
|13018|`{"jump_func":2222}`|
|135010|`{"jump_func":2824}`|
|180011|`{"jump_func":2386}`|
|180014|`{"jump_func":2671}`|
|180015|`{"jump_func":3126}`|
