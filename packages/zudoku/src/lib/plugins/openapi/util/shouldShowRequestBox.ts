/**
 * Decides whether the request box (method and path, code snippet, language
 * selector, playground button and auth selector) is shown at the top of an
 * operation's sidecar.
 *
 * - `x-zudoku-request-box-enabled: true` shows it, even if the API sets
 *   `disableRequestBox`.
 * - Any other explicit value hides it, matching `x-zudoku-playground-enabled`.
 * - When unset (`undefined`), it falls back to the API's `disableRequestBox`.
 */
export const shouldShowRequestBox = (
  extensions: Record<string, unknown> | null | undefined,
  disableRequestBox: boolean | undefined,
) => {
  const enabled = extensions?.["x-zudoku-request-box-enabled"];
  if (enabled === undefined) return !disableRequestBox;
  return enabled === true;
};
