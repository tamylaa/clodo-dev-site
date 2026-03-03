# ============================================================================
# Test Schema Generation API Endpoints
# ============================================================================

$ErrorActionPreference = "Continue"

# Test 1: AI Engine - Basic Schema Generation (no LLM)
Write-Host "`n" + ("=" * 80) -ForegroundColor Cyan
Write-Host "TEST 1: AI Engine - Basic Schema Generation (enhance=false)" -ForegroundColor Cyan
Write-Host ("=" * 80) -ForegroundColor Cyan

$payload1 = @{
  pages = @(
    @{
      url = "https://clodo.dev/blog/seo-tips"
      path = "/blog/seo-tips"
      title = "10 SEO Tips for Local Businesses"
      description = "Learn how to optimize your website for local search results"
      h1 = "10 SEO Tips for Local Businesses"
      h2s = @("Keyword Research", "On-Page Optimization", "Link Building", "Technical SEO")
      wordCount = 2500
      keywords = @("SEO", "local business", "optimization", "search engine")
      bodyPreview = "Local SEO is critical for businesses targeting specific geographic regions. In this guide, we'll explore proven tactics that help small businesses compete in local search results."
      siteName = "CLODO"
      language = "en"
    }
  )
  enhance = $false
} | ConvertTo-Json -Depth 10

Write-Host "Request Payload:" -ForegroundColor Green
$payload1 | Write-Host

try {
  $response1 = Invoke-WebRequest `
    -Uri "https://ai-engine.wetechfounders.workers.dev/ai/generate-schema" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body $payload1 `
    -TimeoutSec 15

  Write-Host "`n✓ Response Status: $($response1.StatusCode)" -ForegroundColor Green
  $result1 = $response1.Content | ConvertFrom-Json
  Write-Host "✓ Response received" -ForegroundColor Green
  
  Write-Host "`nResponse Details:" -ForegroundColor Yellow
  Write-Host "  - Pages processed: $($result1.pages.Count)" -ForegroundColor White
  if ($result1.pages.Count -gt 0) {
    $page = $result1.pages[0]
    Write-Host "  - First page URL: $($page.url)" -ForegroundColor White
    Write-Host "  - Inferred types: $($page.inferredTypes -join ', ')" -ForegroundColor White
    Write-Host "  - Generated schemas: $($page.schemas.Count)" -ForegroundColor White
    if ($page.schemas.Count -gt 0) {
      Write-Host "`n  Schema Details (first schema):" -ForegroundColor Yellow
      $schema = $page.schemas[0]
      Write-Host "    Type: $($schema.type)" -ForegroundColor White
      Write-Host "    Has markup: $($schema.markup.Length -gt 0)" -ForegroundColor White
      if ($schema.markup) {
        $markup = $schema.markup | ConvertFrom-Json
        Write-Host "    Markup @type: $($markup.'@type')" -ForegroundColor White
        Write-Host "    Markup keys: $($markup.PSObject.Properties.Name -join ', ')" -ForegroundColor White
      }
    }
  }
} catch {
  Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
  if ($_.Exception.Response) {
    Write-Host "Response Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = [System.IO.StreamReader]::new($stream)
    $body = $reader.ReadToEnd()
    Write-Host "Response Body: $body" -ForegroundColor Red
  }
}

# Test 2: AI Engine - With Multiple Pages
Write-Host "`n" + ("=" * 80) -ForegroundColor Cyan
Write-Host "TEST 2: AI Engine - Multiple Pages" -ForegroundColor Cyan
Write-Host ("=" * 80) -ForegroundColor Cyan

$payload2 = @{
  pages = @(
    @{
      url = "https://clodo.dev/how-to-audit-website"
      path = "/guides/how-to-audit"
      title = "Complete Website Audit Checklist"
      h1 = "Complete Website Audit Checklist"
      h2s = @("Technical Audit", "Content Audit", "SEO Audit")
      wordCount = 3500
      keywords = @("website audit", "SEO audit", "checklist")
      bodyPreview = "In this guide, we provide a step-by-step breakdown of how to conduct a comprehensive website audit covering technical, content, and SEO aspects."
      siteName = "CLODO"
      language = "en"
    },
    @{
      url = "https://clodo.dev/faq"
      path = "/faq"
      title = "Frequently Asked Questions"
      h1 = "FAQ"
      h2s = @("General Questions", "Pricing", "Support")
      wordCount = 800
      keywords = @("FAQ", "questions", "help")
      bodyPreview = "Common questions about our platform and services."
      siteName = "CLODO"
      language = "en"
    }
  )
  enhance = $false
} | ConvertTo-Json -Depth 10

Write-Host "Request (2 pages):" -ForegroundColor Green

