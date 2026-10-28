# Grace Front-Row Active Skill Fix

Date: 2026-10-28

## Symptom

The APK showed Grace (女仆格蕾丝) using her active skill, but only one enemy
received damage. Her configured skill is a front-row area attack.

## Identity and client evidence

- `HeroTable.lua` maps `TID_GRACE` to hero id `1020601`.
- The current lineup's Grace ability list contains `2102060112`; its
  `FightTable.Ability.2` row is type `2` (active).
- The client formation uses six slots: `loc` 1-3 are the front row and `loc`
  4-6 are the back row. Grace's target rule resolves the enemy front row as a
  whole rather than selecting one lowest-HP target.

## Change

- `personal-server/game/battle-engine.mjs` adds a `front-row-all` target mode.
- The hunter profile used by `1020601` now uses that mode for its active skill.
- The old single-target execute branch is retained for future configurations,
  but is no longer selected for Grace.
- `personal-server/test/battle-engine.test.mjs` verifies all three front-row
  units take damage and two back-row units remain untouched.
- `personal-server/test/mission-fight-service.test.mjs` decodes the actual
  `pb_fat_action_before` and `pb_fat_harm` packets for Grace and requires both
  configured defenders in the live mission fixture to be present.

## Verification

- Battle-engine tests: 6/6 passed.
- Mission-fight packet tests: 8/8 passed.
- Full personal-server suite: 128/128 passed.
- `node --check` passed for changed production and test files.
- Service restarted as PID `12640`; all five ports `18880`, `18881`, `18882`,
  `18883`, and `19090` listen only on `127.0.0.1`.
- APK visual confirmation that every front-row enemy reacts and loses HP is
  pending user testing.
