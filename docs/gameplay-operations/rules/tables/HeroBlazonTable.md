# HeroBlazonTable 规则参数

来源：[personal-server/assets/tables/HeroBlazonTable.data.json.gz](../../../../personal-server/assets/tables/HeroBlazonTable.data.json.gz)，SHA256：`36d259a3d50aa8f051eaa6d166871087a3b4315d10d2ce67baa99d59297ac19e`。

[完整逐行JSON](HeroBlazonTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Param](#param)|1|decoded-rows|
|[Quality](#quality)|4|decoded-rows|
|[TalentUp](#talentup)|27|decoded-rows|
|[Talent](#talent)|8|decoded-rows|
|[TalentReset](#talentreset)|5|decoded-rows|
|[ScoreBox](#scorebox)|6|decoded-rows|
|[Attr](#attr)|720|decoded-rows|
|[Skill](#skill)|88|decoded-rows|
|[Level](#level)|26|decoded-rows|
|[AngerSkillType](#angerskilltype)|3|decoded-rows|
|[AngerSkillDes](#angerskilldes)|48|decoded-rows|
|[Chapter](#chapter)|4|decoded-rows|
|[BondAttr](#bondattr)|3200|decoded-rows|
|[BondItemNeed](#bonditemneed)|492|decoded-rows|
|[BondGroup](#bondgroup)|128|decoded-rows|
|[EmbedGroup](#embedgroup)|110|decoded-rows|
|[EmbedCell](#embedcell)|414|decoded-rows|

## Param

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|reset_times_limit|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|orange_plus_val|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skill_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|normal_quality_lim|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|normal_active_interval|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skill_max_star|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|open_bubble|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|spec_active_interval|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bubble_txt|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|up_star_interval|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|talent_sort|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|talent_open|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|unlock_one_key|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|talent_show|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"reset_times_limit":5,"skill_count":4,"normal_quality_lim":40,"normal_active_interval":100,"skill_max_star":10,"open_bubble":152493700001,"spec_active_interval":300,"up_star_interval":150,"talent_sort":[73,72,39,35,40,36,41,37,42,38],"talent_open":20,"unlock_one_key":1,"talent_show":20}`|

## Quality

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|chart_value|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bg_icon|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|mask_icon_index|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr|array|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|30|`{"chart_value":1,"attr":[[201,36],[202,6],[209,4]]}`|
|40|`{"chart_value":2,"attr":[[201,90],[202,15],[209,9]]}`|
|50|`{"chart_value":4,"attr":[]}`|
|60|`{"chart_value":8,"attr":[]}`|

## TalentUp

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|27|本表行键；与其他表同值不自动代表同一对象。|
|range_min|number|27|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|range_max|number|27|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|0|`{"range_min":0,"range_max":80}`|
|240|`{"range_min":40,"range_max":120}`|
|400|`{"range_min":80,"range_max":160}`|
|500|`{"range_min":100,"range_max":200}`|
|600|`{"range_min":120,"range_max":240}`|
|700|`{"range_min":140,"range_max":280}`|
|800|`{"range_min":160,"range_max":320}`|
|900|`{"range_min":180,"range_max":360}`|
|1000|`{"range_min":200,"range_max":400}`|
|1100|`{"range_min":220,"range_max":440}`|
|1200|`{"range_min":240,"range_max":480}`|
|1300|`{"range_min":260,"range_max":520}`|
|1400|`{"range_min":280,"range_max":560}`|
|1500|`{"range_min":300,"range_max":600}`|
|1600|`{"range_min":320,"range_max":640}`|
|1800|`{"range_min":360,"range_max":720}`|
|2000|`{"range_min":400,"range_max":800}`|
|2200|`{"range_min":440,"range_max":880}`|
|2400|`{"range_min":480,"range_max":960}`|
|2600|`{"range_min":520,"range_max":1040}`|
|2800|`{"range_min":560,"range_max":1120}`|
|3000|`{"range_min":600,"range_max":1200}`|
|3200|`{"range_min":640,"range_max":1280}`|
|3400|`{"range_min":680,"range_max":1360}`|
|3600|`{"range_min":720,"range_max":1440}`|
|3800|`{"range_min":760,"range_max":1520}`|
|4000|`{"range_min":800,"range_max":1600}`|

## Talent

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|attr_value|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|8|本表行键；与其他表同值不自动代表同一对象。|
|talent_text_bg|string|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|talent_icon|string|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|active_value|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|35|`{"attr_value":100,"talent_text_bg":"img_mx_jiyezidi.png","talent_icon":"img_mx_dk_jiye.png","active_value":1}`|
|36|`{"attr_value":100,"talent_text_bg":"img_mx_guyuzidi.png","talent_icon":"img_mx_dk_guyu.png","active_value":1}`|
|37|`{"attr_value":100,"talent_text_bg":"img_mx_yuansuzidi.png","talent_icon":"img_mx_dk_yuansu.png","active_value":1}`|
|38|`{"attr_value":100,"talent_text_bg":"img_mx_shengtangzidi.png","talent_icon":"img_mx_dk_shengtang.png","active_value":1}`|
|39|`{"attr_value":100,"talent_text_bg":"img_mx_jiyezidi.png","talent_icon":"img_mx_kz_jiye.png","active_value":1}`|
|40|`{"attr_value":100,"talent_text_bg":"img_mx_guyuzidi.png","talent_icon":"img_mx_kz_guyu.png","active_value":1}`|
|41|`{"attr_value":100,"talent_text_bg":"img_mx_yuansuzidi.png","talent_icon":"img_mx_kz_yuansu.png","active_value":1}`|
|42|`{"attr_value":100,"talent_text_bg":"img_mx_shengtangzidi.png","talent_icon":"img_mx_kz_shengtang.png","active_value":1}`|

## TalentReset

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|cost|array|5|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"cost":[]}`|
|2|`{"cost":[[101500,200]]}`|
|3|`{"cost":[[101500,400]]}`|
|4|`{"cost":[[101500,600]]}`|
|5|`{"cost":[[101500,1000]]}`|

## ScoreBox

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|cash_item|array|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cash_score|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"cash_item":[[871200,2]],"cash_score":20}`|
|2|`{"cash_item":[[871200,3]],"cash_score":30}`|
|3|`{"cash_item":[[881200,1]],"cash_score":60}`|
|4|`{"cash_item":[[871200,5]],"cash_score":30}`|
|5|`{"cash_item":[[891200,1]],"cash_score":60}`|
|6|`{"cash_item":[[881200,1]],"cash_score":40}`|

## Attr

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|talent_type|number|720|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|talent_attr|array|720|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|item|number|720|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|720|本表行键；与其他表同值不自动代表同一对象。|
|hero|number|720|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr|array|720|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部720行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|3110010200|`{"talent_type":2,"talent_attr":[[35,200]],"item":1002,"hero":1030101,"attr":[[201,480],[202,80],[209,48]]}`|
|3110010201|`{"talent_type":2,"talent_attr":[[35,400]],"item":1002,"hero":1030101,"attr":[[201,960],[202,160],[209,96]]}`|
|3110010202|`{"talent_type":2,"talent_attr":[[35,600]],"item":1002,"hero":1030101,"attr":[[201,1440],[202,240],[209,144]]}`|

## Skill

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|active_chart_value|number|88|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|active_item|array|88|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|blazon_campus|number|88|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skill|number|88|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|88|本表行键；与其他表同值不自动代表同一对象。|
|attr|array|88|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1100|`{"active_chart_value":0,"active_item":[[24002,0]],"skill":200000301,"attr":[[201,0],[202,0],[209,0],[89,0]]}`|
|1101|`{"active_chart_value":5,"active_item":[[24002,1]],"skill":200000301,"attr":[[201,720],[202,120],[209,72],[89,400]]}`|
|1102|`{"active_chart_value":40,"active_item":[[24002,2]],"skill":200000302,"attr":[[201,2160],[202,360],[209,216],[89,800]]}`|
|1103|`{"active_chart_value":120,"active_item":[[24002,3]],"skill":200000303,"attr":[[201,4320],[202,720],[209,432],[89,1200]]}`|
|1104|`{"active_chart_value":300,"active_item":[[24002,4]],"skill":200000304,"attr":[[201,7200],[202,1200],[209,720],[89,1600]]}`|
|1105|`{"active_chart_value":650,"active_item":[[24002,5]],"skill":200000305,"attr":[[201,10800],[202,1800],[209,1080],[89,2000]]}`|
|1106|`{"active_chart_value":1000,"active_item":[[24002,5]],"skill":200000311,"attr":[[201,14400],[202,2400],[209,1440],[89,2000]]}`|
|1107|`{"active_chart_value":1400,"active_item":[[24002,5]],"skill":200000312,"attr":[[201,18000],[202,3000],[209,1800],[89,2000]]}`|
|1108|`{"active_chart_value":1800,"active_item":[[24002,5]],"skill":200000313,"attr":[[201,21600],[202,3600],[209,2160],[89,2000]]}`|
|1109|`{"active_chart_value":2300,"active_item":[[24002,5]],"skill":200000314,"attr":[[201,25200],[202,4200],[209,2520],[89,2000]]}`|
|1110|`{"active_chart_value":2900,"active_item":[[24002,5]],"skill":200000315,"attr":[[201,28800],[202,4800],[209,2880],[89,2000]]}`|
|1200|`{"active_chart_value":0,"active_item":[[24002,0]],"skill":200000201,"attr":[[201,0],[202,0],[209,0],[89,0]]}`|
|1201|`{"active_chart_value":10,"active_item":[[24002,1]],"skill":200000201,"attr":[[201,720],[202,120],[209,72],[89,400]]}`|
|1202|`{"active_chart_value":60,"active_item":[[24002,2]],"skill":200000202,"attr":[[201,2160],[202,360],[209,216],[89,800]]}`|
|1203|`{"active_chart_value":160,"active_item":[[24002,3]],"skill":200000203,"attr":[[201,4320],[202,720],[209,432],[89,1200]]}`|
|1204|`{"active_chart_value":380,"active_item":[[24002,4]],"skill":200000204,"attr":[[201,7200],[202,1200],[209,720],[89,1600]]}`|
|1205|`{"active_chart_value":850,"active_item":[[24002,5]],"skill":200000205,"attr":[[201,10800],[202,1800],[209,1080],[89,2000]]}`|
|1206|`{"active_chart_value":1200,"active_item":[[24002,5]],"skill":200000211,"attr":[[201,14400],[202,2400],[209,1440],[89,2000]]}`|
|1207|`{"active_chart_value":1600,"active_item":[[24002,5]],"skill":200000212,"attr":[[201,18000],[202,3000],[209,1800],[89,2000]]}`|
|1208|`{"active_chart_value":2000,"active_item":[[24002,5]],"skill":200000213,"attr":[[201,21600],[202,3600],[209,2160],[89,2000]]}`|
|1209|`{"active_chart_value":2600,"active_item":[[24002,5]],"skill":200000214,"attr":[[201,25200],[202,4200],[209,2520],[89,2000]]}`|
|1210|`{"active_chart_value":3200,"active_item":[[24002,5]],"skill":200000215,"attr":[[201,28800],[202,4800],[209,2880],[89,2000]]}`|
|2100|`{"active_chart_value":0,"active_item":[[24002,0]],"skill":200000401,"attr":[[201,0],[202,0],[209,0],[89,0]]}`|
|2101|`{"active_chart_value":5,"active_item":[[24002,1]],"skill":200000401,"attr":[[201,720],[202,120],[209,72],[89,400]]}`|
|2102|`{"active_chart_value":40,"active_item":[[24002,2]],"skill":200000402,"attr":[[201,2160],[202,360],[209,216],[89,800]]}`|
|2103|`{"active_chart_value":120,"active_item":[[24002,3]],"skill":200000403,"attr":[[201,4320],[202,720],[209,432],[89,1200]]}`|
|2104|`{"active_chart_value":300,"active_item":[[24002,4]],"skill":200000404,"attr":[[201,7200],[202,1200],[209,720],[89,1600]]}`|
|2105|`{"active_chart_value":650,"active_item":[[24002,5]],"skill":200000405,"attr":[[201,10800],[202,1800],[209,1080],[89,2000]]}`|
|2106|`{"active_chart_value":1000,"active_item":[[24002,5]],"skill":200000406,"attr":[[201,14400],[202,2400],[209,1440],[89,2000]]}`|
|2107|`{"active_chart_value":1400,"active_item":[[24002,5]],"skill":200000407,"attr":[[201,18000],[202,3000],[209,1800],[89,2000]]}`|
|2108|`{"active_chart_value":1800,"active_item":[[24002,5]],"skill":200000408,"attr":[[201,21600],[202,3600],[209,2160],[89,2000]]}`|
|2109|`{"active_chart_value":2300,"active_item":[[24002,5]],"skill":200000409,"attr":[[201,25200],[202,4200],[209,2520],[89,2000]]}`|
|2110|`{"active_chart_value":2900,"active_item":[[24002,5]],"skill":200000410,"attr":[[201,28800],[202,4800],[209,2880],[89,2000]]}`|
|2200|`{"active_chart_value":0,"active_item":[[24002,0]],"skill":200000101,"attr":[[201,0],[202,0],[209,0],[89,0]]}`|
|2201|`{"active_chart_value":10,"active_item":[[24002,1]],"skill":200000101,"attr":[[201,720],[202,120],[209,72],[89,400]]}`|
|2202|`{"active_chart_value":60,"active_item":[[24002,2]],"skill":200000102,"attr":[[201,2160],[202,360],[209,216],[89,800]]}`|
|2203|`{"active_chart_value":160,"active_item":[[24002,3]],"skill":200000103,"attr":[[201,4320],[202,720],[209,432],[89,1200]]}`|
|2204|`{"active_chart_value":380,"active_item":[[24002,4]],"skill":200000104,"attr":[[201,7200],[202,1200],[209,720],[89,1600]]}`|
|2205|`{"active_chart_value":850,"active_item":[[24002,5]],"skill":200000105,"attr":[[201,10800],[202,1800],[209,1080],[89,2000]]}`|
|2206|`{"active_chart_value":1200,"active_item":[[24002,5]],"skill":200000106,"attr":[[201,14400],[202,2400],[209,1440],[89,2000]]}`|
|2207|`{"active_chart_value":1600,"active_item":[[24002,5]],"skill":200000107,"attr":[[201,18000],[202,3000],[209,1800],[89,2000]]}`|
|2208|`{"active_chart_value":2000,"active_item":[[24002,5]],"skill":200000108,"attr":[[201,21600],[202,3600],[209,2160],[89,2000]]}`|
|2209|`{"active_chart_value":2600,"active_item":[[24002,5]],"skill":200000109,"attr":[[201,25200],[202,4200],[209,2520],[89,2000]]}`|
|2210|`{"active_chart_value":3200,"active_item":[[24002,5]],"skill":200000110,"attr":[[201,28800],[202,4800],[209,2880],[89,2000]]}`|
|3100|`{"active_chart_value":0,"active_item":[[24002,0]],"skill":200000701,"attr":[[201,0],[202,0],[209,0],[89,0]]}`|
|3101|`{"active_chart_value":5,"active_item":[[24002,1]],"skill":200000701,"attr":[[201,720],[202,120],[209,72],[89,400]]}`|
|3102|`{"active_chart_value":40,"active_item":[[24002,2]],"skill":200000702,"attr":[[201,2160],[202,360],[209,216],[89,800]]}`|
|3103|`{"active_chart_value":120,"active_item":[[24002,3]],"skill":200000703,"attr":[[201,4320],[202,720],[209,432],[89,1200]]}`|
|3104|`{"active_chart_value":300,"active_item":[[24002,4]],"skill":200000704,"attr":[[201,7200],[202,1200],[209,720],[89,1600]]}`|
|3105|`{"active_chart_value":650,"active_item":[[24002,5]],"skill":200000705,"attr":[[201,10800],[202,1800],[209,1080],[89,2000]]}`|
|3106|`{"active_chart_value":1000,"active_item":[[24002,5]],"skill":200000706,"attr":[[201,14400],[202,2400],[209,1440],[89,2000]]}`|
|3107|`{"active_chart_value":1400,"active_item":[[24002,5]],"skill":200000707,"attr":[[201,18000],[202,3000],[209,1800],[89,2000]]}`|
|3108|`{"active_chart_value":1800,"active_item":[[24002,5]],"skill":200000708,"attr":[[201,21600],[202,3600],[209,2160],[89,2000]]}`|
|3109|`{"active_chart_value":2300,"active_item":[[24002,5]],"skill":200000709,"attr":[[201,25200],[202,4200],[209,2520],[89,2000]]}`|
|3110|`{"active_chart_value":2900,"active_item":[[24002,5]],"skill":200000710,"attr":[[201,28800],[202,4800],[209,2880],[89,2000]]}`|
|3200|`{"active_chart_value":0,"active_item":[[24002,0]],"skill":200000601,"attr":[[201,0],[202,0],[209,0],[89,0]]}`|
|3201|`{"active_chart_value":10,"active_item":[[24002,1]],"skill":200000601,"attr":[[201,720],[202,120],[209,72],[89,400]]}`|
|3202|`{"active_chart_value":60,"active_item":[[24002,2]],"skill":200000602,"attr":[[201,2160],[202,360],[209,216],[89,800]]}`|
|3203|`{"active_chart_value":160,"active_item":[[24002,3]],"skill":200000603,"attr":[[201,4320],[202,720],[209,432],[89,1200]]}`|
|3204|`{"active_chart_value":380,"active_item":[[24002,4]],"skill":200000604,"attr":[[201,7200],[202,1200],[209,720],[89,1600]]}`|
|3205|`{"active_chart_value":850,"active_item":[[24002,5]],"skill":200000605,"attr":[[201,10800],[202,1800],[209,1080],[89,2000]]}`|
|3206|`{"active_chart_value":1200,"active_item":[[24002,5]],"skill":200000606,"attr":[[201,14400],[202,2400],[209,1440],[89,2000]]}`|
|3207|`{"active_chart_value":1600,"active_item":[[24002,5]],"skill":200000607,"attr":[[201,18000],[202,3000],[209,1800],[89,2000]]}`|
|3208|`{"active_chart_value":2000,"active_item":[[24002,5]],"skill":200000608,"attr":[[201,21600],[202,3600],[209,2160],[89,2000]]}`|
|3209|`{"active_chart_value":2600,"active_item":[[24002,5]],"skill":200000609,"attr":[[201,25200],[202,4200],[209,2520],[89,2000]]}`|
|3210|`{"active_chart_value":3200,"active_item":[[24002,5]],"skill":200000610,"attr":[[201,28800],[202,4800],[209,2880],[89,2000]]}`|
|4100|`{"active_chart_value":0,"active_item":[[24002,0]],"skill":200000801,"attr":[[201,0],[202,0],[209,0],[89,0]]}`|
|4101|`{"active_chart_value":5,"active_item":[[24002,1]],"skill":200000801,"attr":[[201,720],[202,120],[209,72],[89,400]]}`|
|4102|`{"active_chart_value":40,"active_item":[[24002,2]],"skill":200000802,"attr":[[201,2160],[202,360],[209,216],[89,800]]}`|
|4103|`{"active_chart_value":120,"active_item":[[24002,3]],"skill":200000803,"attr":[[201,4320],[202,720],[209,432],[89,1200]]}`|
|4104|`{"active_chart_value":300,"active_item":[[24002,4]],"skill":200000804,"attr":[[201,7200],[202,1200],[209,720],[89,1600]]}`|
|4105|`{"active_chart_value":650,"active_item":[[24002,5]],"skill":200000805,"attr":[[201,10800],[202,1800],[209,1080],[89,2000]]}`|
|4106|`{"active_chart_value":1000,"active_item":[[24002,5]],"skill":200000808,"attr":[[201,14400],[202,2400],[209,1440],[89,2000]]}`|
|4107|`{"active_chart_value":1400,"active_item":[[24002,5]],"skill":200000809,"attr":[[201,18000],[202,3000],[209,1800],[89,2000]]}`|
|4108|`{"active_chart_value":1800,"active_item":[[24002,5]],"skill":200000810,"attr":[[201,21600],[202,3600],[209,2160],[89,2000]]}`|
|4109|`{"active_chart_value":2300,"active_item":[[24002,5]],"skill":200000811,"attr":[[201,25200],[202,4200],[209,2520],[89,2000]]}`|
|4110|`{"active_chart_value":2900,"active_item":[[24002,5]],"skill":200000812,"attr":[[201,28800],[202,4800],[209,2880],[89,2000]]}`|
|4200|`{"active_chart_value":0,"active_item":[[24002,0]],"skill":200000501,"attr":[[201,0],[202,0],[209,0],[89,0]]}`|
|4201|`{"active_chart_value":10,"active_item":[[24002,1]],"skill":200000501,"attr":[[201,720],[202,120],[209,72],[89,400]]}`|
|4202|`{"active_chart_value":60,"active_item":[[24002,2]],"skill":200000502,"attr":[[201,2160],[202,360],[209,216],[89,800]]}`|
|4203|`{"active_chart_value":160,"active_item":[[24002,3]],"skill":200000503,"attr":[[201,4320],[202,720],[209,432],[89,1200]]}`|
|4204|`{"active_chart_value":380,"active_item":[[24002,4]],"skill":200000504,"attr":[[201,7200],[202,1200],[209,720],[89,1600]]}`|
|4205|`{"active_chart_value":850,"active_item":[[24002,5]],"skill":200000505,"attr":[[201,10800],[202,1800],[209,1080],[89,2000]]}`|
|4206|`{"active_chart_value":1200,"active_item":[[24002,5]],"skill":200000506,"attr":[[201,14400],[202,2400],[209,1440],[89,2000]]}`|
|4207|`{"active_chart_value":1600,"active_item":[[24002,5]],"skill":200000507,"attr":[[201,18000],[202,3000],[209,1800],[89,2000]]}`|
|4208|`{"active_chart_value":2000,"active_item":[[24002,5]],"skill":200000508,"attr":[[201,21600],[202,3600],[209,2160],[89,2000]]}`|
|4209|`{"active_chart_value":2600,"active_item":[[24002,5]],"skill":200000509,"attr":[[201,25200],[202,4200],[209,2520],[89,2000]]}`|
|4210|`{"active_chart_value":3200,"active_item":[[24002,5]],"skill":200000510,"attr":[[201,28800],[202,4800],[209,2880],[89,2000]]}`|

## Level

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|26|本表行键；与其他表同值不自动代表同一对象。|
|count|number|26|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|0|`{"count":1}`|
|1|`{"count":1}`|
|2|`{"count":1}`|
|3|`{"count":1}`|
|4|`{"count":1}`|
|5|`{"count":1}`|
|6|`{"count":1}`|
|7|`{"count":1}`|
|8|`{"count":1}`|
|9|`{"count":1}`|
|10|`{"count":1}`|
|11|`{"count":1}`|
|12|`{"count":1}`|
|13|`{"count":1}`|
|14|`{"count":1}`|
|15|`{"count":1}`|
|16|`{"count":1}`|
|17|`{"count":1}`|
|18|`{"count":1}`|
|19|`{"count":1}`|
|20|`{"count":1}`|
|21|`{"count":1}`|
|22|`{"count":1}`|
|23|`{"count":1}`|
|24|`{"count":1}`|
|25|`{"count":1}`|

## AngerSkillType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|attrType|array|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"attrType":[201,202,209]}`|
|2|`{"attrType":[39,40,41,42,73,35,36,37,38,72]}`|
|3|`{"attrType":[1,2,3,4]}`|

## AngerSkillDes

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|48|本表行键；与其他表同值不自动代表同一对象。|
|skill_type|number|48|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skill_value|number|48|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skill_lv|number|48|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|290000001|`{"skill_type":61899,"skill_value":15,"skill_lv":1}`|
|290000002|`{"skill_type":61899,"skill_value":15,"skill_lv":2}`|
|290000003|`{"skill_type":61901,"skill_value":60,"skill_lv":1}`|
|290000004|`{"skill_type":61901,"skill_value":60,"skill_lv":2}`|
|290000005|`{"skill_type":61900,"skill_value":5,"skill_lv":1}`|
|290000006|`{"skill_type":61900,"skill_value":5,"skill_lv":2}`|
|290000007|`{"skill_type":61898,"skill_value":20,"skill_lv":1}`|
|290000008|`{"skill_type":61898,"skill_value":20,"skill_lv":2}`|
|290000009|`{"skill_type":61899,"skill_value":15,"skill_lv":3}`|
|290000010|`{"skill_type":61899,"skill_value":15,"skill_lv":4}`|
|290000011|`{"skill_type":61901,"skill_value":60,"skill_lv":3}`|
|290000012|`{"skill_type":61901,"skill_value":60,"skill_lv":4}`|
|290000013|`{"skill_type":61900,"skill_value":5,"skill_lv":3}`|
|290000014|`{"skill_type":61900,"skill_value":5,"skill_lv":4}`|
|290000015|`{"skill_type":61898,"skill_value":20,"skill_lv":3}`|
|290000016|`{"skill_type":61898,"skill_value":20,"skill_lv":4}`|
|290000017|`{"skill_type":61899,"skill_value":27,"skill_lv":1}`|
|290000018|`{"skill_type":61899,"skill_value":27,"skill_lv":2}`|
|290000019|`{"skill_type":61901,"skill_value":80,"skill_lv":1}`|
|290000020|`{"skill_type":61901,"skill_value":80,"skill_lv":2}`|
|290000021|`{"skill_type":61900,"skill_value":12,"skill_lv":1}`|
|290000022|`{"skill_type":61900,"skill_value":12,"skill_lv":2}`|
|290000023|`{"skill_type":61898,"skill_value":35,"skill_lv":1}`|
|290000024|`{"skill_type":61898,"skill_value":35,"skill_lv":2}`|
|290000025|`{"skill_type":61899,"skill_value":27,"skill_lv":3}`|
|290000026|`{"skill_type":61899,"skill_value":27,"skill_lv":4}`|
|290000027|`{"skill_type":61901,"skill_value":80,"skill_lv":3}`|
|290000028|`{"skill_type":61901,"skill_value":80,"skill_lv":4}`|
|290000029|`{"skill_type":61900,"skill_value":12,"skill_lv":3}`|
|290000030|`{"skill_type":61900,"skill_value":12,"skill_lv":4}`|
|290000031|`{"skill_type":61898,"skill_value":35,"skill_lv":3}`|
|290000032|`{"skill_type":61898,"skill_value":35,"skill_lv":4}`|
|290000033|`{"skill_type":61899,"skill_value":39,"skill_lv":1}`|
|290000034|`{"skill_type":61899,"skill_value":39,"skill_lv":2}`|
|290000035|`{"skill_type":61901,"skill_value":100,"skill_lv":1}`|
|290000036|`{"skill_type":61901,"skill_value":100,"skill_lv":2}`|
|290000037|`{"skill_type":61900,"skill_value":19,"skill_lv":1}`|
|290000038|`{"skill_type":61900,"skill_value":19,"skill_lv":2}`|
|290000039|`{"skill_type":61898,"skill_value":50,"skill_lv":1}`|
|290000040|`{"skill_type":61898,"skill_value":50,"skill_lv":2}`|
|290000041|`{"skill_type":61899,"skill_value":39,"skill_lv":3}`|
|290000042|`{"skill_type":61899,"skill_value":39,"skill_lv":4}`|
|290000043|`{"skill_type":61901,"skill_value":100,"skill_lv":3}`|
|290000044|`{"skill_type":61901,"skill_value":100,"skill_lv":4}`|
|290000045|`{"skill_type":61900,"skill_value":19,"skill_lv":3}`|
|290000046|`{"skill_type":61900,"skill_value":19,"skill_lv":4}`|
|290000047|`{"skill_type":61898,"skill_value":50,"skill_lv":3}`|
|290000048|`{"skill_type":61898,"skill_value":50,"skill_lv":4}`|

## Chapter

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|unlock_role_level|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|normal_cell|array|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|show_icon|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_img|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|total_chart_value|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name_icon|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|unlock_chart_value|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|enter_icon|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|campus|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"unlock_role_level":0,"total_chart_value":2088,"unlock_chart_value":0}`|
|2|`{"unlock_role_level":0,"total_chart_value":2088,"unlock_chart_value":0}`|
|3|`{"unlock_role_level":0,"total_chart_value":2088,"unlock_chart_value":0}`|
|4|`{"unlock_role_level":0,"total_chart_value":2088,"unlock_chart_value":0}`|

## BondAttr

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|chart_value|number|3200|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|talent_attr|array|3200|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skill|number|3200|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hero_career|number|3200|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|3200|本表行键；与其他表同值不自动代表同一对象。|
|attr|array|3200|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部3200行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|100101|`{"chart_value":12,"talent_attr":[[41,500]],"skill":290000003,"hero_career":2,"attr":[[202,1000]]}`|
|100102|`{"chart_value":24,"talent_attr":[[41,1000]],"skill":290000003,"hero_career":2,"attr":[[202,2000]]}`|
|100103|`{"chart_value":36,"talent_attr":[[41,1500]],"skill":290000003,"hero_career":2,"attr":[[202,3000]]}`|

## BondItemNeed

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|index|number|492|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|492|本表行键；与其他表同值不自动代表同一对象。|
|special_item|number|492|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|group|number|492|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部492行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10011|`{"special_item":33000402,"group":1001}`|
|10012|`{"special_item":32000302,"group":1001}`|
|10013|`{"special_item":32000402,"group":1001}`|

## BondGroup

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|128|本表行键；与其他表同值不自动代表同一对象。|
|campus|number|128|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|128|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|inner_index|number|128|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{}`|
|1002|`{}`|
|1003|`{}`|
|1004|`{}`|
|1005|`{}`|
|1006|`{}`|
|1007|`{}`|
|1008|`{}`|
|1009|`{}`|
|1010|`{}`|
|1011|`{}`|
|1012|`{}`|
|1013|`{}`|
|1014|`{}`|
|1015|`{}`|
|1016|`{}`|
|1017|`{}`|
|1018|`{}`|
|1019|`{}`|
|1020|`{}`|
|1021|`{}`|
|1022|`{}`|
|1023|`{}`|
|1024|`{}`|
|1025|`{}`|
|1026|`{}`|
|1027|`{}`|
|1028|`{}`|
|1029|`{}`|
|1030|`{}`|
|1031|`{}`|
|1032|`{}`|
|2001|`{}`|
|2002|`{}`|
|2003|`{}`|
|2004|`{}`|
|2005|`{}`|
|2006|`{}`|
|2007|`{}`|
|2008|`{}`|
|2009|`{}`|
|2010|`{}`|
|2011|`{}`|
|2012|`{}`|
|2013|`{}`|
|2014|`{}`|
|2015|`{}`|
|2016|`{}`|
|2017|`{}`|
|2018|`{}`|
|2019|`{}`|
|2020|`{}`|
|2021|`{}`|
|2022|`{}`|
|2023|`{}`|
|2024|`{}`|
|2025|`{}`|
|2026|`{}`|
|2027|`{}`|
|2028|`{}`|
|2029|`{}`|
|2030|`{}`|
|2031|`{}`|
|2032|`{}`|
|3001|`{}`|
|3002|`{}`|
|3003|`{}`|
|3004|`{}`|
|3005|`{}`|
|3006|`{}`|
|3007|`{}`|
|3008|`{}`|
|3009|`{}`|
|3010|`{}`|
|3011|`{}`|
|3012|`{}`|
|3013|`{}`|
|3014|`{}`|
|3015|`{}`|
|3016|`{}`|
|3017|`{}`|
|3018|`{}`|
|3019|`{}`|
|3020|`{}`|
|3021|`{}`|
|3022|`{}`|
|3023|`{}`|
|3024|`{}`|
|3025|`{}`|
|3026|`{}`|
|3027|`{}`|
|3028|`{}`|
|3029|`{}`|
|3030|`{}`|
|3031|`{}`|
|3032|`{}`|
|4001|`{}`|
|4002|`{}`|
|4003|`{}`|
|4004|`{}`|
|4005|`{}`|
|4006|`{}`|
|4007|`{}`|
|4008|`{}`|
|4009|`{}`|
|4010|`{}`|
|4011|`{}`|
|4012|`{}`|
|4013|`{}`|
|4014|`{}`|
|4015|`{}`|
|4016|`{}`|
|4017|`{}`|
|4018|`{}`|
|4019|`{}`|
|4020|`{}`|
|4021|`{}`|
|4022|`{}`|
|4023|`{}`|
|4024|`{}`|
|4025|`{}`|
|4026|`{}`|
|4027|`{}`|
|4028|`{}`|
|4029|`{}`|
|4030|`{}`|
|4031|`{}`|
|4032|`{}`|

## EmbedGroup

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|career_skill|number|110|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|quality|number|110|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr|number|110|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hero_career|number|110|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|110|本表行键；与其他表同值不自动代表同一对象。|
|campus|number|110|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"career_skill":290000003,"quality":0,"attr":41,"hero_career":2}`|
|102|`{"career_skill":290000001,"quality":0,"attr":37,"hero_career":4}`|
|103|`{"career_skill":290000004,"quality":0,"attr":40,"hero_career":2}`|
|104|`{"career_skill":290000002,"quality":0,"attr":36,"hero_career":4}`|
|105|`{"career_skill":0,"quality":0,"attr":41,"hero_career":0}`|
|106|`{"career_skill":0,"quality":0,"attr":42,"hero_career":0}`|
|107|`{"career_skill":0,"quality":0,"attr":40,"hero_career":0}`|
|108|`{"career_skill":0,"quality":0,"attr":36,"hero_career":0}`|
|109|`{"career_skill":0,"quality":0,"attr":41,"hero_career":0}`|
|110|`{"career_skill":0,"quality":0,"attr":37,"hero_career":0}`|
|111|`{"career_skill":0,"quality":0,"attr":40,"hero_career":0}`|
|112|`{"career_skill":0,"quality":0,"attr":39,"hero_career":0}`|
|113|`{"career_skill":0,"quality":0,"attr":41,"hero_career":0}`|
|114|`{"career_skill":0,"quality":0,"attr":37,"hero_career":0}`|
|115|`{"career_skill":0,"quality":0,"attr":40,"hero_career":0}`|
|116|`{"career_skill":0,"quality":0,"attr":36,"hero_career":0}`|
|117|`{"career_skill":0,"quality":0,"attr":40,"hero_career":0}`|
|118|`{"career_skill":0,"quality":0,"attr":39,"hero_career":0}`|
|119|`{"career_skill":0,"quality":0,"attr":40,"hero_career":0}`|
|120|`{"career_skill":0,"quality":0,"attr":36,"hero_career":0}`|
|121|`{"career_skill":0,"quality":0,"attr":41,"hero_career":0}`|
|122|`{"career_skill":0,"quality":0,"attr":40,"hero_career":0}`|
|123|`{"career_skill":0,"quality":0,"attr":37,"hero_career":0}`|
|124|`{"career_skill":0,"quality":0,"attr":38,"hero_career":0}`|
|125|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|126|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|127|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|128|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|129|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|130|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|131|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|132|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|133|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|134|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|135|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|136|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|137|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|138|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|139|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|140|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|141|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|142|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|143|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|144|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|145|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|146|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|147|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|148|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|149|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|150|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|151|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|152|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|153|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|154|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|155|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|201|`{"career_skill":290000007,"quality":0,"attr":42,"hero_career":1}`|
|202|`{"career_skill":290000005,"quality":0,"attr":38,"hero_career":3}`|
|203|`{"career_skill":290000008,"quality":0,"attr":39,"hero_career":1}`|
|204|`{"career_skill":290000006,"quality":0,"attr":35,"hero_career":3}`|
|205|`{"career_skill":0,"quality":0,"attr":37,"hero_career":0}`|
|206|`{"career_skill":0,"quality":0,"attr":38,"hero_career":0}`|
|207|`{"career_skill":0,"quality":0,"attr":39,"hero_career":0}`|
|208|`{"career_skill":0,"quality":0,"attr":35,"hero_career":0}`|
|209|`{"career_skill":0,"quality":0,"attr":42,"hero_career":0}`|
|210|`{"career_skill":0,"quality":0,"attr":38,"hero_career":0}`|
|211|`{"career_skill":0,"quality":0,"attr":36,"hero_career":0}`|
|212|`{"career_skill":0,"quality":0,"attr":35,"hero_career":0}`|
|213|`{"career_skill":0,"quality":0,"attr":42,"hero_career":0}`|
|214|`{"career_skill":0,"quality":0,"attr":38,"hero_career":0}`|
|215|`{"career_skill":0,"quality":0,"attr":39,"hero_career":0}`|
|216|`{"career_skill":0,"quality":0,"attr":35,"hero_career":0}`|
|217|`{"career_skill":0,"quality":0,"attr":36,"hero_career":0}`|
|218|`{"career_skill":0,"quality":0,"attr":35,"hero_career":0}`|
|219|`{"career_skill":0,"quality":0,"attr":39,"hero_career":0}`|
|220|`{"career_skill":0,"quality":0,"attr":35,"hero_career":0}`|
|221|`{"career_skill":0,"quality":0,"attr":42,"hero_career":0}`|
|222|`{"career_skill":0,"quality":0,"attr":39,"hero_career":0}`|
|223|`{"career_skill":0,"quality":0,"attr":36,"hero_career":0}`|
|224|`{"career_skill":0,"quality":0,"attr":35,"hero_career":0}`|
|225|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|226|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|227|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|228|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|229|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|230|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|231|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|232|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|233|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|234|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|235|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|236|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|237|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|238|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|239|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|240|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|241|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|242|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|243|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|244|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|245|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|246|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|247|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|248|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|249|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|250|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|251|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|252|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|253|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|254|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|
|255|`{"career_skill":0,"quality":0,"attr":0,"hero_career":0}`|

## EmbedCell

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|index|number|414|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|414|本表行键；与其他表同值不自动代表同一对象。|
|special_item|number|414|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|group|number|414|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部414行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10101|`{"special_item":33000402,"group":101}`|
|10102|`{"special_item":32000302,"group":101}`|
|10103|`{"special_item":32000402,"group":101}`|
