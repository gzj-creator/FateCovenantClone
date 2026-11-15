# CrossTable 规则参数

来源：[analysis/scratchpad/time-temple-20261108/project/7484041058600332000-CrossTable.data.lua.bin](../../../../analysis/scratchpad/time-temple-20261108/project/7484041058600332000-CrossTable.data.lua.bin)，SHA256：`56630cca7f040fe54beba528596b04556ae2af96f1897f6b3316c8e1f0955c1d`。

[完整逐行JSON](CrossTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Type](#type)|13|decoded-rows|
|[TwinBlessings](#twinblessings)|7|decoded-rows|
|[TwinBlessingsAdd](#twinblessingsadd)|10|decoded-rows|
|[PVPRule](#pvprule)|2|decoded-rows|
|[RelationFunc](#relationfunc)|7|decoded-rows|
|[RecHero](#rechero)|3|decoded-rows|
|[RecGroup](#recgroup)|3|decoded-rows|
|[Func](#func)|52|decoded-rows|
|[Award](#award)|3|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[OpenInfo](#openinfo)|24|decoded-rows|
|[FunDirections](#fundirections)|25|decoded-rows|
|[Stage](#stage)|4|decoded-rows|
|[DivineFunc](#divinefunc)|4|decoded-rows|

## Type

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|auto_week_day|number|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|power_diff|number|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|erl_mod|string|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_server_num|number|13|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|tid|number|13|本表行键；与其他表同值不自动代表同一对象。|
|dynamic_server_num|array|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|auto_generate|boolean|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_guild|boolean|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|stop_handle_mod|string|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|start_mod|string|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ignore_open_day|number|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ref_name|string|13|原配置内部备注名；不等同当前界面本地化名称。|
|max_add_day|number|13|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|power_num|number|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|dynamic_max_add_day|array|13|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|0|`{"auto_week_day":0,"power_diff":0,"max_server_num":2,"dynamic_server_num":[],"auto_generate":true,"is_guild":false,"start_mod":"base","ignore_open_day":0,"ref_name":"普通跨服","max_add_day":7,"power_num":0,"dynamic_max_add_day":[]}`|
|1|`{"auto_week_day":0,"power_diff":20,"max_server_num":4,"dynamic_server_num":[[50,4],[99999,8]],"auto_generate":true,"is_guild":false,"start_mod":"normal","ignore_open_day":79,"ref_name":"荣耀排位战","max_add_day":7,"power_num":10,"dynamic_max_add_day":[[7,3],[28,7],[56,14],[79,21]]}`|
|2|`{"auto_week_day":0,"power_diff":20,"max_server_num":4,"dynamic_server_num":[[50,4],[99999,8]],"auto_generate":true,"is_guild":false,"start_mod":"normal","ignore_open_day":79,"ref_name":"巅峰对决","max_add_day":7,"power_num":10,"dynamic_max_add_day":[[7,3],[28,7],[56,14],[79,21]]}`|
|3|`{"auto_week_day":0,"power_diff":0,"max_server_num":4,"dynamic_server_num":[[50,4],[70,8],[99999,16]],"auto_generate":true,"is_guild":true,"start_mod":"normal","ignore_open_day":0,"ref_name":"航会对决","max_add_day":7,"power_num":0,"dynamic_max_add_day":[]}`|
|4|`{"auto_week_day":0,"power_diff":0,"max_server_num":4,"dynamic_server_num":[],"auto_generate":true,"is_guild":false,"start_mod":"normal","ignore_open_day":0,"ref_name":"深渊首领","max_add_day":7,"power_num":0,"dynamic_max_add_day":[]}`|
|5|`{"auto_week_day":0,"power_diff":50,"max_server_num":4,"dynamic_server_num":[],"auto_generate":true,"is_guild":false,"start_mod":"normal","ignore_open_day":0,"ref_name":"巅峰擂台赛","max_add_day":7,"power_num":10,"dynamic_max_add_day":[]}`|
|6|`{"auto_week_day":0,"power_diff":0,"max_server_num":8,"dynamic_server_num":[],"auto_generate":false,"is_guild":true,"start_mod":"normal","ignore_open_day":0,"ref_name":"黄金国度","max_add_day":7,"power_num":0,"dynamic_max_add_day":[]}`|
|7|`{"auto_week_day":0,"power_diff":0,"max_server_num":4,"dynamic_server_num":[],"auto_generate":true,"is_guild":false,"start_mod":"base","ignore_open_day":0,"ref_name":"四极跨服","max_add_day":7,"power_num":0,"dynamic_max_add_day":[]}`|
|8|`{"auto_week_day":0,"power_diff":0,"max_server_num":8,"dynamic_server_num":[],"auto_generate":true,"is_guild":false,"start_mod":"normal","ignore_open_day":0,"ref_name":"四极深渊首领","max_add_day":7,"power_num":0,"dynamic_max_add_day":[]}`|
|9|`{"auto_week_day":7,"power_diff":0,"max_server_num":64,"dynamic_server_num":[],"auto_generate":true,"is_guild":false,"start_mod":"base","ignore_open_day":0,"ref_name":"神域跨服","max_add_day":7,"power_num":0,"dynamic_max_add_day":[]}`|
|10|`{"auto_week_day":0,"power_diff":0,"max_server_num":16,"dynamic_server_num":[],"auto_generate":false,"is_guild":false,"start_mod":"normal","ignore_open_day":0,"ref_name":"巅峰擂台赛战区","max_add_day":7,"power_num":0,"dynamic_max_add_day":[]}`|
|11|`{"auto_week_day":0,"power_diff":0,"max_server_num":9999,"dynamic_server_num":[],"auto_generate":true,"is_guild":false,"start_mod":"normal","ignore_open_day":0,"ref_name":"战区","max_add_day":9999,"power_num":0,"dynamic_max_add_day":[]}`|
|12|`{"auto_week_day":0,"power_diff":0,"max_server_num":9999,"dynamic_server_num":[],"auto_generate":true,"is_guild":false,"start_mod":"normal","ignore_open_day":0,"ref_name":"战区2","max_add_day":9999,"power_num":0,"dynamic_max_add_day":[]}`|

## TwinBlessings

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|open_day|array|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|7|本表行键；与其他表同值不自动代表同一对象。|
|base_line_lv|array|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"open_day":[25,22],"base_line_lv":[66,64]}`|
|2|`{"open_day":[26,23],"base_line_lv":[67,64]}`|
|3|`{"open_day":[27,24],"base_line_lv":[67,65]}`|
|4|`{"open_day":[28,25],"base_line_lv":[68,66]}`|
|5|`{"open_day":[29,26],"base_line_lv":[69,67]}`|
|6|`{"open_day":[29,26],"base_line_lv":[69,67]}`|
|7|`{"open_day":[29,26],"base_line_lv":[69,67]}`|

## TwinBlessingsAdd

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|10|本表行键；与其他表同值不自动代表同一对象。|
|add_val|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|offset_lv|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"type":1}`|
|102|`{"type":1}`|
|103|`{"type":1}`|
|104|`{"type":1}`|
|105|`{"type":1}`|
|106|`{"type":1}`|
|107|`{"type":1}`|
|108|`{"type":1}`|
|109|`{"type":1}`|
|110|`{"type":1}`|

## PVPRule

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|base_fight|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|func|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1066|`{"base_fight":1400000,"func":[[18,1400100]]}`|
|1159|`{"base_fight":0,"func":[[41,42]]}`|

## RelationFunc

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|7|本表行键；与其他表同值不自动代表同一对象。|
|entrance|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cross_fun|array|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1028|`{}`|
|1040|`{}`|
|1048|`{}`|
|1053|`{}`|
|1064|`{}`|
|1217|`{}`|
|2004|`{}`|

## RecHero

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|weight|number|3|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|
|des|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1010201|`{"weight":3}`|
|3010101|`{"weight":1}`|
|4020301|`{"weight":2}`|

## RecGroup

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tittle_img|string|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_banner|string|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|info_banner|string|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hero_show|array|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|info_des|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|banner_des|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"hero_show":[3010101,4020301,1010201]}`|
|2|`{"hero_show":[]}`|
|3|`{"hero_show":[]}`|

## Func

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|jump_func|number|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|compatibility_not_cross|boolean|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cross_type|number|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_desc2|number|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|main_desc2|array|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|main_desc|array|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|main_bg|string|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_desc|number|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_buff|boolean|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_main|boolean|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|day|number|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|active2|number|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|join_day|array|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name2|number|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|52|本表行键；与其他表同值不自动代表同一对象。|
|cross_func|number|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fun_open|number|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_day|array|52|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|active|number|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|active_list|array|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"jump_func":200,"cross_type":0,"is_buff":false,"is_main":true,"day":3,"join_day":[22,20],"cross_func":1,"fun_open":1040,"award_day":[2,2]}`|
|2|`{"jump_func":117,"cross_type":0,"is_buff":false,"is_main":false,"day":3,"join_day":[22,20],"cross_func":1,"fun_open":1024,"award_day":[]}`|
|3|`{"jump_func":119,"cross_type":0,"is_buff":false,"is_main":false,"day":3,"join_day":[22,20],"cross_func":1,"fun_open":1067,"award_day":[]}`|
|4|`{"jump_func":206,"cross_type":0,"is_buff":false,"is_main":true,"day":4,"join_day":[24,22],"cross_func":4,"fun_open":1064,"award_day":[3,3]}`|
|5|`{"jump_func":206,"cross_type":0,"is_buff":false,"is_main":false,"day":4,"join_day":[24,22],"cross_func":4,"fun_open":1064,"award_day":[]}`|
|6|`{"jump_func":389,"cross_type":0,"is_buff":false,"is_main":false,"day":0,"join_day":[15,15],"cross_func":6,"fun_open":2005,"award_day":[]}`|
|7|`{"jump_func":243,"cross_type":0,"is_buff":false,"is_main":false,"day":0,"join_day":[22,20],"cross_func":10,"fun_open":2004,"award_day":[]}`|
|8|`{"jump_func":138,"cross_type":0,"is_buff":false,"is_main":false,"day":0,"join_day":[22,20],"cross_func":10,"fun_open":1217,"award_day":[]}`|
|10|`{"jump_func":128,"cross_type":0,"is_buff":false,"is_main":true,"day":0,"join_day":[22,20],"cross_func":10,"fun_open":1053,"award_day":[]}`|
|11|`{"jump_func":137,"cross_type":0,"is_buff":false,"is_main":false,"day":0,"join_day":[1,1],"cross_func":10,"fun_open":2002,"award_day":[]}`|
|12|`{"jump_func":420,"cross_type":0,"is_buff":false,"is_main":false,"day":0,"join_day":[99999,99999],"cross_func":10,"fun_open":2003,"award_day":[]}`|
|13|`{"jump_func":37,"cross_type":0,"is_buff":false,"is_main":false,"day":0,"join_day":[22,20],"cross_func":10,"fun_open":1048,"award_day":[]}`|
|14|`{"jump_func":0,"cross_type":0,"is_buff":true,"is_main":false,"day":0,"join_day":[25,22],"cross_func":1,"fun_open":0,"award_day":[]}`|
|15|`{"jump_func":0,"cross_type":0,"is_buff":false,"is_main":false,"day":0,"join_day":[16,16],"cross_func":0,"fun_open":0,"award_day":[]}`|
|16|`{"jump_func":200,"cross_type":0,"is_buff":false,"is_main":true,"day":0,"join_day":[99999,99999],"cross_func":16,"fun_open":0,"award_day":[]}`|
|17|`{"jump_func":206,"cross_type":0,"is_buff":false,"is_main":true,"day":0,"join_day":[99999,99999],"cross_func":17,"fun_open":0,"award_day":[]}`|
|18|`{"jump_func":170,"cross_type":1,"is_buff":false,"is_main":true,"day":0,"join_day":[29,29],"cross_func":18,"fun_open":0,"award_day":[]}`|
|19|`{"jump_func":278,"cross_type":2,"is_buff":false,"is_main":true,"day":0,"join_day":[15,15],"cross_func":19,"fun_open":0,"award_day":[]}`|
|20|`{"jump_func":128,"cross_type":0,"is_buff":false,"is_main":false,"day":0,"join_day":[22,20],"cross_func":10,"fun_open":1053,"award_day":[]}`|
|21|`{"jump_func":389,"cross_type":0,"is_buff":false,"is_main":false,"day":0,"join_day":[1,1],"cross_func":10,"fun_open":2005,"award_day":[]}`|
|22|`{"jump_func":389,"cross_type":11,"is_buff":false,"is_main":false,"day":0,"join_day":[1,1],"cross_func":10,"fun_open":2005,"award_day":[]}`|
|23|`{"jump_func":0,"cross_type":5,"is_buff":false,"is_main":false,"day":0,"join_day":[1,1],"cross_func":0,"fun_open":0,"award_day":[]}`|
|24|`{"jump_func":0,"cross_type":0,"is_buff":false,"is_main":false,"day":0,"join_day":[22,20],"cross_func":10,"fun_open":0,"award_day":[]}`|
|25|`{"jump_func":0,"cross_type":6,"is_buff":false,"is_main":false,"day":0,"join_day":[1,1],"cross_func":10,"fun_open":0,"award_day":[]}`|
|26|`{"jump_func":200,"cross_type":7,"is_buff":false,"is_main":true,"day":3,"join_day":[50,50],"cross_func":26,"fun_open":1040,"award_day":[]}`|
|29|`{"jump_func":206,"cross_type":7,"is_buff":false,"is_main":true,"day":0,"join_day":[50,50],"cross_func":29,"fun_open":1064,"award_day":[]}`|
|31|`{"jump_func":119,"cross_type":7,"is_buff":false,"is_main":false,"day":3,"join_day":[50,50],"cross_func":10,"fun_open":1067,"award_day":[]}`|
|32|`{"jump_func":37,"cross_type":7,"is_buff":false,"is_main":false,"day":0,"join_day":[50,50],"cross_func":10,"fun_open":1048,"award_day":[]}`|
|33|`{"jump_func":128,"cross_type":7,"is_buff":false,"is_main":true,"day":0,"join_day":[50,50],"cross_func":10,"fun_open":1053,"award_day":[]}`|
|34|`{"jump_func":243,"cross_type":7,"is_buff":false,"is_main":false,"day":0,"join_day":[50,50],"cross_func":10,"fun_open":2004,"award_day":[]}`|
|35|`{"jump_func":138,"cross_type":7,"is_buff":false,"is_main":false,"day":0,"join_day":[50,50],"cross_func":10,"fun_open":1217,"award_day":[]}`|
|36|`{"jump_func":200,"cross_type":0,"is_buff":false,"is_main":true,"day":0,"join_day":[99999,99999],"cross_func":36,"fun_open":0,"award_day":[]}`|
|37|`{"jump_func":200,"cross_type":7,"is_buff":false,"is_main":true,"day":0,"join_day":[99999,99999],"cross_func":37,"fun_open":0,"award_day":[]}`|
|38|`{"jump_func":206,"cross_type":0,"is_buff":false,"is_main":true,"day":0,"join_day":[99999,99999],"cross_func":38,"fun_open":0,"award_day":[]}`|
|39|`{"jump_func":170,"cross_type":1,"is_buff":false,"is_main":true,"day":0,"join_day":[27,24],"cross_func":39,"fun_open":0,"award_day":[]}`|
|40|`{"jump_func":170,"cross_type":1,"is_buff":false,"is_main":true,"day":0,"join_day":[51,51],"cross_func":40,"fun_open":0,"award_day":[]}`|
|41|`{"jump_func":278,"cross_type":2,"is_buff":false,"is_main":true,"day":0,"join_day":[28,25],"cross_func":41,"fun_open":0,"award_day":[]}`|
|42|`{"jump_func":278,"cross_type":2,"is_buff":false,"is_main":true,"day":0,"join_day":[52,52],"cross_func":42,"fun_open":0,"award_day":[]}`|
|43|`{"jump_func":0,"cross_type":0,"is_buff":false,"is_main":false,"day":0,"join_day":[25,22],"cross_func":43,"fun_open":0,"award_day":[]}`|
|44|`{"jump_func":0,"cross_type":0,"is_buff":false,"is_main":false,"day":0,"join_day":[50,50],"cross_func":44,"fun_open":0,"award_day":[]}`|
|45|`{"jump_func":0,"cross_type":9,"is_buff":false,"is_main":false,"day":0,"join_day":[76,76],"cross_func":10,"fun_open":0,"award_day":[]}`|
|46|`{"jump_func":119,"cross_type":9,"is_buff":false,"is_main":false,"day":3,"join_day":[79,79],"cross_func":10,"fun_open":1067,"award_day":[]}`|
|47|`{"jump_func":37,"cross_type":9,"is_buff":false,"is_main":false,"day":0,"join_day":[79,79],"cross_func":10,"fun_open":1048,"award_day":[]}`|
|48|`{"jump_func":128,"cross_type":9,"is_buff":false,"is_main":true,"day":0,"join_day":[79,79],"cross_func":10,"fun_open":1053,"award_day":[]}`|
|49|`{"jump_func":243,"cross_type":9,"is_buff":false,"is_main":false,"day":0,"join_day":[79,79],"cross_func":10,"fun_open":2004,"award_day":[]}`|
|50|`{"jump_func":138,"cross_type":9,"is_buff":false,"is_main":false,"day":0,"join_day":[79,79],"cross_func":10,"fun_open":1217,"award_day":[]}`|
|51|`{"jump_func":200,"cross_type":9,"is_buff":false,"is_main":true,"day":0,"join_day":[79,79],"cross_func":51,"fun_open":1040,"award_day":[]}`|
|52|`{"jump_func":206,"cross_type":9,"is_buff":false,"is_main":true,"day":0,"join_day":[79,79],"cross_func":52,"fun_open":1064,"award_day":[]}`|
|53|`{"jump_func":0,"cross_type":9,"is_buff":false,"is_main":false,"day":0,"join_day":[79,79],"cross_func":53,"fun_open":0,"award_day":[]}`|
|54|`{"jump_func":170,"cross_type":1,"is_buff":false,"is_main":true,"day":0,"join_day":[79,79],"cross_func":54,"fun_open":0,"award_day":[]}`|
|55|`{"jump_func":0,"cross_type":9,"is_buff":false,"is_main":false,"day":0,"join_day":[76,76],"cross_func":10,"fun_open":0,"award_day":[]}`|
|56|`{"jump_func":0,"cross_type":11,"is_buff":false,"is_main":false,"day":0,"join_day":[1,1],"cross_func":0,"fun_open":0,"award_day":[]}`|

## Award

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|cross_func|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cost_list|array|3|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|award_list|array|3|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|cross_stage|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|award_list_free|array|3|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"cross_func":1,"cost_list":[[101500,1000]],"award_list":[[33002,10],[392002,5],[396002,5],[391002,1000]],"cross_stage":1,"award_list_free":[[2002,10]]}`|
|2|`{"cross_func":4,"cost_list":[[101500,1000]],"award_list":[[33002,10],[392002,5],[396002,5],[391002,1000]],"cross_stage":1,"award_list_free":[[2002,10]]}`|
|3|`{"cross_func":6,"cost_list":[[101500,1000]],"award_list":[[33002,10],[392002,5],[396002,5],[391002,1000]],"cross_stage":1,"award_list_free":[[2002,10]]}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|second_cfg_condition|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|divine_realm_condition|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"second_cfg_condition":942500900001,"divine_realm_condition":693599500007}`|

## OpenInfo

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|24|本表行键；与其他表同值不自动代表同一对象。|
|stage|number|24|ActFrame阶段引用数组；不同于旧Activity.state。|
|title|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|desc|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"stage":1}`|
|2|`{"stage":1}`|
|3|`{"stage":1}`|
|4|`{"stage":1}`|
|5|`{"stage":1}`|
|6|`{"stage":1}`|
|7|`{"stage":1}`|
|8|`{"stage":1}`|
|101|`{"stage":2}`|
|102|`{"stage":2}`|
|103|`{"stage":2}`|
|104|`{"stage":2}`|
|105|`{"stage":2}`|
|106|`{"stage":2}`|
|107|`{"stage":2}`|
|108|`{"stage":2}`|
|201|`{"stage":3}`|
|202|`{"stage":3}`|
|203|`{"stage":3}`|
|204|`{"stage":3}`|
|205|`{"stage":3}`|
|206|`{"stage":3}`|
|207|`{"stage":3}`|
|208|`{"stage":3}`|

## FunDirections

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|stage|number|25|ActFrame阶段引用数组；不同于旧Activity.state。|
|fun_open|number|25|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_des|number|25|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|server_title|number|25|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|25|本表行键；与其他表同值不自动代表同一对象。|
|show_title|number|25|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"stage":1,"fun_open":1040}`|
|2|`{"stage":2,"fun_open":1040}`|
|3|`{"stage":3,"fun_open":1040}`|
|4|`{"stage":1,"fun_open":1217}`|
|5|`{"stage":2,"fun_open":1217}`|
|6|`{"stage":3,"fun_open":1217}`|
|7|`{"stage":1,"fun_open":2004}`|
|8|`{"stage":2,"fun_open":2004}`|
|9|`{"stage":3,"fun_open":2004}`|
|10|`{"stage":1,"fun_open":1064}`|
|11|`{"stage":2,"fun_open":1064}`|
|12|`{"stage":3,"fun_open":1064}`|
|13|`{"stage":1,"fun_open":1263}`|
|14|`{"stage":2,"fun_open":1263}`|
|15|`{"stage":3,"fun_open":1263}`|
|16|`{"stage":1,"fun_open":1224}`|
|17|`{"stage":2,"fun_open":1224}`|
|18|`{"stage":3,"fun_open":1224}`|
|19|`{"stage":3,"fun_open":2005}`|
|20|`{"stage":3,"fun_open":1066}`|
|21|`{"stage":3,"fun_open":1159}`|
|22|`{"stage":3,"fun_open":2002}`|
|23|`{"stage":1,"fun_open":1024}`|
|24|`{"stage":2,"fun_open":1024}`|
|25|`{"stage":3,"fun_open":1024}`|

## Stage

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|open_day|array|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ads_item|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|random_award|number|4|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|open_day_split_timestamp|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|notice_award_day|array|4|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|notice_duration|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|notice_award_duration|number|4|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|ads_min_n|number|4|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|notice_award_count|number|4|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|relation_cross|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|stage_name|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|0|`{"open_day":[0,0],"ads_item":0,"random_award":0,"open_day_split_timestamp":0,"notice_award_day":[],"notice_duration":0,"notice_award_duration":0,"ads_min_n":0,"notice_award_count":0,"stage_name":19641}`|
|1|`{"open_day":[22,20],"ads_item":101500,"random_award":671,"open_day_split_timestamp":0,"notice_award_day":[21,19],"notice_duration":86400,"notice_award_duration":61200,"ads_min_n":166,"notice_award_count":5,"stage_name":19642}`|
|2|`{"open_day":[50,50],"ads_item":101500,"random_award":671,"open_day_split_timestamp":0,"notice_award_day":[],"notice_duration":86400,"notice_award_duration":61200,"ads_min_n":166,"notice_award_count":0,"stage_name":19643}`|
|3|`{"open_day":[79,79],"ads_item":0,"random_award":0,"open_day_split_timestamp":1735592400,"notice_award_day":[],"notice_duration":0,"notice_award_duration":0,"ads_min_n":0,"notice_award_count":0,"stage_name":19644}`|

## DivineFunc

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|fixed_open_day|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"fixed_open_day":1}`|
|2|`{"fixed_open_day":1}`|
|3|`{"fixed_open_day":1}`|
|4|`{"fixed_open_day":7}`|
