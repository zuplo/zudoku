import { describe, expect, it } from "vitest";
import type { AsyncAPIDocument } from "../../../asyncapi/types.js";
import { removeChannels } from "./removeChannels.js";

const baseDoc: AsyncAPIDocument = {
  asyncapi: "3.0.0",
  info: { title: "Test", version: "1.0.0" },
  channels: {
    userSignup: {
      address: "/user/signup",
      messages: {
        UserSignedUp: {
          payload: { type: "object" },
        },
      },
    },
    userUpdate: {
      address: "/user/update",
    },
    internalChannel: {
      address: "/internal",
      "x-internal": true,
    },
  },
};

describe("removeChannels", () => {
  it("should remove specified channels", () => {
    const processed = removeChannels({
      channels: { userSignup: true },
    })({
      schema: baseDoc,
      file: "/test.json",
      dereference: async (id) => id,
    });

    expect(processed.channels?.userSignup).toBeUndefined();
    expect(processed.channels?.userUpdate).toBeDefined();
  });

  it("should remove multiple channels", () => {
    const processed = removeChannels({
      channels: {
        userSignup: true,
        userUpdate: true,
      },
    })({
      schema: baseDoc,
      file: "/test.json",
      dereference: async (id) => id,
    });

    expect(processed.channels?.userSignup).toBeUndefined();
    expect(processed.channels?.userUpdate).toBeUndefined();
    expect(processed.channels?.internalChannel).toBeDefined();
  });

  it("should keep channels not specified for removal", () => {
    const processed = removeChannels({
      channels: { userSignup: true },
    })({
      schema: baseDoc,
      file: "/test.json",
      dereference: async (id) => id,
    });

    expect(processed.channels?.userUpdate).toBeDefined();
    expect(processed.channels?.internalChannel).toBeDefined();
  });

  it("should use shouldRemove callback", () => {
    const processed = removeChannels({
      shouldRemove: ({ channelId }) => channelId.startsWith("user"),
    })({
      schema: baseDoc,
      file: "/test.json",
      dereference: async (id) => id,
    });

    expect(processed.channels?.userSignup).toBeUndefined();
    expect(processed.channels?.userUpdate).toBeUndefined();
    expect(processed.channels?.internalChannel).toBeDefined();
  });

  it("should remove channels with x-internal extension", () => {
    const processed = removeChannels({
      shouldRemove: ({ channel }) => channel["x-internal"] === true,
    })({
      schema: baseDoc,
      file: "/test.json",
      dereference: async (id) => id,
    });

    expect(processed.channels?.internalChannel).toBeUndefined();
    expect(processed.channels?.userSignup).toBeDefined();
  });

  it("should handle empty options", () => {
    const processed = removeChannels()({
      schema: baseDoc,
      file: "/test.json",
      dereference: async (id) => id,
    });

    expect(Object.keys(processed.channels ?? {})).toHaveLength(3);
  });

  it("should handle document without channels", () => {
    const docWithoutChannels: AsyncAPIDocument = {
      asyncapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
    };

    const processed = removeChannels({
      channels: { userSignup: true },
    })({
      schema: docWithoutChannels,
      file: "/test.json",
      dereference: async (id) => id,
    });

    expect(processed.channels).toBeUndefined();
  });
});
