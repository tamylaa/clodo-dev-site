# Test VA Proxy Endpoint (Authenticated via Service Binding)

$ErrorActionPreference = "Continue"

Write-Host "`n========== TEST: VA Proxy /api/ai/generate-schema ==========" -ForegroundColor Cyan
Write-Host "This endpoint uses service binding (zero-trust auth)" -ForegroundColor Yellow

$testCases = @(
  @{
    name = "Basic blog article"
    payload = @{
      pages = @(
        @{
          url = "https://clodo.dev/blog/seo-tips"
          path = "/blog/seo-tips"
          title = "10 SEO Tips for Local Businesses"
          h1 = "10 SEO Tips for Local Businesses"
          h2s = @("Keyword Research", "On-Page Optimization", "Link Building")
          wordCount = 2500
          keywords = @("SEO", "local business", "optimization")
          bodyPreview = "Local SEO is critical for businesses targeting specific geographic regions. In this guide, we'll explore proven tactics that help small businesses compete in local search results. From optimizing your Google Business Profile to building local citations, these strategies can significantly improve your online visibility."
          siteName = "CLODO"
          language = "en"
        }
      )
    }
  },
  @{
    name = "How-to with multiple sections"
    payload = @{
      pages = @(
        @{
          url = "https://clodo.dev/guides/website-audit"
          path = "/guides/website-audit"
          title = "Complete Website Audit Guide"
          h1 = "Complete Website Audit Guide"
          h2s = @("Step 1: Technical Audit", "Step 2: Content Audit", "Step 3: SEO Audit", "Step 4: Review Results")
          wordCount = 4200
          keywords = @("website audit", "SEO audit", "technical audit")
          bodyPreview = "A comprehensive website audit is essential for understanding your site's current state. This guide walks you through each phase of the audit process, from technical analysis to content assessment."
          siteName = "CLODO"
          language = "en"
        }
      )
    }
  },
  @{
    name = "FAQ page"
    payload = @{
      pages = @(
        @{
          url = "https://clodo.dev/faq"
          path = "/faq"
          title = "Frequently Asked Questions"
          h1 = "Frequently Asked Questions"
          h2s = @("What is CLODO?", "How does it work?", "What is the pricing?", "Is there a free trial?")
          wordCount = 1200
          keywords = @("FAQ", "questions", "help", "support")
          bodyPreview = "Here are the most common questions we receive about CLODO and how it helps local businesses with their SEO."
          siteName = "CLODO"
          language = "en"
        }
      )
    }
  },
  @{
    name = "Product page with schema type specified"
    payload = @{
      pages = @(
        @{
          url = "https://clodo.dev/product"
          path = "/product"
          title = "CLODO Premium"
          h1 = "CLODO Premium Features"
          h2s = @("Analytics Dashboard", "Competitor Tracking", "Keyword Monitoring", "Reports")
          wordCount = 1800
          keywords = @("analytics", "SEO tools", "ranking tracker")
          bodyPreview = "CLODO Premium provides advanced analytics for marketing professionals. Track your rankings, monitor competitors, and generate detailed reports."
          siteName = "CLODO"
          language = "en"
        }
      )
    }
  }
)

$baseUrl = "https://visibility-analytics.wetechfounders.workers.dev/api/ai/generate-schema"
$results = @()

foreach ($testCase in $testCases) {
  Write-Host "`n--- Test: $($testCase.name) ---" -ForegroundColor Green
  
  $json = $testCase.payload | ConvertTo-Json -Depth 10
  
  try {
    Write-Host "Sending request to VA proxy..." -ForegroundColor Cyan
    $response = Invoke-WebRequest `
      -Uri $baseUrl `
      -Method POST `
      -Headers @{"Content-Type" = "application/json"} `
      -Body $json `
      -TimeoutSec 20

Write-Host "[OK] Status: $($response.StatusCode)" -ForegroundColor Green
    
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.pages -and $data.pages.Count -gt 0) {
      $page = $data.pages[0]
      
      Write-Host "[OK] Page processed: $($page.url)" -ForegroundColor Green
      Write-Host "  Inferred schema types: $($page.inferredTypes -join ', ')" -ForegroundColor White
      Write-Host "  Schemas generated: $($page.schemas.Count)" -ForegroundColor White
      
      if ($page.schemas.Count -gt 0) {
        Write-Host "  Schema details:" -ForegroundColor Yellow
        foreach ($i in 0..([Math]::Min(2, $page.schemas.Count - 1))) {
          $schema = $page.schemas[$i]
          Write-Host "    [$($i+1)] Type: $($schema.type)" -ForegroundColor White
          
          if ($schema.markup) {
            try {
              $markup = $schema.markup | ConvertFrom-Json
              Write-Host "        @type: $($markup.'@type')" -ForegroundColor White
              
              # Show a few key properties
              $props = $markup.PSObject.Properties | Select-Object -First 3
              foreach ($prop in $props) {
                if ($prop.Name -notin '@type', '@context') {
                  $val = $prop.Value
                  if ($val -is [array]) {
                    Write-Host "        $($prop.Name): [$($val.Count) items]" -ForegroundColor White
                  } elseif ($val -is [string] -and $val.Length -gt 60) {
                    Write-Host "        $($prop.Name): $($val.Substring(0,60))..." -ForegroundColor White
                  } else {
                    Write-Host "        $($prop.Name): $val" -ForegroundColor White
                  }
                }
              }
            } catch {
              Write-Host "        (Markup JSON parse error)" -ForegroundColor Red
            }
          }
        }
      }
      
      $results += @{
        test = $testCase.name
        url = $page.url
        status = "OK"
        schemasGenerated = $page.schemas.Count
        inferredTypes = ($page.inferredTypes | Join-String -Separator ", ")
      }
    } else {
      Write-Host "[FAIL] No pages in response" -ForegroundColor Red
      $results += @{
        test = $testCase.name
        status = "FAIL"
        error = "No pages in response"
      }
    }
  } catch {
    Write-Host "[ERROR] Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
      try {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $body = $reader.ReadToEnd()
        $objResponse = $body | ConvertFrom-Json
        Write-Host "  Response: $($objResponse | ConvertTo-Json -Depth 2)" -ForegroundColor Red
      } catch {
        Write-Host "  Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
      }
    }
    
    $results += @{
      test = $testCase.name
      status = "FAIL"
      error = $_.Exception.Message
    }
  }
}

# Summary
Write-Host "`n" + ("=" * 70) -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host ("=" * 70) -ForegroundColor Cyan

$successCount = ($results | Where-Object { $_.status -eq "OK" }).Count
$failureCount = ($results | Where-Object { $_.status -eq "FAIL" }).Count

Write-Host "Total tests: $($results.Count)" -ForegroundColor White
Write-Host "Passed: $successCount" -ForegroundColor Green
Write-Host "Failed: $failureCount" -ForegroundColor Red

Write-Host ""
$results | Format-Table -AutoSize

Write-Host ""
Write-Host "Report generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Yellow
