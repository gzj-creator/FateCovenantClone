# EquipTable 规则参数

来源：[personal-server/assets/tables/EquipTable.data.lua.json.gz](../../../../personal-server/assets/tables/EquipTable.data.lua.json.gz)，SHA256：`153d0be7c2f8bde17af17401321d931e4bd5d6576386a7e2bc013b1f1959daed`。

[完整逐行JSON](EquipTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[EQ_Forge](#eq_forge)|20|decoded-rows|
|[EQ_Quality](#eq_quality)|6|decoded-rows|
|[EQ_Master_Quality](#eq_master_quality)|5|decoded-rows|
|[EQ_Refine_Show](#eq_refine_show)|4|decoded-rows|
|[EQ_Inscription_Stage](#eq_inscription_stage)|14|decoded-rows|
|[EQ_Inscription](#eq_inscription)|130|decoded-rows|
|[DevelopType](#developtype)|4|decoded-rows|
|[Master](#master)|123|decoded-rows|
|[Talent](#talent)|22|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[Level](#level)|2000|decoded-rows|
|[ResExchange](#resexchange)|9|decoded-rows|
|[Type](#type)|4|decoded-rows|
|[Equip](#equip)|80|decoded-rows|
|[Refine](#refine)|320|decoded-rows|
|[Inscription](#inscription)|520|decoded-rows|

## EQ_Forge

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|show_max_star|number|20|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|effect|string|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|quality_bg|string|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|20|本表行键；与其他表同值不自动代表同一对象。|
|loopEff|string|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|quality|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|actEff|string|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|real_star_num|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_empty|boolean|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_star_num|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|quality_show_bg|string|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|star_type|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"show_max_star":0,"quality_bg":"Bg_small_baise.png","quality":10,"real_star_num":0,"show_star_num":0,"quality_show_bg":"img_zbtc_pz_bai.png","star_type":5}`|
|2|`{"show_max_star":0,"quality_bg":"Bg_small_lvse.png","quality":20,"real_star_num":0,"show_star_num":0,"quality_show_bg":"img_zbtc_pz_lv.png","star_type":5}`|
|3|`{"show_max_star":0,"quality_bg":"Bg_small_lanse.png","quality":30,"real_star_num":0,"show_star_num":0,"quality_show_bg":"img_zbtc_pz_lan.png","star_type":6}`|
|4|`{"show_max_star":0,"quality_bg":"Bg_small_zise.png","quality":40,"real_star_num":0,"show_star_num":0,"quality_show_bg":"img_zbtc_pz_zi.png","star_type":7}`|
|5|`{"show_max_star":2,"quality_bg":"Bg_small_huangse.png","quality":50,"real_star_num":0,"show_star_num":0,"quality_show_bg":"img_zbtc_pz_hhuang.png","star_type":3}`|
|6|`{"show_max_star":2,"quality_bg":"Bg_small_huangse.png","quality":50,"real_star_num":1,"show_star_num":1,"quality_show_bg":"img_zbtc_pz_hhuang.png","star_type":3}`|
|7|`{"show_max_star":2,"quality_bg":"Bg_small_huangse.png","quality":50,"real_star_num":2,"show_star_num":2,"quality_show_bg":"img_zbtc_pz_hhuang.png","star_type":3}`|
|8|`{"show_max_star":3,"quality_bg":"Bg_small_zuanshise.png","quality":60,"real_star_num":0,"show_star_num":0,"quality_show_bg":"img_zbtc_pz_cai.png","star_type":4}`|
|9|`{"show_max_star":3,"quality_bg":"Bg_small_zuanshise.png","quality":60,"real_star_num":1,"show_star_num":1,"quality_show_bg":"img_zbtc_pz_cai.png","star_type":4}`|
|10|`{"show_max_star":3,"quality_bg":"Bg_small_zuanshise.png","quality":60,"real_star_num":2,"show_star_num":2,"quality_show_bg":"img_zbtc_pz_cai.png","star_type":4}`|
|11|`{"show_max_star":3,"quality_bg":"Bg_small_zuanshise.png","quality":60,"real_star_num":3,"show_star_num":3,"quality_show_bg":"img_zbtc_pz_cai.png","star_type":4}`|
|12|`{"show_max_star":3,"quality_bg":"Bg_small_zuanshise.png","quality":60,"real_star_num":4,"show_star_num":1,"quality_show_bg":"img_zbtc_pz_cai.png","star_type":14}`|
|13|`{"show_max_star":3,"quality_bg":"Bg_small_zuanshise.png","quality":60,"real_star_num":5,"show_star_num":2,"quality_show_bg":"img_zbtc_pz_cai.png","star_type":14}`|
|14|`{"show_max_star":3,"quality_bg":"Bg_small_zuanshise.png","quality":60,"real_star_num":6,"show_star_num":3,"quality_show_bg":"img_zbtc_pz_cai.png","star_type":14}`|
|15|`{"show_max_star":3,"quality_bg":"Bg_small_zuanshise.png","quality":60,"real_star_num":7,"show_star_num":1,"quality_show_bg":"img_zbtc_pz_cai.png","star_type":4}`|
|16|`{"show_max_star":3,"quality_bg":"Bg_small_zuanshise.png","quality":60,"real_star_num":8,"show_star_num":2,"quality_show_bg":"img_zbtc_pz_cai.png","star_type":4}`|
|17|`{"show_max_star":3,"quality_bg":"Bg_small_zuanshise.png","quality":60,"real_star_num":9,"show_star_num":3,"quality_show_bg":"img_zbtc_pz_cai.png","star_type":4}`|
|18|`{"show_max_star":3,"quality_bg":"Bg_small_zuanshise.png","quality":60,"real_star_num":10,"show_star_num":1,"quality_show_bg":"img_zbtc_pz_cai.png","star_type":14}`|
|19|`{"show_max_star":3,"quality_bg":"Bg_small_zuanshise.png","quality":60,"real_star_num":11,"show_star_num":2,"quality_show_bg":"img_zbtc_pz_cai.png","star_type":14}`|
|20|`{"show_max_star":3,"quality_bg":"Bg_small_zuanshise.png","quality":60,"real_star_num":12,"show_star_num":3,"quality_show_bg":"img_zbtc_pz_cai.png","star_type":14}`|

## EQ_Quality

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|quality_number|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|slot_quality_bg|string|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|star_icon|string|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|exp|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|star_count|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|add_icon|string|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_star|number|6|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|bg_image|string|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|corner_mark|string|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|strength_bg_image|string|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|slot_effect|string|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10|`{"quality_number":1,"slot_quality_bg":"img_yxzb_pinzhilv.png","star_icon":"Icon_Equip_Small_xing_huang.png","exp":10,"star_count":1,"max_star":1}`|
|20|`{"quality_number":2,"slot_quality_bg":"img_yxzb_pinzhilv.png","star_icon":"Icon_Equip_Small_xing_huang.png","exp":10,"star_count":1,"max_star":1}`|
|30|`{"quality_number":3,"slot_quality_bg":"img_yxzb_pinzhilan.png","star_icon":"Icon_Equip_Small_xing_huang.png","exp":40,"star_count":2,"max_star":1}`|
|40|`{"quality_number":4,"slot_quality_bg":"img_yxzb_pinzhizi.png","star_icon":"Icon_Equip_Small_xing_huang.png","exp":100,"star_count":3,"max_star":1}`|
|50|`{"quality_number":5,"slot_quality_bg":"img_yxzb_pinzhihuang.png","star_icon":"Icon_Equip_Small_xing_huang.png","exp":500,"star_count":4,"max_star":3}`|
|60|`{"quality_number":6,"slot_quality_bg":"img_yxzb_pinzhizuanshi.png","star_icon":"Icon_Equip_Small_xing_jiuxing.png","exp":1000,"star_count":5,"max_star":5}`|

## EQ_Master_Quality

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|icon|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|range|array|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|

## EQ_Refine_Show

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|img|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|2|`{}`|
|3|`{}`|
|5|`{}`|
|10|`{}`|

## EQ_Inscription_Stage

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|show_txt|boolean|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|quality|number|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|star_num|number|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|effect|string|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|14|本表行键；与其他表同值不自动代表同一对象。|
|star_bg|string|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_star|string|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|desc|number|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|quality_child_effect|array|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|quality_Icon_effect|string|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_progress|string|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|quality_up_stage_effect|string|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|icon|string|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|stage_name|number|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"quality":20,"star_num":0,"star_bg":"img_yxsx_mingwen_xing_an.png","quality_child_effect":["Effect_EquipDevelopPopupForm_green_start.prefab","Effect_EquipDevelopPopupForm_green_loop.prefab","Effect_EquipDevelopPopupForm_green_end.prefab"],"quality_Icon_effect":"Effect_EquipDevelopPopupForm_ring_02_green.prefab","quality_up_stage_effect":"Effect_EquipDevelopPopupForm_green_baofa.prefab","stage_name":59646}`|
|2|`{"quality":30,"star_num":0,"star_bg":"img_yxsx_mingwen_xing_an.png","quality_child_effect":["Effect_EquipDevelopPopupForm_blue_start.prefab","Effect_EquipDevelopPopupForm_blue_loop.prefab","Effect_EquipDevelopPopupForm_blue_end.prefab"],"quality_Icon_effect":"Effect_EquipDevelopPopupForm_ring_02_blue.prefab","quality_up_stage_effect":"Effect_EquipDevelopPopupForm_blue_baofa.prefab","stage_name":59647}`|
|3|`{"quality":40,"star_num":0,"star_bg":"img_yxsx_mingwen_yue_an.png","quality_child_effect":["Effect_EquipDevelopPopupForm_purple_start.prefab","Effect_EquipDevelopPopupForm_purple_loop.prefab","Effect_EquipDevelopPopupForm_purple_end.prefab"],"quality_Icon_effect":"Effect_EquipDevelopPopupForm_ring_02_purple.prefab","quality_up_stage_effect":"Effect_EquipDevelopPopupForm_purple_baofa.prefab","stage_name":59648}`|
|4|`{"quality":50,"star_num":0,"star_bg":"img_yxsx_mingwen_ri_an.png","quality_child_effect":["Effect_EquipDevelopPopupForm_gold_start.prefab","Effect_EquipDevelopPopupForm_gold_loop.prefab","Effect_EquipDevelopPopupForm_gold_end.prefab"],"quality_Icon_effect":"Effect_EquipDevelopPopupForm_ring_02_gold.prefab","quality_up_stage_effect":"Effect_EquipDevelopPopupForm_gold_baofa.prefab","stage_name":59649}`|
|5|`{"quality":60,"star_num":0,"star_bg":"img_yxsx_mingwen_tian_an.png","quality_child_effect":["Effect_EquipDevelopPopupForm_color_start.prefab","Effect_EquipDevelopPopupForm_color_loop.prefab","Effect_EquipDevelopPopupForm_color_end.prefab"],"quality_Icon_effect":"Effect_EquipDevelopPopupForm_ring_02_color.prefab","quality_up_stage_effect":"Effect_EquipDevelopPopupForm_color_baofa.prefab","stage_name":59650}`|
|6|`{"quality":60,"star_num":1,"star_bg":"img_yxsx_mingwen_tian_an.png","quality_child_effect":["Effect_EquipDevelopPopupForm_color_start.prefab","Effect_EquipDevelopPopupForm_color_loop.prefab","Effect_EquipDevelopPopupForm_color_end.prefab"],"quality_Icon_effect":"Effect_EquipDevelopPopupForm_ring_02_color.prefab","quality_up_stage_effect":"Effect_EquipDevelopPopupForm_color_baofa.prefab","stage_name":59653}`|
|7|`{"quality":60,"star_num":2,"star_bg":"img_yxsx_mingwen_tian_an.png","quality_child_effect":["Effect_EquipDevelopPopupForm_color_start.prefab","Effect_EquipDevelopPopupForm_color_loop.prefab","Effect_EquipDevelopPopupForm_color_end.prefab"],"quality_Icon_effect":"Effect_EquipDevelopPopupForm_ring_02_color.prefab","quality_up_stage_effect":"Effect_EquipDevelopPopupForm_color_baofa.prefab","stage_name":59654}`|
|8|`{"quality":60,"star_num":3,"star_bg":"img_yxsx_mingwen_tian_an.png","quality_child_effect":["Effect_EquipDevelopPopupForm_color_start.prefab","Effect_EquipDevelopPopupForm_color_loop.prefab","Effect_EquipDevelopPopupForm_color_end.prefab"],"quality_Icon_effect":"Effect_EquipDevelopPopupForm_ring_02_color.prefab","quality_up_stage_effect":"Effect_EquipDevelopPopupForm_color_baofa.prefab","stage_name":59655}`|
|9|`{"quality":60,"star_num":4,"star_bg":"img_yxsx_mingwen_tian_an.png","quality_child_effect":["Effect_EquipDevelopPopupForm_color_start.prefab","Effect_EquipDevelopPopupForm_color_loop.prefab","Effect_EquipDevelopPopupForm_color_end.prefab"],"quality_Icon_effect":"Effect_EquipDevelopPopupForm_ring_02_color.prefab","quality_up_stage_effect":"Effect_EquipDevelopPopupForm_color_baofa.prefab","stage_name":410337}`|
|10|`{"quality":60,"star_num":5,"star_bg":"img_yxsx_mingwen_tian_an.png","quality_child_effect":["Effect_EquipDevelopPopupForm_color_start.prefab","Effect_EquipDevelopPopupForm_color_loop.prefab","Effect_EquipDevelopPopupForm_color_end.prefab"],"quality_Icon_effect":"Effect_EquipDevelopPopupForm_ring_02_color.prefab","quality_up_stage_effect":"Effect_EquipDevelopPopupForm_color_baofa.prefab","stage_name":410338}`|
|11|`{"quality":60,"star_num":6,"star_bg":"img_yxsx_mingwen_tian_an.png","quality_child_effect":["Effect_EquipDevelopPopupForm_color_start.prefab","Effect_EquipDevelopPopupForm_color_loop.prefab","Effect_EquipDevelopPopupForm_color_end.prefab"],"quality_Icon_effect":"Effect_EquipDevelopPopupForm_ring_02_color.prefab","quality_up_stage_effect":"Effect_EquipDevelopPopupForm_color_baofa.prefab","stage_name":410339}`|
|12|`{"quality":60,"star_num":7,"star_bg":"img_yxsx_mingwen_tian_an.png","quality_child_effect":["Effect_EquipDevelopPopupForm_color_start.prefab","Effect_EquipDevelopPopupForm_color_loop.prefab","Effect_EquipDevelopPopupForm_color_end.prefab"],"quality_Icon_effect":"Effect_EquipDevelopPopupForm_ring_02_color.prefab","quality_up_stage_effect":"Effect_EquipDevelopPopupForm_color_baofa.prefab","stage_name":410340}`|
|13|`{"quality":60,"star_num":8,"star_bg":"img_yxsx_mingwen_tian_an.png","quality_child_effect":["Effect_EquipDevelopPopupForm_color_start.prefab","Effect_EquipDevelopPopupForm_color_loop.prefab","Effect_EquipDevelopPopupForm_color_end.prefab"],"quality_Icon_effect":"Effect_EquipDevelopPopupForm_ring_02_color.prefab","quality_up_stage_effect":"Effect_EquipDevelopPopupForm_color_baofa.prefab","stage_name":410341}`|
|14|`{"quality":60,"star_num":9,"star_bg":"img_yxsx_mingwen_tian_an.png","quality_child_effect":["Effect_EquipDevelopPopupForm_color_start.prefab","Effect_EquipDevelopPopupForm_color_loop.prefab","Effect_EquipDevelopPopupForm_color_end.prefab"],"quality_Icon_effect":"Effect_EquipDevelopPopupForm_ring_02_color.prefab","quality_up_stage_effect":"Effect_EquipDevelopPopupForm_color_baofa.prefab","stage_name":410342}`|

## EQ_Inscription

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|130|本表行键；与其他表同值不自动代表同一对象。|
|args|number|130|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show|number|130|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

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
|25|`{}`|
|26|`{}`|
|27|`{}`|
|28|`{}`|
|29|`{}`|
|30|`{}`|
|31|`{}`|
|32|`{}`|
|33|`{}`|
|34|`{}`|
|35|`{}`|
|36|`{}`|
|37|`{}`|
|38|`{}`|
|39|`{}`|
|40|`{}`|
|41|`{}`|
|42|`{}`|
|43|`{}`|
|44|`{}`|
|45|`{}`|
|46|`{}`|
|47|`{}`|
|48|`{}`|
|49|`{}`|
|50|`{}`|
|51|`{}`|
|52|`{}`|
|53|`{}`|
|54|`{}`|
|55|`{}`|
|56|`{}`|
|57|`{}`|
|58|`{}`|
|59|`{}`|
|60|`{}`|
|61|`{}`|
|62|`{}`|
|63|`{}`|
|64|`{}`|
|65|`{}`|
|66|`{}`|
|67|`{}`|
|68|`{}`|
|69|`{}`|
|70|`{}`|
|71|`{}`|
|72|`{}`|
|73|`{}`|
|74|`{}`|
|75|`{}`|
|76|`{}`|
|77|`{}`|
|78|`{}`|
|79|`{}`|
|80|`{}`|
|81|`{}`|
|82|`{}`|
|83|`{}`|
|84|`{}`|
|85|`{}`|
|86|`{}`|
|87|`{}`|
|88|`{}`|
|89|`{}`|
|90|`{}`|
|91|`{}`|
|92|`{}`|
|93|`{}`|
|94|`{}`|
|95|`{}`|
|96|`{}`|
|97|`{}`|
|98|`{}`|
|99|`{}`|
|100|`{}`|
|101|`{}`|
|102|`{}`|
|103|`{}`|
|104|`{}`|
|105|`{}`|
|106|`{}`|
|107|`{}`|
|108|`{}`|
|109|`{}`|
|110|`{}`|
|111|`{}`|
|112|`{}`|
|113|`{}`|
|114|`{}`|
|115|`{}`|
|116|`{}`|
|117|`{}`|
|118|`{}`|
|119|`{}`|
|120|`{}`|
|121|`{}`|
|122|`{}`|
|123|`{}`|
|124|`{}`|
|125|`{}`|
|126|`{}`|
|127|`{}`|
|128|`{}`|
|129|`{}`|
|130|`{}`|

## DevelopType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|show_name|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|open_condition|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|master_show_name|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|next_show_name|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"open_condition":1057,"next_show_name":59597}`|
|2|`{"open_condition":1058,"next_show_name":59597}`|
|3|`{"open_condition":1059,"next_show_name":0}`|
|4|`{"open_condition":1061,"next_show_name":59600}`|

## Master

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|123|本表行键；与其他表同值不自动代表同一对象。|
|attrs|array|123|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|condition|number|123|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|123|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10001|`{"attrs":[[201,360],[202,60],[203,36],[204,36]],"condition":10,"type":1}`|
|10002|`{"attrs":[[201,630],[202,105],[203,63],[204,63]],"condition":20,"type":1}`|
|10003|`{"attrs":[[201,900],[202,150],[203,90],[204,90]],"condition":30,"type":1}`|
|10004|`{"attrs":[[201,1380],[202,230],[203,138],[204,138]],"condition":40,"type":1}`|
|10005|`{"attrs":[[201,1890],[202,315],[203,189],[204,189]],"condition":50,"type":1}`|
|10006|`{"attrs":[[201,2400],[202,400],[203,240],[204,240]],"condition":60,"type":1}`|
|10007|`{"attrs":[[201,2670],[202,445],[203,267],[204,267]],"condition":70,"type":1}`|
|10008|`{"attrs":[[201,3150],[202,525],[203,315],[204,315]],"condition":80,"type":1}`|
|10009|`{"attrs":[[201,3630],[202,605],[203,363],[204,363]],"condition":90,"type":1}`|
|10010|`{"attrs":[[201,4200],[202,700],[203,420],[204,420]],"condition":100,"type":1}`|
|10011|`{"attrs":[[201,4680],[202,780],[203,468],[204,468]],"condition":110,"type":1}`|
|10012|`{"attrs":[[201,5400],[202,900],[203,540],[204,540]],"condition":120,"type":1}`|
|10013|`{"attrs":[[201,6120],[202,1020],[203,612],[204,612]],"condition":130,"type":1}`|
|10014|`{"attrs":[[201,6840],[202,1140],[203,684],[204,684]],"condition":140,"type":1}`|
|10015|`{"attrs":[[201,7560],[202,1260],[203,756],[204,756]],"condition":150,"type":1}`|
|10016|`{"attrs":[[201,8400],[202,1400],[203,840],[204,840]],"condition":160,"type":1}`|
|10017|`{"attrs":[[201,9000],[202,1500],[203,900],[204,900]],"condition":170,"type":1}`|
|10018|`{"attrs":[[201,9600],[202,1600],[203,960],[204,960]],"condition":180,"type":1}`|
|10019|`{"attrs":[[201,10800],[202,1800],[203,1080],[204,1080]],"condition":190,"type":1}`|
|10020|`{"attrs":[[201,12000],[202,2000],[203,1200],[204,1200]],"condition":200,"type":1}`|
|10021|`{"attrs":[[201,13200],[202,2200],[203,1320],[204,1320]],"condition":210,"type":1}`|
|10022|`{"attrs":[[201,14400],[202,2400],[203,1440],[204,1440]],"condition":220,"type":1}`|
|10023|`{"attrs":[[201,15600],[202,2600],[203,1560],[204,1560]],"condition":230,"type":1}`|
|10024|`{"attrs":[[201,16800],[202,2800],[203,1680],[204,1680]],"condition":240,"type":1}`|
|10025|`{"attrs":[[201,18000],[202,3000],[203,1800],[204,1800]],"condition":250,"type":1}`|
|10026|`{"attrs":[[201,19500],[202,3200],[203,1950],[204,1950]],"condition":260,"type":1}`|
|10027|`{"attrs":[[201,21000],[202,3400],[203,2100],[204,2100]],"condition":270,"type":1}`|
|10028|`{"attrs":[[201,22500],[202,3600],[203,2250],[204,2250]],"condition":280,"type":1}`|
|10029|`{"attrs":[[201,24000],[202,3800],[203,2400],[204,2400]],"condition":290,"type":1}`|
|10030|`{"attrs":[[201,26000],[202,4000],[203,2600],[204,2600]],"condition":300,"type":1}`|
|10031|`{"attrs":[[201,28000],[202,4200],[203,2780],[204,2780]],"condition":310,"type":1}`|
|10032|`{"attrs":[[201,30000],[202,4400],[203,2960],[204,2960]],"condition":320,"type":1}`|
|10033|`{"attrs":[[201,32000],[202,4600],[203,3140],[204,3140]],"condition":330,"type":1}`|
|10034|`{"attrs":[[201,34000],[202,4800],[203,3320],[204,3320]],"condition":340,"type":1}`|
|10035|`{"attrs":[[201,36000],[202,5000],[203,3500],[204,3500]],"condition":350,"type":1}`|
|10036|`{"attrs":[[201,38200],[202,5200],[203,3700],[204,3700]],"condition":360,"type":1}`|
|10037|`{"attrs":[[201,40400],[202,5400],[203,3900],[204,3900]],"condition":370,"type":1}`|
|10038|`{"attrs":[[201,42600],[202,5600],[203,4100],[204,4100]],"condition":380,"type":1}`|
|10039|`{"attrs":[[201,44800],[202,5800],[203,4300],[204,4300]],"condition":390,"type":1}`|
|10040|`{"attrs":[[201,47000],[202,6000],[203,4500],[204,4500]],"condition":400,"type":1}`|
|10041|`{"attrs":[[201,49400],[202,6200],[203,4720],[204,4720]],"condition":410,"type":1}`|
|10042|`{"attrs":[[201,51800],[202,6400],[203,4940],[204,4940]],"condition":420,"type":1}`|
|10043|`{"attrs":[[201,54200],[202,6600],[203,5160],[204,5160]],"condition":430,"type":1}`|
|10044|`{"attrs":[[201,56600],[202,6800],[203,5380],[204,5380]],"condition":440,"type":1}`|
|10045|`{"attrs":[[201,59000],[202,7000],[203,5600],[204,5600]],"condition":450,"type":1}`|
|10046|`{"attrs":[[201,61600],[202,7200],[203,5840],[204,5840]],"condition":460,"type":1}`|
|10047|`{"attrs":[[201,64200],[202,7400],[203,6080],[204,6080]],"condition":470,"type":1}`|
|10048|`{"attrs":[[201,66800],[202,7600],[203,6320],[204,6320]],"condition":480,"type":1}`|
|10049|`{"attrs":[[201,69400],[202,7800],[203,6560],[204,6560]],"condition":490,"type":1}`|
|10050|`{"attrs":[[201,72000],[202,8000],[203,6800],[204,6800]],"condition":500,"type":1}`|
|20001|`{"attrs":[[201,240],[202,40],[203,24],[204,24]],"condition":1,"type":2}`|
|20002|`{"attrs":[[201,450],[202,75],[203,45],[204,45]],"condition":2,"type":2}`|
|20003|`{"attrs":[[201,1200],[202,200],[203,120],[204,120]],"condition":3,"type":2}`|
|20004|`{"attrs":[[201,2400],[202,400],[203,240],[204,240]],"condition":4,"type":2}`|
|20005|`{"attrs":[[201,4320],[202,720],[203,432],[204,432]],"condition":5,"type":2}`|
|20006|`{"attrs":[[201,5040],[202,840],[203,504],[204,504]],"condition":6,"type":2}`|
|20007|`{"attrs":[[201,7320],[202,1220],[203,732],[204,732]],"condition":7,"type":2}`|
|20008|`{"attrs":[[201,8520],[202,1420],[203,852],[204,852]],"condition":8,"type":2}`|
|20009|`{"attrs":[[201,9840],[202,1640],[203,984],[204,984]],"condition":9,"type":2}`|
|20010|`{"attrs":[[201,11040],[202,1840],[203,1104],[204,1104]],"condition":10,"type":2}`|
|20011|`{"attrs":[[201,13440],[202,2240],[203,1344],[204,1344]],"condition":11,"type":2}`|
|20012|`{"attrs":[[201,17040],[202,2840],[203,1704],[204,1704]],"condition":12,"type":2}`|
|20013|`{"attrs":[[201,21240],[202,3540],[203,2124],[204,2124]],"condition":13,"type":2}`|
|20014|`{"attrs":[[201,26040],[202,4340],[203,2604],[204,2604]],"condition":14,"type":2}`|
|20015|`{"attrs":[[201,31440],[202,5240],[203,3144],[204,3144]],"condition":15,"type":2}`|
|20016|`{"attrs":[[201,37440],[202,6240],[203,3744],[204,3744]],"condition":16,"type":2}`|
|20017|`{"attrs":[[201,44040],[202,7340],[203,4404],[204,4404]],"condition":17,"type":2}`|
|20018|`{"attrs":[[201,51240],[202,8540],[203,5124],[204,5124]],"condition":18,"type":2}`|
|20019|`{"attrs":[[201,59040],[202,9840],[203,5904],[204,5904]],"condition":19,"type":2}`|
|20020|`{"attrs":[[201,67440],[202,11240],[203,6744],[204,6744]],"condition":20,"type":2}`|
|30001|`{"attrs":[[201,210],[202,35],[203,21],[204,21]],"condition":2,"type":3}`|
|30002|`{"attrs":[[201,420],[202,70],[203,42],[204,42]],"condition":4,"type":3}`|
|30003|`{"attrs":[[201,600],[202,100],[203,60],[204,60]],"condition":6,"type":3}`|
|30004|`{"attrs":[[201,1320],[202,220],[203,132],[204,132]],"condition":8,"type":3}`|
|30005|`{"attrs":[[201,2400],[202,400],[203,240],[204,240]],"condition":10,"type":3}`|
|30006|`{"attrs":[[201,5040],[202,840],[203,504],[204,504]],"condition":12,"type":3}`|
|30007|`{"attrs":[[201,6900],[202,1150],[203,690],[204,690]],"condition":14,"type":3}`|
|30008|`{"attrs":[[201,9000],[202,1500],[203,900],[204,900]],"condition":16,"type":3}`|
|30009|`{"attrs":[[201,11400],[202,1900],[203,1140],[204,1140]],"condition":18,"type":3}`|
|30010|`{"attrs":[[201,15000],[202,2500],[203,1500],[204,1500]],"condition":20,"type":3}`|
|30011|`{"attrs":[[201,18600],[202,3100],[203,1860],[204,1860]],"condition":22,"type":3}`|
|30012|`{"attrs":[[201,22920],[202,3820],[203,2292],[204,2292]],"condition":24,"type":3}`|
|30013|`{"attrs":[[201,27600],[202,4600],[203,2760],[204,2760]],"condition":26,"type":3}`|
|30014|`{"attrs":[[201,33000],[202,5500],[203,3300],[204,3300]],"condition":28,"type":3}`|
|30015|`{"attrs":[[201,39300],[202,6550],[203,3930],[204,3930]],"condition":30,"type":3}`|
|30016|`{"attrs":[[201,45600],[202,7600],[203,4560],[204,4560]],"condition":32,"type":3}`|
|30017|`{"attrs":[[201,51900],[202,8650],[203,5190],[204,5190]],"condition":34,"type":3}`|
|30018|`{"attrs":[[201,58200],[202,14950],[203,11490],[204,11490]],"condition":36,"type":3}`|
|30019|`{"attrs":[[201,64500],[202,21250],[203,17790],[204,17790]],"condition":38,"type":3}`|
|30020|`{"attrs":[[201,70800],[202,27550],[203,24090],[204,24090]],"condition":40,"type":3}`|
|30021|`{"attrs":[[201,77100],[202,33850],[203,30390],[204,30390]],"condition":42,"type":3}`|
|30022|`{"attrs":[[201,83400],[202,40150],[203,36690],[204,36690]],"condition":44,"type":3}`|
|30023|`{"attrs":[[201,89700],[202,46450],[203,42990],[204,42990]],"condition":46,"type":3}`|
|30024|`{"attrs":[[201,96000],[202,52750],[203,49290],[204,49290]],"condition":48,"type":3}`|
|30025|`{"attrs":[[201,102300],[202,59050],[203,55590],[204,55590]],"condition":50,"type":3}`|
|30026|`{"attrs":[[201,108600],[202,65350],[203,61890],[204,61890]],"condition":52,"type":3}`|
|30027|`{"attrs":[[201,114900],[202,71650],[203,68190],[204,68190]],"condition":54,"type":3}`|
|30028|`{"attrs":[[201,121200],[202,77950],[203,74490],[204,74490]],"condition":56,"type":3}`|
|30029|`{"attrs":[[201,127500],[202,84250],[203,80790],[204,80790]],"condition":58,"type":3}`|
|30030|`{"attrs":[[201,133800],[202,90550],[203,87090],[204,87090]],"condition":60,"type":3}`|
|30031|`{"attrs":[[201,140100],[202,96850],[203,93390],[204,93390]],"condition":62,"type":3}`|
|30032|`{"attrs":[[201,146400],[202,103150],[203,99690],[204,99690]],"condition":64,"type":3}`|
|30033|`{"attrs":[[201,152700],[202,109450],[203,105990],[204,105990]],"condition":66,"type":3}`|
|30034|`{"attrs":[[201,159000],[202,115750],[203,112290],[204,112290]],"condition":68,"type":3}`|
|30035|`{"attrs":[[201,165300],[202,122050],[203,118590],[204,118590]],"condition":70,"type":3}`|
|30036|`{"attrs":[[201,171600],[202,128350],[203,124890],[204,124890]],"condition":72,"type":3}`|
|30037|`{"attrs":[[201,177900],[202,134650],[203,131190],[204,131190]],"condition":74,"type":3}`|
|30038|`{"attrs":[[201,184200],[202,140950],[203,137490],[204,137490]],"condition":76,"type":3}`|
|30039|`{"attrs":[[201,190500],[202,147250],[203,143790],[204,143790]],"condition":78,"type":3}`|
|30040|`{"attrs":[[201,196800],[202,153550],[203,150090],[204,150090]],"condition":80,"type":3}`|
|40001|`{"attrs":[[201,1800],[202,300],[203,180],[204,180]],"condition":10,"type":4}`|
|40002|`{"attrs":[[201,5400],[202,900],[203,540],[204,540]],"condition":20,"type":4}`|
|40003|`{"attrs":[[201,12000],[202,2000],[203,1200],[204,1200]],"condition":30,"type":4}`|
|40004|`{"attrs":[[201,21000],[202,3500],[203,2100],[204,2100]],"condition":40,"type":4}`|
|40005|`{"attrs":[[201,32400],[202,5400],[203,3240],[204,3240]],"condition":50,"type":4}`|
|40006|`{"attrs":[[201,48000],[202,8000],[203,4800],[204,4800]],"condition":60,"type":4}`|
|40007|`{"attrs":[[201,66000],[202,11000],[203,6600],[204,6600]],"condition":70,"type":4}`|
|40008|`{"attrs":[[201,86400],[202,14400],[203,8640],[204,8640]],"condition":80,"type":4}`|
|40009|`{"attrs":[[201,109200],[202,18200],[203,10920],[204,10920]],"condition":90,"type":4}`|
|40010|`{"attrs":[[201,134400],[202,22400],[203,13440],[204,13440]],"condition":100,"type":4}`|
|40011|`{"attrs":[[201,162000],[202,27000],[203,16200],[204,16200]],"condition":110,"type":4}`|
|40012|`{"attrs":[[201,192000],[202,32000],[203,19200],[204,19200]],"condition":120,"type":4}`|
|40013|`{"attrs":[[201,224400],[202,37400],[203,22440],[204,22440]],"condition":130,"type":4}`|

## Talent

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|22|本表行键；与其他表同值不自动代表同一对象。|
|talent_desc|number|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|desc_name|number|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|unlock|number|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"talent_desc":410165,"unlock":410188}`|
|2|`{"talent_desc":410166,"unlock":410188}`|
|3|`{"talent_desc":410167,"unlock":410188}`|
|4|`{"talent_desc":410168,"unlock":410188}`|
|5|`{"talent_desc":410169,"unlock":410187}`|
|6|`{"talent_desc":410170,"unlock":410187}`|
|7|`{"talent_desc":410171,"unlock":410187}`|
|8|`{"talent_desc":410172,"unlock":410187}`|
|9|`{"talent_desc":410173,"unlock":410187}`|
|10|`{"talent_desc":410174,"unlock":410187}`|
|11|`{"talent_desc":410175,"unlock":410187}`|
|12|`{"talent_desc":410176,"unlock":410187}`|
|13|`{"talent_desc":410177,"unlock":410187}`|
|14|`{"talent_desc":410178,"unlock":410187}`|
|15|`{"talent_desc":410179,"unlock":410187}`|
|16|`{"talent_desc":410180,"unlock":410188}`|
|17|`{"talent_desc":410181,"unlock":410188}`|
|18|`{"talent_desc":410182,"unlock":410188}`|
|19|`{"talent_desc":410183,"unlock":410188}`|
|20|`{"talent_desc":410184,"unlock":410187}`|
|21|`{"talent_desc":410185,"unlock":410187}`|
|22|`{"talent_desc":410186,"unlock":410187}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|strength_master_per|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|strength_red_lv|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|strength_rate|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|one_key_refine|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|single_forge_red|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|one_key_dev_unlock|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|refine_master_per|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|refine_role_lv|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|inject_open|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|awaken_open|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cell_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"strength_red_lv":56,"strength_rate":2,"one_key_dev_unlock":918220900005,"refine_role_lv":40,"inject_open":5,"awaken_open":5,"cell_count":6}`|

## Level

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|cost|array|2000|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|tid|number|2000|本表行键；与其他表同值不自动代表同一对象。|
|equip_type|number|2000|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|level_exp|number|2000|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部2000行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10001|`{"cost":[[201500,900]],"equip_type":1,"level_exp":0}`|
|10002|`{"cost":[[201500,960]],"equip_type":1,"level_exp":0}`|
|10003|`{"cost":[[201500,1020]],"equip_type":1,"level_exp":0}`|

## ResExchange

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|value|number|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tip_params|array|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|9|本表行键；与其他表同值不自动代表同一对象。|
|forge_lv|number|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|condition|number|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|desc|number|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|155002|`{"value":1,"forge_lv":2,"condition":153379200003}`|
|156002|`{"value":1,"forge_lv":2,"condition":298504256002}`|
|157002|`{"value":2,"forge_lv":3,"condition":298504257002}`|
|158002|`{"value":2,"forge_lv":3,"condition":298504258002}`|
|159002|`{"value":4,"forge_lv":4,"condition":298504259002}`|
|160002|`{"value":4,"forge_lv":4,"condition":298504260002}`|
|161002|`{"value":16,"forge_lv":5,"condition":298504261002}`|
|162002|`{"value":16,"forge_lv":5,"condition":298504262002}`|
|163002|`{"value":16,"forge_lv":5,"condition":298504263002}`|

## Type

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|def_icon|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"type":1}`|
|2|`{"type":2}`|
|3|`{"type":3}`|
|4|`{"type":4}`|

## Equip

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|unlock|number|80|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|inscription_limit_lv|number|80|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|unlock_desc|number|80|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|80|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|exp|number|80|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|quality|number|80|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|talent_attrs|array|80|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|talent_unlock_tip|number|80|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|talent_desc|number|80|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cost|array|80|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|lv_max|number|80|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|talent_desc_args|array|80|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|per_level_attrs|array|80|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|80|本表行键；与其他表同值不自动代表同一对象。|
|refine_limit_lv|number|80|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|quality_up_type|number|80|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attrs|array|80|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|unlock_args|array|80|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10103|`{"unlock":955132601002,"inscription_limit_lv":0,"unlock_desc":410158,"type":1,"exp":100,"quality":1,"talent_attrs":[],"talent_unlock_tip":0,"talent_desc":0,"cost":[[157002,1500],[201500,1200]],"lv_max":10,"talent_desc_args":[],"per_level_attrs":[[2,90]],"refine_limit_lv":2,"quality_up_type":0,"attrs":[[2,3000]],"unlock_args":[15]}`|
|10203|`{"unlock":926610810203,"inscription_limit_lv":0,"unlock_desc":410158,"type":1,"exp":100,"quality":2,"talent_attrs":[],"talent_unlock_tip":0,"talent_desc":0,"cost":[[157002,4500],[201500,2400]],"lv_max":20,"talent_desc_args":[],"per_level_attrs":[[2,140]],"refine_limit_lv":6,"quality_up_type":0,"attrs":[[2,4500]],"unlock_args":[26]}`|
|10303|`{"unlock":186948600102,"inscription_limit_lv":10,"unlock_desc":410158,"type":1,"exp":500,"quality":3,"talent_attrs":[],"talent_unlock_tip":0,"talent_desc":0,"cost":[[157002,30000],[201500,6000]],"lv_max":40,"talent_desc_args":[],"per_level_attrs":[[2,190]],"refine_limit_lv":8,"quality_up_type":0,"attrs":[[2,8000]],"unlock_args":[30]}`|
|10403|`{"unlock":918220900002,"inscription_limit_lv":20,"unlock_desc":410158,"type":1,"exp":500,"quality":4,"talent_attrs":[],"talent_unlock_tip":0,"talent_desc":0,"cost":[[157002,90000],[201500,18000]],"lv_max":60,"talent_desc_args":[],"per_level_attrs":[[2,220]],"refine_limit_lv":12,"quality_up_type":0,"attrs":[[2,14500]],"unlock_args":[40]}`|
|10503|`{"unlock":930688600010,"inscription_limit_lv":30,"unlock_desc":410158,"type":1,"exp":2000,"quality":5,"talent_attrs":[],"talent_unlock_tip":0,"talent_desc":0,"cost":[[157002,150000],[201500,36000]],"lv_max":80,"talent_desc_args":[],"per_level_attrs":[[2,250]],"refine_limit_lv":14,"quality_up_type":0,"attrs":[[2,23500]],"unlock_args":[50]}`|
|10603|`{"unlock":918220900005,"inscription_limit_lv":30,"unlock_desc":410158,"type":1,"exp":2000,"quality":6,"talent_attrs":[],"talent_unlock_tip":0,"talent_desc":0,"cost":[[157002,288000],[201500,72000]],"lv_max":100,"talent_desc_args":[],"per_level_attrs":[[2,260]],"refine_limit_lv":16,"quality_up_type":0,"attrs":[[2,25000]],"unlock_args":[55]}`|
|10703|`{"unlock":926610810703,"inscription_limit_lv":30,"unlock_desc":410158,"type":1,"exp":5000,"quality":7,"talent_attrs":[],"talent_unlock_tip":0,"talent_desc":0,"cost":[[157002,396000],[201500,120000]],"lv_max":120,"talent_desc_args":[],"per_level_attrs":[[2,290]],"refine_limit_lv":18,"quality_up_type":1,"attrs":[[2,29500]],"unlock_args":[60]}`|
|10803|`{"unlock":918220900009,"inscription_limit_lv":40,"unlock_desc":410158,"type":1,"exp":5000,"quality":8,"talent_attrs":[[202,400]],"talent_unlock_tip":410150,"talent_desc":16,"cost":[[23002,1],[157002,900000],[201500,168000]],"lv_max":140,"talent_desc_args":[1,5],"per_level_attrs":[[2,330]],"refine_limit_lv":20,"quality_up_type":1,"attrs":[[2,31500]],"unlock_args":[65]}`|
|10903|`{"unlock":89404700004,"inscription_limit_lv":40,"unlock_desc":410158,"type":1,"exp":5000,"quality":9,"talent_attrs":[[202,1200]],"talent_unlock_tip":410150,"talent_desc":16,"cost":[[23002,2],[157002,1500000],[201500,216000]],"lv_max":160,"talent_desc_args":[2,6],"per_level_attrs":[[2,360]],"refine_limit_lv":22,"quality_up_type":1,"attrs":[[2,34000]],"unlock_args":[70]}`|
|11003|`{"unlock":582540600004,"inscription_limit_lv":50,"unlock_desc":410158,"type":1,"exp":5000,"quality":10,"talent_attrs":[[202,2000]],"talent_unlock_tip":410150,"talent_desc":16,"cost":[[23002,3],[157002,2400000],[201500,312000]],"lv_max":180,"talent_desc_args":[2,6],"per_level_attrs":[[2,390]],"refine_limit_lv":24,"quality_up_type":1,"attrs":[[2,38000]],"unlock_args":[80]}`|
|11103|`{"unlock":955132601198,"inscription_limit_lv":60,"unlock_desc":410158,"type":1,"exp":5000,"quality":11,"talent_attrs":[[202,2800]],"talent_unlock_tip":410150,"talent_desc":16,"cost":[[23002,8],[157002,4800000],[201500,408000]],"lv_max":200,"talent_desc_args":[3,7],"per_level_attrs":[[2,410]],"refine_limit_lv":26,"quality_up_type":1,"attrs":[[2,42000]],"unlock_args":[90]}`|
|11203|`{"unlock":926610811203,"inscription_limit_lv":70,"unlock_desc":410158,"type":1,"exp":5000,"quality":12,"talent_attrs":[[202,4800]],"talent_unlock_tip":410150,"talent_desc":16,"cost":[[23002,8],[157002,6000000],[201500,600000]],"lv_max":220,"talent_desc_args":[4,8],"per_level_attrs":[[2,450]],"refine_limit_lv":28,"quality_up_type":1,"attrs":[[2,51000]],"unlock_args":[100]}`|
|11303|`{"unlock":926610811303,"inscription_limit_lv":70,"unlock_desc":410158,"type":1,"exp":5000,"quality":13,"talent_attrs":[[202,7200]],"talent_unlock_tip":410150,"talent_desc":16,"cost":[[23002,8],[157002,7200000],[201500,792000]],"lv_max":230,"talent_desc_args":[5,9],"per_level_attrs":[[2,530]],"refine_limit_lv":30,"quality_up_type":1,"attrs":[[2,62500]],"unlock_args":[110]}`|
|11403|`{"unlock":926610811403,"inscription_limit_lv":70,"unlock_desc":410158,"type":1,"exp":5000,"quality":14,"talent_attrs":[[202,10200]],"talent_unlock_tip":410150,"talent_desc":16,"cost":[[23002,10],[157002,9000000],[201500,1080000]],"lv_max":300,"talent_desc_args":[6,10],"per_level_attrs":[[2,600]],"refine_limit_lv":48,"quality_up_type":1,"attrs":[[2,79000]],"unlock_args":[120]}`|
|11503|`{"unlock":926610811503,"inscription_limit_lv":80,"unlock_desc":410158,"type":1,"exp":5000,"quality":15,"talent_attrs":[[202,13800]],"talent_unlock_tip":410150,"talent_desc":16,"cost":[[23002,10],[157002,9000000],[201500,1080000]],"lv_max":330,"talent_desc_args":[7,11],"per_level_attrs":[[2,680]],"refine_limit_lv":52,"quality_up_type":1,"attrs":[[2,100500]],"unlock_args":[130]}`|
|11603|`{"unlock":926610811603,"inscription_limit_lv":90,"unlock_desc":410158,"type":1,"exp":5000,"quality":16,"talent_attrs":[[202,17800]],"talent_unlock_tip":410150,"talent_desc":16,"cost":[[23002,10],[157002,9000000],[201500,1080000]],"lv_max":360,"talent_desc_args":[8,12],"per_level_attrs":[[2,760]],"refine_limit_lv":56,"quality_up_type":1,"attrs":[[2,127000]],"unlock_args":[140]}`|
|11703|`{"unlock":926610811703,"inscription_limit_lv":100,"unlock_desc":410158,"type":1,"exp":5000,"quality":17,"talent_attrs":[[202,22400]],"talent_unlock_tip":410150,"talent_desc":16,"cost":[[23002,10],[157002,9000000],[201500,1080000]],"lv_max":390,"talent_desc_args":[9,13],"per_level_attrs":[[2,850]],"refine_limit_lv":64,"quality_up_type":1,"attrs":[[2,158500]],"unlock_args":[150]}`|
|11803|`{"unlock":926610811803,"inscription_limit_lv":110,"unlock_desc":410158,"type":1,"exp":5000,"quality":18,"talent_attrs":[[202,27600]],"talent_unlock_tip":410150,"talent_desc":16,"cost":[[23002,12],[157002,11400000],[201500,1200000]],"lv_max":420,"talent_desc_args":[10,14],"per_level_attrs":[[2,940]],"refine_limit_lv":68,"quality_up_type":1,"attrs":[[2,195000]],"unlock_args":[160]}`|
|11903|`{"unlock":926610811903,"inscription_limit_lv":120,"unlock_desc":410158,"type":1,"exp":5000,"quality":19,"talent_attrs":[[202,33400]],"talent_unlock_tip":410150,"talent_desc":16,"cost":[[23002,12],[157002,11400000],[201500,1200000]],"lv_max":460,"talent_desc_args":[11,15],"per_level_attrs":[[2,1040]],"refine_limit_lv":72,"quality_up_type":1,"attrs":[[2,236500]],"unlock_args":[170]}`|
|12003|`{"unlock":926610812003,"inscription_limit_lv":130,"unlock_desc":410158,"type":1,"exp":5000,"quality":20,"talent_attrs":[[202,39800]],"talent_unlock_tip":410150,"talent_desc":16,"cost":[[23002,12],[157002,11400000],[201500,1200000]],"lv_max":500,"talent_desc_args":[12,16],"per_level_attrs":[[2,1140]],"refine_limit_lv":80,"quality_up_type":2,"attrs":[[2,283000]],"unlock_args":[180]}`|
|20103|`{"unlock":955132601002,"inscription_limit_lv":0,"unlock_desc":410158,"type":2,"exp":100,"quality":1,"talent_attrs":[],"talent_unlock_tip":0,"talent_desc":0,"cost":[[157002,1500],[201500,800]],"lv_max":10,"talent_desc_args":[],"per_level_attrs":[[1,540]],"refine_limit_lv":2,"quality_up_type":0,"attrs":[[1,30000]],"unlock_args":[15]}`|
|20203|`{"unlock":926610810203,"inscription_limit_lv":0,"unlock_desc":410158,"type":2,"exp":100,"quality":2,"talent_attrs":[],"talent_unlock_tip":0,"talent_desc":0,"cost":[[157002,3000],[201500,1600]],"lv_max":20,"talent_desc_args":[],"per_level_attrs":[[1,840]],"refine_limit_lv":6,"quality_up_type":0,"attrs":[[1,28000]],"unlock_args":[26]}`|
|20303|`{"unlock":186948600102,"inscription_limit_lv":10,"unlock_desc":410158,"type":2,"exp":500,"quality":3,"talent_attrs":[],"talent_unlock_tip":0,"talent_desc":0,"cost":[[157002,20000],[201500,4000]],"lv_max":40,"talent_desc_args":[],"per_level_attrs":[[1,1100]],"refine_limit_lv":8,"quality_up_type":0,"attrs":[[1,52000]],"unlock_args":[30]}`|
|20403|`{"unlock":918220900002,"inscription_limit_lv":20,"unlock_desc":410158,"type":2,"exp":500,"quality":4,"talent_attrs":[],"talent_unlock_tip":0,"talent_desc":0,"cost":[[157002,60000],[201500,12000]],"lv_max":60,"talent_desc_args":[],"per_level_attrs":[[1,1300]],"refine_limit_lv":12,"quality_up_type":0,"attrs":[[1,96000]],"unlock_args":[40]}`|
|20503|`{"unlock":930688600010,"inscription_limit_lv":30,"unlock_desc":410158,"type":2,"exp":2000,"quality":5,"talent_attrs":[],"talent_unlock_tip":0,"talent_desc":0,"cost":[[157002,100000],[201500,24000]],"lv_max":80,"talent_desc_args":[],"per_level_attrs":[[1,1460]],"refine_limit_lv":14,"quality_up_type":0,"attrs":[[1,143000]],"unlock_args":[50]}`|
|20603|`{"unlock":918220900005,"inscription_limit_lv":30,"unlock_desc":410158,"type":2,"exp":2000,"quality":6,"talent_attrs":[],"talent_unlock_tip":0,"talent_desc":0,"cost":[[157002,192000],[201500,48000]],"lv_max":100,"talent_desc_args":[],"per_level_attrs":[[1,1560]],"refine_limit_lv":16,"quality_up_type":0,"attrs":[[1,150000]],"unlock_args":[55]}`|
|20703|`{"unlock":926610810703,"inscription_limit_lv":30,"unlock_desc":410158,"type":2,"exp":5000,"quality":7,"talent_attrs":[],"talent_unlock_tip":0,"talent_desc":0,"cost":[[157002,264000],[201500,80000]],"lv_max":120,"talent_desc_args":[],"per_level_attrs":[[1,1710]],"refine_limit_lv":18,"quality_up_type":1,"attrs":[[1,180500]],"unlock_args":[60]}`|
|20803|`{"unlock":918220900009,"inscription_limit_lv":40,"unlock_desc":410158,"type":2,"exp":5000,"quality":8,"talent_attrs":[[201,2400]],"talent_unlock_tip":410150,"talent_desc":18,"cost":[[23002,1],[157002,600000],[201500,112000]],"lv_max":140,"talent_desc_args":[1,5],"per_level_attrs":[[1,1950]],"refine_limit_lv":20,"quality_up_type":1,"attrs":[[1,189000]],"unlock_args":[65]}`|
|20903|`{"unlock":89404700004,"inscription_limit_lv":40,"unlock_desc":410158,"type":2,"exp":5000,"quality":9,"talent_attrs":[[201,7200]],"talent_unlock_tip":410150,"talent_desc":18,"cost":[[23002,1],[157002,1000000],[201500,144000]],"lv_max":160,"talent_desc_args":[2,6],"per_level_attrs":[[1,2150]],"refine_limit_lv":22,"quality_up_type":1,"attrs":[[1,204000]],"unlock_args":[70]}`|
|21003|`{"unlock":582540600004,"inscription_limit_lv":50,"unlock_desc":410158,"type":2,"exp":5000,"quality":10,"talent_attrs":[[201,12000]],"talent_unlock_tip":410150,"talent_desc":18,"cost":[[23002,2],[157002,1600000],[201500,208000]],"lv_max":180,"talent_desc_args":[2,6],"per_level_attrs":[[1,2310]],"refine_limit_lv":24,"quality_up_type":1,"attrs":[[1,224000]],"unlock_args":[80]}`|
|21103|`{"unlock":955132601198,"inscription_limit_lv":60,"unlock_desc":410158,"type":2,"exp":5000,"quality":11,"talent_attrs":[[201,16800]],"talent_unlock_tip":410150,"talent_desc":18,"cost":[[23002,6],[157002,3200000],[201500,272000]],"lv_max":200,"talent_desc_args":[3,7],"per_level_attrs":[[1,2430]],"refine_limit_lv":26,"quality_up_type":1,"attrs":[[1,255000]],"unlock_args":[90]}`|
|21203|`{"unlock":926610811203,"inscription_limit_lv":70,"unlock_desc":410158,"type":2,"exp":5000,"quality":12,"talent_attrs":[[201,28800]],"talent_unlock_tip":410150,"talent_desc":18,"cost":[[23002,6],[157002,4000000],[201500,400000]],"lv_max":220,"talent_desc_args":[4,8],"per_level_attrs":[[1,2700]],"refine_limit_lv":28,"quality_up_type":1,"attrs":[[1,307500]],"unlock_args":[100]}`|
|21303|`{"unlock":926610811303,"inscription_limit_lv":70,"unlock_desc":410158,"type":2,"exp":5000,"quality":13,"talent_attrs":[[201,43200]],"talent_unlock_tip":410150,"talent_desc":18,"cost":[[23002,6],[157002,4800000],[201500,528000]],"lv_max":230,"talent_desc_args":[5,9],"per_level_attrs":[[1,3150]],"refine_limit_lv":30,"quality_up_type":1,"attrs":[[1,375000]],"unlock_args":[110]}`|
|21403|`{"unlock":926610811403,"inscription_limit_lv":70,"unlock_desc":410158,"type":2,"exp":5000,"quality":14,"talent_attrs":[[201,61200]],"talent_unlock_tip":410150,"talent_desc":18,"cost":[[23002,8],[157002,6000000],[201500,720000]],"lv_max":300,"talent_desc_args":[6,10],"per_level_attrs":[[1,3600]],"refine_limit_lv":48,"quality_up_type":1,"attrs":[[1,472500]],"unlock_args":[120]}`|
|21503|`{"unlock":926610811503,"inscription_limit_lv":80,"unlock_desc":410158,"type":2,"exp":5000,"quality":15,"talent_attrs":[[201,82800]],"talent_unlock_tip":410150,"talent_desc":18,"cost":[[23002,8],[157002,7600000],[201500,1000000]],"lv_max":330,"talent_desc_args":[7,11],"per_level_attrs":[[1,4140]],"refine_limit_lv":52,"quality_up_type":1,"attrs":[[1,615000]],"unlock_args":[130]}`|
|21603|`{"unlock":926610811603,"inscription_limit_lv":90,"unlock_desc":410158,"type":2,"exp":5000,"quality":16,"talent_attrs":[[201,108000]],"talent_unlock_tip":410150,"talent_desc":18,"cost":[[23002,8],[157002,7600000],[201500,1000000]],"lv_max":360,"talent_desc_args":[8,12],"per_level_attrs":[[1,4680]],"refine_limit_lv":56,"quality_up_type":1,"attrs":[[1,817500]],"unlock_args":[140]}`|
|21703|`{"unlock":926610811703,"inscription_limit_lv":100,"unlock_desc":410158,"type":2,"exp":5000,"quality":17,"talent_attrs":[[201,136800]],"talent_unlock_tip":410150,"talent_desc":18,"cost":[[23002,8],[157002,7600000],[201500,1000000]],"lv_max":390,"talent_desc_args":[9,13],"per_level_attrs":[[1,5310]],"refine_limit_lv":64,"quality_up_type":1,"attrs":[[1,1095000]],"unlock_args":[150]}`|
|21803|`{"unlock":926610811803,"inscription_limit_lv":110,"unlock_desc":410158,"type":2,"exp":5000,"quality":18,"talent_attrs":[[201,169200]],"talent_unlock_tip":410150,"talent_desc":18,"cost":[[23002,10],[157002,9600000],[201500,1320000]],"lv_max":420,"talent_desc_args":[10,14],"per_level_attrs":[[1,5940]],"refine_limit_lv":68,"quality_up_type":1,"attrs":[[1,1462500]],"unlock_args":[160]}`|
|21903|`{"unlock":926610811903,"inscription_limit_lv":120,"unlock_desc":410158,"type":2,"exp":5000,"quality":19,"talent_attrs":[[201,205200]],"talent_unlock_tip":410150,"talent_desc":18,"cost":[[23002,10],[157002,9600000],[201500,1320000]],"lv_max":460,"talent_desc_args":[11,15],"per_level_attrs":[[1,6700]],"refine_limit_lv":72,"quality_up_type":1,"attrs":[[1,1935000]],"unlock_args":[170]}`|
|22003|`{"unlock":926610812003,"inscription_limit_lv":130,"unlock_desc":410158,"type":2,"exp":5000,"quality":20,"talent_attrs":[[201,244800]],"talent_unlock_tip":410150,"talent_desc":18,"cost":[[23002,10],[157002,9600000],[201500,1320000]],"lv_max":500,"talent_desc_args":[12,16],"per_level_attrs":[[1,7460]],"refine_limit_lv":80,"quality_up_type":2,"attrs":[[1,2527500]],"unlock_args":[180]}`|
|30103|`{"unlock":955132601002,"inscription_limit_lv":0,"unlock_desc":410158,"type":3,"exp":100,"quality":1,"talent_attrs":[],"talent_unlock_tip":0,"talent_desc":0,"cost":[[157002,1500],[201500,600]],"lv_max":10,"talent_desc_args":[],"per_level_attrs":[[24,60]],"refine_limit_lv":2,"quality_up_type":0,"attrs":[[24,2000]],"unlock_args":[15]}`|
|30203|`{"unlock":926610810203,"inscription_limit_lv":0,"unlock_desc":410158,"type":3,"exp":100,"quality":2,"talent_attrs":[],"talent_unlock_tip":0,"talent_desc":0,"cost":[[157002,2250],[201500,1200]],"lv_max":20,"talent_desc_args":[],"per_level_attrs":[[24,90]],"refine_limit_lv":6,"quality_up_type":0,"attrs":[[24,3000]],"unlock_args":[26]}`|
|30303|`{"unlock":186948600102,"inscription_limit_lv":10,"unlock_desc":410158,"type":3,"exp":500,"quality":3,"talent_attrs":[],"talent_unlock_tip":0,"talent_desc":0,"cost":[[157002,15000],[201500,3000]],"lv_max":40,"talent_desc_args":[],"per_level_attrs":[[24,110]],"refine_limit_lv":8,"quality_up_type":0,"attrs":[[24,5000]],"unlock_args":[30]}`|
|30403|`{"unlock":918220900002,"inscription_limit_lv":20,"unlock_desc":410158,"type":3,"exp":500,"quality":4,"talent_attrs":[],"talent_unlock_tip":0,"talent_desc":0,"cost":[[157002,45000],[201500,9000]],"lv_max":60,"talent_desc_args":[],"per_level_attrs":[[24,150]],"refine_limit_lv":12,"quality_up_type":0,"attrs":[[24,9000]],"unlock_args":[40]}`|
|30503|`{"unlock":930688600010,"inscription_limit_lv":30,"unlock_desc":410158,"type":3,"exp":2000,"quality":5,"talent_attrs":[],"talent_unlock_tip":0,"talent_desc":0,"cost":[[157002,75000],[201500,18000]],"lv_max":80,"talent_desc_args":[],"per_level_attrs":[[24,160]],"refine_limit_lv":14,"quality_up_type":0,"attrs":[[24,14000]],"unlock_args":[50]}`|
|30603|`{"unlock":918220900005,"inscription_limit_lv":30,"unlock_desc":410158,"type":3,"exp":2000,"quality":6,"talent_attrs":[],"talent_unlock_tip":0,"talent_desc":0,"cost":[[157002,144000],[201500,36000]],"lv_max":100,"talent_desc_args":[],"per_level_attrs":[[24,160]],"refine_limit_lv":16,"quality_up_type":0,"attrs":[[24,15000]],"unlock_args":[55]}`|
|30703|`{"unlock":926610810703,"inscription_limit_lv":30,"unlock_desc":410158,"type":3,"exp":5000,"quality":7,"talent_attrs":[],"talent_unlock_tip":0,"talent_desc":0,"cost":[[157002,198000],[201500,60000]],"lv_max":120,"talent_desc_args":[],"per_level_attrs":[[24,180]],"refine_limit_lv":18,"quality_up_type":1,"attrs":[[24,18000]],"unlock_args":[60]}`|
|30803|`{"unlock":918220900009,"inscription_limit_lv":40,"unlock_desc":410158,"type":3,"exp":5000,"quality":8,"talent_attrs":[[203,240]],"talent_unlock_tip":410150,"talent_desc":17,"cost":[[23002,1],[157002,450000],[201500,84000]],"lv_max":140,"talent_desc_args":[1,5],"per_level_attrs":[[24,210]],"refine_limit_lv":20,"quality_up_type":1,"attrs":[[24,19000]],"unlock_args":[65]}`|
|30903|`{"unlock":89404700004,"inscription_limit_lv":40,"unlock_desc":410158,"type":3,"exp":5000,"quality":9,"talent_attrs":[[203,720]],"talent_unlock_tip":410150,"talent_desc":17,"cost":[[23002,1],[157002,750000],[201500,108000]],"lv_max":160,"talent_desc_args":[2,6],"per_level_attrs":[[24,230]],"refine_limit_lv":22,"quality_up_type":1,"attrs":[[24,20500]],"unlock_args":[70]}`|
|31003|`{"unlock":582540600004,"inscription_limit_lv":50,"unlock_desc":410158,"type":3,"exp":5000,"quality":10,"talent_attrs":[[203,1200]],"talent_unlock_tip":410150,"talent_desc":17,"cost":[[23002,1],[157002,1200000],[201500,156000]],"lv_max":180,"talent_desc_args":[2,6],"per_level_attrs":[[24,250]],"refine_limit_lv":24,"quality_up_type":1,"attrs":[[24,22500]],"unlock_args":[80]}`|
|31103|`{"unlock":955132601198,"inscription_limit_lv":60,"unlock_desc":410158,"type":3,"exp":5000,"quality":11,"talent_attrs":[[203,1680]],"talent_unlock_tip":410150,"talent_desc":17,"cost":[[23002,4],[157002,2400000],[201500,204000]],"lv_max":200,"talent_desc_args":[3,7],"per_level_attrs":[[24,260]],"refine_limit_lv":26,"quality_up_type":1,"attrs":[[24,25500]],"unlock_args":[90]}`|
|31203|`{"unlock":926610811203,"inscription_limit_lv":70,"unlock_desc":410158,"type":3,"exp":5000,"quality":12,"talent_attrs":[[203,2880]],"talent_unlock_tip":410150,"talent_desc":17,"cost":[[23002,4],[157002,3000000],[201500,300000]],"lv_max":220,"talent_desc_args":[4,8],"per_level_attrs":[[24,270]],"refine_limit_lv":28,"quality_up_type":1,"attrs":[[24,31000]],"unlock_args":[100]}`|
|31303|`{"unlock":926610811303,"inscription_limit_lv":70,"unlock_desc":410158,"type":3,"exp":5000,"quality":13,"talent_attrs":[[203,4320]],"talent_unlock_tip":410150,"talent_desc":17,"cost":[[23002,4],[157002,3600000],[201500,396000]],"lv_max":230,"talent_desc_args":[5,9],"per_level_attrs":[[24,320]],"refine_limit_lv":30,"quality_up_type":1,"attrs":[[24,37500]],"unlock_args":[110]}`|
|31403|`{"unlock":926610811403,"inscription_limit_lv":70,"unlock_desc":410158,"type":3,"exp":5000,"quality":14,"talent_attrs":[[203,6120]],"talent_unlock_tip":410150,"talent_desc":17,"cost":[[23002,6],[157002,4500000],[201500,540000]],"lv_max":300,"talent_desc_args":[6,10],"per_level_attrs":[[24,360]],"refine_limit_lv":48,"quality_up_type":1,"attrs":[[24,47500]],"unlock_args":[120]}`|
|31503|`{"unlock":926610811503,"inscription_limit_lv":80,"unlock_desc":410158,"type":3,"exp":5000,"quality":15,"talent_attrs":[[203,8280]],"talent_unlock_tip":410150,"talent_desc":17,"cost":[[23002,6],[157002,5700000],[201500,720000]],"lv_max":330,"talent_desc_args":[7,11],"per_level_attrs":[[24,400]],"refine_limit_lv":52,"quality_up_type":1,"attrs":[[24,61500]],"unlock_args":[130]}`|
|31603|`{"unlock":926610811603,"inscription_limit_lv":90,"unlock_desc":410158,"type":3,"exp":5000,"quality":16,"talent_attrs":[[203,10800]],"talent_unlock_tip":410150,"talent_desc":17,"cost":[[23002,6],[157002,5700000],[201500,720000]],"lv_max":360,"talent_desc_args":[8,12],"per_level_attrs":[[24,450]],"refine_limit_lv":56,"quality_up_type":1,"attrs":[[24,80000]],"unlock_args":[140]}`|
|31703|`{"unlock":926610811703,"inscription_limit_lv":100,"unlock_desc":410158,"type":3,"exp":5000,"quality":17,"talent_attrs":[[203,13680]],"talent_unlock_tip":410150,"talent_desc":17,"cost":[[23002,6],[157002,5700000],[201500,720000]],"lv_max":390,"talent_desc_args":[9,13],"per_level_attrs":[[24,500]],"refine_limit_lv":64,"quality_up_type":1,"attrs":[[24,103500]],"unlock_args":[150]}`|
|31803|`{"unlock":926610811803,"inscription_limit_lv":110,"unlock_desc":410158,"type":3,"exp":5000,"quality":18,"talent_attrs":[[203,16920]],"talent_unlock_tip":410150,"talent_desc":17,"cost":[[23002,8],[157002,7200000],[201500,940000]],"lv_max":420,"talent_desc_args":[10,14],"per_level_attrs":[[24,550]],"refine_limit_lv":68,"quality_up_type":1,"attrs":[[24,132500]],"unlock_args":[160]}`|
|31903|`{"unlock":926610811903,"inscription_limit_lv":120,"unlock_desc":410158,"type":3,"exp":5000,"quality":19,"talent_attrs":[[203,20520]],"talent_unlock_tip":410150,"talent_desc":17,"cost":[[23002,8],[157002,7200000],[201500,940000]],"lv_max":460,"talent_desc_args":[11,15],"per_level_attrs":[[24,610]],"refine_limit_lv":72,"quality_up_type":1,"attrs":[[24,167500]],"unlock_args":[170]}`|
|32003|`{"unlock":926610812003,"inscription_limit_lv":130,"unlock_desc":410158,"type":3,"exp":5000,"quality":20,"talent_attrs":[[203,24480]],"talent_unlock_tip":410150,"talent_desc":17,"cost":[[23002,8],[157002,7200000],[201500,940000]],"lv_max":500,"talent_desc_args":[12,16],"per_level_attrs":[[24,670]],"refine_limit_lv":80,"quality_up_type":2,"attrs":[[24,209500]],"unlock_args":[180]}`|
|40103|`{"unlock":955132601002,"inscription_limit_lv":0,"unlock_desc":410158,"type":4,"exp":100,"quality":1,"talent_attrs":[],"talent_unlock_tip":0,"talent_desc":0,"cost":[[157002,1500],[201500,600]],"lv_max":10,"talent_desc_args":[],"per_level_attrs":[[25,60]],"refine_limit_lv":2,"quality_up_type":0,"attrs":[[25,2000]],"unlock_args":[15]}`|
|40203|`{"unlock":926610810203,"inscription_limit_lv":0,"unlock_desc":410158,"type":4,"exp":100,"quality":2,"talent_attrs":[],"talent_unlock_tip":0,"talent_desc":0,"cost":[[157002,2250],[201500,1200]],"lv_max":20,"talent_desc_args":[],"per_level_attrs":[[25,90]],"refine_limit_lv":6,"quality_up_type":0,"attrs":[[25,3000]],"unlock_args":[26]}`|
|40303|`{"unlock":186948600102,"inscription_limit_lv":10,"unlock_desc":410158,"type":4,"exp":500,"quality":3,"talent_attrs":[],"talent_unlock_tip":0,"talent_desc":0,"cost":[[157002,15000],[201500,3000]],"lv_max":40,"talent_desc_args":[],"per_level_attrs":[[25,110]],"refine_limit_lv":8,"quality_up_type":0,"attrs":[[25,5000]],"unlock_args":[30]}`|
|40403|`{"unlock":918220900002,"inscription_limit_lv":20,"unlock_desc":410158,"type":4,"exp":500,"quality":4,"talent_attrs":[],"talent_unlock_tip":0,"talent_desc":0,"cost":[[157002,45000],[201500,9000]],"lv_max":60,"talent_desc_args":[],"per_level_attrs":[[25,150]],"refine_limit_lv":12,"quality_up_type":0,"attrs":[[25,9000]],"unlock_args":[40]}`|
|40503|`{"unlock":930688600010,"inscription_limit_lv":30,"unlock_desc":410158,"type":4,"exp":2000,"quality":5,"talent_attrs":[],"talent_unlock_tip":0,"talent_desc":0,"cost":[[157002,75000],[201500,18000]],"lv_max":80,"talent_desc_args":[],"per_level_attrs":[[25,160]],"refine_limit_lv":14,"quality_up_type":0,"attrs":[[25,14000]],"unlock_args":[50]}`|
|40603|`{"unlock":918220900005,"inscription_limit_lv":30,"unlock_desc":410158,"type":4,"exp":2000,"quality":6,"talent_attrs":[],"talent_unlock_tip":0,"talent_desc":0,"cost":[[157002,144000],[201500,36000]],"lv_max":100,"talent_desc_args":[],"per_level_attrs":[[25,160]],"refine_limit_lv":16,"quality_up_type":0,"attrs":[[25,15000]],"unlock_args":[55]}`|
|40703|`{"unlock":926610810703,"inscription_limit_lv":30,"unlock_desc":410158,"type":4,"exp":5000,"quality":7,"talent_attrs":[],"talent_unlock_tip":0,"talent_desc":0,"cost":[[157002,198000],[201500,60000]],"lv_max":120,"talent_desc_args":[],"per_level_attrs":[[25,180]],"refine_limit_lv":18,"quality_up_type":1,"attrs":[[25,18000]],"unlock_args":[60]}`|
|40803|`{"unlock":918220900009,"inscription_limit_lv":40,"unlock_desc":410158,"type":4,"exp":5000,"quality":8,"talent_attrs":[[204,240]],"talent_unlock_tip":410150,"talent_desc":19,"cost":[[23002,1],[157002,450000],[201500,84000]],"lv_max":140,"talent_desc_args":[1,5],"per_level_attrs":[[25,210]],"refine_limit_lv":20,"quality_up_type":1,"attrs":[[25,19000]],"unlock_args":[65]}`|
|40903|`{"unlock":89404700004,"inscription_limit_lv":40,"unlock_desc":410158,"type":4,"exp":5000,"quality":9,"talent_attrs":[[204,720]],"talent_unlock_tip":410150,"talent_desc":19,"cost":[[23002,1],[157002,750000],[201500,108000]],"lv_max":160,"talent_desc_args":[2,6],"per_level_attrs":[[25,230]],"refine_limit_lv":22,"quality_up_type":1,"attrs":[[25,20500]],"unlock_args":[70]}`|
|41003|`{"unlock":582540600004,"inscription_limit_lv":50,"unlock_desc":410158,"type":4,"exp":5000,"quality":10,"talent_attrs":[[204,1200]],"talent_unlock_tip":410150,"talent_desc":19,"cost":[[23002,1],[157002,1200000],[201500,156000]],"lv_max":180,"talent_desc_args":[2,6],"per_level_attrs":[[25,250]],"refine_limit_lv":24,"quality_up_type":1,"attrs":[[25,22500]],"unlock_args":[80]}`|
|41103|`{"unlock":955132601198,"inscription_limit_lv":60,"unlock_desc":410158,"type":4,"exp":5000,"quality":11,"talent_attrs":[[204,1680]],"talent_unlock_tip":410150,"talent_desc":19,"cost":[[23002,4],[157002,2400000],[201500,204000]],"lv_max":200,"talent_desc_args":[3,7],"per_level_attrs":[[25,260]],"refine_limit_lv":26,"quality_up_type":1,"attrs":[[25,25500]],"unlock_args":[90]}`|
|41203|`{"unlock":926610811203,"inscription_limit_lv":70,"unlock_desc":410158,"type":4,"exp":5000,"quality":12,"talent_attrs":[[204,2880]],"talent_unlock_tip":410150,"talent_desc":19,"cost":[[23002,4],[157002,3000000],[201500,300000]],"lv_max":220,"talent_desc_args":[4,8],"per_level_attrs":[[25,270]],"refine_limit_lv":28,"quality_up_type":1,"attrs":[[25,31000]],"unlock_args":[100]}`|
|41303|`{"unlock":926610811303,"inscription_limit_lv":70,"unlock_desc":410158,"type":4,"exp":5000,"quality":13,"talent_attrs":[[204,4320]],"talent_unlock_tip":410150,"talent_desc":19,"cost":[[23002,4],[157002,3600000],[201500,396000]],"lv_max":230,"talent_desc_args":[5,9],"per_level_attrs":[[25,320]],"refine_limit_lv":30,"quality_up_type":1,"attrs":[[25,37500]],"unlock_args":[110]}`|
|41403|`{"unlock":926610811403,"inscription_limit_lv":70,"unlock_desc":410158,"type":4,"exp":5000,"quality":14,"talent_attrs":[[204,6120]],"talent_unlock_tip":410150,"talent_desc":19,"cost":[[23002,6],[157002,4500000],[201500,540000]],"lv_max":300,"talent_desc_args":[6,10],"per_level_attrs":[[25,360]],"refine_limit_lv":48,"quality_up_type":1,"attrs":[[25,47500]],"unlock_args":[120]}`|
|41503|`{"unlock":926610811503,"inscription_limit_lv":80,"unlock_desc":410158,"type":4,"exp":5000,"quality":15,"talent_attrs":[[204,8280]],"talent_unlock_tip":410150,"talent_desc":19,"cost":[[23002,6],[157002,5700000],[201500,720000]],"lv_max":330,"talent_desc_args":[7,11],"per_level_attrs":[[25,400]],"refine_limit_lv":52,"quality_up_type":1,"attrs":[[25,61500]],"unlock_args":[130]}`|
|41603|`{"unlock":926610811603,"inscription_limit_lv":90,"unlock_desc":410158,"type":4,"exp":5000,"quality":16,"talent_attrs":[[204,10800]],"talent_unlock_tip":410150,"talent_desc":19,"cost":[[23002,6],[157002,5700000],[201500,720000]],"lv_max":360,"talent_desc_args":[8,12],"per_level_attrs":[[25,450]],"refine_limit_lv":56,"quality_up_type":1,"attrs":[[25,80000]],"unlock_args":[140]}`|
|41703|`{"unlock":926610811703,"inscription_limit_lv":100,"unlock_desc":410158,"type":4,"exp":5000,"quality":17,"talent_attrs":[[204,13680]],"talent_unlock_tip":410150,"talent_desc":19,"cost":[[23002,6],[157002,5700000],[201500,720000]],"lv_max":390,"talent_desc_args":[9,13],"per_level_attrs":[[25,500]],"refine_limit_lv":64,"quality_up_type":1,"attrs":[[25,103500]],"unlock_args":[150]}`|
|41803|`{"unlock":926610811803,"inscription_limit_lv":110,"unlock_desc":410158,"type":4,"exp":5000,"quality":18,"talent_attrs":[[204,16920]],"talent_unlock_tip":410150,"talent_desc":19,"cost":[[23002,8],[157002,7200000],[201500,940000]],"lv_max":420,"talent_desc_args":[10,14],"per_level_attrs":[[25,550]],"refine_limit_lv":68,"quality_up_type":1,"attrs":[[25,132500]],"unlock_args":[160]}`|
|41903|`{"unlock":926610811903,"inscription_limit_lv":120,"unlock_desc":410158,"type":4,"exp":5000,"quality":19,"talent_attrs":[[204,20520]],"talent_unlock_tip":410150,"talent_desc":19,"cost":[[23002,8],[157002,7200000],[201500,940000]],"lv_max":460,"talent_desc_args":[11,15],"per_level_attrs":[[25,610]],"refine_limit_lv":72,"quality_up_type":1,"attrs":[[25,167500]],"unlock_args":[170]}`|
|42003|`{"unlock":926610812003,"inscription_limit_lv":130,"unlock_desc":410158,"type":4,"exp":5000,"quality":20,"talent_attrs":[[204,24480]],"talent_unlock_tip":410150,"talent_desc":19,"cost":[[23002,8],[157002,7200000],[201500,940000]],"lv_max":500,"talent_desc_args":[12,16],"per_level_attrs":[[25,670]],"refine_limit_lv":80,"quality_up_type":2,"attrs":[[25,209500]],"unlock_args":[180]}`|

## Refine

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|cost|array|320|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|exp_total|number|320|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|talent_desc_args|array|320|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|once_attrs|array|320|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|320|本表行键；与其他表同值不自动代表同一对象。|
|exp_once|number|320|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|talent_attrs|array|320|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lucky_weight|array|320|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|
|equip_type|number|320|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|base_attrs|array|320|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|talent_unlock_tip|number|320|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|talent_desc|number|320|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部320行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10001|`{"cost":[[17002,16]],"exp_total":200,"talent_desc_args":[],"once_attrs":[[2,36]],"exp_once":10,"talent_attrs":[],"lucky_weight":[[60,1]],"equip_type":0,"base_attrs":[[2,720]],"talent_unlock_tip":0,"talent_desc":0}`|
|10002|`{"cost":[[17002,16]],"exp_total":200,"talent_desc_args":[],"once_attrs":[[2,36]],"exp_once":10,"talent_attrs":[],"lucky_weight":[[60,1]],"equip_type":0,"base_attrs":[[2,1440]],"talent_unlock_tip":0,"talent_desc":0}`|
|10003|`{"cost":[[17002,32]],"exp_total":500,"talent_desc_args":[],"once_attrs":[[2,58]],"exp_once":20,"talent_attrs":[],"lucky_weight":[[60,1]],"equip_type":0,"base_attrs":[[2,2842]],"talent_unlock_tip":0,"talent_desc":0}`|

## Inscription

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|cost|array|520|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|talent_desc_args|array|520|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|520|本表行键；与其他表同值不自动代表同一对象。|
|talent_unlock_tip_args|array|520|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|talent_attrs|array|520|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|equip_type|number|520|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|base_attrs|array|520|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|talent_unlock_tip|number|520|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|talent_desc|number|520|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部520行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10001|`{"cost":[[18002,8]],"talent_desc_args":[],"talent_unlock_tip_args":[],"talent_attrs":[],"equip_type":0,"base_attrs":[[2,1800]],"talent_unlock_tip":0,"talent_desc":0}`|
|10002|`{"cost":[[18002,8]],"talent_desc_args":[],"talent_unlock_tip_args":[],"talent_attrs":[],"equip_type":0,"base_attrs":[[2,2850]],"talent_unlock_tip":0,"talent_desc":0}`|
|10003|`{"cost":[[18002,8]],"talent_desc_args":[],"talent_unlock_tip_args":[],"talent_attrs":[],"equip_type":0,"base_attrs":[[2,3900]],"talent_unlock_tip":0,"talent_desc":0}`|
