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

const AUTH_TYPES: AuthType[] = ["none", "apiKey", "oauth"];

const isAuthType = (value: unknown): value is AuthType =>
  typeof value === "string" && AUTH_TYPES.some((type) => type === value);

// Detects auth type from x-mcp-server. An explicit `authType` wins: an MCP
// gateway's inbound OAuth cannot be described as an OpenAPI security scheme —
// clients discover that flow themselves — so the extension states it outright
// instead of fabricating one to be inferred back out.
export const getAuthType = (data?: McpServerData): AuthType => {
  if (typeof data !== "boolean" && isAuthType(data?.authType)) {
    return data.authType;
  }

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

// Resolves what the card renders for auth. With `disableAuthInstructions` the
// server is presented as unauthenticated whatever its security says: no header
// snippets, no "replace YOUR_API_KEY" steps, no sign-in flow, and the full
// client list — for docs where credentials reach the MCP server some other way,
// or are documented elsewhere.
export const resolveMcpAuth = (
  data?: McpServerData,
  options?: { disableAuthInstructions?: boolean },
): { authType: AuthType; auth?: AuthHeader } => {
  if (options?.disableAuthInstructions) return { authType: "none" };

  // The header is derived from the resolved type, not independently: a server
  // that declares `authType` still carries security schemes an inference would
  // read a credential header out of, and an OAuth or unauthenticated server
  // must not get "replace YOUR_API_KEY" steps from one.
  const authType = getAuthType(data);
  return {
    authType,
    auth: authType === "apiKey" ? getAuthHeader(data) : undefined,
  };
};

// -- Capabilities --

// One documented MCP capability. `id` is what the protocol identifies it by —
// a tool or prompt name, a resource URI, a resource template's URI template —
// so it is what a user matches against what their client lists.
export interface McpCapability {
  id: string;
  /** Human-readable label, where the protocol carries one beside the id. */
  label?: string;
  description?: string;
  mimeType?: string;
}

export interface McpCapabilityGroup {
  id: "tools" | "prompts" | "resources" | "resourceTemplates";
  label: string;
  items: McpCapability[];
}

const readString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

// Reads one string property off an object of unknown shape — extension data is
// whatever the OpenAPI document happened to carry.
const readStringProp = (source: object, key: string): string | undefined =>
  readString(Reflect.get(source, key));

// Reads one capability list off the extension. Entries are objects keyed the
// way the protocol keys that capability kind, and a bare string is accepted as
// the key alone — the shorthand the gateway's capability filter allows.
const readCapabilities = (
  value: unknown,
  keyProp: "name" | "uri" | "uriTemplate",
): McpCapability[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry: unknown) => {
    const key = readString(entry);
    if (key) return [{ id: key }];
    if (!entry || typeof entry !== "object") return [];

    const id = readStringProp(entry, keyProp);
    if (!id) return [];

    // A tool's or prompt's name is its id, so it is never also a label.
    const label =
      keyProp === "name" ? undefined : readStringProp(entry, "name");
    const description = readStringProp(entry, "description");
    const mimeType = readStringProp(entry, "mimeType");

    return [
      {
        id,
        ...(label ? { label } : {}),
        ...(description ? { description } : {}),
        ...(mimeType ? { mimeType } : {}),
      },
    ];
  });
};

