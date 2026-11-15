# SpiritCourtyardTable 规则参数

来源：[personal-server/assets/tables/SpiritCourtyardTable.data.lua.json.gz](../../../../personal-server/assets/tables/SpiritCourtyardTable.data.lua.json.gz)，SHA256：`3cc1a1d91444e75097a34acd9b055368d5afb49ef6be9a4dd8b1af85d68068ae`。

[完整逐行JSON](SpiritCourtyardTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[IntimacyTask](#intimacytask)|131|decoded-rows|
|[Intimacy](#intimacy)|20|decoded-rows|
|[LandType](#landtype)|2|decoded-rows|
|[Land](#land)|16|decoded-rows|
|[MergeNumAddW](#mergenumaddw)|2|decoded-rows|
|[FruitMergeLib](#fruitmergelib)|6|decoded-rows|
|[FruitMerge](#fruitmerge)|3|decoded-rows|
|[CropOutputLib](#cropoutputlib)|50|decoded-rows|
|[CropOutput](#cropoutput)|50|decoded-rows|
|[Crop](#crop)|18|decoded-rows|
|[CropOutFruitLib](#cropoutfruitlib)|63|decoded-rows|
|[GuildBanquet_fruit](#guildbanquet_fruit)|28|decoded-rows|
|[GuildBanquet](#guildbanquet)|6|decoded-rows|
|[GuildBanquetOrder](#guildbanquetorder)|4|decoded-rows|
|[GuildBanquetProReward](#guildbanquetproreward)|12|decoded-rows|
|[EntrustRefreshCost](#entrustrefreshcost)|7|decoded-rows|
|[EntrustQuality](#entrustquality)|5|decoded-rows|
|[EntrustOrderLib](#entrustorderlib)|35|decoded-rows|
|[EntrustOrder](#entrustorder)|50|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[Bubble](#bubble)|2|decoded-rows|
|[ItemStageType](#itemstagetype)|5|decoded-rows|
|[ItemStage](#itemstage)|17|decoded-rows|
|[Vip](#vip)|2|decoded-rows|
|[Item](#item)|2|decoded-rows|

## IntimacyTask

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|131|本表行键；与其他表同值不自动代表同一对象。|
|enum|number|131|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|index|number|131|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|jump|number|131|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|131|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|target_count|number|131|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_param|number|131|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ext_param|number|131|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|add_value|number|131|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|icon|string|131|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|131|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"enum":0,"type":1803,"target_count":1,"task_param":0,"add_value":100}`|
|200|`{"enum":1,"type":1202,"target_count":10,"task_param":0,"add_value":50}`|
|201|`{"enum":1,"type":1202,"target_count":20,"task_param":0,"add_value":150}`|
|202|`{"enum":1,"type":1202,"target_count":30,"task_param":0,"add_value":250}`|
|203|`{"enum":1,"type":1202,"target_count":40,"task_param":0,"add_value":350}`|
|204|`{"enum":1,"type":1202,"target_count":50,"task_param":0,"add_value":450}`|
|205|`{"enum":1,"type":1202,"target_count":60,"task_param":0,"add_value":600}`|
|206|`{"enum":1,"type":1202,"target_count":70,"task_param":0,"add_value":750}`|
|207|`{"enum":1,"type":1202,"target_count":80,"task_param":0,"add_value":1000}`|
|208|`{"enum":1,"type":1202,"target_count":90,"task_param":0,"add_value":1350}`|
|209|`{"enum":1,"type":1202,"target_count":100,"task_param":0,"add_value":1750}`|
|210|`{"enum":1,"type":1202,"target_count":110,"task_param":0,"add_value":2200}`|
|211|`{"enum":1,"type":1202,"target_count":120,"task_param":0,"add_value":2650}`|
|212|`{"enum":1,"type":1202,"target_count":130,"task_param":0,"add_value":2900}`|
|213|`{"enum":1,"type":1202,"target_count":140,"task_param":0,"add_value":3250}`|
|214|`{"enum":1,"type":1202,"target_count":150,"task_param":0,"add_value":3800}`|
|215|`{"enum":1,"type":1202,"target_count":160,"task_param":0,"add_value":4300}`|
|216|`{"enum":1,"type":1202,"target_count":170,"task_param":0,"add_value":4950}`|
|217|`{"enum":1,"type":1202,"target_count":180,"task_param":0,"add_value":5850}`|
|218|`{"enum":1,"type":1202,"target_count":190,"task_param":0,"add_value":6700}`|
|219|`{"enum":1,"type":1202,"target_count":200,"task_param":0,"add_value":7500}`|
|220|`{"enum":1,"type":1202,"target_count":210,"task_param":0,"add_value":8500}`|
|221|`{"enum":1,"type":1202,"target_count":220,"task_param":0,"add_value":9500}`|
|222|`{"enum":1,"type":1202,"target_count":230,"task_param":0,"add_value":10500}`|
|223|`{"enum":1,"type":1202,"target_count":240,"task_param":0,"add_value":11500}`|
|224|`{"enum":1,"type":1202,"target_count":250,"task_param":0,"add_value":12500}`|
|301|`{"enum":1,"type":9001,"target_count":5,"task_param":0,"add_value":250}`|
|302|`{"enum":1,"type":9001,"target_count":7,"task_param":0,"add_value":250}`|
|303|`{"enum":1,"type":9001,"target_count":9,"task_param":0,"add_value":350}`|
|304|`{"enum":1,"type":9001,"target_count":12,"task_param":0,"add_value":350}`|
|305|`{"enum":1,"type":9001,"target_count":15,"task_param":0,"add_value":450}`|
|306|`{"enum":1,"type":9001,"target_count":18,"task_param":0,"add_value":450}`|
|307|`{"enum":1,"type":9001,"target_count":23,"task_param":0,"add_value":600}`|
|308|`{"enum":1,"type":9001,"target_count":29,"task_param":0,"add_value":600}`|
|309|`{"enum":1,"type":9001,"target_count":35,"task_param":0,"add_value":750}`|
|310|`{"enum":1,"type":9001,"target_count":44,"task_param":0,"add_value":750}`|
|311|`{"enum":1,"type":9001,"target_count":53,"task_param":0,"add_value":1000}`|
|312|`{"enum":1,"type":9001,"target_count":65,"task_param":0,"add_value":1000}`|
|313|`{"enum":1,"type":9001,"target_count":80,"task_param":0,"add_value":1350}`|
|314|`{"enum":1,"type":9001,"target_count":100,"task_param":0,"add_value":1750}`|
|315|`{"enum":1,"type":9001,"target_count":120,"task_param":0,"add_value":1750}`|
|316|`{"enum":1,"type":9001,"target_count":140,"task_param":0,"add_value":2200}`|
|317|`{"enum":1,"type":9001,"target_count":150,"task_param":0,"add_value":2200}`|
|318|`{"enum":1,"type":9001,"target_count":160,"task_param":0,"add_value":2650}`|
|319|`{"enum":1,"type":9001,"target_count":170,"task_param":0,"add_value":2900}`|
|320|`{"enum":1,"type":9001,"target_count":180,"task_param":0,"add_value":3250}`|
|321|`{"enum":1,"type":9001,"target_count":190,"task_param":0,"add_value":3250}`|
|322|`{"enum":1,"type":9001,"target_count":200,"task_param":0,"add_value":3250}`|
|323|`{"enum":1,"type":9001,"target_count":210,"task_param":0,"add_value":3800}`|
|324|`{"enum":1,"type":9001,"target_count":220,"task_param":0,"add_value":3800}`|
|325|`{"enum":1,"type":9001,"target_count":230,"task_param":0,"add_value":4300}`|
|326|`{"enum":1,"type":9001,"target_count":240,"task_param":0,"add_value":4950}`|
|327|`{"enum":1,"type":9001,"target_count":250,"task_param":0,"add_value":4950}`|
|328|`{"enum":1,"type":9001,"target_count":260,"task_param":0,"add_value":5850}`|
|329|`{"enum":1,"type":9001,"target_count":270,"task_param":0,"add_value":5850}`|
|330|`{"enum":1,"type":9001,"target_count":280,"task_param":0,"add_value":6700}`|
|331|`{"enum":1,"type":9001,"target_count":290,"task_param":0,"add_value":7500}`|
|332|`{"enum":1,"type":9001,"target_count":300,"task_param":0,"add_value":8500}`|
|333|`{"enum":1,"type":9001,"target_count":310,"task_param":0,"add_value":9500}`|
|334|`{"enum":1,"type":9001,"target_count":320,"task_param":0,"add_value":10500}`|
|335|`{"enum":1,"type":9001,"target_count":330,"task_param":0,"add_value":11500}`|
|336|`{"enum":1,"type":9001,"target_count":360,"task_param":0,"add_value":12500}`|
|401|`{"enum":1,"type":1602,"target_count":60,"task_param":0,"add_value":50}`|
|402|`{"enum":1,"type":1602,"target_count":140,"task_param":0,"add_value":50}`|
|403|`{"enum":1,"type":1602,"target_count":200,"task_param":0,"add_value":150}`|
|404|`{"enum":1,"type":1602,"target_count":260,"task_param":0,"add_value":150}`|
|405|`{"enum":1,"type":1602,"target_count":330,"task_param":0,"add_value":250}`|
|406|`{"enum":1,"type":1602,"target_count":400,"task_param":0,"add_value":250}`|
|407|`{"enum":1,"type":1602,"target_count":450,"task_param":0,"add_value":350}`|
|408|`{"enum":1,"type":1602,"target_count":500,"task_param":0,"add_value":350}`|
|409|`{"enum":1,"type":1602,"target_count":560,"task_param":0,"add_value":450}`|
|410|`{"enum":1,"type":1602,"target_count":620,"task_param":0,"add_value":450}`|
|411|`{"enum":1,"type":1602,"target_count":280,"task_param":0,"add_value":450}`|
|412|`{"enum":1,"type":1602,"target_count":730,"task_param":0,"add_value":600}`|
|413|`{"enum":1,"type":1602,"target_count":790,"task_param":0,"add_value":600}`|
|414|`{"enum":1,"type":1602,"target_count":850,"task_param":0,"add_value":600}`|
|415|`{"enum":1,"type":1602,"target_count":900,"task_param":0,"add_value":750}`|
|416|`{"enum":1,"type":1602,"target_count":960,"task_param":0,"add_value":750}`|
|417|`{"enum":1,"type":1602,"target_count":1000,"task_param":0,"add_value":750}`|
|418|`{"enum":1,"type":1602,"target_count":1050,"task_param":0,"add_value":750}`|
|419|`{"enum":1,"type":1602,"target_count":1100,"task_param":0,"add_value":750}`|
|420|`{"enum":1,"type":1602,"target_count":1150,"task_param":0,"add_value":1000}`|
|421|`{"enum":1,"type":1602,"target_count":1200,"task_param":0,"add_value":1000}`|
|422|`{"enum":1,"type":1602,"target_count":1250,"task_param":0,"add_value":1000}`|
|423|`{"enum":1,"type":1602,"target_count":1300,"task_param":0,"add_value":1000}`|
|424|`{"enum":1,"type":1602,"target_count":1350,"task_param":0,"add_value":1000}`|
|425|`{"enum":1,"type":1602,"target_count":1400,"task_param":0,"add_value":1000}`|
|426|`{"enum":1,"type":1602,"target_count":1450,"task_param":0,"add_value":1000}`|
|427|`{"enum":1,"type":1602,"target_count":1500,"task_param":0,"add_value":1350}`|
|428|`{"enum":1,"type":1602,"target_count":1550,"task_param":0,"add_value":1350}`|
|429|`{"enum":1,"type":1602,"target_count":1600,"task_param":0,"add_value":1350}`|
|430|`{"enum":1,"type":1602,"target_count":1650,"task_param":0,"add_value":1350}`|
|431|`{"enum":1,"type":1602,"target_count":1700,"task_param":0,"add_value":1750}`|
|432|`{"enum":1,"type":1602,"target_count":1800,"task_param":0,"add_value":1750}`|
|433|`{"enum":1,"type":1602,"target_count":1900,"task_param":0,"add_value":2200}`|
|434|`{"enum":1,"type":1602,"target_count":2000,"task_param":0,"add_value":2650}`|
|435|`{"enum":1,"type":1602,"target_count":2200,"task_param":0,"add_value":3250}`|
|436|`{"enum":1,"type":1602,"target_count":2400,"task_param":0,"add_value":3250}`|
|437|`{"enum":1,"type":1602,"target_count":2600,"task_param":0,"add_value":3800}`|
|438|`{"enum":1,"type":1602,"target_count":2800,"task_param":0,"add_value":4300}`|
|439|`{"enum":1,"type":1602,"target_count":3000,"task_param":0,"add_value":4950}`|
|440|`{"enum":1,"type":1602,"target_count":3200,"task_param":0,"add_value":4950}`|
|441|`{"enum":1,"type":1602,"target_count":3400,"task_param":0,"add_value":5850}`|
|442|`{"enum":1,"type":1602,"target_count":3600,"task_param":0,"add_value":6700}`|
|443|`{"enum":1,"type":1602,"target_count":3800,"task_param":0,"add_value":6700}`|
|444|`{"enum":1,"type":1602,"target_count":4000,"task_param":0,"add_value":7500}`|
|445|`{"enum":1,"type":1602,"target_count":4200,"task_param":0,"add_value":7500}`|
|446|`{"enum":1,"type":1602,"target_count":4400,"task_param":0,"add_value":8500}`|
|447|`{"enum":1,"type":1602,"target_count":4600,"task_param":0,"add_value":8500}`|
|448|`{"enum":1,"type":1602,"target_count":4800,"task_param":0,"add_value":9500}`|
|449|`{"enum":1,"type":1602,"target_count":5000,"task_param":0,"add_value":9500}`|
|501|`{"enum":1,"type":8104,"target_count":4,"task_param":0,"add_value":50}`|
|502|`{"enum":1,"type":8104,"target_count":8,"task_param":0,"add_value":50}`|
|503|`{"enum":1,"type":8104,"target_count":12,"task_param":0,"add_value":150}`|
|504|`{"enum":1,"type":8104,"target_count":16,"task_param":0,"add_value":150}`|
|505|`{"enum":1,"type":8104,"target_count":20,"task_param":0,"add_value":250}`|
|506|`{"enum":1,"type":8104,"target_count":24,"task_param":0,"add_value":250}`|
|507|`{"enum":1,"type":8104,"target_count":28,"task_param":0,"add_value":350}`|
|508|`{"enum":1,"type":8104,"target_count":32,"task_param":0,"add_value":350}`|
|509|`{"enum":1,"type":8104,"target_count":36,"task_param":0,"add_value":450}`|
|510|`{"enum":1,"type":8104,"target_count":40,"task_param":0,"add_value":450}`|
|511|`{"enum":1,"type":8104,"target_count":44,"task_param":0,"add_value":450}`|
|512|`{"enum":1,"type":8104,"target_count":48,"task_param":0,"add_value":600}`|
|513|`{"enum":1,"type":8104,"target_count":52,"task_param":0,"add_value":600}`|
|514|`{"enum":1,"type":8104,"target_count":56,"task_param":0,"add_value":600}`|
|515|`{"enum":1,"type":8104,"target_count":60,"task_param":0,"add_value":750}`|
|516|`{"enum":1,"type":8104,"target_count":64,"task_param":0,"add_value":750}`|
|517|`{"enum":1,"type":8104,"target_count":68,"task_param":0,"add_value":750}`|
|518|`{"enum":1,"type":8104,"target_count":72,"task_param":0,"add_value":750}`|
|519|`{"enum":1,"type":8104,"target_count":76,"task_param":0,"add_value":750}`|
|520|`{"enum":1,"type":8104,"target_count":80,"task_param":0,"add_value":1000}`|

## Intimacy

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|20|本表行键；与其他表同值不自动代表同一对象。|
|level|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|exp_needed|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|unlock_crop|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"level":1,"exp_needed":0,"unlock_crop":1}`|
|2|`{"level":2,"exp_needed":100,"unlock_crop":1}`|
|3|`{"level":3,"exp_needed":2400,"unlock_crop":2}`|
|4|`{"level":4,"exp_needed":5000,"unlock_crop":2}`|
|5|`{"level":5,"exp_needed":7500,"unlock_crop":3}`|
|6|`{"level":6,"exp_needed":10000,"unlock_crop":3}`|
|7|`{"level":7,"exp_needed":12500,"unlock_crop":4}`|
|8|`{"level":8,"exp_needed":12500,"unlock_crop":4}`|
|9|`{"level":9,"exp_needed":12500,"unlock_crop":4}`|
|10|`{"level":10,"exp_needed":15000,"unlock_crop":5}`|
|11|`{"level":11,"exp_needed":15000,"unlock_crop":5}`|
|12|`{"level":12,"exp_needed":17500,"unlock_crop":5}`|
|13|`{"level":13,"exp_needed":20000,"unlock_crop":5}`|
|14|`{"level":14,"exp_needed":20000,"unlock_crop":5}`|
|15|`{"level":15,"exp_needed":22500,"unlock_crop":5}`|
|16|`{"level":16,"exp_needed":27500,"unlock_crop":5}`|
|17|`{"level":17,"exp_needed":35000,"unlock_crop":5}`|
|18|`{"level":18,"exp_needed":50000,"unlock_crop":5}`|
|19|`{"level":19,"exp_needed":50000,"unlock_crop":5}`|
|20|`{"level":20,"exp_needed":65000,"unlock_crop":5}`|

## LandType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|show_name|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_crop_name|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_icon|string|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|

## Land

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|16|本表行键；与其他表同值不自动代表同一对象。|
|type|number|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|intimacy_level|number|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|need_normal_bless|boolean|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|need_high_bless|boolean|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cost|number|16|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|cost_num|number|16|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|homeland_level|number|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|use_limit_time|number|16|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"type":1,"intimacy_level":1,"need_normal_bless":false,"need_high_bless":false,"cost":0,"cost_num":0,"homeland_level":0,"use_limit_time":0}`|
|2|`{"type":1,"intimacy_level":2,"need_normal_bless":false,"need_high_bless":false,"cost":0,"cost_num":0,"homeland_level":0,"use_limit_time":0}`|
|3|`{"type":1,"intimacy_level":2,"need_normal_bless":false,"need_high_bless":false,"cost":41002,"cost_num":5,"homeland_level":2,"use_limit_time":1785272400}`|
|4|`{"type":1,"intimacy_level":2,"need_normal_bless":true,"need_high_bless":false,"cost":0,"cost_num":0,"homeland_level":0,"use_limit_time":0}`|
|5|`{"type":1,"intimacy_level":3,"need_normal_bless":false,"need_high_bless":false,"cost":41002,"cost_num":10,"homeland_level":3,"use_limit_time":1785272400}`|
|6|`{"type":1,"intimacy_level":3,"need_normal_bless":false,"need_high_bless":false,"cost":41002,"cost_num":15,"homeland_level":3,"use_limit_time":1785272400}`|
|7|`{"type":1,"intimacy_level":3,"need_normal_bless":false,"need_high_bless":false,"cost":41002,"cost_num":20,"homeland_level":3,"use_limit_time":1785272400}`|
|8|`{"type":1,"intimacy_level":2,"need_normal_bless":true,"need_high_bless":false,"cost":0,"cost_num":0,"homeland_level":0,"use_limit_time":0}`|
|9|`{"type":1,"intimacy_level":4,"need_normal_bless":false,"need_high_bless":false,"cost":41002,"cost_num":25,"homeland_level":4,"use_limit_time":1785272400}`|
|10|`{"type":1,"intimacy_level":6,"need_normal_bless":false,"need_high_bless":false,"cost":41002,"cost_num":30,"homeland_level":6,"use_limit_time":1785272400}`|
|11|`{"type":1,"intimacy_level":10,"need_normal_bless":false,"need_high_bless":false,"cost":41002,"cost_num":40,"homeland_level":10,"use_limit_time":1785272400}`|
|12|`{"type":1,"intimacy_level":2,"need_normal_bless":true,"need_high_bless":false,"cost":0,"cost_num":0,"homeland_level":0,"use_limit_time":0}`|
|13|`{"type":2,"intimacy_level":1,"need_normal_bless":false,"need_high_bless":false,"cost":0,"cost_num":0,"homeland_level":0,"use_limit_time":0}`|
|14|`{"type":2,"intimacy_level":4,"need_normal_bless":false,"need_high_bless":false,"cost":41002,"cost_num":30,"homeland_level":4,"use_limit_time":1785272400}`|
|15|`{"type":2,"intimacy_level":10,"need_normal_bless":false,"need_high_bless":false,"cost":41002,"cost_num":50,"homeland_level":10,"use_limit_time":1785272400}`|
|16|`{"type":2,"intimacy_level":2,"need_normal_bless":false,"need_high_bless":true,"cost":0,"cost_num":0,"homeland_level":0,"use_limit_time":0}`|

## MergeNumAddW

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|rage|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|2|`{}`|
|3|`{}`|

## FruitMergeLib

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|name|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|weight|number|6|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|
|get|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"type":2,"weight":1}`|
|2|`{"type":2,"weight":4}`|
|3|`{"type":3,"weight":1}`|
|4|`{"type":3,"weight":6}`|
|5|`{"type":4,"weight":1}`|
|6|`{"type":4,"weight":9}`|

## FruitMerge

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|level|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rage|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lib|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|result|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"level":3,"lib":2}`|
|2|`{"level":4,"lib":3}`|
|3|`{"level":5,"lib":4}`|

## CropOutputLib

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|50|本表行键；与其他表同值不自动代表同一对象。|
|award|array|50|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|show_random_fruit|array|50|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"award":[[31002,6],[42002,120]],"show_random_fruit":[30014100]}`|
|102|`{"award":[[31002,12],[42002,240]],"show_random_fruit":[30014100]}`|
|103|`{"award":[[31002,18],[42002,360]],"show_random_fruit":[30014100]}`|
|104|`{"award":[[31002,24],[42002,480]],"show_random_fruit":[30014100]}`|
|105|`{"award":[[31002,36],[42002,600]],"show_random_fruit":[30014100]}`|
|201|`{"award":[[157002,3000],[42002,120]],"show_random_fruit":[30014100]}`|
|202|`{"award":[[157002,6000],[42002,240]],"show_random_fruit":[30014100]}`|
|203|`{"award":[[157002,9000],[42002,360]],"show_random_fruit":[30014100]}`|
|204|`{"award":[[157002,12000],[42002,480]],"show_random_fruit":[30014100]}`|
|205|`{"award":[[157002,18000],[42002,600]],"show_random_fruit":[30014100]}`|
|301|`{"award":[[139002,6],[42002,120]],"show_random_fruit":[30014100]}`|
|302|`{"award":[[139002,12],[42002,240]],"show_random_fruit":[30014100]}`|
|303|`{"award":[[139002,18],[42002,360]],"show_random_fruit":[30014100]}`|
|304|`{"award":[[139002,24],[42002,480]],"show_random_fruit":[30014100]}`|
|305|`{"award":[[139002,36],[42002,600]],"show_random_fruit":[30014100]}`|
|401|`{"award":[[17002,60],[42002,120]],"show_random_fruit":[30014100]}`|
|402|`{"award":[[17002,120],[42002,240]],"show_random_fruit":[30014100]}`|
|403|`{"award":[[17002,180],[42002,360]],"show_random_fruit":[30014100]}`|
|404|`{"award":[[17002,240],[42002,480]],"show_random_fruit":[30014100]}`|
|405|`{"award":[[17002,360],[42002,600]],"show_random_fruit":[30014100]}`|
|501|`{"award":[[18002,1],[42002,120]],"show_random_fruit":[30014100]}`|
|502|`{"award":[[18002,2],[42002,240]],"show_random_fruit":[30014100]}`|
|503|`{"award":[[18002,3],[42002,360]],"show_random_fruit":[30014100]}`|
|504|`{"award":[[18002,4],[42002,480]],"show_random_fruit":[30014100]}`|
|505|`{"award":[[18002,6],[42002,600]],"show_random_fruit":[30014100]}`|
|601|`{"award":[[179002,6],[42002,120]],"show_random_fruit":[30014100]}`|
|602|`{"award":[[179002,12],[42002,240]],"show_random_fruit":[30014100]}`|
|603|`{"award":[[179002,18],[42002,360]],"show_random_fruit":[30014100]}`|
|604|`{"award":[[179002,24],[42002,480]],"show_random_fruit":[30014100]}`|
|605|`{"award":[[179002,36],[42002,600]],"show_random_fruit":[30014100]}`|
|701|`{"award":[[21002,3],[42002,120]],"show_random_fruit":[30014100]}`|
|702|`{"award":[[21002,6],[42002,240]],"show_random_fruit":[30014100]}`|
|703|`{"award":[[21002,9],[42002,360]],"show_random_fruit":[30014100]}`|
|704|`{"award":[[21002,12],[42002,480]],"show_random_fruit":[30014100]}`|
|705|`{"award":[[21002,18],[42002,600]],"show_random_fruit":[30014100]}`|
|801|`{"award":[[391002,40],[42002,120]],"show_random_fruit":[30014100]}`|
|802|`{"award":[[391002,80],[42002,240]],"show_random_fruit":[30014100]}`|
|803|`{"award":[[391002,110],[42002,360]],"show_random_fruit":[30014100]}`|
|804|`{"award":[[391002,150],[42002,480]],"show_random_fruit":[30014100]}`|
|805|`{"award":[[391002,224],[42002,600]],"show_random_fruit":[30014100]}`|
|10000|`{"award":[[1140000,500],[10094100,1],[101800,3000]],"show_random_fruit":[30014100]}`|
|10001|`{"award":[[1140000,50000],[101500,100],[101800,300000]],"show_random_fruit":[30014100]}`|
|10002|`{"award":[[1140000,150000],[101500,400],[101800,1000000]],"show_random_fruit":[30014100]}`|
|10003|`{"award":[[1140000,450000],[101500,1600],[101800,3000000]],"show_random_fruit":[30014100]}`|
|10004|`{"award":[[1140000,1400000],[101500,6800],[101800,9000000]],"show_random_fruit":[30014100]}`|
|10005|`{"award":[[43002,20],[101500,150]],"show_random_fruit":[30014100]}`|
|10006|`{"award":[[43002,65],[101500,500]],"show_random_fruit":[30014100]}`|
|10007|`{"award":[[43002,225],[101500,1600]],"show_random_fruit":[30014100]}`|
|10008|`{"award":[[43002,800],[101500,5800]],"show_random_fruit":[30014100]}`|
|10009|`{"award":[[1140000,25000],[101500,50],[101800,150000]],"show_random_fruit":[30014100]}`|

## CropOutput

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|50|本表行键；与其他表同值不自动代表同一对象。|
|belong|number|50|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|level|number|50|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|intimacy_level|number|50|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|output_interval|number|50|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|total_duration|number|50|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|50|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|random_award|array|50|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|random_award_num|number|50|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"level":1,"intimacy_level":1,"output_interval":3600,"total_duration":28800,"award":[[101,1]],"random_award":[101,102,103,104,105,106,107],"random_award_num":1}`|
|102|`{"level":2,"intimacy_level":3,"output_interval":3600,"total_duration":28800,"award":[[102,1]],"random_award":[201,202,203,204,205,206,207],"random_award_num":1}`|
|103|`{"level":3,"intimacy_level":5,"output_interval":3600,"total_duration":28800,"award":[[103,1]],"random_award":[301,302,303,304,305,306,307],"random_award_num":1}`|
|104|`{"level":4,"intimacy_level":7,"output_interval":3600,"total_duration":43200,"award":[[104,1]],"random_award":[401,402,403,404,405,406,407],"random_award_num":1}`|
|105|`{"level":5,"intimacy_level":10,"output_interval":3600,"total_duration":57600,"award":[[105,1]],"random_award":[501,502,503,504,505,506,507],"random_award_num":1}`|
|201|`{"level":1,"intimacy_level":1,"output_interval":3600,"total_duration":28800,"award":[[201,1]],"random_award":[101,102,103,104,105,106,107],"random_award_num":1}`|
|202|`{"level":2,"intimacy_level":3,"output_interval":3600,"total_duration":28800,"award":[[202,1]],"random_award":[201,202,203,204,205,206,207],"random_award_num":1}`|
|203|`{"level":3,"intimacy_level":5,"output_interval":3600,"total_duration":28800,"award":[[203,1]],"random_award":[301,302,303,304,305,306,307],"random_award_num":1}`|
|204|`{"level":4,"intimacy_level":7,"output_interval":3600,"total_duration":43200,"award":[[204,1]],"random_award":[401,402,403,404,405,406,407],"random_award_num":1}`|
|205|`{"level":5,"intimacy_level":10,"output_interval":3600,"total_duration":57600,"award":[[205,1]],"random_award":[501,502,503,504,505,506,507],"random_award_num":1}`|
|301|`{"level":1,"intimacy_level":1,"output_interval":3600,"total_duration":28800,"award":[[301,1]],"random_award":[101,102,103,104,105,106,107],"random_award_num":1}`|
|302|`{"level":2,"intimacy_level":3,"output_interval":3600,"total_duration":28800,"award":[[302,1]],"random_award":[201,202,203,204,205,206,207],"random_award_num":1}`|
|303|`{"level":3,"intimacy_level":5,"output_interval":3600,"total_duration":28800,"award":[[303,1]],"random_award":[301,302,303,304,305,306,307],"random_award_num":1}`|
|304|`{"level":4,"intimacy_level":7,"output_interval":3600,"total_duration":43200,"award":[[304,1]],"random_award":[401,402,403,404,405,406,407],"random_award_num":1}`|
|305|`{"level":5,"intimacy_level":10,"output_interval":3600,"total_duration":57600,"award":[[305,1]],"random_award":[501,502,503,504,505,506,507],"random_award_num":1}`|
|401|`{"level":1,"intimacy_level":1,"output_interval":3600,"total_duration":28800,"award":[[401,1]],"random_award":[101,102,103,104,105,106,107],"random_award_num":1}`|
|402|`{"level":2,"intimacy_level":3,"output_interval":3600,"total_duration":28800,"award":[[402,1]],"random_award":[201,202,203,204,205,206,207],"random_award_num":1}`|
|403|`{"level":3,"intimacy_level":5,"output_interval":3600,"total_duration":28800,"award":[[403,1]],"random_award":[301,302,303,304,305,306,307],"random_award_num":1}`|
|404|`{"level":4,"intimacy_level":7,"output_interval":3600,"total_duration":43200,"award":[[404,1]],"random_award":[401,402,403,404,405,406,407],"random_award_num":1}`|
|405|`{"level":5,"intimacy_level":10,"output_interval":3600,"total_duration":57600,"award":[[405,1]],"random_award":[501,502,503,504,505,506,507],"random_award_num":1}`|
|501|`{"level":1,"intimacy_level":1,"output_interval":3600,"total_duration":28800,"award":[[501,1]],"random_award":[101,102,103,104,105,106,107],"random_award_num":1}`|
|502|`{"level":2,"intimacy_level":3,"output_interval":3600,"total_duration":28800,"award":[[502,1]],"random_award":[201,202,203,204,205,206,207],"random_award_num":1}`|
|503|`{"level":3,"intimacy_level":5,"output_interval":3600,"total_duration":28800,"award":[[503,1]],"random_award":[301,302,303,304,305,306,307],"random_award_num":1}`|
|504|`{"level":4,"intimacy_level":7,"output_interval":3600,"total_duration":43200,"award":[[504,1]],"random_award":[401,402,403,404,405,406,407],"random_award_num":1}`|
|505|`{"level":5,"intimacy_level":10,"output_interval":3600,"total_duration":57600,"award":[[505,1]],"random_award":[501,502,503,504,505,506,507],"random_award_num":1}`|
|601|`{"level":1,"intimacy_level":1,"output_interval":3600,"total_duration":28800,"award":[[601,1]],"random_award":[101,102,103,104,105,106,107],"random_award_num":1}`|
|602|`{"level":2,"intimacy_level":3,"output_interval":3600,"total_duration":28800,"award":[[602,1]],"random_award":[201,202,203,204,205,206,207],"random_award_num":1}`|
|603|`{"level":3,"intimacy_level":5,"output_interval":3600,"total_duration":28800,"award":[[603,1]],"random_award":[301,302,303,304,305,306,307],"random_award_num":1}`|
|604|`{"level":4,"intimacy_level":7,"output_interval":3600,"total_duration":43200,"award":[[604,1]],"random_award":[401,402,403,404,405,406,407],"random_award_num":1}`|
|605|`{"level":5,"intimacy_level":10,"output_interval":3600,"total_duration":57600,"award":[[605,1]],"random_award":[501,502,503,504,505,506,507],"random_award_num":1}`|
|701|`{"level":1,"intimacy_level":1,"output_interval":3600,"total_duration":28800,"award":[[701,1]],"random_award":[101,102,103,104,105,106,107],"random_award_num":1}`|
|702|`{"level":2,"intimacy_level":3,"output_interval":3600,"total_duration":28800,"award":[[702,1]],"random_award":[201,202,203,204,205,206,207],"random_award_num":1}`|
|703|`{"level":3,"intimacy_level":5,"output_interval":3600,"total_duration":28800,"award":[[703,1]],"random_award":[301,302,303,304,305,306,307],"random_award_num":1}`|
|704|`{"level":4,"intimacy_level":7,"output_interval":3600,"total_duration":43200,"award":[[704,1]],"random_award":[401,402,403,404,405,406,407],"random_award_num":1}`|
|705|`{"level":5,"intimacy_level":10,"output_interval":3600,"total_duration":57600,"award":[[705,1]],"random_award":[501,502,503,504,505,506,507],"random_award_num":1}`|
|801|`{"level":1,"intimacy_level":1,"output_interval":3600,"total_duration":28800,"award":[[801,1]],"random_award":[101,102,103,104,105,106,107],"random_award_num":1}`|
|802|`{"level":2,"intimacy_level":3,"output_interval":3600,"total_duration":28800,"award":[[802,1]],"random_award":[201,202,203,204,205,206,207],"random_award_num":1}`|
|803|`{"level":3,"intimacy_level":5,"output_interval":3600,"total_duration":28800,"award":[[803,1]],"random_award":[301,302,303,304,305,306,307],"random_award_num":1}`|
|804|`{"level":4,"intimacy_level":7,"output_interval":3600,"total_duration":43200,"award":[[804,1]],"random_award":[401,402,403,404,405,406,407],"random_award_num":1}`|
|805|`{"level":5,"intimacy_level":10,"output_interval":3600,"total_duration":57600,"award":[[805,1]],"random_award":[501,502,503,504,505,506,507],"random_award_num":1}`|
|10000|`{"level":0,"intimacy_level":0,"output_interval":10,"total_duration":10,"award":[[10000,1]],"random_award":[],"random_award_num":0}`|
|10001|`{"level":0,"intimacy_level":0,"output_interval":36000,"total_duration":36000,"award":[[10001,1]],"random_award":[601,602,603,604,605,606,607],"random_award_num":1}`|
|10002|`{"level":0,"intimacy_level":0,"output_interval":43200,"total_duration":43200,"award":[[10002,1]],"random_award":[701,702,703,704,705,706,707],"random_award_num":1}`|
|10003|`{"level":0,"intimacy_level":0,"output_interval":57600,"total_duration":57600,"award":[[10003,1]],"random_award":[801,802,803,804,805,806,807],"random_award_num":1}`|
|10004|`{"level":0,"intimacy_level":0,"output_interval":72000,"total_duration":72000,"award":[[10004,1]],"random_award":[901,902,903,904,905,906,907],"random_award_num":1}`|
|10005|`{"level":0,"intimacy_level":0,"output_interval":36000,"total_duration":36000,"award":[[10005,1]],"random_award":[601,602,603,604,605,606,607],"random_award_num":1}`|
|10006|`{"level":0,"intimacy_level":0,"output_interval":43200,"total_duration":43200,"award":[[10006,1]],"random_award":[701,702,703,704,705,706,707],"random_award_num":1}`|
|10007|`{"level":0,"intimacy_level":0,"output_interval":57600,"total_duration":57600,"award":[[10007,1]],"random_award":[801,802,803,804,805,806,807],"random_award_num":1}`|
|10008|`{"level":0,"intimacy_level":0,"output_interval":72000,"total_duration":72000,"award":[[10008,1]],"random_award":[901,902,903,904,905,906,907],"random_award_num":1}`|
|10009|`{"level":0,"intimacy_level":0,"output_interval":14400,"total_duration":14400,"award":[[10009,1]],"random_award":[501,502,503,504,505,506,507],"random_award_num":1}`|

## Crop

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|18|本表行键；与其他表同值不自动代表同一对象。|
|type|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|icon|string|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|iconCollect|string|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|land_icon|string|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|mature_land_icon|string|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|desc|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|consume|number|18|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|rage|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|func|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_hide|boolean|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sort|number|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"type":1,"consume":0,"func":1116,"is_hide":false}`|
|2|`{"type":1,"consume":0,"func":0,"is_hide":false}`|
|3|`{"type":1,"consume":0,"func":1151,"is_hide":false}`|
|4|`{"type":1,"consume":0,"func":1059,"is_hide":false}`|
|5|`{"type":1,"consume":0,"func":1061,"is_hide":false}`|
|6|`{"type":1,"consume":0,"func":1195,"is_hide":false}`|
|7|`{"type":1,"consume":0,"func":1054,"is_hide":false}`|
|8|`{"type":1,"consume":0,"func":1023,"is_hide":false}`|
|1000|`{"type":2,"consume":10004100,"func":0,"is_hide":true}`|
|1001|`{"type":2,"consume":10014100,"func":0,"is_hide":false}`|
|1002|`{"type":2,"consume":10024100,"func":0,"is_hide":false}`|
|1003|`{"type":2,"consume":10034100,"func":0,"is_hide":false}`|
|1004|`{"type":2,"consume":10044100,"func":0,"is_hide":false}`|
|1005|`{"type":2,"consume":10054100,"func":0,"is_hide":false}`|
|1006|`{"type":2,"consume":10064100,"func":0,"is_hide":false}`|
|1007|`{"type":2,"consume":10074100,"func":0,"is_hide":false}`|
|1008|`{"type":2,"consume":10084100,"func":0,"is_hide":false}`|
|1009|`{"type":2,"consume":10094100,"func":0,"is_hide":true}`|

## CropOutFruitLib

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|63|本表行键；与其他表同值不自动代表同一对象。|
|weight|number|63|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|
|type|number|63|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|num|number|63|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"weight":1,"type":20014100,"num":2}`|
|102|`{"weight":1,"type":20024100,"num":2}`|
|103|`{"weight":1,"type":20034100,"num":2}`|
|104|`{"weight":1,"type":20044100,"num":2}`|
|105|`{"weight":1,"type":20054100,"num":2}`|
|106|`{"weight":1,"type":20064100,"num":2}`|
|107|`{"weight":1,"type":20074100,"num":2}`|
|201|`{"weight":1,"type":20014100,"num":2}`|
|202|`{"weight":1,"type":20024100,"num":2}`|
|203|`{"weight":1,"type":20034100,"num":2}`|
|204|`{"weight":1,"type":20044100,"num":2}`|
|205|`{"weight":1,"type":20054100,"num":2}`|
|206|`{"weight":1,"type":20064100,"num":2}`|
|207|`{"weight":1,"type":20074100,"num":2}`|
|301|`{"weight":1,"type":20014100,"num":4}`|
|302|`{"weight":1,"type":20024100,"num":4}`|
|303|`{"weight":1,"type":20034100,"num":4}`|
|304|`{"weight":1,"type":20044100,"num":4}`|
|305|`{"weight":1,"type":20054100,"num":4}`|
|306|`{"weight":1,"type":20064100,"num":4}`|
|307|`{"weight":1,"type":20074100,"num":4}`|
|401|`{"weight":1,"type":20014100,"num":6}`|
|402|`{"weight":1,"type":20024100,"num":6}`|
|403|`{"weight":1,"type":20034100,"num":6}`|
|404|`{"weight":1,"type":20044100,"num":6}`|
|405|`{"weight":1,"type":20054100,"num":6}`|
|406|`{"weight":1,"type":20064100,"num":6}`|
|407|`{"weight":1,"type":20074100,"num":6}`|
|501|`{"weight":1,"type":20014100,"num":8}`|
|502|`{"weight":1,"type":20024100,"num":8}`|
|503|`{"weight":1,"type":20034100,"num":8}`|
|504|`{"weight":1,"type":20044100,"num":8}`|
|505|`{"weight":1,"type":20054100,"num":8}`|
|506|`{"weight":1,"type":20064100,"num":8}`|
|507|`{"weight":1,"type":20074100,"num":8}`|
|601|`{"weight":1,"type":20014100,"num":20}`|
|602|`{"weight":1,"type":20024100,"num":20}`|
|603|`{"weight":1,"type":20034100,"num":20}`|
|604|`{"weight":1,"type":20044100,"num":20}`|
|605|`{"weight":1,"type":20054100,"num":20}`|
|606|`{"weight":1,"type":20064100,"num":20}`|
|607|`{"weight":1,"type":20074100,"num":20}`|
|701|`{"weight":1,"type":20014100,"num":24}`|
|702|`{"weight":1,"type":20024100,"num":24}`|
|703|`{"weight":1,"type":20034100,"num":24}`|
|704|`{"weight":1,"type":20044100,"num":24}`|
|705|`{"weight":1,"type":20054100,"num":24}`|
|706|`{"weight":1,"type":20064100,"num":24}`|
|707|`{"weight":1,"type":20074100,"num":24}`|
|801|`{"weight":1,"type":20014100,"num":32}`|
|802|`{"weight":1,"type":20024100,"num":32}`|
|803|`{"weight":1,"type":20034100,"num":32}`|
|804|`{"weight":1,"type":20044100,"num":32}`|
|805|`{"weight":1,"type":20054100,"num":32}`|
|806|`{"weight":1,"type":20064100,"num":32}`|
|807|`{"weight":1,"type":20074100,"num":32}`|
|901|`{"weight":1,"type":20014100,"num":40}`|
|902|`{"weight":1,"type":20024100,"num":40}`|
|903|`{"weight":1,"type":20034100,"num":40}`|
|904|`{"weight":1,"type":20044100,"num":40}`|
|905|`{"weight":1,"type":20054100,"num":40}`|
|906|`{"weight":1,"type":20064100,"num":40}`|
|907|`{"weight":1,"type":20074100,"num":40}`|

## GuildBanquet_fruit

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|28|本表行键；与其他表同值不自动代表同一对象。|
|fruit_lib_type|number|28|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|weight|number|28|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|
|item|number|28|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|num|number|28|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|28|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"fruit_lib_type":1,"weight":1,"item":20014100,"num":80,"award":[[901900,10]]}`|
|102|`{"fruit_lib_type":1,"weight":1,"item":20024100,"num":80,"award":[[901900,10]]}`|
|103|`{"fruit_lib_type":1,"weight":1,"item":20034100,"num":80,"award":[[901900,10]]}`|
|104|`{"fruit_lib_type":1,"weight":1,"item":20044100,"num":80,"award":[[901900,10]]}`|
|105|`{"fruit_lib_type":1,"weight":1,"item":20054100,"num":80,"award":[[901900,10]]}`|
|106|`{"fruit_lib_type":1,"weight":1,"item":20064100,"num":80,"award":[[901900,10]]}`|
|107|`{"fruit_lib_type":1,"weight":1,"item":20074100,"num":80,"award":[[901900,10]]}`|
|201|`{"fruit_lib_type":2,"weight":1,"item":20014100,"num":130,"award":[[901900,10]]}`|
|202|`{"fruit_lib_type":2,"weight":1,"item":20024100,"num":130,"award":[[901900,10]]}`|
|203|`{"fruit_lib_type":2,"weight":1,"item":20034100,"num":130,"award":[[901900,10]]}`|
|204|`{"fruit_lib_type":2,"weight":1,"item":20044100,"num":130,"award":[[901900,10]]}`|
|205|`{"fruit_lib_type":2,"weight":1,"item":20054100,"num":130,"award":[[901900,10]]}`|
|206|`{"fruit_lib_type":2,"weight":1,"item":20064100,"num":130,"award":[[901900,10]]}`|
|207|`{"fruit_lib_type":2,"weight":1,"item":20074100,"num":130,"award":[[901900,10]]}`|
|301|`{"fruit_lib_type":3,"weight":1,"item":20014100,"num":450,"award":[[901900,10]]}`|
|302|`{"fruit_lib_type":3,"weight":1,"item":20024100,"num":450,"award":[[901900,10]]}`|
|303|`{"fruit_lib_type":3,"weight":1,"item":20034100,"num":450,"award":[[901900,10]]}`|
|304|`{"fruit_lib_type":3,"weight":1,"item":20044100,"num":450,"award":[[901900,10]]}`|
|305|`{"fruit_lib_type":3,"weight":1,"item":20054100,"num":450,"award":[[901900,10]]}`|
|306|`{"fruit_lib_type":3,"weight":1,"item":20064100,"num":450,"award":[[901900,10]]}`|
|307|`{"fruit_lib_type":3,"weight":1,"item":20074100,"num":450,"award":[[901900,10]]}`|
|401|`{"fruit_lib_type":4,"weight":1,"item":20014100,"num":700,"award":[[901900,10]]}`|
|402|`{"fruit_lib_type":4,"weight":1,"item":20024100,"num":700,"award":[[901900,10]]}`|
|403|`{"fruit_lib_type":4,"weight":1,"item":20034100,"num":700,"award":[[901900,10]]}`|
|404|`{"fruit_lib_type":4,"weight":1,"item":20044100,"num":700,"award":[[901900,10]]}`|
|405|`{"fruit_lib_type":4,"weight":1,"item":20054100,"num":700,"award":[[901900,10]]}`|
|406|`{"fruit_lib_type":4,"weight":1,"item":20064100,"num":700,"award":[[901900,10]]}`|
|407|`{"fruit_lib_type":4,"weight":1,"item":20074100,"num":700,"award":[[901900,10]]}`|

## GuildBanquet

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|open_day|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type_weight|array|6|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"open_day":2,"type_weight":[[1,50]]}`|
|2|`{"open_day":3,"type_weight":[[2,50]]}`|
|3|`{"open_day":4,"type_weight":[[1,50],[2,10]]}`|
|4|`{"open_day":8,"type_weight":[[1,50],[2,30]]}`|
|5|`{"open_day":15,"type_weight":[[2,50],[3,10]]}`|
|6|`{"open_day":29,"type_weight":[[2,50],[3,30],[4,10]]}`|

## GuildBanquetOrder

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|reward_type|number|4|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|fruit_lib_type|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|guild_max_donate_num|number|4|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"reward_type":1,"fruit_lib_type":1,"guild_max_donate_num":50}`|
|2|`{"reward_type":2,"fruit_lib_type":2,"guild_max_donate_num":80}`|
|3|`{"reward_type":3,"fruit_lib_type":3,"guild_max_donate_num":180}`|
|4|`{"reward_type":4,"fruit_lib_type":4,"guild_max_donate_num":240}`|

## GuildBanquetProReward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|12|本表行键；与其他表同值不自动代表同一对象。|
|type|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pro|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|12|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"type":1,"award":[[101500,50],[901900,20],[43002,5]]}`|
|102|`{"type":1,"award":[[101500,50],[901900,40],[43002,10]]}`|
|103|`{"type":1,"award":[[101500,100],[901900,60],[43002,20]]}`|
|201|`{"type":2,"award":[[101500,50],[901900,40],[43002,10]]}`|
|202|`{"type":2,"award":[[101500,100],[901900,60],[43002,20]]}`|
|203|`{"type":2,"award":[[101500,100],[901900,80],[43002,30]]}`|
|301|`{"type":3,"award":[[101500,50],[901900,60],[43002,20]]}`|
|302|`{"type":3,"award":[[101500,100],[901900,80],[43002,30]]}`|
|303|`{"type":3,"award":[[101500,200],[901900,100],[43002,40]]}`|
|401|`{"type":4,"award":[[101500,50],[901900,80],[43002,30]]}`|
|402|`{"type":4,"award":[[101500,200],[901900,100],[43002,40]]}`|
|403|`{"type":4,"award":[[101500,200],[901900,120],[43002,60]]}`|

## EntrustRefreshCost

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|7|本表行键；与其他表同值不自动代表同一对象。|
|cost_list|array|7|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"cost_list":[[101500,50]]}`|
|2|`{"cost_list":[[101500,50]]}`|
|3|`{"cost_list":[[101500,100]]}`|
|4|`{"cost_list":[[101500,100]]}`|
|5|`{"cost_list":[[101500,150]]}`|
|6|`{"cost_list":[[101500,150]]}`|
|7|`{"cost_list":[[101500,200]]}`|

## EntrustQuality

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|intimacy_level|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|complete_num|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_quality_list|array|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|desc|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|text|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10|`{"intimacy_level":1,"complete_num":0,"task_quality_list":[[10,4]]}`|
|30|`{"intimacy_level":2,"complete_num":5,"task_quality_list":[[10,3],[30,1]]}`|
|40|`{"intimacy_level":4,"complete_num":25,"task_quality_list":[[10,2],[30,1],[40,1]]}`|
|50|`{"intimacy_level":6,"complete_num":60,"task_quality_list":[[10,1],[30,1],[40,1],[50,1]]}`|
|60|`{"intimacy_level":10,"complete_num":190,"task_quality_list":[[30,1],[40,1],[50,1],[60,1]]}`|

## EntrustOrderLib

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|35|本表行键；与其他表同值不自动代表同一对象。|
|lib|number|35|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|weight|number|35|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|
|fruit|number|35|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fruit_num|number|35|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"lib":1,"weight":25,"fruit_num":15}`|
|102|`{"lib":1,"weight":25,"fruit_num":15}`|
|103|`{"lib":1,"weight":25,"fruit_num":15}`|
|104|`{"lib":1,"weight":25,"fruit_num":15}`|
|105|`{"lib":1,"weight":25,"fruit_num":15}`|
|106|`{"lib":1,"weight":25,"fruit_num":15}`|
|107|`{"lib":1,"weight":25,"fruit_num":15}`|
|201|`{"lib":2,"weight":25,"fruit_num":80}`|
|202|`{"lib":2,"weight":25,"fruit_num":80}`|
|203|`{"lib":2,"weight":25,"fruit_num":80}`|
|204|`{"lib":2,"weight":25,"fruit_num":80}`|
|205|`{"lib":2,"weight":25,"fruit_num":80}`|
|206|`{"lib":2,"weight":25,"fruit_num":80}`|
|207|`{"lib":2,"weight":25,"fruit_num":80}`|
|301|`{"lib":3,"weight":25,"fruit_num":160}`|
|302|`{"lib":3,"weight":25,"fruit_num":160}`|
|303|`{"lib":3,"weight":25,"fruit_num":160}`|
|304|`{"lib":3,"weight":25,"fruit_num":160}`|
|305|`{"lib":3,"weight":25,"fruit_num":160}`|
|306|`{"lib":3,"weight":25,"fruit_num":160}`|
|307|`{"lib":3,"weight":25,"fruit_num":160}`|
|401|`{"lib":4,"weight":25,"fruit_num":220}`|
|402|`{"lib":4,"weight":25,"fruit_num":220}`|
|403|`{"lib":4,"weight":25,"fruit_num":220}`|
|404|`{"lib":4,"weight":25,"fruit_num":220}`|
|405|`{"lib":4,"weight":25,"fruit_num":220}`|
|406|`{"lib":4,"weight":25,"fruit_num":220}`|
|407|`{"lib":4,"weight":25,"fruit_num":220}`|
|501|`{"lib":5,"weight":25,"fruit_num":280}`|
|502|`{"lib":5,"weight":25,"fruit_num":280}`|
|503|`{"lib":5,"weight":25,"fruit_num":280}`|
|504|`{"lib":5,"weight":25,"fruit_num":280}`|
|505|`{"lib":5,"weight":25,"fruit_num":280}`|
|506|`{"lib":5,"weight":25,"fruit_num":280}`|
|507|`{"lib":5,"weight":25,"fruit_num":280}`|

## EntrustOrder

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|50|本表行键；与其他表同值不自动代表同一对象。|
|quality|number|50|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lib|number|50|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|num|number|50|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|weight|number|50|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|
|award|array|50|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|assist_award|array|50|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"quality":10,"lib":1,"num":2,"weight":4,"award":[[2002,1],[42002,200],[101500,50]],"assist_award":[[42002,100],[901900,100]]}`|
|102|`{"quality":10,"lib":1,"num":2,"weight":1,"award":[[2002,2],[42002,220],[101500,50]],"assist_award":[[42002,100],[901900,100]]}`|
|103|`{"quality":10,"lib":1,"num":2,"weight":10,"award":[[201500,30000],[42002,240],[101500,50]],"assist_award":[[42002,100],[901900,100]]}`|
|104|`{"quality":10,"lib":1,"num":2,"weight":20,"award":[[201500,40000],[42002,260],[101500,50]],"assist_award":[[42002,100],[901900,100]]}`|
|105|`{"quality":10,"lib":1,"num":2,"weight":14,"award":[[201500,50000],[42002,280],[101500,50]],"assist_award":[[42002,100],[901900,100]]}`|
|106|`{"quality":10,"lib":1,"num":2,"weight":15,"award":[[391002,300],[42002,300],[101500,50]],"assist_award":[[42002,100],[901900,100]]}`|
|107|`{"quality":10,"lib":1,"num":2,"weight":13,"award":[[391002,400],[42002,320],[101500,50]],"assist_award":[[42002,100],[901900,100]]}`|
|108|`{"quality":10,"lib":1,"num":2,"weight":3,"award":[[391002,600],[42002,340],[101500,50]],"assist_award":[[42002,100],[901900,100]]}`|
|109|`{"quality":10,"lib":1,"num":2,"weight":4,"award":[[18002,10],[42002,360],[101500,50]],"assist_award":[[42002,100],[901900,100]]}`|
|110|`{"quality":10,"lib":1,"num":2,"weight":2,"award":[[18002,15],[42002,380],[101500,50]],"assist_award":[[42002,100],[901900,100]]}`|
|201|`{"quality":30,"lib":2,"num":2,"weight":7,"award":[[392002,7],[42002,420],[101500,80]],"assist_award":[[42002,200],[901900,200]]}`|
|202|`{"quality":30,"lib":2,"num":2,"weight":4,"award":[[392002,10],[42002,450],[101500,80]],"assist_award":[[42002,200],[901900,200]]}`|
|203|`{"quality":30,"lib":2,"num":2,"weight":3,"award":[[2002,2],[42002,480],[101500,80]],"assist_award":[[42002,200],[901900,200]]}`|
|204|`{"quality":30,"lib":2,"num":2,"weight":2,"award":[[3002,1],[42002,510],[101500,80]],"assist_award":[[42002,200],[901900,200]]}`|
|205|`{"quality":30,"lib":2,"num":2,"weight":10,"award":[[18002,8],[42002,540],[101500,80]],"assist_award":[[42002,200],[901900,200]]}`|
|206|`{"quality":30,"lib":2,"num":2,"weight":6,"award":[[18002,12],[42002,570],[101500,80]],"assist_award":[[42002,200],[901900,200]]}`|
|207|`{"quality":30,"lib":2,"num":2,"weight":5,"award":[[18002,15],[42002,600],[101500,80]],"assist_award":[[42002,200],[901900,200]]}`|
|208|`{"quality":30,"lib":2,"num":2,"weight":5,"award":[[391002,600],[42002,630],[101500,80]],"assist_award":[[42002,200],[901900,200]]}`|
|209|`{"quality":30,"lib":2,"num":2,"weight":3,"award":[[391002,800],[42002,660],[101500,80]],"assist_award":[[42002,200],[901900,200]]}`|
|210|`{"quality":30,"lib":2,"num":2,"weight":2,"award":[[10054100,1],[42002,690],[101500,80]],"assist_award":[[42002,200],[901900,200]]}`|
|301|`{"quality":40,"lib":3,"num":2,"weight":16,"award":[[392002,10],[42002,750],[101500,120]],"assist_award":[[42002,300],[901900,300]]}`|
|302|`{"quality":40,"lib":3,"num":2,"weight":18,"award":[[391002,600],[42002,790],[101500,120]],"assist_award":[[42002,300],[901900,300]]}`|
|303|`{"quality":40,"lib":3,"num":2,"weight":10,"award":[[391002,800],[42002,830],[101500,120]],"assist_award":[[42002,300],[901900,300]]}`|
|304|`{"quality":40,"lib":3,"num":2,"weight":14,"award":[[19002,1],[42002,870],[101500,120]],"assist_award":[[42002,300],[901900,300]]}`|
|305|`{"quality":40,"lib":3,"num":2,"weight":12,"award":[[414002,10],[42002,910],[101500,120]],"assist_award":[[42002,300],[901900,300]]}`|
|306|`{"quality":40,"lib":3,"num":2,"weight":1,"award":[[414002,12],[42002,950],[101500,120]],"assist_award":[[42002,300],[901900,300]]}`|
|307|`{"quality":40,"lib":3,"num":2,"weight":10,"award":[[493002,80],[42002,990],[101500,120]],"assist_award":[[42002,300],[901900,300]]}`|
|308|`{"quality":40,"lib":3,"num":2,"weight":15,"award":[[43002,30],[42002,1030],[101500,120]],"assist_award":[[42002,300],[901900,300]]}`|
|309|`{"quality":40,"lib":3,"num":2,"weight":8,"award":[[43002,40],[42002,1070],[101500,120]],"assist_award":[[42002,300],[901900,300]]}`|
|310|`{"quality":40,"lib":3,"num":2,"weight":2,"award":[[10054100,1],[42002,1110],[101500,120]],"assist_award":[[42002,300],[901900,300]]}`|
|401|`{"quality":50,"lib":4,"num":2,"weight":12,"award":[[3002,1],[42002,1200],[101500,160]],"assist_award":[[42002,400],[901900,400]]}`|
|402|`{"quality":50,"lib":4,"num":2,"weight":15,"award":[[43002,40],[42002,1250],[101500,160]],"assist_award":[[42002,400],[901900,400]]}`|
|403|`{"quality":50,"lib":4,"num":2,"weight":3,"award":[[43002,60],[42002,1300],[101500,160]],"assist_award":[[42002,400],[901900,400]]}`|
|404|`{"quality":50,"lib":4,"num":2,"weight":3,"award":[[392002,12],[42002,1350],[101500,160]],"assist_award":[[42002,400],[901900,400]]}`|
|405|`{"quality":50,"lib":4,"num":2,"weight":2,"award":[[391002,1200],[42002,1400],[101500,160]],"assist_award":[[42002,400],[901900,400]]}`|
|406|`{"quality":50,"lib":4,"num":2,"weight":8,"award":[[501002,400],[42002,1450],[101500,160]],"assist_award":[[42002,400],[901900,400]]}`|
|407|`{"quality":50,"lib":4,"num":2,"weight":8,"award":[[501002,600],[42002,1500],[101500,160]],"assist_award":[[42002,400],[901900,400]]}`|
|408|`{"quality":50,"lib":4,"num":2,"weight":12,"award":[[19002,1],[42002,1550],[101500,160]],"assist_award":[[42002,400],[901900,400]]}`|
|409|`{"quality":50,"lib":4,"num":2,"weight":3,"award":[[493002,120],[42002,1600],[101500,160]],"assist_award":[[42002,400],[901900,400]]}`|
|410|`{"quality":50,"lib":4,"num":2,"weight":1,"award":[[10054100,2],[42002,1650],[101500,160]],"assist_award":[[42002,400],[901900,400]]}`|
|501|`{"quality":60,"lib":5,"num":2,"weight":18,"award":[[392002,12],[42002,1800],[101500,200]],"assist_award":[[42002,600],[901900,600]]}`|
|502|`{"quality":60,"lib":5,"num":2,"weight":6,"award":[[392002,20],[42002,1880],[101500,200]],"assist_award":[[42002,600],[901900,600]]}`|
|503|`{"quality":60,"lib":5,"num":2,"weight":20,"award":[[502002,3],[42002,1960],[101500,200]],"assist_award":[[42002,600],[901900,600]]}`|
|504|`{"quality":60,"lib":5,"num":2,"weight":3,"award":[[502002,6],[42002,2040],[101500,200]],"assist_award":[[42002,600],[901900,600]]}`|
|505|`{"quality":60,"lib":5,"num":2,"weight":14,"award":[[808002,2],[42002,2120],[101500,200]],"assist_award":[[42002,600],[901900,600]]}`|
|506|`{"quality":60,"lib":5,"num":2,"weight":3,"award":[[808002,3],[42002,2200],[101500,200]],"assist_award":[[42002,600],[901900,600]]}`|
|507|`{"quality":60,"lib":5,"num":2,"weight":3,"award":[[807002,3],[42002,2280],[101500,200]],"assist_award":[[42002,600],[901900,600]]}`|
|508|`{"quality":60,"lib":5,"num":2,"weight":16,"award":[[494002,3],[42002,2360],[101500,200]],"assist_award":[[42002,600],[901900,600]]}`|
|509|`{"quality":60,"lib":5,"num":2,"weight":2,"award":[[494002,5],[42002,2440],[101500,200]],"assist_award":[[42002,600],[901900,600]]}`|
|510|`{"quality":60,"lib":5,"num":2,"weight":1,"award":[[10054100,3],[42002,2520],[101500,200]],"assist_award":[[42002,600],[901900,600]]}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|intimacy_tip|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|normal_bless_tip|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|high_bless_tip|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|guild_fruit_num|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|publish_entrust_times|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|assist_times|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|guild_donate_min_second|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|guild_donate_max_second|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|show_red_award_num|number|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|show_spirit|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"guild_fruit_num":7,"publish_entrust_times":1,"assist_times":2,"guild_donate_min_second":0,"guild_donate_max_second":57600,"show_red_award_num":4}`|

## Bubble

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|tips|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|

## ItemStageType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|show_name|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|

## ItemStage

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|17|本表行键；与其他表同值不自动代表同一对象。|
|stage|number|17|ActFrame阶段引用数组；不同于旧Activity.state。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10004100|`{"stage":2}`|
|10014100|`{"stage":2}`|
|10024100|`{"stage":3}`|
|10034100|`{"stage":4}`|
|10044100|`{"stage":5}`|
|10054100|`{"stage":2}`|
|10064100|`{"stage":3}`|
|10074100|`{"stage":4}`|
|10084100|`{"stage":5}`|
|10094100|`{"stage":2}`|
|20014100|`{"stage":2}`|
|20024100|`{"stage":2}`|
|20034100|`{"stage":2}`|
|20044100|`{"stage":2}`|
|20054100|`{"stage":2}`|
|20064100|`{"stage":2}`|
|20074100|`{"stage":2}`|

## Vip

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|base_recharge|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|base_add|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|add_base_land|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|del_high_land_time|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|add_shop_up_num|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|add_intimacy|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tips|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"base_recharge":630041,"base_add":30,"add_base_land":1000,"del_high_land_time":0,"add_shop_up_num":3}`|
|2|`{"base_recharge":630042,"base_add":30,"add_base_land":0,"del_high_land_time":2000,"add_shop_up_num":0}`|

## Item

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|speed_item|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|land|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|value|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|use_tip|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"speed_item":819002,"value":1,"use_tip":0}`|
|2|`{"speed_item":820002,"value":43200,"use_tip":681006}`|
