# Continue Passive Protocol Capture And Interface Coverage

## Continuation Update: New Recording Active

Latest recruitment checkpoint supersedes the counts below: r2a1619 packets/0drops,160/160 immediate game payloads; combined4174 packets/416 payloads. User completed the specified-adventurer selection once; it actually invoked type601/seq69 draw_hero, request game:tcp-69:c2s:2646 (packets1604/1606), response s2c:39307 (packet1608). One positive and one negative resource delta; matching draw_lib; after screenshot shows R Star Child reveal. This is not a separate selection-save endpoint and does not establish draw-count enum/pity/resource-extra semantics. Action evidence and reproducible inspector are saved; see capture-workflow/recruitment.md. Catalog now HTTP19/12/3, commands24/24/7, pushes4/4/0, controls4/4/0 (observed/decoded/action). User need not click all recruitment options; continue natural guidance. Capture remains active as described below.

The original handoff below describes the final first recording. A subsequent session resumed collection after the user paused and requested opening the game. The active directory is now `analysis/captures/protocol-2026-10-25-r2a/`, capturePID4467/logPID4488, root setting=true and actual su UID0 verified. User confirmed the correct-account hall plus20 seconds idle. Do not stop/relaunch/click during resumed gameplay. See `agent/workflow/capture-workflow/second-recording.md` for accepted fresh tcp-69 login; tcp-29 is the account the user corrected and is not a comparable state baseline. Current saved revision1249 packets/0drops,64/64 game payloads decoded. Old directory and final hash remain unchanged.

Multi-recording aggregation is implemented and33 tests pass. Catalog schemaVersion2 and `analysis/tools/protocol/recordings.json` retain both recordings, with namespaced flow/message/action references and account connection contexts. The first combined snapshot has1760 interfaces,3804 packets and320/320 game payloads, preserving every old observation. Preparation details and its initial zero-packet diagnostic/rollback are in `multiple-recordings.md`. Do not repeat preparation, Start or restart-heavy self-tests while the active collector runs. Checkpoint/Mark/Stop must explicitly pass `-OutputDirectory analysis/captures/protocol-2026-10-25-r2a`; the controller still defaults to the old stopped directory. Stop only when user pauses/ends, save/decode/merge, remove this recording's exact resources and restore root=false without stopping/restarting the game. Await the user's next unlocked feature; ordinary battles need not be interrupted.

Continue in `F:\projects\FateCovenantClone`, PowerShell. User operates the game; agent captures, decodes and maintains a unified HTTP/TCP/push interface catalog. Let later features unlock gradually. Do not return to Unity or implement speculative server business logic now.

## Read First

1. `AGENTS.md`, especially the session-close paragraph at the top.
2. `agent/workflow/interface-catalog/README.md` and `coverage.md`.
3. `agent/workflow/capture-workflow/login-decode.md`, `battle-and-lineup.md`, `hero-progression.md`, `storage-repair.md`.
4. `analysis/captures/protocol-2026-10-25/capture-state.json`, `cleanup-verification.json`, `action-evidence.json`.
5. For shipped-artifact work, `.agents/skills/reverse-engineer-anything/SKILL.md`. Reuse the existing extracted bytecode/schema evidence; do not redo the whole APK analysis.

## Final State Of This Recording

- **Capture has stopped and been cleaned for handoff.** Do not assume the older paragraphs saying running/root=true remain current.
- Root setting is false; readback confirmed it. `su` was inaccessible immediately after disabling root. No emulator restart or game stop occurred at cleanup.
- Capture PID4216 and logcat PID4237 are gone; original game PID5832 and its core process remained running. Isolated game was not running. Revalidate current status before any device operation.
- Exact task rules for IPv4/IPv6, pin/helper and remote raw recording files were removed successfully by controller. Post-disable privileged rule readback was unavailable because su was already gone. Existing conntrack connection-mark bits were not explicitly cleared; no capture rules reference them after cleanup, and they are not packet routing marks.
- ADB reverse list empty. Final evidence is on the host, not lost when remote temporary files were deleted.
- Only device `127.0.0.1:16448`; every ADB command explicitly `-s 127.0.0.1:16448`. Never use the old16416 route.
- ADB: `C:/Users/gzj/AppData/Local/Android/Sdk/platform-tools/adb.exe`.
- Original `com.jzyx.my`, UID10041, version1.55.090365/versionCode362155. Isolated `com.jzyx.ps`, UID10042, stays stopped and local-only.

