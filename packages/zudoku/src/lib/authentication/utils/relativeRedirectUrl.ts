import { joinUrl } from "../../util/joinUrl.js";

export const getRelativeRedirectUrl = (redirectTo?: string | null) => {
  if (!redirectTo) {
    return "/";
  }

  // Handle SSR where window is not available
  if (typeof window === "undefined") {
    return redirectTo;
  }

  return redirectTo.replace(
    joinUrl(window.location.origin, import.meta.env.BASE_URL),
    "",
  );
};
