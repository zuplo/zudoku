import { describe, expect, it } from "vitest";
import { resolveServerVariables } from "./resolveServerVariables.js";

describe("resolveServerVariables", () => {
  it("should return the URL unchanged if there are no variables", () => {
    const url = "https://api.example.com";
    expect(resolveServerVariables(url)).toBe(url);
  });

  it("should return the URL unchanged if variables object is empty", () => {
    const url = "https://api.example.com";
    expect(resolveServerVariables(url, {})).toBe(url);
  });

  it("should replace a single variable with its default value", () => {
    const url = "https://api.{region}.example.com";
    const variables = {
      region: {
        default: "eu-central-1",
        enum: ["eu-central-1", "us-west-1", "us-east-1"] as [
          string,
          ...string[],
        ],
      },
    };
    expect(resolveServerVariables(url, variables)).toBe(
      "https://api.eu-central-1.example.com",
    );
  });

  it("should replace multiple variables with their default values", () => {
    const url = "https://{environment}.{region}.example.com";
    const variables = {
      environment: {
        default: "api",
        enum: ["api", "staging"] as [string, ...string[]],
      },
      region: {
        default: "eu-central-1",
        enum: ["eu-central-1", "us-west-1"] as [string, ...string[]],
      },
    };
    expect(resolveServerVariables(url, variables)).toBe(
      "https://api.eu-central-1.example.com",
    );
  });

  it("should replace multiple occurrences of the same variable", () => {
    const url = "https://{env}.example.com/{env}/api";
    const variables = {
      env: {
        default: "production",
      },
    };
    expect(resolveServerVariables(url, variables)).toBe(
      "https://production.example.com/production/api",
    );
  });

  it("should handle variables in different parts of the URL", () => {
    const url = "https://api.example.com/{version}/{path}";
    const variables = {
      version: {
        default: "v1",
      },
      path: {
        default: "endpoint",
      },
    };
    expect(resolveServerVariables(url, variables)).toBe(
      "https://api.example.com/v1/endpoint",
    );
  });

  it("should not replace variables that are not defined in the variables object", () => {
    const url = "https://api.{region}.example.com/{undefined}";
    const variables = {
      region: {
        default: "eu-central-1",
      },
    };
    expect(resolveServerVariables(url, variables)).toBe(
      "https://api.eu-central-1.example.com/{undefined}",
    );
  });
});
