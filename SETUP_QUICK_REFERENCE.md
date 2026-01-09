# Quick Reference: 4 Setup Tasks

## Copy-Paste Commands

### Task 1: Create ZIP File
```bash
cd downloads
zip -r validator-scripts.zip validator-scripts/
cd ..
```

Verify:
```bash
ls -lh downloads/validator-scripts.zip
unzip -t downloads/validator-scripts.zip
```

---

### Task 2-4: Cloudflare Dashboard Configuration

**Go to**: https://dash.cloudflare.com/
**Select**: clodo-dev-site Pages project
**Go to**: Settings → Environment variables

---

### Variable 2: BREVO_DOWNLOAD_LIST_ID

1. Go to Brevo: https://app.brevo.com/
2. Navigate to: Contacts → Lists
3. Click: Create List
4. Name: `Validator Scripts Downloads`
5. Create and copy the **List ID** (number)

**In Cloudflare**:
- Add variable
- Name: `BREVO_DOWNLOAD_LIST_ID`
- Value: `<your-list-id-from-brevo>`
- Environments: Production + Preview
- Save

---

### Variable 3: DOWNLOAD_TOKEN_SECRET

**Terminal command**:
```bash
openssl rand -base64 32
```

Copy output (example: `uR8qZ2xL9mK5pN3wJ7vB1hQ6fX8cT4dS9eA2bY3+G5/I=`)

**In Cloudflare**:
- Add variable
- Name: `DOWNLOAD_TOKEN_SECRET`
- Value: `<paste-openssl-output>`
- Environments: Production + Preview
- Save

---

### Variable 1: BREVO_API_KEY

Just verify it exists (already set by newsletter system):
- Go to: Settings → Environment variables
- Look for: `BREVO_API_KEY`
- Should show: `sk_live_...` (masked)
- If present: ✓ Done

---

## Checklist

After all setup:

```
☐ ZIP file created: downloads/validator-scripts.zip
☐ BREVO_API_KEY: Verified in Cloudflare (Production)
☐ BREVO_DOWNLOAD_LIST_ID: Set in Cloudflare (Production)
☐ DOWNLOAD_TOKEN_SECRET: Set in Cloudflare (Production)
```

---

## Commit & Deploy

```bash
git add downloads/validator-scripts.zip
git add -A
git commit -m "feat: Add download validator scripts system"
git push
```

Done! 🚀
