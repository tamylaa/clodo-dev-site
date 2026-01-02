# Clodo Framework Quick Start Script
# This script sets up a complete Clodo Framework project in minutes

param(
    [string]$ProjectName = "my-clodo-app",
    [switch]$SkipGit,
    [switch]$SkipDeploy,
    [switch]$Template
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

# Template mode
if ($Template) {
    Write-Host "`n🎯 Creating StackBlitz template (simplified structure)" -ForegroundColor Magenta
    Write-Host "==================================================" -ForegroundColor Magenta
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

if ($Template) {
    # StackBlitz template configuration
    $packageJson.scripts = @{
        "start" = "node index.js"
        "dev" = "node index.js"
    }
    $packageJson.dependencies = @{
        "clodo-framework" = "latest"
    }
} else {
    # Full project configuration
    $packageJson.scripts = @{
        "start" = "node .clodo-framework/bin/dev-server.js"
        "dev" = "node .clodo-framework/bin/dev-server.js"
        "build" = "node .clodo-framework/bin/build.js"
        "deploy" = "node .clodo-framework/bin/deploy.js"
        "test" = "echo 'Tests not yet implemented'"
    }
}

$packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"
Write-Host "✅ Package.json scripts updated" -ForegroundColor Green

# Create index.js for template mode
if ($Template) {
    Write-Host "`n📄 Creating index.js entry point..." -ForegroundColor Yellow
    $indexJs = @"
// index.js - Clodo Framework StackBlitz Template
const clodo = require('./.clodo-framework');

console.log('🚀 Clodo Framework Template Loaded!');
console.log('=====================================');
console.log('Welcome to your instant Clodo development environment!');
console.log('');
console.log('🎯 What you can do here:');
console.log('   • Edit this file and see changes instantly');
console.log('   • Add services in the services/ directory');
console.log('   • Configure your domain in domain.config.js');
console.log('   • Deploy to Cloudflare Workers when ready');
console.log('');
console.log('🔗 Useful links:');
console.log('   • Documentation: https://clodo.dev/docs');
console.log('   • GitHub: https://github.com/tamylaa/clodo-framework');
console.log('');

// Simple example service
clodo.service('demo', async (request, env) => {
  const url = new URL(request.url);

  if (url.pathname === '/demo') {
    return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Clodo Framework - Live Demo</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            line-height: 1.6;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        .container {
            background: rgba(255, 255, 255, 0.1);
            padding: 2rem;
            border-radius: 10px;
            backdrop-filter: blur(10px);
        }
        .status {
            background: rgba(0, 255, 0, 0.2);
            border: 1px solid #00ff00;
            border-radius: 5px;
            padding: 1rem;
            margin: 1rem 0;
        }
        .code {
            background: rgba(0, 0, 0, 0.3);
            padding: 1rem;
            border-radius: 5px;
            font-family: 'Monaco', 'Menlo', monospace;
            margin: 1rem 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Clodo Framework Live Demo</h1>
        <p><strong>Status:</strong> Running in StackBlitz!</p>

        <div class="status">
            <h2>✅ Your Clodo App is Live!</h2>
            <p><strong>Framework:</strong> Clodo v1.0.0</p>
            <p><strong>Environment:</strong> StackBlitz Web IDE</p>
            <p><strong>Runtime:</strong> Node.js</p>
        </div>

        <h2>🎯 Try It Out</h2>
        <p>Edit <code>index.js</code> in the file explorer and watch your changes appear instantly!</p>

        <div class="code">
// Try editing this in index.js:
console.log('Hello from Clodo Framework!');
        </div>

        <h2>📚 Next Steps</h2>
        <ol>
            <li>Explore the <code>services/</code> directory</li>
            <li>Check <code>domain.config.js</code> for configuration</li>
            <li>Add your own services and routes</li>
            <li>Download this project to run locally</li>
        </ol>

        <p><em>💡 Tip: This is running in a real Clodo Framework environment!</em></p>
    </div>
</body>
</html>`, {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  // Health check
  if (url.pathname === '/health') {
    return Response.json({
      status: 'healthy',
      framework: 'Clodo',
      environment: 'StackBlitz Template',
      timestamp: new Date().toISOString()
    });
  }

  return new Response('Clodo Framework Template - Visit /demo to see the live demo!', {
    headers: { 'Content-Type': 'text/plain' }
  });
});

// Start the server
console.log('🌐 Starting Clodo Framework server...');
console.log('   Visit: https://your-project.stackblitz.io/demo');
console.log('   Health: https://your-project.stackblitz.io/health');
console.log('');

clodo.start().catch(console.error);
"@

    $indexJs | Out-File -FilePath "index.js" -Encoding UTF8
    Write-Host "✅ Index.js entry point created" -ForegroundColor Green

    # Create .stackblitzrc
    Write-Host "`n⚙️ Creating StackBlitz configuration..." -ForegroundColor Yellow
    $stackblitzrc = @{
        "startCommand" = "npm start"
        "env" = @{
            "NODE_ENV" = "development"
        }
        "installDependencies" = $true
        "nodeVersion" = "18"
    }

    $stackblitzrc | ConvertTo-Json | Set-Content ".stackblitzrc"
    Write-Host "✅ StackBlitz configuration created" -ForegroundColor Green
}

# Create README
Write-Host "`n📖 Creating README..." -ForegroundColor Yellow

if ($Template) {
    $readme = @"
# $ProjectName - Clodo Framework StackBlitz Template

An instant coding environment for Clodo Framework running in StackBlitz.

## 🚀 Instant Start

This template opens directly in StackBlitz with a working Clodo Framework environment. No setup required!

## 🎯 What You Can Do

- **Edit Instantly**: Modify \`index.js\` and see changes immediately
- **Add Services**: Create new services in the \`services/\` directory
- **Configure Domains**: Update \`domain.config.js\` for your needs
- **Real Framework**: This is the actual Clodo Framework, not a simulation

## 🏗️ Template Structure

```
$ProjectName/
├── index.js              # Main entry point (runs immediately)
├── domain.config.js      # Domain and service configuration
├── services/             # Service implementations
│   ├── web.js           # Web application service
│   └── api.js           # API service
├── .clodo-framework/    # Clodo Framework core
├── .stackblitzrc        # StackBlitz configuration
├── package.json         # Project dependencies and scripts
└── README.md            # This file
```

## 🌐 Live URLs

When running in StackBlitz:
- **Demo Page**: `https://[project].stackblitz.io/demo`
- **Health Check**: `https://[project].stackblitz.io/health`

## 📚 Learn More

- [Clodo Framework Documentation](https://clodo.dev/docs)
- [StackBlitz Guide](https://developer.stackblitz.com/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)

## 🆘 Support

- [Clodo Framework Issues](https://github.com/tamylaa/clodo-framework/issues)
- [StackBlitz Community](https://github.com/stackblitz/core)
"@
} else {
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
}

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

# Success message and server start
if ($Template) {
    Write-Host "`n🎉 StackBlitz template created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your Clodo Framework template is ready for StackBlitz!" -ForegroundColor Cyan
    Write-Host "===================================================" -ForegroundColor Cyan
    Write-Host "📁 Template: $ProjectName" -ForegroundColor White
    Write-Host "🎯 Purpose: Instant coding environment" -ForegroundColor White
    Write-Host "⚡ Platform: StackBlitz Web IDE" -ForegroundColor White
    Write-Host "📦 Framework: Clodo v1.0.0" -ForegroundColor White
    Write-Host "" -ForegroundColor White
    Write-Host "🚀 Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Upload this template to GitHub as a public repository" -ForegroundColor White
    Write-Host "   2. Enable template repository feature" -ForegroundColor White
    Write-Host "   3. Test the StackBlitz URL: https://stackblitz.com/github/[username]/[repo]?file=index.js" -ForegroundColor White
    Write-Host "   4. Integrate the URL into your website" -ForegroundColor White
    Write-Host "" -ForegroundColor White
    Write-Host "📖 Template features:" -ForegroundColor Yellow
    Write-Host "   • Instant loading in StackBlitz" -ForegroundColor White
    Write-Host "   • Working Clodo Framework environment" -ForegroundColor White
    Write-Host "   • Immediate code editing capabilities" -ForegroundColor White
    Write-Host "   • Real service architecture" -ForegroundColor White
    Write-Host "" -ForegroundColor White
    Write-Host "✅ Template creation complete! Ready for GitHub upload." -ForegroundColor Green
} else {
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
}