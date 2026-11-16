# Channel entry without guild membership — 2026-11-16

## Symptom

After login, the client sent `req_channel_entry` (type `102801`) and received error code `7`. The client reported `业务请求结果错误` and remained at loading/guide step `291004`.

## Root cause

`channel-entry-service.mjs` called `guildContext()` before reading the channel policy. That helper correctly rejects roles with no guild, but channel entry is available before guild membership. The role `100002` has no guild, so a valid channel request was rejected with `Current role has no guild`.

## Fix

- Decoupled `102801` from login module 24 and the guild-membership gate.
- Stored channel-entry open history in the role-scoped `guild_id='0'` partition so joining or leaving a guild does not split the history.
- Added service and real temporary-TCP regression coverage for a role whose guild module is absent.

## Validation

- Worktree `test/guild-coop-services.test.mjs`: 7/7 passed.
- Worktree fast suite: 493 tests, 491 passed, 0 failed, 2 existing skips.
- Main `test/guild-coop-services.test.mjs`: 7/7 passed after merge.
- Live server loaded 1407 command routes and all five ports bound on PID `9960`.
- Live request log shows `command type=102801 seq=6` followed by `channel_entry_command channelId=1 opens=1`; no `guild_coop_rejected` for this request.
- Client screenshot `analysis/experiments/launch-20261115/client-after-channel-entry-fix-20261116.png` no longer shows the configuration/error dialog and has advanced to the story screen. The agent did not click the client UI.
- `npm run check:command-dispatch` remains blocked by a pre-existing stale source hash in the checked-in audit at the merge base; this patch does not alter gateway routing or the audit source files.

## Deployment and rollback

- Code commit: `6836146` (`fix(channel-entry): allow roles without a guild`), merged to `main`.
- Previous server PID `25268` was stopped and replaced by PID `9960` using the same data directory and `FC_SERVER_OPENED_AT=1794690000`.
- Pre-switch SQLite backup: `analysis/experiments/launch-20261115/backups/pre-channel-entry-no-guild-20261116T143705Z/game.local-only.sqlite`.
- Backup size: `1,675,264` bytes.
- Backup SHA256: `A0693E31D7CEB805DCA8F3C3031743A1988F571A696F1B13669DBA8EFED4CBF0`.
- Backup `PRAGMA integrity_check`: `ok`.
- New server log: `analysis/experiments/launch-20261115/server-channel-entry-fix-20261116T143809Z.out.log`; stderr is empty.
