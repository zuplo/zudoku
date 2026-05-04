import { Hono, type MiddlewareHandler } from "hono";
import { describe, expect, it, vi } from "vitest";
import { protectChunks } from "./protectChunks.js";

const SERVED = "module served";

// A fake serve handler that mirrors how a real adapter would respond.
const fakeServe: MiddlewareHandler = async (c) =>
  c.text(`${SERVED}: ${c.req.path}`, 200);

const buildApp = (basePath?: string) => {
  const app = new Hono();
  app.use(protectChunks({ basePath, serve: fakeServe }));
  app.all("*", (c) => c.text("fall-through", 200));
  return app;
};

describe("protectChunks", () => {
  it("returns 401 for /_protected/* without an auth cookie", async () => {
    const res = await buildApp().request("/_protected/chunk.js");
    expect(res.status).toBe(401);
  });

  it("serves the chunk when a cookie is present", async () => {
    const res = await buildApp().request("/_protected/chunk.js", {
      headers: { cookie: "zudoku-access-token=anything" },
    });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe(`${SERVED}: /_protected/chunk.js`);
  });

  it("passes through non-protected paths to the next handler", async () => {
    const res = await buildApp().request("/assets/foo.js");
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("fall-through");
  });

  it("respects basePath when gating and rewriting", async () => {
    const app = buildApp("/docs");

    const unauth = await app.request("/docs/_protected/chunk.js");
    expect(unauth.status).toBe(401);

    const authed = await app.request("/docs/_protected/chunk.js", {
      headers: { cookie: "zudoku-access-token=anything" },
    });
    expect(await authed.text()).toBe(`${SERVED}: /docs/_protected/chunk.js`);

    // Without basePath the request wouldn't match
    const noMatch = await app.request("/_protected/chunk.js");
    expect(await noMatch.text()).toBe("fall-through");
  });

  it("passes any non-empty cookie when no verifier is configured", async () => {
    const res = await buildApp().request("/_protected/chunk.js", {
      headers: { cookie: "zudoku-access-token=clearly-not-a-real-jwt" },
    });
    expect(res.status).toBe(200);
  });

  it("returns 401 when the auth cookie is present but empty", async () => {
    const res = await buildApp().request("/_protected/chunk.js", {
      headers: { cookie: "zudoku-access-token=" },
    });
    expect(res.status).toBe(401);
  });

  it("does not match a path that lacks the trailing slash after _protected", async () => {
    const res = await buildApp().request("/_protected");
    expect(await res.text()).toBe("fall-through");
  });

  it("does not match case-mismatched prefix", async () => {
    const res = await buildApp().request("/_PROTECTED/chunk.js");
    expect(await res.text()).toBe("fall-through");
  });

  it("falls through for paths that share the prefix but live elsewhere", async () => {
    const res = await buildApp().request("/_protected-public/chunk.js");
    expect(await res.text()).toBe("fall-through");
  });

  it("401 response includes Cache-Control: no-store and Vary: Cookie", async () => {
    const res = await buildApp().request("/_protected/chunk.js");
    expect(res.status).toBe(401);
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    expect(res.headers.get("vary")).toBe("Cookie");
  });

  it("returns 401 when the Cookie header is missing entirely", async () => {
    const res = await buildApp().request("/_protected/chunk.js");
    expect(res.status).toBe(401);
  });

  it("isolates the auth cookie from sibling cookies in the header", async () => {
    const res = await buildApp().request("/_protected/chunk.js", {
      headers: {
        cookie: "theme=dark; zudoku-access-token=token; analytics=1",
      },
    });
    expect(res.status).toBe(200);
  });

  describe("with verifyAccessToken", () => {
    const buildWithVerifier = (verify: (t: string) => Promise<unknown>) => {
      const app = new Hono();
      app.use(
        protectChunks({
          serve: fakeServe,
          verifyAccessToken: verify,
        }),
      );
      app.all("*", (c) => c.text("fall-through", 200));
      return app;
    };

    it("serves when the verifier returns a truthy value", async () => {
      const app = buildWithVerifier(async () => ({ sub: "u1" }));
      const res = await app.request("/_protected/chunk.js", {
        headers: { cookie: "zudoku-access-token=valid" },
      });
      expect(res.status).toBe(200);
    });

    it("401s when the verifier returns falsy (forged cookie)", async () => {
      const app = buildWithVerifier(async () => null);
      const res = await app.request("/_protected/chunk.js", {
        headers: { cookie: "zudoku-access-token=forged" },
      });
      expect(res.status).toBe(401);
    });

    it("fails closed when the verifier throws (JWKS outage, etc.)", async () => {
      const app = buildWithVerifier(async () => {
        throw new Error("jwks fetch failed");
      });
      const res = await app.request("/_protected/chunk.js", {
        headers: { cookie: "zudoku-access-token=whatever" },
      });
      expect(res.status).toBe(401);
    });

    it("short-circuits on missing cookie before calling the verifier", async () => {
      const verify = vi.fn();
      const app = buildWithVerifier(verify);
      const res = await app.request("/_protected/chunk.js");
      expect(res.status).toBe(401);
      expect(verify).not.toHaveBeenCalled();
    });
  });
});
