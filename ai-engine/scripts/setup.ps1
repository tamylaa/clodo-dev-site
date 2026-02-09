# AI Engine Setup (PowerShell)
# Simple setup script for Windows users
# Run: .\scripts\setup.ps1

param(
    [switch]$CheckOnly,
    [switch]$LocalOnly,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

# ── Configuration ────────────────────────────────────────────────────

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$ROOT_DIR = Split-Path -Parent $SCRIPT_DIR
$DEV_VARS_FILE = Join-Path $ROOT_DIR ".dev.vars"
$WRANGLER_TOML = Join-Path $ROOT_DIR "config\wrangler.toml"
$GITIGNORE = Join-Path $ROOT_DIR ".gitignore"

# Colors
$GREEN = "Green"
$RED = "Red"
$YELLOW = "Yellow"
$Cyan = "Cyan"
$RESET = "White"

# ── Functions ────────────────────────────────────────────────────────

function Write-Color($Color, $Text) {
    Write-Host $Text -ForegroundColor $Color
}

function Write-Success($Text) { Write-Color $GREEN "OK $Text" }
function Write-Error($Text) { Write-Color $RED "FAIL $Text" }
function Write-Warning($Text) { Write-Color $YELLOW "WARN $Text" }
function Write-Info($Text) { Write-Color $Cyan "INFO $Text" }

function Read-YesNo($Question, $Default = $true) {
    $prompt = if ($Default) { "Y/n" } else { "y/N" }
    $response = Read-Host "$Question [$prompt]"
    if ($response -eq "") { return $Default }
    return $response.ToLowerCase().StartsWith("y")
}

function Read-Secret($Prompt) {
    $secure = Read-Host $Prompt -AsSecureString
    $plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    )
    return $plain
}

