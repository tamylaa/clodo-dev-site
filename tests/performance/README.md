# Performance Monitoring with Lighthouse CI

Automated performance monitoring and budgets for the Clodo Framework website.

## 📊 Overview

This setup provides:
- **Automated Lighthouse Audits**: Run on every build/deploy
- **Performance Budgets**: Enforce limits on key metrics
- **Core Web Vitals Tracking**: LCP, FCP, CLS, TBT
- **Resource Budgets**: HTML, CSS, JS, fonts, images
- **CI/CD Integration**: Automatic performance regression detection

## 🚀 Quick Start

### Run Lighthouse Audit Locally
```bash
npm run lighthouse
```

### Run with Report
```bash
npm run lighthouse:report
```

### Run in CI Mode
```bash
npm run lighthouse:ci
```

## 📈 Performance Budgets

### Core Web Vitals

| Metric | Budget | Level |
|--------|--------|-------|
| Largest Contentful Paint (LCP) | ≤ 2.5s | ERROR |
| First Contentful Paint (FCP) | ≤ 1.8s | ERROR |
| Cumulative Layout Shift (CLS) | ≤ 0.1 | ERROR |
| Total Blocking Time (TBT) | ≤ 300ms | WARN |
| Time to Interactive (TTI) | ≤ 3.8s | WARN |

### Category Scores

| Category | Minimum Score | Level |
|----------|---------------|-------|
| Performance | 90 | ERROR |
| Accessibility | 95 | ERROR |
| Best Practices | 90 | WARN |
| SEO | 95 | ERROR |

### Resource Budgets

| Resource Type | Budget | Level |
|---------------|--------|-------|
| HTML | ≤ 50 KB | WARN |
| CSS | ≤ 200 KB | WARN |
| JavaScript | ≤ 300 KB | WARN |
| Fonts | ≤ 150 KB | WARN |
| Images | ≤ 500 KB | WARN |
| **Total** | **≤ 1 MB** | **WARN** |

### Network Budgets

| Metric | Budget | Level |
|--------|--------|-------|
| Total Requests | ≤ 50 | WARN |

## ⚙️ Configuration

### Lighthouse RC (`lighthouserc.js`)

Key settings:
- **URLs Tested**: Homepage, Docs, Examples, About
- **Number of Runs**: 3 (median taken)
- **Preset**: Desktop
- **Throttling**: Fast 3G simulation

### Audit Settings

**Error Level**: Test fails if metric exceeds budget
**Warn Level**: Test passes but shows warning
**Off**: Audit skipped

## 📊 Understanding Results

### Lighthouse Score Calculation

Scores are weighted:
- Performance: Based on metrics (FCP, LCP, TBT, CLS, Speed Index)
- Accessibility: ARIA, color contrast, labels, etc.
- Best Practices: Security, modern APIs, console errors
- SEO: Meta tags, robots.txt, mobile-friendly

### Core Web Vitals Thresholds

**Good** 🟢:
- LCP: ≤ 2.5s
- FCP: ≤ 1.8s
- CLS: ≤ 0.1

**Needs Improvement** 🟡:
- LCP: 2.5s - 4s
- FCP: 1.8s - 3s
- CLS: 0.1 - 0.25

**Poor** 🔴:
- LCP: > 4s
- FCP: > 3s
- CLS: > 0.25

## 🔍 Common Issues & Solutions

### Issue: LCP Too High
**Causes:**
- Large images above the fold
- Render-blocking CSS/JS
- Slow server response time

**Solutions:**
- Optimize images (WebP, lazy load)
- Inline critical CSS
- Use preconnect hints
- Enable compression

### Issue: CLS Too High
**Causes:**
- Images without dimensions
- Dynamic content insertion
- Web fonts causing FOIT/FOUT

**Solutions:**
- Set width/height on images
- Reserve space for dynamic content
- Use font-display: swap
- Avoid injecting content above existing content

### Issue: TBT Too High
**Causes:**
- Long JavaScript tasks
- Render-blocking scripts
- Third-party scripts

**Solutions:**
- Code split JavaScript
- Defer non-critical scripts
- Use web workers
- Optimize third-party scripts

### Issue: Bundle Size Exceeded
**Causes:**
- Unused dependencies
- Large libraries
- Duplicated code
- Unoptimized images

**Solutions:**
- Tree-shake unused code
- Use lightweight alternatives
- Enable minification
- Compress images

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Performance Monitoring

on:
  pull_request:
  push:
    branches: [main, modernization]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build site
        run: npm run build
        
      - name: Run Lighthouse CI
        run: npm run lighthouse:ci
        
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: lighthouse-results
          path: .lighthouseci/
```

### Automated Checks

On every PR:
1. Build site
2. Run Lighthouse audits
3. Compare against budgets
4. Fail build if budgets exceeded
5. Post comment with results

## 📈 Tracking Performance Over Time

### Local Storage
Results stored in `.lighthouseci/` directory:
- JSON reports for each run
- Median values
- Comparison with previous runs

### Lighthouse CI Server
For production monitoring:
1. Setup LHCI server
2. Configure `upload.target` in `lighthouserc.js`
3. Track performance trends over time
4. Set up alerts for regressions

### Temporary Public Storage
Free option for testing:
- Results uploaded to Google's temporary storage
- Accessible via provided URL
- Expires after 7 days

## 🎯 Best Practices

### 1. Test Regularly
```bash
npm run lighthouse
```
Run before commits to catch regressions early.

### 2. Test All Key Pages
Update `collect.url` in `lighthouserc.js` to include all critical pages.

### 3. Test on Real Devices
```bash
npx lighthouse https://your-site.com --preset=mobile
```

### 4. Monitor Trends
Track scores over time to catch gradual degradation.

### 5. Set Realistic Budgets
Start with current performance, then gradually tighten budgets.

### 6. Test on CI
Automate checks on every PR to prevent regressions.

## 🐛 Troubleshooting

### Lighthouse Fails to Start Server
- Check `startServerCommand` in config
- Verify port 8000 is available
- Check server logs

### Inconsistent Results
- Increase `numberOfRuns` (default: 3)
- Disable background processes
- Use consistent network conditions

### Budget Failures
- Review Lighthouse report: `.lighthouseci/lhr-*.json`
- Check specific audit failures
- Adjust budgets if necessary

### CI Timeout
- Increase timeout in workflow
- Reduce number of URLs tested
- Reduce `numberOfRuns`

## 📚 Resources

- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci)
- [Web.dev Lighthouse Guide](https://web.dev/lighthouse-performance/)
- [Core Web Vitals](https://web.dev/vitals/)
- [Performance Budgets](https://web.dev/performance-budgets-101/)

## 🎓 Next Steps

1. ✅ Configuration complete
2. ⏭️ Run first audit: `npm run lighthouse`
3. ⏭️ Review results and adjust budgets
4. ⏭️ Add to CI/CD pipeline
5. ⏭️ Setup LHCI server for historical tracking
6. ⏭️ Monitor performance trends

## 📊 Current Performance (Baseline)

Run `npm run lighthouse` to establish baseline metrics.

Expected Initial Scores:
- Performance: 90-95 ✅
- Accessibility: 95+ ✅
- Best Practices: 90+ ✅
- SEO: 95+ ✅

The site is already well-optimized, these budgets ensure it stays that way!
