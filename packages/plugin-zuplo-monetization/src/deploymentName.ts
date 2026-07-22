import { ZudokuError } from "zudoku/components";

/**
 * Resolves the Zuplo deployment name from the environment.
 *
 * `ZUPLO_PUBLIC_DEPLOYMENT_NAME` is populated by `zuplo link`, so a missing
 * value almost always means the project hasn't been linked yet (the common
 * case when running the docs locally). Throw a `ZudokuError` with actionable
 * guidance rather than a bare "not set" so the UI can surface the fix.
 */
export const resolveDeploymentName = (deploymentName?: string): string => {
  // Trim so a whitespace-only env value doesn't slip into request URLs
  // (e.g. `/v3/zudoku-metering/   /...`); treat blank as unset.
  const trimmed = deploymentName?.trim();

  if (!trimmed) {
    throw new ZudokuError(
      "This project is not linked to a Zuplo deployment, so the monetization plugin can't load pricing or subscriptions.",
      {
        title: "Not linked to a Zuplo deployment",
        developerHint:
          "Run `zuplo link` to connect this project to your Zuplo deployment. This sets the `ZUPLO_PUBLIC_DEPLOYMENT_NAME` environment variable that the monetization plugin needs.",
      },
    );
  }

  return trimmed;
};
