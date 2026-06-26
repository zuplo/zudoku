/**
 * @vitest-environment happy-dom
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";
import type { SlotType } from "../../components/context/SlotProvider.js";
import { SlotProvider } from "../../components/context/SlotProvider.js";
import { Slot } from "../../components/Slot.js";
import { isTransformConfigPlugin } from "../../core/plugins.js";
import { runPluginTransformConfig } from "../../core/transform-config.js";
import { zudokuAiPlugin } from "./index.js";
import { useAskAiStore } from "./store.js";
import type { ZudokuAiPluginOptions } from "./types.js";

const transform = (
  options: ZudokuAiPluginOptions = {},
  config: { slots?: Record<string, React.ReactNode> } = {},
) =>
  runPluginTransformConfig({
    ...config,
    plugins: [zudokuAiPlugin(options)],
  });

const renderSlot = (
  slots: Record<string, SlotType> | undefined,
  name: string,
) =>
  render(
    <MemoryRouter>
      <SlotProvider slots={slots}>
        <Slot.Target name={name} />
      </SlotProvider>
    </MemoryRouter>,
  );

beforeEach(() => {
  useAskAiStore.setState({ isOpen: false });
});

describe("zudokuAiPlugin", () => {
  it("is a transform-config plugin", () => {
    expect(isTransformConfigPlugin(zudokuAiPlugin())).toBe(true);
  });

  it("injects the trigger and the panel root into slots", async () => {
    const config = await transform();

    expect(typeof config.slots?.["head-navigation-end"]).toBe("function");
    expect(typeof config.slots?.["layout-after-head"]).toBe("function");
  });

  it("renders an Ask AI button in the header slot", async () => {
    const config = await transform();
    renderSlot(config.slots, "head-navigation-end");

    expect(screen.getByRole("button", { name: "Ask AI" })).toBeInTheDocument();
  });

  it("uses a custom label and position", async () => {
    const config = await transform({
      label: "Chat with us",
      position: "head-navigation-start",
    });

    expect(typeof config.slots?.["head-navigation-start"]).toBe("function");
    expect(config.slots?.["head-navigation-end"]).toBeUndefined();

    renderSlot(config.slots, "head-navigation-start");
    expect(
      screen.getByRole("button", { name: "Chat with us" }),
    ).toBeInTheDocument();
  });

  it("preserves an existing slot at the same position", async () => {
    const config = await transform(
      {},
      { slots: { "head-navigation-end": <span>existing content</span> } },
    );
    renderSlot(config.slots, "head-navigation-end");

    expect(screen.getByText("existing content")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ask AI" })).toBeInTheDocument();
  });

  it("toggles the store when the trigger is clicked", async () => {
    const config = await transform();
    renderSlot(config.slots, "head-navigation-end");

    expect(useAskAiStore.getState().isOpen).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Ask AI" }));
    expect(useAskAiStore.getState().isOpen).toBe(true);
  });
});
