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
// unknown to `from` are left untouched.
const replaceTokens = (
  to: string,
  names: string[],
  replace: (name: string) => string,
) =>
  to.replace(TOKEN_REGEX, (token, name: string | undefined) => {
    const key = name ?? SPLAT;
    return names.includes(key) ? replace(key) : token;
  });

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

// Mirrors React Router's `computeScore`. Build Output routes match top to
// bottom, so they must be ordered the way the router ranks the same paths.
const rankPath = (path: string) => {
  const segments = joinUrl(path).split("/");
  return segments.reduce(
    (score, segment) => {
      if (segment === SPLAT) return score;
      if (/^:[\w-]+\??$/.test(segment)) return score + 3;
      return score + (segment === "" ? 1 : 10);
    },
    segments.length - (segments.includes(SPLAT) ? 2 : 0),
  );
};

// Most specific first; ties keep configuration order, like the router.
export const sortByRouteRank = <T extends Pick<Redirect, "from">>(
  redirects: readonly T[],
) => redirects.toSorted((a, b) => rankPath(b.from) - rankPath(a.from));

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Converts a dynamic redirect into a Build Output API route: `from` becomes a
 * regex with one capture group per param (including its leading slash) and the
 * tokens in `to` become the matching `$n` references.
 */
export const toBuildOutputRedirect = (
  redirect: Redirect,
  basePath?: string,
) => {
  const names = getParamNames(redirect.from);
  const segments = parseSegments(joinUrl(basePath, redirect.from));
  const pattern = segments
    .map((segment) => {
      if (segment.type === "static") return `/${escapeRegex(segment.value)}`;
      if (segment.type === "splat") return "(/.*)?";
      return segment.optional ? "(/[^/]+)?" : "(/[^/]+)";
    })
    .join("");
  const endsWithSplat = segments.at(-1)?.type === "splat";

  const to = ABSOLUTE_URL_REGEX.test(redirect.to)
    ? redirect.to
    : joinUrl(basePath, redirect.to);
  const location = replaceTokens(
    to,
    names,
    (name) => `$${names.indexOf(name) + 1}`,
  );

  return {
    src: `^${pattern}${endsWithSplat ? "" : "/?"}$`,
    location,
  };
};
