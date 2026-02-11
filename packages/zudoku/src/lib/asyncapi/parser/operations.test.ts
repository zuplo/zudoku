import { describe, expect, it } from "vitest";
import type { AsyncAPIDocument } from "../types.js";
import {
  extractOperations,
  extractProtocolsFromOperations,
  extractTagsFromOperations,
  filterOperationsByAction,
  filterOperationsByProtocol,
  filterOperationsByTag,
  getUntaggedOperations,
  groupOperationsByChannel,
  groupOperationsByTag,
  hasUntaggedOperations,
} from "./operations.js";

const testDocument: AsyncAPIDocument = {
  asyncapi: "3.0.0",
  info: {
    title: "Test API",
    version: "1.0.0",
  },
  channels: {
    userSignup: {
      address: "/user/signup",
      bindings: {
        ws: { method: "GET" },
      },
    },
    userUpdate: {
      address: "/user/update",
      bindings: {
        mqtt: { qos: 1 },
      },
    },
  },
  operations: {
    onUserSignup: {
      action: "receive",
      channel: { $ref: "#/channels/userSignup" },
      summary: "Receive user signup events",
      tags: [{ name: "users" }],
    },
    sendUserUpdate: {
      action: "send",
      channel: { $ref: "#/channels/userUpdate" },
      summary: "Send user update commands",
      tags: [{ name: "users" }],
    },
    untaggedOp: {
      action: "receive",
      channel: { $ref: "#/channels/userSignup" },
      summary: "Untagged operation",
    },
  },
};

describe("extractOperations", () => {
  it("should extract all operations with enriched data", () => {
    const ops = extractOperations(testDocument);

    expect(ops).toHaveLength(3);
    expect(ops[0]?.operationId).toBeDefined();
    expect(ops[0]?.channelAddress).toBeDefined();
    expect(ops[0]?.protocols).toBeDefined();
  });

  it("should resolve channel addresses", () => {
    const ops = extractOperations(testDocument);

    const signupOp = ops.find((o) => o.operationId === "onUserSignup");
    expect(signupOp?.channelAddress).toBe("/user/signup");
  });

  it("should detect protocols from channels", () => {
    const ops = extractOperations(testDocument);

    const signupOp = ops.find((o) => o.operationId === "onUserSignup");
    expect(signupOp?.protocols).toContain("ws");

    const updateOp = ops.find((o) => o.operationId === "sendUserUpdate");
    expect(updateOp?.protocols).toContain("mqtt");
  });

  it("should extract parent tag", () => {
    const ops = extractOperations(testDocument);

    const signupOp = ops.find((o) => o.operationId === "onUserSignup");
    expect(signupOp?.parentTag).toBe("users");
  });

  it("should handle operations without tags", () => {
    const ops = extractOperations(testDocument);

    const untaggedOp = ops.find((o) => o.operationId === "untaggedOp");
    expect(untaggedOp?.parentTag).toBeUndefined();
  });
});

describe("filterOperationsByAction", () => {
  it("should filter by send action", () => {
    const ops = extractOperations(testDocument);
    const sendOps = filterOperationsByAction(ops, "send");

    expect(sendOps).toHaveLength(1);
    expect(sendOps[0]?.operationId).toBe("sendUserUpdate");
  });

  it("should filter by receive action", () => {
    const ops = extractOperations(testDocument);
    const receiveOps = filterOperationsByAction(ops, "receive");

    expect(receiveOps).toHaveLength(2);
    expect(receiveOps.map((o) => o.operationId)).toContain("onUserSignup");
  });
});

describe("filterOperationsByTag", () => {
  it("should filter operations by tag", () => {
    const ops = extractOperations(testDocument);
    const userOps = filterOperationsByTag(ops, "users");

    expect(userOps).toHaveLength(2);
    expect(userOps.every((o) => o.tags?.some((t) => t.name === "users"))).toBe(
      true,
    );
  });

  it("should return empty array for non-existent tag", () => {
    const ops = extractOperations(testDocument);
    const filteredOps = filterOperationsByTag(ops, "nonexistent");

    expect(filteredOps).toHaveLength(0);
  });
});

