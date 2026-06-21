import { describe, expect, it } from "vitest";
import { IconRegistry } from "./icon-registry.js";

describe("IconRegistry", () => {
  it("emits one side-effect import per icon", () => {
    const registry = new IconRegistry();
    registry.add("home").add("ph:acorn-duotone");

    expect(registry.toImports()).toBe(
      [
        `import "virtual:zudoku-icon/lucide/home";`,
        `import "virtual:zudoku-icon/ph/acorn-duotone";`,
      ].join("\n"),
    );
  });

  it("normalizes bare and prefixed lucide names to a single import", () => {
    const registry = new IconRegistry();
    registry.add("home").add("lucide:home");

    expect(registry.size).toBe(1);
    expect(registry.toImports()).toBe(
      `import "virtual:zudoku-icon/lucide/home";`,
    );
  });

  it("seeds from an iterable", () => {
    const registry = new IconRegistry(["lucide:zap", "zap"]);

    expect(registry.size).toBe(1);
    expect(registry.toImports()).toBe(
      `import "virtual:zudoku-icon/lucide/zap";`,
    );
  });

  it("is empty by default", () => {
    const registry = new IconRegistry();

    expect(registry.size).toBe(0);
    expect(registry.toImports()).toBe("");
  });
});
