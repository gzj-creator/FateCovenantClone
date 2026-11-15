# IntelliTable 规则参数

来源：[personal-server/assets/tables/IntelliTable.data.json.gz](../../../../personal-server/assets/tables/IntelliTable.data.json.gz)，SHA256：`a7c599e55a3e1c85485081b8216ff11377eeb0dc6deb95b1979c13c5db335cc0`。

[完整逐行JSON](IntelliTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Type](#type)|8|decoded-rows|
|[Refresh](#refresh)|41|decoded-rows|
|[Quality](#quality)|4|decoded-rows|
|[Award](#award)|164|decoded-rows|
|[AwardType](#awardtype)|4|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[Intelli](#intelli)|24|decoded-rows|

## Type

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|8|本表行键；与其他表同值不自动代表同一对象。|
|unlock|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|unlock_params|array|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"unlock":389242300001,"unlock_params":[3]}`|
|2|`{"unlock":389242300002,"unlock_params":[3]}`|
|3|`{"unlock":389242300003,"unlock_params":[3]}`|
|4|`{"unlock":389242300004,"unlock_params":[3]}`|
|5|`{"unlock":389242300005,"unlock_params":[3]}`|
|6|`{"unlock":389242300006,"unlock_params":[3]}`|
|7|`{"unlock":389242300007,"unlock_params":[3]}`|
|8|`{"unlock":389242300008,"unlock_params":[3]}`|

## Refresh

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|41|本表行键；与其他表同值不自动代表同一对象。|
|star_limit|number|41|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|quality|number|41|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"star_limit":0,"quality":20}`|
|2|`{"star_limit":1,"quality":20}`|
|3|`{"star_limit":2,"quality":20}`|
|4|`{"star_limit":3,"quality":20}`|
|5|`{"star_limit":4,"quality":20}`|
|6|`{"star_limit":5,"quality":20}`|
|7|`{"star_limit":6,"quality":20}`|
|8|`{"star_limit":7,"quality":20}`|
|9|`{"star_limit":8,"quality":20}`|
|10|`{"star_limit":9,"quality":20}`|
|11|`{"star_limit":10,"quality":20}`|
|12|`{"star_limit":11,"quality":30}`|
|13|`{"star_limit":12,"quality":30}`|
|14|`{"star_limit":13,"quality":30}`|
|15|`{"star_limit":14,"quality":30}`|
|16|`{"star_limit":15,"quality":30}`|
|17|`{"star_limit":16,"quality":30}`|
|18|`{"star_limit":17,"quality":30}`|
|19|`{"star_limit":18,"quality":30}`|
|20|`{"star_limit":19,"quality":30}`|
|21|`{"star_limit":20,"quality":30}`|
|22|`{"star_limit":21,"quality":40}`|
|23|`{"star_limit":22,"quality":40}`|
|24|`{"star_limit":23,"quality":40}`|
|25|`{"star_limit":24,"quality":40}`|
|26|`{"star_limit":25,"quality":40}`|
|27|`{"star_limit":26,"quality":40}`|
|28|`{"star_limit":27,"quality":40}`|
|29|`{"star_limit":28,"quality":40}`|
|30|`{"star_limit":29,"quality":40}`|
|31|`{"star_limit":30,"quality":40}`|
|32|`{"star_limit":31,"quality":50}`|
|33|`{"star_limit":32,"quality":50}`|
|34|`{"star_limit":33,"quality":50}`|
|35|`{"star_limit":34,"quality":50}`|
|36|`{"star_limit":35,"quality":50}`|
|37|`{"star_limit":36,"quality":50}`|
|38|`{"star_limit":37,"quality":50}`|
|39|`{"star_limit":38,"quality":50}`|
|40|`{"star_limit":39,"quality":50}`|
|41|`{"star_limit":40,"quality":50}`|

## Quality

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|finish_time|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|quality_property|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|20|`{"finish_time":7200,"quality_property":8002}`|
|30|`{"finish_time":7200,"quality_property":8006}`|
|40|`{"finish_time":7200,"quality_property":8013}`|
|50|`{"finish_time":7200,"quality_property":8003}`|

## Award

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|164|本表行键；与其他表同值不自动代表同一对象。|
|fixed_award_n|number|164|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|extra_award_n|number|164|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"fixed_award_n":5,"extra_award_n":4}`|
|2|`{"fixed_award_n":2,"extra_award_n":2}`|
|3|`{"fixed_award_n":1,"extra_award_n":1}`|
|4|`{"fixed_award_n":1500,"extra_award_n":1500}`|
|101|`{"fixed_award_n":6,"extra_award_n":5}`|
|102|`{"fixed_award_n":3,"extra_award_n":2}`|
|103|`{"fixed_award_n":2,"extra_award_n":1}`|
|104|`{"fixed_award_n":1725,"extra_award_n":1725}`|
|201|`{"fixed_award_n":6,"extra_award_n":6}`|
|202|`{"fixed_award_n":3,"extra_award_n":3}`|
|203|`{"fixed_award_n":2,"extra_award_n":1}`|
|204|`{"fixed_award_n":1950,"extra_award_n":1950}`|
|301|`{"fixed_award_n":7,"extra_award_n":7}`|
|302|`{"fixed_award_n":4,"extra_award_n":3}`|
|303|`{"fixed_award_n":2,"extra_award_n":2}`|
|304|`{"fixed_award_n":2175,"extra_award_n":2175}`|
|401|`{"fixed_award_n":8,"extra_award_n":7}`|
|402|`{"fixed_award_n":4,"extra_award_n":4}`|
|403|`{"fixed_award_n":2,"extra_award_n":2}`|
|404|`{"fixed_award_n":2400,"extra_award_n":2400}`|
|501|`{"fixed_award_n":9,"extra_award_n":8}`|
|502|`{"fixed_award_n":5,"extra_award_n":4}`|
|503|`{"fixed_award_n":3,"extra_award_n":2}`|
|504|`{"fixed_award_n":2625,"extra_award_n":2625}`|
|601|`{"fixed_award_n":9,"extra_award_n":9}`|
|602|`{"fixed_award_n":5,"extra_award_n":5}`|
|603|`{"fixed_award_n":3,"extra_award_n":2}`|
|604|`{"fixed_award_n":2850,"extra_award_n":2850}`|
|701|`{"fixed_award_n":10,"extra_award_n":10}`|
|702|`{"fixed_award_n":6,"extra_award_n":5}`|
|703|`{"fixed_award_n":3,"extra_award_n":3}`|
|704|`{"fixed_award_n":3075,"extra_award_n":3075}`|
|801|`{"fixed_award_n":11,"extra_award_n":10}`|
|802|`{"fixed_award_n":6,"extra_award_n":6}`|
|803|`{"fixed_award_n":3,"extra_award_n":3}`|
|804|`{"fixed_award_n":3300,"extra_award_n":3300}`|
|901|`{"fixed_award_n":12,"extra_award_n":11}`|
|902|`{"fixed_award_n":7,"extra_award_n":6}`|
|903|`{"fixed_award_n":4,"extra_award_n":3}`|
|904|`{"fixed_award_n":3525,"extra_award_n":3525}`|
|1001|`{"fixed_award_n":12,"extra_award_n":12}`|
|1002|`{"fixed_award_n":7,"extra_award_n":7}`|
|1003|`{"fixed_award_n":4,"extra_award_n":3}`|
|1004|`{"fixed_award_n":3750,"extra_award_n":3750}`|
|1101|`{"fixed_award_n":13,"extra_award_n":13}`|
|1102|`{"fixed_award_n":8,"extra_award_n":7}`|
|1103|`{"fixed_award_n":4,"extra_award_n":4}`|
|1104|`{"fixed_award_n":3975,"extra_award_n":3975}`|
|1201|`{"fixed_award_n":14,"extra_award_n":13}`|
|1202|`{"fixed_award_n":8,"extra_award_n":8}`|
|1203|`{"fixed_award_n":4,"extra_award_n":4}`|
|1204|`{"fixed_award_n":4200,"extra_award_n":4200}`|
|1301|`{"fixed_award_n":15,"extra_award_n":14}`|
|1302|`{"fixed_award_n":9,"extra_award_n":8}`|
|1303|`{"fixed_award_n":5,"extra_award_n":4}`|
|1304|`{"fixed_award_n":4425,"extra_award_n":4425}`|
|1401|`{"fixed_award_n":15,"extra_award_n":15}`|
|1402|`{"fixed_award_n":9,"extra_award_n":9}`|
|1403|`{"fixed_award_n":5,"extra_award_n":4}`|
|1404|`{"fixed_award_n":4650,"extra_award_n":4650}`|
|1501|`{"fixed_award_n":16,"extra_award_n":16}`|
|1502|`{"fixed_award_n":10,"extra_award_n":9}`|
|1503|`{"fixed_award_n":5,"extra_award_n":5}`|
|1504|`{"fixed_award_n":4875,"extra_award_n":4875}`|
|1601|`{"fixed_award_n":17,"extra_award_n":16}`|
|1602|`{"fixed_award_n":10,"extra_award_n":10}`|
|1603|`{"fixed_award_n":5,"extra_award_n":5}`|
|1604|`{"fixed_award_n":5100,"extra_award_n":5100}`|
|1701|`{"fixed_award_n":17,"extra_award_n":17}`|
|1702|`{"fixed_award_n":10,"extra_award_n":10}`|
|1703|`{"fixed_award_n":5,"extra_award_n":5}`|
|1704|`{"fixed_award_n":5325,"extra_award_n":5325}`|
|1801|`{"fixed_award_n":18,"extra_award_n":17}`|
|1802|`{"fixed_award_n":11,"extra_award_n":10}`|
|1803|`{"fixed_award_n":6,"extra_award_n":5}`|
|1804|`{"fixed_award_n":5550,"extra_award_n":5550}`|
|1901|`{"fixed_award_n":18,"extra_award_n":18}`|
|1902|`{"fixed_award_n":11,"extra_award_n":10}`|
|1903|`{"fixed_award_n":6,"extra_award_n":5}`|
|1904|`{"fixed_award_n":5775,"extra_award_n":5775}`|
|2001|`{"fixed_award_n":19,"extra_award_n":18}`|
|2002|`{"fixed_award_n":11,"extra_award_n":11}`|
|2003|`{"fixed_award_n":6,"extra_award_n":5}`|
|2004|`{"fixed_award_n":6000,"extra_award_n":6000}`|
|2101|`{"fixed_award_n":19,"extra_award_n":19}`|
|2102|`{"fixed_award_n":11,"extra_award_n":11}`|
|2103|`{"fixed_award_n":6,"extra_award_n":5}`|
|2104|`{"fixed_award_n":6225,"extra_award_n":6225}`|
|2201|`{"fixed_award_n":20,"extra_award_n":19}`|
|2202|`{"fixed_award_n":12,"extra_award_n":11}`|
|2203|`{"fixed_award_n":6,"extra_award_n":6}`|
|2204|`{"fixed_award_n":6450,"extra_award_n":6450}`|
|2301|`{"fixed_award_n":20,"extra_award_n":20}`|
|2302|`{"fixed_award_n":12,"extra_award_n":11}`|
|2303|`{"fixed_award_n":6,"extra_award_n":6}`|
|2304|`{"fixed_award_n":6675,"extra_award_n":6675}`|
|2401|`{"fixed_award_n":21,"extra_award_n":20}`|
|2402|`{"fixed_award_n":12,"extra_award_n":12}`|
|2403|`{"fixed_award_n":6,"extra_award_n":6}`|
|2404|`{"fixed_award_n":6900,"extra_award_n":6900}`|
|2501|`{"fixed_award_n":21,"extra_award_n":21}`|
|2502|`{"fixed_award_n":12,"extra_award_n":12}`|
|2503|`{"fixed_award_n":6,"extra_award_n":6}`|
|2504|`{"fixed_award_n":7125,"extra_award_n":7125}`|
|2601|`{"fixed_award_n":22,"extra_award_n":21}`|
|2602|`{"fixed_award_n":13,"extra_award_n":12}`|
|2603|`{"fixed_award_n":7,"extra_award_n":6}`|
|2604|`{"fixed_award_n":7350,"extra_award_n":7350}`|
|2701|`{"fixed_award_n":22,"extra_award_n":22}`|
|2702|`{"fixed_award_n":13,"extra_award_n":12}`|
|2703|`{"fixed_award_n":7,"extra_award_n":6}`|
|2704|`{"fixed_award_n":7575,"extra_award_n":7575}`|
|2801|`{"fixed_award_n":23,"extra_award_n":22}`|
|2802|`{"fixed_award_n":13,"extra_award_n":13}`|
|2803|`{"fixed_award_n":7,"extra_award_n":6}`|
|2804|`{"fixed_award_n":7800,"extra_award_n":7800}`|
|2901|`{"fixed_award_n":23,"extra_award_n":23}`|
|2902|`{"fixed_award_n":13,"extra_award_n":13}`|
|2903|`{"fixed_award_n":7,"extra_award_n":6}`|
|2904|`{"fixed_award_n":8025,"extra_award_n":8025}`|
|3001|`{"fixed_award_n":24,"extra_award_n":23}`|
|3002|`{"fixed_award_n":14,"extra_award_n":13}`|
|3003|`{"fixed_award_n":7,"extra_award_n":7}`|
|3004|`{"fixed_award_n":8250,"extra_award_n":8250}`|
|3101|`{"fixed_award_n":24,"extra_award_n":24}`|
|3102|`{"fixed_award_n":14,"extra_award_n":13}`|
|3103|`{"fixed_award_n":7,"extra_award_n":7}`|
|3104|`{"fixed_award_n":8475,"extra_award_n":8475}`|
|3201|`{"fixed_award_n":25,"extra_award_n":24}`|
|3202|`{"fixed_award_n":14,"extra_award_n":14}`|
|3203|`{"fixed_award_n":7,"extra_award_n":7}`|
|3204|`{"fixed_award_n":8700,"extra_award_n":8700}`|
|3301|`{"fixed_award_n":25,"extra_award_n":25}`|
|3302|`{"fixed_award_n":14,"extra_award_n":14}`|
|3303|`{"fixed_award_n":7,"extra_award_n":7}`|
|3304|`{"fixed_award_n":8925,"extra_award_n":8925}`|
|3401|`{"fixed_award_n":26,"extra_award_n":25}`|
|3402|`{"fixed_award_n":15,"extra_award_n":14}`|
|3403|`{"fixed_award_n":8,"extra_award_n":7}`|
|3404|`{"fixed_award_n":9150,"extra_award_n":9150}`|
|3501|`{"fixed_award_n":26,"extra_award_n":26}`|
|3502|`{"fixed_award_n":15,"extra_award_n":14}`|
|3503|`{"fixed_award_n":8,"extra_award_n":7}`|
|3504|`{"fixed_award_n":9375,"extra_award_n":9375}`|
|3601|`{"fixed_award_n":27,"extra_award_n":26}`|
|3602|`{"fixed_award_n":15,"extra_award_n":15}`|
|3603|`{"fixed_award_n":8,"extra_award_n":7}`|
|3604|`{"fixed_award_n":9600,"extra_award_n":9600}`|
|3701|`{"fixed_award_n":27,"extra_award_n":27}`|
|3702|`{"fixed_award_n":15,"extra_award_n":15}`|
|3703|`{"fixed_award_n":8,"extra_award_n":7}`|
|3704|`{"fixed_award_n":9825,"extra_award_n":9825}`|
|3801|`{"fixed_award_n":28,"extra_award_n":27}`|
|3802|`{"fixed_award_n":16,"extra_award_n":15}`|
|3803|`{"fixed_award_n":8,"extra_award_n":8}`|
|3804|`{"fixed_award_n":10050,"extra_award_n":10050}`|
|3901|`{"fixed_award_n":28,"extra_award_n":28}`|
|3902|`{"fixed_award_n":16,"extra_award_n":15}`|
|3903|`{"fixed_award_n":8,"extra_award_n":8}`|
|3904|`{"fixed_award_n":10275,"extra_award_n":10275}`|
|4001|`{"fixed_award_n":29,"extra_award_n":28}`|
|4002|`{"fixed_award_n":16,"extra_award_n":16}`|
|4003|`{"fixed_award_n":8,"extra_award_n":8}`|
|4004|`{"fixed_award_n":10500,"extra_award_n":10500}`|

## AwardType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|award|number|4|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|weight|number|4|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award":31002,"weight":25}`|
|2|`{"award":32002,"weight":15}`|
|3|`{"award":33002,"weight":10}`|
|4|`{"award":201500,"weight":25}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|fixed_award|array|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"fixed_award":[[1,1],[2,1],[4,1]]}`|

## Intelli

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|24|本表行键；与其他表同值不自动代表同一对象。|
|quality|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|des_id|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"quality":20}`|
|2|`{"quality":20}`|
|3|`{"quality":20}`|
|4|`{"quality":20}`|
|5|`{"quality":20}`|
|6|`{"quality":20}`|
|7|`{"quality":30}`|
|8|`{"quality":30}`|
|9|`{"quality":30}`|
|10|`{"quality":30}`|
|11|`{"quality":30}`|
|12|`{"quality":30}`|
|13|`{"quality":40}`|
|14|`{"quality":40}`|
|15|`{"quality":40}`|
|16|`{"quality":40}`|
|17|`{"quality":40}`|
|18|`{"quality":40}`|
|19|`{"quality":50}`|
|20|`{"quality":50}`|
|21|`{"quality":50}`|
|22|`{"quality":50}`|
|23|`{"quality":50}`|
|24|`{"quality":50}`|
