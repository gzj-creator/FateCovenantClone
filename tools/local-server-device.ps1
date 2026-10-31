param([ValidateSet('Setup','Restore','Status','Launch','Stop')][string]$Action = 'Status')
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$adb = 'E:/Mumu/MuMuPlayer/nx_main/adb.exe'
$serial = '127.0.0.1:16448'
$package = 'com.jzyx.ps'
$pin = '/sys/fs/bpf/fc_p1_ps_uid'
$output = Join-Path $projectRoot 'analysis/experiments/private-server-20261025/p3'
$stateFile = Join-Path $output 'network-state.local-only.json'

function Device([string]$Command) {
    $result = & $adb -s $serial shell $Command
    if ($LASTEXITCODE -ne 0) { throw "Device command failed: $Command" }
    return ($result -join [Environment]::NewLine).Trim()
}

function Root([string]$Command) {
    Device "su -c '$Command'"
}

function InstalledUid {
    $line = Device "cmd package list packages -U $package"
    if ($line -notmatch "^package:$([regex]::Escape($package)) uid:([0-9]+)$") { return $null }
    return [int]$Matches[1]
}

function ClientRunning {
    return [bool](& $adb -s $serial shell pidof $package)
}

function RemoveRecordedSetup($state, [string]$Suffix) {
    if ($state.serial -ne $serial -or $state.package -ne $package -or $state.pin -ne $pin) {
        throw 'Recorded network setup identity mismatch'
    }
    if (ClientRunning) { Device "am force-stop $package" | Out-Null }
    Root "iptables -t nat -D OUTPUT -m bpf --object-pinned $pin -j FC_LOCAL_NAT" | Out-Null
    Root 'iptables -t nat -F FC_LOCAL_NAT; iptables -t nat -X FC_LOCAL_NAT' | Out-Null
    foreach ($family in @('iptables','ip6tables')) {
        Root "$family -D OUTPUT -m bpf --object-pinned $pin -j FC_LOCAL_OUT" | Out-Null
        Root "$family -F FC_LOCAL_OUT; $family -X FC_LOCAL_OUT" | Out-Null
    }
    foreach ($port in @($state.reverse)) { & $adb -s $serial reverse --remove "tcp:$port" | Out-Null }
    Root "rm -f $pin /data/local/tmp/fc-local-uid-helper" | Out-Null
    $stopped = $stateFile + ".stopped$Suffix"
    if (Test-Path -LiteralPath $stopped) { throw "Stopped state already exists: $stopped" }
    Move-Item -LiteralPath $stateFile -Destination $stopped
}

if ($Action -eq 'Restore' -or $Action -eq 'Stop') {
    if (-not (Test-Path -LiteralPath $stateFile)) { throw 'No owned network setup to restore' }
    $state = Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
    RemoveRecordedSetup $state "-uid$($state.uid)"
    exit
}

$uid = InstalledUid
if ($null -eq $uid) { throw "Isolated package is not installed: $package" }

if ($Action -eq 'Setup') {
    if (Test-Path -LiteralPath $stateFile) { throw 'Existing setup state must be inspected and restored first' }
    if (ClientRunning) { throw 'Isolated client must be stopped before setup' }
    Root "test ! -e $pin" | Out-Null
    foreach ($family in @('iptables','ip6tables')) {
        if ((Root "$family -S") -match 'FC_LOCAL_') { throw 'Local chains already exist' }
    }
    if ((& $adb -s $serial reverse --list)) { throw 'Unexpected reverse mapping' }

    $helper = Join-Path $output "../p2/uid$uid-helper"
    if (-not (Test-Path -LiteralPath $helper)) {
        & node (Join-Path $projectRoot 'analysis/tools/build-uid-bpf-helper.mjs') $helper $uid $pin
        if ($LASTEXITCODE -ne 0) { throw 'BPF helper build failed' }
    }
    $helperSha256 = (Get-FileHash -LiteralPath $helper -Algorithm SHA256).Hash.ToLowerInvariant()
    & $adb -s $serial push $helper /data/local/tmp/fc-local-uid-helper | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Helper push failed' }
    Root 'chmod 700 /data/local/tmp/fc-local-uid-helper; /data/local/tmp/fc-local-uid-helper' | Out-Null

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
    $state = [ordered]@{
        serial=$serial; package=$package; uid=$uid; pin=$pin; rootSetting='true'; helper=$helper;
        helperSha256=$helperSha256; commands=@(); reverse=@(); setupUtc=[DateTime]::UtcNow.ToString('o')
    }
    foreach ($command in $commands) {
        Root $command | Out-Null
        $state.commands += $command
        $state | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $stateFile -Encoding UTF8
    }
    foreach ($port in @(18880,18881,18882,19090)) {
        & $adb -s $serial reverse "tcp:$port" "tcp:$port"
        if ($LASTEXITCODE -ne 0) { throw 'Reverse failed' }
        $state.reverse += $port
        $state | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $stateFile -Encoding UTF8
    }
}

if ($Action -eq 'Launch') {
    if (-not (Test-Path -LiteralPath $stateFile)) { throw 'Network setup not recorded' }
    $state = Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
    if ($state.uid -ne $uid) { throw 'Installed UID differs from recorded network setup' }
    foreach ($family in @('iptables','ip6tables')) {
        Root "$family -C OUTPUT -m bpf --object-pinned $pin -j FC_LOCAL_OUT" | Out-Null
    }
    Device "am start -n $package/com.jzyx.support.JZPolicyActivity"
}

Root 'iptables -t nat -S FC_LOCAL_NAT; iptables -nvL FC_LOCAL_OUT; ip6tables -nvL FC_LOCAL_OUT'
& $adb -s $serial reverse --list
