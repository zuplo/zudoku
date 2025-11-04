export {
  MermaidInitializer,
  type MermaidInitializerProps,
} from "./MermaidInitializer.js";

export type MermaidRenderingStrategy =
  | "pre-mermaid" // Client-side rendering (default, no Playwright needed)
  | "inline-svg" // Server-side SVG inline (requires Playwright)
  | "img-svg" // Server-side SVG as image (requires Playwright)
  | "img-png"; // Server-side PNG as image (requires Playwright)

export interface MermaidOptions {
  strategy?: MermaidRenderingStrategy;

  mermaidConfig?: Record<string, unknown>;

  /**
   * Custom CSS for the Mermaid container
   */
  css?: string;

  /**
   * Additional options to pass to rehype-mermaidjs
   */
  // biome-ignore lint/suspicious/noExplicitAny: Allow any type for plugin options
  pluginOptions?: Record<string, any>;
}

export const mermaidRehypePlugin = async (
  options: MermaidOptions = {},
): Promise<[unknown, unknown]> => {
  const {
    strategy = "pre-mermaid",
    mermaidConfig = {},
    css,
    pluginOptions = {},
  } = options;

  // For client-side rendering (pre-mermaid), use our lightweight plugin
  // This avoids loading rehype-mermaid which has heavyweight dependencies (playwright)
  if (strategy === "pre-mermaid") {
    const { default: rehypeMermaidClient } = await import(
      "./rehype-mermaid-client.js"
    );
    return [rehypeMermaidClient, { className: "mermaid", ...pluginOptions }];
  }

  // For server-side rendering strategies, dynamically load rehype-mermaid
  // User must install: npm install rehype-mermaid playwright
  // We import from a separate file to avoid Vite's static analysis
  const { loadRehypeMermaid } = await import("./rehype-mermaid-server.js");
  const rehypeMermaid = await loadRehypeMermaid();

  const config = {
    strategy,
    mermaidConfig,
    css,
    ...pluginOptions,
  };

  return [rehypeMermaid, config];
};

/**
 * Helper to check if a rendering strategy requires Playwright
 */
export const requiresPlaywright = (
  strategy?: MermaidRenderingStrategy,
): boolean => {
  return strategy !== undefined && strategy !== "pre-mermaid";
};

/**
 * Preset configurations for common use cases
 */
export const MermaidPresets = {
  /**
   * Client-side rendering - lightweight, no build-time dependencies
   * Diagrams are rendered in the browser using mermaid.js
   */
  clientSide: (): Promise<[unknown, unknown]> =>
    mermaidRehypePlugin({ strategy: "pre-mermaid" }),

  /**
   * Server-side SVG - pre-rendered diagrams, requires Playwright
   * Diagrams are rendered at build time as inline SVG
   */
  serverSideInlineSvg: (): Promise<[unknown, unknown]> =>
    mermaidRehypePlugin({ strategy: "inline-svg" }),

  /**
   * Server-side SVG images - pre-rendered diagrams, requires Playwright
   * Diagrams are rendered at build time as SVG image elements
   */
  serverSideSvgImage: (): Promise<[unknown, unknown]> =>
    mermaidRehypePlugin({ strategy: "img-svg" }),

  /**
   * Server-side PNG images - pre-rendered diagrams, requires Playwright
   * Diagrams are rendered at build time as PNG image elements
   */
  serverSidePngImage: (): Promise<[unknown, unknown]> =>
    mermaidRehypePlugin({ strategy: "img-png" }),

  /**
   * Dark mode optimized client-side rendering
   */
  clientSideDark: (): Promise<[unknown, unknown]> =>
    mermaidRehypePlugin({
      strategy: "pre-mermaid",
      mermaidConfig: { theme: "dark" },
    }),
} as const;
