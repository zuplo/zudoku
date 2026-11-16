// @vitest-environment happy-dom
import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { type PropsWithChildren, useEffect } from "react";
import { Link } from "react-router";
import { describe, expect, it, vi } from "vitest";
import type { ZudokuPlugin } from "../core/plugins.js";

// Zudoku.tsx keeps the client-side ZudokuContext in a module-level singleton,
// so load a fresh module graph per test to get a context for its own plugins.
const loadZudoku = async () => {
  vi.resetModules();
  const [{ StaticZudoku }, { useZudoku }] = await Promise.all([
    import("../testing/index.js"),
    import("./context/ZudokuContext.js"),
  ]);
  return { StaticZudoku, useZudoku };
};

const renderZudoku = async (
  plugins: ZudokuPlugin[],
  StaticZudoku?: Awaited<ReturnType<typeof loadZudoku>>["StaticZudoku"],
) => {
  const Component = StaticZudoku ?? (await loadZudoku()).StaticZudoku;
  await act(async () => {
    render(
      <Component
        path="/bridge"
        site={{ title: "Cosmo Cargo" }}
        plugins={plugins}
      />,
    );
  });
};

const pages: ZudokuPlugin = {
  getRoutes: () => [
    {
      path: "/bridge",
      element: <Link to="/engine-room">To the engine room</Link>,
      handle: { layout: "none" },
    },
    {
      path: "/engine-room",
      element: <div>Warp core online</div>,
      handle: { layout: "none" },
    },
  ],
};

const wrapperPlugin = (testId: string): ZudokuPlugin => ({
  Provider: ({ children }) => <div data-testid={testId}>{children}</div>,
});

describe("plugin providers", () => {
  it("wraps the app with providers nested in plugin order", async () => {
    await renderZudoku([wrapperPlugin("outer"), wrapperPlugin("inner"), pages]);

    const outer = await screen.findByTestId("outer");
    const inner = screen.getByTestId("inner");
    expect(outer).toContainElement(inner);
    expect(inner).toHaveTextContent("To the engine room");
  });

  it("lets providers use hooks and Zudoku's context", async () => {
    const { StaticZudoku, useZudoku } = await loadZudoku();
    const ContextProvider = ({ children }: PropsWithChildren) => {
      const { options } = useZudoku();
      return (
        <div data-testid="context-provider" data-title={options.site?.title}>
          {children}
        </div>
      );
    };

    await renderZudoku([{ Provider: ContextProvider }, pages], StaticZudoku);

    expect(await screen.findByTestId("context-provider")).toHaveAttribute(
      "data-title",
      "Cosmo Cargo",
    );
  });

  it("mounts providers after plugins are initialized", async () => {
    let client: string | undefined;
    const plugin: ZudokuPlugin = {
      initialize: async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        client = "quantum-client";
      },
      Provider: ({ children }) => (
        <div data-testid="client">
          {client ?? "missing"}
          {children}
        </div>
      ),
    };

    await renderZudoku([plugin, pages]);

    expect(await screen.findByTestId("client")).toHaveTextContent(
      "quantum-client",
    );
  });

  it("keeps provider state across navigations", async () => {
    let mounts = 0;
    const StatefulProvider = ({ children }: PropsWithChildren) => {
      useEffect(() => {
        mounts++;
      }, []);
      return children;
    };

    await renderZudoku([{ Provider: StatefulProvider }, pages]);
    await userEvent.click(await screen.findByText("To the engine room"));

    expect(await screen.findByText("Warp core online")).toBeInTheDocument();
    expect(mounts).toBe(1);
  });

  it("renders the app unchanged without provider plugins", async () => {
    await renderZudoku([pages]);

    expect(await screen.findByText("To the engine room")).toBeInTheDocument();
  });
});
