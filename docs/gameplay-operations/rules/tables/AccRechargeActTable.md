# AccRechargeActTable 规则参数

来源：[personal-server/assets/tables/AccRechargeActTable.data.lua.json.gz](../../../../personal-server/assets/tables/AccRechargeActTable.data.lua.json.gz)，SHA256：`cc697a5ad6690ddae544421766724949b117dd2f5738929bf398edf76661ee49`。

[完整逐行JSON](AccRechargeActTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Award](#award)|734|decoded-rows|
|[CustomConst](#customconst)|1|rows-with-external-references|
|[Const](#const)|45|decoded-rows|
|[SkinShow](#skinshow)|9|decoded-rows|
|[Show](#show)|20|decoded-rows|

## Award

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|acc_cnt_new|number|734|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|unlock_condition|undefined/number|734|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|734|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|tid|number|734|本表行键；与其他表同值不自动代表同一对象。|
|variant|number|734|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|acc_cnt|number|734|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|slideshow|string|734|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|version|number|734|版本引用；必须按活动类型及其消费者查对应版本表。|
|server_range|number|734|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部734行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1000101|`{"award":[[3002,10]],"version":1}`|
|1000102|`{"award":[[1321200,2]],"version":1}`|
|1000103|`{"award":[[11200,1]],"version":1}`|

## CustomConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|other_entrance_red|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|other_red|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|other_check_func|object|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|other_red_param|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|8|`{"other_check_func":{"reference":"GodDomainTransitionActMgr.ShowOtherAccRechargeEntrance"}}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|red|number|45|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|red_assert|undefined/number|45|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|item|array|45|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|entrance_red|number|45|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|45|本表行键；与其他表同值不自动代表同一对象。|
|red_param|number|45|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"item":[]}`|
|2|`{"item":[]}`|
|3|`{"item":[]}`|
|4|`{"item":[]}`|
|5|`{"item":[]}`|
|6|`{"item":[]}`|
|7|`{"item":[]}`|
|8|`{"item":[]}`|
|9|`{"item":[]}`|
|10|`{"item":[]}`|
|11|`{"item":[]}`|
|12|`{"item":[]}`|
|13|`{"item":[]}`|
|14|`{"item":[]}`|
|15|`{"item":[]}`|
|16|`{"item":[]}`|
|17|`{"item":[]}`|
|18|`{"red_assert":380897500018,"item":[]}`|
|19|`{"red_assert":380897500018,"item":[]}`|
|20|`{"red_assert":380897500018,"item":[]}`|
|21|`{"red_assert":380897500018,"item":[]}`|
|22|`{"item":[]}`|
|23|`{"item":[]}`|
|24|`{"item":[140117,140217,140317]}`|
|25|`{"item":[140517,140617]}`|
|26|`{"item":[]}`|
|27|`{"item":[]}`|
|28|`{"item":[]}`|
|29|`{"item":[]}`|
|30|`{"item":[]}`|
|31|`{"item":[]}`|
|33|`{"item":[140117,140217,140317,140417]}`|
|34|`{"item":[141117]}`|
|35|`{"item":[141117]}`|
|36|`{"item":[]}`|
|37|`{"item":[]}`|
|38|`{"item":[140117,140217,140317]}`|
|39|`{"item":[]}`|
|40|`{"item":[]}`|
|41|`{"item":[]}`|
|42|`{"item":[]}`|
|43|`{"item":[]}`|
|44|`{"item":[]}`|
|45|`{"item":[]}`|
|46|`{"item":[]}`|

## SkinShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|9|本表行键；与其他表同值不自动代表同一对象。|
|icon|string|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|156112|`{}`|
|157112|`{}`|
|157312|`{}`|
|157512|`{}`|
|157712|`{}`|
|601002|`{}`|
|610002|`{}`|
|639002|`{}`|
|3001002|`{}`|

## Show

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tip1|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|form_bg|string|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_variant|number|20|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|spine|array|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|20|本表行键；与其他表同值不自动代表同一对象。|
|title|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|number|20|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|decoration_pos|undefined|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|decoration|string|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|big_award_node|string|20|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|title_type|string|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|progress_bg|string|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tip2|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|progress_bg_scale|undefined|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|progress_bg_pos|undefined|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|decoration_scale|undefined|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|106025|`{"award_variant":1,"award":0,"big_award_node":"AccRechargeCommonSpineAwardsNode.prefab","progress_bg":""}`|
|106026|`{"award_variant":0,"award":1040101,"big_award_node":"","progress_bg":"dk_ljcz_banyuan_zi.png"}`|
|106027|`{"award_variant":0,"award":1202919,"big_award_node":"","progress_bg":"dk_ljcz_banyuan_huang.png"}`|
|106028|`{"award_variant":0,"award":400313,"big_award_node":"","progress_bg":"dk_ljcz_banyuan_huang.png"}`|
|106029|`{"award_variant":0,"award":400220,"big_award_node":"","progress_bg":"dk_ljcz_banyuan_hong.png"}`|
|106030|`{"award_variant":0,"award":0,"big_award_node":"","progress_bg":"dk_ljcz_banyuan_zi.png"}`|
|106031|`{"award_variant":0,"award":1040101,"big_award_node":"","progress_bg":"dk_ljcz_banyuan_zi.png"}`|
|106033|`{"award_variant":1,"award":0,"big_award_node":"AccRechargeCommonSpineAwardsNode.prefab","progress_bg":""}`|
|106034|`{"award_variant":0,"award":141117,"big_award_node":"","progress_bg":""}`|
|106035|`{"award_variant":0,"award":141117,"big_award_node":"","progress_bg":""}`|
|106036|`{"award_variant":0,"award":400413,"big_award_node":"","progress_bg":"dk_ljcz_banyuan_huang.png"}`|
|106037|`{"award_variant":0,"award":400420,"big_award_node":"","progress_bg":"dk_ljcz_banyuan_hong.png"}`|
|106039|`{"award_variant":0,"award":141517,"big_award_node":"","progress_bg":""}`|
|106040|`{"award_variant":0,"award":141517,"big_award_node":"","progress_bg":""}`|
|106041|`{"award_variant":0,"award":141517,"big_award_node":"","progress_bg":""}`|
|106042|`{"award_variant":0,"award":3040101,"big_award_node":"","progress_bg":"dk_ljcz_banyuan_zi.png"}`|
|106043|`{"award_variant":0,"award":1040201,"big_award_node":"","progress_bg":"dk_ljcz_banyuan_zi.png"}`|
|106044|`{"award_variant":0,"award":400413,"big_award_node":"","progress_bg":"dk_ljcz_banyuan_huang.png"}`|
|106045|`{"award_variant":0,"award":1203019,"big_award_node":"","progress_bg":"dk_ljcz_banyuan_zi.png"}`|
|106046|`{"award_variant":0,"award":141717,"big_award_node":"","progress_bg":""}`|
