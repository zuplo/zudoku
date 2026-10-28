/**
 * @vitest-environment happy-dom
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { expect, it } from "vitest";
import { ZudokuContext } from "../core/ZudokuContext.js";
import { SlotProvider } from "./context/SlotProvider.js";
import { ZudokuProvider } from "./context/ZudokuProvider.js";
import { Footer } from "./Footer.js";

it("renders intrinsic dimensions for the footer logo", () => {
  const queryClient = new QueryClient();
  const context = new ZudokuContext(
    {
      site: {
        footer: {
          logo: {
            src: { light: "/logo-light.svg", dark: "/logo-dark.svg" },
            alt: "Test logo",
            width: 120,
            height: 24,
          },
        },
      },
    },
    queryClient,
    {},
  );

  render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <ZudokuProvider context={context}>
          <SlotProvider>
            <Footer />
          </SlotProvider>
        </ZudokuProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );

  const logos = screen.getAllByRole("img", { name: "Test logo" });
  expect(logos).toHaveLength(2);
  for (const logo of logos) {
    expect(logo).toHaveAttribute("width", "120");
    expect(logo).toHaveAttribute("height", "24");
  }
});
