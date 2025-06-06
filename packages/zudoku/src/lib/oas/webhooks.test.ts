import { describe, expect, it } from "vitest";
import { getAllWebhookOperations } from "../../lib/oas/graphql/index.js";

// Test webhook operations extraction
describe("getAllWebhookOperations", () => {
  it("should extract webhook operations correctly", () => {
    const webhooks = {
      newPet: {
        post: {
          summary: "New pet webhook",
          operationId: "newPetWebhook",
          tags: ["Webhooks"],
          requestBody: {
            description: "Information about a new pet",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Success",
            },
          },
        },
      },
      orderUpdate: {
        post: {
          summary: "Order update webhook",
          operationId: "orderUpdateWebhook",
          tags: ["Orders", "Webhooks"],
          responses: {
            "200": {
              description: "Success",
            },
          },
        },
      },
    };

    const webhookOps = getAllWebhookOperations(webhooks);

    expect(webhookOps).toHaveLength(2);

    // Check first webhook
    const newPetWebhook = webhookOps.find(
      (op) => op.operationId === "newPetWebhook",
    );
    expect(newPetWebhook).toBeDefined();
    expect(newPetWebhook?.path).toBe("/webhooks/newPet");
    expect(newPetWebhook?.method).toBe("post");
    expect(newPetWebhook?.summary).toBe("New pet webhook");
    expect(newPetWebhook?.tags).toContain("Webhooks");

    // Check second webhook
    const orderUpdateWebhook = webhookOps.find(
      (op) => op.operationId === "orderUpdateWebhook",
    );
    expect(orderUpdateWebhook).toBeDefined();
    expect(orderUpdateWebhook?.path).toBe("/webhooks/orderUpdate");
    expect(orderUpdateWebhook?.method).toBe("post");
    expect(orderUpdateWebhook?.tags).toEqual(["Orders", "Webhooks"]);
  });

  it("should handle empty webhooks", () => {
    expect(getAllWebhookOperations({})).toEqual([]);
  });

  it("should handle undefined webhooks", () => {
    expect(getAllWebhookOperations(undefined)).toEqual([]);
  });

  it("should support multiple HTTP methods in webhooks", () => {
    const webhooks = {
      multiMethod: {
        post: {
          summary: "POST webhook",
          operationId: "postWebhook",
          responses: { "200": { description: "Success" } },
        },
        put: {
          summary: "PUT webhook",
          operationId: "putWebhook",
          responses: { "200": { description: "Success" } },
        },
      },
    };

    const webhookOps = getAllWebhookOperations(webhooks);
    expect(webhookOps).toHaveLength(2);

    const methods = webhookOps.map((op) => op.method);
    expect(methods).toContain("post");
    expect(methods).toContain("put");
  });
});
