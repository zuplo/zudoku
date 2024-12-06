import { describe, expect, it } from "vitest";
import { removePaths } from "./removePaths.js";

const baseDoc = {
  openapi: "3.0.3",
  paths: {
    "/example": {
      get: { summary: "Get example" },
      post: { summary: "Post example" },
    },
    "/remove-me": {
      delete: { summary: "Delete example" },
    },
    "/another": {
      get: { summary: "Another example" },
    },
  },
};

describe("removePaths with filter callback", () => {
  it("keeps paths based on filter callback", () => {
    const processed = removePaths({
      filter: (path) => !path.startsWith("/remove"),
    })(baseDoc);

    expect(processed.paths["/remove-me"]).toBeUndefined();
    expect(processed.paths["/example"]).toBeDefined();
    expect(processed.paths["/another"]).toBeDefined();
  });

  it("keeps methods based on filter callback", () => {
    const processed = removePaths({
      filter: (_, method) => method !== "post",
    })(baseDoc);

    expect(processed.paths["/example"].post).toBeUndefined();
    expect(processed.paths["/example"].get).toBeDefined();
    expect(processed.paths["/remove-me"]).toBeDefined();
  });

  it("keeps both paths and methods based on filter callback", () => {
    const processed = removePaths({
      filter: (path, method) =>
        !path.startsWith("/remove") && method !== "post",
    })(baseDoc);

    expect(processed.paths["/remove-me"]).toBeUndefined();
    expect(processed.paths["/example"].post).toBeUndefined();
    expect(processed.paths["/example"].get).toBeDefined();
    expect(processed.paths["/another"]).toBeDefined();
  });

  it("does nothing if filter always returns true", () => {
    const processed = removePaths({
      filter: () => true,
    })(baseDoc);

    expect(processed).toEqual(baseDoc);
  });

  it("removes everything if filter always returns false", () => {
    const processed = removePaths({
      filter: () => false,
    })(baseDoc);

    expect(processed.paths).toEqual({});
  });

  it("keeps entire paths when filter matches them", () => {
    const processed = removePaths({
      filter: (path, method) => path === "/example" || method === true,
    })(baseDoc);

    expect(processed.paths["/example"]).toBeDefined();
    expect(processed.paths["/remove-me"]).toBeUndefined();
    expect(processed.paths["/another"]).toBeUndefined();
  });
});
