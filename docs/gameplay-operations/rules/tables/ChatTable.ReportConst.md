# ChatTable.ReportConst 规则参数

来源：[personal-server/assets/tables/ChatTable.ReportConst.json.gz](../../../../personal-server/assets/tables/ChatTable.ReportConst.json.gz)，SHA256：`013bc9315c9e9ebf8782dc0203d0427bb519fd4d3dfa46cba33cfe6243d6f404`。

[完整逐行JSON](ChatTable.ReportConst.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[ReportConst](#reportconst)|1|decoded-rows|

## ReportConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|day_times|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|report_msg_num|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|report_msg_valid_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"day_times":30,"report_msg_num":30,"report_msg_valid_time":1800}`|