// What the server exposes, in the order a user cares about it. Empty for a
// server whose capabilities Zudoku cannot know at build time — an MCP gateway
// passing an upstream's tools through untouched, say — in which case the card
// says nothing rather than guessing.
export const getMcpCapabilities = (
  data?: McpServerData,
): McpCapabilityGroup[] => {
  if (typeof data === "boolean" || !data) return [];

  const groups: McpCapabilityGroup[] = [
    {
      id: "tools",
      label: "Tools",
      items: readCapabilities(data.tools, "name"),
    },
    {
      id: "prompts",
      label: "Prompts",
      items: readCapabilities(data.prompts, "name"),
    },
    {
      id: "resources",
      label: "Resources",
      items: readCapabilities(data.resources, "uri"),
    },
    {
      id: "resourceTemplates",
      label: "Resource templates",
      items: readCapabilities(data.resourceTemplates, "uriTemplate"),
    },
  ];

  return groups.filter((group) => group.items.length > 0);
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

export type McpTool = { name: string; description?: string };

/**
 * `extensions` reaches the client as untyped JSON, so `x-mcp-server` can hold
 * anything a document author wrote — including `null`, which `typeof` reports as
 * "object". Narrow before reading properties off it.
 */
export const isMcpServerObject = (
  data?: McpServerData,
): data is Record<string, unknown> => typeof data === "object" && data !== null;

/**
 * Whether a raw `x-mcp-server` value describes a server at all. Only `true` and
 * an object do; `null`, `false` and scalars are treated as absent.
 */
export const isMcpServerData = (value: unknown): value is McpServerData =>
  value === true || (typeof value === "object" && value !== null);

/**
 * Human-readable label for a server. Deliberately the inverse precedence of
 * `getMcpServerName`, which prefers `x-mcp-server.name` — that is the protocol
 * identity used in install snippets (`cosmo-salesforce-sales-cloud`) and reads
 * poorly as a heading.
 */
export const getMcpServerTitle = (
  data?: McpServerData,
  summary?: string | null,
  operationId?: string | null,
): string => {
  if (summary) return summary;
  if (isMcpServerObject(data) && typeof data.name === "string") {
    return data.name;
  }
  return operationId ?? "MCP Server";
};

/**
 * Tools the server advertises. Populated by the Zuplo enrichment from the
 * gateway's handler options; a document that only marks operations with
 * `x-mcp-server: true` has none, which is a normal state rather than an error.
 */
export const getMcpTools = (data?: McpServerData): McpTool[] => {
  if (!isMcpServerObject(data) || !Array.isArray(data.tools)) return [];

  return data.tools.flatMap((tool) =>
    tool && typeof tool === "object" && typeof tool.name === "string"
      ? [
          {
            name: tool.name,
            description:
              typeof tool.description === "string"
                ? tool.description
                : undefined,
          },
        ]
      : [],
  );
};

// Matches a URL that carries its own scheme, e.g. `https://mcp.example.com`.
const isAbsoluteUrl = (value: string) => /^[a-z][a-z0-9+.-]*:\/\//i.test(value);

// Reads the `url` override from x-mcp-server, ignoring blank and non-string
// values so callers fall back to the derived endpoint.
const getUrlOverride = (data?: McpServerData): string | undefined => {
  if (typeof data === "boolean") return undefined;

  const url = data?.url;
  if (typeof url !== "string") return undefined;

  const trimmed = url.trim();
  return trimmed === "" ? undefined : trimmed;
};

// The MCP endpoint is derived from the API's server URL plus the operation
// path. An `x-mcp-server.url` override takes precedence, for servers that are
// not hosted under the documented API server: an absolute URL replaces the
// endpoint entirely, anything else is treated as a path on the server URL.
export const getMcpUrl = (
  serverUrl?: string,
  operationPath?: string,
  data?: McpServerData,
) => {
  const override = getUrlOverride(data);
  if (override && isAbsoluteUrl(override)) return override;

  const path = override ?? operationPath ?? "/mcp";
  return `${(serverUrl ?? "").replace(/\/+$/, "")}${
    path.startsWith("/") ? path : `/${path}`
  }`;
};

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

// -- One-click install deep links --

// btoa only handles latin1, so encode UTF-8 first to survive non-ASCII names.
const base64Encode = (value: string): string => {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
};

const authHeaders = (auth?: AuthHeader): Record<string, string> | undefined =>
  auth ? { [auth.headerName]: auth.placeholder } : undefined;

// Cursor "Add to Cursor" deep link. `config` is the base64 of the server's
// mcp.json entry. It is URL-encoded so base64 `+`/`/`/`=` survive query parsing.
// https://cursor.com/docs/context/mcp/install-links
export const getCursorDeepLink = (
  name: string,
  mcpUrl: string,
  auth?: AuthHeader,
): string => {
  const headers = authHeaders(auth);
  const config = headers ? { url: mcpUrl, headers } : { url: mcpUrl };
  const encoded = encodeURIComponent(base64Encode(JSON.stringify(config)));
  return `cursor://anysphere.cursor-deeplink/mcp/install?name=${encodeURIComponent(
    name,
  )}&config=${encoded}`;
};

// VS Code "Install in VS Code" deep link. The whole server config (including
// name and transport) is URL-encoded JSON.
// https://code.visualstudio.com/api/extension-guides/ai/mcp
export const getVscodeDeepLink = (
  name: string,
  mcpUrl: string,
  auth?: AuthHeader,
): string => {
  const headers = authHeaders(auth);
  const config = {
    name,
    type: "http",
    url: mcpUrl,
    ...(headers ? { headers } : {}),
  };
  return `vscode:mcp/install?${encodeURIComponent(JSON.stringify(config))}`;
};

// Opens Claude's custom connector settings with the "Add custom connector"
// dialog already open. Claude has no deep link that pre-fills the server URL,
// so users still paste it into the dialog.
export const CLAUDE_CONNECTORS_URL =
  "https://claude.ai/customize/connectors?modal=add-custom-connector";
