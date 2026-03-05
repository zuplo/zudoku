import type { RouteObject } from "react-router";
import { describe, expect, it, vi } from "vitest";

/**
 * @vitest-environment happy-dom
 */

vi.mock("../lib/components/Layout.js", () => ({
  Layout: () => <div data-testid="layout" />,
}));

const { processRoutes } = await import("./processRoutes.js");

describe("processRoutes", () => {
  it("Can enable layout on child level", () => {
    const routes: RouteObject[] = [
      {
        handle: { layout: "none" },
        children: [
          {
            path: "/without",
            element: "Without layout",
          },
          {
            path: "/with",
            handle: { layout: "default" },
            element: "With layout",
          },
        ],
      },
    ];

    const result = processRoutes(routes);

    expect(result).toMatchInlineSnapshot(`
      [
        {
          "children": [
            {
              "element": "Without layout",
              "path": "/without",
            },
            {
              "children": [
                {
                  "element": "With layout",
                  "handle": {
                    "layout": "default",
                  },
                  "path": "/with",
                },
              ],
              "element": <Layout />,
            },
          ],
          "handle": {
            "layout": "none",
          },
        },
      ]
    `);
  });

  it("Should wrap parent with layout if layout is not disbaled", () => {
    const routes: RouteObject[] = [
      {
        element: "Parent with layout",
        children: [
          {
            path: "/without",
            element: "Without layout",
          },
          {
            path: "/with",
            handle: { layout: "default" },
            element: "With layout",
          },
        ],
      },
    ];

    expect(processRoutes(routes)).toMatchInlineSnapshot(`
      [
        {
          "children": [
            {
              "children": [
                {
                  "element": "Without layout",
                  "path": "/without",
                },
                {
                  "element": "With layout",
                  "handle": {
                    "layout": "default",
                  },
                  "path": "/with",
                },
              ],
              "element": "Parent with layout",
            },
          ],
          "element": <Layout />,
        },
      ]
    `);
  });
});
