# Battle And Lineup Evidence

Offline checkpoint: 2026-10-25T10:49:31.102Z, 1903 packets. Source: `analysis/captures/protocol-2026-10-25/decoded.local-only.json`; safe packet/message index: [decode-summary.json](../../../analysis/captures/protocol-2026-10-25/decode-summary.json). Only structure, counts and equality results are published here. Instance IDs, account fields and raw payload values stay local.

## Correlation

All rows use game flow `tcp-65`. Request `seq` and response `requestId` match; response `type=0` is not the request command ID. The `game:tcp-65:` prefix below is omitted only to keep the table compact.

| Exchange | Type / Seq | Request Message Suffix / Packets | Response Message Suffix / Packets | Evidence Level |
| --- | --- | --- | --- | --- |
| Initial login | 909103 / 1 | See login report | `s2c:103` / 1200,1202,1204,1208,1210 | Initialization baseline |
| First fight start | 201 / 22 | `c2s:1317` / 1472,1474 | `s2c:18920` / 1476,1478,1480 | Observed; outer PB decoded |
| First settlement | 207 / 24 | `c2s:1345` / 1486,1488 | `s2c:21024` / 1490,1492 | Observed; outer PB decoded |
| Add lineup member | 209 / 37 | `c2s:1706` / 1787,1789 | `s2c:21413` / 1791,1793 | User operation verified |
| Second fight start | 201 / 40 | `c2s:1857` / 1854,1856 | `s2c:21839` / 1858 | User operation verified |
| Second settlement | 207 / 42 | `c2s:1913` / 1876,1878 | `s2c:23955` / 1880,1882 | Verified within second fight workflow |

The first fight began before its observation marker and cannot validate a deliberate premarked start action. For the second fight, `battle-02-ready-before-enter` was recorded at the checkpoint ending with packet 1853; the request begins at packet 1854. The user subsequently confirmed the victory screen and waited, recorded by `battle-02-victory-before-confirm-user-waited-10s`. This validates the normal enter-to-victory workflow. It does not establish that a victory confirmation or separate reward-claim button sent `fight_settlement`.

## Lineup Change

The login tuple's module pair with static module ID 9 is decoded as `pb_lineup_login`; its `pre_lineup` bytes are then decoded as `pb_role_lineup`. `ModuleTable.data.lua.json` prototype 5, source line 67, binds module 9 to `RoleLineupMgr`. Its prototype 1 (line 84) decodes `pb_lineup_login` and passes `pre_lineup` to `PreLineupMgr.LoginParse`; that function's prototype 1 (line 73) decodes `pb_role_lineup`. This is a consumer-backed schema selection, not a schema guessed from the bytes.

The initialization contains one preset with **2 occupied fighter entries**. Seq 37 submits one preset containing **3 entries**. The response returns the same preset index and team identity, with **3 entries**. The full requested fighter objects match the returned objects in order, including `loc`, `index`, `hero_id`, `equip_ids` and `relic_ids`. Comparing internally by hero identity and position preserves the original two entries and adds one previously absent identity. No identity values are published.

The response also contains six `copy_lineup` items: three have one team with three matching fighter entries; three have no team entries. The custom preset contains one team with three entries. Six copy items are not six distinct teams of heroes.

`PreLineupMgr.DealUpdateLineupRsp`, prototype 38 (source line 430), consumes `role_lineup.pre_lineups`, updates the active preset, applies populated `copy_lineup` items through `RoleLineupMgr.SetLineup`, refreshes hero maps and emits the lineup update event. This describes the static consumer; runtime acceptance is established separately by the response comparisons and the user's completed lineup operation.

## Battle Structure

| Comparison | First Fight | Second Fight |
| --- | ---: | ---: |
| `report.battle_list` entries | 1 | 1 |
| Attacker brief-lineup teams | 1 | 1 |
| Attacker brief-lineup fighter entries | 2 | 3 |
| Whole battle `fighter_list` entries | 10 | 11 |
| Opaque `action_list` entries | 74 | 71 |
| Request `req` bytes | 3 | 3 |
| Settlement `stm_data` bytes | 85 | 85 |

