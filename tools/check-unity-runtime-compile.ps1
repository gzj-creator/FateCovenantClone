[CmdletBinding()]
param([Parameter(Mandatory = $true)][string]$ManagedPath)

$ErrorActionPreference = 'Stop'
$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$sourceRoot = Join-Path $projectRoot 'unity/FateCovenantClone/Assets/Scripts'
$outputRoot = Join-Path $projectRoot 'analysis/test-runs/runtime-compile'
New-Item -ItemType Directory -Force -Path $outputRoot | Out-Null
$compiler = 'C:/Windows/Microsoft.NET/Framework64/v4.0.30319/csc.exe'
$log = New-Object 'System.Collections.Generic.List[string]'
$compiled = New-Object 'System.Collections.Generic.List[object]'
$limits = 'API compatibility only. This does not validate Unity 6, Editor code, package resolution, scenes, rendering, IL2CPP or Android.'

function Write-CheckLine([string]$line) {
    $log.Add($line)
    Write-Output $line
}

function Visit-Assembly([string]$name) {
    if ($visiting[$name] -eq 1) { throw "Cyclic asmdef reference at $name" }
    if ($visiting[$name] -eq 2) { return }
    $visiting[$name] = 1
    foreach ($reference in @($assemblies[$name].Definition.references)) {
        if ($assemblies.ContainsKey($reference)) { Visit-Assembly $reference }
    }
    $visiting[$name] = 2
    $order.Add($name)
}

