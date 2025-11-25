# Clodo Framework - Quick Analytics Setup
# Adds Google Analytics 4 and enhanced tracking for SEO measurement

Write-Host "Clodo Framework - Quick Analytics Setup" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Create analytics configuration
$analyticsConfig = @'
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID', {
    'custom_map': {'dimension1': 'page_location'},
    'send_page_view': true,
    'allow_google_signals': true,
    'allow_ad_personalization_signals': false
  });
</script>

<!-- Enhanced SEO Tracking -->
<script>
  // Track GitHub referrals
  if (document.referrer.includes('github.com')) {
    gtag('event', 'github_referral', {
      'event_category': 'engagement',
      'event_label': document.referrer,
      'value': 1
    });
  }

  // Track enterprise keyword searches
  if (document.referrer.includes('google.com') || document.referrer.includes('bing.com')) {
    gtag('event', 'organic_search_referral', {
      'event_category': 'acquisition',
      'event_label': document.referrer
    });
  }

  // Track documentation engagement
  document.addEventListener('DOMContentLoaded', function() {
    // Track time on page
    let startTime = Date.now();
    window.addEventListener('beforeunload', function() {
      let timeSpent = Math.round((Date.now() - startTime) / 1000);
      gtag('event', 'time_on_page', {
        'event_category': 'engagement',
        'event_label': window.location.pathname,
        'value': timeSpent
      });
    });

    // Track documentation section views
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          gtag('event', 'section_view', {
            'event_category': 'engagement',
            'event_label': entry.target.id || entry.target.className
          });
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('section, .feature, .example').forEach(section => {
      observer.observe(section);
    });
  });
</script>
'@

# Check if index.html exists and add analytics
$indexPath = "public\index.html"
if (Test-Path $indexPath) {
    Write-Host "Adding analytics to index.html..." -ForegroundColor Yellow

    $content = Get-Content $indexPath -Raw

    # Check if analytics is already present
    if ($content -notmatch "gtag") {
        # Insert analytics before closing </head> tag
        $content = $content -replace '</head>', "$analyticsConfig`n</head>"

        # Save the updated content
        $content | Set-Content $indexPath -Encoding UTF8

        Write-Host "Analytics added to index.html" -ForegroundColor Green
    } else {
        Write-Host "Analytics already present in index.html" -ForegroundColor Yellow
    }
} else {
    Write-Host "index.html not found" -ForegroundColor Red
}

# Create Google Search Console verification
Write-Host "Creating Google Search Console verification..." -ForegroundColor Yellow
$searchConsoleMeta = '<meta name="google-site-verification" content="YOUR_VERIFICATION_CODE" />'

if (Test-Path $indexPath) {
    $content = Get-Content $indexPath -Raw

    if ($content -notmatch "google-site-verification") {
        $content = $content -replace '<title>', "$searchConsoleMeta`n    <title>"

        $content | Set-Content $indexPath -Encoding UTF8

        Write-Host "Google Search Console meta tag added" -ForegroundColor Green
    } else {
        Write-Host "Google Search Console verification already present" -ForegroundColor Yellow
    }
}

# Create Bing Webmaster Tools verification
Write-Host "Creating Bing Webmaster Tools verification..." -ForegroundColor Yellow
$bingMeta = '<meta name="msvalidate.01" content="YOUR_BING_VERIFICATION_CODE" />'

if (Test-Path $indexPath) {
    $content = Get-Content $indexPath -Raw

    if ($content -notmatch "msvalidate.01") {
        $content = $content -replace '<title>', "$bingMeta`n    <title>"

        $content | Set-Content $indexPath -Encoding UTF8

        Write-Host "Bing Webmaster Tools meta tag added" -ForegroundColor Green
    } else {
        Write-Host "Bing Webmaster Tools verification already present" -ForegroundColor Yellow
    }
}

Write-Host "" -ForegroundColor White
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Replace 'GA_MEASUREMENT_ID' with your actual Google Analytics 4 Measurement ID" -ForegroundColor White
Write-Host "2. Replace 'YOUR_VERIFICATION_CODE' with your Google Search Console verification code" -ForegroundColor White
Write-Host "3. Replace 'YOUR_BING_VERIFICATION_CODE' with your Bing Webmaster Tools verification code" -ForegroundColor White
Write-Host "4. Submit your sitemap to Google Search Console and Bing Webmaster Tools" -ForegroundColor White
Write-Host "5. Set up goals and conversions in Google Analytics for enterprise keywords" -ForegroundColor White

Write-Host "" -ForegroundColor White
Write-Host "Expected Results:" -ForegroundColor Green
Write-Host "- Comprehensive tracking of organic search performance" -ForegroundColor White
Write-Host "- GitHub referral analytics and community engagement metrics" -ForegroundColor White
Write-Host "- Enhanced SEO measurement and conversion tracking" -ForegroundColor White
Write-Host "- Better understanding of enterprise developer behavior" -ForegroundColor White