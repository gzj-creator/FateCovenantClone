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

## 2026-10-29 victory cursor and Calamus follow-up

- `MissionMgr.sectionTid` is the last cleared mission. Ordinary victory now
  writes that mission id to `pb_mission.mission_id`; it no longer advances to
  `nextMissionId`. This removes the extra-section cursor that made 40208 appear
  cleared while the client continued requesting 40208.
- Replaying a mission at or behind the saved cursor no longer increments
  `pass_count`. Story sections still advance through type 508.
- Regression coverage reproduces `40207 + victory(40208) -> 40208`, then
  verifies the next request is 40209. Gateway tests use the same last-cleared
  semantics.
- `TID_CALAMUS=2020601` now uses the `shadow-calamus` behavior. Ability
  `2202060113` selects one target; after a lethal hit it emits a new action
  id and attacks the next low-health living enemy. A non-lethal hit stops the
  chain.
- Battle tests cover single-target selection, three consecutive kills, action
  id uniqueness, and stopping after a non-lethal hit.
- Full personal-server suite: 133/133 passed. `node --check` passed for the
  changed battle and settlement services.
