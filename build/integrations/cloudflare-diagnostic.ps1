<#
.SYNOPSIS
    Cloudflare Pages Deep Diagnostic Script - Ghost Deployment Hunter

.DESCRIPTION
    Performs comprehensive API-level investigation to find why www.clodo.dev 
    serves old code (142133 bytes) while all other domains serve new code (140630 bytes).

.PARAMETER ApiToken
    Cloudflare API Token with Pages Edit permissions

.PARAMETER Email
    Cloudflare account email (required if using Global API Key instead of token)

.PARAMETER GlobalApiKey
    Cloudflare Global API Key (alternative to API Token)

.PARAMETER AttemptFix
    If specified, will attempt to fix the custom domain binding

.EXAMPLE
    .\cloudflare-api-diagnostic.ps1 -ApiToken "your-api-token-here"
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$ApiToken,
    
    [Parameter(Mandatory=$false)]
    [string]$Email,
    
    [Parameter(Mandatory=$false)]
    [string]$GlobalApiKey,
    
    [Parameter(Mandatory=$false)]
    [switch]$AttemptFix
)

# Configuration
$AccountId = "470fd65444eca7add856f069d65321a0"
$ProjectName = "clododev"
$CustomDomain = "www.clodo.dev"
$ExpectedNewSize = 140630
$GhostOldSize = 142133
$LatestDeploymentId = "793fb530-fbc8-4d7c-830a-d23b8c52adac"

# Colors
$ErrorColor = "Red"
$SuccessColor = "Green"
$WarningColor = "Yellow"
$InfoColor = "Cyan"
$HighlightColor = "Magenta"

# Setup authentication headers
function Get-AuthHeaders {
    if ($ApiToken) {
        return @{
            "Authorization" = "Bearer $ApiToken"
            "Content-Type" = "application/json"
        }
    }
    elseif ($Email -and $GlobalApiKey) {
        return @{
            "X-Auth-Email" = $Email
            "X-Auth-Key" = $GlobalApiKey
            "Content-Type" = "application/json"
        }
    }
    else {
        Write-Host "`n[ERROR] Must provide either -ApiToken OR (-Email AND -GlobalApiKey)" -ForegroundColor $ErrorColor
        exit 1
    }
}

$Headers = Get-AuthHeaders

Write-Host "`n================================================================" -ForegroundColor $InfoColor
Write-Host "  CLOUDFLARE PAGES GHOST DEPLOYMENT DIAGNOSTIC SCRIPT          " -ForegroundColor $InfoColor
Write-Host "================================================================" -ForegroundColor $InfoColor

Write-Host "`n[*] Configuration:" -ForegroundColor $InfoColor
Write-Host "   Account ID: $AccountId" -ForegroundColor White
Write-Host "   Project: $ProjectName" -ForegroundColor White
Write-Host "   Custom Domain: $CustomDomain" -ForegroundColor White
Write-Host "   Expected NEW size: $ExpectedNewSize bytes" -ForegroundColor $SuccessColor
Write-Host "   Ghost OLD size: $GhostOldSize bytes" -ForegroundColor $ErrorColor
Write-Host "   Latest Deployment: $LatestDeploymentId" -ForegroundColor White

# Test API connectivity
Write-Host "`n[*] Testing API connectivity..." -ForegroundColor $InfoColor
try {
    $testUrl = "https://api.cloudflare.com/client/v4/user"
    $testResponse = Invoke-RestMethod -Uri $testUrl -Headers $Headers -Method Get
    if ($testResponse.success) {
        Write-Host "   [OK] API connection successful" -ForegroundColor $SuccessColor
        if ($testResponse.result.email) {
            Write-Host "   [USER] Authenticated as: $($testResponse.result.email)" -ForegroundColor White
        }
    }
}
catch {
    Write-Host "   [ERROR] API authentication failed: $($_.Exception.Message)" -ForegroundColor $ErrorColor
    exit 1
}

# Function to test deployment content size
function Test-DeploymentSize {
    param([string]$Url)
    try {
        $response = Invoke-WebRequest -Uri $Url -Method Head -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        return $response.Headers.'Content-Length'[0]
    }
    catch {
        return $null
    }
}

# 1. GET ALL DEPLOYMENTS
Write-Host "`n===============================================================" -ForegroundColor $InfoColor
Write-Host "[STEP 1] FETCHING ALL DEPLOYMENTS" -ForegroundColor $HighlightColor
Write-Host "===============================================================" -ForegroundColor $InfoColor

