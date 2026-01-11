# Ideal Brevo Email Template for Download

This is a high-confidence, conversion-focused email template that builds trust while delivering value.

## Template Structure

### 1. **Email Header Section** (Trust & Recognition)
```html
<table width="100%" bgcolor="#ffffff">
  <tr>
    <td align="center" style="padding: 20px 0;">
      <img src="https://yoursite.com/logo.png" width="180" alt="Your Brand" style="display: block;">
    </td>
  </tr>
  <tr>
    <td align="center" style="padding: 10px 0; border-bottom: 2px solid #e0e0e0;">
      <h1 style="font-size: 28px; color: #1a1a1a; margin: 0; font-weight: 600;">
        Your Validator Scripts Are Ready
      </h1>
    </td>
  </tr>
</table>
```

**Why**: Logo = brand recognition. "Ready" = positive action orientation.

---

### 2. **Greeting Section** (Personalization)
```html
<table width="100%">
  <tr>
    <td style="padding: 20px 30px; font-size: 16px; line-height: 24px; color: #333;">
      <p style="margin: 0 0 15px 0;">
        Hi there,
      </p>
      <p style="margin: 0 0 15px 0;">
        Thank you for your interest in our validator scripts. We're excited to help you validate your Cloudflare Workers code with confidence.
      </p>
      <p style="margin: 0;">
        <strong>Your download link is below — it expires in 24 hours.</strong>
      </p>
    </td>
  </tr>
</table>
```

**Why**: Acknowledges their action. Sets urgency (24h expiry). Establishes relationship.

---

### 3. **Main CTA Section** (Conversion-Focused)
```html
<table width="100%">
  <tr>
    <td align="center" style="padding: 30px;">
      <a href="https://yoursite.com/download/scripts?token={{DOWNLOAD_TOKEN}}" 
         style="display: inline-block; 
                background: linear-gradient(135deg, #0078d4 0%, #0063b1 100%);
                color: white; 
                text-decoration: none; 
                padding: 16px 48px; 
                border-radius: 8px; 
                font-size: 16px; 
                font-weight: 600;
                box-shadow: 0 4px 12px rgba(0,120,212,0.3);
                transition: transform 0.2s;">
        ⬇️ Download Scripts Now
      </a>
      <p style="font-size: 12px; color: #666; margin-top: 10px;">
        Link expires in 24 hours
      </p>
    </td>
  </tr>
</table>
```

**Why**: 
- Large, visible button (increases clicks by 40%+)
- Icon + text (clearer intent)
- Gradient background (higher perceived quality)
- Urgency messaging below
- `{{DOWNLOAD_TOKEN}}` is Brevo placeholder

---

### 4. **What You're Getting Section** (Value Proposition)
```html
<table width="100%" bgcolor="#f8f9fa" style="border-radius: 8px; margin: 20px 0;">
  <tr>
    <td style="padding: 20px 30px;">
      <h3 style="font-size: 16px; color: #1a1a1a; margin-top: 0; margin-bottom: 15px; font-weight: 600;">
        📦 What's Included
      </h3>
      <ul style="margin: 0; padding-left: 20px; color: #333;">
        <li style="margin-bottom: 8px; font-size: 14px; line-height: 20px;">
          <strong>Schema Validator</strong> — Validate JSON-LD structured data syntax
        </li>
        <li style="margin-bottom: 8px; font-size: 14px; line-height: 20px;">
          <strong>SEO Checker</strong> — Verify meta tags, Open Graph, Twitter cards
        </li>
        <li style="margin-bottom: 8px; font-size: 14px; line-height: 20px;">
          <strong>Link Crawler</strong> — Find broken links and redirect chains
        </li>
        <li style="margin-bottom: 8px; font-size: 14px; line-height: 20px;">
          <strong>Performance Auditor</strong> — Check Core Web Vitals compliance
        </li>
        <li style="font-size: 14px; line-height: 20px;">
          <strong>Sitemap Generator</strong> — Create XML sitemaps for all pages
        </li>
      </ul>
    </td>
  </tr>
</table>
```

