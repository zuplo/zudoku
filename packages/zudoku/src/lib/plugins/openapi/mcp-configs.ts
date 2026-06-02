interface SecurityScheme {
  type: string;
  scheme?: string;
  name?: string;
  in?: string;
}

export type McpServerData = boolean | Record<string, unknown>;

export interface AuthHeader {
  headerName: string;
  placeholder: string;
}

export type AuthType = "none" | "apiKey" | "oauth";

// Detects auth type from x-mcp-server security data
export const getAuthType = (data?: McpServerData): AuthType => {
  if (typeof data === "boolean" || !data?.security || !data?.securitySchemes) {
    return "none";
  }

  const schemes = data.securitySchemes as Record<string, SecurityScheme>;
  const security = data.security as Array<Record<string, string[]>>;
  const firstReq = security[0];
  if (!firstReq) return "none";

  const schemeName = Object.keys(firstReq)[0];
  if (!schemeName) return "none";

  const scheme = schemes[schemeName];
  if (!scheme) return "none";

  if (scheme.type === "oauth2" || scheme.type === "openIdConnect") {
    return "oauth";
  }
  if (scheme.type === "http" || scheme.type === "apiKey") {
    return "apiKey";
  }

  return "none";
};

// Derives auth header name and placeholder from the first security scheme
export const getAuthHeader = (data?: McpServerData): AuthHeader | undefined => {
  if (typeof data === "boolean" || !data?.security || !data?.securitySchemes) {
    return undefined;
  }

  const schemes = data.securitySchemes as Record<string, SecurityScheme>;
  const security = data.security as Array<Record<string, string[]>>;
  const firstReq = security[0];
  if (!firstReq) return undefined;

  const schemeName = Object.keys(firstReq)[0];
  if (!schemeName) return undefined;

  const scheme = schemes[schemeName];
  if (!scheme) return undefined;

  if (scheme.type === "http") {
    const authScheme = scheme.scheme ?? "bearer";
    const label = authScheme.charAt(0).toUpperCase() + authScheme.slice(1);
    return {
      headerName: "Authorization",
      placeholder: `${label} YOUR_API_KEY`,
    };
  }

  if (scheme.type === "apiKey" && scheme.in === "header" && scheme.name) {
    return {
      headerName: scheme.name,
      placeholder: "YOUR_API_KEY",
    };
  }

  return undefined;
};

// -- App compatibility matrix --

export interface McpSubApp {
  id: string;
  label: string;
  supportedAuth: AuthType[];
}

export interface McpApp {
  id: string;
  label: string;
  subApps: McpSubApp[];
}

export const MCP_APPS: McpApp[] = [
  {
    id: "claude",
    label: "Claude",
    subApps: [
      {
        id: "claude-desktop",
        label: "Claude Desktop",
        supportedAuth: ["none", "oauth"],
      },
      {
        id: "claude-code",
        label: "Claude Code CLI",
        supportedAuth: ["none", "apiKey", "oauth"],
      },
    ],
  },
  {
    id: "chatgpt",
    label: "ChatGPT",
    subApps: [
      {
        id: "chatgpt-desktop",
        label: "ChatGPT",
        supportedAuth: ["none", "oauth"],
      },
    ],
  },
  {
    id: "codex",
    label: "Codex",
    subApps: [
      {
        id: "codex-gui",
        label: "Codex",
        supportedAuth: ["none", "apiKey", "oauth"],
      },
      {
        id: "codex-cli",
        label: "Codex CLI",
        supportedAuth: ["none", "apiKey", "oauth"],
      },
    ],
  },
  {
    id: "cursor",
    label: "Cursor",
    subApps: [
      {
        id: "cursor",
        label: "Cursor",
        supportedAuth: ["none", "apiKey", "oauth"],
      },
    ],
  },
  {
    id: "vscode",
    label: "VS Code",
    subApps: [
      {
        id: "vscode",
        label: "VS Code",
        supportedAuth: ["none", "apiKey", "oauth"],
      },
    ],
  },
  {
    id: "generic",
    label: "Generic",
    subApps: [
      {
        id: "generic",
        label: "Generic",
        supportedAuth: ["none", "apiKey", "oauth"],
      },
    ],
  },
];

// Filters apps and sub-apps to those supporting the given auth type
export const getVisibleApps = (authType: AuthType): McpApp[] =>
  MCP_APPS.map((app) => ({
    ...app,
    subApps: app.subApps.filter((sub) => sub.supportedAuth.includes(authType)),
  })).filter((app) => app.subApps.length > 0);

// -- Config generators --

export const getMcpServerName = (
  data?: McpServerData,
  summary?: string,
): string => {
  if (typeof data === "boolean") return summary ?? "mcp-server";
  return (data?.name as string) ?? summary ?? "mcp-server";
};

export const getMcpUrl = (serverUrl?: string, operationPath?: string) =>
  `${(serverUrl ?? "").replace(/\/+$/, "")}${operationPath ?? "/mcp"}`;

export const getClaudeCodeCommand = (
  name: string,
  mcpUrl: string,
  auth?: AuthHeader,
) => {
  const headerFlag = auth
    ? ` --header '${auth.headerName}: ${auth.placeholder}'`
    : "";
  return `claude mcp add --transport http${headerFlag} '${name}' '${mcpUrl}'`;
};

export const getCodexCliCommand = (
  name: string,
  mcpUrl: string,
  auth?: AuthHeader,
) => {
  const headerFlag = auth
    ? ` --header '${auth.headerName}: ${auth.placeholder}'`
    : "";
  return `codex mcp add --transport http${headerFlag} '${name}' '${mcpUrl}'`;
};

const jsonHeaders = (auth: AuthHeader) =>
  `,\n      "headers": {\n        "${auth.headerName}": "${auth.placeholder}"\n      }`;

export const getCursorConfig = (
  name: string,
  mcpUrl: string,
  auth?: AuthHeader,
) => `{
  "mcpServers": {
    "${name}": {
      "url": "${mcpUrl}"${auth ? jsonHeaders(auth) : ""}
    }
  }
}`;

export const getVscodeConfig = (
  name: string,
  mcpUrl: string,
  auth?: AuthHeader,
) => `{
  "servers": {
    "${name}": {
      "type": "http",
      "url": "${mcpUrl}"${auth ? jsonHeaders(auth) : ""}
    }
  }
}`;

export const getCodexConfig = (
  name: string,
  mcpUrl: string,
  auth?: AuthHeader,
) => `{
  "mcpServers": {
    "${name}": {
      "url": "${mcpUrl}"${auth ? jsonHeaders(auth) : ""}
    }
  }
}`;

export const getGenericConfig = (
  name: string,
  mcpUrl: string,
  auth?: AuthHeader,
) => `{
  "mcpServers": {
    "${name}": {
      "url": "${mcpUrl}"${auth ? jsonHeaders(auth) : ""}
    }
  }
}`;
