# Server Pushes

Snapshot: 2026-10-25T12:03:39.660Z. Status describes immediate payloads; see [coverage](coverage.md) for limits.

O=observed, D=decoded, A=user operation verified, S=static only. Full schemas, shapes, seq and packet references: [interfaces.json](interfaces.json).

## activities

| Interface | Request | Response | Status | Evidence |
| --- | --- | --- | --- | --- |
| 2701 rev_monthly_activity_all_info | - | monthly_activity_all_info | S | - |
| 2702 rev_monthly_activity_info | - | monthly_activity_info | S | - |
| 3301 rev_activity_state_change | - | pb_act_state_change_back | S | - |
| 3302 rev_activity_pause_data | - | pb_act_pause | S | - |
| 3303 rev_activity_custom_data | - | pb_act_custom_push | S | - |
| 3304 rev_act_frame_stage | - | pb_act_frame_stage_push | S | - |
| 5500 rev_arena_contest_act_data_changed | - | pb_arena_contest_act | S | - |
| 6331 rev_martial_act_first_pass | - | pb_role_martial_club_act_pass | S | - |
| 9160 rev_demigod_act_draw_update | - | pb_demigod_act_draw_back | S | - |
| 9195 rev_top_arena_activity_changed | - | pb_top_arena_activity | S | - |
| 9400 rev_act_draw_update | - | pb_act_draw_data | S | - |
| 10001 rev_summer_act_active_skin | - | pb_summer_wg_universal_back | S | - |
| 10002 rev_summer_act_active_gun | - | pb_summer_wg_universal_back | S | - |
| 10201 rev_five_day_boss_act_update_rank | - | pb_five_day_boss_act_server_data | S | - |
| 10701 rev_new_permit_update_act_info | - | pb_new_permit_act_info | S | - |
| 10801 rev_triple_match_update_act_info | - | pb_triple_match_update_info | S | - |
| 10901 rev_subscription_act_state_changed | - | pb_subscription_act_state_changed | S | - |
| 11001 rev_vickrey_auction_update_act_info | - | pb_vickrey_auction_update_info | S | - |
| 11401 rev_diamond_vein_act_map_move | - | pb_diamond_vein_act_role_map_change | S | - |
| 11402 rev_diamond_vein_act_action_change | - | pb_diamond_vein_act_action_change | S | - |
| 11403 rev_diamond_vein_act_same_map_role_change | - | pb_diamond_vein_act_same_map_role_data_change | S | - |
| 11404 rev_diamond_vein_act_focus_map | - | pb_diamond_vein_act_base_req | S | - |
| 11405 rev_diamond_vein_act_high_rate | - | pb_diamond_vein_act_role_high_rate_change | S | - |
| 11406 rev_diamond_vein_act_push_role_data | - | pb_diamond_vein_act_role_data_rsp | S | - |
| 11501 rev_fishing_act_bug_rod | - | pb_fishing_act_bug_rod_rsp | S | - |
| 11601 rev_enjoy_blessing_act_info | - | pb_enjoy_blessing_act_role_info | S | - |
| 11701 rev_homeland_update_act_info | - | pb_homeland_act_role_data | S | - |
| 11802 rev_home_puzzle_act_update_act_data | - | pb_home_puzzle_act_data | S | - |

## battle

