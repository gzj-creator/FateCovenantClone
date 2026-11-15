# TaskGroupTable 规则参数

来源：[personal-server/assets/tables/TaskGroupTable.data.json.gz](../../../../personal-server/assets/tables/TaskGroupTable.data.json.gz)，SHA256：`a48549b7d9da225c45a042bcf6d735711bd8cd09f1e23c0c5e52eb0218030215`。

[完整逐行JSON](TaskGroupTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Group](#group)|6|decoded-rows|
|[GroupTask](#grouptask)|20|decoded-rows|
|[GroupFunc](#groupfunc)|0|decoded-rows|
|[Type](#type)|2|decoded-rows|
|[CommonTask](#commontask)|未知|unresolved：Empty/non-row output; field map not independently recovered|
|[CommonTaskGlobal](#commontaskglobal)|4|decoded-rows|

## Group

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|need_seq|boolean|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_scale|number|6|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award|array|6|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|award_pos|array|6|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|is_customized|boolean|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tasks|array|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{"need_seq":false,"award_scale":0.6,"award":[[201500,1]],"award_pos":[0.54,1.124],"is_customized":true,"tasks":[100101]}`|
|1002|`{"need_seq":false,"award_scale":0.7,"award":[[201500,1]],"award_pos":[0.54,1.32],"is_customized":false,"tasks":[100201,100202,100203]}`|
|1003|`{"need_seq":false,"award_scale":0.6,"award":[[201500,1]],"award_pos":[0.54,1.124],"is_customized":false,"tasks":[100301,100302,100303,100304]}`|
|1004|`{"need_seq":false,"award_scale":0.6,"award":[[201500,1]],"award_pos":[0.54,1.124],"is_customized":false,"tasks":[100401,100402,100403,100404]}`|
|1005|`{"need_seq":false,"award_scale":0,"award":[[201500,1]],"award_pos":[],"is_customized":false,"tasks":[100501,100502,100503,100504]}`|
|1006|`{"need_seq":false,"award_scale":0,"award":[[201500,1]],"award_pos":[],"is_customized":false,"tasks":[100601,100602,100603,100604]}`|

## GroupTask

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|award|array|20|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|type|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|20|本表行键；与其他表同值不自动代表同一对象。|
|target_count|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_key|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|100101|`{"award":[],"type":8601,"target_count":3,"task_key":0}`|
|100201|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|
|100202|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|
|100203|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|
|100301|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|
|100302|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|
|100303|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|
|100304|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|
|100401|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|
|100402|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|
|100403|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|
|100404|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|
|100501|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|
|100502|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|
|100503|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|
|100504|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|
|100601|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|
|100602|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|
|100603|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|
|100604|`{"award":[[201500,1]],"type":1202,"target_count":5,"task_key":0}`|

## GroupFunc

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## Type

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|data|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|progress_fun|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|stat_expand|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skip|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|reverse|boolean|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|progress_param|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|title|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|unLock_Hide|boolean|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|des|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sort_weight|number|2|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|
|progress_type|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1202|`{"progress_fun":10,"stat_expand":[],"progress_param":0,"unLock_Hide":false,"sort_weight":9,"progress_type":1}`|
|8601|`{"progress_fun":0,"stat_expand":[2500200],"progress_param":0,"unLock_Hide":false,"sort_weight":0,"progress_type":2}`|

## CommonTask

未恢复：Empty/non-row output; field map not independently recovered。不能把解析失败当作原表0行。

## CommonTaskGlobal

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|type|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"type":1201}`|
|3|`{"type":1602}`|
|4|`{"type":1202}`|
|5|`{"type":9001}`|