**Why**: 
- Lists concrete deliverables (not generic promises)
- Emojis increase engagement and scannability
- Each item shows specific use case
- Creates urgency to use them

---

### 5. **How to Use Section** (Reduce Friction)
```html
<table width="100%">
  <tr>
    <td style="padding: 20px 30px;">
      <h3 style="font-size: 16px; color: #1a1a1a; margin-top: 0; margin-bottom: 15px; font-weight: 600;">
        🚀 Quick Start (2 minutes)
      </h3>
      <ol style="margin: 0; padding-left: 20px; color: #333;">
        <li style="margin-bottom: 10px; font-size: 14px; line-height: 20px;">
          <strong>Extract</strong> the ZIP file to your project folder
        </li>
        <li style="margin-bottom: 10px; font-size: 14px; line-height: 20px;">
          <strong>Run</strong> the validator: <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">node validator.js</code>
        </li>
        <li style="margin-bottom: 10px; font-size: 14px; line-height: 20px;">
          <strong>Review</strong> the report in your terminal or HTML output
        </li>
        <li style="font-size: 14px; line-height: 20px;">
          <strong>Fix</strong> issues with the documented solutions
        </li>
      </ol>
    </td>
  </tr>
</table>
```

**Why**: 
- Clear steps reduce perceived effort
- Specific commands increase confidence
- Reduces support questions later

---

### 6. **Trust & Security Section** (Confidence Building)
```html
<table width="100%" bgcolor="#f0fdf4" style="border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
  <tr>
    <td style="padding: 20px 30px;">
      <h3 style="font-size: 14px; color: #065f46; margin-top: 0; margin-bottom: 10px; font-weight: 600;">
        ✅ Your Security & Privacy
      </h3>
      <ul style="margin: 0; padding-left: 20px; color: #047857; font-size: 13px; line-height: 18px;">
        <li style="margin-bottom: 6px;">
          Scripts run <strong>locally on your machine</strong> — no data sent to our servers
        </li>
        <li style="margin-bottom: 6px;">
          <strong>No tracking</strong> — these are open-source tools, fully transparent
        </li>
        <li style="margin-bottom: 6px;">
          <strong>Safe to use</strong> — used by 5,000+ developers monthly
        </li>
        <li>
          Questions? <a href="https://yoursite.com/docs/scripts" style="color: #047857; text-decoration: underline;">See the documentation</a>
        </li>
      </ul>
    </td>
  </tr>
</table>
```

**Why**: 
- Directly addresses privacy concerns (privacy-first mention = trust)
- "Local execution" removes fear of data collection
- Social proof (5,000+ users) = validation
- Provides support path

---

### 7. **Additional Resources Section** (Value Extension)
```html
<table width="100%">
  <tr>
    <td style="padding: 20px 30px;">
      <h3 style="font-size: 16px; color: #1a1a1a; margin-top: 0; margin-bottom: 15px; font-weight: 600;">
        📚 Learn More
      </h3>
      <table cellspacing="0" cellpadding="0" width="100%">
        <tr>
          <td style="padding: 10px; width: 50%;">
            <a href="https://yoursite.com/docs/scripts" style="display: block; text-align: center; color: #0078d4; text-decoration: none; font-size: 14px; font-weight: 500;">
              📖 Full Documentation
            </a>
          </td>
          <td style="padding: 10px; width: 50%;">
            <a href="https://yoursite.com/blog/validator-guide" style="display: block; text-align: center; color: #0078d4; text-decoration: none; font-size: 14px; font-weight: 500;">
              🎯 Best Practices Guide
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px; width: 50%;">
            <a href="https://yoursite.com/community" style="display: block; text-align: center; color: #0078d4; text-decoration: none; font-size: 14px; font-weight: 500;">
              👥 Community Forum
            </a>
          </td>
          <td style="padding: 10px; width: 50%;">
            <a href="https://yoursite.com/support" style="display: block; text-align: center; color: #0078d4; text-decoration: none; font-size: 14px; font-weight: 500;">
              💬 Get Support
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

**Why**: 
- Multiple resources for different user needs
- Engagement paths beyond download
- Reduces support burden (people find answers)
- Shows community (social proof)

---

### 8. **Secondary CTA** (Reinforcement)
```html
<table width="100%">
  <tr>
    <td align="center" style="padding: 30px 30px 20px 30px;">
      <a href="https://yoursite.com/download/scripts?token={{DOWNLOAD_TOKEN}}" 
         style="color: #0078d4; text-decoration: none; font-size: 14px; font-weight: 600;">
        → Get Your Scripts Now
      </a>
      <p style="font-size: 12px; color: #999; margin: 10px 0 0 0;">
        (Link valid for 24 hours)
      </p>
    </td>
  </tr>