| Interface | Request | Response | Status | Evidence |
| --- | --- | --- | --- | --- |
| 5502 rev_arena_contest_fight_cal_over | - | etf-fallback | S | - |
| 6202 rev_martial_club_team_fight | - | pb_martial_club_team_fight_rsp | S | - |
| 7101 rev_match_pvp_fought | - | pb_match_pvp_fought | S | - |
| 7501 rev_hundred_bonus_open_mission | - | etf-fallback | S | - |
| 8002 rev_guild_duel_fight | - | pb_guild_duel_fight_push | S | - |
| 8801 rev_mission_boss_pass_item | - | pb_mission_boss_pass_item | S | - |
| 9031 rev_guild_gvg_hold_fight | - | pb_guild_gvg_hold_fight_result | S | - |
| 9032 rev_guild_gvg_hold_pvp | - | pb_guild_gvg_hold_pvp_result | S | - |
| 9111 rev_camp_tower_first_pass | - | pb_put_camp_tower_first_pass | S | - |
| 9141 rev_tower_defense_change | - | pb_tower_defense | S | - |
| 9142 rev_tower_defense_version_refresh | - | pb_tower_defense_award_rsp | S | - |
| 9193 rev_top_arena_fight_changed | - | pb_top_arena_fight_push_rsp | S | - |
| 9196 rev_top_arena_tower_pass_changed | - | pb_top_arena_tower_pass | S | - |
| 9257 rev_guild_nation_stronghold_battle_achievement | - | pb_res_to_client | S | - |
| 9500 rev_overall_pvp_prelims_fight_result | - | pb_overall_pvp_prelims_fight_back | S | - |
| 9501 rev_overall_pvp_elms_group_change | - | pb_overall_pvp_elms_group_change_push | S | - |
| 9502 rev_overall_pvp_elms_enter_final | - | etf-fallback | S | - |
| 9503 rev_overall_pvp_elms_fight_down | - | pb_overall_pvp_elms_match_back | S | - |
| 9902 rev_guild_hunt_boss_fight_push | - | pb_guild_hunt_boss_fight_push | S | - |
| 9903 rev_guild_hunt_monster_fight_push | - | pb_guild_hunt_monster_fight_push | S | - |
| 10003 rev_summer_act_pvp_update | - | pb_summer_act_pvp_rank_update | S | - |
| 10004 rev_summer_act_pvp_challenge_fight | - | pb_summer_challenge_fight_back | S | - |
| 10005 rev_summer_act_pvp_server_update | - | pb_summer_challenge_fight_back | S | - |
| 10301 rev_destiny_pve_update_server_info | - | pb_destiny_pve_server | S | - |
| 11901 rev_triple_match_fight_swap_record | - | pb_triple_match_fight_swap_record | S | - |
| 11902 rev_triple_match_fight_settlement | - | pb_triple_match_fight_settlement | S | - |
| 11903 rev_triple_match_fight_takeover_notify | - | pb_triple_match_fight_takeover_notify | S | - |
| 12101 rev_tri_match_tower_act_data_change | - | pb_tri_match_tower_act_data | S | - |
| 121003 rev_tri_match_pvp_match_start | - | pb_tri_match_pvp_match_start_push | S | - |

## characters

| Interface | Request | Response | Status | Evidence |
| --- | --- | --- | --- | --- |
| 5050 rev_rent_hero_in | - | pb_req_rent_back | S | - |
| 5070 rev_lineup_snapshot_hero | - | pb_lineup_hero_server | S | - |
| 5170 rev_hero_draw_progress_award | - | pb_rev_draw_progress_award_back | S | - |
| 6601 rev_hero_lease_update | - | pb_lease_hero_change_notify | S | - |
| 9010 rev_cycle_new_hero_special | - | etf-fallback | S | - |
| 9401 rev_new_hero_exclusive_draw_data | - | pb_new_hero_exclusive_draw | S | - |
| 12002 rev_battle_tri_match_hero_change | - | pb_battle_tri_match_role_hero_data | S | - |

## lineup

| Interface | Request | Response | Status | Evidence |
| --- | --- | --- | --- | --- |
| 6501 rev_lineup_update | - | pb_lineup_update_rev | S | - |
| 12001 rev_battle_tri_match_auto_lineup | - | pb_battle_tri_match_role_lineup | S | - |

## login

| Interface | Request | Response | Status | Evidence |
| --- | --- | --- | --- | --- |
| 102 sync_login_queue | - | pb_queue_obj | S | - |
| 1402 res_msg_login | - | pb_res_msg_login | O D | recording:protocol-2026-10-25:game:tcp-65:s2c:18268 |
| 10601 rev_role_back_login_info | - | pb_rsp_role_back_login | S | - |

## other

