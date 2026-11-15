# MiniGameTable 规则参数

来源：[personal-server/assets/tables/MiniGameTable.data.json.gz](../../../../personal-server/assets/tables/MiniGameTable.data.json.gz)，SHA256：`c9d812e1aab7a137d8ce4eb7eb60c3898957ce3b7d8850083350c689d65c2def`。

[完整逐行JSON](MiniGameTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[HuntGameAward](#huntgameaward)|19|decoded-rows|
|[HuntGameVersion](#huntgameversion)|2|decoded-rows|
|[EncounterHero](#encounterhero)|52|decoded-rows|
|[GameMonster](#gamemonster)|2|rows-with-external-references|
|[GameMonsterAward](#gamemonsteraward)|6|decoded-rows|
|[GameMonsterSpeed](#gamemonsterspeed)|10|decoded-rows|
|[GameMonsterDisplay](#gamemonsterdisplay)|2|decoded-rows|
|[PinBallSlimeGroup](#pinballslimegroup)|2|decoded-rows|
|[PinBallSlime](#pinballslime)|12|decoded-rows|
|[PinBallSlimeConst](#pinballslimeconst)|1|decoded-rows|
|[PinBallSlimeType](#pinballslimetype)|2|decoded-rows|
|[FightPower](#fightpower)|7|decoded-rows|
|[AnswerQuestionBank](#answerquestionbank)|20|decoded-rows|
|[HeavenAward](#heavenaward)|4|decoded-rows|
|[DollMachineAward](#dollmachineaward)|9|decoded-rows|
|[MiniGame](#minigame)|15|rows-with-external-references|
|[SlotMachine](#slotmachine)|1|decoded-rows|
|[OptionBank](#optionbank)|3|decoded-rows|
|[GameGopherAwardConst](#gamegopherawardconst)|3|decoded-rows|
|[GameGopherAwardNode](#gamegopherawardnode)|9|decoded-rows|
|[GameGopherAward](#gamegopheraward)|3|decoded-rows|
|[PipeConnectMaps](#pipeconnectmaps)|5|decoded-rows|
|[PipeConnectBlock](#pipeconnectblock)|6|decoded-rows|
|[PipeConnectConst](#pipeconnectconst)|1|decoded-rows|
|[MarblesConst](#marblesconst)|1|decoded-rows|
|[Marbles](#marbles)|162|decoded-rows|

## HuntGameAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|19|本表行键；与其他表同值不自动代表同一对象。|
|award_n|number|19|奖励数量数组；零与缺字段分别保留。|
|award|number|19|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{"award_n":100,"award":101500}`|
|1002|`{"award_n":100,"award":101500}`|
|1003|`{"award_n":100,"award":101500}`|
|1004|`{"award_n":100,"award":101500}`|
|1005|`{"award_n":100,"award":101500}`|
|1006|`{"award_n":100,"award":101500}`|
|1007|`{"award_n":100,"award":101500}`|
|1008|`{"award_n":100,"award":101500}`|
|1009|`{"award_n":100,"award":101500}`|
|1010|`{"award_n":100,"award":101500}`|
|2001|`{"award_n":100,"award":101500}`|
|2002|`{"award_n":100,"award":101500}`|
|2003|`{"award_n":100,"award":101500}`|
|2004|`{"award_n":100,"award":101500}`|
|2005|`{"award_n":100,"award":101500}`|
|2006|`{"award_n":100,"award":101500}`|
|2007|`{"award_n":100,"award":101500}`|
|2008|`{"award_n":100,"award":101500}`|
|2009|`{"award_n":100,"award":101500}`|

## HuntGameVersion

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|

## EncounterHero

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|52|本表行键；与其他表同值不自动代表同一对象。|
|hero|number|52|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"hero":1030101}`|
|2|`{"hero":1030201}`|
|3|`{"hero":1030301}`|
|4|`{"hero":1030401}`|
|5|`{"hero":1030501}`|
|6|`{"hero":2030101}`|
|7|`{"hero":2030201}`|
|8|`{"hero":2030301}`|
|9|`{"hero":2030401}`|
|10|`{"hero":2030501}`|
|11|`{"hero":3030201}`|
|12|`{"hero":3030301}`|
|13|`{"hero":3030401}`|
|14|`{"hero":3030501}`|
|15|`{"hero":3030601}`|
|16|`{"hero":4030101}`|
|17|`{"hero":4030201}`|
|18|`{"hero":4030301}`|
|19|`{"hero":4030401}`|
|20|`{"hero":4030501}`|
|21|`{"hero":1020101}`|
|22|`{"hero":1020201}`|
|23|`{"hero":1020301}`|
|24|`{"hero":1020401}`|
|25|`{"hero":1020501}`|
|26|`{"hero":2020101}`|
|27|`{"hero":2020201}`|
|28|`{"hero":2020301}`|
|29|`{"hero":2020401}`|
|30|`{"hero":2020501}`|
|31|`{"hero":3020101}`|
|32|`{"hero":3020201}`|
|33|`{"hero":3020301}`|
|34|`{"hero":3020401}`|
|35|`{"hero":3020501}`|
|36|`{"hero":4020101}`|
|37|`{"hero":4020201}`|
|38|`{"hero":4020301}`|
|39|`{"hero":4020401}`|
|40|`{"hero":4020501}`|
|41|`{"hero":2020601}`|
|42|`{"hero":1020601}`|
|43|`{"hero":1010101}`|
|44|`{"hero":1010201}`|
|45|`{"hero":2010101}`|
|46|`{"hero":2010201}`|
|47|`{"hero":3010101}`|
|48|`{"hero":3010201}`|
|49|`{"hero":3010301}`|
|50|`{"hero":4010101}`|
|51|`{"hero":4010201}`|
|52|`{"hero":4010301}`|

## GameMonster

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|open_func|object|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_max_score|number|2|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|close_func|object|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|round_duration|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|auto_score_range|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|score_coefficient|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|normal_score|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|crit_score|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"open_func":{"reference":"GameMonsterMainForm.StaticOpen"},"award_max_score":999999,"close_func":{"reference":"GameMonsterMainForm.StaticClose"},"round_duration":30,"auto_score_range":[21,30],"score_coefficient":100,"normal_score":100,"crit_score":200}`|
|2|`{"open_func":{"reference":"GameMonster2MainForm.StaticOpen"},"award_max_score":999999,"close_func":{"reference":"GameMonster2MainForm.StaticClose"},"round_duration":30,"auto_score_range":[21,30],"score_coefficient":100,"normal_score":100,"crit_score":200}`|

## GameMonsterAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|score|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|belong_version|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_count|number|6|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|award_item|number|6|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"score":0,"belong_version":1,"award_count":30,"award_item":721002}`|
|102|`{"score":2000,"belong_version":1,"award_count":50,"award_item":721002}`|
|103|`{"score":4000,"belong_version":1,"award_count":100,"award_item":721002}`|
|201|`{"score":0,"belong_version":2,"award_count":30,"award_item":721002}`|
|202|`{"score":2000,"belong_version":2,"award_count":50,"award_item":721002}`|
|203|`{"score":4000,"belong_version":2,"award_count":100,"award_item":721002}`|

## GameMonsterSpeed

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|10|本表行键；与其他表同值不自动代表同一对象。|
|belong_version|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|speed_max_time|number|10|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|speed_coff|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"belong_version":1,"speed_max_time":5,"speed_coff":0.5}`|
|2|`{"belong_version":1,"speed_max_time":10,"speed_coff":1.25}`|
|3|`{"belong_version":1,"speed_max_time":15,"speed_coff":1.5}`|
|4|`{"belong_version":1,"speed_max_time":20,"speed_coff":1.75}`|
|5|`{"belong_version":1,"speed_max_time":1000000000,"speed_coff":2}`|
|6|`{"belong_version":2,"speed_max_time":5,"speed_coff":0.5}`|
|7|`{"belong_version":2,"speed_max_time":10,"speed_coff":1.25}`|
|8|`{"belong_version":2,"speed_max_time":15,"speed_coff":1.5}`|
|9|`{"belong_version":2,"speed_max_time":20,"speed_coff":1.75}`|
|10|`{"belong_version":2,"speed_max_time":1000000000,"speed_coff":2}`|

## GameMonsterDisplay

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|crit_hit_angle|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|belong_version|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fire_move_speed|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hit_area_asset|string|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|fire_angle|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hit_angle|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fire_move_angle|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|crit_hit_area_asset|string|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hit_area_angle|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"belong_version":1,"fire_move_speed":80}`|
|2|`{"belong_version":2,"fire_move_speed":80}`|

## PinBallSlimeGroup

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|award_num|number|2|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award_num":1}`|
|2|`{"award_num":8}`|

## PinBallSlime

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|blood|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|count|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|item|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|slime_type|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|12|本表行键；与其他表同值不自动代表同一对象。|
|scale|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|belong_group|number|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"count":120,"item":101500,"slime_type":2,"belong_group":1}`|
|102|`{"count":130,"item":101500,"slime_type":2,"belong_group":1}`|
|103|`{"count":140,"item":101500,"slime_type":2,"belong_group":1}`|
|104|`{"count":150,"item":101500,"slime_type":2,"belong_group":1}`|
|201|`{"count":12,"item":101500,"slime_type":2,"belong_group":2}`|
|202|`{"count":14,"item":101500,"slime_type":2,"belong_group":2}`|
|203|`{"count":16,"item":101500,"slime_type":2,"belong_group":2}`|
|204|`{"count":18,"item":101500,"slime_type":2,"belong_group":2}`|
|205|`{"count":20,"item":101500,"slime_type":2,"belong_group":2}`|
|206|`{"count":22,"item":101500,"slime_type":2,"belong_group":2}`|
|207|`{"count":24,"item":101500,"slime_type":2,"belong_group":2}`|
|208|`{"count":26,"item":101500,"slime_type":2,"belong_group":2}`|

## PinBallSlimeConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|continue_item|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|location_num|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|every_launch|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bullet_num|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|collision_offset|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|launches|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|interval|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|continue_count|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|buy_bullet_num|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ball_force|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ball_hp|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"continue_item":201500,"location_num":13,"bullet_num":100,"interval":20,"continue_count":[10000,20000,30000,30000,30000,40000,40000,40000,50000,50000],"buy_bullet_num":10,"ball_hp":10}`|

## PinBallSlimeType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|prefab|string|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|appearance_list|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|2|`{}`|
|3|`{}`|

## FightPower

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|7|本表行键；与其他表同值不自动代表同一对象。|
|power|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"power":500}`|
|2|`{"power":100000}`|
|3|`{"power":248000}`|
|4|`{"power":376000}`|
|5|`{"power":480000}`|
|6|`{"power":552000}`|
|7|`{"power":656000}`|

## AnswerQuestionBank

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|20|本表行键；与其他表同值不自动代表同一对象。|
|key|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|question|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|style|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|answer|array|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|title|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pos|undefined|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

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

## HeavenAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|interval_time|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bomb_probability|number|4|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|
|gravity_scale|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|move_speed|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|drop_range|array|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|game_time|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|item|array|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|probability|array|4|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|
|pause_time|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skip_award|array|4|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|skip_item|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"interval_time":300,"bomb_probability":10,"move_speed":600,"game_time":30,"item":[201500],"probability":[100],"pause_time":3000,"skip_award":[1,90],"skip_item":201500}`|
|2|`{"interval_time":300,"bomb_probability":10,"move_speed":600,"game_time":30,"item":[201500,201500],"probability":[99,1],"pause_time":3000,"skip_award":[1,90],"skip_item":201500}`|
|3|`{"interval_time":300,"bomb_probability":10,"move_speed":600,"game_time":30,"item":[101500],"probability":[100],"pause_time":3000,"skip_award":[100,120],"skip_item":101500}`|
|4|`{"interval_time":300,"bomb_probability":10,"move_speed":600,"game_time":30,"item":[4101900],"probability":[100],"pause_time":3000,"skip_award":[100,120],"skip_item":4101900}`|

## DollMachineAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|9|本表行键；与其他表同值不自动代表同一对象。|
|award_pack|number|9|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award_pack":801}`|
|2|`{"award_pack":801}`|
|3|`{"award_pack":801}`|
|4|`{"award_pack":801}`|
|5|`{"award_pack":801}`|
|6|`{"award_pack":801}`|
|7|`{"award_pack":801}`|
|8|`{"award_pack":801}`|
|9|`{"award_pack":801}`|

## MiniGame

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|param|number|15|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_send_enter_msg|boolean|15|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|guide|number|15|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|condition_check|undefined|15|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|15|本表行键；与其他表同值不自动代表同一对象。|
|condition_red|number|15|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|func_param|number|15|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|settle_bin|string|15|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_login_sync|boolean|15|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img|string|15|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lua_module|undefined/object|15|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|over_callback|undefined|15|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|condition_tips|number|15|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|4|`{"is_send_enter_msg":false,"condition_red":0,"func_param":1,"is_login_sync":false,"condition_tips":0}`|
|30|`{"is_send_enter_msg":true,"condition_red":0,"func_param":0,"is_login_sync":false,"condition_tips":0}`|
|40|`{"is_send_enter_msg":true,"condition_red":0,"func_param":0,"is_login_sync":false,"condition_tips":0}`|
|50|`{"is_send_enter_msg":false,"condition_red":10083,"func_param":0,"is_login_sync":true,"condition_tips":0}`|
|51|`{"is_send_enter_msg":false,"condition_red":0,"func_param":0,"is_login_sync":false,"condition_tips":0}`|
|52|`{"is_send_enter_msg":false,"condition_red":0,"func_param":0,"is_login_sync":false,"condition_tips":0}`|
|53|`{"is_send_enter_msg":false,"condition_red":0,"func_param":0,"is_login_sync":false,"condition_tips":0}`|
|54|`{"is_send_enter_msg":false,"condition_red":0,"func_param":0,"is_login_sync":false,"condition_tips":0}`|
|55|`{"is_send_enter_msg":false,"condition_red":0,"func_param":1,"is_login_sync":false,"condition_tips":0}`|
|56|`{"is_send_enter_msg":false,"condition_red":0,"func_param":2,"is_login_sync":false,"condition_tips":0}`|
|57|`{"is_send_enter_msg":false,"condition_red":0,"func_param":0,"is_login_sync":false,"condition_tips":0}`|
|58|`{"is_send_enter_msg":false,"condition_red":0,"func_param":0,"is_login_sync":false,"condition_tips":0}`|
|59|`{"is_send_enter_msg":false,"condition_red":0,"func_param":0,"is_login_sync":false,"condition_tips":0}`|
|60|`{"is_send_enter_msg":false,"condition_red":0,"func_param":0,"is_login_sync":false,"condition_tips":0}`|
|61|`{"is_send_enter_msg":false,"condition_red":0,"func_param":0,"is_login_sync":false,"condition_tips":0}`|

## SlotMachine

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|retry_n|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|item|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|count|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rate|array|1|原倍率/概率字段值；具体分母由该表消费者决定。|
|weight|array|1|原权重值；归一化分母、条件筛选与保底需结合抽取消费者，不能直接加百分号。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"item":[201500,201500,101500,901900],"count":[1,1,30,10],"rate":[1,3,5],"weight":[100,100,100,100]}`|

## OptionBank

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|option_sub_count|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|question|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|option_sub_item|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|option_free|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|title|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pos|undefined|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|option_sub_desc|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|style|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"option_sub_count":1000,"option_sub_item":201500,"option_free":790121}`|
|2|`{"option_sub_count":1000,"option_sub_item":201500,"option_free":790124}`|
|3|`{"option_sub_count":1000,"option_sub_item":201500,"option_free":790127}`|

## GameGopherAwardConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|interval|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|help|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tip1|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_progress|boolean|3|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|title|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|game_list|array|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|game|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skip_score|array|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|game_time|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tip2|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|default_list|array|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|progress_award_list|array|3|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"interval":600,"award_progress":true,"skip_score":[4000,5500],"game_time":30000,"progress_award_list":[1,2,3]}`|
|2|`{"interval":600,"award_progress":true,"skip_score":[4000,5500],"game_time":30000,"progress_award_list":[1,2,3]}`|
|3|`{"interval":600,"award_progress":false,"skip_score":[4000,5500],"game_time":30000,"progress_award_list":[]}`|

## GameGopherAwardNode

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|score|number|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|9|本表行键；与其他表同值不自动代表同一对象。|
|prob|number|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pic|string|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hide_time|number|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"score":200,"prob":1000}`|
|2|`{"score":300,"prob":300}`|
|3|`{"score":-100,"prob":200}`|
|4|`{"score":200,"prob":1000}`|
|5|`{"score":300,"prob":300}`|
|6|`{"score":-100,"prob":200}`|
|7|`{"score":200,"prob":1000}`|
|8|`{"score":300,"prob":300}`|
|9|`{"score":-100,"prob":200}`|

## GameGopherAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|score|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|award|array|3|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"score":0,"award":[[721002,30]]}`|
|2|`{"score":3000,"award":[[721002,50]]}`|
|3|`{"score":6000,"award":[[721002,100]]}`|

## PipeConnectMaps

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|rewards|array|5|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|map_cfg_name|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|block|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|version|number|5|版本引用；必须按活动类型及其消费者查对应版本表。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"rewards":[[150002,5],[101500,200],[141002,15],[147002,2]],"block":4,"version":1}`|
|2|`{"rewards":[[150002,5],[101500,200],[141002,15],[147002,2]],"block":4,"version":1}`|
|3|`{"rewards":[[150002,5],[101500,200],[141002,15],[147002,2]],"block":4,"version":1}`|
|4|`{"rewards":[[150002,5],[101500,200],[141002,15],[147002,2]],"block":2,"version":1}`|
|5|`{"rewards":[[150002,5],[101500,200],[141002,15],[147002,2]],"block":4,"version":1}`|

## PipeConnectBlock

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|group|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|probability|number|6|权重/概率相关原字段；抽样空间及分母尚需该家族消费者证明。|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|block|array|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"group":1,"probability":5000,"block":[[-1,1],[0,0],[0,1]]}`|
|2|`{"group":1,"probability":5000,"block":[[-1,1],[-1,0],[0,1],[0,0]]}`|
|3|`{"group":2,"probability":5000,"block":[[0,1],[0,0]]}`|
|4|`{"group":2,"probability":4000,"block":[[0,2],[0,1],[0,0]]}`|
|5|`{"group":3,"probability":1000,"block":[[0,3],[0,2],[0,1],[0,0]]}`|
|6|`{"group":99,"probability":0,"block":[[0,0]]}`|

## PipeConnectConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|img_name|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|continuous_drop_count|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"continuous_drop_count":3}`|

## MarblesConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|award_threshold|number|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|cost|number|1|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|award|array|1|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|max_run_time|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"award_threshold":12,"cost":150002,"award":[1120119,1120219,1120319,1120419],"max_run_time":12}`|

## Marbles

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|162|本表行键；与其他表同值不自动代表同一对象。|
|version|number|162|版本引用；必须按活动类型及其消费者查对应版本表。|
|day_award|array|162|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"version":1,"day_award":[[3601900,200]]}`|
|102|`{"version":1,"day_award":[[3601900,400]]}`|
|103|`{"version":1,"day_award":[[101500,100]]}`|
|104|`{"version":1,"day_award":[[771200,2]]}`|
|105|`{"version":1,"day_award":[[771200,5]]}`|
|106|`{"version":1,"day_award":[[751200,1]]}`|
|201|`{"version":2,"day_award":[[3601900,200]]}`|
|202|`{"version":2,"day_award":[[3601900,400]]}`|
|203|`{"version":2,"day_award":[[101500,100]]}`|
|204|`{"version":2,"day_award":[[771200,2]]}`|
|205|`{"version":2,"day_award":[[771200,5]]}`|
|206|`{"version":2,"day_award":[[751200,1]]}`|
|301|`{"version":3,"day_award":[[3601900,200]]}`|
|302|`{"version":3,"day_award":[[3601900,400]]}`|
|303|`{"version":3,"day_award":[[101500,100]]}`|
|304|`{"version":3,"day_award":[[771200,2]]}`|
|305|`{"version":3,"day_award":[[771200,5]]}`|
|306|`{"version":3,"day_award":[[751200,1]]}`|
|401|`{"version":4,"day_award":[[3601900,200]]}`|
|402|`{"version":4,"day_award":[[3601900,400]]}`|
|403|`{"version":4,"day_award":[[101500,100]]}`|
|404|`{"version":4,"day_award":[[771200,2]]}`|
|405|`{"version":4,"day_award":[[771200,5]]}`|
|406|`{"version":4,"day_award":[[751200,1]]}`|
|501|`{"version":5,"day_award":[[3601900,200]]}`|
|502|`{"version":5,"day_award":[[3601900,400]]}`|
|503|`{"version":5,"day_award":[[101500,100]]}`|
|504|`{"version":5,"day_award":[[771200,2]]}`|
|505|`{"version":5,"day_award":[[771200,5]]}`|
|506|`{"version":5,"day_award":[[751200,1]]}`|
|601|`{"version":6,"day_award":[[3601900,200]]}`|
|602|`{"version":6,"day_award":[[3601900,400]]}`|
|603|`{"version":6,"day_award":[[101500,100]]}`|
|604|`{"version":6,"day_award":[[771200,2]]}`|
|605|`{"version":6,"day_award":[[771200,5]]}`|
|606|`{"version":6,"day_award":[[751200,1]]}`|
|701|`{"version":7,"day_award":[[3601900,200]]}`|
|702|`{"version":7,"day_award":[[3601900,400]]}`|
|703|`{"version":7,"day_award":[[101500,100]]}`|
|704|`{"version":7,"day_award":[[771200,2]]}`|
|705|`{"version":7,"day_award":[[771200,5]]}`|
|706|`{"version":7,"day_award":[[751200,1]]}`|
|801|`{"version":8,"day_award":[[3601900,200]]}`|
|802|`{"version":8,"day_award":[[3601900,400]]}`|
|803|`{"version":8,"day_award":[[101500,100]]}`|
|804|`{"version":8,"day_award":[[771200,2]]}`|
|805|`{"version":8,"day_award":[[771200,5]]}`|
|806|`{"version":8,"day_award":[[751200,1]]}`|
|901|`{"version":9,"day_award":[[3601900,200]]}`|
|902|`{"version":9,"day_award":[[3601900,400]]}`|
|903|`{"version":9,"day_award":[[101500,100]]}`|
|904|`{"version":9,"day_award":[[771200,2]]}`|
|905|`{"version":9,"day_award":[[771200,5]]}`|
|906|`{"version":9,"day_award":[[751200,1]]}`|
|1001|`{"version":10,"day_award":[[3601900,200]]}`|
|1002|`{"version":10,"day_award":[[3601900,400]]}`|
|1003|`{"version":10,"day_award":[[101500,100]]}`|
|1004|`{"version":10,"day_award":[[771200,2]]}`|
|1005|`{"version":10,"day_award":[[771200,5]]}`|
|1006|`{"version":10,"day_award":[[751200,1]]}`|
|1101|`{"version":11,"day_award":[[3601900,200]]}`|
|1102|`{"version":11,"day_award":[[3601900,400]]}`|
|1103|`{"version":11,"day_award":[[101500,100]]}`|
|1104|`{"version":11,"day_award":[[771200,2]]}`|
|1105|`{"version":11,"day_award":[[771200,5]]}`|
|1106|`{"version":11,"day_award":[[751200,1]]}`|
|1201|`{"version":12,"day_award":[[3601900,200]]}`|
|1202|`{"version":12,"day_award":[[3601900,400]]}`|
|1203|`{"version":12,"day_award":[[101500,100]]}`|
|1204|`{"version":12,"day_award":[[771200,2]]}`|
|1205|`{"version":12,"day_award":[[771200,5]]}`|
|1206|`{"version":12,"day_award":[[751200,1]]}`|
|1301|`{"version":13,"day_award":[[3601900,200]]}`|
|1302|`{"version":13,"day_award":[[3601900,400]]}`|
|1303|`{"version":13,"day_award":[[101500,100]]}`|
|1304|`{"version":13,"day_award":[[771200,2]]}`|
|1305|`{"version":13,"day_award":[[771200,5]]}`|
|1306|`{"version":13,"day_award":[[751200,1]]}`|
|1401|`{"version":14,"day_award":[[3601900,200]]}`|
|1402|`{"version":14,"day_award":[[3601900,400]]}`|
|1403|`{"version":14,"day_award":[[101500,100]]}`|
|1404|`{"version":14,"day_award":[[771200,2]]}`|
|1405|`{"version":14,"day_award":[[771200,5]]}`|
|1406|`{"version":14,"day_award":[[751200,1]]}`|
|1501|`{"version":15,"day_award":[[3601900,200]]}`|
|1502|`{"version":15,"day_award":[[3601900,400]]}`|
|1503|`{"version":15,"day_award":[[101500,100]]}`|
|1504|`{"version":15,"day_award":[[771200,2]]}`|
|1505|`{"version":15,"day_award":[[771200,5]]}`|
|1506|`{"version":15,"day_award":[[751200,1]]}`|
|1601|`{"version":16,"day_award":[[3601900,200]]}`|
|1602|`{"version":16,"day_award":[[3601900,400]]}`|
|1603|`{"version":16,"day_award":[[101500,100]]}`|
|1604|`{"version":16,"day_award":[[771200,2]]}`|
|1605|`{"version":16,"day_award":[[771200,5]]}`|
|1606|`{"version":16,"day_award":[[751200,1]]}`|
|1701|`{"version":17,"day_award":[[3601900,200]]}`|
|1702|`{"version":17,"day_award":[[3601900,400]]}`|
|1703|`{"version":17,"day_award":[[101500,100]]}`|
|1704|`{"version":17,"day_award":[[771200,2]]}`|
|1705|`{"version":17,"day_award":[[771200,5]]}`|
|1706|`{"version":17,"day_award":[[751200,1]]}`|
|1801|`{"version":18,"day_award":[[3601900,200]]}`|
|1802|`{"version":18,"day_award":[[3601900,400]]}`|
|1803|`{"version":18,"day_award":[[101500,100]]}`|
|1804|`{"version":18,"day_award":[[771200,2]]}`|
|1805|`{"version":18,"day_award":[[771200,5]]}`|
|1806|`{"version":18,"day_award":[[751200,1]]}`|
|1901|`{"version":19,"day_award":[[3601900,200]]}`|
|1902|`{"version":19,"day_award":[[3601900,400]]}`|
|1903|`{"version":19,"day_award":[[101500,100]]}`|
|1904|`{"version":19,"day_award":[[771200,2]]}`|
|1905|`{"version":19,"day_award":[[771200,5]]}`|
|1906|`{"version":19,"day_award":[[751200,1]]}`|
|2001|`{"version":20,"day_award":[[3601900,200]]}`|
|2002|`{"version":20,"day_award":[[3601900,400]]}`|
|2003|`{"version":20,"day_award":[[101500,100]]}`|
|2004|`{"version":20,"day_award":[[771200,2]]}`|
|2005|`{"version":20,"day_award":[[771200,5]]}`|
|2006|`{"version":20,"day_award":[[751200,1]]}`|
|2101|`{"version":21,"day_award":[[3601900,200]]}`|
|2102|`{"version":21,"day_award":[[3601900,400]]}`|
|2103|`{"version":21,"day_award":[[101500,100]]}`|
|2104|`{"version":21,"day_award":[[771200,2]]}`|
|2105|`{"version":21,"day_award":[[771200,5]]}`|
|2106|`{"version":21,"day_award":[[751200,1]]}`|
|2201|`{"version":22,"day_award":[[3601900,200]]}`|
|2202|`{"version":22,"day_award":[[3601900,400]]}`|
|2203|`{"version":22,"day_award":[[101500,100]]}`|
|2204|`{"version":22,"day_award":[[771200,2]]}`|
|2205|`{"version":22,"day_award":[[771200,5]]}`|
|2206|`{"version":22,"day_award":[[751200,1]]}`|
|2301|`{"version":23,"day_award":[[3601900,200]]}`|
|2302|`{"version":23,"day_award":[[3601900,400]]}`|
|2303|`{"version":23,"day_award":[[101500,100]]}`|
|2304|`{"version":23,"day_award":[[771200,2]]}`|
|2305|`{"version":23,"day_award":[[771200,5]]}`|
|2306|`{"version":23,"day_award":[[751200,1]]}`|
|2401|`{"version":24,"day_award":[[3601900,200]]}`|
|2402|`{"version":24,"day_award":[[3601900,400]]}`|
|2403|`{"version":24,"day_award":[[101500,100]]}`|
|2404|`{"version":24,"day_award":[[771200,2]]}`|
|2405|`{"version":24,"day_award":[[771200,5]]}`|
|2406|`{"version":24,"day_award":[[751200,1]]}`|
|2501|`{"version":25,"day_award":[[3601900,200]]}`|
|2502|`{"version":25,"day_award":[[3601900,400]]}`|
|2503|`{"version":25,"day_award":[[101500,100]]}`|
|2504|`{"version":25,"day_award":[[771200,2]]}`|
|2505|`{"version":25,"day_award":[[771200,5]]}`|
|2506|`{"version":25,"day_award":[[751200,1]]}`|
|2601|`{"version":26,"day_award":[[3601900,200]]}`|
|2602|`{"version":26,"day_award":[[3601900,400]]}`|
|2603|`{"version":26,"day_award":[[101500,100]]}`|
|2604|`{"version":26,"day_award":[[771200,2]]}`|
|2605|`{"version":26,"day_award":[[771200,5]]}`|
|2606|`{"version":26,"day_award":[[751200,1]]}`|
|2801|`{"version":28,"day_award":[[3601900,200]]}`|
|2802|`{"version":28,"day_award":[[3601900,400]]}`|
|2803|`{"version":28,"day_award":[[101500,100]]}`|
|2804|`{"version":28,"day_award":[[771200,2]]}`|
|2805|`{"version":28,"day_award":[[771200,5]]}`|
|2806|`{"version":28,"day_award":[[751200,1]]}`|
