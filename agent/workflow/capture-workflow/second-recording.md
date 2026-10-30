# Second Recording Runtime Evidence

Latest action checkpoint:1619 packets/0drops,160/160 game payloads. The user-confirmed recruitment completion invoked draw_hero type601/seq69; see [recruitment.md](recruitment.md). The combined catalog now retains4174 packets/416 payloads across both recordings, with commands24 observed/24 decoded/7 action-verified. Lifecycle below remains active; the1249-packet section is the earlier login acceptance revision.

2026-10-25. Recording `protocol-2026-10-25-r2a`, original com.jzyx.my / UID10041, version1.55.090365 /362155, device127.0.0.1:16448. The previous final recording is unchanged. Setup and multi-recording migration: [multiple-recordings.md](multiple-recordings.md).

## Correct Account Login Accepted

User initially reported the wrong account and explicitly requested reopening. The checkpoint before reopening contains616 packets and zero kernel drops. That first game flow, `tcp-29`, remains observed/decoded evidence for the other account. It is not the baseline for subsequent intended-account gameplay. At the user's request, only the original application was force-stopped and relaunched; capture/log collectors stayed running. The intended-account flow is `tcp-69`, established after the second launch marker. User confirmed correct-account hall arrival with20 seconds idle.

Checkpoint `correct-account-hall-idle`: host2026-10-25T11:27:35Z,1249 packets,0 kernel drops. Saved PCAP SHA256 `f35088184de22ef54770d8f0a533f7ec0126c3165deb7f19195be25e86c39f17`. This is a saved revision, not the final hash of the still-running capture. All64 game envelopes and immediate payloads decode across both game flows. No game gaps, overlapping conflicts or remaining frame bytes; zero packet/schema errors.109 HTTP exchanges,61 decoded response bodies;8 TLS streams, none decrypted. Other-account observations contribute to structural interface coverage, but no account state or persistence is inferred across accounts.

| Intended Account Gate | Evidence Local To This Recording |
| --- | --- |
| Framed verify | tcp-69, packet1065 |
| Challenge | 99 bytes, packets1067/1069; server AES verified |
| Reply | 46 bytes, packet1071; early client AES and flag echo verified |
| Actual optional modes | encryptC2S=false, encryptS2C=false, signature=false |
| Login request | game:tcp-69:c2s:60, packets1073/1075, type909103, seq1, PB login |
| Login response | game:tcp-69:s2c:103, packets1078/1080/1082/1084/1090/1094, matching seq1, ETF four-tuple, return1 |
| Hall | Explicit correct-account user confirmation plus20 seconds idle |

Do not attach manual-action acceptance to startup type208/209 or other automatic calls merely because they appeared during login. HTTP login workflow calls are not separately action-attributed in this recording. The connection contexts and intended-account login action are in `action-evidence.json`; merged references add `recording:protocol-2026-10-25-r2a:`. Instance IDs, account names, credentials, levels and quantities remain in ignored local files.

## Active Collection

At this checkpoint, capture PID4467 and UID log PID4488 remain active, root setting=true and actual su UID0 verified. Reverse mappings are empty; target-only passive IPv4/IPv6 copies are active. The isolated application stays stopped. Do not stop/relaunch/click or change routing during user gameplay. User may continue ordinary battles naturally; isolate newly unlocked features around single reported actions. Current gaps: equipment/relic/star or other newly unlocked systems, nested battle/login module contracts, reward/persistence semantics and alternate/failure branches.

Always use the new directory explicitly:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File analysis/tools/protocol-capture.ps1 -Action Checkpoint -OutputDirectory analysis/captures/protocol-2026-10-25-r2a -Marker next-operation-before
node analysis/tools/protocol/decode-capture.mjs analysis/captures/protocol-2026-10-25-r2a
node analysis/tools/protocol/build-interface-catalog.mjs
```

Only on the user's pause/end, save and remove this recording's collection resources without stopping the game:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File analysis/tools/protocol-capture.ps1 -Action Stop -OutputDirectory analysis/captures/protocol-2026-10-25-r2a -Marker user-end
```

Then decode/rebuild the final saved snapshot, verify cleanup/root setting and actual su availability separately, and update the handoff. Never invoke Start or Checkpoint on the stopped first recording. Existing controller remote filenames are shared, so never run concurrent collectors.
