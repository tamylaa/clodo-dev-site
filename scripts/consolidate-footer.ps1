#!/usr/bin/env pwsh
# Consolidate all footer-related CSS styling into footer.css

$ErrorActionPreference = "Stop"

$layoutCssPath = "public/css/layout.css"
$componentsCssPath = "public/css/components.css"
$footerCssPath = "public/css/global/footer.css"

Write-Host "`nFOOTER CSS CONSOLIDATION SCRIPT`n" -ForegroundColor Cyan

# Read source files
Write-Host "Reading source CSS files..." -ForegroundColor Yellow
$layoutContent = Get-Content $layoutCssPath -Raw
$componentsContent = Get-Content $componentsCssPath -Raw

# Extract footer styles from layout.css (if they still exist)
Write-Host "Extracting footer styles from layout.css..." -ForegroundColor Yellow
$footerPatternLayout = '\/\* ===== FOOTER ===== \*\/.*?(?=\/\* ===== SUBSCRIPTION PAGE ===== \*\/)'
$footerFromLayout = [regex]::Match($layoutContent, $footerPatternLayout, [System.Text.RegularExpressions.RegexOptions]::Singleline).Value

if ($footerFromLayout) {
    $lineCount = ($footerFromLayout -split "`n").Count
    Write-Host "  Found $lineCount lines of footer CSS in layout.css" -ForegroundColor Green
} else {
    Write-Host "  No footer section found in layout.css (already removed)" -ForegroundColor Yellow
}

# Extract footer styles from components.css
Write-Host "Extracting footer rules from components.css..." -ForegroundColor Yellow
$footerPatternComponents = '\.footer-[a-zA-Z-]*\s*\{[^}]*\}'
$footerMatches = [regex]::Matches($componentsContent, $footerPatternComponents)
Write-Host "  Found $($footerMatches.Count) footer rules in components.css" -ForegroundColor Green

# Read existing footer.css to preserve any custom styling
Write-Host "Reading existing footer.css..." -ForegroundColor Yellow
$existingFooter = Get-Content $footerCssPath -Raw

# Create consolidated footer
$consolidatedFooter = "/* FOOTER COMPONENT - CONSOLIDATED CSS */`n`n"
if ($footerFromLayout) {
    $consolidatedFooter += $footerFromLayout + "`n"
} else {
    $consolidatedFooter = $existingFooter
}

# Save consolidated footer
Write-Host "Saving consolidated footer to footer.css..." -ForegroundColor Yellow
$consolidatedFooter | Set-Content $footerCssPath -Encoding UTF8
Write-Host "  Saved!" -ForegroundColor Green

# Remove footer section from layout.css
Write-Host "Removing footer styles from layout.css..." -ForegroundColor Yellow
$updatedLayout = $layoutContent -replace '\/\* ===== FOOTER ===== \*\/[\s\S]*?(?=\/\* ===== SUBSCRIPTION PAGE ===== \*\/)', ''
$updatedLayout | Set-Content $layoutCssPath -Encoding UTF8
Write-Host "  Removed!" -ForegroundColor Green

# Remove footer rules from components.css
Write-Host "Removing footer rules from components.css..." -ForegroundColor Yellow
$updatedComponents = $componentsContent
foreach ($match in $footerMatches) {
    $updatedComponents = $updatedComponents.Replace($match.Value, '')
}

# Clean up extra newlines
$updatedComponents = $updatedComponents -replace '[\n]{3,}', "`n`n"
$updatedComponents | Set-Content $componentsCssPath -Encoding UTF8
Write-Host "  Removed $($footerMatches.Count) rules!" -ForegroundColor Green

# Summary
Write-Host "`nCONSOLIDATION COMPLETE`n" -ForegroundColor Green
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  - public/css/global/footer.css: Consolidated footer styles" -ForegroundColor White
Write-Host "  - public/css/layout.css: Footer styles removed" -ForegroundColor White
Write-Host "  - public/css/components.css: $($footerMatches.Count) footer rules removed" -ForegroundColor White
Write-Host "`nNext: Run 'node build.js' to rebuild`n" -ForegroundColor Yellow
