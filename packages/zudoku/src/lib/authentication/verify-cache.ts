import QuickLRU from "quick-lru";

// Cache verifier calls to prevent high-volume requests from overloading the identity provider.
// 60s TTL means revoked tokens are rejected within a minute; the 1h cookie is the max window.
const cache = new QuickLRU<string, unknown>({
  maxSize: 1000,
  maxAge: 60_000,
});

const hash = async (token: string) => {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return Array.from(new Uint8Array(buf), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
};

export const clearVerifyCache = () => cache.clear();

export const cachedVerifyAccessToken = async <T>(
  verify: (token: string) => Promise<T>,
  token: string,
): Promise<T> => {
  const key = await hash(token);
  if (cache.has(key)) return cache.get(key) as T;
  const result = await verify(token);
  cache.set(key, result);

  return result;
};
