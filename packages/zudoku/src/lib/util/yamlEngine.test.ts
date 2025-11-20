import { describe, expect, it } from "vitest";
import { yamlEngine } from "./yamlEngine.js";

describe("yamlEngine", () => {
  describe("parse", () => {
    it("should parse valid YAML string", () => {
      const yaml = "title: Hello World\ndescription: A test document";
      const result = yamlEngine.parse(yaml);

      expect(result).toEqual({
        title: "Hello World",
        description: "A test document",
      });
    });

    it("should parse YAML with nested objects", () => {
      const yaml = `
title: Test
author:
  name: John Doe
  email: john@example.com
tags:
  - javascript
  - typescript
`;
      const result = yamlEngine.parse(yaml);

      expect(result).toEqual({
        title: "Test",
        author: {
          name: "John Doe",
          email: "john@example.com",
        },
        tags: ["javascript", "typescript"],
      });
    });

    it("should return empty object for empty string", () => {
      const result = yamlEngine.parse("");
      expect(result).toEqual({});
    });

    it("should return empty object for null YAML", () => {
      const result = yamlEngine.parse("null");
      expect(result).toEqual({});
    });

    it("should parse YAML with special characters", () => {
      const yaml = `title: "Hello: World"
description: 'This is a "quoted" string'`;
      const result = yamlEngine.parse(yaml);

      expect(result).toEqual({
        title: "Hello: World",
        description: 'This is a "quoted" string',
      });
    });
  });

  describe("stringify", () => {
    it("should stringify a simple object", () => {
      const obj = {
        title: "Hello World",
        description: "A test document",
      };
      const result = yamlEngine.stringify(obj);

      expect(result).toContain("title: Hello World");
      expect(result).toContain("description: A test document");
    });

    it("should stringify nested objects", () => {
      const obj = {
        title: "Test",
        author: {
          name: "John Doe",
          email: "john@example.com",
        },
        tags: ["javascript", "typescript"],
      };
      const result = yamlEngine.stringify(obj);

      expect(result).toContain("title: Test");
      expect(result).toContain("author:");
      expect(result).toContain("name: John Doe");
      expect(result).toContain("email: john@example.com");
      expect(result).toContain("tags:");
      expect(result).toContain("- javascript");
      expect(result).toContain("- typescript");
    });

    it("should stringify empty object", () => {
      const result = yamlEngine.stringify({});
      expect(result).toBe("{}\n");
    });

    it("should handle special characters in strings", () => {
      const obj = {
        title: "Hello: World",
        description: 'This is a "quoted" string',
      };
      const result = yamlEngine.stringify(obj);

      expect(result).toContain("title:");
      expect(result).toContain("description:");
    });
  });

  describe("round-trip", () => {
    it("should parse and stringify back to equivalent structure", () => {
      const original = {
        title: "Test Document",
        author: "John Doe",
        tags: ["test", "yaml"],
        metadata: {
          created: "2024-01-01",
          version: 1,
        },
      };

      const stringified = yamlEngine.stringify(original);
      const parsed = yamlEngine.parse(stringified);

      expect(parsed).toEqual(original);
    });
  });
});
