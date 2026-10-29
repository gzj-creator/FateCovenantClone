param([ValidateSet('Setup','Restore','Status','Launch','Stop')][string]$Action = 'Status')
$ErrorActionPreference = 'Stop'
$adb = 'C:/Users/gzj/AppData/Local/Android/Sdk/platform-tools/adb.exe'
$serial = '127.0.0.1:16448'
$pin = '/sys/fs/bpf/fc_p1_ps_uid'
$output = 'analysis/experiments/private-server-20261025/p3'
$stateFile = Join-Path $output 'network-state.local-only.json'
function Device([string]$Command) {
    $result = & $adb -s $serial shell $Command
    if ($LASTEXITCODE -ne 0) { throw "Device command failed: $Command" }
    return ($result -join [Environment]::NewLine).Trim()
}
function Root([string]$Command) { Device "su -c '$Command'" }
if ((Device 'cmd package list packages -U com.jzyx.ps') -ne 'package:com.jzyx.ps uid:10042') { throw 'Isolated package UID changed' }
if ($Action -eq 'Restore') {
    if (-not (Test-Path $stateFile)) { throw 'No owned network setup to restore' }
    if ((& $adb -s $serial shell pidof com.jzyx.ps)) { throw 'Isolated client must be stopped before restore' }
    $state = Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
    if ($state.serial -ne $serial -or $state.package -ne 'com.jzyx.ps' -or $state.uid -ne 10042 -or $state.pin -ne $pin) {
        throw 'Recorded network setup identity mismatch'
    }
    Root "test ! -e $pin" | Out-Null
    foreach ($family in @('iptables','ip6tables')) {
        if ((Root "$family -S") -match 'FC_LOCAL_') { throw 'Partial local chains already exist; inspect before restore' }
    }
    if ((& $adb -s $serial reverse --list)) { throw 'Unexpected reverse mapping' }
    $helper = Join-Path $output '../p2/uid10042-helper'
    if ((Get-FileHash $helper -Algorithm SHA256).Hash.ToLowerInvariant() -ne 'add2f70e9ff26a3f169379574340ce1b7fdeafb6aeefa7cde3f3c9810b60b940') { throw 'Helper identity mismatch' }
    & $adb -s $serial push $helper /data/local/tmp/fc-local-uid-helper | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Helper push failed' }
    Root 'chmod 700 /data/local/tmp/fc-local-uid-helper; /data/local/tmp/fc-local-uid-helper' | Out-Null
    foreach ($command in $state.commands) { Root $command | Out-Null }
    foreach ($port in $state.reverse) {
        & $adb -s $serial reverse "tcp:$port" "tcp:$port"
        if ($LASTEXITCODE -ne 0) { throw 'Reverse failed' }
    }
}
if ($Action -eq 'Setup') {
    if (Test-Path $stateFile) { throw 'Existing setup state must be inspected first' }
    if ((& $adb -s $serial shell pidof com.jzyx.ps) ) { throw 'Isolated client must be stopped before setup' }
    Root "test ! -e $pin" | Out-Null
    foreach ($family in @('iptables','ip6tables')) {
        if ((Root "$family -S") -match 'FC_LOCAL_') { throw 'Local chains already exist' }
    }
    if ((& $adb -s $serial reverse --list)) { throw 'Unexpected reverse mapping' }
    $helper = Join-Path $output '../p2/uid10042-helper'
    if ((Get-FileHash $helper -Algorithm SHA256).Hash.ToLowerInvariant() -ne 'add2f70e9ff26a3f169379574340ce1b7fdeafb6aeefa7cde3f3c9810b60b940') { throw 'Helper identity mismatch' }
    & $adb -s $serial push $helper /data/local/tmp/fc-local-uid-helper | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Helper push failed' }
    Root 'chmod 700 /data/local/tmp/fc-local-uid-helper; /data/local/tmp/fc-local-uid-helper'
    $commands = @()
    foreach ($family in @('iptables','ip6tables')) {
        $commands += "$family -N FC_LOCAL_OUT"
        $destination = if ($family -eq 'iptables') { '127.0.0.0/8' } else { '::1' }
        $commands += "$family -A FC_LOCAL_OUT -d $destination -j ACCEPT"
        $commands += "$family -A FC_LOCAL_OUT -j REJECT"
        $commands += "$family -I OUTPUT 1 -m bpf --object-pinned $pin -j FC_LOCAL_OUT"
    }
    $commands += 'iptables -t nat -N FC_LOCAL_NAT'
    foreach ($pair in @(@(80,18880),@(10002,18881),@(3031,18881),@(3033,19090),@(9001,18882))) {
        $commands += "iptables -t nat -A FC_LOCAL_NAT -p tcp --dport $($pair[0]) -j REDIRECT --to-ports $($pair[1])"
    }
    $commands += "iptables -t nat -I OUTPUT 1 -m bpf --object-pinned $pin -j FC_LOCAL_NAT"
    $state = [ordered]@{ serial=$serial; package='com.jzyx.ps'; uid=10042; pin=$pin; rootSetting='true'; commands=@(); reverse=@(); setupUtc=[DateTime]::UtcNow.ToString('o') }
    foreach ($command in $commands) {
        Root $command | Out-Null
        $state.commands += $command
        $state | ConvertTo-Json -Depth 5 | Set-Content $stateFile -Encoding UTF8
    }
    foreach ($port in @(18880,18881,18882,19090)) {
        & $adb -s $serial reverse "tcp:$port" "tcp:$port"
        if ($LASTEXITCODE -ne 0) { throw 'Reverse failed' }
        $state.reverse += $port
        $state | ConvertTo-Json -Depth 5 | Set-Content $stateFile -Encoding UTF8
    }
}
if ($Action -eq 'Launch') {
    if (-not (Test-Path $stateFile)) { throw 'Network setup not recorded' }
    foreach ($family in @('iptables','ip6tables')) { Root "$family -C OUTPUT -m bpf --object-pinned $pin -j FC_LOCAL_OUT" | Out-Null }
    Device 'am start -n com.jzyx.ps/com.jzyx.support.JZPolicyActivity'
}
if ($Action -eq 'Stop') {
    if (-not (Test-Path $stateFile)) { throw 'No owned network setup' }
    Device 'am force-stop com.jzyx.ps'
    Root "iptables -t nat -D OUTPUT -m bpf --object-pinned $pin -j FC_LOCAL_NAT"
    Root 'iptables -t nat -F FC_LOCAL_NAT; iptables -t nat -X FC_LOCAL_NAT'
    foreach ($family in @('iptables','ip6tables')) {
        Root "$family -D OUTPUT -m bpf --object-pinned $pin -j FC_LOCAL_OUT"
        Root "$family -F FC_LOCAL_OUT; $family -X FC_LOCAL_OUT"
    }
    foreach ($port in @(18880,18881,18882,19090)) { & $adb -s $serial reverse --remove "tcp:$port" }
    Root "rm $pin /data/local/tmp/fc-local-uid-helper"
    Move-Item -LiteralPath $stateFile -Destination ($stateFile + '.stopped')
    exit
}
Root 'iptables -t nat -S FC_LOCAL_NAT; iptables -nvL FC_LOCAL_OUT; ip6tables -nvL FC_LOCAL_OUT'
& $adb -s $serial reverse --list
