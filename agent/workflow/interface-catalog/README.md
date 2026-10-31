# Unified Interface Catalog

Original client com.jzyx.my, version 1.55.090365 / 362155; device 127.0.0.1:16448, UID10041. This directory combines scoped shipped declarations with passive user-gameplay evidence.

- [Coverage](coverage.md): static, observed, decoded and user-operation counts.
- [Not implemented C2S interfaces](not-implemented-interfaces.md): current server routing audit, explicit refusals, placeholders and the complete unrouted backlog.
- [Machine-readable catalog](interfaces.json): schemaVersion 2, with a recordings array preserving individual hashes, counters, sources and handshake modes.
- [HTTP](http-interfaces.md), [TCP and controls](tcp-commands.md), [pushes](server-pushes.md).
- [Static evidence](static-evidence.md), [login](../capture-workflow/login-decode.md), [battle and lineup](../capture-workflow/battle-and-lineup.md), [hero progression](../capture-workflow/hero-progression.md).
- [Multiple recordings](../capture-workflow/multiple-recordings.md): registration, staging and acceptance.

Reproduce offline from all registered recordings:

```powershell
node --test analysis/tools/protocol/capture-codec.test.mjs analysis/tools/protocol/catalog-recordings.test.mjs
node analysis/tools/protocol/build-interface-catalog.mjs
```

The manifest is analysis/tools/protocol/recordings.json. Add each new recording once, with a unique stable ID. Positional capture directories supplement the manifest; they never replace its existing recordings. Use --output <staging-directory> to review before publishing and --manifest <file> for isolated test inputs. Paths in manifests are relative to the project root.

Checkpoint and decode the active directory explicitly before rebuilding. Do not checkpoint stopped old recordings. Every event, flow and action reference is prefixed recording:<recording-id>:. Observations retain localId for lookup in their own decode-summary.json; packet numbers and offsets remain local to that recording. Existing workflow documents use these local IDs. An HTTP action can only match observations in its own recording.

PCAP, logs, decoded scalar values and screenshots remain ignored *.local-only.* files. Public shapes omit runtime scalar values and dictionary keys. HTTP grouping omits hosts; TLS paths remain unknown. Node tools never send game traffic. Stop saves and cleans collection without restarting the game.
