# 🧪 Local Testing Checklist - Astro Migration + Blog

**Dev Server:** Running at http://localhost:4321/  
**Date:** December 15, 2025  
**Status:** Ready for QA testing

---

## 🚀 Quick Start

### Dev Server Already Running
```
http://localhost:4321/
```

The dev server is now running in the background. You can:
- Navigate to the URL in your browser
- Test all pages
- Check responsive design
- Verify links and navigation
- Test interactive features

### Hot Module Reload
Changes to `.astro` files will auto-refresh in the browser (no manual refresh needed).

---

## ✅ Testing Checklist

### 1. Homepage & Navigation (5 min)
- [ ] Homepage loads at `/`
- [ ] Navigation menu appears correctly
- [ ] Links in navigation work
- [ ] Hero section displays properly
- [ ] Footer visible and styled
- [ ] Social links present
- [ ] Mobile menu responsive (if testing on mobile)

**Critical Elements to Check:**
- Logo/branding
- Main CTA buttons
- Feature sections
- Testimonials/social proof
- Footer copyright

---

### 2. Core Pages (10 min)
Test these key pages:

- [ ] `/pricing/` - Pricing page
  - [ ] Pricing cards visible
  - [ ] CTA buttons work
  - [ ] Responsive on mobile

- [ ] `/product/` - Product overview
  - [ ] Product features display
  - [ ] Comparison sections
  - [ ] Images load

- [ ] `/docs/` - Documentation
  - [ ] Navigation sidebar
  - [ ] Content sections
  - [ ] Code examples render

- [ ] `/about/` - About page
  - [ ] Company info displays
  - [ ] Team section (if present)
  - [ ] Mission statement clear

---

### 3. Blog Pages (5 min)
- [ ] `/blog/` - Blog index
  - [ ] Blog page loads
  - [ ] Blog posts display in grid
  - [ ] Post titles visible
  - [ ] Post dates show
  - [ ] Category badges display
  - [ ] Tags visible
  - [ ] "Read More" links present

**Expected Posts:**
- Cloudflare Workers Tutorial for Beginners
- The Cloudflare Infrastructure Myth

---

### 4. Responsive Design (10 min)
Test on different viewport sizes:

- [ ] **Desktop (1920x1080)**
  - Full layout renders
  - All elements aligned
  - No horizontal scroll

- [ ] **Tablet (768x1024)**
  - Content reflows properly
  - Navigation adapts
  - Touch targets are adequate

- [ ] **Mobile (375x667)**
  - Text readable
  - Buttons tappable
  - Mobile menu works
  - No overflow

**How to Test:**
1. Open DevTools (F12)
2. Click device toolbar icon
3. Select different devices/sizes
4. Test navigation and interactions

---

### 5. Links & Navigation (5 min)
- [ ] Home links work
- [ ] Navigation menu all items clickable
- [ ] Blog post links work
- [ ] Footer links work
- [ ] Social media links present
- [ ] No broken internal links
- [ ] External links open in new tab (if configured)

**Test These Links:**
- Navigation items
- Footer links
- Blog post links
- CTA buttons
- Breadcrumbs (if present)

---

### 6. Styling & CSS (5 min)
- [ ] Colors display correctly
- [ ] Fonts render properly
- [ ] Spacing looks balanced
- [ ] Borders/shadows render
- [ ] Images load completely
- [ ] No visual glitches
- [ ] Consistent styling across pages

**Check For:**
- Proper color scheme
- Readable text
- Proper spacing
- Button styling
- Hover states work

---

### 7. Performance (5 min)
- [ ] Pages load quickly (< 2 seconds)
- [ ] No console errors (F12 → Console)
- [ ] No network errors (F12 → Network)
- [ ] Images optimized (not blurry)
- [ ] Animations smooth (if any)
- [ ] No layout shift

**How to Check:**
1. Open DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Use Lighthouse if needed (F12 → Lighthouse)

---

### 8. SEO & Meta Tags (5 min)
- [ ] Page titles change per page (browser tab title)
- [ ] Meta descriptions present
- [ ] Open Graph tags (check source code)
- [ ] Favicon displays
- [ ] Sitemap accessible at `/sitemap-index.xml`

**How to Check:**
1. Right-click page
2. Select "View Page Source"
3. Look for `<title>`, `<meta>` tags
4. Check favicon in tab

---

### 9. Blog Specific Tests (5 min)
- [ ] Blog index page loads
- [ ] All posts display
- [ ] Post metadata visible
- [ ] Category filters work (if implemented)
- [ ] Tag links functional (if implemented)
- [ ] Reading time displays
- [ ] Author info shows (if present)

---

### 10. Interactive Elements (5 min)
- [ ] Forms submit (if any)
- [ ] Buttons have hover states
- [ ] Links highlight on hover
- [ ] Mobile menu toggle works
- [ ] Theme toggle works (if present)
- [ ] No JavaScript errors

---

## 🔍 Detailed Testing Procedures

### Test Browser Console for Errors
1. Open DevTools: `F12`
2. Click "Console" tab
3. **Expected:** No red error messages
4. **Warning:** Some warnings are okay (CSS, deprecation)
5. **Error Examples to Look For:**
   - Module not found
   - Cannot read property
   - Syntax errors

### Test Network for Failed Requests
1. Open DevTools: `F12`
2. Click "Network" tab
3. Reload page: `Ctrl+R`
4. Look for red entries (failed requests)
5. **Expected:** All green (200 status)
6. **Note:** 304 (cached) is also fine

