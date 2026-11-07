param(
    [Parameter(Mandatory = $true)][string]$SourceApk,
    [Parameter(Mandatory = $true)][string]$PatchedLuaBundle,
    [Parameter(Mandatory = $true)][string]$OutputDirectory,
    [string]$ZipTool = 'C:/Program Files/NVIDIA Corporation/NVIDIA App/7z.exe'
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$SourceApk = [IO.Path]::GetFullPath($SourceApk)
$PatchedLuaBundle = [IO.Path]::GetFullPath($PatchedLuaBundle)
$OutputDirectory = [IO.Path]::GetFullPath($OutputDirectory)
if (Test-Path -LiteralPath $OutputDirectory) { throw 'Use a new output directory.' }
if (-not (Test-Path -LiteralPath $ZipTool)) { throw 'An existing 7-Zip executable is required.' }
$sourceHash = (Get-FileHash -LiteralPath $SourceApk -Algorithm SHA256).Hash.ToLowerInvariant()
$bundleHash = (Get-FileHash -LiteralPath $PatchedLuaBundle -Algorithm SHA256).Hash.ToLowerInvariant()
if ($sourceHash -ne '1fd5fe0a2e18e9add821efb6c404d9464b5e3609be0e8af605d47bada441b473') { throw 'Expected the accepted v9 APK.' }
if ($bundleHash -ne '82f7e06657a439658dc8b9f323b05f1e59fe188a84bccb9ea20ac216dce74908') { throw 'Unexpected patched bundle.' }
$targetName = 'assets/Android/script/lua/64_lua_project.bundle'
$staging = Join-Path $OutputDirectory 'staging'
$targetPath = Join-Path $staging $targetName
$unsigned = Join-Path $OutputDirectory 'com.jzyx.ps.recharge-fix.unsigned.apk'
New-Item -ItemType Directory -Force -Path ([IO.Path]::GetDirectoryName($targetPath)) | Out-Null
Copy-Item -LiteralPath $PatchedLuaBundle -Destination $targetPath
Copy-Item -LiteralPath $SourceApk -Destination $unsigned

$archive = [IO.Compression.ZipFile]::OpenRead($SourceApk)
try { $signatures = @($archive.Entries | Where-Object { $_.FullName -match '^META-INF/([^/]+\.(SF|RSA|DSA|EC)|MANIFEST\.MF)$' } | ForEach-Object { $_.FullName }) }
finally { $archive.Dispose() }
if (-not $signatures.Count) { throw 'The source signing entries are missing.' }
& $ZipTool d -tzip -y $unsigned @signatures | Select-Object -Last 5
if ($LASTEXITCODE -ne 0) { throw 'Failed to remove signatures from the new derivative.' }
Push-Location $staging
try {
    & $ZipTool u -tzip -mx=0 -y $unsigned $targetName | Select-Object -Last 5
    if ($LASTEXITCODE -ne 0) { throw 'Failed to replace the Lua bundle.' }
} finally { Pop-Location }

$sourceArchive = [IO.Compression.ZipFile]::OpenRead($SourceApk)
$outputArchive = [IO.Compression.ZipFile]::OpenRead($unsigned)
$digest = [Security.Cryptography.SHA256]::Create()
function Get-EntryHash($entry) {
    $stream = $entry.Open()
    try { return [BitConverter]::ToString($digest.ComputeHash($stream)).Replace('-', '').ToLowerInvariant() }
    finally { $stream.Dispose() }
}
try {
    if ($outputArchive.Entries.Count -ne $sourceArchive.Entries.Count - $signatures.Count) { throw 'ZIP member count changed.' }
    $verified = 0
    foreach ($entry in $sourceArchive.Entries) {
        if ($signatures -contains $entry.FullName) { continue }
        $outputEntry = $outputArchive.GetEntry($entry.FullName)
        if (-not $outputEntry) { throw "Missing output member: $($entry.FullName)" }
        $expected = if ($entry.FullName -eq $targetName) { $bundleHash } else { Get-EntryHash $entry }
        if ((Get-EntryHash $outputEntry) -ne $expected) { throw "Content mismatch: $($entry.FullName)" }
        if ($entry.FullName -ne $targetName -and $entry.CompressedLength -ne $outputEntry.CompressedLength) { throw 'Unrelated compressed member changed.' }
        $verified++
    }
} finally { $digest.Dispose(); $sourceArchive.Dispose(); $outputArchive.Dispose() }

$report = [ordered]@{
    source = $SourceApk; sourceSha256 = $sourceHash
    output = $unsigned; bytes = (Get-Item -LiteralPath $unsigned).Length
    sha256 = (Get-FileHash -LiteralPath $unsigned -Algorithm SHA256).Hash.ToLowerInvariant()
    bundleSha256 = $bundleHash; verifiedMembers = $verified
    patchedMembers = @($targetName); removedSignatureEntries = $signatures
    signed = $false; zipaligned = $false; installed = $false; deviceValidated = $false
}
$report | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $OutputDirectory 'recharge-fix-apk.json') -Encoding UTF8
$report | ConvertTo-Json -Depth 4
