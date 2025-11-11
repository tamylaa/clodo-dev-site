#!/usr/bin/env node

/**
 * Clodo Framework Quick Start Script
 * Cross-platform setup script for Clodo Framework
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const projectName = args.find(arg => !arg.startsWith('-')) || 'my-clodo-app';
const skipGit = args.includes('--skip-git');
const isTemplate = args.includes('--template');
// const skipDeploy = args.includes('--skip-deploy'); // Not used yet

// Template mode adjustments
if (isTemplate) {
    console.log('🎯 Creating StackBlitz template (simplified structure)');
    console.log('==================================================');
}

console.log('🚀 Clodo Framework Quick Start Setup');
console.log('=====================================');

// Check prerequisites
console.log('\n📋 Checking prerequisites...');

// Check Node.js
try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    console.log(`✅ Node.js found: ${nodeVersion}`);
} catch (error) {
    console.error('❌ Node.js not found. Please install Node.js 14+ from https://nodejs.org/');
    process.exit(1);
}

// Check npm
try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    console.log(`✅ npm found: ${npmVersion}`);
} catch (error) {
    console.error('❌ npm not found. Please install npm.');
    process.exit(1);
}

// Check git
if (!skipGit) {
    try {
        const gitVersion = execSync('git --version', { encoding: 'utf8' }).trim();
        console.log(`✅ Git found: ${gitVersion}`);
    } catch (error) {
        console.error('❌ Git not found. Please install Git or use --skip-git flag.');
        process.exit(1);
    }
}

// Create project directory
console.log('\n📁 Creating project directory...');
if (fs.existsSync(projectName)) {
    console.error(`❌ Directory '${projectName}' already exists. Please choose a different name.`);
    process.exit(1);
}

fs.mkdirSync(projectName);
process.chdir(projectName);
console.log(`✅ Created directory: ${projectName}`);

// Initialize npm project
console.log('\n📦 Initializing npm project...');
execSync('npm init -y', { stdio: 'inherit' });
console.log('✅ npm project initialized');

// Clone Clodo Framework
console.log('\n⬇️ Cloning Clodo Framework...');
try {
    execSync('git clone https://github.com/tamylaa/clodo-framework.git .clodo-framework', { stdio: 'pipe' });
    console.log('✅ Clodo Framework cloned');
} catch (error) {
    console.error('❌ Failed to clone Clodo Framework. Please check your internet connection.');
    process.exit(1);
}

// Install dependencies
console.log('\n📦 Installing dependencies...');
execSync('npm install', { stdio: 'inherit' });
console.log('✅ Dependencies installed');

// Create domain configuration
console.log('\n⚙️ Creating domain configuration...');
const domainConfig = `// domain.config.js
module.exports = {
  name: '${projectName}',
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
`;

fs.writeFileSync('domain.config.js', domainConfig);
console.log('✅ Domain configuration created');

// Create services directory
fs.mkdirSync('services');

// Create web service
console.log('\n🌐 Creating web service...');
const webService = `// services/web.js
const clodo = require('./.clodo-framework');

clodo.service('web', async (request, env) => {
  const url = new URL(request.url);

  // Simple routing
  if (url.pathname === '/') {
    return new Response(\`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName} - Powered by Clodo</title>
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
        <h1>🚀 Welcome to ${projectName}!</h1>
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
    \`, {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  return new Response('Page not found', { status: 404 });
});
`;

fs.writeFileSync('services/web.js', webService);
console.log('✅ Web service created');

// Create API service
console.log('\n🔌 Creating API service...');
const apiService = `// services/api.js
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
      name: '${projectName}',
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
`;

fs.writeFileSync('services/api.js', apiService);
console.log('✅ API service created');

// Update package.json scripts
console.log('\n📝 Updating package.json scripts...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

if (isTemplate) {
    // StackBlitz template configuration
    packageJson.scripts = {
        "start": "node index.js",
        "dev": "node index.js"
    };
    packageJson.dependencies = {
        "clodo-framework": "latest"
    };
} else {
    // Full project configuration
    packageJson.scripts = {
        "start": "node .clodo-framework/bin/dev-server.js",
        "dev": "node .clodo-framework/bin/dev-server.js",
        "build": "node .clodo-framework/bin/build.js",
        "deploy": "node .clodo-framework/bin/deploy.js",
        "test": "echo 'Tests not yet implemented'"
    };
}

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log('✅ Package.json scripts updated');

// Create index.js for template mode
if (isTemplate) {
    console.log('\n📄 Creating index.js entry point...');
    const indexJs = `// index.js - Clodo Framework StackBlitz Template
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
    return new Response(\`
<!DOCTYPE html>
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
</html>
    \`, {
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
`;

    fs.writeFileSync('index.js', indexJs);
    console.log('✅ Index.js entry point created');

    // Create .stackblitzrc
    console.log('\n⚙️ Creating StackBlitz configuration...');
    const stackblitzrc = {
        "startCommand": "npm start",
        "env": {
            "NODE_ENV": "development"
        },
        "installDependencies": true,
        "nodeVersion": "18"
    };

    fs.writeFileSync('.stackblitzrc', JSON.stringify(stackblitzrc, null, 2));
    console.log('✅ StackBlitz configuration created');
}

// Create README
console.log('\n📖 Creating README...');

let readme;
if (isTemplate) {
    readme = `# ${projectName} - Clodo Framework StackBlitz Template

An instant coding environment for Clodo Framework running in StackBlitz.

## 🚀 Instant Start

This template opens directly in StackBlitz with a working Clodo Framework environment. No setup required!

## 🎯 What You Can Do

- **Edit Instantly**: Modify \`index.js\` and see changes immediately
- **Add Services**: Create new services in the \`services/\` directory
- **Configure Domains**: Update \`domain.config.js\` for your needs
- **Real Framework**: This is the actual Clodo Framework, not a simulation

## 🏗️ Template Structure

\`\`\`
${projectName}/
├── index.js              # Main entry point (runs immediately)
├── domain.config.js      # Domain and service configuration
├── services/             # Service implementations
│   ├── web.js           # Web application service
│   └── api.js           # API service
├── .clodo-framework/    # Clodo Framework core
├── .stackblitzrc        # StackBlitz configuration
├── package.json         # Project dependencies and scripts
└── README.md            # This file
\`\`\`

## 🌐 Live URLs

When running in StackBlitz:
- **Demo Page**: \`https://[project].stackblitz.io/demo\`
- **Health Check**: \`https://[project].stackblitz.io/health\`

## 📚 Learn More

- [Clodo Framework Documentation](https://clodo.dev/docs)
- [StackBlitz Guide](https://developer.stackblitz.com/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)

## 🆘 Support

- [Clodo Framework Issues](https://github.com/tamylaa/clodo-framework/issues)
- [StackBlitz Community](https://github.com/stackblitz/core)
`;
} else {
    readme = `# ${projectName}

A SaaS application built with Clodo Framework on Cloudflare Workers.

## 🚀 Quick Start

\`\`\`bash
# Start development server
npm start

# Your app will be available at http://localhost:8787
\`\`\`

## 🏗️ Project Structure

\`\`\`
${projectName}/
├── domain.config.js      # Domain and service configuration
├── services/             # Service implementations
│   ├── web.js           # Web application service
│   └── api.js           # API service
├── .clodo-framework/    # Clodo Framework core
└── package.json         # Project dependencies and scripts
\`\`\`

## 🔧 Available Scripts

- \`npm start\` - Start development server
- \`npm run build\` - Build for production
- \`npm run deploy\` - Deploy to Cloudflare Workers

## 📚 Learn More

- [Clodo Framework Documentation](https://clodo.dev/docs)
- [Cloudflare Workers Guide](https://developers.cloudflare.com/workers/)
- [D1 Database Documentation](https://developers.cloudflare.com/d1/)

## 🆘 Support

- [GitHub Issues](https://github.com/tamylaa/clodo-framework/issues)
- [Community Discord](https://discord.gg/clodo)
`;
}

fs.writeFileSync('README.md', readme);
console.log('✅ README created');

// Initialize git repository
if (!skipGit) {
    console.log('\n📊 Initializing Git repository...');
    execSync('git init', { stdio: 'pipe' });
    execSync('git add .', { stdio: 'pipe' });
    execSync(`git commit -m "Initial commit: ${projectName} created with Clodo Framework"`, { stdio: 'pipe' });
    console.log('✅ Git repository initialized');
}

// Success message
if (isTemplate) {
    console.log('\n🎉 StackBlitz template created successfully!');
    console.log('');
    console.log('Your Clodo Framework template is ready for StackBlitz!');
    console.log('===================================================');
    console.log(`📁 Template: ${projectName}`);
    console.log('🎯 Purpose: Instant coding environment');
    console.log('⚡ Platform: StackBlitz Web IDE');
    console.log('📦 Framework: Clodo v1.0.0');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('   1. Upload this template to GitHub as a public repository');
    console.log('   2. Enable template repository feature');
    console.log('   3. Test the StackBlitz URL: https://stackblitz.com/github/[username]/[repo]?file=index.js');
    console.log('   4. Integrate the URL into your website');
    console.log('');
    console.log('📖 Template features:');
    console.log('   • Instant loading in StackBlitz');
    console.log('   • Working Clodo Framework environment');
    console.log('   • Immediate code editing capabilities');
    console.log('   • Real service architecture');
} else {
    console.log('\n🎉 Setup complete! Starting development server...');
    console.log('');
    console.log('Your Clodo Framework app is ready!');
    console.log('=================================');
    console.log(`📁 Project: ${projectName}`);
    console.log('🌐 Local URL: http://localhost:8787');
    console.log('📦 Framework: Clodo v1.0.0');
    console.log('⚡ Runtime: Cloudflare Workers');
    console.log('');
    console.log('🚀 To deploy to production:');
    console.log('   npm run deploy');
    console.log('');
    console.log('📖 Next steps:');
    console.log('   1. Open http://localhost:8787 in your browser');
    console.log('   2. Try the API endpoints (/api/health, /api/info)');
    console.log('   3. Edit services/web.js and services/api.js');
    console.log('   4. Add database integration with D1');
    console.log('');
}

// Start the server (only for full projects, not templates)
if (!isTemplate) {
    try {
        console.log('Starting development server...');
        execSync('npm start', { stdio: 'inherit' });
    } catch (error) {
        console.error('❌ Failed to start development server. You can start it manually with: npm start');
    }
} else {
    console.log('\n✅ Template creation complete! Ready for GitHub upload.');
}