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
});
