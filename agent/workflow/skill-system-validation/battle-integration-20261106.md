# Hero skill battle integration (2026-11-06)

## Result

The hero skill catalog is now loaded by the battle engine through each fighter's
`role` id. This replaces the previous false integration where skills were loaded
with the battle instance id and the executor APIs were never called by a real
battle.

Ordinary mission fights call `simulateBattle`; therefore the mission fighter,
action stream, final HP, and skill effects now share one simulation. This is a
server component and protocol-path verification. It is not a real-client battle
or playability acceptance.

## Runtime behavior

- Normal actions use the hero's `Normal` catalog skill.
- A catalog ultimate is used directly only when it has resolved description or
  type evidence. At the time of this change, 25 heroes meet that rule.
- A metadata-only ultimate fallback is not allowed to replace the more specific
  profession prototype. This prevents a generic 2x single-target row from
  erasing area, shield, execute, revive, or chain behavior.
- The ability ids in the shipped hero rows and the catalog's skill ids do not
  form a one-to-one map. Exact action-id lookup is tried first, followed by the
  evidence-gated Normal/Ultimate rules above.
- Passive and Mastery triggers are registered from every battle unit's `role`,
  not the transient battle `id`.

The engine now runs these trigger families against live battle state:

- round start/end and turn start/end;
- normal attack, skill use, and ultimate use;
- taking damage, killing a target, dying, and crossing the HP threshold;
- gaining a buff or stat modifier.

Trigger execution honors event type, conditions, outer and inner chance,
once-per-battle, once-per-round, maximum uses, round-based cooldown, and priority.
Rounding and random target selection use the battle seed. Skill execution does
not call `Math.random()`.

Trigger accounting is locked before an effect executes, so a stat or status gain
cannot re-enter and bypass once/max/cooldown limits. Permanent stat modifiers
whose condition remains true refresh one copy instead of appending a new
permanent copy every round. This specifically removes the self-triggering
`on-buff-gain` loop and the repeated `+20%` critical-damage/`+20%`
damage-reduction stacks from conditional passives.

## Effect and stat coverage

The executor handles damage, healing, shields, energy, stat modifiers, statuses,
and dispels. Damage uses the current attack, defense, critical chance, critical
damage, damage bonus, damage reduction, and ignore-defense values. Heal and shield
magnitude account for their stat modifiers, while aging buffs affect hit energy
gain and explicit energy-gain effects. Speed modifiers are applied when each
round's action order is calculated.

Buff/status lifetimes preserve their advertised duration: a timed effect created
during a round begins aging after that round. Conditional effects can still expire
as soon as their condition becomes false. Unique, refresh, stacking, and maximum
stack settings are applied to the stored buff/debuff object.

DoT and HoT definitions retain their `tickEffect`, so a poison/regen status now
settles its periodic damage/heal through `processBuffTicks`; it is no longer only
stored as a label. Effect bonuses also preserve explicit negative source values:
damage, heal, shield and energy bonuses are bounded at `-0.9`, while damage
reduction is bounded to `-0.9..0.9`, allowing data-backed damage-taken penalties.

The target selector uses the battle seed for random and random-count selection.
An unknown target type returns no targets and logs the unsupported type instead
of silently selecting the front enemy.

## Mission protocol

Skill-produced damage and death events are attached to the same action id as the
action that triggered them. `mission-fight-service` already encodes these into
`pb_fat_harm` and `pb_fat_fighter_die`; shields continue to use
`pb_fat_shield`. Round-start passive shields can therefore appear between
`pb_fat_round_ready` and the first `pb_fat_action_before`, while passive and
periodic effects always carry a non-zero action id.

The client has `pb_fat_buff_change` as proto `103`, and its static handler reads
`pb_buff_obj`. The server does not yet emit that event because the catalog stores
`statusType`/`statType` semantics but not the required `FightTable.Buff.tid`
mapping. Buff/status transitions therefore affect server state while their client
icon/toast replay remains unimplemented; no buff tid is fabricated.

## Validation

Commands were run in `personal-server` on the main integration worktree.

| Check | Result |
| --- | --- |
| `node scripts/verify-hero-skills.mjs` | 76/76 heroes clean, 0 failures |
| `node --test --test-reporter=dot "test/hero-*.test.mjs"` | passed |
| `node --test --test-reporter=dot "test/effects/*.test.mjs"` | passed |
| Battle, effect, integration, and mission focused suite | passed |
| `npm test` | 2084 tests, 2084 passed, 0 failed |

`personal-server/test/skill-battle-integration.test.mjs` is the black-box guard
for this integration. It verifies role-based loading, round-start execution,
normal/active trigger routing, passive damage and death encoding, non-zero action
ids, seeded reproducibility without global RNG, and mission action-list output.
`personal-server/test/skill-trigger-regression.test.mjs` covers trigger re-entry
and single-copy refresh. `personal-server/test/skill-effect-integration.test.mjs`
covers the negative modifiers and the real status-to-tick path.

## Known limits

- FightTable.Effect and FightTable.Buff source rows were not available at the
  level needed to replace every description-derived multiplier with an exact
  original-server value.
- Metadata-only ultimates intentionally retain profession prototypes.
- Missing `FightTable.Buff.tid` mapping prevents safe `pb_fat_buff_change`
  encoding; buff/status changes remain server-only in replay for now.
- `protection`, `invulnerable`, `strengthened`, `frightened`, `chain`, and
  `pursuit` may be stored from description-derived data, but their exact combat
  semantics are not established. `max-hp-percent`, hit/evasion, status
  hit/resist and rebound have no complete authoritative formula in this round.
  These are known incomplete semantics, not verified completed skills.
- `FightTable.Effect` and the source buff rows are still needed to replace the
  remaining description-derived behavior with exact original-server mechanics.
- No live personal service was restarted and no emulator or APK was touched in
  this integration round. Real client visual and playability acceptance remains
  outstanding.

## Reproduction

```powershell
cd personal-server
node scripts/verify-hero-skills.mjs
node --test --test-reporter=dot "test/hero-*.test.mjs"
node --test --test-reporter=dot "test/effects/*.test.mjs"
node --test --test-reporter=dot test/battle-engine.test.mjs test/skill-effect-integration.test.mjs test/skill-battle-integration.test.mjs test/skill-trigger-regression.test.mjs test/mission-fight-service.test.mjs
npm test
```
