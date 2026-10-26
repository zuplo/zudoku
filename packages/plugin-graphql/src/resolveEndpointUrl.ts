import { joinUrl } from "zudoku";
import { isSchemaUrl } from "./interfaces.js";

export const resolveEndpointUrl = (
  endpoint: string | undefined,
  baseUrl: string | undefined,
): string | undefined => {
  if (!endpoint) return undefined;
  if (isSchemaUrl(endpoint)) return endpoint;

  return baseUrl ? joinUrl(baseUrl, endpoint) : joinUrl(endpoint);
};
