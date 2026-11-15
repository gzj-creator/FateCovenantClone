# MysteryShopTable 规则参数

来源：[personal-server/assets/tables/MysteryShopTable.data.json.gz](../../../../personal-server/assets/tables/MysteryShopTable.data.json.gz)，SHA256：`808a38cba85759e0e8e9a2de4c8660eaa8415d74680840483b7402ee89cd6459`。

[完整逐行JSON](MysteryShopTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[CellType](#celltype)|5|decoded-rows|
|[Cell](#cell)|14|decoded-rows|
|[ItemLib](#itemlib)|418|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[ManualRefresh](#manualrefresh)|5|decoded-rows|
|[DiscountLibType](#discountlibtype)|5|decoded-rows|
|[DiscountLib](#discountlib)|35|decoded-rows|

## CellType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|show_name|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|

## Cell

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|14|本表行键；与其他表同值不自动代表同一对象。|
|cell_show_type|number|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cell_lib_type|number|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pre_condition|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"cell_show_type":1,"cell_lib_type":1}`|
|2|`{"cell_show_type":1,"cell_lib_type":1}`|
|3|`{"cell_show_type":1,"cell_lib_type":1}`|
|4|`{"cell_show_type":1,"cell_lib_type":1}`|
|5|`{"cell_show_type":1,"cell_lib_type":1}`|
|6|`{"cell_show_type":3,"cell_lib_type":2}`|
|7|`{"cell_show_type":3,"cell_lib_type":2}`|
|8|`{"cell_show_type":3,"cell_lib_type":3,"pre_condition":983580210603}`|
|9|`{"cell_show_type":3,"cell_lib_type":3,"pre_condition":860748900009}`|
|10|`{"cell_show_type":3,"cell_lib_type":3,"pre_condition":860748900010}`|
|11|`{"cell_show_type":4,"cell_lib_type":4}`|
|12|`{"cell_show_type":4,"cell_lib_type":5}`|
|13|`{"cell_show_type":4,"cell_lib_type":5}`|
|14|`{"cell_show_type":4,"cell_lib_type":5}`|

## ItemLib

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|cost_item|number|418|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|count|number|418|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|item|number|418|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|discount_price|array|418|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|418|本表行键；与其他表同值不自动代表同一对象。|
|hero|number|418|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_rare_goods|boolean|418|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pre_condition|number|116|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部418行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10101001|`{"cost_item":101500,"count":5,"item":21300104,"discount_price":[600,570,540,510,480,450,420],"hero":1030101,"is_rare_goods":false}`|
|10101002|`{"cost_item":101500,"count":10,"item":21300104,"discount_price":[1200,1140,1080,1020,960,900,840],"hero":1030101,"is_rare_goods":false}`|
|10101003|`{"cost_item":101500,"count":5,"item":21300204,"discount_price":[600,570,540,510,480,450,420],"hero":1030201,"is_rare_goods":false}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|max_manual_refresh|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|buy_count_total|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|high_discount_up|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|bubble_cd_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hero_full_star_correct|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"max_manual_refresh":5,"buy_count_total":9,"high_discount_up":75,"hero_full_star_correct":5}`|

## ManualRefresh

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|price|number|5|原价格整数；RechargeTable现金商品消费者使用分，其他表必须核币种和单位。|
|currency_type|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"price":100,"currency_type":101500}`|
|2|`{"price":100,"currency_type":101500}`|
|3|`{"price":120,"currency_type":101500}`|
|4|`{"price":120,"currency_type":101500}`|
|5|`{"price":150,"currency_type":101500}`|

## DiscountLibType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|

## DiscountLib

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|discount_idx|number|35|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|discount|number|35|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|manual_refresh_cw|array|35|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|discount_lib_type|number|35|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|35|本表行键；与其他表同值不自动代表同一对象。|
|auto_refresh_weight|number|35|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"discount_idx":6,"discount":70,"manual_refresh_cw":[[2,0],[4,0],[5,0],[20,0]],"discount_lib_type":1,"auto_refresh_weight":0}`|
|2|`{"discount_idx":6,"discount":75,"manual_refresh_cw":[[2,0],[4,0],[5,0],[20,0]],"discount_lib_type":1,"auto_refresh_weight":0}`|
|3|`{"discount_idx":5,"discount":80,"manual_refresh_cw":[[2,240],[4,150],[5,110],[20,70]],"discount_lib_type":1,"auto_refresh_weight":180}`|
|4|`{"discount_idx":4,"discount":85,"manual_refresh_cw":[[2,160],[4,190],[5,130],[20,170]],"discount_lib_type":1,"auto_refresh_weight":240}`|
|5|`{"discount_idx":3,"discount":90,"manual_refresh_cw":[[2,160],[4,190],[5,210],[20,200]],"discount_lib_type":1,"auto_refresh_weight":180}`|
|6|`{"discount_idx":2,"discount":95,"manual_refresh_cw":[[2,200],[4,200],[5,250],[20,210]],"discount_lib_type":1,"auto_refresh_weight":200}`|
|7|`{"discount_idx":1,"discount":100,"manual_refresh_cw":[[2,240],[4,270],[5,300],[20,350]],"discount_lib_type":1,"auto_refresh_weight":200}`|
|8|`{"discount_idx":6,"discount":70,"manual_refresh_cw":[[2,0],[4,0],[5,0],[20,0]],"discount_lib_type":2,"auto_refresh_weight":0}`|
|9|`{"discount_idx":6,"discount":75,"manual_refresh_cw":[[2,0],[4,0],[5,0],[20,0]],"discount_lib_type":2,"auto_refresh_weight":0}`|
|10|`{"discount_idx":5,"discount":80,"manual_refresh_cw":[[2,160],[4,110],[5,50],[20,30]],"discount_lib_type":2,"auto_refresh_weight":200}`|
|11|`{"discount_idx":4,"discount":85,"manual_refresh_cw":[[2,200],[4,150],[5,130],[20,100]],"discount_lib_type":2,"auto_refresh_weight":150}`|
|12|`{"discount_idx":3,"discount":90,"manual_refresh_cw":[[2,210],[4,160],[5,150],[20,150]],"discount_lib_type":2,"auto_refresh_weight":120}`|
|13|`{"discount_idx":2,"discount":95,"manual_refresh_cw":[[2,110],[4,180],[5,220],[20,190]],"discount_lib_type":2,"auto_refresh_weight":230}`|
|14|`{"discount_idx":1,"discount":100,"manual_refresh_cw":[[2,320],[4,400],[5,450],[20,530]],"discount_lib_type":2,"auto_refresh_weight":300}`|
|15|`{"discount_idx":6,"discount":70,"manual_refresh_cw":[[2,0],[4,0],[5,0],[20,0]],"discount_lib_type":3,"auto_refresh_weight":0}`|
|16|`{"discount_idx":6,"discount":75,"manual_refresh_cw":[[2,0],[4,0],[5,0],[20,0]],"discount_lib_type":3,"auto_refresh_weight":0}`|
|17|`{"discount_idx":5,"discount":80,"manual_refresh_cw":[[2,60],[4,30],[5,30],[20,15]],"discount_lib_type":3,"auto_refresh_weight":90}`|
|18|`{"discount_idx":4,"discount":85,"manual_refresh_cw":[[2,90],[4,105],[5,50],[20,20]],"discount_lib_type":3,"auto_refresh_weight":90}`|
|19|`{"discount_idx":3,"discount":90,"manual_refresh_cw":[[2,150],[4,130],[5,100],[20,30]],"discount_lib_type":3,"auto_refresh_weight":200}`|
|20|`{"discount_idx":2,"discount":95,"manual_refresh_cw":[[2,210],[4,155],[5,170],[20,135]],"discount_lib_type":3,"auto_refresh_weight":200}`|
|21|`{"discount_idx":1,"discount":100,"manual_refresh_cw":[[2,490],[4,580],[5,650],[20,800]],"discount_lib_type":3,"auto_refresh_weight":420}`|
|22|`{"discount_idx":6,"discount":70,"manual_refresh_cw":[[2,0],[4,0],[5,0],[20,0]],"discount_lib_type":4,"auto_refresh_weight":0}`|
|23|`{"discount_idx":6,"discount":75,"manual_refresh_cw":[[2,0],[4,0],[5,0],[20,0]],"discount_lib_type":4,"auto_refresh_weight":0}`|
|24|`{"discount_idx":5,"discount":80,"manual_refresh_cw":[[2,0],[4,0],[5,0],[20,0]],"discount_lib_type":4,"auto_refresh_weight":0}`|
|25|`{"discount_idx":4,"discount":85,"manual_refresh_cw":[[2,0],[4,0],[5,0],[20,0]],"discount_lib_type":4,"auto_refresh_weight":0}`|
|26|`{"discount_idx":3,"discount":90,"manual_refresh_cw":[[2,150],[4,105],[5,50],[20,15]],"discount_lib_type":4,"auto_refresh_weight":200}`|
|27|`{"discount_idx":2,"discount":95,"manual_refresh_cw":[[2,200],[4,155],[5,120],[20,85]],"discount_lib_type":4,"auto_refresh_weight":200}`|
|28|`{"discount_idx":1,"discount":100,"manual_refresh_cw":[[2,650],[4,740],[5,830],[20,900]],"discount_lib_type":4,"auto_refresh_weight":600}`|
|29|`{"discount_idx":6,"discount":70,"manual_refresh_cw":[[2,0],[4,0],[5,0],[20,0]],"discount_lib_type":5,"auto_refresh_weight":0}`|
|30|`{"discount_idx":6,"discount":75,"manual_refresh_cw":[[2,0],[4,0],[5,0],[20,0]],"discount_lib_type":5,"auto_refresh_weight":0}`|
|31|`{"discount_idx":5,"discount":80,"manual_refresh_cw":[[2,0],[4,0],[5,0],[20,0]],"discount_lib_type":5,"auto_refresh_weight":0}`|
|32|`{"discount_idx":4,"discount":85,"manual_refresh_cw":[[2,0],[4,0],[5,0],[20,0]],"discount_lib_type":5,"auto_refresh_weight":0}`|
|33|`{"discount_idx":3,"discount":90,"manual_refresh_cw":[[2,0],[4,0],[5,0],[20,0]],"discount_lib_type":5,"auto_refresh_weight":0}`|
|34|`{"discount_idx":2,"discount":95,"manual_refresh_cw":[[2,1],[4,1],[5,1],[20,1]],"discount_lib_type":5,"auto_refresh_weight":1}`|
|35|`{"discount_idx":1,"discount":100,"manual_refresh_cw":[[2,1000],[4,1000],[5,1000],[20,1000]],"discount_lib_type":5,"auto_refresh_weight":1000}`|
