# Mission Fight Active Skill Fix

Date: 2026-10-28

## Symptom

The anger bar reached 1000 and the server marked the skill action as type 2,
but the APK played a normal attack and never showed the active skill or the
combination assist.

## Root Cause

`FightActionBeforeStep._OnStart` resolves `FightTable.Ability(ab_tid).type`.
The shipped ability ids encode that type in their leading digit:

- `1...`: common ability
- `2...`: active ability
- `3...`: passive ability
- `4...`: attribute ability

The service previously selected the first `3...` id as the active ability.
The packet therefore had `pb_fat_action_before.type = 2`, but `ab_tid` still
resolved to a passive ability, so the client stayed on the normal-attack path.

For the current team, the relevant rows are:

```text
1201010101,1,...  common
2201010111,2,...  active
3201010111,3,...  passive
4201010161,4,...  attribute
```

## Change

- `personal-server/game/mission-fight-service.mjs` now selects the first
  `2...` ability id for the active-skill action.
- `personal-server/test/mission-fight-service.test.mjs` now requires common
  actions to use `1...` ids, active actions to use `2...` ids, and every active
  id to belong to the source fighter's configured ability list.

## Verification

- Targeted mission-fight tests: 8/8 passed.
- Full personal-server suite: 127/127 passed.
- `node --check` passed for the changed service and test.
- Service restarted as PID `32716`; all five ports listen only on `127.0.0.1`.
- The isolated client reconnected automatically after restart.
- APK visual acceptance for active skill, combination assist, and victory
  advancement remains pending user confirmation.

## 2026-10-29 next-node cursor correction and Calamus follow-up

> Superseded on 2026-11-07. The persisted cursor was incorrectly treated as
> the next playable node during this iteration. Runtime evidence later showed
> that it is the last cleared node. The Calamus battle work remains valid.

- APK feedback after clearing 40209 showed that the previous last-cleared
  cursor interpretation was wrong. `MissionMgr.ParseData` assigns
  `pb_mission.mission_id` to its in-memory `sectionTid` and fires
  `REFRESH_MISSION_INFO` only when that value changes. Returning the same
  40209 therefore left the journey UI on 4-9.
- Ordinary victory now writes the next non-discard `MissionTable.Section` row,
  ordered by `Section.index`, to both the persisted mission module and the
  settlement response. The concrete transition is
  `victory(40208) -> 40209`, then `victory(40209) -> 40210`.
- Replaying a mission behind the saved cursor no longer increments
  `pass_count`. Story type 508 also advances to the next node; passing 30205
  returns 40201.
- Regression coverage verifies the 4-8 and 4-9 transitions, duplicate-clear
  idempotency, story advancement, persistence, and real gateway framing.
- `TID_CALAMUS=2020601` now uses the `shadow-calamus` behavior. Ability
  `2202060113` selects one target; after a lethal hit it emits a new action
  id and attacks the next low-health living enemy. A non-lethal hit stops the
  chain.
- Battle tests cover single-target selection, three consecutive kills, action
  id uniqueness, and stopping after a non-lethal hit.
- Full personal-server suite: 136/136 passed. Targeted mission tests are 9/9
  and the real TCP gateway test is 1/1. `node --check` and `git diff --check`
  passed for the changed service and tests.
- Live SQLite was backed up to
  `analysis/experiments/private-server-20261025/p3/mission-cursor-next-20261029/`.
  Before migration: module 8 `mission_id=40209`, SHA-256
  `35ECC94167098CB29D7B20137381FA3C9554890F2F1F4ED1976E791FC05AF274`.
  After migration: `mission_id=40210`, SHA-256
  `F58917EC9170943323C64BF56A7A4B9FF7563459F29DC2CB6FD375CD2669E730`.
  Both backups report `PRAGMA integrity_check=ok`; schema version remains 3.
- Service PID `32312` listens on 18880, 18881, 18882, 18883 and 19090 only at
  `127.0.0.1`. The isolated client reconnected, completed its handshake and
  login with all 145 modules at 2026-10-28T16:46:18Z through 16:46:18.509Z.
- APK visual confirmation that 4-10 is now shown remains pending. The 4-10
  boss battle itself is outside this cursor fix; this change unlocks the boss
  node without replaying 4-9.

## 2026-11-07 offline-fixture cursor migration (superseded by schema v13)

> The conclusions below are retained as the erroneous v12 history. Runtime
> evidence on the same day showed that `mission_id` is the last cleared node,
> not the next playable node. See the schema-v13 section at the end.

