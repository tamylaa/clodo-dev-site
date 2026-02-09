# AI Engine — Secret Health Check (PowerShell)
# Quick check of secret configuration
# Run: .\scripts\check-secrets.ps1

param(
    [switch]$Verbose,
    [switch]$Json
)

$ErrorActionPreference = "Stop"

# ── Configuration ────────────────────────────────────────────────────

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$ROOT_DIR = Split-Path -Parent $SCRIPT_DIR
$DEV_VARS_FILE = Join-Path $ROOT_DIR ".dev.vars"
$WRANGLER_TOML = Join-Path $ROOT_DIR "config\wrangler.toml"
$GITIGNORE = Join-Path $ROOT_DIR ".gitignore"

# ── Functions ────────────────────────────────────────────────────────

function Write-Color($Color, $Text) {
    if (!$Json) { Write-Host $Text -ForegroundColor $Color }
}

function Write-Success($Text) { Write-Color "Green" "OK $Text" }
function Write-Error($Text) { Write-Color "Red" "FAIL $Text" }
function Write-Warning($Text) { Write-Color "Yellow" "WARN $Text" }
function Write-Info($Text) { Write-Color "Cyan" "INFO $Text" }

function Test-Command($Command) {
    try {
        $null = Get-Command $Command -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

function Get-DevVar($Key) {
    if (!(Test-Path $DEV_VARS_FILE)) { return $null }
    $content = Get-Content $DEV_VARS_FILE -Raw
    $match = [regex]::Match($content, "^$Key=(.+)$", "Multiline")
    if ($match.Success) {
        $value = $match.Groups[1].Value.Trim()
        if ($value -and !$value.Contains("your-") -and !$value.Contains("-here")) {
            return $value
        }
    }
    return $null
}

function Test-GitTracked($File) {
    try {
        $result = & git ls-files --cached $File 2>$null
        return ![string]::IsNullOrEmpty($result)
    } catch {
        return $false
    }
}

# ── Checks ────────────────────────────────────────────────────────────

$results = @{
    passed = 0
    warned = 0
    failed = 0
    checks = @()
}

function Add-Check($Name, $Category, $ScriptBlock) {
    try {
        $passed = & $ScriptBlock
    } catch {
        $passed = $false
    }

    $severity = if ($Name -match "gitignore|tracked|hardcoded") { "critical" } else { "warn" }

    $result = @{
        name = $Name
        category = $Category
        passed = $passed
        severity = $severity
    }
    $results.checks += $result

    if ($passed) {
        $results.passed++
        Write-Success $Name
    } elseif ($severity -eq "critical") {
        $results.failed++
        Write-Error "$Name (CRITICAL)"
    } else {
        $results.warned++
        Write-Warning $Name
    }
}

# ── Run Checks ────────────────────────────────────────────────────────

if (!$Json) {
    Write-Host "`nAI Engine - Secret Health Check (PowerShell)`n" -ForegroundColor Cyan
}

# Security checks
Write-Host "Security" -ForegroundColor White
Add-Check ".gitignore covers .dev.vars" "security" {
    if (!(Test-Path $GITIGNORE)) { return $false }
    $content = Get-Content $GITIGNORE -Raw
    return $content -match "\.dev\.vars"
}
Add-Check ".gitignore covers .env" "security" {
    if (!(Test-Path $GITIGNORE)) { return $false }
    $content = Get-Content $GITIGNORE -Raw
    return $content -match "\.env"
}
Add-Check ".dev.vars is not git-tracked" "security" {
    return !(Test-GitTracked ".dev.vars")
}
Add-Check "No secrets in wrangler.toml" "security" {
    if (!(Test-Path $WRANGLER_TOML)) { return $true }
    $content = Get-Content $WRANGLER_TOML -Raw
    return !([regex]::IsMatch($content, "(sk-ant-api|sk-proj-|sk-[a-zA-Z0-9]{20,})"))
}
Add-Check "No secrets in source code" "security" {
    $srcFiles = Get-ChildItem (Join-Path $ROOT_DIR "src") -Recurse -Include "*.mjs","*.js" -ErrorAction SilentlyContinue
    foreach ($file in $srcFiles) {
        $content = Get-Content $file.FullName -Raw
        if ([regex]::IsMatch($content, "(sk-ant-api|sk-proj-)[a-zA-Z0-9]{20,}")) {
            return $false
        }
    }
    return $true
}

# Local dev checks
Write-Host "`nLocal Dev" -ForegroundColor White
Add-Check ".dev.vars file exists" "local" {
    return Test-Path $DEV_VARS_FILE
}
Add-Check "AI_ENGINE_TOKEN set locally" "local" {
    return $null -ne (Get-DevVar "AI_ENGINE_TOKEN")
}
Add-Check "At least one provider key set locally" "local" {
    $providers = @("ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GOOGLE_AI_API_KEY", "MISTRAL_API_KEY", "DEEPSEEK_API_KEY")
    foreach ($key in $providers) {
        if (Get-DevVar $key) { return $true }
    }
    return $false
}

# Config checks
Write-Host "`nConfiguration" -ForegroundColor White
Add-Check "wrangler.toml exists" "config" {
    return Test-Path $WRANGLER_TOML
}
Add-Check "KV_AI namespace ID set" "config" {
    if (!(Test-Path $WRANGLER_TOML)) { return $false }
    $content = Get-Content $WRANGLER_TOML -Raw
    $match = [regex]::Match($content, 'binding\s*=\s*"KV_AI"\s*\n\s*id\s*=\s*"([^"]*)"')
    return $match.Success -and $match.Groups[1].Value
}

# Provider status
if ($Verbose -and !$Json) {
    Write-Host "`nProvider Status" -ForegroundColor White
    $providers = @(
        @{ Name = "Anthropic Claude"; Key = "ANTHROPIC_API_KEY"; Recommended = $true },
        @{ Name = "OpenAI"; Key = "OPENAI_API_KEY" },
        @{ Name = "Google Gemini"; Key = "GOOGLE_AI_API_KEY" },
        @{ Name = "Mistral AI"; Key = "MISTRAL_API_KEY" },
        @{ Name = "DeepSeek"; Key = "DEEPSEEK_API_KEY" },
        @{ Name = "Cloudflare Workers AI"; Key = $null; Always = $true }
    )

    foreach ($provider in $providers) {
        $available = $provider.Always -or ($null -ne (Get-DevVar $provider.Key))
        $icon = if ($available) { "OK" } else { "-" }
        $color = if ($available) { "Green" } else { "Gray" }
        $tag = if ($provider.Recommended) { " (recommended)" } else { "" }
        $free = if ($provider.Always) { " (free, always available)" } else { "" }
        Write-Host "  $icon $($provider.Name)$tag$free" -ForegroundColor $color
    }
}

# ── Summary ───────────────────────────────────────────────────────────

if ($Json) {
    $results | ConvertTo-Json -Depth 10
} else {
    Write-Host "`n------------------------------------" -ForegroundColor Gray
    Write-Host "OK $($results.passed) passed  WARN $($results.warned) warnings  FAIL $($results.failed) critical" -ForegroundColor White

    if ($results.failed -gt 0) {
        Write-Error "`nCRITICAL issues found! Run: .\scripts\setup.ps1"
    } elseif ($results.warned -gt 0) {
        Write-Warning "`nSome optional items not configured. Run: .\scripts\setup.ps1"
    } else {
        Write-Success "`nAll checks passed!"
    }
    Write-Host
}

exit $results.failed