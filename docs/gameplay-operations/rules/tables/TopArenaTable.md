# TopArenaTable 规则参数

来源：[personal-server/assets/tables/TopArenaTable.data.lua.json.gz](../../../../personal-server/assets/tables/TopArenaTable.data.lua.json.gz)，SHA256：`42e9f486731630fe34df374cd95521cabddc99007beb9d266a349902b8593c4a`。

[完整逐行JSON](TopArenaTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[PublicityConst](#publicityconst)|1|decoded-rows|
|[HelpConst](#helpconst)|1|decoded-rows|
|[HelpAward](#helpaward)|5|decoded-rows|
|[HelpStage](#helpstage)|3|decoded-rows|
|[Help](#help)|3|decoded-rows|
|[ServerPreviewAward](#serverpreviewaward)|10|decoded-rows|
|[JoinPreviewAward](#joinpreviewaward)|10|decoded-rows|
|[QuizPreviewAward](#quizpreviewaward)|10|decoded-rows|
|[TowerPreviewRewards](#towerpreviewrewards)|10|decoded-rows|
|[RankReward](#rankreward)|100|decoded-rows|
|[RankType](#ranktype)|10|decoded-rows|
|[RankServerAward](#rankserveraward)|42|decoded-rows|
|[RankServerMaxAward](#rankservermaxaward)|30|decoded-rows|
|[RuleConst](#ruleconst)|1|decoded-rows|
|[Rule](#rule)|4|decoded-rows|
|[Scatter](#scatter)|90|decoded-rows|
|[AreaCustom](#areacustom)|90|decoded-rows|
|[Area](#area)|9|decoded-rows|
|[FinalShow](#finalshow)|9|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[CrossRank](#crossrank)|4|decoded-rows|
|[Ring](#ring)|410|decoded-rows|
|[Act](#act)|10|decoded-rows|
|[Time](#time)|10|decoded-rows|
|[Stage](#stage)|3|decoded-rows|
|[CardShow](#cardshow)|8|decoded-rows|
|[Directions](#directions)|1|decoded-rows|
|[StagePop](#stagepop)|30|decoded-rows|
|[GuessAward](#guessaward)|6|decoded-rows|
|[GuessType](#guesstype)|2|decoded-rows|
|[NoticeHot](#noticehot)|3|decoded-rows|

## PublicityConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|role_like_cout|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|team_like_cout|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|role_like_award_list|array|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|team_like_award_list|array|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"role_like_award_list":[[201500,5000]],"team_like_award_list":[[201500,20000]]}`|

## HelpConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|progress_total|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|help_tid|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|exchange_item|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|exchange_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|help_max|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|help_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|1|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|base_attr_list|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"progress_total":100000,"exchange_item":[[1011000,100]],"exchange_count":150,"award":[[6701900,100],[101500,50]],"base_attr_list":[[202,36000],[209,30000],[43,200]]}`|

## HelpAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|help_count|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|5|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award":[[6701900,100]]}`|
|2|`{"award":[[6701900,100]]}`|
|3|`{"award":[[6701900,200]]}`|
|4|`{"award":[[6701900,200]]}`|
|5|`{"award":[[6701900,300]]}`|

## HelpStage

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|progress_count|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"progress_count":20000}`|
|2|`{"progress_count":50000}`|
|3|`{"progress_count":100000}`|

## Help

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|help_count|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr_list|array|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"attr_list":[[13,500],[23,500]]}`|
|2|`{"attr_list":[[13,1000],[23,1000]]}`|
|3|`{"attr_list":[[13,1500],[23,1500]]}`|

## ServerPreviewAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|10|本表行键；与其他表同值不自动代表同一对象。|
|res_list|array|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

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

## JoinPreviewAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|10|本表行键；与其他表同值不自动代表同一对象。|
|res_list|array|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

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

## QuizPreviewAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|10|本表行键；与其他表同值不自动代表同一对象。|
|res_list|array|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_list|array|10|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award_list":[[390002,1],[24002,1]]}`|
|2|`{"award_list":[[390002,1],[24002,1]]}`|
|3|`{"award_list":[[390002,1],[24002,1]]}`|
|4|`{"award_list":[[390002,1],[24002,1]]}`|
|5|`{"award_list":[[390002,1],[24002,1]]}`|
|6|`{"award_list":[[390002,1],[24002,1]]}`|
|7|`{"award_list":[[390002,1],[24002,1]]}`|
|8|`{"award_list":[[390002,1],[24002,1]]}`|
|9|`{"award_list":[[390002,1],[24002,1]]}`|
|10|`{"award_list":[[390002,1],[24002,1]]}`|

## TowerPreviewRewards

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|10|本表行键；与其他表同值不自动代表同一对象。|
|award_list|array|10|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award_list":[[140317,1],[390002,1],[24002,1],[2271200,1],[6701900,1],[101500,1]]}`|
|2|`{"award_list":[[140317,1],[390002,1],[24002,1],[2271200,1],[6701900,1],[101500,1]]}`|
|3|`{"award_list":[[140317,1],[390002,1],[24002,1],[2271200,1],[6701900,1],[101500,1]]}`|
|4|`{"award_list":[[140317,1],[390002,1],[24002,1],[2271200,1],[6701900,1],[101500,1]]}`|
|5|`{"award_list":[[140317,1],[390002,1],[24002,1],[2271200,1],[6701900,1],[101500,1],[830802,1]]}`|
|6|`{"award_list":[[140317,1],[390002,1],[24002,1],[2271200,1],[6701900,1],[101500,1],[830802,1]]}`|
|7|`{"award_list":[[140317,1],[390002,1],[24002,1],[2271200,1],[6701900,1],[101500,1],[830802,1]]}`|
|8|`{"award_list":[[140317,1],[390002,1],[24002,1],[2271200,1],[6701900,1],[101500,1],[830802,1]]}`|
|9|`{"award_list":[[140317,1],[390002,1],[24002,1],[2271200,1],[6701900,1],[101500,1],[830802,1]]}`|
|10|`{"award_list":[[140317,1],[390002,1],[24002,1],[2271200,1],[6701900,1],[101500,1],[830802,1]]}`|

## RankReward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|100|本表行键；与其他表同值不自动代表同一对象。|
|type|number|100|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rank_range|array|100|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|100|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|2421|`{"type":10242,"rank_range":[1,1],"award":[[25400204,160],[350408,1],[204608,1],[101500,10888],[2271200,15],[6701900,5300],[201500,200000]]}`|
|2422|`{"type":10242,"rank_range":[2,2],"award":[[25400204,80],[350508,1],[204708,1],[101500,8888],[2271200,10],[6701900,3700],[201500,180000]]}`|
|2423|`{"type":10242,"rank_range":[3,3],"award":[[25400204,40],[350608,1],[204808,1],[101500,7888],[2271200,9],[6701900,3600],[201500,150000]]}`|
|2424|`{"type":10242,"rank_range":[4,5],"award":[[101500,5888],[2271200,7],[6701900,2700],[201500,100000]]}`|
|2425|`{"type":10242,"rank_range":[6,8],"award":[[101500,4888],[2271200,6],[6701900,2400],[201500,80000]]}`|
|2426|`{"type":10242,"rank_range":[9,12],"award":[[101500,2888],[2271200,5],[6701900,1800],[201500,60000]]}`|
|2427|`{"type":10242,"rank_range":[13,17],"award":[[101500,1888],[2271200,4],[6701900,1600],[201500,50000]]}`|
|2428|`{"type":10242,"rank_range":[18,29],"award":[[101500,888],[2271200,3],[6701900,1000],[201500,30000]]}`|
|2429|`{"type":10242,"rank_range":[30,41],"award":[[101500,666],[2271200,2],[6701900,900],[201500,20000]]}`|
|2430|`{"type":10242,"rank_range":[42,999],"award":[[101500,388],[2271200,1],[6701900,700],[201500,10000]]}`|
|2431|`{"type":20242,"rank_range":[1,1],"award":[[25400204,160],[350408,1],[204608,1],[101500,10888],[2271200,15],[6701900,5300],[201500,200000]]}`|
|2432|`{"type":20242,"rank_range":[2,2],"award":[[25400204,80],[350508,1],[204708,1],[101500,8888],[2271200,10],[6701900,3700],[201500,180000]]}`|
|2433|`{"type":20242,"rank_range":[3,3],"award":[[25400204,40],[350608,1],[204808,1],[101500,7888],[2271200,9],[6701900,3600],[201500,150000]]}`|
|2434|`{"type":20242,"rank_range":[4,5],"award":[[101500,5888],[2271200,7],[6701900,2700],[201500,100000]]}`|
|2435|`{"type":20242,"rank_range":[6,8],"award":[[101500,4888],[2271200,6],[6701900,2400],[201500,80000]]}`|
|2436|`{"type":20242,"rank_range":[9,12],"award":[[101500,2888],[2271200,5],[6701900,1800],[201500,60000]]}`|
|2437|`{"type":20242,"rank_range":[13,17],"award":[[101500,1888],[2271200,4],[6701900,1600],[201500,50000]]}`|
|2438|`{"type":20242,"rank_range":[18,29],"award":[[101500,888],[2271200,3],[6701900,1000],[201500,30000]]}`|
|2439|`{"type":20242,"rank_range":[30,41],"award":[[101500,666],[2271200,2],[6701900,900],[201500,20000]]}`|
|2440|`{"type":20242,"rank_range":[42,999],"award":[[101500,388],[2271200,1],[6701900,700],[201500,10000]]}`|
|2441|`{"type":30243,"rank_range":[1,1],"award":[[25400204,160],[350408,1],[204608,1],[101500,10888],[2271200,15],[6701900,5300],[201500,200000]]}`|
|2442|`{"type":30243,"rank_range":[2,2],"award":[[25400204,80],[350508,1],[204708,1],[101500,8888],[2271200,10],[6701900,3700],[201500,180000]]}`|
|2443|`{"type":30243,"rank_range":[3,3],"award":[[25400204,40],[350608,1],[204808,1],[101500,7888],[2271200,9],[6701900,3600],[201500,150000]]}`|
|2444|`{"type":30243,"rank_range":[4,5],"award":[[101500,5888],[2271200,7],[6701900,2700],[201500,100000]]}`|
|2445|`{"type":30243,"rank_range":[6,8],"award":[[101500,4888],[2271200,6],[6701900,2400],[201500,80000]]}`|
|2446|`{"type":30243,"rank_range":[9,12],"award":[[101500,2888],[2271200,5],[6701900,1800],[201500,60000]]}`|
|2447|`{"type":30243,"rank_range":[13,17],"award":[[101500,1888],[2271200,4],[6701900,1600],[201500,50000]]}`|
|2448|`{"type":30243,"rank_range":[18,29],"award":[[101500,888],[2271200,3],[6701900,1000],[201500,30000]]}`|
|2449|`{"type":30243,"rank_range":[30,41],"award":[[101500,666],[2271200,2],[6701900,900],[201500,20000]]}`|
|2450|`{"type":30243,"rank_range":[42,999],"award":[[101500,388],[2271200,1],[6701900,700],[201500,10000]]}`|
|2451|`{"type":40245,"rank_range":[1,1],"award":[[25400204,160],[350408,1],[204608,1],[101500,10888],[2271200,15],[6701900,6000],[201500,200000]]}`|
|2452|`{"type":40245,"rank_range":[2,2],"award":[[25400204,80],[350508,1],[204708,1],[101500,8888],[2271200,10],[6701900,4200],[201500,180000]]}`|
|2453|`{"type":40245,"rank_range":[3,3],"award":[[25400204,40],[350608,1],[204808,1],[101500,7888],[2271200,9],[6701900,3800],[201500,150000]]}`|
|2454|`{"type":40245,"rank_range":[4,5],"award":[[101500,5888],[2271200,7],[6701900,3000],[201500,100000]]}`|
|2455|`{"type":40245,"rank_range":[6,8],"award":[[101500,4888],[2271200,6],[6701900,2500],[201500,80000]]}`|
|2456|`{"type":40245,"rank_range":[9,12],"award":[[101500,2888],[2271200,5],[6701900,2000],[201500,60000]]}`|
|2457|`{"type":40245,"rank_range":[13,17],"award":[[101500,1888],[2271200,4],[6701900,1800],[201500,50000]]}`|
|2458|`{"type":40245,"rank_range":[18,29],"award":[[101500,888],[2271200,3],[6701900,1400],[201500,30000]]}`|
|2459|`{"type":40245,"rank_range":[30,41],"award":[[101500,666],[2271200,2],[6701900,1200],[201500,20000]]}`|
|2460|`{"type":40245,"rank_range":[42,999],"award":[[101500,388],[2271200,1],[6701900,1000],[201500,10000]]}`|
|2461|`{"type":50395,"rank_range":[1,1],"award":[[4371200,160],[350408,1],[204608,1],[101500,10888],[2271200,15],[6701900,6000],[201500,200000],[830902,8000],[830802,8]]}`|
|2462|`{"type":50395,"rank_range":[2,2],"award":[[4371200,80],[350508,1],[204708,1],[101500,8888],[2271200,10],[6701900,4200],[201500,180000],[830902,5000],[830802,5]]}`|
|2463|`{"type":50395,"rank_range":[3,3],"award":[[4371200,40],[350608,1],[204808,1],[101500,7888],[2271200,9],[6701900,3800],[201500,150000],[830902,3000],[830802,3]]}`|
|2464|`{"type":50395,"rank_range":[4,5],"award":[[101500,5888],[2271200,7],[6701900,3000],[201500,100000],[830902,2000],[830802,2]]}`|
|2465|`{"type":50395,"rank_range":[6,8],"award":[[101500,4888],[2271200,6],[6701900,2500],[201500,80000],[830902,1600],[830802,1]]}`|
|2466|`{"type":50395,"rank_range":[9,12],"award":[[101500,2888],[2271200,5],[6701900,2000],[201500,60000],[830902,1200],[830702,3]]}`|
|2467|`{"type":50395,"rank_range":[13,17],"award":[[101500,1888],[2271200,4],[6701900,1800],[201500,50000],[830902,800],[830702,2]]}`|
|2468|`{"type":50395,"rank_range":[18,29],"award":[[101500,888],[2271200,3],[6701900,1400],[201500,30000],[830902,500],[830702,1]]}`|
|2469|`{"type":50395,"rank_range":[30,41],"award":[[101500,666],[2271200,2],[6701900,1200],[201500,20000],[830902,300],[830602,2]]}`|
|2470|`{"type":50395,"rank_range":[42,999],"award":[[101500,388],[2271200,1],[6701900,1000],[201500,10000],[830902,100],[830602,1]]}`|
|2471|`{"type":60242,"rank_range":[1,1],"award":[[25400204,160],[350408,1],[204608,1],[101500,10888],[2271200,15],[6701900,5300],[201500,200000],[830902,8000],[830802,8]]}`|
|2472|`{"type":60242,"rank_range":[2,2],"award":[[25400204,80],[350508,1],[204708,1],[101500,8888],[2271200,10],[6701900,3700],[201500,180000],[830902,5000],[830802,5]]}`|
|2473|`{"type":60242,"rank_range":[3,3],"award":[[25400204,40],[350608,1],[204808,1],[101500,7888],[2271200,9],[6701900,3600],[201500,150000],[830902,3000],[830802,3]]}`|
|2474|`{"type":60242,"rank_range":[4,5],"award":[[101500,5888],[2271200,7],[6701900,2700],[201500,100000],[830902,2000],[830802,2]]}`|
|2475|`{"type":60242,"rank_range":[6,8],"award":[[101500,4888],[2271200,6],[6701900,2400],[201500,80000],[830902,1600],[830802,1]]}`|
|2476|`{"type":60242,"rank_range":[9,12],"award":[[101500,2888],[2271200,5],[6701900,1800],[201500,60000],[830902,1200],[830702,3]]}`|
|2477|`{"type":60242,"rank_range":[13,17],"award":[[101500,1888],[2271200,4],[6701900,1600],[201500,50000],[830902,800],[830702,2]]}`|
|2478|`{"type":60242,"rank_range":[18,29],"award":[[101500,888],[2271200,3],[6701900,1000],[201500,30000],[830902,500],[830702,1]]}`|
|2479|`{"type":60242,"rank_range":[30,41],"award":[[101500,666],[2271200,2],[6701900,900],[201500,20000],[830902,300],[830602,2]]}`|
|2480|`{"type":60242,"rank_range":[42,999],"award":[[101500,388],[2271200,1],[6701900,700],[201500,10000],[830902,100],[830602,1]]}`|
|2481|`{"type":70395,"rank_range":[1,1],"award":[[4371200,160],[350408,1],[204608,1],[830802,8],[831502,8000],[101500,10888],[2271200,15],[6701900,6000],[201500,200000]]}`|
|2482|`{"type":70395,"rank_range":[2,2],"award":[[4371200,80],[350508,1],[204708,1],[830802,5],[831502,5000],[101500,8888],[2271200,10],[6701900,4200],[201500,180000]]}`|
|2483|`{"type":70395,"rank_range":[3,3],"award":[[4371200,40],[350608,1],[204808,1],[830802,3],[831502,3000],[101500,7888],[2271200,9],[6701900,3800],[201500,150000]]}`|
|2484|`{"type":70395,"rank_range":[4,5],"award":[[830802,2],[831502,2000],[101500,5888],[2271200,7],[6701900,3000],[201500,100000]]}`|
|2485|`{"type":70395,"rank_range":[6,8],"award":[[830802,1],[831502,1600],[101500,4888],[2271200,6],[6701900,2500],[201500,80000]]}`|
|2486|`{"type":70395,"rank_range":[9,12],"award":[[830702,3],[831502,1200],[101500,2888],[2271200,5],[6701900,2000],[201500,60000]]}`|
|2487|`{"type":70395,"rank_range":[13,17],"award":[[830702,2],[831502,800],[101500,1888],[2271200,4],[6701900,1800],[201500,50000]]}`|
|2488|`{"type":70395,"rank_range":[18,29],"award":[[830702,1],[831502,500],[101500,888],[2271200,3],[6701900,1400],[201500,30000]]}`|
|2489|`{"type":70395,"rank_range":[30,41],"award":[[830602,2],[831502,300],[101500,666],[2271200,2],[6701900,1200],[201500,20000]]}`|
|2490|`{"type":70395,"rank_range":[42,999],"award":[[830602,1],[831502,100],[101500,388],[2271200,1],[6701900,1000],[201500,10000]]}`|
|2491|`{"type":80395,"rank_range":[1,1],"award":[[4371200,160],[350408,1],[204608,1],[830802,8],[101500,10888],[2271200,15],[6701900,6000],[201500,200000]]}`|
|2492|`{"type":80395,"rank_range":[2,2],"award":[[4371200,80],[350508,1],[204708,1],[830802,5],[101500,8888],[2271200,10],[6701900,4200],[201500,180000]]}`|
|2493|`{"type":80395,"rank_range":[3,3],"award":[[4371200,40],[350608,1],[204808,1],[830802,3],[101500,7888],[2271200,9],[6701900,3800],[201500,150000]]}`|
|2494|`{"type":80395,"rank_range":[4,5],"award":[[830802,2],[101500,5888],[2271200,7],[6701900,3000],[201500,100000]]}`|
|2495|`{"type":80395,"rank_range":[6,8],"award":[[830802,1],[101500,4888],[2271200,6],[6701900,2500],[201500,80000]]}`|
|2496|`{"type":80395,"rank_range":[9,12],"award":[[830702,3],[101500,2888],[2271200,5],[6701900,2000],[201500,60000]]}`|
|2497|`{"type":80395,"rank_range":[13,17],"award":[[830702,2],[101500,1888],[2271200,4],[6701900,1800],[201500,50000]]}`|
|2498|`{"type":80395,"rank_range":[18,29],"award":[[830702,1],[101500,888],[2271200,3],[6701900,1400],[201500,30000]]}`|
|2499|`{"type":80395,"rank_range":[30,41],"award":[[830602,2],[101500,666],[2271200,2],[6701900,1200],[201500,20000]]}`|
|2500|`{"type":80395,"rank_range":[42,999],"award":[[830602,1],[101500,388],[2271200,1],[6701900,1000],[201500,10000]]}`|
|2501|`{"type":90242,"rank_range":[1,1],"award":[[7001002,240],[350408,1],[204608,1],[830802,8],[101500,10888],[2271200,15],[6701900,5300],[201500,200000]]}`|
|2502|`{"type":90242,"rank_range":[2,2],"award":[[7001002,160],[350508,1],[204708,1],[830802,5],[101500,8888],[2271200,10],[6701900,3700],[201500,180000]]}`|
|2503|`{"type":90242,"rank_range":[3,3],"award":[[7001002,80],[350608,1],[204808,1],[830802,3],[101500,7888],[2271200,9],[6701900,3600],[201500,150000]]}`|
|2504|`{"type":90242,"rank_range":[4,5],"award":[[7001002,40],[830802,2],[101500,5888],[2271200,7],[6701900,2700],[201500,100000]]}`|
|2505|`{"type":90242,"rank_range":[6,8],"award":[[7001002,20],[830802,1],[101500,4888],[2271200,6],[6701900,2400],[201500,80000]]}`|
|2506|`{"type":90242,"rank_range":[9,12],"award":[[830702,3],[101500,2888],[2271200,5],[6701900,1800],[201500,60000]]}`|
|2507|`{"type":90242,"rank_range":[13,17],"award":[[830702,2],[101500,1888],[2271200,4],[6701900,1600],[201500,50000]]}`|
|2508|`{"type":90242,"rank_range":[18,29],"award":[[830702,1],[101500,888],[2271200,3],[6701900,1000],[201500,30000]]}`|
|2509|`{"type":90242,"rank_range":[30,41],"award":[[830602,2],[101500,666],[2271200,2],[6701900,900],[201500,20000]]}`|
|2510|`{"type":90242,"rank_range":[42,999],"award":[[830602,1],[101500,388],[2271200,1],[6701900,700],[201500,10000]]}`|
|2511|`{"type":100243,"rank_range":[1,1],"award":[[7004002,240],[350408,1],[204608,1],[830802,8],[101500,10888],[2271200,15],[6701900,5300],[201500,200000]]}`|
|2512|`{"type":100243,"rank_range":[2,2],"award":[[7004002,160],[350508,1],[204708,1],[830802,5],[101500,8888],[2271200,10],[6701900,3700],[201500,180000]]}`|
|2513|`{"type":100243,"rank_range":[3,3],"award":[[7004002,80],[350608,1],[204808,1],[830802,3],[101500,7888],[2271200,9],[6701900,3600],[201500,150000]]}`|
|2514|`{"type":100243,"rank_range":[4,5],"award":[[7004002,40],[830802,2],[101500,5888],[2271200,7],[6701900,2700],[201500,100000]]}`|
|2515|`{"type":100243,"rank_range":[6,8],"award":[[7004002,20],[830802,1],[101500,4888],[2271200,6],[6701900,2400],[201500,80000]]}`|
|2516|`{"type":100243,"rank_range":[9,12],"award":[[830702,3],[101500,2888],[2271200,5],[6701900,1800],[201500,60000]]}`|
|2517|`{"type":100243,"rank_range":[13,17],"award":[[830702,2],[101500,1888],[2271200,4],[6701900,1600],[201500,50000]]}`|
|2518|`{"type":100243,"rank_range":[18,29],"award":[[830702,1],[101500,888],[2271200,3],[6701900,1000],[201500,30000]]}`|
|2519|`{"type":100243,"rank_range":[30,41],"award":[[830602,2],[101500,666],[2271200,2],[6701900,900],[201500,20000]]}`|
|2520|`{"type":100243,"rank_range":[42,999],"award":[[830602,1],[101500,388],[2271200,1],[6701900,700],[201500,10000]]}`|

## RankType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|10|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10242|`{}`|
|20242|`{}`|
|30243|`{}`|
|40245|`{}`|
|50395|`{}`|
|60242|`{}`|
|70395|`{}`|
|80395|`{}`|
|90242|`{}`|
|100243|`{}`|

## RankServerAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|42|本表行键；与其他表同值不自动代表同一对象。|
|version|number|42|版本引用；必须按活动类型及其消费者查对应版本表。|
|rank_range|array|42|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|42|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"version":1,"rank_range":[1,1],"award":[[6701900,800],[2271200,6],[350708,1]]}`|
|2|`{"version":1,"rank_range":[2,2],"award":[[6701900,600],[2271200,4]]}`|
|3|`{"version":2,"rank_range":[1,1],"award":[[6701900,800],[2271200,6],[350708,1]]}`|
|4|`{"version":2,"rank_range":[2,2],"award":[[6701900,600],[2271200,4]]}`|
|5|`{"version":3,"rank_range":[1,1],"award":[[6701900,800],[2271200,6],[350708,1]]}`|
|6|`{"version":3,"rank_range":[2,2],"award":[[6701900,600],[2271200,4]]}`|
|7|`{"version":3,"rank_range":[3,4],"award":[[6701900,400],[2271200,2]]}`|
|8|`{"version":4,"rank_range":[1,1],"award":[[6701900,1000],[2271200,8],[350708,1]]}`|
|9|`{"version":4,"rank_range":[2,2],"award":[[6701900,900],[2271200,7]]}`|
|10|`{"version":4,"rank_range":[3,3],"award":[[6701900,800],[2271200,6]]}`|
|11|`{"version":4,"rank_range":[4,4],"award":[[6701900,700],[2271200,5]]}`|
|12|`{"version":4,"rank_range":[5,10],"award":[[6701900,500],[2271200,4]]}`|
|13|`{"version":4,"rank_range":[11,15],"award":[[6701900,400],[2271200,3]]}`|
|14|`{"version":4,"rank_range":[16,25],"award":[[6701900,300],[2271200,2]]}`|
|15|`{"version":5,"rank_range":[1,1],"award":[[6701900,1000],[2271200,8],[350708,1]]}`|
|16|`{"version":5,"rank_range":[2,2],"award":[[6701900,900],[2271200,7]]}`|
|17|`{"version":5,"rank_range":[3,3],"award":[[6701900,800],[2271200,6]]}`|
|18|`{"version":5,"rank_range":[4,4],"award":[[6701900,700],[2271200,5]]}`|
|19|`{"version":5,"rank_range":[5,10],"award":[[6701900,500],[2271200,4]]}`|
|20|`{"version":5,"rank_range":[11,15],"award":[[6701900,400],[2271200,3]]}`|
|21|`{"version":5,"rank_range":[16,25],"award":[[6701900,300],[2271200,2]]}`|
|22|`{"version":6,"rank_range":[1,1],"award":[[6701900,800],[2271200,6],[350708,1]]}`|
|23|`{"version":6,"rank_range":[2,2],"award":[[6701900,600],[2271200,4]]}`|
|24|`{"version":7,"rank_range":[1,1],"award":[[6701900,1000],[2271200,8],[350708,1]]}`|
|25|`{"version":7,"rank_range":[2,2],"award":[[6701900,900],[2271200,7]]}`|
|26|`{"version":7,"rank_range":[3,3],"award":[[6701900,800],[2271200,6]]}`|
|27|`{"version":7,"rank_range":[4,4],"award":[[6701900,700],[2271200,5]]}`|
|28|`{"version":7,"rank_range":[5,10],"award":[[6701900,500],[2271200,4]]}`|
|29|`{"version":7,"rank_range":[11,15],"award":[[6701900,400],[2271200,3]]}`|
|30|`{"version":7,"rank_range":[16,25],"award":[[6701900,300],[2271200,2]]}`|
|31|`{"version":8,"rank_range":[1,1],"award":[[6701900,1000],[2271200,8],[350708,1]]}`|
|32|`{"version":8,"rank_range":[2,2],"award":[[6701900,900],[2271200,7]]}`|
|33|`{"version":8,"rank_range":[3,3],"award":[[6701900,800],[2271200,6]]}`|
|34|`{"version":8,"rank_range":[4,4],"award":[[6701900,700],[2271200,5]]}`|
|35|`{"version":8,"rank_range":[5,10],"award":[[6701900,500],[2271200,4]]}`|
|36|`{"version":8,"rank_range":[11,15],"award":[[6701900,400],[2271200,3]]}`|
|37|`{"version":8,"rank_range":[16,25],"award":[[6701900,300],[2271200,2]]}`|
|38|`{"version":9,"rank_range":[1,1],"award":[[6701900,800],[2271200,6],[350708,1]]}`|
|39|`{"version":9,"rank_range":[2,2],"award":[[6701900,600],[2271200,4]]}`|
|40|`{"version":10,"rank_range":[1,1],"award":[[6701900,800],[2271200,6],[350708,1]]}`|
|41|`{"version":10,"rank_range":[2,2],"award":[[6701900,600],[2271200,4]]}`|
|42|`{"version":10,"rank_range":[3,4],"award":[[6701900,400],[2271200,2]]}`|

## RankServerMaxAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|30|本表行键；与其他表同值不自动代表同一对象。|
|version|number|30|版本引用；必须按活动类型及其消费者查对应版本表。|
|rank_range|array|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|30|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"version":1,"rank_range":[1,1],"award":[[6701900,1000],[2271200,8],[101500,2888],[2002,10]]}`|
|2|`{"version":1,"rank_range":[2,2],"award":[[6701900,800],[2271200,6],[101500,1888],[2002,7]]}`|
|3|`{"version":1,"rank_range":[3,3],"award":[[6701900,600],[2271200,3],[101500,888],[2002,5]]}`|
|4|`{"version":2,"rank_range":[1,1],"award":[[6701900,1000],[2271200,8],[101500,2888],[2002,10]]}`|
|5|`{"version":2,"rank_range":[2,2],"award":[[6701900,800],[2271200,6],[101500,1888],[2002,7]]}`|
|6|`{"version":2,"rank_range":[3,3],"award":[[6701900,600],[2271200,3],[101500,888],[2002,5]]}`|
|7|`{"version":3,"rank_range":[1,1],"award":[[6701900,1000],[2271200,8],[101500,2888],[2002,10]]}`|
|8|`{"version":3,"rank_range":[2,2],"award":[[6701900,800],[2271200,6],[101500,1888],[2002,7]]}`|
|9|`{"version":3,"rank_range":[3,3],"award":[[6701900,600],[2271200,3],[101500,888],[2002,5]]}`|
|10|`{"version":4,"rank_range":[1,1],"award":[[6701900,1000],[2271200,8],[101500,2888],[2002,10]]}`|
|11|`{"version":4,"rank_range":[2,2],"award":[[6701900,800],[2271200,6],[101500,1888],[2002,7]]}`|
|12|`{"version":4,"rank_range":[3,3],"award":[[6701900,600],[2271200,3],[101500,888],[2002,5]]}`|
|13|`{"version":5,"rank_range":[1,1],"award":[[6701900,1000],[2271200,8],[101500,2888],[2002,10]]}`|
|14|`{"version":5,"rank_range":[2,2],"award":[[6701900,800],[2271200,6],[101500,1888],[2002,7]]}`|
|15|`{"version":5,"rank_range":[3,3],"award":[[6701900,600],[2271200,3],[101500,888],[2002,5]]}`|
|16|`{"version":6,"rank_range":[1,1],"award":[[6701900,1000],[2271200,8],[101500,2888],[2002,10]]}`|
|17|`{"version":6,"rank_range":[2,2],"award":[[6701900,800],[2271200,6],[101500,1888],[2002,7]]}`|
|18|`{"version":6,"rank_range":[3,3],"award":[[6701900,600],[2271200,3],[101500,888],[2002,5]]}`|
|19|`{"version":7,"rank_range":[1,1],"award":[[6701900,1000],[2271200,8],[101500,2888],[2002,10]]}`|
|20|`{"version":7,"rank_range":[2,2],"award":[[6701900,800],[2271200,6],[101500,1888],[2002,7]]}`|
|21|`{"version":7,"rank_range":[3,3],"award":[[6701900,600],[2271200,3],[101500,888],[2002,5]]}`|
|22|`{"version":8,"rank_range":[1,1],"award":[[6701900,1000],[2271200,8],[101500,2888],[2002,10]]}`|
|23|`{"version":8,"rank_range":[2,2],"award":[[6701900,800],[2271200,6],[101500,1888],[2002,7]]}`|
|24|`{"version":8,"rank_range":[3,3],"award":[[6701900,600],[2271200,3],[101500,888],[2002,5]]}`|
|25|`{"version":9,"rank_range":[1,1],"award":[[6701900,1000],[2271200,8],[101500,2888],[2002,10]]}`|
|26|`{"version":9,"rank_range":[2,2],"award":[[6701900,800],[2271200,6],[101500,1888],[2002,7]]}`|
|27|`{"version":9,"rank_range":[3,3],"award":[[6701900,600],[2271200,3],[101500,888],[2002,5]]}`|
|28|`{"version":10,"rank_range":[1,1],"award":[[6701900,1000],[2271200,8],[101500,2888],[2002,10]]}`|
|29|`{"version":10,"rank_range":[2,2],"award":[[6701900,800],[2271200,6],[101500,1888],[2002,7]]}`|
|30|`{"version":10,"rank_range":[3,3],"award":[[6701900,600],[2271200,3],[101500,888],[2002,5]]}`|

## RuleConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|enter_times|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"enter_times":1}`|

## Rule

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|title|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|content|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|banner|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|group_banner|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|group_content|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|params|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"group_banner":"img_myzy_sy_1.png","group_content":676803}`|
|6|`{"group_banner":"img_myzy_sy_9.png","group_content":676820}`|
|9|`{"group_banner":"img_myzy_sy_11.png","group_content":676809}`|
|12|`{"group_banner":"img_myzy_sy_14.png","group_content":676810}`|

## Scatter

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|90|本表行键；与其他表同值不自动代表同一对象。|
|quality|number|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|arena|number|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|speed_point|number|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|arena_count|number|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|settlement_point|number|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr|array|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|weak_buff_add_speed|number|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|weak_buff_max_layer|number|90|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|protect_time|number|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|injury_time|number|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attack_cd|number|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|unit_attack_cd|number|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10101|`{"quality":30,"speed_point":10,"arena_count":0,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|10102|`{"quality":30,"speed_point":30,"arena_count":12,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|10103|`{"quality":30,"speed_point":40,"arena_count":12,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|10104|`{"quality":30,"speed_point":60,"arena_count":5,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|10105|`{"quality":40,"speed_point":70,"arena_count":4,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|10106|`{"quality":40,"speed_point":90,"arena_count":3,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|10107|`{"quality":50,"speed_point":100,"arena_count":2,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|10108|`{"quality":50,"speed_point":130,"arena_count":2,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":60,"injury_time":10,"attack_cd":120,"unit_attack_cd":0}`|
|10109|`{"quality":60,"speed_point":150,"arena_count":1,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":300,"weak_buff_max_layer":3000,"protect_time":60,"injury_time":10,"attack_cd":120,"unit_attack_cd":0}`|
|20101|`{"quality":30,"speed_point":10,"arena_count":0,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|20102|`{"quality":30,"speed_point":30,"arena_count":12,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|20103|`{"quality":30,"speed_point":40,"arena_count":12,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|20104|`{"quality":30,"speed_point":60,"arena_count":5,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|20105|`{"quality":40,"speed_point":70,"arena_count":4,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|20106|`{"quality":40,"speed_point":90,"arena_count":3,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|20107|`{"quality":50,"speed_point":100,"arena_count":2,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|20108|`{"quality":50,"speed_point":130,"arena_count":2,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":60,"injury_time":10,"attack_cd":120,"unit_attack_cd":0}`|
|20109|`{"quality":60,"speed_point":150,"arena_count":1,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":300,"weak_buff_max_layer":3000,"protect_time":60,"injury_time":10,"attack_cd":120,"unit_attack_cd":0}`|
|30101|`{"quality":30,"speed_point":10,"arena_count":0,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|30102|`{"quality":30,"speed_point":30,"arena_count":12,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|30103|`{"quality":30,"speed_point":40,"arena_count":12,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|30104|`{"quality":30,"speed_point":60,"arena_count":5,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|30105|`{"quality":40,"speed_point":70,"arena_count":4,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|30106|`{"quality":40,"speed_point":90,"arena_count":3,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|30107|`{"quality":50,"speed_point":100,"arena_count":2,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|30108|`{"quality":50,"speed_point":130,"arena_count":2,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":60,"injury_time":10,"attack_cd":120,"unit_attack_cd":0}`|
|30109|`{"quality":60,"speed_point":150,"arena_count":1,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":300,"weak_buff_max_layer":3000,"protect_time":60,"injury_time":10,"attack_cd":120,"unit_attack_cd":0}`|
|40101|`{"quality":30,"speed_point":100,"arena_count":0,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|40102|`{"quality":30,"speed_point":150,"arena_count":12,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|40103|`{"quality":30,"speed_point":180,"arena_count":12,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|40104|`{"quality":30,"speed_point":250,"arena_count":5,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|40105|`{"quality":40,"speed_point":280,"arena_count":4,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|40106|`{"quality":40,"speed_point":380,"arena_count":3,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|40107|`{"quality":50,"speed_point":450,"arena_count":2,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|40108|`{"quality":50,"speed_point":620,"arena_count":2,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":60,"injury_time":10,"attack_cd":120,"unit_attack_cd":0}`|
|40109|`{"quality":60,"speed_point":850,"arena_count":1,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":300,"weak_buff_max_layer":3000,"protect_time":60,"injury_time":10,"attack_cd":120,"unit_attack_cd":0}`|
|50101|`{"quality":30,"speed_point":100,"arena_count":0,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|50102|`{"quality":30,"speed_point":150,"arena_count":12,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|50103|`{"quality":30,"speed_point":180,"arena_count":12,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|50104|`{"quality":30,"speed_point":250,"arena_count":5,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|50105|`{"quality":40,"speed_point":280,"arena_count":4,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|50106|`{"quality":40,"speed_point":380,"arena_count":3,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|50107|`{"quality":50,"speed_point":450,"arena_count":2,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|50108|`{"quality":50,"speed_point":620,"arena_count":2,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":60,"injury_time":10,"attack_cd":120,"unit_attack_cd":0}`|
|50109|`{"quality":60,"speed_point":850,"arena_count":1,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":300,"weak_buff_max_layer":3000,"protect_time":60,"injury_time":10,"attack_cd":120,"unit_attack_cd":0}`|
|60101|`{"quality":30,"speed_point":10,"arena_count":0,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|60102|`{"quality":30,"speed_point":30,"arena_count":12,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|60103|`{"quality":30,"speed_point":40,"arena_count":12,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|60104|`{"quality":30,"speed_point":60,"arena_count":5,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|60105|`{"quality":40,"speed_point":70,"arena_count":4,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|60106|`{"quality":40,"speed_point":90,"arena_count":3,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|60107|`{"quality":50,"speed_point":100,"arena_count":2,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|60108|`{"quality":50,"speed_point":130,"arena_count":2,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":60,"injury_time":10,"attack_cd":120,"unit_attack_cd":0}`|
|60109|`{"quality":60,"speed_point":150,"arena_count":1,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":300,"weak_buff_max_layer":3000,"protect_time":60,"injury_time":10,"attack_cd":120,"unit_attack_cd":0}`|
|70101|`{"quality":30,"speed_point":100,"arena_count":0,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|70102|`{"quality":30,"speed_point":150,"arena_count":12,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|70103|`{"quality":30,"speed_point":180,"arena_count":12,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|70104|`{"quality":30,"speed_point":250,"arena_count":5,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|70105|`{"quality":40,"speed_point":280,"arena_count":4,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|70106|`{"quality":40,"speed_point":380,"arena_count":3,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|70107|`{"quality":50,"speed_point":450,"arena_count":2,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|70108|`{"quality":50,"speed_point":620,"arena_count":2,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":60,"injury_time":10,"attack_cd":120,"unit_attack_cd":0}`|
|70109|`{"quality":60,"speed_point":850,"arena_count":1,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":300,"weak_buff_max_layer":3000,"protect_time":60,"injury_time":10,"attack_cd":120,"unit_attack_cd":0}`|
|80101|`{"quality":30,"speed_point":100,"arena_count":0,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|80102|`{"quality":30,"speed_point":150,"arena_count":12,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|80103|`{"quality":30,"speed_point":180,"arena_count":12,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|80104|`{"quality":30,"speed_point":250,"arena_count":5,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|80105|`{"quality":40,"speed_point":280,"arena_count":4,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|80106|`{"quality":40,"speed_point":380,"arena_count":3,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|80107|`{"quality":50,"speed_point":450,"arena_count":2,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|80108|`{"quality":50,"speed_point":620,"arena_count":2,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":60,"injury_time":10,"attack_cd":120,"unit_attack_cd":0}`|
|80109|`{"quality":60,"speed_point":850,"arena_count":1,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":300,"weak_buff_max_layer":3000,"protect_time":60,"injury_time":10,"attack_cd":120,"unit_attack_cd":0}`|
|90101|`{"quality":30,"speed_point":100,"arena_count":0,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|90102|`{"quality":30,"speed_point":150,"arena_count":12,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|90103|`{"quality":30,"speed_point":180,"arena_count":12,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|90104|`{"quality":30,"speed_point":250,"arena_count":5,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|90105|`{"quality":40,"speed_point":280,"arena_count":4,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|90106|`{"quality":40,"speed_point":380,"arena_count":3,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|90107|`{"quality":50,"speed_point":450,"arena_count":2,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|90108|`{"quality":50,"speed_point":620,"arena_count":2,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":60,"injury_time":10,"attack_cd":120,"unit_attack_cd":0}`|
|90109|`{"quality":60,"speed_point":850,"arena_count":1,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":300,"weak_buff_max_layer":3000,"protect_time":60,"injury_time":10,"attack_cd":120,"unit_attack_cd":0}`|
|100101|`{"quality":30,"speed_point":100,"arena_count":0,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|100102|`{"quality":30,"speed_point":150,"arena_count":12,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|100103|`{"quality":30,"speed_point":180,"arena_count":12,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|100104|`{"quality":30,"speed_point":250,"arena_count":5,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|100105|`{"quality":40,"speed_point":280,"arena_count":4,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|100106|`{"quality":40,"speed_point":380,"arena_count":3,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|100107|`{"quality":50,"speed_point":450,"arena_count":2,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":300,"injury_time":10,"attack_cd":360,"unit_attack_cd":0}`|
|100108|`{"quality":50,"speed_point":620,"arena_count":2,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":0,"weak_buff_max_layer":0,"protect_time":60,"injury_time":10,"attack_cd":120,"unit_attack_cd":0}`|
|100109|`{"quality":60,"speed_point":850,"arena_count":1,"settlement_point":0,"attr":[1,2,24,25],"weak_buff_add_speed":300,"weak_buff_max_layer":3000,"protect_time":60,"injury_time":10,"attack_cd":120,"unit_attack_cd":0}`|

## AreaCustom

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|90|本表行键；与其他表同值不自动代表同一对象。|
|version|number|90|版本引用；必须按活动类型及其消费者查对应版本表。|
|area_type|number|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|open_point|number|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|group_count|number|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_list|object|90|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"version":1,"area_type":1,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|102|`{"version":1,"area_type":2,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|103|`{"version":1,"area_type":3,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|104|`{"version":1,"area_type":4,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|105|`{"version":1,"area_type":5,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|106|`{"version":1,"area_type":6,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|107|`{"version":1,"area_type":7,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|108|`{"version":1,"area_type":8,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|109|`{"version":1,"area_type":9,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|201|`{"version":2,"area_type":1,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|202|`{"version":2,"area_type":2,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|203|`{"version":2,"area_type":3,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|204|`{"version":2,"area_type":4,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|205|`{"version":2,"area_type":5,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|206|`{"version":2,"area_type":6,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|207|`{"version":2,"area_type":7,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|208|`{"version":2,"area_type":8,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|209|`{"version":2,"area_type":9,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|301|`{"version":3,"area_type":1,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|302|`{"version":3,"area_type":2,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|303|`{"version":3,"area_type":3,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|304|`{"version":3,"area_type":4,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|305|`{"version":3,"area_type":5,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|306|`{"version":3,"area_type":6,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|307|`{"version":3,"area_type":7,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|308|`{"version":3,"area_type":8,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|309|`{"version":3,"area_type":9,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|401|`{"version":4,"area_type":1,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|402|`{"version":4,"area_type":2,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|403|`{"version":4,"area_type":3,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|404|`{"version":4,"area_type":4,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|405|`{"version":4,"area_type":5,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|406|`{"version":4,"area_type":6,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|407|`{"version":4,"area_type":7,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|408|`{"version":4,"area_type":8,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|409|`{"version":4,"area_type":9,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|501|`{"version":5,"area_type":1,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|502|`{"version":5,"area_type":2,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|503|`{"version":5,"area_type":3,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|504|`{"version":5,"area_type":4,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|505|`{"version":5,"area_type":5,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|506|`{"version":5,"area_type":6,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|507|`{"version":5,"area_type":7,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|508|`{"version":5,"area_type":8,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|509|`{"version":5,"area_type":9,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|601|`{"version":6,"area_type":1,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|602|`{"version":6,"area_type":2,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|603|`{"version":6,"area_type":3,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|604|`{"version":6,"area_type":4,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|605|`{"version":6,"area_type":5,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|606|`{"version":6,"area_type":6,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|607|`{"version":6,"area_type":7,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|608|`{"version":6,"area_type":8,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|609|`{"version":6,"area_type":9,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|701|`{"version":7,"area_type":1,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|702|`{"version":7,"area_type":2,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|703|`{"version":7,"area_type":3,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|704|`{"version":7,"area_type":4,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|705|`{"version":7,"area_type":5,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|706|`{"version":7,"area_type":6,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|707|`{"version":7,"area_type":7,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|708|`{"version":7,"area_type":8,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|709|`{"version":7,"area_type":9,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|801|`{"version":8,"area_type":1,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|802|`{"version":8,"area_type":2,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|803|`{"version":8,"area_type":3,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|804|`{"version":8,"area_type":4,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|805|`{"version":8,"area_type":5,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|806|`{"version":8,"area_type":6,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|807|`{"version":8,"area_type":7,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|808|`{"version":8,"area_type":8,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|809|`{"version":8,"area_type":9,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|901|`{"version":9,"area_type":1,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|902|`{"version":9,"area_type":2,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|903|`{"version":9,"area_type":3,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|904|`{"version":9,"area_type":4,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|905|`{"version":9,"area_type":5,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|906|`{"version":9,"area_type":6,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|907|`{"version":9,"area_type":7,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|908|`{"version":9,"area_type":8,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|909|`{"version":9,"area_type":9,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|1001|`{"version":10,"area_type":1,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|1002|`{"version":10,"area_type":2,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|1003|`{"version":10,"area_type":3,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|1004|`{"version":10,"area_type":4,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|1005|`{"version":10,"area_type":5,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|1006|`{"version":10,"area_type":6,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|1007|`{"version":10,"area_type":7,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|1008|`{"version":10,"area_type":8,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|
|1009|`{"version":10,"area_type":9,"open_point":0,"group_count":1,"award_list":{"global":"TableEmpty"}}`|

## Area

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|9|本表行键；与其他表同值不自动代表同一对象。|
|stage|number|9|ActFrame阶段引用数组；不同于旧Activity.state。|
|start_state|number|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lv_index|number|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_icon|string|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_tid|number|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"stage":2,"start_state":3,"lv_index":0,"fight_tid":9730002}`|
|2|`{"stage":2,"start_state":3,"lv_index":1,"fight_tid":9730003}`|
|3|`{"stage":2,"start_state":3,"lv_index":2,"fight_tid":9730004}`|
|4|`{"stage":2,"start_state":3,"lv_index":3,"fight_tid":9730005}`|
|5|`{"stage":2,"start_state":3,"lv_index":4,"fight_tid":9730006}`|
|6|`{"stage":2,"start_state":3,"lv_index":5,"fight_tid":9730007}`|
|7|`{"stage":2,"start_state":3,"lv_index":6,"fight_tid":9730008}`|
|8|`{"stage":2,"start_state":3,"lv_index":7,"fight_tid":9730009}`|
|9|`{"stage":2,"start_state":3,"lv_index":8,"fight_tid":9730010}`|

## FinalShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|9|本表行键；与其他表同值不自动代表同一对象。|
|top_img|string|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|top_sub_img|string|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|top_over_img|string|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|mid_img|string|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bottom_img|string|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|mid_bg_img|string|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bottom_img_mask|string|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

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

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|help_exchange_ratio|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|challenge_state|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_fight_report|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|debuff_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|main_house_tip_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"challenge_state":[[3,4],[5,6],[7,8]],"max_fight_report":15,"debuff_time":1200,"main_house_tip_time":15}`|

## CrossRank

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|rank_tid|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|7|`{"rank_tid":272}`|
|9|`{"rank_tid":273}`|
|11|`{"rank_tid":274}`|
|12|`{"rank_tid":422}`|

## Ring

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|410|本表行键；与其他表同值不自动代表同一对象。|
|scatter|number|410|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部410行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|

## Act

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|10|本表行键；与其他表同值不自动代表同一对象。|
|group_type|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cross_times|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|final_lineup|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|final_fight|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|shop_lib|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_session|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"group_type":0,"cross_times":0,"final_fight":9710001,"shop_lib":5110001}`|
|2|`{"group_type":0,"cross_times":0,"final_fight":9710001,"shop_lib":5110002}`|
|3|`{"group_type":0,"cross_times":0,"final_fight":9710001,"shop_lib":5110003}`|
|4|`{"group_type":0,"cross_times":0,"final_fight":9710001,"shop_lib":5110004}`|
|5|`{"group_type":0,"cross_times":0,"final_fight":9710001,"shop_lib":5110005}`|
|6|`{"group_type":0,"cross_times":0,"final_fight":9710001,"shop_lib":5110006}`|
|7|`{"group_type":0,"cross_times":0,"final_fight":9710001,"shop_lib":5110007}`|
|8|`{"group_type":0,"cross_times":0,"final_fight":9710001,"shop_lib":5110008}`|
|9|`{"group_type":0,"cross_times":0,"final_fight":9710001,"shop_lib":5110002}`|
|10|`{"group_type":0,"cross_times":0,"final_fight":9710001,"shop_lib":5110003}`|

## Time

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|10|本表行键；与其他表同值不自动代表同一对象。|
|start_day|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|start_time|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|gm_text|string|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"start_day":0,"start_time":18000}`|
|2|`{"start_day":1,"start_time":7200}`|
|3|`{"start_day":1,"start_time":43200}`|
|4|`{"start_day":1,"start_time":79200}`|
|5|`{"start_day":2,"start_time":43200}`|
|6|`{"start_day":2,"start_time":79200}`|
|7|`{"start_day":3,"start_time":43200}`|
|8|`{"start_day":3,"start_time":79200}`|
|9|`{"start_day":3,"start_time":79201}`|
|10|`{"start_day":4,"start_time":79200}`|

## Stage

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|start_state|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|end_state|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_open_help|boolean|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"start_state":1,"end_state":3,"is_open_help":false}`|
|2|`{"start_state":3,"end_state":8,"is_open_help":false}`|
|3|`{"start_state":9,"end_state":10,"is_open_help":false}`|

## CardShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|8|本表行键；与其他表同值不自动代表同一对象。|
|navigation_name|string|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

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

## Directions

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|title|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|server_title|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_des|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|

## StagePop

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|30|本表行键；与其他表同值不自动代表同一对象。|
|res_list|array|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{}`|
|102|`{}`|
|103|`{}`|
|201|`{}`|
|202|`{}`|
|203|`{}`|
|301|`{}`|
|302|`{}`|
|303|`{}`|
|401|`{}`|
|402|`{}`|
|403|`{}`|
|501|`{}`|
|502|`{}`|
|503|`{}`|
|601|`{}`|
|602|`{}`|
|603|`{}`|
|701|`{}`|
|702|`{}`|
|703|`{}`|
|801|`{}`|
|802|`{}`|
|803|`{}`|
|901|`{}`|
|902|`{}`|
|903|`{}`|
|1001|`{}`|
|1002|`{}`|
|1003|`{}`|

## GuessAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|award_list|array|6|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1000|`{"award_list":[[6701900,80],[101500,80]]}`|
|1001|`{"award_list":[[6701900,100],[101500,100]]}`|
|1002|`{"award_list":[[6701900,120],[101500,120]]}`|
|1003|`{"award_list":[[6701900,150],[101500,150]]}`|
|2000|`{"award_list":[[6701900,80],[101500,80]]}`|
|2001|`{"award_list":[[6701900,100],[101500,100]]}`|

## GuessType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|des|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|stage|number|2|ActFrame阶段引用数组；不同于旧Activity.state。|
|count|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|target|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|open_state|object|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"stage":2,"count":1,"type":1,"target":0,"open_state":{"global":"TableEmpty"}}`|
|2|`{"stage":2,"count":1,"type":1,"target":1,"open_state":{"global":"TableEmpty"}}`|

## NoticeHot

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|rank_range|array|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"rank_range":[2,2]}`|
|2|`{"rank_range":[4,1]}`|
|3|`{"rank_range":[999,1]}`|
