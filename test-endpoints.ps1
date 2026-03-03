$ErrorActionPreference = "Continue"

Write-Host "`n========== TEST 1: AI Engine Basic Schema Generation ==========" -ForegroundColor Cyan

$json1 = @{
  pages = @(
    @{
      url = "https://clodo.dev/blog/seo"
      path = "/blog/seo"
      title = "SEO Tips for Local Business"
      h1 = "SEO Tips"
      h2s = @("Keyword Research", "On-Page Optimization")
      wordCount = 2500
      keywords = @("SEO", "local", "optimization")
      bodyPreview = "Local SEO is critical for businesses targeting geographic regions."
      siteName = "CLODO"
      language = "en"
    }
  )
  enhance = $false
} | ConvertTo-Json -Depth 10

try {
  Write-Host "Request: 1 page, enhance=false" -ForegroundColor Green
  $resp = Invoke-WebRequest -Uri "https://ai-engine.wetechfounders.workers.dev/ai/generate-schema" `
    -Method POST -Headers @{"Content-Type" = "application/json"} -Body $json1 -TimeoutSec 15
  
  Write-Host "Status: $($resp.StatusCode)" -ForegroundColor Green
  $data = $resp.Content | ConvertFrom-Json
  Write-Host "Pages processed: $($data.pages.Count)" -ForegroundColor White
  if ($data.pages[0]) {
    Write-Host "  URL: $($data.pages[0].url)" -ForegroundColor White
    Write-Host "  Inferred types: $($data.pages[0].inferredTypes -join ', ')" -ForegroundColor White
    Write-Host "  Schemas generated: $($data.pages[0].schemas.Count)" -ForegroundColor White
    if ($data.pages[0].schemas[0]) {
      Write-Host "  First schema type: $($data.pages[0].schemas[0].type)" -ForegroundColor White
      Write-Host "  Markup size: $($data.pages[0].schemas[0].markup.Length) chars" -ForegroundColor White
    }
  }
} catch {
  Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========== TEST 2: Multiple Pages ==========" -ForegroundColor Cyan

$json2 = @{
  pages = @(
    @{
      url = "https://clodo.dev/how-to"
      title = "How To Guide"
      h1 = "Complete Guide"
      h2s = @("Step 1", "Step 2", "Step 3")
      wordCount = 3500
      bodyPreview = "Step by step guide covering the process in detail."
      siteName = "CLODO"
      language = "en"
    },
    @{
      url = "https://clodo.dev/faq"
      title = "FAQ"
      h1 = "Frequently Asked Questions"
      h2s = @("Q1", "Q2")
      wordCount = 800
      bodyPreview = "Common questions and answers."
      siteName = "CLODO"
      language = "en"
    }
  )
  enhance = $false
} | ConvertTo-Json -Depth 10

try {
  Write-Host "Request: 2 pages" -ForegroundColor Green
  $resp = Invoke-WebRequest -Uri "https://ai-engine.wetechfounders.workers.dev/ai/generate-schema" `
    -Method POST -Headers @{"Content-Type" = "application/json"} -Body $json2 -TimeoutSec 15
  
  Write-Host "Status: $($resp.StatusCode)" -ForegroundColor Green
  $data = $resp.Content | ConvertFrom-Json
  Write-Host "Pages processed: $($data.pages.Count)" -ForegroundColor Green
  foreach ($page in $data.pages) {
    Write-Host "  - $($page.url): $($page.schemas.Count) schemas" -ForegroundColor White
  }
} catch {
  Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========== TEST 3: Specific Schema Type Requested ==========" -ForegroundColor Cyan

$json3 = @{
  pages = @(
    @{
      url = "https://clodo.dev/product"
      title = "CLODO Premium"
      h1 = "Premium Features"
      wordCount = 2000
      bodyPreview = "CLODO Premium offers advanced analytics."
      siteName = "CLODO"
      language = "en"
    }
  )
  schemaTypes = @("Product", "BreadcrumbList")
  enhance = $false
} | ConvertTo-Json -Depth 10

try {
  Write-Host "Request: Product schema specifically" -ForegroundColor Green
  $resp = Invoke-WebRequest -Uri "https://ai-engine.wetechfounders.workers.dev/ai/generate-schema" `
    -Method POST -Headers @{"Content-Type" = "application/json"} -Body $json3 -TimeoutSec 15
  
  Write-Host "Status: $($resp.StatusCode)" -ForegroundColor Green
  $data = $resp.Content | ConvertFrom-Json
  Write-Host "Schemas generated: $($data.pages[0].schemas.Count)" -ForegroundColor Green
  $data.pages[0].schemas | ForEach-Object {
    Write-Host "  - Type: $($_.type)" -ForegroundColor White
  }
} catch {
  Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========== TEST 4: VA Proxy Endpoint ==========" -ForegroundColor Cyan

$json4 = @{
  pages = @(
    @{
      url = "https://clodo.dev"
      title = "CLODO Home"
      h1 = "Welcome to CLODO"
      wordCount = 1500
      bodyPreview = "CLODO helps local businesses with SEO analytics."
      siteName = "CLODO"
      language = "en"
    }
  )
} | ConvertTo-Json -Depth 10

try {
  Write-Host "Request to VA proxy endpoint" -ForegroundColor Green
  $resp = Invoke-WebRequest -Uri "https://visibility-analytics.wetechfounders.workers.dev/api/ai/generate-schema" `
    -Method POST -Headers @{"Content-Type" = "application/json"} -Body $json4 -TimeoutSec 15
  
  Write-Host "Status: $($resp.StatusCode)" -ForegroundColor Green
  $data = $resp.Content | ConvertFrom-Json
  Write-Host "Response received from VA: pages = $($data.pages.Count)" -ForegroundColor Green
} catch {
  Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========== TEST 5: Validation - Empty Pages ==========" -ForegroundColor Cyan

$json5 = @{
  pages = @()
  enhance = $false
} | ConvertTo-Json -Depth 10

try {
  Write-Host "Request: empty pages array (should fail validation)" -ForegroundColor Yellow
  $resp = Invoke-WebRequest -Uri "https://ai-engine.wetechfounders.workers.dev/ai/generate-schema" `
    -Method POST -Headers @{"Content-Type" = "application/json"} -Body $json5 -TimeoutSec 15
  
  Write-Host "Status: $($resp.StatusCode)" -ForegroundColor White
  $data = $resp.Content | ConvertFrom-Json
  Write-Host "Response: $($data | ConvertTo-Json -Depth 2)" -ForegroundColor White
} catch {
  Write-Host "Validation error caught (expected): $($_.Exception.Message)" -ForegroundColor Yellow
  if ($_.Exception.Response) {
    Write-Host "  HTTP Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
  }
}

Write-Host "`n========== TEST 6: Markup Structure ==========" -ForegroundColor Cyan

$json6 = @{
  pages = @(
    @{
      url = "https://clodo.dev/blog/article"
      title = "Blog Article"
      h1 = "Article Title"
      h2s = @("Section 1", "Section 2")
      wordCount = 2000
      bodyPreview = "This is a detailed article about SEO strategies."
      siteName = "CLODO"
      language = "en"
    }
  )
  enhance = $false
} | ConvertTo-Json -Depth 10

try {
  Write-Host "Request: Inspect JSON-LD markup structure" -ForegroundColor Green
  $resp = Invoke-WebRequest -Uri "https://ai-engine.wetechfounders.workers.dev/ai/generate-schema" `
    -Method POST -Headers @{"Content-Type" = "application/json"} -Body $json6 -TimeoutSec 15
  
  Write-Host "Status: $($resp.StatusCode)" -ForegroundColor Green
  $data = $resp.Content | ConvertFrom-Json
  
  if ($data.pages[0].schemas) {
    $data.pages[0].schemas | ForEach-Object {
      Write-Host "`nSchema Type: $($_.type)" -ForegroundColor Cyan
      if ($_.markup) {
        try {
          $markup = $_.markup | ConvertFrom-Json
          Write-Host "  @type: $($markup.'@type')" -ForegroundColor White
          Write-Host "  Properties:" -ForegroundColor Yellow
          $markup.PSObject.Properties | Where-Object { $_.Name -ne '@type' -and $_.Name -ne '@context' } | ForEach-Object {
            $val = $_.Value
            if ($val -is [string] -and $val.Length -gt 100) {
              $val = $val.Substring(0, 100) + "..."
            }
            Write-Host "    - $($_.Name): $val" -ForegroundColor White
          }
        } catch {
          Write-Host "  (Markup is string, first 200 chars:)" -ForegroundColor Yellow
          Write-Host "  $($_.markup.Substring(0, [Math]::Min(200, $_.markup.Length)))" -ForegroundColor White
        }
      }
    }
  }
} catch {
  Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n" + "=" * 60 -ForegroundColor Cyan
Write-Host "API ENDPOINT TESTS COMPLETED" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
