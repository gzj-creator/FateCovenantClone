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

The target selector uses the battle seed for random and random-count selection.
An unknown target type returns no targets and logs the unsupported type instead
of silently selecting the front enemy.

## Mission protocol

Skill-produced damage and death events are attached to the same action id as the
action that triggered them. `mission-fight-service` already encodes these into
`pb_fat_harm` and `pb_fat_fighter_die`; shields continue to use
`pb_fat_shield`. Round-start passive shields can therefore appear between
`pb_fat_round_ready` and the first `pb_fat_action_before`.

The action replay protocol currently supports the captured damage, shield, death,
revive, attribute-sync, round, and action events. Buff/status transitions remain
in the server simulation but do not have a separately verified client action
message, so this work does not invent one.

## Validation

Commands were run in `personal-server` on the main integration worktree.

| Check | Result |
| --- | --- |
| `node scripts/verify-hero-skills.mjs` | 76/76 heroes clean, 0 failures |
| `node --test --test-reporter=dot "test/hero-*.test.mjs"` | passed |
| `node --test --test-reporter=dot "test/effects/*.test.mjs"` | passed |
| Battle, effect, integration, and mission focused suite | passed |
| `npm test` | 2077 tests, 2077 passed, 0 failed |

`personal-server/test/skill-battle-integration.test.mjs` is the black-box guard
for this integration. It verifies role-based loading, round-start execution,
normal/active trigger routing, passive damage and death encoding, seeded
reproducibility without global RNG, and mission action-list output.

## Known limits

- FightTable.Effect and FightTable.Buff source rows were not available at the
  level needed to replace every description-derived multiplier with an exact
  original-server value.
- Metadata-only ultimates intentionally retain profession prototypes.
- Effects without an evidenced client action schema remain visible to the
  server simulation but are not fabricated in the replay stream.
- No live personal service was restarted and no emulator or APK was touched in
  this integration round. Real client visual and playability acceptance remains
  outstanding.

## Reproduction

```powershell
cd personal-server
node scripts/verify-hero-skills.mjs
node --test --test-reporter=dot "test/hero-*.test.mjs"
node --test --test-reporter=dot "test/effects/*.test.mjs"
node --test --test-reporter=dot test/battle-engine.test.mjs test/skill-effect-integration.test.mjs test/skill-battle-integration.test.mjs test/mission-fight-service.test.mjs
npm test
```
