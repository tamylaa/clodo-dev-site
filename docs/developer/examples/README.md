# Clodo Framework Examples

This directory contains practical examples showing how to use Clodo Framework for common SaaS application patterns.

## 📁 Examples Index

### Basic Examples
- [Hello World](./hello-world/) - Basic service setup
- [Static Site](./static-site/) - Serving static content
- [API Routes](./api-routes/) - REST API implementation

### Intermediate Examples
- [Authentication](./authentication/) - User auth with JWT
- [Database Integration](./database/) - D1 database usage
- [Multi-Tenant](./multi-tenant/) - Tenant isolation

### Advanced Examples
- [Real-time Chat](./realtime-chat/) - WebSocket implementation
- [File Upload](./file-upload/) - File handling and storage
- [Payment Integration](./payments/) - Stripe payment processing

## 🚀 Running Examples

Each example includes:

1. **Setup instructions** in README.md
2. **Complete source code**
3. **Deployment configuration**
4. **Testing commands**

### Quick Start

```bash
# Clone example
git clone https://github.com/tamylaa/clodo-framework.git
cd clodo-framework/examples/hello-world

# Install dependencies
npm install

# Run locally
npm run dev

# Deploy to Cloudflare
npm run deploy
```

## 📖 Example: Hello World

The simplest Clodo Framework application:

```javascript
// index.js
const clodo = require('clodo-framework');

clodo.service('hello', async (request, env) => {
  return new Response('Hello from Clodo Framework!', {
    headers: { 'Content-Type': 'text/plain' }
  });
});

// domain.config.js
module.exports = {
  name: 'hello-world',
  services: {
    hello: {
      routes: ['/*']
    }
  }
};
```

**Features demonstrated:**
- Basic service registration
- Route handling
- Response formatting
- Domain configuration

## 🔐 Example: Authentication Service

Complete authentication system:

```javascript
// services/auth.js
const clodo = require('clodo-framework');

clodo.service('auth', async (request, env) => {
  const url = new URL(request.url);

  switch (url.pathname) {
    case '/login':
      return handleLogin(request, env);
    case '/register':
      return handleRegister(request, env);
    case '/verify':
      return handleVerify(request, env);
    default:
      return new Response('Auth endpoint not found', { status: 404 });
  }
});

async function handleLogin(request, env) {
  const { email, password } = await request.json();

  // Validate credentials against D1 database
  const user = await env.DB.prepare(
    'SELECT * FROM users WHERE email = ?'
  ).bind(email).first();

  if (!user || !verifyPassword(password, user.password_hash)) {
    return new Response(JSON.stringify({
      error: 'Invalid credentials'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Generate JWT token
  const token = clodo.auth.generateToken({
    userId: user.id,
    email: user.email
  });

  return new Response(JSON.stringify({ token }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

**Features demonstrated:**
- JWT token generation
- D1 database integration
- Password hashing/verification
- Error handling
- JSON API responses

## 🏢 Example: Multi-Tenant SaaS

Enterprise multi-tenant application:

```javascript
// domain.config.js
module.exports = {
  name: 'multi-tenant-saas',
  isolation: 'database', // database, schema, or prefix
  services: {
    tenant: {
      routes: ['/tenant/*'],
      middleware: ['auth', 'tenant-context']
    },
    admin: {
      routes: ['/admin/*'],
      middleware: ['auth', 'admin-only']
    }
  },
  tenants: {
    template: 'tenant-template',
    onboarding: {
      autoDeploy: true,
      defaultPlan: 'starter'
    }
  }
};

