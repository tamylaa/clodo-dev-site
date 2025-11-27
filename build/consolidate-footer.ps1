#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Consolidate all footer-related CSS styling into footer.css
.DESCRIPTION
    This script:
    1. Extracts footer styles from components.css and layout.css
    2. Consolidates them into public/css/global/footer.css
    3. Removes duplicates and orphaned footer rules
    4. Cleans up source files
#>

$ErrorActionPreference = "Stop"

# Define file paths
$layoutCssPath = "public/css/layout.css"
$componentsCssPath = "public/css/components.css"
$footerCssPath = "public/css/global/footer.css"
$tempFooterPath = ".footer-consolidated.tmp"

Write-Host "`n📋 FOOTER CSS CONSOLIDATION SCRIPT`n" -ForegroundColor Cyan

# Read source files
Write-Host "📖 Reading source CSS files..." -ForegroundColor Yellow
$layoutContent = Get-Content $layoutCssPath -Raw
$componentsContent = Get-Content $componentsCssPath -Raw

# Extract footer styles from layout.css
Write-Host "✂️  Extracting footer styles from layout.css..." -ForegroundColor Yellow

# Match pattern: /* ===== FOOTER ===== */ to /* ===== SUBSCRIPTION PAGE ===== */
$footerPatternLayout = '\/\* ===== FOOTER ===== \*\/.*?(?=\/\* ===== SUBSCRIPTION PAGE ===== \*\/)'
$footerFromLayout = [regex]::Match($layoutContent, $footerPatternLayout, [System.Text.RegularExpressions.RegexOptions]::Singleline).Value

if ($footerFromLayout) {
    Write-Host "  ✓ Found $(($footerFromLayout -split "`n").Count) lines of footer CSS in layout.css" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  No footer section found in layout.css (might already be removed)" -ForegroundColor Yellow
}

# Extract footer styles from components.css
Write-Host "Extracting footer styles from components.css..." -ForegroundColor Yellow

# Match pattern: .footer-* rules (everything that starts with .footer)
$footerPatternComponents = '\.footer-[a-zA-Z-]*\s*\{[^}]*\}'
$footerMatches = [regex]::Matches($componentsContent, $footerPatternComponents)

Write-Host "  ✓ Found $($footerMatches.Count) footer-related CSS rules in components.css" -ForegroundColor Green

# Read existing footer.css
Write-Host "📖 Reading existing footer.css..." -ForegroundColor Yellow
$existingFooter = Get-Content $footerCssPath -Raw

# Create consolidated footer content
Write-Host "🔧 Consolidating footer styles..." -ForegroundColor Yellow

$consolidatedFooter = @"
/* ===========================================
   GLOBAL FOOTER COMPONENT
   ===========================================
   
   Authoritative footer styling consolidated from:
   - layout.css (main styles + responsive breakpoints)
   - components.css (older duplicate rules)
   
   Single source of truth for all footer component styling
   =========================================== */

"@

# Add content from layout.css (if found)
if ($footerFromLayout) {
    $consolidatedFooter += "/* FOOTER STYLES FROM layout.css */" + "`n"
    $consolidatedFooter += $footerFromLayout + "`n`n"
} else {
    Write-Host "⚠️  Using existing footer.css as base (layout.css footer already removed)" -ForegroundColor Yellow
    $consolidatedFooter = $existingFooter
}

# Save consolidated footer
Write-Host "Saving consolidated footer.css..." -ForegroundColor Yellow
$consolidatedFooter | Set-Content $footerCssPath -Encoding UTF8
Write-Host "  ✓ Saved consolidated footer to: $footerCssPath" -ForegroundColor Green

# Remove footer styles from layout.css
Write-Host "🗑️  Removing footer styles from layout.css..." -ForegroundColor Yellow
$updatedLayout = $layoutContent -replace '\/\* ===== FOOTER ===== \*\/[\s\S]*?(?=\/\* ===== SUBSCRIPTION PAGE ===== \*\/)', ''
$updatedLayout | Set-Content $layoutCssPath -Encoding UTF8
Write-Host "  ✓ Removed footer styles from layout.css" -ForegroundColor Green

# Remove footer styles from components.css
Write-Host "Removing footer styles from components.css..." -ForegroundColor Yellow

# Re-read current components.css
$componentsContent = Get-Content $componentsCssPath -Raw

# Remove .footer-* rules
$updatedComponents = $componentsContent
foreach ($match in $footerMatches) {
    $updatedComponents = $updatedComponents -replace [regex]::Escape($match.Value), ''
}

# Clean up extra whitespace
$updatedComponents = $updatedComponents -replace '\n\s*\n\s*\n', "`n`n"

$updatedComponents | Set-Content $componentsCssPath -Encoding UTF8
Write-Host "  ✓ Removed $($footerMatches.Count) footer rules from components.css" -ForegroundColor Green

# Summary
Write-Host "`n✅ CONSOLIDATION COMPLETE`n" -ForegroundColor Green
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  📄 public/css/global/footer.css    - Consolidated footer styles" -ForegroundColor White
Write-Host "  📄 public/css/layout.css           - Footer styles removed" -ForegroundColor White
Write-Host "  📄 public/css/components.css       - $($footerMatches.Count) footer rules removed" -ForegroundColor White

Write-Host "`n📝 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Verify footer.css looks correct: Select-String -Path 'public/css/global/footer.css' -Pattern '\.footer-content' | head -1" -ForegroundColor White
Write-Host "  2. Rebuild: node build.js" -ForegroundColor White
Write-Host "  3. Test: npm run test:accessibility" -ForegroundColor White

Write-Host "`n" -ForegroundColor Default
