export type ServerVariableDefinition = {
  name: string;
  default: string;
  enum?: string[] | null;
  description?: string | null;
};

/**
 * The value a server variable resolves to: the override when it is a usable
 * value, otherwise the variable's `default`. An override is ignored when it
 * is an empty string (the variable inputs use the default as a placeholder
 * rather than an initial value, so clearing an input resets it to the
 * default) or, for `enum` variables, when it is not one of the allowed values
 * (overrides are persisted per URL template and may be stale or come from
 * another API sharing the same template).
 */
export const getServerVariableValue = (
  variable: ServerVariableDefinition,
  overrides: Record<string, string> = {},
): string => {
  const override = Object.hasOwn(overrides, variable.name)
    ? overrides[variable.name]
    : undefined;

  if (!override) return variable.default;
  if (variable.enum?.length && !variable.enum.includes(override)) {
    return variable.default;
  }
  return override;
};

/**
 * Substitutes OpenAPI server variable tokens (e.g. `{scheme}`) in a server URL
 * template with the provided override values, falling back to each variable's
 * `default` (see `getServerVariableValue`). Tokens that don't correspond to a
 * known server variable (e.g. path parameters accidentally present in the
 * template) are left untouched.
 */
export const resolveServerUrl = (
  template: string,
  variables: ServerVariableDefinition[],
  overrides: Record<string, string> = {},
): string => {
  if (variables.length === 0) return template;

  const variableByName = new Map(variables.map((v) => [v.name, v]));

  return template.replace(/\{([^}]+)\}/g, (match, name: string) => {
    const variable = variableByName.get(name);
    if (!variable) return match;

    return getServerVariableValue(variable, overrides);
  });
};

/**
 * Label for a server in a selection dropdown. Prefers the OAS 3.2+ `name` (a plain,
 * dropdown-safe identifier), since `description` may be rich text/Markdown and must
 * never be rendered inside a `<select>`/`<option>`. Falls back to the URL, resolved
 * against `overrides` (falling back to each variable's `default`) so templated URLs
 * (e.g. `{scheme}{host}{port}`) aren't shown verbatim, and so the label reflects the
 * currently entered variable values rather than always the defaults.
 */
export const getServerLabel = (
  server: {
    url: string;
    name?: string | null;
    // Intentionally accepted but never read: `description` may be rich text/Markdown
    // (per the OpenAPI spec) and must never be rendered inside a dropdown.
    description?: string | null;
    variables?: ServerVariableDefinition[] | null;
  },
  overrides: Record<string, string> = {},
): string => {
  if (server.name) return server.name;
  return resolveServerUrl(server.url, server.variables ?? [], overrides);
};
