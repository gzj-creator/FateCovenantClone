# SOC-FRIEND Evidence Checkpoint

Date: 2026-11-07. Evidence-only task; no service, schema, gateway, runtime data, APK, emulator or original server was modified or accessed. Read current root AGENTS.md, plan README, dispatch rules, SOC-FRIEND card and its inventory records. Applied the repository reverse-engineer-anything skill for shipped LuaJIT artifacts. This is static evidence, not APK acceptance.

## Recovered Local Evidence

The historical static-catalog `analysis/reports/private-client-16448/...` paths are absent from the current root. Existing extracted artifacts were found instead at:

`F:/projects/FateCovenantClone/.worktree/recruit-20261101/.scratch/out/luaproject/`

| File | Bytes | SHA256 |
| --- | ---: | --- |
| FriendMgr.lua | 30116 | 08a4f0a50905253f1131b3d81df9af65e210d67d90f622b5813120a02510c661 |
| FriendTable.data.lua | 2443 | 96d8b595b96ef9248905d0c6010fdff21118c2d6b01a138db3d10beb800eeee0 |
| FriendCmd.lua | 1995 | cfac61a76cf2e5f98be0ad0bb02cbde0e55a3f5620b91714a50159b6ecb768cb |

These `.lua` files contain LuaJIT bytecode, not decompiled source. The same directory has FriendTable.lua, FriendErr.lua, Friend.lua, FriendListForm.lua and the Friend/ChatFriend UI files. Core Port.lua is at sibling `../core/Port.lua`. This agent did not independently establish that the historical extraction belongs to the v9 APK. Preserve that provenance boundary when shipping assets.

Task inventory: types 20001-20013, `staticRecordId` values follow `tcp:c2s:<type>:<command-name>` (inventory.json lines 5394 onward). All thirteen requests are declared ETF. Response schemas match the SOC-FRIEND plan card and existing `personal-server/assets/protobuf/friend.net.proto.bin`; the DB structures are in friend.db.proto.bin.

## Recovery Commands

Inspection script: `agent/workflow/gameplay-completion/SOC-FRIEND/inspect-evidence.mjs`, also retained under `analysis/scratchpad/SOC-FRIEND/`. Its source paths intentionally point at existing root tools and historical extracted files. Run from the implementation worktree; generated output paths should remain in ignored analysis scratch space.

```powershell
node agent/workflow/gameplay-completion/SOC-FRIEND/inspect-evidence.mjs FriendTable.data.lua
node agent/workflow/gameplay-completion/SOC-FRIEND/inspect-evidence.mjs FriendMgr.lua __summary
node agent/workflow/gameplay-completion/SOC-FRIEND/inspect-evidence.mjs FriendMgr.lua __brief:2,32,34,36,55,84,85
node agent/workflow/gameplay-completion/SOC-FRIEND/inspect-evidence.mjs FriendMgr.lua __dump <absolute-output-json>
```

FriendTable uses unmodified `tools/luajit-bytecode-parse.mjs` and `readGeneratedDump` from `personal-server/config/hero-tables.mjs`. Serialize Maps with Object.fromEntries; plain JSON.stringify(Map) would misleadingly produce empty tables.

FriendMgr exposed pre-existing parser ambiguity: stock extract-battle-tables.mjs failed; the newer parser also erased all candidates when none equalled requiredUv. The inspection script adds constraints from actual constant uses: FNEW must reference a child, TDUP a table, string instructions strings. It retains exact required/header UV preference only when such a candidate exists and removes the minimum-UV fallback. The final result passes unique candidate selection and the original complete-root/EOF condition: 92 prototypes, root 91. Exploratory root-mismatch results were discarded. The raw parser library and all source artifacts remain unchanged.

Generated checkpoints in the implementation worktree:

`F:/projects/FateCovenantClone/.worktree/gameplay-20261106/soc-friend/analysis/scratchpad/SOC-FRIEND/`

- FriendTable.data.json: interpreted Limit, Param and Recommend tables.
- FriendMgr.parsed.json: complete parsed bytecode with instructions/constants/source prototype lines.
- inspect-evidence.mjs: repeatable inspection script.

No sensitive runtime payload was read or produced; these are static extraction derivatives. Generated JSON and historical artifacts remain local; the reproduction script is included in the checkpoint commit. JSON SHA256 values are recorded in implementation.md.

## Configuration Facts

| Role level (inclusive) | Max friends | Daily receive limit | daily_present_rewards |
| --- | ---: | ---: | --- |
| 1-49 | 60 | 30 | [[401900,300]] |
| 50-59 | 80 | 40 | [[401900,400]] |
| 60-69 | 90 | 50 | [[401900,500]] |
| 70-999 | 100 | 60 | [[401900,600]] |

Param[1] fields: max_apply_count=30; max_present_friendship_count=20; max_black_list_count=100; max_show_apply_count=99; recommend_count=5; recommend_lv_limit=10; max_search_count=5; recommend_reset_time=5; max_private_count=10; accuss_count=300; recommend_fight_life=604800; recommend_max_rank=10; friendship_exchange_ratio=100; present_exchange_ratio=10; present_rewards=[]; rev_rewards=[]. Keep the field spelling `accuss_count`.