try {
    if (-not (Test-Path -LiteralPath $compiler)) { throw 'C# compiler not found.' }
    $ManagedPath = [System.IO.Path]::GetFullPath($ManagedPath)
    if (-not (Test-Path -LiteralPath (Join-Path $ManagedPath 'UnityEngine.CoreModule.dll'))) { throw 'Supply real Unity player managed assemblies.' }
    Write-CheckLine ("Managed assemblies: " + $ManagedPath)
    Write-CheckLine $limits
    $managed = @{}
    foreach ($dll in @(Get-ChildItem -LiteralPath $ManagedPath -Filter '*.dll' -File)) {
        try { $identity = [System.Reflection.AssemblyName]::GetAssemblyName($dll.FullName) }
        catch { continue }
        if ($managed.ContainsKey($identity.Name)) { throw "Duplicate managed assembly identity: $($identity.Name)" }
        $managed[$identity.Name] = $dll.FullName
    }
    $assemblies = @{}
    if (@(Get-ChildItem -LiteralPath $sourceRoot -Filter '*.asmref' -Recurse -File).Count -gt 0) {
        throw 'asmref source redirects are not supported by this check; inspect them in Unity.'
    }
    foreach ($file in @(Get-ChildItem -LiteralPath $sourceRoot -Filter '*.asmdef' -Recurse -File)) {
        $definition = Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
        if ([string]::IsNullOrWhiteSpace($definition.name) -or $definition.name -notmatch '^[A-Za-z_][A-Za-z0-9_.]*$') {
            throw "Invalid asmdef name in $($file.FullName)"
        }
        if ($assemblies.ContainsKey($definition.name)) { throw "Duplicate asmdef name: $($definition.name)" }
        foreach ($field in @('includePlatforms', 'excludePlatforms', 'defineConstraints', 'versionDefines')) {
            if (@($definition.$field).Count -gt 0 -and $null -ne $definition.$field) {
                throw "Conditional asmdef field $field in $($definition.name) requires Unity evaluation."
            }
        }
        if ($definition.overrideReferences -or @($definition.precompiledReferences).Count -gt 0 -and $null -ne $definition.precompiledReferences) {
            throw "Custom precompiled-reference settings in $($definition.name) are unsupported by this check."
        }
        $assemblies[$definition.name] = [pscustomobject]@{
            Definition = $definition
            Path = $file.FullName
            Directory = $file.DirectoryName
            Sources = New-Object 'System.Collections.Generic.List[string]'
            Output = Join-Path $outputRoot ($definition.name + '.dll')
        }
    }
    $required = @('FateCovenant.Battle', 'FateCovenant.Game', 'FateCovenant.Presentation')
    if ($assemblies.Count -ne $required.Count) { throw 'Expected exactly the Battle, Game and Presentation runtime asmdefs.' }
    foreach ($name in $required) { if (-not $assemblies.ContainsKey($name)) { throw "Missing asmdef: $name" } }
    foreach ($source in @(Get-ChildItem -LiteralPath $sourceRoot -Filter '*.cs' -Recurse -File)) {
        $owner = $null
        foreach ($assembly in $assemblies.Values) {
            if ($source.DirectoryName -eq $assembly.Directory -or $source.DirectoryName.StartsWith($assembly.Directory + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
                if ($null -eq $owner -or $assembly.Directory.Length -gt $owner.Directory.Length) { $owner = $assembly }
            }
        }
        if ($null -eq $owner) { throw "Runtime source has no asmdef owner: $($source.FullName)" }
        $owner.Sources.Add($source.FullName)
    }
    foreach ($assembly in $assemblies.Values) {
        if ($assembly.Sources.Count -eq 0) { throw "Empty runtime assembly: $($assembly.Definition.name)" }
        $seen = @{}
        foreach ($reference in @($assembly.Definition.references)) {
            if ($seen.ContainsKey($reference)) { throw "Duplicate reference $reference in $($assembly.Definition.name)" }
            $seen[$reference] = $true
            if ($reference -like 'GUID:*') { throw "GUID references require Unity resolution: $reference" }
            if (-not $assemblies.ContainsKey($reference) -and -not $managed.ContainsKey($reference)) {
                throw "Unresolved asmdef reference '$reference' in $($assembly.Definition.name). Use an assembly name, not a package identifier."
            }
            if ($reference -eq $assembly.Definition.name) { throw "Self-reference in $reference" }
        }
    }
    $visiting = @{}
    $order = New-Object 'System.Collections.Generic.List[string]'
    foreach ($name in $required) { Visit-Assembly $name }
    Write-CheckLine ('Asmdef reference order: ' + [string]::Join(' -> ', $order.ToArray()))
    foreach ($name in $order) {
        $assembly = $assemblies[$name]
        $referencePaths = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)
        foreach ($reference in @($assembly.Definition.references)) {
            $path = if ($assemblies.ContainsKey($reference)) { $assemblies[$reference].Output } else { $managed[$reference] }
            [void]$referencePaths.Add($path)
        }
        if (-not $assembly.Definition.noEngineReferences) {
            foreach ($engineName in $managed.Keys) {
                # UGUI is an explicit asmdef dependency, even though its name starts with UnityEngine.
                if ($engineName -like 'UnityEngine*' -and $engineName -ne 'UnityEngine.UI') { [void]$referencePaths.Add($managed[$engineName]) }
            }
        }
        if ($managed.ContainsKey('netstandard')) { [void]$referencePaths.Add($managed['netstandard']) }
        $arguments = @('/nologo', '/target:library', '/reference:System.Core.dll', ('/out:' + $assembly.Output))
        if ($assembly.Definition.allowUnsafeCode) { $arguments += '/unsafe+' }
        $arguments += @($referencePaths | Sort-Object | ForEach-Object { '/reference:' + $_ })
        $arguments += $assembly.Sources.ToArray()
        Write-CheckLine ("Compile $name : $($assembly.Sources.Count) sources; noEngineReferences=$([bool]$assembly.Definition.noEngineReferences)")
        $output = & $compiler $arguments 2>&1
        $compileExitCode = $LASTEXITCODE
        foreach ($line in $output) { Write-CheckLine ([string]$line) }
        if ($compileExitCode -ne 0) { throw "Runtime API compatibility compilation failed for $name." }
        $compiled.Add([pscustomobject]@{ name = $name; sources = $assembly.Sources.Count; output = $assembly.Output; references = @($assembly.Definition.references); noEngineReferences = [bool]$assembly.Definition.noEngineReferences })
    }
    Write-CheckLine ('PASS: three runtime assemblies compile separately with their declared asmdef references. ' + $limits)
    $report = [pscustomobject]@{ passed = $true; managedPath = $ManagedPath; limitations = $limits; assemblies = $compiled.ToArray() }
}
catch {
    Write-CheckLine ('FAIL: ' + $_.Exception.Message)
    $report = [pscustomobject]@{ passed = $false; managedPath = $ManagedPath; limitations = $limits; error = $_.Exception.Message; assemblies = $compiled.ToArray() }
    throw
}
finally {
    $log | Set-Content -LiteralPath (Join-Path $outputRoot 'last-run.txt') -Encoding UTF8
    if ($null -ne $report) { $report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $outputRoot 'report.json') -Encoding UTF8 }
}