## Delivered Counts

| Category | Static | Catalog Total | Observed | Immediate Payload Decoded | Action Verified |
| --- | ---: | ---: | ---: | ---: | ---: |
| HTTP method/path/RPC | 28 | 42 | 19 | 12 | 3 |
| C2S business commands | 1407 | 1407 | 20 | 20 | 6 |
| Server pushes | 307 | 307 | 4 | 4 | 0 |
| Transport controls | 0 | 4 | 4 | 4 | 0 |

Static1742, unified1760 including observed-only routes/controls. These are scoped recovered declarations, not proof of every possible URL or reachable branch. Response schemas declared1189/resolved1184; push schemas declared262/resolved253. Fourteen declared messages absent. Request encoding recovered1405/1407: PB569, ETF836; unresolved gm_cmd and conflicting req_beat_gopher.303 Cmd modules and656 proto assets parse;3633 message definitions.297 Port push handlers linked. Numeric array slots are not wire IDs.

Final PCAP2555 packets,0 kernel drops;256/256 game envelopes and immediate payloads decode. No game TCP gaps, conflicting retransmissions or incomplete frames.158 HTTP exchanges,115 JSON/PB response bodies decoded; others include404/307/unknown body formats.18 TLS flows, none decrypted. Final SHA256 `092a7bbc4c012dd0ae4a013ab2300de3f12647e2a8fd966546e2ea82e49ed677`.

## Runtime Milestones

- Login: actual99-byte challenge and46-byte reply; server AES, early client AES, version and flag echo verified. Real packet flags encryptC2S=false/encryptS2C=false/signature=false. True branches only have prior component evidence.
- `login_sdk`909103/seq1 request PB `login`, response ETF four-tuple return1;146 module-ID/payload pairs. User confirmed hall and20s idle. Not all146 nested module contracts are decoded. Selectively decoded lineup module9 and hero module10 for later comparisons only.
- Team selection: type209 `req_edit_pre_lineup`seq37; user selected third member then clicked Complete Selection. Original two identities/positions retained; one added; response entries match. Type208 initialization was automatic, not user action verified.
- Battle: type201 start and207 settlement. First fight observed before explicit start marker. Second marked fight seq40/42 validates enter-to-victory; attacker lineup has3 fighters matching saved team. Start.stm matches later settlement.stm. req/stm_data/action_list bytes are not fully decoded, and reward/persistence semantics remain gaps. Confirmation did not establish a separate claim endpoint.
- Breakthrough: type638 `req_develop_hero_break`seq97, ETF integer→`pb_hero_break_ret`; same hero breakthrough stage+1, other normalized fields retained;2 negative resource deltas. User explicitly reported final click.
- Upgrade: type636 `req_develop_up_lv`seq102, `pb_hero_up_lv_req`→`pb_hero_up_lv_ret`; same hero and cell as breakthrough; **one click caused a multilevel request**, level delta equals up_lv_count, breakthrough retained;1 negative resource delta. Do not call this a one-level increase.

Stable references use flow+direction+offset, e.g. login `game:tcp-65:c2s:60` / `s2c:103`; lineup `c2s:1706` / `s2c:21413`; second battle `c2s:1857` / `s2c:21839`, `c2s:1913` / `s2c:23955`; breakthrough `c2s:3205` / `s2c:40569`; upgrade `c2s:3313` / `s2c:40695`.

## Tools And Reproduction

```powershell
node --test analysis/tools/protocol/capture-codec.test.mjs
node analysis/tools/protocol/decode-capture.mjs
node analysis/tools/protocol/build-interface-catalog.mjs
```

27 codec tests pass: TCP disorder/retransmission/gaps/conflicts/wrap, framing, HTTP chunked/gzip, ETF, sensitive-key/value exclusion, actual target-attribution NFLOG fixture. Catalog generator asserts category counts, uniqueness, one assignment per runtime event, and action-evidence references. Node tools are offline, never send original-server traffic. Static rebuild if needed: `node analysis/tools/protocol/build-static-catalog.mjs`.

Full scalar values live only in ignored `decoded.local-only.json`; never dump it to conversation. Public `decode-summary.json` shapes omit all runtime scalar values, dictionary keys and untrusted constructor names. Raw PCAP/log/screenshot/backup names are `.local-only.*`; gitignore verified.

