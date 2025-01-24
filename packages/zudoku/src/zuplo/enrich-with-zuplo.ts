import { OpenAPIV3_1 } from "openapi-types";
import { RecordAny } from "../lib/util/traverse.js";
import {
  PoliciesConfigFile,
  PolicyConfigurationFragment,
} from "./policy-types.js";

const API_KEY_REPLACEMENT_STRING = "YOUR_KEY_HERE";

const enrichWithApiKeyData = (
  operationObject: RecordAny,
  apiKeyPolicies: PolicyConfigurationFragment[],
) => {
  if (apiKeyPolicies.length === 0) {
    return operationObject;
  }

  const firstPolicy = apiKeyPolicies[0];
  const authorizationHeader =
    (firstPolicy?.handler.options?.["authHeader"] as string) || "Authorization";
  const authorizationScheme = (firstPolicy?.handler.options?.["authScheme"] ??
    "Bearer") as string;
  const authSchemeExample =
    authorizationScheme !== ""
      ? `${authorizationScheme} ${API_KEY_REPLACEMENT_STRING}`
      : API_KEY_REPLACEMENT_STRING;

  // Add API key header parameter
  const apiKeyHeader: OpenAPIV3_1.ParameterObject = {
    name: authorizationHeader,
    in: "header",
    required: true,
    example: authSchemeExample,
    schema: {
      type: "string",
    },
    description: `The \`${authorizationHeader}\` header is used to authenticate with the API using your API key. Value is of the format \`${authSchemeExample}\`.`,
  };

  const parameters = operationObject.parameters || [];
  if (
    !parameters.some((param: RecordAny) => param.name === authorizationHeader)
  ) {
    operationObject.parameters = [apiKeyHeader, ...parameters];
  }

  // Add security scheme and requirement
  const apiSecuritySchemeId = "api_key";
  const apiKeySecurityRequirement = { [apiSecuritySchemeId]: [] };

  if (!operationObject.security) {
    operationObject.security = [apiKeySecurityRequirement];
  } else if (
    !operationObject.security.some((req: RecordAny) => req[apiSecuritySchemeId])
  ) {
    operationObject.security = [
      apiKeySecurityRequirement,
      ...operationObject.security,
    ];
  }

  return operationObject;
};

const enrichWithRateLimitData = (
  operationObject: RecordAny,
  rateLimitPolicies: PolicyConfigurationFragment[],
) => {
  if (rateLimitPolicies.length === 0) {
    return operationObject;
  }

  const shouldIncludeHeader = rateLimitPolicies.some(
    (policy) => policy.handler.options?.headerMode !== "none",
  );

  if (!operationObject.responses) {
    operationObject.responses = {};
  }

  if (!operationObject.responses["429"]) {
    operationObject.responses["429"] = {
      $ref: shouldIncludeHeader
        ? "#/components/responses/RateLimitWithRetryAfter"
        : "#/components/responses/RateLimitNoRetryAfter",
    };
  }

  return operationObject;
};

// prettier-ignore
const operations = [
  "get", "put", "post", "delete",
  "options", "head", "patch",  "trace",
];

const rateLimitingResponse: OpenAPIV3_1.ResponseObject = {
  description: "Rate Limiting Response",
  content: {
    "application/json": {
      schema: {
        type: "object",
        required: ["type", "title", "status"],
        examples: [
          {
            type: "https://httpproblems.com/http-status/429",
            title: "Too Many Requests",
            status: 429,
            instance: "/foo/bar",
          },
        ],
        properties: {
          type: {
            type: "string",
            example: "https://httpproblems.com/http-status/429",
            description: "A URI reference that identifies the problem.",
          },
          title: {
            type: "string",
            example: "Too Many Requests",
            description: "A short, human-readable summary of the problem.",
          },
          status: {
            type: "number",
            example: 429,
            description: "The HTTP status code.",
          },
          instance: {
            type: "string",
            example: "/foo/bar",
          },
        },
      },
    },
  },
};

const rateLimitingResponseWithHeader: OpenAPIV3_1.ResponseObject = {
  ...rateLimitingResponse,
  headers: {
    "retry-after": {
      description: "The number of seconds to wait before making a new request.",
      schema: {
        type: "integer",
        example: 60,
      },
    },
  },
};

export const enrichWithZuploData = ({
  policiesConfig,
}: {
  policiesConfig: PoliciesConfigFile;
}) => {
  return (spec: RecordAny) => {
    if (!spec.paths) return spec;

    let hasRateLimitPolicies = false;

    for (const [, pathItem] of Object.entries<RecordAny>(spec.paths)) {
      for (const method of operations) {
        const operation = pathItem[method];
        if (!operation?.["x-zuplo-route"]) continue;

        const inboundPolicies = operation[
          "x-zuplo-route"
        ]?.policies?.inbound?.reduce((acc: string[], policyName: string) => {
          const policy = policiesConfig.policies?.find(
            ({ name }) => name === policyName,
          );
          if (!policy) return acc;

          // Handle composite policies
          if (policy.handler.export === "CompositeInboundPolicy") {
            const childPolicies = policy.handler.options?.policies as
              | string[]
              | undefined;
            return childPolicies ? [...acc, ...childPolicies] : acc;
          }

          return [...acc, policyName];
        }, []);

        if (!inboundPolicies) continue;

        // Find API key policies
        const apiKeyPolicies =
          policiesConfig.policies?.filter(
            (policy) =>
              inboundPolicies.includes(policy.name) &&
              (policy.handler.export === "ApiAuthKeyInboundPolicy" ||
                policy.handler.export === "ApiKeyInboundPolicy") &&
              !policy.handler.options
                ?.disableAutomaticallyAddingKeyHeaderToOpenApi,
          ) ?? [];

        // Find rate limit policies
        const rateLimitPolicies =
          policiesConfig.policies?.filter(
            (policy) =>
              inboundPolicies.includes(policy.name) &&
              (policy.handler.export === "RateLimitInboundPolicy" ||
                policy.handler.export === "ComplexRateLimitInboundPolicy"),
          ) ?? [];

        if (rateLimitPolicies.length > 0) {
          hasRateLimitPolicies = true;
        }

        // Apply enrichments directly to the operation
        pathItem[method] = enrichWithApiKeyData(operation, apiKeyPolicies);
        pathItem[method] = enrichWithRateLimitData(
          pathItem[method],
          rateLimitPolicies,
        );
      }
    }

    // Add security scheme if we have API key policies
    if (
      policiesConfig.policies?.some(
        (policy) =>
          policy.handler.export === "ApiAuthKeyInboundPolicy" ||
          policy.handler.export === "ApiKeyInboundPolicy",
      )
    ) {
      if (!spec.components) spec.components = {};
      if (!spec.components.securitySchemes)
        spec.components.securitySchemes = {};

      if (!spec.components.securitySchemes.api_key) {
        spec.components.securitySchemes.api_key = {
          type: "http",
          scheme: "bearer",
        };
      }
    }

    // Add rate limiting responses only if we found rate limiting policies
    if (hasRateLimitPolicies) {
      if (!spec.components) spec.components = {};
      if (!spec.components.responses) spec.components.responses = {};
      spec.components.responses.RateLimitNoRetryAfter = rateLimitingResponse;
      spec.components.responses.RateLimitWithRetryAfter =
        rateLimitingResponseWithHeader;
    }

    return spec;
  };
};
