# ChessRevertTable 规则参数

来源：[personal-server/assets/tables/ChessRevertTable.data.lua.json.gz](../../../../personal-server/assets/tables/ChessRevertTable.data.lua.json.gz)，SHA256：`6312c0688817f37be10d6af1a67cbefa8bc66450a4dc714e39e5a81ac4813210`。

[完整逐行JSON](ChessRevertTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[ActActive](#actactive)|4|decoded-rows|
|[ActVersion](#actversion)|2|decoded-rows|
|[Gift](#gift)|17|decoded-rows|
|[ActRecharge](#actrecharge)|6|decoded-rows|
|[ActTurn](#actturn)|18|decoded-rows|

## ActActive

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|version|number|4|版本引用；必须按活动类型及其消费者查对应版本表。|
|cnt|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"version":1}`|
|102|`{"version":1}`|
|201|`{"version":2}`|
|202|`{"version":2}`|

## ActVersion

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|shop_award|array|2|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|tile_swap|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"shop_award":[[668002,25],[667002,15]]}`|
|2|`{"shop_award":[[668002,25],[667002,15]]}`|

## Gift

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|17|本表行键；与其他表同值不自动代表同一对象。|
|version|number|17|版本引用；必须按活动类型及其消费者查对应版本表。|
|is_top|boolean|17|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|gift|number|17|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"version":1,"is_top":true}`|
|102|`{"version":1,"is_top":false}`|
|103|`{"version":1,"is_top":false}`|
|104|`{"version":1,"is_top":false}`|
|105|`{"version":1,"is_top":false}`|
|106|`{"version":1,"is_top":false}`|
|107|`{"version":1,"is_top":false}`|
|108|`{"version":1,"is_top":false}`|
|201|`{"version":2,"is_top":true}`|
|202|`{"version":2,"is_top":false}`|
|203|`{"version":2,"is_top":false}`|
|204|`{"version":2,"is_top":false}`|
|205|`{"version":2,"is_top":false}`|
|206|`{"version":2,"is_top":false}`|
|207|`{"version":2,"is_top":false}`|
|208|`{"version":2,"is_top":false}`|
|209|`{"version":2,"is_top":false}`|

## ActRecharge

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|version|number|6|版本引用；必须按活动类型及其消费者查对应版本表。|
|cnt|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"version":1}`|
|102|`{"version":1}`|
|103|`{"version":1}`|
|201|`{"version":2}`|
|202|`{"version":2}`|
|203|`{"version":2}`|

## ActTurn

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|18|本表行键；与其他表同值不自动代表同一对象。|
|version|number|18|版本引用；必须按活动类型及其消费者查对应版本表。|
|award|array|18|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"version":1,"award":[[8401900,50]]}`|
|102|`{"version":1,"award":[[8401900,50]]}`|
|103|`{"version":1,"award":[[8401900,50]]}`|
|104|`{"version":1,"award":[[8401900,50]]}`|
|105|`{"version":1,"award":[[8401900,50]]}`|
|106|`{"version":1,"award":[[8401900,50]]}`|
|107|`{"version":1,"award":[[8401900,150]]}`|
|108|`{"version":1,"award":[[8401900,150]]}`|
|109|`{"version":1,"award":[[8401900,150]]}`|
|201|`{"version":2,"award":[[8401900,50]]}`|
|202|`{"version":2,"award":[[8401900,50]]}`|
|203|`{"version":2,"award":[[8401900,50]]}`|
|204|`{"version":2,"award":[[8401900,50]]}`|
|205|`{"version":2,"award":[[8401900,50]]}`|
|206|`{"version":2,"award":[[8401900,50]]}`|
|207|`{"version":2,"award":[[8401900,150]]}`|
|208|`{"version":2,"award":[[8401900,150]]}`|
|209|`{"version":2,"award":[[8401900,150]]}`|
