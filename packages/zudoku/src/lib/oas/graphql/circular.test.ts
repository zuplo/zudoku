import { describe, expect, it } from "vitest";
import {
  CIRCULAR_REF,
  handleCircularRefs,
  SCHEMA_REF_PREFIX,
} from "./circular.js";

describe("handleCircularRefs", () => {
  it("should return primitives unchanged", () => {
    expect(handleCircularRefs(null)).toBe(null);
    expect(handleCircularRefs(undefined)).toBe(undefined);
    expect(handleCircularRefs(42)).toBe(42);
    expect(handleCircularRefs("hello")).toBe("hello");
    expect(handleCircularRefs(true)).toBe(true);
  });

  it("should handle simple objects without refs", () => {
    const obj = { type: "string", description: "A string" };
    const result = handleCircularRefs(obj);
    expect(result).toEqual(obj);
  });

  it("should handle arrays", () => {
    const arr = [{ type: "string" }, { type: "number" }];
    const result = handleCircularRefs(arr);
    expect(result).toEqual(arr);
  });

  it("should detect true circular references via object identity", () => {
    const obj: Record<string, unknown> = { type: "object" };
    obj.self = obj;

    const result = handleCircularRefs(obj);
    expect(result.type).toBe("object");
    expect(result.self).toContain(CIRCULAR_REF);
  });

  it("should detect circular refs via __$ref path", () => {
    const inner = { __$ref: "#/components/schemas/Node", type: "object" };
    const obj = {
      __$ref: "#/components/schemas/Node",
      type: "object",
      properties: {
        child: inner,
      },
    };
    (inner as Record<string, unknown>).properties = { parent: obj };

    const result = handleCircularRefs(obj);
    expect(result.properties.child).toBe(
      `${SCHEMA_REF_PREFIX}#/components/schemas/Node`,
    );
  });

  // Regression test for #1869
  it("should NOT mark sibling refs to the same schema as circular", () => {
    const timestampSchema1 = {
      __$ref: "#/components/schemas/timestamp",
      type: "string",
      format: "date-time",
    };
    const timestampSchema2 = {
      __$ref: "#/components/schemas/timestamp",
      type: "string",
      format: "date-time",
    };

    const obj = {
      type: "object",
      properties: {
        created_at: timestampSchema1,
        updated_at: timestampSchema2,
      },
    };

    const result = handleCircularRefs(obj);

    expect(result.properties.created_at).toEqual({
      __$ref: "#/components/schemas/timestamp",
      type: "string",
      format: "date-time",
    });
    expect(result.properties.updated_at).toEqual({
      __$ref: "#/components/schemas/timestamp",
      type: "string",
      format: "date-time",
    });
  });

  it("should allow same ref path in different branches of the tree", () => {
    const obj = {
      type: "object",
      properties: {
        user: {
          type: "object",
          properties: {
            id: { __$ref: "#/components/schemas/identifier", type: "string" },
            name: { type: "string" },
          },
        },
        post: {
          type: "object",
          properties: {
            id: { __$ref: "#/components/schemas/identifier", type: "string" },
            title: { type: "string" },
          },
        },
      },
    };

    const result = handleCircularRefs(obj);

    expect(result.properties.user.properties.id.type).toBe("string");
    expect(result.properties.post.properties.id.type).toBe("string");
    expect(result.properties.user.properties.id).not.toBe(
      expect.stringContaining(SCHEMA_REF_PREFIX),
    );
    expect(result.properties.post.properties.id).not.toBe(
      expect.stringContaining(SCHEMA_REF_PREFIX),
    );
  });

  it("should handle shared object instances (same object, multiple references)", () => {
    const sharedSchema = { type: "string", description: "Shared" };
    const obj = {
      type: "object",
      properties: { field1: sharedSchema, field2: sharedSchema },
    };

    const result = handleCircularRefs(obj);

    expect(result.properties.field1).toEqual({
      type: "string",
      description: "Shared",
    });
    expect(result.properties.field2).toEqual({
      type: "string",
      description: "Shared",
    });
  });

  it("should handle nested arrays with refs", () => {
    const obj = {
      type: "object",
      allOf: [
        { __$ref: "#/components/schemas/Base", type: "object" },
        { type: "object", properties: { extra: { type: "string" } } },
      ],
    };

    const result = handleCircularRefs(obj);

    expect(result.allOf[0]).toEqual({
      __$ref: "#/components/schemas/Base",
      type: "object",
    });
  });

  it("should handle shared object instances with __$ref without marking circular", () => {
    const shared = { __$ref: "#/components/schemas/Foo", type: "string" };
    const obj = { a: shared, b: shared };
    const result = handleCircularRefs(obj);

    // Both should return the cached result, not mark as circular
    expect(result.a).toEqual({
      __$ref: "#/components/schemas/Foo",
      type: "string",
    });
    expect(result.b).toEqual({
      __$ref: "#/components/schemas/Foo",
      type: "string",
    });
  });

  it("should mark circular ref with property name from path", () => {
    const parent: Record<string, unknown> = {
      type: "object",
      properties: {} as Record<string, unknown>,
    };
    const child: Record<string, unknown> = {
      type: "object",
      properties: { back: parent },
    };
    (parent.properties as Record<string, unknown>).child = child;

    const result = handleCircularRefs(parent);

    expect(result.properties.child.properties.back).toContain(CIRCULAR_REF);
  });

  // Exact reproduction of #1869 - shared object instances with __$ref
  it("should NOT mark shared object instances with __$ref as circular (issue #1869)", () => {
    // When dereferencing, the SAME object instance is returned for all refs to the same schema
    const timestampSchema = {
      __$ref: "#/components/schemas/timestamp",
      type: "string",
      format: "date-time",
    };

    // Both created_at and updated_at point to the SAME object instance
    const obj = {
      type: "object",
      properties: {
        created_at: timestampSchema,
        updated_at: timestampSchema,
      },
    };

    const result = handleCircularRefs(obj);

    // The first one should be fully expanded
    expect(result.properties.created_at).toEqual({
      __$ref: "#/components/schemas/timestamp",
      type: "string",
      format: "date-time",
    });
    // The second one should ALSO be fully expanded (not marked as circular)
    expect(typeof result.properties.updated_at).toBe("object");
    expect(result.properties.updated_at).not.toContain(CIRCULAR_REF);
  });
});
