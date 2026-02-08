# Clodo Framework - Developer Documentation

Welcome to the Clodo Framework developer documentation. This comprehensive guide will help you get started with building enterprise-grade SaaS applications on Cloudflare Workers.

## 🚀 Quick Start

### Prerequisites

- Node.js 14+
- Cloudflare Workers account
- Basic knowledge of JavaScript/TypeScript

### Installation

```bash
# Clone the framework
git clone https://github.com/tamylaa/clodo-framework.git
cd clodo-framework

# Install dependencies
npm install

# Start development server
npm run dev
```

## 📚 Core Concepts

### Architecture Overview

Clodo Framework provides a complete enterprise platform for Cloudflare Workers:

- **Multi-Domain Support**: Deploy complex applications across multiple domains
- **Security-by-Default**: AES-256-CBC encryption, automated security validation
- **Service Autonomy**: Independent service deployment and discovery
- **Domain Configuration**: Runtime configuration management with validation

### Key Components

1. **Domain Configuration System**
2. **API Gateway Template**
3. **Authentication Service**
4. **Database Integration (D1)**
5. **Deployment Orchestration**

## 🛠️ API Reference

### Domain Configuration

```javascript
// Example domain configuration
const domainConfig = {
  name: 'my-saas-app',
  version: '1.0.0',
  services: {
    api: {
      routes: ['/api/*'],
      authentication: true,
      rateLimit: 1000
    },
    auth: {
      routes: ['/auth/*'],
      database: 'auth-db'
    }
  },
  security: {
    encryption: 'AES-256-CBC',
    tokenExpiry: 3600
  }
};
```

### Service Registration

```javascript
// Register a service
const service = await clodo.registerService({
  name: 'user-service',
  routes: ['/users/*'],
  dependencies: ['auth-service', 'database'],
  config: {
    database: 'users-db',
    cache: true
  }
});
```

## 📖 Tutorials

### Building Your First SaaS Application

1. **Setup Project Structure**
   ```bash
   mkdir my-saas-app
   cd my-saas-app
   npm init -y
   npm install clodo-framework
   ```

2. **Create Domain Configuration**
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

3. **Implement Services**
   ```javascript
   // services/web.js
   const clodo = require('clodo-framework');

   clodo.service('web', async (request, env) => {
     return new Response('Hello from Clodo!', {
       headers: { 'Content-Type': 'text/html' }
     });
   });
   ```

4. **Deploy**
   ```bash
   npx clodo deploy
   ```

### Advanced Features

#### Multi-Tenant Architecture

```javascript
// Multi-tenant service configuration
const tenantService = {
  isolation: 'database', // or 'schema' or 'prefix'
  onboarding: {
    template: 'saas-template',
    autoDeploy: true
  },
  billing: {
    integration: 'stripe',
    plan: 'pro'
  }
};
```

#### Security Implementation

```javascript
// Security middleware
const securityMiddleware = {
  cors: {
    origins: ['https://myapp.com'],
    credentials: true
  },
  rateLimit: {
    window: 60000, // 1 minute
    max: 100
  },
  encryption: {
    algorithm: 'AES-256-CBC',
    keyRotation: true
  }
};
```

## 🔧 Configuration

### Environment Variables

```bash
# Required
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_ACCOUNT_ID=your_account_id

# Optional
NODE_ENV=production
LOG_LEVEL=info
DATABASE_URL=your_d1_database_url
```

### Domain Configuration Schema

```json
{
  "$schema": "https://clodo.dev/schema/domain-config.json",
  "name": "string",
  "version": "string",
  "services": {
    "serviceName": {
      "routes": ["string"],
      "dependencies": ["string"],
      "config": "object"
    }
  },
  "security": {
    "encryption": "string",
    "tokenExpiry": "number"
  },
  "deployment": {
    "strategy": "string",
    "rollback": "boolean"
  }
}
```

## 🐛 Troubleshooting

### Common Issues

#### Deployment Failures

**Error**: `Service deployment timeout`

**Solution**:
```bash
# Check service logs
npx clodo logs service-name

# Validate configuration
npx clodo validate config.json

# Retry deployment
npx clodo deploy --force
```

#### Database Connection Issues

**Error**: `D1 database connection failed`

**Solution**:
```javascript
// Check database configuration
const db = clodo.database('my-db');
await db.connect();

// Verify permissions
const permissions = await db.getPermissions();
console.log('Database permissions:', permissions);
```

### Debug Mode

Enable debug logging:

```bash
DEBUG=clodo:* npm run dev
```

## 📊 Performance Optimization

### Caching Strategies

```javascript
// Response caching
const cachedResponse = await clodo.cache.get(request.url);
if (cachedResponse) {
  return cachedResponse;
}

// Cache the response
const response = await fetchData();
await clodo.cache.set(request.url, response, { ttl: 3600 });
return response;
```

### Database Optimization

```javascript
// Connection pooling
const db = clodo.database('my-db', {
  poolSize: 10,
  timeout: 30000
});

// Query optimization
const optimizedQuery = db.optimize(`
  SELECT users.* FROM users
  INNER JOIN profiles ON users.id = profiles.user_id
  WHERE users.active = true
`);
```

## 🔒 Security Best Practices

### Input Validation

```javascript
// Validate user input
const validatedData = await clodo.validate(request.body, {
  name: 'string|required|min:2|max:50',
  email: 'email|required',
  password: 'string|min:8|complex'
});
```

### Authentication

```javascript
// JWT token validation
const token = request.headers.get('Authorization');
const user = await clodo.auth.verify(token);

if (!user) {
  return new Response('Unauthorized', { status: 401 });
}
```

### HTTPS Enforcement

```javascript
// Force HTTPS
if (request.url.startsWith('http://')) {
  return Response.redirect(
    request.url.replace('http://', 'https://'),
    301
  );
}
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/tamylaa/clodo-framework.git
cd clodo-framework
npm install
npm run setup:dev
```

### Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run performance tests
npm run test:perf
```

## 📞 Support

- **Documentation**: [docs.clodo.dev](https://docs.clodo.dev)
- **GitHub Issues**: [github.com/tamylaa/clodo-framework/issues](https://github.com/tamylaa/clodo-framework/issues)
- **Discord Community**: [discord.gg/clodo](https://discord.gg/clodo)
- **Email**: support@clodo.dev

## 📈 Roadmap

### Version 2.0 (Current)
- ✅ Multi-domain deployment
- ✅ Security-by-default architecture
- ✅ Service autonomy
- ✅ Domain configuration management

### Version 2.1 (Next)
- 🔄 Advanced caching strategies
- 🔄 GraphQL support
- 🔄 Real-time subscriptions
- 🔄 Enhanced monitoring

### Version 3.0 (Future)
- 📋 Microservices orchestration
- 📋 AI-powered optimization
- 📋 Multi-cloud deployment
- 📋 Advanced analytics

---

Built with ❤️ by the Clodo Framework team