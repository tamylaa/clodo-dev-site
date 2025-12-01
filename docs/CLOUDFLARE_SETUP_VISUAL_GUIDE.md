# Cloudflare WAF Rule Setup - Step by Step (Current Dashboard)

**Current Dashboard Version**: December 2025
**Location**: Security > Custom Rules > New Custom Rule

---

## The Exact Setup You're Seeing

### Your Dashboard Shows:
```
Rule name (required)
├─ Text field: [Allow Performance Audit Tools]

When incoming requests match…
├─ Field:        [Known Bots ▼]
├─ Operator:     [equals ▼]
├─ Value:        [__________]
└─ Expression Preview: (cf.client.bot)

Then take action…
└─ Choose action: [Select... ▼]

Deploy with API call
```

---

## Solution 1: Use "Known Bots" Dropdown (If Available)

### Steps:

1. **Rule name**: Already filled
   - ✅ `Allow Performance Audit Tools`

2. **Field**: Already set correctly
   - ✅ `Known Bots`

3. **Operator**: Already correct
   - ✅ `equals`

4. **Value**: Click the dropdown and look for:
   - `Lighthouse` ← If you see this, select it
   - OR `Google` (Lighthouse is Google's tool)
   - OR `Verified Bot`

5. **Then take action**: 
   - ⚠️ **IMPORTANT**: The action dropdown shows:
     - `JS Challenge`
     - `Interactive Challenge`
     - `Block`
     - (No "Allow" option visible)
   
   **This means**: This rule type is for BLOCKING traffic, not ALLOWING it
   
   - **Skip this rule** - it won't help us
   - Instead, you need an "Allow" rule or to use a different approach below

---

## Solution 2: The Dashboard UI Might Only Support Blocking

**If the action dropdown shows**:
- `JS Challenge`
- `Interactive Challenge`
- `Block`

**This means**: This Custom Rules interface is for BLOCKING traffic, not ALLOWING it.

You need a different approach. See **Solution 3** below.

---

## Solution 3: Use "Firewall Rules" Instead of "Custom Rules"

**Firewall Rules** support "Allow" action, while Custom Rules only support block/challenge.

### Steps:

1. Go to **Security > Firewall Rules** (NOT Custom Rules)
2. Click **"Create rule"**
3. **Expression** field - paste this:
```
http.user_agent contains "HeadlessChrome"
```
4. **Then** - select **"Allow"** from dropdown
5. **Deploy**

**This is different from Custom Rules but will actually ALLOW Lighthouse requests.**

---

---

## Solution 3: If You Can't Find "Known Bots" Option

The field dropdown might show different options. If so:

1. Click the **Field dropdown**
2. Look for any of these:
   - `Bot` or `Bots`
   - `User Agent`
   - `Request Headers`
3. If you select **`User Agent`**:
   - **Operator**: `contains`
   - **Value**: `HeadlessChrome`
   - **Action**: `Allow`

---

## The Complete Final Rule

After setup, your rule should look like this:

### Visual
```
✓ Rule name: Allow Performance Audit Tools

When incoming requests match…
  Known Bots equals [Lighthouse/Verified Bot]
  
Then take action…
  Allow

[✓ Deployed] [Last updated: Dec 1, 2025]
```

### Expression (if using custom)
```
http.user_agent contains "HeadlessChrome"
```

---

## Testing the Rule

### Before (Current State):
```bash
npm run lighthouse:audit
# Result: 503 errors on /docs.html, /pricing.html, /examples.html
# Best Practices: 79/100
```

### After (5 minutes after deploying rule):
```bash
npm run lighthouse:audit
# Result: 200 OK on all pages
# Best Practices: Should improve to 95/100+
```

---

## If It Still Doesn't Work

### Check These:

1. **Is the rule ACTIVE?**
   - Should show green checkmark or "Active" status
   - If red X, click to activate

2. **Rule Priority**
   - If multiple rules exist, this rule should be BEFORE any blocking rules
   - Drag to reorder if needed

3. **Wait for Propagation**
   - New rules take 2-5 minutes to deploy
   - Try audit again after waiting

4. **Check Other Security Settings**
   - Go to **Security > Settings**
   - Make sure Bot Management isn't set to "Block All"
   - Check **Rate Limiting** rules aren't blocking it

5. **Verify in Logs**
   - Go to **Analytics > Security > Firewall Events**
   - Search for your Lighthouse requests
   - Check if they were blocked by another rule

---

## Quick Reference: Field Options

If your dashboard looks different, here are common field names:

| Dashboard Field | What to Use | Value |
|---|---|---|
| **Known Bots** | `equals` | Lighthouse / Verified Bot |
| **Bot Detection** | `equals` | High / Medium |
| **User Agent** | `contains` | HeadlessChrome |
| **Request Type** | `equals` | Bot |
| **HTTP User Agent** | `contains` | HeadlessChrome |

---

## After Successfully Deploying

Once the rule is active and working:

1. **Run audit again**:
   ```bash
   npm run lighthouse:audit
   ```

2. **Check results**:
   - Production Best Practices should be ~95/100 (was 79)
   - No more 503 errors

3. **Commit the improvement**:
   ```bash
   git add docs/CLOUDFLARE_WAF_FIX.md
   git commit -m "Verified: Cloudflare WAF rule fixes audit scores"
   ```

---

## Why This Works

**Before WAF rule**:
- Lighthouse requests come in
- Cloudflare's Bot Management sees rapid requests
- Returns 503 (blocked)
- Lighthouse records console errors
- Best Practices score: 79/100

**After WAF rule**:
- Lighthouse requests come in
- WAF rule matches and says "Allow"
- Cloudflare allows it through
- Lighthouse gets 200 responses
- No console errors
- Best Practices score: 95/100+

---

## Success Indicators

Your rule is working correctly when:
- ✅ Lighthouse audit completes without 503 errors
- ✅ Production Best Practices score >= 95
- ✅ Local and Production scores are now within 1-2 points
- ✅ No "console errors" in Lighthouse report
- ✅ No deprecation warnings beyond StorageType.persistent

The deprecation warning will remain (that's Cloudflare's code), but the 503 errors will be gone.

---

**Status**: Ready to implement
**Time to complete**: 5 minutes (including propagation)
**Expected improvement**: 79/100 → 95/100 Best Practices
