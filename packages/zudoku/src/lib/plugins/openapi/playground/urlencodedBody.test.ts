import { describe, expect, it } from "vitest";

describe("Form URL Encoded body serialization", () => {
  it("serializes urlencoded fields to URL encoded format", () => {
    const fields = [
      { name: "grant_type", value: "client_credentials", active: true },
      { name: "client_id", value: "my-client-id", active: true },
      { name: "client_secret", value: "my-secret", active: true },
    ];

    const params = new URLSearchParams();
    fields
      .filter((field) => field.name && field.active)
      .forEach((field) => params.append(field.name, field.value));

    const body = params.toString();

    expect(body).toBe(
      "grant_type=client_credentials&client_id=my-client-id&client_secret=my-secret",
    );
  });

  it("skips inactive fields", () => {
    const fields = [
      { name: "grant_type", value: "client_credentials", active: true },
      { name: "client_id", value: "my-client-id", active: false },
      { name: "client_secret", value: "my-secret", active: true },
    ];

    const params = new URLSearchParams();
    fields
      .filter((field) => field.name && field.active)
      .forEach((field) => params.append(field.name, field.value));

    const body = params.toString();

    expect(body).toBe("grant_type=client_credentials&client_secret=my-secret");
  });

  it("properly encodes special characters", () => {
    const fields = [
      { name: "username", value: "user@example.com", active: true },
      { name: "password", value: "p@$$w0rd!", active: true },
    ];

    const params = new URLSearchParams();
    fields
      .filter((field) => field.name && field.active)
      .forEach((field) => params.append(field.name, field.value));

    const body = params.toString();

    expect(body).toBe("username=user%40example.com&password=p%40%24%24w0rd%21");
  });

  it("handles empty values", () => {
    const fields = [
      { name: "grant_type", value: "client_credentials", active: true },
      { name: "scope", value: "", active: true },
    ];

    const params = new URLSearchParams();
    fields
      .filter((field) => field.name && field.active)
      .forEach((field) => params.append(field.name, field.value));

    const body = params.toString();

    expect(body).toBe("grant_type=client_credentials&scope=");
  });

  it("handles multiple values with same key", () => {
    const fields = [
      { name: "scope", value: "read", active: true },
      { name: "scope", value: "write", active: true },
    ];

    const params = new URLSearchParams();
    fields
      .filter((field) => field.name && field.active)
      .forEach((field) => params.append(field.name, field.value));

    const body = params.toString();

    expect(body).toBe("scope=read&scope=write");
  });
});