// middleware/tenant-context.js
const tenantMiddleware = async (request, env) => {
  // Extract tenant from subdomain or header
  const host = request.headers.get('host');
  const tenantId = extractTenantFromHost(host);

  if (!tenantId) {
    return new Response('Tenant not found', { status: 404 });
  }

  // Add tenant context to request
  request.tenant = {
    id: tenantId,
    database: `tenant_${tenantId}`,
    config: await getTenantConfig(tenantId)
  };

  return request;
};
```

**Features demonstrated:**
- Tenant isolation strategies
- Middleware implementation
- Dynamic database routing
- Automated tenant provisioning

## 💳 Example: Payment Integration

Stripe payment processing:

```javascript
// services/payments.js
const clodo = require('clodo-framework');
const stripe = require('stripe')(env.STRIPE_SECRET_KEY);

clodo.service('payments', async (request, env) => {
  const url = new URL(request.url);

  switch (url.pathname) {
    case '/create-session':
      return createCheckoutSession(request, env);
    case '/webhook':
      return handleWebhook(request, env);
    case '/subscription':
      return manageSubscription(request, env);
    default:
      return new Response('Payment endpoint not found', { status: 404 });
  }
});

async function createCheckoutSession(request, env) {
  const { priceId, userId } = await request.json();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price: priceId,
      quantity: 1,
    }],
    mode: 'subscription',
    success_url: `${env.APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.APP_URL}/cancel`,
    metadata: {
      userId: userId
    }
  });

  return new Response(JSON.stringify({
    sessionId: session.id,
    url: session.url
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

**Features demonstrated:**
- Third-party API integration
- Webhook handling
- Secure payment processing
- Subscription management

## 📊 Example: Real-time Dashboard

WebSocket-based real-time updates:

```javascript
// services/dashboard.js
const clodo = require('clodo-framework');

clodo.service('dashboard', async (request, env) => {
  if (request.headers.get('upgrade') === 'websocket') {
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 });
    }

    const webSocketPair = new WebSocketPair();
    const client = webSocketPair[0];
    const server = webSocketPair[1];

    server.accept();

    // Handle real-time data streaming
    server.addEventListener('message', async (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'subscribe':
          // Subscribe to real-time metrics
          subscribeToMetrics(server, data.metric);
          break;
        case 'unsubscribe':
          // Unsubscribe from metrics
          unsubscribeFromMetrics(server, data.metric);
          break;
      }
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  // Regular HTTP request - serve dashboard HTML
  return new Response(dashboardHTML, {
    headers: { 'Content-Type': 'text/html' }
  });
});
```

**Features demonstrated:**
- WebSocket implementation
- Real-time data streaming
- Connection management
- Fallback for non-WebSocket clients

## 🧪 Testing Examples

Each example includes comprehensive tests:

```javascript
// __tests__/auth.test.js
const { createRequest, createEnv } = require('clodo-framework/test-utils');

describe('Authentication Service', () => {
  test('successful login returns JWT token', async () => {
    const request = createRequest('/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'user@example.com',
        password: 'password123'
      })
    });

    const env = createEnv({
      DB: mockDatabase,
      JWT_SECRET: 'test-secret'
    });

    const response = await handleLogin(request, env);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('token');
  });

  test('invalid credentials return 401', async () => {
    const request = createRequest('/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'user@example.com',
        password: 'wrongpassword'
      })
    });

    const response = await handleLogin(request, createEnv());
    expect(response.status).toBe(401);
  });
});
```

## 🚀 Deployment

All examples include deployment configurations:

```javascript
// deploy.config.js
module.exports = {
  name: 'example-app',
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  routes: {
    'example-app.com': '/*'
  },
  env: {
    production: {
      vars: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info'
      }
    },
    staging: {
      vars: {
        NODE_ENV: 'staging',
        LOG_LEVEL: 'debug'
      }
    }
  }
};
```

Deploy with:

```bash
# Deploy to production
npx clodo deploy --env production

# Deploy to staging
npx clodo deploy --env staging
```

## 📚 Learning Path

Start with basics and progress to advanced:

1. **Beginner**: Hello World → Static Site → API Routes
2. **Intermediate**: Authentication → Database → Multi-Tenant
3. **Advanced**: Real-time Chat → Payments → Custom Middleware

Each example builds on previous concepts and includes detailed explanations.