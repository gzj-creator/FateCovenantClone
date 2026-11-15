# WishTreeTable 规则参数

来源：[personal-server/assets/tables/WishTreeTable.data.lua.json.gz](../../../../personal-server/assets/tables/WishTreeTable.data.lua.json.gz)，SHA256：`5fb61b12e23a99ce4d5a63d0d9ce9202f2503ba898704d574d7b9b34794c4354`。

[完整逐行JSON](WishTreeTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Global](#global)|1|decoded-rows|
|[SelectAward](#selectaward)|8|decoded-rows|
|[Award](#award)|18|decoded-rows|
|[Type](#type)|2|decoded-rows|

## Global

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|max_accrue_day|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|treasure_need_times|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"max_accrue_day":14,"treasure_need_times":10}`|

## SelectAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|8|本表行键；与其他表同值不自动代表同一对象。|
|award_num|number|8|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award|number|8|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|join_day|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{"award_num":2,"award":22002,"join_day":13}`|
|1002|`{"award_num":1,"award":390002,"join_day":13}`|
|1003|`{"award_num":1,"award":472002,"join_day":13}`|
|1004|`{"award_num":1,"award":496002,"join_day":25}`|
|2001|`{"award_num":4,"award":22002,"join_day":13}`|
|2002|`{"award_num":2,"award":390002,"join_day":13}`|
|2003|`{"award_num":2,"award":472002,"join_day":13}`|
|2004|`{"award_num":2,"award":496002,"join_day":25}`|

## Award

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|special|boolean|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|item|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|count|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|extra_item|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|18|本表行键；与其他表同值不自动代表同一对象。|
|extra_count|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|select_award|array|18|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{"item":2002,"count":10,"extra_item":22002,"extra_count":2,"select_award":[1001,1002,1003,1004]}`|
|1002|`{"item":33002,"count":10,"extra_item":0,"extra_count":0,"select_award":[]}`|
|1003|`{"item":2002,"count":10,"extra_item":0,"extra_count":0,"select_award":[]}`|
|1004|`{"item":33002,"count":10,"extra_item":421200,"extra_count":1,"select_award":[]}`|
|1005|`{"item":101500,"count":888,"extra_item":0,"extra_count":0,"select_award":[]}`|
|1006|`{"item":2002,"count":5,"extra_item":0,"extra_count":0,"select_award":[]}`|
|1007|`{"item":101500,"count":666,"extra_item":3002,"extra_count":10,"select_award":[]}`|
|1008|`{"item":2002,"count":5,"extra_item":0,"extra_count":0,"select_award":[]}`|
|1009|`{"item":101500,"count":388,"extra_item":0,"extra_count":0,"select_award":[]}`|
|2001|`{"item":3002,"count":10,"extra_item":22002,"extra_count":4,"select_award":[2001,2002,2003,2004]}`|
|2002|`{"item":33002,"count":15,"extra_item":0,"extra_count":0,"select_award":[]}`|
|2003|`{"item":3002,"count":5,"extra_item":0,"extra_count":0,"select_award":[]}`|
|2004|`{"item":33002,"count":15,"extra_item":1321200,"extra_count":1,"select_award":[]}`|
|2005|`{"item":101500,"count":1288,"extra_item":0,"extra_count":0,"select_award":[]}`|
|2006|`{"item":2002,"count":10,"extra_item":0,"extra_count":0,"select_award":[]}`|
|2007|`{"item":101500,"count":888,"extra_item":3002,"extra_count":10,"select_award":[]}`|
|2008|`{"item":2002,"count":10,"extra_item":0,"extra_count":0,"select_award":[]}`|
|2009|`{"item":101500,"count":588,"extra_item":0,"extra_count":0,"select_award":[]}`|

## Type

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|gift|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
