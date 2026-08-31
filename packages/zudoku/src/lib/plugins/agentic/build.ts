import { stringify as stringifyYaml } from "yaml";
import type {
  BuildApiDocument,
  BuildArtifact,
  BuildContributionContext,
  BuildContributions,
  LlmsLink,
} from "../../core/plugins.js";
import { joinUrl } from "../../util/joinUrl.js";
import {
  getMcpServerName,
  getMcpServerTitle,
  getMcpTools,
  getMcpUrl,
  isMcpServerData,
  isMcpServerObject,
  resolveMcpAuth,
} from "../openapi/mcp-configs.js";

const ARD_CONTEXT = "https://agenticresourcediscovery.org/context/v1";
const ARD_MEDIA_TYPE = "application/json; charset=utf-8";
const API_CATALOG_MEDIA_TYPE =
  'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"';
const CACHE_CONTROL = "public, max-age=0, s-maxage=3600, must-revalidate";
const HTTP_METHODS = new Set([
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
]);

type OpenApiObject = Record<string, unknown> & {
  info?: { title?: unknown; description?: unknown; version?: unknown };
  servers?: Array<{ url?: unknown }>;
  paths?: Record<string, Record<string, unknown>>;
  tags?: Array<{ name?: unknown }>;
  components?: { securitySchemes?: Record<string, unknown> };
  "x-mcp"?: unknown;
};

type Publication = {
  api: BuildApiDocument;
  urlPath?: string;
  absoluteUrl?: string;
  mediaType: string;
  artifact?: BuildArtifact;
};

type ArdEntry = {
  "@context": typeof ARD_CONTEXT;
  identifier: string;
  displayName: string;
  type: string;
  url: string;
  description?: string;
  capabilities?: string[];
  version?: string;
  tags?: string[];
  metadata?: Record<string, string | number | boolean | null>;
};

const toIdentifierSegment = (value: string) =>
  value
    .normalize("NFKD")
    .replaceAll(/[^A-Za-z0-9._-]+/g, "-")
    .replaceAll(/^-+|-+$/g, "")
    .toLowerCase() || "resource";

const toAbsoluteUrl = (origin: string | undefined, value: string) => {
  try {
    return new URL(value, origin).toString();
  } catch {
    return undefined;
  }
};

const LOCAL_RESOLUTION_ORIGIN = "https://zudoku.invalid";

const resolvePublicationReference = (
  publication: Publication,
  value: string,
) => {
  const publicationUrl = publication.absoluteUrl ?? publication.urlPath;
  if (!publicationUrl) return undefined;

  try {
    const usesPlaceholderOrigin = !publication.absoluteUrl;
    const baseUrl = usesPlaceholderOrigin
      ? new URL(publicationUrl, LOCAL_RESOLUTION_ORIGIN)
      : new URL(publicationUrl);
    const resolved = new URL(value, baseUrl);
    if (!usesPlaceholderOrigin || resolved.origin !== LOCAL_RESOLUTION_ORIGIN) {
      return resolved.toString();
    }
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return undefined;
  }
};

const jsonArtifact = (
  urlPath: string,
  value: unknown,
  contentType: string,
  link: string,
): BuildArtifact => ({
  urlPath,
  content: `${JSON.stringify(value, null, 2)}\n`,
  contentType,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": CACHE_CONTROL,
    Link: link,
  },
});