- The current APK text `配置出错了` is `Err.CONFIG_ERROR=5`, not a missing or
  broken client asset. Live log evidence was
  `Mission is not unlocked (current 20205@7, requested 30201@8)`.
- The client request was correct. `pb_mission.mission_id` is the next
  non-discard journey node, but the recreated `offline-fixture` database still
  stored `20205`, which is the fixture's last-cleared cursor. The next node in
  `MissionTable.Section` order is `30201`.
- The temporary one-node look-ahead guard was removed. The service again
  rejects every request ahead of the saved cursor, so it cannot hide a stale
  cursor or permit a two-node skip.
- `personal-server/game/mission-progress.mjs` now owns section ordering and
  next-node resolution for both fights and migrations. Schema v12 starts only
  when `initial-save-v1.source=offline-fixture` and repairs the exact legacy
  cursor `20205` to its configured successor. Other cursors are preserved.
- The migration writes `mission-cursor-next-v12`, sets `user_version=12`, and
  is idempotent. Reopening the database cannot advance a second node. Fresh
  fixture imports receive the same repair before the first login response.
- Regression tests assert the unmodified fresh fixture exposes `30201`, rejects
  `30202` as a two-node skip, repairs a simulated schema-11 cursor once, and
  leaves it unchanged after repeated reopen. The real gateway test no longer
  masks the fixture by setting `30201` itself.
- `login-business-reads.test.mjs` now builds its database from the checked-in
  capture fixture instead of copying the deleted historical handoff save. This
  removes the test suite's dependency on restoring old runtime data.
- Targeted mission tests passed 18/18, the real gateway file passed 6/6, and
  the full personal-server suite passed 2085/2085.
- A consistent read-only copy of the live database was upgraded before
  deployment. Before: schema 11, cursor `20205`; after: schema 12, cursor
  `30201`. Hashes of roles, heroes, hero cells, resources, lineups, play
  lineups, guides, and reward claims were identical. Evidence:
  `analysis/experiments/private-server-20261025/p3/mission-cursor-next-20261107/`.
- The live service was restarted as PID `32744`. Live SQLite reports schema 12,
  cursor `30201`, `pass_count=9`, migration source
  `offline-fixture; repaired-cursors=1`, and `integrity_check=ok`. The isolated
  client reconnected automatically and completed login with all 145 modules.
  APK confirmation that the next fight starts without `配置出错了` remains
  pending user interaction; no test or agent clicked the live client.

## 2026-11-07 last-cleared cursor correction (schema v13)

- The APK text `配置出错了` is `Err.CONFIG_ERROR=5`, not a missing or broken
  client asset. The direct cause is the mission request being rejected by the
  server.
- The earlier v12 interpretation was wrong. `pb_mission.mission_id` is the
  **last cleared node**, not the next playable node. The client derives and
  displays the immediate successor itself.
- Runtime evidence established the direction unambiguously. With the database
  cursor at `30201`, the client displayed chapter 3 section 2 and requested
  `30202`; the old service rejected it with
  `Mission is not unlocked (current 30201@8, requested 30202@9)`. The screenshot
  is
  `analysis/experiments/private-server-20261025/p3/mission-cursor-next-20261107/client-after-30202-rejection.png`.
- The original offline fixture value `20205` was therefore correct. The v12
  migration incorrectly advanced it to `30201`, so the client correctly showed
  and requested the following node. This matches the user's report that the
  client was one stage ahead after the previous change.
- `personal-server/game/mission-fight-service.mjs` now accepts a replay at or
  behind the cursor and exactly the one immediate successor. After victory it
  persists the completed mission ID. A replay does not increase `pass_count`,
  and story completion stores the completed story section as well.
- Chapter-box progress counts the last-cleared section inclusively. Mission
  sweep also accepts the last-cleared node while continuing to reject every
  uncleared node.
- Schema v13 reverses only the exact accidental offline-fixture move
  `30201 -> 20205`. It requires the old v12 audit source, fixture origin,
  `pass_count=9`, and no `30201` first-clear claim. A legitimate `30201` clear
  has `pass_count=10` and a reward claim, so it is preserved.
- Targeted mission tests passed 19/19, the real gateway test file passed 6/6,
  and the full personal-server suite passed 2086/2086. Coverage includes the
  immediate-successor gate, completed-node persistence, replay idempotency,
  story and chapter-boundary behavior, exact v13 rollback, idempotent reopen,
  and preservation of a legitimate clear.
