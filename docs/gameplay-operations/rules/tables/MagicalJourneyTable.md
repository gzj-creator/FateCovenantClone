# MagicalJourneyTable 规则参数

来源：[personal-server/assets/tables/MagicalJourneyTable.data.lua.json.gz](../../../../personal-server/assets/tables/MagicalJourneyTable.data.lua.json.gz)，SHA256：`1fc14d826580f28cd499061cd561e5b40e1c9785c5d0c9e2bc1d128bbfea0942`。

[完整逐行JSON](MagicalJourneyTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[ChapterTask](#chaptertask)|182|decoded-rows|
|[MissionMark](#missionmark)|3|decoded-rows|
|[TaskType](#tasktype)|4|decoded-rows|
|[Mission](#mission)|1800|decoded-rows|
|[MissionFadeType](#missionfadetype)|24|decoded-rows|
|[MissionFade](#missionfade)|28|decoded-rows|
|[TenRetry](#tenretry)|3|decoded-rows|
|[Const](#const)|1|decoded-rows|
|[MissionDropAward](#missiondropaward)|4|decoded-rows|
|[Chapter](#chapter)|6|decoded-rows|
|[EliteMission](#elitemission)|90|decoded-rows|
|[MissionNode](#missionnode)|6|decoded-rows|
|[MissionNodeRank](#missionnoderank)|16|decoded-rows|
|[Scene](#scene)|12|decoded-rows|
|[CountryParam](#countryparam)|1|decoded-rows|
|[Sword](#sword)|1|decoded-rows|
|[Attr](#attr)|1|decoded-rows|
|[SwordType](#swordtype)|2|decoded-rows|
|[AttrItem](#attritem)|80|decoded-rows|
|[NormalCollect](#normalcollect)|20|decoded-rows|
|[CountrySubType](#countrysubtype)|4|decoded-rows|
|[SeasonCollect](#seasoncollect)|57|decoded-rows|
|[SeasonCollectAward](#seasoncollectaward)|20|decoded-rows|
|[TalkContent](#talkcontent)|3|decoded-rows|
|[Open](#open)|1|decoded-rows|
|[RankBubble](#rankbubble)|5|decoded-rows|
|[StateImage](#stateimage)|3|decoded-rows|
|[MagicalJourneyeMbryoBobble](#magicaljourneyembryobobble)|4|decoded-rows|
|[MissionBobble](#missionbobble)|4|decoded-rows|
|[MissionRank](#missionrank)|15|decoded-rows|
|[AttrGroup](#attrgroup)|9|decoded-rows|
|[AttrType](#attrtype)|9|decoded-rows|
|[Country](#country)|400|decoded-rows|
|[CountrySub](#countrysub)|240|decoded-rows|
|[CountrySubLevel](#countrysublevel)|60|decoded-rows|
|[SwordAttr](#swordattr)|21|decoded-rows|
|[CountryStar](#countrystar)|36|decoded-rows|
|[NormalCollectAttr](#normalcollectattr)|101|decoded-rows|
|[BossDay](#bossday)|70|decoded-rows|
|[BossConst](#bossconst)|1|decoded-rows|
|[BossRankAward](#bossrankaward)|11|decoded-rows|
|[BossFightAward](#bossfightaward)|3|decoded-rows|
|[BossShow](#bossshow)|6|decoded-rows|
|[Boss](#boss)|1|decoded-rows|

## ChapterTask

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|task_count|number|182|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tag_type|number|182|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_type|number|182|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|182|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|tid|number|182|本表行键；与其他表同值不自动代表同一对象。|
|task_param|number|182|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|belong_chapter|number|182|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1001|`{"task_count":1,"tag_type":4,"task_type":12808,"award":[[101500,1000],[326002,5]],"task_param":0}`|
|1002|`{"task_count":30,"tag_type":4,"task_type":12806,"award":[[101500,1000],[327002,5]],"task_param":0}`|
|1003|`{"task_count":1010300,"tag_type":4,"task_type":12801,"award":[[101500,1000],[327002,10]],"task_param":0}`|
|1004|`{"task_count":150,"tag_type":4,"task_type":12832,"award":[[101500,1000],[327002,5]],"task_param":0}`|
|1005|`{"task_count":20,"tag_type":4,"task_type":300101,"award":[[101500,2000],[327002,5]],"task_param":1030300}`|
|1006|`{"task_count":1,"tag_type":4,"task_type":12809,"award":[[101500,2000],[327002,10]],"task_param":0}`|
|1007|`{"task_count":3000000,"tag_type":3,"task_type":2301,"award":[[181002,24000]],"task_param":0}`|
|1008|`{"task_count":4000000,"tag_type":3,"task_type":2301,"award":[[180002,24000]],"task_param":0}`|
|1009|`{"task_count":6000000,"tag_type":3,"task_type":2301,"award":[[181002,24000]],"task_param":0}`|
|1010|`{"task_count":8000000,"tag_type":3,"task_type":2301,"award":[[180002,24000]],"task_param":0}`|
|1011|`{"task_count":10000000,"tag_type":3,"task_type":2301,"award":[[181002,48000]],"task_param":0}`|
|1012|`{"task_count":15000000,"tag_type":3,"task_type":2301,"award":[[180002,48000]],"task_param":0}`|
|1013|`{"task_count":20000000,"tag_type":3,"task_type":2301,"award":[[181002,48000]],"task_param":0}`|
|1014|`{"task_count":25000000,"tag_type":3,"task_type":2301,"award":[[180002,48000]],"task_param":0}`|
|1015|`{"task_count":30000000,"tag_type":3,"task_type":2301,"award":[[181002,48000]],"task_param":0}`|
|1016|`{"task_count":35000000,"tag_type":3,"task_type":2301,"award":[[180002,48000]],"task_param":0}`|
|1017|`{"task_count":40000000,"tag_type":3,"task_type":2301,"award":[[181002,48000]],"task_param":0}`|
|1018|`{"task_count":45000000,"tag_type":3,"task_type":2301,"award":[[180002,48000]],"task_param":0}`|
|1019|`{"task_count":50000000,"tag_type":3,"task_type":2301,"award":[[181002,48000],[180002,48000]],"task_param":0}`|
|1020|`{"task_count":55000000,"tag_type":3,"task_type":2301,"award":[[181002,48000],[180002,48000]],"task_param":0}`|
|1021|`{"task_count":60000000,"tag_type":3,"task_type":2301,"award":[[181002,48000],[180002,48000]],"task_param":0}`|
|1022|`{"task_count":65000000,"tag_type":3,"task_type":2301,"award":[[181002,48000],[180002,48000]],"task_param":0}`|
|1023|`{"task_count":3000000,"tag_type":3,"task_type":2301,"award":[[270002,1]],"task_param":0}`|
|1024|`{"task_count":4000000,"tag_type":3,"task_type":2301,"award":[[288002,1]],"task_param":0}`|
|1025|`{"task_count":6000000,"tag_type":3,"task_type":2301,"award":[[270002,1]],"task_param":0}`|
|1026|`{"task_count":8000000,"tag_type":3,"task_type":2301,"award":[[288002,1]],"task_param":0}`|
|1027|`{"task_count":10000000,"tag_type":3,"task_type":2301,"award":[[294002,1]],"task_param":0}`|
|1028|`{"task_count":15000000,"tag_type":3,"task_type":2301,"award":[[276002,1]],"task_param":0}`|
|1029|`{"task_count":20000000,"tag_type":3,"task_type":2301,"award":[[294002,1]],"task_param":0}`|
|1030|`{"task_count":25000000,"tag_type":3,"task_type":2301,"award":[[276002,1]],"task_param":0}`|
|1031|`{"task_count":30000000,"tag_type":3,"task_type":2301,"award":[[294002,2]],"task_param":0}`|
|1032|`{"task_count":35000000,"tag_type":3,"task_type":2301,"award":[[276002,2]],"task_param":0}`|
|1033|`{"task_count":40000000,"tag_type":3,"task_type":2301,"award":[[294002,2]],"task_param":0}`|
|1034|`{"task_count":45000000,"tag_type":3,"task_type":2301,"award":[[276002,2]],"task_param":0}`|
|1035|`{"task_count":50000000,"tag_type":3,"task_type":2301,"award":[[294002,3],[276002,3]],"task_param":0}`|
|1036|`{"task_count":55000000,"tag_type":3,"task_type":2301,"award":[[294002,3],[276002,3]],"task_param":0}`|
|1037|`{"task_count":60000000,"tag_type":3,"task_type":2301,"award":[[294002,3],[276002,3]],"task_param":0}`|
|1038|`{"task_count":65000000,"tag_type":3,"task_type":2301,"award":[[294002,3],[276002,3]],"task_param":0}`|
|1039|`{"task_count":3000000,"tag_type":3,"task_type":2301,"award":[[271002,1]],"task_param":0}`|
|1040|`{"task_count":4000000,"tag_type":3,"task_type":2301,"award":[[289002,1]],"task_param":0}`|
|1041|`{"task_count":6000000,"tag_type":3,"task_type":2301,"award":[[271002,1]],"task_param":0}`|
|1042|`{"task_count":8000000,"tag_type":3,"task_type":2301,"award":[[289002,1]],"task_param":0}`|
|1043|`{"task_count":10000000,"tag_type":3,"task_type":2301,"award":[[295002,1]],"task_param":0}`|
|1044|`{"task_count":15000000,"tag_type":3,"task_type":2301,"award":[[277002,1]],"task_param":0}`|
|1045|`{"task_count":20000000,"tag_type":3,"task_type":2301,"award":[[295002,1]],"task_param":0}`|
|1046|`{"task_count":25000000,"tag_type":3,"task_type":2301,"award":[[277002,1]],"task_param":0}`|
|1047|`{"task_count":30000000,"tag_type":3,"task_type":2301,"award":[[295002,2]],"task_param":0}`|
|1048|`{"task_count":35000000,"tag_type":3,"task_type":2301,"award":[[277002,2]],"task_param":0}`|
|1049|`{"task_count":40000000,"tag_type":3,"task_type":2301,"award":[[295002,2]],"task_param":0}`|
|1050|`{"task_count":45000000,"tag_type":3,"task_type":2301,"award":[[277002,2]],"task_param":0}`|
|1051|`{"task_count":50000000,"tag_type":3,"task_type":2301,"award":[[295002,3],[277002,3]],"task_param":0}`|
|1052|`{"task_count":55000000,"tag_type":3,"task_type":2301,"award":[[295002,3],[277002,3]],"task_param":0}`|
|1053|`{"task_count":60000000,"tag_type":3,"task_type":2301,"award":[[295002,3],[277002,3]],"task_param":0}`|
|1054|`{"task_count":65000000,"tag_type":3,"task_type":2301,"award":[[295002,3],[277002,3]],"task_param":0}`|
|1055|`{"task_count":3000000,"tag_type":3,"task_type":2301,"award":[[272002,1]],"task_param":0}`|
|1056|`{"task_count":4000000,"tag_type":3,"task_type":2301,"award":[[290002,1]],"task_param":0}`|
|1057|`{"task_count":6000000,"tag_type":3,"task_type":2301,"award":[[272002,1]],"task_param":0}`|
|1058|`{"task_count":8000000,"tag_type":3,"task_type":2301,"award":[[290002,1]],"task_param":0}`|
|1059|`{"task_count":10000000,"tag_type":3,"task_type":2301,"award":[[296002,1]],"task_param":0}`|
|1060|`{"task_count":15000000,"tag_type":3,"task_type":2301,"award":[[278002,1]],"task_param":0}`|
|1061|`{"task_count":20000000,"tag_type":3,"task_type":2301,"award":[[296002,1]],"task_param":0}`|
|1062|`{"task_count":25000000,"tag_type":3,"task_type":2301,"award":[[278002,1]],"task_param":0}`|
|1063|`{"task_count":30000000,"tag_type":3,"task_type":2301,"award":[[296002,2]],"task_param":0}`|
|1064|`{"task_count":35000000,"tag_type":3,"task_type":2301,"award":[[278002,2]],"task_param":0}`|
|1065|`{"task_count":40000000,"tag_type":3,"task_type":2301,"award":[[296002,2]],"task_param":0}`|
|1066|`{"task_count":45000000,"tag_type":3,"task_type":2301,"award":[[278002,2]],"task_param":0}`|
|1067|`{"task_count":50000000,"tag_type":3,"task_type":2301,"award":[[296002,3],[278002,3]],"task_param":0}`|
|1068|`{"task_count":55000000,"tag_type":3,"task_type":2301,"award":[[296002,3],[278002,3]],"task_param":0}`|
|1069|`{"task_count":60000000,"tag_type":3,"task_type":2301,"award":[[296002,3],[278002,3]],"task_param":0}`|
|1070|`{"task_count":65000000,"tag_type":3,"task_type":2301,"award":[[296002,3],[278002,3]],"task_param":0}`|
|1071|`{"task_count":3000000,"tag_type":3,"task_type":2301,"award":[[273002,1]],"task_param":0}`|
|1072|`{"task_count":4000000,"tag_type":3,"task_type":2301,"award":[[291002,1]],"task_param":0}`|
|1073|`{"task_count":6000000,"tag_type":3,"task_type":2301,"award":[[273002,1]],"task_param":0}`|
|1074|`{"task_count":8000000,"tag_type":3,"task_type":2301,"award":[[291002,1]],"task_param":0}`|
|1075|`{"task_count":10000000,"tag_type":3,"task_type":2301,"award":[[297002,1]],"task_param":0}`|
|1076|`{"task_count":15000000,"tag_type":3,"task_type":2301,"award":[[279002,1]],"task_param":0}`|
|1077|`{"task_count":20000000,"tag_type":3,"task_type":2301,"award":[[297002,1]],"task_param":0}`|
|1078|`{"task_count":25000000,"tag_type":3,"task_type":2301,"award":[[279002,1]],"task_param":0}`|
|1079|`{"task_count":30000000,"tag_type":3,"task_type":2301,"award":[[297002,2]],"task_param":0}`|
|1080|`{"task_count":35000000,"tag_type":3,"task_type":2301,"award":[[279002,2]],"task_param":0}`|
|1081|`{"task_count":40000000,"tag_type":3,"task_type":2301,"award":[[297002,2]],"task_param":0}`|
|1082|`{"task_count":45000000,"tag_type":3,"task_type":2301,"award":[[279002,2]],"task_param":0}`|
|1083|`{"task_count":50000000,"tag_type":3,"task_type":2301,"award":[[297002,3],[279002,3]],"task_param":0}`|
|1084|`{"task_count":55000000,"tag_type":3,"task_type":2301,"award":[[297002,3],[279002,3]],"task_param":0}`|
|1085|`{"task_count":60000000,"tag_type":3,"task_type":2301,"award":[[297002,3],[279002,3]],"task_param":0}`|
|1086|`{"task_count":65000000,"tag_type":3,"task_type":2301,"award":[[297002,3],[279002,3]],"task_param":0}`|
|1087|`{"task_count":3000000,"tag_type":3,"task_type":2301,"award":[[274002,1]],"task_param":0}`|
|1088|`{"task_count":4000000,"tag_type":3,"task_type":2301,"award":[[292002,1]],"task_param":0}`|
|1089|`{"task_count":6000000,"tag_type":3,"task_type":2301,"award":[[274002,1]],"task_param":0}`|
|1090|`{"task_count":8000000,"tag_type":3,"task_type":2301,"award":[[292002,1]],"task_param":0}`|
|1091|`{"task_count":10000000,"tag_type":3,"task_type":2301,"award":[[298002,1]],"task_param":0}`|
|1092|`{"task_count":15000000,"tag_type":3,"task_type":2301,"award":[[280002,1]],"task_param":0}`|
|1093|`{"task_count":20000000,"tag_type":3,"task_type":2301,"award":[[298002,1]],"task_param":0}`|
|1094|`{"task_count":25000000,"tag_type":3,"task_type":2301,"award":[[280002,1]],"task_param":0}`|
|1095|`{"task_count":30000000,"tag_type":3,"task_type":2301,"award":[[298002,2]],"task_param":0}`|
|1096|`{"task_count":35000000,"tag_type":3,"task_type":2301,"award":[[280002,2]],"task_param":0}`|
|1097|`{"task_count":40000000,"tag_type":3,"task_type":2301,"award":[[298002,2]],"task_param":0}`|
|1098|`{"task_count":45000000,"tag_type":3,"task_type":2301,"award":[[280002,2]],"task_param":0}`|
|1099|`{"task_count":50000000,"tag_type":3,"task_type":2301,"award":[[298002,3],[280002,3]],"task_param":0}`|
|1100|`{"task_count":55000000,"tag_type":3,"task_type":2301,"award":[[298002,3],[280002,3]],"task_param":0}`|
|1101|`{"task_count":60000000,"tag_type":3,"task_type":2301,"award":[[298002,3],[280002,3]],"task_param":0}`|
|1102|`{"task_count":65000000,"tag_type":3,"task_type":2301,"award":[[298002,3],[280002,3]],"task_param":0}`|
|1103|`{"task_count":1010010,"tag_type":1,"task_type":12801,"award":[[326002,1],[181002,30000]],"task_param":0}`|
|1104|`{"task_count":1010025,"tag_type":1,"task_type":12801,"award":[[326002,1],[180002,30000]],"task_param":0}`|
|1105|`{"task_count":1010050,"tag_type":1,"task_type":12801,"award":[[326002,3],[325002,1]],"task_param":0}`|
|1106|`{"task_count":1010075,"tag_type":1,"task_type":12801,"award":[[326002,3],[293002,4]],"task_param":0}`|
|1107|`{"task_count":1010100,"tag_type":1,"task_type":12801,"award":[[326002,3],[325002,1]],"task_param":0}`|
|1108|`{"task_count":1010125,"tag_type":1,"task_type":12801,"award":[[326002,3],[275002,4]],"task_param":0}`|
|1109|`{"task_count":1010150,"tag_type":1,"task_type":12801,"award":[[326002,4],[325002,2]],"task_param":0}`|
|1110|`{"task_count":1010175,"tag_type":1,"task_type":12801,"award":[[326002,4],[275002,4]],"task_param":0}`|
|1111|`{"task_count":1010200,"tag_type":1,"task_type":12801,"award":[[326002,4],[325002,2]],"task_param":0}`|
|1112|`{"task_count":1010225,"tag_type":1,"task_type":12801,"award":[[326002,4],[293002,4]],"task_param":0}`|
|1113|`{"task_count":1010250,"tag_type":1,"task_type":12801,"award":[[326002,5],[325002,3]],"task_param":0}`|
|1114|`{"task_count":1010275,"tag_type":1,"task_type":12801,"award":[[326002,5],[293002,4]],"task_param":0}`|
|1115|`{"task_count":1010300,"tag_type":1,"task_type":12801,"award":[[326002,5],[325002,3]],"task_param":0}`|
|1116|`{"task_count":1020010,"tag_type":1,"task_type":12801,"award":[[326002,1],[181002,30000]],"task_param":0}`|
|1117|`{"task_count":1020025,"tag_type":1,"task_type":12801,"award":[[326002,1],[180002,30000]],"task_param":0}`|
|1118|`{"task_count":1020050,"tag_type":1,"task_type":12801,"award":[[326002,3],[325002,1]],"task_param":0}`|
|1119|`{"task_count":1020075,"tag_type":1,"task_type":12801,"award":[[326002,3],[294002,4]],"task_param":0}`|
|1120|`{"task_count":1020100,"tag_type":1,"task_type":12801,"award":[[326002,3],[325002,1]],"task_param":0}`|
|1121|`{"task_count":1020125,"tag_type":1,"task_type":12801,"award":[[326002,3],[276002,4]],"task_param":0}`|
|1122|`{"task_count":1020150,"tag_type":1,"task_type":12801,"award":[[326002,4],[325002,2]],"task_param":0}`|
|1123|`{"task_count":1020175,"tag_type":1,"task_type":12801,"award":[[326002,4],[276002,4]],"task_param":0}`|
|1124|`{"task_count":1020200,"tag_type":1,"task_type":12801,"award":[[326002,4],[325002,2]],"task_param":0}`|
|1125|`{"task_count":1020225,"tag_type":1,"task_type":12801,"award":[[326002,4],[294002,4]],"task_param":0}`|
|1126|`{"task_count":1020250,"tag_type":1,"task_type":12801,"award":[[326002,5],[325002,3]],"task_param":0}`|
|1127|`{"task_count":1020275,"tag_type":1,"task_type":12801,"award":[[326002,5],[294002,4]],"task_param":0}`|
|1128|`{"task_count":1020300,"tag_type":1,"task_type":12801,"award":[[326002,5],[325002,3]],"task_param":0}`|
|1129|`{"task_count":1030010,"tag_type":1,"task_type":12801,"award":[[326002,1],[181002,30000]],"task_param":0}`|
|1130|`{"task_count":1030050,"tag_type":1,"task_type":12801,"award":[[326002,3],[325002,1]],"task_param":0}`|
|1131|`{"task_count":1030100,"tag_type":1,"task_type":12801,"award":[[326002,3],[325002,1]],"task_param":0}`|
|1132|`{"task_count":1030150,"tag_type":1,"task_type":12801,"award":[[326002,4],[325002,2]],"task_param":0}`|
|1133|`{"task_count":1030200,"tag_type":1,"task_type":12801,"award":[[326002,4],[325002,2]],"task_param":0}`|
|1134|`{"task_count":1030250,"tag_type":1,"task_type":12801,"award":[[326002,5],[325002,3]],"task_param":0}`|
|1135|`{"task_count":1030300,"tag_type":1,"task_type":12801,"award":[[326002,5],[325002,3]],"task_param":0}`|
|1136|`{"task_count":1040010,"tag_type":1,"task_type":12801,"award":[[326002,1],[181002,30000]],"task_param":0}`|
|1137|`{"task_count":1040050,"tag_type":1,"task_type":12801,"award":[[326002,3],[325002,1]],"task_param":0}`|
|1138|`{"task_count":1040100,"tag_type":1,"task_type":12801,"award":[[326002,3],[325002,1]],"task_param":0}`|
|1139|`{"task_count":1040150,"tag_type":1,"task_type":12801,"award":[[326002,4],[325002,2]],"task_param":0}`|
|1140|`{"task_count":1040200,"tag_type":1,"task_type":12801,"award":[[326002,4],[325002,2]],"task_param":0}`|
|1141|`{"task_count":1040250,"tag_type":1,"task_type":12801,"award":[[326002,5],[325002,3]],"task_param":0}`|
|1142|`{"task_count":1040300,"tag_type":1,"task_type":12801,"award":[[326002,5],[325002,3]],"task_param":0}`|
|1143|`{"task_count":1050010,"tag_type":1,"task_type":12801,"award":[[326002,1],[181002,30000]],"task_param":0}`|
|1144|`{"task_count":1050050,"tag_type":1,"task_type":12801,"award":[[326002,3],[325002,1]],"task_param":0}`|
|1145|`{"task_count":1050100,"tag_type":1,"task_type":12801,"award":[[326002,3],[325002,1]],"task_param":0}`|
|1146|`{"task_count":1050150,"tag_type":1,"task_type":12801,"award":[[326002,4],[325002,2]],"task_param":0}`|
|1147|`{"task_count":1050200,"tag_type":1,"task_type":12801,"award":[[326002,4],[325002,2]],"task_param":0}`|
|1148|`{"task_count":1050250,"tag_type":1,"task_type":12801,"award":[[326002,5],[325002,3]],"task_param":0}`|
|1149|`{"task_count":1050300,"tag_type":1,"task_type":12801,"award":[[326002,5],[325002,3]],"task_param":0}`|
|1150|`{"task_count":1060010,"tag_type":1,"task_type":12801,"award":[[326002,1],[181002,30000]],"task_param":0}`|
|1151|`{"task_count":1060050,"tag_type":1,"task_type":12801,"award":[[326002,3],[325002,1]],"task_param":0}`|
|1152|`{"task_count":1060100,"tag_type":1,"task_type":12801,"award":[[326002,3],[325002,1]],"task_param":0}`|
|1153|`{"task_count":1060150,"tag_type":1,"task_type":12801,"award":[[326002,4],[325002,2]],"task_param":0}`|
|1154|`{"task_count":1060200,"tag_type":1,"task_type":12801,"award":[[326002,4],[325002,2]],"task_param":0}`|
|1155|`{"task_count":1060250,"tag_type":1,"task_type":12801,"award":[[326002,5],[325002,3]],"task_param":0}`|
|1156|`{"task_count":1060300,"tag_type":1,"task_type":12801,"award":[[326002,5],[325002,3]],"task_param":0}`|
|1157|`{"task_count":5,"tag_type":2,"task_type":12805,"award":[[305002,1],[326002,2]],"task_param":101}`|
|1158|`{"task_count":10,"tag_type":2,"task_type":12805,"award":[[305002,1],[324002,500]],"task_param":101}`|
|1159|`{"task_count":15,"tag_type":2,"task_type":12805,"award":[[305002,2],[326002,2]],"task_param":101}`|
|1160|`{"task_count":25,"tag_type":2,"task_type":12805,"award":[[305002,2],[324002,500]],"task_param":101}`|
|1161|`{"task_count":35,"tag_type":2,"task_type":12805,"award":[[305002,3],[326002,2]],"task_param":101}`|
|1162|`{"task_count":45,"tag_type":2,"task_type":12805,"award":[[306002,3],[324002,500]],"task_param":101}`|
|1163|`{"task_count":10,"tag_type":2,"task_type":12805,"award":[[306002,3],[326002,2]],"task_param":102}`|
|1164|`{"task_count":20,"tag_type":2,"task_type":12805,"award":[[306002,3],[324002,500]],"task_param":102}`|
|1165|`{"task_count":30,"tag_type":2,"task_type":12805,"award":[[306002,3],[326002,2]],"task_param":102}`|
|1166|`{"task_count":45,"tag_type":2,"task_type":12805,"award":[[307002,3],[324002,500]],"task_param":102}`|
|1167|`{"task_count":10,"tag_type":2,"task_type":12805,"award":[[307002,3],[326002,2]],"task_param":103}`|
|1168|`{"task_count":20,"tag_type":2,"task_type":12805,"award":[[307002,3],[324002,500]],"task_param":103}`|
|1169|`{"task_count":30,"tag_type":2,"task_type":12805,"award":[[308002,3],[326002,2]],"task_param":103}`|
|1170|`{"task_count":45,"tag_type":2,"task_type":12805,"award":[[308002,3]],"task_param":103}`|
|1171|`{"task_count":10,"tag_type":2,"task_type":12805,"award":[[309002,3],[324002,500]],"task_param":104}`|
|1172|`{"task_count":20,"tag_type":2,"task_type":12805,"award":[[309002,3],[326002,2]],"task_param":104}`|
|1173|`{"task_count":30,"tag_type":2,"task_type":12805,"award":[[310002,3],[324002,500]],"task_param":104}`|
|1174|`{"task_count":45,"tag_type":2,"task_type":12805,"award":[[310002,3]],"task_param":104}`|
|1175|`{"task_count":10,"tag_type":2,"task_type":12805,"award":[[326002,2],[324002,500]],"task_param":105}`|
|1176|`{"task_count":20,"tag_type":2,"task_type":12805,"award":[[326002,3],[324002,500]],"task_param":105}`|
|1177|`{"task_count":30,"tag_type":2,"task_type":12805,"award":[[325002,1],[324002,500]],"task_param":105}`|
|1178|`{"task_count":45,"tag_type":2,"task_type":12805,"award":[[325002,1],[324002,500]],"task_param":105}`|
|1179|`{"task_count":10,"tag_type":2,"task_type":12805,"award":[[326002,2],[324002,1000]],"task_param":106}`|
|1180|`{"task_count":20,"tag_type":2,"task_type":12805,"award":[[326002,3],[324002,1000]],"task_param":106}`|
|1181|`{"task_count":30,"tag_type":2,"task_type":12805,"award":[[325002,2],[326002,5]],"task_param":106}`|
|1182|`{"task_count":45,"tag_type":2,"task_type":12805,"award":[[325002,2],[326002,5]],"task_param":106}`|

## MissionMark

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1020300|`{}`|
|1030300|`{}`|
|1060300|`{}`|

## TaskType

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

## Mission

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|award|array|1800|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|elite_mission|number|1800|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|loc|array|1800|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hook|number|1800|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1800|本表行键；与其他表同值不自动代表同一对象。|
|fight_tid|number|1800|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|chapter|number|1800|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skill|number|1800|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|spirit_value|number|1800|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr|array|1800|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部1800行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1010001|`{"award":[[5101900,50],[180002,2010],[181002,2010],[324002,100]],"loc":[2],"fight_tid":8800001,"skill":0,"spirit_value":10,"attr":[[6,2000]]}`|
|1010002|`{"award":[[5101900,50],[180002,2020],[181002,2020],[324002,25]],"loc":[1],"fight_tid":8800002,"skill":260010101,"spirit_value":10,"attr":[]}`|
|1010003|`{"award":[[5101900,50],[180002,2030],[181002,2030],[324002,25]],"loc":[1],"fight_tid":8800003,"skill":0,"spirit_value":10,"attr":[[57,2500]]}`|

## MissionFadeType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|24|本表行键；与其他表同值不自动代表同一对象。|
|attr|array|24|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"attr":[[54,500],[55,500],[2,500],[76,500],[1,500]]}`|
|2|`{"attr":[[54,1000],[55,1000],[2,1000],[76,1000],[1,1000]]}`|
|3|`{"attr":[[54,1500],[55,1500],[2,2000],[76,2000],[1,2000]]}`|
|4|`{"attr":[[54,2500],[55,2500],[2,3000],[76,3000],[1,3000]]}`|
|5|`{"attr":[[54,3500],[55,3500],[2,4000],[76,4000],[1,4000]]}`|
|6|`{"attr":[[54,4000],[55,4000],[2,4500],[76,4500],[1,4500]]}`|
|7|`{"attr":[[54,5000],[55,5000],[2,5000],[76,5000],[1,5000]]}`|
|8|`{"attr":[[54,6000],[55,6000],[2,5500],[76,5500],[1,5500]]}`|
|9|`{"attr":[[54,500],[55,500],[2,500],[76,500],[1,500]]}`|
|10|`{"attr":[[54,1000],[55,1000],[2,1000],[76,1000],[1,1000]]}`|
|11|`{"attr":[[54,1500],[55,1500],[2,1500],[76,1500],[1,1500]]}`|
|12|`{"attr":[[54,2000],[55,2000],[2,2500],[76,2500],[1,2500]]}`|
|13|`{"attr":[[54,3000],[55,3000],[2,3500],[76,3500],[1,3500]]}`|
|14|`{"attr":[[54,3500],[55,3500],[2,4000],[76,4000],[1,4000]]}`|
|15|`{"attr":[[54,4000],[55,4000],[2,4500],[76,4500],[1,4500]]}`|
|16|`{"attr":[[54,5000],[55,5000],[2,5000],[76,5000],[1,5000]]}`|
|17|`{"attr":[[54,500],[55,500],[2,300],[76,300],[1,300]]}`|
|18|`{"attr":[[54,1000],[55,1000],[2,500],[76,500],[1,500]]}`|
|19|`{"attr":[[54,1500],[55,1500],[2,1000],[76,1000],[1,1000]]}`|
|20|`{"attr":[[54,2000],[55,2000],[2,2000],[76,2000],[1,2000]]}`|
|21|`{"attr":[[54,2500],[55,2500],[2,3000],[76,3000],[1,3000]]}`|
|22|`{"attr":[[54,3000],[55,3000],[2,3500],[76,3500],[1,3500]]}`|
|23|`{"attr":[[54,3500],[55,3500],[2,4000],[76,4000],[1,4000]]}`|
|24|`{"attr":[[54,4000],[55,4000],[2,4000],[76,4000],[1,4000]]}`|

## MissionFade

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|season|number|28|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|28|本表行键；与其他表同值不自动代表同一对象。|
|fade|array|28|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1010050|`{}`|
|1010100|`{}`|
|1010150|`{}`|
|1010200|`{}`|
|1010250|`{}`|
|1010300|`{}`|
|1020050|`{}`|
|1020100|`{}`|
|1020150|`{}`|
|1020200|`{}`|
|1020250|`{}`|
|1020300|`{}`|
|1030050|`{}`|
|1030100|`{}`|
|1030200|`{}`|
|1030300|`{}`|
|1040050|`{}`|
|1040100|`{}`|
|1040200|`{}`|
|1040300|`{}`|
|1050050|`{}`|
|1050100|`{}`|
|1050200|`{}`|
|1050300|`{}`|
|1060050|`{}`|
|1060100|`{}`|
|1060200|`{}`|
|1060300|`{}`|

## TenRetry

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|season|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fail_count|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1010060|`{"fail_count":3}`|
|1010300|`{"fail_count":2}`|
|1060300|`{"fail_count":1}`|

## Const

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|need_num|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|number|1|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|mission|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"need_num":5,"award":326002}`|

## MissionDropAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|season|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|show_award|number|4|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|2200001|`{"show_award":1381000}`|
|2200040|`{"show_award":1351000}`|
|2200130|`{"show_award":1361000}`|
|2200200|`{"show_award":1371000}`|

## Chapter

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|icon|string|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|season|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|show_name|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|des|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|unlock_hour|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|unlock_day|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|scene|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skill|array|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|task_days|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attr|array|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"unlock_hour":8,"unlock_day":1,"skill":[260000101],"task_days":7,"attr":[[57,1500]]}`|
|102|`{"unlock_hour":8,"unlock_day":8,"skill":[260000102],"task_days":7,"attr":[[11,3000]]}`|
|103|`{"unlock_hour":8,"unlock_day":15,"skill":[260000103],"task_days":7,"attr":[[59,5000]]}`|
|104|`{"unlock_hour":8,"unlock_day":22,"skill":[260000104],"task_days":7,"attr":[[66,5000],[63,1000]]}`|
|105|`{"unlock_hour":8,"unlock_day":29,"skill":[260000105],"task_days":7,"attr":[[54,2500]]}`|
|106|`{"unlock_hour":8,"unlock_day":36,"skill":[260000107],"task_days":7,"attr":[[55,2500]]}`|

## EliteMission

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|chapter|number|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|star_rule|array|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_id|array|90|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|season|number|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|90|本表行键；与其他表同值不自动代表同一对象。|
|star_rule_args|array|90|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award_num|array|90|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10001|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10002|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10003|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10004|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10005|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10006|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10007|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10008|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10009|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10010|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10011|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10012|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10013|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10014|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10015|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10016|`{"star_rule":[106,107,105],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,2],[30]],"award_num":[100,250,500]}`|
|10017|`{"star_rule":[106,108,105],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,4],[30]],"award_num":[100,250,500]}`|
|10018|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10019|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10020|`{"star_rule":[106,107,105],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,1],[30]],"award_num":[100,250,500]}`|
|10021|`{"star_rule":[106,108,105],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,1],[30]],"award_num":[100,250,500]}`|
|10022|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10023|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10024|`{"star_rule":[106,107,105],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,3],[30]],"award_num":[100,250,500]}`|
|10025|`{"star_rule":[106,108,105],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,2],[30]],"award_num":[100,250,500]}`|
|10026|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10027|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10028|`{"star_rule":[106,107,105],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,4],[30]],"award_num":[100,250,500]}`|
|10029|`{"star_rule":[106,108,105],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,3],[30]],"award_num":[100,250,500]}`|
|10030|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10031|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10032|`{"star_rule":[106,107,105],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,2],[30]],"award_num":[100,250,500]}`|
|10033|`{"star_rule":[106,108,105],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,4],[30]],"award_num":[100,250,500]}`|
|10034|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10035|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10036|`{"star_rule":[106,107,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,1],[1]],"award_num":[100,250,500]}`|
|10037|`{"star_rule":[106,108,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,1],[1]],"award_num":[100,250,500]}`|
|10038|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10039|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10040|`{"star_rule":[106,107,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,3],[1]],"award_num":[100,250,500]}`|
|10041|`{"star_rule":[106,108,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,2],[1]],"award_num":[100,250,500]}`|
|10042|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10043|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10044|`{"star_rule":[106,107,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,4],[1]],"award_num":[100,250,500]}`|
|10045|`{"star_rule":[106,108,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,3],[1]],"award_num":[100,250,500]}`|
|10046|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10047|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10048|`{"star_rule":[106,107,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,2],[1]],"award_num":[100,250,500]}`|
|10049|`{"star_rule":[106,108,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,4],[1]],"award_num":[100,250,500]}`|
|10050|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10051|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10052|`{"star_rule":[106,107,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,1],[1]],"award_num":[100,250,500]}`|
|10053|`{"star_rule":[106,108,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,1],[1]],"award_num":[100,250,500]}`|
|10054|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10055|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10056|`{"star_rule":[106,107,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,3],[1]],"award_num":[100,250,500]}`|
|10057|`{"star_rule":[106,108,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,2],[1]],"award_num":[100,250,500]}`|
|10058|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10059|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10060|`{"star_rule":[106,107,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,4],[1]],"award_num":[100,250,500]}`|
|10061|`{"star_rule":[106,108,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,3],[1]],"award_num":[100,250,500]}`|
|10062|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10063|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10064|`{"star_rule":[106,107,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,2],[1]],"award_num":[100,250,500]}`|
|10065|`{"star_rule":[106,108,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,4],[1]],"award_num":[100,250,500]}`|
|10066|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10067|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10068|`{"star_rule":[106,107,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,1],[1]],"award_num":[100,250,500]}`|
|10069|`{"star_rule":[106,108,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,1],[1]],"award_num":[100,250,500]}`|
|10070|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10071|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10072|`{"star_rule":[106,107,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,3],[1]],"award_num":[100,250,500]}`|
|10073|`{"star_rule":[106,108,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,2],[1]],"award_num":[100,250,500]}`|
|10074|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10075|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10076|`{"star_rule":[106,107,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,4],[1]],"award_num":[100,250,500]}`|
|10077|`{"star_rule":[106,108,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,3],[1]],"award_num":[100,250,500]}`|
|10078|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10079|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10080|`{"star_rule":[106,107,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,2],[1]],"award_num":[100,250,500]}`|
|10081|`{"star_rule":[106,108,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,4],[1]],"award_num":[100,250,500]}`|
|10082|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10083|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10084|`{"star_rule":[106,107,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,1],[1]],"award_num":[100,250,500]}`|
|10085|`{"star_rule":[106,108,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,1],[1]],"award_num":[100,250,500]}`|
|10086|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10087|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|
|10088|`{"star_rule":[106,107,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,3],[1]],"award_num":[100,250,500]}`|
|10089|`{"star_rule":[106,108,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[1,2],[1]],"award_num":[100,250,500]}`|
|10090|`{"star_rule":[106,105,102],"award_id":[101500,5101900,324002],"star_rule_args":[[6],[30],[1]],"award_num":[100,250,500]}`|

## MissionNode

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|season|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rank_type|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1010300|`{"rank_type":1}`|
|1020300|`{"rank_type":1}`|
|1030300|`{"rank_type":1}`|
|1040300|`{"rank_type":1}`|
|1050300|`{"rank_type":1}`|
|1060300|`{"rank_type":1}`|

## MissionNodeRank

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|16|本表行键；与其他表同值不自动代表同一对象。|
|rank_type|number|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|16|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|rank_range|array|16|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"rank_type":1,"award":[[151310311,40],[101500,200]],"rank_range":[1,1]}`|
|2|`{"rank_type":1,"award":[[151310311,40],[101500,180]],"rank_range":[2,3]}`|
|3|`{"rank_type":1,"award":[[151310311,35],[101500,160]],"rank_range":[4,10]}`|
|4|`{"rank_type":1,"award":[[151310311,30],[101500,140]],"rank_range":[11,20]}`|
|5|`{"rank_type":1,"award":[[151310311,25],[101500,120]],"rank_range":[21,50]}`|
|6|`{"rank_type":1,"award":[[151310311,25],[101500,100]],"rank_range":[51,100]}`|
|7|`{"rank_type":1,"award":[[151310311,20],[101500,95]],"rank_range":[101,150]}`|
|8|`{"rank_type":1,"award":[[151310311,20],[101500,90]],"rank_range":[151,200]}`|
|9|`{"rank_type":1,"award":[[151310311,20],[101500,85]],"rank_range":[201,300]}`|
|10|`{"rank_type":1,"award":[[151310311,15],[101500,80]],"rank_range":[301,400]}`|
|11|`{"rank_type":1,"award":[[151310311,15],[101500,75]],"rank_range":[401,500]}`|
|12|`{"rank_type":1,"award":[[151310311,15],[101500,70]],"rank_range":[501,600]}`|
|13|`{"rank_type":1,"award":[[151310311,15],[101500,65]],"rank_range":[601,700]}`|
|14|`{"rank_type":1,"award":[[151310311,15],[101500,60]],"rank_range":[701,800]}`|
|15|`{"rank_type":1,"award":[[151310311,15],[101500,55]],"rank_range":[801,900]}`|
|16|`{"rank_type":1,"award":[[151310311,15],[101500,50]],"rank_range":[901,1000]}`|

