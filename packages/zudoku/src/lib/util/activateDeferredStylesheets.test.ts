// @vitest-environment happy-dom
import { beforeEach, expect, it, vi } from "vitest";
import { activateDeferredStylesheets } from "./activateDeferredStylesheets.js";

const frameCallbacks: FrameRequestCallback[] = [];

beforeEach(() => {
  document.head.innerHTML = `
    <link
      rel="preload"
      as="style"
      href="data:text/css,body{}"
      data-zudoku-deferred-stylesheet
    >
  `;
  frameCallbacks.length = 0;
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    frameCallbacks.push(callback);
    return frameCallbacks.length;
  });
});

it("activates a preloaded stylesheet after the first paint", async () => {
  const activated = activateDeferredStylesheets();
  let settled = false;
  void activated.then(() => {
    settled = true;
  });
  const link = document.querySelector("link");

  expect(link).toHaveAttribute("rel", "preload");
  expect(frameCallbacks).toHaveLength(1);
  await Promise.resolve();
  expect(settled).toBe(false);

  frameCallbacks.shift()?.(0);
  expect(link).toHaveAttribute("rel", "preload");
  expect(frameCallbacks).toHaveLength(1);
  await Promise.resolve();
  expect(settled).toBe(false);

  frameCallbacks.shift()?.(16);
  expect(link).toHaveAttribute("rel", "stylesheet");
  expect(link).toHaveAttribute("as", "style");
  expect(link).not.toHaveAttribute("data-zudoku-deferred-stylesheet");
  await expect(activated).resolves.toBeUndefined();
  expect(settled).toBe(true);
});

it("resolves immediately when there are no deferred stylesheets", async () => {
  document.head.innerHTML = "";

  await expect(activateDeferredStylesheets()).resolves.toBeUndefined();
  expect(frameCallbacks).toHaveLength(0);
});

it("activates immediately in a hidden document where frames may be suspended", async () => {
  const visibility = vi
    .spyOn(document, "visibilityState", "get")
    .mockReturnValue("hidden");

  await expect(activateDeferredStylesheets()).resolves.toBeUndefined();

  expect(document.querySelector("link")).toHaveAttribute("rel", "stylesheet");
  expect(frameCallbacks).toHaveLength(0);
  visibility.mockRestore();
});

it("uses a bounded fallback when animation frames do not run", async () => {
  vi.useFakeTimers();
  const activated = activateDeferredStylesheets();

  await vi.advanceTimersByTimeAsync(250);

  await expect(activated).resolves.toBeUndefined();
  expect(document.querySelector("link")).toHaveAttribute("rel", "stylesheet");
  vi.useRealTimers();
});
