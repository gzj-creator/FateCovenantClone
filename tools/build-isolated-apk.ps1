param(
    [switch]$Build,
    [string]$SourceApk = '',
    [string]$OutputApk = ''
)
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if (-not $SourceApk) { $SourceApk = Join-Path $projectRoot 'analysis/apk/device-pull-16448/com.jzyx.my/base.apk' }
if (-not $OutputApk) { $OutputApk = Join-Path $projectRoot 'analysis/experiments/private-server-20261025/p1/isolated/com.jzyx.ps.unsigned.apk' }
$SourceApk = [IO.Path]::GetFullPath($SourceApk)
$OutputApk = [IO.Path]::GetFullPath($OutputApk)
if ($SourceApk -eq $OutputApk) { throw 'Source APK must never be the output path.' }
if (Test-Path -LiteralPath $OutputApk) { throw 'Output APK already exists; refusing overwrite.' }
$buildRoot = Join-Path $projectRoot 'analysis/test-runs/isolated-apk-builder'
New-Item -ItemType Directory -Force -Path $buildRoot | Out-Null
$compiler = 'C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe'
$jsonNet = 'C:/Program Files/Microsoft OfficePLUS/3.9.0.20938/service/Newtonsoft.Json.dll'
$zipLib = 'D:/Software/ShiZai/Z-Factory/7.1.0.2/resources/rpa-engine/dll/ElementSDKV1/II.RPA.PluginLoader/ICSharpCode.SharpZipLib.dll'
if (-not (Test-Path -LiteralPath $zipLib)) { $zipLib = Join-Path $buildRoot 'ICSharpCode.SharpZipLib.dll' }
if (-not (Test-Path -LiteralPath $compiler) -or -not (Test-Path -LiteralPath $jsonNet) -or -not (Test-Path -LiteralPath $zipLib)) { throw 'Required existing compiler, JSON.NET, or ZIP writer is unavailable.' }
$executable = Join-Path $buildRoot 'IsolatedApkBuilder.exe'
& $compiler /nologo /target:exe /reference:System.Core.dll /reference:System.Xml.Linq.dll /reference:System.IO.Compression.dll /reference:System.IO.Compression.FileSystem.dll "/reference:$jsonNet" "/reference:$zipLib" "/out:$executable" (Join-Path $PSScriptRoot 'IsolatedApkBuilder/Program.cs')
if ($LASTEXITCODE -ne 0) { throw 'APK builder compilation failed.' }
Copy-Item -LiteralPath $jsonNet -Destination (Join-Path $buildRoot 'Newtonsoft.Json.dll') -Force
if ([IO.Path]::GetFullPath($zipLib) -ne [IO.Path]::GetFullPath((Join-Path $buildRoot 'ICSharpCode.SharpZipLib.dll'))) { Copy-Item -LiteralPath $zipLib -Destination (Join-Path $buildRoot 'ICSharpCode.SharpZipLib.dll') -Force }
$action = if ($Build) { '--build' } else { '--inspect' }
& $executable $action $SourceApk $OutputApk
if ($LASTEXITCODE -ne 0) { throw 'APK builder failed. Any partial output remains for inspection; it is not an installable result.' }
