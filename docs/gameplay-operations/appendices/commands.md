# 全部 1407 条 C2S 命令对照

重建日期：2026-11-15，路由审计快照为2026-11-14。本表覆盖已恢复的静态C2S目录，不证明全部原版内容已取得或业务正确。`responseRuntimeVerification=unverified`是本静态审计口径，不否认独立历史TCP验证；编码冲突为启发式线索，不能批量改编码。执行规则见[最终R1裁定](../rules/final-rule-register.md)。

|type|命令|任务|路由/所有者|请求：原声明 → 当前识别|响应 schema|审计缺口|
|---:|---|---|---|---|---|---|
|10|gm_cmd|ROLE-UNKNOWN|service_route/roleService|unverified → conditional|—|response_schema_missing, request_encoding_unverified|
|104|record_sundry|ROLE-ROLE|service_route/roleService|etf → conditional|pb_role_sundry_item|request_encoding_unverified|
|105|record_pass_all_mission|ROLE-ROLE|service_route/roleService|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|106|request_role_list|ROLE-ROLE|service_route/roleService|etf → conditional|pb_account_roles|request_encoding_unverified|
|108|req_remove_operate_display|ROLE-ROLE|gateway_route/gateway|etf → unverified|—|response_schema_missing, request_encoding_unverified|
|109|req_ensure_net_ok|ROLE-LOGIN|service_route/roleService|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|110|req_role_set_recommend_lv|ROLE-ROLE|service_route/roleService|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|111|req_role_check_veteran|ROLE-ROLE|service_route/roleService|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|112|req_role_veteran_skip|ROLE-ROLE|service_route/roleService|etf → conditional|pb_res_to_client|request_encoding_unverified|
|151|use_box|ITEM-ITEM|service_route/itemBox|protobuf → conditional/simple_use|pb_res_to_client|request_encoding_unverified|
|152|use_selected_box|ITEM-ITEM|service_route/itemBox|protobuf → conditional/selected_use|pb_res_to_client|request_encoding_unverified|
|153|use_repeat_box|ITEM-ITEM|service_route/itemBox|etf → conditional|pb_res_to_client|request_encoding_unverified|
|154|manual_convert_item|ITEM-ITEM|service_route/itemBox|etf → conditional|pb_res_to_client|request_encoding_unverified|
|155|use_selected_suit_box|ITEM-ITEM|service_route/itemBox|etf → conditional|pb_res_to_client|request_encoding_unverified|
|156|req_chip_compose|ITEM-ITEM|service_route/itemBox|protobuf → conditional/simple_use|pb_res_to_client|request_encoding_unverified|
|157|batch_use_box|ITEM-ITEM|service_route/itemBox|protobuf → conditional/pb_batch_use_box_req|pb_res_to_client|request_encoding_unverified|
|158|req_one_key_chip_compose|ITEM-ITEM|service_route/itemBox|protobuf → conditional/pb_one_key_compose|pb_res_to_client|request_encoding_unverified|
|159|req_one_key_use_item|ITEM-ITEM|service_route/itemBox|protobuf → conditional/pb_one_key_use|pb_res_to_client|request_encoding_unverified|
|161|req_player_data|ROLE-PLAYERDATA|service_route/roleService|protobuf → conditional/pb_function_cache_req|pb_function_cache_back|request_encoding_unverified|
|171|req_guild_data|SOC-GUILDDATA|service_route/guildSociety|protobuf → protobuf/pb_function_cache_req|pb_function_cache_back||
|201|fight_start|BATTLE-FIGHT|service_route/fight|protobuf → conditional/pb_fight_request|pb_fight_response|request_encoding_unverified|
|202|fight_exit|BATTLE-FIGHT|service_route/fight|protobuf → conditional/pb_fight_exit|—|response_schema_missing, request_encoding_unverified|
|203|get_fight_report|BATTLE-FIGHT|service_route/fight|protobuf → conditional/pb_get_fight_report|pb_fight_report_res|request_encoding_unverified|
|204|get_fight_report_battle|BATTLE-FIGHT|service_route/fight|protobuf → conditional/pb_get_fight_report|pb_fight_report_res|request_encoding_unverified|
|205|share_report|BATTLE-FIGHT|service_route/battleRecords|protobuf → conditional/pb_share_report|—|response_schema_missing, request_encoding_unverified|
|207|fight_settlement|BATTLE-FIGHT|service_route/fight|protobuf → conditional/pb_fight_settlement_request|pb_fight_settlement_response|request_encoding_unverified|
|208|req_edit_lineup|HERO-LINEUP|service_route/lineups|protobuf → protobuf/pb_edit_lineup_req|pb_edit_lineup_rsp||
|209|req_edit_pre_lineup|HERO-LINEUP|service_route/lineups|protobuf → protobuf/pb_edit_pre_lineup_req|pb_edit_pre_lineup_rsp||
|210|req_set_pre_lineup_index|HERO-LINEUP|service_route/lineups|etf → etf|pb_set_pre_lineup_index_rsp||
|211|req_pass_record|BATTLE-REPORT|service_route/battleRecords|protobuf → conditional/pb_pass_record_req|pb_pass_record|request_encoding_unverified|
|212|req_pass_record_vote|BATTLE-REPORT|service_route/battleRecords|protobuf → conditional/pb_pass_record_vote_req|—|response_schema_missing, request_encoding_unverified|
|213|get_fight_report_full|BATTLE-FIGHT|service_route/fight|protobuf → conditional/pb_get_fight_report|pb_fight_report_res|request_encoding_unverified|
|214|req_custom_pre_lineup_new|HERO-LINEUP|service_route/lineups|protobuf → protobuf/pb_custom_pre_lineup_list|pb_custom_pre_lineup_list||
|215|req_custom_pre_lineup_set_name|HERO-LINEUP|service_route/lineups|protobuf → protobuf/pb_custom_lineup_set_name_req|pb_custom_pre_lineup||
|216|req_custom_pre_lineup_set|HERO-LINEUP|service_route/lineups|protobuf → protobuf/pb_custom_lineup_set_req|pb_custom_pre_lineup||
|217|req_custom_pre_lineup_delete|HERO-LINEUP|service_route/lineups|etf → etf|—|response_schema_missing|
|218|req_lineup_exchange_version|HERO-LINEUP|service_route/lineups|etf → etf|pb_edit_pre_lineup_rsp||
|288|req_res_complete_award|ITEM-RESCOMPLETE|service_route/r1FailClosed|etf → etf|pb_res_to_client||
|304|finish_story|ROLE-STORY|service_route/storyService|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|305|touch_story|ROLE-STORY|service_route/storyService|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|503|mission_sweep_passed|ITEM-MISSION|service_route/fight|protobuf → conditional/pb_mission_sweep_passed_req|pb_mission_sweep_passed_rsp|request_encoding_unverified|
|504|mission_meal|ITEM-MISSION|service_route/missionExtra|etf → conditional|pb_mission_meal_rsp|request_encoding_unverified|
|505|mission_energy_exchange|ITEM-MISSION|service_route/missionExtra|etf → conditional|pb_res_to_client|request_encoding_unverified|
|506|req_inner_box_award|ITEM-MISSION|service_route/fight|etf → conditional|pb_mission_rsp|request_encoding_unverified|
|508|req_mission_custom|ITEM-MISSION|gateway_route/gateway|etf → protobuf|pb_mission_rsp|request_encoding_mismatch|
|509|req_one_key_chapter|ITEM-MISSION|service_route/missionExtra|protobuf → conditional/pb_mission_one_key_reward_req|pb_mission_one_key_reward_rsp|request_encoding_unverified|
|510|energy_energy_buy|ITEM-MISSION|service_route/missionExtra|etf → conditional|pb_energy_manual_buy_rsp|request_encoding_unverified|
|511|req_mission_chapter_pass|ITEM-MISSION|service_route/missionExtra|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|512|req_mission_boss_pass_award|ITEM-MISSION|service_route/missionExtra|etf → conditional|pb_res_to_client|request_encoding_unverified|
|599|req_draw_buy_magic_scroll|HERO-HERO|service_route/recruit|etf → conditional|pb_draw_normal_buy_ret|request_encoding_unverified|
|600|req_draw_buy_normal_scroll|HERO-HERO|service_route/recruit|etf → conditional|pb_draw_normal_buy_ret|request_encoding_unverified|
|601|draw_hero|HERO-HERO|multi_owner/gateway|protobuf → protobuf/pb_draw_hero|hero_draw_back|shadowed_owner|
|602|req_choose_hero_school|HERO-HERO|service_route/heroCommandServices[1]|etf → unverified|pb_hero_recruit|request_encoding_unverified|
|614|use_hero_chip|HERO-HERO|service_route/heroExtra|protobuf → conditional/hero_chip_use|pb_res_to_client|request_encoding_unverified|
|627|req_rent_out_hero|HERO-HERO|service_route/heroCommandServices[3]|protobuf → unverified/pb_req_rent_out|pb_req_rent_out_back|request_encoding_unverified|
|628|req_rent_out_off_hero|HERO-HERO|service_route/heroCommandServices[3]|etf → unverified|pb_req_rent_out_back|request_encoding_unverified|
|629|req_rent_in_hero|HERO-HERO|service_route/heroCommandServices[3]|protobuf → unverified/pb_req_rent|pb_req_rent_back|request_encoding_unverified|
|630|req_query_rent_out_info|HERO-HERO|service_route/heroCommandServices[3]|etf → unverified|pb_req_query_rent_hero_ret|request_encoding_unverified|
|631|req_rent_flush|HERO-HERO|service_route/heroCommandServices[3]|etf → unverified|pb_rent_flush_ret|request_encoding_unverified|
|634|req_query_share_data|HERO-HERO|service_route/heroCommandServices[3]|protobuf → unverified/pb_hero_share_req|pb_hero_share_req_back|request_encoding_unverified|
|635|req_rev_recruit_progress_award|HERO-HERO|service_route/heroCommandServices[2]|etf → unverified|pb_rev_draw_progress_award_back|request_encoding_unverified|
|636|req_develop_up_lv|HERO-HERO|service_route/progression|protobuf → conditional/pb_hero_up_lv_req|pb_hero_up_lv_ret|request_encoding_unverified|
|637|req_develop_submit_hero|HERO-HERO|service_route/heroCommandServices[0]|protobuf → unverified/pb_hero_submit_req|pb_hero_submit_ret|request_encoding_unverified|
|638|req_develop_hero_break|HERO-HERO|service_route/progression|etf → conditional|pb_hero_break_ret|request_encoding_unverified|
|639|req_develop_up_star_normal|HERO-HERO|service_route/progression|etf → conditional|pb_hero_up_star_ret|request_encoding_unverified|
|640|req_develop_up_star_high|HERO-HERO|service_route/progression|protobuf → conditional/pb_hero_wake_req|pb_hero_up_star_ret|request_encoding_unverified|
|641|req_develop_hero_trial|HERO-HERO|service_route/heroCommandServices[0]|protobuf → unverified/pb_hero_wake_req|pb_hero_trial_ret|request_encoding_unverified|
|642|req_choose_wish_hero|HERO-HERO|service_route/recruit|protobuf → conditional/pb_draw_choose_wish_req|pb_hero_recruit|request_encoding_unverified|
|643|req_takeoff_wish_hero|HERO-HERO|service_route/recruit|etf → conditional|pb_hero_recruit|request_encoding_unverified|
|644|req_req_hero_handbook_raise_level|HERO-HERO|service_route/handbook|etf → conditional|pb_hero_handbook_raise_up_rsp|request_encoding_unverified|
|645|req_req_hero_handbook_raise_one_key|HERO-HERO|service_route/handbook|protobuf → conditional/pb_hero_handbook_raise_one_key_req|pb_hero_handbook_raise_up_rsp|request_encoding_unverified|
|646|req_hero_favour_gift|HERO-HERO|service_route/heroFavor|protobuf → conditional/pb_hero_favour_gift_req|pb_hero_favour_gift_rsp|request_encoding_unverified|
|647|req_hero_visit|HERO-HERO|service_route/heroExtra|etf → conditional|pb_hero_visit_rsp|request_encoding_unverified|
|649|req_hero_favour_play|HERO-HERO|service_route/heroFavor|etf → conditional|pb_hero_favour_play_rsp|request_encoding_unverified|
|651|req_draw_support_lineup|HERO-HERO|service_route/heroCommandServices[2]|etf → unverified|pb_draw_support_back|request_encoding_unverified|
|652|req_draw_get_support_data|HERO-HERO|service_route/heroCommandServices[2]|etf → unverified|pb_draw_support_back|request_encoding_unverified|
|653|req_hero_favour_level_award|HERO-HERO|service_route/heroFavor|protobuf → conditional/pb_hero_favour_level_award_req|pb_hero_favour_level_award_rsp|request_encoding_unverified|
|654|req_active_fetter|HERO-HERO|service_route/heroCommandServices[1]|protobuf → unverified/pb_active_fetter_req|—|response_schema_missing, request_encoding_unverified|
|655|req_hero_handbook_own_award|HERO-HERO|service_route/handbook|etf → conditional|pb_hero_handbook_own_award_back|request_encoding_unverified|
|656|req_develop_batch_submit_hero|HERO-HERO|service_route/heroCommandServices[0]|protobuf → unverified/pb_hero_batch_submit_req|pb_hero_submit_ret|request_encoding_unverified|
|657|req_choose_extra_wish_hero|HERO-HERO|service_route/recruit|protobuf → conditional/pb_draw_choose_wish_req|pb_hero_recruit|request_encoding_unverified|
|658|req_takeoff_extra_wish_hero|HERO-HERO|service_route/recruit|etf → conditional|pb_hero_recruit|request_encoding_unverified|
|659|req_hero_mastery_level_up|HERO-MASTERY|service_route/heroMastery|etf → conditional|pb_hero_mastery_level_up_rsp|request_encoding_unverified|
|660|req_hero_mastery_break|HERO-MASTERY|service_route/heroMastery|etf → conditional|pb_hero_mastery_break_rsp|request_encoding_unverified|
|661|req_hero_diff|HERO-HERO|service_route/heroCommandServices[1]|etf → unverified|pb_hero_diff_back|request_encoding_unverified|
|662|req_get_draw_achieve_award|HERO-HERO|service_route/recruit|etf → conditional|pb_res_to_client|request_encoding_unverified|
|663|req_hero_reforge|HERO-HERO|service_route/heroExtra|protobuf → conditional/pb_hero_reforge_req|pb_hero_reforge_back|request_encoding_unverified|
|664|req_hero_reforge_save|HERO-HERO|service_route/heroExtra|etf → conditional|pb_hero_reforge|request_encoding_unverified|
|665|req_hero_reforge_cancel|HERO-HERO|service_route/heroExtra|etf → conditional|pb_hero_reforge|request_encoding_unverified|
|666|req_one_key_develop|HERO-HERO|service_route/heroCommandServices[0]|protobuf → unverified/pb_hero_one_key_up_req|pb_hero_one_key_up_rsp|request_encoding_unverified|
|667|req_hero_intimacy_add|HERO-FAVOURINTIMACY|service_route/heroCommandServices[10]|protobuf → protobuf/pb_hero_intimacy_add_req|pb_hero_intimacy_add_rsp||
|670|req_hero_intimacy_date|HERO-FAVOURINTIMACY|service_route/heroCommandServices[10]|protobuf → protobuf/pb_hero_intimacy_date_req|pb_hero_intimacy_date_rsp||
|671|req_hero_intimacy_story|HERO-FAVOURINTIMACY|service_route/heroCommandServices[10]|protobuf → protobuf/pb_hero_intimacy_story_req|pb_hero_intimacy_story_rsp||
|672|req_hero_select_pendant|HERO-HERO|service_route/heroCommandServices[1]|protobuf → unverified/pb_hero_select_pendant_req|pb_hero_select_pendant_rsp|request_encoding_unverified|
|673|req_draw_marquee|HERO-HERO|service_route/heroCommandServices[2]|protobuf → unverified/pb_draw_marquee_req|pb_draw_marquee_rsp|request_encoding_unverified|
|701|req_intelli_unlock|HERO-INTELLI|service_route/r1FailClosed|protobuf → etf/pb_intelli_unlock_req|intelli_to_client|request_encoding_mismatch|
|702|req_intelli_batch_handle|HERO-INTELLI|service_route/r1FailClosed|protobuf → etf/pb_intelli_batch_handle|intelli_to_client|request_encoding_mismatch|
|802|combat_power_gain_award|HERO-COMBATPOWER|service_route/heroCommandServices[7]|etf → unverified|pb_power_award_toc|request_encoding_unverified|
|803|req_update_pre_lineup_power|HERO-COMBATPOWER|service_route/heroCommandServices[8]|etf → etf|—|response_schema_missing|
|1001|req_equip_level_up|EQUIP-EQUIP|service_route/equip|protobuf → conditional/pb_equip_level_up_req|pb_equip_level_up_rsp|request_encoding_unverified|
|1002|req_equip_forge|EQUIP-EQUIP|service_route/equip|protobuf → conditional/pb_equip_forge_req|pb_equip_forge_rsp|request_encoding_unverified|
|1003|req_equip_refine|EQUIP-EQUIP|service_route/equip|etf → conditional|pb_equip_refine_rsp|request_encoding_unverified|
|1004|req_equip_refine_one_key|EQUIP-EQUIP|service_route/equip|protobuf → conditional/pb_equip_refine_one_key_req|pb_equip_refine_one_key_rsp|request_encoding_unverified|
|1005|req_equip_inscription|EQUIP-EQUIP|service_route/equip|protobuf → conditional/pb_equip_inscription_req|pb_equip_inscription_rsp|request_encoding_unverified|
|1006|req_equip_wear|EQUIP-EQUIP|service_route/equip|protobuf → conditional/pb_equip_wear_req|pb_equip_wear_rsp|request_encoding_unverified|
|1007|req_equip_awake|EQUIP-EQUIP|service_route/equip|etf → conditional|pb_equip_awake_rsp|request_encoding_unverified|
|1008|req_equip_res_exchange|EQUIP-EQUIP|service_route/equip|protobuf → conditional/pb_equip_res_exchange_req|pb_res_to_client|request_encoding_unverified|
|1009|req_equip_refine_one_key_batch|EQUIP-EQUIP|service_route/equip|protobuf → conditional/pb_equip_refine_one_key_batch_req|pb_equip_refine_one_key_batch_rsp|request_encoding_unverified|
|1103|peak_tower_sweeps|BATTLE-PEAKTOWER|service_route/peakTower|protobuf → conditional/peak_tower_sweeps_req|peak_tower_sweep_back|request_encoding_unverified|
|1104|peak_tower_every_award|BATTLE-PEAKTOWER|service_route/peakTower|etf → conditional|peak_tower_back|request_encoding_unverified|
|1109|peak_tower_buy_goods|BATTLE-PEAKTOWER|service_route/peakTower|etf → conditional|pb_res_to_client|request_encoding_unverified|
|1110|peak_tower_receive_achievement|BATTLE-PEAKTOWER|service_route/peakTower|etf → conditional|pb_res_to_client|request_encoding_unverified|
|1111|peak_tower_rev_tower_award|BATTLE-PEAKTOWER|service_route/peakTower|etf → conditional|pb_res_to_client|request_encoding_unverified|
|1112|peak_tower_avg_layer|BATTLE-PEAKTOWER|service_route/peakTower|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|1201|req_buy_shop_item|ITEM-SHOP|multi_owner/shop|protobuf → conditional/pb_req_buy_shop_item|pb_res_to_client|request_encoding_unverified, shadowed_owner|
|1202|req_shops_info|ITEM-SHOP|multi_owner/shop|etf → conditional|pb_query_shops_back|request_encoding_unverified, shadowed_owner|
|1203|fast_buy_item|ITEM-SHOP|service_route/shop|etf → conditional|pb_res_to_client|request_encoding_unverified|
|1204|req_shop_settle|ITEM-SHOP|service_route/shop|etf → conditional|pb_shop_settle_back|request_encoding_unverified|
|1205|req_shop_wipe_butt|ITEM-SHOP|service_route/shop|etf → conditional|pb_shop_info|request_encoding_unverified|
|1206|req_shop_buy_history_item|ITEM-SHOP|service_route/shop|protobuf → conditional/pb_req_buy_history_item|pb_rev_buy_history_item|request_encoding_unverified|
|1207|req_shop_easy_buy_item|ITEM-SHOP|service_route/shop|etf → conditional|pb_res_to_client|request_encoding_unverified|
|1208|req_refresh_shop|ITEM-SHOP|service_route/shop|etf → conditional|pb_manual_refresh_shop_back|request_encoding_unverified|
|1301|req_set_role_name|ROLE-ROLE|service_route/roleService|etf → conditional|res_set_role_name|request_encoding_unverified|
|1302|req_random_role_name|ROLE-ROLE|service_route/roleService|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|1303|req_get_level_reward|ROLE-ROLE|service_route/roleService|etf → conditional|res_get_level_reward|request_encoding_unverified|
|1304|req_set_role_figure|ROLE-ROLE|service_route/roleService|etf → conditional|pb_figure_simple_info|request_encoding_unverified|
|1305|req_active_role_title|ROLE-ROLE|service_route/roleService|etf → conditional|pb_active_title_req_back|request_encoding_unverified|
|1306|req_role_title_attr|ROLE-ROLE|service_route/roleService|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|1307|req_check_same_name|ROLE-ROLE|service_route/roleService|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|1308|req_refresh_figure_red|ROLE-ROLE|service_route/roleService|etf → conditional|pb_figure_have_info|request_encoding_unverified|
|1309|req_set_figure_sex|ROLE-ROLE|service_route/roleService|etf → conditional|pb_res_to_client|request_encoding_unverified|
|1310|req_set_figure_style|ROLE-ROLE|service_route/roleService|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|1311|req_set_role_name_sex|ROLE-ROLE|service_route/roleService|etf → conditional|res_set_role_name_sex|request_encoding_unverified|
|1312|req_up_rank|ROLE-ROLE|service_route/roleService|etf → conditional|pb_role_figure_up_back|request_encoding_unverified|
|1313|req_role_figure_rank_award|ROLE-ROLE|service_route/roleService|etf → conditional|pb_role_figure_rank_award_back|request_encoding_unverified|
|1314|req_role_refresh_power|ROLE-ROLE|service_route/roleService|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|1315|req_role_figure_chat_bubble|ROLE-ROLE|service_route/roleService|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|1316|req_role_attr_info|ROLE-ROLE|gateway_route/gateway|etf → conditional|pb_attr_lineup_all_info|request_encoding_unverified|
|1317|req_rev_watch_video_award|ROLE-ROLE|service_route/roleService|etf → conditional|pb_res_to_client|request_encoding_unverified|
|2000|get_rank_data|BATTLE-RANK|service_route/ranks|etf → conditional|rank_to_client|request_encoding_unverified|
|2001|get_rank_info|BATTLE-RANK|service_route/ranks|etf → conditional|rank_info|request_encoding_unverified|
|2002|get_rank_top_data|BATTLE-RANK|service_route/ranks|etf → conditional|rank_to_client|request_encoding_unverified|
|2003|batch_get_hero_rank|BATTLE-RANK|service_route/ranks|etf → conditional|pb_rev_rank|request_encoding_unverified|
|2004|batch_get_player_hero_rank|BATTLE-RANK|service_route/ranks|protobuf → conditional/pb_batch_seq_rank|pb_batch_rev_rank|request_encoding_unverified|
|2005|get_rank_cross_top|BATTLE-RANK|service_route/ranks|etf → conditional|pb_rank_cross_group_top|request_encoding_unverified|
|2006|batch_get_personal_rank_first|BATTLE-RANK|service_route/ranks|etf → conditional|rank_to_client|request_encoding_unverified|
|2007|get_appoint_rank|BATTLE-RANK|service_route/ranks|etf → conditional|rank_info|request_encoding_unverified|
|2008|get_rank_backup|BATTLE-RANK|service_route/ranks|etf → conditional|rank_to_client|request_encoding_unverified|
|2009|update_rank_bubble|BATTLE-RANK|service_route/ranks|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|2010|req_batch_get_rank|BATTLE-RANK|service_route/ranks|etf → conditional|pb_rev_rank|request_encoding_unverified|
|2011|req_batch_get_rank_backup|BATTLE-RANK|service_route/ranks|etf → conditional|rank_to_client_list|request_encoding_unverified|
|3000|one_key_del_mail|ITEM-MAIL|service_route/mail|etf → conditional|pb_res_to_client|request_encoding_unverified|
|3001|one_key_read_mail|ITEM-MAIL|service_route/mail|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|3002|one_key_award_mail|ITEM-MAIL|service_route/mail|etf → conditional|pb_rev_one_key_award_mail|request_encoding_unverified|
|3003|read_mail|ITEM-MAIL|service_route/mail|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|3004|award_mail|ITEM-MAIL|service_route/mail|etf → conditional|pb_rev_award_mail|request_encoding_unverified|
|3005|del_mail|ITEM-MAIL|service_route/mail|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|3006|req_mail_detail_info|ITEM-MAIL|service_route/mail|etf → conditional|pb_mail|request_encoding_unverified|
|4031|req_swap_arena_get_match|BATTLE-SWAPARENA|service_route/swapArena|etf → conditional|pb_swap_arena_match_toc|request_encoding_unverified|
|4032|req_swap_arena_refresh_match|BATTLE-SWAPARENA|service_route/swapArena|etf → conditional|pb_swap_arena_match_toc|request_encoding_unverified|
|4033|req_swap_arena_buy_fight_times|BATTLE-SWAPARENA|service_route/swapArena|etf → conditional|pb_res_to_client|request_encoding_unverified|
|4034|req_swap_arena_more_fight|BATTLE-SWAPARENA|service_route/swapArena|etf → conditional|pb_res_to_client|request_encoding_unverified|
|4035|req_swap_arena_fight_report|BATTLE-SWAPARENA|service_route/swapArena|etf → conditional|pb_swap_arena_fight_report_data|request_encoding_unverified|
|4036|req_swap_arena_read_rank_change|BATTLE-SWAPARENA|service_route/swapArena|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|4037|req_swap_arena_set_read_report_time|BATTLE-SWAPARENA|service_route/swapArena|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|4038|req_swap_arena_rank_award|BATTLE-SWAPARENA|service_route/swapArena|protobuf → conditional/pb_swap_arena_rank_award_req|pb_res_to_client|request_encoding_unverified|
|4039|req_swap_arena_update_cross_stage|BATTLE-SWAPARENA|service_route/swapArena|etf → conditional|pb_swap_arena_update_cross|request_encoding_unverified|
|4040|req_swap_arena_init_double_team|BATTLE-SWAPARENA|service_route/swapArena|etf → conditional|pb_lineup|request_encoding_unverified|
|7000|req_open_fun|ROLE-FUNOPEN|service_route/features|etf → conditional|res_fun_open|request_encoding_unverified|
|8000|req_save_guide_process|ITEM-GUIDE|gateway_route/gateway|protobuf → conditional/pb_req_save_process|pb_req_save_process_back|request_encoding_unverified|
|8001|req_guide_award|ITEM-GUIDE|service_route/guide|etf → conditional|pb_res_to_client|request_encoding_unverified|
|8002|req_check_guide_net|ITEM-GUIDE|service_route/guide|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|9000|req_finish_daily_task|ITEM-EVERYTASK|service_route/everyTasks|etf → etf|daily_receive_back||
|9002|req_finish_main_task|ITEM-EVERYTASK|service_route/everyTasks|etf → etf|main_receive_back||
|9003|req_get_daily_active_reward|ITEM-EVERYTASK|service_route/everyTasks|etf → etf|daily_receive_back||
|9005|req_finish_common_task|ITEM-COMMONTASK|service_route/tasks|etf → etf|common_receive_back||
|9006|req_finish_all_daily_task|ITEM-EVERYTASK|service_route/everyTasks|etf → etf|daily_receive_back||
|9007|req_finish_all_main_task|ITEM-EVERYTASK|service_route/everyTasks|etf → etf|main_receive_back||
|9008|req_finish_weekly_task|ITEM-EVERYTASK|service_route/everyTasks|etf → etf|weekly_receive_back||
|9009|req_finish_all_weekly_task|ITEM-EVERYTASK|service_route/everyTasks|etf → etf|weekly_receive_back||
|9010|req_finish_linear_task|ITEM-COMMONTASK|service_route/tasks|etf → etf|pb_linear_task_receive_back||
|10501|req_send_msg|SOC-MSG|service_route/message|protobuf → protobuf/pb_req_send_msg|—|response_schema_missing|
|10502|req_enter_channel|SOC-MSG|service_route/message|etf → conditional|pb_msg_range_list_with_role_info|request_encoding_unverified|
|10503|req_leave_channel|SOC-MSG|service_route/message|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|10504|req_msg_role_info|SOC-MSG|service_route/message|etf → conditional|pb_msg_role_info|request_encoding_unverified|
|10505|req_msg_role_info_list|SOC-MSG|service_route/message|etf → conditional|pb_msg_role_info_list|request_encoding_unverified|
|10506|req_msg_range|SOC-MSG|service_route/message|etf → conditional|pb_msg_range_list_with_role_info|request_encoding_unverified|
|10507|req_get_channel_id_and_enter|SOC-MSG|service_route/message|etf → conditional|pb_msg_range_list_with_role_info|request_encoding_unverified|
|10508|req_get_login_data|SOC-MSG|service_route/message|etf → conditional|pb_res_msg_login|request_encoding_unverified|
|10509|req_msg_cross_data|SOC-MSG|service_route/message|etf → conditional|pb_res_msg_login|request_encoding_unverified|
|10510|req_log_send_msg|SOC-MSG|service_route/message|protobuf → protobuf/pb_req_send_msg|—|response_schema_missing|
|10511|req_tips_look_player|SOC-MSG|service_route/message|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|11000|req_send_chat_msg_to_world|SOC-CHAT|service_route/chat|protobuf → protobuf/pb_chat_msg_content|—|response_schema_missing|
|11001|req_send_chat_msg_to_guild|SOC-CHAT|service_route/chat|protobuf → protobuf/pb_chat_msg_content|—|response_schema_missing|
|11002|req_send_chat_msg_to_role|SOC-CHAT|service_route/chat|protobuf → protobuf/pb_req_send_msg_to_role|—|response_schema_missing|
|11003|req_send_multi_server_msg|SOC-CHAT|service_route/chat|protobuf → protobuf/pb_chat_msg_content|—|response_schema_missing|
|11006|req_cancel_ban|SOC-CHAT|service_route/chat|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|11008|req_banned_self|SOC-CHAT|service_route/chat|protobuf → protobuf/pb_req_ban_self|—|response_schema_missing|
|11010|req_change_chat_setting|SOC-CHAT|service_route/chat|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|11012|req_remove_private_target|SOC-CHAT|service_route/chat|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|11013|req_chat_report|SOC-CHAT|service_route/chat|etf → conditional|pb_role_chat_report|request_encoding_unverified|
|11014|req_chat_msg_like|SOC-CHAT|service_route/chat|protobuf → protobuf/pb_msg_like_req|pb_msg_like_rsp||
|11408|req_home_puzzle_task_reward|PLAY-HOMEPUZZLEACT|service_route/explorationAct|protobuf → unverified/pb_home_puzzle_task_reward_req|pb_home_puzzle_task_reward_rsp|request_encoding_unverified|
|11409|req_home_puzzle_gift|PLAY-HOMEPUZZLEACT|service_route/explorationAct|protobuf → unverified/pb_home_puzzle_gift_req|pb_home_puzzle_gift_rsp|request_encoding_unverified|
|11410|req_home_puzzle_request|PLAY-HOMEPUZZLEACT|service_route/explorationAct|protobuf → unverified/pb_home_puzzle_request_req|pb_home_puzzle_request_rsp|request_encoding_unverified|
|11413|req_home_puzzle_decompose|PLAY-HOMEPUZZLEACT|service_route/explorationAct|protobuf → unverified/pb_home_puzzle_decompose_req|pb_home_puzzle_decompose_rsp|request_encoding_unverified|
|11416|req_home_puzzle_rec_process_award|PLAY-HOMEPUZZLEACT|service_route/explorationAct|protobuf → unverified/pb_home_puzzle_rec_process_award_req|pb_home_puzzle_rec_process_award_rsp|request_encoding_unverified|
|11417|req_home_puzzle_get_friend_request_data|PLAY-HOMEPUZZLEACT|service_route/explorationAct|protobuf → unverified/pb_home_puzzle_get_friend_request_data_req|pb_home_puzzle_get_friend_request_data_rsp|request_encoding_unverified|
|11418|req_home_puzzle_rec_friend_gift_piece|PLAY-HOMEPUZZLEACT|service_route/explorationAct|protobuf → unverified/pb_home_puzzle_rec_gift_piece_req|pb_home_puzzle_rec_gift_piece_rsp|request_encoding_unverified|
|11419|req_home_puzzle_open_pack|PLAY-HOMEPUZZLEACT|service_route/explorationAct|protobuf → unverified/pb_home_puzzle_open_pack_req|pb_home_puzzle_open_pack_rsp|request_encoding_unverified|
|11420|req_home_puzzle_cancel_request|PLAY-HOMEPUZZLEACT|service_route/explorationAct|protobuf → unverified/pb_home_puzzle_cancel_request_req|pb_home_puzzle_cancel_request_rsp|request_encoding_unverified|
|11501|req_homeland_act_select_hero|PLAY-HOMELANDACT|service_route/explorationAct|protobuf → unverified/pb_homeland_act_select_hero_req|pb_homeland_act_select_hero_rsp|request_encoding_unverified|
|11502|req_homeland_act_task_award|PLAY-HOMELANDACT|service_route/explorationAct|protobuf → unverified/pb_homeland_act_task_award_req|pb_homeland_act_task_award_rsp|request_encoding_unverified|
|11503|req_homeland_act_decorate|PLAY-HOMELANDACT|service_route/explorationAct|protobuf → unverified/pb_homeland_act_decorate_req|pb_homeland_act_decorate_rsp|request_encoding_unverified|
|11505|req_homeland_act_clear_room|PLAY-HOMELANDACT|service_route/explorationAct|protobuf → unverified/pb_homeland_act_clear_room_req|pb_homeland_act_clear_room_rsp|request_encoding_unverified|
|16001|req_get_first_recharge_reward|PAY-RECHARGE|service_route/firstRecharge|etf → etf|pb_res_rev_first_recharge_reward||
|16003|req_notify_get_recharge_reward|PAY-RECHARGE|gateway_route/gateway|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|16004|req_recharge_by_token|PAY-RECHARGE|gateway_route/gateway|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|16005|req_buy_or_rev_gift|PAY-RECHARGE|service_route/welfare|protobuf → protobuf/pb_recharge_buy_or_rev_req|res_buy_or_Rev_gift||
|16006|req_loong_recharge|PAY-RECHARGE|service_route/welfare|protobuf → protobuf/pb_recharge_buy_or_rev_req|res_buy_or_Rev_gift||
|17001|req_get_monthly_card_reward|PAY-MONTHLYCARD|gateway_route/gateway|protobuf → conditional/req_get_monthly_card_reward|res_get_monthly_card_reward|request_encoding_unverified|
|18001|req_active_trigger_gift|PAY-TRIGGERGIFT|service_route/benefitCommerce|etf → conditional|pb_trigger_gift|request_encoding_unverified|
|18002|req_add_trigger_times|PAY-TRIGGERGIFT|service_route/benefitCommerce|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|20001|req_apply_friends|SOC-FRIEND|service_route/friend|etf → conditional|res_apply_friends|request_encoding_unverified|
|20002|req_remove_friend|SOC-FRIEND|service_route/friend|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|20003|req_agree_friend_applies|SOC-FRIEND|service_route/friend|etf → conditional|res_agree_applies|request_encoding_unverified|
|20004|req_refuse_friend_applies|SOC-FRIEND|service_route/friend|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|20005|req_add_to_blacklist|SOC-FRIEND|service_route/friend|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|20006|req_remove_from_blacklist|SOC-FRIEND|service_route/friend|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|20007|req_present_friendship|SOC-FRIEND|service_route/friend|etf → conditional|res_friendship_change|request_encoding_unverified|
|20008|req_receive_friendship|SOC-FRIEND|service_route/friend|etf → conditional|res_friendship_change|request_encoding_unverified|
|20009|req_query_friend|SOC-FRIEND|service_route/friend|etf → conditional|res_query_friend_player|request_encoding_unverified|
|20010|req_recommend_friend_list|SOC-FRIEND|service_route/friend|etf → conditional|res_query_friend_player|request_encoding_unverified|
|20011|req_one_key_present_and_rev|SOC-FRIEND|service_route/friend|etf → conditional|res_friendship_change|request_encoding_unverified|
|20012|req_friend_recommend_types|SOC-FRIEND|service_route/friend|etf → conditional|res_query_friend_player|request_encoding_unverified|
|20013|req_friend_save_report|SOC-FRIEND|service_route/friend|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|21001|req_create_guild|SOC-GUILD|service_route/guildSociety|protobuf → protobuf/pb_req_create_guild|pb_guild_create_back||
|21002|req_apply_join_guild|SOC-GUILD|service_route/guildSociety|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|21003|req_handle_applies|SOC-GUILD|service_route/guildSociety|protobuf → protobuf/pb_req_handle_join_apply|—|response_schema_missing|
|21004|req_recommends|SOC-GUILD|service_route/guildSociety|etf → conditional|pb_res_recommends|request_encoding_unverified|
|21005|req_guild_info|SOC-GUILD|service_route/guildRoster|etf → conditional|pb_guild|request_encoding_unverified|
|21006|req_expel_member|SOC-GUILD|service_route/guildRoster|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|21007|req_leave_guild|SOC-GUILD|service_route/guildRoster|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|21008|req_change_base_info|SOC-GUILD|service_route/guildSociety|protobuf → protobuf/pb_req_guild_base_info|—|response_schema_missing|
|21010|req_change_member_job|SOC-GUILD|service_route/guildRoster|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|21012|req_search_guild|SOC-GUILD|service_route/guildSociety|etf → conditional|pb_res_recommends|request_encoding_unverified|
|21013|req_dissolve_guild|SOC-GUILD|service_route/guildSociety|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|21014|req_impeach_president|SOC-GUILD|service_route/guildSociety|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|21015|req_send_recruit|SOC-GUILD|service_route/guildSociety|protobuf → protobuf/pb_guild_send_recruit_req|pb_res_guild_info||
|21016|req_contribute|SOC-GUILD|service_route/guildSociety|etf → conditional|pb_res_guild_info|request_encoding_unverified|
|21017|req_receive_act_box|SOC-GUILD|service_route/guildSociety|etf → conditional|pb_res_guild_info|request_encoding_unverified|
|21018|req_rename_guild_because_force|SOC-GUILD|service_route/guildSociety|etf → conditional|pb_guild_rename_back|request_encoding_unverified|
|21019|req_guild_log|SOC-GUILD|service_route/guildSociety|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|21020|req_guild_level_award|SOC-GUILD|service_route/guildSociety|etf → conditional|pb_res_to_client|request_encoding_unverified|
|21021|req_rename_guild_normal|SOC-GUILD|service_route/guildSociety|protobuf → protobuf/pb_guild_rename_req|pb_guild_rename_back||
|21022|req_set_guild_social_stamp|SOC-GUILD|service_route/guildSociety|etf → conditional|pb_guild_social_role|request_encoding_unverified|
|21023|req_guild_enter_scene|SOC-GUILD|service_route/guildSociety|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|21024|req_guild_send_notice_mail|SOC-GUILD|service_route/guildSociety|protobuf → protobuf/pb_guild_send_notice_mail_req|—|response_schema_missing|
|21025|req_guild_set_read_transfer|SOC-GUILD|service_route/guildSociety|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|21026|req_guild_box_award|SOC-GUILD|service_route/guildSociety|etf → conditional|pb_guild_box_rsp|request_encoding_unverified|
|21027|req_guild_special_task_award|SOC-GUILDACTIVE|service_route/guildSociety|etf → conditional|pb_guild_active_special_rsp|request_encoding_unverified|
|21028|req_guild_set_distribution_ratio|SOC-GUILD|service_route/guildSociety|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|21029|req_get_pay_record|SOC-GUILD|service_route/guildSociety|etf → conditional|pb_req_guild_pay_record|request_encoding_unverified|
|21030|req_guild_pay_award|SOC-GUILD|service_route/guildSociety|etf → conditional|pb_guild_pay_rsp|request_encoding_unverified|
|21031|req_guild_notice_change_read|SOC-GUILD|service_route/guildSociety|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|31052|req_up_star_gift_award|PAY-UPSTARGIFT|service_route/upStarGift|protobuf → protobuf/pb_up_star_gift_req|pb_up_star_gift_back||
|31053|req_up_star_choose_version|PAY-UPSTARGIFT|service_route/upStarGift|etf → protobuf|—|response_schema_missing, request_encoding_mismatch|
|33001|req_buy_vip_gift|PAY-VIP|service_route/benefitCommerce|etf → conditional|pb_res_to_client|request_encoding_unverified|
|33002|req_get_vip_addition_reward|PAY-VIP|service_route/benefitCommerce|etf → conditional|pb_res_to_client|request_encoding_unverified|
|35001|req_permit_receive_free|PAY-PERMIT|gateway_route/gateway|etf → conditional|pb_permit_receive_back|request_encoding_unverified|
|35002|req_permit_receive_pay|PAY-PERMIT|gateway_route/gateway|etf → conditional|pb_permit_receive_back|request_encoding_unverified|
|35003|req_permit_buy_level|PAY-PERMIT|service_route/benefitCommerce|etf → conditional|pb_permit_buy_level_back|request_encoding_unverified|
|35004|req_permit_adjust_cycle|PAY-PERMIT|service_route/benefitCommerce|etf → conditional|pb_permit_settle_back|request_encoding_unverified|
|35005|req_permit_receive_all|PAY-PERMIT|gateway_route/gateway|etf → conditional|pb_permit_receive_back|request_encoding_unverified|
|35006|req_permit_gain_welfare|PAY-PERMIT|service_route/benefitCommerce|etf → conditional|pb_permit_gain_welfare_toc|request_encoding_unverified|
|35007|req_permit_buy_times_data|PAY-PERMIT|service_route/benefitCommerce|etf → conditional|pb_permit_server_data|request_encoding_unverified|
|35008|req_permit_manual_update|PAY-PERMIT|service_route/benefitCommerce|etf → conditional|pb_permit_manual_update_back|request_encoding_unverified|
|35009|req_permit_manual_settle|PAY-PERMIT|service_route/benefitCommerce|etf → conditional|pb_permit_settle_back|request_encoding_unverified|
|35010|req_permit_select_award|PAY-PERMIT|service_route/benefitCommerce|protobuf → protobuf/pb_permit_select_award_req|pb_permit_select_award_back||
|35011|req_permit_choose_req|PAY-PERMIT|service_route/benefitCommerce|protobuf → protobuf/pb_permit_choose_req|pb_permit_info||
|37009|req_sign_act_award|ACT-SIGNACT|service_route/actReward|protobuf → etf/pb_sign_act_req|pb_sign_act_back|request_encoding_mismatch|
|37010|req_online_gift_award|PAY-ONLINEGIFT|service_route/onlineGift|etf → etf|pb_online_gift_back||
|37060|req_artifact_synthesis|EQUIP-ARTIFACT|service_route/artifact|protobuf → protobuf/pb_artifact_star_up_req|pb_artifact_back||
|37061|req_artifact_strength|EQUIP-ARTIFACT|service_route/artifact|protobuf → protobuf/pb_req_artifact_forge|pb_artifact_back||
|37062|req_artifact_quality|EQUIP-ARTIFACT|service_route/artifact|etf → conditional|pb_artifact_back|request_encoding_unverified|
|37068|req_artifact_forge_promote|EQUIP-ARTIFACT|service_route/artifact|etf → conditional|pb_artifact|request_encoding_unverified|
|37069|req_artifact_fetter|EQUIP-ARTIFACT|service_route/artifact|etf → conditional|pb_artifact_fetter|request_encoding_unverified|
|37070|req_artifact_level_up|EQUIP-ARTIFACT|service_route/artifact|protobuf → protobuf/pb_artifact_level_up_req|pb_artifact_level_up_rsp||
|37071|req_artifact_break_level_up|EQUIP-ARTIFACT|service_route/artifact|etf → conditional|pb_artifact_break_level_up_rsp|request_encoding_unverified|
|37072|req_artifact_inject|EQUIP-ARTIFACT|service_route/artifact|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|37073|req_artifact_handbook_level_up|EQUIP-ARTIFACT|service_route/artifact|protobuf → protobuf/pb_artifact_handbook_level_up_req|pb_artifact_handbook_level_up_rsp||
|37074|req_artifact_fly_up|EQUIP-ARTIFACT|service_route/artifact|etf → conditional|pb_artifact_back|request_encoding_unverified|
|37075|req_artifact_change_skin|EQUIP-ARTIFACT|service_route/artifact|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|39001|req_save_changed_red_dot|ROLE-REDDOT|service_route/roleService|protobuf → conditional/red_change_info|—|response_schema_missing, request_encoding_unverified|
|40000|req_claim_prize|ROLE-CDKEY|service_route/cdkeyService|etf → conditional|pb_res_to_client|request_encoding_unverified|
|43003|req_carnival_use_item|PLAY-CARNIVAL|service_route/explorationAct|etf → unverified|pb_mono_use_item_back|request_encoding_unverified|
|43006|req_carnival_throw_dice|PLAY-CARNIVAL|service_route/explorationAct|etf → unverified|pb_mono_throw_dice_back|request_encoding_unverified|
|43008|req_carnival_touch_event|PLAY-CARNIVAL|service_route/explorationAct|etf → unverified|—|response_schema_missing, request_encoding_unverified|
|43009|req_carnival_finish_event|PLAY-CARNIVAL|service_route/explorationAct|etf → unverified|pb_mono_finish_ev_back|request_encoding_unverified|
|43010|req_carnival_auto_flush_dice|PLAY-CARNIVAL|service_route/explorationAct|etf → unverified|pb_mono_auto_flush_dice_back|request_encoding_unverified|
|43014|req_carnival_buy_dice|PLAY-CARNIVAL|service_route/explorationAct|etf → unverified|pb_mono_buy_dice_back|request_encoding_unverified|
|43016|req_carnival_latest_data|PLAY-CARNIVAL|service_route/explorationAct|etf → unverified|pb_mono_req_data_back|request_encoding_unverified|
|43017|req_get_achieve_award|PLAY-CARNIVAL|service_route/explorationAct|etf → unverified|pb_mono_rev_achieve_back|request_encoding_unverified|
|43018|req_monopoly_build|PLAY-CARNIVAL|service_route/explorationAct|etf → unverified|pb_mono_one_build|request_encoding_unverified|
|43019|req_monopoly_build_up_level|PLAY-CARNIVAL|service_route/explorationAct|etf → unverified|—|response_schema_missing, request_encoding_unverified|
|43020|req_mono_get_build_award|PLAY-CARNIVAL|service_route/explorationAct|etf → unverified|pb_res_to_client|request_encoding_unverified|
|43021|req_mono_develop_tech|PLAY-CARNIVAL|service_route/explorationAct|etf → unverified|pb_mono_tech|request_encoding_unverified|
|43022|req_carnival_build_dispatch|PLAY-CARNIVAL|service_route/explorationAct|protobuf → unverified/pb_mono_dispatch_req|pb_mono_build_data|request_encoding_unverified|
|43023|req_carnival_box_award|PLAY-CARNIVAL|service_route/explorationAct|etf → unverified|pb_mono_req_data_back|request_encoding_unverified|
|43024|req_handle_build_extra|PLAY-CARNIVAL|service_route/explorationAct|protobuf → unverified/pb_mono_build_handle_req|pb_mono_build_handle_back|request_encoding_unverified|
|43101|req_rank_achieve_award|ITEM-RANKACHIEVE|service_route/rankAchieve|protobuf → conditional/pb_rank_achieve_award_req|pb_rank_achieve_award_rsp|request_encoding_unverified|
|46001|req_support_player|SOC-SUPPORT|service_route/community|etf → conditional|support_to_client|request_encoding_unverified|
|46002|req_get_supported|SOC-SUPPORT|service_route/community|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|51001|req_fund_act_award|PAY-FUNDACT|service_route/benefitCommerce|etf → conditional|pb_fund_act_back|request_encoding_unverified|
|53001|req_activity_state_change|ROLE-ACTIVITY|service_route/actFrameService|etf → conditional|pb_act_state_change_back|request_encoding_unverified|
|53002|req_act_stage_change|ROLE-ACTFRAME|service_route/actFrameService|etf → conditional|pb_act_role_stage_change_back|request_encoding_unverified|
|53003|req_act_gm_open_act|ROLE-ACTFRAME|service_route/actFrameService|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|53004|req_act_gm_jump_stage|ROLE-ACTFRAME|service_route/actFrameService|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|53005|req_act_gm_clear_act_data|ROLE-ACTFRAME|service_route/actFrameService|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|53006|req_act_get_act_list_data|ROLE-ACTFRAME|service_route/actFrameService|etf → conditional|pb_act_frame_stage_push|request_encoding_unverified|
|55001|req_red_cliff_box|BATTLE-REDCLIFF|service_route/redCliff|etf → conditional|pb_red_cliff_box_result|request_encoding_unverified|
|55002|req_red_cliff_buff|BATTLE-REDCLIFF|service_route/redCliff|etf → conditional|pb_red_cliff_data_to_client|request_encoding_unverified|
|55003|req_red_cliff_reset|BATTLE-REDCLIFF|service_route/redCliff|etf → conditional|pb_red_cliff_data_to_client|request_encoding_unverified|
|55004|req_red_cliff_refresh|BATTLE-REDCLIFF|service_route/redCliff|etf → conditional|pb_red_cliff_data_to_client|request_encoding_unverified|
|60002|req_magic_draw_choose_hero|DRAW-MAGICDRAW|service_route/drawActivity|etf → etf|pb_magic_draw_back||
|60003|req_magic_draw_achieve_award|DRAW-MAGICDRAW|service_route/drawActivity|etf → etf|pb_magic_draw_back||
|60004|req_magic_draw_hero_star_award|DRAW-MAGICDRAW|service_route/drawActivity|etf → etf|pb_magic_draw_back||
|67004|req_first_week_goal_progress_award|ITEM-FIRSTWEEKGOAL|service_route/firstWeekGoal|etf → etf|pb_first_week_goal_back||
|67005|req_first_week_goal_task_award|ITEM-FIRSTWEEKGOAL|service_route/firstWeekGoal|etf → etf|pb_first_week_goal_back||
|69001|req_growth_road_progress_award|ITEM-GROWTHROAD|service_route/growthRoad|etf → etf|pb_growth_road_back||
|69002|req_growth_road_task_award|ITEM-GROWTHROAD|service_route/growthRoad|etf → etf|pb_growth_road_back||
|69006|req_growth_target_phase_award|ITEM-GROWTHTARGET|service_route/itemCommandServices[2]|protobuf → protobuf/pb_growth_target_phase_award_req|pb_growth_target_phase_award_rsp||
|69007|req_growth_target_task_award|ITEM-GROWTHTARGET|service_route/itemCommandServices[2]|protobuf → protobuf/pb_growth_target_task_award_req|pb_growth_target_task_award_rsp||
|69101|req_task_award_progress_award|ITEM-TASKAWARD|service_route/itemCommandServices[3]|etf → etf|pb_task_award_back||
|69102|req_task_award_task_award|ITEM-TASKAWARD|service_route/itemCommandServices[3]|etf → etf|pb_task_award_back||
|69301|req_open_server_box_award|ITEM-OPENSERVERBOX|service_route/itemCommandServices[1]|etf → etf|pb_open_server_box_back||
|69302|req_open_server_box_progress|ITEM-OPENSERVERBOX|service_route/itemCommandServices[1]|etf → etf|pb_res_to_client||
|75001|req_realtime_map_enter|SOC-REALTIMEMAP|service_route/community|protobuf → protobuf/pb_realtime_enter_map_req|pb_realtime_enter_map_back||
|75002|req_realtime_map_leave|SOC-REALTIMEMAP|service_route/community|protobuf → protobuf/pb_realtime_leave_map_req|—|response_schema_missing|
|75003|req_realtime_map_back_born|SOC-REALTIMEMAP|service_route/community|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|75004|req_realtime_map_move|SOC-REALTIMEMAP|service_route/community|protobuf → protobuf/pb_realtime_map_role_move_req|—|response_schema_missing|
|75005|req_realtime_map_teleport_to_loc|SOC-REALTIMEMAP|service_route/community|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|76003|skin_wear|ROLE-SKIN|service_route/skinService|protobuf → conditional/pb_skin_wear_req|pb_skin_wear_back|request_encoding_unverified|
|76004|req_choose_exchange_skin|ROLE-SKIN|service_route/skinService|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|76005|req_exchange_skin|ROLE-SKIN|service_route/skinService|etf → conditional|pb_res_to_client|request_encoding_unverified|
|76006|toggle_ignore_fantasy_skin|ROLE-SKIN|service_route/skinService|protobuf → conditional/pb_toggle_ignore_fantasy_skin_req|—|response_schema_missing, request_encoding_unverified|
|76007|skin_activation_handbook|ROLE-SKIN|service_route/skinService|etf → conditional|pb_skin_handbook|request_encoding_unverified|
|76008|skin_handbook_info|ROLE-SKIN|service_route/skinService|etf → conditional|pb_skin_handbook|request_encoding_unverified|
|76009|skin_increase|ROLE-SKIN|service_route/skinService|etf → conditional|pb_skin_increase_back|request_encoding_unverified|
|76201|req_notify_gift_activate|PAY-NOTIFYGIFT|service_route/benefitCommerce|etf → conditional|pb_notify_gift_activate_rsp|request_encoding_unverified|
|76301|req_vip_exp_exchange|PAY-VIP|service_route/benefitCommerce|etf → conditional|pb_res_to_client|request_encoding_unverified|
|76501|theme_treasure_hunt_req|PLAY-THEMETREASURE|service_route/explorationAct|protobuf → unverified/pb_theme_treasure_hunt_req|pb_theme_treasure_hunt_rsp|request_encoding_unverified|
|76502|theme_treasure_challenge_req|PLAY-THEMETREASURE|service_route/explorationAct|protobuf → unverified/pb_theme_treasure_challenge_req|pb_res_to_client|request_encoding_unverified|
|76503|theme_treasure_server_challenge_req|PLAY-THEMETREASURE|service_route/explorationAct|etf → unverified|—|response_schema_missing, request_encoding_unverified|
|76504|theme_treasure_exchange_req|PLAY-THEMETREASURE|service_route/explorationAct|protobuf → unverified/pb_theme_treasure_exchange_req|pb_theme_treasure_exchange_rsp|request_encoding_unverified|
|76505|theme_treasure_challenge_turn_req|PLAY-THEMETREASURE|service_route/explorationAct|protobuf → unverified/pb_theme_treasure_challenge_turn_req|pb_res_to_client|request_encoding_unverified|
|76506|theme_treasure_target_req|PLAY-THEMETREASURE|service_route/explorationAct|etf → unverified|—|response_schema_missing, request_encoding_unverified|
|76507|theme_treasure_task_award_req|PLAY-THEMETREASURE|service_route/explorationAct|etf → unverified|pb_res_to_client|request_encoding_unverified|
|76508|theme_treasure_turn_award_req|PLAY-THEMETREASURE|service_route/explorationAct|etf → unverified|pb_res_to_client|request_encoding_unverified|
|76509|theme_treasure_server_award_req|PLAY-THEMETREASURE|service_route/explorationAct|etf → unverified|pb_res_to_client|request_encoding_unverified|
|76510|theme_treasure_special_award_req|PLAY-THEMETREASURE|service_route/explorationAct|etf → unverified|pb_res_to_client|request_encoding_unverified|
|76511|theme_treasure_daily_award_req|PLAY-THEMETREASURE|service_route/explorationAct|etf → unverified|pb_res_to_client|request_encoding_unverified|
|76512|req_theme_treasure_server|PLAY-THEMETREASURE|service_route/explorationAct|etf → unverified|pb_theme_treasure_server_rsp|request_encoding_unverified|
|76601|req_comment_init_hero|SOC-COMMENT|service_route/community|etf → conditional|pb_hero_comment_info|request_encoding_unverified|
|76602|req_comment_add_like_count|SOC-COMMENT|service_route/community|protobuf → protobuf/pb_req_add_like_count|pb_role_comment_info||
|76603|req_comment_add|SOC-COMMENT|service_route/community|protobuf → protobuf/pb_hero_comment_insert_req|pb_hero_comments||
|76604|req_comment_set_score|SOC-COMMENT|service_route/community|protobuf → protobuf/pb_hero_comment_set_score_req|pb_role_comment_info||
|76605|req_comment_role_score_info|SOC-COMMENT|service_route/community|etf → conditional|pb_role_comment_info|request_encoding_unverified|
|77001|req_red_envelope_award|PAY-REDENVELOPE|service_route/benefitCommerce|etf → conditional|pb_red_envelope_award_rsp|request_encoding_unverified|
|77002|req_red_envelope_info|PAY-REDENVELOPE|service_route/benefitCommerce|etf → conditional|pb_client_red_envelope|response_schema_missing, request_encoding_unverified|
|77003|req_red_envelope_info_by_sender|PAY-REDENVELOPE|service_route/benefitCommerce|etf → conditional|pb_client_red_envelopes|request_encoding_unverified|
|77101|vip_gift_award|PAY-VIPGIFT|service_route/benefitCommerce|etf → conditional|pb_res_to_client|request_encoding_unverified|
|77501|req_relationship_mark|SOC-RELATIONSHIP|service_route/community|protobuf → protobuf/pb_relation_mark_req|pb_relation_mark_rsp||
|77502|req_relationship_unmark|SOC-RELATIONSHIP|service_route/community|protobuf → protobuf/pb_relation_un_mark_req|pb_relation_un_mark_rsp||
|77503|req_relationship_set_no_notify|SOC-RELATIONSHIP|service_route/community|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|77601|req_adventure_role_list|SOC-ADVENTURE|service_route/community|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|77901|req_count_statistics_role_data|ITEM-COUNTSTATISTICS|service_route/recruit|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|78101|req_dungeon_evt_execute|BATTLE-GENERALDUNGEON|service_route/generalDungeon|protobuf → conditional/pb_dungeon_event_exe|pb_dungeon_event_res|request_encoding_unverified|
|78102|req_dungeon_data|BATTLE-GENERALDUNGEON|service_route/generalDungeon|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|78103|req_dungeon_enter_level|BATTLE-GENERALDUNGEON|service_route/generalDungeon|protobuf → conditional/pb_enter_dungeon_level|pb_dungeon_level_change|request_encoding_unverified|
|78104|req_dungeon_close_level|BATTLE-GENERALDUNGEON|service_route/generalDungeon|etf → conditional|pb_dungeon_level_change|request_encoding_unverified|
|78105|req_dungeon_evt_activate|BATTLE-GENERALDUNGEON|service_route/generalDungeon|protobuf → conditional/pb_dungeon_event_active|pb_dungeon_event_list|request_encoding_unverified|
|78106|req_dungeon_sync_map|BATTLE-GENERALDUNGEON|service_route/generalDungeon|protobuf → conditional/pb_dungeon_sync_map|—|response_schema_missing, request_encoding_unverified|
|78107|req_dungeon_use_prop|BATTLE-GENERALDUNGEON|service_route/generalDungeon|etf → conditional|pb_res_to_client|request_encoding_unverified|
|78201|req_hook_gather|ITEM-HOOK|service_route/r1FailClosed|protobuf → etf/pb_hook_gather_or_preview_req|pb_hook_gather_rsp|request_encoding_mismatch|
|78202|req_hook_preview|ITEM-HOOK|service_route/r1FailClosed|protobuf → etf/pb_hook_gather_or_preview_req|pb_hook_preview_rsp|request_encoding_mismatch|
|78203|req_hook_fast_gather|ITEM-HOOK|service_route/r1FailClosed|protobuf → etf/pb_hook_fast_gather_req|pb_hook_fast_rsp|request_encoding_mismatch|
|78204|req_hook_fast_produce_item|ITEM-HOOK|service_route/r1FailClosed|protobuf → etf/pb_hook_item_fast_req|pb_hook_item_fast_rsp|request_encoding_mismatch|
|78205|req_hook_produce_item|ITEM-HOOK|service_route/r1FailClosed|etf → etf|pb_res_to_client||
|78901|req_save_to_server_info_log|ROLE-CLIENTLOG|service_route/roleService|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|79101|req_sprint_receive_task|ACT-OPENSERVERSPRINT|service_route/actReward|etf → etf|pb_sprint_receive_task_back||
|79102|req_sprint_task_finish_player|ACT-OPENSERVERSPRINT|service_route/actReward|etf → etf|pb_sprint_task_finish||
|79103|req_sprint_server_process_award|ACT-OPENSERVERSPRINT|service_route/actReward|protobuf → etf/pb_sprint_server_process_req|pb_sprint_server_process_rsp|request_encoding_mismatch|
|79104|req_sprint_receive_rank_task|ACT-OPENSERVERSPRINT|service_route/sprint|protobuf → conditional/pb_sprint_rank_task_receive_req|pb_sprint_rank_task_receive_rsp|request_encoding_unverified|
|79201|req_hero_strategy_ranks|SOC-STRATEGY|service_route/community|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|82101|req_multi_login_award|ACT-MULTILOGIN|service_route/welfare|protobuf → protobuf/pb_multi_login_award_req|pb_res_to_client||
|82301|req_function_manual_award|ITEM-FUNCTIONMANUAL|service_route/functionManual|etf → conditional|pb_function_manual_award_rsp|request_encoding_unverified|
|82601|req_destiny_up|EQUIP-DESTINY|service_route/destiny|etf → conditional|pb_destiny_up_back|request_encoding_unverified|
|82602|req_fashion_act|PAY-FASHION|service_route/benefitCommerce|etf → conditional|pb_res_to_client|request_encoding_unverified|
|82603|req_fashion_wear|PAY-FASHION|service_route/benefitCommerce|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|82604|req_fashion_lv|PAY-FASHION|service_route/benefitCommerce|etf → conditional|pb_fashion_lv_back|request_encoding_unverified|
|82701|req_vip_city_rebuild|PAY-VIPCITY|service_route/benefitCommerce|etf → conditional|pb_res_to_client|request_encoding_unverified|
|83001|req_war_rune_active|EQUIP-WARRUNE|service_route/endgameDevelopServices[1]|etf → unverified|pb_war_rune_active_back|request_encoding_unverified|
|83002|req_war_rune_up_stage|EQUIP-WARRUNE|service_route/endgameDevelopServices[1]|etf → unverified|pb_res_to_client|request_encoding_unverified|
|83003|req_war_rune_attr_random|EQUIP-WARRUNE|service_route/endgameDevelopServices[1]|etf → unverified|pb_war_rune_random_attr_back|request_encoding_unverified|
|83004|req_war_rune_recast|EQUIP-WARRUNE|service_route/endgameDevelopServices[1]|protobuf → unverified/pb_war_rune_recast_req|pb_attr_develop_info|request_encoding_unverified|
|83005|req_war_rune_edu|EQUIP-WARRUNE|service_route/endgameDevelopServices[1]|etf → unverified|pb_war_rune_edu_back|request_encoding_unverified|
|83006|req_war_rune_up_level|EQUIP-WARRUNE|service_route/endgameDevelopServices[1]|etf → unverified|pb_res_to_client|request_encoding_unverified|
|83007|req_war_rune_up_star|EQUIP-WARRUNE|service_route/endgameDevelopServices[1]|etf → unverified|pb_war_rune_up_star_back|request_encoding_unverified|
|83101|req_guild_red_envelope_fetch|SOC-GUILDREDENVELOPE|service_route/guildActivity|protobuf → protobuf/pb_guild_red_envelope_fetch_req|pb_guild_red_envelope_fetch_rsp||
|83102|req_guild_red_envelope_send|SOC-GUILDREDENVELOPE|service_route/guildActivity|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|83103|req_guild_red_envelope_get_data|SOC-GUILDREDENVELOPE|service_route/guildActivity|etf → conditional|pb_guild_red_envelope_get_data_rsp|request_encoding_unverified|
|83104|req_guild_red_envelope_create|SOC-GUILDREDENVELOPE|service_route/guildActivity|etf → conditional|pb_role_guild_red_envelope|request_encoding_unverified|
|83105|req_guild_red_envelop_show_log|SOC-GUILDREDENVELOPE|service_route/guildActivity|protobuf → protobuf/pb_guild_red_envelope_show_log_req|pb_guild_red_envelope_fetch_log|response_schema_missing|
|83106|req_guild_red_envelop_thanks|SOC-GUILDREDENVELOPE|service_route/guildActivity|etf → conditional|pb_res_to_client|request_encoding_unverified|
|83107|req_guild_red_envelop_rank|SOC-GUILDREDENVELOPE|service_route/guildActivity|etf → conditional|pb_guild_red_envelope_rank_list|request_encoding_unverified|
|83108|req_guild_red_envelop_fetch_join|SOC-GUILDREDENVELOPE|service_route/guildActivity|etf → conditional|pb_res_to_client|request_encoding_unverified|
|83201|req_unlock_cell|PLAY-CAMPSITE|service_route/cabin|etf → conditional|pb_res_to_client|request_encoding_unverified|
|83202|re_place_hero|PLAY-CAMPSITE|service_route/cabin|protobuf → conditional/pb_campsite_place|pb_campsite_data|request_encoding_unverified|
|83301|req_arena_contest_enter|BATTLE-ARENACONTEST|service_route/arenaContest|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|83302|req_arena_contest_leave|BATTLE-ARENACONTEST|service_route/arenaContest|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|83303|req_arena_contest_sign_up|BATTLE-ARENACONTEST|service_route/arenaContest|etf → conditional|pb_arena_contest_role|request_encoding_unverified|
|83304|req_arena_contest_guess|BATTLE-ARENACONTEST|service_route/arenaContest|protobuf → conditional/pb_arena_contest_guess_req|pb_arena_contest_guess_rsp|request_encoding_unverified|
|83305|req_arena_contest_rev_fight_award|BATTLE-ARENACONTEST|service_route/arenaContest|etf → conditional|pb_arena_contest_fight_award_back|request_encoding_unverified|
|83306|req_arena_contest_get_guess_info|BATTLE-ARENACONTEST|service_route/arenaContest|etf → conditional|pb_arena_contest_guess_info|request_encoding_unverified|
|83307|req_arena_contest_get_role_fight_report|BATTLE-ARENACONTEST|service_route/arenaContest|etf → conditional|pb_arena_contest_fight_report_role|request_encoding_unverified|
|83308|req_arena_contest_get_final_info|BATTLE-ARENACONTEST|service_route/arenaContest|etf → conditional|pb_arena_contest_final_match_info|request_encoding_unverified|
|83309|req_arena_contest_get_final_power_info|BATTLE-ARENACONTEST|service_route/arenaContest|etf → conditional|pb_arena_contest_role_power_ret|request_encoding_unverified|
|83310|req_arena_contest_congratulate|BATTLE-ARENACONTEST|service_route/arenaContest|etf → conditional|pb_arena_contest_congratulate_back|request_encoding_unverified|
|83311|req_arena_contest_get_top_roles|BATTLE-ARENACONTEST|service_route/arenaContest|etf → conditional|pb_arena_contest_top_info|request_encoding_unverified|
|83312|req_arena_contest_watch_fight|BATTLE-ARENACONTEST|service_route/arenaContest|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|83313|req_arena_contest_rev_task_award|BATTLE-ARENACONTEST|service_route/arenaContest|etf → conditional|pb_arena_contest_task_award_back|request_encoding_unverified|
|83314|req_arena_contest_rev_guess_award|BATTLE-ARENACONTEST|service_route/arenaContest|protobuf → conditional/pb_arena_contest_guess_award_req|pb_arena_contest_guess_award_rsp|request_encoding_unverified|
|83315|req_arena_contest_watch_award|BATTLE-ARENACONTEST|service_route/arenaContest|etf → conditional|pb_res_to_client|request_encoding_unverified|
|83401|req_guild_trial_help_info|SOC-GUILDTRIAL|service_route/guildActivity|etf → conditional|pb_guild_trial_help_info|request_encoding_unverified|
|83402|req_guild_trial_help_log|SOC-GUILDTRIAL|service_route/guildActivity|etf → conditional|pb_guild_trial_help_log_toc|request_encoding_unverified|
|83403|req_guild_trial_help|SOC-GUILDTRIAL|service_route/guildActivity|etf → conditional|pb_guild_trial_help_toc|request_encoding_unverified|
|83404|req_guild_trial_set_notice|SOC-GUILDTRIAL|service_route/guildActivity|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|83405|req_guild_trial_gain_pass_award|SOC-GUILDTRIAL|service_route/guildActivity|etf → conditional|pb_res_to_client|request_encoding_unverified|
|83406|req_guild_trial_gain_box_award|SOC-GUILDTRIAL|service_route/guildActivity|protobuf → protobuf/pb_guild_trial_gain_box_tos|pb_guild_trial_gain_box_toc||
|83407|req_guild_trial_gain_fight_log|SOC-GUILDTRIAL|service_route/guildActivity|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|83408|req_guild_trial_rev_fail|SOC-GUILDTRIAL|service_route/guildActivity|etf → conditional|pb_guild_trial_rev_fail_toc|request_encoding_unverified|
|83409|req_guild_trial_suppress|SOC-GUILDTRIAL|service_route/guildActivity|protobuf → protobuf/pb_guild_trial_fight_tos|pb_guild_trial_fight_toc||
|83410|req_guild_trial_read_help_log|SOC-GUILDTRIAL|service_route/guildActivity|protobuf → protobuf/pb_guild_trial_read_help_log_req|pb_guild_trial_read_help_log_rsp||
|83411|req_guild_trial_thank_help|SOC-GUILDTRIAL|service_route/guildActivity|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|83701|req_mini_game_settle|PLAY-MINIGAME|service_route/explorationAct|protobuf → unverified/pb_mini_game_settle_req|pb_mini_game_settle_rsp|request_encoding_unverified|
|83702|req_mini_game_enter|PLAY-MINIGAME|service_route/explorationAct|protobuf → unverified/pb_mini_game_enter_req|pb_mini_game_enter_rsp|request_encoding_unverified|
|83703|req_slot_machine_retry|PLAY-MINIGAME|service_route/explorationAct|etf → unverified|pb_mini_game_slot_machine|request_encoding_unverified|
|83704|req_mini_game_handle|PLAY-MINIGAME|service_route/explorationAct|protobuf → unverified/pb_mini_game_handle_req|pb_mini_game_handle_rsp|request_encoding_unverified|
|84001|req_hunter_arena_clear_change|BATTLE-HUNTERARENA|service_route/hunterArena|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|84002|req_hunter_arena_day_award|BATTLE-HUNTERARENA|service_route/hunterArena|etf → conditional|pb_res_to_client|request_encoding_unverified|
|84003|req_hunter_arena_season_award|BATTLE-HUNTERARENA|service_route/hunterArena|etf → conditional|pb_res_to_client|request_encoding_unverified|
|84004|req_hunter_arena_palace|BATTLE-HUNTERARENA|service_route/hunterArena|etf → conditional|pb_hunter_arena_palace|request_encoding_unverified|
|84005|req_hunter_arena_fight|BATTLE-HUNTERARENA|service_route/hunterArena|etf → conditional|pb_fight_response|request_encoding_unverified|
|84006|req_hunter_arena_set_ignore|BATTLE-HUNTERARENA|service_route/hunterArena|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|84007|req_hunter_arena_set_read_report_time|BATTLE-HUNTERARENA|service_route/hunterArena|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|84008|req_hunter_arena_history_rank|BATTLE-HUNTERARENA|service_route/hunterArena|etf → conditional|pb_hunter_arena_history_rank_rsp|request_encoding_unverified|
|84009|req_hunter_arena_report_lock|BATTLE-HUNTERARENA|service_route/hunterArena|protobuf → conditional/pb_hunter_arena_set_report_lock|—|response_schema_missing, request_encoding_unverified|
|84010|req_hunter_arena_set_award_tips|BATTLE-HUNTERARENA|service_route/hunterArena|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|84011|req_hunter_arena_enter_form|BATTLE-HUNTERARENA|service_route/hunterArena|etf → conditional|pb_role_hunter_arena|request_encoding_unverified|
|84401|req_martial_club_first_award|BATTLE-MARTIALCLUB|service_route/martialClub|etf → conditional|pb_res_to_client|request_encoding_unverified|
|84404|req_martial_club_create_team|BATTLE-MARTIALCLUB|service_route/martialClub|protobuf → conditional/pb_martial_club_team_create_req|pb_martial_club_team|request_encoding_unverified|
|84405|req_martial_club_add_bot|BATTLE-MARTIALCLUB|service_route/martialClub|etf → conditional|pb_martial_club_team|request_encoding_unverified|
|84406|req_martial_club_set_help|BATTLE-MARTIALCLUB|service_route/martialClub|etf → conditional|pb_martial_club_team|request_encoding_unverified|
|84407|req_martial_club_join_team|BATTLE-MARTIALCLUB|service_route/martialClub|etf → conditional|pb_martial_club_team|request_encoding_unverified|
|84408|req_martial_club_exit_team|BATTLE-MARTIALCLUB|service_route/martialClub|etf → conditional|pb_martial_club_team|request_encoding_unverified|
|84409|req_martial_club_team_info|BATTLE-MARTIALCLUB|service_route/martialClub|etf → conditional|pb_martial_club_team_rsp|request_encoding_unverified|
|84410|req_martial_club_set_team_info|BATTLE-MARTIALCLUB|service_route/martialClub|protobuf → conditional/pb_martial_club_set_team_info_req|pb_martial_club_team|request_encoding_unverified|
|84411|req_martial_club_set_ready|BATTLE-MARTIALCLUB|service_route/martialClub|etf → conditional|pb_martial_club_team|request_encoding_unverified|
|84412|req_martial_club_invite|BATTLE-MARTIALCLUB|service_route/martialClub|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|84413|req_martial_club_invite_all|BATTLE-MARTIALCLUB|service_route/martialClub|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|84414|req_martial_club_set_member_pos|BATTLE-MARTIALCLUB|service_route/martialClub|protobuf → conditional/pb_martial_club_set_member_pos_req|pb_martial_club_team|request_encoding_unverified|
|84415|req_martial_club_pass_count|BATTLE-MARTIALCLUB|service_route/martialClub|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|84416|req_martial_club_team_kick|BATTLE-MARTIALCLUB|service_route/martialClub|etf → conditional|pb_martial_club_team|request_encoding_unverified|
|84417|req_martial_club_team_fight|BATTLE-MARTIALCLUB|service_route/martialClub|etf → conditional|pb_martial_club_team_fight_rsp|request_encoding_unverified|
|84418|req_martial_club_bot_list|BATTLE-MARTIALCLUB|service_route/martialClub|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|84419|req_martial_club_give_up|BATTLE-MARTIALCLUB|service_route/martialClub|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|84420|req_martial_club_settlement|BATTLE-MARTIALCLUB|service_route/martialClub|etf → conditional|pb_martial_club_team_settle_rsp|request_encoding_unverified|
|84421|req_martial_club_team_members|BATTLE-MARTIALCLUB|service_route/martialClub|protobuf → conditional/pb_martial_club_members_req|pb_martial_club_members_rsp|request_encoding_unverified|
|84422|req_martial_club_team_skip|BATTLE-MARTIALCLUB|service_route/martialClub|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|84423|req_martial_club_employ_list|BATTLE-MARTIALCLUB|service_route/martialClub|etf → conditional|pb_martial_club_employ_rsp|request_encoding_unverified|
|84424|req_martial_club_employ_enter|BATTLE-MARTIALCLUB|service_route/martialClub|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|84425|req_martial_club_match|BATTLE-MARTIALCLUB|service_route/martialClub|protobuf → conditional/pb_martial_club_match_req|pb_martial_club_match_rsp|request_encoding_unverified|
|84426|req_martial_club_relic|BATTLE-MARTIALCLUB|service_route/martialClub|protobuf → conditional/pb_martial_club_relic_req|pb_martial_club_relic_rsp|request_encoding_unverified|
|84431|req_martial_act_pass_team_award|BATTLE-MARTIALCLUBACT|service_route/martialClubAct|etf → conditional|pb_martial_club_act_pass_award_rsp|request_encoding_unverified|
|84432|req_martial_act_server_award|BATTLE-MARTIALCLUBACT|service_route/martialClubAct|etf → conditional|pb_martial_club_act_server_award_rsp|request_encoding_unverified|
|84501|req_tactics_level_up|HERO-TACTICS|service_route/heroCommandServices[11]|etf → etf|pb_tactics_level_up_back||
|84502|req_tactics_reset|HERO-TACTICS|service_route/heroCommandServices[11]|etf → etf|pb_tactics_reset_back||
|84601|req_princess_award|PAY-PRINCESS|service_route/welfare|protobuf → protobuf/pb_princess_req|pb_princess_back||
|84602|req_princess_award_supplement|PAY-PRINCESS|service_route/benefitCommerce|etf → conditional|pb_princess_supplement_back|request_encoding_unverified|
|84603|req_cross_refresh_supplement|PAY-PRINCESS|service_route/benefitCommerce|etf → conditional|pb_princess_energy_supplement|request_encoding_unverified|
|84701|req_like_danmuku|SOC-DANMAKU|service_route/community|protobuf → protobuf/pb_req_like_danmaku|—|response_schema_missing|
|84901|req_task_group_task_award|ITEM-TASKGROUP|service_route/r1FailClosed|protobuf → etf/pb_task_group_task_award_req|pb_task_group_task_award_rsp|request_encoding_mismatch|
|84902|req_task_group_group_award|ITEM-TASKGROUP|service_route/r1FailClosed|protobuf → etf/pb_task_group_group_award_req|pb_task_group_group_award_rsp|request_encoding_mismatch|
|85501|req_guild_active_award|SOC-GUILDACTIVE|service_route/guildSociety|protobuf → protobuf/pb_guild_active_award_req|pb_guild_active_award_rsp||
|85502|req_guild_active_point|SOC-GUILDACTIVE|service_route/guildSociety|etf → conditional|pb_guild_active_info|request_encoding_unverified|
|85503|req_guild_active_finish_award|SOC-GUILDACTIVE|service_route/guildSociety|protobuf → protobuf/pb_guild_active_award_req|pb_guild_active_award_rsp||
|85504|req_guild_auto_dissolve_read|SOC-GUILDACTIVE|service_route/guildSociety|etf → conditional|pb_guild_auto_dissolve_role|request_encoding_unverified|
|85505|req_guild_pre_auto_dissolve_read|SOC-GUILDACTIVE|service_route/guildSociety|etf → conditional|pb_guild_auto_dissolve_role|request_encoding_unverified|
|85601|req_treasure_hunt|PLAY-TREASUREHUNT|service_route/explorationAct|etf → unverified|pb_treasure_hunt_ret_all|request_encoding_unverified|
|85605|req_treasure_hunt_buy_shovel|PLAY-TREASUREHUNT|service_route/explorationAct|etf → unverified|pb_res_to_client|request_encoding_unverified|
|85606|req_treasure_hunt_compose|PLAY-TREASUREHUNT|service_route/explorationAct|protobuf → unverified/pb_treasure_hunt_compose_req|—|response_schema_missing, request_encoding_unverified|
|85607|req_treasure_hunt_auto_compose|PLAY-TREASUREHUNT|service_route/explorationAct|etf → unverified|pb_treasure_hunt_compose_ret|request_encoding_unverified|
|85608|req_treasure_hunt_delete_shovel|PLAY-TREASUREHUNT|service_route/explorationAct|etf → unverified|pb_treasure_hunt_delete_ret|request_encoding_unverified|
|85609|req_treasure_hunt_exchange_shovel|PLAY-TREASUREHUNT|service_route/explorationAct|protobuf → unverified/pb_treasure_hunt_exchange_req|—|response_schema_missing, request_encoding_unverified|
|85610|req_treasure_hunt_refresh|PLAY-TREASUREHUNT|service_route/explorationAct|etf → unverified|pb_treasure_hunt_refresh_ret|request_encoding_unverified|
|85701|req_museum_rev_popularity_award|EQUIP-MUSEUM|service_route/endgameDevelopServices[2]|etf → unverified|pb_res_to_client|request_encoding_unverified|
|85702|req_museum_active_collection|EQUIP-MUSEUM|service_route/endgameDevelopServices[2]|protobuf → unverified/pb_museum_req_list|pb_res_to_client|request_encoding_unverified|
|85804|req_career_life_story_award|ITEM-CAREERLIFE|service_route/itemCommandServices[4]|etf → etf|pb_career_life_back||
|85901|req_recommend_gift_active|PAY-RECOMMENDGIFT|gateway_route/gateway|protobuf → protobuf/pb_recommend_gift_active_req|pb_recommend_gift_active_rsp||
|87001|req_elite_mission_custom|BATTLE-ELITEMISSION|service_route/eliteMission|etf → conditional|pb_elite_mission_back|request_encoding_unverified|
|87002|req_elite_mission_box_award|BATTLE-ELITEMISSION|service_route/eliteMission|protobuf → conditional/pb_elite_mission_box_award_req|pb_elite_mission_box_award_back|request_encoding_unverified|
|87003|req_elite_mission_chapter_pass|BATTLE-ELITEMISSION|service_route/eliteMission|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|87104|req_soul_trial_draw_award|BATTLE-SOULTRIAL|service_route/soulTrial|etf → conditional|pb_soul_trial_draw_back|request_encoding_unverified|
|87105|req_soul_trial_rev_draw_award|BATTLE-SOULTRIAL|service_route/soulTrial|etf → conditional|pb_soul_trial_rev_draw_back|request_encoding_unverified|
|87201|req_hero_lease_place|HERO-HEROLEASE|service_route/heroCommandServices[4]|protobuf → protobuf/pb_lease_hero_place_req|pb_role_lease_hero||
|87202|req_hero_lease_lease|HERO-HEROLEASE|service_route/heroCommandServices[4]|protobuf → protobuf/pb_lease_hero_lease_req|pb_role_lease_hero||
|87203|req_hero_lease_give_back|HERO-HEROLEASE|service_route/heroCommandServices[4]|protobuf → protobuf/pb_lease_hero_give_back_req|pb_role_lease_hero||
|87204|req_hero_lease_take_back|HERO-HEROLEASE|service_route/heroCommandServices[4]|protobuf → protobuf/pb_lease_hero_take_back_req|pb_role_lease_hero||
|87205|req_hero_lease_list|HERO-HEROLEASE|service_route/heroCommandServices[4]|protobuf → protobuf/pb_lease_hero_list_req|pb_lease_hero_list_rsp||
|87301|req_permanent_card_award|PAY-PERMANENTCARD|service_route/benefitCommerce|etf → conditional|pb_permanent_card_back|request_encoding_unverified|
|87401|req_recovery_free_award|PAY-RECOVERY|service_route/benefitCommerce|etf → conditional|pb_res_to_client|request_encoding_unverified|
|87501|req_weekend_award|PAY-WEEKENDBONUS|service_route/benefitCommerce|etf → conditional|pb_weekend_bonus_back|request_encoding_unverified|
|87502|req_weekend_play_count_award|PAY-WEEKENDBONUS|service_route/benefitCommerce|etf → conditional|pb_weekend_bonus_back|request_encoding_unverified|
|87601|req_fantasy_equip_put_on|EQUIP-FANTASYEQUIP|service_route/fantasyEquipment|protobuf → conditional/pb_fantasy_equip_put_on_req|pb_fantasy_equip_put_on_rsp|request_encoding_unverified|
|87603|req_fantasy_equip_take_off|EQUIP-FANTASYEQUIP|service_route/fantasyEquipment|protobuf → conditional/pb_fantasy_equip_take_off_req|pb_fantasy_equip_take_off_rsp|request_encoding_unverified|
|87604|req_fantasy_equip_bless|EQUIP-FANTASYEQUIP|service_route/fantasyEquipment|protobuf → conditional/pb_fantasy_equip_bless_req|pb_fantasy_equip_bless_rsp|request_encoding_unverified|
|87605|req_fantasy_equip_break_up|EQUIP-FANTASYEQUIP|service_route/fantasyEquipment|protobuf → conditional/pb_fantasy_equip_id|pb_fantasy_equip_dev_rsp|request_encoding_unverified|
|87606|req_fantasy_equip_levelup|EQUIP-FANTASYEQUIP|service_route/fantasyEquipment|protobuf → conditional/pb_fantasy_equip_level_up_req|pb_fantasy_equip_level_up_rsp|request_encoding_unverified|
|87607|req_fantasy_equip_starup|EQUIP-FANTASYEQUIP|service_route/fantasyEquipment|protobuf → conditional/pb_fantasy_equip_composite_req|pb_fantasy_equip_composite_rsp|request_encoding_unverified|
|87608|req_fantasy_equip_sp_starup|EQUIP-FANTASYEQUIP|service_route/fantasyEquipment|protobuf → conditional/pb_fantasy_equip_dev_req|pb_fantasy_equip_dev_rsp|request_encoding_unverified|
|87609|req_fantasy_equip_composite|EQUIP-FANTASYEQUIP|service_route/fantasyEquipment|protobuf → conditional/pb_fantasy_equip_composite_req|pb_fantasy_equip_composite_rsp|request_encoding_unverified|
|87610|req_fantasy_equip_synthesis|EQUIP-FANTASYEQUIP|service_route/fantasyEquipment|etf → conditional|pb_res_to_client|request_encoding_unverified|
|87611|req_fantasy_lineup_custom|EQUIP-FANTASYEQUIP|service_route/fantasyEquipment|protobuf → conditional/pb_fantasy_equip_lineup_custom_req|pb_fantasy_equip_lineup_custom_rsp|request_encoding_unverified|
|87613|req_fantasy_one_key_lineup_custom|EQUIP-FANTASYEQUIP|service_route/fantasyEquipment|protobuf → conditional/pb_fantasy_equip_lineup_one_key_req|pb_fantasy_equip_lineup_one_key_rsp|request_encoding_unverified|
|87614|rep_fantasy_in_formation|EQUIP-FANTASYEQUIP|service_route/fantasyEquipment|protobuf → conditional/pb_fantasy_formation_list|—|response_schema_missing, request_encoding_unverified|
|87615|req_fantasy_equip_sp_quality_up|EQUIP-FANTASYEQUIP|service_route/fantasyEquipment|protobuf → conditional/pb_fantasy_awakening_req|pb_fantasy_equip_dev_rsp|request_encoding_unverified|
|87616|req_fantasy_equip_ur_star_up|EQUIP-FANTASYEQUIP|service_route/fantasyEquipment|protobuf → conditional/pb_fantasy_awakening_req|pb_fantasy_equip_dev_rsp|request_encoding_unverified|
|87617|req_fantasy_equip_draw_set_wish|EQUIP-FANTASYEQUIP|multi_owner/fantasyDraw|protobuf → conditional/pb_fantasy_equip_draw_wish_req|pb_fantasy_draw|request_encoding_unverified, shadowed_owner|
|87618|req_fantasy_equip_draw_buy|EQUIP-FANTASYEQUIP|service_route/recruit|etf → conditional|pb_fantasy_equip_draw_buy_rsp|request_encoding_unverified|
|87701|req_lineup_snapshot_hero|HERO-LINEUPSNAPSHOT|service_route/r1FailClosed|etf → etf|pb_lineup_hero_server||
|87702|req_lineup_snapshot_list|HERO-LINEUPSNAPSHOT|service_route/r1FailClosed|protobuf → etf/pb_lineup_snapshot_list_req|pb_lineup_snapshot_list|request_encoding_mismatch|
|87801|req_grand_tourer_get_token|PLAY-GRANDTOURER|service_route/explorationAct|etf → unverified|pb_res_to_client|request_encoding_unverified|
|87802|req_grand_tourer_task_award|PLAY-GRANDTOURER|service_route/explorationAct|etf → unverified|pb_grand_tourer_task_back|request_encoding_unverified|
|87803|req_grand_tourer_exchange_token|PLAY-GRANDTOURER|service_route/explorationAct|etf → unverified|pb_res_to_client|request_encoding_unverified|
|87804|req_grand_tourer_distance_award|PLAY-GRANDTOURER|service_route/explorationAct|etf → unverified|pb_res_to_client|request_encoding_unverified|
|87805|req_grand_tourer_enhance|PLAY-GRANDTOURER|service_route/explorationAct|etf → unverified|pb_res_to_client|request_encoding_unverified|
|88001|req_dream_finish_event|PLAY-DREAM|service_route/explorationAct|protobuf → unverified/pb_dream_finish_event_req|pb_dream_fight_event_rsp|request_encoding_unverified|
|88002|req_dream_day_award|PLAY-DREAM|service_route/explorationAct|etf → unverified|pb_dream_award_rsp|request_encoding_unverified|
|88003|req_dream_week_finish_award|PLAY-DREAM|service_route/explorationAct|etf → unverified|pb_dream_award_rsp|request_encoding_unverified|
|88004|req_dream_all_finish_award|PLAY-DREAM|service_route/explorationAct|etf → unverified|pb_dream_award_rsp|request_encoding_unverified|
|88005|req_dream_finish_task|PLAY-DREAM|service_route/explorationAct|etf → unverified|pb_dream_award_rsp|request_encoding_unverified|
|88006|req_dream_collect_award|PLAY-DREAM|service_route/explorationAct|etf → unverified|pb_dream_award_rsp|request_encoding_unverified|
|88007|req_dream_box_award|PLAY-DREAM|service_route/explorationAct|etf → unverified|pb_dream_award_rsp|request_encoding_unverified|
|88008|req_dream_npc_lineup|PLAY-DREAM|service_route/explorationAct|etf → unverified|pb_dream_npc_lineup_rsp|request_encoding_unverified|
|88009|req_dream_single_collect_award|PLAY-DREAM|service_route/explorationAct|etf → unverified|pb_dream_award_rsp|request_encoding_unverified|
|88010|req_dream_refresh_event|PLAY-DREAM|service_route/explorationAct|etf → unverified|pb_dream_refresh_event_rsp|request_encoding_unverified|
|88101|req_level_sprint_free_award|PAY-LEVELSPRINT|service_route/benefitCommerce|etf → conditional|pb_res_to_client|request_encoding_unverified|
|88201|req_house_assistant_choose_bg|PAY-HOUSEASSISTANT|service_route/houseAssistant|protobuf → conditional/pb_house_assistant_use_req_list|pb_house_assistant_use_rsp|request_encoding_unverified|
|88202|req_house_assistant_choose_assist|PAY-HOUSEASSISTANT|service_route/houseAssistant|protobuf → conditional/pb_house_assistant_use_req_list|pb_house_assistant_use_rsp|request_encoding_unverified|
|88203|req_house_assistant_trial|PAY-HOUSEASSISTANT|service_route/houseAssistant|protobuf → conditional/pb_house_assistant_trial_req|pb_house_assistant_trial_rsp|request_encoding_unverified|
|88204|req_house_assistant_trial_cancel|PAY-HOUSEASSISTANT|service_route/houseAssistant|protobuf → conditional/pb_house_assistant_trial_cancel_req|pb_house_assistant_trial_rsp|request_encoding_unverified|
|88301|req_select_group|PAY-RECHARGEBONUS|service_route/rechargeBonus|etf → etf|pb_recharge_bonus||
|88302|req_get_recharge_bonus_award|PAY-RECHARGEBONUS|service_route/rechargeBonus|etf → etf|pb_recharge_bonus_back||
|88401|req_res_rollback_preview|ITEM-RESROLLBACK|service_route/r1FailClosed|protobuf → etf/pb_res_rollback_req|pb_res_rollback_preview_ret|request_encoding_mismatch|
|88402|req_res_rollback|ITEM-RESROLLBACK|service_route/r1FailClosed|protobuf → etf/pb_res_rollback_req|pb_res_rollback_ret|request_encoding_mismatch|
|88501|req_tournament_clear_change|BATTLE-TOURNAMENT|service_route/tournament|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|88502|req_tournament_day_award|BATTLE-TOURNAMENT|service_route/tournament|etf → conditional|pb_res_to_client|request_encoding_unverified|
|88503|req_tournament_season_award|BATTLE-TOURNAMENT|service_route/tournament|etf → conditional|pb_res_to_client|request_encoding_unverified|
|88504|req_tournament_palace|BATTLE-TOURNAMENT|service_route/tournament|etf → conditional|pb_match_pvp_palace|request_encoding_unverified|
|88505|req_tournament_fight|BATTLE-TOURNAMENT|service_route/tournament|etf → conditional|pb_fight_response|request_encoding_unverified|
|88506|req_tournament_set_ignore|BATTLE-TOURNAMENT|service_route/tournament|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|88507|req_tournament_set_read_report_time|BATTLE-TOURNAMENT|service_route/tournament|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|88508|req_tournament_history_rank|BATTLE-TOURNAMENT|service_route/tournament|etf → conditional|pb_hunter_arena_history_rank_rsp|request_encoding_unverified|
|88509|req_tournament_report_lock|BATTLE-TOURNAMENT|service_route/tournament|protobuf → conditional/pb_match_pvp_set_report_lock|—|response_schema_missing, request_encoding_unverified|
|88510|req_tournament_start_promote|BATTLE-TOURNAMENT|service_route/tournament|etf → conditional|pb_tournament_role|request_encoding_unverified|
|88511|req_tournament_enter_form|BATTLE-TOURNAMENT|service_route/tournament|etf → conditional|pb_tournament_role|request_encoding_unverified|
|88601|req_heat_gift_support|PAY-HEATGIFT|service_route/benefitCommerce|etf → conditional|pb_heat_gift_support_back|request_encoding_unverified|
|88602|req_heat_gift_server_info|PAY-HEATGIFT|service_route/benefitCommerce|etf → conditional|pb_heat_gift|request_encoding_unverified|
|88701|req_flash_sale_bargain|PAY-FLASHSALE|service_route/benefitCommerce|etf → conditional|pb_flash_sale_bargain_ret|request_encoding_unverified|
|88702|req_flash_sale_hero|PAY-FLASHSALE|service_route/benefitCommerce|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|88801|req_team_suggest_award|HERO-TEAMSUGGEST|service_route/teamSuggest|etf → conditional|pb_res_to_client|request_encoding_unverified|
|88802|req_team_suggest_active|HERO-TEAMSUGGEST|service_route/teamSuggest|protobuf → conditional/pb_hero_team_suggest_active|pb_hero_team_suggest_collect|request_encoding_unverified|
|88803|req_team_suggest_select|HERO-TEAMSUGGEST|service_route/teamSuggest|etf → conditional|pb_hero_team_suggest|request_encoding_unverified|
|88901|req_assistant_set_func|PAY-ASSISTANT|service_route/benefitCommerce|protobuf → protobuf/pb_assistant_setting_req|pb_assistant_setting_back||
|88902|req_assistant_do_command|PAY-ASSISTANT|service_route/benefitCommerce|protobuf → protobuf/pb_assistant_execute_req|pb_assistant_execute_back||
|88903|req_assistant_start_try|PAY-ASSISTANT|service_route/benefitCommerce|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|88921|req_pin_ball_act_achieve_award|DRAW-PINBALL|service_route/drawActivity|etf → etf|pb_act_pin_ball_role_res_back||
|88922|req_get_day_marbles_award|DRAW-FANTASYEQUIPACT|service_route/fantasyEquipAct|etf → conditional|pb_res_to_client|request_encoding_unverified|
|88924|req_fantasy_draw_set_wish|DRAW-FANTASYEQUIPACT|service_route/fantasyEquipAct|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|88925|req_pipe_connect_reset|DRAW-FANTASYEQUIPACT|service_route/drawActivity|etf → etf|pb_pipe_connect_game||
|88926|req_pipe_connect_play|DRAW-FANTASYEQUIPACT|service_route/drawActivity|protobuf → etf/pb_pipe_connect_play_req|pb_pipe_connect_game|request_encoding_mismatch|
|88927|req_fantasy_act_vote_award|DRAW-FANTASYEQUIPACT|service_route/fantasyEquipAct|etf → conditional|pb_res_to_client|request_encoding_unverified|
|88928|req_fantasy_act_trial_award|DRAW-FANTASYEQUIPACT|service_route/fantasyEquipAct|protobuf → conditional/pb_fantasy_act_receive_trial_req|pb_res_to_client|request_encoding_unverified|
|88929|req_fantasy_act_trial_wear|DRAW-FANTASYEQUIPACT|service_route/fantasyEquipAct|protobuf → conditional/pb_fantasy_act_wear_equip_req|pb_fantasy_act_wear_back|request_encoding_unverified|
|88930|req_fantasy_act_trial_bless|DRAW-FANTASYEQUIPACT|service_route/fantasyEquipAct|protobuf → conditional/pb_fantasy_act_wear_bless_req|pb_fantasy_act_wear_bless_back|request_encoding_unverified|
|88931|req_fantasy_act_trial_copy|DRAW-FANTASYEQUIPACT|service_route/fantasyEquipAct|etf → conditional|pb_fantasy_equip_act_trial|request_encoding_unverified|
|88932|req_fantasy_act_draw_task|DRAW-FANTASYEQUIPACT|service_route/fantasyEquipAct|protobuf → conditional/pb_fantasy_act_task_reward_req|pb_fantasy_act_task_reward_rev|request_encoding_unverified|
|88941|req_pyramid_draw|DRAW-PYRAMID|service_route/drawActivity|etf → etf|pb_pyramid_draw_back||
|88942|req_pyramid_task|DRAW-PYRAMID|service_route/drawActivity|etf → etf|pb_pyramid_task_rsp||
|88951|req_hero_blazon_up|HERO-HEROBLAZON|service_route/r1FailClosed|protobuf → etf/pb_hero_blazon_up|pb_hero_blazon_up_back|request_encoding_mismatch|
|88953|req_hero_blazon_update_talent|HERO-HEROBLAZON|service_route/r1FailClosed|protobuf → etf/pb_hero_blazon_update_talent_req|pb_hero_blazon_update_talent_rsp|request_encoding_mismatch|
|88955|req_hero_blazon_update_skill|HERO-HEROBLAZON|service_route/heroCommandServices[9]|etf → etf|pb_hero_blazon_update_skill_back||
|88956|req_hero_blazon_reset_skill|HERO-HEROBLAZON|service_route/r1FailClosed|etf → etf|pb_res_to_client||
|88957|req_hero_blazon_bond_up|HERO-HEROBLAZON|service_route/heroCommandServices[9]|etf → etf|pb_hero_blazon_bond_up_rsp||
|88961|req_three_admonition_draw|DRAW-THREEADMONITION|service_route/drawActivity|etf → etf|pb_three_admonition_draw_ret||
|88962|req_three_admonition_rev_box_award|DRAW-THREEADMONITION|service_route/drawActivity|etf → etf|pb_three_admonition_draw_ret||
|88963|req_new_hero_exclusive_choose_hero|HERO-NEWHEROEXCLUSIVE|service_route/r1FailClosed|etf → etf|pb_shop_info||
|88964|req_new_hero_exclusive_rev_story_award|HERO-NEWHEROEXCLUSIVE|service_route/r1FailClosed|etf → etf|pb_res_to_client||
|88965|req_three_admonition_add_draw_count|DRAW-THREEADMONITION|service_route/drawActivity|etf → etf|pb_res_to_client||
|88966|req_three_admonition_enter_act|DRAW-THREEADMONITION|service_route/drawActivity|etf → etf|—|response_schema_missing|
|88967|req_rev_new_hero_exclusive_lineup_award|HERO-NEWHEROEXCLUSIVE|service_route/r1FailClosed|etf → etf|pb_res_to_client||
|89001|req_fantasy_handbook_star|EQUIP-FANTASYHANDBOOK|service_route/endgameDevelopServices[7]|protobuf → unverified/pb_fantasy_equip_id|pb_fantasy_handbook_equip|request_encoding_unverified|
|89101|req_scarlet_task_award|BATTLE-SCARLETTRIAL|service_route/scarletTrial|etf → conditional|pb_scarlet_trial_award_back|request_encoding_unverified|
|89102|req_scarlet_select_stone|BATTLE-SCARLETTRIAL|service_route/scarletTrial|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|89301|req_guild_explore_pick_up_box|SOC-GUILDEXPLORE|service_route/guildActivity|etf → conditional|pb_res_to_client|request_encoding_unverified|
|89302|req_guild_explore_pick_up_person_box|SOC-GUILDEXPLORE|service_route/guildActivity|etf → conditional|pb_res_to_client|request_encoding_unverified|
|89303|req_guild_explore_portal|SOC-GUILDEXPLORE|service_route/guildActivity|protobuf → protobuf/pb_guild_explore_portal_req|pb_res_to_client||
|89304|req_guild_explore_move|SOC-GUILDEXPLORE|service_route/guildActivity|protobuf → protobuf/pb_guild_explore_move_req|pb_res_to_client||
|89305|req_guild_explore_task|SOC-GUILDEXPLORE|service_route/guildActivity|etf → conditional|pb_guild_explore_task_back|request_encoding_unverified|
|89306|req_guild_wish|SOC-GUILDEXPLORE|service_route/guildActivity|etf → conditional|pb_guild_explore_wish_back|request_encoding_unverified|
|89307|req_guild_explore_play_game|SOC-GUILDEXPLORE|service_route/guildActivity|protobuf → protobuf/pb_guild_explore_play_game_req|pb_guild_explore_play_game_back||
|89308|req_guild_explore_finish_game|SOC-GUILDEXPLORE|service_route/guildActivity|protobuf → protobuf/pb_guild_explore_finish_game_req|pb_guild_explore_finish_game_back||
|89309|req_guild_explore_get_game_award|SOC-GUILDEXPLORE|service_route/guildActivity|protobuf → protobuf/pb_guild_explore_get_game_award_req|pb_guild_explore_get_game_award_back||
|89310|req_guild_explore_camp|SOC-GUILDEXPLORE|service_route/guildActivity|etf → conditional|pb_res_to_client|request_encoding_unverified|
|89311|req_guild_explore_receive_build_level|SOC-GUILDEXPLORE|service_route/guildActivity|protobuf → protobuf/pb_guild_explore_build_award_req|pb_guild_explore_build_award_back||
|89312|req_guild_explore_atk_boss|SOC-GUILDEXPLORE|service_route/guildActivity|etf → conditional|pb_guild_explore_atk_boss_back|request_encoding_unverified|
|89313|req_guild_explore_handbook_active|SOC-GUILDEXPLORE|service_route/guildActivity|etf → conditional|pb_res_to_client|request_encoding_unverified|
|89314|req_guild_explore_handbook_level_award|SOC-GUILDEXPLORE|service_route/guildActivity|etf → conditional|pb_res_to_client|request_encoding_unverified|
|89315|req_guild_explore_camp_stat|SOC-GUILDEXPLORE|service_route/guildActivity|etf → conditional|pb_guild_explore_camp_stat|request_encoding_unverified|
|89316|req_guild_explore_buy_goods|SOC-GUILDEXPLORE|service_route/guildActivity|etf → conditional|pb_guild_explore_shop_back|request_encoding_unverified|
|89317|req_guild_explore_unlock_portal|SOC-GUILDEXPLORE|service_route/guildActivity|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|89318|req_guild_explore_guide_task|SOC-GUILDEXPLORE|service_route/guildActivity|etf → conditional|pb_guild_explore_task_back|request_encoding_unverified|
|89319|req_guild_explore_pre_box|SOC-GUILDEXPLORE|service_route/guildActivity|etf → conditional|pb_res_to_client|request_encoding_unverified|
|89320|req_guild_explore_pre_finish|SOC-GUILDEXPLORE|service_route/guildActivity|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|89321|req_guild_explore_join_wolf|SOC-GUILDEXPLORE|service_route/guildActivity|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|89322|req_guild_explore_rev_wolf|SOC-GUILDEXPLORE|service_route/guildActivity|etf → conditional|pb_res_to_client|request_encoding_unverified|
|89323|req_guild_explore_person_task|SOC-GUILDEXPLORE|service_route/guildActivity|etf → conditional|pb_res_to_client|request_encoding_unverified|
|89324|req_guild_explore_boss_box|SOC-GUILDEXPLORE|service_route/guildActivity|etf → conditional|pb_res_to_client|request_encoding_unverified|
|89326|req_guild_explore_boss_unlock|SOC-GUILDEXPLORE|service_route/guildActivity|etf → conditional|pb_guild_explore_guild|request_encoding_unverified|
|89327|req_guild_explore_boss_enter|SOC-GUILDEXPLORE|service_route/guildActivity|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|89328|req_guild_explore_boss_sweep|SOC-GUILDEXPLORE|service_route/guildActivity|etf → conditional|pb_res_to_client|request_encoding_unverified|
|89351|req_guild_explore_trial_receive|SOC-GUILDEXPLORETRIAL|service_route/guildActivity|etf → conditional|pb_guild_explore_trial_receive_back|request_encoding_unverified|
|89352|req_guild_explore_trial_member|SOC-GUILDEXPLORETRIAL|service_route/guildActivity|etf → conditional|pb_guild_explore_trial_member_back|request_encoding_unverified|
|89401|req_hundred_bonus_random|DRAW-HUNDREDBONUS|service_route/drawActivity|etf → etf|—|response_schema_missing|
|89402|req_hundred_bonus_award|DRAW-HUNDREDBONUS|service_route/drawActivity|etf → etf|pb_res_to_client||
|89403|req_hundred_bonus_log|DRAW-HUNDREDBONUS|service_route/drawActivity|etf → etf|pb_hundred_bonus_log_back||
|89501|req_cms_data_info|ROLE-CMS|service_route/cms|etf → etf|—|response_schema_missing|
|89601|req_star_mission_award|BATTLE-STARMISSION|service_route/starMission|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|89602|req_star_mission_chapter_award|BATTLE-STARMISSION|service_route/starMission|protobuf → conditional/pb_star_mission_chapter_award_req|pb_star_mission_chapter_award_rsp|request_encoding_unverified|
|89603|req_star_mission_skill|BATTLE-STARMISSION|service_route/starMission|protobuf → conditional/pb_star_mission_skill_req|pb_res_to_client|request_encoding_unverified|
|89604|req_star_mission_skill_reset|BATTLE-STARMISSION|service_route/starMission|protobuf → conditional/pb_star_mission_skill_reset_req|pb_res_to_client|request_encoding_unverified|
|89701|req_relic_break_up|EQUIP-RELIC|service_route/relic|etf → conditional|pb_res_op_relic|request_encoding_unverified|
|89702|req_relic_recast|EQUIP-RELIC|service_route/relic|protobuf → conditional/pb_req_recast_relic|pb_res_op_relic|request_encoding_unverified|
|89704|req_relic_save_recast|EQUIP-RELIC|service_route/relic|protobuf → conditional/pb_req_recast_relic|pb_res_op_relic|request_encoding_unverified|
|89705|req_relic_resolve|EQUIP-RELIC|service_route/relic|protobuf → conditional/pb_req_resolve_relic|pb_res_to_client|request_encoding_unverified|
|89706|req_relic_cancel_recast|EQUIP-RELIC|service_route/relic|protobuf → conditional/pb_req_recast_relic|pb_res_op_relic|request_encoding_unverified|
|89707|req_relic_reset|EQUIP-RELIC|service_route/relic|etf → conditional|pb_rsp_reset_relic|request_encoding_unverified|
|89708|req_relic_stage|EQUIP-RELIC|service_route/relic|protobuf → conditional/pb_req_stage_relic|pb_res_op_relic|request_encoding_unverified|
|89709|req_relic_wear|EQUIP-RELIC|service_route/relic|protobuf → conditional/pb_relic_wear_req|pb_relic_wear_rsp|request_encoding_unverified|
|89710|req_relic_up_sp|EQUIP-RELIC|service_route/relic|etf → conditional|pb_relic_sp_up_rsp|request_encoding_unverified|
|89711|req_relic_variation|EQUIP-RELIC|service_route/relic|etf → conditional|pb_variation_back|request_encoding_unverified|
|89712|req_relic_refine|EQUIP-RELIC|service_route/relic|etf → conditional|pb_relic_refine_back|request_encoding_unverified|
|89801|req_hero_legend_book_handle_star|HERO-HEROLEGEND|service_route/heroCommandServices[12]|etf → etf|pb_hero_legend_book_active||
|89802|req_hero_legend_book_handle_bless|HERO-HEROLEGEND|service_route/heroCommandServices[12]|etf → etf|pb_hero_legend_book_active||
|89803|req_hero_legend_book_handle_level|HERO-HEROLEGEND|service_route/heroCommandServices[12]|etf → etf|pb_hero_legend_book_active_back||
|89804|req_hero_legend_book_handle_stage|HERO-HEROLEGEND|service_route/heroCommandServices[12]|etf → etf|pb_hero_legend_book_active||
|89901|req_magical_journey_sword|PLAY-MAGICALJOURNEY|service_route/explorationAct|protobuf → unverified/pb_magical_journey_sword_req|pb_magical_journey_sword_rsp|request_encoding_unverified|
|89902|req_magical_journey_country_main_up|PLAY-MAGICALJOURNEY|service_route/explorationAct|etf → unverified|pb_magical_journey_main_up_rsp|request_encoding_unverified|
|89903|req_magical_journey_country_sub_active|PLAY-MAGICALJOURNEY|service_route/explorationAct|protobuf → unverified/pb_magical_journey_country_sub_active_req|pb_magical_journey_country_sub_active_rsp|request_encoding_unverified|
|89904|req_magical_journey_country_sub_up|PLAY-MAGICALJOURNEY|service_route/explorationAct|etf → unverified|pb_magical_journey_sub_up_rsp|request_encoding_unverified|
|89905|req_magical_journey_sword_record|PLAY-MAGICALJOURNEY|service_route/explorationAct|etf → unverified|pb_magical_journey_sword_record_info|request_encoding_unverified|
|89906|req_magical_journey_activate_normal_collect|PLAY-MAGICALJOURNEY|service_route/explorationAct|protobuf → unverified/pb_magical_journey_collect_activate_req|pb_magical_journey_collect_activate_normal_rsp|request_encoding_unverified|
|89907|req_magical_journey_activate_season_collect|PLAY-MAGICALJOURNEY|service_route/explorationAct|protobuf → unverified/pb_magical_journey_collect_activate_req|pb_res_to_client|request_encoding_unverified|
|89908|req_magical_journey_mission_star_award|PLAY-MAGICALJOURNEY|service_route/explorationAct|etf → unverified|pb_res_to_client|request_encoding_unverified|
|89909|req_magical_journey_mission_task_award|PLAY-MAGICALJOURNEY|service_route/explorationAct|etf → unverified|pb_magical_journey_task_rev_back|request_encoding_unverified|
|89910|req_magical_journey_mission_multi_fight|PLAY-MAGICALJOURNEY|service_route/explorationAct|protobuf → unverified/pb_magical_journey_mission_fight_req|pb_magical_journey_mission_multi_fight_back|request_encoding_unverified|
|89911|req_magical_journey_boss_multi_fight|PLAY-MAGICALJOURNEY|service_route/explorationAct|protobuf → unverified/pb_magical_journey_boss_fight_req|pb_magical_journey_boss_fight_back|request_encoding_unverified|
|89912|req_magical_journey_chapter_progress_award|PLAY-MAGICALJOURNEY|service_route/explorationAct|etf → unverified|pb_magical_journey_progress_rev_back|request_encoding_unverified|
|89913|req_magical_journey_node_rank_award|PLAY-MAGICALJOURNEY|service_route/explorationAct|etf → unverified|pb_res_to_client|request_encoding_unverified|
|89914|req_magical_journey_mission_pass_info|PLAY-MAGICALJOURNEY|service_route/explorationAct|etf → unverified|pb_magical_journey_mission_pass|request_encoding_unverified|
|89915|req_magical_journey_star_skill_active|PLAY-MAGICALJOURNEY|service_route/explorationAct|etf → unverified|pb_magical_journey_star_activate_rsp|request_encoding_unverified|
|89916|req_magical_journey_power|PLAY-MAGICALJOURNEY|service_route/explorationAct|etf → unverified|—|response_schema_missing, request_encoding_unverified|
|89917|req_magical_journey_login_after|PLAY-MAGICALJOURNEY|service_route/explorationAct|etf → unverified|pb_magical_journey_login_after_back|request_encoding_unverified|
|90001|req_guild_war_guess|SOC-GUILDWAR|service_route/guildActivity|protobuf → protobuf/pb_guild_war_guess_req|pb_guild_war_guess||
|90002|req_guild_war_guess_receive|SOC-GUILDWAR|service_route/guildActivity|etf → conditional|pb_res_to_client|request_encoding_unverified|
|90005|req_guild_war_set_gather_loc|SOC-GUILDWAR|service_route/guildActivity|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|90006|req_guild_war_set_gather_role|SOC-GUILDWAR|service_route/guildActivity|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|90007|req_guild_war_fight|SOC-GUILDWAR|service_route/guildActivity|protobuf → protobuf/pb_guild_war_fight_req|pb_realtime_challenge_fight_ret||
|90008|req_guild_war_fight_offline|SOC-GUILDWAR|service_route/guildActivity|protobuf → protobuf/pb_guild_war_fight_req|—|response_schema_missing|
|90009|req_guild_war_update_entry|SOC-GUILDWAR|service_route/guildActivity|etf → conditional|pb_guild_war_entry|request_encoding_unverified|
|90010|req_guild_war_guess_data|SOC-GUILDWAR|service_route/guildActivity|etf → conditional|pb_guild_war_guess|request_encoding_unverified|
|90011|req_guild_war_receive_rank|SOC-GUILDWAR|service_route/guildActivity|etf → conditional|pb_res_to_client|request_encoding_unverified|
|90012|req_guild_war_person|SOC-GUILDWAR|service_route/guildActivity|etf → conditional|pb_guild_war_person|request_encoding_unverified|
|90013|req_guild_war_fight_monster|SOC-GUILDWAR|service_route/guildActivity|protobuf → protobuf/pb_guild_war_fight_req|—|response_schema_missing|
|90014|req_guild_war_host|SOC-GUILDWAR|service_route/guildActivity|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|90015|req_guild_war_host_cancel|SOC-GUILDWAR|service_route/guildActivity|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|90016|req_guild_war_share|SOC-GUILDWAR|service_route/guildActivity|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|90201|req_norse_rune_draw|EQUIP-NORSERUNE|service_route/norseRune|etf → conditional|pb_norse_rune_draw_back|request_encoding_unverified|
|90202|req_norse_rune_replace|EQUIP-NORSERUNE|service_route/norseRune|etf → conditional|pb_norse_rune_token|request_encoding_unverified|
|90203|req_norse_rune_wish_level_up|EQUIP-NORSERUNE|service_route/norseRune|etf → conditional|pb_norse_rune_wish_level_up_back|request_encoding_unverified|
|90204|req_norse_rune_rune_level_up|EQUIP-NORSERUNE|service_route/norseRune|etf → conditional|pb_norse_rune_type|request_encoding_unverified|
|90301|req_login_reward_act_award|ACT-LOGINREWARDACT|service_route/actReward|etf → etf|pb_login_reward_act_rev_back||
|90401|req_magic_circle_star_up|EQUIP-MAGICCIRCLE|service_route/magicCircle|etf → conditional|pb_magic_circle_rsp|request_encoding_unverified|
|90402|req_magic_circle_level_up|EQUIP-MAGICCIRCLE|service_route/magicCircle|protobuf → conditional/pb_magic_circle_level_up_req|pb_magic_circle_rsp|request_encoding_unverified|
|90403|req_magic_circle_break_up|EQUIP-MAGICCIRCLE|service_route/magicCircle|etf → conditional|pb_magic_circle_rsp|request_encoding_unverified|
|90404|req_magic_circle_active_point|EQUIP-MAGICCIRCLE|service_route/magicCircle|protobuf → conditional/pb_magic_circle_active_point_req|pb_magic_circle_rsp|request_encoding_unverified|
|90405|req_magic_circle_reset|EQUIP-MAGICCIRCLE|service_route/magicCircle|etf → conditional|pb_magic_circle_rsp|request_encoding_unverified|
|90501|req_pet_act_select_pet|PLAY-PETACTIVITY|service_route/explorationAct|protobuf → unverified/pb_req_pet_act_select_pet|—|response_schema_missing, request_encoding_unverified|
|90502|req_pet_act_claim_fight_rewards|PLAY-PETACTIVITY|service_route/explorationAct|protobuf → unverified/pb_req_pet_act_daily_reward|pb_res_to_client|request_encoding_unverified|
|90503|req_pet_act_claim_likability_rewards|PLAY-PETACTIVITY|service_route/explorationAct|protobuf → unverified/pb_req_pet_act_claim_likability_rewards|pb_res_to_client|request_encoding_unverified|
|90504|req_pet_act_cure|PLAY-PETACTIVITY|service_route/explorationAct|protobuf → unverified/pb_req_pet_act_cure|pb_res_pet_act_cure|request_encoding_unverified|
|90505|req_pet_act_finish_cure|PLAY-PETACTIVITY|service_route/explorationAct|protobuf → unverified/pb_req_pet_act_cure|pb_res_pet_act_cure|request_encoding_unverified|
|90506|req_pet_rev_daily_vitality_rewards|PLAY-PETACTIVITY|service_route/explorationAct|etf → unverified|pb_rev_pet_vitality_award_ret|request_encoding_unverified|
|90507|req_pet_act_exchange|PLAY-PETACTIVITY|service_route/explorationAct|etf → unverified|pb_pet_exchange_ret|request_encoding_unverified|
|90601|req_common_map_init|BATTLE-COMMONMAP|service_route/commonMap|etf → conditional|pb_common_map_init_back|request_encoding_unverified|
|90602|req_common_map_node_trigger|BATTLE-COMMONMAP|service_route/commonMap|protobuf → conditional/pb_common_map_node_trigger|pb_common_map_node_trigger_back|request_encoding_unverified|
|90603|req_common_map_sweep|BATTLE-COMMONMAP|service_route/commonMap|protobuf → conditional/pb_common_map_sweep_trigger|pb_common_map_sweep_trigger_back|request_encoding_unverified|
|90701|req_guild_duel_match_data|SOC-GUILDDUEL|service_route/guildActivity|etf → conditional|pb_guild_duel_match_data_back|request_encoding_unverified|
|90702|req_guild_duel_receive_round|SOC-GUILDDUEL|service_route/guildActivity|etf → conditional|pb_res_to_client|request_encoding_unverified|
|90703|req_guild_duel_receive_level|SOC-GUILDDUEL|service_route/guildActivity|etf → conditional|pb_res_to_client|request_encoding_unverified|
|90704|req_guild_duel_fast_fight|SOC-GUILDDUEL|service_route/guildActivity|etf → conditional|pb_res_to_client|request_encoding_unverified|
|90705|req_guild_duel_read_report|SOC-GUILDDUEL|service_route/guildActivity|etf → conditional|pb_guild_duel_report_back|request_encoding_unverified|
|90706|req_guild_duel_read_record|SOC-GUILDDUEL|service_route/guildActivity|etf → conditional|pb_guild_duel_guild_record|request_encoding_unverified|
|90707|req_guild_duel_match_zone|SOC-GUILDDUEL|service_route/guildActivity|etf → conditional|pb_guild_duel_zone_back_list|request_encoding_unverified|
|90731|req_pet_combine|EQUIP-PET|service_route/endgameDevelopServices[3]|etf → unverified|pb_rsp_pet_develop|request_encoding_unverified|
|90732|req_pet_raise_star|EQUIP-PET|service_route/endgameDevelopServices[3]|etf → unverified|pb_rsp_pet_develop|request_encoding_unverified|
|90733|req_pet_lineup|EQUIP-PET|service_route/endgameDevelopServices[3]|etf → unverified|—|response_schema_missing, request_encoding_unverified|
|90734|req_pet_upgrade|EQUIP-PET|service_route/endgameDevelopServices[3]|protobuf → unverified/pb_req_pet_up_lv|pb_rsp_pet_develop|request_encoding_unverified|
|90736|req_equip_combine|EQUIP-PET|service_route/endgameDevelopServices[3]|protobuf → unverified/pb_req_combine_equip|pb_rsp_pet_equip|request_encoding_unverified|
|90737|req_equip_convert|EQUIP-PET|service_route/endgameDevelopServices[3]|protobuf → unverified/pb_req_combine_equip|pb_rsp_pet_equip|request_encoding_unverified|
|90738|req_rune_upgrade|EQUIP-PET|service_route/endgameDevelopServices[3]|etf → unverified|pb_res_to_client|request_encoding_unverified|
|90739|req_rune_convert|EQUIP-PET|service_route/endgameDevelopServices[3]|protobuf → unverified/pb_req_pet_rune_convert|pb_res_to_client|request_encoding_unverified|
|90740|req_book_upgrade|EQUIP-PET|service_route/endgameDevelopServices[3]|etf → unverified|pb_pet_book_rsp|request_encoding_unverified|
|90741|req_pet_up_quality|EQUIP-PET|service_route/endgameDevelopServices[3]|etf → unverified|pb_pet_up_quality_back|request_encoding_unverified|
|90742|req_pet_equip_up|EQUIP-PET|service_route/endgameDevelopServices[3]|protobuf → unverified/pb_pet_equip_star_up|pb_pet_equip_star_up_back|request_encoding_unverified|
|90743|req_pet_open_ability|EQUIP-PET|service_route/endgameDevelopServices[3]|etf → unverified|pb_rsp_pet_develop|request_encoding_unverified|
|90744|req_pet_lineup_help|EQUIP-PET|service_route/endgameDevelopServices[3]|protobuf → unverified/pb_pet_help_slot_list|—|response_schema_missing, request_encoding_unverified|
|90745|req_pet_break|EQUIP-PET|service_route/endgameDevelopServices[3]|etf → unverified|pb_rsp_pet_develop|request_encoding_unverified|
|90746|pb_req_pet_slot_wear_equip_insert|EQUIP-PET|service_route/endgameDevelopServices[3]|protobuf → unverified/pb_req_pet_slot_wear_equip_insert|pb_rsp_pet_wear_equip|request_encoding_unverified|
|90747|req_pet_mutant|EQUIP-PET|service_route/endgameDevelopServices[3]|etf → unverified|pb_rsp_pet_develop|request_encoding_unverified|
|90748|req_pet_up_promote_lv|EQUIP-PET|service_route/endgameDevelopServices[3]|protobuf → unverified/pb_pet_up_promote_lv_req|pb_rsp_pet_develop|request_encoding_unverified|
|90801|req_radish_farm_start|PLAY-RADISHFARM|service_route/explorationAct|protobuf → unverified/pb_radish_farm_normal_req|pb_radish_farm_normal_rsp|request_encoding_unverified|
|90802|req_radish_farm_event|PLAY-RADISHFARM|service_route/explorationAct|protobuf → unverified/pb_radish_farm_normal_req|pb_radish_farm_normal_rsp|request_encoding_unverified|
|90803|req_radish_farm_cell_award|PLAY-RADISHFARM|service_route/explorationAct|protobuf → unverified/pb_radish_farm_normal_req|pb_radish_farm_reward_rsp|request_encoding_unverified|
|90804|req_radish_farm_visit|PLAY-RADISHFARM|service_route/explorationAct|etf → unverified|pb_radish_farm_visit_rsp|request_encoding_unverified|
|90805|req_radish_farm_help|PLAY-RADISHFARM|service_route/explorationAct|protobuf → unverified/pb_radish_farm_help_req|pb_radish_farm_help_rsp|request_encoding_unverified|
|90806|req_radish_farm_select_gift|PLAY-RADISHFARM|service_route/explorationAct|protobuf → unverified/pb_radish_farm_gift_select_req|pb_radish_farm_gift|request_encoding_unverified|
|90901|req_pet_play_period_award|EQUIP-PETPLAY|service_route/endgameDevelopServices[7]|etf → unverified|pb_res_to_client|request_encoding_unverified|
|90902|req_pet_play_over_explore|EQUIP-PETPLAY|service_route/endgameDevelopServices[7]|etf → unverified|pb_pet_play|request_encoding_unverified|
|91001|req_energy_burst_award|EQUIP-ENERGYBURST|service_route/endgameDevelopServices[7]|etf → unverified|pb_res_to_client|request_encoding_unverified|
|91101|req_fame_hall_enter_difficult|BATTLE-FAMEHALL|service_route/fameHall|protobuf → conditional/pb_fame_hall_enter_difficult|pb_fame_hall_enter_difficult_rsp|request_encoding_unverified|
|91102|req_fame_hall_choose_drop|BATTLE-FAMEHALL|service_route/fameHall|protobuf → conditional/pb_fame_hall_choose_drop_req|pb_fame_hall_choose_drop_rsp|request_encoding_unverified|
|91103|req_fame_hall_stage_award|BATTLE-FAMEHALL|service_route/fameHall|protobuf → conditional/pb_fame_hall_reward_req|pb_fame_hall_reward_rsp|request_encoding_unverified|
|91104|req_fame_hall_edit_artifact|BATTLE-FAMEHALL|service_route/fameHall|protobuf → conditional/pb_fame_hall_artifact_req|pb_fame_hall_line_artifact|request_encoding_unverified|
|91105|req_fame_hall_reset|BATTLE-FAMEHALL|service_route/fameHall|etf → conditional|pb_fame_hall_reset_rsp|request_encoding_unverified|
|91106|req_fame_hall_skip_choose|BATTLE-FAMEHALL|service_route/fameHall|etf → conditional|pb_fame_hall_role|request_encoding_unverified|
|91107|req_fame_hall_terminate|BATTLE-FAMEHALL|service_route/fameHall|etf → conditional|pb_fame_hall_role|request_encoding_unverified|
|91108|req_fame_hall_sweep|BATTLE-FAMEHALL|service_route/fameHall|etf → conditional|pb_fame_hall_sweep_rsp|request_encoding_unverified|
|91109|req_fame_hall_data|BATTLE-FAMEHALL|service_route/fameHall|etf → conditional|pb_fame_hall_role|request_encoding_unverified|
|91110|req_fame_hall_client_show_tag|BATTLE-FAMEHALL|service_route/fameHall|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|91111|req_fame_hall_reissue_stage_award|BATTLE-FAMEHALL|service_route/fameHall|etf → conditional|pb_fame_hall_reissue_rsp|request_encoding_unverified|
|91201|req_attend|SOC-GUILDRACING|service_route/guildActivity|etf → conditional|pb_guild_racing_attend_back|request_encoding_unverified|
|91202|req_support|SOC-GUILDRACING|service_route/guildActivity|etf → conditional|pb_guild_racing_support|request_encoding_unverified|
|91203|req_use_buff|SOC-GUILDRACING|service_route/guildActivity|protobuf → protobuf/pb_guild_racing_buff_use_req|pb_res_to_client||
|91204|req_vote_buff|SOC-GUILDRACING|service_route/guildActivity|etf → conditional|pb_guild_racing_r|request_encoding_unverified|
|91205|req_role_list|SOC-GUILDRACING|service_route/guildActivity|etf → conditional|pb_guild_racing_role_info_list|request_encoding_unverified|
|91206|req_guild_racing_rev_award|SOC-GUILDRACING|service_route/guildActivity|etf → conditional|pb_guild_racing_rev_award_back|request_encoding_unverified|
|91207|req_guild_racing_score_info|SOC-GUILDRACING|service_route/guildActivity|etf → conditional|pb_guild_racing_score|request_encoding_unverified|
|91208|req_guild_racing_rev_buff|SOC-GUILDRACING|service_route/guildActivity|etf → conditional|pb_guild_racing_rev_buff_back|request_encoding_unverified|
|91209|req_guild_racing_rev_score_award|SOC-GUILDRACING|service_route/guildActivity|etf → conditional|pb_guild_racing_rev_award_back|request_encoding_unverified|
|91301|req_guild_boss_enter_map|SOC-GUILDBOSS|service_route/guildCoopServices[0]|etf → unverified|pb_guild_boss_guild|request_encoding_unverified|
|91302|req_guild_boss_leave_map|SOC-GUILDBOSS|service_route/guildCoopServices[0]|etf → unverified|—|response_schema_missing, request_encoding_unverified|
|91303|req_guild_boss_use_skill|SOC-GUILDBOSS|service_route/guildCoopServices[0]|protobuf → unverified/pb_guild_boss_use_skill_req|pb_guild_boss_use_skill_back|request_encoding_unverified|
|91304|req_claim_boss_dmg_award|SOC-GUILDBOSS|service_route/guildCoopServices[0]|protobuf → unverified/pb_req_claim_boss_dmg_award|pb_res_to_client|request_encoding_unverified|
|91305|req_batch_claim_boss_award|SOC-GUILDBOSS|service_route/guildCoopServices[0]|protobuf → unverified/pb_req_batch_claim_boss_award|pb_res_to_client|request_encoding_unverified|
|91306|req_claim_boss_use_skill_award|SOC-GUILDBOSS|service_route/guildCoopServices[0]|etf → unverified|pb_res_to_client|request_encoding_unverified|
|91307|req_claim_daily_free_skill_item|SOC-GUILDBOSS|service_route/guildCoopServices[0]|etf → unverified|pb_res_to_client|request_encoding_unverified|
|91308|req_claim_guild_boss_box|SOC-GUILDBOSS|service_route/guildCoopServices[0]|etf → unverified|pb_res_to_client|request_encoding_unverified|
|91309|req_join_guild_boss|SOC-GUILDBOSS|service_route/guildCoopServices[0]|etf → unverified|pb_res_join_guild_boss|request_encoding_unverified|
|91310|req_claim_guild_boss_online_award|SOC-GUILDBOSS|service_route/guildCoopServices[0]|etf → unverified|pb_res_to_client|request_encoding_unverified|
|91311|req_buy_guild_boss_item|SOC-GUILDBOSS|service_route/guildCoopServices[0]|etf → unverified|pb_res_to_client|request_encoding_unverified|
|91312|req_guild_boss_guild_info|SOC-GUILDBOSS|service_route/guildCoopServices[0]|etf → unverified|—|response_schema_missing, request_encoding_unverified|
|91401|req_team_genre_award|HERO-TEAMGENRE|service_route/teamGenre|protobuf → conditional/pb_team_genre_award_req|pb_res_to_client|request_encoding_unverified|
|91402|req_team_genre_quick_award|HERO-TEAMGENRE|service_route/teamGenre|etf → conditional|pb_team_genre_award_rsp|request_encoding_unverified|
|91403|req_team_genre_get_info|HERO-TEAMGENRE|service_route/teamGenre|etf → conditional|pb_team_genre_role|request_encoding_unverified|
|91501|req_mystery_shop_auto_refresh|ITEM-MYSTERYSHOP|service_route/r1FailClosed|etf → etf|pb_mystery_shop||
|91502|req_mystery_shop_manual_refresh|ITEM-MYSTERYSHOP|service_route/r1FailClosed|etf → etf|pb_mystery_shop_manual_refresh_back||
|91503|req_mystery_shop_buy|ITEM-MYSTERYSHOP|service_route/itemCommandServices[5]|etf → etf|pb_res_to_client||
|91601|req_guild_joint_pick_box|SOC-GUILDJOINT|service_route/guildCoopServices[1]|etf → unverified|pb_res_to_client|request_encoding_unverified|
|91602|req_guild_joint_pick_monster|SOC-GUILDJOINT|service_route/guildCoopServices[1]|etf → unverified|pb_guild_joint_atk_monster|request_encoding_unverified|
|91603|req_guild_joint_pick_door|SOC-GUILDJOINT|service_route/guildCoopServices[1]|etf → unverified|—|response_schema_missing, request_encoding_unverified|
|91604|req_guild_joint_pick_lode|SOC-GUILDJOINT|service_route/guildCoopServices[1]|etf → unverified|pb_guild_joint_pick_lode_rsp|request_encoding_unverified|
|91605|req_guild_joint_task|SOC-GUILDJOINT|service_route/guildCoopServices[1]|etf → unverified|pb_guild_joint_rev_task_rsp|request_encoding_unverified|
|91606|req_guild_joint_rev_lode|SOC-GUILDJOINT|service_route/guildCoopServices[1]|etf → unverified|pb_guild_joint_rev_lode_rsp|request_encoding_unverified|
|91607|req_get_role_rank|SOC-GUILDJOINT|service_route/guildCoopServices[1]|etf → unverified|pb_guild_role_rank_show_list|request_encoding_unverified|
|91608|req_guild_joint_set_pioneer|SOC-GUILDJOINT|service_route/guildCoopServices[1]|protobuf → unverified/pb_guild_j_set_pioneer_req|pb_guild_j_pioneer_rsp|request_encoding_unverified|
|91609|req_guild_joint_cancel_door|SOC-GUILDJOINT|service_route/guildCoopServices[1]|etf → unverified|—|response_schema_missing, request_encoding_unverified|
|91610|req_guild_joint_set_focus|SOC-GUILDJOINT|service_route/guildCoopServices[1]|etf → unverified|—|response_schema_missing, request_encoding_unverified|
|91611|req_guild_joint_fight_report|SOC-GUILDJOINT|service_route/guildCoopServices[1]|etf → unverified|pb_guild_j_report_rsp|request_encoding_unverified|
|91612|req_guild_joint_get_info|SOC-GUILDJOINT|service_route/guildCoopServices[1]|etf → unverified|pb_guild_joint_enter_map_back|request_encoding_unverified|
|91613|req_guild_joint_single_monster|SOC-GUILDJOINT|service_route/guildCoopServices[1]|etf → unverified|pb_guild_joint_role_map|request_encoding_unverified|
|91614|req_guild_joint_single_box|SOC-GUILDJOINT|service_route/guildCoopServices[1]|etf → unverified|pb_res_to_client|request_encoding_unverified|
|91615|req_guild_joint_single_door|SOC-GUILDJOINT|service_route/guildCoopServices[1]|etf → unverified|pb_guild_joint_role_map|request_encoding_unverified|
|91616|req_guild_joint_calc_door|SOC-GUILDJOINT|service_route/guildCoopServices[1]|etf → unverified|—|response_schema_missing, request_encoding_unverified|
|91617|req_guild_joint_settle_rank|SOC-GUILDJOINT|service_route/guildCoopServices[1]|etf → unverified|—|response_schema_missing, request_encoding_unverified|
|91618|req_guild_joint_enter_single|SOC-GUILDJOINT|service_route/guildCoopServices[1]|etf → unverified|pb_guild_joint_enter_map_back|request_encoding_unverified|
|91619|req_guild_joint_single_settle|SOC-GUILDJOINT|service_route/guildCoopServices[1]|etf → unverified|pb_guild_joint_role_map|request_encoding_unverified|
|91620|req_guild_joint_single_cancel|SOC-GUILDJOINT|service_route/guildCoopServices[1]|etf → unverified|pb_guild_joint_role_map|request_encoding_unverified|
|91621|req_guild_joint_share|SOC-GUILDJOINT|service_route/guildCoopServices[1]|etf → unverified|—|response_schema_missing, request_encoding_unverified|
|91622|req_guild_joint_cancel_monster|SOC-GUILDJOINT|service_route/guildCoopServices[1]|etf → unverified|—|response_schema_missing, request_encoding_unverified|
|91623|req_guild_joint_calc_monster|SOC-GUILDJOINT|service_route/guildCoopServices[1]|etf → unverified|—|response_schema_missing, request_encoding_unverified|
|91624|req_guild_joint_set_auto|SOC-GUILDJOINT|service_route/guildCoopServices[1]|etf → unverified|pb_guild_joint_guild|request_encoding_unverified|
|91625|req_guild_joint_one_get|SOC-GUILDJOINT|service_route/guildCoopServices[1]|protobuf → unverified/pb_guild_joint_rev_one_get_req|pb_guild_joint_rev_task_rsp|request_encoding_unverified|
|91701|req_wish_tree_draw|DRAW-WISHTREE|service_route/wishTree|etf → conditional|pb_wish_tree_draw_back|request_encoding_unverified|
|91702|req_wish_tree_choose_theme|DRAW-WISHTREE|service_route/wishTree|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|91703|req_wish_tree_rev_treasure|DRAW-WISHTREE|service_route/wishTree|etf → conditional|pb_wish_tree_rev_treasure_back|request_encoding_unverified|
|91704|req_wish_tree_select|DRAW-WISHTREE|service_route/wishTree|protobuf → conditional/pb_wish_tree_select_req|pb_wish_tree_select_back|request_encoding_unverified|
|91801|req_world_boss_enter_map|BATTLE-WORLDBOSS|service_route/worldBoss|etf → conditional|pb_world_boss_server|request_encoding_unverified|
|91802|req_world_boss_leave_map|BATTLE-WORLDBOSS|service_route/worldBoss|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|91803|req_world_boss_receive|BATTLE-WORLDBOSS|service_route/worldBoss|etf → conditional|pb_world_boss_receive_kill_back|request_encoding_unverified|
|91804|req_world_boss_history_rank|BATTLE-WORLDBOSS|service_route/worldBoss|etf → conditional|pb_world_boss_history_rank|request_encoding_unverified|
|91805|req_world_boss_receive_achievement|BATTLE-WORLDBOSS|service_route/worldBoss|protobuf → conditional/pb_world_boss_achieve_reward_req|pb_res_to_client|request_encoding_unverified|
|91901|req_chess_draw|DRAW-CHESS|service_route/drawActivity|protobuf → etf/pb_chess_draw_req|pb_chess_draw_rsp|request_encoding_mismatch|
|91902|req_chess_task|DRAW-CHESS|service_route/drawActivity|etf → etf|pb_chess_task_award_rsp||
|91903|req_chess_choose_award|DRAW-CHESS|service_route/drawActivity|etf → etf|—|response_schema_missing|
|91904|req_chess_new_turn|DRAW-CHESS|service_route/drawActivity|protobuf → etf/pb_chess_new_turn_req|pb_chess|request_encoding_mismatch|
|91905|req_chess_exchange|DRAW-CHESS|service_route/drawActivity|protobuf → etf/pb_chess_exchange_req|pb_chess_exchange_rsp|request_encoding_mismatch|
|91906|req_chess_turn_award|DRAW-CHESS|service_route/drawActivity|protobuf → etf/pb_chess_turn_award_req|pb_chess_turn_award_rsp|request_encoding_mismatch|
|92001|req_hundred_acc|PAY-HUNDREDACC|service_route/hundredAcc|etf → etf|pb_res_to_client||
|92101|req_raffle_ticket_achievement|DRAW-RAFFLETICKET|service_route/drawActivity|etf → etf|pb_raffle_ticket_phase_award_back||
|92201|req_hero_blazon_draw|DRAW-HEROBLAZONDRAW|service_route/drawActivity|protobuf → etf/pb_hero_blazon_draw_req|pb_hero_blazon_draw_rsp|request_encoding_mismatch|
|92301|req_lottery_act_draw|DRAW-LOTTERYACT|service_route/drawActivity|etf → etf|pb_lottery_act_draw_back||
|92302|req_lottery_act_award_log|DRAW-LOTTERYACT|service_route/drawActivity|etf → etf|pb_lottery_act_server||
|92401|req_prebook_task_award|PAY-PREBOOK|service_route/benefitCommerce|etf → conditional|pb_prebook_back|request_encoding_unverified|
|92402|req_prebook_share_award|PAY-PREBOOK|service_route/benefitCommerce|etf → conditional|pb_prebook_back|request_encoding_unverified|
|92501|req_role_share_award|PAY-ROLESHARE|service_route/benefitCommerce|etf → conditional|pb_res_to_client|request_encoding_unverified|
|92601|req_cross_receive_ads_award|PAY-CROSS|service_route/benefitCommerce|etf → conditional|pb_res_to_client|request_encoding_unverified|
|92602|req_cross_receive_fun_free_award|PAY-CROSS|service_route/benefitCommerce|etf → conditional|pb_res_to_client|request_encoding_unverified|
|92603|req_cross_receive_fun_pay_award|PAY-CROSS|service_route/benefitCommerce|etf → conditional|pb_res_to_client|request_encoding_unverified|
|92701|req_guild_rune_stone_take_on|SOC-GUILDRUNESTONE|service_route/guildCoopServices[2]|protobuf → unverified/pb_guild_rune_stone_take_on_req|pb_res_to_client|request_encoding_unverified|
|92702|req_guild_rune_stone_take_off|SOC-GUILDRUNESTONE|service_route/guildCoopServices[2]|protobuf → unverified/pb_guild_rune_stone_take_off_req|pb_res_to_client|request_encoding_unverified|
|92703|req_guild_rune_stone_compose|SOC-GUILDRUNESTONE|service_route/guildCoopServices[2]|protobuf → unverified/pb_guild_rune_stone_compose_req|pb_res_to_client|request_encoding_unverified|
|92801|req_pit_lord_rank_award|BATTLE-PITLORD|service_route/pitLord|etf → conditional|pb_pit_lord_rank_award_rsp|request_encoding_unverified|
|92802|req_pit_lord_history_rank_list|BATTLE-PITLORD|service_route/pitLord|etf → conditional|pb_pit_lord_history_rank_list|request_encoding_unverified|
|92803|req_pit_lord_reissue_rank_award|BATTLE-PITLORD|service_route/pitLord|etf → conditional|pb_pit_lord_rank_award_rsp|request_encoding_unverified|
|92804|req_pit_lord_free_award|BATTLE-PITLORD|service_route/pitLord|etf → conditional|pb_res_to_client|request_encoding_unverified|
|92901|req_red_rain_random|PAY-REDRAIN|service_route/benefitCommerce|etf → conditional|pb_red_rain|request_encoding_unverified|
|92902|req_red_rain_rev|PAY-REDRAIN|service_route/benefitCommerce|protobuf → protobuf/pb_red_rain_rev_award_req|pb_red_rain_back||
|92903|req_red_rain_active|PAY-REDRAIN|service_route/benefitCommerce|etf → conditional|pb_red_rain|request_encoding_unverified|
|93001|req_mystery_wish_exchange|DRAW-MYSTERYWISH|service_route/drawActivity|etf → etf|pb_res_to_client||
|93101|req_lottery|DRAW-LOTTERY|service_route/drawActivity|protobuf → etf/simple_use|pb_res_to_client|request_encoding_mismatch|
|93102|req_lottery_expire|DRAW-LOTTERY|service_route/drawActivity|etf → etf|pb_res_to_client||
|93201|req_steady_award|PAY-DIAMONDFUND|service_route/benefitCommerce|etf → conditional|pb_diamond_award_rsp|request_encoding_unverified|
|93202|req_fortune_award|PAY-DIAMONDFUND|service_route/benefitCommerce|etf → conditional|pb_diamond_award_rsp|request_encoding_unverified|
|93301|req_treasure_star|EQUIP-TREASURE|service_route/endgameDevelopServices[4]|etf → unverified|pb_treasure_star_ret|request_encoding_unverified|
|93302|req_treasure_draw_award|EQUIP-TREASURE|service_route/endgameDevelopServices[4]|etf → unverified|pb_treasure_draw_phase_award_back|request_encoding_unverified|
|93303|req_treasure_suit_up|EQUIP-TREASURE|service_route/endgameDevelopServices[4]|etf → unverified|pb_treasure_suit|request_encoding_unverified|
|93304|req_treasure_attr_update|EQUIP-TREASURE|service_route/endgameDevelopServices[4]|etf → unverified|—|response_schema_missing, request_encoding_unverified|
|93305|req_treasure_custom_draw|EQUIP-TREASURE|service_route/endgameDevelopServices[4]|protobuf → unverified/pb_treasure_custom_draw|pb_treasure_custom_draw|request_encoding_unverified|
|93306|req_treasure_box|EQUIP-TREASURE|service_route/endgameDevelopServices[4]|protobuf → unverified/pb_treasure_box_req|pb_treasure_box_rsp|request_encoding_unverified|
|93401|req_week_hunt_common_task|PAY-WEEKHUNT|service_route/benefitCommerce|protobuf → protobuf/pb_week_common_task_req|pb_week_common_task_rsp||
|93402|req_week_hunt_common_progress|PAY-WEEKHUNT|service_route/benefitCommerce|protobuf → protobuf/pb_week_common_progress_req|pb_week_common_progress_rsp||
|93403|req_week_hunt_upgrade_gift|PAY-WEEKHUNT|service_route/benefitCommerce|protobuf → protobuf/pb_week_upgrade_gift_req|pb_week_upgrade_gift_rsp||
|93501|req_linear_level_box_award|ITEM-LINEARLEVEL|service_route/itemCommandServices[0]|protobuf → protobuf/pb_linear_level_box_award_req|pb_linear_level_box_award_rsp||
|93601|req_camp_tower_cross_award|BATTLE-CAMPTOWER|service_route/campTower|protobuf → conditional/pb_camp_tower_cross_award_req|pb_camp_tower_cross_award_rsp|request_encoding_unverified|
|93602|req_camp_tower_first_award|BATTLE-CAMPTOWER|service_route/campTower|protobuf → conditional/pb_camp_tower_first_award_req|pb_camp_tower_first_award_rsp|request_encoding_unverified|
|93603|req_camp_tower_get_first_pass_list|BATTLE-CAMPTOWER|service_route/campTower|etf → conditional|pb_camp_tower_get_first_pass_list_rsp|request_encoding_unverified|
|93701|req_elves_up_star|EQUIP-ELVES|service_route/endgameDevelopServices[5]|protobuf → unverified/pb_elves_up_star_req|pb_elves_develop_rsp|request_encoding_unverified|
|93702|req_elves_up_talent|EQUIP-ELVES|service_route/endgameDevelopServices[5]|protobuf → unverified/pb_elves_up_talent_req|pb_elves_develop_rsp|request_encoding_unverified|
|93703|req_elves_up_book|EQUIP-ELVES|service_route/endgameDevelopServices[5]|protobuf → unverified/pb_elves_up_book_req|pb_elves_develop_rsp|request_encoding_unverified|
|93704|req_elves_lineup_help|EQUIP-ELVES|service_route/endgameDevelopServices[5]|protobuf → unverified/pb_elves_lineup_help_req|—|response_schema_missing, request_encoding_unverified|
|93705|req_elves_wear_skin|EQUIP-ELVES|service_route/endgameDevelopServices[5]|protobuf → unverified/pb_elves_wear_skin_req|—|response_schema_missing, request_encoding_unverified|
|93706|req_elves_mutant|EQUIP-ELVES|service_route/endgameDevelopServices[5]|etf → unverified|pb_elves_mutant_back|request_encoding_unverified|
|93707|req_elves_up_break_lv|EQUIP-ELVES|service_route/endgameDevelopServices[5]|protobuf → unverified/pb_elves_up_break_lv_req|pb_elves_develop_rsp|request_encoding_unverified|
|93751|req_bead_up_level|EQUIP-ELVESBEAD|service_route/endgameDevelopServices[6]|protobuf → unverified/pb_bead_level_up_req|pb_bead_develop_rsp|request_encoding_unverified|
|93752|req_bead_up_star|EQUIP-ELVESBEAD|service_route/endgameDevelopServices[6]|protobuf → unverified/pb_bead_up_star_req|pb_elves_bead_back|request_encoding_unverified|
|93753|req_bead_wear|EQUIP-ELVESBEAD|service_route/endgameDevelopServices[6]|protobuf → unverified/pb_bead_equip_req|pb_bead_equip_rsp|request_encoding_unverified|
|93754|req_bead_un_wear|EQUIP-ELVESBEAD|service_route/endgameDevelopServices[6]|protobuf → unverified/pb_bead_un_equip_req|pb_bead_un_equip_rsp|request_encoding_unverified|
|93755|req_bead_resolve|EQUIP-ELVESBEAD|service_route/endgameDevelopServices[6]|etf → unverified|pb_res_to_client|request_encoding_unverified|
|93801|req_experience_go|PLAY-EXPERIENCEACT|service_route/explorationAct|protobuf → unverified/pb_experience_go_req|pb_experience_go_rsp|request_encoding_unverified|
|93802|req_experience_award|PLAY-EXPERIENCEACT|service_route/explorationAct|protobuf → unverified/pb_experience_award_req|pb_experience_award_rsp|request_encoding_unverified|
|97001|req_guild_gvg_pick_box|SOC-GUILDGVG|service_route/guildCoopServices[3]|etf → unverified|pb_res_to_client|request_encoding_unverified|
|97002|req_guild_gvg_pick_lode|SOC-GUILDGVG|service_route/guildCoopServices[3]|protobuf → unverified/pb_guild_gvg_req|—|response_schema_missing, request_encoding_unverified|
|97003|req_guild_gvg_attack_lode|SOC-GUILDGVG|service_route/guildCoopServices[3]|protobuf → unverified/pb_guild_gvg_req|—|response_schema_missing, request_encoding_unverified|
|97004|req_guild_gvg_rev_lode|SOC-GUILDGVG|service_route/guildCoopServices[3]|etf → unverified|—|response_schema_missing, request_encoding_unverified|
|97005|req_guild_gvg_pick_monster|SOC-GUILDGVG|service_route/guildCoopServices[3]|protobuf → unverified/pb_guild_gvg_req|—|response_schema_missing, request_encoding_unverified|
|97006|req_guild_gvg_rev_monster|SOC-GUILDGVG|service_route/guildCoopServices[3]|etf → unverified|—|response_schema_missing, request_encoding_unverified|
|97007|req_guild_gvg_pick_block|SOC-GUILDGVG|service_route/guildCoopServices[3]|protobuf → unverified/pb_guild_gvg_req|—|response_schema_missing, request_encoding_unverified|
|97008|req_guild_gvg_pick_hold|SOC-GUILDGVG|service_route/guildCoopServices[3]|protobuf → unverified/pb_guild_gvg_req|—|response_schema_missing, request_encoding_unverified|
|97009|req_guild_gvg_pvp|SOC-GUILDGVG|service_route/guildCoopServices[3]|etf → unverified|—|response_schema_missing, request_encoding_unverified|
|97010|req_guild_gvg_defense_hold|SOC-GUILDGVG|service_route/guildCoopServices[3]|protobuf → unverified/pb_guild_gvg_req|—|response_schema_missing, request_encoding_unverified|
|97011|req_guild_gvg_focus|SOC-GUILDGVG|service_route/guildCoopServices[3]|etf → unverified|—|response_schema_missing, request_encoding_unverified|
|97012|req_guild_gvg_task|SOC-GUILDGVG|service_route/guildCoopServices[3]|etf → unverified|—|response_schema_missing, request_encoding_unverified|
|97013|req_guild_gvg_unlock_portal|SOC-GUILDGVG|service_route/guildCoopServices[3]|etf → unverified|—|response_schema_missing, request_encoding_unverified|
|97014|req_guild_gvg_portal|SOC-GUILDGVG|service_route/guildCoopServices[3]|protobuf → unverified/pb_guild_gvg_portal_req|—|response_schema_missing, request_encoding_unverified|
|97015|req_guild_gvg_cancel_block|SOC-GUILDGVG|service_route/guildCoopServices[3]|protobuf → unverified/pb_guild_gvg_req|—|response_schema_missing, request_encoding_unverified|
|97016|req_guild_gvg_leave_hold|SOC-GUILDGVG|service_route/guildCoopServices[3]|protobuf → unverified/pb_guild_gvg_req|—|response_schema_missing, request_encoding_unverified|
|97017|req_guild_gvg_cancel_monster|SOC-GUILDGVG|service_route/guildCoopServices[3]|protobuf → unverified/pb_guild_gvg_req|—|response_schema_missing, request_encoding_unverified|
|97018|req_guild_gvg_leave_hold_fight|SOC-GUILDGVG|service_route/guildCoopServices[3]|protobuf → unverified/pb_guild_gvg_req|—|response_schema_missing, request_encoding_unverified|
|97101|req_wish_treasure_rev|PAY-WISHTREASURE|service_route/wishTreasure|etf → conditional|pb_wish_treasure_rev_back|request_encoding_unverified|
|97201|req_flip_card_turn|DRAW-FLIPCARD|service_route/drawActivity|protobuf → etf/pb_flip_card_turn_req|pb_flip_card_date|request_encoding_mismatch|
|97301|req_flip_card|DRAW-FLIPCARD|service_route/drawActivity|protobuf → etf/pb_flip_card_req|pb_flip_card_rsp|request_encoding_mismatch|
|97401|req_link_gift_custom_choose|PAY-LINKGIFT|service_route/benefitCommerce|etf → conditional|pb_link_gift_custom_item|request_encoding_unverified|
|97501|req_ticket_draw_rev_award|DRAW-TICKETDRAW|service_route/drawActivity|etf → etf|pb_ticket_rev_award_back||
|97502|req_ticket_draw_query_history|DRAW-TICKETDRAW|service_route/drawActivity|etf → etf|pb_ticket_draw_info||
|97601|req_tower_defense_garrison|BATTLE-TOWERDEFENSE|service_route/towerDefense|protobuf → conditional/pb_tower_defense_garrison_req|pb_tower_defense|request_encoding_unverified|
|97602|req_tower_defense_turn_over|BATTLE-TOWERDEFENSE|service_route/towerDefense|etf → conditional|pb_tower_defense|request_encoding_unverified|
|97603|req_tower_defense_award|BATTLE-TOWERDEFENSE|service_route/towerDefense|etf → conditional|pb_tower_defense_award_rsp|request_encoding_unverified|
|97604|req_tower_defense_turns_award|BATTLE-TOWERDEFENSE|service_route/towerDefense|etf → conditional|pb_tower_defense_award_rsp|request_encoding_unverified|
|97605|req_tower_defense_look_award|BATTLE-TOWERDEFENSE|service_route/towerDefense|etf → conditional|pb_tower_defense_look_rsp|request_encoding_unverified|
|97901|req_fruit_draw_big|DRAW-FRUITDRAWACT|service_route/drawActivity|etf → etf|pb_fruit_draw_big_award_back||
|97902|req_fruit_draw|DRAW-FRUITDRAWACT|service_route/drawActivity|etf → etf|pb_fruit_draw_back||
|98001|req_vip_link_show|PAY-VIPLINK|service_route/benefitCommerce|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|98101|req_draw_choose_wish|DRAW-DRAW|service_route/drawActivity|protobuf → etf/pb_role_random_draw_item|pb_role_random_draw_info|request_encoding_mismatch|
|98201|rep_set_channel_push_open|ROLE-CHANNELPUSH|service_route/roleService|protobuf → conditional/pb_channel_push_open|—|response_schema_missing, request_encoding_unverified|
|98301|req_demigod_get_day_marbles_award|DRAW-DEMIGODACT|service_route/demigodAct|etf → conditional|pb_res_to_client|request_encoding_unverified|
|98302|req_get_big_marbles_award|DRAW-DEMIGODACT|service_route/demigodAct|etf → conditional|pb_res_to_client|request_encoding_unverified|
|98303|req_demigod_act_trial_award|DRAW-DEMIGODACT|service_route/demigodAct|protobuf → conditional/pb_demigod_act_receive_trial_req|pb_res_to_client|request_encoding_unverified|
|98304|req_demigod_act_trial_wear|DRAW-DEMIGODACT|service_route/demigodAct|protobuf → conditional/pb_demigod_act_wear_equip_req|pb_demigod_act_wear_back|request_encoding_unverified|
|98305|req_demigod_act_trial_bless|DRAW-DEMIGODACT|service_route/demigodAct|protobuf → conditional/pb_demigod_act_wear_bless_req|pb_demigod_act_wear_bless_back|request_encoding_unverified|
|98306|req_demigod_act_trial_copy|DRAW-DEMIGODACT|service_route/demigodAct|etf → conditional|pb_demigod_act_trial|request_encoding_unverified|
|98307|req_demigod_act_draw_award|DRAW-DEMIGODACT|service_route/demigodAct|etf → conditional|pb_demigod_act_draw_award_back|request_encoding_unverified|
|98308|req_demigod_act_choose_wish|DRAW-DEMIGODACT|service_route/demigodAct|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|98401|req_leader_equip|EQUIP-LEADEREQUIP|service_route/leaderEquip|protobuf → conditional/pb_leader_equip_wear_req|pb_leader_equip_wear_back|request_encoding_unverified|
|98402|req_leader_equip_up_level|EQUIP-LEADEREQUIP|service_route/endgameDevelopServices[0]|etf → unverified|pb_leader_equip_up_level_back|request_encoding_unverified|
|98403|req_leader_equip_up_star|EQUIP-LEADEREQUIP|service_route/endgameDevelopServices[0]|protobuf → unverified/pb_leader_equip_up_star_req|pb_leader_equip_back|request_encoding_unverified|
|98404|req_leader_equip_dissolve|EQUIP-LEADEREQUIP|service_route/endgameDevelopServices[0]|etf → unverified|pb_res_to_client|request_encoding_unverified|
|98405|req_leader_equip_intensify|EQUIP-LEADEREQUIP|service_route/endgameDevelopServices[0]|etf → unverified|pb_leader_equip_intensify_back|request_encoding_unverified|
|98406|req_leader_equip_recast|EQUIP-LEADEREQUIP|service_route/endgameDevelopServices[0]|etf → unverified|pb_leader_equip_recast_back|response_schema_missing, request_encoding_unverified|
|98407|req_leader_equip_save_dismiss|EQUIP-LEADEREQUIP|service_route/endgameDevelopServices[0]|etf → unverified|—|response_schema_missing, request_encoding_unverified|
|98500|req_top_arena_pre_favorite|BATTLE-TOPARENA|service_route/topArena|etf → conditional|pb_top_arena_favorite_rsp|request_encoding_unverified|
|98505|req_top_arena_get_rank_reward|BATTLE-TOPARENA|service_route/topArena|etf → conditional|pb_res_to_client|request_encoding_unverified|
|98526|req_top_arena_semi_server_help|BATTLE-TOPARENA|service_route/topArena|protobuf → conditional/pb_top_arena_server_help_req|pb_top_arena_server_help_rsp|request_encoding_unverified|
|98527|req_top_arena_semi_get_server_help_reward|BATTLE-TOPARENA|service_route/topArena|protobuf → conditional/pb_top_arena_server_help_reward_req|pb_top_arena_server_help_rsp|request_encoding_unverified|
|98532|req_top_arena_semi_get_server_help_res|BATTLE-TOPARENA|service_route/topArena|etf → conditional|pb_res_to_client|request_encoding_unverified|
|98560|req_top_arena_final_attack|BATTLE-TOPARENA|service_route/topArena|protobuf → conditional/pb_top_arena_attack_req|pb_top_arena_attack_rsp|request_encoding_unverified|
|98561|req_top_arena_final_guess|BATTLE-TOPARENA|service_route/topArena|protobuf → conditional/pb_top_arena_guess_req|pb_top_arena_guess|request_encoding_unverified|
|98562|req_top_arena_final_battle_record|BATTLE-TOPARENA|service_route/topArena|protobuf → conditional/pb_get_fight_report|pb_fight_report_res|request_encoding_unverified|
|98563|req_top_arena_final_get_rank_reward|BATTLE-TOPARENA|service_route/topArena|etf → conditional|pb_res_to_client|request_encoding_unverified|
|98564|req_top_arena_final_get_server_rank|BATTLE-TOPARENA|service_route/topArena|etf → conditional|pb_top_arena_get_server_rank_rsp|request_encoding_unverified|
|98565|req_top_arena_final_join|BATTLE-TOPARENA|service_route/topArena|etf → conditional|pb_top_arena_semi_data|request_encoding_unverified|
|98580|req_top_arena_get_history|BATTLE-TOPARENA|service_route/topArena|protobuf → conditional/pb_top_arena_winner_history_req|pb_top_arena_winner_history_rsp|request_encoding_unverified|
|98581|req_top_arena_set_declaration|BATTLE-TOPARENA|service_route/topArena|etf → conditional|pb_top_arena_history_win_info|request_encoding_unverified|
|98582|req_top_arena_vote|BATTLE-TOPARENA|service_route/topArena|etf → conditional|pb_res_to_client|request_encoding_unverified|
|98583|req_top_arena_get_server_help|BATTLE-TOPARENA|service_route/topArena|etf → conditional|pb_top_arena_server_help_info_rsp|request_encoding_unverified|
|98590|req_top_arena_enter|BATTLE-TOPARENA|service_route/topArena|etf → conditional|pb_top_arena_enter_rsp|request_encoding_unverified|
|98601|req_top_arena_publicity_server_award|BATTLE-TOPARENA|service_route/topArena|etf → conditional|pb_res_to_client|request_encoding_unverified|
|98602|req_top_arena_server_max_rank_award|BATTLE-TOPARENA|service_route/topArena|etf → conditional|pb_res_to_client|request_encoding_unverified|
|98610|req_christmas_act_dress|ACT-CHRISTMASACT|service_route/actReward|protobuf → etf/pb_christmas_act_dress_req|pb_res_to_client|request_encoding_mismatch|
|98611|req_christmas_act_get_dress_award|ACT-CHRISTMASACT|service_route/actReward|etf → etf|pb_res_to_client||
|98612|req_christmas_act_select_wish|ACT-CHRISTMASACT|service_route/actReward|etf → etf|—|response_schema_missing|
|98613|req_christmas_shop_award|ACT-CHRISTMASACT|service_route/actReward|etf → etf|pb_res_to_client||
|98620|req_acc_recharge_act_get_award|PAY-ACCRECHARGEACT|service_route/accRecharge|protobuf → unverified/pb_acc_recharge_award_req|pb_res_to_client|request_encoding_unverified|
|98630|req_gem_rebate_put|PAY-GEMREBATEACT|service_route/benefitCommerce|protobuf → protobuf/pb_gem_rebate_req|pb_gem_rebate_back||
|98702|req_guild_vote_vote|SOC-GUILDVOTE|service_route/guildCoopServices[4]|protobuf → unverified/pb_guild_vote_req|pb_guild_vote_info|request_encoding_unverified|
|98800|req_appearance_release_act_interact|PAY-APPEARANCERELEASEACT|service_route/benefitCommerce|protobuf → protobuf/pb_appearance_release_act_interact_req|pb_res_to_client||
|98900|req_play_match_start|BATTLE-PLAYMATCH|service_route/playMatch|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|98901|req_play_match_cancel|BATTLE-PLAYMATCH|service_route/playMatch|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|99000|req_cake_activity_daily_award|PAY-CAKEACTIVITY|service_route/benefitCommerce|etf → conditional|pb_res_to_client|request_encoding_unverified|
|99001|req_cake_activity_rechage_award|PAY-CAKEACTIVITY|service_route/benefitCommerce|etf → conditional|pb_res_to_client|request_encoding_unverified|
|99002|req_cake_activity_select_plate|PAY-CAKEACTIVITY|service_route/benefitCommerce|protobuf → protobuf/pb_cake_activity_select_plate_req|—|response_schema_missing|
|99100|req_slg_map_add_block_view|SOC-SLGMAP|service_route/guildCoopServices[5]|protobuf → unverified/pb_slg_map_view_req|—|response_schema_missing, request_encoding_unverified|
|99101|req_slg_map_enter|SOC-SLGMAP|service_route/guildCoopServices[5]|etf → unverified|—|response_schema_missing, request_encoding_unverified|
|99102|req_slg_map_leave|SOC-SLGMAP|service_route/guildCoopServices[5]|etf → unverified|—|response_schema_missing, request_encoding_unverified|
|99200|req_guild_nation_go_attack|SOC-GUILDNATION|service_route/guildCoopServices[6]|protobuf → unverified/pb_guild_nation_go_attack_req|pb_guild_nation_go_attack_back|request_encoding_unverified|
|99201|req_guild_nation_role_build|SOC-GUILDNATION|service_route/guildCoopServices[6]|protobuf → unverified/pb_guild_nation_up_level_req|pb_guild_nation_build_change_back|request_encoding_unverified|
|99202|req_guild_nation_spawn_soldier|SOC-GUILDNATION|service_route/guildCoopServices[6]|protobuf → unverified/pb_guild_nation_spawn_soldier_req|pb_guild_nation_up_soldier_back|request_encoding_unverified|
|99203|req_guild_nation_soldier_up|SOC-GUILDNATION|service_route/guildCoopServices[6]|protobuf → unverified/pb_guild_nation_up_soldier_req|pb_guild_nation_up_soldier_back|request_encoding_unverified|
|99204|req_guild_nation_queue_unlock|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|pb_guild_nation_build_queue_change_back|request_encoding_unverified|
|99205|req_guild_nation_build_cancel|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|pb_guild_nation_build_change_back|request_encoding_unverified|
|99206|req_guild_nation_gem_acc|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|pb_guild_nation_build_change_back|request_encoding_unverified|
|99207|req_guild_nation_item_acc|SOC-GUILDNATION|service_route/guildCoopServices[6]|protobuf → unverified/pb_guild_nation_build_item_acc_req|pb_guild_nation_build_change_back|request_encoding_unverified|
|99208|req_guild_nation_read_report|SOC-GUILDNATION|service_route/guildCoopServices[6]|protobuf → unverified/pb_guild_nation_read_report_req|pb_guild_nation_report_back|request_encoding_unverified|
|99209|req_guild_nation_delete_report|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|—|response_schema_missing, request_encoding_unverified|
|99210|req_guild_nation_recv_report|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|pb_res_to_client|request_encoding_unverified|
|99211|req_guild_nation_report_list|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|pb_guild_nation_report_list|request_encoding_unverified|
|99212|req_guild_nation_technology_study|SOC-GUILDNATION|service_route/guildCoopServices[6]|protobuf → unverified/pb_guild_nation_study_req|pb_guild_nation_study_change_back|request_encoding_unverified|
|99213|req_guild_nation_cancel_study|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|pb_guild_nation_study_change_back|request_encoding_unverified|
|99214|req_guild_nation_study_gem_acc|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|pb_guild_nation_study_change_back|request_encoding_unverified|
|99215|req_guild_nation_study_item_acc|SOC-GUILDNATION|service_route/guildCoopServices[6]|protobuf → unverified/pb_guild_nation_study_speed_req|pb_guild_nation_study_change_back|request_encoding_unverified|
|99216|req_guild_nation_finish_study|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|pb_guild_nation_finish_study_back|request_encoding_unverified|
|99217|req_guild_nation_update_red_dot|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|—|response_schema_missing, request_encoding_unverified|
|99218|req_guild_nation_team_recall|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|—|response_schema_missing, request_encoding_unverified|
|99219|req_guild_nation_soldier_cancel|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|pb_guild_nation_up_soldier_back|request_encoding_unverified|
|99220|req_guild_nation_defense_use_protect|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|pb_guild_nation_use_protect_back|request_encoding_unverified|
|99221|req_guild_nation_defense_extinguish|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|pb_guild_nation_extinguish_back|request_encoding_unverified|
|99222|req_guild_nation_defense_repair_city|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|pb_guild_nation_repair_city_back|request_encoding_unverified|
|99223|req_guild_nation_build_free_acc|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|pb_guild_nation_build_list|request_encoding_unverified|
|99224|req_guild_nation_assign_soldier|SOC-GUILDNATION|service_route/guildCoopServices[6]|protobuf → unverified/pb_guild_nation_soldier_line_up_req|pb_guild_nation_soldier_line_up_back|request_encoding_unverified|
|99225|req_guild_nation_soldier_gem_acc|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|pb_guild_nation_up_soldier_back|request_encoding_unverified|
|99226|req_guild_nation_soldier_item_acc|SOC-GUILDNATION|service_route/guildCoopServices[6]|protobuf → unverified/pb_guild_nation_build_item_acc_req|pb_guild_nation_up_soldier_back|request_encoding_unverified|
|99227|req_guild_nation_donate_guild_tech|SOC-GUILDNATION|service_route/guildCoopServices[6]|protobuf → unverified/pb_guild_nation_team_tech_donation_req|pb_guild_nation_team_tech_donation_back|request_encoding_unverified|
|99228|req_guild_nation_power|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|pb_guild_nation_power_info_rsp|request_encoding_unverified|
|99229|req_guild_nation_get_assist_list|SOC-GUILDNATION|service_route/guildNationAssist|etf → etf|pb_guild_nation_assist_list_back||
|99230|req_guild_nation_send_assist|SOC-GUILDNATION|service_route/guildCoopServices[6]|protobuf → unverified/pb_guild_nation_assist_rsp|—|response_schema_missing, request_encoding_unverified|
|99231|req_guild_nation_assist|SOC-GUILDNATION|service_route/guildCoopServices[6]|protobuf → unverified/pb_guild_nation_assist_list|pb_guild_nation_assist_list_back|request_encoding_unverified|
|99232|req_guild_nation_soldier_item_raise_num|SOC-GUILDNATION|service_route/guildCoopServices[6]|protobuf → unverified/pb_res_obj|pb_guild_nation_soldier_item_raise_num_back|request_encoding_unverified|
|99233|req_guild_nation_recommend_guild_tech|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|pb_guild_nation_team_tech_recommend_back|request_encoding_unverified|
|99234|req_guild_nation_move_guild_base|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|pb_guild_nation_guild|request_encoding_unverified|
|99235|req_guild_nation_move_role_base|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|pb_res_to_client|request_encoding_unverified|
|99236|req_guild_nation_defense_defense_return|SOC-GUILDNATION|service_route/guildCoopServices[6]|protobuf → unverified/pb_guild_nation_help_defense_return_req|—|response_schema_missing, request_encoding_unverified|
|99237|req_guild_nation_repair_city_acc_item|SOC-GUILDNATION|service_route/guildCoopServices[6]|protobuf → unverified/pb_guild_nation_repair_city_acc_item_req|pb_guild_nation_repair_city_back|request_encoding_unverified|
|99238|req_guild_nation_repair_city_acc_gem|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|pb_guild_nation_repair_city_back|request_encoding_unverified|
|99239|req_guild_nation_repair_cancel|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|pb_guild_nation_repair_city_back|request_encoding_unverified|
|99240|req_guild_nation_finish_task|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|pb_guild_nation_task_finish_back|request_encoding_unverified|
|99241|req_guild_nation_finish_phase_task|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|pb_guild_nation_task_finish_back|request_encoding_unverified|
|99242|req_guild_nation_other_role_info|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|pb_guild_nation_role|request_encoding_unverified|
|99243|req_guild_nation_march_acc|SOC-GUILDNATION|service_route/guildCoopServices[6]|protobuf → unverified/pb_guild_nation_march_acc_req|pb_guild_nation_march_acc_back|request_encoding_unverified|
|99244|req_guild_nation_repair_map_core|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|pb_guild_nation_repair_map_back|request_encoding_unverified|
|99245|req_guild_nation_map_obj_search|SOC-GUILDNATION|service_route/guildCoopServices[6]|protobuf → unverified/pb_guild_nation_search_req|pb_guild_nation_search_back|request_encoding_unverified|
|99246|req_guild_nation_call_muster|SOC-GUILDNATION|service_route/guildCoopServices[6]|protobuf → unverified/pb_guild_nation_call_muster_req|pb_guild_nation_call_muster_back|request_encoding_unverified|
|99247|req_guild_nation_answer_muster|SOC-GUILDNATION|service_route/guildCoopServices[6]|protobuf → unverified/pb_guild_nation_answer_muster_req|pb_guild_nation_answer_muster_back|request_encoding_unverified|
|99248|req_guild_nation_set_flag|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|pb_guild_nation_guild_res_to_client|request_encoding_unverified|
|99249|req_guild_nation_move_flag|SOC-GUILDNATION|service_route/guildCoopServices[6]|protobuf → unverified/pb_guild_nation_move_flag_req|pb_guild_nation_guild_res_to_client|request_encoding_unverified|
|99250|req_guild_nation_stronghold_award|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|pb_res_to_client|request_encoding_unverified|
|99251|req_guild_nation_stronghold_honor_award|SOC-GUILDNATION|service_route/guildCoopServices[6]|protobuf → unverified/pb_guild_nation_stronghold_honor_req|pb_res_to_client|request_encoding_unverified|
|99252|req_guild_nation_stronghold_capture_award|SOC-GUILDNATION|service_route/guildCoopServices[6]|protobuf → unverified/pb_guild_nation_stronghold_capture_record|pb_guild_nation_stronghold_capture_record|request_encoding_unverified|
|99253|req_guild_nation_muster_info_list|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|pb_guild_nation_muster_info_list_back|request_encoding_unverified|
|99254|req_guild_nation_stronghold_sign|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|pb_guild_nation_stronghold_sign_ret|request_encoding_unverified|
|99255|req_guild_nation_cancle_muster|SOC-GUILDNATION|service_route/guildCoopServices[6]|protobuf → unverified/pb_guild_nation_cancel_muster_req|pb_guild_nation_cancel_muster_back|request_encoding_unverified|
|99256|req_guild_nation_up_lv_guild_tech|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|pb_guild_nation_guild_tech_up_back|request_encoding_unverified|
|99257|req_guild_nation_study_gem_finish|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|pb_guild_nation_finish_study_back|request_encoding_unverified|
|99258|req_guild_nation_stronghold_battle_award|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|pb_res_to_client|request_encoding_unverified|
|99259|req_guild_nation_map_obj_info|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|—|response_schema_missing, request_encoding_unverified|
|99260|req_guild_nation_free_finish_study|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|pb_guild_nation_finish_study_back|request_encoding_unverified|
|99261|req_guild_nation_guild_battle_list|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|pb_guild_nation_battle_guild|request_encoding_unverified|
|99262|req_guild_nation_hold_map_obj_info|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|pb_guild_nation_stronghold|request_encoding_unverified|
|99263|req_guild_nation_hold_sign_num_info|SOC-GUILDNATION|service_route/guildCoopServices[6]|etf → unverified|pb_guild_nation_stronghold_sign_num|request_encoding_unverified|
|99264|req_guild_nation_guild_base_return|SOC-GUILDNATION|service_route/guildCoopServices[6]|protobuf → unverified/pb_guild_nation_help_defense_return_req|—|response_schema_missing, request_encoding_unverified|
|99300|req_daily_discount_select|PAY-DAILYDISCOUNT|service_route/welfare|protobuf → protobuf/pb_daily_discount_select_req|pb_daily_discount_select_info||
|99401|req_stock_up_act_phase_award|ACT-STOCKUPACT|service_route/actReward|etf → etf|pb_res_to_client||
|99402|req_stock_up_act_cycle_award|ACT-STOCKUPACT|service_route/actReward|etf → etf|pb_stock_up_act_cycle_award_back||
|99500|req_quadruple_cross_random_award|PAY-QUADRUPLECROSS|service_route/benefitCommerce|etf → conditional|pb_res_to_client|request_encoding_unverified|
|99501|req_quadruple_cross_free_award|PAY-QUADRUPLECROSS|service_route/benefitCommerce|etf → conditional|pb_res_to_client|request_encoding_unverified|
|99502|req_quadruple_cross_pay_award|PAY-QUADRUPLECROSS|service_route/benefitCommerce|etf → conditional|pb_res_to_client|request_encoding_unverified|
|99600|req_common_act_draw_award|ACT-COMACTDRAWAWARD|service_route/actReward|protobuf → etf/pb_act_exit_req|pb_act_draw_award_back|request_encoding_mismatch|
|99601|req_spring_festival_dress|ACT-SPRINGFESTIVALACT|service_route/actReward|etf → etf|pb_res_to_client||
|99602|req_spring_festival_get_dress_award|ACT-SPRINGFESTIVALACT|service_route/actReward|etf → etf|pb_res_to_client||
|99603|req_spring_festival_shop_award|ACT-SPRINGFESTIVALACT|service_route/actReward|etf → etf|pb_res_to_client||
|99701|req_guild_vote_start|SOC-GUILDVOTE|service_route/guildCoopServices[4]|etf → unverified|pb_guild_vote_info|request_encoding_unverified|
|99801|req_festival_sign_award|ACT-FESTIVALSIGNACT|service_route/actReward|protobuf → etf/pb_festival_sign_award_req|pb_res_to_client|request_encoding_mismatch|
|99901|req_finance_manage_act_select_product|PAY-FINANCEMANAGEACT|service_route/benefitCommerce|protobuf → protobuf/pb_finance_manage_act_select_product_req|pb_res_to_client||
|99902|req_finance_manage_act_rebate|PAY-FINANCEMANAGEACT|service_route/benefitCommerce|etf → conditional|pb_res_to_client|request_encoding_unverified|
|100001|req_collect_exchange_award|ACT-COLLECTEXCHANGEACT|service_route/actReward|protobuf → etf/pb_collect_exchange_award_req|pb_collect_exchange_award_rsp|request_encoding_mismatch|
|100101|req_festival_monster_op|ACT-FESTIVALMONSTERACT|service_route/actReward|etf → etf|pb_festival_monster_op_back||
|100201|req_recharge_rebate_reset_award|PAY-RECHARGEREBATERESET|service_route/rechargeRebateReset|etf → etf|pb_recharge_rebate_reset_back||
|100301|req_hero_draw_act_task_reward|DRAW-HERODRAWACT|service_route/heroDrawActivity|etf → protobuf|pb_hero_draw_act_task_reward_back|request_encoding_mismatch|
|100302|req_hero_draw_act_set_draw_exchange|DRAW-HERODRAWACT|service_route/heroDrawActivity|etf → protobuf|—|response_schema_missing, request_encoding_mismatch|
|100401|req_skin_crystal_buy|PAY-SKINCRYSTAL|service_route/benefitCommerce|etf → conditional|pb_res_to_client|request_encoding_unverified|
|100501|req_valentine_rev_award|ACT-VALENTINEDAYACT|service_route/actReward|protobuf → etf/pb_valentine_day_rev_award_req|pb_valentine_day_rev_award_rsp|request_encoding_mismatch|
|100502|req_valentine_save_chat_progress|ACT-VALENTINEDAYACT|service_route/actReward|protobuf → etf/pb_valentine_day_save_chat_progress_req|—|response_schema_missing, request_encoding_mismatch|
|100601|req_group_buy_act_server_data|PAY-GROUPBUYACT|multi_owner/groupBuyAct|etf → etf|pb_group_buy_act_server|shadowed_owner|
|100602|req_group_buy_act_group_award|PAY-GROUPBUYACT|service_route/groupBuyAct|protobuf → etf/pb_group_buy_act_group_award_req|pb_res_to_client|request_encoding_mismatch|
|100701|req_rebate_shop_act_award|PAY-REBATESHOPACT|service_route/benefitCommerce|etf → conditional|pb_res_to_client|request_encoding_unverified|
|100901|req_main_elves_tid|DRAW-ELVESACT|service_route/drawActivity|etf → etf|—|response_schema_missing|
|100902|req_cur_fruit_draw_act|DRAW-ELVESACT|service_route/drawActivity|etf → etf|—|response_schema_missing|
|100903|req_elves_draw_award|DRAW-ELVESACT|service_route/drawActivity|protobuf → etf/pb_elves_act_draw_award_req|pb_elves_act_draw_award|request_encoding_mismatch|
|101001|req_preheat|ACT-PREHEATACT|service_route/actReward|protobuf → etf/pb_preheat_req|pb_res_to_client|request_encoding_mismatch|
|101002|req_preheat_award|ACT-PREHEATACT|service_route/actReward|protobuf → etf/pb_preheat_award_req|pb_res_to_client|request_encoding_mismatch|
|101101|req_overall_pvp_elms_buy_count|BATTLE-OVERALLPVP|service_route/overallPvp|etf → etf|pb_overall_pvp_elms_buy_count_back||
|101102|req_overall_pvp_rev_day_task_award|BATTLE-OVERALLPVP|service_route/overallPvp|etf → etf|pb_overall_pvp_rev_task_award_back||
|101103|req_overall_pvp_rev_period_task_award|BATTLE-OVERALLPVP|service_route/overallPvp|etf → etf|pb_overall_pvp_rev_task_award_back||
|101104|req_overall_pvp_elms_match|BATTLE-OVERALLPVP|service_route/overallPvp|etf → etf|pb_overall_pvp_elms_match_back||
|101105|req_overall_pvp_prelims_match|BATTLE-OVERALLPVP|service_route/overallPvp|etf → etf|pb_overall_pvp_prelims_refresh_opponent_back||
|101106|req_overall_pvp_prelims_buy_times|BATTLE-OVERALLPVP|service_route/overallPvp|etf → etf|pb_overall_pvp_buy_times_back||
|101107|req_overall_pvp_elms_sweep|BATTLE-OVERALLPVP|service_route/overallPvp|etf → etf|pb_overall_pvp_elms_buy_count_back||
|101108|req_overall_pvp_preview_reward|BATTLE-OVERALLPVP|service_route/overallPvp|etf → etf|pb_res_to_client||
|101109|req_overall_pvp_team_num_reward|BATTLE-OVERALLPVP|service_route/overallPvp|etf → etf|pb_overall_pvp_team_num_award_back||
|101110|req_overall_pvp_prelims_special_match|BATTLE-OVERALLPVP|service_route/overallPvp|etf → etf|pb_overall_pvp_prelims_special_match_back||
|101111|req_overall_pvp_report_person|BATTLE-OVERALLPVP|service_route/overallPvp|etf → etf|pb_overall_pvp_report_obj||
|101112|req_overall_pvp_report_top|BATTLE-OVERALLPVP|service_route/overallPvp|etf → etf|pb_overall_pvp_report_obj||
|101113|req_overall_pvp_elms_clear_group_dirty|BATTLE-OVERALLPVP|service_route/overallPvp|etf → etf|—|response_schema_missing|
|101114|req_overall_pvp_elms_clear_final_dirty|BATTLE-OVERALLPVP|service_route/overallPvp|etf → etf|—|response_schema_missing|
|101115|req_overall_pvp_enter_view|BATTLE-OVERALLPVP|service_route/overallPvp|etf → etf|—|response_schema_missing|
|101116|req_overall_pvp_exit_view|BATTLE-OVERALLPVP|service_route/overallPvp|etf → etf|—|response_schema_missing|
|101117|req_overall_pvp_elms_clear_fail_report|BATTLE-OVERALLPVP|service_route/overallPvp|etf → etf|—|response_schema_missing|
|101118|req_overall_pvp_scroll|BATTLE-OVERALLPVP|service_route/overallPvp|etf → etf|pb_overall_pvp_scroll_list||
|101119|req_overall_pvp_final_record|BATTLE-OVERALLPVP|service_route/overallPvp|etf → etf|pb_overall_final_record_back||
|101120|req_overall_pvp_final_watch_award|BATTLE-OVERALLPVP|service_route/overallPvp|etf → etf|pb_receive_watch_award_back||
|101121|req_overall_pvp_rev_sign_task_award|BATTLE-OVERALLPVP|service_route/overallPvp|etf → etf|pb_overall_pvp_rev_task_award_back||
|101122|req_overall_pvp_get_info|BATTLE-OVERALLPVP|service_route/overallPvp|etf → etf|pb_overall_pvp_get_info||
|101123|req_overall_pvp_try_init_lineup|BATTLE-OVERALLPVP|service_route/overallPvp|etf → etf|pb_lineup||
|101124|req_overall_pvp_show_reward|BATTLE-OVERALLPVP|service_route/overallPvp|etf → etf|pb_res_to_client||
|101125|req_overall_pvp_fight_guess|BATTLE-OVERALLPVP|service_route/overallPvp|protobuf → etf/pb_overall_pvp_fight_guess_req|pb_overall_pvp_guess_type|request_encoding_mismatch|
|101126|req_overall_pvp_rank_guess|BATTLE-OVERALLPVP|service_route/overallPvp|protobuf → etf/pb_overall_pvp_rank_guess_req|pb_overall_pvp_guess_type|request_encoding_mismatch|
|101127|req_overall_pvp_fight_guess_reward|BATTLE-OVERALLPVP|service_route/overallPvp|protobuf → etf/pb_overall_pvp_guess_req|pb_overall_pvp_guess_award_back|request_encoding_mismatch|
|101128|req_overall_pvp_rank_guess_reward|BATTLE-OVERALLPVP|service_route/overallPvp|etf → etf|pb_overall_pvp_guess_award_back||
|101129|req_overall_pvp_rank_guess_num|BATTLE-OVERALLPVP|service_route/overallPvp|etf → etf|pb_overall_pvp_rank_guess_num_list||
|101130|req_overall_pvp_history_data|BATTLE-OVERALLPVP|service_route/overallPvp|etf → etf|pb_overall_pvp_history_version_list||
|101201|req_leaser_star_up|HERO-LEASERSTARUP|service_route/heroCommandServices[5]|protobuf → protobuf/pb_leaser_star_up_req|pb_leaser_star_up_rev||
|101202|req_leaser_star_up_reset|HERO-LEASERSTARUP|service_route/heroCommandServices[5]|protobuf → protobuf/pb_leaser_star_up_reset_req|pb_leaser_star_up_reset_rev||
|101301|req_period_task_award|ITEM-PERIODTASK|service_route/r1FailClosed|etf → etf|pb_period_task_back||
|101302|req_period_stage_award|ITEM-PERIODTASK|service_route/r1FailClosed|etf → etf|pb_period_task_back||
|101303|req_period_score_award|ITEM-PERIODTASK|service_route/r1FailClosed|etf → etf|pb_period_task_back||
|101401|req_guild_bargain_info|SOC-GUILDBARGAIN|service_route/guildCoopServices[7]|etf → unverified|pb_guild_bargain_get_info_rsp|request_encoding_unverified|
|101402|req_guild_bargain|SOC-GUILDBARGAIN|service_route/guildCoopServices[7]|protobuf → unverified/pb_guild_bargain_req|pb_guild_bargain_rsp|request_encoding_unverified|
|101403|req_guild_bargain_buy|SOC-GUILDBARGAIN|service_route/guildCoopServices[7]|protobuf → unverified/pb_guild_bargain_buy_req|pb_guild_bargain_buy_rsp|request_encoding_unverified|
|101404|req_guild_not_bargain_list|SOC-GUILDBARGAIN|service_route/guildCoopServices[7]|protobuf → unverified/pb_guild_not_bargain_list_req|pb_guild_not_bargain_list_rsp|request_encoding_unverified|
|101501|req_common_sign_award|ACT-COMMONSIGN|service_route/actReward|protobuf → etf/pb_common_sign_award_req|pb_common_sign_award_rev|request_encoding_mismatch|
|101601|req_guild_expedition_server_info|SOC-GUILDEXPEDITION|service_route/guildCoopServices[8]|etf → unverified|pb_guild_expedition_info|request_encoding_unverified|
|101602|req_guild_expedition_declare|SOC-GUILDEXPEDITION|service_route/guildCoopServices[8]|etf → unverified|—|response_schema_missing, request_encoding_unverified|
|101603|req_guild_expedition_inspire|SOC-GUILDEXPEDITION|service_route/guildCoopServices[8]|etf → unverified|pb_guild_expedition_inspire_back|request_encoding_unverified|
|101604|req_guild_expedition_fight_report|SOC-GUILDEXPEDITION|service_route/guildCoopServices[8]|etf → unverified|pb_guild_expedition_req_report_back|request_encoding_unverified|
|101605|req_guild_expedition_city_rank|SOC-GUILDEXPEDITION|service_route/guildCoopServices[8]|etf → unverified|pb_guild_expedition_city_guild_rank|request_encoding_unverified|
|101606|req_guild_expedition_guild_inner_rank|SOC-GUILDEXPEDITION|service_route/guildCoopServices[8]|etf → unverified|pb_guild_expedition_city_role_rank|request_encoding_unverified|
|101607|req_guild_expedition_build_rank|SOC-GUILDEXPEDITION|service_route/guildCoopServices[8]|etf → unverified|pb_guild_expedition_build_guild_rank|request_encoding_unverified|
|101608|req_guild_expedition_guess_info|SOC-GUILDEXPEDITION|service_route/guildCoopServices[8]|etf → unverified|pb_guild_expedition_guess_info_back|request_encoding_unverified|
|101609|req_guild_expedition_guess|SOC-GUILDEXPEDITION|service_route/guildCoopServices[8]|protobuf → unverified/pb_guild_expedition_guess_req|pb_guild_expedition_guess_back|request_encoding_unverified|
|101610|req_guild_expedition_city_pos_list|SOC-GUILDEXPEDITION|service_route/guildCoopServices[8]|etf → unverified|pb_guild_expedition_pos_list|request_encoding_unverified|
|101611|req_guild_expedition_build_pos_list|SOC-GUILDEXPEDITION|service_route/guildCoopServices[8]|etf → unverified|pb_guild_expedition_pos_list|request_encoding_unverified|
|101612|req_guild_expedition_like|SOC-GUILDEXPEDITION|service_route/guildCoopServices[8]|etf → unverified|pb_res_to_client|request_encoding_unverified|
|101613|req_guild_expedition_guild_info|SOC-GUILDEXPEDITION|service_route/guildCoopServices[8]|etf → unverified|pb_guild_expedition_guild|request_encoding_unverified|
|101614|req_guild_expedition_grass|SOC-GUILDEXPEDITION|service_route/guildCoopServices[8]|protobuf → unverified/pb_guild_expedition_pos_fight_req|pb_guild_expedition_pos_fight_back|request_encoding_unverified|
|101615|req_guild_expedition_city_info_list|SOC-GUILDEXPEDITION|service_route/guildCoopServices[8]|etf → unverified|pb_guild_expedition_city_info_list|request_encoding_unverified|
|101701|req_divine_realm_act_select_gift|PAY-DIVINEREALMACT|service_route/benefitCommerce|protobuf → protobuf/pb_divine_realm_gift_select_req|pb_divine_realm_act_gift||
|101801|req_artifact_trials_claim_fight_rewards|DRAW-ARTIFACTDRAWACT|service_route/artifactDrawAct|protobuf → conditional/pb_req_artifact_trials_daily_reward_req|pb_res_to_client|request_encoding_unverified|
|101802|req_artifact_draw_task_rewards|DRAW-ARTIFACTDRAWACT|service_route/artifactDrawAct|protobuf → conditional/pb_artifact_draw_task_award_req|pb_artifact_draw_task_award_rsp|request_encoding_unverified|
|101803|req_artifact_fragments_draw|DRAW-ARTIFACTDRAWACT|service_route/artifactDrawAct|protobuf → conditional/pb_artifact_fragments_draw_req|pb_artifact_fragments_draw_rsp|request_encoding_unverified|
|101804|req_artifact_fragments_new_turn|DRAW-ARTIFACTDRAWACT|service_route/artifactDrawAct|protobuf → conditional/pb_artifact_fragments_new_turn_req|pb_fragments_draw_info|request_encoding_unverified|
|101805|req_artifact_fragments_claim|DRAW-ARTIFACTDRAWACT|service_route/artifactDrawAct|protobuf → conditional/pb_artifact_fragments_claim_req|pb_artifact_fragments_claim_rsp|request_encoding_unverified|
|101806|req_artifact_fragments_synthesis|DRAW-ARTIFACTDRAWACT|service_route/artifactDrawAct|protobuf → conditional/pb_artifact_fragments_synthesis_req|pb_artifact_fragments_synthesis_rsp|request_encoding_unverified|
|101901|req_bonus_draw|DRAW-BONUSDRAW|service_route/bonusDraw|protobuf → etf/pb_bonus_draw_req|pb_bonus_draw_back|request_encoding_mismatch|
|101902|req_bonus_draw_switch|DRAW-BONUSDRAW|service_route/bonusDraw|etf → etf|—|response_schema_missing|
|101903|req_bonus_shopping|PAY-BONUSSHOP|service_route/benefitCommerce|protobuf → protobuf/pb_bonus_shopping_req|pb_bonus_shopping_back||
|101904|req_bonus_choose_pool|DRAW-BONUSDRAW|service_route/bonusDraw|protobuf → etf/pb_bonus_draw_choose_pool|pb_bonus_draw|request_encoding_mismatch|
|102001|req_puzzle_act_finish_task|PLAY-PUZZLEACT|service_route/minigameAct|protobuf → etf/pb_puzzle_act_req|pb_puzzle_act_back|request_encoding_mismatch|
|102002|req_puzzle_act_progress_award|PLAY-PUZZLEACT|service_route/minigameAct|protobuf → etf/pb_puzzle_act_req|pb_res_to_client|request_encoding_mismatch|
|102101|req_line_first_recharge_choose|PAY-LINEFIRSTRECHARGE|service_route/lineFirstRecharge|etf → etf|—|response_schema_missing|
|102102|req_line_first_recharge_rev|PAY-LINEFIRSTRECHARGE|service_route/lineFirstRecharge|etf → etf|pb_line_first_recharge_rev_back||
|102201|req_divine_embryo_select|EQUIP-DIVINEEMBRYO|service_route/endgameDevelopServices[7]|etf → unverified|pb_divine_embryo_data|request_encoding_unverified|
|102301|req_capsule_toy_draw|DRAW-CAPSULETOY|service_route/drawActivity|etf → etf|pb_capsule_toy_draw_back||
|102302|req_capsule_toy_exchange|DRAW-CAPSULETOY|service_route/drawActivity|protobuf → etf/pb_capsule_toy_exchange_req|pb_res_to_client|request_encoding_mismatch|
|102303|req_capsule_toy_collect|DRAW-CAPSULETOY|service_route/drawActivity|etf → etf|pb_capsule_toy_collect_back||
|102304|req_capsule_toy_progress|DRAW-CAPSULETOY|service_route/drawActivity|etf → etf|pb_capsule_toy_progress_back||
|102401|req_chess_revert_turn_award|DRAW-CHESSREVERT|service_route/drawActivity|protobuf → etf/pb_chess_revert_req|pb_chess_revert_award_back|request_encoding_mismatch|
|102402|req_chess_revert_act_select_gift|DRAW-CHESSREVERT|service_route/drawActivity|protobuf → etf/pb_chess_revert_select_gift_req|pb_chess_revert_act_gift|request_encoding_mismatch|
|102403|req_chess_revert_next_turn|DRAW-CHESSREVERT|service_route/drawActivity|protobuf → etf/pb_chess_revert_next_turn|pb_chess_revert_init|request_encoding_mismatch|
|102501|req_tile_swap_next_turn|PLAY-TILESWAP|service_route/minigameAct|etf → etf|pb_tile_swap||
|102601|req_mushroom_start|PLAY-MUSHROOMMONSTER|service_route/minigameAct|etf → etf|pb_mushroom_monster||
|102602|req_mushroom_end|PLAY-MUSHROOMMONSTER|service_route/minigameAct|etf → etf|pb_mushroom_monster_end_rev||
|102603|req_mushroom_award|PLAY-MUSHROOMMONSTER|service_route/minigameAct|etf → etf|pb_mushroom_monster_award_rev||
|102701|req_auction_bid|PAY-AUCTION|service_route/benefitCommerce|protobuf → protobuf/pb_auction_bid_req|pb_auction_bid_back||
|102702|req_auction_wish|PAY-AUCTION|service_route/benefitCommerce|protobuf → protobuf/pb_auction_wish_req|—|response_schema_missing|
|102703|req_auction_dividend_award|PAY-AUCTION|service_route/benefitCommerce|etf → conditional|pb_auction_dividend_rev_back|request_encoding_unverified|
|102704|req_auction_attend|PAY-AUCTION|service_route/benefitCommerce|etf → conditional|pb_role_auction_list|request_encoding_unverified|
|102705|req_auction_detail|PAY-AUCTION|service_route/benefitCommerce|etf → conditional|pb_auction|request_encoding_unverified|
|102801|req_channel_entry|SOC-CHANNELENTRY|multi_owner/gateway|etf → unverified|pb_channel_entry|request_encoding_unverified, shadowed_owner|
|102901|req_vote_act_blind_vote|ACT-VOTEACT|service_route/actReward|protobuf → etf/pb_vote_act_vote_req|pb_vote_act_back|request_encoding_mismatch|
|102902|req_vote_act_common_vote|ACT-VOTEACT|service_route/actReward|protobuf → etf/pb_vote_act_vote_req|pb_vote_act_back|request_encoding_mismatch|
|102903|req_vote_act_progress_award|ACT-VOTEACT|service_route/actReward|etf → etf|pb_res_to_client||
|102904|req_vote_act_task_award|ACT-VOTEACT|service_route/actReward|etf → etf|pb_res_to_client||
|102905|req_vote_act_task_guess|ACT-VOTEACT|service_route/actReward|etf → etf|—|response_schema_missing|
|102906|req_vote_act_server_vote|ACT-VOTEACT|service_route/actReward|etf → etf|pb_vote_act_server||
|102907|req_vote_prize_list_req|ACT-VOTEACT|service_route/actReward|etf → etf|pb_vote_prize_back||
|103001|req_question_act_answer|ACT-QUESTIONACT|service_route/actReward|protobuf → etf/pb_question_answer_req|pb_question_day|request_encoding_mismatch|
|103002|req_question_act_reward|ACT-QUESTIONACT|service_route/actReward|protobuf → etf/pb_question_reward_req|pb_question_reward_back|request_encoding_mismatch|
|103003|req_question_act_reward_pile|ACT-QUESTIONACT|service_route/actReward|protobuf → etf/pb_question_reward_pile_req|pb_question_reward_pile_back|request_encoding_mismatch|
|103101|req_camp_halo_level_up|HERO-CAMPHALO|service_route/heroCommandServices[6]|etf → unverified|pb_camp_halo_role|request_encoding_unverified|
|103201|req_beat_gopher|PLAY-GOPHERACT|service_route/minigameAct|unverified → etf|pb_beat_gopher_back||
|103301|req_puzzle_draw|DRAW-CHILDPUZZLEACT|service_route/drawActivity|protobuf → etf/pb_puzzle_draw_req|pb_puzzle_draw_back|request_encoding_mismatch|
|103302|req_puzzle_award|DRAW-CHILDPUZZLEACT|service_route/drawActivity|etf → etf|pb_res_to_client||
|103303|req_puzzle_change_turn|DRAW-CHILDPUZZLEACT|service_route/drawActivity|etf → etf|pb_puzzle_person||
|103304|req_puzzle_task_award|DRAW-CHILDPUZZLEACT|service_route/drawActivity|protobuf → etf/pb_puzzle_task_award_req|pb_puzzle_task_award_rsp|request_encoding_mismatch|
|103305|req_puzzle_select_award|DRAW-CHILDPUZZLEACT|service_route/drawActivity|etf → etf|pb_puzzle_person||
|103401|req_guild_hunt_attend|SOC-GUILDHUNT|service_route/guildCoopServices[10]|etf → unverified|—|response_schema_missing, request_encoding_unverified|
|103402|req_guild_hunt_support|SOC-GUILDHUNT|service_route/guildCoopServices[10]|etf → unverified|pb_res_to_client|request_encoding_unverified|
|103403|req_guild_hunt_server_info|SOC-GUILDHUNT|service_route/guildCoopServices[10]|etf → unverified|pb_guild_hunt_server|request_encoding_unverified|
|103501|req_hoard_wheel_set_pool|DRAW-HOARDWHEELACT|service_route/drawActivity|protobuf → etf/pb_hoard_wheel_draw_change_req|pb_hoard_wheel_pool|request_encoding_mismatch|
|103502|req_hoard_wheel_task|DRAW-HOARDWHEELACT|service_route/drawActivity|protobuf → etf/pb_hoard_wheel_task_req|pb_res_to_client|request_encoding_mismatch|
|103503|req_hoard_wheel_pile|DRAW-HOARDWHEELACT|service_route/drawActivity|protobuf → etf/pb_hoard_wheel_pile_req|pb_hoard_wheel_pile_back|request_encoding_mismatch|
|103601|req_skin_recharge_get_role|PAY-SKINRECHARGE|service_route/benefitCommerce|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|103701|req_summer_preview_reward|ACT-SUMMERACT|service_route/actReward|protobuf → etf/pb_summer_preview_req|pb_res_to_client|request_encoding_mismatch|
|103702|req_summer_wg_up_lv|ACT-SUMMERACT|service_route/actReward|protobuf → etf/pb_summer_wg_up_lv_req|pb_summer_wg_universal_back|request_encoding_mismatch|
|103703|pb_summer_wg_up_stage|ACT-SUMMERACT|service_route/actReward|etf → etf|pb_summer_wg_universal_back||
|103704|pb_summer_wb_active|ACT-SUMMERACT|service_route/actReward|protobuf → etf/pb_summer_wb_universal_req|pb_summer_wg_universal_back|request_encoding_mismatch|
|103705|pb_summer_wb_up_strong|ACT-SUMMERACT|service_route/actReward|protobuf → etf/pb_summer_wb_up_strong_req|pb_summer_wg_universal_back|request_encoding_mismatch|
|103706|pb_summer_wb_up_quality|ACT-SUMMERACT|service_route/actReward|protobuf → etf/pb_summer_wb_universal_req|pb_summer_wg_universal_back|request_encoding_mismatch|
|103707|pb_summer_phase_task_award|ACT-SUMMERACT|service_route/actReward|etf → etf|pb_summer_task_back||
|103708|pb_summer_phase_progress_award|ACT-SUMMERACT|service_route/actReward|etf → etf|pb_summer_task_back||
|103709|req_summer_change_water_skin|ACT-SUMMERACT|service_route/actReward|protobuf → etf/pb_summer_water_skin_change_req|pb_summer_water_gun_person|request_encoding_mismatch|
|103710|req_summer_power|ACT-SUMMERACT|service_route/actReward|protobuf → etf/pb_summer_power_req|—|response_schema_missing, request_encoding_mismatch|
|103711|req_summer_enter|ACT-SUMMERACT|service_route/actReward|etf → etf|—|response_schema_missing|
|103712|req_summer_standard_award|ACT-SUMMERACT|service_route/actReward|etf → etf|pb_res_to_client||
|103801|req_summer_act_task_award|ACT-SUMMERPVE|service_route/actReward|protobuf → etf/pb_summer_act_task_award_req|pb_summer_act_pve_update|request_encoding_mismatch|
|103802|req_summer_act_pve_buy_times|ACT-SUMMERPVE|service_route/actReward|protobuf → etf/pb_summer_act_pve_buy_times_req|pb_summer_act_pve_update|request_encoding_mismatch|
|103803|req_summer_act_pve_phase_award|ACT-SUMMERPVE|service_route/actReward|etf → etf|pb_summer_act_pve_update||
|103804|req_summer_act_pve_set_award_drop|ACT-SUMMERPVE|service_route/actReward|protobuf → etf/pb_summer_act_pve_set_award_drop|pb_summer_act_pve_update|request_encoding_mismatch|
|103813|req_summer_standard_award_show|ACT-SUMMERACT|service_route/actReward|etf → etf|pb_summer_show_show_standard||
|103814|req_summer_settle_rewards_preview|ACT-SUMMERACT|service_route/actReward|protobuf → etf/pb_summer_settle_rewards_preview_req|pb_summer_settle_rewards_preview_rsp|request_encoding_mismatch|
|103815|req_summer_settle_rewards|ACT-SUMMERACT|service_route/actReward|protobuf → etf/pb_summer_settle_rewards_req|pb_summer_settle_rewards_rsp|request_encoding_mismatch|
|103901|req_summer_mission_fight_settle|ACT-SUMMERMISSION|service_route/actReward|protobuf → etf/pb_summer_act_mission_fight_req|pb_summer_act_mission_fight_back|request_encoding_mismatch|
|103902|req_summer_mission_progress_award|ACT-SUMMERMISSION|service_route/actReward|etf → etf|pb_summer_act_mission_progress_award_back||
|104001|req_buy_skin_free_award|PAY-BUYSKINACT|service_route/buySkinAct|protobuf → conditional/pb_buy_skin_free_req|pb_res_to_client|request_encoding_unverified|
|104101|req_summer_act_pvp_init_swap|ACT-SUMMERPVP|service_route/actReward|etf → etf|pb_summer_act_pvp_rank_update||
|104102|req_summer_act_pvp_day_task|ACT-SUMMERPVP|service_route/actReward|protobuf → etf/pb_summer_act_pvp_award|pb_summer_act_pvp_update|request_encoding_mismatch|
|104103|req_summer_act_pvp_phase_task|ACT-SUMMERPVP|service_route/actReward|protobuf → etf/pb_summer_act_pvp_award|pb_summer_act_pvp_update|request_encoding_mismatch|
|104104|req_summer_act_pvp_guess|ACT-SUMMERPVP|service_route/actReward|protobuf → etf/pb_summer_act_pvp_guess_req|pb_summer_act_pvp_role|request_encoding_mismatch|
|104105|req_summer_buy_challenge_times|ACT-SUMMERPVP|service_route/actReward|etf → etf|pb_res_to_client||
|104106|req_summer_buy_challenge_match_times|ACT-SUMMERPVP|service_route/actReward|etf → etf|pb_res_to_client||
|104107|req_summer_buy_match_enemy|ACT-SUMMERPVP|service_route/actReward|etf → etf|pb_summer_challenge_person||
|104108|req_summer_act_pvp_swap_rematch|ACT-SUMMERPVP|service_route/actReward|etf → etf|pb_summer_act_pvp_role||
|104109|req_summer_act_pvp_swap_buy_match|ACT-SUMMERPVP|service_route/actReward|protobuf → etf/pb_summer_act_pvp_swap_buy|pb_summer_act_pvp_update|request_encoding_mismatch|
|104110|req_summer_act_pvp_swap_buy_fight|ACT-SUMMERPVP|service_route/actReward|protobuf → etf/pb_summer_act_pvp_swap_buy|pb_summer_act_pvp_update|request_encoding_mismatch|
|104111|req_summer_act_pvp_swap_init_lineup|ACT-SUMMERPVP|service_route/actReward|protobuf → etf/pb_summer_act_pvp_swap_init_lineup|pb_lineup|request_encoding_mismatch|
|104112|req_summer_act_pvp_top_history|ACT-SUMMERPVP|service_route/actReward|etf → etf|pb_summer_act_pvp_head_history||
|104113|req_summer_buy_special_match_enemy|ACT-SUMMERPVP|service_route/actReward|etf → etf|pb_summer_challenge_person||
|104201|req_badge_active|EQUIP-BADGE|service_route/endgameDevelopServices[7]|protobuf → unverified/pb_badge_active_req|pb_badge_role|request_encoding_unverified|
|104301|req_tower_act_step|PLAY-TOWERACT|service_route/minigameAct|protobuf → etf/pb_tower_act_step_req|pb_tower_act_slot_rsp|request_encoding_mismatch|
|104302|req_tower_act_switch|PLAY-TOWERACT|service_route/minigameAct|protobuf → etf/pb_tower_act_switch_req|pb_tower_act_role|request_encoding_mismatch|
|104303|req_tower_act_task|PLAY-TOWERACT|service_route/minigameAct|protobuf → etf/pb_tower_act_task_req|pb_tower_act_task_rsp|request_encoding_mismatch|
|104401|req_qi_xi_discount_select|ACT-QIXIACT|service_route/actReward|protobuf → etf/pb_qi_xi_recharge_select_req|pb_qi_xi_recharge_select_info|request_encoding_mismatch|
|104402|req_qi_xi_daily_sign|ACT-QIXIACT|service_route/actReward|etf → etf|pb_res_to_client||
|104403|req_anniversary_game_act_award|ACT-ANNIVERSARYGAMEACT|service_route/actReward|protobuf → etf/pb_anniversary_game_act_award_req|pb_anniversary_game_act_award_rsp|request_encoding_mismatch|
|104501|req_thousand_draw|DRAW-THOUSANDDRAW|service_route/drawActivity|protobuf → etf/pb_request_thousand_draw|pb_response_thousand_draw|request_encoding_mismatch|
|104502|req_thousand_award|DRAW-THOUSANDDRAW|service_route/drawActivity|protobuf → etf/pb_request_thousand_award|pb_response_thousand_award|request_encoding_mismatch|
|104601|req_five_day_boss_act_task_award|ACT-FIVEDAYBOSSACT|service_route/actReward|protobuf → etf/pb_five_day_boss_act_award_req|pb_five_day_boss_act_res_update|request_encoding_mismatch|
|104602|req_five_day_boss_act_time_pass_award|ACT-FIVEDAYBOSSACT|service_route/actReward|protobuf → etf/pb_five_day_boss_act_award_req|pb_five_day_boss_act_res_update|request_encoding_mismatch|
|104603|req_five_day_boss_act_get_rank|ACT-FIVEDAYBOSSACT|service_route/actReward|etf → etf|pb_five_day_boss_act_server_data||
|104701|req_destiny_pve_fight|BATTLE-DESTINYPVE|service_route/destinyPve|protobuf → conditional/pb_destiny_pve_fight_req|pb_destiny_pve_fight_rsq|response_schema_missing, request_encoding_unverified|
|104702|req_destiny_pve_layer_info|BATTLE-DESTINYPVE|service_route/destinyPve|protobuf → conditional/pb_destiny_pve_layer_info_req|pb_destiny_pve_layer_info_rsq|request_encoding_unverified|
|104801|req_act_shop_info|PAY-ACTSHOP|service_route/actShop|protobuf → conditional/pb_act_shop_info_req|pb_act_shop_info_rsp|request_encoding_unverified|
|104802|req_act_buy_goods|PAY-ACTSHOP|service_route/benefitCommerce|protobuf → protobuf/pb_act_buy_goods_req|pb_act_buy_goods_rsp||
|104803|req_act_shop_level_rewards|PAY-ACTSHOP|service_route/benefitCommerce|protobuf → protobuf/pb_act_shop_level_rewards_req|pb_act_shop_level_rewards_rsp||
|104901|req_pray_act_select_award|DRAW-PRAYACT|service_route/drawActivity|protobuf → etf/pb_pray_act_select_award_req|pb_pray_act_select_award_rsp|request_encoding_mismatch|
|104902|req_pray_act_draw_award|DRAW-PRAYACT|service_route/drawActivity|protobuf → etf/pb_pray_act_draw_award_req|pb_pray_act_draw_award_rsp|request_encoding_mismatch|
|105001|req_spirit_courtyard_tree_plant|PLAY-SPIRITCOURTYARD|service_route/minigameAct|protobuf → etf/pb_req_spirit_courtyard_tree_plant|pb_rsp_spirit_courtyard_tree_plant|request_encoding_mismatch|
|105002|req_spirit_courtyard_tree_get|PLAY-SPIRITCOURTYARD|service_route/minigameAct|etf → etf|pb_rsp_spirit_courtyard_tree_get||
|105003|req_spirit_courtyard_add_land|PLAY-SPIRITCOURTYARD|service_route/minigameAct|etf → etf|pb_rsp_spirit_courtyard_tree_get||
|105004|req_spirit_courtyard_tree_remove|PLAY-SPIRITCOURTYARD|service_route/minigameAct|etf → etf|pb_rsp_spirit_courtyard_tree_plant||
|105005|req_spirit_courtyard_get_task_reward|PLAY-SPIRITCOURTYARD|service_route/minigameAct|protobuf → etf/pb_req_spirit_courtyard_submit_entrust|pb_res_spirit_courtyard_submit_entrust|request_encoding_mismatch|
|105006|req_spirit_courtyard_update_task|PLAY-SPIRITCOURTYARD|service_route/minigameAct|etf → etf|pb_res_spirit_courtyard_update_task||
|105007|req_spirit_courtyard_publish_collaboration|PLAY-SPIRITCOURTYARD|service_route/minigameAct|protobuf → etf/pb_req_spirit_courtyard_publish_collaboration|pb_res_spirit_courtyard_publish_collaboration|request_encoding_mismatch|
|105008|req_spirit_courtyard_assist_entrust|PLAY-SPIRITCOURTYARD|service_route/minigameAct|protobuf → etf/pb_req_spirit_courtyard_assist_entrust|pb_res_spirit_courtyard_assist_entrust|request_encoding_mismatch|
|105009|req_spirit_courtyard_finish_guild_task|PLAY-SPIRITCOURTYARD|service_route/minigameAct|protobuf → etf/pb_req_spirit_courtyard_finish_banquet|pb_rsp_spirit_courtyard_finish_banquet|request_encoding_mismatch|
|105010|req_spirit_courtyard_tree_fruit_merge|PLAY-SPIRITCOURTYARD|service_route/minigameAct|protobuf → etf/pb_req_spirit_courtyard_fruit_merge|pb_res_to_client|request_encoding_mismatch|
|105011|req_spirit_courtyard_tree_change|PLAY-SPIRITCOURTYARD|service_route/minigameAct|protobuf → etf/pb_req_spirit_courtyard_tree_plant|pb_rsp_spirit_courtyard_tree_get|request_encoding_mismatch|
|105012|req_spirit_courtyard_refresh_role_info|PLAY-SPIRITCOURTYARD|service_route/minigameAct|protobuf → etf/pb_req_spirit_courtyard_refresh_role_info|pb_res_spirit_courtyard_refresh_role_info|request_encoding_mismatch|
|105013|req_spirit_courtyard_cancel_publish_collaboration|PLAY-SPIRITCOURTYARD|service_route/minigameAct|protobuf → etf/pb_req_spirit_courtyard_cancel_collaboration|pb_res_spirit_courtyard_cancel_collaboration|request_encoding_mismatch|
|105014|req_spirit_courtyard_intimacy_task_reward|PLAY-SPIRITCOURTYARD|service_route/minigameAct|etf → etf|pb_spirit_courtyard_in_task_res||
|105015|req_spirit_courtyard_banquet_award|PLAY-SPIRITCOURTYARD|service_route/minigameAct|etf → etf|pb_rsp_spirit_courtyard_banquet_award||
|105016|req_spirit_courtyard_use_item|PLAY-SPIRITCOURTYARD|service_route/minigameAct|protobuf → etf/pb_req_spirit_courtyard_use_item|pb_rsp_spirit_courtyard_tree_get|request_encoding_mismatch|
|105101|req_get_ones_reward|ACT-ONESREWARD|service_route/actReward|etf → etf|pb_get_ones_reward_rsp||
|105201|req_invite_act_bind|ACT-INVITEACT|service_route/actReward|protobuf → etf/pb_invite_bind_req|pb_invite_bind_rsp|request_encoding_mismatch|
|105202|req_invite_act_task|ACT-INVITEACT|service_route/actReward|protobuf → etf/pb_invite_task_req|pb_invite_task_rsp|request_encoding_mismatch|
|105250|req_invite_old_act_invited|ACT-INVITEOLDACT|service_route/actReward|etf → etf|pb_invite_old_invited_list_rsp||
|105251|req_invite_old_act_task|ACT-INVITEOLDACT|service_route/actReward|protobuf → etf/pb_invite_old_task_req|pb_invite_old_task_rsp|request_encoding_mismatch|
|105301|req_role_back_bind_award|ACT-ROLEBACK|service_route/actReward|etf → etf|pb_res_to_client||
|105303|req_role_back_inheritance_card|ACT-ROLEBACK|service_route/actReward|etf → etf|pb_permanent_card_active_back||
|105305|req_role_back_new_bind|ACT-ROLEBACK|service_route/actReward|etf → etf|pb_rsp_role_back_info_res||
|105307|req_role_back_get_roles_info|ACT-ROLEBACK|service_route/actReward|etf → etf|pb_rsp_role_show_infos||
|105308|req_role_back_get_day_money|ACT-ROLEBACK|service_route/actReward|etf → etf|pb_res_to_client||
|105401|req_premium_free_award|PAY-PREMIUMACT|service_route/benefitCommerce|protobuf → protobuf/pb_premium_free_award_req|pb_premium_free_award_rsp||
|105501|req_cashback_draw_draw|DRAW-CASHBACKDRAW|service_route/drawActivity|protobuf → etf/pb_cashback_draw_draw_req|pb_cashback_draw_draw_rsp|request_encoding_mismatch|
|105502|req_cashback_draw_get_times|DRAW-CASHBACKDRAW|service_route/drawActivity|protobuf → etf/pb_cashback_draw_get_times_req|pb_cashback_draw_get_times_rsp|request_encoding_mismatch|
|105503|req_cashback_draw_server_award|DRAW-CASHBACKDRAW|service_route/drawActivity|protobuf → etf/pb_cashback_draw_server_award_req|pb_cashback_draw_server_award_rsp|request_encoding_mismatch|
|105504|req_cashback_draw_server_progress|DRAW-CASHBACKDRAW|service_route/drawActivity|protobuf → etf/pb_cashback_draw_server_progress_req|pb_cashback_draw_server_progress_rsp|request_encoding_mismatch|
|105601|req_choice_story_award|ACT-CHOICESTORY|service_route/actReward|protobuf → etf/pb_choice_story_award_req|pb_choice_story_award_rsp|request_encoding_mismatch|
|105701|req_task_activity_finish|ITEM-TASKACTIVITY|service_route/taskActivity|protobuf → protobuf/pb_task_activity_finish_req|pb_task_activity_finish_rsp||
|105702|req_task_activity_data|ITEM-TASKACTIVITY|service_route/taskActivity|etf → conditional|pb_task_activity_data_rsp|request_encoding_unverified|
|105801|req_month_permit_receive_pay|PAY-MONTHPERMIT|gateway_route/gateway|protobuf → conditional/pb_month_permit_receive_req|pb_month_permit_receive_back|request_encoding_unverified|
|105802|req_month_permit_buy_level|PAY-MONTHPERMIT|gateway_route/gateway|protobuf → protobuf/pb_month_permit_buy_exp_req|pb_month_permit_buy_level_back||
|105803|req_month_permit_receive_all|PAY-MONTHPERMIT|gateway_route/gateway|etf → conditional|pb_month_permit_receive_back|request_encoding_unverified|
|105804|req_month_permit_task_reward|PAY-MONTHPERMIT|gateway_route/gateway|protobuf → conditional/pb_month_permit_task_req|pb_month_permit_task_back|request_encoding_unverified|
|105805|req_guild_crusade_get_rank|SOC-GUILDCRUSADE|service_route/guildCoopServices[11]|etf → unverified|pb_guild_crusade_rank_rsp|response_schema_missing, request_encoding_unverified|
|105901|req_recycle_act_recycle|PAY-RECYCLEACT|service_route/benefitCommerce|protobuf → protobuf/pb_recycle_act_recycle_req|pb_res_to_client||
|106001|req_triple_match_swap_tile|PLAY-TRIPLEMATCH|service_route/minigameAct|protobuf → etf/pb_triple_match_swap_tile_req|pb_triple_match_swap_tile_rsp|request_encoding_mismatch|
|106002|req_triple_match_restart|PLAY-TRIPLEMATCH|service_route/minigameAct|protobuf → etf/pb_triple_match_restart_req|pb_triple_match_swap_tile_rsp|request_encoding_mismatch|
|106003|req_triple_match_score_award|PLAY-TRIPLEMATCH|service_route/minigameAct|protobuf → etf/pb_triple_match_score_award_req|pb_triple_match_score_award_rsp|request_encoding_mismatch|
|106004|req_triple_match_use_item|PLAY-TRIPLEMATCH|service_route/minigameAct|protobuf → etf/pb_triple_match_use_item_req|pb_triple_match_use_item_rsp|request_encoding_mismatch|
|106005|req_triple_match_pass_stage_award|PLAY-TRIPLEMATCH|service_route/minigameAct|protobuf → etf/pb_triple_match_rec_pass_stage_award_req|pb_triple_match_rec_pass_stage_award_rsp|request_encoding_mismatch|
|106101|req_vickrey_auction_act_get_info|PAY-VICKREYAUCTIONACT|service_route/benefitCommerce|protobuf → protobuf/pb_vickrey_auction_act_info_req|pb_vickrey_auction_act_info_rsp||
|106102|req_vickrey_act_auction_bid|PAY-VICKREYAUCTIONACT|service_route/benefitCommerce|protobuf → protobuf/pb_vickrey_auction_act_bid_req|pb_vickrey_auction_act_bid_rsp||
|106201|req_firecracker_act_guild_info|ACT-FIRECRACKERACT|service_route/actReward|protobuf → etf/pb_firecracker_act_guild_info_req|pb_firecracker_act_guild_info_rsp|request_encoding_mismatch|
|106202|req_firecracker_act_use|ACT-FIRECRACKERACT|service_route/actReward|protobuf → etf/pb_firecracker_act_use_req|pb_firecracker_act_use_rsp|request_encoding_mismatch|
|106203|req_firecracker_act_task_award|ACT-FIRECRACKERACT|service_route/actReward|protobuf → etf/pb_firecracker_act_task_award_req|pb_firecracker_act_task_award_rsp|request_encoding_mismatch|
|106204|req_firecracker_act_acc_award|ACT-FIRECRACKERACT|service_route/actReward|protobuf → etf/pb_firecracker_act_acc_award_req|pb_firecracker_act_acc_award_rsp|request_encoding_mismatch|
|106205|req_firecracker_act_acc_recharge_award|ACT-FIRECRACKERACT|service_route/actReward|protobuf → etf/pb_firecracker_act_acc_recharge_award_req|pb_firecracker_act_acc_recharge_award_rsp|request_encoding_mismatch|
|106301|req_gift_box_receive|PAY-GIFTBOXACT|service_route/benefitCommerce|protobuf → protobuf/pb_gift_box_receive_req|pb_gift_box_receive_rsp||
|107301|req_subscription_act_subscribe|PAY-SUBSCRIPTIONACT|service_route/benefitCommerce|protobuf → protobuf/pb_subscription_act_subscribe_req|pb_subscription_act_subscribe_rsp||
|107302|req_subscription_act_get|PAY-SUBSCRIPTIONACT|service_route/benefitCommerce|protobuf → protobuf/pb_subscription_act_subscribe_req|pb_subscription_act_award_rsp||
|107303|req_subscription_act_enter|PAY-SUBSCRIPTIONACT|service_route/benefitCommerce|etf → conditional|pb_subscription_act_data|request_encoding_unverified|
|107401|req_new_permit_award|PAY-NEWPERMITACT|service_route/benefitCommerce|protobuf → protobuf/pb_new_permit_award_req|pb_new_permit_award_rsp||
|107501|req_matching_game_act_luck|PLAY-MATCHINGGAMEACT|service_route/minigameAct|protobuf → etf/pb_matching_game_act_luck_req|pb_role_matching_game_act_info|request_encoding_mismatch|
|107502|req_matching_game_act_use_card|PLAY-MATCHINGGAMEACT|service_route/minigameAct|etf → etf|pb_matching_game_act_use_card_rsp||
|107503|req_matching_game_award|PLAY-MATCHINGGAMEACT|service_route/minigameAct|protobuf → etf/pb_matching_game_act_score_award_req|pb_matching_game_act_score_award_rsp|request_encoding_mismatch|
|107601|req_guild_auction_bid|SOC-GUILDAUCTION|service_route/guildCoopServices[12]|protobuf → unverified/req_guild_auction_bid|rsp_guild_auction_bid|request_encoding_unverified|
|107602|req_guild_auction_wish|SOC-GUILDAUCTION|service_route/guildCoopServices[12]|protobuf → unverified/pb_guild_auction_wish_req|rsp_guild_auction_wish|request_encoding_unverified|
|107603|req_guild_auction_get|SOC-GUILDAUCTION|service_route/guildCoopServices[12]|etf → unverified|guild_auction_get_req|request_encoding_unverified|
|107701|req_dragon_land_daily_award|PAY-DRAGONLANDACT|service_route/dragonLandAct|protobuf → etf/pb_dragon_land_daily_award_req|pb_dragon_land_daily_award_rsp|request_encoding_mismatch|
|107702|req_dragon_land_trial_award|PAY-DRAGONLANDACT|service_route/dragonLandAct|protobuf → etf/pb_dragon_land_trial_award_req|pb_dragon_land_trial_award_rsp|request_encoding_mismatch|
|107703|req_dragon_land_guild_data|PAY-DRAGONLANDACT|service_route/dragonLandAct|protobuf → etf/pb_dragon_land_guild_data_req|pb_dragon_land_guild_data_rsp|request_encoding_mismatch|
|107801|req_monopoly_act_go|PLAY-MONOPOLYACT|service_route/minigameAct|protobuf → etf/pb_monopoly_act_go_req|pb_monopoly_act_go_back|request_encoding_mismatch|
|107802|req_monopoly_act_finish_fight_event|PLAY-MONOPOLYACT|service_route/minigameAct|protobuf → etf/pb_monopoly_act_base_req|pb_monopoly_act_finish_order_back|request_encoding_mismatch|
|107803|req_monopoly_act_get_live_award|PLAY-MONOPOLYACT|service_route/minigameAct|protobuf → etf/pb_monopoly_act_get_reward_req|pb_res_to_client|request_encoding_mismatch|
|107804|req_monopoly_act_get_guild_task_award|PLAY-MONOPOLYACT|service_route/minigameAct|protobuf → etf/pb_monopoly_act_get_reward_req|pb_res_to_client|request_encoding_mismatch|
|107805|req_monopoly_act_get_total_task_award|PLAY-MONOPOLYACT|service_route/minigameAct|protobuf → etf/pb_monopoly_act_get_reward_req|pb_res_to_client|request_encoding_mismatch|
|107806|req_monopoly_act_get_supply|PLAY-MONOPOLYACT|service_route/minigameAct|protobuf → etf/pb_monopoly_act_get_reward_req|pb_res_to_client|request_encoding_mismatch|
|107807|req_monopoly_act_fight_help|PLAY-MONOPOLYACT|service_route/minigameAct|protobuf → etf/pb_monopoly_act_base_req|pb_monopoly_act_send_order_back|request_encoding_mismatch|
|107808|req_monopoly_act_get_guild_info|PLAY-MONOPOLYACT|service_route/minigameAct|etf → etf|pb_monopoly_act_get_guild_back||
|107809|req_monopoly_act_day_award|PLAY-MONOPOLYACT|service_route/minigameAct|etf → etf|pb_res_to_client||
|107810|req_monopoly_act_jump_fight|PLAY-MONOPOLYACT|service_route/minigameAct|protobuf → etf/pb_monopoly_act_fight_req|pb_monopoly_act_base_back|request_encoding_mismatch|
|107811|req_monopoly_act_finish_firm|PLAY-MONOPOLYACT|service_route/minigameAct|protobuf → etf/pb_monopoly_act_finish_firm_req|pb_monopoly_act_finish_order_back|request_encoding_mismatch|
|107901|req_turntable_act_go|DRAW-TURNTABLEACT|service_route/drawActivity|etf → etf|pb_turntable_act_go_back||
|108001|req_dream_trial_query_rob|PLAY-DREAMTRIALACT|service_route/minigameAct|protobuf → etf/pb_dream_trial_query_rob_req|pb_dream_trial_query_rob_rsp|request_encoding_mismatch|
|108002|req_dream_trial_guild_info|PLAY-DREAMTRIALACT|service_route/minigameAct|protobuf → etf/pb_dream_trial_guild_info_req|pb_dream_trial_guild_info_rsp|request_encoding_mismatch|
|109001|req_diamond_vein_act_get_map|PLAY-DIAMONDVEINACT|service_route/minigameAct|protobuf → etf/pb_diamond_vein_act_base_req|pb_diamond_vein_act_map_data|request_encoding_mismatch|
|109002|req_diamond_vein_act_enter_map|PLAY-DIAMONDVEINACT|service_route/minigameAct|protobuf → etf/pb_diamond_vein_act_base_req|pb_diamond_vein_act_enter_rsp|request_encoding_mismatch|
|109003|req_diamond_vein_act_award|PLAY-DIAMONDVEINACT|service_route/minigameAct|protobuf → etf/pb_diamond_vein_act_base_req|pb_diamond_vein_act_get_award_rsp|request_encoding_mismatch|
|109004|req_diamond_vein_act_buy_attack|PLAY-DIAMONDVEINACT|service_route/minigameAct|protobuf → etf/pb_diamond_vein_act_base_req|pb_diamond_vein_act_role_res_rsp|request_encoding_mismatch|
|109005|req_diamond_vein_act_buy_action|PLAY-DIAMONDVEINACT|service_route/minigameAct|protobuf → etf/pb_diamond_vein_act_base_req|pb_diamond_vein_act_role_res_rsp|request_encoding_mismatch|
|109006|req_diamond_vein_act_guild_focus|PLAY-DIAMONDVEINACT|service_route/minigameAct|protobuf → etf/pb_diamond_vein_act_guild_focus_req|pb_diamond_vein_act_guild_rsp|request_encoding_mismatch|
|109007|req_diamond_vein_act_guild_rank_info|PLAY-DIAMONDVEINACT|service_route/minigameAct|etf → etf|pb_diamond_vein_act_guild_rank_player_info||
|109008|req_diamond_vein_act_get_fight_record|PLAY-DIAMONDVEINACT|service_route/minigameAct|etf → etf|pb_diamond_vein_act_fight_reports_rsp||
|109009|req_diamond_vein_act_get_guild_info|PLAY-DIAMONDVEINACT|service_route/minigameAct|etf → etf|pb_diamond_vein_act_guild_data||
|109101|req_flop_card_flop|DRAW-FLOPCARDACT|service_route/drawActivity|protobuf → etf/pb_flop_card_act_flop_req|pb_flop_card_act_rsp|request_encoding_mismatch|
|109102|req_flop_card_get_reward|DRAW-FLOPCARDACT|service_route/drawActivity|protobuf → etf/pb_flop_card_act_get_reward_req|pb_flop_card_act_rsp|request_encoding_mismatch|
|109103|req_flop_card_get_total_reward|DRAW-FLOPCARDACT|service_route/drawActivity|protobuf → etf/pb_flop_card_act_get_total_reward_req|pb_flop_card_act_rsp|request_encoding_mismatch|
|110101|req_source_point_change|PLAY-SOURCEPOINT|service_route/minigameAct|protobuf → etf/pb_source_point_change_req|pb_source_point_change_rsp|request_encoding_mismatch|
|110102|req_source_point_combine|PLAY-SOURCEPOINT|service_route/minigameAct|protobuf → etf/pb_source_point_combine_req|pb_source_point_combine_rsp|request_encoding_mismatch|
|110103|req_source_point_task_award|PLAY-SOURCEPOINT|service_route/minigameAct|protobuf → etf/pb_source_point_task_req|pb_source_point_task_rsp|request_encoding_mismatch|
|110201|req_diamond_bank_act_task|PAY-DIAMONDBANKACT|service_route/diamondBankAct|protobuf → unverified/pb_diamond_bank_act_base_req|pb_diamond_bank_act_task_rsp|request_encoding_unverified|
|110202|req_diamond_bank_act_award|PAY-DIAMONDBANKACT|service_route/diamondBankAct|etf → unverified|pb_res_to_client|request_encoding_unverified|
|110203|req_diamond_bank_act_buy|PAY-DIAMONDBANKACT|service_route/diamondBankAct|etf → unverified|pb_res_to_client|request_encoding_unverified|
|110301|req_fishing_act_go_fish|PLAY-FISHINGACT|service_route/activityRead|protobuf → etf/pb_fishing_act_rod_req|pb_fishing_act_role_data|request_encoding_mismatch|
|110302|req_fishing_act_get_fish|PLAY-FISHINGACT|service_route/activityRead|protobuf → etf/pb_fishing_act_get_req|pb_fishing_act_get_rsp|request_encoding_mismatch|
|110303|req_fishing_act_get_fish_top|PLAY-FISHINGACT|service_route/activityRead|etf → etf|pb_fishing_act_get_top_rsp||
|110304|req_fishing_act_book_award|PLAY-FISHINGACT|service_route/activityRead|protobuf → etf/pb_fishing_act_common_list_req|pb_fishing_act_data_res|request_encoding_mismatch|
|110305|req_fishing_act_unlock_map|PLAY-FISHINGACT|service_route/activityRead|protobuf → etf/pb_fishing_act_common_req|pb_fishing_act_data_res|request_encoding_mismatch|
|110306|req_fishing_act_change_rod|PLAY-FISHINGACT|service_route/activityRead|protobuf → etf/pb_fishing_act_common_req|—|response_schema_missing, request_encoding_mismatch|
|110307|req_fishing_act_level_award|PLAY-FISHINGACT|service_route/activityRead|protobuf → etf/pb_fishing_act_common_req|pb_fishing_act_data_res|request_encoding_mismatch|
|110308|req_fishing_act_get_record|PLAY-FISHINGACT|service_route/activityRead|etf → etf|pb_fishing_act_get_record_rsp||
|110309|req_fishing_act_up_rank_award|PLAY-FISHINGACT|service_route/activityRead|etf → etf|pb_fishing_act_data_res||
|110310|req_fishing_act_progress_award|PLAY-FISHINGACT|service_route/activityRead|protobuf → etf/pb_fishing_act_common_list_req|pb_fishing_act_data_res|request_encoding_mismatch|
|110311|req_fishing_act_batch_get_fish|PLAY-FISHINGACT|service_route/activityRead|protobuf → etf/pb_fishing_act_batch_get_req|pb_fishing_act_batch_get_rsp|request_encoding_mismatch|
|110401|req_furniture_active|PLAY-ALBUM|service_route/minigameAct|etf → etf|pb_homeland_album_role||
|110402|req_furniture_suit_active|PLAY-ALBUM|service_route/minigameAct|etf → etf|pb_homeland_album_role||
|110403|req_furniture_suit_award|PLAY-ALBUM|service_route/minigameAct|etf → etf|pb_res_to_client||
|110501|req_hero_sign_act_award|ACT-HEROSIGNACT|service_route/actReward|protobuf → etf/pb_hero_sign_act_req|pb_hero_sign_act_rev_back|request_encoding_mismatch|
|110601|req_free_privilege_act_activate|PAY-FREEPRIVILEGEACT|service_route/freePrivilegeAct|etf → unverified|pb_free_privilege_act_activate_back|request_encoding_unverified|
|110602|req_free_privilege_act_activate_month|PAY-FREEPRIVILEGEACT|service_route/freePrivilegeAct|etf → unverified|pb_free_privilege_act_activate_month_back|request_encoding_unverified|
|110701|req_enjoy_blessing_act_shake|ACT-ENJOYBLESSINGACT|service_route/actReward|etf → etf|pb_enjoy_blessing_act_shake_back||
|110801|req_slot_game_act_go|PAY-SLOTGAMEACT|service_route/slotGameAct|protobuf → etf/pb_slot_game_act_go_req|pb_slot_game_act_role_data|request_encoding_mismatch|
|110802|req_slot_game_act_get|PAY-SLOTGAMEACT|service_route/slotGameAct|protobuf → etf/pb_slot_game_act_draw_req|pb_slot_game_act_draw_rsp|request_encoding_mismatch|
|110901|req_questionnaire_finish|ACT-QUESTIONNAIRE|service_route/actReward|protobuf → etf/pb_questionnaire_finish_req|pb_questionnaire_finish_rsp|request_encoding_mismatch|
|110904|req_homeland_task_award|PLAY-HOMELAND|service_route/minigameAct|etf → etf|pb_homeland_task_finish_rsp||
|110905|req_homeland_familiar_list|PLAY-HOMELAND|service_route/minigameAct|etf → etf|pb_homeland_familiar_info_rsp||
|110906|req_homeland_visit_list|PLAY-HOMELAND|service_route/minigameAct|etf → etf|pb_homeland_visit_record_list_rsp||
|110907|req_homeland_visit|PLAY-HOMELAND|service_route/minigameAct|etf → etf|pb_homeland_visit_record_rsp||
|110908|req_homeland_like|PLAY-HOMELAND|service_route/minigameAct|etf → etf|pb_homeland_like_rsp||
|110911|req_homeland_level_up|PLAY-HOMELAND|service_route/minigameAct|etf → etf|pb_homeland_level_up_rsp||
|110912|req_homeland_clean_room|PLAY-HOMELAND|service_route/minigameAct|etf → etf|—|response_schema_missing|
|110913|req_homeland_replace|PLAY-HOMELAND|service_route/minigameAct|protobuf → etf/pb_homeland_replace_req|pb_homeland_depot|request_encoding_mismatch|
|111001|req_baking_rec_lv_award|PLAY-BAKINGACT|service_route/minigameAct|protobuf → etf/pb_baking_rec_lv_award_req|pb_baking_rec_lv_award_rsp|request_encoding_mismatch|
|111002|req_baking_swap|PLAY-BAKINGACT|service_route/minigameAct|protobuf → etf/pb_baking_swap_req|pb_baking_swap_rsp|request_encoding_mismatch|
|111003|req_baking_synthesize|PLAY-BAKINGACT|service_route/minigameAct|protobuf → etf/pb_baking_synthesize_req|pb_baking_synthesize_rsp|request_encoding_mismatch|
|111004|req_baking_batch_synthesize|PLAY-BAKINGACT|service_route/minigameAct|protobuf → etf/pb_baking_batch_synthesize_req|pb_baking_batch_synthesize_rsp|request_encoding_mismatch|
|111005|req_baking_make_cake|PLAY-BAKINGACT|service_route/minigameAct|protobuf → etf/pb_baking_make_cake_req|pb_baking_make_cake_rsp|request_encoding_mismatch|
|111006|req_baking_give_up_order|PLAY-BAKINGACT|service_route/minigameAct|protobuf → etf/pb_baking_give_up_order_req|pb_baking_give_up_order_rsp|request_encoding_mismatch|
|111007|req_baking_use_item|PLAY-BAKINGACT|service_route/minigameAct|protobuf → etf/pb_baking_use_item_req|pb_baking_use_item_rsp|request_encoding_mismatch|
|111008|req_baking_use_cheat_item|PLAY-BAKINGACT|service_route/minigameAct|protobuf → etf/pb_baking_use_cheat_item_req|pb_baking_use_cheat_item_rsp|request_encoding_mismatch|
|111009|req_baking_yeast_click|PLAY-BAKINGACT|service_route/minigameAct|protobuf → etf/pb_baking_yeast_click_req|pb_baking_yeast_click_rsp|request_encoding_mismatch|
|111010|req_get_act_data|PLAY-BAKINGACT|service_route/minigameAct|protobuf → etf/pb_baking_get_new_act_data_req|pb_baking_get_new_act_data_rsp|request_encoding_mismatch|
|111011|req_baking_handle_event|PLAY-BAKINGACT|service_route/minigameAct|protobuf → etf/pb_baking_handle_event_req|pb_baking_handle_event_rsp|request_encoding_mismatch|
|111012|req_baking_submit_order|PLAY-BAKINGACT|service_route/minigameAct|protobuf → etf/pb_baking_submit_order_req|pb_baking_submit_order_rsp|request_encoding_mismatch|
|111013|req_baking_refresh_time_limit_order|PLAY-BAKINGACT|service_route/minigameAct|protobuf → etf/pb_baking_refresh_time_limit_order_req|pb_baking_refresh_time_limit_order_rsp|request_encoding_mismatch|
|111014|req_baking_one_key_sort|PLAY-BAKINGACT|service_route/minigameAct|protobuf → etf/pb_baking_one_key_sort_req|pb_baking_one_key_sort_rsp|request_encoding_mismatch|
|111015|req_baking_select_batch_synthesize_model|PLAY-BAKINGACT|service_route/minigameAct|protobuf → etf/pb_baking_select_batch_synthesize_model_req|pb_baking_select_batch_synthesize_model_rsp|request_encoding_mismatch|
|112001|req_battle_tri_match_hero_up_lv|BATTLE-BATTLETRIMATCHHERO|service_route/triMatch|protobuf → conditional/pb_battle_tri_match_hero_up_lv_req|pb_battle_tri_match_hero_up_lv_rsp|request_encoding_unverified|
|112002|req_battle_tri_match_hero_up_star|BATTLE-BATTLETRIMATCHHERO|service_route/triMatch|protobuf → conditional/pb_battle_tri_match_hero_up_star_req|pb_battle_tri_match_hero_up_star_rsp|request_encoding_unverified|
|113001|req_battle_tri_match_equip_up|BATTLE-BATTLETRIMATCHEQUIP|service_route/triMatch|protobuf → conditional/pb_battle_tri_match_equip_up_req|pb_battle_tri_match_equip_up_rsp|request_encoding_unverified|
|113002|req_battle_tri_match_equip_swap|BATTLE-BATTLETRIMATCHEQUIP|service_route/triMatch|protobuf → conditional/pb_battle_tri_match_equip_swap_req|pb_battle_tri_match_equip_swap_rsp|request_encoding_unverified|
|113003|req_battle_tri_match_equip_multiple_up|BATTLE-BATTLETRIMATCHEQUIP|service_route/triMatch|protobuf → conditional/pb_battle_tri_match_equip_multiple_up_req|pb_battle_tri_match_equip_multiple_up_rsp|request_encoding_unverified|
|114001|req_battle_tri_match_lineup_add|BATTLE-BATTLETRIMATCHLINEUP|service_route/triMatch|protobuf → conditional/pb_battle_tri_match_lineup_add_req|pb_battle_tri_match_lineup_add_rsp|request_encoding_unverified|
|114002|req_battle_tri_match_lineup_edit|BATTLE-BATTLETRIMATCHLINEUP|service_route/triMatch|protobuf → conditional/pb_battle_tri_match_lineup_edit_req|pb_battle_tri_match_lineup_edit_rsp|request_encoding_unverified|
|114003|req_battle_tri_match_lineup_set_name|BATTLE-BATTLETRIMATCHLINEUP|service_route/triMatch|protobuf → conditional/pb_battle_tri_match_lineup_set_name_req|pb_battle_tri_match_lineup_set_name_rsp|request_encoding_unverified|
|114004|req_battle_tri_match_lineup_delete|BATTLE-BATTLETRIMATCHLINEUP|service_route/triMatch|protobuf → conditional/pb_battle_tri_match_lineup_delete_req|pb_battle_tri_match_lineup_delete_rsp|request_encoding_unverified|
|114005|req_battle_tri_match_edit_playing_lineup|BATTLE-BATTLETRIMATCHLINEUP|service_route/triMatch|protobuf → conditional/pb_battle_tri_match_edit_playing_lineup_req|pb_battle_tri_match_edit_playing_lineup_rsp|request_encoding_unverified|
|115001|req_triple_match_fight|BATTLE-TRIPLEMATCHFIGHT|service_route/triMatchFight|protobuf → conditional/pb_triple_match_fight_request|pb_triple_match_fight_response|request_encoding_unverified|
|115002|triple_match_fight_swap|BATTLE-TRIPLEMATCHFIGHT|service_route/triMatchFight|protobuf → conditional/pb_triple_match_fight_swap_tile_req|—|response_schema_missing, request_encoding_unverified|
|115003|triple_match_fight_retry|BATTLE-TRIPLEMATCHFIGHT|service_route/triMatchFight|etf → conditional|pb_triple_match_fight_response|request_encoding_unverified|
|115004|triple_match_fight_ready|BATTLE-TRIPLEMATCHFIGHT|service_route/triMatchFight|protobuf → conditional/pb_triple_match_fight_ready_req|pb_triple_match_fight_ready_rsp|request_encoding_unverified|
|115005|triple_match_fight_giveup|BATTLE-TRIPLEMATCHFIGHT|service_route/triMatchFight|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|115006|triple_match_fight_get_record|BATTLE-TRIPLEMATCHFIGHT|service_route/triMatchFight|etf → conditional|pb_triple_match_fight_report|request_encoding_unverified|
|116001|req_help_up_task_reward|PLAY-HELPUPACT|service_route/activityRead|protobuf → etf/pb_help_up_task_reward_req|pb_help_up_task_reward_rsp|request_encoding_mismatch|
|116002|req_help_up_stage_award|PLAY-HELPUPACT|service_route/activityRead|protobuf → etf/pb_help_up_stage_award_req|pb_help_up_stage_award_rsp|request_encoding_mismatch|
|116003|req_help_up_help|PLAY-HELPUPACT|service_route/activityRead|protobuf → etf/pb_help_up_help_req|pb_help_up_help_rsp|request_encoding_mismatch|
|116004|req_help_up_get_times|PLAY-HELPUPACT|service_route/activityRead|protobuf → etf/pb_help_up_get_times_req|pb_help_up_get_times_rsp|request_encoding_mismatch|
|117001|req_hundred_act_draw|DRAW-HUNDREDDRAWACT|service_route/hundredDraw|protobuf → etf/pb_hundred_act_draw_req|pb_hundred_act_draw_rsp|request_encoding_mismatch|
|117002|req_hundred_act_receive_process_award|DRAW-HUNDREDDRAWACT|service_route/hundredDraw|protobuf → etf/pb_hundred_act_receive_process_award_req|pb_hundred_act_receive_process_award_rsp|request_encoding_mismatch|
|117003|req_hundred_draw_act_select_award|DRAW-HUNDREDDRAWACT|service_route/hundredDraw|protobuf → etf/pb_hundred_draw_act_select_award_req|pb_hundred_draw_act_select_award_rsp|request_encoding_mismatch|
|117004|req_hundred_draw_act_rec_star_award|DRAW-HUNDREDDRAWACT|service_route/hundredDraw|protobuf → etf/pb_hundred_draw_act_rec_star_award_req|pb_hundred_draw_act_rec_star_award_rsp|request_encoding_mismatch|
|117005|req_hundred_draw_act_marquee|DRAW-HUNDREDDRAWACT|service_route/hundredDraw|protobuf → etf/pb_hundred_draw_act_marquee_req|pb_hundred_draw_act_marquee_rsp|request_encoding_mismatch|
|118001|req_anniversary_banquet_act_task_award|ACT-ANNIVERSARYBANQUETACT|service_route/actReward|protobuf → etf/pb_anniversary_banquet_act_task_award_req|pb_anniversary_banquet_act_task_award_rsp|request_encoding_mismatch|
|118002|req_anniversary_banquet_act_process_award|ACT-ANNIVERSARYBANQUETACT|service_route/actReward|protobuf → etf/pb_anniversary_banquet_act_process_award_req|pb_anniversary_banquet_act_process_award_rsp|request_encoding_mismatch|
|119001|req_tri_match_tower_rec_process_award|BATTLE-TRIMATCHTOWER|service_route/triMatchTower|protobuf → conditional/pb_tri_match_tower_rec_process_award_req|pb_tri_match_tower_rec_process_award_rsp|request_encoding_unverified|
|119002|req_tri_match_tower_recover_stamina|BATTLE-TRIMATCHTOWER|service_route/triMatchTower|protobuf → conditional/pb_tri_match_tower_recover_stamina_req|pb_tri_match_tower_recover_stamina_rsp|request_encoding_unverified|
|119003|req_tri_match_tower_act_get_pass|BATTLE-TRIMATCHTOWER|service_route/triMatchTower|protobuf → conditional/pb_tri_match_tower_act_get_pass_req|pb_tri_match_tower_act_get_pass_rsp|request_encoding_unverified|
|120001|req_overall_match_start|BATTLE-OVERALLMATCH|service_route/overallMatch|protobuf → conditional/pb_overall_match_start_req|pb_overall_match_start_rsp|request_encoding_unverified|
|121001|req_tri_match_pvp_rec_task_award|BATTLE-TRIMATCHPVP|service_route/triMatchPvp|protobuf → conditional/pb_tri_match_pvp_rec_task_award_req|pb_tri_match_pvp_rec_task_award_rsp|request_encoding_unverified|
|121002|req_tri_match_pvp_rec_grade_award|BATTLE-TRIMATCHPVP|service_route/triMatchPvp|protobuf → conditional/pb_tri_match_pvp_rec_grade_award_req|pb_tri_match_pvp_rec_grade_award_rsp|request_encoding_unverified|
|121003|req_tri_match_pvp_get_report_list|BATTLE-TRIMATCHPVP|service_route/triMatchPvp|protobuf → conditional/pb_tri_match_pvp_get_report_list_req|pb_tri_match_pvp_get_report_list_rsp|request_encoding_unverified|
|121004|req_tri_match_pvp_rec_giveup|BATTLE-TRIMATCHPVP|service_route/triMatchPvp|etf → conditional|—|response_schema_missing, request_encoding_unverified|
|893289|req_guild_explore_boss_box_list|SOC-GUILDEXPLORE|service_route/guildActivity|etf → conditional|pb_guild_explore_get_boss_box_back|request_encoding_unverified|
|909101|login_dev_account|ROLE-LOGIN|gateway_route/gateway|protobuf → unverified/login_dev|—|response_schema_missing, request_encoding_unverified|
|909102|login_dev_roleid|ROLE-LOGIN|gateway_route/gateway|protobuf → unverified/login_dev|—|response_schema_missing, request_encoding_unverified|
|909103|login_sdk|ROLE-LOGIN|gateway_route/gateway|protobuf → conditional/login|—|response_schema_missing, request_encoding_unverified|
