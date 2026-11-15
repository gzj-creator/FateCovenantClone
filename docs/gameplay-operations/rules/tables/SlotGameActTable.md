# SlotGameActTable 规则参数

来源：[personal-server/assets/tables/SlotGameActTable.data.lua.json.gz](../../../../personal-server/assets/tables/SlotGameActTable.data.lua.json.gz)，SHA256：`4d55659cfbf1b44f53dec1638fa45f902c3d50e49b96482431f3fb6ab34bf10e`。

[完整逐行JSON](SlotGameActTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[MultiplierLibDraw](#multiplierlibdraw)|19|decoded-rows|
|[MultiplierLib](#multiplierlib)|3|decoded-rows|
|[AwardMapLib](#awardmaplib)|1|decoded-rows|
|[AwardLib](#awardlib)|3|decoded-rows|
|[Version](#version)|1|decoded-rows|

## MultiplierLibDraw

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|lib|number|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|multiplier|number|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|weight|number|19|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|
|tid|number|19|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"lib":1,"weight":20}`|
|102|`{"lib":1,"weight":20}`|
|103|`{"lib":1,"weight":20}`|
|104|`{"lib":1,"weight":30}`|
|105|`{"lib":1,"weight":30}`|
|201|`{"lib":2,"weight":5}`|
|202|`{"lib":2,"weight":10}`|
|203|`{"lib":2,"weight":15}`|
|204|`{"lib":2,"weight":40}`|
|205|`{"lib":2,"weight":20}`|
|206|`{"lib":2,"weight":5}`|
|207|`{"lib":2,"weight":5}`|
|301|`{"lib":3,"weight":2}`|
|302|`{"lib":3,"weight":3}`|
|303|`{"lib":3,"weight":5}`|
|304|`{"lib":3,"weight":35}`|
|305|`{"lib":3,"weight":35}`|
|306|`{"lib":3,"weight":15}`|
|307|`{"lib":3,"weight":5}`|

## MultiplierLib

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|lib|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|num|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|draw_lib|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"lib":1,"num":0,"draw_lib":1}`|
|102|`{"lib":1,"num":1,"draw_lib":2}`|
|103|`{"lib":1,"num":30,"draw_lib":3}`|

## AwardMapLib

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|lib|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_lib|number|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|item|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"lib":1,"award_lib":1,"item":6921900}`|

## AwardLib

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|lib|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|weight|number|3|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|
|award|array|3|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"lib":1,"weight":100,"award":[[101500,300]]}`|
|102|`{"lib":1,"weight":0,"award":[[101500,300]]}`|
|103|`{"lib":1,"weight":0,"award":[[101500,300]]}`|

## Version

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|award_map_lib|number|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|multiplier_lib|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|help_id|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award_map_lib":1,"multiplier_lib":1}`|
