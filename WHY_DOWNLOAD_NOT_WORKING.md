# Why `/download-validator-scripts` is Not Working

## Root Cause
The Cloudflare Function exists but **cannot run without environment variables**.

## What's Missing

The function needs **3 environment variables** in Cloudflare Pages:

| Variable | Status | Value |
|----------|--------|-------|
| `BREVO_API_KEY` | ❌ NOT SET | From Brevo (starts with `sk_live_`) |
| `BREVO_DOWNLOAD_LIST_ID` | ❌ NOT SET | From Brevo list creation |
| `DOWNLOAD_TOKEN_SECRET` | ❌ NOT SET | Generated with Node.js |

Without these, the function fails at line 97:
```javascript
const apiKey = env.BREVO_API_KEY;  // undefined → causes 500 error
```

## How to Fix (5 Minutes)

### Step 1: Go to Cloudflare Dashboard
```
https://dash.cloudflare.com/
```

### Step 2: Navigate to Settings
1. Select your account
2. Select **clodo-dev-site** Pages project
3. Go to **Settings** → **Environment variables**

### Step 3: Check Production Environment
Make sure you're viewing **Production** (not Preview)

### Step 4: Add BREVO_API_KEY
**Status**: Should already exist (from newsletter)

1. Look for variable named `BREVO_API_KEY`
2. If present: ✓ Continue to next step
3. If missing: Need to get from Brevo settings
   - Go to: https://app.brevo.com/
   - Settings → API Keys
   - Copy your Live API Key (`sk_live_...`)
   - Add to Cloudflare with name `BREVO_API_KEY`

### Step 5: Create BREVO_DOWNLOAD_LIST_ID

1. Go to: https://app.brevo.com/
2. Navigate to: **Contacts** → **Lists**
3. Click: **Create List**
4. Fill in:
   - **Name**: `Validator Scripts Downloads`
   - **Type**: Keep default
5. Click: **Create**
6. Copy the **List ID** (numeric value like `123456`)
7. In Cloudflare Environment variables:
   - Click: **Add variable**
   - **Name**: `BREVO_DOWNLOAD_LIST_ID`
   - **Value**: `123456` (the list ID you copied)
   - **Environments**: Select **Production**
   - Click: **Save**

### Step 6: Create DOWNLOAD_TOKEN_SECRET

1. Open PowerShell/Terminal in your project
2. Run:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
3. Copy the output (example: `uR8qZ2xL9mK5pN3wJ7vB1hQ6fX8cT4dS9eA2bY3+G5/I=`)
4. In Cloudflare Environment variables:
   - Click: **Add variable**
   - **Name**: `DOWNLOAD_TOKEN_SECRET`
   - **Value**: Paste the output from step 2
   - **Environments**: Select **Production**
   - Click: **Save**

### Step 7: Verify All 3 Variables Exist

You should now see in Production environment:
```
✓ BREVO_API_KEY = sk_live_...
✓ BREVO_DOWNLOAD_LIST_ID = 123456
✓ DOWNLOAD_TOKEN_SECRET = uR8qZ2xL9mK5pN3wJ7vB1hQ6fX8cT4dS9eA2bY3+G5/I=
```

---

## Test After Setup

### Test 1: Form Submission
1. Visit: https://www.clodo.dev/cloudflare-workers-development-guide.html
2. Scroll to: **"Download Validator Scripts"** form
3. Enter email: `test@example.com`
4. Click: **Get Download Link**
5. Expected:
   - ✓ Form shows success message
   - ✓ Redirects to `/download/thanks`
   - ✓ Email arrives in your inbox (check spam folder)

### Test 2: Download Link
1. Open the email from Brevo
2. Click: **Download Validator Scripts** button
3. Expected:
   - ✓ Browser downloads `validator-scripts.zip` automatically
   - ✓ ZIP file is ~10 KB

### Test 3: Error Handling
Try these and expect error messages:
- Empty email → "Email is required"
- Invalid email → "Invalid email format"  
- Check spam folder if email doesn't arrive

---

## Troubleshooting

**Problem**: Still getting 500 error

**Check**:
1. Did you click **Save** in Cloudflare after adding variables?
2. Did you select **Production** environment (not Preview)?
3. Did you use exact variable names (case-sensitive)?
4. Wait 30 seconds for changes to propagate

**Solution**: 
1. Verify all 3 variables are present
2. Refresh the page (Ctrl+Shift+R)
3. Try form submission again

---

**Problem**: Email not arriving

**Check**:
1. Is `BREVO_API_KEY` correct? (Should start with `sk_live_`)
2. Is `BREVO_DOWNLOAD_LIST_ID` correct? (Should be numeric)
3. Check spam/promotional folder
4. Check Brevo dashboard for failed sends

---

## Timeline

- ✅ Code: Deployed to GitHub
- ✅ Build: Generated and in dist/
- ✅ Pages: Live on clodo.dev
- ⏳ Functions: Waiting for environment variables
- ⏳ Brevo Integration: Waiting for list creation
- ⏳ Download System: Ready once variables are set

---

## Quick Commands

**Generate token secret**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Test function (after variables are set)**:
```bash
curl -X POST https://www.clodo.dev/download-validator-scripts \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

**Check current git status**:
```bash
git log --oneline -1
# Should show: feat: Add email-based validator script download system
```

---

## Summary

The system is **completely deployed** and ready to work. You just need to:

1. ⏳ Add `BREVO_DOWNLOAD_LIST_ID` in Cloudflare (5 min)
2. ⏳ Add `DOWNLOAD_TOKEN_SECRET` in Cloudflare (2 min)
3. ✓ Verify `BREVO_API_KEY` exists (1 min)
4. ✓ Test the form (2 min)

**Total time**: ~10 minutes to make everything work.

---

**Status**: ✅ Code deployed | ⏳ Configuration pending

Once variables are set, the system will be fully operational! 🚀