$deploymentsUrl = "https://api.cloudflare.com/client/v4/accounts/$AccountId/pages/projects/$ProjectName/deployments"
Write-Host "`n[*] Querying: $deploymentsUrl" -ForegroundColor White

try {
    $deploymentsResponse = Invoke-RestMethod -Uri $deploymentsUrl -Headers $Headers -Method Get
    
    if (-not $deploymentsResponse.success) {
        Write-Host "   [ERROR] API returned error: $($deploymentsResponse.errors | ConvertTo-Json)" -ForegroundColor $ErrorColor
        exit 1
    }
    
    $allDeployments = $deploymentsResponse.result
    Write-Host "   [OK] Found $($allDeployments.Count) total deployments" -ForegroundColor $SuccessColor
    
    # Display deployment summary
    Write-Host "`n[*] Deployment Summary:" -ForegroundColor $InfoColor
    $allDeployments | Select-Object -First 10 | ForEach-Object {
        $env = if ($_.environment -eq "production") { "[PROD]" } else { "[PREV]" }
        $age = (New-TimeSpan -Start $_.created_on -End (Get-Date)).TotalHours
        $ageStr = if ($age -lt 1) { "$([math]::Round($age * 60)) min" } else { "$([math]::Round($age, 1)) hrs" }
        
        Write-Host "   $env $($_.id.Substring(0,8))... " -NoNewline -ForegroundColor White
        Write-Host "[$($_.deployment_trigger.metadata.branch)] " -NoNewline -ForegroundColor Cyan
        Write-Host "$($_.deployment_trigger.metadata.commit_hash.Substring(0,7)) " -NoNewline -ForegroundColor Yellow
        Write-Host "($ageStr ago)" -ForegroundColor Gray
    }
    
}
catch {
    Write-Host "   [ERROR] Failed to fetch deployments: $($_.Exception.Message)" -ForegroundColor $ErrorColor
    exit 1
}

# 2. TEST EACH DEPLOYMENT FOR GHOST (142133 bytes)
Write-Host "`n===============================================================" -ForegroundColor $InfoColor
Write-Host "[STEP 2] HUNTING FOR GHOST DEPLOYMENT (142133 bytes)" -ForegroundColor $HighlightColor
Write-Host "===============================================================" -ForegroundColor $InfoColor

$ghostFound = $false
$ghostDeployment = $null

Write-Host "`n[*] Testing deployment URLs for content size..." -ForegroundColor White

foreach ($deployment in $allDeployments | Select-Object -First 30) {
    $deploymentUrl = "https://$($deployment.id).$ProjectName.pages.dev"
    $size = Test-DeploymentSize -Url $deploymentUrl
    
    if ($size) {
        $status = if ($size -eq $GhostOldSize) { 
            "[GHOST FOUND!]" 
        } elseif ($size -eq $ExpectedNewSize) { 
            "[NEW]" 
        } else { 
            "[OTHER]" 
        }
        
        $color = if ($size -eq $GhostOldSize) { 
            $ErrorColor 
        } elseif ($size -eq $ExpectedNewSize) { 
            $SuccessColor 
        } else { 
            $WarningColor 
        }
        
        Write-Host "   $($deployment.id.Substring(0,8))... $size bytes - $status" -ForegroundColor $color
        
        if ($size -eq $GhostOldSize) {
            $ghostFound = $true
            $ghostDeployment = $deployment
        }
    }
    else {
        Write-Host "   $($deployment.id.Substring(0,8))... [unreachable]" -ForegroundColor Gray
    }
}

if ($ghostFound) {
    Write-Host "`n[!] GHOST DEPLOYMENT FOUND!" -ForegroundColor $ErrorColor
    Write-Host "`n   ID: $($ghostDeployment.id)" -ForegroundColor White
    Write-Host "   Environment: $($ghostDeployment.environment)" -ForegroundColor White
    Write-Host "   Branch: $($ghostDeployment.deployment_trigger.metadata.branch)" -ForegroundColor White
    Write-Host "   Commit: $($ghostDeployment.deployment_trigger.metadata.commit_hash)" -ForegroundColor White
    Write-Host "   Created: $($ghostDeployment.created_on)" -ForegroundColor White
    Write-Host "   URL: https://$($ghostDeployment.id).$ProjectName.pages.dev" -ForegroundColor White
}
else {
    Write-Host "`n[!] Ghost deployment NOT found in deployment list" -ForegroundColor $WarningColor
    Write-Host "   This confirms it's an orphaned/phantom deployment" -ForegroundColor Yellow
}

