import { describe, expect, it } from "vitest";
import type { AsyncAPIDocument } from "../../../asyncapi/types.js";
import { removeExtensions } from "./removeExtensions.js";

const baseDoc: AsyncAPIDocument = {
  asyncapi: "3.0.0",
  info: {
    title: "Test",
    version: "1.0.0",
    "x-logo": "https://example.com/logo.png",
  },
  "x-internal": true,
  "x-audience": "internal",
  channels: {
    userChannel: {
      address: "/users",
      "x-rate-limit": 100,
    },
  },
  operations: {
    onUserSignup: {
      action: "receive" as const,
      channel: { $ref: "#/channels/userChannel" },
      "x-handler": "handleUserSignup",
    },
  },
};

describe("removeExtensions", () => {
  it("should remove specified extension from root", () => {
    const processed = removeExtensions({
      extensions: { "x-internal": true },
    })({
      schema: baseDoc,
      file: "/test.json",
      dereference: async (id) => id,
    });

    expect(processed["x-internal"]).toBeUndefined();
    expect(processed["x-audience"]).toBeDefined();
  });

  it("should remove multiple extensions", () => {
    const processed = removeExtensions({
      extensions: {
        "x-internal": true,
        "x-audience": true,
      },
    })({
      schema: baseDoc,
      file: "/test.json",
      dereference: async (id) => id,
    });

    expect(processed["x-internal"]).toBeUndefined();
    expect(processed["x-audience"]).toBeUndefined();
  });

  it("should remove extensions from nested objects", () => {
    const processed = removeExtensions({
      extensions: { "x-logo": true },
    })({
      schema: baseDoc,
      file: "/test.json",
      dereference: async (id) => id,
    });

    expect(processed.info["x-logo"]).toBeUndefined();
    expect(processed.info.title).toBeDefined();
  });

  it("should use shouldRemove callback", () => {
    const processed = removeExtensions({
      shouldRemove: ({ extension }) => extension.startsWith("x-audience"),
    })({
      schema: baseDoc,
      file: "/test.json",
      dereference: async (id) => id,
    });

    expect(processed["x-audience"]).toBeUndefined();
    expect(processed["x-internal"]).toBeDefined();
  });

  it("should remove extensions based on value", () => {
    const processed = removeExtensions({
      shouldRemove: ({ value }) => value === true,
    })({
      schema: baseDoc,
      file: "/test.json",
      dereference: async (id) => id,
    });

    expect(processed["x-internal"]).toBeUndefined();
    expect(processed["x-audience"]).toBeDefined(); // "internal" !== true
  });

  it("should keep standard properties", () => {
    const processed = removeExtensions({
      extensions: { "x-internal": true },
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
    const processed = removeExtensions()({
      schema: baseDoc,
      file: "/test.json",
      dereference: async (id) => id,
    });

    expect(processed["x-internal"]).toBeDefined();
    expect(processed["x-audience"]).toBeDefined();
  });

  it("should handle document without extensions", () => {
    const docWithoutExtensions: AsyncAPIDocument = {
      asyncapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
    };

    const processed = removeExtensions({
      extensions: { "x-internal": true },
    })({
      schema: docWithoutExtensions,
      file: "/test.json",
      dereference: async (id) => id,
    });

    expect(processed.asyncapi).toBe("3.0.0");
  });
});
