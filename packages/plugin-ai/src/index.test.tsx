import { fireEvent, render, screen } from "@testing-library/react";
import { isValidElement } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import type { ZudokuConfig } from "zudoku";
import {
  isTransformConfigPlugin,
  runPluginTransformConfig,
} from "zudoku/plugins";
import { AskAiTrigger } from "./AskAiTrigger.js";
import { zudokuAiPlugin } from "./index.js";
import { askAiStore } from "./store.js";
import type { ZudokuAiPluginOptions } from "./types.js";

const transform = (options: ZudokuAiPluginOptions = {}) => {
  const config: ZudokuConfig = { plugins: [zudokuAiPlugin(options)] };
  return runPluginTransformConfig(config);
};

beforeEach(() => {
  askAiStore.close();
});

describe("zudokuAiPlugin", () => {
  it("is a transform-config plugin", () => {
    expect(isTransformConfigPlugin(zudokuAiPlugin())).toBe(true);
  });

  it("injects the trigger and the panel root into slots", async () => {
    const config = await transform();

    expect(isValidElement(config.slots?.["head-navigation-end"])).toBe(true);
    expect(isValidElement(config.slots?.["layout-after-head"])).toBe(true);
  });

  it("renders the trigger at a custom position", async () => {
    const config = await transform({ position: "head-navigation-start" });

    expect(isValidElement(config.slots?.["head-navigation-start"])).toBe(true);
    expect(config.slots?.["head-navigation-end"]).toBeUndefined();
  });

  it("renders an Ask AI button that toggles the store", () => {
    render(<AskAiTrigger label="Ask AI" />);
    const button = screen.getByRole("button", { name: "Ask AI" });

    expect(askAiStore.getState()).toBe(false);
    fireEvent.click(button);
    expect(askAiStore.getState()).toBe(true);
    fireEvent.click(button);
    expect(askAiStore.getState()).toBe(false);
  });
});
