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

it("activates a preloaded stylesheet after the first paint", () => {
  activateDeferredStylesheets();
  const link = document.querySelector("link");

  expect(link).toHaveAttribute("rel", "preload");
  expect(frameCallbacks).toHaveLength(1);

  frameCallbacks.shift()?.(0);
  expect(link).toHaveAttribute("rel", "preload");
  expect(frameCallbacks).toHaveLength(1);

  frameCallbacks.shift()?.(16);
  expect(link).toHaveAttribute("rel", "stylesheet");
  expect(link).toHaveAttribute("as", "style");
  expect(link).not.toHaveAttribute("data-zudoku-deferred-stylesheet");
});