- A consistent copy of the live schema-12 database was migrated and reopened
  before deployment. Only the mission cursor and migration ledger changed:
  cursor `30201 -> 20205`, `pass_count` stayed 9, all other tables and the other
  144 login modules were byte-identical under deterministic table hashes, and
  `integrity_check=ok`. Evidence and file hashes are in
  `analysis/experiments/private-server-20261025/p3/mission-cursor-next-20261107/v13-migration-copy-verification.json`.
- The live service was restarted as PID `29804`. Live SQLite reports schema 13,
  cursor `20205`, `pass_count=9`, migration source
  `premature-v12-reverted=1`, and `integrity_check=ok`; all five ports listen
  only on `127.0.0.1`. The previous client connection had already closed, so
  APK confirmation of the corrected 3-1 display and a successful `30201` fight
  remains pending the user's normal reopen/login interaction.

## 2026-11-07 201/207 settlement and schema v15 mission energy

- Schema v13 corrected the mission cursor to the last-cleared node. Schema v14
  restored only the missing offline-fixture level-9 stamina row at 140. Schema
  v15 moves the authoritative stamina resource into the location the shipped
  client actually reads: login module 8, slot 2.
- Client Lua `MissionMgr.ParseData` maps module 8 slot 2 to
  `pb_role_energy_res`, and `EnergyRes.ResChange` decodes only a
  `pb_mission_energy_res` value from `pb_res_change.new_bin`. The old database
  kept `100012900` in module 5 `pb_currency_data`, so the top-bar meter did not
  consume resource changes and remained inconsistent with gameplay state.
- The live pre-migration login module had a stale slot-2 value
  `{tid=100012900,num=120,produce_time=1792927379}` while the resource table had
  the real balance 130 at `[5,null,1]`. `produce_time` made the client recover
  the stale 120 to its level cap, which is why the APK showed `160/160`.
- `personal-server/game/energy.mjs` now owns the configured cap and periodic
  recovery. `game-store.mjs` reads module 8 slot 2, materializes it from the
  resource table on login, computes recovery at state projection time, and the
  v15 migration moves 100012900 to `[8,2,0]` without changing its balance. A
  stale `produce_time` is reset once during migration so the cached 120 cannot
  immediately become a false full bar.
- `resources.mjs` treats 100012900 as mission energy and returns
  `new_bin=pb_mission_energy_res`. Mission start (`201`) is a battle preview
  with `report.finish=false`; it neither spends stamina nor advances the
  cursor. Mission settlement (`207`) is the only commit point and atomically
  spends stamina, advances the last-cleared cursor, grants first-clear rewards
  and role experience, and emits the energy change. Repeated `207` remains
  idempotent. Chapter-box and sweep paths preserve module 8 slot 2.
- Targeted mission-fight tests passed 23/23, the real gameplay gateway passed
  6/6, hero progression/migration passed 19/19, and the full personal-server
  suite passed 2090/2090. `node --check` and `git diff --check` passed.
- A consistent live copy was backed up before migration at
  `analysis/experiments/private-server-20261025/p3/energy-module8-20261107/game.pre-energy-v15-20261107.sqlite`
  (schema 14, balance 130, location `[5,null,1]`, SHA-256
  `99c44f498c51ebbda7167ec82dcef013305d98b855c12fde43d23001e6b6f470`).
  Migrating and reopening a separate copy produced schema 15, unchanged
  balance 130, location `[8,2,0]`, decoded module-8 num 130, and
  `PRAGMA integrity_check=ok`. The validated copy and JSON evidence are in the
  same directory.
- The live service restarted as PID `33856`; ports 18880, 18881, 18882, 18883,
  and 19090 listen only on `127.0.0.1`. Live SQLite is schema 15, migration
  source `normalized=1; produce-time-reset=1`, and `integrity_check=ok`.
- APK visual acceptance completed in the isolated package `com.jzyx.ps`:
  before battle it showed `130/160` on 3-3
  (`client-energy-before-20261107.png`). The server logged command 201 with
  `missionId=30203`, `committed=false`, `reportFinish=false`; after playback the
  client sent 207 and the server logged `mission_fight_committed` for 30203.
  Confirming victory returned to the map at 3-4 with `125/160`
  (`client-energy-map-after-win-20261107.png`), proving one-node advancement
  and a five-point stamina deduction. After a full client stop and login, the
  lobby showed `126/160` (`client-energy-relogin3-20261107.png`); the extra one
  point is the configured timed recovery after settlement, not the stale 130.
- No APK file was changed in this round, so the existing APK snapshot remains
  valid. The only required client prerequisite is still the documented
  `SubDownloadFinish=1` PlayerPrefs value.
