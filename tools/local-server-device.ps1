param([ValidateSet('Setup','Restore','Status','Launch','Stop')][string]$Action = 'Status')
$ErrorActionPreference = 'Stop'

$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$adb = 'E:/Mumu/MuMuPlayer/nx_main/adb.exe'
$serial = '127.0.0.1:16448'
$package = 'com.jzyx.ps'
$launchActivity = 'com.jzyx.support.JZPolicyActivity'
$chain = 'FC_LOCAL_NAT'
$loopback = '127.0.0.1'
$reversePorts = @(18880, 18881, 18882, 19090)
$natMappings = @(
    @(80, 18880),
    @(10002, 18881),
    @(3031, 18881),
    @(3033, 19090),
    @(9001, 18882)
)
$output = Join-Path $projectRoot 'analysis/experiments/private-server-20261025/p3'
$stateFile = Join-Path $output 'network-state.local-only.json'

function Device([string[]]$Command) {
    $result = & $adb -s $serial shell @Command 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Device command failed: $($Command -join ' ')\n$($result -join [Environment]::NewLine)"
    }
    return (($result | ForEach-Object { "$_" }) -join [Environment]::NewLine).Trim()
}

function Root([string[]]$Command) {
    $result = & $adb -s $serial shell su 0 @Command 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Root command failed: $($Command -join ' ')\n$($result -join [Environment]::NewLine)"
    }
    return (($result | ForEach-Object { "$_" }) -join [Environment]::NewLine).Trim()
}

function RootIgnored([string[]]$Command) {
    & $adb -s $serial shell su 0 @Command *> $null
}

function TestRoot([string[]]$Command) {
    & $adb -s $serial shell su 0 @Command *> $null
    return $LASTEXITCODE -eq 0
}

function InstalledUid {
    $line = Device @('cmd', 'package', 'list', 'packages', '-U', $package)
    if ($line -notmatch "^package:$([regex]::Escape($package)) uid:([0-9]+)$") { return $null }
    return [int]$Matches[1]
}

function ClientRunning {
    return [bool](& $adb -s $serial shell pidof $package)
}

function ReverseList {
    return @(& $adb -s $serial reverse --list)
}

function TestReverseConfigured {
    $lines = ReverseList
    foreach ($port in $reversePorts) {
        if (-not ($lines | Where-Object { $_ -match "\btcp:$port\s+tcp:$port$" })) { return $false }
    }
    return $true
}

function TestNatConfigured {
    if (-not (TestRoot @('iptables', '-t', 'nat', '-S', $chain))) { return $false }
    if (-not (TestRoot @('iptables', '-t', 'nat', '-C', 'OUTPUT', '-p', 'tcp', '-d', $loopback, '-j', $chain))) { return $false }
    foreach ($mapping in $natMappings) {
        if (-not (TestRoot @('iptables', '-t', 'nat', '-C', $chain, '-p', 'tcp', '--dport', "$($mapping[0])", '-j', 'REDIRECT', '--to-ports', "$($mapping[1])"))) {
            return $false
        }
    }
    return $true
}

function TestConfigured {
    return (TestNatConfigured) -and (TestReverseConfigured)
}

function ReadOwnedState {
    if (-not (Test-Path -LiteralPath $stateFile)) { return $null }
    $state = Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
    if ($state.serial -ne $serial -or $state.package -ne $package) {
        throw 'Recorded device setup identity mismatch'
    }
    return $state
}

function WriteState([int]$uid) {
    New-Item -ItemType Directory -Force -Path $output | Out-Null
    [ordered]@{
        serial = $serial
        package = $package
        uid = $uid
        mode = 'loopback-nat-no-bpf'
        chain = $chain
        loopback = $loopback
        reverse = $reversePorts
        natMappings = @($natMappings | ForEach-Object { "$($_[0])->$($_[1])" })
        setupUtc = [DateTime]::UtcNow.ToString('o')
    } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $stateFile -Encoding UTF8
}

function RemoveLoopbackSetup([object]$state, [bool]$stopClient) {
    if ($stopClient -and (ClientRunning)) { Device @('am', 'force-stop', $package) | Out-Null }
    RootIgnored @('iptables', '-t', 'nat', '-D', 'OUTPUT', '-p', 'tcp', '-d', $loopback, '-j', $chain)
    RootIgnored @('iptables', '-t', 'nat', '-F', $chain)
    RootIgnored @('iptables', '-t', 'nat', '-X', $chain)
    $ports = if ($state -and $state.reverse) { @($state.reverse) } else { $reversePorts }
    foreach ($port in $ports) { & $adb -s $serial reverse --remove "tcp:$port" *> $null }
}

