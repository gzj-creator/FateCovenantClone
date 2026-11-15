# BattleTriMatchHeroTable 规则参数

来源：[personal-server/assets/tables/BattleTriMatchHeroTable.data.lua.json.gz](../../../../personal-server/assets/tables/BattleTriMatchHeroTable.data.lua.json.gz)，SHA256：`cc21c5a91b837b292355319482ba909fdee36ce9874c9dc6a8ab018a303739d0`。

[完整逐行JSON](BattleTriMatchHeroTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[AttrType](#attrtype)|18|decoded-rows|
|[BattleTriMatchPowerConst](#battletrimatchpowerconst)|1|decoded-rows|
|[UpStar](#upstar)|78|decoded-rows|
|[AttrTemplate](#attrtemplate)|2|decoded-rows|
|[Attr](#attr)|1100|decoded-rows|
|[UpLevel](#uplevel)|550|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[Style](#style)|21|decoded-rows|
|[Profession](#profession)|3|decoded-rows|
|[Hero](#hero)|13|decoded-rows|
|[Camp](#camp)|5|decoded-rows|

## AttrType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|18|本表行键；与其他表同值不自动代表同一对象。|
|fight_attr|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_in_view|boolean|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|value_type|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_factor|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_type|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr_icon|string|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"fight_attr":1,"value_type":0,"show_type":0,"attr_icon":"icon_sx_yc_shengming.png"}`|
|2|`{"fight_attr":2,"value_type":0,"show_type":0,"attr_icon":"icon_sx_yc_gongji.png"}`|
|3|`{"fight_attr":3,"value_type":0,"show_type":0,"attr_icon":"icon_sx_yc_fangyu.png"}`|
|4|`{"fight_attr":0,"value_type":1,"show_type":1,"attr_icon":"icon_sx_yc_shengmingbaifenbi.png"}`|
|5|`{"fight_attr":0,"value_type":1,"show_type":1,"attr_icon":"icon_sx_yc_gongjibaifenbi.png"}`|
|6|`{"fight_attr":0,"value_type":1,"show_type":1,"attr_icon":"icon_sx_yc_fangyubaifenbi.png"}`|
|7|`{"fight_attr":0,"value_type":1,"show_type":1,"attr_icon":""}`|
|8|`{"fight_attr":0,"value_type":1,"show_type":1,"attr_icon":""}`|
|9|`{"fight_attr":0,"value_type":1,"show_type":1,"attr_icon":""}`|
|10|`{"fight_attr":19,"value_type":1,"show_type":1,"attr_icon":"icon_sx_yc_shanghaizengjia.png"}`|
|11|`{"fight_attr":20,"value_type":1,"show_type":1,"attr_icon":"icon_sx_yc_shanghaijianmian.png"}`|
|12|`{"fight_attr":0,"value_type":1,"show_type":1,"attr_icon":""}`|
|13|`{"fight_attr":0,"value_type":1,"show_type":1,"attr_icon":""}`|
|14|`{"fight_attr":0,"value_type":1,"show_type":1,"attr_icon":""}`|
|15|`{"fight_attr":0,"value_type":1,"show_type":1,"attr_icon":""}`|
|16|`{"fight_attr":0,"value_type":1,"show_type":1,"attr_icon":""}`|
|17|`{"fight_attr":0,"value_type":0,"show_type":0,"attr_icon":""}`|
|18|`{"fight_attr":5,"value_type":0,"show_type":0,"attr_icon":""}`|

## BattleTriMatchPowerConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|hp_ratio|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|atk_ratio|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|def_ratio|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|damage_add_ratio|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|damage_sub__ratio|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"hp_ratio":1,"damage_add_ratio":100,"damage_sub__ratio":100}`|

## UpStar

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|78|本表行键；与其他表同值不自动代表同一对象。|
|hero|number|78|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|star|number|78|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cost_item|object/array|78|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|attr|array|78|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ability|array|78|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_show|array|78|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"hero":10014600,"star":0,"cost_item":{"global":"TableEmpty"},"attr":[[5,0],[4,0],[6,0]],"ability":[4,5,6],"is_show":[false,true,true,true,true,false,false]}`|
|2|`{"hero":10014600,"star":1,"cost_item":[[10014700,40],[835402,50]],"attr":[[5,2000],[4,2000],[6,2000]],"ability":[4,5,7,6],"is_show":[false,true,true,true,true,false,false]}`|
|3|`{"hero":10014600,"star":2,"cost_item":[[10014700,80],[835402,100],[835502,20]],"attr":[[5,3000],[4,3000],[6,3000]],"ability":[4,8,7,6],"is_show":[false,true,true,true,true,false,false]}`|
|4|`{"hero":10014600,"star":3,"cost_item":[[10014700,160],[835402,150],[835502,40]],"attr":[[5,4000],[4,4000],[6,4000]],"ability":[4,8,7,9,6],"is_show":[false,true,true,true,true,false,false]}`|
|5|`{"hero":10014600,"star":4,"cost_item":[[10014700,360],[835402,200],[835502,60]],"attr":[[5,6000],[4,6000],[6,6000]],"ability":[4,10,7,9,6],"is_show":[false,true,true,true,true,false,false]}`|
|6|`{"hero":10014600,"star":5,"cost_item":[[10014700,800],[835402,250],[835502,80]],"attr":[[5,10000],[4,10000],[6,10000]],"ability":[4,10,7,9,11,6],"is_show":[false,true,true,true,true,false,false]}`|
|21|`{"hero":10024600,"star":0,"cost_item":{"global":"TableEmpty"},"attr":[[5,0],[4,0],[6,0]],"ability":[12,13,14],"is_show":[false,true,true,true,true,false,false]}`|
|22|`{"hero":10024600,"star":1,"cost_item":[[10024700,40],[835402,50]],"attr":[[5,2000],[4,2000],[6,2000]],"ability":[12,13,15,14],"is_show":[false,true,true,true,true,false,false]}`|
|23|`{"hero":10024600,"star":2,"cost_item":[[10024700,80],[835402,100],[835502,20]],"attr":[[5,3000],[4,3000],[6,3000]],"ability":[12,16,15,14],"is_show":[false,true,true,true,true,false,false]}`|
|24|`{"hero":10024600,"star":3,"cost_item":[[10024700,160],[835402,150],[835502,40]],"attr":[[5,4000],[4,4000],[6,4000]],"ability":[12,16,15,17,14],"is_show":[false,true,true,true,true,false,false]}`|
|25|`{"hero":10024600,"star":4,"cost_item":[[10024700,360],[835402,200],[835502,60]],"attr":[[5,6000],[4,6000],[6,6000]],"ability":[12,18,15,17,14],"is_show":[false,true,true,true,true,false,false]}`|
|26|`{"hero":10024600,"star":5,"cost_item":[[10024700,800],[835402,250],[835502,80]],"attr":[[5,10000],[4,10000],[6,10000]],"ability":[12,18,15,17,19,14],"is_show":[false,true,true,true,true,false,false]}`|
|31|`{"hero":10034600,"star":0,"cost_item":{"global":"TableEmpty"},"attr":[[5,0],[4,0],[6,0]],"ability":[20,21],"is_show":[false,true,true,true,true,false,false]}`|
|32|`{"hero":10034600,"star":1,"cost_item":[[10034700,40],[835402,50]],"attr":[[5,2000],[4,2000],[6,2000]],"ability":[20,21,22],"is_show":[false,true,true,true,true,false,false]}`|
|33|`{"hero":10034600,"star":2,"cost_item":[[10034700,80],[835402,100],[835502,20]],"attr":[[5,3000],[4,3000],[6,3000]],"ability":[20,23,22],"is_show":[false,true,true,true,true,false,false]}`|
|34|`{"hero":10034600,"star":3,"cost_item":[[10034700,160],[835402,150],[835502,40]],"attr":[[5,4000],[4,4000],[6,4000]],"ability":[20,23,22,24],"is_show":[false,true,true,true,true,false,false]}`|
|35|`{"hero":10034600,"star":4,"cost_item":[[10034700,360],[835402,200],[835502,60]],"attr":[[5,6000],[4,6000],[6,6000]],"ability":[20,25,22,24],"is_show":[false,true,true,true,true,false,false]}`|
|36|`{"hero":10034600,"star":5,"cost_item":[[10034700,800],[835402,250],[835502,80]],"attr":[[5,10000],[4,10000],[6,10000]],"ability":[20,25,22,24,26],"is_show":[false,true,true,true,true,false,false]}`|
|41|`{"hero":10044600,"star":0,"cost_item":{"global":"TableEmpty"},"attr":[[5,0],[4,0],[6,0]],"ability":[27,28,29],"is_show":[false,true,true,true,true,false,false]}`|
|42|`{"hero":10044600,"star":1,"cost_item":[[10044700,40],[835402,50]],"attr":[[5,2000],[4,2000],[6,2000]],"ability":[27,28,30,29],"is_show":[false,true,true,true,true,false,false]}`|
|43|`{"hero":10044600,"star":2,"cost_item":[[10044700,80],[835402,100],[835502,20]],"attr":[[5,3000],[4,3000],[6,3000]],"ability":[27,31,30,29],"is_show":[false,true,true,true,true,false,false]}`|
|44|`{"hero":10044600,"star":3,"cost_item":[[10044700,160],[835402,150],[835502,40]],"attr":[[5,4000],[4,4000],[6,4000]],"ability":[27,31,30,32,29],"is_show":[false,true,true,true,true,false,false]}`|
|45|`{"hero":10044600,"star":4,"cost_item":[[10044700,360],[835402,200],[835502,60]],"attr":[[5,6000],[4,6000],[6,6000]],"ability":[27,33,30,32,29],"is_show":[false,true,true,true,true,false,false]}`|
|46|`{"hero":10044600,"star":5,"cost_item":[[10044700,800],[835402,250],[835502,80]],"attr":[[5,10000],[4,10000],[6,10000]],"ability":[27,33,30,32,34,29],"is_show":[false,true,true,true,true,false,false]}`|
|51|`{"hero":10054600,"star":0,"cost_item":{"global":"TableEmpty"},"attr":[[5,0],[4,0],[6,0]],"ability":[35,36,37],"is_show":[false,true,true,true,true,false,false]}`|
|52|`{"hero":10054600,"star":1,"cost_item":[[10054700,40],[835402,50]],"attr":[[5,2000],[4,2000],[6,2000]],"ability":[35,36,38,37],"is_show":[false,true,true,true,true,false,false]}`|
|53|`{"hero":10054600,"star":2,"cost_item":[[10054700,80],[835402,100],[835502,20]],"attr":[[5,3000],[4,3000],[6,3000]],"ability":[35,39,38,37],"is_show":[false,true,true,true,true,false,false]}`|
|54|`{"hero":10054600,"star":3,"cost_item":[[10054700,160],[835402,150],[835502,40]],"attr":[[5,4000],[4,4000],[6,4000]],"ability":[35,39,38,40,37],"is_show":[false,true,true,true,true,false,false]}`|
|55|`{"hero":10054600,"star":4,"cost_item":[[10054700,360],[835402,200],[835502,60]],"attr":[[5,6000],[4,6000],[6,6000]],"ability":[35,41,38,40,37],"is_show":[false,true,true,true,true,false,false]}`|
|56|`{"hero":10054600,"star":5,"cost_item":[[10054700,800],[835402,250],[835502,80]],"attr":[[5,10000],[4,10000],[6,10000]],"ability":[35,41,38,40,42,37],"is_show":[false,true,true,true,true,false,false]}`|
|61|`{"hero":10064600,"star":0,"cost_item":{"global":"TableEmpty"},"attr":[[5,0],[4,0],[6,0]],"ability":[43,44,45],"is_show":[false,true,true,true,true,false,false]}`|
|62|`{"hero":10064600,"star":1,"cost_item":[[10064700,40],[835402,50]],"attr":[[5,2000],[4,2000],[6,2000]],"ability":[43,44,46,45],"is_show":[false,true,true,true,true,false,false]}`|
|63|`{"hero":10064600,"star":2,"cost_item":[[10064700,80],[835402,100],[835502,20]],"attr":[[5,3000],[4,3000],[6,3000]],"ability":[43,47,46,45],"is_show":[false,true,true,true,true,false,false]}`|
|64|`{"hero":10064600,"star":3,"cost_item":[[10064700,160],[835402,150],[835502,40]],"attr":[[5,4000],[4,4000],[6,4000]],"ability":[43,47,46,48,45],"is_show":[false,true,true,true,true,false,false]}`|
|65|`{"hero":10064600,"star":4,"cost_item":[[10064700,360],[835402,200],[835502,60]],"attr":[[5,6000],[4,6000],[6,6000]],"ability":[43,49,46,48,45],"is_show":[false,true,true,true,true,false,false]}`|
|66|`{"hero":10064600,"star":5,"cost_item":[[10064700,800],[835402,250],[835502,80]],"attr":[[5,10000],[4,10000],[6,10000]],"ability":[43,49,46,48,50,45],"is_show":[false,true,true,true,true,false,false]}`|
|71|`{"hero":10074600,"star":0,"cost_item":{"global":"TableEmpty"},"attr":[[5,0],[4,0],[6,0]],"ability":[51,52,53],"is_show":[false,true,true,true,true,false,false]}`|
|72|`{"hero":10074600,"star":1,"cost_item":[[10074700,40],[835402,50]],"attr":[[5,2000],[4,2000],[6,2000]],"ability":[51,52,55,53],"is_show":[false,true,true,true,true,false,false]}`|
|73|`{"hero":10074600,"star":2,"cost_item":[[10074700,80],[835402,100],[835502,20]],"attr":[[5,3000],[4,3000],[6,3000]],"ability":[51,56,55,53],"is_show":[false,true,true,true,true,false,false]}`|
|74|`{"hero":10074600,"star":3,"cost_item":[[10074700,160],[835402,150],[835502,40]],"attr":[[5,4000],[4,4000],[6,4000]],"ability":[51,56,55,57,53],"is_show":[false,true,true,true,true,false,false]}`|
|75|`{"hero":10074600,"star":4,"cost_item":[[10074700,360],[835402,200],[835502,60]],"attr":[[5,6000],[4,6000],[6,6000]],"ability":[51,58,55,57,53],"is_show":[false,true,true,true,true,false,false]}`|
|76|`{"hero":10074600,"star":5,"cost_item":[[10074700,800],[835402,250],[835502,80]],"attr":[[5,10000],[4,10000],[6,10000]],"ability":[51,58,55,57,59,53],"is_show":[false,true,true,true,true,false,false]}`|
|81|`{"hero":10084600,"star":0,"cost_item":{"global":"TableEmpty"},"attr":[[5,0],[4,0],[6,0]],"ability":[60,61,62],"is_show":[false,true,true,true,true,false,false]}`|
|82|`{"hero":10084600,"star":1,"cost_item":[[10084700,40],[835402,50]],"attr":[[5,2000],[4,2000],[6,2000]],"ability":[60,61,64,62],"is_show":[false,true,true,true,true,false,false]}`|
|83|`{"hero":10084600,"star":2,"cost_item":[[10084700,80],[835402,100],[835502,20]],"attr":[[5,3000],[4,3000],[6,3000]],"ability":[60,65,64,62],"is_show":[false,true,true,true,true,false,false]}`|
|84|`{"hero":10084600,"star":3,"cost_item":[[10084700,160],[835402,150],[835502,40]],"attr":[[5,4000],[4,4000],[6,4000]],"ability":[60,65,64,66,62],"is_show":[false,true,true,true,true,false,false]}`|
|85|`{"hero":10084600,"star":4,"cost_item":[[10084700,360],[835402,200],[835502,60]],"attr":[[5,6000],[4,6000],[6,6000]],"ability":[60,67,64,66,62],"is_show":[false,true,true,true,true,false,false]}`|
|86|`{"hero":10084600,"star":5,"cost_item":[[10084700,800],[835402,250],[835502,80]],"attr":[[5,10000],[4,10000],[6,10000]],"ability":[60,67,64,66,68,62],"is_show":[false,true,true,true,true,false,false]}`|
|87|`{"hero":10094600,"star":0,"cost_item":{"global":"TableEmpty"},"attr":[[5,0],[4,0],[6,0]],"ability":[69,70,72],"is_show":[false,true,true,true,true,false,false]}`|
|88|`{"hero":10094600,"star":1,"cost_item":[[10094700,40],[835402,50]],"attr":[[5,2000],[4,2000],[6,2000]],"ability":[69,70,73,72],"is_show":[false,true,true,true,true,false,false]}`|
|89|`{"hero":10094600,"star":2,"cost_item":[[10094700,80],[835402,100],[835502,20]],"attr":[[5,3000],[4,3000],[6,3000]],"ability":[69,74,73,72],"is_show":[false,true,true,true,true,false,false]}`|
|90|`{"hero":10094600,"star":3,"cost_item":[[10094700,160],[835402,150],[835502,40]],"attr":[[5,4000],[4,4000],[6,4000]],"ability":[69,74,73,75,72],"is_show":[false,true,true,true,true,false,false]}`|
|91|`{"hero":10094600,"star":4,"cost_item":[[10094700,360],[835402,200],[835502,60]],"attr":[[5,6000],[4,6000],[6,6000]],"ability":[69,76,73,75,72],"is_show":[false,true,true,true,true,false,false]}`|
|92|`{"hero":10094600,"star":5,"cost_item":[[10094700,800],[835402,250],[835502,80]],"attr":[[5,10000],[4,10000],[6,10000]],"ability":[69,76,73,75,77,72],"is_show":[false,true,true,true,true,false,false]}`|
|93|`{"hero":10104600,"star":0,"cost_item":{"global":"TableEmpty"},"attr":[[5,0],[4,0],[6,0]],"ability":[78,79,80],"is_show":[false,true,true,true,true,false,false]}`|
|94|`{"hero":10104600,"star":1,"cost_item":[[10104700,40],[835402,50]],"attr":[[5,2000],[4,2000],[6,2000]],"ability":[78,79,81,80],"is_show":[false,true,true,true,true,false,false]}`|
|95|`{"hero":10104600,"star":2,"cost_item":[[10104700,80],[835402,100],[835502,20]],"attr":[[5,3000],[4,3000],[6,3000]],"ability":[78,82,81,80],"is_show":[false,true,true,true,true,false,false]}`|
|96|`{"hero":10104600,"star":3,"cost_item":[[10104700,160],[835402,150],[835502,40]],"attr":[[5,4000],[4,4000],[6,4000]],"ability":[78,82,81,83,80],"is_show":[false,true,true,true,true,false,false]}`|
|97|`{"hero":10104600,"star":4,"cost_item":[[10104700,360],[835402,200],[835502,60]],"attr":[[5,6000],[4,6000],[6,6000]],"ability":[78,84,81,83,80],"is_show":[false,true,true,true,true,false,false]}`|
|98|`{"hero":10104600,"star":5,"cost_item":[[10104700,800],[835402,250],[835502,80]],"attr":[[5,10000],[4,10000],[6,10000]],"ability":[78,84,81,83,85,80],"is_show":[false,true,true,true,true,false,false]}`|
|99|`{"hero":10114600,"star":0,"cost_item":{"global":"TableEmpty"},"attr":[[5,0],[4,0],[6,0]],"ability":[86,87,88],"is_show":[false,true,true,true,true,false,false]}`|
|100|`{"hero":10114600,"star":1,"cost_item":[[10114700,40],[835402,50]],"attr":[[5,2000],[4,2000],[6,2000]],"ability":[86,87,89,88],"is_show":[false,true,true,true,true,false,false]}`|
|101|`{"hero":10114600,"star":2,"cost_item":[[10114700,80],[835402,100],[835502,20]],"attr":[[5,3000],[4,3000],[6,3000]],"ability":[86,90,89,88],"is_show":[false,true,true,true,true,false,false]}`|
|102|`{"hero":10114600,"star":3,"cost_item":[[10114700,160],[835402,150],[835502,40]],"attr":[[5,4000],[4,4000],[6,4000]],"ability":[86,90,89,91,88],"is_show":[false,true,true,true,true,false,false]}`|
|103|`{"hero":10114600,"star":4,"cost_item":[[10114700,360],[835402,200],[835502,60]],"attr":[[5,6000],[4,6000],[6,6000]],"ability":[86,92,89,91,88],"is_show":[false,true,true,true,true,false,false]}`|
|104|`{"hero":10114600,"star":5,"cost_item":[[10114700,800],[835402,250],[835502,80]],"attr":[[5,10000],[4,10000],[6,10000]],"ability":[86,92,89,91,93,88],"is_show":[false,true,true,true,true,false,false]}`|
|105|`{"hero":10124600,"star":0,"cost_item":{"global":"TableEmpty"},"attr":[[5,0],[4,0],[6,0]],"ability":[94,95,96],"is_show":[false,true,true,true,true,false,false]}`|
|106|`{"hero":10124600,"star":1,"cost_item":[[10124700,40],[835402,50]],"attr":[[5,2000],[4,2000],[6,2000]],"ability":[94,95,97,96],"is_show":[false,true,true,true,true,false,false]}`|
|107|`{"hero":10124600,"star":2,"cost_item":[[10124700,80],[835402,100],[835502,20]],"attr":[[5,3000],[4,3000],[6,3000]],"ability":[94,98,97,96],"is_show":[false,true,true,true,true,false,false]}`|
|108|`{"hero":10124600,"star":3,"cost_item":[[10124700,160],[835402,150],[835502,40]],"attr":[[5,4000],[4,4000],[6,4000]],"ability":[94,98,97,99,96],"is_show":[false,true,true,true,true,false,false]}`|
|109|`{"hero":10124600,"star":4,"cost_item":[[10124700,360],[835402,200],[835502,60]],"attr":[[5,6000],[4,6000],[6,6000]],"ability":[94,100,97,99,96],"is_show":[false,true,true,true,true,false,false]}`|
|110|`{"hero":10124600,"star":5,"cost_item":[[10124700,800],[835402,250],[835502,80]],"attr":[[5,10000],[4,10000],[6,10000]],"ability":[94,100,97,99,101,96],"is_show":[false,true,true,true,true,false,false]}`|
|111|`{"hero":10134600,"star":0,"cost_item":{"global":"TableEmpty"},"attr":[[5,0],[4,0],[6,0],[10,1000],[11,1000]],"ability":[102,103,105],"is_show":[false,true,true,true,true,false,false]}`|
|112|`{"hero":10134600,"star":1,"cost_item":[[10134700,40],[835402,50]],"attr":[[5,2000],[4,2000],[6,2000],[10,1200],[11,1200]],"ability":[102,103,106,105],"is_show":[false,true,true,true,true,false,false]}`|
|113|`{"hero":10134600,"star":2,"cost_item":[[10134700,80],[835402,100],[835502,20]],"attr":[[5,3000],[4,3000],[6,3000],[10,1400],[11,1400]],"ability":[102,107,106,105],"is_show":[false,true,true,true,true,false,false]}`|
|114|`{"hero":10134600,"star":3,"cost_item":[[10134700,160],[835402,150],[835502,40]],"attr":[[5,4000],[4,4000],[6,4000],[10,1600],[11,1600]],"ability":[102,107,106,108,105],"is_show":[false,true,true,true,true,false,false]}`|
|115|`{"hero":10134600,"star":4,"cost_item":[[10134700,360],[835402,200],[835502,60]],"attr":[[5,6000],[4,6000],[6,6000],[10,1800],[11,1800]],"ability":[102,109,106,108,105],"is_show":[false,true,true,true,true,false,false]}`|
|116|`{"hero":10134600,"star":5,"cost_item":[[10134700,800],[835402,250],[835502,80]],"attr":[[5,10000],[4,10000],[6,10000],[10,2000],[11,2000]],"ability":[102,109,106,108,110,105],"is_show":[false,true,true,true,true,false,false]}`|

## AttrTemplate

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|

## Attr

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1100|本表行键；与其他表同值不自动代表同一对象。|
|template|number|1100|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|level_tid|number|1100|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr|array|1100|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部1100行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"level_tid":1,"attr":[[1,200],[2,20],[3,4]]}`|
|2|`{"level_tid":2,"attr":[[1,250],[2,30],[3,5]]}`|
|3|`{"level_tid":3,"attr":[[1,300],[2,30],[3,6]]}`|

## UpLevel

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|550|本表行键；与其他表同值不自动代表同一对象。|
|level|number|550|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_break|boolean|550|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cost_item|array|550|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|

下列3行用于说明结构；全部550行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"level":1,"is_break":false,"cost_item":[]}`|
|2|`{"level":2,"is_break":false,"cost_item":[[835202,30]]}`|
|3|`{"level":3,"is_break":false,"cost_item":[[835202,60]]}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|cell_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camp_all_icon|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"cell_count":4}`|

## Style

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|21|本表行键；与其他表同值不自动代表同一对象。|
|prefab|string|21|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|icon|string|21|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|head_icon|string|21|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

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
|8000001|`{}`|
|8000002|`{}`|
|8000003|`{}`|
|8000004|`{}`|
|8000005|`{}`|
|8000006|`{}`|
|8000007|`{}`|
|8000008|`{}`|

## Profession

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|show_name|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|job_icon|string|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|job_di|string|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr|array|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"attr":[[12,12000],[13,8000],[14,10000]]}`|
|2|`{"attr":[[12,11000],[13,9000],[14,10000]]}`|
|3|`{"attr":[[12,8000],[13,12000],[14,10000]]}`|

## Hero

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|13|本表行键；与其他表同值不自动代表同一对象。|
|show_name|number|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|quality|number|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|profession|number|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camp|number|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|style|number|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr_template|number|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hero_position|number|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hero_position_di|string|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10014600|`{"quality":60,"attr_template":1,"hero_position":7900038,"hero_position_di":"img_tips_bq_huang.png"}`|
|10024600|`{"quality":60,"attr_template":1,"hero_position":7900039,"hero_position_di":"img_tips_bq_huang.png"}`|
|10034600|`{"quality":60,"attr_template":1,"hero_position":7900040,"hero_position_di":"img_tips_bq_zhongjei.png"}`|
|10044600|`{"quality":60,"attr_template":1,"hero_position":7900045,"hero_position_di":"img_tips_bq_huang.png"}`|
|10054600|`{"quality":60,"attr_template":1,"hero_position":7900046,"hero_position_di":"img_tips_bq_huang.png"}`|
|10064600|`{"quality":60,"attr_template":1,"hero_position":7900047,"hero_position_di":"img_tips_bq_zhongjei.png"}`|
|10074600|`{"quality":60,"attr_template":1,"hero_position":7900049,"hero_position_di":"img_tips_bq_huang.png"}`|
|10084600|`{"quality":60,"attr_template":1,"hero_position":7900050,"hero_position_di":"img_tips_bq_huang.png"}`|
|10094600|`{"quality":60,"attr_template":1,"hero_position":7900051,"hero_position_di":"img_tips_bq_zhongjei.png"}`|
|10104600|`{"quality":60,"attr_template":1,"hero_position":7900056,"hero_position_di":"img_tips_bq_huang.png"}`|
|10114600|`{"quality":60,"attr_template":1,"hero_position":7900057,"hero_position_di":"img_tips_bq_huang.png"}`|
|10124600|`{"quality":60,"attr_template":1,"hero_position":7900058,"hero_position_di":"img_tips_bq_zhongjei.png"}`|
|10134600|`{"quality":70,"attr_template":2,"hero_position":666989,"hero_position_di":"img_tips_bq_pugong.png"}`|

## Camp

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|show_name|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camp_icon|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|