Second-fight request `loc` contains one team with three hero-position entries. Its identities and locations match the saved seq 37 lineup internally. The report's attacker brief lineup independently contains three entries. The whole report's 11 fighter entries include the battle's combined entities and must not be presented as 11 player heroes.

For each fight, `report.req` equals its originating request's `req` bytes. The `stm` object supplied by the start response exactly equals the later settlement response's `stm`, including the opaque byte field. Report and settlement result fields agree. These equality checks establish correlation; they do not explain the nested byte semantics or award contents.

`FightMgr` prototype 11 (source line 147) builds the outer fight request, obtains the feature request through `GetRequest`, includes team positions and sends `FightCmd.fight_start`. `FightCmd` prototype 0 encodes `pb_fight_request`; prototype 5 encodes `pb_fight_settlement_request`. `FightSettlementMgr.DoModuleSettlement`, prototype 20 (source line 268), dispatches the configured fight type's `settlement_func`; therefore generic `pb_fight_stm` decoding alone does not decode feature settlement data.

## Contracts And Gaps

Schema definitions and original TextAsset hashes are indexed in [static-schemas.json](../interface-catalog/static-schemas.json):

| Contract | Schema Owner TextAsset |
| --- | --- |
| `pb_edit_pre_lineup_req/rsp`, `pb_lineup_login` | `13246045255593464000-lineup.net.proto.bin` |
| `pb_role_lineup`, `pb_pre_lineup`, `pb_lineup_team`, `pb_lineup_fighter` | `8771360202640308000-lineup.db.proto.bin` |
| `pb_fight_request/response`, `pb_fight_stm`, settlement request/response, team positions | `656561243903878900-fight.net.proto.bin` |
| `pb_fight_report`, battle entries and attacker brief lineup | `14171542052218886000-fight.db.proto.bin` |

`req`, `report.req`, `stm_data` and each `action_list` item remain bytes in their enclosing schemas. Their feature/action-specific consumers and schemas have not been resolved in this focused pass. The outer messages and typed report containers are decoded; **the entire battle, action stream and rewards are not fully decoded**. Resource deltas, reward entitlement, claim timing, persistence after reconnect and other battle modes remain unverified.

Consumer identity, under candidate `assets__Android__script__lua__64_lua_project.bundle/textassets/`:

| TextAsset | SHA-256 |
| --- | --- |
| `10694325813431010000-RoleLineupMgr.lua.bin` | `38870ade5f4c10c37f8841a6929b3096648ec8072a4bc1e33633323ec0299980` |
| `7389330831806722000-PreLineupMgr.lua.bin` | `965864ed0e519598ab9b729d534d5078b5d4fb54fc02c6a60805be151a5d2975` |
| `12292012319987352000-FightMgr.lua.bin` | `4434e98bb731461fff9312818ded4bf3dc2f3afa0d5d59663b2b0872c37ebafb` |
| `5114825467834075000-FightSettlementMgr.lua.bin` | `9043f308aa6c99ae2ef8a87f2f90ca1d2b330ead8da53e157747373690d61479` |

Reproduce offline: refresh the local decoded report with `node analysis/tools/protocol/decode-capture.mjs`; join `result.messages[].id` to `privateFlows[].messageId` using the stable IDs above. Decode login module 9 through the two documented schemas. Compare seq 37 preset/team identity and full fighter objects locally, then compare the second request's hero-position pairs and report brief-lineup counts. Publish only counts and equality results. No device or network operation is needed.

## Catalog State Changes

- `req_edit_pre_lineup`: Selected preset changed from two occupied fighter entries to three; the previous two identities and positions were retained, one member was added, and all three submitted entries match the response.
- `fight_start`: The second marked battle used three saved hero-position entries; its decoded report contains one attacker brief-lineup team with three fighter entries. The user confirmed reaching victory.
- `fight_settlement`: The second battle's settlement response matches the settlement object already supplied with its start response. Nested settlement bytes, rewards and any separate claim action remain unresolved.
