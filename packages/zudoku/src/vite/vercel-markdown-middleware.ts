export type GenerateVercelMarkdownMiddlewareOptions = {
  /** Deployment base path, for example `/docs`. */
  basePath?: string;
  /** Canonical document routes relative to `basePath`. */
  knownCanonicalRoutePaths: readonly string[];
  /** Routes with a generated `.md` representation, relative to `basePath`. */
  markdownCanonicalRoutePaths: readonly string[];
  /** Recovery document returned for negotiated Markdown 404 responses. */
  markdownNotFoundBody: string;
  /** Absolute static file paths that must bypass document negotiation. */
  passthroughPaths?: readonly string[];
};

const normalizePath = (value: string) => {
  const pathname = value
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      try {
        return encodeURIComponent(decodeURIComponent(segment));
      } catch {
        return encodeURIComponent(segment);
      }
    })
    .join("/");
  return pathname ? `/${pathname}` : "/";
};

const resolveRoutePath = (basePath: string, routePath: string) => {
  const normalizedRoutePath = normalizePath(routePath);
  if (normalizedRoutePath === "/") {
    return basePath;
  }
  return normalizePath(`${basePath}/${normalizedRoutePath}`);
};

const resolveMarkdownPath = (basePath: string, routePath: string) => {
  const normalizedRoutePath = normalizePath(routePath);
  if (normalizedRoutePath === "/") {
    return normalizePath(`${basePath}/index.md`);
  }
  return `${resolveRoutePath(basePath, routePath)}.md`;
};

/**
 * Generates the dependency-free ESM source used by Zudoku's Vercel Routing
 * Middleware. The source uses the raw Build Output API middleware response
 * headers so it can run without `@vercel/functions` in an Edge function.
 */
