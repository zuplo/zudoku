import { describe, expect, it } from "vitest";
import { validate } from "./index.js";

const validAsyncAPI30Doc = {
  asyncapi: "3.0.0",
  info: {
    title: "Test AsyncAPI",
    version: "1.0.0",
    description: "A test AsyncAPI document",
  },
  channels: {
    userSignup: {
      address: "/user/signup",
      messages: {
        UserSignedUp: {
          payload: {
            type: "object",
            properties: {
              userId: { type: "string" },
              email: { type: "string" },
            },
          },
        },
      },
    },
  },
  operations: {
    onUserSignup: {
      action: "receive" as const,
      channel: { $ref: "#/channels/userSignup" },
      summary: "Handle user signup events",
    },
  },
};

describe("AsyncAPI Parser", () => {
  it("should parse valid AsyncAPI 3.0 document", async () => {
    const doc = await validate(validAsyncAPI30Doc);

    expect(doc.asyncapi).toBe("3.0.0");
    expect(doc.info.title).toBe("Test AsyncAPI");
    expect(doc.channels).toBeDefined();
  });

  it("should parse raw JSON string", async () => {
    const doc = await validate(JSON.stringify(validAsyncAPI30Doc));

    expect(doc.asyncapi).toBe("3.0.0");
    expect(doc.info).toBeDefined();
  });

  it("should throw error for missing asyncapi version", async () => {
    const invalidDoc = {
      info: { title: "Test", version: "1.0.0" },
    };

    await expect(validate(invalidDoc)).rejects.toThrow(
      "AsyncAPI version is not defined",
    );
  });

  it("should handle channels with bindings", async () => {
    const docWithBindings = {
      ...validAsyncAPI30Doc,
      channels: {
        chat: {
          address: "/chat/{roomId}",
          bindings: {
            ws: {
              method: "GET",
            },
          },
          parameters: {
            roomId: {
              description: "The ID of the room",
            },
          },
        },
      },
    };

    const doc = await validate(docWithBindings);
    expect(doc.channels?.chat).toBeDefined();
    expect(doc.channels?.chat?.bindings?.ws).toBeDefined();
  });

  it("should handle operations with send action", async () => {
    const docWithSend = {
      asyncapi: "3.0.0",
      info: { title: "Test", version: "1.0.0" },
      channels: {
        messages: {
          address: "/messages",
        },
      },
      operations: {
        sendMessage: {
          action: "send" as const,
          channel: { $ref: "#/channels/messages" },
          summary: "Send a message",
        },
      },
    };

    const doc = await validate(docWithSend);
    expect(doc.operations?.sendMessage?.action).toBe("send");
  });
});
