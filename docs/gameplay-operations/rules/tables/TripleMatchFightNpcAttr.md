# TripleMatchFightNpcAttr 规则参数

来源：[personal-server/assets/tables/TripleMatchFightNpcAttr.data.lua.json.gz](../../../../personal-server/assets/tables/TripleMatchFightNpcAttr.data.lua.json.gz)，SHA256：`b82c33f933f2c095de7d3ffae2f839f362094a610b7422a351dfb7f39122f7af`。

[完整逐行JSON](TripleMatchFightNpcAttr.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[NpcAttr](#npcattr)|23054|decoded-rows|

## NpcAttr

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|23054|本表行键；与其他表同值不自动代表同一对象。|
|show_level|number|23054|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr|array|23054|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部23054行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"show_level":20,"attr":[[2,5],[1,6000],[3,30]]}`|
|2|`{"show_level":20,"attr":[[2,5],[1,6000],[3,30]]}`|
|3|`{"show_level":1,"attr":[[1,24],[2,11],[3,1]]}`|
