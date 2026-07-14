import { describe, expect, it } from "vitest";
import { ZudokuError } from "zudoku/components";
import { resolveDeploymentName } from "./deploymentName.js";

describe("resolveDeploymentName", () => {
  it("returns the deployment name when set", () => {
    expect(resolveDeploymentName("my-deployment")).toBe("my-deployment");
  });

  it("throws a ZudokuError guiding the user to run `zuplo link`", () => {
    try {
      resolveDeploymentName(undefined);
      expect.unreachable("expected resolveDeploymentName to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ZudokuError);
      const zudokuError = error as ZudokuError;
      expect(zudokuError.title).toBe("Not linked to a Zuplo deployment");
      expect(zudokuError.developerHint).toContain("zuplo link");
    }
  });

  it("throws when the deployment name is an empty string", () => {
    expect(() => resolveDeploymentName("")).toThrow(ZudokuError);
  });

  it("throws when the deployment name is only whitespace", () => {
    expect(() => resolveDeploymentName("   ")).toThrow(ZudokuError);
  });

  it("trims surrounding whitespace from the deployment name", () => {
    expect(resolveDeploymentName("  my-deployment  ")).toBe("my-deployment");
  });
});
