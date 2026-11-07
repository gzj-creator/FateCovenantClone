# PAY-ONLINEGIFT implementation

## Scope and evidence

- Assigned command: `37010 req_online_gift_award` in `OnlineGiftCmd`.
- Request encoding: ETF with no request schema. Response schema: `pb_online_gift_back`.
- Static evidence: `personal-server/assets/protobuf/online_gift.net.proto.bin` and `online_gift.db.proto.bin` prove `online_gift` plus `res`, and the six authoritative state fields `open`, `last_receive_id`, `receive_time`, `acc_sec`, `period`, `open_day_index`.
- Login slot: shipped `ModuleTable.data.lua.json` maps `OnlineGiftMgr` to module `134` (`project/online_gift`). The captured login fixture also contains slot `134`.
- Client error constants were decoded from `OnlineGiftErr.lua`: `ONLINE_GIFT_CANT_RECEIVE=53901`, `ONLINE_GIFT_RECEIVED_ALL=53902`.
- `OnlineGiftTable.data.lua` was extracted deterministically with `tools/extract-online-gift-table.mjs`:
  - `OnlineGift`: 801 rows, fields `tid,period,time,item,count`.
  - `Period`: 89 rows, field `tid`.
  - `PeriodMax`: 154 rows, fields `tid,server_open_stamp,max_period`.
  - Asset SHA256: `92C8298F39DE5E6037CE6284004893965EAEA814B2A34554D94A2F9F69DE3B63`.

## Implemented behavior

- Added `personal-server/game/online-gift-service.mjs` and route `37010` in `gateway.mjs`.
- Successful login opens the online session and writes module `134` from the same state used by the command response. Socket close commits the active interval and closes the session.
- Online seconds come from server login/close/request timing. The client cannot submit or inflate `acc_sec`.
- Day boundaries use the repository's Asia/Shanghai 05:00 recharge-day helpers. A new day resets the claim cursor and online counter, derives the server-day period, and cannot reuse the prior day's cursor.
- `180/360/540` second milestones are read from the extracted `OnlineGift` rows. The next configured row is selected by `last_receive_id` and period; its actual `item/count` is granted through the shared resource handler.
- Reward changes, claim cursor, `receive_time`, `acc_sec`, period, and encoded response are committed in one SQLite transaction. Duplicate/exhausted claims return `53902`; early claims return `53901`; malformed parameters return `1`.
- The service creates its private `online_gift_state` table with idempotent `CREATE TABLE IF NOT EXISTS` during service construction. `personal-server/storage/game-store.mjs` remains unchanged.

## Verification

Commands, from the task worktree:

```powershell
node tools/extract-online-gift-table.mjs <OnlineGiftTable.data.lua> <out.json.gz>
pushd personal-server
node --test test/online-gift-service.test.mjs
node --test test/online-gift-gateway.test.mjs
popd
```

Results:

- Extractor reproduced the committed gzip byte-for-byte.
- Service tests: 4/4 passed. They cover milestones and rewards, exhaustion, module `134`, SQLite reopen, 05:00 reset, malformed ETF, forced response-encoding rollback, and forced module-write/SQLite rollback.
- Temporary TCP test: 1/1 passed through the actual `verify` handshake, `909103` login, numeric `37010` ETF request, protobuf response decode, resource change, and malformed request rejection.
- `git diff -- personal-server/storage/game-store.mjs` is empty.

## Remaining evidence / boundaries

- `PeriodMax` is extracted and validated, but its exact historical selection semantics are not established. This implementation uses the server's 05:00 day number capped to the configured period set (currently 89), while keeping the feature open for the local server. This limitation needs client/server comparison or additional evidence before claiming perfect parity.
- No push command was registered for this module; login and direct responses read the same state. A future observed push would need its numeric binding added.
- APK/UI acceptance was not performed. The next acceptance layer is isolated `com.jzyx.ps` on `127.0.0.1:16448`: login, wait/advance to a real milestone, claim, reopen client, and verify red-dot/countdown/period display.
