# PeriodTaskTable 规则参数

来源：[personal-server/assets/tables/PeriodTaskTable.data.json.gz](../../../../personal-server/assets/tables/PeriodTaskTable.data.json.gz)，SHA256：`9badecaea66041a30b9bd48ff60ffb2f6fd82b17c645870ea5a13781fc1932c9`。

[完整逐行JSON](PeriodTaskTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Task](#task)|0|decoded-rows|
|[RefreshType](#refreshtype)|3|rows-with-external-references|
|[Version](#version)|0|decoded-rows|
|[Score](#score)|0|decoded-rows|
|[Stage](#stage)|0|decoded-rows|

## Task

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## RefreshType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|lua_module|object|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|

## Version

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## Score

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## Stage

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。
