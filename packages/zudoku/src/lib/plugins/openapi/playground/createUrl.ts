import type { PlaygroundForm } from "./Playground.js";

export const createUrl = (host: string, path: string, data: PlaygroundForm) => {
  const filledPath = path.replace(/(:\w+|\{\w+})/g, (match) => {
    const key = match.replace(/[:{}]/g, "");
    const value = data.pathParams.find((part) => part.name === key)?.value;

    return value ?? match;
  });

  // Ensure host ends with a slash and path doesn't start with one,
  // so they form a correct URL, without overriding the host's path.
  const url = new URL(
    filledPath.replace(/^\//, ""),
    host.endsWith("/") ? host : `${host}/`,
  );

  data.queryParams
    .filter((param) => param.active)
    .forEach((param) => {
      url.searchParams.set(param.name, param.value);
    });

  return url;
};
