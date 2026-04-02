import type { ServerObject } from "../../../oas/parser/index.js";

/**
 * Substitutes variables in a server URL with their default values.
 *
 * According to OpenAPI spec, server URLs can contain variables in the format {variable}.
 * This function replaces those variables with their default values from the variables object.
 *
 * @param server - The server object containing url and optional variables
 * @returns The server URL with variables substituted with their default values
 *
 * @example
 * ```ts
 * const server = {
 *   url: "https://api.{region}.example.com",
 *   variables: {
 *     region: { default: "eu-central-1", enum: ["eu-central-1", "us-west-1"] }
 *   }
 * };
 * substituteServerVariables(server); // "https://api.eu-central-1.example.com"
 * ```
 */
export const substituteServerVariables = (
  server: ServerObject | { url: string; variables?: ServerObject["variables"] },
): string => {
  const { url, variables } = server;

  if (!variables || Object.keys(variables).length === 0) {
    return url;
  }

  // Replace all {variableName} placeholders with their default values
  return url.replace(/\{(\w+)\}/g, (match, variableName: string) => {
    const variable = variables[variableName];
    if (variable?.default !== undefined) {
      return variable.default;
    }
    // If no default is found, keep the original placeholder
    return match;
  });
};
