# PlayerDataTable 规则参数

来源：[personal-server/assets/tables/PlayerDataTable.data.lua.json.gz](../../../../personal-server/assets/tables/PlayerDataTable.data.lua.json.gz)，SHA256：`db8e42f1b7f67484211bd8ef5759c1a0a124dce58e3d0f0fcf84ee668d449b45`。

[完整逐行JSON](PlayerDataTable.json)保留全部已恢复字段与全部行，不截断数值；数组顺序、0、false、null原样保留。缺字段表示解析输出没有该字段，不补0。外部reference只是符号，未执行；未恢复的子表单列。这里的“已解行”不等于该表全部玩法语义或原服动态逻辑已还原。

|子表|行数|配置恢复状态|
|---|---:|---|
|[Func](#func)|2|decoded-rows|
|[Block](#block)|72|rows-with-external-references|
|[Type](#type)|38|decoded-rows|

## Func

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|2|本表行键；与其他表同值不自动代表同一对象。|
|lineup|array|2|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|8|`{}`|
|113|`{}`|

## Block

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|72|本表行键；与其他表同值不自动代表同一对象。|
|pb_struct_name|string|72|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|self_func|object/undefined|72|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|line_up|array|72|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|effect_time|number|72|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|pb_struct_type|string|72|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|
|is_pb|boolean|72|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"self_func":{"reference":"PlayerDataSelfUtil.PlayerInfo"},"pb_struct_type":"pb_player_info","is_pb":true}`|
|2|`{"self_func":{"reference":"PlayerDataSelfUtil.GuildInfo"},"pb_struct_type":"pb_player_guild","is_pb":true}`|
|3|`{"self_func":{"reference":"PlayerDataSelfUtil.Lineup"},"pb_struct_type":"pb_player_lineup","is_pb":true}`|
|4|`{"self_func":{"reference":"PlayerDataSelfUtil.LoginInfo"},"pb_struct_type":"pb_player_login","is_pb":true}`|
|5|`{"self_func":{"reference":"PlayerDataSelfUtil.MissionInfo"},"pb_struct_type":"uint32","is_pb":false}`|
|6|`{"self_func":{"reference":"PlayerDataSelfUtil.TowerInfo"},"pb_struct_type":"uint32","is_pb":false}`|
|7|`{"self_func":{"reference":"PlayerDataSelfUtil.ArtInfo"},"pb_struct_type":"pb_player_artifact","is_pb":true}`|
|8|`{"self_func":{"reference":"PlayerDataSelfUtil.SupportInfo"},"pb_struct_type":"pb_supported","is_pb":true}`|
|10|`{"pb_struct_type":"pb_guild_magic_block","is_pb":true}`|
|12|`{"pb_struct_type":"pb_skin_block","is_pb":true}`|
|13|`{"pb_struct_type":"pb_role_figure_block","is_pb":true}`|
|14|`{"pb_struct_type":"pb_detail_artifact_block","is_pb":true}`|
|15|`{"pb_struct_type":"pb_player_war_rune_block","is_pb":true}`|
|16|`{"pb_struct_type":"pb_attr_lineup_all_info","is_pb":true}`|
|17|`{"pb_struct_type":"pb_destiny_data","is_pb":true}`|
|18|`{"pb_struct_type":"pb_player_campsite","is_pb":true}`|
|19|`{"pb_struct_type":"pb_tactics_master","is_pb":true}`|
|20|`{"self_func":{"reference":"PlayerDataSelfUtil.SwapArenaRank"},"pb_struct_type":"pb_swap_arena_role_brief","is_pb":true}`|
|21|`{"pb_struct_type":"pb_hero_all_handbook_record","is_pb":true}`|
|22|`{"pb_struct_type":"pb_role_hero_favour","is_pb":true}`|
|24|`{"pb_struct_type":"uint32","is_pb":false}`|
|25|`{"self_func":{"reference":"PlayerDataSelfUtil.HunterArenaPlaces"},"pb_struct_type":"pb_hunter_role_palace","is_pb":true}`|
|26|`{"self_func":{"reference":"PlayerDataSelfUtil.Lineup"},"pb_struct_type":"pb_player_lineup","is_pb":true}`|
|27|`{"self_func":{"reference":"PlayerDataSelfUtil.TournamentPlaces"},"pb_struct_type":"pb_tournament_player_data","is_pb":true}`|
|28|`{"self_func":{"reference":"PlayerDataSelfUtil.Lineup"},"pb_struct_type":"pb_player_lineup","is_pb":true}`|
|29|`{"self_func":{"reference":"PlayerDataSelfUtil.ScarletTrailLineup"},"pb_struct_type":"pb_player_lineup","is_pb":true}`|
|30|`{"pb_struct_type":"pb_hero_blazon_block","is_pb":true}`|
|31|`{"pb_struct_type":"uint32","is_pb":false}`|
|32|`{"pb_struct_type":"pb_time_temple_block","is_pb":true}`|
|33|`{"self_func":{"reference":"PlayerDataSelfUtil.PetDevelop"},"pb_struct_type":"pb_pet_play_data_block","is_pb":true}`|
|34|`{"self_func":{"reference":"PlayerDataSelfUtil.MartialEmploy"},"pb_struct_type":"pb_martial_club_employ_role","is_pb":true}`|
|35|`{"self_func":{"reference":"PlayerDataSelfUtil.FunOpen"},"pb_struct_type":"binary","is_pb":false}`|
|36|`{"pb_struct_type":"pb_magic_circle_role","is_pb":true}`|
|37|`{"self_func":{"reference":"PlayerDataSelfUtil.Lineup"},"pb_struct_type":"pb_player_lineup","is_pb":true}`|
|38|`{"self_func":{"reference":"PlayerDataSelfUtil.Lineup"},"pb_struct_type":"pb_player_lineup","is_pb":true}`|
|39|`{"self_func":{"reference":"PlayerDataSelfUtil.Lineup"},"pb_struct_type":"pb_player_lineup","is_pb":true}`|
|40|`{"self_func":{"reference":"PlayerDataSelfUtil.PreLineup"},"pb_struct_type":"pb_player_lineup","is_pb":true}`|
|41|`{"pb_struct_type":"pb_treasure_player_data_block","is_pb":true}`|
|42|`{"self_func":{"reference":"PlayerDataSelfUtil.ElvesInfo"},"pb_struct_type":"pb_elves_play_data_block","is_pb":true}`|
|43|`{"self_func":{"reference":"PlayerDataSelfUtil.ElvesInfo"},"pb_struct_type":"pb_friend_data_block","is_pb":true}`|
|44|`{"self_func":{"reference":"PlayerDataSelfUtil.RoleEquipInfo"},"pb_struct_type":"pb_leader_equip_role_data","is_pb":true}`|
|45|`{"self_func":{"reference":"PlayerDataSelfUtil.Lineup"},"pb_struct_type":"pb_player_lineup","is_pb":true}`|
|46|`{"self_func":{"reference":"PlayerDataSelfUtil.Lineup"},"pb_struct_type":"pb_player_lineup","is_pb":true}`|
|47|`{"self_func":{"reference":"PlayerDataSelfUtil.Lineup"},"pb_struct_type":"pb_player_lineup","is_pb":true}`|
|48|`{"self_func":{"reference":"PlayerDataSelfUtil.Lineup"},"pb_struct_type":"pb_player_lineup","is_pb":true}`|
|49|`{"self_func":{"reference":"PlayerDataSelfUtil.Lineup"},"pb_struct_type":"pb_player_lineup","is_pb":true}`|
|50|`{"self_func":{"reference":"PlayerDataSelfUtil.Lineup"},"pb_struct_type":"pb_player_lineup","is_pb":true}`|
|51|`{"self_func":{"reference":"PlayerDataSelfUtil.Lineup"},"pb_struct_type":"pb_player_lineup","is_pb":true}`|
|52|`{"self_func":{"reference":"PlayerDataSelfUtil.Lineup"},"pb_struct_type":"pb_player_lineup","is_pb":true}`|
|53|`{"self_func":{"reference":"PlayerDataSelfUtil.Lineup"},"pb_struct_type":"pb_player_lineup","is_pb":true}`|
|54|`{"self_func":{"reference":"PlayerDataSelfUtil.Lineup"},"pb_struct_type":"pb_player_lineup","is_pb":true}`|
|56|`{"self_func":{"reference":"PlayerDataSelfUtil.Lineup"},"pb_struct_type":"pb_player_lineup","is_pb":true}`|
|58|`{"self_func":{"reference":"PlayerDataSelfUtil.Lineup"},"pb_struct_type":"pb_player_lineup","is_pb":true}`|
|59|`{"self_func":{"reference":"PlayerDataSelfUtil.SummerGunInfo"},"pb_struct_type":"pb_player_summer_water_list","is_pb":true}`|
|60|`{"self_func":{"reference":"PlayerDataSelfUtil.Lineup"},"pb_struct_type":"pb_player_lineup","is_pb":true}`|
|61|`{"self_func":{"reference":"PlayerDataSelfUtil.SummerPvpInfo"},"pb_struct_type":"pb_player_summer_pvp_list","is_pb":true}`|
|62|`{"self_func":{"reference":"PlayerDataSelfUtil.Lineup"},"pb_struct_type":"pb_player_lineup","is_pb":true}`|
|63|`{"self_func":{"reference":"PlayerDataSelfUtil.Lineup"},"pb_struct_type":"pb_player_lineup","is_pb":true}`|
|64|`{"self_func":{"reference":"PlayerDataSelfUtil.Lineup"},"pb_struct_type":"pb_player_lineup","is_pb":true}`|
|65|`{"self_func":{"reference":"PlayerDataSelfUtil.Lineup"},"pb_struct_type":"pb_player_lineup","is_pb":true}`|
|66|`{"self_func":{"reference":"PlayerDataSelfUtil.Lineup"},"pb_struct_type":"pb_player_lineup","is_pb":true}`|
|67|`{"self_func":{"reference":"PlayerDataSelfUtil.Lineup"},"pb_struct_type":"pb_player_lineup","is_pb":true}`|
|68|`{"self_func":{"reference":"PlayerDataSelfUtil.Lineup"},"pb_struct_type":"pb_player_lineup","is_pb":true}`|
|69|`{"self_func":{"reference":"PlayerDataSelfUtil.Lineup"},"pb_struct_type":"pb_player_lineup","is_pb":true}`|
|70|`{"self_func":{"reference":"PlayerDataSelfUtil.Lineup"},"pb_struct_type":"pb_player_lineup","is_pb":true}`|
|71|`{"self_func":{"reference":"PlayerDataSelfUtil.Lineup"},"pb_struct_type":"pb_player_lineup","is_pb":true}`|
|72|`{"self_func":{"reference":"PlayerDataSelfUtil.Lineup"},"pb_struct_type":"pb_player_lineup","is_pb":true}`|
|73|`{"self_func":{"reference":"PlayerDataSelfUtil.Lineup"},"pb_struct_type":"pb_player_lineup","is_pb":true}`|
|80|`{"self_func":{"reference":"PlayerDataSelfUtil.Lineup"},"pb_struct_type":"pb_player_lineup","is_pb":true}`|
|81|`{"pb_struct_type":"pb_source_point_player_data_block","is_pb":true}`|
|82|`{"self_func":{"reference":"PlayerDataSelfUtil.BattleTriMatch"},"pb_struct_type":"pb_battle_tri_match_playing_lineup_data","is_pb":true}`|
|83|`{"self_func":{"reference":"PlayerDataSelfUtil.BattleTriMatch"},"pb_struct_type":"pb_battle_tri_match_role_equip_data","is_pb":true}`|

## Type

|字段|输出类型|有字段行数|含义/解释边界|
|---|---|---:|---|
|tid|number|38|本表行键；与其他表同值不自动代表同一对象。|
|block|array|38|原字段原值；具体语义见对应规则册/消费者，未解释部分保留未知。|

以下逐行列出全部规则字段；纯表现字段仍保存在JSON。

|tid|规则原值|
|---:|---|
|1|`{"block":[1,8,3]}`|
|2|`{"block":[1,2,3,7,8,5,6,20]}`|
|3|`{"block":[1,4]}`|
|4|`{"block":[1,4,3,5,43]}`|
|5|`{"block":[1,4,2,3,24]}`|
|6|`{"block":[1,3]}`|
|7|`{"block":[1,3,7,16,6,20,15,19,14,5,17,18,21,22,30,32,33,35,36,41,42,44,81]}`|
|8|`{"block":[1,2,3]}`|
|9|`{"block":[1,4,3,2,34]}`|
|11|`{"block":[1,6,2]}`|
|12|`{"block":[1,25,2,3,39,70]}`|
|13|`{"block":[1,26,3,2,37,49,53]}`|
|14|`{"block":[1,27,28,2,71]}`|
|15|`{"block":[1,8,3,2,40]}`|
|16|`{"block":[1,29,2]}`|
|17|`{"block":[1,31,2,3]}`|
|18|`{"block":[1,3,7,6,20,5,2,33,40,42,43,14]}`|
|19|`{"block":[1,3,16]}`|
|20|`{"block":[1,3]}`|
|21|`{"block":[1,2,3,7,8,5,6,20,38,47,48,69]}`|
|22|`{"block":[1,45,2,3,8]}`|
|23|`{"block":[1,2,46]}`|
|24|`{"block":[1,2,7,8,5,6,20,54,33,42]}`|
|25|`{"block":[1,56,2,8]}`|
|26|`{"block":[1,2,58]}`|
|27|`{"block":[1,7,33,42,59,60,61,2]}`|
|28|`{"block":[1,2,3,7,8,5,6,20,62]}`|
|29|`{"block":[1,2,3,7,8,5,6,20,63]}`|
|30|`{"block":[1,2,3,7,8,5,6,20,64]}`|
|31|`{"block":[1,2,3,7,8,5,6,20,65]}`|
|32|`{"block":[1,2,3,7,8,5,6,20,66]}`|
|33|`{"block":[1,2,3,7,8,5,6,20,67]}`|
|34|`{"block":[1,2,3,7,8,5,6,20,68]}`|
|35|`{"block":[1,2,3,7,8,5,6,20]}`|
|36|`{"block":[1,72,3,2]}`|
|37|`{"block":[1,73,3,2]}`|
|40|`{"block":[1,2,7,33,42,80]}`|
|41|`{"block":[1,6,20,5,2,43,82,83]}`|
