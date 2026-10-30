# Static Interface Evidence

Generated from candidate APK artifacts on 2026-10-25. Static declaration counts are not runtime acceptance.

| Measure | Count |
| --- | ---: |
| c2sDeclarations | 1407 |
| pushDeclarations | 307 |
| httpDeclarations | 28 |
| c2sUniqueWireTypes | 1407 |
| pushUniqueWireTypes | 307 |
| c2sExplicitResponseSchemas | 1189 |
| pushExplicitSchemas | 262 |
| c2sResolvedResponseSchemas | 1184 |
| pushResolvedSchemas | 253 |
| unresolvedDeclaredSchemas | 14 |
| requestEncodingRecovered | 1405 |
| requestProtobufRecovered | 569 |
| requestEtfRecovered | 836 |
| requestUnknown | 2 |
| pushHandlersLinked | 297 |
| requestControlFlowUnresolved | 0 |
| commandModules | 303 |
| parsedCommandModules | 303 |
| schemaTextAssets | 656 |
| schemaTypes | 3633 |
| schemaParseErrors | 0 |
| observed | 0 |
| decoded | 0 |
| actionVerified | 0 |

## Sources

- APK: `analysis/apk/device-pull-16448/com.jzyx.my/base.apk`; SHA-256 `b724dfbaa5687ebbfc9ce1b930e9bd88ca74f9b6afc3838d1e20acf66cd8ba5e`; package `com.jzyx.my`, version `1.55.090365` / `362155`.
- Cmd decoded identity: `analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_core.bundle/bytecode/Cmd.lua.json`; SHA-256 `2bc60172a49d2f906ceaaaba9260581a253a5094bed5a5a28130a237fb453239`.
- Cmd original TextAsset: `analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_core.bundle/textassets/14598954643145832000-Cmd.lua.bin`; SHA-256 `36ebc52059977de944da4f57ab15ce0238acb360e07fc976dd68f4f73d4453c8`.
- Port identity: `analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_core.bundle/bytecode/Port.lua.json`; SHA-256 `d132d842368242a03602127a015c82dc14537d1d23774744368aa9980e283ab5`.
- Connection identity: `analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_core.bundle/bytecode/Connection.lua.json`; SHA-256 `9245073190a0f60cb036a4a951e643f90f6dee68bed12fcdfa2132912bf66868`.
- Additional SDK HTTP method evidence: `analysis/reports/private-client-16448/android-login/classes6.dex.sdk-methods.json`; SHA-256 `842ddd53fa2e1ec261f3719456be6ef24e25c54a69bad706e781aa370e0679f4`.
- Existing LuaJIT parser: `analysis/tools/inspect-lua-bytecode.mjs`; SHA-256 `b9290b5d19de322fbb2cce296ac4b9414a989f81febda9c78d306c3744cff358`. Only its parser definition is loaded, without its broad export workflow.

## Interpretation

The wire-ID tables are Cmd.c2s_index (constant 6) and Cmd.s2c_index (constant 3). Cmd.c2s_switch is not a wire-ID table. Requests use pb_c2s with sint32/ZigZag type; replies and pushes use pb_s2c. Replies are associated by nonzero seq; seq=0 selects push dispatch.

Cmd.c2s_back (constant 10) and Cmd.s2c (constant 8) provide explicit protobuf response/push schemas. An absent Cmd schema entry selects the evidenced Connection._DecodeMsg ETF fallback; its per-command ETF shape remains unknown. A declared schema name with a missing message definition does not establish ETF fallback. Each request encoder mapping includes the original TextAsset hash, prototype, return and encoding instruction offsets. CALL with open results and RETM are tracked to the first encoded payload return. All recovered request function bodies are straight-line; control-flow alternatives would remain unknown. The bounded symbolic trace does not prove command invocation. Multiple or unknown alternatives stay unknown. staticInputShape describes the Lua value passed to the serializer and is not an observed ETF tuple/list shape. Input-register labels are symbolic slots, not recovered parameter names.

Port is an alternating array of command names and handler closures. Connection prototype 25 maps Cmd.s2c_index wire types to name slots; prototype 23 dispatches the adjacent closure. Numeric Port slots are not wire types. 297 static handler references are linked; the other 10 declared pushes have no entry in this scoped Port table. Handler call sites are static references, not executions.

Module groups are inferred from command names for navigation. Configuration declarations do not prove a currently selected endpoint. HTTP inventory is bounded to the recovered SDK service route inventory, SDK tracker and payment call chains, four server-list methods, two SDK skin patterns and two startup config paths. Payment order has two static callers (native/H5), not two separate method/path entries; neither is triggered by this analysis. Other SDKs, updater download paths and dynamically constructed URLs may exist beyond this static scope. The Cmd declaration counts exclude transport controls such as type=-1 heartbeat and the gateway handshake.

## Remaining Static Gaps

Request encoders remain unknown for `gm_cmd`, `req_beat_gopher`. The latter has conflicting ETF and protobuf Cmd definitions, both retained as candidates.

All 656 recovered proto files parse and resolve internally, but 14 schema names declared by Cmd have no recovered message definition. Declared schema counts must not be described as available schema counts.

| Direction | Command | Missing Message |
| --- | --- | --- |
| c2s | `req_red_envelope_info` | `pb_client_red_envelope` |
| c2s | `req_guild_red_envelop_show_log` | `pb_guild_red_envelope_fetch_log` |
| c2s | `req_leader_equip_recast` | `pb_leader_equip_recast_back` |
| c2s | `req_destiny_pve_fight` | `pb_destiny_pve_fight_rsq` |
| c2s | `req_guild_crusade_get_rank` | `pb_guild_crusade_rank_rsp` |
| s2c-push | `rev_monthly_activity_all_info` | `monthly_activity_all_info` |
| s2c-push | `rev_monthly_activity_info` | `monthly_activity_info` |
| s2c-push | `rev_init_intelli_info` | `intelli_info` |
| s2c-push | `rev_preach_unlock_update` | `pb_preach_up_player_or_vip_level_back` |
| s2c-push | `rev_preach_get_power` | `pb_preach_get_power_heroes` |
| s2c-push | `rev_pit_lord_info` | `pb_pit_lord_info` |
| s2c-push | `rev_play_match_changed` | `pb_play_match_changed` |
| s2c-push | `rev_play_room_changed` | `pb_play_room_changed` |
| s2c-push | `rev_triple_match_fight_takeover_notify` | `pb_triple_match_fight_takeover_notify` |

The 10 pushes without scoped Port handlers are `rev_guild_notice_mail`, `rev_privilege_switch`, `rev_guild_trial_notice`, `rev_martial_club_employ_info`, `rev_guild_gvg_team_change`, `rev_guild_gvg_team_node_change`, `rev_guild_nation_guild_tech_progress`, `rev_guild_nation_guild_delete_assist`, `rev_guild_nation_guild_repair_base`, `rev_guild_hunt_day_change_push`. A declaration without this table entry is not proof the push is unused.

## Reproduce

`node analysis/tools/protocol/build-static-catalog.mjs`

The generator reads shipped-artifact exports and writes only static-* catalog files. It does not access devices, send network traffic, execute Lua or inspect raw credential logs. Source schema fields and hashes are in static-schemas.json; module parse failures are in static-analysis-details.json. Dynamic observed/decoded/actionVerified flags are false for every entry.
