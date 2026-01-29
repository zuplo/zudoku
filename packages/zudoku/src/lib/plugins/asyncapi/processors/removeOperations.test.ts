import { describe, expect, it } from "vitest";
import type { AsyncAPIDocument } from "../../../asyncapi/types.js";
import { removeOperations } from "./removeOperations.js";

const baseDoc: AsyncAPIDocument = {
  asyncapi: "3.0.0",
  info: { title: "Test", version: "1.0.0" },
  channels: {
    userChannel: { address: "/users" },
  },
  operations: {
    onUserSignup: {
      action: "receive",
      channel: { $ref: "#/channels/userChannel" },
      summary: "Receive user signup",
    },
    sendUserUpdate: {
      action: "send",
      channel: { $ref: "#/channels/userChannel" },
      summary: "Send user update",
      "x-internal": true,
    },
    deprecatedOp: {
      action: "receive",
      channel: { $ref: "#/channels/userChannel" },
      summary: "Deprecated operation",
      "x-deprecated": true,
    },
  },
};

describe("removeOperations", () => {
  it("should remove specified operations", () => {
    const processed = removeOperations({
      operations: { onUserSignup: true },
    })({
      schema: baseDoc,
      file: "/test.json",
      dereference: async (id) => id,
    });

    expect(processed.operations?.onUserSignup).toBeUndefined();
    expect(processed.operations?.sendUserUpdate).toBeDefined();
  });

  it("should remove multiple operations", () => {
    const processed = removeOperations({
      operations: {
        onUserSignup: true,
        sendUserUpdate: true,
      },
    })({
      schema: baseDoc,
      file: "/test.json",
      dereference: async (id) => id,
    });

    expect(processed.operations?.onUserSignup).toBeUndefined();
    expect(processed.operations?.sendUserUpdate).toBeUndefined();
    expect(processed.operations?.deprecatedOp).toBeDefined();
  });

  it("should keep operations not specified for removal", () => {
    const processed = removeOperations({
      operations: { deprecatedOp: true },
    })({
      schema: baseDoc,
      file: "/test.json",
      dereference: async (id) => id,
    });

    expect(processed.operations?.onUserSignup).toBeDefined();
    expect(processed.operations?.sendUserUpdate).toBeDefined();
    expect(processed.operations?.deprecatedOp).toBeUndefined();
  });

  it("should use shouldRemove callback", () => {
    const processed = removeOperations({
      shouldRemove: ({ operation }) => operation.action === "send",
    })({
      schema: baseDoc,
      file: "/test.json",
      dereference: async (id) => id,
    });

    expect(processed.operations?.sendUserUpdate).toBeUndefined();
    expect(processed.operations?.onUserSignup).toBeDefined();
    expect(processed.operations?.deprecatedOp).toBeDefined();
  });

  it("should remove operations with x-internal extension", () => {
    const processed = removeOperations({
      shouldRemove: ({ operation }) => operation["x-internal"] === true,
    })({
      schema: baseDoc,
      file: "/test.json",
      dereference: async (id) => id,
    });

    expect(processed.operations?.sendUserUpdate).toBeUndefined();
    expect(processed.operations?.onUserSignup).toBeDefined();
  });

  it("should remove deprecated operations", () => {
    const processed = removeOperations({
      shouldRemove: ({ operation }) => operation["x-deprecated"] === true,
    })({
      schema: baseDoc,
      file: "/test.json",
      dereference: async (id) => id,
    });

    expect(processed.operations?.deprecatedOp).toBeUndefined();
    expect(processed.operations?.onUserSignup).toBeDefined();
  });

  it("should handle empty options", () => {
    const processed = removeOperations()({
      schema: baseDoc,
      file: "/test.json",
      dereference: async (id) => id,
    });

    expect(Object.keys(processed.operations ?? {})).toHaveLength(3);
  });

  it("should handle document without operations", () => {
    const docWithoutOps: AsyncAPIDocument = {
      asyncapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
    };

    const processed = removeOperations({
      operations: { onUserSignup: true },
    })({
      schema: docWithoutOps,
      file: "/test.json",
      dereference: async (id) => id,
    });

    expect(processed.operations).toBeUndefined();
  });
});
