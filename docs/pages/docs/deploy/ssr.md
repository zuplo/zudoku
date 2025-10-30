---
title: Server Side
zuplo: false
---

# Server-Side Rendering

SSR mode validates authentication on the server before rendering pages. Use this when your docs
contain sensitive information.

**The problem with static sites**: All HTML is pre-generated and accessible to anyone. Client-side
auth can be bypassed by directly accessing files.

**The SSR solution**: Pages are rendered on-demand after validating JWT tokens on the server.
Unauthorized users get a 401, not your docs.

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

In `zudoku.config.tsx`:

```typescript
import type { ZudokuConfig } from "zudoku";

export default {
  authentication: {
    type: "openid",
    clientId: "your-client-id",
    issuer: "https://your-auth-server.com",
  },
  protectedRoutes: ["/docs/*"],
};
```

### 3. Build and Run

```bash
npm run build
node server.js
```

## Auth Providers

### OpenID / Auth0 / Azure B2C

No additional setup needed. Uses public JWKS endpoints for JWT validation.

```typescript
export default {
  authentication: {
    type: "openid", // or "auth0" or "azureb2c"
    clientId: "your-client-id",
    issuer: "https://your-issuer.com",
  },
  protectedRoutes: ["/docs/*"],
};
```

### Clerk

Install the server SDK:

```bash
npm install @clerk/backend
```

Set your secret key:

```bash
export CLERK_SECRET_KEY="sk_test_..."
```

Configure:

```typescript
export default {
  authentication: {
    type: "clerk",
    clerkPubKey: "pk_test_...",
  },
  protectedRoutes: ["/docs/*"],
};
```

### Supabase

Install the client SDK:

```bash
npm install @supabase/supabase-js
```

Configure:

```typescript
export default {
  authentication: {
    type: "supabase",
    supabaseUrl: "https://your-project.supabase.co",
    supabaseKey: "your-anon-key",
    provider: "google",
  },
  protectedRoutes: ["/docs/*"],
};
```

## Protected Routes

### Simple Protection

```typescript
protectedRoutes: ["/docs/*", "/api/*"];
```

### Custom Authorization

```typescript
protectedRoutes: {
  "/docs/internal/*": true,
  "/docs/partner/*": ({ auth }) => {
    return auth.profile?.email?.endsWith("@partner.com");
  },
  "/api/admin/*": ({ auth }) => {
    return auth.profile?.role === "admin";
  },
}
```

Callbacks receive:

- `auth.isLoggedIn`: boolean
- `auth.profile`: JWT claims (sub, email, etc.)
- `context.pathname`: current path

## Deployment

### Docker

```dockerfile
FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist
COPY server.js ./

EXPOSE 3001
CMD ["node", "server.js"]
```

### Node.js

Deploy these files:

- `dist/` - built assets
- `server.js` - server entry point
- `package.json` + `node_modules/`

Start with:

```bash
PORT=8080 node server.js
```

### nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name docs.example.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header Authorization $http_authorization;
    }
}
```

## Environment Variables

```bash
PORT=3001                          # Server port
HOST=0.0.0.0                       # Bind address
CLERK_SECRET_KEY=sk_test_...      # For Clerk (required)
NODE_ENV=production                # Environment
```

## Custom Server

For advanced use cases, create your own server:

```typescript
import { createSSRServer } from "zudoku/vite";

async function main() {
  const app = await createSSRServer({
    dir: process.cwd(),
  });

  // Add custom middleware
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.listen(3001, () => {
    console.log("Server running on port 3001");
  });
}

main();
```

## Authentication Flow

1. User requests `/docs/private`
2. Server extracts JWT from `Authorization: Bearer <token>` header or auth cookies
3. Server validates JWT against provider's JWKS endpoint
4. If valid: render page and return HTML
5. If invalid: return 401 Unauthorized

Cookies are automatically extracted for Clerk, Auth0, and Supabase sessions.

## Troubleshooting

### 401 Errors with Valid Tokens

Check:

- `issuer` URL is correct
- Token is in `Authorization: Bearer <token>` format
- Provider's JWKS endpoint is accessible from your server
- `audience` claim matches your config

Test token manually:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/docs
```

### Server Won't Start

- Run `npm run build` with SSR enabled
- Check `dist/` directory exists
- Verify port 3001 is available
- Install required provider SDKs (@clerk/backend, @supabase/supabase-js)

### Missing Dependencies

```bash
# For Clerk
npm install @clerk/backend

# For Supabase
npm install @supabase/supabase-js

# Core dependencies (installed automatically)
npm install cookie-parser jose express
```

## When to Use SSR

**Use SSR if**:

- Docs contain internal/sensitive API information
- You need server-side access control
- Authentication is required before viewing any content

**Use static mode if**:

- Docs are public
- Performance is critical (SSR is fast, static is faster)
- You want to deploy to static hosts (Vercel, Netlify, S3)

Static mode is still recommended for public APIs. SSR is for when security matters more than
simplicity.
