import type { PropsWithChildren } from "react";
import { renderToReadableStream } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ZudokuPlugin } from "../core/plugins.js";
import { StaticZudoku } from "../testing/index.js";
import { useZudoku } from "./context/ZudokuContext.js";

const renderToHtml = async (plugins: ZudokuPlugin[]) => {
  const stream = await renderToReadableStream(
    <StaticZudoku
      path="/bridge"
      site={{ title: "Cosmo Cargo" }}
      plugins={plugins}
    />,
  );
  await stream.allReady;
  return new Response(stream).text();
};

const pages: ZudokuPlugin = {
  getRoutes: () => [
    {
      path: "/bridge",
      element: <main>Bridge</main>,
      handle: { layout: "none" },
    },
  ],
};

describe("plugin providers (SSR)", () => {
  it("renders providers with Zudoku's context after plugins are initialized", async () => {
    let client: string | undefined;
    const ProviderWithContext = ({ children }: PropsWithChildren) => {
      const { options } = useZudoku();
      return (
        <section
          data-title={options.site?.title}
          data-client={client ?? "missing"}
        >
          {children}
        </section>
      );
    };

    const html = await renderToHtml([
      {
        initialize: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          client = "quantum-client";
        },
        Provider: ProviderWithContext,
      },
      pages,
    ]);

    expect(html).toContain(
      '<section data-title="Cosmo Cargo" data-client="quantum-client"><main>Bridge</main></section>',
    );
  });
});
