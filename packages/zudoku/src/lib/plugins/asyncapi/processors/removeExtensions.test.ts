import { describe, expect, it } from "vitest";
import type { AsyncAPIDocument } from "../../../asyncapi/types.js";
import { removeExtensions } from "./removeExtensions.js";

// biome-ignore lint/suspicious/noExplicitAny: Test document with extensions
const baseDoc: AsyncAPIDocument = {
  asyncapi: "3.0.0",
  info: {
    title: "Test",
    version: "1.0.0",
    "x-logo": "https://example.com/logo.png",
  } as any,
  "x-internal": true,
  "x-audience": "internal",
  channels: {
    userChannel: {
      address: "/users",
      "x-rate-limit": 100,
    } as any,
  },
  operations: {
    onUserSignup: {
      action: "receive" as const,
      channel: { $ref: "#/channels/userChannel" },
      "x-handler": "handleUserSignup",
    } as any,
  },
};

describe("removeExtensions", () => {
  it("should remove specified extension from root", () => {
    const processed = removeExtensions({
      keys: ["x-internal"],
    })({
      schema: baseDoc,
      file: "/test.json",
      dereference: async (id) => id,
    });

    expect((processed as any)["x-internal"]).toBeUndefined();
    expect((processed as any)["x-audience"]).toBeDefined();
  });

  it("should remove multiple extensions", () => {
    const processed = removeExtensions({
      keys: ["x-internal", "x-audience"],
    })({
      schema: baseDoc,
      file: "/test.json",
      dereference: async (id) => id,
    });

    expect((processed as any)["x-internal"]).toBeUndefined();
    expect((processed as any)["x-audience"]).toBeUndefined();
  });

  it("should remove extensions from nested objects", () => {
    const processed = removeExtensions({
      keys: ["x-logo"],
    })({
      schema: baseDoc,
      file: "/test.json",
      dereference: async (id) => id,
    });

    expect((processed.info as any)["x-logo"]).toBeUndefined();
    expect(processed.info.title).toBeDefined();
  });

  it("should use shouldRemove callback", () => {
    const processed = removeExtensions({
      shouldRemove: (key) => key.startsWith("x-audience"),
    })({
      schema: baseDoc,
      file: "/test.json",
      dereference: async (id) => id,
    });

    expect((processed as any)["x-audience"]).toBeUndefined();
    expect((processed as any)["x-internal"]).toBeDefined();
  });

  it("should remove all x- extensions when keys is undefined", () => {
    const processed = removeExtensions({
      keys: undefined,
    })({
      schema: baseDoc,
      file: "/test.json",
      dereference: async (id) => id,
    });

    // When keys is undefined, all x- extensions are removed
    expect((processed as any)["x-internal"]).toBeUndefined();
    expect((processed as any)["x-audience"]).toBeUndefined();
  });

  it("should keep standard properties", () => {
    const processed = removeExtensions({
      keys: ["x-internal"],
    })({
      schema: baseDoc,
      file: "/test.json",
      dereference: async (id) => id,
    });

    expect(processed.asyncapi).toBe("3.0.0");
    expect(processed.info.title).toBe("Test");
    expect(processed.channels).toBeDefined();
  });

  it("should handle empty options", () => {
    const processed = removeExtensions({})({
      schema: baseDoc,
      file: "/test.json",
      dereference: async (id) => id,
    });

    // Empty options means remove all extensions
    expect((processed as any)["x-internal"]).toBeUndefined();
    expect((processed as any)["x-audience"]).toBeUndefined();
  });

  it("should handle document without extensions", () => {
    const docWithoutExtensions: AsyncAPIDocument = {
      asyncapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
    };

    const processed = removeExtensions({
      keys: ["x-internal"],
    })({
      schema: docWithoutExtensions,
      file: "/test.json",
      dereference: async (id) => id,
    });

    expect(processed.asyncapi).toBe("3.0.0");
  });
});
