import { describe, expect, it } from "vitest";
import {
  type AuthHeader,
  getAuthHeader,
  getClaudeCodeCommand,
  getCursorConfig,
  getGenericConfig,
  getMcpServerName,
  getMcpUrl,
  getVscodeConfig,
} from "./mcp-configs.js";

const SERVER_URL = "https://api.example.com";
const MCP_PATH = "/mcp";
const SERVER_NAME = "my-api";

const bearerAuth: AuthHeader = {
  headerName: "Authorization",
  placeholder: "Bearer YOUR_API_KEY",
};

const apiKeyAuth: AuthHeader = {
  headerName: "X-API-Key",
  placeholder: "YOUR_API_KEY",
};

describe("getAuthHeader", () => {
  it("returns undefined for boolean data", () => {
    expect(getAuthHeader(true)).toBeUndefined();
  });

  it("returns undefined when no security", () => {
    expect(getAuthHeader({ name: "test" })).toBeUndefined();
  });

  it("returns bearer auth for http/bearer scheme", () => {
    expect(
      getAuthHeader({
        security: [{ api_key: [] }],
        securitySchemes: { api_key: { type: "http", scheme: "bearer" } },
      }),
    ).toEqual({
      headerName: "Authorization",
      placeholder: "Bearer YOUR_API_KEY",
    });
  });

  it("returns basic auth for http/basic scheme", () => {
    expect(
      getAuthHeader({
        security: [{ basic: [] }],
        securitySchemes: { basic: { type: "http", scheme: "basic" } },
      }),
    ).toEqual({
      headerName: "Authorization",
      placeholder: "Basic YOUR_API_KEY",
    });
  });

  it("defaults to bearer when http scheme is unspecified", () => {
    expect(
      getAuthHeader({
        security: [{ auth: [] }],
        securitySchemes: { auth: { type: "http" } },
      }),
    ).toEqual({
      headerName: "Authorization",
      placeholder: "Bearer YOUR_API_KEY",
    });
  });

  it("returns apiKey header for apiKey scheme", () => {
    expect(
      getAuthHeader({
        security: [{ key: [] }],
        securitySchemes: {
          key: { type: "apiKey", in: "header", name: "X-API-Key" },
        },
      }),
    ).toEqual({ headerName: "X-API-Key", placeholder: "YOUR_API_KEY" });
  });

  it("returns undefined for apiKey in query (not header)", () => {
    expect(
      getAuthHeader({
        security: [{ key: [] }],
        securitySchemes: {
          key: { type: "apiKey", in: "query", name: "api_key" },
        },
      }),
    ).toBeUndefined();
  });

  it("returns undefined for oauth2 scheme", () => {
    expect(
      getAuthHeader({
        security: [{ oauth: [] }],
        securitySchemes: { oauth: { type: "oauth2" } },
      }),
    ).toBeUndefined();
  });
});

describe("getMcpUrl", () => {
  it("strips trailing slash from server URL", () => {
    expect(getMcpUrl("https://api.example.com/", "/mcp")).toBe(
      "https://api.example.com/mcp",
    );
  });

  it("defaults operation path to /mcp", () => {
    expect(getMcpUrl("https://api.example.com")).toBe(
      "https://api.example.com/mcp",
    );
  });
});

describe("getMcpServerName", () => {
  it("uses data.name when available", () => {
    expect(getMcpServerName({ name: "my-server" })).toBe("my-server");
  });

  it("falls back to summary", () => {
    expect(getMcpServerName({}, "My API")).toBe("My API");
  });

  it("falls back to mcp-server", () => {
    expect(getMcpServerName(true)).toBe("mcp-server");
  });
});

describe("config snapshots - no auth", () => {
  it("claude code command", () => {
    expect(
      getClaudeCodeCommand(SERVER_NAME, `${SERVER_URL}${MCP_PATH}`),
    ).toMatchInlineSnapshot(
      `"claude mcp add --transport http 'my-api' 'https://api.example.com/mcp'"`,
    );
  });

  it("cursor config", () => {
    expect(getCursorConfig(SERVER_NAME, `${SERVER_URL}${MCP_PATH}`))
      .toMatchInlineSnapshot(`
      "{
        "mcpServers": {
          "my-api": {
            "url": "https://api.example.com/mcp"
          }
        }
      }"
    `);
  });

  it("vscode config", () => {
    expect(getVscodeConfig(SERVER_NAME, `${SERVER_URL}${MCP_PATH}`))
      .toMatchInlineSnapshot(`
      "{
        "servers": {
          "my-api": {
            "type": "http",
            "url": "https://api.example.com/mcp"
          }
        }
      }"
    `);
  });

  it("generic config", () => {
    expect(getGenericConfig(SERVER_NAME, `${SERVER_URL}${MCP_PATH}`))
      .toMatchInlineSnapshot(`
      "{
        "mcpServers": {
          "my-api": {
            "url": "https://api.example.com/mcp"
          }
        }
      }"
    `);
  });
});

describe("config snapshots - bearer auth", () => {
  it("claude code command", () => {
    expect(
      getClaudeCodeCommand(SERVER_NAME, `${SERVER_URL}${MCP_PATH}`, bearerAuth),
    ).toMatchInlineSnapshot(
      `"claude mcp add --transport http --header 'Authorization: Bearer YOUR_API_KEY' 'my-api' 'https://api.example.com/mcp'"`,
    );
  });

  it("cursor config", () => {
    expect(getCursorConfig(SERVER_NAME, `${SERVER_URL}${MCP_PATH}`, bearerAuth))
      .toMatchInlineSnapshot(`
      "{
        "mcpServers": {
          "my-api": {
            "url": "https://api.example.com/mcp",
            "headers": {
              "Authorization": "Bearer YOUR_API_KEY"
            }
          }
        }
      }"
    `);
  });

  it("vscode config", () => {
    expect(getVscodeConfig(SERVER_NAME, `${SERVER_URL}${MCP_PATH}`, bearerAuth))
      .toMatchInlineSnapshot(`
      "{
        "servers": {
          "my-api": {
            "type": "http",
            "url": "https://api.example.com/mcp",
            "headers": {
              "Authorization": "Bearer YOUR_API_KEY"
            }
          }
        }
      }"
    `);
  });

  it("generic config", () => {
    expect(
      getGenericConfig(SERVER_NAME, `${SERVER_URL}${MCP_PATH}`, bearerAuth),
    ).toMatchInlineSnapshot(`
      "{
        "mcpServers": {
          "my-api": {
            "url": "https://api.example.com/mcp",
            "headers": {
              "Authorization": "Bearer YOUR_API_KEY"
            }
          }
        }
      }"
    `);
  });
});

describe("config snapshots - apiKey auth", () => {
  it("claude code command", () => {
    expect(
      getClaudeCodeCommand(SERVER_NAME, `${SERVER_URL}${MCP_PATH}`, apiKeyAuth),
    ).toMatchInlineSnapshot(
      `"claude mcp add --transport http --header 'X-API-Key: YOUR_API_KEY' 'my-api' 'https://api.example.com/mcp'"`,
    );
  });

  it("cursor config", () => {
    expect(getCursorConfig(SERVER_NAME, `${SERVER_URL}${MCP_PATH}`, apiKeyAuth))
      .toMatchInlineSnapshot(`
      "{
        "mcpServers": {
          "my-api": {
            "url": "https://api.example.com/mcp",
            "headers": {
              "X-API-Key": "YOUR_API_KEY"
            }
          }
        }
      }"
    `);
  });
});