| Interface | Request | Response | Status | Evidence |
| --- | --- | --- | --- | --- |
| 10 rev_gm_cmd | - | etf-fallback | S | - |
| 100 disconnect | - | pb_net_err | S | - |
| 101 alert_turn | - | pb_alert_turn | S | - |
| 300 rpc_switch_change | - | pb_switch_change_rev | S | - |
| 1001 rev_rank_change | - | rank_info | S | - |
| 1403 rev_delete_channel_msg | - | etf-fallback | S | - |
| 1404 rev_tips_msg | - | pb_notify_msg | S | - |
| 1620 rev_swap_arena_rank_change | - | pb_swap_arena_rank_chang_toc | S | - |
| 2000 rev_count_statistics_change | - | etf-fallback | O D | recording:protocol-2026-10-25:game:tcp-65:s2c:18209 |
| 2001 rev_max_progress_change | - | etf-fallback | S | - |
| 2401 cast_magic_draw_back | - | pb_magic_draw | S | - |
| 2602 rev_permit_buy_times | - | pb_permit_server | S | - |
| 2901 rev_init_intelli_info | - | intelli_info | S | - |
| 3003 rev_preach_unlock_update | - | pb_preach_up_player_or_vip_level_back | S | - |
| 3004 rev_preach_get_power | - | pb_preach_get_power_heroes | S | - |
| 3100 rev_lantern_msg | - | pb_lantern_info | S | - |
| 3101 rev_all_lantern_msg | - | pb_msg_range_list | S | - |
| 3701 rev_rob_info_red | - | etf-fallback | S | - |
| 4101 rev_realtime_map_add_node | - | pb_realtime_map_add_node_back | S | - |
| 4102 rev_realtime_map_remove_node | - | pb_realtime_map_remove_node_back | S | - |
| 4103 rev_realtime_map_node_move | - | pb_realtime_map_move_back_list | S | - |
| 4104 rev_realtime_map_update_nodes | - | pb_realtime_map_update_node_back_list | S | - |
| 4105 rev_realtime_map_clear | - | etf-fallback | S | - |
| 4106 rev_realtime_map_exit_map | - | etf-fallback | S | - |
| 4107 rev_realtime_map_role_state_change | - | pb_realtime_map_reenter_update | S | - |
| 4201 cross_generate | - | pb_cross_to_client | S | - |
| 4601 rev_player_supported | - | etf-fallback | S | - |
| 4701 notify_gift_add | - | pb_notify_gift_add | S | - |
| 4702 notify_gift_delete | - | pb_notify_gift_delete | S | - |
| 4711 force_role_rename | - | etf-fallback | S | - |
| 4721 add_vip_gift | - | pb_vip_gift | S | - |
| 4722 delete_vip_gift | - | etf-fallback | S | - |
| 5001 add_red_envelope | - | pb_client_red_envelopes | S | - |
| 5060 rev_role_figure_sample | - | pb_figure_simple_info | S | - |
| 5080 rev_auto_flush | - | pb_auto_flush_data | S | - |
| 5090 rev_privilege_switch | - | etf-fallback | S | - |
| 5120 rev_hook_init | - | pb_hook | S | - |
| 5140 rev_sprint_single_data | - | etf-fallback | S | - |
| 5201 relation_event | - | pb_relation_notify_event | S | - |
| 5202 relation_mark | - | etf-fallback | S | - |
| 5203 relation_un_mark | - | etf-fallback | S | - |
| 5501 rev_arena_contest_match_over | - | pb_arena_contest_match | S | - |
| 5503 rev_arena_contest_congratulate | - | etf-fallback | S | - |
| 5504 rev_arena_contest_auto_sign_up | - | pb_arena_contest_role | S | - |
| 5505 rev_arena_contest_guess_result | - | pb_arena_contest_guess | S | - |
| 5800 rev_hunter_arena_fought | - | pb_hunter_arena_fought | S | - |
| 6201 rev_martial_club_team_update | - | pb_martial_club_team | S | - |
| 6303 rev_martial_club_team_invite | - | pb_martial_club_team_invite_rev | S | - |
| 6332 rev_martial_club_give_up | - | etf-fallback | S | - |
| 6333 rev_martial_club_team_skip | - | etf-fallback | S | - |
| 6334 rev_martial_club_employ_info | - | pb_martial_club_employ_role | S | - |
| 6401 rev_realtime_challenge_win_count | - | pb_realtime_challenge_win_count | S | - |
| 6701 rev_recovery_privilege | - | pb_recovery_privilege_update | S | - |
| 6702 rev_treasure_hunt_refresh | - | pb_treasure_hunt_refresh_ret | S | - |
| 7001 rev_fantasy_draw_update | - | pb_fantasy_equip_act_draw | S | - |
| 7201 rev_fun_open_notify | - | res_notify_fun_open | O D | recording:protocol-2026-10-25:game:tcp-65:s2c:18303 |
| 7801 rev_time_tempe_draw_msg | - | pb_time_temple_draw | S | - |
| 7901 rev_assistant_rank_push | - | pb_assistant_rank_push | S | - |
| 8101 rev_radish_farm_help | - | pb_radish_farm_cell | S | - |
| 8401 rev_world_boss_atk | - | pb_world_boss_atk_push | S | - |
| 8402 rev_world_boss_refresh | - | pb_world_boss_refresh_push | S | - |
| 8403 rev_world_boss_reissue | - | pb_world_boss_receive_kill_back | S | - |
| 8601 rev_rank_achieve_update | - | pb_rank_achieve_rev | S | - |
| 8701 rev_raffle_ticket_draw_msg | - | pb_raffle_ticket | S | - |
| 8900 rev_submit_client_log | - | pb_res_submit_client_log | S | - |
| 9000 rev_account_subscribe_update | - | pb_account_subscribe | S | - |
| 9001 rev_pit_lord_info | - | pb_pit_lord_info | S | - |
| 9020 rev_energy_reissue | - | pb_princess_energy_supplement | S | - |
| 9101 rev_treasure_draw_msg | - | pb_treasure_draw | S | - |
| 9121 rev_hunter_arena_double | - | etf-fallback | S | - |
| 9131 rev_week_hunt_task_change | - | pb_week_hunt | O D | recording:protocol-2026-10-25:game:tcp-65:s2c:20933 |
| 9132 rev_wish_treasure_push | - | pb_wish_treasure_push | S | - |
| 9133 rev_ticket_draw_settle | - | pb_ticket_settle_back | S | - |
| 9134 rev_ticket_add_ticket | - | pb_ticket_draw_role | S | - |
| 9151 rev_put_vip_link_info | - | pb_show_vip_link | S | - |
| 9190 rev_top_arena_state_changed | - | pb_top_arena_state_changed | S | - |
| 9191 rev_top_arena_area_changed | - | pb_top_arena_area_changed | S | - |
| 9192 rev_top_arena_cross_changed | - | pb_top_arena_cross_changed | S | - |
| 9194 rev_top_arena_semi_data_changed | - | pb_top_arena_semi_data | S | - |
| 9197 rev_top_arena_help_point_stage | - | pb_top_arena_server_help_data | S | - |
| 9200 rev_slg_map_block_view | - | pb_slg_map_view_push | S | - |
| 9220 rev_play_match_changed | - | pb_play_match_changed | S | - |
| 9221 rev_play_room_changed | - | pb_play_room_changed | S | - |
| 9300 rev_pb_theme_treasure_server_step | - | etf-fallback | S | - |
| 9310 rev_stock_up_draw_msg | - | pb_stock_up_act_draw_data | S | - |
| 9504 rev_overall_final_enter | - | etf-fallback | S | - |
| 9611 rev_divine_embryo_draw_extra | - | pb_divine_embryo_draw_extra | S | - |
| 9801 rev_role_auction | - | pb_role_auction_list | S | - |
| 9802 rev_auction_state | - | pb_auction_login_info | S | - |
| 9803 rev_auction_rob | - | pb_auction_rob_push | S | - |
| 9804 rev_channel_entry | - | pb_channel_entry | S | - |
| 10101 rev_fantasy_draw_normal_update | - | pb_fantasy_draw | S | - |
| 10501 rev_spirit_courtyard_assist_entrust | - | pb_res_spirit_courtyard_publish_collaboration | S | - |
| 10502 rev_spirit_courtyard_update_role_info | - | pb_spirit_courtyard_role | S | - |