## Scene

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|12|本表行键；与其他表同值不自动代表同一对象。|
|name|string|12|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{}`|
|102|`{}`|
|103|`{}`|
|104|`{}`|
|105|`{}`|
|106|`{}`|
|201|`{}`|
|202|`{}`|
|203|`{}`|
|204|`{}`|
|205|`{}`|
|206|`{}`|

## CountryParam

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|camp_attr_power_rate|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|season_collect_award|number|1|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|
|main_develop_name|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sub_num|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|sub_attr_multi|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"camp_attr_power_rate":2500,"season_collect_award":182002,"sub_num":4,"sub_attr_multi":1}`|

## Sword

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|day_max|number|1|原门槛/范围字段；边界包含关系、0与缺省含义以对应消费者为准。|
|award|array|1|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|day_times|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|exp|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"day_max":200000,"award":[[300002,1]],"day_times":3,"exp":200}`|

## Attr

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|sub_level|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|collect|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|star|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|sub_attr_group|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|swrod_group|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|main_attr_group|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"sub_level":1,"star":1,"sub_attr_group":1,"swrod_group":1,"main_attr_group":1}`|

## SwordType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|

## AttrItem

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|sword_exp|number|80|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cost_num|number|80|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|cost_id|number|80|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|camp|number|80|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|80|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|183002|`{"sword_exp":5,"cost_num":25000,"cost_id":181002}`|
|184002|`{"sword_exp":5,"cost_num":25000,"cost_id":181002}`|
|185002|`{"sword_exp":5,"cost_num":25000,"cost_id":181002}`|
|186002|`{"sword_exp":5,"cost_num":25000,"cost_id":181002}`|
|187002|`{"sword_exp":50,"cost_num":100000,"cost_id":181002}`|
|188002|`{"sword_exp":50,"cost_num":100000,"cost_id":181002}`|
|189002|`{"sword_exp":50,"cost_num":100000,"cost_id":181002}`|
|190002|`{"sword_exp":50,"cost_num":100000,"cost_id":181002}`|
|191002|`{"sword_exp":100,"cost_num":180000,"cost_id":181002}`|
|192002|`{"sword_exp":100,"cost_num":180000,"cost_id":181002}`|
|193002|`{"sword_exp":100,"cost_num":180000,"cost_id":181002}`|
|194002|`{"sword_exp":100,"cost_num":180000,"cost_id":181002}`|
|195002|`{"sword_exp":150,"cost_num":250000,"cost_id":181002}`|
|196002|`{"sword_exp":150,"cost_num":250000,"cost_id":181002}`|
|197002|`{"sword_exp":150,"cost_num":250000,"cost_id":181002}`|
|198002|`{"sword_exp":150,"cost_num":250000,"cost_id":181002}`|
|199002|`{"sword_exp":600,"cost_num":500000,"cost_id":181002}`|
|200002|`{"sword_exp":600,"cost_num":500000,"cost_id":181002}`|
|201002|`{"sword_exp":600,"cost_num":500000,"cost_id":181002}`|
|202002|`{"sword_exp":600,"cost_num":500000,"cost_id":181002}`|
|203002|`{"sword_exp":5,"cost_num":25000,"cost_id":181002}`|
|204002|`{"sword_exp":5,"cost_num":25000,"cost_id":181002}`|
|205002|`{"sword_exp":5,"cost_num":25000,"cost_id":181002}`|
|206002|`{"sword_exp":5,"cost_num":25000,"cost_id":181002}`|
|207002|`{"sword_exp":50,"cost_num":100000,"cost_id":181002}`|
|208002|`{"sword_exp":50,"cost_num":100000,"cost_id":181002}`|
|209002|`{"sword_exp":50,"cost_num":100000,"cost_id":181002}`|
|210002|`{"sword_exp":50,"cost_num":100000,"cost_id":181002}`|
|211002|`{"sword_exp":100,"cost_num":180000,"cost_id":181002}`|
|212002|`{"sword_exp":100,"cost_num":180000,"cost_id":181002}`|
|213002|`{"sword_exp":100,"cost_num":180000,"cost_id":181002}`|
|214002|`{"sword_exp":100,"cost_num":180000,"cost_id":181002}`|
|215002|`{"sword_exp":150,"cost_num":250000,"cost_id":181002}`|
|216002|`{"sword_exp":150,"cost_num":250000,"cost_id":181002}`|
|217002|`{"sword_exp":150,"cost_num":250000,"cost_id":181002}`|
|218002|`{"sword_exp":150,"cost_num":250000,"cost_id":181002}`|
|219002|`{"sword_exp":600,"cost_num":500000,"cost_id":181002}`|
|220002|`{"sword_exp":600,"cost_num":500000,"cost_id":181002}`|
|221002|`{"sword_exp":600,"cost_num":500000,"cost_id":181002}`|
|222002|`{"sword_exp":600,"cost_num":500000,"cost_id":181002}`|
|223002|`{"sword_exp":5,"cost_num":25000,"cost_id":181002}`|
|224002|`{"sword_exp":5,"cost_num":25000,"cost_id":181002}`|
|225002|`{"sword_exp":5,"cost_num":25000,"cost_id":181002}`|
|226002|`{"sword_exp":5,"cost_num":25000,"cost_id":181002}`|
|227002|`{"sword_exp":50,"cost_num":100000,"cost_id":181002}`|
|228002|`{"sword_exp":50,"cost_num":100000,"cost_id":181002}`|
|229002|`{"sword_exp":50,"cost_num":100000,"cost_id":181002}`|
|230002|`{"sword_exp":50,"cost_num":100000,"cost_id":181002}`|
|231002|`{"sword_exp":100,"cost_num":180000,"cost_id":181002}`|
|232002|`{"sword_exp":100,"cost_num":180000,"cost_id":181002}`|
|233002|`{"sword_exp":100,"cost_num":180000,"cost_id":181002}`|
|234002|`{"sword_exp":100,"cost_num":180000,"cost_id":181002}`|
|235002|`{"sword_exp":150,"cost_num":250000,"cost_id":181002}`|
|236002|`{"sword_exp":150,"cost_num":250000,"cost_id":181002}`|
|237002|`{"sword_exp":150,"cost_num":250000,"cost_id":181002}`|
|238002|`{"sword_exp":150,"cost_num":250000,"cost_id":181002}`|
|239002|`{"sword_exp":600,"cost_num":500000,"cost_id":181002}`|
|240002|`{"sword_exp":600,"cost_num":500000,"cost_id":181002}`|
|241002|`{"sword_exp":600,"cost_num":500000,"cost_id":181002}`|
|242002|`{"sword_exp":600,"cost_num":500000,"cost_id":181002}`|
|243002|`{"sword_exp":5,"cost_num":25000,"cost_id":181002}`|
|244002|`{"sword_exp":5,"cost_num":25000,"cost_id":181002}`|
|245002|`{"sword_exp":5,"cost_num":25000,"cost_id":181002}`|
|246002|`{"sword_exp":5,"cost_num":25000,"cost_id":181002}`|
|247002|`{"sword_exp":50,"cost_num":100000,"cost_id":181002}`|
|248002|`{"sword_exp":50,"cost_num":100000,"cost_id":181002}`|
|249002|`{"sword_exp":50,"cost_num":100000,"cost_id":181002}`|
|250002|`{"sword_exp":50,"cost_num":100000,"cost_id":181002}`|
|251002|`{"sword_exp":100,"cost_num":180000,"cost_id":181002}`|
|252002|`{"sword_exp":100,"cost_num":180000,"cost_id":181002}`|
|253002|`{"sword_exp":100,"cost_num":180000,"cost_id":181002}`|
|254002|`{"sword_exp":100,"cost_num":180000,"cost_id":181002}`|
|255002|`{"sword_exp":150,"cost_num":250000,"cost_id":181002}`|
|256002|`{"sword_exp":150,"cost_num":250000,"cost_id":181002}`|
|257002|`{"sword_exp":150,"cost_num":250000,"cost_id":181002}`|
|258002|`{"sword_exp":150,"cost_num":250000,"cost_id":181002}`|
|259002|`{"sword_exp":600,"cost_num":500000,"cost_id":181002}`|
|260002|`{"sword_exp":600,"cost_num":500000,"cost_id":181002}`|
|261002|`{"sword_exp":600,"cost_num":500000,"cost_id":181002}`|
|262002|`{"sword_exp":600,"cost_num":500000,"cost_id":181002}`|

