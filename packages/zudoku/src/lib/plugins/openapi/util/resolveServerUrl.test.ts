import { describe, expect, it } from "vitest";
import { getServerLabel, resolveServerUrl } from "./resolveServerUrl.js";

describe("resolveServerUrl", () => {
  it("returns the template unchanged when there are no variables", () => {
    expect(resolveServerUrl("http://localhost:9090", [], {})).toBe(
      "http://localhost:9090",
    );
  });

  it("substitutes a single variable with its default", () => {
    expect(
      resolveServerUrl(
        "https://{host}",
        [{ name: "host", default: "api.example.com" }],
        {},
      ),
    ).toBe("https://api.example.com");
  });

  it("substitutes multiple variables with their defaults", () => {
    expect(
      resolveServerUrl(
        "{scheme}{host}{port}",
        [
          { name: "scheme", default: "http://" },
          { name: "host", default: "localhost" },
          { name: "port", default: ":80" },
        ],
        {},
      ),
    ).toBe("http://localhost:80");
  });

  it("prefers override values over defaults", () => {
    expect(
      resolveServerUrl(
        "{scheme}{host}{port}",
        [
          { name: "scheme", default: "http://" },
          { name: "host", default: "localhost" },
          { name: "port", default: ":80" },
        ],
        { host: "staging.example.com", port: ":8443" },
      ),
    ).toBe("http://staging.example.com:8443");
  });

  it("falls back to default when an override is not provided for a variable", () => {
    expect(
      resolveServerUrl(
        "{scheme}{host}",
        [
          { name: "scheme", default: "https://" },
          { name: "host", default: "localhost" },
        ],
        { scheme: "http://" },
      ),
    ).toBe("http://localhost");
  });

  it("leaves unknown tokens (e.g. path params) untouched", () => {
    expect(
      resolveServerUrl(
        "https://{host}/{id}",
        [{ name: "host", default: "api.example.com" }],
        {},
      ),
    ).toBe("https://api.example.com/{id}");
  });

  it("falls back to default when an override is an empty string (cleared input)", () => {
    expect(
      resolveServerUrl(
        "{scheme}{host}",
        [
          { name: "scheme", default: "https://" },
          { name: "host", default: "localhost" },
        ],
        { scheme: "", host: "staging.example.com" },
      ),
    ).toBe("https://staging.example.com");
  });
});

describe("getServerLabel", () => {
  it("prefers `name` when set, even if `description` is also present", () => {
    expect(
      getServerLabel({
        url: "{scheme}{host}{port}",
        name: "Local development",
        description: "Some **rich** _markdown_ description",
        variables: [
          { name: "scheme", default: "http://" },
          { name: "host", default: "localhost" },
          { name: "port", default: ":80" },
        ],
      }),
    ).toBe("Local development");
  });

  it("never returns the (rich-text) description", () => {
    expect(
      getServerLabel({
        url: "{scheme}{host}",
        description: "Some **rich** _markdown_ description",
        variables: [
          { name: "scheme", default: "http://" },
          { name: "host", default: "localhost" },
        ],
      }),
    ).toBe("http://localhost");
  });

  it("falls back to the url resolved with variable defaults when no name is set", () => {
    expect(
      getServerLabel({
        url: "{scheme}{host}{port}",
        variables: [
          { name: "scheme", default: "http://" },
          { name: "host", default: "localhost" },
          { name: "port", default: ":80" },
        ],
      }),
    ).toBe("http://localhost:80");
  });

  it("returns the plain url when there are no variables and no name", () => {
    expect(getServerLabel({ url: "http://localhost:9090" })).toBe(
      "http://localhost:9090",
    );
  });

  it("reflects current override values (not just defaults) when no name is set", () => {
    const server = {
      url: "{scheme}{host}{port}",
      variables: [
        { name: "scheme", default: "http://" },
        { name: "host", default: "localhost" },
        { name: "port", default: ":80" },
      ],
    };

    expect(getServerLabel(server, { host: "example.com", port: ":443" })).toBe(
      "http://example.com:443",
    );
  });
});
