$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$outputRoot = Join-Path $projectRoot 'analysis/experiments/private-server-20261025/p2/packet-crypto'
New-Item -ItemType Directory -Force -Path $outputRoot | Out-Null
$compiler = 'C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe'
$source = Join-Path $PSScriptRoot 'GamePacketCryptoHarness/Program.cs'
$executable = Join-Path $projectRoot 'analysis/test-runs/GamePacketCryptoHarness.exe'
New-Item -ItemType Directory -Force -Path (Split-Path $executable) | Out-Null
& $compiler /nologo /target:exe /reference:System.Web.Extensions.dll "/out:$executable" $source
if ($LASTEXITCODE -ne 0) { throw 'Packet crypto harness compilation failed.' }
$json = & $executable
if ($LASTEXITCODE -ne 0) { throw 'Packet crypto harness failed.' }
$record = $json | ConvertFrom-Json
if ($record.fixtures.Count -ne 18) { throw 'Unexpected packet crypto fixtures.' }
[IO.File]::WriteAllText((Join-Path $outputRoot 'fixtures.json'), $json, [Text.UTF8Encoding]::new($false))
$identity = [ordered]@{
    recordedAtUtc = [DateTime]::UtcNow.ToString('o')
    sourceSha256 = (Get-FileHash $source -Algorithm SHA256).Hash.ToLowerInvariant()
    executableSha256 = (Get-FileHash $executable -Algorithm SHA256).Hash.ToLowerInvariant()
    fixtureSha256 = (Get-FileHash (Join-Path $outputRoot 'fixtures.json') -Algorithm SHA256).Hash.ToLowerInvariant()
    inspectedCilSha256 = (Get-FileHash (Join-Path $projectRoot 'analysis/reports/private-client-16448/native-loading/network-cil.json') -Algorithm SHA256).Hash.ToLowerInvariant()
    targetRuntimeMatchEstablished = $false
}
[IO.File]::WriteAllText((Join-Path $outputRoot 'run-identity.json'), ($identity | ConvertTo-Json), [Text.UTF8Encoding]::new($false))
'Generated 18 packet AES fixtures; APK runtime parity remains unverified.'
