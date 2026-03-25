// Mostly adapted from https://github.com/moxystudio/js-proper-url-join
const defaultUrlRegExp = /^(\w+:\/\/[^/?]+)?([^?]*)(\?.*)?$/;

const normalizeParts = (
  parts: (string | number | null | undefined | false)[],
): string[] =>
  parts
    .filter(
      (part): part is string | number =>
        part !== null &&
        part !== undefined &&
        part !== false &&
        (typeof part === "string" || typeof part === "number"),
    )
    .map((part) => `${part}`)
    .filter((part) => part);

interface ParsedParts {
  prefix: string;
  pathname: string[];
  query: string;
}

const parseParts = (parts: string[]): ParsedParts => {
  const partsStr = parts.join("/");
  const [, prefix = "", pathname = "", query = ""] =
    partsStr.match(defaultUrlRegExp) ?? [];

  return {
    prefix,
    pathname: pathname.split("/").filter((part) => part !== ""),
    query,
  };
};

const buildUrl = (parsedParts: ParsedParts): string => {
  const { prefix, pathname, query } = parsedParts;
  let url = prefix;

  if (pathname.length > 0) {
    if (url) {
      url += "/";
    } else {
      url = "/";
    }
    url += pathname.join("/");
  } else if (!url) {
    url = "/";
  }

  return url + query;
};

export const joinUrl = (
  ...parts: Array<string | number | null | undefined | false>
): string => {
  const normalizedParts = normalizeParts(parts);
  const parsedParts = parseParts(normalizedParts);
  return buildUrl(parsedParts);
};
