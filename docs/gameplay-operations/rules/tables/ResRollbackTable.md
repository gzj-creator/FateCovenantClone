# ResRollbackTable 规则参数

来源：[personal-server/assets/tables/ResRollbackTable.data.json.gz](../../../../personal-server/assets/tables/ResRollbackTable.data.json.gz)，SHA256：`27f31320943e1c8e11e95784efe66ad0a853db9a8bba87d944532612fb4ab424`。

[完整逐行JSON](ResRollbackTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Const](#const)|1|decoded-rows|
|[Type](#type)|8|rows-with-external-references|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|can_rollback_min_star|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|rollback_to_star|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"can_rollback_min_star":6,"rollback_to_star":5}`|

## Type

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|cost_item|number|8|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|bi_log|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|refresh_func|object|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|refresh_free_time|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|8|本表行键；与其他表同值不自动代表同一对象。|
|update_attr_play|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cost_item_num|number|8|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"cost_item":101500,"refresh_func":{"reference":"HeroDataMgr.HeroResetUpData"},"refresh_free_time":0,"update_attr_play":1,"cost_item_num":500}`|
|2|`{"cost_item":101500,"refresh_func":{"reference":"EquipDataMgr.EquipResetUpData"},"refresh_free_time":0,"update_attr_play":3,"cost_item_num":100}`|
|3|`{"cost_item":101500,"refresh_func":{"reference":"ArtifactMgr.ArtifactResetUpData"},"refresh_free_time":0,"update_attr_play":2,"cost_item_num":100}`|
|4|`{"cost_item":101500,"refresh_func":{"reference":"RelicMgr.RelicResetUpData"},"refresh_free_time":1746391740,"update_attr_play":54,"cost_item_num":100}`|
|5|`{"cost_item":101500,"refresh_func":{"reference":"PetEquipMgr.EquipResetUpData"},"refresh_free_time":0,"update_attr_play":0,"cost_item_num":100}`|
|6|`{"cost_item":101500,"refresh_func":{"reference":"ElvesBeadMgr.ResetUpData"},"refresh_free_time":0,"update_attr_play":0,"cost_item_num":100}`|
|7|`{"cost_item":101500,"refresh_func":{"reference":"ElvesMgr.ResetUpData"},"refresh_free_time":0,"update_attr_play":0,"cost_item_num":100}`|
|8|`{"cost_item":101500,"refresh_func":{"reference":"PetMgr.ResetUpData"},"refresh_free_time":0,"update_attr_play":0,"cost_item_num":100}`|
