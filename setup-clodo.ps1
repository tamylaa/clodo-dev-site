# Clodo Framework Quick Start Script
# This script sets up a complete Clodo Framework project in minutes

param(
    [string]$ProjectName = "my-clodo-app",
    [switch]$SkipGit,
    [switch]$SkipDeploy
)

Write-Host "🚀 Clodo Framework Quick Start Setup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Check prerequisites
Write-Host "`n📋 Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = & node --version 2>$null
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 14+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check npm
try {
    $npmVersion = & npm --version 2>$null
    Write-Host "✅ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found. Please install npm." -ForegroundColor Red
    exit 1
}

# Check git
if (!$SkipGit) {
    try {
        $gitVersion = & git --version 2>$null
        Write-Host "✅ Git found: $gitVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Git not found. Please install Git or use -SkipGit flag." -ForegroundColor Red
        exit 1
    }
}

# Create project directory
Write-Host "`n📁 Creating project directory..." -ForegroundColor Yellow
if (Test-Path $ProjectName) {
    Write-Host "❌ Directory '$ProjectName' already exists. Please choose a different name." -ForegroundColor Red
    exit 1
}

New-Item -ItemType Directory -Path $ProjectName | Out-Null
Set-Location $ProjectName
Write-Host "✅ Created directory: $ProjectName" -ForegroundColor Green

# Initialize npm project
Write-Host "`n📦 Initializing npm project..." -ForegroundColor Yellow
& npm init -y | Out-Null
Write-Host "✅ npm project initialized" -ForegroundColor Green

