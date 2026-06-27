import { fireEvent, render, screen } from "@testing-library/react";
import { isValidElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ZudokuConfig } from "zudoku";
import {
  isTransformConfigPlugin,
  runPluginTransformConfig,
} from "zudoku/plugins";
import { AskAiTrigger } from "./AskAiTrigger.js";
import { zudokuAiPlugin } from "./index.js";
import {
  getZuploDeploymentUrl,
  isLocalhostHostname,
  resolveDocsContext,
} from "./site.js";
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

describe("isLocalhostHostname", () => {
  it("detects local dev hostnames", () => {
    for (const hostname of [
      "localhost",
      "127.0.0.1",
      "0.0.0.0",
      "::1",
      "[::1]",
      "my-app.local",
    ]) {
      expect(isLocalhostHostname(hostname)).toBe(true);
    }
  });

  it("treats public hostnames as available", () => {
    for (const hostname of ["docs.example.com", "zudoku.dev", "example.org"]) {
      expect(isLocalhostHostname(hostname)).toBe(false);
    }
  });
});

describe("resolveDocsContext", () => {
  it("uses a deployment URL even on localhost", () => {
    // happy-dom serves from localhost, yet the deployment URL wins.
    const ctx = resolveDocsContext("/", "https://portal.example.dev");
    expect(ctx).toEqual({
      docs: "https://portal.example.dev",
      isUnavailable: false,
    });
  });

  it("is unavailable on localhost without a deployment URL", () => {
    const ctx = resolveDocsContext("/");
    expect(ctx.isUnavailable).toBe(true);
    expect(ctx.docs).toBe("");
  });
});

describe("getZuploDeploymentUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns undefined outside of Zuplo projects", () => {
    expect(getZuploDeploymentUrl()).toBeUndefined();
  });

  it("reads the dev portal URL from ZUPLO_BUILD_CONFIG urls.devPortal", () => {
    // Core sends a DeploymentUrlConfig ({ api, devPortal }); the dev portal URL
    // is the deployed Zudoku site, while `api` is the gateway URL.
    vi.stubEnv(
      "ZUPLO_BUILD_CONFIG",
      JSON.stringify({
        urls: {
          api: { defaultUrl: "https://gateway.zuplo.dev", urls: [] },
          devPortal: { defaultUrl: "https://portal.zuplo.dev", urls: [] },
        },
      }),
    );
    expect(getZuploDeploymentUrl()).toBe("https://portal.zuplo.dev");
  });

  it("ignores a top-level deploymentUrl that core never sends", () => {
    vi.stubEnv(
      "ZUPLO_BUILD_CONFIG",
      JSON.stringify({ deploymentUrl: "https://portal.zuplo.dev" }),
    );
    expect(getZuploDeploymentUrl()).toBeUndefined();
  });
});
