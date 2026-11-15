# MartialClubActTable 规则参数

来源：[personal-server/assets/tables/MartialClubActTable.data.lua.json.gz](../../../../personal-server/assets/tables/MartialClubActTable.data.lua.json.gz)，SHA256：`3590cabae87ed86e91b23902e06951d067250dc01f6cc408622349ed985143b7`。

[完整逐行JSON](MartialClubActTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[MartialClubAct](#martialclubact)|10|decoded-rows|

## MartialClubAct

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|10|本表行键；与其他表同值不自动代表同一对象。|
|first_award|object|10|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|server_award|array|10|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|4|`{"first_award":{"global":"TableEmpty"},"server_award":[[1241200,2]]}`|
|8|`{"first_award":{"global":"TableEmpty"},"server_award":[[1251200,1]]}`|
|12|`{"first_award":{"global":"TableEmpty"},"server_award":[[1251200,1]]}`|
|16|`{"first_award":{"global":"TableEmpty"},"server_award":[[1261200,1]]}`|
|20|`{"first_award":{"global":"TableEmpty"},"server_award":[[1261200,1]]}`|
|24|`{"first_award":{"global":"TableEmpty"},"server_award":[[1271200,1]]}`|
|28|`{"first_award":{"global":"TableEmpty"},"server_award":[[1271200,1]]}`|
|32|`{"first_award":{"global":"TableEmpty"},"server_award":[[1271200,1]]}`|
|36|`{"first_award":{"global":"TableEmpty"},"server_award":[[1271200,1]]}`|
|40|`{"first_award":{"global":"TableEmpty"},"server_award":[[1271200,1]]}`|
