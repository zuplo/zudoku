/**
 * RFC 9457 - Problem Details for HTTP APIs
 * https://www.rfc-editor.org/rfc/rfc9457.html
 */

const PROBLEM_JSON_CONTENT_TYPE = "application/problem+json";
const DEFAULT_TYPE = "about:blank";

export type ProblemJson = {
  type: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  [extension: string]: unknown;
};

const parseJsonSafe = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return;
  }
};

const parseTextSafe = async (response: Response) => {
  try {
    return await response.text();
  } catch {
    return;
  }
};

const isProblemJsonContentType = (response: Response) => {
  const contentType = response.headers.get("content-type");
  return contentType?.includes(PROBLEM_JSON_CONTENT_TYPE) ?? false;
};

const normalizeProblemJson = (data: unknown): ProblemJson | undefined => {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return;
  }

  const record = data as Record<string, unknown>;

  return {
    ...record,
    type: typeof record.type === "string" ? record.type : DEFAULT_TYPE,
  } as ProblemJson;
};

export const getProblemJson = async (
  response: Response,
): Promise<ProblemJson | undefined> => {
  if (!isProblemJsonContentType(response)) {
    return;
  }

  const data = await parseJsonSafe(response);

  return normalizeProblemJson(data);
};

/**
 * Parses a non-ok response into a ProblemJson.
 * If the response has a problem+json content type, parses and returns it.
 * Otherwise, returns a synthetic ProblemJson describing an unknown error.
 */
export const parseProblemResponse = async (
  response: Response,
): Promise<ProblemJson> => {
  const problem = await getProblemJson(response);
  if (problem) {
    return { ...problem, status: problem.status ?? response.status };
  }

  const text = await parseTextSafe(response);

  return {
    type: DEFAULT_TYPE,
    title: response.statusText || "Unknown error",
    status: response.status,
    detail: text || undefined,
  };
};

export const throwIfProblemJson = async (response: Response) => {
  if (!response.ok) {
    const problem = await parseProblemResponse(response);
    throw new Error(problem.detail ?? problem.title ?? "Unknown error");
  }
};