export const generateVercelMarkdownMiddleware = ({
  basePath = "/",
  knownCanonicalRoutePaths,
  markdownCanonicalRoutePaths,
  markdownNotFoundBody,
  passthroughPaths = [],
}: GenerateVercelMarkdownMiddlewareOptions): string => {
  const normalizedBasePath = normalizePath(basePath);
  const knownRoutes = new Set(
    knownCanonicalRoutePaths.map((routePath) =>
      resolveRoutePath(normalizedBasePath, routePath),
    ),
  );
  const markdownRoutes = new Map(
    markdownCanonicalRoutePaths.map((routePath) => [
      resolveRoutePath(normalizedBasePath, routePath),
      resolveMarkdownPath(normalizedBasePath, routePath),
    ]),
  );
  const normalizedPassthroughPaths = passthroughPaths.map(normalizePath);

  for (const routePath of markdownRoutes.keys()) {
    if (!knownRoutes.has(routePath)) {
      throw new Error(
        `Markdown route "${routePath}" is not present in knownCanonicalRoutePaths`,
      );
    }
  }

  return `
const BASE_PATH = ${JSON.stringify(normalizedBasePath)};
const KNOWN_ROUTES = new Set(${JSON.stringify([...knownRoutes])});
const MARKDOWN_ROUTES = new Map(${JSON.stringify([...markdownRoutes])});
const PASSTHROUGH_PATHS = new Set(${JSON.stringify(normalizedPassthroughPaths)});
const MARKDOWN_NOT_FOUND_BODY = ${JSON.stringify(markdownNotFoundBody)};
const NEGOTIATED_VARY = "Accept, Accept-Encoding";

const REPRESENTATIONS = [
  {
    contentType: "text/html",
    type: "text",
    subtype: "html",
    parameters: { charset: "utf-8" },
    serverOrder: 0,
  },
  {
    contentType: "text/markdown",
    type: "text",
    subtype: "markdown",
    parameters: { charset: "utf-8" },
    serverOrder: 1,
  },
];

const TOKEN_PATTERN = /^[!#$%&'*+\\-.^_\`|~0-9A-Za-z]+$/;
const MEDIA_RANGE_PATTERN =
  /^([!#$%&'*+\\-.^_\`|~0-9A-Za-z]+|\\*)\\/([!#$%&'*+\\-.^_\`|~0-9A-Za-z]+|\\*)$/;
const QUALITY_PATTERN = /^(?:0(?:\\.[0-9]{0,3})?|1(?:\\.0{0,3})?)$/;

const splitOutsideQuotes = (value, delimiter) => {
  const parts = [];
  let start = 0;
  let quoted = false;
  let escaped = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (quoted && character === "\\\\") {
      escaped = true;
      continue;
    }
    if (character === '"') {
      quoted = !quoted;
      continue;
    }
    if (!quoted && character === delimiter) {
      parts.push(value.slice(start, index));
      start = index + 1;
    }
  }

  parts.push(value.slice(start));
  return parts;
};

const parseParameterValue = (value) => {
  const trimmedValue = value.trim();
  if (TOKEN_PATTERN.test(trimmedValue)) {
    return trimmedValue.toLowerCase();
  }
  if (!trimmedValue.startsWith('"') || !trimmedValue.endsWith('"')) {
    return undefined;
  }
  return trimmedValue.slice(1, -1).replace(/\\\\(.)/g, "$1").toLowerCase();
};

const parseMediaRange = (value, order) => {
  const [rawMediaRange, ...rawParameters] = splitOutsideQuotes(value, ";");
  const mediaRangeMatch = rawMediaRange
    ?.trim()
    .toLowerCase()
    .match(MEDIA_RANGE_PATTERN);
  if (!mediaRangeMatch) return undefined;

  const [, type, subtype] = mediaRangeMatch;
  if (!type || !subtype || (type === "*" && subtype !== "*")) {
    return undefined;
  }

  const parameters = new Map();
  let quality = 1;
  let foundQuality = false;

  for (const rawParameter of rawParameters) {
    const separatorIndex = rawParameter.indexOf("=");
    if (separatorIndex === -1) return undefined;

    const name = rawParameter.slice(0, separatorIndex).trim().toLowerCase();
    const rawValue = rawParameter.slice(separatorIndex + 1).trim();
    if (!TOKEN_PATTERN.test(name)) return undefined;

    if (name === "q") {
      if (foundQuality || !QUALITY_PATTERN.test(rawValue)) return undefined;
      quality = Number(rawValue);
      foundQuality = true;
      continue;
    }

    if (foundQuality) continue;

    const parameterValue = parseParameterValue(rawValue);
    if (parameterValue === undefined || parameters.has(name)) return undefined;
    parameters.set(name, parameterValue);
  }

  return { type, subtype, parameters, quality, order };
};

const getSpecificity = (range) => {
  if (range.type === "*") return 0;
  if (range.subtype === "*") return 1;
  return 2;
};

const matchesRepresentation = (range, representation) => {
  if (range.type !== "*" && range.type !== representation.type) return false;
  if (range.subtype !== "*" && range.subtype !== representation.subtype) {
    return false;
  }
  return [...range.parameters].every(
    ([name, value]) => representation.parameters[name]?.toLowerCase() === value,
  );
};

const compareRangeMatches = (left, right) =>
  right.specificity - left.specificity ||
  right.parameterCount - left.parameterCount ||
  right.quality - left.quality ||
  left.rangeOrder - right.rangeOrder;

const getRepresentationMatch = (ranges, representation) =>
  ranges
    .filter((range) => matchesRepresentation(range, representation))
    .map((range) => ({
      contentType: representation.contentType,
      quality: range.quality,
      specificity: getSpecificity(range),
      parameterCount: range.parameters.size,
      rangeOrder: range.order,
      serverOrder: representation.serverOrder,
    }))
    .sort(compareRangeMatches)[0];

const compareRepresentations = (left, right) =>
  right.quality - left.quality ||
  right.specificity - left.specificity ||
  right.parameterCount - left.parameterCount ||
  left.rangeOrder - right.rangeOrder ||
  left.serverOrder - right.serverOrder;

const negotiateContentType = (acceptHeader) => {
  if (!acceptHeader?.trim()) return "text/html";

  const ranges = splitOutsideQuotes(acceptHeader, ",")
    .map((value, order) => parseMediaRange(value.trim(), order))
    .filter((range) => range !== undefined);
  const match = REPRESENTATIONS
    .map((representation) => getRepresentationMatch(ranges, representation))
    .filter((result) => result !== undefined)
    .filter((result) => result.quality > 0)
    .sort(compareRepresentations)[0];
  return match?.contentType ?? null;
};

const normalizeRequestPath = (pathname) => {
  const normalized = pathname.replace(/\\/+$/, "");
  return normalized || "/";
};

const isWithinBasePath = (pathname) =>
  BASE_PATH === "/" || pathname === BASE_PATH || pathname.startsWith(BASE_PATH + "/");

const isExtensionlessPath = (pathname) => {
  const lastSegment = pathname.split("/").filter(Boolean).at(-1);
  return lastSegment === undefined || !lastSegment.includes(".");
};

const isMarkdownPath = (pathname) =>
  pathname.endsWith(".md") || pathname.endsWith(".mdx");

const getAlternateLink = (markdownPath) =>
  "<" + markdownPath + '>; rel="alternate"; type="text/markdown"';

const continueRequest = (headers = undefined) => {
  const response = new Response(null);
  response.headers.set("x-middleware-next", "1");
  if (headers) {
    for (const [name, value] of Object.entries(headers)) {
      response.headers.set(name, value);
    }
  }
  return response;
};

const negotiatedHeaders = (markdownPath) => ({
  Vary: NEGOTIATED_VARY,
  Link: getAlternateLink(markdownPath),
});

export default function middleware(request) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return continueRequest();
  }

  const requestUrl = new URL(request.url);
  const pathname = normalizeRequestPath(requestUrl.pathname);
  const markdownPath = MARKDOWN_ROUTES.get(pathname);

  if (markdownPath) {
    const negotiatedType = negotiateContentType(request.headers.get("Accept"));
    const headers = negotiatedHeaders(markdownPath);

    if (negotiatedType === null) {
      return new Response(request.method === "HEAD" ? null : "Not Acceptable", {
        status: 406,
        headers: {
          ...headers,
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }

    if (negotiatedType === "text/html") {
      return continueRequest(headers);
    }

    requestUrl.pathname = markdownPath;
    return new Response(null, {
      headers: {
        ...headers,
        "Content-Type": "text/markdown; charset=utf-8",
        "x-middleware-rewrite": requestUrl.toString(),
      },
    });
  }

  if (KNOWN_ROUTES.has(pathname) || PASSTHROUGH_PATHS.has(pathname)) {
    return continueRequest();
  }

  if (isWithinBasePath(pathname) && isMarkdownPath(pathname)) {
    return new Response(
      request.method === "HEAD" ? null : MARKDOWN_NOT_FOUND_BODY,
      {
        status: 404,
        headers: { "Content-Type": "text/markdown; charset=utf-8" },
      },
    );
  }

  if (!isWithinBasePath(pathname) || !isExtensionlessPath(pathname)) {
    return continueRequest();
  }

  const negotiatedType = negotiateContentType(request.headers.get("Accept"));
  if (negotiatedType === null) {
    return new Response(request.method === "HEAD" ? null : "Not Acceptable", {
      status: 406,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        Vary: NEGOTIATED_VARY,
      },
    });
  }

  if (negotiatedType === "text/html") {
    return continueRequest({ Vary: NEGOTIATED_VARY });
  }

  return new Response(
    request.method === "HEAD" ? null : MARKDOWN_NOT_FOUND_BODY,
    {
      status: 404,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        Vary: NEGOTIATED_VARY,
      },
    },
  );
}
`.trimStart();
};
