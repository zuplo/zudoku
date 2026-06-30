import { fireEvent, render, screen } from "@testing-library/react";
import type { UIMessage } from "ai";
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
  getAssistantBlocks,
  isSafeLinkUrl,
  prettifyUrl,
  toInternalPath,
} from "./messageBlocks.js";
import {
  getZuploDeploymentUrl,
  isLocalhostHostname,
  resolveDocsContext,
} from "./site.js";
import { askAiStore } from "./store.js";
import {
  DEFAULT_CHAT_API,
  resolveOptions,
  type ZudokuAiPluginOptions,
} from "./types.js";

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

describe("resolveOptions", () => {
  it("defaults the api to the production agent-z deployment", () => {
    expect(resolveOptions({}).api).toBe(DEFAULT_CHAT_API);
    expect(DEFAULT_CHAT_API).toBe(
      "https://agent-z.zuplo-exp.workers.dev/agent-z/zudoku-ai/chat",
    );
  });

  it("lets the api be overridden", () => {
    expect(resolveOptions({ api: "/api/chat" }).api).toBe("/api/chat");
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

const assistantMessage = (parts: unknown[]): UIMessage =>
  ({ id: "m1", role: "assistant", parts }) as unknown as UIMessage;

describe("getAssistantBlocks", () => {
  it("coalesces text and extracts a present-source link in order", () => {
    const blocks = getAssistantBlocks(
      assistantMessage([
        { type: "text", text: "Zudoku is great. " },
        { type: "text", text: "Really." },
        {
          type: "tool-present-source",
          toolCallId: "t1",
          state: "output-available",
          input: { url: "/docs/quickstart", title: "Quickstart" },
          output: { url: "/docs/quickstart", title: "Quickstart" },
        },
      ]),
    );

    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({
      kind: "text",
      text: "Zudoku is great. Really.",
    });
    expect(blocks[1]).toMatchObject({
      kind: "source",
      url: "/docs/quickstart",
      title: "Quickstart",
    });
  });

  it("handles a dynamic-tool present-link and ignores other tools", () => {
    const blocks = getAssistantBlocks(
      assistantMessage([
        {
          type: "dynamic-tool",
          toolName: "present-link",
          toolCallId: "t2",
          state: "input-available",
          input: { url: "https://x.test/pr", label: "Create pull request" },
        },
        {
          type: "dynamic-tool",
          toolName: "save-file",
          toolCallId: "t3",
          state: "input-available",
          input: { path: "config/routes.oas.json" },
        },
      ]),
    );

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      kind: "link",
      url: "https://x.test/pr",
      label: "Create pull request",
    });
  });

  it("skips tool parts that have no url yet", () => {
    const blocks = getAssistantBlocks(
      assistantMessage([
        {
          type: "tool-present-source",
          toolCallId: "t4",
          state: "input-streaming",
          input: {},
        },
      ]),
    );
    expect(blocks).toHaveLength(0);
  });

  it("drops links with an unsafe url scheme", () => {
    const blocks = getAssistantBlocks(
      assistantMessage([
        {
          type: "tool-present-source",
          toolCallId: "t5",
          state: "output-available",
          input: { url: "javascript:alert(1)", title: "Bad" },
        },
      ]),
    );
    expect(blocks).toHaveLength(0);
  });
});

describe("isSafeLinkUrl", () => {
  it("allows same-origin paths and http(s) urls", () => {
    expect(isSafeLinkUrl("/docs/quickstart")).toBe(true);
    expect(isSafeLinkUrl("https://docs.example.com/x")).toBe(true);
    expect(isSafeLinkUrl("http://example.com")).toBe(true);
  });

  it("rejects dangerous or protocol-relative urls", () => {
    expect(isSafeLinkUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeLinkUrl("data:text/html,<script>")).toBe(false);
    expect(isSafeLinkUrl("//evil.example.com")).toBe(false);
    expect(isSafeLinkUrl("/\\evil.example.com")).toBe(false);
  });
});

describe("toInternalPath / prettifyUrl", () => {
  it("treats relative paths as internal and cross-origin as external", () => {
    expect(toInternalPath("/docs/quickstart")).toBe("/docs/quickstart");
    expect(toInternalPath("https://other.example.com/docs/x")).toBeNull();
  });

  it("derives a readable label from a url", () => {
    expect(prettifyUrl("/docs/quickstart")).toBe("quickstart");
    expect(prettifyUrl("https://docs.example.com/guide/intro")).toBe("intro");
  });
});
