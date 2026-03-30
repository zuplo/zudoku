import { describe, expect, it } from "vitest";
import type { Header, PlaygroundForm, QueryParam } from "./Playground.js";

// Extracted from Playground.tsx defaultValues initialization (lines 182-206)
const initQueryParams = (
  queryParams: QueryParam[],
): PlaygroundForm["queryParams"] =>
  queryParams.length > 0
    ? queryParams.map((param) => ({
        name: param.name,
        value: param.defaultValue ?? "",
        active: param.defaultActive ?? false,
        enum: param.enum ?? [],
        type: param.type,
        style: param.style,
        explode: param.explode,
        allowReserved: param.allowReserved,
      }))
    : [{ name: "", value: "", active: false, enum: [] }];

const initHeaders = (headers: Header[]): PlaygroundForm["headers"] =>
  headers.length > 0
    ? headers.map((header) => ({
        name: header.name,
        value: header.defaultValue ?? "",
        active: header.defaultActive ?? false,
      }))
    : [{ name: "", value: "", active: false }];

// Extracted from Playground.tsx mutationFn (line 264)
const resolveBody = (method: string, body: string | undefined): string | null =>
  ["GET", "HEAD"].includes(method.toUpperCase()) ? null : (body ?? null);

describe("Playground form initialization", () => {
  describe("query param defaultActive", () => {
    it("required params start as active (checked)", () => {
      const params = initQueryParams([
        { name: "required_param", isRequired: true, defaultActive: true },
        { name: "optional_param", isRequired: false, defaultActive: false },
      ]);

      expect(params[0]?.active).toBe(true);
      expect(params[1]?.active).toBe(false);
    });

    it("params without defaultActive default to unchecked", () => {
      const params = initQueryParams([{ name: "param" }]);

      expect(params[0]?.active).toBe(false);
    });

    it("empty query params produces single empty row", () => {
      const params = initQueryParams([]);

      expect(params).toHaveLength(1);
      expect(params[0]).toEqual({
        name: "",
        value: "",
        active: false,
        enum: [],
      });
    });

    it("defaultValue is used when provided", () => {
      const params = initQueryParams([
        { name: "limit", defaultValue: "10", defaultActive: true },
      ]);

      expect(params[0]?.value).toBe("10");
      expect(params[0]?.active).toBe(true);
    });

    it("preserves style, explode, and allowReserved", () => {
      const params = initQueryParams([
        {
          name: "ids",
          style: "form",
          explode: true,
          allowReserved: false,
        },
      ]);

      expect(params[0]?.style).toBe("form");
      expect(params[0]?.explode).toBe(true);
      expect(params[0]?.allowReserved).toBe(false);
    });
  });

  describe("header defaultActive", () => {
    it("required headers start as active", () => {
      const headers = initHeaders([
        { name: "Authorization", defaultActive: true, isRequired: true },
        { name: "X-Custom", defaultActive: false },
      ]);

      expect(headers[0]?.active).toBe(true);
      expect(headers[1]?.active).toBe(false);
    });

    it("empty headers produces single empty row", () => {
      const headers = initHeaders([]);

      expect(headers).toHaveLength(1);
      expect(headers[0]).toEqual({ name: "", value: "", active: false });
    });
  });
});

describe("GET/HEAD body handling", () => {
  it("strips body for GET requests", () => {
    expect(resolveBody("GET", "some body")).toBeNull();
  });

  it("strips body for HEAD requests", () => {
    expect(resolveBody("HEAD", "some body")).toBeNull();
  });

  it("strips body for case-insensitive GET", () => {
    expect(resolveBody("get", "body")).toBeNull();
  });

  it("keeps body for POST requests", () => {
    expect(resolveBody("POST", '{"key":"value"}')).toBe('{"key":"value"}');
  });

  it("keeps body for PUT requests", () => {
    expect(resolveBody("PUT", "data")).toBe("data");
  });

  it("keeps body for PATCH requests", () => {
    expect(resolveBody("PATCH", "data")).toBe("data");
  });

  it("keeps body for DELETE requests", () => {
    expect(resolveBody("DELETE", "data")).toBe("data");
  });

  it("returns null for POST with undefined body", () => {
    expect(resolveBody("POST", undefined)).toBeNull();
  });
});
