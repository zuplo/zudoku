import path from "path";
import { fileURLToPath } from "url";
import { describe, expect, test, vi } from "vitest";
import { parseSchemaInput } from "../index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("parseSchemaInput", () => {
  test("parses JSON string input", async () => {
    const input = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Test API", version: "1.0.0" },
    });

    const result = await parseSchemaInput(input);
    expect(result).toEqual({
      openapi: "3.0.0",
      info: { title: "Test API", version: "1.0.0" },
    });
  });

  test("parses YAML string input", async () => {
    const input = `
      openapi: 3.0.0
      info:
        title: Test API
        version: 1.0.0
    `;

    const result = await parseSchemaInput(input);
    expect(result).toEqual({
      openapi: "3.0.0",
      info: { title: "Test API", version: "1.0.0" },
    });
  });

  test("parses object input", async () => {
    const input = {
      openapi: "3.0.0",
      info: { title: "Test API", version: "1.0.0" },
    };

    const result = await parseSchemaInput(input);
    expect(result).toEqual(input);
  });

  test("throws on invalid JSON input", async () => {
    const input = "{ invalid json }";

    await expect(parseSchemaInput(input)).rejects.toThrow(
      "Invalid JSON schema",
    );
  });

  test("throws on invalid input type", async () => {
    const input = 123;

    await expect(parseSchemaInput(input)).rejects.toThrow(
      "Unsupported schema input: 123",
    );
  });

  test("parses schema with file references", async () => {
    const input = `
      openapi: 3.0.0
      info:
        title: Test API
        version: 1.0.0
      components:
        schemas:
          User:
            $ref: "./fixtures/user.yaml"
    `;

    const result = await parseSchemaInput(input, __dirname);
    expect(result).toMatchObject({
      openapi: "3.0.0",
      info: { title: "Test API", version: "1.0.0" },
      components: {
        schemas: {
          User: {
            $ref: "./fixtures/user.yaml",
          },
        },
      },
    });
  });

  test("parses schema from URL", async () => {
    const mockSchema = {
      openapi: "3.0.0",
      info: { title: "Test API", version: "1.0.0" },
    };

    // Mock fetch for testing URL-based schemas
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(mockSchema)),
    });

    const result = await parseSchemaInput(
      "https://api.example.com/schema.json",
    );
    expect(result).toEqual(mockSchema);
  });

  test("throws on failed URL fetch", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    await expect(
      parseSchemaInput("https://api.example.com/schema.json"),
    ).rejects.toThrow("Failed to fetch schema");
  });

  test("throws on non-OK URL response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: "Not Found",
    });

    await expect(
      parseSchemaInput("https://api.example.com/schema.json"),
    ).rejects.toThrow("Failed to fetch schema: Not Found");
  });
});
