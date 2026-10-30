# Login Storage Repair

2026-10-25, source package `com.jzyx.my`, UID 10041, device `127.0.0.1:16448` only.

The user's first attempts reached SDK renewal and the server picker. Pressing the login button failed before a game-gateway connection: the target UID log records `SQLiteException: Attempt to write a read-only database`, through `Storage.SaveClient` and `LoginFlow.lua:308`.

Read-only checks found `LocalData.db`, `Logs/Cache.log`, `Logs/Config.log`, and `Logs/Update.log` owned by UID 2000 (`shell`), GID 1078, mode 0644, context `u:object_r:storage_file:s0`. Their parent directories belong to UID 10041 and use `u:object_r:media_rw_data_file:s0:c41,c256,c512,c768`. This supplies a concrete local write failure; the reason the old files acquired those attributes is not established.

Before changing metadata, saved a tar snapshot and numeric owner/context evidence in `analysis/captures/protocol-2026-10-25/`. Snapshot `storage-before.local-only.tar` SHA256: `3e6d8dd0e627f3c8f69717541507bb154aa58f4ca35eb20b4ce108c2fe796190`. It is ignored because it contains cached identity data.

Changed only these four files to UID 10041, preserved GID 1078 and mode 0644, and used their parent directory's security context. No database records, account settings, APK, routing, or app state were changed by the repair. Database SHA256 before and immediately after remained `4d79fdb8d0f725c93f8ed0391197423847cb2687f836e70e52debec8f6af5d41`, matching the old backup baseline.

Commands used for each exact file below `/data/media/0/Android/data/com.jzyx.my/files/`:

```powershell
$adb = 'C:/Users/gzj/AppData/Local/Android/Sdk/platform-tools/adb.exe'
# $file is one of the four explicit paths listed above, without spaces.
& $adb -s 127.0.0.1:16448 shell "su -c 'chown 10041:1078 $file'"
& $adb -s 127.0.0.1:16448 shell "su -c 'chcon u:object_r:media_rw_data_file:s0:c41,c256,c512,c768 $file'"
```

Evidence: `storage-permissions-before.txt`, `storage-permissions-after.txt`, `storage-db-before.sha256`, `storage-db-after.sha256`, `login-issue-summary.json`, and ignored original `target.local-only.log`. A standalone `su 10041` access test lacks the application's storage mount namespace and supplemental groups, so its access denial does not validate the application's result.

The user closed the stuck application, then the agent relaunched the explicitly selected source activity under the user's launch authorization. Passive collection continued. Successful post-repair login, handshake, and payload decoding remain separate runtime gates until the next capture confirms them. Do not restore the broken permissions automatically at session cleanup; the saved metadata and tar remain available for an explicitly requested rollback.
