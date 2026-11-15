# SourcePointTable 规则参数

来源：[personal-server/assets/tables/SourcePointTable.data.lua.json.gz](../../../../personal-server/assets/tables/SourcePointTable.data.lua.json.gz)，SHA256：`9504e104b54c60314208d976e071f47979dddbf3cb0df78d5790192dda8e3b76`。

[完整逐行JSON](SourcePointTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[ElevateType](#elevatetype)|2|decoded-rows|
|[Elevate](#elevate)|6|decoded-rows|
|[Quality](#quality)|3|decoded-rows|
|[Slot](#slot)|6|decoded-rows|
|[SourcePoint](#sourcepoint)|47|decoded-rows|
|[Trial](#trial)|30|decoded-rows|

## ElevateType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|

## Elevate

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|cost_list|array|6|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|100334300|`{"cost_list":[[2,100314300,1],[2,100314300,1],[2,100314300,1],[2,100314300,1],[2,100314300,1],[1,2,1]]}`|
|100344300|`{"cost_list":[[2,100324300,1],[2,100324300,1],[2,100324300,1],[2,100324300,1],[2,100324300,1],[1,2,1]]}`|
|100414300|`{"cost_list":[[2,100404300,1],[2,100404300,1],[2,100404300,1],[2,100404300,1],[2,100404300,1],[1,2,1]]}`|
|100434300|`{"cost_list":[[2,100424300,1],[2,100424300,1],[2,100424300,1],[2,100424300,1],[2,100424300,1],[1,2,1]]}`|
|100454300|`{"cost_list":[[2,100444300,1],[2,100444300,1],[2,100444300,1],[2,100444300,1],[2,100444300,1],[1,2,1]]}`|
|100474300|`{"cost_list":[[2,100464300,1],[2,100464300,1],[2,100464300,1],[2,100464300,1],[2,100464300,1],[1,2,1]]}`|

## Quality

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|quality|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|power|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|resonance_limit|number|3|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|resonancer_attr|object|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|quality_icon|string|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|item|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"quality":50,"power":50000,"resonance_limit":4,"resonancer_attr":{"global":"TableEmpty"},"quality_icon":"wz_yd_qidi.png","item":0}`|
|2|`{"quality":60,"power":250000,"resonance_limit":5,"resonancer_attr":{"global":"TableEmpty"},"quality_icon":"wz_yd_qiyuan.png","item":820802}`|
|3|`{"quality":70,"power":3500000,"resonance_limit":6,"resonancer_attr":{"global":"TableEmpty"},"quality_icon":"wz_yd_yongheng.png","item":0}`|

## Slot

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|assert|null/number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ui_lock_tips|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ui_assert_param|object/array|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|click_lock_tips|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|click_assert_param|object/array|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"assert":null,"click_lock_tips":0,"click_assert_param":{"global":"TableEmpty"}}`|
|2|`{"assert":null,"click_lock_tips":0,"click_assert_param":{"global":"TableEmpty"}}`|
|3|`{"assert":null,"click_lock_tips":0,"click_assert_param":{"global":"TableEmpty"}}`|
|4|`{"assert":89404700004,"click_lock_tips":684164,"click_assert_param":[70]}`|
|5|`{"assert":89404700005,"click_lock_tips":684164,"click_assert_param":[75]}`|
|6|`{"assert":505896100006,"click_lock_tips":684164,"click_assert_param":[85]}`|

## SourcePoint

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|47|本表行键；与其他表同值不自动代表同一对象。|
|quality|number|47|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|power_coefficient|number|47|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|resonance_coefficient|number|47|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skill|number|47|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|repel|object/array|47|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|job|array|47|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr|array|47|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|100014300|`{"quality":1,"power_coefficient":10000,"skill":2300010100,"attr":[[188,250]]}`|
|100024300|`{"quality":1,"power_coefficient":10000,"skill":2300010200,"attr":[[188,250]]}`|
|100034300|`{"quality":1,"power_coefficient":10000,"skill":2300010300,"attr":[[188,250]]}`|
|100044300|`{"quality":1,"power_coefficient":10000,"skill":2300010400,"attr":[[188,250]]}`|
|100054300|`{"quality":1,"power_coefficient":10000,"skill":2300010500,"attr":[[188,250]]}`|
|100064300|`{"quality":1,"power_coefficient":10000,"skill":2300010600,"attr":[[188,250]]}`|
|100074300|`{"quality":1,"power_coefficient":10000,"skill":2300010700,"attr":[[188,250]]}`|
|100084300|`{"quality":1,"power_coefficient":10000,"skill":2300010800,"attr":[[188,250]]}`|
|100094300|`{"quality":1,"power_coefficient":10000,"skill":2300010900,"attr":[[188,250]]}`|
|100104300|`{"quality":1,"power_coefficient":10000,"skill":2300011000,"attr":[[188,250]]}`|
|100114300|`{"quality":1,"power_coefficient":10000,"skill":2300020100,"attr":[[188,250]]}`|
|100124300|`{"quality":1,"power_coefficient":10000,"skill":2300020200,"attr":[[188,250]]}`|
|100134300|`{"quality":1,"power_coefficient":10000,"skill":2300020300,"attr":[[188,250]]}`|
|100144300|`{"quality":1,"power_coefficient":10000,"skill":2300020400,"attr":[[188,250]]}`|
|100154300|`{"quality":1,"power_coefficient":10000,"skill":2300020500,"attr":[[188,250]]}`|
|100164300|`{"quality":1,"power_coefficient":10000,"skill":2300020600,"attr":[[188,250]]}`|
|100174300|`{"quality":1,"power_coefficient":10000,"skill":2300020700,"attr":[[188,250]]}`|
|100184300|`{"quality":1,"power_coefficient":10000,"skill":2300020800,"attr":[[188,250]]}`|
|100194300|`{"quality":1,"power_coefficient":10000,"skill":2300020900,"attr":[[188,250]]}`|
|100204300|`{"quality":1,"power_coefficient":10000,"skill":2300021000,"attr":[[188,250]]}`|
|100214300|`{"quality":1,"power_coefficient":10000,"skill":2300030100,"attr":[[188,250]]}`|
|100224300|`{"quality":1,"power_coefficient":10000,"skill":2300030200,"attr":[[188,250]]}`|
|100234300|`{"quality":1,"power_coefficient":10000,"skill":2300030300,"attr":[[188,250]]}`|
|100244300|`{"quality":1,"power_coefficient":10000,"skill":2300030400,"attr":[[188,250]]}`|
|100254300|`{"quality":1,"power_coefficient":10000,"skill":2300030500,"attr":[[188,250]]}`|
|100264300|`{"quality":2,"power_coefficient":10000,"skill":2400010300,"attr":[[188,280]]}`|
|100274300|`{"quality":2,"power_coefficient":10000,"skill":2400010400,"attr":[[188,280]]}`|
|100284300|`{"quality":2,"power_coefficient":10000,"skill":2400010500,"attr":[[188,280]]}`|
|100294300|`{"quality":2,"power_coefficient":10000,"skill":2400010600,"attr":[[188,280]]}`|
|100304300|`{"quality":2,"power_coefficient":10000,"skill":2400010700,"attr":[[188,280]]}`|
|100314300|`{"quality":2,"power_coefficient":10000,"skill":2400010200,"attr":[[188,280]]}`|
|100324300|`{"quality":2,"power_coefficient":10000,"skill":2400010100,"attr":[[188,280]]}`|
|100334300|`{"quality":3,"power_coefficient":10000,"skill":2500010200,"attr":[[188,330]]}`|
|100344300|`{"quality":3,"power_coefficient":10000,"skill":2500010100,"attr":[[188,330]]}`|
|100354300|`{"quality":2,"power_coefficient":10000,"skill":2400010703,"attr":[[188,280]]}`|
|100364300|`{"quality":2,"power_coefficient":10000,"skill":2400010706,"attr":[[188,280]]}`|
|100374300|`{"quality":2,"power_coefficient":10000,"skill":2400010708,"attr":[[188,280]]}`|
|100384300|`{"quality":2,"power_coefficient":10000,"skill":2400010714,"attr":[[188,280]]}`|
|100394300|`{"quality":2,"power_coefficient":10000,"skill":2400010716,"attr":[[188,280]]}`|
|100404300|`{"quality":2,"power_coefficient":10000,"skill":2500010300,"attr":[[188,280]]}`|
|100414300|`{"quality":3,"power_coefficient":10000,"skill":2500010310,"attr":[[188,330]]}`|
|100424300|`{"quality":2,"power_coefficient":10000,"skill":2500010400,"attr":[[188,280]]}`|
|100434300|`{"quality":3,"power_coefficient":10000,"skill":2500010409,"attr":[[188,330]]}`|
|100444300|`{"quality":2,"power_coefficient":10000,"skill":2500010500,"attr":[[188,280]]}`|
|100454300|`{"quality":3,"power_coefficient":10000,"skill":2500010510,"attr":[[188,330]]}`|
|100464300|`{"quality":2,"power_coefficient":10000,"skill":2500010530,"attr":[[188,280]]}`|
|100474300|`{"quality":3,"power_coefficient":10000,"skill":2500010540,"attr":[[188,330]]}`|

## Trial

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|30|本表行键；与其他表同值不自动代表同一对象。|
|hero|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_param|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|target_count|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|30|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|title|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"hero":1040101,"type":1199,"task_param":1040101,"target_count":10,"award":[[100264300,1]]}`|
|102|`{"hero":1040101,"type":1200,"task_param":1040101,"target_count":3,"award":[[100264300,1]]}`|
|103|`{"hero":1040101,"type":1200,"task_param":1040101,"target_count":5,"award":[[100264300,1]]}`|
|201|`{"hero":1040201,"type":1199,"task_param":1040201,"target_count":10,"award":[[100304300,1]]}`|
|202|`{"hero":1040201,"type":1200,"task_param":1040201,"target_count":3,"award":[[100304300,1]]}`|
|203|`{"hero":1040201,"type":1200,"task_param":1040201,"target_count":5,"award":[[100304300,1]]}`|
|301|`{"hero":2040101,"type":1199,"task_param":2040101,"target_count":10,"award":[[100294300,1]]}`|
|302|`{"hero":2040101,"type":1200,"task_param":2040101,"target_count":3,"award":[[100294300,1]]}`|
|303|`{"hero":2040101,"type":1200,"task_param":2040101,"target_count":5,"award":[[100294300,1]]}`|
|401|`{"hero":3040101,"type":1199,"task_param":3040101,"target_count":10,"award":[[100284300,1]]}`|
|402|`{"hero":3040101,"type":1200,"task_param":3040101,"target_count":3,"award":[[100284300,1]]}`|
|403|`{"hero":3040101,"type":1200,"task_param":3040101,"target_count":5,"award":[[100284300,1]]}`|
|501|`{"hero":4040201,"type":1199,"task_param":4040201,"target_count":10,"award":[[100274300,1]]}`|
|502|`{"hero":4040201,"type":1200,"task_param":4040201,"target_count":3,"award":[[100274300,1]]}`|
|503|`{"hero":4040201,"type":1200,"task_param":4040201,"target_count":5,"award":[[100274300,1]]}`|
|601|`{"hero":1040301,"type":1199,"task_param":1040301,"target_count":10,"award":[[100354300,1]]}`|
|602|`{"hero":1040301,"type":1200,"task_param":1040301,"target_count":3,"award":[[100354300,1]]}`|
|603|`{"hero":1040301,"type":1200,"task_param":1040301,"target_count":5,"award":[[100354300,1]]}`|
|701|`{"hero":5040201,"type":1199,"task_param":5040201,"target_count":10,"award":[[100364300,1]]}`|
|702|`{"hero":5040201,"type":1200,"task_param":5040201,"target_count":3,"award":[[100364300,1]]}`|
|703|`{"hero":5040201,"type":1200,"task_param":5040201,"target_count":5,"award":[[100364300,1]]}`|
|801|`{"hero":3040201,"type":1199,"task_param":3040201,"target_count":10,"award":[[100374300,1]]}`|
|802|`{"hero":3040201,"type":1200,"task_param":3040201,"target_count":3,"award":[[100374300,1]]}`|
|803|`{"hero":3040201,"type":1200,"task_param":3040201,"target_count":5,"award":[[100374300,1]]}`|
|901|`{"hero":2040201,"type":1199,"task_param":2040201,"target_count":10,"award":[[100384300,1]]}`|
|902|`{"hero":2040201,"type":1200,"task_param":2040201,"target_count":3,"award":[[100384300,1]]}`|
|903|`{"hero":2040201,"type":1200,"task_param":2040201,"target_count":5,"award":[[100384300,1]]}`|
|1001|`{"hero":4040301,"type":1199,"task_param":4040301,"target_count":10,"award":[[100394300,1]]}`|
|1002|`{"hero":4040301,"type":1200,"task_param":4040301,"target_count":3,"award":[[100394300,1]]}`|
|1003|`{"hero":4040301,"type":1200,"task_param":4040301,"target_count":5,"award":[[100394300,1]]}`|
