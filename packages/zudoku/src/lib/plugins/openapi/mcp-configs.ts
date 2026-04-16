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
