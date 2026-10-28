/**
 * Decides whether the API info (overview) page should be shown.
 *
 * - `true`/`false` explicitly force the page on or off.
 * - When unset (`undefined`), the page is only shown when the API has a
 *   description, since an info page without a description has little to show.
 */
export const shouldShowInfoPage = (
  showInfoPage: boolean | undefined,
  hasDescription: boolean,
) => {
  if (showInfoPage === true) return true;
  if (showInfoPage === false) return false;
  return hasDescription;
};