try {
  $response2 = Invoke-WebRequest `
    -Uri "https://ai-engine.wetechfounders.workers.dev/ai/generate-schema" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body $payload2 `
    -TimeoutSec 15

  Write-Host "✓ Response Status: $($response2.StatusCode)" -ForegroundColor Green
  $result2 = $response2.Content | ConvertFrom-Json
  
  Write-Host "✓ Pages processed: $($result2.pages.Count)" -ForegroundColor Green
  foreach ($i in 0..($result2.pages.Count - 1)) {
    $page = $result2.pages[$i]
    Write-Host "  Page $($i+1): $($page.url)" -ForegroundColor White
    Write-Host "    - Inferred: $($page.inferredTypes -join ', ')" -ForegroundColor White
    Write-Host "    - Schemas: $($page.schemas.Count)" -ForegroundColor White
  }
} catch {
  Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: AI Engine - With Specific Schema Types Requested
Write-Host "`n" + ("=" * 80) -ForegroundColor Cyan
Write-Host "TEST 3: AI Engine - Request Specific Schema Types" -ForegroundColor Cyan
Write-Host ("=" * 80) -ForegroundColor Cyan

$payload3 = @{
  pages = @(
    @{
      url = "https://clodo.dev/product"
      path = "/product"
      title = "CLODO Premium"
      h1 = "CLODO Premium Features"
      wordCount = 2000
      bodyPreview = "CLODO Premium offers advanced analytics and reporting features for SEO professionals."
      siteName = "CLODO"
      language = "en"
    }
  )
  schemaTypes = @("Product")
  enhance = $false
} | ConvertTo-Json -Depth 10

Write-Host "Request (schemaTypes: Product):" -ForegroundColor Green

try {
  $response3 = Invoke-WebRequest `
    -Uri "https://ai-engine.wetechfounders.workers.dev/ai/generate-schema" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body $payload3 `
    -TimeoutSec 15

  Write-Host "✓ Response Status: $($response3.StatusCode)" -ForegroundColor Green
  $result3 = $response3.Content | ConvertFrom-Json
  
  Write-Host "✓ Generated schemas:" -ForegroundColor Green
  $result3.pages[0].schemas | ForEach-Object {
    Write-Host "  - $($_.type): $($_.markup.Length) chars of markup" -ForegroundColor White
  }
} catch {
  Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: VA Proxy Endpoint
Write-Host "`n" + ("=" * 80) -ForegroundColor Cyan
Write-Host "TEST 4: VA Proxy - /api/ai/generate-schema" -ForegroundColor Cyan
Write-Host ("=" * 80) -ForegroundColor Cyan

$payload4 = @{
  pages = @(
    @{
      url = "https://clodo.dev/blog/article"
      path = "/blog/article"
      title = "Understanding Local SEO"
      h1 = "Understanding Local SEO"
      h2s = @("Google Business Profile", "Local Citations")
      wordCount = 2200
      keywords = @("local SEO", "Google Business")
      bodyPreview = "Local SEO strategies help businesses rank better in local searches and attract nearby customers."
      siteName = "CLODO"
      language = "en"
    }
  )
} | ConvertTo-Json -Depth 10

Write-Host "Request:" -ForegroundColor Green

try {
  $response4 = Invoke-WebRequest `
    -Uri "https://visibility-analytics.wetechfounders.workers.dev/api/ai/generate-schema" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body $payload4 `
    -TimeoutSec 15

  Write-Host "✓ Response Status: $($response4.StatusCode)" -ForegroundColor Green
  $result4 = $response4.Content | ConvertFrom-Json
  
  Write-Host "✓ VA Proxy Response:" -ForegroundColor Green
  Write-Host "  - Pages: $($result4.pages.Count)" -ForegroundColor White
  Write-Host "  - Full data passed through from AI Engine" -ForegroundColor White
} catch {
  Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
  if ($_.Exception.Response) {
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
  }
}

# Test 5: Error Handling - Empty Pages Array
Write-Host "`n" + ("=" * 80) -ForegroundColor Cyan
Write-Host "TEST 5: Error Handling - Empty Pages Array" -ForegroundColor Cyan
Write-Host ("=" * 80) -ForegroundColor Cyan

$payload5 = @{
  pages = @()
  enhance = $false
} | ConvertTo-Json -Depth 10

Write-Host "Request (empty pages):" -ForegroundColor Green

try {
  $response5 = Invoke-WebRequest `
    -Uri "https://ai-engine.wetechfounders.workers.dev/ai/generate-schema" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body $payload5 `
    -TimeoutSec 15

  Write-Host "✓ Response Status: $($response5.StatusCode)" -ForegroundColor Green
  $result5 = $response5.Content | ConvertFrom-Json
  Write-Host "✓ Result: Pages count = $($result5.pages.Count)" -ForegroundColor Green
} catch {
  Write-Host "✗ Caught Error (expected): $($_.Exception.Message)" -ForegroundColor Yellow
  if ($_.Exception.Response.StatusCode) {
    Write-Host "  Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
  }
}

# Test 6: Edge Case - Missing Required Fields
Write-Host "`n" + ("=" * 80) -ForegroundColor Cyan
Write-Host "TEST 6: Validation - Missing Required Fields" -ForegroundColor Cyan
Write-Host ("=" * 80) -ForegroundColor Cyan

$payload6 = @{
  pages = @(
    @{
      url = "https://clodo.dev"
      # Missing h1, title, etc.
    }
  )
} | ConvertTo-Json -Depth 10

Write-Host "Request (incomplete page object):" -ForegroundColor Green

try {
  $response6 = Invoke-WebRequest `
    -Uri "https://ai-engine.wetechfounders.workers.dev/ai/generate-schema" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body $payload6 `
    -TimeoutSec 15

  Write-Host "✓ Response Status: $($response6.StatusCode)" -ForegroundColor Green
  $result6 = $response6.Content | ConvertFrom-Json
  Write-Host "Response: $($result6 | ConvertTo-Json -Depth 3)" -ForegroundColor White
} catch {
  Write-Host "✗ Caught Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n" + ("=" * 80) -ForegroundColor Cyan
Write-Host "ALL TESTS COMPLETED" -ForegroundColor Cyan
Write-Host ("=" * 80) -ForegroundColor Cyan
