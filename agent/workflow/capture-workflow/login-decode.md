# First Login Capture

2026-10-25. Original package `com.jzyx.my`, UID 10041, app `1.55.090365`, versionCode 362155. Only device `127.0.0.1:16448` was used. The user performed login and confirmed arrival in the hall with 20 seconds idle. The isolated package was not launched.

## Runtime Acceptance

The source login chain is captured and decodable. At checkpoint `05-user-hall-idle-20s`, the PCAP has 1,364 packets and tcpdump reports zero kernel drops. All TCP streams retain their initial SYNs; the game stream has no gaps, conflicting retransmissions, or incomplete frames.

| Gate | Observed Evidence |
| --- | --- |
| SDK renewal | HTTP POST `/user/tokenVerifySdk`, status 200, JSON body decoded |
| SDK follow-up | HTTP POST `/v2/users/checkLogin`, status 200, JSON body decoded |
| Server selection | HTTP POST `/server_list`, `preferred_login_servers`, status 200, direct `pb_login_servers` decoded |
| Initial verification | Game stream `tcp-65`, destination port 3033, packet 1185, framed ASCII `verify` |
| Server challenge | Packet 1187, exactly 99 payload bytes; server AES plaintext matches its expected challenge |
| Client reply | Packet 1189, 46 payload bytes; 16-byte early AES ciphertext and echoed flags verified; version `1.55.090365` |
| Actual packet mode | C2S encryption=false, S2C encryption=false, signature=false for this connection |
| Game login request | `game:tcp-65:c2s:60`, packets 1191/1193, type 909103, seq 1, outer `pb_c2s`, inner PB `login`, 631 data bytes |
| Game login response | `game:tcp-65:s2c:103`, packets 1200/1202/1204/1208/1210, response seq 1, outer `pb_s2c`, inner ETF, 18,096 data bytes |
| Login result | ETF tuple has four positions; return code 1; position 2 has three time arguments; position 3 is an ETF list of 146 module-ID/payload pairs; position 4 is boolean |
| Hall | User confirmed arrival and 20 seconds idle; separately supported by the successful game-login payload |

All 29 game messages in that checkpoint decode at both envelope and payload layers: PB request schemas are selected through the recovered command encoders; responses use `c2s_back` and request seq; pushes use the separate `s2c` table. Heartbeats are recorded separately. Automatic lineup and feature requests during initialization are observed, not independently attributed to a manual gameplay action.

This verifies the measured early-AES reply behavior in this APK connection. Optional packet AES and signature=true are not exercised by the real connection. Nine TLS streams are observed, but their HTTP paths and payloads have not been recovered from encrypted records. Nested module PB contracts beyond the decoded ETF structure remain separate coverage items.

## Collection And Reproduction

The original root setting was false. While the user had not started playing, instance 2 root was enabled and the instance restarted. A checked, existing socket BPF helper matches only socket UID 10041. Passive NFLOG group 42 copies OUTPUT for that UID and INPUT for its related connections. Connection mark bit `0x40000000` attributes incoming copies; packet routing marks, NAT, reverse mappings, packet destinations, and accept/drop decisions are unchanged. IPv4 and IPv6 are both covered.

Before launch, loopback probes confirmed UID 10041 IPv4/IPv6 capture and excluded shell UID 2000 and isolated UID 10042. Six expected packets and zero drops are retained in `attribution.local-only.pcap`. Some target-related non-TCP control packets have NFLOG UID attribute 0; the socket-BPF attribution remains the collection boundary and these discrepancies are retained in `decode-summary.json`, not silently reported as business messages.

The initial login was blocked by local file ownership, repaired with unchanged DB content as documented in [storage-repair.md](storage-repair.md). The user closed the application; the agent relaunched the selected original activity under explicit launch authorization. No agent taps, forced app stops, or route changes were made during gameplay.

```powershell
# Capture is already running. Do not start a second collector.
powershell -NoProfile -ExecutionPolicy Bypass -File analysis/tools/protocol-capture.ps1 -Action Checkpoint -Marker checkpoint
node analysis/tools/protocol/decode-capture.mjs
```

The decoder uses pinned `pcap-parser` 0.2.1, `erlang_js` 2.0.7, existing `protobufjs` 8.8.1 and the local AES helpers. It reconstructs TCP with sequence offsets, checks overlaps/gaps, splits 4-byte big-endian frames, verifies both handshake AES directions, and decodes by schema/seq. It makes no network connections.

Message references use flow, direction and byte offset, so new messages appended to the same capture do not renumber prior replies. Flow references assume the same capture start and packet order; a new recording needs a new evidence directory.

Evidence directory: `analysis/captures/protocol-2026-10-25/`. PCAP, raw target UID log, account-bearing decoded objects, screenshots and backup are `.local-only.*` and ignored. Public summaries contain only structure, packet references, types, seq, timings, lengths and safe protocol results. `capture-state.json` records process IDs, filters, versions, times and file hashes; `operations.jsonl` records marks. A checkpoint hash describes that saved PCAP revision, not later live bytes.

## Current Lifecycle

Recording was stopped for user-requested context handoff. Final PCAP has 2555 packets and zero kernel drops; 256 immediate game payloads decode. The two recorded collector PIDs are gone, exact task rule/pin/helper deletion commands succeeded, root setting reads false and su is already inaccessible without reboot. The user's game remained running. Privileged rule readback after disabling root was unavailable; no root re-enable was attempted. See `cleanup-verification.json` in the capture directory and [handoff](../../../promot/2026-10-25-protocol-capture-handoff.md). A fresh recording must use a new evidence directory and namespace; preserve this final snapshot.
