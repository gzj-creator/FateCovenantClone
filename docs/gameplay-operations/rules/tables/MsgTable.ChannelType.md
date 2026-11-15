# MsgTable.ChannelType 规则参数

来源：[personal-server/assets/tables/MsgTable.ChannelType.json.gz](../../../../personal-server/assets/tables/MsgTable.ChannelType.json.gz)，SHA256：`213568e3e8622aec96c27574ca7ee42292310b490528d6406fe343e94fab334d`。

[完整逐行JSON](MsgTable.ChannelType.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[ChannelType](#channeltype)|17|decoded-rows|

## ChannelType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|17|本表行键；与其他表同值不自动代表同一对象。|
|forbid_msg_sync|boolean|17|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|word_leagle_source|number|17|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|default_in_channel|boolean|17|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_cross|boolean|17|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|need_log|boolean|17|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_chat|boolean|17|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"is_cross":false,"need_log":true,"is_chat":true}`|
|2|`{"is_cross":false,"need_log":true,"is_chat":true}`|
|3|`{"is_cross":false,"need_log":true,"is_chat":true}`|
|4|`{"is_cross":true,"need_log":true,"is_chat":true}`|
|5|`{"is_cross":false,"need_log":false,"is_chat":false}`|
|7|`{"is_cross":false,"need_log":false,"is_chat":false}`|
|8|`{"is_cross":false,"need_log":true,"is_chat":true}`|
|10|`{"is_cross":false,"need_log":false,"is_chat":false}`|
|12|`{"is_cross":false,"need_log":true,"is_chat":false}`|
|13|`{"is_cross":false,"need_log":true,"is_chat":false}`|
|14|`{"is_cross":false,"need_log":true,"is_chat":false}`|
|15|`{"is_cross":true,"need_log":true,"is_chat":true}`|
|16|`{"is_cross":true,"need_log":true,"is_chat":true}`|
|17|`{"is_cross":false,"need_log":true,"is_chat":false}`|
|18|`{"is_cross":false,"need_log":true,"is_chat":false}`|
|19|`{"is_cross":false,"need_log":true,"is_chat":false}`|
|20|`{"is_cross":false,"need_log":true,"is_chat":true}`|
