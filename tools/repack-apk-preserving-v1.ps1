param(
    [Parameter(Mandatory = $true)]
    [string]$SourceApk,
    [Parameter(Mandatory = $true)]
    [string]$OutputApk
)
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$SourceApk = [IO.Path]::GetFullPath($SourceApk)
$OutputApk = [IO.Path]::GetFullPath($OutputApk)
if ($SourceApk -eq $OutputApk) { throw 'Source and output must differ.' }
if (Test-Path -LiteralPath $OutputApk) { throw 'Output already exists; refusing to overwrite.' }

$buildRoot = Join-Path $projectRoot 'analysis/test-runs/isolated-apk-builder'
New-Item -ItemType Directory -Force -Path $buildRoot | Out-Null
$compiler = 'C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe'
$zipLib = 'D:/Software/ShiZai/Z-Factory/7.1.0.2/resources/rpa-engine/dll/ElementSDKV1/II.RPA.PluginLoader/ICSharpCode.SharpZipLib.dll'
if (-not (Test-Path -LiteralPath $zipLib)) { $zipLib = Join-Path $buildRoot 'ICSharpCode.SharpZipLib.dll' }
if (-not (Test-Path -LiteralPath $compiler) -or -not (Test-Path -LiteralPath $zipLib)) { throw 'Required compiler or ZIP library is unavailable.' }

$executable = Join-Path $buildRoot 'RepackPreservingV1.exe'
& $compiler /nologo /target:exe '/reference:System.Core.dll' "/reference:$zipLib" "/out:$executable" (Join-Path $PSScriptRoot 'IsolatedApkBuilder/RepackPreservingV1.cs')
if ($LASTEXITCODE -ne 0) { throw 'APK repack tool compilation failed.' }
if ([IO.Path]::GetFullPath($zipLib) -ne [IO.Path]::GetFullPath((Join-Path $buildRoot 'ICSharpCode.SharpZipLib.dll'))) {
    Copy-Item -LiteralPath $zipLib -Destination (Join-Path $buildRoot 'ICSharpCode.SharpZipLib.dll') -Force
}

New-Item -ItemType Directory -Force -Path ([IO.Path]::GetDirectoryName($OutputApk)) | Out-Null
& $executable $SourceApk $OutputApk
if ($LASTEXITCODE -ne 0) { throw 'APK repack failed.' }
