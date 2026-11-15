# ChatTable.Param 规则参数

来源：[personal-server/assets/tables/ChatTable.Param.json.gz](../../../../personal-server/assets/tables/ChatTable.Param.json.gz)，SHA256：`d0894c6dae1050266933a06dbca5bd3c934203a25ae669bbe1658a1204a404d8`。

[完整逐行JSON](ChatTable.Param.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Param](#param)|1|decoded-rows|

## Param

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|show_time_interval|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|world_chat_level_limit|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|chat_word_count_limit|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|cancel_ban_lv_inc|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|send_time_interval|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|count_limit_in_cd|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|sys_tips_auto_disappear_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|similarity_msg_limit|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|similarity_check_limit|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|similarity_msg_count_limit|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|emoj_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|black_house_level_limit|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|max_msg_count|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|login_chat_msg_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|save_chat_msg_days|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_link_count|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|max_private_session_count|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|private_chat_lv_limit|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|private_chat_lv_dt_limit|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|pull_history_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|security_tips_limit|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|link_default_color|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|chat_record_max_length|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|chat_preview_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|private_chat_auto_round_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|private_chat_auto_round_old_index|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|chat_latest_msg_show_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|chat_latest_msg_str_len|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"show_time_interval":180,"world_chat_level_limit":15,"chat_word_count_limit":140,"cancel_ban_lv_inc":5,"send_time_interval":10,"count_limit_in_cd":3,"sys_tips_auto_disappear_time":30,"similarity_msg_limit":70,"similarity_check_limit":10,"similarity_msg_count_limit":10,"emoj_count":30,"black_house_level_limit":35,"max_msg_count":150,"login_chat_msg_count":30,"save_chat_msg_days":7,"max_link_count":2,"max_private_session_count":10,"private_chat_lv_limit":35,"private_chat_lv_dt_limit":5,"pull_history_count":150,"security_tips_limit":3,"chat_record_max_length":30,"chat_preview_time":5,"private_chat_auto_round_time":180,"private_chat_auto_round_old_index":50,"chat_latest_msg_show_time":5000}`|
