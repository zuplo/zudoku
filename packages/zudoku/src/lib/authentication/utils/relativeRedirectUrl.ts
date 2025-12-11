import { joinUrl } from "../../util/joinUrl.js";

export const getRelativeRedirectUrl = (redirectTo?: string | null) => {
  if (!redirectTo) {
    return "/";
  }

  return redirectTo.replace(
    joinUrl(window.location.origin, import.meta.env.BASE_URL),
    "",
  );
};
