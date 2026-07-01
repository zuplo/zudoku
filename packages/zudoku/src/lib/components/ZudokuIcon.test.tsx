// @vitest-environment happy-dom
import { addIcon } from "@iconify/react";
import { render } from "@testing-library/react";
import type { LucideIcon } from "lucide-react";
import { afterEach, describe, expect, it } from "vitest";
import { configureIconRuntimeFetch, Icon } from "./ZudokuIcon.js";

afterEach(() => {
  // Reset the runtime-fetch override so tests don't leak into each other.
  configureIconRuntimeFetch(undefined);
});

describe("Icon", () => {
  it("renders a legacy component icon directly", () => {
    const Stub = (() => <span data-testid="legacy" />) as unknown as LucideIcon;
    const { getByTestId } = render(<Icon icon={Stub} />);
    expect(getByTestId("legacy")).toBeInTheDocument();
  });

  it("renders a registered string icon as inline svg", () => {
    addIcon("lucide:zudoku-test-icon", {
      width: 24,
      height: 24,
      body: '<path d="M3 3h18"/>',
    });

    const { container } = render(<Icon icon="lucide:zudoku-test-icon" />);

    expect(container.querySelector("svg")).toBeTruthy();
    expect(container.innerHTML).toContain("M3 3h18");
  });

  it("mirrors a single explicit dimension so the icon stays square", () => {
    addIcon("lucide:zudoku-square-icon", {
      width: 24,
      height: 24,
      body: '<path d="M3 3h18"/>',
    });

    const { container } = render(
      <Icon icon="lucide:zudoku-square-icon" width={42} />,
    );
    const svg = container.querySelector("svg");

    expect(svg?.getAttribute("width")).toBe("42");
    expect(svg?.getAttribute("height")).toBe("42");
  });

  it("falls back to MissingIcon for an unresolved icon when runtime fetch is off", () => {
    configureIconRuntimeFetch(false);

    const { container } = render(<Icon icon="lucide:never-registered-icon" />);

    // MissingIcon renders a red-tinted trigger; the registered-icon path never does.
    expect(container.querySelector(".text-red-500")).toBeTruthy();
    expect(container.innerHTML).not.toContain("M3 3h18");
  });

  it("does not fall back to MissingIcon for an unresolved icon when runtime fetch is on", () => {
    // The prod opt-in (`icons.runtimeFetch: true`): unregistered icons go to the
    // iconify fetch path, not the MissingIcon fallback.
    configureIconRuntimeFetch(true);

    const { container } = render(
      <Icon icon="lucide:never-registered-runtime-icon" />,
    );

    expect(container.querySelector(".text-red-500")).toBeFalsy();
  });
});