const getOpenApiMediaType = (api: BuildApiDocument, url: string) => {
  const sourceContentType = api.sourceContentType?.toLowerCase();
  if (sourceContentType?.includes("yaml")) return "application/yaml";
  if (sourceContentType?.includes("json")) return "application/json";
  return /\.ya?ml(?:$|[?#])/i.test(url)
    ? "application/yaml"
    : "application/json";
};

const openApiArtifact = (
  urlPath: string,
  schema: Record<string, unknown>,
  mediaType: string,
): BuildArtifact => {
  const isYaml = /\.ya?ml$/i.test(urlPath);
  return {
    urlPath,
    content: isYaml
      ? stringifyYaml(schema)
      : `${JSON.stringify(schema, null, 2)}\n`,
    contentType: `${mediaType}; charset=utf-8`,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": CACHE_CONTROL,
      Link: `<${urlPath}>; rel="service-desc"; type="${mediaType}"`,
    },
  };
};

const getAutomaticPublicationPath = (
  api: BuildApiDocument,
  discoverableApis: readonly BuildApiDocument[],
) => {
  const apiPaths = new Set(discoverableApis.map((item) => item.apiPath));
  if (apiPaths.size === 1 && discoverableApis.length === 1) {
    return "/openapi.json";
  }

  return joinUrl(
    "/openapi",
    toIdentifierSegment(api.apiPath),
    `${toIdentifierSegment(api.versionPath || api.version)}.json`,
  );
};

const createPublications = (
  context: BuildContributionContext,
): Publication[] => {
  const discoverableApis = context.apis.filter((api) => api.discoverable);

  return discoverableApis.map((api) => {
    if (api.inputType === "url" && api.sourceUrl) {
      return {
        api,
        absoluteUrl: toAbsoluteUrl(context.canonicalOrigin, api.sourceUrl),
        mediaType: getOpenApiMediaType(api, api.sourceUrl),
      };
    }

    const urlPath =
      api.explicitPublicationPath ??
      getAutomaticPublicationPath(api, discoverableApis);
    const absoluteUrl = toAbsoluteUrl(context.canonicalOrigin, urlPath);
    const mediaType = getOpenApiMediaType(api, urlPath);

    if (api.explicitPublicationPath || !api.schema) {
      return { api, urlPath, absoluteUrl, mediaType };
    }

    return {
      api,
      urlPath,
      absoluteUrl,
      mediaType,
      artifact: openApiArtifact(urlPath, api.schema, mediaType),
    };
  });
};

const getServerUrl = (
  schema: OpenApiObject,
  pathItem?: Record<string, unknown>,
  operation?: Record<string, unknown>,
) => {
  const operationServers = operation?.servers;
  const pathServers = pathItem?.servers;
  const servers = Array.isArray(operationServers)
    ? operationServers
    : Array.isArray(pathServers)
      ? pathServers
      : schema.servers;
  const server = servers?.[0];
  return server && typeof server === "object" && typeof server.url === "string"
    ? server.url
    : undefined;
};

const getDeclaredTools = (data: Record<string, unknown>) => {
  const tools = data.tools;
  if (!Array.isArray(tools)) return [];
  return tools.flatMap((tool) =>
    tool && typeof tool === "object" && typeof tool.name === "string"
      ? [{ name: tool.name, description: tool.description }]
      : [],
  );
};

const getRootMcpAuth = (
  data: Record<string, unknown>,
  schema: OpenApiObject,
  server: Record<string, unknown>,
) => {
  const toolSecurity = Array.isArray(data.tools)
    ? data.tools.find(
        (tool) =>
          tool && typeof tool === "object" && Array.isArray(tool.security),
      )?.security
    : undefined;
  const security = Array.isArray(server.security)
    ? server.security
    : Array.isArray(data.security)
      ? data.security
      : toolSecurity;
  const securitySchemes =
    server.securitySchemes && typeof server.securitySchemes === "object"
      ? server.securitySchemes
      : data.securitySchemes && typeof data.securitySchemes === "object"
        ? data.securitySchemes
        : schema.components?.securitySchemes;
  if (!Array.isArray(security) || !securitySchemes) return undefined;

  return resolveMcpAuth({ ...data, ...server, security, securitySchemes });
};

const createMcpEntries = (
  publication: Publication,
  publisher: string,
): { entries: ArdEntry[]; warnings: string[] } => {
  const schema = publication.api.schema as OpenApiObject | undefined;
  const publicationUrl = publication.absoluteUrl ?? publication.urlPath;
  if (!schema || !publicationUrl) {
    return { entries: [], warnings: [] };
  }

  const entries: ArdEntry[] = [];
  const warnings: string[] = [];
  const rootMcp = schema["x-mcp"];

  if (Array.isArray(rootMcp)) {
    warnings.push(
      `Skipped malformed x-mcp extension in API "${publication.api.apiPath}": expected an object, received an array`,
    );
  } else if (
    rootMcp &&
    typeof rootMcp === "object" &&
    (rootMcp as Record<string, unknown>).discoverable === false
  ) {
    // Explicitly excluded from discovery.
  } else if (
    rootMcp &&
    typeof rootMcp === "object" &&
    (typeof (rootMcp as Record<string, unknown>).protocolVersion !== "string" ||
      !(rootMcp as Record<string, unknown>).protocolVersion)
  ) {
    warnings.push(
      `Skipped malformed x-mcp extension in API "${publication.api.apiPath}": protocolVersion is required`,
    );
  } else if (rootMcp && typeof rootMcp === "object") {
    const data = rootMcp as Record<string, unknown>;
    const hasConfiguredServers = Object.hasOwn(data, "servers");
    const configuredServers = hasConfiguredServers
      ? Array.isArray(data.servers)
        ? data.servers
        : []
      : (schema.servers ?? [{ url: "/" }]);
    if (hasConfiguredServers && !Array.isArray(data.servers)) {
      warnings.push(
        `Skipped malformed x-mcp servers in API "${publication.api.apiPath}": expected an array`,
      );
    }
    const tools = getDeclaredTools(data);
    for (const [index, server] of configuredServers.entries()) {
      if (Array.isArray(server)) {
        warnings.push(
          `Skipped malformed x-mcp server ${index + 1} in API "${publication.api.apiPath}": expected an object, received an array`,
        );
        continue;
      }
      if (
        !server ||
        typeof server !== "object" ||
        server.discoverable === false
      ) {
        continue;
      }

      const rawUrl = typeof server.url === "string" ? server.url.trim() : "";
      if (!rawUrl) {
        warnings.push(
          `Skipped x-mcp server ${index + 1} in API "${publication.api.apiPath}" because it has no URL`,
        );
        continue;
      }
      const endpoint = resolvePublicationReference(
        publication,
        hasConfiguredServers
          ? getMcpUrl(getServerUrl(schema) ?? "/", undefined, server)
          : rawUrl,
      );
      const name =
        (typeof server.name === "string" && server.name) ||
        (typeof data.name === "string" && data.name) ||
        (typeof server.title === "string" && server.title) ||
        `${publication.api.title} MCP${configuredServers.length > 1 ? ` ${index + 1}` : ""}`;
      const displayName =
        (typeof server.title === "string" && server.title) || name;
      const identifier = `urn:air:${publisher}:mcp:${toIdentifierSegment(name)}`;
      const resolvedAuth = getRootMcpAuth(data, schema, server);

      entries.push({
        "@context": ARD_CONTEXT,
        identifier,
        displayName,
        type: publication.mediaType,
        url: publicationUrl,
        ...((typeof server.description === "string" && {
          description: server.description,
        }) ||
          (typeof data.description === "string" && {
            description: data.description,
          }) ||
          {}),
        ...(tools.length > 0 && {
          capabilities: tools.map((tool) => tool.name),
        }),
        ...(typeof data.protocolVersion === "string" && {
          version: data.protocolVersion,
        }),
        metadata: {
          resourceType: "mcp-server",
          apiPath: publication.api.apiPath,
          ...(endpoint && { endpoint }),
          ...(resolvedAuth?.authType &&
            resolvedAuth.authType !== "none" && {
              authType: resolvedAuth.authType,
            }),
          ...(resolvedAuth?.auth && {
            authHeader: resolvedAuth.auth.headerName,
          }),
        },
      });
    }
  } else if (rootMcp !== undefined && rootMcp !== false) {
    warnings.push(
      `Skipped malformed x-mcp extension in API "${publication.api.apiPath}": expected an object`,
    );
  }

  for (const [operationPath, pathItem] of Object.entries(schema.paths ?? {})) {
    if (!pathItem || typeof pathItem !== "object") continue;

    for (const [method, rawOperation] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.has(method.toLowerCase())) continue;
      if (!rawOperation || typeof rawOperation !== "object") continue;

      const operation = rawOperation as Record<string, unknown>;
      const data = operation["x-mcp-server"];
      if (Array.isArray(data)) {
        warnings.push(
          `Skipped malformed x-mcp-server extension for ${method.toUpperCase()} ${operationPath}: expected true or an object, received an array`,
        );
        continue;
      }
      if (data === undefined || data === false) continue;
      if (!isMcpServerData(data)) {
        warnings.push(
          `Skipped malformed x-mcp-server extension for ${method.toUpperCase()} ${operationPath}: expected true or an object`,
        );
        continue;
      }
      if (isMcpServerObject(data) && data.discoverable === false) continue;

      const summary =
        typeof operation.summary === "string" ? operation.summary : undefined;
      const operationId =
        typeof operation.operationId === "string"
          ? operation.operationId
          : undefined;
      const name = getMcpServerName(data, summary);
      const title = getMcpServerTitle(data, summary, operationId);
      const serverUrl = getServerUrl(schema, pathItem, operation);
      const endpoint = getMcpUrl(serverUrl ?? "/", operationPath, data);
      const absoluteEndpoint = resolvePublicationReference(
        publication,
        endpoint,
      );
      const tools = getMcpTools(data);
      const resolvedAuth =
        isMcpServerObject(data) &&
        Array.isArray(data.security) &&
        data.security.length > 0 &&
        data.securitySchemes &&
        typeof data.securitySchemes === "object"
          ? resolveMcpAuth(data)
          : undefined;

      entries.push({
        "@context": ARD_CONTEXT,
        identifier: `urn:air:${publisher}:mcp:${toIdentifierSegment(name)}`,
        displayName: title,
        type: publication.mediaType,
        url: publicationUrl,
        ...(typeof operation.description === "string"
          ? { description: operation.description }
          : isMcpServerObject(data) && typeof data.description === "string"
            ? { description: data.description }
            : summary
              ? { description: summary }
              : {}),
        ...(tools.length > 0 && {
          capabilities: tools.map((tool) => tool.name),
        }),
        ...(isMcpServerObject(data) &&
          typeof data.version === "string" && {
            version: data.version,
          }),
        metadata: {
          resourceType: "mcp-server",
          apiPath: publication.api.apiPath,
          operationPath,
          method: method.toUpperCase(),
          ...(absoluteEndpoint && { endpoint: absoluteEndpoint }),
          ...(resolvedAuth?.authType &&
            resolvedAuth.authType !== "none" && {
              authType: resolvedAuth.authType,
            }),
          ...(resolvedAuth?.auth && {
            authHeader: resolvedAuth.auth.headerName,
          }),
        },
      });
    }
  }

  return { entries, warnings };
};

