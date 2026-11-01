# MethodTable Parsing

Date: 2026-11-01

## File analyzed

`analysis/reports/private-client-16448/lua-bundles/candidate/decoded/assets__Android__script__lua__64_lua_project.bundle/bytecode/MethodTable.data.lua.json`

Size: 495,279 bytes. Format: LuaJIT bytecode dump decoded to JSON (standard `{ flags, chunk, rootPrototype, prototypes }`).

## Structure

- `flags`: 8
- `chunk`: `@input\MethodTable.data.lua.txt`
- `rootPrototype`: 5
- `prototypes`: 6 (indices 0..5)

Prototype 5 (root) builds three constructors by the standard `KSTR`/`FNEW` pattern:

| Constructor       | Prototype | Entries | Role |
|-------------------|-----------|---------|------|
| `Method`          | 1         | 260     | Condition/method predicates |
| `DynamicArgs`     | 3         | 308     | Dynamic UI value definitions |
| `DynamicArgs_List`| 4         | helper  | Upvalue-backed accessor |

Parsing uses `readGeneratedDump(parsed, ['Method','DynamicArgs'])` from `personal-server/config/hero-tables.mjs`, which interprets the straight-line table constructors without executing Lua.

### `Method` table

Maps integer tid (1..260) to `{ reference: "Manager.MethodName" }`, e.g.

- `1 -> MethodUtil.DefaultValid`
- `10 -> FunOpenMgr.IsOpen`
- `16 -> FightPlayingKit.GetCurFightIsOver`
- `18 -> HeroMgr.ExistHero`

These are UI/guide/condition predicates (fun-open conditions, guide node state, mission state, resource counts). None of them are skill definitions.

### `DynamicArgs` table

Maps integer tid (1..308) to `{ tid, lua_interface: { reference }, change_event: [ { reference } ] }`, e.g.

- `1 -> RoleMgr.GetRoleLv` refreshed by `RoleBaseMgr.LEVEL_CHANGE`
- `5 -> FightPlayingKit.GetCurFightTid` refreshed by `IFight.Event.FightStart`

These describe how a UI value is computed and which events refresh it. Again, not skill data.

## Key finding

**MethodTable does not contain skill implementation details.** The task's original assumption that skill data is stored in MethodTable is incorrect. All 1062 skill references in the catalog resolve to `MISSING_FROM_METHOD_TABLE` for this reason.

Skill implementation data actually lives in:

- `FightTable.Ability.*.data.lua.json` (10466 rows): `tid, type, dmg_type, effect_type, run_type`
- `FightTable.AbilityDes.*.data.lua.json` (5655 rows): `tid, type_des, show_name, skill_icon, text, detail_text`

## Cross-reference results (after correction)

- Catalog unique skill ids: 508 (1062 references across 76 heroes).
- Resolved in `FightTable.Ability`: 504 / 508 (only the 4 `normal-profession-*` fallback ids are absent, as expected).
- Resolved in `FightTable.AbilityDes`: 437 / 508 (71 missing, all `69100010xx` ids which are `6910`-family special skills).
- Type mismatches (catalog type vs AbilityDes `type_des`): 0.

Refined discrepancy counts:

- `MISSING_ABILITY_ROW`: 0
- `MISSING_ABILITY_DESCRIPTION`: 68 (64 unique `69100010xx` ids + 4 fallbacks that were not filtered; see report)
- `TYPE_MISMATCH`: 0

## Implementation fields now populated

`personal-server/config/skill-database.json` skills now carry an `implementation` object sourced from `FightTable.Ability` + `FightTable.AbilityDes`:

```json
{
  "source": "FightTable.Ability + FightTable.AbilityDes",
  "resolvedAbility": true,
  "resolvedDescription": true,
  "ability": { "tid": ..., "type": ..., "dmg_type": ..., "effect_type": ..., "run_type": ... },
  "abilityDes": { "tid": ..., "type_des": ..., "show_name": ..., "skill_icon": ..., "text": ..., "detail_text": ... },
  "catalogTypeMatch": true
}
```

Project-fallback normal attacks carry `{ fallback: true, source: "project-fallback", ... }`.

## Tooling

`tools/parse-method-table.mjs`:

- `parseMethodTable(file)` - returns `{ Method, DynamicArgs, meta }`.
- `parseSkillImplementation(abilityDir)` - builds the skill map from FightTable data.
- CLI: default prints MethodTable summary; `--json` dumps Method+DynamicArgs; `--skills` parses FightTable; `--skills --update` rewrites `skill-database.json` and `skill-discrepancies.json`.

## What remains unknown

- Exact damage/healing/shield multipliers (not present in these tables; likely in Effect/Buff parameter blobs not yet joined).
- Buff durations, stacking, trigger timing (Buff table exists but is not yet joined to skills).
- The 71 `69100010xx` ids that lack an AbilityDes row - need to determine whether they use a different des table or are runtime-generated.
- The `Effect`/`Buff` tables (707 / 5423 rows) are not yet correlated to skills; their tids do not overlap skill tids directly, so a join key (probably `ability`/`effect` column) needs to be discovered.