## Restarting Collection Safely

First ask concisely whether user is currently playing; do useful offline work meanwhile. Do not stop their game or restart emulator while they play. A new connection capture is needed to retain fresh handshake/IVs; have the user close/reopen the original game at the agreed boundary. Routine already-authorized reversible setup does not need repeated permission.

The old controller's Start does **not** provision filters: it requires a valid UID pin and passive rules already installed and refuses an existing capture-state file. Its remote prefix is fixed. Do not just rerun Start or Checkpoint on the stopped old folder: remote raw files were removed. Create a new recording directory and preserve this one unchanged.

Reuse the verified UID10041 memlock helper `analysis/experiments/private-server-20261025/p1/uid-bpf-helper-memlock-x86_64` (SHA256 afa99edc807a5c1b4408d3a0dcfed17d8b8026a99c77e588017d592f4df9aea3). It only creates `/sys/fs/bpf/fc_p1_uid` and does not attach rules. Device target copy expected by cleanup: `/data/local/tmp/fc-proto-uid10041-helper`. Do not overwrite a pin whose ownership is unknown. For this capture use only passive mangle copies, **never** apply private-server NAT/filter/reject scripts to original gameplay:

For each of iptables/ip6tables, these were the exact passive rules; prior to inserting check for absent duplicates and verify no private NAT/reverse rules:

```text
-t mangle -A OUTPUT -m bpf --object-pinned /sys/fs/bpf/fc_p1_uid -m comment --comment FC_PROTO_CT_20261025 -j CONNMARK --set-xmark 0x40000000/0x40000000
-t mangle -A OUTPUT -m bpf --object-pinned /sys/fs/bpf/fc_p1_uid -m comment --comment FC_PROTO_CAPTURE_20261025 -j NFLOG --nflog-group 42 --nflog-prefix FC_UID10041
-t mangle -A INPUT -m connmark --mark 0x40000000/0x40000000 -m comment --comment FC_PROTO_IN_20261025 -j NFLOG --nflog-group 42 --nflog-prefix FC_UID10041_IN
```

Verify only target UID IPv4/IPv6 traffic is copied using owned local probes, excluding shell UID2000 and isolatedUID10042. Do not use the restart-heavy `test-local-packet-capture.ps1` while user plays. Prior fixture is attribution.local-only.pcap,6 packets/0drops. Some non-TCP control NFLOG UID attributes are0 although socket filter matched; decoder records notes without silently discarding business traffic.

Then controller Start/Launch as authorized, user login, Checkpoint/Mark per action. Stop saves evidence, kills exact collector PIDs, removes exact rules/pin/helper and restores root setting without game stop/restart. It does not erase original data or undo the file ownership repair.

**Multi-session merge work remains:** current decoder accepts a recording directory, but unified catalog builder merges only one runtime snapshot into static baseline and always writes the shared catalog. Before importing a new recording, extend aggregation with a recording namespace in every flow/message/action reference and union this final snapshot. Do not overwrite the old dynamic coverage with only the new session or collide IDs like tcp-65. Keep the current final interfaces.json unchanged until the combined result is validated.

## Next Priorities And Boundaries

User wants to keep playing naturally and unlock features gradually. Capture currently-unlocked equipment, relic/star or other new functions one action at a time; gallery was unavailable. Plain battles need not be stopped repeatedly. Record locked/paid/high-cost systems as gaps; no purchases or unnecessary repetitions. Reuse login success rather than re-proving everything unless new capture requires a fresh handshake.

Only passively observe user-generated normal traffic. No original-server requests/replays/probes by agent; no CA installation, disabled certificate checks, credential bypass or true-password/code input. No agent clicks/app stops/restarts/route changes while user plays. Normal original-server capture does not validate private-server APK interoperability.

Login failure previously fixed: LocalData.db and3 Logs files were shell-owned/mislabelled. Backup saved; repaired only four files' owner/context, immediate DB hash unchanged. User later logged in successfully. Do not restore broken metadata or overwrite newly changed game state with old DB backup/hash.

At every major node write implementation/evidence/acceptance/gaps under agent/workflow, refresh coverage and handoff. On user pause/end, save and clean capture resources without stopping the game; report root setting and actual su availability separately.
