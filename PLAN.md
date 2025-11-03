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

## Issue 2: Revoked Tokens Still Work (HIGH PRIORITY)

### Problem
No token revocation checking. Users removed from auth provider can still access docs until JWT expires (could be hours).

### Solution Options

**Option A: Short JWT Expiration (Quick Fix)**
- Document that users should set JWT expiration to 15 minutes max
- Add validation to warn if tokens have >1 hour expiration
- Trade-off: More frequent re-authentication

**Option B: Token Introspection (Proper Fix)**
- Add introspection endpoint calls for providers that support it
- Cache introspection results (5 min TTL)
- Clerk has `/v1/tokens/verify`, Auth0 has introspection endpoint

**Recommendation**: Start with Option A, implement Option B in Phase 2.

**Implementation (Option A)**:
```typescript
// jwt-validation.ts
async function validateJWTWithJWKS(...) {
  const { payload } = await jose.jwtVerify(token, jwks, { issuer, audience });

  // Check expiration time
  if (payload.exp) {
    const expiresIn = payload.exp - Math.floor(Date.now() / 1000);
    if (expiresIn > 3600) { // More than 1 hour
      console.warn(
        `JWT expires in ${expiresIn}s (>1 hour). ` +
        `For security, configure your auth provider to use shorter expiration times.`
      );
    }
  }

  return { isLoggedIn: true, profile: { ... } };
}
```

**Files to Modify**:
- `packages/zudoku/src/lib/auth/jwt-validation.ts`
- `docs/pages/docs/deploy/ssr.md` (add security best practices section)

**Complexity**: Low (Option A), Medium (Option B)
**Impact**: High (security)
**Estimated Time**: 1 hour (Option A), 8 hours (Option B)

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

## Issue 5: No Timeout on Authorization Callbacks (MEDIUM PRIORITY)

### Problem
User-provided authorization callbacks can hang indefinitely, blocking requests.

### Solution
Implement timeout wrapper for callback execution.

**Implementation**:
```typescript
// ssr-server.ts
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
}

async function checkRouteProtection(
  pathname: string,
  config: ZudokuConfig,
  authState: AuthState | null,
): Promise<{ isProtected: boolean; isAuthorized: boolean }> {
  // ... existing code ...

  if (typeof handler === "function") {
    const context = { auth, context: { pathname } };

    try {
      const authorized = await withTimeout(
        Promise.resolve(handler(context)),
        2000, // 2 second timeout
        `Authorization callback timeout for route: ${route}`
      );
      return { isProtected: true, isAuthorized: authorized === true };
    } catch (error) {
      console.error('Authorization callback error:', error);
      // Fail closed: deny access on callback error
      return { isProtected: true, isAuthorized: false };
    }
  }
}
```

**Documentation Update**:
Add to `ssr.md`:
```markdown
### Authorization Callback Constraints

- Must complete within 2 seconds
- Should not make slow database queries
- Should not call external APIs
- Consider caching authorization decisions

Good:
```typescript
protectedRoutes: {
  "/admin/*": ({ auth }) => auth.profile?.role === "admin"
}
```

Bad:
```typescript
protectedRoutes: {
  "/admin/*": async ({ auth }) => {
    // DON'T DO THIS - slow DB call
    const user = await db.users.findOne({ id: auth.profile.sub });
    return user.isAdmin;
  }
}
```
```

**Files to Modify**:
- `packages/zudoku/src/vite/ssr-server.ts`
- `docs/pages/docs/deploy/ssr.md`

**Complexity**: Low
**Impact**: Medium (prevents hangs)
**Estimated Time**: 2 hours

---

## Additional Improvements (Lower Priority)

### Issue 6: Supabase Cookie Parsing Assumptions
Add error handling for malformed cookies:
```typescript
try {
  const parsed = JSON.parse(cookies[supabaseCookie]);
  return parsed.access_token || null;
} catch (error) {
  console.warn('Failed to parse Supabase cookie:', error);
  return null;
}
```

