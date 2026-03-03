$headers = @{
    'Authorization' = 'Bearer ziO66aFtTqnizF3C_zl6pcYO6t73UFyb8nh0nBCxz1U'
    'Content-Type'  = 'application/json'
}

$body = @{
    pages = @(
        @{
            url         = 'https://example.com/blog/seo-tips'
            title       = 'Top 10 SEO Tips for 2026'
            description = 'Learn proven strategies to boost your search visibility'
            contentType = 'article'
            h2s         = @('Why SEO Matters', 'How to Start', 'Quick Wins', 'Common Mistakes')
        }
    )
    schemaTypes = @('Article', 'FAQPage')
    enhance     = $true
} | ConvertTo-Json -Depth 5

Write-Host '=== Testing POST /api/ai/generate-schema ===' -ForegroundColor Cyan
Write-Host ''

try {
    $response = Invoke-RestMethod -Uri 'https://visibility-analytics.wetechfounders.workers.dev/api/ai/generate-schema' `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host 'SUCCESS!' -ForegroundColor Green
    Write-Host ''
    Write-Host 'Response Summary:' -ForegroundColor Yellow
    Write-Host "  - Total Pages: $($response.summary.totalPages)"
    Write-Host "  - Total Schemas: $($response.summary.totalSchemas)"
    Write-Host "  - Schema Types Generated: $($response.summary.typesGenerated -join ', ')"
    
    Write-Host ''
    Write-Host 'Full Response:' -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 10
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorBody = $_.ErrorDetails.Message
    Write-Host "HTTP $statusCode - ERROR" -ForegroundColor Red
    Write-Host $errorBody
}
