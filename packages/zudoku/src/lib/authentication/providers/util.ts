import type { NavigateFunction } from "react-router";

export const redirectToSignUpUrl = (
  url: string,
  navigate: NavigateFunction,
  replace = false,
) => {
  if (URL.canParse(url)) {
    window.location[replace ? "replace" : "assign"](url);
  } else {
    navigate(url, { replace });
  }
};

export const getClerkFrontendApi = (publishableKey: string) => {
  // Split by underscore and get the base64 encoded part (3rd segment)
  const parts = publishableKey.split("_");
  if (parts.length !== 3 || !parts[2]) {
    throw new Error("Invalid Clerk publishable key");
  }

  let decoded: string;
  try {
    decoded = atob(parts[2]);
  } catch {
    throw new Error("Failed to decode publishable key");
  }

  if (!decoded.endsWith("$")) {
    throw new Error("Invalid Clerk publishable key");
  }

  const frontendApi = decoded.slice(0, -1);

  if (frontendApi.includes("$") || !frontendApi.includes(".")) {
    throw new Error("Invalid Clerk publishable key");
  }

  return frontendApi;
};
