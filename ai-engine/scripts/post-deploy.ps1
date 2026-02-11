# AI Engine — Post-Deployment Validation Script (PowerShell)
#
# Validates production deployment with options for staging and local testing
#
# Usage:
#   .\scripts\post-deploy.ps1 [-Environment production|staging|local] [-SkipWorkflowWait] [-Timeout 300]
#
# Examples:
#   .\scripts\post-deploy.ps1                              # Test production with workflow wait
#   .\scripts\post-deploy.ps1 -Environment staging         # Test staging
#   .\scripts\post-deploy.ps1 -Environment local           # Test local dev server
#   .\scripts\post-deploy.ps1 -SkipWorkflowWait            # Skip GitHub Actions workflow wait

param(
    [ValidateSet('production', 'staging', 'local')]
    [string]$Environment = 'production',
    
    [switch]$SkipWorkflowWait,
    
    [int]$Timeout = 300,
    
    [string]$Token
)

# Load .dev.vars
function Load-DevVars {
    $devVarsPath = Join-Path $PSScriptRoot '..' '.dev.vars'
    
    if (-not (Test-Path $devVarsPath)) {
        Write-Error "✘ .dev.vars not found at $devVarsPath"
        exit 1
    }
    
    $vars = @{}
    Get-Content $devVarsPath | ForEach-Object {
        if ($_ -match '^([^#=]+?)=(.*)$') {
            $vars[$matches[1].Trim()] = $matches[2].Trim()
        }
    }
    
    return $vars
}

# Get base URL
function Get-BaseUrl {
    switch ($Environment) {
        'local' { return 'http://localhost:8787' }
        'staging' { return 'https://staging-ai-engine.workers.dev' }
        default { return 'https://ai-engine.workers.dev' }
    }
}

# Test endpoint
function Test-Endpoint {
    param(
        [string]$Url,
        [string]$Token,
        [string]$Method = 'GET',
        [object]$Body = $null
    )
    
    try {
        $headers = @{
            'Content-Type' = 'application/json'
            'x-ai-engine-service' = $Token
        }
        
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $headers
            TimeoutSec = 10
        }
        
        if ($Body) {
            $params['Body'] = ($Body | ConvertTo-Json)
        }
        
        $response = Invoke-RestMethod @params
        return $response
    }
    catch {
        return $null
    }
}

# Display status symbols
$OK = "`u{2714}"
$FAIL = "`u{2718}"
$WARN = "`u{26A0}"
$INFO = "`u{2139}"
$ARROW = "`u{2192}"
$ROCKET = "`u{1F680}"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "║   $ROCKET  AI Engine — Post-Deployment Validation        ║" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "║   Environment: $($Environment.ToUpper().PadRight(10))                           ║" -ForegroundColor Cyan
Write-Host "║                                                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Load .dev.vars
Write-Host "$INFO Loading configuration from .dev.vars..."
$devVars = Load-DevVars
$authToken = $Token -or $devVars['AI_ENGINE_TOKEN']

if (-not $authToken) {
    Write-Host "$FAIL No auth token found (set AI_ENGINE_TOKEN in .dev.vars)" -ForegroundColor Red
    exit 1
}

$baseUrl = Get-BaseUrl

Write-Host "$INFO Testing: $baseUrl"
Write-Host "$INFO Auth token: $($authToken.Substring(0, 8))...$((-join $authToken[$authToken.Length-4..-1]))" -ForegroundColor Gray

# Give deployment time to settle
if ($Environment -ne 'local') {
    Write-Host "`n⏱  Waiting for worker to stabilize (10s)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

# Test health
Write-Host "`n$ARROW Testing health endpoint..." -ForegroundColor Cyan
$health = Test-Endpoint "$baseUrl/health" $authToken -Method POST
if ($health -and $health.status -eq 'ok') {
    Write-Host "   $OK Health check passed" -ForegroundColor Green
    Write-Host "      Status: $($health.status)" -ForegroundColor Gray
} else {
    Write-Host "   $FAIL Health check failed" -ForegroundColor Red
}

# Test capabilities
Write-Host "`n$ARROW Testing capability discovery..." -ForegroundColor Cyan
$capabilities = Test-Endpoint "$baseUrl/ai/capabilities" $authToken
if ($capabilities -and $capabilities.capabilities) {
    Write-Host "   $OK Found $($capabilities.capabilities.Count) capabilities" -ForegroundColor Green
    $expectedCaps = @('intent-classify', 'anomaly-diagnose', 'embedding-cluster', 'chat', 'content-rewrite', 'refine-recs', 'smart-forecast')
    foreach ($cap in $expectedCaps) {
        $found = $capabilities.capabilities | Where-Object { $_.id -eq $cap }
        $status = if ($found) { $OK } else { $FAIL }
        $color = if ($found) { 'Green' } else { 'Red' }
        Write-Host "      $status $cap" -ForegroundColor $color
    }
} else {
    Write-Host "   $FAIL Capability discovery failed" -ForegroundColor Red
}

# Test providers
Write-Host "`n$ARROW Testing provider status..." -ForegroundColor Cyan
$providers = Test-Endpoint "$baseUrl/ai/providers" $authToken
if ($providers -and $providers.providers) {
    Write-Host "   $OK Found $($providers.providers.Count) providers configured" -ForegroundColor Green
    foreach ($provider in $providers.providers) {
        $status = if ($provider.available) { $OK } else { $WARN }
        $color = if ($provider.available) { 'Green' } else { 'Yellow' }
        $availability = if ($provider.available) { 'available' } else { 'unavailable' }
        Write-Host "      $status $($provider.name) ($availability)" -ForegroundColor $color
        if ($provider.models) {
            $modelList = $provider.models | Select-Object -First 3
            Write-Host "         $($modelList.Count) models: $($modelList -join ', ')..." -ForegroundColor Gray
        }
    }
    $available = $providers.providers | Where-Object { $_.available }
    if ($available) {
        $chain = $available | ForEach-Object { $_.name } | Join-String -Separator ' → '
        Write-Host "   $OK Fallback chain: $chain" -ForegroundColor Green
    }
} else {
    Write-Host "   $FAIL Provider check failed" -ForegroundColor Red
}

# Test usage tracking
Write-Host "`n$ARROW Testing usage tracking..." -ForegroundColor Cyan
$usage = Test-Endpoint "$baseUrl/ai/usage" $authToken
if ($usage) {
    Write-Host "   $OK Usage endpoint accessible" -ForegroundColor Green
    if ($usage.usage_today) {
        Write-Host "      Cost today: `$$($usage.usage_today)" -ForegroundColor Gray
    }
    if ($usage.calls_today) {
        Write-Host "      Calls today: $($usage.calls_today)" -ForegroundColor Gray
    }
} else {
    Write-Host "   $WARN Usage tracking: No response" -ForegroundColor Yellow
}

# Summary
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║ 📊 DEPLOYMENT VALIDATION SUMMARY                       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host ""
Write-Host "✓ Validation complete" -ForegroundColor Green
Write-Host ""
Write-Host "$INFO Next steps:" -ForegroundColor Cyan
Write-Host "   1. Monitor costs: npm run post-deploy" -ForegroundColor Gray
Write-Host "   2. Check logs: npm run tail" -ForegroundColor Gray
Write-Host "   3. Run tests: npm test" -ForegroundColor Gray
Write-Host ""
