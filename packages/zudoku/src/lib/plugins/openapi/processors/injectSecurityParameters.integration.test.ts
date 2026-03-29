import { readFileSync } from "node:fs";
import type { OpenAPIV3_1 } from "openapi-types";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import type { OpenAPIDocument } from "../../../oas/parser/index.js";
import { injectSecurityParameters } from "./injectSecurityParameters.js";

describe("injectSecurityParameters - real world example", () => {
  it("should work with the example from the issue", () => {
    const yamlContent = readFileSync("/tmp/test-api-key-spec.yaml", "utf-8");
    const schema = parse(yamlContent) as OpenAPIDocument;

    const result = injectSecurityParameters()({ schema });

    const operation = result.paths?.["/v1/cards/{organization_id}"]
      ?.get as OpenAPIV3_1.OperationObject;

    expect(operation.parameters).toBeDefined();
    expect(operation.parameters).toHaveLength(2);

    // First parameter should be the injected X-API-Key header
    const apiKeyParam = operation
      .parameters?.[0] as OpenAPIV3_1.ParameterObject;
    expect(apiKeyParam.name).toBe("X-API-Key");
    expect(apiKeyParam.in).toBe("header");
    expect(apiKeyParam.required).toBe(true);
    expect(apiKeyParam.description).toBe(
      "API Key authentication using X-API-Key header",
    );

    // Second parameter should be the existing organization_id path param
    const orgIdParam = operation.parameters?.[1] as OpenAPIV3_1.ParameterObject;
    expect(orgIdParam.name).toBe("organization_id");
    expect(orgIdParam.in).toBe("path");
  });
});
