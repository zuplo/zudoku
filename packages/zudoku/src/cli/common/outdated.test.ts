import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./xdg/lib.js", () => ({
  ZUDOKU_XDG_STATE_HOME: join(
    mkdtempSync(join(tmpdir(), "zudoku-outdated-")),
    "state",
  ),
}));

const { warnIfOutdatedVersion } = await import("./outdated.js");

describe("warnIfOutdatedVersion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("does not throw when external requests fail", async () => {
    vi.stubEnv("ZUDOKU_OVERRIDE_CI_TO_TEST", "1");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(
        new TypeError("fetch failed", {
          cause: new Error("getaddrinfo ENOTFOUND api.github.com"),
        }),
      ),
    );

    await expect(warnIfOutdatedVersion("0.0.1")).resolves.toBe(false);
  });
});