## progression

| Interface | Request | Response | Status | Evidence |
| --- | --- | --- | --- | --- |
| 7405 rev_guild_explore_build_up_lv | - | pb_guild_explore_build | S | - |
| 9170 rev_leader_equip_forge_msg | - | pb_leader_equip_forge_back | S | - |

## resources-and-rewards

| Interface | Request | Response | Status | Evidence |
| --- | --- | --- | --- | --- |
| 900 rev_new_mail | - | pb_rev_new_mail_info | S | - |
| 1400 res_new_msg | - | pb_res_new_msg | S | - |
| 1401 res_inc_msg_count | - | pb_res_inc_msg_count | S | - |
| 1900 res_recharge_success | - | res_recharge_success | S | - |
| 1901 res_vip_addition_reward | - | pb_res_to_client | S | - |
| 3202 res_to_client | - | pb_res_to_client | S | - |
| 3203 hide_res_to_client | - | pb_res_to_client | S | - |
| 3204 tips_res_to_client | - | pb_res_to_client | S | - |
| 4501 res_addition_change | - | pb_addition_change | S | - |
| 5141 rev_sprint_task_award_all_received | - | etf-fallback | S | - |
| 9701 rev_bonus_shop_item_change | - | pb_bonus_shop_person | S | - |
| 10401 rev_act_shop_refresh_goods | - | pb_act_shop_refresh_goods | S | - |