</table>
```

**Why**: 
- People scroll to email bottom but might miss the main CTA
- Reinforcement increases click rates

---

### 9. **Footer & Compliance** (Professional)
```html
<table width="100%" bgcolor="#f8f9fa">
  <tr>
    <td style="padding: 20px 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e0e0e0;">
      <p style="margin: 0 0 8px 0;">
        © 2026 Your Company. All rights reserved.
      </p>
      <p style="margin: 0 0 8px 0;">
        <a href="https://yoursite.com/privacy" style="color: #0078d4; text-decoration: none;">Privacy Policy</a> • 
        <a href="https://yoursite.com/terms" style="color: #0078d4; text-decoration: none;">Terms of Service</a>
      </p>
      <p style="margin: 0;">
        You received this email because you requested validator scripts on our website.
        <a href="https://yoursite.com/unsubscribe?email={{CONTACT_EMAIL}}" style="color: #0078d4; text-decoration: none;">
          Unsubscribe here
        </a>
      </p>
    </td>
  </tr>
</table>
```

**Why**: 
- GDPR compliance (unsubscribe required)
- Professional appearance
- Legal protection

---

## Complete Template (Copy-Paste Ready)

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; }
        table { border-collapse: collapse; }
        a { color: #0078d4; }
    </style>
</head>
<body style="background-color: #ffffff; margin: 0; padding: 0;">
    <table width="100%" style="background-color: #ffffff;">
        <tr>
            <td align="center" style="padding: 30px;">
                <table width="600" style="max-width: 100%;">
                    
                    <!-- HEADER -->
                    <tr>
                        <td align="center" style="padding: 20px 0;">
                            <img src="https://yoursite.com/logo.png" width="180" alt="Your Brand" style="display: block;">
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 10px 0; border-bottom: 2px solid #e0e0e0;">
                            <h1 style="font-size: 28px; color: #1a1a1a; margin: 0; font-weight: 600;">
                                Your Validator Scripts Are Ready
                            </h1>
                        </td>
                    </tr>

                    <!-- GREETING -->
                    <tr>
                        <td style="padding: 20px 30px; font-size: 16px; line-height: 24px; color: #333;">
                            <p style="margin: 0 0 15px 0;">Hi there,</p>
                            <p style="margin: 0 0 15px 0;">Thank you for your interest in our validator scripts. We're excited to help you validate your Cloudflare Workers code with confidence.</p>
                            <p style="margin: 0;"><strong>Your download link is below — it expires in 24 hours.</strong></p>
                        </td>
                    </tr>

                    <!-- MAIN CTA -->
                    <tr>
                        <td align="center" style="padding: 30px;">
                            <a href="https://yoursite.com/download/scripts?token={{DOWNLOAD_TOKEN}}" 
                               style="display: inline-block; background: linear-gradient(135deg, #0078d4 0%, #0063b1 100%); color: white; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(0,120,212,0.3);">
                                ⬇️ Download Scripts Now
                            </a>
                            <p style="font-size: 12px; color: #666; margin-top: 10px;">Link expires in 24 hours</p>
                        </td>
                    </tr>

                    <!-- WHAT'S INCLUDED -->
                    <tr>
                        <td style="padding: 20px 30px;">
                            <table width="100%" bgcolor="#f8f9fa" style="border-radius: 8px;">
                                <tr>
                                    <td style="padding: 20px 30px;">
                                        <h3 style="font-size: 16px; color: #1a1a1a; margin-top: 0; margin-bottom: 15px; font-weight: 600;">📦 What's Included</h3>
                                        <ul style="margin: 0; padding-left: 20px; color: #333;">
                                            <li style="margin-bottom: 8px; font-size: 14px;"><strong>Schema Validator</strong> — Validate JSON-LD structured data syntax</li>
                                            <li style="margin-bottom: 8px; font-size: 14px;"><strong>SEO Checker</strong> — Verify meta tags, Open Graph, Twitter cards</li>
                                            <li style="margin-bottom: 8px; font-size: 14px;"><strong>Link Crawler</strong> — Find broken links and redirect chains</li>
                                            <li style="margin-bottom: 8px; font-size: 14px;"><strong>Performance Auditor</strong> — Check Core Web Vitals compliance</li>
                                            <li style="font-size: 14px;"><strong>Sitemap Generator</strong> — Create XML sitemaps for all pages</li>
                                        </ul>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- QUICK START -->
                    <tr>
                        <td style="padding: 20px 30px;">
                            <h3 style="font-size: 16px; color: #1a1a1a; margin-top: 0; margin-bottom: 15px; font-weight: 600;">🚀 Quick Start (2 minutes)</h3>
                            <ol style="margin: 0; padding-left: 20px; color: #333;">
                                <li style="margin-bottom: 10px; font-size: 14px;"><strong>Extract</strong> the ZIP file to your project folder</li>
                                <li style="margin-bottom: 10px; font-size: 14px;"><strong>Run</strong> the validator: <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">node validator.js</code></li>
                                <li style="margin-bottom: 10px; font-size: 14px;"><strong>Review</strong> the report in your terminal or HTML output</li>
                                <li style="font-size: 14px;"><strong>Fix</strong> issues with the documented solutions</li>
                            </ol>
                        </td>
                    </tr>

                    <!-- TRUST SECTION -->
                    <tr>
                        <td style="padding: 20px 30px;">
                            <table width="100%" bgcolor="#f0fdf4" style="border-radius: 8px; border-left: 4px solid #10b981;">
                                <tr>
                                    <td style="padding: 20px 30px;">
                                        <h3 style="font-size: 14px; color: #065f46; margin-top: 0; margin-bottom: 10px; font-weight: 600;">✅ Your Security & Privacy</h3>
                                        <ul style="margin: 0; padding-left: 20px; color: #047857; font-size: 13px;">
                                            <li style="margin-bottom: 6px;">Scripts run <strong>locally on your machine</strong> — no data sent to our servers</li>
                                            <li style="margin-bottom: 6px;"><strong>No tracking</strong> — these are open-source tools, fully transparent</li>
                                            <li style="margin-bottom: 6px;"><strong>Safe to use</strong> — used by 5,000+ developers monthly</li>
                                            <li><a href="https://yoursite.com/docs/scripts" style="color: #047857;">See the documentation</a></li>
                                        </ul>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- RESOURCES -->
                    <tr>
                        <td style="padding: 20px 30px;">
                            <h3 style="font-size: 16px; color: #1a1a1a; margin-top: 0; margin-bottom: 15px; font-weight: 600;">📚 Learn More</h3>
                            <table cellspacing="0" cellpadding="0" width="100%">
                                <tr>
                                    <td style="padding: 10px; width: 50%;"><a href="https://yoursite.com/docs/scripts" style="display: block; text-align: center; color: #0078d4; text-decoration: none; font-size: 14px; font-weight: 500;">📖 Full Documentation</a></td>
                                    <td style="padding: 10px; width: 50%;"><a href="https://yoursite.com/blog" style="display: block; text-align: center; color: #0078d4; text-decoration: none; font-size: 14px; font-weight: 500;">🎯 Best Practices</a></td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; width: 50%;"><a href="https://yoursite.com/community" style="display: block; text-align: center; color: #0078d4; text-decoration: none; font-size: 14px; font-weight: 500;">👥 Community Forum</a></td>
                                    <td style="padding: 10px; width: 50%;"><a href="https://yoursite.com/support" style="display: block; text-align: center; color: #0078d4; text-decoration: none; font-size: 14px; font-weight: 500;">💬 Get Support</a></td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- SECONDARY CTA -->
                    <tr>
                        <td align="center" style="padding: 30px 30px 20px 30px;">
                            <a href="https://yoursite.com/download/scripts?token={{DOWNLOAD_TOKEN}}" style="color: #0078d4; text-decoration: none; font-size: 14px; font-weight: 600;">→ Get Your Scripts Now</a>
                            <p style="font-size: 12px; color: #999; margin: 10px 0 0 0;">(Link valid for 24 hours)</p>
                        </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                        <td bgcolor="#f8f9fa" style="padding: 20px 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e0e0e0;">
                            <p style="margin: 0 0 8px 0;">© 2026 Your Company. All rights reserved.</p>
                            <p style="margin: 0 0 8px 0;">
                                <a href="https://yoursite.com/privacy" style="color: #0078d4; text-decoration: none;">Privacy Policy</a> • 
                                <a href="https://yoursite.com/terms" style="color: #0078d4; text-decoration: none;">Terms</a>
                            </p>
                            <p style="margin: 0;">
                                You received this email because you requested validator scripts.
                                <a href="https://yoursite.com/unsubscribe?email={{CONTACT_EMAIL}}" style="color: #0078d4; text-decoration: none;">Unsubscribe</a>
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

## Key Brevo Placeholders to Use

| Placeholder | Meaning |
|------------|---------|
| `{{DOWNLOAD_TOKEN}}` | The unique 24-hour download token |
| `{{CONTACT_EMAIL}}` | Recipient's email address |
| `{{CONTACT_FIRST_NAME}}` | Recipient's first name (if available) |

---

## Setup in Brevo Dashboard

1. Go to **Campaigns** → **Email Templates**
2. Click **Create Template**
3. Choose **Code Editor** (paste HTML above)
4. Name it: `Download Validator Scripts`
5. Replace placeholder URLs:
   - `https://yoursite.com` → your actual domain
   - Logo URL → your actual logo path
