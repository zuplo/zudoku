// @vitest-environment happy-dom
import { MDXProvider } from "@mdx-js/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render } from "@testing-library/react";
import type { MDXComponents } from "mdx/types.js";
import { Suspense } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { ZudokuContext } from "../core/ZudokuContext.js";
import { ZudokuProvider } from "./context/ZudokuProvider.js";
import { Markdown } from "./Markdown.js";

vi.mock("../hooks/useHighlighter.js", () => ({
  useHighlighter: () => ({
    codeToHast: () => ({ type: "root", children: [] }),
    getLoadedLanguages: () => [],
  }),
}));

vi.mock("../shiki.js", () => ({
  createConfiguredShikiRehypePlugins: () => [],
}));

const renderMarkdown = async (
  content: string,
  mdxComponents: MDXComponents = {},
) => {
  const queryClient = new QueryClient();
  const context = new ZudokuContext({}, queryClient, {});

  const router = createMemoryRouter(
    [
      {
        path: "*",
        element: (
          <QueryClientProvider client={queryClient}>
            <ZudokuProvider context={context}>
              <MDXProvider components={mdxComponents}>
                <Suspense>
                  <Markdown content={content} />
                </Suspense>
              </MDXProvider>
            </ZudokuProvider>
          </QueryClientProvider>
        ),
      },
    ],
    { initialEntries: ["/"] },
  );

  const result = await act(async () =>
    render(<RouterProvider router={router} />),
  );
  return result;
};

describe("Markdown", () => {
  it("renders plain markdown", async () => {
    const { container } = await renderMarkdown("Hello **world**");

    expect(container.querySelector("strong")?.textContent).toBe("world");
  });

  it("renders custom PascalCase components from MDXProvider", async () => {
    const SpaceWarning = ({ children }: { children: string }) => (
      <div data-testid="space-warning">{children}</div>
    );

    const { container } = await renderMarkdown(
      "<SpaceWarning>Danger ahead</SpaceWarning>",
      { SpaceWarning },
    );

    const el = container.querySelector("[data-testid='space-warning']");
    expect(el).not.toBeNull();
    expect(el?.textContent).toBe("Danger ahead");
  });

  it("renders custom components with props", async () => {
    const Alert = ({ type, children }: { type: string; children: string }) => (
      <div data-testid="alert" data-type={type}>
        {children}
      </div>
    );

    const { container } = await renderMarkdown(
      '<Alert type="warning">Watch out</Alert>',
      { Alert },
    );

    const el = container.querySelector("[data-testid='alert']");
    expect(el).not.toBeNull();
    expect(el?.getAttribute("data-type")).toBe("warning");
    expect(el?.textContent).toBe("Watch out");
  });

  it("keeps native HTML tags that have no PascalCase component counterpart", async () => {
    const { container } = await renderMarkdown("<button>Native</button>", {});

    expect(container.querySelector("button")?.textContent).toBe("Native");
  });
});
