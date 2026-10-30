# Interface Coverage

Latest snapshot: 2026-10-25T12:03:39.660Z. Recordings: 2; any recording running at generation: false. Counts are unique interfaces across recordings, not packet counts.

| Category | Static | Catalog Total | Observed | Decoded | Action Verified |
| --- | ---: | ---: | ---: | ---: | ---: |
| HTTP | 28 | 42 | 19 | 12 | 3 |
| TCP Commands | 1407 | 1407 | 24 | 24 | 7 |
| Server Pushes | 307 | 307 | 4 | 4 | 0 |
| Transport Controls | 0 | 4 | 4 | 4 | 0 |

Immediate game payloads: 480/480; HTTP response bodies decoded: 186/277. The HTTP denominator includes 404/307 and unknown response formats.

TLS streams: 27; none decrypted. Login ETF contains 146 module/payload pairs, not 146 verified push interfaces.

## Acceptance And Limits

- Original-game login, hall arrival, third-member selection completion, a marked battle start-to-victory workflow, and the recorded hero progression actions have user evidence. Private-server APK acceptance is unchanged.
- Automatic initialization type208 lineup requests remain observed/decoded only. Team selection completion verifies type209.
- First victory confirmation had no extra business message in the checkpoint window; it does not prove a separate claim-reward endpoint.
- Decoding includes outer envelopes and immediate PB/ETF payloads. Opaque nested req/stm_data/new_bin and login module bytes require separate schemas and semantic checks.
- The first accepted login connection had all three optional encryption/signature flags false. Each recording retains its own handshake flags; true branches need runtime evidence.
- Static coverage: 1405/1407 request encoders recovered; gm_cmd and req_beat_gopher unresolved. Fourteen declared response/push message definitions are absent.
- Static HTTP enumeration is scoped to recovered SDK routes, startup config, server-list RPC and added observed routes; it is not a proof of every URL in every native/SDK branch.
- No new original-server request, replay, route change, CA installation or authentication bypass is performed by these offline catalog tools.

## Capture Integrity

- protocol-2026-10-25: 2555 packets; SHA256 092a7bbc4c012dd0ae4a013ab2300de3f12647e2a8fd966546e2ea82e49ed677; latest reported kernel drops: 0; snapshot 2026-10-25T11:10:05.151Z; running=false. Source: analysis/captures/protocol-2026-10-25/decode-summary.json.
- protocol-2026-10-25-r2a: 1887 packets; SHA256 21b47f6d32e72d8d8885a77d328cf388451383ccfd79396ae2300bfb35d162da; latest reported kernel drops: 0; snapshot 2026-10-25T12:03:39.660Z; running=false. Source: analysis/captures/protocol-2026-10-25-r2a/decode-summary.json.
- Decoder packet errors: 0; schema errors: 0; trailing live-checkpoint bytes: 0.
- recording:protocol-2026-10-25:tcp-65: gaps C2S/S2C=0/0; overlap conflicts=0/0; remaining frame bytes=0/0.
- recording:protocol-2026-10-25-r2a:tcp-29: gaps C2S/S2C=0/0; overlap conflicts=0/0; remaining frame bytes=0/0.
- recording:protocol-2026-10-25-r2a:tcp-69: gaps C2S/S2C=0/0; overlap conflicts=0/0; remaining frame bytes=0/0.
- Target socket UID attribution is validated for both address families. Non-TCP NFLOG UID0 notes are retained separately, not discarded or counted as decoded business traffic.

## Current Gaps

- gallery: User reported not unlocked or not found.
- upgrade-all/equipment/relic/star: Single upgrade and breakthrough observed; other variants/systems not yet isolated in current new-account tutorial.
- late-game systems: Let features unlock gradually; no purchase or costly repetition requested.
- recruitment-alternate-branches: One specified-recruitment completion captured. Other pools, paid/ten-draw/pity/exchange paths and failure cases remain unverified; no exhaustive clicking requested.
- equipment/relic/star: Await naturally unlocked functions and individual user actions.

Unobserved interfaces remain listed individually with false dynamic flags. Locked, untriggered, unknown and TLS-hidden behavior are not accepted as covered.
