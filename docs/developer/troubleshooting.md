# Troubleshooting Guide

This guide helps you resolve common issues when working with Clodo Framework.

## 🚨 Quick Diagnosis

### Check Framework Status

```bash
# Check framework version
npx clodo --version

# Validate configuration
npx clodo validate domain.config.js

# Check service health
npx clodo health
```

### Common Error Patterns

| Error Message | Likely Cause | Solution |
|---------------|--------------|----------|
| `Service timeout` | Cold start issues | Check resource limits |
| `Database connection failed` | D1 config issues | Verify database binding |
| `Route not found` | Routing misconfiguration | Check domain config |
| `Authentication failed` | Token/secret issues | Validate credentials |

## 🔧 Deployment Issues

### Service Won't Start

**Symptoms:**
- Deployment succeeds but service returns 500 errors
- Logs show "Service initialization failed"

**Solutions:**

1. **Check Environment Variables**
   ```bash
   # Verify all required env vars are set
   echo $CLOUDFLARE_API_TOKEN
   echo $CLOUDFLARE_ACCOUNT_ID
   ```

2. **Validate Domain Configuration**
   ```javascript
   // domain.config.js - common mistakes
   module.exports = {
     name: 'my-app', // Must be unique
     services: {
       api: {
         routes: ['/api/*'], // Must be array
         dependencies: ['database'] // Check service names
       }
     }
   };
   ```

3. **Check Resource Limits**
   ```javascript
   // Increase CPU limits for heavy services
   const service = {
     resources: {
       cpu: '2', // CPU cores
       memory: '256MB' // Memory limit
     }
   };
   ```

### Database Connection Issues

**Symptoms:**
- `D1Error: Database not found`
- `Connection timeout`

**Solutions:**

1. **Verify Database Binding**
   ```javascript
   // wrangler.toml
   [[d1_databases]]
   binding = "DB"
   database_name = "my-database"
   database_id = "your-database-id"
   ```

2. **Check Database Permissions**
   ```bash
   # Test database connection
   npx wrangler d1 execute my-database --command "SELECT 1"
   ```

3. **Validate Connection String**
   ```javascript
   // Correct usage
   const result = await env.DB.prepare(
     'SELECT * FROM users WHERE id = ?'
   ).bind(userId).first();
   ```

### Routing Problems

**Symptoms:**
- 404 errors on valid routes
- Routes working in development but not production

**Solutions:**

1. **Check Route Patterns**
   ```javascript
   // Correct patterns
   routes: [
     '/api/*',     // Matches /api/users, /api/posts
     '/users/:id', // Parameterized route
     '/static/*'   // Static file serving
   ]
   ```

2. **Verify Route Order**
   ```javascript
   // More specific routes first
   routes: [
     '/api/users/:id', // Specific route
     '/api/*',         // Catch-all
   ]
   ```

3. **Check Middleware Conflicts**
   ```javascript
   // Ensure middleware doesn't block routes
   middleware: ['auth', 'cors'], // Order matters
   ```

## 🔐 Security Issues

### Authentication Failures

**Symptoms:**
- JWT tokens rejected
- Login succeeds but API calls fail

**Solutions:**

1. **Verify Token Signing**
   ```javascript
   // Consistent secret across services
   const token = clodo.auth.generateToken(payload, {
     secret: env.JWT_SECRET,
     expiresIn: '1h'
   });
   ```

2. **Check Token Expiration**
   ```javascript
   // Handle expired tokens
   try {
     const user = await clodo.auth.verify(token);
   } catch (error) {
     if (error.name === 'TokenExpiredError') {
       // Refresh token logic
     }
   }
   ```

3. **Validate Token Format**
   ```javascript
   // Ensure Bearer prefix
   const authHeader = request.headers.get('Authorization');
   const token = authHeader.replace('Bearer ', '');
   ```

### CORS Issues

**Symptoms:**
- Browser blocks API requests
- `CORS error` in console

**Solutions:**

1. **Configure CORS Properly**
   ```javascript
   const corsConfig = {
     origins: ['https://myapp.com', 'http://localhost:3000'],
     methods: ['GET', 'POST', 'PUT', 'DELETE'],
     headers: ['Content-Type', 'Authorization'],
     credentials: true
   };
   ```

2. **Check Origin Matching**
   ```javascript
   // Allow all subdomains
   origins: ['https://*.myapp.com']

   // Allow localhost for development
   origins: process.env.NODE_ENV === 'development'
     ? ['http://localhost:*']
     : ['https://myapp.com']
   ```

## ⚡ Performance Issues

### Slow Response Times

**Symptoms:**
- API calls taking >1 second
- High latency in production

**Solutions:**

1. **Implement Caching**
   ```javascript
   // Response caching
   const cache = clodo.cache('responses');
   const key = `api:${request.url}`;

   let response = await cache.get(key);
   if (!response) {
     response = await fetchData();
     await cache.set(key, response, { ttl: 300 });
   }
   ```

