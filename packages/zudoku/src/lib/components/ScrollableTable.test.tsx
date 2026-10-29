/**
 * @vitest-environment happy-dom
 */

import { act, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ScrollableTable } from "./ScrollableTable.js";

let notifyResize = () => {};

class MockResizeObserver {
  constructor(callback: () => void) {
    notifyResize = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("ResizeObserver", MockResizeObserver);

const renderTable = ({
  scrollWidth,
  clientWidth,
}: {
  scrollWidth: number;
  clientWidth: number;
}) => {
  const { container } = render(
    <ScrollableTable>
      <tbody>
        <tr>
          <td>cell</td>
        </tr>
      </tbody>
    </ScrollableTable>,
  );
  const wrapper = container.querySelector("div");
  if (!wrapper) throw new Error("Table wrapper was not rendered");
  Object.defineProperties(wrapper, {
    scrollWidth: { value: scrollWidth },
    clientWidth: { value: clientWidth },
  });
  act(() => notifyResize());
  return wrapper;
};

describe("ScrollableTable", () => {
  it("makes an overflowing table focusable so keyboard users can scroll it", () => {
    const wrapper = renderTable({ scrollWidth: 1200, clientWidth: 600 });

    expect(wrapper.getAttribute("tabindex")).toBe("0");
    expect(wrapper.querySelector("table")).not.toBeNull();
  });

  it("adds no tab stop when the table fits", () => {
    const wrapper = renderTable({ scrollWidth: 600, clientWidth: 600 });

    expect(wrapper.hasAttribute("tabindex")).toBe(false);
  });
});
