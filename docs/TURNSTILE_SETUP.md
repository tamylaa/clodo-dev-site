# Cloudflare Turnstile Setup Guide

## Why Turnstile Instead of reCAPTCHA?

✅ **Privacy-focused** - No Google tracking or data collection  
✅ **Better UX** - Faster, less intrusive challenges  
✅ **Free** - Unlimited requests on Cloudflare's Free plan  
✅ **Cloudflare-native** - Integrates seamlessly with your stack  
✅ **GDPR compliant** - No third-party cookies  

## Setup Steps

### 1. Get Your Turnstile Site Key

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your account
3. Go to **Turnstile** in the sidebar
4. Click **Add Site**
5. Configure:
   - **Site Name**: clodo-dev-site newsletter
   - **Domains**: `clodo.dev`, `www.clodo.dev`
   - **Widget Mode**: Managed (recommended) or Invisible
6. Copy your **Site Key**

### 2. Update subscribe.html

Replace the test site key with your real one:

```html
<!-- Find this line -->
<div class="cf-turnstile" data-sitekey="1x00000000000000000000AA" ...></div>

<!-- Replace with your real site key -->
<div class="cf-turnstile" data-sitekey="YOUR_ACTUAL_SITE_KEY" ...></div>
```

### 3. Server-Side Verification (Optional but Recommended)

Update `functions/newsletter-subscribe.js` to verify the Turnstile token:

```javascript
// Add Turnstile verification
async function verifyTurnstile(token, secretKey) {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            secret: secretKey,
            response: token,
        }),
    });
    
    const data = await response.json();
    return data.success;
}

// In your onRequestPost function:
const { TURNSTILE_TOKEN } = attributes;

if (TURNSTILE_TOKEN) {
    const isValid = await verifyTurnstile(TURNSTILE_TOKEN, env.TURNSTILE_SECRET_KEY);
    if (!isValid) {
        return new Response(JSON.stringify({
            error: 'Verification failed. Please try again.'
        }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}
```

### 4. Add Environment Variable

Add your Turnstile **Secret Key** to Cloudflare Pages:

1. Go to Pages project settings
2. **Environment Variables**
3. Add: `TURNSTILE_SECRET_KEY` = `YOUR_SECRET_KEY`

## Testing

### Test Modes

Cloudflare provides test keys for development:

**Always Passes:**
- Site Key: `1x00000000000000000000AA`
- Secret Key: `1x0000000000000000000000000000000AA`

**Always Fails:**
- Site Key: `2x00000000000000000000AB`
- Secret Key: `2x0000000000000000000000000000000AA`

**Forces Interactive Challenge:**
- Site Key: `3x00000000000000000000FF`
- Secret Key: `3x0000000000000000000000000000000AA`

### Verify Integration

1. Load subscribe page
2. Enter email
3. Turnstile widget should appear
4. Complete challenge (if visible mode)
5. Submit form
6. Check Cloudflare Turnstile Analytics dashboard for request logs

## Widget Customization

### Widget Modes

```html
<!-- Managed (default - adaptive based on risk) -->
<div class="cf-turnstile" data-sitekey="..." data-theme="light"></div>

<!-- Invisible (no visible widget) -->
<div class="cf-turnstile" data-sitekey="..." data-size="invisible"></div>

<!-- Non-interactive (checkbox only) -->
<div class="cf-turnstile" data-sitekey="..." data-size="compact"></div>
```

### Themes

```html
<!-- Light theme -->
<div class="cf-turnstile" data-theme="light" ...></div>

<!-- Dark theme -->
<div class="cf-turnstile" data-theme="dark" ...></div>

<!-- Auto (matches system preference) -->
<div class="cf-turnstile" data-theme="auto" ...></div>
```

## Analytics

View Turnstile analytics in Cloudflare Dashboard:
- Success rate
- Challenge solve time
- Geographic distribution
- Bot detection stats

## Migration from reCAPTCHA

We've already updated:
- ✅ HTML script tag (Turnstile API instead of reCAPTCHA)
- ✅ CSP headers (allow `challenges.cloudflare.com`)
- ✅ JavaScript validation logic
- ✅ Form submission handling

Just need to:
1. Get real Turnstile site key
2. Replace test key in `subscribe.html`
3. (Optional) Add server-side verification

## Troubleshooting

### Widget not showing?
- Check CSP allows `challenges.cloudflare.com` in `frame-src` and `script-src`
- Verify site key is correct
- Check browser console for errors

### "Invalid site key" error?
- Make sure domain is added to Turnstile widget configuration
- Verify you're using the Site Key, not Secret Key in HTML

### Token validation failing?
- Check Secret Key in environment variables
- Verify token is being sent in request body
- Token expires after 5 minutes - handle expiry

## Best Practices

1. **Use Managed mode** - Adaptive based on user behavior
2. **Enable server-side verification** - Don't trust client-only validation
3. **Monitor analytics** - Track bot attempts and false positives
4. **Set up alerts** - Get notified of suspicious activity spikes
5. **Rotate keys periodically** - Security best practice

## Resources

- [Turnstile Documentation](https://developers.cloudflare.com/turnstile/)
- [Widget Configuration](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/)
- [Server-Side Validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Analytics](https://developers.cloudflare.com/turnstile/reference/analytics/)
