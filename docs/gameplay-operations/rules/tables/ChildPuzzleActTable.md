# ChildPuzzleActTable 规则参数

来源：[personal-server/assets/tables/ChildPuzzleActTable.data.lua.json.gz](../../../../personal-server/assets/tables/ChildPuzzleActTable.data.lua.json.gz)，SHA256：`e1b576d45e4baa5d84db8c9832401ea5b3856a9377694df4d8e789a909565055`。

[完整逐行JSON](ChildPuzzleActTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[PuzzleTask](#puzzletask)|64|decoded-rows|
|[PuzzleAward](#puzzleaward)|38|decoded-rows|
|[PuzzleVersion](#puzzleversion)|2|rows-with-external-references|

## PuzzleTask

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|target_count|number|64|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|64|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|type|number|64|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|64|本表行键；与其他表同值不自动代表同一对象。|
|title|number|64|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_des|number|64|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|day|number|64|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|version|number|64|版本引用；必须按活动类型及其消费者查对应版本表。|
|task_param|number|64|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|20101|`{"target_count":1,"award":[[8901900,5],[8801900,80]],"type":1803,"task_des":0,"day":1,"version":2,"task_param":0}`|
|20102|`{"target_count":500,"award":[[8901900,10],[8801900,80]],"type":1,"task_des":0,"day":1,"version":2,"task_param":0}`|
|20103|`{"target_count":1,"award":[[8901900,5],[8801900,80]],"type":15401,"task_des":0,"day":1,"version":2,"task_param":0}`|
|20104|`{"target_count":3,"award":[[8901900,5],[8801900,80]],"type":100506,"task_des":0,"day":1,"version":2,"task_param":0}`|
|20105|`{"target_count":10,"award":[[8901900,5],[8801900,80]],"type":1002,"task_des":0,"day":1,"version":2,"task_param":0}`|
|20106|`{"target_count":100,"award":[[8901900,5],[8801900,80]],"type":4701,"task_des":0,"day":1,"version":2,"task_param":0}`|
|20107|`{"target_count":3,"award":[[8901900,5],[8801900,80]],"type":2407,"task_des":0,"day":1,"version":2,"task_param":0}`|
|20201|`{"target_count":1,"award":[[8901900,5],[8801900,80]],"type":1803,"task_des":0,"day":2,"version":2,"task_param":0}`|
|20202|`{"target_count":500,"award":[[8901900,10],[8801900,80]],"type":1,"task_des":0,"day":2,"version":2,"task_param":0}`|
|20203|`{"target_count":1,"award":[[8901900,5],[8801900,80]],"type":15402,"task_des":0,"day":2,"version":2,"task_param":0}`|
|20204|`{"target_count":10,"award":[[8901900,5],[8801900,80]],"type":1002,"task_des":0,"day":2,"version":2,"task_param":0}`|
|20205|`{"target_count":100,"award":[[8901900,5],[8801900,80]],"type":4701,"task_des":0,"day":2,"version":2,"task_param":0}`|
|20206|`{"target_count":3,"award":[[8901900,5],[8801900,80]],"type":2407,"task_des":0,"day":2,"version":2,"task_param":0}`|
|20301|`{"target_count":1,"award":[[8901900,5],[8801900,80]],"type":1803,"task_des":0,"day":3,"version":2,"task_param":0}`|
|20302|`{"target_count":500,"award":[[8901900,10],[8801900,80]],"type":1,"task_des":0,"day":3,"version":2,"task_param":0}`|
|20303|`{"target_count":1,"award":[[8901900,5],[8801900,80]],"type":15401,"task_des":0,"day":3,"version":2,"task_param":0}`|
|20304|`{"target_count":10,"award":[[8901900,5],[8801900,80]],"type":1002,"task_des":0,"day":3,"version":2,"task_param":0}`|
|20305|`{"target_count":100,"award":[[8901900,5],[8801900,80]],"type":4701,"task_des":0,"day":3,"version":2,"task_param":0}`|
|20306|`{"target_count":3,"award":[[8901900,5],[8801900,80]],"type":2407,"task_des":0,"day":3,"version":2,"task_param":0}`|
|20401|`{"target_count":1,"award":[[8901900,5],[8801900,80]],"type":1803,"task_des":0,"day":4,"version":2,"task_param":0}`|
|20402|`{"target_count":500,"award":[[8901900,10],[8801900,80]],"type":1,"task_des":0,"day":4,"version":2,"task_param":0}`|
|20403|`{"target_count":1,"award":[[8901900,5],[8801900,80]],"type":15402,"task_des":0,"day":4,"version":2,"task_param":0}`|
|20404|`{"target_count":3,"award":[[8901900,5],[8801900,80]],"type":100506,"task_des":0,"day":4,"version":2,"task_param":0}`|
|20405|`{"target_count":10,"award":[[8901900,5],[8801900,80]],"type":1002,"task_des":0,"day":4,"version":2,"task_param":0}`|
|20406|`{"target_count":100,"award":[[8901900,5],[8801900,80]],"type":4701,"task_des":0,"day":4,"version":2,"task_param":0}`|
|20407|`{"target_count":3,"award":[[8901900,5],[8801900,80]],"type":2407,"task_des":0,"day":4,"version":2,"task_param":0}`|
|20501|`{"target_count":1,"award":[[8901900,5],[8801900,80]],"type":1803,"task_des":0,"day":5,"version":2,"task_param":0}`|
|20502|`{"target_count":500,"award":[[8901900,10],[8801900,80]],"type":1,"task_des":0,"day":5,"version":2,"task_param":0}`|
|20503|`{"target_count":1,"award":[[8901900,5],[8801900,80]],"type":15401,"task_des":0,"day":5,"version":2,"task_param":0}`|
|20504|`{"target_count":10,"award":[[8901900,5],[8801900,80]],"type":1002,"task_des":0,"day":5,"version":2,"task_param":0}`|
|20505|`{"target_count":100,"award":[[8901900,5],[8801900,80]],"type":4701,"task_des":0,"day":5,"version":2,"task_param":0}`|
|20506|`{"target_count":3,"award":[[8901900,5],[8801900,80]],"type":2407,"task_des":0,"day":5,"version":2,"task_param":0}`|
|20601|`{"target_count":1,"award":[[8901900,5],[8801900,80]],"type":1803,"task_des":0,"day":6,"version":2,"task_param":0}`|
|20602|`{"target_count":500,"award":[[8901900,10],[8801900,80]],"type":1,"task_des":0,"day":6,"version":2,"task_param":0}`|
|20603|`{"target_count":1,"award":[[8901900,5],[8801900,80]],"type":15402,"task_des":0,"day":6,"version":2,"task_param":0}`|
|20604|`{"target_count":10,"award":[[8901900,5],[8801900,80]],"type":1002,"task_des":0,"day":6,"version":2,"task_param":0}`|
|20605|`{"target_count":100,"award":[[8901900,5],[8801900,80]],"type":4701,"task_des":0,"day":6,"version":2,"task_param":0}`|
|20606|`{"target_count":3,"award":[[8901900,5],[8801900,80]],"type":2407,"task_des":0,"day":6,"version":2,"task_param":0}`|
|20701|`{"target_count":1,"award":[[8901900,5],[8801900,80]],"type":1803,"task_des":0,"day":7,"version":2,"task_param":0}`|
|20702|`{"target_count":500,"award":[[8901900,10],[8801900,80]],"type":1,"task_des":0,"day":7,"version":2,"task_param":0}`|
|20703|`{"target_count":1,"award":[[8901900,5],[8801900,80]],"type":15401,"task_des":0,"day":7,"version":2,"task_param":0}`|
|20704|`{"target_count":3,"award":[[8901900,5],[8801900,80]],"type":100506,"task_des":0,"day":7,"version":2,"task_param":0}`|
|20705|`{"target_count":10,"award":[[8901900,5],[8801900,80]],"type":1002,"task_des":0,"day":7,"version":2,"task_param":0}`|
|20706|`{"target_count":100,"award":[[8901900,5],[8801900,80]],"type":4701,"task_des":0,"day":7,"version":2,"task_param":0}`|
|20707|`{"target_count":3,"award":[[8901900,5],[8801900,80]],"type":2407,"task_des":0,"day":7,"version":2,"task_param":0}`|
|20801|`{"target_count":1,"award":[[8901900,5],[8801900,80]],"type":1803,"task_des":0,"day":8,"version":2,"task_param":0}`|
|20802|`{"target_count":500,"award":[[8901900,10],[8801900,80]],"type":1,"task_des":0,"day":8,"version":2,"task_param":0}`|
|20803|`{"target_count":1,"award":[[8901900,5],[8801900,80]],"type":15402,"task_des":0,"day":8,"version":2,"task_param":0}`|
|20804|`{"target_count":10,"award":[[8901900,5],[8801900,80]],"type":1002,"task_des":0,"day":8,"version":2,"task_param":0}`|
|20805|`{"target_count":100,"award":[[8901900,5],[8801900,80]],"type":4701,"task_des":0,"day":8,"version":2,"task_param":0}`|
|20806|`{"target_count":3,"award":[[8901900,5],[8801900,80]],"type":2407,"task_des":0,"day":8,"version":2,"task_param":0}`|
|20901|`{"target_count":1,"award":[[8901900,5],[8801900,80]],"type":1803,"task_des":0,"day":9,"version":2,"task_param":0}`|
|20902|`{"target_count":500,"award":[[8901900,10],[8801900,80]],"type":1,"task_des":0,"day":9,"version":2,"task_param":0}`|
|20903|`{"target_count":1,"award":[[8901900,5],[8801900,80]],"type":15401,"task_des":0,"day":9,"version":2,"task_param":0}`|
|20904|`{"target_count":10,"award":[[8901900,5],[8801900,80]],"type":1002,"task_des":0,"day":9,"version":2,"task_param":0}`|
|20905|`{"target_count":100,"award":[[8901900,5],[8801900,80]],"type":4701,"task_des":0,"day":9,"version":2,"task_param":0}`|
|20906|`{"target_count":3,"award":[[8901900,5],[8801900,80]],"type":2407,"task_des":0,"day":9,"version":2,"task_param":0}`|
|21001|`{"target_count":1,"award":[[8901900,5],[8801900,80]],"type":1803,"task_des":0,"day":10,"version":2,"task_param":0}`|
|21002|`{"target_count":500,"award":[[8901900,10],[8801900,80]],"type":1,"task_des":0,"day":10,"version":2,"task_param":0}`|
|21003|`{"target_count":1,"award":[[8901900,5],[8801900,80]],"type":15402,"task_des":0,"day":10,"version":2,"task_param":0}`|
|21004|`{"target_count":3,"award":[[8901900,5],[8801900,80]],"type":100506,"task_des":0,"day":10,"version":2,"task_param":0}`|
|21005|`{"target_count":10,"award":[[8901900,5],[8801900,80]],"type":1002,"task_des":0,"day":10,"version":2,"task_param":0}`|
|21006|`{"target_count":100,"award":[[8901900,5],[8801900,80]],"type":4701,"task_des":0,"day":10,"version":2,"task_param":0}`|
|21007|`{"target_count":3,"award":[[8901900,5],[8801900,80]],"type":2407,"task_des":0,"day":10,"version":2,"task_param":0}`|

## PuzzleAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|38|本表行键；与其他表同值不自动代表同一对象。|
|award_list|array|38|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|select_award_list|array|38|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101101|`{"award_list":[[101500,80]],"select_award_list":[]}`|
|101102|`{"award_list":[[391002,200]],"select_award_list":[]}`|
|101103|`{"award_list":[[101500,80]],"select_award_list":[]}`|
|101104|`{"award_list":[[21002,20]],"select_award_list":[]}`|
|101201|`{"award_list":[[101500,80]],"select_award_list":[]}`|
|101202|`{"award_list":[[391002,200]],"select_award_list":[]}`|
|101203|`{"award_list":[[101500,80]],"select_award_list":[]}`|
|101204|`{"award_list":[[21002,20]],"select_award_list":[]}`|
|101300|`{"award_list":[[3271200,1]],"select_award_list":[]}`|
|102101|`{"award_list":[[101500,80]],"select_award_list":[]}`|
|102102|`{"award_list":[[32002,5]],"select_award_list":[]}`|
|102103|`{"award_list":[[101500,80]],"select_award_list":[]}`|
|102104|`{"award_list":[[31002,20]],"select_award_list":[]}`|
|102201|`{"award_list":[[101500,80]],"select_award_list":[]}`|
|102202|`{"award_list":[[32002,5]],"select_award_list":[]}`|
|102203|`{"award_list":[[101500,80]],"select_award_list":[]}`|
|102204|`{"award_list":[[31002,20]],"select_award_list":[]}`|
|102300|`{"award_list":[[2002,10]],"select_award_list":[]}`|
|103101|`{"award_list":[[101500,80]],"select_award_list":[]}`|
|103102|`{"award_list":[[18002,10]],"select_award_list":[]}`|
|103103|`{"award_list":[[101500,80]],"select_award_list":[]}`|
|103104|`{"award_list":[[17002,200]],"select_award_list":[]}`|
|103201|`{"award_list":[[101500,80]],"select_award_list":[]}`|
|103202|`{"award_list":[[18002,10]],"select_award_list":[]}`|
|103203|`{"award_list":[[101500,80]],"select_award_list":[]}`|
|103204|`{"award_list":[[17002,200]],"select_award_list":[]}`|
|103300|`{"award_list":[[3271200,1]],"select_award_list":[]}`|
|201101|`{"award_list":[[3581200,1]],"select_award_list":[]}`|
|201102|`{"award_list":[[2002,10]],"select_award_list":[]}`|
|201103|`{"award_list":[[3571200,1]],"select_award_list":[]}`|
|201104|`{"award_list":[[71200,30]],"select_award_list":[]}`|
|201105|`{"award_list":[[359208,1]],"select_award_list":[]}`|
|201201|`{"award_list":[[3008002,1]],"select_award_list":[]}`|
|201202|`{"award_list":[[101500,1000]],"select_award_list":[]}`|
|201203|`{"award_list":[[805002,1]],"select_award_list":[]}`|
|201204|`{"award_list":[[71200,30]],"select_award_list":[]}`|
|201205|`{"award_list":[[22002,1]],"select_award_list":[]}`|
|201300|`{"award_list":[],"select_award_list":[[170112,1],[154112,1],[150312,1],[152012,1],[156512,1],[151712,1],[150112,1],[154312,1],[623002,3]]}`|

## PuzzleVersion

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|puzzle_award_log_id|number|2|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|big_award|number|2|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|turn_txt|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|form|object|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|puzzle_award_mail|number|2|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|max_turn|number|2|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|res_rollback|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|turn_bg|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|draw_log_id|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|draw_item_price|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|map_y|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|draw_award_list|array|2|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|draw_consume_id|number|2|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|draw_red|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|draw_lib|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|draw_consume_num|number|2|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|map_x|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_buy_num|number|2|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|award_red|number|2|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|select_bg|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"puzzle_award_log_id":121302,"big_award":0,"turn_txt":[678623,678624,678625],"puzzle_award_mail":7541400,"max_turn":3,"turn_bg":["img_hd_tqhyj_putu1.png","img_hd_tqhyj_putu2.png","img_hd_tqhyj_putu3.png"],"draw_log_id":121301,"draw_item_price":0,"draw_award_list":[],"draw_consume_id":709002,"draw_red":174840304555,"draw_lib":5510,"draw_consume_num":10,"max_buy_num":0,"award_red":174840307651,"select_bg":[]}`|
|2|`{"puzzle_award_log_id":121302,"big_award":201300,"turn_txt":[550801065,678624,678625],"puzzle_award_mail":8011400,"max_turn":1,"turn_bg":["img_hd_tqhyj_putu1.png","img_hd_tqhyj_putu2.png","img_hd_tqhyj_putu3.png"],"draw_log_id":121301,"draw_item_price":2000,"draw_award_list":[],"draw_consume_id":8901900,"draw_red":175626002985,"draw_lib":0,"draw_consume_num":10,"max_buy_num":25,"award_red":175626002056,"select_bg":["img_hd_znq_mixuer_mofalishi.png","img_hd_znq_llilisi_longyiyuhui.png","img_hd_znq_longzhilan_xiaochunfeng.png","img_hd_znq_weier_kehoushiguang.png","img_hd_znq_weier_buliangshaonv.png","img_hd_znq_changpu_moyunqingshan.png","img_hd_znq_jiandaoxinliang_xingzhiyu.png","img_hd_znq_hanna_xiuluozhiquan.png","img_hd_znq_huanyizhijin.png"]}`|
