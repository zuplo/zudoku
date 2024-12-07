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

describe("removePaths", () => {
  it("removes paths specified in the paths option", () => {
    const processed = removePaths({
      paths: {
        "/remove-me": true,
      },
    })(baseDoc);

    expect(processed.paths["/remove-me"]).toBeUndefined();
    expect(processed.paths["/example"]).toBeDefined();
    expect(processed.paths["/another"]).toBeDefined();
  });

  it("removes specific methods in the paths option", () => {
    const processed = removePaths({
      paths: {
        "/example": ["get"],
      },
    })(baseDoc);

    expect(processed.paths["/example"].get).toBeUndefined();
    expect(processed.paths["/example"].post).toBeDefined();
    expect(processed.paths["/remove-me"]).toBeDefined();
  });

  it("removes paths and methods using paths and shouldRemove together", () => {
    const processed = removePaths({
      paths: {
        "/example": ["post"],
      },
      shouldRemove: ({ path }) => path.startsWith("/remove"),
    })(baseDoc);

    expect(processed.paths["/remove-me"]).toBeUndefined();
    expect(processed.paths["/example"].get).toBeDefined();
    expect(processed.paths["/example"].post).toBeUndefined();
    expect(processed.paths["/another"]).toBeDefined();
  });

  it("removes paths based on shouldRemove callback", () => {
    const processed = removePaths({
      shouldRemove: ({ path }) => path.startsWith("/remove"),
    })(baseDoc);

    expect(processed.paths["/remove-me"]).toBeUndefined();
    expect(processed.paths["/example"]).toBeDefined();
    expect(processed.paths["/another"]).toBeDefined();
  });

  it("removes methods based on shouldRemove callback", () => {
    const processed = removePaths({
      shouldRemove: ({ method }) => method === "post",
    })(baseDoc);

    expect(processed.paths["/example"].post).toBeUndefined();
    expect(processed.paths["/example"].get).toBeDefined();
    expect(processed.paths["/remove-me"]).toBeDefined();
  });

  it("removes both paths and methods based on shouldRemove callback", () => {
    const processed = removePaths({
      shouldRemove: ({ path, method }) =>
        path.startsWith("/remove") || method === "post",
    })(baseDoc);

    expect(processed.paths["/remove-me"]).toBeUndefined();
    expect(processed.paths["/example"].post).toBeUndefined();
    expect(processed.paths["/example"].get).toBeDefined();
    expect(processed.paths["/another"]).toBeDefined();
  });

  it("does nothing if shouldRemove always returns false", () => {
    const processed = removePaths({
      shouldRemove: () => false,
    })(baseDoc);

    expect(processed).toEqual(baseDoc);
  });

  it("removes everything if shouldRemove always returns true", () => {
    const processed = removePaths({
      shouldRemove: () => true,
    })(baseDoc);

    expect(processed.paths).toEqual({});
  });

  it("removes entire paths via shouldRemove callback", () => {
    const processed = removePaths({
      shouldRemove: ({ path, method }) =>
        method === true && path === "/remove-me",
    })(baseDoc);

    expect(processed.paths["/remove-me"]).toBeUndefined();
    expect(processed.paths["/example"]).toBeDefined();
    expect(processed.paths["/another"]).toBeDefined();
  });

  it("removes specific methods while keeping paths", () => {
    const processed = removePaths({
      shouldRemove: ({ method }) => method === "delete",
    })(baseDoc);

    expect(processed.paths["/remove-me"]).toBeDefined();
    expect(processed.paths["/remove-me"].delete).toBeUndefined();
  });
});
