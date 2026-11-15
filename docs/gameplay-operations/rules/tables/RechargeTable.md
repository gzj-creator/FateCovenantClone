# RechargeTable 规则参数

来源：[personal-server/assets/tables/RechargeTable.data.lua.json.gz](../../../../personal-server/assets/tables/RechargeTable.data.lua.json.gz)，SHA256：`7026b162246c961086c593dcbd9329933b4b06efceb0b8d7e5976df299479d70`。

[完整逐行JSON](RechargeTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[MailRegion](#mailregion)|2|decoded-rows|
|[Mail](#mail)|15|decoded-rows|
|[Param](#param)|1|decoded-rows|
|[GeneralAward](#generalaward)|2|decoded-rows|
|[Handle](#handle)|99|rows-with-external-references|
|[RewardAnimation](#rewardanimation)|32|decoded-rows|
|[Show](#show)|49|decoded-rows|
|[ExtraFixReward](#extrafixreward)|12|decoded-rows|
|[ExtraRewardConst](#extrarewardconst)|1|decoded-rows|
|[ExtraReward](#extrareward)|30|decoded-rows|
|[RecommendType](#recommendtype)|22|decoded-rows|
|[ExtraTimes](#extratimes)|119|decoded-rows|
|[ForeverIncreaseGift](#foreverincreasegift)|3|decoded-rows|
|[SelectPool](#selectpool)|74|decoded-rows|
|[Type](#type)|106|decoded-rows|
|[SelectGift](#selectgift)|67|decoded-rows|
|[Recharge](#recharge)|6657|decoded-rows|
|[CanBuyTimesAdd](#canbuytimesadd)|1|decoded-rows|
|[Icon](#icon)|5|decoded-rows|
|[BuyCycleLimit](#buycyclelimit)|7|decoded-rows|
|[Stall](#stall)|43|decoded-rows|
|[CurrencyCode](#currencycode)|169|decoded-rows|
|[RecommendGift](#recommendgift)|0|decoded-rows|
|[WeekAccRechargeParam](#weekaccrechargeparam)|1|decoded-rows|
|[WeekAccReward](#weekaccreward)|29|decoded-rows|
|[WeekAccRecharge](#weekaccrecharge)|4|decoded-rows|
|[GiftParam](#giftparam)|1|decoded-rows|
|[Amount](#amount)|74|decoded-rows|
|[TopPickRecommend](#toppickrecommend)|8|rows-with-external-references|
|[LoongPrice](#loongprice)|11|decoded-rows|

## MailRegion

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|all_end_tid|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|region_id|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|daily_start_tid|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|all_start_tid|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|daily_end_tid|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"daily_start_tid":1,"all_start_tid":1001}`|
|2|`{"daily_start_tid":1,"all_start_tid":1001}`|

## Mail

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|15|本表行键；与其他表同值不自动代表同一对象。|
|need_money|number|15|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|settle_mail|number|15|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_type|number|15|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"need_money":20000,"award_type":0}`|
|2|`{"need_money":60000,"award_type":0}`|
|3|`{"need_money":100000,"award_type":0}`|
|4|`{"need_money":200000,"award_type":0}`|
|5|`{"need_money":300000,"award_type":0}`|
|6|`{"need_money":500000,"award_type":0}`|
|1001|`{"need_money":30000,"award_type":1}`|
|1002|`{"need_money":50000,"award_type":1}`|
|1003|`{"need_money":100000,"award_type":1}`|
|1004|`{"need_money":200000,"award_type":1}`|
|1005|`{"need_money":300000,"award_type":1}`|
|1006|`{"need_money":600000,"award_type":1}`|
|1007|`{"need_money":1000000,"award_type":1}`|
|1008|`{"need_money":2000000,"award_type":1}`|
|1009|`{"need_money":5000000,"award_type":1}`|

## Param

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|score_amount_rate|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|token_rate|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|score_token_rate|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|coupon_rate|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|change_rate|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|coupon|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|token_item|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|change_token_item|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"score_amount_rate":100,"token_rate":100,"score_token_rate":100,"coupon_rate":100,"change_rate":100,"token_item":601500,"change_token_item":301500}`|

## GeneralAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|server_open_day|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|award|array|2|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"server_open_day":0,"award":[1001900,1]}`|
|2|`{"server_open_day":30,"award":[1011900,1]}`|

## Handle

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|99|本表行键；与其他表同值不自动代表同一对象。|
|jump|number|99|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|recharge_type|number|99|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lua_module|undefined/object|99|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"recharge_type":0}`|
|2|`{"recharge_type":0}`|
|3|`{"recharge_type":0}`|
|4|`{"recharge_type":44}`|
|5|`{"recharge_type":47}`|
|6|`{"recharge_type":0}`|
|7|`{"recharge_type":16}`|
|9|`{"recharge_type":6}`|
|10|`{"recharge_type":0}`|
|11|`{"recharge_type":19}`|
|13|`{"recharge_type":21}`|
|14|`{"recharge_type":22}`|
|15|`{"recharge_type":23}`|
|19|`{"recharge_type":2}`|
|22|`{"recharge_type":29}`|
|24|`{"recharge_type":16}`|
|31|`{"recharge_type":36}`|
|32|`{"recharge_type":37}`|
|33|`{"recharge_type":38}`|
|34|`{"recharge_type":35}`|
|37|`{"recharge_type":42}`|
|38|`{"recharge_type":31}`|
|39|`{"recharge_type":45}`|
|40|`{"recharge_type":46}`|
|49|`{"recharge_type":49}`|
|52|`{"recharge_type":52}`|
|54|`{"recharge_type":54}`|
|55|`{"recharge_type":55}`|
|56|`{"recharge_type":56}`|
|57|`{"recharge_type":57}`|
|58|`{"recharge_type":58}`|
|59|`{"recharge_type":59}`|
|60|`{"recharge_type":60}`|
|61|`{"recharge_type":72}`|
|62|`{"recharge_type":73}`|
|63|`{"recharge_type":74}`|
|64|`{"recharge_type":75}`|
|65|`{"recharge_type":76}`|
|66|`{"recharge_type":78}`|
|67|`{"recharge_type":80}`|
|68|`{"recharge_type":82}`|
|69|`{"recharge_type":83}`|
|70|`{"recharge_type":84}`|
|71|`{"recharge_type":85}`|
|72|`{"recharge_type":86}`|
|73|`{"recharge_type":0}`|
|74|`{"recharge_type":88}`|
|75|`{"recharge_type":7}`|
|76|`{"recharge_type":89}`|
|77|`{"recharge_type":90}`|
|78|`{"recharge_type":91}`|
|79|`{"recharge_type":92}`|
|80|`{"recharge_type":93}`|
|81|`{"recharge_type":94}`|
|82|`{"recharge_type":0}`|
|83|`{"recharge_type":95}`|
|84|`{"recharge_type":96}`|
|85|`{"recharge_type":97}`|
|86|`{"recharge_type":98}`|
|87|`{"recharge_type":99}`|
|88|`{"recharge_type":100}`|
|89|`{"recharge_type":101}`|
|90|`{"recharge_type":104}`|
|91|`{"recharge_type":105}`|
|92|`{"recharge_type":106}`|
|93|`{"recharge_type":107}`|
|94|`{"recharge_type":108}`|
|95|`{"recharge_type":109}`|
|96|`{"recharge_type":110}`|
|97|`{"recharge_type":111}`|
|98|`{"recharge_type":112}`|
|99|`{"recharge_type":113}`|
|100|`{"recharge_type":114}`|
|101|`{"recharge_type":115}`|
|102|`{"recharge_type":116}`|
|103|`{"recharge_type":117}`|
|104|`{"recharge_type":118}`|
|105|`{"recharge_type":119}`|
|106|`{"recharge_type":120}`|
|107|`{"recharge_type":121}`|
|108|`{"recharge_type":122}`|
|109|`{"recharge_type":123}`|
|110|`{"recharge_type":124}`|
|111|`{"recharge_type":125}`|
|112|`{"recharge_type":126}`|
|113|`{"recharge_type":127}`|
|114|`{"recharge_type":128}`|
|115|`{"recharge_type":129}`|
|116|`{"recharge_type":130}`|
|117|`{"recharge_type":131}`|
|118|`{"recharge_type":133}`|
|119|`{"recharge_type":135}`|
|120|`{"recharge_type":136}`|
|121|`{"recharge_type":137}`|
|122|`{"recharge_type":139}`|
|123|`{"recharge_type":0}`|
|124|`{"recharge_type":0}`|
|134|`{"recharge_type":140}`|
|135|`{"recharge_type":141}`|

## RewardAnimation

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|32|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|139001|`{}`|
|139002|`{}`|
|140001|`{}`|
|140002|`{}`|
|140003|`{}`|
|140004|`{}`|
|140005|`{}`|
|490001|`{}`|
|490002|`{}`|
|540004|`{}`|
|570001|`{}`|
|570002|`{}`|
|620001|`{}`|
|950001|`{}`|
|950002|`{}`|
|950003|`{}`|
|950004|`{}`|
|950005|`{}`|
|950006|`{}`|
|950007|`{}`|
|950008|`{}`|
|950009|`{}`|
|950010|`{}`|
|950011|`{}`|
|950012|`{}`|
|950013|`{}`|
|950014|`{}`|
|950015|`{}`|
|950016|`{}`|
|950017|`{}`|
|950032|`{}`|
|950033|`{}`|

## Show

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|49|本表行键；与其他表同值不自动代表同一对象。|
|shop_item_tips|number|49|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1270814|`{"shop_item_tips":54766}`|
|1270815|`{"shop_item_tips":54766}`|
|1370205|`{"shop_item_tips":683161}`|
|1370206|`{"shop_item_tips":683161}`|
|1370207|`{"shop_item_tips":683161}`|
|1370216|`{"shop_item_tips":683161}`|
|1370217|`{"shop_item_tips":683161}`|
|1370218|`{"shop_item_tips":683161}`|
|1370220|`{"shop_item_tips":683161}`|
|1370224|`{"shop_item_tips":683161}`|
|1370225|`{"shop_item_tips":683161}`|
|1370226|`{"shop_item_tips":683161}`|
|1370227|`{"shop_item_tips":683161}`|
|1370232|`{"shop_item_tips":683161}`|
|1370233|`{"shop_item_tips":683161}`|
|1370234|`{"shop_item_tips":683161}`|
|1370235|`{"shop_item_tips":683161}`|
|1370241|`{"shop_item_tips":683161}`|
|1370242|`{"shop_item_tips":683161}`|
|1370243|`{"shop_item_tips":683161}`|
|1370244|`{"shop_item_tips":683161}`|
|1370250|`{"shop_item_tips":683161}`|
|1370251|`{"shop_item_tips":683161}`|
|1370252|`{"shop_item_tips":683161}`|
|1370253|`{"shop_item_tips":683161}`|
|1370259|`{"shop_item_tips":683161}`|
|1370260|`{"shop_item_tips":683161}`|
|1370261|`{"shop_item_tips":683161}`|
|1370262|`{"shop_item_tips":683161}`|
|1370268|`{"shop_item_tips":683161}`|
|1370269|`{"shop_item_tips":683161}`|
|1370270|`{"shop_item_tips":683161}`|
|1370271|`{"shop_item_tips":683161}`|
|1370277|`{"shop_item_tips":683161}`|
|1370278|`{"shop_item_tips":683161}`|
|1370279|`{"shop_item_tips":683161}`|
|1370280|`{"shop_item_tips":683161}`|
|1370286|`{"shop_item_tips":683161}`|
|1370287|`{"shop_item_tips":683161}`|
|1370288|`{"shop_item_tips":683161}`|
|1370289|`{"shop_item_tips":683161}`|
|1370304|`{"shop_item_tips":683161}`|
|1370305|`{"shop_item_tips":683161}`|
|1370306|`{"shop_item_tips":683161}`|
|1370307|`{"shop_item_tips":683161}`|
|1370313|`{"shop_item_tips":683161}`|
|1370314|`{"shop_item_tips":683161}`|
|1370315|`{"shop_item_tips":683161}`|
|1370316|`{"shop_item_tips":683161}`|

## ExtraFixReward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|reward|array|12|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|reset_module|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|extra_add_img|string|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|12|本表行键；与其他表同值不自动代表同一对象。|
|is_show_multiple|boolean|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"reward":[[401500,50]],"reset_module":0,"is_show_multiple":false}`|
|2|`{"reward":[[401500,120]],"reset_module":0,"is_show_multiple":false}`|
|3|`{"reward":[[401500,240]],"reset_module":0,"is_show_multiple":false}`|
|4|`{"reward":[[401500,420]],"reset_module":0,"is_show_multiple":false}`|
|5|`{"reward":[[401500,720]],"reset_module":0,"is_show_multiple":false}`|
|6|`{"reward":[[401500,1520]],"reset_module":0,"is_show_multiple":false}`|
|11|`{"reward":[[101500,12]],"reset_module":92087,"is_show_multiple":true}`|
|12|`{"reward":[[101500,60]],"reset_module":92087,"is_show_multiple":true}`|
|13|`{"reward":[[101500,196]],"reset_module":92087,"is_show_multiple":true}`|
|14|`{"reward":[[101500,396]],"reset_module":92087,"is_show_multiple":true}`|
|15|`{"reward":[[101500,656]],"reset_module":92087,"is_show_multiple":true}`|
|16|`{"reward":[[101500,1296]],"reset_module":92087,"is_show_multiple":true}`|

## ExtraRewardConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|flush_day|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"flush_day":60}`|

## ExtraReward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|reward|array|30|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|is_show_multiple|boolean|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|30|本表行键；与其他表同值不自动代表同一对象。|
|extra_add_img|string|30|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1101|`{"reward":[[101500,120]],"is_show_multiple":true}`|
|1102|`{"reward":[[101500,90]],"is_show_multiple":true}`|
|1103|`{"reward":[[101500,60]],"is_show_multiple":true}`|
|1104|`{"reward":[[101500,30]],"is_show_multiple":true}`|
|1105|`{"reward":[[101500,12]],"is_show_multiple":true}`|
|1201|`{"reward":[[101500,600]],"is_show_multiple":true}`|
|1202|`{"reward":[[101500,450]],"is_show_multiple":true}`|
|1203|`{"reward":[[101500,300]],"is_show_multiple":true}`|
|1204|`{"reward":[[101500,150]],"is_show_multiple":true}`|
|1205|`{"reward":[[101500,60]],"is_show_multiple":true}`|
|1301|`{"reward":[[101500,1960]],"is_show_multiple":true}`|
|1302|`{"reward":[[101500,1470]],"is_show_multiple":true}`|
|1303|`{"reward":[[101500,980]],"is_show_multiple":true}`|
|1304|`{"reward":[[101500,490]],"is_show_multiple":true}`|
|1305|`{"reward":[[101500,196]],"is_show_multiple":true}`|
|1401|`{"reward":[[101500,3960]],"is_show_multiple":true}`|
|1402|`{"reward":[[101500,2970]],"is_show_multiple":true}`|
|1403|`{"reward":[[101500,1980]],"is_show_multiple":true}`|
|1404|`{"reward":[[101500,990]],"is_show_multiple":true}`|
|1405|`{"reward":[[101500,396]],"is_show_multiple":true}`|
|1501|`{"reward":[[101500,6560]],"is_show_multiple":true}`|
|1502|`{"reward":[[101500,4920]],"is_show_multiple":true}`|
|1503|`{"reward":[[101500,3280]],"is_show_multiple":true}`|
|1504|`{"reward":[[101500,1640]],"is_show_multiple":true}`|
|1505|`{"reward":[[101500,656]],"is_show_multiple":true}`|
|1601|`{"reward":[[101500,12960]],"is_show_multiple":true}`|
|1602|`{"reward":[[101500,9720]],"is_show_multiple":true}`|
|1603|`{"reward":[[101500,6480]],"is_show_multiple":true}`|
|1604|`{"reward":[[101500,3240]],"is_show_multiple":true}`|
|1605|`{"reward":[[101500,1296]],"is_show_multiple":true}`|

## RecommendType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|22|本表行键；与其他表同值不自动代表同一对象。|

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
|20|`{}`|
|21|`{}`|
|22|`{}`|

## ExtraTimes

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|interval|number|119|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|limit_total_times|number|119|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|tid|number|119|本表行键；与其他表同值不自动代表同一对象。|
|pre_add_day|number|119|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pre_add_times|number|119|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|times|number|119|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|510001|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|510101|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|510201|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|510301|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|510401|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|510501|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|510601|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|510701|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|510801|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|510901|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|511001|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|511101|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|511201|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|511301|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|511401|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|511701|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|511801|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|511901|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|512001|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|512101|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|512201|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|512301|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|512401|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|512501|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|512601|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|512701|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|512801|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|512901|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|513001|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|513101|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|600101|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|600102|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|600103|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|600112|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|600113|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|600201|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|600202|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|600203|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|600212|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|600213|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|720201|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|720202|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|730101|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|730102|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|730103|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|730112|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|730113|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|730201|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|730202|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|730203|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|730231|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|730251|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|730261|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|730271|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|730281|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|730291|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|730301|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|730311|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|730321|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|730331|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|730341|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|750101|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|750102|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":2}`|
|750103|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|830101|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|830201|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|830301|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|830401|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|830501|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|830601|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|830701|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|830901|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|840106|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|850201|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|850202|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":2}`|
|850203|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|850204|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|870001|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|870021|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|870041|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|870061|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|870081|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|870101|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|870121|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|870141|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|870161|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|870181|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|870201|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|870221|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|870241|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|870261|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|870271|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|870290|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|870300|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|870311|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|870321|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|870323|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|870338|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|870340|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|880101|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|890101|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|890102|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|890939|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|890940|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|891611|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|891612|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|891901|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|891902|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|940101|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|940201|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|940301|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|940401|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|940501|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|940601|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|940901|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|970401|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|970501|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|970601|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|
|970701|`{"interval":86400,"limit_total_times":0,"pre_add_day":0,"pre_add_times":0,"times":1}`|

## ForeverIncreaseGift

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|open_day|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|increase_limit|number|3|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|times|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|110011|`{"open_day":24,"increase_limit":800,"times":80}`|
|110012|`{"open_day":38,"increase_limit":800,"times":80}`|
|110021|`{"open_day":33,"increase_limit":1000,"times":100}`|

## SelectPool

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|74|本表行键；与其他表同值不自动代表同一对象。|
|award_tag|array|74|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|award|array|74|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award_tag":[],"award":[[510002,1],[511002,1],[497002,1],[498002,1],[500002,1]]}`|
|2|`{"award_tag":[],"award":[[1321200,1],[379002,600]]}`|
|3|`{"award_tag":[],"award":[[19002,5],[392002,12],[414002,50],[502002,12],[494002,10]]}`|
|4|`{"award_tag":[],"award":[[179002,300],[493002,300],[17002,4000],[501002,1500],[391002,2000]]}`|
|5|`{"award_tag":[],"award":[[2091200,40],[390002,2],[101200,1],[1891200,2]]}`|
|6|`{"award_tag":[],"award":[[19002,5],[392002,12],[414002,50],[502002,12],[494002,10]]}`|
|7|`{"award_tag":[],"award":[[179002,300],[493002,300],[17002,4000],[501002,1500],[391002,2000]]}`|
|8|`{"award_tag":[],"award":[[19002,2],[392002,5],[414002,20],[502002,5],[494002,5]]}`|
|9|`{"award_tag":[],"award":[[24002,1],[22002,1],[23002,1],[333002,1],[221200,3]]}`|
|10|`{"award_tag":[],"award":[[19002,3],[392002,8],[414002,30],[502002,8],[494002,6],[391002,2000],[501002,1500]]}`|
|11|`{"award_tag":[],"award":[[510002,1],[511002,1],[497002,1],[498002,1]]}`|
|12|`{"award_tag":[],"award":[[510002,1],[511002,1],[497002,1],[498002,1],[500002,1],[517002,1]]}`|
|13|`{"award_tag":[],"award":[[510002,1],[511002,1],[497002,1],[498002,1],[500002,1],[517002,1],[588002,1],[589002,1]]}`|
|14|`{"award_tag":[],"award":[[599002,1],[598002,1],[582002,1],[588002,1],[589002,1],[510002,1],[511002,1],[497002,1],[498002,1],[500002,1],[517002,1]]}`|
|15|`{"award_tag":[],"award":[[621002,1],[622002,1],[599002,1],[598002,1],[582002,1],[588002,1],[589002,1],[510002,1],[511002,1],[497002,1],[498002,1],[500002,1],[517002,1]]}`|
|16|`{"award_tag":[],"award":[[624002,1],[625002,1],[621002,1],[622002,1],[599002,1],[598002,1],[582002,1],[588002,1],[589002,1],[510002,1],[511002,1],[497002,1],[498002,1],[500002,1],[517002,1]]}`|
|17|`{"award_tag":[],"award":[[629002,1],[630002,1],[594002,1],[624002,1],[625002,1],[621002,1],[622002,1],[599002,1],[598002,1],[582002,1],[588002,1],[589002,1],[510002,1],[511002,1],[497002,1],[498002,1],[500002,1],[517002,1]]}`|
|18|`{"award_tag":[],"award":[[510002,1]]}`|
|19|`{"award_tag":[],"award":[[19002,2],[392002,5],[414002,20]]}`|
|20|`{"award_tag":[],"award":[[24002,1],[22002,1],[333002,1],[221200,3]]}`|
|21|`{"award_tag":[],"award":[[19002,3],[392002,8],[414002,30],[391002,2000]]}`|
|22|`{"award_tag":[],"award":[[19002,5],[392002,12],[414002,50]]}`|
|23|`{"award_tag":[],"award":[[179002,300],[391002,2000],[17002,4000]]}`|
|24|`{"award_tag":[],"award":[[101200,1]]}`|
|25|`{"award_tag":[],"award":[[19002,5],[392002,12],[414002,50]]}`|
|26|`{"award_tag":[],"award":[[179002,300],[391002,2000],[17002,4000]]}`|
|27|`{"award_tag":[],"award":[[19002,2],[392002,5],[414002,20],[502002,5],[494002,5]]}`|
|28|`{"award_tag":[],"award":[[1321200,1],[24002,1],[22002,1],[23002,1],[333002,1]]}`|
|29|`{"award_tag":[],"award":[[19002,3],[392002,8],[414002,30],[502002,8],[494002,6],[391002,2000],[501002,1500]]}`|
|30|`{"award_tag":[],"award":[[1001002,1],[1002002,1],[1003002,1],[1004002,1]]}`|
|31|`{"award_tag":[],"award":[[1321200,1],[379002,600]]}`|
|32|`{"award_tag":[],"award":[[19002,5],[392002,12],[414002,50],[502002,12],[494002,10]]}`|
|33|`{"award_tag":[],"award":[[179002,300],[493002,300],[17002,4000],[501002,1500],[391002,2000]]}`|
|34|`{"award_tag":[],"award":[[1321200,1],[496002,1],[390002,1]]}`|
|35|`{"award_tag":[],"award":[[19002,5],[392002,12],[414002,50],[502002,12],[494002,10]]}`|
|36|`{"award_tag":[],"award":[[179002,300],[493002,300],[17002,4000],[501002,1500],[391002,2000]]}`|
|37|`{"award_tag":[],"award":[[644002,60]]}`|
|38|`{"award_tag":[],"award":[[2002,2],[3002,1]]}`|
|39|`{"award_tag":[],"award":[[2651200,1],[2661200,1]]}`|
|40|`{"award_tag":[],"award":[[502002,10],[494002,8]]}`|
|41|`{"award_tag":[],"award":[[391002,500],[392002,3],[501002,500],[502002,3],[493002,80],[494002,2],[19002,1]]}`|
|42|`{"award_tag":[],"award":[[11200,1],[1321200,1],[24002,1],[22002,1],[23002,1],[333002,1]]}`|
|43|`{"award_tag":[],"award":[[19002,3],[392002,8],[414002,30],[502002,8],[494002,6],[391002,2000],[501002,1500]]}`|
|44|`{"award_tag":[],"award":[[19002,6],[392002,15],[414002,60],[502002,15],[494002,12],[391002,4000],[501002,3000]]}`|
|45|`{"award_tag":[],"award":[[2002,10],[3002,5]]}`|
|46|`{"award_tag":[],"award":[[390002,2],[472002,2],[496002,2]]}`|
|47|`{"award_tag":[],"award":[[390002,3],[472002,3],[496002,3]]}`|
|48|`{"award_tag":[],"award":[[2081200,1]]}`|
|49|`{"award_tag":[],"award":[[2371200,1],[101200,1]]}`|
|50|`{"award_tag":[],"award":[[1321200,1],[379002,600]]}`|
|51|`{"award_tag":[],"award":[[19002,5],[392002,12],[414002,50],[502002,12],[494002,10]]}`|
|52|`{"award_tag":[],"award":[[179002,300],[391002,2000],[17002,4000],[501002,1500],[493002,300]]}`|
|53|`{"award_tag":[],"award":[[1001002,1],[1002002,1],[1003002,1],[1004002,1],[637002,1],[582002,1],[510002,1],[594002,1],[517002,1],[500002,1],[498002,1],[497002,1],[511002,1],[629002,1],[630002,1],[624002,1],[625002,1],[621002,1],[622002,1],[599002,1],[598002,1],[588002,1],[589002,1]]}`|
|54|`{"award_tag":[],"award":[[19002,2],[392002,5],[414002,20],[502002,5],[494002,5]]}`|
|55|`{"award_tag":[],"award":[[24002,1],[22002,1],[23002,1],[333002,1],[472002,1],[496002,1],[221200,3]]}`|
|56|`{"award_tag":[],"award":[[19002,3],[392002,8],[414002,30],[502002,8],[494002,6],[391002,2000],[501002,1500]]}`|
|57|`{"award_tag":[],"award":[[19002,5],[392002,12],[414002,50],[502002,12],[494002,10]]}`|
|58|`{"award_tag":[],"award":[[179002,300],[493002,300],[17002,4000],[501002,1500],[391002,2000]]}`|
|59|`{"award_tag":[],"award":[[2091200,40],[390002,2],[101200,1],[1891200,2]]}`|
|60|`{"award_tag":[],"award":[[19002,5],[392002,12],[414002,50],[502002,12],[494002,10]]}`|
|61|`{"award_tag":[],"award":[[179002,300],[493002,300],[17002,4000],[501002,1500],[391002,2000]]}`|
|62|`{"award_tag":[],"award":[[3002,30],[101200,1],[390002,2],[191200,5],[1321200,2],[667002,30]]}`|
|63|`{"award_tag":[],"award":[[379002,480],[19002,5],[392002,15],[414002,60]]}`|
|64|`{"award_tag":[],"award":[[179002,800],[391002,2000],[17002,4000],[18002,200]]}`|
|65|`{"award_tag":[],"award":[[3002,30],[101200,1],[390002,2],[191200,5],[1321200,2],[667002,30],[2371200,1],[1891200,2],[2091200,40]]}`|
|66|`{"award_tag":[],"award":[[379002,480],[19002,5],[392002,15],[414002,60],[502002,15],[494002,12]]}`|
|67|`{"award_tag":[],"award":[[179002,800],[391002,2000],[17002,4000],[18002,200],[501002,1500],[493002,300]]}`|
|68|`{"award_tag":[],"award":[[3002,50],[475002,100],[474002,500],[1831200,2],[1881200,1],[2091200,60]]}`|
|69|`{"award_tag":[],"award":[[379002,720],[19002,8],[392002,20],[414002,80],[502002,20],[494002,15]]}`|
|70|`{"award_tag":[],"award":[[179002,1200],[391002,3000],[17002,6000],[18002,300],[501002,2000],[493002,500]]}`|
|71|`{"award_tag":[],"award":[[1001002,1],[1002002,1],[1003002,1],[1004002,1],[510002,1],[511002,1]]}`|
|72|`{"award_tag":[],"award":[[598002,1],[599002,1],[589002,1],[588002,1],[497002,1],[498002,1],[582002,1],[1001002,1],[1002002,1],[1003002,1],[1004002,1],[510002,1],[511002,1]]}`|
|73|`{"award_tag":[],"award":[[621002,1],[625002,1],[622002,1],[624002,1],[500002,1],[517002,1],[598002,1],[599002,1],[589002,1],[588002,1],[497002,1],[498002,1],[582002,1],[1001002,1],[1002002,1],[1003002,1],[1004002,1],[510002,1],[511002,1]]}`|
|74|`{"award_tag":[],"award":[[1009002,1],[1007002,1],[1006002,1],[637002,1],[582002,1],[510002,1],[1005002,1],[1001002,1],[1002002,1],[1003002,1],[1004002,1],[594002,1],[517002,1],[500002,1],[498002,1],[497002,1],[511002,1],[629002,1],[630002,1],[624002,1],[625002,1],[621002,1],[622002,1],[599002,1],[598002,1],[588002,1],[589002,1]]}`|

## Type

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|106|本表行键；与其他表同值不自动代表同一对象。|
|is_record_single|boolean|106|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"is_record_single":false}`|
|2|`{"is_record_single":true}`|
|3|`{"is_record_single":false}`|
|4|`{"is_record_single":false}`|
|5|`{"is_record_single":false}`|
|6|`{"is_record_single":false}`|
|7|`{"is_record_single":false}`|
|8|`{"is_record_single":false}`|
|11|`{"is_record_single":false}`|
|14|`{"is_record_single":false}`|
|16|`{"is_record_single":false}`|
|18|`{"is_record_single":false}`|
|19|`{"is_record_single":false}`|
|21|`{"is_record_single":false}`|
|22|`{"is_record_single":false}`|
|23|`{"is_record_single":false}`|
|24|`{"is_record_single":false}`|
|29|`{"is_record_single":false}`|
|31|`{"is_record_single":false}`|
|33|`{"is_record_single":false}`|
|35|`{"is_record_single":false}`|
|36|`{"is_record_single":false}`|
|37|`{"is_record_single":false}`|
|38|`{"is_record_single":true}`|
|39|`{"is_record_single":false}`|
|41|`{"is_record_single":false}`|
|42|`{"is_record_single":false}`|
|43|`{"is_record_single":false}`|
|44|`{"is_record_single":false}`|
|45|`{"is_record_single":false}`|
|46|`{"is_record_single":true}`|
|47|`{"is_record_single":false}`|
|48|`{"is_record_single":false}`|
|49|`{"is_record_single":false}`|
|52|`{"is_record_single":false}`|
|54|`{"is_record_single":false}`|
|55|`{"is_record_single":true}`|
|56|`{"is_record_single":false}`|
|57|`{"is_record_single":false}`|
|58|`{"is_record_single":false}`|
|59|`{"is_record_single":false}`|
|60|`{"is_record_single":false}`|
|72|`{"is_record_single":false}`|
|73|`{"is_record_single":false}`|
|74|`{"is_record_single":false}`|
|75|`{"is_record_single":false}`|
|76|`{"is_record_single":false}`|
|78|`{"is_record_single":false}`|
|80|`{"is_record_single":false}`|
|81|`{"is_record_single":false}`|
|82|`{"is_record_single":false}`|
|83|`{"is_record_single":false}`|
|84|`{"is_record_single":false}`|
|85|`{"is_record_single":false}`|
|86|`{"is_record_single":false}`|
|87|`{"is_record_single":false}`|
|88|`{"is_record_single":false}`|
|89|`{"is_record_single":false}`|
|90|`{"is_record_single":false}`|
|91|`{"is_record_single":false}`|
|92|`{"is_record_single":false}`|
|93|`{"is_record_single":false}`|
|94|`{"is_record_single":false}`|
|95|`{"is_record_single":false}`|
|96|`{"is_record_single":false}`|
|97|`{"is_record_single":false}`|
|98|`{"is_record_single":false}`|
|99|`{"is_record_single":false}`|
|100|`{"is_record_single":false}`|
|101|`{"is_record_single":false}`|
|104|`{"is_record_single":false}`|
|105|`{"is_record_single":false}`|
|106|`{"is_record_single":false}`|
|107|`{"is_record_single":false}`|
|108|`{"is_record_single":false}`|
|109|`{"is_record_single":false}`|
|110|`{"is_record_single":false}`|
|111|`{"is_record_single":false}`|
|112|`{"is_record_single":false}`|
|113|`{"is_record_single":false}`|
|114|`{"is_record_single":false}`|
|115|`{"is_record_single":false}`|
|116|`{"is_record_single":false}`|
|117|`{"is_record_single":false}`|
|118|`{"is_record_single":false}`|
|119|`{"is_record_single":false}`|
|120|`{"is_record_single":false}`|
|121|`{"is_record_single":false}`|
|122|`{"is_record_single":false}`|
|123|`{"is_record_single":false}`|
|124|`{"is_record_single":false}`|
|125|`{"is_record_single":false}`|
|126|`{"is_record_single":false}`|
|127|`{"is_record_single":false}`|
|128|`{"is_record_single":false}`|
|129|`{"is_record_single":false}`|
|130|`{"is_record_single":false}`|
|131|`{"is_record_single":false}`|
|133|`{"is_record_single":false}`|
|134|`{"is_record_single":false}`|
|135|`{"is_record_single":false}`|
|136|`{"is_record_single":false}`|
|137|`{"is_record_single":false}`|
|139|`{"is_record_single":false}`|
|140|`{"is_record_single":false}`|
|141|`{"is_record_single":false}`|

## SelectGift

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|67|本表行键；与其他表同值不自动代表同一对象。|
|select|array|67|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_tag|array|67|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|860102|`{"select":[8],"award_tag":[]}`|
|860103|`{"select":[9,10],"award_tag":[]}`|
|860104|`{"select":[1,10],"award_tag":[12071]}`|
|860105|`{"select":[1,2,3,4],"award_tag":[12071,12068]}`|
|860106|`{"select":[5,6,7],"award_tag":[12070]}`|
|860114|`{"select":[11,10],"award_tag":[12071]}`|
|860115|`{"select":[11,2,3,4],"award_tag":[12071,12068]}`|
|860124|`{"select":[12,10],"award_tag":[12071]}`|
|860125|`{"select":[12,2,3,4],"award_tag":[12071,12068]}`|
|860134|`{"select":[13,10],"award_tag":[12071]}`|
|860135|`{"select":[13,2,3,4],"award_tag":[12071,12068]}`|
|860144|`{"select":[14,10],"award_tag":[12071]}`|
|860145|`{"select":[14,2,3,4],"award_tag":[12071,12068]}`|
|860146|`{"select":[5,6,7],"award_tag":[12070]}`|
|860147|`{"select":[15,10],"award_tag":[12071]}`|
|860148|`{"select":[15,2,3,4],"award_tag":[12071,12068]}`|
|860149|`{"select":[5,6,7],"award_tag":[12070]}`|
|860154|`{"select":[16,10],"award_tag":[12071]}`|
|860155|`{"select":[16,2,3,4],"award_tag":[12071,12068]}`|
|860156|`{"select":[5,6,7],"award_tag":[12070]}`|
|860164|`{"select":[17,10],"award_tag":[12071]}`|
|860165|`{"select":[17,2,3,4],"award_tag":[12071,12068]}`|
|860166|`{"select":[5,6,7],"award_tag":[12070]}`|
|860171|`{"select":[19],"award_tag":[]}`|
|860172|`{"select":[20,21],"award_tag":[]}`|
|860173|`{"select":[18,21],"award_tag":[12071]}`|
|860174|`{"select":[18,2,22,23],"award_tag":[12071,12068]}`|
|860175|`{"select":[24,25,26],"award_tag":[12068]}`|
|860181|`{"select":[27],"award_tag":[]}`|
|860182|`{"select":[28,29],"award_tag":[]}`|
|860183|`{"select":[30,29],"award_tag":[12071]}`|
|860184|`{"select":[30,31,32,33],"award_tag":[12071,12068]}`|
|860185|`{"select":[34,35,36],"award_tag":[12068]}`|
|860186|`{"select":[37,38],"award_tag":[12068]}`|
|860193|`{"select":[39,40],"award_tag":[12068]}`|
|860194|`{"select":[41],"award_tag":[]}`|
|860195|`{"select":[42,43],"award_tag":[12068]}`|
|860196|`{"select":[39,40],"award_tag":[12068]}`|
|860197|`{"select":[41],"award_tag":[]}`|
|860198|`{"select":[45],"award_tag":[]}`|
|860199|`{"select":[46,44],"award_tag":[12068]}`|
|860200|`{"select":[47,50,52,52],"award_tag":[12068]}`|
|860201|`{"select":[39,51,52],"award_tag":[12068]}`|
|860202|`{"select":[39,50,51,52],"award_tag":[12068]}`|
|860203|`{"select":[48,51,52,52],"award_tag":[12070]}`|
|860204|`{"select":[48,50,51,52],"award_tag":[12070]}`|
|860205|`{"select":[49,51,52],"award_tag":[12068]}`|
|860206|`{"select":[49,50,51,52],"award_tag":[12068]}`|
|860211|`{"select":[54],"award_tag":[]}`|
|860212|`{"select":[55,56],"award_tag":[]}`|
|860213|`{"select":[53,56],"award_tag":[12071]}`|
|860214|`{"select":[53,2,57,58],"award_tag":[12071,12068]}`|
|860215|`{"select":[59,60,61],"award_tag":[12068]}`|
|860221|`{"select":[71,10],"award_tag":[12071]}`|
|860222|`{"select":[71,2,3,4],"award_tag":[12071,12068]}`|
|860231|`{"select":[72,56],"award_tag":[12071]}`|
|860232|`{"select":[72,2,57,58],"award_tag":[12071,12068]}`|
|860241|`{"select":[73,56],"award_tag":[12071]}`|
|860242|`{"select":[73,2,57,58],"award_tag":[12071,12068]}`|
|860251|`{"select":[54],"award_tag":[]}`|
|860252|`{"select":[55,56],"award_tag":[]}`|
|860253|`{"select":[74,56],"award_tag":[12071]}`|
|860254|`{"select":[74,2,57,58],"award_tag":[12071,12068]}`|
|860255|`{"select":[59,60,61],"award_tag":[12068]}`|
|1160008|`{"select":[62,63,64],"award_tag":[]}`|
|1160009|`{"select":[65,66,67],"award_tag":[]}`|
|1160010|`{"select":[68,69,70],"award_tag":[]}`|

## Recharge

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|steep_discount|number/undefined|6657|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|effect_level|number/undefined|6657|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_discount|boolean/undefined|6657|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|6657|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|iap_id|string|6657|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sync_handle|number/undefined|6657|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|can_buy_times|number/undefined|6657|原可购次数字段；0含义必须结合类型处理器，不默认无限。|
|recommend_type|number/undefined|6657|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|reward_tid|array|6657|奖励对象ID数组，与reward_count按下标配对。|
|pay_type|number|6657|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|reward_count|array|6657|奖励数量数组；不得和另一行的reward_tid交叉配对。|
|reward_icon|array/undefined|6657|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|icon|string|6657|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|price|number|6657|原价格整数；RechargeTable现金商品消费者使用分，其他表必须核币种和单位。|
|front_Color|undefined/number|6657|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cost_item|number|6657|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|buy_cycle_limit|number/undefined|6657|Recharge购买周期引用；不是允许购买次数本身。|
|show_name|number|6657|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|6657|本表行键；与其他表同值不自动代表同一对象。|
|banner|undefined/string|6657|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|recharge_stall|number/undefined|6657|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|original_price|number/undefined|6657|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|discount|number/undefined|6657|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|recharge_name|number|6657|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部6657行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"steep_discount":0,"show_discount":false,"type":81,"can_buy_times":0,"recommend_type":0,"reward_tid":[401500],"pay_type":0,"reward_count":[300],"reward_icon":[0],"price":3000,"cost_item":0,"buy_cycle_limit":0,"original_price":0,"discount":0}`|
|2|`{"steep_discount":0,"show_discount":false,"type":81,"can_buy_times":0,"recommend_type":0,"reward_tid":[401500],"pay_type":0,"reward_count":[680],"reward_icon":[0],"price":6800,"cost_item":0,"buy_cycle_limit":0,"original_price":0,"discount":0}`|
|3|`{"steep_discount":0,"show_discount":false,"type":81,"can_buy_times":0,"recommend_type":0,"reward_tid":[401500],"pay_type":0,"reward_count":[1280],"reward_icon":[0],"price":12800,"cost_item":0,"buy_cycle_limit":0,"original_price":0,"discount":0}`|

## CanBuyTimesAdd

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|can_buy_times|array|1|原可购次数字段；0含义必须结合类型处理器，不默认无限。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|112003|`{"can_buy_times":[[15,16]]}`|

## Icon

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|icon_name|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|

## BuyCycleLimit

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|7|本表行键；与其他表同值不自动代表同一对象。|
|no_color_cycle_des|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cycle_des|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"no_color_cycle_des":53444,"cycle_des":53444}`|
|2|`{"no_color_cycle_des":59577,"cycle_des":59577}`|
|3|`{"no_color_cycle_des":59577,"cycle_des":59577}`|
|4|`{"no_color_cycle_des":2469,"cycle_des":2469}`|
|5|`{"no_color_cycle_des":2469,"cycle_des":2469}`|
|6|`{"no_color_cycle_des":61738,"cycle_des":61738}`|
|7|`{"no_color_cycle_des":2469,"cycle_des":2469}`|

## Stall

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|usd|number|43|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|product_id|string|43|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|chz|number|43|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|43|本表行键；与其他表同值不自动代表同一对象。|
|product_id_gat|string|43|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|3|`{}`|
|6|`{}`|
|9|`{}`|
|10|`{}`|
|12|`{}`|
|15|`{}`|
|18|`{}`|
|30|`{}`|
|36|`{}`|
|50|`{}`|
|60|`{}`|
|68|`{}`|
|80|`{}`|
|98|`{}`|
|128|`{}`|
|168|`{}`|
|198|`{}`|
|228|`{}`|
|268|`{}`|
|298|`{}`|
|328|`{}`|
|398|`{}`|
|448|`{}`|
|588|`{}`|
|648|`{}`|
|2001|`{}`|
|2002|`{}`|
|2003|`{}`|
|2004|`{}`|
|2005|`{}`|
|2006|`{}`|
|2007|`{}`|
|2008|`{}`|
|2009|`{}`|
|2010|`{}`|
|2011|`{}`|
|3001|`{}`|
|3002|`{}`|
|3003|`{}`|
|3004|`{}`|
|3005|`{}`|
|3006|`{}`|

## CurrencyCode

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|169|本表行键；与其他表同值不自动代表同一对象。|
|code|string|169|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|name|string|169|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

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
|20|`{}`|
|21|`{}`|
|22|`{}`|
|23|`{}`|
|24|`{}`|
|25|`{}`|
|26|`{}`|
|27|`{}`|
|28|`{}`|
|29|`{}`|
|30|`{}`|
|31|`{}`|
|32|`{}`|
|33|`{}`|
|34|`{}`|
|35|`{}`|
|36|`{}`|
|37|`{}`|
|38|`{}`|
|39|`{}`|
|40|`{}`|
|41|`{}`|
|42|`{}`|
|43|`{}`|
|44|`{}`|
|45|`{}`|
|46|`{}`|
|47|`{}`|
|48|`{}`|
|49|`{}`|
|50|`{}`|
|51|`{}`|
|52|`{}`|
|53|`{}`|
|54|`{}`|
|55|`{}`|
|56|`{}`|
|57|`{}`|
|58|`{}`|
|59|`{}`|
|60|`{}`|
|61|`{}`|
|62|`{}`|
|63|`{}`|
|64|`{}`|
|65|`{}`|
|66|`{}`|
|67|`{}`|
|68|`{}`|
|69|`{}`|
|70|`{}`|
|71|`{}`|
|72|`{}`|
|73|`{}`|
|74|`{}`|
|75|`{}`|
|76|`{}`|
|77|`{}`|
|78|`{}`|
|79|`{}`|
|80|`{}`|
|81|`{}`|
|82|`{}`|
|83|`{}`|
|84|`{}`|
|85|`{}`|
|86|`{}`|
|87|`{}`|
|88|`{}`|
|89|`{}`|
|90|`{}`|
|91|`{}`|
|92|`{}`|
|93|`{}`|
|94|`{}`|
|95|`{}`|
|96|`{}`|
|97|`{}`|
|98|`{}`|
|99|`{}`|
|100|`{}`|
|101|`{}`|
|102|`{}`|
|103|`{}`|
|104|`{}`|
|105|`{}`|
|106|`{}`|
|107|`{}`|
|108|`{}`|
|109|`{}`|
|110|`{}`|
|111|`{}`|
|112|`{}`|
|113|`{}`|
|114|`{}`|
|115|`{}`|
|116|`{}`|
|117|`{}`|
|118|`{}`|
|119|`{}`|
|120|`{}`|
|121|`{}`|
|122|`{}`|
|123|`{}`|
|124|`{}`|
|125|`{}`|
|126|`{}`|
|127|`{}`|
|128|`{}`|
|129|`{}`|
|130|`{}`|
|131|`{}`|
|132|`{}`|
|133|`{}`|
|134|`{}`|
|135|`{}`|
|136|`{}`|
|137|`{}`|
|138|`{}`|
|139|`{}`|
|140|`{}`|
|141|`{}`|
|142|`{}`|
|143|`{}`|
|144|`{}`|
|145|`{}`|
|146|`{}`|
|147|`{}`|
|148|`{}`|
|149|`{}`|
|150|`{}`|
|151|`{}`|
|152|`{}`|
|153|`{}`|
|154|`{}`|
|155|`{}`|
|156|`{}`|
|157|`{}`|
|158|`{}`|
|159|`{}`|
|160|`{}`|
|161|`{}`|
|162|`{}`|
|163|`{}`|
|164|`{}`|
|165|`{}`|
|166|`{}`|
|167|`{}`|
|168|`{}`|
|169|`{}`|

## RecommendGift

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## WeekAccRechargeParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|acc_reward_count|number|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|daily_acc_amount|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|free_reward_idx|number|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"acc_reward_count":7,"free_reward_idx":8}`|

## WeekAccReward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|29|本表行键；与其他表同值不自动代表同一对象。|
|reward|array|29|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"reward":[[101500,150],[201500,20000],[101800,20000]]}`|
|2|`{"reward":[[101500,1],[201500,25000],[101800,25000]]}`|
|3|`{"reward":[[101500,200],[201500,30000],[101800,30000]]}`|
|4|`{"reward":[[101500,120],[201500,35000],[101800,35000]]}`|
|5|`{"reward":[[101500,300],[201500,40000],[101800,40000]]}`|
|6|`{"reward":[[101500,1],[201500,45000],[101800,45000]]}`|
|7|`{"reward":[[101500,1],[201500,50000],[101800,50000]]}`|
|8|`{"reward":[[101500,150],[201500,55000],[101800,55000]]}`|
|9|`{"reward":[[101500,1],[201500,65000],[101800,65000]]}`|
|10|`{"reward":[[101500,200],[201500,75000],[101800,75000]]}`|
|11|`{"reward":[[101500,120],[201500,85000],[101800,85000]]}`|
|12|`{"reward":[[101500,300],[201500,95000],[101800,95000]]}`|
|13|`{"reward":[[101500,1],[201500,105000],[101800,105000]]}`|
|14|`{"reward":[[101500,5],[201500,115000],[101800,115000]]}`|
|15|`{"reward":[[101500,150],[201500,120000],[101800,120000]]}`|
|16|`{"reward":[[101500,1],[201500,125000],[101800,125000]]}`|
|17|`{"reward":[[101500,200],[201500,130000],[101800,130000]]}`|
|18|`{"reward":[[101500,120],[201500,135000],[101800,135000]]}`|
|19|`{"reward":[[101500,300],[201500,140000],[101800,140000]]}`|
|20|`{"reward":[[101500,1],[201500,145000],[101800,145000]]}`|
|21|`{"reward":[[101500,5],[201500,150000],[101800,150000]]}`|
|22|`{"reward":[[101500,150],[201500,150000],[101800,150000]]}`|
|23|`{"reward":[[101500,1],[201500,150000],[101800,150000]]}`|
|24|`{"reward":[[101500,200],[201500,150000],[101800,150000]]}`|
|25|`{"reward":[[101500,120],[201500,150000],[101800,150000]]}`|
|26|`{"reward":[[101500,300],[201500,150000],[101800,150000]]}`|
|27|`{"reward":[[101500,1],[201500,150000],[101800,150000]]}`|
|28|`{"reward":[[101500,5],[201500,150000],[101800,150000]]}`|
|29|`{"reward":[[101500,3000]]}`|

## WeekAccRecharge

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|reward|array|4|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"reward":[1,2,3,4,5,6,7,29]}`|
|2|`{"reward":[8,9,10,11,12,13,14,29]}`|
|3|`{"reward":[15,16,17,18,19,20,21,29]}`|
|4|`{"reward":[22,23,24,25,26,27,28,29]}`|

## GiftParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|valkyrie_gift_time_limit|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"valkyrie_gift_time_limit":1209600}`|

## Amount

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|74|本表行键；与其他表同值不自动代表同一对象。|
|price|number|74|原价格整数；RechargeTable现金商品消费者使用分，其他表必须核币种和单位。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"price":100}`|
|6|`{"price":600}`|
|10|`{"price":1000}`|
|12|`{"price":1200}`|
|30|`{"price":3000}`|
|31|`{"price":3100}`|
|36|`{"price":3600}`|
|50|`{"price":5000}`|
|66|`{"price":6600}`|
|68|`{"price":6800}`|
|90|`{"price":9000}`|
|96|`{"price":9600}`|
|98|`{"price":9800}`|
|100|`{"price":10000}`|
|101|`{"price":10100}`|
|128|`{"price":12800}`|
|180|`{"price":18000}`|
|198|`{"price":19800}`|
|200|`{"price":20000}`|
|298|`{"price":29800}`|
|300|`{"price":30000}`|
|328|`{"price":32800}`|
|500|`{"price":50000}`|
|648|`{"price":64800}`|
|700|`{"price":70000}`|
|900|`{"price":90000}`|
|1000|`{"price":100000}`|
|1088|`{"price":108800}`|
|1288|`{"price":128800}`|
|1300|`{"price":130000}`|
|1500|`{"price":150000}`|
|1588|`{"price":158800}`|
|2000|`{"price":200000}`|
|2188|`{"price":218800}`|
|2500|`{"price":250000}`|
|2800|`{"price":280000}`|
|2888|`{"price":288800}`|
|3000|`{"price":300000}`|
|3500|`{"price":350000}`|
|3888|`{"price":388800}`|
|4000|`{"price":400000}`|
|4500|`{"price":450000}`|
|5000|`{"price":500000}`|
|5888|`{"price":588800}`|
|7000|`{"price":700000}`|
|7500|`{"price":750000}`|
|8000|`{"price":800000}`|
|8888|`{"price":888800}`|
|10000|`{"price":1000000}`|
|12888|`{"price":1288800}`|
|15000|`{"price":1500000}`|
|16888|`{"price":1688800}`|
|18888|`{"price":1888800}`|
|20000|`{"price":2000000}`|
|20888|`{"price":2088800}`|
|25000|`{"price":2500000}`|
|26888|`{"price":2688800}`|
|30000|`{"price":3000000}`|
|32888|`{"price":3288800}`|
|35000|`{"price":3500000}`|
|36888|`{"price":3688800}`|
|40000|`{"price":4000000}`|
|50000|`{"price":5000000}`|
|65000|`{"price":6500000}`|
|80000|`{"price":8000000}`|
|100000|`{"price":10000000}`|
|120000|`{"price":12000000}`|
|140000|`{"price":14000000}`|
|160000|`{"price":16000000}`|
|180000|`{"price":18000000}`|
|200000|`{"price":20000000}`|
|220000|`{"price":22000000}`|
|1000000000|`{"price":1000000000}`|
|9999999999|`{"price":9999999999}`|

## TopPickRecommend

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|bg|string|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|prefab|string|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|check_open_param|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|jump_to|object|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|8|本表行键；与其他表同值不自动代表同一对象。|
|check_open_func|object|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|jump_to_param|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"check_open_param":0,"check_open_func":{"reference":"FirstRechargeMgr.CanRecharge"}}`|
|2|`{"check_open_param":0,"check_open_func":{"reference":"CycleHeroDrawActMgr.IsShowGiftEntrance"}}`|
|3|`{"check_open_param":0,"check_open_func":{"reference":"MonthlyCardMgr.NormalCardIsNotActive"}}`|
|4|`{"check_open_param":0,"check_open_func":{"reference":"MonthlyCardMgr.SuperCardIsNotActive"}}`|
|5|`{"check_open_param":501,"check_open_func":{"reference":"PermitUtil.CanBuyByTid"}}`|
|7|`{"check_open_param":11,"check_open_func":{"reference":"PermitUtil.CanBuyByType"}}`|
|8|`{"check_open_param":12,"check_open_func":{"reference":"PermitUtil.CanBuyByType"}}`|
|9|`{"check_open_param":13,"check_open_func":{"reference":"PermitUtil.CanBuyByType"}}`|

## LoongPrice

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|11|本表行键；与其他表同值不自动代表同一对象。|
|price|number|11|原价格整数；RechargeTable现金商品消费者使用分，其他表必须核币种和单位。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|100|`{"price":10}`|
|300|`{"price":30}`|
|600|`{"price":60}`|
|900|`{"price":90}`|
|1000|`{"price":100}`|
|1200|`{"price":120}`|
|1500|`{"price":150}`|
|1800|`{"price":180}`|
|3000|`{"price":300}`|
|3600|`{"price":360}`|
|5000|`{"price":500}`|