## NormalCollect

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|20|本表行键；与其他表同值不自动代表同一对象。|
|exp|number|20|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10300|`{"exp":5}`|
|10301|`{"exp":5}`|
|10302|`{"exp":5}`|
|10303|`{"exp":5}`|
|10400|`{"exp":10}`|
|10401|`{"exp":10}`|
|10402|`{"exp":10}`|
|10403|`{"exp":10}`|
|10404|`{"exp":10}`|
|10500|`{"exp":20}`|
|10501|`{"exp":20}`|
|10502|`{"exp":20}`|
|10503|`{"exp":20}`|
|10504|`{"exp":20}`|
|10505|`{"exp":20}`|
|10506|`{"exp":20}`|
|10507|`{"exp":20}`|
|10508|`{"exp":20}`|
|10509|`{"exp":20}`|
|10510|`{"exp":20}`|

## CountrySubType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|attr_info|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|name|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|img_camp|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|img_icon|string|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"attr_info":804908}`|
|2|`{"attr_info":804909}`|
|3|`{"attr_info":804911}`|
|4|`{"attr_info":804910}`|

## SeasonCollect

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|season|number|57|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|57|本表行键；与其他表同值不自动代表同一对象。|
|item|number|57|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"item":101310111}`|
|2|`{"item":101310211}`|
|3|`{"item":101310311}`|
|4|`{"item":101320111}`|
|5|`{"item":101320211}`|
|6|`{"item":101210111}`|
|7|`{"item":101210211}`|
|8|`{"item":101210311}`|
|9|`{"item":101220111}`|
|10|`{"item":101220211}`|
|11|`{"item":101220311}`|
|12|`{"item":101110111}`|
|13|`{"item":101110211}`|
|14|`{"item":101110311}`|
|15|`{"item":101110411}`|
|16|`{"item":101120111}`|
|17|`{"item":101120211}`|
|18|`{"item":101120311}`|
|19|`{"item":101120411}`|
|20|`{"item":102310111}`|
|21|`{"item":102310211}`|
|22|`{"item":102310311}`|
|23|`{"item":102320111}`|
|24|`{"item":102320211}`|
|25|`{"item":102210111}`|
|26|`{"item":102210211}`|
|27|`{"item":102210311}`|
|28|`{"item":102220111}`|
|29|`{"item":102220211}`|
|30|`{"item":102220311}`|
|31|`{"item":102110111}`|
|32|`{"item":102110211}`|
|33|`{"item":102110311}`|
|34|`{"item":102110411}`|
|35|`{"item":102120111}`|
|36|`{"item":102120211}`|
|37|`{"item":102120311}`|
|38|`{"item":102120411}`|
|39|`{"item":103310111}`|
|40|`{"item":103310211}`|
|41|`{"item":103310311}`|
|42|`{"item":103320111}`|
|43|`{"item":103320211}`|
|44|`{"item":103210111}`|
|45|`{"item":103210211}`|
|46|`{"item":103210311}`|
|47|`{"item":103220111}`|
|48|`{"item":103220211}`|
|49|`{"item":103220311}`|
|50|`{"item":103110111}`|
|51|`{"item":103110211}`|
|52|`{"item":103110311}`|
|53|`{"item":103110411}`|
|54|`{"item":103120111}`|
|55|`{"item":103120211}`|
|56|`{"item":103120311}`|
|57|`{"item":103120411}`|

## SeasonCollectAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|20|本表行键；与其他表同值不自动代表同一对象。|
|award_num|number|20|奖励相关原字段；具体是固定奖励、库引用或展示项不能仅凭名称确定。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10300|`{"award_num":5}`|
|10301|`{"award_num":5}`|
|10302|`{"award_num":5}`|
|10303|`{"award_num":5}`|
|10400|`{"award_num":10}`|
|10401|`{"award_num":10}`|
|10402|`{"award_num":10}`|
|10403|`{"award_num":10}`|
|10404|`{"award_num":10}`|
|10500|`{"award_num":20}`|
|10501|`{"award_num":20}`|
|10502|`{"award_num":20}`|
|10503|`{"award_num":20}`|
|10504|`{"award_num":20}`|
|10505|`{"award_num":20}`|
|10506|`{"award_num":20}`|
|10507|`{"award_num":20}`|
|10508|`{"award_num":20}`|
|10509|`{"award_num":20}`|
|10510|`{"award_num":20}`|

## TalkContent

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|talk_time|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|next|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|image_state|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bubble_content|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|bubble_type|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"talk_time":0.5,"next":2}`|
|2|`{"talk_time":0.5,"next":3}`|
|3|`{"talk_time":0.5,"next":0}`|

