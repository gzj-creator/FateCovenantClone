# Multiple Passive Recordings

2026-10-25 continuation. Source remains com.jzyx.my / UID10041 on 127.0.0.1:16448. No Unity or speculative private-server business work.

## Catalog Aggregation

`analysis/tools/protocol/recordings.json` registers the final first recording and future recordings. Each stable ID namespaces flow IDs, HTTP/game message IDs, request-response links, actions and action references as `recording:<id>:<local-id>`. Observations retain `localId` and `recordingId`. Packet numbers and offsets belong to the original recording; existing workflow documents use local references.

Catalog schemaVersion 2 retains a `recordings` array with each source path, PCAP hash, packet/drop counts, operations/action files, running state, snapshot and handshake flags. Unique interface coverage is a union; event/message counts are sums. Existing static declarations remain the baseline. HTTP workflow actions only match their own recording; decoded TCP requests and replies from different recordings cannot form a successful pair.

The loader rejects duplicate namespaces, directories, snapshot hashes, local event/action IDs, missing flows/actions and invalid response references. The first final snapshot hash is pinned in the manifest. Repeated builds reread registered snapshots instead of appending duplicate events. A positional capture directory supplements the manifest, preserving old recordings. `--manifest` permits an explicitly different set for testing; manifest directory paths are relative to the project root.

Before publishing, generate into an independent directory:

```powershell
node --test analysis/tools/protocol/capture-codec.test.mjs analysis/tools/protocol/catalog-recordings.test.mjs
node analysis/tools/protocol/build-interface-catalog.mjs --output analysis/experiments/protocol-multirecording-20261025/staged
node analysis/tools/protocol/build-interface-catalog.mjs
```

Acceptance: 33 tests passed, including account-context flow references. Final first-recording rebuild preserved all 1760 interface entries, dynamic flags, observation counts/local references, 256/256 decoded game messages and every category count: HTTP19/12/3, commands20/20/6, pushes4/4/0, controls4/4/0 (observed/decoded/action). The pre-migration catalog is retained in `analysis/experiments/protocol-multirecording-20261025/baseline/interfaces.json`. No files inside the final first recording were changed. The first combined checkpoint was then staged and accepted: 3804 packets across two recordings,320/320 immediate game payloads,1760 interfaces and unchanged category counts; every old observation was retained. Further recordings should be added only after decoding their first saved checkpoint, then staged and checked before publishing.

## New Collection Setup

User confirmed gameplay was paused and requested the agent open the game when ready. Source process remained in the background and was force-stopped at this agreed boundary. Root setting true did not expose su immediately; emulator instance 2 was verified to use ADB16448 and restarted once while the game was stopped. Boot completed and actual su UID0 were verified. This restart was before resumed gameplay.

`analysis/tools/prepare-passive-capture.ps1 -OutputDirectory <new-directory>` requires stopped games, verified UID, working root, empty reverse list and absent experiment rules/resources. It verifies the known helper SHA256 before creating its owned pin and six passive mangle rules. It does not install NAT/filter/reject rules or change packet routing marks. Failure rolls back only inserted rules and owned helper/pin. Root setup/restoration is managed separately.

Local probes attempt closed loopback ports18897/18898 as UID10041, shell2000 and isolated10042. Successful verification requires exactly six target-only IPv4/IPv6 NFLOG copies and zero kernel drops. `verify-attribution.mjs` checks the saved fixture without network access. NFLOG batching needs two seconds after probes to flush; tcpdump immediate mode alone does not flush this kernel buffer. The initial attempt in `protocol-2026-10-25-r2` saved zero packets and rolled back; that directory is diagnostic only, not a registered recording. After adding the flush wait, `protocol-2026-10-25-r2a` saved six expected copies and zero drops. Evidence: `preparation.json`, `attribution-stats.log`, ignored `attribution.local-only.pcap` and `rules-before.local-only.txt`. The script was subsequently strengthened to require a connection-refused result for every closed-port probe and save per-UID probe results; that extra diagnostic was not rerun during active gameplay, and is not retroactively claimed as evidence of this setup.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File analysis/tools/prepare-passive-capture.ps1 -OutputDirectory analysis/captures/protocol-2026-10-25-r2a
powershell -NoProfile -ExecutionPolicy Bypass -File analysis/tools/protocol-capture.ps1 -Action Start -OutputDirectory analysis/captures/protocol-2026-10-25-r2a
powershell -NoProfile -ExecutionPolicy Bypass -File analysis/tools/protocol-capture.ps1 -Action Launch -OutputDirectory analysis/captures/protocol-2026-10-25-r2a
```

These commands document the completed preparation. Do not rerun preparation/Start on this active directory. Collector PID4467, UID log PID4488. Root setting true and actual su available. On user pause/end, Stop with this explicit output directory saves and cleans without restarting the game. Recheck actual state rather than relying on these historical PID values.

## Account Correction

After the first launch, user reported the wrong account and explicitly requested reopening. A checkpoint marked `account-correction-before-reopen` saved616 packets/0drops. Only the original game was force-stopped and relaunched under this request; collectors remained running. Earlier connections are not evidence of the intended account's login or persistence. Do not compare hero/resource identities across these accounts. Raw identity values remain only in ignored files. The user subsequently confirmed correct-account hall arrival plus20 seconds idle. Fresh tcp-69 handshake/login acceptance and active lifecycle are recorded in [second-recording.md](second-recording.md).
