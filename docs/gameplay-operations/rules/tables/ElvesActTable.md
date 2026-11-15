# ElvesActTable 规则参数

来源：[personal-server/assets/tables/ElvesActTable.data.lua.json.gz](../../../../personal-server/assets/tables/ElvesActTable.data.lua.json.gz)，SHA256：`1c5211ed9a7c2d891616ba8d6e19359d1cd6286a2a38044fdb1e984c7d8ecd13`。

[完整逐行JSON](ElvesActTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[DrawAwardShow](#drawawardshow)|2|decoded-rows|
|[DrawAward](#drawaward)|22|decoded-rows|
|[ElvesExclusiveShop](#elvesexclusiveshop)|24|decoded-rows|
|[Gift](#gift)|24|decoded-rows|
|[Elves](#elves)|13|decoded-rows|
|[ElvesAct](#elvesact)|24|decoded-rows|
|[Jump](#jump)|13|rows-with-external-references|

## DrawAwardShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|item_title_name|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|init_count|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|add_count|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|red_dot|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|7|`{"item_title_name":670571,"init_count":15,"add_count":5}`|
|9|`{"item_title_name":670571,"init_count":15,"add_count":5}`|

## DrawAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|draw_award|array|22|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|draw_num|number|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|22|本表行键；与其他表同值不自动代表同一对象。|
|version|number|22|版本引用；必须按活动类型及其消费者查对应版本表。|
|is_big|boolean|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|7001|`{"draw_award":[[499002,5]],"draw_num":10,"version":7,"is_big":false}`|
|7002|`{"draw_award":[[499002,5]],"draw_num":20,"version":7,"is_big":false}`|
|7003|`{"draw_award":[[633002,1]],"draw_num":30,"version":7,"is_big":true}`|
|7004|`{"draw_award":[[499002,5]],"draw_num":45,"version":7,"is_big":false}`|
|7005|`{"draw_award":[[496002,1]],"draw_num":60,"version":7,"is_big":true}`|
|7006|`{"draw_award":[[499002,5]],"draw_num":80,"version":7,"is_big":false}`|
|7007|`{"draw_award":[[2171200,40]],"draw_num":100,"version":7,"is_big":true}`|
|7008|`{"draw_award":[[499002,10]],"draw_num":120,"version":7,"is_big":false}`|
|7009|`{"draw_award":[[496002,1]],"draw_num":140,"version":7,"is_big":true}`|
|7010|`{"draw_award":[[499002,10]],"draw_num":170,"version":7,"is_big":false}`|
|7011|`{"draw_award":[[2171200,40]],"draw_num":210,"version":7,"is_big":true}`|
|9001|`{"draw_award":[[499002,5]],"draw_num":10,"version":9,"is_big":false}`|
|9002|`{"draw_award":[[499002,5]],"draw_num":20,"version":9,"is_big":false}`|
|9003|`{"draw_award":[[633002,1]],"draw_num":30,"version":9,"is_big":true}`|
|9004|`{"draw_award":[[499002,5]],"draw_num":45,"version":9,"is_big":false}`|
|9005|`{"draw_award":[[496002,1]],"draw_num":60,"version":9,"is_big":true}`|
|9006|`{"draw_award":[[499002,5]],"draw_num":80,"version":9,"is_big":false}`|
|9007|`{"draw_award":[[2171200,40]],"draw_num":100,"version":9,"is_big":true}`|
|9008|`{"draw_award":[[499002,10]],"draw_num":120,"version":9,"is_big":false}`|
|9009|`{"draw_award":[[496002,1]],"draw_num":140,"version":9,"is_big":true}`|
|9010|`{"draw_award":[[499002,10]],"draw_num":170,"version":9,"is_big":false}`|
|9011|`{"draw_award":[[2171200,40]],"draw_num":210,"version":9,"is_big":true}`|

## ElvesExclusiveShop

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|res_red_count|array|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|shop|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_text|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|res|array|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|24|本表行键；与其他表同值不自动代表同一对象。|
|bg|string|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"res_red_count":[3000]}`|
|2|`{"res_red_count":[3000]}`|
|3|`{"res_red_count":[3000]}`|
|4|`{"res_red_count":[3000]}`|
|5|`{"res_red_count":[3000]}`|
|6|`{"res_red_count":[3000]}`|
|7|`{"res_red_count":[3000]}`|
|8|`{"res_red_count":[3000]}`|
|9|`{"res_red_count":[3000]}`|
|10|`{"res_red_count":[3000]}`|
|11|`{"res_red_count":[3000]}`|
|12|`{"res_red_count":[3000]}`|
|13|`{"res_red_count":[3000]}`|
|14|`{"res_red_count":[3000]}`|
|15|`{"res_red_count":[3000]}`|
|16|`{"res_red_count":[3000]}`|
|17|`{"res_red_count":[3000]}`|
|18|`{"res_red_count":[3000]}`|
|19|`{"res_red_count":[3000]}`|
|20|`{"res_red_count":[3000]}`|
|21|`{"res_red_count":[3000]}`|
|22|`{"res_red_count":[3000]}`|
|25|`{"res_red_count":[3000]}`|
|26|`{"res_red_count":[3000]}`|

## Gift

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|24|本表行键；与其他表同值不自动代表同一对象。|
|show_rule|array|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|direct_draw_gift|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|gift|array|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"direct_draw_gift":0}`|
|2|`{"direct_draw_gift":0}`|
|3|`{"direct_draw_gift":0}`|
|4|`{"direct_draw_gift":0}`|
|5|`{"direct_draw_gift":0}`|
|6|`{"direct_draw_gift":0}`|
|7|`{"direct_draw_gift":940510}`|
|8|`{"direct_draw_gift":940609}`|
|9|`{"direct_draw_gift":940710}`|
|10|`{"direct_draw_gift":940808}`|
|11|`{"direct_draw_gift":940910}`|
|12|`{"direct_draw_gift":941008}`|
|13|`{"direct_draw_gift":941108}`|
|14|`{"direct_draw_gift":941208}`|
|15|`{"direct_draw_gift":941208}`|
|16|`{"direct_draw_gift":941308}`|
|17|`{"direct_draw_gift":0}`|
|18|`{"direct_draw_gift":0}`|
|19|`{"direct_draw_gift":0}`|
|20|`{"direct_draw_gift":0}`|
|21|`{"direct_draw_gift":0}`|
|22|`{"direct_draw_gift":0}`|
|25|`{"direct_draw_gift":0}`|
|26|`{"direct_draw_gift":0}`|

## Elves

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|up_star_mask_bg|string|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_bg|string|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|elves_desc|number|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|dispatch_head|string|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|dispatch_bottle_img|string|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|elves_frame|string|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|up_star_act|array|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|desc_prefab|string|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|card_img_mutant|string|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|mask_one|string|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|card_img|string|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|up_star_slogan|string|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|dispatch_point_bg|string|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|anim|string|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|gift_bg|string|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|permit_bg|string|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|draw_common|string|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|13|本表行键；与其他表同值不自动代表同一对象。|
|bg|string|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|mask_tow|string|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|title_prop_id|number|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|main_prefab|string|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|draw_glow|string|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|custom_rt_effect|string|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|elves_img|string|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|200120|`{"up_star_mask_bg":"img_sp_misaldibantuxhuang.png","task_bg":"img_mxesx_lbdivhuang.png","up_star_act":[],"up_star_slogan":"img_wenzimeishuzi_jingling2.png","dispatch_point_bg":"","draw_common":"img_jlxb_ck_jiang1.png","draw_glow":"img_jlxb_ck_jiangliang1.png"}`|
|300120|`{"up_star_mask_bg":"img_sp_misaldibantuxhuang.png","task_bg":"img_mxesx_lbdivhuang.png","up_star_act":[25014],"up_star_slogan":"img_wenzimeishuzi_jingling2.png","dispatch_point_bg":"img_jllx_jldi.png","draw_common":"img_jlxb_ck_jiang1.png","draw_glow":"img_jlxb_ck_jiangliang1.png"}`|
|300220|`{"up_star_mask_bg":"img_sp_misaldibantuxhuang.png","task_bg":"img_mxesx_lbdivhuang.png","up_star_act":[25015],"up_star_slogan":"img_wenzimeishuzi_jingling2.png","dispatch_point_bg":"img_jllx_jldi2.png","draw_common":"img_jlxb_ck_jiang1.png","draw_glow":"img_jlxb_ck_jiangliang1.png"}`|
|300320|`{"up_star_mask_bg":"img_sp_misaldibantuxhuang.png","task_bg":"img_mxesx_lbdivhuang.png","up_star_act":[25019],"up_star_slogan":"img_wenzimeishuzi_jingling2.png","dispatch_point_bg":"img_jllx_jldi3lulu.png","draw_common":"img_jlxb_ck_jiang1.png","draw_glow":"img_jlxb_ck_jiangliang1.png"}`|
|400120|`{"up_star_mask_bg":"img_sp_misaldibantuxhuang.png","task_bg":"img_mxesx_lbdivhuang.png","up_star_act":[25041,25063,25081,25090],"up_star_slogan":"img_wenzimeishuzi_jingling2.png","dispatch_point_bg":"img_jllx_leina.png","draw_common":"img_jlxb_ck_jiang1cai.png","draw_glow":"img_jlxb_ck_jiang1cai.png"}`|
|400220|`{"up_star_mask_bg":"img_sp_misaldibantuxhuang.png","task_bg":"img_mxesx_lbdivhuang.png","up_star_act":[25051],"up_star_slogan":"img_wenzimeishuzi_jingling2.png","dispatch_point_bg":"img_jllx_mengmei.png","draw_common":"img_jlxb_ck_jiang1cai.png","draw_glow":"img_jlxb_ck_jiang1cai.png"}`|
|400320|`{"up_star_mask_bg":"img_sp_misaldibantuxhuang.png","task_bg":"img_mxesx_lbdivhuang.png","up_star_act":[25056],"up_star_slogan":"img_wenzimeishuzi_jingling2.png","dispatch_point_bg":"img_jllx_linglong.png","draw_common":"img_jlxb_ck_jiang1cai.png","draw_glow":"img_jlxb_ck_jiang1cai.png"}`|
|400420|`{"up_star_mask_bg":"img_sp_misaldibantuxhuang.png","task_bg":"img_mxesx_lbdivhuang.png","up_star_act":[25062],"up_star_slogan":"img_wenzimeishuzi_jingling2.png","dispatch_point_bg":"img_jllx_xiaolan.png","draw_common":"img_jlxb_ck_jiang1cai.png","draw_glow":"img_jlxb_ck_jiang1cai.png"}`|
|400520|`{"up_star_mask_bg":"img_sp_misaldibantuxhuang.png","task_bg":"img_mxesx_lbdivhuang.png","up_star_act":[25082],"up_star_slogan":"img_wenzimeishuzi_jingling2.png","dispatch_point_bg":"img_jllx_jldi.png","draw_common":"img_jlxb_ck_jiang1cai.png","draw_glow":"img_jlxb_ck_jiang1cai.png"}`|
|500120|`{"up_star_mask_bg":"img_sp_misaldibantuxhuang.png","task_bg":"img_mxesx_lbdivhuang.png","up_star_act":[25091,25098,25110],"up_star_slogan":"img_wenzimeishuzi_jingling2.png","dispatch_point_bg":"img_jllx_jldi.png","draw_common":"img_jlxb_ck_jiang1cai.png","draw_glow":"img_jlxb_ck_jiang1cai.png"}`|
|500220|`{"up_star_mask_bg":"img_sp_misaldibantuxhuang.png","task_bg":"img_mxesx_lbdivhuang.png","up_star_act":[25099],"up_star_slogan":"img_wenzimeishuzi_jingling2.png","dispatch_point_bg":"img_jllx_jldi.png","draw_common":"img_jlxb_ck_jiang1cai.png","draw_glow":"img_jlxb_ck_jiang1cai.png"}`|
|500320|`{"up_star_mask_bg":"img_sp_misaldibantuxhuang.png","task_bg":"img_mxesx_lbdivhuang.png","up_star_act":[25102],"up_star_slogan":"img_wenzimeishuzi_jingling2.png","dispatch_point_bg":"img_jllx_jldi.png","draw_common":"img_jlxb_ck_jiang1cai.png","draw_glow":"img_jlxb_ck_jiang1cai.png"}`|
|500420|`{"up_star_mask_bg":"img_sp_misaldibantuxhuang.png","task_bg":"img_mxesx_lbdivhuang.png","up_star_act":[25107],"up_star_slogan":"img_wenzimeishuzi_jingling2.png","dispatch_point_bg":"img_jllx_jldi.png","draw_common":"img_jlxb_ck_jiang1cai.png","draw_glow":"img_jlxb_ck_jiang1cai.png"}`|

## ElvesAct

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|is_statistic_type|boolean|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|res_exchange|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|elves_pop_img|string|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cartoon|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|24|本表行键；与其他表同值不自动代表同一对象。|
|permit|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|up_star_act|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|up_star_open|boolean|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pop_preview_prefab|string|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sync_switch|boolean|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|draw_act|array|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|elves|array|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|elves_title_img|array|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|main_elves|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pop_prefab|string|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|main_except_elves|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"is_statistic_type":false,"res_exchange":0,"up_star_act":25014,"up_star_open":true,"draw_act":[101001,101001]}`|
|2|`{"is_statistic_type":false,"res_exchange":0,"up_star_act":25014,"up_star_open":true,"draw_act":[101002,101002]}`|
|3|`{"is_statistic_type":false,"res_exchange":0,"up_star_act":25019,"up_star_open":true,"draw_act":[101003,101003,101003]}`|
|4|`{"is_statistic_type":false,"res_exchange":0,"up_star_act":25019,"up_star_open":true,"draw_act":[101004]}`|
|5|`{"is_statistic_type":false,"res_exchange":0,"up_star_act":25014,"up_star_open":true,"draw_act":[101005,101005]}`|
|6|`{"is_statistic_type":false,"res_exchange":0,"up_star_act":25019,"up_star_open":true,"draw_act":[101006]}`|
|7|`{"is_statistic_type":true,"res_exchange":0,"up_star_act":25014,"up_star_open":true,"draw_act":[101007,101007,101008]}`|
|8|`{"is_statistic_type":false,"res_exchange":0,"up_star_act":25041,"up_star_open":true,"draw_act":[101009]}`|
|9|`{"is_statistic_type":true,"res_exchange":0,"up_star_act":25014,"up_star_open":true,"draw_act":[101010,101010,101011]}`|
|10|`{"is_statistic_type":false,"res_exchange":0,"up_star_act":25051,"up_star_open":true,"draw_act":[101012,101012]}`|
|11|`{"is_statistic_type":false,"res_exchange":0,"up_star_act":25019,"up_star_open":true,"draw_act":[101013]}`|
|12|`{"is_statistic_type":false,"res_exchange":0,"up_star_act":25056,"up_star_open":true,"draw_act":[101014,101014,101014]}`|
|13|`{"is_statistic_type":false,"res_exchange":0,"up_star_act":25062,"up_star_open":true,"draw_act":[101015,101015,101015]}`|
|14|`{"is_statistic_type":false,"res_exchange":0,"up_star_act":25063,"up_star_open":true,"draw_act":[101016,101016,101016]}`|
|15|`{"is_statistic_type":false,"res_exchange":0,"up_star_act":25081,"up_star_open":true,"draw_act":[101017,101017,101017]}`|
|16|`{"is_statistic_type":false,"res_exchange":0,"up_star_act":25082,"up_star_open":true,"draw_act":[101018,101018,101018]}`|
|17|`{"is_statistic_type":false,"res_exchange":0,"up_star_act":25090,"up_star_open":true,"draw_act":[101019,101019,101019]}`|
|18|`{"is_statistic_type":false,"res_exchange":0,"up_star_act":25091,"up_star_open":true,"draw_act":[101020,101020,101020]}`|
|19|`{"is_statistic_type":false,"res_exchange":0,"up_star_act":25056,"up_star_open":true,"draw_act":[101021,101021,101021]}`|
|20|`{"is_statistic_type":false,"res_exchange":0,"up_star_act":25098,"up_star_open":true,"draw_act":[101022,101022,101022]}`|
|21|`{"is_statistic_type":false,"res_exchange":41,"up_star_act":25099,"up_star_open":true,"draw_act":[101023,101023,101023]}`|
|22|`{"is_statistic_type":false,"res_exchange":41,"up_star_act":25102,"up_star_open":true,"draw_act":[101024,101024,101024]}`|
|25|`{"is_statistic_type":false,"res_exchange":41,"up_star_act":25107,"up_star_open":true,"draw_act":[101025,101025,101025]}`|
|26|`{"is_statistic_type":false,"res_exchange":41,"up_star_act":25110,"up_star_open":true,"draw_act":[101026,101026,101026]}`|

## Jump

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|dispatch_open_func|object|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|main_open_func|object|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|draw_open_func|object|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|exchange_open_func|object|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|13|本表行键；与其他表同值不自动代表同一对象。|
|gift_open_func|object|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|up_star_open_func|object|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|preview_open_func|object|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|200120|`{"dispatch_open_func":{"reference":"ElvesActDispatchMainForm.StaticOpen"},"main_open_func":{"reference":"ElvesActMainForm.StaticOpen"},"draw_open_func":{"reference":"ElvesActDrawForm.StaticOpen"},"exchange_open_func":{"reference":"ElvesActShopForm.StaticOpen"},"gift_open_func":{"reference":"ElvesActGiftForm.StaticOpen"},"up_star_open_func":{"reference":"UpStarGiftMgr.OpenFormByVersion"},"preview_open_func":{"reference":"ElvesActPreviewForm.StaticOpen"}}`|
|300120|`{"dispatch_open_func":{"reference":"ElvesActDispatchMainForm.StaticOpen"},"main_open_func":{"reference":"ElvesActMainForm.StaticOpen"},"draw_open_func":{"reference":"ElvesActDrawForm.StaticOpen"},"exchange_open_func":{"reference":"ElvesActShopForm.StaticOpen"},"gift_open_func":{"reference":"ElvesActGiftForm.StaticOpen"},"up_star_open_func":{"reference":"UpStarGiftMgr.OpenFormByVersion"},"preview_open_func":{"reference":"ElvesActPreviewForm.StaticOpen"}}`|
|300220|`{"dispatch_open_func":{"reference":"ElvesActDispatchMainForm.StaticOpen"},"main_open_func":{"reference":"ElvesActMainForm.StaticOpen"},"draw_open_func":{"reference":"ElvesActDrawForm.StaticOpen"},"exchange_open_func":{"reference":"ElvesActShopForm.StaticOpen"},"gift_open_func":{"reference":"ElvesActGiftForm.StaticOpen"},"up_star_open_func":{"reference":"UpStarGiftMgr.OpenFormByVersion"},"preview_open_func":{"reference":"ElvesActPreviewForm.StaticOpen"}}`|
|300320|`{"dispatch_open_func":{"reference":"ElvesActDispatchMainForm.StaticOpen"},"main_open_func":{"reference":"ElvesActMainForm.StaticOpen"},"draw_open_func":{"reference":"ElvesActDrawForm.StaticOpen"},"exchange_open_func":{"reference":"ElvesActShopForm.StaticOpen"},"gift_open_func":{"reference":"ElvesActGiftForm.StaticOpen"},"up_star_open_func":{"reference":"UpStarGiftMgr.OpenFormByVersion"},"preview_open_func":{"reference":"ElvesActPreviewForm.StaticOpen"}}`|
|400120|`{"dispatch_open_func":{"reference":"ElvesActDispatchMainForm.StaticOpen"},"main_open_func":{"reference":"ElvesActMainForm.StaticOpen"},"draw_open_func":{"reference":"ElvesActDrawForm.StaticOpen"},"exchange_open_func":{"reference":"ElvesActShopForm.StaticOpen"},"gift_open_func":{"reference":"ElvesActGiftForm.StaticOpen"},"up_star_open_func":{"reference":"UpStarGiftMgr.OpenFormByVersion"},"preview_open_func":{"reference":"ElvesActPreviewForm.StaticOpen"}}`|
|400220|`{"dispatch_open_func":{"reference":"ElvesActDispatchMainForm.StaticOpen"},"main_open_func":{"reference":"ElvesActMainForm.StaticOpen"},"draw_open_func":{"reference":"ElvesActDrawForm.StaticOpen"},"exchange_open_func":{"reference":"ElvesActShopForm.StaticOpen"},"gift_open_func":{"reference":"ElvesActGiftForm.StaticOpen"},"up_star_open_func":{"reference":"UpStarGiftMgr.OpenFormByVersion"},"preview_open_func":{"reference":"ElvesActPreviewForm.StaticOpen"}}`|
|400320|`{"dispatch_open_func":{"reference":"ElvesActDispatchMainForm.StaticOpen"},"main_open_func":{"reference":"ElvesActMainForm.StaticOpen"},"draw_open_func":{"reference":"ElvesActDrawForm.StaticOpen"},"exchange_open_func":{"reference":"ElvesActShopForm.StaticOpen"},"gift_open_func":{"reference":"ElvesActGiftForm.StaticOpen"},"up_star_open_func":{"reference":"UpStarGiftMgr.OpenFormByVersion"},"preview_open_func":{"reference":"ElvesActPreviewForm.StaticOpen"}}`|
|400420|`{"dispatch_open_func":{"reference":"ElvesActDispatchMainForm.StaticOpen"},"main_open_func":{"reference":"ElvesActMainForm.StaticOpen"},"draw_open_func":{"reference":"ElvesActDrawForm.StaticOpen"},"exchange_open_func":{"reference":"ElvesActShopForm.StaticOpen"},"gift_open_func":{"reference":"ElvesActGiftForm.StaticOpen"},"up_star_open_func":{"reference":"UpStarGiftMgr.OpenFormByVersion"},"preview_open_func":{"reference":"ElvesActPreviewForm.StaticOpen"}}`|
|400520|`{"dispatch_open_func":{"reference":"ElvesActDispatchMainForm.StaticOpen"},"main_open_func":{"reference":"ElvesActMainForm.StaticOpen"},"draw_open_func":{"reference":"ElvesActDrawForm.StaticOpen"},"exchange_open_func":{"reference":"ElvesActShopForm.StaticOpen"},"gift_open_func":{"reference":"ElvesActGiftForm.StaticOpen"},"up_star_open_func":{"reference":"UpStarGiftMgr.OpenFormByVersion"},"preview_open_func":{"reference":"ElvesActPreviewForm.StaticOpen"}}`|
|500120|`{"dispatch_open_func":{"reference":"ElvesActDispatchMainForm.StaticOpen"},"main_open_func":{"reference":"ElvesActMainForm.StaticOpen"},"draw_open_func":{"reference":"ElvesActDrawForm.StaticOpen"},"exchange_open_func":{"reference":"ElvesActShopForm.StaticOpen"},"gift_open_func":{"reference":"ElvesActGiftForm.StaticOpen"},"up_star_open_func":{"reference":"UpStarGiftMgr.OpenFormByVersion"},"preview_open_func":{"reference":"ElvesActPreviewForm.StaticOpen"}}`|
|500220|`{"dispatch_open_func":{"reference":"ElvesActDispatchMainForm.StaticOpen"},"main_open_func":{"reference":"ElvesActMainForm.StaticOpen"},"draw_open_func":{"reference":"ElvesActDrawForm.StaticOpen"},"exchange_open_func":{"reference":"ElvesActShopForm.StaticOpen"},"gift_open_func":{"reference":"ElvesActGiftForm.StaticOpen"},"up_star_open_func":{"reference":"UpStarGiftMgr.OpenFormByVersion"},"preview_open_func":{"reference":"ElvesActPreviewForm.StaticOpen"}}`|
|500320|`{"dispatch_open_func":{"reference":"ElvesActDispatchMainForm.StaticOpen"},"main_open_func":{"reference":"ElvesActMainForm.StaticOpen"},"draw_open_func":{"reference":"ElvesActDrawForm.StaticOpen"},"exchange_open_func":{"reference":"ElvesActShopForm.StaticOpen"},"gift_open_func":{"reference":"ElvesActGiftForm.StaticOpen"},"up_star_open_func":{"reference":"UpStarGiftMgr.OpenFormByVersion"},"preview_open_func":{"reference":"ElvesActPreviewForm.StaticOpen"}}`|
|500420|`{"dispatch_open_func":{"reference":"ElvesActDispatchMainForm.StaticOpen"},"main_open_func":{"reference":"ElvesActMainForm.StaticOpen"},"draw_open_func":{"reference":"ElvesActDrawForm.StaticOpen"},"exchange_open_func":{"reference":"ElvesActShopForm.StaticOpen"},"gift_open_func":{"reference":"ElvesActGiftForm.StaticOpen"},"up_star_open_func":{"reference":"UpStarGiftMgr.OpenFormByVersion"},"preview_open_func":{"reference":"ElvesActPreviewForm.StaticOpen"}}`|
