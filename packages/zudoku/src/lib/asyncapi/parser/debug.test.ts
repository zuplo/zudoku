/* biome-ignore-all lint/suspicious/noConsole: Debug test intentionally uses console.log */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { validate } from "./index.js";
import { extractOperations } from "./operations.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sampleDocPath = path.resolve(
  __dirname,
  "../../../../../../examples/asyncapi-sample/asyncapi-simple.json",
);
const sampleDoc = JSON.parse(fs.readFileSync(sampleDocPath, "utf-8"));

describe("Debug: Operations Extraction", () => {
  it("should show parsed document structure", async () => {
    const doc = await validate(sampleDoc);

    console.log("Channels:", Object.keys(doc.channels ?? {}));
    console.log("Operations:", Object.keys(doc.operations ?? {}));

    // Check chatRoom channel
    const chatRoom = doc.channels?.chatRoom;
    console.log("chatRoom channel:", chatRoom);
    console.log("chatRoom bindings:", chatRoom?.bindings);

    // Check operation structure
    const sendOp = doc.operations?.sendChatMessage;
    console.log("sendChatMessage operation:", sendOp);
    console.log("sendChatMessage channel ref:", sendOp?.channel);
  });

  it("should extract operations and show enriched data", async () => {
    const doc = await validate(sampleDoc);
    const ops = extractOperations(doc);

    console.log("Number of operations:", ops.length);

    for (const op of ops) {
      console.log("---");
      console.log("Operation:", op.operationId);
      console.log("  channelId:", op.channelId);
      console.log("  channelAddress:", op.channelAddress);
      console.log("  protocols:", op.protocols);
      console.log("  action:", op.action);
    }

    expect(ops.length).toBeGreaterThan(0);
  });
});
