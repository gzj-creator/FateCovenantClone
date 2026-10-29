[CmdletBinding()]
param(
    [ValidateSet('Discover', 'Setup', 'Test', 'Smoke', 'BuildAndroid', 'BuildWindows')]
    [string]$Action = 'Discover',
    [string]$EditorPath
)

$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$unityRoot = Join-Path $projectRoot 'unity/FateCovenantClone'
$version = '6000.0.85f1'
$logRoot = Join-Path $projectRoot 'analysis/test-runs/unity'
New-Item -ItemType Directory -Force -Path $logRoot | Out-Null

if (-not $EditorPath -and $env:FATE_UNITY_EDITOR) { $EditorPath = $env:FATE_UNITY_EDITOR }
if (-not $EditorPath) {
    $candidates = @(
        (Join-Path $projectRoot ".toolchain/Unity/$version/Editor/Unity.exe"),
        "C:/Program Files/Unity/Hub/Editor/$version/Editor/Unity.exe",
        "D:/Software/$version/Editor/Unity.exe"
    )
    $EditorPath = $candidates | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1
}
if (-not $EditorPath -or -not (Test-Path -LiteralPath $EditorPath -PathType Leaf)) {
    throw "Unity $version editor not found. Install using tools/install-unity-toolchain.ps1, then rerun; or pass -EditorPath <absolute Unity.exe path>. No Unity or Android validation has run."
}
$EditorPath = [System.IO.Path]::GetFullPath($EditorPath)
$actualVersion = (Get-Item -LiteralPath $EditorPath).VersionInfo.ProductVersion
if ($actualVersion -and -not $actualVersion.StartsWith($version)) {
    throw "Pinned editor is $version, but '$EditorPath' reports '$actualVersion'. Do not silently upgrade or downgrade this project."
}
if ($Action -eq 'Discover') {
    [pscustomobject]@{ Editor = $EditorPath; Version = $actualVersion; Android = Test-Path -LiteralPath (Join-Path (Split-Path $EditorPath) 'Data/PlaybackEngines/AndroidPlayer') }
    exit 0
}
if ($Action -eq 'BuildAndroid' -and -not (Test-Path -LiteralPath (Join-Path (Split-Path $EditorPath) 'Data/PlaybackEngines/AndroidPlayer'))) {
    throw 'Android Build Support is missing from the pinned Unity editor. Install its Android SDK/NDK/OpenJDK modules first.'
}
if (Test-Path -LiteralPath (Join-Path $unityRoot 'Temp/UnityLockfile')) {
    throw 'The Unity project is already open. Close that editor before invoking batch automation.'
}
$logPath = Join-Path $logRoot ($Action.ToLowerInvariant() + '.log')
$arguments = @('-batchmode', '-projectPath', $unityRoot, '-logFile', $logPath)
if ($Action -eq 'Smoke') {
    $arguments += @('-executeMethod', 'FateCovenant.Editor.ProjectAutomation.Smoke')
} else {
    $arguments += @('-quit', '-nographics', '-executeMethod', ('FateCovenant.Editor.ProjectAutomation.' + $Action))
}
if ($Action -eq 'BuildAndroid') { $arguments += @('-buildTarget', 'Android') }
if ($Action -eq 'BuildWindows') { $arguments += @('-buildTarget', 'Win64') }
$startedAt = Get-Date
& $EditorPath @arguments
$editorExitCode = $LASTEXITCODE
$reportPath = Join-Path $logRoot ($Action.ToLowerInvariant() + '-result.json')
[pscustomobject]@{ Action = $Action; Editor = $EditorPath; Version = $actualVersion; Started = $startedAt.ToUniversalTime().ToString('o'); ExitCode = $editorExitCode; Log = $logPath } | ConvertTo-Json | Set-Content -LiteralPath $reportPath -Encoding UTF8
if ($editorExitCode -ne 0) {
    if (Test-Path -LiteralPath $logPath) { Get-Content -LiteralPath $logPath -Tail 70 }
    throw "Unity $Action failed with exit code $editorExitCode. See $logPath"
}
Write-Output "Unity $Action completed. Log: $logPath"