## social-and-guild

| Interface | Request | Response | Status | Evidence |
| --- | --- | --- | --- | --- |
| 1501 res_chat_ban_state_change | - | pb_chat_ban_state | S | - |
| 2200 res_friend_append | - | etf-fallback | S | - |
| 2201 res_friend_reduce | - | etf-fallback | S | - |
| 2202 res_friend_apply_append | - | etf-fallback | S | - |
| 2203 res_friendship_change | - | etf-fallback | S | - |
| 2300 res_guild_info_change | - | pb_res_guild_info | S | - |
| 2301 res_expelled_guild | - | etf-fallback | S | - |
| 2304 rev_guild_rename | - | pb_guild_rename_back | S | - |
| 2305 rev_guild_member_change | - | pb_res_guild_member_change | S | - |
| 2306 rev_guild_apply_change | - | pb_res_guild_apply_list_change | S | - |
| 2307 rev_guild_join | - | pb_guild_join_push | S | - |
| 2308 rev_guild_player_apply | - | pb_player_apply_guild | S | - |
| 2309 rev_guild_dissolve | - | pb_guild_dissolve_push | S | - |
| 2310 rev_guild_notice_mail | - | pb_guild_notice_mail_back | S | - |
| 2311 rev_guild_leader_trans | - | pb_guild_leader_auto_transfer | S | - |
| 4712 force_guild_rename | - | etf-fallback | S | - |
| 4713 reset_guild_notice | - | etf-fallback | S | - |
| 5180 sync_guild_red_envelope_add | - | pb_guild_red_envelope_add_sync | S | - |
| 5181 sync_guild_red_envelope_remove | - | pb_guild_red_envelope_info | S | - |
| 5182 sync_guild_red_envelope_create | - | pb_guild_red_envelope_create_sync | S | - |
| 5183 sync_guild_red_envelope_bullet_chat | - | pb_guild_red_envelope_bullet_chat | S | - |
| 5184 sync_guild_red_envelope_active_list | - | pb_guild_red_envelope_active_db | S | - |
| 5185 sync_guild_red_envelope_fetch | - | pb_guild_red_envelope_fetch_sync | S | - |
| 5190 rev_guild_trial_mon_score | - | pb_guild_trial_mon_score_toc | S | - |
| 5192 rev_guild_trial_notice | - | etf-fallback | S | - |
| 5193 rev_guild_trial_mate_get_treasure | - | pb_guild_trial_gain_box_push | S | - |
| 5194 rev_guild_trial_refresh | - | etf-fallback | S | - |
| 5195 guild_trial_help_push | - | pb_guild_trial_help_push | S | - |
| 5196 rev_guild_trial_thank_help | - | pb_guild_trial_read_help_log_rev | S | - |
| 6101 rev_guild_active_finish | - | pb_guild_active_finish | S | - |
| 6102 rev_guild_active_update | - | pb_guild_active_info | S | - |
| 6103 rev_guild_auto_dissolve_pre | - | pb_guild_auto_dissolve | S | - |
| 6104 rev_guild_auto_dissolve | - | pb_guild_auto_dissolve_role | S | - |
| 7401 rev_guild_explore_camp_update | - | pb_guild_explore_camp_sync | S | - |
| 7402 rev_guild_explore_wish_update | - | pb_guild_explore_wish_item_push | S | - |
| 7403 rev_guild_explore_game_update | - | pb_guild_explore_game_update | S | - |
| 7404 rev_guild_explore_game_delete | - | pb_guild_explore_game_delete | S | - |
| 7406 rev_guild_explore_wolf | - | pb_guild_explore_wolf | S | - |
| 7407 rev_guild_explore_boss | - | pb_guild_explore_boss | S | - |
| 7408 rev_guild_explore_person | - | pb_guild_explore_person | S | - |
| 7451 rev_guild_explore_trial_settle | - | pb_res_to_client | S | - |
| 7452 rev_guild_explore_trial_boss | - | pb_guild_explore_trial_boss | S | - |
| 7453 rev_guild_explore_trial_data | - | pb_guild_explore_trial | S | - |
| 7701 rev_guild_war_person | - | pb_guild_war_person | S | - |
| 7702 rev_guild_war_base_operate | - | pb_guild_war_merge_push | S | - |
| 7703 rev_guild_war_set_gather_loc | - | etf-fallback | S | - |
| 7704 rev_guild_war_guild | - | pb_guild_war_settle_push | S | - |
| 7705 rev_guild_war_act_data_changed | - | pb_guild_war_act_stage_change | S | - |
| 7706 rev_guild_war_guess | - | pb_guild_war_guess_push | S | - |
| 7707 rev_guild_war_be_kill | - | pb_guild_war_be_kill_push | S | - |
| 7708 rev_guild_war_msg | - | pb_guild_war_msg_push | S | - |
| 7709 rev_guild_war_set_gather_role | - | etf-fallback | S | - |
| 7710 rev_guild_war_reissue | - | pb_guild_war_reissue_push | S | - |
| 7711 rev_guild_war_host_member | - | pb_guild_war_host_back | S | - |
| 7712 rev_guild_war_host_team | - | pb_guild_war_host_team | S | - |
| 8001 rev_guild_duel_server | - | pb_guild_duel_server | S | - |
| 8003 rev_guild_duel_settle | - | pb_guild_duel_settle_push | S | - |
| 8004 rev_guild_duel_reset | - | pb_guild_duel_reset_push | S | - |
| 8005 rev_guild_duel_dissolve | - | etf-fallback | S | - |
| 8201 rev_guild_racing_buff_output | - | pb_guild_racing_r | S | - |
| 8202 rev_guild_racing_vote_evt_trigger | - | pb_guild_racing_event | S | - |
| 8203 rev_guild_racing_monster_evt_trigger | - | pb_guild_racing_monster_event_trigger | S | - |
| 8204 rev_guild_racing_attend | - | pb_guild_racing_attend_push | S | - |
| 8205 rev_guild_racing_support | - | pb_guild_racing_support_push | S | - |
| 8206 rev_guild_racing_buff_use_push | - | pb_guild_racing_buff_use_push | S | - |
| 8207 rev_guild_racing_buff_active_push | - | pb_guild_racing_buff_trigger | S | - |
| 8208 rev_guild_racing_arrive | - | pb_guild_racing_arrive_info | S | - |
| 8209 rev_guild_racing_vote_push | - | pb_guild_racing_vote_push | S | - |
| 8212 rev_guild_racing_vote_evt_active | - | pb_guild_racing_vote_event_active | S | - |
| 8213 rev_guild_racing_over | - | pb_guild_racing_over_info | S | - |
| 8214 rev_guild_racing_cross_time | - | pb_guild_racing_login | S | - |
| 8302 rev_guild_boss_auto_atk | - | pb_guild_boss_auto_atk_push | S | - |
| 8303 rev_guild_boss_settle | - | pb_guild_boss_settle_push | S | - |
| 8304 rev_guild_boss_stage_change | - | etf-fallback | S | - |
| 8305 rev_guild_boss_kill_settle | - | pb_guild_boss_settle_push | S | - |
| 8306 rev_guild_boss_use_skill | - | pb_res_use_skill_push | S | - |
| 8307 rev_guild_boss_cross | - | etf-fallback | S | - |
| 8501 rev_guild_joint_monster | - | pb_guild_joint_atk_monster_push | S | - |
| 8502 rev_guild_joint_auto_door | - | pb_guild_joint_door_push_l | S | - |
| 8503 rev_guild_joint_pioneer | - | pb_guild_j_pioneer_rsp | S | - |
| 8504 rev_guild_joint_focus | - | etf-fallback | S | - |
| 8505 rev_guild_joint_lode | - | pb_guild_joint_pick_lode_s2c_rsp | S | - |
| 8506 rev_guild_joint_door | - | pb_guild_joint_door_push | S | - |
| 9033 rev_guild_gvg_score_change | - | pb_guild_gvg_score_change | S | - |
| 9034 rev_guild_gvg_occupy_hold | - | pb_guild_gvg_occupy_hold | S | - |
| 9035 rev_guild_gvg_team_change | - | pb_guild_gvg_team_change | S | - |
| 9036 rev_guild_gvg_team_node_change | - | pb_guild_gvg_team_node_change | S | - |
| 9181 rev_guild_box_msg | - | pb_guild_pay_box | S | - |
| 9182 rev_guild_special_task_msg | - | pb_guild_active_finish | S | - |
| 9211 rev_guild_vote_changed | - | pb_guild_vote_info | S | - |
| 9230 rev_guild_nation_report_red_dot | - | pb_guild_nation_report_red_dot | S | - |
| 9231 rev_guild_nation_team_change | - | pb_guild_nation_team_state_update | S | - |
| 9232 rev_guild_nation_guild_tech_progress | - | pb_guild_nation_guild_technology_node | S | - |
| 9233 rev_guild_nation_guild_new_assist | - | pb_guild_nation_assist_list_back | S | - |
| 9234 rev_guild_nation_guild_delete_assist | - | pb_guild_nation_assist_list | S | - |
| 9236 rev_guild_nation_scout_change | - | pb_guild_nation_scout | S | - |
| 9237 rev_guild_nation_update_assist | - | pb_guild_nation_assist_result | S | - |
| 9238 rev_guild_nation_guild_tech_recommend | - | etf-fallback | S | - |
| 9239 rev_guild_nation_guild_tech_donation | - | pb_guild_nation_guild_technology_node | S | - |
| 9240 rev_guild_nation_role_base | - | pb_guild_nation_map_role_base | S | - |
| 9241 rev_guild_nation_monster_lv_limit | - | etf-fallback | S | - |
| 9242 rev_guild_nation_defense_build_change | - | pb_guild_nation_build_change_back | S | - |
| 9243 rev_guild_nation_task_stat_change | - | pb_guild_nation_count_statistics | S | - |
| 9244 rev_guild_nation_stronghold_capture_award | - | pb_guild_nation_stronghold_capture_change | S | - |
| 9245 rev_guild_nation_season_info_open | - | pb_guild_nation_season | S | - |
| 9246 rev_guild_nation_muster_call | - | pb_guild_nation_muster_info | S | - |
| 9247 rev_guild_nation_muster_answer | - | pb_guild_nation_muster_team_change | S | - |
| 9248 rev_guild_nation_muster_over | - | pb_guild_nation_muster_over | S | - |
| 9249 rev_guild_nation_remove_guild_flag | - | etf-fallback | S | - |
| 9250 rev_guild_nation_move_guild_base | - | pb_guild_nation_move_guild_base_rev | S | - |
| 9251 rev_guild_nation_guild_res_change | - | pb_guild_nation_guild_res_to_client | S | - |
| 9252 rev_guild_nation_stronghold_guild_change | - | pb_guild_nation_stronghold_guild | S | - |
| 9253 rev_guild_nation_stronghold_change | - | pb_guild_nation_all_stronghold_data | S | - |
| 9254 rev_guild_nation_guild_tech_up | - | pb_guild_nation_guild_tech_up_back | S | - |
| 9255 rev_guild_nation_guild_base_sub_hp | - | etf-fallback | S | - |
| 9256 rev_guild_nation_guild_repair_base | - | pb_guild_nation_repair_map_back | S | - |
| 9258 rev_guild_nation_stronghold_role_change | - | pb_guild_nation_stronghold_award_record | S | - |
| 9550 rev_guild_bargain_info_sync | - | pb_guild_bargain_guild | S | - |
| 9601 rev_guild_expedition_declare_push | - | pb_guild_expedition_declare_push | S | - |
| 9602 rev_guild_expedition_guild_info | - | pb_guild_expedition_guild | S | - |
| 9603 rev_guild_expedition_loss_pos | - | pb_guild_expedition_lose_pos | S | - |
| 9901 rev_guild_hunt_attend_support | - | pb_guild_hunt_attend_support_push | S | - |
| 9904 rev_guild_hunt_day_change_push | - | pb_guild_hunt_day_change_push | S | - |
| 11101 rev_guild_auction_bid_push | - | rsp_guild_auction_bid_push | S | - |
| 11102 rev_guild_auction_stage_change | - | rsp_guild_auction_stage_push | S | - |
| 11103 rev_guild_auction_role_info | - | rsp_guild_auction_role_bid_push | S | - |
| 11201 rev_dragon_land_guild_data_update | - | pb_dragon_land_guild_data | S | - |
| 11301 rev_guild_monopoly_buy_push | - | pb_monopoly_act_day_back | S | - |
| 11407 rev_diamond_vein_act_push_owner_guild | - | pb_diamond_vein_act_push_owner_guild | S | - |
| 11801 rev_home_puzzle_act_friend_request | - | etf-fallback | S | - |
