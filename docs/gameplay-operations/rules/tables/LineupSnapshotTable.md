# LineupSnapshotTable 规则参数

来源：[personal-server/assets/tables/LineupSnapshotTable.data.json.gz](../../../../personal-server/assets/tables/LineupSnapshotTable.data.json.gz)，SHA256：`0c5decc26acb57ca3363e2f59a85ed72e1a5c7ae7b0e4a31c4303837e079d434`。

[完整逐行JSON](LineupSnapshotTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Const](#const)|1|decoded-rows|
|[RobotLineup](#robotlineup)|2|decoded-rows|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|lineup_hero_refresh|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"lineup_hero_refresh":7}`|

## RobotLineup

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|hero|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"hero":[2010101,2010201,1020601,2020201,2020601,3030501]}`|
|2|`{"hero":[1020201,1020301,1020401,1020501,1020601,1010101]}`|