### Issue 7: Structured Logging
Replace `console.error()` with structured logging:
- Add request ID middleware
- Include user context in logs
- Use proper log levels (info, warn, error)
- Consider integration with logging services (DataDog, Sentry)

### Issue 8: Static Assets Security Review
Audit static files for sensitive content:
- Review source map exposure
- Check for debug files
- Consider serving source maps only to authenticated users

---

## Implementation Plan

### Phase 1: Critical Fixes (Before PR Merge)
**Goal**: Make feature production-safe

1. ✅ Fix Clerk cookie bug (#3) - 15 min
2. ✅ Add JWKS caching (#1) - 2 hours
3. ✅ Add validation result caching (#4) - 3 hours
4. ✅ Add callback timeout (#5) - 2 hours
5. ✅ Add JWT expiration warning (#2 Option A) - 1 hour

**Total**: 1 day of work

### Phase 2: Security Hardening (Post-Merge)
**Goal**: Enterprise-ready security

1. Token introspection (#2 Option B) - 8 hours
2. Structured logging (#7) - 4 hours
3. Cache eviction strategy - 2 hours
4. Load testing - 4 hours

**Total**: 2-3 days of work

### Phase 3: Optimizations (Future)
**Goal**: Scale to high traffic

1. Redis-based caching (replace in-memory)
2. Session management
3. Rate limiting per user
4. Metrics and monitoring

---

## Testing Strategy

### Unit Tests Needed
- `jwt-validation.ts`: Cache hit/miss scenarios
- `jwt-validation.ts`: Each provider's cookie extraction
- `ssr-server.ts`: Callback timeout enforcement
- `ssr-server.ts`: Protected route matching

### Integration Tests Needed
- Full auth flow for each provider
- Token expiration handling
- Revoked token behavior (manual test)
- Concurrent request handling

### Load Tests Needed
- 100 req/sec sustained for 5 minutes
- Verify no rate limiting from auth providers
- Verify cache hit rate >90%
- Verify response times <200ms

---

## Deployment Checklist

Before deploying to production:

- [ ] All Phase 1 fixes implemented
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Load tests completed
- [ ] Documentation updated
- [ ] JWT expiration configured to <15 minutes
- [ ] Monitoring configured (response times, error rates)
- [ ] Alert thresholds set
- [ ] Rollback plan documented

---

## Monitoring & Alerts

### Metrics to Track
- JWT validation cache hit rate
- JWKS cache hit rate
- Authorization callback execution time
- Failed authentication rate
- 401/403 response rate

### Alerts to Configure
- Auth provider API errors >1% of requests
- Average response time >500ms
- JWKS cache miss rate >10%
- Authorization callback timeouts >5 per hour

---

## Questions for Review

1. **Caching Strategy**: Should we use Redis instead of in-memory caching for multi-instance deployments?
2. **Token Revocation**: Is Option A (short expiration) acceptable, or should we implement introspection in Phase 1?
3. **Callback Timeout**: Is 2 seconds appropriate, or should this be configurable?
4. **Error Handling**: Should failed authorization callbacks fail open (allow access) or fail closed (deny access)?

---

## Success Criteria

The SSR feature is production-ready when:

1. ✅ Handles 1000 req/min without rate limiting
2. ✅ 95th percentile response time <300ms
3. ✅ No security vulnerabilities in auth flow
4. ✅ Zero unhandled promise rejections
5. ✅ Cache hit rate >90% for repeated requests
6. ✅ All critical issues resolved
7. ✅ Load tests passing
8. ✅ Documentation complete

---

## Timeline

- **Week 1**: Implement Phase 1 fixes
- **Week 2**: Testing and bug fixes
- **Week 3**: Phase 2 security hardening
- **Week 4**: Load testing and production deployment

**Target Production Date**: 4 weeks from start