const getApiEndpoint = (publication: Publication) => {
  const schema = publication.api.schema as OpenApiObject | undefined;
  const serverUrl = schema ? getServerUrl(schema) : undefined;
  return resolvePublicationReference(publication, serverUrl ?? "/");
};

const createApiEntry = (
  publication: Publication,
  publisher: string,
): ArdEntry | undefined => {
  if (!publication.absoluteUrl) return undefined;
  const schema = publication.api.schema as OpenApiObject | undefined;
  const tags = schema?.tags?.flatMap((tag) =>
    typeof tag.name === "string" ? [tag.name] : [],
  );
  const siblingVersions = publication.api.versionPath !== "";
  const identifierName = toIdentifierSegment(
    siblingVersions
      ? `${publication.api.apiPath}-${publication.api.versionPath || publication.api.version}`
      : publication.api.apiPath,
  );

  return {
    "@context": ARD_CONTEXT,
    identifier: `urn:air:${publisher}:api:${identifierName}`,
    displayName: publication.api.title,
    type: publication.mediaType,
    url: publication.absoluteUrl,
    ...(publication.api.description && {
      description: publication.api.description,
    }),
    ...(publication.api.version && { version: publication.api.version }),
    ...(tags && tags.length > 0 && { tags }),
    metadata: {
      resourceType: "api",
      apiPath: publication.api.apiPath,
      docsUrl: publication.api.docsPath,
      ...(getApiEndpoint(publication) && {
        endpoint: getApiEndpoint(publication),
      }),
    },
  };
};