## Open

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|start_day|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|duration_days|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|entrance_time|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|mission_ani|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|open_talk|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|ahead_day|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"start_day":30,"duration_days":55,"entrance_time":3,"open_talk":1953,"ahead_day":2}`|

## RankBubble

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|5|本表行键；与其他表同值不自动代表同一对象。|
|des|number|5|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|5|`{}`|
|20|`{}`|
|50|`{}`|
|100|`{}`|

## StateImage

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|image_right|string|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|image_left|string|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|role_name|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|

## MagicalJourneyeMbryoBobble

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|des|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|0|`{}`|
|50|`{}`|
|150|`{}`|
|300|`{}`|

## MissionBobble

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|4|本表行键；与其他表同值不自动代表同一对象。|
|des|number|4|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|0|`{}`|
|50|`{}`|
|150|`{}`|
|300|`{}`|

## MissionRank

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|15|本表行键；与其他表同值不自动代表同一对象。|
|award|array|15|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|type|number|15|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|args|number|15|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|version|number|15|版本引用；必须按活动类型及其消费者查对应版本表。|
|title_desc|number|15|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"award":[[327002,30],[101500,12000]],"type":0,"version":1}`|
|102|`{"award":[[327002,25],[101500,10000]],"type":0,"version":1}`|
|103|`{"award":[[327002,23],[101500,9500]],"type":0,"version":1}`|
|104|`{"award":[[327002,20],[101500,9000]],"type":0,"version":1}`|
|105|`{"award":[[327002,18],[101500,9000]],"type":1,"version":1}`|
|106|`{"award":[[327002,16],[101500,8000]],"type":1,"version":1}`|
|107|`{"award":[[327002,14],[101500,7000]],"type":1,"version":1}`|
|108|`{"award":[[327002,12],[101500,6000]],"type":1,"version":1}`|
|109|`{"award":[[327002,10],[101500,5000]],"type":2,"version":1}`|
|110|`{"award":[[327002,8],[101500,3000]],"type":2,"version":1}`|
|111|`{"award":[[327002,6],[101500,2500]],"type":2,"version":1}`|
|112|`{"award":[[327002,5],[101500,2000]],"type":2,"version":1}`|
|113|`{"award":[[327002,4],[101500,1500]],"type":2,"version":1}`|
|114|`{"award":[[327002,3],[101500,1000]],"type":2,"version":1}`|
|115|`{"award":[[327002,2],[101500,800]],"type":2,"version":1}`|

## AttrGroup

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|attr|array|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|生命|number|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|—|`{"attr":[6,5,13,26,27,72,73,1,2,25,24]}`|
|—|`{"attr":[601,602,603,604,605,606,607,608]}`|
|—|`{"attr":[609,610,611,612,613,614,615,616]}`|
|—|`{"attr":[617,618,619,620,621,622,623,624]}`|
|—|`{"attr":[625,626,627,628,629,630,631,632]}`|
|—|`{"attr":[1,2,25,24]}`|
|—|`{"attr":[1,2,76,60,66,22,11,63,54]}`|
|—|`{"attr":[1,2,24,25,5,6,26,27,54,55]}`|
|—|`{"attr":[1,2,25,24]}`|

