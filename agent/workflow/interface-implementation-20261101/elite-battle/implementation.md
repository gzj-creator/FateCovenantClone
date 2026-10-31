# Elite Battle Implementation

## Implemented interfaces
- type 87001 req_elite_mission_custom (ETF): reads/writes module 140 pb_elite_mission, returns pb_elite_mission_back.
- type 87002 req_elite_mission_box_award (protobuf): idempotent box/task claim recording, returns pb_elite_mission_box_award_back.
- type 87003 req_elite_mission_chapter_pass (ETF): idempotent chapter claim, returns ETF [chapterId, alreadyClaimed].

## Files
- personal-server/game/elite-mission-service.mjs (new)
- personal-server/game/gateway.mjs (import + instantiation + route)
- personal-server/test/elite-mission-service.test.mjs (new, 8 tests)

## Tests
8/8 pass.

## Acceptance
Component tests pass. Gateway route added. Transaction + idempotency logic present. Persistence verified via reopen test.