function RemoveLegacySetup([object]$state, [bool]$stopClient) {
    if ($stopClient -and (ClientRunning)) { Device @('am', 'force-stop', $package) | Out-Null }
    $pin = [string]$state.pin
    if ($pin) {
        RootIgnored @('iptables', '-t', 'nat', '-D', 'OUTPUT', '-m', 'bpf', '--object-pinned', $pin, '-j', 'FC_LOCAL_NAT')
        RootIgnored @('iptables', '-t', 'nat', '-F', 'FC_LOCAL_NAT')
        RootIgnored @('iptables', '-t', 'nat', '-X', 'FC_LOCAL_NAT')
        foreach ($family in @('iptables', 'ip6tables')) {
            RootIgnored @($family, '-D', 'OUTPUT', '-m', 'bpf', '--object-pinned', $pin, '-j', 'FC_LOCAL_OUT')
            RootIgnored @($family, '-F', 'FC_LOCAL_OUT')
            RootIgnored @($family, '-X', 'FC_LOCAL_OUT')
        }
        RootIgnored @('rm', '-f', $pin, '/data/local/tmp/fc-local-uid-helper')
    }
    foreach ($port in @($state.reverse)) { & $adb -s $serial reverse --remove "tcp:$port" *> $null }
}

function RemoveRecordedSetup([bool]$stopClient, [string]$suffix) {
    $state = ReadOwnedState
    if (-not $state) { throw 'No owned network setup to restore' }
    $mode = [string]$state.mode
    if ($mode -in @('loopback-nat', 'loopback-nat-no-bpf')) {
        RemoveLoopbackSetup $state $stopClient
    } else {
        RemoveLegacySetup $state $stopClient
    }
    $stopped = $stateFile + ".stopped-$suffix"
    if (Test-Path -LiteralPath $stopped) { throw "Stopped state already exists: $stopped" }
    Move-Item -LiteralPath $stateFile -Destination $stopped
}

function InstallSetup {
    $uid = InstalledUid
    if ($null -eq $uid) { throw "Isolated package is not installed: $package" }
    if (-not (TestRoot @('id'))) { throw 'Root shell is unavailable; local port redirection cannot be configured' }

    $state = ReadOwnedState
    if ($state) {
        $mode = [string]$state.mode
        if ($mode -notin @('loopback-nat', 'loopback-nat-no-bpf')) {
            throw "Recorded setup uses legacy mode '$mode'; run Restore before Setup"
        }
        if ($state.uid -ne $uid) {
            RemoveLoopbackSetup $state $false
        } elseif (TestConfigured) {
            Write-Host '[OK] Device port redirection and ADB reverse mappings are already configured.'
            return
        } else {
            throw 'Recorded setup is incomplete; run Restore, then Setup again'
        }
    }

    if (TestRoot @('iptables', '-t', 'nat', '-S', $chain)) {
        throw "Unrecorded iptables chain exists: $chain"
    }
    if ((ReverseList).Count -ne 0) { throw 'Unrecorded ADB reverse mappings exist' }

    WriteState $uid
    try {
        Root @('iptables', '-t', 'nat', '-N', $chain) | Out-Null
        foreach ($mapping in $natMappings) {
            Root @('iptables', '-t', 'nat', '-A', $chain, '-p', 'tcp', '--dport', "$($mapping[0])", '-j', 'REDIRECT', '--to-ports', "$($mapping[1])") | Out-Null
        }
        Root @('iptables', '-t', 'nat', '-I', 'OUTPUT', '1', '-p', 'tcp', '-d', $loopback, '-j', $chain) | Out-Null
        foreach ($port in $reversePorts) {
            & $adb -s $serial reverse "tcp:$port" "tcp:$port" | Out-Null
            if ($LASTEXITCODE -ne 0) { throw "ADB reverse failed: $port" }
        }
        if (-not (TestConfigured)) { throw 'Configured rules failed verification' }
    } catch {
        RemoveLoopbackSetup $null $false
        if (Test-Path -LiteralPath $stateFile) { Remove-Item -LiteralPath $stateFile -Force }
        throw
    }
}

function WriteStatus {
    Root @('iptables', '-t', 'nat', '-S', 'OUTPUT')
    Root @('iptables', '-t', 'nat', '-S', $chain)
    $lines = ReverseList
    $lines
}

if ($Action -in @('Restore', 'Stop')) {
    RemoveRecordedSetup ($Action -eq 'Stop') ([DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss'))
    exit
}

switch ($Action) {
    'Setup' {
        InstallSetup
        WriteStatus
    }
    'Launch' {
        $state = ReadOwnedState
        if (-not $state) { throw 'Network setup not recorded; run Setup first' }
        if ($state.uid -ne (InstalledUid)) { throw 'Installed UID differs from recorded network setup' }
        if (-not (TestConfigured)) { throw 'Recorded network setup is incomplete; run Restore, then Setup again' }
        Device @('am', 'start', '-n', "$package/$launchActivity")
        WriteStatus
    }
    default {
        $state = ReadOwnedState
        if (-not $state) { throw 'Network setup not recorded; run Setup first' }
        if (-not (TestConfigured)) { throw 'Recorded network setup is incomplete' }
        WriteStatus
    }
}
