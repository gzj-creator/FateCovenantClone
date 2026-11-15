# GeneralDungeonTable 规则参数

来源：[personal-server/assets/tables/GeneralDungeonTable.data.lua.json.gz](../../../../personal-server/assets/tables/GeneralDungeonTable.data.lua.json.gz)，SHA256：`b7c40fdb752eb561a4de0474e3a22497f3d350315c30d20e054b7dd5086595f0`。

[完整逐行JSON](GeneralDungeonTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[EventBuff](#eventbuff)|10|decoded-rows|
|[BuffQuality](#buffquality)|3|decoded-rows|
|[BuffPosition](#buffposition)|4|decoded-rows|
|[Buff](#buff)|24|decoded-rows|
|[EventClose](#eventclose)|0|decoded-rows|
|[EventType](#eventtype)|18|decoded-rows|
|[EventTaskActive](#eventtaskactive)|0|decoded-rows|
|[EventPropUse](#eventpropuse)|2|decoded-rows|
|[EventAnimate](#eventanimate)|1|decoded-rows|
|[EventBox](#eventbox)|75|decoded-rows|
|[EventTalk](#eventtalk)|81|decoded-rows|
|[EventFight](#eventfight)|63|decoded-rows|
|[EventFightAward](#eventfightaward)|0|decoded-rows|
|[EventDraw](#eventdraw)|8|decoded-rows|
|[EventTips](#eventtips)|3|decoded-rows|
|[EventChangeMap](#eventchangemap)|1|decoded-rows|
|[EventModelAuto](#eventmodelauto)|19|decoded-rows|
|[EventCure](#eventcure)|1|decoded-rows|
|[EventPropAdd](#eventpropadd)|8|decoded-rows|
|[EventEffect](#eventeffect)|7|decoded-rows|
|[EventMoveCam](#eventmovecam)|27|decoded-rows|
|[DungeonEventHero](#dungeoneventhero)|13|decoded-rows|
|[DungeonEventHeroPool](#dungeoneventheropool)|7|decoded-rows|
|[EventFollower](#eventfollower)|10|decoded-rows|
|[EventLock](#eventlock)|3|decoded-rows|
|[EventFogHide](#eventfoghide)|3|decoded-rows|
|[PuzzleEventBoxAward](#puzzleeventboxaward)|150|decoded-rows|
|[PuzzleConst](#puzzleconst)|2|decoded-rows|
|[Event](#event)|243|decoded-rows|
|[EventCondition](#eventcondition)|2|decoded-rows|
|[EventRecord](#eventrecord)|8|decoded-rows|
|[PuzzleLevel](#puzzlelevel)|5|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[DungeonStyle](#dungeonstyle)|34|decoded-rows|
|[EventFailFun](#eventfailfun)|4|decoded-rows|
|[Level](#level)|10|decoded-rows|
|[DungeonType](#dungeontype)|1|decoded-rows|
|[Prop](#prop)|5|decoded-rows|

## EventBuff

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|10|本表行键；与其他表同值不自动代表同一对象。|
|style|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101006|`{}`|
|201006|`{}`|
|301006|`{}`|
|401006|`{}`|
|501006|`{}`|
|601006|`{}`|
|701006|`{}`|
|801006|`{}`|
|901006|`{}`|
|1001006|`{}`|

## BuffQuality

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|icon_big_bg|string|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|icon_small_bg|string|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|icon_tag|string|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|shadow|string|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|

## BuffPosition

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|icon|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|

## Buff

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|24|本表行键；与其他表同值不自动代表同一对象。|
|skill|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|quality|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pos_icon|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|beautify|number|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"skill":160001004,"quality":1}`|
|2|`{"skill":160001005,"quality":2}`|
|3|`{"skill":160001006,"quality":3}`|
|4|`{"skill":160001010,"quality":1}`|
|5|`{"skill":160001011,"quality":2}`|
|6|`{"skill":160001012,"quality":3}`|
|7|`{"skill":160001013,"quality":1}`|
|8|`{"skill":160001014,"quality":2}`|
|9|`{"skill":160001015,"quality":3}`|
|10|`{"skill":160001022,"quality":1}`|
|11|`{"skill":160001023,"quality":2}`|
|12|`{"skill":160001024,"quality":3}`|
|13|`{"skill":160001028,"quality":1}`|
|14|`{"skill":160001029,"quality":2}`|
|15|`{"skill":160001030,"quality":3}`|
|16|`{"skill":160001031,"quality":1}`|
|17|`{"skill":160001032,"quality":2}`|
|18|`{"skill":160001033,"quality":3}`|
|19|`{"skill":160001001,"quality":1}`|
|20|`{"skill":160001002,"quality":2}`|
|21|`{"skill":160001003,"quality":3}`|
|22|`{"skill":160001016,"quality":1}`|
|23|`{"skill":160001017,"quality":2}`|
|24|`{"skill":160001018,"quality":3}`|

## EventClose

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## EventType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|18|本表行键；与其他表同值不自动代表同一对象。|
|repeat_run|boolean|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lua_module|object|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|reset|boolean|18|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"repeat_run":false,"reset":true}`|
|2|`{"repeat_run":false,"reset":false}`|
|3|`{"repeat_run":false,"reset":true}`|
|4|`{"repeat_run":false,"reset":true}`|
|5|`{"repeat_run":false,"reset":true}`|
|6|`{"repeat_run":false,"reset":true}`|
|7|`{"repeat_run":false,"reset":true}`|
|8|`{"repeat_run":false,"reset":true}`|
|9|`{"repeat_run":false,"reset":true}`|
|10|`{"repeat_run":false,"reset":true}`|
|11|`{"repeat_run":false,"reset":true}`|
|12|`{"repeat_run":false,"reset":true}`|
|13|`{"repeat_run":false,"reset":true}`|
|14|`{"repeat_run":false,"reset":true}`|
|15|`{"repeat_run":false,"reset":true}`|
|16|`{"repeat_run":false,"reset":true}`|
|17|`{"repeat_run":false,"reset":true}`|
|18|`{"repeat_run":false,"reset":true}`|

## EventTaskActive

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## EventPropUse

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|style|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|title|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|des|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|prop|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|prop_n|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101018|`{}`|
|201018|`{}`|

## EventAnimate

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|collect_evt|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|animate|string|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|wait_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|use_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101016|`{"wait_time":0,"use_time":3800}`|

## EventBox

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|75|本表行键；与其他表同值不自动代表同一对象。|
|type|number|75|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|style|number|75|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|res_list|array/object|75|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101002|`{"type":0}`|
|201002|`{"type":0}`|
|301002|`{"type":0}`|
|401002|`{"type":0}`|
|501002|`{"type":0}`|
|601002|`{"type":0}`|
|701002|`{"type":0}`|
|801002|`{"type":0}`|
|901002|`{"type":0}`|
|1001002|`{"type":1}`|
|1101002|`{"type":1}`|
|1201002|`{"type":0}`|
|1301002|`{"type":0}`|
|1401002|`{"type":0}`|
|1501002|`{"type":0}`|
|1601002|`{"type":0}`|
|1701002|`{"type":0}`|
|1801002|`{"type":1}`|
|1901002|`{"type":0}`|
|2001002|`{"type":0}`|
|2101002|`{"type":1}`|
|2201002|`{"type":0}`|
|2301002|`{"type":0}`|
|2401002|`{"type":0}`|
|2501002|`{"type":1}`|
|2601002|`{"type":0}`|
|2701002|`{"type":0}`|
|2801002|`{"type":0}`|
|2901002|`{"type":0}`|
|3001002|`{"type":1}`|
|3101002|`{"type":0}`|
|3201002|`{"type":0}`|
|3301002|`{"type":0}`|
|3401002|`{"type":0}`|
|3501002|`{"type":1}`|
|3601002|`{"type":0}`|
|3701002|`{"type":1}`|
|3801002|`{"type":0}`|
|3901002|`{"type":0}`|
|4001002|`{"type":0}`|
|4101002|`{"type":0}`|
|4201002|`{"type":1}`|
|4301002|`{"type":0}`|
|4401002|`{"type":0}`|
|4501002|`{"type":0}`|
|4601002|`{"type":0}`|
|4701002|`{"type":0}`|
|4801002|`{"type":0}`|
|4901002|`{"type":1}`|
|5001002|`{"type":0}`|
|5101002|`{"type":0}`|
|5201002|`{"type":0}`|
|5301002|`{"type":0}`|
|5401002|`{"type":0}`|
|5501002|`{"type":0}`|
|5601002|`{"type":0}`|
|5701002|`{"type":0}`|
|5801002|`{"type":0}`|
|5901002|`{"type":0}`|
|6001002|`{"type":1}`|
|6101002|`{"type":0}`|
|6201002|`{"type":0}`|
|6301002|`{"type":0}`|
|6401002|`{"type":0}`|
|6501002|`{"type":1}`|
|6601002|`{"type":0}`|
|6701002|`{"type":0}`|
|6801002|`{"type":0}`|
|6901002|`{"type":0}`|
|7001002|`{"type":1}`|
|7101002|`{"type":0}`|
|7201002|`{"type":0}`|
|7301002|`{"type":0}`|
|7401002|`{"type":0}`|
|7501002|`{"type":1}`|

## EventTalk

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|81|本表行键；与其他表同值不自动代表同一对象。|
|style|number|81|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|story_type|number|81|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|talk|number|81|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|title|number|81|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|desc|number|81|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|zoom|boolean|81|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101003|`{"story_type":1}`|
|201003|`{"story_type":1}`|
|301003|`{"story_type":1}`|
|401003|`{"story_type":1}`|
|501003|`{"story_type":1}`|
|601003|`{"story_type":1}`|
|701003|`{"story_type":1}`|
|801003|`{"story_type":1}`|
|901003|`{"story_type":1}`|
|1001003|`{"story_type":1}`|
|1101003|`{"story_type":1}`|
|1201003|`{"story_type":1}`|
|1301003|`{"story_type":1}`|
|1401003|`{"story_type":1}`|
|1501003|`{"story_type":1}`|
|1601003|`{"story_type":1}`|
|1701003|`{"story_type":1}`|
|1801003|`{"story_type":1}`|
|1901003|`{"story_type":1}`|
|2001003|`{"story_type":1}`|
|2101003|`{"story_type":1}`|
|2201003|`{"story_type":1}`|
|2301003|`{"story_type":1}`|
|2401003|`{"story_type":1}`|
|2501003|`{"story_type":1}`|
|2601003|`{"story_type":1}`|
|2701003|`{"story_type":1}`|
|2801003|`{"story_type":1}`|
|2901003|`{"story_type":1}`|
|3001003|`{"story_type":1}`|
|3101003|`{"story_type":1}`|
|3201003|`{"story_type":1}`|
|3301003|`{"story_type":1}`|
|3401003|`{"story_type":1}`|
|3501003|`{"story_type":1}`|
|3601003|`{"story_type":1}`|
|3701003|`{"story_type":1}`|
|3801003|`{"story_type":1}`|
|3901003|`{"story_type":1}`|
|4001003|`{"story_type":1}`|
|4101003|`{"story_type":1}`|
|4201003|`{"story_type":1}`|
|4301003|`{"story_type":1}`|
|4401003|`{"story_type":1}`|
|4501003|`{"story_type":1}`|
|4601003|`{"story_type":1}`|
|4701003|`{"story_type":1}`|
|4801003|`{"story_type":1}`|
|4901003|`{"story_type":1}`|
|5001003|`{"story_type":1}`|
|5101003|`{"story_type":1}`|
|5201003|`{"story_type":1}`|
|5301003|`{"story_type":1}`|
|5401003|`{"story_type":1}`|
|5501003|`{"story_type":1}`|
|5601003|`{"story_type":1}`|
|5701003|`{"story_type":1}`|
|5801003|`{"story_type":1}`|
|5901003|`{"story_type":1}`|
|6001003|`{"story_type":1}`|
|6101003|`{"story_type":1}`|
|6201003|`{"story_type":1}`|
|6301003|`{"story_type":1}`|
|6401003|`{"story_type":1}`|
|6501003|`{"story_type":1}`|
|6601003|`{"story_type":1}`|
|6701003|`{"story_type":1}`|
|6801003|`{"story_type":1}`|
|6901003|`{"story_type":1}`|
|7001003|`{"story_type":1}`|
|7101003|`{"story_type":1}`|
|7201003|`{"story_type":1}`|
|7301003|`{"story_type":1}`|
|7401003|`{"story_type":1}`|
|7501003|`{"story_type":1}`|
|7601003|`{"story_type":1}`|
|7701003|`{"story_type":1}`|
|7801003|`{"story_type":1}`|
|7901003|`{"story_type":1}`|
|8001003|`{"story_type":1}`|
|8101003|`{"story_type":1}`|

## EventFight

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|63|本表行键；与其他表同值不自动代表同一对象。|
|fight_id|number|63|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|preview_title|number|63|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|preview_desc|number|63|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|style|number|63|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|auto_fight|boolean|63|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|limit_star|number|63|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|limit_level|number|63|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|breakthrough_level|number|63|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|npc_talent|number|63|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr|array|63|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101001|`{"fight_id":2901001,"auto_fight":false,"limit_star":5,"limit_level":100,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|201001|`{"fight_id":2901002,"auto_fight":false,"limit_star":5,"limit_level":100,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|301001|`{"fight_id":2901003,"auto_fight":false,"limit_star":5,"limit_level":100,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|401001|`{"fight_id":2901004,"auto_fight":false,"limit_star":5,"limit_level":100,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|501001|`{"fight_id":2901005,"auto_fight":false,"limit_star":5,"limit_level":100,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|601001|`{"fight_id":2901006,"auto_fight":false,"limit_star":5,"limit_level":100,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|701001|`{"fight_id":2901007,"auto_fight":false,"limit_star":5,"limit_level":100,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|801001|`{"fight_id":2901008,"auto_fight":true,"limit_star":5,"limit_level":100,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|901001|`{"fight_id":2902001,"auto_fight":false,"limit_star":6,"limit_level":145,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|1001001|`{"fight_id":2902002,"auto_fight":false,"limit_star":6,"limit_level":145,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|1101001|`{"fight_id":2902003,"auto_fight":false,"limit_star":6,"limit_level":145,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|1201001|`{"fight_id":2902004,"auto_fight":false,"limit_star":6,"limit_level":145,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|1301001|`{"fight_id":2902005,"auto_fight":false,"limit_star":6,"limit_level":145,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|1401001|`{"fight_id":2902006,"auto_fight":false,"limit_star":6,"limit_level":145,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|1501001|`{"fight_id":2902007,"auto_fight":false,"limit_star":6,"limit_level":145,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|1601001|`{"fight_id":2902008,"auto_fight":false,"limit_star":6,"limit_level":145,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|1701001|`{"fight_id":2902009,"auto_fight":false,"limit_star":6,"limit_level":145,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|1801001|`{"fight_id":2902010,"auto_fight":false,"limit_star":6,"limit_level":145,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|1901001|`{"fight_id":2902011,"auto_fight":false,"limit_star":6,"limit_level":145,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|2001001|`{"fight_id":2902012,"auto_fight":false,"limit_star":6,"limit_level":145,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|2101001|`{"fight_id":2902013,"auto_fight":false,"limit_star":6,"limit_level":145,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|2201001|`{"fight_id":2902014,"auto_fight":false,"limit_star":6,"limit_level":145,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|2301001|`{"fight_id":2903001,"auto_fight":false,"limit_star":7,"limit_level":165,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|2401001|`{"fight_id":2903002,"auto_fight":false,"limit_star":7,"limit_level":165,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|2501001|`{"fight_id":2903003,"auto_fight":false,"limit_star":7,"limit_level":165,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|2601001|`{"fight_id":2903004,"auto_fight":false,"limit_star":7,"limit_level":165,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|2701001|`{"fight_id":2903005,"auto_fight":false,"limit_star":7,"limit_level":165,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|2801001|`{"fight_id":2903006,"auto_fight":false,"limit_star":7,"limit_level":165,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|2901001|`{"fight_id":2903007,"auto_fight":false,"limit_star":7,"limit_level":165,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|3001001|`{"fight_id":2903008,"auto_fight":false,"limit_star":7,"limit_level":165,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|3101001|`{"fight_id":2903009,"auto_fight":false,"limit_star":7,"limit_level":165,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|3201001|`{"fight_id":2903010,"auto_fight":false,"limit_star":7,"limit_level":165,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|3301001|`{"fight_id":2903011,"auto_fight":false,"limit_star":7,"limit_level":165,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|3401001|`{"fight_id":2903012,"auto_fight":false,"limit_star":7,"limit_level":165,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|3501001|`{"fight_id":2901001,"auto_fight":false,"limit_star":5,"limit_level":100,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|3601001|`{"fight_id":2901002,"auto_fight":false,"limit_star":5,"limit_level":100,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|3701001|`{"fight_id":2901003,"auto_fight":false,"limit_star":5,"limit_level":100,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|3801001|`{"fight_id":2901004,"auto_fight":false,"limit_star":5,"limit_level":100,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|3901001|`{"fight_id":2901005,"auto_fight":false,"limit_star":5,"limit_level":100,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|4001001|`{"fight_id":2904001,"auto_fight":false,"limit_star":7,"limit_level":165,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|4101001|`{"fight_id":2904002,"auto_fight":false,"limit_star":7,"limit_level":165,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|4201001|`{"fight_id":2904003,"auto_fight":false,"limit_star":7,"limit_level":165,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|4301001|`{"fight_id":2904004,"auto_fight":false,"limit_star":7,"limit_level":165,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|4401001|`{"fight_id":2904005,"auto_fight":false,"limit_star":7,"limit_level":165,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|4501001|`{"fight_id":2904006,"auto_fight":false,"limit_star":7,"limit_level":165,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|4601001|`{"fight_id":2904007,"auto_fight":false,"limit_star":7,"limit_level":165,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|4701001|`{"fight_id":2904008,"auto_fight":false,"limit_star":7,"limit_level":165,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|4801001|`{"fight_id":2904009,"auto_fight":false,"limit_star":7,"limit_level":165,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|4901001|`{"fight_id":2904010,"auto_fight":false,"limit_star":7,"limit_level":165,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|5001001|`{"fight_id":2904011,"auto_fight":false,"limit_star":7,"limit_level":165,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|5101001|`{"fight_id":2904012,"auto_fight":false,"limit_star":7,"limit_level":165,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|5201001|`{"fight_id":2905001,"auto_fight":false,"limit_star":7,"limit_level":165,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|5301001|`{"fight_id":2905002,"auto_fight":false,"limit_star":7,"limit_level":165,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|5401001|`{"fight_id":2905003,"auto_fight":false,"limit_star":7,"limit_level":165,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|5501001|`{"fight_id":2905004,"auto_fight":false,"limit_star":7,"limit_level":165,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|5601001|`{"fight_id":2905005,"auto_fight":false,"limit_star":7,"limit_level":165,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|5701001|`{"fight_id":2905006,"auto_fight":false,"limit_star":7,"limit_level":165,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|5801001|`{"fight_id":2905007,"auto_fight":false,"limit_star":7,"limit_level":165,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|5901001|`{"fight_id":2905008,"auto_fight":false,"limit_star":7,"limit_level":165,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|6001001|`{"fight_id":2905009,"auto_fight":false,"limit_star":7,"limit_level":165,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|6101001|`{"fight_id":2905010,"auto_fight":false,"limit_star":7,"limit_level":165,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|6201001|`{"fight_id":2905011,"auto_fight":false,"limit_star":7,"limit_level":165,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|
|6301001|`{"fight_id":2905012,"auto_fight":false,"limit_star":7,"limit_level":165,"breakthrough_level":7,"npc_talent":10,"attr":[[1,10000],[2,10000]]}`|

## EventFightAward

已解析为0行；本结论仅覆盖此资产版本与该子表，不推断其他版本不可达。

## EventDraw

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|8|本表行键；与其他表同值不自动代表同一对象。|
|style|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_tips|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hero_libs|array|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101005|`{"hero_libs":[101]}`|
|201005|`{"hero_libs":[201]}`|
|301005|`{"hero_libs":[301]}`|
|401005|`{"hero_libs":[401]}`|
|501005|`{"hero_libs":[501]}`|
|601005|`{"hero_libs":[101]}`|
|701005|`{"hero_libs":[201]}`|
|801005|`{"hero_libs":[301]}`|

## EventTips

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|repeat_run|boolean|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|style|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tips|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101011|`{"repeat_run":true}`|
|201011|`{"repeat_run":true}`|
|301011|`{"repeat_run":true}`|

## EventChangeMap

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|type|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|target_grid|array|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101004|`{"type":0,"target_grid":[8014,9014,10013]}`|

## EventModelAuto

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|19|本表行键；与其他表同值不自动代表同一对象。|
|obstacle_style|number|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|target_grid|number|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|can_move|boolean|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|collect_evt|array|19|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101013|`{"type":0,"target_grid":12009,"can_move":false}`|
|201013|`{"type":1,"target_grid":12009,"can_move":true}`|
|301013|`{"type":0,"target_grid":7015,"can_move":false}`|
|401013|`{"type":1,"target_grid":7015,"can_move":true}`|
|501013|`{"type":0,"target_grid":6013,"can_move":false}`|
|601013|`{"type":1,"target_grid":6013,"can_move":true}`|
|701013|`{"type":0,"target_grid":8006,"can_move":true}`|
|801013|`{"type":1,"target_grid":8006,"can_move":true}`|
|901013|`{"type":0,"target_grid":13018,"can_move":false}`|
|1001013|`{"type":0,"target_grid":11007,"can_move":false}`|
|1101013|`{"type":1,"target_grid":11007,"can_move":false}`|
|1201013|`{"type":0,"target_grid":10008,"can_move":true}`|
|1301013|`{"type":1,"target_grid":10008,"can_move":true}`|
|1401013|`{"type":0,"target_grid":10013,"can_move":false}`|
|1501013|`{"type":1,"target_grid":10013,"can_move":true}`|
|1601013|`{"type":0,"target_grid":5012,"can_move":false}`|
|1701013|`{"type":1,"target_grid":5012,"can_move":true}`|
|1801013|`{"type":0,"target_grid":4003,"can_move":true}`|
|1901013|`{"type":1,"target_grid":4003,"can_move":true}`|

## EventCure

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|style|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|name|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tips|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|add_hp_per|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101007|`{"add_hp_per":2000}`|

## EventPropAdd

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|8|本表行键；与其他表同值不自动代表同一对象。|
|style|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|prop|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101008|`{}`|
|201008|`{}`|
|301008|`{}`|
|401008|`{}`|
|501008|`{}`|
|601008|`{}`|
|701008|`{}`|
|801008|`{}`|

## EventEffect

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|7|本表行键；与其他表同值不自动代表同一对象。|
|effect|string|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|grid|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|offset|null|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|scale|null|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|angle|null|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|wait_time|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_time|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|use_time|number|7|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101015|`{"wait_time":0,"show_time":3000,"use_time":3000}`|
|201015|`{"wait_time":0,"show_time":2300,"use_time":1500}`|
|301015|`{"wait_time":0,"show_time":2000,"use_time":1500}`|
|401015|`{"wait_time":0,"show_time":2000,"use_time":1500}`|
|501015|`{"wait_time":0,"show_time":2000,"use_time":1500}`|
|601015|`{"wait_time":0,"show_time":2000,"use_time":2000}`|
|701015|`{"wait_time":0,"show_time":2000,"use_time":2000}`|

## EventMoveCam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|27|本表行键；与其他表同值不自动代表同一对象。|
|grid|number|27|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101009|`{}`|
|201009|`{}`|
|301009|`{}`|
|401009|`{}`|
|501009|`{}`|
|601009|`{}`|
|701009|`{}`|
|801009|`{}`|
|901009|`{}`|
|1001009|`{}`|
|1101009|`{}`|
|1201009|`{}`|
|1301009|`{}`|
|1401009|`{}`|
|1501009|`{}`|
|1601009|`{}`|
|1701009|`{}`|
|1801009|`{}`|
|1901009|`{}`|
|2001009|`{}`|
|2101009|`{}`|
|2201009|`{}`|
|2301009|`{}`|
|2401009|`{}`|
|2501009|`{}`|
|2601009|`{}`|
|2701009|`{}`|

## DungeonEventHero

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|13|本表行键；与其他表同值不自动代表同一对象。|
|hero_id|number|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skin|number|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hero_level|number|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hero_star|number|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hero_quality|number|13|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"hero_id":3030501,"hero_level":180,"hero_star":5,"hero_quality":50}`|
|201|`{"hero_id":3030501,"hero_level":160,"hero_star":6,"hero_quality":60}`|
|301|`{"hero_id":3030501,"hero_level":280,"hero_star":7,"hero_quality":60}`|
|401|`{"hero_id":3030501,"hero_level":400,"hero_star":8,"hero_quality":60}`|
|501|`{"hero_id":3030501,"hero_level":600,"hero_star":10,"hero_quality":60}`|
|601|`{"hero_id":2030301,"hero_level":320,"hero_star":5,"hero_quality":50}`|
|701|`{"hero_id":1030501,"hero_level":320,"hero_star":5,"hero_quality":50}`|
|801|`{"hero_id":1030101,"hero_level":320,"hero_star":5,"hero_quality":50}`|
|901|`{"hero_id":4030501,"hero_level":320,"hero_star":5,"hero_quality":50}`|
|1001|`{"hero_id":4030401,"hero_level":320,"hero_star":5,"hero_quality":50}`|
|1101|`{"hero_id":3030601,"hero_level":320,"hero_star":5,"hero_quality":50}`|
|1201|`{"hero_id":2030501,"hero_level":320,"hero_star":5,"hero_quality":50}`|
|1301|`{"hero_id":3030201,"hero_level":320,"hero_star":5,"hero_quality":50}`|

## DungeonEventHeroPool

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|7|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{}`|
|201|`{}`|
|301|`{}`|
|401|`{}`|
|501|`{}`|
|601|`{}`|
|701|`{}`|

## EventFollower

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|10|本表行键；与其他表同值不自动代表同一对象。|
|follower_style|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|type|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|collect_evt|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|init_pos|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101014|`{"type":0,"init_pos":6001}`|
|201014|`{"type":1,"init_pos":0}`|
|301014|`{"type":0,"init_pos":7015}`|
|401014|`{"type":0,"init_pos":0}`|
|501014|`{"type":0,"init_pos":0}`|
|601014|`{"type":1,"init_pos":0}`|
|701014|`{"type":0,"init_pos":9007}`|
|801014|`{"type":0,"init_pos":2001}`|
|901014|`{"type":0,"init_pos":11008}`|
|1001014|`{"type":0,"init_pos":11015}`|

## EventLock

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|type|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101017|`{"type":0}`|
|201017|`{"type":1}`|
|301017|`{"type":0}`|

## EventFogHide

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|target_grid|array|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101010|`{"target_grid":[4013]}`|
|201010|`{"target_grid":[5014]}`|
|301010|`{"target_grid":[3012,4012,5012,4011,4010]}`|

## PuzzleEventBoxAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|150|本表行键；与其他表同值不自动代表同一对象。|
|event_box|number|150|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|res_list|array/object|150|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|relation_act_version|number|150|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10001|`{"relation_act_version":1}`|
|10002|`{"relation_act_version":1}`|
|10003|`{"relation_act_version":1}`|
|10004|`{"relation_act_version":1}`|
|10005|`{"relation_act_version":1}`|
|10006|`{"relation_act_version":1}`|
|10007|`{"relation_act_version":1}`|
|10008|`{"relation_act_version":1}`|
|10009|`{"relation_act_version":1}`|
|10010|`{"relation_act_version":1}`|
|10011|`{"relation_act_version":1}`|
|10012|`{"relation_act_version":1}`|
|10013|`{"relation_act_version":1}`|
|10014|`{"relation_act_version":1}`|
|10015|`{"relation_act_version":1}`|
|10016|`{"relation_act_version":1}`|
|10017|`{"relation_act_version":1}`|
|10018|`{"relation_act_version":1}`|
|10019|`{"relation_act_version":1}`|
|10020|`{"relation_act_version":1}`|
|10021|`{"relation_act_version":1}`|
|10022|`{"relation_act_version":1}`|
|10023|`{"relation_act_version":1}`|
|10024|`{"relation_act_version":1}`|
|10025|`{"relation_act_version":1}`|
|10026|`{"relation_act_version":1}`|
|10027|`{"relation_act_version":1}`|
|10028|`{"relation_act_version":1}`|
|10029|`{"relation_act_version":1}`|
|10030|`{"relation_act_version":1}`|
|10031|`{"relation_act_version":1}`|
|10032|`{"relation_act_version":1}`|
|10033|`{"relation_act_version":1}`|
|10034|`{"relation_act_version":1}`|
|10035|`{"relation_act_version":1}`|
|10036|`{"relation_act_version":1}`|
|10037|`{"relation_act_version":1}`|
|10038|`{"relation_act_version":1}`|
|10039|`{"relation_act_version":1}`|
|10040|`{"relation_act_version":1}`|
|10041|`{"relation_act_version":1}`|
|10042|`{"relation_act_version":1}`|
|10043|`{"relation_act_version":1}`|
|10044|`{"relation_act_version":1}`|
|10045|`{"relation_act_version":1}`|
|10046|`{"relation_act_version":1}`|
|10047|`{"relation_act_version":1}`|
|10048|`{"relation_act_version":1}`|
|10049|`{"relation_act_version":1}`|
|10050|`{"relation_act_version":1}`|
|10051|`{"relation_act_version":1}`|
|10052|`{"relation_act_version":1}`|
|10053|`{"relation_act_version":1}`|
|10054|`{"relation_act_version":1}`|
|10055|`{"relation_act_version":1}`|
|10056|`{"relation_act_version":1}`|
|10057|`{"relation_act_version":1}`|
|10058|`{"relation_act_version":1}`|
|10059|`{"relation_act_version":1}`|
|10060|`{"relation_act_version":1}`|
|10061|`{"relation_act_version":1}`|
|10062|`{"relation_act_version":1}`|
|10063|`{"relation_act_version":1}`|
|10064|`{"relation_act_version":1}`|
|10065|`{"relation_act_version":1}`|
|10066|`{"relation_act_version":1}`|
|10067|`{"relation_act_version":1}`|
|10068|`{"relation_act_version":1}`|
|10069|`{"relation_act_version":1}`|
|10070|`{"relation_act_version":1}`|
|10071|`{"relation_act_version":1}`|
|10072|`{"relation_act_version":1}`|
|10073|`{"relation_act_version":1}`|
|10074|`{"relation_act_version":1}`|
|10075|`{"relation_act_version":1}`|
|20001|`{"relation_act_version":2}`|
|20002|`{"relation_act_version":2}`|
|20003|`{"relation_act_version":2}`|
|20004|`{"relation_act_version":2}`|
|20005|`{"relation_act_version":2}`|
|20006|`{"relation_act_version":2}`|
|20007|`{"relation_act_version":2}`|
|20008|`{"relation_act_version":2}`|
|20009|`{"relation_act_version":2}`|
|20010|`{"relation_act_version":2}`|
|20011|`{"relation_act_version":2}`|
|20012|`{"relation_act_version":2}`|
|20013|`{"relation_act_version":2}`|
|20014|`{"relation_act_version":2}`|
|20015|`{"relation_act_version":2}`|
|20016|`{"relation_act_version":2}`|
|20017|`{"relation_act_version":2}`|
|20018|`{"relation_act_version":2}`|
|20019|`{"relation_act_version":2}`|
|20020|`{"relation_act_version":2}`|
|20021|`{"relation_act_version":2}`|
|20022|`{"relation_act_version":2}`|
|20023|`{"relation_act_version":2}`|
|20024|`{"relation_act_version":2}`|
|20025|`{"relation_act_version":2}`|
|20026|`{"relation_act_version":2}`|
|20027|`{"relation_act_version":2}`|
|20028|`{"relation_act_version":2}`|
|20029|`{"relation_act_version":2}`|
|20030|`{"relation_act_version":2}`|
|20031|`{"relation_act_version":2}`|
|20032|`{"relation_act_version":2}`|
|20033|`{"relation_act_version":2}`|
|20034|`{"relation_act_version":2}`|
|20035|`{"relation_act_version":2}`|
|20036|`{"relation_act_version":2}`|
|20037|`{"relation_act_version":2}`|
|20038|`{"relation_act_version":2}`|
|20039|`{"relation_act_version":2}`|
|20040|`{"relation_act_version":2}`|
|20041|`{"relation_act_version":2}`|
|20042|`{"relation_act_version":2}`|
|20043|`{"relation_act_version":2}`|
|20044|`{"relation_act_version":2}`|
|20045|`{"relation_act_version":2}`|
|20046|`{"relation_act_version":2}`|
|20047|`{"relation_act_version":2}`|
|20048|`{"relation_act_version":2}`|
|20049|`{"relation_act_version":2}`|
|20050|`{"relation_act_version":2}`|
|20051|`{"relation_act_version":2}`|
|20052|`{"relation_act_version":2}`|
|20053|`{"relation_act_version":2}`|
|20054|`{"relation_act_version":2}`|
|20055|`{"relation_act_version":2}`|
|20056|`{"relation_act_version":2}`|
|20057|`{"relation_act_version":2}`|
|20058|`{"relation_act_version":2}`|
|20059|`{"relation_act_version":2}`|
|20060|`{"relation_act_version":2}`|
|20061|`{"relation_act_version":2}`|
|20062|`{"relation_act_version":2}`|
|20063|`{"relation_act_version":2}`|
|20064|`{"relation_act_version":2}`|
|20065|`{"relation_act_version":2}`|
|20066|`{"relation_act_version":2}`|
|20067|`{"relation_act_version":2}`|
|20068|`{"relation_act_version":2}`|
|20069|`{"relation_act_version":2}`|
|20070|`{"relation_act_version":2}`|
|20071|`{"relation_act_version":2}`|
|20072|`{"relation_act_version":2}`|
|20073|`{"relation_act_version":2}`|
|20074|`{"relation_act_version":2}`|
|20075|`{"relation_act_version":2}`|

## PuzzleConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|skip_story|boolean|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|level_red|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|act_entry_red|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hundred_acc_red|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rare_act|number|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|68001|`{"level_red":10177}`|
|68002|`{"level_red":175314733854}`|

## Event

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|243|本表行键；与其他表同值不自动代表同一对象。|
|self_activate_type|number|243|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|run_type|number|243|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|event_grid|number|243|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|event_body|number|243|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|next_activate_type|number|243|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|next_event|object/array|243|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1100101|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|1100201|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|1100301|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":[2100301]}`|
|1100401|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":[4100401]}`|
|1100501|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":[2100501,4100501]}`|
|2100101|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|2100201|`{"self_activate_type":1,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|2100301|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[3100301]}`|
|2100401|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|2100501|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|3100101|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|3100201|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|3100301|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|3100401|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|3100501|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|4100101|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|4100201|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|4100301|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":[5100301,28100301]}`|
|4100401|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[24100401,5100401]}`|
|4100501|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[3100501,6100501]}`|
|5100101|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|5100201|`{"self_activate_type":1,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|5100301|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[6100301]}`|
|5100401|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[6100401]}`|
|5100501|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[44100501]}`|
|6100101|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|6100201|`{"self_activate_type":1,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|6100301|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|6100401|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[7100401]}`|
|6100501|`{"self_activate_type":0,"run_type":1,"next_activate_type":0,"next_event":[5100501]}`|
|7100101|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|7100201|`{"self_activate_type":1,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|7100301|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|7100401|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[8100401]}`|
|7100501|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[8100501]}`|
|8100101|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":[38100101]}`|
|8100201|`{"self_activate_type":1,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|8100301|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|8100401|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|8100501|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[9100501,15100501,16100501]}`|
|9100101|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[24100101]}`|
|9100201|`{"self_activate_type":1,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|9100301|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|9100401|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":[10100401]}`|
|9100501|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[10100501]}`|
|10100101|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|10100201|`{"self_activate_type":1,"run_type":0,"next_activate_type":0,"next_event":[33100201]}`|
|10100301|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|10100401|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|10100501|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[11100501]}`|
|11100101|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|11100201|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[35100201]}`|
|11100301|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|11100401|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":[12100401]}`|
|11100501|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[12100501]}`|
|12100101|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|12100201|`{"self_activate_type":1,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|12100301|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":[13100301]}`|
|12100401|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|12100501|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|13100101|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|13100201|`{"self_activate_type":1,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|13100301|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[14100301]}`|
|13100401|`{"self_activate_type":2,"run_type":1,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|13100501|`{"self_activate_type":2,"run_type":1,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|14100101|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|14100201|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":[26100201]}`|
|14100301|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|14100401|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|14100501|`{"self_activate_type":2,"run_type":1,"next_activate_type":0,"next_event":[17100501]}`|
|15100101|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|15100201|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|15100301|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|15100401|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":[18100401]}`|
|15100501|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|16100101|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|16100201|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|16100301|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|16100401|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|16100501|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|17100101|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|17100201|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|17100301|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|17100401|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":[19100401]}`|
|17100501|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[45100501]}`|
|18100101|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|18100201|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|18100301|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|18100401|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|18100501|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[19100501,20100501,23100501]}`|
|19100101|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|19100201|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|19100301|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|19100401|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[20100401]}`|
|19100501|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|20100101|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|20100201|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|20100301|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|20100401|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[21100401]}`|
|20100501|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[21100501]}`|
|21100101|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":[37100101,31100101]}`|
|21100201|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|21100301|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|21100401|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[22100401]}`|
|21100501|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[22100501]}`|
|22100101|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|22100201|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|22100301|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|22100401|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|22100501|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|23100101|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[29100101]}`|
|23100201|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|23100301|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|23100401|`{"self_activate_type":2,"run_type":1,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|23100501|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[46100501]}`|
|24100101|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|24100201|`{"self_activate_type":1,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|24100301|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|24100401|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[43100401]}`|
|24100501|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[22100501]}`|
|25100101|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":[27100101]}`|
|25100201|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[55100201,58100201]}`|
|25100301|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|25100401|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|25100501|`{"self_activate_type":2,"run_type":1,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|26100101|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":[28100101]}`|
|26100201|`{"self_activate_type":2,"run_type":1,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|26100301|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|26100401|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|26100501|`{"self_activate_type":2,"run_type":1,"next_activate_type":0,"next_event":[27100501]}`|
|27100101|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|27100201|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":[28100201,51100201]}`|
|27100301|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|27100401|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|27100501|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|28100101|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|28100201|`{"self_activate_type":0,"run_type":1,"next_activate_type":0,"next_event":[43100201,11100201,39100201]}`|
|28100301|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|28100401|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|28100501|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|29100101|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[30100101]}`|
|29100201|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|29100301|`{"self_activate_type":2,"run_type":1,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|29100401|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|29100501|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|30100101|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[51100101]}`|
|30100201|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|30100301|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|30100401|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|30100501|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|31100101|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[32100101]}`|
|31100201|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|31100301|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|31100401|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|31100501|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|32100101|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[22100101,23100101]}`|
|32100201|`{"self_activate_type":2,"run_type":1,"next_activate_type":0,"next_event":[42100201]}`|
|32100401|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|32100501|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|33100101|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[34100101]}`|
|33100201|`{"self_activate_type":0,"run_type":1,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|33100401|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|33100501|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|34100101|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[35100101]}`|
|34100201|`{"self_activate_type":2,"run_type":1,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|34100401|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|34100501|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|35100101|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[36100101]}`|
|35100201|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[50100201,45100201]}`|
|35100401|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|35100501|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|36100101|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|36100201|`{"self_activate_type":2,"run_type":1,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|36100401|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|36100501|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|37100101|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[9100101]}`|
|37100201|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|37100401|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|37100501|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|38100101|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|38100201|`{"self_activate_type":1,"run_type":0,"next_activate_type":0,"next_event":[31100201]}`|
|38100401|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|38100501|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|39100101|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[43100101]}`|
|39100201|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[40100201]}`|
|39100401|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|39100501|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|40100101|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[49100101,39100101,41100101]}`|
|40100201|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[29100201]}`|
|40100401|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|40100501|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|41100101|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|41100201|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|41100401|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|41100501|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|42100101|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[46100101,47100101,48100101,20100101]}`|
|42100201|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|42100401|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|42100501|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|43100101|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[42100101]}`|
|43100201|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|43100401|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[44100401]}`|
|43100501|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|44100101|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[45100101,50100101]}`|
|44100201|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|44100401|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[45100401]}`|
|44100501|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[7100501]}`|
|45100101|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|45100201|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|45100401|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[46100401]}`|
|45100501|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[18100501]}`|
|46100101|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|46100201|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|46100401|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|46100501|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[28100501]}`|
|47100101|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|47100201|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|48100101|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[44100101]}`|
|48100201|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|49100101|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|49100201|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|50100101|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|50100201|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|51100101|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[52100101]}`|
|51100201|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|52100101|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[40100101]}`|
|52100201|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|53100101|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":[33100101]}`|
|53100201|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|54100101|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|54100201|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|55100201|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|56100201|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|57100201|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[25100201]}`|
|58100201|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[65100201]}`|
|59100201|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":[57100201]}`|
|60100201|`{"self_activate_type":2,"run_type":1,"next_activate_type":0,"next_event":[61100201]}`|
|61100201|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[62100201]}`|
|62100201|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":[63100201]}`|
|63100201|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|64100201|`{"self_activate_type":2,"run_type":1,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|65100201|`{"self_activate_type":0,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|
|66100201|`{"self_activate_type":2,"run_type":0,"next_activate_type":0,"next_event":{"global":"TableEmpty"}}`|

## EventCondition

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|assert|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fail_display|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fail_param|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|32100201|`{"assert":[697958100201,364754800201]}`|
|38100201|`{"assert":[697958100201]}`|

## EventRecord

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|8|本表行键；与其他表同值不自动代表同一对象。|
|text|number|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|param|object|8|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|2100301|`{}`|
|4100401|`{}`|
|4100501|`{}`|
|8100101|`{}`|
|27100201|`{}`|
|33100101|`{}`|
|39100101|`{}`|
|65100201|`{}`|

## PuzzleLevel

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|title|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|banner|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_light|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_dark|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|desc|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|peak_level|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|last_progress|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|login_day|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|guide_node|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_subtitle|boolean|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|subtitle_txt|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|subtitle_time|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"peak_level":0,"last_progress":0,"login_day":1,"subtitle_time":5}`|
|201|`{"peak_level":0,"last_progress":100,"login_day":2,"subtitle_time":5}`|
|301|`{"peak_level":0,"last_progress":100,"login_day":3,"subtitle_time":5}`|
|401|`{"peak_level":0,"last_progress":100,"login_day":5,"subtitle_time":5}`|
|501|`{"peak_level":0,"last_progress":100,"login_day":7,"subtitle_time":5}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|dungeon_max|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|level_max|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|scene_max|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|event_type_max|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|came_speed|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|came_after_wait|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pass_tips_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pass_tips_show|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"dungeon_max":100,"level_max":1000,"scene_max":10,"event_type_max":1000,"came_speed":10,"pass_tips_time":5000}`|

## DungeonStyle

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|34|本表行键；与其他表同值不自动代表同一对象。|
|style|string|34|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|offset|null|31|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|angle|null|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|effect|string|34|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

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

## EventFailFun

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|

## Level

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|10|本表行键；与其他表同值不自动代表同一对象。|
|player_style|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|scene|array|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|init_pos|array|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|unlock_fog_range|number|10|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"init_pos":[6002,0,0,0,0],"unlock_fog_range":2}`|
|102|`{"init_pos":[6002,0,0,0,0],"unlock_fog_range":2}`|
|103|`{"init_pos":[6002,0,0,0,0],"unlock_fog_range":2}`|
|201|`{"init_pos":[7002,0,0,0,0],"unlock_fog_range":2}`|
|202|`{"init_pos":[6002,0,0,0,0],"unlock_fog_range":2}`|
|203|`{"init_pos":[7002,0,0,0,0],"unlock_fog_range":2}`|
|301|`{"init_pos":[1002,0,0,0,0],"unlock_fog_range":2}`|
|302|`{"init_pos":[6002,0,0,0,0],"unlock_fog_range":2}`|
|401|`{"init_pos":[10007,0,0,0,0],"unlock_fog_range":2}`|
|501|`{"init_pos":[13014,0,0,0,0],"unlock_fog_range":2}`|

## DungeonType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|lua_module|object|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_type|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|lineup_type|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|max_prop|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|grid_move_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|each_chapter_get_award_count|number|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"fight_type":32,"lineup_type":26,"max_prop":3,"grid_move_time":0.4,"each_chapter_get_award_count":200}`|

## Prop

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|icon|string|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|name|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|desc|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|
