[CmdletBinding()]
param(
    [ValidateSet('Download', 'Install')]
    [string]$Action = 'Download',
    [ValidateSet('Editor', 'Android', 'All')]
    [string]$Components = 'All'
)

$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$version = '6000.0.85f1'
$toolchainRoot = Join-Path $projectRoot '.toolchain'
$downloadRoot = Join-Path $toolchainRoot 'downloads'
$installRoot = Join-Path $toolchainRoot "Unity/$version"
$reportRoot = Join-Path $projectRoot 'analysis/test-runs/unity'
New-Item -ItemType Directory -Force -Path $downloadRoot,$reportRoot | Out-Null
$releaseUri = 'https://services.api.unity.com/unity/editor/release/v1/releases?limit=3&version=6000.0&platform=WINDOWS&architecture=X86_64'
$release = (Invoke-RestMethod -Uri $releaseUri -TimeoutSec 30).results | Where-Object { $_.version -eq $version } | Select-Object -First 1
if (-not $release -or $release.shortRevision -ne 'ee7790f1426a' -or $release.stream -ne 'LTS') { throw 'Pinned official Unity release metadata did not match.' }
$editor = $release.downloads | Where-Object { $_.platform -eq 'WINDOWS' -and $_.architecture -eq 'X86_64' } | Select-Object -First 1
$android = $editor.modules | Where-Object { $_.id -eq 'android' }
$release | ConvertTo-Json -Depth 30 | Set-Content -LiteralPath (Join-Path $reportRoot 'official-release-6000.0.85f1.json') -Encoding UTF8

function Get-VerifiedDownload($Module, [string]$Name) {
    $uri = [Uri]$Module.url
    if ($uri.Scheme -ne 'https' -or $uri.Host -notin @('download.unity3d.com', 'dl.google.com')) { throw "Unexpected download host: $uri" }
    $path = Join-Path $downloadRoot ([System.IO.Path]::GetFileName($uri.AbsolutePath))
    $expectedBytes = [long]$Module.downloadSize.value
    if (-not (Test-Path -LiteralPath $path) -or (Get-Item -LiteralPath $path).Length -ne $expectedBytes) {
        Write-Output "Downloading $Name ($expectedBytes bytes)."
        $transferReport = Join-Path $reportRoot 'last-download.txt'
        $transfer = & curl.exe --fail --location --retry 3 --connect-timeout 30 --max-time 3600 --continue-at - --output $path --write-out 'HTTP=%{http_code} EFFECTIVE_URL=%{url_effective}' $Module.url
        $downloadExitCode = $LASTEXITCODE
        $transfer | Set-Content -LiteralPath $transferReport -Encoding UTF8
        if ($downloadExitCode -ne 0) { throw "Download failed for $Name (curl $downloadExitCode). Inspect $transferReport for the effective endpoint; rerun the same command to resume." }
    }
    if ((Get-Item -LiteralPath $path).Length -ne $expectedBytes) { throw "Unexpected file size for $Name" }
    if ($Module.integrity) {
        $parts = $Module.integrity -split '-', 2
        $hashHex = (Get-FileHash -LiteralPath $path -Algorithm $parts[0]).Hash
        $hashBytes = New-Object byte[] ($hashHex.Length / 2)
        for ($i = 0; $i -lt $hashBytes.Length; $i++) { $hashBytes[$i] = [Convert]::ToByte($hashHex.Substring($i * 2, 2), 16) }
        if ([Convert]::ToBase64String($hashBytes) -ne $parts[1]) { throw "Integrity mismatch for $Name. The cached file was preserved for inspection." }
    }
    return $path
}

function Install-EditorExecutable([string]$Path) {
    $signature = Get-AuthenticodeSignature -LiteralPath $Path
    if ($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notmatch 'Unity') { throw "Unity installer signature verification failed: $Path" }
    Write-Output "Installing into $installRoot"
    $process = Start-Process -FilePath $Path -ArgumentList @('/S', "/D=$installRoot") -WindowStyle Hidden -Wait -PassThru
    if ($process.ExitCode -notin @(0, 3010)) { throw "Installer failed with exit code $($process.ExitCode)" }
}

function Install-ArchiveModule($Module) {
    $path = Get-VerifiedDownload $Module $Module.id | Select-Object -Last 1
    if ($Action -ne 'Install') { return }
    $destination = [System.IO.Path]::GetFullPath($Module.destination.Replace('{UNITY_PATH}', $installRoot))
    $allowedRoot = [System.IO.Path]::GetFullPath($installRoot).TrimEnd('\') + '\'
    if (-not $destination.StartsWith($allowedRoot, [StringComparison]::OrdinalIgnoreCase)) { throw "Archive destination outside toolchain: $destination" }
    New-Item -ItemType Directory -Force -Path $destination | Out-Null
    & tar.exe -xf $path -C $destination
    if ($LASTEXITCODE -ne 0) { throw "Archive extraction failed: $path" }
    if ($Module.extractedPathRename) {
        $from = [System.IO.Path]::GetFullPath($Module.extractedPathRename.from.Replace('{UNITY_PATH}', $installRoot))
        $to = [System.IO.Path]::GetFullPath($Module.extractedPathRename.to.Replace('{UNITY_PATH}', $installRoot))
        if (-not $from.StartsWith($allowedRoot, [StringComparison]::OrdinalIgnoreCase) -or -not $to.StartsWith($allowedRoot, [StringComparison]::OrdinalIgnoreCase)) { throw 'Archive rename outside toolchain.' }
        if ($from -ne $to -and (Test-Path -LiteralPath $from)) {
            if ($to -eq $destination) {
                Get-ChildItem -LiteralPath $from -Force | ForEach-Object { Move-Item -LiteralPath $_.FullName -Destination $to -Force }
            } else {
                if (Test-Path -LiteralPath $to) { throw "Rename destination already exists: $to. Inspect the partial installation before retrying." }
                Move-Item -LiteralPath $from -Destination $to
            }
        }
    }
}

if ($Components -in @('Editor', 'All')) {
    $editorInstaller = Get-VerifiedDownload $editor 'Unity editor' | Select-Object -Last 1
    if ($Action -eq 'Install' -and -not (Test-Path -LiteralPath (Join-Path $installRoot 'Editor/Unity.exe'))) { Install-EditorExecutable $editorInstaller }
}
if ($Components -in @('Android', 'All')) {
    if ($Action -eq 'Install' -and -not (Test-Path -LiteralPath (Join-Path $installRoot 'Editor/Unity.exe'))) { throw 'Install the pinned editor before Android Build Support.' }
    $androidInstaller = Get-VerifiedDownload $android 'Android Build Support' | Select-Object -Last 1
    if ($Action -eq 'Install') { Install-EditorExecutable $androidInstaller }
    foreach ($module in $android.subModules) {
        Install-ArchiveModule $module
        foreach ($child in $module.subModules) { Install-ArchiveModule $child }
    }
}
Write-Output "$Action completed for $Components. This does not constitute Unity runtime or Android device validation."