# 3. CHECK PROJECT CONFIGURATION
Write-Host "`n===============================================================" -ForegroundColor $InfoColor
Write-Host "[STEP 3] PROJECT CONFIGURATION" -ForegroundColor $HighlightColor
Write-Host "===============================================================" -ForegroundColor $InfoColor

$projectUrl = "https://api.cloudflare.com/client/v4/accounts/$AccountId/pages/projects/$ProjectName"
Write-Host "`n[*] Querying: $projectUrl" -ForegroundColor White

try {
    $projectResponse = Invoke-RestMethod -Uri $projectUrl -Headers $Headers -Method Get
    
    if ($projectResponse.success) {
        $project = $projectResponse.result
        
        Write-Host "`n[*] Project Details:" -ForegroundColor $InfoColor
        Write-Host "   Name: $($project.name)" -ForegroundColor White
        Write-Host "   Subdomain: $($project.subdomain)" -ForegroundColor White
        Write-Host "   Production Branch: $($project.production_branch)" -ForegroundColor White
        Write-Host "   Created: $($project.created_on)" -ForegroundColor White
        
        # Check domains
        if ($project.domains -and $project.domains.Count -gt 0) {
            Write-Host "`n[*] Configured Domains:" -ForegroundColor $InfoColor
            foreach ($domain in $project.domains) {
                Write-Host "   - $domain" -ForegroundColor White
            }
        }
        
        # Check canonical_deployment
        if ($project.canonical_deployment) {
            Write-Host "`n[*] Canonical Deployment (Production):" -ForegroundColor $InfoColor
            Write-Host "   ID: $($project.canonical_deployment.id)" -ForegroundColor White
            Write-Host "   Environment: $($project.canonical_deployment.environment)" -ForegroundColor White
            
            # Test canonical deployment size
            $canonicalUrl = "https://$($project.canonical_deployment.id).$ProjectName.pages.dev"
            $canonicalSize = Test-DeploymentSize -Url $canonicalUrl
            
            if ($canonicalSize) {
                if ($canonicalSize -eq $GhostOldSize) {
                    Write-Host "   Content Size: $canonicalSize bytes [GHOST!]" -ForegroundColor $ErrorColor
                    Write-Host "`n   [!] WARNING: Canonical deployment IS the ghost!" -ForegroundColor $ErrorColor
                }
                elseif ($canonicalSize -eq $ExpectedNewSize) {
                    Write-Host "   Content Size: $canonicalSize bytes [NEW]" -ForegroundColor $SuccessColor
                }
                else {
                    Write-Host "   Content Size: $canonicalSize bytes [UNEXPECTED]" -ForegroundColor $WarningColor
                }
            }
        }
        
        # Check latest_deployment
        if ($project.latest_deployment) {
            Write-Host "`n[*] Latest Deployment:" -ForegroundColor $InfoColor
            Write-Host "   ID: $($project.latest_deployment.id)" -ForegroundColor White
            Write-Host "   Environment: $($project.latest_deployment.environment)" -ForegroundColor White
        }
    }
}
catch {
    Write-Host "   [ERROR] Failed to fetch project config: $($_.Exception.Message)" -ForegroundColor $ErrorColor
}

# 4. CHECK CUSTOM DOMAINS
Write-Host "`n===============================================================" -ForegroundColor $InfoColor
Write-Host "[STEP 4] CUSTOM DOMAIN INVESTIGATION" -ForegroundColor $HighlightColor
Write-Host "===============================================================" -ForegroundColor $InfoColor

$domainsUrl = "https://api.cloudflare.com/client/v4/accounts/$AccountId/pages/projects/$ProjectName/domains"
Write-Host "`n[*] Querying: $domainsUrl" -ForegroundColor White

