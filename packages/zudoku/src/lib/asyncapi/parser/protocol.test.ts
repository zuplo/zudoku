import { describe, expect, it } from "vitest";
import type { ChannelObject, ServerObject } from "../types.js";
import {
  detectProtocolFromUrl,
  detectProtocols,
  detectProtocolsFromBindings,
  detectProtocolsFromServers,
  getProtocolDisplayName,
  normalizeProtocol,
} from "./protocol.js";

describe("detectProtocolsFromBindings", () => {
  it("should detect WebSocket protocol from bindings", () => {
    const bindings = {
      ws: {
        method: "GET",
      },
    };

    const protocols = detectProtocolsFromBindings(bindings);
    expect(protocols).toContain("ws");
  });

  it("should detect multiple protocols", () => {
    const bindings = {
      ws: { method: "GET" },
      mqtt: { qos: 1 },
    };

    const protocols = detectProtocolsFromBindings(bindings);
    expect(protocols).toContain("ws");
    expect(protocols).toContain("mqtt");
  });

  it("should return empty array for no bindings", () => {
    const protocols = detectProtocolsFromBindings(undefined);
    expect(protocols).toEqual([]);
  });

  it("should ignore __$ref property", () => {
    const bindings = {
      __$ref: "#/components/channelBindings/test",
      ws: { method: "GET" },
    };

    const protocols = detectProtocolsFromBindings(bindings);
    expect(protocols).toContain("ws");
    expect(protocols).not.toContain("__$ref");
  });
});

describe("detectProtocolFromUrl", () => {
  it("should detect ws from wss:// URL", () => {
    const protocol = detectProtocolFromUrl("wss://example.com");
    expect(protocol).toBe("ws");
  });

  it("should detect http from https:// URL", () => {
    const protocol = detectProtocolFromUrl("https://api.example.com");
    expect(protocol).toBe("http");
  });

  it("should detect mqtt protocol", () => {
    const protocol = detectProtocolFromUrl("mqtt://broker.example.com");
    expect(protocol).toBe("mqtt");
  });

  it("should return null for invalid URL", () => {
    const protocol = detectProtocolFromUrl("not-a-url");
    expect(protocol).toBeNull();
  });

  it("should handle kafka URLs", () => {
    const protocol = detectProtocolFromUrl("kafka://localhost:9092");
    expect(protocol).toBe("kafka");
  });
});

describe("detectProtocolsFromServers", () => {
  it("should detect protocol from server protocol field", () => {
    const servers: Record<string, ServerObject> = {
      production: {
        host: "example.com",
        protocol: "mqtt",
      },
    };

    const protocols = detectProtocolsFromServers(servers, [
      "#/servers/production",
    ]);
    expect(protocols).toContain("mqtt");
  });

  it("should detect protocol from server host URL", () => {
    const servers: Record<string, ServerObject> = {
      dev: {
        host: "wss://dev.example.com",
        protocol: "ws",
      },
    };

    const protocols = detectProtocolsFromServers(servers, ["#/servers/dev"]);
    expect(protocols).toContain("ws");
  });

  it("should handle multiple server refs", () => {
    const servers: Record<string, ServerObject> = {
      wsServer: {
        host: "example.com",
        protocol: "ws",
      },
      mqttServer: {
        host: "example.com",
        protocol: "mqtt",
      },
    };

    const protocols = detectProtocolsFromServers(servers, [
      "#/servers/wsServer",
      "#/servers/mqttServer",
    ]);
    expect(protocols).toContain("ws");
    expect(protocols).toContain("mqtt");
  });

  it("should return empty array for no servers", () => {
    const protocols = detectProtocolsFromServers(undefined, []);
    expect(protocols).toEqual([]);
  });
});

describe("detectProtocols", () => {
  it("should detect protocols from both bindings and servers", () => {
    const channel: ChannelObject = {
      address: "/chat",
      bindings: {
        ws: { method: "GET" },
      },
    };

    const servers: Record<string, ServerObject> = {
      prod: {
        host: "example.com",
        protocol: "mqtt",
      },
    };

    const protocols = detectProtocols(channel, servers, [
      { $ref: "#/servers/prod" },
    ]);

    expect(protocols).toContain("ws");
    expect(protocols).toContain("mqtt");
  });

  it("should handle missing channel", () => {
    const protocols = detectProtocols(undefined, undefined, []);
    expect(protocols).toEqual([]);
  });

  it("should deduplicate protocols", () => {
    const channel: ChannelObject = {
      address: "/test",
      bindings: {
        ws: { method: "GET" },
      },
    };

    const servers: Record<string, ServerObject> = {
      server1: {
        host: "example.com",
        protocol: "ws",
      },
    };

    const protocols = detectProtocols(channel, servers, ["#/servers/server1"]);

    // Should only have one 'ws' entry
    expect(protocols.filter((p) => p === "ws").length).toBe(1);
  });
});

describe("normalizeProtocol", () => {
  it("should normalize wss to ws", () => {
    expect(normalizeProtocol("wss")).toBe("ws");
    expect(normalizeProtocol("WSS")).toBe("ws");
  });

  it("should normalize websocket to ws", () => {
    expect(normalizeProtocol("websocket")).toBe("ws");
    expect(normalizeProtocol("WebSocket")).toBe("ws");
  });

  it("should normalize https to http", () => {
    expect(normalizeProtocol("https")).toBe("http");
  });

  it("should keep standard protocols as is", () => {
    expect(normalizeProtocol("mqtt")).toBe("mqtt");
    expect(normalizeProtocol("kafka")).toBe("kafka");
  });
});

describe("getProtocolDisplayName", () => {
  it("should return display name for ws", () => {
    expect(getProtocolDisplayName("ws")).toBe("WebSocket");
  });

  it("should return display name for mqtt", () => {
    expect(getProtocolDisplayName("mqtt")).toBe("MQTT");
  });

  it("should return uppercased name for unknown protocol", () => {
    expect(getProtocolDisplayName("custom")).toBe("CUSTOM");
  });

  it("should normalize before getting display name", () => {
    expect(getProtocolDisplayName("wss")).toBe("WebSocket");
    expect(getProtocolDisplayName("websocket")).toBe("WebSocket");
  });
});