## AttrType

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|basicsAttr|number|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|camp|number|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|factionsAttr|array|9|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|9|本表行键；与其他表同值不自动代表同一对象。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"basicsAttr":6,"factionsAttr":[]}`|
|2|`{"basicsAttr":1,"factionsAttr":[1]}`|
|3|`{"basicsAttr":1,"factionsAttr":[1]}`|
|4|`{"basicsAttr":1,"factionsAttr":[1]}`|
|5|`{"basicsAttr":1,"factionsAttr":[1]}`|
|6|`{"basicsAttr":1,"factionsAttr":[1,1,1,1]}`|
|7|`{"basicsAttr":8,"factionsAttr":[]}`|
|8|`{"basicsAttr":9,"factionsAttr":[]}`|
|9|`{"basicsAttr":7,"factionsAttr":[]}`|

## Country

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|cost|array|400|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|tid|number|400|本表行键；与其他表同值不自动代表同一对象。|
|attrs|array|400|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

下列3行用于说明结构；全部400行见本页完整JSON，不将样例当完整数值表。样例列出规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10001|`{"cost":[],"attrs":[[1,5400],[2,900],[24,540],[25,540]]}`|
|10002|`{"cost":[[180002,2000]],"attrs":[[1,10800],[2,1800],[24,1080],[25,1080]]}`|
|10003|`{"cost":[[180002,4000]],"attrs":[[1,16200],[2,2700],[24,1620],[25,1620]]}`|

## CountrySub

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|cost|array|240|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|tid|number|240|本表行键；与其他表同值不自动代表同一对象。|
|attrs|array|240|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1110001|`{"cost":[[183002,1]],"attrs":[[2,6000],[25,1800],[6,1000],[73,0],[13,1500]]}`|
|1110002|`{"cost":[[187002,1]],"attrs":[[2,12000],[25,3600],[6,2500],[73,0],[13,3500]]}`|
|1110003|`{"cost":[[191002,1]],"attrs":[[2,24000],[25,7200],[6,4500],[73,0],[13,6000]]}`|
|1110004|`{"cost":[[195002,1]],"attrs":[[2,42000],[25,12600],[6,7000],[73,0],[13,9000]]}`|
|1110005|`{"cost":[[199002,1]],"attrs":[[2,60000],[25,18000],[6,7000],[73,3000],[13,12000]]}`|
|1110006|`{"cost":[[199002,1]],"attrs":[[2,90000],[25,27000],[6,7000],[73,6000],[13,15000]]}`|
|1110007|`{"cost":[[199002,1]],"attrs":[[2,120000],[25,36000],[6,7000],[73,9000],[13,18000]]}`|
|1110008|`{"cost":[[199002,1]],"attrs":[[2,180000],[25,54000],[6,7000],[73,12000],[13,21000]]}`|
|1110009|`{"cost":[[199002,1]],"attrs":[[2,240000],[25,72000],[6,7000],[73,15000],[13,24000]]}`|
|1110010|`{"cost":[[199002,1]],"attrs":[[2,300000],[25,90000],[6,7000],[73,18000],[13,27000]]}`|
|1110011|`{"cost":[[199002,1]],"attrs":[[2,360000],[25,108000],[6,7000],[73,21000],[13,30000]]}`|
|1110012|`{"cost":[[199002,1]],"attrs":[[2,420000],[25,126000],[6,7000],[73,24000],[13,33000]]}`|
|1110013|`{"cost":[[199002,1]],"attrs":[[2,480000],[25,144000],[6,7000],[73,27000],[13,36000]]}`|
|1110014|`{"cost":[[199002,1]],"attrs":[[2,540000],[25,162000],[6,7000],[73,30000],[13,39000]]}`|
|1110015|`{"cost":[[199002,1]],"attrs":[[2,600000],[25,180000],[6,7000],[73,33000],[13,42000]]}`|
|1120001|`{"cost":[[184002,1]],"attrs":[[2,3000],[24,3600],[26,1000],[72,0],[23,1500]]}`|
|1120002|`{"cost":[[188002,1]],"attrs":[[2,6000],[24,7200],[26,2500],[72,0],[23,3500]]}`|
|1120003|`{"cost":[[192002,1]],"attrs":[[2,12000],[24,14400],[26,4500],[72,0],[23,6000]]}`|
|1120004|`{"cost":[[196002,1]],"attrs":[[2,21000],[24,25200],[26,7000],[72,0],[23,9000]]}`|
|1120005|`{"cost":[[200002,1]],"attrs":[[2,30000],[24,36000],[26,7000],[72,3000],[23,12000]]}`|
|1120006|`{"cost":[[200002,1]],"attrs":[[2,45000],[24,54000],[26,7000],[72,6000],[23,15000]]}`|
|1120007|`{"cost":[[200002,1]],"attrs":[[2,60000],[24,72000],[26,7000],[72,9000],[23,18000]]}`|
|1120008|`{"cost":[[200002,1]],"attrs":[[2,90000],[24,108000],[26,7000],[72,12000],[23,21000]]}`|
|1120009|`{"cost":[[200002,1]],"attrs":[[2,120000],[24,144000],[26,7000],[72,15000],[23,24000]]}`|
|1120010|`{"cost":[[200002,1]],"attrs":[[2,150000],[24,180000],[26,7000],[72,18000],[23,27000]]}`|
|1120011|`{"cost":[[200002,1]],"attrs":[[2,180000],[24,216000],[26,7000],[72,21000],[23,30000]]}`|
|1120012|`{"cost":[[200002,1]],"attrs":[[2,210000],[24,252000],[26,7000],[72,24000],[23,33000]]}`|
|1120013|`{"cost":[[200002,1]],"attrs":[[2,240000],[24,288000],[26,7000],[72,27000],[23,36000]]}`|
|1120014|`{"cost":[[200002,1]],"attrs":[[2,270000],[24,324000],[26,7000],[72,30000],[23,39000]]}`|
|1120015|`{"cost":[[200002,1]],"attrs":[[2,300000],[24,360000],[26,7000],[72,33000],[23,42000]]}`|
|1130001|`{"cost":[[185002,1]],"attrs":[[1,36000],[24,1800],[5,1000],[73,0],[13,1500]]}`|
|1130002|`{"cost":[[189002,1]],"attrs":[[1,72000],[24,3600],[5,2500],[73,0],[13,3500]]}`|
|1130003|`{"cost":[[193002,1]],"attrs":[[1,144000],[24,7200],[5,4500],[73,0],[13,6000]]}`|
|1130004|`{"cost":[[197002,1]],"attrs":[[1,252000],[24,12600],[5,7000],[73,0],[13,9000]]}`|
|1130005|`{"cost":[[201002,1]],"attrs":[[1,360000],[24,18000],[5,7000],[73,3000],[13,12000]]}`|
|1130006|`{"cost":[[201002,1]],"attrs":[[1,540000],[24,27000],[5,7000],[73,6000],[13,15000]]}`|
|1130007|`{"cost":[[201002,1]],"attrs":[[1,720000],[24,36000],[5,7000],[73,9000],[13,18000]]}`|
|1130008|`{"cost":[[201002,1]],"attrs":[[1,1080000],[24,54000],[5,7000],[73,12000],[13,21000]]}`|
|1130009|`{"cost":[[201002,1]],"attrs":[[1,1440000],[24,72000],[5,7000],[73,15000],[13,24000]]}`|
|1130010|`{"cost":[[201002,1]],"attrs":[[1,1800000],[24,90000],[5,7000],[73,18000],[13,27000]]}`|
|1130011|`{"cost":[[201002,1]],"attrs":[[1,2160000],[24,108000],[5,7000],[73,21000],[13,30000]]}`|
|1130012|`{"cost":[[201002,1]],"attrs":[[1,2520000],[24,126000],[5,7000],[73,24000],[13,33000]]}`|
|1130013|`{"cost":[[201002,1]],"attrs":[[1,2880000],[24,144000],[5,7000],[73,27000],[13,36000]]}`|
|1130014|`{"cost":[[201002,1]],"attrs":[[1,3240000],[24,162000],[5,7000],[73,30000],[13,39000]]}`|
|1130015|`{"cost":[[201002,1]],"attrs":[[1,3600000],[24,180000],[5,7000],[73,33000],[13,42000]]}`|
|1140001|`{"cost":[[186002,1]],"attrs":[[1,18000],[25,3600],[27,1000],[72,0],[23,1500]]}`|
|1140002|`{"cost":[[190002,1]],"attrs":[[1,36000],[25,7200],[27,2500],[72,0],[23,3500]]}`|
|1140003|`{"cost":[[194002,1]],"attrs":[[1,72000],[25,14400],[27,4500],[72,0],[23,6000]]}`|
|1140004|`{"cost":[[198002,1]],"attrs":[[1,126000],[25,25200],[27,7000],[72,0],[23,9000]]}`|
|1140005|`{"cost":[[202002,1]],"attrs":[[1,180000],[25,36000],[27,7000],[72,3000],[23,12000]]}`|
|1140006|`{"cost":[[202002,1]],"attrs":[[1,270000],[25,54000],[27,7000],[72,6000],[23,15000]]}`|
|1140007|`{"cost":[[202002,1]],"attrs":[[1,360000],[25,72000],[27,7000],[72,9000],[23,18000]]}`|
|1140008|`{"cost":[[202002,1]],"attrs":[[1,540000],[25,108000],[27,7000],[72,12000],[23,21000]]}`|
|1140009|`{"cost":[[202002,1]],"attrs":[[1,720000],[25,144000],[27,7000],[72,15000],[23,24000]]}`|
|1140010|`{"cost":[[202002,1]],"attrs":[[1,900000],[25,180000],[27,7000],[72,18000],[23,27000]]}`|
|1140011|`{"cost":[[202002,1]],"attrs":[[1,1080000],[25,216000],[27,7000],[72,21000],[23,30000]]}`|
|1140012|`{"cost":[[202002,1]],"attrs":[[1,1260000],[25,252000],[27,7000],[72,24000],[23,33000]]}`|
|1140013|`{"cost":[[202002,1]],"attrs":[[1,1440000],[25,288000],[27,7000],[72,27000],[23,36000]]}`|
|1140014|`{"cost":[[202002,1]],"attrs":[[1,1620000],[25,324000],[27,7000],[72,30000],[23,39000]]}`|
|1140015|`{"cost":[[202002,1]],"attrs":[[1,1800000],[25,360000],[27,7000],[72,33000],[23,42000]]}`|
|1210001|`{"cost":[[223002,1]],"attrs":[[2,6000],[25,1800],[6,1000],[73,0],[13,1500]]}`|
|1210002|`{"cost":[[227002,1]],"attrs":[[2,12000],[25,3600],[6,2500],[73,0],[13,3500]]}`|
|1210003|`{"cost":[[231002,1]],"attrs":[[2,24000],[25,7200],[6,4500],[73,0],[13,6000]]}`|
|1210004|`{"cost":[[235002,1]],"attrs":[[2,42000],[25,12600],[6,7000],[73,0],[13,9000]]}`|
|1210005|`{"cost":[[239002,1]],"attrs":[[2,60000],[25,18000],[6,7000],[73,3000],[13,12000]]}`|
|1210006|`{"cost":[[239002,1]],"attrs":[[2,90000],[25,27000],[6,7000],[73,6000],[13,15000]]}`|
|1210007|`{"cost":[[239002,1]],"attrs":[[2,120000],[25,36000],[6,7000],[73,9000],[13,18000]]}`|
|1210008|`{"cost":[[239002,1]],"attrs":[[2,180000],[25,54000],[6,7000],[73,12000],[13,21000]]}`|
|1210009|`{"cost":[[239002,1]],"attrs":[[2,240000],[25,72000],[6,7000],[73,15000],[13,24000]]}`|
|1210010|`{"cost":[[239002,1]],"attrs":[[2,300000],[25,90000],[6,7000],[73,18000],[13,27000]]}`|
|1210011|`{"cost":[[239002,1]],"attrs":[[2,360000],[25,108000],[6,7000],[73,21000],[13,30000]]}`|
|1210012|`{"cost":[[239002,1]],"attrs":[[2,420000],[25,126000],[6,7000],[73,24000],[13,33000]]}`|
|1210013|`{"cost":[[239002,1]],"attrs":[[2,480000],[25,144000],[6,7000],[73,27000],[13,36000]]}`|
|1210014|`{"cost":[[239002,1]],"attrs":[[2,540000],[25,162000],[6,7000],[73,30000],[13,39000]]}`|
|1210015|`{"cost":[[239002,1]],"attrs":[[2,600000],[25,180000],[6,7000],[73,33000],[13,42000]]}`|
|1220001|`{"cost":[[224002,1]],"attrs":[[2,3000],[24,3600],[26,1000],[72,0],[23,1500]]}`|
|1220002|`{"cost":[[228002,1]],"attrs":[[2,6000],[24,7200],[26,2500],[72,0],[23,3500]]}`|
|1220003|`{"cost":[[232002,1]],"attrs":[[2,12000],[24,14400],[26,4500],[72,0],[23,6000]]}`|
|1220004|`{"cost":[[236002,1]],"attrs":[[2,21000],[24,25200],[26,7000],[72,0],[23,9000]]}`|
|1220005|`{"cost":[[240002,1]],"attrs":[[2,30000],[24,36000],[26,7000],[72,3000],[23,12000]]}`|
|1220006|`{"cost":[[240002,1]],"attrs":[[2,45000],[24,54000],[26,7000],[72,6000],[23,15000]]}`|
|1220007|`{"cost":[[240002,1]],"attrs":[[2,60000],[24,72000],[26,7000],[72,9000],[23,18000]]}`|
|1220008|`{"cost":[[240002,1]],"attrs":[[2,90000],[24,108000],[26,7000],[72,12000],[23,21000]]}`|
|1220009|`{"cost":[[240002,1]],"attrs":[[2,120000],[24,144000],[26,7000],[72,15000],[23,24000]]}`|
|1220010|`{"cost":[[240002,1]],"attrs":[[2,150000],[24,180000],[26,7000],[72,18000],[23,27000]]}`|
|1220011|`{"cost":[[240002,1]],"attrs":[[2,180000],[24,216000],[26,7000],[72,21000],[23,30000]]}`|
|1220012|`{"cost":[[240002,1]],"attrs":[[2,210000],[24,252000],[26,7000],[72,24000],[23,33000]]}`|
|1220013|`{"cost":[[240002,1]],"attrs":[[2,240000],[24,288000],[26,7000],[72,27000],[23,36000]]}`|
|1220014|`{"cost":[[240002,1]],"attrs":[[2,270000],[24,324000],[26,7000],[72,30000],[23,39000]]}`|
|1220015|`{"cost":[[240002,1]],"attrs":[[2,300000],[24,360000],[26,7000],[72,33000],[23,42000]]}`|
|1230001|`{"cost":[[225002,1]],"attrs":[[1,36000],[24,1800],[5,1000],[73,0],[13,1500]]}`|
|1230002|`{"cost":[[229002,1]],"attrs":[[1,72000],[24,3600],[5,2500],[73,0],[13,3500]]}`|
|1230003|`{"cost":[[233002,1]],"attrs":[[1,144000],[24,7200],[5,4500],[73,0],[13,6000]]}`|
|1230004|`{"cost":[[237002,1]],"attrs":[[1,252000],[24,12600],[5,7000],[73,0],[13,9000]]}`|
|1230005|`{"cost":[[241002,1]],"attrs":[[1,360000],[24,18000],[5,7000],[73,3000],[13,12000]]}`|
|1230006|`{"cost":[[241002,1]],"attrs":[[1,540000],[24,27000],[5,7000],[73,6000],[13,15000]]}`|
|1230007|`{"cost":[[241002,1]],"attrs":[[1,720000],[24,36000],[5,7000],[73,9000],[13,18000]]}`|
|1230008|`{"cost":[[241002,1]],"attrs":[[1,1080000],[24,54000],[5,7000],[73,12000],[13,21000]]}`|
|1230009|`{"cost":[[241002,1]],"attrs":[[1,1440000],[24,72000],[5,7000],[73,15000],[13,24000]]}`|
|1230010|`{"cost":[[241002,1]],"attrs":[[1,1800000],[24,90000],[5,7000],[73,18000],[13,27000]]}`|
|1230011|`{"cost":[[241002,1]],"attrs":[[1,2160000],[24,108000],[5,7000],[73,21000],[13,30000]]}`|
|1230012|`{"cost":[[241002,1]],"attrs":[[1,2520000],[24,126000],[5,7000],[73,24000],[13,33000]]}`|
|1230013|`{"cost":[[241002,1]],"attrs":[[1,2880000],[24,144000],[5,7000],[73,27000],[13,36000]]}`|
|1230014|`{"cost":[[241002,1]],"attrs":[[1,3240000],[24,162000],[5,7000],[73,30000],[13,39000]]}`|
|1230015|`{"cost":[[241002,1]],"attrs":[[1,3600000],[24,180000],[5,7000],[73,33000],[13,42000]]}`|
|1240001|`{"cost":[[226002,1]],"attrs":[[1,18000],[25,3600],[27,1000],[72,0],[23,1500]]}`|
|1240002|`{"cost":[[230002,1]],"attrs":[[1,36000],[25,7200],[27,2500],[72,0],[23,3500]]}`|
|1240003|`{"cost":[[234002,1]],"attrs":[[1,72000],[25,14400],[27,4500],[72,0],[23,6000]]}`|
|1240004|`{"cost":[[238002,1]],"attrs":[[1,126000],[25,25200],[27,7000],[72,0],[23,9000]]}`|
|1240005|`{"cost":[[242002,1]],"attrs":[[1,180000],[25,36000],[27,7000],[72,3000],[23,12000]]}`|
|1240006|`{"cost":[[242002,1]],"attrs":[[1,270000],[25,54000],[27,7000],[72,6000],[23,15000]]}`|
|1240007|`{"cost":[[242002,1]],"attrs":[[1,360000],[25,72000],[27,7000],[72,9000],[23,18000]]}`|
|1240008|`{"cost":[[242002,1]],"attrs":[[1,540000],[25,108000],[27,7000],[72,12000],[23,21000]]}`|
|1240009|`{"cost":[[242002,1]],"attrs":[[1,720000],[25,144000],[27,7000],[72,15000],[23,24000]]}`|
|1240010|`{"cost":[[242002,1]],"attrs":[[1,900000],[25,180000],[27,7000],[72,18000],[23,27000]]}`|
|1240011|`{"cost":[[242002,1]],"attrs":[[1,1080000],[25,216000],[27,7000],[72,21000],[23,30000]]}`|
|1240012|`{"cost":[[242002,1]],"attrs":[[1,1260000],[25,252000],[27,7000],[72,24000],[23,33000]]}`|
|1240013|`{"cost":[[242002,1]],"attrs":[[1,1440000],[25,288000],[27,7000],[72,27000],[23,36000]]}`|
|1240014|`{"cost":[[242002,1]],"attrs":[[1,1620000],[25,324000],[27,7000],[72,30000],[23,39000]]}`|
|1240015|`{"cost":[[242002,1]],"attrs":[[1,1800000],[25,360000],[27,7000],[72,33000],[23,42000]]}`|
|1310001|`{"cost":[[203002,1]],"attrs":[[2,6000],[25,1800],[6,1000],[73,0],[13,1500]]}`|
|1310002|`{"cost":[[207002,1]],"attrs":[[2,12000],[25,3600],[6,2500],[73,0],[13,3500]]}`|
|1310003|`{"cost":[[211002,1]],"attrs":[[2,24000],[25,7200],[6,4500],[73,0],[13,6000]]}`|
|1310004|`{"cost":[[215002,1]],"attrs":[[2,42000],[25,12600],[6,7000],[73,0],[13,9000]]}`|
|1310005|`{"cost":[[219002,1]],"attrs":[[2,60000],[25,18000],[6,7000],[73,3000],[13,12000]]}`|
|1310006|`{"cost":[[219002,1]],"attrs":[[2,90000],[25,27000],[6,7000],[73,6000],[13,15000]]}`|
|1310007|`{"cost":[[219002,1]],"attrs":[[2,120000],[25,36000],[6,7000],[73,9000],[13,18000]]}`|
|1310008|`{"cost":[[219002,1]],"attrs":[[2,180000],[25,54000],[6,7000],[73,12000],[13,21000]]}`|
|1310009|`{"cost":[[219002,1]],"attrs":[[2,240000],[25,72000],[6,7000],[73,15000],[13,24000]]}`|
|1310010|`{"cost":[[219002,1]],"attrs":[[2,300000],[25,90000],[6,7000],[73,18000],[13,27000]]}`|
|1310011|`{"cost":[[219002,1]],"attrs":[[2,360000],[25,108000],[6,7000],[73,21000],[13,30000]]}`|
|1310012|`{"cost":[[219002,1]],"attrs":[[2,420000],[25,126000],[6,7000],[73,24000],[13,33000]]}`|
|1310013|`{"cost":[[219002,1]],"attrs":[[2,480000],[25,144000],[6,7000],[73,27000],[13,36000]]}`|
|1310014|`{"cost":[[219002,1]],"attrs":[[2,540000],[25,162000],[6,7000],[73,30000],[13,39000]]}`|
|1310015|`{"cost":[[219002,1]],"attrs":[[2,600000],[25,180000],[6,7000],[73,33000],[13,42000]]}`|
|1320001|`{"cost":[[204002,1]],"attrs":[[2,3000],[24,3600],[26,1000],[72,0],[23,1500]]}`|
|1320002|`{"cost":[[208002,1]],"attrs":[[2,6000],[24,7200],[26,2500],[72,0],[23,3500]]}`|
|1320003|`{"cost":[[212002,1]],"attrs":[[2,12000],[24,14400],[26,4500],[72,0],[23,6000]]}`|
|1320004|`{"cost":[[216002,1]],"attrs":[[2,21000],[24,25200],[26,7000],[72,0],[23,9000]]}`|
|1320005|`{"cost":[[220002,1]],"attrs":[[2,30000],[24,36000],[26,7000],[72,3000],[23,12000]]}`|
|1320006|`{"cost":[[220002,1]],"attrs":[[2,45000],[24,54000],[26,7000],[72,6000],[23,15000]]}`|
|1320007|`{"cost":[[220002,1]],"attrs":[[2,60000],[24,72000],[26,7000],[72,9000],[23,18000]]}`|
|1320008|`{"cost":[[220002,1]],"attrs":[[2,90000],[24,108000],[26,7000],[72,12000],[23,21000]]}`|
|1320009|`{"cost":[[220002,1]],"attrs":[[2,120000],[24,144000],[26,7000],[72,15000],[23,24000]]}`|
|1320010|`{"cost":[[220002,1]],"attrs":[[2,150000],[24,180000],[26,7000],[72,18000],[23,27000]]}`|
|1320011|`{"cost":[[220002,1]],"attrs":[[2,180000],[24,216000],[26,7000],[72,21000],[23,30000]]}`|
|1320012|`{"cost":[[220002,1]],"attrs":[[2,210000],[24,252000],[26,7000],[72,24000],[23,33000]]}`|
|1320013|`{"cost":[[220002,1]],"attrs":[[2,240000],[24,288000],[26,7000],[72,27000],[23,36000]]}`|
|1320014|`{"cost":[[220002,1]],"attrs":[[2,270000],[24,324000],[26,7000],[72,30000],[23,39000]]}`|
|1320015|`{"cost":[[220002,1]],"attrs":[[2,300000],[24,360000],[26,7000],[72,33000],[23,42000]]}`|
|1330001|`{"cost":[[205002,1]],"attrs":[[1,36000],[24,1800],[5,1000],[73,0],[13,1500]]}`|
|1330002|`{"cost":[[209002,1]],"attrs":[[1,72000],[24,3600],[5,2500],[73,0],[13,3500]]}`|
|1330003|`{"cost":[[213002,1]],"attrs":[[1,144000],[24,7200],[5,4500],[73,0],[13,6000]]}`|
|1330004|`{"cost":[[217002,1]],"attrs":[[1,252000],[24,12600],[5,7000],[73,0],[13,9000]]}`|
|1330005|`{"cost":[[221002,1]],"attrs":[[1,360000],[24,18000],[5,7000],[73,3000],[13,12000]]}`|
|1330006|`{"cost":[[221002,1]],"attrs":[[1,540000],[24,27000],[5,7000],[73,6000],[13,15000]]}`|
|1330007|`{"cost":[[221002,1]],"attrs":[[1,720000],[24,36000],[5,7000],[73,9000],[13,18000]]}`|
|1330008|`{"cost":[[221002,1]],"attrs":[[1,1080000],[24,54000],[5,7000],[73,12000],[13,21000]]}`|
|1330009|`{"cost":[[221002,1]],"attrs":[[1,1440000],[24,72000],[5,7000],[73,15000],[13,24000]]}`|
|1330010|`{"cost":[[221002,1]],"attrs":[[1,1800000],[24,90000],[5,7000],[73,18000],[13,27000]]}`|
|1330011|`{"cost":[[221002,1]],"attrs":[[1,2160000],[24,108000],[5,7000],[73,21000],[13,30000]]}`|
|1330012|`{"cost":[[221002,1]],"attrs":[[1,2520000],[24,126000],[5,7000],[73,24000],[13,33000]]}`|
|1330013|`{"cost":[[221002,1]],"attrs":[[1,2880000],[24,144000],[5,7000],[73,27000],[13,36000]]}`|
|1330014|`{"cost":[[221002,1]],"attrs":[[1,3240000],[24,162000],[5,7000],[73,30000],[13,39000]]}`|
|1330015|`{"cost":[[221002,1]],"attrs":[[1,3600000],[24,180000],[5,7000],[73,33000],[13,42000]]}`|
|1340001|`{"cost":[[206002,1]],"attrs":[[1,18000],[25,3600],[27,1000],[72,0],[23,1500]]}`|
|1340002|`{"cost":[[210002,1]],"attrs":[[1,36000],[25,7200],[27,2500],[72,0],[23,3500]]}`|
|1340003|`{"cost":[[214002,1]],"attrs":[[1,72000],[25,14400],[27,4500],[72,0],[23,6000]]}`|
|1340004|`{"cost":[[218002,1]],"attrs":[[1,126000],[25,25200],[27,7000],[72,0],[23,9000]]}`|
|1340005|`{"cost":[[222002,1]],"attrs":[[1,180000],[25,36000],[27,7000],[72,3000],[23,12000]]}`|
|1340006|`{"cost":[[222002,1]],"attrs":[[1,270000],[25,54000],[27,7000],[72,6000],[23,15000]]}`|
|1340007|`{"cost":[[222002,1]],"attrs":[[1,360000],[25,72000],[27,7000],[72,9000],[23,18000]]}`|
|1340008|`{"cost":[[222002,1]],"attrs":[[1,540000],[25,108000],[27,7000],[72,12000],[23,21000]]}`|
|1340009|`{"cost":[[222002,1]],"attrs":[[1,720000],[25,144000],[27,7000],[72,15000],[23,24000]]}`|
|1340010|`{"cost":[[222002,1]],"attrs":[[1,900000],[25,180000],[27,7000],[72,18000],[23,27000]]}`|
|1340011|`{"cost":[[222002,1]],"attrs":[[1,1080000],[25,216000],[27,7000],[72,21000],[23,30000]]}`|
|1340012|`{"cost":[[222002,1]],"attrs":[[1,1260000],[25,252000],[27,7000],[72,24000],[23,33000]]}`|
|1340013|`{"cost":[[222002,1]],"attrs":[[1,1440000],[25,288000],[27,7000],[72,27000],[23,36000]]}`|
|1340014|`{"cost":[[222002,1]],"attrs":[[1,1620000],[25,324000],[27,7000],[72,30000],[23,39000]]}`|
|1340015|`{"cost":[[222002,1]],"attrs":[[1,1800000],[25,360000],[27,7000],[72,33000],[23,42000]]}`|
|1410001|`{"cost":[[243002,1]],"attrs":[[2,6000],[25,1800],[6,1000],[73,0],[13,1500]]}`|
|1410002|`{"cost":[[247002,1]],"attrs":[[2,12000],[25,3600],[6,2500],[73,0],[13,3500]]}`|
|1410003|`{"cost":[[251002,1]],"attrs":[[2,24000],[25,7200],[6,4500],[73,0],[13,6000]]}`|
|1410004|`{"cost":[[255002,1]],"attrs":[[2,42000],[25,12600],[6,7000],[73,0],[13,9000]]}`|
|1410005|`{"cost":[[259002,1]],"attrs":[[2,60000],[25,18000],[6,7000],[73,3000],[13,12000]]}`|
|1410006|`{"cost":[[259002,1]],"attrs":[[2,90000],[25,27000],[6,7000],[73,6000],[13,15000]]}`|
|1410007|`{"cost":[[259002,1]],"attrs":[[2,120000],[25,36000],[6,7000],[73,9000],[13,18000]]}`|
|1410008|`{"cost":[[259002,1]],"attrs":[[2,180000],[25,54000],[6,7000],[73,12000],[13,21000]]}`|
|1410009|`{"cost":[[259002,1]],"attrs":[[2,240000],[25,72000],[6,7000],[73,15000],[13,24000]]}`|
|1410010|`{"cost":[[259002,1]],"attrs":[[2,300000],[25,90000],[6,7000],[73,18000],[13,27000]]}`|
|1410011|`{"cost":[[259002,1]],"attrs":[[2,360000],[25,108000],[6,7000],[73,21000],[13,30000]]}`|
|1410012|`{"cost":[[259002,1]],"attrs":[[2,420000],[25,126000],[6,7000],[73,24000],[13,33000]]}`|
|1410013|`{"cost":[[259002,1]],"attrs":[[2,480000],[25,144000],[6,7000],[73,27000],[13,36000]]}`|
|1410014|`{"cost":[[259002,1]],"attrs":[[2,540000],[25,162000],[6,7000],[73,30000],[13,39000]]}`|
|1410015|`{"cost":[[259002,1]],"attrs":[[2,600000],[25,180000],[6,7000],[73,33000],[13,42000]]}`|
|1420001|`{"cost":[[244002,1]],"attrs":[[2,3000],[24,3600],[26,1000],[72,0],[23,1500]]}`|
|1420002|`{"cost":[[248002,1]],"attrs":[[2,6000],[24,7200],[26,2500],[72,0],[23,3500]]}`|
|1420003|`{"cost":[[252002,1]],"attrs":[[2,12000],[24,14400],[26,4500],[72,0],[23,6000]]}`|
|1420004|`{"cost":[[256002,1]],"attrs":[[2,21000],[24,25200],[26,7000],[72,0],[23,9000]]}`|
|1420005|`{"cost":[[260002,1]],"attrs":[[2,30000],[24,36000],[26,7000],[72,3000],[23,12000]]}`|
|1420006|`{"cost":[[260002,1]],"attrs":[[2,45000],[24,54000],[26,7000],[72,6000],[23,15000]]}`|
|1420007|`{"cost":[[260002,1]],"attrs":[[2,60000],[24,72000],[26,7000],[72,9000],[23,18000]]}`|
|1420008|`{"cost":[[260002,1]],"attrs":[[2,90000],[24,108000],[26,7000],[72,12000],[23,21000]]}`|
|1420009|`{"cost":[[260002,1]],"attrs":[[2,120000],[24,144000],[26,7000],[72,15000],[23,24000]]}`|
|1420010|`{"cost":[[260002,1]],"attrs":[[2,150000],[24,180000],[26,7000],[72,18000],[23,27000]]}`|
|1420011|`{"cost":[[260002,1]],"attrs":[[2,180000],[24,216000],[26,7000],[72,21000],[23,30000]]}`|
|1420012|`{"cost":[[260002,1]],"attrs":[[2,210000],[24,252000],[26,7000],[72,24000],[23,33000]]}`|
|1420013|`{"cost":[[260002,1]],"attrs":[[2,240000],[24,288000],[26,7000],[72,27000],[23,36000]]}`|
|1420014|`{"cost":[[260002,1]],"attrs":[[2,270000],[24,324000],[26,7000],[72,30000],[23,39000]]}`|
|1420015|`{"cost":[[260002,1]],"attrs":[[2,300000],[24,360000],[26,7000],[72,33000],[23,42000]]}`|
|1430001|`{"cost":[[245002,1]],"attrs":[[1,36000],[24,1800],[5,1000],[73,0],[13,1500]]}`|
|1430002|`{"cost":[[249002,1]],"attrs":[[1,72000],[24,3600],[5,2500],[73,0],[13,3500]]}`|
|1430003|`{"cost":[[253002,1]],"attrs":[[1,144000],[24,7200],[5,4500],[73,0],[13,6000]]}`|
|1430004|`{"cost":[[257002,1]],"attrs":[[1,252000],[24,12600],[5,7000],[73,0],[13,9000]]}`|
|1430005|`{"cost":[[261002,1]],"attrs":[[1,360000],[24,18000],[5,7000],[73,3000],[13,12000]]}`|
|1430006|`{"cost":[[261002,1]],"attrs":[[1,540000],[24,27000],[5,7000],[73,6000],[13,15000]]}`|
|1430007|`{"cost":[[261002,1]],"attrs":[[1,720000],[24,36000],[5,7000],[73,9000],[13,18000]]}`|
|1430008|`{"cost":[[261002,1]],"attrs":[[1,1080000],[24,54000],[5,7000],[73,12000],[13,21000]]}`|
|1430009|`{"cost":[[261002,1]],"attrs":[[1,1440000],[24,72000],[5,7000],[73,15000],[13,24000]]}`|
|1430010|`{"cost":[[261002,1]],"attrs":[[1,1800000],[24,90000],[5,7000],[73,18000],[13,27000]]}`|
|1430011|`{"cost":[[261002,1]],"attrs":[[1,2160000],[24,108000],[5,7000],[73,21000],[13,30000]]}`|
|1430012|`{"cost":[[261002,1]],"attrs":[[1,2520000],[24,126000],[5,7000],[73,24000],[13,33000]]}`|
|1430013|`{"cost":[[261002,1]],"attrs":[[1,2880000],[24,144000],[5,7000],[73,27000],[13,36000]]}`|
|1430014|`{"cost":[[261002,1]],"attrs":[[1,3240000],[24,162000],[5,7000],[73,30000],[13,39000]]}`|
|1430015|`{"cost":[[261002,1]],"attrs":[[1,3600000],[24,180000],[5,7000],[73,33000],[13,42000]]}`|
|1440001|`{"cost":[[246002,1]],"attrs":[[1,18000],[25,3600],[27,1000],[72,0],[23,1500]]}`|
|1440002|`{"cost":[[250002,1]],"attrs":[[1,36000],[25,7200],[27,2500],[72,0],[23,3500]]}`|
|1440003|`{"cost":[[254002,1]],"attrs":[[1,72000],[25,14400],[27,4500],[72,0],[23,6000]]}`|
|1440004|`{"cost":[[258002,1]],"attrs":[[1,126000],[25,25200],[27,7000],[72,0],[23,9000]]}`|
|1440005|`{"cost":[[262002,1]],"attrs":[[1,180000],[25,36000],[27,7000],[72,3000],[23,12000]]}`|
|1440006|`{"cost":[[262002,1]],"attrs":[[1,270000],[25,54000],[27,7000],[72,6000],[23,15000]]}`|
|1440007|`{"cost":[[262002,1]],"attrs":[[1,360000],[25,72000],[27,7000],[72,9000],[23,18000]]}`|
|1440008|`{"cost":[[262002,1]],"attrs":[[1,540000],[25,108000],[27,7000],[72,12000],[23,21000]]}`|
|1440009|`{"cost":[[262002,1]],"attrs":[[1,720000],[25,144000],[27,7000],[72,15000],[23,24000]]}`|
|1440010|`{"cost":[[262002,1]],"attrs":[[1,900000],[25,180000],[27,7000],[72,18000],[23,27000]]}`|
|1440011|`{"cost":[[262002,1]],"attrs":[[1,1080000],[25,216000],[27,7000],[72,21000],[23,30000]]}`|
|1440012|`{"cost":[[262002,1]],"attrs":[[1,1260000],[25,252000],[27,7000],[72,24000],[23,33000]]}`|
|1440013|`{"cost":[[262002,1]],"attrs":[[1,1440000],[25,288000],[27,7000],[72,27000],[23,36000]]}`|
|1440014|`{"cost":[[262002,1]],"attrs":[[1,1620000],[25,324000],[27,7000],[72,30000],[23,39000]]}`|
|1440015|`{"cost":[[262002,1]],"attrs":[[1,1800000],[25,360000],[27,7000],[72,33000],[23,42000]]}`|

## CountrySubLevel

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|60|本表行键；与其他表同值不自动代表同一对象。|
|camp|number|60|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|skill|number|60|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|season|number|60|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1100001|`{"skill":260020101}`|
|1100002|`{"skill":260020102}`|
|1100003|`{"skill":260020103}`|
|1100004|`{"skill":260020104}`|
|1100005|`{"skill":260020105}`|
|1100006|`{"skill":260020106}`|
|1100007|`{"skill":260020107}`|
|1100008|`{"skill":260020108}`|
|1100009|`{"skill":260020109}`|
|1100010|`{"skill":260020110}`|
|1100011|`{"skill":260020111}`|
|1100012|`{"skill":260020112}`|
|1100013|`{"skill":260020113}`|
|1100014|`{"skill":260020114}`|
|1100015|`{"skill":260020115}`|
|1200001|`{"skill":260020201}`|
|1200002|`{"skill":260020202}`|
|1200003|`{"skill":260020203}`|
|1200004|`{"skill":260020204}`|
|1200005|`{"skill":260020205}`|
|1200006|`{"skill":260020206}`|
|1200007|`{"skill":260020207}`|
|1200008|`{"skill":260020208}`|
|1200009|`{"skill":260020209}`|
|1200010|`{"skill":260020210}`|
|1200011|`{"skill":260020211}`|
|1200012|`{"skill":260020212}`|
|1200013|`{"skill":260020213}`|
|1200014|`{"skill":260020214}`|
|1200015|`{"skill":260020215}`|
|1300001|`{"skill":260020301}`|
|1300002|`{"skill":260020302}`|
|1300003|`{"skill":260020303}`|
|1300004|`{"skill":260020304}`|
|1300005|`{"skill":260020305}`|
|1300006|`{"skill":260020306}`|
|1300007|`{"skill":260020307}`|
|1300008|`{"skill":260020308}`|
|1300009|`{"skill":260020309}`|
|1300010|`{"skill":260020310}`|
|1300011|`{"skill":260020311}`|
|1300012|`{"skill":260020312}`|
|1300013|`{"skill":260020313}`|
|1300014|`{"skill":260020314}`|
|1300015|`{"skill":260020315}`|
|1400001|`{"skill":260020401}`|
|1400002|`{"skill":260020402}`|
|1400003|`{"skill":260020403}`|
|1400004|`{"skill":260020404}`|
|1400005|`{"skill":260020405}`|
|1400006|`{"skill":260020406}`|
|1400007|`{"skill":260020407}`|
|1400008|`{"skill":260020408}`|
|1400009|`{"skill":260020409}`|
|1400010|`{"skill":260020410}`|
|1400011|`{"skill":260020411}`|
|1400012|`{"skill":260020412}`|
|1400013|`{"skill":260020413}`|
|1400014|`{"skill":260020414}`|
|1400015|`{"skill":260020415}`|

## SwordAttr

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|21|本表行键；与其他表同值不自动代表同一对象。|
|attrs_value|number|21|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|group|number|21|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|hook_addition|array|21|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|exp|number|21|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|boss_dmg|number|21|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|attrs_type|array|21|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10000|`{"attrs_value":0,"group":1,"exp":0,"attrs_type":[5,6,45]}`|
|10001|`{"attrs_value":100,"group":1,"exp":40000,"attrs_type":[5,6,45]}`|
|10002|`{"attrs_value":200,"group":1,"exp":80000,"attrs_type":[5,6,45]}`|
|10003|`{"attrs_value":300,"group":1,"exp":120000,"attrs_type":[5,6,45]}`|
|10004|`{"attrs_value":400,"group":1,"exp":160000,"attrs_type":[5,6,45]}`|
|10005|`{"attrs_value":500,"group":1,"exp":200000,"attrs_type":[5,6,45]}`|
|10006|`{"attrs_value":700,"group":1,"exp":260000,"attrs_type":[5,6,45]}`|
|10007|`{"attrs_value":900,"group":1,"exp":320000,"attrs_type":[5,6,45]}`|
|10008|`{"attrs_value":1100,"group":1,"exp":380000,"attrs_type":[5,6,45]}`|
|10009|`{"attrs_value":1300,"group":1,"exp":440000,"attrs_type":[5,6,45]}`|
|10010|`{"attrs_value":1500,"group":1,"exp":500000,"attrs_type":[5,6,45]}`|
|10011|`{"attrs_value":1750,"group":1,"exp":600000,"attrs_type":[5,6,45]}`|
|10012|`{"attrs_value":2000,"group":1,"exp":700000,"attrs_type":[5,6,45]}`|
|10013|`{"attrs_value":2250,"group":1,"exp":800000,"attrs_type":[5,6,45]}`|
|10014|`{"attrs_value":2500,"group":1,"exp":900000,"attrs_type":[5,6,45]}`|
|10015|`{"attrs_value":2750,"group":1,"exp":1000000,"attrs_type":[5,6,45]}`|
|10016|`{"attrs_value":3000,"group":1,"exp":1100000,"attrs_type":[5,6,45]}`|
|10017|`{"attrs_value":3250,"group":1,"exp":1200000,"attrs_type":[5,6,45]}`|
|10018|`{"attrs_value":3500,"group":1,"exp":1300000,"attrs_type":[5,6,45]}`|
|10019|`{"attrs_value":3750,"group":1,"exp":1400000,"attrs_type":[5,6,45]}`|
|10020|`{"attrs_value":4000,"group":1,"exp":1500000,"attrs_type":[5,6,45]}`|

## CountryStar

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|group|number|36|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|cost_num|number|36|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|skill|number|36|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|36|本表行键；与其他表同值不自动代表同一对象。|
|cost_id|number|36|原消耗字段；币种、数量、是否批量累加及扣费时点由本家族规则册定义。|
|enemy_attr_weak|array|36|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|icon|string|36|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|page|number|36|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10101|`{"group":1,"cost_num":20,"skill":0,"cost_id":182002,"enemy_attr_weak":[[1,150]]}`|
|10102|`{"group":1,"cost_num":30,"skill":0,"cost_id":182002,"enemy_attr_weak":[[76,150]]}`|
|10103|`{"group":1,"cost_num":60,"skill":0,"cost_id":182002,"enemy_attr_weak":[[60,300]]}`|
|10104|`{"group":1,"cost_num":40,"skill":0,"cost_id":182002,"enemy_attr_weak":[[2,150]]}`|
|10105|`{"group":1,"cost_num":40,"skill":0,"cost_id":182002,"enemy_attr_weak":[[76,150]]}`|
|10106|`{"group":1,"cost_num":80,"skill":0,"cost_id":182002,"enemy_attr_weak":[[66,300]]}`|
|10107|`{"group":1,"cost_num":60,"skill":0,"cost_id":182002,"enemy_attr_weak":[[1,150]]}`|
|10108|`{"group":1,"cost_num":60,"skill":0,"cost_id":182002,"enemy_attr_weak":[[2,150]]}`|
|10109|`{"group":1,"cost_num":100,"skill":260030101,"cost_id":182002,"enemy_attr_weak":[]}`|
|10201|`{"group":1,"cost_num":60,"skill":0,"cost_id":182002,"enemy_attr_weak":[[1,200]]}`|
|10202|`{"group":1,"cost_num":60,"skill":0,"cost_id":182002,"enemy_attr_weak":[[76,200]]}`|
|10203|`{"group":1,"cost_num":100,"skill":0,"cost_id":182002,"enemy_attr_weak":[[22,500]]}`|
|10204|`{"group":1,"cost_num":80,"skill":0,"cost_id":182002,"enemy_attr_weak":[[2,200]]}`|
|10205|`{"group":1,"cost_num":80,"skill":0,"cost_id":182002,"enemy_attr_weak":[[76,200]]}`|
|10206|`{"group":1,"cost_num":120,"skill":0,"cost_id":182002,"enemy_attr_weak":[[11,500]]}`|
|10207|`{"group":1,"cost_num":100,"skill":0,"cost_id":182002,"enemy_attr_weak":[[1,200]]}`|
|10208|`{"group":1,"cost_num":100,"skill":0,"cost_id":182002,"enemy_attr_weak":[[2,200]]}`|
|10209|`{"group":1,"cost_num":160,"skill":260030102,"cost_id":182002,"enemy_attr_weak":[]}`|
|10301|`{"group":1,"cost_num":100,"skill":0,"cost_id":182002,"enemy_attr_weak":[[1,250]]}`|
|10302|`{"group":1,"cost_num":100,"skill":0,"cost_id":182002,"enemy_attr_weak":[[76,250]]}`|
|10303|`{"group":1,"cost_num":140,"skill":0,"cost_id":182002,"enemy_attr_weak":[[60,600]]}`|
|10304|`{"group":1,"cost_num":120,"skill":0,"cost_id":182002,"enemy_attr_weak":[[2,250]]}`|
|10305|`{"group":1,"cost_num":120,"skill":0,"cost_id":182002,"enemy_attr_weak":[[76,250]]}`|
|10306|`{"group":1,"cost_num":160,"skill":0,"cost_id":182002,"enemy_attr_weak":[[63,250]]}`|
|10307|`{"group":1,"cost_num":140,"skill":0,"cost_id":182002,"enemy_attr_weak":[[1,250]]}`|
|10308|`{"group":1,"cost_num":140,"skill":0,"cost_id":182002,"enemy_attr_weak":[[2,250]]}`|
|10309|`{"group":1,"cost_num":200,"skill":260030103,"cost_id":182002,"enemy_attr_weak":[]}`|
|10401|`{"group":1,"cost_num":140,"skill":0,"cost_id":182002,"enemy_attr_weak":[[1,300]]}`|
|10402|`{"group":1,"cost_num":140,"skill":0,"cost_id":182002,"enemy_attr_weak":[[76,300]]}`|
|10403|`{"group":1,"cost_num":180,"skill":0,"cost_id":182002,"enemy_attr_weak":[[22,750]]}`|
|10404|`{"group":1,"cost_num":160,"skill":0,"cost_id":182002,"enemy_attr_weak":[[2,300]]}`|
|10405|`{"group":1,"cost_num":160,"skill":0,"cost_id":182002,"enemy_attr_weak":[[76,300]]}`|
|10406|`{"group":1,"cost_num":200,"skill":0,"cost_id":182002,"enemy_attr_weak":[[54,750]]}`|
|10407|`{"group":1,"cost_num":180,"skill":0,"cost_id":182002,"enemy_attr_weak":[[1,300]]}`|
|10408|`{"group":1,"cost_num":180,"skill":0,"cost_id":182002,"enemy_attr_weak":[[2,300]]}`|
|10409|`{"group":1,"cost_num":240,"skill":260030104,"cost_id":182002,"enemy_attr_weak":[]}`|

## NormalCollectAttr

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|exp|number|101|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|101|本表行键；与其他表同值不自动代表同一对象。|
|attrs|array|101|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|10000|`{"exp":0,"attrs":[]}`|
|10001|`{"exp":50,"attrs":[[1,27000],[2,4500]]}`|
|10002|`{"exp":100,"attrs":[[1,27000],[2,4500],[24,4050],[25,4050]]}`|
|10003|`{"exp":150,"attrs":[[1,54000],[2,4500],[24,8100],[25,4050],[5,200],[26,200]]}`|
|10004|`{"exp":200,"attrs":[[1,54000],[2,9000],[24,8100],[25,8100],[5,200],[26,200]]}`|
|10005|`{"exp":200,"attrs":[[1,81000],[2,13500],[24,8100],[25,8100],[5,200],[26,200]]}`|
|10006|`{"exp":200,"attrs":[[1,108000],[2,13500],[24,12150],[25,8100],[5,200],[6,200],[26,200],[27,200]]}`|
|10007|`{"exp":200,"attrs":[[1,108000],[2,18000],[24,12150],[25,12150],[5,200],[6,200],[26,200],[27,200]]}`|
|10008|`{"exp":200,"attrs":[[1,135000],[2,18000],[24,16200],[25,12150],[5,200],[6,200],[26,200],[27,200]]}`|
|10009|`{"exp":200,"attrs":[[1,135000],[2,22500],[24,16200],[25,16200],[5,200],[6,200],[26,200],[27,200],[54,150],[55,150]]}`|
|10010|`{"exp":200,"attrs":[[1,162000],[2,27000],[24,16200],[25,16200],[5,200],[6,200],[26,200],[27,200],[54,150],[55,150]]}`|
|10011|`{"exp":200,"attrs":[[1,216000],[2,27000],[24,24300],[25,16200],[5,200],[6,200],[26,200],[27,200],[54,150],[55,150]]}`|
|10012|`{"exp":200,"attrs":[[1,216000],[2,36000],[24,24300],[25,24300],[5,400],[6,200],[26,400],[27,200],[54,150],[55,150]]}`|
|10013|`{"exp":200,"attrs":[[1,270000],[2,36000],[24,32400],[25,24300],[5,400],[6,200],[26,400],[27,200],[54,150],[55,150]]}`|
|10014|`{"exp":200,"attrs":[[1,270000],[2,45000],[24,32400],[25,32400],[5,400],[6,200],[26,400],[27,200],[54,150],[55,150]]}`|
|10015|`{"exp":200,"attrs":[[1,324000],[2,54000],[24,32400],[25,32400],[5,400],[6,400],[26,400],[27,400],[54,150],[55,150]]}`|
|10016|`{"exp":200,"attrs":[[1,378000],[2,54000],[24,40500],[25,32400],[5,400],[6,400],[26,400],[27,400],[54,150],[55,150]]}`|
|10017|`{"exp":200,"attrs":[[1,378000],[2,63000],[24,40500],[25,40500],[5,400],[6,400],[26,400],[27,400],[54,150],[55,150]]}`|
|10018|`{"exp":200,"attrs":[[1,432000],[2,63000],[24,48600],[25,40500],[5,400],[6,400],[26,400],[27,400],[54,300],[55,300]]}`|
|10019|`{"exp":200,"attrs":[[1,432000],[2,72000],[24,48600],[25,48600],[5,400],[6,400],[26,400],[27,400],[54,300],[55,300]]}`|
|10020|`{"exp":200,"attrs":[[1,486000],[2,81000],[24,48600],[25,48600],[5,400],[6,400],[26,400],[27,400],[54,300],[55,300]]}`|
|10021|`{"exp":200,"attrs":[[1,540000],[2,81000],[24,56700],[25,48600],[5,800],[6,400],[26,800],[27,400],[54,300],[55,300]]}`|
|10022|`{"exp":200,"attrs":[[1,540000],[2,90000],[24,56700],[25,56700],[5,800],[6,400],[26,800],[27,400],[54,300],[55,300]]}`|
|10023|`{"exp":200,"attrs":[[1,594000],[2,90000],[24,64800],[25,56700],[5,800],[6,400],[26,800],[27,400],[54,300],[55,300]]}`|
|10024|`{"exp":200,"attrs":[[1,594000],[2,99000],[24,64800],[25,64800],[5,800],[6,800],[26,800],[27,800],[54,300],[55,300]]}`|
|10025|`{"exp":200,"attrs":[[1,648000],[2,108000],[24,64800],[25,64800],[5,800],[6,800],[26,800],[27,800],[54,300],[55,300]]}`|
|10026|`{"exp":200,"attrs":[[1,702000],[2,108000],[24,72900],[25,64800],[5,800],[6,800],[26,800],[27,800],[54,300],[55,300]]}`|
|10027|`{"exp":200,"attrs":[[1,702000],[2,117000],[24,72900],[25,72900],[5,800],[6,800],[26,800],[27,800],[54,600],[55,600]]}`|
|10028|`{"exp":200,"attrs":[[1,756000],[2,117000],[24,81000],[25,72900],[5,800],[6,800],[26,800],[27,800],[54,600],[55,600]]}`|
|10029|`{"exp":200,"attrs":[[1,756000],[2,126000],[24,81000],[25,81000],[5,800],[6,800],[26,800],[27,800],[54,600],[55,600]]}`|
|10030|`{"exp":200,"attrs":[[1,810000],[2,135000],[24,81000],[25,81000],[5,1200],[6,800],[26,1200],[27,800],[54,600],[55,600]]}`|
|10031|`{"exp":200,"attrs":[[1,864000],[2,135000],[24,89100],[25,81000],[5,1200],[6,800],[26,1200],[27,800],[54,600],[55,600]]}`|
|10032|`{"exp":200,"attrs":[[1,864000],[2,144000],[24,89100],[25,89100],[5,1200],[6,800],[26,1200],[27,800],[54,600],[55,600]]}`|
|10033|`{"exp":200,"attrs":[[1,918000],[2,144000],[24,97200],[25,89100],[5,1200],[6,1200],[26,1200],[27,1200],[54,600],[55,600]]}`|
|10034|`{"exp":200,"attrs":[[1,918000],[2,153000],[24,97200],[25,97200],[5,1200],[6,1200],[26,1200],[27,1200],[54,600],[55,600]]}`|
|10035|`{"exp":200,"attrs":[[1,972000],[2,162000],[24,97200],[25,97200],[5,1200],[6,1200],[26,1200],[27,1200],[54,600],[55,600]]}`|
|10036|`{"exp":200,"attrs":[[1,1026000],[2,162000],[24,105300],[25,97200],[5,1200],[6,1200],[26,1200],[27,1200],[54,900],[55,900]]}`|
|10037|`{"exp":200,"attrs":[[1,1026000],[2,171000],[24,105300],[25,105300],[5,1200],[6,1200],[26,1200],[27,1200],[54,900],[55,900]]}`|
|10038|`{"exp":200,"attrs":[[1,1080000],[2,171000],[24,113400],[25,105300],[5,1200],[6,1200],[26,1200],[27,1200],[54,900],[55,900]]}`|
|10039|`{"exp":200,"attrs":[[1,1080000],[2,180000],[24,113400],[25,113400],[5,1600],[6,1200],[26,1600],[27,1200],[54,900],[55,900]]}`|
|10040|`{"exp":200,"attrs":[[1,1134000],[2,189000],[24,113400],[25,113400],[5,1600],[6,1200],[26,1600],[27,1200],[54,900],[55,900]]}`|
|10041|`{"exp":200,"attrs":[[1,1188000],[2,189000],[24,121500],[25,113400],[5,1600],[6,1200],[26,1600],[27,1200],[54,900],[55,900]]}`|
|10042|`{"exp":200,"attrs":[[1,1188000],[2,198000],[24,121500],[25,121500],[5,1600],[6,1600],[26,1600],[27,1600],[54,900],[55,900]]}`|
|10043|`{"exp":200,"attrs":[[1,1242000],[2,198000],[24,129600],[25,121500],[5,1600],[6,1600],[26,1600],[27,1600],[54,900],[55,900]]}`|
|10044|`{"exp":200,"attrs":[[1,1242000],[2,207000],[24,129600],[25,129600],[5,1600],[6,1600],[26,1600],[27,1600],[54,900],[55,900]]}`|
|10045|`{"exp":200,"attrs":[[1,1296000],[2,216000],[24,129600],[25,129600],[5,1600],[6,1600],[26,1600],[27,1600],[54,1200],[55,1200]]}`|
|10046|`{"exp":200,"attrs":[[1,1350000],[2,216000],[24,137700],[25,129600],[5,1600],[6,1600],[26,1600],[27,1600],[54,1200],[55,1200]]}`|
|10047|`{"exp":200,"attrs":[[1,1350000],[2,225000],[24,137700],[25,137700],[5,1600],[6,1600],[26,1600],[27,1600],[54,1200],[55,1200]]}`|
|10048|`{"exp":200,"attrs":[[1,1404000],[2,225000],[24,145800],[25,137700],[5,2000],[6,1600],[26,2000],[27,1600],[54,1200],[55,1200]]}`|
|10049|`{"exp":200,"attrs":[[1,1404000],[2,234000],[24,145800],[25,145800],[5,2000],[6,1600],[26,2000],[27,1600],[54,1200],[55,1200]]}`|
|10050|`{"exp":200,"attrs":[[1,1458000],[2,243000],[24,145800],[25,145800],[5,2000],[6,1600],[26,2000],[27,1600],[54,1200],[55,1200]]}`|
|10051|`{"exp":200,"attrs":[[1,1512000],[2,243000],[24,153900],[25,145800],[5,2000],[6,2000],[26,2000],[27,2000],[54,1200],[55,1200]]}`|
|10052|`{"exp":200,"attrs":[[1,1512000],[2,252000],[24,153900],[25,153900],[5,2000],[6,2000],[26,2000],[27,2000],[54,1200],[55,1200]]}`|
|10053|`{"exp":200,"attrs":[[1,1566000],[2,252000],[24,162000],[25,153900],[5,2000],[6,2000],[26,2000],[27,2000],[54,1200],[55,1200]]}`|
|10054|`{"exp":200,"attrs":[[1,1566000],[2,261000],[24,162000],[25,162000],[5,2000],[6,2000],[26,2000],[27,2000],[54,1500],[55,1500]]}`|
|10055|`{"exp":200,"attrs":[[1,1620000],[2,270000],[24,162000],[25,162000],[5,2000],[6,2000],[26,2000],[27,2000],[54,1500],[55,1500]]}`|
|10056|`{"exp":200,"attrs":[[1,1674000],[2,270000],[24,170100],[25,162000],[5,2000],[6,2000],[26,2000],[27,2000],[54,1500],[55,1500]]}`|
|10057|`{"exp":200,"attrs":[[1,1674000],[2,279000],[24,170100],[25,170100],[5,2400],[6,2000],[26,2400],[27,2000],[54,1500],[55,1500]]}`|
|10058|`{"exp":200,"attrs":[[1,1728000],[2,279000],[24,178200],[25,170100],[5,2400],[6,2000],[26,2400],[27,2000],[54,1500],[55,1500]]}`|
|10059|`{"exp":200,"attrs":[[1,1728000],[2,288000],[24,178200],[25,178200],[5,2400],[6,2000],[26,2400],[27,2000],[54,1500],[55,1500]]}`|
|10060|`{"exp":200,"attrs":[[1,1782000],[2,297000],[24,178200],[25,178200],[5,2400],[6,2400],[26,2400],[27,2400],[54,1500],[55,1500]]}`|
|10061|`{"exp":200,"attrs":[[1,1782000],[2,297000],[24,178200],[25,178200],[5,2400],[6,2400],[26,2400],[27,2400],[54,1500],[55,1500]]}`|
|10062|`{"exp":200,"attrs":[[1,1782000],[2,297000],[24,178200],[25,178200],[5,2400],[6,2400],[26,2400],[27,2400],[54,1500],[55,1500]]}`|
|10063|`{"exp":200,"attrs":[[1,1782000],[2,297000],[24,178200],[25,178200],[5,2400],[6,2400],[26,2400],[27,2400],[54,1800],[55,1800]]}`|
|10064|`{"exp":200,"attrs":[[1,1782000],[2,297000],[24,178200],[25,178200],[5,2400],[6,2400],[26,2400],[27,2400],[54,1800],[55,1800]]}`|
|10065|`{"exp":200,"attrs":[[1,1836000],[2,306000],[24,178200],[25,178200],[5,2400],[6,2400],[26,2400],[27,2400],[54,1800],[55,1800]]}`|
|10066|`{"exp":200,"attrs":[[1,1836000],[2,306000],[24,178200],[25,178200],[5,2800],[6,2400],[26,2800],[27,2400],[54,1800],[55,1800]]}`|
|10067|`{"exp":200,"attrs":[[1,1836000],[2,306000],[24,178200],[25,178200],[5,2800],[6,2400],[26,2800],[27,2400],[54,1800],[55,1800]]}`|
|10068|`{"exp":200,"attrs":[[1,1836000],[2,306000],[24,178200],[25,178200],[5,2800],[6,2400],[26,2800],[27,2400],[54,1800],[55,1800]]}`|
|10069|`{"exp":200,"attrs":[[1,1836000],[2,306000],[24,178200],[25,178200],[5,2800],[6,2800],[26,2800],[27,2800],[54,1800],[55,1800]]}`|
|10070|`{"exp":200,"attrs":[[1,1890000],[2,315000],[24,178200],[25,178200],[5,2800],[6,2800],[26,2800],[27,2800],[54,1800],[55,1800]]}`|
|10071|`{"exp":200,"attrs":[[1,1890000],[2,315000],[24,178200],[25,178200],[5,2800],[6,2800],[26,2800],[27,2800],[54,1800],[55,1800]]}`|
|10072|`{"exp":200,"attrs":[[1,1890000],[2,315000],[24,178200],[25,178200],[5,2800],[6,2800],[26,2800],[27,2800],[54,2100],[55,2100]]}`|
|10073|`{"exp":200,"attrs":[[1,1890000],[2,315000],[24,178200],[25,178200],[5,2800],[6,2800],[26,2800],[27,2800],[54,2100],[55,2100]]}`|
|10074|`{"exp":200,"attrs":[[1,1890000],[2,315000],[24,178200],[25,178200],[5,2800],[6,2800],[26,2800],[27,2800],[54,2100],[55,2100]]}`|
|10075|`{"exp":200,"attrs":[[1,1944000],[2,324000],[24,178200],[25,178200],[5,3200],[6,2800],[26,3200],[27,2800],[54,2100],[55,2100]]}`|
|10076|`{"exp":200,"attrs":[[1,1944000],[2,324000],[24,178200],[25,178200],[5,3200],[6,2800],[26,3200],[27,2800],[54,2100],[55,2100]]}`|
|10077|`{"exp":200,"attrs":[[1,1944000],[2,324000],[24,178200],[25,178200],[5,3200],[6,2800],[26,3200],[27,2800],[54,2100],[55,2100]]}`|
|10078|`{"exp":200,"attrs":[[1,1944000],[2,324000],[24,178200],[25,178200],[5,3200],[6,3200],[26,3200],[27,3200],[54,2100],[55,2100]]}`|
|10079|`{"exp":200,"attrs":[[1,1944000],[2,324000],[24,178200],[25,178200],[5,3200],[6,3200],[26,3200],[27,3200],[54,2100],[55,2100]]}`|
|10080|`{"exp":200,"attrs":[[1,1998000],[2,333000],[24,178200],[25,178200],[5,3200],[6,3200],[26,3200],[27,3200],[54,2100],[55,2100]]}`|
|10081|`{"exp":200,"attrs":[[1,1998000],[2,333000],[24,178200],[25,178200],[5,3200],[6,3200],[26,3200],[27,3200],[54,2400],[55,2400]]}`|
|10082|`{"exp":200,"attrs":[[1,1998000],[2,333000],[24,178200],[25,178200],[5,3200],[6,3200],[26,3200],[27,3200],[54,2400],[55,2400]]}`|
|10083|`{"exp":200,"attrs":[[1,1998000],[2,333000],[24,178200],[25,178200],[5,3200],[6,3200],[26,3200],[27,3200],[54,2400],[55,2400]]}`|
|10084|`{"exp":200,"attrs":[[1,1998000],[2,333000],[24,178200],[25,178200],[5,3600],[6,3200],[26,3600],[27,3200],[54,2400],[55,2400]]}`|
|10085|`{"exp":200,"attrs":[[1,2052000],[2,342000],[24,178200],[25,178200],[5,3600],[6,3200],[26,3600],[27,3200],[54,2400],[55,2400]]}`|
|10086|`{"exp":200,"attrs":[[1,2052000],[2,342000],[24,178200],[25,178200],[5,3600],[6,3200],[26,3600],[27,3200],[54,2400],[55,2400]]}`|
|10087|`{"exp":200,"attrs":[[1,2052000],[2,342000],[24,178200],[25,178200],[5,3600],[6,3600],[26,3600],[27,3600],[54,2400],[55,2400]]}`|
|10088|`{"exp":200,"attrs":[[1,2052000],[2,342000],[24,178200],[25,178200],[5,3600],[6,3600],[26,3600],[27,3600],[54,2400],[55,2400]]}`|
|10089|`{"exp":200,"attrs":[[1,2052000],[2,342000],[24,178200],[25,178200],[5,3600],[6,3600],[26,3600],[27,3600],[54,2400],[55,2400]]}`|
|10090|`{"exp":200,"attrs":[[1,2106000],[2,351000],[24,178200],[25,178200],[5,3600],[6,3600],[26,3600],[27,3600],[54,2700],[55,2700]]}`|
|10091|`{"exp":200,"attrs":[[1,2106000],[2,351000],[24,178200],[25,178200],[5,3600],[6,3600],[26,3600],[27,3600],[54,2700],[55,2700]]}`|
|10092|`{"exp":200,"attrs":[[1,2106000],[2,351000],[24,178200],[25,178200],[5,3600],[6,3600],[26,3600],[27,3600],[54,2700],[55,2700]]}`|
|10093|`{"exp":200,"attrs":[[1,2106000],[2,351000],[24,178200],[25,178200],[5,4000],[6,3600],[26,4000],[27,3600],[54,2700],[55,2700]]}`|
|10094|`{"exp":200,"attrs":[[1,2106000],[2,351000],[24,178200],[25,178200],[5,4000],[6,3600],[26,4000],[27,3600],[54,2700],[55,2700]]}`|
|10095|`{"exp":200,"attrs":[[1,2160000],[2,360000],[24,178200],[25,178200],[5,4000],[6,3600],[26,4000],[27,3600],[54,2700],[55,2700]]}`|
|10096|`{"exp":200,"attrs":[[1,2160000],[2,360000],[24,178200],[25,178200],[5,4000],[6,4000],[26,4000],[27,4000],[54,2700],[55,2700]]}`|
|10097|`{"exp":200,"attrs":[[1,2160000],[2,360000],[24,178200],[25,178200],[5,4000],[6,4000],[26,4000],[27,4000],[54,2700],[55,2700]]}`|
|10098|`{"exp":200,"attrs":[[1,2160000],[2,360000],[24,178200],[25,178200],[5,4000],[6,4000],[26,4000],[27,4000],[54,2700],[55,2700]]}`|
|10099|`{"exp":200,"attrs":[[1,2160000],[2,360000],[24,178200],[25,178200],[5,4000],[6,4000],[26,4000],[27,4000],[54,3000],[55,3000]]}`|
|10100|`{"exp":200,"attrs":[[1,2214000],[2,369000],[24,178200],[25,178200],[5,4000],[6,4000],[26,4000],[27,4000],[54,3000],[55,3000]]}`|

## BossDay

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|70|本表行键；与其他表同值不自动代表同一对象。|
|boss_skill|number|70|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|self_attr|array|70|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|boss|number|70|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|season|number|70|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|fight_tid|number|70|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|self_skill|number|70|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|boss_attr|array|70|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|rank_type|number|70|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|score_type|number|70|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"boss_skill":260040101,"self_attr":[],"fight_tid":8900001,"self_skill":260040106,"boss_attr":[],"rank_type":1,"score_type":1}`|
|102|`{"boss_skill":260040103,"self_attr":[[66,3000]],"fight_tid":8900002,"self_skill":0,"boss_attr":[],"rank_type":1,"score_type":1}`|
|103|`{"boss_skill":260040102,"self_attr":[[59,5000]],"fight_tid":8900003,"self_skill":0,"boss_attr":[],"rank_type":1,"score_type":1}`|
|104|`{"boss_skill":260040104,"self_attr":[[57,2000]],"fight_tid":8900004,"self_skill":0,"boss_attr":[[55,3000]],"rank_type":1,"score_type":1}`|
|105|`{"boss_skill":260040105,"self_attr":[[65,5000]],"fight_tid":8900005,"self_skill":0,"boss_attr":[[68,7000]],"rank_type":1,"score_type":1}`|
|106|`{"boss_skill":260040101,"self_attr":[],"fight_tid":8900006,"self_skill":260040106,"boss_attr":[],"rank_type":1,"score_type":1}`|
|107|`{"boss_skill":260040103,"self_attr":[[66,3000]],"fight_tid":8900007,"self_skill":0,"boss_attr":[],"rank_type":1,"score_type":1}`|
|108|`{"boss_skill":260040102,"self_attr":[[59,5000]],"fight_tid":8900008,"self_skill":0,"boss_attr":[],"rank_type":1,"score_type":1}`|
|109|`{"boss_skill":260040104,"self_attr":[[57,2000]],"fight_tid":8900009,"self_skill":0,"boss_attr":[[55,3000]],"rank_type":1,"score_type":1}`|
|110|`{"boss_skill":260040105,"self_attr":[[65,5000]],"fight_tid":8900010,"self_skill":0,"boss_attr":[[68,7000]],"rank_type":1,"score_type":1}`|
|111|`{"boss_skill":260040101,"self_attr":[],"fight_tid":8900011,"self_skill":260040106,"boss_attr":[],"rank_type":1,"score_type":1}`|
|112|`{"boss_skill":260040103,"self_attr":[[66,3000]],"fight_tid":8900012,"self_skill":0,"boss_attr":[],"rank_type":1,"score_type":1}`|
|113|`{"boss_skill":260040102,"self_attr":[[59,5000]],"fight_tid":8900013,"self_skill":0,"boss_attr":[],"rank_type":1,"score_type":1}`|
|114|`{"boss_skill":260040104,"self_attr":[[57,2000]],"fight_tid":8900014,"self_skill":0,"boss_attr":[[55,3000]],"rank_type":1,"score_type":1}`|
|115|`{"boss_skill":260040105,"self_attr":[[65,5000]],"fight_tid":8900015,"self_skill":0,"boss_attr":[[68,7000]],"rank_type":1,"score_type":1}`|
|116|`{"boss_skill":260040101,"self_attr":[],"fight_tid":8900016,"self_skill":260040106,"boss_attr":[],"rank_type":1,"score_type":1}`|
|117|`{"boss_skill":260040103,"self_attr":[[66,3000]],"fight_tid":8900017,"self_skill":0,"boss_attr":[],"rank_type":1,"score_type":1}`|
|118|`{"boss_skill":260040102,"self_attr":[[59,5000]],"fight_tid":8900018,"self_skill":0,"boss_attr":[],"rank_type":1,"score_type":1}`|
|119|`{"boss_skill":260040104,"self_attr":[[57,2000]],"fight_tid":8900019,"self_skill":0,"boss_attr":[[55,3000]],"rank_type":1,"score_type":1}`|
|120|`{"boss_skill":260040105,"self_attr":[[65,5000]],"fight_tid":8900020,"self_skill":0,"boss_attr":[[68,7000]],"rank_type":1,"score_type":1}`|
|121|`{"boss_skill":260040101,"self_attr":[],"fight_tid":8900021,"self_skill":260040106,"boss_attr":[],"rank_type":1,"score_type":1}`|
|122|`{"boss_skill":260040103,"self_attr":[[66,3000]],"fight_tid":8900022,"self_skill":0,"boss_attr":[],"rank_type":1,"score_type":1}`|
|123|`{"boss_skill":260040102,"self_attr":[[59,5000]],"fight_tid":8900023,"self_skill":0,"boss_attr":[],"rank_type":1,"score_type":1}`|
|124|`{"boss_skill":260040104,"self_attr":[[57,2000]],"fight_tid":8900024,"self_skill":0,"boss_attr":[[55,3000]],"rank_type":1,"score_type":1}`|
|125|`{"boss_skill":260040105,"self_attr":[[65,5000]],"fight_tid":8900025,"self_skill":0,"boss_attr":[[68,7000]],"rank_type":1,"score_type":1}`|
|126|`{"boss_skill":260040101,"self_attr":[],"fight_tid":8900026,"self_skill":260040106,"boss_attr":[],"rank_type":1,"score_type":1}`|
|127|`{"boss_skill":260040103,"self_attr":[[66,3000]],"fight_tid":8900027,"self_skill":0,"boss_attr":[],"rank_type":1,"score_type":1}`|
|128|`{"boss_skill":260040102,"self_attr":[[59,5000]],"fight_tid":8900028,"self_skill":0,"boss_attr":[],"rank_type":1,"score_type":1}`|
|129|`{"boss_skill":260040104,"self_attr":[[57,2000]],"fight_tid":8900029,"self_skill":0,"boss_attr":[[55,3000]],"rank_type":1,"score_type":1}`|
|130|`{"boss_skill":260040105,"self_attr":[[65,5000]],"fight_tid":8900030,"self_skill":0,"boss_attr":[[68,7000]],"rank_type":1,"score_type":1}`|
|131|`{"boss_skill":260040101,"self_attr":[],"fight_tid":8900031,"self_skill":260040106,"boss_attr":[],"rank_type":1,"score_type":1}`|
|132|`{"boss_skill":260040103,"self_attr":[[66,3000]],"fight_tid":8900032,"self_skill":0,"boss_attr":[],"rank_type":1,"score_type":1}`|
|133|`{"boss_skill":260040102,"self_attr":[[59,5000]],"fight_tid":8900033,"self_skill":0,"boss_attr":[],"rank_type":1,"score_type":1}`|
|134|`{"boss_skill":260040104,"self_attr":[[57,2000]],"fight_tid":8900034,"self_skill":0,"boss_attr":[[55,3000]],"rank_type":1,"score_type":1}`|
|135|`{"boss_skill":260040105,"self_attr":[[65,5000]],"fight_tid":8900035,"self_skill":0,"boss_attr":[[68,7000]],"rank_type":1,"score_type":1}`|
|136|`{"boss_skill":260040101,"self_attr":[],"fight_tid":8900036,"self_skill":260040106,"boss_attr":[],"rank_type":1,"score_type":1}`|
|137|`{"boss_skill":260040103,"self_attr":[[66,3000]],"fight_tid":8900037,"self_skill":0,"boss_attr":[],"rank_type":1,"score_type":1}`|
|138|`{"boss_skill":260040102,"self_attr":[[59,5000]],"fight_tid":8900038,"self_skill":0,"boss_attr":[],"rank_type":1,"score_type":1}`|
|139|`{"boss_skill":260040104,"self_attr":[[57,2000]],"fight_tid":8900039,"self_skill":0,"boss_attr":[[55,3000]],"rank_type":1,"score_type":1}`|
|140|`{"boss_skill":260040105,"self_attr":[[65,5000]],"fight_tid":8900040,"self_skill":0,"boss_attr":[[68,7000]],"rank_type":1,"score_type":1}`|
|141|`{"boss_skill":260040101,"self_attr":[],"fight_tid":8900041,"self_skill":260040106,"boss_attr":[],"rank_type":1,"score_type":1}`|
|142|`{"boss_skill":260040103,"self_attr":[[66,3000]],"fight_tid":8900042,"self_skill":0,"boss_attr":[],"rank_type":1,"score_type":1}`|
|143|`{"boss_skill":260040102,"self_attr":[[59,5000]],"fight_tid":8900043,"self_skill":0,"boss_attr":[],"rank_type":1,"score_type":1}`|
|144|`{"boss_skill":260040104,"self_attr":[[57,2000]],"fight_tid":8900044,"self_skill":0,"boss_attr":[[55,3000]],"rank_type":1,"score_type":1}`|
|145|`{"boss_skill":260040105,"self_attr":[[65,5000]],"fight_tid":8900045,"self_skill":0,"boss_attr":[[68,7000]],"rank_type":1,"score_type":1}`|
|146|`{"boss_skill":260040101,"self_attr":[],"fight_tid":8900046,"self_skill":260040106,"boss_attr":[],"rank_type":1,"score_type":1}`|
|147|`{"boss_skill":260040103,"self_attr":[[66,3000]],"fight_tid":8900047,"self_skill":0,"boss_attr":[],"rank_type":1,"score_type":1}`|
|148|`{"boss_skill":260040102,"self_attr":[[59,5000]],"fight_tid":8900048,"self_skill":0,"boss_attr":[],"rank_type":1,"score_type":1}`|
|149|`{"boss_skill":260040104,"self_attr":[[57,2000]],"fight_tid":8900049,"self_skill":0,"boss_attr":[[55,3000]],"rank_type":1,"score_type":1}`|
|150|`{"boss_skill":260040105,"self_attr":[[65,5000]],"fight_tid":8900050,"self_skill":0,"boss_attr":[[68,7000]],"rank_type":1,"score_type":1}`|
|151|`{"boss_skill":260040101,"self_attr":[],"fight_tid":8900051,"self_skill":260040106,"boss_attr":[],"rank_type":1,"score_type":1}`|
|152|`{"boss_skill":260040103,"self_attr":[[66,3000]],"fight_tid":8900052,"self_skill":0,"boss_attr":[],"rank_type":1,"score_type":1}`|
|153|`{"boss_skill":260040102,"self_attr":[[59,5000]],"fight_tid":8900053,"self_skill":0,"boss_attr":[],"rank_type":1,"score_type":1}`|
|154|`{"boss_skill":260040104,"self_attr":[[57,2000]],"fight_tid":8900054,"self_skill":0,"boss_attr":[[55,3000]],"rank_type":1,"score_type":1}`|
|155|`{"boss_skill":260040105,"self_attr":[[65,5000]],"fight_tid":8900055,"self_skill":0,"boss_attr":[[68,7000]],"rank_type":1,"score_type":1}`|
|156|`{"boss_skill":260040101,"self_attr":[],"fight_tid":8900056,"self_skill":260040106,"boss_attr":[],"rank_type":1,"score_type":1}`|
|157|`{"boss_skill":260040103,"self_attr":[[66,3000]],"fight_tid":8900057,"self_skill":0,"boss_attr":[],"rank_type":1,"score_type":1}`|
|158|`{"boss_skill":260040102,"self_attr":[[59,5000]],"fight_tid":8900058,"self_skill":0,"boss_attr":[],"rank_type":1,"score_type":1}`|
|159|`{"boss_skill":260040104,"self_attr":[[57,2000]],"fight_tid":8900059,"self_skill":0,"boss_attr":[[55,3000]],"rank_type":1,"score_type":1}`|
|160|`{"boss_skill":260040105,"self_attr":[[65,5000]],"fight_tid":8900060,"self_skill":0,"boss_attr":[[68,7000]],"rank_type":1,"score_type":1}`|
|161|`{"boss_skill":260040101,"self_attr":[],"fight_tid":8900061,"self_skill":260040106,"boss_attr":[],"rank_type":1,"score_type":1}`|
|162|`{"boss_skill":260040103,"self_attr":[[66,3000]],"fight_tid":8900062,"self_skill":0,"boss_attr":[],"rank_type":1,"score_type":1}`|
|163|`{"boss_skill":260040102,"self_attr":[[59,5000]],"fight_tid":8900063,"self_skill":0,"boss_attr":[],"rank_type":1,"score_type":1}`|
|164|`{"boss_skill":260040104,"self_attr":[[57,2000]],"fight_tid":8900064,"self_skill":0,"boss_attr":[[55,3000]],"rank_type":1,"score_type":1}`|
|165|`{"boss_skill":260040105,"self_attr":[[65,5000]],"fight_tid":8900065,"self_skill":0,"boss_attr":[[68,7000]],"rank_type":1,"score_type":1}`|
|166|`{"boss_skill":260040101,"self_attr":[],"fight_tid":8900066,"self_skill":260040106,"boss_attr":[],"rank_type":1,"score_type":1}`|
|167|`{"boss_skill":260040103,"self_attr":[[66,3000]],"fight_tid":8900067,"self_skill":0,"boss_attr":[],"rank_type":1,"score_type":1}`|
|168|`{"boss_skill":260040102,"self_attr":[[59,5000]],"fight_tid":8900068,"self_skill":0,"boss_attr":[],"rank_type":1,"score_type":1}`|
|169|`{"boss_skill":260040104,"self_attr":[[57,2000]],"fight_tid":8900069,"self_skill":0,"boss_attr":[[55,3000]],"rank_type":1,"score_type":1}`|
|170|`{"boss_skill":260040105,"self_attr":[[65,5000]],"fight_tid":8900070,"self_skill":0,"boss_attr":[[68,7000]],"rank_type":1,"score_type":1}`|

