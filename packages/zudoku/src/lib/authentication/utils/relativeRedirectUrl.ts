import { joinUrl } from "../../util/joinUrl.js";

export const getRelativeRedirectUrl = (redirectTo?: string | null) => {
  if (!redirectTo) {
    return "/";
  }

  if (typeof window === "undefined") {
    return redirectTo;
  }

  return redirectTo.replace(
    joinUrl(window.location.origin, import.meta.env.BASE_URL),
    "",
  );
};
