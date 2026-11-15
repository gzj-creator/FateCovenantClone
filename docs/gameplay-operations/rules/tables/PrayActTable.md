# PrayActTable 规则参数

来源：[personal-server/assets/tables/PrayActTable.data.lua.json.gz](../../../../personal-server/assets/tables/PrayActTable.data.lua.json.gz)，SHA256：`fb33a959b577c2b7c787fd9901649566bff26c82086a4e3263f6669440ee3dd3`。

[完整逐行JSON](PrayActTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[AwardIndex](#awardindex)|95|decoded-rows|
|[AwardRation](#awardration)|7|decoded-rows|
|[Award](#award)|363|decoded-rows|
|[AwardGroup](#awardgroup)|1|decoded-rows|
|[Red](#red)|19|decoded-rows|
|[PrayAct](#prayact)|19|decoded-rows|
|[Show](#show)|19|decoded-rows|

## AwardIndex

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|progress_val|number|95|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|normal_val|number|95|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|95|本表行键；与其他表同值不自动代表同一对象。|
|version|number|95|版本引用；必须按活动类型及其消费者查对应版本表。|
|critical_ration|number|95|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|critical_val|array|95|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"progress_val":100,"version":1}`|
|2|`{"progress_val":100,"version":1}`|
|3|`{"progress_val":100,"version":1}`|
|4|`{"progress_val":100,"version":1}`|
|5|`{"progress_val":100,"version":1}`|
|6|`{"progress_val":100,"version":2}`|
|7|`{"progress_val":100,"version":2}`|
|8|`{"progress_val":100,"version":2}`|
|9|`{"progress_val":100,"version":2}`|
|10|`{"progress_val":100,"version":2}`|
|11|`{"progress_val":100,"version":3}`|
|12|`{"progress_val":100,"version":3}`|
|13|`{"progress_val":100,"version":3}`|
|14|`{"progress_val":100,"version":3}`|
|15|`{"progress_val":100,"version":3}`|
|16|`{"progress_val":100,"version":4}`|
|17|`{"progress_val":100,"version":4}`|
|18|`{"progress_val":100,"version":4}`|
|19|`{"progress_val":100,"version":4}`|
|20|`{"progress_val":100,"version":4}`|
|21|`{"progress_val":100,"version":5}`|
|22|`{"progress_val":100,"version":5}`|
|23|`{"progress_val":100,"version":5}`|
|24|`{"progress_val":100,"version":5}`|
|25|`{"progress_val":100,"version":5}`|
|26|`{"progress_val":100,"version":6}`|
|27|`{"progress_val":100,"version":6}`|
|28|`{"progress_val":100,"version":6}`|
|29|`{"progress_val":100,"version":6}`|
|30|`{"progress_val":100,"version":6}`|
|31|`{"progress_val":100,"version":7}`|
|32|`{"progress_val":100,"version":7}`|
|33|`{"progress_val":100,"version":7}`|
|34|`{"progress_val":100,"version":7}`|
|35|`{"progress_val":100,"version":7}`|
|36|`{"progress_val":100,"version":8}`|
|37|`{"progress_val":100,"version":8}`|
|38|`{"progress_val":100,"version":8}`|
|39|`{"progress_val":100,"version":8}`|
|40|`{"progress_val":100,"version":8}`|
|41|`{"progress_val":100,"version":9}`|
|42|`{"progress_val":100,"version":9}`|
|43|`{"progress_val":100,"version":9}`|
|44|`{"progress_val":100,"version":9}`|
|45|`{"progress_val":100,"version":9}`|
|46|`{"progress_val":100,"version":10}`|
|47|`{"progress_val":100,"version":10}`|
|48|`{"progress_val":100,"version":10}`|
|49|`{"progress_val":100,"version":10}`|
|50|`{"progress_val":100,"version":10}`|
|51|`{"progress_val":100,"version":11}`|
|52|`{"progress_val":100,"version":11}`|
|53|`{"progress_val":100,"version":11}`|
|54|`{"progress_val":100,"version":11}`|
|55|`{"progress_val":100,"version":11}`|
|56|`{"progress_val":100,"version":12}`|
|57|`{"progress_val":100,"version":12}`|
|58|`{"progress_val":100,"version":12}`|
|59|`{"progress_val":100,"version":12}`|
|60|`{"progress_val":100,"version":12}`|
|61|`{"progress_val":100,"version":13}`|
|62|`{"progress_val":100,"version":13}`|
|63|`{"progress_val":100,"version":13}`|
|64|`{"progress_val":100,"version":13}`|
|65|`{"progress_val":100,"version":13}`|
|66|`{"progress_val":100,"version":14}`|
|67|`{"progress_val":100,"version":14}`|
|68|`{"progress_val":100,"version":14}`|
|69|`{"progress_val":100,"version":14}`|
|70|`{"progress_val":100,"version":14}`|
|71|`{"progress_val":100,"version":15}`|
|72|`{"progress_val":100,"version":15}`|
|73|`{"progress_val":100,"version":15}`|
|74|`{"progress_val":100,"version":15}`|
|75|`{"progress_val":100,"version":15}`|
|76|`{"progress_val":100,"version":16}`|
|77|`{"progress_val":100,"version":16}`|
|78|`{"progress_val":100,"version":16}`|
|79|`{"progress_val":100,"version":16}`|
|80|`{"progress_val":100,"version":16}`|
|81|`{"progress_val":100,"version":17}`|
|82|`{"progress_val":100,"version":17}`|
|83|`{"progress_val":100,"version":17}`|
|84|`{"progress_val":100,"version":17}`|
|85|`{"progress_val":100,"version":17}`|
|86|`{"progress_val":100,"version":18}`|
|87|`{"progress_val":100,"version":18}`|
|88|`{"progress_val":100,"version":18}`|
|89|`{"progress_val":100,"version":18}`|
|90|`{"progress_val":100,"version":18}`|
|91|`{"progress_val":100,"version":19}`|
|92|`{"progress_val":100,"version":19}`|
|93|`{"progress_val":100,"version":19}`|
|94|`{"progress_val":100,"version":19}`|
|95|`{"progress_val":100,"version":19}`|

## AwardRation

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|pray_group|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|target_cnt|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|direct_ration|array|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|7|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"pray_group":1,"target_cnt":20}`|
|2|`{"pray_group":1,"target_cnt":30}`|
|3|`{"pray_group":1,"target_cnt":40}`|
|4|`{"pray_group":1,"target_cnt":50}`|
|5|`{"pray_group":1,"target_cnt":60}`|
|6|`{"pray_group":1,"target_cnt":80}`|
|7|`{"pray_group":1,"target_cnt":100}`|

## Award

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|sort_key|number|363|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|363|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|tid|number|363|本表行键；与其他表同值不自动代表同一对象。|
|pray_index|number|363|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|on_off_condition|undefined|363|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部363行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award":[[3791200,1]]}`|
|2|`{"award":[[3801200,1]]}`|
|3|`{"award":[[3811200,1]]}`|

## AwardGroup

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|

## Red

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|shop_red|number|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|shop_red_param|number|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|19|本表行键；与其他表同值不自动代表同一对象。|
|gift_red_param|number|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|gift_red|number|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

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
|11|`{}`|
|12|`{}`|
|13|`{}`|
|14|`{}`|
|15|`{}`|
|16|`{}`|
|17|`{}`|
|18|`{}`|
|19|`{}`|

## PrayAct

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|pop_title|number|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|res_exchange|number|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|19|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|direct_group|number|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|consume_tid|number|19|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|title|number|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|shop_fun_open|number|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|consume_cnt|number|19|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|gift_fun_open|number|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|help|number|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|send_msg|number|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|act_shop|number|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|form_prefab|string|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|act_gift|number|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|19|本表行键；与其他表同值不自动代表同一对象。|
|pop_two_title|number|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"res_exchange":32,"award":[[6821900,100]],"direct_group":1,"consume_tid":816002,"shop_fun_open":1539,"consume_cnt":1,"gift_fun_open":1541}`|
|2|`{"res_exchange":32,"award":[[6821900,100]],"direct_group":1,"consume_tid":816002,"shop_fun_open":1539,"consume_cnt":1,"gift_fun_open":1541}`|
|3|`{"res_exchange":36,"award":[[6821900,100]],"direct_group":1,"consume_tid":842002,"shop_fun_open":1539,"consume_cnt":1,"gift_fun_open":1541}`|
|4|`{"res_exchange":36,"award":[[6821900,100]],"direct_group":1,"consume_tid":842002,"shop_fun_open":1539,"consume_cnt":1,"gift_fun_open":1541}`|
|5|`{"res_exchange":32,"award":[[6821900,100]],"direct_group":1,"consume_tid":816002,"shop_fun_open":1539,"consume_cnt":1,"gift_fun_open":1541}`|
|6|`{"res_exchange":32,"award":[[6821900,100]],"direct_group":1,"consume_tid":816002,"shop_fun_open":1539,"consume_cnt":1,"gift_fun_open":1541}`|
|7|`{"res_exchange":32,"award":[[6821900,100]],"direct_group":1,"consume_tid":816002,"shop_fun_open":1539,"consume_cnt":1,"gift_fun_open":1541}`|
|8|`{"res_exchange":32,"award":[[6821900,100]],"direct_group":1,"consume_tid":816002,"shop_fun_open":1539,"consume_cnt":1,"gift_fun_open":1541}`|
|9|`{"res_exchange":32,"award":[[6821900,100]],"direct_group":1,"consume_tid":816002,"shop_fun_open":1539,"consume_cnt":1,"gift_fun_open":1541}`|
|10|`{"res_exchange":36,"award":[[6821900,100]],"direct_group":1,"consume_tid":842002,"shop_fun_open":1539,"consume_cnt":1,"gift_fun_open":1541}`|
|11|`{"res_exchange":36,"award":[[6821900,100]],"direct_group":1,"consume_tid":842002,"shop_fun_open":1539,"consume_cnt":1,"gift_fun_open":1541}`|
|12|`{"res_exchange":32,"award":[[6821900,100]],"direct_group":1,"consume_tid":816002,"shop_fun_open":1539,"consume_cnt":1,"gift_fun_open":1541}`|
|13|`{"res_exchange":32,"award":[[6821900,100]],"direct_group":1,"consume_tid":816002,"shop_fun_open":1539,"consume_cnt":1,"gift_fun_open":1541}`|
|14|`{"res_exchange":32,"award":[[6821900,100]],"direct_group":1,"consume_tid":816002,"shop_fun_open":1539,"consume_cnt":1,"gift_fun_open":1541}`|
|15|`{"res_exchange":32,"award":[[6821900,100]],"direct_group":1,"consume_tid":816002,"shop_fun_open":1539,"consume_cnt":1,"gift_fun_open":1541}`|
|16|`{"res_exchange":32,"award":[[6821900,100]],"direct_group":1,"consume_tid":816002,"shop_fun_open":1539,"consume_cnt":1,"gift_fun_open":1541}`|
|17|`{"res_exchange":32,"award":[[6821900,100]],"direct_group":1,"consume_tid":816002,"shop_fun_open":1539,"consume_cnt":1,"gift_fun_open":1541}`|
|18|`{"res_exchange":32,"award":[[6821900,100]],"direct_group":1,"consume_tid":816002,"shop_fun_open":1539,"consume_cnt":1,"gift_fun_open":1541}`|
|19|`{"res_exchange":32,"award":[[6821900,100]],"direct_group":1,"consume_tid":816002,"shop_fun_open":1539,"consume_cnt":1,"gift_fun_open":1541}`|

## Show

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|txt_btn_pray|number|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|form_bg|string|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|txt_btn|array|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|19|本表行键；与其他表同值不自动代表同一对象。|
|img_btn_pray|string|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_btn|array|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|txt_title|number|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|txt_tip|number|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_tip_bg|string|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

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
|11|`{}`|
|12|`{}`|
|13|`{}`|
|14|`{}`|
|15|`{}`|
|16|`{}`|
|17|`{}`|
|18|`{}`|
|19|`{}`|