## BossConst

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|attack_cd|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"attack_cd":5000}`|

## BossRankAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|11|本表行键；与其他表同值不自动代表同一对象。|
|score_range|array|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|11|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|type|number|11|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"score_range":[1,1],"award":[[5101900,1000],[317002,1],[151320111,15]],"type":1}`|
|102|`{"score_range":[2,5],"award":[[5101900,900],[318002,1],[151320111,13]],"type":1}`|
|103|`{"score_range":[6,10],"award":[[5101900,850],[318002,1],[151320111,11]],"type":1}`|
|104|`{"score_range":[11,20],"award":[[5101900,800],[319002,1],[151320111,10]],"type":1}`|
|105|`{"score_range":[21,50],"award":[[5101900,750],[319002,1],[151320111,9]],"type":1}`|
|106|`{"score_range":[51,100],"award":[[5101900,700],[320002,1],[151320111,8]],"type":1}`|
|107|`{"score_range":[101,200],"award":[[5101900,650],[312002,1],[151320111,7]],"type":1}`|
|108|`{"score_range":[201,500],"award":[[5101900,600],[321002,1],[151320111,6]],"type":1}`|
|109|`{"score_range":[501,1000],"award":[[5101900,550],[322002,1],[151320111,5]],"type":1}`|
|110|`{"score_range":[2001,2000],"award":[[5101900,500],[323002,1],[151320111,5]],"type":1}`|
|111|`{"score_range":[2001,9999],"award":[[5101900,400],[306002,1],[151320111,5]],"type":1}`|

## BossFightAward

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|3|本表行键；与其他表同值不自动代表同一对象。|
|score_range|array|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|award|array|3|原奖励结构；对象ID、数量、随机库等形状按本行及对应消费者区分。|
|type|number|3|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|101|`{"score_range":[1,1000],"award":[[324002,25],[300002,1]],"type":1}`|
|102|`{"score_range":[1001,2000],"award":[[324002,28],[300002,1]],"type":1}`|
|103|`{"score_range":[2001,99999],"award":[[324002,30],[300002,1]],"type":1}`|

## BossShow

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|rotation|undefined|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pos_offset|undefined|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|model|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|title_desc|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|6|本表行键；与其他表同值不自动代表同一对象。|
|scale|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|des|number|6|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{}`|
|2|`{}`|
|3|`{}`|
|4|`{}`|
|5|`{}`|
|6|`{}`|

## Boss

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|open_day|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|tid|number|1|本表行键；与其他表同值不自动代表同一对象。|
|end_flush|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|day_times|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|start_flush|number|1|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"open_day":3,"day_times":8,"start_flush":101000001}`|