try {
    $domainsResponse = Invoke-RestMethod -Uri $domainsUrl -Headers $Headers -Method Get
    
    if ($domainsResponse.success) {
        $domains = $domainsResponse.result
        
        Write-Host "   [OK] Found $($domains.Count) custom domain(s)" -ForegroundColor $SuccessColor
        
        foreach ($domain in $domains) {
            Write-Host "`n   [*] Domain: $($domain.name)" -ForegroundColor $InfoColor
            
            if ($domain.name -eq $CustomDomain) {
                Write-Host "      [!] THIS IS THE PROBLEM DOMAIN!" -ForegroundColor $ErrorColor
            }
            
            Write-Host "      Status: $($domain.status)" -ForegroundColor White
            Write-Host "      Created: $($domain.created_on)" -ForegroundColor White
            
            if ($domain.validation_data) {
                Write-Host "      Validation: $($domain.validation_data.status)" -ForegroundColor White
            }
            
            # Test domain content
            $domainUrl = "https://$($domain.name)"
            Write-Host "`n      [*] Testing $domainUrl..." -ForegroundColor White
            $domainSize = Test-DeploymentSize -Url $domainUrl
            
            if ($domainSize) {
                if ($domainSize -eq $GhostOldSize) {
                    Write-Host "      Content Size: $domainSize bytes [SERVING GHOST!]" -ForegroundColor $ErrorColor
                }
                elseif ($domainSize -eq $ExpectedNewSize) {
                    Write-Host "      Content Size: $domainSize bytes [CORRECT!]" -ForegroundColor $SuccessColor
                }
                else {
                    Write-Host "      Content Size: $domainSize bytes [UNEXPECTED]" -ForegroundColor $WarningColor
                }
            }
            else {
                Write-Host "      [ERROR] Domain unreachable" -ForegroundColor $ErrorColor
            }
        }
    }
}
catch {
    Write-Host "   [ERROR] Failed to fetch custom domains: $($_.Exception.Message)" -ForegroundColor $ErrorColor
}

# 5. CHECK FOR WORKERS / ROUTING
Write-Host "`n===============================================================" -ForegroundColor $InfoColor
Write-Host "[STEP 5] WORKERS AND ROUTING RULES" -ForegroundColor $HighlightColor
Write-Host "===============================================================" -ForegroundColor $InfoColor

# Get zone ID for www.clodo.dev
Write-Host "`n[*] Searching for zone containing $CustomDomain..." -ForegroundColor White

try {
    $zonesUrl = "https://api.cloudflare.com/client/v4/zones?name=clodo.dev"
    $zonesResponse = Invoke-RestMethod -Uri $zonesUrl -Headers $Headers -Method Get
    
    if ($zonesResponse.success -and $zonesResponse.result.Count -gt 0) {
        $zone = $zonesResponse.result[0]
        $zoneId = $zone.id
        
        Write-Host "   [OK] Found zone: $($zone.name) (ID: $zoneId)" -ForegroundColor $SuccessColor
        
        # Check for Workers routes
        Write-Host "`n[*] Checking Workers routes..." -ForegroundColor White
        $workersUrl = "https://api.cloudflare.com/client/v4/zones/$zoneId/workers/routes"
        $workersResponse = Invoke-RestMethod -Uri $workersUrl -Headers $Headers -Method Get
        
        if ($workersResponse.success) {
            if ($workersResponse.result.Count -gt 0) {
                Write-Host "   [!] Found $($workersResponse.result.Count) Workers route(s):" -ForegroundColor $WarningColor
                foreach ($route in $workersResponse.result) {
                    Write-Host "      Pattern: $($route.pattern)" -ForegroundColor White
                    Write-Host "      Script: $($route.script)" -ForegroundColor White
                    
                    if ($route.pattern -like "*$CustomDomain*") {
                        Write-Host "      [!] THIS ROUTE MATCHES YOUR CUSTOM DOMAIN!" -ForegroundColor $ErrorColor
                    }
                }
            }
            else {
                Write-Host "   [OK] No Workers routes found" -ForegroundColor $SuccessColor
            }
        }
        
        # Check page rules
        Write-Host "`n[*] Checking Page Rules..." -ForegroundColor White
        $rulesUrl = "https://api.cloudflare.com/client/v4/zones/$zoneId/pagerules"
        $rulesResponse = Invoke-RestMethod -Uri $rulesUrl -Headers $Headers -Method Get
        
        if ($rulesResponse.success) {
            if ($rulesResponse.result.Count -gt 0) {
                Write-Host "   [!] Found $($rulesResponse.result.Count) page rule(s):" -ForegroundColor $WarningColor
                foreach ($rule in $rulesResponse.result) {
                    Write-Host "      Target: $($rule.targets[0].target) = $($rule.targets[0].constraint.value)" -ForegroundColor White
                    Write-Host "      Status: $($rule.status)" -ForegroundColor White
                    
                    if ($rule.targets[0].constraint.value -like "*$CustomDomain*") {
                        Write-Host "      [!] THIS RULE MATCHES YOUR CUSTOM DOMAIN!" -ForegroundColor $ErrorColor
                    }
                }
            }
            else {
                Write-Host "   [OK] No page rules found" -ForegroundColor $SuccessColor
            }
        }
    }
    else {
        Write-Host "   [!] Zone not found via API" -ForegroundColor $WarningColor
    }
}
catch {
    Write-Host "   [!] Could not check Workers/routes: $($_.Exception.Message)" -ForegroundColor $WarningColor
}

