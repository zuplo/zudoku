import type { ServerObject } from "../../../oas/parser/index.js";

/**
 * Resolves server variables in a server URL by replacing template variables
 * with their default values.
 *
 * For example, if the server URL is "https://api.{region}.example.com" and
 * the region variable has a default value of "eu-central-1", this function
 * will return "https://api.eu-central-1.example.com".
 *
 * @param serverUrl - The server URL that may contain template variables
 * @param variables - The server variables object from the OpenAPI spec
 * @returns The server URL with all variables replaced by their default values
 */
export const resolveServerVariables = (
  serverUrl: string,
  variables?: ServerObject["variables"],
): string => {
  if (!variables) {
    return serverUrl;
  }

  let resolvedUrl = serverUrl;

  for (const [name, variable] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{${name}\\}`, "g");
    resolvedUrl = resolvedUrl.replace(pattern, variable.default);
  }

  return resolvedUrl;
};
