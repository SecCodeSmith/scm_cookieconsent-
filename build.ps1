<#
.SYNOPSIS
    Packages scm_cookieconsent into a PrestaShop-installable zip.

.DESCRIPTION
    Stages a clean copy of the module (excluding dev-only files: .git, this
    script, dist/, docs/, editor/OS cruft, local PrestaShop config files),
    then zips it so the archive's single top-level folder is "scm_cookieconsent"
    — the layout PrestaShop's module installer expects.

    The version number is read straight out of scm_cookieconsent.php
    ($this->version = '...') so it can never drift out of sync with the
    module itself. The output zip is named <version>.<buildNumber>-<branch>.zip
    — buildNumber auto-increments per version (GITHUB_RUN_NUMBER in CI, since
    that persists across runs; falls back to counting existing zips for that
    version in OutDir for local builds) and branch is the current git branch
    (GITHUB_REF_NAME in CI, `git rev-parse` locally), so repeated builds of
    the same module version stay distinguishable and traceable.

    In CI (GITHUB_ACTIONS=true), builds off any branch other than master/main
    additionally get the branch baked into $this->version itself INSIDE THE
    STAGED COPY ONLY (e.g. "1.6.6-my-feature") — never in the working-tree
    file — so a test build installed in a PrestaShop back office shows which
    branch it came from in the Module Manager's version column, not just in
    the zip filename. Builds of master/main (and all local/non-CI builds)
    keep a clean "X.Y.Z" $this->version, since PrestaShop uses that field for
    upgrade-detection/version_compare and a stray suffix has no business in a
    real release.

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
$Version             = $versionMatch.Groups[1].Value
$OriginalVersionLine = $versionMatch.Value

# --- Determine current git branch (for the build label) --------------------
$Branch = 'nogit'
if ($env:GITHUB_REF_NAME) {
    # In GitHub Actions, actions/checkout leaves a detached HEAD, so `git
    # rev-parse --abbrev-ref HEAD` would just return the literal "HEAD" —
    # GITHUB_REF_NAME carries the real branch/tag name instead.
    $Branch = $env:GITHUB_REF_NAME
} else {
    try {
        $gitBranch = & git -C $ModuleRoot rev-parse --abbrev-ref HEAD 2>$null
        if ($LASTEXITCODE -eq 0 -and $gitBranch) { $Branch = $gitBranch.Trim() }
    } catch {
        # git not installed / not a repo — fall back to 'nogit'
    }
}
# Sanitize for use in a filename (branch names can contain / etc.)
$Branch = ($Branch -replace '[^a-zA-Z0-9._-]', '-')

# --- Determine next build iteration for this version ------------------------
# Zips are named <version>.<buildNumber>-<branch>.zip so repeated builds of
# the same version (e.g. while iterating on a fix) don't overwrite each other
# and stay traceable to the branch that produced them.
New-Item -ItemType Directory -Path $OutDir -Force | Out-Null
if ($env:GITHUB_RUN_NUMBER) {
    # dist/ starts empty on every fresh CI checkout, so counting existing
    # zips there would always compute 1 and never actually increment.
    # GITHUB_RUN_NUMBER is GitHub's own counter for this workflow file and
    # persists across runs, so use it instead when running in CI.
    $BuildNumber = [int]$env:GITHUB_RUN_NUMBER
} else {
    $buildNumberPattern = '^' + [regex]::Escape("$ModuleName-$Version.") + '(\d+)-'
    $existingBuilds = Get-ChildItem -Path $OutDir -Filter "$ModuleName-$Version.*.zip" -ErrorAction SilentlyContinue |
        ForEach-Object {
            if ($_.Name -match $buildNumberPattern) { [int]$Matches[1] }
        }
    $BuildNumber = if ($existingBuilds) { ($existingBuilds | Measure-Object -Maximum).Maximum + 1 } else { 1 }
}
$BuildLabel = "$Version.$BuildNumber-$Branch"

Write-Host "Building $ModuleName v$Version (build $BuildLabel)"

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

# --- CI-only: tag the packaged (staged) module version with the branch -----
# Only in GitHub Actions, and only off master/main, so a test build installed
# on a PrestaShop back office shows which branch it came from directly in the
# Module Manager's version column. This edits ONLY the staged copy that gets
# zipped — $MainFile in the actual working tree/checkout is never touched —
# and canonical master/main builds keep a clean "X.Y.Z" $this->version, since
# that field drives PrestaShop's upgrade-detection/version_compare logic.
$isDefaultBranch = $Branch -in @('master', 'main')
if ($env:GITHUB_ACTIONS -eq 'true' -and -not $isDefaultBranch) {
    $stagedMainFile = Join-Path $staging "$ModuleName.php"
    $taggedVersion  = "$Version-$Branch"
    $taggedLine     = $OriginalVersionLine.Replace($Version, $taggedVersion)

    $stagedContent = Get-Content $stagedMainFile -Raw
    if (-not $stagedContent.Contains($OriginalVersionLine)) {
        throw "Could not find the expected version line in the staged copy — refusing to tag it blindly."
    }
    $stagedContent = $stagedContent.Replace($OriginalVersionLine, $taggedLine)
    Set-Content -Path $stagedMainFile -Value $stagedContent -NoNewline

    Write-Host "CI build on non-default branch '$Branch' — packaged `$this->version tagged as $taggedVersion" -ForegroundColor Yellow
}

# --- Zip it -------------------------------------------------------------
$zipPath = Join-Path $OutDir "$ModuleName-$BuildLabel.zip"
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
