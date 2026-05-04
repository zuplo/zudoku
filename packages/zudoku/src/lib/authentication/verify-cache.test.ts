// @vitest-environment node
import { afterEach, expect, test, vi } from "vitest";
import { cachedVerifyAccessToken, clearVerifyCache } from "./verify-cache.js";

afterEach(() => {
  clearVerifyCache();
});

test("hits the cache for repeat calls with the same token", async () => {
  const verify = vi.fn(async (token: string) => ({ sub: token }));
  const a = await cachedVerifyAccessToken(verify, "tok");
  const b = await cachedVerifyAccessToken(verify, "tok");
  expect(verify).toHaveBeenCalledTimes(1);
  expect(a).toEqual(b);
});

test("calls the verifier per distinct token", async () => {
  const verify = vi.fn(async (token: string) => ({ sub: token }));
  await cachedVerifyAccessToken(verify, "a");
  await cachedVerifyAccessToken(verify, "b");
  expect(verify).toHaveBeenCalledTimes(2);
});

test("caches negative results so junk tokens don't flood the verifier", async () => {
  const verify = vi.fn(async () => undefined);
  await cachedVerifyAccessToken(verify, "junk");
  await cachedVerifyAccessToken(verify, "junk");
  expect(verify).toHaveBeenCalledTimes(1);
});

test("clearVerifyCache forces re-verification", async () => {
  const verify = vi.fn(async (token: string) => ({ sub: token }));
  await cachedVerifyAccessToken(verify, "tok");
  clearVerifyCache();
  await cachedVerifyAccessToken(verify, "tok");
  expect(verify).toHaveBeenCalledTimes(2);
});
