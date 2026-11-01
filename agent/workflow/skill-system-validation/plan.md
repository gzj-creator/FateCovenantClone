# Skill System Validation and Implementation Plan

## Problem Statement

The current battle engine (`personal-server/game/battle-engine.mjs`) has a prototype skill system with only 7 behavior profiles:
- guardian, breaker, hunter, shadow-calamus, elementalist, support, striker

However, the character skill catalog shows:
- 337 source heroes
- 76 guide-visible heroes
- 1084 skill references
- 530 unique skill IDs

Current issues:
1. Skills are not implemented according to client descriptions (e.g., treatment skills marked as attack skills)
2. Many passive skills with effects (damage modifiers, shields, healing, energy manipulation) are not implemented
3. Skills with conditional triggers (on-hit, on-death, low HP, etc.) are not supported
4. Skill metadata (buffs, debuffs, stacking, duration) is not tracked

## Current Progress (2026-11-01)

### Completed
✅ **Phase 1: Skill Metadata Extraction**
- Created `tools/extract-skill-metadata.mjs` to parse character skill catalog
- Successfully extracted 76 heroes and 1062 skills from catalog
- Generated `personal-server/config/skill-database.json` with structured skill data
- Generated `analysis/reports/skill-discrepancies.json` with 1268 discrepancies identified
- All discrepancies currently marked as MISSING_FROM_METHOD_TABLE (MethodTable parsing not yet implemented)

### Pending
⏳ **Phase 2: MethodTable Parsing**
- Parse MethodTable.data.lua.json to extract skill implementation details
- Cross-reference with catalog to validate skill descriptions
- Identify skill types (damage, healing, shield, buff, debuff, etc.)
- Extract skill parameters (multipliers, targets, conditions)

⏳ **Phase 3: Skill Effect System**
- Design and implement composable effect system
- Define effect types (damage, healing, shield, stat modifiers, energy, status)
- Implement duration system (instant, permanent, timed, stacking)
- Implement trigger system (on-hit, on-attack, on-death, on-round, etc.)

⏳ **Phase 4: Skill Implementation by Hero Tier**
- Implement Tier 1 heroes (16 core roster heroes)
- Implement Tier 2 heroes (12 high-rarity heroes)
- Implement Tier 3 heroes (remaining common heroes)

⏳ **Phase 5: Validation Test Suite**
- Create automated tests for each hero's skills
- Verify damage/healing/shield numbers
- Verify trigger conditions
- Verify buff/debuff stacking
