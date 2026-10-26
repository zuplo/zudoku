import { describe, expect, it } from "vitest";
import { buildRequestBody } from "./buildRequestBody.js";
import type { PlaygroundForm } from "./Playground.js";

const baseForm: PlaygroundForm = {
  body: "",
  bodyMode: "text",
  file: null,
  multipartFormFields: [],
  urlencodedFormFields: [],
  queryParams: [],
  pathParams: [],
  headers: [],
};

describe("buildRequestBody", () => {
  it("returns text body as-is and preserves Content-Type", () => {
    const r = buildRequestBody({
      ...baseForm,
      bodyMode: "text",
      body: "hello",
    });
    expect(r.body).toBe("hello");
    expect(r.contentType).toEqual({ kind: "preserve" });
  });

  it("returns undefined for empty text body", () => {
    expect(buildRequestBody({ ...baseForm, bodyMode: "text" }).body).toBe(
      undefined,
    );
  });

  it("file mode returns the file and removes Content-Type", () => {
    const file = new File(["abc"], "x.txt");
    const r = buildRequestBody({ ...baseForm, bodyMode: "file", file });
    expect(r.body).toBe(file);
    expect(r.contentType).toEqual({ kind: "remove" });
  });

  it("file mode without a file returns undefined body", () => {
    const r = buildRequestBody({ ...baseForm, bodyMode: "file", file: null });
    expect(r.body).toBeUndefined();
    expect(r.contentType).toEqual({ kind: "remove" });
  });

  it("multipart skips inactive and empty-name fields", () => {
    const r = buildRequestBody({
      ...baseForm,
      bodyMode: "multipart",
      multipartFormFields: [
        { name: "a", value: "1", active: true },
        { name: "b", value: "2", active: false },
        { name: "", value: "3", active: true },
      ],
    });
    expect(r.body).toBeInstanceOf(FormData);
    const fd = r.body as FormData;
    expect(fd.get("a")).toBe("1");
    expect(fd.has("b")).toBe(false);
    expect(r.contentType).toEqual({ kind: "remove" });
  });

  it("urlencoded encodes active fields and overrides Content-Type", () => {
    const r = buildRequestBody({
      ...baseForm,
      bodyMode: "urlencoded",
      urlencodedFormFields: [
        { name: "grant_type", value: "client_credentials", active: true },
        { name: "client_id", value: "abc", active: true },
        { name: "secret", value: "shh", active: false },
        { name: "", value: "skipped", active: true },
      ],
    });
    expect(r.body).toBe("grant_type=client_credentials&client_id=abc");
    expect(r.contentType).toEqual({
      kind: "override",
      value: "application/x-www-form-urlencoded",
    });
  });

  it("urlencoded percent-encodes special characters", () => {
    const r = buildRequestBody({
      ...baseForm,
      bodyMode: "urlencoded",
      urlencodedFormFields: [
        { name: "q", value: "hello world", active: true },
        { name: "k+1", value: "x&y", active: true },
      ],
    });
    expect(r.body).toBe("q=hello+world&k%2B1=x%26y");
  });
});
