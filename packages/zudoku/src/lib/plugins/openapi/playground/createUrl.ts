import type { PlaygroundForm } from "./Playground.js";
import { serializeQueryString } from "./serializeQueryParams.js";

// `{name}` as in OpenAPI paths (same pattern as PathRenderer), or Express-style
// `:name` at the start of a segment. A colon inside a segment, as in
// `/users:check_login`, is literal.
const PATH_PARAM = /\{([^}]+)\}|(^|\/):(\w+)/g;

export const createUrl = (host: string, path: string, data: PlaygroundForm) => {
  const filledPath = path.replace(
    PATH_PARAM,
    (match, braceName?: string, slash = "", colonName?: string) => {
      const value = data.pathParams.find(
        (param) => param.name === (braceName ?? colonName),
      )?.value;

      // Unfilled params keep their placeholder, like the URL shown in the UI.
      // Values are encoded so `/`, `?` or `#` in them stay in their segment.
      return value ? `${slash}${encodeURIComponent(value)}` : match;
    },
  );

  // Relative servers (and "" when the spec has none) resolve against the page.
  const url = new URL(
    host || "/",
    typeof window === "undefined" ? undefined : window.location.href,
  );

  // Append the path to the server's path rather than resolving it as a
  // relative URL, which could replace the server path or host.
  const [pathname = "", ...pathQuery] = filledPath.split("?");
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/${pathname.replace(/^\/+/, "")}`;
  url.search = [
    url.search.slice(1),
    pathQuery.join("?"),
    serializeQueryString(data.queryParams),
  ]
    .filter(Boolean)
    .join("&");

  return url;
};
