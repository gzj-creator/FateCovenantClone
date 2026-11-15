# ResCompleteTable 规则参数

来源：[personal-server/assets/tables/ResCompleteTable.data.json.gz](../../../../personal-server/assets/tables/ResCompleteTable.data.json.gz)，SHA256：`9d612b293f51e035a47ca29aab02f87ef515ab0c9806bbb660538b33cb87434e`。

[完整逐行JSON](ResCompleteTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Open](#open)|3|decoded-rows|
|[Award](#award)|1|decoded-rows|

## Open

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|old_player_day|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|download_chapter|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|second_chapter|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|auto_download_day|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|size|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|old_player_chapter|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"old_player_day":4,"second_chapter":100201,"auto_download_day":0}`|
|2|`{"old_player_day":4,"second_chapter":100201,"auto_download_day":2}`|
|3|`{"old_player_day":4,"second_chapter":100201,"auto_download_day":2}`|

## Award

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|award_n|array|1|奖励数量数组；零与缺字段分别保留。|
|award|array|1|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award_n":[200,10000,500],"award":[101500,201500,101800]}`|
