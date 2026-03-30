import { describe, expect, it } from "vitest";
import type { OperationsFragmentFragment } from "./graphql/graphql.js";
import { PlaygroundDialogWrapper } from "./PlaygroundDialogWrapper.js";

const createMockOperation = (
  parameters: OperationsFragmentFragment["parameters"],
): OperationsFragmentFragment => ({
  id: "test-op",
  summary: "Test Operation",
  description: "Test Description",
  method: "GET",
  path: "/test",
  parameters,
  responses: [],
  tags: [],
});

describe("PlaygroundDialogWrapper", () => {
  describe("parameter value precedence", () => {
    it("uses schema.example over schema.default for headers", () => {
      const operation = createMockOperation([
        {
          name: "Authorization",
          in: "header",
          required: false,
          schema: {
            type: "string",
            example: "Bearer example-token",
            default: "Bearer default-token",
          },
          examples: [],
        },
      ]);

      const { headers } = PlaygroundDialogWrapper({
        operation,
        examples: [],
      }).props;

      expect(headers).toHaveLength(1);
      expect(headers?.[0].defaultValue).toBe("Bearer example-token");
    });

    it("uses schema.example over schema.default for query params", () => {
      const operation = createMockOperation([
        {
          name: "limit",
          in: "query",
          required: false,
          schema: {
            type: "integer",
            example: 50,
            default: 10,
          },
          examples: [],
        },
      ]);

      const { queryParams } = PlaygroundDialogWrapper({
        operation,
        examples: [],
      }).props;

      expect(queryParams).toHaveLength(1);
      expect(queryParams?.[0].defaultValue).toBe(50);
    });

    it("uses schema.example over schema.default for path params", () => {
      const operation = createMockOperation([
        {
          name: "id",
          in: "path",
          required: true,
          schema: {
            type: "string",
            example: "abc123",
            default: "default-id",
          },
          examples: [],
        },
      ]);

      const { pathParams } = PlaygroundDialogWrapper({
        operation,
        examples: [],
      }).props;

      expect(pathParams).toHaveLength(1);
      expect(pathParams?.[0].defaultValue).toBe("abc123");
    });

    it("falls back to schema.default when no example is provided", () => {
      const operation = createMockOperation([
        {
          name: "Authorization",
          in: "header",
          required: false,
          schema: {
            type: "string",
            default: "Bearer default-token",
          },
          examples: [],
        },
      ]);

      const { headers } = PlaygroundDialogWrapper({
        operation,
        examples: [],
      }).props;

      expect(headers).toHaveLength(1);
      expect(headers?.[0].defaultValue).toBe("Bearer default-token");
    });

    it("handles array examples correctly", () => {
      const operation = createMockOperation([
        {
          name: "tags",
          in: "query",
          required: false,
          schema: {
            type: "array",
            items: { type: "string" },
            examples: ["tag1", "tag2"],
          },
          examples: [],
        },
      ]);

      const { queryParams } = PlaygroundDialogWrapper({
        operation,
        examples: [],
      }).props;

      expect(queryParams).toHaveLength(1);
      // Should use first element of examples array
      expect(queryParams?.[0].defaultValue).toBe("tag1");
    });

    it("stringifies array values for query params", () => {
      const operation = createMockOperation([
        {
          name: "ids",
          in: "query",
          required: false,
          schema: {
            type: "array",
            items: { type: "integer" },
            example: [1, 2, 3],
          },
          examples: [],
        },
      ]);

      const { queryParams } = PlaygroundDialogWrapper({
        operation,
        examples: [],
      }).props;

      expect(queryParams).toHaveLength(1);
      expect(queryParams?.[0].defaultValue).toBe("[1,2,3]");
    });

    it("uses generateSchemaExample when schema has no explicit value", () => {
      const operation = createMockOperation([
        {
          name: "X-Custom-Header",
          in: "header",
          required: false,
          schema: {
            type: "string",
          },
          examples: [{ name: "example1", value: "custom-value" }],
        },
      ]);

      const { headers } = PlaygroundDialogWrapper({
        operation,
        examples: [],
      }).props;

      expect(headers).toHaveLength(1);
      // generateSchemaExample will use the parameter name as the value for string types
      expect(headers?.[0].defaultValue).toBe("X-Custom-Header");
    });

    it("generates auto-generated values when no example or default provided", () => {
      const operation = createMockOperation([
        {
          name: "email",
          in: "query",
          required: false,
          schema: {
            type: "string",
            format: "email",
          },
          examples: [],
        },
      ]);

      const { queryParams } = PlaygroundDialogWrapper({
        operation,
        examples: [],
      }).props;

      expect(queryParams).toHaveLength(1);
      // generateSchemaExample should provide an email example
      expect(queryParams?.[0].defaultValue).toBe("test@example.com");
    });
  });
});
