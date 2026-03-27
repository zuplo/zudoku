import type { PlaygroundForm } from "./Playground.js";

export const parseArrayParamValue = (value: string): string[] => {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [value];
  } catch {
    return [value];
  }
};

// RFC 3986 reserved characters that should be kept unencoded when allowReserved
// is true. # and & are excluded since they have structural meaning in query strings.
// gen-delims (minus # and &): : / ? @ [ ]
// sub-delims: ! $ ' ( ) * + , ; =
const RFC3986_RESERVED_PERCENT_ENCODED =
  /%21|%27|%28|%29|%2A|%2B|%2C|%2F|%3A|%3B|%3D|%3F|%24|%40|%5B|%5D/gi;

const encode = (value: string, allowReserved?: boolean): string => {
  if (allowReserved) {
    return encodeURIComponent(value).replace(
      RFC3986_RESERVED_PERCENT_ENCODED,
      decodeURIComponent,
    );
  }
  return encodeURIComponent(value);
};

export const serializeQueryParam = (
  name: string,
  value: string,
  style = "form",
  explode?: boolean,
  allowReserved?: boolean,
  type?: string,
): [string, string][] => {
  const isArray = type === "array";

  // Default explode to true for form style per OAS spec
  const shouldExplode = explode ?? style === "form";

  if (!isArray) {
    return [[encode(name, allowReserved), encode(value, allowReserved)]];
  }

  const values = parseArrayParamValue(value);
  if (values.length === 0) return [];

  switch (style) {
    case "form":
      if (shouldExplode) {
        // key=1&key=2
        return values.map((v) => [
          encode(name, allowReserved),
          encode(v, allowReserved),
        ]);
      }
      // key=1,2
      return [
        [
          encode(name, allowReserved),
          values.map((v) => encode(v, allowReserved)).join(","),
        ],
      ];

    case "spaceDelimited":
      if (shouldExplode) {
        return values.map((v) => [
          encode(name, allowReserved),
          encode(v, allowReserved),
        ]);
      }
      return [
        [
          encode(name, allowReserved),
          values.map((v) => encode(v, allowReserved)).join("%20"),
        ],
      ];

    case "pipeDelimited":
      if (shouldExplode) {
        return values.map((v) => [
          encode(name, allowReserved),
          encode(v, allowReserved),
        ]);
      }
      return [
        [
          encode(name, allowReserved),
          values.map((v) => encode(v, allowReserved)).join("|"),
        ],
      ];

    case "deepObject":
      // key[0]=1&key[1]=2
      return values.map((v, i) => [
        encode(`${name}[${i}]`, allowReserved),
        encode(v, allowReserved),
      ]);

    default:
      return [[encode(name, allowReserved), encode(value, allowReserved)]];
  }
};

export const serializeQueryString = (
  params: PlaygroundForm["queryParams"],
): string => {
  const pairs = params
    .filter((p) => p.active && p.name)
    .flatMap((p) =>
      serializeQueryParam(
        p.name,
        p.value,
        p.style,
        p.explode,
        p.allowReserved,
        p.type,
      ),
    );

  if (pairs.length === 0) return "";
  return pairs.map(([k, v]) => `${k}=${v}`).join("&");
};