FriendTable TID_FRIEND_PARAM=1; Recommend constants are GENRE=1, GUILD=2, FIGHT=3, RANK=4. Recommend rows contain name text IDs 19999,19996,19997,19998 respectively. FriendMgr root instructions 52-85 load Param[1] into MAX_APPLY_COUNT, MAX_PRESENT_COUNT, MAX_BLACKLIST_COUNT, RECOMMEND_RESET_TIME, MAX_PRIVATE_COUNT, FRIEND_DRAW_COVERT, FRIEND_DRAW_DAILY_COVERT, MAX_SHOW_APPLY_CNT. Separately CONST_MAX_RECOMMEND_COUNT is hardcoded 10, so do not silently replace it with Param.recommend_count=5.

These are actual table values. The trigger and meaning of daily_present_rewards, flower exchange and favors increments were not recovered. The presence of a reward field alone does not authorize inventing the server grant point or repeat rules. Both normal present_rewards and rev_rewards are empty in this extraction.

## Manager and Payload Facts

References below are original chunk prototype source lines, not physical lines in the bytecode carrier.

| Type | Manager prototype / source line | Proven parameter handling |
| --- | --- | --- |
| 20001 | 19 / 225 | R0 is iterated/filtered as role-ID array, then passed directly to req_apply_friends. |
| 20002 | 21 / 313 | R0 checked by ContainsFriend and passed directly; scalar role-ID handling is supported. |
| 20003 | 23 / 337 | R0 copied with ipairs, filtered as role-ID array, then passed directly. |
| 20004 | 25 / 382 | R0 passed directly; consumer shape still needs UI verification. |
| 20005 | 27 / 394 | R0 checked by blacklist membership and passed directly; scalar role-ID handling is supported. |
| 20006 | 29 / 432 | R0 checked by blacklist membership and passed directly; scalar role-ID handling is supported. |
| 20007 | 32 / 450 | R0 traversed with ipairs and compared to present_today, then passed directly: role-ID list. |
| 20008 | 34 / 506 | R0 passed directly after receive-limit check; list/scalar shape not yet independently checked. |
| 20009 | 44 / 688 | R0 may be string; tonumber conversion used where successful, then directly passed. |
| 20010 | 48 / 712 | New empty Lua table passed. Successful callback starts RECOMMEND_RESET_TIME local countdown. |
| 20011 | 36 / 527 | New two-element Lua array [presentIds,receiveIds] passed. No tuple constructor. |
| 20012 | 50 / 758 | R0 passed directly; caller list shape not yet checked. |
| 20013 | 51 / 770 | R0 passed directly; report semantics/caller shape unknown. |

20011 alternate client functions: prototype39/source607 sends [presentIds,[]]; prototype41/source646 sends [[],receiveIds]. Combined and single-side paths all process res_friendship_change; normal combined callback updates friendship, parses res through AwardKit and updates each friend_list entry. This proves the two sides/order. Existing client ETF array convention maps these arrays to proper lists.

LoginParse prototype2/source64 calls DecodePB("res_friend_login", R1), consumes friend_data.applies, blacklist, friend_list and friendship_data. It rebuilds Friend objects via InitByData. The actual numeric login module ID/slot was not located before checkpoint; do not guess it from DataMgr.GetData("FriendMgr"), which is a string storage key.

Friendship reset: prototype84/source1125 obtains FlushTime.NowDay(), compares to friendshipInfo.day, calls ResetFriendship on inequality and refreshes events. Prototype85/source1137 sets present_today=[], to_receive_today=[], received_count_today=0, day=argument. It does not clear received_today or flower in this client method. LoginParse repeats the day comparison. FlushTime.NowDay epoch/timezone definition remains unknown; do not substitute YYYYMMDD or UTC days without its source.

Push static catalog already declares 2200 res_friend_append, 2201 res_friend_reduce, 2202 res_friend_apply_append and 2203 res_friendship_change, mapped to corresponding FriendMgr methods. Their runtime use is unverified. The exact ETF payload for 2203 is additionally evidenced by FriendMgr prototype55/source820: element1 is DecodePB("pb_friendship"), element2 DecodePB("pb_friend_data"), then UpdateFriend. It is not the same outer protobuf as the command response res_friendship_change. The other push shapes still need focused checks.

## Remaining Evidence Gaps

- Numeric login module ID/slot and actual push serialization/wire acceptance.
- FlushTime.NowDay definition and server day boundary.
- Exact 20004, 20008, 20012 and 20013 UI caller shapes and report semantics.
- daily_present_rewards grant trigger, any first-gift policy, friendship item identity, flower persistence policy and favors delta.
- Recommendation filtering/ranking rules beyond configuration and local cooldown.
- Original server failure codes, cross-role notification timing and unavailable-role policies.
- Historical extraction pairing with the current v9 APK and real isolated-client acceptance.

Stop point requested by root for session handoff. No further broad scanning or implementation was performed.