# Clone Clodo Framework (since it's not on npm yet)
Write-Host "`n⬇️ Cloning Clodo Framework..." -ForegroundColor Yellow
try {
    & git clone https://github.com/tamylaa/clodo-framework.git .clodo-framework | Out-Null
    Write-Host "✅ Clodo Framework cloned" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to clone Clodo Framework. Please check your internet connection." -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow
& npm install | Out-Null
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Create domain configuration
Write-Host "`n⚙️ Creating domain configuration..." -ForegroundColor Yellow
$domainConfig = @"
// domain.config.js
module.exports = {
  name: '$ProjectName',
  version: '1.0.0',
  services: {
    web: {
      routes: ['/*'],
      description: 'Main web application'
    },
    api: {
      routes: ['/api/*'],
      description: 'REST API endpoints'
    }
  },
  multiTenant: {
    enabled: false,
    isolation: 'database'
  },
  security: {
    encryption: 'AES-256-CBC',
    validation: true
  }
};
"@

$domainConfig | Out-File -FilePath "domain.config.js" -Encoding UTF8
Write-Host "✅ Domain configuration created" -ForegroundColor Green

# Create services directory
New-Item -ItemType Directory -Path "services" | Out-Null

# Create web service
Write-Host "`n🌐 Creating web service..." -ForegroundColor Yellow
$webService = @"
// services/web.js
const clodo = require('./.clodo-framework');

clodo.service('web', async (request, env) => {
  const url = new URL(request.url);

  // Simple routing
  if (url.pathname === '/') {
    return new Response(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>$ProjectName - Powered by Clodo</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            line-height: 1.6;
        }
        .hero {
            text-align: center;
            padding: 3rem 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
            margin-bottom: 2rem;
        }
        .status {
            background: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 5px;
            padding: 1rem;
            margin: 1rem 0;
        }
    </style>
</head>
<body>
    <div class="hero">
        <h1>🚀 Welcome to $ProjectName!</h1>
        <p>Built with Clodo Framework on Cloudflare Workers</p>
    </div>

    <div class="status">
        <h2>✅ Your app is running!</h2>
        <p><strong>Framework:</strong> Clodo v1.0.0</p>
        <p><strong>Runtime:</strong> Cloudflare Workers</p>
        <p><strong>Database:</strong> D1 (SQLite)</p>
        <p><strong>Security:</strong> AES-256-CBC encryption</p>
    </div>

    <h2>🧪 Test Your API</h2>
    <p>Try these endpoints:</p>
    <ul>
        <li><a href="/api/health">/api/health</a> - Health check</li>
        <li><a href="/api/info">/api/info</a> - App information</li>
    </ul>

    <h2>📚 Next Steps</h2>
    <ol>
        <li>Add your own services in the <code>services/</code> directory</li>
        <li>Configure your database schema</li>
        <li>Set up authentication</li>
        <li>Deploy to production with <code>npx clodo deploy</code></li>
    </ol>
</body>
</html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  return new Response('Page not found', { status: 404 });
});
"@

$webService | Out-File -FilePath "services/web.js" -Encoding UTF8
Write-Host "✅ Web service created" -ForegroundColor Green

# Create API service
Write-Host "`n🔌 Creating API service..." -ForegroundColor Yellow
$apiService = @"
// services/api.js
const clodo = require('./.clodo-framework');

clodo.service('api', async (request, env) => {
  const url = new URL(request.url);
  const pathname = url.pathname.replace('/api', '');

  // Health check endpoint
  if (pathname === '/health' && request.method === 'GET') {
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      framework: 'Clodo',
      version: '1.0.0',
      services: ['web', 'api']
    });
  }

  // Info endpoint
  if (pathname === '/info' && request.method === 'GET') {
    return Response.json({
      name: '$ProjectName',
      version: '1.0.0',
      framework: 'Clodo Framework',
      runtime: 'Cloudflare Workers',
      features: [
        'Multi-domain support',
        'Security-by-default',
        'Service autonomy',
        'D1 database integration',
        'TypeScript support'
      ]
    });
  }

  // 404 for unknown API endpoints
  return new Response(JSON.stringify({
    error: 'API endpoint not found',
    available: ['/api/health', '/api/info']
  }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
});
"@

$apiService | Out-File -FilePath "services/api.js" -Encoding UTF8
Write-Host "✅ API service created" -ForegroundColor Green

# Create package.json scripts
Write-Host "`n📝 Updating package.json scripts..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$packageJson.scripts = @{
    "start" = "node .clodo-framework/bin/dev-server.js"
    "dev" = "node .clodo-framework/bin/dev-server.js"
    "build" = "node .clodo-framework/bin/build.js"
    "deploy" = "node .clodo-framework/bin/deploy.js"
    "test" = "echo 'Tests not yet implemented'"
}
$packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"
Write-Host "✅ Package.json scripts updated" -ForegroundColor Green

# Create README
Write-Host "`n📖 Creating README..." -ForegroundColor Yellow
$readme = @"
# $ProjectName

A SaaS application built with Clodo Framework on Cloudflare Workers.

## 🚀 Quick Start

```bash
# Start development server
npm start

# Your app will be available at http://localhost:8787
```

## 🏗️ Project Structure

```
$ProjectName/
├── domain.config.js      # Domain and service configuration
├── services/             # Service implementations
│   ├── web.js           # Web application service
│   └── api.js           # API service
├── .clodo-framework/    # Clodo Framework core
└── package.json         # Project dependencies and scripts
```

## 🔧 Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run deploy` - Deploy to Cloudflare Workers

## 📚 Learn More

- [Clodo Framework Documentation](https://clodo.dev/docs)
- [Cloudflare Workers Guide](https://developers.cloudflare.com/workers/)
- [D1 Database Documentation](https://developers.cloudflare.com/d1/)

## 🆘 Support

- [GitHub Issues](https://github.com/tamylaa/clodo-framework/issues)
- [Community Discord](https://discord.gg/clodo)
"@

$readme | Out-File -FilePath "README.md" -Encoding UTF8
Write-Host "✅ README created" -ForegroundColor Green

# Initialize git repository
if (!$SkipGit) {
    Write-Host "`n📊 Initializing Git repository..." -ForegroundColor Yellow
    & git init | Out-Null
    & git add . | Out-Null
    & git commit -m "Initial commit: $ProjectName created with Clodo Framework" | Out-Null
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
}

# Start development server
Write-Host "`n🎉 Setup complete! Starting development server..." -ForegroundColor Green
Write-Host ""
Write-Host "Your Clodo Framework app is ready!" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "📁 Project: $ProjectName" -ForegroundColor White
Write-Host "🌐 Local URL: http://localhost:8787" -ForegroundColor White
Write-Host "📦 Framework: Clodo v1.0.0" -ForegroundColor White
Write-Host "⚡ Runtime: Cloudflare Workers" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "🚀 To deploy to production:" -ForegroundColor Yellow
Write-Host "   npm run deploy" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "📖 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Open http://localhost:8787 in your browser" -ForegroundColor White
Write-Host "   2. Try the API endpoints (/api/health, /api/info)" -ForegroundColor White
Write-Host "   3. Edit services/web.js and services/api.js" -ForegroundColor White
Write-Host "   4. Add database integration with D1" -ForegroundColor White
Write-Host "" -ForegroundColor White

# Start the server
try {
    & npm start
} catch {
    Write-Host "❌ Failed to start development server. You can start it manually with: npm start" -ForegroundColor Red
}