/** Runtime validation for the pinned ARD v0.91 shape we emit. */
const validateArdEntries = (entries: readonly ArdEntry[]) => {
  const identifierPattern = /^urn:air:[^:]+:[^:]+:[^:]+$/;

  for (const entry of entries) {
    if (!identifierPattern.test(entry.identifier)) {
      throw new Error(`Invalid ARD v0.91 identifier "${entry.identifier}"`);
    }
    if (!entry.displayName || !entry.type || !entry.url) {
      throw new Error(
        `Invalid ARD v0.91 entry "${entry.identifier}": displayName, type, and url are required`,
      );
    }
    for (const [name, value] of Object.entries(entry.metadata ?? {})) {
      if (
        value !== null &&
        !["string", "number", "boolean"].includes(typeof value)
      ) {
        throw new Error(
          `Invalid ARD v0.91 metadata "${name}" in "${entry.identifier}": values must be scalar`,
        );
      }
    }
  }
};

const assertUniqueEntries = (entries: readonly ArdEntry[]) => {
  const seen = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.identifier)) {
      throw new Error(`Duplicate ARD identifier "${entry.identifier}"`);
    }
    seen.add(entry.identifier);
  }
};

const assertUniquePublications = (publications: readonly Publication[]) => {
  const seen = new Map<string, string>();
  for (const publication of publications) {
    const value = publication.absoluteUrl ?? publication.urlPath;
    if (!value) continue;
    const existing = seen.get(value);
    if (existing) {
      throw new Error(
        `Duplicate OpenAPI publication URL "${value}" for "${existing}" and "${publication.api.apiPath}"`,
      );
    }
    seen.set(value, publication.api.apiPath);
  }
};

