# HundredDrawActTable 规则参数

来源：[personal-server/assets/tables/HundredDrawActTable.data.lua.json.gz](../../../../personal-server/assets/tables/HundredDrawActTable.data.lua.json.gz)，SHA256：`157c2df26c1f0617e1b35ed0725a29c0204d04f404de0d18d8833124da1a3d5c`。

[完整逐行JSON](HundredDrawActTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[ThemeType](#themetype)|4|decoded-rows|
|[GuaranteeWeight](#guaranteeweight)|159|decoded-rows|
|[StarTask](#startask)|12|decoded-rows|
|[PoolAward](#poolaward)|48|decoded-rows|
|[PoolShow](#poolshow)|8|decoded-rows|
|[PoolType](#pooltype)|2|decoded-rows|
|[Pool](#pool)|6|decoded-rows|
|[QualityShow](#qualityshow)|2|decoded-rows|
|[AwardType](#awardtype)|6|decoded-rows|
|[Version](#version)|10|decoded-rows|
|[TargetShow](#targetshow)|17|decoded-rows|
|[Marquee](#marquee)|3|decoded-rows|
|[ProcessAward](#processaward)|143|decoded-rows|
|[StarShow](#starshow)|6|decoded-rows|

## ThemeType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|txt_name|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{}`|
|102|`{}`|
|103|`{}`|
|104|`{}`|

## GuaranteeWeight

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|159|本表行键；与其他表同值不自动代表同一对象。|
|belong_version|number|159|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|weight|number|159|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|
|times_range|array|159|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"belong_version":101,"weight":1,"times_range":[1,30]}`|
|102|`{"belong_version":101,"weight":2,"times_range":[31,40]}`|
|103|`{"belong_version":101,"weight":3,"times_range":[41,50]}`|
|104|`{"belong_version":101,"weight":4,"times_range":[51,51]}`|
|105|`{"belong_version":101,"weight":5,"times_range":[52,52]}`|
|106|`{"belong_version":101,"weight":6,"times_range":[53,53]}`|
|107|`{"belong_version":101,"weight":7,"times_range":[54,54]}`|
|108|`{"belong_version":101,"weight":8,"times_range":[55,55]}`|
|109|`{"belong_version":101,"weight":9,"times_range":[56,56]}`|
|110|`{"belong_version":101,"weight":10,"times_range":[57,57]}`|
|111|`{"belong_version":101,"weight":11,"times_range":[58,58]}`|
|112|`{"belong_version":101,"weight":12,"times_range":[59,59]}`|
|113|`{"belong_version":101,"weight":13,"times_range":[60,60]}`|
|114|`{"belong_version":101,"weight":14,"times_range":[61,61]}`|
|115|`{"belong_version":101,"weight":15,"times_range":[62,62]}`|
|116|`{"belong_version":101,"weight":17,"times_range":[63,63]}`|
|117|`{"belong_version":101,"weight":19,"times_range":[64,64]}`|
|118|`{"belong_version":101,"weight":21,"times_range":[65,65]}`|
|119|`{"belong_version":101,"weight":23,"times_range":[66,66]}`|
|120|`{"belong_version":101,"weight":25,"times_range":[67,67]}`|
|121|`{"belong_version":101,"weight":27,"times_range":[68,68]}`|
|122|`{"belong_version":101,"weight":29,"times_range":[69,69]}`|
|123|`{"belong_version":101,"weight":31,"times_range":[70,70]}`|
|124|`{"belong_version":101,"weight":36,"times_range":[71,71]}`|
|125|`{"belong_version":101,"weight":41,"times_range":[72,72]}`|
|126|`{"belong_version":101,"weight":51,"times_range":[73,73]}`|
|127|`{"belong_version":101,"weight":71,"times_range":[74,74]}`|
|128|`{"belong_version":101,"weight":101,"times_range":[75,75]}`|
|129|`{"belong_version":101,"weight":151,"times_range":[76,76]}`|
|130|`{"belong_version":101,"weight":201,"times_range":[77,77]}`|
|131|`{"belong_version":101,"weight":251,"times_range":[78,78]}`|
|132|`{"belong_version":101,"weight":301,"times_range":[79,79]}`|
|133|`{"belong_version":101,"weight":351,"times_range":[80,80]}`|
|134|`{"belong_version":101,"weight":401,"times_range":[81,81]}`|
|135|`{"belong_version":101,"weight":451,"times_range":[82,82]}`|
|136|`{"belong_version":101,"weight":501,"times_range":[83,83]}`|
|137|`{"belong_version":101,"weight":601,"times_range":[84,84]}`|
|138|`{"belong_version":101,"weight":701,"times_range":[85,85]}`|
|139|`{"belong_version":101,"weight":801,"times_range":[86,86]}`|
|140|`{"belong_version":101,"weight":1001,"times_range":[87,87]}`|
|141|`{"belong_version":101,"weight":1201,"times_range":[88,88]}`|
|142|`{"belong_version":101,"weight":1401,"times_range":[89,89]}`|
|143|`{"belong_version":101,"weight":1601,"times_range":[90,90]}`|
|144|`{"belong_version":101,"weight":1801,"times_range":[91,91]}`|
|145|`{"belong_version":101,"weight":2001,"times_range":[92,92]}`|
|146|`{"belong_version":101,"weight":2201,"times_range":[93,93]}`|
|147|`{"belong_version":101,"weight":2401,"times_range":[94,94]}`|
|148|`{"belong_version":101,"weight":2601,"times_range":[95,95]}`|
|149|`{"belong_version":101,"weight":3001,"times_range":[96,96]}`|
|150|`{"belong_version":101,"weight":3501,"times_range":[97,97]}`|
|151|`{"belong_version":101,"weight":4001,"times_range":[98,98]}`|
|152|`{"belong_version":101,"weight":5001,"times_range":[99,99]}`|
|153|`{"belong_version":101,"weight":5002,"times_range":[100,100]}`|
|102001|`{"belong_version":102,"weight":1,"times_range":[1,30]}`|
|102002|`{"belong_version":102,"weight":2,"times_range":[31,40]}`|
|102003|`{"belong_version":102,"weight":3,"times_range":[41,50]}`|
|102004|`{"belong_version":102,"weight":4,"times_range":[51,51]}`|
|102005|`{"belong_version":102,"weight":5,"times_range":[52,52]}`|
|102006|`{"belong_version":102,"weight":6,"times_range":[53,53]}`|
|102007|`{"belong_version":102,"weight":7,"times_range":[54,54]}`|
|102008|`{"belong_version":102,"weight":8,"times_range":[55,55]}`|
|102009|`{"belong_version":102,"weight":9,"times_range":[56,56]}`|
|102010|`{"belong_version":102,"weight":10,"times_range":[57,57]}`|
|102011|`{"belong_version":102,"weight":11,"times_range":[58,58]}`|
|102012|`{"belong_version":102,"weight":12,"times_range":[59,59]}`|
|102013|`{"belong_version":102,"weight":13,"times_range":[60,60]}`|
|102014|`{"belong_version":102,"weight":14,"times_range":[61,61]}`|
|102015|`{"belong_version":102,"weight":15,"times_range":[62,62]}`|
|102016|`{"belong_version":102,"weight":17,"times_range":[63,63]}`|
|102017|`{"belong_version":102,"weight":19,"times_range":[64,64]}`|
|102018|`{"belong_version":102,"weight":21,"times_range":[65,65]}`|
|102019|`{"belong_version":102,"weight":23,"times_range":[66,66]}`|
|102020|`{"belong_version":102,"weight":25,"times_range":[67,67]}`|
|102021|`{"belong_version":102,"weight":27,"times_range":[68,68]}`|
|102022|`{"belong_version":102,"weight":29,"times_range":[69,69]}`|
|102023|`{"belong_version":102,"weight":31,"times_range":[70,70]}`|
|102024|`{"belong_version":102,"weight":36,"times_range":[71,71]}`|
|102025|`{"belong_version":102,"weight":41,"times_range":[72,72]}`|
|102026|`{"belong_version":102,"weight":51,"times_range":[73,73]}`|
|102027|`{"belong_version":102,"weight":71,"times_range":[74,74]}`|
|102028|`{"belong_version":102,"weight":101,"times_range":[75,75]}`|
|102029|`{"belong_version":102,"weight":151,"times_range":[76,76]}`|
|102030|`{"belong_version":102,"weight":201,"times_range":[77,77]}`|
|102031|`{"belong_version":102,"weight":251,"times_range":[78,78]}`|
|102032|`{"belong_version":102,"weight":301,"times_range":[79,79]}`|
|102033|`{"belong_version":102,"weight":351,"times_range":[80,80]}`|
|102034|`{"belong_version":102,"weight":401,"times_range":[81,81]}`|
|102035|`{"belong_version":102,"weight":451,"times_range":[82,82]}`|
|102036|`{"belong_version":102,"weight":501,"times_range":[83,83]}`|
|102037|`{"belong_version":102,"weight":601,"times_range":[84,84]}`|
|102038|`{"belong_version":102,"weight":701,"times_range":[85,85]}`|
|102039|`{"belong_version":102,"weight":801,"times_range":[86,86]}`|
|102040|`{"belong_version":102,"weight":1001,"times_range":[87,87]}`|
|102041|`{"belong_version":102,"weight":1201,"times_range":[88,88]}`|
|102042|`{"belong_version":102,"weight":1401,"times_range":[89,89]}`|
|102043|`{"belong_version":102,"weight":1601,"times_range":[90,90]}`|
|102044|`{"belong_version":102,"weight":1801,"times_range":[91,91]}`|
|102045|`{"belong_version":102,"weight":2001,"times_range":[92,92]}`|
|102046|`{"belong_version":102,"weight":2201,"times_range":[93,93]}`|
|102047|`{"belong_version":102,"weight":2401,"times_range":[94,94]}`|
|102048|`{"belong_version":102,"weight":2601,"times_range":[95,95]}`|
|102049|`{"belong_version":102,"weight":3001,"times_range":[96,96]}`|
|102050|`{"belong_version":102,"weight":3501,"times_range":[97,97]}`|
|102051|`{"belong_version":102,"weight":4001,"times_range":[98,98]}`|
|102052|`{"belong_version":102,"weight":5001,"times_range":[99,99]}`|
|102053|`{"belong_version":102,"weight":5002,"times_range":[100,100]}`|
|103001|`{"belong_version":103,"weight":1,"times_range":[1,30]}`|
|103002|`{"belong_version":103,"weight":2,"times_range":[31,40]}`|
|103003|`{"belong_version":103,"weight":3,"times_range":[41,50]}`|
|103004|`{"belong_version":103,"weight":4,"times_range":[51,51]}`|
|103005|`{"belong_version":103,"weight":5,"times_range":[52,52]}`|
|103006|`{"belong_version":103,"weight":6,"times_range":[53,53]}`|
|103007|`{"belong_version":103,"weight":7,"times_range":[54,54]}`|
|103008|`{"belong_version":103,"weight":8,"times_range":[55,55]}`|
|103009|`{"belong_version":103,"weight":9,"times_range":[56,56]}`|
|103010|`{"belong_version":103,"weight":10,"times_range":[57,57]}`|
|103011|`{"belong_version":103,"weight":11,"times_range":[58,58]}`|
|103012|`{"belong_version":103,"weight":12,"times_range":[59,59]}`|
|103013|`{"belong_version":103,"weight":13,"times_range":[60,60]}`|
|103014|`{"belong_version":103,"weight":14,"times_range":[61,61]}`|
|103015|`{"belong_version":103,"weight":15,"times_range":[62,62]}`|
|103016|`{"belong_version":103,"weight":17,"times_range":[63,63]}`|
|103017|`{"belong_version":103,"weight":19,"times_range":[64,64]}`|
|103018|`{"belong_version":103,"weight":21,"times_range":[65,65]}`|
|103019|`{"belong_version":103,"weight":23,"times_range":[66,66]}`|
|103020|`{"belong_version":103,"weight":25,"times_range":[67,67]}`|
|103021|`{"belong_version":103,"weight":27,"times_range":[68,68]}`|
|103022|`{"belong_version":103,"weight":29,"times_range":[69,69]}`|
|103023|`{"belong_version":103,"weight":31,"times_range":[70,70]}`|
|103024|`{"belong_version":103,"weight":36,"times_range":[71,71]}`|
|103025|`{"belong_version":103,"weight":41,"times_range":[72,72]}`|
|103026|`{"belong_version":103,"weight":51,"times_range":[73,73]}`|
|103027|`{"belong_version":103,"weight":71,"times_range":[74,74]}`|
|103028|`{"belong_version":103,"weight":101,"times_range":[75,75]}`|
|103029|`{"belong_version":103,"weight":151,"times_range":[76,76]}`|
|103030|`{"belong_version":103,"weight":201,"times_range":[77,77]}`|
|103031|`{"belong_version":103,"weight":251,"times_range":[78,78]}`|
|103032|`{"belong_version":103,"weight":301,"times_range":[79,79]}`|
|103033|`{"belong_version":103,"weight":351,"times_range":[80,80]}`|
|103034|`{"belong_version":103,"weight":401,"times_range":[81,81]}`|
|103035|`{"belong_version":103,"weight":451,"times_range":[82,82]}`|
|103036|`{"belong_version":103,"weight":501,"times_range":[83,83]}`|
|103037|`{"belong_version":103,"weight":601,"times_range":[84,84]}`|
|103038|`{"belong_version":103,"weight":701,"times_range":[85,85]}`|
|103039|`{"belong_version":103,"weight":801,"times_range":[86,86]}`|
|103040|`{"belong_version":103,"weight":1001,"times_range":[87,87]}`|
|103041|`{"belong_version":103,"weight":1201,"times_range":[88,88]}`|
|103042|`{"belong_version":103,"weight":1401,"times_range":[89,89]}`|
|103043|`{"belong_version":103,"weight":1601,"times_range":[90,90]}`|
|103044|`{"belong_version":103,"weight":1801,"times_range":[91,91]}`|
|103045|`{"belong_version":103,"weight":2001,"times_range":[92,92]}`|
|103046|`{"belong_version":103,"weight":2201,"times_range":[93,93]}`|
|103047|`{"belong_version":103,"weight":2401,"times_range":[94,94]}`|
|103048|`{"belong_version":103,"weight":2601,"times_range":[95,95]}`|
|103049|`{"belong_version":103,"weight":3001,"times_range":[96,96]}`|
|103050|`{"belong_version":103,"weight":3501,"times_range":[97,97]}`|
|103051|`{"belong_version":103,"weight":4001,"times_range":[98,98]}`|
|103052|`{"belong_version":103,"weight":5001,"times_range":[99,99]}`|
|103053|`{"belong_version":103,"weight":5002,"times_range":[100,100]}`|

## StarTask

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|award_num|number|12|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|belong_version|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pay_award_item3|number|12|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|pay_award_type1|number|12|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|tid|number|12|本表行键；与其他表同值不自动代表同一对象。|
|pay_award_num2|number|12|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|target|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|gift|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pay_award_item2|number|12|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|pay_award_type2|number|12|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award_item|number|12|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|pay_award_num3|number|12|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|pay_award_type3|number|12|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|pay_award_num1|number|12|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|pay_award_item1|number|12|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award_type|number|12|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10101|`{"award_num":10,"belong_version":101,"pay_award_item3":0,"pay_award_type1":101,"pay_award_num2":0,"target":5,"pay_award_item2":0,"pay_award_type2":0,"award_item":835802,"pay_award_num3":0,"pay_award_type3":0,"pay_award_num1":1,"pay_award_item1":22002,"award_type":101}`|
|10102|`{"award_num":5,"belong_version":101,"pay_award_item3":0,"pay_award_type1":101,"pay_award_num2":3,"target":6,"pay_award_item2":830702,"pay_award_type2":101,"award_item":830802,"pay_award_num3":0,"pay_award_type3":0,"pay_award_num1":1,"pay_award_item1":6031200,"award_type":101}`|
|10103|`{"award_num":1,"belong_version":101,"pay_award_item3":0,"pay_award_type1":101,"pay_award_num2":10,"target":8,"pay_award_item2":830802,"pay_award_type2":101,"award_item":0,"pay_award_num3":0,"pay_award_type3":0,"pay_award_num1":2,"pay_award_item1":6031200,"award_type":104}`|
|10104|`{"award_num":2,"belong_version":101,"pay_award_item3":0,"pay_award_type1":101,"pay_award_num2":10,"target":10,"pay_award_item2":830802,"pay_award_type2":101,"award_item":6031200,"pay_award_num3":0,"pay_award_type3":0,"pay_award_num1":2,"pay_award_item1":6031200,"award_type":101}`|
|10201|`{"award_num":10,"belong_version":102,"pay_award_item3":501002,"pay_award_type1":101,"pay_award_num2":2,"target":5,"pay_award_item2":472002,"pay_award_type2":101,"award_item":835902,"pay_award_num3":2400,"pay_award_type3":101,"pay_award_num1":2,"pay_award_item1":852002,"award_type":101}`|
|10202|`{"award_num":1,"belong_version":102,"pay_award_item3":501002,"pay_award_type1":101,"pay_award_num2":2,"target":6,"pay_award_item2":472002,"pay_award_type2":101,"award_item":852002,"pay_award_num3":2400,"pay_award_type3":101,"pay_award_num1":2,"pay_award_item1":852002,"award_type":101}`|
|10203|`{"award_num":1,"belong_version":102,"pay_award_item3":501002,"pay_award_type1":104,"pay_award_num2":2,"target":8,"pay_award_item2":472002,"pay_award_type2":101,"award_item":0,"pay_award_num3":4800,"pay_award_type3":101,"pay_award_num1":1,"pay_award_item1":0,"award_type":104}`|
|10204|`{"award_num":1,"belong_version":102,"pay_award_item3":501002,"pay_award_type1":104,"pay_award_num2":2,"target":10,"pay_award_item2":472002,"pay_award_type2":101,"award_item":0,"pay_award_num3":4800,"pay_award_type3":101,"pay_award_num1":1,"pay_award_item1":0,"award_type":105}`|
|10301|`{"award_num":10,"belong_version":103,"pay_award_item3":1030122,"pay_award_type1":106,"pay_award_num2":1,"target":5,"pay_award_item2":0,"pay_award_type2":105,"award_item":836102,"pay_award_num3":1,"pay_award_type3":101,"pay_award_num1":1,"pay_award_item1":0,"award_type":101}`|
|10302|`{"award_num":1,"belong_version":103,"pay_award_item3":495002,"pay_award_type1":101,"pay_award_num2":5,"target":6,"pay_award_item2":496002,"pay_award_type2":101,"award_item":850002,"pay_award_num3":600,"pay_award_type3":101,"pay_award_num1":4,"pay_award_item1":850002,"award_type":101}`|
|10303|`{"award_num":1,"belong_version":103,"pay_award_item3":495002,"pay_award_type1":104,"pay_award_num2":2,"target":8,"pay_award_item2":496002,"pay_award_type2":101,"award_item":0,"pay_award_num3":1200,"pay_award_type3":101,"pay_award_num1":1,"pay_award_item1":0,"award_type":104}`|
|10304|`{"award_num":1,"belong_version":103,"pay_award_item3":495002,"pay_award_type1":104,"pay_award_num2":2,"target":10,"pay_award_item2":496002,"pay_award_type2":101,"award_item":0,"pay_award_num3":1200,"pay_award_type3":101,"pay_award_num1":1,"pay_award_item1":0,"award_type":104}`|

## PoolAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|weight|number|48|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|
|belong_version|number|48|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_num|number|48|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|probability_num|number|48|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|
|tid|number|48|本表行键；与其他表同值不自动代表同一对象。|
|award_item|number|48|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award_type|number|48|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|201|`{"weight":2000,"belong_version":2,"award_num":10,"probability_num":100,"award_item":836902,"award_type":101}`|
|202|`{"weight":1500,"belong_version":2,"award_num":20,"probability_num":500,"award_item":836902,"award_type":101}`|
|203|`{"weight":1000,"belong_version":2,"award_num":30,"probability_num":500,"award_item":836902,"award_type":101}`|
|204|`{"weight":600,"belong_version":2,"award_num":50,"probability_num":1500,"award_item":836902,"award_type":101}`|
|205|`{"weight":200,"belong_version":2,"award_num":80,"probability_num":1500,"award_item":836902,"award_type":101}`|
|206|`{"weight":100,"belong_version":2,"award_num":100,"probability_num":1500,"award_item":836902,"award_type":101}`|
|207|`{"weight":10,"belong_version":2,"award_num":5,"probability_num":1500,"award_item":0,"award_type":103}`|
|208|`{"weight":1,"belong_version":2,"award_num":1,"probability_num":1500,"award_item":0,"award_type":102}`|
|10101|`{"weight":1,"belong_version":101,"award_num":1,"probability_num":123,"award_item":0,"award_type":102}`|
|10102|`{"weight":500,"belong_version":101,"award_num":1,"probability_num":1199,"award_item":4371200,"award_type":101}`|
|10103|`{"weight":500,"belong_version":101,"award_num":500,"probability_num":1209,"award_item":836802,"award_type":101}`|
|10104|`{"weight":500,"belong_version":101,"award_num":200,"probability_num":1203,"award_item":836802,"award_type":101}`|
|10105|`{"weight":325,"belong_version":101,"award_num":150,"probability_num":782,"award_item":101500,"award_type":101}`|
|10106|`{"weight":325,"belong_version":101,"award_num":100,"probability_num":782,"award_item":101500,"award_type":101}`|
|10107|`{"weight":975,"belong_version":101,"award_num":10000,"probability_num":2347,"award_item":201500,"award_type":101}`|
|10108|`{"weight":975,"belong_version":101,"award_num":10000,"probability_num":2355,"award_item":101800,"award_type":101}`|
|10201|`{"weight":1,"belong_version":102,"award_num":1,"probability_num":123,"award_item":0,"award_type":102}`|
|10202|`{"weight":500,"belong_version":102,"award_num":1,"probability_num":1199,"award_item":4471200,"award_type":101}`|
|10203|`{"weight":500,"belong_version":102,"award_num":500,"probability_num":1209,"award_item":836802,"award_type":101}`|
|10204|`{"weight":500,"belong_version":102,"award_num":200,"probability_num":1203,"award_item":836802,"award_type":101}`|
|10205|`{"weight":325,"belong_version":102,"award_num":150,"probability_num":782,"award_item":101500,"award_type":101}`|
|10206|`{"weight":325,"belong_version":102,"award_num":100,"probability_num":782,"award_item":101500,"award_type":101}`|
|10207|`{"weight":975,"belong_version":102,"award_num":10000,"probability_num":2347,"award_item":201500,"award_type":101}`|
|10208|`{"weight":975,"belong_version":102,"award_num":50,"probability_num":2355,"award_item":501002,"award_type":101}`|
|10301|`{"weight":1,"belong_version":103,"award_num":1,"probability_num":123,"award_item":0,"award_type":102}`|
|10302|`{"weight":500,"belong_version":103,"award_num":1,"probability_num":1199,"award_item":4481200,"award_type":101}`|
|10303|`{"weight":500,"belong_version":103,"award_num":500,"probability_num":1209,"award_item":836802,"award_type":101}`|
|10304|`{"weight":500,"belong_version":103,"award_num":200,"probability_num":1203,"award_item":836802,"award_type":101}`|
|10305|`{"weight":325,"belong_version":103,"award_num":150,"probability_num":782,"award_item":101500,"award_type":101}`|
|10306|`{"weight":325,"belong_version":103,"award_num":100,"probability_num":782,"award_item":101500,"award_type":101}`|
|10307|`{"weight":975,"belong_version":103,"award_num":10000,"probability_num":2347,"award_item":201500,"award_type":101}`|
|10308|`{"weight":975,"belong_version":103,"award_num":10,"probability_num":2355,"award_item":493002,"award_type":101}`|
|10401|`{"weight":1,"belong_version":104,"award_num":1,"probability_num":123,"award_item":0,"award_type":102}`|
|10402|`{"weight":500,"belong_version":104,"award_num":1,"probability_num":1199,"award_item":5771200,"award_type":101}`|
|10403|`{"weight":500,"belong_version":104,"award_num":500,"probability_num":1209,"award_item":836802,"award_type":101}`|
|10404|`{"weight":500,"belong_version":104,"award_num":200,"probability_num":1203,"award_item":836802,"award_type":101}`|
|10405|`{"weight":325,"belong_version":104,"award_num":150,"probability_num":782,"award_item":101500,"award_type":101}`|
|10406|`{"weight":325,"belong_version":104,"award_num":100,"probability_num":782,"award_item":101500,"award_type":101}`|
|10407|`{"weight":975,"belong_version":104,"award_num":10000,"probability_num":2347,"award_item":201500,"award_type":101}`|
|10408|`{"weight":975,"belong_version":104,"award_num":1,"probability_num":2355,"award_item":140002,"award_type":101}`|
|10501|`{"weight":1,"belong_version":105,"award_num":1,"probability_num":123,"award_item":0,"award_type":102}`|
|10502|`{"weight":500,"belong_version":105,"award_num":1,"probability_num":1199,"award_item":4371200,"award_type":101}`|
|10503|`{"weight":500,"belong_version":105,"award_num":500,"probability_num":1209,"award_item":836902,"award_type":101}`|
|10504|`{"weight":500,"belong_version":105,"award_num":200,"probability_num":1203,"award_item":836902,"award_type":101}`|
|10505|`{"weight":325,"belong_version":105,"award_num":150,"probability_num":782,"award_item":101500,"award_type":101}`|
|10506|`{"weight":325,"belong_version":105,"award_num":100,"probability_num":782,"award_item":101500,"award_type":101}`|
|10507|`{"weight":975,"belong_version":105,"award_num":10000,"probability_num":2347,"award_item":201500,"award_type":101}`|
|10508|`{"weight":975,"belong_version":105,"award_num":10000,"probability_num":2355,"award_item":101800,"award_type":101}`|

## PoolShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|txt_title_desc|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_shop_btn|string|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|txt_title_desc_ent|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|txt_title|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_progress_bg|string|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|txt_title_ent|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_ent_list_bg|string|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_entrance_extra_bg|string|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|txt_star_btn|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|property_title_desc|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_multi_draw|string|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ani_devolve_idle|string|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_star_btn|string|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_gift_btn|string|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ani_devolve_draw|string|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_bg|string|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_one_draw|string|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|8|本表行键；与其他表同值不自动代表同一对象。|
|property_btn|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|recommend_icon|string|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|property_title|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_title_bg|string|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|txt_entrance_extra|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_devolve_front|array|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"txt_star_btn":692212,"ani_devolve_draw":""}`|
|2|`{"txt_star_btn":692212,"ani_devolve_draw":""}`|
|3|`{"txt_star_btn":692212,"ani_devolve_draw":""}`|
|4|`{"txt_star_btn":692212,"ani_devolve_draw":""}`|
|5|`{"txt_star_btn":0,"ani_devolve_draw":"chouka_jin"}`|
|6|`{"txt_star_btn":0,"ani_devolve_draw":"chouka_zi"}`|
|7|`{"txt_star_btn":0,"ani_devolve_draw":"chouka_zi"}`|
|8|`{"txt_star_btn":0,"ani_devolve_draw":"chouka_zi"}`|

## PoolType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|txt_name|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{}`|
|102|`{}`|

## Pool

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|guarantee_total_draw_times|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|resend_mail_tid|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pool_type|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|guarantee_lib|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|draw_item|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|marquee_num|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pool_award_lib|number|6|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|gift|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|process_award_lib|number|6|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|star_task_lib|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|theme_type|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|star_show|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pool_show|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|res_exchange|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|star_task_type|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|shop|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"guarantee_total_draw_times":100,"pool_type":101,"guarantee_lib":101,"draw_item":835802,"marquee_num":10,"pool_award_lib":101,"process_award_lib":101,"star_task_lib":101,"theme_type":101,"star_show":1,"pool_show":1,"res_exchange":52,"star_task_type":1199}`|
|102|`{"guarantee_total_draw_times":100,"pool_type":101,"guarantee_lib":102,"draw_item":835902,"marquee_num":10,"pool_award_lib":102,"process_award_lib":102,"star_task_lib":102,"theme_type":102,"star_show":6,"pool_show":2,"res_exchange":52,"star_task_type":13005}`|
|103|`{"guarantee_total_draw_times":100,"pool_type":101,"guarantee_lib":103,"draw_item":836102,"marquee_num":10,"pool_award_lib":103,"process_award_lib":103,"star_task_lib":103,"theme_type":104,"star_show":5,"pool_show":3,"res_exchange":52,"star_task_type":14701}`|
|104|`{"guarantee_total_draw_times":100,"pool_type":101,"guarantee_lib":101,"draw_item":835802,"marquee_num":10,"pool_award_lib":101,"process_award_lib":104,"star_task_lib":101,"theme_type":101,"star_show":1,"pool_show":1,"res_exchange":52,"star_task_type":1199}`|
|105|`{"guarantee_total_draw_times":100,"pool_type":101,"guarantee_lib":101,"draw_item":836202,"marquee_num":10,"pool_award_lib":104,"process_award_lib":105,"star_task_lib":0,"theme_type":103,"star_show":4,"pool_show":4,"res_exchange":52,"star_task_type":0}`|
|106|`{"guarantee_total_draw_times":100,"pool_type":102,"guarantee_lib":101,"draw_item":836302,"marquee_num":10,"pool_award_lib":105,"process_award_lib":106,"star_task_lib":0,"theme_type":101,"star_show":1,"pool_show":5,"res_exchange":53,"star_task_type":0}`|

## QualityShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|img_info_name|string|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_info_position|string|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|property_name|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|60|`{}`|
|70|`{}`|

## AwardType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{}`|
|102|`{}`|
|103|`{}`|
|104|`{}`|
|105|`{}`|
|106|`{}`|

## Version

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|shop|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pool|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|10|本表行键；与其他表同值不自动代表同一对象。|
|target|array|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|gift|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"pool":101,"target":[5040701]}`|
|2|`{"pool":104,"target":[5040101]}`|
|3|`{"pool":104,"target":[5040301]}`|
|4|`{"pool":104,"target":[5040401]}`|
|5|`{"pool":102,"target":[500113]}`|
|6|`{"pool":103,"target":[500120]}`|
|7|`{"pool":105,"target":[1203619]}`|
|8|`{"pool":103,"target":[500520]}`|
|9|`{"pool":106,"target":[5040701]}`|
|10|`{"pool":102,"target":[500513]}`|

## TargetShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|pos_star_icon|undefined|17|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_star_icon|string|17|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|recommend_icon|string|17|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|17|本表行键；与其他表同值不自动代表同一对象。|
|txt_target_tag|number|17|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|target_skin|number|17|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|500113|`{"txt_target_tag":692904,"target_skin":0}`|
|500120|`{"txt_target_tag":682176,"target_skin":200912}`|
|500220|`{"txt_target_tag":683783,"target_skin":0}`|
|500313|`{"txt_target_tag":683783,"target_skin":0}`|
|500320|`{"txt_target_tag":683783,"target_skin":0}`|
|500420|`{"txt_target_tag":683783,"target_skin":0}`|
|500513|`{"txt_target_tag":692934,"target_skin":0}`|
|500520|`{"txt_target_tag":692926,"target_skin":201312}`|
|1040301|`{"txt_target_tag":683783,"target_skin":0}`|
|1203219|`{"txt_target_tag":683783,"target_skin":0}`|
|1203319|`{"txt_target_tag":683783,"target_skin":0}`|
|1203419|`{"txt_target_tag":683783,"target_skin":0}`|
|1203619|`{"txt_target_tag":692910,"target_skin":0}`|
|5040101|`{"txt_target_tag":692901,"target_skin":0}`|
|5040301|`{"txt_target_tag":692902,"target_skin":0}`|
|5040401|`{"txt_target_tag":692903,"target_skin":0}`|
|5040701|`{"txt_target_tag":683783,"target_skin":0}`|

## Marquee

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|num|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|desc|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"num":10}`|
|102|`{"num":2}`|
|103|`{"num":10}`|

## ProcessAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|award_type1|number|143|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|belong_version|number|143|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award2|number|143|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|draw_times|number|143|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|143|本表行键；与其他表同值不自动代表同一对象。|
|num2|number|143|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_type2|number|143|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award1|number|143|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|num1|number|143|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_big_node|number|143|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10101|`{"award_type1":101,"belong_version":101,"award2":0,"draw_times":50,"num2":0,"award_type2":0,"award1":101500,"num1":500,"is_big_node":0}`|
|10102|`{"award_type1":101,"belong_version":101,"award2":0,"draw_times":80,"num2":0,"award_type2":0,"award1":836802,"num1":500,"is_big_node":0}`|
|10103|`{"award_type1":101,"belong_version":101,"award2":0,"draw_times":110,"num2":0,"award_type2":0,"award1":4371200,"num1":20,"is_big_node":0}`|
|10104|`{"award_type1":103,"belong_version":101,"award2":0,"draw_times":145,"num2":0,"award_type2":0,"award1":0,"num1":80,"is_big_node":1}`|
|10105|`{"award_type1":101,"belong_version":101,"award2":0,"draw_times":180,"num2":0,"award_type2":0,"award1":835802,"num1":5,"is_big_node":0}`|
|10106|`{"award_type1":101,"belong_version":101,"award2":0,"draw_times":215,"num2":0,"award_type2":0,"award1":835802,"num1":5,"is_big_node":0}`|
|10107|`{"award_type1":101,"belong_version":101,"award2":0,"draw_times":250,"num2":0,"award_type2":0,"award1":835802,"num1":5,"is_big_node":0}`|
|10108|`{"award_type1":101,"belong_version":101,"award2":0,"draw_times":260,"num2":0,"award_type2":0,"award1":835802,"num1":10,"is_big_node":1}`|
|10109|`{"award_type1":101,"belong_version":101,"award2":0,"draw_times":290,"num2":0,"award_type2":0,"award1":836802,"num1":500,"is_big_node":0}`|
|10110|`{"award_type1":101,"belong_version":101,"award2":0,"draw_times":320,"num2":0,"award_type2":0,"award1":835802,"num1":10,"is_big_node":0}`|
|10111|`{"award_type1":101,"belong_version":101,"award2":0,"draw_times":350,"num2":0,"award_type2":0,"award1":835802,"num1":20,"is_big_node":1}`|
|10112|`{"award_type1":101,"belong_version":101,"award2":0,"draw_times":400,"num2":0,"award_type2":0,"award1":835802,"num1":10,"is_big_node":0}`|
|10113|`{"award_type1":103,"belong_version":101,"award2":0,"draw_times":450,"num2":0,"award_type2":0,"award1":0,"num1":80,"is_big_node":1}`|
|10114|`{"award_type1":101,"belong_version":101,"award2":0,"draw_times":500,"num2":0,"award_type2":0,"award1":836802,"num1":1000,"is_big_node":0}`|
|10115|`{"award_type1":101,"belong_version":101,"award2":0,"draw_times":550,"num2":0,"award_type2":0,"award1":835802,"num1":10,"is_big_node":0}`|
|10116|`{"award_type1":101,"belong_version":101,"award2":0,"draw_times":600,"num2":0,"award_type2":0,"award1":835802,"num1":10,"is_big_node":0}`|
|10117|`{"award_type1":103,"belong_version":101,"award2":0,"draw_times":700,"num2":0,"award_type2":0,"award1":0,"num1":80,"is_big_node":1}`|
|10118|`{"award_type1":101,"belong_version":101,"award2":0,"draw_times":800,"num2":0,"award_type2":0,"award1":836802,"num1":1000,"is_big_node":0}`|
|10119|`{"award_type1":101,"belong_version":101,"award2":0,"draw_times":900,"num2":0,"award_type2":0,"award1":835802,"num1":10,"is_big_node":0}`|
|10120|`{"award_type1":101,"belong_version":101,"award2":0,"draw_times":1000,"num2":0,"award_type2":0,"award1":835802,"num1":10,"is_big_node":0}`|
|10121|`{"award_type1":103,"belong_version":101,"award2":0,"draw_times":1200,"num2":0,"award_type2":0,"award1":0,"num1":80,"is_big_node":1}`|
|10122|`{"award_type1":101,"belong_version":101,"award2":0,"draw_times":1400,"num2":0,"award_type2":0,"award1":836802,"num1":1000,"is_big_node":0}`|
|10123|`{"award_type1":101,"belong_version":101,"award2":0,"draw_times":1600,"num2":0,"award_type2":0,"award1":835802,"num1":10,"is_big_node":0}`|
|10124|`{"award_type1":101,"belong_version":101,"award2":0,"draw_times":1800,"num2":0,"award_type2":0,"award1":835802,"num1":20,"is_big_node":1}`|
|10125|`{"award_type1":101,"belong_version":101,"award2":0,"draw_times":2000,"num2":0,"award_type2":0,"award1":835802,"num1":10,"is_big_node":0}`|
|10126|`{"award_type1":101,"belong_version":101,"award2":0,"draw_times":2200,"num2":0,"award_type2":0,"award1":835802,"num1":10,"is_big_node":0}`|
|10127|`{"award_type1":101,"belong_version":101,"award2":0,"draw_times":2400,"num2":0,"award_type2":0,"award1":835802,"num1":20,"is_big_node":1}`|
|10128|`{"award_type1":101,"belong_version":101,"award2":0,"draw_times":2600,"num2":0,"award_type2":0,"award1":835802,"num1":10,"is_big_node":0}`|
|10129|`{"award_type1":101,"belong_version":101,"award2":0,"draw_times":2800,"num2":0,"award_type2":0,"award1":835802,"num1":10,"is_big_node":0}`|
|10130|`{"award_type1":103,"belong_version":101,"award2":0,"draw_times":3000,"num2":0,"award_type2":0,"award1":0,"num1":80,"is_big_node":1}`|
|10201|`{"award_type1":101,"belong_version":102,"award2":0,"draw_times":55,"num2":0,"award_type2":0,"award1":4471200,"num1":20,"is_big_node":0}`|
|10202|`{"award_type1":101,"belong_version":102,"award2":0,"draw_times":75,"num2":0,"award_type2":0,"award1":835902,"num1":10,"is_big_node":0}`|
|10203|`{"award_type1":103,"belong_version":102,"award2":0,"draw_times":125,"num2":0,"award_type2":0,"award1":0,"num1":100,"is_big_node":1}`|
|10204|`{"award_type1":101,"belong_version":102,"award2":0,"draw_times":145,"num2":0,"award_type2":0,"award1":835902,"num1":5,"is_big_node":0}`|
|10205|`{"award_type1":101,"belong_version":102,"award2":0,"draw_times":175,"num2":0,"award_type2":0,"award1":835902,"num1":5,"is_big_node":0}`|
|10206|`{"award_type1":101,"belong_version":102,"award2":0,"draw_times":210,"num2":0,"award_type2":0,"award1":835902,"num1":10,"is_big_node":1}`|
|10207|`{"award_type1":101,"belong_version":102,"award2":0,"draw_times":245,"num2":0,"award_type2":0,"award1":101500,"num1":1000,"is_big_node":0}`|
|10208|`{"award_type1":101,"belong_version":102,"award2":0,"draw_times":280,"num2":0,"award_type2":0,"award1":835902,"num1":5,"is_big_node":0}`|
|10209|`{"award_type1":101,"belong_version":102,"award2":0,"draw_times":315,"num2":0,"award_type2":0,"award1":836802,"num1":1000,"is_big_node":0}`|
|10210|`{"award_type1":101,"belong_version":102,"award2":0,"draw_times":360,"num2":0,"award_type2":0,"award1":835902,"num1":10,"is_big_node":1}`|
|10211|`{"award_type1":101,"belong_version":102,"award2":0,"draw_times":405,"num2":0,"award_type2":0,"award1":101500,"num1":1000,"is_big_node":0}`|
|10212|`{"award_type1":101,"belong_version":102,"award2":0,"draw_times":450,"num2":0,"award_type2":0,"award1":835902,"num1":5,"is_big_node":0}`|
|10213|`{"award_type1":101,"belong_version":102,"award2":0,"draw_times":500,"num2":0,"award_type2":0,"award1":836802,"num1":1000,"is_big_node":0}`|
|10214|`{"award_type1":101,"belong_version":102,"award2":0,"draw_times":600,"num2":0,"award_type2":0,"award1":835902,"num1":20,"is_big_node":1}`|
|10215|`{"award_type1":101,"belong_version":102,"award2":0,"draw_times":700,"num2":0,"award_type2":0,"award1":835902,"num1":5,"is_big_node":0}`|
|10216|`{"award_type1":101,"belong_version":102,"award2":0,"draw_times":800,"num2":0,"award_type2":0,"award1":101500,"num1":1000,"is_big_node":0}`|
|10217|`{"award_type1":101,"belong_version":102,"award2":0,"draw_times":900,"num2":0,"award_type2":0,"award1":835902,"num1":10,"is_big_node":0}`|
|10218|`{"award_type1":103,"belong_version":102,"award2":0,"draw_times":1000,"num2":0,"award_type2":0,"award1":0,"num1":100,"is_big_node":1}`|
|10301|`{"award_type1":101,"belong_version":103,"award2":0,"draw_times":55,"num2":0,"award_type2":0,"award1":4481200,"num1":20,"is_big_node":0}`|
|10302|`{"award_type1":101,"belong_version":103,"award2":0,"draw_times":75,"num2":0,"award_type2":0,"award1":836102,"num1":10,"is_big_node":0}`|
|10303|`{"award_type1":103,"belong_version":103,"award2":0,"draw_times":125,"num2":0,"award_type2":0,"award1":0,"num1":100,"is_big_node":1}`|
|10304|`{"award_type1":101,"belong_version":103,"award2":0,"draw_times":145,"num2":0,"award_type2":0,"award1":836102,"num1":5,"is_big_node":0}`|
|10305|`{"award_type1":101,"belong_version":103,"award2":0,"draw_times":175,"num2":0,"award_type2":0,"award1":836102,"num1":5,"is_big_node":0}`|
|10306|`{"award_type1":101,"belong_version":103,"award2":0,"draw_times":210,"num2":0,"award_type2":0,"award1":836102,"num1":10,"is_big_node":1}`|
|10307|`{"award_type1":101,"belong_version":103,"award2":0,"draw_times":245,"num2":0,"award_type2":0,"award1":101500,"num1":1000,"is_big_node":0}`|
|10308|`{"award_type1":101,"belong_version":103,"award2":0,"draw_times":280,"num2":0,"award_type2":0,"award1":836102,"num1":5,"is_big_node":0}`|
|10309|`{"award_type1":101,"belong_version":103,"award2":0,"draw_times":315,"num2":0,"award_type2":0,"award1":836802,"num1":1000,"is_big_node":0}`|
|10310|`{"award_type1":101,"belong_version":103,"award2":0,"draw_times":360,"num2":0,"award_type2":0,"award1":836102,"num1":10,"is_big_node":1}`|
|10311|`{"award_type1":101,"belong_version":103,"award2":0,"draw_times":405,"num2":0,"award_type2":0,"award1":101500,"num1":1000,"is_big_node":0}`|
|10312|`{"award_type1":101,"belong_version":103,"award2":0,"draw_times":450,"num2":0,"award_type2":0,"award1":836102,"num1":5,"is_big_node":0}`|
|10313|`{"award_type1":101,"belong_version":103,"award2":0,"draw_times":500,"num2":0,"award_type2":0,"award1":836802,"num1":1000,"is_big_node":0}`|
|10314|`{"award_type1":101,"belong_version":103,"award2":0,"draw_times":600,"num2":0,"award_type2":0,"award1":836102,"num1":20,"is_big_node":1}`|
|10315|`{"award_type1":101,"belong_version":103,"award2":0,"draw_times":700,"num2":0,"award_type2":0,"award1":836102,"num1":5,"is_big_node":0}`|
|10316|`{"award_type1":101,"belong_version":103,"award2":0,"draw_times":800,"num2":0,"award_type2":0,"award1":101500,"num1":1000,"is_big_node":0}`|
|10317|`{"award_type1":101,"belong_version":103,"award2":0,"draw_times":900,"num2":0,"award_type2":0,"award1":836102,"num1":10,"is_big_node":0}`|
|10318|`{"award_type1":103,"belong_version":103,"award2":0,"draw_times":1000,"num2":0,"award_type2":0,"award1":0,"num1":100,"is_big_node":1}`|
|10401|`{"award_type1":101,"belong_version":104,"award2":0,"draw_times":50,"num2":0,"award_type2":0,"award1":101500,"num1":500,"is_big_node":0}`|
|10402|`{"award_type1":101,"belong_version":104,"award2":0,"draw_times":80,"num2":0,"award_type2":0,"award1":836802,"num1":500,"is_big_node":0}`|
|10403|`{"award_type1":101,"belong_version":104,"award2":0,"draw_times":110,"num2":0,"award_type2":0,"award1":4371200,"num1":20,"is_big_node":0}`|
|10404|`{"award_type1":103,"belong_version":104,"award2":0,"draw_times":145,"num2":0,"award_type2":0,"award1":0,"num1":80,"is_big_node":1}`|
|10405|`{"award_type1":101,"belong_version":104,"award2":0,"draw_times":180,"num2":0,"award_type2":0,"award1":835802,"num1":5,"is_big_node":0}`|
|10406|`{"award_type1":101,"belong_version":104,"award2":0,"draw_times":215,"num2":0,"award_type2":0,"award1":835802,"num1":5,"is_big_node":0}`|
|10407|`{"award_type1":101,"belong_version":104,"award2":0,"draw_times":250,"num2":0,"award_type2":0,"award1":835802,"num1":5,"is_big_node":0}`|
|10408|`{"award_type1":101,"belong_version":104,"award2":0,"draw_times":260,"num2":0,"award_type2":0,"award1":835802,"num1":10,"is_big_node":1}`|
|10409|`{"award_type1":101,"belong_version":104,"award2":0,"draw_times":290,"num2":0,"award_type2":0,"award1":836802,"num1":500,"is_big_node":0}`|
|10410|`{"award_type1":101,"belong_version":104,"award2":0,"draw_times":320,"num2":0,"award_type2":0,"award1":835802,"num1":10,"is_big_node":0}`|
|10411|`{"award_type1":101,"belong_version":104,"award2":0,"draw_times":350,"num2":0,"award_type2":0,"award1":835802,"num1":20,"is_big_node":1}`|
|10412|`{"award_type1":101,"belong_version":104,"award2":0,"draw_times":400,"num2":0,"award_type2":0,"award1":835802,"num1":10,"is_big_node":0}`|
|10413|`{"award_type1":101,"belong_version":104,"award2":0,"draw_times":450,"num2":0,"award_type2":0,"award1":835802,"num1":20,"is_big_node":1}`|
|10414|`{"award_type1":101,"belong_version":104,"award2":0,"draw_times":500,"num2":0,"award_type2":0,"award1":836802,"num1":1000,"is_big_node":0}`|
|10415|`{"award_type1":101,"belong_version":104,"award2":0,"draw_times":550,"num2":0,"award_type2":0,"award1":835802,"num1":10,"is_big_node":0}`|
|10416|`{"award_type1":103,"belong_version":104,"award2":0,"draw_times":600,"num2":0,"award_type2":0,"award1":0,"num1":40,"is_big_node":0}`|
|10417|`{"award_type1":103,"belong_version":104,"award2":0,"draw_times":700,"num2":0,"award_type2":0,"award1":0,"num1":80,"is_big_node":1}`|
|10418|`{"award_type1":101,"belong_version":104,"award2":0,"draw_times":800,"num2":0,"award_type2":0,"award1":836802,"num1":1000,"is_big_node":0}`|
|10419|`{"award_type1":101,"belong_version":104,"award2":0,"draw_times":900,"num2":0,"award_type2":0,"award1":835802,"num1":10,"is_big_node":0}`|
|10420|`{"award_type1":103,"belong_version":104,"award2":0,"draw_times":1000,"num2":0,"award_type2":0,"award1":0,"num1":40,"is_big_node":0}`|
|10421|`{"award_type1":103,"belong_version":104,"award2":0,"draw_times":1200,"num2":0,"award_type2":0,"award1":0,"num1":80,"is_big_node":1}`|
|10422|`{"award_type1":101,"belong_version":104,"award2":0,"draw_times":1400,"num2":0,"award_type2":0,"award1":836802,"num1":1000,"is_big_node":0}`|
|10423|`{"award_type1":101,"belong_version":104,"award2":0,"draw_times":1600,"num2":0,"award_type2":0,"award1":835802,"num1":10,"is_big_node":0}`|
|10424|`{"award_type1":101,"belong_version":104,"award2":0,"draw_times":1800,"num2":0,"award_type2":0,"award1":835802,"num1":20,"is_big_node":1}`|
|10425|`{"award_type1":101,"belong_version":104,"award2":0,"draw_times":2000,"num2":0,"award_type2":0,"award1":835802,"num1":10,"is_big_node":0}`|
|10426|`{"award_type1":101,"belong_version":104,"award2":0,"draw_times":2200,"num2":0,"award_type2":0,"award1":835802,"num1":10,"is_big_node":0}`|
|10427|`{"award_type1":101,"belong_version":104,"award2":0,"draw_times":2400,"num2":0,"award_type2":0,"award1":835802,"num1":20,"is_big_node":1}`|
|10428|`{"award_type1":101,"belong_version":104,"award2":0,"draw_times":2600,"num2":0,"award_type2":0,"award1":835802,"num1":10,"is_big_node":0}`|
|10429|`{"award_type1":101,"belong_version":104,"award2":0,"draw_times":2800,"num2":0,"award_type2":0,"award1":835802,"num1":10,"is_big_node":0}`|
|10430|`{"award_type1":103,"belong_version":104,"award2":0,"draw_times":3000,"num2":0,"award_type2":0,"award1":0,"num1":80,"is_big_node":1}`|
|10501|`{"award_type1":101,"belong_version":105,"award2":0,"draw_times":55,"num2":0,"award_type2":0,"award1":101500,"num1":500,"is_big_node":0}`|
|10502|`{"award_type1":101,"belong_version":105,"award2":0,"draw_times":75,"num2":0,"award_type2":0,"award1":836202,"num1":10,"is_big_node":0}`|
|10503|`{"award_type1":101,"belong_version":105,"award2":0,"draw_times":100,"num2":0,"award_type2":0,"award1":5771200,"num1":20,"is_big_node":0}`|
|10504|`{"award_type1":103,"belong_version":105,"award2":0,"draw_times":130,"num2":0,"award_type2":0,"award1":0,"num1":80,"is_big_node":1}`|
|10505|`{"award_type1":101,"belong_version":105,"award2":0,"draw_times":165,"num2":0,"award_type2":0,"award1":836802,"num1":1000,"is_big_node":0}`|
|10506|`{"award_type1":101,"belong_version":105,"award2":0,"draw_times":205,"num2":0,"award_type2":0,"award1":836202,"num1":10,"is_big_node":0}`|
|10507|`{"award_type1":101,"belong_version":105,"award2":0,"draw_times":245,"num2":0,"award_type2":0,"award1":101500,"num1":1000,"is_big_node":0}`|
|10508|`{"award_type1":101,"belong_version":105,"award2":0,"draw_times":285,"num2":0,"award_type2":0,"award1":836202,"num1":20,"is_big_node":1}`|
|10509|`{"award_type1":101,"belong_version":105,"award2":0,"draw_times":325,"num2":0,"award_type2":0,"award1":836202,"num1":10,"is_big_node":0}`|
|10510|`{"award_type1":101,"belong_version":105,"award2":0,"draw_times":375,"num2":0,"award_type2":0,"award1":836202,"num1":20,"is_big_node":0}`|
|10511|`{"award_type1":103,"belong_version":105,"award2":0,"draw_times":425,"num2":0,"award_type2":0,"award1":0,"num1":80,"is_big_node":1}`|
|10512|`{"award_type1":101,"belong_version":105,"award2":0,"draw_times":500,"num2":0,"award_type2":0,"award1":836802,"num1":1000,"is_big_node":0}`|
|10513|`{"award_type1":101,"belong_version":105,"award2":0,"draw_times":600,"num2":0,"award_type2":0,"award1":101500,"num1":1000,"is_big_node":0}`|
|10514|`{"award_type1":101,"belong_version":105,"award2":0,"draw_times":700,"num2":0,"award_type2":0,"award1":836202,"num1":20,"is_big_node":1}`|
|10515|`{"award_type1":101,"belong_version":105,"award2":0,"draw_times":800,"num2":0,"award_type2":0,"award1":836202,"num1":5,"is_big_node":0}`|
|10516|`{"award_type1":101,"belong_version":105,"award2":0,"draw_times":900,"num2":0,"award_type2":0,"award1":836802,"num1":1000,"is_big_node":0}`|
|10517|`{"award_type1":103,"belong_version":105,"award2":0,"draw_times":1000,"num2":0,"award_type2":0,"award1":0,"num1":80,"is_big_node":1}`|
|10601|`{"award_type1":101,"belong_version":106,"award2":0,"draw_times":50,"num2":0,"award_type2":0,"award1":101500,"num1":500,"is_big_node":0}`|
|10602|`{"award_type1":101,"belong_version":106,"award2":0,"draw_times":80,"num2":0,"award_type2":0,"award1":836902,"num1":500,"is_big_node":0}`|
|10603|`{"award_type1":101,"belong_version":106,"award2":0,"draw_times":110,"num2":0,"award_type2":0,"award1":4371200,"num1":20,"is_big_node":0}`|
|10604|`{"award_type1":103,"belong_version":106,"award2":0,"draw_times":145,"num2":0,"award_type2":0,"award1":0,"num1":80,"is_big_node":1}`|
|10605|`{"award_type1":101,"belong_version":106,"award2":0,"draw_times":180,"num2":0,"award_type2":0,"award1":836302,"num1":5,"is_big_node":0}`|
|10606|`{"award_type1":101,"belong_version":106,"award2":0,"draw_times":215,"num2":0,"award_type2":0,"award1":836302,"num1":5,"is_big_node":0}`|
|10607|`{"award_type1":101,"belong_version":106,"award2":0,"draw_times":250,"num2":0,"award_type2":0,"award1":836302,"num1":5,"is_big_node":0}`|
|10608|`{"award_type1":101,"belong_version":106,"award2":0,"draw_times":260,"num2":0,"award_type2":0,"award1":836302,"num1":10,"is_big_node":1}`|
|10609|`{"award_type1":101,"belong_version":106,"award2":0,"draw_times":290,"num2":0,"award_type2":0,"award1":836902,"num1":500,"is_big_node":0}`|
|10610|`{"award_type1":101,"belong_version":106,"award2":0,"draw_times":320,"num2":0,"award_type2":0,"award1":836302,"num1":10,"is_big_node":0}`|
|10611|`{"award_type1":101,"belong_version":106,"award2":0,"draw_times":350,"num2":0,"award_type2":0,"award1":836302,"num1":20,"is_big_node":1}`|
|10612|`{"award_type1":101,"belong_version":106,"award2":0,"draw_times":400,"num2":0,"award_type2":0,"award1":836302,"num1":10,"is_big_node":0}`|
|10613|`{"award_type1":103,"belong_version":106,"award2":0,"draw_times":450,"num2":0,"award_type2":0,"award1":0,"num1":80,"is_big_node":1}`|
|10614|`{"award_type1":101,"belong_version":106,"award2":0,"draw_times":500,"num2":0,"award_type2":0,"award1":836902,"num1":1000,"is_big_node":0}`|
|10615|`{"award_type1":101,"belong_version":106,"award2":0,"draw_times":550,"num2":0,"award_type2":0,"award1":836302,"num1":10,"is_big_node":0}`|
|10616|`{"award_type1":101,"belong_version":106,"award2":0,"draw_times":600,"num2":0,"award_type2":0,"award1":836302,"num1":10,"is_big_node":0}`|
|10617|`{"award_type1":103,"belong_version":106,"award2":0,"draw_times":700,"num2":0,"award_type2":0,"award1":0,"num1":80,"is_big_node":1}`|
|10618|`{"award_type1":101,"belong_version":106,"award2":0,"draw_times":800,"num2":0,"award_type2":0,"award1":836902,"num1":1000,"is_big_node":0}`|
|10619|`{"award_type1":101,"belong_version":106,"award2":0,"draw_times":900,"num2":0,"award_type2":0,"award1":836302,"num1":10,"is_big_node":0}`|
|10620|`{"award_type1":101,"belong_version":106,"award2":0,"draw_times":1000,"num2":0,"award_type2":0,"award1":836302,"num1":10,"is_big_node":0}`|
|10621|`{"award_type1":103,"belong_version":106,"award2":0,"draw_times":1200,"num2":0,"award_type2":0,"award1":0,"num1":80,"is_big_node":1}`|
|10622|`{"award_type1":101,"belong_version":106,"award2":0,"draw_times":1400,"num2":0,"award_type2":0,"award1":836902,"num1":1000,"is_big_node":0}`|
|10623|`{"award_type1":101,"belong_version":106,"award2":0,"draw_times":1600,"num2":0,"award_type2":0,"award1":836302,"num1":10,"is_big_node":0}`|
|10624|`{"award_type1":101,"belong_version":106,"award2":0,"draw_times":1800,"num2":0,"award_type2":0,"award1":836302,"num1":20,"is_big_node":1}`|
|10625|`{"award_type1":101,"belong_version":106,"award2":0,"draw_times":2000,"num2":0,"award_type2":0,"award1":836302,"num1":10,"is_big_node":0}`|
|10626|`{"award_type1":101,"belong_version":106,"award2":0,"draw_times":2200,"num2":0,"award_type2":0,"award1":836302,"num1":10,"is_big_node":0}`|
|10627|`{"award_type1":101,"belong_version":106,"award2":0,"draw_times":2400,"num2":0,"award_type2":0,"award1":836302,"num1":20,"is_big_node":1}`|
|10628|`{"award_type1":101,"belong_version":106,"award2":0,"draw_times":2600,"num2":0,"award_type2":0,"award1":836302,"num1":10,"is_big_node":0}`|
|10629|`{"award_type1":101,"belong_version":106,"award2":0,"draw_times":2800,"num2":0,"award_type2":0,"award1":836302,"num1":10,"is_big_node":0}`|
|10630|`{"award_type1":103,"belong_version":106,"award2":0,"draw_times":3000,"num2":0,"award_type2":0,"award1":0,"num1":80,"is_big_node":1}`|

## StarShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|img_gift_bg|string|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_satisfy|string|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_bloom_bg|string|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_task_bg|string|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|pos_slogan|undefined|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_slogan_bg|string|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_head|string|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|property_slogan|array|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_not_satisfy|string|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|property_title|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|txt_slogan|array|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_mask_bg|string|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_bg|string|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|
|6|`{}`|
