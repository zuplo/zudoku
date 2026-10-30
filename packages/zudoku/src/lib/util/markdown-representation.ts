import { joinUrl } from "./joinUrl.js";
import { getMarkdownPathname } from "./markdown.js";

const encodePathSegment = (segment: string) => {
  try {
    return encodeURIComponent(decodeURIComponent(segment));
  } catch {
    return encodeURIComponent(segment);
  }
};

export const encodeDocumentationRoutePath = (routePath: string) => {
  const encodedPath = routePath
    .split("/")
    .filter(Boolean)
    .map(encodePathSegment)
    .join("/");
  return encodedPath ? `/${encodedPath}` : "/";
};

export const resolveDocumentationRoutePath = (
  requestUrl: string,
  basePath?: string,
): string | undefined => {
  const pathname = new URL(requestUrl, "http://localhost").pathname;
  const normalizedBasePath = encodeDocumentationRoutePath(joinUrl(basePath));

  if (
    normalizedBasePath !== "/" &&
    pathname !== normalizedBasePath &&
    !pathname.startsWith(`${normalizedBasePath}/`)
  ) {
    return;
  }

  const relativePath =
    normalizedBasePath === "/"
      ? pathname
      : pathname.slice(normalizedBasePath.length) || "/";

  return encodeDocumentationRoutePath(relativePath);
};

export const getMarkdownRepresentationPath = (
  routePath: string,
  basePath?: string,
) =>
  joinUrl(
    encodeDocumentationRoutePath(joinUrl(basePath)),
    `${getMarkdownPathname(encodeDocumentationRoutePath(routePath))}.md`,
  );

export const getMarkdownAlternateLink = (
  routePath: string,
  basePath?: string,
) =>
  `<${getMarkdownRepresentationPath(routePath, basePath)}>; rel="alternate"; type="text/markdown"`;

export const appendLinkHeader = (
  currentValue: string | number | readonly string[] | null | undefined,
  linkValue: string,
) => {
  const normalizedValue = Array.isArray(currentValue)
    ? currentValue.join(", ")
    : currentValue?.toString().trim();
  return normalizedValue ? `${normalizedValue}, ${linkValue}` : linkValue;
};

export const getMarkdownNotFound = ({
  basePath,
  includeLlmsTxt,
  markdownRoutePaths,
  sitemapOutDir,
}: {
  basePath?: string;
  includeLlmsTxt: boolean;
  markdownRoutePaths: readonly string[];
  sitemapOutDir?: string;
}) => {
  const encodedBasePath = encodeDocumentationRoutePath(joinUrl(basePath));
  const markdownEntryRoute = markdownRoutePaths.includes("/")
    ? "/"
    : markdownRoutePaths[0];
  const links = [
    `[Documentation home](${encodedBasePath})`,
    ...(markdownEntryRoute
      ? [
          `[Markdown documentation index](${getMarkdownRepresentationPath(markdownEntryRoute, basePath)})`,
        ]
      : []),
    ...(includeLlmsTxt
      ? [`[Agent documentation index](${joinUrl(encodedBasePath, "llms.txt")})`]
      : []),
    ...(sitemapOutDir !== undefined
      ? [
          `[Sitemap](${joinUrl(
            encodedBasePath,
            encodeDocumentationRoutePath(sitemapOutDir),
            "sitemap.xml",
          )})`,
        ]
      : []),
  ];

  return [
    "# Page not found",
    "",
    "The requested documentation page does not exist. Try one of these entry points:",
    "",
    ...links.map((link) => `- ${link}`),
    "",
  ].join("\n");
};
