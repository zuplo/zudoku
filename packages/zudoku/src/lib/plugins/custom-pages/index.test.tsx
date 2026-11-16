import { expect, it } from "vitest";
import { customPagesPlugin } from "./index.js";

it("resolves a lazy custom page to its default export", async () => {
  const Page = () => null;
  const [route] =
    customPagesPlugin([
      {
        type: "custom-page",
        path: "/lazy",
        lazy: () => Promise.resolve({ default: Page }),
      },
    ]).getRoutes?.() ?? [];

  const lazy = route?.lazy;
  if (typeof lazy !== "function") throw new Error("Expected a lazy route");

  expect(route?.path).toBe("/lazy");
  expect(route?.element).toBeUndefined();
  expect(await lazy()).toEqual({ Component: Page });
});
