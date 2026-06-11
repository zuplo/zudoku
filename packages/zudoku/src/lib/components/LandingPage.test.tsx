/**
 * @vitest-environment happy-dom
 */

import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";
import { LandingPage, type LandingPageProps } from "./LandingPage.js";

const renderLandingPage = (props: LandingPageProps) => {
  const router = createMemoryRouter(
    [{ path: "/", element: <LandingPage {...props} /> }],
    { initialEntries: ["/"] },
  );
  return render(<RouterProvider router={router} />);
};

describe("LandingPage", () => {
  it("renders title, eyebrow, description, and features in the hero variant", () => {
    renderLandingPage({
      eyebrow: "Developer Platform",
      title: "Build with our API",
      description: "Everything you need",
      features: [{ title: "Fast integration", description: "Quick start" }],
    });

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Build with our API",
    );
    expect(screen.getByText("Developer Platform")).toBeDefined();
    expect(screen.getByText("Everything you need")).toBeDefined();
    expect(screen.getByText("Fast integration")).toBeDefined();
    expect(screen.getByText("Quick start")).toBeDefined();
  });

  it("renders internal actions as router links and external actions in a new tab", () => {
    renderLandingPage({
      title: "Title",
      actions: [
        { label: "Get started", href: "/getting-started" },
        { label: "GitHub", href: "https://github.com/zuplo/zudoku" },
      ],
    });

    const internal = screen.getByRole("link", { name: "Get started" });
    expect(internal.getAttribute("href")).toBe("/getting-started");
    expect(internal.getAttribute("target")).toBeNull();

    const external = screen.getByRole("link", { name: "GitHub" });
    expect(external.getAttribute("href")).toBe(
      "https://github.com/zuplo/zudoku",
    );
    expect(external.getAttribute("target")).toBe("_blank");
    expect(external.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("renders non-http schemes as plain links without opening a new tab", () => {
    renderLandingPage({
      title: "Title",
      actions: [{ label: "Email us", href: "mailto:support@example.com" }],
    });

    const link = screen.getByRole("link", { name: "Email us" });
    expect(link.getAttribute("href")).toBe("mailto:support@example.com");
    expect(link.getAttribute("target")).toBeNull();
    expect(link.getAttribute("rel")).toBeNull();
  });

  it("renders aside content in the split variant", () => {
    renderLandingPage({
      variant: "split",
      title: "Title",
      aside: <div>Code sample</div>,
    });

    expect(screen.getByText("Code sample")).toBeDefined();
  });

  it("renders features as clickable cards in the grid variant", () => {
    renderLandingPage({
      variant: "grid",
      title: "Docs",
      features: [
        { title: "Getting Started", href: "/getting-started" },
        { title: "Plain card" },
      ],
    });

    const card = screen.getByRole("link", { name: /Getting Started/ });
    expect(card.getAttribute("href")).toBe("/getting-started");
    expect(screen.getByText("Plain card")).toBeDefined();
    expect(screen.queryByRole("link", { name: /Plain card/ })).toBeNull();
  });

  it("renders children below the built-in sections", () => {
    renderLandingPage({
      title: "Title",
      children: <div>Custom section</div>,
    });

    expect(screen.getByText("Custom section")).toBeDefined();
  });
});
