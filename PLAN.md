# SSR Production Readiness Plan

## Critical Issues to Fix Before Production

This document outlines 5 critical issues discovered in the SSR implementation that will cause failures under production load.

---

## Issue 1: JWKS Fetched on Every Request (HIGH PRIORITY)

### Problem
`validateJWTWithJWKS()` fetches `/.well-known/openid-configuration` and creates a new JWKS instance on every request, causing:
- Rate limiting from auth providers (Auth0 limit: ~600 req/min)
- 100-200ms added latency per request
- Potential service degradation under load

### Solution
Implement in-memory JWKS caching with TTL.

**Implementation**:
```typescript
// jwt-validation.ts
const jwksCache = new Map<string, { jwks: jose.RemoteJWKSet; expiry: number }>();
const JWKS_CACHE_TTL = 3600000; // 1 hour in ms

async function getJWKS(issuer: string): Promise<jose.RemoteJWKSet> {
  const cached = jwksCache.get(issuer);
  if (cached && Date.now() < cached.expiry) {
    return cached.jwks;
  }

  const wellKnown = await fetch(`${issuer}/.well-known/openid-configuration`);
  const config = await wellKnown.json();
  const jwks = jose.createRemoteJWKSet(new URL(config.jwks_uri));

  jwksCache.set(issuer, { jwks, expiry: Date.now() + JWKS_CACHE_TTL });
  return jwks;
}
```

**Files to Modify**:
- `packages/zudoku/src/lib/auth/jwt-validation.ts`

**Complexity**: Low
**Impact**: High (prevents rate limiting)
**Estimated Time**: 2 hours

---

## Issue 3: Clerk Cookie Extraction Bug (HIGH PRIORITY)

### Problem
```typescript
req.cookies?.__clerk_db_jwt[0]  // Tries to access array index on string
```

This breaks Clerk cookie authentication in development mode.

### Solution
Fix array access bug.

**Implementation**:
```typescript
// jwt-validation.ts
case "clerk": {
  // __session is production cookie
  // __clerk_db_jwt is development cookie (it's a string, not array!)
  return req.cookies?.__session || req.cookies?.__clerk_db_jwt || null;
}
```

**Test Case**:
```typescript
// Add test in jwt-validation.test.ts
it('should extract Clerk development cookie correctly', () => {
  const req = {
    cookies: { __clerk_db_jwt: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...' },
    headers: {}
  };
  const token = extractToken(req, clerkConfig);
  expect(token).toBe('eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...');
});
```

**Files to Modify**:
- `packages/zudoku/src/lib/auth/jwt-validation.ts`

**Complexity**: Trivial
**Impact**: High (broken feature)
**Estimated Time**: 15 minutes

---

## Issue 4: API Calls on Every Request (MEDIUM PRIORITY)

### Problem
- Clerk: 2 API calls per request (verify + getUser)
- Supabase: 1 API call per request (getUser)
- No caching = slow responses + high costs

### Solution
Implement validation result caching.

**Implementation**:
```typescript
// jwt-validation.ts
import { createHash } from 'crypto';

const validationCache = new Map<string, { result: AuthState; expiry: number }>();
const VALIDATION_CACHE_TTL = 300000; // 5 minutes

function getTokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function validateToken(
  token: string,
  config: ZudokuConfig,
): Promise<AuthState | null> {
  // Check cache first
  const tokenHash = getTokenHash(token);
  const cached = validationCache.get(tokenHash);

  if (cached && Date.now() < cached.expiry) {
    return cached.result;
  }

  // Validate token (existing code)
  const result = await validateTokenUncached(token, config);

  // Cache successful validations
  if (result?.isLoggedIn) {
    validationCache.set(tokenHash, {
      result,
      expiry: Date.now() + VALIDATION_CACHE_TTL
    });
  }

  return result;
}
```

**Considerations**:
- Cache TTL should be shorter than JWT expiration
- Clear cache entry on logout (if implementing logout endpoint)
- Monitor cache size (implement LRU eviction if needed)

**Files to Modify**:
- `packages/zudoku/src/lib/auth/jwt-validation.ts`

**Complexity**: Medium
**Impact**: High (performance + cost)
**Estimated Time**: 3 hours
---
