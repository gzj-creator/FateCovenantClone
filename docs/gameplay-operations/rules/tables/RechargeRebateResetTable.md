# RechargeRebateResetTable 规则参数

来源：[personal-server/assets/tables/7806056895365336000-RechargeRebateResetTable.data.json.gz](../../../../personal-server/assets/tables/7806056895365336000-RechargeRebateResetTable.data.json.gz)，SHA256：`b5ed43b21c7cca0fbf301376ece2415711ffffdc38275cecfc69eafa8a2436a5`。

[完整逐行JSON](RechargeRebateResetTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Act](#act)|3|decoded-rows|

## Act

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|daily_award|array|3|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|preview_award_item|number|3|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|preview_award_num|number|3|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|fun_jump|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"daily_award":[[101500,100],[101500,100],[101500,100]],"preview_award_item":101500,"preview_award_num":100}`|
|2|`{"daily_award":[[101500,100],[101500,100],[101500,100]],"preview_award_item":101500,"preview_award_num":100}`|
|3|`{"daily_award":[[101500,10],[101500,10],[101500,10]],"preview_award_item":101500,"preview_award_num":10}`|
