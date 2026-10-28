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