### Test Responsive on Mobile
1. Open DevTools: `F12`
2. Click device toolbar (top-left)
3. Select mobile device
4. Test navigation and scrolling
5. Verify text is readable
6. Check buttons are tappable

### Test Page Load Performance
1. Open DevTools: `F12`
2. Click "Network" tab
3. Click "Lighthouse" tab
4. Click "Analyze page load"
5. Wait for report
6. **Expected:** Score > 90 for each category
7. **Check:** Performance, Accessibility, Best Practices, SEO

---

## 📋 Page Testing Template

For each page, test:

```
Page: [URL]

Navigation:
- [ ] Navigation menu visible
- [ ] All menu items clickable
- [ ] Mobile menu works

Content:
- [ ] Main content displays
- [ ] Images load
- [ ] Text readable
- [ ] Spacing looks good

Responsiveness:
- [ ] Desktop layout correct
- [ ] Tablet layout correct
- [ ] Mobile layout correct

Links:
- [ ] Internal links work
- [ ] External links work
- [ ] CTA buttons functional

Performance:
- [ ] Page loads quickly
- [ ] No console errors
- [ ] No network errors

Style:
- [ ] Colors correct
- [ ] Fonts render
- [ ] Shadows/borders present
```

---

## 🐛 Common Issues to Look For

### 1. Layout Issues
- [ ] Text overflow
- [ ] Images too large/small
- [ ] Spacing inconsistent
- [ ] Alignment off

### 2. Navigation Issues
- [ ] Links broken
- [ ] Menu not clickable
- [ ] Mobile menu stuck
- [ ] Navigation not visible

### 3. Styling Issues
- [ ] Colors wrong
- [ ] Fonts not loaded
- [ ] Missing shadows/borders
- [ ] Responsive breakpoints

### 4. Performance Issues
- [ ] Slow page load
- [ ] Large images
- [ ] Network requests failing
- [ ] Console errors

### 5. Content Issues
- [ ] Text not readable
- [ ] Images missing
- [ ] Content cut off
- [ ] Overlapping elements

---

## 📱 Test Pages List

### Priority 1: Critical Pages (TEST FIRST)
1. `/` - Homepage
2. `/pricing/` - Pricing
3. `/docs/` - Documentation
4. `/blog/` - Blog

### Priority 2: Main Content Pages
5. `/product/` - Product overview
6. `/about/` - Company info
7. `/migrate/` - Migration guide
8. `/components/` - Components

### Priority 3: Guide Pages
9. `/cloudflare-workers-guide/` - Workers guide
10. `/edge-computing-guide/` - Edge guide
11. `/faq/` - FAQ
12. `/clodo-framework-guide/` - Framework guide

### Priority 4: Utility Pages
13. `/privacy/` - Privacy policy
14. `/terms/` - Terms of service
15. `/subscribe/` - Newsletter signup
16. `/analytics/` - Analytics guide

### Priority 5: Advanced Pages
17-29. All other pages

---

## 🎯 Success Criteria

### For Successful QA:
- ✅ All critical pages load without errors
- ✅ No broken links found
- ✅ Responsive design works on all sizes
- ✅ No console errors
- ✅ No network failures
- ✅ Styling consistent
- ✅ Navigation functional
- ✅ Blog displays correctly

### Red Flags (Must Fix):
- ❌ Broken links
- ❌ Console errors
- ❌ Network failures
- ❌ Layout issues on mobile
- ❌ Missing content
- ❌ Page not loading

---

## 📊 Testing Report

After completing tests, note:

**Overall Status:** [ ] PASS / [ ] FAIL

**Issues Found:**
- Issue 1: [Description]
- Issue 2: [Description]
- Issue 3: [Description]

**Pages Tested:**
- [ ] Homepage
- [ ] Pricing
- [ ] Docs
- [ ] Blog
- [ ] Other: _________

**Performance:**
- Page load time: ___ seconds
- Console errors: ___ count
- Network failures: ___ count
- Lighthouse score: ___ / 100

**Recommendation:**
- [ ] Ready to merge
- [ ] Need fixes (list above)
- [ ] Major issues (do not merge)

---

## 🛠️ Troubleshooting

### Page Won't Load
1. Check DevTools Console (F12)
2. Check server is running in background
3. Try hard refresh: `Ctrl+Shift+R`
4. Check URL is correct

### Images Not Loading
1. Check DevTools Network tab
2. Look for 404 errors
3. Verify image paths in Astro files
4. Check image files exist in `public/`

### Styling Broken
1. Check DevTools (F12)
2. Look for CSS errors
3. Verify scoped styles are correct
4. Check color/font variables

### Links Broken
1. Check target URL is correct
2. Verify file exists
3. Test internal vs external links
4. Check for typos

---

## ⚡ Quick Commands

```bash
# Stop the dev server
# Press Ctrl+C in terminal

# Restart dev server
npm run dev:astro

# Clear cache and rebuild
npm run clean:all
npm run dev:astro

# Production build test
npm run build
npm run preview:astro

# Verify deployment
npm run verify:deployment
```

---

## ✅ When Ready to Merge

Once all tests pass:

1. [ ] Stop dev server: `Ctrl+C`
2. [ ] Run production build: `npm run build`
3. [ ] Run verification: `npm run verify:deployment`
4. [ ] All checks pass: ✅ 14/14
5. [ ] Ready to merge to master

---

**Happy Testing! 🚀**

Local dev server is running at: **http://localhost:4321/**

Remember to test thoroughly on different devices and browsers before merging to production!
