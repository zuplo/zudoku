---
title: Server Side
zuplo: false
---

## Quick Start

### 1. Enable SSR

In `zudoku.build.ts`:

```typescript
import type { BuildConfig } from "zudoku";

export default {
  ssr: {
    enabled: true,
    port: 3001, // Default: 3001 (avoids conflict with dev server)
  },
};
```

### 2. Configure Auth

- Set up [authentication](./configuration/authentication.md)

### 3. Build and Run

```bash
npm run build
node server.js
```

## Auth Providers

### OpenID / Auth0 / Azure B2C

No additional setup needed. Uses public JWKS endpoints for JWT validation.


### Clerk

Install the server SDK:

```bash
npm install @clerk/backend
```

Set your secret key:

```bash
export CLERK_SECRET_KEY="sk_test_..."
```


### Supabase

Install the client SDK:

```bash
npm install @supabase/supabase-js
```

## Authentication Flow Example

1. User requests `/docs/private`
2. Server extracts JWT from `Authorization: Bearer <token>` header or auth cookies
3. Server validates JWT against provider's JWKS endpoint
4. If valid: render page and return HTML
5. If invalid: return 401 Unauthorized

Cookies are automatically extracted for Clerk, Auth0, and Supabase sessions.
