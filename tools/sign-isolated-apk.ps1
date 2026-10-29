param(
    [string]$UnsignedApk = '',
    [string]$OutputDirectory = '',
    [string]$SigningDirectory = ''
)
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if (-not $UnsignedApk) { $UnsignedApk = Join-Path $projectRoot 'analysis/experiments/private-server-20261025/p1/isolated/com.jzyx.ps.unsigned.apk' }
if (-not $OutputDirectory) { $OutputDirectory = Join-Path $projectRoot 'analysis/experiments/private-server-20261025/p1/isolated' }
$UnsignedApk = [IO.Path]::GetFullPath($UnsignedApk)
$OutputDirectory = [IO.Path]::GetFullPath($OutputDirectory)
if (-not $SigningDirectory) { $SigningDirectory = $OutputDirectory }
$SigningDirectory = [IO.Path]::GetFullPath($SigningDirectory)
$buildTools = 'C:/Users/gzj/AppData/Local/Android/Sdk/build-tools/36.0.0'
$jdk = 'C:/Program Files/Microsoft/jdk-21.0.12.101-hotspot'
$aligned = Join-Path $OutputDirectory 'com.jzyx.ps.aligned.apk'
$signed = Join-Path $OutputDirectory 'com.jzyx.ps.signed.apk'
$keystore = Join-Path $SigningDirectory 'test-signing.local-only.p12'
$passwordFile = Join-Path $SigningDirectory 'test-signing-password.local-only.txt'
foreach ($path in @($aligned, $signed)) {
    if (Test-Path -LiteralPath $path) { throw "Refusing to overwrite $path" }
}
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
if ((Test-Path -LiteralPath $keystore) -ne (Test-Path -LiteralPath $passwordFile)) { throw 'Incomplete signing identity; preserve existing files and review.' }
try {
    if (-not (Test-Path -LiteralPath $keystore)) {
        $random = New-Object byte[] 32
        $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
        try { $rng.GetBytes($random) } finally { $rng.Dispose() }
        $env:FC_PS_SIGN_PASSWORD = [Convert]::ToBase64String($random)
        [IO.File]::WriteAllText($passwordFile, $env:FC_PS_SIGN_PASSWORD)
        & "$jdk/bin/keytool.exe" -genkeypair -keystore $keystore -storetype PKCS12 -storepass:env FC_PS_SIGN_PASSWORD -alias fc-local-test -keyalg RSA -keysize 3072 -validity 3650 -dname 'CN=FateCovenant Local Test' -noprompt
        if ($LASTEXITCODE -ne 0) { throw 'Test certificate creation failed.' }
    } else { $env:FC_PS_SIGN_PASSWORD = [IO.File]::ReadAllText($passwordFile) }
    & "$buildTools/zipalign.exe" -P 16 4 $UnsignedApk $aligned
    if ($LASTEXITCODE -ne 0) { throw 'zipalign failed.' }
    & "$jdk/bin/java.exe" -jar "$buildTools/lib/apksigner.jar" sign --ks $keystore --ks-key-alias fc-local-test --ks-pass env:FC_PS_SIGN_PASSWORD --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true --out $signed $aligned
    if ($LASTEXITCODE -ne 0) { throw 'APK signing failed.' }
    $verification = & "$jdk/bin/java.exe" -jar "$buildTools/lib/apksigner.jar" verify --verbose --print-certs $signed
    if ($LASTEXITCODE -ne 0) { throw 'APK signature verification failed.' }
    $verification | Set-Content -LiteralPath (Join-Path $OutputDirectory 'signature-verification.txt') -Encoding UTF8
    & "$buildTools/zipalign.exe" -c -P 16 4 $signed
    if ($LASTEXITCODE -ne 0) { throw 'Signed APK alignment verification failed.' }
    $badging = & "$buildTools/aapt2.exe" dump badging $signed
    if ($LASTEXITCODE -ne 0 -or -not ($badging -match "^package: name='com.jzyx.ps'")) { throw 'Unexpected output package.' }
    $badging | Set-Content -LiteralPath (Join-Path $OutputDirectory 'signed-badging.txt') -Encoding UTF8
    [ordered]@{
        recordedAtUtc = [DateTime]::UtcNow.ToString('o')
        package = 'com.jzyx.ps'
        path = $signed
        bytes = (Get-Item -LiteralPath $signed).Length
        sha256 = (Get-FileHash -LiteralPath $signed -Algorithm SHA256).Hash.ToLowerInvariant()
        signatureVerified = $true
        alignmentVerified = $true
        installed = $false
    } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $OutputDirectory 'signed-artifact.json') -Encoding UTF8
    "Verified signed APK: $signed"
} finally { Remove-Item Env:FC_PS_SIGN_PASSWORD -ErrorAction SilentlyContinue }
