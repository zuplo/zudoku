import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { validate } from "./index.js";

// Load sample document
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sampleDocPath = path.resolve(
  __dirname,
  "../../../../../../examples/asyncapi-sample/asyncapi.json",
);
const sampleDoc = JSON.parse(fs.readFileSync(sampleDocPath, "utf-8"));

import {
  extractOperations,
  extractProtocolsFromOperations,
  extractTagsFromOperations,
  filterOperationsByAction,
  filterOperationsByProtocol,
  filterOperationsByTag,
  groupOperationsByTag,
} from "./operations.js";
import { getProtocolDisplayName } from "./protocol.js";

describe("AsyncAPI Integration Test with Sample Document", () => {
  it("should parse the sample AsyncAPI document", async () => {
    const doc = await validate(sampleDoc);

    expect(doc.asyncapi).toBe("3.0.0");
    expect(doc.info.title).toBe("Chat Application API");
    expect(doc.info.version).toBe("1.0.0");
  });

  it("should have 3 channels", async () => {
    const doc = await validate(sampleDoc);

    expect(Object.keys(doc.channels ?? {})).toHaveLength(3);
    expect(doc.channels?.chatRoom).toBeDefined();
    expect(doc.channels?.userPresence).toBeDefined();
    expect(doc.channels?.sensorData).toBeDefined();
  });

  it("should have 5 operations", async () => {
    const doc = await validate(sampleDoc);

    expect(Object.keys(doc.operations ?? {})).toHaveLength(5);
  });

  it("should have 2 servers (websocket and mqtt)", async () => {
    const doc = await validate(sampleDoc);

    expect(Object.keys(doc.servers ?? {})).toHaveLength(2);
    expect(doc.servers?.websocket?.protocol).toBe("ws");
    expect(doc.servers?.mqtt?.protocol).toBe("mqtt");
  });

  describe("Operations Extraction", () => {
    it("should extract all 5 operations with enriched data", async () => {
      const doc = await validate(sampleDoc);
      const ops = extractOperations(doc);

      expect(ops).toHaveLength(5);

      // Check that all operations have required fields
      for (const op of ops) {
        expect(op.operationId).toBeDefined();
        expect(op.action).toMatch(/^(send|receive)$/);
        expect(op.protocols).toBeDefined();
      }
    });

    it("should detect WebSocket protocol for chat operations", async () => {
      const doc = await validate(sampleDoc);
      const ops = extractOperations(doc);

      const chatOps = ops.filter((op) => op.operationId.includes("Chat"));
      expect(chatOps.length).toBeGreaterThan(0);

      for (const op of chatOps) {
        expect(op.protocols).toContain("ws");
      }
    });

    it("should detect MQTT protocol for sensor operations", async () => {
      const doc = await validate(sampleDoc);
      const ops = extractOperations(doc);

      const sensorOps = ops.filter((op) => op.operationId.includes("Sensor"));
      expect(sensorOps.length).toBeGreaterThan(0);

      for (const op of sensorOps) {
        expect(op.protocols).toContain("mqtt");
      }
    });

    it("should resolve channel addresses correctly", async () => {
      const doc = await validate(sampleDoc);
      const ops = extractOperations(doc);

      const sendChatOp = ops.find((op) => op.operationId === "sendChatMessage");
      expect(sendChatOp?.channelAddress).toBe("/chat/{roomId}");

      const sensorOp = ops.find((op) => op.operationId === "publishSensorData");
      expect(sensorOp?.channelAddress).toBe("sensors/{sensorId}/data");
    });
  });

  describe("Filtering Operations", () => {
    it("should filter by send action", async () => {
      const doc = await validate(sampleDoc);
      const ops = extractOperations(doc);
      const sendOps = filterOperationsByAction(ops, "send");

      expect(sendOps).toHaveLength(2);
      expect(sendOps.map((o) => o.operationId)).toContain("sendChatMessage");
      expect(sendOps.map((o) => o.operationId)).toContain("publishSensorData");
    });

    it("should filter by receive action", async () => {
      const doc = await validate(sampleDoc);
      const ops = extractOperations(doc);
      const receiveOps = filterOperationsByAction(ops, "receive");

      expect(receiveOps).toHaveLength(3);
    });

    it("should filter by chat tag", async () => {
      const doc = await validate(sampleDoc);
      const ops = extractOperations(doc);
      const chatOps = filterOperationsByTag(ops, "chat");

      expect(chatOps).toHaveLength(2);
    });

    it("should filter by iot tag", async () => {
      const doc = await validate(sampleDoc);
      const ops = extractOperations(doc);
      const iotOps = filterOperationsByTag(ops, "iot");

      expect(iotOps).toHaveLength(2);
    });

    it("should filter by websocket protocol", async () => {
      const doc = await validate(sampleDoc);
      const ops = extractOperations(doc);
      const wsOps = filterOperationsByProtocol(ops, "ws");

      expect(wsOps.length).toBeGreaterThan(0);
      // All WS operations should have ws protocol
      expect(wsOps.every((op) => op.protocols.includes("ws"))).toBe(true);
    });

    it("should filter by mqtt protocol", async () => {
      const doc = await validate(sampleDoc);
      const ops = extractOperations(doc);
      const mqttOps = filterOperationsByProtocol(ops, "mqtt");

      expect(mqttOps).toHaveLength(2); // sensor operations
    });
  });

  describe("Grouping Operations", () => {
    it("should group operations by tag", async () => {
      const doc = await validate(sampleDoc);
      const ops = extractOperations(doc);
      const grouped = groupOperationsByTag(ops);

      expect(grouped.has("chat")).toBe(true);
      expect(grouped.has("presence")).toBe(true);
      expect(grouped.has("iot")).toBe(true);

      expect(grouped.get("chat")).toHaveLength(2);
      expect(grouped.get("presence")).toHaveLength(1);
      expect(grouped.get("iot")).toHaveLength(2);
    });
  });

  describe("Extracting Metadata", () => {
    it("should extract all unique tags", async () => {
      const doc = await validate(sampleDoc);
      const ops = extractOperations(doc);
      const tags = extractTagsFromOperations(ops);

      expect(tags).toContain("chat");
      expect(tags).toContain("presence");
      expect(tags).toContain("iot");
      expect(tags).toHaveLength(3);
    });

    it("should extract all unique protocols", async () => {
      const doc = await validate(sampleDoc);
      const ops = extractOperations(doc);
      const protocols = extractProtocolsFromOperations(ops);

      expect(protocols).toContain("ws");
      expect(protocols).toContain("mqtt");
      expect(protocols).toHaveLength(2);
    });
  });

  describe("Protocol Display Names", () => {
    it("should return correct display names", () => {
      expect(getProtocolDisplayName("ws")).toBe("WebSocket");
      expect(getProtocolDisplayName("mqtt")).toBe("MQTT");
      expect(getProtocolDisplayName("kafka")).toBe("Kafka");
    });
  });
});
