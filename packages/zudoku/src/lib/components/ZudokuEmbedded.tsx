import type { PropsWithChildren } from "react";
import { createBrowserRouter, createMemoryRouter } from "react-router";
import type { ZudokuConfig } from "../../config/config.js";
import { getRoutesFromConfig } from "../embedded/index.js";
import { openApiPlugin } from "../plugins/openapi/index.js";
import { Bootstrap } from "./Bootstrap.js";

export type OpenApiSource =
  | { type: "url"; url: string }
  | { type: "string"; content: string }
  | { type: "object"; spec: unknown };

export type ZudokuEmbeddedProps = {
  /**
   * OpenAPI specification source - can be a URL, raw string, or parsed JSON object
   */
  openApi: OpenApiSource;
  /**
   * Optional custom configuration to merge with the default config
   */
  config?: Partial<ZudokuConfig>;
  /**
   * Base path for the router (default: "/")
   */
  basePath?: string;
  /**
   * Whether to use memory router (for non-browser environments) or browser router (default: browser)
   */
  useMemoryRouter?: boolean;
  /**
   * Custom server URL to use for API requests (optional)
   */
  serverUrl?: string;
  /**
   * OpenAPI plugin options
   */
  options?: {
    examplesLanguage?: string;
    disablePlayground?: boolean;
    disableSidecar?: boolean;
    expandAllTags?: boolean;
    showInfoPage?: boolean;
    disableGeneratedExamples?: boolean;
  };
};

/**
 * ZudokuEmbedded - A React component for embedding Zudoku API documentation
 *
 * This component provides an easy way to embed Zudoku into your React application,
 * similar to how Swagger UI can be embedded. It handles all the necessary setup
 * including routing, configuration, and plugin initialization.
 *
 * @example
 * ```tsx
 * // Using a URL
 * <ZudokuEmbedded
 *   openApi={{ type: "url", url: "https://api.example.com/openapi.json" }}
 * />
 *
 * // Using a raw string
 * <ZudokuEmbedded
 *   openApi={{ type: "string", content: openapiYamlString }}
 * />
 *
 * // Using a parsed object
 * <ZudokuEmbedded
 *   openApi={{ type: "object", spec: openapiJsonObject }}
 * />
 *
 * // With custom configuration
 * <ZudokuEmbedded
 *   openApi={{ type: "url", url: "https://api.example.com/openapi.json" }}
 *   config={{
 *     site: { title: "My API Docs" },
 *     navigation: [{ type: "link", label: "API Reference", to: "/" }]
 *   }}
 *   options={{ disablePlayground: true }}
 * />
 * ```
 */
const ZudokuEmbedded = ({
  openApi,
  config: customConfig,
  basePath = "/",
  useMemoryRouter = false,
  serverUrl,
  options,
}: PropsWithChildren<ZudokuEmbeddedProps>) => {
  // Create the OpenAPI plugin based on the source type
  const openApiPluginInstance = (() => {
    switch (openApi.type) {
      case "url":
        return openApiPlugin({
          type: "url",
          input: openApi.url,
          path: basePath,
          server: serverUrl,
          options,
        });
      case "string":
        return openApiPlugin({
          type: "raw",
          input: openApi.content,
          path: basePath,
          server: serverUrl,
          options,
        });
      case "object":
        return openApiPlugin({
          type: "raw",
          input: JSON.stringify(openApi.spec),
          path: basePath,
          server: serverUrl,
          options,
        });
    }
  })();

  // Build the default config
  const defaultConfig: ZudokuConfig = {
    basePath,
    site: {
      title: "API Documentation",
    },
    navigation: [
      {
        type: "link",
        label: "API Reference",
        to: basePath,
      },
    ],
    plugins: [openApiPluginInstance],
  };

  // Merge custom config with defaults
  const mergedConfig: ZudokuConfig = {
    ...defaultConfig,
    ...customConfig,
    site: {
      ...defaultConfig.site,
      ...customConfig?.site,
    },
    plugins: [
      ...(defaultConfig.plugins ?? []),
      ...(customConfig?.plugins ?? []),
    ],
  };

  // Generate routes from the config
  const routes = getRoutesFromConfig(mergedConfig, false);

  // Create the appropriate router
  const router = useMemoryRouter
    ? createMemoryRouter(routes, { initialEntries: [basePath] })
    : createBrowserRouter(routes, { basename: basePath });

  return <Bootstrap router={router} />;
};

ZudokuEmbedded.displayName = "ZudokuEmbedded";

export { ZudokuEmbedded };
