# RechargeBonusTable 规则参数

来源：[personal-server/assets/tables/14863431925290164000-RechargeBonusTable.data.json.gz](../../../../personal-server/assets/tables/14863431925290164000-RechargeBonusTable.data.json.gz)，SHA256：`66ff5f54505d7f7fb085192438b0ad6c100b90d37d013dc89ddffc9af296c0e6`。

[完整逐行JSON](RechargeBonusTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Group](#group)|2|decoded-rows|
|[Award](#award)|24|decoded-rows|
|[RechargeBonus](#rechargebonus)|2|decoded-rows|

## Group

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|title|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|

## Award

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|24|本表行键；与其他表同值不自动代表同一对象。|
|is_big_award|boolean|24|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award_list|array|24|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|belong_group|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"is_big_award":false,"award_list":[[101500,666],[17002,500]],"belong_group":1}`|
|102|`{"is_big_award":false,"award_list":[[2002,5],[17002,600]],"belong_group":1}`|
|103|`{"is_big_award":false,"award_list":[[19002,2],[18002,20]],"belong_group":1}`|
|104|`{"is_big_award":false,"award_list":[[101500,666],[17002,500]],"belong_group":1}`|
|105|`{"is_big_award":true,"award_list":[[131200,30],[201500,2]],"belong_group":1}`|
|106|`{"is_big_award":false,"award_list":[[201500,2],[901900,30]],"belong_group":1}`|
|107|`{"is_big_award":true,"award_list":[[11200,1],[32002,20]],"belong_group":1}`|
|108|`{"is_big_award":false,"award_list":[[231200,2],[201500,2]],"belong_group":1}`|
|109|`{"is_big_award":false,"award_list":[[221200,1],[231200,2]],"belong_group":1}`|
|110|`{"is_big_award":false,"award_list":[[4002,5],[20002,10]],"belong_group":1}`|
|111|`{"is_big_award":false,"award_list":[[201500,2],[201500,2]],"belong_group":1}`|
|112|`{"is_big_award":true,"award_list":[[22002,2],[33002,8]],"belong_group":1}`|
|201|`{"is_big_award":false,"award_list":[[101500,666],[17002,500]],"belong_group":2}`|
|202|`{"is_big_award":false,"award_list":[[2002,5],[17002,600]],"belong_group":2}`|
|203|`{"is_big_award":false,"award_list":[[19002,2],[18002,20]],"belong_group":2}`|
|204|`{"is_big_award":false,"award_list":[[101500,666],[17002,500]],"belong_group":2}`|
|205|`{"is_big_award":true,"award_list":[[131200,30],[201500,2]],"belong_group":2}`|
|206|`{"is_big_award":false,"award_list":[[201500,2],[901900,30]],"belong_group":2}`|
|207|`{"is_big_award":true,"award_list":[[11200,1],[32002,20]],"belong_group":2}`|
|208|`{"is_big_award":false,"award_list":[[231200,2],[201500,2]],"belong_group":2}`|
|209|`{"is_big_award":false,"award_list":[[221200,1],[231200,2]],"belong_group":2}`|
|210|`{"is_big_award":false,"award_list":[[4002,5],[20002,10]],"belong_group":2}`|
|211|`{"is_big_award":false,"award_list":[[201500,2],[201500,2]],"belong_group":2}`|
|212|`{"is_big_award":true,"award_list":[[22002,2],[33002,8]],"belong_group":2}`|

## RechargeBonus

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|open_day|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|group|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"open_day":1,"group":[1]}`|
|2|`{"open_day":35,"group":[1,2]}`|
