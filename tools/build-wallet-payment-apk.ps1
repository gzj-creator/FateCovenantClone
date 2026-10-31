param(
    [Parameter(Mandatory = $true)]
    [string]$SourceApk,
    [Parameter(Mandatory = $true)]
    [string]$OutputApk,
    [Parameter(Mandatory = $true)]
    [string]$PatchedLuaBundle,
    [Parameter(Mandatory = $true)]
    [string]$PatchedLanguageBundle,
    [string]$OriginalDex = ''
)
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$SourceApk = [IO.Path]::GetFullPath($SourceApk)
$OutputApk = [IO.Path]::GetFullPath($OutputApk)
$PatchedLuaBundle = [IO.Path]::GetFullPath($PatchedLuaBundle)
$PatchedLanguageBundle = [IO.Path]::GetFullPath($PatchedLanguageBundle)
if (-not $OriginalDex) {
    $OriginalDex = Join-Path $projectRoot 'analysis/reports/private-client-16448/candidate/classes6.dex'
}
$OriginalDex = [IO.Path]::GetFullPath($OriginalDex)
if ($SourceApk -eq $OutputApk) { throw 'Source APK must never be the output path.' }
if (Test-Path -LiteralPath $OutputApk) { throw 'Output APK already exists; refusing overwrite.' }
foreach ($path in @($SourceApk, $PatchedLuaBundle, $PatchedLanguageBundle, $OriginalDex)) {
    if (-not (Test-Path -LiteralPath $path)) { throw "Required input is unavailable: $path" }
}

$buildRoot = Join-Path $projectRoot 'analysis/test-runs/isolated-apk-builder'
New-Item -ItemType Directory -Force -Path $buildRoot | Out-Null
$compiler = 'C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe'
$jsonNet = 'C:/Program Files/Microsoft OfficePLUS/3.9.0.20938/service/Newtonsoft.Json.dll'
$zipLib = 'D:/Software/ShiZai/Z-Factory/7.1.0.2/resources/rpa-engine/dll/ElementSDKV1/II.RPA.PluginLoader/ICSharpCode.SharpZipLib.dll'
if (-not (Test-Path -LiteralPath $zipLib)) { $zipLib = Join-Path $buildRoot 'ICSharpCode.SharpZipLib.dll' }
if (-not (Test-Path -LiteralPath $compiler) -or -not (Test-Path -LiteralPath $jsonNet) -or -not (Test-Path -LiteralPath $zipLib)) {
    throw 'Required existing compiler, JSON.NET, or ZIP writer is unavailable.'
}

$executable = Join-Path $buildRoot 'WalletPaymentApkBuilder.exe'
& $compiler /nologo /target:exe /reference:System.Core.dll /reference:System.Xml.Linq.dll /reference:System.IO.Compression.dll /reference:System.IO.Compression.FileSystem.dll "/reference:$jsonNet" "/reference:$zipLib" "/out:$executable" (Join-Path $PSScriptRoot 'IsolatedApkBuilder/Program.cs')
if ($LASTEXITCODE -ne 0) { throw 'Wallet payment APK builder compilation failed.' }
Copy-Item -LiteralPath $jsonNet -Destination (Join-Path $buildRoot 'Newtonsoft.Json.dll') -Force
if ([IO.Path]::GetFullPath($zipLib) -ne [IO.Path]::GetFullPath((Join-Path $buildRoot 'ICSharpCode.SharpZipLib.dll'))) {
    Copy-Item -LiteralPath $zipLib -Destination (Join-Path $buildRoot 'ICSharpCode.SharpZipLib.dll') -Force
}

New-Item -ItemType Directory -Force -Path ([IO.Path]::GetDirectoryName($OutputApk)) | Out-Null
& $executable --patch-wallet $SourceApk $OutputApk $PatchedLuaBundle $OriginalDex $PatchedLanguageBundle
if ($LASTEXITCODE -ne 0) {
    throw 'Wallet payment APK patch failed. Any partial output is not installable.'
}
