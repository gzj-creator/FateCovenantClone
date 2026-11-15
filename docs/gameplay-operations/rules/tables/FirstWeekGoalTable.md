# FirstWeekGoalTable 规则参数

来源：[personal-server/assets/tables/FirstWeekGoalTable.data.lua.json.gz](../../../../personal-server/assets/tables/FirstWeekGoalTable.data.lua.json.gz)，SHA256：`3c59043217df260b01f2e9ac7b24dcbf75fd914a186ac8a292a49bd4a99f15a4`。

[完整逐行JSON](FirstWeekGoalTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Task](#task)|326|decoded-rows|
|[Const](#const)|5|decoded-rows|
|[FirstWeekGoal](#firstweekgoal)|35|decoded-rows|

## Task

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|326|本表行键；与其他表同值不自动代表同一对象。|
|type|number|326|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|target_count|number|326|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_param|number|326|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_list|array|326|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

下列3行用于说明结构；全部326行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1101|`{"type":1803,"target_count":1,"task_param":0,"award_list":[[1901900,5],[201500,22000]]}`|
|1102|`{"type":5801,"target_count":6,"task_param":20,"award_list":[[1901900,5],[201500,18000]]}`|
|1103|`{"type":1002,"target_count":10,"task_param":0,"award_list":[[1901900,5],[101800,18000]]}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|score|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|old_item|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|convert_item|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|convert_count|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_main_entry|boolean|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|main_entry_prefab|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"score":1901900,"old_item":0,"convert_item":0,"convert_count":0}`|
|2|`{"score":3001900,"old_item":0,"convert_item":0,"convert_count":0}`|
|3|`{"score":3001900,"old_item":0,"convert_item":0,"convert_count":0}`|
|4|`{"score":8201900,"old_item":8001900,"convert_item":201500,"convert_count":100}`|
|5|`{"score":1901900,"old_item":0,"convert_item":0,"convert_count":0}`|

## FirstWeekGoal

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|35|本表行键；与其他表同值不自动代表同一对象。|
|task_growth|array|35|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_challenge|array/object|35|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|gift|number|35|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|need_score|number|35|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|select_award|object/array|35|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|select_n|number|35|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|35|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|award_n|array|35|奖励数量数组；零与缺字段分别保留。|
|gift_title|number|35|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|target_theme|number|35|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|target_title|number|35|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|target_desc|number|35|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|main_img|string|35|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|day_title_img|string|35|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|day_title_img_big|string|35|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_star|number|35|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|custom_desc|number|35|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_quality|number|35|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"task_growth":[1101,1102,1103,1104,1105,1106,1107,1108,1109],"task_challenge":[1151,1152,1153,1154,1155],"need_score":40,"select_award":{"global":"TableEmpty"},"select_n":0,"award":[24300804],"award_n":[60],"target_theme":59026,"target_title":59033,"target_desc":59047,"day_title_img":"img_mxrj_f_xiao.png","day_title_img_big":"img_mxrj_f_da.png","show_star":1,"show_quality":50}`|
|102|`{"task_growth":[1201,1202,1203,1204,1205,1206,1207,1208],"task_challenge":[1251,1252,1253,1254,1255],"need_score":80,"select_award":{"global":"TableEmpty"},"select_n":0,"award":[24300804],"award_n":[60],"target_theme":59027,"target_title":59034,"target_desc":59048,"day_title_img":"img_mxrj_e_xiao.png","day_title_img_big":"img_mxrj_e_da.png","show_star":2,"show_quality":50}`|
|103|`{"task_growth":[1301,1302,1303,1304,1305,1306,1307,1308,1309],"task_challenge":[1351,1352,1353,1354,1355],"need_score":120,"select_award":{"global":"TableEmpty"},"select_n":0,"award":[24300804],"award_n":[120],"target_theme":59028,"target_title":59035,"target_desc":59049,"day_title_img":"img_mxrj_d_xiao.png","day_title_img_big":"img_mxrj_d_da.png","show_star":3,"show_quality":50}`|
|104|`{"task_growth":[1401,1402,1403,1404,1405,1406,1407,1408,1409],"task_challenge":[1451,1452,1453,1454,1455],"need_score":160,"select_award":{"global":"TableEmpty"},"select_n":0,"award":[24300804],"award_n":[90],"target_theme":59029,"target_title":59036,"target_desc":59050,"day_title_img":"img_mxrj_c_xiao.png","day_title_img_big":"img_mxrj_c_da.png","show_star":3,"show_quality":50}`|
|105|`{"task_growth":[1501,1502,1503,1504,1505,1506,1507,1508],"task_challenge":[1551,1552,1553,1554,1555],"need_score":200,"select_award":{"global":"TableEmpty"},"select_n":0,"award":[24300804],"award_n":[90],"target_theme":59030,"target_title":59037,"target_desc":59051,"day_title_img":"img_mxrj_b_xiao.png","day_title_img_big":"img_mxrj_b_da.png","show_star":4,"show_quality":50}`|
|106|`{"task_growth":[1601,1602,1603,1604,1605,1606,1607,1608],"task_challenge":[1651,1652,1653,1654,1655],"need_score":240,"select_award":{"global":"TableEmpty"},"select_n":0,"award":[24300804],"award_n":[120],"target_theme":59031,"target_title":59038,"target_desc":59052,"day_title_img":"img_mxrj_a_xiao.png","day_title_img_big":"img_mxrj_a_da.png","show_star":4,"show_quality":50}`|
|107|`{"task_growth":[1701,1702,1703,1704,1705,1706,1707,1708],"task_challenge":[1751,1752,1753,1754,1755],"need_score":280,"select_award":{"global":"TableEmpty"},"select_n":0,"award":[24300804],"award_n":[120],"target_theme":59032,"target_title":59039,"target_desc":59053,"day_title_img":"img_mxrj_s_da.png","day_title_img_big":"img_mxrj_s_da.png","show_star":5,"show_quality":50}`|
|201|`{"task_growth":[2101,2102,2103,2104,2105,2106,2107,2108],"task_challenge":[2151,2152,2153,2154,2155,2156],"need_score":40,"select_award":{"global":"TableEmpty"},"select_n":0,"award":[2002],"award_n":[10],"target_theme":59026,"target_title":59033,"target_desc":59047,"day_title_img":"img_mxrj_f_xiao.png","day_title_img_big":"img_mxrj_f_da.png","show_star":0,"show_quality":0}`|
|202|`{"task_growth":[2201,2202,2203,2204,2205,2206,2207,2208],"task_challenge":[2251,2252,2253,2254,2255,2256],"need_score":80,"select_award":{"global":"TableEmpty"},"select_n":0,"award":[2002],"award_n":[10],"target_theme":59027,"target_title":59034,"target_desc":59048,"day_title_img":"img_mxrj_e_xiao.png","day_title_img_big":"img_mxrj_e_da.png","show_star":0,"show_quality":0}`|
|203|`{"task_growth":[2301,2302,2303,2304,2305,2306,2307,2308],"task_challenge":[2351,2352,2353,2354,2355,2356],"need_score":120,"select_award":{"global":"TableEmpty"},"select_n":0,"award":[2002],"award_n":[10],"target_theme":59028,"target_title":59035,"target_desc":59049,"day_title_img":"img_mxrj_d_xiao.png","day_title_img_big":"img_mxrj_d_da.png","show_star":0,"show_quality":0}`|
|204|`{"task_growth":[2401,2402,2403,2404,2405,2406,2407,2408],"task_challenge":[2451,2452,2453,2454,2455,2456],"need_score":160,"select_award":{"global":"TableEmpty"},"select_n":0,"award":[2002],"award_n":[10],"target_theme":59029,"target_title":59036,"target_desc":59050,"day_title_img":"img_mxrj_c_xiao.png","day_title_img_big":"img_mxrj_c_da.png","show_star":0,"show_quality":0}`|
|205|`{"task_growth":[2501,2502,2503,2504,2505,2506,2507,2508],"task_challenge":[2551,2552,2553,2554,2555,2556],"need_score":200,"select_award":{"global":"TableEmpty"},"select_n":0,"award":[2002],"award_n":[10],"target_theme":59030,"target_title":59037,"target_desc":59051,"day_title_img":"img_mxrj_b_xiao.png","day_title_img_big":"img_mxrj_b_da.png","show_star":0,"show_quality":0}`|
|206|`{"task_growth":[2601,2602,2603,2604,2605,2606,2607,2608],"task_challenge":[2651,2652,2653,2654,2655,2656],"need_score":240,"select_award":{"global":"TableEmpty"},"select_n":0,"award":[2002],"award_n":[10],"target_theme":59031,"target_title":59038,"target_desc":59052,"day_title_img":"img_mxrj_a_xiao.png","day_title_img_big":"img_mxrj_a_da.png","show_star":0,"show_quality":0}`|
|207|`{"task_growth":[2701,2702,2703,2704,2705,2706,2707,2708],"task_challenge":[2751,2752,2753,2754,2755,2756],"need_score":280,"select_award":[1030101,2030201,4030501,3030601],"select_n":1,"award":[1221200],"award_n":[1],"target_theme":59032,"target_title":59039,"target_desc":59053,"day_title_img":"img_mxrj_s_da.png","day_title_img_big":"img_mxrj_s_da.png","show_star":0,"show_quality":0}`|
|301|`{"task_growth":[3101,3102,3103,3104,3105,3106,3107,3108],"task_challenge":[3151,3152,3153,3154,3155,3156],"need_score":40,"select_award":{"global":"TableEmpty"},"select_n":0,"award":[2002],"award_n":[10],"target_theme":59026,"target_title":59033,"target_desc":59047,"day_title_img":"img_mxrj_f_xiao.png","day_title_img_big":"img_mxrj_f_da.png","show_star":0,"show_quality":0}`|
|302|`{"task_growth":[3201,3202,3203,3204,3205,3206,3207,3208],"task_challenge":[3251,3252,3253,3254,3255,3256],"need_score":80,"select_award":{"global":"TableEmpty"},"select_n":0,"award":[2002],"award_n":[10],"target_theme":59027,"target_title":59034,"target_desc":59048,"day_title_img":"img_mxrj_e_xiao.png","day_title_img_big":"img_mxrj_e_da.png","show_star":0,"show_quality":0}`|
|303|`{"task_growth":[3301,3302,3303,3304,3305,3306,3307,3308],"task_challenge":[3351,3352,3353,3354,3355,3356],"need_score":120,"select_award":{"global":"TableEmpty"},"select_n":0,"award":[2002],"award_n":[10],"target_theme":59028,"target_title":59035,"target_desc":59049,"day_title_img":"img_mxrj_d_xiao.png","day_title_img_big":"img_mxrj_d_da.png","show_star":0,"show_quality":0}`|
|304|`{"task_growth":[3401,3402,3403,3404,3405,3406,3407,3408],"task_challenge":[3451,3452,3453,3454,3455,3456],"need_score":160,"select_award":{"global":"TableEmpty"},"select_n":0,"award":[2002],"award_n":[10],"target_theme":59029,"target_title":59036,"target_desc":59050,"day_title_img":"img_mxrj_c_xiao.png","day_title_img_big":"img_mxrj_c_da.png","show_star":0,"show_quality":0}`|
|305|`{"task_growth":[3501,3502,3503,3504,3505,3506,3507,3508],"task_challenge":[3551,3552,3553,3554,3555,3556],"need_score":200,"select_award":{"global":"TableEmpty"},"select_n":0,"award":[2002],"award_n":[10],"target_theme":59030,"target_title":59037,"target_desc":59051,"day_title_img":"img_mxrj_b_xiao.png","day_title_img_big":"img_mxrj_b_da.png","show_star":0,"show_quality":0}`|
|306|`{"task_growth":[3601,3602,3603,3604,3605,3606,3607,3608],"task_challenge":[3651,3652,3653,3654,3655,3656],"need_score":240,"select_award":{"global":"TableEmpty"},"select_n":0,"award":[2002],"award_n":[10],"target_theme":59031,"target_title":59038,"target_desc":59052,"day_title_img":"img_mxrj_a_xiao.png","day_title_img_big":"img_mxrj_a_da.png","show_star":0,"show_quality":0}`|
|307|`{"task_growth":[3701,3702,3703,3704,3705,3706,3707,3708],"task_challenge":[3751,3752,3753,3754,3755,3756],"need_score":280,"select_award":{"global":"TableEmpty"},"select_n":0,"award":[11200],"award_n":[1],"target_theme":59032,"target_title":59039,"target_desc":59053,"day_title_img":"img_mxrj_s_da.png","day_title_img_big":"img_mxrj_s_da.png","show_star":0,"show_quality":0}`|
|401|`{"task_growth":[4101,4102,4103,4104,4105],"task_challenge":{"global":"TableEmpty"},"need_score":20,"select_award":{"global":"TableEmpty"},"select_n":0,"award":[8001900],"award_n":[100],"target_theme":59026,"target_title":59033,"target_desc":59047,"day_title_img":"img_mxrj_f_xiao.png","day_title_img_big":"img_mxrj_f_da.png","show_star":1,"show_quality":50}`|
|402|`{"task_growth":[4106,4107,4108,4109,4110],"task_challenge":{"global":"TableEmpty"},"need_score":40,"select_award":{"global":"TableEmpty"},"select_n":0,"award":[8001900],"award_n":[100],"target_theme":59027,"target_title":59034,"target_desc":59048,"day_title_img":"img_mxrj_e_xiao.png","day_title_img_big":"img_mxrj_e_da.png","show_star":2,"show_quality":50}`|
|403|`{"task_growth":[4111,4112,4113,4114,4115],"task_challenge":{"global":"TableEmpty"},"need_score":60,"select_award":{"global":"TableEmpty"},"select_n":0,"award":[8001900],"award_n":[200],"target_theme":59028,"target_title":59035,"target_desc":59049,"day_title_img":"img_mxrj_d_xiao.png","day_title_img_big":"img_mxrj_d_da.png","show_star":3,"show_quality":50}`|
|404|`{"task_growth":[4116,4117,4118,4119,4120],"task_challenge":{"global":"TableEmpty"},"need_score":80,"select_award":{"global":"TableEmpty"},"select_n":0,"award":[8001900],"award_n":[200],"target_theme":59029,"target_title":59036,"target_desc":59050,"day_title_img":"img_mxrj_c_xiao.png","day_title_img_big":"img_mxrj_c_da.png","show_star":3,"show_quality":50}`|
|405|`{"task_growth":[4121,4122,4123,4124,4125],"task_challenge":{"global":"TableEmpty"},"need_score":100,"select_award":{"global":"TableEmpty"},"select_n":0,"award":[8001900],"award_n":[200],"target_theme":59030,"target_title":59037,"target_desc":59051,"day_title_img":"img_mxrj_b_xiao.png","day_title_img_big":"img_mxrj_b_da.png","show_star":4,"show_quality":50}`|
|406|`{"task_growth":[4126,4127,4128,4129,4130],"task_challenge":{"global":"TableEmpty"},"need_score":120,"select_award":{"global":"TableEmpty"},"select_n":0,"award":[8001900],"award_n":[200],"target_theme":59031,"target_title":59038,"target_desc":59052,"day_title_img":"img_mxrj_a_xiao.png","day_title_img_big":"img_mxrj_a_da.png","show_star":4,"show_quality":50}`|
|407|`{"task_growth":[4131,4132,4133,4134,4135],"task_challenge":{"global":"TableEmpty"},"need_score":150,"select_award":{"global":"TableEmpty"},"select_n":0,"award":[8001900],"award_n":[400],"target_theme":59032,"target_title":59039,"target_desc":59053,"day_title_img":"img_mxrj_s_da.png","day_title_img_big":"img_mxrj_s_da.png","show_star":5,"show_quality":50}`|
|501|`{"task_growth":[1101,1102,1103,1104,1105,1106,1107,1108,1109],"task_challenge":[1151,1152,1153,1154,1155],"need_score":40,"select_award":{"global":"TableEmpty"},"select_n":0,"award":[23300504],"award_n":[60],"target_theme":59026,"target_title":59033,"target_desc":59047,"day_title_img":"img_mxrj_f_xiao.png","day_title_img_big":"img_mxrj_f_da.png","show_star":1,"show_quality":50}`|
|502|`{"task_growth":[1201,1202,1203,1204,1205,1206,1207,1208],"task_challenge":[1251,1252,1253,1254,1255],"need_score":80,"select_award":{"global":"TableEmpty"},"select_n":0,"award":[23300504],"award_n":[60],"target_theme":59027,"target_title":59034,"target_desc":59048,"day_title_img":"img_mxrj_e_xiao.png","day_title_img_big":"img_mxrj_e_da.png","show_star":2,"show_quality":50}`|
|503|`{"task_growth":[1301,1302,1303,1304,1305,1306,1307,1308,1309],"task_challenge":[1351,1352,1353,1354,1355],"need_score":120,"select_award":{"global":"TableEmpty"},"select_n":0,"award":[23300504],"award_n":[120],"target_theme":59028,"target_title":59035,"target_desc":59049,"day_title_img":"img_mxrj_d_xiao.png","day_title_img_big":"img_mxrj_d_da.png","show_star":3,"show_quality":50}`|
|504|`{"task_growth":[1401,1402,1403,1404,1405,1406,1407,1408,1409],"task_challenge":[1451,1452,1453,1454,1455],"need_score":160,"select_award":{"global":"TableEmpty"},"select_n":0,"award":[23300504],"award_n":[90],"target_theme":59029,"target_title":59036,"target_desc":59050,"day_title_img":"img_mxrj_c_xiao.png","day_title_img_big":"img_mxrj_c_da.png","show_star":3,"show_quality":50}`|
|505|`{"task_growth":[1501,1502,1503,1504,1505,1506,1507,1508],"task_challenge":[1551,1552,1553,1554,1555],"need_score":200,"select_award":{"global":"TableEmpty"},"select_n":0,"award":[23300504],"award_n":[90],"target_theme":59030,"target_title":59037,"target_desc":59051,"day_title_img":"img_mxrj_b_xiao.png","day_title_img_big":"img_mxrj_b_da.png","show_star":4,"show_quality":50}`|
|506|`{"task_growth":[1601,1602,1603,1604,1605,1606,1607,1608],"task_challenge":[1651,1652,1653,1654,1655],"need_score":240,"select_award":{"global":"TableEmpty"},"select_n":0,"award":[23300504],"award_n":[120],"target_theme":59031,"target_title":59038,"target_desc":59052,"day_title_img":"img_mxrj_a_xiao.png","day_title_img_big":"img_mxrj_a_da.png","show_star":4,"show_quality":50}`|
|507|`{"task_growth":[1701,1702,1703,1704,1705,1706,1707,1708],"task_challenge":[1751,1752,1753,1754,1755],"need_score":280,"select_award":{"global":"TableEmpty"},"select_n":0,"award":[23300504],"award_n":[120],"target_theme":59032,"target_title":59039,"target_desc":59053,"day_title_img":"img_mxrj_s_da.png","day_title_img_big":"img_mxrj_s_da.png","show_star":5,"show_quality":50}`|
