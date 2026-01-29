import { describe, expect, it } from "vitest";
import { asyncApiPlugin } from "../index.js";

describe("asyncApiPlugin", () => {
  it("should create plugin with URL config", () => {
    const plugin = asyncApiPlugin({
      type: "url",
      input: "https://example.com/asyncapi.json",
      path: "/async",
    });

    expect(plugin).toHaveProperty("getRoutes");
    expect(plugin).toHaveProperty("getNavigation");
    expect(plugin).toHaveProperty("getHead");
    expect(plugin).toHaveProperty("getMdxComponents");
  });

  it("should create plugin with raw AsyncAPI document", () => {
    const doc = {
      asyncapi: "3.0.0",
      info: { title: "Test API", version: "1.0.0" },
      channels: {},
    };

    const plugin = asyncApiPlugin({
      type: "raw",
      input: JSON.stringify(doc),
      path: "/async",
    });

    expect(plugin).toBeDefined();
    expect(plugin.getRoutes).toBeInstanceOf(Function);
  });

  it("should support versioned input", () => {
    const plugin = asyncApiPlugin({
      type: "url",
      input: [
        {
          path: "v1",
          version: "1.0.0",
          input: "https://example.com/asyncapi-v1.json",
        },
        {
          path: "v2",
          version: "2.0.0",
          input: "https://example.com/asyncapi-v2.json",
        },
      ],
      path: "/async",
    });

    expect(plugin).toBeDefined();
  });

  it("should handle optional configuration", () => {
    const plugin = asyncApiPlugin({
      type: "url",
      input: "https://example.com/asyncapi.json",
      path: "/async",
      options: {
        disableSimulator: true,
        supportedProtocols: [
          { value: "websocket", label: "WebSocket" },
          { value: "mqtt", label: "MQTT" },
        ],
      },
    });

    expect(plugin).toBeDefined();
  });

  it("should support custom server option", () => {
    const plugin = asyncApiPlugin({
      type: "url",
      input: "https://example.com/asyncapi.json",
      path: "/async",
      server: "https://graphql.example.com",
    });

    expect(plugin).toBeDefined();
  });
});
