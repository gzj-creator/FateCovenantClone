# HomePuzzleActTable 规则参数

来源：[personal-server/assets/tables/HomePuzzleActTable.data.lua.json.gz](../../../../personal-server/assets/tables/HomePuzzleActTable.data.lua.json.gz)，SHA256：`af80bb637c9674b055eb1eb3f1bb70ed7f1320df665944d21445eaa26ba10047`。

[完整逐行JSON](HomePuzzleActTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Theme](#theme)|36|decoded-rows|
|[Task](#task)|32|decoded-rows|
|[Pos](#pos)|9|decoded-rows|
|[DecomposeAward](#decomposeaward)|12|decoded-rows|
|[ProgressAward](#progressaward)|48|decoded-rows|
|[Version](#version)|4|rows-with-external-references|
|[Piece](#piece)|324|decoded-rows|
|[SocialConf](#socialconf)|4|decoded-rows|

## Theme

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|theme_id|number|36|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|piece_library|number|36|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|36|本表行键；与其他表同值不自动代表同一对象。|
|complete_award_num|number|36|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|complete_award|number|36|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|theme_name|number|36|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|thumb_icon|string|36|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|version|number|36|版本引用；必须按活动类型及其消费者查对应版本表。|
|sort|number|36|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"piece_library":1,"complete_award_num":0,"complete_award":0,"version":1}`|
|102|`{"piece_library":2,"complete_award_num":0,"complete_award":0,"version":1}`|
|103|`{"piece_library":3,"complete_award_num":0,"complete_award":0,"version":1}`|
|104|`{"piece_library":4,"complete_award_num":0,"complete_award":0,"version":1}`|
|105|`{"piece_library":5,"complete_award_num":0,"complete_award":0,"version":1}`|
|106|`{"piece_library":6,"complete_award_num":0,"complete_award":0,"version":1}`|
|107|`{"piece_library":7,"complete_award_num":0,"complete_award":0,"version":1}`|
|108|`{"piece_library":8,"complete_award_num":0,"complete_award":0,"version":1}`|
|109|`{"piece_library":9,"complete_award_num":0,"complete_award":0,"version":1}`|
|201|`{"piece_library":201,"complete_award_num":0,"complete_award":0,"version":2}`|
|202|`{"piece_library":202,"complete_award_num":0,"complete_award":0,"version":2}`|
|203|`{"piece_library":203,"complete_award_num":0,"complete_award":0,"version":2}`|
|204|`{"piece_library":204,"complete_award_num":0,"complete_award":0,"version":2}`|
|205|`{"piece_library":205,"complete_award_num":0,"complete_award":0,"version":2}`|
|206|`{"piece_library":206,"complete_award_num":0,"complete_award":0,"version":2}`|
|207|`{"piece_library":207,"complete_award_num":0,"complete_award":0,"version":2}`|
|208|`{"piece_library":208,"complete_award_num":0,"complete_award":0,"version":2}`|
|209|`{"piece_library":209,"complete_award_num":0,"complete_award":0,"version":2}`|
|301|`{"piece_library":301,"complete_award_num":0,"complete_award":0,"version":3}`|
|302|`{"piece_library":302,"complete_award_num":0,"complete_award":0,"version":3}`|
|303|`{"piece_library":303,"complete_award_num":0,"complete_award":0,"version":3}`|
|304|`{"piece_library":304,"complete_award_num":0,"complete_award":0,"version":3}`|
|305|`{"piece_library":305,"complete_award_num":0,"complete_award":0,"version":3}`|
|306|`{"piece_library":306,"complete_award_num":0,"complete_award":0,"version":3}`|
|307|`{"piece_library":307,"complete_award_num":0,"complete_award":0,"version":3}`|
|308|`{"piece_library":308,"complete_award_num":0,"complete_award":0,"version":3}`|
|309|`{"piece_library":309,"complete_award_num":0,"complete_award":0,"version":3}`|
|401|`{"piece_library":401,"complete_award_num":0,"complete_award":0,"version":4}`|
|402|`{"piece_library":402,"complete_award_num":0,"complete_award":0,"version":4}`|
|403|`{"piece_library":403,"complete_award_num":0,"complete_award":0,"version":4}`|
|404|`{"piece_library":404,"complete_award_num":0,"complete_award":0,"version":4}`|
|405|`{"piece_library":405,"complete_award_num":0,"complete_award":0,"version":4}`|
|406|`{"piece_library":406,"complete_award_num":0,"complete_award":0,"version":4}`|
|407|`{"piece_library":407,"complete_award_num":0,"complete_award":0,"version":4}`|
|408|`{"piece_library":408,"complete_award_num":0,"complete_award":0,"version":4}`|
|409|`{"piece_library":409,"complete_award_num":0,"complete_award":0,"version":4}`|

## Task

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|jump_func|number|32|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|32|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|task_type|number|32|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|version|number|32|版本引用；必须按活动类型及其消费者查对应版本表。|
|tid|number|32|本表行键；与其他表同值不自动代表同一对象。|
|task_name|number|32|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cycle_type|number|32|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|target_count|number|32|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_param|number|32|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sort|number|32|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"jump_func":0,"award":[[830102,1]],"task_type":1803,"version":1,"task_name":20273,"cycle_type":1,"target_count":1,"task_param":0}`|
|102|`{"jump_func":0,"award":[[830402,100]],"task_type":101002,"version":1,"task_name":688043,"cycle_type":1,"target_count":1,"task_param":0}`|
|103|`{"jump_func":0,"award":[[830402,50]],"task_type":4701,"version":1,"task_name":57884,"cycle_type":1,"target_count":100,"task_param":0}`|
|104|`{"jump_func":0,"award":[[830402,50]],"task_type":1805,"version":1,"task_name":20274,"cycle_type":1,"target_count":1,"task_param":0}`|
|105|`{"jump_func":0,"award":[[830402,50]],"task_type":6901,"version":1,"task_name":60399,"cycle_type":1,"target_count":1,"task_param":0}`|
|106|`{"jump_func":0,"award":[[830402,300]],"task_type":101002,"version":1,"task_name":688043,"cycle_type":2,"target_count":10,"task_param":0}`|
|107|`{"jump_func":0,"award":[[830402,300]],"task_type":1,"version":1,"task_name":676644,"cycle_type":2,"target_count":20000,"task_param":0}`|
|108|`{"jump_func":0,"award":[[830402,300]],"task_type":100810,"version":1,"task_name":61435,"cycle_type":2,"target_count":5,"task_param":0}`|
|201|`{"jump_func":0,"award":[[831102,1]],"task_type":1803,"version":2,"task_name":20273,"cycle_type":1,"target_count":1,"task_param":0}`|
|202|`{"jump_func":0,"award":[[831402,100]],"task_type":101002,"version":2,"task_name":688043,"cycle_type":1,"target_count":1,"task_param":0}`|
|203|`{"jump_func":0,"award":[[831402,50]],"task_type":4701,"version":2,"task_name":57884,"cycle_type":1,"target_count":100,"task_param":0}`|
|204|`{"jump_func":0,"award":[[831402,50]],"task_type":1805,"version":2,"task_name":20274,"cycle_type":1,"target_count":1,"task_param":0}`|
|205|`{"jump_func":0,"award":[[831402,50]],"task_type":6901,"version":2,"task_name":60399,"cycle_type":1,"target_count":1,"task_param":0}`|
|206|`{"jump_func":0,"award":[[831402,300]],"task_type":101002,"version":2,"task_name":688043,"cycle_type":2,"target_count":10,"task_param":0}`|
|207|`{"jump_func":0,"award":[[831402,300]],"task_type":1,"version":2,"task_name":676644,"cycle_type":2,"target_count":20000,"task_param":0}`|
|208|`{"jump_func":0,"award":[[831402,300]],"task_type":100810,"version":2,"task_name":61435,"cycle_type":2,"target_count":5,"task_param":0}`|
|301|`{"jump_func":0,"award":[[833102,1]],"task_type":1803,"version":3,"task_name":20273,"cycle_type":1,"target_count":1,"task_param":0}`|
|302|`{"jump_func":0,"award":[[833402,100]],"task_type":101002,"version":3,"task_name":688043,"cycle_type":1,"target_count":1,"task_param":0}`|
|303|`{"jump_func":0,"award":[[833402,50]],"task_type":4701,"version":3,"task_name":57884,"cycle_type":1,"target_count":100,"task_param":0}`|
|304|`{"jump_func":0,"award":[[833402,50]],"task_type":1805,"version":3,"task_name":20274,"cycle_type":1,"target_count":1,"task_param":0}`|
|305|`{"jump_func":0,"award":[[833402,50]],"task_type":6901,"version":3,"task_name":60399,"cycle_type":1,"target_count":1,"task_param":0}`|
|306|`{"jump_func":0,"award":[[833402,300]],"task_type":101002,"version":3,"task_name":688043,"cycle_type":2,"target_count":10,"task_param":0}`|
|307|`{"jump_func":0,"award":[[833402,300]],"task_type":1,"version":3,"task_name":676644,"cycle_type":2,"target_count":20000,"task_param":0}`|
|308|`{"jump_func":0,"award":[[833402,300]],"task_type":100810,"version":3,"task_name":61435,"cycle_type":2,"target_count":5,"task_param":0}`|
|401|`{"jump_func":0,"award":[[833602,1]],"task_type":1803,"version":4,"task_name":20273,"cycle_type":1,"target_count":1,"task_param":0}`|
|402|`{"jump_func":0,"award":[[833902,50]],"task_type":101002,"version":4,"task_name":688043,"cycle_type":1,"target_count":1,"task_param":0}`|
|403|`{"jump_func":0,"award":[[833902,100]],"task_type":4701,"version":4,"task_name":57884,"cycle_type":1,"target_count":100,"task_param":0}`|
|404|`{"jump_func":0,"award":[[833902,50]],"task_type":1805,"version":4,"task_name":20274,"cycle_type":1,"target_count":1,"task_param":0}`|
|405|`{"jump_func":0,"award":[[833902,50]],"task_type":6901,"version":4,"task_name":60399,"cycle_type":1,"target_count":1,"task_param":0}`|
|406|`{"jump_func":0,"award":[[833902,200]],"task_type":101002,"version":4,"task_name":688043,"cycle_type":2,"target_count":5,"task_param":0}`|
|407|`{"jump_func":0,"award":[[833902,350]],"task_type":1,"version":4,"task_name":676644,"cycle_type":2,"target_count":20000,"task_param":0}`|
|408|`{"jump_func":0,"award":[[833902,350]],"task_type":100810,"version":4,"task_name":61435,"cycle_type":2,"target_count":5,"task_param":0}`|

## Pos

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|9|本表行键；与其他表同值不自动代表同一对象。|
|name|number|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

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

## DecomposeAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|award_num|number|12|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|rarity|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|12|本表行键；与其他表同值不自动代表同一对象。|
|version|number|12|版本引用；必须按活动类型及其消费者查对应版本表。|
|award_item|number|12|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award_num":20,"version":1,"award_item":830402}`|
|2|`{"award_num":40,"version":1,"award_item":830402}`|
|3|`{"award_num":80,"version":1,"award_item":830402}`|
|201|`{"award_num":20,"version":2,"award_item":831402}`|
|202|`{"award_num":40,"version":2,"award_item":831402}`|
|203|`{"award_num":80,"version":2,"award_item":831402}`|
|301|`{"award_num":20,"version":3,"award_item":833402}`|
|302|`{"award_num":40,"version":3,"award_item":833402}`|
|303|`{"award_num":80,"version":3,"award_item":833402}`|
|401|`{"award_num":20,"version":4,"award_item":833902}`|
|402|`{"award_num":40,"version":4,"award_item":833902}`|
|403|`{"award_num":80,"version":4,"award_item":833902}`|

## ProgressAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|version|number|48|版本引用；必须按活动类型及其消费者查对应版本表。|
|is_final|boolean|48|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|48|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|task_type|number|48|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|48|本表行键；与其他表同值不自动代表同一对象。|
|need_count|number|48|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sort|number|48|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"version":1,"is_final":false,"award":[[101500,500]],"task_type":101001,"need_count":6}`|
|102|`{"version":1,"is_final":false,"award":[[830902,500]],"task_type":101001,"need_count":12}`|
|103|`{"version":1,"is_final":false,"award":[[101500,500]],"task_type":101001,"need_count":18}`|
|104|`{"version":1,"is_final":true,"award":[[25500604,20]],"task_type":101001,"need_count":27}`|
|105|`{"version":1,"is_final":false,"award":[[830902,1000]],"task_type":101001,"need_count":33}`|
|106|`{"version":1,"is_final":false,"award":[[101500,1000]],"task_type":101001,"need_count":39}`|
|107|`{"version":1,"is_final":false,"award":[[830902,1500]],"task_type":101001,"need_count":45}`|
|108|`{"version":1,"is_final":true,"award":[[25500604,20]],"task_type":101001,"need_count":54}`|
|109|`{"version":1,"is_final":false,"award":[[101500,1500]],"task_type":101001,"need_count":60}`|
|110|`{"version":1,"is_final":false,"award":[[830902,2000]],"task_type":101001,"need_count":66}`|
|111|`{"version":1,"is_final":false,"award":[[101500,1500]],"task_type":101001,"need_count":72}`|
|112|`{"version":1,"is_final":true,"award":[[25500604,40]],"task_type":101001,"need_count":81}`|
|201|`{"version":2,"is_final":false,"award":[[101500,500]],"task_type":101001,"need_count":6}`|
|202|`{"version":2,"is_final":false,"award":[[830902,500]],"task_type":101001,"need_count":12}`|
|203|`{"version":2,"is_final":false,"award":[[101500,500]],"task_type":101001,"need_count":18}`|
|204|`{"version":2,"is_final":true,"award":[[24400304,20]],"task_type":101001,"need_count":27}`|
|205|`{"version":2,"is_final":false,"award":[[830902,1000]],"task_type":101001,"need_count":33}`|
|206|`{"version":2,"is_final":false,"award":[[101500,1000]],"task_type":101001,"need_count":39}`|
|207|`{"version":2,"is_final":false,"award":[[830902,1500]],"task_type":101001,"need_count":45}`|
|208|`{"version":2,"is_final":true,"award":[[24400304,20]],"task_type":101001,"need_count":54}`|
|209|`{"version":2,"is_final":false,"award":[[101500,1500]],"task_type":101001,"need_count":60}`|
|210|`{"version":2,"is_final":false,"award":[[830902,2000]],"task_type":101001,"need_count":66}`|
|211|`{"version":2,"is_final":false,"award":[[101500,1500]],"task_type":101001,"need_count":72}`|
|212|`{"version":2,"is_final":true,"award":[[24400304,40]],"task_type":101001,"need_count":81}`|
|301|`{"version":3,"is_final":false,"award":[[101500,500]],"task_type":101001,"need_count":6}`|
|302|`{"version":3,"is_final":false,"award":[[830902,500]],"task_type":101001,"need_count":12}`|
|303|`{"version":3,"is_final":false,"award":[[101500,500]],"task_type":101001,"need_count":18}`|
|304|`{"version":3,"is_final":true,"award":[[24400304,20]],"task_type":101001,"need_count":27}`|
|305|`{"version":3,"is_final":false,"award":[[830902,1000]],"task_type":101001,"need_count":33}`|
|306|`{"version":3,"is_final":false,"award":[[101500,1000]],"task_type":101001,"need_count":39}`|
|307|`{"version":3,"is_final":false,"award":[[830902,1500]],"task_type":101001,"need_count":45}`|
|308|`{"version":3,"is_final":true,"award":[[24400304,20]],"task_type":101001,"need_count":54}`|
|309|`{"version":3,"is_final":false,"award":[[101500,1500]],"task_type":101001,"need_count":60}`|
|310|`{"version":3,"is_final":false,"award":[[830902,2000]],"task_type":101001,"need_count":66}`|
|311|`{"version":3,"is_final":false,"award":[[101500,1500]],"task_type":101001,"need_count":72}`|
|312|`{"version":3,"is_final":true,"award":[[24400304,40]],"task_type":101001,"need_count":81}`|
|401|`{"version":4,"is_final":false,"award":[[101500,500]],"task_type":101001,"need_count":6}`|
|402|`{"version":4,"is_final":false,"award":[[831502,500]],"task_type":101001,"need_count":12}`|
|403|`{"version":4,"is_final":false,"award":[[101500,500]],"task_type":101001,"need_count":18}`|
|404|`{"version":4,"is_final":true,"award":[[5741200,20]],"task_type":101001,"need_count":27}`|
|405|`{"version":4,"is_final":false,"award":[[831502,1000]],"task_type":101001,"need_count":33}`|
|406|`{"version":4,"is_final":false,"award":[[101500,1000]],"task_type":101001,"need_count":39}`|
|407|`{"version":4,"is_final":false,"award":[[831502,1500]],"task_type":101001,"need_count":45}`|
|408|`{"version":4,"is_final":true,"award":[[5741200,20]],"task_type":101001,"need_count":54}`|
|409|`{"version":4,"is_final":false,"award":[[101500,1500]],"task_type":101001,"need_count":60}`|
|410|`{"version":4,"is_final":false,"award":[[831502,2000]],"task_type":101001,"need_count":66}`|
|411|`{"version":4,"is_final":false,"award":[[101500,1500]],"task_type":101001,"need_count":72}`|
|412|`{"version":4,"is_final":true,"award":[[5741200,40]],"task_type":101001,"need_count":81}`|

## Version

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|currency_item|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|normal_pack_item|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|help_id|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|form|object|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|title|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|gift_act|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|shop_act|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|universal_pack_item|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|theme_num|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|piece_num|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|high_pack_item|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|decompose_open_day|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"currency_item":830402,"normal_pack_item":830102,"universal_pack_item":830302,"theme_num":9,"piece_num":81,"high_pack_item":830202,"decompose_open_day":-1}`|
|2|`{"currency_item":831402,"normal_pack_item":831102,"universal_pack_item":831302,"theme_num":9,"piece_num":81,"high_pack_item":831202,"decompose_open_day":-1}`|
|3|`{"currency_item":833402,"normal_pack_item":833102,"universal_pack_item":833302,"theme_num":9,"piece_num":81,"high_pack_item":833202,"decompose_open_day":-1}`|
|4|`{"currency_item":833902,"normal_pack_item":833602,"universal_pack_item":833802,"theme_num":9,"piece_num":81,"high_pack_item":833702,"decompose_open_day":-1}`|

## Piece

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|sort|number|324|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rarity|number|324|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|324|本表行键；与其他表同值不自动代表同一对象。|
|gift_get_award|array|324|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|pos|number|324|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|can_gift|boolean|324|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|can_decompose|boolean|324|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|version|number|324|版本引用；必须按活动类型及其消费者查对应版本表。|
|can_request|boolean|324|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部324行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10101|`{"gift_get_award":[[101500,50]],"can_gift":true,"can_decompose":true,"version":1,"can_request":true}`|
|10102|`{"gift_get_award":[[101500,50]],"can_gift":true,"can_decompose":true,"version":1,"can_request":true}`|
|10103|`{"gift_get_award":[[101500,50]],"can_gift":true,"can_decompose":true,"version":1,"can_request":true}`|

## SocialConf

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|gift_limit|number|4|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|receive_expire_day|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|request_limit|number|4|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|version|number|4|版本引用；必须按活动类型及其消费者查对应版本表。|
|reset_time|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"gift_limit":2,"receive_expire_day":3,"request_limit":2,"version":1,"reset_time":"05:00"}`|
|2|`{"gift_limit":2,"receive_expire_day":3,"request_limit":2,"version":2,"reset_time":"05:00"}`|
|3|`{"gift_limit":2,"receive_expire_day":3,"request_limit":2,"version":3,"reset_time":"05:00"}`|
|4|`{"gift_limit":2,"receive_expire_day":3,"request_limit":2,"version":4,"reset_time":"05:00"}`|
