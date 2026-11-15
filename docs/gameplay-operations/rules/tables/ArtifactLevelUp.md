# ArtifactLevelUp 规则参数

来源：[personal-server/assets/tables/ArtifactLevelUp.data.json.gz](../../../../personal-server/assets/tables/ArtifactLevelUp.data.json.gz)，SHA256：`576a2fdc3822b491068153d5b4f33fb7f68de3c6bcf6baab061e7652c1398729`。

[完整逐行JSON](ArtifactLevelUp.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[LevelUp](#levelup)|3005|decoded-rows|

## LevelUp

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|quality|number|3005|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|level|number|3005|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|3005|本表行键；与其他表同值不自动代表同一对象。|
|cost_type|number|3005|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|cost_num|number|3005|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|attr|array|3005|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部3005行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|300000|`{"quality":30,"level":0,"cost_type":0,"cost_num":0,"attr":[]}`|
|300001|`{"quality":30,"level":1,"cost_type":391002,"cost_num":100,"attr":[[201,120],[202,20],[203,12],[204,12]]}`|
|300002|`{"quality":30,"level":2,"cost_type":391002,"cost_num":100,"attr":[[201,240],[202,40],[203,24],[204,24]]}`|
