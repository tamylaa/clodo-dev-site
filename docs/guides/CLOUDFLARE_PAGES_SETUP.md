# Setting up Brevo in Cloudflare Pages

## For Local Development

1. Create `public/brevo-secure-config.js` with your API credentials:
```javascript
window.BREVO_SECURE_CONFIG = {
    API_KEY: 'xkeysib-your-api-key-here',
    LIST_ID: 3,
};
```

This file is gitignored and will not be committed.

## For Production (Cloudflare Pages)

Since `brevo-secure-config.js` is gitignored, Cloudflare Pages won't have it during the build. Instead, set environment variables:

### Step 1: Go to Cloudflare Dashboard
1. Open [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your Pages project
3. Go to **Settings → Environment variables**

### Step 2: Add Environment Variables

Add the following variables:

**For Preview Deployments (optional):**
- `BREVO_API_KEY` = Your Brevo API key
- `BREVO_LIST_ID` = Your Brevo list ID

**For Production Deployments:**
- `BREVO_API_KEY` = Your Brevo API key
- `BREVO_LIST_ID` = Your Brevo list ID

### Step 3: Verify

After setting the variables:
1. Trigger a new deployment (push to master or use Cloudflare's redeploy button)
2. The build will automatically generate `brevo-secure-config.js` in `dist/`
3. Check the build logs to see: ✓ Generated brevo-secure-config.js from environment variables

## How It Works

The build script (`build.js`) checks for:
1. **Local file first**: `public/brevo-secure-config.js` (for local development)
2. **Environment variables second**: `BREVO_API_KEY` and `BREVO_LIST_ID` (for CI/production)

This ensures:
- ✅ Local development works with gitignored file
- ✅ Production works with environment variables
- ✅ No secrets committed to git
- ✅ No build failures when file is missing