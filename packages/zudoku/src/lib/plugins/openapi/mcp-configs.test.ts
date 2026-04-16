import { describe, expect, it } from "vitest";
import {
  type AuthHeader,
  getAuthHeader,
  getAuthType,
  getClaudeCodeCommand,
  getCodexCliCommand,
  getCodexConfig,
  getCursorConfig,
  getGenericConfig,
  getMcpServerName,
  getMcpUrl,
  getVisibleApps,
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

describe("getAuthType", () => {
  it("returns none for boolean data", () => {
    expect(getAuthType(true)).toBe("none");
  });

  it("returns none when no security", () => {
    expect(getAuthType({ name: "test" })).toBe("none");
  });

  it("returns apiKey for http/bearer scheme", () => {
    expect(
      getAuthType({
        security: [{ api_key: [] }],
        securitySchemes: { api_key: { type: "http", scheme: "bearer" } },
      }),
    ).toBe("apiKey");
  });

  it("returns apiKey for apiKey scheme", () => {
    expect(
      getAuthType({
        security: [{ key: [] }],
        securitySchemes: {
          key: { type: "apiKey", in: "header", name: "X-API-Key" },
        },
      }),
    ).toBe("apiKey");
  });

  it("returns oauth for oauth2 scheme", () => {
    expect(
      getAuthType({
        security: [{ oauth: [] }],
        securitySchemes: { oauth: { type: "oauth2" } },
      }),
    ).toBe("oauth");
  });

  it("returns oauth for openIdConnect scheme", () => {
    expect(
      getAuthType({
        security: [{ oidc: [] }],
        securitySchemes: { oidc: { type: "openIdConnect" } },
      }),
    ).toBe("oauth");
  });
});

describe("getVisibleApps", () => {
  it("shows all apps for none auth", () => {
    const apps = getVisibleApps("none");
    const ids = apps.map((a) => a.id);
    expect(ids).toEqual([
      "claude",
      "chatgpt",
      "codex",
      "cursor",
      "vscode",
      "generic",
    ]);
  });

  it("hides chatgpt for apiKey auth", () => {
    const apps = getVisibleApps("apiKey");
    const ids = apps.map((a) => a.id);
    expect(ids).not.toContain("chatgpt");
    expect(ids).toContain("claude");
    expect(ids).toContain("codex");
  });

  it("filters claude-desktop for oauth auth", () => {
    const apps = getVisibleApps("oauth");
    const claude = apps.find((a) => a.id === "claude");
    const subIds = claude?.subApps.map((s) => s.id);
    expect(subIds).toEqual(["claude-code"]);
    expect(subIds).not.toContain("claude-desktop");
  });

  it("shows chatgpt for oauth auth", () => {
    const apps = getVisibleApps("oauth");
    const ids = apps.map((a) => a.id);
    expect(ids).toContain("chatgpt");
  });

  it("shows both claude sub-apps for none auth", () => {
    const apps = getVisibleApps("none");
    const claude = apps.find((a) => a.id === "claude");
    expect(claude?.subApps).toHaveLength(2);
  });

  it("shows both codex sub-apps for apiKey auth", () => {
    const apps = getVisibleApps("apiKey");
    const codex = apps.find((a) => a.id === "codex");
    expect(codex?.subApps).toHaveLength(2);
  });
});

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

  it("codex cli command", () => {
    expect(
      getCodexCliCommand(SERVER_NAME, `${SERVER_URL}${MCP_PATH}`),
    ).toMatchInlineSnapshot(
      `"codex mcp add --transport http 'my-api' 'https://api.example.com/mcp'"`,
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

  it("codex config", () => {
    expect(getCodexConfig(SERVER_NAME, `${SERVER_URL}${MCP_PATH}`))
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

  it("codex cli command", () => {
    expect(
      getCodexCliCommand(SERVER_NAME, `${SERVER_URL}${MCP_PATH}`, bearerAuth),
    ).toMatchInlineSnapshot(
      `"codex mcp add --transport http --header 'Authorization: Bearer YOUR_API_KEY' 'my-api' 'https://api.example.com/mcp'"`,
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

  it("codex config", () => {
    expect(getCodexConfig(SERVER_NAME, `${SERVER_URL}${MCP_PATH}`, bearerAuth))
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

  it("codex cli command", () => {
    expect(
      getCodexCliCommand(SERVER_NAME, `${SERVER_URL}${MCP_PATH}`, apiKeyAuth),
    ).toMatchInlineSnapshot(
      `"codex mcp add --transport http --header 'X-API-Key: YOUR_API_KEY' 'my-api' 'https://api.example.com/mcp'"`,
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
