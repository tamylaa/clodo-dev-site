# 🚀 Quick Start Guide

Get up and running with Clodo Framework in **1 minute**. Build your first enterprise SaaS application on Cloudflare Workers.

## ⚡ 1-Click Setup (Recommended)

### Option 1: PowerShell Script (Windows) ✅ TESTED
```powershell
# Download and run the setup script
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/tamylaa/clodo-dev-site/main/setup-clodo.ps1" -OutFile "setup-clodo.ps1"
.\setup-clodo.ps1 my-awesome-app
```

### Option 2: JavaScript Script (Cross-platform) ✅ TESTED
```bash
# Download and run the setup script
curl -o setup-clodo.js https://raw.githubusercontent.com/tamylaa/clodo-dev-site/main/setup-clodo.js
node setup-clodo.js my-awesome-app
```

### Option 3: Manual Setup (5 minutes)

### 1. Create Your Project (1 minute)

```bash
# Create project directory
mkdir my-saas-app
cd my-saas-app

# Initialize npm project
npm init -y

# Clone Clodo Framework (latest version)
git clone https://github.com/tamylaa/clodo-framework.git .clodo-framework

# Install dependencies
npm install
```

### 2. Create Domain Configuration (1 minute)

```javascript
// domain.config.js
module.exports = {
  name: 'my-saas-app',
  services: {
    web: { routes: ['/*'] },
    api: { routes: ['/api/*'] }
  }
};
```

### 3. Build Your First Service (2 minutes)

```javascript
// services/web.js
const clodo = require('./.clodo-framework');

clodo.service('web', async (request, env) => {
  return new Response(`
    <!DOCTYPE html>
    <html>
      <head><title>My SaaS App</title></head>
      <body>
        <h1>Welcome to My SaaS App!</h1>
        <p>Built with Clodo Framework</p>
      </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
});

// services/api.js
clodo.service('api', async (request, env) => {
  if (request.method === 'GET' && new URL(request.url).pathname === '/api/health') {
    return Response.json({ status: 'healthy', timestamp: new Date().toISOString() });
  }
  return new Response('Not Found', { status: 404 });
});
```

### 4. Deploy to Production (1 minute)

```bash
# Deploy to Cloudflare Workers
npx clodo deploy

# Your app is now live at:
# https://my-saas-app.your-subdomain.workers.dev
```

## 🎯 What You Just Built

Your first Clodo application includes:

- ✅ **Multi-Domain Support** - Separate web and API services
- ✅ **Security-by-Default** - AES-256-CBC encryption built-in
- ✅ **Service Autonomy** - Independent service deployment
- ✅ **TypeScript Support** - Full type safety available
- ✅ **Global CDN** - Instant worldwide distribution

## 🧪 Test Your Application

```bash
# Test web service
curl https://my-saas-app.your-subdomain.workers.dev

# Test API service
curl https://my-saas-app.your-subdomain.workers.dev/api/health
```

## 🏗️ Add More Features

### Database Integration (D1)
```javascript
// services/api.js
const clodo = require('clodo-framework');

clodo.service('api', async (request, env) => {
  // D1 database is available via env.DB
  const { results } = await env.DB.prepare("SELECT * FROM users").all();
  return Response.json(results);
});
```

### Authentication
```javascript
// Add auth middleware
const auth = require('clodo-framework/auth');

clodo.service('api', auth.required(), async (request, env) => {
  // Only authenticated users can access
  return Response.json({ user: request.user });
});
```

### Multi-Tenant Support
```javascript
// domain.config.js
module.exports = {
  name: 'my-saas-app',
  multiTenant: {
    isolation: 'database',
    onboarding: { autoDeploy: true }
  },
  services: { /* ... */ }
};
```

## 📚 Next Steps

- **[Full Documentation](docs.html)** - Complete API reference
- **[Examples](examples.html)** - Real-world use cases
- **[Migration Guide](migrate.html)** - Move from other platforms- **[Consume Clodo Framework](./CONSUME_CLODO_FRAMEWORK_SITE.html)** - Quick guide for how to use the framework (CLI & programmatic examples)
## 🆘 Need Help?

- **GitHub Issues** - [Report bugs](https://github.com/tamylaa/clodo-framework/issues)
- **Community Discord** - [Join discussion](https://discord.gg/clodo)
- **Email Support** - support@clodo.dev

---

**Time to complete:** 1 minute (script) or 5 minutes (manual) ⏱️  
**Cost:** Free (Cloudflare Workers free tier) 💰  
**Infrastructure:** Global CDN, 0 cold starts ⚡

**💡 Pro Tip:** Use the 1-click setup scripts for the fastest experience!</content>
<parameter name="filePath">c:\Users\Admin\Documents\coding\clodo-dev-site\docs\QUICK_START.md