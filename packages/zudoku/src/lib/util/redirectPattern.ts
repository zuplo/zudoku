import { joinUrl } from "./joinUrl.js";

type Redirect = { from: string; to: string };

type Segment =
  | { type: "static"; value: string }
  | { type: "param"; name: string; optional: boolean }
  | { type: "splat" };

const SPLAT = "*";
// React Router's own check for URLs that leave the app
const ABSOLUTE_URL_REGEX = /^(?:[a-z][a-z0-9+.-]*:|[\\/]{2})/i;
// A `/:param` or `/*` token that spans a whole path segment
const TOKEN_REGEX = /\/(?::([\w-]+)|\*)(?=[/?#]|$)/g;

// Parses a `from` path using React Router's syntax: `:param`, `:param?` and a
// trailing `*` splat.
const parseSegments = (path: string): Segment[] => {
  const parts = path.split("/").filter(Boolean);
  return parts.map((part, index): Segment => {
    if (part === SPLAT && index === parts.length - 1) return { type: "splat" };
    const match = part.match(/^:([\w-]+)(\?)?$/);
    if (!match?.[1]) return { type: "static", value: part };
    return { type: "param", name: match[1], optional: match[2] === "?" };
  });
};

const getParamNames = (from: string) =>
  parseSegments(from).flatMap((segment) => {
    if (segment.type === "param") return [segment.name];
    if (segment.type === "splat") return [SPLAT];
    return [];
  });

export const isDynamicRedirect = (redirect: Pick<Redirect, "from">) =>
  getParamNames(redirect.from).length > 0;

// Replaces the `/:param` and `/*` tokens in `to` that `from` defines. Tokens
// unknown to `from` are left untouched. Removing empty params can leave no path
// at all (`/*` for `/v1/*` at `/v1`), which would redirect back to the same
// URL, so that falls back to the root. A `to` without replaced tokens is kept
// as written, so relative targets like `?tab=2` still work.
const replaceTokens = (
  to: string,
  names: string[],
  replace: (name: string) => string,
) => {
  const target = to.replace(TOKEN_REGEX, (token, name: string | undefined) => {
    const key = name ?? SPLAT;
    return names.includes(key) ? replace(key) : token;
  });
  const lostPath = target === "" || /^[?#]/.test(target);
  return target !== to && lostPath ? `/${target}` : target;
};

const encodeParam = (name: string, value: string) =>
  name === SPLAT
    ? value.split("/").map(encodeURIComponent).join("/")
    : encodeURIComponent(value);

/**
 * Builds the redirect target for a matched `from` path by substituting the
 * matched params into `to`, e.g. `{ from: "/blog/:slug", to: "/posts/:slug" }`
 * sends `/blog/hello` to `/posts/hello`. Empty params drop their segment.
 */
export const resolveRedirectTarget = (
  { from, to }: Redirect,
  params: Record<string, string | undefined>,
) =>
  replaceTokens(to, getParamNames(from), (name) => {
    const value = params[name];
    return value ? `/${encodeParam(name, value)}` : "";
  });

// Mirrors React Router's `computeScore` for a concrete (non-optional) path.
const rankPath = (path: string) => {
  const segments = joinUrl(path).split("/");
  return segments.reduce(
    (score, segment) => {
      if (segment === SPLAT) return score;
      if (segment.startsWith(":")) return score + 3;
      return score + (segment === "" ? 1 : 10);
    },
    segments.length - (segments.includes(SPLAT) ? 2 : 0),
  );
};

const segmentToPath = (segment: Segment) => {
  if (segment.type === "static") return segment.value;
  if (segment.type === "splat") return SPLAT;
  return `:${segment.name}`;
};

// React Router ranks each concrete variant of a path with optional segments,
// in this order: `/:a?/:b?` becomes `/:a/:b`, `/:a`, `/:b` and `/`.
const explodeOptional = (segments: Segment[]): Segment[][] => {
  const [first, ...rest] = segments;
  if (!first) return [[]];
  const variants = explodeOptional(rest);
  const withFirst = variants.map((variant) => [first, ...variant]);
  return first.type === "param" && first.optional
    ? [...withFirst, ...variants]
    : withFirst;
};

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Converts dynamic redirects into Build Output API routes. Each concrete
 * variant of a `from` path becomes a regex with one capture group per param
 * (including its leading slash), and the tokens in `to` become the matching
 * `$n` references. Build Output routes match top to bottom, so they are sorted
 * the way React Router ranks the same paths, keeping configuration order for
 * ties.
 */
export const toBuildOutputRedirects = (
  redirects: readonly Redirect[],
  basePath?: string,
) => {
  const base = joinUrl(basePath);
  const prefix = base === "/" ? "" : escapeRegex(base);

  return redirects
    .flatMap((redirect) => {
      const names = getParamNames(redirect.from);
      const to = ABSOLUTE_URL_REGEX.test(redirect.to)
        ? redirect.to
        : joinUrl(basePath, redirect.to);

      const toRoute = (segments: Segment[]) => {
        const captured = segments.flatMap((segment) => {
          if (segment.type === "param") return [segment.name];
          if (segment.type === "splat") return [SPLAT];
          return [];
        });
        const pattern = segments
          .map((segment) => {
            if (segment.type === "static") {
              return `/${escapeRegex(segment.value)}`;
            }
            return segment.type === "splat" ? "(/.+)" : "(/[^/]+)";
          })
          .join("");
        const endsWithSplat = segments.at(-1)?.type === "splat";

        return {
          // React Router accepts any number of trailing slashes
          src: `^${prefix}${pattern}${endsWithSplat ? "" : "/*"}$`,
          // Like React Router, a repeated param name takes the last value
          location: replaceTokens(to, names, (name) =>
            captured.includes(name) ? `$${captured.lastIndexOf(name) + 1}` : "",
          ),
        };
      };

      return explodeOptional(parseSegments(redirect.from)).flatMap(
        (segments) => {
          const rank = rankPath(`/${segments.map(segmentToPath).join("/")}`);
          // An empty splat gets its own route so its target is resolved here
          // rather than from an empty `$n` at request time
          const variants =
            segments.at(-1)?.type === "splat"
              ? [segments, segments.slice(0, -1)]
              : [segments];
          return variants.map((variant) => ({ rank, ...toRoute(variant) }));
        },
      );
    })
    .toSorted((a, b) => b.rank - a.rank)
    .map(({ src, location }) => ({ src, location }));
};

// Whitespace, control characters and invisible format characters such as
// U+00A0 (no-break space), U+200B (zero-width space) or U+FEFF (BOM). They
// usually come from copy-pasting, never match a request, and some hosts reject
// them when deploying.
const UNSAFE_CHAR_REGEX = /[\s\p{Cc}\p{Cf}]/u;
const ALLOWED_URL_PROTOCOLS = new Set(["http:", "https:"]);

const describeChar = (char: string) =>
  `U+${(char.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, "0")}`;

/**
 * Checks a redirect `from` or `to` value and returns an error message, or
 * `undefined` when it's valid. `from` is a React Router path pattern and `to`
 * can be a path, a relative reference (`?tab=2`, `#section`) or an absolute
 * URL, so neither is parsed as a URL as a whole. Absolute targets must be
 * valid http(s) URLs.
 */
export const getRedirectPathError = (
  path: string,
  field: "from" | "to",
): string | undefined => {
  const unsafe = path.match(UNSAFE_CHAR_REGEX);
  if (unsafe?.[0] !== undefined) {
    const char = unsafe[0];
    const hint = char === " " ? " Use %20 for a space in a URL." : "";
    return `Redirect \`${field}\` ${JSON.stringify(path)} contains ${describeChar(char)} at position ${unsafe.index}. Remove it.${hint}`;
  }

  if (field === "to" && ABSOLUTE_URL_REGEX.test(path)) {
    let url: URL;
    try {
      url = new URL(path, "https://zudoku.invalid");
    } catch {
      return `Redirect \`to\` ${JSON.stringify(path)} is not a valid URL.`;
    }
    if (!ALLOWED_URL_PROTOCOLS.has(url.protocol)) {
      return `Redirect \`to\` ${JSON.stringify(path)} uses ${url.protocol}. Only http: and https: URLs are allowed.`;
    }
  }

  return undefined;
};