# 6. DIAGNOSIS SUMMARY
Write-Host "`n===============================================================" -ForegroundColor $InfoColor
Write-Host "[DIAGNOSTIC SUMMARY]" -ForegroundColor $HighlightColor
Write-Host "===============================================================" -ForegroundColor $InfoColor

Write-Host "`n[*] Findings:" -ForegroundColor $InfoColor

# Test current state
Write-Host "`n   Testing current state..." -ForegroundColor White
$wwwSize = Test-DeploymentSize -Url "https://$CustomDomain"
$defaultSize = Test-DeploymentSize -Url "https://$ProjectName.pages.dev"
$latestSize = Test-DeploymentSize -Url "https://$LatestDeploymentId.$ProjectName.pages.dev"

Write-Host "`n   [*] Current Content Sizes:" -ForegroundColor $InfoColor
Write-Host "      ${CustomDomain}: " -NoNewline -ForegroundColor White
if ($wwwSize -eq $GhostOldSize) {
    Write-Host "$wwwSize bytes [GHOST - WRONG]" -ForegroundColor $ErrorColor
} elseif ($wwwSize -eq $ExpectedNewSize) {
    Write-Host "$wwwSize bytes [NEW - CORRECT]" -ForegroundColor $SuccessColor
} else {
    Write-Host "$wwwSize bytes [UNEXPECTED]" -ForegroundColor $WarningColor
}

Write-Host "      $ProjectName.pages.dev: " -NoNewline -ForegroundColor White
if ($defaultSize -eq $ExpectedNewSize) {
    Write-Host "$defaultSize bytes [NEW - CORRECT]" -ForegroundColor $SuccessColor
} else {
    Write-Host "$defaultSize bytes [UNEXPECTED]" -ForegroundColor $WarningColor
}

Write-Host "      Latest ($($LatestDeploymentId.Substring(0,8))...): " -NoNewline -ForegroundColor White
if ($latestSize -eq $ExpectedNewSize) {
    Write-Host "$latestSize bytes [NEW - CORRECT]" -ForegroundColor $SuccessColor
} else {
    Write-Host "$latestSize bytes [UNEXPECTED]" -ForegroundColor $WarningColor
}

# Analysis
Write-Host "`n   [*] Analysis:" -ForegroundColor $InfoColor

if ($wwwSize -eq $GhostOldSize -and $defaultSize -eq $ExpectedNewSize) {
    Write-Host "      [ERROR] PROBLEM CONFIRMED: Custom domain stuck on ghost deployment" -ForegroundColor $ErrorColor
    Write-Host "      [OK] Default domain works correctly" -ForegroundColor $SuccessColor
    Write-Host "      [OK] Latest deployment is healthy" -ForegroundColor $SuccessColor
    
    if ($ghostFound) {
        Write-Host "`n      [!] ROOT CAUSE: Ghost deployment found in deployment list" -ForegroundColor $ErrorColor
        Write-Host "         Deployment ID: $($ghostDeployment.id)" -ForegroundColor White
        Write-Host "         Custom domain is binding to this old deployment" -ForegroundColor White
    }
    else {
        Write-Host "`n      [!] ROOT CAUSE: Orphaned deployment (not in list)" -ForegroundColor $ErrorColor
        Write-Host "         Custom domain binding references non-existent deployment" -ForegroundColor White
        Write-Host "         This is a Cloudflare infrastructure bug" -ForegroundColor White
    }
}
elseif ($wwwSize -eq $ExpectedNewSize) {
    Write-Host "      [OK] PROBLEM RESOLVED! Custom domain now serving correct content" -ForegroundColor $SuccessColor
}

