---
title: "Workers Authentication Guide"
description: "Comprehensive guide to authentication for Cloudflare Workers: Basic auth, JWT, OAuth flows, Cloudflare Access, and best practices."
date: 2025-12-24
---

# Workers Authentication Guide

This guide covers common authentication strategies for Cloudflare Workers with code examples and security recommendations.

## Quick overview
- Basic Auth for simple endpoints (not for production)
- Pre-shared header keys for internal services
- JWT for stateless APIs
- OAuth for delegated auth flows
- Cloudflare Access and Turnstile integration for user-facing flows

## JWT example
```js
// Validate a JWT using jose
import { jwtVerify } from 'jose';
export default {
  async fetch(request, env) {
    const auth = request.headers.get('Authorization');
    if (!auth) return new Response('Unauthorized', { status: 401 });
    const token = auth.split(' ')[1];
    try {
      const { payload } = await jwtVerify(token, env.JWT_KEY);
      return new Response(JSON.stringify({ user: payload }), { status: 200 });
    } catch (err) {
      return new Response('Invalid token', { status: 401 });
    }
  }
};
```

## OAuth flow (high level)
- Redirect user to provider's auth endpoint
- Exchange code for token on callback (server-side token exchange recommended)
- Store token in encrypted cookie (HttpOnly, Secure) or session store (D1 or KV) and use short lived access tokens

## Cloudflare Access & Turnstile
- When to prefer Access for enterprise SSO (SAML/OIDC) for protected dashboards
- Using Turnstile for bot protection on login forms; validate server-side tokens

## Best Practices
- Use short-lived access tokens and rotate refresh tokens when possible.  
- Validate tokens in Workers using crypto libraries and reject early when invalid.  
- Use scoped tokens for least-privilege access to D1 or other resources.

## FAQ
- "Should I store session tokens in D1?" → Short-lived tokens stored in D1 are acceptable for server-side sessions, but prefer KV for quick lookups and D1 when relational session state is needed.  
- "How do I validate JWTs?" → Use `jose` or `crypto.subtle` to validate signature and claims, and check expiry (`exp`).

## JSON-LD QAPage
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "QAPage",
  "mainEntity": {
    "@type": "Question",
    "name": "How do I implement authentication for Cloudflare Workers?",
    "text": "Which authentication options (JWT, OAuth, Cloudflare Access) should I use with Workers, and how to implement them securely?",
    "answerCount": 2,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Use JWT for stateless APIs, OAuth for delegated user flows, or Cloudflare Access for enterprise SSO; validate tokens server-side and use short-lived tokens. See code examples on this page."
    },
    "suggestedAnswer": [
      {
        "@type": "Answer",
        "text": "Basic Auth is only for simple use-cases and not suitable for production. For user-facing apps prefer OAuth + session management or Cloudflare Access for SSO."
      }
    ]
  }
}
</script>

<!-- TODO: Add Turnstile integration snippet and full OAuth exchange example -->