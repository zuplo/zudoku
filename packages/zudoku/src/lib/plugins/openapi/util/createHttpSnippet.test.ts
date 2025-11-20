import { describe, expect, it } from "vitest";
import { getConverted } from "./createHttpSnippet.js";

describe("getConverted", () => {
  it("should decode URL-encoded curly braces in server URLs", () => {
    // Mock HTTPSnippet that returns URL-encoded output
    const mockSnippet = {
      convert: () => [
        "curl --request GET \\\n  --url https://api.%7Bregion%7D.example.com/v1/users",
      ],
    };

    // biome-ignore lint/suspicious/noExplicitAny: Mock object for testing
    const result = getConverted(mockSnippet as any, "shell");

    // The curly braces should be decoded
    expect(result).toContain("https://api.{region}.example.com");
    expect(result).not.toContain("%7B");
    expect(result).not.toContain("%7D");
  });

  it("should handle multiple URL-encoded curly braces", () => {
    const mockSnippet = {
      convert: () => [
        "curl --request GET \\\n  --url https://%7Benv%7D.%7Bregion%7D.example.com/api",
      ],
    };

    // biome-ignore lint/suspicious/noExplicitAny: Mock object for testing
    const result = getConverted(mockSnippet as any, "shell");

    expect(result).toContain("https://{env}.{region}.example.com");
    expect(result).not.toContain("%7B");
    expect(result).not.toContain("%7D");
  });

  it("should preserve other URL encoding", () => {
    // Other URL encoding like %20 for spaces should be preserved
    const mockSnippet = {
      convert: () => [
        "curl --request GET \\\n  --url https://api.{region}.example.com/api?query=hello%20world",
      ],
    };

    // biome-ignore lint/suspicious/noExplicitAny: Mock object for testing
    const result = getConverted(mockSnippet as any, "shell");

    // Curly braces should remain
    expect(result).toContain("{region}");
    // Other encoding should be preserved
    expect(result).toContain("hello%20world");
  });
});
