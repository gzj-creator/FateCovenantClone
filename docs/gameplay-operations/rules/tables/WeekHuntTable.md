# WeekHuntTable 规则参数

来源：[personal-server/assets/tables/WeekHuntTable.data.bytecode.json.gz](../../../../personal-server/assets/tables/WeekHuntTable.data.bytecode.json.gz)，SHA256：`09d1ba3c4264c0be1a86b527e5818ff8c9de1f19f1815f01d6125be477c9f501`。

[完整逐行JSON](WeekHuntTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[TaskType](#tasktype)|3|decoded-rows|
|[Period](#period)|156|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[Task](#task)|3276|decoded-rows|
|[Progress](#progress)|624|decoded-rows|
|[OldTask](#oldtask)|42|decoded-rows|

## TaskType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|title|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|progress_fun|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|progress_param|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|des|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|param_txt_func|undefined|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skip|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|target_txt_func|undefined|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sort_weight|number|3|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|
|progress_type|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"progress_fun":0,"progress_param":0,"sort_weight":5,"progress_type":1}`|
|2|`{"progress_fun":357,"progress_param":0,"sort_weight":0,"progress_type":0}`|
|3|`{"progress_fun":0,"progress_param":0,"sort_weight":0,"progress_type":1}`|

## Period

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|gift_award_num|number|156|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|common_one_key_gift|number|156|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|normal_tag_name|number|156|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|upgrade_tag_name|number|156|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|156|本表行键；与其他表同值不自动代表同一对象。|
|upgrade_gift|array|156|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|gift_treasure_tid|array|156|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|gift_award_tid|number|156|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|free_gift|number|156|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|start_day|number|156|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|common_gift|array|156|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"gift_award_num":1,"gift_award_tid":132517,"free_gift":1,"start_day":1}`|
|2|`{"gift_award_num":1,"gift_award_tid":132717,"free_gift":1,"start_day":8}`|
|3|`{"gift_award_num":1,"gift_award_tid":132917,"free_gift":1,"start_day":15}`|
|4|`{"gift_award_num":1,"gift_award_tid":133117,"free_gift":1,"start_day":22}`|
|5|`{"gift_award_num":1,"gift_award_tid":133317,"free_gift":1,"start_day":29}`|
|6|`{"gift_award_num":1,"gift_award_tid":133517,"free_gift":1,"start_day":36}`|
|7|`{"gift_award_num":1,"gift_award_tid":132517,"free_gift":1,"start_day":43}`|
|8|`{"gift_award_num":1,"gift_award_tid":132717,"free_gift":1,"start_day":50}`|
|9|`{"gift_award_num":1,"gift_award_tid":132917,"free_gift":1,"start_day":57}`|
|10|`{"gift_award_num":1,"gift_award_tid":133117,"free_gift":1,"start_day":64}`|
|11|`{"gift_award_num":1,"gift_award_tid":133317,"free_gift":1,"start_day":71}`|
|12|`{"gift_award_num":1,"gift_award_tid":133517,"free_gift":1,"start_day":78}`|
|13|`{"gift_award_num":1,"gift_award_tid":132517,"free_gift":1,"start_day":85}`|
|14|`{"gift_award_num":1,"gift_award_tid":132717,"free_gift":1,"start_day":92}`|
|15|`{"gift_award_num":1,"gift_award_tid":132917,"free_gift":1,"start_day":99}`|
|16|`{"gift_award_num":1,"gift_award_tid":133117,"free_gift":1,"start_day":106}`|
|17|`{"gift_award_num":1,"gift_award_tid":133317,"free_gift":1,"start_day":113}`|
|18|`{"gift_award_num":1,"gift_award_tid":133517,"free_gift":1,"start_day":120}`|
|19|`{"gift_award_num":1,"gift_award_tid":134917,"free_gift":1,"start_day":127}`|
|20|`{"gift_award_num":1,"gift_award_tid":135117,"free_gift":1,"start_day":134}`|
|21|`{"gift_award_num":1,"gift_award_tid":134917,"free_gift":1,"start_day":141}`|
|22|`{"gift_award_num":1,"gift_award_tid":135117,"free_gift":1,"start_day":148}`|
|23|`{"gift_award_num":1,"gift_award_tid":134917,"free_gift":1,"start_day":155}`|
|24|`{"gift_award_num":1,"gift_award_tid":135117,"free_gift":1,"start_day":162}`|
|25|`{"gift_award_num":1,"gift_award_tid":132917,"free_gift":1,"start_day":169}`|
|26|`{"gift_award_num":1,"gift_award_tid":133117,"free_gift":1,"start_day":176}`|
|27|`{"gift_award_num":1,"gift_award_tid":133317,"free_gift":1,"start_day":183}`|
|28|`{"gift_award_num":1,"gift_award_tid":134917,"free_gift":1,"start_day":190}`|
|29|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":203}`|
|30|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":210}`|
|31|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":217}`|
|32|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":224}`|
|33|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":231}`|
|34|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":238}`|
|35|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":245}`|
|36|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":252}`|
|37|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":259}`|
|38|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":266}`|
|39|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":273}`|
|40|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":280}`|
|41|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":287}`|
|42|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":294}`|
|43|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":301}`|
|44|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":308}`|
|45|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":315}`|
|46|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":322}`|
|47|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":329}`|
|48|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":336}`|
|49|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":343}`|
|50|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":350}`|
|51|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":357}`|
|52|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":364}`|
|53|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":371}`|
|54|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":378}`|
|55|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":385}`|
|56|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":392}`|
|57|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":399}`|
|58|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":406}`|
|59|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":413}`|
|60|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":420}`|
|61|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":427}`|
|62|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":434}`|
|63|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":441}`|
|64|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":448}`|
|65|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":455}`|
|66|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":462}`|
|67|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":469}`|
|68|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":476}`|
|69|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":483}`|
|70|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":490}`|
|71|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":497}`|
|72|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":504}`|
|73|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":511}`|
|74|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":518}`|
|75|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":525}`|
|76|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":532}`|
|77|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":539}`|
|78|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":546}`|
|79|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":553}`|
|80|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":560}`|
|81|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":567}`|
|82|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":574}`|
|83|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":581}`|
|84|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":588}`|
|85|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":595}`|
|86|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":602}`|
|87|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":609}`|
|88|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":616}`|
|89|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":623}`|
|90|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":630}`|
|91|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":637}`|
|92|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":644}`|
|93|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":651}`|
|94|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":658}`|
|95|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":665}`|
|96|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":672}`|
|97|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":679}`|
|98|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":686}`|
|99|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":693}`|
|100|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":700}`|
|101|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":707}`|
|102|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":714}`|
|103|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":721}`|
|104|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":728}`|
|105|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":735}`|
|106|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":742}`|
|107|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":749}`|
|108|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":756}`|
|109|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":763}`|
|110|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":770}`|
|111|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":777}`|
|112|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":784}`|
|113|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":791}`|
|114|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":798}`|
|115|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":805}`|
|116|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":812}`|
|117|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":819}`|
|118|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":826}`|
|119|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":833}`|
|120|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":840}`|
|121|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":847}`|
|122|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":854}`|
|123|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":861}`|
|124|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":868}`|
|125|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":875}`|
|126|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":882}`|
|127|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":889}`|
|128|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":896}`|
|129|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":903}`|
|130|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":910}`|
|131|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":917}`|
|132|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":924}`|
|133|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":931}`|
|134|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":938}`|
|135|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":945}`|
|136|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":952}`|
|137|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":959}`|
|138|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":966}`|
|139|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":973}`|
|140|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":980}`|
|141|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":987}`|
|142|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":994}`|
|143|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":1001}`|
|144|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":1008}`|
|145|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":1015}`|
|146|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":1022}`|
|147|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":1029}`|
|148|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":1036}`|
|149|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":1043}`|
|150|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":1050}`|
|151|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":1057}`|
|152|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":1064}`|
|153|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":1071}`|
|154|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":1078}`|
|155|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":1085}`|
|156|`{"gift_award_num":1,"gift_award_tid":3171200,"free_gift":1,"start_day":1092}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|task_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|period_day|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|time_split|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rule_time_split|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|duration_day|number|1|配置持续天数；0须保留，不能擅自改为1。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"task_count":3,"period_day":7,"time_split":1729026000,"rule_time_split":1730235600,"duration_day":14}`|

## Task

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|task_max_count|number|3276|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|period|number|3276|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|3276|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|progress|number|3276|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|3276|本表行键；与其他表同值不自动代表同一对象。|
|award_show|array|3276|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|is_last_task|boolean|3276|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|day|number|3276|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_count|number|3276|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task|number|3276|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|desc|number|3276|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pre_task|number|3276|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_param|number|3276|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|order|number|3276|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部3276行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"task_max_count":10,"award":[[1571200,10]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":1,"task_count":10,"task":1,"pre_task":0,"task_param":0}`|
|102|`{"task_max_count":200,"award":[[391002,150]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":1,"task_count":200,"task":3,"pre_task":0,"task_param":0}`|
|103|`{"task_max_count":1,"award":[[392002,1]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":1,"task_count":1,"task":2,"pre_task":0,"task_param":1}`|

## Progress

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|period|number|624|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|624|本表行键；与其他表同值不自动代表同一对象。|
|award|array|624|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|progress|number|624|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部624行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"award":[[101500,288]],"progress":30}`|
|102|`{"award":[[101500,588]],"progress":80}`|
|103|`{"award":[[2002,5]],"progress":140}`|

## OldTask

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|task_max_count|number|42|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|period|number|42|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|42|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|progress|number|42|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|42|本表行键；与其他表同值不自动代表同一对象。|
|award_show|array|42|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|is_last_task|boolean|42|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|day|number|42|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_count|number|42|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task|number|42|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|desc|number|42|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pre_task|number|42|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_param|number|42|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|order|number|42|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"task_max_count":280,"award":[[1571200,10]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":1,"task_count":40,"task":1002,"pre_task":0,"task_param":0}`|
|102|`{"task_max_count":7000,"award":[[391002,150]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":1,"task_count":1000,"task":8301,"pre_task":0,"task_param":0}`|
|103|`{"task_max_count":7,"award":[[392002,1]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":1,"task_count":1,"task":13701,"pre_task":0,"task_param":1}`|
|104|`{"task_max_count":280,"award":[[1571200,10]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":2,"task_count":80,"task":1002,"pre_task":101,"task_param":0}`|
|105|`{"task_max_count":7000,"award":[[157002,5000]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":2,"task_count":2000,"task":8301,"pre_task":102,"task_param":0}`|
|106|`{"task_max_count":7,"award":[[17002,200]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":2,"task_count":2,"task":13701,"pre_task":103,"task_param":1}`|
|107|`{"task_max_count":280,"award":[[1571200,10]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":3,"task_count":120,"task":1002,"pre_task":104,"task_param":0}`|
|108|`{"task_max_count":7000,"award":[[17002,200]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":3,"task_count":3000,"task":8301,"pre_task":105,"task_param":0}`|
|109|`{"task_max_count":7,"award":[[21002,10]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":3,"task_count":3,"task":13701,"pre_task":106,"task_param":1}`|
|110|`{"task_max_count":280,"award":[[1571200,10]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":4,"task_count":160,"task":1002,"pre_task":107,"task_param":0}`|
|111|`{"task_max_count":7000,"award":[[17002,200]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":4,"task_count":4000,"task":8301,"pre_task":108,"task_param":0}`|
|112|`{"task_max_count":7,"award":[[18002,5]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":4,"task_count":4,"task":13701,"pre_task":109,"task_param":1}`|
|113|`{"task_max_count":280,"award":[[1571200,10]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":5,"task_count":200,"task":1002,"pre_task":110,"task_param":0}`|
|114|`{"task_max_count":7000,"award":[[391002,150]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":5,"task_count":5000,"task":8301,"pre_task":111,"task_param":0}`|
|115|`{"task_max_count":7,"award":[[392002,1]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":5,"task_count":5,"task":13701,"pre_task":112,"task_param":1}`|
|116|`{"task_max_count":280,"award":[[1571200,10]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":6,"task_count":240,"task":1002,"pre_task":113,"task_param":0}`|
|117|`{"task_max_count":7000,"award":[[32002,5]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":6,"task_count":6000,"task":8301,"pre_task":114,"task_param":0}`|
|118|`{"task_max_count":7,"award":[[33002,2]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":6,"task_count":6,"task":13701,"pre_task":115,"task_param":1}`|
|119|`{"task_max_count":280,"award":[[1571200,10]],"progress":10,"award_show":[[1491000,10]],"is_last_task":true,"day":7,"task_count":280,"task":1002,"pre_task":116,"task_param":0}`|
|120|`{"task_max_count":7000,"award":[[17002,200]],"progress":10,"award_show":[[1491000,10]],"is_last_task":true,"day":7,"task_count":7000,"task":8301,"pre_task":117,"task_param":0}`|
|121|`{"task_max_count":7,"award":[[21002,10]],"progress":10,"award_show":[[1491000,10]],"is_last_task":true,"day":7,"task_count":7,"task":13701,"pre_task":118,"task_param":1}`|
|201|`{"task_max_count":280,"award":[[1571200,10]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":1,"task_count":40,"task":1002,"pre_task":0,"task_param":0}`|
|202|`{"task_max_count":7000,"award":[[391002,150]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":1,"task_count":1000,"task":8301,"pre_task":0,"task_param":0}`|
|203|`{"task_max_count":7,"award":[[392002,1]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":1,"task_count":1,"task":13701,"pre_task":0,"task_param":2}`|
|204|`{"task_max_count":280,"award":[[1571200,10]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":2,"task_count":80,"task":1002,"pre_task":201,"task_param":0}`|
|205|`{"task_max_count":7000,"award":[[157002,5000]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":2,"task_count":2000,"task":8301,"pre_task":202,"task_param":0}`|
|206|`{"task_max_count":7,"award":[[17002,200]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":2,"task_count":2,"task":13701,"pre_task":203,"task_param":2}`|
|207|`{"task_max_count":280,"award":[[1571200,10]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":3,"task_count":120,"task":1002,"pre_task":204,"task_param":0}`|
|208|`{"task_max_count":7000,"award":[[17002,200]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":3,"task_count":3000,"task":8301,"pre_task":205,"task_param":0}`|
|209|`{"task_max_count":7,"award":[[21002,10]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":3,"task_count":3,"task":13701,"pre_task":206,"task_param":2}`|
|210|`{"task_max_count":280,"award":[[1571200,10]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":4,"task_count":160,"task":1002,"pre_task":207,"task_param":0}`|
|211|`{"task_max_count":7000,"award":[[17002,200]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":4,"task_count":4000,"task":8301,"pre_task":208,"task_param":0}`|
|212|`{"task_max_count":7,"award":[[18002,5]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":4,"task_count":4,"task":13701,"pre_task":209,"task_param":2}`|
|213|`{"task_max_count":280,"award":[[1571200,10]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":5,"task_count":200,"task":1002,"pre_task":210,"task_param":0}`|
|214|`{"task_max_count":7000,"award":[[391002,150]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":5,"task_count":5000,"task":8301,"pre_task":211,"task_param":0}`|
|215|`{"task_max_count":7,"award":[[392002,1]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":5,"task_count":5,"task":13701,"pre_task":212,"task_param":2}`|
|216|`{"task_max_count":280,"award":[[1571200,10]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":6,"task_count":240,"task":1002,"pre_task":213,"task_param":0}`|
|217|`{"task_max_count":7000,"award":[[32002,5]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":6,"task_count":6000,"task":8301,"pre_task":214,"task_param":0}`|
|218|`{"task_max_count":7,"award":[[33002,2]],"progress":10,"award_show":[[1491000,10]],"is_last_task":false,"day":6,"task_count":6,"task":13701,"pre_task":215,"task_param":2}`|
|219|`{"task_max_count":280,"award":[[1571200,10]],"progress":10,"award_show":[[1491000,10]],"is_last_task":true,"day":7,"task_count":280,"task":1002,"pre_task":216,"task_param":0}`|
|220|`{"task_max_count":7000,"award":[[17002,200]],"progress":10,"award_show":[[1491000,10]],"is_last_task":true,"day":7,"task_count":7000,"task":8301,"pre_task":217,"task_param":0}`|
|221|`{"task_max_count":7,"award":[[21002,10]],"progress":10,"award_show":[[1491000,10]],"is_last_task":true,"day":7,"task_count":7,"task":13701,"pre_task":218,"task_param":2}`|