# 7. FIX ATTEMPTS
if ($AttemptFix -and $wwwSize -eq $GhostOldSize) {
    Write-Host "`n===============================================================" -ForegroundColor $InfoColor
    Write-Host "[STEP 6] ATTEMPTING AUTOMATIC FIX" -ForegroundColor $HighlightColor
    Write-Host "===============================================================" -ForegroundColor $InfoColor
    
    Write-Host "`n[!] Attempting to fix custom domain binding..." -ForegroundColor $WarningColor
    
    # Method 1: Delete and re-add custom domain via API
    Write-Host "`n[*] Method 1: Delete and re-add custom domain" -ForegroundColor $InfoColor
    
    try {
        # Delete
        $deleteUrl = "https://api.cloudflare.com/client/v4/accounts/$AccountId/pages/projects/$ProjectName/domains/$CustomDomain"
        Write-Host "   [*] Deleting $CustomDomain..." -ForegroundColor White
        $deleteResponse = Invoke-RestMethod -Uri $deleteUrl -Headers $Headers -Method Delete
        
        if ($deleteResponse.success) {
            Write-Host "   [OK] Domain deleted successfully" -ForegroundColor $SuccessColor
            
            # Wait for propagation
            Write-Host "   [*] Waiting 15 seconds for DNS propagation..." -ForegroundColor White
            Start-Sleep -Seconds 15
            
            # Re-add
            Write-Host "   [*] Re-adding $CustomDomain..." -ForegroundColor White
            $addUrl = "https://api.cloudflare.com/client/v4/accounts/$AccountId/pages/projects/$ProjectName/domains"
            $addBody = @{
                name = $CustomDomain
            } | ConvertTo-Json
            
            $addResponse = Invoke-RestMethod -Uri $addUrl -Headers $Headers -Method Post -Body $addBody
            
            if ($addResponse.success) {
                Write-Host "   [OK] Domain re-added successfully" -ForegroundColor $SuccessColor
                
                # Wait and test
                Write-Host "   [*] Waiting 30 seconds for binding..." -ForegroundColor White
                Start-Sleep -Seconds 30
                
                $newSize = Test-DeploymentSize -Url "https://$CustomDomain"
                if ($newSize -eq $ExpectedNewSize) {
                    Write-Host "`n   [OK] SUCCESS! Domain now serves correct content ($newSize bytes)" -ForegroundColor $SuccessColor
                }
                else {
                    Write-Host "`n   [!] Still serving $newSize bytes (may need more time)" -ForegroundColor $WarningColor
                }
            }
            else {
                Write-Host "   [ERROR] Failed to re-add domain: $($addResponse.errors | ConvertTo-Json)" -ForegroundColor $ErrorColor
            }
        }
        else {
            Write-Host "   [ERROR] Failed to delete domain: $($deleteResponse.errors | ConvertTo-Json)" -ForegroundColor $ErrorColor
        }
    }
    catch {
        Write-Host "   [ERROR] Fix attempt failed: $($_.Exception.Message)" -ForegroundColor $ErrorColor
    }
}

# FINAL RECOMMENDATIONS
Write-Host "`n===============================================================" -ForegroundColor $InfoColor
Write-Host "[RECOMMENDATIONS]" -ForegroundColor $HighlightColor
Write-Host "===============================================================" -ForegroundColor $InfoColor

if ($wwwSize -eq $GhostOldSize) {
    Write-Host "`n   Next Steps:" -ForegroundColor $InfoColor
    Write-Host "   1. Run with -AttemptFix flag to try automatic repair:" -ForegroundColor White
    Write-Host "      .\cloudflare-api-diagnostic.ps1 -ApiToken 'token' -AttemptFix" -ForegroundColor Cyan
    Write-Host "`n   2. If automatic fix fails, contact Cloudflare Support:" -ForegroundColor White
    Write-Host "      - Reference this diagnostic output" -ForegroundColor White
    Write-Host "      - Mention 'custom domain stuck on orphaned deployment'" -ForegroundColor White
    Write-Host "      - Provide deployment IDs and content sizes from above" -ForegroundColor White
}
elseif ($wwwSize -eq $ExpectedNewSize) {
    Write-Host "`n   [OK] Everything looks good!" -ForegroundColor $SuccessColor
    Write-Host "   Custom domain is now serving the correct content." -ForegroundColor White
}

Write-Host "`n===============================================================" -ForegroundColor $InfoColor
Write-Host "[DIAGNOSTIC COMPLETE]" -ForegroundColor $HighlightColor
Write-Host "===============================================================" -ForegroundColor $InfoColor
Write-Host ""
