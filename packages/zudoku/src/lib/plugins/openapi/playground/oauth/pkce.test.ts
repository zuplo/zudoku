import { describe, expect, it } from "vitest";
import { generateCodeChallenge, generateCodeVerifier } from "./pkce.js";

describe("PKCE utilities", () => {
  describe("generateCodeVerifier", () => {
    it("should generate a non-empty string", () => {
      const verifier = generateCodeVerifier();
      expect(verifier).toBeTruthy();
      expect(typeof verifier).toBe("string");
    });

    it("should generate base64url-safe characters only", () => {
      const verifier = generateCodeVerifier();
      expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it("should not contain padding characters", () => {
      const verifier = generateCodeVerifier();
      expect(verifier).not.toContain("=");
    });

    it("should generate unique values", () => {
      const v1 = generateCodeVerifier();
      const v2 = generateCodeVerifier();
      expect(v1).not.toBe(v2);
    });

    it("should generate a verifier of expected length", () => {
      const verifier = generateCodeVerifier();
      // 32 bytes → ~43 base64url chars
      expect(verifier.length).toBeGreaterThanOrEqual(40);
      expect(verifier.length).toBeLessThanOrEqual(50);
    });
  });

  describe("generateCodeChallenge", () => {
    it("should generate a non-empty string", async () => {
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      expect(challenge).toBeTruthy();
      expect(typeof challenge).toBe("string");
    });

    it("should generate base64url-safe characters only", async () => {
      const challenge = await generateCodeChallenge("test-verifier");
      expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it("should not contain padding characters", async () => {
      const challenge = await generateCodeChallenge("test-verifier");
      expect(challenge).not.toContain("=");
    });

    it("should produce the same challenge for the same verifier", async () => {
      const verifier = "deterministic-test-verifier";
      const c1 = await generateCodeChallenge(verifier);
      const c2 = await generateCodeChallenge(verifier);
      expect(c1).toBe(c2);
    });

    it("should produce different challenges for different verifiers", async () => {
      const c1 = await generateCodeChallenge("verifier-one");
      const c2 = await generateCodeChallenge("verifier-two");
      expect(c1).not.toBe(c2);
    });

    it("should produce a SHA-256 sized output", async () => {
      const challenge = await generateCodeChallenge("test");
      // SHA-256 = 32 bytes → ~43 base64url chars
      expect(challenge.length).toBeGreaterThanOrEqual(40);
      expect(challenge.length).toBeLessThanOrEqual(50);
    });
  });
});
