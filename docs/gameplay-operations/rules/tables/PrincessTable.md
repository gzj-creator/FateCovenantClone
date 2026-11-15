# PrincessTable 规则参数

来源：[personal-server/assets/tables/PrincessTable.data.lua.json.gz](../../../../personal-server/assets/tables/PrincessTable.data.lua.json.gz)，SHA256：`00a3e2f23b4d83c48abce58e75135ce01c7d4c826282a33ade2a5c7f019ca18d`。

[完整逐行JSON](PrincessTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[EnergyAward](#energyaward)|2|decoded-rows|
|[Gift](#gift)|3|decoded-rows|
|[LoginAward](#loginaward)|0|decoded-rows|
|[HolidayAward](#holidayaward)|0|decoded-rows|

## EnergyAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|free_day|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_item|number|2|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|tips_title|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|reissue_item|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|reissue_count|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|end_time|number|2|结束日期内秒偏移；不是单独完整时间戳。|
|start_time|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|unlock_cond|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tips|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tip_params|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|talk_key|string|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_count|number|2|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|tittle|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"free_day":1,"award_item":122702,"reissue_item":101500,"reissue_count":50,"end_time":57600,"start_time":43200,"unlock_cond":649496900001,"award_count":3}`|
|2|`{"free_day":1,"award_item":122702,"reissue_item":101500,"reissue_count":50,"end_time":75600,"start_time":64800,"unlock_cond":649496900001,"award_count":3}`|

## Gift

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|title|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|unlock_cond|undefined|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|

## LoginAward

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## HolidayAward

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。
