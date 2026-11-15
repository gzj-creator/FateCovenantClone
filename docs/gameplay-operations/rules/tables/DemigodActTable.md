# DemigodActTable 规则参数

来源：[personal-server/assets/tables/DemigodActTable.data.json.gz](../../../../personal-server/assets/tables/DemigodActTable.data.json.gz)，SHA256：`08e71b67bf002d54bd82893c28fc3d57b37c4f6799f0792e266131e2e7abd803`。

[完整逐行JSON](DemigodActTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Shop](#shop)|38|decoded-rows|
|[Show](#show)|168|decoded-rows|
|[DrawWish](#drawwish)|21|decoded-rows|
|[Draw](#draw)|38|decoded-rows|
|[DrawFantasy](#drawfantasy)|38|decoded-rows|
|[DrawAward](#drawaward)|454|decoded-rows|
|[Gift](#gift)|38|decoded-rows|
|[DemigodAct](#demigodact)|38|decoded-rows|
|[DrawShowStyle](#drawshowstyle)|38|decoded-rows|
|[DrawGodShowStyle](#drawgodshowstyle)|7|decoded-rows|
|[PreShow](#preshow)|38|decoded-rows|
|[DemigodTrialDamage](#demigodtrialdamage)|438|decoded-rows|
|[DemigodTrialBless](#demigodtrialbless)|2|decoded-rows|
|[DemigodTrialStar](#demigodtrialstar)|17|decoded-rows|
|[DemigodTrialLevel](#demigodtriallevel)|320|decoded-rows|
|[DemigodTrial](#demigodtrial)|73|decoded-rows|

## Shop

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|38|本表行键；与其他表同值不自动代表同一对象。|
|shop_item|number|38|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"shop_item":0}`|
|2|`{"shop_item":0}`|
|3|`{"shop_item":0}`|
|4|`{"shop_item":0}`|
|5|`{"shop_item":0}`|
|6|`{"shop_item":0}`|
|7|`{"shop_item":3601900}`|
|8|`{"shop_item":3601900}`|
|9|`{"shop_item":3601900}`|
|10|`{"shop_item":3601900}`|
|11|`{"shop_item":3601900}`|
|12|`{"shop_item":3601900}`|
|13|`{"shop_item":3601900}`|
|14|`{"shop_item":3601900}`|
|15|`{"shop_item":3601900}`|
|16|`{"shop_item":3601900}`|
|17|`{"shop_item":3601900}`|
|18|`{"shop_item":3601900}`|
|19|`{"shop_item":3601900}`|
|20|`{"shop_item":3601900}`|
|21|`{"shop_item":3601900}`|
|22|`{"shop_item":3601900}`|
|23|`{"shop_item":3601900}`|
|24|`{"shop_item":3601900}`|
|25|`{"shop_item":3601900}`|
|26|`{"shop_item":3601900}`|
|27|`{"shop_item":6831900}`|
|28|`{"shop_item":3601900}`|
|29|`{"shop_item":6831900}`|
|30|`{"shop_item":6831900}`|
|31|`{"shop_item":6831900}`|
|32|`{"shop_item":6831900}`|
|33|`{"shop_item":6831900}`|
|34|`{"shop_item":6831900}`|
|35|`{"shop_item":6911900}`|
|36|`{"shop_item":6911900}`|
|37|`{"shop_item":6831900}`|
|38|`{"shop_item":6831900}`|

## Show

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|scale|number|168|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|wish_loc|undefined|168|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|undefined|168|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|demigod|number|168|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|168|本表行键；与其他表同值不自动代表同一对象。|
|version|number|168|版本引用；必须按活动类型及其消费者查对应版本表。|
|show_prefab|string|168|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|wish_scale|number|168|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"version":1,"wish_scale":0.9}`|
|2|`{"version":1,"wish_scale":0.9}`|
|3|`{"version":1,"wish_scale":0.9}`|
|4|`{"version":1,"wish_scale":0.9}`|
|5|`{"version":1,"wish_scale":0.9}`|
|6|`{"version":1,"wish_scale":0.9}`|
|7|`{"version":2,"wish_scale":0.9}`|
|8|`{"version":2,"wish_scale":0.9}`|
|9|`{"version":2,"wish_scale":0.9}`|
|10|`{"version":2,"wish_scale":0.9}`|
|11|`{"version":2,"wish_scale":0.9}`|
|12|`{"version":2,"wish_scale":0.9}`|
|13|`{"version":3,"wish_scale":0.9}`|
|14|`{"version":3,"wish_scale":0.9}`|
|15|`{"version":3,"wish_scale":0.9}`|
|16|`{"version":3,"wish_scale":0.9}`|
|17|`{"version":3,"wish_scale":0.9}`|
|18|`{"version":3,"wish_scale":0.9}`|
|19|`{"version":4,"wish_scale":0.9}`|
|20|`{"version":4,"wish_scale":0.9}`|
|21|`{"version":4,"wish_scale":0.9}`|
|22|`{"version":4,"wish_scale":0.9}`|
|23|`{"version":4,"wish_scale":0.9}`|
|24|`{"version":4,"wish_scale":0.9}`|
|25|`{"version":5,"wish_scale":0.85}`|
|26|`{"version":5,"wish_scale":0.9}`|
|27|`{"version":5,"wish_scale":0.9}`|
|28|`{"version":5,"wish_scale":0.9}`|
|29|`{"version":5,"wish_scale":0.9}`|
|30|`{"version":5,"wish_scale":0.9}`|
|31|`{"version":6,"wish_scale":0.9}`|
|32|`{"version":6,"wish_scale":0.9}`|
|33|`{"version":6,"wish_scale":0.9}`|
|34|`{"version":6,"wish_scale":0.9}`|
|35|`{"version":6,"wish_scale":0.9}`|
|36|`{"version":6,"wish_scale":0.9}`|
|37|`{"version":7,"wish_scale":0.9}`|
|38|`{"version":7,"wish_scale":0.9}`|
|39|`{"version":7,"wish_scale":0.9}`|
|40|`{"version":7,"wish_scale":0.9}`|
|41|`{"version":7,"wish_scale":0.9}`|
|42|`{"version":7,"wish_scale":0.9}`|
|43|`{"version":8,"wish_scale":0.9}`|
|44|`{"version":8,"wish_scale":0.9}`|
|45|`{"version":8,"wish_scale":0.9}`|
|46|`{"version":8,"wish_scale":0.9}`|
|47|`{"version":8,"wish_scale":0.9}`|
|48|`{"version":8,"wish_scale":0.9}`|
|49|`{"version":9,"wish_scale":0.9}`|
|50|`{"version":9,"wish_scale":0.9}`|
|51|`{"version":9,"wish_scale":0.9}`|
|52|`{"version":9,"wish_scale":0.9}`|
|53|`{"version":9,"wish_scale":0.9}`|
|54|`{"version":9,"wish_scale":0.9}`|
|55|`{"version":10,"wish_scale":0.9}`|
|56|`{"version":10,"wish_scale":0.9}`|
|57|`{"version":10,"wish_scale":0.9}`|
|58|`{"version":10,"wish_scale":0.9}`|
|59|`{"version":10,"wish_scale":0.9}`|
|60|`{"version":10,"wish_scale":0.9}`|
|61|`{"version":11,"wish_scale":0.9}`|
|62|`{"version":11,"wish_scale":0.9}`|
|63|`{"version":11,"wish_scale":0.9}`|
|64|`{"version":11,"wish_scale":0.9}`|
|65|`{"version":11,"wish_scale":0.9}`|
|66|`{"version":11,"wish_scale":0.9}`|
|67|`{"version":12,"wish_scale":0.9}`|
|68|`{"version":12,"wish_scale":0.9}`|
|69|`{"version":12,"wish_scale":0.9}`|
|70|`{"version":12,"wish_scale":0.9}`|
|71|`{"version":12,"wish_scale":0.9}`|
|72|`{"version":12,"wish_scale":0.9}`|
|73|`{"version":13,"wish_scale":0.85}`|
|74|`{"version":13,"wish_scale":0.9}`|
|75|`{"version":13,"wish_scale":0.9}`|
|76|`{"version":13,"wish_scale":0.9}`|
|77|`{"version":13,"wish_scale":0.9}`|
|78|`{"version":13,"wish_scale":0.9}`|
|79|`{"version":14,"wish_scale":0.9}`|
|80|`{"version":14,"wish_scale":0.9}`|
|81|`{"version":14,"wish_scale":0.9}`|
|82|`{"version":14,"wish_scale":0.9}`|
|83|`{"version":14,"wish_scale":0.9}`|
|84|`{"version":14,"wish_scale":0.9}`|
|85|`{"version":15,"wish_scale":0.9}`|
|86|`{"version":15,"wish_scale":0.9}`|
|87|`{"version":15,"wish_scale":0.9}`|
|88|`{"version":15,"wish_scale":0.9}`|
|89|`{"version":15,"wish_scale":0.9}`|
|90|`{"version":15,"wish_scale":0.9}`|
|91|`{"version":16,"wish_scale":0.9}`|
|92|`{"version":16,"wish_scale":0.9}`|
|93|`{"version":16,"wish_scale":0.9}`|
|94|`{"version":16,"wish_scale":0.9}`|
|95|`{"version":16,"wish_scale":0.9}`|
|96|`{"version":16,"wish_scale":0.9}`|
|101|`{"version":17,"wish_scale":0.85}`|
|102|`{"version":17,"wish_scale":0.9}`|
|103|`{"version":17,"wish_scale":0.9}`|
|104|`{"version":17,"wish_scale":0.9}`|
|105|`{"version":17,"wish_scale":0.9}`|
|106|`{"version":17,"wish_scale":0.9}`|
|111|`{"version":18,"wish_scale":0.9}`|
|112|`{"version":18,"wish_scale":0.9}`|
|113|`{"version":18,"wish_scale":0.9}`|
|114|`{"version":18,"wish_scale":0.9}`|
|115|`{"version":18,"wish_scale":0.9}`|
|116|`{"version":18,"wish_scale":0.9}`|
|117|`{"version":19,"wish_scale":0.9}`|
|118|`{"version":19,"wish_scale":0.9}`|
|119|`{"version":19,"wish_scale":0.9}`|
|120|`{"version":19,"wish_scale":0.9}`|
|121|`{"version":19,"wish_scale":0.9}`|
|122|`{"version":19,"wish_scale":0.9}`|
|123|`{"version":20,"wish_scale":0.9}`|
|124|`{"version":20,"wish_scale":0.9}`|
|125|`{"version":20,"wish_scale":0.9}`|
|126|`{"version":20,"wish_scale":0.9}`|
|127|`{"version":20,"wish_scale":0.9}`|
|128|`{"version":20,"wish_scale":0.9}`|
|129|`{"version":21,"wish_scale":0.85}`|
|130|`{"version":21,"wish_scale":0.9}`|
|131|`{"version":21,"wish_scale":0.9}`|
|132|`{"version":21,"wish_scale":0.9}`|
|133|`{"version":21,"wish_scale":0.9}`|
|134|`{"version":21,"wish_scale":0.9}`|
|135|`{"version":22,"wish_scale":0.9}`|
|136|`{"version":22,"wish_scale":0.6}`|
|137|`{"version":22,"wish_scale":0.42}`|
|138|`{"version":22,"wish_scale":0.9}`|
|139|`{"version":22,"wish_scale":0.9}`|
|140|`{"version":22,"wish_scale":0.85}`|
|141|`{"version":23,"wish_scale":0.85}`|
|142|`{"version":23,"wish_scale":0.9}`|
|143|`{"version":23,"wish_scale":0.9}`|
|144|`{"version":23,"wish_scale":0.9}`|
|145|`{"version":23,"wish_scale":0.9}`|
|146|`{"version":23,"wish_scale":0.85}`|
|147|`{"version":24,"wish_scale":0.9}`|
|148|`{"version":24,"wish_scale":0.9}`|
|149|`{"version":24,"wish_scale":0.6}`|
|150|`{"version":24,"wish_scale":0.9}`|
|151|`{"version":24,"wish_scale":0.9}`|
|152|`{"version":24,"wish_scale":0.9}`|
|153|`{"version":25,"wish_scale":0.9}`|
|154|`{"version":25,"wish_scale":0.9}`|
|155|`{"version":25,"wish_scale":0.9}`|
|156|`{"version":25,"wish_scale":0.9}`|
|157|`{"version":25,"wish_scale":0.9}`|
|158|`{"version":25,"wish_scale":0.9}`|
|159|`{"version":26,"wish_scale":0.4}`|
|160|`{"version":26,"wish_scale":0.35}`|
|161|`{"version":26,"wish_scale":0.5}`|
|162|`{"version":26,"wish_scale":0.25}`|
|163|`{"version":26,"wish_scale":0.5}`|
|164|`{"version":26,"wish_scale":0.7}`|
|165|`{"version":26,"wish_scale":0.8}`|
|166|`{"version":26,"wish_scale":0.6}`|
|167|`{"version":26,"wish_scale":1}`|
|168|`{"version":28,"wish_scale":0.4}`|
|169|`{"version":28,"wish_scale":0.35}`|
|170|`{"version":28,"wish_scale":0.5}`|
|171|`{"version":28,"wish_scale":0.25}`|
|172|`{"version":28,"wish_scale":0.5}`|
|173|`{"version":28,"wish_scale":0.7}`|
|174|`{"version":28,"wish_scale":0.8}`|
|175|`{"version":28,"wish_scale":0.6}`|
|176|`{"version":28,"wish_scale":1}`|

## DrawWish

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|21|本表行键；与其他表同值不自动代表同一对象。|
|base_rate|number|21|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|add_rate|number|21|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|0|`{"base_rate":10000,"add_rate":0}`|
|1|`{"base_rate":10000,"add_rate":0}`|
|2|`{"base_rate":10000,"add_rate":0}`|
|3|`{"base_rate":10000,"add_rate":0}`|
|4|`{"base_rate":10000,"add_rate":0}`|
|5|`{"base_rate":5000,"add_rate":5000}`|
|6|`{"base_rate":5000,"add_rate":5000}`|
|7|`{"base_rate":5000,"add_rate":5000}`|
|8|`{"base_rate":5000,"add_rate":5000}`|
|9|`{"base_rate":5000,"add_rate":5000}`|
|10|`{"base_rate":2500,"add_rate":1500}`|
|11|`{"base_rate":2500,"add_rate":1500}`|
|12|`{"base_rate":2500,"add_rate":1500}`|
|13|`{"base_rate":2500,"add_rate":1500}`|
|14|`{"base_rate":2500,"add_rate":1500}`|
|15|`{"base_rate":2500,"add_rate":1500}`|
|16|`{"base_rate":2500,"add_rate":1500}`|
|17|`{"base_rate":2500,"add_rate":1500}`|
|18|`{"base_rate":2500,"add_rate":1500}`|
|19|`{"base_rate":2500,"add_rate":1500}`|
|20|`{"base_rate":2500,"add_rate":0}`|

## Draw

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|show_timeline|array|38|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|probability|number|38|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|
|is_simple|boolean|38|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|draw_lib|number|38|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|38|本表行键；与其他表同值不自动代表同一对象。|
|draw_reset|boolean|38|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|range|array|38|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"show_timeline":[1200119,1200219,1200319,1200419,1200519,1200619],"probability":11,"is_simple":false,"draw_lib":80,"draw_reset":false}`|
|2|`{"show_timeline":[1200719,1200819,1200919,1201019,1201119,1201219],"probability":12,"is_simple":false,"draw_lib":81,"draw_reset":false}`|
|3|`{"show_timeline":[1201719,1201819,1201919,1202019],"probability":13,"is_simple":false,"draw_lib":82,"draw_reset":false}`|
|4|`{"show_timeline":[1200719,1200819,1200919,1201019,1201119,1201219],"probability":12,"is_simple":false,"draw_lib":81,"draw_reset":false}`|
|5|`{"show_timeline":[1201819,1201719,1202019,1201919],"probability":13,"is_simple":false,"draw_lib":82,"draw_reset":false}`|
|6|`{"show_timeline":[1200219,1200819,1200419,1200319],"probability":58,"is_simple":false,"draw_lib":83,"draw_reset":false}`|
|7|`{"show_timeline":[1200119,1200219,1200319,1200419,1200519],"probability":56,"is_simple":false,"draw_lib":84,"draw_reset":false}`|
|8|`{"show_timeline":[1200819,1200919,1201019,1200719],"probability":57,"is_simple":false,"draw_lib":85,"draw_reset":false}`|
|9|`{"show_timeline":[1200519,1200719,1200419,1200319],"probability":63,"is_simple":false,"draw_lib":86,"draw_reset":false}`|
|10|`{"show_timeline":[1201719,1201819,1201919,1202019],"probability":13,"is_simple":false,"draw_lib":82,"draw_reset":false}`|
|11|`{"show_timeline":[1200119,1200219,1200319,1200419,1200519],"probability":70,"is_simple":false,"draw_lib":87,"draw_reset":false}`|
|12|`{"show_timeline":[1200819,1200919,1201019,1200719],"probability":71,"is_simple":false,"draw_lib":88,"draw_reset":false}`|
|13|`{"show_timeline":[1201819,1201719,1202019,1201919],"probability":72,"is_simple":false,"draw_lib":89,"draw_reset":false}`|
|14|`{"show_timeline":[1200819,1200219,1200419,1200319],"probability":73,"is_simple":false,"draw_lib":90,"draw_reset":false}`|
|15|`{"show_timeline":[1200519,1200719,1200919,1201019],"probability":74,"is_simple":false,"draw_lib":91,"draw_reset":false}`|
|16|`{"show_timeline":[1201819,1201719,1202019,1201919],"probability":72,"is_simple":false,"draw_lib":89,"draw_reset":false}`|
|17|`{"show_timeline":[1201819,1201719,1202019,1201919],"probability":72,"is_simple":false,"draw_lib":89,"draw_reset":false}`|
|18|`{"show_timeline":[1202219,1202319,1200419,1200319],"probability":75,"is_simple":false,"draw_lib":94,"draw_reset":false}`|
|19|`{"show_timeline":[1200119,1200219,1200319,1200419,1200519],"probability":70,"is_simple":false,"draw_lib":87,"draw_reset":false}`|
|20|`{"show_timeline":[1200819,1200919,1201019,1200719],"probability":71,"is_simple":false,"draw_lib":88,"draw_reset":false}`|
|21|`{"show_timeline":[1201819,1201719,1202019,1201919],"probability":72,"is_simple":false,"draw_lib":89,"draw_reset":false}`|
|22|`{"show_timeline":[1202419,1202519,1200719,1200819],"probability":76,"is_simple":false,"draw_lib":95,"draw_reset":false}`|
|23|`{"show_timeline":[1202619,1202119,1201719,1201919],"probability":87,"is_simple":false,"draw_lib":96,"draw_reset":false}`|
|24|`{"show_timeline":[1202719,1202819,1202019,1201819],"probability":88,"is_simple":false,"draw_lib":97,"draw_reset":false}`|
|25|`{"show_timeline":[1200119,1202519,1200519,1200219,1200319,1200419],"probability":89,"is_simple":false,"draw_lib":98,"draw_reset":false}`|
|26|`{"show_timeline":[1202619,1202719,1202419,1202519,1200119,1200519,1200219,1200319,1200419],"probability":93,"is_simple":false,"draw_lib":99,"draw_reset":false}`|
|27|`{"show_timeline":[],"probability":94,"is_simple":false,"draw_lib":230,"draw_reset":true}`|
|28|`{"show_timeline":[1202619,1202719,1202419,1202519,1200119,1200519,1200219,1200319,1200419],"probability":98,"is_simple":false,"draw_lib":195,"draw_reset":false}`|
|29|`{"show_timeline":[],"probability":94,"is_simple":true,"draw_lib":230,"draw_reset":true}`|
|30|`{"show_timeline":[],"probability":99,"is_simple":true,"draw_lib":235,"draw_reset":true}`|
|31|`{"show_timeline":[],"probability":100,"is_simple":true,"draw_lib":237,"draw_reset":true}`|
|32|`{"show_timeline":[],"probability":99,"is_simple":true,"draw_lib":235,"draw_reset":true}`|
|33|`{"show_timeline":[],"probability":101,"is_simple":true,"draw_lib":243,"draw_reset":true}`|
|34|`{"show_timeline":[],"probability":102,"is_simple":true,"draw_lib":38700019,"draw_reset":true}`|
|35|`{"show_timeline":[],"probability":103,"is_simple":true,"draw_lib":38700020,"draw_reset":true}`|
|36|`{"show_timeline":[],"probability":104,"is_simple":true,"draw_lib":38700021,"draw_reset":true}`|
|37|`{"show_timeline":[],"probability":94,"is_simple":true,"draw_lib":230,"draw_reset":true}`|
|38|`{"show_timeline":[],"probability":100,"is_simple":true,"draw_lib":237,"draw_reset":true}`|

## DrawFantasy

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|draw_fantasy|array|38|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|new_tag|array|38|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|38|本表行键；与其他表同值不自动代表同一对象。|
|draw_condtion_star|number|38|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|need_wish|boolean|38|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|filter_condition_star|number|38|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"draw_fantasy":[1200119,1200219,1200319,1200419,1200519,1200619],"draw_condtion_star":10,"need_wish":false,"filter_condition_star":10}`|
|2|`{"draw_fantasy":[1200719,1200819,1200919,1201019,1201119,1201219],"draw_condtion_star":10,"need_wish":false,"filter_condition_star":10}`|
|3|`{"draw_fantasy":[1201719,1201819,1201919,1202019],"draw_condtion_star":10,"need_wish":false,"filter_condition_star":10}`|
|4|`{"draw_fantasy":[1200719,1200819,1200919,1201019,1201119,1201219],"draw_condtion_star":10,"need_wish":false,"filter_condition_star":10}`|
|5|`{"draw_fantasy":[1201819,1201719,1202019,1201919],"draw_condtion_star":10,"need_wish":false,"filter_condition_star":10}`|
|6|`{"draw_fantasy":[1200219,1200819,1200419,1200319],"draw_condtion_star":10,"need_wish":false,"filter_condition_star":10}`|
|7|`{"draw_fantasy":[1200119,1200219,1200319,1200419,1200519],"draw_condtion_star":10,"need_wish":false,"filter_condition_star":10}`|
|8|`{"draw_fantasy":[1200819,1200919,1201019,1200719],"draw_condtion_star":10,"need_wish":false,"filter_condition_star":10}`|
|9|`{"draw_fantasy":[1200519,1200919,1201019,1200719],"draw_condtion_star":10,"need_wish":false,"filter_condition_star":10}`|
|10|`{"draw_fantasy":[1201719,1201819,1201919,1202019],"draw_condtion_star":10,"need_wish":false,"filter_condition_star":10}`|
|11|`{"draw_fantasy":[1200119,1200219,1200319,1200419,1200519],"draw_condtion_star":10,"need_wish":true,"filter_condition_star":10}`|
|12|`{"draw_fantasy":[1200819,1200919,1201019,1200719],"draw_condtion_star":10,"need_wish":true,"filter_condition_star":10}`|
|13|`{"draw_fantasy":[1201719,1201819,1201919,1202019],"draw_condtion_star":10,"need_wish":true,"filter_condition_star":10}`|
|14|`{"draw_fantasy":[1200219,1200819,1200419,1200319],"draw_condtion_star":10,"need_wish":true,"filter_condition_star":10}`|
|15|`{"draw_fantasy":[1200519,1200919,1201019,1200719],"draw_condtion_star":10,"need_wish":true,"filter_condition_star":10}`|
|16|`{"draw_fantasy":[1201719,1201819,1201919,1202019],"draw_condtion_star":10,"need_wish":true,"filter_condition_star":10}`|
|17|`{"draw_fantasy":[1201719,1201819,1201919,1202019],"draw_condtion_star":10,"need_wish":true,"filter_condition_star":10}`|
|18|`{"draw_fantasy":[1202219,1202319,1200419,1200319],"draw_condtion_star":10,"need_wish":true,"filter_condition_star":10}`|
|19|`{"draw_fantasy":[1200119,1200219,1200319,1200419,1200519],"draw_condtion_star":10,"need_wish":true,"filter_condition_star":10}`|
|20|`{"draw_fantasy":[1200819,1200919,1201019,1200719],"draw_condtion_star":10,"need_wish":true,"filter_condition_star":10}`|
|21|`{"draw_fantasy":[1201719,1201819,1201919,1202019],"draw_condtion_star":10,"need_wish":true,"filter_condition_star":10}`|
|22|`{"draw_fantasy":[1202419,1202519,1200719,1200819],"draw_condtion_star":10,"need_wish":true,"filter_condition_star":10}`|
|23|`{"draw_fantasy":[1202619,1202119,1201719,1201919],"draw_condtion_star":10,"need_wish":true,"filter_condition_star":10}`|
|24|`{"draw_fantasy":[1202719,1202819,1202019,1201819],"draw_condtion_star":10,"need_wish":true,"filter_condition_star":10}`|
|25|`{"draw_fantasy":[1200119,1202519,1200519,1200219,1200319,1200419],"draw_condtion_star":10,"need_wish":true,"filter_condition_star":10}`|
|26|`{"draw_fantasy":[1200119,1202519,1200519,1200219,1200319,1200419,1202419,1202719,1202619],"draw_condtion_star":10,"need_wish":true,"filter_condition_star":10}`|
|27|`{"draw_fantasy":[1202919],"draw_condtion_star":10,"need_wish":false,"filter_condition_star":10}`|
|28|`{"draw_fantasy":[1200119,1202519,1200519,1200219,1200319,1200419,1202419,1202719,1202619],"draw_condtion_star":10,"need_wish":true,"filter_condition_star":10}`|
|29|`{"draw_fantasy":[1202919],"draw_condtion_star":10,"need_wish":false,"filter_condition_star":10}`|
|30|`{"draw_fantasy":[1203019],"draw_condtion_star":10,"need_wish":false,"filter_condition_star":10}`|
|31|`{"draw_fantasy":[1203119],"draw_condtion_star":10,"need_wish":false,"filter_condition_star":10}`|
|32|`{"draw_fantasy":[1203019],"draw_condtion_star":10,"need_wish":false,"filter_condition_star":10}`|
|33|`{"draw_fantasy":[1203219],"draw_condtion_star":10,"need_wish":false,"filter_condition_star":10}`|
|34|`{"draw_fantasy":[1203319],"draw_condtion_star":10,"need_wish":false,"filter_condition_star":10}`|
|35|`{"draw_fantasy":[1203419],"draw_condtion_star":10,"need_wish":false,"filter_condition_star":10}`|
|36|`{"draw_fantasy":[1203519],"draw_condtion_star":10,"need_wish":false,"filter_condition_star":10}`|
|37|`{"draw_fantasy":[1202919],"draw_condtion_star":10,"need_wish":false,"filter_condition_star":10}`|
|38|`{"draw_fantasy":[1203119],"draw_condtion_star":10,"need_wish":false,"filter_condition_star":10}`|

## DrawAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|454|本表行键；与其他表同值不自动代表同一对象。|
|draw_num|number|454|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|draw_award|array|454|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|is_big|boolean|454|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部454行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{"draw_num":10,"draw_award":[[711200,1]],"is_big":false}`|
|1002|`{"draw_num":30,"draw_award":[[1751200,30]],"is_big":true}`|
|1003|`{"draw_num":50,"draw_award":[[149002,5]],"is_big":false}`|

## Gift

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|gift|array|38|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|reward_tid|number|38|奖励对象ID数组，与reward_count按下标配对。|
|show_rule|array|38|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|38|本表行键；与其他表同值不自动代表同一对象。|
|piece_buy_gift|number|38|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|draw_gift|number|38|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"reward_tid":149002,"piece_buy_gift":870001,"draw_gift":870008}`|
|2|`{"reward_tid":149002,"piece_buy_gift":870021,"draw_gift":870028}`|
|3|`{"reward_tid":149002,"piece_buy_gift":870041,"draw_gift":870048}`|
|4|`{"reward_tid":149002,"piece_buy_gift":870021,"draw_gift":870028}`|
|5|`{"reward_tid":149002,"piece_buy_gift":870041,"draw_gift":870048}`|
|6|`{"reward_tid":149002,"piece_buy_gift":870061,"draw_gift":870068}`|
|7|`{"reward_tid":149002,"piece_buy_gift":870081,"draw_gift":870008}`|
|8|`{"reward_tid":149002,"piece_buy_gift":870101,"draw_gift":870028}`|
|9|`{"reward_tid":149002,"piece_buy_gift":870121,"draw_gift":870128}`|
|10|`{"reward_tid":149002,"piece_buy_gift":870141,"draw_gift":870148}`|
|11|`{"reward_tid":149002,"piece_buy_gift":870161,"draw_gift":870169}`|
|12|`{"reward_tid":149002,"piece_buy_gift":870181,"draw_gift":870189}`|
|13|`{"reward_tid":149002,"piece_buy_gift":870201,"draw_gift":870209}`|
|14|`{"reward_tid":149002,"piece_buy_gift":870221,"draw_gift":870229}`|
|15|`{"reward_tid":149002,"piece_buy_gift":870241,"draw_gift":870249}`|
|16|`{"reward_tid":149002,"piece_buy_gift":870261,"draw_gift":870269}`|
|17|`{"reward_tid":149002,"piece_buy_gift":870201,"draw_gift":870209}`|
|18|`{"reward_tid":149002,"piece_buy_gift":870271,"draw_gift":870279}`|
|19|`{"reward_tid":149002,"piece_buy_gift":870271,"draw_gift":870279}`|
|20|`{"reward_tid":149002,"piece_buy_gift":870290,"draw_gift":870298}`|
|21|`{"reward_tid":149002,"piece_buy_gift":870300,"draw_gift":870308}`|
|22|`{"reward_tid":149002,"piece_buy_gift":870271,"draw_gift":870279}`|
|23|`{"reward_tid":149002,"piece_buy_gift":870271,"draw_gift":870279}`|
|24|`{"reward_tid":149002,"piece_buy_gift":870271,"draw_gift":870279}`|
|25|`{"reward_tid":149002,"piece_buy_gift":870311,"draw_gift":870319}`|
|26|`{"reward_tid":814002,"piece_buy_gift":870321,"draw_gift":870329}`|
|27|`{"reward_tid":817002,"piece_buy_gift":0,"draw_gift":0}`|
|28|`{"reward_tid":814002,"piece_buy_gift":870338,"draw_gift":870346}`|
|29|`{"reward_tid":817002,"piece_buy_gift":0,"draw_gift":0}`|
|30|`{"reward_tid":817002,"piece_buy_gift":0,"draw_gift":0}`|
|31|`{"reward_tid":817002,"piece_buy_gift":0,"draw_gift":0}`|
|32|`{"reward_tid":817002,"piece_buy_gift":0,"draw_gift":0}`|
|33|`{"reward_tid":817002,"piece_buy_gift":0,"draw_gift":0}`|
|34|`{"reward_tid":817002,"piece_buy_gift":0,"draw_gift":0}`|
|35|`{"reward_tid":853002,"piece_buy_gift":0,"draw_gift":0}`|
|36|`{"reward_tid":853002,"piece_buy_gift":0,"draw_gift":0}`|
|37|`{"reward_tid":817002,"piece_buy_gift":0,"draw_gift":0}`|
|38|`{"reward_tid":817002,"piece_buy_gift":0,"draw_gift":0}`|

## DemigodAct

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|38|本表行键；与其他表同值不自动代表同一对象。|
|send_cost|boolean|38|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"send_cost":true}`|
|2|`{"send_cost":true}`|
|3|`{"send_cost":true}`|
|4|`{"send_cost":true}`|
|5|`{"send_cost":true}`|
|6|`{"send_cost":true}`|
|7|`{"send_cost":true}`|
|8|`{"send_cost":true}`|
|9|`{"send_cost":true}`|
|10|`{"send_cost":true}`|
|11|`{"send_cost":true}`|
|12|`{"send_cost":true}`|
|13|`{"send_cost":true}`|
|14|`{"send_cost":true}`|
|15|`{"send_cost":true}`|
|16|`{"send_cost":true}`|
|17|`{"send_cost":true}`|
|18|`{"send_cost":true}`|
|19|`{"send_cost":true}`|
|20|`{"send_cost":true}`|
|21|`{"send_cost":true}`|
|22|`{"send_cost":true}`|
|23|`{"send_cost":true}`|
|24|`{"send_cost":true}`|
|25|`{"send_cost":true}`|
|26|`{"send_cost":true}`|
|27|`{"send_cost":true}`|
|28|`{"send_cost":true}`|
|29|`{"send_cost":false}`|
|30|`{"send_cost":true}`|
|31|`{"send_cost":false}`|
|32|`{"send_cost":false}`|
|33|`{"send_cost":false}`|
|34|`{"send_cost":false}`|
|35|`{"send_cost":false}`|
|36|`{"send_cost":false}`|
|37|`{"send_cost":false}`|
|38|`{"send_cost":false}`|

## DrawShowStyle

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|38|本表行键；与其他表同值不自动代表同一对象。|
|role|number|38|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|shop_desc|number|38|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|use_style_sp|boolean|38|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|gift_shop_desc|number|38|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"use_style_sp":false}`|
|2|`{"use_style_sp":false}`|
|3|`{"use_style_sp":false}`|
|4|`{"use_style_sp":false}`|
|5|`{"use_style_sp":false}`|
|6|`{"use_style_sp":false}`|
|7|`{"use_style_sp":false}`|
|8|`{"use_style_sp":false}`|
|9|`{"use_style_sp":false}`|
|10|`{"use_style_sp":false}`|
|11|`{"use_style_sp":false}`|
|12|`{"use_style_sp":false}`|
|13|`{"use_style_sp":false}`|
|14|`{"use_style_sp":false}`|
|15|`{"use_style_sp":false}`|
|16|`{"use_style_sp":false}`|
|17|`{"use_style_sp":false}`|
|18|`{"use_style_sp":false}`|
|19|`{"use_style_sp":false}`|
|20|`{"use_style_sp":false}`|
|21|`{"use_style_sp":false}`|
|22|`{"use_style_sp":false}`|
|23|`{"use_style_sp":false}`|
|24|`{"use_style_sp":false}`|
|25|`{"use_style_sp":false}`|
|26|`{"use_style_sp":false}`|
|27|`{"use_style_sp":true}`|
|28|`{"use_style_sp":false}`|
|29|`{"use_style_sp":true}`|
|30|`{"use_style_sp":true}`|
|31|`{"use_style_sp":true}`|
|32|`{"use_style_sp":true}`|
|33|`{"use_style_sp":true}`|
|34|`{"use_style_sp":true}`|
|35|`{"use_style_sp":true}`|
|36|`{"use_style_sp":true}`|
|37|`{"use_style_sp":true}`|
|38|`{"use_style_sp":true}`|

## DrawGodShowStyle

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|main_down_di|string|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|name_di|string|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|main_down_draw_icon|string|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skill_des|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|7|本表行键；与其他表同值不自动代表同一对象。|
|main_down_draw_di|string|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|get_pos|undefined|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|main_down_shop_icon|string|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skill_des_di|string|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|main_down_shop_di|string|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|get_scale|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1202919|`{"main_down_draw_icon":"","skill_des":680700,"main_down_draw_di":"","skill_des_di":""}`|
|1203019|`{"main_down_draw_icon":"","skill_des":680706,"main_down_draw_di":"","skill_des_di":""}`|
|1203119|`{"main_down_draw_icon":"","skill_des":680707,"main_down_draw_di":"","skill_des_di":""}`|
|1203219|`{"main_down_draw_icon":"","skill_des":680709,"main_down_draw_di":"","skill_des_di":""}`|
|1203319|`{"main_down_draw_icon":"","skill_des":680710,"main_down_draw_di":"","skill_des_di":""}`|
|1203419|`{"main_down_draw_icon":"","skill_des":680711,"main_down_draw_di":"","skill_des_di":""}`|
|1203519|`{"main_down_draw_icon":"","skill_des":680712,"main_down_draw_di":"","skill_des_di":""}`|

## PreShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|title_size|number|38|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|title_di|string|38|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|small_title_di|string|38|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|small_title_style|number|38|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|38|本表行键；与其他表同值不自动代表同一对象。|
|title|number|38|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|title_pos|undefined|38|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|small_title_pos|undefined|38|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|small_title_size|number|38|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|small_title|number|38|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|small_img|string|38|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|title_style|number|38|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|act_img|string|38|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|des|array|38|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

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

## DemigodTrialDamage

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|438|本表行键；与其他表同值不自动代表同一对象。|
|challenge|number|438|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|damage|number|438|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|438|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

下列3行用于说明结构；全部438行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{"damage":500000,"award":[[3901900,300],[101500,100]]}`|
|1002|`{"damage":850000,"award":[[3901900,400],[140002,3]]}`|
|1003|`{"damage":2000000,"award":[[3901900,500],[140002,4]]}`|

## DemigodTrialBless

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|attr|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"attr":[[2,2000],[13,250]]}`|
|2|`{"attr":[[2,5000],[13,500]]}`|

## DemigodTrialStar

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|17|本表行键；与其他表同值不自动代表同一对象。|
|attr|array|17|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|150000|`{"attr":[[2,5000],[1,200000]]}`|
|150010|`{"attr":[[2,10000],[1,400000]]}`|
|150020|`{"attr":[[2,15000],[1,600000]]}`|
|150030|`{"attr":[[2,20000],[1,800000]]}`|
|150040|`{"attr":[[2,22500],[1,900000]]}`|
|150050|`{"attr":[[2,25000],[1,1000000]]}`|
|250000|`{"attr":[[2,20000],[1,800000]]}`|
|250010|`{"attr":[[2,30000],[1,1200000],[13,2500]]}`|
|250020|`{"attr":[[2,40000],[1,1600000],[13,5000]]}`|
|250030|`{"attr":[[2,50000],[1,2000000],[13,5000]]}`|
|250040|`{"attr":[[2,55000],[1,2200000],[13,5000]]}`|
|250050|`{"attr":[[2,80000],[1,3200000],[13,5000]]}`|
|260060|`{"attr":[[2,80000],[1,3200000],[13,7500]]}`|
|260070|`{"attr":[[2,80000],[1,3200000],[13,10000]]}`|
|260080|`{"attr":[[2,80000],[1,3200000],[13,13000]]}`|
|260090|`{"attr":[[2,80000],[1,3200000],[13,16000]]}`|
|260100|`{"attr":[[2,80000],[1,3200000],[13,20000]]}`|

## DemigodTrialLevel

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|320|本表行键；与其他表同值不自动代表同一对象。|
|attr|array|320|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部320行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|130001|`{"attr":[[13,25],[23,0],[2,10000]]}`|
|130002|`{"attr":[[13,50],[23,0],[2,10000]]}`|
|130003|`{"attr":[[13,75],[23,0],[2,10000]]}`|

## DemigodTrial

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|open_day|number|73|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_open_day|number|73|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight|number|73|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_style|number|73|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|73|本表行键；与其他表同值不自动代表同一对象。|
|hero|number|73|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"open_day":1,"show_open_day":0,"fight":7900017,"hero":3030501}`|
|2|`{"open_day":1,"show_open_day":0,"fight":7900022,"hero":4030801}`|
|3|`{"open_day":2,"show_open_day":0,"fight":7900018,"hero":1030101}`|
|4|`{"open_day":3,"show_open_day":0,"fight":7900019,"hero":2030201}`|
|5|`{"open_day":4,"show_open_day":0,"fight":7900020,"hero":3030601}`|
|6|`{"open_day":5,"show_open_day":0,"fight":7900021,"hero":4030501}`|
|7|`{"open_day":1,"show_open_day":0,"fight":7900023,"hero":2020601}`|
|8|`{"open_day":1,"show_open_day":0,"fight":7900024,"hero":3020101}`|
|9|`{"open_day":2,"show_open_day":0,"fight":7900025,"hero":1030501}`|
|10|`{"open_day":3,"show_open_day":0,"fight":7900026,"hero":2030301}`|
|11|`{"open_day":4,"show_open_day":0,"fight":7900027,"hero":3030301}`|
|12|`{"open_day":5,"show_open_day":0,"fight":7900028,"hero":4030401}`|
|13|`{"open_day":1,"show_open_day":0,"fight":7900013,"hero":1030401}`|
|14|`{"open_day":2,"show_open_day":0,"fight":7900014,"hero":2030401}`|
|15|`{"open_day":3,"show_open_day":0,"fight":7900015,"hero":3030201}`|
|16|`{"open_day":4,"show_open_day":0,"fight":7900016,"hero":4030101}`|
|17|`{"open_day":1,"show_open_day":0,"fight":7900018,"hero":1030101}`|
|18|`{"open_day":2,"show_open_day":0,"fight":7900025,"hero":1030501}`|
|19|`{"open_day":3,"show_open_day":0,"fight":7900020,"hero":3030601}`|
|20|`{"open_day":4,"show_open_day":0,"fight":7900019,"hero":2030201}`|
|21|`{"open_day":1,"show_open_day":0,"fight":7900017,"hero":3030501}`|
|22|`{"open_day":2,"show_open_day":0,"fight":7900018,"hero":1030101}`|
|23|`{"open_day":3,"show_open_day":0,"fight":7900019,"hero":2030201}`|
|24|`{"open_day":4,"show_open_day":0,"fight":7900020,"hero":3030601}`|
|25|`{"open_day":5,"show_open_day":0,"fight":7900021,"hero":4030501}`|
|26|`{"open_day":1,"show_open_day":0,"fight":7900025,"hero":1030501}`|
|27|`{"open_day":2,"show_open_day":0,"fight":7900026,"hero":2030301}`|
|28|`{"open_day":3,"show_open_day":0,"fight":7900027,"hero":3030301}`|
|29|`{"open_day":4,"show_open_day":0,"fight":7900028,"hero":4030401}`|
|30|`{"open_day":1,"show_open_day":0,"fight":7900021,"hero":4030501}`|
|31|`{"open_day":2,"show_open_day":0,"fight":7900026,"hero":2030301}`|
|32|`{"open_day":3,"show_open_day":0,"fight":7900027,"hero":3030301}`|
|33|`{"open_day":4,"show_open_day":0,"fight":7900028,"hero":4030401}`|
|34|`{"open_day":1,"show_open_day":0,"fight":7900029,"hero":2030501}`|
|35|`{"open_day":2,"show_open_day":0,"fight":7900030,"hero":3030401}`|
|36|`{"open_day":3,"show_open_day":0,"fight":7900019,"hero":2030201}`|
|37|`{"open_day":4,"show_open_day":0,"fight":7900020,"hero":3030601}`|
|38|`{"open_day":1,"show_open_day":0,"fight":7900031,"hero":1030601}`|
|39|`{"open_day":2,"show_open_day":0,"fight":7900032,"hero":4030601}`|
|40|`{"open_day":3,"show_open_day":0,"fight":7900028,"hero":4030401}`|
|41|`{"open_day":4,"show_open_day":0,"fight":7900025,"hero":1030501}`|
|42|`{"open_day":1,"show_open_day":0,"fight":7900033,"hero":3030701}`|
|43|`{"open_day":2,"show_open_day":0,"fight":7900034,"hero":4020301}`|
|44|`{"open_day":3,"show_open_day":0,"fight":7900014,"hero":2030401}`|
|45|`{"open_day":4,"show_open_day":0,"fight":7900016,"hero":4030101}`|
|46|`{"open_day":1,"show_open_day":0,"fight":7900035,"hero":2030601}`|
|47|`{"open_day":2,"show_open_day":0,"fight":7900036,"hero":1020601}`|
|48|`{"open_day":3,"show_open_day":0,"fight":7900015,"hero":3030201}`|
|49|`{"open_day":4,"show_open_day":0,"fight":7900013,"hero":1030401}`|
|101|`{"open_day":1,"show_open_day":0,"fight":7900017,"hero":3030501}`|
|102|`{"open_day":1,"show_open_day":0,"fight":7900032,"hero":4030601}`|
|103|`{"open_day":2,"show_open_day":0,"fight":7900021,"hero":4030501}`|
|104|`{"open_day":2,"show_open_day":0,"fight":7900018,"hero":1030101}`|
|105|`{"open_day":3,"show_open_day":0,"fight":7900019,"hero":2030201}`|
|106|`{"open_day":3,"show_open_day":0,"fight":7900020,"hero":3030601}`|
|111|`{"open_day":1,"show_open_day":0,"fight":7900033,"hero":3030701}`|
|112|`{"open_day":1,"show_open_day":0,"fight":7900017,"hero":3030501}`|
|113|`{"open_day":1,"show_open_day":0,"fight":7900032,"hero":4030601}`|
|114|`{"open_day":2,"show_open_day":0,"fight":7900035,"hero":2030601}`|
|115|`{"open_day":2,"show_open_day":0,"fight":7900021,"hero":4030501}`|
|116|`{"open_day":2,"show_open_day":0,"fight":7900018,"hero":1030101}`|
|117|`{"open_day":3,"show_open_day":0,"fight":7900031,"hero":1030601}`|
|118|`{"open_day":3,"show_open_day":0,"fight":7900019,"hero":2030201}`|
|119|`{"open_day":3,"show_open_day":0,"fight":7900020,"hero":3030601}`|
|120|`{"open_day":0,"show_open_day":1,"fight":7900033,"hero":3030701}`|
|121|`{"open_day":0,"show_open_day":1,"fight":7900017,"hero":3030501}`|
|122|`{"open_day":0,"show_open_day":1,"fight":7900032,"hero":4030601}`|
|123|`{"open_day":1,"show_open_day":2,"fight":7900035,"hero":2030601}`|
|124|`{"open_day":1,"show_open_day":2,"fight":7900021,"hero":4030501}`|
|125|`{"open_day":1,"show_open_day":2,"fight":7900018,"hero":1030101}`|
|126|`{"open_day":2,"show_open_day":3,"fight":7900031,"hero":1030601}`|
|127|`{"open_day":2,"show_open_day":3,"fight":7900019,"hero":2030201}`|
|128|`{"open_day":2,"show_open_day":3,"fight":7900020,"hero":3030601}`|
