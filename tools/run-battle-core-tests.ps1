$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$sourceRoot = Join-Path $projectRoot 'unity\FateCovenantClone\Assets\Scripts\Battle\Domain'
$harness = Join-Path $projectRoot 'tools\BattleCoreHarness\Program.cs'
$catalogPath = Join-Path $projectRoot 'unity\FateCovenantClone\Assets\Resources\CharacterSkillCatalog.json'
$outputRoot = Join-Path $projectRoot 'analysis\test-runs\battle-core'
New-Item -ItemType Directory -Force -Path $outputRoot | Out-Null
if (-not (Test-Path -LiteralPath $catalogPath)) { throw "Character skill catalog not found: $catalogPath" }

$compilerCandidates = @(
    'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe',
    'C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe'
)
$compiler = $compilerCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $compiler) { throw 'C# compiler not found.' }

$sources = @(Get-ChildItem -LiteralPath $sourceRoot -Filter '*.cs' -File | ForEach-Object { $_.FullName }) + $harness
$executable = Join-Path $outputRoot 'BattleCoreHarness.exe'
& $compiler /nologo /target:exe /reference:System.Core.dll "/out:$executable" $sources
if ($LASTEXITCODE -ne 0) { throw 'Battle core compilation failed.' }
$testOutput = & $executable $catalogPath 2>&1
$testExitCode = $LASTEXITCODE
$testOutput | Tee-Object -FilePath (Join-Path $outputRoot 'last-run.txt')
if ($testExitCode -ne 0) { throw 'Battle core tests failed.' }
