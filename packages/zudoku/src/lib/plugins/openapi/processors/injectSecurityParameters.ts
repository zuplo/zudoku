import type { OpenAPIV3_1 } from "openapi-types";
import type { ProcessorArg } from "../../../../config/validators/BuildSchema.js";
import type { OpenAPIDocument } from "../../../oas/parser/index.js";
import { type RecordAny, traverse } from "./traverse.js";

/**
 * Processor that automatically injects parameters based on security schemes.
 * This makes API keys and other security requirements visible in the UI
 * and included in code examples.
 *
 * For apiKey security schemes, this adds the appropriate header, query, or cookie parameter
 * to operations that reference them via the security field.
 */
export const injectSecurityParameters =
  () =>
  ({ schema }: ProcessorArg) =>
    traverse(schema, (spec) => {
      // Skip if no security schemes defined
      if (!spec.components?.securitySchemes) {
        return spec;
      }

      const securitySchemes = spec.components.securitySchemes as Record<
        string,
        OpenAPIV3_1.SecuritySchemeObject
      >;

      // Skip if no paths defined
      if (!spec.paths) {
        return spec;
      }

      const updatedPaths: RecordAny = {};

      for (const [pathKey, pathItem] of Object.entries(spec.paths)) {
        if (typeof pathItem !== "object" || pathItem === null) {
          updatedPaths[pathKey] = pathItem;
          continue;
        }

        let updatedPathItem = { ...pathItem };

        // Get security requirements at path level
        const pathSecurity = (pathItem as RecordAny).security as
          | OpenAPIV3_1.SecurityRequirementObject[]
          | undefined;

        // HTTP methods in OpenAPI
        const methods = [
          "get",
          "put",
          "post",
          "delete",
          "options",
          "head",
          "patch",
          "trace",
        ];

        for (const method of methods) {
          const pathItemWithMethods = updatedPathItem as Record<
            string,
            RecordAny
          >;

          if (typeof pathItemWithMethods[method] !== "object") {
            continue;
          }

          const operation = pathItemWithMethods[method];
          if (!operation) continue;

          // Get security requirements for this operation
          // Operation-level security overrides path-level and global security
          const operationSecurity = operation.security as
            | OpenAPIV3_1.SecurityRequirementObject[]
            | undefined;
          const globalSecurity = (spec.security ?? []) as
            | OpenAPIV3_1.SecurityRequirementObject[]
            | undefined;

          // Determine which security requirements apply (operation > path > global)
          const effectiveSecurity =
            operationSecurity !== undefined
              ? operationSecurity
              : pathSecurity !== undefined
                ? pathSecurity
                : globalSecurity;

          if (!effectiveSecurity || effectiveSecurity.length === 0) {
            continue;
          }

          // Collect all security scheme names referenced
          const referencedSchemes = new Set<string>();
          for (const securityRequirement of effectiveSecurity) {
            for (const schemeName of Object.keys(securityRequirement)) {
              referencedSchemes.add(schemeName);
            }
          }

          // Get existing parameters
          const existingParameters = (operation.parameters ?? []) as Array<
            OpenAPIV3_1.ParameterObject | OpenAPIV3_1.ReferenceObject
          >;

          // Track parameter names to avoid duplicates
          const existingParamKeys = new Set(
            existingParameters
              .filter((p): p is OpenAPIV3_1.ParameterObject => !("$ref" in p))
              .map((p) => `${p.in}:${p.name}`),
          );

          const newParameters: OpenAPIV3_1.ParameterObject[] = [];

          // Process each referenced security scheme
          for (const schemeName of referencedSchemes) {
            const scheme = securitySchemes[schemeName];

            // Skip if scheme doesn't exist or is a reference
            if (!scheme || "$ref" in scheme) {
              continue;
            }

            // Only handle apiKey type for now
            if (scheme.type !== "apiKey") {
              continue;
            }

            const apiKeyScheme = scheme as OpenAPIV3_1.ApiKeySecurityScheme;
            const paramKey = `${apiKeyScheme.in}:${apiKeyScheme.name}`;

            // Skip if parameter already exists
            if (existingParamKeys.has(paramKey)) {
              continue;
            }

            // Create parameter from security scheme
            const parameter: OpenAPIV3_1.ParameterObject = {
              name: apiKeyScheme.name,
              in: apiKeyScheme.in as "query" | "header" | "cookie",
              required: true,
              schema: {
                type: "string",
              },
              description:
                scheme.description ||
                `API key for ${schemeName} authentication`,
            };

            newParameters.push(parameter);
            existingParamKeys.add(paramKey);
          }

          // Add new parameters if any were created
          if (newParameters.length > 0) {
            pathItemWithMethods[method] = {
              ...operation,
              parameters: [...newParameters, ...existingParameters],
            };
            updatedPathItem = pathItemWithMethods;
          }
        }

        updatedPaths[pathKey] = updatedPathItem;
      }

      return { ...spec, paths: updatedPaths };
    }) as OpenAPIDocument;