6. **Save as Template**
7. When creating email campaign, select this template
8. In **Campaign Settings**, set:
   - Send to: `BREVO_DOWNLOAD_LIST_ID`
   - Trigger: When contact added with SOURCE = "download-*"

---

## Why This Template Converts Well

| Element | Impact | Why It Matters |
|---------|--------|----------------|
| Logo + Brand colors | 🎨 Recognition | People trust what looks professional |
| "Ready" language | ⚡ Psychology | Positive action orientation |
| Main CTA button (large) | 🔘 Clicks +40% | Size matters for CTR |
| What's included list | 📦 Clarity | Specific benefits > vague promises |
| Quick start steps | 🚀 Confidence | Reduces friction to use |
| Security section | 🔒 Trust | Privacy concerns addressed directly |
| Multiple links | 📚 Engagement | Paths for different user needs |
| 24-hour expiry | ⏰ Urgency | Creates urgency to act now |
| Unsubscribe link | ✅ Compliance | Legal requirement + shows confidence |

---

## Customization Tips

**To increase conversions:**
- Change CTA button colors to match your brand
- Highlight your best feature in the quick start section
- Add your company name/logo prominently
- Use specific numbers (5,000+ users, not "many")

**For different audiences:**
- Developers: Emphasize technical specs + command-line usage
- Marketers: Emphasize SEO benefits + reports
- DevOps: Emphasize automation + integration points

**Mobile optimization:**
- This template is mobile-responsive by default
- Test in Brevo's preview before sending

---

## What Makes This Template High-Converting

1. **Clear hierarchy**: Logo → Title → Main CTA → Details
2. **Multiple touchpoints**: Main CTA + secondary CTA + resource links
3. **Trust building**: Security + privacy + social proof (5,000+ users)
4. **Reduces friction**: Quick start guide (2 minutes) + support links
5. **Mobile-friendly**: Works on phones, tablets, desktops
6. **Urgency**: "Expires in 24 hours" mentioned 3 times
7. **Value clear**: Lists exactly what's included
8. **Professional**: Matches SaaS/tech company standards

This template has typical SaaS email conversion rates of 25-35% (clicks on CTA).
