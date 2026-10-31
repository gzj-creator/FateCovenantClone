# Elite Battle Evidence

## Config table locations
- EliteMissionTable Lua bytecode: analysis/reports/.../2341162684679927300-EliteMissionTable.lua.bin (Boss, EliteMission, Box, Base, Chapter, Stage, Difficulty* tables).
- EliteMissionTable.data.lua: analysis/reports/.../9014539033727562000-EliteMissionTable.data.lua.bin.

## Schema definitions
- pb_elite_mission_req: mission_id (uint64), boss_id (int32).
- pb_elite_mission_back: mission_info (pb_elite_mission), res (pb_res_to_client), is_boss (bool), boss_tid (uint64).
- pb_elite_mission_box_award_req: box_id_list (repeated uint32), common_task_id_list (repeated uint32).
- pb_elite_mission_box_award_back: res_change, mission_info, common_task.
- pb_elite_mission: mission_id (uint64), boss_bin (bytes), box_award_bin (bytes), difficulty (pb_mission_difficulty).

## Login module evidence
- Module 140 = EliteMissionMgr, delivered in login modules list. On captured account it is an empty ETF value (bits=8), decoded as empty bytes -> empty pb_elite_mission.