function Test-Command($Command) {
    try {
        $null = Get-Command $Command -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

function Invoke-Wrangler($Args) {
    $cmd = "npx wrangler"
    if ($Verbose) { Write-Host "Running: $cmd $Args" -ForegroundColor Gray }
    try {
        $result = & $cmd @Args 2>&1
        return @{ Success = $true; Output = $result }
    } catch {
        return @{ Success = $false; Output = $_.Exception.Message }
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

function Set-DevVar($Key, $Value) {
    $content = if (Test-Path $DEV_VARS_FILE) { Get-Content $DEV_VARS_FILE -Raw } else { "" }
    $lines = $content -split "`n" | Where-Object { $_ -notmatch "^$Key=" }
    $lines += "$Key=$Value"
    $lines | Out-File $DEV_VARS_FILE -Encoding UTF8
}

function Generate-Token {
    $bytes = New-Object byte[] 32
    [Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
    return ($bytes | ForEach-Object { $_.ToString("x2") }) -join ""
}

# ── Phase 1: Prerequisites ────────────────────────────────────────────

function Test-Prerequisites {
    Write-Host "`nPhase 1: Prerequisites" -ForegroundColor Cyan

    $checks = @{}

    # Node.js
    if (Test-Command "node") {
        $version = & node --version
        Write-Success "Node.js $version"
        $checks.Node = $true
    } else {
        Write-Error "Node.js not found"
        $checks.Node = $false
    }

    # Wrangler
    if (Test-Command "npx") {
        $result = Invoke-Wrangler @("--version")
        if ($result.Success) {
            Write-Success "Wrangler available"
            $checks.Wrangler = $true
        } else {
            Write-Error "Wrangler not available"
            $checks.Wrangler = $false
        }
    } else {
        Write-Error "npx not available"
        $checks.Wrangler = $false
    }

    # Wrangler auth
    if ($checks.Wrangler) {
        $result = Invoke-Wrangler @("whoami")
        if ($result.Success -and $result.Output -notmatch "not authenticated") {
            Write-Success "Wrangler authenticated"
            $checks.Auth = $true
        } else {
            Write-Warning "Wrangler not authenticated — run: npx wrangler login"
            $checks.Auth = $false
        }
    }

    # npm packages
    if (Test-Path (Join-Path $ROOT_DIR "node_modules\@tamyla\clodo-framework")) {
        Write-Success "npm packages installed"
        $checks.Npm = $true
    } else {
        Write-Warning "npm packages not installed — run: npm install"
        $checks.Npm = $false
    }

    return $checks
}

# ── Phase 2: Collect Secrets ──────────────────────────────────────────

function Get-Secrets {
    Write-Host "`nPhase 2: Configure Secrets" -ForegroundColor Cyan

    $secrets = @{}

    # AI Engine Token
    $existing = Get-DevVar "AI_ENGINE_TOKEN"
    if ($existing) {
        Write-Host "AI_ENGINE_TOKEN: $($existing.Substring(0,4))****$($existing.Substring($existing.Length-4))"
        if (!(Read-YesNo "Keep existing token?")) {
            $existing = $null
        }
    }

    if (!$existing) {
        Write-Host "AI_ENGINE_TOKEN: Shared secret between visibility-analytics and ai-engine"
        if (Read-YesNo "Auto-generate secure token?") {
            $secrets.AI_ENGINE_TOKEN = Generate-Token
            Write-Success "Generated: $($secrets.AI_ENGINE_TOKEN.Substring(0,8))..."
        } else {
            $secrets.AI_ENGINE_TOKEN = Read-Secret "Enter AI_ENGINE_TOKEN"
        }
    } else {
        $secrets.AI_ENGINE_TOKEN = $existing
    }

    # Provider keys
    $providers = @(
        @{ Key = "ANTHROPIC_API_KEY"; Label = "Anthropic Claude"; Required = $false; Recommended = $true; Hint = "https://console.anthropic.com/settings/keys" },
        @{ Key = "OPENAI_API_KEY"; Label = "OpenAI"; Required = $false; Hint = "https://platform.openai.com/api-keys" },
        @{ Key = "GOOGLE_AI_API_KEY"; Label = "Google Gemini"; Required = $false; Hint = "https://aistudio.google.com/app/apikey" },
        @{ Key = "MISTRAL_API_KEY"; Label = "Mistral AI"; Required = $false; Hint = "https://console.mistral.ai/api-keys" },
        @{ Key = "DEEPSEEK_API_KEY"; Label = "DeepSeek"; Required = $false; Hint = "https://platform.deepseek.com/api_keys" }
    )

    foreach ($provider in $providers) {
        $existing = Get-DevVar $provider.Key
        if ($existing) {
            Write-Host "$($provider.Key): $($existing.Substring(0,4))****$($existing.Substring($existing.Length-4))"
            if (!(Read-YesNo "Keep existing key?")) {
                $existing = $null
            }
        }

        if (!$existing) {
            Write-Host "$($provider.Label) API Key ($($provider.Hint))"
            $value = Read-Secret "Enter $($provider.Key) (optional)"
            if ($value) {
                $secrets[$provider.Key] = $value
                Write-Success "Set $($provider.Key)"
            } else {
                Write-Host "Skipped $($provider.Label)" -ForegroundColor Gray
            }
        } else {
            $secrets[$provider.Key] = $existing
        }
    }

    # AI Provider preference
    $configuredProviders = $providers | Where-Object { $secrets.ContainsKey($_.Key) }
    if ($configuredProviders.Count -gt 0) {
        Write-Host "`nAvailable providers: $($configuredProviders.Label -join ', '), cloudflare (free fallback)"
    }
    $secrets.AI_PROVIDER = Read-Host "AI_PROVIDER (auto/smart routing)" "auto"

    return $secrets
}

# ── Phase 3: Write .dev.vars ──────────────────────────────────────────

function Write-DevVars($Secrets) {
    Write-Host "`nPhase 3: Write Local Config" -ForegroundColor Cyan

    if ((Test-Path $DEV_VARS_FILE) -and !(Read-YesNo ".dev.vars exists. Overwrite?")) {
        Write-Info "Kept existing .dev.vars"
        return
    }

    $content = @"
# AI Engine — Local Development Secrets
# Generated by setup.ps1 on $(Get-Date -Format "yyyy-MM-dd")
# WARNING: NEVER commit this file. It is gitignored.

# Authentication
AI_ENGINE_TOKEN=$($Secrets.AI_ENGINE_TOKEN)

# Provider API Keys
"@

    $providers = @("ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GOOGLE_AI_API_KEY", "MISTRAL_API_KEY", "DEEPSEEK_API_KEY")
    foreach ($key in $providers) {
        if ($Secrets.ContainsKey($key)) {
            $content += "`n$key=$($Secrets[$key])"
        } else {
            $content += "`n# $key=  # not configured"
        }
    }

    $content += @"

# Provider Routing
AI_PROVIDER=$($Secrets.AI_PROVIDER)
"@

    $content | Out-File $DEV_VARS_FILE -Encoding UTF8
    Write-Success "Written .dev.vars"

    # Verify gitignore
    if (Test-Path $GITIGNORE) {
        $giContent = Get-Content $GITIGNORE -Raw
        if ($giContent -notmatch "\.dev\.vars") {
            Write-Error "WARNING: .dev.vars is NOT in .gitignore! Adding it now..."
            Add-Content $GITIGNORE "`n.dev.vars"
            Write-Success "Added .dev.vars to .gitignore"
        }
    }
}

# ── Phase 4: KV Namespace ─────────────────────────────────────────────

function Setup-KV {
    Write-Host "`nPhase 4: KV Namespace" -ForegroundColor Cyan

    if (!(Test-Path $WRANGLER_TOML)) {
        Write-Error "config/wrangler.toml not found"
        return
    }

    $toml = Get-Content $WRANGLER_TOML -Raw
    $kvMatch = [regex]::Match($toml, 'binding\s*=\s*"KV_AI"\s*\n\s*id\s*=\s*"([^"]*)"')

    if ($kvMatch.Success -and $kvMatch.Groups[1].Value) {
        Write-Success "KV_AI already configured: $($kvMatch.Groups[1].Value.Substring(0,12))..."
        return
    }

    if (!(Read-YesNo "Create KV namespace for ai-engine?")) {
        Write-Info "Skipped — KV features won't work"
        return
    }

    Write-Info "Creating KV_AI namespace..."
    $result = Invoke-Wrangler @("kv", "namespace", "create", "KV_AI", "--config", "config/wrangler.toml")

    if (!$result.Success) {
        Write-Error "Failed to create KV namespace: $($result.Output)"
        return
    }

    $idMatch = [regex]::Match($result.Output, 'id\s*=\s*"([a-f0-9]+)"')
    if (!$idMatch.Success) {
        Write-Warning "Created but couldn't parse ID. Output: $($result.Output)"
        return
    }

    $kvId = $idMatch.Groups[1].Value
    Write-Success "Created KV_AI namespace: $kvId"

    # Update wrangler.toml
    $newToml = $toml -replace 'binding\s*=\s*"KV_AI"\s*\n\s*id\s*=\s*""', "binding = `"KV_AI`"`n    id = `"$kvId`""
    $newToml | Out-File $WRANGLER_TOML -Encoding UTF8
    Write-Success "Updated wrangler.toml with KV_AI ID"
}

# ── Phase 5: Push Secrets ─────────────────────────────────────────────

function Push-Secrets($Secrets) {
    Write-Host "`nPhase 5: Deploy Secrets to Cloudflare" -ForegroundColor Cyan

    if (!(Read-YesNo "Push secrets to Cloudflare?")) {
        Write-Info "Skipped — remember to push secrets before deploying"
        return
    }

    $secretsToPush = $Secrets.GetEnumerator() | Where-Object { $_.Key -ne "AI_PROVIDER" -and $_.Value }

    if ($secretsToPush.Count -eq 0) {
        Write-Warning "No secrets to push"
        return
    }

    Write-Info "Pushing $($secretsToPush.Count) secrets to Cloudflare..."

    $success = 0
    $failed = 0

    foreach ($secret in $secretsToPush) {
        Write-Host "  Pushing $($secret.Key)..." -NoNewline
        $result = Invoke-Wrangler @("secret", "put", $secret.Key, "--config", "config/wrangler.toml")
        if ($result.Success) {
            Write-Success " $($secret.Key)"
            $success++
        } else {
            Write-Error " $($secret.Key): $($result.Output)"
            $failed++
        }
    }

    Write-Info "Pushed: $success succeeded, $failed failed"
}

# ── Phase 6: Validation ───────────────────────────────────────────────

function Show-Summary($Secrets) {
    Write-Host "`nPhase 6: Summary" -ForegroundColor Cyan

    # Providers
    Write-Host "`nProviders:" -ForegroundColor White
    $providers = @(
        @{ Name = "Claude"; Key = "ANTHROPIC_API_KEY"; Recommended = $true },
        @{ Name = "OpenAI"; Key = "OPENAI_API_KEY" },
        @{ Name = "Gemini"; Key = "GOOGLE_AI_API_KEY" },
        @{ Name = "Mistral"; Key = "MISTRAL_API_KEY" },
        @{ Name = "DeepSeek"; Key = "DEEPSEEK_API_KEY" },
        @{ Name = "Cloudflare"; Key = $null; Always = $true }
    )

    foreach ($provider in $providers) {
        $available = $provider.Always -or $Secrets.ContainsKey($provider.Key)
        $icon = if ($available) { "OK" } else { "-" }
        $color = if ($available) { $GREEN } else { "Gray" }
        $tag = if ($provider.Recommended) { " (recommended)" } else { "" }
        $free = if ($provider.Always) { " (free, always available)" } else { "" }
        Write-Host "  $icon $($provider.Name)$tag$free" -ForegroundColor $color
    }

    # Next steps
    Write-Host "`nNext Steps:" -ForegroundColor White
    Write-Host "  → npm run dev          # Start local dev server" -ForegroundColor Gray
    Write-Host "  → npm run test         # Run tests" -ForegroundColor Gray
    Write-Host "  → npm run deploy       # Deploy to Cloudflare" -ForegroundColor Gray

    Write-Success "Setup complete!"
}

# ── Main ──────────────────────────────────────────────────────────────

function Main {
    Write-Host @"
================================================================================
   AI Engine - Setup & Configuration (PowerShell)
   Multi-model AI worker for SEO analytics
================================================================================
"@ -ForegroundColor Cyan

    if ($CheckOnly) {
        Write-Host "`nCheck-only mode - showing current state:`n" -ForegroundColor Yellow
        $prereqs = Test-Prerequisites
        return
    }

    $prereqs = Test-Prerequisites

    if ($LocalOnly -or !$prereqs.Wrangler -or !$prereqs.Auth) {
        Write-Warning "Skipping Cloudflare setup (local-only mode or prerequisites not met)"
        $cloudflare = $false
    } else {
        $cloudflare = $true
    }

    $secrets = Get-Secrets
    Write-DevVars $secrets

    if ($cloudflare) {
        Setup-KV
        Push-Secrets $secrets
    }

    Show-Summary $secrets
}

# ── Run ───────────────────────────────────────────────────────────────

try {
    Main
} catch {
    Write-Error "Setup failed: $($_.Exception.Message)"
    exit 1
}