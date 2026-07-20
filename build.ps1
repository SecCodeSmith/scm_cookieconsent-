<#
.SYNOPSIS
    Packages scm_cookieconsent into a PrestaShop-installable zip.

.DESCRIPTION
    Stages a clean copy of the module (excluding dev-only files: .git, this
    script, dist/, docs/, editor/OS cruft, local PrestaShop config files),
    then zips it so the archive's single top-level folder is "scm_cookieconsent"
    — the layout PrestaShop's module installer expects.

    The version number is read straight out of scm_cookieconsent.php
    ($this->version = '...') so the output filename can never drift out of
    sync with the module itself.

.PARAMETER OutDir
    Where to write the zip. Defaults to .\dist next to this script.

.EXAMPLE
    ./build.ps1
    ./build.ps1 -OutDir C:\releases
#>
param(
    [string]$OutDir = (Join-Path $PSScriptRoot 'dist')
)

$ErrorActionPreference = 'Stop'

$ModuleName = 'scm_cookieconsent'
$ModuleRoot = $PSScriptRoot
$MainFile   = Join-Path $ModuleRoot "$ModuleName.php"

if (-not (Test-Path $MainFile)) {
    throw "Can't find $MainFile — run this script from inside the module folder."
}

# --- Read the module version straight from the source of truth ------------
$mainContent = Get-Content $MainFile -Raw
$versionMatch = [regex]::Match($mainContent, "\`$this->version\s*=\s*'([\d.]+)'")
if (-not $versionMatch.Success) {
    throw "Could not find `$this->version = '...' in $MainFile"
}
$Version = $versionMatch.Groups[1].Value
Write-Host "Building $ModuleName v$Version"

# --- Stale-build guard ------------------------------------------------------
# The front end loads scm_cookieconsent.min.js, not the .js source — if the
# source was edited more recently than the minified build, the fix never
# actually reaches the browser. Warn loudly rather than silently ship stale JS.
$jsSrc = Join-Path $ModuleRoot 'views\js\scm_cookieconsent.js'
$jsMin = Join-Path $ModuleRoot 'views\js\scm_cookieconsent.min.js'
if ((Test-Path $jsSrc) -and (Test-Path $jsMin)) {
    if ((Get-Item $jsSrc).LastWriteTimeUtc -gt (Get-Item $jsMin).LastWriteTimeUtc) {
        Write-Warning "scm_cookieconsent.js is newer than scm_cookieconsent.min.js — rebuild it first:`n  npx terser views/js/scm_cookieconsent.js -c -m --comments false -o views/js/scm_cookieconsent.min.js"
    }
}

# --- Stage a clean copy ------------------------------------------------------
$stagingRoot = Join-Path ([System.IO.Path]::GetTempPath()) "scm_cookieconsent-build-$([guid]::NewGuid())"
$staging     = Join-Path $stagingRoot $ModuleName
New-Item -ItemType Directory -Path $staging -Force | Out-Null

# robocopy exit codes 0-7 are all "success" (8+ means real errors)
$excludeDirs = @('.git', 'dist', 'docs', '.vscode', '.idea', 'node_modules')
$excludeFiles = @(
    'build.ps1', '.gitignore', '*.map', 'Thumbs.db', '.DS_Store', '*.swp', '*~',
    'config.inc.php', 'config_*.inc.php'
)
robocopy $ModuleRoot $staging /E /XD $excludeDirs /XF $excludeFiles /NFL /NDL /NJH /NJS | Out-Null
# robocopy's own exit codes are bitflags where 0-7 all mean success (e.g. 1 =
# "files copied") — capture it and do NOT let it linger as $LASTEXITCODE,
# since assigning to $LASTEXITCODE inside this script only shadows it in this
# scope and does not clear the engine-tracked value the host process exits
# with; an explicit `exit 0` at the end of the script is what actually matters.
$robocopyExitCode = $LASTEXITCODE
if ($robocopyExitCode -ge 8) {
    Remove-Item $stagingRoot -Recurse -Force -ErrorAction SilentlyContinue
    throw "robocopy failed with exit code $robocopyExitCode"
}

# --- Zip it -------------------------------------------------------------
New-Item -ItemType Directory -Path $OutDir -Force | Out-Null
$zipPath = Join-Path $OutDir "$ModuleName-$Version.zip"
if (Test-Path $zipPath) {
    # A previous zip can briefly be held open by antivirus/indexer scanning —
    # retry a few times instead of failing the whole build over it.
    for ($i = 1; $i -le 5; $i++) {
        try { Remove-Item $zipPath -Force -ErrorAction Stop; break }
        catch {
            if ($i -eq 5) { throw }
            Start-Sleep -Milliseconds 500
        }
    }
}

Compress-Archive -Path $staging -DestinationPath $zipPath -CompressionLevel Optimal

Remove-Item $stagingRoot -Recurse -Force

$zipSizeKB = [math]::Round((Get-Item $zipPath).Length / 1KB, 1)
Write-Host "Built $zipPath ($zipSizeKB KB)" -ForegroundColor Green
exit 0