export const createAgenticBuildContributions = (
  context: BuildContributionContext,
): BuildContributions => {
  const publications = createPublications(context);
  assertUniquePublications(publications);
  const artifacts = publications.flatMap((publication) =>
    publication.artifact ? [publication.artifact] : [],
  );
  const warnings: string[] = [];

  const canonicalOrigin = context.canonicalOrigin;
  if (!canonicalOrigin) {
    warnings.push(
      "agenticPlugin could not generate origin-bound ARD or RFC 9727 discovery files because canonicalUrlOrigin and Vercel deployment URLs are unavailable",
    );
  }

  const publisher = canonicalOrigin
    ? new URL(canonicalOrigin).hostname
    : "unpublished";
  const mcpResults = publications.map((publication) =>
    createMcpEntries(publication, publisher),
  );
  const mcpEntries = mcpResults.flatMap((result) => result.entries);
  warnings.push(...mcpResults.flatMap((result) => result.warnings));
  const apiLinks: LlmsLink[] = publications.flatMap((publication) => {
    const publicationUrl = publication.absoluteUrl ?? publication.urlPath;
    return publicationUrl
      ? [
          {
            title: publication.api.title,
            url: publicationUrl,
            ...(publication.api.description && {
              description: publication.api.description,
            }),
          },
        ]
      : [];
  });
  const mcpLinks: LlmsLink[] = mcpEntries.map((entry) => ({
    title: entry.displayName,
    url:
      typeof entry.metadata?.endpoint === "string"
        ? entry.metadata.endpoint
        : entry.url,
    ...(entry.description && { description: entry.description }),
  }));
  const llmsSections = [
    ...(apiLinks.length > 0 ? [{ title: "APIs", links: apiLinks }] : []),
    ...(mcpLinks.length > 0 ? [{ title: "MCP Servers", links: mcpLinks }] : []),
  ];
  const publicationRouteHeaders = publications.flatMap((publication) =>
    publication.urlPath && !publication.artifact
      ? [
          {
            urlPath: publication.urlPath,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Cache-Control": CACHE_CONTROL,
              "Content-Type": `${publication.mediaType}; charset=utf-8`,
              Link: `<${publication.urlPath}>; rel="service-desc"; type="${publication.mediaType}"`,
            },
          },
        ]
      : [],
  );

  if (!canonicalOrigin) {
    return {
      artifacts,
      routeHeaders: publicationRouteHeaders,
      llmsSections,
      warnings,
    };
  }

  const apiEntries = publications.flatMap((publication) => {
    const entry = createApiEntry(publication, publisher);
    return entry ? [entry] : [];
  });
  warnings.push(
    ...mcpEntries.flatMap((entry) =>
      entry.capabilities
        ? []
        : [
            `MCP server "${entry.displayName}" does not declare a tool list; ARD capabilities were omitted rather than inferred`,
          ],
    ),
  );
  const entries = [...apiEntries, ...mcpEntries];
  assertUniqueEntries(entries);
  validateArdEntries(entries);

  if (entries.length > 0) {
    warnings.push(
      `Generated ${entries.length} ARD entr${entries.length === 1 ? "y" : "ies"} without representativeQueries; the ARD v0.91 conformance tool reports this as a discovery warning`,
    );
  }

  const ardPath = joinUrl(context.basePath, "/.well-known/ard.json");
  const apiCatalogPath = joinUrl(context.basePath, "/.well-known/api-catalog");
  const publicArdPath = "/.well-known/ard.json";
  const publicApiCatalogPath = "/.well-known/api-catalog";
  const ardUrl = new URL(publicArdPath, canonicalOrigin).toString();
  const apiCatalogUrl = new URL(
    publicApiCatalogPath,
    canonicalOrigin,
  ).toString();
  const serviceLinksets = publications.flatMap((publication) => {
    if (!publication.absoluteUrl) return [];

    const docsUrl = new URL(
      publication.api.docsPath,
      canonicalOrigin,
    ).toString();
    const anchor =
      getApiEndpoint(publication) ?? new URL("/", canonicalOrigin).toString();
    return [
      {
        anchor,
        "service-desc": [
          {
            href: publication.absoluteUrl,
            type: publication.mediaType,
          },
        ],
        "service-doc": [{ href: docsUrl, type: "text/html" }],
      },
    ];
  });
  const linkset = [
    {
      anchor: apiCatalogUrl,
      item: serviceLinksets.map((service) => ({ href: service.anchor })),
    },
    ...serviceLinksets,
  ];

  artifacts.push(
    jsonArtifact(
      ardPath,
      { entries },
      ARD_MEDIA_TYPE,
      `<${ardUrl}>; rel="ard"; type="application/json"`,
    ),
    jsonArtifact(
      apiCatalogPath,
      { linkset },
      API_CATALOG_MEDIA_TYPE,
      `<${apiCatalogUrl}>; rel="api-catalog"; type="application/linkset+json"`,
    ),
  );

  return {
    artifacts,
    aliases: [
      ...(ardPath !== publicArdPath
        ? [{ sourcePath: publicArdPath, destinationPath: ardPath }]
        : []),
      ...(apiCatalogPath !== publicApiCatalogPath
        ? [
            {
              sourcePath: publicApiCatalogPath,
              destinationPath: apiCatalogPath,
            },
          ]
        : []),
    ],
    routeHeaders: [
      ...publicationRouteHeaders,
      {
        urlPath: joinUrl(context.basePath),
        headers: {
          Link: `<${ardUrl}>; rel="ard"; type="application/json", <${apiCatalogUrl}>; rel="api-catalog"; type="application/linkset+json"`,
        },
      },
    ],
    llmsSections,
    warnings,
  };
};

export default createAgenticBuildContributions;
