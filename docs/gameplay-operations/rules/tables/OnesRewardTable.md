# OnesRewardTable 规则参数

来源：[personal-server/assets/tables/OnesRewardTable.data.lua.json.gz](../../../../personal-server/assets/tables/OnesRewardTable.data.lua.json.gz)，SHA256：`cd26e368335f5911a52c38a741bad73a6c10dbd0a141b502223cde86047ac7b6`。

[完整逐行JSON](OnesRewardTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[OnesReward](#onesreward)|1|decoded-rows|

## OnesReward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|award|array|1|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award":[[20014100,15],[20024100,15],[20034100,15],[20044100,15],[20054100,15],[20064100,15],[20074100,15]]}`|
