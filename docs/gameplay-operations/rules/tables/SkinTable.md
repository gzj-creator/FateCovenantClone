# SkinTable 规则参数

来源：[personal-server/assets/tables/SkinTable.data.lua.json.gz](../../../../personal-server/assets/tables/SkinTable.data.lua.json.gz)，SHA256：`6de30f0366a8249631490af1ceef3a1d490a8ddd11f32078a8b8a5a61ddb04f6`。

[完整逐行JSON](SkinTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[ExchangeConst](#exchangeconst)|1|decoded-rows|
|[ExchangeLib](#exchangelib)|1|decoded-rows|
|[Quality](#quality)|5|decoded-rows|
|[HandbookAttr](#handbookattr)|6|decoded-rows|
|[HandbookShow](#handbookshow)|106|decoded-rows|
|[Increase](#increase)|30|decoded-rows|
|[Show](#show)|66|decoded-rows|
|[AttrParam](#attrparam)|15|decoded-rows|
|[Attr](#attr)|4|decoded-rows|
|[Skin](#skin)|103|decoded-rows|

## ExchangeConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|exchange_item|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"exchange_item":2701900}`|

## ExchangeLib

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|price|number|1|原价格整数；RechargeTable现金商品消费者使用分，其他表必须核币种和单位。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|100712|`{"price":1}`|

## Quality

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|icon_bottom|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10|`{}`|
|30|`{}`|
|40|`{}`|
|50|`{}`|
|60|`{}`|

## HandbookAttr

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|attr|array|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"attr":[[201,2400],[202,400],[203,240],[204,240]]}`|
|2|`{"attr":[[201,4800],[202,800],[203,480],[204,480]]}`|
|3|`{"attr":[[201,7200],[202,1200],[203,720],[204,720]]}`|
|4|`{"attr":[[201,3000],[202,500],[203,300],[204,300]]}`|
|5|`{"attr":[[201,6000],[202,1000],[203,600],[204,600]]}`|
|6|`{"attr":[[201,9000],[202,1500],[203,900],[204,900]]}`|

## HandbookShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|106|本表行键；与其他表同值不自动代表同一对象。|
|point_skin|number|106|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|point_role|number|106|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skin_type|number|106|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|page_type|number|106|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|handbook_attr|number|106|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|not_show|boolean|106|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"point_skin":100212,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|2|`{"point_skin":100312,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|3|`{"point_skin":100612,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|4|`{"point_skin":100712,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|5|`{"point_skin":101112,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|6|`{"point_skin":101212,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|7|`{"point_skin":151912,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|8|`{"point_skin":152612,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|9|`{"point_skin":152812,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|10|`{"point_skin":150312,"point_role":0,"skin_type":1002,"page_type":1,"handbook_attr":1}`|
|11|`{"point_skin":170112,"point_role":0,"skin_type":1002,"page_type":1,"handbook_attr":1}`|
|12|`{"point_skin":151612,"point_role":0,"skin_type":1002,"page_type":1,"handbook_attr":1}`|
|13|`{"point_skin":151712,"point_role":0,"skin_type":1002,"page_type":1,"handbook_attr":1}`|
|14|`{"point_skin":152012,"point_role":0,"skin_type":1002,"page_type":1,"handbook_attr":1}`|
|15|`{"point_skin":152112,"point_role":0,"skin_type":1002,"page_type":1,"handbook_attr":1}`|
|16|`{"point_skin":152212,"point_role":0,"skin_type":1002,"page_type":1,"handbook_attr":1}`|
|17|`{"point_skin":152312,"point_role":0,"skin_type":1002,"page_type":1,"handbook_attr":1}`|
|18|`{"point_skin":152412,"point_role":0,"skin_type":1002,"page_type":1,"handbook_attr":1}`|
|19|`{"point_skin":152512,"point_role":0,"skin_type":1002,"page_type":1,"handbook_attr":1}`|
|20|`{"point_skin":152712,"point_role":0,"skin_type":1002,"page_type":1,"handbook_attr":1}`|
|21|`{"point_skin":152912,"point_role":0,"skin_type":1002,"page_type":1,"handbook_attr":1}`|
|22|`{"point_skin":153012,"point_role":0,"skin_type":1002,"page_type":1,"handbook_attr":1}`|
|23|`{"point_skin":154112,"point_role":0,"skin_type":1002,"page_type":1,"handbook_attr":1}`|
|26|`{"point_skin":0,"point_role":1,"skin_type":1001,"page_type":3,"handbook_attr":4}`|
|27|`{"point_skin":0,"point_role":2,"skin_type":1001,"page_type":3,"handbook_attr":5}`|
|28|`{"point_skin":0,"point_role":3,"skin_type":1001,"page_type":3,"handbook_attr":5}`|
|29|`{"point_skin":0,"point_role":4,"skin_type":1001,"page_type":3,"handbook_attr":5}`|
|30|`{"point_skin":0,"point_role":5,"skin_type":1001,"page_type":3,"handbook_attr":4}`|
|31|`{"point_skin":0,"point_role":6,"skin_type":1001,"page_type":3,"handbook_attr":5}`|
|32|`{"point_skin":0,"point_role":7,"skin_type":1001,"page_type":3,"handbook_attr":4}`|
|33|`{"point_skin":0,"point_role":8,"skin_type":1001,"page_type":3,"handbook_attr":5}`|
|34|`{"point_skin":0,"point_role":9,"skin_type":1001,"page_type":3,"handbook_attr":5}`|
|35|`{"point_skin":0,"point_role":10,"skin_type":1001,"page_type":3,"handbook_attr":4}`|
|36|`{"point_skin":0,"point_role":11,"skin_type":1001,"page_type":3,"handbook_attr":4}`|
|37|`{"point_skin":0,"point_role":12,"skin_type":1001,"page_type":3,"handbook_attr":5}`|
|38|`{"point_skin":0,"point_role":13,"skin_type":1001,"page_type":3,"handbook_attr":5}`|
|39|`{"point_skin":0,"point_role":14,"skin_type":1001,"page_type":3,"handbook_attr":5}`|
|40|`{"point_skin":0,"point_role":15,"skin_type":1001,"page_type":3,"handbook_attr":5}`|
|41|`{"point_skin":0,"point_role":16,"skin_type":1001,"page_type":3,"handbook_attr":5}`|
|42|`{"point_skin":0,"point_role":17,"skin_type":1001,"page_type":3,"handbook_attr":5}`|
|43|`{"point_skin":0,"point_role":18,"skin_type":1001,"page_type":3,"handbook_attr":5}`|
|44|`{"point_skin":0,"point_role":19,"skin_type":1001,"page_type":3,"handbook_attr":4}`|
|45|`{"point_skin":0,"point_role":25,"skin_type":1001,"page_type":3,"handbook_attr":5}`|
|1001|`{"point_skin":100812,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1002|`{"point_skin":153112,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1003|`{"point_skin":153312,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1004|`{"point_skin":153412,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1005|`{"point_skin":153512,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1006|`{"point_skin":153612,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1007|`{"point_skin":153712,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1008|`{"point_skin":153812,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1009|`{"point_skin":153912,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1010|`{"point_skin":154012,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1011|`{"point_skin":154412,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1012|`{"point_skin":154512,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1013|`{"point_skin":154612,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1014|`{"point_skin":154712,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1015|`{"point_skin":154812,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1016|`{"point_skin":154912,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1017|`{"point_skin":155012,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1018|`{"point_skin":155112,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1019|`{"point_skin":155212,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1020|`{"point_skin":155512,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1021|`{"point_skin":155612,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1022|`{"point_skin":155712,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1023|`{"point_skin":155812,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1024|`{"point_skin":155912,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1025|`{"point_skin":156012,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1026|`{"point_skin":156212,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1027|`{"point_skin":156312,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1028|`{"point_skin":156412,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1029|`{"point_skin":156712,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1030|`{"point_skin":156812,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1031|`{"point_skin":156912,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1032|`{"point_skin":157012,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1033|`{"point_skin":157112,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1034|`{"point_skin":157212,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1035|`{"point_skin":157312,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1036|`{"point_skin":157412,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1037|`{"point_skin":157512,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1038|`{"point_skin":157612,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1039|`{"point_skin":157712,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1040|`{"point_skin":157812,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1041|`{"point_skin":157912,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1042|`{"point_skin":158012,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1043|`{"point_skin":158112,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1044|`{"point_skin":158212,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1045|`{"point_skin":158312,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1046|`{"point_skin":158412,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|1047|`{"point_skin":158512,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|2001|`{"point_skin":150112,"point_role":0,"skin_type":1002,"page_type":1,"handbook_attr":1}`|
|2003|`{"point_skin":153212,"point_role":0,"skin_type":1002,"page_type":1,"handbook_attr":1}`|
|2004|`{"point_skin":154112,"point_role":0,"skin_type":1002,"page_type":1,"handbook_attr":1}`|
|2005|`{"point_skin":154312,"point_role":0,"skin_type":1002,"page_type":1,"handbook_attr":1}`|
|2006|`{"point_skin":154212,"point_role":0,"skin_type":1002,"page_type":1,"handbook_attr":1}`|
|2007|`{"point_skin":155312,"point_role":0,"skin_type":1002,"page_type":1,"handbook_attr":1}`|
|2008|`{"point_skin":155412,"point_role":0,"skin_type":1002,"page_type":1,"handbook_attr":1}`|
|2009|`{"point_skin":156512,"point_role":0,"skin_type":1002,"page_type":1,"handbook_attr":1}`|
|2010|`{"point_skin":156612,"point_role":0,"skin_type":1002,"page_type":2,"handbook_attr":2}`|
|2011|`{"point_skin":100912,"point_role":0,"skin_type":1002,"page_type":1,"handbook_attr":1}`|
|2012|`{"point_skin":170212,"point_role":0,"skin_type":1002,"page_type":1,"handbook_attr":1}`|
|2013|`{"point_skin":170312,"point_role":0,"skin_type":1002,"page_type":1,"handbook_attr":1}`|
|2014|`{"point_skin":170412,"point_role":0,"skin_type":1002,"page_type":1,"handbook_attr":1}`|
|2015|`{"point_skin":170512,"point_role":0,"skin_type":1002,"page_type":1,"handbook_attr":1}`|
|2016|`{"point_skin":170612,"point_role":0,"skin_type":1002,"page_type":1,"handbook_attr":1}`|
|2017|`{"point_skin":158612,"point_role":0,"skin_type":1002,"page_type":1,"handbook_attr":1}`|

## Increase

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|30|本表行键；与其他表同值不自动代表同一对象。|
|skin_quality|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|consume|array|30|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|score|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr|array|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10001|`{"skin_quality":10,"consume":[[628002,3]],"score":30,"attr":[[201,1200],[202,200],[203,120],[204,120]]}`|
|10002|`{"skin_quality":10,"consume":[[628002,6]],"score":60,"attr":[[201,3600],[202,600],[203,360],[204,360]]}`|
|10003|`{"skin_quality":10,"consume":[[628002,9]],"score":90,"attr":[[201,6000],[202,1000],[203,600],[204,600]]}`|
|10004|`{"skin_quality":10,"consume":[[628002,12]],"score":120,"attr":[[201,9600],[202,1600],[203,960],[204,960]]}`|
|10005|`{"skin_quality":10,"consume":[[628002,15]],"score":150,"attr":[[201,14400],[202,2400],[203,1440],[204,1440]]}`|
|20001|`{"skin_quality":20,"consume":[[628002,3]],"score":30,"attr":[[201,1200],[202,200],[203,120],[204,120]]}`|
|20002|`{"skin_quality":20,"consume":[[628002,6]],"score":60,"attr":[[201,3600],[202,600],[203,360],[204,360]]}`|
|20003|`{"skin_quality":20,"consume":[[628002,9]],"score":90,"attr":[[201,6000],[202,1000],[203,600],[204,600]]}`|
|20004|`{"skin_quality":20,"consume":[[628002,12]],"score":120,"attr":[[201,9600],[202,1600],[203,960],[204,960]]}`|
|20005|`{"skin_quality":20,"consume":[[628002,15]],"score":150,"attr":[[201,14400],[202,2400],[203,1440],[204,1440]]}`|
|30001|`{"skin_quality":30,"consume":[[628002,3]],"score":30,"attr":[[201,1200],[202,200],[203,120],[204,120]]}`|
|30002|`{"skin_quality":30,"consume":[[628002,6]],"score":60,"attr":[[201,3600],[202,600],[203,360],[204,360]]}`|
|30003|`{"skin_quality":30,"consume":[[628002,9]],"score":90,"attr":[[201,6000],[202,1000],[203,600],[204,600]]}`|
|30004|`{"skin_quality":30,"consume":[[628002,12]],"score":120,"attr":[[201,9600],[202,1600],[203,960],[204,960]]}`|
|30005|`{"skin_quality":30,"consume":[[628002,15]],"score":150,"attr":[[201,14400],[202,2400],[203,1440],[204,1440]]}`|
|40001|`{"skin_quality":40,"consume":[[628002,3]],"score":30,"attr":[[201,1200],[202,200],[203,120],[204,120]]}`|
|40002|`{"skin_quality":40,"consume":[[628002,6]],"score":60,"attr":[[201,3600],[202,600],[203,360],[204,360]]}`|
|40003|`{"skin_quality":40,"consume":[[628002,9]],"score":90,"attr":[[201,6000],[202,1000],[203,600],[204,600]]}`|
|40004|`{"skin_quality":40,"consume":[[628002,12]],"score":120,"attr":[[201,9600],[202,1600],[203,960],[204,960]]}`|
|40005|`{"skin_quality":40,"consume":[[628002,15]],"score":150,"attr":[[201,14400],[202,2400],[203,1440],[204,1440]]}`|
|50001|`{"skin_quality":50,"consume":[[628002,3]],"score":11,"attr":[[201,1200],[202,200],[203,120],[204,120]]}`|
|50002|`{"skin_quality":50,"consume":[[628002,6]],"score":22,"attr":[[201,3600],[202,600],[203,360],[204,360]]}`|
|50003|`{"skin_quality":50,"consume":[[628002,9]],"score":33,"attr":[[201,6000],[202,1000],[203,600],[204,600]]}`|
|50004|`{"skin_quality":50,"consume":[[628002,12]],"score":43,"attr":[[201,9600],[202,1600],[203,960],[204,960]]}`|
|50005|`{"skin_quality":50,"consume":[[628002,15]],"score":54,"attr":[[201,14400],[202,2400],[203,1440],[204,1440]]}`|
|60001|`{"skin_quality":60,"consume":[[628002,3]],"score":22,"attr":[[201,1200],[202,200],[203,120],[204,120]]}`|
|60002|`{"skin_quality":60,"consume":[[628002,6]],"score":43,"attr":[[201,3600],[202,600],[203,360],[204,360]]}`|
|60003|`{"skin_quality":60,"consume":[[628002,9]],"score":65,"attr":[[201,6000],[202,1000],[203,600],[204,600]]}`|
|60004|`{"skin_quality":60,"consume":[[628002,12]],"score":88,"attr":[[201,9600],[202,1600],[203,960],[204,960]]}`|
|60005|`{"skin_quality":60,"consume":[[628002,15]],"score":108,"attr":[[201,14400],[202,2400],[203,1440],[204,1440]]}`|

## Show

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|66|本表行键；与其他表同值不自动代表同一对象。|
|belong_id|number|66|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|advance_skin|object/array|66|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|normal_name|number|66|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|advance_name|object/array|66|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|100212|`{}`|
|100312|`{}`|
|100612|`{}`|
|100712|`{}`|
|100812|`{}`|
|100912|`{}`|
|101112|`{}`|
|101212|`{}`|
|150112|`{}`|
|150312|`{}`|
|151612|`{}`|
|151712|`{}`|
|151912|`{}`|
|152012|`{}`|
|152112|`{}`|
|152212|`{}`|
|152312|`{}`|
|152412|`{}`|
|152512|`{}`|
|152612|`{}`|
|152712|`{}`|
|152812|`{}`|
|152912|`{}`|
|153012|`{}`|
|153112|`{}`|
|153212|`{}`|
|153512|`{}`|
|153812|`{}`|
|154112|`{}`|
|154212|`{}`|
|154312|`{}`|
|154412|`{}`|
|154712|`{}`|
|155012|`{}`|
|155312|`{}`|
|155412|`{}`|
|155512|`{}`|
|155812|`{}`|
|156212|`{}`|
|156512|`{}`|
|156612|`{}`|
|156712|`{}`|
|156812|`{}`|
|156912|`{}`|
|157012|`{}`|
|157212|`{}`|
|157412|`{}`|
|157612|`{}`|
|157812|`{}`|
|157912|`{}`|
|158012|`{}`|
|158112|`{}`|
|158212|`{}`|
|158312|`{}`|
|158412|`{}`|
|158512|`{}`|
|158612|`{}`|
|170112|`{}`|
|170212|`{}`|
|170312|`{}`|
|170412|`{}`|
|170512|`{}`|
|170612|`{}`|
|200112|`{}`|
|200212|`{}`|
|200312|`{}`|

## AttrParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|15|本表行键；与其他表同值不自动代表同一对象。|
|attr|array|15|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"attr":[[1,8000],[2,1000]]}`|
|2|`{"attr":[[1,16000],[2,2000]]}`|
|3|`{"attr":[[1,24000],[2,3000]]}`|
|4|`{"attr":[[1,32000],[2,4000]]}`|
|5|`{"attr":[[1,40000],[2,5000]]}`|
|6|`{"attr":[[1,20000],[2,2500]]}`|
|7|`{"attr":[[1,40000],[2,5000]]}`|
|8|`{"attr":[[1,60000],[2,7500]]}`|
|9|`{"attr":[[1,80000],[2,10000]]}`|
|10|`{"attr":[[1,100000],[2,12500]]}`|
|11|`{"attr":[[1,30000],[2,3750],[5,100],[6,100]]}`|
|12|`{"attr":[[1,60000],[2,7500],[5,200],[6,200]]}`|
|13|`{"attr":[[1,90000],[2,11250],[5,300],[6,300]]}`|
|14|`{"attr":[[1,120000],[2,15000],[5,400],[6,400]]}`|
|15|`{"attr":[[1,150000],[2,18750],[5,500],[6,500]]}`|

## Attr

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|attr|array|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|extra_power|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"attr":[[205,200],[206,200],[210,200]],"extra_power":0}`|
|2|`{"attr":[[205,100],[206,100],[210,100]],"extra_power":0}`|
|3|`{"attr":[[205,400],[206,400],[210,400]],"extra_power":0}`|
|4|`{"attr":[[205,0],[206,0],[210,0]],"extra_power":0}`|

## Skin

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|103|本表行键；与其他表同值不自动代表同一对象。|
|belong_id|number|103|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|style|number|103|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|free_head|number|103|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr|number|103|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|nick_name|number|103|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|single_name|number|103|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tag_icon|string|103|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|desc|number|103|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|assistant|number|103|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|circle_tag_icon|string|103|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|score|number|103|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|100212|`{"free_head":106308,"attr":1,"score":360}`|
|100312|`{"free_head":106908,"attr":1,"score":360}`|
|100612|`{"free_head":106208,"attr":1,"score":360}`|
|100712|`{"free_head":106408,"attr":1,"score":360}`|
|100812|`{"free_head":106508,"attr":1,"score":360}`|
|100912|`{"free_head":105808,"attr":2,"score":180}`|
|101112|`{"free_head":106808,"attr":1,"score":360}`|
|101212|`{"free_head":108508,"attr":1,"score":360}`|
|150112|`{"free_head":106008,"attr":2,"score":180}`|
|150312|`{"free_head":107108,"attr":2,"score":180}`|
|151612|`{"free_head":108208,"attr":2,"score":180}`|
|151712|`{"free_head":108408,"attr":2,"score":180}`|
|151912|`{"free_head":109208,"attr":1,"score":360}`|
|152012|`{"free_head":109108,"attr":2,"score":180}`|
|152112|`{"free_head":109308,"attr":2,"score":180}`|
|152212|`{"free_head":109408,"attr":2,"score":180}`|
|152312|`{"free_head":110608,"attr":2,"score":180}`|
|152412|`{"free_head":110908,"attr":2,"score":180}`|
|152512|`{"free_head":111508,"attr":2,"score":180}`|
|152612|`{"free_head":111708,"attr":1,"score":360}`|
|152712|`{"free_head":112008,"attr":2,"score":180}`|
|152812|`{"free_head":112108,"attr":1,"score":360}`|
|152912|`{"free_head":105608,"attr":2,"score":180}`|
|153012|`{"free_head":113408,"attr":2,"score":180}`|
|153112|`{"free_head":113908,"attr":1,"score":360}`|
|153212|`{"free_head":114008,"attr":2,"score":180}`|
|153312|`{"free_head":114108,"attr":3,"score":360}`|
|153412|`{"free_head":114208,"attr":4,"score":360}`|
|153512|`{"free_head":114608,"attr":1,"score":360}`|
|153612|`{"free_head":114708,"attr":3,"score":360}`|
|153712|`{"free_head":114808,"attr":4,"score":360}`|
|153812|`{"free_head":114908,"attr":1,"score":360}`|
|153912|`{"free_head":115008,"attr":3,"score":360}`|
|154012|`{"free_head":115108,"attr":4,"score":360}`|
|154112|`{"free_head":112208,"attr":2,"score":180}`|
|154212|`{"free_head":115608,"attr":2,"score":180}`|
|154312|`{"free_head":105708,"attr":2,"score":180}`|
|154412|`{"free_head":115208,"attr":1,"score":360}`|
|154512|`{"free_head":115308,"attr":3,"score":360}`|
|154612|`{"free_head":115408,"attr":4,"score":360}`|
|154712|`{"free_head":115708,"attr":1,"score":360}`|
|154812|`{"free_head":115808,"attr":3,"score":360}`|
|154912|`{"free_head":115908,"attr":4,"score":360}`|
|155012|`{"free_head":116008,"attr":1,"score":360}`|
|155112|`{"free_head":116108,"attr":3,"score":360}`|
|155212|`{"free_head":116208,"attr":4,"score":360}`|
|155312|`{"free_head":116508,"attr":2,"score":180}`|
|155412|`{"free_head":116608,"attr":2,"score":180}`|
|155512|`{"free_head":116708,"attr":1,"score":360}`|
|155612|`{"free_head":116808,"attr":3,"score":360}`|
|155712|`{"free_head":116908,"attr":4,"score":360}`|
|155812|`{"free_head":117008,"attr":1,"score":360}`|
|155912|`{"free_head":117108,"attr":3,"score":360}`|
|156012|`{"free_head":117208,"attr":4,"score":360}`|
|156112|`{"free_head":107808,"attr":2,"score":180}`|
|156212|`{"free_head":117308,"attr":1,"score":360}`|
|156312|`{"free_head":117408,"attr":3,"score":360}`|
|156412|`{"free_head":117508,"attr":4,"score":360}`|
|156512|`{"free_head":117608,"attr":2,"score":180}`|
|156612|`{"free_head":117708,"attr":1,"score":360}`|
|156712|`{"free_head":118308,"attr":1,"score":360}`|
|156812|`{"free_head":118408,"attr":1,"score":360}`|
|156912|`{"free_head":118508,"attr":1,"score":360}`|
|157012|`{"free_head":118608,"attr":1,"score":360}`|
|157112|`{"free_head":118708,"attr":3,"score":360}`|
|157212|`{"free_head":118808,"attr":1,"score":360}`|
|157312|`{"free_head":118908,"attr":3,"score":360}`|
|157412|`{"free_head":119008,"attr":1,"score":360}`|
|157512|`{"free_head":119108,"attr":3,"score":360}`|
|157612|`{"free_head":119208,"attr":1,"score":360}`|
|157712|`{"free_head":119308,"attr":3,"score":360}`|
|157812|`{"free_head":120208,"attr":1,"score":360}`|
|157912|`{"free_head":120308,"attr":1,"score":360}`|
|158012|`{"free_head":120408,"attr":1,"score":360}`|
|158112|`{"free_head":120508,"attr":1,"score":360}`|
|158212|`{"free_head":121108,"attr":1,"score":360}`|
|158312|`{"free_head":121208,"attr":1,"score":360}`|
|158412|`{"free_head":123108,"attr":1,"score":360}`|
|158512|`{"free_head":123208,"attr":1,"score":360}`|
|158612|`{"free_head":124808,"attr":2,"score":180}`|
|170112|`{"free_head":107808,"attr":2,"score":180}`|
|170212|`{"free_head":119808,"attr":2,"score":180}`|
|170312|`{"free_head":119908,"attr":2,"score":180}`|
|170412|`{"free_head":121708,"attr":2,"score":180}`|
|170512|`{"free_head":122008,"attr":2,"score":180}`|
|170612|`{"free_head":122408,"attr":2,"score":180}`|
|200112|`{"free_head":110008,"attr":2,"score":0}`|
|200212|`{"free_head":110108,"attr":2,"score":0}`|
|200312|`{"free_head":111208,"attr":2,"score":0}`|
|200412|`{"free_head":114408,"attr":2,"score":0}`|
|200512|`{"free_head":117908,"attr":2,"score":0}`|
|200612|`{"free_head":120108,"attr":2,"score":0}`|
|200712|`{"free_head":120908,"attr":2,"score":0}`|
|200812|`{"free_head":122208,"attr":2,"score":0}`|
|200912|`{"free_head":123508,"attr":2,"score":0}`|
|201012|`{"free_head":124008,"attr":2,"score":0}`|
|201112|`{"free_head":124408,"attr":2,"score":0}`|
|201212|`{"free_head":124908,"attr":2,"score":0}`|
|201312|`{"free_head":125408,"attr":2,"score":0}`|
|300112|`{"free_head":0,"attr":2,"score":0}`|
|300212|`{"free_head":0,"attr":2,"score":0}`|
|300312|`{"free_head":0,"attr":2,"score":0}`|
|300412|`{"free_head":0,"attr":2,"score":0}`|
