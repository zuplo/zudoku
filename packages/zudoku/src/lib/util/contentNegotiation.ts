export type NegotiatedContentType = "text/html" | "text/markdown";

type Representation = {
  contentType: NegotiatedContentType;
  type: string;
  subtype: string;
  parameters: Readonly<Record<string, string>>;
  serverOrder: number;
};

type MediaRange = {
  type: string;
  subtype: string;
  parameters: ReadonlyMap<string, string>;
  quality: number;
  order: number;
};

type Match = {
  contentType: NegotiatedContentType;
  quality: number;
  specificity: number;
  parameterCount: number;
  rangeOrder: number;
  serverOrder: number;
};

const representations: readonly Representation[] = [
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

const tokenPattern = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
const mediaRangePattern =
  /^([!#$%&'*+\-.^_`|~0-9A-Za-z]+|\*)\/([!#$%&'*+\-.^_`|~0-9A-Za-z]+|\*)$/;
const qualityPattern = /^(?:0(?:\.[0-9]{0,3})?|1(?:\.0{0,3})?)$/;

const splitOutsideQuotes = (value: string, delimiter: string): string[] => {
  const parts: string[] = [];
  let start = 0;
  let quoted = false;
  let escaped = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (quoted && character === "\\") {
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

const parseParameterValue = (value: string): string | undefined => {
  const trimmedValue = value.trim();

  if (tokenPattern.test(trimmedValue)) {
    return trimmedValue.toLowerCase();
  }

  if (!trimmedValue.startsWith('"') || !trimmedValue.endsWith('"')) {
    return undefined;
  }

  const innerValue = trimmedValue.slice(1, -1);
  return innerValue.replace(/\\(.)/g, "$1").toLowerCase();
};

const parseMediaRange = (
  value: string,
  order: number,
): MediaRange | undefined => {
  const [rawMediaRange, ...rawParameters] = splitOutsideQuotes(value, ";");
  const mediaRangeMatch = rawMediaRange
    ?.trim()
    .toLowerCase()
    .match(mediaRangePattern);

  if (!mediaRangeMatch) {
    return undefined;
  }

  const [, type, subtype] = mediaRangeMatch;
  if (!type || !subtype || (type === "*" && subtype !== "*")) {
    return undefined;
  }

  const parameters = new Map<string, string>();
  let quality = 1;
  let foundQuality = false;

  for (const rawParameter of rawParameters) {
    const separatorIndex = rawParameter.indexOf("=");
    if (separatorIndex === -1) {
      return undefined;
    }

    const name = rawParameter.slice(0, separatorIndex).trim().toLowerCase();
    const rawValue = rawParameter.slice(separatorIndex + 1).trim();

    if (!tokenPattern.test(name)) {
      return undefined;
    }

    if (name === "q") {
      if (foundQuality || !qualityPattern.test(rawValue)) {
        return undefined;
      }

      quality = Number(rawValue);
      foundQuality = true;
      continue;
    }

    // Parameters following q are accept extensions, not media type parameters.
    if (foundQuality) {
      continue;
    }

    const parameterValue = parseParameterValue(rawValue);
    if (parameterValue === undefined || parameters.has(name)) {
      return undefined;
    }
    parameters.set(name, parameterValue);
  }

  return { type, subtype, parameters, quality, order };
};

const getSpecificity = (range: MediaRange): number => {
  if (range.type === "*") {
    return 0;
  }
  if (range.subtype === "*") {
    return 1;
  }
  return 2;
};

const matchesRepresentation = (
  range: MediaRange,
  representation: Representation,
): boolean => {
  if (range.type !== "*" && range.type !== representation.type) {
    return false;
  }
  if (range.subtype !== "*" && range.subtype !== representation.subtype) {
    return false;
  }

  return [...range.parameters].every(
    ([name, value]) => representation.parameters[name]?.toLowerCase() === value,
  );
};

const compareRangeMatches = (left: Match, right: Match): number =>
  right.specificity - left.specificity ||
  right.parameterCount - left.parameterCount ||
  right.quality - left.quality ||
  left.rangeOrder - right.rangeOrder;

const getRepresentationMatch = (
  ranges: readonly MediaRange[],
  representation: Representation,
): Match | undefined =>
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

const compareRepresentations = (left: Match, right: Match): number =>
  right.quality - left.quality ||
  right.specificity - left.specificity ||
  right.parameterCount - left.parameterCount ||
  left.rangeOrder - right.rangeOrder ||
  left.serverOrder - right.serverOrder;

/**
 * Selects between Zudoku's HTML and Markdown representations using the
 * request's Accept header. A null result means neither representation is
 * acceptable and the caller can respond with 406 Not Acceptable.
 */
export const negotiateContentType = (
  acceptHeader: string | null | undefined,
): NegotiatedContentType | null => {
  if (!acceptHeader?.trim()) {
    return "text/html";
  }

  const ranges = splitOutsideQuotes(acceptHeader, ",")
    .map((value, order) => parseMediaRange(value.trim(), order))
    .filter((range): range is MediaRange => range !== undefined);

  const match = representations
    .map((representation) => getRepresentationMatch(ranges, representation))
    .filter((result): result is Match => result !== undefined)
    .filter((result) => result.quality > 0)
    .sort(compareRepresentations)[0];

  return match?.contentType ?? null;
};

/** Adds Accept to a Vary header without discarding or duplicating fields. */
export const addAcceptToVary = (
  varyHeader: string | null | undefined,
): string => {
  const fields = (varyHeader ?? "")
    .split(",")
    .map((field) => field.trim())
    .filter(Boolean);

  if (fields.some((field) => field === "*")) {
    return "*";
  }

  const seenFields = new Set<string>();
  const uniqueFields = fields.filter((field) => {
    const normalizedField = field.toLowerCase();
    if (seenFields.has(normalizedField)) {
      return false;
    }
    seenFields.add(normalizedField);
    return true;
  });

  if (!seenFields.has("accept")) {
    uniqueFields.push("Accept");
  }

  return uniqueFields.join(", ");
};
