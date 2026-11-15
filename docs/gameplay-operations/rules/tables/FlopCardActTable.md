# FlopCardActTable 规则参数

来源：[personal-server/assets/tables/FlopCardActTable.data.lua.json.gz](../../../../personal-server/assets/tables/FlopCardActTable.data.lua.json.gz)，SHA256：`6273b968a8403035279e14f34e160adf4e72147c6728972668b5d9dd2461dc63`。

[完整逐行JSON](FlopCardActTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[CardType](#cardtype)|4|decoded-rows|
|[AwardGroup](#awardgroup)|30|decoded-rows|
|[Ver](#ver)|5|decoded-rows|
|[CardHandRankShow](#cardhandrankshow)|30|decoded-rows|
|[CardHandRank](#cardhandrank)|35|decoded-rows|
|[AccAward](#accaward)|130|decoded-rows|
|[AccAwardLib](#accawardlib)|6|decoded-rows|
|[Type](#type)|3|decoded-rows|

## CardType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|is_jackpot|boolean|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|card_res|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"is_jackpot":false}`|
|2|`{"is_jackpot":false}`|
|3|`{"is_jackpot":false}`|
|4|`{"is_jackpot":true}`|

## AwardGroup

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|30|本表行键；与其他表同值不自动代表同一对象。|
|weight|array|30|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|
|award|array|30|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|item_show_rate|array|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"weight":[5000,5000],"award":[[101500,500],[4981200,1]],"item_show_rate":[100,100]}`|
|2|`{"weight":[5000,5000],"award":[[101500,1500],[4981200,3]],"item_show_rate":[300,300]}`|
|3|`{"weight":[6500,3500],"award":[[820302,1],[101500,3500]],"item_show_rate":[3240,1560]}`|
|4|`{"weight":[6000,4000],"award":[[820302,1],[820302,2]],"item_show_rate":[1800,1200]}`|
|5|`{"weight":[2000,8000],"award":[[820302,2],[820302,3]],"item_show_rate":[200,800]}`|
|6|`{"weight":[5000],"award":[[4991200,1]],"item_show_rate":[400]}`|
|7|`{"weight":[5000,5000],"award":[[101500,100],[5011200,1]],"item_show_rate":[100,100]}`|
|8|`{"weight":[5000,5000],"award":[[101500,500],[5011200,5]],"item_show_rate":[300,300]}`|
|9|`{"weight":[5000,5000],"award":[[820302,1],[101500,1000]],"item_show_rate":[2400,2400]}`|
|10|`{"weight":[6000,4000],"award":[[820302,2],[101500,2500]],"item_show_rate":[1800,1200]}`|
|11|`{"weight":[4000,6000],"award":[[820302,3],[101500,5000]],"item_show_rate":[400,600]}`|
|12|`{"weight":[6000,4000],"award":[[2921200,180],[101500,10000]],"item_show_rate":[240,160]}`|
|301|`{"weight":[5000,5000],"award":[[101500,100],[5101200,1]],"item_show_rate":[100,100]}`|
|302|`{"weight":[5000,5000],"award":[[101500,300],[5101200,3]],"item_show_rate":[300,300]}`|
|303|`{"weight":[8000,2000],"award":[[101500,800],[5071200,1]],"item_show_rate":[5040,1260]}`|
|304|`{"weight":[5000,5000],"award":[[820302,2],[5081200,1]],"item_show_rate":[950,950]}`|
|305|`{"weight":[5000,5000],"award":[[820302,2],[820302,3]],"item_show_rate":[350,350]}`|
|306|`{"weight":[5000],"award":[[5091200,1]],"item_show_rate":[300]}`|
|401|`{"weight":[5000,5000],"award":[[101500,100],[5101200,1]],"item_show_rate":[100,100]}`|
|402|`{"weight":[5000,5000],"award":[[101500,300],[5101200,3]],"item_show_rate":[300,300]}`|
|403|`{"weight":[8000,2000],"award":[[101500,800],[2002,5]],"item_show_rate":[5040,1260]}`|
|404|`{"weight":[5000,5000],"award":[[820302,2],[3002,5]],"item_show_rate":[950,950]}`|
|405|`{"weight":[5000,5000],"award":[[820302,2],[820302,3]],"item_show_rate":[350,350]}`|
|406|`{"weight":[5000],"award":[[5151200,1]],"item_show_rate":[300]}`|
|501|`{"weight":[5000,5000],"award":[[101500,100],[5101200,1]],"item_show_rate":[100,100]}`|
|502|`{"weight":[5000,5000],"award":[[101500,300],[5101200,3]],"item_show_rate":[300,300]}`|
|503|`{"weight":[8000,2000],"award":[[101500,800],[2002,5]],"item_show_rate":[5040,1260]}`|
|504|`{"weight":[5000,5000],"award":[[820302,2],[3002,5]],"item_show_rate":[950,950]}`|
|505|`{"weight":[5000,5000],"award":[[820302,2],[820302,3]],"item_show_rate":[350,350]}`|
|506|`{"weight":[5000],"award":[[5261200,1]],"item_show_rate":[300]}`|

## Ver

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|use_item|array|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|limit_flop_card|number|5|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|gift_act|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|acc_award_lib|number|5|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|flop_card_times|array|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|shop_act|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"use_item":[[820202,3],[820202,3],[820202,1]],"limit_flop_card":7,"acc_award_lib":1,"flop_card_times":[3,4,1]}`|
|2|`{"use_item":[[820202,3],[820202,3],[820202,1]],"limit_flop_card":7,"acc_award_lib":2,"flop_card_times":[3,4,1]}`|
|3|`{"use_item":[[820202,3],[820202,3],[820202,1]],"limit_flop_card":7,"acc_award_lib":3,"flop_card_times":[3,4,1]}`|
|4|`{"use_item":[[820202,3],[820202,3],[820202,1]],"limit_flop_card":7,"acc_award_lib":4,"flop_card_times":[3,4,1]}`|
|5|`{"use_item":[[820202,3],[820202,3],[820202,1]],"limit_flop_card":7,"acc_award_lib":5,"flop_card_times":[3,4,1]}`|

## CardHandRankShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|award_group|number|30|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|hand_rank_little_decc|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|special_card_count|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|version|number|30|版本引用；必须按活动类型及其消费者查对应版本表。|
|tid|number|30|本表行键；与其他表同值不自动代表同一对象。|
|normal_card_count|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hand_rank_desc|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hand_rank_name|number|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award_group":1,"hand_rank_little_decc":683192,"special_card_count":0,"version":1,"normal_card_count":1,"hand_rank_desc":683213,"hand_rank_name":683199}`|
|2|`{"award_group":2,"hand_rank_little_decc":683192,"special_card_count":0,"version":1,"normal_card_count":2,"hand_rank_desc":683214,"hand_rank_name":683200}`|
|3|`{"award_group":3,"hand_rank_little_decc":683192,"special_card_count":0,"version":1,"normal_card_count":3,"hand_rank_desc":683215,"hand_rank_name":683201}`|
|4|`{"award_group":4,"hand_rank_little_decc":683192,"special_card_count":0,"version":1,"normal_card_count":4,"hand_rank_desc":683216,"hand_rank_name":683202}`|
|5|`{"award_group":5,"hand_rank_little_decc":683192,"special_card_count":0,"version":1,"normal_card_count":5,"hand_rank_desc":683217,"hand_rank_name":683203}`|
|6|`{"award_group":6,"hand_rank_little_decc":0,"special_card_count":1,"version":1,"normal_card_count":6,"hand_rank_desc":683212,"hand_rank_name":683615}`|
|7|`{"award_group":7,"hand_rank_little_decc":683192,"special_card_count":0,"version":2,"normal_card_count":1,"hand_rank_desc":683213,"hand_rank_name":683199}`|
|8|`{"award_group":8,"hand_rank_little_decc":683192,"special_card_count":0,"version":2,"normal_card_count":2,"hand_rank_desc":683214,"hand_rank_name":683200}`|
|9|`{"award_group":9,"hand_rank_little_decc":683192,"special_card_count":0,"version":2,"normal_card_count":3,"hand_rank_desc":683215,"hand_rank_name":683201}`|
|10|`{"award_group":10,"hand_rank_little_decc":683192,"special_card_count":0,"version":2,"normal_card_count":4,"hand_rank_desc":683216,"hand_rank_name":683202}`|
|11|`{"award_group":11,"hand_rank_little_decc":683192,"special_card_count":0,"version":2,"normal_card_count":5,"hand_rank_desc":683217,"hand_rank_name":683203}`|
|12|`{"award_group":12,"hand_rank_little_decc":683192,"special_card_count":1,"version":2,"normal_card_count":6,"hand_rank_desc":683212,"hand_rank_name":683615}`|
|301|`{"award_group":301,"hand_rank_little_decc":683192,"special_card_count":0,"version":3,"normal_card_count":1,"hand_rank_desc":683213,"hand_rank_name":683199}`|
|302|`{"award_group":302,"hand_rank_little_decc":683192,"special_card_count":0,"version":3,"normal_card_count":2,"hand_rank_desc":683214,"hand_rank_name":683200}`|
|303|`{"award_group":303,"hand_rank_little_decc":683192,"special_card_count":0,"version":3,"normal_card_count":3,"hand_rank_desc":683215,"hand_rank_name":683201}`|
|304|`{"award_group":304,"hand_rank_little_decc":683192,"special_card_count":0,"version":3,"normal_card_count":4,"hand_rank_desc":683216,"hand_rank_name":683202}`|
|305|`{"award_group":305,"hand_rank_little_decc":683192,"special_card_count":0,"version":3,"normal_card_count":5,"hand_rank_desc":683217,"hand_rank_name":683203}`|
|306|`{"award_group":306,"hand_rank_little_decc":683192,"special_card_count":1,"version":3,"normal_card_count":6,"hand_rank_desc":683212,"hand_rank_name":683615}`|
|401|`{"award_group":401,"hand_rank_little_decc":683192,"special_card_count":0,"version":4,"normal_card_count":1,"hand_rank_desc":683213,"hand_rank_name":683199}`|
|402|`{"award_group":402,"hand_rank_little_decc":683192,"special_card_count":0,"version":4,"normal_card_count":2,"hand_rank_desc":683214,"hand_rank_name":683200}`|
|403|`{"award_group":403,"hand_rank_little_decc":683192,"special_card_count":0,"version":4,"normal_card_count":3,"hand_rank_desc":683215,"hand_rank_name":683201}`|
|404|`{"award_group":404,"hand_rank_little_decc":683192,"special_card_count":0,"version":4,"normal_card_count":4,"hand_rank_desc":683216,"hand_rank_name":683202}`|
|405|`{"award_group":405,"hand_rank_little_decc":683192,"special_card_count":0,"version":4,"normal_card_count":5,"hand_rank_desc":683217,"hand_rank_name":683203}`|
|406|`{"award_group":406,"hand_rank_little_decc":683192,"special_card_count":1,"version":4,"normal_card_count":6,"hand_rank_desc":683212,"hand_rank_name":683615}`|
|501|`{"award_group":501,"hand_rank_little_decc":683192,"special_card_count":0,"version":5,"normal_card_count":1,"hand_rank_desc":683213,"hand_rank_name":683199}`|
|502|`{"award_group":502,"hand_rank_little_decc":683192,"special_card_count":0,"version":5,"normal_card_count":2,"hand_rank_desc":683214,"hand_rank_name":683200}`|
|503|`{"award_group":503,"hand_rank_little_decc":683192,"special_card_count":0,"version":5,"normal_card_count":3,"hand_rank_desc":683215,"hand_rank_name":683201}`|
|504|`{"award_group":504,"hand_rank_little_decc":683192,"special_card_count":0,"version":5,"normal_card_count":4,"hand_rank_desc":683216,"hand_rank_name":683202}`|
|505|`{"award_group":505,"hand_rank_little_decc":683192,"special_card_count":0,"version":5,"normal_card_count":5,"hand_rank_desc":683217,"hand_rank_name":683203}`|
|506|`{"award_group":506,"hand_rank_little_decc":683192,"special_card_count":1,"version":5,"normal_card_count":6,"hand_rank_desc":683212,"hand_rank_name":683615}`|

## CardHandRank

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|award_group|number|35|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|version|number|35|版本引用；必须按活动类型及其消费者查对应版本表。|
|tid|number|35|本表行键；与其他表同值不自动代表同一对象。|
|sort|number|35|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|same_card_count|number|35|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_hide_effect|boolean|35|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hand_rank_little_decc|number|35|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|card_type|array|35|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_jackpot|boolean|35|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hand_rank_name|number|35|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award_group":1,"version":1,"same_card_count":1,"is_hide_effect":true,"hand_rank_little_decc":683192,"card_type":[1,2,3],"is_jackpot":false,"hand_rank_name":683199}`|
|2|`{"award_group":2,"version":1,"same_card_count":2,"is_hide_effect":false,"hand_rank_little_decc":683192,"card_type":[1,2,3],"is_jackpot":false,"hand_rank_name":683200}`|
|3|`{"award_group":3,"version":1,"same_card_count":3,"is_hide_effect":false,"hand_rank_little_decc":683192,"card_type":[1,2,3],"is_jackpot":false,"hand_rank_name":683201}`|
|4|`{"award_group":4,"version":1,"same_card_count":4,"is_hide_effect":false,"hand_rank_little_decc":683192,"card_type":[1,2,3],"is_jackpot":false,"hand_rank_name":683202}`|
|5|`{"award_group":5,"version":1,"same_card_count":5,"is_hide_effect":false,"hand_rank_little_decc":683192,"card_type":[1,2,3],"is_jackpot":false,"hand_rank_name":683203}`|
|6|`{"award_group":6,"version":1,"same_card_count":6,"is_hide_effect":false,"hand_rank_little_decc":683192,"card_type":[1,2,3],"is_jackpot":true,"hand_rank_name":683204}`|
|7|`{"award_group":6,"version":1,"same_card_count":1,"is_hide_effect":false,"hand_rank_little_decc":683218,"card_type":[4],"is_jackpot":true,"hand_rank_name":0}`|
|8|`{"award_group":7,"version":2,"same_card_count":1,"is_hide_effect":true,"hand_rank_little_decc":683192,"card_type":[1,2,3],"is_jackpot":false,"hand_rank_name":683199}`|
|9|`{"award_group":8,"version":2,"same_card_count":2,"is_hide_effect":false,"hand_rank_little_decc":683192,"card_type":[1,2,3],"is_jackpot":false,"hand_rank_name":683200}`|
|10|`{"award_group":9,"version":2,"same_card_count":3,"is_hide_effect":false,"hand_rank_little_decc":683192,"card_type":[1,2,3],"is_jackpot":false,"hand_rank_name":683201}`|
|11|`{"award_group":10,"version":2,"same_card_count":4,"is_hide_effect":false,"hand_rank_little_decc":683192,"card_type":[1,2,3],"is_jackpot":false,"hand_rank_name":683202}`|
|12|`{"award_group":11,"version":2,"same_card_count":5,"is_hide_effect":false,"hand_rank_little_decc":683192,"card_type":[1,2,3],"is_jackpot":false,"hand_rank_name":683203}`|
|13|`{"award_group":12,"version":2,"same_card_count":6,"is_hide_effect":false,"hand_rank_little_decc":683192,"card_type":[1,2,3],"is_jackpot":true,"hand_rank_name":683204}`|
|14|`{"award_group":12,"version":2,"same_card_count":1,"is_hide_effect":false,"hand_rank_little_decc":683192,"card_type":[4],"is_jackpot":true,"hand_rank_name":0}`|
|301|`{"award_group":301,"version":3,"same_card_count":1,"is_hide_effect":true,"hand_rank_little_decc":683192,"card_type":[1,2,3],"is_jackpot":false,"hand_rank_name":683199}`|
|302|`{"award_group":302,"version":3,"same_card_count":2,"is_hide_effect":false,"hand_rank_little_decc":683192,"card_type":[1,2,3],"is_jackpot":false,"hand_rank_name":683200}`|
|303|`{"award_group":303,"version":3,"same_card_count":3,"is_hide_effect":false,"hand_rank_little_decc":683192,"card_type":[1,2,3],"is_jackpot":false,"hand_rank_name":683201}`|
|304|`{"award_group":304,"version":3,"same_card_count":4,"is_hide_effect":false,"hand_rank_little_decc":683192,"card_type":[1,2,3],"is_jackpot":false,"hand_rank_name":683202}`|
|305|`{"award_group":305,"version":3,"same_card_count":5,"is_hide_effect":false,"hand_rank_little_decc":683192,"card_type":[1,2,3],"is_jackpot":false,"hand_rank_name":683203}`|
|306|`{"award_group":306,"version":3,"same_card_count":6,"is_hide_effect":false,"hand_rank_little_decc":683192,"card_type":[1,2,3],"is_jackpot":true,"hand_rank_name":683204}`|
|307|`{"award_group":306,"version":3,"same_card_count":1,"is_hide_effect":false,"hand_rank_little_decc":683192,"card_type":[4],"is_jackpot":true,"hand_rank_name":0}`|
|401|`{"award_group":401,"version":4,"same_card_count":1,"is_hide_effect":true,"hand_rank_little_decc":683192,"card_type":[1,2,3],"is_jackpot":false,"hand_rank_name":683199}`|
|402|`{"award_group":402,"version":4,"same_card_count":2,"is_hide_effect":false,"hand_rank_little_decc":683192,"card_type":[1,2,3],"is_jackpot":false,"hand_rank_name":683200}`|
|403|`{"award_group":403,"version":4,"same_card_count":3,"is_hide_effect":false,"hand_rank_little_decc":683192,"card_type":[1,2,3],"is_jackpot":false,"hand_rank_name":683201}`|
|404|`{"award_group":404,"version":4,"same_card_count":4,"is_hide_effect":false,"hand_rank_little_decc":683192,"card_type":[1,2,3],"is_jackpot":false,"hand_rank_name":683202}`|
|405|`{"award_group":405,"version":4,"same_card_count":5,"is_hide_effect":false,"hand_rank_little_decc":683192,"card_type":[1,2,3],"is_jackpot":false,"hand_rank_name":683203}`|
|406|`{"award_group":406,"version":4,"same_card_count":6,"is_hide_effect":false,"hand_rank_little_decc":683192,"card_type":[1,2,3],"is_jackpot":true,"hand_rank_name":683204}`|
|407|`{"award_group":406,"version":4,"same_card_count":1,"is_hide_effect":false,"hand_rank_little_decc":683192,"card_type":[4],"is_jackpot":true,"hand_rank_name":0}`|
|501|`{"award_group":501,"version":5,"same_card_count":1,"is_hide_effect":true,"hand_rank_little_decc":683192,"card_type":[1,2,3],"is_jackpot":false,"hand_rank_name":683199}`|
|502|`{"award_group":502,"version":5,"same_card_count":2,"is_hide_effect":false,"hand_rank_little_decc":683192,"card_type":[1,2,3],"is_jackpot":false,"hand_rank_name":683200}`|
|503|`{"award_group":503,"version":5,"same_card_count":3,"is_hide_effect":false,"hand_rank_little_decc":683192,"card_type":[1,2,3],"is_jackpot":false,"hand_rank_name":683201}`|
|504|`{"award_group":504,"version":5,"same_card_count":4,"is_hide_effect":false,"hand_rank_little_decc":683192,"card_type":[1,2,3],"is_jackpot":false,"hand_rank_name":683202}`|
|505|`{"award_group":505,"version":5,"same_card_count":5,"is_hide_effect":false,"hand_rank_little_decc":683192,"card_type":[1,2,3],"is_jackpot":false,"hand_rank_name":683203}`|
|506|`{"award_group":506,"version":5,"same_card_count":6,"is_hide_effect":false,"hand_rank_little_decc":683192,"card_type":[1,2,3],"is_jackpot":true,"hand_rank_name":683204}`|
|507|`{"award_group":506,"version":5,"same_card_count":1,"is_hide_effect":false,"hand_rank_little_decc":683192,"card_type":[4],"is_jackpot":true,"hand_rank_name":0}`|

## AccAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|cond_val|number|130|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lib|number|130|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|130|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|index|number|130|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|130|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"cond_val":50,"lib":1,"award":[[820302,2]]}`|
|102|`{"cond_val":80,"lib":1,"award":[[500121,20]]}`|
|103|`{"cond_val":110,"lib":1,"award":[[820302,2]]}`|
|104|`{"cond_val":150,"lib":1,"award":[[500121,20]]}`|
|105|`{"cond_val":200,"lib":1,"award":[[820302,3]]}`|
|106|`{"cond_val":250,"lib":1,"award":[[500121,20]]}`|
|107|`{"cond_val":350,"lib":1,"award":[[101500,5000]]}`|
|108|`{"cond_val":450,"lib":1,"award":[[500121,20]]}`|
|109|`{"cond_val":550,"lib":1,"award":[[820302,5]]}`|
|110|`{"cond_val":650,"lib":1,"award":[[500121,20]]}`|
|111|`{"cond_val":750,"lib":1,"award":[[5001200,20]]}`|
|112|`{"cond_val":850,"lib":1,"award":[[101500,8000]]}`|
|113|`{"cond_val":1000,"lib":1,"award":[[5001200,20]]}`|
|114|`{"cond_val":1150,"lib":1,"award":[[820302,10]]}`|
|115|`{"cond_val":1300,"lib":1,"award":[[5001200,40]]}`|
|116|`{"cond_val":1450,"lib":1,"award":[[820302,10]]}`|
|117|`{"cond_val":1600,"lib":1,"award":[[5001200,40]]}`|
|118|`{"cond_val":1750,"lib":1,"award":[[820302,10]]}`|
|119|`{"cond_val":1900,"lib":1,"award":[[5001200,40]]}`|
|120|`{"cond_val":2050,"lib":1,"award":[[820302,15]]}`|
|121|`{"cond_val":2250,"lib":1,"award":[[820302,20]]}`|
|122|`{"cond_val":2500,"lib":1,"award":[[820302,25]]}`|
|201|`{"cond_val":50,"lib":2,"award":[[820302,5]]}`|
|202|`{"cond_val":80,"lib":2,"award":[[3002,5]]}`|
|203|`{"cond_val":110,"lib":2,"award":[[101500,500]]}`|
|204|`{"cond_val":150,"lib":2,"award":[[2921200,60]]}`|
|205|`{"cond_val":200,"lib":2,"award":[[3002,5]]}`|
|206|`{"cond_val":250,"lib":2,"award":[[820302,10]]}`|
|207|`{"cond_val":350,"lib":2,"award":[[101500,1000]]}`|
|208|`{"cond_val":450,"lib":2,"award":[[2921200,120]]}`|
|209|`{"cond_val":550,"lib":2,"award":[[820302,10]]}`|
|210|`{"cond_val":650,"lib":2,"award":[[2921200,120]]}`|
|211|`{"cond_val":750,"lib":2,"award":[[3002,10]]}`|
|212|`{"cond_val":850,"lib":2,"award":[[820302,10]]}`|
|213|`{"cond_val":1000,"lib":2,"award":[[2921200,120]]}`|
|214|`{"cond_val":1150,"lib":2,"award":[[820302,20]]}`|
|215|`{"cond_val":1300,"lib":2,"award":[[2921200,120]]}`|
|216|`{"cond_val":1450,"lib":2,"award":[[820302,20]]}`|
|217|`{"cond_val":1600,"lib":2,"award":[[2921200,120]]}`|
|218|`{"cond_val":1750,"lib":2,"award":[[820302,20]]}`|
|219|`{"cond_val":1900,"lib":2,"award":[[2921200,120]]}`|
|220|`{"cond_val":2050,"lib":2,"award":[[820302,30]]}`|
|221|`{"cond_val":2250,"lib":2,"award":[[2921200,180]]}`|
|222|`{"cond_val":2500,"lib":2,"award":[[820302,40]]}`|
|301|`{"cond_val":50,"lib":3,"award":[[101500,500]]}`|
|302|`{"cond_val":80,"lib":3,"award":[[820302,2]]}`|
|303|`{"cond_val":110,"lib":3,"award":[[101500,500]]}`|
|304|`{"cond_val":150,"lib":3,"award":[[820302,2]]}`|
|305|`{"cond_val":200,"lib":3,"award":[[101500,1000]]}`|
|306|`{"cond_val":250,"lib":3,"award":[[820302,3]]}`|
|307|`{"cond_val":300,"lib":3,"award":[[101500,1000]]}`|
|308|`{"cond_val":400,"lib":3,"award":[[820302,3]]}`|
|309|`{"cond_val":500,"lib":3,"award":[[101500,1000]]}`|
|310|`{"cond_val":600,"lib":3,"award":[[820302,3]]}`|
|311|`{"cond_val":700,"lib":3,"award":[[101500,1000]]}`|
|312|`{"cond_val":850,"lib":3,"award":[[820302,3]]}`|
|313|`{"cond_val":1000,"lib":3,"award":[[101500,2000]]}`|
|314|`{"cond_val":1150,"lib":3,"award":[[820302,4]]}`|
|315|`{"cond_val":1300,"lib":3,"award":[[101500,2000]]}`|
|316|`{"cond_val":1450,"lib":3,"award":[[820302,4]]}`|
|317|`{"cond_val":1600,"lib":3,"award":[[101500,2000]]}`|
|318|`{"cond_val":1750,"lib":3,"award":[[820302,4]]}`|
|319|`{"cond_val":1900,"lib":3,"award":[[101500,2000]]}`|
|320|`{"cond_val":2050,"lib":3,"award":[[820302,4]]}`|
|321|`{"cond_val":2250,"lib":3,"award":[[101500,3000]]}`|
|322|`{"cond_val":2500,"lib":3,"award":[[5091200,1]]}`|
|401|`{"cond_val":50,"lib":4,"award":[[101500,500]]}`|
|402|`{"cond_val":80,"lib":4,"award":[[820302,2]]}`|
|403|`{"cond_val":110,"lib":4,"award":[[101500,500]]}`|
|404|`{"cond_val":150,"lib":4,"award":[[3002,10]]}`|
|405|`{"cond_val":200,"lib":4,"award":[[101500,1000]]}`|
|406|`{"cond_val":250,"lib":4,"award":[[820302,2]]}`|
|407|`{"cond_val":300,"lib":4,"award":[[101500,1000]]}`|
|408|`{"cond_val":400,"lib":4,"award":[[820302,3]]}`|
|409|`{"cond_val":500,"lib":4,"award":[[101500,1000]]}`|
|410|`{"cond_val":600,"lib":4,"award":[[820302,3]]}`|
|411|`{"cond_val":700,"lib":4,"award":[[101500,1000]]}`|
|412|`{"cond_val":850,"lib":4,"award":[[820302,3]]}`|
|413|`{"cond_val":1000,"lib":4,"award":[[5151200,1]]}`|
|414|`{"cond_val":1150,"lib":4,"award":[[820302,3]]}`|
|415|`{"cond_val":1300,"lib":4,"award":[[101500,2000]]}`|
|416|`{"cond_val":1450,"lib":4,"award":[[820302,4]]}`|
|417|`{"cond_val":1600,"lib":4,"award":[[101500,2000]]}`|
|418|`{"cond_val":1750,"lib":4,"award":[[820302,4]]}`|
|419|`{"cond_val":1900,"lib":4,"award":[[101500,2000]]}`|
|420|`{"cond_val":2050,"lib":4,"award":[[820302,2]]}`|
|421|`{"cond_val":2250,"lib":4,"award":[[5151200,1]]}`|
|422|`{"cond_val":2500,"lib":4,"award":[[5151200,1]]}`|
|501|`{"cond_val":50,"lib":5,"award":[[101500,500]]}`|
|502|`{"cond_val":80,"lib":5,"award":[[820302,2]]}`|
|503|`{"cond_val":110,"lib":5,"award":[[101500,500]]}`|
|504|`{"cond_val":150,"lib":5,"award":[[820302,3]]}`|
|505|`{"cond_val":200,"lib":5,"award":[[101500,1000]]}`|
|506|`{"cond_val":250,"lib":5,"award":[[820302,4]]}`|
|507|`{"cond_val":300,"lib":5,"award":[[101500,1000]]}`|
|508|`{"cond_val":400,"lib":5,"award":[[820302,5]]}`|
|509|`{"cond_val":500,"lib":5,"award":[[5261200,1]]}`|
|510|`{"cond_val":600,"lib":5,"award":[[5261200,1]]}`|
|511|`{"cond_val":700,"lib":5,"award":[[101500,1000]]}`|
|512|`{"cond_val":850,"lib":5,"award":[[820302,5]]}`|
|513|`{"cond_val":1000,"lib":5,"award":[[5261200,1]]}`|
|514|`{"cond_val":1150,"lib":5,"award":[[820302,8]]}`|
|515|`{"cond_val":1300,"lib":5,"award":[[5261200,1]]}`|
|516|`{"cond_val":1450,"lib":5,"award":[[820302,8]]}`|
|517|`{"cond_val":1600,"lib":5,"award":[[5261200,1]]}`|
|518|`{"cond_val":1750,"lib":5,"award":[[820302,8]]}`|
|519|`{"cond_val":1900,"lib":5,"award":[[5261200,1]]}`|
|520|`{"cond_val":2050,"lib":5,"award":[[820302,8]]}`|
|521|`{"cond_val":2250,"lib":5,"award":[[5261200,1]]}`|
|522|`{"cond_val":2500,"lib":5,"award":[[820302,8]]}`|
|10101|`{"cond_val":15,"lib":999,"award":[[820202,5]]}`|
|10102|`{"cond_val":110,"lib":999,"award":[[820202,5]]}`|
|10103|`{"cond_val":180,"lib":999,"award":[[820202,5]]}`|
|10104|`{"cond_val":260,"lib":999,"award":[[820202,5]]}`|
|10105|`{"cond_val":320,"lib":999,"award":[[820202,5]]}`|
|10106|`{"cond_val":380,"lib":999,"award":[[820202,5]]}`|
|10107|`{"cond_val":500,"lib":999,"award":[[820202,20]]}`|
|10108|`{"cond_val":600,"lib":999,"award":[[820202,10]]}`|
|10109|`{"cond_val":780,"lib":999,"award":[[820202,10]]}`|
|10110|`{"cond_val":860,"lib":999,"award":[[820202,10]]}`|
|10111|`{"cond_val":15,"lib":999,"award":[[820202,5]]}`|
|10112|`{"cond_val":110,"lib":999,"award":[[820202,5]]}`|
|10113|`{"cond_val":180,"lib":999,"award":[[820202,5]]}`|
|10114|`{"cond_val":260,"lib":999,"award":[[820202,5]]}`|
|10115|`{"cond_val":320,"lib":999,"award":[[820202,5]]}`|
|10116|`{"cond_val":380,"lib":999,"award":[[820202,5]]}`|
|10117|`{"cond_val":500,"lib":999,"award":[[820202,20]]}`|
|10118|`{"cond_val":600,"lib":999,"award":[[820202,10]]}`|
|10119|`{"cond_val":780,"lib":999,"award":[[820202,10]]}`|
|10120|`{"cond_val":860,"lib":999,"award":[[820202,10]]}`|

## AccAwardLib

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|
|999|`{}`|

## Type

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
