import { describe, expect, it } from "vitest";
import { substituteServerVariables } from "./substituteServerVariables.js";

describe("substituteServerVariables", () => {
  it("should return URL unchanged when no variables are present", () => {
    const server = {
      url: "https://api.example.com",
    };
    expect(substituteServerVariables(server)).toBe("https://api.example.com");
  });

  it("should return URL unchanged when variables object is empty", () => {
    const server = {
      url: "https://api.example.com",
      variables: {},
    };
    expect(substituteServerVariables(server)).toBe("https://api.example.com");
  });

  it("should substitute single variable with default value", () => {
    const server = {
      url: "https://api.{region}.example.com",
      variables: {
        region: {
          default: "eu-central-1",
          enum: ["eu-central-1", "us-west-1", "us-east-1"] as [
            string,
            ...string[],
          ],
        },
      },
    };
    expect(substituteServerVariables(server)).toBe(
      "https://api.eu-central-1.example.com",
    );
  });

  it("should substitute multiple variables with default values", () => {
    const server = {
      url: "https://{subdomain}.{region}.example.com/{version}",
      variables: {
        subdomain: {
          default: "api",
        },
        region: {
          default: "us-west-1",
        },
        version: {
          default: "v1",
        },
      },
    };
    expect(substituteServerVariables(server)).toBe(
      "https://api.us-west-1.example.com/v1",
    );
  });

  it("should preserve variables without defaults", () => {
    const server = {
      url: "https://api.{region}.example.com",
      variables: {},
    };
    expect(substituteServerVariables(server)).toBe(
      "https://api.{region}.example.com",
    );
  });

  it("should handle mixed scenario with some variables having defaults and others not", () => {
    const server = {
      url: "https://{subdomain}.{region}.example.com",
      variables: {
        subdomain: {
          default: "api",
        },
      },
    };
    expect(substituteServerVariables(server)).toBe(
      "https://api.{region}.example.com",
    );
  });

  it("should handle port numbers in URL", () => {
    const server = {
      url: "https://api.{region}.example.com:8080",
      variables: {
        region: {
          default: "eu-central-1",
        },
      },
    };
    expect(substituteServerVariables(server)).toBe(
      "https://api.eu-central-1.example.com:8080",
    );
  });

  it("should handle path segments", () => {
    const server = {
      url: "https://api.example.com/{version}/resources",
      variables: {
        version: {
          default: "v2",
        },
      },
    };
    expect(substituteServerVariables(server)).toBe(
      "https://api.example.com/v2/resources",
    );
  });

  it("should handle numeric-like string default values", () => {
    const server = {
      url: "https://api.example.com/{port}",
      variables: {
        port: {
          default: "8080",
        },
      },
    };
    expect(substituteServerVariables(server)).toBe(
      "https://api.example.com/8080",
    );
  });

  it("should handle empty string default value", () => {
    const server = {
      url: "https://api.{prefix}example.com",
      variables: {
        prefix: {
          default: "",
        },
      },
    };
    expect(substituteServerVariables(server)).toBe("https://api.example.com");
  });
});
