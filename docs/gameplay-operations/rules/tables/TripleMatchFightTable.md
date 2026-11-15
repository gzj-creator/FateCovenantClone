# TripleMatchFightTable 规则参数

来源：[personal-server/assets/tables/TripleMatchFightTable.data.lua.json.gz](../../../../personal-server/assets/tables/TripleMatchFightTable.data.lua.json.gz)，SHA256：`886c642a1f512a68f02a26ef08b6d8fe9e83a94352529181a8fe4bf2a604d512`。

[完整逐行JSON](TripleMatchFightTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[NpcAbility](#npcability)|78|decoded-rows|
|[Npc](#npc)|78|decoded-rows|
|[Attr](#attr)|16|decoded-rows|
|[Buff](#buff)|33|decoded-rows|
|[AbilityBuffDes](#abilitybuffdes)|15|decoded-rows|
|[AbilityDes](#abilitydes)|78|decoded-rows|
|[AbilityEffectType](#abilityeffecttype)|5|decoded-rows|
|[AbilityType](#abilitytype)|8|decoded-rows|
|[Ability](#ability)|111|decoded-rows|
|[AbilityShow](#abilityshow)|89|decoded-rows|
|[Effect](#effect)|87|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[ActionType](#actiontype)|19|decoded-rows|
|[FighterRoleType](#fighterroletype)|2|decoded-rows|
|[LimitRule](#limitrule)|31|decoded-rows|
|[TargetRule](#targetrule)|18|decoded-rows|
|[TMDFighterStatus](#tmdfighterstatus)|1|decoded-rows|
|[Speed](#speed)|3|decoded-rows|
|[Scene](#scene)|1|decoded-rows|
|[Type](#type)|6|decoded-rows|
|[TripleMatchFight](#triplematchfight)|645|decoded-rows|
|[Team](#team)|642|decoded-rows|
|[Prompt](#prompt)|13|decoded-rows|
|[TileSubType](#tilesubtype)|4|decoded-rows|
|[TileLib](#tilelib)|1|decoded-rows|
|[TileType](#tiletype)|4|decoded-rows|
|[Tile](#tile)|16|decoded-rows|
|[Board](#board)|1|decoded-rows|

## NpcAbility

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|78|本表行键；与其他表同值不自动代表同一对象。|
|ability|array|78|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_show|array|78|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"ability":[4,5,6],"is_show":[false,true,false,false,false,false]}`|
|2|`{"ability":[12,13,14],"is_show":[false,true,false,false,false,false]}`|
|3|`{"ability":[20,21],"is_show":[false,true,false,false,false,false]}`|
|4|`{"ability":[27,28,29],"is_show":[false,true,false,false,false,false]}`|
|5|`{"ability":[35,36,37],"is_show":[false,true,false,false,false,false]}`|
|6|`{"ability":[43,44,45],"is_show":[false,true,false,false,false,false]}`|
|7|`{"ability":[51,52,53],"is_show":[false,true,false,false,false,false]}`|
|8|`{"ability":[60,61,62],"is_show":[false,true,false,false,false,false]}`|
|9|`{"ability":[69,70,72],"is_show":[false,true,false,false,false,false]}`|
|10|`{"ability":[78,79,80],"is_show":[false,true,false,false,false,false]}`|
|11|`{"ability":[86,87,88],"is_show":[false,true,false,false,false,false]}`|
|12|`{"ability":[94,95,96],"is_show":[false,true,false,false,false,false]}`|
|13|`{"ability":[102,103,105],"is_show":[false,true,false,false,false,false]}`|
|14|`{"ability":[4,5,7,6],"is_show":[false,true,true,false,false,false]}`|
|15|`{"ability":[12,13,15,14],"is_show":[false,true,true,false,false,false]}`|
|16|`{"ability":[20,21,22],"is_show":[false,true,true,false,false,false]}`|
|17|`{"ability":[27,28,30,29],"is_show":[false,true,true,false,false,false]}`|
|18|`{"ability":[35,36,38,37],"is_show":[false,true,true,false,false,false]}`|
|19|`{"ability":[43,44,46,45],"is_show":[false,true,true,false,false,false]}`|
|20|`{"ability":[51,52,55,53],"is_show":[false,true,true,false,false,false]}`|
|21|`{"ability":[60,61,64,62],"is_show":[false,true,true,false,false,false]}`|
|22|`{"ability":[69,70,73,72],"is_show":[false,true,true,false,false,false]}`|
|23|`{"ability":[78,79,81,80],"is_show":[false,true,true,false,false,false]}`|
|24|`{"ability":[86,87,89,88],"is_show":[false,true,true,false,false,false]}`|
|25|`{"ability":[94,95,97,96],"is_show":[false,true,true,false,false,false]}`|
|26|`{"ability":[102,103,106,105],"is_show":[false,true,true,false,false,false]}`|
|27|`{"ability":[4,8,7,6],"is_show":[false,true,true,false,false,false]}`|
|28|`{"ability":[12,16,15,14],"is_show":[false,true,true,false,false,false]}`|
|29|`{"ability":[20,23,22],"is_show":[false,true,true,false,false,false]}`|
|30|`{"ability":[27,31,30,29],"is_show":[false,true,true,false,false,false]}`|
|31|`{"ability":[35,39,38,37],"is_show":[false,true,true,false,false,false]}`|
|32|`{"ability":[43,47,46,45],"is_show":[false,true,true,false,false,false]}`|
|33|`{"ability":[51,56,55,53],"is_show":[false,true,true,false,false,false]}`|
|34|`{"ability":[60,65,64,62],"is_show":[false,true,true,false,false,false]}`|
|35|`{"ability":[69,74,73,72],"is_show":[false,true,true,false,false,false]}`|
|36|`{"ability":[78,82,81,80],"is_show":[false,true,true,false,false,false]}`|
|37|`{"ability":[86,90,89,88],"is_show":[false,true,true,false,false,false]}`|
|38|`{"ability":[94,98,97,96],"is_show":[false,true,true,false,false,false]}`|
|39|`{"ability":[102,107,106,105],"is_show":[false,true,true,false,false,false]}`|
|40|`{"ability":[4,8,7,9,6],"is_show":[false,true,true,true,false,false]}`|
|41|`{"ability":[12,16,15,17,14],"is_show":[false,true,true,true,false,false]}`|
|42|`{"ability":[20,23,22,24],"is_show":[false,true,true,true,false,false]}`|
|43|`{"ability":[27,31,30,32,29],"is_show":[false,true,true,true,false,false]}`|
|44|`{"ability":[35,39,38,40,37],"is_show":[false,true,true,true,false,false]}`|
|45|`{"ability":[43,47,46,48,45],"is_show":[false,true,true,true,false,false]}`|
|46|`{"ability":[51,56,55,57,53],"is_show":[false,true,true,true,false,false]}`|
|47|`{"ability":[60,65,64,66,62],"is_show":[false,true,true,true,false,false]}`|
|48|`{"ability":[69,74,73,75,72],"is_show":[false,true,true,true,false,false]}`|
|49|`{"ability":[78,82,81,83,80],"is_show":[false,true,true,true,false,false]}`|
|50|`{"ability":[86,90,89,91,88],"is_show":[false,true,true,true,false,false]}`|
|51|`{"ability":[94,98,97,99,96],"is_show":[false,true,true,true,false,false]}`|
|52|`{"ability":[102,107,106,108,105],"is_show":[false,true,true,true,false,false]}`|
|53|`{"ability":[4,10,7,9,6],"is_show":[false,true,true,true,false,false]}`|
|54|`{"ability":[12,18,15,17,14],"is_show":[false,true,true,true,false,false]}`|
|55|`{"ability":[20,25,22,24],"is_show":[false,true,true,true,false,false]}`|
|56|`{"ability":[27,33,30,32,29],"is_show":[false,true,true,true,false,false]}`|
|57|`{"ability":[35,41,38,40,37],"is_show":[false,true,true,true,false,false]}`|
|58|`{"ability":[43,49,46,48,45],"is_show":[false,true,true,true,false,false]}`|
|59|`{"ability":[51,58,55,57,53],"is_show":[false,true,true,true,false,false]}`|
|60|`{"ability":[60,67,64,66,62],"is_show":[false,true,true,true,false,false]}`|
|61|`{"ability":[69,76,73,75,72],"is_show":[false,true,true,true,false,false]}`|
|62|`{"ability":[78,84,81,83,80],"is_show":[false,true,true,true,false,false]}`|
|63|`{"ability":[86,92,89,91,88],"is_show":[false,true,true,true,false,false]}`|
|64|`{"ability":[94,100,97,99,96],"is_show":[false,true,true,true,false,false]}`|
|65|`{"ability":[102,109,106,108,105],"is_show":[false,true,true,true,false,false]}`|
|66|`{"ability":[4,10,7,9,11,6],"is_show":[false,true,true,true,true,false]}`|
|67|`{"ability":[12,18,15,17,19,14],"is_show":[false,true,true,true,true,false]}`|
|68|`{"ability":[20,25,22,24,26],"is_show":[false,true,true,true,true,false]}`|
|69|`{"ability":[27,33,30,32,34,29],"is_show":[false,true,true,true,true,false]}`|
|70|`{"ability":[35,41,38,40,42,37],"is_show":[false,true,true,true,true,false]}`|
|71|`{"ability":[43,49,46,48,50,45],"is_show":[false,true,true,true,true,false]}`|
|72|`{"ability":[51,58,55,57,59,53],"is_show":[false,true,true,true,true,false]}`|
|73|`{"ability":[60,67,64,66,68,62],"is_show":[false,true,true,true,true,false]}`|
|74|`{"ability":[69,76,73,75,77,72],"is_show":[false,true,true,true,true,false]}`|
|75|`{"ability":[78,84,81,83,85,80],"is_show":[false,true,true,true,true,false]}`|
|76|`{"ability":[86,92,89,91,93,88],"is_show":[false,true,true,true,true,false]}`|
|77|`{"ability":[94,100,97,99,101,96],"is_show":[false,true,true,true,true,false]}`|
|78|`{"ability":[102,109,106,108,110,105],"is_show":[false,true,true,true,true,false]}`|

## Npc

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|78|本表行键；与其他表同值不自动代表同一对象。|
|show_name|number|78|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|quality|number|78|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|profession|number|78|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camp|number|78|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|style|number|78|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|star|number|78|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"quality":60,"star":0}`|
|2|`{"quality":60,"star":0}`|
|3|`{"quality":60,"star":0}`|
|4|`{"quality":60,"star":0}`|
|5|`{"quality":60,"star":0}`|
|6|`{"quality":60,"star":0}`|
|7|`{"quality":60,"star":0}`|
|8|`{"quality":60,"star":0}`|
|9|`{"quality":60,"star":0}`|
|10|`{"quality":60,"star":0}`|
|11|`{"quality":60,"star":0}`|
|12|`{"quality":60,"star":0}`|
|13|`{"quality":70,"star":0}`|
|14|`{"quality":60,"star":1}`|
|15|`{"quality":60,"star":1}`|
|16|`{"quality":60,"star":1}`|
|17|`{"quality":60,"star":1}`|
|18|`{"quality":60,"star":1}`|
|19|`{"quality":60,"star":1}`|
|20|`{"quality":60,"star":1}`|
|21|`{"quality":60,"star":1}`|
|22|`{"quality":60,"star":1}`|
|23|`{"quality":60,"star":1}`|
|24|`{"quality":60,"star":1}`|
|25|`{"quality":60,"star":1}`|
|26|`{"quality":70,"star":1}`|
|27|`{"quality":60,"star":2}`|
|28|`{"quality":60,"star":2}`|
|29|`{"quality":60,"star":2}`|
|30|`{"quality":60,"star":2}`|
|31|`{"quality":60,"star":2}`|
|32|`{"quality":60,"star":2}`|
|33|`{"quality":60,"star":2}`|
|34|`{"quality":60,"star":2}`|
|35|`{"quality":60,"star":2}`|
|36|`{"quality":60,"star":2}`|
|37|`{"quality":60,"star":2}`|
|38|`{"quality":60,"star":2}`|
|39|`{"quality":70,"star":2}`|
|40|`{"quality":60,"star":3}`|
|41|`{"quality":60,"star":3}`|
|42|`{"quality":60,"star":3}`|
|43|`{"quality":60,"star":3}`|
|44|`{"quality":60,"star":3}`|
|45|`{"quality":60,"star":3}`|
|46|`{"quality":60,"star":3}`|
|47|`{"quality":60,"star":3}`|
|48|`{"quality":60,"star":3}`|
|49|`{"quality":60,"star":3}`|
|50|`{"quality":60,"star":3}`|
|51|`{"quality":60,"star":3}`|
|52|`{"quality":70,"star":3}`|
|53|`{"quality":60,"star":4}`|
|54|`{"quality":60,"star":4}`|
|55|`{"quality":60,"star":4}`|
|56|`{"quality":60,"star":4}`|
|57|`{"quality":60,"star":4}`|
|58|`{"quality":60,"star":4}`|
|59|`{"quality":60,"star":4}`|
|60|`{"quality":60,"star":4}`|
|61|`{"quality":60,"star":4}`|
|62|`{"quality":60,"star":4}`|
|63|`{"quality":60,"star":4}`|
|64|`{"quality":60,"star":4}`|
|65|`{"quality":70,"star":4}`|
|66|`{"quality":60,"star":5}`|
|67|`{"quality":60,"star":5}`|
|68|`{"quality":60,"star":5}`|
|69|`{"quality":60,"star":5}`|
|70|`{"quality":60,"star":5}`|
|71|`{"quality":60,"star":5}`|
|72|`{"quality":60,"star":5}`|
|73|`{"quality":60,"star":5}`|
|74|`{"quality":60,"star":5}`|
|75|`{"quality":60,"star":5}`|
|76|`{"quality":60,"star":5}`|
|77|`{"quality":60,"star":5}`|
|78|`{"quality":70,"star":5}`|

## Attr

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|16|本表行键；与其他表同值不自动代表同一对象。|
|sync_update_harm|boolean|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|no_negative|boolean|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|up_limit|number|16|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|is_ratio|boolean|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|customize_func|null|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|local_sync|boolean|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|des|string|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"up_limit":0,"is_ratio":false,"customize_func":null,"local_sync":true}`|
|2|`{"up_limit":0,"is_ratio":false,"customize_func":null,"local_sync":true}`|
|3|`{"up_limit":0,"is_ratio":false,"customize_func":null,"local_sync":true}`|
|4|`{"up_limit":0,"is_ratio":false,"customize_func":null,"local_sync":false}`|
|5|`{"up_limit":0,"is_ratio":false,"customize_func":null,"local_sync":false}`|
|6|`{"up_limit":0,"is_ratio":false,"customize_func":null,"local_sync":false}`|
|7|`{"up_limit":0,"is_ratio":false,"customize_func":null,"local_sync":true}`|
|8|`{"up_limit":0,"is_ratio":false,"customize_func":null,"local_sync":true}`|
|9|`{"up_limit":0,"is_ratio":false,"customize_func":null,"local_sync":true}`|
|16|`{"up_limit":0,"is_ratio":true,"customize_func":null,"local_sync":true}`|
|17|`{"up_limit":0,"is_ratio":true,"customize_func":null,"local_sync":true}`|
|18|`{"up_limit":0,"is_ratio":true,"customize_func":null,"local_sync":true}`|
|19|`{"up_limit":0,"is_ratio":true,"customize_func":null,"local_sync":true}`|
|20|`{"up_limit":0,"is_ratio":true,"customize_func":null,"local_sync":true}`|
|26|`{"up_limit":0,"is_ratio":false,"customize_func":null,"local_sync":false}`|
|27|`{"up_limit":0,"is_ratio":true,"customize_func":null,"local_sync":false}`|

## Buff

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|33|本表行键；与其他表同值不自动代表同一对象。|
|state|number|33|旧活动阶段ID数组；与state_end_day/state_end_time逐项配对。|
|type|number|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|overlay_type|number|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|overlay|number|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|dispel|boolean|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|dead_rm|boolean|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|do_limit|number|33|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|over_limit|number|33|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|point|number|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|eff|number/array|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|touch_index|number|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|transfer|boolean|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sub_type|number|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|icon|string|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|prompt|number|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|effect|string|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_show_blood|boolean|33|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|50001|`{"state":0,"type":3,"overlay_type":0,"do_limit":1,"over_limit":0,"point":0,"sub_type":0,"is_show_blood":false}`|
|50002|`{"state":0,"type":1,"overlay_type":0,"do_limit":1,"over_limit":0,"point":0,"sub_type":0,"is_show_blood":false}`|
|50003|`{"state":0,"type":2,"overlay_type":0,"do_limit":1,"over_limit":0,"point":0,"sub_type":0,"is_show_blood":false}`|
|50010|`{"state":0,"type":2,"overlay_type":3,"do_limit":1,"over_limit":0,"point":6,"sub_type":0,"is_show_blood":true}`|
|50011|`{"state":0,"type":2,"overlay_type":3,"do_limit":1,"over_limit":0,"point":0,"sub_type":0,"is_show_blood":true}`|
|50012|`{"state":0,"type":1,"overlay_type":3,"do_limit":1,"over_limit":0,"point":0,"sub_type":0,"is_show_blood":true}`|
|50013|`{"state":0,"type":1,"overlay_type":3,"do_limit":1,"over_limit":0,"point":7,"sub_type":0,"is_show_blood":false}`|
|50014|`{"state":0,"type":1,"overlay_type":3,"do_limit":1,"over_limit":0,"point":1,"sub_type":0,"is_show_blood":false}`|
|50015|`{"state":0,"type":1,"overlay_type":3,"do_limit":1,"over_limit":0,"point":0,"sub_type":0,"is_show_blood":true}`|
|50016|`{"state":0,"type":1,"overlay_type":3,"do_limit":1,"over_limit":0,"point":0,"sub_type":0,"is_show_blood":false}`|
|50017|`{"state":0,"type":1,"overlay_type":3,"do_limit":1,"over_limit":0,"point":0,"sub_type":0,"is_show_blood":false}`|
|50018|`{"state":0,"type":1,"overlay_type":3,"do_limit":1,"over_limit":0,"point":0,"sub_type":0,"is_show_blood":true}`|
|50020|`{"state":0,"type":2,"overlay_type":3,"do_limit":1,"over_limit":0,"point":0,"sub_type":0,"is_show_blood":true}`|
|50021|`{"state":0,"type":1,"overlay_type":3,"do_limit":1,"over_limit":0,"point":8,"sub_type":0,"is_show_blood":true}`|
|50022|`{"state":0,"type":1,"overlay_type":3,"do_limit":1,"over_limit":0,"point":9,"sub_type":0,"is_show_blood":false}`|
|50023|`{"state":0,"type":1,"overlay_type":3,"do_limit":1,"over_limit":0,"point":0,"sub_type":0,"is_show_blood":false}`|
|50024|`{"state":0,"type":1,"overlay_type":3,"do_limit":1,"over_limit":0,"point":0,"sub_type":0,"is_show_blood":true}`|
|50025|`{"state":0,"type":1,"overlay_type":3,"do_limit":1,"over_limit":0,"point":0,"sub_type":0,"is_show_blood":true}`|
|50026|`{"state":0,"type":1,"overlay_type":3,"do_limit":1,"over_limit":0,"point":4,"sub_type":0,"is_show_blood":false}`|
|50028|`{"state":0,"type":1,"overlay_type":3,"do_limit":1,"over_limit":0,"point":0,"sub_type":0,"is_show_blood":false}`|
|50029|`{"state":0,"type":1,"overlay_type":3,"do_limit":1,"over_limit":0,"point":0,"sub_type":0,"is_show_blood":false}`|
|50031|`{"state":0,"type":1,"overlay_type":3,"do_limit":1,"over_limit":0,"point":0,"sub_type":0,"is_show_blood":false}`|
|50032|`{"state":0,"type":1,"overlay_type":3,"do_limit":1,"over_limit":0,"point":0,"sub_type":0,"is_show_blood":false}`|
|50033|`{"state":0,"type":1,"overlay_type":3,"do_limit":1,"over_limit":0,"point":14,"sub_type":0,"is_show_blood":false}`|
|50034|`{"state":0,"type":1,"overlay_type":3,"do_limit":1,"over_limit":0,"point":0,"sub_type":0,"is_show_blood":false}`|
|50035|`{"state":0,"type":1,"overlay_type":3,"do_limit":1,"over_limit":0,"point":0,"sub_type":0,"is_show_blood":false}`|
|50036|`{"state":0,"type":1,"overlay_type":3,"do_limit":1,"over_limit":0,"point":4,"sub_type":0,"is_show_blood":false}`|
|50037|`{"state":0,"type":1,"overlay_type":3,"do_limit":1,"over_limit":0,"point":0,"sub_type":0,"is_show_blood":true}`|
|50038|`{"state":0,"type":1,"overlay_type":3,"do_limit":1,"over_limit":0,"point":5,"sub_type":0,"is_show_blood":false}`|
|50039|`{"state":0,"type":1,"overlay_type":3,"do_limit":1,"over_limit":0,"point":10,"sub_type":0,"is_show_blood":false}`|
|50040|`{"state":0,"type":1,"overlay_type":3,"do_limit":1,"over_limit":0,"point":11,"sub_type":0,"is_show_blood":false}`|
|50041|`{"state":0,"type":2,"overlay_type":3,"do_limit":1,"over_limit":0,"point":0,"sub_type":0,"is_show_blood":true}`|
|50042|`{"state":0,"type":0,"overlay_type":3,"do_limit":1,"over_limit":0,"point":0,"sub_type":0,"is_show_blood":false}`|

## AbilityBuffDes

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|15|本表行键；与其他表同值不自动代表同一对象。|
|show_name|number|15|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|icon|string|15|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|text|number|15|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

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

## AbilityDes

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|78|本表行键；与其他表同值不自动代表同一对象。|
|show|number|78|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|feature|array/object|78|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|5|`{}`|
|7|`{}`|
|8|`{}`|
|9|`{}`|
|10|`{}`|
|11|`{}`|
|13|`{}`|
|15|`{}`|
|16|`{}`|
|17|`{}`|
|18|`{}`|
|19|`{}`|
|21|`{}`|
|22|`{}`|
|23|`{}`|
|24|`{}`|
|25|`{}`|
|26|`{}`|
|28|`{}`|
|30|`{}`|
|31|`{}`|
|32|`{}`|
|33|`{}`|
|34|`{}`|
|36|`{}`|
|38|`{}`|
|39|`{}`|
|40|`{}`|
|41|`{}`|
|42|`{}`|
|44|`{}`|
|46|`{}`|
|47|`{}`|
|48|`{}`|
|49|`{}`|
|50|`{}`|
|52|`{}`|
|55|`{}`|
|56|`{}`|
|57|`{}`|
|58|`{}`|
|59|`{}`|
|61|`{}`|
|64|`{}`|
|65|`{}`|
|66|`{}`|
|67|`{}`|
|68|`{}`|
|70|`{}`|
|73|`{}`|
|74|`{}`|
|75|`{}`|
|76|`{}`|
|77|`{}`|
|79|`{}`|
|81|`{}`|
|82|`{}`|
|83|`{}`|
|84|`{}`|
|85|`{}`|
|87|`{}`|
|89|`{}`|
|90|`{}`|
|91|`{}`|
|92|`{}`|
|93|`{}`|
|95|`{}`|
|97|`{}`|
|98|`{}`|
|99|`{}`|
|100|`{}`|
|101|`{}`|
|103|`{}`|
|106|`{}`|
|107|`{}`|
|108|`{}`|
|109|`{}`|
|110|`{}`|

## AbilityEffectType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|show_name|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tag_img|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|

## AbilityType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|8|本表行键；与其他表同值不自动代表同一对象。|
|show_name|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_icon|string|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pop_bg|string|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

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

## Ability

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|111|本表行键；与其他表同值不自动代表同一对象。|
|type|number|111|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ability_skill|string|111|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|text|number|111|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"type":1,"ability_skill":"character2d_board_skill_1.prefab"}`|
|2|`{"type":1,"ability_skill":"character2d_board_skill_1.prefab"}`|
|3|`{"type":1,"ability_skill":"character2d_board_skill_1.prefab"}`|
|4|`{"type":1,"ability_skill":"character2d_skill_rx_ans_normal.prefab"}`|
|5|`{"type":2,"ability_skill":"character2d_skill_rx_ans.prefab"}`|
|6|`{"type":3,"ability_skill":"character2d_skill_rx_hynj_pre.prefab"}`|
|7|`{"type":3,"ability_skill":""}`|
|8|`{"type":2,"ability_skill":"character2d_skill_rx_ans.prefab"}`|
|9|`{"type":3,"ability_skill":""}`|
|10|`{"type":2,"ability_skill":"character2d_skill_rx_ans.prefab"}`|
|11|`{"type":3,"ability_skill":""}`|
|12|`{"type":1,"ability_skill":"character2d_skill_rx_hynj_normal.prefab"}`|
|13|`{"type":2,"ability_skill":"character2d_skill_rx_hynj.prefab"}`|
|14|`{"type":3,"ability_skill":"character2d_skill_rx_hynj_pre.prefab"}`|
|15|`{"type":3,"ability_skill":""}`|
|16|`{"type":2,"ability_skill":"character2d_skill_rx_hynj.prefab"}`|
|17|`{"type":3,"ability_skill":""}`|
|18|`{"type":2,"ability_skill":"character2d_skill_rx_hynj.prefab"}`|
|19|`{"type":3,"ability_skill":""}`|
|20|`{"type":1,"ability_skill":"character2d_skill_rx_cx_normal.prefab"}`|
|21|`{"type":2,"ability_skill":"character2d_skill_rx_cx.prefab"}`|
|22|`{"type":3,"ability_skill":""}`|
|23|`{"type":2,"ability_skill":"character2d_skill_rx_cx.prefab"}`|
|24|`{"type":3,"ability_skill":""}`|
|25|`{"type":2,"ability_skill":"character2d_skill_rx_cx.prefab"}`|
|26|`{"type":3,"ability_skill":""}`|
|27|`{"type":1,"ability_skill":"character2d_skill_ww_myss_normal.prefab"}`|
|28|`{"type":2,"ability_skill":"character2d_skill_ww_myss.prefab"}`|
|29|`{"type":3,"ability_skill":"character2d_skill_rx_hynj_pre.prefab"}`|
|30|`{"type":3,"ability_skill":""}`|
|31|`{"type":2,"ability_skill":"character2d_skill_ww_myss.prefab"}`|
|32|`{"type":3,"ability_skill":""}`|
|33|`{"type":2,"ability_skill":"character2d_skill_ww_myss.prefab"}`|
|34|`{"type":3,"ability_skill":""}`|
|35|`{"type":1,"ability_skill":"character2d_skill_ww_ll_normal.prefab"}`|
|36|`{"type":2,"ability_skill":"character2d_skill_ww_ll.prefab"}`|
|37|`{"type":4,"ability_skill":"character2d_skill_rx_hynj_pre.prefab"}`|
|38|`{"type":3,"ability_skill":""}`|
|39|`{"type":2,"ability_skill":"character2d_skill_ww_ll.prefab"}`|
|40|`{"type":3,"ability_skill":""}`|
|41|`{"type":2,"ability_skill":"character2d_skill_ww_ll.prefab"}`|
|42|`{"type":3,"ability_skill":""}`|
|43|`{"type":1,"ability_skill":"character2d_skill_ww_sqhn_normal.prefab"}`|
|44|`{"type":2,"ability_skill":"character2d_skill_ww_sqhn.prefab"}`|
|45|`{"type":3,"ability_skill":"character2d_skill_rx_hynj_pre.prefab"}`|
|46|`{"type":3,"ability_skill":""}`|
|47|`{"type":2,"ability_skill":"character2d_skill_ww_sqhn.prefab"}`|
|48|`{"type":3,"ability_skill":""}`|
|49|`{"type":2,"ability_skill":"character2d_skill_ww_sqhn.prefab"}`|
|50|`{"type":3,"ability_skill":""}`|
|51|`{"type":1,"ability_skill":"character2d_skill_fy_aml_normal.prefab"}`|
|52|`{"type":2,"ability_skill":"character2d_skill_fy_aml.prefab"}`|
|53|`{"type":3,"ability_skill":"character2d_skill_rx_hynj_pre.prefab"}`|
|54|`{"type":5,"ability_skill":"character2d_skill_fy_aml_pursuit.prefab"}`|
|55|`{"type":3,"ability_skill":""}`|
|56|`{"type":2,"ability_skill":"character2d_skill_fy_aml.prefab"}`|
|57|`{"type":3,"ability_skill":""}`|
|58|`{"type":2,"ability_skill":"character2d_skill_fy_aml.prefab"}`|
|59|`{"type":3,"ability_skill":""}`|
|60|`{"type":1,"ability_skill":"character2d_skill_fy_jtzy_normal.prefab"}`|
|61|`{"type":2,"ability_skill":"character2d_skill_fy_jtzy.prefab"}`|
|62|`{"type":4,"ability_skill":"character2d_skill_rx_hynj_pre.prefab"}`|
|63|`{"type":5,"ability_skill":"character2d_skill_fy_jtzy_pursuit.prefab"}`|
|64|`{"type":3,"ability_skill":""}`|
|65|`{"type":2,"ability_skill":"character2d_skill_fy_jtzy.prefab"}`|
|66|`{"type":3,"ability_skill":""}`|
|67|`{"type":2,"ability_skill":"character2d_skill_fy_jtzy.prefab"}`|
|68|`{"type":3,"ability_skill":""}`|
|69|`{"type":1,"ability_skill":"character2d_skill_fy_wns_normal.prefab"}`|
|70|`{"type":2,"ability_skill":"character2d_skill_fy_wns.prefab"}`|
|71|`{"type":5,"ability_skill":"character2d_skill_fy_wns_pursuit.prefab"}`|
|72|`{"type":3,"ability_skill":"character2d_skill_rx_hynj_pre.prefab"}`|
|73|`{"type":3,"ability_skill":""}`|
|74|`{"type":2,"ability_skill":"character2d_skill_fy_wns.prefab"}`|
|75|`{"type":3,"ability_skill":""}`|
|76|`{"type":2,"ability_skill":"character2d_skill_fy_wns.prefab"}`|
|77|`{"type":3,"ability_skill":""}`|
|78|`{"type":1,"ability_skill":"character2d_skill_jl_blst_normal.prefab"}`|
|79|`{"type":2,"ability_skill":"character2d_skill_jl_blst.prefab"}`|
|80|`{"type":3,"ability_skill":"character2d_skill_rx_hynj_pre.prefab"}`|
|81|`{"type":3,"ability_skill":""}`|
|82|`{"type":2,"ability_skill":"character2d_skill_jl_blst.prefab"}`|
|83|`{"type":3,"ability_skill":""}`|
|84|`{"type":2,"ability_skill":"character2d_skill_jl_blst.prefab"}`|
|85|`{"type":3,"ability_skill":""}`|
|86|`{"type":1,"ability_skill":"character2d_skill_jl_yls_normal.prefab"}`|
|87|`{"type":2,"ability_skill":"character2d_skill_jl_yls.prefab"}`|
|88|`{"type":4,"ability_skill":"character2d_skill_rx_hynj_pre.prefab"}`|
|89|`{"type":3,"ability_skill":""}`|
|90|`{"type":2,"ability_skill":"character2d_skill_jl_yls.prefab"}`|
|91|`{"type":3,"ability_skill":""}`|
|92|`{"type":2,"ability_skill":"character2d_skill_jl_yls.prefab"}`|
|93|`{"type":3,"ability_skill":""}`|
|94|`{"type":1,"ability_skill":"character2d_skill_jl_xy_normal.prefab"}`|
|95|`{"type":2,"ability_skill":"character2d_skill_jl_xy.prefab"}`|
|96|`{"type":3,"ability_skill":"character2d_skill_rx_hynj_pre.prefab"}`|
|97|`{"type":3,"ability_skill":""}`|
|98|`{"type":2,"ability_skill":"character2d_skill_jl_xy.prefab"}`|
|99|`{"type":3,"ability_skill":""}`|
|100|`{"type":2,"ability_skill":"character2d_skill_jl_xy.prefab"}`|
|101|`{"type":3,"ability_skill":""}`|
|102|`{"type":1,"ability_skill":"character2d_skill_sg_mxe_normal.prefab"}`|
|103|`{"type":2,"ability_skill":"character2d_skill_sg_mxe.prefab"}`|
|104|`{"type":3,"ability_skill":""}`|
|105|`{"type":3,"ability_skill":"character2d_skill_rx_hynj_pre.prefab"}`|
|106|`{"type":3,"ability_skill":""}`|
|107|`{"type":2,"ability_skill":"character2d_skill_sg_mxe.prefab"}`|
|108|`{"type":3,"ability_skill":""}`|
|109|`{"type":2,"ability_skill":"character2d_skill_sg_mxe.prefab"}`|
|110|`{"type":3,"ability_skill":""}`|
|111|`{"type":4,"ability_skill":""}`|

## AbilityShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|89|本表行键；与其他表同值不自动代表同一对象。|
|show_name|number|89|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skill_icon|string|89|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|effect_type|array|89|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"skill_icon":"Icon_Skill_lunaier_p1.png"}`|
|2|`{"skill_icon":"Icon_Skill_lunaier_p1.png"}`|
|3|`{"skill_icon":"Icon_Skill_lunaier_p1.png"}`|
|4|`{"skill_icon":"Icon_Skill_lunaier_p1.png"}`|
|5|`{"skill_icon":"Icon_Skill_lunaier_p1.png"}`|
|6|`{"skill_icon":"Icon_Skill_lunaier_p1.png"}`|
|7|`{"skill_icon":"Icon_Skill_lunaier_p1.png"}`|
|8|`{"skill_icon":"Icon_Skill_lunaier_p1.png"}`|
|9|`{"skill_icon":"Icon_Skill_lunaier_p1.png"}`|
|10|`{"skill_icon":"Icon_Skill_lunaier_p1.png"}`|
|11|`{"skill_icon":"Icon_Skill_lunaier_p1.png"}`|
|100|`{"skill_icon":"Icon_Skill_DieGe_b1.png"}`|
|101|`{"skill_icon":"Icon_Skill_DieGe_n1.png"}`|
|102|`{"skill_icon":"Icon_Skill_DieGe_b1.png"}`|
|103|`{"skill_icon":"Icon_Skill_DieGe_b5.png"}`|
|104|`{"skill_icon":"Icon_Skill_DieGe_b1.png"}`|
|105|`{"skill_icon":"Icon_Skill_DieGe_b3.png"}`|
|106|`{"skill_icon":"Icon_Skill_xise_b4.png"}`|
|107|`{"skill_icon":"Icon_Skill_xianzhen.png"}`|
|108|`{"skill_icon":"Icon_Skill_xise_b4.png"}`|
|109|`{"skill_icon":"Icon_Skill_leina_b4.png"}`|
|110|`{"skill_icon":"Icon_Skill_xise_b4.png"}`|
|111|`{"skill_icon":"Icon_Skill_STMB_S2.png"}`|
|112|`{"skill_icon":"Icon_Skill_pake_n1.png"}`|
|113|`{"skill_icon":"Icon_Skill_DieGe_S1.png"}`|
|114|`{"skill_icon":"Icon_Skill_pake_n1.png"}`|
|115|`{"skill_icon":"Icon_Skill_lina_b2.png"}`|
|116|`{"skill_icon":"Icon_Skill_pake_n1.png"}`|
|117|`{"skill_icon":"Icon_Skill_lina_b1.png"}`|
|118|`{"skill_icon":"Icon_Skill_jiu_b5.png"}`|
|119|`{"skill_icon":"Icon_Skill_hela_b2.png"}`|
|120|`{"skill_icon":"Icon_Skill_jiu_b5.png"}`|
|121|`{"skill_icon":"Icon_Skill_wuwei.png"}`|
|122|`{"skill_icon":"Icon_Skill_jiu_b5.png"}`|
|123|`{"skill_icon":"Icon_Skill_mingqijineng3.png"}`|
|124|`{"skill_icon":"Icon_Skill_zhefu.png"}`|
|125|`{"skill_icon":"Icon_Skill_hela_b3.png"}`|
|126|`{"skill_icon":"Icon_Skill_zhefu.png"}`|
|127|`{"skill_icon":"Icon_Skill_buqu.png"}`|
|128|`{"skill_icon":"Icon_Skill_zhefu.png"}`|
|129|`{"skill_icon":"Icon_Skill_qianggong.png"}`|
|130|`{"skill_icon":"Icon_Skill_molin_n1.png"}`|
|131|`{"skill_icon":"Icon_Skill_molin_b2.png"}`|
|132|`{"skill_icon":"Icon_Skill_molin_n1.png"}`|
|133|`{"skill_icon":"Icon_Skill_jinu.png"}`|
|134|`{"skill_icon":"Icon_Skill_molin_n1.png"}`|
|135|`{"skill_icon":"Icon_Skill_molin_b4.png"}`|
|136|`{"skill_icon":"Icon_Skill_GYMB_S5.png"}`|
|137|`{"skill_icon":"Icon_Skill_dikang.png"}`|
|138|`{"skill_icon":"Icon_Skill_GYMB_S5.png"}`|
|139|`{"skill_icon":"Icon_Skill_huizhangzuizhongjianshang.png"}`|
|140|`{"skill_icon":"Icon_Skill_GYMB_S5.png"}`|
|141|`{"skill_icon":"Icon_Skill_shouge.png"}`|
|142|`{"skill_icon":"Icon_Skill_GYMB_S3.png"}`|
|143|`{"skill_icon":"Icon_Skill_pojun.png"}`|
|144|`{"skill_icon":"Icon_Skill_GYMB_S3.png"}`|
|145|`{"skill_icon":"Icon_Skill_Mo_b4.png"}`|
|146|`{"skill_icon":"Icon_Skill_GYMB_S3.png"}`|
|147|`{"skill_icon":"Icon_Skill_Mo_n1.png"}`|
|148|`{"skill_icon":"Icon_moling_longzuzhoushu.png"}`|
|149|`{"skill_icon":"Icon_Skill_cisha.png"}`|
|150|`{"skill_icon":"Icon_moling_longzuzhoushu.png"}`|
|151|`{"skill_icon":"Icon_moling_longxisuoding.png"}`|
|152|`{"skill_icon":"Icon_moling_longzuzhoushu.png"}`|
|153|`{"skill_icon":"Icon_Skill_LiZi_p1.png"}`|
|154|`{"skill_icon":"Icon_Skill_yilishabai_p1.png"}`|
|155|`{"skill_icon":"Icon_Skill_yilishabai_n1.png"}`|
|156|`{"skill_icon":"Icon_Skill_yilishabai_p1.png"}`|
|157|`{"skill_icon":"Icon_Skill_yilishabai_b4.png"}`|
|158|`{"skill_icon":"Icon_Skill_yilishabai_p1.png"}`|
|159|`{"skill_icon":"Icon_Skill_yilishabai_b1.png"}`|
|160|`{"skill_icon":"icon_yingxiong_hunguibian.png"}`|
|161|`{"skill_icon":"icon_yingxiong_anhunqu.png"}`|
|162|`{"skill_icon":"icon_yingxiong_hunguibian.png"}`|
|163|`{"skill_icon":"icon_yingxiong_AHSjuexingjineng.png"}`|
|164|`{"skill_icon":"icon_yingxiong_hunguibian.png"}`|
|165|`{"skill_icon":"icon_yingxiong_yinduPU.png"}`|
|166|`{"skill_icon":"Icon_Skill_xiye_l1.png"}`|
|167|`{"skill_icon":"Icon_Skill_xiye_b4.png"}`|
|168|`{"skill_icon":"Icon_Skill_xiye_l1.png"}`|
|169|`{"skill_icon":"Icon_Skill_xiye_p1.png"}`|
|170|`{"skill_icon":"Icon_Skill_xiye_l1.png"}`|
|171|`{"skill_icon":"Icon_Skill_xiye_n1.png"}`|
|172|`{"skill_icon":"icon_yingxiong_liuguangtianyun.png"}`|
|173|`{"skill_icon":"icon_skill_nainaizi_ysqx.png"}`|
|174|`{"skill_icon":"icon_yingxiong_liuguangtianyun.png"}`|
|175|`{"skill_icon":"icon_skill_nainaizi_axjj.png"}`|
|176|`{"skill_icon":"icon_yingxiong_liuguangtianyun.png"}`|
|177|`{"skill_icon":"icon_yingxiong_xingsan.png"}`|

## Effect

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|87|本表行键；与其他表同值不自动代表同一对象。|
|_param_info|null|87|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|c_module|null|87|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|virtual_actor_disable|boolean|87|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|args|array/object|87|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|100001|`{}`|
|100002|`{}`|
|100003|`{}`|
|100004|`{}`|
|100005|`{}`|
|100006|`{}`|
|100007|`{}`|
|100008|`{}`|
|100009|`{}`|
|100010|`{}`|
|100011|`{}`|
|100012|`{}`|
|100013|`{}`|
|100014|`{}`|
|100015|`{}`|
|100016|`{}`|
|100017|`{}`|
|100018|`{}`|
|100019|`{}`|
|100021|`{}`|
|100022|`{}`|
|100023|`{}`|
|100024|`{}`|
|100025|`{}`|
|100026|`{}`|
|100027|`{}`|
|100028|`{}`|
|100029|`{}`|
|100030|`{}`|
|100031|`{}`|
|100032|`{}`|
|100033|`{}`|
|100034|`{}`|
|100035|`{}`|
|100036|`{}`|
|100037|`{}`|
|100038|`{}`|
|100039|`{}`|
|100040|`{}`|
|100041|`{}`|
|100042|`{}`|
|100043|`{}`|
|100044|`{}`|
|100045|`{}`|
|100046|`{}`|
|100047|`{}`|
|100049|`{}`|
|100050|`{}`|
|100051|`{}`|
|100052|`{}`|
|100053|`{}`|
|100054|`{}`|
|100055|`{}`|
|100056|`{}`|
|100057|`{}`|
|100058|`{}`|
|100059|`{}`|
|100060|`{}`|
|100061|`{}`|
|100062|`{}`|
|100063|`{}`|
|100064|`{}`|
|100065|`{}`|
|100066|`{}`|
|100067|`{}`|
|100068|`{}`|
|100069|`{}`|
|100070|`{}`|
|200001|`{}`|
|200002|`{}`|
|200003|`{}`|
|200004|`{}`|
|200005|`{}`|
|200006|`{}`|
|200007|`{}`|
|200008|`{}`|
|200009|`{}`|
|200010|`{}`|
|200011|`{}`|
|200012|`{}`|
|200013|`{}`|
|200014|`{}`|
|200015|`{}`|
|200016|`{}`|
|200017|`{}`|
|200018|`{}`|
|200019|`{}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|angle|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|board_skill|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|board_skill_four|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|board_skill_five|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|op_timeout|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ready_guard_extra|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|board_rage|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|auto_operate_interval_min|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|auto_operate_interval_max|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|min_dec_rage|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|countdown_ani|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"board_skill":1,"board_skill_four":2,"board_skill_five":3,"op_timeout":15,"auto_operate_interval_min":1,"auto_operate_interval_max":1,"min_dec_rage":2000,"countdown_ani":10}`|

## ActionType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|19|本表行键；与其他表同值不自动代表同一对象。|
|is_push|boolean|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"is_push":false}`|
|2|`{"is_push":false}`|
|3|`{"is_push":true}`|
|4|`{"is_push":false}`|
|5|`{"is_push":false}`|
|6|`{"is_push":false}`|
|7|`{"is_push":false}`|
|8|`{"is_push":false}`|
|9|`{"is_push":false}`|
|10|`{"is_push":false}`|
|11|`{"is_push":false}`|
|12|`{"is_push":false}`|
|13|`{"is_push":false}`|
|14|`{"is_push":false}`|
|15|`{"is_push":false}`|
|16|`{"is_push":false}`|
|17|`{"is_push":false}`|
|18|`{"is_push":false}`|
|19|`{"is_push":false}`|

## FighterRoleType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|

## LimitRule

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|31|本表行键；与其他表同值不自动代表同一对象。|
|_param_info|null|31|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|symbol|string|31|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|limits|object/array|31|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|init_f|object/array/number|31|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"limits":{"global":"TableEmpty"},"init_f":{"global":"TableEmpty"}}`|
|2|`{"limits":{"global":"TableEmpty"},"init_f":["init_default"]}`|
|3|`{"limits":{"global":"TableEmpty"},"init_f":{"global":"TableEmpty"}}`|
|4|`{"limits":{"global":"TableEmpty"},"init_f":["init_default_tow"]}`|
|5|`{"limits":{"global":"TableEmpty"},"init_f":["init_default_tow"]}`|
|6|`{"limits":{"global":"TableEmpty"},"init_f":{"global":"TableEmpty"}}`|
|7|`{"limits":{"global":"TableEmpty"},"init_f":{"global":"TableEmpty"}}`|
|8|`{"limits":{"global":"TableEmpty"},"init_f":{"global":"TableEmpty"}}`|
|9|`{"limits":{"global":"TableEmpty"},"init_f":["init_default"]}`|
|10|`{"limits":{"global":"TableEmpty"},"init_f":["init_default_tow"]}`|
|11|`{"limits":{"global":"TableEmpty"},"init_f":["init_round_limit"]}`|
|12|`{"limits":{"global":"TableEmpty"},"init_f":["init_limit_size"]}`|
|13|`{"limits":{"global":"TableEmpty"},"init_f":["init_default"]}`|
|14|`{"limits":{"global":"TableEmpty"},"init_f":["init_default"]}`|
|15|`{"limits":{"global":"TableEmpty"},"init_f":["init_default"]}`|
|16|`{"limits":{"global":"TableEmpty"},"init_f":["init_default_tow"]}`|
|17|`{"limits":{"global":"TableEmpty"},"init_f":["init_default"]}`|
|100001|`{"limits":{"global":"TableEmpty"},"init_f":0}`|
|100002|`{"limits":{"global":"TableEmpty"},"init_f":0}`|
|100003|`{"limits":{"global":"TableEmpty"},"init_f":{"global":"TableEmpty"}}`|
|100004|`{"limits":{"global":"TableEmpty"},"init_f":{"global":"TableEmpty"}}`|
|100005|`{"limits":{"global":"TableEmpty"},"init_f":{"global":"TableEmpty"}}`|
|100006|`{"limits":[3,9],"init_f":{"global":"TableEmpty"}}`|
|100007|`{"limits":[3,9],"init_f":{"global":"TableEmpty"}}`|
|100008|`{"limits":[3,9],"init_f":{"global":"TableEmpty"}}`|
|100009|`{"limits":[3,9,10],"init_f":{"global":"TableEmpty"}}`|
|100010|`{"limits":[3,14,13],"init_f":{"global":"TableEmpty"}}`|
|100011|`{"limits":[3,9,10],"init_f":{"global":"TableEmpty"}}`|
|100012|`{"limits":[9,10],"init_f":{"global":"TableEmpty"}}`|
|100013|`{"limits":[3,15],"init_f":{"global":"TableEmpty"}}`|
|100014|`{"limits":[3,9,16],"init_f":{"global":"TableEmpty"}}`|

## TargetRule

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|18|本表行键；与其他表同值不自动代表同一对象。|
|_param_info|null|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|range|string|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|team|string|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|init_func|object/array|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|select_func|string|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|filter_func|number/object/array|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|filter_range_func|object|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sort_func|object|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|args|number/string|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10001|`{"init_func":{"global":"TableEmpty"},"select_func":"select_main_list","filter_func":0,"filter_range_func":{"global":"TableEmpty"},"sort_func":{"global":"TableEmpty"}}`|
|10002|`{"init_func":["count"],"select_func":"select_main_list","filter_func":0,"filter_range_func":{"global":"TableEmpty"},"sort_func":{"global":"TableEmpty"}}`|
|10003|`{"init_func":["count"],"select_func":"select_team","filter_func":{"global":"TableEmpty"},"filter_range_func":{"global":"TableEmpty"},"sort_func":{"global":"TableEmpty"}}`|
|10004|`{"init_func":{"global":"TableEmpty"},"select_func":"select_team","filter_func":{"global":"TableEmpty"},"filter_range_func":{"global":"TableEmpty"},"sort_func":{"global":"TableEmpty"}}`|
|10005|`{"init_func":["count"],"select_func":"select_front_row","filter_func":{"global":"TableEmpty"},"filter_range_func":{"global":"TableEmpty"},"sort_func":{"global":"TableEmpty"}}`|
|10006|`{"init_func":["count"],"select_func":"select_highest_atk","filter_func":{"global":"TableEmpty"},"filter_range_func":{"global":"TableEmpty"},"sort_func":{"global":"TableEmpty"}}`|
|10007|`{"init_func":["count"],"select_func":"select_highest_atk","filter_func":["exclude_self"],"filter_range_func":{"global":"TableEmpty"},"sort_func":{"global":"TableEmpty"}}`|
|10008|`{"init_func":{"global":"TableEmpty"},"select_func":"select_ally_except_self","filter_func":{"global":"TableEmpty"},"filter_range_func":{"global":"TableEmpty"},"sort_func":{"global":"TableEmpty"}}`|
|10009|`{"init_func":["count"],"select_func":"select_except_main_target","filter_func":{"global":"TableEmpty"},"filter_range_func":{"global":"TableEmpty"},"sort_func":{"global":"TableEmpty"}}`|
|10010|`{"init_func":{"global":"TableEmpty"},"select_func":"select_buff_caster","filter_func":{"global":"TableEmpty"},"filter_range_func":{"global":"TableEmpty"},"sort_func":{"global":"TableEmpty"}}`|
|10011|`{"init_func":{"global":"TableEmpty"},"select_func":"select_buff_owner","filter_func":{"global":"TableEmpty"},"filter_range_func":{"global":"TableEmpty"},"sort_func":{"global":"TableEmpty"}}`|
|10012|`{"init_func":["count"],"select_func":"select_board_target","filter_func":{"global":"TableEmpty"},"filter_range_func":{"global":"TableEmpty"},"sort_func":{"global":"TableEmpty"}}`|
|10013|`{"init_func":{"global":"TableEmpty"},"select_func":"select_self","filter_func":{"global":"TableEmpty"},"filter_range_func":{"global":"TableEmpty"},"sort_func":{"global":"TableEmpty"}}`|
|10014|`{"init_func":["count"],"select_func":"select_lowest_hp","filter_func":{"global":"TableEmpty"},"filter_range_func":{"global":"TableEmpty"},"sort_func":{"global":"TableEmpty"}}`|
|10015|`{"init_func":{"global":"TableEmpty"},"select_func":"select_team","filter_func":{"global":"TableEmpty"},"filter_range_func":{"global":"TableEmpty"},"sort_func":{"global":"TableEmpty"}}`|
|10016|`{"init_func":["count"],"select_func":"select_highest_atk","filter_func":{"global":"TableEmpty"},"filter_range_func":{"global":"TableEmpty"},"sort_func":{"global":"TableEmpty"}}`|
|10017|`{"init_func":["count"],"select_func":"select_front_row","filter_func":{"global":"TableEmpty"},"filter_range_func":{"global":"TableEmpty"},"sort_func":{"global":"TableEmpty"}}`|
|10018|`{"init_func":{"global":"TableEmpty"},"select_func":"select_all_alive","filter_func":{"global":"TableEmpty"},"filter_range_func":{"global":"TableEmpty"},"sort_func":{"global":"TableEmpty"}}`|

## TMDFighterStatus

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|

## Speed

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|speed|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"speed":1}`|
|2|`{"speed":2}`|
|3|`{"speed":3}`|

## Scene

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|bg|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|board_bg|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|

## Type

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|max_round|number|6|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|settle_func|null|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|round_operate_times|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|round_add_max_op_num|number|6|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|role_type|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|need_countdown|boolean|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|can_auto|boolean|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_time|number|6|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|timeout_lose_type|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|round_before_ability|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|default_speed|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|round_before_ability_des|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|round_before_ability_icon|string|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"max_round":15,"settle_func":null,"round_operate_times":2,"round_add_max_op_num":2,"role_type":1,"need_countdown":false,"can_auto":false,"max_time":600,"timeout_lose_type":0,"round_before_ability":0,"default_speed":1,"round_before_ability_des":0,"round_before_ability_icon":""}`|
|2|`{"max_round":15,"settle_func":null,"round_operate_times":2,"round_add_max_op_num":2,"role_type":0,"need_countdown":true,"can_auto":false,"max_time":1200,"timeout_lose_type":0,"round_before_ability":111,"default_speed":1,"round_before_ability_des":812625,"round_before_ability_icon":"icon_buff_gjts.png"}`|
|3|`{"max_round":15,"round_operate_times":2,"round_add_max_op_num":2,"role_type":1,"need_countdown":false,"can_auto":false,"max_time":600,"timeout_lose_type":0,"round_before_ability":0,"default_speed":2,"round_before_ability_des":0,"round_before_ability_icon":""}`|
|4|`{"max_round":15,"round_operate_times":2,"round_add_max_op_num":2,"role_type":0,"need_countdown":true,"can_auto":true,"max_time":180,"timeout_lose_type":0,"round_before_ability":111,"default_speed":2,"round_before_ability_des":812625,"round_before_ability_icon":"icon_sx_pata_buff_pingheng.png"}`|
|5|`{"max_round":15,"round_operate_times":2,"round_add_max_op_num":2,"role_type":1,"need_countdown":true,"can_auto":true,"max_time":180,"timeout_lose_type":0,"round_before_ability":111,"default_speed":2,"round_before_ability_des":812625,"round_before_ability_icon":"icon_sx_pata_buff_pingheng.png"}`|
|6|`{"max_round":15,"round_operate_times":2,"round_add_max_op_num":2,"role_type":2,"need_countdown":true,"can_auto":true,"max_time":180,"timeout_lose_type":0,"round_before_ability":111,"default_speed":2,"round_before_ability_des":812625,"round_before_ability_icon":"icon_sx_pata_buff_pingheng.png"}`|

## TripleMatchFight

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|645|本表行键；与其他表同值不自动代表同一对象。|
|type|number|645|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|board|number|645|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lineup|number|645|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|def_team|number|645|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_scene|number|645|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部645行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"type":1,"fight_scene":1}`|
|2|`{"type":1,"fight_scene":1}`|
|3|`{"type":2,"fight_scene":1}`|

## Team

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|642|本表行键；与其他表同值不自动代表同一对象。|
|npc|array|642|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|array|642|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr|array|642|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_power|number|642|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部642行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"npc":[1,2,3,13],"loc":[1,2,3,4],"attr":[1,1,1,1],"show_power":100}`|
|2|`{"npc":[4,5,6,13],"loc":[1,2,3,4],"attr":[1,1,1,1],"show_power":101}`|
|3|`{"npc":[7,8,9,13],"loc":[1,2,3,4],"attr":[1,1,1,1],"show_power":102}`|

## Prompt

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|13|本表行键；与其他表同值不自动代表同一对象。|
|duration|number|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sign|number|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|status_txt_icon|string|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|status_txt_property|number|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|status_txt_str|number|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"duration":1250}`|
|102|`{"duration":1250}`|
|103|`{"duration":1250}`|
|104|`{"duration":1250}`|
|105|`{"duration":2000}`|
|106|`{"duration":2000}`|
|107|`{"duration":2000}`|
|108|`{"duration":2000}`|
|109|`{"duration":2000}`|
|110|`{"duration":2000}`|
|111|`{"duration":2000}`|
|112|`{"duration":2000}`|
|113|`{"duration":2000}`|

## TileSubType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|idea_effect|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_effect|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|

## TileLib

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|icon_bg|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|

## TileType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|icon|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|icon_cry|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|icon_cry_gray|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|small_icon|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc_bg|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|anger_border_bg|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|anger_border|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|anger_text_color|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|anger_full_effect|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sente_loc|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|gote_loc|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skill_prefab|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hit_prefab|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"loc_bg":"dk_sx_pata_hongse.png","anger_border_bg":"icon_sx_pata_hongse_kong.png","anger_border":"icon_sx_pata_hongse_man.png","anger_text_color":6005,"anger_full_effect":"Effect_ndmHeroInfoNode_glow_red.prefab","sente_loc":1,"gote_loc":4,"skill_prefab":"character2d_board_skill_1.prefab"}`|
|2|`{"loc_bg":"dk_sx_pata_huangse.png","anger_border_bg":"icon_sx_pata_huangse_kong.png","anger_border":"icon_sx_pata_huangse_man.png","anger_text_color":6067,"anger_full_effect":"Effect_ndmHeroInfoNode_glow_yellow.prefab","sente_loc":2,"gote_loc":3,"skill_prefab":"character2d_board_skill_2.prefab"}`|
|3|`{"loc_bg":"dk_sx_pata_lanse.png","anger_border_bg":"icon_sx_pata_lanse_kong.png","anger_border":"icon_sx_pata_lanse_man.png","anger_text_color":5086,"anger_full_effect":"Effect_ndmHeroInfoNode_glow_blue.prefab","sente_loc":3,"gote_loc":2,"skill_prefab":"character2d_board_skill_3.prefab"}`|
|4|`{"loc_bg":"dk_sx_pata_lvse.png","anger_border_bg":"icon_sx_pata_lvse_kong.png","anger_border":"icon_sx_pata_lvse_man.png","anger_text_color":7001,"anger_full_effect":"Effect_ndmHeroInfoNode_glow_green.prefab","sente_loc":4,"gote_loc":1,"skill_prefab":"character2d_board_skill_4.prefab"}`|

## Tile

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|16|本表行键；与其他表同值不自动代表同一对象。|
|lib|number|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sub_type|number|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|weight|number|16|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"lib":1,"type":1,"sub_type":1,"weight":25}`|
|2|`{"lib":1,"type":2,"sub_type":1,"weight":25}`|
|3|`{"lib":1,"type":3,"sub_type":1,"weight":25}`|
|4|`{"lib":1,"type":4,"sub_type":1,"weight":25}`|
|11|`{"lib":1,"type":1,"sub_type":2,"weight":0}`|
|12|`{"lib":1,"type":2,"sub_type":2,"weight":0}`|
|13|`{"lib":1,"type":3,"sub_type":2,"weight":0}`|
|14|`{"lib":1,"type":4,"sub_type":2,"weight":0}`|
|21|`{"lib":1,"type":1,"sub_type":3,"weight":0}`|
|22|`{"lib":1,"type":2,"sub_type":3,"weight":0}`|
|23|`{"lib":1,"type":3,"sub_type":3,"weight":0}`|
|24|`{"lib":1,"type":4,"sub_type":3,"weight":0}`|
|31|`{"lib":1,"type":1,"sub_type":4,"weight":0}`|
|32|`{"lib":1,"type":2,"sub_type":4,"weight":0}`|
|33|`{"lib":1,"type":3,"sub_type":4,"weight":0}`|
|34|`{"lib":1,"type":4,"sub_type":4,"weight":0}`|

## Board

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|x_tile|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|y_tile|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tile_lib|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|grid_size|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_special|boolean|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|three_add_angle|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|four_add_angle|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|five_add_angle|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"tile_lib":1,"is_special":false}`|
