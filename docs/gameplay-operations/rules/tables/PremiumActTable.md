# PremiumActTable 规则参数

来源：[personal-server/assets/tables/PremiumActTable.data.lua.json.gz](../../../../personal-server/assets/tables/PremiumActTable.data.lua.json.gz)，SHA256：`99b52be41f3f8105cbe0112bc1d97622cc8c218e6fd23c89076d1f8b3dca3a6a`。

[完整逐行JSON](PremiumActTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Free](#free)|72|decoded-rows|
|[Version](#version)|110|decoded-rows|
|[Config](#config)|852|decoded-rows|
|[Show](#show)|1|decoded-rows|
|[GiftShopShow](#giftshopshow)|5|decoded-rows|

## Free

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|lock_des|number|72|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|asserts|number|72|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|72|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|tid|number|72|本表行键；与其他表同值不自动代表同一对象。|
|version|number|72|版本引用；必须按活动类型及其消费者查对应版本表。|
|is_big|boolean|72|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|100001|`{"lock_des":0,"asserts":661021400001,"award":[[101500,50]],"version":100,"is_big":false}`|
|100002|`{"lock_des":0,"asserts":661021400002,"award":[[101500,50]],"version":100,"is_big":false}`|
|100003|`{"lock_des":0,"asserts":661021400003,"award":[[101500,50]],"version":100,"is_big":false}`|
|100004|`{"lock_des":0,"asserts":661021400004,"award":[[101500,50]],"version":100,"is_big":false}`|
|100005|`{"lock_des":0,"asserts":661021400005,"award":[[101500,50]],"version":100,"is_big":false}`|
|100006|`{"lock_des":681768,"asserts":661021400006,"award":[[3971200,1]],"version":100,"is_big":true}`|
|101001|`{"lock_des":0,"asserts":661021401001,"award":[[101500,50]],"version":101,"is_big":false}`|
|101002|`{"lock_des":0,"asserts":661021401002,"award":[[101500,50]],"version":101,"is_big":false}`|
|101003|`{"lock_des":0,"asserts":661021401003,"award":[[101500,50]],"version":101,"is_big":false}`|
|101004|`{"lock_des":0,"asserts":661021401004,"award":[[101500,50]],"version":101,"is_big":false}`|
|101005|`{"lock_des":0,"asserts":661021401005,"award":[[101500,50]],"version":101,"is_big":false}`|
|101006|`{"lock_des":681768,"asserts":661021401006,"award":[[3981200,1]],"version":101,"is_big":true}`|
|102001|`{"lock_des":0,"asserts":661021402001,"award":[[101500,50]],"version":102,"is_big":false}`|
|102002|`{"lock_des":0,"asserts":661021402002,"award":[[101500,50]],"version":102,"is_big":false}`|
|102003|`{"lock_des":0,"asserts":661021402003,"award":[[101500,50]],"version":102,"is_big":false}`|
|102004|`{"lock_des":0,"asserts":661021402004,"award":[[101500,50]],"version":102,"is_big":false}`|
|102005|`{"lock_des":0,"asserts":661021402005,"award":[[101500,50]],"version":102,"is_big":false}`|
|102006|`{"lock_des":681768,"asserts":661021402006,"award":[[3991200,1]],"version":102,"is_big":true}`|
|103001|`{"lock_des":0,"asserts":661021403001,"award":[[101500,50]],"version":103,"is_big":false}`|
|103002|`{"lock_des":0,"asserts":661021403002,"award":[[101500,50]],"version":103,"is_big":false}`|
|103003|`{"lock_des":0,"asserts":661021403003,"award":[[101500,50]],"version":103,"is_big":false}`|
|103004|`{"lock_des":0,"asserts":661021403004,"award":[[101500,50]],"version":103,"is_big":false}`|
|103005|`{"lock_des":0,"asserts":661021403005,"award":[[101500,50]],"version":103,"is_big":false}`|
|103006|`{"lock_des":681768,"asserts":661021403006,"award":[[3991200,1]],"version":103,"is_big":true}`|
|104001|`{"lock_des":0,"asserts":661021404001,"award":[[101500,50]],"version":104,"is_big":false}`|
|104002|`{"lock_des":0,"asserts":661021404002,"award":[[101500,50]],"version":104,"is_big":false}`|
|104003|`{"lock_des":0,"asserts":661021404003,"award":[[101500,50]],"version":104,"is_big":false}`|
|104004|`{"lock_des":0,"asserts":661021404004,"award":[[101500,50]],"version":104,"is_big":false}`|
|104005|`{"lock_des":0,"asserts":661021404005,"award":[[101500,50]],"version":104,"is_big":false}`|
|104006|`{"lock_des":681768,"asserts":661021404006,"award":[[3971200,1]],"version":104,"is_big":true}`|
|105001|`{"lock_des":0,"asserts":661021405001,"award":[[101500,50]],"version":105,"is_big":false}`|
|105002|`{"lock_des":0,"asserts":661021405002,"award":[[101500,50]],"version":105,"is_big":false}`|
|105003|`{"lock_des":0,"asserts":661021405003,"award":[[101500,50]],"version":105,"is_big":false}`|
|105004|`{"lock_des":0,"asserts":661021405004,"award":[[101500,50]],"version":105,"is_big":false}`|
|105005|`{"lock_des":0,"asserts":661021405005,"award":[[101500,50]],"version":105,"is_big":false}`|
|105006|`{"lock_des":681768,"asserts":661021405006,"award":[[3981200,1]],"version":105,"is_big":true}`|
|106001|`{"lock_des":0,"asserts":661021406001,"award":[[101500,50]],"version":106,"is_big":false}`|
|106002|`{"lock_des":0,"asserts":661021406002,"award":[[101500,50]],"version":106,"is_big":false}`|
|106003|`{"lock_des":0,"asserts":661021406003,"award":[[101500,50]],"version":106,"is_big":false}`|
|106004|`{"lock_des":0,"asserts":661021406004,"award":[[101500,50]],"version":106,"is_big":false}`|
|106005|`{"lock_des":0,"asserts":661021406005,"award":[[101500,50]],"version":106,"is_big":false}`|
|106006|`{"lock_des":681768,"asserts":661021406006,"award":[[3991200,1]],"version":106,"is_big":true}`|
|107001|`{"lock_des":0,"asserts":661021407001,"award":[[101500,50]],"version":107,"is_big":false}`|
|107002|`{"lock_des":0,"asserts":661021407002,"award":[[101500,50]],"version":107,"is_big":false}`|
|107003|`{"lock_des":0,"asserts":661021407003,"award":[[101500,50]],"version":107,"is_big":false}`|
|107004|`{"lock_des":0,"asserts":661021407004,"award":[[101500,50]],"version":107,"is_big":false}`|
|107005|`{"lock_des":0,"asserts":661021407005,"award":[[101500,50]],"version":107,"is_big":false}`|
|107006|`{"lock_des":681768,"asserts":661021407006,"award":[[3991200,1]],"version":107,"is_big":true}`|
|108001|`{"lock_des":0,"asserts":661021408001,"award":[[101500,50]],"version":108,"is_big":false}`|
|108002|`{"lock_des":0,"asserts":661021408002,"award":[[101500,50]],"version":108,"is_big":false}`|
|108003|`{"lock_des":0,"asserts":661021408003,"award":[[101500,50]],"version":108,"is_big":false}`|
|108004|`{"lock_des":0,"asserts":661021408004,"award":[[101500,50]],"version":108,"is_big":false}`|
|108005|`{"lock_des":0,"asserts":661021408005,"award":[[101500,50]],"version":108,"is_big":false}`|
|108006|`{"lock_des":681768,"asserts":661021408006,"award":[[4951200,1]],"version":108,"is_big":true}`|
|109001|`{"lock_des":0,"asserts":661021409001,"award":[[101500,50]],"version":109,"is_big":false}`|
|109002|`{"lock_des":0,"asserts":661021409002,"award":[[101500,50]],"version":109,"is_big":false}`|
|109003|`{"lock_des":0,"asserts":661021409003,"award":[[101500,50]],"version":109,"is_big":false}`|
|109004|`{"lock_des":0,"asserts":661021409004,"award":[[101500,50]],"version":109,"is_big":false}`|
|109005|`{"lock_des":0,"asserts":661021409005,"award":[[101500,50]],"version":109,"is_big":false}`|
|109006|`{"lock_des":681768,"asserts":661021409006,"award":[[4951200,1]],"version":109,"is_big":true}`|
|110001|`{"lock_des":0,"asserts":661021410001,"award":[[101500,50]],"version":110,"is_big":false}`|
|110002|`{"lock_des":0,"asserts":661021410002,"award":[[101500,50]],"version":110,"is_big":false}`|
|110003|`{"lock_des":0,"asserts":661021410003,"award":[[101500,50]],"version":110,"is_big":false}`|
|110004|`{"lock_des":0,"asserts":661021410004,"award":[[101500,50]],"version":110,"is_big":false}`|
|110005|`{"lock_des":0,"asserts":661021410005,"award":[[101500,50]],"version":110,"is_big":false}`|
|110006|`{"lock_des":681768,"asserts":661021410006,"award":[[4961200,1]],"version":110,"is_big":true}`|
|111001|`{"lock_des":0,"asserts":661021411001,"award":[[101500,50]],"version":111,"is_big":false}`|
|111002|`{"lock_des":0,"asserts":661021411002,"award":[[101500,50]],"version":111,"is_big":false}`|
|111003|`{"lock_des":0,"asserts":661021411003,"award":[[101500,50]],"version":111,"is_big":false}`|
|111004|`{"lock_des":0,"asserts":661021411004,"award":[[101500,50]],"version":111,"is_big":false}`|
|111005|`{"lock_des":0,"asserts":661021411005,"award":[[101500,50]],"version":111,"is_big":false}`|
|111006|`{"lock_des":681768,"asserts":661021411006,"award":[[4961200,1]],"version":111,"is_big":true}`|

## Version

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|txt_title|number|110|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|txt_tip|number|110|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|110|本表行键；与其他表同值不自动代表同一对象。|
|red_type|number|110|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"red_type":0}`|
|2|`{"red_type":0}`|
|3|`{"red_type":0}`|
|4|`{"red_type":0}`|
|5|`{"red_type":0}`|
|6|`{"red_type":0}`|
|7|`{"red_type":0}`|
|8|`{"red_type":0}`|
|9|`{"red_type":0}`|
|10|`{"red_type":0}`|
|11|`{"red_type":0}`|
|12|`{"red_type":0}`|
|13|`{"red_type":0}`|
|14|`{"red_type":0}`|
|15|`{"red_type":0}`|
|16|`{"red_type":0}`|
|17|`{"red_type":0}`|
|100|`{"red_type":0}`|
|101|`{"red_type":0}`|
|102|`{"red_type":0}`|
|103|`{"red_type":0}`|
|104|`{"red_type":0}`|
|105|`{"red_type":0}`|
|106|`{"red_type":0}`|
|107|`{"red_type":0}`|
|108|`{"red_type":0}`|
|109|`{"red_type":0}`|
|110|`{"red_type":0}`|
|111|`{"red_type":0}`|
|201|`{"red_type":1}`|
|202|`{"red_type":1}`|
|203|`{"red_type":1}`|
|204|`{"red_type":1}`|
|205|`{"red_type":1}`|
|206|`{"red_type":1}`|
|207|`{"red_type":1}`|
|208|`{"red_type":1}`|
|301|`{"red_type":0}`|
|302|`{"red_type":0}`|
|303|`{"red_type":0}`|
|304|`{"red_type":0}`|
|305|`{"red_type":0}`|
|306|`{"red_type":0}`|
|307|`{"red_type":0}`|
|308|`{"red_type":0}`|
|309|`{"red_type":0}`|
|310|`{"red_type":0}`|
|311|`{"red_type":0}`|
|312|`{"red_type":0}`|
|313|`{"red_type":0}`|
|314|`{"red_type":0}`|
|315|`{"red_type":0}`|
|316|`{"red_type":0}`|
|317|`{"red_type":0}`|
|318|`{"red_type":0}`|
|319|`{"red_type":0}`|
|320|`{"red_type":0}`|
|321|`{"red_type":0}`|
|322|`{"red_type":0}`|
|323|`{"red_type":0}`|
|324|`{"red_type":0}`|
|325|`{"red_type":0}`|
|401|`{"red_type":0}`|
|402|`{"red_type":0}`|
|403|`{"red_type":0}`|
|404|`{"red_type":0}`|
|405|`{"red_type":0}`|
|406|`{"red_type":0}`|
|407|`{"red_type":0}`|
|408|`{"red_type":0}`|
|409|`{"red_type":0}`|
|410|`{"red_type":0}`|
|411|`{"red_type":0}`|
|418|`{"red_type":0}`|
|501|`{"red_type":0}`|
|502|`{"red_type":0}`|
|503|`{"red_type":0}`|
|504|`{"red_type":0}`|
|505|`{"red_type":0}`|
|506|`{"red_type":0}`|
|507|`{"red_type":0}`|
|508|`{"red_type":0}`|
|509|`{"red_type":0}`|
|510|`{"red_type":0}`|
|511|`{"red_type":0}`|
|512|`{"red_type":0}`|
|513|`{"red_type":0}`|
|514|`{"red_type":0}`|
|515|`{"red_type":0}`|
|516|`{"red_type":0}`|
|601|`{"red_type":0}`|
|603|`{"red_type":0}`|
|604|`{"red_type":0}`|
|605|`{"red_type":0}`|
|702|`{"red_type":0}`|
|703|`{"red_type":0}`|
|704|`{"red_type":0}`|
|705|`{"red_type":0}`|
|706|`{"red_type":0}`|
|707|`{"red_type":0}`|
|708|`{"red_type":0}`|
|709|`{"red_type":0}`|
|801|`{"red_type":0}`|
|901|`{"red_type":0}`|
|1001|`{"red_type":0}`|
|1002|`{"red_type":0}`|
|1003|`{"red_type":0}`|
|1004|`{"red_type":0}`|
|1005|`{"red_type":0}`|
|1006|`{"red_type":0}`|

## Config

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|lock_des|number|852|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|asserts|undefined/number|852|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|recommend_sort|number|852|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|852|本表行键；与其他表同值不自动代表同一对象。|
|version|number|852|版本引用；必须按活动类型及其消费者查对应版本表。|
|gift|number|852|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部852行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{"lock_des":0,"version":1}`|
|1002|`{"lock_des":0,"version":1}`|
|1003|`{"lock_des":0,"version":1}`|

## Show

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|role_head_res|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|title_name|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|title_bg_res|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|di_effect_res|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|text_stylt_id|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bg_res|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|317|`{}`|

## GiftShopShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|img_role|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|pos_role|undefined|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|202|`{}`|
|205|`{}`|
|206|`{}`|
|207|`{}`|
|208|`{}`|
