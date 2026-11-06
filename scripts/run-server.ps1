$ErrorActionPreference = 'Stop'

function Find-MainWorktree([string]$SeedRoot) {
  $lines = @(& git -C $SeedRoot worktree list --porcelain)
  if ($LASTEXITCODE -ne 0) { throw "git worktree list failed for $SeedRoot" }
  $index = [Array]::IndexOf($lines, 'branch refs/heads/main')
  if ($index -gt 0 -and $lines[$index - 1].StartsWith('worktree ')) {
    return $lines[$index - 1].Substring(9)
  }
  return $SeedRoot
}

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$seedRoot = (Resolve-Path -LiteralPath (Join-Path $scriptRoot '..')).Path
$serverRoot = (Resolve-Path -LiteralPath (Find-MainWorktree $seedRoot)).Path
$serverScript = Join-Path $serverRoot 'personal-server\local-server.mjs'
if (-not (Test-Path -LiteralPath $serverScript)) {
  throw "Server entry not found: $serverScript"
}

$node = Get-Command node.exe -ErrorAction Stop
$protobufPackage = Join-Path $serverRoot 'personal-server\node_modules\protobufjs\package.json'
if (-not (Test-Path -LiteralPath $protobufPackage)) {
  Write-Host '[SETUP] Installing locked server dependencies...'
  $npm = Get-Command npm.cmd -ErrorAction Stop
  Push-Location (Join-Path $serverRoot 'personal-server')
  try {
    & $npm.Source ci --ignore-scripts --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw 'npm ci failed' }
  } finally {
    Pop-Location
  }
}

$runtimeDir = if ($env:FC_LOCAL_DATA) {
  [IO.Path]::GetFullPath($env:FC_LOCAL_DATA)
} else {
  Join-Path $serverRoot 'personal-server\runtime.local-only.data'
}
$env:FC_LOCAL_DATA = $runtimeDir
$statePath = Join-Path $runtimeDir 'server.local-only.json'
$runningPid = $null
if (Test-Path -LiteralPath $statePath) {
  try {
    $state = Get-Content -Raw -LiteralPath $statePath | ConvertFrom-Json
    $candidate = Get-Process -Id $state.pid -ErrorAction SilentlyContinue
    if ($candidate -and (Split-Path -Leaf $candidate.Path) -eq 'node.exe') {
      $runningPid = [int]$state.pid
    }
  } catch {
    $runningPid = $null
  }
}

if ($runningPid) {
  Write-Host "[OK] Server is already running. PID=$runningPid"
} else {
  New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $stdout = Join-Path $runtimeDir "server-$stamp.local-only.out.log"
  $stderr = Join-Path $runtimeDir "server-$stamp.local-only.err.log"
  $argument = '"' + $serverScript + '"'
  $process = Start-Process -FilePath $node.Source -ArgumentList $argument -WorkingDirectory $serverRoot -WindowStyle Hidden -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru

  $deadline = (Get-Date).AddSeconds(30)
  $ready = $false
  while ((Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 250
    if ($process.HasExited) { break }
    if (Test-Path -LiteralPath $statePath) {
      try { $published = Get-Content -Raw -LiteralPath $statePath | ConvertFrom-Json } catch { continue }
      if ($published.pid -eq $process.Id) {
        $ready = $true
        break
      }
    }
  }
  if (-not $ready) {
    $tail = if (Test-Path -LiteralPath $stderr) { (Get-Content -LiteralPath $stderr -Tail 40) -join [Environment]::NewLine } else { '' }
    throw "Server PID $($process.Id) did not become ready.`nstdout: $stdout`nstderr: $stderr`n$tail"
  }
  Write-Host "[OK] Server started. PID=$($process.Id)"
  Write-Host "     stdout: $stdout"
  Write-Host "     stderr: $stderr"
}

$adbPath = 'E:\Mumu\MuMuPlayer\nx_main\adb.exe'
if (Test-Path -LiteralPath $adbPath) {
  & $adbPath connect 127.0.0.1:16448 *> $null
  $devices = @(& $adbPath devices)
  $deviceReady = $devices | Where-Object { $_ -match '^127\.0\.0\.1:16448\s+device$' }
  if ($deviceReady) {
    $deviceTool = Join-Path $serverRoot 'tools\local-server-device.ps1'
    $powershell = Get-Command powershell.exe -ErrorAction Stop
    & $powershell.Source -NoProfile -ExecutionPolicy Bypass -File $deviceTool -Action Setup
    if ($LASTEXITCODE -ne 0) {
      throw 'Server is running, but device port redirection setup failed.'
    }
  } else {
    Write-Host '[INFO] MuMu ADB device is not connected; device setup skipped.'
  }
}

Write-Host "     root:  $serverRoot"
Write-Host '     admin: http://127.0.0.1:18883/'
