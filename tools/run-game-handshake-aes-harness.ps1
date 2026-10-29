$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$outputRoot = Join-Path $projectRoot 'analysis/reports/private-client-16448/handshake-aes-harness'
New-Item -ItemType Directory -Force -Path $outputRoot | Out-Null
$compiler = 'C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe'
if (-not (Test-Path -LiteralPath $compiler)) { throw 'Existing .NET Framework C# compiler is unavailable.' }
$source = Join-Path $PSScriptRoot 'GameHandshakeAesHarness/Program.cs'
$executable = Join-Path $outputRoot 'GameHandshakeAesHarness.exe'
& $compiler /nologo /target:exe /reference:System.Web.Extensions.dll "/out:$executable" $source
if ($LASTEXITCODE -ne 0) { throw 'Handshake AES harness compilation failed.' }
$json = & $executable
if ($LASTEXITCODE -ne 0) { throw 'Handshake AES harness execution failed.' }
$record = $json | ConvertFrom-Json
if ($record.scope -ne 'Local reimplementation of inspected CIL; no target assembly or APK executed') { throw 'Unexpected harness output.' }
[System.IO.File]::WriteAllText((Join-Path $outputRoot 'fixtures.json'), $json, [System.Text.UTF8Encoding]::new($false))
$identity = [ordered]@{
    schemaVersion = 1
    recordedAtUtc = [DateTime]::UtcNow.ToString('o')
    scope = $record.scope
    compiler = $compiler
    compilerVersion = (Get-Item -LiteralPath $compiler).VersionInfo.FileVersion
    sourceSha256 = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.ToLowerInvariant()
    executableSha256 = (Get-FileHash -LiteralPath $executable -Algorithm SHA256).Hash.ToLowerInvariant()
    fixturesSha256 = (Get-FileHash -LiteralPath (Join-Path $outputRoot 'fixtures.json') -Algorithm SHA256).Hash.ToLowerInvariant()
    inspectedCilSha256 = (Get-FileHash -LiteralPath (Join-Path $projectRoot 'analysis/reports/private-client-16448/native-loading/network-cil.json') -Algorithm SHA256).Hash.ToLowerInvariant()
    targetRuntimeMatchEstablished = $false
}
[System.IO.File]::WriteAllText((Join-Path $outputRoot 'run-identity.json'), ($identity | ConvertTo-Json -Depth 5), [System.Text.UTF8Encoding]::new($false))
$record.runtime
$record.fixtures | Select-Object name,plaintextBytes,beforeFinalBytes,afterFinalBytes