2. **Optimize Database Queries**
   ```javascript
   // Use prepared statements
   const stmt = env.DB.prepare(`
     SELECT users.*, profiles.*
     FROM users
     LEFT JOIN profiles ON users.id = profiles.user_id
     WHERE users.active = ?
   `).bind(true);

   const users = await stmt.all();
   ```

3. **Enable Compression**
   ```javascript
   // Automatic response compression
   return new Response(data, {
     headers: {
       'Content-Encoding': 'gzip',
       'Content-Type': 'application/json'
     }
   });
   ```

### Memory Issues

**Symptoms:**
- `Out of memory` errors
- Service restarts frequently

**Solutions:**

1. **Monitor Memory Usage**
   ```javascript
   // Add memory monitoring
   const memUsage = process.memoryUsage();
   console.log(`Memory: ${memUsage.heapUsed / 1024 / 1024}MB`);

   if (memUsage.heapUsed > 128 * 1024 * 1024) { // 128MB
     // Trigger cleanup
     cleanupCache();
   }
   ```

2. **Implement Streaming**
   ```javascript
   // Stream large responses
   const stream = new ReadableStream({
     start(controller) {
       // Stream data in chunks
       largeData.forEach(chunk => {
         controller.enqueue(chunk);
       });
       controller.close();
     }
   });

   return new Response(stream);
   ```

## 🧪 Testing Issues

### Tests Failing in CI

**Symptoms:**
- Tests pass locally but fail in CI
- Environment-specific failures

**Solutions:**

1. **Mock External Dependencies**
   ```javascript
   // Mock database in tests
   const mockDB = {
     prepare: jest.fn(() => ({
       bind: jest.fn(() => ({
         first: jest.fn(() => Promise.resolve(mockUser))
       }))
     }))
   };

   const env = { DB: mockDB };
   ```

2. **Handle Async Operations**
   ```javascript
   test('async operation completes', async () => {
     const result = await myAsyncFunction();
     expect(result).toBeDefined();

     // Wait for all promises to resolve
     await new Promise(resolve => setTimeout(resolve, 100));
   });
   ```

## 📊 Monitoring & Debugging

### Enable Debug Logging

```bash
# Development
DEBUG=clodo:* npm run dev

# Production (use with caution)
DEBUG=clodo:auth,clodo:db npm start
```

### Log Analysis

```javascript
// Structured logging
const logger = clodo.logger('my-service');

logger.info('User login', {
  userId: user.id,
  ip: request.ip,
  userAgent: request.headers.get('User-Agent')
});

logger.error('Database error', {
  error: error.message,
  query: sql,
  params: params
});
```

### Performance Monitoring

```javascript
// Add performance tracking
const start = Date.now();

const result = await expensiveOperation();

const duration = Date.now() - start;
logger.info('Operation completed', {
  duration: `${duration}ms`,
  success: true
});

// Alert on slow operations
if (duration > 1000) {
  clodo.monitor.alert('Slow operation detected', {
    operation: 'expensiveOperation',
    duration
  });
}
```

## 🚨 Emergency Procedures

### Service Down - Immediate Actions

1. **Check Cloudflare Dashboard**
   - View real-time logs
   - Check error rates
   - Monitor resource usage

2. **Rollback Deployment**
   ```bash
   # Quick rollback to previous version
   npx clodo rollback --service my-service
   ```

3. **Scale Resources**
   ```bash
   # Temporarily increase limits
   npx clodo scale my-service --cpu 2 --memory 512MB
   ```

### Data Recovery

1. **Check Backups**
   ```bash
   # List available backups
   npx clodo backups list

   # Restore from backup
   npx clodo backups restore backup-id
   ```

2. **Database Recovery**
   ```bash
   # Export data
   npx wrangler d1 export my-database

   # Import to new database
   npx wrangler d1 import my-database --file backup.sql
   ```

## 📞 Getting Help

### Community Support

- **GitHub Issues**: [github.com/tamylaa/clodo-framework/issues](https://github.com/tamylaa/clodo-framework/issues)
- **Discord**: [discord.gg/clodo](https://discord.gg/clodo)
- **Stack Overflow**: Tag `clodo-framework`

### Enterprise Support

For enterprise customers:

- **Email**: enterprise@clodo.dev
- **Phone**: +1 (555) 123-4567
- **SLA**: 1-hour response time

### Bug Reports

When reporting bugs, include:

```markdown
**Environment:**
- Clodo Framework version: x.x.x
- Node.js version: x.x.x
- Cloudflare Workers runtime: 2023-xx-xx

**Steps to reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected behavior:**
What should happen

**Actual behavior:**
What actually happens

**Error logs:**
```
Error message and stack trace
```

**Additional context:**
Any other relevant information
```

This comprehensive troubleshooting guide should help resolve most issues. If you encounter a problem not covered here, please check the [GitHub issues](https://github.com/tamylaa/clodo-framework/issues) or contact support.