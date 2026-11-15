# ShopTable 规则参数

来源：[personal-server/assets/tables/ShopTable.data.lua.json.gz](../../../../personal-server/assets/tables/ShopTable.data.lua.json.gz)，SHA256：`745e5557ad81b5f65c5565a903f28de57c2fad2fafffb918c33b70b19074b6d0`。

[完整逐行JSON](ShopTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Item](#item)|1408|decoded-rows|
|[RefreshType](#refreshtype)|6|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[CellRefresh](#cellrefresh)|290|decoded-rows|
|[CellLib](#celllib)|406|decoded-rows|
|[Module](#module)|7|rows-with-external-references|
|[Period](#period)|28|rows-with-external-references|
|[SwitchRefresh](#switchrefresh)|1|rows-with-external-references|
|[ManualRefresh](#manualrefresh)|1|rows-with-external-references|
|[CellAutoRefresh](#cellautorefresh)|13|rows-with-external-references|
|[AutoRefresh](#autorefresh)|7|rows-with-external-references|
|[EndTime](#endtime)|1|rows-with-external-references|
|[Common](#common)|2|rows-with-external-references|
|[ItemQuickBuy](#itemquickbuy)|57|decoded-rows|
|[ManualRefreshSetting](#manualrefreshsetting)|1|rows-with-external-references|
|[Banner](#banner)|0|decoded-rows|
|[Group](#group)|6|decoded-rows|
|[MainCarousel](#maincarousel)|12|decoded-rows|
|[MainCarouselFunc](#maincarouselfunc)|22|rows-with-external-references|
|[Main](#main)|14|rows-with-external-references|
|[NpcBubble](#npcbubble)|10|decoded-rows|

## Item

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|notice_text|number|1408|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|notice_type|number|1408|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|count|number|1408|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|purchase_limit|number|1408|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|tid|number|1408|本表行键；与其他表同值不自动代表同一对象。|
|price|array|1408|原价格整数；RechargeTable现金商品消费者使用分，其他表必须核币种和单位。|
|high_quality|undefined|1408|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|currency_type|number|1408|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|buy_condition|undefined/number|1408|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sort_weight|number|1408|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|
|show_condition|undefined/number|1408|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|item|number|1408|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_show_effect|boolean|1408|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|original_cost|undefined|1408|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|is_rare_goods|boolean|1408|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|need_red|boolean|1408|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_hide|boolean/undefined|1408|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|weight|number|1408|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|
|buy_condition_tip|undefined/number|1408|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部1408行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1010101001|`{"notice_type":0,"count":1,"purchase_limit":1,"price":[[1,300]],"currency_type":3201900,"sort_weight":0,"item":100712,"is_show_effect":false,"is_rare_goods":true,"need_red":false,"is_hide":false,"weight":100}`|
|1010201001|`{"notice_type":0,"count":1,"purchase_limit":1,"price":[[1,300]],"currency_type":3201900,"sort_weight":0,"item":100712,"is_show_effect":false,"is_rare_goods":false,"need_red":false,"is_hide":false,"weight":100}`|
|1010301001|`{"notice_type":0,"count":1,"purchase_limit":1,"price":[[1,300]],"currency_type":3201900,"sort_weight":0,"item":100712,"is_show_effect":false,"is_rare_goods":false,"need_red":false,"is_hide":false,"weight":100}`|

## RefreshType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|refresh_show_txt|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|purchase_limit_txt|number|6|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|0|`{"refresh_show_txt":677622,"purchase_limit_txt":61781}`|
|1|`{"refresh_show_txt":60743,"purchase_limit_txt":61782}`|
|2|`{"refresh_show_txt":60744,"purchase_limit_txt":61783}`|
|3|`{"refresh_show_txt":667556,"purchase_limit_txt":61783}`|
|4|`{"refresh_show_txt":667556,"purchase_limit_txt":61784}`|
|5|`{"refresh_show_txt":667556,"purchase_limit_txt":667543}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|main_entry_buy_notice|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"main_entry_buy_notice":1}`|

## CellRefresh

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|show_condition|undefined/number|290|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_show_goods|boolean|290|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|refresh_type|number|290|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|not_open_show_tip_params|array|290|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|290|本表行键；与其他表同值不自动代表同一对象。|
|buy_tip_params|array|290|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|buy_condition|undefined/number|290|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|not_open_show_tip|number|290|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|buy_tip|number|290|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10411|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40201|`{"is_show_goods":false,"refresh_type":1,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40202|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40203|`{"show_condition":41612219002,"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40204|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40205|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40206|`{"show_condition":955132601064,"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40207|`{"is_show_goods":false,"refresh_type":1,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40208|`{"show_condition":955132601064,"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40209|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40210|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40211|`{"show_condition":955132601064,"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40212|`{"show_condition":41612219002,"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40213|`{"show_condition":941349100005,"is_show_goods":false,"refresh_type":1,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40214|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40215|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40216|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40217|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40218|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[200],"buy_condition":207573540218,"not_open_show_tip":0,"buy_tip":680403}`|
|40219|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[100],"buy_condition":207573540219,"not_open_show_tip":0,"buy_tip":680403}`|
|40220|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[50],"buy_condition":207573540220,"not_open_show_tip":0,"buy_tip":680403}`|
|40221|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[20],"buy_condition":207573540221,"not_open_show_tip":0,"buy_tip":680403}`|
|40222|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[10],"buy_condition":207573540222,"not_open_show_tip":0,"buy_tip":680403}`|
|40223|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[5],"buy_condition":207573540223,"not_open_show_tip":0,"buy_tip":680403}`|
|40224|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[3],"buy_condition":207573540224,"not_open_show_tip":0,"buy_tip":680403}`|
|40225|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[2],"buy_condition":207573540225,"not_open_show_tip":0,"buy_tip":680403}`|
|40226|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[1],"buy_condition":207573540226,"not_open_show_tip":0,"buy_tip":680403}`|
|40227|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[50],"buy_condition":207573540220,"not_open_show_tip":0,"buy_tip":680403}`|
|40228|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40301|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40302|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40303|`{"show_condition":941349100005,"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40304|`{"show_condition":230114840301,"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40305|`{"show_condition":230114840301,"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40306|`{"show_condition":955132601064,"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40307|`{"show_condition":955132601264,"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40308|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40309|`{"show_condition":955132601064,"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40310|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40311|`{"show_condition":230114840301,"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40312|`{"show_condition":941349100005,"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40313|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40314|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40315|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40316|`{"show_condition":941349100005,"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40317|`{"show_condition":230114840301,"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40318|`{"show_condition":908613500002,"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40319|`{"show_condition":8850230601,"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40401|`{"is_show_goods":false,"refresh_type":1,"not_open_show_tip_params":[1],"buy_tip_params":[1],"buy_condition":674084940401,"not_open_show_tip":667171,"buy_tip":2514}`|
|40402|`{"is_show_goods":false,"refresh_type":1,"not_open_show_tip_params":[1],"buy_tip_params":[1],"buy_condition":674084940401,"not_open_show_tip":667171,"buy_tip":2514}`|
|40403|`{"is_show_goods":false,"refresh_type":1,"not_open_show_tip_params":[1],"buy_tip_params":[1],"buy_condition":674084940401,"not_open_show_tip":667171,"buy_tip":2514}`|
|40404|`{"show_condition":674084940401,"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[2],"buy_tip_params":[2],"buy_condition":674084940404,"not_open_show_tip":667171,"buy_tip":2514}`|
|40405|`{"show_condition":674084940401,"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[2],"buy_tip_params":[2],"buy_condition":674084940404,"not_open_show_tip":667171,"buy_tip":2514}`|
|40406|`{"show_condition":674084940401,"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[2],"buy_tip_params":[2],"buy_condition":674084940404,"not_open_show_tip":667171,"buy_tip":2514}`|
|40407|`{"show_condition":674084940401,"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[3],"buy_tip_params":[3],"buy_condition":674084940407,"not_open_show_tip":667171,"buy_tip":2514}`|
|40408|`{"show_condition":674084940401,"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[4],"buy_tip_params":[4],"buy_condition":674084940408,"not_open_show_tip":667171,"buy_tip":2514}`|
|40409|`{"show_condition":674084940401,"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[6],"buy_tip_params":[6],"buy_condition":674084940409,"not_open_show_tip":667171,"buy_tip":2514}`|
|40410|`{"show_condition":674084940409,"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[7],"buy_tip_params":[7],"buy_condition":674084940410,"not_open_show_tip":667171,"buy_tip":2514}`|
|40411|`{"show_condition":876291440411,"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[10],"buy_tip_params":[10],"buy_condition":674084940411,"not_open_show_tip":667171,"buy_tip":2514}`|
|40412|`{"show_condition":674084940401,"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[7],"buy_tip_params":[7],"buy_condition":674084940410,"not_open_show_tip":667171,"buy_tip":2514}`|
|40413|`{"show_condition":674084940401,"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[7],"buy_tip_params":[7],"buy_condition":674084940410,"not_open_show_tip":667171,"buy_tip":2514}`|
|40414|`{"show_condition":674084940410,"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[7],"buy_tip_params":[8],"buy_condition":674084940411,"not_open_show_tip":667171,"buy_tip":2514}`|
|40415|`{"show_condition":674084940410,"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[7],"buy_tip_params":[8],"buy_condition":674084940411,"not_open_show_tip":667171,"buy_tip":2514}`|
|40416|`{"show_condition":674084940416,"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[9],"buy_tip_params":[9],"buy_condition":674084940416,"not_open_show_tip":667171,"buy_tip":2514}`|
|40601|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40602|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40603|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40604|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40605|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40606|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40607|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40608|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40609|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40610|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40701|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40702|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40703|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40704|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40705|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40706|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40707|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40708|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40709|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40710|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40711|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40712|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40713|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40714|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40715|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40716|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40717|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40718|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40719|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40720|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40721|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40722|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40723|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40724|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40725|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40726|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40727|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40728|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40729|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40730|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40731|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40732|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40733|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40734|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40735|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40736|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40737|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40738|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40739|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40740|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40741|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40742|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40743|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40744|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40745|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40746|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40747|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40748|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40749|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40750|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40751|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40752|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40753|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40754|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40755|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40756|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40757|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40758|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40759|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40760|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40801|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40802|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40803|`{"show_condition":941349100005,"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40804|`{"show_condition":908613500002,"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40805|`{"show_condition":955132601264,"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40806|`{"show_condition":955132601264,"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40807|`{"show_condition":955132601261,"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40808|`{"show_condition":941349100005,"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40809|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40810|`{"show_condition":955132601064,"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40811|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40812|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40813|`{"show_condition":941349100005,"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40814|`{"show_condition":908613500002,"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40815|`{"show_condition":563498640817,"is_show_goods":false,"refresh_type":1,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40816|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40817|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40818|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40819|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40901|`{"is_show_goods":false,"refresh_type":1,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40902|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40903|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40904|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40905|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40906|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40907|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40908|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40909|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40910|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40911|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40912|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40913|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40914|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40915|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40916|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40917|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40918|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40919|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40920|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40921|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40922|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40923|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40924|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40925|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40926|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40927|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40928|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40929|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40930|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40931|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40932|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40933|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40934|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40935|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40936|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40937|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40938|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40939|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40940|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40941|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40942|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|40943|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41001|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41002|`{"is_show_goods":false,"refresh_type":1,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41003|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41004|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[3],"buy_tip_params":[3],"buy_condition":948184941004,"not_open_show_tip":666237,"buy_tip":666238}`|
|41005|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[3],"buy_tip_params":[3],"buy_condition":948184941004,"not_open_show_tip":666237,"buy_tip":666238}`|
|41006|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[3],"buy_tip_params":[3],"buy_condition":948184941004,"not_open_show_tip":666237,"buy_tip":666238}`|
|41007|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[8],"buy_tip_params":[8],"buy_condition":948184941007,"not_open_show_tip":666237,"buy_tip":666238}`|
|41008|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[9],"buy_tip_params":[9],"buy_condition":948184941008,"not_open_show_tip":666237,"buy_tip":666238}`|
|41009|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[10],"buy_tip_params":[10],"buy_condition":948184941009,"not_open_show_tip":666237,"buy_tip":666238}`|
|41010|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[6],"buy_tip_params":[6],"buy_condition":948184941010,"not_open_show_tip":666237,"buy_tip":666238}`|
|41101|`{"show_condition":541625341101,"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41102|`{"show_condition":541625341101,"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41103|`{"show_condition":541625341101,"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41104|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41105|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41201|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41202|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41203|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41204|`{"is_show_goods":false,"refresh_type":4,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41205|`{"is_show_goods":false,"refresh_type":4,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41206|`{"is_show_goods":false,"refresh_type":4,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41207|`{"is_show_goods":false,"refresh_type":4,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41208|`{"is_show_goods":false,"refresh_type":4,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41209|`{"is_show_goods":false,"refresh_type":4,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41210|`{"is_show_goods":false,"refresh_type":4,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41211|`{"is_show_goods":false,"refresh_type":4,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41212|`{"is_show_goods":false,"refresh_type":4,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41213|`{"is_show_goods":false,"refresh_type":4,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41214|`{"is_show_goods":false,"refresh_type":4,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41215|`{"is_show_goods":false,"refresh_type":4,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41216|`{"is_show_goods":false,"refresh_type":4,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41217|`{"is_show_goods":false,"refresh_type":4,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41218|`{"is_show_goods":false,"refresh_type":4,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41219|`{"show_condition":983580210002,"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41220|`{"show_condition":8850230601,"is_show_goods":false,"refresh_type":4,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41221|`{"show_condition":8850230601,"is_show_goods":false,"refresh_type":4,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41222|`{"show_condition":8850230601,"is_show_goods":false,"refresh_type":4,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41223|`{"show_condition":8850230601,"is_show_goods":false,"refresh_type":4,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41224|`{"show_condition":563498633417,"is_show_goods":false,"refresh_type":4,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41225|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41226|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41227|`{"show_condition":8850230601,"is_show_goods":false,"refresh_type":4,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41228|`{"show_condition":563498633417,"is_show_goods":false,"refresh_type":4,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41229|`{"show_condition":563498633417,"is_show_goods":false,"refresh_type":4,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41230|`{"show_condition":563498633417,"is_show_goods":false,"refresh_type":4,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41301|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41302|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41303|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41304|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41305|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41306|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41307|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41308|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41309|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41310|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41311|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41312|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41313|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41314|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41315|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41316|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41317|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[88],"buy_condition":147296041317,"not_open_show_tip":0,"buy_tip":13227}`|
|41318|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41319|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41320|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41401|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41402|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41403|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41404|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41405|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41406|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41407|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41408|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41409|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41410|`{"is_show_goods":false,"refresh_type":0,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41411|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41501|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[45],"buy_condition":154269830517,"not_open_show_tip":0,"buy_tip":689055}`|
|41502|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[55],"buy_condition":154269830917,"not_open_show_tip":0,"buy_tip":689055}`|
|41503|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[68],"buy_condition":154269831317,"not_open_show_tip":0,"buy_tip":689055}`|
|41504|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[78],"buy_condition":457420741504,"not_open_show_tip":0,"buy_tip":689055}`|
|41505|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41506|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41507|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41508|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41509|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41510|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41511|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41512|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41513|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41514|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[],"not_open_show_tip":0,"buy_tip":0}`|
|41515|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[12],"buy_condition":983580210701,"not_open_show_tip":0,"buy_tip":689055}`|
|41516|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[12],"buy_condition":983580210701,"not_open_show_tip":0,"buy_tip":689055}`|
|41517|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[22],"buy_condition":908613500002,"not_open_show_tip":0,"buy_tip":689055}`|
|41518|`{"is_show_goods":false,"refresh_type":2,"not_open_show_tip_params":[],"buy_tip_params":[22],"buy_condition":908613500002,"not_open_show_tip":0,"buy_tip":689055}`|

## CellLib

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|pre_condition|undefined/number|406|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|406|本表行键；与其他表同值不自动代表同一对象。|
|shop_item_lib|number|406|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部406行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1010101|`{"shop_item_lib":1010101}`|
|1010201|`{"shop_item_lib":1010201}`|
|1010301|`{"shop_item_lib":1010301}`|

## Module

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|7|本表行键；与其他表同值不自动代表同一对象。|
|lua_module|object|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|
|6|`{}`|
|7|`{}`|

## Period

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|settle_client|undefined/object|28|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|buy_red_paths|array|28|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|open_form|undefined|28|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|28|本表行键；与其他表同值不自动代表同一对象。|
|version|number|28|版本引用；必须按活动类型及其消费者查对应版本表。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|501|`{"buy_red_paths":[],"version":1697529600}`|
|502|`{"buy_red_paths":[],"version":1700726400}`|
|503|`{"buy_red_paths":[],"version":1697529600}`|
|504|`{"buy_red_paths":[],"version":1697529600}`|
|505|`{"buy_red_paths":[10077],"version":1703577600}`|
|506|`{"buy_red_paths":[],"version":1697529600}`|
|507|`{"buy_red_paths":[],"version":1697529600}`|
|508|`{"buy_red_paths":[],"version":1697529600}`|
|509|`{"buy_red_paths":[739689],"version":1723773600}`|
|510|`{"buy_red_paths":[],"version":1723773600}`|
|511|`{"buy_red_paths":[],"version":1733882400}`|
|512|`{"buy_red_paths":[],"version":1733882400}`|
|513|`{"buy_red_paths":[],"version":1735610400}`|
|514|`{"buy_red_paths":[],"version":1735610400}`|
|515|`{"buy_red_paths":[],"version":1733882400}`|
|516|`{"buy_red_paths":[],"version":1733882400}`|
|517|`{"buy_red_paths":[],"version":1733882400}`|
|518|`{"buy_red_paths":[],"version":1733882400}`|
|519|`{"buy_red_paths":[],"version":1733882400}`|
|520|`{"buy_red_paths":[],"version":1733882400}`|
|523|`{"buy_red_paths":[],"version":1733882400}`|
|526|`{"buy_red_paths":[],"version":1733882400}`|
|529|`{"buy_red_paths":[],"version":1733882400}`|
|530|`{"buy_red_paths":[],"version":1753149600}`|
|531|`{"buy_red_paths":[],"version":1733882400}`|
|532|`{"buy_red_paths":[],"version":1733882400}`|
|533|`{"buy_red_paths":[],"version":1733882400}`|
|534|`{"buy_red_paths":[],"version":1733882400}`|

## SwitchRefresh

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|fun_open|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|buy_red_paths|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|open_form|object|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|version|number|1|版本引用；必须按活动类型及其消费者查对应版本表。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|601|`{"fun_open":1105,"buy_red_paths":[],"open_form":{"reference":"ShopRedCliffCrossForm.StaticOpen"},"version":1672905600}`|

## ManualRefresh

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|fun_open|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|buy_red_paths|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|open_form|object|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|version|number|1|版本引用；必须按活动类型及其消费者查对应版本表。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|301|`{"fun_open":1543,"buy_red_paths":[],"open_form":{"reference":"SpiritCourtyardShopForm.StaticOpen"},"version":1762117200}`|

## CellAutoRefresh

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|buy_red_paths|array|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fun_open|number|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|open_form|object|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|13|本表行键；与其他表同值不自动代表同一对象。|
|version|number|13|版本引用；必须按活动类型及其消费者查对应版本表。|
|discount_client|undefined/object|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|402|`{"buy_red_paths":[10378],"fun_open":1041,"open_form":{"reference":"ShopForm.StaticOpen"},"version":1673852400}`|
|403|`{"buy_red_paths":[10379],"fun_open":1041,"open_form":{"reference":"ShopForm.StaticOpen"},"version":1757919600}`|
|404|`{"buy_red_paths":[],"fun_open":1053,"open_form":{"reference":"ShopForm.StaticOpen"},"version":1670212800,"discount_client":{"reference":"GuildScienceMgr.GetShopDiscount"}}`|
|406|`{"buy_red_paths":[10375],"fun_open":1156,"open_form":{"reference":"ShopForm.StaticOpen"},"version":1670212800}`|
|407|`{"buy_red_paths":[10374],"fun_open":1168,"open_form":{"reference":"ShopForm.StaticOpen"},"version":1671415200}`|
|408|`{"buy_red_paths":[10371],"fun_open":1066,"open_form":{"reference":"ShopForm.StaticOpen"},"version":1673852400}`|
|409|`{"buy_red_paths":[],"fun_open":1195,"open_form":{"reference":"ShopForm.StaticOpen"},"version":1711436400}`|
|410|`{"buy_red_paths":[],"fun_open":1306,"open_form":{"reference":"ShopForm.StaticOpen"},"version":1774818000}`|
|411|`{"buy_red_paths":[10379],"fun_open":1263,"open_form":{"reference":"ShopForm.StaticOpen"},"version":1732777200}`|
|412|`{"buy_red_paths":[175257894095],"fun_open":1519,"open_form":{"reference":"ShopForm.StaticOpen"},"version":1774854000}`|
|413|`{"buy_red_paths":[176216860118],"fun_open":1544,"open_form":{"reference":"SpiritCourtyardShopForm.StaticOpen"},"version":1673852400}`|
|414|`{"buy_red_paths":[],"fun_open":1210,"open_form":{"reference":"ShopForm.StaticOpen"},"version":1775163600}`|
|415|`{"buy_red_paths":[],"fun_open":1625,"open_form":{"reference":"SpiritCourtyardShopForm.StaticOpen"},"version":1782766800}`|

## AutoRefresh

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rare_goods_red_path|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|buy_red_paths|array|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|refresh_type|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|purchase_limit|number|7|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|buy_history_turn|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|7|本表行键；与其他表同值不自动代表同一对象。|
|buy_reissue_red_path|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|open_form|object|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fun_open|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|buy_history_item|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|version|number|7|版本引用；必须按活动类型及其消费者查对应版本表。|
|open_check|undefined|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|buy_reissue_title|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|201|`{"buy_red_paths":[],"refresh_type":2,"purchase_limit":0,"buy_history_turn":0,"buy_reissue_red_path":0,"open_form":{"reference":"ShopForm.StaticOpen"},"fun_open":1049,"buy_history_item":0,"version":1659949200,"buy_reissue_title":0}`|
|202|`{"buy_red_paths":[],"refresh_type":2,"purchase_limit":0,"buy_history_turn":0,"buy_reissue_red_path":0,"open_form":{"reference":"ShopForm.StaticOpen"},"fun_open":1122,"buy_history_item":0,"version":1668675600,"buy_reissue_title":0}`|
|203|`{"buy_red_paths":[],"refresh_type":2,"purchase_limit":0,"buy_history_turn":0,"buy_reissue_red_path":0,"open_form":{"reference":"ShopForm.StaticOpen"},"fun_open":1174,"buy_history_item":0,"version":1668675600,"buy_reissue_title":0}`|
|204|`{"buy_red_paths":[],"refresh_type":2,"purchase_limit":20,"buy_history_turn":0,"buy_reissue_red_path":0,"open_form":{"reference":"AuctionUtils.OpenShopMysterious"},"fun_open":1197,"buy_history_item":0,"version":1673852400,"buy_reissue_title":0}`|
|205|`{"buy_red_paths":[],"refresh_type":1,"purchase_limit":0,"buy_history_turn":0,"buy_reissue_red_path":0,"open_form":{"reference":"PetPlayEveryDayShopForm.StaticOpen"},"fun_open":1210,"buy_history_item":0,"version":1673852400,"buy_reissue_title":0}`|
|206|`{"buy_red_paths":[],"refresh_type":2,"purchase_limit":0,"buy_history_turn":0,"buy_reissue_red_path":0,"open_form":{"reference":"AuctionUtils.OpenShopMysterious"},"fun_open":1018,"buy_history_item":0,"version":1673852400,"buy_reissue_title":0}`|
|207|`{"buy_red_paths":[421270],"refresh_type":1,"purchase_limit":0,"buy_history_turn":9,"buy_reissue_red_path":0,"open_form":{"reference":"AuctionUtils.OpenShopMysterious"},"fun_open":1227,"buy_history_item":2070101001,"version":1673852400,"buy_reissue_title":0}`|

## EndTime

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|version|number|1|版本引用；必须按活动类型及其消费者查对应版本表。|
|buy_red_paths|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|open_form|object|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|701|`{"version":1672905600,"buy_red_paths":[],"open_form":{"reference":"ShopForm.StaticOpen"}}`|

## Common

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|fun_open|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|buy_red_paths|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|open_form|object|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|version|number|2|版本引用；必须按活动类型及其消费者查对应版本表。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"fun_open":1026,"buy_red_paths":[],"open_form":{"reference":"ShopSkinForm.StaticOpen"},"version":1672905600}`|
|104|`{"fun_open":1581,"buy_red_paths":[],"open_form":{"reference":"ShopForm.StaticOpen"},"version":1774818000}`|

## ItemQuickBuy

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|57|本表行键；与其他表同值不自动代表同一对象。|
|day_buy_limit|number|57|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|price|array|57|原价格整数；RechargeTable现金商品消费者使用分，其他表必须核币种和单位。|
|currency_type|number|57|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|4002|`{"day_buy_limit":60,"price":[800],"currency_type":101500}`|
|19002|`{"day_buy_limit":15,"price":[30,30,30,50,50,80,80,100,100,100,100,100,100,100,100],"currency_type":101500}`|
|20002|`{"day_buy_limit":15,"price":[50],"currency_type":101500}`|
|122702|`{"day_buy_limit":6,"price":[0,30,50,80,100,150],"currency_type":101500}`|
|397002|`{"day_buy_limit":10,"price":[300],"currency_type":101500}`|
|398002|`{"day_buy_limit":20,"price":[350],"currency_type":401500}`|
|403002|`{"day_buy_limit":3,"price":[100,100,100],"currency_type":101500}`|
|404002|`{"day_buy_limit":5,"price":[100,100,100,100,100],"currency_type":101500}`|
|405002|`{"day_buy_limit":2,"price":[100,100],"currency_type":101500}`|
|406002|`{"day_buy_limit":4,"price":[100,100,100,100],"currency_type":101500}`|
|432002|`{"day_buy_limit":3,"price":[200,200,200],"currency_type":101500}`|
|503002|`{"day_buy_limit":80,"price":[200],"currency_type":401500}`|
|503600|`{"day_buy_limit":100,"price":[6],"currency_type":101500}`|
|504002|`{"day_buy_limit":80,"price":[200],"currency_type":401500}`|
|603600|`{"day_buy_limit":100,"price":[6],"currency_type":101500}`|
|703600|`{"day_buy_limit":100,"price":[6],"currency_type":101500}`|
|803600|`{"day_buy_limit":100,"price":[6],"currency_type":101500}`|
|903600|`{"day_buy_limit":100,"price":[33],"currency_type":101500}`|
|1003600|`{"day_buy_limit":100,"price":[33],"currency_type":101500}`|
|1103600|`{"day_buy_limit":100,"price":[33],"currency_type":101500}`|
|1203600|`{"day_buy_limit":100,"price":[33],"currency_type":101500}`|
|1302000|`{"day_buy_limit":5,"price":[60,60,60,60,60],"currency_type":101500}`|
|1303600|`{"day_buy_limit":5,"price":[400],"currency_type":101500}`|
|1403600|`{"day_buy_limit":5,"price":[400],"currency_type":101500}`|
|1503600|`{"day_buy_limit":5,"price":[400],"currency_type":101500}`|
|1603600|`{"day_buy_limit":5,"price":[400],"currency_type":101500}`|
|1703600|`{"day_buy_limit":1,"price":[1600],"currency_type":101500}`|
|1803600|`{"day_buy_limit":1,"price":[1600],"currency_type":101500}`|
|1903600|`{"day_buy_limit":1,"price":[1600],"currency_type":101500}`|
|2003600|`{"day_buy_limit":1,"price":[1600],"currency_type":101500}`|
|2303600|`{"day_buy_limit":5,"price":[400],"currency_type":101500}`|
|2331200|`{"day_buy_limit":100,"price":[1],"currency_type":101500}`|
|2341200|`{"day_buy_limit":100,"price":[1],"currency_type":101500}`|
|2351200|`{"day_buy_limit":100,"price":[1],"currency_type":101500}`|
|2361200|`{"day_buy_limit":100,"price":[1],"currency_type":101500}`|
|2401200|`{"day_buy_limit":100,"price":[10],"currency_type":101500}`|
|2403600|`{"day_buy_limit":5,"price":[800],"currency_type":101500}`|
|2411200|`{"day_buy_limit":100,"price":[10],"currency_type":101500}`|
|2421200|`{"day_buy_limit":100,"price":[10],"currency_type":101500}`|
|2431200|`{"day_buy_limit":100,"price":[10],"currency_type":101500}`|
|2441200|`{"day_buy_limit":10,"price":[100],"currency_type":101500}`|
|2451200|`{"day_buy_limit":10,"price":[100],"currency_type":101500}`|
|2461200|`{"day_buy_limit":10,"price":[100],"currency_type":101500}`|
|2471200|`{"day_buy_limit":10,"price":[100],"currency_type":101500}`|
|2481200|`{"day_buy_limit":10,"price":[1000],"currency_type":101500}`|
|2491200|`{"day_buy_limit":10,"price":[1000],"currency_type":101500}`|
|2501200|`{"day_buy_limit":10,"price":[1000],"currency_type":101500}`|
|2503600|`{"day_buy_limit":100,"price":[200],"currency_type":101500}`|
|2511200|`{"day_buy_limit":10,"price":[1000],"currency_type":101500}`|
|2603600|`{"day_buy_limit":100,"price":[400],"currency_type":101500}`|
|2703600|`{"day_buy_limit":100,"price":[600],"currency_type":101500}`|
|2803600|`{"day_buy_limit":100,"price":[2400],"currency_type":101500}`|
|2903600|`{"day_buy_limit":100,"price":[500],"currency_type":101500}`|
|3003600|`{"day_buy_limit":3,"price":[1000],"currency_type":101500}`|
|3103600|`{"day_buy_limit":3,"price":[1000],"currency_type":101500}`|
|3203600|`{"day_buy_limit":3,"price":[2000],"currency_type":101500}`|
|8901900|`{"day_buy_limit":0,"price":[200],"currency_type":101500}`|

## ManualRefreshSetting

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|refresh_spec_items|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|refresh_currency|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|add_refresh_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|free_red|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_free_refresh_count|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|privilege_client|object|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_pay_count|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|refresh_pay_count|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|auto_refresh_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|free_refresh_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|301|`{"refresh_spec_items":[],"refresh_currency":101500,"add_refresh_count":1,"free_red":0,"max_free_refresh_count":1,"max_pay_count":5,"refresh_pay_count":[100,200,300,500,500],"auto_refresh_time":28800,"free_refresh_time":86400}`|

## Banner

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## Group

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|light_img|string|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|tips_bottom|string|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bg_img|string|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_role|string|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|title|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|normal_img|string|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_alone|boolean|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{}`|
|102|`{}`|
|103|`{}`|
|104|`{}`|
|105|`{}`|
|106|`{}`|

## MainCarousel

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|12|本表行键；与其他表同值不自动代表同一对象。|
|carousel|array|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|carousel_txt|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|3|`{"carousel":[1,2,3,4],"carousel_txt":667728}`|
|4|`{"carousel":[2,7,8],"carousel_txt":667733}`|
|5|`{"carousel":[13,14],"carousel_txt":667743}`|
|8|`{"carousel":[16,17],"carousel_txt":667748}`|
|10|`{"carousel":[11,12],"carousel_txt":667738}`|
|12|`{"carousel":[18],"carousel_txt":667751}`|
|14|`{"carousel":[19],"carousel_txt":666178}`|
|15|`{"carousel":[20],"carousel_txt":667786}`|
|16|`{"carousel":[21],"carousel_txt":670041}`|
|17|`{"carousel":[22],"carousel_txt":680659}`|
|18|`{"carousel":[],"carousel_txt":680868}`|
|19|`{"carousel":[],"carousel_txt":680869}`|

## MainCarouselFunc

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|22|本表行键；与其他表同值不自动代表同一对象。|
|check_func|object/undefined|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|carousel_txt|number|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|check_param|number|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skip|number|22|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|func_open|number|22|完整功能开放ID；条件见功能开放附录，不能直接当等级。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"check_func":{"reference":"SwapArenaMgr.CanChallenge"},"carousel_txt":667729,"func_open":1040}`|
|2|`{"check_func":{"reference":"ArenaContestMgr.CheckAwardCanGetJump"},"carousel_txt":667727,"func_open":1064}`|
|3|`{"check_func":{"reference":"HunterArenaDataMgr.CheckFightCountIsCanJump"},"carousel_txt":667731,"func_open":1066}`|
|4|`{"check_func":{"reference":"TournamentMgr.CheckFightCountIsCanJump"},"carousel_txt":667732,"func_open":1159}`|
|5|`{"check_func":{"reference":"SwapArenaMgr.CanChallenge"},"carousel_txt":667734,"func_open":1040}`|
|6|`{"check_func":{"reference":"ArenaContestMgr.CheckAwardCanGetJump"},"carousel_txt":667735,"func_open":1064}`|
|7|`{"check_func":{"reference":"HunterArenaDataMgr.CheckWinCountIsCanJump"},"carousel_txt":667736,"func_open":1066}`|
|8|`{"check_func":{"reference":"TournamentMgr.CheckWinCountIsCanJump"},"carousel_txt":667737,"func_open":1159}`|
|9|`{"check_func":{"reference":"SwapArenaMgr.CanChallenge"},"carousel_txt":667739,"func_open":1040}`|
|10|`{"check_func":{"reference":"ArenaContestMgr.CheckAwardCanGetJump"},"carousel_txt":667740,"func_open":1064}`|
|11|`{"check_func":{"reference":"HunterArenaDataMgr.CheckFightCountIsCanJump"},"carousel_txt":667741,"func_open":1066}`|
|12|`{"check_func":{"reference":"TournamentMgr.CheckFightCountIsCanJump"},"carousel_txt":667742,"func_open":1159}`|
|13|`{"check_func":{"reference":"GuildActiveMgr.CheckAllTaskNotFinish"},"carousel_txt":667744,"func_open":1053}`|
|14|`{"check_func":{"reference":"GuildJointMissionUtil.CheckIsCanJumpGuildJoint"},"carousel_txt":667745,"func_open":2003}`|
|15|`{"check_func":{"reference":"FameHallMgr.CheckSweepIsCanJump"},"carousel_txt":667747,"func_open":1105}`|
|16|`{"check_func":{"reference":"SoulTrialMgr.CheckHaveTrialLeftTimes"},"carousel_txt":667749,"func_open":1133}`|
|17|`{"check_func":{"reference":"HeroBlazonDrawMgr.IsHaveAnyDrawItem"},"carousel_txt":667750,"func_open":1168}`|
|18|`{"check_func":{"reference":"PetPlayMgr.IsCanUnlockRoad"},"carousel_txt":667752,"func_open":1210}`|
|19|`{"carousel_txt":666179,"func_open":1306}`|
|20|`{"carousel_txt":667787,"func_open":1263}`|
|21|`{"check_func":{"reference":"StockUpActMgr.IsValid"},"carousel_txt":670041,"func_open":1348}`|
|22|`{"carousel_txt":680659,"func_open":1538}`|

## Main

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|show_check|undefined/object|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tag_red|number|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|item_show|number|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|14|本表行键；与其他表同值不自动代表同一对象。|
|group|number|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|extraInfo|string|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|shop_id|number|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|text|number|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|get_extra_func|undefined/object|14|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|3|`{"item_show":2001900,"group":101}`|
|4|`{"item_show":101900,"group":101}`|
|5|`{"item_show":901900,"group":102}`|
|8|`{"item_show":2201900,"group":103}`|
|9|`{"item_show":101500,"group":103}`|
|10|`{"item_show":801900,"group":101}`|
|12|`{"item_show":5301900,"group":103}`|
|13|`{"item_show":101500,"group":0}`|
|14|`{"item_show":6201900,"group":103}`|
|15|`{"item_show":6501900,"group":103}`|
|16|`{"item_show":7001900,"group":104,"get_extra_func":{"reference":"StockUpActMgr.GetVersion"}}`|
|17|`{"item_show":6811900,"group":103,"get_extra_func":{"reference":"DestinyPveActMgr.GetVersion"}}`|
|18|`{"item_show":6811900,"group":105}`|
|19|`{"item_show":6811900,"group":106}`|

## NpcBubble

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|10|本表行键；与其他表同值不自动代表同一对象。|
|bubble_des|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|
|6|`{}`|
|7|`{}`|
|8|`{}`|
|9|`{}`|
|10|`{}`|
