/**
 * Public helpers for using Zuplo-specific values inside your Zudoku config.
 *
 * @example
 * ```ts
 * import { Gateway } from "zudoku/zuplo";
 *
 * export default {
 *   apis: {
 *     type: "url",
 *     input: `${Gateway.URL}/openapi.json`,
 *   },
 * } satisfies ZudokuConfig;
 * ```
 */

/**
 * Information about the Zuplo gateway that serves your developer portal.
 */
export const Gateway = {
  /**
   * The public URL of the Zuplo gateway (e.g.
   * `https://my-project-main-abc123.zuplo.app`).
   *
   * The value is injected at build time from the `ZUPLO_SERVER_URL`
   * environment variable, so it is available both during server-side
   * rendering and in the browser bundle.
   *
   * Outside of a Zuplo build (for example, when running `zudoku dev`
   * locally) this is `undefined`.
   */
  get URL(): string | undefined {
    return process.env.ZUPLO_SERVER_URL;
  },
};
