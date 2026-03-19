import { expect, test } from "../fixtures/base.js";

test.describe("Error Pages", () => {
  test("unknown routes return 404 status", async ({ request }) => {
    const response = await request.get("/this-page-does-not-exist-12345");
    expect(response.status()).toBe(404);
  });

  test("prerendered 404.html page exists and has content", async ({
    request,
  }) => {
    const response = await request.get("/404.html");
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    expect(body.length).toBeGreaterThan(100);
    expect(body).toContain("html");
  });

  test("prerendered 400.html page exists", async ({ request }) => {
    const response = await request.get("/400.html");
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    expect(body).toContain("html");
  });

  test("prerendered 500.html page exists", async ({ request }) => {
    const response = await request.get("/500.html");
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    expect(body).toContain("html");
  });

  test("multiple unknown routes all return 404", async ({ request }) => {
    const paths = [
      "/nonexistent-page",
      "/foo/bar/baz",
      "/api-shipments/nonexistent-operation",
    ];
    for (const path of paths) {
      const response = await request.get(path);
      expect(response.status()).toBe(404);
    }
  });
});