describe("filterOperationsByProtocol", () => {
  it("should filter by websocket protocol", () => {
    const ops = extractOperations(testDocument);
    const wsOps = filterOperationsByProtocol(ops, "ws");

    expect(wsOps.length).toBeGreaterThan(0);
    expect(wsOps.every((o) => o.protocols.includes("ws"))).toBe(true);
  });

  it("should filter by mqtt protocol", () => {
    const ops = extractOperations(testDocument);
    const mqttOps = filterOperationsByProtocol(ops, "mqtt");

    expect(mqttOps).toHaveLength(1);
    expect(mqttOps[0]?.operationId).toBe("sendUserUpdate");
  });
});

describe("groupOperationsByTag", () => {
  it("should group operations by tag", () => {
    const ops = extractOperations(testDocument);
    const grouped = groupOperationsByTag(ops);

    expect(grouped.has("users")).toBe(true);
    expect(grouped.get("users")).toHaveLength(2);
  });

  it("should group untagged operations separately", () => {
    const ops = extractOperations(testDocument);
    const grouped = groupOperationsByTag(ops);

    expect(grouped.has(undefined)).toBe(true);
    expect(grouped.get(undefined)).toHaveLength(1);
  });
});

describe("groupOperationsByChannel", () => {
  it("should group operations by channel", () => {
    const ops = extractOperations(testDocument);
    const grouped = groupOperationsByChannel(ops);

    expect(grouped.has("userSignup")).toBe(true);
    expect(grouped.get("userSignup")).toHaveLength(2);
  });

  it("should handle multiple operations on same channel", () => {
    const ops = extractOperations(testDocument);
    const grouped = groupOperationsByChannel(ops);

    const signupOps = grouped.get("userSignup");
    expect(signupOps?.length).toBe(2);
  });
});

describe("extractTagsFromOperations", () => {
  it("should extract all unique tags", () => {
    const ops = extractOperations(testDocument);
    const tags = extractTagsFromOperations(ops);

    expect(tags).toContain("users");
    expect(tags).toHaveLength(1);
  });

  it("should not include undefined tags", () => {
    const ops = extractOperations(testDocument);
    const tags = extractTagsFromOperations(ops);

    expect(tags.every((t) => t !== undefined)).toBe(true);
  });
});

describe("extractProtocolsFromOperations", () => {
  it("should extract all unique protocols", () => {
    const ops = extractOperations(testDocument);
    const protocols = extractProtocolsFromOperations(ops);

    expect(protocols).toContain("ws");
    expect(protocols).toContain("mqtt");
  });

  it("should not have duplicates", () => {
    const ops = extractOperations(testDocument);
    const protocols = extractProtocolsFromOperations(ops);

    const uniqueProtocols = Array.from(new Set(protocols));
    expect(protocols).toHaveLength(uniqueProtocols.length);
  });
});

describe("hasUntaggedOperations", () => {
  it("should return true when untagged operations exist", () => {
    const ops = extractOperations(testDocument);
    expect(hasUntaggedOperations(ops)).toBe(true);
  });

  it("should return false when all operations are tagged", () => {
    const docWithAllTagged: AsyncAPIDocument = {
      ...testDocument,
      operations: {
        onUserSignup: {
          action: "receive",
          channel: { $ref: "#/channels/userSignup" },
          tags: [{ name: "users" }],
        },
      },
    };

    const ops = extractOperations(docWithAllTagged);
    expect(hasUntaggedOperations(ops)).toBe(false);
  });
});

describe("getUntaggedOperations", () => {
  it("should return only untagged operations", () => {
    const ops = extractOperations(testDocument);
    const untagged = getUntaggedOperations(ops);

    expect(untagged).toHaveLength(1);
    expect(untagged[0]?.operationId).toBe("untaggedOp");
  });

  it("should return empty array when all operations are tagged", () => {
    const docWithAllTagged: AsyncAPIDocument = {
      ...testDocument,
      operations: {
        onUserSignup: {
          action: "receive",
          channel: { $ref: "#/channels/userSignup" },
          tags: [{ name: "users" }],
        },
      },
    };

    const ops = extractOperations(docWithAllTagged);
    const untagged = getUntaggedOperations(ops);

    expect(untagged).toHaveLength(0);
  });
});
