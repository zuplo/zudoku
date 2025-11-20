import { parse, stringify } from "yaml";

/**
 * Custom YAML engine for gray-matter that uses the modern `yaml` package
 * instead of the deprecated js-yaml v3 API.
 *
 * This provides compatibility with projects that enforce js-yaml v4+
 * for security reasons (CVE-2025-64718).
 */
export const yamlEngine = {
  parse: (input: string): object => {
    return parse(input) ?? {};
  },
  stringify: (obj: object): string => {
    return stringify(obj);
  },
};
