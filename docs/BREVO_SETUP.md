# Brevo Newsletter Integration Setup

This guide will help you connect your Brevo account to the newsletter subscription form in the footer.

## Prerequisites

1. A Brevo account (formerly Sendinblue) - sign up at [brevo.com](https://www.brevo.com)
2. A mailing list created in Brevo for newsletter subscribers

## Step 1: Get Your Brevo API Key

1. Log in to your [Brevo account](https://app.brevo.com)
2. Go to **Settings** → **API Keys**
3. Click **Create a new API key**
4. Give it a name like "Clodo Newsletter API"
5. Copy the generated API key (keep it secure!)

## Step 2: Get Your Mailing List ID

1. In your Brevo dashboard, go to **Contacts** → **Lists**
2. Create a new list or use an existing one for newsletter subscribers
3. Click on the list to open it
4. Look at the URL - the list ID is the number at the end
   - Example: `https://app.brevo.com/contacts/lists/123` → List ID is `123`

## Step 3: Configure the Secure Integration

**⚠️ Security Note**: API keys are now stored in a gitignored file to prevent accidental commits.**

1. Open `public/brevo-secure-config.js` in your project (this file is gitignored)
2. Add your actual API key and list ID:

```javascript
window.BREVO_SECURE_CONFIG = {
    API_KEY: 'xkeysib-your-actual-api-key-here',
    LIST_ID: 123, // Your actual list ID
};
```

The main configuration in `public/brevo-config.js` will automatically load these secure values.

## Step 4: Test the Integration

1. Run your development server: `npm run dev`
2. Go to your website and try subscribing with a test email
3. Check your Brevo dashboard to confirm the contact was added
4. Verify the contact received any confirmation emails

## Step 5: Optional Enhancements

### Double Opt-In Setup

If you want users to confirm their subscription via email:

1. Set `DOUBLE_OPT_IN: true` in the config
2. Create a confirmation email template in Brevo
3. Set the `TEMPLATE_ID` to your template's ID

### Custom Attributes

The integration automatically adds these attributes to contacts:
- `SOURCE`: Where they subscribed from (e.g., "footer")
- `SUBSCRIPTION_DATE`: When they subscribed
- `CONSENT_GIVEN`: Whether they agreed to terms

## Security Considerations

✅ **Secure Setup**: API keys are now stored in `brevo-secure-config.js` which is gitignored
✅ **No Accidental Commits**: Sensitive credentials won't be committed to your repository
⚠️ **Still Frontend**: For maximum security, consider using a backend proxy in production

## File Structure

```
your-project/
├── .gitignore                    # Includes public/brevo-secure-config.js
├── public/
│   ├── brevo-secure-config.js    # 🔒 Secure credentials (gitignored)
│   ├── brevo-config.js          # Public config (loads secure values)
│   ├── script.js                # Newsletter form logic
│   └── index.html               # Loads config scripts
└── docs/
    └── BREVO_SETUP.md           # This documentation
```

## Troubleshooting

### Common Issues

1. **"Invalid API key" error**: Check that your API key is correct and active
2. **"List not found" error**: Verify your LIST_ID is correct
3. **CORS errors**: This shouldn't happen with Brevo's API, but check browser console
4. **Duplicate email error**: Brevo prevents duplicate emails by default

### Testing API Key

You can test your API key with this curl command:

```bash
curl -X POST "https://api.brevo.com/v3/contacts" \
     -H "accept: application/json" \
     -H "content-type: application/json" \
     -H "api-key: YOUR_API_KEY_HERE" \
     -d '{"email":"test@example.com","listIds":[YOUR_LIST_ID]}'
```

## Support

- Brevo API Documentation: https://developers.brevo.com/reference/createcontact
- Brevo Support: https://www.brevo.com/support/