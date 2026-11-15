# OpenServerBoxTable 规则参数

来源：[personal-server/assets/tables/OpenServerBoxTable.data.json.gz](../../../../personal-server/assets/tables/OpenServerBoxTable.data.json.gz)，SHA256：`d2bd3d7ca0c5a00212638a02acfdfdf95d8626da42795013138648fbbc8a1cdf`。

[完整逐行JSON](OpenServerBoxTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[OpenServerBox](#openserverbox)|120|decoded-rows|
|[Icon](#icon)|4|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[Version](#version)|4|rows-with-external-references|
|[OpenServerProgress](#openserverprogress)|20|decoded-rows|

## OpenServerBox

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|recharge_award|number|120|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|is_special|boolean|120|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|number|120|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|recharge_award_count|number|120|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|tid|number|120|本表行键；与其他表同值不自动代表同一对象。|
|version|number|120|版本引用；必须按活动类型及其消费者查对应版本表。|
|award_count|number|120|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|recharge_award_show|number|120|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"recharge_award":3002,"is_special":false,"award":2002,"recharge_award_count":5,"version":0,"award_count":5,"recharge_award_show":819102}`|
|2|`{"recharge_award":3002,"is_special":false,"award":2002,"recharge_award_count":5,"version":0,"award_count":5,"recharge_award_show":819102}`|
|3|`{"recharge_award":3002,"is_special":false,"award":2002,"recharge_award_count":5,"version":0,"award_count":5,"recharge_award_show":819102}`|
|4|`{"recharge_award":3002,"is_special":false,"award":2002,"recharge_award_count":5,"version":0,"award_count":5,"recharge_award_show":819102}`|
|5|`{"recharge_award":3002,"is_special":false,"award":2002,"recharge_award_count":5,"version":0,"award_count":5,"recharge_award_show":819102}`|
|6|`{"recharge_award":3002,"is_special":true,"award":2002,"recharge_award_count":10,"version":0,"award_count":10,"recharge_award_show":819102}`|
|7|`{"recharge_award":3002,"is_special":false,"award":2002,"recharge_award_count":5,"version":0,"award_count":5,"recharge_award_show":819102}`|
|8|`{"recharge_award":3002,"is_special":false,"award":2002,"recharge_award_count":5,"version":0,"award_count":5,"recharge_award_show":819102}`|
|9|`{"recharge_award":3002,"is_special":false,"award":2002,"recharge_award_count":5,"version":0,"award_count":5,"recharge_award_show":819102}`|
|10|`{"recharge_award":3002,"is_special":false,"award":2002,"recharge_award_count":5,"version":0,"award_count":5,"recharge_award_show":819102}`|
|11|`{"recharge_award":3002,"is_special":false,"award":2002,"recharge_award_count":5,"version":0,"award_count":5,"recharge_award_show":819102}`|
|12|`{"recharge_award":3002,"is_special":true,"award":2002,"recharge_award_count":10,"version":0,"award_count":10,"recharge_award_show":819102}`|
|13|`{"recharge_award":3002,"is_special":false,"award":2002,"recharge_award_count":5,"version":0,"award_count":5,"recharge_award_show":819102}`|
|14|`{"recharge_award":3002,"is_special":false,"award":2002,"recharge_award_count":5,"version":0,"award_count":5,"recharge_award_show":819102}`|
|15|`{"recharge_award":3002,"is_special":false,"award":2002,"recharge_award_count":5,"version":0,"award_count":5,"recharge_award_show":819102}`|
|16|`{"recharge_award":3002,"is_special":false,"award":2002,"recharge_award_count":5,"version":0,"award_count":5,"recharge_award_show":819102}`|
|17|`{"recharge_award":3002,"is_special":false,"award":2002,"recharge_award_count":5,"version":0,"award_count":5,"recharge_award_show":819102}`|
|18|`{"recharge_award":3002,"is_special":true,"award":2002,"recharge_award_count":10,"version":0,"award_count":10,"recharge_award_show":819102}`|
|19|`{"recharge_award":3002,"is_special":false,"award":2002,"recharge_award_count":5,"version":0,"award_count":5,"recharge_award_show":819102}`|
|20|`{"recharge_award":3002,"is_special":false,"award":2002,"recharge_award_count":5,"version":0,"award_count":5,"recharge_award_show":819102}`|
|21|`{"recharge_award":3002,"is_special":false,"award":2002,"recharge_award_count":5,"version":0,"award_count":5,"recharge_award_show":819102}`|
|22|`{"recharge_award":3002,"is_special":false,"award":2002,"recharge_award_count":5,"version":0,"award_count":5,"recharge_award_show":819102}`|
|23|`{"recharge_award":3002,"is_special":false,"award":2002,"recharge_award_count":5,"version":0,"award_count":5,"recharge_award_show":819102}`|
|24|`{"recharge_award":3002,"is_special":true,"award":2002,"recharge_award_count":10,"version":0,"award_count":10,"recharge_award_show":819102}`|
|25|`{"recharge_award":3002,"is_special":false,"award":2002,"recharge_award_count":5,"version":0,"award_count":5,"recharge_award_show":819102}`|
|26|`{"recharge_award":3002,"is_special":false,"award":2002,"recharge_award_count":5,"version":0,"award_count":5,"recharge_award_show":819102}`|
|27|`{"recharge_award":3002,"is_special":false,"award":2002,"recharge_award_count":5,"version":0,"award_count":5,"recharge_award_show":819102}`|
|28|`{"recharge_award":3002,"is_special":false,"award":2002,"recharge_award_count":5,"version":0,"award_count":5,"recharge_award_show":819102}`|
|29|`{"recharge_award":3002,"is_special":false,"award":2002,"recharge_award_count":5,"version":0,"award_count":5,"recharge_award_show":819102}`|
|30|`{"recharge_award":3002,"is_special":true,"award":2002,"recharge_award_count":15,"version":0,"award_count":15,"recharge_award_show":819102}`|
|101|`{"recharge_award":0,"is_special":false,"award":326002,"recharge_award_count":0,"version":1,"award_count":5,"recharge_award_show":0}`|
|102|`{"recharge_award":0,"is_special":false,"award":326002,"recharge_award_count":0,"version":1,"award_count":5,"recharge_award_show":0}`|
|103|`{"recharge_award":0,"is_special":false,"award":326002,"recharge_award_count":0,"version":1,"award_count":5,"recharge_award_show":0}`|
|104|`{"recharge_award":0,"is_special":false,"award":326002,"recharge_award_count":0,"version":1,"award_count":5,"recharge_award_show":0}`|
|105|`{"recharge_award":0,"is_special":false,"award":326002,"recharge_award_count":0,"version":1,"award_count":5,"recharge_award_show":0}`|
|106|`{"recharge_award":0,"is_special":true,"award":326002,"recharge_award_count":0,"version":1,"award_count":10,"recharge_award_show":0}`|
|107|`{"recharge_award":0,"is_special":false,"award":326002,"recharge_award_count":0,"version":1,"award_count":5,"recharge_award_show":0}`|
|108|`{"recharge_award":0,"is_special":false,"award":326002,"recharge_award_count":0,"version":1,"award_count":5,"recharge_award_show":0}`|
|109|`{"recharge_award":0,"is_special":false,"award":326002,"recharge_award_count":0,"version":1,"award_count":5,"recharge_award_show":0}`|
|110|`{"recharge_award":0,"is_special":false,"award":326002,"recharge_award_count":0,"version":1,"award_count":5,"recharge_award_show":0}`|
|111|`{"recharge_award":0,"is_special":false,"award":326002,"recharge_award_count":0,"version":1,"award_count":5,"recharge_award_show":0}`|
|112|`{"recharge_award":0,"is_special":true,"award":326002,"recharge_award_count":0,"version":1,"award_count":10,"recharge_award_show":0}`|
|113|`{"recharge_award":0,"is_special":false,"award":326002,"recharge_award_count":0,"version":1,"award_count":5,"recharge_award_show":0}`|
|114|`{"recharge_award":0,"is_special":false,"award":326002,"recharge_award_count":0,"version":1,"award_count":5,"recharge_award_show":0}`|
|115|`{"recharge_award":0,"is_special":false,"award":326002,"recharge_award_count":0,"version":1,"award_count":5,"recharge_award_show":0}`|
|116|`{"recharge_award":0,"is_special":false,"award":326002,"recharge_award_count":0,"version":1,"award_count":5,"recharge_award_show":0}`|
|117|`{"recharge_award":0,"is_special":false,"award":326002,"recharge_award_count":0,"version":1,"award_count":5,"recharge_award_show":0}`|
|118|`{"recharge_award":0,"is_special":true,"award":326002,"recharge_award_count":0,"version":1,"award_count":10,"recharge_award_show":0}`|
|119|`{"recharge_award":0,"is_special":false,"award":326002,"recharge_award_count":0,"version":1,"award_count":5,"recharge_award_show":0}`|
|120|`{"recharge_award":0,"is_special":false,"award":326002,"recharge_award_count":0,"version":1,"award_count":5,"recharge_award_show":0}`|
|121|`{"recharge_award":0,"is_special":false,"award":326002,"recharge_award_count":0,"version":1,"award_count":5,"recharge_award_show":0}`|
|122|`{"recharge_award":0,"is_special":false,"award":326002,"recharge_award_count":0,"version":1,"award_count":5,"recharge_award_show":0}`|
|123|`{"recharge_award":0,"is_special":false,"award":326002,"recharge_award_count":0,"version":1,"award_count":5,"recharge_award_show":0}`|
|124|`{"recharge_award":0,"is_special":true,"award":326002,"recharge_award_count":0,"version":1,"award_count":10,"recharge_award_show":0}`|
|125|`{"recharge_award":0,"is_special":false,"award":326002,"recharge_award_count":0,"version":1,"award_count":5,"recharge_award_show":0}`|
|126|`{"recharge_award":0,"is_special":false,"award":326002,"recharge_award_count":0,"version":1,"award_count":5,"recharge_award_show":0}`|
|127|`{"recharge_award":0,"is_special":false,"award":326002,"recharge_award_count":0,"version":1,"award_count":5,"recharge_award_show":0}`|
|128|`{"recharge_award":0,"is_special":false,"award":326002,"recharge_award_count":0,"version":1,"award_count":5,"recharge_award_show":0}`|
|129|`{"recharge_award":0,"is_special":false,"award":326002,"recharge_award_count":0,"version":1,"award_count":5,"recharge_award_show":0}`|
|130|`{"recharge_award":0,"is_special":true,"award":326002,"recharge_award_count":0,"version":1,"award_count":15,"recharge_award_show":0}`|
|201|`{"recharge_award":0,"is_special":false,"award":101500,"recharge_award_count":0,"version":2,"award_count":300,"recharge_award_show":0}`|
|202|`{"recharge_award":0,"is_special":false,"award":396002,"recharge_award_count":0,"version":2,"award_count":4,"recharge_award_show":0}`|
|203|`{"recharge_award":0,"is_special":false,"award":157002,"recharge_award_count":0,"version":2,"award_count":50000,"recharge_award_show":0}`|
|204|`{"recharge_award":0,"is_special":false,"award":19002,"recharge_award_count":0,"version":2,"award_count":2,"recharge_award_show":0}`|
|205|`{"recharge_award":0,"is_special":false,"award":18002,"recharge_award_count":0,"version":2,"award_count":30,"recharge_award_show":0}`|
|206|`{"recharge_award":0,"is_special":true,"award":2002,"recharge_award_count":0,"version":2,"award_count":10,"recharge_award_show":0}`|
|207|`{"recharge_award":0,"is_special":false,"award":101500,"recharge_award_count":0,"version":2,"award_count":400,"recharge_award_show":0}`|
|208|`{"recharge_award":0,"is_special":false,"award":391002,"recharge_award_count":0,"version":2,"award_count":1000,"recharge_award_show":0}`|
|209|`{"recharge_award":0,"is_special":false,"award":141002,"recharge_award_count":0,"version":2,"award_count":4,"recharge_award_show":0}`|
|210|`{"recharge_award":0,"is_special":false,"award":392002,"recharge_award_count":0,"version":2,"award_count":5,"recharge_award_show":0}`|
|211|`{"recharge_award":0,"is_special":false,"award":17002,"recharge_award_count":0,"version":2,"award_count":1200,"recharge_award_show":0}`|
|212|`{"recharge_award":0,"is_special":true,"award":326002,"recharge_award_count":0,"version":2,"award_count":5,"recharge_award_show":0}`|
|213|`{"recharge_award":0,"is_special":false,"award":101500,"recharge_award_count":0,"version":2,"award_count":500,"recharge_award_show":0}`|
|214|`{"recharge_award":0,"is_special":false,"award":157002,"recharge_award_count":0,"version":2,"award_count":60000,"recharge_award_show":0}`|
|215|`{"recharge_award":0,"is_special":false,"award":21002,"recharge_award_count":0,"version":2,"award_count":100,"recharge_award_show":0}`|
|216|`{"recharge_award":0,"is_special":false,"award":20002,"recharge_award_count":0,"version":2,"award_count":10,"recharge_award_show":0}`|
|217|`{"recharge_award":0,"is_special":false,"award":179002,"recharge_award_count":0,"version":2,"award_count":150,"recharge_award_show":0}`|
|218|`{"recharge_award":0,"is_special":true,"award":2002,"recharge_award_count":0,"version":2,"award_count":10,"recharge_award_show":0}`|
|219|`{"recharge_award":0,"is_special":false,"award":101500,"recharge_award_count":0,"version":2,"award_count":600,"recharge_award_show":0}`|
|220|`{"recharge_award":0,"is_special":false,"award":396002,"recharge_award_count":0,"version":2,"award_count":5,"recharge_award_show":0}`|
|221|`{"recharge_award":0,"is_special":false,"award":331002,"recharge_award_count":0,"version":2,"award_count":200,"recharge_award_show":0}`|
|222|`{"recharge_award":0,"is_special":false,"award":414002,"recharge_award_count":0,"version":2,"award_count":10,"recharge_award_show":0}`|
|223|`{"recharge_award":0,"is_special":false,"award":332002,"recharge_award_count":0,"version":2,"award_count":60,"recharge_award_show":0}`|
|224|`{"recharge_award":0,"is_special":true,"award":326002,"recharge_award_count":0,"version":2,"award_count":5,"recharge_award_show":0}`|
|225|`{"recharge_award":0,"is_special":false,"award":101500,"recharge_award_count":0,"version":2,"award_count":800,"recharge_award_show":0}`|
|226|`{"recharge_award":0,"is_special":false,"award":501002,"recharge_award_count":0,"version":2,"award_count":800,"recharge_award_show":0}`|
|227|`{"recharge_award":0,"is_special":false,"award":32002,"recharge_award_count":0,"version":2,"award_count":15,"recharge_award_show":0}`|
|228|`{"recharge_award":0,"is_special":false,"award":502002,"recharge_award_count":0,"version":2,"award_count":3,"recharge_award_show":0}`|
|229|`{"recharge_award":0,"is_special":false,"award":17002,"recharge_award_count":0,"version":2,"award_count":1500,"recharge_award_show":0}`|
|230|`{"recharge_award":0,"is_special":true,"award":2002,"recharge_award_count":0,"version":2,"award_count":10,"recharge_award_show":0}`|
|301|`{"recharge_award":0,"is_special":false,"award":101500,"recharge_award_count":0,"version":3,"award_count":300,"recharge_award_show":0}`|
|302|`{"recharge_award":0,"is_special":false,"award":396002,"recharge_award_count":0,"version":3,"award_count":4,"recharge_award_show":0}`|
|303|`{"recharge_award":0,"is_special":false,"award":18002,"recharge_award_count":0,"version":3,"award_count":30,"recharge_award_show":0}`|
|304|`{"recharge_award":0,"is_special":false,"award":19002,"recharge_award_count":0,"version":3,"award_count":2,"recharge_award_show":0}`|
|305|`{"recharge_award":0,"is_special":false,"award":141002,"recharge_award_count":0,"version":3,"award_count":4,"recharge_award_show":0}`|
|306|`{"recharge_award":0,"is_special":true,"award":2002,"recharge_award_count":0,"version":3,"award_count":10,"recharge_award_show":0}`|
|307|`{"recharge_award":0,"is_special":false,"award":101500,"recharge_award_count":0,"version":3,"award_count":400,"recharge_award_show":0}`|
|308|`{"recharge_award":0,"is_special":false,"award":391002,"recharge_award_count":0,"version":3,"award_count":1000,"recharge_award_show":0}`|
|309|`{"recharge_award":0,"is_special":false,"award":179002,"recharge_award_count":0,"version":3,"award_count":150,"recharge_award_show":0}`|
|310|`{"recharge_award":0,"is_special":false,"award":392002,"recharge_award_count":0,"version":3,"award_count":5,"recharge_award_show":0}`|
|311|`{"recharge_award":0,"is_special":false,"award":493002,"recharge_award_count":0,"version":3,"award_count":80,"recharge_award_show":0}`|
|312|`{"recharge_award":0,"is_special":true,"award":326002,"recharge_award_count":0,"version":3,"award_count":5,"recharge_award_show":0}`|
|313|`{"recharge_award":0,"is_special":false,"award":101500,"recharge_award_count":0,"version":3,"award_count":500,"recharge_award_show":0}`|
|314|`{"recharge_award":0,"is_special":false,"award":501002,"recharge_award_count":0,"version":3,"award_count":800,"recharge_award_show":0}`|
|315|`{"recharge_award":0,"is_special":false,"award":21002,"recharge_award_count":0,"version":3,"award_count":100,"recharge_award_show":0}`|
|316|`{"recharge_award":0,"is_special":false,"award":20002,"recharge_award_count":0,"version":3,"award_count":10,"recharge_award_show":0}`|
|317|`{"recharge_award":0,"is_special":false,"award":414002,"recharge_award_count":0,"version":3,"award_count":10,"recharge_award_show":0}`|
|318|`{"recharge_award":0,"is_special":true,"award":2002,"recharge_award_count":0,"version":3,"award_count":10,"recharge_award_show":0}`|
|319|`{"recharge_award":0,"is_special":false,"award":101500,"recharge_award_count":0,"version":3,"award_count":600,"recharge_award_show":0}`|
|320|`{"recharge_award":0,"is_special":false,"award":495002,"recharge_award_count":0,"version":3,"award_count":200,"recharge_award_show":0}`|
|321|`{"recharge_award":0,"is_special":false,"award":331002,"recharge_award_count":0,"version":3,"award_count":200,"recharge_award_show":0}`|
|322|`{"recharge_award":0,"is_special":false,"award":494002,"recharge_award_count":0,"version":3,"award_count":2,"recharge_award_show":0}`|
|323|`{"recharge_award":0,"is_special":false,"award":332002,"recharge_award_count":0,"version":3,"award_count":60,"recharge_award_show":0}`|
|324|`{"recharge_award":0,"is_special":true,"award":326002,"recharge_award_count":0,"version":3,"award_count":5,"recharge_award_show":0}`|
|325|`{"recharge_award":0,"is_special":false,"award":101500,"recharge_award_count":0,"version":3,"award_count":800,"recharge_award_show":0}`|
|326|`{"recharge_award":0,"is_special":false,"award":396002,"recharge_award_count":0,"version":3,"award_count":5,"recharge_award_show":0}`|
|327|`{"recharge_award":0,"is_special":false,"award":32002,"recharge_award_count":0,"version":3,"award_count":15,"recharge_award_show":0}`|
|328|`{"recharge_award":0,"is_special":false,"award":502002,"recharge_award_count":0,"version":3,"award_count":3,"recharge_award_show":0}`|
|329|`{"recharge_award":0,"is_special":false,"award":493002,"recharge_award_count":0,"version":3,"award_count":100,"recharge_award_show":0}`|
|330|`{"recharge_award":0,"is_special":true,"award":2002,"recharge_award_count":0,"version":3,"award_count":10,"recharge_award_show":0}`|

## Icon

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|icon|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|display_time|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|check_day|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"check_day":30}`|

## Version

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|get_cond|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|open_form|object|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|recharge|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|recharge_cond|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|join_day|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|filter_cond|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|0|`{"get_cond":60205,"open_form":{"reference":"OpenServerBoxForm.StaticOpen"},"recharge_cond":324809700000,"join_day":1}`|
|1|`{"get_cond":60205,"open_form":{"reference":"OpenServerBox2Form.StaticOpen"},"join_day":33,"filter_cond":511897900001}`|
|2|`{"get_cond":60205,"open_form":{"reference":"OpenServerBoxCommonForm.StaticOpen"},"join_day":31,"filter_cond":511897900002}`|
|3|`{"get_cond":60205,"open_form":{"reference":"OpenServerBoxCommonForm.StaticOpen"},"join_day":61}`|

## OpenServerProgress

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|20|本表行键；与其他表同值不自动代表同一对象。|
|version|number|20|版本引用；必须按活动类型及其消费者查对应版本表。|
|award|array|20|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|need_progress|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"version":0,"award":[[22002,2]],"need_progress":7}`|
|2|`{"version":0,"award":[[22002,2]],"need_progress":13}`|
|3|`{"version":0,"award":[[22002,2]],"need_progress":19}`|
|4|`{"version":0,"award":[[22002,2]],"need_progress":25}`|
|5|`{"version":0,"award":[[22002,2]],"need_progress":30}`|
|101|`{"version":1,"award":[[22002,2]],"need_progress":7}`|
|102|`{"version":1,"award":[[22002,2]],"need_progress":13}`|
|103|`{"version":1,"award":[[22002,2]],"need_progress":19}`|
|104|`{"version":1,"award":[[22002,2]],"need_progress":25}`|
|105|`{"version":1,"award":[[22002,2]],"need_progress":30}`|
|201|`{"version":2,"award":[[22002,2]],"need_progress":7}`|
|202|`{"version":2,"award":[[11200,1]],"need_progress":13}`|
|203|`{"version":2,"award":[[22002,2]],"need_progress":19}`|
|204|`{"version":2,"award":[[23002,2]],"need_progress":25}`|
|205|`{"version":2,"award":[[11200,1]],"need_progress":30}`|
|301|`{"version":3,"award":[[22002,2]],"need_progress":7}`|
|302|`{"version":3,"award":[[11200,1]],"need_progress":13}`|
|303|`{"version":3,"award":[[22002,2]],"need_progress":19}`|
|304|`{"version":3,"award":[[23002,2]],"need_progress":25}`|
|305|`{"version":3,"award":[[11200,1]],"need_progress":30}`|
